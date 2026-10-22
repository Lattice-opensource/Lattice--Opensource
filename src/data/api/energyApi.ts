export interface EnergyReading {
  timestamp: string;
  powerW: number;
  energyKwh: number;
  costInr?: number;
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

export interface EnergyApi {
  getSiteSummaries(): Promise<SiteSummary[]>;
  getRecentReadings(siteId: string, limit: number): Promise<EnergyReading[]>;
  getDataSource?(): Promise<{ simulated: boolean; notice: string }>;
  getDeviceSummaries?(siteId?: string): Promise<DeviceSummary[]>;
  getAggregate?(params: { siteId?: string; from: string; to: string; bucket?: string }): Promise<AggregatePoint[]>;
}
