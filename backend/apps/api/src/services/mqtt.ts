import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import mqtt, { type MqttClient } from 'mqtt';
import { env, mqttBrokerUrl, mqttClientId, mqttEnabled, mqttPassword, mqttQos, mqttTopicPrefix, mqttUsername } from '../config.js';
import { insertMqttReading } from '../db/repositories/readings.js';
import { getDevice } from '../db/repositories/devices.js';
import { redactSecret } from '../config.js';

const TelemetrySchema = z.object({
  deviceId: z.string().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/),
  timestamp: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'invalid ISO-8601 timestamp'),
  powerW: z.number().finite().min(0).max(100000),
  energyKwh: z.number().finite().min(0).optional(),
  energyKwhTotal: z.number().finite().min(0).optional(),
  intervalSeconds: z.number().int().min(0).max(86400).optional(),
  voltageV: z.number().finite().min(0).max(1000).optional(),
  currentA: z.number().finite().min(0).max(1000).optional(),
});

export type TelemetryPayload = z.infer<typeof TelemetrySchema>;

export interface MqttIngestionHandle {
  stop: () => void;
}

const STALE_AFTER_MS = 5 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 60 * 1000;

export function validateTelemetry(payload: unknown, now: Date = new Date()): { ok: true; data: TelemetryPayload } | { ok: false; reason: string } {
  const parsed = TelemetrySchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  const data = parsed.data;
  const ts = new Date(data.timestamp);
  const age = now.getTime() - ts.getTime();
  if (age > STALE_AFTER_MS) return { ok: false, reason: 'stale timestamp' };
  if (age < -FUTURE_TOLERANCE_MS) return { ok: false, reason: 'future timestamp' };
  if (data.energyKwh !== undefined && data.energyKwhTotal !== undefined) {
    // both provided is allowed; nothing to reject
  }
  return { ok: true, data };
}

export function ingestTelemetry(
  db: DatabaseSync,
  payload: unknown,
  now: Date = new Date(),
): { inserted: boolean; reason?: string } {
  const v = validateTelemetry(payload, now);
  if (!v.ok) return { inserted: false, reason: v.reason };

  const device = getDevice(db, v.data.deviceId);
  if (!device) return { inserted: false, reason: 'unknown device' };

  const ts = new Date(v.data.timestamp);
  const intervalSeconds = v.data.intervalSeconds ?? (v.data.energyKwh !== undefined ? 60 : 0);
  const intervalStart = new Date(ts.getTime() - intervalSeconds * 1000);

  const inserted = insertMqttReading(db, {
    id: `mqtt_${v.data.deviceId}_${ts.getTime()}`,
    deviceId: v.data.deviceId,
    timestamp: ts.toISOString(),
    intervalStart: intervalStart.toISOString(),
    intervalSeconds,
    powerW: v.data.powerW,
    energyKwh: v.data.energyKwh ?? null,
    energyKwhTotal: v.data.energyKwhTotal ?? null,
    voltageV: v.data.voltageV ?? null,
    currentA: v.data.currentA ?? null,
    isSimulated: false,
    source: 'device',
  });

  return { inserted, reason: inserted ? undefined : 'duplicate' };
}

export function startMqttIngestion(
  db: DatabaseSync,
  clientFactory?: (url: string, opts: mqtt.IClientOptions) => MqttClient,
): MqttIngestionHandle {
  if (!mqttEnabled) {
    console.log('[mqtt] disabled (MQTT_ENABLED=false)');
    return { stop: () => {} };
  }
  if (!mqttBrokerUrl) {
    console.warn('[mqtt] MQTT_ENABLED=true but MQTT_BROKER_URL is unset; ingestion disabled');
    return { stop: () => {} };
  }

  const factory = clientFactory ?? ((url, opts) => mqtt.connect(url, opts));
  const client = factory(mqttBrokerUrl, {
    clientId: mqttClientId,
    username: mqttUsername,
    password: mqttPassword,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  });

  const topic = `${mqttTopicPrefix}/+/telemetry`;
  let stopped = false;

  client.on('connect', () => {
    console.log(`[mqtt] connected to ${mqttBrokerUrl} as ${mqttClientId}`);
    client.subscribe(topic, { qos: mqttQos }, (err) => {
      if (err) console.error('[mqtt] subscribe failed:', err.message);
      else console.log(`[mqtt] subscribed to ${topic}`);
    });
  });

  client.on('reconnect', () => console.log('[mqtt] reconnecting…'));
  client.on('offline', () => console.warn('[mqtt] offline'));
  client.on('error', (err) => console.error('[mqtt] error:', err.message));

  client.on('message', (receivedTopic, buf) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(buf.toString('utf8'));
    } catch {
      console.warn('[mqtt] invalid JSON on', receivedTopic);
      return;
    }
    const result = ingestTelemetry(db, parsed);
    if (!result.inserted) {
      console.debug('[mqtt] dropped:', result.reason);
    }
  });

  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      client.end(true);
    } catch {
      // ignore
    }
  };

  return { stop };
}
