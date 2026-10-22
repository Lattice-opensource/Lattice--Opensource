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
