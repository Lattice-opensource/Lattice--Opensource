import { useCallback } from "react";
import type { AggregatePoint, Summary } from "../data/api/energyApi";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import { Card } from "../components/ui/Card";
import { MetricTile } from "../components/ui/MetricTile";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";

interface Tip {
  title: string;
  description: string;
  saving: string;
  priority: "High" | "Medium" | "Low";
}

interface InsightsData {
  tips: Tip[];
  potentialDailySavingInr: number;
  totalEnergyKwh: number;
  totalCostInr: number;
  peakPowerW: number;
  overnightKwh: number;
  topDeviceName: string | null;
  topRoomName: string | null;
}

function localHour(iso: string, timezone: string): number {
  try {
    return Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        hour12: false,
      }).format(new Date(iso)),
    );
  } catch {
    return new Date(iso).getHours();
  }
}

function buildTips(
  summary: Summary | null,
  aggregate: AggregatePoint[],
  timezone: string,
): InsightsData {
  const devices = [...(summary?.byDevice ?? [])]
    .filter((device) => device.roomId !== null && !device.deviceName.toLowerCase().includes("meter"))
    .sort((a, b) => b.energyKwh - a.energyKwh);
  const rooms = [...(summary?.byRoom ?? [])].sort((a, b) => b.costInr - a.costInr);
  const totalEnergyKwh = summary?.totals.energyKwh ?? 0;
  const totalCostInr = summary?.totals.costInr ?? 0;
  const peakPowerW = aggregate.reduce((max, point) => Math.max(max, point.powerWMax), 0);
  const overnightKwh = aggregate
    .filter((point) => localHour(point.bucketStart, timezone) < 6)
    .reduce((sum, point) => sum + point.energyKwh, 0);

  const topDevice = devices[0] ?? null;
  const topRoom = rooms[0] ?? null;
  const tips: Tip[] = [];
  let potentialDailySavingInr = 0;

  if (topDevice && topDevice.energyKwh > 0) {
    const dailySaving = topDevice.costInr * 0.2;
    potentialDailySavingInr += dailySaving;
    tips.push({
      title: `Cut runtime on ${topDevice.deviceName}`,
      description: `It used ${topDevice.energyKwh.toFixed(1)} kWh today, costing ₹${topDevice.costInr.toFixed(0)}. Reducing its daily runtime by about 20% could lower your bill without major changes.`,
      saving: `~₹${dailySaving.toFixed(0)}/day`,
      priority: "High",
    });
  }

  if (topRoom && topRoom.costInr > 0) {
    const share = totalCostInr > 0 ? Math.round((topRoom.costInr / totalCostInr) * 100) : 0;
    tips.push({
      title: `Focus first on ${topRoom.roomName}`,
      description: `This room accounts for about ${share}% of today's monitored energy cost. Start here for the biggest impact: check heating, cooling, and lighting habits.`,
      saving: `${share}% of spend`,
      priority: "High",
    });
  }

  if (peakPowerW > 0) {
    tips.push({
      title: "Stagger your heavy appliances",
      description: `Peak demand reached ${Math.round(peakPowerW)} W today. Running high-power appliances one at a time reduces peak load and can lower demand charges on some tariffs.`,
      saving: "Lower peak",
      priority: "Medium",
    });
  }

  if (overnightKwh > 0) {
    const overnightSaving = overnightKwh * 0.3 * 2.5;
    potentialDailySavingInr += overnightSaving;
    tips.push({
      title: "Trim overnight standby load",
      description: `${overnightKwh.toFixed(2)} kWh was used between midnight and 6 AM. Use timers or smart plugs to switch off idle devices, chargers, and entertainment systems.`,
      saving: `~₹${overnightSaving.toFixed(0)}/day`,
      priority: "Medium",
    });
  }

  tips.push({
    title: "Switch to efficient lighting",
    description: "If any fixtures are still incandescent or halogen, replacing them with LEDs can cut lighting electricity use by up to 75% and lasts far longer.",
    saving: "Up to 75%",
    priority: "Low",
  });

  tips.push({
    title: "Set cooling to a comfortable 24–26°C",
    description: "Every degree below 24°C can increase cooling energy by roughly 6–8%. Use fans alongside cooling so you can keep the thermostat higher.",
    saving: "6–8% per °C",
    priority: "Low",
  });

  return {
    tips,
    potentialDailySavingInr,
    totalEnergyKwh,
    totalCostInr,
    peakPowerW,
    overnightKwh,
    topDeviceName: topDevice?.deviceName ?? null,
    topRoomName: topRoom?.roomName ?? null,
  };
}

export function InsightsPage() {
  const loader = useCallback(async (): Promise<InsightsData> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");

    const to = new Date();
    const from = new Date(to);
    from.setHours(0, 0, 0, 0);

    const [summary, aggregate] = await Promise.all([
      api.getSummary?.({ from: from.toISOString(), to: to.toISOString() }) ?? Promise.resolve(null),
      api.getAggregate?.({
        from: from.toISOString(),
        to: to.toISOString(),
        bucket: "hour",
      }) ?? Promise.resolve([]),
    ]);

    return buildTips(summary, aggregate, overview.timezone);
  }, []);

  const { state, reload } = useApiResource<InsightsData>(loader, 30000);

  if (state.status === "loading") {
    return (
      <div className="py-16">
        <Spinner label="Building your insights" />
      </div>
    );
  }
  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={reload} />;
  }

  const data = state.data;
  const priorityClass: Record<Tip["priority"], string> = {
    High: "bg-brand/10 text-brand-light",
    Medium: "bg-amber-500/10 text-amber-300",
    Low: "bg-page text-muted",
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-light">Insights</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">Save electricity</h1>
        <p className="mt-1 text-sm text-muted">
          Practical advice based on your energy use today, ranked by potential impact.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Energy today"
          value={`${data.totalEnergyKwh.toFixed(2)} kWh`}
        />
        <MetricTile label="Cost today" value={`₹${data.totalCostInr.toFixed(0)}`} accent="emerald" />
        <MetricTile label="Peak power" value={`${Math.round(data.peakPowerW)} W`} accent="amber" />
        <MetricTile
          label="Potential saving"
          value={`₹${data.potentialDailySavingInr.toFixed(0)}/day`}
          accent="brand"
        />
      </div>

      <Card title="Recommended actions" eyebrow="For you">
        <ol className="space-y-3">
          {data.tips.map((tip, index) => (
            <li
              key={tip.title}
              className="flex flex-col gap-3 rounded-xl border border-line bg-page/60 p-4 sm:flex-row sm:items-start"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-black text-brand-light">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-ink">{tip.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass[tip.priority]}`}
                  >
                    {tip.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{tip.description}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand-light">
                {tip.saving}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="How this works" eyebrow="Method">
        <p className="text-sm leading-relaxed text-muted">
          Recommendations are generated from your biggest energy users, the highest-cost room, peak demand, and
          overnight consumption. Savings are rough estimates based on reducing the top device by 20% and cutting
          overnight standby use by 30%. Treat them as guidance, not a guarantee.
        </p>
      </Card>
    </div>
  );
}
