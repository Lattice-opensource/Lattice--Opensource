import { useOutletContext } from 'react-router-dom';
import { BarChart3, Shield, IndianRupee, Users, Info, Crown, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { anomalies } from '../data/mockData.js';

export default function Insights() {
  const { activeColor } = useOutletContext();
  const [consent, setConsent] = useState(false);
  const [tariff, setTariff] = useState('8.00');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Insights & privacy</h1>
        <p className="text-[13px] text-muted mt-1">Your data stays yours. Every choice explained in plain words.</p>
      </div>

      <div className="card p-5 mb-4">
        <p className="label mb-3">What's worth your attention</p>
        <div className="space-y-2.5">
          {anomalies.map(a => {
            const warn = a.kind === 'high';
            return (
              <div
                key={a.title}
                className="flex items-start gap-3 rounded-xl px-3.5 py-3"
                style={{ background: warn ? 'var(--amber-soft)' : 'var(--green-soft)' }}
              >
                <span className="shrink-0" style={{ color: warn ? 'var(--amber)' : 'var(--green)' }}>
                  {a.icon === 'bulb' ? (
                    <Lightbulb className="w-4 h-4" />
                  ) : a.icon === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </span>
                <p className="text-[13px] font-semibold leading-snug">{a.insight}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
            <IndianRupee className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-bold text-[14px]">Electricity tariff</p>
            <p className="text-[11px] text-faint">From your bill — watts become rupees. Change it and all costs update instantly.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 max-w-[200px]">
          <span className="text-[13px] font-mono text-muted">₹</span>
          <input value={tariff} onChange={e => setTariff(e.target.value)} className="input w-full font-mono" />
          <span className="text-[11px] text-faint">/ unit</span>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
            <Shield className="w-4 h-4 text-muted" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[14px]">Share anonymous usage insights</p>
            <p className="text-[11px] text-faint leading-relaxed">
              Optional. With consent, we combine patterns like "average AC consumption" or "peak-use hours" —
              <span className="text-muted"> no name, no address, no device identity</span> — and may sell them to interested companies.
              Withdraw anytime; your data is then excluded.
            </p>
          </div>
        </div>
        <button
          onClick={() => setConsent(c => !c)}
          className="flex items-center justify-between w-full rounded-xl px-4 py-3 transition-colors"
          style={{ background: consent ? 'var(--accent-soft)' : 'var(--surface-2)' }}
        >
          <span className="flex items-center gap-2.5 text-[13px] font-bold">
            <Users className="w-4 h-4" style={{ color: consent ? 'var(--accent)' : 'var(--text-muted)' }} />
            {consent ? 'Sharing is ON' : 'Sharing is OFF'}
          </span>
          <span className={`switch ${consent ? 'on' : ''}`} />
        </button>
        <p className="text-[11px] text-faint mt-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          In the final build this is stored in your account and reversible any time from this screen.
        </p>
      </div>

      <div className="card p-5" style={{ borderColor: 'rgba(14,165,233,0.35)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,233,0.15)' }}>
            <Crown className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[14px] text-sky-300">LATTICE PRO</p>
            <p className="text-[11px] text-sky-200/60">Electric Blue mode, tariff discounts, deeper insights — FREE during the demo.</p>
          </div>
          <BarChart3 className="w-4 h-4 text-sky-400/60 shrink-0" />
        </div>
      </div>

      <p className="text-[11px] text-faint mt-4 leading-relaxed">
        Free Supabase projects sleep after 7 days unused — the morning of any demo, log into supabase.com and
        unpause your project so your saved-data features work.
      </p>
    </div>
  );
}