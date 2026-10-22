# 71Codes — live 3D business dashboards

No boring dashboards: **71Codes turns business data into a living 3D world.** Every page of this demo
pairs a pixel-faithful finance dashboard (the Dashboard V14 design) with an animated Three.js diorama of
the same data — glass “LIVE” cards tied to buildings by dotted leader lines, vans and drones moving
money around, goals rising as towers, and click-to-focus detail cards. A `/showcase` route replays the
original 9:16 V14 promo film live.

### The worlds

| Page | World |
|---|---|
| Overview | Business city — warehouse, HQ tower, returns depot, customer homes, picking line, delivery vans |
| Activity | Money in motion — parcels fly between the vault and every merchant / client; pending ones queue at a checkpoint |
| Contacts | Your network — contacts as homes and shops; drones fly transfers (a new transfer launches one live); click a home to select them |
| Savings & Goals | Goals under construction — towers built to their % saved, scaffolding + cranes for the rest; Add money raises them |
| Reports | Cash-flow skyline — income/expense towers per month with a net-profit ribbon |
| Schedule | Bill street — each bill is the building it pays for; pay from the 3D focus card |
| Inbox | Mail room — envelopes fly from senders to the post office; unread ones hover overhead |
| Program | Rewards park — tier podium with crown, coin helix, perk shops you can redeem from |
| Account | Your HQ — security dome inflates with 2-factor, dish spins for push alerts, sun/moon follows theme |

Manage keeps the flat card-controls layout from the reference.

Live: https://71code.kanbanstudios.ae

## Stack

- Next.js 16 (App Router, static export) · React 19 · TypeScript
- Tailwind CSS v4 with CSS-variable design tokens (light + dark)
- Framer Motion (shared-element nav pills, springs, count-ups, page transitions)
- Three.js via React Three Fiber + drei for the live worlds (lazy-loaded, only on pages that use them)
- Lucide icons · hand-built SVG charts (no chart library)
- Cloudflare Workers static assets for hosting

All data is seeded demo data kept in `localStorage` — nothing real is moved, no backend.

## Routes

| Route | What it is |
|---|---|
| `/` | Overview — balance + wallets, 2×2 metric tiles, profit & loss bars, spending limit, recent activities |
| `/activity` | Searchable/sortable transactions, status tabs, CSV export, live feed |
| `/manage` | Cards: freeze, show/copy number, 3D flip, per-card controls, spending-limit slider, new card |
| `/contacts` | Quick transfer (favourites, presets, confirm flow), filters, search, favourites, add contact |
| `/savings` | Total saved, monthly contributions, auto-save toggles, goal rings, new goal / add money |
| `/program` | Rewards tier, programs, redeemable perks |
| `/account` | Profile form, preferences, theme, export / reset demo data |
| `/reports` | Cash flow, spending by category, monthly statements (CSV) |
| `/schedule` | Bill calendar, pay / autopay |
| `/inbox` | Messages with read/star and replies |
| `/showcase` | The 9:16 film stage. `R` replays · `?loop=1` loops · `?clean=1` hides controls · `?autoplay=0` waits |

## Scripts

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
npm run preview    # build + serve ./out with wrangler
npm run deploy     # build + deploy to Cloudflare (71code.kanbanstudios.ae)
```

## How it is put together

- `src/components/shell/` — persistent frame, header, rail; it renders the page for the current path
  inside `AnimatePresence` so pages exit/enter while the shell stays put.
- `src/components/motion/` — reveal primitives authored in “reference seconds”. The app plays them at
  `tempo 0.5`; the showcase plays them at the film’s own pace.
- `src/components/showcase/` — the stage (title, code panel) and the iframe-hosted scene director that
  drives the real app through Overview → Contacts → Savings → Activity → Manage in 6.3 s.
- `src/components/world/` — the 3D engine: `WorldPanel` (DOM cards, leader lines, focus cards, controls),
  `WorldCanvas` (lights, fly-in camera with auto-framing, projector), `kit*.tsx` (low-poly model kit) and
  one scene per page in `scenes/`.
- `src/lib/store.tsx` — typed reducer + `useSyncExternalStore` store persisted to `localStorage`.
