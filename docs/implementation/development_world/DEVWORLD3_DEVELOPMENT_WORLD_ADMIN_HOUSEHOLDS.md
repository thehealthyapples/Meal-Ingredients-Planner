# DEVWORLD3 — Development World Admin Households

**Status:** IMPLEMENTED (DEV only).
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Classification:** Platform Governance × Development World — dev-only, **read-only** admin surface.
**Governing documents read first:** `docs/architecture/README.md` (Architecture Bootstrap) and its Platform/Intelligence governance set.
**Predecessors implemented against:**
`docs/implementation/development_world/DEVWORLD2_DEVELOPMENT_WORLD_IMPORT.md` (the importer that seeded the 50 households this page displays) and its investigations `DEVWORLD1`/`DEVWORLD2`.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| HEAD at start | `8e10ea32f41a6275d1fb1bc115be588ff8195a3d` (unchanged — nothing committed) |
| **Rollback tag** | `rollback/before-devworld3-development-world-admin-20260710` (at HEAD `8e10ea3`) |
| Code modified | Additive only (new module + new pages) plus three small insertions (one admin card, two `App.tsx` routes, six route lines) |
| Schema modified | None |
| Migrations added | None |
| DEV database written | **None** — this feature only reads |

**Rollback (code):** `git checkout rollback/before-devworld3-development-world-admin-20260710 -- .` then delete the untracked new files listed in §Files changed (a tag does not remove untracked files).

There is **no database rollback** because DEVWORLD3 writes nothing — it is a read-only view over the world DEVWORLD2 already imported.

---

## 1. Mission

Create a new **Development World** administration page in Admin. It displays the 50 Development World households imported by DEVWORLD2, with per-household summary, search / sort / filter, and a read-only detail page for each household.

Hard constraints from the brief:

- **Read-only.** No editing.
- **No impersonation** (deliberately not implemented — a later DEVWORLD may add it).
- **DEV only.** No production impact.
- **Reuse existing services and existing Development World data.** Do not duplicate Benchmark World code where shared components can be reused.

## 2. What was built

### 2.1 Server — a read-only reader over the existing world (no seeder, no writes)

`server/development-world/world-reader.ts` + `server/development-world/index.ts`.

The reader is deliberately the **read-only half** of the DEVWORLD2 importer / Benchmark `world-seeder`. It shares their exact discipline:

- **Same canonical dataset** — it reads `data/development_world/development_world_foundation_50.v1.json` (the file DEVWORLD2 imported from), parsed once and cached in module scope.
- **Same identity resolution** — a household's live state is resolved by its **deterministic owner username** and `getHouseholdForUser`, exactly as `listBenchmarkHouseholdStates` / the importer do. No new identity space.
- **Same live-snapshot query pattern** — the detail endpoint counts live members / eaters / pantry / planner / diary / evidence / learning-signals with the **same queries** `getBenchmarkHouseholdDetail` uses (reused verbatim in shape), so the page never invents a second source of truth.
- **Same DEV-only guard** — every entry point calls `assertDevelopmentWorldAllowed()` (refuses `NODE_ENV=production`, no override), mirroring `assertBenchmarkWorldAllowed()`.
- **It owns no write path at all.** There is no seed/reset/impersonate — those live in the importer script and are out of scope by the brief.

Public API (`server/development-world/index.ts`):

| Export | Purpose |
|---|---|
| `DEVELOPMENT_WORLD_VERSION` | world version string from the dataset |
| `assertDevelopmentWorldAllowed()` | DEV-only guard |
| `listDevelopmentWorldHouseholdStates()` | all 50 households: summary + authored statistics + live seeded status |
| `getDevelopmentWorldHouseholdDetail(id)` | one household: full fixture spec + live DB snapshot + validation status |

### 2.2 Server — two read-only routes

In `server/routes.ts`, next to the Benchmark World routes:

- `GET /api/admin/development-world` → `{ version, validation, households }`
- `GET /api/admin/development-world/:id` → `{ state, fixture, live, validation }`

Both are `assertAdmin`-guarded and re-assert the DEV-only guard. **There are no POST routes** — nothing can be mutated through this surface.

### 2.3 Client — Admin card + list page + detail page

