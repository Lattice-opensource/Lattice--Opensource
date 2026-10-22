import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}
    >
      {title ? <h2 className="mb-4 text-sm font-semibold text-white">{title}</h2> : null}
      {children}
    </section>
  );
}
