import { Home, Lightbulb, LineChart, BellRing, ShieldCheck, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Home,
    title: 'Room-by-room breakdown',
    text: 'See exactly how much each room of your home costs you — kitchen, living room, bedroom, and beyond.',
  },
  {
    icon: Lightbulb,
    title: 'Appliance-level insight',
    text: 'Know which appliance is the real energy hog. Lattice identifies devices from their usage patterns, so nothing hides in the bill.',
  },
  {
    icon: LineChart,
    title: 'Usage & cost in rupees',
    text: 'No tech jargon. Your energy use is shown in watts you understand and rupees you feel — updated automatically.',
  },
  {
    icon: BellRing,
    title: 'Smart alerts',
    text: 'Get notified about unusual spikes, devices left running overnight, and usage crossing your monthly goal.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    text: 'Your energy data belongs to you. Sharing insights is opt-in, anonymized, and withdrawable at any time.',
  },
  {
    icon: Smartphone,
    title: 'Works on your phone',
    text: 'Check your home from anywhere — a fast, beautiful dashboard that runs right in your browser.',
  },
];

export default function Individuals() {
  return (
    <section id="individuals" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }} className="max-w-2xl">
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">For individuals</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">Your home&rsquo;s electricity, finally understood</h2>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">Stop guessing why the bill keeps climbing. Lattice reads your smart meter and devices, then shows you the story of every rupee.</p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-brand/40 hover:bg-white/[0.05]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-light">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-gray-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}