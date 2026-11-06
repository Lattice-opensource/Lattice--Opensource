import type { DatabaseSync } from 'node:sqlite';
import { toIso } from '../../../lib/time.js';
import { makeId } from '../../../lib/ids.js';

export type EntityType = 'building' | 'floor' | 'room' | 'circuit' | 'meter' | 'appliance' | 'device';
export type MeasurementSource = 'measured' | 'estimated' | 'simulated';

export interface EnergyReading {
  id: string;
  entityType: EntityType;
  entityId: string;
  timestamp: string;
  powerW: number | null;
  energyKwh: number | null;
  measurementSource: MeasurementSource;
  isSimulated: boolean;
  createdAt: string;
}

interface Row {
  id: string; entity_type: string; entity_id: string; timestamp: string;
  power_w: number | null; energy_kwh: number | null; measurement_source: string;
  is_simulated: number; created_at: string;
}

function toReading(r: Row): EnergyReading {
  return { id: r.id, entityType: r.entity_type as EntityType, entityId: r.entity_id, timestamp: r.timestamp,
    powerW: r.power_w, energyKwh: r.energy_kwh, measurementSource: r.measurement_source as MeasurementSource,
    isSimulated: r.is_simulated === 1, createdAt: r.created_at };
}

export function insertEnergyReading(db: DatabaseSync, input: {
  entityType: EntityType; entityId: string; timestamp: string;
  powerW?: number | null; energyKwh?: number | null;
  measurementSource?: MeasurementSource; isSimulated?: boolean;
}): EnergyReading {
  const id = makeId('er'); const now = toIso(new Date());
  db.prepare('INSERT INTO energy_readings (id, entity_type, entity_id, timestamp, power_w, energy_kwh, measurement_source, is_simulated, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, input.entityType, input.entityId, input.timestamp, input.powerW ?? null, input.energyKwh ?? null,
         input.measurementSource ?? 'measured', input.isSimulated ? 1 : 0, now);
  const r = db.prepare('SELECT * FROM energy_readings WHERE id = ?').get(id) as unknown as Row;
  return toReading(r);
}

export function listEnergyReadings(db: DatabaseSync, filters: { entityType?: EntityType; entityId?: string; from?: string; to?: string; limit?: number }): EnergyReading[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.entityType) { where.push('entity_type = ?'); params.push(filters.entityType); }
  if (filters.entityId) { where.push('entity_id = ?'); params.push(filters.entityId); }
  if (filters.from) { where.push('timestamp >= ?'); params.push(filters.from); }
  if (filters.to) { where.push('timestamp <= ?'); params.push(filters.to); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const limit = Math.min(filters.limit ?? 1000, 5000);
  const sql = `SELECT * FROM energy_readings ${whereSql} ORDER BY timestamp ASC LIMIT ?`;
  const rows = db.prepare(sql).all(...(params as any[]), limit) as unknown as Row[];
  return rows.map(toReading);
}

export function latestEnergyReading(db: DatabaseSync, entityType: EntityType, entityId: string): EnergyReading | null {
  const r = db.prepare('SELECT * FROM energy_readings WHERE entity_type = ? AND entity_id = ? ORDER BY timestamp DESC LIMIT 1').get(entityType, entityId) as Row | undefined;
  return r ? toReading(r) : null;
}
