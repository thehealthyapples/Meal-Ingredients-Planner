# Meal Enhancement Weekly Reuse Investigation

**Date:** 2026-06-10
**Rollback tag:** `rollback/meal-enhancement-weekly-reuse-investigation-20260610-171356`
**Rollback commit:** `1e83f32`
**Status:** Investigation only — no implementation

---

## Objective

Investigate whether Meal Enhancements can prioritise ingredients already used elsewhere in the current planner week.

Example:

> Pizza Night contains Basil.
> When viewing Pasta Night, suggest:
>
> **Basil** — Already used this week: Pizza Night
> *Try adding some here too.*

Goals: reduce waste, reduce shopping cost, increase ingredient reuse, increase nutritional diversity.

---

## 1. Existing Architecture

### System 1 — NutritionBoostPanel (Static)

**Files:** `client/src/lib/nutrition-boosts.ts`, `client/src/components/NutritionBoostPanel.tsx`

**Data source:** Hard-coded library of 26 ingredients across 8 categories. No DB, no API calls.

**Ranking logic:** Keyword match on meal name. First-match wins from a priority-ordered list per meal type. Returns up to 3 suggestions.

**Meal context available:** Meal name (string) + ingredient list (string[]).

**Planner context available:** None. The panel renders purely from the current meal's data.

**Weekly ingredient awareness:** None. The panel has no concept of what is planned elsewhere in the week.

**How it filters already-present ingredients:** Simple substring scan:
```
const ingredientText = ingredients.join(" ").toLowerCase();
filtered = candidates.filter(boost => !ingredientText.includes(boost.toLowerCase()))
```
This is a loose check on the current meal's own ingredients only.

---

### System 2 — MealUpliftPanel (Interactive, DB-Backed)

**Files:** `server/lib/uplift-engine.ts`, `server/lib/uplift-rules.ts`, `client/src/components/MealUpliftPanel.tsx`

**Data source:** 42 human-authored rules, all with `reviewedAt`. Deterministic matching engine with reverse index.

**Ranking logic:** Rules sorted by `priority` (ascending integer). All matched rules pass through diet and slot exclusion gates. Suggestions are deduplicated across rules by ingredient name.

**Meal context available:** `UpliftContext` — mealName, ingredients[], category, mealSlot, dietTypes[].

**Planner context available:** None. `UpliftContext` has no field for weekly ingredients, pantry, or shopping list.

**Weekly ingredient awareness:** None. The uplift engine matches rules against the individual meal only.

**Props received at render time in `weekly-planner-page.tsx` (line 3441-3454):**
- `mealId`
- `plannerEntryId`
- `mealSlot`
- `upliftMatches` (pre-computed `UpliftMatchResult[]`)
- `onMealForked`, `onUpliftAccepted`, `onUpliftRemoved` (callbacks)

No weekly or pantry context is passed to the panel.

---

## 2. Planner Data Available

### Weekly Meal and Ingredient Data

**Source:** `fullPlanner` (from `GET /api/planner/full`) and `meals` (from `GET /api/meals`), both already cached by React Query in the planner page.

**`weekIngredients` — already computed**

At `weekly-planner-page.tsx:469-477` there is an existing `useMemo` that computes all ingredient arrays from meals in the active week:

```typescript
const weekIngredients = useMemo<string[][]>(() => {
  if (!activeWeekData) return [];
  return activeWeekData.days.flatMap((d) =>
    d.entries
      .map((e) => mealById.get(e.mealId))
      .filter((m): m is Meal => !!m && !!(m.ingredients?.length))
      .map((m) => m.ingredients ?? []),
  );
}, [activeWeekData, mealById]);
```

This variable is currently used only by `WeeklyPlantDiversityCounter`.

**Limitation for reuse detection:** `weekIngredients` is `string[][]` — ingredient arrays without meal name labels. To build "Already in: Pizza Night" labels, we need the ingredient-to-meal-name mapping, not just the flat ingredient list.

**What is needed instead:** A derived map of the form:

```
Map<normalizedIngredientKey, string[]>
// e.g. "basil" → ["Pizza Night", "Tomato Pasta"]
```

