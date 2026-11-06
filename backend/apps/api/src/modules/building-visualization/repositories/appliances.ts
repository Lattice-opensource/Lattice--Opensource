import type { DatabaseSync } from 'node:sqlite';
import type { Appliance } from '../models/types.js';
import { toIso } from '../../../lib/time.js';
import { makeId } from '../../../lib/ids.js';

interface Row {
  id: string; room_id: string | null; circuit_id: string | null; device_id: string | null;
  name: string; type: string; manufacturer: string | null; model: string | null; rated_power_w: number | null;
  monitoring_method: string; status: string; position_x: number | null; position_y: number | null;
  created_at: string; updated_at: string;
}
function toAppliance(r: Row): Appliance {
  return { id: r.id, roomId: r.room_id, circuitId: r.circuit_id, deviceId: r.device_id, name: r.name, type: r.type,
    manufacturer: r.manufacturer, model: r.model, ratedPowerW: r.rated_power_w,
    monitoringMethod: r.monitoring_method as Appliance['monitoringMethod'], status: r.status as Appliance['status'],
    positionX: r.position_x, positionY: r.position_y, createdAt: r.created_at, updatedAt: r.updated_at };
}

export function listAppliances(db: DatabaseSync, roomId?: string): Appliance[] {
  const sql = roomId ? 'SELECT * FROM appliances WHERE room_id = ? ORDER BY name' : 'SELECT * FROM appliances ORDER BY name';
  const rows = (roomId ? db.prepare(sql).all(roomId) : db.prepare(sql).all()) as unknown as Row[];
  return rows.map(toAppliance);
}
export function getAppliance(db: DatabaseSync, id: string): Appliance | null {
  const r = db.prepare('SELECT * FROM appliances WHERE id = ?').get(id) as unknown as Row | undefined;
  return r ? toAppliance(r) : null;
}
export function createAppliance(db: DatabaseSync, input: {
  roomId?: string | null; circuitId?: string | null; deviceId?: string | null; name: string; type?: string;
  manufacturer?: string | null; model?: string | null; ratedPowerW?: number | null;
  monitoringMethod?: Appliance['monitoringMethod']; status?: Appliance['status'];
  positionX?: number | null; positionY?: number | null;
}): Appliance {
  const id = makeId('apl'); const now = toIso(new Date());
  db.prepare('INSERT INTO appliances (id, room_id, circuit_id, device_id, name, type, manufacturer, model, rated_power_w, monitoring_method, status, position_x, position_y, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, input.roomId ?? null, input.circuitId ?? null, input.deviceId ?? null, input.name, input.type ?? 'other',
         input.manufacturer ?? null, input.model ?? null, input.ratedPowerW ?? null, input.monitoringMethod ?? 'none',
         input.status ?? 'unknown', input.positionX ?? null, input.positionY ?? null, now, now);
  return getAppliance(db, id)!;
}
export function updateAppliance(db: DatabaseSync, id: string, patch: Partial<{
  roomId: string | null; circuitId: string | null; deviceId: string | null; name: string; type: string;
  manufacturer: string | null; model: string | null; ratedPowerW: number | null;
  monitoringMethod: Appliance['monitoringMethod']; status: Appliance['status'];
  positionX: number | null; positionY: number | null;
}>): Appliance | null {
  const cur = getAppliance(db, id);
  if (!cur) return null;
  const now = toIso(new Date());
  db.prepare('UPDATE appliances SET room_id=?, circuit_id=?, device_id=?, name=?, type=?, manufacturer=?, model=?, rated_power_w=?, monitoring_method=?, status=?, position_x=?, position_y=?, updated_at=? WHERE id=?')
    .run(patch.roomId ?? cur.roomId, patch.circuitId ?? cur.circuitId, patch.deviceId ?? cur.deviceId,
         patch.name ?? cur.name, patch.type ?? cur.type, patch.manufacturer ?? cur.manufacturer, patch.model ?? cur.model,
         patch.ratedPowerW ?? cur.ratedPowerW, patch.monitoringMethod ?? cur.monitoringMethod, patch.status ?? cur.status,
         patch.positionX ?? cur.positionX, patch.positionY ?? cur.positionY, now, id);
  return getAppliance(db, id);
}
export function deleteAppliance(db: DatabaseSync, id: string): boolean {
  const res = db.prepare('DELETE FROM appliances WHERE id = ?').run(id);
  return Number(res.changes ?? 0) > 0;
}
export function updateApplianceStatus(db: DatabaseSync, id: string, status: Appliance['status']): void {
  db.prepare('UPDATE appliances SET status = ?, updated_at = ? WHERE id = ?').run(status, toIso(new Date()), id);
}
