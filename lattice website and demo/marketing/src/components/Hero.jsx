import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const visualOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.6]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0.6]);

  return (
    <section id="top" ref={ref} className="pt-32 pb-20 px-5 overflow-hidden">
      <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-[12px] font-semibold text-brand-light uppercase tracking-wider"
          >
            Enterprise energy intelligence
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]"
          >
            Turn Enterprise Energy Into a{' '}
            <span className="bg-gradient-to-r from-brand to-rose-300 bg-clip-text text-transparent">
              Competitive Advantage.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-lg text-gray-400 leading-relaxed max-w-xl"
          >
            Lattice brings your energy data, facilities, and infrastructure into one clear view &mdash;
            in watts and rupees &mdash; so operations, finance, and sustainability teams can see what is
            running, what is wasting, and what to fix next.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-4"
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
        </motion.div>

        {/* Product dashboard composition */}
        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
          style={{ y: visualY, opacity: visualOpacity }}
          className="relative"
        >
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-8 rounded-[40px] bg-brand/10 blur-3xl"
            aria-hidden
          />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur p-6 shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-gray-500 uppercase tracking-wider">Live building load</p>
                <p className="mt-1 text-3xl font-black text-white">412 kW</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[12px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>

            <div className="mt-5 flex h-28 items-end gap-2">
              {[38, 55, 42, 70, 58, 85, 64, 92, 74, 60, 80, 66, 48, 36].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${h}%`, opacity: 0.5 + (i / 14) * 0.5 }}
                  transition={{ delay: 0.9 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-brand/60 to-brand/90"
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-gray-500">
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>Now</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Grid', value: '₹2.14L' },
                { label: 'Solar', value: '18%' },
                { label: 'DG', value: '₹122/kWh' },
              ].map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + i * 0.1 }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-colors"
                >
                  <p className="text-[11px] text-gray-500">{r.label}</p>
                  <p className="mt-1 text-[15px] font-bold text-white">{r.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-6 flex items-center justify-center gap-2 text-[12px] text-gray-500"
          >
            One centralized layer across your energy infrastructure.
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}