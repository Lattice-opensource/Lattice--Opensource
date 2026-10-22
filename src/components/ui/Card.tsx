import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      {title ? <h2 className="mb-4 text-sm font-semibold text-gray-900">{title}</h2> : null}
      {children}
    </section>
  );
}
