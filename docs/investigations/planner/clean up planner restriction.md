PROFILE DIETARY TITLE-SAFETY FIX IMPLEMENTED: YES

---

## Rollback Before

Tag: `rollback/pre-title-safety-fix-20260607-083027`
Commit: `af620b9` (feat(planner): single Profile compliance gate for system-generated writes)

## Rollback After

Tag: `rollback/post-title-safety-fix-20260607-083744`
Commit: `ce755a7` (fix(dietRules): Profile dietary title-safety for ingredient-less external candidates)

---

## Files Changed

| File | Change |
|---|---|
| `server/lib/dietRules.ts` | Added `normalizeForSearch`, `DISH_NAME_MEAT_OR_SEAFOOD`, "seafood" to `FISH_SEAFOOD_KEYWORDS`, updated Vegan/Vegetarian cases |
| `server/lib/external-meal-service.ts` | Fixed `searchBBCGoodFoodEnhanced` to apply `dietaryPrefix` |
| `server/tests/test-profile-dietary-title-safety.ts` | New regression test file (33 pass, 5 known limitations) |

---

## Exact Keyword / Title-Safety Changes

### 1. `FISH_SEAFOOD_KEYWORDS` — `server/lib/dietRules.ts`

Added `"seafood"` as the second entry (after "fish"):

```typescript
const FISH_SEAFOOD_KEYWORDS = [
  "fish", "seafood",     // ← "seafood" added
  "salmon", "tuna", ...
```

**Why:** `\bfish\b` does not match inside the compound word "seafood" (word boundary confirmed). "Healthy Seafood Pasta" passed all Vegan/Vegetarian checks with ingredients=[].

---

### 2. `DISH_NAME_MEAT_OR_SEAFOOD` — new constant, `server/lib/dietRules.ts`

```typescript
const DISH_NAME_MEAT_OR_SEAFOOD = [
  "carbonara",  // implies bacon/pancetta + eggs + parmesan
  "ragu",       // Italian meat sauce (normalisation catches ragù)
  "bolognese",  // implies ground beef/pork
  "birria",     // implies braised beef or goat
  "ossobuco",   // implies braised veal shank
];
```

This list is checked for both `"Vegan"` and `"Vegetarian"` diet patterns in `shouldExcludeRecipe`.

---

### 3. Vegan and Vegetarian cases updated

```typescript
case "Vegan":
  return (
    containsAny(lower, MEAT_KEYWORDS) ||
    containsAny(lower, FISH_SEAFOOD_KEYWORDS) ||
    containsAny(lower, DAIRY_KEYWORDS) ||
    containsAny(lower, ["egg", "eggs", "honey", "gelatin", "gelatine"]) ||
    containsAny(lower, DISH_NAME_MEAT_OR_SEAFOOD)   // ← added
  );

case "Vegetarian":
  return (
    containsAny(lower, MEAT_KEYWORDS) ||
    containsAny(lower, FISH_SEAFOOD_KEYWORDS) ||
    containsAny(lower, ["gelatin", "gelatine", "lard", "suet", "rennet"]) ||
    containsAny(lower, DISH_NAME_MEAT_OR_SEAFOOD)   // ← added
  );
```

---

### 4. Diacritic normalisation — `normalizeForSearch`

New helper applied inside both `containsAny` and `countMatches`:

```typescript
function normalizeForSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
```

Applied to both the text being searched and each keyword, so accent variants match without duplicate entries. "ragù" normalises to "ragu" and matches the keyword "ragu".

---

## BBC Good Food Prefix Fix

### `server/lib/external-meal-service.ts` — `searchBBCGoodFoodEnhanced`

Before the fix, `dietaryPrefix` was accepted as a parameter but never used in query building. After:

```typescript
const prefixedQueries = filters.dietaryPrefix
  ? queries.map(q => `${filters.dietaryPrefix} ${q}`)
  : queries;

for (const query of prefixedQueries.slice(0, 3)) {
```

