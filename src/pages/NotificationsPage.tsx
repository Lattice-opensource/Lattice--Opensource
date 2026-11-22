import { useParams, useNavigate, Link } from "react-router-dom";
import { NOTIFICATIONS } from "../data/notifications";
import { Card } from "../components/ui/Card";

const severityColor: Record<string, string> = {
  critical: "text-red-600",
  warning: "text-amber-600",
  info: "text-sky-600",
  promo: "text-brand",
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
          <div className="space-y-3 text-sm">
            <p className="text-ink">{selected.message}</p>
            {selected.deviceName ? (
              <p>
                <span className="font-semibold text-ink">Device:</span>{" "}
                <span className="text-muted">{selected.deviceName}</span>
              </p>
            ) : null}
            <div>
              <p className="font-semibold text-ink">What's wrong</p>
              <p className="text-muted">{selected.detail}</p>
            </div>
            <div>
              <p className="font-semibold text-ink">Cause</p>
              <p className="text-muted">{selected.cause}</p>
            </div>
            <div>
              <p className="font-semibold text-ink">Recommended fix</p>
              <p className="text-muted">{selected.fix}</p>
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