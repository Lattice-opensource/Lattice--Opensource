# API reference (v1)

See `docs/contract.md` for the shared types and `docs/architecture.md` for decisions.

## Running the backend

Prerequisites: **Node.js >= 24** (LTS). No other services required.

```bash
# from repo root
cp .env.example .env          # edit as needed
npm install
npm run build                 # compile TS + copy schema.sql
npm run seed                  # optional: (re)seed the DB (also runs on first start)
npm run dev                   # tsx watch, http://127.0.0.1:4000
```

Production-style run:
```bash
npm run build
NODE_ENV=production npm start
```

Checks:
```bash
npm run typecheck
npm run test
```

## Environment variables

See `.env.example`. Key ones:

| Var | Default | Notes |
|---|---|---|
| `PORT` | 4000 | |
| `HOST` | 127.0.0.1 | |
| `DATABASE_PATH` | `<repo>/data/lattice.db` | SQLite file |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated |
| `API_KEY` | (unset) | Optional shared key; sent as `x-api-key` |
| `SIMULATION_ENABLED` | true (dev) | Turns the simulator on/off |
| `SIMULATION_HISTORY_HOURS` | 24 | Backfill window |
| `SIMULATION_LIVE_INTERVAL_SECONDS` | 10 | Live writer cadence |
| `SEED_ON_START` | true | Seed when DB is empty |
| `ENABLE_DEV_ENDPOINTS` | true (dev) | `/api/dev/*` |
| `STALE_AFTER_SECONDS` | 1800 | Device staleness threshold |

Secrets (only `API_KEY`) are read from the environment and are never logged or returned.
`/api/health` and error responses never include credentials or file paths.

## Example responses

### `GET /api/health`
```json
{ "status":"ok","version":"0.1.0","uptimeSeconds":12.3,"time":"2026-10-22T12:00:00.000Z","database":"up" }
```

### `GET /api/devices`
```json
{ "data":[{"id":"dev_bed_ac_01","siteId":"site_home_01","roomId":"room_bed_01","roomName":"Bedroom",
  "name":"Bedroom AC","category":"hvac","model":"Voltas 1.5T Inverter","ratedPowerW":1500,
  "status":"online","lastSeenAt":"2026-10-22T12:00:00.000Z","isSimulated":true,
  "installedAt":"2026-05-01T00:00:00.000Z","createdAt":"...","updatedAt":"..."}],
  "meta":{"serverTime":"...","total":8} }
```

### `GET /api/readings?limit=2`
```json
{ "data":[{"id":"r_...","deviceId":"dev_bed_ac_01","timestamp":"2026-10-22T11:45:00.000Z",
  "intervalStart":"2026-10-22T11:30:00.000Z","intervalSeconds":900,"powerW":12,
  "energyKwh":0.003,"energyKwhTotal":15.36,"voltageV":230,"currentA":0.052,
  "isSimulated":true,"source":"simulator"}],
  "meta":{"serverTime":"...","total":17280,"limit":2,"offset":0,"hasMore":true} }
```

### `GET /api/readings/latest`
```json
{ "data":[{"id":"r_...","deviceId":"dev_bed_ac_01","timestamp":"2026-10-22T12:00:10.000Z",
  "intervalStart":"2026-10-22T12:00:00.000Z","intervalSeconds":10,"powerW":12,
  "energyKwh":0.000033,"energyKwhTotal":15.36,"voltageV":230.8,"currentA":0.052,
  "isSimulated":true,"source":"simulator"}],
  "meta":{"serverTime":"...","total":8} }
```

### `GET /api/config`
```json
{ "data":{"siteId":"site_home_01","currency":"INR","timezone":"Asia/Kolkata",
  "tariff":{"type":"slab","unit":"kWh","slabs":[{"upToKwh":100,"rateInrPerKwh":2.5},
    {"upToKwh":400,"rateInrPerKwh":5.5},{"upToKwh":null,"rateInrPerKwh":7.5}]},
  "staleAfterSeconds":1800,
  "dataSource":{"mode":"simulated","simulated":true,
    "notice":"All readings are SIMULATED development data. They are not real sensor measurements."}},
  "meta":{"serverTime":"..."} }
```

### Error example
```json
{ "error":{"code":"NOT_FOUND","message":"Unknown device: dev_nope","requestId":"..."} }
```

## How the frontend connects

1. Set `CORS_ORIGINS` to include the frontend dev URL (default already includes `http://localhost:5173`).
2. `fetch('http://localhost:4000/api/readings/latest')`.
3. Use `import type { Device, Reading } from '@lattice/contracts'` (type-only).
4. Show a "Simulated" badge whenever `isSimulated` / `dataSource.simulated` is true.
5. Poll `/api/readings/latest` every ~5 s for "live" tiles.
6. Use `/api/readings/aggregate` for trend charts and `/api/readings/summary` for "today so far".

## Notes for production

- Set `NODE_ENV=production` to disable dev endpoints and (by default) the simulator.
- Set `API_KEY` if you want a shared-key guard on `/api/*`.
- The SQLite file is the only state; back it up.
- No credentials are stored by this backend in v1.
