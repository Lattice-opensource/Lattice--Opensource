export const mockHome = {
  name: "Guruprasad Residence",
  tariff: 8.0,
  hubConnected: true,
  hubType: "Home Assistant",
  solar: true,
  solarCapacityKw: 3.5,
  lastMonthTotal: 4120,
  yesterdayTotal: 138,
  rooms: [
    { id: "r1", name: "Living Room", devices: ["d1", "d2", "d7"] },
    { id: "r2", name: "Master Bedroom", devices: ["d3", "d8"] },
    { id: "r3", name: "Kitchen", devices: ["d4", "d6"] },
    { id: "r4", name: "Guest Room", devices: [] },
    { id: "r5", name: "Utility", devices: ["d5"] },
  ],
  devices: [
    {
      id: "d1",
      name: "1.5T AC — Living Room",
      room: "Living Room",
      type: "ac",
      baseWatts: 1500,
      monthCost: 1850,
      todayCost: 62,
      status: "on",
      identified: true,
      verified: true,
      registeredAt: "2024-03-12",
      temp: 24,
      mode: "cool",
      fan: 2,
    },
    {
      id: "d2",
      name: "LED TV + Soundbar",
      room: "Living Room",
      type: "tv",
      baseWatts: 130,
      monthCost: 210,
      todayCost: 7,
      status: "on",
      identified: true,
      verified: true,
      registeredAt: "2024-04-08",
      volume: 22,
      channel: "HDMI 1",
      brightness: 70,
    },
    {
      id: "d3",
      name: "Cooler",
      room: "Master Bedroom",
      type: "cooler",
      baseWatts: 220,
      monthCost: 95,
      todayCost: 3,
      status: "on",
      identified: true,
      verified: false,
      registeredAt: "2024-05-20",
      temp: 22,
      fanSpeed: 3,
      swing: true,
    },
    {
      id: "d4",
      name: "Refrigerator",
      room: "Kitchen",
      type: "fridge",
      baseWatts: 320,
      monthCost: 640,
      todayCost: 21,
      status: "on",
      identified: true,
      verified: true,
      registeredAt: "2024-03-01",
      temp: 4,
      freezerTemp: -18,
      mode: "auto",
    },
    {
      id: "d5",
      name: "Washing Machine",
      room: "Utility",
      type: "washer",
      baseWatts: 500,
      monthCost: 320,
      todayCost: 0,
      status: "paused",
      identified: true,
      verified: true,
      registeredAt: "2024-06-14",
      cycle: "normal",
      temp: 40,
      spin: 800,
    },
    {
      id: "d6",
      name: "Kitchen Plug 3",
      room: "Kitchen",
      type: "plug",
      baseWatts: 280,
      monthCost: 0,
      todayCost: 0,
      status: "on",
      identified: false,
      verified: false,
      pattern: "short bursts, mornings + evenings — could be a toaster, mixer or water heater",
      registeredAt: "2024-07-02",
    },
    {
      id: "d7",
      name: "Tubelight — Living Room",
      room: "Living Room",
      type: "light",
      baseWatts: 36,
      monthCost: 45,
      todayCost: 1,
      status: "on",
      identified: true,
      verified: true,
      registeredAt: "2024-04-15",
      brightness: 80,
      colorTemp: 4000,
      color: "warm white",
    },
    {
      id: "d8",
      name: "Thermostat — Master Bedroom",
      room: "Master Bedroom",
      type: "thermostat",
      baseWatts: 5,
      monthCost: 8,
      todayCost: 0,
      status: "on",
      identified: true,
      verified: true,
      registeredAt: "2024-05-28",
      temp: 26,
      targetTemp: 24,
      humidity: 55,
      mode: "auto",
    },
  ],
};

export const FLOORS = [
  { id: 'ground', name: 'Ground Floor', color: '#E11D48', soft: 'rgba(225,29,72,0.14)', rooms: ['Living Room', 'Kitchen'] },
  { id: 'first', name: 'First Floor', color: '#0EA5E9', soft: 'rgba(14,165,233,0.14)', rooms: ['Master Bedroom'] },
  { id: 'second', name: 'Second Floor', color: '#F59E0B', soft: 'rgba(245,158,11,0.14)', rooms: ['Guest Room'] },
  { id: 'terrace', name: 'Terrace / Utility', color: '#10B981', soft: 'rgba(16,185,129,0.14)', rooms: ['Utility'] },
];

