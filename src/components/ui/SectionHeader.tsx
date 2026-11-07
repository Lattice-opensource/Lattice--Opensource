import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}

export function SectionHeader({ eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-light">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-xl font-black tracking-tight text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}