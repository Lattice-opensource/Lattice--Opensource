// HTTP client for Lattice Building Visualization energy data.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { const b = await res.json(); if (b?.error?.message) msg = b.error.message; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export interface EnergyReadingDto {
  id: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  powerW: number | null;
  energyKwh: number | null;
  measurementSource: "measured" | "estimated" | "simulated";
  isSimulated: boolean;
}

export interface BuildingAlert {
  id: string;
  building_id: string;
  circuit_id: string | null;
  alert_type: string;
  severity: "Low" | "Medium" | "High";
  description: string;
  timestamp: string;
  resolution_status: "open" | "acknowledged" | "resolved";
  value: number | null;
  threshold: number | null;
  is_simulated: boolean;
  roomId: string | null;
  floorId: string | null;
  level: "room" | "circuit" | "building";
}

export interface AggregatedEnergyDto {
  powerW: number | null;
  energyKwh: number;
  measurementSource: string;
  hasData: boolean;
  sampleCount: number;
}

export const buildingApi = {
  insertReading: (r: { entityType: string; entityId: string; timestamp?: string; powerW?: number | null; energyKwh?: number | null; measurementSource?: string; isSimulated?: boolean }) =>
    request<{ data: EnergyReadingDto }>("/api/energy-readings", { method: "POST", body: JSON.stringify(r) }),

  listReadings: (params: { entityType?: string; entityId?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params.entityType) q.set("entityType", params.entityType);
    if (params.entityId) q.set("entityId", params.entityId);
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    return request<{ data: EnergyReadingDto[] }>(`/api/energy-readings?${q.toString()}`);
  },

  buildingEnergy: (buildingId: string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return request<{ data: { buildingId: string; window: { from: string; to: string } } & AggregatedEnergyDto }>(`/api/buildings/${buildingId}/energy?${q.toString()}`);
  },

  roomEnergy: (roomId: string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return request<{ data: { roomId: string; window: { from: string; to: string } } & AggregatedEnergyDto }>(`/api/rooms/${roomId}/energy?${q.toString()}`);
  },

  buildingAlerts: (buildingId: string) =>
    request<{ data: BuildingAlert[]; meta: { available?: boolean; error?: string } }>(`/api/buildings/${buildingId}/alerts`),

  applianceEnergy: (applianceId: string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return request<{ data: { applianceId: string; window: { from: string; to: string }; measured: AggregatedEnergyDto; ratedPowerW: number | null; monitoringMethod: string } }>(`/api/appliances/${applianceId}/energy?${q.toString()}`);
  },
};
