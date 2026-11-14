# Lattice — Website Design Document

> **Live site:** <https://lattice-energy.vercel.app>
> **Source:** `lattice website and demo/marketing/`
> **Stack:** React 18 · Vite 5 · Tailwind CSS 3 · Framer Motion · GSAP · three.js · Supabase
> **Last reviewed:** 2026-11-13 (audited against the deployed site and source)

---

## 1. What the site is

Lattice is a **smart energy monitor** that reads electricity use and displays it in **watts and rupees**, per room, per appliance, per site. The website is the marketing front door for that product.

It serves **two audiences from one codebase**, and splits them at the very first screen:

| Audience | Promise | Landing route |
|---|---|---|
| **Home** (individuals) | "Every room. Every appliance. Every rupee." — see what your electricity is costing you | `/home` |
| **Business & Enterprise** | "Turn Enterprise Energy Into a Competitive Advantage." — energy intelligence across a portfolio | `/enterprise` |

**Positioning:** precise, calm, data-first. Every number shown is a real, meaningful figure (kW, ₹, %) — no decorative charts, no vanity metrics. The visual language is a dark, quiet "instrument panel" with a single strong accent colour used sparingly.

**Tone of voice:** short, declarative, outcome-led. Headlines are statements ("Energy is everywhere. Visibility isn't."), body copy is plain English with zero jargon, and all money is in ₹.

---

## 2. Site map

All routes are client-side and served by a SPA rewrite (`vercel.json` → `/index.html`).

| Route | Page | Purpose |
|---|---|---|
| `/` | `Landing` → `WelcomeOverlay` | Audience gate (see §3) |
| `/home` | `OriginalHome` | Consumer marketing page |
| `/enterprise` | `EnterpriseHome` | Enterprise marketing page (primary) |
| `/business` | `Business` | Standalone business/lead page (reached from `/home` nav) |
| `/contact` | `ContactPage` | Dedicated contact form + "what happens next" |
| `/about` | `AboutPage` | Static about content |
| `/embed`, `/pitch` | `Embed` | Self-contained pitch slide, designed to be iframed into PowerPoint |
| `*` | `NotFound` | 404 |

**Shared assets:** `public/brand/` (logo variants), `public/models/*.stl` (Lattice Hub 3D model), `public/demo/` (static pre-built demo bundle).

---

## 3. The audience gate (`/`)

The root route is not a homepage — it is a **full-screen choice overlay**.

- Fixed `z-[100]` panel over `bg-ink`, centred content, max-width `4xl`.
- Eyebrow `LATTICE` (13px, uppercase, `0.25em` tracking, brand-light) → **"Welcome to Lattice."** (4xl/6xl, `font-black`) → "What brings you here?" (gray-400).
- Two large cards side by side (`md:grid-cols-2`, `rounded-3xl`, `p-10`):
  - **Home** — `Home` icon, "Explore Lattice for your home." → `/home`
  - **Business & Enterprise** — `Building2` icon, "Energy intelligence for commercial buildings and facilities." → `/enterprise`
- The enterprise card is deliberately elevated: `border-brand/40`, `bg-gradient-to-b from-brand/15`, and `shadow-glow`. The home card is neutral (`border-white/10`, `bg-white/[0.03]`). Hover lifts both by `-translate-y-1`.
- Each card ends with an `Enter →` link in brand-light whose arrow gap widens on hover (`gap-2 → gap-3`).

**Background:** a bespoke full-screen **canvas dot matrix** — 28px spacing, magenta dots `rgba(225,29,72, 0.35)` (dark) / `0.18` (light), radius 140px, spring-back physics (stiffness `0.12`, damping `0.78`), plus a continuous sine wave so the field is always drifting. The cursor pushes dots away within the radius.

**Persistence:** choosing a card writes `sessionStorage['lattice-audience']` = `/home` or `/enterprise`. On any later visit to `/`, `Landing` reads that key and immediately `navigate(choice, { replace: true })` — so the gate only ever shows once per session. The two nav "experience" links explicitly `removeItem` the key before navigating, which is the only way back to the gate.

---

## 4. Design system

### 4.1 Colour

Defined in `tailwind.config.js` under the `brand` and `ink` namespaces.

