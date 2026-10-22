import type { DeviceSummary } from "../../data/api/energyApi";

export type AppliancePeriod = "today" | "7d";

export interface RankedAppliance {
  deviceId: string;
  name: string;
  roomName: string | null;
  energyKwh: number;
  powerW: number;
  share: number;
  isSimulated: boolean;
}

interface ApplianceRankingProps {
  items: RankedAppliance[];
  householdEnergyKwh: number;
  coverageIncomplete: boolean;
  period: AppliancePeriod;
  onPeriodChange: (period: AppliancePeriod) => void;
  loading?: boolean;
}

function formatKwh(value: number): string {
  return value >= 1 ? value.toFixed(2) : value.toFixed(3);
}

export function ApplianceRanking({
  items,
  householdEnergyKwh,
  coverageIncomplete,
  period,
  onPeriodChange,
  loading,
}: ApplianceRankingProps) {
  const maxEnergy = Math.max(...items.map((i) => i.energyKwh), 0.0001);

  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            07 · Appliance insights
          </p>
          <h2 className="text-base font-semibold text-ink">Ranked by energy use</h2>
          <p className="mt-1 text-xs text-muted">
            Share of household consumption, highest first.
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-line bg-page p-1"
          role="group"
          aria-label="Time period"
        >
          {(["today", "7d"] as AppliancePeriod[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPeriodChange(option)}
              aria-pressed={period === option}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                period === option
                  ? "bg-brand text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              {option === "today" ? "Today" : "7 days"}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">Loading appliance data…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No appliance energy data is available for this period.
        </p>
      ) : (
        <>
          <ol className="space-y-3">
            {items.map((item, index) => (
              <li key={item.deviceId} className="flex items-center gap-3">
                <span className="w-5 text-xs font-semibold text-muted">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {formatKwh(item.energyKwh)} kWh
                    </p>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-page">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${Math.max((item.energyKwh / maxEnergy) * 100, 2)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                    <span>
                      {item.roomName ?? "Site level"} · {Math.round(item.powerW)} W
                      {item.isSimulated ? " · simulated" : ""}
                    </span>
                    <span className="font-semibold text-ink">{item.share.toFixed(1)}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-xl border border-line bg-page/60 p-3 text-xs text-muted">
            <p>
              <span className="font-semibold text-ink">
                {items[0].name}
              </span>{" "}
              is the highest-consuming monitored appliance for this period and accounts for{" "}
              <span className="font-semibold text-ink">{items[0].share.toFixed(0)}%</span> of
              household energy use.
            </p>
            <p className="mt-1">
              Household total: {formatKwh(householdEnergyKwh)} kWh
              {coverageIncomplete
                ? " · breakdown covers only monitored appliances; the full household total may include unmonitored load."
                : "."}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

export function rankAppliances(
  devices: DeviceSummary[],
  householdEnergyKwh: number,
): RankedAppliance[] {
  const appliances = devices.filter((d) => d.roomName !== null);
  return appliances
    .map((d) => ({
      deviceId: d.deviceId,
      name: d.name,
      roomName: d.roomName,
      energyKwh: d.energyKwh,
      powerW: d.powerW,
      share:
        householdEnergyKwh > 0 ? (d.energyKwh / householdEnergyKwh) * 100 : 0,
      isSimulated: d.isSimulated,
    }))
    .sort((a, b) => b.energyKwh - a.energyKwh);
}
