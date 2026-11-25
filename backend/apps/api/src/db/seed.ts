import type { DatabaseSync } from 'node:sqlite';
import { env, seedOnStart, simulationEnabled } from '../config.js';
import { upsertSimulatedDevices, backfillHistory, SITE_ID } from '../services/simulator.js';
import { countDevices } from '../db/repositories/devices.js';
import { countReadings as countReadingsRepo } from '../db/repositories/readings.js';
import { upsertSite } from '../db/repositories/sites.js';

export interface SeedOptions {
  force?: boolean;
}

export function seedDatabase(db: DatabaseSync, opts: SeedOptions = {}): { seeded: boolean; reason: string } {
  // Ensure the default site exists even when simulation is disabled, so real
  // (Tuya) devices can be registered against it.
  upsertSite(db, {
    id: SITE_ID,
    name: 'Lattice Home',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    tariffJson: JSON.stringify({
      type: 'slab',
      unit: 'kWh',
      slabs: [
        { upToKwh: 100, rateInrPerKwh: 2.5 },
        { upToKwh: 400, rateInrPerKwh: 5.5 },
        { upToKwh: null, rateInrPerKwh: 7.5 },
      ],
    }),
  });

  if (!simulationEnabled) {
    return { seeded: false, reason: 'simulation disabled (SIMULATION_ENABLED=false)' };
  }
  if (!seedOnStart && !opts.force) {
    return { seeded: false, reason: 'SEED_ON_START=false' };
  }

  const force = opts.force ?? false;
  const hasDevices = countDevices(db) > 0;
  const hasReadings = countReadingsRepo(db) > 0;

  if (hasDevices && hasReadings && !force) {
    return { seeded: false, reason: 'database already populated' };
  }

  if (force) {
    db.exec('DELETE FROM readings;');
    db.exec('DELETE FROM devices;');
    db.exec('DELETE FROM circuits;');
    db.exec('DELETE FROM rooms;');
    db.exec('DELETE FROM floors;');
    db.exec('DELETE FROM buildings;');
    db.exec('DELETE FROM sites;');
  }

  upsertSimulatedDevices(db, env.SIMULATION_SEED);
  if (force || !hasReadings) {
    backfillHistory(db, {
      hours: env.SIMULATION_HISTORY_HOURS,
      intervalSeconds: env.SIMULATION_INTERVAL_SECONDS,
      seed: env.SIMULATION_SEED,
    });
  }
  return { seeded: true, reason: force ? 'forced reseed' : 'initial seed' };
}

