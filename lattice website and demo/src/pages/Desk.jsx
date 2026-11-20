import { useState, useMemo, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Monitor, Lightbulb, Volume2, Cpu, Zap, RotateCcw, Power, ChevronRight,
  TrendingUp, Sun, Gauge, Plus, X, Activity,
} from 'lucide-react';
import { useDesk } from '../context/DeskContext.jsx';
import HourlyLineGraph from '../components/HourlyLineGraph.jsx';

/* ------------------------------------------------------------------ *
 *  A 3D rectangular prism built from 6 CSS faces.
 *  Sizes are in px; centred on its own origin.
 * ------------------------------------------------------------------ */
function Box({ w, h, d, x = 0, y = 0, z = 0, colors = {}, children, className = '', style = {} }) {
  const c = {
    front: '#3A3A42', back: '#2A2A31', left: '#31313A', right: '#31313A',
    top: '#4A4A55', bottom: '#202027', ...colors,
  };
  const faces = [
    { s: { width: w, height: h, background: c.front }, t: `translateZ(${d / 2}px)` },
    { s: { width: w, height: h, background: c.back },  t: `translateZ(${-d / 2}px) rotateY(180deg)` },
    { s: { width: d, height: h, background: c.right }, t: `translateX(${w / 2}px) rotateY(90deg)` },
    { s: { width: d, height: h, background: c.left },  t: `translateX(${-w / 2}px) rotateY(-90deg)` },
    { s: { width: w, height: d, background: c.top },   t: `translateY(${-h / 2}px) rotateX(90deg)` },
    { s: { width: w, height: d, background: c.bottom },t: `translateY(${h / 2}px) rotateX(-90deg)` },
  ];
  return (
    <div
      className={className}
      style={{
        position: 'absolute', left: '50%', top: '50%',
        transformStyle: 'preserve-3d',
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
        ...style,
      }}
    >
      {faces.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: `translate(-50%, -50%) ${f.t}`,
            ...f.s,
            border: '1px solid rgba(0,0,0,0.25)',
            ...style,
          }}
        >
          {i === 0 && children}
        </div>
      ))}
    </div>
  );
}

