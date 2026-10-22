export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-gray-500">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand"
        aria-hidden="true"
      />
      <span>{label}…</span>
    </div>
  );
}
