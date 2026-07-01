# INT26 — Meal Discovery Capability Binding (Phase 1 — Internal Sources) — Implementation

**Status:** COMPLETE  
**Date:** 2026-07-01  
**Workstream:** INT26 (Phase 1)  
**Produced using:** [INT7A Intelligence Capability Factory](../architecture/INTELLIGENCE_CAPABILITY_FACTORY.md) and the Port → Handler → Binding pattern proven by INT2–INT17.  

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Checkpoint | `913a0169a44eafc1e3846348b32daffde2c9bbce` (auto-created by platform on session end) |
| Code modified | `server/intelligence/handlers/meal-discovery-port.ts` (new), `server/intelligence/services/meal-discovery-engine.ts` (new), `server/intelligence/handlers/meal-discovery-handler.ts` (new), `server/intelligence/bindings/meal-discovery.ts` (new), `server/tests/test-intelligence-meal-discovery-binding.ts` (new), `server/intelligence/capability-registry.ts` (edited — `meal-discovery` SEED entry added), `server/intelligence/intelligence-platform.ts` (edited — import + bind call), `server/intelligence/pattern-intent-resolver.ts` (edited — discovery patterns split into `MEAL_DISCOVERY_MATCHERS` + new personal-library `MEALS_MATCHERS`), `server/intelligence/index.ts` (edited — new exports), `server/tests/test-intelligence-platform.ts` (scope-lock updated 13→14), `server/tests/test-intelligence-analyser-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-diary-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-household-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-meals-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-pantry-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-partners-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-profile-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-templates-binding.ts` (scope-lock updated 11→12), `server/tests/test-intelligence-registry-executability.ts` (added `MEAL_DISCOVERY_CAPABILITY_ID`/`MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS` import + includes assertion + count 11→12) |
| Schema modified | None |

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Port → Handler → Binding pattern reused exactly as established in INT2–INT17.
- [x] `meal-discovery` is a new capability entry in `capability-registry.ts` (not a re-use of the `meals` entry — these are distinct capabilities with distinct owners and distinct query surfaces).
- [x] `MealDiscoveryEngine` is NOT a new owner. It delegates to the existing storage owners (`getMeals`, `getSystemMeals`, `getMealTemplates`). It is a fan-out coordinator, not a data owner.
- [x] No new tables. No schema changes. No HTTP routes. No UI.
- [x] Phase 1 is internal sources only. All three sources (`meals`, `meal_templates`, system meals) already exist and are already owned by the storage layer.
- [x] Dynamic imports throughout — loading the Intelligence Platform never opens a database connection at module import time.

---

## DESIGN SUMMARY (from INT26 design doc)

The `meal-discovery` capability answers the question *"show me a recipe for X"* by fanning out across all internal recipe sources in a single pass, deduplicating personal-library results against THA system meals, and returning a ranked, capped list of `DiscoveryItem` objects — source-agnostic from the handler's perspective.

**Why a separate capability from `meals`?**  
The `meals` capability is the *personal cookbook owner* — it controls detail read, ownership enforcement, ingredient lists, and instructions. `meal-discovery` is a *cross-source discovery surface* — its primary job is breadth, not depth. In Phase 2 it will add external API sources (TheMealDB, BBC Good Food, etc.) as a second tier; keeping them in a separate capability prevents the meals handler from gaining external I/O responsibilities.

**Pattern intent routing split (INT26 + INT25B):**  
All five previously existing `MEALS_MATCHERS` discovery patterns (`"find me a recipe for X"`, `"search for a X recipe"`, noun-last, cook-with, something-with) were moved to the new `MEAL_DISCOVERY_MATCHERS` and route to `meal-discovery/search`. A new `MEALS_MATCHERS` block was added for explicit personal-library queries (`"search my meals for X"`, `"do I have any X meals?"`), which continue to route to `meals/search`.

---

## FILL-IN TEMPLATE

