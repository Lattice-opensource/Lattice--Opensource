import { Leaf, TreePine, Zap, Recycle } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';
import { mockHome } from '../data/mockData.js';

export default function EnvironmentalImpact() {
  const { totalToday, totalWatts } = useEnergy();
  const kwh = Math.max(0.1, totalToday / mockHome.tariff); // today kWh from cost
  const co2 = Math.round(kwh * 0.82 * 10) / 10; // kg CO2 (India avg 0.82 kg/kWh)
  const trees = Math.round((co2 / 21) * 10) / 10; // trees needed to offset (21kg/year per tree ≈ 0.057/day, use yearly)
  const treesDaily = Math.round((kwh * 0.045) * 10) / 10; // simpler daily equivalent visual
  const renewablePct = 38; // mock
  const nonRenewablePct = 100 - renewablePct;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-soft)' }}><Leaf className="w-4 h-4" style={{ color: 'var(--green)' }} /></span>
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-faint">Environmental Impact</p>
          <p className="text-[12px] font-bold">Today's {kwh.toFixed(1)} kWh</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[20px]">🌱</p>
          <p className="text-[11px] text-faint mt-1">CO₂ emissions</p>
          <p className="text-[14px] font-black mt-1">{co2} kg</p>
          <p className="text-[10px] text-faint">{(co2/1000).toFixed(3)} t</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[20px]">🌳</p>
          <p className="text-[11px] text-faint mt-1">Equivalent trees</p>
          <p className="text-[14px] font-black mt-1">{treesDaily}</p>
          <p className="text-[10px] text-faint">to offset today</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[11px] text-faint flex items-center justify-center gap-1"><Recycle className="w-3 h-3"/> Renewable</p>
          <p className="text-[14px] font-black mt-2" style={{ color: 'var(--green)' }}>{renewablePct}%</p>
          <p className="text-[10px] text-faint">vs {nonRenewablePct}% non-renew</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }}/> Renewable</span><span>{renewablePct}%</span></div>
        <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-2)' }}>
          <div style={{ width: `${renewablePct}%`, background: 'var(--green)' }} />
          <div style={{ width: `${nonRenewablePct}%`, background: 'var(--text-faint)', opacity: 0.6 }} />
        </div>
        <p className="text-[11px] text-faint leading-relaxed">At {kwh.toFixed(1)} kWh today, you emitted ~{co2} kg CO₂. Planting {trees} trees would offset a year of this rate. Shift cooling & kitchen use to solar hours to raise renewable share.</p>
      </div>
    </div>
  );
}
