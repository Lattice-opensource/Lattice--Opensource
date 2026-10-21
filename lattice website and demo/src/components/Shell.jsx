import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plug, Cpu, BarChart3, TrendingUp, Sun, Moon, Crown, User, BookOpen, Menu, X, Cable, FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/usage', label: 'Usage', icon: TrendingUp },
  { to: '/connect', label: 'Connect', icon: Plug },
  { to: '/devices', label: 'Devices', icon: Cpu },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/logbook', label: 'Logbook', icon: BookOpen },
  { to: '/power-sources', label: 'Power sources', icon: Cable },
];

const groups = [
  { title: 'Overview', items: ['/', '/usage', '/insights', '/logbook', '/power-sources'] },
  { title: 'Devices', items: ['/connect', '/devices'] },
  { title: 'Account', items: ['/profile'] },
];

export default function Shell({ pro, setPro, theme, setTheme, activeColor, glowClass, beta, setBeta }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className={scrolled ? 'h-16' : ''}>
        <header
          className="fixed top-0 left-0 right-0 z-40 transition-all duration-200"
          style={{
            background: scrolled ? 'var(--surface)' : 'var(--bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
            <button
              onClick={() => setOpen(o => !o)}
              className="btn btn-ghost !px-2.5 !py-2"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0">
              <img
                src="/brand/logo.png"
                alt="LATTICE logo"
                className="w-8 h-8 rounded-[9px] object-cover"
                draggable="false"
              />
              <div className="hidden sm:block text-left">
                <p className="text-[15px] font-extrabold leading-none tracking-tight">LATTICE</p>
                <p className="text-[9px] text-faint uppercase tracking-[0.18em] mt-0.5">Smart Energy</p>
              </div>
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-1.5">
              {/* Switch to BETA toggle — priority on top */}
              <div
                className="hidden sm:flex items-center gap-2 rounded-full px-2.5 py-1.5 cursor-pointer select-none"
                onClick={() => setBeta(b => !b)}
                title={beta ? 'BETA dashboard is active — click to go back to Stable' : 'Try the new dashboard — click to switch to BETA'}
                style={{
                  background: beta ? 'var(--accent)' : 'var(--surface-2)',
                  border: `1px solid ${beta ? 'var(--accent)' : 'var(--border)'}`,
                  color: beta ? '#fff' : 'var(--text-muted)',
                }}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black tracking-widest uppercase whitespace-nowrap">
                  {beta ? 'BETA' : 'Switch to BETA'}
                </span>
                <span className={`switch ${beta ? 'on' : ''} !w-[32px] !h-[18px] ${beta ? '!bg-white/30 !border-white/40' : ''}`} style={beta ? { background: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.4)' } : undefined} aria-hidden>
                </span>
              </div>
              {/* Mobile beta pill (icon only) */}
              <button
                onClick={() => setBeta(b => !b)}
                className={`sm:hidden btn !px-2.5 !py-2 ${beta ? 'bg-rose-500 text-white' : 'btn-ghost'}`}
                title={beta ? 'BETA active' : 'Switch to BETA'}
              >
                <FlaskConical className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
                className="btn-ghost btn !px-2.5 !py-2"
                title="Toggle light/dark mode"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setPro(p => !p)}
                className={`btn !px-3 !py-2 ${pro ? 'bg-sky-500 text-white' : 'btn-ghost'}`}
                title={pro ? 'PRO active' : 'Try PRO for free'}
              >
                <Crown className="w-4 h-4" />
                <span className={`hidden sm:inline ${pro ? '' : activeColor}`}>{pro ? 'PRO' : 'PRO FREE'}</span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition ${open ? 'visible' : 'invisible'}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
      </div>

      {/* Side pullout */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[300px] max-w-[82vw] flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        aria-label="Navigation"
      >
        <div className="h-16 flex items-center gap-2.5 px-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <img src="/brand/logo.png" alt="LATTICE logo" className="w-8 h-8 rounded-[9px] object-cover" />
          <div>
            <p className="text-[14px] font-extrabold leading-none">LATTICE</p>
            <p className="text-[10px] text-faint uppercase tracking-[0.14em]">Smart Energy</p>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto btn btn-ghost !p-2" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map(g => (
            <div key={g.title}>
              <p className="label !text-[10px] px-2 mb-2">{g.title}</p>
              <div className="space-y-1">
                {g.items.map(to => {
                  const it = navItems.find(n => n.to === to);
                  if (!it) return null;
                  return (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition ${isActive ? 'text-white' : 'text-muted hover:text-[var(--text)] hover:bg-[var(--surface-2)]'}`}
                      style={({ isActive }) => isActive ? { background: 'var(--accent)', color: '#fff' } : undefined}
                    >
                      <it.icon className="w-4 h-4 shrink-0" />
                      {it.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 shrink-0 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="rounded-xl px-3 py-3 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
            <span className="text-[12px] font-bold flex items-center gap-2">{theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} {theme === 'dark' ? 'Dark' : 'Light'}</span>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="btn btn-ghost !px-2.5 !py-1 !text-[11px]">{theme === 'dark' ? 'White' : 'Black'}</button>
          </div>
          <p className="text-[11px] text-faint leading-relaxed">Pullout navigation — organised by section. Tap outside or press Esc to close.</p>
        </div>
      </aside>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-20 pb-12">
        {beta && (
          <div className="mb-4 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
            <span className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> You're viewing the <span className="font-black">BETA</span> dashboard — new PDF-inspired layout.</span>
            <button onClick={() => setBeta(false)} className="btn btn-ghost !px-3 !py-1 !text-xs shrink-0" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Back to Stable</button>
          </div>
        )}
        <Outlet context={{ pro, setPro, theme, setTheme, activeColor, glowClass, beta, setBeta }} />
      </div>
    </div>
  );
}
