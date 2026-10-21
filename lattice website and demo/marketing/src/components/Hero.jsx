import { ArrowRight, IndianRupee, Zap, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { value: '₹1,200+', label: 'average yearly saving' },
  { value: '15 min', label: 'to connect your home' },
  { value: '24/7', label: 'real-time monitoring' },
  { value: '100%', label: 'data stays yours' },
];

export default function Hero() {
  return (
    <section id="top" className="pt-32 pb-20 px-5 overflow-hidden">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-[12px] font-semibold text-brand-light uppercase tracking-wider"
          >
            <Wifi className="w-3.5 h-3.5" /> Smart energy monitoring
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]"
          >
            Every room. Every appliance.
            <span className="bg-gradient-to-r from-brand to-rose-300 bg-clip-text text-transparent">
              {' '}
              Every rupee.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-lg text-gray-400 leading-relaxed max-w-xl"
          >
            Lattice turns your home&rsquo;s or business&rsquo;s electricity use into a live, readable
            dashboard — in watts and rupees — so you can cut waste without guesswork.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[15px] font-bold text-white hover:bg-brand-light shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#individuals"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-[15px] font-semibold text-gray-300 hover:border-white/40 hover:text-white transition-colors"
            >
              See what you get
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-8"
          >
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 + i * 0.08 }}>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1 text-[12px] text-gray-500">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
          className="relative"
        >
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -inset-8 rounded-[40px] bg-brand/10 blur-3xl" aria-hidden />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur p-6 shadow-glow hover:shadow-[0_0_40px_rgba(225,29,72,0.15)] transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-gray-500 uppercase tracking-wider">Live usage</p>
                <p className="mt-1 text-3xl font-black text-white flex items-center">
                  <IndianRupee className="w-5 h-5 text-brand-light" /> 42.6
                  <span className="text-[14px] font-semibold text-gray-500 ml-1">/ today</span>
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[12px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>

            <div className="mt-6 flex h-32 items-end gap-2">
              {[38, 55, 42, 70, 58, 85, 64, 92, 74, 60, 80, 66, 48, 36].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${h}%`, opacity: 0.5 + (i / 14) * 0.5 }}
                  transition={{ delay: 0.9 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-brand/60 to-brand/90"
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-gray-500">
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>Now</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Kitchen', value: '₹18.2' },
                { label: 'Living room', value: '₹12.7' },
                { label: 'AC', value: '₹9.4' },
              ].map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + i * 0.1 }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-colors"
                >
                  <p className="text-[11px] text-gray-500">{r.label}</p>
                  <p className="mt-1 text-[15px] font-bold text-white">{r.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-6 flex items-center justify-center gap-2 text-[12px] text-gray-500">
            <Zap className="w-3.5 h-3.5 text-brand-light" />
            Live ₹ cost per room, appliance, and home
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}