| Token | Value | Role |
|---|---|---|
| `brand` | `#E11D48` | Primary accent — buttons, icons, glows, chart bars, focus rings |
| `brand-light` | `#F43F5E` | Hover state, eyebrows, links, icon glyphs |
| `brand-dark` | `#9F1239` | Deep accent (gradients, borders) |
| `ink` | `#0B0F19` | Page background (near-black navy, not pure black) |
| `ink-soft` | `#111827` | Raised surfaces |
| `ink-line` | `#1F2937` | Hairlines / dividers |

**Derived (via Tailwind utilities, not tokens):**

- Card surface: `bg-white/[0.03]` → hover `bg-white/[0.06]`
- Borders: `border-white/10` (cards), `border-white/5` (section dividers), `border-white/15` (secondary buttons)
- Text: `text-white` (headings) · `text-gray-200/300` (body) · `text-gray-400` (paragraphs) · `text-gray-500/600` (micro-labels, muted)
- **Semantic:** emerald `#10B981` = "Live" badge, success states · amber = configuration warnings · red = form errors
- Glow: `shadow-glow` = `0 0 60px -15px rgba(225, 29, 72, 0.45)`

**Selection & focus:** `::selection` is `rgba(225,29,72,0.35)`; `:focus-visible` gets a 2px `#E11D48` outline at 2px offset.

> ⚠️ There is **no electric-blue / PRO accent** on this site — that belongs to the demo app. See `../docs/design-guidelines.md`.

### 4.2 Typography

**Family:** Inter (`400–900`), loaded from Google Fonts with `preconnect`. `font-black` (900) is used for every heading and every large numeral; body copy is 400–500.

| Element | Spec |
|---|---|
| Hero H1 | `text-4xl md:text-6xl font-black tracking-tight leading-[1.05]` |
| Section H2 | `text-3xl md:text-5xl font-black tracking-tight` |
| Section eyebrow | `text-[13px] font-bold uppercase tracking-[0.2em] text-brand-light` |
| Card title | `text-lg font-bold text-white` (steps: `text-xl`) |
| Body / lead | `text-lg text-gray-400 leading-relaxed` |
| Card body | `text-[14px] leading-relaxed text-gray-400` |
| Micro-label | `text-[11px]`–`text-[12px] uppercase tracking-wider text-gray-500` |
| Big numeral | `text-3xl`/`text-4xl font-black` |

**Gradient headline treatment:** the payoff clause of a headline is clipped to a gradient — `bg-gradient-to-r from-brand to-rose-300 bg-clip-text text-transparent` (e.g. "…**Every rupee.**", "…**Competitive Advantage.**").

### 4.3 Surfaces, radius, spacing

- **Radius scale:** `rounded-xl` (12px) inputs & icon tiles · `rounded-2xl` (16px) cards · `rounded-3xl` (24px) hero visuals, feature panels, forms · `rounded-full` all buttons, badges, pills.
- **Icon tile:** `h-11 w-11 rounded-xl bg-brand/15 text-brand-light` (steps use `h-12 w-12`).
- **Section rhythm:** `py-24 px-5 border-t border-white/5` — every section is separated by a hairline.
- **Containers:** `max-w-6xl mx-auto` (default), `max-w-7xl` (solution flow), `max-w-screen-2xl` (pricing), `max-w-4xl`/`max-w-3xl` (CTA, prose).
- **Grids:** feature cards `sm:grid-cols-2 lg:grid-cols-3 gap-5`; steps `md:grid-cols-2 lg:grid-cols-4`; hero `lg:grid-cols-2 gap-14`.

### 4.4 The background (`DotGrid`)

A single fixed layer (`inset-0 -z-10`) renders on every page, in four stacked passes:

1. **Ambient glow** — two brand radial gradients (top-right `rgba(225,29,72,0.14)`, mid-left `0.07`), 60rem/50rem wide.
2. **Dot field** — 1.1px dots on a **28px** grid, `rgba(255,255,255,0.09)`, masked by `radial-gradient(70% 60% at 50% 30%, black 60%, transparent 100%)` so it fades toward the edges. Mouse parallax shifts it ±20px.
3. **Grid lines** — 1px lines on an **84px** grid at `opacity 0.03`, parallaxed at half rate (±10px).
4. **Bottom vignette** — `bg-gradient-to-b … to-black/20`.

Light mode swaps every colour: background `#FAFAFB`, dots `rgba(0,0,0,0.06)`, glow at `0.06` alpha.

