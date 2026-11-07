import type { DatabaseSync } from 'node:sqlite';
import { toIso, round, addSeconds } from '../lib/time.js';
import { readingId } from '../lib/ids.js';
import { insertReading, deleteSimulatedOlderThan } from '../db/repositories/readings.js';
import { updateDeviceLastSeen, upsertDevice } from '../db/repositories/devices.js';
import { upsertRoom } from '../db/repositories/rooms.js';
import { upsertSite } from '../db/repositories/sites.js';
import { upsertBuilding, upsertCircuit, upsertFloor } from '../db/repositories/hierarchy.js';
import { detectAlerts } from './alerts.js';

export interface DeviceProfile {
  id: string;
  siteId: string;
  roomId: string | null;
  circuitId: string | null;
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
export const BUILDING_ID = 'building_academic_01';
export const FLOORS = [
  { id: 'floor_ground_01', buildingId: BUILDING_ID, name: 'Ground Floor', level: 0 },
  { id: 'floor_first_01', buildingId: BUILDING_ID, name: 'First Floor', level: 1 },
];

export const ROOMS: Array<{ id: string; siteId: string; buildingId: string; floorId: string; name: string }> = [
  { id: 'room_living_01', siteId: SITE_ID, buildingId: BUILDING_ID, floorId: 'floor_ground_01', name: 'Computer Laboratory' },
  { id: 'room_bed_01', siteId: SITE_ID, buildingId: BUILDING_ID, floorId: 'floor_first_01', name: 'Classroom Block A' },
  { id: 'room_kitchen_01', siteId: SITE_ID, buildingId: BUILDING_ID, floorId: 'floor_first_01', name: 'Library' },
  { id: 'room_bath_01', siteId: SITE_ID, buildingId: BUILDING_ID, floorId: 'floor_ground_01', name: 'Auditorium' },
  { id: 'room_garage_01', siteId: SITE_ID, buildingId: BUILDING_ID, floorId: 'floor_ground_01', name: 'Administrative Office' },
  { id: 'room_corridor_01', siteId: SITE_ID, buildingId: BUILDING_ID, floorId: 'floor_first_01', name: 'First Floor Corridor' },
  { id: 'room_common_01', siteId: SITE_ID, buildingId: BUILDING_ID, floorId: 'floor_ground_01', name: 'Student Common Area' },
];

export const CIRCUITS = ROOMS.map((room) => ({ id: `circuit_${room.id.slice(5)}`, siteId: SITE_ID, buildingId: room.buildingId, floorId: room.floorId, roomId: room.id, name: `${room.name} circuit` }));

export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    id: 'dev_bed_ac_01', siteId: SITE_ID, roomId: 'room_bed_01', circuitId: 'circuit_bed_01', roomName: 'Classroom Block A',
    name: 'Classroom HVAC', category: 'hvac', model: 'Campus HVAC', ratedPowerW: 1500,
    isSimulated: true, onWindows: [[13, 17], [21, 24], [0, 6]], baseW: 1100, standbyW: 12, variance: 0.12, offDuty: 0.05,
  },
  {
    id: 'dev_living_ac_01', siteId: SITE_ID, roomId: 'room_living_01', circuitId: 'circuit_living_01', roomName: 'Computer Laboratory',
    name: 'Computer Lab HVAC', category: 'hvac', model: 'Campus HVAC', ratedPowerW: 1800,
    isSimulated: true, onWindows: [[12, 16], [18, 23]], baseW: 1500, standbyW: 15, variance: 0.1, offDuty: 0.04,
  },
  {
    id: 'dev_fridge_01', siteId: SITE_ID, roomId: 'room_kitchen_01', circuitId: 'circuit_kitchen_01', roomName: 'Library',
    name: 'Library Lighting', category: 'lighting', model: 'LED lighting bank', ratedPowerW: 150,
    isSimulated: true, onWindows: [], baseW: 130, standbyW: 0, variance: 0.08, offDuty: 0.35,
  },
  {
    id: 'dev_tv_01', siteId: SITE_ID, roomId: 'room_living_01', circuitId: 'circuit_living_01', roomName: 'Computer Laboratory',
    name: 'Laboratory Computers', category: 'electronics', model: 'Computer workstation bank', ratedPowerW: 120,
    isSimulated: true, onWindows: [[18, 23]], baseW: 110, standbyW: 2, variance: 0.05, offDuty: 0.02,
  },
  {
    id: 'dev_fan_01', siteId: SITE_ID, roomId: 'room_garage_01', circuitId: 'circuit_garage_01', roomName: 'Administrative Office',
    name: 'Office Equipment', category: 'electronics', model: 'Office equipment bank', ratedPowerW: 75,
    isSimulated: true, onWindows: [[21, 24], [0, 7]], baseW: 68, standbyW: 0, variance: 0.04, offDuty: 0.05,
  },
  {
    id: 'dev_induction_01', siteId: SITE_ID, roomId: 'room_living_01', circuitId: 'circuit_living_01', roomName: 'Computer Laboratory',
    name: 'Laboratory Equipment', category: 'appliance', model: 'Laboratory equipment bank', ratedPowerW: 2000,
    isSimulated: true, onWindows: [[7, 9], [12, 14], [19, 21]], baseW: 1600, standbyW: 0, variance: 0.15, offDuty: 0.02,
  },
  {
    id: 'dev_geyser_01', siteId: SITE_ID, roomId: 'room_bath_01', circuitId: 'circuit_bath_01', roomName: 'Auditorium',
    name: 'Auditorium HVAC', category: 'hvac', model: 'Auditorium HVAC', ratedPowerW: 2000,
    isSimulated: true, onWindows: [[6, 8], [20, 22]], baseW: 1900, standbyW: 0, variance: 0.06, offDuty: 0.01,
  },
  {
    id: 'dev_corridor_lights_01', siteId: SITE_ID, roomId: 'room_corridor_01', circuitId: 'circuit_corridor_01', roomName: 'First Floor Corridor',
    name: 'Corridor Lighting', category: 'lighting', model: 'LED corridor lighting', ratedPowerW: 400,
    isSimulated: true, onWindows: [[6, 18]], baseW: 320, standbyW: 10, variance: 0.05, offDuty: 0.02,
  },
  {
    id: 'dev_common_area_01', siteId: SITE_ID, roomId: 'room_common_01', circuitId: 'circuit_common_01', roomName: 'Student Common Area',
    name: 'Common Area Ventilation', category: 'appliance', model: 'Ventilation bank', ratedPowerW: 900,
    isSimulated: true, onWindows: [[7, 18]], baseW: 700, standbyW: 20, variance: 0.08, offDuty: 0.02,
  },
  {
    id: 'dev_main_meter_01', siteId: SITE_ID, roomId: null, circuitId: null, roomName: null,
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

      // retention prune: only fine-grained live samples are pruned.
      const cutoff = toIso(addSeconds(now, -opts.retentionSeconds));
      deleteSimulatedOlderThan(db, cutoff, opts.liveIntervalSeconds);

      setImmediate(() => {
        try { detectAlerts(db); } catch (e) { console.error('alert detection failed:', e); }
      });
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

  upsertBuilding(db, { id: BUILDING_ID, siteId: SITE_ID, name: 'Academic Block' });
  for (const floor of FLOORS) upsertFloor(db, floor);
  for (const r of ROOMS) upsertRoom(db, r);
  for (const circuit of CIRCUITS) upsertCircuit(db, circuit);

  const installedAt = '2026-05-01T00:00:00.000Z';
  for (const p of DEVICE_PROFILES) {
    upsertDevice(db, {
      id: p.id,
      siteId: p.siteId,
      roomId: p.roomId,
      circuitId: p.circuitId,
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
