export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 px-6 md:px-10">
      <div className="flex items-center gap-2 md:hidden">
        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
        <span className="text-sm font-semibold tracking-wide text-white">Lattice</span>
      </div>
      <div className="hidden text-sm text-gray-400 md:block">
        Smart energy monitoring
      </div>
      <div className="text-xs text-gray-500">Sample data only</div>
    </header>
  );
}
