interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 px-6 md:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2 md:hidden">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="text-sm font-semibold tracking-wide text-white">Lattice</span>
        </div>
        <div className="hidden text-sm text-gray-400 md:block">Smart energy monitoring</div>
      </div>
      <div className="text-xs text-gray-500">Sample data only</div>
    </header>
  );
}
