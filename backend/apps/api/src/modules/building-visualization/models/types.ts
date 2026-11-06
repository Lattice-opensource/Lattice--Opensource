// Shared TypeScript types for the Lattice Building Visualization module.

export interface Building {
  id: string;
  siteId: string;
  name: string;
  address: string | null;
  description: string | null;
  floorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  level: number;
  name: string;
  blueprintRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomVisualization {
  id: string;
  siteId: string;
  name: string;
  buildingId: string | null;
  floorId: string | null;
  circuitId: string | null;
  // position/dimensions on floor plan (nullable)
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  boundary: string | null; // JSON-encoded polygon coordinates
  areaSqm: number | null;
  roomType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Appliance {
  id: string;
  roomId: string | null;
  circuitId: string | null;
  name: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  ratedPowerW: number | null;
  monitoringMethod: 'none' | 'device' | 'circuit' | 'room';
  status: 'unknown' | 'online' | 'offline' | 'stale';
  createdAt: string;
  updatedAt: string;
}

export interface Circuit {
  id: string;
  name: string;
  floorId: string | null;
  meterId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Meter {
  id: string;
  siteId: string;
  name: string;
  type: string;
  unit: string;
  dataSource: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Blueprint {
  id: string;
  floorId: string;
  storagePath: string;
  mimeType: string | null;
  uploadedAt: string;
}
