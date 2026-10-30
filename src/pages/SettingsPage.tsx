import { useTheme } from "../data/ThemeContext";

export function SettingsPage() {
  const { theme, toggle } = useTheme();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Settings</h1>
      <p className="text-sm text-muted">Configure dashboard preferences and appearance.</p>
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-base font-semibold text-ink">Appearance</h2>
        <p className="mt-2 text-sm text-muted">Switch between light and dark mode.</p>
        <button
          type="button"
          onClick={toggle}
          className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        </button>
      </section>
    </div>
  );
}