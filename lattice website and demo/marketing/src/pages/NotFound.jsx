import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink text-white flex items-center justify-center px-5">
      <div className="max-w-xl w-full text-center">
        <div className="flex justify-center mb-8">
          <Logo size={48} />
        </div>
        <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.25em]">404</p>
        <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tight">
          Page not found
        </h1>
        <p className="mt-5 text-lg text-gray-400 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[15px] font-bold text-white hover:bg-brand-light transition-colors"
          >
            <Home className="w-4 h-4" /> Go home
          </Link>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-[15px] font-semibold text-gray-300 hover:border-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Original site
          </Link>
        </div>
      </div>
    </div>
  );
}