### 4.5 Buttons

| Variant | Spec |
|---|---|
| **Primary** | `rounded-full bg-brand px-6 py-3.5 text-[15px] font-bold text-white hover:bg-brand-light shadow-glow` + `hover:scale-[1.02] active:scale-[0.98]` |
| **Secondary** | `rounded-full border border-white/15 px-6 py-3.5 font-semibold text-gray-300 hover:border-white/40 hover:text-white` |
| **Nav CTA** | `rounded-full bg-brand px-4 py-2 text-[13px] font-bold` (enterprise) / outlined pill (home) |
| **Ghost link** | brand-light text with an arrow whose `gap` widens on hover |

---

## 5. Motion & interaction

`MotionConfig reducedMotion="user"` wraps the app, so Framer Motion respects the OS setting globally.

**Entrance pattern (used by ~every section):**
```jsx
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: '-80px' }}
transition={{ duration: 0.6 }}
```
Cards stagger with `delay: i * 0.08` (steps `i * 0.12`). Card hover: `whileHover={{ y: -4, scale: 1.01 }}`.

**Hero scroll choreography** (`useScroll` + `useTransform`, enterprise hero): the visual drifts `y: 0 → 60` and fades `1 → 0.6` while the copy scales `1 → 0.96` and fades to `0.6` — a subtle parallax hand-off.

**Ambient loops:**
- Hero glow blob pulses `scale: [1, 1.03, 1]` over 6s, infinite.
- Chart bars grow from `height: 0` with `delay: 0.9 + i * 0.04` and staggered opacity.
- "Live" badge dot uses `animate-pulse`.

**GSAP ScrollTrigger — `ScrollStory`** (enterprise only): section is **pinned** for `+=400%` of scroll, `scrub: 0.8`, `anticipatePin: 1`. Four beats cross-fade while a 3D-perspective dashboard card (`rotationX: 8 → 0`, `rotationY: -5 → 0`, `scale: 0.85 → 1`) rotates to face the viewer and its KPI/chart/alert layers rise from `opacity 0.15`. **Disabled** on `prefers-reduced-motion` and ≤768px, where everything renders statically at full opacity.

**three.js — `LatticeHub`:** a scroll-driven orbit around `public/models/*.stl` (STLLoader + OrbitControls) with six labelled phases: *Meet Lattice Hub → The full device → The display → Connectivity and ports → Exterior details → Designed to connect*. **Disabled** on reduced-motion and ≤768px, falling back to a static block with a "Loading Lattice Hub…" / "preview unavailable" state.

**Custom cursor** (`/home` only): a 320px crosshair-and-grid ring that lerps toward the pointer at `0.14`, grows to 380px and turns magenta on interactive hover. Disabled on touch. See §12 for a caveat.

---

## 6. Page-by-page

### 6.1 `/home` — `OriginalHome` (consumer)

Navbar (`original/`) → Hero → Individuals → Enterprise → HowItWorks → Pricing → Contact + footer.

**Navbar** — fixed, `h-16`, `bg-ink/80 backdrop-blur-xl border-white/5`. Links: *For Individuals* (`/#individuals`), *For Businesses* (`/business`), *How it works*, *Pricing*, *Contact* (`/contact`). Outlined **"Enterprise experience →"** pill links to `/enterprise`. Hamburger below `md`.

**Hero** — badge `Smart energy monitoring` (`Wifi` icon) · H1 **"Every room. Every appliance. *Every rupee.*"** · lead paragraph · three CTAs (*Get started* → `#pricing`, *See what you get* → `#individuals`, *Try out the demo* → `lattice-smart-energy.vercel.app`) · a 4-up stat rail behind a top hairline:

| ₹1,200+ | 15 min | 24/7 | 100% |
|---|---|---|---|
| average yearly saving | to connect your home | real-time monitoring | data stays yours |

Right side: a **Live usage card** — `₹42.6 / today`, a `Live` pill, a 14-bar day curve (6 AM → Now), and three room chips **Kitchen ₹18.2 · Living room ₹12.7 · AC ₹9.4**, captioned *"Live ₹ cost per room, appliance, and home."*

**Individuals** — "Your home's electricity, finally understood". Six cards: Room-by-room breakdown · Appliance-level insight · Usage & cost in rupees · Smart alerts · Private by design · Works on your phone.

