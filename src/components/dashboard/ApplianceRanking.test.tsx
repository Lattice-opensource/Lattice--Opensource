import { describe, it, expect } from "vitest";
import { rankAppliances } from "./ApplianceRanking";
import type { DeviceSummary } from "../../data/api/energyApi";

function device(overrides: Partial<DeviceSummary> & Pick<DeviceSummary, "deviceId">): DeviceSummary {
  return {
    name: overrides.deviceId,
    roomName: "Living Room",
    category: "appliance",
    status: "online",
    isSimulated: true,
    powerW: 0,
    energyKwh: 0,
    costInr: 0,
    lastSeenAt: null,
    ...overrides,
  };
}

describe("rankAppliances", () => {
  it("ranks appliances by interval energy, highest first", () => {
    const devices = [
      device({ deviceId: "a", name: "A", energyKwh: 1.0 }),
      device({ deviceId: "b", name: "B", energyKwh: 3.0 }),
      device({ deviceId: "c", name: "C", energyKwh: 2.0 }),
    ];
    const ranked = rankAppliances(devices, 6.0);
    expect(ranked.map((r) => r.deviceId)).toEqual(["b", "c", "a"]);
  });

  it("excludes site-level meters from appliance ranking", () => {
    const devices = [
      device({ deviceId: "meter", name: "Main Meter", roomName: null, energyKwh: 10 }),
      device({ deviceId: "a", name: "A", energyKwh: 1.0 }),
    ];
    const ranked = rankAppliances(devices, 10);
    expect(ranked.map((r) => r.deviceId)).toEqual(["a"]);
  });

  it("computes percentage share from interval energy", () => {
    const devices = [device({ deviceId: "a", energyKwh: 2.0 })];
    const ranked = rankAppliances(devices, 8.0);
    expect(ranked[0].share).toBe(25);
  });

  it("returns zero share when household energy is zero", () => {
    const devices = [device({ deviceId: "a", energyKwh: 1.0 })];
    const ranked = rankAppliances(devices, 0);
    expect(ranked[0].share).toBe(0);
  });

  it("handles missing readings (zero energy) without NaN", () => {
    const devices = [device({ deviceId: "a", energyKwh: 0 })];
    const ranked = rankAppliances(devices, 5);
    expect(Number.isFinite(ranked[0].share)).toBe(true);
    expect(ranked[0].share).toBe(0);
  });

  it("preserves isSimulated flag", () => {
    const devices = [device({ deviceId: "a", energyKwh: 1, isSimulated: false })];
    const ranked = rankAppliances(devices, 1);
    expect(ranked[0].isSimulated).toBe(false);
  });

  it("does not use cumulative energy (energyKwh only)", () => {
    // rankAppliances only reads energyKwh (interval), never energyKwhTotal.
    const devices = [device({ deviceId: "a", energyKwh: 0.5 })];
    const ranked = rankAppliances(devices, 0.5);
    expect(ranked[0].energyKwh).toBe(0.5);
    expect(ranked[0].share).toBe(100);
  });
});
