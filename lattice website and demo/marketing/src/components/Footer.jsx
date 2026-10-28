import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Footer() {
  const cols = [
    { title: 'Product', links: ['Product', 'Lattice Hub', 'How It Works', 'Pricing'] },
    { title: 'Solutions', links: ['Manufacturing', 'Commercial Buildings', 'Large Facilities', 'Multi-Site'] },
    { title: 'Company', links: ['About', 'Contact', 'Resources'] },
    { title: 'Legal', links: ['Privacy', 'Terms'] },
  ];

  return (
    <footer className="border-t border-white/5 py-14 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <Logo size={24} />
              <span className="font-extrabold tracking-tight text-white">Lattice</span>
            </div>
            <p className="mt-3 text-[12px] text-gray-500">Enterprise Energy Intelligence</p>
            <p className="mt-1 text-[12px] text-gray-600">Connecting Ideas. Building Solutions.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13px] text-gray-400 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-gray-600">
            &copy; {new Date().getFullYear()} Lattice Energy. All rights reserved.
          </p>
          <p className="text-[12px] text-gray-600">lattice.yfc@gmail.com</p>
        </div>
      </div>
    </footer>
  );
}