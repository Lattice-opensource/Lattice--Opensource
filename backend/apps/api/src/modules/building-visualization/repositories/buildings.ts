import type { DatabaseSync } from 'node:sqlite';
import type { Building } from '../models/types.js';
import { toIso } from '../../lib/time.js';
import { makeId } from '../../lib/ids.js';

interface Row {
  id: string; site_id: string; name: string; address: string | null; description: string | null;
  floor_count: number; created_at: string; updated_at: string;
}

function toBuilding(r: Row): Building {
  return { id: r.id, siteId: r.site_id, name: r.name, address: r.address, description: r.description,
    floorCount: r.floor_count, createdAt: r.created_at, updatedAt: r.updated_at };
}

export function listBuildings(db: DatabaseSync, siteId?: string): Building[] {
  const sql = siteId ? 'SELECT * FROM buildings WHERE site_id = ? ORDER BY name' : 'SELECT * FROM buildings ORDER BY name';
  const rows = (siteId ? db.prepare(sql).all(siteId) : db.prepare(sql).all()) as unknown as Row[];
  return rows.map(toBuilding);
}

export function getBuilding(db: DatabaseSync, id: string): Building | null {
  const r = db.prepare('SELECT * FROM buildings WHERE id = ?').get(id) as Row | undefined;
  return r ? toBuilding(r) : null;
}

export function createBuilding(db: DatabaseSync, input: { siteId: string; name: string; address?: string | null; description?: string | null; floorCount?: number }): Building {
  const id = makeId('bld');
  const now = toIso(new Date());
  db.prepare('INSERT INTO buildings (id, site_id, name, address, description, floor_count, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, input.siteId, input.name, input.address ?? null, input.description ?? null, input.floorCount ?? 0, now, now);
  return getBuilding(db, id)!;
}

export function updateBuilding(db: DatabaseSync, id: string, patch: Partial<{ name: string; address: string | null; description: string | null; floorCount: number }>): Building | null {
  const cur = getBuilding(db, id);
  if (!cur) return null;
  const now = toIso(new Date());
  db.prepare('UPDATE buildings SET name=?, address=?, description=?, floor_count=?, updated_at=? WHERE id=?')
    .run(patch.name ?? cur.name, patch.address ?? cur.address, patch.description ?? cur.description,
         patch.floorCount ?? cur.floorCount, now, id);
  return getBuilding(db, id);
}

export function deleteBuilding(db: DatabaseSync, id: string): boolean {
  const res = db.prepare('DELETE FROM buildings WHERE id = ?').run(id);
  return Number(res.changes ?? 0) > 0;
}
