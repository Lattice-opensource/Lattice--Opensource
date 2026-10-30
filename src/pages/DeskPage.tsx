import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Monitor, Lightbulb, Volume2, Cpu, RotateCcw, ChevronRight, TrendingUp, Sun, Plus, X } from "../components/ui/Icons";
import { useDesk, type DeskDevice, type DeskKind } from "../data/DeskContext";
import { Card } from "../components/ui/Card";

const KIND_META: Record<DeskKind, { label: string; accent: string; soft: string }> = {
  monitor: { label: "Monitor", accent: "#0ea5e9", soft: "rgba(14,165,233,0.12)" },
  light: { label: "Light", accent: "#f59e0b", soft: "rgba(245,158,11,0.12)" },
  speakers: { label: "Speakers", accent: "#8b5cf6", soft: "rgba(139,92,246,0.12)" },
  computer: { label: "Computer", accent: "#10b981", soft: "rgba(16,185,129,0.12)" },
};

function Box({ w, h, d, x = 0, y = 0, z = 0, colors = {}, children }: {
  w: number; h: number; d: number; x?: number; y?: number; z?: number;
  colors?: Record<string, string>; children?: React.ReactNode;
}) {
  const c = { front: "#3a3a44", back: "#2a2a32", left: "#31313a", right: "#31313a", top: "#4a4a55", bottom: "#202027", ...colors };
  const faces = [
    { s: { width: w, height: h, background: c.front }, t: `translateZ(${d / 2}px)` },
    { s: { width: w, height: h, background: c.back }, t: `translateZ(${-d / 2}px) rotateY(180deg)` },
    { s: { width: d, height: h, background: c.right }, t: `translateX(${w / 2}px) rotateY(90deg)` },
    { s: { width: d, height: h, background: c.left }, t: `translateX(${-w / 2}px) rotateY(-90deg)` },
    { s: { width: w, height: d, background: c.top }, t: `translateY(${-h / 2}px) rotateX(90deg)` },
    { s: { width: w, height: d, background: c.bottom }, t: `translateY(${h / 2}px) rotateX(-90deg)` },
  ];
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d", transform: `translate3d(${x}px, ${y}px, ${z}px)` }}>
      {faces.map((f, i) => (
        <div key={i} style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) ${f.t}`, ...f.s, border: "1px solid rgba(0,0,0,0.25)" }}>
          {i === 0 && children}
        </div>
      ))}
    </div>
  );
}

function usageSeries(device: DeskDevice): { hour: number; watts: number }[] {
  const hours: { hour: number; watts: number }[] = [];
  for (let h = 0; h < 24; h++) {
    let f = 0;
    if (device.kind === "light") f = h >= 8 && h <= 22 ? 0.5 + 0.3 * Math.sin((h - 15) * 0.4) : 0;
    else if (device.kind === "computer") f = h >= 9 && h <= 19 ? 0.55 + 0.3 * Math.sin((h - 13) * 0.5) : h >= 20 && h <= 23 ? 0.3 : 0;
    else if (device.kind === "speakers") f = h >= 10 && h <= 21 ? 0.4 : 0;
    else f = h >= 8 && h <= 20 ? 0.45 + 0.15 * Math.sin((h - 14) * 0.4) : 0;
    f = Math.max(0, f) * (device.status === "on" ? 1 : 0.06);
    hours.push({ hour: h, watts: Math.round(device.baseWatts * Math.max(0, f)) });
  }
  return hours;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 110, H = 32, pad = 2;
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

export function DeskPage() {
  const desk = useDesk();
  const [selected, setSelected] = useState<string>("dk-monitor");
  const [rot, setRot] = useState({ rx: -22, ry: -34 });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", kind: "computer" as DeskKind, watts: "" });
  const dragRef = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);

  const dev = desk.devices.find((d) => d.id === selected) ?? desk.devices[0];
  const meta = KIND_META[dev.kind];
  const series = useMemo(() => usageSeries(dev), [dev.id, dev.status, dev.baseWatts]);
  const peak = Math.max(...series.map((s) => s.watts), 1);
  const seriesKwh = useMemo(() => series.reduce((s, p) => s + p.watts, 0) / 1000, [series]);
  const pctOfDesk = dev ? Math.round((dev.currentWatts / Math.max(1, desk.totalWatts)) * 100) : 0;

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    const p = "touches" in e ? e.touches[0] : e;
    dragRef.current = { x: p.clientX, y: p.clientY, rx: rot.rx, ry: rot.ry };
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current) return;
    const p = "touches" in e ? e.touches[0] : e;
    const dx = p.clientX - dragRef.current.x;
    const dy = p.clientY - dragRef.current.y;
    setRot({
      rx: Math.max(-60, Math.min(6, dragRef.current.rx - dy * 0.4)),
      ry: dragRef.current.ry + dx * 0.5,
    });
  };
  const onUp = () => { dragRef.current = null; };

  const handleAdd = () => {
    if (!addForm.name.trim() || !Number(addForm.watts)) return;
    const d = desk.addDevice({ name: addForm.name, kind: addForm.kind, model: "Custom", baseWatts: Number(addForm.watts), status: "on" });
    setSelected(d.id);
    setAddForm({ name: "", kind: "computer", watts: "" });
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">My Desk</h1>
          <p className="mt-1 text-sm text-muted">
            A live 3D model of your workspace. Tap any device to control it and see exactly what it costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRot({ rx: -22, ry: -34 })}
            className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:bg-card"
          >
            <RotateCcw className="inline h-3.5 w-3.5 mr-1" /> Reset view
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            <Plus className="inline h-3.5 w-3.5 mr-1" /> Add device
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Desk live</p>
          <p className="mt-1 text-2xl font-bold text-ink">{desk.totalWatts} W</p>
          <p className="mt-1 text-xs text-muted">{desk.onCount} of {desk.devices.length} on</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Today</p>
          <p className="mt-1 text-2xl font-bold text-ink">{desk.totalTodayKwh.toFixed(2)} kWh</p>
          <p className="mt-1 text-xs text-muted">≈ ₹{Math.round(desk.totalTodayKwh * 8)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">This month</p>
          <p className="mt-1 text-2xl font-bold text-ink">₹{desk.totalMonthCost.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted">desk share of bill</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Peak draw</p>
          <p className="mt-1 text-2xl font-bold text-ink">{peak} W</p>
          <p className="mt-1 text-xs text-muted">selected · {dev.name}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card eyebrow="Workspace" title="Drag to rotate">
          <div
            className="relative select-none overflow-hidden rounded-xl bg-page"
            style={{ height: 420, cursor: dragRef.current ? "grabbing" : "grab" }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          >
            <div style={{ position: "absolute", inset: 0, perspective: "1100px", perspectiveOrigin: "50% 45%" }}>
              <div style={{ position: "absolute", left: "50%", top: "56%", transformStyle: "preserve-3d", transform: `translate(-50%,-50%) rotateX(${rot.rx}deg) rotateY(${rot.ry}deg)` }}>
                <Box w={440} h={18} d={210} y={0} colors={{ top: "#3f3f4a", front: "#33333d", right: "#2c2c35", left: "#2c2c35", bottom: "#23232b" }} />
                {[[-195, 90], [195, 90], [-195, -80], [195, -80]].map(([lx, lz], i) => (
                  <Box key={i} w={16} h={140} d={16} x={lx} y={79} z={lz} colors={{ top: "#2a2a32", front: "#24242c", right: "#1e1e25", left: "#1e1e25" }} />
                ))}
                <div style={{ position: "absolute", left: "50%", top: "50%", width: 470, height: 250, transform: "translate(-50%,-50%) translateY(150px) rotateX(90deg)", background: "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(6px)" }} />

                {/* Monitor */}
                <div onClick={(e) => { e.stopPropagation(); setSelected("dk-monitor"); }} style={{ position: "absolute", transformStyle: "preserve-3d", cursor: "pointer" }}>
                  <Box w={14} h={46} d={14} x={0} y={-32} z={-40} colors={{ top: "#2a2a32", front: "#24242c", right: "#1e1e25" }} />
                  <Box w={80} h={6} d={50} x={0} y={-12} z={-40} colors={{ top: "#2e2e37", front: "#24242c" }} />
                  <Box w={210} h={125} d={8} x={0} y={-100} z={-40} colors={{ top: "#3a3a44", front: dev.status === "on" ? "#0b1220" : "#15151b", right: "#26262f", left: "#26262f", bottom: "#202028" }}>
                    <div style={{ position: "absolute", inset: 5, borderRadius: 3, overflow: "hidden", background: dev.status === "on" ? `linear-gradient(160deg, rgba(14,165,233,${0.15 + (dev.brightness ?? 70) / 100 * 0.5}) 0%, rgba(56,189,248,${0.05 + (dev.brightness ?? 70) / 100 * 0.25}) 100%)` : "#0c0c11" }}>
                      {dev.status === "on" ? (
                        <>
                          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)" }} />
                          <div style={{ position: "absolute", left: 8, top: 8, right: 8, height: 4, borderRadius: 2, background: "rgba(125,211,252,0.6)" }} />
                          <div style={{ position: "absolute", left: 8, top: 18, width: "55%", height: 3, borderRadius: 2, background: "rgba(125,211,252,0.3)" }} />
                          <div style={{ position: "absolute", left: 8, top: 26, width: "40%", height: 3, borderRadius: 2, background: "rgba(125,211,252,0.3)" }} />
                        </>
                      ) : null}
                    </div>
                  </Box>
                </div>

                {/* Light bar */}
                <div onClick={(e) => { e.stopPropagation(); setSelected("dk-light"); }} style={{ position: "absolute", transformStyle: "preserve-3d", cursor: "pointer" }}>
                  <Box w={150} h={10} d={16} x={0} y={-172} z={-30} colors={{ top: "#3a3a44", front: dev.status === "on" ? "#fde68a" : "#2a2a32", right: "#26262f", left: "#26262f", bottom: "#22222a" }} />
                </div>

                {/* Speakers */}
                <div onClick={(e) => { e.stopPropagation(); setSelected("dk-speakers"); }} style={{ position: "absolute", transformStyle: "preserve-3d", cursor: "pointer" }}>
                  <Box w={30} h={54} d={30} x={-175} y={-36} z={-20} colors={{ top: "#34343e", front: dev.status === "on" ? "#2e2e3a" : "#24242c", right: "#24242c", left: "#1f1f26" }}>
                    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: dev.status === "on" ? "radial-gradient(circle, #a78bfa 0%, #4c1d95 80%)" : "#1a1a20", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </Box>
                  <Box w={30} h={54} d={30} x={175} y={-36} z={-20} colors={{ top: "#34343e", front: dev.status === "on" ? "#2e2e3a" : "#24242c", right: "#24242c", left: "#1f1f26" }}>
                    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: dev.status === "on" ? "radial-gradient(circle, #a78bfa 0%, #4c1d95 80%)" : "#1a1a20", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </Box>
                </div>

                {/* Computer */}
                <div onClick={(e) => { e.stopPropagation(); setSelected("dk-computer"); }} style={{ position: "absolute", transformStyle: "preserve-3d", cursor: "pointer" }}>
                  <Box w={60} h={130} d={150} x={150} y={82} z={20} colors={{ top: "#33333d", front: "#26262f", right: "#202028", left: "#202028" }}>
                    <div style={{ position: "absolute", inset: 6, borderRadius: 4, background: "#12121a", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      {dev.status === "on" ? (
                        <>
                          <div style={{ position: "absolute", left: "50%", top: 14, transform: "translateX(-50%)", width: 30, height: 30, borderRadius: "50%", background: "conic-gradient(from 0deg, #10b981, #065f46, #10b981)", animation: "spin 4s linear infinite", boxShadow: "0 0 10px rgba(16,185,129,0.7)" }} />
                          <div style={{ position: "absolute", left: "50%", top: 52, transform: "translateX(-50%)", width: 30, height: 30, borderRadius: "50%", background: "conic-gradient(from 90deg, #10b981, #065f46, #10b981)", animation: "spin 3s linear infinite", boxShadow: "0 0 10px rgba(16,185,129,0.7)" }} />
                          <div style={{ position: "absolute", left: "50%", bottom: 10, transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
                        </>
                      ) : null}
                    </div>
                  </Box>
                </div>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {desk.devices.map((d) => {
                const m = KIND_META[d.kind];
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelected(d.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      selected === d.id ? "border-brand bg-brand/10 text-brand" : "border-line bg-card text-muted hover:text-ink"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.status === "on" ? m.accent : "#9ca3af" }} />
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-2 text-xs text-muted">
            {Math.round(rot.ry)}° / {Math.round(rot.rx)}° · drag to rotate
          </p>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: meta.soft }}>
                {dev.kind === "monitor" ? <Monitor className="h-5 w-5" style={{ color: meta.accent }} /> :
                  dev.kind === "light" ? <Lightbulb className="h-5 w-5" style={{ color: meta.accent }} /> :
                  dev.kind === "speakers" ? <Volume2 className="h-5 w-5" style={{ color: meta.accent }} /> :
                  <Cpu className="h-5 w-5" style={{ color: meta.accent }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-ink">{dev.name}</p>
                <p className="text-xs text-muted">{dev.model} · {meta.label}</p>
              </div>
              <button
                type="button"
                onClick={() => desk.toggleDevice(dev.id)}
                className={`relative h-6 w-11 rounded-full transition ${dev.status === "on" ? "bg-brand" : "bg-line"}`}
                aria-label="Power"
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${dev.status === "on" ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-line bg-page p-2.5 text-center">
                <p className="text-lg font-bold" style={{ color: meta.accent }}>{dev.currentWatts}<span className="text-[10px]"> W</span></p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Live</p>
              </div>
              <div className="rounded-xl border border-line bg-page p-2.5 text-center">
                <p className="text-lg font-bold text-ink">{dev.todayKwh.toFixed(2)}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">kWh today</p>
              </div>
              <div className="rounded-xl border border-line bg-page p-2.5 text-center">
                <p className="text-lg font-bold text-ink">₹{dev.monthCost}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">this month</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] font-semibold text-muted">
                <span>SHARE OF DESK</span>
                <span style={{ color: meta.accent }}>{pctOfDesk}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full transition-all" style={{ width: `${pctOfDesk}%`, background: meta.accent }} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {dev.kind === "monitor" ? (
                <SliderRow label="Brightness" value={dev.brightness ?? 70} onChange={(v) => desk.updateDevice(dev.id, { brightness: v })} color={meta.accent} suffix="%" Icon={Sun} />
              ) : null}
              {dev.kind === "light" ? (
                <>
                  <SliderRow label="Brightness" value={dev.brightness ?? 55} onChange={(v) => desk.updateDevice(dev.id, { brightness: v })} color={meta.accent} suffix="%" Icon={Sun} />
                  <div>
                    <div className="mb-1.5 flex justify-between text-[11px]">
                      <span className="text-muted">Colour temp</span>
                      <span className="font-mono font-semibold text-ink">{dev.colorTemp}K</span>
                    </div>
                    <input type="range" min="2700" max="6500" step="100" value={dev.colorTemp ?? 4000}
                      onChange={(e) => desk.updateDevice(dev.id, { colorTemp: Number(e.target.value) })}
                      className="w-full accent-amber-500" />
                    <div className="mt-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#fbbf24,#fde68a,#dbeafe)" }} />
                  </div>
                </>
              ) : null}
              {dev.kind === "speakers" ? (
                <SliderRow label="Volume" value={dev.volume ?? 30} onChange={(v) => desk.updateDevice(dev.id, { volume: v })} color={meta.accent} suffix="%" Icon={Volume2} />
              ) : null}
              {dev.kind === "computer" ? (
                <div>
                  <p className="mb-1.5 text-[11px] text-muted">Performance mode</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([["eco", "Eco", "35%"], ["balanced", "Balanced", "65%"], ["performance", "Performance", "100%"]] as const).map(([k, lbl, draw]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => desk.updateDevice(dev.id, { mode: k })}
                        className={`rounded-lg border px-2 py-2 text-center transition ${dev.mode === k ? "border-brand bg-brand/10" : "border-line bg-page hover:bg-card"}`}
                      >
                        <p className={`text-[11px] font-semibold ${dev.mode === k ? "text-brand" : "text-ink"}`}>{lbl}</p>
                        <p className="mt-0.5 text-[9px] text-muted">{draw} draw</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex gap-2">
              <Link to="/devices" className="flex-1 rounded-lg border border-line bg-page px-3 py-1.5 text-center text-xs font-semibold text-ink hover:bg-card">
                All equipment <ChevronRight className="inline h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => { desk.removeDevice(dev.id); setSelected(desk.devices.find((x) => x.id !== dev.id)?.id ?? desk.devices[0].id); }}
                className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-muted hover:bg-card"
              >
                <X className="inline h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </Card>

          <Card eyebrow="Today's curve" title={dev.name}>
            <div className="flex items-center gap-2 text-xs text-muted mb-2">
              <TrendingUp className="h-3.5 w-3.5" /> Estimated from rated power × usage profile
            </div>
            <Sparkline data={series.map((s) => s.watts)} color={meta.accent} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-line bg-page p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Peak</p>
                <p className="text-sm font-bold text-ink">{peak} W</p>
              </div>
              <div className="rounded-lg border border-line bg-page p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Est. today</p>
                <p className="text-sm font-bold text-ink">{seriesKwh.toFixed(2)} kWh</p>
              </div>
              <div className="rounded-lg border border-line bg-page p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Rated</p>
                <p className="text-sm font-bold text-ink">{dev.baseWatts} W</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showAdd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Add desk device</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-line p-1.5 text-muted hover:bg-page">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted">Name</label>
                <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Desk Lamp" className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink" autoFocus />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted">Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(KIND_META) as DeskKind[]).map((k) => {
                    const m = KIND_META[k];
                    return (
                      <button key={k} type="button" onClick={() => setAddForm((f) => ({ ...f, kind: k }))}
                        className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition ${addForm.kind === k ? "border-brand bg-brand/10" : "border-line bg-page hover:bg-card"}`}>
                        {k === "monitor" ? <Monitor className="h-4 w-4" style={{ color: addForm.kind === k ? m.accent : "#6b7280" }} /> :
                          k === "light" ? <Lightbulb className="h-4 w-4" style={{ color: addForm.kind === k ? m.accent : "#6b7280" }} /> :
                          k === "speakers" ? <Volume2 className="h-4 w-4" style={{ color: addForm.kind === k ? m.accent : "#6b7280" }} /> :
                          <Cpu className="h-4 w-4" style={{ color: addForm.kind === k ? m.accent : "#6b7280" }} />}
                        <span className={`text-[9px] font-semibold ${addForm.kind === k ? "text-brand" : "text-muted"}`}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted">Rated power (W)</label>
                <input value={addForm.watts} onChange={(e) => setAddForm((f) => ({ ...f, watts: e.target.value }))} placeholder="e.g. 60" type="number" min="5" className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-line bg-page px-4 py-2 text-xs font-semibold text-ink hover:bg-card">Cancel</button>
                <button type="button" onClick={handleAdd} className="rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand-dark">Add</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`@keyframes spin { to { transform: translateX(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}

function SliderRow({ label, value, onChange, color, suffix, Icon }: { label: string; value: number; onChange: (v: number) => void; color: string; suffix: string; Icon: typeof Sun }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-muted"><Icon className="h-3 w-3" /> {label}</span>
        <span className="font-mono font-semibold" style={{ color }}>{value}{suffix}</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ accentColor: color }} />
    </div>
  );
}
