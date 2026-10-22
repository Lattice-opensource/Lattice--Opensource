import type { EnergyApi, EnergyReading, SiteSummary, DeviceSummary, AggregatePoint } from "./energyApi";
import { SAMPLE_READINGS, SAMPLE_SITE_SUMMARIES } from "../sample/sampleEnergyData";

export class SampleEnergyApi implements EnergyApi {
  async getSiteSummaries(): Promise<SiteSummary[]> {
    return SAMPLE_SITE_SUMMARIES;
  }

  async getRecentReadings(siteId: string, limit: number): Promise<EnergyReading[]> {
    const readings = SAMPLE_READINGS[siteId] ?? [];
    return readings.slice(-limit);
  }

  async getDataSource(): Promise<{ simulated: boolean; notice: string }> {
    return { simulated: true, notice: "Sample data only. Not real sensor measurements." };
  }

  async getDeviceSummaries(): Promise<DeviceSummary[]> {
    return [];
  }

  async getAggregate(): Promise<AggregatePoint[]> {
    return [];
  }
}

export const sampleEnergyApi = new SampleEnergyApi();
