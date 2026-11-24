import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Device, Room } from "@lattice/contracts";
import type { Alert } from "../../data/api/energyApi";
import { getEnergyApi } from "../../data/getEnergyApi";
import { useApiResource } from "../../data/useApiResource";

interface SearchData {
  devices: Device[];
  rooms: Room[];
  alerts: Alert[];
}

interface Result {
  id: string;
  label: string;
  detail: string;
  to: string;
  kind: "device" | "room" | "alert" | "page";
}

const PAGES: Result[] = [
  { id: "page-dashboard", label: "Dashboard", detail: "Live energy overview", to: "/dashboard", kind: "page" },
  { id: "page-devices", label: "Devices", detail: "All monitored devices", to: "/devices", kind: "page" },
  { id: "page-rooms", label: "Rooms", detail: "Energy by room", to: "/rooms", kind: "page" },
  { id: "page-campus", label: "Campus", detail: "Building hierarchy", to: "/campus", kind: "page" },
  { id: "page-insights", label: "Insights", detail: "Saving recommendations", to: "/insights", kind: "page" },
  { id: "page-alerts", label: "Alerts", detail: "Active alerts and notifications", to: "/alerts", kind: "page" },
  { id: "page-reports", label: "Reports", detail: "Reports and exports", to: "/reports", kind: "page" },
  { id: "page-profile", label: "Profile", detail: "Account details", to: "/profile", kind: "page" },
];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loader = useCallback(async (): Promise<SearchData> => {
    const api = getEnergyApi();
    const [devices, rooms, alerts] = await Promise.all([
      api.getDevices?.() ?? Promise.resolve([]),
      api.getRooms?.() ?? Promise.resolve([]),
      api.getAlerts?.() ?? Promise.resolve([]),
    ]);
    return { devices, rooms, alerts };
  }, []);

  const { state } = useApiResource<SearchData>(loader, 60000);
  const devices = state.status === "ready" ? state.data.devices : [];
  const rooms = state.status === "ready" ? state.data.rooms : [];
  const alerts = state.status === "ready" ? state.data.alerts : [];

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const deviceResults: Result[] = devices
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.roomName ?? "").toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q),
      )
      .slice(0, 6)
      .map((d) => ({
        id: `device-${d.id}`,
        label: d.name,
        detail: `${d.roomName ?? "Site level"} · ${d.category}`,
        to: `/devices/${encodeURIComponent(d.id)}`,
        kind: "device",
      }));

    const roomResults: Result[] = rooms
      .filter((r) => r.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((r) => ({
        id: `room-${r.id}`,
        label: r.name,
        detail: "Room",
        to: `/rooms/${encodeURIComponent(r.id)}`,
        kind: "room",
      }));

    const alertResults: Result[] = alerts
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.severity.toLowerCase().includes(q) ||
          a.explanation.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((a) => ({
        id: `alert-${a.id}`,
        label: a.title,
        detail: `Alert · ${a.severity} · ${a.status}`,
        to: `/alerts/${encodeURIComponent(a.id)}`,
        kind: "alert",
      }));

    const pageResults = PAGES.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 4);

    return [...alertResults, ...deviceResults, ...roomResults, ...pageResults].slice(0, 10);
  }, [query, devices, rooms, alerts]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const choose = (result: Result) => {
    setOpen(false);
    setQuery("");
    navigate(result.to);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-page/60 px-2.5 py-1.5 text-muted focus-within:border-brand/40 focus-within:text-ink">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search…"
          aria-label="Search data"
          className="w-28 bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none md:w-44"
        />
      </div>

      {open && query.trim() ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-card shadow-xl">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No matches found.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => choose(result)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-page"
                  >
                    <span className="mt-0.5 rounded-md bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-light">
                      {result.kind}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{result.label}</span>
                      <span className="block truncate text-[11px] text-muted">{result.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
