import type { RoomSummary } from "../../data/api/energyApi";

interface RoomCardsProps {
  rooms: RoomSummary[];
}

export function RoomCards({ rooms }: RoomCardsProps) {
  if (rooms.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No room data available.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <li key={room.roomId} className="rounded-xl border border-line bg-page/60 p-4">
          <p className="text-sm font-semibold text-ink">{room.roomName}</p>
          <p className="mt-1 text-xs text-muted">
            {room.deviceCount} {room.deviceCount === 1 ? "device" : "devices"}
          </p>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted">Power</dt>
              <dd className="font-semibold tabular-nums text-ink">{Math.round(room.powerW)} W</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Energy</dt>
              <dd className="font-semibold tabular-nums text-ink">{room.energyKwh.toFixed(2)} kWh</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Cost</dt>
              <dd className="font-semibold tabular-nums text-ok">₹{room.costInr.toFixed(2)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
