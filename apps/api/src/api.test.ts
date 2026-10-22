import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { openDatabase, closeDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { buildApp } from './app.js';
import { startLiveWriter, stopLiveWriter } from './services/simulator.js';
import { env } from './config.js';
import type { FastifyInstance } from 'fastify';

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
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
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
