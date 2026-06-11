# Household-Aware Nutrition Boosts — Investigation Report

**Rollback Identifier:** `rollback/release-1-nutrition-enhancement-20260609-223957` → commit `1e83f32`
**Investigation date:** 2026-06-09
**Status:** COMPLETE — investigation only, no code changes

---

## ROOT CAUSE

`NutritionBoostPanel` currently receives only two props: `mealName: string` and `ingredients: string[]`. The `getMealBoosts()` function that drives it performs keyword matching against meal names and filters out ingredients already in the meal — but it has no access to household dietary data. It will therefore suggest Walnuts to a nut-allergy household and Chickpeas to a Keto household, regardless of what is configured in their eater profiles.

The root cause is a single-step omission during Release 1 design: household context was not threaded into the boost pipeline. The infrastructure to fix it already exists — both the household data and the restriction utilities are present client-side and in production use in other components.

---

## CURRENT DATA FLOW

```
weekly-planner-page.tsx
  └── meal detail dialog
        └── <NutritionBoostPanel
              mealName={meal.name}
              ingredients={meal.ingredients ?? []}
            />
              └── getMealBoosts(mealName, ingredients)
                    ├── Keyword-match meal name → select MEAL_TYPE_BOOSTS entry
                    ├── Filter candidates already in ingredients string
                    └── Return top 3 BoostItems (name + category)
```

No household data enters this pipeline at any point. The `householdEaters` query result exists in the planner page scope at the render point but is not passed to `NutritionBoostPanel`.

---

## AVAILABLE HOUSEHOLD DATA

### Source query
**File:** `client/src/pages/weekly-planner-page.tsx:641`
```typescript
const { data: householdEaters = [] } = useQuery<HouseholdEater[]>({
  queryKey: ["/api/household/eaters"],
});
```

This query is already resolved by the time `NutritionBoostPanel` renders at line ~3391 (same render tree, same page load).

### HouseholdEater shape
**File:** `shared/household-eater.ts`
```typescript
export interface HouseholdEater {
  id: string;
  displayName: string;
  defaultDietTypes: string[];   // soft preferences — Keto, Vegan, etc.
  hardRestrictions: string[];   // non-overridable: allergies, intolerances
  kind: "user" | "child";
  userId?: number;
}
```

- `hardRestrictions` — the set of restriction strings that must never be violated. Examples: `["nut_free"]`, `["gluten_free", "dairy_free"]`. The LEGACY_ALIAS_EXPANSIONS in `restriction-resolver.ts` expand `"nut_free"` to cover both `peanut` and `tree_nut` at resolution time.
- `defaultDietTypes` — soft preferences such as `"keto"`, `"vegan"`, `"vegetarian"`. These can be overridden per-week but represent the member's default expectation.

### Weekly diet overrides
**File:** `shared/household-eater.ts`
```typescript
export function getEffectiveDietProfile(
  member: HouseholdEater,
  override?: DietOverride,
): EffectiveDietProfile
```
Returns `{ dietTypes, hardRestrictions }`. Hard restrictions are always preserved; `dietTypes` reflects the override when present. Used by the planner to apply per-week overrides. `weekOverrides` is available in `weekly-planner-page.tsx` and could be used here, but for a first pass `defaultDietTypes` is sufficient.

---

## REUSE OPTIONS

### Option R1 — `computeRestrictionSafety()` for hard restrictions
**File:** `shared/restrictions/restriction-safety.ts`
```typescript
export interface EaterProfile { displayName: string; hardRestrictions: string[]; }
export function computeRestrictionSafety(
  ingredients: string[],
  eaterProfiles: EaterProfile[],
): RestrictionSafetyResult[]
```
- Pure function, no I/O
- Already imported and used client-side in three components: `WorkspaceAnalyserSheet.tsx`, `WholeFoodAnalysisCard.tsx`, `AnalyserDetailV2.tsx`
- Backed by `restriction-library.ts` v3.0.0 — covers: peanut, tree_nut, sesame, soy, gluten, dairy, eggs, shellfish, coconut
- Handles LEGACY_ALIAS_EXPANSIONS (`"nut_free"` → peanut + tree_nut) via `resolveActiveRestrictions()`
- Calling `computeRestrictionSafety(["Walnuts"], eaterProfiles)` for a household with `hardRestrictions: ["nut_free"]` would return `unsafe` — exactly what we need

