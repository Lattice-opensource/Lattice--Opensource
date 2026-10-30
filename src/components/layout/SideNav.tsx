import { NavLink } from "react-router-dom";

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/rooms", label: "Zones" },
      { to: "/devices", label: "Equipment" },
      { to: "/desk", label: "My Desk" },
      { to: "/insights", label: "Insights & Actions" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { to: "/admin", label: "Admin Console" },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/account", label: "Profile" },
      { to: "/account", label: "Billing" },
    ],
  },
  {
    title: "Settings",
    items: [
      { to: "/settings", label: "Preferences" },
      { to: "/settings", label: "Appearance" },
    ],
  },
];

export function SideNav({ open, onClose }: SideNavProps) {
  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-ink/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-card transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <p className="text-sm font-black tracking-[0.18em] text-ink">LATTICE</p>
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
        <nav className="space-y-4 p-3" aria-label="Primary">
          {sections.map((section, idx) => (
            <div key={section.title}>
              {idx > 0 ? <div className="my-3 border-t border-line" /> : null}
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {section.title}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? "bg-brand/10 text-brand" : "text-muted hover:bg-page hover:text-ink"
                      }`
                    }
                  >
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