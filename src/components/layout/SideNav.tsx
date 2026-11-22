import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: "Main",
    items: [
      { to: "/dashboard", label: "Home", icon: "home" },
      { to: "/rooms", label: "Zones" },
      { to: "/devices", label: "Equipment" },
      { to: "/desk", label: "My Desk" },
      { to: "/insights", label: "Insights & Actions" },
    ],
  },
];

export function SideNav({ open, onClose }: SideNavProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
      });
    };
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  const startDrag = (e: any) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-ink/30"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      <aside
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-brand-dark bg-brand transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="flex items-center justify-between border-b border-line px-4 py-4 cursor-move select-none"
          onMouseDown={startDrag}
        >
          <p className="text-sm font-black tracking-[0.18em] text-white">LATTICE</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line p-1.5 text-muted hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-brand md:hidden"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav className="space-y-2 p-3" aria-label="Primary">
          {sections.map((section) => (
            <div key={section.title}>

              <div className="mt-2 space-y-2">
                {section.items.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    {item.icon === "home" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M3 11l9-8 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 20v-6h4v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}