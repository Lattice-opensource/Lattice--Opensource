import { describe, it, expect } from "vitest";
import type { DeviceSummary, EnergyReading } from "./energyApi";
import {
  startOfDayInTimeZone,
  resolveWholeSite,
  buildPowerSeries,
} from "./normalize";

function device(overrides: Partial<DeviceSummary> & Pick<DeviceSummary, "deviceId">): DeviceSummary {
  return {
    name: overrides.deviceId,
    roomName: null,
    category: "other",
    status: "online",
    isSimulated: true,
    powerW: 0,
    energyKwh: 0,
    costInr: 0,
    lastSeenAt: null,
    ...overrides,
  };
}

describe("startOfDayInTimeZone", () => {
  it("returns the local midnight for Asia/Kolkata", () => {
    const instant = new Date("2026-10-22T18:00:00.000Z");
    const start = startOfDayInTimeZone("Asia/Kolkata", instant);
    expect(start.toISOString()).toBe("2026-10-21T18:30:00.000Z");
  });

  it("handles a time zone behind UTC", () => {
    const instant = new Date("2026-10-22T03:00:00.000Z");
    const start = startOfDayInTimeZone("America/New_York", instant);
    // Oct 21 23:00 EDT -> Oct 22 00:00 EDT = 04:00 UTC
    expect(start.toISOString()).toBe("2026-10-21T04:00:00.000Z");
  });
});

describe("resolveWholeSite", () => {
  it("uses the site meter when it reports the total load", () => {
    const devices = [
      device({ deviceId: "ac", roomName: "Living Room", powerW: 1100, energyKwh: 1, costInr: 5 }),
      device({ deviceId: "tv", roomName: "Living Room", powerW: 100, energyKwh: 0.2, costInr: 1 }),
      device({ deviceId: "meter", roomName: null, powerW: 3166, energyKwh: 9, costInr: 45 }),
    ];
    const result = resolveWholeSite(devices);
    expect(result.source).toBe("meter");
    expect(result.meterDeviceId).toBe("meter");
    expect(result.powerW).toBe(3166);
    expect(result.energyKwh).toBe(9);
    expect(result.costInr).toBe(45);
  });

  it("does not add appliance power on top of the meter", () => {
    const devices = [
      device({ deviceId: "ac", roomName: "Living Room", powerW: 1100, energyKwh: 1, costInr: 5 }),
      device({ deviceId: "meter", roomName: null, powerW: 3166, energyKwh: 9, costInr: 45 }),
    ];
    const result = resolveWholeSite(devices);
    // must not be 1100 + 3166
    expect(result.powerW).toBe(3166);
  });

  it("sums devices when no site meter is present", () => {
    const devices = [
      device({ deviceId: "ac", roomName: "Living Room", powerW: 1100, energyKwh: 1, costInr: 5 }),
      device({ deviceId: "tv", roomName: "Living Room", powerW: 100, energyKwh: 0.2, costInr: 1 }),
    ];
    const result = resolveWholeSite(devices);
    expect(result.source).toBe("devices");
    expect(result.meterDeviceId).toBeNull();
    expect(result.powerW).toBe(1200);
    expect(result.energyKwh).toBeCloseTo(1.2);
    expect(result.costInr).toBe(6);
  });

  it("ignores a room-less candidate that is not the dominant load", () => {
    const devices = [
      device({ deviceId: "ac", roomName: "Living Room", powerW: 1100, energyKwh: 1, costInr: 5 }),
      device({ deviceId: "orphan", roomName: null, powerW: 50, energyKwh: 0.1, costInr: 0.5 }),
    ];
    const result = resolveWholeSite(devices);
    expect(result.source).toBe("devices");
    expect(result.powerW).toBe(1100);
  });

  it("handles an empty device list", () => {
    const result = resolveWholeSite([]);
    expect(result.powerW).toBe(0);
    expect(result.energyKwh).toBe(0);
    expect(result.costInr).toBe(0);
    expect(result.source).toBe("devices");
  });
});

describe("buildPowerSeries", () => {
  it("buckets readings into 15-minute intervals by device", () => {
    const readings: EnergyReading[] = [
      { timestamp: "2026-10-22T10:00:00.000Z", powerW: 100, energyKwh: 0, deviceId: "a" },
      { timestamp: "2026-10-22T10:05:00.000Z", powerW: 200, energyKwh: 0, deviceId: "b" },
      { timestamp: "2026-10-22T10:20:00.000Z", powerW: 50, energyKwh: 0, deviceId: "a" },
    ];
    const series = buildPowerSeries(readings, { bucketMs: 15 * 60_000 });
    expect(series).toHaveLength(2);
    expect(series[0].powerW).toBe(300);
    expect(series[1].powerW).toBe(50);
  });

  it("excludes the site meter when requested", () => {
    const readings: EnergyReading[] = [
      { timestamp: "2026-10-22T10:00:00.000Z", powerW: 100, energyKwh: 0, deviceId: "ac" },
      { timestamp: "2026-10-22T10:00:00.000Z", powerW: 3000, energyKwh: 0, deviceId: "meter" },
    ];
    const series = buildPowerSeries(readings, {
      bucketMs: 15 * 60_000,
      excludeDeviceIds: ["meter"],
    });
    expect(series).toHaveLength(1);
    expect(series[0].powerW).toBe(100);
  });

  it("returns an empty array for empty input", () => {
    expect(buildPowerSeries([])).toEqual([]);
  });

  it("uses interval energy only and ignores cumulative registers", () => {
    // buildPowerSeries only reads powerW and timestamp; energyKwhTotal is never consulted.
    const readings: EnergyReading[] = [
      {
        timestamp: "2026-10-22T10:00:00.000Z",
        powerW: 100,
        energyKwh: 0.25,
        deviceId: "a",
      },
    ];
    const series = buildPowerSeries(readings, { bucketMs: 15 * 60_000 });
    expect(series[0].powerW).toBe(100);
  });
});
