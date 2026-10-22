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
import { buildPowerSeries, resolveWholeSite, startOfDayInTimeZone } from "./normalize";
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
  timezone: string;
  currency: string;
}

interface ConfigDto {
  siteId: string;
  currency: string;
  timezone: string;
  dataSource: { simulated: boolean; notice: string; mode: string };
}

interface ReadingDto {
  id: string;
  deviceId: string;
  timestamp: string;
  powerW: number;
  energyKwh: number | null;
  source: "simulator" | "device" | "import";
  isSimulated: boolean;
}

interface SummaryDto {
  siteId: string;
  totals: { powerW: number; energyKwh: number; costInr: number };
  byDevice: Array<{
    deviceId: string;
    deviceName: string;
    roomId: string | null;
    roomName: string | null;
    category: string;
    status: string;
    isSimulated: boolean;
    powerW: number;
    energyKwh: number;
    costInr: number;
    lastSeenAt: string | null;
  }>;
  byRoom: Array<{
    roomId: string;
    roomName: string;
    powerW: number;
    energyKwh: number;
    costInr: number;
  }>;
  dataQuality: { simulated: boolean; simulatedReadings: number; realReadings: number };
}

interface ListResponse<T> {
  data: T[];
  meta: { serverTime: string; total?: number };
}

interface ItemResponse<T> {
  data: T;
  meta: { serverTime: string };
}

function toDeviceSummary(d: SummaryDto["byDevice"][number]): DeviceSummary {
  return {
    deviceId: d.deviceId,
    name: d.deviceName,
    roomName: d.roomName,
    category: d.category,
    status: d.status,
    isSimulated: d.isSimulated,
    powerW: d.powerW,
    energyKwh: d.energyKwh,
    costInr: d.costInr,
    lastSeenAt: d.lastSeenAt,
  };
}

