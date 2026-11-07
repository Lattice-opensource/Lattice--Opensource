import { useMemo } from 'react';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';

export default function EnergyAlerts() {
  const { devices, totalWatts } = useEnergy();

  const alerts = useMemo(() => {
    const list = [];
    // spike: totalWatts high vs avg (mock avg 1200)
    const avg = 1200;
    if (totalWatts > avg * 1.6) {
      list.push({ id: 'spike', type: 'spike', title: '⚡ Energy spike detected', desc: `Live ${totalWatts} W is ${Math.round(((totalWatts/avg-1)*100))}% above usual. Check AC/kitchen.`, color: 'var(--amber)' });
    }
    // long-running: devices on with high todayCost and baseWatts > 300 running > 6h implied
    devices.forEach(d=>{
      if (d.status==='on' && d.baseWatts>300 && d.todayCost>40) {
        list.push({ id: d.id, type: 'long', title: `⏰ ${d.name} running long`, desc: `On for ~${Math.round((d.todayCost/ (d.baseWatts/1000 * 8)))}h today — consider timer.`, color: 'var(--accent)' });
      }
      if (d.status==='on' && d.currentWatts > d.baseWatts*0.9) {
        list.push({ id: d.id+'-high', type: 'high', title: `🔥 ${d.name} high draw`, desc: `${d.currentWatts} W near max ${d.baseWatts} W.`, color: 'var(--amber)' });
      }
    });
    return list.slice(0,4);
  }, [devices, totalWatts]);

  if (alerts.length===0) {
    return (
      <div className="card p-5">
        <p className="text-[11px] font-bold tracking-widest uppercase text-faint flex items-center gap-1"><Zap className="w-3 h-3"/> Alerts</p>
        <p className="text-[13px] font-semibold mt-2">No spikes — all calm ✅</p>
        <p className="text-[11px] text-faint">We'll alert on spikes & long-running devices.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="text-[11px] font-bold tracking-widest uppercase text-faint flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Alerts · {alerts.length}</p>
      <div className="space-y-2 mt-3">
        {alerts.map(a=>(
          <div key={a.id} className="rounded-xl px-3 py-2.5 flex gap-2.5" style={{ background: a.color==='var(--amber)'?'var(--amber-soft)': a.color==='var(--green)'?'var(--green-soft)':'var(--accent-soft)' }}>
            <span className="shrink-0 mt-0.5" style={{ color: a.color }}>{a.type==='long' ? <Clock className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}</span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold leading-tight" style={{ color: a.color }}>{a.title}</p>
              <p className="text-[11px] text-muted leading-snug">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
