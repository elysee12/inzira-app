import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus, Edit, Trash2, MapPin, Phone, Mail, Search } from "lucide-react";
import { Card, Button, Input, Label } from "@/components/admin/ui";
import { RwandaLocationPicker } from "@/components/admin/RwandaLocationPicker";
import { facilityApi, type Facility } from "@/lib/api";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_admin/facilities")({
  component: FacilitiesPage,
});

function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  async function loadFacilities() {
    try {
      setLoading(true);
      const data = await facilityApi.list();
      setFacilities(data);
    } catch (error) {
      console.error("Failed to load facilities:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleAdd() {
    setEditingFacility(null);
    setShowModal(true);
  }

  function handleEdit(facility: Facility) {
    setEditingFacility(facility);
    setShowModal(true);
  }

  async function handleDelete(facility: Facility) {
    if (!confirm(`Delete facility "${facility.name}"?`)) return;
    try {
      await facilityApi.remove(facility.id);
      await loadFacilities();
    } catch (error) {
      alert("Failed to delete facility");
      console.error(error);
    }
  }

  async function handleSave(data: Partial<Facility>) {
    try {
      if (editingFacility) {
        // Strip null values — API expects string | undefined
        const patch = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
        ) as Parameters<typeof facilityApi.update>[1];
        await facilityApi.update(editingFacility.id, patch);
      } else {
        await facilityApi.create(data as any);
      }
      setShowModal(false);
      await loadFacilities();
    } catch (error) {
      alert("Failed to save facility");
      console.error(error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Facilities Management</h1>
          <p className="text-muted-foreground mt-1">Manage hospitals, health centers, and service points</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Add Facility
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Facilities List */}
      {loading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading facilities...</p>
        </Card>
      ) : filteredFacilities.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="size-16 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Facilities Found</h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term" : "Get started by adding your first facility"}
          </p>
          {!searchQuery && (
            <Button onClick={handleAdd}>
              <Plus className="size-4 mr-2" />
              Add Facility
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFacilities.map((facility) => (
            <Card key={facility.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{facility.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {facility.type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(facility)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(facility)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {facility.district && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" />
                    <span>
                      {[facility.sector, facility.district, facility.province]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {facility.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4" />
                    <span>{facility.phone}</span>
                  </div>
                )}
                {facility.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4" />
                    <span>{facility.email}</span>
                  </div>
                )}
              </div>

              {facility.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {facility.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Status: {facility.isActive ? "Active" : "Inactive"}</span>
                {facility._count && <span>{facility._count.users} users</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FacilityModal
          facility={editingFacility}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function FacilityModal({
  facility,
  onClose,
  onSave,
}: {
  facility: Facility | null;
  onClose: () => void;
  onSave: (data: Partial<Facility>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: facility?.name ?? "",
    type: facility?.type ?? "",
    province: facility?.province ?? "",
    district: facility?.district ?? "",
    sector: facility?.sector ?? "",
    phone: facility?.phone ?? "",
    email: facility?.email ?? "",
    description: facility?.description ?? "",
    isActive: facility?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
              {facility ? "Edit Facility" : "Add New Facility"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {facility ? "Update facility information" : "Create a new health facility"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name">Facility Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kigali University Hospital"
              />
            </div>

            <div>
              <Label htmlFor="type">Facility Type *</Label>
              <Input
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Hospital, Health Center"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+250..."
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@facility.rw"
              />
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

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Brief description of the facility..."
              />
            </div>

            {facility && (
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Facility is active
                </Label>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : facility ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
