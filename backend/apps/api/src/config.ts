import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** Repo root (the directory containing package.json). */
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
export const API_ROOT = path.resolve(__dirname, '..');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  HOST: z.string().min(1).default('127.0.0.1'),
  DATABASE_PATH: z.string().min(1).optional(),
  CORS_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  API_KEY: z.string().min(8).optional(),
  SIMULATION_ENABLED: z.string().optional(),
  SIMULATION_SEED: z.coerce.number().int().default(20261022),
  SIMULATION_HISTORY_HOURS: z.coerce.number().int().min(1).max(720).default(24),
  SIMULATION_INTERVAL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  SIMULATION_LIVE_INTERVAL_SECONDS: z.coerce.number().int().min(1).max(300).default(10),
  SIMULATION_LIVE_RETENTION_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),
  SEED_ON_START: z.string().optional(),
  ENABLE_DEV_ENDPOINTS: z.string().optional(),
  STALE_AFTER_SECONDS: z.coerce.number().int().min(60).max(86400).default(1800),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnvFile(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(REPO_ROOT, '.env'),
    path.resolve(API_ROOT, '..', '.env'),
  ];
  for (const p of candidates) {
    try {
      process.loadEnvFile(p);
    } catch {
      // File missing is expected; ignore.
    }
  }
}

loadEnvFile();

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;

function parseBool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  const s = v.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;
  return fallback;
}

export const isProduction = env.NODE_ENV === 'production';
export const simulationEnabled = parseBool(env.SIMULATION_ENABLED, env.NODE_ENV !== 'production');
export const devEndpointsEnabled = parseBool(env.ENABLE_DEV_ENDPOINTS, env.NODE_ENV !== 'production');
export const seedOnStart = parseBool(env.SEED_ON_START, true);

export const databasePath = env.DATABASE_PATH
  ? path.resolve(process.cwd(), env.DATABASE_PATH)
  : path.resolve(REPO_ROOT, 'data', 'lattice.db');

export const corsOrigins = (env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const APP_VERSION = '0.1.0';
export const STALE_AFTER_SECONDS = env.STALE_AFTER_SECONDS;

export function redactSecret(value: string | undefined): string {
  if (!value) return '(unset)';
  const h = createHash('sha256').update(value).digest('hex').slice(0, 8);
  return `set (sha256:${h})`;
}
