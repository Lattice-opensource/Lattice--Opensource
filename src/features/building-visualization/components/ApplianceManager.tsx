import { useState } from "react";
import type { DemoAppliance } from "../sampleData";

const CATEGORIES = [
  "air_conditioner", "refrigerator", "lighting", "television", "computer",
  "water_heater", "washing_machine", "kitchen_equipment", "other",
];

const MONITORING_METHODS = [
  { value: "none", label: "No monitoring" },
  { value: "device", label: "Individual appliance meter" },
  { value: "smart_plug", label: "Smart plug" },
  { value: "circuit", label: "Shared circuit meter" },
  { value: "room", label: "Room-level meter" },
  { value: "manual", label: "Manually entered" },
  { value: "estimated", label: "Estimated consumption" },
];

interface Props {
  appliances: DemoAppliance[];
  onAdd: (a: DemoAppliance) => void;
  onRemove: (id: string) => void;
  onEdit: (a: DemoAppliance) => void;
  onSelect?: (id: string) => void;
}

export function ApplianceManager({ appliances, onAdd, onRemove, onEdit, onSelect }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("other");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [ratedPower, setRatedPower] = useState("");
  const [monitoring, setMonitoring] = useState("none");
  const [editingId, setEditingId] = useState<string | null>(null);

  const reset = () => {
    setName(""); setType("other"); setManufacturer(""); setModel("");
    setRatedPower(""); setMonitoring("none"); setEditingId(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const a: DemoAppliance = {
      id: editingId || `a${Date.now()}`,
      name: name.trim(),
      type,
      ratedPowerW: ratedPower ? Number(ratedPower) : null,
      powerW: null,
      energyKwh: null,
      isSimulated: false,
    };
    // store extra fields via cast
    (a as any).manufacturer = manufacturer || null;
    (a as any).model = model || null;
    (a as any).monitoringMethod = monitoring;
    if (editingId) onEdit(a); else onAdd(a);
    reset();
  };

  const startEdit = (a: DemoAppliance) => {
    setEditingId(a.id);
    setName(a.name);
    setType(a.type);
    setRatedPower(a.ratedPowerW != null ? String(a.ratedPowerW) : "");
    setManufacturer((a as any).manufacturer || "");
    setModel((a as any).model || "");
    setMonitoring((a as any).monitoringMethod || "none");
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="space-y-2 rounded-lg border border-line bg-page p-3">
        <p className="text-xs font-semibold text-muted">{editingId ? "Edit appliance" : "Add appliance"}</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded border border-line bg-card px-2 py-1.5 text-sm text-ink" required />
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded border border-line bg-card px-2 py-1.5 text-sm text-ink">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
        </select>
        <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Manufacturer (optional)" className="w-full rounded border border-line bg-card px-2 py-1.5 text-sm text-ink" />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model (optional)" className="w-full rounded border border-line bg-card px-2 py-1.5 text-sm text-ink" />
        <input value={ratedPower} onChange={(e) => setRatedPower(e.target.value)} placeholder="Rated power (W, optional)" type="number" min="0" className="w-full rounded border border-line bg-card px-2 py-1.5 text-sm text-ink" />
        <select value={monitoring} onChange={(e) => setMonitoring(e.target.value)} className="w-full rounded border border-line bg-card px-2 py-1.5 text-sm text-ink">
          {MONITORING_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-brand px-3 py-1.5 text-sm text-white">{editingId ? "Save" : "Add"}</button>
          {editingId ? <button type="button" onClick={reset} className="rounded border border-line px-3 py-1.5 text-sm text-muted">Cancel</button> : null}
        </div>
        <p className="text-[10px] text-muted">Rated power is not measured consumption. Monitoring method identifies data source/confidence.</p>
      </form>

      <ul className="space-y-2">
        {appliances.map((a) => (
          <li key={a.id} className="rounded-lg border border-line px-3 py-2">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => onSelect?.(a.id)} className="text-sm font-medium text-ink hover:text-brand">{a.name}</button>
              <span className="text-xs text-muted">{a.type.replace(/_/g, " ")}</span>
            </div>
            <div className="mt-1 text-xs text-muted">
              Rated: {a.ratedPowerW != null ? `${a.ratedPowerW} W` : "—"} · Measured: {a.powerW != null ? `${Math.round(a.powerW)} W` : "no data"} · {a.energyKwh != null ? `${a.energyKwh.toFixed(2)} kWh` : "—"}
            </div>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => startEdit(a)} className="text-xs text-brand hover:underline">Edit</button>
              <button type="button" onClick={() => onRemove(a.id)} className="text-xs text-muted hover:text-brand">Remove</button>
            </div>
            {a.isSimulated ? <p className="mt-1 text-[10px] text-muted">Simulated demo data</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
