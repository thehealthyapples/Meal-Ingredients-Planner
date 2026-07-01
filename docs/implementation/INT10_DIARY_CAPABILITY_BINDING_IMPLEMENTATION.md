# INT10 — Diary Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT10

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int10-rollback-pre-diary-binding` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | `server/intelligence/handlers/diary-read-port.ts` (new), `server/intelligence/handlers/diary-read-handler.ts` (new), `server/intelligence/bindings/diary.ts` (new), `server/intelligence/intelligence-platform.ts` (edited), `server/intelligence/index.ts` (edited), `server/intelligence/README.md` (edited), `server/tests/test-intelligence-diary-binding.ts` (new), `server/tests/test-intelligence-pantry-binding.ts` (scope-lock update), `package.json` (edited) |
| Schema modified | None |

---

## ARCHITECTURE BOOTSTRAP (gate)

[x] Read `docs/architecture/README.md` and all six governing documents.

---

## FILL-IN TEMPLATE (completed before any code)

| Field | Value |
|---|---|
| **Capability ID** | `diary` — matches `server/intelligence/capability-registry.ts` exactly |
| **Capability name** | Diary |
| **Owner service** | `server/storage.ts` — `getFoodDiaryDay`, `getFoodDiaryEntries`, `getFoodDiaryMetrics` |
| **Source of Truth** | SoT D21 — `food_diary_days / food_diary_entries / food_diary_metrics` tables |
| **Access scope** | Own-data only (user-scoped — `userId` is the access boundary on all owner methods) |
| **Supported read intents** | `read`, `explain` (from registry: `["read", "explain", "add", "delete", "import"]`) |
| **Executable intents** | `read`, `explain` |
| **Allowed scopes** | `day` (diary day header + all logged entries for a date) |
| **Honest gaps** | No diary day for the date; no stored wellness metrics for the date; missing `date` param; unsupported scope; all write verbs (`add`, `delete`, `import`) |
| **Permission model** | `requireUserId` — all owner methods take `userId` as their access key; the owner's queries are scoped to that user's rows; cross-user access is structurally impossible |
| **Port methods** | `getFoodDiaryDay(userId, date)` → `storage.getFoodDiaryDay(userId, date)`; `getFoodDiaryEntries(userId, date)` → `storage.getFoodDiaryEntries(userId, date)`; `getFoodDiaryMetrics(userId, date)` → `storage.getFoodDiaryMetrics(userId, date)` |
| **Handler responsibilities** | `read/day`: day header + entries for a date; gap if no day logged. `explain`: stored wellness metrics for a date; gap if no metrics stored. |
| **Binding registration** | `DIARY_EXECUTABLE_INTENTS = ["read", "explain"]` |
| **Data impact** | Reads only — no writes, no schema changes, no backfill |
| **Trust rules** | Never fabricate diary entries, nutritional values, weight, BMI, mood, sleep, or energy values; surface only what the owner stored; `source` field always present in results |

---

## ARCHITECTURE COMPLIANCE

### Core Architecture

| Check | Status |
|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS — `bindDiaryReadCapability(intelligencePlatform)` calls the singleton; no second platform constructed |
| One Capability Registry — binding to the existing `diary` entry, no new registry | ✅ PASS — `diary` was already seeded in `SEED_CAPABILITIES` with `availability: "registered"` |
| One Intent Engine — unchanged routing; no second engine | ✅ PASS — no changes to `intent-engine.ts` |
| Owner remains owner — handler delegates every read; holds no business logic of its own | ✅ PASS — all reads delegate to port methods; no filtering, sorting, or calculation in the handler |
| No duplicate state — no parallel store, no cached copy of owner data | ✅ PASS — handler is stateless; no caching |
| Existing architecture extended only — reuses the `registerHandler` seam (INT1 extension point) | ✅ PASS |

### AI Architecture

| Check | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ PASS |
| Uses the AI Capability Registry (binds the existing `diary` capability) | ✅ PASS |
| Uses the Intent Engine (full pipeline) | ✅ PASS |
| Reuses the existing owner service (via the port) | ✅ PASS — `storage.getFoodDiaryDay`, `getFoodDiaryEntries`, `getFoodDiaryMetrics` |
| Does not create another assistant | ✅ PASS |
| Does not duplicate conversation state | ✅ PASS |
| Uses registered capabilities only | ✅ PASS |
| Permission-aware access | ✅ PASS — `requireUserId` at handler entry |
| Produces honest gaps rather than fabricated knowledge | ✅ PASS — every null/missing-data case gaps; no invented entries or metrics |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/diary-read-port.ts`)

