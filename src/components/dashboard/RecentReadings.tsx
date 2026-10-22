import type { EnergyReading } from "../../data/api/energyApi";

interface RecentReadingsProps {
  readings: EnergyReading[];
  timezone?: string;
}

export function RecentReadings({ readings, timezone }: RecentReadingsProps) {
  if (readings.length === 0) {
    return null;
  }

  const format = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));

  const hasCost = readings.some((r) => r.costInr !== undefined);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th scope="col" className="py-2 pr-4 font-semibold">Time</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Device</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Power (W)</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Energy (kWh)</th>
            {hasCost ? <th scope="col" className="py-2 pr-4 font-semibold">Cost (₹)</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {readings.map((r) => (
            <tr key={`${r.deviceId ?? ""}-${r.timestamp}`}>
              <td className="py-2.5 pr-4 tabular-nums text-muted">{format(r.timestamp)}</td>
              <td className="py-2.5 pr-4 text-ink">{r.deviceId ?? "—"}</td>
              <td className="py-2.5 pr-4 tabular-nums text-ink">
                {Math.round(r.powerW)}
                {r.isSimulated ? (
                  <span className="ml-1 text-[10px] font-medium text-warn">sim</span>
                ) : null}
              </td>
              <td className="py-2.5 pr-4 tabular-nums text-ink">{r.energyKwh.toFixed(4)}</td>
              {hasCost ? (
                <td className="py-2.5 pr-4 tabular-nums text-ok">{r.costInr?.toFixed(2) ?? "—"}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
