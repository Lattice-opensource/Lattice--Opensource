import type { DemoRoom } from "../sampleData";

interface Props {
  rooms: DemoRoom[];
  title?: string;
}

export function RoomEnergyChart({ rooms, title = "Room consumption" }: Props) {
  const max = Math.max(1, ...rooms.map((r) => r.energyKwh ?? 0));
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      <div className="space-y-1.5">
        {rooms.map((r) => {
          const v = r.energyKwh ?? 0;
          const pct = (v / max) * 100;
          return (
            <div key={r.id} className="flex items-center gap-2 text-xs">
              <span className="w-24 truncate text-muted">{r.name}</span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-page">
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-16 text-right text-ink">{v.toFixed(2)} kWh</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
