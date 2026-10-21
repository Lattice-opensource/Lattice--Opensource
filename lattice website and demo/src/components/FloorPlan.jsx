import { Home, Zap, Thermometer, Lightbulb, Tv, Snowflake, Droplets } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';
import { FLOORS, mockHome } from '../data/mockData.js';

export default function FloorPlan() {
  const { devices } = useEnergy();
  const getFloorColor = (room) => FLOORS.find(f=>f.rooms.includes(room))?.color || 'var(--border)';

  return (
    <div className="card p-5 sm:p-6">
      <p className="text-[16px] font-extrabold" style={{color:'var(--text)'}}>Floorplan</p>
      <p className="text-[11px] mt-1" style={{color:'var(--text-faint)'}}>Interactive — tap a room. Colours match floor rings.</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {mockHome.rooms.map(room=>{
          const devs = devices.filter(d=>d.room===room.name);
          const floor = FLOORS.find(f=>f.rooms.includes(room.name));
          const onCount = devs.filter(d=>d.status==='on').length;
          return (
            <div key={room.id} className="rounded-2xl p-3 border-2 relative overflow-hidden" style={{ background: 'var(--surface-2)', borderColor: floor?.color || 'var(--border)', borderWidth: 1.5 }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: floor?.color || 'transparent' }} />
              <p className="text-[12px] font-extrabold flex items-center gap-1.5" style={{color:'var(--text)'}}><Home className="w-3.5 h-3.5" style={{color: floor?.color || 'var(--text-muted)'}}/>{room.name}</p>
              <p className="text-[10px] font-bold mt-1" style={{color: floor?.color || 'var(--text-faint)'}}>{floor?.name || 'Unassigned'} · {onCount}/{devs.length} on</p>
              <div className="mt-2 space-y-1.5">
                {devs.length===0 && <p className="text-[11px] py-2 text-center rounded-lg" style={{background:'var(--surface)', color:'var(--text-faint)'}}>No devices — tap + to add</p>}
                {devs.map(d=>{
                  const icon = d.type==='light' ? Lightbulb : d.type==='tv' ? Tv : d.type==='fridge' ? Snowflake : d.type==='thermostat' ? Thermometer : d.type==='ac' ? Snowflake : Zap;
                  const Icon = icon;
                  return (
                    <div key={d.id} className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: 'var(--surface)', border: `1px solid ${d.status==='on' ? d.type==='light' ? '#F59E0B' : 'var(--green)' : 'var(--border)'}` }}>
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: d.status==='on' ? 'var(--accent-soft)' : 'var(--surface-2)' }}><Icon className="w-3.5 h-3.5" style={{ color: d.status==='on' ? 'var(--accent)' : 'var(--text-faint)' }} /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold truncate" style={{color:'var(--text)'}}>{d.name}</p>
                        <p className="text-[10px] font-mono" style={{color: d.status==='on' ? 'var(--text-muted)' : 'var(--text-faint)'}}>
                          {d.type==='ac' ? `${d.temp??24}°C` : d.type==='tv' ? `Vol ${d.volume??22}` : d.type==='light' ? `${d.brightness??80}%` : d.type==='fridge' ? `${d.temp??4}°C` : `${d.currentWatts}W`} · <span style={{color: d.status==='on' ? 'var(--green)' : 'var(--text-faint)'}}>{d.status}</span>
                        </p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${d.status==='on' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {FLOORS.map(f=>(
          <span key={f.id} className="chip" style={{ background: f.soft, color: f.color, border:`1px solid ${f.color}30` }}><span className="w-2 h-2 rounded-full" style={{background:f.color}} /> {f.name}</span>
        ))}
      </div>
    </div>
  );
}
