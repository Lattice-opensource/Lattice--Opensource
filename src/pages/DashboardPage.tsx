import { useCallback, useEffect, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import type { EnergyReading, SiteSummary } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SiteSummaryCard } from "../components/dashboard/SiteSummaryCard";
import { ConsumptionChart } from "../components/dashboard/ConsumptionChart";
import { RecentReadings } from "../components/dashboard/RecentReadings";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sites: SiteSummary[]; readings: EnergyReading[] };

export function DashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const api = getEnergyApi();
      const sites = await api.getSiteSummaries();
      const readings = sites.length
        ? await api.getRecentReadings(sites[0].siteId, 12)
        : [];
      setState({ status: "ready", sites, readings });
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

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">
          Overview of connected sites. Data shown is sample data only.
        </p>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.sites.map((site) => (
              <SiteSummaryCard key={site.siteId} site={site} />
            ))}
          </div>

          <Card title="Consumption over time">
            {state.readings.length === 0 ? (
              <EmptyState
                title="No readings"
                description="No recent readings for the selected site."
              />
            ) : (
              <>
                <ConsumptionChart readings={state.readings} />
                <div className="mt-4">
                  <RecentReadings readings={state.readings} />
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
