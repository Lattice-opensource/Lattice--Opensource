import { useParams, useNavigate, Link } from "react-router-dom";
import { NOTIFICATIONS } from "../data/notifications";
import { Card } from "../components/ui/Card";

const severityColor: Record<string, string> = {
  critical: "text-red-600",
  warning: "text-amber-600",
};

export function NotificationsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selected = NOTIFICATIONS.find((n) => n.id === id);

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← Back to notifications
        </button>
        <Card title={selected.title} eyebrow={selected.severity.toUpperCase()}>
          <div className="space-y-4 text-sm">
            <p className="text-ink">{selected.message}</p>
            {selected.deviceName ? (
              <p>
                <span className="font-semibold text-ink">Device:</span>{" "}
                <span className="text-muted">{selected.deviceName}</span>
              </p>
            ) : null}

            {/* 3D model placeholder */}
            <div className="relative mx-auto h-48 w-48 [perspective:800px]">
              <div className="absolute inset-0 m-auto h-32 w-32 [transform-style:preserve-3d] [transform:rotateX(20deg)_rotateY(-30deg)]">
                <div className="absolute inset-0 rounded-lg border border-line bg-card shadow-lg" />
                <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.6)]" />
              </div>
              <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted">
                3D device model (problem area marked)
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                  What's wrong
                </p>
                <p className="mt-2 text-sm text-red-900 dark:text-red-100">{selected.detail}</p>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Cause
                </p>
                <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">{selected.cause}</p>
              </div>
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Recommended fix
                </p>
                <p className="mt-2 text-sm text-emerald-900 dark:text-emerald-100">{selected.fix}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Notifications</h1>
      <div className="space-y-3">
        {NOTIFICATIONS.map((n) => (
          <Link
            key={n.id}
            to={`/notifications/${n.id}`}
            className="block rounded-2xl border border-line bg-card p-4 shadow-sm transition-colors hover:bg-page"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${severityColor[n.severity]}`}>{n.title}</p>
                <p className="mt-1 text-sm text-muted">{n.message}</p>
              </div>
              <span className="rounded-full bg-page px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                {n.severity}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}