# 71Codes — Dashboard V14

A pixel-faithful, fully working recreation of the **Dashboard V14** finance UI: a pale lilac canvas,
floating pill navigation, coral accents, staged skeleton → content reveals, count-ups, striped bar
charts, drawn goal rings and a 3D-flipping virtual card — plus a `/showcase` route that replays the
original 9:16 promo film live.

Live: https://71code.kanbanstudios.ae

## Stack

- Next.js 16 (App Router, static export) · React 19 · TypeScript
- Tailwind CSS v4 with CSS-variable design tokens (light + dark)
- Framer Motion (shared-element nav pills, springs, count-ups, page transitions)
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
- `src/lib/store.tsx` — typed reducer + `useSyncExternalStore` store persisted to `localStorage`.