This can be computed from exactly the same source data (`activeWeekData` + `mealById`) at the same memoisation point. No new API calls required.

---

### Pantry Data

**Already available in the planner page:** `pantryItems` and `pantryNames` are already loaded at `weekly-planner-page.tsx:561-567`:

```typescript
const { data: pantryItems = [] } = useQuery<...>({ queryKey: ['/api/pantry'] });
const pantryNames = useMemo(
  () => pantryItems.map(p => p.displayName ?? p.ingredientKey),
  [pantryItems],
);
```

`pantryNames` is `string[]` — a flat list of ingredient display names. Not currently used by any enhancement system.

---

### Shopping List Data

**Available but not in planner page:** Shopping list items are available at `GET /api/shopping-list`. This data is not currently fetched by the planner page. It would require a new query. The shopping list normalises item names via `normalizedName` on each row.

**Complexity to add:** Low — a single React Query call. The planner page does not import shopping list data today.

---

## 3. Ingredient Matching Feasibility

### The Core Question

Can we reliably determine that the uplift suggestion "Basil" matches the meal ingredient "fresh basil" from another meal?

The answer requires two things:
1. A normalisation function that strips prep words and quantities from ingredient strings
2. A matching strategy that handles substring overlap safely

---

### Available Normalisation Functions

**`normalizeIngredientKey(s)` — `shared/normalize.ts`**

Lowercases, strips diacritics, strips punctuation, collapses whitespace.

```
"Fresh Basil" → "fresh basil"
"2 cloves garlic, crushed" → "2 cloves garlic crushed"
```

Preserves quantity words and prep words — insufficient alone for reuse matching.

---

**`normaliseIngredientForDedupe(ingredient)` — `server/lib/uplift-persistence.ts`**

The richest normaliser in the codebase. Strips:
- Unicode fractions (½, ⅓, ¼...)
- Numeric quantities with optional units (e.g. "2 tbsp", "500g")
- Bare unit words (tsp, tbsp, g, kg, ml, l, oz, lb)
- A curated set of 27 modifier words: fresh, dried, frozen, organic, chopped, sliced, diced, minced, grated, shredded, whole, ground, crushed, handful, pinch, splash, knob, drizzle, a, an, the, of, some, extra

Examples:
```
"fresh basil"         → "basil"
"a handful of basil"  → "basil"
"dried basil"         → "basil"
"½ tsp turmeric"      → "turmeric"
"2 tbsp olive oil"    → "olive oil"
"500g chicken breast" → "chicken breast"
"baby spinach"        → "baby spinach"   (baby not in STRIP_WORDS)
```

This function is in `server/lib/uplift-persistence.ts` — server-only. It would need to be moved to `shared/` or duplicated in the client for use in the planner page.

---

**`resolveIngredientAlias(rawKey)` — `shared/ingredient-aliases.ts`**

Resolves variant ingredient names to their canonical form. Already shared between client and server.

```
"fresh basil"   → "basil"
"dried basil"   → "basil"
"baby spinach"  → "spinach"
"cherry tomatoes" → "tomatoes"
"garlic cloves" → "garlic"
"porridge oats" → "oats"
```

Covers ~80 variants including US→UK, spelling variants, form variants, and olive oil variants. Used after `normalizeIngredientKey`.

---

### Matching Strategy

Combining `normalizeIngredientKey` + `resolveIngredientAlias` handles the majority of real cases:

| Meal ingredient | After normalise+alias | Suggestion | Match? |
|---|---|---|---|
| `"fresh basil"` | `"basil"` | `"Basil"` → `"basil"` | ✓ |
| `"a handful of basil"` | Cannot alias — quantity noise remains | `"Basil"` | ✗ (normalize+alias not enough) |
| `"dried basil"` | `"basil"` | `"Basil"` | ✓ |
| `"baby spinach"` | `"spinach"` | `"Spinach"` | ✓ |
| `"2 tbsp olive oil"` | Cannot alias — "2 tbsp" remains | `"extra virgin olive oil"` | ✗ (normalize+alias not enough) |
| `"½ tsp turmeric"` | Cannot alias — fraction remains | `"turmeric"` | ✗ (normalize+alias not enough) |

