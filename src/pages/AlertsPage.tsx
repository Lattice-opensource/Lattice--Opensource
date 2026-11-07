import { useCallback, useState } from "react";
import type { Alert } from "../data/api/energyApi";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Spinner } from "../components/ui/Spinner";

const SEVERITIES = ["all", "high", "medium", "low"] as const;
const STATUSES = ["all", "active", "acknowledged", "resolved"] as const;

export function AlertsPage() {
  const [severity, setSeverity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loader = useCallback(async (): Promise<Alert[]> => {
    const api = getEnergyApi();
    if (!api.getAlerts) throw new Error("Alerts are unavailable from this provider.");
    return api.getAlerts({
      severity: severity === "all" ? undefined : severity,
      status: status === "all" ? undefined : status,
    });
  }, [severity, status]);

  const { state, reload } = useApiResource<Alert[]>(loader);
  const alerts = state.status === "ready" ? state.data : [];
  const selected = alerts.find((a) => a.id === selectedId) ?? null;

  const counts = {
    active: alerts.filter((a) => a.status === "active").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
  };

  async function acknowledge(id: string) {
    const api = getEnergyApi();
    if (!api.acknowledgeAlert) return;
    await api.acknowledgeAlert(id);
    reload();
  }

  async function resolve(id: string) {
    const api = getEnergyApi();
    if (!api.resolveAlert) return;
    await api.resolveAlert(id);
    reload();
  }

  async function runDetection() {
    const api = getEnergyApi();
    if (!api.detectAlerts) return;
    await api.detectAlerts();
    reload();
  }

  if (state.status === "loading") return <div className="py-16"><Spinner label="Loading alerts" /></div>;
  if (state.status === "error") return <ErrorState message={state.message} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Alerts</h1>
          <p className="mt-1 text-sm text-muted">Proactive energy anomaly detection and alert management.</p>
        </div>
        <button type="button" onClick={runDetection} className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/40">
          Run detection
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card title="Active"><p className="text-2xl font-bold text-ink">{counts.active}</p></Card>
        <Card title="Acknowledged"><p className="text-2xl font-bold text-ink">{counts.acknowledged}</p></Card>
        <Card title="Resolved"><p className="text-2xl font-bold text-ink">{counts.resolved}</p></Card>
        <Card title="High"><p className="text-2xl font-bold text-ink">{counts.high}</p></Card>
        <Card title="Medium"><p className="text-2xl font-bold text-ink">{counts.medium}</p></Card>
        <Card title="Low"><p className="text-2xl font-bold text-ink">{counts.low}</p></Card>
      </div>

      <Card title="Filters">
        <div className="flex flex-wrap gap-3">
          <label className="text-xs font-semibold text-muted">Severity
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="ml-2 rounded border border-line bg-page px-2 py-1 text-sm text-ink">
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="ml-2 rounded border border-line bg-page px-2 py-1 text-sm text-ink">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Alerts">
          {alerts.length === 0 ? <EmptyState title="No alerts" description="No alerts match the current filters." /> : (
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <button type="button" onClick={() => setSelectedId(alert.id)} className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${selectedId === alert.id ? "border-brand bg-brand-soft" : "border-line bg-page hover:border-brand/40"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">{alert.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${alert.severity === "high" ? "bg-red-100 text-red-700" : alert.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{alert.severity}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{alert.type} · {alert.status} · {new Date(alert.detectedAt).toLocaleString()}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Alert detail">
          {!selected ? <EmptyState title="Select an alert" description="Choose an alert to view details and actions." /> : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Title</p>
                <p className="font-semibold text-ink">{selected.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Severity / Status</p>
                <p className="text-ink">{selected.severity} · {selected.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Observed / Expected</p>
                <p className="text-ink">{selected.observedValue ?? "—"} / {selected.expectedValue ?? "—"}</p>
              </div>
              {selected.additionalCostInr !== null ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Additional cost</p>
                  <p className="text-ink">₹{selected.additionalCostInr}</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Explanation</p>
                <p className="text-ink">{selected.explanation}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommendation</p>
                <p className="text-ink">{selected.recommendation}</p>
              </div>
              <div className="flex gap-2 pt-2">
                {selected.status === "active" ? <button type="button" onClick={() => acknowledge(selected.id)} className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/40">Acknowledge</button> : null}
                {selected.status !== "resolved" ? <button type="button" onClick={() => resolve(selected.id)} className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/40">Resolve</button> : null}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}