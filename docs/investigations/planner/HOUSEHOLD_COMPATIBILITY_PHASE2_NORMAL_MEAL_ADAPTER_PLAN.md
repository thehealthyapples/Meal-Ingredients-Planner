# Household Compatibility V1 — Phase 2: Normal Meal Compatibility Adapter
# Implementation Plan

**Date:** 2026-06-12
**Branch:** main
**Status:** PLANNING ONLY. No code changes. No database changes. No implementation.
**Phase:** 2 of 5 (see master plan and revision)
**Prerequisites:** Phase 1 complete (confirmed in HOUSEHOLD_COMPATIBILITY_PHASE1_IMPLEMENTATION.md)

---

## Rollback Identifier

```
Tag:    rollback/pre-household-compatibility-phase2-normal-meal-adapter-plan
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore both files if implementation goes wrong:
  git checkout rollback/pre-household-compatibility-phase2-normal-meal-adapter-plan \
    -- server/lib/household-meal-matcher.ts \
    -- server/lib/smart-suggest-service.ts

No database cleanup required.
No migration rollback required.
No backfill required.
```

---

## Objective

Allow normal meals from the `meals` table to receive compatibility scoring using the existing engine, without duplicating any scoring logic. The feasibility investigation (STATUS A) confirmed that `scoreTemplate()` lines 262–317 contain zero shell-specific logic and a lightweight adapter is sufficient.

Phase 2 does NOT propagate results to the API or UI. That is Phase 3. Phase 2 makes the engine ready and computing — results are computed and cached within a planning run, not yet attached to candidates or returned to clients.

---

## Answer 1 — Exact Current `scoreTemplate()` Flow

Source: `server/lib/household-meal-matcher.ts` lines 283–378 (confirmed by direct read).

### Stage A — Slot Assembly (lines 289–300, shell-specific)

```typescript
const allSlotIngredients = [
  ...(template.sharedBaseComponents ?? []),  // ← base components
  ...(template.proteinSlots        ?? []),
  ...(template.carbSlots           ?? []),
  ...(template.vegSlots            ?? []),
  ...(template.toppingSlots        ?? []),
  ...(template.sauceSlots          ?? []),
];

if (allSlotIngredients.length === 0) return null;  // ← only hard requirement

const base = template.sharedBaseComponents ?? [];
```

### Stage B — Per-Member Scoring Loop (lines 302–333, generic)

For each `member` in `members`:

**Path A — Diet type matching (lines 309–317):**
```
templateDiets = template.compatibleDiets ?? []
if (templateDiets.length > 0 && member.dietTypes.length > 0):
  for each member dietType:
    if dietType not in templateDiets:
      totalDietConflicts++
      swaps.push("${diet} diet not covered")
```

**Path B — Ingredient exclusion matching (lines 319–327):**
```
excluded = member.excludedIngredients.map(toLowerCase)
for each ingredient in allSlotIngredients:
  key = ingredient.toLowerCase()
  isExcluded = excluded.some(ex => key.includes(ex) || ex.includes(key))
  if isExcluded:
    healthier = swapMap.get(key)
    swaps.push(healthier ? "${ingredient} → ${healthier}" : "remove ${ingredient}")
```

**memberChanges construction (lines 329–333):**
```
if (swaps.length > 0):
  membersNeedingVariant++
  memberChanges.push({ userId, displayName, swaps })
```

### Stage C — Post-Loop Derivations (lines 335–357, generic)

```
sharedIngredients = base ingredients NOT matched by any member's exclusions
swapsNeeded = deduplicated union of all "→" swap strings across all memberChanges
extraPrepMinutes = (template.estimatedExtraTimePerVariant ?? 0) * membersNeedingVariant

breakdown = {
  compatibility:        scoreCompatibility(totalDietConflicts, members.length)
  sharedBase:           scoreSharedBase(sharedIngredients, base)
  swapSimplicity:       scoreSwapSimplicity(memberChanges, members.length)
  timeFit:              scoreTimeFit(template, extraPrepMinutes, settings)
  costFit:              scoreCostFit(template, settings)
  healthAlignment:      scoreHealthAlignment(members, settings)
  preferenceConfidence: scorePreferenceConfidence(members)
}
```

`scoreTimeFit` reads `template.estimatedTotalTime` (line 121).
`scoreCostFit` reads `template.costBand` (line 132).

### Stage D — Return (lines 359–378)

```
return {
  template,              ← shell-specific field
  sharedIngredients,
  memberChanges,
  swapsNeeded,
  extraPrepMinutes,
  fitScore:              computeFitScore(breakdown),
  scoreBreakdown:        breakdown,
  explanation:           buildExplanation(...)
}
```

