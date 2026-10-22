// Shared TypeScript interfaces mirroring the Lattice API contract.
// Source of truth: API_CONTRACT.md (repository root).
// Keep these in sync with the contract; changes require team approval.

export type ReadingSource = "simulator" | "device" | "import";

export interface ApiReading {
  id: string;
  deviceId: string;
  timestamp: string; // ISO 8601 UTC
  intervalStart: string;
  intervalSeconds: number;
  powerW: number; // instantaneous power in watts
  energyKwh: number | null; // energy in kWh for the reading's measurement interval
  energyKwhTotal: number | null;
  voltageV: number | null;
  currentA: number | null;
  isSimulated: boolean;
  source: ReadingSource;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string; // ISO 8601 UTC
  service?: string;
  version?: string;
}

export interface ReadingsResponse {
  data: ApiReading[];
  meta: { serverTime: string; total?: number; limit?: number; offset?: number; hasMore?: boolean };
  // Legacy fields retained for compatibility with /api/readings/latest
  readings?: Array<{
    deviceId: string;
    timestamp: string;
    powerWatts: number;
    energyKwh: number;
    source: "simulated" | "real";
  }>;
  count?: number;
  generatedAt?: string;
}

export interface ApiSiteSummary {
  siteId: string;
  name: string;
  currentPowerKw: number;
  todayEnergyKwh: number;
  todayCostInr: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
