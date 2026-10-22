import type { EnergyApi, EnergyReading, SiteSummary, DeviceSummary, AggregatePoint } from "./energyApi";
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

  async getDeviceSummaries(siteId?: string): Promise<DeviceSummary[]> {
    const qs = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
    const body = await request<{ data: Array<Record<string, unknown>> }>(
      `/api/readings/summary${qs}`,
    );
    const byDevice = (body.data as { byDevice?: Array<Record<string, unknown>> }).byDevice ?? [];
    return byDevice.map((d) => ({
      deviceId: String(d.deviceId),
      name: String(d.deviceName),
      roomName: (d.roomName as string | null) ?? null,
      category: String(d.category),
      status: String(d.status),
      isSimulated: Boolean(d.isSimulated),
      powerW: Number(d.powerW),
      energyKwh: Number(d.energyKwh),
      costInr: Number(d.costInr),
      lastSeenAt: (d.lastSeenAt as string | null) ?? null,
    }));
  }

  async getAggregate(params: { siteId?: string; from: string; to: string; bucket?: string }): Promise<AggregatePoint[]> {
    const q = new URLSearchParams();
    if (params.siteId) q.set("siteId", params.siteId);
    q.set("from", params.from);
    q.set("to", params.to);
    q.set("bucket", params.bucket ?? "hour");
    q.set("groupBy", "site");
    const body = await request<{ data: Array<Record<string, unknown>> }>(
      `/api/readings/aggregate?${q.toString()}`,
    );
    const points = body.data ?? [];
    return points.map((p) => ({
      bucketStart: String(p.bucketStart),
      bucketEnd: String(p.bucketEnd),
      powerWAvg: Number(p.powerWAvg),
      powerWMax: Number(p.powerWMax),
      energyKwh: Number(p.energyKwh),
      costInr: Number(p.costInr),
      sampleCount: Number(p.sampleCount),
      isSimulated: Boolean(p.isSimulated),
    }));
  }

  async getDataSource(): Promise<{ simulated: boolean; notice: string }> {
    const body = await request<ConfigResponse>("/api/config");
    return body.data.dataSource;
  }
}

export const httpEnergyApi = new HttpEnergyApi();
