import { Link } from 'react-router-dom';
import { Building2, FolderKanban, Server, Lock, Gauge, Users, CheckCircle2, ArrowRight, BarChart3, ShieldCheck, Zap } from 'lucide-react';
import Logo from '../components/Logo.jsx';

const capabilities = [
  { icon: FolderKanban, title: 'Multi-site portfolio view', text: 'Monitor every branch, store, or client site from one dashboard. Compare sites and spot underperformers instantly.' },
  { icon: Gauge, title: 'Per-site energy KPIs', text: 'Cost per unit area, per employee, per machine hour — the metrics that matter to operations, not just bills.' },
  { icon: Server, title: 'API & integrations', text: 'Pull energy data into your own systems, billing platforms, or BMS with a clean, documented API.' },
  { icon: Lock, title: 'Enterprise-grade security', text: 'Role-based access, audit logs, and your data isolated — built for organisations that take compliance seriously.' },
  { icon: Users, title: 'Dedicated support', text: 'A named engineer during onboarding, training for your team, and priority support whenever you need it.' },
  { icon: Building2, title: 'Deploy at scale', text: 'From a single flagship store to a thousand sites — Lattice scales with zero extra hardware headaches.' },
];

export default function Business() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-ink/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-lg font-extrabold tracking-tight text-white">Lattice</span>
            <span className="text-xs font-bold text-brand-light border border-brand/30 bg-brand/10 px-2.5 py-1 rounded-full ml-2">Business</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden md:inline-flex text-sm font-semibold text-gray-400 hover:text-white">Home</Link>
            <Link to="/contact" className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-light">Talk to sales <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </header>

      <section className="pt-16 pb-10 px-5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand-light uppercase tracking-wider"><Building2 className="w-3.5 h-3.5" /> For businesses</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">Energy intelligence<br />across your portfolio</h1>
            <p className="mt-4 text-lg text-gray-400 leading-relaxed">Retail chains, offices, campuses, and manufacturers use Lattice to cut energy waste site-by-site — with numbers your CFO can trust. Fleet-wide rollouts, custom reporting, and SLA-backed uptime.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-light">Contact sales <ArrowRight className="w-4 h-4" /></Link>
              <a href="https://lattice-smart-energy.vercel.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-gray-200 hover:border-white/30">Try demo</a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1.5 text-gray-300"><ShieldCheck className="w-4 h-4 text-brand-light" /> SOC 2 ready</span>
              <span className="flex items-center gap-1.5 text-gray-300"><BarChart3 className="w-4 h-4 text-brand-light" /> API access</span>
              <span className="flex items-center gap-1.5 text-gray-300"><Zap className="w-4 h-4 text-brand-light" /> 99.9% uptime</span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-sm font-bold text-white">Trusted by</p>
            <p className="text-sm text-gray-400 mt-2">Multi-site operators who need per-site KPIs, portfolio views, and volume pricing. From flagship stores to 1,000+ sites.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {['Retail', 'Offices', 'Campuses'].map(k=>(
                <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                  <p className="text-sm font-black text-white">{k}</p>
                  <p className="text-xs text-gray-500 mt-1">Portfolio view</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-bold text-emerald-300">Live — 128 sites reporting</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-5 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">What you get</h2>
            <p className="mt-3 text-gray-400">Everything you need to roll out, measure, and prove savings — without adding hardware headaches.</p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map(c=>(
              <div key={c.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 hover:border-brand/30 hover:bg-white/[0.05] transition-colors">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-light"><c.icon className="w-5 h-5" /></div>
                <h3 className="mt-5 text-base font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-5 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <h3 className="text-lg font-black text-white">Volume pricing</h3>
            <p className="text-sm text-gray-400 mt-2">Per-site pricing that scales down as you add locations. Custom reporting packs and onboarding included.</p>
            <ul className="mt-5 space-y-2">
              {['Fleet-wide rollouts', 'Custom reporting packs', 'SLA-backed uptime', 'Dedicated engineer'].map(i=>(
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-brand-light" /> {i}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/15 via-white/[0.04] to-white/[0.02] p-10 text-center">
            <h3 className="text-2xl font-black text-white">Ready to talk?</h3>
            <p className="mt-3 text-gray-400">Tell us about your sites and we’ll share a tailored plan in one business day.</p>
            <Link to="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white hover:bg-brand-light">Contact sales <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5"><Logo size={24} /><span className="font-extrabold text-white">Lattice</span></Link>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Lattice Energy.</p>
        </div>
      </footer>
    </div>
  );
}
