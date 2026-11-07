import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampusPage } from "./CampusPage";

const apiState = vi.hoisted(() => ({ api: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("../data/getEnergyApi", () => ({ getEnergyApi: () => apiState.api }));

const overview = { siteId: "site-1", siteName: "North Campus", timezone: "UTC", currency: "INR", dataSource: { simulated: true, notice: "sample" }, wholeSite: { powerW: 0, energyKwh: 0, costInr: 0, source: "devices" as const, meterDeviceId: null }, peak: { powerW: 0, at: null }, averagePowerW: 0, devices: [], rooms: [], series: [], deviceCount: 0, onlineDeviceCount: 0, lastUpdated: "2026-01-01T00:00:00.000Z" };

function configure(overrides: Record<string, unknown> = {}) {
  apiState.api = { getSiteOverview: vi.fn().mockResolvedValue(overview), getBuildings: vi.fn().mockResolvedValue([{ id: "b1", siteId: "site-1", name: "Academic Block", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }]), getFloors: vi.fn().mockResolvedValue([{ id: "f1", buildingId: "b1", name: "Ground Floor", level: 0, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }]), getRooms: vi.fn().mockResolvedValue([{ id: "r1", siteId: "site-1", buildingId: "b1", floorId: "f1", name: "Computer Lab", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }]), getCircuits: vi.fn().mockResolvedValue([{ id: "c1", siteId: "site-1", buildingId: "b1", floorId: "f1", roomId: "r1", name: "Lab circuit", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }]), getDevices: vi.fn().mockResolvedValue([{ id: "d1", siteId: "site-1", roomId: "r1", circuitId: "c1", roomName: "Computer Lab", name: "Lab meter", category: "other", model: null, ratedPowerW: null, status: "online", lastSeenAt: null, isSimulated: true, installedAt: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }]), getSummary: vi.fn().mockResolvedValue({ siteId: "site-1", window: { from: "2026-01-01T00:00:00.000Z", to: "2026-01-01T00:00:00.000Z" }, totals: { powerW: 0, energyKwh: 0, costInr: 0, costIsEstimate: true }, byDevice: [], byRoom: [], dataQuality: { simulated: true, simulatedReadings: 0, realReadings: 0, simulatedEnergyKwh: 0, realEnergyKwh: 0 } }), getAggregate: vi.fn().mockResolvedValue([]), ...overrides };
}

describe("CampusPage", () => {
  it("loads and navigates building, floor, space, circuit, and devices", async () => {
    configure(); render(<CampusPage />); const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Academic Block" }));
    await user.click(await screen.findByRole("button", { name: "Ground Floor" }));
    await user.click(await screen.findByRole("button", { name: "Computer Lab" }));
    await user.click(await screen.findByRole("button", { name: "Lab circuit" }));
    expect(await screen.findByText("Lab meter")).toBeInTheDocument();
    expect(apiState.api.getDevices).toHaveBeenCalledWith({ circuitId: "c1" });
  });

  it("shows an empty hierarchy state", async () => {
    configure({ getBuildings: vi.fn().mockResolvedValue([]) }); render(<CampusPage />);
    expect(await screen.findByText("No buildings are available for this site.")).toBeInTheDocument();
  });

  it("shows API errors", async () => {
    configure({ getSiteOverview: vi.fn().mockRejectedValue(new Error("Service unavailable")) }); render(<CampusPage />);
    expect(await screen.findByText("Service unavailable")).toBeInTheDocument();
  });
});
