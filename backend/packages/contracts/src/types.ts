/**
 * Lattice shared contract -- TYPES ONLY.
 *
 * This module deliberately has ZERO runtime dependencies (no zod import) so that a
 * browser bundle can `import type { Device } from '@lattice/contracts'` and pull in
 * nothing at runtime.
 *
 * The runtime Zod schemas that validate this contract live in `@lattice/contracts/schema`
 * (they require `zod`). `schema/assertions.ts` statically asserts that the schemas and
 * these types stay in lockstep.
 *
 * ---------------------------------------------------------------------------
 * CONTRACT RULES (agreed with the frontend developer)
 * ---------------------------------------------------------------------------
 * 1. All timestamps are ISO-8601 strings in UTC with millisecond precision,
 *    e.g. "2026-10-22T12:00:00.000Z". They are fixed-width, so lexicographic
 *    ordering equals chronological ordering.
 * 2. `powerW` is instantaneous power in watts, >= 0, at most 2 decimal places.
 * 3. `energyKwh` is the energy consumed DURING the sampling interval that ENDS at
 *    `timestamp`. The interval is delimited by `intervalStart` and `intervalSeconds`.
 *    It is null when the source cannot provide it.
 * 4. `energyKwhTotal` is a monotonically non-decreasing lifetime register in kWh
 *    (a meter register). It is null when the source has no cumulative counter.
 *    A dropped interval never loses energy here, so the frontend can cross-check
 *    the delta against the register.
 * 5. `isSimulated` is true ONLY for data produced by the development simulator.
 *    Simulated data must never be presented to a user as real sensor data.
 * 6. `source` records provenance: 'simulator' | 'device' | 'import'.
 */