### Option R2 — `shouldExcludeRecipe()` for diet patterns
**File:** `client/src/lib/dietRules.ts`
```typescript
export function shouldExcludeRecipe(
  text: string,
  { dietPattern, dietRestrictions }: ExclusionOptions,
): boolean
```
- Pure function, no I/O, identical copy of `server/lib/dietRules.ts`
- Handles: Keto (KETO_EXCLUDE), Low-Carb, Paleo, Vegan, Vegetarian, Gluten-Free, Dairy-Free, Carnivore
- KETO_EXCLUDE includes `DICT_LEGUMES`: `["beans", "lentils", "legumes", "chickpeas", "hummus", "kidney beans", "black beans", "pinto beans", ...]`
- Calling `shouldExcludeRecipe("Chickpeas", { dietPattern: "keto" })` returns `true`
- **Does NOT cover nut/peanut/tree_nut/sesame/soy as hard restrictions** — those are handled by R1 only

---

## CONFLICT ANALYSIS

### Hard restriction conflicts in current boost library

| Boost Item | Category | Triggered restriction | Example eater profile |
|---|---|---|---|
| Walnuts | nuts | `tree_nut` / `nut_free` | `hardRestrictions: ["nut_free"]` |
| Almonds | nuts | `tree_nut` / `nut_free` | `hardRestrictions: ["nut_free"]` |
| Kimchi | fermented | `soy` (some brands) | `hardRestrictions: ["soy"]` — risk is lower but present |
| Sauerkraut | fermented | none (cabbage/salt) | No restriction conflict |
| Chia Seeds | seeds | none | No restriction conflict |
| Pumpkin Seeds | seeds | none | No restriction conflict |
| Flax Seeds | seeds | none | No restriction conflict |

**Primary hard restriction risk:** Walnuts and Almonds shown to `tree_nut`/`nut_free` households. This is the highest-priority conflict — nut allergies can be anaphylactic.

### Soft diet preference conflicts in current boost library

| Boost Item | Category | Triggered diet pattern | Notes |
|---|---|---|---|
| Chickpeas | legumes | Keto, Low-Carb, Paleo | All three exclude DICT_LEGUMES |
| Lentils | legumes | Keto, Low-Carb, Paleo | All three exclude DICT_LEGUMES |
| Black Beans | legumes | Keto, Low-Carb, Paleo | All three exclude DICT_LEGUMES |
| Mixed Beans | legumes | Keto, Low-Carb, Paleo | All three exclude DICT_LEGUMES |
| Kale, Spinach | extra-veg | none | All diet patterns accept these |
| Avocado | healthy-fats | none | Keto-friendly |
| Extra Virgin Olive Oil | healthy-fats | none | Keto-friendly |

**Primary diet preference risk:** All four legume boosts shown to Keto/Low-Carb household members. While soft preferences are non-enforced, suggesting foods directly contradicting a member's active diet undermines household trust.

---

## IMPLEMENTATION OPTIONS

### Option A — Filter at `getMealBoosts()` function level

**What changes:**
- `client/src/lib/nutrition-boosts.ts` — Add `householdExclusions?: string[]` param to `getMealBoosts()`. Caller pre-computes which boost names are excluded (one string per excluded item) and passes them in. The function filters candidates against this list before returning.
- `client/src/components/NutritionBoostPanel.tsx` — Add `householdExclusions?: string[]` prop. Panel calls `getMealBoosts(mealName, ingredients, householdExclusions)`.
- `client/src/pages/weekly-planner-page.tsx` — At the `NutritionBoostPanel` render site, compute exclusions from `householdEaters` using `computeRestrictionSafety` and `shouldExcludeRecipe`, then pass the resulting string array as `householdExclusions`.

**Files affected:** 3 files

**Pros:**
- Library function stays simple — exclusions are just a string filter
- Restriction resolution logic lives in the page, co-located with the `householdEaters` query that produces it
- `getMealBoosts()` stays pure — exclusions is an opaque string array, no dependency on `HouseholdEater`

**Cons:**
- Restriction computing logic in the planner page makes `NutritionBoostPanel` harder to reuse elsewhere (future meal log, cookbook view) — callers must know to compute exclusions
- Page-level exclusion computation may grow complex: must handle `hardRestrictions` via `computeRestrictionSafety` AND `defaultDietTypes` via `shouldExcludeRecipe` separately, then merge to a string list

**Risk rating:** Low. Pure function signature extension; no existing behaviour changes; exclusions param is additive (empty array = current behaviour).

---

### Option B — Filter at `NutritionBoostPanel` component level *(Recommended)*