Narrow read-only delegation surface — three methods, 1:1 forwards to the storage owner:

| Port method | Owner delegation |
|---|---|
| `getFoodDiaryDay(userId, date)` | `storage.getFoodDiaryDay(userId, date)` |
| `getFoodDiaryEntries(userId, date)` | `storage.getFoodDiaryEntries(userId, date)` |
| `getFoodDiaryMetrics(userId, date)` | `storage.getFoodDiaryMetrics(userId, date)` |

Production factory (`createStorageDiaryReadPort`) uses dynamic imports; no database connection opens at import time. Interface is injectable for tests.

### Handler (`server/intelligence/handlers/diary-read-handler.ts`)

Fifth execution handler. Two live verb paths:

**`read` (scope `"day"`):** Requires `{ date, scope: "day" }`. Fetches diary day header via `getFoodDiaryDay`; gaps if no day logged. Fetches entries via `getFoodDiaryEntries`. Returns `DiaryDayReadResult` (`scope`, `date`, `notes`, `entryCount`, `entries[]`, `source: "food-diary"`). Projection strips `userId`, `dayId`, `createdAt` from entries.

**`explain`:** Requires `{ date }`. Fetches stored wellness metrics via `getFoodDiaryMetrics`; gaps if no metrics stored. Returns `DiaryExplainResult` with `DiaryMetricsView` (`date`, `weightKg`, `bmi`, `moodApples`, `sleepHours`, `energyApples`, `stuckToPlan`, `notes`, `source: "food-diary-metrics"`). Strips `id`, `userId`, `customValues`, `createdAt` from projection.

Gap cases: unknown scope, missing `date` param, no diary day stored, no metrics stored, any write verb (`add`, `delete`, `import`).

### Binding (`server/intelligence/bindings/diary.ts`)

`bindDiaryReadCapability(platform, resolvePort?)` — one call registers the handler and flips `diary` from `registered` → `available` with `executableIntents: ["read", "explain"]`. Called once on the canonical singleton in `intelligence-platform.ts`.

---

## FILES CREATED / MODIFIED

| File | Change |
|---|---|
| `server/intelligence/handlers/diary-read-port.ts` | **New** — `DiaryReadPort` interface + `createStorageDiaryReadPort` factory |
| `server/intelligence/handlers/diary-read-handler.ts` | **New** — `createDiaryReadHandler` + result types + projections |
| `server/intelligence/bindings/diary.ts` | **New** — `DIARY_CAPABILITY_ID`, `DIARY_EXECUTABLE_INTENTS`, `bindDiaryReadCapability` |
| `server/intelligence/intelligence-platform.ts` | **Edited** — import + `bindDiaryReadCapability(intelligencePlatform)` call; docblock updated |
| `server/intelligence/index.ts` | **Edited** — exports for port, handler, binding, executable-intents constant, result types |
| `server/intelligence/README.md` | **Edited** — INT10 state section, module table row, architecture diagram, test section |
| `server/tests/test-intelligence-diary-binding.ts` | **New** — 56-assertion test suite (no live DB) |
| `server/tests/test-intelligence-pantry-binding.ts` | **Edited** — scope-lock assertion updated from 4 → 5 (and label updated) |
| `package.json` | **Edited** — `test:intelligence-diary-binding` script added; appended to `test` script |

