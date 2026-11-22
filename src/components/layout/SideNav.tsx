import { NavLink, useNavigate } from "react-router-dom";
import { BrandWordmark } from "../ui/BrandWordmark";
import { currentUser } from "../../lib/currentUser";
import { NAV_ITEMS, type NavIcon } from "./navItems";

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

function DoodleIcon({ name }: { name: NavIcon }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.8 12 3l9 7.8" />
          <path d="M5.5 9.2V21h13V9.2" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case "devices":
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="18" rx="2.5" />
          <path d="M9 7h6M9 11h6" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "rooms":
      return (
        <svg {...common}>
          <path d="M5 21V4h11v17" />
          <path d="M16 21h3" />
          <path d="M8.5 12h.01" />
        </svg>
      );
    case "campus":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V8l7-4 7 4v13" />
          <path d="M9 21v-5h6v5" />
          <path d="M9 10h.01M15 10h.01" />
        </svg>
      );
    case "insights":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
    default:
      return null;
  }
}

export function SideNav({ open, onClose }: SideNavProps) {
  const navigate = useNavigate();

  const openProfile = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-card shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <BrandWordmark />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line p-1.5 text-muted hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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

        <button
          type="button"
          onClick={openProfile}
          className="mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-line bg-page/60 p-3 text-left transition-colors hover:border-brand/40 hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-light text-sm font-black text-white">
            {currentUser.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{currentUser.name}</span>
            <span className="block truncate text-[11px] text-muted">{currentUser.email}</span>
          </span>
        </button>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand/10 text-brand" : "text-muted hover:bg-page hover:text-ink"
                }`
              }
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-page/70">
                <DoodleIcon name={item.icon} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
