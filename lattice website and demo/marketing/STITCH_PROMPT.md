# Lattice — Consumer Site Redesign Brief for Google Stitch

> **Copy the prompt in the next section and paste it directly into Google Stitch.** The rest of this file is the full context if Stitch needs more detail.

---

## 1) Prompt to paste into Google Stitch (copy everything inside the code block)

```
Completely redesign the Lattice consumer marketing website — a premium, trustworthy, Indian-market smart energy monitor. You have full creative freedom: reimagine layout, visual system, typography, and interactions from scratch. Keep the same content/sections and brand, but make it world-class (think Apple + Linear + Raycast minimal).

BRAND
- Name: Lattice (not LATTICE), tagline: "Connecting Ideas. Building Solutions."
- Logo: lattice-grid (4-corner dots + cross, magenta #E11D48 on dark)
- Palette: deep ink #0B0F19 / #111827 as base, magenta #E11D48 as primary accent, rose-300 gradient, white/gray-200 text, subtle white/5 borders, glass (white/[0.03] cards, backdrop-blur). Optional soft glows.
- Type: Inter (900/800/700 for headlines, 500/400 for body), tight tracking, generous whitespace.
- Vibe: premium hardware + software, calm, credible, Indian homes & businesses, privacy-first, affordable. Dark mode only.

AUDIENCE & GOAL
- Primary: Indian homeowners who don't understand their electricity bill.
- Secondary: Enterprises (retail chains, offices, campuses, manufacturers) needing multi-site portfolio view.
- Goal: explain the product in 10 seconds, make visitors trust it, and drive to Pricing/Contact.

KEEP THESE SECTIONS (reorder/visuals are up to you, but don't drop content):
1. Sticky Navbar: left Lattice wordmark + logo, center links (For Individuals, For Enterprises, How it works, Pricing, Contact), right CTA "Try the demo". Mobile hamburger.
2. Hero (2-col): left — eyebrow "Smart energy monitoring", H1 "Every room. Every appliance. Every rupee." (gradient on "Every rupee."), subcopy "Lattice turns your home's or business's electricity use into a live, readable dashboard — in watts and rupees — so you can cut waste without guesswork.", dual CTAs "Get started" (magenta) + "See what you get", stats strip (₹1,200+ avg yearly saving | 15 min to connect | 24/7 monitoring | 100% data stays yours). Right — live usage preview card: "Live usage ₹42.6 / today" with Live dot, 14-bar usage chart (6AM–Now), 3 room cards (Kitchen ₹18.2, Living room ₹12.7, AC ₹9.4), caption "Live ₹ cost per room, appliance, and home".
3. For Individuals: eyebrow "For individuals", H2 "Your home's electricity, finally understood", intro paragraph, 6 feature cards with icons (Room-by-room breakdown, Appliance-level insight, Usage & cost in rupees, Smart alerts, Private by design, Works on your phone) — each with icon in magenta/15 tile, title, 2-line desc.
4. For Enterprises: eyebrow "For enterprises", H2 "Energy intelligence across your portfolio", intro, 3-line checklist (Fleet-wide rollouts, Custom reporting packs, SLA-backed uptime), CTA "Talk to sales", 6 cards (Multi-site portfolio view, Per-site energy KPIs, API & integrations, Enterprise-grade security, Dedicated support, Deploy at scale).
5. How it works: eyebrow "How it works", H2 "From plug-in to savings in one evening", 3 steps with big faint numbers 1/2/3 (Connect, Understand, Save), each with icon + desc, plus bottom CTA band "Ready to see your bill differently?" with "Choose your plan".
6. Pricing: eyebrow "Pricing", H2 "Simple plans for homes of every size", subcopy "Pay less than one cup of coffee...". 3 cards: Starter (Free forever, 1 home, room-level, monthly estimate, community), Home Pro (₹99/mo, Most popular, Everything in Starter + AI appliance detection + alerts + week trends + 5 homes + priority), Family (₹249/mo, unlimited homes, shared access, solar tracking, exportable reports). Each with checkmarks. Below: Enterprise row (Multi-site, API, custom reporting, volume pricing) with "Contact sales" (white button).
7. Contact: left — H2 "Let's talk about your energy bill", subcopy + mailto:hello@lattice.energy + "India — serving homes & businesses nationwide". Right — form (Name, Email, I'm interested in [Home monitoring / Enterprise / Partnership / Something else], Message, "Send message"). Success state.
8. Footer: left Lattice + tagline, right © 2026 Lattice Energy.

DESIGN DIRECTION
- Completely new visual language, but keep dark premium + magenta accent.
- Use large, confident headlines (48–64px hero), generous padding (py-24 per section), rounded-2xl/3xl cards, subtle borders, soft shadows/glows.
- Add tasteful motion: gentle fade/slide on scroll, bar chart shimmer, Live pulse dot.
- Make pricing scannable (Home Pro emphasized). Make enterprise feel credible, not startup-y.
- Fully responsive (mobile nav drawer, 1-col hero on mobile, 2–3 col grids).
- No stock photos needed; use abstract energy visuals, grid patterns, or clean mock UI.

OUTPUT
- A complete, production-ready landing page (desktop + mobile) in the Stitch canvas.
- Keep it as a single marketing site (no app chrome). Export as Figma-ready frames or high-fidelity mock with clear spacing/redlines.
- Don't change the copy — polish visuals only. Keep Indian Rupee (₹) and pricing as-is.
```

