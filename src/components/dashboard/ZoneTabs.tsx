import { useState } from "react";
import type { RoomSummary } from "../../data/api/energyApi";
import type { DeviceSummary } from "../../data/api/energyApi";

interface ZoneTabsProps {
  rooms: RoomSummary[];
  devices: DeviceSummary[];
}

export function ZoneTabs({ rooms, devices }: ZoneTabsProps) {
  const [selected, setSelected] = useState(rooms[0]?.roomId ?? "");
  const room = rooms.find((r) => r.roomId === selected) ?? rooms[0];
  const roomDevices = devices.filter((d) => d.roomName === room?.roomName);

  if (rooms.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No zone data available.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {rooms.map((r) => (
          <button
            key={r.roomId}
            type="button"
            onClick={() => setSelected(r.roomId)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              selected === r.roomId
                ? "bg-brand text-white"
                : "text-muted hover:bg-page hover:text-ink"
            }`}
          >
            {r.roomName}
          </button>
        ))}
      </div>
      {room ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-page/60 p-4">
              <p className="text-xs text-muted">Power</p>
              <p className="mt-1 text-xl font-bold text-ink">{Math.round(room.powerW)} W</p>
            </div>
            <div className="rounded-xl border border-line bg-page/60 p-4">
              <p className="text-xs text-muted">Energy</p>
              <p className="mt-1 text-xl font-bold text-ink">{room.energyKwh.toFixed(2)} kWh</p>
            </div>
            <div className="rounded-xl border border-line bg-page/60 p-4">
              <p className="text-xs text-muted">Cost</p>
              <p className="mt-1 text-xl font-bold text-ok">₹{room.costInr.toFixed(2)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Equipment in {room.roomName}
            </p>
            <ul className="mt-2 divide-y divide-line">
              {roomDevices.map((d) => (
                <li key={d.deviceId} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink">{d.name}</span>
                  <span className="tabular-nums text-muted">{Math.round(d.powerW)} W</span>
                </li>
              ))}
              {roomDevices.length === 0 ? (
                <li className="py-2 text-sm text-muted">No equipment assigned.</li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}