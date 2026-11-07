# LATTICE — Smart Energy Monitor

> **Connecting Ideas. Building Solutions.**

LATTICE is an affordable smart energy monitor for Indian homes. It shows room-by-room and appliance-by-appliance electricity usage in real time — in watts and rupees — so homeowners can finally see what is driving up their monthly bill and cut waste without guesswork.

Built as a collaboration with a school student founder (grade 8–12, no coding background). All technical decisions are made by the builder; this repo contains both the working app and the plain-English project guides.

## Live URLs (for team — use these)

**Customer site (Lattice marketing):** **https://lattice-energy.vercel.app** (also **https://lattice3.vercel.app** — same site, team domain)
**Demo inside customer site:** **https://lattice-energy.vercel.app/demo/** (also **https://lattice3.vercel.app/demo/**)
**Standalone demo app:** **https://lattice-smart-energy.vercel.app**

> `lattice.vercel.app` is taken globally, so the team uses `lattice-energy` / `lattice3`. All three URLs are public, `200 OK`, and auto-deploy on every `git push` to `main` (Vercel git connected, `lattice-marketing` Root Directory `marketing`).

## What it does

- **Live Home Assistant-style dashboard** with a real-time electricity flow map (main meter → rooms → appliances)
- **Live ₹ cost per appliance, room, and home** — usage × tariff, updated automatically
- **Home Assistant integration flow** — connect wizard that imports rooms, devices, and energy sensors
- **AI device identification** — a small model (SLM) studies usage patterns of unknown devices, verifies specs online, and the user confirms or corrects
- **Device detail pages** — 24-hour usage curve, today's kWh, cost math
- **Privacy & insights controls** — opt-in anonymized insight sharing, withdrawable at any time
- **PRO mode** — Electric Blue accent theme (demo toggle; PRO features designed for later)

> Note: live energy values are **simulated** for the demo. Real Home Assistant integration arrives in a later stage.

## Pages (demo app)

| Route | Page |
| --- | --- |
| `/welcome` | Brand landing / demo entry |
| `/` | Live dashboard (flow map, totals, energy hogs, rooms, appliances) |
| `/usage` | Usage breakdown (month comparison, weekly trend) |
| `/connect` | Home Assistant connect wizard (3 steps) |
| `/devices` | Imported devices + AI identification, confirm/correct/edit |
| `/device/:id` | Appliance detail with 24h curve and cost math |
| `/insights` | Tariff setting, anonymized-sharing consent, PRO info |

## Customer website — Lattice (marketing site)

A separate public marketing site for **Lattice** (standalone, not the demo) lives in `marketing/` (`marketing/src/App.jsx:1`). Built for individuals + enterprises with pricing. Sections: hero, stats, for individuals, for enterprises, how it works, pricing (Starter Free / Home Pro ₹99 / Family ₹249 + Enterprise), contact form, footer.

Branding: `Lattice` (not `LATTICE`), tagline `Connecting Ideas. Building Solutions.`, deep navy `#0B0F19` + magenta `#E11D48`, Inter font.

## Tech stack

- **React 18 + Vite** — fast, browser-based web apps (demo app at root + marketing site in `marketing/`)
- **Tailwind CSS** — styling with a Liquid Glass palette (deep slate navy, Lattice magenta, PRO electric blue)
- **React Router** — multi-page navigation (demo app)
- **Supabase** (planned) — free database + user accounts (no credit card)
- **Google Colab** (planned) — the SLM AI engine for appliance identification
- **Vercel** — free publishing for public URLs (two projects: demo + marketing; see Deploy)

## Run it locally

