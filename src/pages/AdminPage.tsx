import { useState, useMemo, useCallback } from "react";
import { getEnergyApi } from "../data/getEnergyApi";
import { useApiResource } from "../data/useApiResource";
import type { SiteOverview } from "../data/api/energyApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import type { DeviceSummary } from "../data/api/energyApi";
import { MoreVertical, X, ShieldCheck } from "../components/ui/Icons";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "analyst" | "viewer";
  status: "active" | "invited" | "away";
  lastActive: string;
  initials: string;
}

const INITIAL_TEAM: TeamMember[] = [
  { id: "t2", name: "Ananya Rao", email: "ananya.rao@lattice.io", role: "owner", status: "active", lastActive: "now", initials: "AR" },
  { id: "t3", name: "Vikram Shah", email: "vikram.shah@lattice.io", role: "manager", status: "active", lastActive: "1h ago", initials: "VS" },
  { id: "t4", name: "Meera Iyer", email: "meera.iyer@lattice.io", role: "analyst", status: "active", lastActive: "3h ago", initials: "MI" },
  { id: "t5", name: "Rohan Gupta", email: "rohan.gupta@lattice.io", role: "viewer", status: "invited", lastActive: "—", initials: "RG" },
  { id: "t6", name: "Sana Qureshi", email: "sana.qureshi@lattice.io", role: "viewer", status: "away", lastActive: "2 days ago", initials: "SQ" },
];

const ROLES: Record<TeamMember["role"], { label: string; color: string }> = {
  owner: { label: "Owner", color: "#e11d48" },
  admin: { label: "Admin", color: "#8b5cf6" },
  manager: { label: "Facility Mgr", color: "#0ea5e9" },
  analyst: { label: "Analyst", color: "#059669" },
  viewer: { label: "Viewer", color: "#6b7280" },
};

const STATUS: Record<TeamMember["status"], { label: string; color: string }> = {
  active: { label: "Active", color: "#059669" },
  invited: { label: "Invited", color: "#b45309" },
  away: { label: "Away", color: "#6b7280" },
};

const ROLE_DESC: Record<TeamMember["role"], string> = {
  owner: "Full control including billing and ownership transfer. Only one per workspace.",
  admin: "Everything except billing/ownership — can invite, remove and re-role members, manage equipment.",
  manager: "Day-to-day operations: acknowledge alerts, schedule equipment. Cannot manage people.",
  analyst: "Read-only across analytics, exports and reports. Ideal for finance and sustainability teams.",
  viewer: "Sees only the summary dashboard. No controls, no exports, no member list.",
};

function loadTeam(): TeamMember[] {
  try {
    const raw = localStorage.getItem("lattice-team");
    if (raw) {
      const parsed = JSON.parse(raw) as TeamMember[];
      // drop the legacy seeded owner entry
      const cleaned = parsed.filter((m) => m.email !== "guruprasad.lattice@gmail.com");
      if (cleaned.length !== parsed.length) {
        try { localStorage.setItem("lattice-team", JSON.stringify(cleaned)); } catch {}
      }
      if (cleaned.length > 0) return cleaned;
    }
  } catch {}
  return INITIAL_TEAM;
}

function loadDevices(): DeviceSummary[] {
  try {
    const raw = localStorage.getItem("lattice-admin-devices");
    if (raw) return JSON.parse(raw) as DeviceSummary[];
  } catch {}
  return [];
}

