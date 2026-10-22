import { useCallback, useEffect, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import type { EnergyReading, SiteSummary, DeviceSummary, AggregatePoint } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { RecentReadings } from "../components/dashboard/RecentReadings";
import { AreaChart } from "../components/dashboard/AreaChart";
import { DeviceSummaryTable } from "../components/dashboard/DeviceSummaryTable";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      sites: SiteSummary[];
      readings: EnergyReading[];
      devices: DeviceSummary[];
      aggregate: AggregatePoint[];
      dataSource?: { simulated: boolean; notice: string };
      serverTime?: string;
    };

export function DashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const api = getEnergyApi();
      const sites = await api.getSiteSummaries();
      const siteId = sites[0]?.siteId;
      const [readings, devices, dataSource] = await Promise.all([
        siteId ? api.getRecentReadings(siteId, 12) : Promise.resolve([]),
        api.getDeviceSummaries?.(siteId) ?? Promise.resolve([]),
        api.getDataSource?.() ?? Promise.resolve(undefined),
      ]);

      const now = new Date();
      const from = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
      const to = now.toISOString();
      const aggregate = (await api.getAggregate?.({ siteId, from, to, bucket: "hour" })) ?? [];

      setState({
        status: "ready",
        sites,
        readings,
        devices,
        aggregate,
        dataSource,
        serverTime: new Date().toISOString(),
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  useEffect(() => {
    const id = window.setInterval(() => setReloadKey((k) => k + 1), 10000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
            Overview of connected sites. Auto-refreshes every 10s.
          </p>
        </div>
        {state.status === "ready" && state.serverTime ? (
          <p className="text-xs text-gray-500">Updated {new Date(state.serverTime).toLocaleTimeString()}</p>
        ) : null}
      </div>

      {state.status === "loading" ? (
        <Spinner label="Loading dashboard" />
      ) : state.status === "error" ? (
        <ErrorState
          message={state.message}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : state.sites.length === 0 ? (
        <EmptyState
          title="No sites available"
          description="Connect a device or configure sample data to see readings."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {state.sites[0]?.name ?? "Site"}
              </h2>
              <p className="text-sm text-gray-500">Whole-site energy overview</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>{state.dataSource?.simulated ? "Simulated data" : "Live data"}</p>
              <p>Updated {state.serverTime ? new Date(state.serverTime).toLocaleTimeString() : "—"}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.sites.map((site) => (
              <div key={site.siteId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500">Current power</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{site.currentPowerW} W</p>
              </div>
            ))}
            {state.sites.map((site) => (
              <div key={site.siteId + "-e"} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500">Energy today</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{site.todayEnergyKwh} kWh</p>
              </div>
            ))}
            {state.sites.map((site) => (
              <div key={site.siteId + "-c"} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500">Estimated cost today</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">₹{site.todayCostInr}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
            >
              Refresh data
            </button>
          </div>

          {state.dataSource?.simulated || state.dataSource === undefined ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
              {state.dataSource?.notice ?? "Sample data only. Not real sensor measurements."}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Power over time">
              {state.aggregate.length === 0 ? (
                <EmptyState title="No aggregate data" description="No historical data available." />
              ) : (
                <AreaChart points={state.aggregate} />
              )}
            </Card>
            <Card title="Recent readings">
              {state.readings.length === 0 ? (
                <EmptyState title="No readings" description="No recent readings for the selected site." />
              ) : (
                <RecentReadings readings={state.readings} />
              )}
            </Card>
          </div>

          {state.devices.length > 0 ? (
            <Card title="Device summary">
              <DeviceSummaryTable devices={state.devices} />
            </Card>
          ) : null}

          {state.devices.length > 0 ? (
            <Card title="Rooms">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from(
                  state.devices.reduce((m, d) => {
                    const key = d.roomName ?? "Unassigned";
                    const g = m.get(key) ?? { room: key, powerW: 0, energyKwh: 0, costInr: 0, count: 0 };
                    g.powerW += d.powerW;
                    g.energyKwh += d.energyKwh;
                    g.costInr += d.costInr;
                    g.count += 1;
                    m.set(key, g);
                    return m;
                  }, new Map<string, { room: string; powerW: number; energyKwh: number; costInr: number; count: number }>()),
                ).map(([key, g]) => (
                  <div key={key} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">{g.room}</p>
                    <p className="mt-1 text-xs text-gray-500">{g.count} devices</p>
                    <dl className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Power</dt>
                        <dd className="text-gray-900">{Math.round(g.powerW)} W</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Energy</dt>
                        <dd className="text-gray-900">{g.energyKwh.toFixed(3)} kWh</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Cost</dt>
                        <dd className="text-emerald-600">₹{g.costInr.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </section>
  );
}
