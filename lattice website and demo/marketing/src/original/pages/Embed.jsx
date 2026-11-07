import { ArrowRight, IndianRupee } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function Embed() {
  return (
    <div className="min-h-screen bg-ink text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-extrabold tracking-tight">Lattice</span>
            <span className="text-xs text-gray-500 ml-2 hidden sm:inline">Connecting Ideas. Building Solutions.</span>
          </div>
          <span className="text-xs font-bold text-brand-light border border-brand/30 bg-brand/10 px-3 py-1 rounded-full">
            LIVE DEMO — Pitch Mode
          </span>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">
              Every room. Every appliance. <span className="bg-gradient-to-r from-brand to-rose-300 bg-clip-text text-transparent">Every rupee.</span>
            </h1>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Lattice turns any home or business into a live energy dashboard — watts and rupees, per room and appliance.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="https://lattice-energy.vercel.app/#pricing" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">
                Pricing <ArrowRight className="w-4 h-4" />
              </a>
              <a href="https://lattice-energy.vercel.app/contact" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-gray-200">
                Contact
              </a>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div><p className="text-xl font-black">₹1,200+</p><p className="text-xs text-gray-500">saved / year</p></div>
              <div><p className="text-xl font-black">15 min</p><p className="text-xs text-gray-500">to connect</p></div>
              <div><p className="text-xl font-black">24/7</p><p className="text-xs text-gray-500">live</p></div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Live usage</p>
              <span className="text-xs font-bold text-emerald-400">● Live</span>
            </div>
            <p className="mt-2 text-3xl font-black flex items-center"><IndianRupee className="w-5 h-5 text-brand-light" /> 42.6 <span className="text-sm font-semibold text-gray-500 ml-1">/ today</span></p>
            <div className="mt-4 flex h-24 items-end gap-1.5">
              {[38,55,42,70,58,85,64,92,74,60,80,66].map((h,i)=>(
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand/60 to-brand/90" style={{height:`${h}%`}} />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-gray-500"><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span></div>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="font-bold">For Individuals</p><p className="text-gray-400 mt-1">Room & appliance breakdown, ₹ cost, alerts, private by design.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="font-bold">For Enterprises</p><p className="text-gray-400 mt-1">Multi-site, KPIs, API, SLA, dedicated support.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="font-bold">Pricing</p><p className="text-gray-400 mt-1">Free, ₹99 Home Pro (popular), ₹249 Family, Enterprise custom.</p></div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">Embed this page in PowerPoint → Web Viewer → paste this URL. Full site also works iframed.</p>
      </div>
    </div>
  );
}