**Enterprise** — a **sticky left column** (`lg:sticky lg:top-24`, 2 of 5 cols) beside six capability cards (3 of 5 cols, 2-up): Multi-site portfolio view · Per-site energy KPIs · API & integrations · Enterprise-grade security · Dedicated support · Deploy at scale. Three checkmarks (*Fleet-wide rollouts · Custom reporting packs · SLA-backed uptime*) and a **Talk to sales** button.

**How it works** — "From plug-in to savings in one evening", three numbered steps (Connect · Understand · Save), then a gradient CTA panel: **"Ready to see your bill differently?"** → *Choose your plan*.

**Pricing** — "Simple plans for homes of every size":

| Plan | Price | Notes |
|---|---|---|
| Starter | **Free** forever | 1 home, live dashboard, room-level usage & ₹ cost, monthly bill estimate, community support |
| **Home Pro** | **₹99**/mo | *Most popular* — adds appliance-level AI detection, smart alerts, week-vs-week reports, up to 5 homes, priority support |
| Family | **₹249**/mo | Unlimited homes & rooms, shared family access, custom tariff & solar tracking, exportable reports |

Plus a full-width **Enterprise** strip (multi-site, API, custom reporting, dedicated support, volume pricing) → *Contact sales*.

**Contact** — see §6.5.

### 6.2 `/enterprise` — `EnterpriseHome` (primary)

Navbar (`components/`) → Hero → Problem → Solution → ScrollStory → ProductShowcase → LatticeHub → HowItWorks → Solutions → Pricing → TrustImpact → About → FinalCTA → Contact → Footer.

**Navbar** — fixed, **compacts on scroll** (logo 30→26px, `py-3 → py-2`, background `bg-ink/70 backdrop-blur-md` → `bg-ink/90 backdrop-blur-xl`, border fades in). Links: *Product · Solutions · Lattice Hub · How It Works · Pricing · About* (`/about`). Right side: **Home experience** (`/home`), a **theme toggle** (Sun/Moon), and a solid **Book a Demo →** button (`/contact`). Hamburger below `md`.

**Hero** — badge `Enterprise energy intelligence` · H1 **"Turn Enterprise Energy Into a *Competitive Advantage.*"** · lead · three CTAs (*Book a Demo* → `#contact`, *Try the live demo* → `office-worktree.vercel.app`, *Explore Lattice* → `#product`). Right: **Live building load** card — `412 kW`, `Live` pill, 14-bar curve, and three chips **Grid ₹2.14L · Solar 18% · DG ₹122/kWh**, captioned *"One centralized layer across your energy infrastructure."*

**Problem** — *"Energy is everywhere. Visibility isn't."* Six cards: Fragmented energy data · Limited visibility across facilities · Hidden inefficiencies · Reactive decision-making · Complex multi-site infrastructure · Difficulty identifying anomalies.

**Solution** — *"One layer for your entire energy infrastructure."* A vertical **flow diagram**:
`Meters · BMS · Solar · DG · Sensors` (neutral pills) ↓ → **Lattice: "One unified intelligence layer"** (brand band with `shadow-glow`, radial brand wash, `→ UNIFIED` marker) ↓ → `Monitoring · Analytics · Alerts · Insights` (brand pills) ↓ → **Enterprise decisions** (emerald pill).

**ScrollStory** — pinned four-beat narrative beside a "LATTICE TOWER — BENGALURU" dashboard (Load now `412 kW` · ₹ today `₹1,21,840` · Peak (74%) `485 kW`, bar chart, and three insight rows: *Floor 9 — highest W/sq ft · 34 ACs on after 7 PM · Server room +18% vs baseline*):
1. **01** Electricity is used across different areas and circuits.
2. **02** Lattice helps facilities teams see where electricity is consumed.
3. **03** The dashboard helps identify unusual usage.
4. **04** Usage insights help teams investigate and act.

**ProductShowcase** — *"The Lattice platform — A real enterprise product, not a mockup."* Dashboard mock (3 cols) + six hoverable module cards (2 cols): Energy consumption · Facility information · Analytics · Trends · Alerts · System information.

**LatticeHub** — scroll-driven 3D model of the hardware (see §5).

**HowItWorks** — *"From data to decisions"*: 01 Connect · 02 Monitor · 03 Understand · 04 Act.

