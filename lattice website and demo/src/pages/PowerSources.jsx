import { useState } from 'react';
import { Sun, Battery, Plug, Home, Droplets, Flame, BarChart3, Zap, Cable, Gauge } from 'lucide-react';

const TABS = ['Summary', 'Electricity', 'Gas', 'Water', 'Now'];

// --- Electricity bars data to mimic screenshot (10.91 kWh total) ---
const ELEC_BARS = [
  { grid: 0.42, solar: 0, ret: 0 },
  { grid: 0.55, solar: 0, ret: 0 },
  { grid: 0.47, solar: 0, ret: 0 },
  { grid: 0.16, solar: 0, ret: 0 },
  { grid: 0.52, solar: 0, ret: 0 },
  { grid: 0.11, solar: 0, ret: 0 },
  { grid: 0.28, solar: 0, ret: 0 },
  { grid: 0.66, solar: 0, ret: 0 },
  { grid: 0.54, solar: 0.08, ret: 0 },
  { grid: 0.41, solar: 0.27, ret: -0.09 },
  { grid: 0.31, solar: 0.19, ret: -0.09 },
  { grid: 0.52, solar: 0.27, ret: -0.04 },
  { grid: 0.72, solar: 0.78, ret: -0.04 },
  { grid: 0.18, solar: 1.40, ret: -0.11 },
  { grid: 0.09, solar: 0.81, ret: -0.54 },
  { grid: 0.05, solar: 0.47, ret: -0.45 },
  { grid: 0.19, solar: 1.52, ret: -0.25 },
  { grid: 0, solar: 0, ret: 0 },
];

const SOLAR_BARS = [0, 0, 0, 0.12, 0.35, 0.82, 1.47, 1.36, 1.78, 0.92, 0.55, 0.18];

const INDIVIDUAL_DETAIL = [0.42, 0.56, 0.47, 0.14, 0.52, 0.11, 0.27, 0.68, 0.54, 0.90, 0.52, 0.81, 1.58, 0.90, 0.52, 1.72];
const INDIVIDUAL_DEVICES = [
  { label: 'Electric car', kwh: 0.02, color: '#93C5E8' },
  { label: 'Air conditioning', kwh: 0.04, color: '#FCD08A' },
  { label: 'Washing machine', kwh: 0.06, color: '#F8AFA6' },
  { label: 'Dryer', kwh: 0.03, color: '#7CC8B8' },
  { label: 'Heat pump', kwh: 0.08, color: '#C9B6E4' },
  { label: 'Boiler', kwh: 0.05, color: '#F9A8D4' },
  { label: 'Untracked consumption', kwh: 0.68, color: '#D1D5DB' },
];

function Card({ children, className = '' }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

function ElectricityChart() {
  const w = 680, h = 220, padL = 36, padR = 12, padT = 16, padB = 28;
  const maxY = 2.0, minY = -1.0;
  const y = v => padT + (maxY - v) / (maxY - minY) * (h - padT - padB);
  const y0 = y(0);
  const bw = (w - padL - padR) / ELEC_BARS.length - 6;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[240px] block">
        {[2.0, 1.5, 1.0, 0.5, 0, -0.5].map(v => (
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="0.6" />
            <text x={padL - 6} y={y(v) + 3} fontSize="9" fill="var(--text-faint)" textAnchor="end">{v.toFixed(1)}</text>
          </g>
        ))}
        <text x={padL - 6} y={padT - 4} fontSize="8" fill="var(--text-faint)">kWh</text>
        {ELEC_BARS.map((b, i) => {
          const x = padL + i * ((w - padL - padR) / ELEC_BARS.length) + 3;
          const gridH = Math.abs(b.grid / (maxY - minY) * (h - padT - padB));
          const solarH = Math.abs(b.solar / (maxY - minY) * (h - padT - padB));
          const retH = Math.abs(b.ret / (maxY - minY) * (h - padT - padB));
          return (
            <g key={i}>
              {b.grid > 0 && <rect x={x} y={y(b.grid)} width={bw} height={gridH} fill="#93C5E8" rx="3" />}
              {b.solar > 0 && <rect x={x} y={y(b.grid + b.solar)} width={bw} height={solarH} fill="#FCD08A" rx="3" />}
              {b.ret < 0 && <rect x={x} y={y0} width={bw} height={retH} fill="#A99BC7" rx="3" />}
            </g>
          );
        })}
        <line x1={padL} x2={w - padR} y1={y0} y2={y0} stroke="var(--text-faint)" strokeWidth="0.9" />
      </svg>
      <div className="flex flex-wrap gap-3 justify-center text-[10px] text-faint mt-1">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#F8BBD0' }} />Battery Input</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#C9B6E4' }} />Returned to grid low tariff</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#9B8EC4' }} />Returned to grid high tariff</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#FCD08A' }} />Solar</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#7CC8B8' }} />Battery</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#93C5E8' }} />Grid consumption</span>
      </div>
    </div>
  );
}

