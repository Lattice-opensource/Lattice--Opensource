import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { currentUser } from "../lib/currentUser";

const TWO_FACTOR_KEY = "lattice_two_factor_enabled";
const NOTIFICATIONS_KEY = "lattice_notifications_enabled";

function loadTwoFactor(): boolean {
  try {
    return localStorage.getItem(TWO_FACTOR_KEY) === "true";
  } catch {
    return false;
  }
}

function loadNotifications(): boolean {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.6" />
      {off ? <path d="M4 4 20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

export default function UserProfilePage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(loadTwoFactor);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(loadNotifications);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    localStorage.getItem("lattice-theme") === "light" ? "light" : "dark",
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<"dark" | "light">).detail;
      if (detail === "dark" || detail === "light") setTheme(detail);
    };
    window.addEventListener("lattice-theme-change", handler);
    return () => window.removeEventListener("lattice-theme-change", handler);
  }, []);

  const toggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, String(next));
    } catch {
      /* ignore */
    }
  };

  const toggleTwoFactor = () => {
    const next = !twoFactorEnabled;
    setTwoFactorEnabled(next);
    try {
      localStorage.setItem(TWO_FACTOR_KEY, String(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-light">Account</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-3xl">User profile</h1>
          <p className="mt-1 text-sm text-muted">Your account details and personal information.</p>
        </div>
        <Link
          to="/dashboard"
          className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
        >
          ← Back to dashboard
        </Link>
      </header>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-light text-2xl font-black text-white shadow-lg">
            {currentUser.initials}
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-ink">{currentUser.name}</h2>
            <p className="mt-0.5 text-sm text-muted">{currentUser.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
              {currentUser.role}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Contact information" eyebrow="Profile">
          <dl>
            <DetailRow label="Full name" value={currentUser.name} />
            <DetailRow label="Email address" value={currentUser.email} />
            <DetailRow label="Phone" value={currentUser.phone} />
            <DetailRow label="Timezone" value={currentUser.timezoneLabel} />
          </dl>
        </Card>

        <Card title="Security" eyebrow="Account">
          <dl>
            <DetailRow label="Username" value={currentUser.username} />
            <div className="flex flex-col gap-0.5 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Password</dt>
              <dd className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium text-ink ${passwordVisible ? "" : "select-none blur-[3px]"}`}
                  aria-label={passwordVisible ? "Password visible" : "Password hidden"}
                >
                  {currentUser.password}
                </span>
                <button
                  type="button"
                  onClick={() => setPasswordVisible((value) => !value)}
                  className="rounded-lg border border-line p-1.5 text-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={!passwordVisible} />
                </button>
              </dd>
            </div>
            <div className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Two-factor authentication
                </dt>
                <dd className="mt-0.5 text-[11px] text-muted">
                  {twoFactorEnabled ? "Enabled — extra security on sign in" : "Disabled — add an extra layer of security"}
                </dd>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={twoFactorEnabled}
                aria-label="Toggle two-factor authentication"
                onClick={toggleTwoFactor}
                className="flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                style={{ backgroundColor: twoFactorEnabled ? "#e11d48" : "#3f4655" }}
              >
                <span
                  className="block h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: twoFactorEnabled ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
            <DetailRow label="Account status" value="Active" />
          </dl>
        </Card>

        <Card title="Plan & site" eyebrow="Workspace">
          <dl>
            <DetailRow label="Current plan" value={currentUser.plan} />
            <DetailRow label="Primary site" value={currentUser.site} />
            <DetailRow label="Member since" value={currentUser.memberSince} />
          </dl>
        </Card>

        <Card title="Preferences" eyebrow="More">
          <dl>
            <div className="flex flex-col gap-0.5 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Notifications</dt>
              <dd>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="text-sm font-medium text-ink hover:text-brand-light"
                  aria-label="Toggle notifications"
                >
                  {notificationsEnabled ? "On" : "Off"}
                </button>
              </dd>
            </div>
            <DetailRow label="Theme" value={theme === "light" ? "Light" : "Dark"} />
            <DetailRow label="Language" value="English (India)" />
          </dl>
        </Card>
      </div>
    </div>
  );
}
