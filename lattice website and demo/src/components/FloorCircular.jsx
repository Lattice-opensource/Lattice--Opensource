import { useState, useMemo } from 'react';
import { FLOORS, FLOOR_DAILY_RECORDS } from '../data/mockData.js';

export default function FloorCircular() {
  const [dayIdx, setDayIdx] = useState(FLOOR_DAILY_RECORDS.length - 1);
  const [selectedFloor, setSelectedFloor] = useState(null);

  const days = FLOOR_DAILY_RECORDS;
  const selectedDay = days[dayIdx];

  // max per floor across all days for normalisation (so rings have comparable arc length)
  const maxPerFloor = useMemo(() => {
    const m = {};
    FLOORS.forEach(f => {
      m[f.id] = Math.max(...days.map(d => d.floors[f.id].kwh), 1);
    });
    return m;
  }, [days]);

  const size = 280;
  const center = size / 2;
  const ringWidth = 14;
  const gap = 8;
  // radii from outer to inner — larger inner radius so all 4 rings stay outside centre
  const baseRadius = 110;

  const total = selectedDay.totalKwh;
  const focal = selectedFloor ? FLOORS.find(f => f.id === selectedFloor) : null;
  const focalData = selectedFloor ? selectedDay.floors[selectedFloor] : null;
  const focalPct = focalData ? Math.round((focalData.kwh / total) * 100) : 0;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="label">Floor-wise usage — day wise</p>
          <h3 className="text-[16px] font-extrabold tracking-tight mt-1">Energy by floor</h3>
          <p className="text-[11px] text-faint mt-1">Each ring = one floor · distinct colour · tap a ring for detail</p>
        </div>
        <span className="hidden sm:inline-flex chip shrink-0" style={{ background: 'var(--surface-2)' }}>
          {selectedDay.label} · {selectedDay.dateLabel}
        </span>
      </div>

      {/* Day selector — no bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 no-scrollbar">
        {days.map((d, i) => {
          const active = i === dayIdx;
          return (
            <button
              key={d.iso}
              onClick={() => setDayIdx(i)}
              className="shrink-0 rounded-xl px-3 py-2 text-center min-w-[70px] transition-all border"
              style={{
                background: active ? 'var(--accent)' : 'var(--surface-2)',
                color: active ? '#fff' : 'var(--text-muted)',
                borderColor: active ? 'var(--accent)' : 'transparent',
              }}
            >
              <p className="text-[11px] font-extrabold leading-none">{d.label}</p>
              <p className="text-[10px] font-mono mt-1 opacity-80">{d.dateLabel}</p>
              <p className="text-[10px] font-bold mt-1">{d.totalKwh} kWh</p>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-center mt-2">
        {/* Circular rings */}
        <div className="relative mx-auto" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
            {FLOORS.map((floor, idx) => {
              const r = baseRadius - idx * (ringWidth + gap);
              const circ = 2 * Math.PI * r;
              const max = maxPerFloor[floor.id];
              const cur = selectedDay.floors[floor.id].kwh;
              const pct = Math.max(0.18, cur / max); // at least 18% visible — all colours in diagram
              const dash = pct * circ;
              const isSelected = selectedFloor === floor.id;
              const dim = selectedFloor && !isSelected ? 0.85 : 1;
              return (
                <g key={floor.id} style={{ opacity: dim, cursor: 'pointer', transition: 'opacity 0.2s' }} onClick={() => setSelectedFloor(isSelected ? null : floor.id)}>
                  {/* track */}
                  <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="var(--surface-2)"
                    strokeWidth={ringWidth}
                    strokeLinecap="round"
                  />
                  {/* value arc */}
                  <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke={floor.color}
                    strokeWidth={isSelected ? ringWidth + 1 : ringWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset={circ * 0.25}
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{ transition: 'stroke-dasharray 0.5s ease, stroke-width 0.15s ease', filter: isSelected ? 'brightness(1.08)' : undefined }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Center — theme-aware tiny circle so all 4 rings remain visible */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center" style={{ pointerEvents: focal ? 'auto' : 'none' }}>
            {focal ? (
              <button onClick={() => setSelectedFloor(null)} className="flex flex-col items-center justify-center rounded-full shadow-xl border backdrop-blur-md" style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', width: 96, height: 96 }}>
                <span className="w-2 h-2 rounded-full mb-1 ring-2" style={{ background: focal.color, boxShadow: `0 0 0 3px ${focal.soft}` }} />
                <p className="text-[8px] font-extrabold tracking-widest uppercase leading-none" style={{ color: 'var(--text)' }}>{focal.name}</p>
                <p className="text-[20px] font-black leading-none mt-1 tracking-tight" style={{ color: focal.color }}>{focalData.kwh}<span className="text-[8px] font-bold ml-1" style={{ color: 'var(--text-muted)' }}>kWh</span></p>
                <p className="text-[8px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded-full" style={{ background: focal.soft, color: focal.color }}>₹{focalData.cost}</p>
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-full shadow-xl border backdrop-blur-md" style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', width: 96, height: 96 }}>
                <div className="flex items-center gap-1 mb-1">
                  {FLOORS.map(f=>(
                    <span key={f.id} className="w-1.5 h-1.5 rounded-full border" style={{ background: f.color, borderColor: 'var(--border)', opacity: 1 }} title={f.name} />
                  ))}
                </div>
                <p className="text-[8px] font-extrabold tracking-[0.14em] uppercase leading-none" style={{ color: 'var(--text-muted)' }}>Total · {selectedDay.label}</p>
                <p className="text-[22px] font-black leading-none mt-1 tracking-tight" style={{ color: 'var(--text)' }}>{total}<span className="text-[8px] font-bold ml-1" style={{ color: 'var(--text-muted)' }}>kWh</span></p>
                <p className="text-[9px] font-mono font-extrabold mt-1 px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>₹{selectedDay.totalCost}</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend + day-wise table — every floor row shows all 4 colours */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-faint">4 colours</span>
            <span className="flex items-center gap-1">
              {FLOORS.map(f=>(
                <span key={f.id} className="w-2.5 h-2.5 rounded-full border" style={{ background: f.color, borderColor: 'var(--border)' }} title={f.name} />
              ))}
            </span>
            <span className="text-[11px] text-faint ml-1 hidden sm:inline">Each ring = one floor</span>
          </div>
          <div className="space-y-2.5">
            {FLOORS.map(floor => {
              const d = selectedDay.floors[floor.id];
              const pct = Math.round((d.kwh / total) * 100);
              const max = maxPerFloor[floor.id];
              const isSelected = selectedFloor === floor.id;
              return (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloor(isSelected ? null : floor.id)}
                  className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all"
                  style={{
                    background: isSelected ? floor.soft : 'var(--surface-2)',
                    borderColor: isSelected ? floor.color : 'transparent',
                  }}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: floor.color }} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-bold truncate">{floor.name}</span>
                      <span className="text-[12px] font-mono font-bold shrink-0">{d.kwh} kWh</span>
                    </span>
                    <span className="flex items-center gap-2 mt-1">
                      <span className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid var(--border)' }}>
                        <span className="block h-full rounded-full" style={{ width: `${(d.kwh / max) * 100}%`, background: floor.color }} />
                      </span>
                      <span className="text-[11px] font-mono text-faint shrink-0">{pct}% · ₹{d.cost}</span>
                    </span>
                    <span className="text-[11px] text-faint truncate block mt-1">{floor.rooms.length ? floor.rooms.join(' · ') : 'Sensors & utility'}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
            <span className="text-[11px] font-bold text-muted">Day {days.indexOf(selectedDay) + 1} of {days.length}</span>
            <span className="text-[11px] font-mono text-faint">{selectedDay.iso}</span>
          </div>

          <p className="text-[11px] text-faint leading-relaxed mt-3">
            Rings are scaled to each floor's weekly peak — a full ring = that floor's highest day this week. Compare floors day-wise without one floor dwarfing the others.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
        <span className="text-[11px] font-bold text-muted">{selectedDay.label} · {selectedDay.dateLabel}</span>
        <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--accent)' }}>Total ₹{selectedDay.totalCost.toLocaleString('en-IN')}</span>
      </div>

      <p className="text-[11px] text-faint leading-relaxed mt-3">
        One circle per floor — each arc shows that floor's share of the day's total. Tap a circle to focus it.
      </p>
    </div>
  );
}
