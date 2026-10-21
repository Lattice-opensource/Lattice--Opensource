import { Plug, Sparkles, TrendingDown, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Plug,
    title: 'Connect',
    text: 'Lattice links to your smart meter and Home Assistant setup in minutes — no electrician, no rewiring.',
  },
  {
    icon: Sparkles,
    title: 'Understand',
    text: 'Rooms and appliances appear automatically. AI identifies unknown devices from their usage patterns for you to confirm.',
  },
  {
    icon: TrendingDown,
    title: 'Save',
    text: 'Cut waste with live alerts, compare days and weeks, and watch your bill trend down — all in rupees.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">
            How it works
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            From plug-in to savings in one evening
          </h2>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} whileHover={{ y: -4 }} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <span className="absolute top-6 right-7 text-5xl font-black text-white/5">{i + 1}</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-light"><s.icon className="w-6 h-6" /></div>
              <h3 className="mt-6 text-xl font-bold text-white">{s.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-gray-400">{s.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mt-14 rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/15 via-white/[0.04] to-white/[0.02] p-10 md:p-14 text-center">
          <h3 className="text-2xl md:text-4xl font-black tracking-tight text-white">
            Ready to see your bill differently?
          </h3>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Join individuals and businesses already cutting energy waste with Lattice. Start free —
            no credit card, no hardware to buy for the demo.
          </p>
          <a href="#pricing" className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-4 text-[15px] font-bold text-white hover:bg-brand-light shadow-glow transition-all">Choose your plan <ArrowRight className="w-4 h-4" /></a>
        </motion.div>
      </div>
    </section>
  );
}