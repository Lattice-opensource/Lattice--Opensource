# Real Hardware Integration — Proposed Architecture (v0, not implemented)

> Status: **Proposal only.** No hardware is connected. Simulated and real readings are
> kept strictly separate. Do not claim hardware integration is complete.

## 1. Goal
Allow a physical energy meter / sensor to feed real readings into the existing
`/api/readings` pipeline so that `source: "real"` readings coexist with
`source: "simulated"` ones, and the frontend can distinguish them via `source`
and `isSimulated`.

## 2. Candidate device protocols
- **Modbus RTU/TCP** (most common for smart meters, CT clamps, industrial meters).
- **MQTT** (lightweight, good for ESP32/ESP8266-based sensors and gateways).
- **HTTP/REST polling** (some Wi-Fi meters expose a JSON endpoint).
- **Serial/RS-485** via a gateway.
- **Home Assistant** (the demo mentions HA integration; HA can expose a REST/MQTT API).

Selection requires team decision; no device or paid service is purchased here.

## 3. Proposed ingestion architecture
```
[Physical meter/sensor]
   | (Modbus/MQTT/HTTP)
   v
[Edge gateway / collector service]   (new, separate process, NOT the API)
   | normalizes to the Lattice reading shape
   | sets source="device", isSimulated=false
   v
[Ingestion endpoint on the API]  POST /api/ingest/readings
   | validates with the same Zod schemas
   | writes via the repository layer (same SQLite)
   v
[Existing /api/readings/* endpoints serve both simulated & real]
```

The collector is a separate process so that hardware I/O never blocks the API and
can be restarted independently.

## 4. Ingestion endpoint (proposed, not implemented)
`POST /api/ingest/readings`
```json
{
  "deviceId": "meter-001",
  "timestamp": "2026-10-22T12:00:00.000Z",
  "powerWatts": 1420,
  "energyKwh": 0.35,
  "voltageV": 230.4,
  "currentA": 6.17
}
```
- Authentication: shared device token via `Authorization: Bearer <device-token>` or
  `x-device-key` header (separate from the optional human `API_KEY`). Device tokens
  stored hashed in a new `devices`/`device_credentials` table.
- Timestamps: ISO-8601 UTC with `Z` (device clock must be NTP-synced; reject
  timestamps older than a configurable window to prevent replay).
- Units: watts (W) and kWh, matching the contract. The collector converts
  device-native units (e.g. W, VA, Wh) before ingestion.
- Idempotency: `(deviceId, timestamp)` unique constraint (already in schema).
- `source` set server-side to `"device"`; clients cannot set `source="real"`.

## 5. Required device metadata
Extend `devices` table with (proposed):
- `protocol` (modbus/mqtt/http/serial)
- `connection` (host/port/topic)
- `pollIntervalSeconds`
- `lastIngestedAt`
- `status` derived from `lastIngestedAt` staleness.

## 6. Separation of simulated vs real
- `isSimulated` boolean + `source` enum (`simulator`/`device`/`import`) already
  distinguish origin.
- A device is either simulated or real; mixing within one device is not allowed in v1.
- Aggregates and summaries report simulated vs real counts (`dataQuality`).
- The frontend must show a "Simulated" badge whenever `isSimulated`/`source==="simulated"`.
- Simulator can be disabled (`SIMULATION_ENABLED=false`) in production so only
  real readings are served.

## 7. Open decisions (team approval required)
- Device model and protocol selection.
- Polling vs push (MQTT subscribe).
- Device authentication scheme and token rotation.
- Whether to store raw device payloads for debugging.
- Calibration / CT-ratio configuration.
- Billing-period-anchored costing (currently window-local).

## 8. What is NOT done
- No hardware driver, collector, or ingestion endpoint is implemented.
- No device credentials or pairing flow.
- No changes to the simulator (it remains the dev data source).