**Key finding:** Stages B and C are entirely generic — they operate on `string[]` inputs with no slot identity awareness. The only shell-specific code is Stage A (slot assembly) and the `template` field in the return object.

---

## Answer 2 — Exact Logic to Extract into `computeIngredientCompatibility()`

Extract **Stages B, C, and D minus the return wrapper** (lines 302–377) into a new internal function.

### New Function Signature

```typescript
function computeIngredientCompatibility(
  ingredientList: string[],              // allSlotIngredients for shells; meal.ingredients for meals
  compatibleDiets: string[],            // template.compatibleDiets for shells; meal.dietTypes for meals
  base: string[],                        // sharedBaseComponents for shells; meal.ingredients for meals
  extraPrepMinutesPerVariant: number,    // estimatedExtraTimePerVariant for shells; 0 for meals
  timingMeta: { estimatedTotalTime: number | null } | null,  // null for meals → timeFit = 1.0
  costMeta: { costBand: string | null } | null,              // null for meals → costFit = 1.0
  members: MemberProfile[],
  settings: HouseholdSettings,
  swapMap: Map<string, string>
): CompatibilityResult
```

### New Return Type

```typescript
interface CompatibilityResult {
  memberChanges: MemberChange[];
  swapsNeeded: string[];
  sharedIngredients: string[];
  extraPrepMinutes: number;
  fitScore: number;
  scoreBreakdown: ScoreBreakdown;
  explanation: string;
}
```

This is `MealMatch` minus the `template` field. It is the portable compatibility result that works for both shells and normal meals.

### Required Signature Changes to Internal Helper Functions

`scoreTimeFit` (line 114) currently takes `template: MealTemplate` but only reads `template.estimatedTotalTime`. Change:

```typescript
// Before
function scoreTimeFit(template: MealTemplate, extraPrepMinutes: number, settings: HouseholdSettings): number

// After
function scoreTimeFit(
  timingMeta: { estimatedTotalTime: number | null } | null,
  extraPrepMinutes: number,
  settings: HouseholdSettings
): number
// Body: replace `template.estimatedTotalTime` with `timingMeta?.estimatedTotalTime`
```

`scoreCostFit` (line 131) currently takes `template: MealTemplate` but only reads `template.costBand`. Change:

```typescript
// Before
function scoreCostFit(template: MealTemplate, settings: HouseholdSettings): number

// After
function scoreCostFit(
  costMeta: { costBand: string | null } | null,
  settings: HouseholdSettings
): number
// Body: replace `template.costBand` with `costMeta?.costBand`
```

Both are internal (non-exported) functions. The signature changes affect only their call sites within the same file. The call site in `computeIngredientCompatibility()` passes the correct typed objects; the extracted logic is otherwise identical.

---

## Answer 3 — How `scoreTemplate()` Remains Behaviourally Unchanged

After extraction, `scoreTemplate()` becomes:

```typescript
function scoreTemplate(
  template: MealTemplate,
  members: MemberProfile[],
  settings: HouseholdSettings,
  swapMap: Map<string, string>
): MealMatch | null {
  // Stage A: slot assembly — unchanged, shell-specific
  const allSlotIngredients = [
    ...(template.sharedBaseComponents ?? []),
    ...(template.proteinSlots        ?? []),
    ...(template.carbSlots           ?? []),
    ...(template.vegSlots            ?? []),
    ...(template.toppingSlots        ?? []),
    ...(template.sauceSlots          ?? []),
  ];
  if (allSlotIngredients.length === 0) return null;
  const base = template.sharedBaseComponents ?? [];

  // Delegate Stages B, C, D to shared function
  const result = computeIngredientCompatibility(
    allSlotIngredients,
    template.compatibleDiets ?? [],
    base,
    template.estimatedExtraTimePerVariant ?? 0,
    { estimatedTotalTime: template.estimatedTotalTime ?? null },
    { costBand: template.costBand ?? null },
    members,
    settings,
    swapMap
  );

  // Wrap in MealMatch (adds the shell-specific template field)
  return { template, ...result };
}
```

**Behavioural guarantee:** All seven scoring dimensions, all member change logic, all Path A and Path B detection, all swap lookups, all explanation text, all field values in the returned `MealMatch` are IDENTICAL to the current implementation. The only change is that the implementation is delegated rather than inline. This is a pure refactor, not a logic change.