export function AdminPage() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try { return localStorage.getItem("lattice-admin-auth") === "1"; } catch { return false; }
  });
  const [loginForm, setLoginForm] = useState({ user: "", pass: "" });
  const [loginErr, setLoginErr] = useState("");

  const doLogin = () => {
    if (loginForm.user === "admin" && loginForm.pass === "admin") {
      try { localStorage.setItem("lattice-admin-auth", "1"); } catch {}
      setAuthed(true);
      setLoginErr("");
    } else {
      setLoginErr("Invalid credentials. Demo: admin / admin");
    }
  };
  const doLogout = () => {
    try { localStorage.removeItem("lattice-admin-auth"); } catch {}
    setAuthed(false);
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-md space-y-5 py-12">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">Separate credentials for workspace administrators.</p>
        </div>
        <Card title="Sign in" eyebrow="Admin access">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-muted">Username</label>
              <input value={loginForm.user} onChange={(e) => setLoginForm((f) => ({ ...f, user: e.target.value }))} placeholder="admin" className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink" autoFocus />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-muted">Password</label>
              <input value={loginForm.pass} onChange={(e) => setLoginForm((f) => ({ ...f, pass: e.target.value }))} placeholder="admin" type="password" className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink" onKeyDown={(e) => e.key === "Enter" && doLogin()} />
            </div>
            {loginErr ? <p className="text-xs font-semibold text-brand">{loginErr}</p> : null}
            <button type="button" onClick={doLogin} className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Sign in</button>
            <p className="text-[11px] text-muted">Demo credentials: <span className="font-mono">admin</span> / <span className="font-mono">admin</span></p>
          </div>
        </Card>
      </div>
    );
  }

  // rest of the admin console...
  const loader = useCallback(async (): Promise<SiteOverview> => {
    const api = getEnergyApi();
    const overview = await api.getSiteOverview?.();
    if (!overview) throw new Error("Data provider does not support site overview.");
    return overview;
  }, []);
  const { state } = useApiResource<SiteOverview>(loader);

  const [tab, setTab] = useState<"team" | "devices" | "roles">("team");
  const [team, setTeam] = useState<TeamMember[]>(loadTeam);
  const [adminDevices, setAdminDevices] = useState<DeviceSummary[]>(loadDevices);
  const [query, setQuery] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [invite, setInvite] = useState({ name: "", email: "", role: "viewer" as TeamMember["role"] });
  const [deviceForm, setDeviceForm] = useState({ name: "", room: "Plant Room", watts: "" });
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "warn" | "err" } | null>(null);

  const flash = useCallback((msg: string, kind: "ok" | "warn" | "err" = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const persistTeam = (next: TeamMember[]) => { setTeam(next); try { localStorage.setItem("lattice-team", JSON.stringify(next)); } catch {} };
  const persistDevices = (next: DeviceSummary[]) => { setAdminDevices(next); try { localStorage.setItem("lattice-admin-devices", JSON.stringify(next)); } catch {} };

  const filteredTeam = useMemo(
    () => team.filter((m) => (m.name + m.email + m.role).toLowerCase().includes(query.toLowerCase())),
    [team, query]
  );

  const counts = useMemo(() => ({
    total: team.length,
    active: team.filter((m) => m.status === "active").length,
    invited: team.filter((m) => m.status === "invited").length,
    admins: team.filter((m) => m.role === "owner" || m.role === "admin").length,
  }), [team]);

  const apiDevices = state.status === "ready" ? state.data.devices : [];

  const allDevices = useMemo(() => [...apiDevices, ...adminDevices], [apiDevices, adminDevices]);

  // team actions
  const changeRole = (id: string, role: TeamMember["role"]) => {
    persistTeam(team.map((m) => (m.id === id ? { ...m, role } : m)));
    setMenuFor(null);
    flash(`Role updated to ${ROLES[role].label}`);
  };
  const removeMember = (id: string) => {
    const m = team.find((x) => x.id === id);
    persistTeam(team.filter((x) => x.id !== id));
    setMenuFor(null);
    flash(`${m?.name ?? "Member"} removed`, "warn");
  };
  const resendInvite = (id: string) => {
    persistTeam(team.map((m) => (m.id === id ? { ...m, status: "invited" } : m)));
    setMenuFor(null);
    flash("Invite resent");
  };
  const sendInvite = () => {
    if (!invite.name.trim() || !/\S+@\S+\.\S+/.test(invite.email)) { flash("Enter a name and a valid email", "err"); return; }
    const initials = invite.name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    persistTeam([...team, { id: "t" + Date.now().toString(36), name: invite.name.trim(), email: invite.email.trim(), role: invite.role, status: "invited", lastActive: "—", initials }]);
    setInvite({ name: "", email: "", role: "viewer" });
    setShowInvite(false);
    flash("Invitation sent");
  };

  // device actions
  const handleAddDevice = () => {
    if (!deviceForm.name.trim()) { flash("Device name is required", "err"); return; }
    const w = Number(deviceForm.watts);
    if (!w || w < 5) { flash("Enter rated power in watts", "err"); return; }
    const nd: DeviceSummary = {
      deviceId: "dev_" + Date.now().toString(36),
      name: deviceForm.name.trim(),
      roomName: deviceForm.room,
      category: "appliance",
      status: "online",
      isSimulated: true,
      powerW: w,
      energyKwh: 0,
      costInr: 0,
      lastSeenAt: new Date().toISOString(),
    };
    persistDevices([...adminDevices, nd]);
    setDeviceForm({ name: "", room: "Plant Room", watts: "" });
    setShowAddDevice(false);
    flash(`"${nd.name}" added to monitoring`);
  };

  const removeDevice = (id: string) => {
    if (adminDevices.some((d) => d.deviceId === id)) {
      persistDevices(adminDevices.filter((d) => d.deviceId !== id));
      flash("Device removed", "warn");
    } else {
      flash("Built-in equipment can't be removed (demo)", "warn");
    }
  };

  const tabs = [
    { key: "team" as const, label: "Team members", count: team.length },
    { key: "devices" as const, label: "Equipment", count: allDevices.length },
    { key: "roles" as const, label: "Roles & access", count: null },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Admin console</h1>
          <p className="mt-1 text-sm text-muted">
            Manage who has access to this workspace and every metered device connected to it.
          </p>
        </div>
        <button
          type="button"
          onClick={doLogout}
          className="rounded-lg border border-line bg-page px-3 py-2 text-xs font-semibold text-muted hover:bg-card hover:text-ink"
        >
          Sign out
        </button>
        <button
          type="button"
          onClick={() => (tab === "team" ? setShowInvite(true) : setShowAddDevice(true))}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {tab === "team" ? "+ Invite member" : "+ Add device"}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Team size</p>
          <p className="mt-1 text-2xl font-bold text-ink">{counts.total}</p>
          <p className="mt-1 text-xs text-muted">{counts.admins} with admin rights</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active now</p>
          <p className="mt-1 text-2xl font-bold text-ok">{counts.active}</p>
          <p className="mt-1 text-xs text-muted">signed in this week</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pending invites</p>
          <p className="mt-1 text-2xl font-bold text-warn">{counts.invited}</p>
          <p className="mt-1 text-xs text-muted">not yet accepted</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Monitored equipment</p>
          <p className="mt-1 text-2xl font-bold text-ink">{allDevices.length}</p>
          <p className="mt-1 text-xs text-muted">{allDevices.filter((d) => d.status === "online").length} currently online</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key ? "border-brand bg-brand/10 text-brand" : "border-line bg-card text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== null ? <span className="ml-1.5 tabular-nums">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {tab === "team" ? (
        <Card title="Team members" eyebrow="01 · People">
          <div className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or role…"
              className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink placeholder:text-muted"
            />
          </div>
          <div className="divide-y divide-line">
            {filteredTeam.map((m) => {
              const role = ROLES[m.role];
              const st = STATUS[m.status];
              return (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: role.color }}>
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {m.name}
                      {m.role === "owner" ? <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold text-brand">YOU</span> : null}
                    </p>
                    <p className="truncate text-xs text-muted">{m.email}</p>
                  </div>
                  <span className="hidden rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline-block" style={{ background: role.color + "22", color: role.color }}>
                    {role.label}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: st.color + "22", color: st.color }}>
                    {st.label}
                  </span>
                  <span className="hidden w-20 text-right text-xs text-muted md:block">{m.lastActive}</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}
                      className="rounded-lg border border-line p-1.5 text-muted hover:bg-page"
                      aria-label="Member actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuFor === m.id ? (
                      <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-line bg-card p-1.5 shadow-xl">
                        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Change role</p>
                        {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([k, r]) => (
                          <button
                            key={k}
                            type="button"
                            disabled={m.role === "owner"}
                            onClick={() => changeRole(m.id, k as TeamMember["role"])}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-page disabled:opacity-40"
                            style={{ color: m.role === k ? r.color : undefined }}
                          >
                            {r.label}
                            {m.role === k ? <span className="ml-auto text-ok">✓</span> : null}
                          </button>
                        ))}
                        <div className="my-1 border-t border-line" />
                        {m.status === "invited" ? (
                          <button type="button" onClick={() => resendInvite(m.id)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-page">
                            Resend invite
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={m.role === "owner"}
                          onClick={() => removeMember(m.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand hover:bg-brand/10 disabled:opacity-40"
                        >
                          Remove from team
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {filteredTeam.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-ink">No members match “{query}”</p>
                <button type="button" onClick={() => setQuery("")} className="mt-3 rounded-lg border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:bg-card">
                  Clear search
                </button>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {tab === "devices" ? (
        <Card title="Monitored equipment" eyebrow="02 · Equipment">
          {state.status === "loading" ? (
            <div className="py-8"><Spinner label="Loading equipment" /></div>
          ) : state.status === "error" ? (
            <ErrorState message={state.message} />
          ) : allDevices.length === 0 ? (
            <EmptyState title="No equipment" description="No equipment is reporting for this building." />
          ) : (
            <div className="divide-y divide-line">
              {allDevices.map((d) => {
                const online = d.status === "online";
                const adminAdded = adminDevices.some((a) => a.deviceId === d.deviceId);
                return (
                  <div key={d.deviceId} className="flex items-center gap-3 py-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${online ? "bg-brand/10" : "bg-page"}`}>
                      <span className={`text-xs font-bold ${online ? "text-brand" : "text-muted"}`}>EQ</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{d.name}</p>
                      <p className="text-xs text-muted">
                        {d.roomName ?? "Unassigned"} · {d.category} · {Math.round(d.powerW)} W · ₹{Math.round(d.costInr).toLocaleString()}/day
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${online ? "bg-emerald-50 text-ok" : "bg-page text-muted"}`}>
                      {online ? "Online" : "Offline"}
                    </span>
                    {adminAdded ? (
                      <button
                        type="button"
                        onClick={() => removeDevice(d.deviceId)}
                        className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10"
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted">built-in</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : null}

      {tab === "roles" ? (
        <div className="space-y-3">
          {(Object.keys(ROLES) as Array<keyof typeof ROLES>).map((k) => {
            const r = ROLES[k];
            const members = team.filter((m) => m.role === k);
            return (
              <Card key={k}>
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white" style={{ background: r.color }}>
                    {r.label[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{r.label}</p>
                      <span className="rounded-full bg-page px-2 py-0.5 text-[10px] font-bold text-muted">{members.length} member{members.length === 1 ? "" : "s"}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{ROLE_DESC[k]}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {members.length ? members.map((m) => (
                        <span key={m.id} className="rounded-full border border-line bg-page px-2 py-0.5 text-[10px] font-semibold text-ink">{m.name}</span>
                      )) : <span className="text-xs text-muted">No one has this role yet</span>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-ink/80">
            <span className="font-semibold">Demo only.</span> Role changes are held in the browser and reset on reload of stored data. In production these are enforced server-side.
          </div>
        </div>
      ) : null}

      {/* invite modal */}
      {showInvite ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Invite a team member</h3>
              <button type="button" onClick={() => setShowInvite(false)} className="rounded-lg border border-line p-1.5 text-muted hover:bg-page">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted">Full name</label>
                <input value={invite.name} onChange={(e) => setInvite((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Priya Nair" className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink" autoFocus />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted">Email</label>
                <input value={invite.email} onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))} placeholder="name@company.com" type="email" className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted">Role</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(ROLES).map(([k, r]) => (
                    <button key={k} type="button" onClick={() => setInvite((f) => ({ ...f, role: k as TeamMember["role"] }))}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${invite.role === k ? "border-brand bg-brand/10 text-brand" : "border-line bg-page text-ink hover:bg-card"}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowInvite(false)} className="rounded-lg border border-line bg-page px-4 py-2 text-xs font-semibold text-ink hover:bg-card">Cancel</button>
                <button type="button" onClick={sendInvite} className="rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand-dark">Send invite</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* add device modal */}
      {showAddDevice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Add monitored equipment</h3>
              <button type="button" onClick={() => setShowAddDevice(false)} className="rounded-lg border border-line p-1.5 text-muted hover:bg-page">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted">Equipment name</label>
                <input value={deviceForm.name} onChange={(e) => setDeviceForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Server Room UPS" className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-muted">Location</label>
                  <select value={deviceForm.room} onChange={(e) => setDeviceForm((f) => ({ ...f, room: e.target.value }))} className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink">
                    {["Plant Room", "Floor 1 Open Office", "Floor 2 Open Office", "Server Room", "Parking & Utilities"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-muted">Rated power (W)</label>
                  <input value={deviceForm.watts} onChange={(e) => setDeviceForm((f) => ({ ...f, watts: e.target.value }))} placeholder="e.g. 850" type="number" min="5" className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink" />
                </div>
              </div>
              <p className="text-xs text-muted">It joins the live monitor and appears on the Dashboard and Equipment pages.</p>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddDevice(false)} className="rounded-lg border border-line bg-page px-4 py-2 text-xs font-semibold text-ink hover:bg-card">Cancel</button>
                <button type="button" onClick={handleAddDevice} className="rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand-dark">Add equipment</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold text-ink shadow-xl">
          {toast.msg}
        </div>
      ) : null}

      <p className="text-xs text-muted">
        Admin changes to equipment are demo-only and stored in this browser. Team and role changes persist in localStorage.
      </p>
    </div>
  );
}
