import type { DatabaseSync } from 'node:sqlite';
import type { Blueprint } from '../models/types.js';
import { toIso } from '../../../lib/time.js';
import { makeId } from '../../../lib/ids.js';

interface Row { id: string; floor_id: string; storage_path: string; mime_type: string | null; uploaded_at: string; }
function toBlueprint(r: Row): Blueprint { return { id: r.id, floorId: r.floor_id, storagePath: r.storage_path, mimeType: r.mime_type, uploadedAt: r.uploaded_at }; }

export function listBlueprints(db: DatabaseSync, floorId: string): Blueprint[] {
  const rows = db.prepare('SELECT * FROM blueprints WHERE floor_id = ? ORDER BY uploaded_at DESC').all(floorId) as unknown as Row[];
  return rows.map(toBlueprint);
}
export function createBlueprint(db: DatabaseSync, input: { floorId: string; storagePath: string; mimeType?: string | null }): Blueprint {
  const id = makeId('bp'); const now = toIso(new Date());
  db.prepare('INSERT INTO blueprints (id, floor_id, storage_path, mime_type, uploaded_at) VALUES (?,?,?,?,?)')
    .run(id, input.floorId, input.storagePath, input.mimeType ?? null, now);
  const r = db.prepare('SELECT * FROM blueprints WHERE id = ?').get(id) as unknown as Row;
  return toBlueprint(r);
}
export function deleteBlueprint(db: DatabaseSync, id: string): boolean {
  const res = db.prepare('DELETE FROM blueprints WHERE id = ?').run(id);
  return Number(res.changes ?? 0) > 0;
}
