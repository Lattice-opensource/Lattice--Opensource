import { useOutletContext, Link } from 'react-router-dom';
import { Bolt, Zap, Power, ChevronRight, Home, Moon, Play, AlertTriangle, Sparkles, X, SlidersHorizontal, Activity, RotateCcw, Sun, Battery, Plug, Search, Bell, User, TrendingUp, TrendingDown, Droplets, FlaskConical, PiggyBank, Lightbulb, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { useEnergy } from '../context/EnergyContext.jsx';
import { mockHome, dailyProfile, anomalies, potentialSavings } from '../data/mockData.js';
import FloorCircular from '../components/FloorCircular.jsx';
import HourlyLineGraph from '../components/HourlyLineGraph.jsx';
import EnvironmentalImpact from '../components/EnvironmentalImpact.jsx';
import BigBreakdownBar from '../components/BigBreakdownBar.jsx';
import TodaysReport from '../components/TodaysReport.jsx';
import EnergyAlerts from '../components/EnergyAlerts.jsx';

export default function Dashboard() {
  const outlet = useOutletContext() || {};
  const beta = typeof outlet.beta === 'boolean' ? outlet.beta : (typeof window !== 'undefined' && localStorage.getItem('lattice-beta') === '1');
  const setBeta = outlet.setBeta || ((fn) => {
    const next = typeof fn === 'function' ? fn(beta) : fn;
    localStorage.setItem('lattice-beta', next ? '1' : '0');
    // reload to reflect in Shell (which reads from App state) — dispatch event
    window.location.reload();
  });

  const { devices, paused, setPaused, toggleDevice, toggleRoom, setAll, nightMode, setRoomState, addDevice, totalWatts, totalToday, totalMonth } = useEnergy();
  const [pendingRoom, setPendingRoom] = useState(null);
  const onDevices = devices.filter(d => d.status === 'on');

  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    watts: devices.reduce((s, d) => s + (dailyProfile(d, i * 7)[i]?.watts ?? 0), 0),
  }));
  const hogs = [...devices].filter(d => d.monthCost > 0).sort((a, b) => b.monthCost - a.monthCost).slice(0, 3);
  const delta = totalToday - mockHome.yesterdayTotal;
  const savings = potentialSavings();
  const waste = anomalies.find(a => a.deviceId && a.kind === 'high');

  // SolarSync-style Energy Flow data
  const gridKwh = 4.05, solarKwh = 6.86, totalKwh = totalToday || 10.9;

  const requestToggleRoom = (roomName) => {
    const dvs = devices.filter(d => d.room === roomName);
    if (roomName === 'Guest Room' && dvs.length === 0) { addDevice({ name: 'Guest Light', room: 'Guest Room', baseWatts: 60 }); return; }
    const anyOn = dvs.some(d => d.status === 'on');
    if (anyOn) setPendingRoom({ name: roomName, devices: dvs.filter(d => d.status === 'on') });
    else {
      if (roomName === 'Utility' || roomName === 'Guest Room') setRoomState(roomName, true);
      else toggleRoom(roomName);
    }
  };

  if (!beta) {
    // ===== STABLE DASHBOARD — classic Lattice layout (dark, compact) =====
    const maxHog = hogs[0]?.monthCost || 1;
    return (
      <div className="flex flex-col gap-4 pb-6">
        {/* Switch to BETA prompt — top priority as requested */}
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)', color: '#fff' }}><FlaskConical className="w-5 h-5" /></span>
            <div>
              <p className="text-sm font-black">New BETA dashboard available</p>
              <p className="text-xs text-muted">PDF-inspired light layout with Energy Flow, Quick Access & more — preview it now.</p>
            </div>
          </div>
          <button onClick={() => setBeta(true)} className="btn btn-primary !px-5 whitespace-nowrap">
            <FlaskConical className="w-4 h-4" /> Switch to BETA
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">{mockHome.name} · Home Assistant</h1>
            <p className="text-xs text-muted mt-1">Stable view — {onDevices.length} devices on · {totalWatts.toLocaleString('en-IN')} W live</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: paused ? 'rgba(100,116,139,0.15)' : 'var(--green-soft)', color: paused ? 'var(--text-muted)' : 'var(--green)' }}>{paused ? 'paused' : 'live'}</span>
        </div>

        {/* 01 Spend */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="label">01 · Estimated spend today</p>
            <p className="text-[34px] font-black leading-none mt-2">₹{totalToday.toLocaleString('en-IN')}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="chip" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><Zap className="w-3 h-3" /> {totalWatts.toLocaleString('en-IN')} W live</span>
              <span className="chip" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>≈ ₹{Math.round(totalMonth).toLocaleString('en-IN')}/mo</span>
              <span className="chip" style={{ background: delta > 0 ? 'var(--amber-soft)' : 'var(--green-soft)', color: delta > 0 ? 'var(--amber)' : 'var(--green)' }}>{delta > 0 ? '+' : '−'}₹{Math.abs(delta)} vs yesterday</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPaused(p => !p)} className="btn btn-ghost !px-3 !py-1.5 !text-xs"><Power className="w-3 h-3" /> {paused ? 'Resume live' : 'Pause live'}</button>
              <Link to="/insights" className="btn btn-ghost !px-3 !py-1.5 !text-xs">Insights <ChevronRight className="w-3 h-3" /></Link>
            </div>
          </div>
          <div className="card p-5">
            <p className="label">02 · Waste & Savings</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-xl p-4 border" style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'var(--amber-soft)' }}>
                <p className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--amber)' }}><AlertTriangle className="w-3.5 h-3.5" /> Potential Waste</p>
                <p className="text-sm font-extrabold mt-2 leading-snug">{waste ? waste.title : 'No waste detected'} {waste && <span style={{ color: 'var(--amber)' }}>+{waste.aboveUsualPercent}%</span>}</p>
                {waste && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Extra <span className="font-bold" style={{ color: 'var(--amber)' }}>₹{waste.extraCostWeek}/wk</span></p>}
              </div>
              <div className="rounded-xl p-4 border" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'var(--green-soft)' }}>
                <p className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--green)' }}><Sparkles className="w-3.5 h-3.5" /> Savings</p>
                <p className="text-2xl font-black leading-none mt-2" style={{ color: 'var(--green)' }}>₹{savings}<span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>/mo</span></p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Unusual patterns</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-3 flex flex-wrap items-center gap-2">
          <span className="label">03 · Quick actions</span>
          <button onClick={() => setAll('on')} className="btn btn-ghost !px-3 !py-1.5 !text-xs"><Play className="w-3 h-3" /> All on</button>
          <button onClick={nightMode} className="btn btn-ghost !px-3 !py-1.5 !text-xs"><Moon className="w-3 h-3" /> Night</button>
          <button onClick={() => setAll('off')} className="btn btn-ghost !px-3 !py-1.5 !text-xs"><Power className="w-3 h-3" /> All off</button>
          <span className="ml-auto text-xs text-faint hidden sm:inline">Tip: Switch to BETA for the new PDF layout</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="label">04 · Today's curve</p>
                <p className="text-sm font-extrabold">Whole-home watts — line</p>
              </div>
              <Activity className="w-4 h-4 text-muted" />
            </div>
            <HourlyLineGraph data={hours} />
            <Link to="/usage" className="flex items-center gap-1 text-xs font-bold mt-3" style={{ color: 'var(--accent)' }}>Full breakdown <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-extrabold">Devices · {onDevices.length} on</p>
              <Bolt className="w-4 h-4 text-muted" />
            </div>
            <div className="divide-y max-h-[260px] overflow-auto pr-1 no-scrollbar" style={{ borderColor: 'var(--border)' }}>
              {devices.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'on' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <Link to={`/device/${d.id}`} className="flex-1 min-w-0 hover:underline">
                    <p className="text-sm font-semibold truncate">{d.name}</p>
                    <p className="text-xs text-faint">{d.room} · ₹{d.monthCost.toLocaleString('en-IN')}/mo</p>
                  </Link>
                  <p className="text-xs font-mono w-[70px] text-right" style={{ color: d.status === 'on' ? 'var(--text)' : 'var(--text-faint)' }}>{d.currentWatts > 0 ? `${d.currentWatts} W` : '—'}</p>
                  <button onClick={() => toggleDevice(d.id)} className={`switch ${d.status === 'on' ? 'on' : ''}`} />
                </div>
              ))}
            </div>
            <Link to="/devices" className="flex items-center gap-1 text-xs font-bold mt-3" style={{ color: 'var(--accent)' }}>Manage & identify <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="text-sm font-extrabold mb-3">Rooms — tap to toggle</p>
            <div className="grid grid-cols-2 gap-3">
              {mockHome.rooms.map(r => {
                const dvs = devices.filter(d => d.room === r.name);
                const w = dvs.reduce((s, d) => s + d.currentWatts, 0);
                const c = dvs.reduce((s, d) => s + d.monthCost, 0);
                const roomOn = dvs.some(d => d.status === 'on');
                return (
                  <div key={r.id} className="rounded-xl p-4 border flex flex-col" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm font-bold truncate"><Home className="w-4 h-4 text-muted" />{r.name}</span>
                      <button onClick={() => requestToggleRoom(r.name)} className={`switch ${roomOn ? 'on' : ''} scale-90`} />
                    </div>
                    <p className="text-xs font-mono" style={{ color: w > 0 ? 'var(--text)' : 'var(--text-faint)' }}>{w > 0 ? `${w} W` : 'idle'}</p>
                    <p className="text-xs text-faint">₹{c.toLocaleString('en-IN')}/mo · {dvs.length} device{dvs.length !== 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card p-5">
            <p className="text-sm font-extrabold mb-3">Highest consumers</p>
            {hogs.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: i === 0 ? 'var(--amber-soft)' : 'var(--surface-2)' }}>
                  {i === 0 ? <Bolt className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} /> : <Zap className="w-3.5 h-3.5 text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{d.name}</p>
                  {anomalies.find(a => a.deviceId === d.id && a.kind === 'high') && (
                    <p className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--amber)' }}><AlertTriangle className="w-3 h-3" /> {anomalies.find(a => a.deviceId === d.id).aboveUsualPercent}% above usual</p>
                  )}
                </div>
                <div className="w-24 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--surface-2)' }}><div className="h-full rounded-full" style={{ width: `${Math.max(8, (d.monthCost / maxHog) * 100)}%`, background: i === 0 ? 'var(--amber)' : 'var(--accent)' }} /></div>
                <p className="text-sm font-bold w-[86px] text-right shrink-0" style={{ color: i === 0 ? 'var(--amber)' : 'var(--text)' }}>₹{d.monthCost.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        <EnergyAlerts />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5"><EnvironmentalImpact /></div>
          <div className="card p-5"><TodaysReport /></div>
        </div>
        <div className="card p-6"><FloorCircular /></div>
        <BigBreakdownBar />

        {pendingRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPendingRoom(null)} />
            <div className="relative card p-6 w-full max-w-md shadow-2xl" style={{ borderColor: 'rgba(251,191,36,0.5)' }}>
              <div className="flex items-start gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: 'var(--amber-soft)' }}>⚠️</span>
                <div>
                  <h3 className="text-base font-extrabold leading-tight">⚠️ Warning — Turn off {pendingRoom.name}? 🚨</h3>
                  <p className="text-xs text-muted mt-1">You are about to turn OFF the entire room. The following will be turned off:</p>
                </div>
              </div>
              <div className="rounded-xl p-3 mb-4 space-y-2" style={{ background: 'var(--amber-soft)', border: '1px solid rgba(251,191,36,0.25)' }}>
                {pendingRoom.devices.map(d => (
                  <p key={d.id} className="text-sm font-semibold flex items-center gap-2"><span>⚠️</span> {d.name} <span className="text-xs font-mono text-muted">({d.currentWatts} W)</span> <span>🔌</span></p>
                ))}
                <p className="text-xs font-bold mt-2 flex items-center gap-1" style={{ color: 'var(--amber)' }}>⚡ All listed devices will lose power! ⚡</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setPendingRoom(null)} className="btn btn-ghost !px-4 !py-2">Cancel</button>
                <button onClick={() => { setRoomState(pendingRoom.name, false); setPendingRoom(null); }} className="btn btn-primary !px-5 !py-2" style={{ background: '#F59E0B', color: '#fff' }}>⚠️ Yes, turn off</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== BETA DASHBOARD — PDF-inspired layout =====
  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Header like PDFs: greeting + search + user */}
      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight">Welcome back! <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-black" style={{ background: 'var(--accent)', color: '#fff' }}><FlaskConical className="w-3 h-3" /> BETA</span></h1>
          <p className="text-[13px] text-muted mt-1">Here's what's happening with your energy today — {mockHome.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input placeholder="Search devices..." className="pl-9 pr-4 py-2 rounded-full border text-sm" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }} />
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}><Bell className="w-4 h-4" /></button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">G</div>
        </div>
      </div>

      {/* Stats row - NiceDash / Tailwindadmin / Dashnext style 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}><Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} /></div>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>Live</span>
          </div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-muted mt-3">Total Consumption</p>
          <p className="text-2xl font-black mt-1">{totalToday} <span className="text-sm font-bold text-muted">kWh</span></p>
          <p className="text-xs text-muted mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> {totalWatts} W live</p>
          <div className="mt-3 h-8 flex items-end gap-1">
            {hours.slice(0, 12).map((h,i)=><div key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(6, (h.watts/2000)*100)}%`, background: 'var(--accent)', opacity: 0.3 + i*0.05 }} />)}
          </div>
        </div>
        <div className="card p-5" style={{ background: '#10B981', color: 'white', borderColor: '#059669' }}>
          <div className="flex items-center justify-between text-white">
            <Sun className="w-6 h-6" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-xs font-bold tracking-widest uppercase opacity-80 mt-3">Solar Production</p>
          <p className="text-2xl font-black mt-1">{solarKwh} <span className="text-sm opacity-80">kWh</span></p>
          <p className="text-xs opacity-80 mt-1">Today • 6.86 kWh total</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE' }}><Plug className="w-5 h-5 text-blue-600" /></div>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-muted mt-3">Grid Import</p>
          <p className="text-2xl font-black mt-1">{gridKwh} <span className="text-sm text-muted">kWh</span></p>
          <p className="text-xs text-muted">Net • 4.05 kWh</p>
        </div>
        <div className="card p-5" style={{ background: '#FEF3C7', borderColor: '#FCD34D' }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#92400E' }}>Potential Savings</p>
          <p className="text-2xl font-black mt-1" style={{ color: '#92400E' }}>₹{savings}<span className="text-sm">/mo</span></p>
          <p className="text-xs mt-1" style={{ color: '#B45309' }}>Unusual patterns detected</p>
          <div className="mt-3 flex gap-1">
            {[40,60,30,80,50,70].map((h,i)=><div key={i} className="flex-1 rounded-sm" style={{ height: '20px', background: i%2?'#F59E0B':'#FCD34D', opacity: 0.6 }} />)}
          </div>
        </div>
      </div>

      {/* K-WD + Energy Usage + Weekend Plan row — from PDFs */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="label">K-WD · Monthly Expenses</p>
              <p className="text-sm font-black">45% <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>↗ 31.2%</span></p>
            </div>
            <SlidersHorizontal className="w-4 h-4 text-muted" />
          </div>
          <div className="flex items-end gap-1 h-28">
            {['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'].map((m,i)=> {
              const h1 = [72,78,72,88,36,28,78,22,70,80,98,62][i];
              const h2 = [72,86,82,38,60,24,42,42,36,58,76,58][i];
              return (
                <div key={m} className="flex-1 flex items-end gap-0.5 justify-center" style={{ height: '100%' }}>
                  <div className="flex-1 rounded-t" style={{ height: `${h1}%`, background: '#3B82F6' }} />
                  <div className="flex-1 rounded-t" style={{ height: `${h2}%`, background: '#10B981' }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-faint mt-1"><span>M 1</span><span>M 12</span></div>
        </div>
        <div className="card p-5 flex flex-col justify-between" style={{ background: '#0F766E', color: 'white', borderColor: '#0B5C56' }}>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-widest uppercase opacity-80">Recomended</p>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></span>
            </div>
            <h3 className="text-lg font-black mt-4">Weekend Plan!</h3>
            <p className="text-sm opacity-80 mt-1 leading-snug">Changing plan can reduce your costs by <span className="font-black text-white">17%</span></p>
          </div>
          <button className="mt-6 bg-white text-[#0F766E] rounded-full px-4 py-2 text-sm font-black hover:bg-white/90">Change Plan</button>
          <p className="text-xs opacity-60 mt-3 flex items-center gap-1"><Zap className="w-3 h-3" /> Energy Usage PDF-inspired</p>
        </div>
      </div>

      {/* Energy Flow - SolarSync horizontal bars */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-lg flex items-center gap-2"><Activity className="w-5 h-5" style={{ color: '#0891B2' }} /> Energy Flow</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--surface-2)' }}>Weekly</span>
            <span className="w-8 h-6 rounded-full flex items-center p-1" style={{ background: '#F59E0B' }}><span className="w-4 h-4 rounded-full bg-white block ml-auto" /></span>
            <span className="text-xs font-bold">Eco Mode 30%</span>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Grid', value: '230 v/m', sub: 'Grid 4.05 kWh', color: '#3B82F6', width: '85%' },
            { label: 'Solar', value: '230 v/m', sub: '170 wh', color: '#F59E0B', width: '65%' },
            { label: 'Battery', value: '—', sub: '24 • 180 wh', color: '#10B981', width: '40%' },
          ].map(row=>(
            <div key={row.label} className="grid grid-cols-[80px_1fr_100px] items-center gap-3">
              <span className="text-xs font-bold">{row.label}</span>
              <div className="h-8 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-2)' }}>
                <div className="h-full rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white" style={{ width: row.width, background: row.color }}>{row.value}</div>
              </div>
              <span className="text-xs text-muted text-right">{row.sub}</span>
            </div>
          ))}
          <div className="h-12 rounded-xl flex items-center justify-center font-bold text-white mt-2" style={{ background: 'linear-gradient(90deg, #06B6D4, #F59E0B)' }}>
            Home • {totalKwh} kWh
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}><p className="font-bold">Washing 0.06 kWh</p><p className="text-muted">Dryer</p></div>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}><p className="font-bold">AC 0.04 kWh</p><p className="text-muted">Air conditioning</p></div>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}><p className="font-bold">0.68 kWh</p><p className="text-muted">Untracked</p></div>
          </div>
        </div>
      </div>

      {/* Quick Access + Energy Overview side by side like SolarSync */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black">Quick Access</h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--surface-2)' }}>Bedroom</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {devices.slice(0,4).map(d=>(
              <div key={d.id} className="rounded-2xl p-4 border text-center" style={{ background: d.status==='on'?'#FEF3C7':'var(--surface-2)', borderColor: d.status==='on'?'#FCD34D':'var(--border)' }}>
                <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center" style={{ background: 'white' }}>
                  <Home className="w-6 h-6" style={{ color: d.status==='on'?'#F59E0B':'var(--text-muted)' }} />
                </div>
                <p className="text-xs font-bold mt-2 truncate">{d.name}</p>
                <p className="text-xs text-muted">{d.room}</p>
                <button onClick={()=>toggleDevice(d.id)} className={`mt-2 w-full py-1.5 rounded-full text-xs font-bold ${d.status==='on'?'bg-amber-400 text-white':'bg-white border'}`}>{d.status==='on'?'On':'Off'}</button>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-black mb-4">Energy Overview</h3>
          <div className="flex items-end gap-1 h-24">
            {hours.map((h,i)=><div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(6, (h.watts/2000)*100)}%`, background: i%3===0?'#F59E0B': i%3===1?'#10B981':'#E5E7EB' }} />)}
          </div>
          <div className="flex justify-between text-xs text-muted mt-2"><span>167 kWh</span><span>Weekly</span></div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs"><span>Production</span><span className="font-bold">40 kWh</span></div>
            <div className="flex justify-between text-xs"><span>Usage</span><span className="font-bold">32 kWh</span></div>
          </div>
        </div>
      </div>

      {/* Homeowner row — what YOU want to see: bill split, week cost, savings actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-black mb-1 flex items-center gap-2"><PiggyBank className="w-4 h-4" /> Where your bill goes</h3>
          <p className="text-xs text-muted mb-3">This month · ₹{Math.round(totalMonth).toLocaleString('en-IN')} projected</p>
          <div className="flex items-center justify-center py-2">
            {(() => {
              const top = hogs.slice(0, 3);
              const topSum = top.reduce((s, d) => s + d.monthCost, 0);
              const rest = Math.max(0, totalMonth - topSum);
              const total = Math.max(1, topSum + rest);
              const p0 = (top[0]?.monthCost || 0) / total * 100;
              const p1 = (top[1]?.monthCost || 0) / total * 100;
              const p2 = (top[2]?.monthCost || 0) / total * 100;
              return (
                <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#F59E0B 0 ${p0}%, #3B82F6 ${p0}% ${p0 + p1}%, #10B981 ${p0 + p1}% ${p0 + p1 + p2}%, var(--surface-2) ${p0 + p1 + p2}% 100%)` }}>
                  <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center" style={{ background: 'var(--surface)' }}><p className="text-[10px] font-bold text-muted">This month</p><p className="text-base font-black">₹{Math.round(totalMonth).toLocaleString('en-IN')}</p></div>
                </div>
              );
            })()}
          </div>
          <div className="space-y-1.5 text-xs mt-2">
            {hogs.slice(0, 3).map((d, i) => (
              <div key={d.id} className="flex justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: ['#F59E0B', '#3B82F6', '#10B981'][i] }} /><span className="truncate">{d.name}</span></span>
                <span className="font-bold shrink-0">₹{d.monthCost.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex justify-between text-muted"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} /> Everything else</span><span className="font-bold" style={{ color: 'var(--text)' }}>₹{Math.max(0, Math.round(totalMonth - hogs.slice(0, 3).reduce((s, d) => s + d.monthCost, 0))).toLocaleString('en-IN')}</span></div>
          </div>
          <Link to="/usage" className="flex items-center gap-1 text-xs font-bold mt-3" style={{ color: 'var(--accent)' }}>Full breakdown <ChevronRight className="w-3.5 h-3.5" /></Link>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Your week, per day</h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--surface-2)' }}>₹ / day</span>
          </div>
          <p className="text-xs text-muted mb-3">Today so far · <span className="font-black" style={{ color: 'var(--text)' }}>₹{totalToday.toLocaleString('en-IN')}</span> {delta > 0 ? `· +₹${Math.abs(delta)} vs yesterday` : '· less than yesterday'}</p>
          <div className="h-32 flex items-end gap-1.5">
            {(() => {
              const base = Math.max(1, totalToday);
              const week = [0.82, 0.95, 1.1, 0.9, 1.0, 1.25, 1.0];
              const max = Math.max(...week);
              const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
              return week.map((f, i) => {
                const isToday = i === 6;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end" style={{ height: '100%' }}>
                    <span className="text-[10px] font-bold" style={{ color: isToday ? 'var(--accent)' : 'var(--text-faint)' }}>₹{Math.round(base * f)}</span>
                    <div className="w-full rounded-t" style={{ height: `${(f / max) * 62}%`, background: isToday ? 'var(--accent)' : i === 5 ? '#F59E0B' : 'var(--surface-2)', border: isToday ? 'none' : '1px solid var(--border)' }} />
                    <span className="text-[10px] text-faint">{days[i]}</span>
                  </div>
                );
              });
            })()}
          </div>
          <div className="flex justify-between text-xs mt-2 text-muted"><span>Avg ₹{Math.round(totalToday).toLocaleString('en-IN')}/day</span><span>Peak Sat</span></div>
        </div>
        <div className="card p-5 flex flex-col" style={{ background: '#FEF3C7', borderColor: '#FCD34D' }}>
          <h3 className="font-black flex items-center gap-2" style={{ color: '#92400E' }}><Lightbulb className="w-4 h-4" /> Save next</h3>
          <p className="text-xs mt-1" style={{ color: '#B45309' }}>3 things worth doing — up to <span className="font-black">₹{savings}/mo</span></p>
          <div className="mt-3 space-y-2 text-xs">
            {hogs.slice(0, 2).map(d => (
              <div key={d.id} className="rounded-xl p-3 bg-white/70 border border-amber-200">
                <p className="font-bold" style={{ color: '#92400E' }}>Trim {d.name}</p>
                <p className="mt-0.5" style={{ color: '#B45309' }}>Runs high · ₹{d.monthCost.toLocaleString('en-IN')}/mo — try 1h less / eco mode.</p>
              </div>
            ))}
            <div className="rounded-xl p-3 bg-white/70 border border-amber-200">
              <p className="font-bold" style={{ color: '#92400E' }}>Shift to off-peak</p>
              <p className="mt-0.5" style={{ color: '#B45309' }}>Run washer/dryer at night — same use, lower bill.</p>
            </div>
          </div>
          <Link to="/insights" className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-black" style={{ color: '#92400E' }}>View my savings <ChevronRight className="w-4 h-4" /></Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-black mb-3">Usage — Wavy Line + Bars (like Energy Usage PDF)</h3>
          <HourlyLineGraph data={hours} />
        </div>
        <div className="card p-5">
          <h3 className="font-black mb-3">Yearly Backup — Donut</h3>
          <div className="h-48 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 flex items-center justify-center" style={{ borderColor: '#3B82F6', borderRightColor: '#E5E7EB', borderBottomColor: '#F59E0B' }}>
              <div className="text-center"><p className="font-black">$30,368</p><p className="text-xs text-muted">2025</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <FloorCircular />
      </div>

      <EnergyAlerts />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5"><EnvironmentalImpact /></div>
        <div className="card p-5"><TodaysReport /></div>
      </div>
      <BigBreakdownBar />

      {pendingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPendingRoom(null)} />
          <div className="relative card p-6 w-full max-w-md shadow-2xl" style={{ borderColor: 'rgba(251,191,36,0.5)' }}>
            <div className="flex items-start gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: 'var(--amber-soft)' }}>⚠️</span>
              <div>
                <h3 className="text-base font-extrabold leading-tight">⚠️ Warning — Turn off {pendingRoom.name}? 🚨</h3>
                <p className="text-xs text-muted mt-1">You are about to turn OFF the entire room.</p>
              </div>
            </div>
            <div className="rounded-xl p-3 mb-4 space-y-2" style={{ background: 'var(--amber-soft)', border: '1px solid rgba(251,191,36,0.25)' }}>
              {pendingRoom.devices.map(d => (
                <p key={d.id} className="text-sm font-semibold flex items-center gap-2"><span>⚠️</span> {d.name} <span className="text-xs font-mono text-muted">({d.currentWatts} W)</span> <span>🔌</span></p>
              ))}
              <p className="text-xs font-bold mt-2 flex items-center gap-1" style={{ color: 'var(--amber)' }}>⚡ All listed devices will lose power! ⚡</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPendingRoom(null)} className="btn btn-ghost !px-4 !py-2">Cancel</button>
              <button onClick={() => { setRoomState(pendingRoom.name, false); setPendingRoom(null); }} className="btn btn-primary !px-5 !py-2" style={{ background: '#F59E0B', color: '#fff' }}>⚠️ Yes, turn off</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
