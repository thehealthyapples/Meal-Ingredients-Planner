# INT25 — Capability Verb Convergence: Implementation Report

**Date:** 2026-07-01  
**Status:** Complete  
**Scope:** `meals` capability — `search` verb execution added. No schema, UI, voice, or intent engine changes.

---

## 1. Problem statement

After INT15 the Meals binding declared `executableIntents: ["read"]`.  When the
PatternIntentResolver (INT24) resolved `"find me a recipe for chicken curry"` it
produced `{ capabilityId: "meals", verb: "search" }`.  The platform then had no
handler path for `search`, so the response was `{ status: "gap" }` even though
grounded, ownership-safe data existed.

The INT15 open-decision note in `meals-read-handler.ts` identified `lookupMeals`
(the legacy route helper) as unsafe because it accepted arbitrary SQL-like text
with no per-user scoping.  That was the blocker.

---

## 2. Resolution

`lookupMeals` was **never needed**.  The handler already had access to:

| method | scope guarantee |
|---|---|
| `getMeals(userId)` | returns only meals owned by `userId` |
| `getSystemMeals()` | returns only `isSystemMeal = true` rows |

A client-side keyword filter across `name` and `ingredients[]` (case-insensitive
substring, capped at 20 results, deduped by `id`) is sufficient and **inherits**
the ownership guarantee from the two port methods — no new storage method, no
new migration, no schema change required.

---

## 3. Files changed

| File | Change |
|---|---|
| `server/intelligence/handlers/meals-read-handler.ts` | Added `MealSearchView` type (lightweight projection: id, name, servings, mealFormat, isSystemMeal, userId — no ingredients/instructions); `MealsSearchResult` type; `handleSearch()` function; handler factory guards `["read","search"]`; routes `search` verb to `handleSearch()`. |
| `server/intelligence/bindings/meals.ts` | `MEALS_EXECUTABLE_INTENTS` updated from `["read"]` to `["read","search"]`. |
| `server/intelligence/handlers/meals-read-port.ts` | Comment updated: records the INT25 resolution of the INT15 open decision — `lookupMeals` not exposed because `getMeals + getSystemMeals` is sufficient. |
| `server/intelligence/index.ts` | `MealSearchView` and `MealsSearchResult` added to the barrel exports. |
| `server/intelligence/intelligence-platform.ts` | INT25 paragraph added to the capability evolution comment block. |
| `server/tests/test-intelligence-meals-binding.ts` | Platform factory registers `["read","search"]`; `executableIntents` assertion updated (search IS included, explain/recommend are NOT); "Read-only enforcement" retitled to exclude search; **new "Search verb (INT25)"** section: 14 assertions covering name match, case-insensitivity, system-meal inclusion, ingredient match, ownership scoping (user2 cannot see user1's meals), no-match → empty ok, empty query → gap, missing query → gap, anonymous → denied, result shape carries no ingredients/instructions/nutrition. |

---

## 4. Search algorithm

```
handleSearch(parameters, ctx):
  userId = requireUserId(ctx)          # enforced → denied if absent
  query  = parameters.query?.trim()
  if !query → gap("query must be non-empty…")

  ownMeals    = await port.getMeals(userId)
  systemMeals = await port.getSystemMeals()

  combined = dedup([...ownMeals, ...systemMeals], by id)

  needle = query.toLowerCase()
  matches = combined.filter(m =>
    m.name.toLowerCase().includes(needle) ||
    m.ingredients.some(i => i.toLowerCase().includes(needle))
  ).slice(0, 20)

  return ok({ scope:"search", query, mealCount, meals: [MealSearchView…], source:"meals" })
```

Ownership invariant: `getMeals(userId)` is scoped by the storage layer; system
meals carry `isSystemMeal = true`.  User A's meals never appear in User B's
search results.

---

## 5. Test results

```
INT15/INT25 Meals binding: 72 passed, 0 failed
test-intent-resolver:       173 passed, 0 failed
test-intelligence-registry-executability: (see run — meals now ["read","search"])
```

---

## 6. Open decisions (none remaining for INT25)

The INT15 open decision is **closed**:
> "lookupMeals not exposed — getMeals(userId) + getSystemMeals() is sufficient
>  for a safe client-side filter; no new storage method needed."

---

## 7. Scope boundary confirmation

- No new database columns or migrations.
- No UI changes.
- No voice or intent engine changes (INT24 resolver already produces `search` correctly).
- No new HTTP routes.
- Nutrition data not surfaced (trust rule maintained — test asserts no `calories`/`nutrition` field on any search result row).
