import { useEffect, useMemo, useRef, useState } from "react";
import type { PowerPoint } from "../../data/api/energyApi";
import { timeZoneOffsetMs } from "../../data/api/normalize";

interface SitePowerChartProps {
  points: PowerPoint[];
  timezone: string;
  title?: string;
  variant?: "line" | "bars";
}

const HEIGHT = 240;
const PADDING = { top: 16, right: 16, bottom: 28, left: 48 };

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

export function SitePowerChart({ points, timezone, title = "Whole-site power", variant = "line" }: SitePowerChartProps) {
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
    if (points.length === 0) return null;
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

  if (points.length === 0 || !geometry) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-dashed border-line bg-page/60 text-sm text-muted"
        style={{ height: HEIGHT }}
      >
        No readings recorded for this period
      </div>
    );
  }

  const xTicks = buildClockTicks(geometry.startMs, geometry.endMs, timezone);
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  if (variant === "bars") {
    const barCount = points.length;
    const gap = 2;
    const totalGap = Math.max(barCount - 1, 0) * gap;
    const barWidth = Math.max((geometry.innerWidth - totalGap) / Math.max(barCount, 1), 2);
    const barX = (i: number) => PADDING.left + i * (barWidth + gap);

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
            points.forEach((_, i) => {
              const dist = Math.abs(barX(i) + barWidth / 2 - x);
              if (dist < best) {
                best = dist;
                nearest = i;
              }
            });
            setHoverIndex(nearest);
          }}
        >
          <defs>
            <linearGradient id="lattice-bar-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="lattice-bar-fill-dim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((f) => (
            <line
              key={f}
              x1={PADDING.left}
              x2={PADDING.left + geometry.innerWidth}
              y1={geometry.y(geometry.niceMax * f)}
              y2={geometry.y(geometry.niceMax * f)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          ))}

          {points.map((p, i) => {
            const v = p.powerW;
            const h = Math.max(((v / geometry.niceMax) * geometry.innerHeight), 1);
            const y = PADDING.top + geometry.innerHeight - h;
            const isHovered = hoverIndex === i;
            return (
              <rect
                key={i}
                x={barX(i)}
                y={y}
                width={barWidth}
                height={h}
                rx={Math.min(barWidth / 2, 4)}
                ry={Math.min(barWidth / 2, 4)}
                fill={isHovered ? "url(#lattice-bar-fill)" : "url(#lattice-bar-fill-dim)"}
                className="transition-opacity"
              />
            );
          })}

          {[0, geometry.niceMax / 2, geometry.niceMax].map((tick) => (
            <text
              key={tick}
              x={PADDING.left - 6}
              y={geometry.y(tick) + 3}
              textAnchor="end"
              className="fill-muted text-[9px]"
            >
              {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : Math.round(tick)}
            </text>
          ))}

          {xTicks.map((tick) => (
            <text
              key={tick.atMs}
              x={geometry.xAtTime(tick.atMs)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted text-[9px]"
            >
              {tick.label}
            </text>
          ))}
        </svg>

        {hovered && hoverIndex !== null ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-card/95 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
            style={{
              left: Math.min(Math.max(barX(hoverIndex) + barWidth / 2, 50), width - 50),
              top: Math.max(geometry.y(hovered.powerW) - 48, 0),
            }}
          >
            <p className="font-semibold text-ink">{Math.round(hovered.powerW)} W</p>
            <p className="text-muted">{formatTime(hovered.timestamp, timezone)}</p>
          </div>
        ) : null}
      </div>
    );
  }

  // line variant (existing)
  const xs = points.map((_, i) => geometry.x(i));
  const ys = points.map((p) => geometry.y(p.powerW));
  const linePath = buildSmoothPath(xs, ys);
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${PADDING.top + geometry.innerHeight} L ${xs[0]} ${PADDING.top + geometry.innerHeight} Z`;

  const yTicks = [0, 0.5, 1].map((f) => Math.round(geometry.niceMax * f));

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
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 8}
              y={geometry.y(tick) + 4}
              textAnchor="end"
              className="fill-muted text-[10px]"
            >
              {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
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
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-card px-2.5 py-1.5 text-xs shadow-sm backdrop-blur"
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