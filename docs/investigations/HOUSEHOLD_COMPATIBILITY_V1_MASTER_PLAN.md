# Household Compatibility V1 — Master Implementation Blueprint

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `rollback/pre-household-compatibility-v1-planning`
**Status:** Planning document only. No code changes. No schema changes.
**Evidence base:** Five completed investigations (see Section 12 — Source Index)

---

## Rollback Identifier

```
Tag:    rollback/pre-household-compatibility-v1-planning
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore:
  GIT_CONFIG_NOSYSTEM=1 git checkout rollback/pre-household-compatibility-v1-planning
```

---

## Overall Risk Classification

**LOW-MEDIUM**

The backend compatibility engine already exists and produces correct output. The principal work is: (1) fixing a data gap in eater rows, (2) moving one function call from lazy to eager, (3) propagating existing data through the API boundary, and (4) building a read-only UI surface. No algorithmic invention is required. The resolver integration (Phase 5) is the only architecturally novel addition.

---

## Executive Recommendation

**Ship Household Compatibility V1 in five sequential phases. Begin with Phase 1 (adult eater fix) immediately — it is a prerequisite for all other work and is a self-contained correctness fix with no UX surface.**

The core finding across all investigations is that THA already computes everything needed. `matchMealsForHousehold()` produces `memberChanges[]`, `swapsNeeded[]`, `fitScore`, `explanation`, `extraPrepMinutes`, and `scoreBreakdown` on every Tier-4 planning cycle. The household name, the specific ingredient conflict, and the suggested swap — all of it already exists. The data is computed and then discarded. Household Compatibility V1 is primarily a data propagation problem, not a computation problem.

The adult eater data gap is the single largest risk. Without it, adult members appear fully compatible with every meal regardless of their actual dietary profile. Fix that first. Everything else is additive.

---

## Section 1 — Executive Summary

### What Household Compatibility V1 Is

Household Compatibility V1 makes the Smart Planner household-aware at the meal card level. When a household has members with different dietary needs, V1 surfaces — per meal — which eaters can participate without any changes, which need adaptations, and exactly what those adaptations are.

Today, the planner knows about household members but treats them as a union filter: meals with any eater's restricted ingredient are removed from the candidate pool. The household is visible only as a gate. V1 makes the household visible as context: "Beef Lasagne works for Colin, Daisy, and Oliver — Lilly needs beef mince swapped for Quorn and pasta swapped for gluten-free."

### How It Supports the Three Meal Types

**Shared Meal.** Most household meals are shared meals — one pot, different plates. V1 supports the shared meal by identifying exactly which ingredients need to be managed and for whom. The cook sees the shared meal as the plan; the adaptations are framed as a brief parallel step, not a separate meal.

**Personal Adaptation.** For traditional recipes with a fixed ingredient list, V1 surfaces per-eater adaptation requirements. A recipe that "fits 3 of 4" remains a good planner choice — V1 quantifies the adaptation cost (specific swaps, extra prep minutes) so the cook can make an informed decision rather than discovering the problem at the stove.

**Nutrition Enhancement.** V1 does not directly change the Nutrition Boost system. However, once household compatibility data flows through the API, the context exists to distinguish shared boosts (safe for all eaters) from individual boosts (beneficial for one eater) and flagged suggestions (nutritious but restricted for a specific eater). This is an opportunity for V2 or V3, not V1.

### How It Differs from Traditional Meal Planning

Traditional meal planning apps filter meals by dietary profile. If one household member is vegetarian, all meat-based meals disappear from results. This hides the household's actual cooking reality — families routinely cook shared meals with small adaptations. The "filter everything" approach underserves households with mixed dietary needs.

THA's model is participation-first. Every meal has the potential to be a household meal. Compatibility V1 quantifies the adaptation cost and makes it legible. A "fits 3 of 4" meal with one easy swap is not a bad meal — it is a good meal with a known, manageable adaptation. The planner should say that clearly.

---

## Section 2 — Product Goals

### Primary Goals

1. **Make per-eater compatibility visible at the meal card level.** Every planned meal in a multi-person household should show which eaters are compatible and which need changes, without requiring the user to navigate elsewhere.

2. **Surface adaptation data that already exists.** The backend computes `memberChanges[]`, `swapsNeeded[]`, and `explanation` on every Tier-4 planning cycle. V1 propagates this data to the API response and renders it in the UI. No new computation is required for Phase 3 and Phase 4.

3. **Fix the adult eater data gap.** Adult household eater rows are created with empty `defaultDietTypes` and `hardRestrictions`. Any compatibility score that includes an adult eater is currently unreliable. This must be corrected before any compatibility display ships.

4. **Enable normal meals to receive compatibility scoring.** The vast majority of planned meals (Tiers 1–3) are user-saved meals — not shell templates. The compatibility engine must be extended to score these meals via a lightweight adapter before the UI has broad household coverage.

### Secondary Goals

5. Enable the "Review Changes" bottom sheet — a non-blocking, read-only panel showing per-eater adaptation details when the user taps a meal card's household fit strip.

6. Improve compatibility engine precision by replacing raw substring matching (Path B) with the canonical restriction resolver. This reduces false positives (savoy cabbage matching "soy") and adds derived ingredient detection (cream, butter, tofu, prawns, soy sauce correctly resolved).

7. Lay the foundation for V2 accept-and-persist flow, which will use the existing `plannerWeekEaterOverrides` table.

### Non-Goals for V1