The existing Tier-4 code path in `smart-suggest-service.ts` (`selectShellRecoveryCandidate`, `getShellMatches`) is untouched by this refactor. Shell scoring behaviour is unchanged end-to-end.

---

## Answer 4 — How `scoreMealCompatibility(meal, members, settings, swapMap)` Works

### Prerequisites: New Exported Types

```typescript
// Export this so smart-suggest-service.ts can use it as a cache value type
export type { CompatibilityResult };

// Pre-assembled household context — built once per planning run, reused per candidate
export interface HouseholdContext {
  members: MemberProfile[];
  settings: HouseholdSettings;
  swapMap: Map<string, string>;
}
```

### New Exported Function: `buildHouseholdContext()`

Extracts the data-loading portion of `matchMealsForHousehold()` into a reusable export.
This eliminates double DB queries when both normal meal scoring (Tier 1–3) and shell matching (Tier 4) are needed in the same planning run.

```typescript
export async function buildHouseholdContext(
  userId: number,
  weekId?: number
): Promise<HouseholdContext | null> {
  // Returns null if the user has no household
  // Otherwise: loads eaters (with Phase 1 adult derivation), builds members[],
  // loads caller prefs for settings, loads ingredient_swaps for swapMap
  // Identical data-loading logic as the first half of matchMealsForHousehold()
}
```

After adding this, `matchMealsForHousehold()` accepts an optional pre-built context:

```typescript
export async function matchMealsForHousehold(
  userId: number,
  weekId?: number,
  context?: HouseholdContext   // ← new optional parameter
): Promise<MealMatch[]>
// If context is provided, skips data-loading and goes straight to template scoring.
// If context is absent, calls buildHouseholdContext() internally as before.
```

This avoids double DB queries: the smart planner calls `buildHouseholdContext()` once, reuses the result for both per-candidate scoring and Tier-4 shell matching.

### New Exported Function: `scoreMealCompatibility()`

```typescript
export function scoreMealCompatibility(
  meal: Pick<Meal, 'id' | 'ingredients' | 'dietTypes'>,
  context: HouseholdContext
): CompatibilityResult | null {
  if (meal.ingredients.length === 0) return null;

  return computeIngredientCompatibility(
    meal.ingredients,         // ingredientList — replaces allSlotIngredients
    meal.dietTypes ?? [],     // compatibleDiets — replaces template.compatibleDiets
    meal.ingredients,         // base — whole recipe is the shared base (no slot distinction)
    0,                        // extraPrepMinutesPerVariant — no time metadata on meals
    null,                     // timingMeta null → scoreTimeFit returns 1.0
    null,                     // costMeta null → scoreCostFit returns 1.0
    context.members,
    context.settings,
    context.swapMap
  );
}
```

`scoreMealCompatibility` is a synchronous function. All DB I/O happens in `buildHouseholdContext()`. The per-candidate call is CPU-only.

---

## Answer 5 — How Normal Meals Map to Engine Parameters

| Engine parameter | Shell (existing) | Normal meal (new) | Notes |
|-----------------|-------------------|-------------------|-------|
| `ingredientList` | `template.sharedBaseComponents + [proteinSlots] + [carbSlots] + [vegSlots] + [toppingSlots] + [sauceSlots]` merged into `string[]` at line 289 | `meal.ingredients` (`string[]`) | Structurally identical after assembly — both are `string[]` of ingredient name strings |
| `compatibleDiets` | `template.compatibleDiets` (`text[]`) | `meal.dietTypes` (`text[]`) | Same semantics — both declare which dietary patterns this item satisfies |
| `base` | `template.sharedBaseComponents` (explicitly the shared components, not the variable slots) | `meal.ingredients` (whole recipe — no slot distinction exists) | For meals, `scoreSharedBase` measures what fraction of ALL ingredients everyone can eat, which is the correct interpretation |
| `extraPrepMinutesPerVariant` | `template.estimatedExtraTimePerVariant ?? 0` | `0` (no time metadata on `meals` table) | Known limitation; bounded inaccuracy in `timeFit` dimension only (10% of composite score) |
| `timingMeta` | `{ estimatedTotalTime: template.estimatedTotalTime }` | `null` | `null` → `scoreTimeFit` returns 1.0 (maximum). No penalty applied for meals without time data. |
| `costMeta` | `{ costBand: template.costBand }` | `null` | `null` → `scoreCostFit` returns 1.0 (maximum). No penalty applied for meals without cost data. |

### Schema Equivalence (from feasibility investigation, confirmed in `shared/schema.ts`)

