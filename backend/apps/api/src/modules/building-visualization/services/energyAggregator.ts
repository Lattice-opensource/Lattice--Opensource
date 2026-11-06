import type { DatabaseSync } from 'node:sqlite';
import { listEnergyReadings, latestEnergyReading, type EntityType } from '../repositories/energy-readings.js';

export interface AggregatedEnergy {
  powerW: number | null;
  energyKwh: number;
  measurementSource: 'measured' | 'estimated' | 'simulated' | 'mixed' | 'none';
  hasData: boolean;
  sampleCount: number;
}

const ENTITY_PRIORITY: string[] = ['building', 'floor', 'room', 'circuit', 'meter', 'appliance', 'device'];

function sumEnergy(readings: { energyKwh: number | null }[]): number {
  return readings.reduce((a, r) => a + (r.energyKwh ?? 0), 0);
}

function avgPower(readings: { powerW: number | null }[]): number | null {
  const vals = readings.map((r) => r.powerW).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function dominantSource(readings: { measurementSource: string; isSimulated: boolean }[]): AggregatedEnergy['measurementSource'] {
  if (readings.length === 0) return 'none';
  const sim = readings.some((r) => r.isSimulated);
  const real = readings.some((r) => !r.isSimulated);
  if (sim && real) return 'mixed';
  if (sim) return 'simulated';
  const sources = new Set(readings.map((r) => r.measurementSource));
  if (sources.size === 1) return [...sources][0] as AggregatedEnergy['measurementSource'];
  return 'measured';
}

// Resolve all entity IDs under a building (floors, rooms, circuits, meters, appliances, devices)
function buildingEntityIds(db: DatabaseSync, buildingId: string): { floors: string[]; rooms: string[]; circuits: string[]; meters: string[]; appliances: string[] } {
  const floors = (db.prepare('SELECT id FROM floors WHERE building_id = ?').all(buildingId) as { id: string }[]).map((r) => r.id);
  const rooms = floors.length
    ? (db.prepare(`SELECT id FROM rooms WHERE floor_id IN (${floors.map(() => '?').join(',')})`).all(...floors) as { id: string }[]).map((r) => r.id)
    : [];
  const circuits = floors.length
    ? (db.prepare(`SELECT id FROM circuits WHERE floor_id IN (${floors.map(() => '?').join(',')})`).all(...floors) as { id: string }[]).map((r) => r.id)
    : [];
  const meters = (db.prepare('SELECT id FROM meters WHERE site_id = (SELECT site_id FROM buildings WHERE id = ?)').all(buildingId) as { id: string }[]).map((r) => r.id);
  const appliances = rooms.length
    ? (db.prepare(`SELECT id FROM appliances WHERE room_id IN (${rooms.map(() => '?').join(',')})`).all(...rooms) as { id: string }[]).map((r) => r.id)
    : [];
  return { floors, rooms, circuits, meters, appliances };
}

export function aggregateRoom(db: DatabaseSync, roomId: string, from: string, to: string): AggregatedEnergy {
  // Prefer room-level readings; fall back to individually-monitored appliances; then circuit-level.
  const roomReadings = listEnergyReadings(db, { entityType: 'room', entityId: roomId, from, to });
  if (roomReadings.length > 0) {
    return { powerW: avgPower(roomReadings), energyKwh: sumEnergy(roomReadings), measurementSource: dominantSource(roomReadings), hasData: true, sampleCount: roomReadings.length };
  }
  // appliances with individual monitoring
  const apps = db.prepare("SELECT id FROM appliances WHERE room_id = ? AND monitoring_method IN ('device','smart_plug')").all(roomId) as { id: string }[];
  const appReadings: ReturnType<typeof listEnergyReadings> = [];
  for (const a of apps) appReadings.push(...listEnergyReadings(db, { entityType: 'appliance', entityId: a.id, from, to }));
  if (appReadings.length > 0) {
    return { powerW: avgPower(appReadings), energyKwh: sumEnergy(appReadings), measurementSource: dominantSource(appReadings), hasData: true, sampleCount: appReadings.length };
  }
  // circuit-level (only if a circuit is mapped to this room)
  const circuitRow = db.prepare('SELECT circuit_id FROM rooms WHERE id = ?').get(roomId) as { circuit_id: string | null } | undefined;
  if (circuitRow?.circuit_id) {
    const cReadings = listEnergyReadings(db, { entityType: 'circuit', entityId: circuitRow.circuit_id, from, to });
    if (cReadings.length > 0) {
      return { powerW: avgPower(cReadings), energyKwh: sumEnergy(cReadings), measurementSource: dominantSource(cReadings), hasData: true, sampleCount: cReadings.length };
    }
  }
  return { powerW: null, energyKwh: 0, measurementSource: 'none', hasData: false, sampleCount: 0 };
}

export function aggregateFloor(db: DatabaseSync, floorId: string, from: string, to: string): AggregatedEnergy {
  const floorReadings = listEnergyReadings(db, { entityType: 'floor', entityId: floorId, from, to });
  if (floorReadings.length > 0) {
    return { powerW: avgPower(floorReadings), energyKwh: sumEnergy(floorReadings), measurementSource: dominantSource(floorReadings), hasData: true, sampleCount: floorReadings.length };
  }
  // sum rooms on this floor
  const rooms = db.prepare('SELECT id FROM rooms WHERE floor_id = ?').all(floorId) as { id: string }[];
  const all: ReturnType<typeof listEnergyReadings> = [];
  for (const r of rooms) all.push(...listEnergyReadings(db, { entityType: 'room', entityId: r.id, from, to }));
  if (all.length > 0) {
    return { powerW: avgPower(all), energyKwh: sumEnergy(all), measurementSource: dominantSource(all), hasData: true, sampleCount: all.length };
  }
  return { powerW: null, energyKwh: 0, measurementSource: 'none', hasData: false, sampleCount: 0 };
}

export function aggregateBuilding(db: DatabaseSync, buildingId: string, from: string, to: string): AggregatedEnergy {
  const bReadings = listEnergyReadings(db, { entityType: 'building', entityId: buildingId, from, to });
  if (bReadings.length > 0) {
    return { powerW: avgPower(bReadings), energyKwh: sumEnergy(bReadings), measurementSource: dominantSource(bReadings), hasData: true, sampleCount: bReadings.length };
  }
  const { floors, rooms } = buildingEntityIds(db, buildingId);
  // try floor-level
  const floorReadings: ReturnType<typeof listEnergyReadings> = [];
  for (const f of floors) floorReadings.push(...listEnergyReadings(db, { entityType: 'floor', entityId: f, from, to }));
  if (floorReadings.length > 0) {
    return { powerW: avgPower(floorReadings), energyKwh: sumEnergy(floorReadings), measurementSource: dominantSource(floorReadings), hasData: true, sampleCount: floorReadings.length };
  }
  // try room-level
  const roomReadings: ReturnType<typeof listEnergyReadings> = [];
  for (const r of rooms) roomReadings.push(...listEnergyReadings(db, { entityType: 'room', entityId: r, from, to }));
  if (roomReadings.length > 0) {
    return { powerW: avgPower(roomReadings), energyKwh: sumEnergy(roomReadings), measurementSource: dominantSource(roomReadings), hasData: true, sampleCount: roomReadings.length };
  }
  // try circuit-level (distinct circuits on floors)
  const circuits = floors.length
    ? (db.prepare(`SELECT id FROM circuits WHERE floor_id IN (${floors.map(() => '?').join(',')})`).all(...floors) as { id: string }[]).map((r) => r.id)
    : [];
  const cReadings: ReturnType<typeof listEnergyReadings> = [];
  for (const c of circuits) cReadings.push(...listEnergyReadings(db, { entityType: 'circuit', entityId: c, from, to }));
  if (cReadings.length > 0) {
    return { powerW: avgPower(cReadings), energyKwh: sumEnergy(cReadings), measurementSource: dominantSource(cReadings), hasData: true, sampleCount: cReadings.length };
  }
  return { powerW: null, energyKwh: 0, measurementSource: 'none', hasData: false, sampleCount: 0 };
}

export function aggregateAppliance(db: DatabaseSync, applianceId: string, from: string, to: string): { measured: AggregatedEnergy; ratedPowerW: number | null; monitoringMethod: string } {
  const app = db.prepare('SELECT rated_power_w, monitoring_method FROM appliances WHERE id = ?').get(applianceId) as { rated_power_w: number | null; monitoring_method: string } | undefined;
  const rated = app?.rated_power_w ?? null;
  const method = app?.monitoring_method ?? 'none';
  // Only individually monitored appliances get measured readings.
  if (method === 'device' || method === 'smart_plug') {
    const r = listEnergyReadings(db, { entityType: 'appliance', entityId: applianceId, from, to });
    if (r.length > 0) {
      return { measured: { powerW: avgPower(r), energyKwh: sumEnergy(r), measurementSource: dominantSource(r), hasData: true, sampleCount: r.length }, ratedPowerW: rated, monitoringMethod: method };
    }
  }
  return { measured: { powerW: null, energyKwh: 0, measurementSource: 'none', hasData: false, sampleCount: 0 }, ratedPowerW: rated, monitoringMethod: method };
}

export function historicalTrend(db: DatabaseSync, entityType: EntityType, entityId: string, from: string, to: string): { timestamp: string; powerW: number | null; energyKwh: number | null }[] {
  const readings = listEnergyReadings(db, { entityType, entityId, from, to });
  return readings.map((r) => ({ timestamp: r.timestamp, powerW: r.powerW, energyKwh: r.energyKwh }));
}
