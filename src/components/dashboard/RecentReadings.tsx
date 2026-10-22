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
          <tr className="border-b border-gray-200 text-xs text-gray-500">
            <th scope="col" className="py-2 pr-4 font-medium">Time</th>
            <th scope="col" className="py-2 pr-4 font-medium">Power (W)</th>
            <th scope="col" className="py-2 pr-4 font-medium">Energy (kWh)</th>
            {hasCost ? <th scope="col" className="py-2 pr-4 font-medium">Cost (₹)</th> : null}
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => (
            <tr key={r.timestamp} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-600">{new Date(r.timestamp).toLocaleString()}</td>
              <td className="py-2 pr-4 text-gray-900">
                {r.powerW}
                {r.isSimulated ? <span className="ml-1 text-[10px] text-amber-600">(sim)</span> : null}
              </td>
              <td className="py-2 pr-4 text-gray-900">{r.energyKwh}</td>
              {hasCost ? (
                <td className="py-2 pr-4 text-emerald-600">{r.costInr ?? "—"}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
