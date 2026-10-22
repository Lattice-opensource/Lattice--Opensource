import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { unlinkSync } from 'node:fs';
import path from 'node:path';
import { openDatabase, closeDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { validateTelemetry, ingestTelemetry, startMqttIngestion } from './services/mqtt.js';

const TEST_DB = path.join(process.env.TEMP ?? 'C:\\temp', 'lattice-mqtt-test.db');

let db: DatabaseSync;

beforeAll(() => {
  try { unlinkSync(TEST_DB); } catch { /* ignore */ }
  try { unlinkSync(TEST_DB + '-wal'); } catch { /* ignore */ }
  try { unlinkSync(TEST_DB + '-shm'); } catch { /* ignore */ }
  db = openDatabase(TEST_DB);
  seedDatabase(db, { force: true });
});

afterAll(() => {
  closeDatabase();
  for (const f of [TEST_DB, TEST_DB + '-wal', TEST_DB + '-shm']) {
    try { unlinkSync(f); } catch { /* ignore */ }
  }
});

describe('validateTelemetry', () => {
  it('accepts a valid payload', () => {
    const r = validateTelemetry({
      deviceId: 'dev_bed_ac_01',
      timestamp: new Date().toISOString(),
      powerW: 100,
      energyKwh: 0.01,
    });
    expect(r.ok).toBe(true);
  });

  it('rejects missing deviceId', () => {
    const r = validateTelemetry({ timestamp: new Date().toISOString(), powerW: 100 });
    expect(r.ok).toBe(false);
  });

  it('rejects invalid power', () => {
    const r = validateTelemetry({ deviceId: 'dev_bed_ac_01', timestamp: new Date().toISOString(), powerW: -5 });
    expect(r.ok).toBe(false);
  });

  it('rejects stale timestamp', () => {
    const old = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const r = validateTelemetry({ deviceId: 'dev_bed_ac_01', timestamp: old, powerW: 100 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('stale');
  });

  it('rejects future timestamp', () => {
    const future = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const r = validateTelemetry({ deviceId: 'dev_bed_ac_01', timestamp: future, powerW: 100 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('future');
  });

  it('rejects invalid units (energy negative)', () => {
    const r = validateTelemetry({ deviceId: 'dev_bed_ac_01', timestamp: new Date().toISOString(), powerW: 100, energyKwh: -1 });
    expect(r.ok).toBe(false);
  });

  it('rejects malformed deviceId characters', () => {
    const r = validateTelemetry({ deviceId: 'dev bed ac', timestamp: new Date().toISOString(), powerW: 100 });
    expect(r.ok).toBe(false);
  });
});

describe('ingestTelemetry', () => {
  it('inserts a valid real reading', () => {
    const ts = new Date(Date.now() - 10000).toISOString();
    const res = ingestTelemetry(db, {
      deviceId: 'dev_bed_ac_01',
      timestamp: ts,
      powerW: 120,
      energyKwh: 0.003,
      energyKwhTotal: 5.5,
    });
    expect(res.inserted).toBe(true);
  });

  it('rejects duplicate messages', () => {
    const ts = new Date(Date.now() - 20000).toISOString();
    ingestTelemetry(db, { deviceId: 'dev_bed_ac_01', timestamp: ts, powerW: 120 });
    const second = ingestTelemetry(db, { deviceId: 'dev_bed_ac_01', timestamp: ts, powerW: 120 });
    expect(second.inserted).toBe(false);
    expect(second.reason).toBe('duplicate');
  });

  it('rejects unknown device', () => {
    const res = ingestTelemetry(db, { deviceId: 'dev_unknown', timestamp: new Date().toISOString(), powerW: 10 });
    expect(res.inserted).toBe(false);
    expect(res.reason).toBe('unknown device');
  });

  it('stores cumulative and interval energy distinctly', () => {
    const ts = new Date(Date.now() - 30000).toISOString();
    ingestTelemetry(db, { deviceId: 'dev_fan_01', timestamp: ts, powerW: 40, energyKwh: 0.001, energyKwhTotal: 1.2 });
    const row = db.prepare('SELECT energy_kwh, energy_kwh_total, source, is_simulated FROM readings WHERE device_id=? AND timestamp=?').get('dev_fan_01', new Date(ts).toISOString()) as any;
    expect(row.energy_kwh).toBe(0.001);
    expect(row.energy_kwh_total).toBe(1.2);
    expect(row.source).toBe('device');
    expect(row.is_simulated).toBe(0);
  });

  it('marks real readings as non-simulated', () => {
    const ts = new Date(Date.now() - 40000).toISOString();
    ingestTelemetry(db, { deviceId: 'dev_tv_01', timestamp: ts, powerW: 50 });
    const row = db.prepare('SELECT is_simulated, source FROM readings WHERE device_id=? AND timestamp=?').get('dev_tv_01', new Date(ts).toISOString()) as any;
    expect(row.is_simulated).toBe(0);
    expect(row.source).toBe('device');
  });

  it('converts currentMa to amps', () => {
    const ts = new Date(Date.now() - 50000).toISOString();
    const res = ingestTelemetry(db, { deviceId: 'dev_fridge_01', timestamp: ts, powerW: 80, currentMa: 350 });
    expect(res.inserted).toBe(true);
    const row = db.prepare('SELECT current_a FROM readings WHERE device_id=? AND timestamp=?').get('dev_fridge_01', new Date(ts).toISOString()) as any;
    expect(row.current_a).toBeCloseTo(0.35, 5);
  });

  it('preserves currentA when provided', () => {
    const ts = new Date(Date.now() - 60000).toISOString();
    const res = ingestTelemetry(db, { deviceId: 'dev_geyser_01', timestamp: ts, powerW: 0, currentA: 1.25 });
    expect(res.inserted).toBe(true);
    const row = db.prepare('SELECT current_a FROM readings WHERE device_id=? AND timestamp=?').get('dev_geyser_01', new Date(ts).toISOString()) as any;
    expect(row.current_a).toBe(1.25);
  });
});

describe('startMqttIngestion', () => {
  it('returns a no-op handle when disabled (default)', () => {
    const handle = startMqttIngestion(db);
    expect(typeof handle.stop).toBe('function');
    handle.stop();
  });
});