---

## DATA IMPACT

| Reads existing data | ✅ Yes — `food_diary_days`, `food_diary_entries`, `food_diary_metrics` via existing storage methods |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| Never fabricate diary entries | `getFoodDiaryDay` returns null → `gap()`; no invented records ever returned |
| Never fabricate wellness metrics | `getFoodDiaryMetrics` returns null → `gap()`; no default values substituted |
| `source` always present | `DiaryDayReadResult.source = "food-diary"` and `DiaryMetricsView.source = "food-diary-metrics"` are constants in the projection functions |
| Internal fields never surfaced | `userId`, `dayId`, `id`, `createdAt`, `customValues` are all stripped from projected types |
| No cross-user access | All port methods take `userId`; owner queries are user-scoped; no household routing (diary is user-scoped, not household-scoped) |

---

## TESTING

**Test file:** `server/tests/test-intelligence-diary-binding.ts`
**Command:** `npm run test:intelligence-diary-binding`
**Result: 56 passed, 0 failed**

| Section | Assertions | Result |
|---|---|---|
| Capability lookup (five live capabilities, scope lock) | 6 | ✅ |
| Permission validation (anonymous → denied) | 3 | ✅ |
| Handler invocation + delegation — read day scope | 13 | ✅ |
| Handler invocation + delegation — explain (metrics) | 11 | ✅ |
| Honest gaps (no day, bad scope, missing date, no metrics) | 10 | ✅ |
| Unsupported intent (share, search → unsupported_intent) | 2 | ✅ |
| Read-only enforcement (add/delete/import confirmed → gap) | 5 | ✅ |
| Trust rules (no fabrication, projection safety) | 4 | ✅ |
| **Total** | **56** | ✅ |

**Updated test:** `server/tests/test-intelligence-pantry-binding.ts` — scope-lock assertion updated from 4 → 5; **47 passed, 0 failed**.

---

## SCOPE LOCK

INT10 is **read-only**. What was NOT built:

- No `add` diary entry path — no code path reaches diary mutations
- No `delete` diary entry path — no code path reaches diary deletions
- No `import` path — no planner-to-diary copy logic exposed
- No nutritional totals or calculated summaries — `getFoodDiaryMetrics` surfaces stored values only; no arithmetic in the handler
- No cross-date range reads — one date at a time only, matching the owner's read API
- No `getFoodDiaryMetricsTrends` method in the port — trends require multi-date reads outside this binding's scope
- No `getOrCreateFoodDiaryDay` — that method creates; port is read-only by construction

---

## DEFINITION OF DONE

| Item | Status |
|---|---|
| Rollback tag created before any code written | ✅ `int10-rollback-pre-diary-binding` → `a5294f8` |
| Architecture bootstrap read | ✅ |
| Fill-in template completed from codebase evidence | ✅ |
| Architecture compliance gate PASS | ✅ |
| Port file created (`diary-read-port.ts`) | ✅ |
| Handler file created (`diary-read-handler.ts`) | ✅ |
| Binding file created (`diary.ts`) | ✅ |
| `intelligence-platform.ts` updated (import + call) | ✅ |
| `index.ts` exports updated | ✅ |
| Test file created and passing (56/56) | ✅ |
| Previous binding scope-lock updated (pantry 4 → 5, 47/47) | ✅ |
| `test:intelligence-diary-binding` script added to `package.json` | ✅ |
| `test` script in `package.json` updated | ✅ |
| `README.md` updated (module table, architecture diagram, state section, test section) | ✅ |
| Implementation report saved | ✅ |
| `diary` capability `availability` is `"available"` on canonical singleton | ✅ |
| `executableIntents` is truthful: `["read", "explain"]` only | ✅ |
| No database connection opened at import time (dynamic imports) | ✅ |
| No business logic in the handler | ✅ |
| No write methods on the port interface | ✅ |
