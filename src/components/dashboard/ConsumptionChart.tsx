import type { EnergyReading } from "../../data/api/energyApi";

interface ConsumptionChartProps {
  readings: EnergyReading[];
  title?: string;
}

export function ConsumptionChart({ readings, title = "Consumption over time" }: ConsumptionChartProps) {
  if (readings.length === 0) {
    return null;
  }

  const max = Math.max(...readings.map((r) => r.energyKwh), 0.0001);
  const width = 320;
  const height = 140;
  const barWidth = width / readings.length - 6;

  return (
    <figure role="img" aria-label={title} className="w-full">
      <figcaption className="mb-2 text-sm font-semibold text-gray-900">{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" preserveAspectRatio="none">
        {readings.map((r, i) => {
          const h = (r.energyKwh / max) * (height - 24);
          const x = i * (width / readings.length) + 3;
          const y = height - h - 16;
          return (
            <g key={r.timestamp}>
              <rect x={x} y={y} width={barWidth} height={h} rx={4} className="fill-brand/70" />
              <text
                x={x + barWidth / 2}
                y={height - 2}
                textAnchor="middle"
                className="fill-gray-500 text-[9px]"
              >
                {new Date(r.timestamp).getHours()}:00
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
