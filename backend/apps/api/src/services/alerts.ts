import type { DatabaseSync } from 'node:sqlite';
import type { Alert } from '@lattice/contracts';
import { listSites } from '../db/repositories/sites.js';
import { listDevices } from '../db/repositories/devices.js';
import { listAllReadings } from '../db/repositories/readings.js';
import { createAlert, findActiveAlertByDedupKey } from '../db/repositories/alerts.js';
import { resolveTariff } from './aggregate.js';
import { costForEnergy, round2 } from './cost.js';
import { siteTotalReadings } from './site-meter.js';
import { STALE_AFTER_SECONDS } from '../config.js';
import { makeId } from '../lib/ids.js';
import { toIso } from '../lib/time.js';

function localHour(ts: string, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).formatToParts(new Date(ts));
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  return Number.isFinite(h) ? h : 0;
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function deviceRoomScope(device: { roomId: string | null }) {
  return device.roomId;
}

export function detectAlerts(db: DatabaseSync): Alert[] {
  const created: Alert[] = [];
  const now = new Date();
  const sites = listSites(db);

  for (const site of sites) {
    const siteId = site.id;
    const tz = site.timezone ?? 'Asia/Kolkata';
    const devices = listDevices(db, { siteId });
    const deviceMap = new Map(devices.map((d) => [d.id, d]));
    const readings = listAllReadings(db, { siteId });
    const siteReadings = siteTotalReadings(devices, readings);
    const tariff = resolveTariff(db, siteId);
    const currentHour = localHour(now.toISOString(), tz);

    // 1. Missing readings.
    for (const device of devices) {
      const lastSeenMs = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : 0;
      const stale = !device.lastSeenAt || now.getTime() - lastSeenMs > STALE_AFTER_SECONDS * 1000;
      if (!stale) continue;
      const dedupKey = `missing_readings:${siteId}:${device.id}`;
      if (findActiveAlertByDedupKey(db, dedupKey)) continue;
      const alert = createAlert(db, {
        id: makeId('alert'),
        siteId,
        buildingId: null,
        floorId: null,
        roomId: device.roomId,
        circuitId: device.circuitId,
        deviceId: device.id,
        type: 'missing_readings',
        severity: device.roomId ? 'medium' : 'high',
        status: 'active',
        title: `${device.name} stopped reporting`,
        observedValue: null,
        expectedValue: null,
        additionalCostInr: null,
        explanation: `${device.name} has not reported a reading within the configured staleness window (${STALE_AFTER_SECONDS}s).`,
        recommendation: 'Check device connectivity, power supply, and network status. No automatic action was taken.',
        detectedAt: toIso(now),
        acknowledgedAt: null,
        resolvedAt: null,
        dedupKey,
      });
      created.push(alert);
    }

    // Site-level consumption checks.
    const recentCutoff = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const recentSiteReadings = siteReadings.filter((r) => r.timestamp >= recentCutoff);
    const baselineSiteReadings = siteReadings.filter((r) => r.timestamp < recentCutoff && localHour(r.timestamp, tz) === currentHour);

    const recentSiteEnergy = recentSiteReadings.reduce((s, r) => s + (r.energyKwh ?? 0), 0);
    const recentSitePower = average(recentSiteReadings.map((r) => r.powerW));
    const baselineSiteEnergy = average(baselineSiteReadings.map((r) => r.energyKwh ?? 0));

    if (baselineSiteReadings.length > 0 && recentSiteReadings.length > 0) {
      if (baselineSiteEnergy > 0 && recentSiteEnergy / Math.max(recentSiteReadings.length, 1) >= baselineSiteEnergy * 3 && (recentSiteEnergy / Math.max(recentSiteReadings.length, 1)) - baselineSiteEnergy >= 0.05) {
        const observed = round2(recentSiteEnergy / Math.max(recentSiteReadings.length, 1));
        const expected = round2(baselineSiteEnergy);
        const dedupKey = `high_consumption:${siteId}:site`;
        if (!findActiveAlertByDedupKey(db, dedupKey)) {
          const additional = costForEnergy(tariff, Math.max(0, observed - expected));
          const alert = createAlert(db, {
            id: makeId('alert'),
            siteId,
            buildingId: null,
            floorId: null,
            roomId: null,
            circuitId: null,
            deviceId: null,
            type: 'high_consumption',
            severity: 'high',
            status: 'active',
            title: 'Site consumption significantly above baseline',
            observedValue: observed,
            expectedValue: expected,
            additionalCostInr: round2(additional),
            explanation: `Observed hourly energy ${observed} kWh is at least 3x the historical baseline ${expected} kWh for this hour.`,
            recommendation: 'Inspect major loads and recent operational changes. No automatic action was taken.',
            detectedAt: toIso(now),
            acknowledgedAt: null,
            resolvedAt: null,
            dedupKey,
          });
          created.push(alert);
        }
      }
    }

    // Overnight consumption: high usage during 00:00-05:00.
    if (currentHour >= 0 && currentHour <= 5 && recentSitePower >= 1000) {
      const dedupKey = `overnight_consumption:${siteId}:site:${new Date(now).toISOString().slice(0, 10)}`;
      if (!findActiveAlertByDedupKey(db, dedupKey)) {
        const observed = round2(recentSiteEnergy);
        const alert = createAlert(db, {
          id: makeId('alert'),
          siteId,
          buildingId: null,
          floorId: null,
          roomId: null,
          circuitId: null,
          deviceId: null,
          type: 'overnight_consumption',
          severity: 'medium',
          status: 'active',
          title: 'Unusually high overnight consumption',
          observedValue: observed,
          expectedValue: null,
          additionalCostInr: null,
          explanation: `Site power averaged ${Math.round(recentSitePower)} W between midnight and 05:00, which is unusually high for overnight operation.`,
          recommendation: 'Verify equipment schedules and ensure non-essential loads are switched off overnight. No automatic action was taken.',
          detectedAt: toIso(now),
          acknowledgedAt: null,
          resolvedAt: null,
          dedupKey,
        });
        created.push(alert);
      }
    }

    // Device-level unexpected activity.
    for (const device of devices) {
      const deviceReadings = readings.filter((r) => r.deviceId === device.id);
      const latest = deviceReadings.length ? deviceReadings[deviceReadings.length - 1] : null;
      if (!latest) continue;
      const baselineDeviceReadings = deviceReadings.filter((r) => r.timestamp < recentCutoff && localHour(r.timestamp, tz) === currentHour);
      const baselinePower = average(baselineDeviceReadings.map((r) => r.powerW));
      if (baselineDeviceReadings.length > 0 && baselinePower < 200 && latest.powerW >= 500) {
        const dedupKey = `unexpected_device_activity:${siteId}:${device.id}`;
        if (findActiveAlertByDedupKey(db, dedupKey)) continue;
        const alert = createAlert(db, {
          id: makeId('alert'),
          siteId,
          buildingId: null,
          floorId: null,
          roomId: device.roomId,
          circuitId: device.circuitId,
          deviceId: device.id,
          type: 'unexpected_device_activity',
          severity: 'medium',
          status: 'active',
          title: `${device.name} active outside normal pattern`,
          observedValue: round2(latest.powerW),
          expectedValue: round2(baselinePower),
          additionalCostInr: null,
          explanation: `${device.name} drew ${Math.round(latest.powerW)} W during an hour when its historical average is ${Math.round(baselinePower)} W.`,
          recommendation: 'Confirm whether this device should be running now. No automatic action was taken.',
          detectedAt: toIso(now),
          acknowledgedAt: null,
          resolvedAt: null,
          dedupKey,
        });
        created.push(alert);
      }
    }
  }

  return created;
}