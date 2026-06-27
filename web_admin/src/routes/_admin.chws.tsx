import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus, Pencil, Trash2, Search, MapPin, Phone,
  Mail, Users, KeyRound, AlertCircle, Copy, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { chwApi, type CHW } from "@/lib/api";
import { Card, Button, Badge } from "@/components/admin/ui";
import { Modal, ConfirmDialog, FormField, inputClass } from "@/components/admin/Modal";
import { LocationPicker, type LocationValue } from "@/components/admin/LocationPicker";

export const Route = createFileRoute("/_admin/chws")({ component: CHWsPage });

// ── Page ──────────────────────────────────────────────────────────────────────

function CHWsPage() {
  const qc = useQueryClient();
  const chws = useQuery({ queryKey: ["chws"], queryFn: chwApi.list });

  const [modal, setModal] = useState<{ open: boolean; editing?: CHW }>({ open: false });
  const [toDelete, setToDelete] = useState<CHW | null>(null);
  const [search, setSearch] = useState("");
  const [createdInfo, setCreatedInfo] = useState<{ name: string; email: string; password: string } | null>(null);

  const createMut = useMutation({
    mutationFn: (data: Parameters<typeof chwApi.create>[0]) => chwApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["chws"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`CHW account created for ${res.chw.name}`);
      setModal({ open: false });
      setCreatedInfo({ name: res.chw.name, email: res.chw.email, password: res.temporaryPassword });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CHW> }) => chwApi.update(id, data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chws"] });
      toast.success("CHW updated");
      setModal({ open: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => chwApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chws"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("CHW deleted");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (chws.data ?? []).filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.village ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg border bg-card w-full sm:w-80">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search health workers…"
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
        <Button onClick={() => setModal({ open: true })}>
          <Plus className="size-4" /> Add Health Worker
        </Button>
      </div>

      {chws.isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load health workers. Is the backend running?
        </div>
      )}

      {/* Summary cards */}
      {!chws.isPending && chws.data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard
            value={chws.data.length}
            label="Total CHWs"
            color="text-primary"
            bg="bg-primary/10"
          />
          <SummaryCard
            value={chws.data.reduce((s, c) => s + (c._count?.assignedParents ?? 0), 0)}
            label="Assigned Parents"
            color="text-success"
            bg="bg-success/15"
          />
          <SummaryCard
            value={chws.data.filter((c) => (c._count?.assignedParents ?? 0) === 0).length}
            label="Unassigned CHWs"
            color="text-warning-foreground"
            bg="bg-warning/20"
          />
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Village</th>
                <th className="px-5 py-3 font-medium">Parents</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {chws.isPending &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))}
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-success/15 text-success grid place-items-center font-semibold text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">CHW</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="size-3" /> {c.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="size-3" /> {c.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {[c.sector, c.district, c.province].filter(Boolean).join(", ") || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.village ? (
                      <Badge tone="primary">{c.village}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Users className="size-3 text-muted-foreground" />
                      <span className="font-medium">{c._count?.assignedParents ?? 0}</span>
                      <span className="text-muted-foreground">parents</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setModal({ open: true, editing: c })}
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => setToDelete(c)}
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!chws.isPending && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No health workers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CHWModal
        key={modal.editing?.id ?? "new"}
        open={modal.open}
        editing={modal.editing}
        saving={saving}
        onClose={() => setModal({ open: false })}
        onCreate={(data) => createMut.mutate(data as any)}
        onUpdate={(id, data) => updateMut.mutate({ id, data })}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        title="Delete health worker?"
        description={`This will permanently remove ${toDelete?.name}'s account and their credentials.`}
      />

      {/* Created credentials modal */}
      {createdInfo && (
        <CredentialsModal
          info={createdInfo}
          onClose={() => setCreatedInfo(null)}
        />
      )}
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <div className={`rounded-xl p-4 ${bg}`}>
      <div className={`text-2xl font-bold font-display ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ── CHW Modal ─────────────────────────────────────────────────────────────────

function CHWModal({
  open, editing, saving, onClose, onCreate, onUpdate,
}: {
  open: boolean;
  editing?: CHW;
  saving: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  onUpdate: (id: number, data: Partial<CHW>) => void;
}) {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  }>(
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
      : { name: "", email: "", phone: "", province: "", district: "", sector: "", cell: "", village: "" }
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
    if (editing) {
      onUpdate(editing.id, form);
    } else {
      onCreate(form);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Health Worker" : "Add Health Worker"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create CHW"}
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
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jean Mugabo"
              />
            </FormField>
            <FormField label="Phone *">
              <input
                required
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0781234567"
              />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Email address *">
              <input
                required
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="chw@example.com"
              />
            </FormField>
          </div>
        </div>

        {/* Location */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Location Assignment
          </p>
          <LocationPicker value={location} onChange={setLocation} required />
        </div>

        {!editing && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <div className="flex items-center gap-2 text-primary font-medium mb-1">
              <KeyRound className="size-4" /> Auto-generated credentials
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              A secure 10-character password will be auto-generated and sent to the CHW's
              email address. You'll also see the password here after creation.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

// ── Credentials display modal ─────────────────────────────────────────────────

function CredentialsModal({
  info,
  onClose,
}: {
  info: { name: string; email: string; password: string };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(info.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="CHW Account Created!"
      size="sm"
      footer={
        <Button onClick={onClose}>Done</Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="size-5" />
          <p className="font-medium">Account for {info.name} is ready</p>
        </div>
        <p className="text-sm text-muted-foreground">
          A welcome email with these credentials has been sent to{" "}
          <strong className="text-foreground">{info.email}</strong>.
        </p>
        <div className="rounded-xl border bg-muted/50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-mono font-medium">{info.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Temp. password</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-primary">{info.password}</span>
              <button
                onClick={copy}
                className="p-1 rounded hover:bg-muted transition-colors"
                title="Copy password"
              >
                {copied ? (
                  <CheckCircle className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Please save or share this password securely. The CHW should change it on first login.
        </p>
      </div>
    </Modal>
  );
}
