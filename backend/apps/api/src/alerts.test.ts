import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { openDatabase, closeDatabase, getDb } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { buildApp } from './app.js';
import { detectAlerts } from './services/alerts.js';
import type { FastifyInstance } from 'fastify';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

let app: FastifyInstance;

beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'lattice-alerts-'));
  const dbPath = path.join(dir, 'test.db');
  const db = openDatabase(dbPath);
  seedDatabase(db, { force: true });
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  closeDatabase();
});

describe('alerts API and detection', () => {
  it('lists alerts', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/alerts' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('detects missing readings', () => {
    const db = getDb();
    db.prepare("UPDATE devices SET last_seen_at = '2020-01-01T00:00:00.000Z', status = 'online' WHERE id = 'dev_bed_ac_01'").run();
    const created = detectAlerts(db);
    expect(created.some((a) => a.type === 'missing_readings' && a.deviceId === 'dev_bed_ac_01')).toBe(true);
  });

  it('deduplicates missing-reading alerts', () => {
    const db = getDb();
    const before = (db.prepare("SELECT COUNT(*) AS n FROM alerts WHERE type = 'missing_readings' AND device_id = 'dev_bed_ac_01'").get() as { n: number }).n;
    detectAlerts(db);
    const after = (db.prepare("SELECT COUNT(*) AS n FROM alerts WHERE type = 'missing_readings' AND device_id = 'dev_bed_ac_01'").get() as { n: number }).n;
    expect(after).toBe(before);
  });

  it('acknowledges and resolves an alert', async () => {
    const list = await app.inject({ method: 'GET', url: "/api/alerts?status=active&type=missing_readings" });
    const alert = list.json().data[0];
    expect(alert).toBeTruthy();
    const ack = await app.inject({ method: 'POST', url: `/api/alerts/${alert.id}/acknowledge` });
    expect(ack.statusCode).toBe(200);
    expect(ack.json().data.status).toBe('acknowledged');
    const resolved = await app.inject({ method: 'POST', url: `/api/alerts/${alert.id}/resolve` });
    expect(resolved.statusCode).toBe(200);
    expect(resolved.json().data.status).toBe('resolved');
  });

  it('filters by status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/alerts?status=resolved' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.every((a: any) => a.status === 'resolved')).toBe(true);
  });

  it('returns 404 for unknown alert', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/alerts/nope' });
    expect(res.statusCode).toBe(404);
  });
});
