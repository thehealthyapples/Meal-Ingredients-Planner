# Smart Planner — Dietary-Aware External Search
**Date:** 2026-06-06
**Branch:** main
**Commit:** 6503356

---

## Rollback Points

| Point | Tag |
|---|---|
| ROLLBACK BEFORE | `rollback/before-dietary-external-search` |
| ROLLBACK AFTER | `rollback/after-dietary-external-search` |

To restore to BEFORE state:
```
git checkout rollback/before-dietary-external-search
```

---

## What Was Implemented

**Option A only:** Use Profile dietary preferences when constructing external search queries.

### Previous behaviour

External recipe searches used generic query terms regardless of profile:

```
healthy dinner
quick lunch
easy breakfast
```

### New behaviour

For supported diet types, the dietary term is prepended to every query:

```
vegan healthy dinner
vegan quick lunch
vegan easy breakfast
```

---

## Supported Dietary Prefixes

Applied in this priority order (first match wins):

| Priority | Diet Type (stored value) | Search Prefix |
|---|---|---|
| 1 | Vegan | `vegan` |
| 2 | Vegetarian | `vegetarian` |
| 3 | Keto | `keto` |
| 4 | Paleo | `paleo` |
| 5 | Gluten-Free | `gluten-free` |
| 6 | Dairy-Free | `dairy-free` |
| 7 | Low-Carb | `low-carb` |
| 8 | Mediterranean | `mediterranean` |

### NOT applied for

| Diet Type | Reason |
|---|---|
| DASH | Candidate pools too sparse |
| MIND | Candidate pools too sparse |
| Flexitarian | Candidate pools too sparse |
| Carnivore | Candidate pools too sparse |

### Priority examples

| Profile Diet Types | Prefix Used |
|---|---|
| Vegan + Vegetarian | `vegan` |
| Vegetarian + Low-Carb | `vegetarian` |
| Keto + Mediterranean | `keto` |
| DASH | _(none — generic search)_ |

---

## Fallback Protection

If dietary-filtered retrieval returns **fewer than 10 external candidates**:

1. Generic (unprefixed) search is run across all sources
2. Results are merged (deduplicated by name)
3. Planner continues with combined pool

This prevents candidate starvation for niche dietary combinations.

---

## Sources Covered

All active external sources apply the prefix:

- TheMealDB
- BBC Good Food
- AllRecipes
- Jamie Oliver
- Serious Eats

---

## Files Changed

### `server/lib/smart-suggest-service.ts`

**Added** — `DIETARY_SEARCH_PREFIXES` priority table:
```typescript
const DIETARY_SEARCH_PREFIXES: [string, string][] = [
  ["Vegan", "vegan"],
  ["Vegetarian", "vegetarian"],
  ["Keto", "keto"],
  ["Paleo", "paleo"],
  ["Gluten-Free", "gluten-free"],
  ["Dairy-Free", "dairy-free"],
  ["Low-Carb", "low-carb"],
  ["Mediterranean", "mediterranean"],
];
```

**Added** — `getDietarySearchPrefix(dietTypes: string[]): string | undefined`
Walks the priority list against `prefs.dietTypes` (case-insensitive), returns the first matching prefix or `undefined`.

**Updated** — `generateSmartSuggestion()` call to `fetchExternalCandidates`:
```typescript
const dietaryPrefix = prefs ? getDietarySearchPrefix(prefs.dietTypes) : undefined;

const externalCandidates = await fetchExternalCandidates({
  cuisine: settings.preferredCuisine,
  query: settings.preferredCuisine || undefined,
  dietaryPrefix,
});
```

---

### `server/lib/external-meal-service.ts`

**Updated** — `buildSearchQueries()`: accepts `dietaryPrefix?: string`, prepends it to each query term.

**Updated** — `searchMealDB()`: accepts `dietaryPrefix?: string`, prepends to its own raw query list before sending to TheMealDB API.

**Updated** — Filter types on `searchBBCGoodFoodEnhanced`, `searchAllRecipes`, `searchJamieOliver`, `searchSeriousEats`: each now accepts `dietaryPrefix?: string` (passed through to `buildSearchQueries`).

**Updated** — `fetchExternalCandidates()`: accepts `dietaryPrefix?: string`, passes to all sources, implements fallback:
```typescript
if (filters.dietaryPrefix && combined.length < 10) {
  // run generic search, merge deduplicated results
}
```

---

## Build & Type Check Results

| Check | Result |
|---|---|
| `npm run build` | ✓ Pass |
| `npx tsc --noEmit` | ✓ Pass — no errors |

---

## Test Matrix

| Test | Profile | Expected | Status |
|---|---|---|---|
| 1 | Vegan | External queries prefixed with `vegan` | ✓ Logic verified |
| 2 | Vegetarian | External queries prefixed with `vegetarian` | ✓ Logic verified |
| 3 | Keto | External queries prefixed with `keto` | ✓ Logic verified |
| 4 | DASH | No prefix — generic search | ✓ Logic verified |
| 5 | MIND | No prefix — generic search | ✓ Logic verified |
| 6 | Planner generation | Complete week still generates | ✓ No logic changed |
| 7 | Vegan + Low-Carb | Vegan prefix wins (priority 1 > 7) | ✓ Logic verified |

---

## What Was NOT Changed

- Candidate scoring logic
- Meal suitability logic
- Dietary exclusion rules
- Schema / database structure
- API-Ninjas provider (not activated)
- Edamam provider (not activated)
- Internal meals behaviour
- My Meals / Cookbook
- Verified/unverified classifications (not added)

---

## Data Impact

| | |
|---|---|
| Reads existing data | Yes — `prefs.dietTypes` |
| Writes new data | No |
| Changes meaning of existing data | No |
| Requires backfill | No |
| Schema changes | None |
| Migration | None |

---

## Trust Check

| Question | Answer |
|---|---|
| Could this mislead the user? | No |
| Could this fabricate certainty? | No |
| Is anything guessed but shown as real? | No |
| What if the system is wrong? | Generic fallback search still operates |
