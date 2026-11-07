interface StatusPillProps {
  status: string;
}

const styles: Record<string, string> = {
  online: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  stale: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  offline: "bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/30",
  unknown: "bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[status] ?? styles.unknown}`}>
      {status}
    </span>
  );
}