**What changes:**
- `client/src/components/NutritionBoostPanel.tsx` — Add `householdEaters?: HouseholdEater[]` optional prop. Inside the component, before rendering, iterate each candidate boost and use `computeRestrictionSafety([boostName], eaterProfiles)` for hard restriction checks and `shouldExcludeRecipe(boostName, { dietPattern })` for diet checks. Filter out any boost that returns `unsafe` or `warning` from restriction safety, or `true` from diet exclusion.
- `client/src/pages/weekly-planner-page.tsx` — Pass `householdEaters={householdEaters}` to the existing `NutritionBoostPanel` call. Single-line change.
- `client/src/lib/nutrition-boosts.ts` — No changes required.

**Files affected:** 2 files

**Pros:**
- Self-contained component: the panel handles its own safety filtering, no caller needs to know how
- Reusable: any future call site passes `householdEaters` and gets safe boosts automatically
- Uses already-proven client-side utilities (`computeRestrictionSafety` — confirmed used in 3 components, `shouldExcludeRecipe` — pure, well-tested)
- `getMealBoosts()` library remains unchanged — no function signature change
- Prop is optional with a `?` type — no breaking change; existing test code or callers without household data continue to work

**Cons:**
- Component acquires a dependency on `HouseholdEater` type (from `shared/household-eater.ts`) and two restriction utilities — component is slightly heavier
- Boost filtering happens inside the component rather than at the data layer — `getMealBoosts()` still returns unfiltered candidates internally

**Risk rating:** Low. Optional prop, pure filtering logic only, two well-understood dependencies already used client-side.

**Sketch (not implemented):**
```tsx
// In NutritionBoostPanel.tsx:
interface NutritionBoostPanelProps {
  mealName: string;
  ingredients: string[];
  householdEaters?: HouseholdEater[];          // new optional prop
}

export function NutritionBoostPanel({ mealName, ingredients, householdEaters = [] }: NutritionBoostPanelProps) {
  const candidates = getMealBoosts(mealName, ingredients);

  const eaterProfiles = householdEaters.map(e => ({
    displayName: e.displayName,
    hardRestrictions: e.hardRestrictions,
  }));

  const allDietTypes = householdEaters.flatMap(e => e.defaultDietTypes);

  const safeBoosts = candidates.filter(boost => {
    // Hard restriction check (nut_free, tree_nut, gluten, dairy, soy, etc.)
    if (eaterProfiles.length > 0) {
      const safety = computeRestrictionSafety([boost.name], eaterProfiles);
      if (safety.some(r => r.status === "unsafe" || r.status === "warning")) return false;
    }
    // Diet pattern check (keto legumes, paleo legumes, etc.)
    for (const diet of allDietTypes) {
      if (shouldExcludeRecipe(boost.name, { dietPattern: diet })) return false;
    }
    return true;
  });

  if (safeBoosts.length === 0) return null;
  // ... render safeBoosts
}

// In weekly-planner-page.tsx — single line change:
<NutritionBoostPanel
  mealName={meal.name}
  ingredients={meal.ingredients ?? []}
  householdEaters={householdEaters}            // add this
/>
```

---

### Option C — Filter at the call site in `weekly-planner-page.tsx` only

**What changes:**
- `client/src/pages/weekly-planner-page.tsx` — Replace `<NutritionBoostPanel .../>` with an inline wrapper that calls `getMealBoosts()` directly, applies restriction and diet filtering, and passes a pre-filtered list to the panel (or renders a simpler custom list). No changes to `NutritionBoostPanel` or `nutrition-boosts.ts`.
- Requires refactoring the panel to accept `boosts?: NutritionBoostSuggestion[]` as an override prop, or duplicating render logic in the page.

**Files affected:** 2 files (but changes are larger and more coupled)

**Pros:**
- `NutritionBoostPanel` and `getMealBoosts()` stay completely unchanged
- Filtering logic sits in the page alongside the household data it uses

**Cons:**
- Planner page (already 3,858 lines) acquires new rendering responsibility
- Boost display and safety logic are now split across two files with no encapsulation boundary
- If `NutritionBoostPanel` is reused elsewhere (meal log, cookbook) it will silently show unsafe boosts unless each caller duplicates the filtering logic
- Requires an API addition to the panel component (`boosts?` override prop) which is a larger signature change than Option B's `householdEaters?`

**Risk rating:** Low technically, but architectural debt: creates a split-responsibility pattern that will compound over time.

---

## RECOMMENDATION

**Implement Option B — filter at `NutritionBoostPanel` component level.**