**Solutions** — *"Built for enterprise use cases"*: Manufacturing · Commercial Buildings · Large Facilities · Multi-Site Operations · Enterprise Energy Management. Each card ends with a `Learn more →` affordance.

**Pricing** — *"Plans for every scale"* — five tiers, one column each on `lg:grid-cols-5`:

| Plan | Price | Devices | Users |
|---|---|---|---|
| Business | ₹4,999/mo | 50 | 25 |
| Business+ | ₹9,999/mo | 150 | 75 |
| **Professional** | ₹19,999/mo | 500 | 250 — *Most popular* |
| Enterprise | ₹39,999/mo | 2,000 | Unlimited |
| Enterprise Max | ₹79,999/mo | 8,000 | Unlimited |

Below: a **26-row feature comparison table** (sticky first column, `min-w-[720px]`, horizontal scroll, zebra rows, `—` = not included).

**TrustImpact** — *"Measurable outcomes"*: Energy Visibility · Operational Awareness · Efficiency Opportunities · Multi-Site Visibility. **All four values currently render an em-dash** — see §12.

**About** — two columns: "What Lattice is" + *Why it exists* / *Long-term vision* → "Read more about Lattice →".

**FinalCTA** — *"Build a clearer picture of your energy infrastructure."* → *Book a Demo* / *Explore Lattice*.

**Footer** — 5-column grid: brand block (*Enterprise Energy Intelligence* + *Connecting Ideas. Building Solutions.*) plus **Product / Solutions / Company / Legal**, then a bottom bar with © year and `lattice.yfc@gmail.com`.

### 6.3 `/business`

A standalone lead page with its own slim sticky header (logo + **Business** pill, *Home*, *Talk to sales*). Hero "Energy intelligence across your portfolio" with a "Trusted by" panel (Retail / Offices / Campuses + *Live demo available*), a "What you get" grid reusing the six capabilities, a *Volume pricing* card beside a gradient *Ready to talk?* panel, and a minimal footer.

### 6.4 `/contact`

Slim sticky header (logo + *Back to home*). H1 **"Talk to Lattice"**, lead copy, mail + location row, then a `lg:grid-cols-5` split: **form** (3 cols) and a **"What happens next?"** sidebar (2 cols) with a numbered 3-step process and a *Prefer email?* block. Shows an amber notice when Supabase env vars are absent.

### 6.5 Contact section (embedded in `/home` and `/enterprise`)

`lg:grid-cols-2`: left column has the eyebrow, H2 **"Let's talk about your energy bill"**, lead, `lattice.yfc@gmail.com`, "India — serving homes & businesses nationwide", and a link to the dedicated page. Right column is a `rounded-3xl` form card: **Name · Email · I'm interested in (select) · Message** + a full-width **Send message** button.

> The two copies differ: the home version defaults to *"Home monitoring"* with options *Home monitoring / Enterprise · multi-site / Partnership / Something else*; the enterprise version defaults to *"Enterprise deployment"* with options *Enterprise deployment / Multi-site portfolio / Integration · API / Partnership / Something else*.

### 6.6 `/about`

Prose page: *What Lattice is · Why it exists · The problem we are solving · Long-term vision*.

### 6.7 `/embed` & `/pitch`

A deliberately flat, self-contained slide for embedding in PowerPoint via a Web Viewer. "LIVE DEMO — Pitch Mode" pill, the consumer headline, a 3-stat rail (₹1,200+ / 15 min / 24/7), a mini live-usage card, three info cards, and an instruction line. `vercel.json` sets `X-Frame-Options: ALLOWALL` and a `frame-ancestors` CSP including `*.powerpoint.com` / `*.office.com` specifically to permit this.

### 6.8 404

Centred logo, `404` eyebrow, "Page not found", *Go home* + *Original site* buttons.

---

## 7. Shared components

| Component | Notes |
|---|---|
| `Logo` | `<img src="/brand/logo-new.png">`, `rounded-lg`, size prop (24–48) |
| `DotGrid` | §4.4 — background layer for all pages |
| `Navbar` | **Two variants** (home / enterprise) — see §6 |
| `Footer` | **Two variants** (columned enterprise / simple home bar) |
| `Contact` | **Two variants** — see §6.5 |
| `Pricing` | **Two variants** — 3 consumer plans vs 5 business plans |
| `Hero`, `HowItWorks`, `Individuals`, `Enterprise`, `Problem`, `Solution`, `ScrollStory`, `ProductShowcase`, `LatticeHub`, `Solutions`, `TrustImpact`, `About`, `FinalCTA` | Section blocks, each with a stable `id` for anchor navigation |
| `WelcomeOverlay`, `CustomCursor` | Portal overlay / decorative cursor |

