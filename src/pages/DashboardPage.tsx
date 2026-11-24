import { useCallback, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import { useDataSource } from "../data/useDataSource";
import { useApiResource } from "../data/useApiResource";
import type { SiteOverview } from "../data/api/energyApi";
import type { Alert } from "../data/api/energyApi";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { ChartPanel } from "../components/ui/ChartPanel";
import { SitePowerChart } from "../components/dashboard/SitePowerChart";
import { DeviceList } from "../components/dashboard/DeviceList";
import { RoomCards } from "../components/dashboard/RoomCards";
import { TopConsumers } from "../components/dashboard/TopConsumers";
import { ApplianceRanking, rankAppliances, type AppliancePeriod } from "../components/dashboard/ApplianceRanking";
import { resolveWholeSite } from "../data/api/normalize";
import type { AggregatePoint, PowerPoint } from "../data/api/energyApi";
import { currentUser } from "../lib/currentUser";

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
  const { wholeSite } = overview;
  const meterBased = wholeSite.source === "meter";
  const currencySymbol = overview.currency === "INR" ? "₹" : "";
  const chartPoints = chartState.status === "ready" ? chartState.data : overview.series;
  const alerts = alertsState.status === "ready" ? alertsState.data : [];

  const statusCounts = overview.devices.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6 lattice-reveal">
      {state.error ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span className="font-semibold">Refresh failed:</span> {state.error} — showing the last successful reading.
        </div>
      ) : null}

      {/* HERO */}
      <section className="lattice-hero rounded-3xl p-6 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* Left: eyebrow + headline + supporting */}
          <div>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight lattice-grad-text md:text-6xl">
              {currentUser.building}
            </h1>
            <p className="mt-4 text-sm lattice-hero-muted md:text-base">
              {overview.onlineDeviceCount} of {overview.deviceCount} devices reporting · {overview.rooms.length} spaces monitored
              {meterBased ? " · site meter" : " · device sum"} · updated {new Date(overview.lastUpdated).toLocaleTimeString()}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-white/15 px-3.5 py-1.5 text-[12px] font-semibold lattice-hero-muted">
                {overview.timezone === currentUser.timezone ? currentUser.timezoneLabel : overview.timezone}
              </span>
            </div>
          </div>

          {/* Right: main energy card */}
          <div className="lattice-hero-card rounded-3xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Live power</p>
                <p className="mt-1 text-xs text-muted">{meterBased ? "site meter" : "summed devices"}</p>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black tabular-nums tracking-tight lattice-hero-ink md:text-6xl">
                {(wholeSite.powerW / 1000).toFixed(2)}
              </span>
              <span className="text-2xl font-bold text-brand-light">kW</span>
            </div>

            <div className="mt-4">
              <div className="mb-3 flex gap-2">
                {(["24h", "7d"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setChartPeriod(option)}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all ${chartPeriod === option ? "bg-brand text-white shadow-[0_0_30px_-8px_rgba(225,29,72,0.6)]" : "border border-white/10 text-muted hover:text-ink"}`}
                  >
                    {option === "24h" ? "24 hours" : "7 days"}
                  </button>
                ))}
              </div>
              {chartState.status === "loading" ? (
                <Spinner label="Loading chart" />
              ) : (
                <SitePowerChart points={chartPoints} timezone={overview.timezone} variant={chartPeriod === "24h" ? "bars" : "line"} />
              )}
              <p className="mt-2 text-xs text-muted">
                {meterBased ? "Site meter readings for the selected period." : "Summed device readings for the selected period."}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="lattice-subbox p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Energy today</p>
                <p className="mt-1 text-base font-bold tabular-nums lattice-hero-ink">{wholeSite.energyKwh.toFixed(2)} kWh</p>
              </div>
              <div className="lattice-subbox p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Cost today</p>
                <p className="mt-1 text-base font-bold tabular-nums text-emerald-400">{currencySymbol}{wholeSite.costInr.toFixed(2)}</p>
              </div>
              <div className="lattice-subbox p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Peak power</p>
                <p className="mt-1 text-base font-bold tabular-nums text-amber-300">{(overview.peak.powerW / 1000).toFixed(2)} kW</p>
                <p className="mt-0.5 text-[10px] text-muted">{overview.peak.at ? new Date(overview.peak.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "no data"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary metric strip */}
      <section className="lattice-strip rounded-2xl px-5 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Average power</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-ink">{Math.round(overview.averagePowerW)} W</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Devices online</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-ink">{overview.onlineDeviceCount} / {overview.deviceCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Spaces</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-ink">{overview.rooms.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Active alerts</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${alerts.length > 0 ? "text-amber-300" : "text-emerald-400"}`}>{alerts.length}</p>
          </div>
        </div>
      </section>

      {/* Fleet summary */}
      <p className="text-xs text-muted">
        Fleet: {statusCounts.online ?? 0} online · {statusCounts.stale ?? 0} stale · {statusCounts.offline ?? 0} offline · {statusCounts.unknown ?? 0} unknown
      </p>

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