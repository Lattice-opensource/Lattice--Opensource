import type {
  AggregatePoint,
  DataSourceInfo,
  DeviceSummary,
  EnergyApi,
  EnergyReading,
  RoomSummary,
  SiteOverview,
  SiteSummary,
} from "./energyApi";
import { SAMPLE_READINGS, SAMPLE_SITE_SUMMARIES } from "../sample/sampleEnergyData";

const SAMPLE_TIMEZONE = "Asia/Kolkata";

const SAMPLE_DEVICES: DeviceSummary[] = [
  {
    deviceId: "dev_ac_01",
    name: "Living Room AC",
    roomName: "Living Room",
    category: "hvac",
    status: "online",
    isSimulated: true,
    powerW: 1149,
    energyKwh: 1.86,
    costInr: 9.3,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_tv_01",
    name: "LED TV + Soundbar",
    roomName: "Living Room",
    category: "electronics",
    status: "online",
    isSimulated: true,
    powerW: 99,
    energyKwh: 0.21,
    costInr: 1.05,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_cooler_01",
    name: "Cooler",
    roomName: "Master Bedroom",
    category: "appliance",
    status: "online",
    isSimulated: true,
    powerW: 155,
    energyKwh: 0.95,
    costInr: 4.75,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_fridge_01",
    name: "Refrigerator",
    roomName: "Kitchen",
    category: "kitchen",
    status: "online",
    isSimulated: true,
    powerW: 272,
    energyKwh: 2.64,
    costInr: 13.2,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_washer_01",
    name: "Washing Machine",
    roomName: "Utility",
    category: "appliance",
    status: "offline",
    isSimulated: true,
    powerW: 0,
    energyKwh: 0,
    costInr: 0,
    lastSeenAt: null,
  },
];

export class SampleEnergyApi implements EnergyApi {
  async getSiteSummaries(): Promise<SiteSummary[]> {
    return SAMPLE_SITE_SUMMARIES;
  }

  async getRecentReadings(siteId: string, limit: number): Promise<EnergyReading[]> {
    const readings = SAMPLE_READINGS[siteId] ?? [];
    return readings.slice(-limit);
  }

  async getDataSource(): Promise<DataSourceInfo> {
    return {
      simulated: true,
      notice: "Sample data only. Not real sensor measurements.",
    };
  }

  async getDeviceSummaries(): Promise<DeviceSummary[]> {
    return SAMPLE_DEVICES;
  }

  async getAggregate(): Promise<AggregatePoint[]> {
    return [];
  }

  async getSiteOverview(): Promise<SiteOverview> {
    const rooms: RoomSummary[] = [];
    for (const device of SAMPLE_DEVICES) {
      const roomName = device.roomName ?? "Unassigned";
      const room = rooms.find((r) => r.roomName === roomName);
      if (room) {
        room.powerW += device.powerW;
        room.energyKwh += device.energyKwh;
        room.costInr += device.costInr;
        room.deviceCount += 1;
      } else {
        rooms.push({
          roomId: roomName.toLowerCase().replace(/\s+/g, "_"),
          roomName,
          powerW: device.powerW,
          energyKwh: device.energyKwh,
          costInr: device.costInr,
          deviceCount: 1,
        });
      }
    }

    const powerW = SAMPLE_DEVICES.reduce((sum, d) => sum + d.powerW, 0);
    const energyKwh = SAMPLE_DEVICES.reduce((sum, d) => sum + d.energyKwh, 0);
    const costInr = SAMPLE_DEVICES.reduce((sum, d) => sum + d.costInr, 0);
    const series = (SAMPLE_READINGS["site-001"] ?? []).map((r) => ({
      timestamp: r.timestamp,
      powerW: r.powerW,
    }));
    const peak = series.reduce(
      (acc, p) => (p.powerW > acc.powerW ? { powerW: p.powerW, at: p.timestamp } : acc),
      { powerW: 0, at: null as string | null },
    );

    return {
      siteId: SAMPLE_SITE_SUMMARIES[0].siteId,
      siteName: SAMPLE_SITE_SUMMARIES[0].name,
      timezone: SAMPLE_TIMEZONE,
      currency: "INR",
      dataSource: {
        simulated: true,
        notice: "Sample data only. Not real sensor measurements.",
      },
      wholeSite: {
        powerW,
        energyKwh,
        costInr,
        source: "devices",
        meterDeviceId: null,
      },
      peak,
      averagePowerW: series.length ? series.reduce((s, p) => s + p.powerW, 0) / series.length : 0,
      devices: SAMPLE_DEVICES,
      rooms,
      series,
      deviceCount: SAMPLE_DEVICES.length,
      onlineDeviceCount: SAMPLE_DEVICES.filter((d) => d.status === "online").length,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const sampleEnergyApi = new SampleEnergyApi();
