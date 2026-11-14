# Design Guidelines — Lattice Website

Plain-English guide to the look, feel, colours, type and visual style of the **live website**.

- **Site:** <https://lattice-energy.vercel.app>
- **Source:** `lattice website and demo/marketing/`
- **Full documentation:** see [`../marketing/design.md`](../marketing/design.md) for the route map, page-by-page breakdown, motion specs and known issues.
- **Last reviewed:** 2026-11-13

> This file used to describe only the demo dashboard app. The website tokens below are now the
> primary reference; the app's tokens are preserved in the [appendix](#appendix-demo-dashboard-app-tokens).

---

## Brand Identity

- **Name:** LATTICE
- **Tagline:** Connecting Ideas. Building Solutions.
- **Category line:** Enterprise Energy Intelligence
- **Logo:** `public/brand/logo-new.png` in the navbar and footer (`Logo` component, `rounded-lg`, 24–48px). `logo.png`, `brand-dark.png`, `brand-alt.png` and `L.png` (favicon / apple-touch-icon) are also available.
- **Personality:** Precise · Calm · Professional · Data-first — clean and purposeful, with **zero fluff and no meaningless graphs**. Every number on screen is a real, meaningful figure in watts, rupees or percent.

## Direction

Clean, **minimalist "instrument panel"** UI. Dark near-black surfaces, quiet hairline borders, compact typography, and **one strong accent colour used sparingly**. Two audiences share one visual language — the home and enterprise experiences differ only in content and density, never in style.

The closest reference points are **Raycast** (calm surfaces, tight type, single accent) and a **pro-audio / building-management console** (live readouts, status pills, bar curves).

---

## Colour Palette (design tokens)

Defined in `marketing/tailwind.config.js`. Dark is the default theme.

### Core

| Token | Value | Use |
|---|---|---|
| `brand` | `#E11D48` | Primary accent — buttons, icons, chart bars, glows, focus rings |
| `brand-light` | `#F43F5E` | Hover states, eyebrows, links, icon glyphs |
| `brand-dark` | `#9F1239` | Deep accent in gradients and borders |
| `ink` | `#0B0F19` | Page background — a near-black **navy**, not pure black |
| `ink-soft` | `#111827` | Raised surfaces |
| `ink-line` | `#1F2937` | Hairlines and dividers |

### Derived (Tailwind utilities)

- **Cards:** `bg-white/[0.03]`, hover `bg-white/[0.06]`
- **Borders:** `border-white/10` (cards) · `border-white/5` (section dividers) · `border-white/15` (secondary buttons)
- **Text:** `text-white` headings · `text-gray-200/300` body · `text-gray-400` paragraphs · `text-gray-500/600` micro-labels
- **Glow:** `shadow-glow` = `0 0 60px -15px rgba(225, 29, 72, 0.45)`

### Semantic (status only — never decorative)

- **Emerald** `#10B981` — the "Live" pill, success banners
- **Amber** — configuration warnings
- **Red** — form errors

### Light theme

Applied by adding `.light` to `<html>` (persisted in `localStorage['lattice-theme']`, bootstrapped by an inline script to avoid a flash).

| Role | Dark | Light |
|---|---|---|
| Background | `#0B0F19` | `#FAFAFB` |
| Headings | `#FFFFFF` | `#17171B` |
| Body | `#9CA3AF` (gray-400) | `#707077` |
| Muted | `#6B7280` (gray-500) | `#8A8A92` |
| Borders | `rgba(255,255,255,0.10)` | `#E5E5EA` |
| Accent | `#E11D48` | `#C81E42` (deeper, for contrast on white) |

> **Rule: one accent.** Magenta is the only chromatic colour in the UI. Emerald/amber/red appear *only* as status semantics. Never add a second decorative hue.

---

## Typography

**Family:** **Inter** (400–900), loaded from Google Fonts. `font-black` (900) carries every heading and every large numeral.

| Element | Spec |
|---|---|
| Hero H1 | `text-4xl md:text-6xl font-black tracking-tight leading-[1.05]` |
| Section H2 | `text-3xl md:text-5xl font-black tracking-tight` |
| Section eyebrow | `text-[13px] font-bold uppercase tracking-[0.2em] text-brand-light` |
| Card title | `text-lg font-bold text-white` (steps: `text-xl`) |
| Lead paragraph | `text-lg text-gray-400 leading-relaxed` |
| Card copy | `text-[14px] leading-relaxed text-gray-400` |
| Micro-label | `text-[11px]`–`text-[12px] uppercase tracking-wider text-gray-500` |
| Big numeral | `text-3xl` / `text-4xl font-black` |

**Signature treatment — gradient payoff:** the closing clause of a headline is clipped to
`bg-gradient-to-r from-brand to-rose-300 bg-clip-text text-transparent`
(e.g. "Every room. Every appliance. **Every rupee.**"). Use it once per page at most.

---

## Signature elements

