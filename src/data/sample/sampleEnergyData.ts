import type { EnergyReading, SiteSummary } from "../api/energyApi";

export const SAMPLE_SITE_SUMMARIES: SiteSummary[] = [
  {
    siteId: "site-001",
    name: "Home — Living Room Panel",
    currentPowerW: 1420,
    todayEnergyKwh: 8.7,
    todayCostInr: 62.4,
  },
  {
    siteId: "site-002",
    name: "Office — Main Floor",
    currentPowerW: 3050,
    todayEnergyKwh: 24.1,
    todayCostInr: 198.5,
  },
];

export const SAMPLE_READINGS: Record<string, EnergyReading[]> = {
  "site-001": [
    { timestamp: "2026-10-22T09:00:00+05:30", powerW: 1200, energyKwh: 0.3, costInr: 2.16, isSimulated: true },
    { timestamp: "2026-10-22T10:00:00+05:30", powerW: 1400, energyKwh: 0.35, costInr: 2.52, isSimulated: true },
    { timestamp: "2026-10-22T11:00:00+05:30", powerW: 1600, energyKwh: 0.4, costInr: 2.88, isSimulated: true },
  ],
  "site-002": [
    { timestamp: "2026-10-22T09:00:00+05:30", powerW: 2800, energyKwh: 0.7, costInr: 5.76, isSimulated: true },
    { timestamp: "2026-10-22T10:00:00+05:30", powerW: 3100, energyKwh: 0.78, costInr: 6.39, isSimulated: true },
    { timestamp: "2026-10-22T11:00:00+05:30", powerW: 3300, energyKwh: 0.83, costInr: 6.8, isSimulated: true },
  ],
};
