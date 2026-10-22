# Lattice API Contract

**Status:** Draft v0.1.0 — proposed for team approval. No backend is implemented yet; these endpoints are a specification, not live services.

This document is the single source of truth for communication between the Lattice frontend and backend. Both developers must follow it. The companion TypeScript interfaces live in `src/types/apiContract.ts`.

---

## 1. Common rules

### 1.1 Base URL and transport
- Protocol: HTTPS in production, HTTP allowed in local development.
- Base path: `/api` (all endpoints below are relative to the API base URL, e.g. `http://localhost:8000/api/health`).
- Content-Type for requests and responses: `application/json; charset=utf-8`.
- All timestamps are ISO 8601 in UTC with a trailing `Z` (e.g. `2026-10-22T03:30:00Z`). No other offset is accepted.
- Authentication/authorization: **not defined yet** (see section 7). No secrets or credentials are sent in these requests.

### 1.2 Field naming
- JSON keys use `camelCase`.
- Required fields must always be present. Optional fields may be omitted (never sent as `null` unless explicitly allowed).

### 1.3 Units
- `powerWatts`: instantaneous (real-time) power in **watts (W)**.
- `energyKwh`: energy in **kilowatt-hours (kWh)** for the reading's measurement interval (see 1.6).
- Counts are unitless integers.

### 1.4 HTTP status codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid query/body) |
| 404 | Resource not found |
| 429 | Rate limited (future) |
| 500 | Internal server error |
| 503 | Service unavailable (backend or data source down) |

### 1.5 Error response format
All non-2xx responses use this shape:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Human-readable description of the problem.",
    "details": { "field": "limit", "reason": "must be a positive integer" }
  }
}
```

- `error.code`: machine-readable, UPPER_SNAKE_CASE.
- `error.message`: human-readable.
- `error.details`: optional, structure depends on the error.

Common codes: `INVALID_QUERY`, `NOT_FOUND`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`.

### 1.6 Energy measurement period
`energyKwh` represents the energy consumed during the **measurement interval ending at `timestamp`** (interval energy), i.e. since the previous reading for that device. It is **not** a lifetime cumulative total. Cumulative/lifetime totals are out of scope for this endpoint and require team approval before being added.

### 1.7 Empty readings behavior
When no readings exist, the endpoint still returns `200 OK` with:

```json
{
  "readings": [],
  "count": 0,
  "generatedAt": "2026-10-22T03:30:05Z"
}
```

An empty array is **not** an error.

### 1.8 Simulated vs. real readings
The `source` field distinguishes origin:
- `"simulated"` — generated/synthetic data (demo, test, or no hardware connected).
- `"real"` — measured from physical hardware.

Frontends must not assume a reading is real unless `source === "real"`. Backends must never label simulated data as `"real"`.

---

## 2. Endpoints

### 2.1 `GET /api/health`

**Purpose:** Check whether the backend is running.

**Request:** no body, no query parameters.

**Response `200 OK`:**

```json
{
  "status": "ok",
  "timestamp": "2026-10-22T03:30:00Z",
  "service": "lattice-backend",
  "version": "0.1.0"
}
```

Fields:
- `status` (string, required): `"ok"` when the service is healthy.
- `timestamp` (string, required): server time in UTC ISO 8601.
- `service` (string, optional): service name.
- `version` (string, optional): deployed version.

**Errors:**
- If the service is down, the request fails at the transport level (connection refused) or returns `503` with the standard error body.

---

### 2.2 `GET /api/readings/latest`

**Purpose:** Retrieve the latest available energy readings.

**Query parameters (proposed, requires team approval — see section 7):**
- `limit` (integer, optional): max number of readings to return. Default `50`, max `500`.
- `deviceId` (string, optional): filter to a single device.

Invalid query parameters return `400 INVALID_QUERY`.

**Response `200 OK`:**

```json
{
  "readings": [
    {
      "deviceId": "device-001",
      "timestamp": "2026-10-22T03:30:00Z",
      "powerWatts": 1420,
      "energyKwh": 0.35,
      "source": "simulated"
    },
    {
      "deviceId": "device-002",
      "timestamp": "2026-10-22T03:30:00Z",
      "powerWatts": 3050,
      "energyKwh": 0.78,
      "source": "real"
    }
  ],
  "count": 2,
  "generatedAt": "2026-10-22T03:30:05Z"
}
```

