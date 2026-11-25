import { useRef, useState } from "react";
import { login } from "../lib/auth";

export default function LoginPage() {
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = userRef.current?.value ?? "";
    const p = passRef.current?.value ?? "";
    if (login(u, p)) {
      window.location.href = "/dashboard";
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-line bg-card/80 p-6 shadow-sm backdrop-blur"
      >
        <h1 className="text-xl font-bold text-ink">Lattice Demo</h1>
        <p className="mt-1 text-sm text-muted">Sign in to continue</p>
        <div className="mt-4 space-y-3">
          <input
            ref={userRef}
            type="text"
            placeholder="Username"
            defaultValue=""
            className="w-full rounded-lg border border-line bg-page/60 px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/40"
          />
          <input
            ref={passRef}
            type="password"
            placeholder="Password"
            defaultValue=""
            className="w-full rounded-lg border border-line bg-page/60 px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Sign in
        </button>
        <p className="mt-3 text-[11px] text-muted">Demo credentials: admin / admin123</p>
      </form>
    </div>
  );
}