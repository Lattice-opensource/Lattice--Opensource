import type { DatabaseSync } from 'node:sqlite';
import type { Site } from '@lattice/contracts';
import { toIso } from '../../lib/time.js';

interface SiteRow {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  tariff_json: string;
  created_at: string;
  updated_at: string;
}

function rowToSite(row: SiteRow): Site {
  return {
    id: row.id,
    name: row.name,
    timezone: row.timezone,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listSites(db: DatabaseSync): Site[] {
  const rows = db.prepare('SELECT * FROM sites ORDER BY id').all() as unknown as SiteRow[];
  return rows.map(rowToSite);
}

export function getSite(db: DatabaseSync, id: string): Site | null {
  const row = db.prepare('SELECT * FROM sites WHERE id = ?').get(id) as SiteRow | undefined;
  return row ? rowToSite(row) : null;
}

export function getSiteTariffJson(db: DatabaseSync, id: string): string | null {
  const row = db.prepare('SELECT tariff_json FROM sites WHERE id = ?').get(id) as
    | { tariff_json: string }
    | undefined;
  return row?.tariff_json ?? null;
}

export function upsertSite(
  db: DatabaseSync,
  site: { id: string; name: string; timezone: string; currency: string; tariffJson: string },
): void {
  const now = toIso(new Date());
  db.prepare(
    `INSERT INTO sites (id, name, timezone, currency, tariff_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       timezone = excluded.timezone,
       currency = excluded.currency,
       tariff_json = excluded.tariff_json,
       updated_at = excluded.updated_at`,
  ).run(site.id, site.name, site.timezone, site.currency, site.tariffJson, now, now);
}