> The tree is split: `src/components/` (enterprise) and `src/original/components/` (home) hold **parallel copies** of Navbar, Logo, DotGrid, Hero, Pricing, Contact and HowItWorks. See §12.

---

## 8. Forms & data

- **Backend:** Supabase table `contacts` (`name`, `email`, `interest`, `message`), via `@supabase/supabase-js` and `src/lib/supabase.js`, configured with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- **Graceful degradation:** if Supabase is not configured (`isSupabaseConfigured === false`), submission is **simulated** after 600ms and reported as success — so the form never hard-fails locally. `/contact` surfaces an explicit amber warning in this state.
- **States:** `loading` (button disabled, label → "Sending…"), `success` (emerald banner, form reset), `error` (red banner with the Supabase message).
- **SQL:** `supabase-contacts.sql`, `supabase-email-trigger.sql`, `SUPABASE_EMAIL_SETUP.md` — an email trigger notifies on new rows.

---

## 9. Light / dark theme

- **Dark is the default.** Light mode is applied by adding `.light` to `<html>`.
- **Bootstrap:** an inline `<script>` in `index.html` reads `localStorage['lattice-theme']` *before* first paint, preventing a flash.
- **Toggle:** the sun/moon button in the enterprise navbar, persisted back to `localStorage`.
- **Mechanism:** `src/index.css` ships a block of `.light …` overrides with `!important` that remap Tailwind utilities — `bg-ink → #FAFAFB`, `text-white → #17171B`, `text-gray-400 → #707077`, `border-white/10 → #E5E5EA`, `text-brand-light → #C81E42`, plus `color-scheme: light`.
- **Note:** this is *not* token-driven — see §12.

---

## 10. Accessibility & responsiveness

**Good:**
- Semantic landmarks: `header` / `nav` / `main` / `section` / `footer`.
- Every icon button has `aria-label` (*Toggle theme*, *Toggle menu*); decorative canvases and background layers are `aria-hidden`.
- Visible `:focus-visible` outline (2px brand) on all interactive elements.
- `prefers-reduced-motion` honoured globally — Framer Motion via `MotionConfig`, CSS via a `!important` block that collapses animation/transition durations, and GSAP/three.js sections explicitly bail out to static layouts.
- Forms use real `<label htmlFor>` bound to input ids; `required` + `type="email"` enforced natively.
- Touch devices get the native cursor back and no 3D/cursor effects.

**Gaps:**
- The custom cursor on `/home` never hides the native cursor (see §12), so two cursors render at once.
- The pinned `ScrollStory` and 3D `LatticeHub` are desktop-only; mobile gets a static fallback rather than an equivalent narrative.
- The pricing comparison table relies on horizontal scroll with a sticky first column — usable but easy to miss on small screens.
- Page `<title>` and meta description are static (see §12), which hurts SEO and social previews per-route.

**Responsive breakpoints used:** `sm 640` · `md 768` · `lg 1024` · `xl 1280`. Below `md` the navbar collapses to a hamburger; below `lg` two-column layouts stack; grids step `3 → 2 → 1`.

---

## 11. Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18.2, React Router 7 (BrowserRouter) |
| Build | Vite 5, `@vitejs/plugin-react` |
| Styling | Tailwind CSS 3.4 + PostCSS/autoprefixer |
| Animation | Framer Motion 13 (`MotionConfig reducedMotion="user"`), GSAP 3 + ScrollTrigger |
| 3D | three.js 0.160 + `STLLoader` + `OrbitControls` (`@react-three/fiber`/`drei` are also installed) |
| Icons | lucide-react |
| Data | Supabase JS v2 |
| Hosting | Vercel — SPA rewrite to `index.html`, permissive framing headers for the pitch embed |

**Commands:** `npm run dev` · `npm run build` · `npm run preview`.

---

## 12. Known issues & inconsistencies

*Audited 2026-11-13. Items 1–3 were verified against the deployed site.*

