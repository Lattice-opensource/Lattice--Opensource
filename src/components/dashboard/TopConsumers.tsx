import type { DeviceSummary } from "../../data/api/energyApi";

interface TopConsumersProps {
  devices: DeviceSummary[];
  limit?: number;
}

/**
 * Ranks devices by current power.
 * Site-level meters are excluded: they measure the whole site, not a consumer.
 */
export function TopConsumers({ devices, limit = 5 }: TopConsumersProps) {
  const ranked = devices
    .filter((d) => d.roomName !== null)
    .slice()
    .sort((a, b) => b.powerW - a.powerW)
    .slice(0, limit);

  if (ranked.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No consumer data available.</p>;
  }

  const max = Math.max(...ranked.map((d) => d.powerW), 1);

  return (
    <ol className="space-y-3">
      {ranked.map((device, index) => (
        <li key={device.deviceId} className="flex items-center gap-3">
          <span className="w-4 text-xs font-semibold text-muted">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium text-ink">{device.name}</p>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {Math.round(device.powerW)} W
              </p>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-page">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max((device.powerW / max) * 100, 2)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">{device.roomName ?? "—"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
