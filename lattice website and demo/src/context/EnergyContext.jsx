import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { mockHome } from '../data/mockData.js';

const EnergyContext = createContext(null);

export function EnergyProvider({ children }) {
  const [devices, setDevices] = useState(() =>
    mockHome.devices.map(d => ({
      ...d,
      currentWatts: d.status === 'on' ? Math.round(d.baseWatts * 0.55) : 0,
    }))
  );
  const [paused, setPaused] = useState(false);
  const targetsRef = useRef({});

  useEffect(() => {
    targetsRef.current = {};
    devices.forEach(d => {
      targetsRef.current[d.id] = d.status === 'on' ? d.baseWatts * (0.45 + Math.random() * 0.5) : 0;
    });
  }, [paused, devices.length]);

  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setDevices(prev =>
        prev.map(d => {
          if (d.status === 'on' && Math.random() < 0.1) {
            targetsRef.current[d.id] = d.baseWatts * (0.35 + Math.random() * 0.65);
          }
          const target = targetsRef.current[d.id] ?? 0;
          const diff = target - d.currentWatts;
          // slow drop to 0 when turned off — visible decay over ~3-5s
          const factor = diff < 0 ? 0.11 : 0.16;
          let next = d.currentWatts + diff * factor;
          // when off and very low, nudge to 0 to finish cleanly
          if (target === 0 && next < 4) next = Math.max(0, next - 0.8);
          if (target === 0 && next < 1) next = 0;
          return { ...d, currentWatts: Math.max(0, Math.round(next)) };
        })
      );
    }, 280);
    return () => clearInterval(iv);
  }, [paused]);

  const toggleDevice = id => {
    setDevices(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        const on = d.status !== 'on';
        const next = { ...d, status: on ? 'on' : 'off' };
        targetsRef.current[id] = on ? next.baseWatts * (0.45 + Math.random() * 0.5) : 0;
        return next;
      })
    );
  };

  const toggleRoom = roomName => {
    const roomDevices = devices.filter(d => d.room === roomName);
    const anyOn = roomDevices.some(d => d.status === 'on');
    setDevices(prev =>
      prev.map(d => {
        if (d.room !== roomName) return d;
        if (anyOn) {
          if (d.status === 'on') {
            const next = { ...d, status: 'off' };
            targetsRef.current[d.id] = 0;
            return next;
          }
          return d;
        } else {
          if (d.status === 'off' || d.status === 'paused') {
            const next = { ...d, status: 'on' };
            targetsRef.current[d.id] = next.baseWatts * (0.45 + Math.random() * 0.5);
            return next;
          }
          return d;
        }
      })
    );
  };

  const setAll = status => {
    setDevices(prev =>
      prev.map(d => {
        if (status === 'on' && d.status === 'paused') return d;
        const on = status === 'on';
        const next = { ...d, status: on ? 'on' : 'off' };
        targetsRef.current[d.id] = on ? next.baseWatts * (0.45 + Math.random() * 0.5) : 0;
        return next;
      })
    );
  };

  const nightMode = () => {
    setDevices(prev =>
      prev.map(d => {
        if (d.status === 'paused') return d;
        const on = d.name.toLowerCase().includes('refrigerator');
        const next = { ...d, status: on ? 'on' : 'off' };
        targetsRef.current[d.id] = on ? next.baseWatts * (0.45 + Math.random() * 0.5) : 0;
        return next;
      })
    );
  };

  const addDevice = ({ name, room, baseWatts }) => {
    const id = `d${Date.now().toString(36)}`;
    const watts = Math.max(5, Number(baseWatts) || 100);
    const monthCost = Math.max(20, Math.round(watts * 1.15));
    const todayCost = Math.round(monthCost / 30);
    const newDev = {
      id,
      name: name.trim(),
      room,
      baseWatts: watts,
      monthCost,
      todayCost,
      status: 'on',
      identified: true,
      verified: true,
      registeredAt: new Date().toISOString().slice(0, 10),
      currentWatts: Math.round(watts * 0.55),
    };
    targetsRef.current[id] = watts * 0.55;
    setDevices(prev => [...prev, newDev]);
    return newDev;
  };

  const setRoomState = (roomName, on) => {
    setDevices(prev =>
      prev.map(d => {
        if (d.room !== roomName) return d;
        const next = { ...d, status: on ? 'on' : 'off' };
        targetsRef.current[d.id] = on ? next.baseWatts * (0.55) : 0;
        return next;
      })
    );
  };

  const updateDevice = (id, patch) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const totalWatts = devices.reduce((s, d) => s + d.currentWatts, 0);
  const totalToday = devices.reduce((s, d) => s + d.todayCost, 0);
  const totalMonth = devices.reduce((s, d) => s + d.monthCost, 0);

  return (
    <EnergyContext.Provider
      value={{
        devices,
        paused,
        setPaused,
        toggleDevice,
        toggleRoom,
        setAll,
        nightMode,
        addDevice,
        setRoomState,
        updateDevice,
        totalWatts,
        totalToday,
        totalMonth,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergy() {
  return useContext(EnergyContext);
}