| Field | Value |
|---|---|
| Capability ID | `meal-discovery` |
| Capability name | Meal Discovery |
| Owner | `MealDiscoveryEngine` — delegates to `storage.getMeals`, `storage.getSystemMeals`, `storage.getMealTemplates` |
| Data read | `meals` table (user-owned + system), `meal_templates` table |
| Access scope | `ownershipScoped: true` — personal results are caller-scoped via `getMeals(userId)`; system meals and templates are globally readable by any authenticated user |
| Supported intents | `search`, `recommend` |
| Executable intents (Phase 1) | `search` only — `recommend` gaps pending a delegate-only ranking method on the engine |
| Allowed verbs | `search` |
| Honest gaps | Empty/blank `query` → gap. Missing `{ query }` → gap. `recommend` → gap (no ranking owner method). All verbs outside `supportedIntents` → `unsupported_intent` |
| Permission model | Authenticated users only (`requireUserId`). Anonymous → denied before port is touched |
| Port methods | `discover(query, userId)` — single method returning `DiscoveryItem[]` |
| Handler responsibility | Validate query, delegate to port, return `MealDiscoverySearchResult` |
| Binding registration | `MEAL_DISCOVERY_CAPABILITY_ID = "meal-discovery"`, `MEAL_DISCOVERY_EXECUTABLE_INTENTS = ["search"]` |
| Tests | 68 assertions — all passing |
| Schema changes | None |
| Trust rules | No nutrition fields. No fabricated results. No cross-user data. No write paths |

---

## ARCHITECTURE COMPLIANCE

| Constraint | Status | Evidence |
|---|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS | `bindMealDiscoveryCapability(intelligencePlatform)` appended to `intelligence-platform.ts`; no second platform |
| One Capability Registry — binding to a new `meal-discovery` entry, not a second registry | ✅ PASS | `MEAL_DISCOVERY_CAPABILITY_ID = "meal-discovery"` matches the new seed entry; no new registry; availability flips at runtime via `registerHandler` |
| One Intent Engine — unchanged routing logic | ✅ PASS | `IntentEngine` unchanged; only `pattern-intent-resolver.ts` updated (routing rules) |
| Owner remains owner — engine delegates every read; no business logic | ✅ PASS | Engine contains only match predicates (string inclusion checks) and structural merging. No ranking algorithm, no nutrition logic, no business rules |
| No duplicate state — no parallel store | ✅ PASS | No caching, no parallel store; reads pass through on every call via `Promise.allSettled` |
| Existing architecture extended only | ✅ PASS | `platform.registerHandler("meal-discovery", ...)` — the established extension point |

**AI Architecture Compliance:**

