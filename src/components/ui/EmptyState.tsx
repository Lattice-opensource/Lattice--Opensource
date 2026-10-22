interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div role="status" className="rounded-xl border border-dashed border-white/15 p-6 text-center">
      <p className="text-sm font-medium text-white">{title}</p>
      {description ? <p className="mt-1 text-xs text-gray-400">{description}</p> : null}
    </div>
  );
}