- **Accept/persist adaptations.** Option A (this-week-only acceptance via `plannerWeekEaterOverrides`) is deferred to V2 to keep V1 read-only and low-risk.
- **Eater learning and remembered swaps.** Writing accepted swaps back to eater records is V2.
- **Household variant library.** Creating "Beef Lasagne — Lilly's Version" as a separate saved meal is long-term.
- **Nutritional recalculation per variant.** Caloric/macro data for adapted portions is not in scope.
- **Instructional cooking steps.** THA is a planning app, not a recipe instruction app.
- **AI-generated adaptation suggestions.** The existing `ingredient_swaps` DB table and resolver library cover the required cases.
- **Caloric tracking for variants.** Each eater's portion may have different nutritional values; computing those is deferred.

---

## Section 3 — Architecture

### Component Diagram

```
ADULT EATER (users table)
  users.diet_pattern
  users.diet_restrictions
  users.diet_restrictions
         │
         │  [Phase 1: sync on profile save + backfill]
         ▼
HOUSEHOLD EATERS TABLE (household_eaters)
  defaultDietTypes   ← populated from users.diet_pattern
  hardRestrictions   ← populated from users.diet_restrictions
  userId             ← links adult rows back to users table
         │
         │  (child eater rows already populated directly)
         │
         ▼
COMPATIBILITY ENGINE (household-meal-matcher.ts)
  scoreTemplate() / scoreMealCompatibility()  [Phase 2]
         │
         ├── Path A: template.compatibleDiets vs member.dietTypes
         │
         ├── Path B: allSlotIngredients vs member.excludedIngredients
         │     [Phase 5: replace raw substring with restriction resolver]
         │
         ├── swapMap: ingredient_swaps DB table
         │
         └── OUTPUT: MealMatch
               memberChanges[]  ← per-eater name + swaps
               swapsNeeded[]
               fitScore
               explanation
               extraPrepMinutes
               scoreBreakdown
                     │
                     │  [Phase 3: propagate through API]
                     ▼
PLANNER CANDIDATE (SmartCandidate / SmartSuggestEntry)
  householdFit:
    compatible: number
    total: number
    memberChanges: [{ displayName, swaps[] }]
    extraPrepMinutes: number
    tier: 1 | 2 | 3 | 4 | 5
                     │
                     │  [Phase 4: render in UI]
                     ▼
COMPATIBILITY REVIEW (meal card + bottom sheet)
  Household Fit Strip: ● Colin ● Daisy ◐ Lilly
  "Fits 3 of 4 · 1 easy swap · Review →"
  Bottom sheet: per-eater adaptation details
```

### Data Source Summary

| Eater Type | Diet Types Source | Hard Restrictions Source |
|------------|------------------|--------------------------|
| Child eater | `household_eaters.defaultDietTypes` | `household_eaters.hardRestrictions` |
| Adult eater (current, broken) | `household_eaters.defaultDietTypes` = `[]` | `household_eaters.hardRestrictions` = `[]` |
| Adult eater (post Phase 1) | `household_eaters.defaultDietTypes` ← synced from `users.diet_pattern` | `household_eaters.hardRestrictions` ← synced from `users.diet_restrictions` |

### Meal Type Paths

**Shell meal path (existing, Tier-4 only):**
```
generateSmartSuggestion() → [Tiers 1–3 exhausted] → matchMealsForHousehold()
  → scoreTemplate(MealTemplate) → MealMatch
  → selectShellRecoveryCandidate() → ScoredCandidate [memberChanges DISCARDED today]
```

**Shell meal path (post Phase 2 + Phase 3):**
```
generateSmartSuggestion() → [eager call, not Tier-4 only] → matchMealsForHousehold()
  → scoreTemplate(MealTemplate) → MealMatch
  → selectShellRecoveryCandidate() → ScoredCandidate [householdFit ATTACHED]
  → SmartSuggestEntry.candidate.householdFit → API response → client
```

**Normal meal path (post Phase 2 + Phase 3):**
```
generateSmartSuggestion() → scoreMealCompatibility(Meal) [new, lightweight adapter]
  → computeIngredientCompatibility() [extracted shared function]
  → CompatibilityResult → attached to ScoredCandidate.householdFit
  → SmartSuggestEntry.candidate.householdFit → API response → client
```

**Resolver path (post Phase 5):**
```
scoreTemplate() / scoreMealCompatibility()
  → Path B: resolveActiveRestrictions(member.excludedIngredients)
            resolveIngredientRestrictions(ingredient, memberDefs)
  [replaces: ingredient.includes(ex) || ex.includes(ingredient)]
```

---

## Section 4 — Implementation Phases

### Phase 1 — Adult Eater Data Fix

**Purpose:** Populate `household_eaters.defaultDietTypes` and `household_eaters.hardRestrictions` for adult eater rows from the user's profile data. Without this, any compatibility score for a household with adult members is unreliable — adults silently appear fully compatible regardless of their actual dietary profile.

**What changes:**
- `server/storage.ts` — `syncMembersAsEaters()`: when inserting a new adult eater row (userId populated), read `users.diet_pattern` and `users.diet_restrictions` and map them into `defaultDietTypes` and `hardRestrictions` rather than inserting empty arrays.
- `server/routes.ts` — `PUT /api/profile`: after saving user dietary data to `users` and `user_preferences`, update the corresponding `household_eaters` row (where `userId` matches) with the same dietary values.
- Backfill: a one-time operation updating existing adult eater rows where `defaultDietTypes = '{}'` AND the linked `users` row has non-null `diet_pattern` or `diet_restrictions`.

**Files affected:**
- `server/storage.ts` — `syncMembersAsEaters()` function
- `server/routes.ts` — `PUT /api/profile` handler
- Optional: a migration script or server startup backfill for existing rows

