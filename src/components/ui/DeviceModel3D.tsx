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

  const face = (w: number, h: number, transform: string, bg: string) => (
    <div
      className="absolute border border-slate-400"
      style={{
        width: w,
        height: h,
        left: "50%",
        top: "50%",
        marginLeft: -w / 2,
        marginTop: -h / 2,
        background: bg,
        transform,
        backfaceVisibility: "hidden",
      }}
    />
  );

  return (
    <div
      className="relative mx-auto h-72 w-80 cursor-grab select-none active:cursor-grabbing"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      <div className="absolute inset-0" style={{ perspective: "1000px" }}>
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          }}
        >
          {/* main body 180x90x70 */}
          {face(180, 90, "translateZ(35px)", "#e2e8f0")}
          {face(180, 90, "translateZ(-35px) rotateY(180deg)", "#cbd5e1")}
          {face(70, 90, "rotateY(-90deg) translateZ(90px)", "#e2e8f0")}
          {face(70, 90, "rotateY(90deg) translateZ(90px)", "#cbd5e1")}
          {face(180, 70, "rotateX(90deg) translateZ(45px)", "#f1f5f9")}
          {face(180, 70, "rotateX(-90deg) translateZ(45px)", "#94a3b8")}

          {/* front panel */}
          <div
            className="absolute border border-slate-600 bg-slate-700"
            style={{
              width: 60,
              height: 30,
              left: "50%",
              top: "50%",
              marginLeft: -30,
              marginTop: -15,
              transform: "translateZ(36px)",
            }}
          />
          <div
            className="absolute bg-sky-500"
            style={{
              width: 50,
              height: 20,
              left: "50%",
              top: "50%",
              marginLeft: -25,
              marginTop: -10,
              transform: "translateZ(37px)",
            }}
          />

          {/* red problem dot */}
          <div
            className="absolute h-4 w-4 rounded-full bg-red-500 shadow-[0_0_14px_6px_rgba(239,68,68,0.7)]"
            style={{
              left: "50%",
              top: "50%",
              marginLeft: -8,
              marginTop: -8,
              transform: "translateZ(36px) translate(40px, -10px)",
            }}
          />
        </div>
      </div>
      <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted">
        Drag to rotate 360°
      </p>
    </div>
  );
}