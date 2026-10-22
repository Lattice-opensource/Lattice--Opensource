import type { DatabaseSync } from 'node:sqlite';
import { toIso, round, addSeconds } from '../lib/time.js';
import { readingId } from '../lib/ids.js';
import { insertReading, deleteSimulatedOlderThan } from '../db/repositories/readings.js';
import { updateDeviceLastSeen, upsertDevice } from '../db/repositories/devices.js';
import { upsertRoom } from '../db/repositories/rooms.js';
import { upsertSite } from '../db/repositories/sites.js';

export interface DeviceProfile {
  id: string;
  siteId: string;
  roomId: string | null;
  roomName: string | null;
  name: string;
  category: import('@lattice/contracts').DeviceCategory;
  model: string | null;
  ratedPowerW: number | null;
  isSimulated: true;
  /** Time-of-day windows (UTC hours, [start,end) half-open) when the device is typically on. Empty = always-on-ish. */
  onWindows: Array<[number, number]>;
  baseW: number;
  standbyW: number;
  variance: number;
  /** Probability of being on outside onWindows (for cyclic devices like fridges). */
  offDuty: number;
}

export const SITE_ID = 'site_home_01';

export const ROOMS: Array<{ id: string; siteId: string; name: string }> = [
  { id: 'room_living_01', siteId: SITE_ID, name: 'Living Room' },
  { id: 'room_bed_01', siteId: SITE_ID, name: 'Bedroom' },
  { id: 'room_kitchen_01', siteId: SITE_ID, name: 'Kitchen' },
  { id: 'room_bath_01', siteId: SITE_ID, name: 'Bathroom' },
  { id: 'room_garage_01', siteId: SITE_ID, name: 'Garage' },
];

export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    id: 'dev_bed_ac_01', siteId: SITE_ID, roomId: 'room_bed_01', roomName: 'Bedroom',
    name: 'Bedroom AC', category: 'hvac', model: 'Voltas 1.5T Inverter', ratedPowerW: 1500,
    isSimulated: true, onWindows: [[13, 17], [21, 24], [0, 6]], baseW: 1100, standbyW: 12, variance: 0.12, offDuty: 0.05,
  },
  {
    id: 'dev_living_ac_01', siteId: SITE_ID, roomId: 'room_living_01', roomName: 'Living Room',
    name: 'Living Room AC', category: 'hvac', model: 'Daikin 2T', ratedPowerW: 1800,
    isSimulated: true, onWindows: [[12, 16], [18, 23]], baseW: 1500, standbyW: 15, variance: 0.1, offDuty: 0.04,
  },
  {
    id: 'dev_fridge_01', siteId: SITE_ID, roomId: 'room_kitchen_01', roomName: 'Kitchen',
    name: 'Refrigerator', category: 'kitchen', model: 'LG 260L', ratedPowerW: 150,
    isSimulated: true, onWindows: [], baseW: 130, standbyW: 0, variance: 0.08, offDuty: 0.35,
  },
  {
    id: 'dev_tv_01', siteId: SITE_ID, roomId: 'room_living_01', roomName: 'Living Room',
    name: 'Television', category: 'electronics', model: 'Samsung 55"', ratedPowerW: 120,
    isSimulated: true, onWindows: [[18, 23]], baseW: 110, standbyW: 2, variance: 0.05, offDuty: 0.02,
  },
  {
    id: 'dev_fan_01', siteId: SITE_ID, roomId: 'room_bed_01', roomName: 'Bedroom',
    name: 'Ceiling Fan', category: 'appliance', model: 'Havells 1200mm', ratedPowerW: 75,
    isSimulated: true, onWindows: [[21, 24], [0, 7]], baseW: 68, standbyW: 0, variance: 0.04, offDuty: 0.05,
  },
  {
    id: 'dev_induction_01', siteId: SITE_ID, roomId: 'room_kitchen_01', roomName: 'Kitchen',
    name: 'Induction Cooktop', category: 'kitchen', model: 'Prestige PIC', ratedPowerW: 2000,
    isSimulated: true, onWindows: [[7, 9], [12, 14], [19, 21]], baseW: 1600, standbyW: 0, variance: 0.15, offDuty: 0.02,
  },
  {
    id: 'dev_geyser_01', siteId: SITE_ID, roomId: 'room_bath_01', roomName: 'Bathroom',
    name: 'Water Heater', category: 'appliance', model: 'Bajaj 25L', ratedPowerW: 2000,
    isSimulated: true, onWindows: [[6, 8], [20, 22]], baseW: 1900, standbyW: 0, variance: 0.06, offDuty: 0.01,
  },
  {
    id: 'dev_main_meter_01', siteId: SITE_ID, roomId: null, roomName: null,
    name: 'Main Meter', category: 'other', model: 'Smart Meter v2', ratedPowerW: null,
    isSimulated: true, onWindows: [], baseW: 0, standbyW: 0, variance: 0, offDuty: 0,
  },
];