**Risk:** LOW-MEDIUM. The sync insert path is narrow. The profile PUT handler change adds one conditional update; if the user has no eater row, the update is a no-op. The backfill is scoped to rows with `userId IS NOT NULL AND defaultDietTypes = '{}'`.

**Open decision before implementation:** Should `household_eaters.defaultDietTypes` remain a permanent independent copy (allowing the user to override their household eater settings separately from their profile), or should it be a derived view kept in strict sync? Investigation 1 notes this is the main architectural decision point. Recommendation: **permanent copy with sync-on-profile-save**. This allows future per-eater overrides without breaking the data model.

**Dependencies:** None. This phase is independent and is the prerequisite for all subsequent phases.

---

### Phase 2 — Normal Meal Compatibility Adapter

**Purpose:** Extend the compatibility engine to score user-saved meals (Tiers 1–3) using a lightweight adapter. Today, compatibility scoring only applies to shell templates. The vast majority of planned meals are user-saved meals that never enter the engine.

**What changes:**
- `server/lib/household-meal-matcher.ts` — Extract the core scoring computation (lines 262–317) from `scoreTemplate()` into a shared internal function `computeIngredientCompatibility(ingredientList, compatibleDiets, base, extraPrepMinutes, timingMeta, costMeta, members, settings, swapMap)`. `scoreTemplate()` calls this new function after assembling its slot arrays.
- `server/lib/household-meal-matcher.ts` — Add `scoreMealCompatibility(meal, members, settings, swapMap)` which places `meal.ingredients` into the `sharedBaseComponents` position and `meal.dietTypes` into the `compatibleDiets` position, then calls `computeIngredientCompatibility()`.
- `server/lib/smart-suggest-service.ts` — Call `matchMealsForHousehold()` eagerly at the start of `generateSmartSuggestion()` (when household context exists), not lazily inside the Tier-4 branch only. The existing Tier-4 call continues to work; this makes the result available for all tiers.

**Files affected:**
- `server/lib/household-meal-matcher.ts` — refactor and extend
- `server/lib/smart-suggest-service.ts` — restructure lazy call to eager
- `server/lib/meal-scoring-service.ts` — no changes required; the adapter is in the matcher

**Risk:** LOW-MEDIUM. The core scoring logic is moved (extracted), not rewritten. `scoreTemplate()` remains functionally identical after extraction. The new `scoreMealCompatibility()` is additive. The eager call restructuring is the highest-risk change: it moves one async call earlier in the pipeline. The call already exists; the question is whether the additional upstream execution cost is acceptable on all planning requests.

**Known limitation (not a bug):** `extraPrepMinutes` is always `0` for normal meals because `estimatedExtraTimePerVariant` does not exist on the `meals` table. The score distortion is bounded: `timeFit` and `costFit` both default to `1.0` (maximum), accounting for at most 20% of the composite `fitScore`. Path A and Path B accuracy are unaffected.

**Dependencies:** Phase 1 (adult eater fix) should be complete before Phase 2 is tested, otherwise the compatibility results for adult eaters will be empty and the testing will not cover the adult path.

---

### Phase 3 — Compatibility Data Propagation

**Purpose:** Propagate `memberChanges`, `fitScore`, `explanation`, and `extraPrepMinutes` through the API boundary to the client. Today, `selectShellRecoveryCandidate()` discards all compatibility fields. The client receives `score: 0` and an empty household `scoreBreakdown`.

**What changes:**
- `server/lib/meal-scoring-service.ts` — Add optional field to `ScoredCandidate`:
  ```
  householdFit?: {
    tier: 1 | 2 | 3 | 4 | 5,
    compatible: number,
    total: number,
    memberChanges: Array<{ displayName: string; swaps: string[] }>,
    extraPrepMinutes: number,
    explanation: string
  }
  ```
- `server/lib/smart-suggest-service.ts` — In `selectShellRecoveryCandidate()`, attach the originating `MealMatch` fields to the returned `ScoredCandidate.householdFit`. For Tier 1–3 normal meals, attach the result of `scoreMealCompatibility()` (from Phase 2).
- `client/src/lib/planner-types.ts` — Add `householdFit` field to `SmartCandidate` with the same shape.
- The tier classification (1–5) is derived from `memberChanges` and `swapsNeeded` according to the tier model in the UX investigation (see Section 6).

**Files affected:**
- `server/lib/meal-scoring-service.ts` — type extension only
- `server/lib/smart-suggest-service.ts` — field attachment in `selectShellRecoveryCandidate()` and Tier 1–3 path
- `client/src/lib/planner-types.ts` — type extension only

**Risk:** LOW. Adding optional fields to existing types is non-breaking. The client currently ignores `householdFit` because it does not exist; once it exists, Phase 4 renders it. No logic changes to existing fields.

**Dependencies:** Phase 1 (accurate adult eater data), Phase 2 (compatibility scoring for normal meals).

---

### Phase 4 — Compatibility Review UI

**Purpose:** Render the household fit strip on meal cards and build the "Review Changes" bottom sheet. This is the user-visible output of the entire feature.

**What changes:**

*Meal card — household fit strip:*
- Display eater indicator dots: filled green (compatible), half-filled amber (needs adaptation), outlined red (removal only).
- Display the "Fits X of Y" label (or "Fits all N") derived from `householdFit.compatible` and `householdFit.total`.
- Show secondary label from `householdFit.tier`: "1 easy swap", "Adaptable", "Significant changes", etc.
- Tapping the strip opens the bottom sheet. Tapping an individual eater dot shows a brief inline tooltip for that eater.
- The strip is invisible when `householdFit` is absent (solo user, no household data, or pre-data-fix adult).

