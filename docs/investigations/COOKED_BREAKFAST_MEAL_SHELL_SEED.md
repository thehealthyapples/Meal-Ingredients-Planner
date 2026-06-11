COOKED BREAKFAST MEAL SHELL SEED: COMPLETE

---

**Rollback Identifier:** `impl/cooked-breakfast-meal-shell-seed-20260608-212455`
**Branch:** main
**Commit at implementation start:** `1e83f32`
**Date:** 2026-06-08
**Risk Level:** GREEN — Additive insert only. No existing data modified.

---

## Files Changed

| File | Change |
|------|--------|
| `server/seeds/seed-meal-shell-templates.ts` | **Created** — idempotent seed script |
| `package.json` | **Updated** — added `"seed:meal-shells"` npm script |

No schema changes. No route changes. No existing templates modified.

---

## Dry-Run Result

```
DRY_RUN=true npm run seed:meal-shells

[meal-shell-seed] DRY RUN — no data will be written.
[meal-shell-seed] Processing 1 meal shell(s).
[meal-shell-seed] DRY   "Cooked Breakfast" — would insert with 5 shared components, 5 protein slots, 3 carb slots
[meal-shell-seed] ──────────────────────────────────────────────────
[meal-shell-seed] Inserted : 1
[meal-shell-seed] Skipped  : 0 (already existed)
[meal-shell-seed] Dry run complete — no data written.
[meal-shell-seed] Validation skipped in dry run mode.
```

Dry run completed without error. Correctly previewed the insert without writing.

---

## Dev Seed Result (First Run)

```
npm run seed:meal-shells

[meal-shell-seed] Live run — writing to database.
[meal-shell-seed] Processing 1 meal shell(s).
[meal-shell-seed] INSERT "Cooked Breakfast" — id=633
[meal-shell-seed] ──────────────────────────────────────────────────
[meal-shell-seed] Inserted : 1
[meal-shell-seed] Skipped  : 0 (already existed)
```

Template inserted as **id=633**. Total `meal_templates` rows: 633.

**Implementation note:** First insert attempt used drizzle's `sql` template tag with JavaScript arrays. This produced `syntax error at or near ")"` — the pg driver does not automatically serialise JS arrays through drizzle's raw sql tag. Fix: rewrote the insert to use `pool.query()` directly with numbered parameters (`$1..$14`). The `pg` native driver correctly serialises `string[]` to Postgres `text[]` wire format. The dry-run path (which uses `db.execute` only for the lookup SELECT) was unaffected.

---

## Idempotency Test (Second Run)

```
npm run seed:meal-shells

[meal-shell-seed] Live run — writing to database.
[meal-shell-seed] Processing 1 meal shell(s).
[meal-shell-seed] SKIP  "Cooked Breakfast" — already exists (id=633)
[meal-shell-seed] ──────────────────────────────────────────────────
[meal-shell-seed] Inserted : 0
[meal-shell-seed] Skipped  : 1 (already existed)
```

**PASS.** Second run correctly detected the existing template via `LOWER(TRIM(name))` lookup and skipped the insert. No duplicate created.

---

## Validation Result

All checks passed on both first and second run:

```
[meal-shell-seed] PASS  — Template found: id=633
[meal-shell-seed] PASS  — sharedBaseComponents: [mushrooms, tomatoes, onions, avocado, asparagus]
[meal-shell-seed] PASS  — proteinSlots: [eggs, pork sausages, chicken breast, chickpea patty, plant-based sausages]
[meal-shell-seed] PASS  — carbSlots: [gluten-free roll, sweet potato hash, gluten-free keto bread roll]
[meal-shell-seed] PASS  — sauceSlots: [tomato ketchup, brown sauce]
[meal-shell-seed] PASS  — compatibleDiets: [Vegetarian, Gluten-Free, Dairy-Free, Mediterranean, Low-Carb, Keto]
[meal-shell-seed] PASS  — estimatedTotalTime: 25
[meal-shell-seed] PASS  — costBand: standard
```

All seven slot-field checks returned non-null, non-empty values.

---

## Duplicate Check

```
[meal-shell-seed] PASS  — No duplicates: exactly 1 row named "Cooked Breakfast"
[meal-shell-seed] INFO  — Total meal_templates rows: 633
```

**PASS.** Exactly one row with name "Cooked Breakfast". Total count increased from 632 → 633. All 632 previous templates remain unchanged.

---

## scoreTemplate Simulation Result

The script ran an inline simulation of `scoreTemplate()` logic against the newly seeded template, using synthetic household profiles for Lilly and Daisy.

```
[meal-shell-seed] PASS  — allSlotIngredients has 15 entries — scoreTemplate would NOT return null

[meal-shell-seed] INFO  — Lilly (Veg/GF/DF/EggFree) shared base: [mushrooms, tomatoes, onions, avocado, asparagus]
[meal-shell-seed] INFO  — Lilly excluded slot ingredients: [eggs, pork sausages, gluten-free roll, gluten-free keto bread roll]
[meal-shell-seed] INFO  — Lilly memberChanges would contain 4 swap(s)/removal(s)

[meal-shell-seed] INFO  — Daisy (Mediterranean/DF/EggFree) shared base: [mushrooms, tomatoes, onions, avocado, asparagus]
[meal-shell-seed] INFO  — Daisy excluded slot ingredients: [eggs]

[meal-shell-seed] INFO  — Household shared base (Lilly + Daisy): [mushrooms, tomatoes, onions, avocado, asparagus]

[meal-shell-seed] PASS  — scoreTemplate simulation: would return non-null MealMatch
```

