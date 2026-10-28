import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Landing from './pages/Landing.jsx';
import OriginalHome from './pages/OriginalHome.jsx';
import EnterpriseHome from './pages/EnterpriseHome.jsx';
import ContactPage from './pages/ContactPage.jsx';
import Embed from './pages/Embed.jsx';
import Business from './pages/Business.jsx';
import AboutPage from './pages/AboutPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<OriginalHome />} />
          <Route path="/enterprise" element={<EnterpriseHome />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/business" element={<Business />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/embed" element={<Embed />} />
          <Route path="/pitch" element={<Embed />} />
        </Routes>
      </MotionConfig>
    </BrowserRouter>
  );
}