For full coverage, `normaliseIngredientForDedupe` (which strips quantities) is required.

With `normaliseIngredientForDedupe` + alias resolution:

| Meal ingredient | After full normalisation | Suggestion | Match? |
|---|---|---|---|
| `"fresh basil"` | `"basil"` | `"Basil"` | ✓ |
| `"a handful of basil"` | `"basil"` | `"Basil"` | ✓ |
| `"2 tbsp olive oil"` | `"olive oil"` | `"extra virgin olive oil"` → `"olive oil"` | ✓ |
| `"½ tsp turmeric"` | `"turmeric"` | `"turmeric"` | ✓ |
| `"baby spinach"` | `"baby spinach"` | `"spinach"` | ✗ (baby not stripped) |

The last case ("baby spinach" not matching "spinach") is a gap in `normaliseIngredientForDedupe`'s STRIP_WORDS list. However, `resolveIngredientAlias("baby spinach")` → `"spinach"`, so a two-pass approach (normalise then alias-resolve) covers it.

**Recommended matching pipeline for weekly reuse:**

1. `normaliseIngredientForDedupe(ingredient)` — strips quantities, units, prep words
2. `resolveIngredientAlias(result)` — resolves variants to canonical form

Applied to both the meal ingredient and the suggestion name. Match on exact equality of the result.

---

### False Positive Risk

The existing `ingredientAlreadyPresent()` function uses substring containment:
```
existingKey.includes(candidateKey) || candidateKey.includes(existingKey)
```

This introduces known false positive risks:

| Meal has | Suggestion is | Substring match? | Correct? |
|---|---|---|---|
| `"chicken stock"` | `"chicken"` | `"chicken stock".includes("chicken")` = true | ✗ False positive |
| `"pumpkin seeds"` | `"pumpkin"` | true | ✗ False positive |
| `"mixed beans"` | `"beans"` | true | Depends on intent |
| `"red pepper flakes"` | `"red pepper"` | true | ✗ False positive |
| `"spring onions"` | `"onion"` | true | ✗ False positive |

For weekly reuse detection, these false positives would mislead users: "Basil — already used this week: Chicken Soup" when the soup actually contains "chicken stock" which happens to contain the string "chicken".

**Mitigation:** For weekly reuse matching, use **exact equality** on normalised+aliased keys rather than substring containment. This is more conservative but avoids the false positive problem.

| Strategy | False positives | False negatives | Recommended for |
|---|---|---|---|
| Substring containment | High (dangerous for labels) | Low | Deduplication only |
| Exact equality on normalised+aliased keys | Low | Low-medium | Weekly reuse labels |

---

### Canonical Matching

The `ingredient-aliases.ts` file covers ~80 known variants. A suggestion of `"Basil"` will normalise to `"basil"` and no alias exists, so it stays `"basil"`. A meal ingredient of `"fresh basil"` will normalise to `"fresh basil"`, then alias to `"basil"` — exact match.

This covers the majority of Enhancement suggestions, which are short, clean ingredient names ("spinach", "turmeric", "pumpkin seeds", "red lentils", "chia seeds"). These are not heavily qualified in recipes.

---

## 4. Reuse Ranking Feasibility

### Current Suggestion Flow

In `MealUpliftPanel`, suggestions arrive as pre-matched `UpliftMatchResult[]` from the server. The panel:
1. Flattens all matches into a single suggestion list
2. Takes `slice(0, 2)` — maximum 2 suggestions visible
3. Filters out already-accepted suggestions (from `meal_uplift_applications`)

There is **no priority tier concept** in the current data model. Suggestions are ordered by rule `priority` (integer, lower = more important) from the uplift engine.

### Where Reuse Ranking Can Be Applied

Reuse ranking does not need a server change. It can be applied as a client-side post-processing step at the point `MealUpliftPanel` sorts suggestions before rendering.

**Current:**
```
const visibleSuggestions = allSuggestions.slice(0, 2);
```

**With reuse ranking:**
```
const rankedSuggestions = allSuggestions.sort((a, b) => {
  const aIsReuse = weeklyReuseMap.has(normalize(a.ingredient));
  const bIsReuse = weeklyReuseMap.has(normalize(b.ingredient));
  if (aIsReuse && !bIsReuse) return -1;
  if (!aIsReuse && bIsReuse) return 1;
  return 0; // preserve rule priority order within each tier
});
const visibleSuggestions = rankedSuggestions.slice(0, 2);
```

