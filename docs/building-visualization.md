# Lattice Building Visualization — Documentation

> Module: `backend/apps/api/src/modules/building-visualization/` (backend) and
> `src/features/building-visualization/` (frontend). Isolated; communicates with the
> rest of Lattice OS only via HTTP REST and the shared energy-reading contract.

## 1. Module architecture
- **Backend**: TypeScript/Fastify module under `backend/apps/api/src/modules/building-visualization/`.
  - `models/types.ts` — entity interfaces (Building, Floor, RoomVisualization, Appliance, Circuit, Meter, Blueprint).
  - `repositories/*.ts` — data access (buildings, floors, meters, circuits, appliances, blueprints, rooms, energy-readings).
  - `services/energyAggregator.ts` — aggregation (room/floor/building/appliance, historical trend).
  - `services/alertProxy.ts` — proxies Alert Engine (HTTP) and associates alerts to rooms/circuits/buildings.
  - `routes/*.ts` — thin HTTP handlers (buildings, floors, rooms, appliances, meters, circuits, blueprints, energy, alerts).
  - `config/index.ts` — module config (max blueprint bytes, allowed MIME types).
  - `seed-demo.ts` — idempotent demo data seeder.
- **Frontend**: `src/features/building-visualization/` — `BuildingPage` (editor), `BuildingDashboardPage` (dashboard), `BlueprintViewer`, `ApplianceManager`, `RoomEnergyChart`, `sampleData.ts`, `data/buildingApi.ts`.
- **Database**: new tables in the shared Lattice OS SQLite DB (additive, `CREATE TABLE IF NOT EXISTS` + ALTER migrations).

## 2. Installation and configuration
Part of the Lattice OS backend/frontend. No separate install. Backend: Node ≥24. Frontend: Vite. Alert Engine (optional) on port 8010.

Environment:
- `PORT` (backend, default 8000), `DATABASE_PATH`, `CORS_ORIGINS`, `ALERT_ENGINE_URL` (default http://localhost:8010), `API_KEY` (optional).

## 3. Database models and migrations
Tables: `buildings`, `floors`, `meters`, `circuits`, `appliances`, `blueprints`, `energy_readings`. `rooms` extended with `building_id`, `floor_id`, `circuit_id`, `x`, `y`, `width`, `height`, `boundary`, `area_sqm`, `room_type`. `devices` extended with `appliance_id`. Migrations run as idempotent `ALTER TABLE ... ADD COLUMN` (wrapped in try/catch) in `db/index.ts`.

## 4. Blueprint upload and storage
- Endpoint: `POST /api/floors/:floorId/blueprint` (multipart, field `file`).
- Allowed types: PDF, PNG, JPEG. Validated by MIME + magic bytes. Max 10 MB.
- Stored under `data/blueprints/` (gitignored). Original preserved.
- Metadata + dimensions (PNG/JPEG parsed; PDF dimensions null, rasterization future work).
- Serve: `GET /api/blueprints/:id/file` (inline). Delete: `DELETE /api/blueprints/:id`. List: `GET /api/floors/:floorId/blueprints`.

## 5. Room boundary mapping
- Manual only. Rooms store `x, y, width, height, boundary` (JSON polygon), `area_sqm`, `room_type`.
- Normalized coordinates (0–1 relative to blueprint) so zoom/resize don't break positions.
- Editor: `BlueprintViewer` (zoom/pan, polygon drawing, double-click to close). Room positions persisted via `PUT /api/rooms/:id`.

## 6. Appliance registration
- Categories: air_conditioner, refrigerator, lighting, television, computer, water_heater, washing_machine, kitchen_equipment, other.
- Fields: name, type, manufacturer, model, rated_power_w, monitoring_method, status, position_x/y, room_id, circuit_id, device_id.
- Monitoring methods: none, device, circuit, room, smart_plug, manual, estimated.
- Rated power is NOT measured consumption; displayed separately.

## 7. Meter and circuit mapping
- Meters: site-scoped, type, unit, data_source.
- Circuits: floor-scoped, meter-linked.
- Rooms/appliances can be assigned to circuits. Appliances can be linked to devices (individual monitoring).

## 8. Energy data format
- `energy_readings` table: entity_type (building/floor/room/circuit/meter/appliance/device), entity_id, timestamp (UTC), power_w, energy_kwh, measurement_source (measured/estimated/simulated), is_simulated.
- Aggregation prefers highest granularity (building→floor→room→circuit) to avoid double-counting. Appliance consumption only when individually monitored.
- Missing readings → `hasData: false`, null power.

## 9. API endpoints
See `docs/building-visualization-api.md` for full reference.

## 10. Alert Engine integration
- Backend proxies: `GET /api/buildings/:id/alerts` → calls Alert Engine `GET /alerts?building=...`, associates to rooms/circuits/buildings.
- Graceful fallback if Alert Engine unavailable (`available: false`).
- Frontend polls every 15s and on floor change. Click alert → select room.
- Alerts described as "unusual consumption patterns", never as electrical faults.

## 11. Demo data setup
- `seed-demo.ts` (run via `npx tsx`) inserts a demo building with 2 floors, 5 rooms, 7 appliances, circuits, meter, 24h energy readings, and documents example alerts.
- Idempotent (skips if demo building exists). Does not overwrite user data.
- Blueprint SVGs: `public/demo/floor1.svg`, `floor2.svg`.
- Frontend `sampleData.ts` labeled "Demo data only".

## 12. How to run tests
- Backend: `cd backend && npm test` (Vitest). Note: environment-dependent (OneDrive cloud file provider).
- Typecheck: `npm run typecheck`.
- Frontend: `npm run typecheck && npm run build`.

## 13. Known limitations
- No per-user authorization (relies on global API_KEY).
- PDF rasterization not implemented (original served).
- No automated tests for blueprint upload endpoint or energy aggregation (repository-level only).
- No appliance markers on floor plan yet (position fields exist).
- No undo/redo in editor.
- SQLite single-file, not for high-concurrency production.

## 14. Future IoT hardware integration
- Ingestion via `POST /api/energy-readings` with `entityType`/`entityId` and `measurementSource`.
- Appliance monitoring methods: `device` (individual meter), `smart_plug`, `circuit` (shared), `room` (room-level), `manual`, `estimated`, `none`.
- Rated power is stored separately from measured consumption; never calculate appliance consumption from shared circuit without reliable measurement.
- Source/confidence clearly identified via `measurementSource` and `isSimulated`.
- Real hardware integration should follow the Alert Engine's hardware-integration proposal (Modbus/MQTT/HTTP collector, local key, encrypted protocol).