Reading fields:
- `deviceId` (string, required): non-empty, max 128 chars, characters `[A-Za-z0-9._-]`.
- `timestamp` (string, required): ISO 8601 UTC with `Z`.
- `powerWatts` (number, required): finite number, `>= 0`.
- `energyKwh` (number, required): finite number, `>= 0`.
- `source` (string, required): `"simulated"` or `"real"`.

Top-level fields:
- `readings` (array, required): list of readings, most recent first.
- `count` (integer, required): number of items in `readings`.
- `generatedAt` (string, required): server time the response was generated (UTC ISO 8601).

**Errors:**
- `400 INVALID_QUERY` — invalid `limit`/`deviceId`.
- `404 NOT_FOUND` — when `deviceId` filter matches no known device.
- `500 INTERNAL_ERROR` — unexpected failure.
- `503 SERVICE_UNAVAILABLE` — data source unreachable.

---

## 3. Validation rules summary

- Strings: non-empty unless noted; trim not assumed.
- Numbers: finite (no `NaN`/`Infinity`); JSON numbers only.
- Timestamps: must parse as RFC 3339 with `Z` offset; seconds precision minimum, fractional seconds allowed.
- Enums: exact lowercase values as documented.

---

## 4. Alignment with existing frontend

The current frontend (`src/data/api/energyApi.ts`) uses a different, UI-oriented shape:
- `EnergyReading` uses `powerKw` (kW) and optional `costInr`; the contract uses `powerWatts` (W) and has no cost field.
- Frontend identifies sites via `siteId`; the contract identifies devices via `deviceId`.
- Frontend timestamps use local offsets (e.g. `+05:30`); the contract requires UTC `Z`.

These differences are intentional proposals. Resolution (conversion at the client boundary vs. changing frontend types) requires team approval. Until then, `SampleEnergyApi` continues to provide sample data and is not a real backend.

---

## 5. Integration guide

### Backend developer must implement
- HTTP server exposing `GET /api/health` and `GET /api/readings/latest`.
- JSON responses exactly matching the shapes above.
- UTC timestamps, correct units (watts, kWh).
- `source` correctly set per reading.
- Empty-state returns `200` with empty array.
- Standard error body on failures.

### Frontend developer must expect
- Fetch from the API base URL; parse `readings` array.
- Render power in watts (or convert to kW for display) and energy in kWh.
- Show source badge based on `source`.
- Handle empty readings gracefully.
- Handle 4xx/5xx via the standard error body; show user-friendly messages.

### Testing that implementations match
1. Start backend; run `curl`/`Invoke-WebRequest` against both endpoints and compare to examples.
2. Frontend: point `getEnergyApi()` at a real HTTP client and verify TypeScript types (`src/types/apiContract.ts`) compile.
3. Run `npm run typecheck` and `npm run lint` in the frontend.
4. Compare field names, units, and timestamp format byte-for-byte against this document.

### Contract changes
- Any change to paths, methods, required fields, units, or enums requires a PR updating `API_CONTRACT.md` **and** `src/types/apiContract.ts`, with both developers notified before merge.
- Additive (backward-compatible) changes may be made with a minor version bump; breaking changes require a major bump and coordinated migration.

---

## 6. Decisions still requiring team approval
1. `powerWatts` (W) vs. frontend `powerKw` (kW) — conversion location.
2. `deviceId` vs. frontend `siteId` — naming and mapping.
3. Whether to include `costInr`/cost fields in readings.
4. Optional query parameters (`limit`, `deviceId`) on `/api/readings/latest`.
5. Authentication and authorization scheme.
6. Pagination strategy for large reading sets.
7. Definition of `energyKwh` measurement interval (per-reading interval vs. cumulative).
8. Whether `generatedAt`/`count` remain required top-level fields.
9. Backend language, framework, database, and hosting.

---

## 7. Next steps
- **Backend:** scaffold a minimal HTTP service, implement the two endpoints with simulated data first, validate against this contract, then connect real hardware.
- **Frontend:** implement an HTTP-backed `EnergyApi`, adapt units/ids at the boundary, keep `SampleEnergyApi` as fallback, update `getEnergyApi()` to select implementation via env/config.
- **Both:** agree on the open decisions above before merging incompatible changes.
