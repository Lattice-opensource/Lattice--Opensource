import type { DeviceSummary } from "../../data/api/energyApi";

interface DeviceListProps {
  devices: DeviceSummary[];
  limit?: number;
}

function statusDotClass(status: string): string {
  if (status === "online") return "bg-ok";
  if (status === "stale") return "bg-amber-500";
  if (status === "offline") return "bg-slate-400";
  return "bg-slate-300";
}

export function DeviceList({ devices, limit }: DeviceListProps) {
  const visible = limit ? devices.slice(0, limit) : devices;

  if (visible.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No devices reported.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {visible.map((device) => (
        <li key={device.deviceId} className="flex items-center gap-3 py-3">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(device.status)}`}
            aria-hidden="true"
          />
          <span className="sr-only">{device.status}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{device.name}</p>
            <p className="truncate text-xs text-muted">{device.roomName ?? "Site level"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-ink">{Math.round(device.powerW)} W</p>
            {device.isSimulated ? <p className="text-[10px] font-medium text-warn">simulated</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
