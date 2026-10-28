import { motion } from 'framer-motion';

export default function About() {
  return (
    <section id="about" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">About Lattice</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            What Lattice is
          </h2>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            Lattice is a smart energy monitor for homes and enterprises. It reads meters and devices and
            shows electricity use in watts and rupees &mdash; per room, per appliance, per site &mdash; so
            people and teams can cut waste without guesswork.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="space-y-6"
        >
          <div>
            <h3 className="text-lg font-bold text-white">Why it exists</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-400">
              Most consumers and enterprises already generate energy data. What is missing is a single,
              trusted layer that turns it into understanding before the next bill arrives.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Long-term vision</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-400">
              A clearer picture of energy infrastructure for every home and every enterprise &mdash; from
              a single room to a thousand sites.
            </p>
          </div>
          <a
            href="/about"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-brand-light hover:text-white"
          >
            Read more about Lattice &rarr;
          </a>
        </motion.div>
      </div>
    </section>
  );
}