*Review Changes bottom sheet:*
- Header: meal name + "Fits X of Y eaters"
- Summary row per eater: indicator dot + name + "No changes needed" or "N adaptations"
- Per-eater section for those needing changes: named section header, swap rows (each showing original → replacement)
- Shared ingredients section (from `sharedIngredients[]`)
- Extra prep time (from `householdFit.extraPrepMinutes`)
- CTA: "Choose a different meal" (no accept/persist in V1; that is V2)
- Shell meal variant: "Build your own" framing with participation layout rather than adaptation instructions

**Files affected:**
- Planner meal card component (likely `client/src/components/` — exact component to be confirmed at implementation time)
- New `HouseholdFitStrip` component
- New `CompatibilityReviewSheet` bottom sheet component
- `client/src/pages/weekly-planner-page.tsx` — wire `householdFit` data from `SmartCandidate` to card

**Risk:** LOW-MEDIUM. The UI is additive — no existing card behaviour is removed or changed. The strip is conditionally visible. The bottom sheet is a new overlay. The main risk is visual regression testing on the meal card layout.

**Dependencies:** Phase 3 (householdFit data in API response).

---

### Phase 5 — Restriction Resolver Integration

**Purpose:** Replace Path B's raw bidirectional substring matching in `scoreTemplate()` and `scoreMealCompatibility()` with the canonical restriction resolver (`resolveActiveRestrictions`, `resolveIngredientRestrictions` from `shared/restrictions/restriction-resolver.ts`). This eliminates false positives and adds derived/hidden ingredient detection.

**What changes:**
- `server/lib/household-meal-matcher.ts` — Import `resolveActiveRestrictions` and `resolveIngredientRestrictions`. In the Path B loop (inside `computeIngredientCompatibility()` after Phase 2 extraction), replace the `key.includes(ex) || ex.includes(key)` predicate with a resolver call. Pre-resolve each member's restrictions once per meal outside the ingredient loop.
- Existing output contract is fully preserved: `memberChanges[].swaps[]`, `swapsNeeded[]`, `explanation`, `fitScore`, `scoreBreakdown` are unchanged. Only the detection predicate changes.

**Precision gains (proven, not assumed):**
| Ingredient | Restriction | Path B today | After Phase 5 |
|---|---|---|---|
| `savoy cabbage` | `soy-free` | **FALSE POSITIVE** | Correct — no match (word boundary) |
| `cream` | `dairy-free` | Miss | **Hit** — derived ingredient |
| `butter` | `dairy-free` | Miss | **Hit** — derived ingredient |
| `tofu` | `soy-free` | Miss | **Hit** — derived ingredient |
| `edamame` | `soy-free` | Miss | **Hit** — derived ingredient |
| `prawns` | `shellfish-free` | Miss | **Hit** — derived ingredient |
| `soy sauce` | `gluten-free` | Miss | **Hit** — hidden ingredient |

**Known gaps that Phase 5 does NOT close** (require separate library expansion):
- `spaghetti` → gluten (not in resolver library)
- `ricotta`, `mozzarella` → dairy (not in resolver library)
- `hoisin sauce` → gluten (not in resolver library)

**Architecture decision required before Phase 5:** Non-canonical restriction strings (e.g., "beef", "alcohol" entered as free text in `hardRestrictions`) are not in the resolver library and would be missed after full replacement. Two options:
- **Option A (recommended):** Full replacement. Accept the behaviour change. The regression risk is bounded because children's restrictions are entered via a curated UI, and adult eater rows currently have empty `hardRestrictions` (being fixed in Phase 1).
- **Option B:** Resolver primary, substring fallback. Retains Path B for any restriction string that resolves to no canonical definition.

**Files affected:**
- `server/lib/household-meal-matcher.ts` — ~8 lines in Path B detection, plus imports

**Risk:** LOW. Surgical change to one function's detection predicate. Zero schema changes. Zero output format changes. The resolver is already live in the Smart Planner filtering and compliance gate — integration follows an established pattern.

**Dependencies:** Phase 2 (the extracted `computeIngredientCompatibility()` function makes this change in one place). Can be done in parallel with Phase 4 but produces no user-visible benefit until Phase 4 ships.

---

## Section 5 — API Surface

The following describes the proposed shape of the `householdFit` field added to `SmartCandidate`. This is a shape description only — no code.

### `householdFit` Object (on `SmartCandidate`)

```
householdFit (optional — absent for solo users or when no household data exists)
  ├── tier: integer (1–5)
  │         Compatibility tier classification derived from memberChanges
  │         1 = Fully Compatible (no changes needed)
  │         2 = Mostly Compatible (1 eater, all swaps known, <10 min extra)
  │         3 = Adaptable (some eaters need changes, swaps available)
  │         4 = Poor Fit (removals required or >20 min extra)
  │         5 = Incompatible (all eaters need changes)
  │
  ├── compatible: integer
  │         Number of eaters who can eat the meal without any changes
  │         Derived from: members.length - memberChanges.length
  │
  ├── total: integer
  │         Total number of eaters in the household
  │
  ├── memberChanges: array
  │     Each entry:
  │       displayName: string    ← eater name from household_eaters.display_name
  │       swaps: string[]        ← ["beef mince → Quorn mince", "pasta → GF pasta"]
  │                                 Format: "X → Y" for swap, "remove X" for removal
  │
  ├── swapsNeeded: string[]
  │         Deduplicated union of all "X → Y" swaps across all eaters
  │         (removes: only appear in memberChanges, not here)
  │
  ├── extraPrepMinutes: integer
  │         Additional prep time required for variants
  │         0 for normal meals (no time metadata available)
  │         Estimated value for shell templates (from estimatedExtraTimePerVariant)
  │
  └── explanation: string
            Human-readable summary e.g. "Fits 3 of 4 profiles · 1 easy swap · +5 min"
            Generated by existing buildExplanation() in household-meal-matcher.ts
```

