import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus, Pencil, Trash2, Search, MapPin, Phone,
  Mail, AlertCircle, UserCheck, UserX,
} from "lucide-react";
import { toast } from "sonner";
import { userApi, chwApi, type User, type CHW } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, Button, Badge } from "@/components/admin/ui";
import { Modal, ConfirmDialog, FormField, inputClass } from "@/components/admin/Modal";
import { LocationPicker, type LocationValue } from "@/components/admin/LocationPicker";

export const Route = createFileRoute("/_admin/parents")({ component: ParentsPage });

// ── Page ──────────────────────────────────────────────────────────────────────

function ParentsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isNurse = user?.role === "NURSE";
  const facilityId = isNurse ? user?.facilityId : null;

  const parents = useQuery({
    queryKey: ["users", "PARENT", facilityId ?? "all"],
    queryFn: () => userApi.listByRole("PARENT", facilityId),
  });
  const chws = useQuery({
    queryKey: ["chws", facilityId ?? "all"],
    queryFn: () => chwApi.list(facilityId),
  });

  const [modal, setModal] = useState<{ open: boolean; editing?: User }>({ open: false });
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [filterAssigned, setFilterAssigned] = useState<"all" | "assigned" | "unassigned">("all");

  const saveMut = useMutation({
    mutationFn: (data: { editing?: User; form: Partial<User> & { password?: string } }) => {
      if (data.editing) {
        return userApi.update(data.editing.id, data.form);
      }
      // Create via register endpoint
      return userApi.createParent(data.form as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "PARENT"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(modal.editing ? "Parent updated" : "Parent account created");
      setModal({ open: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => userApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "PARENT"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Parent deleted");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Build a lookup of CHW by normalized village name
  const chwByNormalizedVillage = new Map<string, CHW>();
  (chws.data ?? []).forEach((c) => {
    if (c.village) {
      const normalized = c.village.trim().toLowerCase();
      chwByNormalizedVillage.set(normalized, c);
    }
  });

  const getCHWForParent = (parent: User): CHW | undefined => {
    if (parent.village) {
      const normalized = parent.village.trim().toLowerCase();
      return chwByNormalizedVillage.get(normalized);
    }
    return undefined;
  };

  const filtered = (parents.data ?? []).filter((p) => {
    const chw = getCHWForParent(p);
    if (filterAssigned === "assigned" && !chw) return false;
    if (filterAssigned === "unassigned" && chw) return false;
    return (
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.village ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const assignedCount = (parents.data ?? []).filter((p) => getCHWForParent(p)).length;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "assigned", "unassigned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterAssigned(f)}
              className={`h-9 px-3.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filterAssigned === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border hover:bg-muted text-foreground"
              }`}
            >
              {f === "all" ? "All Parents" : f === "assigned" ? "Has CHW" : "No CHW"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 h-9 rounded-lg border bg-card w-72">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parents…"
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <Button onClick={() => setModal({ open: true })}>
            <Plus className="size-4" /> Add Parent
          </Button>
        </div>
      </div>

      {parents.isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load parents. Is the backend running?
        </div>
      )}

      {/* Summary cards */}
      {!parents.isPending && parents.data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 bg-primary/10">
            <div className="text-2xl font-bold font-display text-primary">{parents.data.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Parents</div>
          </div>
          <div className="rounded-xl p-4 bg-success/15">
            <div className="flex items-center gap-1.5">
              <UserCheck className="size-4 text-success" />
              <div className="text-2xl font-bold font-display text-success">{assignedCount}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Assigned to CHW</div>
          </div>
          <div className="rounded-xl p-4 bg-warning/20">
            <div className="flex items-center gap-1.5">
              <UserX className="size-4 text-warning-foreground" />
              <div className="text-2xl font-bold font-display text-warning-foreground">
                {parents.data.length - assignedCount}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">No CHW assigned</div>
          </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Village</th>
                <th className="px-5 py-3 font-medium">Assigned CHW</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {parents.isPending &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))}
              {filtered.map((p) => {
                const chw = getCHWForParent(p);
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-sm shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium">{p.name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="size-3" /> {p.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="size-3" /> {p.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.village ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {p.village}
                          {p.cell && `, ${p.cell}`}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {chw ? (
                        <div className="space-y-0.5">
                          <Badge tone="success">{chw.name}</Badge>
                          <div className="text-xs text-muted-foreground">{chw.village}</div>
                        </div>
                      ) : (
                        <Badge tone="warning">No CHW</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setModal({ open: true, editing: p })}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => setToDelete(p)}
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!parents.isPending && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No parents match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ParentModal
        key={modal.editing?.id ?? "new"}
        open={modal.open}
        editing={modal.editing}
        chws={chws.data ?? []}
        saving={saveMut.isPending}
        onClose={() => setModal({ open: false })}
        onSave={(form) => saveMut.mutate({ editing: modal.editing, form })}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        title="Delete parent account?"
        description={`This will permanently remove ${toDelete?.name}'s account and all their data.`}
      />
    </div>
  );
}

// ── Parent Modal ──────────────────────────────────────────────────────────────

function ParentModal({
  open, editing, chws, saving, onClose, onSave,
}: {
  open: boolean;
  editing?: User;
  chws: CHW[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState<Partial<User> & { password?: string }>(
    editing
      ? {
          name: editing.name,
          email: editing.email,
          phone: editing.phone,
          province: editing.province ?? "",
          district: editing.district ?? "",
          sector: editing.sector ?? "",
          cell: editing.cell ?? "",
          village: editing.village ?? "",
        }
      : { name: "", email: "", phone: "", password: "" }
  );

  const location: LocationValue = {
    province: form.province || undefined,
    district: form.district || undefined,
    sector: form.sector || undefined,
    cell: form.cell || undefined,
    village: form.village || undefined,
  };

  const setLocation = (v: LocationValue) => {
    setForm({
      ...form,
      province: v.province ?? "",
      district: v.district ?? "",
      sector: v.sector ?? "",
      cell: v.cell ?? "",
      village: v.village ?? "",
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Parent" : "Add Parent"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create account"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Personal info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Personal Information
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full name *">
              <input
                required
                className={inputClass}
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Marie Uwase"
              />
            </FormField>
            <FormField label="Phone *">
              <input
                required
                className={inputClass}
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0787654321"
              />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Email address *">
              <input
                required
                type="email"
                className={inputClass}
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="parent@example.com"
              />
            </FormField>
          </div>
          {!editing && (
            <div className="mt-4">
              <FormField label="Password *">
                <input
                  required={!editing}
                  type="text"
                  className={inputClass}
                  value={form.password ?? ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Temporary password"
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Location
          </p>
          <LocationPicker value={location} onChange={setLocation} />
          {form.village && (
            <p className="mt-2 text-xs text-muted-foreground">
              A CHW in <strong>{form.village}</strong> will be automatically matched.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