```
mealTemplates.compatibleDiets  text[]   — dietary compatibility tags
meals.dietTypes                text[]   — dietary compatibility tags

mealTemplates.sharedBase...    text[]   — one of 6 slot arrays, all string lists
meals.ingredients              text[]   — flat string list
```

`meals.ingredients` is `text[].notNull()` at schema level. All Path B matching operates on `string[]` via `.toLowerCase()` and `includes()`. The input source is irrelevant to the matching logic.

### Known Limitation: `dietTypes` Population

`meal.dietTypes` may be empty for many user-saved meals, particularly those created before dietary classification was enforced. When empty, Path A is silently skipped (the `templateDiets.length > 0` guard in the extracted function handles this — identical behaviour to shell templates with no `compatibleDiets`). Path B (ingredient exclusions) fires regardless. This is a pre-existing data quality issue, not introduced by Phase 2.

---

## Answer 6 — Where Smart Planner Should Call This for Tier 1–3 Candidates

Source: `server/lib/smart-suggest-service.ts`.

### Current State

```
generateSmartSuggestion()
  ├── line 448: shellMatchesPromise = null (lazy, uninitiated)
  ├── line 449: getShellMatches() — initiates matchMealsForHousehold() on first call
  ├── lines 461–539: allCandidates construction loop
  │     for each userMeal: convert + filter + push to allCandidates
  │     ← NO compatibility scoring here today
  └── lines 606–787: slot-filling loop (7 days × N slots)
        ├── Tier 1: slot-fit candidates
        ├── Tier 2: safe fallback
        ├── Tier 3: controlled repeat
        └── Tier 4: await getShellMatches() ← only called here if Tiers 1–3 exhausted
```

### Proposed Phase 2 Integration Points

**Integration point 1 — Eager context fetch (before `allCandidates` construction)**

At approximately line 430 (after `activeRestrictionDefs` is built, before the `allCandidates` array is created):

```typescript
// Eager household context — built once, reused for per-candidate scoring (Tier 1–3)
// and for shell matching (Tier 4). When userId is absent, resolves immediately to null.
const householdContextPromise: Promise<HouseholdContext | null> =
  settings.userId == null
    ? Promise.resolve(null)
    : buildHouseholdContext(settings.userId, settings.weekId).catch(err => {
        console.error("[SmartSuggest] Household context build failed:", err);
        return null;
      });
```

This is EAGER (promise initiated immediately) but non-blocking — it runs concurrently with any subsequent synchronous candidate filtering.

**Integration point 2 — Per-candidate compatibility scoring (inside `allCandidates` loop)**

After a user meal candidate passes all existing gates (lines 500–538, before `allCandidates.push(candidate)`):

```typescript
// Phase 2 cache: score compatibility for each passing candidate.
// Result stored here; Phase 3 will attach to ScoredCandidate.householdFit.
const mealCompatibilityCache = new Map<number, CompatibilityResult>();

// Inside the userMeals loop, after all gates pass, before allCandidates.push:
if (meal.id != null) {
  const ctx = await householdContextPromise;
  if (ctx != null) {
    const result = scoreMealCompatibility(meal, ctx);
    if (result != null) mealCompatibilityCache.set(meal.id, result);
  }
}
allCandidates.push(candidate);
```

The `await` here resolves instantly on the second and subsequent calls (promise is already settled). The `scoreMealCompatibility()` call itself is synchronous (no DB I/O).

**Integration point 3 — Tier-4 shell matching uses pre-built context**

The current lazy `getShellMatches()` pattern is preserved but passes the pre-built context:

```typescript
const getShellMatches = (): Promise<MealMatch[]> => {
  if (!shellMatchesPromise) {
    shellMatchesPromise = householdContextPromise.then(ctx => {
      if (ctx == null) return [] as MealMatch[];
      return matchMealsForHousehold(settings.userId!, settings.weekId, ctx)
        .catch(err => {
          console.error("[SmartSuggest] Tier-4 shell matcher failed:", err);
          return [] as MealMatch[];
        });
    });
  }
  return shellMatchesPromise;
};
```

By passing `ctx` to `matchMealsForHousehold()`, the Tier-4 call reuses the already-loaded members, settings, and swapMap. Only the template queries are run in Tier-4 (not the full data load).

### What Phase 2 Does NOT Do in `smart-suggest-service.ts`

- Does NOT attach `mealCompatibilityCache` results to `ScoredCandidate` (Phase 3)
- Does NOT modify `selectShellRecoveryCandidate()` output shape (Phase 3)
- Does NOT change slot selection logic, scoring, or ranking behaviour
- Does NOT change any existing Tier 1–3 or Tier 4 logic beyond the context pre-load

