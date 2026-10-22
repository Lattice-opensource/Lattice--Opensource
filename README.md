# Lattice Frontend

Smart energy monitoring web app. New frontend-only foundation; no backend yet.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- React Router v7

Chosen to match the existing Lattice demo (`https://lattice-energy.vercel.app/`) which uses React + Vite + Tailwind. No backend is wired; data access goes through the `EnergyApi` interface in `src/data/api/energyApi.ts`, currently backed by clearly labeled sample data.

## Setup

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build
- `npm run preview` — preview production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check

## Structure

```
src/
  main.tsx                  app entry point
  App.tsx                   routes
  index.css                 global styles + theme tokens
  components/layout/        shared layout shell, nav, top bar
  components/ui/            reusable UI primitives (Card, Spinner, EmptyState, ErrorState)
  components/dashboard/     dashboard-specific components
  pages/                    route pages
  data/api/                 data-access interface + sample implementation
  data/sample/              clearly labeled sample data
  data/getEnergyApi.ts      provider (swap implementation here)
  config/env.ts             environment configuration
  types/apiContract.ts      proposed API contract types
```

## Outstanding issues / next steps

- API contract v0.1.0 only exposes `/api/health` and `/api/readings/latest`; site summaries, cost and device/circuit grouping need contract additions (team approval).
- HTTP-backed `EnergyApi` implementation is not yet provided; sample provider remains default.
- No test framework is configured; add tests when a runner is agreed.
- Dashboard chart is a minimal SVG implementation; replace with a chart library if needed.

## Data access

All energy data is accessed via `EnergyApi`. Backend field names must be agreed with the backend developer before replacing `SampleEnergyApi` with a real client. Update `getEnergyApi()` to return the real implementation.

## API contract

`API_CONTRACT.md` (repo root) and `src/types/apiContract.ts` define the proposed frontend/backend contract (UTC timestamps, watts, `deviceId`, `source`). Differences from the UI-oriented `EnergyApi` types are documented in contract section 4 and require team approval before integration.

## Notes

- `Lattice--Opensource/` is a separate reference repository and is git-ignored.
- The existing demo deployment is reference only and is not modified.
