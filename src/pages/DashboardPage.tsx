import { useCallback, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import { useDataSource } from "../data/useDataSource";
import { useApiResource } from "../data/useApiResource";
import type { SiteOverview } from "../data/api/energyApi";
import type { Alert } from "../data/api/energyApi";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { MetricTile } from "../components/ui/MetricTile";
import { ChartPanel } from "../components/ui/ChartPanel";
import { StatusPill } from "../components/ui/StatusPill";
import { SitePowerChart } from "../components/dashboard/SitePowerChart";
import { DeviceList } from "../components/dashboard/DeviceList";
import { RoomCards } from "../components/dashboard/RoomCards";
import { TopConsumers } from "../components/dashboard/TopConsumers";
import { ApplianceRanking, rankAppliances, type AppliancePeriod } from "../components/dashboard/ApplianceRanking";
import { resolveWholeSite } from "../data/api/normalize";
import type { AggregatePoint, PowerPoint } from "../data/api/energyApi";

const POLL_INTERVAL_MS = 10000;

export function DashboardPage() {
  const { setDataSource } = useDataSource();
  const [appliancePeriod, setAppliancePeriod] = useState<AppliancePeriod>("today");
  const [chartPeriod, setChartPeriod] = useState<"24h" | "7d">("24h");

  const loader = useCallback(async (): Promise<SiteOverview> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    setDataSource(overview.dataSource);
    return overview;
  }, [setDataSource]);

  const { state, reload } = useApiResource<SiteOverview>(loader, POLL_INTERVAL_MS);

  const alertsLoader = useCallback(async (): Promise<Alert[]> => {
    const api = getEnergyApi();
    return (await api.getAlerts?.({ status: "active" })) ?? [];
  }, []);
  const { state: alertsState } = useApiResource<Alert[]>(alertsLoader);

  const chartLoader = useCallback(async (): Promise<PowerPoint[]> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) return [];
    if (chartPeriod === "24h") return overview.series;
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const points = await api.getAggregate?.({
      siteId: overview.siteId,
      from,
      to: now.toISOString(),
      bucket: "day",
      groupBy: "site",
    });
    return (points ?? []).map((p: AggregatePoint) => ({ timestamp: p.bucketStart, powerW: p.powerWAvg }));
  }, [chartPeriod]);
  const { state: chartState } = useApiResource<PowerPoint[]>(chartLoader);

  const applianceLoader = useCallback(async () => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    const siteId = overview.siteId;

    let devices = overview.devices;
    let householdEnergy = overview.wholeSite.energyKwh;

    if (appliancePeriod === "7d") {
      const now = new Date();
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const to = now.toISOString();
      const windowDevices = (await api.getDeviceSummaries?.(siteId, from, to)) ?? overview.devices;
      const currentById = new Map(overview.devices.map((d) => [d.deviceId, d]));
      devices = windowDevices.map((d) => ({
        ...d,
        powerW: currentById.get(d.deviceId)?.powerW ?? d.powerW,
      }));
      householdEnergy = resolveWholeSite(devices).energyKwh;
    }

    const appliances = devices.filter((d) => d.roomName !== null);
    const applianceEnergy = appliances.reduce((s, d) => s + d.energyKwh, 0);
    const coverageIncomplete =
      householdEnergy > 0 && applianceEnergy < householdEnergy * 0.99;

    return {
      devices,
      householdEnergy,
      coverageIncomplete,
    };
  }, [appliancePeriod]);
  const { state: applianceState } = useApiResource(applianceLoader);

  if (state.status === "loading") {
    return (
      <div className="py-16">
        <Spinner label="Loading dashboard" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="py-8">
        <ErrorState message={state.message} onRetry={reload} />
      </div>
    );
  }

  const overview = state.data;
  const { wholeSite, dataSource } = overview;
  const meterBased = wholeSite.source === "meter";
  const currencySymbol = overview.currency === "INR" ? "₹" : "";
  const chartPoints = chartState.status === "ready" ? chartState.data : overview.series;
  const alerts = alertsState.status === "ready" ? alertsState.data : [];

  return (
    <div className="space-y-6 lattice-reveal">
      {state.error ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span className="font-semibold">Refresh failed:</span> {state.error} — showing the last successful reading.
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand/15 via-white/[0.03] to-transparent p-6 shadow-[0_0_60px_-20px_rgba(225,29,72,0.35)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-light">Live energy overview</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-5xl">{overview.siteName}</h1>
              <p className="mt-2 text-sm text-gray-400">
                {overview.onlineDeviceCount} of {overview.deviceCount} devices reporting · {overview.rooms.length} spaces
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${dataSource.simulated ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" : "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {dataSource.simulated ? "simulated" : "live"}
              </span>
              <p className="mt-2 text-xs text-gray-500">Updated {new Date(overview.lastUpdated).toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Live power" value={`${Math.round(wholeSite.powerW)} W`} sub={meterBased ? "site meter" : "device sum"} accent="brand" />
            <MetricTile label="Energy today" value={`${wholeSite.energyKwh.toFixed(2)} kWh`} sub="since midnight" accent="neutral" />
            <MetricTile label="Cost today" value={`${currencySymbol}${wholeSite.costInr.toFixed(0)}`} sub="estimated" accent="emerald" />
            <MetricTile label="Peak power" value={`${Math.round(overview.peak.powerW)} W`} sub={overview.peak.at ? new Date(overview.peak.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "no data"} accent="amber" />
          </div>
        </div>

        <div className="grid gap-4">
          <MetricTile label="Average power" value={`${Math.round(overview.averagePowerW)} W`} sub="across today's readings" />
          <MetricTile label="Devices online" value={`${overview.onlineDeviceCount} / ${overview.deviceCount}`} sub="reporting now" />
          <MetricTile label="Spaces" value={`${overview.rooms.length}`} sub="monitored areas" />
          <MetricTile label="Active alerts" value={`${alerts.length}`} sub="unresolved" accent={alerts.length > 0 ? "amber" : "emerald"} />
        </div>
      </section>

      <ChartPanel title="Power consumption" eyebrow="01 · Today's curve">
        <div className="mb-3 flex gap-2">
          {(["24h", "7d"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setChartPeriod(option)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${chartPeriod === option ? "bg-brand text-white" : "text-muted hover:text-ink"}`}
            >
              {option === "24h" ? "24 hours" : "7 days"}
            </button>
          ))}
        </div>
        {chartState.status === "loading" ? (
          <Spinner label="Loading chart" />
        ) : (
          <SitePowerChart points={chartPoints} timezone={overview.timezone} />
        )}
        <p className="mt-2 text-xs text-muted">
          {meterBased ? "Site meter readings for the selected period." : "Summed device readings for the selected period."}
        </p>
      </ChartPanel>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Highest consumers" eyebrow="02 · By current power">
          <TopConsumers devices={overview.devices} />
        </ChartPanel>
        <ChartPanel title="Usage by space" eyebrow="03 · Rooms">
          <RoomCards rooms={overview.rooms} />
        </ChartPanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ChartPanel title="Device status" eyebrow="04 · Fleet">
          <DeviceList devices={overview.devices} />
          <div className="mt-4 flex flex-wrap gap-2">
            {overview.devices.map((d) => (
              <StatusPill key={d.deviceId} status={d.status} />
            ))}
          </div>
        </ChartPanel>
        <ChartPanel title="Recent alerts" eyebrow="05 · Anomalies">
          {alerts.length === 0 ? (
            <EmptyState title="No active alerts" description="All systems are operating normally." />
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 6).map((alert) => (
                <li key={alert.id} className="rounded-xl border border-line bg-card/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{alert.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${alert.severity === "high" ? "bg-red-500/15 text-red-300" : alert.severity === "medium" ? "bg-amber-500/15 text-amber-300" : "bg-blue-500/15 text-blue-300"}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{alert.type} · {new Date(alert.detectedAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </ChartPanel>
      </section>

      {applianceState.status === "ready" ? (
        <ApplianceRanking
          items={rankAppliances(applianceState.data.devices, applianceState.data.householdEnergy)}
          householdEnergyKwh={applianceState.data.householdEnergy}
          coverageIncomplete={applianceState.data.coverageIncomplete}
          period={appliancePeriod}
          onPeriodChange={setAppliancePeriod}
        />
      ) : applianceState.status === "loading" ? (
        <div className="py-6">
          <Spinner label="Loading appliance insights" />
        </div>
      ) : (
        <ErrorState message={applianceState.message} />
      )}
    </div>
  );
}