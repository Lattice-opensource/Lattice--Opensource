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

export interface EnergyApi {
  getSiteSummaries(): Promise<SiteSummary[]>;
  getRecentReadings(siteId: string, limit: number): Promise<EnergyReading[]>;
  getDataSource?(): Promise<DataSourceInfo>;
  getDeviceSummaries?(siteId?: string, from?: string, to?: string): Promise<DeviceSummary[]>;
  getAggregate?(params: { siteId?: string; from: string; to: string; bucket?: string }): Promise<AggregatePoint[]>;
  getSiteOverview?(): Promise<SiteOverview>;
}
