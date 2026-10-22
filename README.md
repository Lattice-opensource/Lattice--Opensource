# Lattice — Smart Energy Monitoring

Web app for monitoring household and small-site energy use, backed by a Fastify +
SQLite API with a deterministic simulator.

## Stack

- Frontend: Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router v7
- Backend: Fastify 5 + SQLite (`node:sqlite`) + Zod, in `backend/`

## Run locally

Backend (http://localhost:4000):

```bash
cd backend
npm install
cp .env.example .env
npm run build
npm run dev
```

Frontend (http://localhost:5173), from the repository root:

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend environment (`.env` at the repository root):

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000` | Backend base URL |
| `VITE_USE_SAMPLE_DATA` | `false` | `true` renders the labelled sample provider instead of the API |

Set `CORS_ORIGINS` in `backend/.env` to include the frontend origin
(`http://localhost:5173` is the default).

## Scripts

Frontend: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck`, `npm run test` (Vitest), `npm run test:watch`.

Backend (inside `backend/`): `npm run dev`, `npm run build`, `npm run start`, `npm run seed`,
`npm run test`, `npm run typecheck`.

## Structure

```
src/
  main.tsx                    app entry point
  App.tsx                     routes
  index.css                   theme tokens + base styles
  components/layout/          app shell, top bar, navigation
  components/ui/              Card, Spinner, EmptyState, ErrorState
  components/dashboard/       site power chart, device list, room cards, top consumers
  pages/                      Dashboard, Devices, Rooms
  data/api/                   EnergyApi interface, HTTP client, sample client, normalisation
  data/DataSourceContext.tsx  shares the simulated/real banner state with the header
  data/getEnergyApi.ts        provider selection (sample vs HTTP)
  config/env.ts               environment configuration
  types/apiContract.ts        API contract types
```

## Data access

All energy data flows through the `EnergyApi` interface (`src/data/api/energyApi.ts`).
`getEnergyApi()` returns the HTTP client when `VITE_USE_SAMPLE_DATA=false`, otherwise the
clearly labelled sample provider. Dashboard components never import the HTTP client directly.

`httpEnergyApi` normalises the API at one boundary:

- Reads the canonical `data` array of `/api/readings/latest` (`powerW`, `energyKwh`,
  `isSimulated`, `source: "simulator" | "device" | "import"`); the legacy `readings`
  alias is only used as a fallback.
- Never sums the site meter together with appliance devices. A device that is not
  attached to a room and reports at least 90% of the appliance load is treated as the
  site meter, and its readings are used as the whole-site figure.
- Sums **interval** energy (`energyKwh`) over the local day; the cumulative
  `energyKwhTotal` register is never used for totals.

## API contract

`docs/contract.md` and `backend/packages/contracts` are the source of truth for the
backend contract; `src/types/apiContract.ts` mirrors the frontend-facing types.

## Notes

- `Lattice--Opensource/` is a separate reference repository and is git-ignored.
- The existing demo deployment (`https://lattice-energy.vercel.app/`) is reference only.
- The simulator produces **simulated** data. The UI labels it prominently and never
  presents it as a real hardware measurement.
- API v1 is read-only: there is no device control endpoint, so control-style buttons
  are rendered disabled with the reason stated.
