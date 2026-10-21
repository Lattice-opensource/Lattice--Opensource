import { Building2, FolderKanban, Server, Lock, Gauge, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const capabilities = [
  {
    icon: FolderKanban,
    title: 'Multi-site portfolio view',
    text: 'Monitor every branch, store, or client site from one dashboard. Compare sites and spot underperformers instantly.',
  },
  {
    icon: Gauge,
    title: 'Per-site energy KPIs',
    text: 'Cost per unit area, per employee, per machine hour — the metrics that matter to operations, not just bills.',
  },
  {
    icon: Server,
    title: 'API & integrations',
    text: 'Pull energy data into your own systems, billing platforms, or BMS with a clean, documented API.',
  },
  {
    icon: Lock,
    title: 'Enterprise-grade security',
    text: 'Role-based access, audit logs, and your data isolated — built for organisations that take compliance seriously.',
  },
  {
    icon: Users,
    title: 'Dedicated support',
    text: 'A named engineer during onboarding, training for your team, and priority support whenever you need it.',
  },
  {
    icon: Building2,
    title: 'Deploy at scale',
    text: 'From a single flagship store to a thousand sites — Lattice scales with zero extra hardware headaches.',
  },
];

export default function Enterprise() {
  return (
    <section id="enterprise" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-14 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-2 lg:sticky lg:top-24">
            <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">For enterprises</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">Energy intelligence<br />across your portfolio</h2>
            <p className="mt-5 text-lg text-gray-400 leading-relaxed">Retail chains, offices, campuses, and manufacturers use Lattice to cut energy waste site-by-site — with numbers your CFO can trust.</p>
            <ul className="mt-7 space-y-3">
              {['Fleet-wide rollouts', 'Custom reporting packs', 'SLA-backed uptime'].map((i) => (
                <li key={i} className="flex items-center gap-2.5 text-[15px] font-medium text-gray-300">
                  <CheckCircle2 className="w-4.5 h-4.5 text-brand-light shrink-0" /> {i}
                </li>
              ))}
            </ul>
            <a href="#contact" className="mt-9 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[15px] font-bold text-white hover:bg-brand-light transition-colors">Talk to sales</a>
          </motion.div>

          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-5">
            {capabilities.map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-brand/40 hover:bg-white/[0.05]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-light"><c.icon className="w-5 h-5" /></div>
                <h3 className="mt-5 text-[16px] font-bold text-white">{c.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-gray-400">{c.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}