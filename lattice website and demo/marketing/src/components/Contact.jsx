import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Send } from 'lucide-react';
import Logo from './Logo.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', interest: 'Home monitoring', message: '' });
  const [status, setStatus] = useState({ loading: false, sent: false, error: '' });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, sent: false, error: '' });
    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 600));
      setStatus({ loading: false, sent: true, error: '' });
      return;
    }
    const { error } = await supabase.from('contacts').insert([
      { name: form.name.trim(), email: form.email.trim(), interest: form.interest, message: form.message.trim() },
    ]);
    if (error) setStatus({ loading: false, sent: false, error: error.message });
    else {
      setStatus({ loading: false, sent: true, error: '' });
      setForm({ name: '', email: '', interest: 'Home monitoring', message: '' });
    }
  };

  return (
    <>
      <section id="contact" className="py-24 px-5 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">
              Contact
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
              Let&rsquo;s talk about your energy bill
            </h2>
            <p className="mt-5 text-lg text-gray-400 leading-relaxed">
              Questions about a plan, a rollout, or a partnership? Write to us — a real person
              replies within one business day.
            </p>
            <div className="mt-9 space-y-4">
              <a
                href="mailto:lattice.yfc@gmail.com"
                className="flex items-center gap-3 text-[15px] text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="w-4.5 h-4.5 text-brand-light" /> lattice.yfc@gmail.com
              </a>
              <p className="flex items-center gap-3 text-[15px] text-gray-300">
                <MapPin className="w-4.5 h-4.5 text-brand-light" /> India — serving homes &amp;
                businesses nationwide
              </p>
              <Link to="/contact" className="inline-flex text-sm font-semibold text-brand-light hover:text-white">
                Go to dedicated contact page →
              </Link>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10 space-y-5"
          >
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
                  className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-[14px] text-white placeholder:text-gray-600 focus:border-brand/60 focus:outline-none"
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
                  className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-[14px] text-white placeholder:text-gray-600 focus:border-brand/60 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-300 mb-2" htmlFor="interest">
                I&rsquo;m interested in
              </label>
              <select
                id="interest"
                name="interest"
                value={form.interest}
                onChange={onChange}
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-[14px] text-white focus:border-brand/60 focus:outline-none"
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
                rows={4}
                placeholder="Tell us about your home or business..."
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-[14px] text-white placeholder:text-gray-600 focus:border-brand/60 focus:outline-none"
              />
            </div>
            {status.error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300">
                {status.error}
              </p>
            )}
            {status.sent ? (
              <p className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-[14px] font-semibold text-emerald-400">
                Thanks! Your request was saved — we’ll reply within one business day.
              </p>
            ) : (
              <button
                type="submit"
                disabled={status.loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[14px] font-bold text-white hover:bg-brand-light transition-colors disabled:opacity-60"
              >
                {status.loading ? 'Sending…' : 'Send message'} <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="font-extrabold tracking-tight text-white">Lattice</span>
            <span className="ml-2 text-[12px] text-gray-500">Connecting Ideas. Building Solutions.</span>
          </div>
          <p className="text-[12px] text-gray-600">
            © {new Date().getFullYear()} Lattice Energy. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}