function SolarChart() {
  const w = 680, h = 200, padL = 32, padR = 12, padT = 16, padB = 28;
  const maxY = 1.8;
  const y = v => h - padB - (v / maxY) * (h - padT - padB);
  const bw = (w - padL - padR) / SOLAR_BARS.length - 8;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px] block">
      {[1.8, 1.5, 1.2, 0.9, 0.6].map(v => (
        <g key={v}>
          <line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="0.6" />
          <text x={padL - 6} y={y(v) + 3} fontSize="9" fill="var(--text-faint)" textAnchor="end">{v.toFixed(1)}</text>
        </g>
      ))}
      <text x={padL - 6} y={padT - 4} fontSize="8" fill="var(--text-faint)">kWh</text>
      {SOLAR_BARS.map((v, i) => {
        const x = padL + i * ((w - padL - padR) / SOLAR_BARS.length) + 4;
        const hh = (v / maxY) * (h - padT - padB);
        return <rect key={i} x={x} y={y(v)} width={bw} height={hh} fill="#FCD08A" stroke="#F59E0B" strokeWidth="0.6" rx="3" />;
      })}
      <path d={`M ${padL + 4} ${y(0.05)} C ${padL + 80} ${y(0.3)}, ${w * 0.42} ${y(1.25)}, ${w * 0.62} ${y(1.35)} S ${w * 0.82} ${y(0.7)}, ${w - padR - 10} ${y(0.08)}`} fill="none" stroke="#111827" strokeWidth="1.1" strokeDasharray="5 4" />
    </svg>
  );
}

function PowerSourcesLine() {
  const w = 520, h = 120, pad = 24;
  const steps = 48;
  const solar = Array.from({ length: steps }, (_, i) => Math.max(0, Math.sin((i / steps - 0.2) * Math.PI * 1.8) * 7 + Math.random() * 1.2));
  const battery = solar.map(v => Math.max(0, v * 0.22 + Math.random() * 0.6));
  const grid = solar.map(() => Math.max(0.4, 4 + Math.random() * 1.6));
  const max = 40;
  const x = i => pad + (i / (steps - 1)) * (w - pad * 2);
  const y = v => h - pad - (v / max) * (h - pad * 2);
  const area = arr => {
    let d = `M ${x(0)} ${y(0)}`;
    arr.forEach((v, i) => { d += ` L ${x(i)} ${y(v)}`; });
    for (let i = arr.length - 1; i >= 0; i--) d += ` L ${x(i)} ${y(0)}`;
    return d + ' Z';
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[140px] block">
      <g stroke="var(--border)" strokeWidth="0.6">
        {[0, 1, 2, 3].map(i => <line key={i} x1={pad} x2={w - pad} y1={pad + i * ((h - pad * 2) / 3)} y2={pad + i * ((h - pad * 2) / 3)} />)}
      </g>
      <path d={area(solar)} fill="rgba(245,158,11,0.55)" stroke="#F59E0B" strokeWidth="1" />
      <path d={area(battery)} fill="rgba(124,200,184,0.45)" stroke="#7CC8B8" strokeWidth="1" />
      <path d={area(grid)} fill="rgba(59,130,198,0.32)" stroke="#3B82C6" strokeWidth="1" />
    </svg>
  );
}

