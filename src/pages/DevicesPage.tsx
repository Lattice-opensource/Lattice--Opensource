import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import type { DeviceSummary, EnergyReading } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { StatusPill } from "../components/ui/StatusPill";
import { RecentReadings } from "../components/dashboard/RecentReadings";

interface DevicesPayload {
  devices: DeviceSummary[];
  readings: EnergyReading[];
  timezone: string;
}

const CATEGORY_ICON: Record<string, string> = {
  hvac: "🌡️",
  lighting: "💡",
  kitchen: "🧊",
  electronics: "🖥️",
  appliance: "🔌",
  ev: "🚗",
  other: "📦",
};

function roomIcon(roomName: string): string {
  const name = roomName.toLowerCase();
  if (name.includes("living") || name.includes("common")) return "🛋️";
  if (name.includes("kitchen")) return "🍳";
  if (name.includes("energy") || name.includes("meter") || name.includes("site")) return "⚡";
  if (name.includes("climate") || name.includes("hvac") || name.includes("auditorium")) return "🌡️";
  if (name.includes("study") || name.includes("lab") || name.includes("computer") || name.includes("library")) return "📚";
  if (name.includes("outdoor") || name.includes("corridor")) return "🌳";
  if (name.includes("update")) return "🔄";
  return "📍";
}

const CUSTOM_DEVICES_KEY = "lattice_custom_devices";

interface NewDeviceForm {
  name: string;
  roomName: string;
  category: string;
}

function loadCustomDevices(): DeviceSummary[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DEVICES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DeviceSummary[]) : [];
  } catch {
    return [];
  }
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DeviceCard({ device }: { device: DeviceSummary }) {
  return (
    <Link
      to={`/devices/${encodeURIComponent(device.deviceId)}`}
      className="flex items-start gap-3 rounded-xl border border-line bg-page/50 p-3 transition-colors hover:border-brand/40 hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-card text-lg">
        {CATEGORY_ICON[device.category] ?? "📦"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{device.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-2">
          <StatusPill status={device.status} />
          <span className="text-[11px] capitalize text-muted">{device.category}</span>
        </span>
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          <span className="font-semibold tabular-nums text-ink">{Math.round(device.powerW)} W</span>
          <span className="tabular-nums text-muted">{device.energyKwh.toFixed(2)} kWh</span>
          <span className="tabular-nums text-ok">₹{device.costInr.toFixed(2)}</span>
        </span>
      </span>
    </Link>
  );
}

export function DevicesPage() {
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [customDevices, setCustomDevices] = useState<DeviceSummary[]>(loadCustomDevices);
  const [form, setForm] = useState<NewDeviceForm>({ name: "", roomName: "", category: "other" });

  const loader = useCallback(async (): Promise<DevicesPayload> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    const devices = (await api.getDeviceSummaries?.(overview.siteId)) ?? overview.devices;
    const readings = await api.getRecentReadings(overview.siteId, 12);
    return { devices, readings, timezone: overview.timezone };
  }, []);

  const POLL_INTERVAL_MS = 10000;
  const { state, reload } = useApiResource<DevicesPayload>(loader, POLL_INTERVAL_MS);

  const groups = useMemo(() => {
    const devices = [...(state.status === "ready" ? state.data.devices : []), ...customDevices];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? devices.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.roomName ?? "").toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q),
        )
      : devices;

    const map = new Map<string, DeviceSummary[]>();
    for (const device of filtered) {
      const key = device.roomName ?? "Site level";
      const existing = map.get(key) ?? [];
      existing.push(device);
      map.set(key, existing);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [state, query, customDevices]);

  function submitDevice(event: FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const device: DeviceSummary = {
      deviceId: `custom-${Date.now()}`,
      name,
      roomName: form.roomName.trim() || "Site level",
      category: form.category,
      status: "unknown",
      isSimulated: false,
      powerW: 0,
      energyKwh: 0,
      costInr: 0,
      lastSeenAt: null,
    };
    const next = [...customDevices, device];
    setCustomDevices(next);
    try {
      localStorage.setItem(CUSTOM_DEVICES_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setForm({ name: "", roomName: "", category: "other" });
    setShowAdd(false);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Devices</h1>
          <p className="mt-1 text-sm text-muted">
            Per-device power, energy and cost for the current day, grouped by room.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-page/60 px-2.5 py-1.5 text-muted focus-within:border-brand/40 focus-within:text-ink">
          <FilterIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter devices…"
            aria-label="Filter devices"
            className="w-40 bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      </header>

      {state.status === "loading" ? (
        <div className="py-12">
          <Spinner label="Loading devices" />
        </div>
      ) : state.status === "error" ? (
        <ErrorState message={state.message} onRetry={reload} />
      ) : state.status !== "ready" || state.data.devices.length === 0 ? (
        <EmptyState title="No devices" description="No devices are reporting for this site." />
      ) : (
        <>
          {state.error ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-ink/80">
              <span className="font-semibold">Refresh failed:</span> {state.error} — showing the last
              successful reading.
            </div>
          ) : null}

          {groups.length === 0 ? (
            <EmptyState title="No matches" description={`No devices match “${query}”.`} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {groups.map(([roomName, devices]) => (
                <section key={roomName}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                      <span>{roomIcon(roomName)}</span>
                      {roomName}
                    </h2>
                    <span className="text-[11px] text-muted">
                      {devices.length} {devices.length === 1 ? "device" : "devices"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 2xl:grid-cols-2">
                    {devices.map((device) => (
                      <DeviceCard key={device.deviceId} device={device} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <Card title="Latest readings" eyebrow="02 · Readings">
            {state.data.readings.length === 0 ? (
              <EmptyState title="No readings" description="No recent readings are available." />
            ) : (
              <RecentReadings readings={state.data.readings} timezone={state.data.timezone} />
            )}
          </Card>

          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-4 text-sm font-semibold text-muted transition-colors hover:border-brand/50 hover:text-brand-light"
          >
            <span className="text-lg leading-none">＋</span>
            Add device
          </button>
        </>
      )}

      {showAdd ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4" role="presentation">
          <form
            onSubmit={submitDevice}
            className="w-full max-w-md space-y-4 rounded-2xl border border-line bg-card p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">Add device</h2>
                <p className="mt-0.5 text-xs text-muted">Add a device to your local view.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:text-ink"
              >
                Close
              </button>
            </div>

            <label className="block text-xs font-semibold text-muted">
              Device name
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Desk lamp"
                className="mt-1 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/40 focus:outline-none"
              />
            </label>

            <label className="block text-xs font-semibold text-muted">
              Room
              <input
                value={form.roomName}
                onChange={(event) => setForm({ ...form, roomName: event.target.value })}
                placeholder="e.g. Living room"
                className="mt-1 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/40 focus:outline-none"
              />
            </label>

            <label className="block text-xs font-semibold text-muted">
              Category
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink focus:border-brand/40 focus:outline-none"
              >
                {Object.keys(CATEGORY_ICON).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Add device
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
