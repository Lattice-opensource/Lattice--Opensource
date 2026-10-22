import type { DeviceSummary } from "../../data/api/energyApi";

interface DeviceSummaryTableProps {
  devices: DeviceSummary[];
}

const STATUS_STYLES: Record<string, string> = {
  online: "bg-emerald-50 text-ok ring-emerald-200",
  stale: "bg-amber-50 text-warn ring-amber-200",
  offline: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function DeviceSummaryTable({ devices }: DeviceSummaryTableProps) {
  if (devices.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th scope="col" className="py-2 pr-4 font-semibold">Device</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Room</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Power (W)</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Energy (kWh)</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Cost (₹)</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Last seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {devices.map((d) => (
            <tr key={d.deviceId}>
              <td className="py-3 pr-4">
                <p className="font-medium text-ink">{d.name}</p>
                {d.isSimulated ? (
                  <p className="text-[11px] font-medium text-warn">simulated</p>
                ) : null}
              </td>
              <td className="py-3 pr-4 text-muted">{d.roomName ?? "Site level"}</td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                    STATUS_STYLES[d.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"
                  }`}
                >
                  {d.status}
                </span>
              </td>
              <td className="py-3 pr-4 font-semibold tabular-nums text-ink">
                {Math.round(d.powerW)}
              </td>
              <td className="py-3 pr-4 tabular-nums text-ink">{d.energyKwh.toFixed(3)}</td>
              <td className="py-3 pr-4 tabular-nums text-ok">{d.costInr.toFixed(2)}</td>
              <td className="py-3 pr-4 text-xs text-muted">
                {d.lastSeenAt
                  ? new Date(d.lastSeenAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
