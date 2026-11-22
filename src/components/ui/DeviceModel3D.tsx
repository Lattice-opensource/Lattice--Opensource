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

  const face = "rounded border border-slate-400";

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
          <div className={`${face} absolute bg-slate-200`} style={{ width: 140, height: 70, transform: "translate(-70px,-35px) translateZ(30px)" }} />
          <div className={`${face} absolute bg-slate-300`} style={{ width: 140, height: 70, transform: "translate(-70px,-35px) translateZ(-30px) rotateY(180deg)" }} />
          <div className={`${face} absolute bg-slate-200`} style={{ width: 60, height: 70, transform: "translate(-100px,-35px) rotateY(-90deg) translateZ(70px)" }} />
          <div className={`${face} absolute bg-slate-300`} style={{ width: 60, height: 70, transform: "translate(40px,-35px) rotateY(90deg) translateZ(70px)" }} />
          <div className={`${face} absolute bg-slate-100`} style={{ width: 140, height: 60, transform: "translate(-70px,-65px) rotateX(90deg) translateZ(35px)" }} />
          <div className={`${face} absolute bg-slate-400`} style={{ width: 140, height: 60, transform: "translate(-70px,5px) rotateX(-90deg) translateZ(35px)" }} />

          {/* fan housing on top */}
          <div className={`${face} absolute bg-slate-500`} style={{ width: 60, height: 20, transform: "translate(-30px,-85px) translateZ(10px)" }} />
          <div className={`${face} absolute bg-slate-600`} style={{ width: 60, height: 20, transform: "translate(-30px,-85px) translateZ(-10px) rotateY(180deg)" }} />
          <div className={`${face} absolute bg-slate-500`} style={{ width: 20, height: 20, transform: "translate(-50px,-85px) rotateY(-90deg) translateZ(30px)" }} />
          <div className={`${face} absolute bg-slate-500`} style={{ width: 20, height: 20, transform: "translate(30px,-85px) rotateY(90deg) translateZ(30px)" }} />
          <div className={`${face} absolute bg-slate-400`} style={{ width: 60, height: 20, transform: "translate(-30px,-95px) rotateX(90deg) translateZ(10px)" }} />

          {/* fan blades */}
          <div className="absolute" style={{ width: 40, height: 40, transform: "translate(-20px,-105px) translateZ(0px) rotateX(90deg)" }}>
            <div className="absolute left-1/2 top-0 h-20 w-1 -translate-x-1/2 bg-slate-700" />
            <div className="absolute left-1/2 top-0 h-20 w-1 -translate-x-1/2 rotate-90 bg-slate-700" />
          </div>

          {/* condenser coils on side */}
          <div className={`${face} absolute bg-amber-200`} style={{ width: 10, height: 60, transform: "translate(75px,-30px) rotateY(90deg) translateZ(0px)" }} />

          {/* pipes */}
          <div className="absolute bg-slate-600" style={{ width: 8, height: 40, transform: "translate(-80px,10px) rotateZ(90deg)" }} />

          {/* red problem dot */}
          <div
            className="absolute h-4 w-4 rounded-full bg-red-500 shadow-[0_0_14px_6px_rgba(239,68,68,0.7)]"
            style={{ transform: "translate(50px,-20px) translateZ(32px)" }}
          />
        </div>
      </div>
      <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted">
        Drag to rotate
      </p>
    </div>
  );
}