Requirements: [Node.js LTS](https://nodejs.org) (free). Use `npm.cmd` on Windows if `npm` is blocked by execution policy.

### 1. Demo app (root)

```bash
npm install          # first time only (at repo root)
npm run dev          # Vite dev server
# open http://localhost:3000
```

Production build / preview:

```bash
npm run build
npm run preview -- --host --port 3000
```

### 2. Customer website (marketing)

```bash
cd marketing
npm install          # first time only
npm run dev          # http://localhost:5173
# or
npm run build
npm run preview -- --host --port 3000   # currently hosted at http://localhost:3000 and http://localhost:5173
npm run preview -- --host --port 5173   # alternative port (both verified 200)
```

Network access: `http://192.168.88.36:3000/` / `http://192.168.88.36:5173/` on the same Wi-Fi.

To stop background preview: `Get-Process vercel,node | Stop-Process` or `Stop-Process -Id <PID>`.

## Deploy (public URL — Vercel)

Two Vercel projects from the same GitHub repo `seemperer/lattice--opensource` (team `lattice3`, owner `seemperer` — moved from `dudeling-codebot/Lattice--Opensource`; GitHub redirects old URL):

| Project | Root Directory | Local path | Public URL (auto-deploys) |
| --- | --- | --- | --- |
| `lattice-smart-energy` | `.` (repo root) | `src/App.jsx:1` | **https://lattice-smart-energy.vercel.app** |
| `lattice-marketing` | `marketing` | `marketing/src/App.jsx:1` | **https://lattice-energy.vercel.app** + **https://lattice3.vercel.app** (+ `/demo/` for embedded demo at `marketing/public/demo/`) |

Steps (one-time):

1. Vercel signup with the repo-owner email (seemperer) at https://vercel.com/signup
2. Install Vercel GitHub App: https://github.com/apps/vercel → `Only select repositories` → `lattice--opensource`
3. `vercel login` (device-code flow) → `vercel whoami` should show the owner account
4. From repo root: `vercel deploy --prod --yes`  → demo app
5. From `marketing/`: `vercel deploy --prod --yes` → marketing site
6. Set marketing root directory: `vercel project update lattice-marketing --root-directory marketing` or Dashboard → Settings → Git → Root Directory
7. Connect git (auto-deploy on push): `vercel git connect https://github.com/seemperer/lattice--opensource.git` in each project (or Dashboard → Settings → Git → Connect Git Repository) — old `dudeling-codebot/Lattice--Opensource` URL redirects but reconnect to new org for auto-deploy
8. (Optional) Reclaim clean aliases: `vercel alias set <deployment-url> lattice-smart-energy.vercel.app`

Every `git push` to `main` then auto-deploys both projects.

## Project structure

```
docs/                plain-English guides (always up to date)
  PRD.md             master guide — links to everything
  database-plan.md   what we store (Supabase) + rules
  design-guidelines.md  colors, fonts, style rules
src/
  pages/             one file per screen (demo app)
  components/        shell, cards, flow map, header
  hooks/             live energy simulation
  data/              demo data
public/              brand assets (lattice-mark.svg, brand/logo.png)
marketing/           customer website (standalone Vite + React + Tailwind)
  src/
    App.jsx          assembles Navbar, Hero, Individuals, Enterprise, HowItWorks, Pricing, Contact
    components/      one file per section + Logo.jsx
  public/brand/      copied brand assets
  vite.config.js     base: './', React plugin
  tailwind.config.js brand colors, Inter, glow
  index.html         Inter via Google Fonts, meta description
```

## Guides for non-coders

The whole project is documented in plain English inside [`docs/`](docs/PRD.md) — idea, who it's for, database plan, design guidelines. Read them or hand them to anyone.

## Status

- ✅ Stage 1–4: idea, logic, design, plan
- ✅ Stage 5: base demo app built, multi-page flow working (simulated data)
- ✅ Marketing site built in `marketing/` — hero, individuals, enterprises, pricing, contact, responsive, Inter + magenta/navy theme, verified via headless Edge and local preview on :3000/:5173
- ✅ Vercel public URLs live under `lattice3` (owner `dudeling`): `lattice-energy` + `lattice3` for marketing (SSO off, `200 OK`), `lattice-smart-energy` for demo, `.../demo/` embedded via `marketing/public/demo/` (`vite.config.js:6` `base: './'`)
- ⏳ Remaining: final UI from Google Stitch, Supabase wiring, AI engine (Colab), optional custom `.com` (e.g., `lattice.energy`), real Home Assistant integration
