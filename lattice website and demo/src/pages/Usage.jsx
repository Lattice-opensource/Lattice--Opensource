import { TrendingDown, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';
import { mockHome, WEEKDAYS, weekTotals } from '../data/mockData.js';
import FloorCircular from '../components/FloorCircular.jsx';

export default function Usage() {
  const { devices, totalMonth } = useEnergy();
  const week = weekTotals(totalMonth);
  const maxWeek = Math.max(...week, 1);
  const delta = totalMonth - mockHome.lastMonthTotal;
  const up = delta >= 0;

  const rooms = mockHome.rooms
    .map(r => ({
      name: r.name,
      cost: devices.filter(d => d.room === r.name).reduce((s, d) => s + d.monthCost, 0),
    }))
    .filter(r => r.cost > 0)
    .sort((a, b) => b.cost - a.cost);
  const maxRoom = Math.max(...rooms.map(r => r.cost), 1);

  const ranking = [...devices]
    .filter(d => d.monthCost > 0)
    .sort((a, b) => b.monthCost - a.monthCost);
  const maxDev = Math.max(...ranking.map(d => d.monthCost), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Usage</h1>
        <p className="text-[13px] text-muted mt-1">
          Where your money actually goes — no guesswork.
        </p>
      </div>

      {/* Month vs month */}
      <div className="card p-5 mb-4">
        <p className="label mb-4">Bill comparison</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
            <p className="text-[11px] text-faint">Last month</p>
            <p className="text-[22px] font-bold leading-none mt-1">₹{mockHome.lastMonthTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
            <p className="text-[11px] text-faint">This month (projected)</p>
            <p className="text-[22px] font-bold leading-none mt-1" style={{ color: 'var(--accent)' }}>
              ₹{Math.round(totalMonth).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: up ? 'var(--amber-soft)' : 'var(--green-soft)' }}
        >
          {up ? <TrendingUp className="w-4 h-4" style={{ color: 'var(--amber)' }} /> : <TrendingDown className="w-4 h-4" style={{ color: 'var(--green)' }} />}
          <p className="text-[13px] font-bold" style={{ color: up ? 'var(--amber)' : 'var(--green)' }}>
            {up ? '+' : '−'}₹{Math.abs(delta).toLocaleString('en-IN')} {up ? 'more' : 'less'} than last month
          </p>
        </div>
      </div>

      {/* This week */}
      <div className="card p-5 mb-4">
        <p className="label mb-3">This week — ₹ per day</p>
        <div className="flex items-end gap-2 h-32">
          {week.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-mono text-faint">₹{v}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max(6, (v / maxWeek) * 100)}%`,
                  background: i === 6 ? 'var(--accent)' : 'var(--accent)',
                  opacity: 0.35 + (v / maxWeek) * 0.65,
                }}
              />
              <span className="text-[10px] font-bold text-faint">{WEEKDAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floor circular — day wise */}
      <div className="mb-4">
        <FloorCircular />
      </div>

      {/* Rooms breakdown */}
      <div className="card p-5 mb-4">
        <p className="label mb-4">By room</p>
        <div className="space-y-3.5">
          {rooms.map(r => (
            <div key={r.name}>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[13px] font-bold">{r.name}</p>
                <p className="text-[12px] font-mono text-muted">
                  ₹{r.cost.toLocaleString('en-IN')} · {Math.round((r.cost / maxRoom) * 100)}%
                </p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(r.cost / maxRoom) * 100}%`, background: 'var(--accent)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device ranking */}
      <div className="card p-5">
        <p className="label mb-4">By appliance — ranked</p>
        <div className="space-y-3.5">
          {ranking.map((d, i) => (
            <div key={d.id}>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[13px] font-bold flex items-center gap-2">
                  {i === 0 && <ArrowUpRight className="w-3.5 h-3.5" style={{ color: 'var(--amber)' }} />}
                  {d.name}
                </p>
                <p className="text-[12px] font-mono text-muted">
                  ₹{d.monthCost.toLocaleString('en-IN')} · {Math.round((d.monthCost / maxDev) * 100)}% of top
                </p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(d.monthCost / maxDev) * 100}%`, background: i === 0 ? 'var(--amber)' : 'var(--accent)', opacity: 1 - i * 0.15 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}