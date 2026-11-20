export function AccountPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-white">
          BA
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Account details</h1>
          <p className="text-sm text-muted">Manage your profile, organization, and security.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-base font-semibold text-ink">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Full name</dt>
              <dd className="font-semibold text-ink">Building Administrator</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Email</dt>
              <dd className="font-semibold text-ink">admin@lattice.building</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Role</dt>
              <dd className="font-semibold text-ink">Facility Manager</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phone</dt>
              <dd className="font-semibold text-ink">+91 98765 43210</dd>
            </div>
          </dl>
          <button className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
            Edit profile
          </button>
        </section>

        <section className="rounded-2xl border border-line bg-card p-6">
          <h2 className="text-base font-semibold text-ink">Organization</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Company</dt>
              <dd className="font-semibold text-ink">Lattice Office Tower</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Sites</dt>
              <dd className="font-semibold text-ink">2 buildings</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Plan</dt>
              <dd className="font-semibold text-ink">Enterprise</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Billing cycle</dt>
              <dd className="font-semibold text-ink">Monthly</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-card p-6">
        <h2 className="text-base font-semibold text-ink">Security</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Password</p>
            <p className="text-xs text-muted">Last changed 30 days ago</p>
          </div>
          <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-page">
            Change password
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Two-factor authentication</p>
            <p className="text-xs text-muted">Enabled via authenticator app</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-ok">
            Enabled
          </span>
        </div>
      </section>
    </div>
  );
}