This reorders suggestions without changing the engine, rules, or server. A P1 suggestion (already used this week) floats to the top. Standard suggestions remain in original priority order beneath it.

**Does it replace the current enhancement engine?** No. The engine still determines which suggestions are valid for the meal. Reuse ranking only changes the order in which the client presents them.

---

### Can Existing Suggestions Simply Be Reordered?

Yes. The suggestion list is already assembled and deduplicated before slicing. A sort step before the slice is the complete intervention required. No rule changes, no engine changes, no API changes.

**Constraint:** The slice cap of 2 visible suggestions means a P1 suggestion will only appear first if the meal has a matched uplift rule that includes an ingredient present elsewhere in the week. If no uplift rule fires for a meal, no suggestions appear regardless — reuse ranking cannot surface new suggestions, only reorder existing ones.

---

## 5. User Messaging

### What Information Is Available at Render Time

With the `weeklyReuseMap` (a `Map<normalizedKey, string[]>` from ingredient → meal names), the following metadata is available for each suggestion:

1. Whether the ingredient is used this week (boolean)
2. Which meals use it this week (string[])
3. How many meals use it this week (number)

### Option A — Meal Name List

> Already used this week:
> • Pizza Night

**Pros:** Specific, actionable, makes the connection concrete.
**Cons:** If the same ingredient appears in many meals, the list could be long. Needs truncation logic.
**Implementation:** `weeklyReuseMap.get(normalizedKey)` returns `string[]` — render first 2 names + "and N more".

---

### Option B — Count Only

> Used in 2 meals this week

**Pros:** Compact. No truncation needed.
**Cons:** Loses the specific connection that makes the suggestion feel relevant ("oh, that's in my Pizza").
**Implementation:** `weeklyReuseMap.get(normalizedKey)?.length`.

---

### Option C — Shopping Signal

> Already on this week's shopping list

**Pros:** Most directly relevant to reducing cost and waste.
**Cons:** Requires loading the shopping list in the planner page (not currently done). Shopping list items may not perfectly match enhancement suggestion names without normalisation.
**Implementation:** Needs additional React Query call + normalisation pass against `shoppingList[].normalizedName`.

---

### Option D — Tiered Label

> 🌿 Already in your week · Pizza Night

A single compact label combining the signal and the source meal.

**Pros:** Minimal space, clear meaning.
**Cons:** Emoji may not align with THA's display style.

---

### Recommended Format

**"Already used this week: Pizza Night"** (Option A with truncation to 2 meal names).

This is the most specific, trustworthy signal THA can show. It refers to real named meals in the user's planner, which creates a genuine sense of recognition and practicality.

Truncation rule: show up to 2 meal names. If 3 or more: "Pizza Night, Pasta Night and 1 more".

---

## 6. Smallest Implementation Path

### Step 1 — Build the weekly reuse map (client, no API)

In `weekly-planner-page.tsx`, alongside the existing `weekIngredients` useMemo, add a second memo:

```typescript
const weeklyReuseMap = useMemo<Map<string, string[]>>(() => {
  const map = new Map<string, string[]>();
  if (!activeWeekData) return map;
  for (const day of activeWeekData.days) {
    for (const entry of day.entries) {
      const meal = mealById.get(entry.mealId);
      if (!meal?.ingredients?.length) continue;
      for (const raw of meal.ingredients) {
        const key = resolveIngredientAlias(normaliseIngredientForDedupe(raw));
        if (!key) continue;
        const existing = map.get(key) ?? [];
        if (!existing.includes(meal.name)) {
          map.set(key, [...existing, meal.name]);
        }
      }
    }
  }
  return map;
}, [activeWeekData, mealById]);
```

This replaces nothing — purely additive.

---

### Step 2 — Pass the map to MealUpliftPanel

At the `MealUpliftPanel` call site (`weekly-planner-page.tsx:3441`), add the prop:

