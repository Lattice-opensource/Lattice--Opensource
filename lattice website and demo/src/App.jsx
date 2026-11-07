import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import Welcome from './pages/Welcome.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Usage from './pages/Usage.jsx';
import Connect from './pages/Connect.jsx';
import Devices from './pages/Devices.jsx';
import DeviceDetail from './pages/DeviceDetail.jsx';
import Insights from './pages/Insights.jsx';
import Profile from './pages/Profile.jsx';
import Logbook from './pages/Logbook.jsx';
import PowerSources from './pages/PowerSources.jsx';
import { EnergyProvider } from './context/EnergyContext.jsx';

export default function App() {
  const [pro, setPro] = useState(() => localStorage.getItem('lattice-pro') === '1');
  const [theme, setTheme] = useState(() => localStorage.getItem('lattice-theme') || 'dark');
  const [beta, setBeta] = useState(() => localStorage.getItem('lattice-beta') === '1');
  const [started, setStarted] = useState(() => localStorage.getItem('lattice-started') === '1');

  useEffect(() => {
    localStorage.setItem('lattice-pro', pro ? '1' : '0');
  }, [pro]);

  useEffect(() => {
    localStorage.setItem('lattice-beta', beta ? '1' : '0');
  }, [beta]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('lattice-theme', theme);
  }, [theme]);

  const activeColor = pro ? 'text-sky-400' : 'text-rose-400';
  const glowClass = pro ? 'glow-blue' : 'glow-magenta';

  return (
    <HashRouter>
      <EnergyProvider>
        <Routes>
          <Route
            path="/welcome"
            element={
              started ? (
                <Navigate to="/" replace />
              ) : (
                <Welcome
                  onStart={() => {
                    localStorage.setItem('lattice-started', '1');
                    setStarted(true);
                  }}
                />
              )
            }
          />
          <Route element={<Shell pro={pro} setPro={setPro} theme={theme} setTheme={setTheme} activeColor={activeColor} glowClass={glowClass} beta={beta} setBeta={setBeta} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/device/:id" element={<DeviceDetail />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/logbook" element={<Logbook />} />
            <Route path="/power-sources" element={<PowerSources />} />
            <Route path="/solar" element={<Navigate to="/power-sources" replace />} />
          </Route>
          {/* Embed: standalone logbook (no chrome) */}
          <Route path="/embed/logbook" element={<div className="min-h-screen p-4" style={{ background: 'var(--bg)' }}><Logbook /></div>} />
          {/* Embed: whole site with Shell — pitch can iframe the full app */}
          <Route element={<Shell pro={pro} setPro={setPro} theme={theme} setTheme={setTheme} activeColor={activeColor} glowClass={glowClass} beta={beta} setBeta={setBeta} />}>
            <Route path="/embed" element={<Dashboard />} />
            <Route path="/embed/usage" element={<Usage />} />
            <Route path="/embed/connect" element={<Connect />} />
            <Route path="/embed/devices" element={<Devices />} />
            <Route path="/embed/device/:id" element={<DeviceDetail />} />
            <Route path="/embed/insights" element={<Insights />} />
            <Route path="/embed/profile" element={<Profile />} />
            <Route path="/embed/logbook-full" element={<Logbook />} />
            <Route path="/embed/power-sources" element={<PowerSources />} />
          </Route>
          <Route path="*" element={<Navigate to={started ? '/' : '/welcome'} replace />} />
        </Routes>
      </EnergyProvider>
    </HashRouter>
  );
}