The `mealCompatibilityCache` is computed but not consumed in Phase 2. It is a data structure that Phase 3 will read from.

---

## Answer 7 — Performance Risk and Caching Strategy

### DB Query Budget

| Operation | Phase 2 cost | Notes |
|-----------|-------------|-------|
| `buildHouseholdContext()` | 1 household lookup + N×2 queries (user + prefs per adult eater) + N queries (eater rows) + 1 caller prefs + 1 ingredient_swaps | For a 4-eater household: ~8 queries. For no-household user: 0 (resolves to null immediately). |
| `scoreMealCompatibility()` per candidate | 0 DB queries | Fully synchronous. Uses pre-built context. |
| `matchMealsForHousehold()` in Tier-4 (with context) | 1 templates query only | Context reuse eliminates the eater/user/prefs/swaps queries that previously ran a second time |

**Net change vs current:** For users with households, adds ~8 DB queries per planning run (the `buildHouseholdContext()` call). Previously, Tier-4 only ran these queries when Tiers 1–3 were exhausted. After Phase 2, they run on every planning request for household users. This is the acceptable trade-off: we pay the context-load cost upfront on every run to enable per-candidate scoring.

For users without households (or where `userId` is absent), no change — `householdContextPromise` resolves to null immediately.

### CPU Budget

`scoreMealCompatibility()` per candidate: O(M × I) where M = member count, I = ingredient count.

Typical values: 4 members × 15 ingredients = 60 iterations per candidate. For 20 candidates: 1,200 iterations total. Negligible.

The Path B substring check (`key.includes(ex) || ex.includes(key)`) is O(L) per pair where L = string length. For typical household and ingredient string lengths, this is effectively O(1).

### Caching Strategy Within One Planning Run

**Cache 1: `householdContextPromise`** — built once per planning run. All `await householdContextPromise` calls after the first are instant (settled promise).

**Cache 2: `mealCompatibilityCache: Map<number, CompatibilityResult>`** — one entry per unique meal ID. Built during `allCandidates` construction. No duplicate calls. Each `meal.id` is scored exactly once.

**No cache invalidation needed** — both caches are local to a single `generateSmartSuggestion()` call. They are garbage-collected at function exit.

### Latency Estimate

`buildHouseholdContext()` introduces one additional async checkpoint before the `allCandidates` loop. In practice, the context promise is initiated BEFORE the synchronous candidate filtering begins, so both can proceed concurrently. The first `await householdContextPromise` in the loop is the first actual wait point — by that time, the context fetch may already be complete (or nearly complete) since candidate pre-filtering is CPU-only and fast.

**Recommendation:** Add a planning run latency trace log (`[SmartSuggest] Household context ready in Xms`) to measure the impact empirically after implementation.

---

## Answer 8 — Files Requiring Modification

Exactly two files require modification for Phase 2.

### File 1: `server/lib/household-meal-matcher.ts`

| Change | Lines affected | Risk |
|--------|---------------|------|
| Add `CompatibilityResult` interface (after `MealMatch`, before `WEIGHTS`) | After line 74 | None — new type |
| Add `HouseholdContext` interface | After `CompatibilityResult` | None — new type |
| Refactor `scoreTimeFit` signature (first param: `MealTemplate` → `timingMeta`) | Lines 114–129 | LOW — internal function, 2-line body change |
| Refactor `scoreCostFit` signature (first param: `MealTemplate` → `costMeta`) | Lines 131–137 | LOW — internal function, 1-line body change |
| Add `buildHouseholdContext(userId, weekId?)` export | Before `matchMealsForHousehold` | LOW — extracts existing code |
| Refactor `matchMealsForHousehold()` to accept optional `context?` | Lines 173–279 | LOW-MEDIUM — restructure to accept pre-built context |
| Add `computeIngredientCompatibility()` internal function | New, extracted from `scoreTemplate` | LOW — mechanical extraction |
| Refactor `scoreTemplate()` to delegate to extracted function | Lines 283–378 | LOW — wrapper reduction |
| Add `scoreMealCompatibility()` export | New, after `scoreTemplate` | LOW — new function |

### File 2: `server/lib/smart-suggest-service.ts`

| Change | Lines affected | Risk |
|--------|---------------|------|
| Import `buildHouseholdContext`, `scoreMealCompatibility`, `HouseholdContext`, `CompatibilityResult` from matcher | Line 8 | None — import addition |
| Add `mealCompatibilityCache` declaration before `allCandidates` | ~line 461 | None — new variable |
| Add eager `householdContextPromise` initiation | ~line 430 | LOW — new async call |
| Add `scoreMealCompatibility()` call per passing user meal | ~lines 535–538 | LOW — additive only |
| Refactor `getShellMatches()` to pass pre-built context | Lines 448–459 | LOW — structural change to lazy closure |

