

interface MetricTileProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "brand" | "emerald" | "amber" | "neutral";
  className?: string;
}

const accentClass: Record<NonNullable<MetricTileProps["accent"]>, string> = {
  brand: "text-brand-light",
  emerald: "text-emerald-400",
  amber: "text-amber-300",
  neutral: "text-ink",
};

export function MetricTile({ label, value, sub, accent = "neutral", className = "" }: MetricTileProps) {
  return (
    <div className={`rounded-2xl border border-line bg-card/80 p-4 shadow-sm backdrop-blur ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-black tracking-tight ${accentClass[accent]}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}