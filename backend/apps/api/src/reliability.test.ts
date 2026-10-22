import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { openDatabase, closeDatabase, getDb } from './db/index.js';
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
  // Wait for at least one live tick so /api/readings/latest is fresh.
  await new Promise((r) => setTimeout(r, 12000));
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  stopLiveWriter();
  await app.close();
  closeDatabase();
});

describe('energy calculation', () => {
  it('interval energy is consistent with power and duration', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings?limit=50' });
    expect(res.statusCode).toBe(200);
    const rows = res.json().data as Array<{ powerW: number; energyKwh: number | null; intervalSeconds: number }>;
    for (const r of rows) {
      if (r.energyKwh === null) continue;
      const expected = (r.powerW * r.intervalSeconds) / 3_600_000;
      expect(Math.abs(r.energyKwh - expected)).toBeLessThan(0.001 + expected * 0.05);
    }
  });

  it('cumulative energy never decreases', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings?deviceId=dev_bed_ac_01&limit=1000&order=asc' });
    expect(res.statusCode).toBe(200);
    const rows = res.json().data as Array<{ energyKwhTotal: number | null }>;
    let prev = -Infinity;
    for (const r of rows) {
      if (r.energyKwhTotal === null) continue;
      expect(r.energyKwhTotal).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = r.energyKwhTotal;
    }
    expect(rows.length).toBeGreaterThan(0);
  });

  it('main meter is not double-counted in site totals', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings/summary' });
    expect(res.statusCode).toBe(200);
    const body = res.json().data;
    const mainMeter = (body.byDevice as Array<{ deviceId: string; powerW: number }>).find(
      (d) => d.deviceId === 'dev_main_meter_01',
    );
    expect(mainMeter).toBeTruthy();
    // Site total power should equal the main meter's power, not sum of all devices.
    expect(Math.abs(body.totals.powerW - (mainMeter?.powerW ?? 0))).toBeLessThan(0.01);
  });
});

describe('aggregate & daily boundaries', () => {
  it('returns 400 for invalid bucket', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/readings/aggregate?from=2026-10-21T00:00:00Z&to=2026-10-22T00:00:00Z&bucket=decade',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_QUERY');
  });

  it('returns 400 for missing from/to', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings/aggregate?bucket=hour' });
    expect(res.statusCode).toBe(400);
  });

  it('day buckets start at midnight in site timezone (Asia/Kolkata)', async () => {
    const from = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const to = new Date().toISOString();
    const res = await app.inject({
      method: 'GET',
      url: `/api/readings/aggregate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&bucket=day&groupBy=site`,
    });
    expect(res.statusCode).toBe(200);
    const points = res.json().data as Array<{ bucketStart: string }>;
    if (points.length > 0) {
      // 00:00 IST = 18:30 UTC previous day
      for (const p of points) {
        const d = new Date(p.bucketStart);
        // bucket start minutes in UTC should be 30 (18:30) for IST midnight
        expect(d.getUTCMinutes()).toBe(30);
      }
    }
  });

  it('site-level aggregate excludes appliance double counting', async () => {
    const from = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
    const to = new Date().toISOString();
    const res = await app.inject({
      method: 'GET',
      url: `/api/readings/aggregate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&bucket=hour&groupBy=site`,
    });
    expect(res.statusCode).toBe(200);
    const points = res.json().data as Array<{ sampleCount: number }>;
    // site points should have fewer samples than device-level (only main meter)
    const devRes = await app.inject({
      method: 'GET',
      url: `/api/readings/aggregate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&bucket=hour&groupBy=device`,
    });
    const devPoints = devRes.json().data as Array<{ sampleCount: number }>;
    const siteSamples = points.reduce((a, p) => a + p.sampleCount, 0);
    const devSamples = devPoints.reduce((a, p) => a + p.sampleCount, 0);
    expect(siteSamples).toBeLessThan(devSamples);
  });
});

describe('invalid params & missing devices', () => {
  it('400 for invalid limit', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings?limit=99999' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_QUERY');
  });

  it('400 for invalid from timestamp', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings?from=not-a-date' });
    expect(res.statusCode).toBe(400);
  });

  it('404 for missing device', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/devices/dev_does_not_exist' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });

  it('404 for unknown site', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/sites/nope' });
    expect(res.statusCode).toBe(404);
  });
});

describe('API response schemas', () => {
  it('health has timestamp and service', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
    expect(body.service).toBe('lattice-backend');
  });

  it('readings/latest has readings/count/generatedAt', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings/latest?limit=3' });
    const body = res.json();
    expect(Array.isArray(body.readings)).toBe(true);
    expect(typeof body.count).toBe('number');
    expect(body.generatedAt).toBeTruthy();
    if (body.readings.length > 0) {
      const r = body.readings[0];
      expect(r).toHaveProperty('powerWatts');
      expect(['simulated', 'real']).toContain(r.source);
    }
  });

  it('error responses have no stack traces or paths', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/devices/dev_nope' });
    const text = res.body;
    expect(text).not.toMatch(/node_modules|\.ts:|stack/i);
    expect(text).not.toMatch(/C:\\\\/);
  });
});

describe('simulator freshness', () => {
  it('latest reading is under 30 seconds old', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings/latest' });
    const body = res.json();
    const ts = new Date(body.readings[0].timestamp).getTime();
    const age = (Date.now() - ts) / 1000;
    expect(age).toBeLessThan(30);
  });
});

describe('cost estimates', () => {
  it('summary exposes costIsEstimate', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/readings/summary' });
    const body = res.json().data;
    expect(body.totals.costIsEstimate).toBe(true);
  });
});
