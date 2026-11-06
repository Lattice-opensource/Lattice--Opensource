export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface RoomPolygon {
  id: string;
  name: string;
  type: string;
  points: NormalizedPoint[];
  status?: "normal" | "higher" | "unusual" | "critical" | "nodata";
  color?: string;
  powerW?: number | null;
  alertCount?: number;
}

export interface Building {
  id: string;
  siteId: string;
  name: string;
  floorCount: number;
}

export interface Floor {
  id: string;
  buildingId: string;
  level: number;
  name: string;
  blueprintUrl: string | null;
}