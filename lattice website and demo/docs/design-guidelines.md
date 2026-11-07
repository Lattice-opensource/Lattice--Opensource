# Design Guidelines — LATTICE Smart Energy Monitor

Plain-English guide to the look, feel, colors, fonts, and visual style of the LATTICE app.

## Brand Identity
- **Name:** LATTICE
- **Tagline:** Connecting Ideas. Building Solutions.
- **Logo:** the official brand logo (`public/brand/logo.png`) appears in the top bar and the welcome screen. A dark-variant image and an alternate image are also stored for later use.
- **Personality:** Precise, Effortless, Professional, Smooth, Calm — clean and purposeful with zero fluff or meaningless graphs.

## Direction
Clean, **minimalist** UI inspired by **Raycast** (the macOS launcher app): calm surfaces, quiet borders, compact typography, one strong accent color used sparingly, and every chart/visual showing real meaning.

## Color Palette (design tokens)
Both themes share the same structure; CSS variables switch automatically.

**Dark mode (default)**
- Background: near-black `#141416`
- Cards/surfaces: `#1D1D21`, hover `#26262B`
- Text: off-white `#F5F5F5`; muted `#9C9CA4`; faint `#6E6E76`
- Accent (LATTICE magenta): `#E11D48`
- Status: green = running/positive, amber = needs attention, magenta = needs action

**Light mode**
- Background: off-white `#FAFAFB`
- Cards: pure white `#FFFFFF`, hover `#EDEDF0`
- Text: near-black `#17171B`; muted `#707077`; faint `#A2A2AA`
- Accent: deeper rose `#C81E42` (for contrast on white)

**PRO accounts only:** Electric Blue accents (`#0EA5E9`) through the PRO toggle — free during demo.

## Typography
- **Headings:** Plus Jakarta Sans ExtraBold, tight tracking — strong but calm.
- **Body & data:** Plus Jakarta Sans; numbers in a monospace font (JetBrains Mono) so live watts line up.
- Small uppercase micro-labels (`11px`) for section names — a Raycast habit.

## Signature elements
- **Device control list on the dashboard:** every connected device is a quiet row with a live watts readout and a **toggle switch to turn it on/off** (wattage smoothly falls to 0 / rises up).
- **24-hour usage bars:** one-look daily curve for the whole home and per device — no gimmicks, values on hover.
- **Big "₹ today" number** at the top of the dashboard — the answer to "what is this costing me".

## Layout rules
- Generous whitespace, max content width ~65rem, 14px card radius.
- Navigation: simple top bar (desktop) / bottom bar (phone). No decorative backgrounds, no glow blobs, no glass blur.
- Everything responsive from a phone up.