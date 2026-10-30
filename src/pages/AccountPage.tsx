export function AccountPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Account</h1>
      <p className="text-sm text-muted">Manage your profile, organization, and billing details.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-base font-semibold text-ink">Profile</h2>
          <p className="mt-2 text-sm text-muted">Name, email, and role for the building administrator.</p>
        </section>
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-base font-semibold text-ink">Billing</h2>
          <p className="mt-2 text-sm text-muted">Tariff plan, invoices, and payment methods.</p>
        </section>
      </div>
    </div>
  );
}