import { useCallback } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import type { DeviceSummary, EnergyReading } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { DeviceSummaryTable } from "../components/dashboard/DeviceSummaryTable";
import { RecentReadings } from "../components/dashboard/RecentReadings";

interface DevicesPayload {
  devices: DeviceSummary[];
  readings: EnergyReading[];
  timezone: string;
}

export function DevicesPage() {
  const loader = useCallback(async (): Promise<DevicesPayload> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    const devices = (await api.getDeviceSummaries?.(overview.siteId)) ?? overview.devices;
    const readings = await api.getRecentReadings(overview.siteId, 12);
    return { devices, readings, timezone: overview.timezone };
  }, []);

  const { state, reload } = useApiResource<DevicesPayload>(loader);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Devices</h1>
        <p className="mt-1 text-sm text-muted">
          Per-device power, energy and cost for the current day.
        </p>
      </header>

      {state.status === "loading" ? (
        <div className="py-12">
          <Spinner label="Loading devices" />
        </div>
      ) : state.status === "error" ? (
        <ErrorState message={state.message} onRetry={reload} />
      ) : state.data.devices.length === 0 ? (
        <EmptyState title="No devices" description="No devices are reporting for this site." />
      ) : (
        <>
          {state.error ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-ink/80">
              <span className="font-semibold">Refresh failed:</span> {state.error} — showing the last
              successful reading.
            </div>
          ) : null}

          <Card title="Device summary" eyebrow="01 · Devices">
            <DeviceSummaryTable devices={state.data.devices} />
          </Card>

          <Card title="Latest readings" eyebrow="02 · Readings">
            {state.data.readings.length === 0 ? (
              <EmptyState title="No readings" description="No recent readings are available." />
            ) : (
              <RecentReadings readings={state.data.readings} timezone={state.data.timezone} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
