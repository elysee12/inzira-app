import { createFileRoute } from "@tanstack/react-router";
import { UserCheck, Plus, Edit, Trash2, Building2, MapPin, Phone, Mail, Search } from "lucide-react";
import { Card, Button, Input, Label } from "@/components/admin/ui";
import { RwandaLocationPicker } from "@/components/admin/RwandaLocationPicker";
import { nurseApi, facilityApi, type Nurse, type Facility } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/nurses")({
  component: NursesPage,
});

function NursesPage() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [nursesData, facilitiesData] = await Promise.all([
        nurseApi.list(),
        facilityApi.list(),
      ]);
      setNurses(nursesData);
      setFacilities(facilitiesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredNurses = nurses.filter(
    (n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.phone.includes(searchQuery)
  );

  function handleAdd() {
    setEditingNurse(null);
    setShowModal(true);
  }

  function handleEdit(nurse: Nurse) {
    setEditingNurse(nurse);
    setShowModal(true);
  }

  async function handleDelete(nurse: Nurse) {
    if (!confirm(`Delete nurse "${nurse.name}"? This cannot be undone.`)) return;
    try {
      await nurseApi.remove(nurse.id);
      await loadData();
      toast.success(`${nurse.name} has been removed.`);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete nurse");
    }
  }

  async function handleSave(data: Partial<Nurse> & { facilityId: number }) {
    try {
      if (editingNurse) {
        // Strip null values — API expects string | undefined
        const patch = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
        ) as Parameters<typeof nurseApi.update>[1];
        await nurseApi.update(editingNurse.id, patch);
        setShowModal(false);
        await loadData();
        toast.success("Nurse profile updated successfully.");
      } else {
        const result = await nurseApi.create(data as any);
        setShowModal(false);
        await loadData();
        toast.success(
          `Account created! A welcome email with login credentials has been sent to ${data.email ?? "the nurse"}.`,
          { duration: 6000 }
        );
        // Still surface the password in a non-blocking way via a second toast
        toast.info(`Temporary password: ${result.temporaryPassword}`, {
          duration: 12000,
          description: "Store this securely — it was also sent by email.",
        });
      }
    } catch (error: any) {
      const msg: string = error?.message ?? "";
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("phone") || msg.toLowerCase().includes("already")) {
        toast.error("Email or phone number already registered", {
          description: "A user with this email or phone already exists. Please use different contact details.",
        });
      } else if (msg.toLowerCase().includes("facility")) {
        toast.error("Facility not found", {
          description: "The selected facility could not be found. Please try again.",
        });
      } else if (msg) {
        toast.error("Registration failed", { description: msg });
      } else {
        toast.error("Registration failed", {
          description: "Something went wrong. Please check your connection and try again.",
        });
      }
    }
  }

  function getFacilityName(facilityId?: number | null): string {
    if (!facilityId) return "No facility";
    const facility = facilities.find((f) => f.id === facilityId);
    return facility?.name ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Nurses & Nutritionists</h1>
          <p className="text-muted-foreground mt-1">Manage nurse accounts and facility assignments</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Register Nurse
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search nurses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Nurses List */}
      {loading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading nurses...</p>
        </Card>
      ) : filteredNurses.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCheck className="size-16 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Nurses Found</h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term" : "Get started by registering your first nurse"}
          </p>
          {!searchQuery && (
            <Button onClick={handleAdd}>
              <Plus className="size-4 mr-2" />
              Register Nurse
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNurses.map((nurse) => (
            <Card key={nurse.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{nurse.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Nurse
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(nurse)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(nurse)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4" />
                  <span>{getFacilityName(nurse.facilityId)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" />
                  <span>{nurse.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  <span className="truncate">{nurse.email}</span>
                </div>
                {nurse.district && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" />
                    <span>
                      {[nurse.sector, nurse.district, nurse.province]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                Registered {new Date(nurse.createdAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NurseModal
          nurse={editingNurse}
          facilities={facilities}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function NurseModal({
  nurse,
  facilities,
  onClose,
  onSave,
}: {
  nurse: Nurse | null;
  facilities: Facility[];
  onClose: () => void;
  onSave: (data: Partial<Nurse> & { facilityId: number }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: nurse?.name ?? "",
    email: nurse?.email ?? "",
    phone: nurse?.phone ?? "",
    facilityId: nurse?.facilityId ?? 0,
    province: nurse?.province ?? "",
    district: nurse?.district ?? "",
    sector: nurse?.sector ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.facilityId) {
      toast.error("Please select an assigned facility.");
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">
              {nurse ? "Edit Nurse" : "Register New Nurse"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {nurse ? "Update nurse information" : "Create a new nurse account"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Marie Uwase"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nurse@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+250..."
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="facilityId">Assigned Facility *</Label>
              <select
                id="facilityId"
                required
                value={formData.facilityId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const chosen = facilities.find((f) => f.id === id);
                  setFormData({
                    ...formData,
                    facilityId: id,
                    // Auto-fill location from the selected facility; keep
                    // each field as-is if the facility doesn't have it stored
                    province: chosen?.province ?? formData.province,
                    district: chosen?.district ?? formData.district,
                    sector: chosen?.sector ?? formData.sector,
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value={0}>Select a facility...</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.type})
                  </option>
                ))}
              </select>
            </div>

            <RwandaLocationPicker
              value={{
                province: formData.province,
                district: formData.district,
                sector: formData.sector,
              }}
              onChange={({ province, district, sector }) =>
                setFormData({ ...formData, province, district, sector })
              }
            />

            {!nurse && (
              <div className="md:col-span-2 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ℹ️ A temporary password will be auto-generated and sent to the nurse's email
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : nurse ? "Update" : "Register"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