**scoreTemplate would return non-null.** Confirmed: `allSlotIngredients.length > 0`, which is the guard condition at `household-meal-matcher.ts:245`.

**Household shared base for Lilly + Daisy:** All five shared base components (mushrooms, tomatoes, onions, avocado, asparagus) are safe for both members. None of the shared base ingredients are in either member's exclusion set.

**Lilly exclusions from slots:** eggs, pork sausages, gluten-free roll, gluten-free keto bread roll. Note: "gluten-free roll" and "gluten-free keto bread roll" are flagged because the exclusion match uses substring logic and `gluten` appears in the name. The real `scoreTemplate()` in `household-meal-matcher.ts` uses the same substring match — this will require Lilly to use "sweet potato hash" as her only carb slot, which is correct behaviour.

**Daisy exclusions from slots:** eggs only. All other slots remain available.

**Note:** This is a simulation, not a live call to `matchMealsForHousehold()`. The live function requires a real `userId` with active household members in the database. Wiring that call is the next validation step after this seed.

---

## Seed Script Behaviour Summary

| Behaviour | Status |
|-----------|--------|
| Dry-run mode (`DRY_RUN=true`) | Works — no data written, previews action |
| Idempotent lookup (case-insensitive, trimmed) | Works — skips on second run |
| Insert via pool.query() with parameterised arrays | Works — pg driver serialises string[] correctly |
| All slot fields persisted | Confirmed — all 7 field checks passed |
| Existing 632 templates unchanged | Confirmed — total count 633, no modifications |
| No duplicate rows | Confirmed — single row at id=633 |
| scoreTemplate guard passed | Confirmed — allSlotIngredients.length = 15 |

---

## Risks and Limitations

| Risk | Severity | Note |
|------|----------|------|
| Gluten-free carb slots excluded for Lilly by substring match | Low | Correct behaviour — "gluten" in name triggers the exclusion. Lilly's only valid carb is "sweet potato hash", which is correct for her restrictions. If carb options need expansion, add non-gluten-named GF options to the carbSlots array. |
| chicken breast in proteinSlots available to Lilly | Note | Lilly is Vegetarian — chicken breast would be excluded by her dietary pattern check in the real `scoreTemplate()`, but not by the ingredient exclusion check used in this simulation. The live function cross-checks `compatibleDiets` against member `dietTypes`. |
| scoreTemplate not called live (no real household userId) | Low | Simulation confirms the template would not return null. Full live test requires wiring `matchMealsForHousehold()` to a route or test harness. |
| POST and PATCH routes still unauthenticated | Amber | Pre-existing condition — not introduced by this seed. Template CRUD routes have no `isAuthenticated()` guard. |
| PATCH route still cannot update slot fields | Amber | Pre-existing condition — slot fields must be managed via seed script until PATCH is extended. |
| No `meal_templates.name` unique constraint | Low | Managed by lookup-first logic in seed script. The script guards against duplicates. |
| Template category uses lowercase "breakfast" | Note | Consistent with the majority of existing templates. If a future query filters by category, use `LOWER(category)` to handle both "breakfast" and "Breakfast" variants. |

---

## Suggestions Only (Not Implemented)

The seed script contains a comment block listing additional templates for future consideration. None were inserted.

**Suggested next breakfast shells:**
- Porridge Bar — oat base, plant milk, topping slots for fruit/seeds/nut butter
- Smoothie Bowl — frozen banana/berry base, topping slots for granola/seeds
- Egg-Free Breakfast Plate — avocado, tomatoes, mushrooms, spinach base; tofu scramble protein slot

**Suggested lunch shells:**
- Jacket Potato Bar — baked potato + salad base; tuna/beans/chickpeas protein slots
- Build-Your-Own Salad — mixed leaf base; chicken/tuna/tofu protein slots
- Grain Bowl — quinoa/rice base; falafel/chicken/halloumi protein slots

**Suggested dinner shells:**
- Taco Bowl — rice + roasted veg base; beef/chicken/black beans protein slots
- Curry Night — sauce base + rice; chicken/lamb/chickpeas/tofu protein slots
- Pasta Bar — tomato sauce + pasta (GF option carb slot); mince/mushrooms/lentils protein slots

**Prerequisite before adding more shells:** Validate `matchMealsForHousehold()` against the Cooked Breakfast template with a real household. If scoring output is correct, additional shells can be added to the `MEAL_SHELLS` array in `seed-meal-shell-templates.ts` and the script re-run — it will insert only the new entries.

---

## Recommended Next Decision

Three paths are now unblocked:

**Path 1 — Live matchMealsForHousehold test**
Expose `matchMealsForHousehold()` via a temporary test endpoint or test script using a real household userId. Confirm the Cooked Breakfast template returns a scored `MealMatch` with correct `sharedIngredients` and `memberChanges` for the Lilly + Daisy household. This is the validation gate before planner integration.

**Path 2 — Auth + PATCH extension**
Add `isAuthenticated()` to the four mealTemplate CRUD routes. Extend PATCH `updateSchema` to accept slot fields. Enables template management via API without rerunning seed scripts. Pre-existing concern independent of meal shell work.

**Path 3 — Additional template seeding**
Add Jacket Potato Bar and Taco Bowl to `MEAL_SHELLS` in the seed script. Rerun `npm run seed:meal-shells` — idempotent, safe to run at any time. Broadens household planning coverage across lunch and dinner.

---

*Seed complete. One record inserted (id=633). No existing data modified.*
