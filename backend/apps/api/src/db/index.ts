import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { databasePath } from '../config.js';

let db: DatabaseSync | null = null;

export function openDatabase(filePath: string = databasePath): DatabaseSync {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const instance = new DatabaseSync(filePath);
  instance.exec('PRAGMA journal_mode = WAL;');
  instance.exec('PRAGMA foreign_keys = ON;');
  instance.exec('PRAGMA synchronous = NORMAL;');
  // schema.sql is copied next to the compiled module by `npm run build`.
  // In dev (tsx) it is read from src/db/schema.sql next to this source file.
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  instance.exec(schema);
  // Backward-compatible column additions for existing databases.
  const alterStatements = [
    'ALTER TABLE rooms ADD COLUMN building_id TEXT REFERENCES buildings(id) ON DELETE SET NULL',
    'ALTER TABLE rooms ADD COLUMN floor_id TEXT REFERENCES floors(id) ON DELETE SET NULL',
    'ALTER TABLE rooms ADD COLUMN circuit_id TEXT REFERENCES circuits(id) ON DELETE SET NULL',
    'ALTER TABLE rooms ADD COLUMN x REAL',
    'ALTER TABLE rooms ADD COLUMN y REAL',
    'ALTER TABLE rooms ADD COLUMN width REAL',
    'ALTER TABLE rooms ADD COLUMN height REAL',
    'ALTER TABLE rooms ADD COLUMN boundary TEXT',
    'ALTER TABLE rooms ADD COLUMN area_sqm REAL',
    'ALTER TABLE rooms ADD COLUMN room_type TEXT',
    'ALTER TABLE devices ADD COLUMN appliance_id TEXT REFERENCES appliances(id) ON DELETE SET NULL',
    'ALTER TABLE appliances ADD COLUMN device_id TEXT REFERENCES devices(id) ON DELETE SET NULL',
    'ALTER TABLE appliances ADD COLUMN position_x REAL',
    'ALTER TABLE appliances ADD COLUMN position_y REAL',
  ];
  for (const stmt of alterStatements) {
    try {
      instance.exec(stmt);
    } catch {
      // Column already exists; ignore.
    }
  }
  db = instance;
  return instance;
}

export function getDb(): DatabaseSync {
  if (!db) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function isDbOpen(): boolean {
  return db !== null;
}
