import type { EnergyApi, EnergyReading, SiteSummary } from "./energyApi";
import { config } from "../../config/env";

const API_BASE = config.apiBaseUrl.replace(/\/$/, "");

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

interface SiteDto {
  id: string;
  name: string;
}

interface SummaryTotals {
  powerW: number;
  energyKwh: number;
  costInr: number;
}

interface SummaryResponse {
  data: { siteId: string; totals: SummaryTotals };
}

interface SitesResponse {
  data: SiteDto[];
}

interface ReadingDto {
  deviceId: string;
  timestamp: string;
  powerWatts: number;
  energyKwh: number;
  source: "simulated" | "real";
  isSimulated?: boolean;
}

interface LatestResponse {
  readings?: ReadingDto[];
  data?: ReadingDto[];
}

interface ConfigResponse {
  data: { dataSource: { simulated: boolean; notice: string } };
}

export class HttpEnergyApi implements EnergyApi {
  async getSiteSummaries(): Promise<SiteSummary[]> {
    const sitesBody = await request<SitesResponse>("/api/sites");
    const sites = sitesBody.data ?? [];
    const summaries = await Promise.all(
      sites.map(async (site) => {
        const summaryBody = await request<SummaryResponse>(
          `/api/readings/summary?siteId=${encodeURIComponent(site.id)}`,
        );
        const totals = summaryBody.data.totals;
        return {
          siteId: site.id,
          name: site.name,
          currentPowerW: totals.powerW,
          todayEnergyKwh: totals.energyKwh,
          todayCostInr: totals.costInr,
        };
      }),
    );
    return summaries;
  }

  async getRecentReadings(siteId: string, limit: number): Promise<EnergyReading[]> {
    const body = await request<LatestResponse>(
      `/api/readings/latest?siteId=${encodeURIComponent(siteId)}&limit=${encodeURIComponent(String(limit))}`,
    );
    const readings = body.readings ?? body.data ?? [];
    return readings.map((r) => ({
      timestamp: r.timestamp,
      powerW: r.powerWatts,
      energyKwh: r.energyKwh,
      costInr: undefined,
    }));
  }

  async getDataSource(): Promise<{ simulated: boolean; notice: string }> {
    const body = await request<ConfigResponse>("/api/config");
    return body.data.dataSource;
  }
}

export const httpEnergyApi = new HttpEnergyApi();
