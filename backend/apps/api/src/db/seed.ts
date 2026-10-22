import type { DatabaseSync } from 'node:sqlite';
import { env, seedOnStart, simulationEnabled } from '../config.js';
import { upsertSimulatedDevices, backfillHistory } from '../services/simulator.js';
import { countDevices } from '../db/repositories/devices.js';
import { countReadings as countReadingsRepo } from '../db/repositories/readings.js';

export interface SeedOptions {
  force?: boolean;
}

export function seedDatabase(db: DatabaseSync, opts: SeedOptions = {}): { seeded: boolean; reason: string } {
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
    db.exec('DELETE FROM rooms;');
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

