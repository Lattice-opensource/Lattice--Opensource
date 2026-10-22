import type { DatabaseSync } from 'node:sqlite';
import type { Room } from '@lattice/contracts';
import { toIso } from '../../lib/time.js';

interface RoomRow {
  id: string;
  site_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function rowToRoom(row: RoomRow): Room {
  return {
    id: row.id,
    siteId: row.site_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listRooms(db: DatabaseSync, siteId?: string): Room[] {
  if (siteId) {
    const rows = db.prepare('SELECT * FROM rooms WHERE site_id = ? ORDER BY name').all(siteId) as unknown as RoomRow[];
    return rows.map(rowToRoom);
  }
  const rows = db.prepare('SELECT * FROM rooms ORDER BY site_id, name').all() as unknown as RoomRow[];
  return rows.map(rowToRoom);
}

export function getRoom(db: DatabaseSync, id: string): Room | null {
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as RoomRow | undefined;
  return row ? rowToRoom(row) : null;
}

export function upsertRoom(db: DatabaseSync, room: { id: string; siteId: string; name: string }): void {
  const now = toIso(new Date());
  db.prepare(
    `INSERT INTO rooms (id, site_id, name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       site_id = excluded.site_id,
       name = excluded.name,
       updated_at = excluded.updated_at`,
  ).run(room.id, room.siteId, room.name, now, now);
}
