interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
      <p className="text-sm font-semibold text-red-300">{title}</p>
      <p className="mt-1 text-xs text-gray-300">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