1. **Dot-grid background (`DotGrid`)** — present on every page. Four stacked passes: brand ambient glow → 28px dot field (masked to fade at the edges, ±20px mouse parallax) → 84px grid lines at 3% opacity (half-rate parallax) → bottom vignette. This *is* the texture of the site; never add a competing background image.
2. **Live dashboard cards** — the recurring hero visual. A `rounded-3xl` panel with a `Live` pill (emerald, pulsing dot), a large `font-black` readout, a 14-bar day curve from 6 AM → Now, and three small metric chips below. Home shows `₹42.6 / today` with room chips; enterprise shows `412 kW` with Grid/Solar/DG chips.
3. **Section eyebrows** — every section opens with a small uppercase brand-light label (`THE PROBLEM`, `PRICING`, `HOW IT WORKS`). This is the site's rhythm; don't skip it.
4. **Quiet feature cards** — `rounded-2xl border-white/10 bg-white/[0.03] p-7` with a `h-11 w-11 rounded-xl bg-brand/15 text-brand-light` icon tile, a bold title, and two lines of gray-400 copy. Hover lifts `-4px` and warms the border to `brand/40`.
5. **Pill buttons everywhere** — every button is `rounded-full`. Primary = solid brand with `shadow-glow`; secondary = hairline outline.
6. **Status pills** — `Live` (emerald), `MOST POPULAR` (brand, on the highlighted pricing tier), audience badges (`Enterprise energy intelligence`, `Smart energy monitoring`).

---

## Layout rules

- **Section rhythm:** `py-24 px-5`, separated by `border-t border-white/5`. Generous whitespace throughout.
- **Containers:** `max-w-6xl` default · `max-w-7xl` for the solution flow · `max-w-screen-2xl` for pricing · `max-w-4xl`/`max-w-3xl` for CTAs and prose.
- **Radius scale:** `rounded-xl` (12px) inputs and icon tiles · `rounded-2xl` (16px) cards · `rounded-3xl` (24px) hero visuals, panels and forms · `rounded-full` buttons and pills.
- **Navigation:** fixed top bar — desktop inline links, hamburger below `md`. The enterprise bar compacts on scroll (logo 30→26px, tighter padding, background fades from `ink/70` to `ink/90` with a border).
- **No decorative chrome:** no glow blobs, no glass blur beyond the navbar, no background images, no drop shadows except the brand glow.
- **Responsive from 640px up:** grids step `3 → 2 → 1`; two-column layouts stack below `lg`.

---

## Motion rules

- **Entrances:** `opacity 0 → 1`, `y: 20 → 0`, `0.5–0.7s`, ease-out, `whileInView` with `once: true` and `margin: '-80px'`. Cards stagger `i * 0.08`.
- **Hover:** cards lift `-4px` and scale `1.01`; buttons scale `1.02` on hover, `0.98` on press; link arrows widen their gap.
- **Ambient:** the hero glow blob pulses `scale [1, 1.03, 1]` over 6s; chart bars grow from zero with `0.04s` stagger; the `Live` dot pulses.
- **Scroll-driven:** the enterprise hero parallaxes; `ScrollStory` pins for `400%` of scroll with `scrub: 0.8`; `LatticeHub` orbits a 3D model across six labelled phases.
- **Always:** `MotionConfig reducedMotion="user"`, plus a CSS `prefers-reduced-motion` block that collapses durations, and explicit static fallbacks for the GSAP and three.js sections on reduced-motion and ≤768px.

---

## Do / Don't

| Do | Don't |
|---|---|
| Show real kW / ₹ / % figures | Invent metrics or decorative charts |
| Use brand magenta as the single accent | Introduce a second decorative colour |
| Let weight and spacing carry hierarchy | Rely on colour or boxes to create hierarchy |
| Keep cards at 3% white with hairline borders | Add heavy shadows, glass panels or gradients |
| Animate once, briefly, and respect reduced motion | Loop distracting animations or animate on every scroll |
| Keep copy short, declarative and jargon-free | Write long marketing paragraphs |

---

## Appendix: Demo dashboard app tokens

The companion **demo app** (`lattice website and demo/src/`, deployed at `lattice-smart-energy.vercel.app`) is a *different* design surface — a product UI rather than a marketing site. Its tokens are kept here for reference.

- **Direction:** Raycast-inspired minimalism; device control list with live watts and toggle switches, 24-hour usage bars, a big "₹ today" figure.
- **Typography:** **Plus Jakarta Sans** ExtraBold for headings; body in Plus Jakarta Sans; numerals in **JetBrains Mono** so live watts line up. Small uppercase `11px` micro-labels.
- **Dark mode (default):** background `#141416` · cards `#1D1D21`, hover `#26262B` · text `#F5F5F5`, muted `#9C9CA4`, faint `#6E6E76` · accent `#E11D48`.
- **Light mode:** background `#FAFAFB` · cards `#FFFFFF`, hover `#EDEDF0` · text `#17171B`, muted `#707077`, faint `#A2A2AA` · accent `#C81E42`.
- **Status:** green = running/positive · amber = needs attention · magenta = needs action.
- **PRO accents:** electric blue `#0EA5E9` via the PRO toggle (free during demo).
- **Layout:** max content width ~65rem, 14px card radius, top bar (desktop) / bottom bar (phone).

> **Note:** the app and the website both use `#E11D48` as the accent, but they differ in
> background (`#141416` vs `#0B0F19`) and heading font (Plus Jakarta Sans vs Inter). Don't mix
> the two systems inside one surface.
