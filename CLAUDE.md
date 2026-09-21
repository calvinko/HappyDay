# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

HappyDay is a mobile-first daily devotional app (Scripture passage + hymns for a church congregation). It's a single-screen React SPA — there is no router; navigation is an in-memory state machine.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build      # tsc -b (typecheck/project refs) then vite build
npm run preview    # preview the production build
npm run lint       # oxlint
```

There is no test suite configured in this repo.

`server/` is a separate npm project with its own commands (`npm run dev`, `npm run build`, `npm run init-db`) — see Architecture below.

## Architecture

- **Everything lives in one component**: [src/components/HappyDayApp.tsx](src/components/HappyDayApp.tsx) contains the entire app — all five screens, all navigation logic, and all local state (~650 lines). There are no sub-components, no router, and no global state library. When adding a screen or feature, this is almost always the file to edit.
- **Screens are a union type switched in JSX**, not routes: `type Screen = 'home' | 'passage' | 'resources' | 'hymn' | 'profile'`. Navigation is just `setScreen(...)`, with `from` tracked separately so the hymn screen's back button can return to wherever it was opened from (home, passage, or resources).
- **`App.tsx` passes layout/nav variants as props** (`homeLayout: 'poster' | 'cards'`, `navModel: 'tabs' | 'top'`) to `HappyDayApp`. These render fully different JSX branches for the same screen — check which variant you're editing, since `poster`/`cards` and `tabs`/`top` each have separate markup.
- **Content is static data**, not fetched: [src/lib/data.ts](src/lib/data.ts) exports `VERSES`, `HYMNS`, `RECENT`, `HISTORY`, `TODAY`. There's no backend — "today's passage," streaks, and history are hardcoded/derived client-side, not date-driven.
- **The only persisted state is the user's name and group**, read/written to `localStorage` under `happyday.name` / `happyday.group` (`readName`/`writeName`/`readGroup`/`writeGroup` in HappyDayApp.tsx), guarded with try/catch for private-mode/blocked storage. Sign-in (the "Me" tab when signed out) is a two-step flow — pick a group, then type a name (`signInStep: 'group' | 'name'`) — with no password; there's no real auth.
- **The list of church groups is hardcoded in `App.tsx`** as `GROUPS: Group[]` (id/label pairs) and passed into `HappyDayApp` as the `groups` prop — edit that array to add/rename/remove groups. `HappyDayApp`'s `DEFAULT_GROUPS` is only a fallback for when the prop is omitted.
- **[server/](server/)** is a separate Node.js + Express + TypeScript app (own `package.json`/`tsconfig.json`, not part of the Vite build) providing username/password auth backed by MySQL. Schema lives in [server/sql/schema.sql](server/sql/schema.sql) (`users` table: username, bcrypt `password_hash`, `display_name`, timestamps); [server/src/db/init.ts](server/src/db/init.ts) applies it (`npm run init-db`, or automatically on `npm run dev`/`start`). Routes: `POST /api/auth/register` and `POST /api/auth/login` in [server/src/routes/auth.ts](server/src/routes/auth.ts), returning a signed JWT. Configure via `server/.env` (see `.env.example`) — the frontend does not yet call this API; it's a standalone service.
- **Audio playback and reading progress are simulated**: `playing`/`pct` drive a `setInterval` that fakes hymn playback progress and passage streak state (`read`) is in-memory only, not backed by real audio or a real clock — don't assume `TODAY.dateLong` or streak values are computed from the real date.

## Styling

- Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.*`; theme tokens (colors, font, radius, animation) are defined in the `@theme` block in [src/index.css](src/index.css).
- Design system is "Modernist": flat (radius 0 everywhere), 2px `border-ink` borders as the primary visual structure, an `accent` red scale, and an `ash` neutral scale (named `ash` instead of overriding Tailwind's built-in `neutral`).
- Buttons are unstyled by Tailwind's Preflight-equivalent reset in `@layer base` (font/color/background/border stripped) specifically so utility classes always win — keep new base-layer CSS inside `@layer base` for the same reason.
