import type { RoomSummary } from "../../data/api/energyApi";

interface ZoneDonutProps {
  rooms: RoomSummary[];
}

const COLORS = ["#e11d48", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"];

export function ZoneDonut({ rooms }: ZoneDonutProps) {
  if (rooms.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No zone data available.</p>;
  }

  const total = rooms.reduce((s, r) => s + r.energyKwh, 0) || 1;
  let offset = 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row">
      <svg width="180" height="180" viewBox="0 0 180 180" className="shrink-0">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="currentColor" className="text-line" strokeWidth="24" />
        {rooms.map((room, i) => {
          const fraction = room.energyKwh / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const rotate = (offset / total) * 360;
          offset += room.energyKwh;
          return (
            <circle
              key={room.roomId}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="24"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rotate - 90} 90 90)`}
              strokeLinecap="butt"
            />
          );
        })}
        <text x="90" y="86" textAnchor="middle" className="fill-current text-ink" fontSize="16" fontWeight="700">
          {total.toFixed(0)}
        </text>
        <text x="90" y="104" textAnchor="middle" className="fill-current text-muted" fontSize="10">
          kWh
        </text>
      </svg>
      <ul className="w-full space-y-2">
        {rooms.map((room, i) => (
          <li key={room.roomId} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                aria-hidden="true"
              />
              <span className="truncate text-ink">{room.roomName}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted">
              {((room.energyKwh / total) * 100).toFixed(1)}% · {room.energyKwh.toFixed(1)} kWh
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}