export const FLOOR_DAILY_RECORDS = (() => {
  // day-wise kWh per floor for last 7 days
  const base = { ground: 9.2, first: 3.8, second: 1.6, terrace: 2.1 };
  const variance = { ground: 3.5, first: 1.8, second: 1.2, terrace: 1.4 };
  const tariff = 8.0;
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateLabel = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const floors = {};
    let totalKwh = 0;
    FLOORS.forEach(f => {
      // deterministic pseudo-random per day+flooor
      const seed = (d.getDate() * 17 + f.id.charCodeAt(0) * 13) % 100;
      const wav = Math.sin((6 - i) * 0.9 + f.id.length) * 0.5 + Math.sin(seed * 0.21) * 0.5;
      const kwh = Math.max(0.6, base[f.id] + wav * variance[f.id] + (seed % 7) * 0.12);
      const rounded = Math.round(kwh * 10) / 10;
      floors[f.id] = { kwh: rounded, cost: Math.round(rounded * tariff) };
      totalKwh += rounded;
    });
    // add small rounding to keep total consistent
    totalKwh = Math.round(totalKwh * 10) / 10;
    days.push({ iso, label, dateLabel, floors, totalKwh, totalCost: Math.round(totalKwh * tariff) });
  }
  return days;
})();

export const mockUser = {
  name: 'Guruprasad K.',
  gmail: 'guruprasad.lattice@gmail.com',
  phone: '+91 98XXX X3210',
  avatar: 'GK',
  accountId: 'LT-2024-8841',
  memberSince: 'March 2024',
  address: 'Guruprasad Residence, Pune, Maharashtra 411001',
  plan: 'Free',
  verifiedGmail: true,
};

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function dailyProfile(device, seed) {
  const hours = [];
  for (let h = 0; h < 24; h++) {
    let f = 0.15 + 0.25 * Math.sin((h - 9) * 0.55) + 0.1 * Math.sin((h - 19) * 1.1);
    const on = h >= 6 && h <= 23;
    hours.push({
      hour: h,
      watts: on ? Math.round(Math.max(0, device.baseWatts * Math.max(0.12, f)) + seed) : 0,
    });
  }
  return hours;
}

export function weekTotals(totalMonth) {
  const factors = [0.82, 0.9, 1.04, 0.95, 1.12, 1.26, 0.88];
  return factors.map(f => Math.round((totalMonth / 30) * f));
}

export const anomalies = [
  {
    deviceId: 'd1',
    title: 'Living Room AC',
    kind: 'high',
    icon: 'warn',
    aboveUsualPercent: 32,
    extraCostWeek: 42,
    insight: 'AC usage unusually high — check timer/evening usage',
  },
  {
    room: 'Kitchen',
    title: 'Kitchen',
    kind: 'high',
    icon: 'bulb',
    aboveUsualPercent: 18,
    extraCostWeek: 55,
    insight: 'Kitchen usage increased — check which devices caused it',
  },
  {
    deviceId: 'd4',
    title: 'Refrigerator',
    kind: 'normal',
    icon: 'ok',
    aboveUsualPercent: 0,
    extraCostWeek: 0,
    insight: 'Refrigerator normal — no action needed',
  },
];

export function potentialSavings() {
  const weekly = anomalies
    .filter(a => a.kind === 'high')
    .reduce((s, a) => s + a.extraCostWeek, 0);
  return Math.round((weekly * 52) / 12);
}

export function getLogbook(device, days = 60) {
  const tariff = mockHome.tariff;
  const reg = new Date(device.registeredAt || '2024-04-01');
  const today = new Date();
  const logs = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d < reg) continue;
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const seed = (d.getDate() * 17 + device.id.charCodeAt(1) * 13 + device.baseWatts) % 100;
    const wav = Math.sin(i * 0.31 + device.baseWatts * 0.001) * 0.5 + Math.sin(seed * 0.18) * 0.5;
    const kwhBase = (device.baseWatts / 1000) * (device.status === 'paused' ? 2 : 5 + wav * 2.5);
    const kwh = Math.max(0.1, Math.round((kwhBase + (seed % 5) * 0.15) * 10) / 10);
    const runtime = Math.max(0.5, Math.round((kwh / (device.baseWatts / 1000)) * 10) / 10);
    const cost = Math.round(kwh * tariff);
    const onHours = device.status === 'paused' ? '—' : `${Math.round(runtime * 10) / 10} h`;
    logs.push({ iso, label, kwh, runtime, cost, onHours, watts: device.baseWatts });
  }
  return logs;
}

export function daysSince(iso) {
  const a = new Date(iso);
  const b = new Date();
  return Math.max(1, Math.floor((b - a) / (1000 * 60 * 60 * 24)));
}

export function energyStatus(kwh) {
  if (kwh < 6) return { label: 'Low', color: '#10B981', dot: '🟢', bg: 'rgba(16,185,129,0.14)' };
  if (kwh < 10) return { label: 'Normal', color: '#F59E0B', dot: '🟡', bg: 'rgba(245,158,11,0.14)' };
  return { label: 'High', color: '#E11D48', dot: '🔴', bg: 'rgba(225,29,72,0.14)' };
}