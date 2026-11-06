import type { DatabaseSync } from 'node:sqlite';
import type { RoomVisualization } from '../models/types.js';
import { toIso } from '../../../lib/time.js';

interface Row {
  id: string; site_id: string; name: string; building_id: string | null; floor_id: string | null;
  circuit_id: string | null; x: number | null; y: number | null; width: number | null; height: number | null;
  boundary: string | null; area_sqm: number | null; room_type: string | null; created_at: string; updated_at: string;
}

function toRoom(r: Row): RoomVisualization {
  return { id: r.id, siteId: r.site_id, name: r.name, buildingId: r.building_id, floorId: r.floor_id,
    circuitId: r.circuit_id, x: r.x, y: r.y, width: r.width, height: r.height, boundary: r.boundary,
    areaSqm: r.area_sqm, roomType: r.room_type, createdAt: r.created_at, updatedAt: r.updated_at };
}

export function listRoomsByFloor(db: DatabaseSync, floorId: string): RoomVisualization[] {
  const rows = db.prepare('SELECT * FROM rooms WHERE floor_id = ? ORDER BY name').all(floorId) as unknown as Row[];
  return rows.map(toRoom);
}

export function updateRoomMapping(db: DatabaseSync, roomId: string, patch: { buildingId?: string | null; floorId?: string | null; circuitId?: string | null; x?: number | null; y?: number | null; width?: number | null; height?: number | null; boundary?: string | null; areaSqm?: number | null; roomType?: string | null }): RoomVisualization | null {
  const cur = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as Row | undefined;
  if (!cur) return null;
  const now = toIso(new Date());
  db.prepare(`UPDATE rooms SET building_id=?, floor_id=?, circuit_id=?, x=?, y=?, width=?, height=?, boundary=?, area_sqm=?, room_type=?, updated_at=? WHERE id=?`)
    .run(patch.buildingId ?? cur.building_id, patch.floorId ?? cur.floor_id, patch.circuitId ?? cur.circuit_id,
         patch.x ?? cur.x, patch.y ?? cur.y, patch.width ?? cur.width, patch.height ?? cur.height,
         patch.boundary ?? cur.boundary, patch.areaSqm ?? cur.area_sqm, patch.roomType ?? cur.room_type, now, roomId);
  const r = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as unknown as Row;
  return toRoom(r);
}