/** A physical site: a large office building, campus, or branch. */
export interface Site {
  id: string;
  name: string;
  /** IANA timezone, e.g. "Asia/Kolkata". */
  timezone: string;
  /** ISO 4217 code. "INR" for Lattice. */
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/** A room within a site. Devices belong to at most one room. */
export interface Room {
  id: string;
  siteId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Device categories. Kept deliberately coarse in v1.
 * v2 may add 'solar' | 'battery' | 'ev_charger' with the corresponding hardware work.
 */
export type DeviceCategory =
  | 'hvac'
  | 'lighting'
  | 'kitchen'
  | 'electronics'
  | 'appliance'
  | 'ev'
  | 'other';

/**
 * Device connection state.
 *
 * 'online' / 'offline' / 'unknown' are stored on the record.
 * 'stale' is DERIVED by the server: a device whose last reading is older than
 * `staleAfterSeconds` is reported as 'stale' regardless of its stored status.
 */
export type DeviceStatus = 'online' | 'offline' | 'stale' | 'unknown';

/** Provenance of a single reading. */
export type ReadingSource = 'simulator' | 'device' | 'import';

/** A single device (meter, appliance-level sensor, smart plug, ...). */
export interface Device {
  id: string;
  siteId: string;
  roomId: string | null;
  /** Denormalised for convenience so the UI can label without a second lookup. */
  roomName: string | null;
  name: string;
  category: DeviceCategory;
  /** Manufacturer model string, when known. */
  model: string | null;
  /** Nameplate power in watts, when known. Enables utilisation %. */
  ratedPowerW: number | null;
  status: DeviceStatus;
  /** Timestamp of the most recent reading known for this device. */
  lastSeenAt: string | null;
  /** True when every reading for this device originates from the simulator. */
  isSimulated: boolean;
  installedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A single energy sample for a device. */
export interface Reading {
  /** Opaque, stable id. Usable as a React key / client-side cursor. */
  id: string;
  deviceId: string;
  /** End of the sampling interval. ISO-8601 UTC. */
  timestamp: string;
  /** Start of the sampling interval. ISO-8601 UTC. */
  intervalStart: string;
  /** Duration of the sampling interval in seconds. */
  intervalSeconds: number;
  /** Instantaneous power in watts. */
  powerW: number;
  /** Energy consumed during this interval, in kWh. Null when not applicable. */
  energyKwh: number | null;
  /** Monotonically non-decreasing lifetime energy register, in kWh. Null when not applicable. */
  energyKwhTotal: number | null;
  voltageV: number | null;
  currentA: number | null;
  /** True ONLY for simulator output. */
  isSimulated: boolean;
  source: ReadingSource;
}

/** Tariff shapes supported in v1. */
export interface FlatTariff {
  type: 'flat';
  unit: 'kWh';
  rateInrPerKwh: number;
}

export interface SlabTariff {
  type: 'slab';
  unit: 'kWh';
  /** Ordered ascending. `upToKwh: null` means "and above". */
  slabs: Array<{ upToKwh: number | null; rateInrPerKwh: number }>;
}

export type Tariff = FlatTariff | SlabTariff;

/** Client configuration for a site. */
export interface SiteConfig {
  siteId: string;
  currency: string;
  timezone: string;
  tariff: Tariff;
  /** How stale a device may be before it is reported as 'stale'. */
  staleAfterSeconds: number;
  /** Honesty banner data. `simulated: true` means the data is NOT real sensor data. */
  dataSource: {
    /** 'simulated' = everything is generated; 'live' = real devices; 'mixed' = both present. */
    mode: 'simulated' | 'live' | 'mixed';
    simulated: boolean;
    /** Human-readable notice the UI should surface. */
    notice: string;
  };
}

/** Common envelope metadata returned by every endpoint. */
export interface ResponseMeta {
  /** Server clock at response time (ISO-8601 UTC). The UI uses this for "updated Xs ago". */
  serverTime: string;
  /** Total matching records, ignoring limit/offset. */
  total?: number;
  limit?: number;
  offset?: number;
  /** True when more records exist past limit/offset. */
  hasMore?: boolean;
}

export interface ListResponse<T> {
  data: T[];
  meta: ResponseMeta;
}

export interface ItemResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/** Machine-readable error codes. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_QUERY'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  /** Field-level validation details, when applicable. */
  details?: Array<{ path: string; message: string }>;
  /** Request id, so a user-reported bug can be traced to server logs. */
  requestId?: string;
}

export interface ErrorResponse {
  error: ApiErrorBody;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  uptimeSeconds: number;
  /** Server clock (ISO-8601 UTC). */
  time: string;
  /** Whether the database is reachable. Deliberately contains no credentials or paths. */
  database: 'up' | 'down';
}

/** Grouping granularity for the aggregate endpoint. */
export type AggregateGroupBy = 'device' | 'room' | 'site';

/** One bucketed aggregate point. */
export interface AggregatePoint {
  bucketStart: string;
  bucketEnd: string;
  groupBy: AggregateGroupBy;
  siteId: string;
  deviceId: string | null;
  deviceName: string | null;
  roomId: string | null;
  roomName: string | null;
  /** Mean power over the bucket, watts. */
  powerWAvg: number;
  /** Peak power in the bucket, watts. */
  powerWMax: number;
  /** Total energy in the bucket, kWh. */
  energyKwh: number;
  /** Estimated cost in INR for the energy in this bucket. */
  costInr: number;
  /** True: costInr is an estimate based on the configured tariff, not a utility bill. */
  costIsEstimate?: boolean;
  /** How many raw readings were folded into this bucket. */
  sampleCount: number;
  /** True when every contributing reading was simulated. */
  isSimulated: boolean;
}

/** Summary over a time window. */
export interface Summary {
  siteId: string;
  window: { from: string; to: string };
  totals: {
    /** Sum of the latest power reading of each device. */
    powerW: number;
    /** Total energy consumed in the window, kWh. */
    energyKwh: number;
    /** Estimated cost for the window, INR. */
    costInr: number;
    /** True: costInr is an estimate based on the configured tariff. */
    costIsEstimate?: boolean;
  };
  byDevice: Array<{
    deviceId: string;
    deviceName: string;
    roomId: string | null;
    roomName: string | null;
    category: DeviceCategory;
    status: DeviceStatus;
    isSimulated: boolean;
    powerW: number;
    energyKwh: number;
    costInr: number;
    lastSeenAt: string | null;
  }>;
  byRoom: Array<{
    roomId: string;
    roomName: string;
    powerW: number;
    energyKwh: number;
    costInr: number;
  }>;
  dataQuality: {
    /** True when ANY reading in the window was simulated. */
    simulated: boolean;
    simulatedReadings: number;
    realReadings: number;
    simulatedEnergyKwh: number;
    realEnergyKwh: number;
  };
}
