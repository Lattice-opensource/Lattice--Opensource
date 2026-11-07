import type { ReactNode } from "react";

interface ChartPanelProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

export function ChartPanel({ title, eyebrow, children, className = "" }: ChartPanelProps) {
  return (
    <section className={`rounded-2xl border border-line bg-card/70 p-5 shadow-sm backdrop-blur ${className}`}>
      {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</p> : null}
      <h3 className="mt-1 text-base font-semibold text-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}