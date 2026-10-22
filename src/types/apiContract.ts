// Shared TypeScript interfaces mirroring the Lattice API contract.
// Source of truth: API_CONTRACT.md (repository root).
// Keep these in sync with the contract; changes require team approval.

export type ReadingSource = "simulated" | "real";

export interface ApiReading {
  deviceId: string;
  timestamp: string; // ISO 8601 UTC, e.g. "2026-10-22T03:30:00Z"
  powerWatts: number; // instantaneous power in watts
  energyKwh: number; // energy in kWh for the reading's measurement interval
  source: ReadingSource;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string; // ISO 8601 UTC
  service?: string;
  version?: string;
}

export interface ReadingsResponse {
  readings: ApiReading[];
  count: number;
  generatedAt: string; // ISO 8601 UTC
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