### Files NOT Requiring Modification in Phase 2

| File | Reason |
|------|--------|
| `server/lib/meal-scoring-service.ts` | `ScoredCandidate` type unchanged in Phase 2 (Phase 3 adds `householdFit`) |
| `client/src/lib/planner-types.ts` | Client type unchanged in Phase 2 (Phase 3) |
| `server/routes.ts` | No API shape changes in Phase 2 |
| `shared/schema.ts` | No schema changes |
| Any client component | No UI changes in Phase 2 |

---

## Answer 9 — Data Impact Declaration

| Question | Answer | Notes |
|----------|--------|-------|
| Reads new data fields | YES | `meals.ingredients`, `meals.dietTypes` — both already populated in DB |
| Writes new data | NO | |
| Changes meaning of existing data | NO | |
| Modifies `household_eaters` | NO | Phase 1 already correct |
| Requires schema migration | NO | |
| Requires data backfill | NO | |
| Changes `mealTemplates` reads | NO | Same queries, same results |
| Changes `meals` reads | NO | `meals` already loaded by caller before `generateSmartSuggestion()` is called |
| Changes ingredient_swaps reads | NO | Already loaded in `buildHouseholdContext()` (same data as inside `matchMealsForHousehold()`) |

The `CompatibilityResult` computed by `scoreMealCompatibility()` is:
- Ephemeral: lives only for the duration of a planning run
- Never persisted to database
- Never returned in the API response (Phase 3 responsibility)
- No user-visible effect in Phase 2

---

## Answer 10 — Trust Check

| Question | Answer | Confidence |
|----------|--------|-----------|
| Could shell scoring output change? | NO | HIGH — `scoreTemplate()` is refactored by extraction only; all 7 score dimensions, all path logic, all memberChanges construction, all explanation generation are identical |
| Could Tier-4 shell candidate selection change? | NO | HIGH — `selectShellRecoveryCandidate()` is not modified; it receives the same `MealMatch[]` it always has |
| Could Tier 1–3 candidate selection change? | NO | HIGH — `mealCompatibilityCache` is computed but not yet consumed; `scoreMeal()` (personal preference scoring) and all slot-filling logic are unchanged |
| Could API response shape change? | NO | HIGH — `ScoredCandidate` type and API route unchanged |
| Could planner output visible to users change? | NO | HIGH — Phase 2 has no user-visible surface |
| Could planning latency increase? | YES | MEDIUM — `buildHouseholdContext()` adds ~8 DB queries for household users |
| Could `matchMealsForHousehold()` regress for Tier-4? | LOW RISK | HIGH — the optional `context` parameter maintains full backward compatibility; callers that don't pass context get identical behaviour |
| Is there a risk from `scoreTimeFit`/`scoreCostFit` signature change? | LOW RISK | HIGH — both are internal non-exported functions; the only call site is `computeIngredientCompatibility()` which the same developer controls |
| Does extracting `computeIngredientCompatibility()` change its logic? | NO | HIGH — this is a mechanical extraction of lines 302–377; no logic is added, removed, or reordered |

---

## Answer 11 — Manual Test Plan

### Pre-Phase-2 Baseline (record before implementing)

Run a smart plan for a user with household eaters (at least one child with dietary data from Phase 1). Note:
- Which meals are selected
- Whether Tier-4 shells appear
- Planning request latency (dev tools network tab)

### Post-Phase-2 Tests

**Test 1 — Shell scoring regression**
Goal: `scoreTemplate()` output is unchanged after extraction.
Method: With a household user, generate a smart plan. Verify Tier-4 shell recovery (if triggered) selects the same template as before Phase 2. Check that `MealMatch.fitScore`, `memberChanges`, and `explanation` values are identical.
Pass criterion: Same shell template selected, same fitScore.

**Test 2 — Normal meal compatibility smoke test (requires temporary debug logging)**
Goal: `scoreMealCompatibility()` produces correct output for a known-restricted meal.
Method: Add a user meal containing "chicken" for a household with a vegetarian child eater. Add a temporary `console.log` of `mealCompatibilityCache` entries after the `allCandidates` construction loop. Verify the chicken-containing meal's cache entry shows a `memberChanges` item for the vegetarian eater.
Pass criterion: `memberChanges` contains the expected eater name and swap entry.
Cleanup: Remove the debug log after verification.

