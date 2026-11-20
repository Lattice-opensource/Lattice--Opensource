import { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Shield, Users, Cpu, Plus, X, Search, MoreVertical, Trash2, UserPlus,
  Mail, CheckCircle2, Clock, ShieldCheck, ShieldAlert, Eye, Activity, Zap,
  ChevronRight, AlertTriangle, Settings2,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext.jsx';

const ROLES = {
  owner:     { label: 'Owner',        color: 'var(--accent)',  soft: 'var(--accent-soft)',  Icon: ShieldCheck },
  admin:     { label: 'Admin',        color: '#8B5CF6',        soft: 'rgba(139,92,246,0.14)', Icon: Shield },
  manager:   { label: 'Facility Mgr', color: '#0EA5E9',        soft: 'rgba(14,165,233,0.14)', Icon: Settings2 },
  analyst:   { label: 'Analyst',      color: 'var(--green)',   soft: 'var(--green-soft)',   Icon: Activity },
  viewer:    { label: 'Viewer',       color: 'var(--slate)',   soft: 'var(--slate-soft)',   Icon: Eye },
};

const STATUS = {
  active:  { label: 'Active',  color: 'var(--green)', soft: 'var(--green-soft)', Icon: CheckCircle2 },
  invited: { label: 'Invited', color: 'var(--amber)', soft: 'var(--amber-soft)', Icon: Clock },
  away:    { label: 'Away',    color: 'var(--slate)', soft: 'var(--slate-soft)', Icon: Eye },
};

const INITIAL_TEAM = [
  { id: 't1', name: 'Guruprasad K.', email: 'guruprasad.lattice@gmail.com', role: 'owner',  status: 'active',  lastActive: 'now',          devices: 3, initials: 'GK' },
  { id: 't2', name: 'Ananya Rao',    email: 'ananya.rao@lattice.io',        role: 'admin',  status: 'active',  lastActive: '12m ago',      devices: 2, initials: 'AR' },
  { id: 't3', name: 'Vikram Shah',   email: 'vikram.shah@lattice.io',       role: 'manager',status: 'active',  lastActive: '1h ago',       devices: 2, initials: 'VS' },
  { id: 't4', name: 'Meera Iyer',    email: 'meera.iyer@lattice.io',        role: 'analyst',status: 'active',  lastActive: '3h ago',       devices: 1, initials: 'MI' },
  { id: 't5', name: 'Rohan Gupta',   email: 'rohan.gupta@lattice.io',       role: 'viewer', status: 'invited', lastActive: '—',            devices: 0, initials: 'RG' },
  { id: 't6', name: 'Sana Qureshi',  email: 'sana.qureshi@lattice.io',      role: 'viewer', status: 'away',    lastActive: '2 days ago',   devices: 0, initials: 'SQ' },
];

export default function AdminConsole() {
  const { activeColor } = useOutletContext();
  const { devices, toggleDevice, addDevice, updateDevice } = useEnergy();

  const [tab, setTab] = useState('team');
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [query, setQuery] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'viewer' });
  const [deviceForm, setDeviceForm] = useState({ name: '', room: 'Living Room', watts: '' });
  const [toast, setToast] = useState(null);

  const flash = (msg, kind = 'ok') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 2600); };

  const filteredTeam = useMemo(
    () => team.filter(m => (m.name + m.email + m.role).toLowerCase().includes(query.toLowerCase())),
    [team, query]
  );

  const counts = useMemo(() => ({
    total: team.length,
    active: team.filter(m => m.status === 'active').length,
    invited: team.filter(m => m.status === 'invited').length,
    admins: team.filter(m => m.role === 'owner' || m.role === 'admin').length,
  }), [team]);

  /* team actions */
  const changeRole = (id, role) => {
    setTeam(t => t.map(m => (m.id === id ? { ...m, role } : m)));
    setMenuFor(null);
    flash(`Role updated to ${ROLES[role].label}`);
  };
  const removeMember = (id) => {
    const m = team.find(x => x.id === id);
    setTeam(t => t.filter(x => x.id !== id));
    setMenuFor(null);
    flash(`${m?.name} removed from the team`, 'warn');
  };
  const resendInvite = (id) => {
    setTeam(t => t.map(m => (m.id === id ? { ...m, status: 'invited' } : m)));
    setMenuFor(null);
    flash('Invite resent');
  };
  const sendInvite = () => {
    if (!invite.name.trim() || !/\S+@\S+\.\S+/.test(invite.email)) { flash('Enter a name and a valid email', 'err'); return; }
    const initials = invite.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    setTeam(t => [...t, { id: 't' + Date.now().toString(36), name: invite.name.trim(), email: invite.email.trim(), role: invite.role, status: 'invited', lastActive: '—', devices: 0, initials }]);
    setInvite({ name: '', email: '', role: 'viewer' });
    setShowInvite(false);
    flash('Invitation sent');
  };

  /* device actions */
  const handleAddDevice = () => {
    if (!deviceForm.name.trim()) { flash('Device name is required', 'err'); return; }
    const w = Number(deviceForm.watts);
    if (!w || w < 5) { flash('Enter rated power in watts', 'err'); return; }
    addDevice({ name: deviceForm.name, room: deviceForm.room, baseWatts: w });
    setDeviceForm({ name: '', room: 'Living Room', watts: '' });
    setShowAddDevice(false);
    flash(`“${deviceForm.name}” added and now monitored`);
  };
  const removeDevice = (id) => {
    const d = devices.find(x => x.id === id);
    updateDevice(id, { status: 'off' });
    flash(`“${d?.name}” unlinked from monitoring`, 'warn');
  };

  const tabs = [
    { key: 'team', label: 'Team members', Icon: Users, n: team.length },
    { key: 'devices', label: 'Devices', Icon: Cpu, n: devices.length },
    { key: 'roles', label: 'Roles & access', Icon: Shield, n: null },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6" style={{ color: 'var(--accent)' }} /> Admin console
          </h1>
          <p className="text-[13px] text-muted mt-1">
            Manage who has access to this workspace and every metered device connected to it.
          </p>
        </div>
        <button
          onClick={() => (tab === 'team' ? setShowInvite(true) : setShowAddDevice(true))}
          className="btn btn-primary !px-4 !py-2.5"
        >
          {tab === 'team' ? <><UserPlus className="w-4 h-4" /> Invite member</> : <><Plus className="w-4 h-4" /> Add device</>}
        </button>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Team size', value: counts.total, sub: `${counts.admins} with admin rights`, Icon: Users, color: 'var(--text)' },
          { label: 'Active now', value: counts.active, sub: 'signed in this week', Icon: CheckCircle2, color: 'var(--green)' },
          { label: 'Pending invites', value: counts.invited, sub: 'not yet accepted', Icon: Clock, color: counts.invited ? 'var(--amber)' : 'var(--text-faint)' },
          { label: 'Monitored devices', value: devices.length, sub: `${devices.filter(d => d.status === 'on').length} currently on`, Icon: Cpu, color: 'var(--accent)' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <c.Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
              <p className="label !text-[10px]">{c.label}</p>
            </div>
            <p className="text-[22px] font-extrabold font-mono leading-none" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[10px] text-faint mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="chip transition"
            style={{
              background: tab === t.key ? 'var(--accent-soft)' : 'transparent',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${tab === t.key ? 'var(--accent)' : 'var(--border)'}`,
            }}>
            <t.Icon className="w-3.5 h-3.5" /> {t.label}
            {t.n != null && <span className="font-mono">{t.n}</span>}
          </button>
        ))}
      </div>

      {/* ── TEAM ─────────────────────────────────────────────── */}
      {tab === 'team' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email or role…" className="input w-full !pl-9" />
            </div>
            <span className="text-[11px] text-faint font-mono ml-auto">{filteredTeam.length} shown</span>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filteredTeam.map(m => {
              const role = ROLES[m.role], st = STATUS[m.status];
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[13px] font-extrabold" style={{ background: role.soft, color: role.color }}>
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold truncate flex items-center gap-2">
                      {m.name}
                      {m.role === 'owner' && <span className="chip !py-[2px] !px-1.5 !text-[9px]" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>YOU</span>}
                    </p>
                    <p className="text-[11px] text-faint truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" /> {m.email}
                    </p>
                  </div>

                  <span className="chip shrink-0 hidden sm:inline-flex" style={{ background: role.soft, color: role.color }}>
                    <role.Icon className="w-3 h-3" /> {role.label}
                  </span>
                  <span className="chip shrink-0" style={{ background: st.soft, color: st.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} /> {st.label}
                  </span>
                  <span className="text-[11px] text-faint font-mono shrink-0 hidden md:block w-20 text-right">{m.lastActive}</span>

                  <div className="relative shrink-0">
                    <button onClick={() => setMenuFor(menuFor === m.id ? null : m.id)} className="btn btn-ghost !p-2" aria-label="Member actions">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuFor === m.id && (
                      <div className="absolute right-0 top-full mt-1 z-30 w-52 card p-1.5 shadow-2xl" style={{ background: 'var(--surface)' }}>
                        <p className="label !text-[9px] px-2 py-1.5">Change role</p>
                        {Object.entries(ROLES).filter(([k]) => k !== 'owner').map(([k, r]) => (
                          <button key={k} onClick={() => changeRole(m.id, k)} disabled={m.role === 'owner'}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold hover:bg-[var(--surface-2)] transition disabled:opacity-40"
                            style={{ color: m.role === k ? r.color : 'var(--text)' }}>
                            <r.Icon className="w-3.5 h-3.5" style={{ color: r.color }} /> {r.label}
                            {m.role === k && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" style={{ color: r.color }} />}
                          </button>
                        ))}
                        <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />
                        {m.status === 'invited' && (
                          <button onClick={() => resendInvite(m.id)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold hover:bg-[var(--surface-2)] transition">
                            <Mail className="w-3.5 h-3.5" /> Resend invite
                          </button>
                        )}
                        <button onClick={() => removeMember(m.id)} disabled={m.role === 'owner'}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition disabled:opacity-40 hover:bg-[var(--accent-soft)]"
                          style={{ color: 'var(--accent)' }}>
                          <Trash2 className="w-3.5 h-3.5" /> Remove from team
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredTeam.length === 0 && (
              <div className="px-4 py-10 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-faint" />
                <p className="text-[13px] font-bold">No members match “{query}”</p>
                <button onClick={() => setQuery('')} className="btn btn-ghost mt-3 !text-[12px]">Clear search</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DEVICES ──────────────────────────────────────────── */}
      {tab === 'devices' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="label flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Monitored devices · {devices.length}</p>
            <button onClick={() => setShowAddDevice(true)} className="btn btn-ghost !px-3 !py-1.5 !text-[11px]"><Plus className="w-3 h-3" /> Add device</button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {devices.map(d => {
              const on = d.status === 'on';
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: on ? 'var(--accent-soft)' : 'var(--surface-2)' }}>
                    <Cpu className="w-4 h-4" style={{ color: on ? 'var(--accent)' : 'var(--text-faint)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/device/${d.id}`} className="text-[13.5px] font-bold truncate block hover:underline">{d.name}</Link>
                    <p className="text-[11px] text-faint">{d.room} · rated {d.baseWatts} W · ₹{d.monthCost?.toLocaleString('en-IN')}/mo</p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-[13px] font-extrabold font-mono" style={{ color: on ? 'var(--accent)' : 'var(--text-faint)' }}>{d.currentWatts ?? 0} W</p>
                    <p className="text-[10px] text-faint">live</p>
                  </div>
                  <span className="chip shrink-0" style={{ background: on ? 'var(--green-soft)' : 'var(--surface-2)', color: on ? 'var(--green)' : 'var(--text-faint)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? 'var(--green)' : 'var(--text-faint)' }} /> {on ? 'On' : 'Off'}
                  </span>
                  <button onClick={() => toggleDevice(d.id)} className={`switch ${on ? 'on' : ''} shrink-0`} title="Toggle" />
                  <button onClick={() => removeDevice(d.id)} className="btn btn-ghost !p-2 shrink-0 text-faint" title="Unlink">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ROLES ────────────────────────────────────────────── */}
      {tab === 'roles' && (
        <div className="space-y-3">
          {Object.entries(ROLES).map(([k, r]) => {
            const members = team.filter(m => m.role === k);
            return (
              <div key={k} className="card p-4" style={{ borderLeft: `3px solid ${r.color}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.soft }}>
                    <r.Icon className="w-5 h-5" style={{ color: r.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-extrabold">{r.label}</p>
                      <span className="chip !py-[2px]" style={{ background: r.soft, color: r.color }}>{members.length} member{members.length === 1 ? '' : 's'}</span>
                    </div>
                    <p className="text-[11.5px] text-muted mt-1 leading-relaxed">{ROLE_DESC[k]}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {members.length ? members.map(m => (
                        <span key={m.id} className="chip" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{m.name}</span>
                      )) : <span className="text-[11px] text-faint">No one has this role yet</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="card p-4 flex items-start gap-3" style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--amber)' }}>
              <span className="font-bold">Demo only.</span> Role changes are held in memory and reset on reload. In production these are enforced by Supabase row-level security on every query.
            </p>
          </div>
        </div>
      )}

      {/* invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative card p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-extrabold flex items-center gap-2"><UserPlus className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Invite a team member</h3>
              <button onClick={() => setShowInvite(false)} className="btn btn-ghost !p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-faint mb-1.5 block">Full name</label>
                <input value={invite.name} onChange={e => setInvite(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Priya Nair" className="input w-full" autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-bold text-faint mb-1.5 block">Email</label>
                <input value={invite.email} onChange={e => setInvite(f => ({ ...f, email: e.target.value }))} placeholder="name@company.com" type="email" className="input w-full" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-faint mb-1.5 block">Role</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(ROLES).map(([k, r]) => (
                    <button key={k} onClick={() => setInvite(f => ({ ...f, role: k }))}
                      className="rounded-lg px-2.5 py-2 flex items-center gap-2 transition text-left"
                      style={{ background: invite.role === k ? r.soft : 'var(--surface-2)', border: `1px solid ${invite.role === k ? r.color : 'transparent'}` }}>
                      <r.Icon className="w-3.5 h-3.5" style={{ color: invite.role === k ? r.color : 'var(--text-muted)' }} />
                      <span className="text-[11px] font-bold" style={{ color: invite.role === k ? r.color : 'var(--text)' }}>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowInvite(false)} className="btn btn-ghost !px-4 !py-2">Cancel</button>
                <button onClick={sendInvite} className="btn btn-primary !px-5 !py-2"><Mail className="w-4 h-4" /> Send invite</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* add device modal */}
      {showAddDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddDevice(false)} />
          <div className="relative card p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-extrabold flex items-center gap-2"><Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Add a monitored device</h3>
              <button onClick={() => setShowAddDevice(false)} className="btn btn-ghost !p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-faint mb-1.5 block">Device name</label>
                <input value={deviceForm.name} onChange={e => setDeviceForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Server Room UPS" className="input w-full" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-faint mb-1.5 block">Location</label>
                  <select value={deviceForm.room} onChange={e => setDeviceForm(f => ({ ...f, room: e.target.value }))} className="input w-full">
                    {['Living Room', 'Master Bedroom', 'Kitchen', 'Guest Room', 'Utility'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-faint mb-1.5 block">Rated power (W)</label>
                  <input value={deviceForm.watts} onChange={e => setDeviceForm(f => ({ ...f, watts: e.target.value }))} placeholder="e.g. 850" type="number" min="5" className="input w-full font-mono" />
                </div>
              </div>
              <p className="text-[11px] text-faint leading-relaxed">It joins the live monitor immediately, appears on the Dashboard, and is assignable to a team member.</p>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowAddDevice(false)} className="btn btn-ghost !px-4 !py-2">Cancel</button>
                <button onClick={handleAddDevice} className="btn btn-primary !px-5 !py-2"><Plus className="w-4 h-4" /> Add device</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 card px-4 py-3 flex items-center gap-2.5 shadow-2xl"
          style={{ borderColor: toast.kind === 'err' ? 'var(--accent)' : toast.kind === 'warn' ? 'var(--amber)' : 'var(--green)' }}>
          {toast.kind === 'err' ? <AlertTriangle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            : toast.kind === 'warn' ? <AlertTriangle className="w-4 h-4" style={{ color: 'var(--amber)' }} />
            : <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--green)' }} />}
          <span className="text-[12.5px] font-semibold">{toast.msg}</span>
        </div>
      )}

      <p className="text-[11px] text-faint mt-5 leading-relaxed flex items-start gap-1.5">
        <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Admin changes to devices are shared with the live Dashboard instantly. Team and role changes are demo-only and reset on reload.
      </p>
    </div>
  );
}

const ROLE_DESC = {
  owner:    'Full control including billing, deleting the workspace and transferring ownership. Only one per workspace.',
  admin:    'Everything except billing and ownership — can invite, remove and re-role members, and manage every device.',
  manager:  'Day-to-day operations: switch devices on and off, acknowledge alerts, schedule equipment. Cannot manage people.',
  analyst:  'Read-only across all analytics, exports and reports. Ideal for finance and sustainability teams.',
  viewer:   'Sees only the summary dashboard. No controls, no exports, no member list.',
};
