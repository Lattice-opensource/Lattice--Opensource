// DEMO DATA ONLY — clearly labeled sample data for development.
// Not real sensor readings. Replace with API-backed data in production.

export type RoomStatus = "normal" | "higher" | "unusual" | "critical" | "nodata";

export interface DemoAppliance {
  id: string;
  name: string;
  type: string;
  ratedPowerW: number | null;
  powerW: number | null; // null when no appliance-level data
  energyKwh: number | null;
  isSimulated: boolean;
}

export interface DemoRoom {
  id: string;
  name: string;
  type: string;
  points: { x: number; y: number }[];
  powerW: number | null; // null = no data
  energyKwh: number | null;
  expectedKwh: number | null;
  status: RoomStatus;
  appliances: DemoAppliance[];
  alertCount: number;
  hasMeter: boolean;
  hasCircuit: boolean;
}

export interface DemoFloor {
  id: string;
  name: string;
  level: number;
  rooms: DemoRoom[];
  blueprintUrl: string | null;
}

export interface DemoBuilding {
  id: string;
  name: string;
  siteId: string;
  floors: DemoFloor[];
}

export const DEMO_BUILDING: DemoBuilding = {
  id: "bld-1",
  name: "HQ Building (Demo)",
  siteId: "site1",
  floors: [
    {
      id: "f1",
      name: "Ground Floor",
      level: 0,
      blueprintUrl: null,
      rooms: [
        {
          id: "r1",
          name: "Living Room",
          type: "living",
          points: [{ x: 0.05, y: 0.05 }, { x: 0.45, y: 0.05 }, { x: 0.45, y: 0.45 }, { x: 0.05, y: 0.45 }],
          powerW: 420,
          energyKwh: 3.2,
          expectedKwh: 2.8,
          status: "higher",
          hasMeter: true,
          hasCircuit: true,
          alertCount: 0,
          appliances: [
            { id: "a1", name: "TV", type: "electronics", ratedPowerW: 120, powerW: 110, energyKwh: 0.8, isSimulated: true },
            { id: "a2", name: "AC Unit", type: "hvac", ratedPowerW: 1500, powerW: 310, energyKwh: 2.4, isSimulated: true },
          ],
        },
        {
          id: "r2",
          name: "Kitchen",
          type: "kitchen",
          points: [{ x: 0.5, y: 0.05 }, { x: 0.95, y: 0.05 }, { x: 0.95, y: 0.45 }, { x: 0.5, y: 0.45 }],
          powerW: 180,
          energyKwh: 1.1,
          expectedKwh: 1.2,
          status: "normal",
          hasMeter: true,
          hasCircuit: true,
          alertCount: 0,
          appliances: [
            { id: "a3", name: "Fridge", type: "kitchen", ratedPowerW: 150, powerW: 130, energyKwh: 0.9, isSimulated: true },
            { id: "a4", name: "Microwave", type: "kitchen", ratedPowerW: 1000, powerW: 0, energyKwh: 0.2, isSimulated: true },
          ],
        },
        {
          id: "r3",
          name: "Bedroom",
          type: "bedroom",
          points: [{ x: 0.05, y: 0.5 }, { x: 0.45, y: 0.5 }, { x: 0.45, y: 0.95 }, { x: 0.05, y: 0.95 }],
          powerW: 950,
          energyKwh: 4.5,
          expectedKwh: 2.0,
          status: "unusual",
          hasMeter: true,
          hasCircuit: true,
          alertCount: 1,
          appliances: [
            { id: "a5", name: "AC Unit", type: "hvac", ratedPowerW: 1800, powerW: 950, energyKwh: 4.5, isSimulated: true },
          ],
        },
        {
          id: "r4",
          name: "Bathroom",
          type: "bathroom",
          points: [{ x: 0.5, y: 0.5 }, { x: 0.95, y: 0.5 }, { x: 0.95, y: 0.95 }, { x: 0.5, y: 0.95 }],
          powerW: null,
          energyKwh: null,
          expectedKwh: null,
          status: "nodata",
          hasMeter: false,
          hasCircuit: false,
          alertCount: 0,
          appliances: [],
        },
      ],
    },
    {
      id: "f2",
      name: "First Floor",
      level: 1,
      blueprintUrl: null,
      rooms: [
        {
          id: "r5",
          name: "Office",
          type: "office",
          points: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 }],
          powerW: 2200,
          energyKwh: 8.1,
          expectedKwh: 5.0,
          status: "critical",
          hasMeter: true,
          hasCircuit: true,
          alertCount: 2,
          appliances: [
            { id: "a6", name: "Server Rack", type: "electronics", ratedPowerW: 2000, powerW: 2200, energyKwh: 8.1, isSimulated: true },
          ],
        },
      ],
    },
  ],
};

export interface DemoAlert {
  id: string;
  building_id: string;
  circuit_id: string | null;
  alert_type: string;
  severity: "Low" | "Medium" | "High";
  description: string;
  timestamp: string;
  resolution_status: "open" | "acknowledged" | "resolved";
  roomId: string | null;
  level: "room" | "circuit" | "building";
}

export const DEMO_ALERTS: DemoAlert[] = [
  { id: "al1", building_id: "bld-1", circuit_id: "c1", alert_type: "historical_baseline", severity: "Medium", description: "Bedroom consumption exceeded baseline by 150%", timestamp: "2026-10-22T10:00:00Z", resolution_status: "open", roomId: "r3", level: "room" },
  { id: "al2", building_id: "bld-1", circuit_id: null, alert_type: "fixed_threshold", severity: "High", description: "Office power exceeded critical threshold", timestamp: "2026-10-22T09:30:00Z", resolution_status: "open", roomId: "r5", level: "room" },
  { id: "al3", building_id: "bld-1", circuit_id: null, alert_type: "sudden_change", severity: "Low", description: "Unusual consumption change detected", timestamp: "2026-10-22T08:00:00Z", resolution_status: "resolved", roomId: null, level: "building" },
];

export const STATUS_META: Record<RoomStatus, { label: string; color: string; icon: string }> = {
  normal: { label: "Normal", color: "#059669", icon: "●" },
  higher: { label: "Higher than expected", color: "#b45309", icon: "▲" },
  unusual: { label: "Unusually high", color: "#ea580c", icon: "▲" },
  critical: { label: "Critical", color: "#e11d48", icon: "■" },
  nodata: { label: "No data", color: "#9ca3af", icon: "○" },
};