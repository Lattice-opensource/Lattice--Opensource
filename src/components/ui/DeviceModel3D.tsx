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
      className="relative mx-auto h-80 w-80 cursor-grab select-none active:cursor-grabbing"
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
          {isElevator ? (
            <>
              {/* base platform */}
              <div className="absolute bg-slate-500" style={{ width: W + 30, height: 12, left: "50%", top: "50%", marginLeft: -(W + 30) / 2, marginTop: H / 2 - 6, transform: "translateZ(0px)" }} />

              {/* back wall */}
              <div className="absolute bg-slate-200" style={{ width: W, height: H, left: "50%", top: "50%", marginLeft: -W / 2, marginTop: -H / 2, transform: `translateZ(${-D / 2}px)` }} />

              {/* left glass panels */}
              <div className="absolute border border-slate-400 bg-sky-200/40" style={{ width: W / 2 - 4, height: H - 10, left: "50%", top: "50%", marginLeft: -W / 2 + 2, marginTop: -H / 2 + 5, transform: "translateZ(2px)" }} />
              <div className="absolute border border-slate-400 bg-sky-200/40" style={{ width: W / 2 - 4, height: H - 10, left: "50%", top: "50%", marginLeft: 2, marginTop: -H / 2 + 5, transform: "translateZ(2px)" }} />

              {/* thick front-left pillar */}
              <div className="absolute bg-slate-600" style={{ width: 12, height: H, left: "50%", top: "50%", marginLeft: -W / 2 - 2, marginTop: -H / 2, transform: "translateZ(8px)" }} />
              {/* thick front-right pillar */}
              <div className="absolute bg-slate-600" style={{ width: 18, height: H, left: "50%", top: "50%", marginLeft: W / 2 - 18, marginTop: -H / 2, transform: "translateZ(8px)" }} />
              {/* top beam */}
              <div className="absolute bg-slate-600" style={{ width: W + 8, height: 14, left: "50%", top: "50%", marginLeft: -(W + 8) / 2, marginTop: -H / 2 - 8, transform: "translateZ(8px)" }} />

              {/* interior handrails */}
              <div className="absolute bg-slate-300" style={{ width: W - 30, height: 4, left: "50%", top: "50%", marginLeft: -(W - 30) / 2 + 6, marginTop: -12, transform: "translateZ(6px)" }} />
              <div className="absolute bg-slate-300" style={{ width: W - 30, height: 4, left: "50%", top: "50%", marginLeft: -(W - 30) / 2 + 6, marginTop: 4, transform: "translateZ(6px)" }} />

              {/* control panel */}
              <div className="absolute bg-slate-800" style={{ width: 14, height: 40, left: "50%", top: "50%", marginLeft: W / 2 - 22, marginTop: -20, transform: "translateZ(9px)" }} />
              <div className="absolute bg-slate-600" style={{ width: 10, height: 6, left: "50%", top: "50%", marginLeft: W / 2 - 20, marginTop: -26, transform: "translateZ(10px)" }} />

              {/* elevator car */}
              <div className="absolute border border-slate-500 bg-slate-300" style={{ width: W - 16, height: 40, left: "50%", top: "50%", marginLeft: -(W - 16) / 2, marginTop: -4, transform: "translateZ(10px)" }} />
              {/* door panels */}
              <div className="absolute bg-slate-400" style={{ width: (W - 20) / 2, height: 34, left: "50%", top: "50%", marginLeft: -(W - 20) / 2, marginTop: -2, transform: "translateZ(11px)" }} />
              <div className="absolute bg-slate-400" style={{ width: (W - 20) / 2, height: 34, left: "50%", top: "50%", marginLeft: 2, marginTop: -2, transform: "translateZ(11px)" }} />

              {/* floor indicator */}
              <div className="absolute bg-slate-800" style={{ width: 16, height: 8, left: "50%", top: "50%", marginLeft: -8, marginTop: -H / 2 + 18, transform: "translateZ(9px)" }} />
              <div className="absolute bg-green-400" style={{ width: 6, height: 4, left: "50%", top: "50%", marginLeft: -3, marginTop: -H / 2 + 20, transform: "translateZ(10px)" }} />

              {/* counterweight */}
              <div className="absolute bg-slate-600" style={{ width: 6, height: H - 20, left: "50%", top: "50%", marginLeft: -W / 2 - 12, marginTop: -(H / 2) + 5, transform: "translateZ(-4px)" }} />

              {/* cables */}
              <div className="absolute bg-slate-700" style={{ width: 2, height: H - 20, left: "50%", top: "50%", marginLeft: -W / 2 + 8, marginTop: -(H / 2) + 5, transform: "translateZ(2px)" }} />
              <div className="absolute bg-slate-700" style={{ width: 2, height: H - 20, left: "50%", top: "50%", marginLeft: W / 2 - 10, marginTop: -(H / 2) + 5, transform: "translateZ(2px)" }} />
            </>
          ) : (
            <>
              {face(W, H, `translateZ(${D / 2}px)`, color)}
              {face(W, H, `translateZ(${-D / 2}px) rotateY(180deg)`, darkColor)}
              {face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, color)}
              {face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, darkColor)}
              {face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, color)}
              {face(W, D, `rotateX(-90deg) translateZ(${H / 2}px)`, darkColor)}

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
            </>
          )}

          {isElevator ? (
            <div
              className="absolute h-4 w-4 rounded-full bg-red-500 shadow-[0_0_14px_6px_rgba(239,68,68,0.7)]"
              style={{
                left: "50%",
                top: "50%",
                marginLeft: -8,
                marginTop: -8,
                transform: "translateZ(12px) translate(0px, -4px)",
              }}
            />
          ) : null}
        </div>
      </div>
      <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted">
        Drag to rotate 360°
      </p>
    </div>
  );
}