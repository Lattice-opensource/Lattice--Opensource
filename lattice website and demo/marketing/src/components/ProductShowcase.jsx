import { motion } from 'framer-motion';
import { Zap, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';

const modules = [
  { title: 'Energy consumption', text: 'Live kW and ₹ cost per site, floor and zone.' },
  { title: 'Facility information', text: 'Sq ft, occupancy, sanctioned load and tariff.' },
  { title: 'Analytics', text: 'Trends, comparisons and department allocation.' },
  { title: 'Trends', text: 'Week-over-week and month-over-month views.' },
  { title: 'Alerts', text: 'Peak demand, after-hours waste, anomalies.' },
  { title: 'System information', text: 'Grid, solar, DG and battery mix.' },
];

export default function ProductShowcase() {
  return (
    <section id="product" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">Product</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            The Lattice platform
          </h2>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            A real enterprise product &mdash; not a mockup. Hover any module to see what it does.
          </p>
        </motion.div>

        <div className="mt-14 grid lg:grid-cols-5 gap-6">
          {/* Dashboard mock */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 rounded-3xl border border-white/10 bg-white/[0.04] p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-500 uppercase tracking-wider">Lattice Tower &mdash; Bengaluru</p>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[12px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Load now', value: '412 kW', icon: Zap },
                { label: '₹ today', value: '₹1,21,840', icon: TrendingUp },
                { label: 'Peak (74%)', value: '485 kW', icon: AlertTriangle },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-[12px]">
                    <k.icon className="w-3.5 h-3.5 text-brand-light" /> {k.label}
                  </div>
                  <p className="mt-2 text-xl font-black text-white">{k.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex h-32 items-end gap-2">
              {[38, 55, 42, 70, 58, 85, 64, 92, 74, 60, 80, 66, 48, 36].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-brand/60 to-brand/90 opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {['Floor 9 &mdash; highest W/sq ft', '34 ACs on after 7 PM', 'Solar covering 18% of load', 'Server room +18% vs baseline'].map((t) => (
                <div key={t} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[13px] text-gray-300">
                  {t}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Module list */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {modules.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ x: 4 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand/40 hover:bg-white/[0.05]"
              >
                <h3 className="text-[15px] font-bold text-white group-hover:text-brand-light transition-colors">
                  {m.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-400">{m.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}