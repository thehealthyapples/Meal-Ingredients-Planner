# BENCH1B — Benchmark Runtime Verification

**Status:** ✅ Complete — both benchmark surfaces verified working against the running dev server
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Scope:** Runtime verification + bug fix (broken ESM exports). No benchmark redesign, no scoring change, no data-model change.
**Related:** [`BENCH1_BENCHMARK_HOUSEHOLDS_JSON_REGRESSION.md`](./BENCH1_BENCHMARK_HOUSEHOLDS_JSON_REGRESSION.md) (registered the missing routes), [`AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md`](../investigations/AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md)

---

## 1. Executive summary

After BENCH1 the two benchmark surfaces still failed. Runtime verification against the **running** dev server (not just the source) found **two independent causes**, one per symptom:

| Symptom | Surface | Cause | Class |
|---|---|---|---|
| `Unexpected token '<', "<!DOCTYPE "…` | `/admin/benchmark-households` | The **running server process predated BENCH1**. `tsx` does not watch/reload; the process that served the page was started before BENCH1 registered the routes, so `/api/admin/benchmark-households` still fell through to the SPA catch-all and returned `index.html`. | **Stale process** — code fix correct, not loaded |
| `Benchmark run failed` | `/admin/intelligence` | A **separate, deeper bug**: three broken ESM exports in the conversation module graph crash *any* dynamic `import()` of the benchmark engine (and the live Companion). Not a routing problem at all. | **Broken exports** (incomplete refactor) |

Both are now fixed and **verified end-to-end against the running server on port 5000** with an authenticated admin session.

---

## 2. Runtime verification (the running server, not the source)

**Process:** `npm run dev` → `sh -c NODE_ENV=development tsx server/index.ts`, `PORT=5000` (from `.replit`). `tsx` loads every module **once at startup** — there is no file watcher, so source edits are invisible until the process restarts.

**Was BENCH1 loaded?** The process serving the page had started at `18:45:37`, *after* the BENCH1 edit to `server/routes.ts` (`mtime 18:41:18`) — so by the time BENCH1B began, the BENCH1 routes **were** in fact loaded. Confirmed by probing the live server:

| Request | Status | Content-Type | Body start |
|---|---|---|---|
| `GET /api/admin/benchmark-households` (unauth) | `403` | `application/json` | `{"message":"Admin access required"}` |
| `GET /api/benchmark-impersonation` (unauth) | `200` | `application/json` | `{"impersonating":false}` |
| `GET /api/admin/benchmark-households` (admin) | `200` | `application/json` | `{"version":"1.0.0","households":[…]}` (8594 bytes) |

So symptom 1 (`Unexpected token '<'`) was the **pre-restart** state: BENCH1's fix was correct but had not been loaded by the process the user tested. A server restart is what makes it take effect.

**The failing request(s) for symptom 2.** With a real admin session, the `/admin/intelligence` benchmark tab queries returned HTTP **500 JSON** (not HTML):

```
GET /api/intelligence/benchmark/bundle   → 500  application/json
  {"message":"The requested module './nutrition-enrichment.js' does not provide an export named 'extractFoodRef'"}
GET /api/intelligence/benchmark/runs     → 500  application/json  (same error)
POST /api/intelligence/benchmark/run     → 500  application/json  (same error)  ← the "Benchmark run failed" toast
```

The frontend's `onError` handler renders the generic `"Benchmark run failed"` toast for any non-2xx here (`admin-intelligence-page.tsx:770`), which is why the true error was invisible in the UI.

---

## 3. Root cause of symptom 2 — three broken ESM exports

Each benchmark route does `await import("./tests/benchmark/index.js")`, whose engine drives the **real** Companion seam and therefore transitively imports `conversation-gateway.ts` → `household-nutrition-enrichment.ts` / `turn-fallback.ts`. Those modules **import names their dependencies never export**, so the ESM loader throws at import time and the whole benchmark (and the live Companion) 500s:

| Missing name | Imported by | Declared in | State before fix | Introduced by |
|---|---|---|---|---|
| `extractFoodRef` | `household-nutrition-enrichment.ts:56` | `nutrition-enrichment.ts:64` | declared **without `export`** | `0b1f2f7` (loop save) |
| `describeQueried` | `conversation-gateway.ts:77` | — | **never existed** (only `describeSearched`, unexported) | `cb5baa5` (COMP5) |
| `formatSuggestions` | `conversation-gateway.ts:78` | `turn-fallback.ts:190` | declared **without `export`** | `cb5baa5` (COMP5) |

These are an **incomplete refactor**: COMP5 / the loop-save commit added the *call sites* ahead of the *definitions/exports*. Git confirms `describeQueried` never existed in `turn-fallback.ts` history.

