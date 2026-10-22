# Architecture (v0.1)

## Summary

Lattice's backend is a small TypeScript monorepo with two packages:

- `packages/contracts` — the **shared energy-reading contract**: pure TypeScript types
  (importable by the frontend with zero runtime cost) plus Zod schemas for validation.
- `apps/api` — the **HTTP API**: Fastify + SQLite, with a deterministic simulator as the
  development data source.

There is no authentication, no AI, no hardware integration, and no container/queue
infrastructure at this stage. Those are explicitly deferred (see "Out of scope").

## Why these technologies

| Concern | Choice | Reason |
|---|---|---|
| Language | TypeScript (Node 24 LTS) | Shared language with the Vite/React frontend; types can be shared verbatim. |
| HTTP | Fastify 5 | JSON-first, schema-friendly, fast; simpler than Express + middleware glue. |
| Validation | Zod 4 | One source of truth: the same schemas validate API input and describe the contract. |
| Database | SQLite (built-in `node:sqlite`) | See "Database decision" below. |
| Dev runner | tsx | No compile step in dev; fast restarts. |
| Tests | Vitest | Fast, native ESM/TS. |

## Database decision: why SQLite, why now

Readings are an append-only time series and the product's value (trends, per-room
rollups, "today so far", "this week vs last week") requires history that:

1. survives a process restart, and
2. can be aggregated (SUM/AVG/GROUP BY) without pulling everything into memory.

An in-memory array fails both; a JSON file fails (2). Postgres/Docker is rejected as
unnecessary infrastructure at this stage (no ops, no credentials, no second process).
SQLite gives real persistence + SQL aggregation with zero ops, no server, and no
credentials — and `node:sqlite` (Node 24) ships built in, so there is no native
compile step on Windows.

All SQL lives behind a thin repository layer (`apps/api/src/db/repositories/*`) so a
later move to Postgres is a driver + config change, not a rewrite. The DB path is
configured via `DATABASE_PATH`.

## Development data source

A deterministic seeded simulator (`apps/api/src/services/simulator.ts`):

- Fixed device profiles (8 devices across 5 rooms) with time-of-day on/off patterns.
- Seeded PRNG so responses are stable across restarts (important for frontend
  caching and screenshots).
- ~24 h of 15-minute history at startup + a live writer that appends a fresh reading
  every 10 s so `/api/readings/latest` is always < 30 s old.
- Retention pruning keeps the live table bounded.
- **Every seeded row is `isSimulated: true`, `source: 'simulator'`.** The API never
  presents sample data as real sensor data; `/api/config` and summary responses
  carry an explicit notice and simulated/real counts.

## Out of scope (deferred)

- Authentication / user accounts (only an optional deployment shared key exists).
- AI device identification, alerts engine, device confirmation flow.
- Hardware / Home Assistant / MQTT integrations.
- Multi-site management beyond a single default site (`site_home_01`).
- Costing anchored to a real billing period (v1 costs are window-local).
- TOU tariffs (slab + flat only in v1).
- Server-Sent Events / WebSockets (polling only).

## Request flow

```
HTTP -> Fastify (CORS, optional x-api-key, request id)
     -> route (Zod validation -> 400 on failure)
     -> repository (SQL)
     -> service (simulator / aggregate / summary / cost)
     -> JSON envelope { data, meta: { serverTime, ... } }
```

Errors use a single envelope: `{ error: { code, message, details?, requestId } }`.
No stack traces or secrets are ever returned.