function Sparkline({ data, color, height = 32 }) {
  const W = 110, H = height, pad = 2;
  const max = Math.max(...data, 1);
  const step = (W - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
  const line = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="block">
      <path d={`${line} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`} fill={color} opacity="0.15" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const KIND_META = {
  monitor:   { icon: Monitor,   label: 'Monitor',   accent: '#0EA5E9', soft: 'rgba(14,165,233,0.14)' },
  light:     { icon: Lightbulb, label: 'Light',     accent: '#FBBF24', soft: 'rgba(251,191,36,0.14)' },
  speakers:  { icon: Volume2,   label: 'Speakers',  accent: '#8B5CF6', soft: 'rgba(139,92,246,0.14)' },
  computer:  { icon: Cpu,       label: 'Computer',  accent: '#34D399', soft: 'rgba(52,211,153,0.14)' },
};

function usageSeries(device) {
  const hours = [];
  for (let h = 0; h < 24; h++) {
    let f;
    if (device.kind === 'light')      f = h >= 8 && h <= 22 ? 0.5 + 0.3 * Math.sin((h - 15) * 0.4) : 0;
    else if (device.kind === 'computer') f = h >= 9 && h <= 19 ? 0.55 + 0.3 * Math.sin((h - 13) * 0.5) : (h >= 20 && h <= 23 ? 0.3 : 0);
    else if (device.kind === 'speakers') f = h >= 10 && h <= 21 ? 0.4 : 0;
    else f = h >= 8 && h <= 20 ? 0.45 + 0.15 * Math.sin((h - 14) * 0.4) : 0;
    f = Math.max(0, f) * (device.status === 'on' ? 1 : 0.06);
    hours.push({ hour: h, watts: Math.round(device.baseWatts * Math.max(0, f)) });
  }
  return hours;
}

export default function Desk() {
  const { activeColor } = useOutletContext();
  const desk = useDesk();
  const [selected, setSelected] = useState('dk-monitor');
  const [rot, setRot] = useState({ rx: -22, ry: -34 });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', kind: 'computer', watts: '' });
  const dragRef = useRef(null);

  const dev = desk.devices.find(d => d.id === selected) || desk.devices[0];
  const meta = KIND_META[dev?.kind] || KIND_META.computer;
  const series = useMemo(() => (dev ? usageSeries(dev) : []), [dev?.id, dev?.status, dev?.baseWatts]);
  const peak = Math.max(...series.map(s => s.watts), 1);
  const seriesKwh = useMemo(() => series.reduce((s, p) => s + p.watts, 0) / 1000, [series]);

  /* drag to rotate */
  const onDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = { x: p.clientX, y: p.clientY, rx: rot.rx, ry: rot.ry };
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    const p = e.touches ? e.touches[0] : e;
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
    const d = desk.addDevice({ name: addForm.name, kind: addForm.kind, baseWatts: Number(addForm.watts) });
    setSelected(d.id);
    setAddForm({ name: '', kind: 'computer', watts: '' });
    setShowAdd(false);
  };

  const pctOfDesk = dev ? Math.round((dev.currentWatts / Math.max(1, desk.totalWatts)) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Desk</h1>
          <p className="text-[13px] text-muted mt-1">
            A live 3D model of your workspace. Tap any device to control it and see exactly what it costs you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRot({ rx: -22, ry: -34 })} className="btn btn-ghost !px-3 !py-2" title="Reset view">
            <RotateCcw className="w-4 h-4" /> Reset view
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary !px-3.5 !py-2">
            <Plus className="w-4 h-4" /> Add device
          </button>
        </div>
      </div>

      {/* Desk-wide totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Desk live', value: `${desk.totalWatts} W`, sub: `${desk.onCount} of ${desk.devices.length} on`, color: 'var(--accent)', Icon: Zap },
          { label: 'Today', value: `${desk.totalTodayKwh.toFixed(2)} kWh`, sub: '≈ ₹' + Math.round(desk.totalTodayKwh * 8), color: 'var(--text)', Icon: Activity },
          { label: 'This month', value: '₹' + desk.totalMonthCost.toLocaleString('en-IN'), sub: 'desk share of bill', color: 'var(--text)', Icon: TrendingUp },
          { label: 'Peak draw', value: `${peak} W`, sub: dev ? `selected · ${dev.name}` : '', color: meta.accent, Icon: Gauge },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <c.Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
              <p className="label !text-[10px]">{c.label}</p>
            </div>
            <p className="text-[20px] font-extrabold font-mono leading-none" style={{ color: c.color }}>{c.value}</p>
            {c.sub && <p className="text-[10px] text-faint mt-1">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* ── 3D scene ─────────────────────────────────────────── */}
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="label flex items-center gap-1.5"><Gauge className="w-3 h-3" /> Workspace · drag to rotate</p>
            <span className="text-[10px] text-faint font-mono">{Math.round(rot.ry)}° / {Math.round(rot.rx)}°</span>
          </div>
          <div
            className="relative select-none"
            style={{ height: 420, cursor: dragRef.current ? 'grabbing' : 'grab', background: 'radial-gradient(120% 90% at 50% 20%, var(--surface-2) 0%, var(--bg-soft) 70%)' }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          >
            <div style={{ position: 'absolute', inset: 0, perspective: '1100px', perspectiveOrigin: '50% 45%' }}>
              <div style={{ position: 'absolute', left: '50%', top: '56%', transformStyle: 'preserve-3d', transform: `translate(-50%,-50%) rotateX(${rot.rx}deg) rotateY(${rot.ry}deg)` }}>

                {/* Desk top */}
                <Box w={440} h={18} d={210} y={0} colors={{ top: '#3F3F4A', front: '#33333D', right: '#2C2C35', left: '#2C2C35', bottom: '#23232B' }} />

                {/* Legs */}
                {[[-195, 90], [195, 90], [-195, -80], [195, -80]].map(([lx, lz], i) => (
                  <Box key={i} w={16} h={140} d={16} x={lx} y={79} z={lz} colors={{ top: '#2A2A32', front: '#24242C', right: '#1E1E25', left: '#1E1E25' }} />
                ))}

                {/* Floor shadow */}
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: 470, height: 250, transform: 'translate(-50%,-50%) translateY(150px) rotateX(90deg)', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(6px)' }} />

                {/* ── MONITOR ─────────────────────────────────── */}
                <div
                  onClick={(e) => { e.stopPropagation(); setSelected('dk-monitor'); }}
                  style={{ position: 'absolute', transformStyle: 'preserve-3d', cursor: 'pointer' }}
                >
                  {/* stand */}
                  <Box w={14} h={46} d={14} x={0} y={-32} z={-40} colors={{ top: '#2A2A32', front: '#24242C', right: '#1E1E25' }} />
                  <Box w={80} h={6} d={50} x={0} y={-12} z={-40} colors={{ top: '#2E2E37', front: '#24242C' }} />
                  {/* body */}
                  <Box
                    w={210} h={125} d={8} x={0} y={-100} z={-40}
                    colors={{
                      top: '#3A3A44', front: dev?.status === 'on' ? '#0B1220' : '#15151B',
                      right: '#26262F', left: '#26262F', bottom: '#202028',
                    }}
                    style={dev?.status === 'on' ? { filter: 'drop-shadow(0 0 26px rgba(14,165,233,0.5))' } : {}}
                  >
                    {/* screen glow layer */}
                    <div style={{ position: 'absolute', inset: 5, borderRadius: 3, overflow: 'hidden', background: dev?.status === 'on'
                      ? `linear-gradient(160deg, rgba(14,165,233,${0.15 + (dev.brightness / 100) * 0.5}) 0%, rgba(56,189,248,${0.05 + (dev.brightness / 100) * 0.25}) 100%)`
                      : '#0C0C11' }}>
                      {dev?.status === 'on' && (
                        <>
                          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)' }} />
                          <div style={{ position: 'absolute', left: 8, top: 8, right: 8, height: 4, borderRadius: 2, background: 'rgba(125,211,252,0.6)' }} />
                          <div style={{ position: 'absolute', left: 8, top: 18, width: '55%', height: 3, borderRadius: 2, background: 'rgba(125,211,252,0.3)' }} />
                          <div style={{ position: 'absolute', left: 8, top: 26, width: '40%', height: 3, borderRadius: 2, background: 'rgba(125,211,252,0.3)' }} />
                        </>
                      )}
                    </div>
                  </Box>
                  {/* selection ring */}
                  {selected === 'dk-monitor' && (
                    <Box w={218} h={133} d={2} x={0} y={-100} z={-35} colors={{ front: 'transparent', back: 'transparent', top: 'transparent', bottom: 'transparent', left: 'transparent', right: 'transparent' }} style={{ pointerEvents: 'none' }} />
                  )}
                </div>

                {/* ── LIGHT BAR (above monitor) ───────────────── */}
                <div
                  onClick={(e) => { e.stopPropagation(); setSelected('dk-light'); }}
                  style={{ position: 'absolute', transformStyle: 'preserve-3d', cursor: 'pointer' }}
                >
                  <Box
                    w={150} h={10} d={16} x={0} y={-172} z={-30}
                    colors={{
                      top: '#3A3A44', front: dev?.status === 'on' ? '#FDE68A' : '#2A2A32',
                      right: '#26262F', left: '#26262F', bottom: '#22222A',
                    }}
                    style={dev?.status === 'on' ? { filter: `drop-shadow(0 0 ${8 + (dev.brightness / 100) * 22}px rgba(251,191,36,0.75))` } : {}}
                  />
                </div>

                {/* ── SPEAKERS (left + right) ─────────────────── */}
                <div
                  onClick={(e) => { e.stopPropagation(); setSelected('dk-speakers'); }}
                  style={{ position: 'absolute', transformStyle: 'preserve-3d', cursor: 'pointer' }}
                >
                  <Box w={30} h={54} d={30} x={-175} y={-36} z={-20}
                    colors={{ top: '#34343E', front: dev?.status === 'on' ? '#2E2E3A' : '#24242C', right: '#24242C', left: '#1F1F26' }}
                    style={dev?.status === 'on' ? { filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.6))' } : {}}
                  >
                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: '50%', background: dev?.status === 'on' ? 'radial-gradient(circle, #A78BFA 0%, #4C1D95 80%)' : '#1A1A20', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Box>
                  <Box w={30} h={54} d={30} x={175} y={-36} z={-20}
                    colors={{ top: '#34343E', front: dev?.status === 'on' ? '#2E2E3A' : '#24242C', right: '#24242C', left: '#1F1F26' }}
                    style={dev?.status === 'on' ? { filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.6))' } : {}}
                  >
                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: '50%', background: dev?.status === 'on' ? 'radial-gradient(circle, #A78BFA 0%, #4C1D95 80%)' : '#1A1A20', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </Box>
                </div>

                {/* ── COMPUTER TOWER (under desk, right) ──────── */}
                <div
                  onClick={(e) => { e.stopPropagation(); setSelected('dk-computer'); }}
                  style={{ position: 'absolute', transformStyle: 'preserve-3d', cursor: 'pointer' }}
                >
                  <Box w={60} h={130} d={150} x={150} y={82} z={20}
                    colors={{ top: '#33333D', front: '#26262F', right: '#202028', left: '#202028' }}
                    style={dev?.status === 'on' ? { filter: 'drop-shadow(0 0 16px rgba(52,211,153,0.45))' } : {}}
                  >
                    {/* front panel */}
                    <div style={{ position: 'absolute', inset: 6, borderRadius: 4, background: '#12121A', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      {dev?.status === 'on' && (
                        <>
                          <div style={{ position: 'absolute', left: '50%', top: 14, transform: 'translateX(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'conic-gradient(from 0deg, #34D399, #065F46, #34D399)', animation: 'spin 4s linear infinite', boxShadow: '0 0 10px rgba(52,211,153,0.7)' }} />
                          <div style={{ position: 'absolute', left: '50%', top: 52, transform: 'translateX(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'conic-gradient(from 90deg, #34D399, #065F46, #34D399)', animation: 'spin 3s linear infinite', boxShadow: '0 0 10px rgba(52,211,153,0.7)' }} />
                          <div style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
                        </>
                      )}
                    </div>
                  </Box>
                </div>

              </div>
            </div>

            {/* legend */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {desk.devices.map(d => {
                const m = KIND_META[d.kind] || KIND_META.computer;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d.id)}
                    className="chip transition"
                    style={{
                      background: selected === d.id ? m.soft : 'var(--surface)',
                      color: selected === d.id ? m.accent : 'var(--text-muted)',
                      border: `1px solid ${selected === d.id ? m.accent : 'var(--border)'}`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.status === 'on' ? m.accent : 'var(--text-faint)' }} />
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Control + analytics panel ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {dev && (
            <>
              <div className="card p-5" style={{ borderTop: `3px solid ${meta.accent}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.soft }}>
                    <meta.icon className="w-5 h-5" style={{ color: meta.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-extrabold leading-tight">{dev.name}</p>
                    <p className="text-[11px] text-faint">{dev.model} · {meta.label}</p>
                  </div>
                  <button
                    onClick={() => desk.toggleDevice(dev.id)}
                    className={`switch ${dev.status === 'on' ? 'on' : ''}`}
                    style={dev.status === 'on' ? { background: meta.accent, borderColor: meta.accent } : {}}
                    title="Power"
                  />
                </div>

                {/* live readout */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: meta.soft }}>
                    <p className="text-[17px] font-extrabold font-mono leading-none" style={{ color: meta.accent }}>{dev.currentWatts}<span className="text-[10px]"> W</span></p>
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: meta.accent }}>Live</p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-[17px] font-extrabold font-mono leading-none">{dev.todayKwh.toFixed(2)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-1 text-faint">kWh today</p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-[17px] font-extrabold font-mono leading-none">₹{dev.monthCost}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-1 text-faint">this month</p>
                  </div>
                </div>

                {/* share of desk */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-bold text-faint mb-1">
                    <span>SHARE OF DESK</span><span style={{ color: meta.accent }}>{pctOfDesk}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctOfDesk}%`, background: meta.accent }} />
                  </div>
                </div>

                {/* kind-specific controls */}
                <div className="mt-4 space-y-3">
                  {dev.kind === 'monitor' && (
                    <>
                      <SliderRow label="Brightness" value={dev.brightness} onChange={v => desk.updateDevice(dev.id, { brightness: v })} color={meta.accent} suffix="%" Icon={Sun} />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-faint">Input</span>
                        <span className="font-mono font-bold">{dev.source}</span>
                      </div>
                    </>
                  )}
                  {dev.kind === 'light' && (
                    <>
                      <SliderRow label="Brightness" value={dev.brightness} onChange={v => desk.updateDevice(dev.id, { brightness: v })} color={meta.accent} suffix="%" Icon={Sun} />
                      <div>
                        <div className="flex justify-between text-[11px] mb-1.5">
                          <span className="text-faint flex items-center gap-1.5"><Lightbulb className="w-3 h-3" /> Colour temp</span>
                          <span className="font-mono font-bold">{dev.colorTemp}K</span>
                        </div>
                        <input type="range" min="2700" max="6500" step="100" value={dev.colorTemp}
                          onChange={e => desk.updateDevice(dev.id, { colorTemp: Number(e.target.value) })}
                          className="w-full accent-yellow-400" />
                        <div className="h-2 rounded-full mt-1" style={{ background: 'linear-gradient(90deg,#FBBF24,#FDE68A,#DBEAFE)' }} />
                      </div>
                    </>
                  )}
                  {dev.kind === 'speakers' && (
                    <SliderRow label="Volume" value={dev.volume} onChange={v => desk.updateDevice(dev.id, { volume: v })} color={meta.accent} suffix="%" Icon={Volume2} />
                  )}
                  {dev.kind === 'computer' && (
                    <div>
                      <p className="text-[11px] text-faint mb-1.5 flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Performance mode</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[['eco', 'Eco', '35%'], ['balanced', 'Balanced', '65%'], ['performance', 'Performance', '100%']].map(([k, lbl, draw]) => (
                          <button key={k} onClick={() => desk.updateDevice(dev.id, { mode: k })}
                            className="rounded-lg px-2 py-2 text-center transition"
                            style={{
                              background: dev.mode === k ? meta.soft : 'var(--surface-2)',
                              border: `1px solid ${dev.mode === k ? meta.accent : 'transparent'}`,
                            }}>
                            <p className="text-[11px] font-bold" style={{ color: dev.mode === k ? meta.accent : 'var(--text)' }}>{lbl}</p>
                            <p className="text-[9px] text-faint font-mono mt-0.5">{draw} draw</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Link to="/devices" className="btn btn-ghost flex-1 !text-[12px]">
                    All devices <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <button onClick={() => { desk.removeDevice(dev.id); setSelected(desk.devices.find(x => x.id !== dev.id)?.id); }}
                    className="btn btn-ghost !text-[12px] text-faint">
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>

              {/* analytics */}
              <div className="card p-5">
                <p className="label mb-3 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" style={{ color: meta.accent }} /> Today's curve · {dev.name}</p>
                <HourlyLineGraph data={series} color={meta.accent} height={104} />
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="rounded-lg px-2.5 py-2" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-[9px] font-bold uppercase text-faint tracking-wider">Peak</p>
                    <p className="text-[13px] font-extrabold font-mono">{peak} W</p>
                  </div>
                  <div className="rounded-lg px-2.5 py-2" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-[9px] font-bold uppercase text-faint tracking-wider">Est. today</p>
                    <p className="text-[13px] font-extrabold font-mono">{seriesKwh.toFixed(2)} kWh</p>
                  </div>
                  <div className="rounded-lg px-2.5 py-2" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-[9px] font-bold uppercase text-faint tracking-wider">Rated</p>
                    <p className="text-[13px] font-extrabold font-mono">{dev.baseWatts} W</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add device modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative card p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-extrabold flex items-center gap-2"><Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Add desk device</h3>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost !p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-faint mb-1.5 block">Name</label>
                <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Desk Lamp" className="input w-full" autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-bold text-faint mb-1.5 block">Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(KIND_META).map(([k, m]) => (
                    <button key={k} onClick={() => setAddForm(f => ({ ...f, kind: k }))}
                      className="rounded-lg px-2 py-2 flex flex-col items-center gap-1 transition"
                      style={{ background: addForm.kind === k ? m.soft : 'var(--surface-2)', border: `1px solid ${addForm.kind === k ? m.accent : 'transparent'}` }}>
                      <m.icon className="w-4 h-4" style={{ color: addForm.kind === k ? m.accent : 'var(--text-muted)' }} />
                      <span className="text-[9px] font-bold" style={{ color: addForm.kind === k ? m.accent : 'var(--text-muted)' }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-faint mb-1.5 block">Rated power (W)</label>
                <input value={addForm.watts} onChange={e => setAddForm(f => ({ ...f, watts: e.target.value }))} placeholder="e.g. 60" type="number" min="5" className="input w-full font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowAdd(false)} className="btn btn-ghost !px-4 !py-2">Cancel</button>
                <button onClick={handleAdd} className="btn btn-primary !px-5 !py-2"><Plus className="w-4 h-4" /> Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateX(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}

function SliderRow({ label, value, onChange, color, suffix, Icon }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-faint flex items-center gap-1.5"><Icon className="w-3 h-3" /> {label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}{suffix}</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" style={{ accentColor: color }} />
    </div>
  );
}
