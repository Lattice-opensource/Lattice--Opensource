// Demo seed for Lattice Building Visualization. Run with: npx tsx src/modules/building-visualization/seed-demo.ts
// Idempotent: skips if demo building already exists. Does not overwrite user data.

import { openDatabase, getDb, closeDatabase } from '../../db/index.js';
import { toIso } from '../../lib/time.js';
import { makeId } from '../../lib/ids.js';

const db = openDatabase();

const DEMO_BUILDING_ID = 'demo-bld-1';

const existing = db.prepare('SELECT id FROM buildings WHERE id = ?').get(DEMO_BUILDING_ID);
if (existing) {
  console.log('Demo building already exists; skipping seed.');
  closeDatabase();
  process.exit(0);
}

const now = toIso(new Date());
const siteId = 'site_home_01';
// ensure site exists
const site = db.prepare('SELECT id FROM sites WHERE id = ?').get(siteId);
if (!site) {
  db.prepare('INSERT INTO sites (id,name,timezone,currency,tariff_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(siteId, 'Demo Site', 'UTC', 'USD', '{}', now, now);
}

// Building
db.prepare('INSERT INTO buildings (id,site_id,name,address,description,floor_count,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
  .run(DEMO_BUILDING_ID, siteId, 'HQ Demo Building', '123 Demo Street', 'Simulated demo building (not real)', 2, now, now);

// Floors
const f1 = 'demo-floor-1', f2 = 'demo-floor-2';
db.prepare('INSERT INTO floors (id,building_id,level,name,blueprint_ref,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
  .run(f1, DEMO_BUILDING_ID, 0, 'Ground Floor', '/demo/floor1.svg', now, now);
db.prepare('INSERT INTO floors (id,building_id,level,name,blueprint_ref,created_at,updated_at) VALUES (?,?,?,?,?,?,?)')
  .run(f2, DEMO_BUILDING_ID, 1, 'First Floor', '/demo/floor2.svg', now, now);

// Rooms (ground floor)
const demoRooms = [
  { id: 'demo-room-living', floor: f1, name: 'Living Room', type: 'living', x: 0.05, y: 0.05, w: 0.4, h: 0.4, area: 16, boundary: '[[0.05,0.05],[0.45,0.05],[0.45,0.45],[0.05,0.45]]' },
  { id: 'demo-room-kitchen', floor: f1, name: 'Kitchen', type: 'kitchen', x: 0.5, y: 0.05, w: 0.45, h: 0.4, area: 18, boundary: '[[0.5,0.05],[0.95,0.05],[0.95,0.45],[0.5,0.45]]' },
  { id: 'demo-room-bedroom', floor: f1, name: 'Bedroom', type: 'bedroom', x: 0.05, y: 0.5, w: 0.4, h: 0.45, area: 18, boundary: '[[0.05,0.5],[0.45,0.5],[0.45,0.95],[0.05,0.95]]' },
  { id: 'demo-room-bathroom', floor: f1, name: 'Bathroom', type: 'bathroom', x: 0.5, y: 0.5, w: 0.45, h: 0.45, area: 20.25, boundary: '[[0.5,0.5],[0.95,0.5],[0.95,0.95],[0.5,0.95]]' },
  { id: 'demo-room-office', floor: f2, name: 'Office', type: 'office', x: 0.1, y: 0.1, w: 0.8, h: 0.8, area: 64, boundary: '[[0.1,0.1],[0.9,0.1],[0.9,0.9],[0.1,0.9]]' },
];
for (const r of demoRooms) {
  db.prepare('INSERT INTO rooms (id,site_id,name,building_id,floor_id,x,y,width,height,boundary,area_sqm,room_type,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(r.id, siteId, r.name, DEMO_BUILDING_ID, r.floor, r.x, r.y, r.w, r.h, r.boundary, r.area, r.type, now, now);
}

// Meters
const m1 = 'demo-meter-main';
db.prepare('INSERT INTO meters (id,site_id,name,type,unit,data_source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
  .run(m1, siteId, 'Main Meter', 'electricity', 'kWh', 'simulated', now, now);

// Circuits
const c1 = 'demo-circuit-ground', c2 = 'demo-circuit-first';
db.prepare('INSERT INTO circuits (id,name,floor_id,meter_id,created_at,updated_at) VALUES (?,?,?,?,?,?)')
  .run(c1, 'Ground Floor Circuit', f1, m1, now, now);
db.prepare('INSERT INTO circuits (id,name,floor_id,meter_id,created_at,updated_at) VALUES (?,?,?,?,?,?)')
  .run(c2, 'First Floor Circuit', f2, m1, now, now);

// Assign rooms to circuits
db.prepare('UPDATE rooms SET circuit_id = ? WHERE id IN (?,?,?,?)').run(c1, 'demo-room-living', 'demo-room-kitchen', 'demo-room-bedroom', 'demo-room-bathroom');
db.prepare('UPDATE rooms SET circuit_id = ? WHERE id = ?').run(c2, 'demo-room-office');

// Appliances
const appliances = [
  { id: 'demo-app-tv', room: 'demo-room-living', circuit: c1, name: 'Television', type: 'television', mfr: 'Samsung', model: '55" QLED', rated: 120, method: 'smart_plug', status: 'online', px: 0.1, py: 0.1 },
  { id: 'demo-app-ac1', room: 'demo-room-living', circuit: c1, name: 'Living Room AC', type: 'air_conditioner', mfr: 'Voltas', model: '1.5T', rated: 1500, method: 'device', status: 'online', px: 0.3, py: 0.1 },
  { id: 'demo-app-fridge', room: 'demo-room-kitchen', circuit: c1, name: 'Refrigerator', type: 'refrigerator', mfr: 'LG', model: '260L', rated: 150, method: 'smart_plug', status: 'online', px: 0.55, py: 0.1 },
  { id: 'demo-app-microwave', room: 'demo-room-kitchen', circuit: c1, name: 'Microwave', type: 'kitchen_equipment', mfr: 'IFB', model: '20L', rated: 1000, method: 'manual', status: 'unknown', px: 0.8, py: 0.1 },
  { id: 'demo-app-ac2', room: 'demo-room-bedroom', circuit: c1, name: 'Bedroom AC', type: 'air_conditioner', mfr: 'Daikin', model: '2T', rated: 1800, method: 'device', status: 'online', px: 0.1, py: 0.55 },
  { id: 'demo-app-heater', room: 'demo-room-bathroom', circuit: c1, name: 'Water Heater', type: 'water_heater', mfr: 'Bajaj', model: '25L', rated: 2000, method: 'circuit', status: 'online', px: 0.55, py: 0.55 },
  { id: 'demo-app-server', room: 'demo-room-office', circuit: c2, name: 'Server Rack', type: 'computer', mfr: 'Dell', model: 'R740', rated: 2000, method: 'device', status: 'online', px: 0.5, py: 0.5 },
];
for (const a of appliances) {
  db.prepare('INSERT INTO appliances (id, room_id, circuit_id, name, type, manufacturer, model, rated_power_w, monitoring_method, status, position_x, position_y, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(a.id, a.room, a.circuit, a.name, a.type, a.mfr, a.model, a.rated, a.method, a.status, a.px, a.py, now, now);
}

// Energy readings (24h, hourly) - simulated
const rooms = ['demo-room-living', 'demo-room-kitchen', 'demo-room-bedroom', 'demo-room-bathroom', 'demo-room-office'];
const basePower: Record<string, number> = { 'demo-room-living': 420, 'demo-room-kitchen': 180, 'demo-room-bedroom': 950, 'demo-room-bathroom': 0, 'demo-room-office': 2200 };
const start = new Date('2026-10-22T00:00:00Z').getTime();
for (let h = 0; h < 24; h++) {
  const ts = new Date(start + h * 3600 * 1000).toISOString();
  for (const rid of rooms) {
    let power: number = basePower[rid] ?? 0;
    // sudden increase in bedroom at hour 14
    if (rid === 'demo-room-bedroom' && h === 14) power = 1800;
    const energy = (power * 3600) / 3_600_000; // kWh per hour
    db.prepare('INSERT INTO energy_readings (id, entity_type, entity_id, timestamp, power_w, energy_kwh, measurement_source, is_simulated, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(makeId('er'), 'room', rid, ts, power, energy, 'simulated', 1, now);
  }
  const totalPower = rooms.reduce((a, r) => a + (basePower[r] ?? 0), 0);
  db.prepare('INSERT INTO energy_readings (id, entity_type, entity_id, timestamp, power_w, energy_kwh, measurement_source, is_simulated, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(makeId('er'), 'building', DEMO_BUILDING_ID, ts, totalPower, (totalPower * 3600) / 3_600_000, 'simulated', 1, now);
}

// Appliance-level readings for individually monitored appliances
const appReadings: { id: string; power: number }[] = [
  { id: 'demo-app-tv', power: 110 }, { id: 'demo-app-ac1', power: 310 },
  { id: 'demo-app-fridge', power: 130 }, { id: 'demo-app-ac2', power: 950 },
  { id: 'demo-app-server', power: 2200 },
];
for (const a of appReadings) {
  for (let h = 0; h < 24; h++) {
    const ts = new Date(start + h * 3600 * 1000).toISOString();
    const energy = (a.power * 3600) / 3_600_000;
    db.prepare('INSERT INTO energy_readings (id, entity_type, entity_id, timestamp, power_w, energy_kwh, measurement_source, is_simulated, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(makeId('er'), 'appliance', a.id, ts, a.power, energy, 'simulated', 1, now);
  }
}

// Example alerts (simulated, from alert engine schema)
const alerts = [
  { id: 'demo-alert-1', building: DEMO_BUILDING_ID, circuit: c1, type: 'historical_baseline', severity: 'Medium', desc: 'Bedroom consumption exceeded baseline by 150%', ts: '2026-10-22T10:00:00Z', value: 4.5, threshold: 2.0 },
  { id: 'demo-alert-2', building: DEMO_BUILDING_ID, circuit: c2, type: 'fixed_threshold', severity: 'High', desc: 'Office power exceeded critical threshold', ts: '2026-10-22T09:30:00Z', value: 2200, threshold: 2000 },
  { id: 'demo-alert-3', building: DEMO_BUILDING_ID, circuit: null, type: 'sudden_change', severity: 'Low', desc: 'Unusual consumption change detected', ts: '2026-10-22T08:00:00Z', value: 100, threshold: 30 },
];
// Alerts live in the Alert Engine's DB, not here. Print instructions.
console.log('Demo building seeded. Alerts (for Alert Engine) are listed in docs; insert them into the Alert Engine DB separately.');
for (const a of alerts) console.log(JSON.stringify(a));

console.log('Demo seed complete: building', DEMO_BUILDING_ID);
closeDatabase();