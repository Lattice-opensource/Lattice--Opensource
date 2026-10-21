import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Send, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', interest: 'Home monitoring', message: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: false });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: false });

    if (!isSupabaseConfigured) {
      // fallback: simulate success if Supabase not configured (so you can test locally)
      await new Promise((r) => setTimeout(r, 600));
      setStatus({ loading: false, error: '', success: true });
      return;
    }

    const { error } = await supabase.from('contacts').insert([
      {
        name: form.name.trim(),
        email: form.email.trim(),
        interest: form.interest,
        message: form.message.trim(),
      },
    ]);

    if (error) {
      setStatus({ loading: false, error: error.message, success: false });
    } else {
      setStatus({ loading: false, error: '', success: true });
      setForm({ name: '', email: '', interest: 'Home monitoring', message: '' });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-ink/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-lg font-extrabold tracking-tight text-white">Lattice</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-14">
        <div className="max-w-3xl">
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">Contact</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">Talk to Lattice</h1>
          <p className="mt-4 text-lg text-gray-400 leading-relaxed">
            Whether you’re a homeowner, a business with many sites, or a potential partner — drop your details and we’ll reply within one business day. Your request is saved securely.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-400">
            <a href="mailto:lattice.yfc@gmail.com" className="inline-flex items-center gap-2 hover:text-white">
              <Mail className="w-4 h-4 text-brand-light" /> lattice.yfc@gmail.com
            </a>
            <span className="inline-flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-light" /> India — nationwide
            </span>
          </div>
          {!isSupabaseConfigured && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Supabase not configured — submissions are mocked locally. Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to enable saving.
            </p>
          )}
        </div>

        <div className="mt-10 grid lg:grid-cols-5 gap-10 items-start">
          <form onSubmit={onSubmit} className="lg:col-span-3 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-gray-300 mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-brand/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-300 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-brand/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-300 mb-2" htmlFor="interest">
                I’m interested in
              </label>
              <select
                id="interest"
                name="interest"
                value={form.interest}
                onChange={onChange}
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white focus:border-brand/60 focus:outline-none"
              >
                <option>Home monitoring</option>
                <option>Enterprise / multi-site</option>
                <option>Partnership</option>
                <option>Something else</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-300 mb-2" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={onChange}
                required
                rows={5}
                placeholder="Tell us about your home, business, or request..."
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-brand/60 focus:outline-none"
              />
            </div>

            {status.error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {status.error}
              </p>
            )}
            {status.success && (
              <p className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Thanks — your request was saved. We’ll reply within one business day.
              </p>
            )}

            <button
              type="submit"
              disabled={status.loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-light transition-colors disabled:opacity-60"
            >
              {status.loading ? 'Sending…' : 'Send request'} <Send className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-500">By sending, you agree we can contact you about Lattice. No spam.</p>
          </form>

          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-6">
            <h3 className="text-lg font-bold text-white">What happens next?</h3>
            <ol className="space-y-4 text-sm leading-relaxed text-gray-400">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light text-xs font-bold">
                  1
                </span>
                Your message is saved to our secure Supabase contacts table.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light text-xs font-bold">
                  2
                </span>
                A team member reviews it and replies by email within one business day.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-light text-xs font-bold">
                  3
                </span>
                For enterprises: we’ll share a tailored rollout plan and volume pricing.
              </li>
            </ol>
            <div className="pt-6 border-t border-white/5">
              <p className="text-sm font-semibold text-white">Prefer email?</p>
              <a href="mailto:lattice.yfc@gmail.com" className="mt-2 inline-flex text-sm text-brand-light hover:text-white">
                lattice.yfc@gmail.com →
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-10 px-5 mt-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-5 text-sm">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="font-extrabold text-white">Lattice</span>
          </Link>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Lattice Energy.</p>
        </div>
      </footer>
    </div>
  );
}
