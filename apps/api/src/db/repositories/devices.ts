import type { DatabaseSync } from 'node:sqlite';
import type { Device, DeviceCategory, DeviceStatus } from '@lattice/contracts';
import { toIso } from '../../lib/time.js';

interface DeviceRow {
  id: string;
  site_id: string;
  room_id: string | null;
  name: string;
  category: string;
  model: string | null;
  rated_power_w: number | null;
  status: string;
  last_seen_at: string | null;
  is_simulated: number;
  installed_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRoomName(db: DatabaseSync, roomId: string | null): string | null {
  if (!roomId) return null;
  const r = db.prepare('SELECT name FROM rooms WHERE id = ?').get(roomId) as { name: string } | undefined;
  return r?.name ?? null;
}

function rowToDevice(db: DatabaseSync, row: DeviceRow): Device {
  return {
    id: row.id,
    siteId: row.site_id,
    roomId: row.room_id,
    roomName: rowToRoomName(db, row.room_id),
    name: row.name,
    category: row.category as DeviceCategory,
    model: row.model,
    ratedPowerW: row.rated_power_w,
    status: row.status as DeviceStatus,
    lastSeenAt: row.last_seen_at,
    isSimulated: row.is_simulated === 1,
    installedAt: row.installed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listDevices(
  db: DatabaseSync,
  filters: { siteId?: string; roomId?: string } = {},
): Device[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.siteId) {
    where.push('site_id = ?');
    params.push(filters.siteId);
  }
  if (filters.roomId) {
    where.push('room_id = ?');
    params.push(filters.roomId);
  }
  const sql = `SELECT * FROM devices ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY name`;
  const rows = db.prepare(sql).all(...(params as any)) as unknown as DeviceRow[];
  return rows.map((r) => rowToDevice(db, r));
}

export function getDevice(db: DatabaseSync, id: string): Device | null {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as DeviceRow | undefined;
  return row ? rowToDevice(db, row) : null;
}

export function upsertDevice(
  db: DatabaseSync,
  device: {
    id: string;
    siteId: string;
    roomId: string | null;
    name: string;
    category: DeviceCategory;
    model: string | null;
    ratedPowerW: number | null;
    status: DeviceStatus;
    isSimulated: boolean;
    installedAt: string | null;
  },
): void {
  const now = toIso(new Date());
  db.prepare(
    `INSERT INTO devices (id, site_id, room_id, name, category, model, rated_power_w, status, is_simulated, installed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       site_id = excluded.site_id,
       room_id = excluded.room_id,
       name = excluded.name,
       category = excluded.category,
       model = excluded.model,
       rated_power_w = excluded.rated_power_w,
       status = excluded.status,
       is_simulated = excluded.is_simulated,
       installed_at = excluded.installed_at,
       updated_at = excluded.updated_at`,
  ).run(
    device.id,
    device.siteId,
    device.roomId,
    device.name,
    device.category,
    device.model,
    device.ratedPowerW,
    device.status,
    device.isSimulated ? 1 : 0,
    device.installedAt,
    now,
    now,
  );
}

export function updateDeviceLastSeen(
  db: DatabaseSync,
  id: string,
  lastSeenAt: string,
  status?: DeviceStatus,
): void {
  if (status) {
    db.prepare('UPDATE devices SET last_seen_at = ?, status = ?, updated_at = ? WHERE id = ?').run(
      lastSeenAt,
      status,
      toIso(new Date()),
      id,
    );
  } else {
    db.prepare('UPDATE devices SET last_seen_at = ?, updated_at = ? WHERE id = ?').run(
      lastSeenAt,
      toIso(new Date()),
      id,
    );
  }
}

export function countDevices(db: DatabaseSync): number {
  const r = db.prepare('SELECT COUNT(*) AS n FROM devices').get() as { n: number };
  return r.n;
}
