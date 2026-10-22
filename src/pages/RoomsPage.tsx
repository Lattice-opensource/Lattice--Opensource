import { useCallback, useEffect, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import type { DeviceSummary } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";

interface RoomGroup {
  room: string;
  devices: DeviceSummary[];
  powerW: number;
  energyKwh: number;
  costInr: number;
}

export function RoomsPage() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; rooms: RoomGroup[] }
  >({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const api = getEnergyApi();
      const devices = (await api.getDeviceSummaries?.()) ?? [];
      const map = new Map<string, RoomGroup>();
      for (const d of devices) {
        const key = d.roomName ?? "Unassigned";
        if (!map.has(key)) {
          map.set(key, { room: key, devices: [], powerW: 0, energyKwh: 0, costInr: 0 });
        }
        const g = map.get(key)!;
        g.devices.push(d);
        g.powerW += d.powerW;
        g.energyKwh += d.energyKwh;
        g.costInr += d.costInr;
      }
      setState({ status: "ready", rooms: Array.from(map.values()) });
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
        <h1 className="text-2xl font-bold text-white md:text-3xl">Rooms</h1>
        <p className="mt-1 text-sm text-gray-400">Energy usage grouped by room.</p>
      </div>

      {state.status === "loading" ? (
        <Spinner label="Loading rooms" />
      ) : state.status === "error" ? (
        <ErrorState message={state.message} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : state.rooms.length === 0 ? (
        <EmptyState title="No rooms" description="No room data available." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {state.rooms.map((r) => (
            <Card key={r.room} title={r.room}>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Devices</dt>
                  <dd className="text-white">{r.devices.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Power</dt>
                  <dd className="text-white">{Math.round(r.powerW)} W</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Energy</dt>
                  <dd className="text-white">{r.energyKwh.toFixed(3)} kWh</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Cost</dt>
                  <dd className="text-emerald-400">₹{r.costInr.toFixed(2)}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
