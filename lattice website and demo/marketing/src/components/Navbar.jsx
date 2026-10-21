import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo.jsx';

const links = [
  { label: 'For Individuals', href: '/#individuals' },
  { label: 'For Businesses', href: '/business' },
  { label: 'How it works', href: '/#how' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-ink/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-extrabold tracking-tight text-white">Lattice</span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium text-gray-400">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="https://lattice-smart-energy.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-light transition-colors"
        >
          Try the demo <ArrowRight className="w-3.5 h-3.5" />
        </a>

        <button
          className="md:hidden text-gray-300"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-white/5 bg-ink px-5 py-4 flex flex-col gap-4 text-[15px] font-medium text-gray-300">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="hover:text-white">
              {l.label}
            </a>
          ))}
          <a
            href="https://lattice-smart-energy.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white"
          >
            Try the demo <ArrowRight className="w-4 h-4" />
          </a>
        </nav>
      )}
    </header>
  );
}