1. **🔴 Section anchor links are broken (verified).** The navbar uses absolute root paths — `/#product`, `/#solutions`, `/#hub`, `/#how`, `/#pricing` (enterprise) and `/#individuals`, `/#how`, `/#pricing` (home). Clicking one navigates to `/` + hash, `Landing` mounts, reads `sessionStorage['lattice-audience']` and `replace`-redirects to that audience's route — **dropping the hash**. Reproduced: clicking *Product* on `/enterprise` landed on `/home` at scroll offset 0 instead of scrolling to `#product`. If no audience is stored, the user is dumped on the welcome overlay instead. *Fix:* use same-path hashes (`#product`) or `Link`/`useNavigate` with `state`, and don't let `Landing` redirect when a hash is present.
2. **🟡 Duplicate card in `Embed.jsx`.** Lines 57–58 render two identical **"For Enterprises"** cards side by side; the third should clearly be a different topic.
3. **🟡 `TrustImpact` is a placeholder.** All four "Measurable outcomes" values render `—`, and the copy admits *"Verified metrics will be published here as deployments grow."* Either populate real numbers or hide the section.
4. **🟡 Dead footer links.** Every link in the enterprise `Footer` is `href="#"`, including *Privacy*, *Terms*, *Resources* and the whole *Solutions* column — no destinations exist.
5. **🟡 Duplicated pricing data.** `Pricing.jsx` keeps both a `plans` array (used for the table header) and a `cards` array (used for the cards) holding the same five tiers. Editing one desyncs the header from the cards.
6. **🟡 Two parallel component trees.** `src/components/` and `src/original/components/` each contain Navbar, Logo, DotGrid, Hero, Pricing, Contact and HowItWorks. They have already drifted (different footers, different `interest` option lists, one navbar has a theme toggle and the other doesn't). Consider a single parameterised set.
7. **🟡 Light theme is override-based, not token-based.** The `.light` block hard-codes `!important` remaps for a fixed list of utilities. Any newly used utility (`bg-white/[0.08]`, `text-gray-700`, `border-white/20`… ) silently stays dark in light mode. Moving to CSS custom properties would remove this class of bug.
8. **🟢 Dead CSS: `cursor: none`.** `index.css` hides the native cursor under `body.custom-cursor-active`, but nothing ever adds that class — `CustomCursor` doesn't touch `classList`. Result: on `/home` the native cursor **and** the custom crosshair are both visible.
9. **🟢 Off-brand cursor colour.** `CustomCursor` defaults to lime `#DFFF00`, which appears nowhere else in the palette (it flips to brand magenta only on hover).
10. **🟢 Static `<title>` / meta description.** Every route — including the consumer `/home`, `/contact` and the 404 — serves `Lattice - Enterprise Energy Intelligence` and the same description. No per-route titles or Open Graph tags are set anywhere (`document.title` is never assigned).
11. **🟢 The audience gate has no in-page exit.** Once `sessionStorage['lattice-audience']` is set, `/` always bounces. The only escapes are the two nav "experience" links (which call `removeItem`) or manually clearing storage.
12. **🟢 Minor copy drift.** The `Enterprise` strip on `/home` and the `/business` page repeat nearly identical capability copy; `Embed.jsx`'s headline stats repeat the hero's. Worth consolidating into shared content constants.

---

## 13. Design principles to preserve

When extending this site, keep these intact:

1. **One accent.** Brand magenta is the only chromatic colour in the UI. Emerald/amber/red appear *only* as status semantics. Never introduce a second decorative hue.
2. **Numbers are real.** Every figure on screen (kW, ₹, %, device counts) must be a plausible, meaningful value. No lorem metrics, no fake charts.
3. **Calm surfaces.** Dark `ink` background, 3% white cards, hairline borders. No glassmorphism beyond the navbar blur, no glow blobs, no decorative gradients outside the headline clip and the solution band.
4. **Quiet hierarchy.** Uppercase brand-light eyebrows → `font-black` headline → gray-400 lead → compact card copy. Let weight and spacing do the work, not colour.
5. **Motion has a job.** Entrances are short (0.5–0.7s) and once-only; scroll effects are scrubbed and interruptible; everything collapses gracefully under `prefers-reduced-motion` and on mobile.
6. **Two audiences, one voice.** The home and enterprise experiences differ in *content and density*, never in *visual language*.
