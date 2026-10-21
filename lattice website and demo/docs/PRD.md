# PRD — LATTICE Smart Energy Monitor

Master guide & build plan. Everything in `docs/` links back to here.

## 1. The Idea
An affordable smart energy monitor for Indian homes under the **LATTICE** brand. It connects to Home Assistant to import rooms, devices, and live energy sensors. It uses an AI model (SLM) to identify unknown devices from usage patterns and verify specifications online. It displays room-by-room and appliance-by-appliance electricity usage in real time (in ₹ and kWh) so homeowners can eliminate energy waste without guesswork.

## 2. Who It Is For
Middle-class Indian homeowners (e.g. in Bengaluru) who pay ₹3,000–₹10,000+ monthly electricity bills, own 2–4 ACs/coolers, and want to lower costs by identifying which room or appliance is the true energy hog.

## 3. The Main Action
A Home Assistant-style live dashboard: a big "₹ today" number, a live device list with **on/off switches**, a 24-hour usage curve, room totals, and the month's top energy hogs.

## 4. Screens Planned
1. **Live Dashboard (Home):** "₹ today" hero + live watts, 24-hour usage curve, device list with on/off toggles, room totals, top energy hogs.
2. **Home Assistant Connect & Import:** One-click integration screen to import rooms, devices, and smart meter sensors automatically.
3. **AI Appliance Identification & Verification:** Screen showing AI-identified appliances (from usage patterns), online spec verification (star ratings, wattage), user confirmation/correction, and manual addition fallback.
4. **Room & Appliance Detail:** Detailed view for any room or device showing operating hours, live wattage, monthly ₹ cost, historical trends, and an on/off toggle.
5. **Insights & Consent Settings:** Anonymized data-sharing toggle (for Pro features / insights), tariff setting, and privacy controls.

## 5. Saved Information (Database)
YES — uses **Supabase** (free, no credit card required) for user accounts, homes, rooms, appliances, AI identification logs, live readings, and privacy consent.
👉 Full database guide: [database-plan.md](database-plan.md)

## 6. Look and Feel (Style)
- **Brand:** LATTICE (*"Connecting Ideas. Building Solutions."*) — official logo in the top bar and welcome screen.
- **Style:** Minimalist, Raycast-inspired. Calm surfaces, quiet borders, compact type, one strong accent.
- **Mood:** Precise, Effortless, Professional, Smooth, Calm — zero fluff or meaningless graphs.
- **Themes:** Dark (default) and Light, switchable in the top bar.
- **Palette:** near-black `#141416` / off-white `#FAFAFB` backgrounds, LATTICE magenta accent, **Electric Blue exclusively for PRO accounts**.
👉 Full design guide: [design-guidelines.md](design-guidelines.md)

## 7. Build Strategy
- **Web App:** Works on all browsers, desktops, tablets, and phones.
- **Tech Stack:** React / Vite + Tailwind CSS + Lucide Icons (frontend); **Python for all backend scripts** (Home Assistant bridge, SLM AI identification, cost/usage calculations); Supabase (database) + Simulated Home Assistant API for demo.
- **Backend language (planned, not in demo):** Python only — no Node/JS backend scripts. Demo remains frontend-only with simulated data.
- **Publishing:** Vercel (free live URL via `npx vercel`).