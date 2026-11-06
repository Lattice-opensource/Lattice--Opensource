import { useState, useMemo, useEffect, useCallback } from "react";
import { config } from "../../config/env";
import { buildingApi } from "./data/buildingApi";
import { DEMO_BUILDING, DEMO_ALERTS, STATUS_META, type DemoRoom, type RoomStatus, type DemoAlert } from "./sampleData";
import { BlueprintViewer, type RoomPolygon } from "./components/BlueprintViewer";
import { ApplianceManager } from "./components/ApplianceManager";
import { RoomEnergyChart } from "./components/RoomEnergyChart";
import { Card } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";

import { EmptyState } from "../../components/ui/EmptyState";

const STATUS_COLOR: Record<RoomStatus, string> = {
  normal: "#059669",
  higher: "#b45309",
  unusual: "#ea580c",
  critical: "#e11d48",
  nodata: "#9ca3af",
};

export function BuildingDashboardPage() {
  const building = DEMO_BUILDING;
  const [floorId, setFloorId] = useState(building.floors[0].id);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);
  const [range, setRange] = useState("today");
  const [alerts, setAlerts] = useState<DemoAlert[]>(DEMO_ALERTS);
  const [alertsAvailable, setAlertsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [appliancesByRoom, setAppliancesByRoom] = useState<Record<string, DemoRoom["appliances"]>>(() => {
    const m: Record<string, DemoRoom["appliances"]> = {};
    for (const f of DEMO_BUILDING.floors) for (const r of f.rooms) m[r.id] = [...r.appliances];
    return m;
  });

  const floor = building.floors.find((f) => f.id === floorId) || building.floors[0];

  const fetchAlerts = useCallback(async () => {
    if (config.useSampleData) return;
    try {
      const res = await buildingApi.buildingAlerts(building.id);
      const mapped: DemoAlert[] = (res.data || []).map((a) => ({
        id: a.id,
        building_id: a.building_id,
        circuit_id: a.circuit_id,
        alert_type: a.alert_type,
        severity: a.severity,
        description: a.description,
        timestamp: a.timestamp,
        resolution_status: a.resolution_status,
        roomId: a.roomId,
        level: a.level,
      }));
      setAlerts(mapped);
      setAlertsAvailable(res.meta?.available !== false);
    } catch {
      setAlertsAvailable(false);
    }
  }, [building.id]);

  useEffect(() => {
    if (config.useSampleData) return;
    void fetchAlerts();
    const t = setInterval(() => void fetchAlerts(), 15000);
    return () => clearInterval(t);
  }, [fetchAlerts]);
  const alertCountByRoom = (roomId: string) => alerts.filter((a) => a.roomId === roomId && a.resolution_status === "open").length;
  const rooms: RoomPolygon[] = floor.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    points: r.points,
    status: r.status,
    color: STATUS_COLOR[r.status],
    powerW: r.powerW,
    alertCount: alertCountByRoom(r.id) || r.alertCount,
  }));

  const selectedRoom: DemoRoom | null = floor.rooms.find((r) => r.id === selectedRoomId) || null;

  const rangeFactor = range === "week" ? 7 : range === "month" ? 30 : 1;
  const totals = useMemo(() => {
    const power = floor.rooms.reduce((a, r) => a + (r.powerW ?? 0), 0);
    const energy = floor.rooms.reduce((a, r) => a + (r.energyKwh ?? 0), 0) * rangeFactor;
    const alerts = floor.rooms.reduce((a, r) => a + r.alertCount, 0);
    return { power, energy, alerts };
  }, [floor, rangeFactor]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Building Visualization</h1>
          <p className="mt-1 text-sm text-muted">
            Demo data only — not real sensor readings. Last update: {new Date().toLocaleTimeString()}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={building.id}
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
            aria-label="Building selector"
            disabled
          >
            <option value={building.id}>{building.name}</option>
          </select>
          <select
            value={floorId}
            onChange={(e) => { setLoading(true); setFloorId(e.target.value); setSelectedRoomId(null); setSelectedApplianceId(null); setTimeout(() => setLoading(false), 200); }}
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
            aria-label="Floor selector"
          >
            {building.floors.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
            aria-label="Time range"
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
        {/* Left panel */}
        <aside className="space-y-4">
          <Card title="Building overview" eyebrow="01 · Overview">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Site</dt><dd className="text-ink">{building.siteId}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Floors</dt><dd className="text-ink">{building.floors.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Rooms</dt><dd className="text-ink">{floor.rooms.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Power</dt><dd className="text-ink">{Math.round(totals.power)} W</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Energy today</dt><dd className="text-ink">{totals.energy.toFixed(2)} kWh</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Active alerts</dt><dd className="text-brand">{totals.alerts}</dd></div>
            </dl>
          </Card>

          <Card title="Floor navigation" eyebrow="02 · Floors">
            <ul className="space-y-1">
              {building.floors.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setFloorId(f.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${f.id === floorId ? "bg-brand/10 text-brand" : "text-muted hover:bg-page hover:text-ink"}`}
                  >
                    {f.name} <span className="text-xs">({f.rooms.length} rooms)</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Rooms" eyebrow="03 · List">
            {floor.rooms.length === 0 ? (
              <EmptyState title="No rooms" description="No rooms on this floor." />
            ) : (
              <ul className="space-y-1">
                {floor.rooms.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRoomId(r.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${r.id === selectedRoomId ? "bg-brand/10" : "hover:bg-page"}`}
                    >
                      <span className="text-ink">{r.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <span style={{ color: STATUS_COLOR[r.status] }} aria-hidden="true">●</span>
                        {STATUS_META[r.status].label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Active alerts" eyebrow="04 · Alerts">
            {!alertsAvailable ? (
              <p className="text-sm text-muted">Alert service unavailable.</p>
            ) : alerts.filter((a) => a.resolution_status === "open").length === 0 ? (
              <p className="text-sm text-muted">No active alerts.</p>
            ) : (
              <ul className="space-y-1">
                {alerts.filter((a) => a.resolution_status === "open").map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => { if (a.roomId) setSelectedRoomId(a.roomId); }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-page">
                      <div className="flex items-center justify-between">
                        <span className="text-ink">{a.severity}</span>
                        <span className="text-xs text-muted">{new Date(a.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{a.description}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{a.level} · {a.resolution_status}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>

        {/* Center */}
        <section className="space-y-4">
          {loading ? (
            <div className="py-12"><Spinner label="Loading floor" /></div>
          ) : (
            <Card title={floor.name} eyebrow="05 · Floor plan">
              <BlueprintViewer
                blueprintUrl={floor.blueprintUrl}
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                drawing={false}
                draftPoints={[]}
                onSelectRoom={setSelectedRoomId}
                onCanvasClick={() => {}}
                onCanvasDoubleClick={() => {}}
                onFinishDraw={() => {}}
                onCancelDraw={() => {}}
              />
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <span key={k} className="flex items-center gap-1">
                    <span style={{ color: v.color }} aria-hidden="true">{v.icon}</span> {v.label}
                  </span>
                ))}
              </div>
            </Card>
          )}
          <Card title="Consumption by room" eyebrow="06 · Chart">
            <RoomEnergyChart rooms={floor.rooms} />
          </Card>
        </section>

        {/* Right panel */}
        <aside className="space-y-4">
          {selectedRoom ? (
            <>
              <Card title={selectedRoom.name} eyebrow="06 · Room details">
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Type</dt><dd className="text-ink">{selectedRoom.type}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Status</dt><dd className="text-ink">{STATUS_META[selectedRoom.status].label}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Current power</dt><dd className="text-ink">{selectedRoom.powerW != null ? `${Math.round(selectedRoom.powerW)} W` : "No data"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Energy today</dt><dd className="text-ink">{selectedRoom.energyKwh != null ? `${selectedRoom.energyKwh.toFixed(2)} kWh` : "No data"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Expected</dt><dd className="text-ink">{selectedRoom.expectedKwh != null ? `${selectedRoom.expectedKwh.toFixed(2)} kWh` : "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Meter</dt><dd className="text-ink">{selectedRoom.hasMeter ? "Yes" : "No"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Circuit</dt><dd className="text-ink">{selectedRoom.hasCircuit ? "Yes" : "No"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Alerts</dt><dd className="text-brand">{selectedRoom.alertCount}</dd></div>
                </dl>
              </Card>
              <Card title="Appliances" eyebrow="07 · Appliances">
                <ApplianceManager
                  appliances={appliancesByRoom[selectedRoom.id] || []}
                  onAdd={(a) => setAppliancesByRoom((prev) => ({ ...prev, [selectedRoom.id]: [...(prev[selectedRoom.id] || []), a] }))}
                  onRemove={(id) => setAppliancesByRoom((prev) => ({ ...prev, [selectedRoom.id]: (prev[selectedRoom.id] || []).filter((a) => a.id !== id) }))}
                  onEdit={(a) => setAppliancesByRoom((prev) => ({ ...prev, [selectedRoom.id]: (prev[selectedRoom.id] || []).map((x) => (x.id === a.id ? a : x)) }))}
                  onSelect={setSelectedApplianceId}
                />
                {selectedRoom.powerW != null ? <p className="mt-2 text-[10px] text-muted">Room-level reading shown separately from rated power. Appliance consumption shown only when individually monitored.</p> : null}
              </Card>

              {selectedApplianceId ? (() => {
                const a = (appliancesByRoom[selectedRoom.id] || []).find((x) => x.id === selectedApplianceId);
                if (!a) return null;
                return (
                  <Card title={a.name} eyebrow="08 · Appliance details">
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between"><dt className="text-muted">Type</dt><dd className="text-ink">{a.type}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted">Rated power</dt><dd className="text-ink">{a.ratedPowerW != null ? `${a.ratedPowerW} W` : "—"}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted">Measured power</dt><dd className="text-ink">{a.powerW != null ? `${Math.round(a.powerW)} W` : "No data (not individually monitored)"}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted">Energy</dt><dd className="text-ink">{a.energyKwh != null ? `${a.energyKwh.toFixed(2)} kWh` : "—"}</dd></div>
                    </dl>
                    <p className="mt-2 text-[10px] text-muted">Source/confidence identified by monitoring method. Rated power is not measured consumption.</p>
                  </Card>
                );
              })() : null}
            </>
          ) : (
            <Card title="Room details" eyebrow="06 · Details">
              <EmptyState title="No room selected" description="Click a room on the floor plan to view details." />
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
