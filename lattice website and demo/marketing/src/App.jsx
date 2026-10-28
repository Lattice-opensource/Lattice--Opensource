import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Problem from './components/Problem.jsx';
import Solution from './components/Solution.jsx';
import ProductShowcase from './components/ProductShowcase.jsx';
import LatticeHub from './components/LatticeHub.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Solutions from './components/Solutions.jsx';
import Pricing from './components/Pricing.jsx';
import TrustImpact from './components/TrustImpact.jsx';
import About from './components/About.jsx';
import FinalCTA from './components/FinalCTA.jsx';
import Footer from './components/Footer.jsx';
import Contact from './components/Contact.jsx';
import ContactPage from './pages/ContactPage.jsx';
import Embed from './pages/Embed.jsx';
import Business from './pages/Business.jsx';
import AboutPage from './pages/AboutPage.jsx';
import DotGrid from './components/DotGrid.jsx';

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
      <div className="min-h-screen relative">
        <DotGrid />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/business" element={<Business />} />
          <Route path="/enterprise" element={<Business />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/embed" element={<Embed />} />
          <Route path="/pitch" element={<Embed />} />
        </Routes>
      </div>
      </MotionConfig>
    </BrowserRouter>
  );
}