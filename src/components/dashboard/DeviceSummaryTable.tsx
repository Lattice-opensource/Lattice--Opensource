import type { DeviceSummary } from "../../data/api/energyApi";

interface DeviceSummaryTableProps {
  devices: DeviceSummary[];
}

export function DeviceSummaryTable({ devices }: DeviceSummaryTableProps) {
  if (devices.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs text-gray-500">
            <th scope="col" className="py-2 pr-4 font-medium">Device</th>
            <th scope="col" className="py-2 pr-4 font-medium">Room</th>
            <th scope="col" className="py-2 pr-4 font-medium">Status</th>
            <th scope="col" className="py-2 pr-4 font-medium">Power (W)</th>
            <th scope="col" className="py-2 pr-4 font-medium">Energy (kWh)</th>
            <th scope="col" className="py-2 pr-4 font-medium">Cost (₹)</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.deviceId} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-900">{d.name}</td>
              <td className="py-2 pr-4 text-gray-600">{d.roomName ?? "—"}</td>
              <td className="py-2 pr-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    d.status === "online"
                      ? "bg-emerald-100 text-emerald-700"
                      : d.status === "stale"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {d.status}
                </span>
              </td>
              <td className="py-2 pr-4 text-gray-900">{d.powerW}</td>
              <td className="py-2 pr-4 text-gray-900">{d.energyKwh}</td>
              <td className="py-2 pr-4 text-emerald-600">{d.costInr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
