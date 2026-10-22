import { useCallback, useEffect, useRef, useState } from "react";

export type ResourceState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T; error?: string };

export interface Resource<T> {
  state: ResourceState<T>;
  reload: () => void;
}

/**
 * Loads a value from the data layer and keeps it fresh.
 *
 * While refreshing, previously loaded data stays on screen; a failed refresh
 * surfaces the error next to the stale data instead of blanking the page.
 */
export function useApiResource<T>(loader: () => Promise<T>, pollMs?: number): Resource<T> {
  const [state, setState] = useState<ResourceState<T>>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    loaderRef
      .current()
      .then((data) => {
        if (!active) return;
        setState((prev) =>
          prev.status === "ready"
            ? { status: "ready", data, error: undefined }
            : { status: "ready", data },
        );
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((prev) =>
          prev.status === "ready" ? { status: "ready", data: prev.data, error: message } : { status: "error", message },
        );
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!pollMs) return;
    const id = window.setInterval(reload, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, reload]);

  return { state, reload };
}
