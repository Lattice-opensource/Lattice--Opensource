import { useNavigate } from 'react-router-dom';
import { Home, Building2, ArrowRight } from 'lucide-react';

export default function WelcomeOverlay() {
  const navigate = useNavigate();

  const choose = (path) => {
    try { sessionStorage.setItem('lattice-audience', path); } catch (e) {}
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink px-5">
      <div className="max-w-4xl w-full text-center">
        <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.25em]">Lattice</p>
        <h1 className="mt-4 text-4xl md:text-6xl font-black tracking-tight text-white">
          Welcome to Lattice.
        </h1>
        <p className="mt-4 text-lg text-gray-400">What brings you here?</p>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <button
            onClick={() => choose('/home')}
            className="group rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-left hover:border-brand/40 hover:bg-white/[0.06] transition-all hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-light mb-6">
              <Home className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Home</h2>
            <p className="mt-2 text-gray-400">Explore Lattice for your home.</p>
            <div className="mt-6 inline-flex items-center gap-2 text-brand-light font-semibold text-[14px] group-hover:gap-3 transition-all">
              Enter <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => choose('/enterprise')}
            className="group rounded-3xl border border-brand/40 bg-gradient-to-b from-brand/15 to-white/[0.03] p-10 text-left hover:border-brand/60 transition-all hover:-translate-y-1 shadow-glow"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-light mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Business & Enterprise</h2>
            <p className="mt-2 text-gray-400">Energy intelligence for commercial buildings and facilities.</p>
            <div className="mt-6 inline-flex items-center gap-2 text-brand-light font-semibold text-[14px] group-hover:gap-3 transition-all">
              Enter <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}