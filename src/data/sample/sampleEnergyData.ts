import type { EnergyReading, SiteSummary } from "../api/energyApi";

export const SAMPLE_SITE_SUMMARIES: SiteSummary[] = [
  {
    siteId: "site-001",
    name: "Home — Living Room Panel",
    currentPowerKw: 1.42,
    todayEnergyKwh: 8.7,
    todayCostInr: 62.4,
  },
  {
    siteId: "site-002",
    name: "Office — Main Floor",
    currentPowerKw: 3.05,
    todayEnergyKwh: 24.1,
    todayCostInr: 198.5,
  },
];

export const SAMPLE_READINGS: Record<string, EnergyReading[]> = {
  "site-001": [
    { timestamp: "2026-10-22T09:00:00+05:30", powerKw: 1.2, energyKwh: 0.3, costInr: 2.16 },
    { timestamp: "2026-10-22T10:00:00+05:30", powerKw: 1.4, energyKwh: 0.35, costInr: 2.52 },
    { timestamp: "2026-10-22T11:00:00+05:30", powerKw: 1.6, energyKwh: 0.4, costInr: 2.88 },
  ],
  "site-002": [
    { timestamp: "2026-10-22T09:00:00+05:30", powerKw: 2.8, energyKwh: 0.7, costInr: 5.76 },
    { timestamp: "2026-10-22T10:00:00+05:30", powerKw: 3.1, energyKwh: 0.78, costInr: 6.39 },
    { timestamp: "2026-10-22T11:00:00+05:30", powerKw: 3.3, energyKwh: 0.83, costInr: 6.8 },
  ],
};
