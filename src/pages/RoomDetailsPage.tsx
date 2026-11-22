import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import type { Building, Circuit, Floor, Room } from "@lattice/contracts";
import type { Alert, Device, PowerPoint, Summary } from "../data/api/energyApi";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import { Card } from "../components/ui/Card";
import { MetricTile } from "../components/ui/MetricTile";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { SitePowerChart } from "../components/dashboard/SitePowerChart";
import { StatusPill } from "../components/ui/StatusPill";

interface RoomDetails {
  room: Room;
  window: { from: string; to: string } | null;
  summary: Summary | null;
  alerts: Alert[];
  buildings: Building[];
  floors: Floor[];
  circuits: Circuit[];
  devices: Device[];
  series: PowerPoint[];
  peakPowerW: number;
  averagePowerW: number;
  timezone: string;
  siteId: string;
  deviceCount: number;
  powerW: number;
  energyKwh: number;
  costInr: number;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function RoomDetailsPage() {
  const { roomId = "" } = useParams();

  const loader = useCallback(async (): Promise<RoomDetails> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");

    const to = new Date();
    const from = new Date(to);
    from.setHours(0, 0, 0, 0);

    const [rooms, devices, summary, aggregate, alerts, buildings, floors, circuits] = await Promise.all([
      api.getRooms?.() ?? Promise.resolve([]),
      api.getDevices?.({ roomId }) ?? Promise.resolve([]),
      api.getSummary?.({ roomId, from: from.toISOString(), to: to.toISOString() }) ?? Promise.resolve(null),
      api.getAggregate?.({
        roomId,
        from: from.toISOString(),
        to: to.toISOString(),
        bucket: "hour",
      }) ?? Promise.resolve([]),
      api.getAlerts?.({ roomId }) ?? Promise.resolve([]),
      api.getBuildings?.() ?? Promise.resolve([]),
      api.getFloors?.() ?? Promise.resolve([]),
      api.getCircuits?.({ roomId }) ?? Promise.resolve([]),
    ]);

    const roomSummary = overview.rooms.find((r) => r.roomId === roomId);
    const room =
      rooms.find((r) => r.id === roomId) ??
      ({
        id: roomId,
        siteId: overview.siteId,
        buildingId: null,
        floorId: null,
        name: roomSummary?.roomName ?? "Room",
        createdAt: "",
        updatedAt: "",
      } satisfies Room);

    const series: PowerPoint[] = aggregate.map((point) => ({
      timestamp: point.bucketStart,
      powerW: point.powerWAvg,
    }));
    const averagePowerW = series.length
      ? series.reduce((sum, point) => sum + point.powerW, 0) / series.length
      : roomSummary?.powerW ?? 0;
    const peakPowerW = aggregate.length
      ? Math.max(...aggregate.map((point) => point.powerWMax))
      : roomSummary?.powerW ?? 0;

    return {
      room,
      window: summary?.window ?? null,
      summary,
      alerts,
      buildings,
      floors,
      circuits,
      devices,
      series,
      peakPowerW,
      averagePowerW,
      timezone: overview.timezone,
      siteId: overview.siteId,
      deviceCount: roomSummary?.deviceCount ?? devices.length,
      powerW: roomSummary?.powerW ?? summary?.totals.powerW ?? 0,
      energyKwh: roomSummary?.energyKwh ?? summary?.totals.energyKwh ?? 0,
      costInr: roomSummary?.costInr ?? summary?.totals.costInr ?? 0,
    };
  }, [roomId]);

  const { state, reload } = useApiResource<RoomDetails>(loader, 15000);

  if (state.status === "loading") {
    return (
      <div className="py-16">
        <Spinner label="Loading room details" />
      </div>
    );
  }
  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={reload} />;
  }

  const data = state.data;
  const buildingName = data.buildings.find((b) => b.id === data.room.buildingId)?.name ?? "—";
  const floorName = data.floors.find((f) => f.id === data.room.floorId)?.name ?? "—";
  const deviceRows = data.summary?.byDevice ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-light">Room details</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">{data.room.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {buildingName} · {floorName} · {data.deviceCount} {data.deviceCount === 1 ? "device" : "devices"}
          </p>
        </div>
        <Link
          to="/rooms"
          className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
        >
          ← Back to rooms
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Current power" value={`${Math.round(data.powerW)} W`} accent="brand" />
        <MetricTile label="Energy today" value={`${data.energyKwh.toFixed(2)} kWh`} />
        <MetricTile label="Cost today" value={`₹${data.costInr.toFixed(2)}`} accent="emerald" />
        <MetricTile label="Devices" value={String(data.deviceCount)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Average power" value={`${Math.round(data.averagePowerW)} W`} />
        <MetricTile label="Peak power" value={`${Math.round(data.peakPowerW)} W`} accent="amber" />
        <MetricTile label="Circuits" value={String(data.circuits.length)} />
        <MetricTile label="Active alerts" value={String(data.alerts.filter((a) => a.status !== "resolved").length)} />
      </div>

      <Card title="Power today" eyebrow="Live power" className="overflow-hidden">
        <SitePowerChart points={data.series} timezone={data.timezone} variant="bars" />
      </Card>

      <Card title="Devices in this room" eyebrow="Fleet">
        {deviceRows.length === 0 ? (
          <EmptyState title="No devices" description="No devices are attached to this room." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="py-2 pr-4 font-semibold">Device</th>
                  <th className="py-2 pr-4 font-semibold">Category</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 text-right font-semibold">Power</th>
                  <th className="py-2 pr-4 text-right font-semibold">Energy</th>
                  <th className="py-2 pr-4 text-right font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {deviceRows.map((device) => (
                  <tr key={device.deviceId} className="hover:bg-white/5">
                    <td className="py-3 pr-4">
                      <Link
                        to={`/devices/${encodeURIComponent(device.deviceId)}`}
                        className="font-medium text-ink hover:text-brand-light"
                      >
                        {device.deviceName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted">{device.category}</td>
                    <td className="py-3 pr-4">
                      <StatusPill status={device.status} />
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold tabular-nums text-ink">
                      {Math.round(device.powerW)} W
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-ink">
                      {device.energyKwh.toFixed(3)} kWh
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-ok">
                      ₹{device.costInr.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Room information" eyebrow="Details">
          <dl className="text-sm">
            {[
              ["Room ID", data.room.id],
              ["Site ID", data.siteId],
              ["Building", buildingName],
              ["Floor", floorName],
              ["Circuits", data.circuits.map((c) => c.name).join(", ") || "—"],
              ["Created", formatDate(data.room.createdAt)],
              ["Last updated", formatDate(data.room.updatedAt)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
                <dd className="text-ink">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Alerts" eyebrow="Room">
          {data.alerts.length === 0 ? (
            <EmptyState title="No alerts" description="No alerts have been raised for this room." />
          ) : (
            <ul className="space-y-2">
              {data.alerts.map((alert) => (
                <li key={alert.id} className="rounded-lg border border-line bg-page/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{alert.title}</p>
                    <span className="rounded-full bg-page px-2 py-0.5 text-[10px] font-semibold text-muted">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {alert.status} · {formatDate(alert.detectedAt)}
                  </p>
                  <p className="mt-2 text-xs text-muted">{alert.explanation}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
