import { buildApp } from './app.js';
import { openDatabase, closeDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { startLiveWriter, stopLiveWriter } from './services/simulator.js';
import { env, simulationEnabled } from './config.js';

async function main(): Promise<void> {
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

  const app = await buildApp();
  const close = async () => {
    liveStop();
    stopLiveWriter();
    await app.close();
    closeDatabase();
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
