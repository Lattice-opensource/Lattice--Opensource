import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useApiResource } from "./useApiResource";

describe("useApiResource", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in the loading state", () => {
    const loader = vi.fn(() => new Promise<string>(() => {}));
    const { result } = renderHook(() => useApiResource(loader));
    expect(result.current.state.status).toBe("loading");
  });

  it("resolves to ready data on success", async () => {
    const loader = vi.fn(() => Promise.resolve("hello"));
    const { result } = renderHook(() => useApiResource(loader));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.state).toMatchObject({ status: "ready", data: "hello" });
  });

  it("transitions to error when the loader rejects", async () => {
    const loader = vi.fn(() => Promise.reject(new Error("boom")));
    const { result } = renderHook(() => useApiResource(loader));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toMatchObject({ status: "error", message: "boom" });
  });

  it("preserves previous data when a refresh fails", async () => {
    const loader = vi.fn<() => Promise<string>>();
    loader.mockResolvedValueOnce("first");
    loader.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useApiResource(loader));
    await waitFor(() => expect(result.current.state.status).toBe("ready"));

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect((result.current.state as { error?: string }).error).toBe("network down"));
    expect(result.current.state).toMatchObject({ status: "ready", data: "first", error: "network down" });
  });

  it("retry re-invokes the loader", async () => {
    const loader = vi.fn<() => Promise<string>>();
    loader.mockRejectedValueOnce(new Error("fail"));
    loader.mockResolvedValueOnce("ok");

    const { result } = renderHook(() => useApiResource(loader));
    await waitFor(() => expect(result.current.state.status).toBe("error"));

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.state).toMatchObject({ status: "ready", data: "ok" });
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("polls on the configured interval", async () => {
    vi.useFakeTimers();
    const loader = vi.fn(() => Promise.resolve("tick"));
    renderHook(() => useApiResource(loader, 1000));
    await act(async () => {
      await Promise.resolve();
    });
    expect(loader).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(loader).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
