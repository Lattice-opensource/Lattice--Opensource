import type { DatabaseSync } from 'node:sqlite';
import type { Room } from '@lattice/contracts';
import { toIso } from '../../lib/time.js';

interface RoomRow {
  id: string;
  site_id: string;
  building_id: string | null;
  floor_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

function rowToRoom(row: RoomRow): Room {
  return {
    id: row.id,
    siteId: row.site_id,
    buildingId: row.building_id,
    floorId: row.floor_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listRooms(db: DatabaseSync, filters: { siteId?: string; buildingId?: string; floorId?: string } = {}): Room[] {
  const where: string[] = []; const params: string[] = [];
  for (const [column, value] of Object.entries({ site_id: filters.siteId, building_id: filters.buildingId, floor_id: filters.floorId })) if (value) { where.push(`${column} = ?`); params.push(value); }
  const rows = db.prepare(`SELECT * FROM rooms ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY site_id, name`).all(...params) as unknown as RoomRow[];
  return rows.map(rowToRoom);
}

export function getRoom(db: DatabaseSync, id: string): Room | null {
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as RoomRow | undefined;
  return row ? rowToRoom(row) : null;
}

export function upsertRoom(db: DatabaseSync, room: { id: string; siteId: string; buildingId?: string | null; floorId?: string | null; name: string }): void {
  const now = toIso(new Date());
  db.prepare(
    `INSERT INTO rooms (id, site_id, building_id, floor_id, name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       site_id = excluded.site_id,
       building_id = excluded.building_id,
       floor_id = excluded.floor_id,
       name = excluded.name,
       updated_at = excluded.updated_at`,
  ).run(room.id, room.siteId, room.buildingId ?? null, room.floorId ?? null, room.name, now, now);
}
