import type { ButtonHTMLAttributes, ReactNode } from "react";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export function GlowButton({ children, variant = "primary", className = "", ...props }: GlowButtonProps) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-brand text-white shadow-[0_0_30px_-10px_rgba(225,29,72,0.5)] hover:bg-brand-light hover:shadow-[0_0_40px_-10px_rgba(225,29,72,0.6)]"
      : "border border-line bg-card/60 text-ink hover:border-brand/40 hover:text-brand-light";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}