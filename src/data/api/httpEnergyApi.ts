import type {
  AggregatePoint,
  DataSourceInfo,
  DeviceSummary,
  EnergyApi,
  EnergyReading,
  RoomSummary,
  SiteOverview,
  SiteSummary,
  Summary,
  Alert,
  Report,
} from "./energyApi";
import { buildPowerSeries, resolveWholeSite, startOfDayInTimeZone } from "./normalize";
import { config } from "../../config/env";
import type {
  ItemResponse as ContractItemResponse,
  LatestReading,
  ListResponse as ContractListResponse,
  Reading as ContractReading,
  Site as ContractSite,
  SiteConfig as ContractSiteConfig,
  Summary as ContractSummary,
  Building,
  Circuit,
  Device,
  Floor,
  Room,
} from "@lattice/contracts";

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

type SiteDto = ContractSite;
type ConfigDto = ContractSiteConfig;
type ReadingDto = ContractReading;
type SummaryDto = ContractSummary;
type ListResponse<T> = ContractListResponse<T>;
type ItemResponse<T> = ContractItemResponse<T>;

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
  async getBuildings(siteId?: string): Promise<Building[]> { return this.list<Building>("/api/buildings", { siteId }); }
  async getFloors(buildingId?: string): Promise<Floor[]> { return this.list<Floor>("/api/floors", { buildingId }); }
  async getRooms(filters: { siteId?: string; buildingId?: string; floorId?: string } = {}): Promise<Room[]> { return this.list<Room>("/api/rooms", filters); }
  async getCircuits(filters: { siteId?: string; buildingId?: string; floorId?: string; roomId?: string } = {}): Promise<Circuit[]> { return this.list<Circuit>("/api/circuits", filters); }
  async getDevices(filters: { siteId?: string; buildingId?: string; floorId?: string; roomId?: string; circuitId?: string } = {}): Promise<Device[]> { return this.list<Device>("/api/devices", filters); }

  private async list<T>(path: string, params: Record<string, string | undefined>): Promise<T[]> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    const body = await request<ListResponse<T>>(`${path}${query.size ? `?${query}` : ""}`);
    return body.data;
  }
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

  async getDeviceSummaries(siteId?: string, from?: string, to?: string): Promise<DeviceSummary[]> {
    const q = new URLSearchParams();
    if (siteId) q.set("siteId", siteId);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const qs = q.toString() ? `?${q.toString()}` : "";
    const body = await request<ItemResponse<SummaryDto>>(`/api/readings/summary${qs}`);
    return body.data.byDevice.map(toDeviceSummary);
  }

  async getSummary(filters: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    from?: string;
    to?: string;
  } = {}): Promise<Summary> {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) q.set(key, value);
    const qs = q.toString() ? `?${q.toString()}` : "";
    const body = await request<ItemResponse<SummaryDto>>(`/api/readings/summary${qs}`);
    return body.data as Summary;
  }

  async getScopedSummary(filters?: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    from?: string;
    to?: string;
  }): Promise<Summary> {
    return this.getSummary(filters);
  }

  async getAlerts(filters?: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    deviceId?: string;
    severity?: string;
    status?: string;
    type?: string;
  }): Promise<Alert[]> {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(filters ?? {})) if (value) q.set(key, value);
    const qs = q.toString() ? `?${q.toString()}` : "";
    const body = await request<{ data: Alert[] }>(`/api/alerts${qs}`);
    return body.data ?? [];
  }

  async getAlert(id: string): Promise<Alert> {
    const body = await request<{ data: Alert }>(`/api/alerts/${encodeURIComponent(id)}`);
    return body.data;
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    const res = await fetch(`${API_BASE}/api/alerts/${encodeURIComponent(id)}/acknowledge`, { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();
    return json.data as Alert;
  }

  async resolveAlert(id: string): Promise<Alert> {
    const res = await fetch(`${API_BASE}/api/alerts/${encodeURIComponent(id)}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();
    return json.data as Alert;
  }

  async detectAlerts(): Promise<Alert[]> {
    const res = await fetch(`${API_BASE}/api/alerts/detect`, { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();
    return (json.data ?? []) as Alert[];
  }

  async getReport(params: {
    siteId?: string;
    buildingId?: string;
    floorId?: string;
    roomId?: string;
    circuitId?: string;
    period: "daily" | "weekly" | "monthly" | "custom";
    from?: string;
    to?: string;
    compare?: boolean;
  }): Promise<Report> {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      q.set(key, String(value));
    }
    const body = await request<{ data: Report }>(`/api/reports?${q.toString()}`);
    return body.data;
  }

  async getAggregate(params: {
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
  }): Promise<AggregatePoint[]> {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (key === "from" || key === "to" || key === "bucket" || key === "groupBy") continue;
      q.set(key, String(value));
    }
    q.set("from", params.from);
    q.set("to", params.to);
    q.set("bucket", params.bucket ?? "hour");
    q.set("groupBy", params.groupBy ?? "site");
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

type LegacyReading = LatestReading;

export const httpEnergyApi = new HttpEnergyApi();
