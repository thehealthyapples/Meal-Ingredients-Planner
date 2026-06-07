# Enforce Profile Dietary Requirements — Smart Planner Hard Filter

**Date:** 2026-06-06
**Risk:** 🟡 AMBER — planner candidate filtering
**Scope lock:** Smart Planner `dietRules.shouldExcludeRecipe` integration only.

---

## Summary

The Smart Planner did not enforce a user's Profile `dietPattern` /
`dietRestrictions` as a hard exclusion. A Vegan profile could be served an
anchovy recipe (Pasta Puttanesca / "Tart's Spaghetti", meal 1484) because the
planner's only hard gate checked the household `hardExcludedIngredients` list,
which was empty.

The correct, already-trusted enforcement — `dietRules.shouldExcludeRecipe(...)` —
existed and was wired into recipe search, but the planner never called it.

**Fix:** thread the Profile `dietPattern` + `dietRestrictions` into the planner
and add **one** hard-filter gate in the candidate-building loops that delegates
to the existing `dietRules.shouldExcludeRecipe`. No second engine, no duplicated
keyword lists, no new vegan logic. Single source of truth.

---

## Rollback points

```
ROLLBACK BEFORE: tag rollback-before-planner-diet-filter-2026-06-06 @ 6503356
ROLLBACK AFTER:  tag rollback-after-planner-diet-filter-2026-06-06 @ 1e67eff
```

Working tree before the change had only untracked files (investigation docs +
temporary scripts); no tracked files were modified.

---

## Files changed

| File | Change |
|---|---|
| `server/lib/smart-suggest-service.ts` | Import `shouldExcludeRecipe`; add `dietPattern`/`dietRestrictions` to `SmartSuggestSettings`; add exported `candidateDietExcluded()` helper (delegates to `dietRules`); apply the gate in both the user-meal and external-candidate loops, before scoring/ranking/selection. |
| `server/routes.ts` | Thread `req.user.dietPattern` + `req.user.dietRestrictions` into `SmartSuggestSettings` at `/api/meal-plans/smart-suggest`. |
| `server/tests/test-smart-suggest-diet-pattern.ts` | New test (26 assertions) covering all 8 mandatory tests. |
| `package.json` | Add `test:smart-suggest-diet-pattern` script. |

---

## How the single source of truth is preserved

`candidateDietExcluded()` builds the same lowercased text blob recipe search
uses (`name + category + cuisine + ingredients`) and calls the identical
`dietRules.shouldExcludeRecipe(text, { dietPattern, dietRestrictions })`. The
test asserts the planner predicate and the recipe-search function return the
same result for the same recipe. There is exactly one Vegan implementation.

The gate is inert when no pattern and no restrictions are set, so non-restricted
users see no candidate-pool change.

---

## Mandatory checks

| Check | Result |
|---|---|
| `git status` | Clean before (untracked only); 4 files changed by this work |
| `npx tsc --noEmit` | ✅ Pass (exit 0) |
| `npm run build` | ✅ Pass (client + server built) |

---

## Manual / automated test results

`npx tsx server/tests/test-smart-suggest-diet-pattern.ts` → **26 passed, 0 failed**

| Test | Result |
|---|---|
| 1 — Vegan excludes Pasta Puttanesca (anchovies) | ✅ |
| 2 — Vegan excludes anchovy recipes | ✅ |
| 3 — Vegan excludes chicken | ✅ |
| 4 — Vegan excludes beef | ✅ |
| 5 — Vegan excludes eggs | ✅ |
| (DoD) Vegan excludes tuna/salmon/prawn/pork/dairy; allows true vegan | ✅ |
| 6 — Vegetarian excludes fish & seafood | ✅ |
| 7 — Vegetarian excludes chicken/beef/pork; allows dairy + eggs | ✅ |
| 8 — Profile = None → nothing excluded (no behaviour change) | ✅ |
| Consistency — planner predicate == recipe-search dietRules | ✅ |

Regression: `test-smart-suggest-restrictions` → **30 passed, 0 failed**
(household hard-restriction filtering unaffected).

---

## Data impact declaration

- Reads existing data: **Yes** (profile dietPattern/dietRestrictions)
- Writes new data: **No**
- Changes meaning of existing data: **No**
- Requires backfill: **No**
- Schema changes: **None**
- Migration: **None**

---

## What was NOT changed (scope lock honoured)

- No scoring changes
- No ranking changes
- No keyword-list edits
- No anchovy-only patch
- No suitability/verified-classification work
- No schema changes / migrations
- No second dietary engine

---

## Trust check

- Could this mislead the user? No.
- Could this fabricate certainty? No.
- Anything guessed but shown as real? No.
- If the system is wrong: candidate pool may shrink for strict diets, but the
  planner's existing safe-fallback/skip logic keeps generation functional.
