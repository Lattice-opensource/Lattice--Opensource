import type { SVGProps } from "react";

function make(path: string, viewBox = "0 0 24 24") {
  return function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d={path} />
      </svg>
    );
  };
}

export const Monitor = make("M4 5h16v11H4zM9 20h6M12 16v4");
export const Lightbulb = make("M12 3a6 6 0 0 0-3 11c.6.6 1 1.4 1 2.3V18h4v-1.7c0-.9.4-1.7 1-2.3A6 6 0 0 0 12 3zM9 21h6");
export const Volume2 = make("M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12");
export const Cpu = make("M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 7h10v10H7z");
export const RotateCcw = make("M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5");
export const ChevronRight = make("M9 6l6 6-6 6");
export const TrendingUp = make("M3 17l6-6 4 4 8-8M14 7h7v7");
export const Sun = make("M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42");
export const Plus = make("M12 5v14M5 12h14");
export const X = make("M6 6l12 12M18 6L6 18");
export const Zap = make("M13 2L3 14h9l-1 8 10-12h-9l1-8z");
export const Power = make("M12 2v10M17.66 6.34a8 8 0 1 1-11.32 0");
export const Gauge = make("M12 14l4-4M3.34 14A8 8 0 1 1 20.66 14");
export const MoreVertical = make("M12 5v.01M12 12v.01M12 19v.01");
export const Close = make("M6 6l12 12M18 6L6 18");
export const Mail = make("M4 4h16v16H4zM4 4l8 8 8-8");
export const UserPlus = make("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6");
export const Trash2 = make("M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6");
export const ShieldCheck = make("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4");
