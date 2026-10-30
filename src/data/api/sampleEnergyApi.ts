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
    deviceId: "dev_chiller_01",
    name: "Central Chiller Plant",
    roomName: "Plant Room",
    category: "hvac",
    status: "online",
    isSimulated: true,
    powerW: 45000,
    energyKwh: 320.5,
    costInr: 2564.0,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_ahu_01",
    name: "Floor 2 AHU",
    roomName: "Floor 2 Open Office",
    category: "hvac",
    status: "online",
    isSimulated: true,
    powerW: 12000,
    energyKwh: 86.4,
    costInr: 691.2,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_server_cooling_01",
    name: "Server Room Cooling + UPS",
    roomName: "Server Room",
    category: "hvac",
    status: "online",
    isSimulated: true,
    powerW: 15000,
    energyKwh: 108.0,
    costInr: 864.0,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_workstations_01",
    name: "Workstation Cluster",
    roomName: "Floor 1 Open Office",
    category: "electronics",
    status: "online",
    isSimulated: true,
    powerW: 5000,
    energyKwh: 36.0,
    costInr: 288.0,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_lighting_01",
    name: "Lighting Panel Floor 1",
    roomName: "Floor 1 Open Office",
    category: "lighting",
    status: "online",
    isSimulated: true,
    powerW: 3000,
    energyKwh: 21.6,
    costInr: 172.8,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_elevators_01",
    name: "Elevator Bank",
    roomName: "Parking & Utilities",
    category: "appliance",
    status: "online",
    isSimulated: true,
    powerW: 8000,
    energyKwh: 57.6,
    costInr: 460.8,
    lastSeenAt: "2026-10-22T11:00:00.000Z",
  },
  {
    deviceId: "dev_pumps_01",
    name: "Water Pumps & Utilities",
    roomName: "Parking & Utilities",
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
