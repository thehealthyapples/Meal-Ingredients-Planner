# Household Compatibility Phase 3 — Planner Integration

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `rollback/pre-phase3-planner-integration`
**Rollback commit:** `43fbdda` (checkpoint: pre-nutrition-boost-provenance rollback point)
**Status:** COMPLETE — PASS

---

## Rollback Identifier

```
Tag:    rollback/pre-phase3-planner-integration
Commit: 43fbdda

To restore:
  git checkout rollback/pre-phase3-planner-integration \
    -- server/lib/household-meal-matcher.ts \
    -- server/lib/meal-scoring-service.ts \
    -- server/lib/smart-suggest-service.ts
```

---

## Objective

Wire the Phase 2 `scoreMealCompatibility()` function into the Smart Planner candidate generation pipeline so normal Tier 1–3 meals receive household compatibility data. Attach the result as `householdFit` on each passing candidate. No UI changes.

---

## Files Modified

| File | Change |
|------|--------|
| `server/lib/household-meal-matcher.ts` | New exports: `MemberChange` (export), `HouseholdContext` interface, `buildHouseholdContext()`. Refactored `matchMealsForHousehold()` to accept optional pre-built context. |
| `server/lib/meal-scoring-service.ts` | Added optional `householdFit?` field to `ScoredCandidate`. |
| `server/lib/smart-suggest-service.ts` | Updated import; added eager `householdContextPromise`; updated `getShellMatches()`; added per-candidate `householdFit` computation in user meals loop. |

No schema changes. No migrations. No client-side changes. No new API routes.

---

## Implementation Summary

### `household-meal-matcher.ts`

**1. `MemberChange` exported**
Previously `interface MemberChange` (private). Now `export interface MemberChange`. Required so `meal-scoring-service.ts` can reference the shape inline without a cross-module dependency.

**2. `HouseholdContext` interface (new export)**
```ts
export interface HouseholdContext {
  members: MemberProfile[];
  settings: HouseholdSettings;
  swapMap: Map<string, string>;
}
```
Bundles the three inputs that `scoreMealCompatibility()` needs. Built once per planning run, reused per candidate and for Tier-4 shell matching.

**3. `buildHouseholdContext(userId, weekId?)` (new export)**
Extracts the data-loading portion of the former `matchMealsForHousehold()`:
- Wraps `getHouseholdForUser()` in a try/catch — returns `null` when user has no household (graceful degradation; no throw).
- Loads weekly diet overrides, eater rows, per-adult profile JOINs, per-child `household_eaters` fields.
- Applies the same adult/child derivation logic established in Phase 1 (unchanged verbatim).
- Loads caller prefs for `HouseholdSettings`.
- Loads `ingredient_swaps` for `swapMap`.
- Returns `HouseholdContext | null`.

**4. `matchMealsForHousehold()` refactored**
- Now accepts optional `context?: HouseholdContext`.
- When context is provided (from pre-built promise), skips all data loading and goes straight to template scoring.
- When context is absent (legacy callers, unit tests), calls `buildHouseholdContext()` internally.
- Returns `[]` immediately when context is null (no household) instead of throwing.
- Template loop, sort, and return are byte-for-byte identical to the previous implementation.

### `meal-scoring-service.ts`

Added optional `householdFit?` field to `ScoredCandidate`:

```ts
householdFit?: {
  compatibleCount: number;      // members who need no changes
  totalCount: number;           // total household members
  memberChanges: Array<{
    userId: number | null;
    displayName: string;
    swaps: string[];            // "X → Y" or "remove X"
  }>;
  swapsNeeded: string[];        // deduplicated union of all "→" swaps
  sharedIngredients: string[];  // ingredients safe for all members
  extraPrepMinutes: number;     // always 0 for normal meals
  fitScore: number;             // 0–100 composite score
  explanation: string;          // human-readable summary
};
```

This field is optional (`?`). Absent for: external candidates, users with no household, meals with empty ingredient lists, or when `buildHouseholdContext()` returns null.

### `smart-suggest-service.ts`

**1. Import updated**
```ts
import {
  matchMealsForHousehold,
  buildHouseholdContext,
  scoreMealCompatibility,
  type MealMatch,
  type HouseholdContext
} from "./household-meal-matcher";
```

**2. Eager `householdContextPromise`**
Initiated before `fetchExternalCandidates()` so it runs concurrently with the external candidate network call:
```ts
const householdContextPromise: Promise<HouseholdContext | null> =
  settings.userId == null
    ? Promise.resolve(null)
    : buildHouseholdContext(settings.userId, settings.weekId).catch(err => {
        console.error("[SmartSuggest] Household context build failed:", err);
        return null;
      });
```
Resolves to `null` immediately when `userId` is absent. Any `buildHouseholdContext()` failure is caught and converted to `null` — planning continues normally without compatibility data.

