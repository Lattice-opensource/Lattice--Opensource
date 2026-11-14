import type { DatabaseSync } from 'node:sqlite';
import { insertReading } from '../../db/repositories/readings.js';
import { upsertDevice, updateDeviceLastSeen, getDevice } from '../../db/repositories/devices.js';
import { SITE_ID } from '../../services/simulator.js';
import {
  tuyaAccessId,
  tuyaAccessSecret,
  tuyaBaseUrl,
  tuyaDeviceIds,
  tuyaEnabled,
  tuyaPollIntervalSeconds,
} from '../../config.js';
import { TuyaClient, createTuyaClient, type TuyaClientLike } from './client.js';
import { mapTuyaStatusToReading } from './mapper.js';

export interface TuyaIngestionHandle {
  stop: () => void;
}

function safeMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function latticeCategory(tuyaCategory: string | undefined): 'appliance' | 'electronics' {
  const c = (tuyaCategory || '').toLowerCase();
  if (c.includes('plug') || c.includes('socket') || c === 'cz' || c.includes('switch')) return 'appliance';
  return 'electronics';
}

export function startTuyaIngestion(
  db: DatabaseSync,
  clientOrFactory?: TuyaClientLike | (() => TuyaClientLike),
): TuyaIngestionHandle {
  if (!tuyaEnabled) {
    console.log('[tuya] disabled (TUYA_ENABLED=false)');
    return { stop: () => {} };
  }

  if (!tuyaAccessId || !tuyaAccessSecret || !tuyaBaseUrl) {
    console.warn('[tuya] TUYA_ENABLED=true but required Tuya configuration is missing; ingestion disabled');
    return { stop: () => {} };
  }

  const deviceIds = tuyaDeviceIds;
  if (deviceIds.length === 0) {
    console.warn('[tuya] TUYA_ENABLED=true but no TUYA_DEVICE_ID(S) configured; ingestion disabled');
    return { stop: () => {} };
  }

  const client: TuyaClientLike =
    typeof clientOrFactory === 'function'
      ? (clientOrFactory as () => TuyaClientLike)()
      : clientOrFactory ?? createTuyaClient({ accessId: tuyaAccessId, accessSecret: tuyaAccessSecret, baseUrl: tuyaBaseUrl });

  const pollIntervalMs = tuyaPollIntervalSeconds * 1000;
  let stopped = false;
  const timers: NodeJS.Timeout[] = [];

  for (const deviceId of deviceIds) {
    // Guard against re-using a simulated device id for a real device.
    try {
      const existing = getDevice(db, deviceId);
      if (existing?.isSimulated) {
        console.warn(`[tuya] device id ${deviceId} already exists as a simulated device; skipping to avoid mixing sources`);
        continue;
      }
    } catch (err) {
      console.warn('[tuya] device lookup failed:', safeMessage(err));
    }

    // Ensure the device record exists synchronously so the first polled reading can be stored.
    let deviceName = `Tuya device ${deviceId}`;
    try {
      upsertDevice(db, {
        id: deviceId,
        siteId: SITE_ID,
        roomId: null,
        circuitId: null,
        name: deviceName,
        category: 'appliance',
        model: null,
        ratedPowerW: null,
        status: 'online',
        isSimulated: false,
        installedAt: null,
      });
    } catch (err) {
      console.error('[tuya] device upsert failed:', safeMessage(err));
    }

    // Best-effort: refine the device name (and category) from Tuya Cloud without blocking polling.
    void (async () => {
      try {
        const info = await client.getDevice(deviceId);
        const refined = info?.custom_name || info?.name || info?.product_name;
        const category = latticeCategory(info?.category);
        upsertDevice(db, {
          id: deviceId,
          siteId: SITE_ID,
          roomId: null,
          circuitId: null,
          name: refined || deviceName,
          category,
          model: null,
          ratedPowerW: null,
          status: 'online',
          isSimulated: false,
          installedAt: null,
        });
      } catch (err) {
        console.warn('[tuya] device info retrieval failed:', safeMessage(err));
      }
    })();

    const poll = async () => {
      if (stopped) return;
      try {
        const status = await client.getDeviceStatus(deviceId);
        const reading = mapTuyaStatusToReading({
          deviceId,
          timestamp: new Date().toISOString(),
          status,
          intervalSeconds: tuyaPollIntervalSeconds,
        });
        if (reading) {
          try {
            insertReading(db, {
              id: reading.id,
              deviceId: reading.deviceId,
              timestamp: reading.timestamp,
              intervalStart: reading.intervalStart,
              intervalSeconds: reading.intervalSeconds,
              powerW: reading.powerW,
              energyKwh: reading.energyKwh,
              energyKwhTotal: reading.energyKwhTotal,
              voltageV: reading.voltageV,
              currentA: reading.currentA,
              isSimulated: reading.isSimulated,
              source: reading.source,
            });
            updateDeviceLastSeen(db, deviceId, reading.timestamp, 'online');
          } catch (err) {
            console.error('[tuya] reading insert failed:', safeMessage(err));
          }
        } else {
          try {
            updateDeviceLastSeen(db, deviceId, new Date().toISOString(), 'online');
          } catch (err) {
            console.error('[tuya] last-seen update failed:', safeMessage(err));
          }
        }
      } catch (err) {
        console.error(`[tuya] poll failed for ${deviceId}:`, safeMessage(err));
      }
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, pollIntervalMs);
    timers.push(timer);
  }

  const stop = () => {
    if (stopped) return;
    stopped = true;
    for (const t of timers) clearInterval(t);
    timers.length = 0;
  };

  return { stop };
}