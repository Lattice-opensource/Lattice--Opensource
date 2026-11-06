import { useState } from "react";
import { BlueprintViewer, type RoomPolygon, type NormalizedPoint } from "./components/BlueprintViewer";
import { Card } from "../../components/ui/Card";

// Placeholder until backend building/floor APIs are wired.
const SAMPLE_ROOMS: RoomPolygon[] = [
  { id: "r1", name: "Living Room", type: "living", points: [{ x: 0.05, y: 0.05 }, { x: 0.45, y: 0.05 }, { x: 0.45, y: 0.45 }, { x: 0.05, y: 0.45 }] },
  { id: "r2", name: "Kitchen", type: "kitchen", points: [{ x: 0.5, y: 0.05 }, { x: 0.95, y: 0.05 }, { x: 0.95, y: 0.45 }, { x: 0.5, y: 0.45 }] },
];

export function BuildingPage() {
  const [rooms, setRooms] = useState<RoomPolygon[]>(SAMPLE_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState<NormalizedPoint[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState("room");

  const handleCanvasClick = (pt: NormalizedPoint) => {
    setDraftPoints((prev) => [...prev, pt]);
  };
  const handleFinishDraw = () => {
    if (draftPoints.length < 3) return;
    const name = newRoomName.trim() || `Room ${rooms.length + 1}`;
    const newRoom: RoomPolygon = { id: `r${Date.now()}`, name, type: newRoomType, points: [...draftPoints] };
    setRooms((prev) => [...prev, newRoom]);
    setDraftPoints([]);
    setDrawing(false);
    setSelectedRoomId(newRoom.id);
    setNewRoomName("");
  };
  const handleCancelDraw = () => {
    setDraftPoints([]);
    setDrawing(false);
  };
  const handleDeleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    if (selectedRoomId === id) setSelectedRoomId(null);
  };
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Building Visualization</h1>
        <p className="mt-1 text-sm text-muted">Interactive floor plan editor. Draw rooms, assign names, save positions.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card title="Floor plan" eyebrow="01 · Blueprint">
          <BlueprintViewer
            blueprintUrl={null}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            drawing={drawing}
            draftPoints={draftPoints}
            onSelectRoom={setSelectedRoomId}
            onCanvasClick={handleCanvasClick}
            onCanvasDoubleClick={handleFinishDraw}
            onFinishDraw={handleFinishDraw}
            onCancelDraw={handleCancelDraw}
          />
        </Card>

        <div className="space-y-4">
          <Card title="Rooms" eyebrow="02 · List">
            {rooms.length === 0 ? (
              <p className="text-sm text-muted">No rooms yet. Start drawing.</p>
            ) : (
              <ul className="space-y-2">
                {rooms.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                    <button type="button" onClick={() => setSelectedRoomId(r.id)} className="text-left text-sm font-medium text-ink hover:text-brand">
                      {r.name} <span className="text-xs text-muted">({r.type})</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteRoom(r.id)} className="text-xs text-muted hover:text-brand" aria-label={`Delete ${r.name}`}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Draw a room" eyebrow="03 · Editor">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
              />
              <select
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"
              >
                <option value="living">Living</option>
                <option value="kitchen">Kitchen</option>
                <option value="bedroom">Bedroom</option>
                <option value="bathroom">Bathroom</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
              {!drawing ? (
                <button type="button" onClick={() => setDrawing(true)} className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">
                  Start drawing
                </button>
              ) : (
                <p className="text-xs text-muted">Click on the plan to add points.</p>
              )}
            </div>
          </Card>

          {selectedRoom ? (
            <Card title="Selected room" eyebrow="04 · Details">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Name</dt><dd className="text-ink">{selectedRoom.name}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Type</dt><dd className="text-ink">{selectedRoom.type}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Points</dt><dd className="text-ink">{selectedRoom.points.length}</dd></div>
              </dl>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
