import type { EnergyReading, SiteSummary } from "../api/energyApi";

export const SAMPLE_SITE_SUMMARIES: SiteSummary[] = [
  {
    siteId: "site-001",
    name: "Lattice Office Tower - HQ",
    currentPowerW: 82500,
    todayEnergyKwh: 1240.5,
    todayCostInr: 9850.4,
  },
  {
    siteId: "site-002",
    name: "Lattice Office Tower - Branch",
    currentPowerW: 31200,
    todayEnergyKwh: 485.2,
    todayCostInr: 3920.8,
  },
];

export const SAMPLE_READINGS: Record<string, EnergyReading[]> = {
  "site-001": [
    { timestamp: "2026-10-22T09:00:00+05:30", powerW: 78000, energyKwh: 19.5, costInr: 156.0, isSimulated: true },
    { timestamp: "2026-10-22T10:00:00+05:30", powerW: 82000, energyKwh: 20.5, costInr: 164.0, isSimulated: true },
    { timestamp: "2026-10-22T11:00:00+05:30", powerW: 86000, energyKwh: 21.5, costInr: 172.0, isSimulated: true },
  ],
  "site-002": [
    { timestamp: "2026-10-22T09:00:00+05:30", powerW: 29000, energyKwh: 7.25, costInr: 58.0, isSimulated: true },
    { timestamp: "2026-10-22T10:00:00+05:30", powerW: 31000, energyKwh: 7.75, costInr: 62.0, isSimulated: true },
    { timestamp: "2026-10-22T11:00:00+05:30", powerW: 33000, energyKwh: 8.25, costInr: 66.0, isSimulated: true },
  ],
};