**Test 3 — Household context null path (no-household user)**
Goal: No regression for users without households.
Method: Generate a smart plan as a user with no household (or with `settings.userId = undefined`). Verify that `householdContextPromise` resolves to null immediately and the `mealCompatibilityCache` stays empty. Planning behaviour is identical to pre-Phase-2.
Pass criterion: Plan generates normally, no errors, no latency change.

**Test 4 — Empty ingredients meal**
Goal: `scoreMealCompatibility()` handles meals with `ingredients: []` without error.
Method: Ensure a meal with no ingredients exists in the user's cookbook. Verify it returns `null` from `scoreMealCompatibility()` (handled by the `meal.ingredients.length === 0` guard) and no entry is added to `mealCompatibilityCache`.
Pass criterion: No crash, no cache entry, meal still passes/fails existing gates unchanged.

**Test 5 — Context reuse: no double DB queries**
Goal: Tier-4 shell matching reuses the pre-built context.
Method: Add a DB query count log at the start and end of `matchMealsForHousehold()` and `buildHouseholdContext()`. On a planning run that triggers Tier-4, verify that the eater/user/preferences queries run exactly ONCE (in `buildHouseholdContext()`) not twice.
Pass criterion: Zero redundant household-related DB queries in the Tier-4 path.

**Test 6 — TypeScript compilation**
Method: Run `npx tsc --noEmit` in the project root.
Pass criterion: Zero new TypeScript errors in `household-meal-matcher.ts` and `smart-suggest-service.ts`. Pre-existing errors in `server/seeds/` and `server/tests/` are unchanged.

**Test 7 — Latency measurement**
Method: Time ten smart plan generations before and after Phase 2 for a household user. Compare P50 and P95 latency.
Pass criterion: Latency increase from `buildHouseholdContext()` is under 200ms on a cold DB connection. On warm connections (typical in production), under 50ms expected.

---

## Answer 12 — Rollback Plan

### Rollback Trigger Conditions

Roll back Phase 2 if:
- TypeScript compilation produces new errors that cannot be resolved quickly
- Shell scoring output changes (Tier-4 regression — same household, different template selected)
- Planning latency increases by more than 500ms for household users
- Any crash or unhandled exception in `buildHouseholdContext()` or `scoreMealCompatibility()` that cannot be caught by the error handler

### Rollback Procedure

```bash
# Restore both modified files to pre-Phase-2 state
git checkout rollback/pre-household-compatibility-phase2-normal-meal-adapter-plan \
  -- server/lib/household-meal-matcher.ts \
  -- server/lib/smart-suggest-service.ts

# Verify clean restoration
npx tsc --noEmit
```

No database cleanup required. No migration rollback. No data cleanup. The cache (`mealCompatibilityCache`) is ephemeral and lives only in memory during a planning run.

### Partial Rollback (engine only, revert smart planner integration)

If the engine functions are correct but the smart-suggest integration is problematic:

```bash
git checkout rollback/pre-household-compatibility-phase2-normal-meal-adapter-plan \
  -- server/lib/smart-suggest-service.ts
```

`household-meal-matcher.ts` refactored code is safe to keep — `scoreTemplate()` remains behaviourally identical and `matchMealsForHousehold()` with optional context is backward-compatible.

---

## Answer 13 — Final Recommendation

### STATUS A — Ready for implementation.

**Evidence:**

1. **The extraction is mechanical, not inventive.** `computeIngredientCompatibility()` is exactly lines 302–377 of `scoreTemplate()` with parameter substitution. No logic is invented. Feasibility investigation (STATUS A, confidence HIGH) proved all scoring paths work identically on flat `string[]` inputs regardless of origin.

2. **The data mapping is exact.** `meal.ingredients` is structurally identical to merged `allSlotIngredients`. `meal.dietTypes` is semantically equivalent to `template.compatibleDiets`. Both confirmed in `shared/schema.ts` and feasibility investigation.

3. **The performance impact is bounded and manageable.** `buildHouseholdContext()` adds ~8 queries per planning run for household users. These are the same queries that `matchMealsForHousehold()` already runs for Tier-4 — Phase 2 moves them earlier and makes them reusable. The context pre-load is eager but non-blocking, running concurrently with synchronous candidate filtering.

4. **Regression risk is LOW.** The only behavioural change for existing code paths is delegation (`scoreTemplate` calls extracted function). The function signatures, return shapes, and scoring logic are unchanged. The optional `context` parameter on `matchMealsForHousehold()` is strictly additive.

