import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  { name: 'Business', price: '₹4,999', period: '/month', desc: 'For small offices and teams' },
  { name: 'Business+', price: '₹9,999', period: '/month', desc: 'For growing businesses' },
  { name: 'Professional', price: '₹19,999', period: '/month', desc: 'For multi-team organizations' },
  { name: 'Enterprise', price: '₹39,999', period: '/month', desc: 'For large organizations', highlight: true },
  { name: 'Enterprise Max', price: '₹79,999', period: '/month', desc: 'For large-scale and complex deployments' },
];

const cards = [
  {
    name: 'Business',
    price: '₹4,999',
    period: '/month',
    desc: 'For small offices and teams',
    features: [
      'For small offices and teams',
      'Monitor up to 50 devices',
      'Basic automation and energy analytics',
      'Device health monitoring and basic audit logs',
      '30-day cloud data history',
    ],
  },
  {
    name: 'Business+',
    price: '₹9,999',
    period: '/month',
    desc: 'For growing businesses',
    features: [
      'Everything in Business, plus:',
      'Up to 150 devices and 75 users',
      'Advanced device groups and permissions',
      'More automation options and basic custom workflows',
      'Webhooks and limited third-party integrations',
      '90-day cloud data history',
    ],
  },
  {
    name: 'Professional',
    price: '₹19,999',
    period: '/month',
    desc: 'For multi-team organizations',
    highlight: true,
    features: [
      'Everything in Business+, plus:',
      'Up to 500 devices and 250 users',
      'Multi-location management',
      'Full API access and broader integrations',
      'Custom roles, shared-device voting and advanced audit logs',
      'One year of cloud data history and SSO',
      'Optional local/edge deployment',
    ],
  },
  {
    name: 'Enterprise',
    price: '₹39,999',
    period: '/month',
    desc: 'For large organizations',
    features: [
      'Everything in Professional, plus:',
      'Up to 2,000 devices and unlimited users',
      'Advanced multi-location operations',
      'Extended data history',
      'Local/edge deployment included',
      'Enterprise support and optional dedicated cloud',
      'Optional custom SLA',
    ],
  },
  {
    name: 'Enterprise Max',
    price: '₹79,999',
    period: '/month',
    desc: 'For large-scale and complex deployments',
    features: [
      'Everything in Enterprise, plus:',
      'Up to 8,000 devices',
      'Fully customizable permissions and automation logic',
      'Custom integrations and workflows',
      'Custom data-retention arrangements',
      'Dedicated support and custom SLA',
    ],
  },
];

// Comparison table rows. Each row: { feature, values: [5 values] }
// Ordered by inclusion count (non-dash), with Price/Devices/Users/Best for in sensible positions.
const rows = [
  // 5-plan group (key info first)
  { feature: 'Price/month', values: ['₹4,999', '₹9,999', '₹19,999', '₹39,999', '₹79,999'] },
  { feature: 'Devices included', values: ['50', '150', '500', '2,000', '8,000'] },
  { feature: 'Users', values: ['25', '75', '250', 'Unlimited', 'Unlimited'] },
  { feature: 'Device health monitoring', values: ['Yes', 'Yes', 'Yes', 'Yes', 'Yes'] },
  { feature: 'Automation rules', values: ['Basic', 'Advanced', 'Advanced', 'Advanced', 'Custom logic'] },
  { feature: 'Energy analytics', values: ['Basic', 'Standard', 'Advanced', 'Advanced', 'Advanced'] },
  { feature: 'Role-based permissions', values: ['Basic', 'Advanced', 'Custom roles', 'Advanced', 'Fully customizable'] },
  { feature: 'Device groups & spaces', values: ['Basic', 'Advanced', 'Advanced', 'Advanced', 'Advanced'] },
  { feature: 'Audit logs', values: ['Basic', 'Basic', 'Advanced', 'Advanced', 'Advanced'] },
  { feature: 'Cloud data history', values: ['30 days', '90 days', '1 year', 'Extended', 'Custom'] },
  { feature: 'Support', values: ['Standard', 'Priority', 'Priority', 'Enterprise', 'Dedicated'] },
  // 4-plan group
  { feature: 'Third-party integrations', values: ['—', 'Limited', 'Yes', 'Advanced', 'Custom'] },
  { feature: 'Custom workflows', values: ['—', 'Basic', 'Yes', 'Yes', 'Yes'] },
  { feature: 'API & webhooks', values: ['—', 'Webhooks', 'Full access', 'Full access', 'Full access'] },
  // 3-plan group
  { feature: 'Multiple locations', values: ['—', '—', 'Yes', 'Yes', 'Yes'] },
  { feature: 'Shared-device voting', values: ['—', '—', 'Basic', 'Advanced', 'Advanced'] },
  { feature: 'SSO', values: ['—', '—', 'Yes', 'Yes', 'Yes'] },
  { feature: 'Local/edge deployment', values: ['—', '—', 'Optional', 'Yes', 'Yes'] },
  // 2-plan group
  { feature: 'Dedicated cloud', values: ['—', '—', '—', 'Optional', 'Optional'] },
  { feature: 'Custom SLA', values: ['—', '—', '—', 'Optional', 'Yes'] },
  // Best for (sensible at end)
  { feature: 'Best for', values: ['Small offices', 'Growing offices', 'Multi-team companies', 'Large organizations', 'Large-scale enterprises'] },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-5 border-t border-white/5">
      <div className="max-w-screen-2xl mx-auto px-2">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
            Plans for every scale
          </h2>
          <p className="mt-5 text-lg text-gray-400">
            Choose the plan that fits your organization. Scale up as you grow.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch">
          {cards.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-300 cursor-pointer ${
                c.highlight
                  ? 'border-brand/60 bg-gradient-to-b from-brand/15 to-white/[0.03] shadow-glow hover:shadow-[0_0_40px_rgba(225,29,72,0.25)]'
                  : 'border-white/10 bg-white/[0.03] hover:border-brand/40 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(225,29,72,0.12)]'
              }`}
            >
              {c.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{c.name}</h3>
              <p className="mt-1 text-[12px] text-gray-500">{c.desc}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{c.price}</span>
                <span className="text-[12px] text-gray-500">{c.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5 flex-1">
                {c.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-gray-300">
                    <Check className="w-3.5 h-3.5 text-brand-light shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`mt-6 rounded-full py-3 text-center text-[13px] font-bold transition-colors ${
                  c.highlight
                    ? 'bg-brand text-white hover:bg-brand-light'
                    : 'border border-white/15 text-gray-200 hover:border-white/40'
                }`}
              >
                Talk to Sales
              </a>
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-20">
          <h3 className="text-2xl font-black tracking-tight text-white text-center mb-8">
            Feature comparison
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="text-left px-4 py-4 font-bold text-white sticky left-0 bg-ink z-10">Feature</th>
                  {plans.map((pl) => (
                    <th key={pl.name} className="px-4 py-4 font-bold text-white text-center whitespace-nowrap">
                      {pl.name}
                      <div className="mt-1 text-[11px] font-normal text-gray-500">{pl.price}{pl.period}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.feature} className={ri % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <td className="px-4 py-3 font-semibold text-gray-200 sticky left-0 bg-ink z-10 whitespace-nowrap">
                      {row.feature}
                    </td>
                    {row.values.map((v, vi) => (
                      <td
                        key={vi}
                        className={`px-4 py-3 text-center ${
                          v === '—' ? 'text-gray-600' : 'text-gray-300'
                        }`}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-[12px] text-gray-500">
            A dash (—) indicates the feature is not included in that plan.
          </p>
        </div>
      </div>
    </section>
  );
}