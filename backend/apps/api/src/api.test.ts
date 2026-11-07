import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { openDatabase, closeDatabase, getDb } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { buildApp } from './app.js';
import { startLiveWriter, stopLiveWriter } from './services/simulator.js';
import { env } from './config.js';
import type { FastifyInstance } from 'fastify';
import { upsertBuilding } from './db/repositories/hierarchy.js';
import {
  AggregatePointSchema,
  HealthResponseSchema,
  ItemResponseSchema,
  LatestReadingsResponseSchema,
  ListResponseSchema,
  RoomSchema,
  SeedResultSchema,
  SiteConfigSchema,
  SiteSchema,
  SiteSummarySchema,
  SummarySchema,
  DeviceSchema,
  ReadingSchema,
} from '@lattice/contracts/schema';

let app: FastifyInstance;

beforeAll(async () => {
  const db = openDatabase();
  seedDatabase(db, { force: true });
  startLiveWriter(db, {
    liveIntervalSeconds: env.SIMULATION_LIVE_INTERVAL_SECONDS,
    retentionSeconds: env.SIMULATION_LIVE_RETENTION_SECONDS,
    seed: env.SIMULATION_SEED,
  });
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  stopLiveWriter();
  await app.close();
  closeDatabase();
});

describe('health', () => {
  it('returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('up');
    expect(body.version).toBe('0.1.0');
  });
});

describe('devices', () => {
  it('lists seeded devices with rooms', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/devices' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('roomName');
    expect(body.data[0].isSimulated).toBe(true);
  });

  it('returns 404 for unknown device', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/devices/dev_nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});

