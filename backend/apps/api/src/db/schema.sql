-- Lattice v1 schema (SQLite). ISO-8601 UTC strings throughout.

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  currency TEXT NOT NULL,
  tariff_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rooms_site ON rooms(site_id);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  model TEXT,
  rated_power_w REAL,
  status TEXT NOT NULL DEFAULT 'online',
  last_seen_at TEXT,
  is_simulated INTEGER NOT NULL DEFAULT 0,
  installed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_devices_site ON devices(site_id);
CREATE INDEX IF NOT EXISTS idx_devices_room ON devices(room_id);

CREATE TABLE IF NOT EXISTS readings (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  interval_start TEXT NOT NULL,
  interval_seconds INTEGER NOT NULL,
  power_w REAL NOT NULL,
  energy_kwh REAL,
  energy_kwh_total REAL,
  voltage_v REAL,
  current_a REAL,
  is_simulated INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'device',
  UNIQUE (device_id, timestamp)
);
CREATE INDEX IF NOT EXISTS idx_readings_device_ts ON readings(device_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_readings_ts ON readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_readings_sim ON readings(is_simulated);

-- Lattice Building Visualization tables (additive, idempotent)

CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  floor_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_buildings_site ON buildings(site_id);

CREATE TABLE IF NOT EXISTS floors (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  blueprint_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id);

CREATE TABLE IF NOT EXISTS meters (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'electricity',
  unit TEXT NOT NULL DEFAULT 'kWh',
  data_source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meters_site ON meters(site_id);

CREATE TABLE IF NOT EXISTS circuits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  floor_id TEXT REFERENCES floors(id) ON DELETE SET NULL,
  meter_id TEXT REFERENCES meters(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_circuits_floor ON circuits(floor_id);
CREATE INDEX IF NOT EXISTS idx_circuits_meter ON circuits(meter_id);

CREATE TABLE IF NOT EXISTS appliances (
  id TEXT PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  circuit_id TEXT REFERENCES circuits(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  manufacturer TEXT,
  model TEXT,
  rated_power_w REAL,
  device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
  position_x REAL,
  position_y REAL,
  monitoring_method TEXT NOT NULL DEFAULT 'none',
  status TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appliances_room ON appliances(room_id);
CREATE INDEX IF NOT EXISTS idx_appliances_circuit ON appliances(circuit_id);

CREATE TABLE IF NOT EXISTS blueprints (
  id TEXT PRIMARY KEY,
  floor_id TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  uploaded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blueprints_floor ON blueprints(floor_id);
-- Energy integration layer (Building Visualization)

CREATE TABLE IF NOT EXISTS energy_readings (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  power_w REAL,
  energy_kwh REAL,
  measurement_source TEXT NOT NULL DEFAULT 'measured',
  is_simulated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_energy_readings_entity ON energy_readings(entity_type, entity_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_energy_readings_ts ON energy_readings(timestamp);