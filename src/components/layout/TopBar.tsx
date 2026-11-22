import { BrandWordmark } from "../ui/BrandWordmark";
import { ThemeToggle } from "../ui/ThemeToggle";
import { NotificationBell } from "../ui/NotificationBell";
import { getStoredApiKey, setStoredApiKey } from "../../data/api/httpEnergyApi";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg border border-line p-2 text-ink transition-colors hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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

          <BrandWordmark />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const current = getStoredApiKey();
              const next = window.prompt("Enter API key (leave blank to clear):", current);
              if (next !== null) {
                setStoredApiKey(next.trim());
                window.location.reload();
              }
            }}
            className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:text-ink"
          >
            API key
          </button>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
