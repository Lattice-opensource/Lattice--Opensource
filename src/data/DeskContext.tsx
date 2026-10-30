import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

export type DeskKind = "monitor" | "light" | "speakers" | "computer";

export interface DeskDevice {
  id: string;
  name: string;
  model: string;
  kind: DeskKind;
  baseWatts: number;
  status: "on" | "off";
  currentWatts: number;
  todayKwh: number;
  monthCost: number;
  brightness?: number;
  colorTemp?: number;
  volume?: number;
  mode?: "eco" | "balanced" | "performance";
  source?: string;
}

const INITIAL: DeskDevice[] = [
  { id: "dk-monitor", kind: "monitor", name: "Monitor", model: '27" 4K IPS', baseWatts: 48, status: "on", currentWatts: 36, todayKwh: 0.21, monthCost: 46, brightness: 70, source: "HDMI 1" },
  { id: "dk-light", kind: "light", name: "Desk Light", model: "LED bar · warm↔cool", baseWatts: 16, status: "on", currentWatts: 12, todayKwh: 0.06, monthCost: 13, brightness: 55, colorTemp: 4000 },
  { id: "dk-speakers", kind: "speakers", name: "Speakers", model: "2.0 near-field", baseWatts: 22, status: "off", currentWatts: 0, todayKwh: 0.03, monthCost: 7, volume: 30 },
  { id: "dk-computer", kind: "computer", name: "Computer", model: "Workstation", baseWatts: 320, status: "on", currentWatts: 208, todayKwh: 1.64, monthCost: 342, mode: "balanced" },
];

function loadFraction(d: DeskDevice): number {
  if (d.status !== "on") return 0;
  switch (d.kind) {
    case "monitor": return 0.25 + ((d.brightness ?? 70) / 100) * 0.75;
    case "light": return 0.15 + ((d.brightness ?? 55) / 100) * 0.85;
    case "speakers": return 0.2 + ((d.volume ?? 30) / 100) * 0.8;
    case "computer": return d.mode === "eco" ? 0.35 : d.mode === "performance" ? 1.0 : 0.65;
    default: return 0.5;
  }
}

interface DeskContextValue {
  devices: DeskDevice[];
  toggleDevice: (id: string) => void;
  updateDevice: (id: string, patch: Partial<DeskDevice>) => void;
  addDevice: (d: Omit<DeskDevice, "id" | "currentWatts" | "todayKwh" | "monthCost"> & { baseWatts: number }) => DeskDevice;
  removeDevice: (id: string) => void;
  totalWatts: number;
  totalTodayKwh: number;
  totalMonthCost: number;
  onCount: number;
}

const DeskContext = createContext<DeskContextValue | null>(null);

export function DeskProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<DeskDevice[]>(() =>
    INITIAL.map((d) => ({ ...d, currentWatts: Math.round(d.baseWatts * loadFraction(d)) }))
  );
  const targetsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const t: Record<string, number> = {};
    devices.forEach((d) => {
      t[d.id] = d.status === "on" ? d.baseWatts * loadFraction(d) : 0;
    });
    targetsRef.current = t;
  }, [devices.length]);

  useEffect(() => {
    const iv = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => {
          const target = targetsRef.current[d.id] ?? d.baseWatts * loadFraction(d);
          const jitter = d.status === "on" ? (Math.random() - 0.5) * d.baseWatts * 0.04 : 0;
          const diff = target + jitter - d.currentWatts;
          const factor = diff < 0 ? 0.12 : 0.18;
          let next = d.currentWatts + diff * factor;
          if (target === 0 && next < 2) next = 0;
          const watts = Math.max(0, next);
          const kwhAdd = (watts / 1000) * (1.2 / 3600);
          return {
            ...d,
            currentWatts: Math.round(watts),
            todayKwh: Math.round((d.todayKwh + kwhAdd) * 1000) / 1000,
            monthCost: Math.round(d.monthCost + kwhAdd * 8 * 0.35),
          };
        })
      );
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  const setTarget = (d: DeskDevice) => {
    targetsRef.current[d.id] = d.status === "on" ? d.baseWatts * loadFraction(d) : 0;
  };

  const toggleDevice = (id: string) =>
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, status: d.status === "on" ? ("off" as const) : ("on" as const) };
        setTarget(next);
        return next;
      })
    );

  const updateDevice = (id: string, patch: Partial<DeskDevice>) =>
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        setTarget(next);
        return next;
      })
    );

  const addDevice = (d: Omit<DeskDevice, "id" | "currentWatts" | "todayKwh" | "monthCost"> & { baseWatts: number }) => {
    const id = `dk-${Date.now().toString(36)}`;
    const nd: DeskDevice = { ...d, id, currentWatts: Math.round(d.baseWatts * loadFraction({ ...d, id, currentWatts: 0, todayKwh: 0, monthCost: 0 } as DeskDevice)), todayKwh: 0, monthCost: 0 };
    targetsRef.current[id] = nd.baseWatts * loadFraction(nd);
    setDevices((prev) => [...prev, nd]);
    return nd;
  };

  const removeDevice = (id: string) => setDevices((prev) => prev.filter((d) => d.id !== id));

  const totalWatts = devices.reduce((s, d) => s + d.currentWatts, 0);
  const totalTodayKwh = devices.reduce((s, d) => s + d.todayKwh, 0);
  const totalMonthCost = devices.reduce((s, d) => s + d.monthCost, 0);
  const onCount = devices.filter((d) => d.status === "on").length;

  return (
    <DeskContext.Provider value={{ devices, toggleDevice, updateDevice, addDevice, removeDevice, totalWatts, totalTodayKwh, totalMonthCost, onCount }}>
      {children}
    </DeskContext.Provider>
  );
}

export function useDesk() {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDesk must be used within DeskProvider");
  return ctx;
}
