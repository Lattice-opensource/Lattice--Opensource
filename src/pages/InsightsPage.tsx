import { useCallback } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import type { SiteOverview } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";

type Severity = "critical" | "warning" | "info" | "success";

interface Recommendation {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  impact: string;
  fix: string;
}

const severityStyles: Record<Severity, string> = {
  critical: "border-red-300 bg-red-50 text-red-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  info: "border-sky-300 bg-sky-50 text-sky-900",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
};

const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Insight",
  success: "Good",
};

export function InsightsPage() {
  const loader = useCallback(async (): Promise<SiteOverview> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    return overview;
  }, []);

  const { state, reload } = useApiResource<SiteOverview>(loader, 15000);

  if (state.status === "loading") {
    return (
      <div className="py-16">
        <Spinner label="Loading insights" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="py-8">
        <ErrorState message={state.message} onRetry={reload} />
      </div>
    );
  }

  const overview = state.data;
  const { wholeSite, devices, rooms } = overview;
  const totalEnergy = wholeSite.energyKwh || 1;
  const top = [...devices]
    .filter((d) => d.roomName !== null)
    .sort((a, b) => b.energyKwh - a.energyKwh)[0];

  const recs: Recommendation[] = [];

  // Top consumer concentration
  if (top && top.energyKwh / totalEnergy > 0.35) {
    recs.push({
      id: "top-consumer",
      severity: "critical",
      title: `${top.name} dominates consumption`,
      detail: `${top.name} accounts for ${((top.energyKwh / totalEnergy) * 100).toFixed(1)}% of monitored building energy (${top.energyKwh.toFixed(1)} kWh).`,
      impact: "High concentration increases peak demand charges and reduces efficiency.",
      fix: "Stagger its schedule, add variable-speed control, or split load across off-peak hours.",
    });
  }

  // Peak vs average
  if (overview.peak.powerW > overview.averagePowerW * 1.6 && overview.averagePowerW > 0) {
    recs.push({
      id: "peak-spike",
      severity: "warning",
      title: "Peak demand spikes detected",
      detail: `Peak ${Math.round(overview.peak.powerW)} W vs average ${Math.round(overview.averagePowerW)} W (${((overview.peak.powerW / overview.averagePowerW - 1) * 100).toFixed(0)}% higher).`,
      impact: "Demand spikes can trigger higher tariffs and stress equipment.",
      fix: "Stagger equipment start times and enable soft starters for large motors.",
    });
  }

  // Offline devices
  const offline = devices.filter((d) => d.status !== "online");
  if (offline.length > 0) {
    recs.push({
      id: "offline",
      severity: "critical",
      title: `${offline.length} equipment offline`,
      detail: offline.map((d) => d.name).join(", "),
      impact: "Blind spots reduce monitoring accuracy and can hide faults.",
      fix: "Check power/network connectivity and restart data gateways.",
    });
  }

  // Coverage
  if (overview.deviceCount > 0 && overview.onlineDeviceCount < overview.deviceCount) {
    recs.push({
      id: "coverage",
      severity: "warning",
      title: "Incomplete equipment coverage",
      detail: `${overview.onlineDeviceCount} of ${overview.deviceCount} equipment reporting.`,
      impact: "Unmonitored load cannot be optimized.",
      fix: "Commission missing sensors on unmonitored panels and utilities.",
    });
  }

  // Server room baseload
  const serverRoom = rooms.find((r) => r.roomName.toLowerCase().includes("server"));
  if (serverRoom && serverRoom.powerW > 10000) {
    recs.push({
      id: "server-baseload",
      severity: "info",
      title: "Continuous server-room baseload",
      detail: `${serverRoom.roomName} draws ${Math.round(serverRoom.powerW)} W continuously.`,
      impact: "24/7 load dominates off-hours consumption.",
      fix: "Raise cooling setpoints, seal hot/cold aisles, and review UPS efficiency.",
    });
  }

  // Lighting off-hours
  const lighting = devices.filter((d) => d.category === "lighting");
  const lightingPower = lighting.reduce((s, d) => s + d.powerW, 0);
  if (lightingPower > 2000) {
    recs.push({
      id: "lighting",
      severity: "warning",
      title: "High lighting load",
      detail: `Lighting panels draw ${Math.round(lightingPower)} W right now.`,
      impact: "Lighting is a quick win for savings.",
      fix: "Install occupancy/daylight sensors and LED retrofits.",
    });
  }

  // Elevators
  const elevators = devices.filter((d) => d.name.toLowerCase().includes("elevator"));
  if (elevators.length > 0 && elevators[0].powerW > 5000) {
    recs.push({
      id: "elevators",
      severity: "info",
      title: "Elevator bank high usage",
      detail: `Elevator bank draws ${Math.round(elevators[0].powerW)} W.`,
      impact: "Traffic patterns drive peak demand.",
      fix: "Enable standby mode and optimize dispatch algorithms.",
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "healthy",
      severity: "success",
      title: "Building operating efficiently",
      detail: "No major anomalies detected in the current window.",
      impact: "Consumption is balanced across zones.",
      fix: "Continue monitoring and maintain preventive maintenance schedule.",
    });
  }

  const criticalCount = recs.filter((r) => r.severity === "critical").length;
  const warningCount = recs.filter((r) => r.severity === "warning").length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Insights & actions</h1>
        <p className="mt-1 text-sm text-muted">
          {recs.length} recommendations · {criticalCount} critical · {warningCount} warnings
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total power</p>
          <p className="mt-1 text-2xl font-bold text-ink">{Math.round(wholeSite.powerW)} W</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total energy today</p>
          <p className="mt-1 text-2xl font-bold text-ink">{wholeSite.energyKwh.toFixed(1)} kWh</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Peak / avg</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {Math.round(overview.peak.powerW)} / {Math.round(overview.averagePowerW)} W
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Equipment online</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {overview.onlineDeviceCount}/{overview.deviceCount}
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        {recs.map((rec) => (
          <div
            key={rec.id}
            className={`rounded-2xl border p-5 shadow-sm ${severityStyles[rec.severity]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  {severityLabel[rec.severity]}
                </span>
                <h2 className="mt-2 text-base font-semibold">{rec.title}</h2>
              </div>
            </div>
            <p className="mt-2 text-sm">{rec.detail}</p>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <p>
                <span className="font-semibold">Impact:</span> {rec.impact}
              </p>
              <p>
                <span className="font-semibold">Recommended fix:</span> {rec.fix}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Card title="Zone breakdown" eyebrow="Details">
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li key={room.roomId} className="flex items-center justify-between text-sm">
              <span className="text-ink">{room.roomName}</span>
              <span className="tabular-nums text-muted">
                {Math.round(room.powerW)} W · {room.energyKwh.toFixed(1)} kWh · {room.deviceCount} equip
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}