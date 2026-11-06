// Proxy to the Lattice Alert Engine (independent service). Graceful on failure.

import type { DatabaseSync } from 'node:sqlite';

const ALERT_ENGINE_URL = (process.env.ALERT_ENGINE_URL || 'http://localhost:8010').replace(/\/$/, '');

export interface AlertEngineAlert {
  id: string;
  building_id: string;
  circuit_id: string | null;
  alert_type: string;
  severity: string;
  description: string;
  timestamp: string;
  resolution_status: string;
  value: number | null;
  threshold: number | null;
  is_simulated: boolean;
}

export interface AssociatedAlert extends AlertEngineAlert {
  roomId: string | null;
  floorId: string | null;
  level: 'room' | 'circuit' | 'building';
}

export async function fetchBuildingAlerts(buildingId: string): Promise<{ alerts: AssociatedAlert[]; available: boolean; error?: string }> {
  try {
    const res = await fetch(`${ALERT_ENGINE_URL}/alerts?building=${encodeURIComponent(buildingId)}&limit=200`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return { alerts: [], available: false, error: `Alert Engine returned ${res.status}` };
    }
    const body = await res.json() as { data?: AlertEngineAlert[] };
    const raw = body?.data ?? [];
    // Associate to rooms/circuits
    let db: DatabaseSync | null = null;
    try {
      const { getDb } = await import('../../../db/index.js');
      db = getDb();
    } catch { db = null; }
    const associated = raw.map((a) => associate(db, buildingId, a));
    return { alerts: associated, available: true };
  } catch (e) {
    return { alerts: [], available: false, error: (e as Error).message };
  }
}

function associate(db: DatabaseSync | null, buildingId: string, a: AlertEngineAlert): AssociatedAlert {
  let roomId: string | null = null;
  let floorId: string | null = null;
  let level: AssociatedAlert['level'] = 'building';
  if (db && a.circuit_id) {
    try {
      const room = db.prepare('SELECT id, floor_id FROM rooms WHERE circuit_id = ? LIMIT 1').get(a.circuit_id) as { id: string; floor_id: string | null } | undefined;
      if (room) { roomId = room.id; floorId = room.floor_id; level = 'room'; }
      else {
        const circuit = db.prepare('SELECT floor_id FROM circuits WHERE id = ?').get(a.circuit_id) as { floor_id: string | null } | undefined;
        if (circuit?.floor_id) { floorId = circuit.floor_id; level = 'circuit'; }
      }
    } catch { /* ignore */ }
  }
  if (level === 'building') {
    // no room/circuit association; leave floorId null
  }
  return { ...a, roomId, floorId, level };
}
