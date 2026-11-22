import { useRef, useState } from "react";

const face = "absolute border border-slate-400";

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

  const T = (t: string) => ({ transform: `${t} translate(-50%, -50%)` });

  return (
    <div
      className="relative mx-auto h-64 w-72 cursor-grab select-none active:cursor-grabbing"
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
            transform: `translate(-50%, -50%) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          }}
        >
          {/* main body */}
          <div className={`${face} bg-slate-200`} style={{ width: 180, height: 90, ...T("translate3d(0px, 0px, 35px)") }} />
          <div className={`${face} bg-slate-300`} style={{ width: 180, height: 90, ...T("translate3d(0px, 0px, -35px) rotateY(180deg)") }} />
          <div className={`${face} bg-slate-200`} style={{ width: 70, height: 90, ...T("translate3d(-90px, 0px, 0px) rotateY(-90deg)") }} />
          <div className={`${face} bg-slate-300`} style={{ width: 70, height: 90, ...T("translate3d(90px, 0px, 0px) rotateY(90deg)") }} />
          <div className={`${face} bg-slate-100`} style={{ width: 180, height: 70, ...T("translate3d(0px, -45px, 0px) rotateX(90deg)") }} />
          <div className={`${face} bg-slate-400`} style={{ width: 180, height: 70, ...T("translate3d(0px, 45px, 0px) rotateX(-90deg)") }} />

          {/* front panel */}
          <div
            className="absolute rounded border border-slate-500 bg-slate-700"
            style={{ width: 60, height: 30, ...T("translate3d(0px, 0px, 36px)") }}
          />
          <div
            className="absolute rounded bg-sky-500"
            style={{ width: 50, height: 20, ...T("translate3d(0px, 0px, 37px)") }}
          />

          {/* red problem dot */}
          <div
            className="absolute h-4 w-4 rounded-full bg-red-500 shadow-[0_0_14px_6px_rgba(239,68,68,0.7)]"
            style={{ ...T("translate3d(50px, -10px, 36px)") }}
          />
        </div>
      </div>
      <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted">
        Drag to rotate 360°
      </p>
    </div>
  );
}