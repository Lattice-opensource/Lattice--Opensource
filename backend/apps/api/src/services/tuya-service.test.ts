import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// Configure Tuya env before the (dynamically imported) config module reads it.
process.env.TUYA_ENABLED = 'true';
process.env.TUYA_ACCESS_ID = 'aid';
process.env.TUYA_ACCESS_SECRET = 'asecret';
process.env.TUYA_BASE_URL = 'https://openapi.tuyain.com';
process.env.TUYA_DEVICE_ID = 'tuya_test_device';
process.env.TUYA_DEVICE_IDS = 'tuya_test_device';
process.env.TUYA_POLL_INTERVAL_SECONDS = '60';

let db: DatabaseSync;
let startTuyaIngestion: any;
let mapTuyaStatusToReading: any;

const TEST_DB = path.join(process.env.TEMP ?? 'C:\\temp', 'lattice-tuya-service-test.db');

beforeAll(async () => {
  const mod = await import('../db/index.js');
  const seedMod = await import('../db/seed.js');
  const tuyaMod = await import('./tuya.js');
  fs.rmSync(TEST_DB, { force: true });
  db = mod.openDatabase(TEST_DB);
  seedMod.seedDatabase(db, { force: true });
  startTuyaIngestion = tuyaMod.startTuyaIngestion;
  mapTuyaStatusToReading = tuyaMod.mapTuyaStatusToReading;
});

afterAll(async () => {
  const mod = await import('../db/index.js');
  mod.closeDatabase();
  for (const f of [TEST_DB, TEST_DB + '-wal', TEST_DB + '-shm']) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
});

describe('Tuya service ingestion', () => {
  it('stores a reading when the client succeeds', async () => {
    const client = {
      getDevice: async () => ({ custom_name: 'Test Plug' }),
      getDeviceStatus: async () => ({ success: true, result: [{ code: 'cur_power', value: 1234 }] }),
    };
    const handle = startTuyaIngestion(db, client);
    await new Promise((r) => setTimeout(r, 100));
    handle.stop();
    const row = db.prepare('SELECT power_w, source, is_simulated FROM readings WHERE device_id = ?').get('tuya_test_device') as any;
    expect(row).toBeTruthy();
    expect(row.power_w).toBe(123.4);
    expect(row.source).toBe('device');
    expect(row.is_simulated).toBe(0);
    const dev = db.prepare('SELECT is_simulated, category FROM devices WHERE id = ?').get('tuya_test_device') as any;
    expect(dev.is_simulated).toBe(0);
    // category is refined from Tuya device info; the mock provides no category
    // so the fallback ('electronics') is used.
    expect(dev.category).toBe('electronics');
  });

  it('does not crash when the client fails (simulator fallback preserved)', async () => {
    const failing = {
      getDevice: async () => { throw new Error('boom'); },
      getDeviceStatus: async () => { throw new Error('boom'); },
    };
    const handle = startTuyaIngestion(db, failing);
    await new Promise((r) => setTimeout(r, 100));
    handle.stop();
    // Existing readings still present
    const count = (db.prepare('SELECT COUNT(*) AS n FROM readings').get() as any).n;
    expect(count).toBeGreaterThan(0);
  });
});