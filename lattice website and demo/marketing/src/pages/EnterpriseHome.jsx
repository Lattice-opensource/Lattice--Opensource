import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import Problem from '../components/Problem.jsx';
import Solution from '../components/Solution.jsx';
import ScrollStory from '../components/ScrollStory.jsx';
import ProductShowcase from '../components/ProductShowcase.jsx';
import LatticeHub from '../components/LatticeHub.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Solutions from '../components/Solutions.jsx';
import Pricing from '../components/Pricing.jsx';
import TrustImpact from '../components/TrustImpact.jsx';
import About from '../components/About.jsx';
import FinalCTA from '../components/FinalCTA.jsx';
import Footer from '../components/Footer.jsx';
import Contact from '../components/Contact.jsx';
import DotGrid from '../components/DotGrid.jsx';

export default function EnterpriseHome() {
  return (
    <div className="min-h-screen relative">
      <DotGrid />
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <ScrollStory />
        <ProductShowcase />
        <LatticeHub />
        <HowItWorks />
        <Solutions />
        <Pricing />
        <TrustImpact />
        <About />
        <FinalCTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}