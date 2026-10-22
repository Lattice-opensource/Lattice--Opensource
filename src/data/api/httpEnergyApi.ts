import type { EnergyApi, EnergyReading, SiteSummary } from "./energyApi";
import type { ApiReading, ReadingsResponse, ApiSiteSummary } from "../../types/apiContract";
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

export class HttpEnergyApi implements EnergyApi {
  async getSiteSummaries(): Promise<SiteSummary[]> {
    const body = await request<{ data?: ApiSiteSummary[] } | ApiSiteSummary[]>(
      "/api/sites/summary",
    );
    const list = Array.isArray(body) ? body : (body.data ?? []);
    return list.map((s) => ({
      siteId: s.siteId,
      name: s.name,
      currentPowerKw: s.currentPowerKw,
      todayEnergyKwh: s.todayEnergyKwh,
      todayCostInr: s.todayCostInr,
    }));
  }

  async getRecentReadings(_siteId: string, limit: number): Promise<EnergyReading[]> {
    const body = await request<ReadingsResponse & { data?: ApiReading[] }>(
      `/api/readings/latest?limit=${encodeURIComponent(String(limit))}`,
    );
    const readings: ApiReading[] = body.readings ?? body.data ?? [];
    return readings.map((r) => ({
      timestamp: r.timestamp,
      powerKw: r.powerWatts / 1000,
      energyKwh: r.energyKwh,
      costInr: undefined,
    }));
  }
}

export const httpEnergyApi = new HttpEnergyApi();
