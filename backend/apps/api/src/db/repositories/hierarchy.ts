import type { DatabaseSync } from 'node:sqlite';
import { toIso } from '../../lib/time.js';
import type { Building, Circuit, Floor } from '@lattice/contracts';

function mapBuilding(row: any): Building { return { id: row.id, siteId: row.site_id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapFloor(row: any): Floor { return { id: row.id, buildingId: row.building_id, name: row.name, level: row.level, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapCircuit(row: any): Circuit { return { id: row.id, siteId: row.site_id, buildingId: row.building_id, floorId: row.floor_id, roomId: row.room_id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at }; }

export function listBuildings(db: DatabaseSync, siteId?: string): Building[] { const rows = db.prepare(siteId ? 'SELECT * FROM buildings WHERE site_id = ? ORDER BY name' : 'SELECT * FROM buildings ORDER BY site_id, name').all(...(siteId ? [siteId] : [])); return (rows as any[]).map(mapBuilding); }
export function getBuilding(db: DatabaseSync, id: string): Building | null { const row = db.prepare('SELECT * FROM buildings WHERE id = ?').get(id); return row ? mapBuilding(row) : null; }
export function listFloors(db: DatabaseSync, buildingId?: string): Floor[] { const rows = db.prepare(buildingId ? 'SELECT * FROM floors WHERE building_id = ? ORDER BY level, name' : 'SELECT * FROM floors ORDER BY building_id, level, name').all(...(buildingId ? [buildingId] : [])); return (rows as any[]).map(mapFloor); }
export function getFloor(db: DatabaseSync, id: string): Floor | null { const row = db.prepare('SELECT * FROM floors WHERE id = ?').get(id); return row ? mapFloor(row) : null; }
export function listCircuits(db: DatabaseSync, filters: { siteId?: string; buildingId?: string; floorId?: string; roomId?: string } = {}): Circuit[] { const where: string[] = []; const params: string[] = []; for (const [column, value] of Object.entries({ site_id: filters.siteId, building_id: filters.buildingId, floor_id: filters.floorId, room_id: filters.roomId })) { if (value) { where.push(`${column} = ?`); params.push(value); } } const rows = db.prepare(`SELECT * FROM circuits ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY name`).all(...params); return (rows as any[]).map(mapCircuit); }
export function getCircuit(db: DatabaseSync, id: string): Circuit | null { const row = db.prepare('SELECT * FROM circuits WHERE id = ?').get(id); return row ? mapCircuit(row) : null; }

export function upsertBuilding(db: DatabaseSync, building: { id: string; siteId: string; name: string }): void {
  const now = toIso(new Date());
  db.prepare('INSERT INTO buildings (id, site_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET site_id = excluded.site_id, name = excluded.name, updated_at = excluded.updated_at').run(building.id, building.siteId, building.name, now, now);
}
export function upsertFloor(db: DatabaseSync, floor: { id: string; buildingId: string; name: string; level: number }): void {
  const now = toIso(new Date());
  db.prepare('INSERT INTO floors (id, building_id, name, level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET building_id = excluded.building_id, name = excluded.name, level = excluded.level, updated_at = excluded.updated_at').run(floor.id, floor.buildingId, floor.name, floor.level, now, now);
}
export function upsertCircuit(db: DatabaseSync, circuit: { id: string; siteId: string; buildingId: string | null; floorId: string | null; roomId: string | null; name: string }): void {
  const now = toIso(new Date());
  db.prepare('INSERT INTO circuits (id, site_id, building_id, floor_id, room_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET site_id = excluded.site_id, building_id = excluded.building_id, floor_id = excluded.floor_id, room_id = excluded.room_id, name = excluded.name, updated_at = excluded.updated_at').run(circuit.id, circuit.siteId, circuit.buildingId, circuit.floorId, circuit.roomId, circuit.name, now, now);
}
