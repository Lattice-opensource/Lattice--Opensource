import { useCallback, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import type { Building, Circuit, Floor, Room } from "@lattice/contracts";
import type { Report } from "../data/api/energyApi";
import { getEnergyApi } from "../data/getEnergyApi";
import { config } from "../config/env";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

import { Spinner } from "../components/ui/Spinner";

export function ReportsPage() {
  const [siteId, setSiteId] = useState("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [circuitId, setCircuitId] = useState("");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compare, setCompare] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const api = getEnergyApi();
      const overview = await api.getSiteOverview?.();
      if (overview) {
        setSiteId(overview.siteId);
        const bs = await api.getBuildings?.(overview.siteId);
        if (bs) setBuildings(bs);
      }
    })().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  useEffect(() => {
    if (!buildingId) { setFloors([]); setFloorId(""); return; }
    (async () => {
      const api = getEnergyApi();
      const fs = await api.getFloors?.(buildingId);
      if (fs) setFloors(fs);
    })().catch(() => {});
  }, [buildingId]);

  useEffect(() => {
    if (!floorId) { setRooms([]); setRoomId(""); return; }
    (async () => {
      const api = getEnergyApi();
      const rs = await api.getRooms?.({ floorId });
      if (rs) setRooms(rs);
    })().catch(() => {});
  }, [floorId]);

  useEffect(() => {
    if (!roomId) { setCircuits([]); setCircuitId(""); return; }
    (async () => {
      const api = getEnergyApi();
      const cs = await api.getCircuits?.({ roomId });
      if (cs) setCircuits(cs);
    })().catch(() => {});
  }, [roomId]);

  const generate = useCallback(async () => {
    const api = getEnergyApi();
    if (!api.getReport) { setError("Reports unavailable from this provider."); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await api.getReport({
        siteId: siteId || undefined,
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
        roomId: roomId || undefined,
        circuitId: circuitId || undefined,
        period,
        from: period === "custom" ? from : undefined,
        to: period === "custom" ? to : undefined,
        compare,
      });
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [siteId, buildingId, floorId, roomId, circuitId, period, from, to, compare]);

  async function downloadCsv() {
    if (!siteId) return;
    const params = new URLSearchParams();
    if (siteId) params.set("siteId", siteId);
    if (buildingId) params.set("buildingId", buildingId);
    if (floorId) params.set("floorId", floorId);
    if (roomId) params.set("roomId", roomId);
    if (circuitId) params.set("circuitId", circuitId);
    params.set("period", period);
    if (period === "custom") { if (from) params.set("from", from); if (to) params.set("to", to); }
    const res = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}/api/reports/export?${params.toString()}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lattice-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Lattice Energy Report", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, 26);
    doc.text(`Period: ${report.period.type} (${new Date(report.period.from).toLocaleString()} - ${new Date(report.period.to).toLocaleString()})`, 14, 32);
    doc.text(`Scope: site ${report.scope.siteId ?? "—"}, building ${report.scope.buildingId ?? "—"}, floor ${report.scope.floorId ?? "—"}, space ${report.scope.roomId ?? "—"}, circuit ${report.scope.circuitId ?? "—"}`, 14, 38);
    let y = 48;
    doc.setFontSize(12);
    doc.text("Energy overview", 14, y); y += 6;
    doc.setFontSize(10);
    const rows = [
      ["Total energy (kWh)", report.summary.energyKwh.toFixed(2)],
      ["Estimated cost (INR)", report.summary.costInr.toFixed(2)],
      ["Average power (W)", report.summary.averagePowerW.toFixed(0)],
      ["Peak power (W)", report.summary.peakPowerW.toFixed(0)],
      ["Monitored devices", String(report.summary.deviceCount)],
      ["Reading availability", `${Math.round(report.summary.readingAvailability * 100)}%`],
      ["Simulated readings", String(report.summary.simulatedReadings)],
      ["Real readings", String(report.summary.realReadings)],
    ];
    for (const [k, v] of rows) { doc.text(`${k}: ${v}`, 14, y); y += 5; }
    y += 4;
    doc.setFontSize(12);
    doc.text("Alerts overview", 14, y); y += 6;
    doc.setFontSize(10);
    doc.text(`Total: ${report.alerts.total} (high ${report.alerts.bySeverity.high}, medium ${report.alerts.bySeverity.medium}, low ${report.alerts.bySeverity.low})`, 14, y); y += 5;
    doc.text(`Unresolved: ${report.alerts.unresolved}`, 14, y); y += 8;
    doc.setFontSize(9);
    doc.text("Values are based on stored readings. Estimated costs use the configured tariff.", 14, y);
    doc.save("lattice-report.pdf");
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-muted">Generate energy reports for a site, building, floor, space, or circuit.</p>
      </header>

      <Card title="Report configuration">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-muted">Building
            <select value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setFloorId(""); setRoomId(""); setCircuitId(""); }} className="mt-1 w-full rounded border border-line bg-page px-2 py-1 text-sm text-ink">
              <option value="">All buildings</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">Floor
            <select value={floorId} onChange={(e) => { setFloorId(e.target.value); setRoomId(""); setCircuitId(""); }} className="mt-1 w-full rounded border border-line bg-page px-2 py-1 text-sm text-ink">
              <option value="">All floors</option>
              {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">Space
            <select value={roomId} onChange={(e) => { setRoomId(e.target.value); setCircuitId(""); }} className="mt-1 w-full rounded border border-line bg-page px-2 py-1 text-sm text-ink">
              <option value="">All spaces</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">Circuit
            <select value={circuitId} onChange={(e) => setCircuitId(e.target.value)} className="mt-1 w-full rounded border border-line bg-page px-2 py-1 text-sm text-ink">
              <option value="">All circuits</option>
              {circuits.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">Period
            <select value={period} onChange={(e) => setPeriod(e.target.value as "daily" | "weekly" | "monthly" | "custom")} className="mt-1 w-full rounded border border-line bg-page px-2 py-1 text-sm text-ink">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted">
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
            Compare with previous period
          </label>
        </div>
        {period === "custom" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-muted">From
              <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded border border-line bg-page px-2 py-1 text-sm text-ink" />
            </label>
            <label className="text-xs font-semibold text-muted">To
              <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded border border-line bg-page px-2 py-1 text-sm text-ink" />
            </label>
          </div>
        ) : null}
        <div className="mt-4">
          <button type="button" onClick={generate} disabled={loading} className="rounded-lg border border-line bg-page px-4 py-2 text-sm font-semibold text-ink hover:border-brand/40 disabled:opacity-50">
            {loading ? "Generating..." : "Generate report"}
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </Card>

      {loading ? <div className="py-10"><Spinner label="Generating report" /></div> : null}

      {report ? (
        <>
          <Card title="Energy overview">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-xs text-muted">Total energy</p><p className="text-xl font-bold text-ink">{report.summary.energyKwh.toFixed(2)} kWh</p></div>
              <div><p className="text-xs text-muted">Estimated cost</p><p className="text-xl font-bold text-ink">₹{report.summary.costInr.toFixed(0)}</p></div>
              <div><p className="text-xs text-muted">Average power</p><p className="text-xl font-bold text-ink">{report.summary.averagePowerW.toFixed(0)} W</p></div>
              <div><p className="text-xs text-muted">Peak power</p><p className="text-xl font-bold text-ink">{report.summary.peakPowerW.toFixed(0)} W</p></div>
              <div><p className="text-xs text-muted">Monitored devices</p><p className="text-xl font-bold text-ink">{report.summary.deviceCount}</p></div>
              <div><p className="text-xs text-muted">Reading availability</p><p className="text-xl font-bold text-ink">{Math.round(report.summary.readingAvailability * 100)}%</p></div>
              <div><p className="text-xs text-muted">Simulated readings</p><p className="text-xl font-bold text-ink">{report.summary.simulatedReadings}</p></div>
              <div><p className="text-xs text-muted">Real readings</p><p className="text-xl font-bold text-ink">{report.summary.realReadings}</p></div>
            </div>
            {report.comparison ? (
              <p className="mt-3 text-xs text-muted">
                Compared with previous period: energy {report.comparison.energyChangeKwh >= 0 ? "+" : ""}{report.comparison.energyChangeKwh.toFixed(2)} kWh
                {report.comparison.energyChangePercent !== null ? ` (${report.comparison.energyChangePercent >= 0 ? "+" : ""}${report.comparison.energyChangePercent.toFixed(1)}%)` : ""};
                cost {report.comparison.costChangeInr >= 0 ? "+" : ""}₹{report.comparison.costChangeInr.toFixed(0)}.
              </p>
            ) : null}
          </Card>

          <Card title="Consumption over time">
            <p className="text-xs text-muted">{report.series.length} buckets from {new Date(report.period.from).toLocaleString()} to {new Date(report.period.to).toLocaleString()}</p>
          </Card>

          <Card title="Highest-consuming devices">
            {report.byDevice.length === 0 ? <EmptyState title="No device data" description="No readings available for this period." /> : (
              <ul className="space-y-2">
                {report.byDevice.slice().sort((a, b) => b.energyKwh - a.energyKwh).slice(0, 10).map((d) => (
                  <li key={d.deviceId} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{d.deviceName}</span>
                    <span className="font-semibold text-ink">{d.energyKwh.toFixed(2)} kWh · ₹{d.costInr.toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Spaces in scope">
            {report.bySpace.length === 0 ? <EmptyState title="No space data" description="No room-level data available." /> : (
              <ul className="space-y-2">
                {report.bySpace.slice().sort((a, b) => b.energyKwh - a.energyKwh).map((r) => (
                  <li key={r.roomId} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{r.roomName}</span>
                    <span className="font-semibold text-ink">{r.energyKwh.toFixed(2)} kWh · ₹{r.costInr.toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Alerts overview">
            <p className="text-sm text-ink">Total alerts: {report.alerts.total} (high {report.alerts.bySeverity.high}, medium {report.alerts.bySeverity.medium}, low {report.alerts.bySeverity.low})</p>
            <p className="text-sm text-ink">Unresolved: {report.alerts.unresolved}</p>
          </Card>

          <Card title="Export">
            <div className="flex gap-2">
              <button type="button" onClick={downloadCsv} className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/40">Download CSV</button>
              <button type="button" onClick={downloadPdf} className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/40">Download PDF</button>
            </div>
            <p className="mt-2 text-xs text-muted">CSV contains underlying bucketed energy data. PDF is a management-ready summary.</p>
          </Card>
        </>
      ) : null}
    </div>
  );
}