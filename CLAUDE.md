# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build (run this to verify no TS/lint errors)
npm run lint     # ESLint via next lint
npm run start    # Start production server (after build)
```

There are no tests. `npm run build` is the primary verification step.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS 3** + **shadcn/ui** (Radix primitives)
- **Supabase** (`@supabase/ssr`) — postgres + auth; project: `hfbkmqzffrletmqwzvme.supabase.co`
- **Deploy**: Vercel + Supabase free tier
- Path alias: `@/` maps to `src/`

## Architecture

### Server / Client Component Split
All data-fetching pages are React Server Components. Client components (`"use client"`) are used only where interactivity is required (filters, rating widget, review form). The `<Suspense>` wrapper is used around client components embedded in server pages.

### Supabase Clients
- `src/lib/supabase/server.ts` — RSC/Route Handler client (uses `@supabase/ssr` + cookies)
- `src/lib/supabase/client.ts` — browser client (singleton)
- **Always import the server client in RSCs and API routes; never import it in client components.**

### Query Layer
All Supabase queries are centralized in `src/lib/queries.ts`. Add new queries there rather than inline in pages.

Key gotcha: `sport` and `type` columns in the DB store **semicolon-separated values** (e.g. `"Baseball; Football"`). `getSports()` / `getTypes()` split these client-side to count correctly. `getGames()` uses `.or()` with `ilike` patterns to filter across semicolons. Multi-select in the URL uses **comma-separated values** (`?sport=Baseball,Basketball`).

### Routing
| Pattern | Notes |
|---|---|
| `/games` | `dynamic = "force-dynamic"` — all filters via URL search params |
| `/games/[id]` | ISR, `revalidate: 3600`; view count incremented via `POST /api/views/[id]` |
| `/browse/sport/[sport]` | Static-ish, reads single sport param |
| `/admin/*` | Auth-guarded in `src/app/admin/layout.tsx` via `supabase.auth.getUser()` |

### Admin Auth
`src/app/admin/layout.tsx` checks `supabase.auth.getUser()` server-side and redirects to `/admin/login` if unauthenticated. No middleware — auth is enforced per layout.

### Pages Layout
Root layout (`src/app/layout.tsx`) wraps all pages with `<Header>` and `<Footer>` and loads Google Fonts as CSS variables.

## Key Paths

| Purpose | Path |
|---|---|
| TypeScript types | `src/lib/types.ts` |
| All Supabase queries | `src/lib/queries.ts` |
| Design tokens (CSS vars) | `docs/design/design-tokens.css` |
| Filters sidebar (client) | `src/components/games/GameFilters.tsx` |
| Game detail mockup | `docs/design/game-detail-mockup.html` |

## Database

**`games` table** (6808 rows, source = `"bgg"` or `"manual"`): `id`, `name`, `sport`, `type`, `year`, `complexity` (`"Simple"/"Medium"/"Complex"/"Expert"`), `playtime`, `players`, `recommended_player_count_min/max`, `thumbnail_url`, `image_url`, `video_url`, `download_1/2/3_name/url`, `average_rating`, `bgg_url`, `publisher_name`, `publisher_website`, `description`, plus many BGG stat fields.

**Community tables** (created via `docs/supabase-migrations.sql`): `game_views`, `ratings`, `reviews`, `game_submissions`, `comments`, `news`. Community content (`reviews`, `game_submissions`) uses `status: "pending" | "approved" | "rejected"` — starts pending, approved via admin.

**Pagination**: 48 games per page, server-side via Supabase `.range()`. Never fetch all 6k+ games to the client.

## Design System — "The Press Box"

- **Colors**: warm ink background `#0d0b08`, gold accent `#d4a843`; Tailwind extended colors: `ink-*`, `gold-*`, `ember-*`
- **Fonts**: Oswald (headings), Inter (body), DM Mono (stats/numbers), Lora (descriptions) — loaded as CSS vars `--font-oswald`, `--font-inter`, `--font-dm-mono`, `--font-lora`
- **CSS variables**: defined in `docs/design/design-tokens.css`, merged into `src/app/globals.css`. Use `var(--color-*)` for colors in inline styles where Tailwind classes don't cover the token.
- **Key utility classes**: `.pb-card`, `.accent-rule`, `.section-label`, `.sport-badge`
- **Dark mode**: default is dark; `:root` in `globals.css` is the dark theme. `data-theme` attribute on `<html>` toggled via localStorage.

## Conventions

- URL IDs are **numeric** (`/games/123`), no slugs
- Image CDN: `cf.geekdo-images.com` (configured in `next.config.*`)
- New DB tables → Supabase SQL editor only (no ORM migrations)
- Use `next/image` for all game images
- ISR pages export `export const revalidate = 3600`
- Dynamic pages (with user-specific filters) export `export const dynamic = "force-dynamic"`
