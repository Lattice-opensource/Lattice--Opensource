import { motion } from 'framer-motion';
import { Factory, Building2, Warehouse, Network, Gauge, ArrowRight } from 'lucide-react';

const solutions = [
  { icon: Factory, title: 'Manufacturing', text: 'Per-machine and per-line energy KPIs, peak demand control and shift-based reporting.' },
  { icon: Building2, title: 'Commercial Buildings', text: 'Floor, zone and tenant energy views with after-hours waste detection.' },
  { icon: Warehouse, title: 'Large Facilities', text: 'HVAC, lighting, server rooms and common services monitored as one system.' },
  { icon: Network, title: 'Multi-Site Operations', text: 'Portfolio rollup across branches, stores and campuses with site comparison.' },
  { icon: Gauge, title: 'Enterprise Energy Management', text: 'Cost per unit area, per employee and per machine hour &mdash; metrics operations can act on.' },
];

export default function Solutions() {
  return (
    <section id="solutions" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">Solutions</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            Built for enterprise use cases
          </h2>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            From a single flagship site to a thousand &mdash; Lattice adapts to how your organisation
            actually operates.
          </p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {solutions.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-brand/40 hover:bg-white/[0.05]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-light">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-gray-400">{s.text}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-light group-hover:gap-2.5 transition-all">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}