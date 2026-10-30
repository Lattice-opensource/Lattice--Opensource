import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";

interface NavLinksProps {
  stacked?: boolean;
  onNavigate?: () => void;
}

export function NavLinks({ stacked = false, onNavigate }: NavLinksProps) {
  if (stacked) {
    return (
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-transparent text-brand" : "text-muted hover:bg-transparent hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-transparent text-brand" : "text-muted hover:bg-transparent hover:text-ink"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
