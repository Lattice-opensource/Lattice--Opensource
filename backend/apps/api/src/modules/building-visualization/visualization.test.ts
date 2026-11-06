import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase, closeDatabase, getDb } from '../../db/index.js';

describe('building-visualization data models', () => {
  beforeAll(() => {
    // Fresh temp db
    const dir = mkdtempSync(path.join(tmpdir(), 'bv-'));
    openDatabase(path.join(dir, 'bv.db'));
    // seed a site + room for FK targets
    const db = getDb();
    db.prepare("INSERT INTO sites (id,name,timezone,currency,tariff_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
      .run('site1','Site 1','UTC','USD','{}', new Date().toISOString(), new Date().toISOString());
    db.prepare("INSERT INTO rooms (id,site_id,name,created_at,updated_at) VALUES (?,?,?,?,?)")
      .run('room1','site1','Room 1', new Date().toISOString(), new Date().toISOString());
  });
  afterAll(() => { closeDatabase(); });

  it('creates building, floor, meter, circuit, appliance, blueprint', async () => {
    const db = getDb();
    const { createBuilding, getBuilding } = await import('./repositories/buildings.js');
    const { createFloor, listFloors } = await import('./repositories/floors.js');
    const { createMeter } = await import('./repositories/meters.js');
    const { createCircuit } = await import('./repositories/circuits.js');
    const { createAppliance, listAppliances } = await import('./repositories/appliances.js');
    const { createBlueprint, listBlueprints } = await import('./repositories/blueprints.js');

    const b = createBuilding(db, { siteId: 'site1', name: 'HQ', floorCount: 2 });
    expect(b.name).toBe('HQ');
    expect(getBuilding(db, b.id)?.id).toBe(b.id);

    const f = createFloor(db, { buildingId: b.id, level: 1, name: 'Ground' });
    expect(listFloors(db, b.id).length).toBe(1);

    const m = createMeter(db, { siteId: 'site1', name: 'Main Meter' });
    const c = createCircuit(db, { name: 'Circuit A', floorId: f.id, meterId: m.id });
    expect(c.meterId).toBe(m.id);

    const a = createAppliance(db, { roomId: 'room1', circuitId: c.id, name: 'AC Unit', type: 'hvac', ratedPowerW: 1500, monitoringMethod: 'device' });
    expect(listAppliances(db, 'room1').length).toBe(1);

    const bp = createBlueprint(db, { floorId: f.id, storagePath: '/tmp/x.svg', mimeType: 'image/svg+xml' });
    expect(listBlueprints(db, f.id).length).toBe(1);

    // cleanup not required (temp db)
    void a; void bp;
  });

  it('links room to floor via updateRoomMapping', async () => {
    const db = getDb();
    const { updateRoomMapping, listRoomsByFloor } = await import('./repositories/rooms.js');
    const r = updateRoomMapping(db, 'room1', { floorId: (await import('./repositories/floors.js')).listFloors(db, (await import('./repositories/buildings.js')).listBuildings(db,'site1')[0].id)[0].id, roomType: 'office', areaSqm: 25 });
    expect(r).not.toBeNull();
    expect(r!.roomType).toBe('office');
  });
});
