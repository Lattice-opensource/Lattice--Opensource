import Navbar from '../original/components/Navbar.jsx';
import Hero from '../original/components/Hero.jsx';
import Individuals from '../original/components/Individuals.jsx';
import Enterprise from '../original/components/Enterprise.jsx';
import HowItWorks from '../original/components/HowItWorks.jsx';
import Pricing from '../original/components/Pricing.jsx';
import Contact from '../original/components/Contact.jsx';
import DotGrid from '../original/components/DotGrid.jsx';
import CustomCursor from '../original/components/CustomCursor.jsx';

export default function OriginalHome() {
  return (
    <div className="min-h-screen relative">
      <DotGrid />
      <Navbar />
      <main>
        <Hero />
        <Individuals />
        <Enterprise />
        <HowItWorks />
        <Pricing />
        <Contact />
      </main>
    </div>
  );
}