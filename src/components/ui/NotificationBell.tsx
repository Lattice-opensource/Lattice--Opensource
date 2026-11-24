import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Alert } from "../../data/api/energyApi";
import { getEnergyApi } from "../../data/getEnergyApi";
import { useApiResource } from "../../data/useApiResource";

const READ_ALERTS_KEY = "lattice_read_alerts";
const POLL_INTERVAL_MS = 30000;

const PROMOS = [
  {
    id: "promo-pro",
    tag: "PRO",
    title: "Upgrade to Home Pro",
    detail: "Unlock advanced insights, custom reports, and priority support.",
    to: "/profile",
  },
  {
    id: "promo-insights",
    tag: "NEW",
    title: "See where your money goes",
    detail: "Open Insights for personalised ways to cut your electricity bill.",
    to: "/insights",
  },
];

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_ALERTS_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>): void {
  try {
    localStorage.setItem(READ_ALERTS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loader = useCallback(async (): Promise<Alert[]> => {
    const api = getEnergyApi();
    if (!api.getAlerts) return [];
    return api.getAlerts({ status: "active" });
  }, []);

  const { state } = useApiResource<Alert[]>(loader, POLL_INTERVAL_MS);
  const alerts = state.status === "ready" ? state.data : [];
  const unreadCount = alerts.filter((alert) => !readIds.has(alert.id)).length;
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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
  }, [open]);

  const markRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const alert of alerts) next.add(alert.id);
      saveReadIds(next);
      return next;
    });
  };

  const openAlert = (alert: Alert) => {
    markRead(alert.id);
    setOpen(false);
    navigate(`/alerts/${encodeURIComponent(alert.id)}`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg border border-line p-2 text-muted transition-colors hover:bg-page hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={hasUnread ? `Notifications (${unreadCount} unread)` : "Notifications"}
        aria-expanded={open}
      >
        <BellIcon />
        {hasUnread ? (
          <span
            className="absolute h-2 w-2 rounded-full ring-2 ring-card"
            style={{ top: 4, right: 4, backgroundColor: "#ef4444" }}
          />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {hasUnread ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-brand hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {state.status === "loading" ? (
            <p className="px-3 py-4 text-sm text-muted">Loading notifications…</p>
          ) : state.status === "error" ? (
            <p className="px-3 py-4 text-sm text-muted">Notifications are unavailable.</p>
          ) : alerts.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No notifications.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {alerts.map((alert) => {
                const isRead = readIds.has(alert.id);
                return (
                  <li key={alert.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      onClick={() => openAlert(alert)}
                      className="flex w-full items-start gap-2 px-3 py-3 text-left transition-colors hover:bg-page"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: isRead ? "transparent" : "#ef4444" }}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm ${
                            isRead ? "font-medium text-muted" : "font-semibold text-ink"
                          }`}
                        >
                          {alert.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {alert.severity} · {new Date(alert.detectedAt).toLocaleString()}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-line bg-page/40 px-3 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              From Lattice
            </p>
            <div className="space-y-2">
              {PROMOS.map((promo) => (
                <button
                  key={promo.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(promo.to);
                  }}
                  className="flex w-full items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 p-2.5 text-left transition-colors hover:bg-brand/10"
                >
                  <span className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-black text-white">
                    {promo.tag}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-ink">{promo.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted">{promo.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
