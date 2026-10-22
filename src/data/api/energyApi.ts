export interface EnergyReading {
  timestamp: string;
  powerKw: number;
  energyKwh: number;
  costInr?: number;
}

export interface SiteSummary {
  siteId: string;
  name: string;
  currentPowerKw: number;
  todayEnergyKwh: number;
  todayCostInr: number;
}

export interface EnergyApi {
  getSiteSummaries(): Promise<SiteSummary[]>;
  getRecentReadings(siteId: string, limit: number): Promise<EnergyReading[]>;
}
