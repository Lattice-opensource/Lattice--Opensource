import type { SiteSummary } from "../../data/api/energyApi";

interface SiteSummaryCardProps {
  site: SiteSummary;
}

export function SiteSummaryCard({ site }: SiteSummaryCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-sm font-semibold text-white">{site.name}</h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
                <dt className="text-gray-400">Current power</dt>
                <dd className="font-medium text-white">{site.currentPowerW} W</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-400">Today energy</dt>
          <dd className="font-medium text-white">{site.todayEnergyKwh} kWh</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-400">Today cost</dt>
          <dd className="font-medium text-emerald-400">₹{site.todayCostInr}</dd>
        </div>
      </dl>
    </article>
  );
}
