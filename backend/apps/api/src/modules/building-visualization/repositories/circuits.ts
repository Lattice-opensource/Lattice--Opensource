import type { DatabaseSync } from 'node:sqlite';
import type { Circuit } from '../models/types.js';
import { toIso } from '../../../lib/time.js';
import { makeId } from '../../../lib/ids.js';

interface Row { id: string; name: string; floor_id: string | null; meter_id: string | null; created_at: string; updated_at: string; }
function toCircuit(r: Row): Circuit { return { id: r.id, name: r.name, floorId: r.floor_id, meterId: r.meter_id, createdAt: r.created_at, updatedAt: r.updated_at }; }

export function listCircuits(db: DatabaseSync): Circuit[] {
  const rows = db.prepare('SELECT * FROM circuits ORDER BY name').all() as unknown as Row[];
  return rows.map(toCircuit);
}
export function getCircuit(db: DatabaseSync, id: string): Circuit | null {
  const r = db.prepare('SELECT * FROM circuits WHERE id = ?').get(id) as Row | undefined;
  return r ? toCircuit(r) : null;
}
export function createCircuit(db: DatabaseSync, input: { name: string; floorId?: string | null; meterId?: string | null }): Circuit {
  const id = makeId('ckt'); const now = toIso(new Date());
  db.prepare('INSERT INTO circuits (id, name, floor_id, meter_id, created_at, updated_at) VALUES (?,?,?,?,?,?)')
    .run(id, input.name, input.floorId ?? null, input.meterId ?? null, now, now);
  return getCircuit(db, id)!;
}
export function deleteCircuit(db: DatabaseSync, id: string): boolean {
  const res = db.prepare('DELETE FROM circuits WHERE id = ?').run(id);
  return Number(res.changes ?? 0) > 0;
}
export function assignCircuitToRooms(db: DatabaseSync, circuitId: string, roomIds: string[]): void {
  // rooms.circuit_id column added via migration
  const stmt = db.prepare('UPDATE rooms SET circuit_id = ? WHERE id = ?');
  for (const rid of roomIds) stmt.run(circuitId, rid);
}