5. **Phase 1 prerequisite is confirmed complete.** `HOUSEHOLD_COMPATIBILITY_PHASE1_IMPLEMENTATION.md` confirms adult dietary data now flows correctly through the engine. Without this, Phase 2 would compute compatibility for adult eaters incorrectly. Phase 1 completion removes this risk.

6. **The known limitation is bounded and pre-existing.** `extraPrepMinutes = 0` for all normal meals. This produces `timeFit = 1.0` and `costFit = 1.0` (maximum) — a small generosity bias, not a safety failure. This limitation exists today for shells with no time/cost metadata, so Phase 2 does not worsen it.

### Qualification

Phase 2 delivers the engine only. The computed `mealCompatibilityCache` results are not yet visible to users or returned in the API. Phase 3 (compatibility data propagation) is required before Phase 2 has any user-visible effect. The implementation sequence should treat Phase 2 and Phase 3 as a closely-coupled pair:

- Phase 2 alone: engine functions work and compute correctly, no user impact
- Phase 2 + Phase 3: results propagated through API, still no UI
- Phase 2 + Phase 3 + Phase 4: full feature visible to users

---

## Implementation Sequence

Execute in this exact order within Phase 2:

1. **`household-meal-matcher.ts` — Types first**
   Add `CompatibilityResult` interface and `HouseholdContext` interface. No logic change.

2. **`household-meal-matcher.ts` — Helper function signatures**
   Refactor `scoreTimeFit` and `scoreCostFit` signatures to accept data objects instead of `MealTemplate`. Update body (2 lines each). No logic change.

3. **`household-meal-matcher.ts` — Extract `buildHouseholdContext()`**
   Lift the data-loading loop (lines 189–270, eater assembly + caller prefs + swapMap) into an exported function. `matchMealsForHousehold()` calls it internally. Verify TypeScript compiles cleanly.

4. **`household-meal-matcher.ts` — Extract `computeIngredientCompatibility()`**
   Lift lines 302–377 into the new function. Update `scoreTemplate()` to delegate. Verify the `scoreTemplate()` return shape is identical. Compile and verify.

5. **`household-meal-matcher.ts` — Add `scoreMealCompatibility()`**
   New exported function, 10 lines. Wire to `computeIngredientCompatibility()`. Compile and verify.

6. **`smart-suggest-service.ts` — Import additions**
   Add imports for `buildHouseholdContext`, `scoreMealCompatibility`, `HouseholdContext`, `CompatibilityResult`. Compile check.

7. **`smart-suggest-service.ts` — Eager context + cache**
   Add `householdContextPromise` before `allCandidates` construction. Add `mealCompatibilityCache`. Add `scoreMealCompatibility()` call per passing user meal. Refactor `getShellMatches()` to pass context. Compile and verify.

8. **Manual test plan** — run all 7 tests as specified in Answer 11.

---

## Risks Summary

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `scoreTemplate()` regression from extraction | LOW | Mechanical extraction; TypeScript ensures output shape identity; Tier-4 manual test confirms |
| `buildHouseholdContext()` DB error breaks planning run | LOW | Wrapped in `.catch(() => null)` — graceful degradation to no-household path |
| `scoreMealCompatibility()` crash on malformed meal data | LOW | Empty ingredients guard returns null; no crash path exists in scoring logic |
| Planning latency increase unacceptable | LOW-MEDIUM | Latency test (Test 7) measures this; rollback available if >500ms |
| `scoreTimeFit`/`scoreCostFit` signature change introduces subtle bug | LOW | Internal functions; only one new call site; TypeScript enforces new types |
| `meal.dietTypes` empty for most user meals (Path A skipped) | MEDIUM (pre-existing) | Documented known limitation; Path B still fires on ingredient exclusions; Phase 5 resolver partially addresses this |
| Double DB queries if context passing to `matchMealsForHousehold` is missed | LOW | Optional parameter pattern; existing callers without context continue to work (context built internally) |

---

## Reference Documents

| Document | Relevance |
|----------|-----------|
| `HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN.md` | Phase 2 specification (Section 4, Phase 2) |
| `HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN_REVISION.md` | Confirms Phase 2 unaffected by adult data architecture decision |
| `NORMAL_MEAL_COMPATIBILITY_ENGINE_FEASIBILITY.md` | STATUS A proof; exact code line references for extraction |
| `HOUSEHOLD_COMPATIBILITY_PHASE1_IMPLEMENTATION.md` | Confirms Phase 1 complete; adult data now correct in engine |

---

*Document ends. Planning only. No code changes made.*