- **Admin card** "Development World" added to `client/src/pages/admin-page.tsx` (`ADMIN_SECTIONS`), routing to `/admin/development-world`.
- **List page** `client/src/pages/admin-development-world-page.tsx` — the 50 households in a table with, per household: Household ID (DW###), name, members, household type, subscription tier, companion personality, planner / pantry / diary statistics, evidence event count, cold-start indicator, last import/reset timestamp. Supports search, sort, and filters (household type, subscription tier, companion personality, cold-start). Reuses the same shadcn `Card`/`Table`/`Badge`/`Select`/`Input` primitives as the Benchmark page.
- **Detail page** `client/src/pages/admin-development-world-household-page.tsx` at `/admin/development-world/:id` — read-only: household summary, members, eaters, planner overview, pantry summary, cookbook references, diary summary, evidence summary, validation status. No edit control, no impersonate control.
- **Routes** registered in `client/src/App.tsx` (wrapped in the shared `withAdminBanner` chrome, like every other admin page).

## 3. Read-only & no-impersonation (proven by construction)

- The server module exports **no** seed/reset/impersonate/write function; the routes are **GET-only**; the client pages render no mutating control and issue no `POST`/`PUT`/`DELETE`.
- Impersonation is intentionally absent — no `/impersonate` route, no impersonate button, no banner wiring.

## 4. Reuse (no duplication of Benchmark World code)

| Concern | Reused from | How |
|---|---|---|
| Canonical world data | `data/development_world/…json` | read the same file DEVWORLD2 imported |
| Identity → live household | `server/lib/household.getHouseholdForUser`, `storage.getUserByUsername` | same resolution as `world-seeder` |
| Live snapshot counts | `getBenchmarkHouseholdDetail` query shape | same drizzle queries, read-only |
| DEV-only guard | `assertBenchmarkWorldAllowed` pattern | mirrored as `assertDevelopmentWorldAllowed` |
| UI primitives | shadcn `ui/*`, `admin-page` card pattern, `withAdminBanner` | shared components, not forked |

No Benchmark seeder/fixtures code was copied — the reader is a new, smaller, read-only module over a *different* dataset that happens to share the resolution and query patterns.

## 5. Statistics shown

- **List page statistics** are the **authored canonical figures** derived from the dataset (planner entries, pantry items, diary entries + metric days, evidence events, eaters) — always available and stable, matching `manifests/coverage_summary.json`. Each row also shows whether the household is currently **seeded** in this DEV database and its **last import/reset timestamp** (from the `development_world:<id>:last_reset_at` site setting DEVWORLD2 stamps).
- **Detail page** additionally shows the **live DB snapshot** (members / eaters / pantry / planner / diary / evidence / learning signals) beside the authored figures — the same fixture-vs-live comparison the Benchmark detail uses — so an operator can see whether a household's live state matches its canonical spec.

## 6. Validation results

- **Reader exercised against the live DEV DB** — `listDevelopmentWorldHouseholdStates()` returned all **50** households (world `v1.0.0`, validation `valid=true`, `0` violations, `328` meal refs). DW001 resolved seeded=true with a live snapshot; the single cold-start household is DW050. Owner-tier spread `{premium:30, friends_family:7, free:13}` (= 50) and companion-personality spread `{companion:13, teacher:7, coach:9, friend:10, sergeant:4, chef:7}` match `manifests/coverage_summary.json`.
- **Detail exercised** — `getDevelopmentWorldHouseholdDetail("DW001")` returned 2 accounts, 4 eaters, 15 pantry items, 47 cookbook refs, a non-null live snapshot, and the world/household validation block.
- **DEV-only guard proven** — `NODE_ENV=production` → `assertDevelopmentWorldAllowed()` throws "Development World admin is DEV-only. Refusing to touch a production environment."
- **Routes registered & guarded** — server boots clean; `GET /api/admin/development-world` and `/:id` return **HTTP 403 "Admin access required"** without an admin session (proving registration + `assertAdmin` + that the dynamic module import resolves at runtime). No `DevelopmentWorld` errors in the server log.
- **Read-only proven by construction** — `grep` confirms **no** POST/PUT/DELETE/PATCH routes for `development-world`; the module exports no write function; the client pages issue only GETs and render no edit/impersonate control.
- **Typecheck** — `tsc --noEmit` reports **zero** errors in any DEVWORLD3 file (the pre-existing repo-wide errors are all in unrelated files and predate this change).

## 7. Honest gaps

| ID | Gap | Why honest, not faked |
|---|---|---|
| G-LIVE | List-page statistics are the **authored** figures, not live per-row DB counts. | Computing a full live snapshot for all 50 rows on every list load is 50×~8 queries; the authored figures are the canonical spec and match `coverage_summary.json`. The **detail** page shows the live snapshot per household. Seeded status + last-reset **are** live on the list. |
| G-NOWRITE | No seed/reset/impersonate from this page. | The brief scopes DEVWORLD3 to read-only. Seeding remains `scripts/import-development-world.ts`; impersonation is explicitly deferred. |
| G-UNWRITTEN | `persona.*`, `qualityPurpose`, eater `ageYears`, cookbook segmentation live in the dataset but not (all) in DB. | Inherited from DEVWORLD2's honest gaps — the detail page reads them from the **fixture** (canonical narrative) and labels the cookbook segmentation as a validated-but-unpersisted reference set, never claiming a DB row exists. |

## 8. Architecture compliance

- **Reuses production/existing services** — no parallel schema, no second identity space; a Development World household is resolved exactly as everywhere else.
- **One owner per fact** — the reader owns no fact; the dataset owns the canonical spec, the DB owns live state, and the page only displays them.
- **No fabricated knowledge** — unwritten authored intent is shown from the fixture and labelled; live counts come straight from the DB.
- **Not an AI implementation** — creates no capability, intent, prompt or context view.

## 9. Data impact

| Question | Answer |
|---|---|
| Production data affected? | **No.** DEV-only assert with no override; read-only. |
| DEV data written? | **No.** No write path exists in this feature. |
| Schema changed? | No. |
| Migration added? | No. |

---

## Files changed

- **Added** `server/development-world/world-reader.ts`
- **Added** `server/development-world/index.ts`
- **Added** `client/src/pages/admin-development-world-page.tsx`
- **Added** `client/src/pages/admin-development-world-household-page.tsx`
- **Added** `docs/implementation/development_world/DEVWORLD3_DEVELOPMENT_WORLD_ADMIN_HOUSEHOLDS.md` (this file)
- **Modified** `server/routes.ts` — two GET routes
- **Modified** `client/src/pages/admin-page.tsx` — one admin card
- **Modified** `client/src/App.tsx` — import + two routes + two chrome wrappers

## Validation

See §6 — all checks passed: 50 households read from the live DEV DB, detail + live snapshot correct, DEV-only guard refuses production, routes registered and admin-guarded (403 without auth), no mutating routes exist, and `tsc` is clean for every DEVWORLD3 file.
