import type { DatabaseSync } from 'node:sqlite';
import type { Meter } from '../models/types.js';
import { toIso } from '../../lib/time.js';
import { makeId } from '../../lib/ids.js';

interface Row { id: string; site_id: string; name: string; type: string; unit: string; data_source: string | null; created_at: string; updated_at: string; }
function toMeter(r: Row): Meter { return { id: r.id, siteId: r.site_id, name: r.name, type: r.type, unit: r.unit, dataSource: r.data_source, createdAt: r.created_at, updatedAt: r.updated_at }; }

export function listMeters(db: DatabaseSync, siteId?: string): Meter[] {
  const sql = siteId ? 'SELECT * FROM meters WHERE site_id = ? ORDER BY name' : 'SELECT * FROM meters ORDER BY name';
  const rows = (siteId ? db.prepare(sql).all(siteId) : db.prepare(sql).all()) as unknown as Row[];
  return rows.map(toMeter);
}
export function getMeter(db: DatabaseSync, id: string): Meter | null {
  const r = db.prepare('SELECT * FROM meters WHERE id = ?').get(id) as Row | undefined;
  return r ? toMeter(r) : null;
}
export function createMeter(db: DatabaseSync, input: { siteId: string; name: string; type?: string; unit?: string; dataSource?: string | null }): Meter {
  const id = makeId('mtr'); const now = toIso(new Date());
  db.prepare('INSERT INTO meters (id, site_id, name, type, unit, data_source, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, input.siteId, input.name, input.type ?? 'electricity', input.unit ?? 'kWh', input.dataSource ?? null, now, now);
  return getMeter(db, id)!;
}
export function deleteMeter(db: DatabaseSync, id: string): boolean {
  const res = db.prepare('DELETE FROM meters WHERE id = ?').run(id);
  return Number(res.changes ?? 0) > 0;
}
