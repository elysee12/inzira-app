import { useMemo } from "react";
import { Label } from "@/components/admin/ui";
import locationData from "@/assets/rwanda_locations.json";

// ── Types derived from the JSON shape ─────────────────────────────────────────

interface RwandaSector {
  type: string;
  name: string;
}

interface RwandaDistrict {
  type: string;
  name: string;
  sectors: RwandaSector[];
}

interface RwandaProvince {
  type: string;
  name: string;
  districts: RwandaDistrict[];
}

const provinces = locationData.items as RwandaProvince[];

// ── Props ──────────────────────────────────────────────────────────────────────

export interface LocationValue {
  province: string;
  district: string;
  sector: string;
}

interface RwandaLocationPickerProps {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  /** Layout variant: 2-column grid (default) or stacked */
  layout?: "grid" | "stack";
}

// ── Shared select style ────────────────────────────────────────────────────────

const SELECT_CLASS =
  "mt-1 w-full h-9 px-3 rounded-lg border border-input bg-background text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary " +
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none";

// ── Component ─────────────────────────────────────────────────────────────────

export function RwandaLocationPicker({
  value,
  onChange,
  layout = "grid",
}: RwandaLocationPickerProps) {
  // Derived option lists — each recalculates only when its dependency changes
  const provinceOptions = useMemo(() => provinces.map((p) => p.name).sort(), []);

  const districtOptions = useMemo(() => {
    if (!value.province) return [];
    const prov = provinces.find(
      (p) => p.name.toLowerCase() === value.province.toLowerCase()
    );
    return (prov?.districts ?? []).map((d) => d.name).sort();
  }, [value.province]);

  const sectorOptions = useMemo(() => {
    if (!value.province || !value.district) return [];
    const prov = provinces.find(
      (p) => p.name.toLowerCase() === value.province.toLowerCase()
    );
    const dist = prov?.districts.find(
      (d) => d.name.toLowerCase() === value.district.toLowerCase()
    );
    return (dist?.sectors ?? []).map((s) => s.name).sort();
  }, [value.province, value.district]);

  function handleProvinceChange(province: string) {
    // Reset downstream when province changes
    onChange({ province, district: "", sector: "" });
  }

  function handleDistrictChange(district: string) {
    // Reset sector when district changes
    onChange({ ...value, district, sector: "" });
  }

  function handleSectorChange(sector: string) {
    onChange({ ...value, sector });
  }

  const wrapClass = layout === "grid" ? "contents" : "space-y-4";

  return (
    <div className={wrapClass}>
      {/* Province */}
      <div className={layout === "grid" ? "" : ""}>
        <Label htmlFor="loc-province">Province</Label>
        <select
          id="loc-province"
          value={value.province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Select Province...</option>
          {provinceOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <Label htmlFor="loc-district">District</Label>
        <select
          id="loc-district"
          value={value.district}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={!value.province}
          className={SELECT_CLASS}
        >
          <option value="">
            {value.province ? "Select District..." : "Select Province first"}
          </option>
          {districtOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Sector — spans full width in grid layout */}
      <div className={layout === "grid" ? "md:col-span-2" : ""}>
        <Label htmlFor="loc-sector">Sector</Label>
        <select
          id="loc-sector"
          value={value.sector}
          onChange={(e) => handleSectorChange(e.target.value)}
          disabled={!value.district}
          className={SELECT_CLASS}
        >
          <option value="">
            {value.district ? "Select Sector..." : "Select District first"}
          </option>
          {sectorOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