```tsx
<MealUpliftPanel
  mealId={meal.id}
  plannerEntryId={entry.id}
  mealSlot={mealType}
  upliftMatches={matches}
  weeklyReuseMap={weeklyReuseMap}  // new
  ...
/>
```

---

### Step 3 — Use the map in MealUpliftPanel

In `MealUpliftPanel.tsx`:

1. Accept `weeklyReuseMap?: Map<string, string[]>` as an optional prop
2. Before slicing to 2 visible suggestions, sort P1 suggestions to the top
3. For each suggestion in the rendered list, look up its ingredient in the map and display the "Already used this week" label if found

**Client-only. No server changes. No schema changes. No new API calls.**

---

### What `normaliseIngredientForDedupe` needs

This function currently lives in `server/lib/uplift-persistence.ts` — server-only. Two approaches:

**Option A:** Move/copy it to `shared/` so the client can import it directly. This is the correct architectural home for a shared normalisation utility.

**Option B:** Replicate the logic inline in the client where needed. Simpler but creates drift risk.

The function is ~20 lines, pure, no dependencies. Moving to `shared/normalise-ingredient.ts` or `shared/uplift-utils.ts` is a safe, low-risk change.

---

## 7. Implementation Options

### Option A — Display-Only Reuse Labels

Show "Already used this week: Pizza Night" beneath a suggestion. No ranking change.

**Complexity:** Low.

**Files affected:**
1. `client/src/pages/weekly-planner-page.tsx` — add `weeklyReuseMap` memo
2. `client/src/components/MealUpliftPanel.tsx` — accept prop, display label
3. `server/lib/uplift-persistence.ts` → `shared/uplift-normalise.ts` — move/expose `normaliseIngredientForDedupe`

**Risk:** Low. Additive only. Incorrect label is cosmetically misleading but not functionally harmful.

**Expected user value:** Users understand why a suggestion is appearing. "Basil — already in your Pizza Night" reinforces the suggestion as practical rather than arbitrary.

---

### Option B — Reuse-Aware Ranking

Suggestions with P1 matches (used this week) sort to the top of the visible suggestion list.

**Complexity:** Low.

**Files affected (in addition to Option A):**
- `client/src/components/MealUpliftPanel.tsx` — add sort step before `slice(0, 2)`

**Risk:** Low. The sort is pure — no server change. The only risk is that a nutritionally lower-priority rule floats up because its ingredient happens to be in another meal. This is the intended behaviour, but it means rule authors should not assume priority order is always respected in the UI.

**Expected user value:** When Basil was bought for Pizza Night, seeing it suggested first for Pasta Night makes the enhancement feel like a sensible shopping decision, not just a health recommendation.

---

### Option C — Reuse-Aware Ranking Plus Shopping Integration

Extends Option B with a third signal: whether the ingredient is already on the current shopping list.

**Complexity:** Medium.

**Files affected (in addition to Option B):**
- `client/src/pages/weekly-planner-page.tsx` — add `GET /api/shopping-list` query + build `shoppingListNormalisedKeys: Set<string>`
- `client/src/components/MealUpliftPanel.tsx` — accept `shoppingListNormalisedKeys`, apply P2 tier before P3