| Constraint | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ |
| Uses the AI Capability Registry (new `meal-discovery` entry) | ✅ |
| Uses the Intent Engine (full pipeline) | ✅ |
| Delegates reads to existing owners (storage) | ✅ |
| Does not create another assistant | ✅ |
| Does not duplicate conversation state | ✅ |
| Uses registered capabilities only | ✅ |
| Permission-aware access | ✅ — `requireUserId` fires before port is touched |
| Produces honest gaps rather than fabricated knowledge | ✅ — empty query, missing query, unsupported verb, `recommend` all gap honestly |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/meal-discovery-port.ts`)

Defines three public types:

- `DiscoveryItem` — a source-agnostic discovery result with `id` (composite `"sourceType:internalId"`), `name`, `sourceType` (`"personal" | "system" | "template"`), `sourceLabel`, `isAlreadySaved`, `importable` (always `false` in Phase 1), `internalId` (set for personal/system, absent for templates), and `dietTypes`.
- `MealDiscoverySearchResult` — the handler's result shape: `scope: "discovery"`, `query`, `totalCount`, `results`, `sourcesQueried`, `source: "meal-discovery"`.
- `MealDiscoveryPort` — the narrow surface the handler calls: one method `discover(query, userId): Promise<DiscoveryItem[]>`.

Also exports `templateToDiscoveryItem` (shared helper used by the engine) and `createProductionMealDiscoveryPort` (the production factory — dynamic imports of both engine and storage, so no DB connection at module load time).

### Engine (`server/intelligence/services/meal-discovery-engine.ts`)

`MealDiscoveryEngine` implements `MealDiscoveryPort`. It accepts a `MealDiscoveryStorage` interface (injectable for direct engine tests; real `storage` in production).

**Source fan-out:** `Promise.allSettled` across three sources. A failed source (rejected promise) is silently skipped — the engine never throws.

**Source 1 — Personal Library:** `getMeals(userId)` filtered by name substring match or any ingredient substring match (case-insensitive).

**Source 2 — THA System Meals:** `getSystemMeals()` filtered the same way. Name-normalised deduplication against personal results: if a system meal has the same normalised name as a personal result already in the list, it is skipped. Personal always wins.

**Source 3 — Meal Templates:** `getMealTemplates()` filtered by name, cuisine, description, or any styleTag substring match. Only `isActive` templates are included. Templates never participate in meal-name deduplication (different type).

**Cap:** `DISCOVERY_MAX_RESULTS = 15` applied after merging all three sources.

**`sourcesQueried`:** Built from which sources fulfilled (personal cookbook, the THA library, meal templates). Attached to the result array as a non-enumerable property `_sourcesQueried` for the handler to read via `getSourcesQueried()` without widening the port's return type.

### Handler (`server/intelligence/handlers/meal-discovery-handler.ts`)

`createMealDiscoveryHandler(resolvePort)` returns a `CapabilityHandler` that:

1. Calls `readOnlyVerbGuard(intent, ["search"], "Meal Discovery")` — all verbs except `search` gap immediately.
2. Calls `requireUserId(context, "Meal Discovery")` — anonymous → denied before port is touched.
3. Resolves the port once.
4. Validates `{ query }`: must be a string, trimmed length > 0 (gap with a non-empty-query message otherwise).
5. Calls `port.discover(rawQuery, userId)`.
6. Caps results to 15 (defensive — the engine also caps, but handler cap is the hard boundary).
7. Returns `MealDiscoverySearchResult`.

### Binding (`server/intelligence/bindings/meal-discovery.ts`)

- `MEAL_DISCOVERY_CAPABILITY_ID = "meal-discovery"`.
- `MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["search"]`.
- `bindMealDiscoveryCapability(platform, resolvePort?)` — production default is `createProductionMealDiscoveryPort`.

### Pattern Intent Resolver update (`server/intelligence/pattern-intent-resolver.ts`)

**Before INT26:** `MEALS_MATCHERS` contained 5 discovery patterns, all routing to `capability: "meals"`.

**After INT26:**

| Matcher array | Patterns | Routes to |
|---|---|---|
| `MEAL_DISCOVERY_MATCHERS` (new) | 5 patterns (find recipe for X, search for X recipe, noun-last, cook-with, something-with) | `meal-discovery/search` |
| `MEALS_MATCHERS` (redefined) | 2 patterns ("search my meals/cookbook for X", "do I have any X meals?") | `meals/search` |

`ALL_SPECIFIC_MATCHERS` updated to spread both arrays: `MEAL_DISCOVERY_MATCHERS` first (higher-priority discovery queries), then `MEALS_MATCHERS` (explicit personal-library queries).

---

## FILES CREATED / MODIFIED

### New files (5)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/meal-discovery-port.ts` | Port interface, `DiscoveryItem`/`MealDiscoverySearchResult` types, production factory |
| `server/intelligence/services/meal-discovery-engine.ts` | `MealDiscoveryEngine` — 3-source fan-out, deduplication, capping, `sourcesQueried` |
| `server/intelligence/handlers/meal-discovery-handler.ts` | Execution handler — verb guard, auth guard, query validation, delegation, result assembly |
| `server/intelligence/bindings/meal-discovery.ts` | Activation — registers handler + executableIntents on the singleton |
| `server/tests/test-intelligence-meal-discovery-binding.ts` | Test suite — 68 assertions |

### Edited files (13)

