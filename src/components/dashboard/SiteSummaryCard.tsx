import type { SiteSummary } from "../../data/api/energyApi";

interface SiteSummaryCardProps {
  site: SiteSummary;
}

export function SiteSummaryCard({ site }: SiteSummaryCardProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{site.name}</h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Current power</dt>
          <dd className="font-medium text-gray-900">{site.currentPowerW} W</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Today energy</dt>
          <dd className="font-medium text-gray-900">{site.todayEnergyKwh} kWh</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Today cost</dt>
          <dd className="font-medium text-emerald-600">₹{site.todayCostInr}</dd>
        </div>
      </dl>
    </article>
  );
}
