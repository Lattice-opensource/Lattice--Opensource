import type { AggregatePoint } from "../../data/api/energyApi";

interface AreaChartProps {
  points: AggregatePoint[];
  title?: string;
}

export function AreaChart({ points, title = "Power over time" }: AreaChartProps) {
  if (points.length === 0) return null;
  const width = 640;
  const height = 200;
  const padding = 24;
  const max = Math.max(...points.map((p) => p.powerWAvg), 1);
  const min = 0;
  const range = max - min || 1;
  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((p.powerWAvg - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  return (
    <figure role="img" aria-label={title} className="w-full">
      <figcaption className="mb-2 text-sm font-semibold text-gray-900">{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#e11d48" strokeWidth="2" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill="#e11d48" />
        ))}
        {points.map((p, i) => (
          <text
            key={p.bucketStart}
            x={padding + i * stepX}
            y={height - 4}
            textAnchor="middle"
            className="fill-gray-400 text-[9px]"
          >
            {new Date(p.bucketStart).getHours()}:00
          </text>
        ))}
      </svg>
    </figure>
  );
}