| File | Change |
|---|---|
| `server/intelligence/capability-registry.ts` | Added `meal-discovery` SEED entry (14 registered capabilities total) |
| `server/intelligence/intelligence-platform.ts` | Added `import { bindMealDiscoveryCapability }` + `bindMealDiscoveryCapability(intelligencePlatform)` call |
| `server/intelligence/pattern-intent-resolver.ts` | Replaced `MEALS_MATCHERS` (5 discovery patterns) with `MEAL_DISCOVERY_MATCHERS` (5 patterns → `meal-discovery`) + new `MEALS_MATCHERS` (2 personal-library patterns → `meals`); updated `ALL_SPECIFIC_MATCHERS` |
| `server/intelligence/index.ts` | Added exports for port types, handler, binding, executable-intents constant |
| `server/tests/test-intelligence-platform.ts` | Scope-lock updated from 13 → 14 (registered capabilities count) |
| `server/tests/test-intelligence-analyser-binding.ts` | Scope-lock updated 11 → 12; "eleven live" strings → "twelve live" |
| `server/tests/test-intelligence-diary-binding.ts` | Scope-lock updated 11 → 12 |
| `server/tests/test-intelligence-household-binding.ts` | Scope-lock updated 11 → 12 |
| `server/tests/test-intelligence-meals-binding.ts` | Scope-lock updated 11 → 12 |
| `server/tests/test-intelligence-nutrition-knowledge-binding.ts` | Scope-lock updated 11 → 12 |
| `server/tests/test-intelligence-pantry-binding.ts` | Scope-lock updated 11 → 12 |
| `server/tests/test-intelligence-partners-binding.ts` | Scope-lock updated 11 → 12 |
| `server/tests/test-intelligence-profile-binding.ts` | Scope-lock updated 11 → 12 |
| `server/tests/test-intelligence-templates-binding.ts` | Scope-lock updated 11 → 12 |
| `server/tests/test-intelligence-registry-executability.ts` | Added `MEAL_DISCOVERY_CAPABILITY_ID`/`MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS` import; added to `includes()` assertion chain; updated `listExecutableCapabilities()` count 11 → 12 |

---

## DATA IMPACT

| Reads existing data | ✅ Yes — `meals` (user-scoped + system), `meal_templates` |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| No nutrition fields surfaced | Structural — `DiscoveryItem` interface has no `calories`/`nutrition` field; the engine never reads the nutrition table. Verified by explicit `hasOwnProperty` assertion in tests |
| No fabricated results | Every `DiscoveryItem` field comes from a stored DB row. No generated text, no inferred values |
| No cross-user data | `getMeals(userId)` is ownership-scoped by the storage owner. System meals and templates are globally shared by design |
| No write paths | Port has one method (`discover`), handler has one executable verb (`search`), binding declares `["search"]` in executableIntents. All write verbs → `unsupported_intent` (not in `supportedIntents`) |
| `importable: false` | Set `false` on all Phase 1 items — no import flow exists yet. Phase 2 external items will set this `true` when the import flow ships |

---

## TESTING

Test file: `server/tests/test-intelligence-meal-discovery-binding.ts`  
Run: `npx tsx server/tests/test-intelligence-meal-discovery-binding.ts`  
Result: **68 passed, 0 failed**

