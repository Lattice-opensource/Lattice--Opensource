import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 px-5 pb-20">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">About</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">About Lattice</h1>

          <div className="mt-8 space-y-6 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-2">What Lattice is</h2>
              <p>
                Lattice is a smart energy monitor for homes and enterprises. It connects to your smart
                meter and Home Assistant setup and shows electricity use in watts and rupees &mdash; per
                room, per appliance, per site &mdash; so you can cut waste without guesswork.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white mb-2">Why it exists</h2>
              <p>
                Most consumers and enterprises already generate energy data. What is missing is a single,
                trusted layer that turns it into understanding before the next bill arrives.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white mb-2">The problem we are solving</h2>
              <p>
                Fragmented energy data, limited visibility across facilities, hidden inefficiencies,
                reactive decision-making, complex multi-site infrastructure and difficulty identifying
                anomalies.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white mb-2">Long-term vision</h2>
              <p>
                A clearer picture of energy infrastructure for every home and every enterprise &mdash;
                from a single room to a thousand sites.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}