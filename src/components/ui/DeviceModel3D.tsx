import { useRef, useState } from "react";

interface DeviceModel3DProps {
  variant?: string;
}

export function DeviceModel3D({ variant = "chiller" }: DeviceModel3DProps) {
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

  const isServer = variant.includes("fridge");
  const isElevator = variant.includes("induction");
  const W = isServer ? 80 : isElevator ? 70 : 180;
  const H = isServer ? 150 : isElevator ? 180 : 90;
  const D = isElevator ? 70 : 60;
  const color = isServer ? "#94a3b8" : isElevator ? "#c4b5fd" : "#cbd5e1";
  const darkColor = isServer ? "#64748b" : isElevator ? "#7c3aed" : "#94a3b8";

  const face = (w: number, h: number, transform: string, bg: string) => (
    <div
      className="absolute border-[3px] border-slate-500"
      style={{
        width: w,
        height: h,
        left: "50%",
        top: "50%",
        marginLeft: -w / 2,
        marginTop: -h / 2,
        background: bg,
        transform,
        backfaceVisibility: "visible",
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
          {face(W, H, `translateZ(${D / 2}px)`, color)}
          {face(W, H, `translateZ(${-D / 2}px) rotateY(180deg)`, darkColor)}
          {face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, color)}
          {face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, darkColor)}
          {face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, color)}
          {face(W, D, `rotateX(-90deg) translateZ(${H / 2}px)`, darkColor)}

          {isElevator ? (
            <>
              {/* shaft rails */}
              <div className="absolute bg-slate-600" style={{ width: 4, height: H - 20, left: "50%", top: "50%", marginLeft: -W / 2 + 8, marginTop: -(H / 2) + 10, transform: "translateZ(0px)" }} />
              <div className="absolute bg-slate-600" style={{ width: 4, height: H - 20, left: "50%", top: "50%", marginLeft: W / 2 - 12, marginTop: -(H / 2) + 10, transform: "translateZ(0px)" }} />
              {/* elevator car */}
              <div className="absolute border border-slate-500 bg-slate-300" style={{ width: W - 16, height: 40, left: "50%", top: "50%", marginLeft: -(W - 16) / 2, marginTop: -10, transform: "translateZ(0px)" }} />
              <div className="absolute bg-slate-700" style={{ width: W - 24, height: 4, left: "50%", top: "50%", marginLeft: -(W - 24) / 2, marginTop: -14, transform: "translateZ(1px)" }} />
            </>
          ) : null}

          {/* red problem dot */}
          <div
            className="absolute h-4 w-4 rounded-full bg-red-500 shadow-[0_0_14px_6px_rgba(239,68,68,0.7)]"
            style={{
              left: "50%",
              top: "50%",
              marginLeft: -8,
              marginTop: -8,
              transform: `translateZ(${D / 2 + 1}px) translate(${W / 4}px, ${-H / 6}px)`,
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