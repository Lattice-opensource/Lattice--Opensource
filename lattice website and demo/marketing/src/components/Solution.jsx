import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

const layers = [
  { label: 'ENERGY SOURCES', items: ['Meters', 'BMS', 'Solar', 'DG', 'Sensors'] },
  { label: 'LATTICE', items: ['One unified layer'] },
  { label: 'OUTPUTS', items: ['Monitoring', 'Analytics', 'Alerts', 'Insights'] },
  { label: 'DECISIONS', items: ['Enterprise decisions'] },
];

export default function Solution() {
  return (
    <section id="solution" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">The solution</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            One layer for your entire energy infrastructure.
          </h2>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            Lattice sits between your energy sources and your decisions &mdash; collecting, normalizing and
            surfacing what matters, in one place.
          </p>
        </motion.div>

        <div className="mt-16 flex flex-col items-center gap-6">
          {layers.map((layer, li) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: li * 0.15, duration: 0.6 }}
              className="w-full max-w-4xl"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-[11px] font-bold text-brand-light uppercase tracking-[0.2em] mb-3">
                  {layer.label}
                </p>
                <div className="flex flex-wrap gap-3">
                  {layer.items.map((it) => (
                    <span
                      key={it}
                      className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                        layer.label === 'LATTICE'
                          ? 'bg-brand text-white shadow-glow'
                          : 'border border-white/10 bg-white/[0.04] text-gray-200'
                      }`}
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
              {li < layers.length - 1 && (
                <div className="flex justify-center my-2">
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: li * 0.2 }}
                  >
                    <ArrowDown className="w-5 h-5 text-brand-light" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}