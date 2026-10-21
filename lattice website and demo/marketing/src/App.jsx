import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Individuals from './components/Individuals.jsx';
import Enterprise from './components/Enterprise.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Pricing from './components/Pricing.jsx';
import Contact from './components/Contact.jsx';
import ContactPage from './pages/ContactPage.jsx';
import Embed from './pages/Embed.jsx';
import Business from './pages/Business.jsx';
import DotGrid from './components/DotGrid.jsx';
import CustomCursor from './components/CustomCursor.jsx';

function CursorManager() {
  const { pathname } = useLocation();
  const isEmbed = pathname === '/embed' || pathname === '/pitch';
  useEffect(() => {
    if (isEmbed || window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    document.body.classList.add('custom-cursor-active');
    return () => document.body.classList.remove('custom-cursor-active');
  }, [isEmbed]);
  if (isEmbed) return null;
  return <CustomCursor />;
}

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Individuals />
        <Enterprise />
        <HowItWorks />
        <Pricing />
        <Contact />
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen relative">
        <DotGrid />
        <CursorManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/business" element={<Business />} />
          <Route path="/enterprise" element={<Business />} />
          <Route path="/embed" element={<Embed />} />
          <Route path="/pitch" element={<Embed />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}