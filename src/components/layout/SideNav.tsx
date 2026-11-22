import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { NOTIFICATIONS } from "../../data/notifications";

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
  const navigate = useNavigate();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const hasUnread = readIds.size < NOTIFICATIONS.length;

  useEffect(() => {
    const closeOnBlur = () => setNotifOpen(false);
    window.addEventListener("blur", closeOnBlur);
    document.addEventListener("visibilitychange", closeOnBlur);
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
      window.removeEventListener("blur", closeOnBlur);
      document.removeEventListener("visibilitychange", closeOnBlur);
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
          onClick={() => {
            onClose();
            setNotifOpen(false);
          }}
          aria-hidden="true"
        />
      ) : null}
      <aside
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-brand-dark bg-brand transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="flex items-center justify-between border-b border-line px-4 py-4 cursor-move select-none"
          onMouseDown={startDrag}
        >
          <NavLink
            to="/account"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-bold text-white">
              BA
            </span>
            <span className="text-sm font-semibold text-white">Building Admin</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-1.5 text-white/80 hover:bg-white/10"
            aria-label="Notifications"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3a6 6 0 0 0-6 6v3l-2 3h16l-2-3V9a6 6 0 0 0-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {hasUnread ? (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
            ) : null}
          </button>
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
        {notifOpen ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-ink/30"
              onClick={() => setNotifOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed left-64 top-16 z-60 w-72 rounded-xl border border-line bg-card p-4 shadow-lg">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              <ul className="mt-3 space-y-2 text-sm">
                {NOTIFICATIONS.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setReadIds((prev) => new Set(prev).add(n.id));
                        setNotifOpen(false);
                        navigate(`/notifications/${n.id}`);
                      }}
                      className="flex w-full items-start gap-2 rounded-lg bg-page/60 px-3 py-2 text-left text-muted hover:bg-page"
                    >
                      <span
                        className={`mt-0.5 ${
                          n.severity === "critical" ? "text-red-500" : "text-amber-500"
                        }`}
                      >
                        {n.severity === "critical" ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 3L2 21h20L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0">
                        <span
                          className={`font-semibold ${
                            n.severity === "critical" ? "text-red-600" : "text-amber-600"
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="mt-0.5 block text-xs">{n.message}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

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