import { useNavigate } from 'react-router-dom';
import { Plug, CheckCircle2, Loader2, KeyRound, Globe, ArrowRight, ChevronLeft, Check } from 'lucide-react';
import { useState } from 'react';

const STEPS = ['Network', 'Address', 'Authorize'];

export default function Connect() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [haUrl, setHaUrl] = useState('http://homeassistant.local:8123');
  const [code, setCode] = useState('');

  const connect = () => {
    setBusy(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setBusy(false);
      if (step + 1 >= STEPS.length) setDone(true);
    }, 1300);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Connect your home</h1>
        <p className="text-[13px] text-muted mt-1">
          LATTICE imports rooms, devices and energy sensors from your Home Assistant.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={
                  i < step || done
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--surface-2)', color: 'var(--text-faint)' }
                }
              >
                {i < step || done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            <p className="text-[10px] font-bold" style={{ color: i <= step || done ? 'var(--text)' : 'var(--text-faint)' }}>
              {s}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--green-soft)' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--green)' }} />
            </div>
            <h2 className="text-lg font-bold">Home Assistant connected!</h2>
            <p className="text-[13px] text-muted mt-1 mb-6">
              Imported 4 rooms and 6 devices. One device needs identification.
            </p>
            <button onClick={() => navigate('/devices')} className="btn btn-primary mx-auto">
              Review imported devices <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : busy ? (
          <div className="text-center py-10">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p className="text-[13px] text-muted">
              {step === 0 && 'Checking your local network…'}
              {step === 1 && 'Connecting to Home Assistant…'}
              {step === 2 && 'Verifying authorization…'}
            </p>
          </div>
        ) : (
          <div>
            {step === 0 && (
              <div>
                <p className="text-[13px] text-muted mb-4">
                  LATTICE looks for your Home Assistant on the same Wi-Fi network.
                </p>
                <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6" style={{ background: 'var(--green-soft)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
                  <div>
                    <p className="text-[13px] font-bold">Network detected</p>
                    <p className="text-[11px] text-muted">Your home network is reachable</p>
                  </div>
                </div>
                <button onClick={connect} className="btn btn-primary w-full">
                  <Plug className="w-4 h-4" /> Scan for Home Assistant
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <label className="label mb-2 block">Home Assistant address</label>
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className="w-4 h-4 shrink-0 text-muted" />
                  <input
                    value={haUrl}
                    onChange={e => setHaUrl(e.target.value)}
                    className="input w-full font-mono"
                  />
                </div>
                <p className="text-[11px] text-faint mb-5">
                  Usually <span className="font-mono">http://homeassistant.local:8123</span> on your home network.
                </p>
                <button onClick={connect} className="btn btn-primary w-full">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <KeyRound className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold">Authorize LATTICE</p>
                    <p className="text-[11px] text-faint">Enter the 6-digit code shown in Home Assistant</p>
                  </div>
                </div>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="••••••"
                  className="input w-full text-center font-mono text-xl tracking-[0.5em] !py-4 mb-5"
                />
                <button
                  onClick={connect}
                  disabled={code.length < 6}
                  className="btn btn-primary w-full"
                >
                  Confirm & import <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 text-[12px] font-semibold mt-4 text-muted hover:opacity-80"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}