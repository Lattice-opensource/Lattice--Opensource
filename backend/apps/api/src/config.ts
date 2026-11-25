import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** Repo root (the directory containing package.json). */
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
export const API_ROOT = path.resolve(__dirname, '..');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().min(1).default(process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
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
  MQTT_ENABLED: z.string().optional(),
  MQTT_BROKER_URL: z.string().optional(),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_TOPIC_PREFIX: z.string().min(1).optional(),
  MQTT_CLIENT_ID: z.string().min(1).optional(),
  MQTT_QOS: z.coerce.number().int().min(0).max(2).optional(),
  TUYA_ENABLED: z.string().optional(),
  TUYA_ACCESS_ID: z.string().min(1).optional(),
  TUYA_ACCESS_SECRET: z.string().min(1).optional(),
  TUYA_BASE_URL: z.string().min(1).optional(),
  TUYA_DEVICE_ID: z.string().min(1).optional(),
  TUYA_DEVICE_IDS: z.string().min(1).optional(),
  TUYA_POLL_INTERVAL_SECONDS: z.coerce.number().int().min(5).max(3600).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnvFile(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(REPO_ROOT, '.env'),
    path.resolve(API_ROOT, '..', '.env'),
  ];
  for (const p of candidates) {
    let raw: string;
    try {
      raw = readFileSync(p, 'utf8');
    } catch {
      // File missing is expected; ignore.
      continue;
    }
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
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
export const simulationEnabled = parseBool(env.SIMULATION_ENABLED, true);
export const devEndpointsEnabled = parseBool(env.ENABLE_DEV_ENDPOINTS, env.NODE_ENV !== 'production');
export const seedOnStart = parseBool(env.SEED_ON_START, true);

export const mqttEnabled = parseBool(env.MQTT_ENABLED, false);
export const mqttBrokerUrl = env.MQTT_BROKER_URL;
export const mqttUsername = env.MQTT_USERNAME;
export const mqttPassword = env.MQTT_PASSWORD;
export const mqttTopicPrefix = (env.MQTT_TOPIC_PREFIX ?? 'lattice/telemetry').replace(/\/$/, '');
export const mqttClientId = env.MQTT_CLIENT_ID ?? 'lattice-api';
export const mqttQos = (env.MQTT_QOS ?? 1) as 0 | 1 | 2;

export const tuyaEnabled = parseBool(env.TUYA_ENABLED, false);
export const tuyaAccessId = env.TUYA_ACCESS_ID;
export const tuyaAccessSecret = env.TUYA_ACCESS_SECRET;
export const tuyaBaseUrl = env.TUYA_BASE_URL;
export const tuyaDeviceId = env.TUYA_DEVICE_ID;
export const tuyaDeviceIds = (env.TUYA_DEVICE_IDS ?? env.TUYA_DEVICE_ID ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
export const tuyaPollIntervalSeconds = env.TUYA_POLL_INTERVAL_SECONDS ?? 60;

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
