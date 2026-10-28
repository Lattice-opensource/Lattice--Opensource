import { motion } from 'framer-motion';
import { Layers, EyeOff, AlertTriangle, TrendingDown, Building2, Workflow } from 'lucide-react';

const problems = [
  { icon: Layers, title: 'Fragmented energy data', text: 'Meters, BMS, solar, DG and utility bills live in separate systems that never talk to each other.' },
  { icon: EyeOff, title: 'Limited visibility across facilities', text: 'No single view of what each floor, zone, or site is actually consuming in real time.' },
  { icon: AlertTriangle, title: 'Hidden inefficiencies', text: 'After-hours waste, short-cycling equipment and phantom loads stay invisible in monthly bills.' },
  { icon: TrendingDown, title: 'Reactive decision-making', text: 'Teams act only after the bill arrives, with no way to prevent waste before it happens.' },
  { icon: Building2, title: 'Complex multi-site infrastructure', text: 'Growing portfolios add sites faster than teams can monitor them consistently.' },
  { icon: Workflow, title: 'Difficulty identifying anomalies', text: 'Spotting a spike among thousands of readings still needs manual, slow investigation.' },
];

export default function Problem() {
  return (
    <section id="problem" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">The problem</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            Energy is everywhere. Visibility isn&rsquo;t.
          </h2>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            Most enterprises already generate the data. What they lack is a single, trusted layer that
            turns it into understanding &mdash; before the next bill arrives.
          </p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-brand/40 hover:bg-white/[0.05]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-light">
                <p.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{p.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-gray-400">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}