import type { DatabaseSync } from 'node:sqlite';
import type { AggregateGroupBy, AggregatePoint, Tariff } from '@lattice/contracts';
import { listAllReadings } from '../db/repositories/readings.js';
import { listDevices } from '../db/repositories/devices.js';
import { getSiteTariffJson } from '../db/repositories/sites.js';
import { costForEnergy, round2 } from './cost.js';
import { toIso } from '../lib/time.js';

export interface AggregateParams {
  siteId?: string;
  roomId?: string;
  deviceId?: string;
  from: string;
  to: string;
  bucket: '15m' | 'hour' | 'day' | 'week';
  groupBy: AggregateGroupBy;
  tariff: Tariff;
}

function tzOffsetMinutes(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
  const parts = dtf.formatToParts(date);
  const off = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = off.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hh = parseInt(m[2] ?? '0', 10);
  const mm = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hh * 60 + mm);
}

function bucketDurationMs(bucket: AggregateParams['bucket']): number {
  switch (bucket) {
    case '15m': return 15 * 60 * 1000;
    case 'hour': return 60 * 60 * 1000;
    case 'day': return 24 * 60 * 60 * 1000;
    case 'week': return 7 * 24 * 60 * 60 * 1000;
  }
}

function bucketStartUtc(ts: string, bucket: AggregateParams['bucket'], tz: string): { start: Date; end: Date } {
  const d = new Date(ts);
  const off = tzOffsetMinutes(tz, d);
  const localMs = d.getTime() + off * 60000;
  const local = new Date(localMs);
  let y = local.getUTCFullYear();
  let mo = local.getUTCMonth();
  let da = local.getUTCDate();
  let h = 0;
  let mi = 0;
  if (bucket === '15m' || bucket === 'hour') {
    h = local.getUTCHours();
    mi = bucket === '15m' ? Math.floor(local.getUTCMinutes() / 15) * 15 : 0;
  }
  if (bucket === 'day' || bucket === 'week') {
    h = 0;
    mi = 0;
  }
  if (bucket === 'week') {
    const dow = local.getUTCDay();
    const diffToMonday = dow === 0 ? 6 : dow - 1;
    const monday = new Date(localMs);
    monday.setUTCDate(monday.getUTCDate() - diffToMonday);
    y = monday.getUTCFullYear();
    mo = monday.getUTCMonth();
    da = monday.getUTCDate();
  }
  const localBucketMs = Date.UTC(y, mo, da, h, mi, 0, 0);
  const utcBucketMs = localBucketMs - off * 60000;
  const start = new Date(utcBucketMs);
  const end = new Date(utcBucketMs + bucketDurationMs(bucket));
  return { start, end };
}

interface GroupKey {
  bucketStart: string;
  groupBy: AggregateGroupBy;
  siteId: string;
  deviceId: string | null;
  deviceName: string | null;
  roomId: string | null;
  roomName: string | null;
}

export function aggregate(db: DatabaseSync, params: AggregateParams): AggregatePoint[] {
  const devices = listDevices(db, { siteId: params.siteId, roomId: params.roomId });
  const deviceMap = new Map(devices.map((d) => [d.id, d]));
  const readings = listAllReadings(db, {
    siteId: params.siteId,
    roomId: params.roomId,
    deviceId: params.deviceId,
    from: params.from,
    to: params.to,
  });

  const siteRow = params.siteId
    ? (db.prepare('SELECT timezone FROM sites WHERE id = ?').get(params.siteId) as { timezone: string } | undefined)
    : undefined;
  const siteTz = siteRow?.timezone ?? 'Asia/Kolkata';

  const groups = new Map<string, {
    key: GroupKey;
    powerSum: number;
    powerMax: number;
    energyKwh: number;
    costInr: number;
    sampleCount: number;
    simulatedCount: number;
  }>();

  for (const r of readings) {
    const dev = deviceMap.get(r.deviceId);
    if (!dev) continue;
    if (params.roomId && dev.roomId !== params.roomId) continue;
    if (params.deviceId && r.deviceId !== params.deviceId) continue;

    const { start, end } = bucketStartUtc(r.timestamp, params.bucket, siteTz);
    const bucketStart = toIso(start);

    let groupDeviceId: string | null = r.deviceId;
    let groupDeviceName: string | null = dev.name;
    let groupRoomId: string | null = dev.roomId;
    let groupRoomName: string | null = dev.roomName;
    if (params.groupBy === 'room') {
      groupDeviceId = null;
      groupDeviceName = null;
    } else if (params.groupBy === 'site') {
      groupDeviceId = null;
      groupDeviceName = null;
      groupRoomId = null;
      groupRoomName = null;
    }

    const key = `${bucketStart}|${params.groupBy}|${groupDeviceId ?? ''}|${groupRoomId ?? ''}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key: {
          bucketStart,
          groupBy: params.groupBy,
          siteId: dev.siteId,
          deviceId: groupDeviceId,
          deviceName: groupDeviceName,
          roomId: groupRoomId,
          roomName: groupRoomName,
        },
        powerSum: 0,
        powerMax: 0,
        energyKwh: 0,
        costInr: 0,
        sampleCount: 0,
        simulatedCount: 0,
      };
      groups.set(key, g);
    }
    g.powerSum += r.powerW;
    g.powerMax = Math.max(g.powerMax, r.powerW);
    const ek = r.energyKwh ?? 0;
    g.energyKwh += ek;
    g.costInr += costForEnergy(params.tariff, ek);
    g.sampleCount += 1;
    if (r.isSimulated) g.simulatedCount += 1;
    // store bucketEnd via end (same for all in group) — recompute later
    void end;
  }

  const result: AggregatePoint[] = [];
  for (const g of groups.values()) {
    const { start, end } = bucketStartUtc(g.key.bucketStart, params.bucket, siteTz);
    void start;
    result.push({
      bucketStart: g.key.bucketStart,
      bucketEnd: toIso(end),
      groupBy: g.key.groupBy,
      siteId: g.key.siteId,
      deviceId: g.key.deviceId,
      deviceName: g.key.deviceName,
      roomId: g.key.roomId,
      roomName: g.key.roomName,
      powerWAvg: g.sampleCount > 0 ? round2(g.powerSum / g.sampleCount) : 0,
      powerWMax: round2(g.powerMax),
      energyKwh: round2(g.energyKwh),
      costInr: round2(g.costInr),
      sampleCount: g.sampleCount,
      isSimulated: g.simulatedCount === g.sampleCount,
    });
  }
  result.sort((a, b) => a.bucketStart.localeCompare(b.bucketStart));
  return result;
}

export function getSiteTimezone(db: DatabaseSync, siteId: string): string {
  const sites = db.prepare('SELECT timezone FROM sites WHERE id = ?').get(siteId) as { timezone: string } | undefined;
  return sites?.timezone ?? 'Asia/Kolkata';
}

export function resolveTariff(db: DatabaseSync, siteId: string): Tariff {
  const json = getSiteTariffJson(db, siteId);
  if (json) {
    try {
      return JSON.parse(json) as Tariff;
    } catch {
      /* fall through */
    }
  }
  return {
    type: 'slab',
    unit: 'kWh',
    slabs: [
      { upToKwh: 100, rateInrPerKwh: 2.5 },
      { upToKwh: 400, rateInrPerKwh: 5.5 },
      { upToKwh: null, rateInrPerKwh: 7.5 },
    ],
  };
}
