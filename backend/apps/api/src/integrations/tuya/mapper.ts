import type { Reading } from '@lattice/contracts';
import { round } from '../../lib/time.js';
import type { TuyaStatusItem, TuyaDeviceStatusResponse } from './types.js';

export interface TuyaReadingMapOptions {
  /** Lattice device id to attribute the reading to. */
  deviceId: string;
  /** Optional Tuya device id (defaults to deviceId). */
  tuyaDeviceId?: string;
  /** ISO-8601 timestamp for the reading; defaults to now. */
  timestamp?: string;
  /** Tuya status payload: either an array of status items or a response envelope. */
  status: TuyaStatusItem[] | TuyaDeviceStatusResponse;
  /** Sampling interval in seconds; used to derive intervalStart. Defaults to 0. */
  intervalSeconds?: number;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return null;
}

function normalizeStatus(status: TuyaReadingMapOptions['status']): TuyaStatusItem[] {
  if (Array.isArray(status)) return status;
  if (status && Array.isArray((status as TuyaDeviceStatusResponse).result)) {
    return (status as TuyaDeviceStatusResponse).result as TuyaStatusItem[];
  }
  return [];
}

function pick(statusMap: Map<string, unknown>, codes: string[]): unknown {
  for (const code of codes) {
    if (statusMap.has(code)) return statusMap.get(code);
  }
  return undefined;
}

/**
 * Convert a Tuya device status payload into a Lattice Reading.
 *
 * Returns null when the required power measurement is unavailable, so callers
 * never fabricate values.
 */
export function mapTuyaStatusToReading(opts: TuyaReadingMapOptions): Reading | null {
  const items = normalizeStatus(opts.status);
  const statusMap = new Map(items.map((i) => [i.code, i.value]));

  // Power (Tuya often reports cur_power in 0.1 W).
  let powerW: number | null = null;
  const rawPower = pick(statusMap, ['cur_power', 'curPower', 'power', 'active_power', 'w']);
  const nPower = asNumber(rawPower);
  if (nPower !== null) {
    if (statusMap.has('cur_power') || statusMap.has('curPower')) {
      powerW = nPower / 10;
    } else {
      powerW = nPower;
    }
  }

  if (powerW === null || !Number.isFinite(powerW) || powerW < 0) {
    return null;
  }

  // Voltage (Tuya often reports cur_voltage in 0.1 V).
  let voltageV: number | null = null;
  const rawVoltage = pick(statusMap, ['cur_voltage', 'curVoltage', 'voltage', 'volt']);
  const nVoltage = asNumber(rawVoltage);
  if (nVoltage !== null) {
    if (statusMap.has('cur_voltage') || statusMap.has('curVoltage')) {
      voltageV = nVoltage / 10;
    } else {
      voltageV = nVoltage;
    }
  }

  // Current (Tuya often reports cur_current in mA).
  let currentA: number | null = null;
  const rawCurrent = pick(statusMap, ['cur_current', 'curCurrent', 'current', 'amp']);
  const nCurrent = asNumber(rawCurrent);
  if (nCurrent !== null) {
    if (statusMap.has('cur_current') || statusMap.has('curCurrent')) {
      currentA = nCurrent / 1000;
    } else {
      currentA = nCurrent;
    }
  }

  // Cumulative energy register (Tuya often reports add_ele in 0.01 kWh).
  let energyKwhTotal: number | null = null;
  const rawEnergyTotal = pick(statusMap, ['add_ele', 'addEle', 'total_forward_energy', 'total_energy', 'energy_total']);
  const nEnergyTotal = asNumber(rawEnergyTotal);
  if (nEnergyTotal !== null) {
    if (statusMap.has('add_ele') || statusMap.has('addEle')) {
      energyKwhTotal = nEnergyTotal / 100;
    } else {
      energyKwhTotal = nEnergyTotal;
    }
  }

  const intervalSeconds = opts.intervalSeconds ?? 0;

  // Tuya status does not provide interval energy directly. Derive it from the
  // measured power and the sampling interval (consistent with the simulator),
  // so the dashboard can show accumulating energy. Null only when no interval.
  const energyKwh: number | null =
    intervalSeconds > 0 ? (powerW * intervalSeconds) / 3_600_000 : null;

  const timestamp = opts.timestamp ?? new Date().toISOString();
  const tsMs = Date.parse(timestamp);
  const safeTs = Number.isNaN(tsMs) ? new Date().toISOString() : timestamp;
  const safeTsMs = Number.isNaN(tsMs) ? Date.now() : tsMs;
  const intervalStart = new Date(safeTsMs - intervalSeconds * 1000).toISOString();

  return {
    id: `tuya_${opts.deviceId}_${safeTsMs}`,
    deviceId: opts.deviceId,
    timestamp: safeTs,
    intervalStart,
    intervalSeconds,
    powerW: round(powerW, 2),
    energyKwh,
    energyKwhTotal: energyKwhTotal !== null ? round(energyKwhTotal, 4) : null,
    voltageV: voltageV !== null ? round(voltageV, 1) : null,
    currentA: currentA !== null ? round(currentA, 3) : null,
    isSimulated: false,
    source: 'device',
  };
}

export const mapTuyaDeviceStatus = mapTuyaStatusToReading;
export const tuyaStatusToReading = mapTuyaStatusToReading;