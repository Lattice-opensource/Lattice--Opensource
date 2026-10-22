import { useEffect, useMemo, useRef, useState } from "react";
import type { PowerPoint } from "../../data/api/energyApi";
import { timeZoneOffsetMs } from "../../data/api/normalize";

interface SitePowerChartProps {
  points: PowerPoint[];
  timezone: string;
  title?: string;
}

const HEIGHT = 240;
const PADDING = { top: 16, right: 16, bottom: 28, left: 52 };

function buildSmoothPath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return "";
  if (xs.length === 1) return `M ${xs[0]} ${ys[0]}`;
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i];
    const y0 = ys[i];
    const x1 = xs[i + 1];
    const y1 = ys[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

function formatTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

interface ClockTick {
  atMs: number;
  label: string;
}

/** Clock-aligned axis ticks (00:00, 06:00, 12:00, …) in the site's local time. */
function buildClockTicks(startMs: number, endMs: number, timezone: string): ClockTick[] {
  const spanHours = (endMs - startMs) / 3_600_000;
  const stepHours = spanHours > 12 ? 6 : spanHours > 4 ? 2 : 1;
  const stepMs = stepHours * 3_600_000;

  const offset = timeZoneOffsetMs(timezone, new Date(startMs));
  const localStart = startMs + offset;
  const first = Math.ceil(localStart / stepMs) * stepMs;

  const ticks: ClockTick[] = [];
  for (let local = first; local <= endMs + offset; local += stepMs) {
    const atMs = local - offset;
    if (atMs < startMs) continue;
    const localHours = Math.floor(local / 3_600_000) % 24;
    ticks.push({ atMs, label: `${String(localHours).padStart(2, "0")}:00` });
  }
  return ticks;
}

export function SitePowerChart({ points, timezone, title = "Whole-site power" }: SitePowerChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next && next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const innerWidth = Math.max(width - PADDING.left - PADDING.right, 10);
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
    const maxValue = Math.max(...points.map((p) => p.powerW), 100);
    const niceMax = Math.ceil(maxValue / 500) * 500 || 500;

    const startMs = new Date(points[0].timestamp).getTime();
    const endMs = new Date(points[points.length - 1].timestamp).getTime();
    const spanMs = Math.max(endMs - startMs, 1);

    const x = (i: number) => {
      const t = new Date(points[i].timestamp).getTime();
      return PADDING.left + ((t - startMs) / spanMs) * innerWidth;
    };
    const xAtTime = (ms: number) => PADDING.left + ((ms - startMs) / spanMs) * innerWidth;
    const y = (v: number) => PADDING.top + innerHeight - (v / niceMax) * innerHeight;

    return { innerWidth, innerHeight, niceMax, x, xAtTime, y, startMs, endMs };
  }, [points, width]);

  if (points.length === 0) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-dashed border-line bg-page/60 text-sm text-muted"
        style={{ height: HEIGHT }}
      >
        No readings recorded for this period
      </div>
    );
  }

  const xs = points.map((_, i) => geometry.x(i));
  const ys = points.map((p) => geometry.y(p.powerW));
  const linePath = buildSmoothPath(xs, ys);
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${PADDING.top + geometry.innerHeight} L ${xs[0]} ${PADDING.top + geometry.innerHeight} Z`;

  const yTicks = [0, 0.5, 1].map((f) => Math.round(geometry.niceMax * f));
  const xTicks = buildClockTicks(geometry.startMs, geometry.endMs, timezone);

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`${title} over time, ${points.length} readings`}
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          let nearest = 0;
          let best = Infinity;
          xs.forEach((px, i) => {
            const dist = Math.abs(px - x);
            if (dist < best) {
              best = dist;
              nearest = i;
            }
          });
          setHoverIndex(nearest);
        }}
      >
        <defs>
          <linearGradient id="lattice-power-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + geometry.innerWidth}
              y1={geometry.y(tick)}
              y2={geometry.y(tick)}
              stroke="#eceef2"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 8}
              y={geometry.y(tick) + 4}
              textAnchor="end"
              className="fill-muted text-[10px]"
            >
              {tick}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#lattice-power-area)" />
        <path d={linePath} fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />

        {xTicks.map((tick) => (
          <text
            key={tick.atMs}
            x={geometry.xAtTime(tick.atMs)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            {tick.label}
          </text>
        ))}

        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" fill="#e11d48" />

        {hovered && hoverIndex !== null ? (
          <g>
            <line
              x1={xs[hoverIndex]}
              x2={xs[hoverIndex]}
              y1={PADDING.top}
              y2={PADDING.top + geometry.innerHeight}
              stroke="#e11d48"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={xs[hoverIndex]} cy={ys[hoverIndex]} r="4" fill="#fff" stroke="#e11d48" strokeWidth="2" />
          </g>
        ) : null}
      </svg>

      {hovered && hoverIndex !== null ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs shadow-sm"
          style={{
            left: Math.min(Math.max(xs[hoverIndex], 60), width - 60),
            top: Math.max(ys[hoverIndex] - 48, 0),
          }}
        >
          <p className="font-semibold text-ink">{Math.round(hovered.powerW)} W</p>
          <p className="text-muted">{formatTime(hovered.timestamp, timezone)}</p>
        </div>
      ) : null}
    </div>
  );
}
