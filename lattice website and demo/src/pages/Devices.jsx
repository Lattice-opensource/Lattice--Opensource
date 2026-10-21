import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, Search, Pencil, RefreshCw, Cpu, Zap, Snowflake, Tv, Fan, ChevronRight, Plus, X, Lightbulb, Thermometer, Timer } from 'lucide-react';
import { useState } from 'react';
import { mockHome } from '../data/mockData.js';
import { useEnergy } from '../context/EnergyContext.jsx';

const iconFor = d => {
  const n = (d.name || '').toLowerCase();
  const t = d.type || '';
  if (t==='light' || n.includes('tubelight') || n.includes('light')) return Lightbulb;
  if (t==='thermostat' || n.includes('thermostat')) return Thermometer;
  if (t==='fridge' || n.includes('fridge') || n.includes('refrigerator')) return Snowflake;
  if (t==='washer' || n.includes('washing')) return Timer;
  if (t==='ac' || n.includes('ac') || n.includes('cool')) return Snowflake;
  if (n.includes('tv')) return Tv;
  if (n.includes('plug')) return Cpu;
  if (n.includes('cooler')) return Fan;
  return Zap;
};

export default function Devices() {
  const [devices, setDevices] = useState(mockHome.devices);
  const [searchingId, setSearchingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const { toggleDevice, addDevice } = useEnergy();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', room: mockHome.rooms[0]?.name || 'Living Room', watts: '' });
  const [addError, setAddError] = useState('');

  const handleAddDevice = () => {
    if (!addForm.name.trim()) { setAddError('Device name is required'); return; }
    const watts = Number(addForm.watts);
    if (!watts || watts < 5) { setAddError('Enter power (W) — e.g. 120'); return; }
    const newDev = addDevice({ name: addForm.name, room: addForm.room, baseWatts: watts });
    // keep local Devices page in sync so it shows in verified list
    setDevices(prev => [...prev, newDev]);
    setAddForm({ name: '', room: mockHome.rooms[0]?.name || 'Living Room', watts: '' });
    setAddError('');
    setShowAdd(false);
  };

  const handleToggleVerified = (id) => {
    toggleDevice(id);
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'on' ? 'off' : 'on' } : d));
  };

  const unknown = devices.filter(d => !d.identified);
  const guesses = devices.filter(d => d.identified && !d.verified);
  const verified = devices.filter(d => d.identified && d.verified);

  const searchOnline = d => {
    setSearchingId(d.id);
    setTimeout(() => {
      setDevices(prev =>
        prev.map(x => (x.id === d.id ? { ...x, identified: true, verified: true, name: x.name.replace(' (unknown)', ' — Water Heater') } : x))
      );
      setSearchingId(null);
    }, 1800);
  };

  const startEdit = d => {
    setEditingId(d.id);
    setEditName(d.name);
  };
  const saveEdit = id => {
    setDevices(prev => prev.map(x => (x.id === id ? { ...x, name: editName, identified: true, verified: true } : x)));
    setEditingId(null);
  };

  const Row = ({ d, action }) => (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
        {action === 'unknown' ? <Cpu className="w-4 h-4 text-muted" /> : <Icon d={d} />}
      </div>

      <div className="flex-1 min-w-0">
        {editingId === d.id ? (
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveEdit(d.id)}
            autoFocus
            className="input !py-1 text-[13px] w-full"
          />
        ) : (
          <Link to={`/device/${d.id}`} className="text-[13.5px] font-semibold truncate block hover:underline">
            {d.name}
          </Link>
        )}
        <p className="text-[11px] text-faint">{d.room} · ₹{d.monthCost.toLocaleString('en-IN')}/mo · <span className="font-mono" style={{ color: d.status==='on' ? 'var(--text-muted)' : 'var(--text-faint)' }}>{(()=>{ if(d.type==='ac'||d.type==='thermostat') return `${d.temp??d.targetTemp??24}°C · ${d.status==='on'?'ON':'OFF'}`; if(d.type==='fridge') return `${d.temp??4}°C · ${d.status==='on'?'ON':'OFF'}`; if(d.type==='tv') return `Vol ${d.volume??22} · ${d.status==='on'?'ON':'OFF'}`; if(d.type==='light') return `${d.brightness??80}% · ${d.status==='on'?'ON':'OFF'}`; if(d.type==='cooler') return `Fan ${d.fanSpeed??3} · ${d.status==='on'?'ON':'OFF'}`; if(d.type==='washer') return `${d.cycle||'normal'} · ${d.status==='on'?'ON':'OFF'}`; return d.status; })()}</span></p>
      </div>

      <span
        className="chip shrink-0"
        style={
          action === 'verified'
            ? { background: 'var(--green-soft)', color: 'var(--green)' }
            : action === 'guess'
              ? { background: 'var(--amber-soft)', color: 'var(--amber)' }
              : { background: 'var(--accent-soft)', color: 'var(--accent)' }
        }
      >
        {action === 'verified' && 'AI verified'}
        {action === 'guess' && 'Needs you'}
        {action === 'unknown' && 'Unidentified'}
      </span>

      {action === 'verified' ? (
        <button
          onClick={() => handleToggleVerified(d.id)}
          className={`switch ${d.status === 'on' ? 'on' : ''}`}
          title="Toggle"
        />
      ) : (
        <button
          onClick={() => (action === 'guess' ? startEdit(d) : searchOnline(d))}
          className="btn btn-ghost !px-3 !py-1.5 !text-[11px] shrink-0"
        >
          {action === 'guess' && <><Pencil className="w-3 h-3" /> Correct</>}
          {action === 'unknown' &&
            (searchingId === d.id ? (
              <><Search className="w-3 h-3 animate-pulse" /> scanning…</>
            ) : (
              <><Search className="w-3 h-3" /> AI identify</>
            ))}
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Devices & AI</h1>
          <p className="text-[13px] text-muted mt-1">
            AI studies usage patterns, verifies specs online — you have the final say.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowAdd(true)} className="btn btn-primary !px-3.5 !py-2">
            <Plus className="w-4 h-4" /> Add device
          </button>
          <button className="btn btn-ghost !px-3 !py-2" title="Re-scan">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {unknown.length > 0 && (
        <div className="card p-4 mb-5">
          <p className="label mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            Needs AI identification · {unknown.length}
          </p>
          {unknown.map(d => (
            <Row key={d.id} d={d} action="unknown" />
          ))}
          {unknown[0] && !searchingId && (
            <p className="text-[11px] text-faint pl-12 -mt-1">
              Usage pattern: {unknown[0].pattern}
            </p>
          )}
        </div>
      )}

      {guesses.length > 0 && (
        <div className="card p-4 mb-5">
          <p className="label mb-1">Needs your confirmation · {guesses.length}</p>
          {guesses.map(d => (
            <div key={d.id} className="divide-y" style={{ borderColor: 'var(--border)' }}>
              <Row d={d} action="guess" />
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2 ml-12">
            <button
              onClick={() => setDevices(prev => prev.map(x => (x.id === guesses[0].id ? { ...x, verified: true } : x)))}
              className="btn btn-primary !px-3 !py-1.5 !text-[11px]"
            >
              <CheckCircle2 className="w-3 h-3" /> Confirm guess
            </button>
            <button onClick={() => startEdit(guesses[0])} className="btn btn-ghost !px-3 !py-1.5 !text-[11px]">
              <Pencil className="w-3 h-3" /> Correct details
            </button>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="label">Identified & verified · {verified.length}</p>
          <span className="text-[11px] text-faint flex items-center">
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
        {verified.map(d => (
          <Row key={d.id} d={d} action="verified" />
        ))}
        {verified.length === 0 && <p className="text-[12px] text-faint py-3 text-center">No verified devices yet — add one above.</p>}
      </div>

      {/* Add device modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative card p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-extrabold flex items-center gap-2"><Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Add another device</h3>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost !p-2"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-faint mb-1.5 block">Device name</label>
                <input
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Bedroom Heater"
                  className="input w-full text-[13px]"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-faint mb-1.5 block">Room</label>
                  <select
                    value={addForm.room}
                    onChange={e => setAddForm(f => ({ ...f, room: e.target.value }))}
                    className="input w-full text-[13px]"
                  >
                    {mockHome.rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-faint mb-1.5 block">Power (W)</label>
                  <input
                    value={addForm.watts}
                    onChange={e => setAddForm(f => ({ ...f, watts: e.target.value }))}
                    placeholder="e.g. 1500"
                    type="number"
                    min="5"
                    className="input w-full text-[13px] font-mono"
                  />
                </div>
              </div>
              {addError && <p className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>{addError}</p>}
              <p className="text-[11px] text-faint leading-relaxed">It will appear as <span className="font-bold text-muted">AI verified</span> and show in Dashboard, Usage and Rooms instantly.</p>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowAdd(false)} className="btn btn-ghost !px-4 !py-2">Cancel</button>
                <button onClick={handleAddDevice} className="btn btn-primary !px-5 !py-2"><Plus className="w-4 h-4" /> Add device</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function Icon({ d }) {
    const I = iconFor(d);
    return <I className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />;
  }
}