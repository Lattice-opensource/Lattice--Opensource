import { useParams, Link, useOutletContext } from 'react-router-dom';
import { BadgeCheck, Cpu, Pencil, Clock, IndianRupee, Zap, ArrowLeft, Thermometer, Volume2, Lightbulb, Snowflake, Tv, Fan, Droplets, Timer } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';
import { mockHome, dailyProfile } from '../data/mockData.js';
import { useState } from 'react';
import HourlyLineGraph from '../components/HourlyLineGraph.jsx';

export default function DeviceDetail() {
  const { id } = useParams();
  const { pro, activeColor } = useOutletContext();
  const { devices, toggleDevice } = useEnergy();
  const device = devices.find(d => d.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  if (!device) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-4">Device not found.</p>
        <Link to="/devices" className="font-semibold" style={{ color: 'var(--accent)' }}>← Back to devices</Link>
      </div>
    );
  }

  const hours = dailyProfile(device, device.id.charCodeAt(1) % 40);
  const todayUsed = hours.reduce((s, h) => s + h.watts, 0);
  const on = device.status === 'on';

  const save = () => {
    setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/devices" className="flex items-center gap-1.5 text-[12px] font-semibold mb-4" style={{ color: 'var(--accent)' }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to devices
      </Link>

      <div className="card p-5 sm:p-6 mb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: on ? 'var(--accent-soft)' : 'var(--surface-2)' }}>
              <Zap className="w-5 h-5" style={{ color: on ? 'var(--accent)' : 'var(--text-faint)' }} />
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && save()}
                  className="input !py-1.5 w-full"
                />
              ) : (
                <h1 className="text-lg font-extrabold tracking-tight truncate">{device.name}</h1>
              )}
              <p className="text-[12px] text-faint">{device.room}</p>
            </div>
          </div>
          <button
            onClick={() => toggleDevice(device.id)}
            className={`switch ${on ? 'on' : ''}`}
            title={on ? 'Turn off' : 'Turn on'}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {device.verified ? (
            <span className="chip" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
              <BadgeCheck className="w-3 h-3" /> AI verified spec
            </span>
          ) : device.identified ? (
            <span className="chip" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
              AI guess — confirm on Devices page
            </span>
          ) : (
            <span className="chip" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <Cpu className="w-3 h-3" /> Unidentified — run AI scan
            </span>
          )}
          <button
            onClick={() => { setEditing(true); setName(device.name); }}
            className="btn btn-ghost !px-2.5 !py-1 !text-[11px]"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center py-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <p className="text-lg font-bold leading-none">{device.currentWatts}<span className="text-[10px] text-muted"> W</span></p>
            <p className="label mt-1.5">Live now</p>
          </div>
          <div className="text-center py-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <p className="text-lg font-bold leading-none">{Math.round(todayUsed / 100) / 10}<span className="text-[10px] text-muted"> kWh</span></p>
            <p className="label mt-1.5">Today</p>
          </div>
          <div className="text-center py-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <p className="text-lg font-bold leading-none">₹{device.monthCost.toLocaleString('en-IN')}</p>
            <p className="label mt-1.5">This month</p>
          </div>
        </div>
      </div>

      {/* Device-specific live data */}
      <div className="card p-5 mb-5">
        <p className="label mb-3">Live controls — {device.type || 'generic'}</p>
        <DeviceControls device={device} />
      </div>

      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label">Today's usage curve</p>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <Clock className="w-3.5 h-3.5" /> 24h
          </span>
        </div>
        <HourlyLineGraph data={hours} height={128} />
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <IndianRupee className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <p className="font-bold text-[14px]">Cost math</p>
        </div>
        <div className="text-[13px] space-y-2">
          <p className="flex justify-between"><span className="text-muted">Usage today</span><span className="font-mono">{Math.round(todayUsed / 100) / 10} kWh</span></p>
          <p className="flex justify-between"><span className="text-muted">Tariff</span><span className="font-mono">₹{mockHome.tariff} / unit</span></p>
          <p className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="font-bold">Estimated cost today</span>
            <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>≈ ₹{Math.round((todayUsed / 100) * mockHome.tariff)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function DeviceControls({ device }) {
  const { updateDevice } = useEnergy();
  const on = device.status === 'on';
  const commonOff = !on ? 'opacity-50 pointer-events-none' : '';

  if (device.type === 'ac' || device.type === 'thermostat') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-bold"><Thermometer className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Temperature</span>
          <span className={`text-[12px] font-mono font-bold px-2 py-1 rounded-full ${!on ? 'bg-slate-200 text-slate-500' : ''}`} style={on ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : {}}>{device.temp ?? device.targetTemp ?? 24}°C {on ? '· ON' : '· OFF'}</span>
        </div>
        <div className={`flex items-center gap-3 ${commonOff}`}>
          <button onClick={()=>updateDevice(device.id, { temp: Math.max(16, (device.temp||24)-1) })} className="btn btn-ghost !px-3">−</button>
          <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--surface-2)' }}><div className="h-full rounded-full" style={{ width: `${(((device.temp||24)-16)/14)*100}%`, background: 'var(--accent)' }} /></div>
          <button onClick={()=>updateDevice(device.id, { temp: Math.min(30, (device.temp||24)+1) })} className="btn btn-ghost !px-3">+</button>
          <span className="font-mono text-[13px] w-12 text-right">{device.temp||24}°C</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <span className="rounded-lg px-2 py-2 text-center font-bold" style={{ background: 'var(--surface-2)' }}>Mode: {device.mode||'cool'}</span>
          <span className="rounded-lg px-2 py-2 text-center" style={{ background: 'var(--surface-2)' }}>Fan {device.fan||2}</span>
          <span className="rounded-lg px-2 py-2 text-center" style={{ background: on ? 'var(--green-soft)' : 'var(--surface-2)', color: on ? 'var(--green)' : 'var(--text-faint)' }}>{on ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    );
  }
  if (device.type === 'fridge') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
            <p className="text-[11px] text-faint flex items-center justify-center gap-1"><Snowflake className="w-3 h-3"/> Fridge</p>
            <p className="text-[18px] font-black mt-1">{device.temp ?? 4}°C</p>
            <div className={`flex justify-center gap-1 mt-2 ${commonOff}`}><button onClick={()=>updateDevice(device.id, { temp: Math.max(1, (device.temp||4)-1) })} className="btn btn-ghost !px-2 !py-1">−</button><button onClick={()=>updateDevice(device.id, { temp: Math.min(7, (device.temp||4)+1) })} className="btn btn-ghost !px-2 !py-1">+</button></div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
            <p className="text-[11px] text-faint">Freezer</p>
            <p className="text-[18px] font-black mt-1">{device.freezerTemp ?? -18}°C</p>
            <div className={`flex justify-center gap-1 mt-2 ${commonOff}`}><button onClick={()=>updateDevice(device.id, { freezerTemp: Math.max(-24, (device.freezerTemp||-18)-1) })} className="btn btn-ghost !px-2 !py-1">−</button><button onClick={()=>updateDevice(device.id, { freezerTemp: Math.min(-12, (device.freezerTemp||-18)+1) })} className="btn btn-ghost !px-2 !py-1">+</button></div>
          </div>
        </div>
        <p className="text-[11px] text-faint">Status: <span className="font-bold" style={{ color: on ? 'var(--green)' : 'var(--text-faint)' }}>{on ? 'ON · cooling' : 'OFF'}</span> · Mode {device.mode||'auto'}</p>
      </div>
    );
  }
  if (device.type === 'tv') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-bold"><Volume2 className="w-4 h-4" /> Volume</span>
          <span className="font-mono text-[12px] font-bold" style={{ color: on ? 'var(--text)' : 'var(--text-faint)' }}>{device.volume ?? 22} {on ? '· ON' : '· OFF'}</span>
        </div>
        <div className={`flex items-center gap-3 ${commonOff}`}>
          <Volume2 className="w-4 h-4 text-muted" />
          <input type="range" min="0" max="100" value={device.volume||22} onChange={e=>updateDevice(device.id, { volume: Number(e.target.value) })} className="flex-1 accent-[var(--accent)]" />
          <span className="font-mono text-[12px] w-8 text-right">{device.volume||22}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <span className="rounded-lg px-2 py-2 text-center" style={{ background: 'var(--surface-2)' }}><Tv className="w-3 h-3 inline mr-1"/> {device.channel||'HDMI 1'}</span>
          <span className="rounded-lg px-2 py-2 text-center" style={{ background: 'var(--surface-2)' }}>Brightness {device.brightness||70}%</span>
        </div>
      </div>
    );
  }
  if (device.type === 'light') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-bold"><Lightbulb className="w-4 h-4" style={{ color: on ? 'var(--amber)' : 'var(--text-faint)' }}/> Brightness</span>
          <span className="font-mono text-[12px] font-bold" style={{ color: on ? 'var(--amber)' : 'var(--text-faint)' }}>{device.brightness ?? 80}% {on ? '· ON' : '· OFF'}</span>
        </div>
        <div className={`flex items-center gap-3 ${commonOff}`}>
          <Lightbulb className="w-4 h-4" style={{ color: 'var(--amber)' }} />
          <input type="range" min="0" max="100" value={device.brightness||80} onChange={e=>updateDevice(device.id, { brightness: Number(e.target.value) })} className="flex-1" />
          <span className="font-mono text-[12px] w-8 text-right">{device.brightness||80}%</span>
        </div>
        <p className="text-[11px] text-faint">Color: {device.color||'warm white'} · {device.colorTemp||4000}K</p>
      </div>
    );
  }
  if (device.type === 'cooler') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[13px] font-bold"><Fan className="w-4 h-4"/> Fan Speed</span><span className="font-mono text-[12px] font-bold" style={{ color: on ? 'var(--text)' : 'var(--text-faint)' }}>{device.fanSpeed||3}/5 {on?'· ON':'· OFF'}</span></div>
        <div className={`flex items-center gap-2 ${commonOff}`}>
          <button onClick={()=>updateDevice(device.id, { fanSpeed: Math.max(1, (device.fanSpeed||3)-1) })} className="btn btn-ghost !px-3">−</button>
          <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--surface-2)' }}><div className="h-full rounded-full" style={{ width: `${((device.fanSpeed||3)/5)*100}%`, background: 'var(--accent)' }} /></div>
          <button onClick={()=>updateDevice(device.id, { fanSpeed: Math.min(5, (device.fanSpeed||3)+1) })} className="btn btn-ghost !px-3">+</button>
        </div>
        <p className="text-[11px] text-faint">Temp {device.temp||22}°C · Swing {device.swing?'ON':'OFF'} · {on?'ON':'OFF'}</p>
      </div>
    );
  }
  if (device.type === 'washer') {
    return (
      <div className="space-y-3">
        <p className="text-[13px] font-bold flex items-center gap-2"><Timer className="w-4 h-4"/> Cycle: {device.cycle||'normal'} · {device.temp||40}°C · {device.spin||800}rpm</p>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <span className="rounded-lg px-2 py-2 text-center" style={{ background: 'var(--surface-2)' }}>{device.cycle}</span>
          <span className="rounded-lg px-2 py-2 text-center" style={{ background: 'var(--surface-2)' }}>{device.temp}°C</span>
          <span className="rounded-lg px-2 py-2 text-center" style={{ background: on ? 'var(--green-soft)' : 'var(--surface-2)', color: on ? 'var(--green)' : 'var(--text-faint)' }}>{on?'ON':'OFF'}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-[13px]"><span className="font-bold">Status:</span> <span style={{ color: on ? 'var(--green)' : 'var(--text-faint)' }}>{on ? 'ON' : 'OFF'}</span> · {device.baseWatts}W</p>
      <p className="text-[11px] text-faint">Generic plug — on/off only.</p>
    </div>
  );
}