function hashSeed(seed: number, deviceId: string, tsMs: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < deviceId.length; i++) h = (Math.imul(h, 31) + deviceId.charCodeAt(i)) >>> 0;
  h = (Math.imul(h, 31) + (tsMs >>> 0)) >>> 0;
  // mix
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  let t = a >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function isOn(profile: DeviceProfile, date: Date, rng: () => number): boolean {
  const hour = date.getUTCHours();
  for (const [s, e] of profile.onWindows) {
    if (hour >= s && hour < e) return rng() > 0.05; // mostly on in window
  }
  // outside windows: cyclic duty
  return rng() < profile.offDuty;
}

function computePower(profile: DeviceProfile, date: Date): number {
  if (profile.id === 'dev_main_meter_01') return 0; // computed separately
  const rng = mulberry32(hashSeed(20261022, profile.id, date.getTime()));
  if (!isOn(profile, date, rng)) {
    return profile.standbyW;
  }
  const r2 = mulberry32(hashSeed(20261022, profile.id + ':v', date.getTime()));
  const factor = 1 + (r2() - 0.5) * profile.variance * 2;
  return Math.max(0, profile.baseW * factor);
}

export interface BackfillOptions {
  hours: number;
  intervalSeconds: number;
  seed: number;
}

export function backfillHistory(db: DatabaseSync, opts: BackfillOptions): void {
  const intervalMs = opts.intervalSeconds * 1000;
  const now = new Date();
  const endMs = Math.floor(now.getTime() / intervalMs) * intervalMs;
  const startMs = endMs - opts.hours * 3600 * 1000;

  const totals = new Map(DEVICE_PROFILES.map((p) => [p.id, 0]));

  for (let t = startMs; t < endMs; t += intervalMs) {
    const ts = new Date(t);
    const tsIso = toIso(ts);
    const intervalStart = toIso(new Date(t - intervalMs));

    // compute powers (meter = sum of others + losses)
    const powers = new Map<string, number>();
    for (const p of DEVICE_PROFILES) {
      if (p.id === 'dev_main_meter_01') continue;
      powers.set(p.id, computePower(p, ts));
    }
    const sumOthers = [...powers.values()].reduce((a, b) => a + b, 0);
    powers.set('dev_main_meter_01', round(sumOthers + 40 + sumOthers * 0.025, 2));

    for (const p of DEVICE_PROFILES) {
      const powerW = round(powers.get(p.id)!, 2);
      const energyKwh = round((powerW * opts.intervalSeconds) / 3_600_000, 4);
      const prevTotal = totals.get(p.id)!;
      const energyKwhTotal = round(prevTotal + energyKwh, 4);
      totals.set(p.id, energyKwhTotal);

      const vRng = mulberry32(hashSeed(opts.seed, p.id + ':volt', ts.getTime()));
      const voltageV = round(228 + vRng() * 6, 1);
      const currentA = powerW > 0 ? round(powerW / voltageV, 3) : 0;

      insertReading(db, {
        id: readingId(),
        deviceId: p.id,
        timestamp: tsIso,
        intervalStart,
        intervalSeconds: opts.intervalSeconds,
        powerW,
        energyKwh,
        energyKwhTotal,
        voltageV,
        currentA,
        isSimulated: true,
        source: 'simulator',
      });
    }
  }

  // update lastSeenAt + status for all devices
  const lastTs = toIso(new Date(endMs - intervalMs));
  for (const p of DEVICE_PROFILES) {
    updateDeviceLastSeen(db, p.id, lastTs, 'online');
  }
}

