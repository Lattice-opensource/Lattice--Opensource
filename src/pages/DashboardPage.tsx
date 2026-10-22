import { useEffect, useState } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import type { SiteSummary } from "../data/api/energyApi";

export function DashboardPage() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getEnergyApi()
      .getSiteSummaries()
      .then((result) => {
        if (active) setSites(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">
          Overview of connected sites. Data shown is sample data only.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <article
              key={site.siteId}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <h2 className="text-sm font-semibold text-white">{site.name}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Current power</dt>
                  <dd className="font-medium text-white">{site.currentPowerKw} kW</dd>
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
          ))}
        </div>
      )}
    </section>
  );
}
