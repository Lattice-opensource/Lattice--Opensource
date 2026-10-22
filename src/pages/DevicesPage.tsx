import { useCallback, useEffect, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import type { DeviceSummary } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { DeviceSummaryTable } from "../components/dashboard/DeviceSummaryTable";

export function DevicesPage() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; devices: DeviceSummary[] }
  >({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const api = getEnergyApi();
      const devices = (await api.getDeviceSummaries?.()) ?? [];
      setState({ status: "ready", devices });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">Devices</h1>
        <p className="mt-1 text-sm text-gray-400">Per-device power, energy and cost for the current window.</p>
      </div>

      {state.status === "loading" ? (
        <Spinner label="Loading devices" />
      ) : state.status === "error" ? (
        <ErrorState message={state.message} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : state.devices.length === 0 ? (
        <EmptyState title="No devices" description="No device data available." />
      ) : (
        <Card title="Device summary">
          <DeviceSummaryTable devices={state.devices} />
        </Card>
      )}
    </section>
  );
}
