import { createContext, useContext, useState, useEffect, useRef } from 'react';

const DeskContext = createContext(null);

/* The four controllable desk devices. `load` is the fraction of baseWatts
   drawn at the current setting (brightness / volume / performance). */
const INITIAL = [
  {
    id: 'dk-monitor',
    kind: 'monitor',
    name: 'Monitor',
    model: '27" 4K IPS',
    baseWatts: 48,
    status: 'on',
    brightness: 70,     // 0-100
    source: 'HDMI 1',
    todayKwh: 0.21,
    monthCost: 46,
  },
  {
    id: 'dk-light',
    kind: 'light',
    name: 'Desk Light',
    model: 'LED bar · warm↔cool',
    baseWatts: 16,
    status: 'on',
    brightness: 55,
    colorTemp: 4000,    // 2700-6500
    todayKwh: 0.06,
    monthCost: 13,
  },
  {
    id: 'dk-speakers',
    kind: 'speakers',
    name: 'Speakers',
    model: '2.0 near-field',
    baseWatts: 22,
    status: 'off',
    volume: 30,
    todayKwh: 0.03,
    monthCost: 7,
  },
  {
    id: 'dk-computer',
    kind: 'computer',
    name: 'Computer',
    model: 'Workstation',
    baseWatts: 320,
    status: 'on',
    mode: 'balanced',   // eco | balanced | performance
    todayKwh: 1.64,
    monthCost: 342,
  },
];

function loadFraction(d) {
  if (d.status !== 'on') return 0;
  switch (d.kind) {
    case 'monitor':  return 0.25 + (d.brightness / 100) * 0.75;
    case 'light':    return 0.15 + (d.brightness / 100) * 0.85;
    case 'speakers': return 0.20 + (d.volume / 100) * 0.80;
    case 'computer': return d.mode === 'eco' ? 0.35 : d.mode === 'performance' ? 1.0 : 0.65;
    default:         return 0.5;
  }
}

export function DeskProvider({ children }) {
  const [devices, setDevices] = useState(() =>
    INITIAL.map(d => ({ ...d, currentWatts: Math.round(d.baseWatts * loadFraction(d)) }))
  );
  const targetsRef = useRef({});

  useEffect(() => {
    targetsRef.current = {};
    devices.forEach(d => {
      targetsRef.current[d.id] = d.status === 'on' ? d.baseWatts * loadFraction(d) : 0;
    });
  }, [devices.length]);

  // Live drift toward target + accumulate kWh / cost
  useEffect(() => {
    const tariff = 8.0;
    const iv = setInterval(() => {
      setDevices(prev =>
        prev.map(d => {
          const target = targetsRef.current[d.id] ?? d.baseWatts * loadFraction(d);
          // small jitter so it feels alive
          const jitter = d.status === 'on' ? (Math.random() - 0.5) * d.baseWatts * 0.04 : 0;
          const diff = target + jitter - d.currentWatts;
          const factor = diff < 0 ? 0.12 : 0.18;
          let next = d.currentWatts + diff * factor;
          if (target === 0 && next < 2) next = 0;
          const watts = Math.max(0, next);
          const kwhAdd = (watts / 1000) * (1.2 / 3600); // 1.2s tick -> kWh
          return {
            ...d,
            currentWatts: Math.round(watts),
            todayKwh: Math.round((d.todayKwh + kwhAdd) * 1000) / 1000,
            monthCost: Math.round(d.monthCost + kwhAdd * tariff * 0.35),
          };
        })
      );
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  const setTarget = (d) => {
    targetsRef.current[d.id] = d.status === 'on' ? d.baseWatts * loadFraction(d) : 0;
  };

  const toggleDevice = (id) =>
    setDevices(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        const next = { ...d, status: d.status === 'on' ? 'off' : 'on' };
        setTarget(next);
        return next;
      })
    );

  const updateDevice = (id, patch) =>
    setDevices(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        setTarget(next);
        return next;
      })
    );

  const addDevice = ({ name, kind, baseWatts, model }) => {
    const id = `dk-${Date.now().toString(36)}`;
    const d = { id, name, kind: kind || 'computer', model: model || 'Custom', baseWatts: Math.max(5, Number(baseWatts) || 100), status: 'on', brightness: 70, volume: 30, mode: 'balanced', todayKwh: 0, monthCost: 0 };
    targetsRef.current[id] = d.baseWatts * loadFraction(d);
    setDevices(prev => [...prev, d]);
    return d;
  };

  const removeDevice = (id) => setDevices(prev => prev.filter(d => d.id !== id));

  const totalWatts = devices.reduce((s, d) => s + d.currentWatts, 0);
  const totalTodayKwh = devices.reduce((s, d) => s + d.todayKwh, 0);
  const totalMonthCost = devices.reduce((s, d) => s + d.monthCost, 0);
  const onCount = devices.filter(d => d.status === 'on').length;

  return (
    <DeskContext.Provider
      value={{ devices, toggleDevice, updateDevice, addDevice, removeDevice, totalWatts, totalTodayKwh, totalMonthCost, onCount }}
    >
      {children}
    </DeskContext.Provider>
  );
}

export function useDesk() {
  return useContext(DeskContext);
}
