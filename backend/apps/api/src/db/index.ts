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
  ensureColumn(instance, 'rooms', 'building_id', 'TEXT REFERENCES buildings(id) ON DELETE SET NULL');
  ensureColumn(instance, 'rooms', 'floor_id', 'TEXT REFERENCES floors(id) ON DELETE SET NULL');
  ensureColumn(instance, 'devices', 'circuit_id', 'TEXT REFERENCES circuits(id) ON DELETE SET NULL');
  instance.exec('CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building_id);');
  instance.exec('CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor_id);');
  instance.exec('CREATE INDEX IF NOT EXISTS idx_devices_circuit ON devices(circuit_id);');
  db = instance;
  return instance;
}

function ensureColumn(instance: DatabaseSync, table: string, column: string, definition: string): void {
  const columns = instance.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((entry) => entry.name === column)) {
    instance.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
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
