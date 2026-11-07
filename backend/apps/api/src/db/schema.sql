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

CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_buildings_site ON buildings(site_id);

CREATE TABLE IF NOT EXISTS floors (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id);

CREATE TABLE IF NOT EXISTS circuits (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  building_id TEXT REFERENCES buildings(id) ON DELETE SET NULL,
  floor_id TEXT REFERENCES floors(id) ON DELETE SET NULL,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_circuits_site ON circuits(site_id);
CREATE INDEX IF NOT EXISTS idx_circuits_room ON circuits(room_id);

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

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
  building_id TEXT REFERENCES buildings(id) ON DELETE SET NULL,
  floor_id TEXT REFERENCES floors(id) ON DELETE SET NULL,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  circuit_id TEXT REFERENCES circuits(id) ON DELETE SET NULL,
  device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  title TEXT NOT NULL,
  observed_value REAL,
  expected_value REAL,
  additional_cost_inr REAL,
  explanation TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  acknowledged_at TEXT,
  resolved_at TEXT,
  dedup_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_site ON alerts(site_id);
CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_dedup_active ON alerts(dedup_key) WHERE status IN ('active','acknowledged');