describe('readings', () => {
  it('validates limit', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings?limit=99999' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_QUERY');
  });

  it('returns readings with pagination meta', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings?limit=5' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('hasMore');
    expect(body.meta.serverTime).toBeTruthy();
  });

  it('latest returns fresh readings', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings/latest' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].isSimulated).toBe(true);
  });

  it('summary returns totals and dataQuality', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings/summary' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveProperty('totals');
    expect(body.data).toHaveProperty('dataQuality');
    expect(body.data.dataQuality.simulated).toBe(true);
    expect(body.data.dataQuality.simulatedReadings).toBeGreaterThan(0);
  });

  it('aggregate returns buckets', async () => {
    const now = new Date().toISOString();
    const from = new Date(Date.now() - 3600_000).toISOString();
    const res = await app.inject({
      method: 'GET',
      url: `/api/readings/aggregate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(now)}&bucket=hour&groupBy=device`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe('config', () => {
  it('exposes tariff and simulated notice', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/config' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.dataSource.simulated).toBe(true);
    expect(body.data.dataSource.notice).toContain('SIMULATED');
    expect(body.data.tariff.type).toBe('slab');
    expect(body.data.currency).toBe('INR');
  });
});

describe('dev endpoints', () => {
  it('reset reseeds', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/dev/reset' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.seeded).toBe(true);
  });
});

describe('shared contract schemas', () => {
  it('validates every implemented success response against the authoritative contract', async () => {
    const now = new Date().toISOString();
    const from = new Date(Date.now() - 3600_000).toISOString();
    const responses: Array<[unknown, unknown]> = [
      [HealthResponseSchema, (await app.inject({ method: 'GET', url: '/api/health' })).json()],
      [ListResponseSchema(SiteSchema), (await app.inject({ method: 'GET', url: '/api/sites' })).json()],
      [ListResponseSchema(SiteSummarySchema), (await app.inject({ method: 'GET', url: '/api/sites/summary' })).json()],
      [ItemResponseSchema(SiteSchema), (await app.inject({ method: 'GET', url: '/api/sites/site_home_01' })).json()],
      [ListResponseSchema(RoomSchema), (await app.inject({ method: 'GET', url: '/api/rooms' })).json()],
      [ItemResponseSchema(RoomSchema), (await app.inject({ method: 'GET', url: '/api/rooms/room_bed_01' })).json()],
      [ListResponseSchema(DeviceSchema), (await app.inject({ method: 'GET', url: '/api/devices' })).json()],
      [ItemResponseSchema(DeviceSchema), (await app.inject({ method: 'GET', url: '/api/devices/dev_bed_ac_01' })).json()],
      [ListResponseSchema(ReadingSchema), (await app.inject({ method: 'GET', url: '/api/readings?limit=5' })).json()],
      [LatestReadingsResponseSchema, (await app.inject({ method: 'GET', url: '/api/readings/latest' })).json()],
      [ItemResponseSchema(SummarySchema), (await app.inject({ method: 'GET', url: '/api/readings/summary' })).json()],
      [ListResponseSchema(AggregatePointSchema), (await app.inject({ method: 'GET', url: `/api/readings/aggregate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(now)}` })).json()],
      [ItemResponseSchema(SiteConfigSchema), (await app.inject({ method: 'GET', url: '/api/config' })).json()],
      [ItemResponseSchema(SeedResultSchema), (await app.inject({ method: 'POST', url: '/api/dev/seed', payload: {} })).json()],
      [ItemResponseSchema(SeedResultSchema), (await app.inject({ method: 'POST', url: '/api/dev/reset' })).json()],
    ];

    for (const [schema, body] of responses) {
      const result = (schema as { safeParse(value: unknown): { success: boolean; error?: unknown } }).safeParse(body);
      expect(result.success, JSON.stringify(result.error)).toBe(true);
    }
  });
});

describe('campus hierarchy seed', () => {
  it('links campus spaces, circuits, and devices without changing reading ownership', () => {
    const db = getDb();
    const row = db.prepare(`
      SELECT b.name AS building, f.name AS floor, r.name AS space, c.name AS circuit, d.name AS device
      FROM devices d
      JOIN circuits c ON c.id = d.circuit_id
      JOIN rooms r ON r.id = d.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings b ON b.id = r.building_id
      WHERE d.id = 'dev_living_ac_01'
    `).get() as { building: string; floor: string; space: string; circuit: string; device: string } | undefined;
    expect(row).toMatchObject({ building: 'Academic Block', space: 'Computer Laboratory', device: 'Computer Lab HVAC' });
    expect(row?.floor).toBeTruthy();
    expect(row?.circuit).toContain('Computer Laboratory');
  });
});

describe('campus hierarchy API', () => {
  it('retrieves parent-child hierarchy and filters devices by circuit', async () => {
    const buildings = await app.inject({ method: 'GET', url: '/api/buildings?siteId=site_home_01' });
    const buildingId = buildings.json().data[0].id;
    const floors = await app.inject({ method: 'GET', url: `/api/floors?buildingId=${buildingId}` });
    const floorId = floors.json().data[0].id;
    const rooms = await app.inject({ method: 'GET', url: `/api/rooms?floorId=${floorId}` });
    const roomId = rooms.json().data[0].id;
    const circuits = await app.inject({ method: 'GET', url: `/api/circuits?roomId=${roomId}` });
    const circuitId = circuits.json().data[0].id;
    const devices = await app.inject({ method: 'GET', url: `/api/devices?circuitId=${circuitId}` });
    expect(floors.json().data.every((floor: { buildingId: string }) => floor.buildingId === buildingId)).toBe(true);
    expect(rooms.json().data.every((room: { floorId: string }) => room.floorId === floorId)).toBe(true);
    expect(circuits.json().data.every((circuit: { roomId: string }) => circuit.roomId === roomId)).toBe(true);
    expect(devices.json().data.every((device: { circuitId: string }) => device.circuitId === circuitId)).toBe(true);
  });

  it('returns empty collections for valid parents and 404 for missing parents', async () => {
    upsertBuilding(getDb(), { id: 'building_empty_01', siteId: 'site_home_01', name: 'Empty Building' });
    const empty = await app.inject({ method: 'GET', url: '/api/floors?buildingId=building_empty_01' });
    expect(empty.statusCode).toBe(200);
    expect(empty.json().data).toEqual([]);
    for (const url of ['/api/floors?buildingId=missing', '/api/rooms?floorId=missing', '/api/circuits?roomId=missing', '/api/devices?circuitId=missing']) {
      const response = await app.inject({ method: 'GET', url });
      expect(response.statusCode).toBe(404);
    }
  });
});
