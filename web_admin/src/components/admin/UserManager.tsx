import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search, MapPin, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { userApi, chwApi, type Role, type User } from "@/lib/api";
import { Card, Button, Badge } from "./ui";
import { Modal, ConfirmDialog, FormField, inputClass } from "./Modal";

export function UserManager({ role }: { role: Extract<Role, "CHW" | "PARENT"> }) {
  const qc = useQueryClient();
  const key = ["users", role];
  const users = useQuery({ queryKey: key, queryFn: () => userApi.listByRole(role) });
  const chws = useQuery({
    queryKey: ["users", "CHW"],
    queryFn: () => userApi.listByRole("CHW"),
    enabled: role === "PARENT",
  });

  const [modal, setModal] = useState<{ open: boolean; editing?: User }>({ open: false });
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  const saveMut = useMutation<User | { chw: CHW; temporaryPassword: string }, Error, Partial<User>>({
    mutationFn: (data: Partial<User>) =>
      modal.editing
        ? userApi.update(modal.editing.id, data)
        : role === "CHW"
        ? chwApi.create(data as any)
        : userApi.createParent({ ...data, role } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(modal.editing ? "User updated" : "User created");
      setModal({ open: false });
    },
  });

  const delMut = useMutation({
    mutationFn: (id: number) => userApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("User deleted");
      setToDelete(null);
    },
  });

  const filtered = (users.data ?? []).filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  const roleLabel = role === "CHW" ? "Health Worker" : "Parent";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg border bg-card w-full sm:w-80">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${roleLabel.toLowerCase()}s…`}
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
        <Button onClick={() => setModal({ open: true })}>
          <Plus className="size-4" /> Add {roleLabel}
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Location</th>
                {role === "PARENT" && (
                  <th className="px-5 py-3 font-medium">Assigned CHW</th>
                )}
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => {
                const assignedChw =
                  role === "PARENT"
                    ? chws.data?.find((c) => c.id === u.assignedCHWId)
                    : undefined;
                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div className="font-medium">{u.name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="size-3" /> {u.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="size-3" /> {u.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.district ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {[u.sector, u.district, u.province].filter(Boolean).join(", ")}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    {role === "PARENT" && (
                      <td className="px-5 py-3.5">
                        {assignedChw ? (
                          <Badge tone="primary">{assignedChw.name}</Badge>
                        ) : (
                          <Badge>Unassigned</Badge>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={() => setModal({ open: true, editing: u })}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          onClick={() => setToDelete(u)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={role === "PARENT" ? 6 : 5} className="px-5 py-10 text-center text-muted-foreground">
                    No {roleLabel.toLowerCase()}s found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <UserModal
        key={modal.editing?.id ?? "new"}
        open={modal.open}
        editing={modal.editing}
        role={role}
        chws={chws.data ?? []}
        saving={saveMut.isPending}
        onClose={() => setModal({ open: false })}
        onSave={(data) => saveMut.mutate(data)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && delMut.mutate(toDelete.id)}
        title={`Delete ${roleLabel.toLowerCase()}?`}
        description={`This will permanently remove ${toDelete?.name}'s account.`}
      />
    </div>
  );
}

function UserModal({
  open,
  editing,
  role,
  chws,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing?: User;
  role: Role;
  chws: User[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
}) {
  const [form, setForm] = useState<Partial<User>>(editing ?? {});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const label = role === "CHW" ? "Health Worker" : "Parent";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${label}` : `Add ${label}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full name">
            <input
              required
              className={inputClass}
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Phone">
            <input
              required
              className={inputClass}
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+250 7…"
            />
          </FormField>
        </div>
        <FormField label="Email">
          <input
            required
            type="email"
            className={inputClass}
            value={form.email ?? ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Province">
            <input
              className={inputClass}
              value={form.province ?? ""}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
          </FormField>
          <FormField label="District">
            <input
              className={inputClass}
              value={form.district ?? ""}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </FormField>
          <FormField label="Sector">
            <input
              className={inputClass}
              value={form.sector ?? ""}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
          </FormField>
          <FormField label="Cell">
            <input
              className={inputClass}
              value={form.cell ?? ""}
              onChange={(e) => setForm({ ...form, cell: e.target.value })}
            />
          </FormField>
        </div>

        {role === "PARENT" && (
          <FormField label="Assigned CHW">
            <select
              className={inputClass}
              value={form.assignedCHWId ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  assignedCHWId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">— Unassigned —</option>
              {chws.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.district}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {!editing && (
          <FormField label="Temporary password">
            <input
              type="text"
              className={inputClass}
              placeholder="User will be asked to reset on first login"
              onChange={() => {}}
            />
          </FormField>
        )}
      </form>
    </Modal>
  );
}
