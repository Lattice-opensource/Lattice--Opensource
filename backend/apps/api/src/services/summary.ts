import type { DatabaseSync } from 'node:sqlite';
import type { Summary, DeviceCategory, DeviceStatus, Tariff } from '@lattice/contracts';
import { listAllReadings } from '../db/repositories/readings.js';
import { listDevices } from '../db/repositories/devices.js';

import { costForEnergy, round2 } from './cost.js';
import { resolveTariff } from './aggregate.js';

export interface SummaryParams {
  siteId?: string;
  from: string;
  to: string;
}

export function computeSummary(db: DatabaseSync, params: SummaryParams): Summary {
  const siteId = params.siteId ?? 'site_home_01';
  const devices = listDevices(db, { siteId });
  const deviceMap = new Map(devices.map((d) => [d.id, d]));
  const readings = listAllReadings(db, { siteId, from: params.from, to: params.to });

  const tariff = resolveTariff(db, siteId);

  // latest reading per device (for current power)
  const latestByDevice = new Map<string, (typeof readings)[number]>();
  for (const r of readings) {
    const cur = latestByDevice.get(r.deviceId);
    if (!cur || r.timestamp > cur.timestamp) latestByDevice.set(r.deviceId, r);
  }

  const byDeviceMap = new Map<string, {
    deviceId: string;
    deviceName: string;
    roomId: string | null;
    roomName: string | null;
    category: DeviceCategory;
    status: DeviceStatus;
    isSimulated: boolean;
    powerW: number;
    energyKwh: number;
    costInr: number;
    lastSeenAt: string | null;
  }>();

  for (const d of devices) {
    byDeviceMap.set(d.id, {
      deviceId: d.id,
      deviceName: d.name,
      roomId: d.roomId,
      roomName: d.roomName,
      category: d.category,
      status: d.status,
      isSimulated: d.isSimulated,
      powerW: 0,
      energyKwh: 0,
      costInr: 0,
      lastSeenAt: d.lastSeenAt,
    });
  }

  // Site totals use the site meter (main meter) when present, to avoid
  // double-counting appliance readings. If no site meter exists (e.g. a
  // real-hardware deployment with only appliance sensors), fall back to
  // summing all devices (best effort) and document the limitation.
  const siteMeterIds = new Set(
    devices.filter((d) => d.roomId === null && d.category === 'other').map((d) => d.id),
  );
  const hasSiteMeter = siteMeterIds.size > 0;

  let totalEnergy = 0;
  let totalCost = 0;
  let simulatedReadings = 0;
  let realReadings = 0;
  let simulatedEnergy = 0;
  let realEnergy = 0;

  for (const r of readings) {
    const dev = byDeviceMap.get(r.deviceId);
    if (!dev) continue;
    const ek = r.energyKwh ?? 0;
    dev.energyKwh += ek;
    dev.costInr += costForEnergy(tariff, ek);
    if (r.isSimulated) {
      simulatedReadings += 1;
      simulatedEnergy += ek;
    } else {
      realReadings += 1;
      realEnergy += ek;
    }
    // Only the site meter contributes to site totals.
    if (!hasSiteMeter || siteMeterIds.has(r.deviceId)) {
      totalEnergy += ek;
      totalCost += costForEnergy(tariff, ek);
    }
  }

  // current power from latest readings
  for (const [did, r] of latestByDevice) {
    const dev = byDeviceMap.get(did);
    if (dev) dev.powerW = r.powerW;
  }

  // Site current power = site meter's latest power (avoid double counting).
  const siteMeterPower = [...latestByDevice.entries()]
    .filter(([did]) => siteMeterIds.has(did))
    .reduce((acc, [, r]) => acc + r.powerW, 0);
  const totalPower = hasSiteMeter
    ? siteMeterPower
    : [...byDeviceMap.values()].reduce((a, b) => a + b.powerW, 0);
  const byRoomMap = new Map<string, { roomId: string; roomName: string; powerW: number; energyKwh: number; costInr: number }>();
  for (const d of byDeviceMap.values()) {
    if (!d.roomId) continue;
    const room = byRoomMap.get(d.roomId) ?? {
      roomId: d.roomId,
      roomName: d.roomName ?? d.roomId,
      powerW: 0,
      energyKwh: 0,
      costInr: 0,
    };
    room.powerW += d.powerW;
    room.energyKwh += d.energyKwh;
    room.costInr += d.costInr;
    byRoomMap.set(d.roomId, room);
  }

  return {
    siteId,
    window: { from: params.from, to: params.to },
    totals: {
      powerW: round2(totalPower),
      energyKwh: round2(totalEnergy),
      costInr: round2(totalCost),
      costIsEstimate: true,
    },
    byDevice: [...byDeviceMap.values()].map((d) => ({
      ...d,
      powerW: round2(d.powerW),
      energyKwh: round2(d.energyKwh),
      costInr: round2(d.costInr),
    })),
    byRoom: [...byRoomMap.values()].map((r) => ({
      ...r,
      powerW: round2(r.powerW),
      energyKwh: round2(r.energyKwh),
      costInr: round2(r.costInr),
    })),
    dataQuality: {
      simulated: simulatedReadings > 0,
      simulatedReadings,
      realReadings,
      simulatedEnergyKwh: round2(simulatedEnergy),
      realEnergyKwh: round2(realEnergy),
    },
  };
}

