import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, eyebrow, action, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-2xl border border-line bg-card shadow-sm ${className}`}>
      {(title || eyebrow || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
          </div>
          {action}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
