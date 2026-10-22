interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div role="status" className="rounded-xl border border-dashed border-line bg-page/60 p-8 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
    </div>
  );
}