**3. `getShellMatches()` updated**
Now chains off `householdContextPromise` and passes the pre-built context to `matchMealsForHousehold()`. This eliminates the duplicate data-loading queries that would have occurred if Tier-4 had been reached:
```ts
shellMatchesPromise = householdContextPromise.then(ctx => {
  if (ctx == null || settings.userId == null) return [] as MealMatch[];
  return matchMealsForHousehold(settings.userId, settings.weekId, ctx).catch(err => {
    console.error("[SmartSuggest] Tier-4 shell matcher failed:", err);
    return [] as MealMatch[];
  });
});
```

**4. Per-candidate `householdFit` computation**
Inserted in the user meals loop after all gate checks pass, before `allCandidates.push`:
```ts
const hCtx = await householdContextPromise;
if (hCtx != null) {
  const fit = scoreMealCompatibility(meal, hCtx.members, hCtx.settings, hCtx.swapMap);
  if (fit != null) {
    candidate.householdFit = {
      compatibleCount: hCtx.members.length - fit.memberChanges.length,
      totalCount: hCtx.members.length,
      memberChanges: fit.memberChanges,
      swapsNeeded: fit.swapsNeeded,
      sharedIngredients: fit.sharedIngredients,
      extraPrepMinutes: fit.extraPrepMinutes,
      fitScore: fit.fitScore,
      explanation: fit.explanation,
    };
  }
}
```
`compatibleCount` and `totalCount` are derived fields not present on `MealCompatibilityResult` — computed inline as `members.length - memberChanges.length` and `members.length` respectively.

The `await householdContextPromise` is instantaneous after the first call — the promise was already settled before the loop begins (initiated before the slow external candidate fetch).

External candidates do not receive `householdFit`. `scoreMealCompatibility()` expects a `Meal` type from the database; external candidates are `ExternalMealCandidate` objects that are not scored.

---

## Architecture

```
BEFORE Phase 3:
  generateSmartSuggestion()
    ├── allCandidates loop
    │     └── NO compatibility scoring
    └── slot-filling loop
          ├── Tiers 1–3: no householdFit
          └── Tier 4: matchMealsForHousehold() ← lazy, loads all context here

AFTER Phase 3:
  generateSmartSuggestion()
    ├── householdContextPromise ← EAGER, concurrent with external fetch
    │     └── buildHouseholdContext() [members + settings + swapMap]
    │
    ├── allCandidates loop (user meals only)
    │     └── scoreMealCompatibility() ← per candidate, sync, O(M×I)
    │           └── candidate.householdFit = { compatibleCount, totalCount, ... }
    │
    └── slot-filling loop
          ├── Tiers 1–3: householdFit populated on chosen candidates
          └── Tier 4: matchMealsForHousehold(ctx) ← reuses pre-built context
                      no duplicate DB queries
```

---

## DB Query Budget

| Operation | Phase 3 cost | Notes |
|-----------|-------------|-------|
| `buildHouseholdContext()` | 1 household lookup + N×2 (prefs+user per adult) + N eater rows + 1 callerPrefs + 1 ingredient_swaps | Typically ~8 queries for a 4-eater household. Runs once, concurrently with external fetch. |
| `scoreMealCompatibility()` per candidate | 0 DB queries | Fully synchronous — uses pre-built context. |
| `matchMealsForHousehold()` in Tier-4 (with context) | 1 templates query only | Context reuse eliminates the ~8 queries that previously ran a second time when Tier-4 was hit. |
| Users without household | 0 queries | `householdContextPromise` resolves to null immediately. |

**Net change vs Phase 2:** For users with households, `buildHouseholdContext()` now runs on every planning request (not just when Tier-4 is hit). This is the cost of per-candidate scoring for Tiers 1–3. Mitigated by: (a) running concurrently with external fetch, (b) preventing a second identical load if Tier-4 is triggered.

---

## Trust Check

