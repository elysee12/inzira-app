/**
 * LocationPicker — Province → District → Sector → Cell → Village
 * Uses the real rwanda_locations.json from /assets
 *
 * JSON shape:
 * {
 *   items: [
 *     { name: string, districts: [
 *       { name: string, sectors: [
 *         { name: string, cells: [
 *           { name: string, villages: string[] }
 *         ] }
 *       ] }
 *     ] }
 *   ]
 * }
 */
import { useMemo } from "react";
import locationsData from "@/assets/rwanda_locations.json";
import { FormField, inputClass } from "./Modal";

// ── Types matching actual JSON schema ─────────────────────────────────────────

interface Village  { name: string; }
interface Cell     { name: string; villages: string[]; }
interface Sector   { name: string; cells: Cell[]; }
interface District { name: string; sectors: Sector[]; }
interface Province { name: string; districts: District[]; }
interface LocationsJson { items: Province[]; }

const data = locationsData as unknown as LocationsJson;

// ── Lookup helpers ────────────────────────────────────────────────────────────

const sorted = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b));

function getProvinces(): string[] {
  return sorted(data.items.map((p) => p.name));
}

function getDistricts(province: string): string[] {
  const prov = data.items.find((p) => p.name === province);
  return prov ? sorted(prov.districts.map((d) => d.name)) : [];
}

function getSectors(province: string, district: string): string[] {
  const prov = data.items.find((p) => p.name === province);
  const dist = prov?.districts.find((d) => d.name === district);
  return dist ? sorted(dist.sectors.map((s) => s.name)) : [];
}

function getCells(province: string, district: string, sector: string): string[] {
  const prov = data.items.find((p) => p.name === province);
  const dist = prov?.districts.find((d) => d.name === district);
  const sect = dist?.sectors.find((s) => s.name === sector);
  return sect ? sorted(sect.cells.map((c) => c.name)) : [];
}

function getVillages(province: string, district: string, sector: string, cell: string): string[] {
  const prov = data.items.find((p) => p.name === province);
  const dist = prov?.districts.find((d) => d.name === district);
  const sect = dist?.sectors.find((s) => s.name === sector);
  const cel  = sect?.cells.find((c) => c.name === cell);
  return cel ? sorted(cel.villages) : [];
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface LocationValue {
  province?: string;
  district?: string;
  sector?:   string;
  cell?:     string;
  village?:  string;
}

interface Props {
  value:    LocationValue;
  onChange: (v: LocationValue) => void;
  required?: boolean;
}

export function LocationPicker({ value, onChange, required = false }: Props) {
  const provinces = useMemo(() => getProvinces(), []);

  const districts = useMemo(
    () => (value.province ? getDistricts(value.province) : []),
    [value.province]
  );

  const sectors = useMemo(
    () => (value.province && value.district ? getSectors(value.province, value.district) : []),
    [value.province, value.district]
  );

  const cells = useMemo(
    () =>
      value.province && value.district && value.sector
        ? getCells(value.province, value.district, value.sector)
        : [],
    [value.province, value.district, value.sector]
  );

  const villages = useMemo(
    () =>
      value.province && value.district && value.sector && value.cell
        ? getVillages(value.province, value.district, value.sector, value.cell)
        : [],
    [value.province, value.district, value.sector, value.cell]
  );

  // When a parent level changes, clear all child levels
  const pick = (
    field: keyof LocationValue,
    clearFields: (keyof LocationValue)[],
    val: string
  ) => {
    const cleared = Object.fromEntries(clearFields.map((f) => [f, undefined])) as Partial<LocationValue>;
    onChange({ ...value, [field]: val || undefined, ...cleared });
  };

  const sel = (label: string, opts: string[], fieldVal: string | undefined, disabled: boolean, onChange: (v: string) => void) => (
    <FormField label={required ? `${label} *` : label}>
      <select
        required={required && !disabled}
        disabled={disabled}
        className={`${inputClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        value={fieldVal ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— {label} —</option>
        {opts.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </FormField>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {sel("Province", provinces, value.province, false, (v) =>
        pick("province", ["district", "sector", "cell", "village"], v)
      )}
      {sel("District", districts, value.district, !value.province, (v) =>
        pick("district", ["sector", "cell", "village"], v)
      )}
      {sel("Sector", sectors, value.sector, !value.district, (v) =>
        pick("sector", ["cell", "village"], v)
      )}
      {sel("Cell", cells, value.cell, !value.sector, (v) =>
        pick("cell", ["village"], v)
      )}
      <div className="col-span-2">
        {sel("Village", villages, value.village, !value.cell, (v) =>
          onChange({ ...value, village: v || undefined })
        )}
      </div>
    </div>
  );
}
