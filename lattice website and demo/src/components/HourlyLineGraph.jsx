import { useState, useMemo } from 'react';

function buildCoords(data, W, H, pad, max) {
  const n = data.length;
  const stepX = (W - pad * 2) / Math.max(1, n - 1);
  const usableH = H - pad * 2;
  return data.map((d, i) => ({
    x: pad + i * stepX,
    y: pad + usableH - (d.watts / max) * usableH,
    w: d.watts,
    hour: d.hour,
  }));
}

function smoothPath(coords) {
  if (coords.length < 2) return '';
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] || coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function HourlyLineGraph({ data, color = 'var(--accent)', height = 112 }) {
  const [hover, setHover] = useState(null);
  const W = 800;
  const H = height;
  const pad = { x: 12, y: 14 };
  const max = useMemo(() => Math.max(...data.map(d => d.watts), 1), [data]);
  const coords = useMemo(() => buildCoords(data, W, H, pad.y, max), [data, max, W, H]);
  const lineD = useMemo(() => smoothPath(coords), [coords]);
  const areaD = useMemo(() => {
    if (!lineD) return '';
    const bottomY = H - pad.y;
    return `${lineD} L ${coords[coords.length - 1].x} ${bottomY} L ${coords[0].x} ${bottomY} Z`;
  }, [lineD, coords, H, pad]);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    // find nearest coord
    let best = 0;
    let bestDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setHover(best);
  };

  const hoverCoord = hover != null ? coords[hover] : null;

  return (
    <div className="relative select-none" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block overflow-visible" preserveAspectRatio="none">
        {/* grid lines */}
        {[0.25, 0.5, 0.75].map(t => {
          const y = pad.y + (H - pad.y * 2) * (1 - t);
          return (
            <line key={t} x1={pad.x} x2={W - pad.x} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
          );
        })}
        {/* max label */}
        <text x={W - pad.x} y={pad.y + 10} textAnchor="end" fontSize="9" fill="var(--text-faint)" fontFamily="monospace">{max} W</text>

        {/* area */}
        <path d={areaD} fill={color} opacity="0.09" />
        {/* line */}
        <path d={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* dots */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hover === i ? 5 : 0}
            fill={color}
            stroke="var(--surface)"
            strokeWidth={hover === i ? 2 : 0}
            style={{ transition: 'r 0.12s' }}
          />
        ))}

        {/* hover vertical guide */}
        {hoverCoord && (
          <line x1={hoverCoord.x} x2={hoverCoord.x} y1={pad.y} y2={H - pad.y} stroke={color} strokeWidth="1" opacity="0.25" strokeDasharray="3 4" />
        )}
      </svg>

      {/* tooltip */}
      {hoverCoord && (
        <div
          className="absolute pointer-events-none rounded-lg px-2.5 py-1.5 text-[11px] leading-none shadow-lg border"
          style={{
            left: `clamp(8px, ${(hoverCoord.x / W) * 100}%, calc(100% - 110px))`,
            top: `${hoverCoord.y - 36}px`,
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text)',
          }}
        >
          <span className="font-bold font-mono">{String(hoverCoord.hour).padStart(2, '0')}:00</span>
          <span className="mx-1.5 text-faint">·</span>
          <span className="font-mono font-bold" style={{ color }}>{hoverCoord.w} W</span>
        </div>
      )}

      <div className="flex justify-between text-[9px] text-faint mt-1.5 font-mono px-1">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
      </div>
    </div>
  );
}
