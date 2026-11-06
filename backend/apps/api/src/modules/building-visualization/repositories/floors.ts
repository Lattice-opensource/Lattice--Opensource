import type { DatabaseSync } from 'node:sqlite';
import type { Floor } from '../models/types.js';
import { toIso } from '../../../lib/time.js';
import { makeId } from '../../../lib/ids.js';

interface Row { id: string; building_id: string; level: number; name: string; blueprint_ref: string | null; created_at: string; updated_at: string; }
function toFloor(r: Row): Floor { return { id: r.id, buildingId: r.building_id, level: r.level, name: r.name, blueprintRef: r.blueprint_ref, createdAt: r.created_at, updatedAt: r.updated_at }; }

export function listFloors(db: DatabaseSync, buildingId: string): Floor[] {
  const rows = db.prepare('SELECT * FROM floors WHERE building_id = ? ORDER BY level').all(buildingId) as unknown as Row[];
  return rows.map(toFloor);
}
export function getFloor(db: DatabaseSync, id: string): Floor | null {
  const r = db.prepare('SELECT * FROM floors WHERE id = ?').get(id) as Row | undefined;
  return r ? toFloor(r) : null;
}
export function createFloor(db: DatabaseSync, input: { buildingId: string; level: number; name: string; blueprintRef?: string | null }): Floor {
  const id = makeId('flr'); const now = toIso(new Date());
  db.prepare('INSERT INTO floors (id, building_id, level, name, blueprint_ref, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, input.buildingId, input.level, input.name, input.blueprintRef ?? null, now, now);
  return getFloor(db, id)!;
}
export function deleteFloor(db: DatabaseSync, id: string): boolean {
  const res = db.prepare('DELETE FROM floors WHERE id = ?').run(id);
  return Number(res.changes ?? 0) > 0;
}
