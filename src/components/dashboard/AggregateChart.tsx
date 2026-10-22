import type { AggregatePoint } from "../../data/api/energyApi";

interface AggregateChartProps {
  points: AggregatePoint[];
  title?: string;
}

export function AggregateChart({ points, title = "Energy over time" }: AggregateChartProps) {
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.energyKwh), 0.0001);
  const width = 480;
  const height = 160;
  const barWidth = width / points.length - 4;
  return (
    <figure role="img" aria-label={title} className="w-full">
      <figcaption className="mb-2 text-sm font-semibold text-white">{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" preserveAspectRatio="none">
        {points.map((p, i) => {
          const h = (p.energyKwh / max) * (height - 20);
          const x = i * (width / points.length) + 2;
          const y = height - h - 14;
          return (
            <g key={p.bucketStart}>
              <rect x={x} y={y} width={barWidth} height={h} rx={3} className="fill-emerald-500/70" />
              <text x={x + barWidth / 2} y={height - 2} textAnchor="middle" className="fill-gray-500 text-[9px]">
                {new Date(p.bucketStart).getHours()}:00
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
