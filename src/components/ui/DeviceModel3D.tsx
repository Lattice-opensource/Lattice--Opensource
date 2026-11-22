import { useRef, useState } from "react";

export function DeviceModel3D() {
  const [rot, setRot] = useState({ x: 20, y: -30 });
  const drag = useRef<{ sx: number; sy: number; rx: number; ry: number } | null>(null);

  const onDown = (e: React.MouseEvent) => {
    drag.current = { sx: e.clientX, sy: e.clientY, rx: rot.x, ry: rot.y };
  };
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    setRot({ x: drag.current.rx - dy * 0.5, y: drag.current.ry + dx * 0.5 });
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <div
      className="relative mx-auto h-56 w-56 cursor-grab select-none active:cursor-grabbing"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      <div className="absolute inset-0" style={{ perspective: "900px" }}>
        <div
          className="absolute left-1/2 top-1/2 h-32 w-32"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(-50%, -50%) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          }}
        >
          {/* front */}
          <div
            className="absolute inset-0 rounded-lg border border-line bg-card/90 shadow-lg"
            style={{ transform: "translateZ(16px)" }}
          />
          {/* back */}
          <div
            className="absolute inset-0 rounded-lg border border-line bg-card/70"
            style={{ transform: "translateZ(-16px) rotateY(180deg)" }}
          />
          {/* top */}
          <div
            className="absolute inset-0 rounded-lg border border-line bg-card/80"
            style={{ transform: "rotateX(90deg) translateZ(16px)" }}
          />
          {/* bottom */}
          <div
            className="absolute inset-0 rounded-lg border border-line bg-card/80"
            style={{ transform: "rotateX(-90deg) translateZ(16px)" }}
          />
          {/* left */}
          <div
            className="absolute inset-0 rounded-lg border border-line bg-card/85"
            style={{ transform: "rotateY(-90deg) translateZ(16px)" }}
          />
          {/* right */}
          <div
            className="absolute inset-0 rounded-lg border border-line bg-card/85"
            style={{ transform: "rotateY(90deg) translateZ(16px)" }}
          />
          {/* red problem dot on front face */}
          <div
            className="absolute left-1/2 top-1/3 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_14px_6px_rgba(239,68,68,0.7)]"
            style={{ transform: "translateZ(17px)" }}
          />
          {/* screen */}
          <div
            className="absolute left-1/2 top-1/2 h-8 w-16 -translate-x-1/2 -translate-y-1/2 rounded bg-sky-500/80"
            style={{ transform: "translateZ(17px)" }}
          />
        </div>
      </div>
      <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted">
        Drag to rotate
      </p>
    </div>
  );
}