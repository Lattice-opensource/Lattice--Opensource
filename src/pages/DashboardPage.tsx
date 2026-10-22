import { useCallback, useEffect, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import type { EnergyReading, SiteSummary, DeviceSummary, AggregatePoint } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SiteSummaryCard } from "../components/dashboard/SiteSummaryCard";
import { ConsumptionChart } from "../components/dashboard/ConsumptionChart";
import { RecentReadings } from "../components/dashboard/RecentReadings";
import { DeviceSummaryTable } from "../components/dashboard/DeviceSummaryTable";
import { AggregateChart } from "../components/dashboard/AggregateChart";

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
          <h1 className="text-2xl font-bold text-white md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
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
          {state.dataSource?.simulated || state.dataSource === undefined ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
              {state.dataSource?.notice ?? "Sample data only. Not real sensor measurements."}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.sites.map((site) => (
              <SiteSummaryCard key={site.siteId} site={site} />
            ))}
          </div>

          <Card title="Consumption over time">
            {state.readings.length === 0 ? (
              <EmptyState title="No readings" description="No recent readings for the selected site." />
            ) : (
              <>
                <ConsumptionChart readings={state.readings} />
                <div className="mt-4">
                  <RecentReadings readings={state.readings} />
                </div>
              </>
            )}
          </Card>

          {state.aggregate.length > 0 ? (
            <Card title="Energy by hour (last 24h)">
              <AggregateChart points={state.aggregate} />
            </Card>
          ) : null}

          {state.devices.length > 0 ? (
            <Card title="Device summary">
              <DeviceSummaryTable devices={state.devices} />
            </Card>
          ) : null}
        </>
      )}
    </section>
  );
}
