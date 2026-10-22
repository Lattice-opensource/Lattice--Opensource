import { NavLinks } from "./NavLinks";

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

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
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-card transition-transform md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <p className="text-sm font-black tracking-[0.18em] text-ink">LATTICE</p>
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
        <div className="p-3">
          <NavLinks stacked onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}
