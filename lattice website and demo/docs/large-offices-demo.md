# Large Offices Demo — LATTICE Enterprise

> Companion to `PRD.md:1` and `marketing/src/components/Enterprise.jsx:1`. Plain-English spec for a **simulated demo** of LATTICE for large offices (500–2000 employees, 11 floors, 70k sq ft, single building or campus).

## 1. Goal
Show a facilities/operations manager, CFO, and sustainability lead **in 60 seconds** where electricity money is going in their office and what to fix tomorrow — without installing anything. All values are **simulated** (like the home demo at `src/pages/Dashboard.jsx:1`), BMS/Home Assistant integration comes later.

**Demo URL:** `https://lattice-energy.vercel.app/office` (new) alongside existing `/demo/` `README.md:12`

---

## 2. Demo Story (the fictional office)

**Lattice Tower — Bengaluru**
- **Building:** 11 floors (G + 10) + Terrace (Solar) + 2 Basements (Parking + DG/UPS/Battery/STP)
- **Area:** 70,000 sq ft (~6,300 sq ft per floor), 950 employees, 9:30am–7pm working hours (24×7 Server + Security + Basement)
- **Tariff:** ₹9.20 / kWh (Commercial HT), DG ₹22 / kWh, Solar ₹0 (captive)
- **Load:** Sanctioned 650 kW, today's peak 485 kW (74% utilization)

This one building demonstrates every level: `Portfolio → Building → Floor → Zone → Device/Circuit`. Multi-building portfolio is a one-click extension. 11 floors is intentional — forces floor-comparison, leaderboard, and “which floor is leaking ₹” storytelling that 3 floors cannot show.

---

## 3. Feature Set — Sufficient for a Convincing Office Demo

