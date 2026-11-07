import { motion } from 'framer-motion';
import { Plug, BarChart3, Search, CheckCircle2 } from 'lucide-react';

const steps = [
  { n: '01', icon: Plug, title: 'Connect', text: 'Bring existing energy data and infrastructure into Lattice &mdash; meters, BMS, solar, DG and sensors.' },
  { n: '02', icon: BarChart3, title: 'Monitor', text: 'View energy information for every site, floor and zone in one centralized platform.' },
  { n: '03', icon: Search, title: 'Understand', text: 'Identify trends, anomalies and areas requiring attention before the next bill.' },
  { n: '04', icon: CheckCircle2, title: 'Act', text: 'Use the resulting insights to make informed operational decisions.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">How it works</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            From data to decisions
          </h2>
        </div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8"
            >
              <span className="absolute top-6 right-7 text-5xl font-black text-white/5">{s.n}</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-light">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{s.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-gray-400">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}