### `compatibleProfiles` (implicit, not a separate field)

Eaters who are fully compatible are implicit: all eaters NOT in `memberChanges`. The client derives compatible eaters by comparing the full household eater list (already loaded) against `memberChanges[].displayName`. This avoids duplicating the eater list in every meal response.

### Tier Classification Logic (server-side, derived at propagation time)

```
tier 1:  memberChanges.length === 0
tier 2:  memberChanges.length === 1
         AND all swaps in memberChanges[0].swaps contain "→"
         AND extraPrepMinutes <= 10
tier 3:  memberChanges.length >= 1
         AND at least one "→" swap exists
         AND swapSimplicity >= 0.5 (from scoreBreakdown)
tier 4:  any swap is "remove X" (no substitution)
         OR extraPrepMinutes > 20
tier 5:  memberChanges.length === total (all eaters need changes)
         OR scoreBreakdown.compatibility === 0
```

### Existing Fields Unchanged

`SmartCandidate.score`, `SmartCandidate.scoreBreakdown`, `SmartCandidate.explanation` (personal preference explanation from `explainability-service.ts`) remain unchanged. `householdFit` is a new optional field alongside them. The two explanation types are distinct: `explanation` is personal preference reasoning; `householdFit.explanation` is household compatibility reasoning.

---

## Section 6 — Compatibility Review UX

### Design Philosophy

> Not: "Can everybody eat this exact recipe?"
> Yes: "How can everybody participate in this meal?"

Compatibility is informative, not gatekeeping. A meal that fits 3 of 4 eaters is a good meal. The system's job is to make the adaptation cost visible and manageable, not to exclude meals from consideration. Every change is attributed to a specific named eater. The framing is "Lilly's version" not "conflict detected."

---

### Household Fit Strip (Meal Card, Collapsed State)

Appears below the meal name when `householdFit` is present. Not rendered for solo users or when household eater data is empty.

```
● Colin  ● Daisy  ● Oliver  ◐ Lilly
Fits 3 of 4  ·  1 easy swap  ·  Review →
```

**Dot indicators:**
- Filled green `●` = eater is fully compatible
- Half-filled amber `◐` = eater needs adaptation (swap available)
- Outlined red `○` = eater has hard conflict (removal only, no swap)

---

### Card Examples

**Tier 1 — Fully Compatible**
```
● Colin  ● Daisy  ● Oliver  ● Lilly
Fits all 4
```
No review prompt. Positive reinforcement only.

**Tier 2 — Mostly Compatible**
```
● Colin  ● Daisy  ● Oliver  ◐ Lilly
Fits 3 of 4  ·  1 easy swap  ·  Review →
```

**Tier 3 — Adaptable**
```
● Colin  ◐ Daisy  ◐ Oliver  ◐ Lilly
Fits 1 of 4  ·  Adaptable  ·  Review →
```

**No Household Data (solo user)**
No strip rendered. Card unchanged.

---

### Review Changes Bottom Sheet (Expanded State)

Opens as a bottom sheet when the strip is tapped. Non-blocking — meal can be selected without reviewing.

**Standard recipe layout (Tier 2–4):**

```
╔═══════════════════════════════════════════════════╗
║  ✕                        Beef Lasagne            ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Fits 3 of 4 eaters                               ║
║  ─────────────────────────────────────            ║
║  ● Colin           No changes needed              ║
║  ● Daisy           No changes needed              ║
║  ● Oliver          No changes needed              ║
║  ◐ Lilly           2 adaptations                  ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  LILLY'S VERSION                                  ║
║                                                   ║
║  ◐  beef mince  →  Quorn mince                    ║
║  ◐  pasta sheets  →  gluten-free pasta sheets     ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Shared:  tomato sauce · ricotta · herbs · garlic ║
║                                                   ║
║  Extra prep time:  +5 min                         ║
║                                                   ║
║        [Choose a different meal]                  ║
╚═══════════════════════════════════════════════════╝
```

Note: "Accept adaptations" is NOT present in V1. That is V2.

**Multiple eaters needing changes:**

```
Fits 1 of 4 eaters
● Colin           No changes needed
◐ Daisy           1 adaptation
◐ Oliver          1 adaptation
◐ Lilly           2 adaptations

DAISY'S VERSION
◐  chicken  →  chickpeas

OLIVER'S VERSION
◐  chicken  →  tofu

LILLY'S VERSION
◐  chicken  →  chickpeas
◐  cream  →  coconut cream

Shared:  spices · onion · garlic · tomatoes · rice
Extra prep time:  +10 min
```

**Shell meal layout (participation, not adaptation):**

```
TACO NIGHT  ·  Build your own
─────────────────────────────────
Shared for everyone:
  salsa · guacamole · lettuce · lime · jalapeños

PROTEIN OPTIONS
  Colin, Daisy, Oliver  →  chicken thigh (or beef mince)
  Lilly                 →  black beans (or spiced tofu)

CARB OPTIONS
  Everyone  →  corn tortillas (GF) or flour tortillas

TOPPING OPTIONS
  Colin, Daisy, Oliver  →  sour cream or cheddar
  Lilly                 →  cashew cream or dairy-free cheese

Extra prep time:  +5 min (parallel protein prep)
```

---

### Path A Conflict Display (category-level, no ingredient specifics)

When the engine detects a dietary category mismatch (Path A) but cannot resolve it to a specific ingredient (because `hardRestrictions` is empty or `dietTypes` data is sparse), the UI is honest:

```
LILLY'S VERSION
Lilly follows a Vegetarian diet.
This recipe may contain meat or fish.
  [View ingredients]
```

Never fabricate ingredient specificity the system does not have. Once Phase 1 (adult eater fix) is complete, adult eater `hardRestrictions` will be populated and Path B will fire with specific ingredient conflicts.

---

### Desktop and Mobile

**Desktop:** The household fit strip appears as a compact horizontal band below the meal title. The "Review →" link opens a side drawer (not a bottom sheet) that does not obscure the meal card.

**Mobile:** The strip is the same layout, condensed. "Review →" opens a full-height bottom sheet with pull-to-dismiss. The eater dots are tap targets for individual eater tooltips.

---

## Section 7 — Normal Meals vs Shell Meals

### What Compatibility Means for Normal Recipes

A normal recipe is a fixed ingredient list. Beef Lasagne is beef mince, pasta sheets, ricotta, tomato sauce, herbs. Compatibility for a normal recipe asks: "which of these fixed ingredients conflict with which eaters' restrictions?"

The answer is a list of ingredients to swap or remove per eater. The adaptation cost is real: the cook must manage a separate portion, hold back an ingredient before adding it to the main pan, or find a substitute at the shop. This is adaptation — modifying a fixed recipe for one or more eaters.

Normal meal compatibility is the common case for THA's current meal library. User-saved meals (Tier 1–3 candidates) are all normal recipes. The compatibility adapter (Phase 2) makes these scoreable via the existing engine.

**Precision limitation:** Normal meals may have sparsely populated `dietTypes`. When `dietTypes` is empty, Path A is silently skipped and only Path B (ingredient exclusion) fires. A Vegetarian eater without explicit "beef" in their `hardRestrictions` would not generate a conflict for Beef Lasagne unless Path A fires. This is addressed by ensuring adult eaters have populated `hardRestrictions` (Phase 1) and by the resolver integration (Phase 5).

### What Compatibility Means for Meal Shells

A meal shell is a structural template, not a recipe. Taco Night defines component categories — protein slots, carb slots, sauce slots, shared base — with multiple options per category. Compatibility for a shell asks: "which slot options are available to each eater, and can every eater find at least one valid option per slot?"

The answer is a participation map, not an adaptation list. Lilly doesn't need a modified Taco Night — she picks from the plant-based protein slot and the dairy-free topping slot. The meal format is inherently inclusive.

Shell meal compatibility is structurally richer because the slot architecture explicitly encodes the available substitutes. The engine's `swapMap` lookup is supplemented by the slot arrays themselves: if "chicken" is in `proteinSlots` alongside "black beans", an eater who can't eat chicken is not removing a protein — they're selecting an alternative.

The UI framing for shells is "Build your own", not "Lilly needs a change." This is not a cosmetic difference — it communicates that no cook effort is wasted on accommodation. The meal was designed for dietary variety.

### Why Both Still Matter

Normal recipes dominate the current THA meal library. The compatibility adapter (Phase 2) makes this library visible to households. Without it, V1 only shows compatibility for the one confirmed purpose-built shell ("Cooked Breakfast") plus any additional shells seeded as part of V1 work.

Shell meals represent a higher-quality household compatibility experience — first-class multi-option presentation, accurate prep time modelling, explicit "designed for variety" signal. As more shells are seeded, the household planner experience improves. But the normal meal path must ship first because it covers the existing content.

These paths are complementary. Shells are designed for participation; normal recipes are adapted for participation. Both end in everyone eating together.

---

## Section 8 — Nutrition Enhancement Integration

This section identifies future opportunities only. V1 does not change the Nutrition Boost system.

### Current State

The Nutrition Boost system (`MealUpliftPanel`) suggests additions based on the meal's ingredient profile and the requesting user's health goals. It operates at the meal level for a single user. It has no household awareness.

### Opportunity: Household-Safe Boost Suggestions

Once `householdFit.memberChanges` is in the API response, the Nutrition Boost system has enough context to:
- Identify which ingredients are shared (safe for all eaters)
- Identify which ingredients are personal adaptations (only relevant to one eater)
- Flag boost suggestions that would conflict with a specific eater's restrictions

**Design concept (not V1):** Boost suggestions in three categories:
- "For everyone" — additions safe and beneficial for all eaters simultaneously
- "For [Name] specifically" — beneficial for one eater, harmless for others
- "Flagged for [Name]" — nutritious but conflicts with that eater's restriction (shown crossed out with reason)

This prevents the boost system from accidentally suggesting Parmesan shavings (nutritious, but dairy) for a household with a dairy-free eater.

### Opportunity: Adaptation-Aware Boosts

When Lilly's adaptation is "chicken → chickpeas", the boost system for Lilly's version could proactively suggest plant-protein enhancers (hemp seeds, nutritional yeast, lentil additions) that are more relevant to a chickpea-based dish than to the original chicken version.

The household compatibility layer enables ingredient-level personalisation of nutrition suggestions. The boost system does not need to know about household members directly — it only needs to know the final ingredient list per eater, which is now derivable from `meal.ingredients` + `memberChanges[].swaps`.

### Opportunity: Shared Ingredient Boosts

The most impactful boost is one that improves the meal for everyone at once. `sharedIngredients[]` from `MealMatch` identifies exactly which ingredients are shared across the household. Boosts applied to shared ingredients benefit all eaters simultaneously. The system should prioritise these.

### Opportunity: Participation-First Nutrition