| Section | Assertions |
|---|---|
| Capability lookup | `meal-discovery` is `available`; exactly 12 live capabilities (scope lock); `executableIntents` declares `search`; `recommend` NOT in executableIntents; `MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS` constant is truthful |
| `canExecute()` on canonical singleton | `search` → true; `recommend` → false; `generate` → false |
| Test platform — fake port binding | `meal-discovery` binds and becomes `available` |
| Permission validation | Anonymous search → denied; port is never touched for anonymous callers |
| Personal source result | Shape, id composite key, name, `sourceType: "personal"`, `sourceLabel: "Your Cookbook"`, `isAlreadySaved: true`, `importable: false`, `internalId` set |
| System source result | `sourceType: "system"`, `sourceLabel: "THA Library"`, `isAlreadySaved: true`, `internalId` set |
| Template source result | `sourceType: "template"`, `sourceLabel: "Meal Templates"`, `isAlreadySaved: false`, `internalId` absent |
| Mixed results | All three source types present in one result set |
| No match | `totalCount: 0`, empty `results` array, status `ok` (not gap) |
| Honest gaps | Empty query → gap; missing `{ query }` → gap; whitespace-only query → gap (trim → empty) |
| Result capping | Port returning 20 items → handler caps to 15; `totalCount` reflects capped count |
| Unsupported intent | `review` → `unsupported_intent` |
| Write verbs | `generate` / `add` → `unsupported_intent` (not in `supportedIntents`) |
| `recommend` | → honest gap (no delegate-only ranking method yet) |
| `DiscoveryItem` shape invariants | composite `id`, `name`, `sourceType`, `sourceLabel`, `isAlreadySaved`, `importable`, `dietTypes` all present; no `calories`/`nutrition` field |

**Full suite after this workstream: 0 failures across all 18 intelligence test files.**

---

## SCOPE LOCK

**What was NOT built (and must not be built here):**

- No `recommend` handler — ranking across three sources requires a delegate-only ranking method on `MealDiscoveryEngine` that does not yet exist. `recommend` is in `supportedIntents` (so it will not be `unsupported_intent` in the future) but is NOT in `executableIntents` and gaps honestly today.
- No Phase 2 external sources — TheMealDB, BBC Good Food, and any other external recipe APIs are NOT called here. Phase 2 will add them as a single provider tier inside `MealDiscoveryEngine`; the port, handler, binding, and capability registry entry do not change.
- No import flow — `importable: false` on all Phase 1 items. No import route, no UI, no schema.
- No changes to the `meals` capability — the personal-library read, detail, ownership enforcement, and ingredient/instructions handling are untouched. Only the routing for generic discovery queries was moved from `meals/search` to `meal-discovery/search`.
- No HTTP routes — `meal-discovery` is platform-internal only. No `/api/meal-discovery` route.
- No UI changes.
- No `getSystemMeals` or `getMealTemplates` methods added to storage — both already existed.

---

## DEFINITION OF DONE

- [x] New capability `meal-discovery` registered in `capability-registry.ts`
- [x] Port file created (`meal-discovery-port.ts`) — `MealDiscoveryPort` interface, `DiscoveryItem`, `MealDiscoverySearchResult`, production factory
- [x] Engine file created (`meal-discovery-engine.ts`) — 3-source `Promise.allSettled` fan-out, name-normalised deduplication, `isActive` template filter, 15-item cap, `sourcesQueried` carrier
- [x] Handler file created (`meal-discovery-handler.ts`) — verb guard, auth guard, query validation, port delegation, result assembly
- [x] Binding file created (`meal-discovery.ts`) — `MEAL_DISCOVERY_CAPABILITY_ID`, `MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS`, `bindMealDiscoveryCapability`
- [x] `intelligence-platform.ts` updated — import + `bindMealDiscoveryCapability(intelligencePlatform)` call
- [x] `index.ts` updated — all port/handler/binding/result-type exports added
- [x] `pattern-intent-resolver.ts` updated — `MEAL_DISCOVERY_MATCHERS` created (discovery → `meal-discovery`); `MEALS_MATCHERS` redefined (personal-library → `meals`); `ALL_SPECIFIC_MATCHERS` updated
- [x] Scope-lock assertions updated across 10 test files (11 → 12 live, 13 → 14 registered)
- [x] `test-intelligence-registry-executability.ts` updated — import added, includes assertion extended, count updated
- [x] Test suite: **68/68 passed** (meal-discovery binding test)
- [x] Full test suite: **0 failures** across all 18 intelligence test files
- [x] Data impact: reads only, no schema changes, no backfill
- [x] Trust rules verified by test assertions
- [x] Implementation report saved at `docs/implementation/INT26_MEAL_DISCOVERY_CAPABILITY_IMPLEMENTATION.md`