For a Vegan profile, BBC Good Food now searches:
- `"vegan healthy dinner"`
- `"vegan quick lunch"`
- `"vegan easy breakfast"`

instead of the previous:
- `"healthy dinner"`
- `"quick lunch"`
- `"easy breakfast"`

This matches the pattern already used by AllRecipes, Jamie Oliver, and Serious Eats via `buildSearchQueries`.

---

## Build Result

✅ `npm run build` — clean, no errors

## TypeScript Result

✅ `npx tsc --noEmit` — no output (zero errors)

## Test Result

```
RESULTS: 14/14 passed  ✅
RESULTS: 13/13 passed  ✅
RESULTS: 12/12 passed  ✅
Results: 18 passed, 0 failed
Results: 76 passed, 0 failed
Planner compliance gate: 25 passed, 0 failed
```

New test file: `server/tests/test-profile-dietary-title-safety.ts`
```
33 passed, 0 failed, 5 known limitation(s)
ALL TESTS PASSED
```

Known limitations documented (not fixed in this task):
- `\bmilk\b` false-positive: Dairy-Free incorrectly excludes coconut milk, oat milk, almond milk, soy milk
- Same false-positive affects Vegan: chickpea curry with coconut milk ingredient is incorrectly excluded

---

## Manual Test Result

Not run in this session (no live browser environment). The filter operates entirely in `shouldExcludeRecipe` which is unit-tested. The new tests directly exercise `candidateDietExcluded` with title-only candidates, confirming all three bad meal types are now blocked.

---

## What Is Now Blocked

### Vegan Smart Plan — title-only external candidates

| Meal title | Was blocked? | Now blocked? |
|---|---|---|
| Carbonara | ❌ No | ✅ Yes |
| Healthy Carbonara | ❌ No | ✅ Yes |
| Ragu Pasta | ❌ No | ✅ Yes |
| Ragù Pasta (accented) | ❌ No | ✅ Yes |
| Bolognese | ❌ No | ✅ Yes |
| Birria Tacos | ❌ No | ✅ Yes |
| Ossobuco Milanese | ❌ No | ✅ Yes |
| Healthy Seafood Pasta | ❌ No | ✅ Yes |
| Seafood Linguine | ❌ No | ✅ Yes |

### Vegetarian Smart Plan — title-only external candidates

All of the above are also now blocked for Vegetarian (meat or seafood implied).

---

## Remaining Known Limitations

1. **`\bmilk\b` false positive** — Dairy-Free and Vegan incorrectly exclude recipes whose title or ingredients contain "coconut milk", "oat milk", "almond milk", "soy milk". Pre-existing issue, not introduced by this fix, not fixed here. Requires a plant-milk allowlist or DAIRY_KEYWORDS term-split approach.

2. **"Vegan Bolognese" excluded** — Title-only filter cannot distinguish "Vegan Bolognese" from "Bolognese" without ingredient data. Conservative trade-off: the recipe is blocked and the user can add it manually via My Meals with full ingredients.

3. **Fallback generic search still runs** — When dietary-prefixed search returns < 10 candidates, generic search re-runs across all sources. Title-safety fixes above cover the known gaps; any novel dish-name gap in a generic result would still require a new keyword addition.

4. **Scrapers still return `ingredients: []`** — BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats. All filtering for these sources remains title-based. Only TheMealDB provides full ingredient data from its API.

---

## Scope

- ✅ Shared `dietRules` title-safety improvements (not Smart Planner-only)
- ✅ BBC Good Food `dietaryPrefix` fix
- ✅ Regression tests (Vegan, Vegetarian, Dairy-Free known limitations)
- ✅ No schema changes
- ✅ No migrations
- ✅ No new recipe providers activated
- ✅ No scoring changes
- ✅ No planner UI changes
- ✅ Single dietRules engine — no duplicate filtering logic introduced
