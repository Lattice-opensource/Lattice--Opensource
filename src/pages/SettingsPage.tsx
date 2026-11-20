export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Settings</h1>
      <p className="text-sm text-muted">Account details and preferences.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-base font-semibold text-ink">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Name</dt>
              <dd className="font-semibold text-ink">Building Administrator</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Email</dt>
              <dd className="font-semibold text-ink">admin@lattice.building</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Role</dt>
              <dd className="font-semibold text-ink">Facility Manager</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-base font-semibold text-ink">Building</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Site</dt>
              <dd className="font-semibold text-ink">Lattice Office Tower</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Timezone</dt>
              <dd className="font-semibold text-ink">Asia/Kolkata</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Currency</dt>
              <dd className="font-semibold text-ink">INR</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}