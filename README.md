# Lattice — Smart Energy Monitoring (backend)

This repository contains the backend and the shared energy-reading contract for Lattice.
The frontend lives in a separate app and consumes this API.

- `packages/contracts` — shared types + Zod schemas (`@lattice/contracts`).
- `apps/api` — Fastify + SQLite backend with a deterministic development simulator.
- `docs/` — architecture, contract, API reference.

See `docs/architecture.md`, `docs/contract.md`, `docs/api.md`.

## Quick start

```bash
npm install
cp .env.example .env
npm run build
npm run dev          # http://127.0.0.1:4000
```

## Checks

```bash
npm run typecheck
npm run test
```

## License

GPL-3.0 (see LICENSE).
