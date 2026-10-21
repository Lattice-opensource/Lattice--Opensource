import { Check, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'For curious households getting started.',
    features: [
      '1 home, live dashboard',
      'Room-level usage & ₹ cost',
      'Monthly bill estimate',
      'Community support',
    ],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Home Pro',
    price: '₹99',
    period: 'per month',
    desc: 'Everything a modern home needs to cut waste.',
    features: [
      'Everything in Starter',
      'Appliance-level detection (AI)',
      'Smart alerts & daily summaries',
      'Week vs week trend reports',
      'Up to 5 homes',
      'Priority support',
    ],
    cta: 'Start 14-day trial',
    highlight: true,
  },
  {
    name: 'Family',
    price: '₹249',
    period: 'per month',
    desc: 'For larger homes and shared families.',
    features: [
      'Everything in Home Pro',
      'Unlimited homes & rooms',
      'Shared access for family',
      'Custom tariff & solar tracking',
      'Exportable reports',
    ],
    cta: 'Start 14-day trial',
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            Simple plans for homes of every size
          </h2>
          <p className="mt-5 text-lg text-gray-400">
            Pay less than one cup of coffee a month. Cancel anytime, data exports always yours.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5 items-stretch">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: p.highlight ? 1.02 : 1.01 }}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                p.highlight
                  ? 'border-brand/60 bg-gradient-to-b from-brand/15 to-white/[0.03] shadow-glow'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{p.name}</h3>
              <p className="mt-1 text-[13px] text-gray-500">{p.desc}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{p.price}</span>
                <span className="text-[13px] text-gray-500">{p.period}</span>
              </div>
              <ul className="mt-7 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-gray-300">
                    <Check className="w-4 h-4 text-brand-light shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <a href="#contact" className={`mt-8 rounded-full py-3.5 text-center text-[14px] font-bold transition-colors ${p.highlight ? 'bg-brand text-white hover:bg-brand-light' : 'border border-white/15 text-gray-200 hover:border-white/40'}`}>{p.cta}</a>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand-light">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Enterprise</h3>
              <p className="mt-1 text-[14px] text-gray-400 max-w-xl">
                Multi-site monitoring, API access, custom reporting, and dedicated support.
                Volume pricing based on sites.
              </p>
            </div>
          </div>
          <a
            href="#contact"
            className="shrink-0 rounded-full bg-white text-ink px-6 py-3.5 text-[14px] font-bold hover:bg-gray-200 transition-colors"
          >
            Contact sales
          </a>
        </div>
      </div>
    </section>
  );
}