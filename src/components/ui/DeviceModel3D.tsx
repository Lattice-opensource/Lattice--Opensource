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
          {/* back removed to show internal wiring */}
          {face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, color)}
          {face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, darkColor)}
          {face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, color)}
          {face(W, D, `rotateX(-90deg) translateZ(${H / 2}px)`, darkColor)}

          {isElevator ? (
            <>
              {/* top machine room */}
              <div className="absolute border border-slate-500 bg-slate-600" style={{ width: W + 12, height: 18, left: "50%", top: "50%", marginLeft: -(W + 12) / 2, marginTop: -(H / 2) - 10, transform: "translateZ(0px)" }} />
              {/* cables */}
              <div className="absolute bg-slate-700" style={{ width: 2, height: H - 20, left: "50%", top: "50%", marginLeft: -W / 2 + 8, marginTop: -(H / 2) + 5, transform: "translateZ(2px)" }} />
              <div className="absolute bg-slate-700" style={{ width: 2, height: H - 20, left: "50%", top: "50%", marginLeft: W / 2 - 10, marginTop: -(H / 2) + 5, transform: "translateZ(2px)" }} />
              {/* shaft frame */}
              <div className="absolute border border-slate-500 bg-slate-200/40" style={{ width: W + 8, height: H, left: "50%", top: "50%", marginLeft: -(W + 8) / 2, marginTop: -H / 2, transform: "translateZ(0px)" }} />
              {/* rails */}
              <div className="absolute bg-slate-700" style={{ width: 3, height: H - 12, left: "50%", top: "50%", marginLeft: -W / 2 + 4, marginTop: -(H / 2) + 6, transform: "translateZ(4px)" }} />
              <div className="absolute bg-slate-700" style={{ width: 3, height: H - 12, left: "50%", top: "50%", marginLeft: W / 2 - 7, marginTop: -(H / 2) + 6, transform: "translateZ(4px)" }} />
              {/* elevator car */}
              <div className="absolute border border-slate-600 bg-slate-300" style={{ width: W - 10, height: 46, left: "50%", top: "50%", marginLeft: -(W - 10) / 2, marginTop: -6, transform: "translateZ(6px)" }} />
              {/* door panels */}
              <div className="absolute bg-slate-400" style={{ width: (W - 14) / 2, height: 38, left: "50%", top: "50%", marginLeft: -(W - 14) / 2, marginTop: -4, transform: "translateZ(7px)" }} />
              <div className="absolute bg-slate-400" style={{ width: (W - 14) / 2, height: 38, left: "50%", top: "50%", marginLeft: 1, marginTop: -4, transform: "translateZ(7px)" }} />
              {/* door handle */}
              <div className="absolute bg-slate-600" style={{ width: 2, height: 8, left: "50%", top: "50%", marginLeft: -W / 2 + 14, marginTop: 6, transform: "translateZ(8px)" }} />
              <div className="absolute bg-slate-600" style={{ width: 2, height: 8, left: "50%", top: "50%", marginLeft: W / 2 - 16, marginTop: 6, transform: "translateZ(8px)" }} />
              {/* floor indicator */}
              <div className="absolute bg-slate-800" style={{ width: 20, height: 10, left: "50%", top: "50%", marginLeft: -10, marginTop: -H / 2 + 14, transform: "translateZ(7px)" }} />
              <div className="absolute bg-green-400" style={{ width: 8, height: 5, left: "50%", top: "50%", marginLeft: -4, marginTop: -H / 2 + 16, transform: "translateZ(8px)" }} />
              {/* counterweight */}
              <div className="absolute bg-slate-600" style={{ width: 8, height: H - 20, left: "50%", top: "50%", marginLeft: -W / 2 - 12, marginTop: -(H / 2) + 5, transform: "translateZ(-4px)" }} />
            </>
          ) : null}

          {!isServer && !isElevator ? (
            <>
              {/* condenser coils on side */}
              <div className="absolute bg-amber-300" style={{ width: 14, height: 70, left: "50%", top: "50%", marginLeft: 78, marginTop: -35, transform: "translateZ(0px)" }} />
              <div className="absolute bg-amber-400" style={{ width: 14, height: 70, left: "50%", top: "50%", marginLeft: 78, marginTop: -35, transform: "translateZ(6px)" }} />
              <div className="absolute bg-amber-500" style={{ width: 14, height: 70, left: "50%", top: "50%", marginLeft: 78, marginTop: -35, transform: "translateZ(12px)" }} />
              {/* fan grille on top */}
              <div className="absolute rounded-full border-2 border-slate-500 bg-slate-400" style={{ width: 44, height: 44, left: "50%", top: "50%", marginLeft: -22, marginTop: -67, transform: "translateZ(0px)" }} />
              <div className="absolute rounded-full border border-slate-600 bg-slate-600" style={{ width: 36, height: 36, left: "50%", top: "50%", marginLeft: -18, marginTop: -63, transform: "translateZ(1px)" }} />
              {/* fan blades */}
              <div className="absolute bg-slate-700" style={{ width: 2, height: 28, left: "50%", top: "50%", marginLeft: -1, marginTop: -77, transform: "translateZ(2px)" }} />
              <div className="absolute bg-slate-700" style={{ width: 2, height: 28, left: "50%", top: "50%", marginLeft: -1, marginTop: -77, transform: "translateZ(2px) rotate(90deg)" }} />
              {/* control panel on front */}
              <div className="absolute bg-slate-800" style={{ width: 40, height: 24, left: "50%", top: "50%", marginLeft: -20, marginTop: -20, transform: "translateZ(36px)" }} />
              <div className="absolute bg-sky-400" style={{ width: 32, height: 16, left: "50%", top: "50%", marginLeft: -16, marginTop: -16, transform: "translateZ(37px)" }} />
              {/* base frame */}
              <div className="absolute bg-slate-600" style={{ width: 190, height: 6, left: "50%", top: "50%", marginLeft: -95, marginTop: 42, transform: "translateZ(0px)" }} />
            </>
          ) : null}

          {/* internal components */}
          <div className="absolute" style={{ width: W - 20, height: H - 20, left: "50%", top: "50%", marginLeft: -(W - 20) / 2, marginTop: -(H - 20) / 2, transform: "translateZ(-15px)" }}>
            {/* PCB board */}
            <div className="absolute left-2 top-2 h-16 w-20 rounded bg-green-700/80" />
            {/* compressor */}
            <div className="absolute bottom-2 left-4 h-10 w-16 rounded-full bg-slate-600" />
            {/* pipes */}
            <div className="absolute left-10 top-0 h-full w-1 bg-cyan-500" />
            <div className="absolute left-20 top-0 h-full w-1 bg-cyan-500" />
            <div className="absolute left-0 top-8 h-1 w-full bg-cyan-500" />
            <div className="absolute left-0 top-16 h-1 w-full bg-cyan-500" />
            {/* wires */}
            <div className="absolute left-0 top-3 h-0.5 w-full bg-red-500" />
            <div className="absolute left-0 top-5 h-0.5 w-full bg-blue-500" />
            <div className="absolute left-0 top-7 h-0.5 w-full bg-yellow-500" />
            <div className="absolute left-0 top-9 h-0.5 w-full bg-green-500" />
            <div className="absolute left-0 top-11 h-0.5 w-full bg-purple-500" />
            <div className="absolute left-6 top-0 h-full w-0.5 bg-red-500" />
            <div className="absolute left-14 top-0 h-full w-0.5 bg-blue-500" />
            <div className="absolute left-22 top-0 h-full w-0.5 bg-yellow-500" />
            <div className="absolute left-30 top-0 h-full w-0.5 bg-green-500" />
            <div className="absolute left-38 top-0 h-full w-0.5 bg-purple-500" />
            {/* valve */}
            <div className="absolute right-4 top-4 h-6 w-6 rounded-full bg-slate-500 border border-slate-700" />
          </div>

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