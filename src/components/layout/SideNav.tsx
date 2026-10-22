import { NavLink } from "react-router-dom";

const navItems = [{ to: "/dashboard", label: "Dashboard" }];

export function SideNav() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-ink-soft/60 px-4 py-6 md:block">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
        <span className="text-sm font-semibold tracking-wide text-white">Lattice</span>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand/15 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
