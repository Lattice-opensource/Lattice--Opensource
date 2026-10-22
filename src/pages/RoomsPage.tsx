import { useCallback } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import type { RoomSummary } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { RoomCards } from "../components/dashboard/RoomCards";

export function RoomsPage() {
  const loader = useCallback(async (): Promise<RoomSummary[]> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    return overview.rooms;
  }, []);

  const { state, reload } = useApiResource<RoomSummary[]>(loader);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Rooms</h1>
        <p className="mt-1 text-sm text-muted">Energy usage grouped by room for the current day.</p>
      </header>

      {state.status === "loading" ? (
        <div className="py-12">
          <Spinner label="Loading rooms" />
        </div>
      ) : state.status === "error" ? (
        <ErrorState message={state.message} onRetry={reload} />
      ) : state.data.length === 0 ? (
        <EmptyState title="No rooms" description="No room data is available for this site." />
      ) : (
        <Card title="Usage by room" eyebrow="01 · Rooms">
          <RoomCards rooms={state.data} />
        </Card>
      )}
    </div>
  );
}
