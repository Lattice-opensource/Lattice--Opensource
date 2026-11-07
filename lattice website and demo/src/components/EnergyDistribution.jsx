import { useState } from 'react';
import { Sun, Flame, Zap, Home, Battery, Droplets } from 'lucide-react';

const nodes = [
  { id: 'solar', label: 'Solar', value: '4.7 kWh', icon: Sun, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', x: 50, y: 18 },
  { id: 'gas', label: 'Gas', value: '0 m³', icon: Flame, color: '#991B1B', bg: 'rgba(153,27,27,0.12)', x: 85, y: 18 },
  { id: 'grid', label: 'Grid', value: '←0.76 kWh →4.71 kWh', icon: Zap, color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)', x: 15, y: 45 },
  { id: 'home', label: 'Home', value: '8.64 kWh', icon: Home, color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)', x: 70, y: 45, big: true },
  { id: 'battery', label: 'Battery', value: '↓0 kWh ↑0 kWh', icon: Battery, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)', x: 50, y: 82 },
  { id: 'water', label: 'Water', value: '0 L', icon: Droplets, color: '#06B6D4', bg: 'rgba(6,182,214,0.12)', x: 85, y: 82 },
];

export default function EnergyDistribution() {
  const [hover, setHover] = useState(null);
  const home = nodes.find(n=>n.id==='home');

  return (
    <div className="card p-5 sm:p-6">
      <p className="text-[16px] font-extrabold tracking-tight" style={{color:'var(--text)'}}>Energy distribution today</p>
      <p className="text-[11px] mt-1" style={{color:'var(--text-faint)'}}>Tap a node — colourful & interactive</p>

      <div className="relative mt-4" style={{ height: 340 }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {/* Lines to Home */}
          {nodes.filter(n=>n.id!=='home').map(n=>{
            const isH = hover===n.id || hover==='home';
            return (
              <path
                key={n.id}
                d={`M ${n.x} ${n.y} C ${n.x} ${(n.y+home.y)/2}, ${home.x} ${(n.y+home.y)/2}, ${home.x} ${home.y}`}
                fill="none"
                stroke={isH ? n.color : 'var(--border)'}
                strokeWidth={isH ? 1.2 : 0.8}
                strokeDasharray={n.id==='grid' ? '2 2' : '0'}
                opacity={isH ? 1 : 0.5}
                style={{ transition: 'all 0.2s' }}
              />
            );
          })}
          {/* dots at junction */}
          <circle cx={50} cy={45} r={0.9} fill="var(--accent)" opacity={0.9}/>
          <circle cx={52} cy={45} r={0.7} fill="#0EA5E9" />
        </svg>

        {/* Nodes */}
        {nodes.map(n=>{
          const isActive = hover===n.id;
          return (
            <button
              key={n.id}
              onMouseEnter={()=>setHover(n.id)}
              onMouseLeave={()=>setHover(null)}
              onClick={()=>setHover(isActive? null : n.id)}
              className="absolute flex flex-col items-center justify-center rounded-full border-2 text-center shadow-sm transition-all"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: 'translate(-50%, -50%)',
                width: n.big ? 84 : 68,
                height: n.big ? 84 : 68,
                background: isActive ? n.bg : 'var(--surface)',
                borderColor: isActive ? n.color : n.color,
                borderWidth: n.big ? 2.5 : 1.6,
                boxShadow: isActive ? `0 4px 18px ${n.color}30` : 'none',
                color: 'var(--text)',
              }}
            >
              <n.icon className="w-4 h-4 mb-1" style={{ color: n.color }} />
              <span className="text-[10px] font-bold" style={{ color: n.id==='home' ? n.color : 'var(--text-faint)' }}>{n.label}</span>
              <span className="text-[10px] font-mono font-bold leading-tight text-center px-1" style={{ color: n.big ? 'var(--text)' : 'var(--text-muted)', fontSize: n.id==='grid' ? 8 : 10 }}>{n.value}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {nodes.map(n=>(
          <span key={n.id} className="chip" style={{ background: n.bg, color: n.color, border:`1px solid ${n.color}30` }}>{n.label}: {n.value}</span>
        ))}
      </div>

      <a href="#" className="text-[12px] font-bold mt-3 inline-block" style={{ color: 'var(--accent)' }}>Go to the energy dashboard →</a>
    </div>
  );
}
