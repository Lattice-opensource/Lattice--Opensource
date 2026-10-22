import type { DatabaseSync } from 'node:sqlite';
import type { Reading, ReadingSource } from '@lattice/contracts';
import { toIso } from '../../lib/time.js';

interface ReadingRow {
  id: string;
  device_id: string;
  timestamp: string;
  interval_start: string;
  interval_seconds: number;
  power_w: number;
  energy_kwh: number | null;
  energy_kwh_total: number | null;
  voltage_v: number | null;
  current_a: number | null;
  is_simulated: number;
  source: string;
}

function rowToReading(row: ReadingRow): Reading {
  return {
    id: row.id,
    deviceId: row.device_id,
    timestamp: row.timestamp,
    intervalStart: row.interval_start,
    intervalSeconds: row.interval_seconds,
    powerW: row.power_w,
    energyKwh: row.energy_kwh,
    energyKwhTotal: row.energy_kwh_total,
    voltageV: row.voltage_v,
    currentA: row.current_a,
    isSimulated: row.is_simulated === 1,
    source: row.source as ReadingSource,
  };
}

export interface ReadingFilters {
  deviceId?: string;
  roomId?: string;
  siteId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

export function listReadings(db: DatabaseSync, f: ReadingFilters = {}): { rows: Reading[]; total: number } {
  const joins: string[] = ['JOIN devices d ON d.id = r.device_id'];
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.deviceId) {
    where.push('r.device_id = ?');
    params.push(f.deviceId);
  }
  if (f.roomId) {
    where.push('d.room_id = ?');
    params.push(f.roomId);
  }
  if (f.siteId) {
    where.push('d.site_id = ?');
    params.push(f.siteId);
  }
  if (f.from) {
    where.push('r.timestamp >= ?');
    params.push(f.from);
  }
  if (f.to) {
    where.push('r.timestamp <= ?');
    params.push(f.to);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const countSql = `SELECT COUNT(*) AS n FROM readings r ${joins.join(' ')} ${whereSql}`;
  const total = (db.prepare(countSql).get(...(params as any)) as { n: number }).n;

  const limit = Math.min(Math.max(f.limit ?? 200, 1), 1000);
  const offset = Math.max(f.offset ?? 0, 0);
  const order = f.order === 'desc' ? 'DESC' : 'ASC';
  const sql = `SELECT r.* FROM readings r ${joins.join(' ')} ${whereSql} ORDER BY r.timestamp ${order}, r.device_id ${order} LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...(params as any), limit, offset) as unknown as ReadingRow[];
  return { rows: rows.map(rowToReading), total };
}

export function insertReading(
  db: DatabaseSync,
  r: {
    id: string;
    deviceId: string;
    timestamp: string;
    intervalStart: string;
    intervalSeconds: number;
    powerW: number;
    energyKwh: number | null;
    energyKwhTotal: number | null;
    voltageV: number | null;
    currentA: number | null;
    isSimulated: boolean;
    source: ReadingSource;
  },
): void {
  db.prepare(
    `INSERT OR IGNORE INTO readings
     (id, device_id, timestamp, interval_start, interval_seconds, power_w, energy_kwh, energy_kwh_total, voltage_v, current_a, is_simulated, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    r.id,
    r.deviceId,
    r.timestamp,
    r.intervalStart,
    r.intervalSeconds,
    r.powerW,
    r.energyKwh,
    r.energyKwhTotal,
    r.voltageV,
    r.currentA,
    r.isSimulated ? 1 : 0,
    r.source,
  );
}

export function latestPerDevice(
  db: DatabaseSync,
  filters: { siteId?: string; deviceId?: string } = {},
): Reading[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.siteId) {
    where.push('d.site_id = ?');
    params.push(filters.siteId);
  }
  if (filters.deviceId) {
    where.push('r.device_id = ?');
    params.push(filters.deviceId);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  // Latest reading per device: correlated subquery on timestamp.
  const sql = `
    SELECT r.* FROM readings r
    JOIN devices d ON d.id = r.device_id
    ${whereSql}
    AND r.timestamp = (
      SELECT MAX(r2.timestamp) FROM readings r2 WHERE r2.device_id = r.device_id
    )
    ORDER BY d.name`;
  const rows = db.prepare(sql).all(...(params as any)) as unknown as ReadingRow[];
  return rows.map(rowToReading);
}

export interface SummaryResult {
  window: { from: string; to: string };
  siteId: string;
  totals: { powerW: number; energyKwh: number; costInr: number };
  byDevice: Array<{
    deviceId: string;
    deviceName: string;
    roomId: string | null;
    roomName: string | null;
    category: string;
    status: string;
    isSimulated: boolean;
    powerW: number;
    energyKwh: number;
    costInr: number;
    lastSeenAt: string | null;
  }>;
  byRoom: Array<{ roomId: string; roomName: string; powerW: number; energyKwh: number; costInr: number }>;
  dataQuality: {
    simulated: boolean;
    simulatedReadings: number;
    realReadings: number;
    simulatedEnergyKwh: number;
    realEnergyKwh: number;
  };
}

export function deleteSimulatedOlderThan(
  db: DatabaseSync,
  cutoffIso: string,
  maxIntervalSeconds?: number,
): number {
  if (maxIntervalSeconds === undefined) {
    const res = db.prepare('DELETE FROM readings WHERE is_simulated = 1 AND timestamp < ?').run(cutoffIso);
    return Number(res.changes ?? 0);
  }
  // Only prune fine-grained live samples; coarse historical backfill rows are kept.
  const res = db
    .prepare('DELETE FROM readings WHERE is_simulated = 1 AND timestamp < ? AND interval_seconds <= ?')
    .run(cutoffIso, maxIntervalSeconds);
  return Number(res.changes ?? 0);
}

export function listAllReadings(db: DatabaseSync, f: ReadingFilters = {}): Reading[] {
  const joins = ['JOIN devices d ON d.id = r.device_id'];
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.deviceId) { where.push('r.device_id = ?'); params.push(f.deviceId); }
  if (f.roomId) { where.push('d.room_id = ?'); params.push(f.roomId); }
  if (f.siteId) { where.push('d.site_id = ?'); params.push(f.siteId); }
  if (f.from) { where.push('r.timestamp >= ?'); params.push(f.from); }
  if (f.to) { where.push('r.timestamp <= ?'); params.push(f.to); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const sql = `SELECT r.* FROM readings r ${joins.join(' ')} ${whereSql} ORDER BY r.timestamp ASC`;
  const rows = db.prepare(sql).all(...(params as any)) as unknown as ReadingRow[];
  return rows.map(rowToReading);
}

export function countReadings(db: DatabaseSync): number {
  const r = db.prepare('SELECT COUNT(*) AS n FROM readings').get() as { n: number };
  return r.n;
}
