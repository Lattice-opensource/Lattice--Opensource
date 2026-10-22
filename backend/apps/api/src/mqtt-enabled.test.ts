import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('startMqttIngestion enabled path', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MQTT_ENABLED = 'true';
    process.env.MQTT_BROKER_URL = 'mqtt://localhost:1883';
  });
  afterEach(() => {
    delete process.env.MQTT_ENABLED;
    delete process.env.MQTT_BROKER_URL;
    vi.resetModules();
  });

  it('connects, subscribes, ingests a message, and stops cleanly', async () => {
    const handlers: Record<string, (...args: any[]) => void> = {};
    const fakeClient = {
      on: (event: string, cb: (...args: any[]) => void) => { handlers[event] = cb; return fakeClient; },
      subscribe: (_t: string, _o: any, cb: (err?: Error) => void) => cb(),
      end: vi.fn(),
    };
    const factory = () => fakeClient as any;

    const { openDatabase, closeDatabase } = await import('./db/index.js');
    const { seedDatabase } = await import('./db/seed.js');
    const dbPath = (process.env.TEMP ?? 'C:\\temp') + '\\lattice-mqtt-enabled.db';
    try { (await import('node:fs')).unlinkSync(dbPath); } catch {}
    const db = openDatabase(dbPath);
    seedDatabase(db, { force: true });

    const { startMqttIngestion } = await import('./services/mqtt.js');
    const handle = startMqttIngestion(db, factory as any);
    // trigger connect
    handlers.connect?.();

    // simulate a message
    const ts = new Date(Date.now() - 1000).toISOString();
    handlers.message?.('lattice/telemetry/dev_bed_ac_01/telemetry', Buffer.from(JSON.stringify({
      deviceId: 'dev_bed_ac_01',
      timestamp: ts,
      powerW: 99,
    })));

    const row = db.prepare('SELECT power_w, source, is_simulated FROM readings WHERE device_id=? AND timestamp=?').get('dev_bed_ac_01', new Date(ts).toISOString()) as any;
    expect(row).toBeTruthy();
    expect(row.power_w).toBe(99);
    expect(row.source).toBe('device');
    expect(row.is_simulated).toBe(0);

    handle.stop();
    expect(fakeClient.end).toHaveBeenCalled();

    closeDatabase();
  });

  it('logs and stays disabled-ish when broker url missing', async () => {
    delete process.env.MQTT_BROKER_URL;
    const { openDatabase, closeDatabase } = await import('./db/index.js');
    const db = openDatabase();
    const { startMqttIngestion } = await import('./services/mqtt.js');
    const handle = startMqttIngestion(db);
    expect(typeof handle.stop).toBe('function');
    handle.stop();
    closeDatabase();
  });
});
