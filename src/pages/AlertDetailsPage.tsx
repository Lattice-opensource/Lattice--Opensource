import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Alert, Device } from "../data/api/energyApi";
import type { Building, Circuit, Floor, Room } from "@lattice/contracts";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import { Card } from "../components/ui/Card";
import { MetricTile } from "../components/ui/MetricTile";
import { StatusPill } from "../components/ui/StatusPill";
import { Spinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/ErrorState";

interface AlertDetails {
  alert: Alert;
  device: Device | null;
  room: Room | null;
  building: Building | null;
  floor: Floor | null;
  circuit: Circuit | null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

export default function AlertDetailsPage() {
  const { alertId = "" } = useParams();
  const [busy, setBusy] = useState(false);

  const loader = useCallback(async (): Promise<AlertDetails> => {
    const api = getEnergyApi();
    if (!api.getAlert) throw new Error("Alert details are unavailable from this provider.");
    const alert = await api.getAlert(alertId);

    const [devices, rooms, buildings, floors, circuits] = await Promise.all([
      api.getDevices?.() ?? Promise.resolve([]),
      api.getRooms?.() ?? Promise.resolve([]),
      api.getBuildings?.() ?? Promise.resolve([]),
      api.getFloors?.() ?? Promise.resolve([]),
      api.getCircuits?.() ?? Promise.resolve([]),
    ]);

    return {
      alert,
      device: devices.find((d) => d.id === alert.deviceId) ?? null,
      room: rooms.find((r) => r.id === alert.roomId) ?? null,
      building: buildings.find((b) => b.id === alert.buildingId) ?? null,
      floor: floors.find((f) => f.id === alert.floorId) ?? null,
      circuit: circuits.find((c) => c.id === alert.circuitId) ?? null,
    };
  }, [alertId]);

  const { state, reload } = useApiResource<AlertDetails>(loader, 15000);

  async function runAction(action: "acknowledge" | "resolve") {
    const api = getEnergyApi();
    setBusy(true);
    try {
      if (action === "acknowledge") await api.acknowledgeAlert?.(alertId);
      else await api.resolveAlert?.(alertId);
      reload();
    } finally {
      setBusy(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="py-16">
        <Spinner label="Loading alert details" />
      </div>
    );
  }
  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={reload} />;
  }

  const { alert, device, room, building, floor, circuit } = state.data;
  const severityClass =
    alert.severity === "high"
      ? "bg-brand/10 text-brand-light"
      : alert.severity === "medium"
        ? "bg-amber-500/10 text-amber-300"
        : "bg-sky-500/10 text-sky-300";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-light">Alert details</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">{alert.title}</h1>
          <p className="mt-1 text-sm text-muted">
            Detected {formatDate(alert.detectedAt)} · {alert.type.replace(/_/g, " ")}
          </p>
        </div>
        <Link
          to="/alerts"
          className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
        >
          ← All alerts
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Severity" value={alert.severity.toUpperCase()} />
        <MetricTile label="Status" value={alert.status.toUpperCase()} />
        <MetricTile
          label="Additional cost"
          value={alert.additionalCostInr !== null ? `₹${alert.additionalCostInr.toFixed(2)}` : "—"}
          accent="brand"
        />
        <MetricTile
          label="Observed"
          value={alert.observedValue !== null ? String(alert.observedValue) : "—"}
        />
      </div>

      <Card title="What happened" eyebrow="Summary">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${severityClass}`}>
              {alert.severity} severity
            </span>
            <StatusPill status={alert.status} />
          </div>
          <p className="text-sm leading-relaxed text-ink">{alert.explanation}</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommendation</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">{alert.recommendation}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Measurement" eyebrow="Values">
          <dl>
            <DetailRow label="Observed value" value={alert.observedValue !== null ? String(alert.observedValue) : "—"} />
            <DetailRow label="Expected value" value={alert.expectedValue !== null ? String(alert.expectedValue) : "—"} />
            <DetailRow
              label="Additional cost"
              value={alert.additionalCostInr !== null ? `₹${alert.additionalCostInr.toFixed(2)}` : "—"}
            />
            <DetailRow label="Alert type" value={alert.type.replace(/_/g, " ")} />
          </dl>
        </Card>

        <Card title="Where" eyebrow="Location">
          <dl>
            <DetailRow label="Device" value={device?.name ?? alert.deviceId ?? "—"} />
            <DetailRow label="Room" value={room?.name ?? alert.roomId ?? "—"} />
            <DetailRow label="Floor" value={floor?.name ?? alert.floorId ?? "—"} />
            <DetailRow label="Building" value={building?.name ?? alert.buildingId ?? "—"} />
            <DetailRow label="Circuit" value={circuit?.name ?? alert.circuitId ?? "—"} />
            <DetailRow label="Site ID" value={alert.siteId ?? "—"} />
          </dl>
        </Card>

        <Card title="Timeline" eyebrow="Dates">
          <dl>
            <DetailRow label="Detected" value={formatDate(alert.detectedAt)} />
            <DetailRow label="Acknowledged" value={formatDate(alert.acknowledgedAt)} />
            <DetailRow label="Resolved" value={formatDate(alert.resolvedAt)} />
            <DetailRow label="Created" value={formatDate(alert.createdAt)} />
            <DetailRow label="Last updated" value={formatDate(alert.updatedAt)} />
          </dl>
        </Card>

        <Card title="Identifiers" eyebrow="Reference">
          <dl>
            <DetailRow label="Alert ID" value={alert.id} />
            <DetailRow label="Device ID" value={alert.deviceId ?? "—"} />
            <DetailRow label="Room ID" value={alert.roomId ?? "—"} />
            <DetailRow label="Circuit ID" value={alert.circuitId ?? "—"} />
          </dl>
        </Card>
      </div>

      <Card title="Actions" eyebrow="Manage">
        <div className="flex flex-wrap gap-2">
          {alert.status === "active" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("acknowledge")}
              className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/40 disabled:opacity-50"
            >
              Acknowledge
            </button>
          ) : null}
          {alert.status !== "resolved" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("resolve")}
              className="rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/40 disabled:opacity-50"
            >
              Resolve
            </button>
          ) : null}
          {alert.status === "resolved" ? (
            <p className="text-sm text-muted">This alert has been resolved.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
