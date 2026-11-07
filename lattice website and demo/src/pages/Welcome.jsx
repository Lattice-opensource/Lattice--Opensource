import { ArrowRight, IndianRupee } from 'lucide-react';

export default function Welcome({ onStart }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm text-center">
        <img
          src="/brand/logo.png"
          alt="LATTICE logo"
          className="w-20 h-20 rounded-3xl object-cover mx-auto mb-6"
          draggable="false"
        />
        <h1 className="text-[34px] font-extrabold tracking-tight leading-none">LATTICE</h1>
        <p className="text-[11px] text-faint uppercase tracking-[0.25em] mt-2 mb-10">
          Connecting Ideas. Building Solutions.
        </p>

        <div className="card p-6 text-left mb-5">
          <p className="text-[15px] font-semibold mb-1">Your home's electricity, understood.</p>
          <p className="text-[13px] text-muted leading-relaxed">
            Every room, every appliance, every rupee — live on your screen.
          </p>
          <div className="flex items-center gap-2.5 mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <img
                  key={i}
                  src={`/brand/${i === 1 ? 'logo' : i === 2 ? 'brand-dark' : 'brand-alt'}.png`}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border-2"
                  style={{ borderColor: 'var(--surface)' }}
                  draggable="false"
                />
              ))}
            </div>
            <p className="text-[11px] text-muted">Imports your Home Assistant devices & smart-meter data</p>
          </div>
        </div>

        <button onClick={onStart} className="btn btn-primary w-full !py-3.5 text-[15px]">
          Continue as demo user <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-faint mt-4 flex items-center justify-center gap-1.5">
          <IndianRupee className="w-3.5 h-3.5" /> Demo mode — no account needed
        </p>
      </div>
    </div>
  );
}