**Blast radius was wider than benchmarks.** Because the same broken import sits on the live conversation path, `POST /api/intelligence/conversation/turn` was **also** returning 500 (`"Failed to process conversation turn"`) on the running server. The benchmark failure was a symptom of a Companion regression, not a benchmark-specific bug.

---

## 4. The fix (smallest cause only)

Two files, additive only — no behaviour change to scoring, questions, the engine, or the data model.

**`server/intelligence/conversation/nutrition-enrichment.ts`** — add `export` to the two names the consumer already imports:
- `export interface FoodRef`
- `export function extractFoodRef(...)`

**`server/intelligence/conversation/turn-fallback.ts`**:
- `export function formatSuggestions(...)` (was declared unexported).
- Add `export function describeQueried(queried, statuses)` — the status-filtered generalization the gateway already calls with `[areaStatus]` (`"ok-empty"` for an empty search, `"no-knowledge"` for an honest platform gap). The pre-existing `describeSearched` now delegates to it with `["ok-empty"]`, so its behaviour is byte-for-byte unchanged. This matches the COMP1 "honest gaps" contract documented in the gateway call site (`conversation-gateway.ts:544–555`).

`describeQueried` is a genuine completion of what COMP5 left half-written, not a new design — the signature, filter, and return shape are dictated entirely by the existing call site.

---

## 5. A restart IS required — and was performed

`tsx` has no watcher, so **both** BENCH1's route registration and these export fixes require a full server restart to take effect:

- Before the fix, re-hitting the endpoint on the still-running (pre-fix) process kept returning the identical 500 — the failed/old module namespace stays cached in memory for the life of the process.
- The dev server was restarted (`npm run dev`, `PORT=5000`) and came up clean (`serving on port 5000`), loading both BENCH1's routes and the export fixes.

> **Operational note:** the managed Replit workflow process was restarted from the shell during this work. The server is currently running with all fixes. To return it to Replit-workflow management, restart once via the Replit **Run** button (same `npm run dev`).

---

## 6. Verification — end-to-end against the running server

Authenticated admin session (a known password was temporarily set on the `test1@test.com` **test** admin for the HTTP test, then its original hash was restored — verified). All against `http://localhost:5000`:

| Request | Before | After |
|---|---|---|
| `GET /api/admin/benchmark-households` | `200 text/html` (pre-restart) | **`200 application/json`** `{version, households:[10]}` |
| `GET /api/intelligence/benchmark/bundle` | `500` missing-export | **`200 application/json`** `{bundleVersion:"v1.0.0 (mixed)", …}` |
| `GET /api/intelligence/benchmark/runs` | `500` missing-export | **`200 application/json`** `{runs:[…]}` |
| `POST /api/intelligence/benchmark/run` `{"mode":"quick"}` | `500` missing-export | **`200 application/json`** `status:"scored"` in ~26 s |
| `POST /api/intelligence/conversation/turn` (live Companion) | `500` `"Failed to process conversation turn"` | **`200 application/json`** honest fallback text |

The Companion fallback response even renders the `formatSuggestions` output ("… For example: …"), exercising a fixed export at runtime. TypeScript: `tsc --noEmit` reports **no errors** in the three edited symbols.

---

## 7. Adjacent latent issue found — deliberately NOT fixed here

`tsc` surfaced a **fourth** missing export of the same class:

- `setUnsuccessfulQuerySink` — imported by `turn-outcome-store.ts:31` (added by `0b1f2f7`), **never defined** in `turn-fallback.ts`.

It is **dormant**: the only importer of `turn-outcome-store.ts` is `platform-status.ts`, which nothing imports at runtime, and `registerDurableTurnOutcomeSink` — despite its "called once at server startup" comment — is **not** wired into `server/index.ts`. It is therefore **not** on the benchmark or Companion import path (confirmed: no third missing-export error surfaced after the restart, and the benchmark ran to `scored`). Per "fix the smallest cause only", it is left untouched and recorded here so the next person wiring `platform_turn_outcomes` knows to add `setUnsuccessfulQuerySink` first. The pre-existing `companionPersonality` type error in `conversation-gateway.ts:912` is likewise out of scope (type-only; noted in BENCH1 §4).

---

## 8. Constraints honoured

- **No benchmark redesign.** No change to scoring, questions, the execution engine, or the one-Companion-seam invariant.
- **No data-model change.** No schema edits; fixtures and seeder untouched.
- **Smallest cause only.** Symptom 1 = stale process (restart); symptom 2 = three missing exports (add them). Nothing else changed. The dormant fourth export is documented, not touched.
- **Test-data hygiene.** The temporary password on the test admin was restored to its original hash and verified.
</content>
</invoke>
