# Shared energy-reading contract (v1)

Agreed between the backend/data-architecture developer and the frontend developer.
Source of truth lives in `packages/contracts` (`src/types.ts` + `src/schema/index.ts`).
Both sides import from `@lattice/contracts` (types) and `@lattice/contracts/schema` (Zod).

## Negotiation outcome (summary)

| Decision | Outcome |
|---|---|
| D1 field naming (camelCase) | Agreed |
| D2 ISO-8601 UTC timestamps | Agreed |
| D3 `powerW` watts, >=0, 2dp | Agreed |
| D4 energy semantics | **Changed**: ship BOTH `energyKwh` (interval delta) and `energyKwhTotal` (monotonic register), plus `intervalStart`/`intervalSeconds` |
| D5 `isSimulated` + `source` | Agreed |
| D6 core endpoints | Agreed + additions (see below) |
| D7 pagination | Agreed: `limit`/`offset` + `meta.total`/`meta.hasMore` (max 1000) |
| D8 device->room join | Agreed: frontend joins `/api/devices`; readings stay lean |
| D9 tariff / cost | **Changed**: structured slab tariff per site + server-computed `costInr` (single implementation, no drift) |
| D10 live updates | Agreed: polling `/api/readings/latest` (5 s). Server guarantees a reading < 30 s old. |
| D11 multi-site | **Changed**: `siteId` everywhere + `GET /api/sites` (single default site in v1) |
| D12 bucketing | **Changed**: server-side `GET /api/readings/aggregate` |

Frontend requests that were **deferred to v2** (with reasons):

- `GET /api/alerts` and `PATCH /api/devices/:id` (confirm detected device) — require an
  alert engine and the AI identification flow, both out of scope.
- `alertLevel` on Device — depends on the alerts engine.
- TOU tariffs — slab + flat only in v1.
- Billing-period-anchored costing — v1 costs are window-local.

## Domain types

### Site
```json
{ "id":"site_home_01","name":"Lattice Home","timezone":"Asia/Kolkata","currency":"INR",
  "createdAt":"...","updatedAt":"..." }
```

### Room
```json
{ "id":"room_bed_01","siteId":"site_home_01","name":"Bedroom","createdAt":"...","updatedAt":"..." }
```

### Device
```json
{ "id":"dev_bed_ac_01","siteId":"site_home_01","roomId":"room_bed_01","roomName":"Bedroom",
  "name":"Bedroom AC","category":"hvac","model":"Voltas 1.5T Inverter","ratedPowerW":1500,
  "status":"online","lastSeenAt":"2026-10-22T12:00:00.000Z","isSimulated":true,
  "installedAt":"2026-05-01T00:00:00.000Z","createdAt":"...","updatedAt":"..." }
```
`category`: `hvac|lighting|kitchen|electronics|appliance|ev|other`.
`status`: `online|offline|stale|unknown`. `stale` is derived by the server when
`lastSeenAt` is older than `staleAfterSeconds` (default 1800 s).

### Reading
```json
{ "id":"r_...","deviceId":"dev_bed_ac_01","timestamp":"2026-10-22T12:00:00.000Z",
  "intervalStart":"2026-10-22T11:45:00.000Z","intervalSeconds":900,
  "powerW":1100.5,"energyKwh":0.275,"energyKwhTotal":15.36,
  "voltageV":230.4,"currentA":4.78,"isSimulated":true,"source":"simulator" }
```
- `timestamp` = end of the sampling interval.
- `energyKwh` = energy consumed during the interval (null when not applicable).
- `energyKwhTotal` = monotonically non-decreasing lifetime register (null when not applicable).

## Envelopes

Every response:
```json
{ "data": <payload>, "meta": { "serverTime": "<ISO>", "total": 0, "limit": 200, "offset": 0, "hasMore": false } }
```
Errors:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{"path":"...","message":"..."}], "requestId": "..." } }
```

## Endpoints (v1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness + DB status |
| GET | `/api/sites` | List sites |
| GET | `/api/sites/:siteId` | Single site |
| GET | `/api/rooms?siteId=` | Rooms |
| GET | `/api/devices?siteId=&roomId=` | Devices |
| GET | `/api/devices/:deviceId` | Single device |
| GET | `/api/readings?deviceId=&roomId=&siteId=&from=&to=&limit=&offset=&order=` | Raw readings |
| GET | `/api/readings/latest?siteId=&deviceId=` | Latest reading per device |
| GET | `/api/readings/summary?siteId=&from=&to=` | Window totals + per-device/per-room + dataQuality |
| GET | `/api/readings/aggregate?siteId=&roomId=&deviceId=&from=&to=&bucket=&groupBy=` | Bucketed series |
| GET | `/api/config?siteId=` | Currency, timezone, tariff, dataSource, staleAfterSeconds |
| POST | `/api/dev/seed` / `/api/dev/reset` | Dev-only reseed (disabled in production) |

`bucket`: `15m|hour|day|week`. `groupBy`: `device|room|site`. Bucket boundaries are in the **site timezone**.

## Simulated vs real data

- `isSimulated` is present on every Reading and Device.
- `/api/config.dataSource.simulated` is `true` for the seeded development data, with a human-readable `notice`.
- Summary and aggregate responses include simulated/real counts (`dataQuality`).
- **The frontend must surface a "Simulated" badge and a global banner whenever `isSimulated` / `dataSource.simulated` is true. Sample data must never be presented as real sensor data.**
- Mixed real+simulated rows in one device are not produced in v1 (a device is either simulated or real); `/api/readings/latest` returns the latest reading per device regardless of source.
- A real device has `source: 'device'` and `isSimulated: false`.

## Live updates

No push transport in v1. Poll `GET /api/readings/latest` (suggested 5 s). The simulator guarantees a reading younger than 30 s, so the "live" UI moves.

## Canonical response schema for `/api/readings/latest`

`readings` is the **canonical** array. `data` and `meta` are retained for backward
compatibility with earlier backend clients but new code should read `readings`,
`count`, and `generatedAt`.

Field naming: wire format uses `powerWatts` (watts) and `source: "simulated"|"real"`.
The richer internal fields (`powerW`, `isSimulated`, `source: "simulator"|"device"|"import"`,
`energyKwhTotal`, ...) are retained as additive fields on each reading.

## Frontend connection

Base URL: `http://localhost:8000` in dev (configurable). All endpoints are under `/api`.
Set `CORS_ORIGINS` to include the frontend origin (e.g. `http://localhost:5173`).

```ts
// Example
const res = await fetch(`${API_BASE}/api/readings/latest`);
const { data, meta } = await res.json();
// data: Reading[]
```

Use `import type { Device, Reading } from '@lattice/contracts'` (type-only, zero runtime cost).
Use `@lattice/contracts/schema` only if you want runtime validation (pulls in zod).
