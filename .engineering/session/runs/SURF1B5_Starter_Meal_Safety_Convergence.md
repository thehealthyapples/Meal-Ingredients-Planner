# SURF1B5 — Starter Meal Safety Convergence

**Status:** Complete
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1B5-starter-meal-safety-convergence-20260714` → `933dfabe`
**Predecessor:** SURF1B4 (`docs/implementation/platform/SURF1B4_CANONICAL_DIET_PATTERN_SAFETY_CONVERGENCE.md`) — limitations **1** and **2**.
**Implementation document:** `docs/implementation/platform/SURF1B5_STARTER_MEAL_SAFETY_CONVERGENCE.md`

## Mission
Close the starter-meal fail-open: `getStarterMeals()` filtered on the `meals.dietTypes` label and
backfilled from all system meals when too few carried it. Apply the canonical gate to every starter
meal, candidate and backfill. Audit the `dietTypes` labelling path.

## Root cause (verified)
Starter meals asked a **preference** and never asked the **household**. `getStarterMeals()` read only
`user_preferences.diet_types` (soft — "never a safety gate", SURF1B) and matched it against the
`meals.diet_types` label. Neither hard owner was read on this path:

| Owner | Kind | Read by starter meals? |
|---|---|---|
| `user_preferences.diet_types` | SOFT preference | **Yes — the only input** |
| `users.diet_pattern` | HARD, per member | No |
| `users.diet_restrictions` | HARD, unioned — **allergens** | **No — never read here** |

Three holes, only the first known: (1) backfill topped up from the unrestricted pool; (2) the filter
never ran at all for the 43 users with a pattern but no label preference; (3) allergens were entirely
absent — a Gluten-Free household was served 42 gluten-bearing meals.

**Baseline at 933dfabe: 36 of 95 constrained households served ≥1 prohibited meal; 986 prohibited servings.**
SURF1B4's note that only vegan breakfast backfilled was wrong — it compared against 6, not the real
`MEALS_PER_CATEGORY = 21`. Five of six vegan/vegetarian slots backfilled.

## Delivered
- `server/lib/meal-service.ts` — every candidate **and** backfill meal passes `isMealSafeForHousehold()`;
  the label demoted to ordering; shortfall returned honestly; `preloadStarterMeals` no longer marks an
  empty load as loaded.
- `server/lib/external-meal-service.ts` — `MEAT_KEYWORDS`/`FISH_KEYWORDS`/`DAIRY_KEYWORDS` **deleted**;
  `detectDietTypes` delegates Vegan/Vegetarian to the canonical library and **vetoes** a contradicted claim.
- `server/tests/test-surf1b5-starter-meal-safety.ts` — **new, 82 passed, 0 failed.** Registered in `npm test`.

## Verification
- **17,118 live starter meals across all 273 households — 0 prohibited** (986 at baseline).
- Vegan breakfast: 2 labelled, **38 actually safe** → household gets a full 21, all safe. The cookbook
  was short of vegan *labels*, never of vegan *food*.
- Shortfall falls on **no vegan/vegetarian household**: only 5 of 273 get fewer than 63 (min 58; Keto and
  egg-free breakfast slots).
- Unrestricted households unchanged (20/20 sampled receive the full 63).
- Labels: 0 contradictions across 884 system meals, before and after re-labelling. No repair needed.
- Regression: 16 suites, 979 assertions, 0 failed. Typecheck: 0 errors in any SURF1B5 file.

## Next action
None — complete. Recommends SURF1B5 limitation **1** next: the starter cookbook is genuinely thin for
vegans (38 safe breakfasts of 99, 2 labelled). That is a **content** workstream — more vegan breakfasts,
and labels on the safe ones that already exist — not a safety one.

## Notes
- Working tree was dirty on arrival with unrelated work from other sessions. SURF1B5 did not touch,
  commit or revert any of it. The milestone commit contains only the 4 files listed above.
- Pre-existing and untouched: `npm run verify:publication` fails identically before and after
  (`meal-service.ts` is a declared unauthorised writer of `meals` via `preloadStarterMeals`; SURF1B5
  adds no write path).
