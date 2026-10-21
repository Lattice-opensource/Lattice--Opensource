import { FileText, TrendingUp, TrendingDown, Minus, Lightbulb, Zap, IndianRupee } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';
import { mockHome } from '../data/mockData.js';

function getLevel(kwh) {
  if (kwh < 6) return { label: 'Low', color: 'var(--green)', bg: 'var(--green-soft)', icon: TrendingDown };
  if (kwh < 10) return { label: 'Mid', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' };
  return { label: 'High', color: 'var(--accent)', bg: 'var(--accent-soft)', icon: TrendingUp };
}

export default function TodaysReport() {
  const { devices, totalToday } = useEnergy();
  const kwh = Math.max(0.1, totalToday / mockHome.tariff);
  const cost = totalToday;
  const lvl = getLevel(kwh);
  const Icon = lvl.icon || Minus;
  const top = [...devices].sort((a,b)=> b.todayCost - a.todayCost)[0];
  const mainCause = top ? `${top.name} (${top.room})` : '—';
  const prevent = kwh > 10
    ? 'High use — check AC timer, reduce cooling 1–2°C, run washing after 9pm, turn off idle plugs.'
    : kwh < 6
    ? 'Low — keep it! Maintain night mode and unplug idle devices.'
    : 'Mid — trim kitchen peaks and AC evening use to reach Low.';

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}><FileText className="w-4 h-4 text-muted" /></span>
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-faint">Today's Report</p>
          <p className="text-[12px] font-bold">Auto-generated · {new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</p>
        </div>
        <span className="ml-auto chip" style={{ background: lvl.bg, color: lvl.color }}><Icon className="w-3 h-3" /> {lvl.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[11px] text-faint flex items-center justify-center gap-1"><Zap className="w-3 h-3"/> Energy</p>
          <p className="text-[16px] font-black mt-1">{kwh.toFixed(1)} kWh</p>
          <p className={`text-[11px] font-bold`} style={{ color: lvl.color }}>{lvl.label}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[11px] text-faint flex items-center justify-center gap-1"><IndianRupee className="w-3 h-3"/> Cost</p>
          <p className="text-[16px] font-black mt-1">₹{cost}</p>
          <p className="text-[11px] text-faint">tariff ₹{mockHome.tariff}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[11px] text-faint">Top device</p>
          <p className="text-[11px] font-bold mt-1 truncate">{top?.name || '—'}</p>
          <p className="text-[11px] font-mono" style={{ color: lvl.color }}>{top ? `₹${top.todayCost}/day` : ''}</p>
        </div>
      </div>

      <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--surface-2)' }}>
        <p className="text-[11px] font-bold text-faint">Main cause</p>
        <p className="text-[13px] font-bold mt-1">{mainCause}</p>
        <p className="text-[11px] text-faint mt-1">Highest todayCost — contributes {top ? Math.round((top.todayCost/totalToday)*100) : 0}% of today's cost.</p>
      </div>

      <div className="rounded-xl p-3 flex gap-2" style={{ background: lvl.bg }}>
        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: lvl.color }} />
        <div>
          <p className="text-[11px] font-extrabold" style={{ color: lvl.color }}>How to prevent</p>
          <p className="text-[12px] leading-relaxed mt-1" style={{ color: 'var(--text)' }}>{prevent}</p>
        </div>
      </div>
    </div>
  );
}
