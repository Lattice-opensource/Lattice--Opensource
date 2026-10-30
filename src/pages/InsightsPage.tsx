import { useState, useEffect } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import type { SiteOverview } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";

type Severity = "critical" | "warning" | "info" | "success";

interface Fix { id: string; label: string; saving: number; }

interface Recommendation {
  id: string;
  severity: Severity;
  title: string;
  subject: string;
  detail: string;
  impact: string;
  fixes: Fix[];
  usage: { powerW: number; energyKwh: number; sharePct: number; costInr: number };
  spark: number[];
}

const severityStyles: Record<Severity, { bar: string; chip: string; soft: string; text: string }> = {
  critical: { bar: "bg-red-500", chip: "bg-red-100 text-red-800 ring-red-200", soft: "bg-red-50", text: "text-red-900" },
  warning: { bar: "bg-amber-500", chip: "bg-amber-100 text-amber-800 ring-amber-200", soft: "bg-amber-50", text: "text-amber-900" },
  info: { bar: "bg-sky-500", chip: "bg-sky-100 text-sky-800 ring-sky-200", soft: "bg-sky-50", text: "text-sky-900" },
  success: { bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800 ring-emerald-200", soft: "bg-emerald-50", text: "text-emerald-900" },
};

const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Insight",
  success: "Good",
};