**Risk:** Low-medium. Shopping list may lag behind the planner (user planned but hasn't generated the list yet). A "P2 — on shopping list" label could be stale. Needs a staleness note or caveat in the UI.

**Expected user value:** If the user has already added Pumpkin Seeds to their shopping list, suggesting them as an enhancement feels completely friction-free — one tap to confirm, not a new purchase decision.

---

## 8. Data Impact Declaration

| Dimension | Option A | Option B | Option C |
|---|---|---|---|
| Reads existing data | Yes (planner + meals, already loaded) | Yes | Yes + shopping list |
| Writes new data | No | No | No |
| Changes meaning of existing data | No | No | No |
| Requires backfill | No | No | No |
| Schema changes | No | No | No |
| New API calls | None | None | One (shopping list) |

All options are purely additive, client-side, and require no migrations.

---

## 9. Trust Check

### Could the System Incorrectly Claim an Ingredient Is Already Being Used?

Yes — but the risk is manageable with the right matching strategy.

**Substring containment matching (used by `ingredientAlreadyPresent`) should NOT be used for labels.** Showing "Already in: Chicken Soup" when the soup has "chicken stock" but the suggestion is "chicken" is a visible, user-facing error.

**Exact equality on normalised+aliased keys is safer.** This will occasionally miss a match (false negative: "baby spinach" not matching "spinach" if alias not applied), but a false negative is invisible and harmless — the user simply does not see the "used this week" label, and the suggestion still appears in its normal position.

**Priority: false negatives are acceptable. False positives are not.** A false positive says something wrong about the user's data. A false negative just means a label is missing.

---

### Could Ingredient Normalisation Create False Matches?

Yes, in limited cases.

The most likely culprit is multi-word ingredient names where one word appears in an unrelated ingredient:

| Meal has | Suggestion | Exact match? | Correct? |
|---|---|---|---|
| `"black pepper"` | `"red pepper"` → normalised `"red pepper"` | `"black pepper" ≠ "red pepper"` | ✓ Not a match |
| `"sweet potato"` | `"potato"` → normalised `"potato"` | `"sweet potato" ≠ "potato"` | ✓ Not a match |
| `"spring onion"` | `"onion"` → normalised `"onion"` | `"spring onion" ≠ "onion"` | ✓ Not a match |
| `"spinach"` | `"spinach"` | ✓ | ✓ |
| `"baby spinach"` → aliased `"spinach"` | `"spinach"` | ✓ | ✓ |

Exact equality matching cleanly avoids most false matches. The cases that remain are genuine synonyms already handled by the alias map.

---

### Could Reuse Ranking Reduce Nutritional Diversity?

This is the most substantive trust concern.

If Basil is already in 3 meals this week, it will be boosted to P1 for every other meal it could reasonably be added to. The user ends up with Basil in every meal that supports it.

**Mitigation strategies:**

1. **Cap P1 suggestions per meal at 1.** Even if multiple suggestions are P1, only the highest-priority one floats up. The second visible slot is filled by a P2 suggestion.

2. **Demote high-frequency ingredients.** If an ingredient appears in 3+ meals already this week, treat it as P2 (still prefer it over a new purchase, but don't float it above genuinely novel suggestions).

3. **Do not let P1 suppress all P2+ suggestions from the visible list.** With a 2-suggestion cap, if both slots are taken by P1 suggestions, the user never sees anything new. A rule: maximum 1 P1 suggestion, minimum 1 non-P1 suggestion — ensures variety is always present.

---

### How Should THA Balance Reuse, Nutrition, and Variety?

The enhancement philosophy should be:

| Priority | Principle |
|---|---|
| 1 | **Safety** — household hard restrictions are always enforced (already done) |
| 2 | **Meal fit** — the suggestion must be appropriate for this meal type (already done via rules) |
| 3 | **Practicality** — if the ingredient is already in the week, lead with it |
| 4 | **Nutrition** — the nutritional reason for the suggestion is valid regardless of reuse status |
| 5 | **Variety** — protect against repetition; do not let reuse override variety completely |

The maximum 1 P1 per meal rule enforces the balance between practicality and variety. The 2-suggestion cap means there is always room for one new suggestion alongside one reuse suggestion.

---

## Summary

**The weekly reuse detection is feasible with no server changes, no schema changes, and no new API calls.**

The required data — `activeWeekData` and `mealById` — is already loaded in the planner page. A `weeklyReuseMap` useMemo built from this data provides the complete signal.

The primary technical work is:
1. Moving `normaliseIngredientForDedupe` from `server/lib/uplift-persistence.ts` to a shared location
2. Adding `weeklyReuseMap` computation (useMemo in `weekly-planner-page.tsx`)
3. Passing the map to `MealUpliftPanel` as a prop
4. Rendering "Already used this week: [Meal Name]" for matched suggestions

The most important design decision is the matching strategy: **exact equality on normalised+aliased keys**, not substring containment. This eliminates false positives at the cost of occasional false negatives, which is the correct trade-off for user-facing labels.

Reuse-aware ranking (floating P1 suggestions to the top of the visible list) is a one-line sort step. It does not change the engine, rules, or server. It does not replace existing nutritional prioritisation — it layers practical convenience on top of it.
