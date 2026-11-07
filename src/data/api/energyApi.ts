export interface DataSourceInfo {
  simulated: boolean;
  notice: string;
}

export interface EnergyReading {
  timestamp: string;
  powerW: number;
  energyKwh: number;
  costInr?: number;
  isSimulated?: boolean;
  deviceId?: string;
}

export interface SiteSummary {
  siteId: string;
  name: string;
  currentPowerW: number;
  todayEnergyKwh: number;
  todayCostInr: number;
}

export interface DeviceSummary {
  deviceId: string;
  name: string;
  roomName: string | null;
  category: string;
  status: string;
  isSimulated: boolean;
  powerW: number;
  energyKwh: number;
  costInr: number;
  lastSeenAt: string | null;
}

export interface RoomSummary {
  roomId: string;
  roomName: string;
  powerW: number;
  energyKwh: number;
  costInr: number;
  deviceCount: number;
}

export interface AggregatePoint {
  bucketStart: string;
  bucketEnd: string;
  powerWAvg: number;
  powerWMax: number;
  energyKwh: number;
  costInr: number;
  sampleCount: number;
  isSimulated: boolean;
}

export interface PowerPoint {
  timestamp: string;
  powerW: number;
}

/**
 * Everything the dashboard needs for one site, resolved from the API.
 *
 * `wholeSite.source` records how the site-level figures were obtained:
 *  - "meter"   : a site meter (main meter) reported the total, appliances excluded
 *  - "devices" : summed from individual devices (no site meter present)
 */
export interface SiteOverview {
  siteId: string;
  siteName: string;
  timezone: string;
  currency: string;
  dataSource: DataSourceInfo;
  wholeSite: {
    powerW: number;
    energyKwh: number;
    costInr: number;
    source: "meter" | "devices";
    meterDeviceId: string | null;
  };
  peak: { powerW: number; at: string | null };
  averagePowerW: number;
  devices: DeviceSummary[];
  rooms: RoomSummary[];
  series: PowerPoint[];
  deviceCount: number;
  onlineDeviceCount: number;
  lastUpdated: string;
}

import type { Summary as ContractSummary, Alert as ContractAlert, Report as ContractReport } from "@lattice/contracts";

export type Alert = ContractAlert;
export type Report = ContractReport;

export type Summary = ContractSummary;

export interface EnergyApi {
  getSiteSummaries(): Promise<SiteSummary[]>;
  getRecentReadings(siteId: string, limit: number): Promise<EnergyReading[]>;
  getDataSource?(): Promise<DataSourceInfo>;
  getDeviceSummaries?(siteId?: string, from?: string, to?: string): Promise<DeviceSummary[]>;
  getSummary?(filters?: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    from?: string;
    to?: string;
  }): Promise<Summary>;
  getScopedSummary?(filters?: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    from?: string;
    to?: string;
  }): Promise<Summary>;
  getAggregate?(params: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    deviceId?: string;
    from: string;
    to: string;
    bucket?: string;
    groupBy?: string;
  }): Promise<AggregatePoint[]>;
  getSiteOverview?(): Promise<SiteOverview>;
  getBuildings?(siteId?: string): Promise<Building[]>;
  getFloors?(buildingId?: string): Promise<Floor[]>;
  getRooms?(filters?: { siteId?: string; buildingId?: string; floorId?: string }): Promise<Room[]>;
  getCircuits?(filters?: { siteId?: string; buildingId?: string; floorId?: string; roomId?: string }): Promise<Circuit[]>;
  getDevices?(filters?: { siteId?: string; buildingId?: string; floorId?: string; roomId?: string; circuitId?: string }): Promise<Device[]>;
  getAlerts?(filters?: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    deviceId?: string;
    severity?: string;
    status?: string;
    type?: string;
  }): Promise<Alert[]>;
  getAlert?(id: string): Promise<Alert>;
  acknowledgeAlert?(id: string): Promise<Alert>;
  resolveAlert?(id: string): Promise<Alert>;
  detectAlerts?(): Promise<Alert[]>;
  getReport?(params: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    period: "daily" | "weekly" | "monthly" | "custom";
    from?: string;
    to?: string;
    compare?: boolean;
  }): Promise<Report>;
}
import type { Building, Circuit, Device, Floor, Room } from "@lattice/contracts";
