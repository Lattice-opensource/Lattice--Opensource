import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const sources = ['Meters', 'BMS', 'Solar', 'DG', 'Sensors'];
const outputs = ['Monitoring', 'Analytics', 'Alerts', 'Insights'];

export default function Solution() {
  return (
    <section id="solution" className="py-28 px-5 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">The solution</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            One layer for your entire energy infrastructure.
          </h2>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            Lattice sits between your energy sources and your decisions — collecting, normalizing and
            surfacing what matters, in one place.
          </p>
        </motion.div>

        {/* Flow */}
        <div className="mt-20">
          {/* Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {sources.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[14px] font-medium text-gray-200"
              >
                {s}
              </motion.span>
            ))}
          </motion.div>

          {/* Arrow down */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="h-10 w-px bg-gradient-to-b from-white/20 to-brand/60 origin-top"
            />
          </div>

          {/* Lattice core band */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-3xl border border-brand/40 bg-gradient-to-r from-brand/10 via-brand/20 to-brand/10 px-8 py-10 md:py-14 shadow-glow overflow-hidden"
          >
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(225,29,72,0.25), transparent 50%), radial-gradient(circle at 80% 50%, rgba(225,29,72,0.15), transparent 50%)',
            }} />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold text-brand-light uppercase tracking-[0.25em]">Lattice</p>
                <h3 className="mt-2 text-2xl md:text-3xl font-black text-white">One unified intelligence layer</h3>
                <p className="mt-2 text-[14px] text-gray-300 max-w-md">
                  Ingests, normalizes and correlates every energy signal from your infrastructure.
                </p>
              </div>
              <div className="flex items-center gap-2 text-brand-light">
                <ArrowRight className="w-5 h-5" />
                <span className="text-[13px] font-semibold uppercase tracking-wider">Unified</span>
              </div>
            </div>
          </motion.div>

          {/* Arrow down */}
          <div className="flex justify-center mt-8 mb-8">
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="h-10 w-px bg-gradient-to-b from-brand/60 to-white/20 origin-top"
            />
          </div>

          {/* Outputs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {outputs.map((o, i) => (
              <motion.span
                key={o}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                className="rounded-full border border-brand/30 bg-brand/10 px-5 py-2.5 text-[14px] font-semibold text-brand-light"
              >
                {o}
              </motion.span>
            ))}
          </motion.div>

          {/* Arrow down */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="h-10 w-px bg-gradient-to-b from-white/20 to-emerald-500/60 origin-top"
            />
          </div>

          {/* Decisions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-[15px] font-bold text-emerald-400">
              Enterprise decisions
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}