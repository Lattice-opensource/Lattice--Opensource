import { buildApp } from './app.js';
import { openDatabase, closeDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { startLiveWriter, stopLiveWriter } from './services/simulator.js';
import { startMqttIngestion } from './services/mqtt.js';
import { startTuyaIngestion } from './services/tuya.js';
import { env, simulationEnabled, mqttEnabled, tuyaEnabled, redactSecret, databasePath } from './config.js';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import path from 'node:path';

async function acquireLock(): Promise<string> {
  const lockDir = path.dirname(databasePath);
  try { mkdirSync(lockDir, { recursive: true }); } catch { /* ignore */ }
  const lockPath = path.join(lockDir, 'lattice.lock');
  if (existsSync(lockPath)) {
    // Probe the health endpoint to decide whether another instance is truly running.
    let alive = false;
    try {
      const http = await import('node:http');
      alive = await new Promise<boolean>((resolve) => {
        const req = http.get(`http://127.0.0.1:${env.PORT || 4000}/api/health`, (res) => {
          resolve(res.statusCode === 200);
          res.resume();
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => { req.destroy(); resolve(false); });
      });
    } catch {
      alive = false;
    }
    if (alive) {
      console.error('[lattice] another instance is already running; exiting');
      process.exit(1);
    }
    // Stale lock; remove and continue.
    try { unlinkSync(lockPath); } catch { /* ignore */ }
  }
  try {
    writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
  } catch {
    // race; re-check
    try { unlinkSync(lockPath); } catch { /* ignore */ }
    writeFileSync(lockPath, String(process.pid));
  }
  return lockPath;
}

async function main(): Promise<void> {
  const lockPath = await acquireLock();
  const db = openDatabase();
  const seedRes = seedDatabase(db);
  console.log(`[lattice] seed: ${JSON.stringify(seedRes)}`);

  const liveStop = simulationEnabled
    ? startLiveWriter(db, {
        liveIntervalSeconds: env.SIMULATION_LIVE_INTERVAL_SECONDS,
        retentionSeconds: env.SIMULATION_LIVE_RETENTION_SECONDS,
        seed: env.SIMULATION_SEED,
      })
    : () => {};

  const mqttHandle = startMqttIngestion(db);
  console.log(`[lattice] mqtt: ${mqttEnabled ? 'enabled' : 'disabled'} (broker ${mqttEnabled ? (env.MQTT_BROKER_URL ?? '(unset)') : '(n/a)'}, password ${redactSecret(env.MQTT_PASSWORD)})`);

  const tuyaHandle = startTuyaIngestion(db);
  console.log(`[lattice] tuya: ${tuyaEnabled ? 'enabled' : 'disabled'} (device ${tuyaEnabled ? (env.TUYA_DEVICE_ID ?? '(unset)') : '(n/a)'}, access id ${redactSecret(env.TUYA_ACCESS_ID)})`);

  const app = await buildApp();
  const close = async () => {
    liveStop();
    stopLiveWriter();
    mqttHandle.stop();
    tuyaHandle.stop();
    await app.close();
    closeDatabase();
    try { unlinkSync(lockPath); } catch { /* ignore */ }
  };
  process.on('SIGINT', () => void close().then(() => process.exit(0)));
  process.on('SIGTERM', () => void close().then(() => process.exit(0)));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`[lattice] API listening on http://${env.HOST}:${env.PORT}`);
    console.log(`[lattice] simulation: ${simulationEnabled ? 'enabled' : 'disabled'}`);
    console.log(`[lattice] dev endpoints: ${env.NODE_ENV !== 'production' ? 'enabled' : 'disabled'}`);
  } catch (err) {
    console.error(err);
    await close();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