export interface LiveWriterOptions {
  liveIntervalSeconds: number;
  retentionSeconds: number;
  seed: number;
}

let liveTimer: NodeJS.Timeout | null = null;
const liveTotals = new Map<string, number>();

export function startLiveWriter(db: DatabaseSync, opts: LiveWriterOptions): () => void {
  // init totals from last readings
  for (const p of DEVICE_PROFILES) {
    const row = db
      .prepare('SELECT energy_kwh_total FROM readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1')
      .get(p.id) as { energy_kwh_total: number | null } | undefined;
    liveTotals.set(p.id, row?.energy_kwh_total ?? 0);
  }

  const tick = () => {
    try {
      const now = new Date();
      const tsIso = toIso(now);
      const intervalStart = toIso(addSeconds(now, -opts.liveIntervalSeconds));
      const powers = new Map<string, number>();
      for (const p of DEVICE_PROFILES) {
        if (p.id === 'dev_main_meter_01') continue;
        powers.set(p.id, computePower(p, now));
      }
      const sumOthers = [...powers.values()].reduce((a, b) => a + b, 0);
      powers.set('dev_main_meter_01', round(sumOthers + 40 + sumOthers * 0.025, 2));

      for (const p of DEVICE_PROFILES) {
        const powerW = round(powers.get(p.id)!, 2);
        const energyKwh = round((powerW * opts.liveIntervalSeconds) / 3_600_000, 4);
        const prevTotal = liveTotals.get(p.id) ?? 0;
        const energyKwhTotal = round(prevTotal + energyKwh, 4);
        liveTotals.set(p.id, energyKwhTotal);

        const vRng = mulberry32(hashSeed(opts.seed, p.id + ':volt', now.getTime()));
        const voltageV = round(228 + vRng() * 6, 1);
        const currentA = powerW > 0 ? round(powerW / voltageV, 3) : 0;

        insertReading(db, {
          id: readingId(),
          deviceId: p.id,
          timestamp: tsIso,
          intervalStart,
          intervalSeconds: opts.liveIntervalSeconds,
          powerW,
          energyKwh,
          energyKwhTotal,
          voltageV,
          currentA,
          isSimulated: true,
          source: 'simulator',
        });
        updateDeviceLastSeen(db, p.id, tsIso, 'online');
      }

      // retention prune: only the fine-grained live samples are pruned, the
      // coarse historical backfill (SIMULATION_HISTORY_HOURS) is preserved.
      const cutoff = toIso(addSeconds(now, -opts.retentionSeconds));
      deleteSimulatedOlderThan(db, cutoff, opts.liveIntervalSeconds);
    } catch (e) {
      console.error('live tick failed:', e);
    }
  };

  liveTimer = setInterval(tick, opts.liveIntervalSeconds * 1000);
  return stopLiveWriter;
}

export function stopLiveWriter(): void {
  if (liveTimer) {
    clearInterval(liveTimer);
    liveTimer = null;
  }
}

export function upsertSimulatedDevices(db: DatabaseSync, seed: number): void {
  void seed;
  upsertSite(db, {
    id: SITE_ID,
    name: 'Lattice Home',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    tariffJson: JSON.stringify({
      type: 'slab',
      unit: 'kWh',
      slabs: [
        { upToKwh: 100, rateInrPerKwh: 2.5 },
        { upToKwh: 400, rateInrPerKwh: 5.5 },
        { upToKwh: null, rateInrPerKwh: 7.5 },
      ],
    }),
  });

  for (const r of ROOMS) {
    upsertRoom(db, r);
  }

  const installedAt = '2026-05-01T00:00:00.000Z';
  for (const p of DEVICE_PROFILES) {
    upsertDevice(db, {
      id: p.id,
      siteId: p.siteId,
      roomId: p.roomId,
      name: p.name,
      category: p.category,
      model: p.model,
      ratedPowerW: p.ratedPowerW,
      status: 'online',
      isSimulated: true,
      installedAt,
    });
  }
}