Rationale:
1. **Smallest safe diff:** 2 files, ~25 lines of new logic, all additive. No existing function signatures change.
2. **Correct encapsulation:** The component becomes self-contained for its safety story. Future reuse is safe by default.
3. **Reuses proven infrastructure:** `computeRestrictionSafety` is already imported in three client-side components and handles LEGACY_ALIAS_EXPANSIONS correctly. `shouldExcludeRecipe` is the canonical Keto/Paleo/diet filter used throughout the planner.
4. **No API changes, no schema changes, no backfill** — this is a pure client-side rendering filter.
5. **Optional prop contract** — `householdEaters?` defaults to `[]`, which preserves current behaviour for any caller that does not pass it.

**Hard restrictions take priority over soft diet preferences.** If filtering is implemented in two passes, the restriction safety pass (using `computeRestrictionSafety`) should run first and definitively exclude allergen/intolerance conflicts. Diet preference filtering (using `shouldExcludeRecipe`) should run second as a best-effort soft filter.

**Do not apply weekly overrides for the first implementation.** Using `eater.defaultDietTypes` is sufficient and correct. Weekly overrides add complexity (requires `weekOverrides` to be in scope) without meaningful gain at the boost suggestion level — a member's default diet is the right signal for what they generally want to avoid.

---

## DATA IMPACT DECLARATION

| Check | Status |
|---|---|
| Reads existing data | YES — reads `householdEaters` from existing query (already in scope) |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |
| Migration required | NO |
| API changes | NO |
| New queries | NO |
| Affects Smart Planner algorithm | NO |
| Affects household matcher | NO |

All filtering is client-side and purely additive. The underlying boost library and meal-type mappings do not change; the filtering layer only removes items from the rendered list.

---

## TRUST CHECK

**Risk if deployed as-is (without filtering):**
The current panel is non-mandatory — boosts are labelled "Optional additions" and presented in a clearly secondary UI tier. No boost is presented as medically required or meal-defining. In this sense, showing a suboptimal suggestion to a Keto household (legumes) is a quality/trust issue, not a safety issue.

However, showing Walnuts or Almonds to a household with a nut allergy is a genuine trust issue. Even if the boost is optional, surfacing nut items to an allergy household erodes the "we know your household" promise that underpins the entire product. This is the higher-priority failure case.

**Risk if Option B is implemented before release:**
Very low. The filtering is:
- Pure (no side effects)
- Additive (boosts that pass the filter are unchanged)
- Fail-safe (a filter error should default to showing no boosts, not crashing)
- Transparent (if all boosts are filtered, the panel returns `null` — same as when no meal type matches)

The implementation uses two utilities already confirmed working in production client-side contexts. There is no new network dependency, no new query, and no new state.

**Conclusion:** The nut allergy case is sufficient justification to add filtering before production release. The implementation risk is low enough that this should be treated as a Release 1 completion item, not a post-release enhancement.

---

## DEFINITION OF DONE FOR FUTURE IMPLEMENTATION

When this investigation is actioned, the following must be true before marking complete:

- [ ] `NutritionBoostPanel.tsx` accepts `householdEaters?: HouseholdEater[]` optional prop
- [ ] For each boost candidate, `computeRestrictionSafety([boostName], eaterProfiles)` is called and any `unsafe` or `warning` result removes the boost
- [ ] For each boost candidate, `shouldExcludeRecipe(boostName, { dietPattern })` is called for each eater's `defaultDietTypes` and any `true` result removes the boost
- [ ] `weekly-planner-page.tsx` passes `householdEaters={householdEaters}` to `NutritionBoostPanel`
- [ ] Manual test: household with `hardRestrictions: ["nut_free"]` — Walnuts and Almonds do not appear in boosts
- [ ] Manual test: household with `defaultDietTypes: ["keto"]` — Chickpeas, Lentils, Black Beans, Mixed Beans do not appear in boosts
- [ ] Manual test: household with no restrictions — all 25 boost items remain eligible (no regression in base case)
- [ ] Manual test: `NutritionBoostPanel` used without `householdEaters` prop (e.g. Storybook or future cookbook view) — panel renders normally with unfiltered boosts
- [ ] `npx tsc --noEmit` — zero new errors in changed files
- [ ] No changes to `server/routes.ts`, `shared/schema.ts`, `server/lib/smart-suggest-service.ts`, `server/lib/household-meal-matcher.ts`
- [ ] Implementation report added to `docs/investigations/`

---

*Investigation complete. No application code modified. Smart Planner algorithm unchanged. Household Matcher unchanged. Template Activation unchanged.*