function spark(seed: number, base: number, amp: number, n = 24): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(Math.max(2, base + Math.sin(i * 0.5 + seed) * amp + Math.sin(i * 1.7 + seed * 2) * (amp * 0.35)));
  }
  return out;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 120, H = 32, pad = 2;
  const max = Math.max(...data, 1);
  const step = (W - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
  const line = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="block">
      <path d={`${line} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`} fill={color} opacity="0.15" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InsightsPage() {
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; data?: SiteOverview; message?: string }>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const api = getEnergyApi();
    api.getSiteOverview?.().then((overview) => {
      if (!active) return;
      if (!overview) { setState({ status: "error", message: "Data provider does not support site overview." }); return; }
      setState({ status: "ready", data: overview });
    }).catch((e) => {
      if (!active) return;
      setState({ status: "error", message: String(e) });
    });
    return () => { active = false; };
  }, []);

  const [fixed, setFixed] = useState<Record<string, string[]>>({});
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (state.status === "loading") {
    return <div className="py-16"><Spinner label="Loading insights" /></div>;
  }
  if (state.status === "error") {
    return <div className="py-8"><ErrorState message={state.message ?? "err"} onRetry={() => window.location.reload()} /></div>;
  }

  const overview = state.data!;
  const { wholeSite, devices, rooms } = overview;
  const totalEnergy = wholeSite.energyKwh || 1;
  const top = [...devices].filter((d) => d.roomName !== null).sort((a, b) => b.energyKwh - a.energyKwh)[0];

  const recs: Recommendation[] = [];

  if (top && top.energyKwh / totalEnergy > 0.25) {
    recs.push({
      id: "top-consumer",
      severity: top.energyKwh / totalEnergy > 0.4 ? "critical" : "warning",
      title: `${top.name} dominates consumption`,
      subject: `${top.name} · ${top.roomName}`,
      detail: `${top.name} accounts for ${((top.energyKwh / totalEnergy) * 100).toFixed(1)}% of monitored building energy (${top.energyKwh.toFixed(1)} kWh today).`,
      impact: "High concentration increases peak demand charges and reduces efficiency.",
      usage: { powerW: top.powerW, energyKwh: top.energyKwh, sharePct: (top.energyKwh / totalEnergy) * 100, costInr: top.costInr },
      fixes: [
        { id: "f1", label: "Stagger its schedule across off-peak hours", saving: Math.round(top.costInr * 0.18) },
        { id: "f2", label: "Add variable-speed / soft-start control", saving: Math.round(top.costInr * 0.12) },
        { id: "f3", label: "Split load across multiple smaller units", saving: Math.round(top.costInr * 0.09) },
      ],
      spark: spark(1, 60, 20),
    });
  }

  if (overview.peak.powerW > overview.averagePowerW * 1.5 && overview.averagePowerW > 0) {
    recs.push({
      id: "peak-spike",
      severity: "warning",
      title: "Peak demand spikes detected",
      subject: "Whole building",
      detail: `Peak ${Math.round(overview.peak.powerW)} W vs average ${Math.round(overview.averagePowerW)} W (${((overview.peak.powerW / overview.averagePowerW - 1) * 100).toFixed(0)}% higher)${overview.peak.at ? ` at ${new Date(overview.peak.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}.`,
      impact: "Demand spikes can trigger higher tariffs and stress equipment.",
      usage: { powerW: overview.peak.powerW, energyKwh: wholeSite.energyKwh, sharePct: 100, costInr: wholeSite.costInr },
      fixes: [
        { id: "f1", label: "Stagger equipment start times", saving: Math.round(wholeSite.costInr * 0.06) },
        { id: "f2", label: "Enable soft starters for large motors", saving: Math.round(wholeSite.costInr * 0.04) },
      ],
      spark: spark(4, 50, 25),
    });
  }

  const offline = devices.filter((d) => d.status !== "online");
  if (offline.length > 0) {
    recs.push({
      id: "offline",
      severity: "critical",
      title: `${offline.length} equipment offline`,
      subject: offline.map((d) => d.name).join(", "),
      detail: offline.map((d) => d.name).join(", "),
      impact: "Blind spots reduce monitoring accuracy and can hide faults.",
      usage: { powerW: 0, energyKwh: 0, sharePct: 0, costInr: 0 },
      fixes: [
        { id: "f1", label: "Check power/network connectivity", saving: 0 },
        { id: "f2", label: "Restart data gateways", saving: 0 },
      ],
      spark: spark(9, 8, 4),
    });
  }

  if (overview.deviceCount > 0 && overview.onlineDeviceCount < overview.deviceCount) {
    recs.push({
      id: "coverage",
      severity: "warning",
      title: "Incomplete equipment coverage",
      subject: "Building metering",
      detail: `${overview.onlineDeviceCount} of ${overview.deviceCount} equipment reporting.`,
      impact: "Unmonitored load cannot be optimized.",
      usage: { powerW: wholeSite.powerW, energyKwh: wholeSite.energyKwh, sharePct: (overview.onlineDeviceCount / overview.deviceCount) * 100, costInr: wholeSite.costInr },
      fixes: [
        { id: "f1", label: "Commission missing sensors on unmonitored panels", saving: Math.round(wholeSite.costInr * 0.05) },
        { id: "f2", label: "Add sub-meters on major utilities", saving: Math.round(wholeSite.costInr * 0.03) },
      ],
      spark: spark(14, 40, 12),
    });
  }

  const serverRoom = rooms.find((r) => r.roomName.toLowerCase().includes("server"));
  if (serverRoom && serverRoom.powerW > 10000) {
    recs.push({
      id: "server-baseload",
      severity: "info",
      title: "Continuous server-room baseload",
      subject: serverRoom.roomName,
      detail: `${serverRoom.roomName} draws ${Math.round(serverRoom.powerW)} W continuously (${serverRoom.energyKwh.toFixed(1)} kWh today).`,
      impact: "24/7 load dominates off-hours consumption.",
      usage: { powerW: serverRoom.powerW, energyKwh: serverRoom.energyKwh, sharePct: (serverRoom.energyKwh / totalEnergy) * 100, costInr: serverRoom.costInr },
      fixes: [
        { id: "f1", label: "Raise cooling setpoints 2°C", saving: Math.round(serverRoom.costInr * 0.15) },
        { id: "f2", label: "Seal hot/cold aisles", saving: Math.round(serverRoom.costInr * 0.08) },
        { id: "f3", label: "Review UPS efficiency", saving: Math.round(serverRoom.costInr * 0.06) },
      ],
      spark: spark(20, 52, 6),
    });
  }

  const lighting = devices.filter((d) => d.category === "lighting");
  const lightingPower = lighting.reduce((s, d) => s + d.powerW, 0);
  if (lightingPower > 2000) {
    recs.push({
      id: "lighting",
      severity: "warning",
      title: "High lighting load",
      subject: "Lighting panels",
      detail: `Lighting panels draw ${Math.round(lightingPower)} W right now.`,
      impact: "Lighting is a quick win for savings.",
      usage: { powerW: lightingPower, energyKwh: lighting.reduce((s, d) => s + d.energyKwh, 0), sharePct: (lighting.reduce((s, d) => s + d.energyKwh, 0) / totalEnergy) * 100, costInr: lighting.reduce((s, d) => s + d.costInr, 0) },
      fixes: [
        { id: "f1", label: "Install occupancy/daylight sensors", saving: Math.round(lighting.reduce((s, d) => s + d.costInr, 0) * 0.2) },
        { id: "f2", label: "LED retrofits on remaining fixtures", saving: Math.round(lighting.reduce((s, d) => s + d.costInr, 0) * 0.3) },
      ],
      spark: spark(26, 30, 8),
    });
  }

  const elevators = devices.filter((d) => d.name.toLowerCase().includes("elevator"));
  if (elevators.length > 0 && elevators[0].powerW > 5000) {
    recs.push({
      id: "elevators",
      severity: "info",
      title: "Elevator bank high usage",
      subject: "Elevator bank",
      detail: `Elevator bank draws ${Math.round(elevators[0].powerW)} W.`,
      impact: "Traffic patterns drive peak demand.",
      usage: { powerW: elevators[0].powerW, energyKwh: elevators[0].energyKwh, sharePct: (elevators[0].energyKwh / totalEnergy) * 100, costInr: elevators[0].costInr },
      fixes: [
        { id: "f1", label: "Enable standby mode during off-hours", saving: Math.round(elevators[0].costInr * 0.12) },
        { id: "f2", label: "Optimize dispatch algorithms", saving: Math.round(elevators[0].costInr * 0.06) },
      ],
      spark: spark(31, 40, 12),
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "healthy",
      severity: "success",
      title: "Building operating efficiently",
      subject: "Whole building",
      detail: "No major anomalies detected in the current window.",
      impact: "Consumption is balanced across zones.",
      usage: { powerW: wholeSite.powerW, energyKwh: wholeSite.energyKwh, sharePct: 100, costInr: wholeSite.costInr },
      fixes: [],
      spark: spark(36, 50, 5),
    });
  }

  const live = recs.filter((r) => !dismissed.includes(r.id));
  const criticalCount = live.filter((r) => r.severity === "critical").length;
  const warningCount = live.filter((r) => r.severity === "warning").length;
  const totalRecoverable = live.reduce((s, r) => {
    const done = fixed[r.id] ?? [];
    return s + r.fixes.filter((f) => !done.includes(f.id)).reduce((t, f) => t + f.saving, 0);
  }, 0);

  const toggleFix = (recId: string, fixId: string) => {
    setFixed((prev) => {
      const cur = prev[recId] ?? [];
      return { ...prev, [recId]: cur.includes(fixId) ? cur.filter((x) => x !== fixId) : [...cur, fixId] };
    });
  };

  const currencySymbol = overview.currency === "INR" ? "₹" : "";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Insights & actions</h1>
          <p className="mt-1 text-sm text-muted">
            {live.length} recommendations · {criticalCount} critical · {warningCount} warnings
            {totalRecoverable > 0 ? ` · ₹${totalRecoverable.toLocaleString()} / mo recoverable` : ""}
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-xs font-semibold uppercase tracking-wide text-muted">Total power</p><p className="mt-1 text-2xl font-bold text-ink">{Math.round(wholeSite.powerW)} W</p></Card>
        <Card><p className="text-xs font-semibold uppercase tracking-wide text-muted">Total energy today</p><p className="mt-1 text-2xl font-bold text-ink">{wholeSite.energyKwh.toFixed(1)} kWh</p></Card>
        <Card><p className="text-xs font-semibold uppercase tracking-wide text-muted">Peak / avg</p><p className="mt-1 text-2xl font-bold text-ink">{Math.round(overview.peak.powerW)} / {Math.round(overview.averagePowerW)} W</p></Card>
        <Card><p className="text-xs font-semibold uppercase tracking-wide text-muted">Equipment online</p><p className="mt-1 text-2xl font-bold text-ink">{overview.onlineDeviceCount}/{overview.deviceCount}</p></Card>
      </div>

      {totalRecoverable > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ok">Potential savings if you act</p>
            <p className="mt-1 text-2xl font-bold text-ink">{currencySymbol}{totalRecoverable.toLocaleString()}<span className="text-sm font-semibold text-muted"> / month</span></p>
          </div>
          <p className="text-xs text-ink/70 max-w-sm">Across {live.filter((r) => r.fixes.length > 0).length} open flags. Tick the fixes you'll apply to track progress.</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {live.map((rec) => {
          const s = severityStyles[rec.severity];
          const done = fixed[rec.id] ?? [];
          const left = rec.fixes.filter((f) => !done.includes(f.id)).reduce((t, f) => t + f.saving, 0);
          return (
            <div key={rec.id} className={`overflow-hidden rounded-2xl border shadow-sm ${s.soft} border-line`}>
              <div className={`h-1.5 w-full ${s.bar}`} />
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${s.chip}`}>{severityLabel[rec.severity]}</span>
                    <h2 className="mt-2 text-base font-semibold text-ink">{rec.title}</h2>
                    <p className="text-xs text-muted">{rec.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${s.text}`}>{rec.usage.sharePct.toFixed(1)}%</p>
                    <p className="text-[10px] text-muted">of building load</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink/80">{rec.detail}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-line bg-card px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Power</p><p className="mt-0.5 text-sm font-bold text-ink">{Math.round(rec.usage.powerW)} W</p></div>
                  <div className="rounded-xl border border-line bg-card px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Energy</p><p className="mt-0.5 text-sm font-bold text-ink">{rec.usage.energyKwh.toFixed(1)} kWh</p></div>
                  <div className="rounded-xl border border-line bg-card px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Cost</p><p className="mt-0.5 text-sm font-bold text-ink">{currencySymbol}{Math.round(rec.usage.costInr).toLocaleString()}</p></div>
                  <div className="rounded-xl border border-line bg-card px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Impact</p><p className="mt-0.5 text-xs text-ink/80 line-clamp-2">{rec.impact}</p></div>
                </div>
                <div className="mt-3 flex gap-3 items-start">
                  <div className="flex-1"><p className="text-xs text-ink/70">{rec.impact}</p></div>
                  <div className="w-28 shrink-0 rounded-lg border border-line bg-card p-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted mb-1">Shape</p>
                    <Sparkline data={rec.spark} color={s.bar.includes("red") ? "#ef4444" : s.bar.includes("amber") ? "#f59e0b" : s.bar.includes("sky") ? "#0ea5e9" : s.bar.includes("emerald") ? "#10b981" : "#6b7280"} />
                  </div>
                </div>
                {rec.fixes.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-line bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fixes needed · {rec.fixes.length}</p>
                      {left > 0 ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-ok ring-1 ring-emerald-200">₹{left.toLocaleString()}/mo left</span> : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-ok ring-1 ring-emerald-200">All fixes applied</span>}
                    </div>
                    <div className="space-y-1.5">
                      {rec.fixes.map((f) => {
                        const isDone = done.includes(f.id);
                        return (
                          <button key={f.id} type="button" onClick={() => toggleFix(rec.id, f.id)}
                            className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition ${isDone ? "border-emerald-200 bg-emerald-50" : "border-line bg-page hover:bg-card"}`}>
                            <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${isDone ? "border-ok bg-ok text-white" : "border-line bg-card"}`}>{isDone ? "✓" : ""}</span>
                            <span className={`flex-1 ${isDone ? "text-muted line-through" : "text-ink"}`}>{f.label}</span>
                            {f.saving > 0 ? <span className={`text-xs font-bold tabular-nums ${isDone ? "text-muted" : "text-ok"}`}>−₹{f.saving.toLocaleString()}/mo</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => setDismissed((d) => [...d, rec.id])} className="text-xs font-semibold text-muted hover:text-ink">Dismiss</button>
                </div>
              </div>
            </div>
          );
        })}

        {live.length === 0 ? (
          <Card><div className="py-8 text-center"><p className="text-base font-semibold text-ink">All clear</p><p className="mt-1 text-sm text-muted">No recommendations right now.</p><button type="button" onClick={() => setDismissed([])} className="mt-3 rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:bg-card">Reset</button></div></Card>
        ) : null}
      </div>

      <Card title="Zone breakdown" eyebrow="Details">
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li key={room.roomId} className="flex items-center justify-between text-sm">
              <span className="text-ink">{room.roomName}</span>
              <span className="tabular-nums text-muted">{Math.round(room.powerW)} W · {room.energyKwh.toFixed(1)} kWh · {room.deviceCount} equip</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
