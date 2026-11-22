import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import type { Device, EnergyReading, Summary } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { StatusPill } from "../components/ui/StatusPill";
import { SitePowerChart } from "../components/dashboard/SitePowerChart";
import type { PowerPoint } from "../data/api/energyApi";

type Period = "24h" | "7d" | "30d";

function periodRange(period: Period): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (period === "24h") from.setHours(from.getHours() - 24);
  else if (period === "7d") from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

function maskId(id: string): string {
  if (id.length <= 6) return "••••";
  return `${id.slice(0, 4)}••••${id.slice(-4)}`;
}

function formatKwh(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(3);
}


export default function DeviceDetailsPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  
  const api = getEnergyApi();
  const [period, setPeriod] = useState<Period>("24h");

  const deviceLoader = useCallback(async (): Promise<Device> => {
    if (!deviceId) throw new Error("Missing device id");
    if (api.getDevice) return api.getDevice(deviceId);
    const devices = (await api.getDevices?.()) ?? [];
    const found = devices.find((d) => d.id === deviceId);
    if (!found) throw new Error("Device not found");
    return found as Device;
  }, [api, deviceId]);

  const { state: deviceState } = useApiResource<Device>(deviceLoader);

  function todayRange(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: now.toISOString() };
  }
  function weekRange(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from: from.toISOString(), to: now.toISOString() };
  }
  function monthRange(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: now.toISOString() };
  }

  const todaySummaryLoader = useCallback(async (): Promise<Summary> => {
    const { from, to } = todayRange();
    if (api.getSummary) return api.getSummary({ deviceId, from, to });
    throw new Error("Summary not supported");
  }, [api, deviceId]);

  const weekSummaryLoader = useCallback(async (): Promise<Summary> => {
    const { from, to } = weekRange();
    if (api.getSummary) return api.getSummary({ deviceId, from, to });
    throw new Error("Summary not supported");
  }, [api, deviceId]);

  const monthSummaryLoader = useCallback(async (): Promise<Summary> => {
    const { from, to } = monthRange();
    if (api.getSummary) return api.getSummary({ deviceId, from, to });
    throw new Error("Summary not supported");
  }, [api, deviceId]);

  const { state: todaySummaryState } = useApiResource<Summary>(todaySummaryLoader, 30000);
  const { state: weekSummaryState } = useApiResource<Summary>(weekSummaryLoader, 60000);
  const { state: monthSummaryState } = useApiResource<Summary>(monthSummaryLoader, 60000);

  const readingsLoader = useCallback(async (): Promise<EnergyReading[]> => {
    const { from, to } = periodRange(period);
    if (api.getDeviceReadings) return api.getDeviceReadings(deviceId!, from, to);
    return [];
  }, [api, deviceId, period]);

  const { state: readingsState } = useApiResource<EnergyReading[]>(readingsLoader, 30000);

  const chartPoints: PowerPoint[] = useMemo(() => {
    if (readingsState.status !== "ready") return [];
    return readingsState.data.map((r) => ({ timestamp: r.timestamp, powerW: r.powerW }));
  }, [readingsState]);

  const timezone = "Asia/Kolkata";

  if (deviceState.status === "loading") {
    return (
      <div className="py-12">
        <Spinner label="Loading device" />
      </div>
    );
  }

  if (deviceState.status === "error") {
    const msg = deviceState.message.toLowerCase();
    const notFound = msg.includes("not found") || msg.includes("unknown device") || msg.includes("404");
    if (notFound) {
      return (
        <div className="space-y-5">
          <Link to="/devices" className="text-sm text-brand-light hover:underline">
            ← Back to devices
          </Link>
          <EmptyState
            title="Device not found"
            description={`No device with id "${deviceId}" exists. It may have been removed.`}
          />
        </div>
      );
    }
    return <ErrorState message={deviceState.message} onRetry={() => window.location.reload()} />;
  }

  const device = deviceState.data;
  const todaySummary = todaySummaryState.status === "ready" ? todaySummaryState.data : null;
  const weekSummary = weekSummaryState.status === "ready" ? weekSummaryState.data : null;
  const monthSummary = monthSummaryState.status === "ready" ? monthSummaryState.data : null;
  const todayDev = todaySummary?.byDevice?.find((d) => d.deviceId === deviceId);
  const weekDev = weekSummary?.byDevice?.find((d) => d.deviceId === deviceId);
  const monthDev = monthSummary?.byDevice?.find((d) => d.deviceId === deviceId);

  const currentPower = todayDev?.powerW ?? 0;
  const todayEnergy = todayDev?.energyKwh ?? 0;
  const weekEnergy = weekDev?.energyKwh ?? 0;
  const monthEnergy = monthDev?.energyKwh ?? 0;
  const todayCost = todayDev?.costInr ?? 0;

  const latestReading = readingsState.status === "ready" && readingsState.data.length > 0
    ? readingsState.data[readingsState.data.length - 1]
    : null;
  const latestVoltage = latestReading?.voltageV ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link to="/devices" className="hover:text-ink">Devices</Link>
        <span>→</span>
        <span className="text-ink">{device.name}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{device.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {device.category} · {device.roomName ?? "Site level"} 
          </p>
        </div>
        <Link
          to="/devices"
          className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-muted hover:text-ink"
        >
          ← Back to devices
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={device.status} />

        <span className="text-xs text-muted">
          Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Card title="Current power" eyebrow="Power">
          <p className="text-2xl font-bold tabular-nums text-ink">{Math.round(currentPower)} W</p>
        </Card>
        <Card title="Energy today" eyebrow="kWh">
          <p className="text-2xl font-bold tabular-nums text-ink">{formatKwh(todayEnergy)}</p>
        </Card>
        <Card title="Energy this week" eyebrow="kWh">
          <p className="text-2xl font-bold tabular-nums text-ink">{formatKwh(weekEnergy)}</p>
        </Card>
        <Card title="Energy this month" eyebrow="kWh">
          <p className="text-2xl font-bold tabular-nums text-ink">{formatKwh(monthEnergy)}</p>
        </Card>
        <Card title="Cost today" eyebrow="₹">
          <p className="text-2xl font-bold tabular-nums text-ink">{todayCost.toFixed(2)}</p>
        </Card>
        <Card title="Voltage" eyebrow="V">
          <p className="text-2xl font-bold tabular-nums text-ink">
            {latestVoltage != null ? `${latestVoltage.toFixed(1)}` : "—"}
          </p>
        </Card>
      </div>

      <Card title="Energy history" eyebrow="Analytics">
        <div className="mb-3 flex gap-2">
          {(["24h", "7d", "30d"] as Period[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setPeriod(opt)}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all ${
                period === opt
                  ? "bg-brand text-white shadow-[0_0_30px_-8px_rgba(225,29,72,0.6)]"
                  : "border border-white/10 text-muted hover:text-ink"
              }`}
            >
              {opt === "24h" ? "Last 24h" : opt === "7d" ? "Last 7 days" : "Last 30 days"}
            </button>
          ))}
        </div>
        {readingsState.status === "loading" ? (
          <Spinner label="Loading readings" />
        ) : readingsState.status === "error" ? (
          <ErrorState message={readingsState.message} onRetry={() => window.location.reload()} />
        ) : chartPoints.length === 0 ? (
          <EmptyState title="No readings" description="No readings recorded for this period." />
        ) : (
          <SitePowerChart points={chartPoints} timezone={timezone} variant={period === "24h" ? "bars" : "line"} />
        )}
      </Card>

      <Card title="Technical information" eyebrow="Device">
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Device name</dt>
            <dd className="font-medium text-ink">{device.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Device ID</dt>
            <dd className="font-mono text-ink">{maskId(device.id)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Category</dt>
            <dd className="text-ink">{device.category}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Model</dt>
            <dd className="text-ink">{device.model ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Status</dt>
            <dd className="text-ink">{device.status}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted">Installed at</dt>
            <dd className="text-ink">{device.installedAt ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Last reading</dt>
            <dd className="text-ink">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Room</dt>
            <dd className="text-ink">{device.roomName ?? "Site level"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Rated power</dt>
            <dd className="text-ink">{device.ratedPowerW != null ? `${device.ratedPowerW} W` : "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}