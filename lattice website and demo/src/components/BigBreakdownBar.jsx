import { useEnergy } from '../context/EnergyContext.jsx';

const CATS = [
  { key: 'cooling', label: '❄️ Cooling', pct: 42, color: '#0EA5E9' },
  { key: 'lighting', label: '💡 Lighting', pct: 12, color: '#F59E0B' },
  { key: 'kitchen', label: '🍳 Kitchen', pct: 18, color: '#E11D48' },
  { key: 'entertainment', label: '📺 Entertainment', pct: 8, color: '#8B5CF6' },
  { key: 'other', label: '🔌 Other', pct: 20, color: '#6E6E76' },
];

export default function BigBreakdownBar() {
  const { totalToday } = useEnergy();
  // mock today's kWh from cost, use 12.5 as in spec if needed but derive
  const kwh = Math.max(8, Math.round((totalToday / 8) * 10) / 10); // tariff 8
  const displayKwh = kwh.toFixed(1);

  return (
    <div className="card p-5 sm:p-6">
      <p className="text-[11px] font-bold tracking-widest uppercase text-faint">Today's breakdown</p>
      <p className="text-[28px] font-black leading-none mt-1">Today's {displayKwh} kWh</p>

      <div className="h-4 rounded-full overflow-hidden flex mt-4" style={{ background: 'var(--surface-2)' }}>
        {CATS.map(c=>(
          <div key={c.key} style={{ width: `${c.pct}%`, background: c.color }} title={`${c.label} ${c.pct}%`} />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        {CATS.map(c=>(
          <div key={c.key} className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
            <p className="text-[12px] font-bold truncate">{c.label}</p>
            <p className="text-[13px] font-black mt-1" style={{ color: c.color }}>{c.pct}%</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {CATS.map(c=>(
          <span key={c.key} className="chip" style={{ background: c.color + '18', color: c.color, border: `1px solid ${c.color}30` }}>{c.label} — {c.pct}%</span>
        ))}
      </div>
    </div>
  );
}