| Question | Answer |
|----------|--------|
| Could shell scoring output change? | NO — `scoreTemplate()` and `matchMealsForHousehold()` template loop are unchanged. Context reuse produces identical member/settings/swapMap inputs. |
| Could Tier-4 shell candidate selection change? | NO — `selectShellRecoveryCandidate()` is unchanged. It receives the same `MealMatch[]` it always did. |
| Could Tier 1–3 candidate selection change? | NO — `householdFit` is a new optional field attached AFTER all selection gates. The `scoreMeal()` function and slot-filling ranking logic are unchanged. |
| Could API response shape change? | YES (intentional) — `ScoredCandidate.householdFit` is a new optional field. Present for household users with passing user meals. Absent for solo users, external candidates, and meals with no ingredients. |
| Could planning crash for no-household users? | NO — `buildHouseholdContext()` returns null (try/catch), all downstream code guards on `ctx != null`. |
| Could Tier-4 break if context is null? | NO — `getShellMatches()` returns `[]` immediately when `ctx == null`. Same as pre-Phase-3 behaviour for no-household users. |
| Could `matchMealsForHousehold()` regress? | NO — when called without context, it now calls `buildHouseholdContext()` internally, which is the extracted data-loading code. Behaviour is identical. |

---

## Known Limitations (unchanged from Phase 2)

- **`extraPrepMinutes` is always `0` for normal meals** — no `estimatedExtraTimePerVariant` on `meals` table. Bounded inaccuracy: `timeFit` and `costFit` default to `1.0`.
- **Path A skips when `meal.dietTypes` is empty** — many user-saved meals have `dietTypes: []`. Path B (ingredient exclusion) fires regardless.
- **External candidates receive no `householdFit`** — they are `ExternalMealCandidate` objects, not `Meal` rows from the database.

---

## TypeScript Verification

```
npx tsc --noEmit 2>&1 | grep -v "seed-meal-shell-templates|test-slot-filling-recovery|tmp_boost_provenance"
(no output — zero new type errors)
```

Pre-existing errors in `seed-meal-shell-templates.ts`, `test-slot-filling-recovery.ts`, and `tmp_boost_provenance_api_test.ts` are unchanged.

---

## Scope Lock Compliance

### Implemented (Phase 3 only)

- `buildHouseholdContext()` — exported, extracts data loading from `matchMealsForHousehold()`
- `HouseholdContext` interface — exported type
- `MemberChange` — now exported (previously private)
- `ScoredCandidate.householdFit?` — new optional field
- Eager context fetch in `generateSmartSuggestion()`
- Per-candidate `scoreMealCompatibility()` call for Tier 1–3 user meals
- Context reuse in Tier-4 `getShellMatches()` (no duplicate loading)

### NOT Implemented (future phases)

- **Phase 4** — UI rendering (household fit strip, review drawer, eater dot indicators)
- **Phase 5** — Restriction resolver integration (replace substring with canonical resolver)
- Accept/persist flow (`plannerWeekEaterOverrides` write path)
- Compatibility scoring for external candidates
- Per-slot compatibility re-scoring after selection

---

## Risk Assessment

| Risk | Severity | Status |
|------|----------|--------|
| Shell scoring regression | LOW | `matchMealsForHousehold()` template loop unchanged; context reuse produces identical inputs |
| Tier-4 shell recovery broken | LOW | `getShellMatches()` now returns `[]` for null context (same as before for no-household users) |
| Tier 1–3 selection ranking changed | NONE | `householdFit` attached after gates; `scoreMeal()` and slot logic unchanged |
| Planning crash for no-household user | NONE | `buildHouseholdContext()` catches `getHouseholdForUser()` throw, returns null |
| Latency regression | LOW | Context load runs concurrently with external fetch; typically resolved before the user meals loop begins |
| API response shape change | INTENTIONAL | `householdFit?` is additive; absent when not applicable |

---

## Definition of Done — Checklist

- [x] `buildHouseholdContext()` exported with null-safe `getHouseholdForUser()` handling
- [x] `HouseholdContext` interface exported
- [x] `MemberChange` exported
- [x] `matchMealsForHousehold()` accepts optional pre-built context
- [x] `ScoredCandidate.householdFit?` field added with specified shape
- [x] `householdContextPromise` initiated before `fetchExternalCandidates()` (concurrent)
- [x] `getShellMatches()` chains off `householdContextPromise` — no duplicate context load
- [x] Per-candidate `scoreMealCompatibility()` call in user meals loop
- [x] `compatibleCount` and `totalCount` derived and attached
- [x] Zero new TypeScript errors
- [x] No UI changes
- [x] No schema changes
- [x] No client-side changes

---

## Final Status

**STATUS: PASS**

Phase 3 complete. The Smart Planner now computes household compatibility data for every normal user meal that passes candidate gates. The `householdFit` field is attached to `ScoredCandidate` and flows through the API response. No UI changes in this phase.

Next step when ready: Phase 4 — render the household fit strip and review bottom sheet using `candidate.householdFit` data.
