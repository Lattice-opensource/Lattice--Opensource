import { motion } from 'framer-motion';
import { Eye, Activity, Zap, Building2 } from 'lucide-react';

const items = [
  { icon: Eye, title: 'Energy Visibility', text: 'A single, trusted view of consumption across sites, floors and zones.' },
  { icon: Activity, title: 'Operational Awareness', text: 'Live load, peak demand and after-hours waste surfaced as they happen.' },
  { icon: Zap, title: 'Efficiency Opportunities', text: 'Quantified savings suggestions ranked by impact and effort.' },
  { icon: Building2, title: 'Multi-Site Visibility', text: 'Compare sites and spot underperformers across the portfolio.' },
];

export default function TrustImpact() {
  return (
    <section id="impact" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">Impact</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            Measurable outcomes
          </h2>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            Verified metrics will be published here as deployments grow. Structure is ready to populate.
          </p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-light">
                <it.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{it.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-gray-400">{it.text}</p>
              <p className="mt-4 text-2xl font-black text-white/30">&mdash;</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}