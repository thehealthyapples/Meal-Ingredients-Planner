# BENCH1 — Benchmark Households JSON Regression

**Status:** ✅ Complete — Benchmark Households admin API registered and verified returning JSON
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Scope:** Bug fix (missing route registration). No benchmark redesign, no data-model change.
**Related:** [`AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md`](../../investigations/platform/AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md) (documented the "pages exist but have no registered routes" class of regression)

---

## 1. Executive summary

`/admin/benchmark-households` loaded but immediately failed with:

```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Root cause:** the Admin → Benchmark Households API (`/api/admin/benchmark-households*`) was **never registered** in `server/routes.ts`. The page (`admin-benchmark-households-page.tsx`) and the benchmark module (`server/benchmark/`) both existed and shipped in commit `0b1f2f7`, but the HTTP glue that wires them together was missing — a grep for `benchmark` in `server/routes.ts` returned **zero** matches.

With no matching route, the request fell through to the SPA catch-all in `server/vite.ts:35` (`app.use("/{*path}", …)`), which returns `index.html` with **HTTP 200** and `Content-Type: text/html` for any unmatched path — including `/api/*`. The frontend's `res.json()` then choked on the leading `<` of `<!DOCTYPE …>`.

**The exact request returning HTML:** the page-mount list query
`GET /api/admin/benchmark-households` (`admin-benchmark-households-page.tsx:104`). Every other benchmark endpoint the page and its app-mounted impersonation banner call was equally unregistered.

**Note on the AUDIT1 probe.** AUDIT1 recorded `200 /api/admin/benchmark-households` and read it as "route healthy". That `200` was the SPA `index.html` body, not a real API response — the probe's "200 = healthy" heuristic was fooled by the catch-all. This fix is what actually makes that endpoint healthy.

**Fix:** register the missing routes in `server/routes.ts`, wiring the **already-existing** `server/benchmark/` public API (fixtures + deterministic seeder) and the `server/tests/benchmark/` execution engine. No benchmark logic, scoring, questions, or data model was touched.

---

## 2. Root cause detail

| Layer | State before fix |
|---|---|
| Frontend page (`admin-benchmark-households-page.tsx`) | ✅ Present — fetches `/api/admin/benchmark-households*` |
| Impersonation banner (`benchmark-impersonation-banner.tsx`, mounted app-wide) | ✅ Present — fetches `/api/benchmark-impersonation*` |
| Benchmark module (`server/benchmark/index.ts`) | ✅ Present — exports `listBenchmarkHouseholdStates`, `getBenchmarkHouseholdDetail`, `seedBenchmarkWorld`, `resetBenchmarkHousehold`, `resolveBenchmarkOwner`, … |
| Execution engine (`server/tests/benchmark/index.ts`) | ✅ Present — `runBenchmark`, `makeCompanionTurnRunner`, `saveRun` |
| **HTTP routes (`server/routes.ts`)** | ❌ **Absent** — no `/api/admin/benchmark-households*` handlers registered |
| SPA catch-all (`server/vite.ts:35`, `static.ts:17`) | Returns `index.html` (200, `text/html`) for the unmatched API paths |

The CLI script `server/scripts/intq7-run-full-benchmark.ts:7` even documents itself as *"Mirrors POST /api/admin/benchmark-households/run-benchmark exactly (server/routes.ts)"* — a route that the codebase referred to but never actually contained.

---

## 3. What was changed

**One file:** `server/routes.ts` — a single new block inserted alongside the other admin routes (after the Knowledge Review block, before the Scan section). It adds no new benchmark behaviour; it only exposes the existing module functions over HTTP.

Every endpoint re-asserts the DEV-only guard (`assertBenchmarkWorldAllowed()`), matching the invariant the seeder already enforces (the world refuses to touch production). Modules are loaded via **dynamic `import()`** inside the handlers, matching the lazy-load pattern used throughout `routes.ts` (e.g. the conversation and knowledge-review routes) so server startup pays no cost for DEV-only tooling.

| Method & path | Guard | Backing function |
|---|---|---|
| `GET /api/admin/benchmark-households` | `assertAdmin` | `listBenchmarkHouseholdStates()` → `{ version, households }` |
| `GET /api/admin/benchmark-households/:id` | `assertAdmin` | `getBenchmarkHouseholdDetail(id)` |
| `POST /api/admin/benchmark-households/seed` | `assertAdmin` | `seedBenchmarkWorld()` |
| `POST /api/admin/benchmark-households/run-benchmark` | `assertAdmin` | `resetBenchmarkHousehold` + `runBenchmark` (one Companion seam) + `saveRun`, per household → `{ runs }` |
| `POST /api/admin/benchmark-households/:id/reset` | `assertAdmin` | `resetBenchmarkHousehold(id)` |
| `POST /api/admin/benchmark-households/:id/impersonate` | `assertAdmin` | `resolveBenchmarkOwner(id)` + `req.login` |
| `GET /api/benchmark-impersonation` | session | reads `req.session.benchmarkImpersonation` |
| `POST /api/benchmark-impersonation/stop` | session | restores original admin via `req.login` |

### Design notes

- **Response shapes mirror the page's TypeScript interfaces** (`ListResponse`, `HouseholdDetail`, `RunSummary`). The `run-benchmark` handler maps the engine result exactly as the CLI script does: `headline ← result.headline.score`, `honestGapRate`, `gatesFired`, `questionsScored ← result.headline.*`, `verdict ← result.releaseReadiness.verdict`.
- **Impersonation** stores `{ adminUserId, benchmarkHouseholdId }` on the session, then `req.login`s the benchmark owner. Return-to-admin restores the original admin. Because Passport 0.6+ regenerates the session on `logIn`, both calls pass `{ keepSessionInfo: true }` so the impersonation marker survives. The two `/api/benchmark-impersonation*` routes are **not** `assertAdmin`-gated — during impersonation the session user is the benchmark owner (role `user`), and gating them would trap the operator with no way back.
- **`run-benchmark` guards before the heavy import:** `assertBenchmarkWorldAllowed()` runs before `import("./tests/benchmark/index.js")`, so a production call returns the clean DEV-only message rather than pulling in the execution engine.
- `req.params.id` is typed `string | string[]` in this project; each use is coerced with `String(...)`, matching the existing Knowledge Review routes.

---

## 4. Verification

TypeScript: `tsc --noEmit` reports **no new errors in `server/routes.ts`** (pre-existing `companionPersonality` / `downlevelIteration` errors in the benchmark scripts and tests are untouched and out of scope).

Runtime (throwaway instance on port 5057, to avoid disrupting the managed dev server):

| Check | Before | After |
|---|---|---|
| `GET /api/admin/benchmark-households` (unauthenticated) | `200 text/html` (SPA `index.html` — the bug) | `403 application/json` `{"message":"Admin access required"}` |
| `GET /api/benchmark-impersonation` | `200 text/html` | `200 application/json` `{"impersonating":false}` |

Direct exercise of the exact function the list route calls (`listBenchmarkHouseholdStates()` + `BENCHMARK_WORLD_VERSION`):

```
version: 1.0.0 | households: 10 | first id: BW01 | seeded: 10
JSON ok, bytes: 8502
```

This is precisely the `{ version, households }` shape the page's `ListResponse` expects. The `200 text/html` → `403/200 application/json` transition confirms the routes are now registered and the `"Unexpected token '<'"` failure is resolved: an authenticated admin now receives the household list as JSON.

---

## 5. Constraints honoured

- **No benchmarking redesign.** No change to scoring, questions, the execution engine, or the one-Companion-seam invariant.
- **No benchmark data-model change.** No schema edits; the seeder and fixtures are untouched.
- **No unrelated admin pages touched.** The change is confined to the benchmark route block in `server/routes.ts`.
- **Smallest cause only.** The defect was missing route registration; the fix registers the routes and nothing more.
