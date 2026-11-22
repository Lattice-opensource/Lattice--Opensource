import { useParams, useNavigate, Link } from "react-router-dom";
import { NOTIFICATIONS } from "../data/notifications";
import { Card } from "../components/ui/Card";
import { DeviceModel3D } from "../components/ui/DeviceModel3D";

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

            <DeviceModel3D variant={selected.deviceId} />

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

            {(selected.severity === "critical" || selected.severity === "warning") ? (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                  Note
                </p>
                <p className="mt-2 text-sm text-red-900 dark:text-red-100">
                  Problem area is marked in red on the device model above.
                </p>
              </div>
            ) : null}
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