### A. Executive Command Center (Hero)
1.  **Live Building Load** — total kW now, vs sanctioned load, gauge + status (Safe / Near Peak / Overload)
2.  **₹ Today / This Month / Projected Month-End** — live cost ticker (like home's `Big "₹ today"`) with split Grid/Solar/DG
3.  **Carbon Today** — kgCO₂ today & trees equivalent
4.  **Live vs Yesterday / Last Week delta** — % up/down pills
5.  **Sanctioned Load & Peak Demand alert** — "Peak 485 kW at 2:15pm — 74% of 650 kW sanctioned"

### B. Energy Mix & Power Sources
6.  **Grid + Solar + DG + Battery mix bar** — 4-source stacked bar per hour (reuses `PowerSources.jsx` pattern)
7.  **Solar performance** — generation kWh, capacity utilization %, vs yesterday, rooftop efficiency
8.  **DG runtime & cost** — hours run, litres, ₹ cost (the expensive kWh that CFOs care about)
9.  **Net import/export** — for buildings with net metering

### C. Hierarchy Navigation (Office-Specific)
10. **Building → Floor → Zone drill-down** — e.g., Floor 8 → East Wing → Meeting Rooms → AC-8F-07 (11 floors makes drill-down essential)
11. **Floor Comparison (11 floors)** — kWh, ₹, W/sq ft, kWh/employee across all 11 floors (scrollable bar chart + heatmap). Answers "which of the 11 floors is the hog?" — Top 3 hog floors highlighted, bottom 3 efficient floors green
12. **Zone Types** — Open Workspace, Cabins, Meeting Rooms, Pantry, Server Room (Floor 5), Lobby (G), Washrooms, Parking (B1/B2)
13. **Department Cost Allocation** — Engineering (Floors 7-9): ₹1.18L/mo (38%) — Sales (Floor 10), Finance (Floor 6), HR (Floor 4), etc. — mapped via zone occupancy across 11 floors
14. **Seat/Occupancy overlay** — kWh per occupied seat per floor (needs only headcount input in demo) — sparse floor instantly visible

### D. Systems vs Plug Loads
15. **HVAC (Central + Splits)** — % of total (typically 45-55%), per AHU/chiller circuit
16. **Lighting circuits** — floor-wise, with after-hours waste highlight
17. **Workstation Plug Loads** — desktops, monitors, chargers aggregate per floor
18. **Server Room / IT Rack** — 24×7 baseload, PUE-like metric (IT load vs total)
19. **Common Services** — Elevators, Water pumps, STP, Fire systems

### E. Time Intelligence
20. **15-min Demand Curve** — today's load curve with working-hours shading + peak marker
21. **After-Hours Waste detector** — "Floors 3, 7, 9 lights + 34 ACs ran 8pm–7am — ₹8,420 wasted last night" (11 floors = waste aggregates by floor)
22. **Week-over-Week & Month-over-Month trend** — same as home `Usage.jsx` but per-floor (11 lines) + building total
23. **Working Hours vs Non-Working Hours split** — pie/bar showing % waste outside 9:30–7 (target <12% for 70k sq ft)
24. **Scheduler Preview** — "Auto-off Floors 1-11 at 7:30pm saves ~₹1.42L/mo" — simulated automation (no real control yet)

### F. Alerts & Insights (Actionable, not noisy)
25. **Priority alerts** — 3 levels: Critical (DG overload), Warning (peak near sanctioned), Info (meeting room AC on empty)
26. **Anomaly cards** — same pattern as `anomalies` in `src/data/mockData.js` but office-flavored: "Server room +18% vs baseline", "Pantry geyser 24h on"
27. **Energy hogs Top 5 (of 11 floors)** — circuits/zones by ₹/month across 70k sq ft, with one-click drill to `DeviceDetail.jsx`-style page
28. **Savings opportunities** — quantified: "Set Floors 7-9 AC to 25°C — ₹38k/mo", "Motion sensors for 22 washrooms (11 floors) — ₹18k/mo", "Stagger Floor 10-11 AHU start by 30min — peak -42 kW"

### G. Roles & Access (Preview UI only)
29. **Facility Manager** — full control, floor/zones, alerts, schedules
30. **Finance / Admin** — cost allocation, bills, export, tariff settings
31. **Sustainability / ESG** — carbon, solar share, efficiency scores, report export
32. **Employee (read-only)** — floor leaderboard, tips
33. **Audit log preview** — "Ravi changed Floor 2 schedule — 2h ago" (simulated)

### H. Reports & Compliance (One-Click)
34. **Monthly Bill Explainer** — sanctioned vs actual demand, TOD slabs if applicable, DG vs Grid, payable ₹
35. **ESG / Sustainability Export** — kWh, CO₂, solar %, intensity (kWh/sq ft), printable PDF/CSV
36. **Floor / Department monthly report** — auto-emailed (simulated) — per-floor ₹ + usage + saving tips
37. **Comparison export** — All 11 floors side-by-side — CSV (kWh, ₹, W/sq ft, after-hours %)

### I. Gamification & Culture
38. **Floor Efficiency Leaderboard (1–11)** — Floor 4: 94/100 (lowest W/sq ft), Floor 9: 61/100 — weekly winner badge + “most improved” across 11 floors
39. **Live ticker** — "If after-hours waste continues, this month +₹1.12L"
40. **Eco Mode toggle** — demo-wide dimming like `Dashboard.jsx:96` — shows projected savings

---

## 4. Pages / Routes for the Office Demo

| Route | Page | Reuses |
|-------|------|--------|
| `/office` | **Office Command Center** — hero KPIs, mix bar, demand curve, floor comparison, hogs, alerts | `Dashboard.jsx:29` stats grid + `HourlyLineGraph.jsx` |
| `/office/floors` | Floor grid — 11 floor cards (G, 1–10 incl. Terrace) (kW, ₹ today, occupancy) + zone breakdown per floor — paginated 6+5 or scroll grid | `FloorCircular.jsx` adapted to floor plan |
| `/office/floor/:id` | Floor detail — zones, circuits, scheduler, after-hours list (e.g., `/office/floor/8`) | `DeviceDetail.jsx` pattern per circuit |
| `/office/analytics` | Trends — WoW/MoM, working vs non-working, source mix over time | `Usage.jsx` |
| `/office/alerts` | Alerts + anomalies + savings queue | `EnergyAlerts.jsx` |
| `/office/reports` | Bills, ESG export, department allocation, CSV/PDF buttons | `Insights.jsx` + new |
| `/office/settings` | Tariff, working hours, headcount, BMS connect placeholder | `Connect.jsx` 3-step wizard → BMS |

Navigation adds an **Office / Home toggle** in the top bar (keeps existing home demo untouched).

---

## 5. KPIs That Matter to Offices (not homes)

- **W / sq ft** and **kWh / sq ft / month** — efficiency per area
- **kWh / employee / day** — benchmark 2.5–4.5 kWh for offices in India
- **Peak Demand (kW) & Load Factor** — sanctioned utilization %
- **Solar Share %** — solar kWh / total kWh
- **After-Hours %** — non-working kWh / total
- **PUE-lite** — Total kWh / IT kWh (server room)
- **Cost per floor / department (₹)** — the allocation CFO wants
- **kgCO₂ & equivalent trees**

---

## 6. Data Model Extensions (add to `database-plan.md:1`)

No new backend for demo — just simulated extensions. When Supabase is wired:

- `buildings` (1 row per building, belongs to org)
- `floors` (belongs to building, has sq ft)
- `zones` (belongs to floor, has type + department + sq ft + headcount)
- `circuits` (replaces/augments `devices` for central loads — AHU-1, Lighting-F2-East, Elevator-A)
- `readings_15min` (15-min granularity for demand curve, retained 13 months)
- `tariff_slabs` (HT commercial slabs + TOD if needed)
- `alerts` (rule, severity, zone/circuit, acknowledged_by)
- `reports` (generated PDFs metadata)

RLS: `org_members` can read only their org's buildings; `facility_manager` role can write schedules.

---

## 7. Simulated Data Strategy

- **Base load (scaled to 70k sq ft / 650kW):** 110 kW night baseload (server + common + B1/B2) + 380–485 kW day (HVAC 52% + Lights 19% + Plug 16% + Server 8% + Elevators/Pumps 5%)
- **Profiles by zone type × 11 floors:** Meeting rooms spike 10am–5pm (higher on Floors 7-10), Pantry 12–3pm, Server (Floor 5) flat, Parking B1/B2 6pm–9am low, Lobby G constant
- **Solar:** 120 kWp terrace (70k sq ft roof), bell curve 7am–6pm, peak 84 kW at 12:30pm, zero on rainy toggle
- **DG:** triggers only when `grid outage` toggle is on (demo button) — shows costly kWh
- **Anomalies:** inject 4–6 per day across 11 floors (e.g., Floor 7 lights left on overnight, Floor 9 AHU short-cycling)
- **Tariff calc:** `cost = kWh × tariff` per source — same derived-cost rule as `database-plan.md:22`

---

## 8. Design — Reuse Home System

- Keep `design-guidelines.md:14` tokens: `#141416` dark / `#FAFAFB` light, magenta `#E11D48` accent, Plus Jakarta Sans + JetBrains Mono.
- **Office accent:** add a subtle slate-blue secondary for floor comparison (not PRO blue — reserved for PRO).
- Cards stay `14px` radius, `~65rem` max width, top bar navigation — no new visual language.
- **Floor cards:** icon + live kW + ₹ today + occupancy mini-bar — same pattern as `Dashboard.jsx:131` Quick Access.

---

## 9. Demo Script (60-second walkthrough)

1. **Hero — "Your building is at 412 kW now — ₹21,840 today"** — mix bar shows solar covering 18% of 70k sq ft load
2. **Floor Comparison — 11 floors heatmap, Floor 9 is 31% higher per sq ft** — click Floor 9
3. **Floor 9 detail — East Wing AC + Lights caused it** — after-hours waste ₹3,920 (Floor 9 alone)
4. **Alert — "34 ACs still on after 7pm across Floors 3/7/9"** — one click shows saving ₹1.42L/mo with 7:30pm auto-off
5. **Reports — Export ESG one-pager for the board** — CSV/PDF

---

## 10. Build Checklist (staged)

- [ ] **Stage 1:** New routes + Office layout + hero KPIs + mix bar + floor comparison (static mock)
- [ ] **Stage 2:** Floor detail + zone drill + demand curve + after-hours detector
- [ ] **Stage 3:** Alerts + hogs + department allocation + leaderboard
- [ ] **Stage 4:** Reports/exports + role preview + DG/solar toggles + polish pass
- [ ] **Stage 5:** Copy to `marketing/public/demo/` for `.../office` on `lattice-energy.vercel.app`

---

## 11. What This Demo Is NOT

- Not a real BMS integration (15-min polling, Modbus/BACnet comes later)
- Not real appliance-level NILM per desk (we aggregate to circuits/zones for offices)
- Not billing-grade TOD engine yet (flat ₹9.20 simulated; slabs added after CFO feedback)
- Not multi-building portfolio UI yet (single building proves the pattern; portfolio is a filter on top)

---

## 12. Pricing Hook (matches `marketing/src/components/Pricing.jsx:1`)

Keep Home plans untouched. Enterprise card already says `Enterprise.jsx:14` — for office demo add a tooltip/section:

**Office Pro (per building):** Custom — includes floor/department allocation, AHU/lighting circuits, DG/solar stack, ESG exports, role-based access, SLA. Volume discount for 3+ buildings. CTA → `Talk to sales`.

---

*Owner: builder. This doc is the build spec — hand it to the code agent and it should be buildable without further questions. All values simulated until BMS stage.*