For shell meals, every protein slot option has different nutritional properties. Plant-based proteins (chickpeas, black beans) have different fibre/micronutrient profiles than meat proteins. The compatibility layer knows which options each eater is selecting. Future nutrition guidance can be slot-option-aware: "Lilly's chickpea selection is high in fibre; consider adding pumpkin seeds for zinc."

**V2 threshold:** All of the above require `householdFit` data in the API response (Phase 3) and the "Accept adaptations" interaction (V2 accept flow) before the final per-eater ingredient state is known with confidence. None of these are V1.

---

## Section 9 — Risks

### Technical Risks

| Risk | Severity | Evidence | Mitigation |
|------|----------|----------|-----------|
| Eager `matchMealsForHousehold()` call adds latency to every planning request | MEDIUM | Today it only runs at Tier-4 | Profile the call; consider a timeout or async non-blocking path if latency is unacceptable |
| `scoreMealCompatibility()` is called for every Tier 1–3 candidate | MEDIUM | Could be 20+ meals per planning cycle | Pre-compute once per unique meal ID; cache results within the planning cycle |
| Non-canonical restriction strings (raw ingredient words in hardRestrictions) lost after Phase 5 resolver replacement | LOW-MEDIUM | Children's UI presents curated list; adult rows empty today | Use Option B (resolver primary, substring fallback) if regression is confirmed during testing |
| `ingredient_swaps` DB table has sparse coverage | MEDIUM | Unknown — content depends on what has been seeded | Audit the table before Phase 4 ships; "remove X" fallback in UI must handle missing swaps gracefully |
| Only one confirmed purpose-built shell ("Cooked Breakfast") | LOW | Investigation 2 confirmed Taco/Pizza/Burger Night are comment-only in seed | Plan shell content work as part of V1 delivery; Phase 4 UX relies on shells being available |
| `meal.dietTypes` sparsely populated on user-saved meals | MEDIUM | Path A silently skips when empty | Document as known limitation; Phase 5 resolver helps but can't invent data that doesn't exist |

### Data Risks

| Risk | Severity | Evidence | Mitigation |
|------|----------|----------|-----------|
| Adult eater data gap (primary prerequisite) | HIGH | Investigation 1 confirmed `defaultDietTypes: []` and `hardRestrictions: []` for all adult eater rows | Phase 1 must complete before Phase 4 ships; feature is visibly incomplete without it |
| Diet pattern divergence after Phase 1 (profile vs eater row divergence over time) | LOW-MEDIUM | If user edits profile, eater row must sync; if user edits eater row directly, profile must not overwrite | Profile save syncs eater row; eater PATCH flow must not be overwritten by profile save |
| `scoreBreakdown.compatibility` precision caveat | LOW | Confirmed: Path A conflicts only, not Path B ingredient conflicts | Tier classification must use `memberChanges.length` not `scoreBreakdown.compatibility` as source of truth |

### UX Risks

| Risk | Severity | Evidence | Mitigation |
|------|----------|----------|-----------|
| "Fits X of Y" without context feels like a negative grade | MEDIUM | A "Fits 1 of 4" meal may be an excellent household meal with easy swaps | Lead with eater names and swap descriptions, not the ratio alone; use tier labels to communicate ease |
| Review panel too long on mobile for households with many eaters | LOW | Standard bottom sheet scroll handles this | Cap per-eater section to most critical swaps; "see all" expansion for long lists |
| Path A category-level conflicts ("Vegetarian diet not covered") feel vague to users | MEDIUM | The system cannot be more specific without ingredient-level data | Show "View ingredients" link; resolves naturally once Phase 1 adult data is correct |
| Compatibility strip clutters meal cards for single-eater households | LOW | Strip is conditionally rendered only when household has 2+ eaters with dietary data | Gate rendering on `householdFit` presence in API response |

### Trust Risks

| Risk | Severity | Evidence | Mitigation |
|------|----------|----------|-----------|
| False-positive swaps ("savoy cabbage → soy-free flagged") undermine user trust | MEDIUM | Investigation 4 confirmed this exact example | Phase 5 resolver integration eliminates this class of error; ship Phase 5 before or concurrent with Phase 4 |
| Missing swaps ("remove beef mince" with no alternative) discourage users | MEDIUM | Depends on `ingredient_swaps` DB coverage | Audit DB coverage; ensure common dietary swaps are seeded before launch |
| Adult eater showing "fully compatible" when they have real dietary needs (pre-Phase-1 state) | HIGH | Confirmed: adults appear compatible because their restriction arrays are empty | Do not ship Phase 4 without Phase 1 complete |
| Compatibility scores for shell templates differ from normal meals in accuracy | LOW | Shell templates have explicit `compatibleDiets` and slot architecture; normal meals may have empty `dietTypes` | Document the difference; UI should not imply equal accuracy for both paths |

---

## Section 10 — Recommended V1 Scope

### Included in V1

1. **Phase 1 — Adult eater data fix.** `syncMembersAsEaters()` populates dietary data from user profile. Profile save syncs eater row. One-time backfill for existing rows. (Prerequisite for all other work.)

2. **Phase 2 — Normal meal compatibility adapter.** `computeIngredientCompatibility()` extracted from `scoreTemplate()`. New `scoreMealCompatibility()` for user-saved meals. `matchMealsForHousehold()` call made eager in the planning pipeline.

3. **Phase 3 — Compatibility data propagation.** `householdFit` field added to `ScoredCandidate` (server) and `SmartCandidate` (client). `memberChanges`, `explanation`, `extraPrepMinutes`, `tier` propagated through the API boundary.

4. **Phase 4 — Compatibility Review UI.** Household fit strip on meal cards. Per-eater dot indicators. "Fits X of Y" label. Tappable strip opens review bottom sheet. Per-eater adaptation details (display only, no accept/persist).

