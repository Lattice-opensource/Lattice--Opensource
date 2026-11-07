import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lattice-theme");
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !dark);
    localStorage.setItem("lattice-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="rounded-lg border border-line bg-card/60 px-3 py-1.5 text-xs font-semibold text-ink transition-all hover:border-brand/40 hover:text-brand-light"
      aria-label="Toggle theme"
    >
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}