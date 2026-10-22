import type { DeviceSummary, EnergyReading, PowerPoint } from "./energyApi";

const MS_PER_MINUTE = 60_000;

/** Offset (ms) of a time zone at a given instant. */
export function timeZoneOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const hour = get("hour") === 24 ? 0 : get("hour");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

/** Start of the local calendar day in the given IANA time zone. */
export function startOfDayInTimeZone(timeZone: string, date: Date): Date {
  const offset = timeZoneOffsetMs(timeZone, date);
  const local = new Date(date.getTime() + offset);
  const startOfLocalDay = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  return new Date(startOfLocalDay - offset);
}

export interface WholeSiteTotals {
  powerW: number;
  energyKwh: number;
  costInr: number;
  source: "meter" | "devices";
  meterDeviceId: string | null;
}

/**
 * Resolves whole-site figures without double counting.
 *
 * A site meter (a device that is not attached to a room) already reports the
 * total site load, so appliance readings must not be added on top of it.
 */
export function resolveWholeSite(devices: DeviceSummary[]): WholeSiteTotals {
  const appliances = devices.filter((d) => d.roomName !== null);
  const meterCandidates = devices.filter((d) => d.roomName === null);
  const appliancePower = appliances.reduce((sum, d) => sum + d.powerW, 0);

  const meter =
    meterCandidates.length === 1 &&
    (appliances.length === 0 || meterCandidates[0].powerW >= appliancePower * 0.9)
      ? meterCandidates[0]
      : null;

  if (meter) {
    return {
      powerW: meter.powerW,
      energyKwh: meter.energyKwh,
      costInr: meter.costInr,
      source: "meter",
      meterDeviceId: meter.deviceId,
    };
  }

  const basis = appliances.length > 0 ? appliances : devices;
  return {
    powerW: basis.reduce((sum, d) => sum + d.powerW, 0),
    energyKwh: basis.reduce((sum, d) => sum + d.energyKwh, 0),
    costInr: basis.reduce((sum, d) => sum + d.costInr, 0),
    source: "devices",
    meterDeviceId: null,
  };
}

/**
 * Buckets raw readings into a power series.
 * Interval energy is used, never the cumulative `energyKwhTotal` register.
 */
export function buildPowerSeries(
  readings: EnergyReading[],
  options: { bucketMs?: number; excludeDeviceIds?: string[] } = {},
): PowerPoint[] {
  const bucketMs = options.bucketMs ?? 15 * MS_PER_MINUTE;
  const excluded = new Set(options.excludeDeviceIds ?? []);
  const buckets = new Map<number, { at: number; powerW: number }>();

  for (const r of readings) {
    if (r.deviceId !== undefined && excluded.has(r.deviceId)) continue;
    const at = new Date(r.timestamp).getTime();
    const bucket = Math.floor(at / bucketMs) * bucketMs;
    const existing = buckets.get(bucket);
    if (existing) {
      existing.powerW += r.powerW;
    } else {
      buckets.set(bucket, { at, powerW: r.powerW });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.at - b.at)
    .map((b) => ({ timestamp: new Date(b.at).toISOString(), powerW: b.powerW }));
}
