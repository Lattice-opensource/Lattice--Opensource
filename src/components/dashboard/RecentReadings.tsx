import type { EnergyReading } from "../../data/api/energyApi";

interface RecentReadingsProps {
  readings: EnergyReading[];
}

export function RecentReadings({ readings }: RecentReadingsProps) {
  if (readings.length === 0) {
    return null;
  }
  const hasCost = readings.some((r) => r.costInr !== undefined);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs text-gray-400">
            <th scope="col" className="py-2 pr-4 font-medium">Time</th>
            <th scope="col" className="py-2 pr-4 font-medium">Power (kW)</th>
            <th scope="col" className="py-2 pr-4 font-medium">Energy (kWh)</th>
            {hasCost ? <th scope="col" className="py-2 pr-4 font-medium">Cost (₹)</th> : null}
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => (
            <tr key={r.timestamp} className="border-b border-white/5">
              <td className="py-2 pr-4 text-gray-300">{new Date(r.timestamp).toLocaleString()}</td>
              <td className="py-2 pr-4 text-white">{r.powerKw}</td>
              <td className="py-2 pr-4 text-white">{r.energyKwh}</td>
              {hasCost ? (
                <td className="py-2 pr-4 text-emerald-400">{r.costInr ?? "—"}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