---

## 2) Full context (if Stitch asks for more)

### Project overview
Lattice is an affordable smart energy monitor for Indian homes/businesses. It reads smart meters + Home Assistant devices and shows live electricity use in watts and rupees, per room/appliance/home. The consumer site is **separate from the demo app** (`/` dashboard). Repo: `seemperer/lattice--opensource` (moved from `dudeling-codebot/Lattice--Opensource`; old URL redirects), customer site lives in `marketing/` (`marketing/src/App.jsx:1`).

### Tech (for reference, not to constrain design)
- Vite + React 18 + Tailwind (`marketing/tailwind.config.js:1`, `marketing/vite.config.js:1` base `./`)
- Icons: lucide-react. No backend needed for this page.

### File map
```
marketing/src/App.jsx          — assembles all sections
marketing/src/components/
  Navbar.jsx                   — sticky header + mobile drawer
  Hero.jsx                     — hero + stats + live preview card
  Individuals.jsx              — 6 cards for homes
  Enterprise.jsx               — sticky left copy + 6 cards
  HowItWorks.jsx               — 3 steps + bottom CTA band
  Pricing.jsx                  — 3 tiers + enterprise row
  Contact.jsx                  — form + footer
  Logo.jsx                     — 32px lattice mark (magenta on ink)
marketing/src/index.css        — dark bg with radial gradients, Inter
marketing/public/brand/        — logo.png, lattice-mark.svg
```

### What to keep vs. reimagine
- **Keep:** all copy, section order (unless you have a better flow), pricing numbers, contact email, brand name/tagline.
- **Reimagine:** everything visual — grid, cards, hero art, illustration style, spacing, button shapes, section backgrounds, icon treatment. You may introduce new patterns (e.g., subtle lattice grid, energy flow lines) if they reinforce "Connecting Ideas."

### Constraints
- Must work on `https://lattice-energy.vercel.app` and `https://lattice3.vercel.app` (dark background `#0B0F19`). No light mode needed.
- Keep it fast (no heavy images). Use CSS/Tailwind-friendly visuals.
- Accessibility: 4.5:1 contrast for body text, keyboard focus states.
- No new dependencies — just visuals.

### What success looks like
A Stitch canvas that a non-designer can hand to an engineer and rebuild in `marketing/` without guesswork. If you can, annotate spacing (e.g., 96px section padding, 20px card gap) and export a Figma frame.

---

## 3) How to use this file
1. Open Google Stitch → New project → Paste the prompt from section 1.
2. If Stitch asks for "more context," paste sections 2–3 or attach this file.
3. When you like a direction, click **Generate / Refine** in Stitch, then export Figma or screenshot and drop it into `marketing/` as the new build target.
