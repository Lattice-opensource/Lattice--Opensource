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

export interface EnergyApi {
  getSiteSummaries(): Promise<SiteSummary[]>;
  getRecentReadings(siteId: string, limit: number): Promise<EnergyReading[]>;
  getDataSource?(): Promise<{ simulated: boolean; notice: string }>;
}
