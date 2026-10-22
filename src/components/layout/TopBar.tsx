import { NavLinks } from "./NavLinks";

interface TopBarProps {
  onMenuClick: () => void;
  simulated: boolean;
}

export function TopBar({ onMenuClick, simulated }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg border border-line p-2 text-ink transition-colors hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
            aria-label="Open navigation"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-sm font-black text-white"
              aria-hidden="true"
            >
              L
            </span>
            <div className="leading-tight">
              <p className="text-sm font-black tracking-[0.18em] text-ink">LATTICE</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                Smart Energy
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NavLinks />
          {simulated ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-warn ring-1 ring-amber-200">
              Simulated data
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-ok ring-1 ring-emerald-200">
              Live data
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
