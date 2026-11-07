import { useCallback, useEffect, useMemo, useState } from "react";
import type { Building, Circuit, Device, Floor, Room } from "@lattice/contracts";
import type { Summary } from "../data/api/energyApi";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Spinner } from "../components/ui/Spinner";
import { SitePowerChart } from "../components/dashboard/SitePowerChart";

function ChoiceList<T extends { id: string; name: string }>({ items, selectedId, onSelect, empty }: { items: T[]; selectedId?: string; onSelect: (item: T) => void; empty: string }) {
  return items.length ? <div className="space-y-2">{items.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item)} aria-pressed={item.id === selectedId} className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${item.id === selectedId ? "border-brand bg-brand-soft text-brand" : "border-line bg-page hover:border-brand/40"}`}><span className="font-semibold">{item.name}</span></button>)}</div> : <EmptyState title="Nothing here yet" description={empty} />;
}

function CircuitDevices({ devices }: { devices: Device[] }) {
  if (!devices.length) return <EmptyState title="No devices" description="No meters or monitored devices are assigned to this circuit." />;
  return <ul className="divide-y divide-line">{devices.map((device) => <li key={device.id} className="py-3"><p className="text-sm font-semibold text-ink">{device.name}</p><p className="mt-1 text-xs text-muted">{device.category} · {device.status} · {device.model ?? "model not recorded"}</p></li>)}</ul>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-page p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

export function CampusPage() {
  const siteLoader = useCallback(async () => { const api = getEnergyApi(); const overview = await api.getSiteOverview?.(); if (!overview || !api.getBuildings) throw new Error("Campus data is unavailable from this provider."); return { site: overview, buildings: await api.getBuildings(overview.siteId) }; }, []);
  const { state: siteState, reload } = useApiResource(siteLoader);
  const [building, setBuilding] = useState<Building>(); const [floor, setFloor] = useState<Floor>(); const [room, setRoom] = useState<Room>(); const [circuit, setCircuit] = useState<Circuit>();
  const [period, setPeriod] = useState<"24h" | "7d">("24h");
  const floorsLoader = useCallback(async () => { const getFloors = getEnergyApi().getFloors; return building && getFloors ? getFloors(building.id) : []; }, [building]);
  const roomsLoader = useCallback(async () => { const getRooms = getEnergyApi().getRooms; return floor && getRooms ? getRooms({ floorId: floor.id }) : []; }, [floor]);
  const circuitsLoader = useCallback(async () => { const getCircuits = getEnergyApi().getCircuits; return room && getCircuits ? getCircuits({ roomId: room.id }) : []; }, [room]);
  const devicesLoader = useCallback(async () => { const getDevices = getEnergyApi().getDevices; return circuit && getDevices ? getDevices({ circuitId: circuit.id }) : []; }, [circuit]);
  const floors = useApiResource(floorsLoader); const rooms = useApiResource(roomsLoader); const circuits = useApiResource(circuitsLoader); const devices = useApiResource(devicesLoader);
  const { reload: reloadFloors } = floors; const { reload: reloadRooms } = rooms; const { reload: reloadCircuits } = circuits; const { reload: reloadDevices } = devices;
  useEffect(() => { reloadFloors(); }, [building?.id, reloadFloors]);
  useEffect(() => { reloadRooms(); }, [floor?.id, reloadRooms]);
  useEffect(() => { reloadCircuits(); }, [room?.id, reloadCircuits]);
  useEffect(() => { reloadDevices(); }, [circuit?.id, reloadDevices]);
  useEffect(() => { setFloor(undefined); setRoom(undefined); setCircuit(undefined); }, [building?.id]);
  useEffect(() => { setRoom(undefined); setCircuit(undefined); }, [floor?.id]);
  useEffect(() => { setCircuit(undefined); }, [room?.id]);

  const siteId = siteState.status === "ready" ? siteState.data.site.siteId : "";
  const scopeParams = useMemo(() => {
    if (circuit) return { circuitId: circuit.id };
    if (room) return { roomId: room.id };
    if (floor) return { floorId: floor.id };
    if (building) return { buildingId: building.id };
    return null;
  }, [building, floor, room, circuit]);
  const scopeKey = circuit?.id ?? room?.id ?? floor?.id ?? building?.id ?? "";
  const scopeLabel = circuit?.name ?? room?.name ?? floor?.name ?? building?.name ?? "";

  const loadSummary = useCallback(async (): Promise<Summary | null> => {
    if (!siteId || !scopeParams) return null;
    const api = getEnergyApi();
    const getSummary = api.getSummary ?? api.getScopedSummary;
    if (!getSummary) throw new Error("Scoped energy analytics are unavailable from this provider.");
    return getSummary({ siteId, ...scopeParams });
  }, [siteId, scopeParams]);
  const loadHistory = useCallback(async () => {
    if (!siteId || !scopeParams) return null;
    const api = getEnergyApi();
    if (!api.getAggregate) throw new Error("Historical aggregation is unavailable from this provider.");
    const now = new Date();
    const from = period === "24h" ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const bucket = period === "24h" ? "hour" : "day";
    const points = await api.getAggregate({ siteId, ...scopeParams, from: from.toISOString(), to: now.toISOString(), bucket, groupBy: "site" });
    const timezone = siteState.status === "ready" ? siteState.data.site.timezone : "UTC";
    return { points, timezone };
  }, [siteId, scopeParams, period, siteState]);

  const summaryRes = useApiResource(loadSummary);
  const historyRes = useApiResource(loadHistory);
  const { reload: reloadSummary } = summaryRes;
  const { reload: reloadHistory } = historyRes;
  useEffect(() => { reloadSummary(); }, [scopeKey, siteId, reloadSummary]);
  useEffect(() => { reloadHistory(); }, [scopeKey, period, siteId, reloadHistory]);

  if (siteState.status === "loading") return <div className="py-16"><Spinner label="Loading campus" /></div>;
  if (siteState.status === "error") return <ErrorState message={siteState.message} onRetry={reload} />;
  const context = [siteState.data.site.siteName, building?.name, floor?.name, room?.name, circuit?.name].filter(Boolean).join(" / ");
  const panel = <T,>(title: string, resource: ReturnType<typeof useApiResource<T[]>>, content: (items: T[]) => React.ReactNode) => <Card title={title}>{resource.state.status === "loading" ? <Spinner label={`Loading ${title.toLowerCase()}`} /> : resource.state.status === "error" ? <ErrorState message={resource.state.message} /> : content(resource.state.data)}</Card>;

  const summaryData = summaryRes.state.status === "ready" ? summaryRes.state.data : null;
  const historyData = historyRes.state.status === "ready" ? historyRes.state.data : null;
  const historyPoints = (historyData?.points ?? []).map((p) => ({ timestamp: p.bucketStart, powerW: p.powerWAvg }));
  const historyTimezone = historyData?.timezone ?? siteState.data.site.timezone;

  const byDeviceSorted = summaryData ? [...summaryData.byDevice].sort((a, b) => b.energyKwh - a.energyKwh) : [];
  const totalEnergy = summaryData?.totals.energyKwh ?? 0;
  const onlineCount = summaryData ? summaryData.byDevice.filter((d) => d.status === "online").length : 0;
  const staleCount = summaryData ? summaryData.byDevice.filter((d) => d.status === "stale").length : 0;
  const unknownCount = summaryData ? summaryData.byDevice.filter((d) => d.status === "unknown").length : 0;
  const offlineCount = summaryData ? summaryData.byDevice.filter((d) => d.status === "offline").length : 0;

  return (
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Campus</h1><p className="mt-1 text-sm text-muted">{context}</p></header>
      <Card title="Buildings" eyebrow="01 · Site"><ChoiceList items={siteState.data.buildings} selectedId={building?.id} onSelect={setBuilding} empty="No buildings are available for this site." /></Card>
      {building ? panel("Floors", floors, (items) => <ChoiceList items={items as Floor[]} selectedId={floor?.id} onSelect={setFloor} empty="No floors are available for this building." />) : null}
      {floor ? panel("Spaces", rooms, (items) => <ChoiceList items={items as Room[]} selectedId={room?.id} onSelect={setRoom} empty="No spaces are available on this floor." />) : null}
      {room ? panel("Circuits", circuits, (items) => <ChoiceList items={items as Circuit[]} selectedId={circuit?.id} onSelect={setCircuit} empty="No circuits are assigned to this space." />) : null}
      {circuit ? panel("Devices & meters", devices, (items) => <CircuitDevices devices={items as Device[]} />) : null}

      {scopeKey ? (
        <>
          <Card title={`${scopeLabel} energy`} eyebrow="Analytics">
            {summaryRes.state.status === "loading" ? <Spinner label="Loading energy metrics" /> : summaryRes.state.status === "error" ? <ErrorState message={summaryRes.state.message} /> : summaryData ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Current power" value={`${(summaryData.totals.powerW / 1000).toFixed(2)} kW`} />
                  <Metric label="Energy today" value={`${summaryData.totals.energyKwh.toFixed(2)} kWh`} />
                  <Metric label="Estimated cost" value={`₹${summaryData.totals.costInr.toFixed(0)}`} />
                  <Metric label="Connected devices" value={`${summaryData.byDevice.length}`} />
                </div>
                <p className="mt-3 text-xs text-muted">
                  Reading freshness: {onlineCount} online, {staleCount} stale, {unknownCount} unknown, {offlineCount} offline. Data availability: {summaryData.dataQuality.simulated ? "simulated" : "live"} readings ({summaryData.dataQuality.simulatedReadings} simulated, {summaryData.dataQuality.realReadings} real).
                </p>
              </>
            ) : <EmptyState title="No energy data" description="No readings are available for this selection." />}
          </Card>

          {byDeviceSorted.length > 0 ? (
            <Card title="Consumption by device" eyebrow="Breakdown">
              <ul className="space-y-3">
                {byDeviceSorted.map((device) => (
                  <li key={device.deviceId} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">{device.deviceName}</p>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">{device.energyKwh.toFixed(2)} kWh</p>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-page">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(totalEnergy > 0 ? (device.energyKwh / totalEnergy) * 100 : 0, 2)}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{device.roomName ?? "Site level"} · {Math.round(device.powerW)} W · {totalEnergy > 0 ? ((device.energyKwh / totalEnergy) * 100).toFixed(1) : 0}% of selection</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {building && !floor && summaryData && summaryData.byRoom.length > 0 ? (
            <Card title="Spaces in this building" eyebrow="Comparison">
              <ul className="space-y-3">
                {summaryData.byRoom.slice().sort((a, b) => b.energyKwh - a.energyKwh).map((roomSummary) => (
                  <li key={roomSummary.roomId} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">{roomSummary.roomName}</p>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">{roomSummary.energyKwh.toFixed(2)} kWh</p>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-page">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(totalEnergy > 0 ? (roomSummary.energyKwh / totalEnergy) * 100 : 0, 2)}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{Math.round(roomSummary.powerW)} W</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card title={`Historical consumption — ${period === "24h" ? "last 24 hours" : "last 7 days"}`} eyebrow="Trend">
            <div className="mb-3 inline-flex rounded-lg border border-line bg-page p-1" role="group" aria-label="History period">
              {(["24h", "7d"] as const).map((option) => (
                <button key={option} type="button" aria-pressed={period === option} onClick={() => setPeriod(option)} className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${period === option ? "bg-brand text-white" : "text-muted hover:text-ink"}`}>
                  {option === "24h" ? "24 hours" : "7 days"}
                </button>
              ))}
            </div>
            {historyRes.state.status === "loading" ? <Spinner label="Loading history" /> : historyRes.state.status === "error" ? <ErrorState message={historyRes.state.message} /> : <SitePowerChart points={historyPoints} timezone={historyTimezone} />}
          </Card>
        </>
      ) : null}
    </div>
  );
}