export class HttpEnergyApi implements EnergyApi {
  async getSiteSummaries(): Promise<SiteSummary[]> {
    const sitesBody = await request<ListResponse<SiteDto>>("/api/sites");
    const sites = sitesBody.data ?? [];
    const summaries = await Promise.all(
      sites.map(async (site) => {
        const summaryBody = await request<ItemResponse<SummaryDto>>(
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
    const body = await request<ListResponse<ReadingDto> & { readings?: LegacyReading[] }>(
      `/api/readings/latest?siteId=${encodeURIComponent(siteId)}&limit=${encodeURIComponent(String(limit))}`,
    );
    const canonical = body.data ?? [];
    if (canonical.length > 0) {
      return canonical.map((r) => ({
        timestamp: r.timestamp ?? "",
        powerW: Number.isFinite(r.powerW) ? r.powerW : 0,
        energyKwh: Number.isFinite(r.energyKwh) ? (r.energyKwh as number) : 0,
        costInr: undefined,
        // Treat anything that is not explicitly marked real as simulated so that
        // missing/malformed records are never presented as live hardware data.
        isSimulated: r.isSimulated !== false,
        deviceId: r.deviceId,
      }));
    }
    const legacy = body.readings ?? [];
    return legacy.map((r) => ({
      timestamp: r.timestamp ?? "",
      powerW: Number.isFinite(r.powerWatts) ? r.powerWatts : 0,
      energyKwh: Number.isFinite(r.energyKwh) ? r.energyKwh : 0,
      costInr: undefined,
      isSimulated: r.source !== "real",
      deviceId: r.deviceId,
    }));
  }

  async getDataSource(): Promise<DataSourceInfo> {
    const body = await request<ItemResponse<ConfigDto>>("/api/config");
    return body.data.dataSource;
  }

  async getDeviceSummaries(siteId?: string): Promise<DeviceSummary[]> {
    const qs = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
    const body = await request<ItemResponse<SummaryDto>>(`/api/readings/summary${qs}`);
    return body.data.byDevice.map(toDeviceSummary);
  }

  async getAggregate(params: {
    siteId?: string;
    from: string;
    to: string;
    bucket?: string;
  }): Promise<AggregatePoint[]> {
    const q = new URLSearchParams();
    if (params.siteId) q.set("siteId", params.siteId);
    q.set("from", params.from);
    q.set("to", params.to);
    q.set("bucket", params.bucket ?? "hour");
    q.set("groupBy", "site");
    const body = await request<ListResponse<Record<string, unknown>>>(`/api/readings/aggregate?${q.toString()}`);
    return (body.data ?? []).map((p) => ({
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

  async getSiteOverview(): Promise<SiteOverview> {
    const [sitesBody, configBody] = await Promise.all([
      request<ListResponse<SiteDto>>("/api/sites"),
      request<ItemResponse<ConfigDto>>("/api/config"),
    ]);

    const siteId = configBody.data.siteId ?? sitesBody.data[0]?.id ?? "";
    const site = sitesBody.data.find((s) => s.id === siteId) ?? sitesBody.data[0];
    const timezone = configBody.data.timezone ?? site?.timezone ?? "UTC";
    const currency = configBody.data.currency ?? site?.currency ?? "INR";
    const now = new Date();
    const from = startOfDayInTimeZone(timezone, now).toISOString();
    const to = now.toISOString();

    const summaryBody = await request<ItemResponse<SummaryDto>>(
      `/api/readings/summary?siteId=${encodeURIComponent(siteId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    const summary = summaryBody.data;
    const devices = summary.byDevice.map(toDeviceSummary);
    const wholeSite = resolveWholeSite(devices);

    const rooms: RoomSummary[] = summary.byRoom.map((r) => ({
      roomId: r.roomId,
      roomName: r.roomName,
      powerW: r.powerW,
      energyKwh: r.energyKwh,
      costInr: r.costInr,
      deviceCount: devices.filter((d) => d.roomName === r.roomName).length,
    }));

    const series = await this.loadPowerSeries(siteId, wholeSite.meterDeviceId, from, to);

    const peak = series.reduce(
      (acc, p) => (p.powerW > acc.powerW ? { powerW: p.powerW, at: p.timestamp } : acc),
      { powerW: 0, at: null as string | null },
    );
    const averagePowerW =
      series.length > 0 ? series.reduce((sum, p) => sum + p.powerW, 0) / series.length : 0;

    return {
      siteId,
      siteName: site?.name ?? siteId,
      timezone,
      currency,
      dataSource: configBody.data.dataSource,
      wholeSite: {
        powerW: wholeSite.powerW,
        energyKwh: wholeSite.energyKwh,
        costInr: wholeSite.costInr,
        source: wholeSite.source,
        meterDeviceId: wholeSite.meterDeviceId,
      },
      peak,
      averagePowerW,
      devices,
      rooms,
      series,
      deviceCount: devices.length,
      onlineDeviceCount: devices.filter((d) => d.status === "online").length,
      lastUpdated: summaryBody.meta.serverTime ?? now.toISOString(),
    };
  }

  private async loadPowerSeries(
    siteId: string,
    meterDeviceId: string | null,
    from: string,
    to: string,
  ): Promise<{ timestamp: string; powerW: number }[]> {
    if (meterDeviceId) {
      const body = await request<ListResponse<ReadingDto>>(
        `/api/readings?deviceId=${encodeURIComponent(meterDeviceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&order=asc&limit=1000`,
      );
      return (body.data ?? []).map((r) => ({
        timestamp: r.timestamp,
        powerW: r.powerW,
      }));
    }

    const body = await request<ListResponse<ReadingDto>>(
      `/api/readings?siteId=${encodeURIComponent(siteId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&order=asc&limit=1000`,
    );
    const readings: EnergyReading[] = (body.data ?? []).map((r) => ({
      timestamp: r.timestamp,
      powerW: r.powerW,
      energyKwh: r.energyKwh ?? 0,
      isSimulated: r.isSimulated,
      deviceId: r.deviceId,
    }));
    return buildPowerSeries(readings, { bucketMs: 15 * 60_000 });
  }
}

interface LegacyReading {
  deviceId: string;
  timestamp: string;
  powerWatts: number;
  energyKwh: number;
  source: "simulated" | "real";
}

export const httpEnergyApi = new HttpEnergyApi();