5. **Phase 5 — Restriction resolver integration.** Path B detection upgraded from raw substring matching to canonical resolver. False positives eliminated. Derived ingredient detection added (cream, butter, tofu, prawns, soy sauce).

6. **Shell content expansion.** Seed at minimum 3–4 additional purpose-built household shells (Taco Night, Pizza Night, Burger Night, Curry Night) with populated slot arrays and `compatibleDiets`. Without these, shell compatibility display has only one data point.

### Explicitly Excluded from V1 (V2 items)

| Feature | Reason for deferral |
|---------|---------------------|
| "Accept for this week" persistence (Option A in design doc) | Uses `plannerWeekEaterOverrides` but introduces a write path; deferred to keep V1 read-only |
| "Remember for [Name]" — writing accepted swaps to eater records | Schema change to `household_eaters`; V2 |
| "Why?" inline expansion on swap rows | Requires conflict reason field in API response; additive enhancement for V2 |
| Tooltip per individual eater dot | UI enhancement, not core functionality |
| Household variant library ("Beef Lasagne — Lilly's Version") | New "derived meal" concept; schema change; long-term |
| Caloric/macro recalculation per variant | Data infrastructure not present |
| Nutrition Boost household-awareness | Requires accepted adaptations state (V2); opportunity not obligation |
| Eater learning from repeated accepted swaps | Requires V2 accept flow |
| Planner transparency "Why this meal?" household section | Additive to existing explanation system; V2 |
| `plannerWeekEaterOverrides` read-path in compatibility | Could show this-week dietary changes in compatibility scores; deferred for simplicity |

---

## Section 11 — Success Criteria

### How We Know Household Compatibility V1 Is Successful

**Planner transparency improved:**
- Meal cards in households with dietary-varied eaters show the household fit strip on every planned meal
- The strip renders non-empty compatibility data (not blank or "Fits 0 of N") for at least the adult user's profile restrictions (Phase 1 prerequisite)
- Compatibility data is present for both shell meals and user-saved meals (Phase 2 prerequisite)

**Household adaptations visible:**
- For any planned meal where at least one eater has a confirmed ingredient conflict, the specific "X → Y" or "remove X" swap is visible in the Review Changes panel
- The named eater is always shown alongside their specific swaps (no anonymous "1 member requires changes")
- Shell meals show participation layout, not adaptation layout, in the review panel

**Fewer abandoned meals:**
- Qualitative signal: users who encounter a "Fits 3 of 4" meal should feel informed rather than blocked. The design test is whether the Review Changes panel leads to meal selection (with noted adaptations) rather than meal rejection.
- Measurement proxy: rate of "Choose a different meal" (future V2 CTA) vs remaining on the suggested meal

**Higher planner acceptance:**
- Household users with complex dietary profiles (2+ eaters, varied restrictions) should show higher Smart Plan acceptance rates after V1 than before
- Specific proxy: reduction in manual meal swaps performed by households with children (who already have populated `defaultDietTypes`)

**False-positive elimination (Phase 5):**
- No instances of `savoy cabbage` generating a soy-free conflict
- No instances of `tofu` failing to generate a soy-free conflict (false negative eliminated)
- No instances of `cream` failing to generate a dairy-free conflict (false negative eliminated)

**Data completeness:**
- All adult household eater rows have non-empty `defaultDietTypes` after Phase 1 ships (can be verified with a direct DB count)
- `householdFit` field is present in the API response for all Smart Planner suggestions when the requesting user has household eaters

---

## Section 12 — Source Index

All findings in this document are evidence-based. Speculation is explicitly labelled as "Assumption" or "Recommendation" where it appears. The following investigations are the primary sources.

| Investigation | Key Finding | Status |
|--------------|-------------|--------|
| `HOUSEHOLD_EATERS_ADULT_PROFILE_DATA_SOURCE_INVESTIGATION.md` | Adult eater rows have `defaultDietTypes: []` and `hardRestrictions: []`. No sync path from `users.diet_pattern` to `household_eaters` exists. | STATUS B (action required) |
| `HOUSEHOLD_COMPATIBILITY_ENGINE_LIVE_VALIDATION.md` | Compatibility engine exists and generates all required fields. Runs only at Tier-4 (lazy). All compatibility data discarded before API response. Only one confirmed purpose-built shell. | STATUS B (small-medium backend additions required) |
| `NORMAL_MEAL_COMPATIBILITY_ENGINE_FEASIBILITY.md` | `scoreTemplate()` lines 262–317 contain zero shell-specific logic. `meal.ingredients[]` is structurally identical to the flat slot list. Lightweight adapter sufficient. One shared function, no logic duplication. | STATUS A |
| `HOUSEHOLD_COMPATIBILITY_RESTRICTION_RESOLVER_FEASIBILITY.md` | Resolver can replace Path B substring matching. False positives eliminated. Derived ingredient detection added (cream, butter, tofu, prawns). 8-line surgical change. Non-canonical regression risk is low and bounded. | STATUS B (pre-resolution adapter step required) |
| `HOUSEHOLD_COMPATIBILITY_REVIEW_DESIGN.md` | Full UX specification for five-tier model, card anatomy, review panel layouts, shell vs normal meal framing, and accept-adaptations options. | Design complete |
| `PARTIAL_HOUSEHOLD_COMPATIBILITY_FEASIBILITY.md` | Backend can fully compute "Beef Lasagne fits 3 of 4, Lilly requires beef mince → lentils." Blocking gap is API boundary only — `memberChanges` is computed and discarded. | STATUS A |

---

*Document ends.*
