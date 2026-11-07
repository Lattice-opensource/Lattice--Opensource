import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 px-5 border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-black tracking-tight text-white"
        >
          Build a clearer picture of your energy infrastructure.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mt-5 text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto"
        >
          Explore Lattice or request a demo to see how your energy data can become a competitive
          advantage.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[15px] font-bold text-white hover:bg-brand-light shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Book a Demo <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#product"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-[15px] font-semibold text-gray-300 hover:border-white/40 hover:text-white transition-colors"
          >
            Explore Lattice
          </a>
        </motion.div>
      </div>
    </section>
  );
}