import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { httpEnergyApi } from "./httpEnergyApi";

const originalFetch = globalThis.fetch;

function mockFetch(body: unknown, ok = true, status = 200) {
  globalThis.fetch = vi.fn(async () => ({
    ok,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe("httpEnergyApi.getRecentReadings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("normalizes canonical `data` records", async () => {
    mockFetch({
      data: [
        {
          id: "r1",
          deviceId: "dev_a",
          timestamp: "2026-10-22T10:00:00.000Z",
          powerW: 1234.5,
          energyKwh: 0.3,
          source: "simulator",
          isSimulated: true,
        },
      ],
      meta: { serverTime: "2026-10-22T10:00:05.000Z" },
    });
    const readings = await httpEnergyApi.getRecentReadings("site-1", 10);
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({
      timestamp: "2026-10-22T10:00:00.000Z",
      powerW: 1234.5,
      energyKwh: 0.3,
      isSimulated: true,
      deviceId: "dev_a",
    });
    expect(readings[0].costInr).toBeUndefined();
  });

  it("preserves a real (non-simulated) canonical record", async () => {
    mockFetch({
      data: [
        {
          id: "r2",
          deviceId: "dev_b",
          timestamp: "2026-10-22T10:00:00.000Z",
          powerW: 500,
          energyKwh: 0.1,
          source: "device",
          isSimulated: false,
        },
      ],
      meta: { serverTime: "2026-10-22T10:00:05.000Z" },
    });
    const readings = await httpEnergyApi.getRecentReadings("site-1", 10);
    expect(readings[0].isSimulated).toBe(false);
  });

  it("treats missing isSimulated as simulated (never silently real)", async () => {
    mockFetch({
      data: [
        {
          id: "r3",
          deviceId: "dev_c",
          timestamp: "2026-10-22T10:00:00.000Z",
          powerW: 900,
          energyKwh: 0.2,
          source: "device",
          // isSimulated omitted
        },
      ],
      meta: { serverTime: "2026-10-22T10:00:05.000Z" },
    });
    const readings = await httpEnergyApi.getRecentReadings("site-1", 10);
    expect(readings[0].isSimulated).toBe(true);
  });

  it("coerces missing/null power and energy to zero", async () => {
    mockFetch({
      data: [
        {
          id: "r4",
          deviceId: "dev_d",
          timestamp: "2026-10-22T10:00:00.000Z",
          powerW: null,
          energyKwh: null,
          source: "simulator",
          isSimulated: true,
        },
      ],
      meta: { serverTime: "2026-10-22T10:00:05.000Z" },
    });
    const readings = await httpEnergyApi.getRecentReadings("site-1", 10);
    expect(readings[0].powerW).toBe(0);
    expect(readings[0].energyKwh).toBe(0);
  });

  it("falls back to the legacy `readings` alias when canonical data is empty", async () => {
    mockFetch({
      readings: [
        {
          deviceId: "dev_e",
          timestamp: "2026-10-22T10:00:00.000Z",
          powerWatts: 750,
          energyKwh: 0.15,
          source: "simulated",
        },
      ],
      count: 1,
      generatedAt: "2026-10-22T10:00:05.000Z",
      data: [],
      meta: { serverTime: "2026-10-22T10:00:05.000Z" },
    });
    const readings = await httpEnergyApi.getRecentReadings("site-1", 10);
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({
      powerW: 750,
      energyKwh: 0.15,
      isSimulated: true,
      deviceId: "dev_e",
    });
  });

  it("treats a legacy source other than 'real' as simulated", async () => {
    mockFetch({
      readings: [
        {
          deviceId: "dev_f",
          timestamp: "2026-10-22T10:00:00.000Z",
          powerWatts: 100,
          energyKwh: 0.02,
          source: "real",
        },
      ],
      count: 1,
      generatedAt: "2026-10-22T10:00:05.000Z",
      data: [],
      meta: { serverTime: "2026-10-22T10:00:05.000Z" },
    });
    const readings = await httpEnergyApi.getRecentReadings("site-1", 10);
    expect(readings[0].isSimulated).toBe(false);
  });

  it("returns an empty array when both arrays are missing", async () => {
    mockFetch({
      data: [],
      meta: { serverTime: "2026-10-22T10:00:05.000Z" },
    });
    const readings = await httpEnergyApi.getRecentReadings("site-1", 10);
    expect(readings).toEqual([]);
  });

  it("throws on a non-OK response", async () => {
    mockFetch({ error: { code: "NOT_FOUND", message: "no such site" } }, false, 404);
    await expect(httpEnergyApi.getRecentReadings("site-1", 10)).rejects.toThrow("no such site");
  });
});

describe("httpEnergyApi.getDataSource", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns the backend data-source status", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: { dataSource: { simulated: true, notice: "simulated", mode: "simulated" } },
        meta: { serverTime: "2026-10-22T10:00:05.000Z" },
      }),
    })) as unknown as typeof fetch;
    const ds = await httpEnergyApi.getDataSource();
    expect(ds).toMatchObject({ simulated: true, notice: "simulated" });
  });
});
