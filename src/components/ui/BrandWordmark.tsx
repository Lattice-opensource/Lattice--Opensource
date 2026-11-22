import { useId } from "react";

function Cube() {
  const gradientId = useId().replace(/:/g, "");

  return (
    <svg width="17" height="19" viewBox="0 0 24 27" fill="none" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="2" y1="1" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fecdd3" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
      </defs>
      <path
        d="M12 1 22 7 12 13 2 7 12 1Z"
        fill={`url(#${gradientId})`}
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M2 7v9l10 6 10-6V7M12 13v9" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

interface BrandWordmarkProps {
  className?: string;
}

export function BrandWordmark({ className = "" }: BrandWordmarkProps) {
  const letterClass = "text-base font-black uppercase tracking-[0.02em]";

  return (
    <span className={`inline-flex items-center ${className}`} style={{ color: "#be123c" }} aria-label="Lattice">
      <span className={letterClass}>L</span>
      <span className={letterClass}>A</span>
      <span className={letterClass}>T</span>
      <span className={letterClass}>T</span>
      <span className="mx-[0.12em] flex items-center">
        <Cube />
      </span>
      <span className={letterClass}>C</span>
      <span className={letterClass}>E</span>
    </span>
  );
}