function Sankey() {
  const sources = [
    { label: 'Battery', h: 28, color: '#7CC8B8' },
    { label: 'Grid', h: 110, color: '#3B82C6' },
    { label: 'Solar', h: 52, color: '#F59E0B' },
  ];
  const consumers = [
    { label: 'Electric car', h: 14, color: '#3B82F6' },
    { label: 'Air conditioning', h: 16, color: '#F5C563' },
    { label: 'Washing machine', h: 20, color: '#F87171' },
    { label: 'Dryer', h: 18, color: '#6ECAB0' },
    { label: 'Heat pump', h: 20, color: '#A78BFA' },
    { label: 'Boiler', h: 18, color: '#F472B6' },
    { label: 'Untracked consumption', h: 68, color: '#D1D5DB' },
  ];
  return (
    <div className="min-w-[720px] grid grid-cols-[1fr_18px_1fr] gap-3 items-stretch py-2">
      <div className="flex flex-col gap-2 justify-between">
        {sources.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-1.5 rounded-full shrink-0" style={{ background: s.color, height: s.h }} />
            <div className="flex-1 rounded-lg flex items-center px-3 text-[12px] font-semibold" style={{ background: `${s.color}33`, height: s.h }}>{s.label}</div>
          </div>
        ))}
        <div className="flex items-center gap-2"><div className="w-1.5 rounded-full shrink-0" style={{ background: '#7C3AED', height: 16 }} /><div className="flex-1 rounded-lg flex items-center px-3 text-[11px] font-semibold" style={{ background: 'rgba(124,58,237,0.18)', height: 16 }}>Grid</div></div>
      </div>
      <div className="flex items-center justify-center"><div className="w-[18px] h-[240px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#0891B2' }}><span className="rotate-90">Home</span></div></div>
      <div className="flex flex-col gap-1.5 justify-between">
        {consumers.map(c => (
          <div key={c.label} className="flex items-center gap-2">
            <div className="flex-1 rounded-lg flex items-center justify-between px-3 text-[11px] font-semibold" style={{ background: c.label === 'Untracked consumption' ? '#E5E7EB' : `${c.color}33`, height: c.h }}><span>{c.label}</span><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PowerSources() {
  const [tab, setTab] = useState('Electricity');
  return (
    <div className="max-w-[1400px] mx-auto pb-6 relative">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
        <div className="bg-white rounded-3xl px-10 py-10 md:px-16 md:py-12 shadow-2xl border-[6px] border-amber-400 text-center max-w-2xl w-full mx-4">
          <p className="text-5xl md:text-7xl font-black tracking-tight text-amber-500 leading-none">🚧</p>
          <p className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 mt-4">WORK IN PROGRESS</p>
          <p className="text-sm md:text-base font-bold text-gray-500 mt-3 tracking-wider">THIS PAGE IS UNDER CONSTRUCTION</p>
          <div className="mt-6 h-2 w-full rounded-full overflow-hidden flex">
            <div className="flex-1 bg-amber-400" />
            <div className="flex-1 bg-black" />
            <div className="flex-1 bg-amber-400" />
            <div className="flex-1 bg-black" />
            <div className="flex-1 bg-amber-400" />
            <div className="flex-1 bg-black" />
          </div>
        </div>
      </div>
      <div className="mb-3">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Cable className="w-6 h-6" style={{ color: '#0891B2' }} /> Power sources</h1>
        <p className="text-[13px] text-muted mt-1">Formerly Solar — HA Energy style. Pick a tab below. Electricity is the main view you asked for.</p>
      </div>

      <div className="flex items-center gap-1 border-b mb-4 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 -mb-px ${tab === t ? 'border-[var(--accent)] text-[var(--text)]' : 'border-transparent text-muted'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Summary' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card>
            <p className="font-bold text-[15px] mb-3">Energy distribution</p>
            <div className="relative h-[240px] flex items-center justify-center">
              <div className="absolute w-[86px] h-[86px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#F59E0B', left: '38%', top: 12 }}><Sun className="w-4 h-4" /><span className="text-[10px] font-bold">6.86 kWh</span></div>
              <div className="absolute w-[78px] h-[78px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#7C2D12', right: 12, top: 28 }}><Flame className="w-4 h-4" /><span className="text-[10px] font-bold">0 m³</span></div>
              <div className="absolute w-[86px] h-[86px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#F59E0B', right: 24, top: 102 }}><Home className="w-4 h-4" /><span className="text-[11px] font-bold">10.9 kWh</span></div>
              <div className="absolute w-[70px] h-[70px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#06B6D4', right: 28, bottom: 10 }}><Droplets className="w-4 h-4" /><span className="text-[10px] font-bold">0 L</span></div>
              <div className="absolute w-[76px] h-[76px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#14B8A6', left: '42%', bottom: 16 }}><Battery className="w-4 h-4" /><span className="text-[9px] font-bold">Battery</span></div>
              <div className="absolute w-[84px] h-[84px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#3B82F6', left: 6, top: 70 }}><Cable className="w-4 h-4" /><span className="text-[9px] font-bold">Grid</span></div>
            </div>
          </Card>
          <Card>
            <p className="font-bold text-[15px] mb-3">Totals</p>
            <div className="space-y-2 text-[13px]">
              {[
                ['Solar total', '6.86 kWh'],
                ['Battery total', '0 kWh'],
                ['Grid total', '4.05 kWh'],
                ['Gas total', '0 m³'],
                ['Water total', '0 L'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 px-2 rounded-xl" style={{ background: 'var(--surface-2)' }}><span>{k}</span><span className="font-mono font-bold">{v}</span></div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="font-bold text-[15px] mb-3">Power sources</p>
            <PowerSourcesLine />
          </Card>
        </div>
      )}

      {tab === 'Electricity' && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-[16px]">Electricity</p><span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>10.91 kWh</span>
              </div>
              <ElectricityChart />
            </Card>
            <Card>
              <p className="font-bold text-[15px] mb-3">Energy distribution</p>
              <div className="relative h-[240px] flex items-center justify-center">
                <div className="absolute w-[88px] h-[88px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#F59E0B', left: '36%', top: 8 }}><Sun className="w-4 h-4" /><span className="text-[10px] font-bold">6.86 kWh</span></div>
                <div className="absolute w-[78px] h-[78px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#7C2D12', right: 10, top: 24 }}><Flame className="w-4 h-4" /><span className="text-[10px] font-bold">0 m³</span></div>
                <div className="absolute w-[86px] h-[86px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#0891B2', right: 20, top: 96 }}><Home className="w-4 h-4" /><span className="text-[11px] font-bold">10.9 kWh</span></div>
                <div className="absolute w-[70px] h-[70px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#06B6D4', right: 22, bottom: 8 }}><Droplets className="w-4 h-4" /><span className="text-[10px] font-bold">0 L</span></div>
                <div className="absolute w-[86px] h-[86px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#14B8A6', left: '40%', bottom: 12 }}><Battery className="w-4 h-4" /><span className="text-[9px] font-bold">↓ 0 kWh ↑ 0 kWh</span></div>
                <div className="absolute w-[84px] h-[84px] rounded-full border-2 flex flex-col items-center justify-center bg-white" style={{ borderColor: '#3B82F6', left: 4, top: 66 }}><Cable className="w-4 h-4" /><span className="text-[9px] font-bold">←1.35 →5.4</span></div>
              </div>
              <div className="p-3 rounded-xl mt-2" style={{ background: 'var(--surface-2)' }}>
                <p className="text-[12px] font-bold">Grid energy balance</p>
                <p className="text-[11px] text-faint">5.4 kWh - 1.35 kWh = 4.05 kWh</p>
                <div className="h-5 rounded-full overflow-hidden flex mt-2" style={{ background: '#E5E7EB' }}><div style={{ width: '44%', background: '#C9B6E4' }} /><div style={{ width: '40%', background: '#3B82F6' }} /><div style={{ width: '16%', background: '#93C5E8' }} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  ['4.05 kWh', 'Net imported'],
                  ['80%', 'Self-consumed'],
                  ['51%', 'Self-sufficiency'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
                    <div className="w-14 h-14 mx-auto rounded-full border-[6px] flex items-center justify-center text-[11px] font-black" style={{ borderColor: l.includes('imported') ? '#3B82F6' : '#22C55E' }}>{v}</div>
                    <p className="text-[10px] font-bold mt-1.5 leading-tight">{l}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-[16px]">Solar production</p><span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>6.86 kWh</span>
              </div>
              <SolarChart />
              <div className="flex justify-center mt-2"><span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: 'var(--surface-2)' }}>Aug 20 — Now</span></div>
            </Card>
            <Card>
              <p className="font-bold text-[15px] mb-3">Totals</p>
              <div className="text-[13px] space-y-2">
                {[
                  ['Solar', '6.86 kWh'],
                  ['Solar total', '6.86 kWh'],
                  ['Battery total', '0 kWh'],
                  ['Grid consumption low tariff', '4.46 kWh'],
                  ['Returned to grid low tariff', '-0 kWh'],
                  ['Grid consumption high tariff', '0.94 kWh'],
                  ['Returned to grid high tariff', '-1.35 kWh'],
                  ['Grid total', '4.05 kWh'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 px-2 rounded-lg" style={{ background: k.includes('total') ? 'var(--surface-2)' : 'transparent' }}><span className={k.includes('total') ? 'font-bold' : ''}>{k}</span><span className="font-mono font-bold">{v}</span></div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <p className="font-bold text-[15px] mb-2">Individual devices detail</p>
            <div className="h-[180px] flex items-end gap-1">
              {INDIVIDUAL_DETAIL.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${(v / 1.8) * 100}%`, background: '#C4C4C7' }} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-faint mt-1"><span>Aug 20</span><span>3:30 PM</span><span>7:30 PM</span><span>11:30 PM</span><span>3:30 AM</span><span>7:30 AM</span></div>
          </Card>

          <Card>
            <p className="font-bold text-[15px] mb-3">Individual devices</p>
            <div className="space-y-2">
              {INDIVIDUAL_DEVICES.map(d => (
                <div key={d.label} className="grid grid-cols-[120px_1fr_40px] items-center gap-2 text-[11px]">
                  <span className="text-right truncate">{d.label}</span>
                  <div className="h-6 rounded-sm" style={{ background: 'var(--surface-2)' }}><div className="h-full rounded-sm" style={{ width: `${(d.kwh / 1) * 100}%`, background: d.color }} /></div>
                  <span className="font-mono">{d.kwh} kWh</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="font-bold text-[15px] mb-3">Energy flow</p>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <Sankey />
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'Gas' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <p className="font-bold text-[16px] mb-2">Gas consumption</p>
            <div className="h-[320px] flex items-center justify-center text-faint text-[13px]">m³ — No gas data — demo only</div>
            <div className="flex justify-between text-[10px] text-faint mt-2"><span>Aug 20</span><span>3:30 PM</span><span>7:30 PM</span><span>11:30 PM</span><span>3:30 AM</span><span>7:30 AM</span></div>
          </Card>
          <Card>
            <p className="font-bold text-[15px] mb-3">Totals</p><div className="text-[13px] flex justify-between py-3 px-2 rounded-xl" style={{ background: 'var(--surface-2)' }}><span>Gas total</span><span className="font-mono font-bold">0 m³</span></div>
          </Card>
        </div>
      )}

      {tab === 'Water' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <p className="font-bold text-[16px] mb-2">Water consumption</p>
            <div className="h-[320px] flex items-center justify-center text-faint text-[13px]">L — No water data — demo only</div>
            <div className="flex justify-between text-[10px] text-faint mt-2"><span>Aug 20</span><span>3:30 PM</span><span>7:30 PM</span><span>11:30 PM</span><span>3:30 AM</span><span>7:30 AM</span></div>
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <p className="font-bold text-[14px]">Water flow</p><p className="text-[13px] text-muted mt-1">There is no data for this period.</p>
            </div>
          </Card>
          <Card>
            <p className="font-bold text-[15px] mb-3">Totals</p><div className="text-[13px] flex justify-between py-3 px-2 rounded-xl" style={{ background: 'var(--surface-2)' }}><span>Water total</span><span className="font-mono font-bold">0 L</span></div>
          </Card>
        </div>
      )}

      {tab === 'Now' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-[16px]">Power sources</p><span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: 'var(--surface-2)' }}>Power usage 700 W</span>
            </div>
            <PowerSourcesLine />
            <div className="flex flex-wrap gap-3 justify-center text-[11px] mt-2">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#F59E0B' }} />Solar</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#3B82C6' }} />Grid</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#7CC8B8' }} />Battery</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#111827' }} />Consumption</span>
            </div>
          </Card>
          <Card>
            <p className="font-bold text-[16px] mb-3">Current power flow</p>
            <div className="overflow-x-auto"><Sankey /></div>
          </Card>
        </div>
      )}
    </div>
  );
}
