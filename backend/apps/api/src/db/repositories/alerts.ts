import type { DatabaseSync } from 'node:sqlite';
import type { Alert } from '@lattice/contracts';
import { toIso } from '../../lib/time.js';

interface AlertRow {
  id: string;
  site_id: string | null;
  building_id: string | null;
  floor_id: string | null;
  room_id: string | null;
  circuit_id: string | null;
  device_id: string | null;
  type: string;
  severity: string;
  status: string;
  title: string;
  observed_value: number | null;
  expected_value: number | null;
  additional_cost_inr: number | null;
  explanation: string;
  recommendation: string;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  dedup_key: string;
  created_at: string;
  updated_at: string;
}

function rowToAlert(row: AlertRow): Alert {
  return {
    id: row.id,
    siteId: row.site_id,
    buildingId: row.building_id,
    floorId: row.floor_id,
    roomId: row.room_id,
    circuitId: row.circuit_id,
    deviceId: row.device_id,
    type: row.type as Alert['type'],
    severity: row.severity as Alert['severity'],
    status: row.status as Alert['status'],
    title: row.title,
    observedValue: row.observed_value,
    expectedValue: row.expected_value,
    additionalCostInr: row.additional_cost_inr,
    explanation: row.explanation,
    recommendation: row.recommendation,
    detectedAt: row.detected_at,
    acknowledgedAt: row.acknowledged_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AlertFilters {
  siteId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  circuitId?: string;
  deviceId?: string;
  severity?: string;
  status?: string;
  type?: string;
  from?: string;
  to?: string;
}

export function listAlerts(db: DatabaseSync, filters: AlertFilters = {}): Alert[] {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (col: string, val?: string) => { if (val) { where.push(`${col} = ?`); params.push(val); } };
  add('site_id', filters.siteId);
  add('building_id', filters.buildingId);
  add('floor_id', filters.floorId);
  add('room_id', filters.roomId);
  add('circuit_id', filters.circuitId);
  add('device_id', filters.deviceId);
  add('severity', filters.severity);
  add('status', filters.status);
  add('type', filters.type);
  if (filters.from) { where.push('detected_at >= ?'); params.push(filters.from); }
  if (filters.to) { where.push('detected_at <= ?'); params.push(filters.to); }
  const sql = `SELECT * FROM alerts ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY detected_at DESC, id DESC`;
  const rows = db.prepare(sql).all(...(params as any)) as unknown as AlertRow[];
  return rows.map(rowToAlert);
}

export function getAlert(db: DatabaseSync, id: string): Alert | null {
  const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as AlertRow | undefined;
  return row ? rowToAlert(row) : null;
}

export function findActiveAlertByDedupKey(db: DatabaseSync, dedupKey: string): Alert | null {
  const row = db.prepare("SELECT * FROM alerts WHERE dedup_key = ? AND status IN ('active','acknowledged')").get(dedupKey) as AlertRow | undefined;
  return row ? rowToAlert(row) : null;
}

export function createAlert(db: DatabaseSync, alert: Omit<Alert, 'createdAt' | 'updatedAt'> & { dedupKey: string }): Alert {
  const now = toIso(new Date());
  const existing = findActiveAlertByDedupKey(db, alert.dedupKey);
  if (existing) return existing;
  db.prepare(`
    INSERT INTO alerts (id, site_id, building_id, floor_id, room_id, circuit_id, device_id, type, severity, status, title, observed_value, expected_value, additional_cost_inr, explanation, recommendation, detected_at, acknowledged_at, resolved_at, dedup_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    alert.id,
    alert.siteId,
    alert.buildingId,
    alert.floorId,
    alert.roomId,
    alert.circuitId,
    alert.deviceId,
    alert.type,
    alert.severity,
    alert.status,
    alert.title,
    alert.observedValue,
    alert.expectedValue,
    alert.additionalCostInr,
    alert.explanation,
    alert.recommendation,
    alert.detectedAt,
    alert.acknowledgedAt,
    alert.resolvedAt,
    alert.dedupKey,
    now,
    now,
  );
  return getAlert(db, alert.id)!;
}

export function acknowledgeAlert(db: DatabaseSync, id: string): Alert | null {
  const now = toIso(new Date());
  db.prepare("UPDATE alerts SET status = 'acknowledged', acknowledged_at = ?, updated_at = ? WHERE id = ? AND status = 'active'").run(now, now, id);
  return getAlert(db, id);
}

export function resolveAlert(db: DatabaseSync, id: string): Alert | null {
  const now = toIso(new Date());
  db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = ?, updated_at = ? WHERE id = ? AND status IN ('active','acknowledged')").run(now, now, id);
  return getAlert(db, id);
}