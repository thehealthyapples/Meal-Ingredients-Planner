# SURF1B5 — Starter Meal Safety Convergence

**Status:** Implementation — complete.
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1B5-starter-meal-safety-convergence-20260714` → `933dfabe`
**Predecessor:** [`SURF1B4_CANONICAL_DIET_PATTERN_SAFETY_CONVERGENCE.md`](./SURF1B4_CANONICAL_DIET_PATTERN_SAFETY_CONVERGENCE.md) — *Remaining limitations*, items **1** (*"The onboarding starter-meal list can still show a vegan a non-vegan breakfast. This is a **live fail-open**, and it is the first thing to do next"*) and **2** (*"The `dietTypes` labels are correct today, but not correct **by construction**"*). This workstream is the regression budget SURF1B4 said that fix would need.
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 8) → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`.

---

## HEADLINE

**The first cookbook THA ever gives a household was chosen by a preference, and never by safety.**

SURF1B5 was scoped to close one fail-open: the vegan breakfast backfill. Measuring it
first found the backfill was the smallest of three holes in the same function, and the
other two were worse.

| | Asked by the starter-meal path? |
|---|---|
| `user_preferences.diet_types` — **soft. "Never a safety gate"** (SURF1B) | **Yes. It was the only question asked.** |
| `users.diet_pattern` — **hard**, per member | **No.** |
| `users.diet_restrictions` — **hard**, unioned household-wide. *Allergens.* | **No. Never read here at all.** |

Measured against the live database at `933dfabe`:

```
36 of 95 constrained households were served at least one meal the canonical gate refuses
986 prohibited starter-meal servings · 62 distinct prohibited meals
```

- A **vegan** household was served 38 prohibited meals — sardine frittata, cod skillet, cottage cheese wraps.
- A **Gluten-Free** household was served **42 gluten-bearing** starter meals. That is an allergen, not a preference, and this path had never once asked about it.
- **43 live users** hold a diet pattern and no label preference. For them the filter did not merely fail open — **it never ran**.

**Today: 17,118 starter meals across all 273 live households. Not one is prohibited.**

And the cost was nothing. The cookbook was never short of vegan food — only of vegan *labels*:

```
vegan breakfast:  99 in the cookbook · 2 LABELLED vegan · 38 actually vegan-SAFE
```

The old code found 2 and topped up the other 19 slots with meat. **The new code finds 38
and serves 21 safe ones.** The fail-open was not buying coverage. It was pure loss.

---

## ROOT CAUSE

**A label is a claim about a meal. A restriction is a fact about a household. The old code
asked the claim and never asked the household.**

```
getStarterMeals(userId)
   └─ read user_preferences.diet_types          ← SOFT preference. The only input.
   └─ filterByDiet(meals, prefs)                ← match against meals.diet_types (a LABEL)
   └─ pickMealsWithBackfill(filtered, ALL_MEALS, 21)
                                    ▲
                                    └── the entire unrestricted category
```

Three consequences fall out of that one design fault, and only the first was known:

1. **The backfill fail-open** (SURF1B4's limitation #1). 21 meals are wanted per category.
   When fewer than 21 carried the label, the remainder were drawn from *all* system meals.
2. **No label preference, no filter.** `filterByDiet` only ran inside `if (userDietTypes.length > 0)`.
   A household that declared `Vegan` on their profile but set no `diet_types` preference fell
   to the `else` branch: `shuffle(allMeals).slice(0, 21)`. **43 live users.**
3. **Allergens were never in scope.** `users.diet_restrictions` — the canonical hard owner that
   SURF1B built, SURF1B2 completed and SURF1B3 routed onboarding into — is not read by this file.

SURF1B4 could not see (2) and (3) because it was looking at the *pattern* path, and this defect
lives in the *label* path. It named the label path, measured the vegan breakfast slot, and
deferred. The deferral was right. The measurement was incomplete.

### A correction to SURF1B4's measurement

SURF1B4 recorded *"Lunch, dinner, and both vegetarian slots have enough labelled meals that the
backfill does not fire today. Vegan breakfast does."* That is **wrong**, and it is worth correcting
in the record because it under-states a live safety defect. It compared the label pools against
`< 6 required`; the constant is `MEALS_PER_CATEGORY = 21`. Against the true threshold:

| Slot | Labelled meals | vs. 21 wanted | Backfill fired? |
|---|---|---|---|
| Vegan · breakfast | 2 of 99 | 19 short | **Yes** |
| Vegan · lunch | 6 of 171 | 15 short | **Yes** |
| Vegan · dinner | 13 of 415 | 8 short | **Yes** |
| Vegetarian · breakfast | 18 of 99 | 3 short | **Yes** |
| Vegetarian · lunch | 18 of 171 | 3 short | **Yes** |
| Vegetarian · dinner | 29 of 415 | — | No |

**Five of the six slots backfilled, not one.**

---

## THE CORRECTED CANDIDATE AND BACKFILL PATHS

Both pools are now drawn through the one canonical gate — `isMealSafeForHousehold()` (SURF1B),
which resolves the household's restrictions through the canonical restriction library and the
requester's diet pattern through `dietRules` (which, since SURF1B4, *is* that same library).

```
getStarterMeals(userId)
   │
   ├─ resolveHouseholdSafetyContext(userId)      ← every member's HARD restrictions (unioned)
   │                                               + the requester's OWN pattern (never unioned)
   │
   └─ per category:
        safePool = pool.filter(isMealSafeForHousehold)      ← THE GATE. Candidate AND backfill.
        preferred = filterByDiet(safePool, labelPreference) ← the label ORDERS. It cannot admit.
        return pickMealsWithBackfill(preferred, safePool, 21)
                                                ▲
                                                └── the ONLY backfill source, and every
                                                    meal in it has passed the gate
```

Three properties, each pinned by a test:

- **A prohibited meal cannot enter a required slot.** The backfill source *is* the safe pool. There is no other pool in scope.
- **The label can no longer admit a meal.** A meal labelled `vegan` whose ingredients are bacon is refused, even though it matches the household's label preference exactly. The label keeps the one job it can do honestly: it puts label-matching safe meals at the head of the list, so **existing starter-meal ordering is preserved wherever safety allows**.
- **A safe meal with no label is now served.** This is where the 21 vegan breakfasts come from. The food qualifies the meal; the sticker does not.

**Unrestricted households are untouched.** `isSafetyGateActive()` is false when a household has no
hard restriction and no diet pattern, and the function then behaves exactly as it did before —
label-preferred first, backfilled from the whole category, bacon included. Verified: all 20 sampled
unrestricted households still receive the full 63.

---

## LABEL-PATH FINDINGS

**The labels in the live cookbook are correct today. Nothing made them so.**

`external-meal-service.detectDietTypes()` assigned `vegan` / `vegetarian` from three private
keyword lists — the last survivors of the rival animal-food vocabularies SURF1B4 retired from
`dietRules`. SURF1B4 let them live on the reasoning that *"a label is a claim, not a gate"*.

That was true only for as long as nothing treated a label as a gate. **Starter meals did.**

And the lists were as incomplete as the ones SURF1B4 deleted — they knew `chicken` but not
`prosciutto`, `pancetta`, `gammon`, `mutton`, `gelatine`, `bone broth` or `foie gras`, and nothing
at all about eggs or honey. **An imported prosciutto pizza would have been labelled both vegetarian
and vegan.**

So the labeller now asks the canonical library, through the same door the meal gate uses
(`dietRules.shouldExcludeRecipe`, fields not a blob — see SURF1B4 on why that distinction is
load-bearing). `MEAT_KEYWORDS`, `FISH_KEYWORDS` and `DAIRY_KEYWORDS` are **deleted, not deprecated**
(Principle 8), and a source scan fails the build if they return.

| Behaviour | Before | After |
|---|---|---|
| Imported prosciutto pizza | labelled `vegetarian` + `vegan` | **labelled neither** |
| Imported dish *claiming* "vegan carbonara", listing pancetta | labelled `vegan` | **claim vetoed — labelled neither** |
| Cheese omelette | `vegetarian` (correct) | `vegetarian` — eggs and dairy now cost it the vegan label it never should have had |
| Honey granola | `vegan` + `vegetarian` | `vegetarian` only |
| Vegan sausage rolls, oat milk porridge, quorn spaghetti, flax-egg pancakes | `vegan` + `vegetarian` | **unchanged** — the plant substitutes all survive |

**A claim is now vetoed, never trusted.** An import is exactly where a wrong claim enters THA, and
the source's word is not evidence about the food.

**Live audit:** across all **884** system meals, **zero** vegan-labelled or vegetarian-labelled meal
contradicts the canonical gate — SURF1B4's probe reproduced exactly. Re-labelling 400 live meals
through the *new* labeller also produces **zero** contradictions. So no repair script is needed, and
none was written: **there is no bad label in the cookbook to fix.** What changes is that a bad one
can no longer be created.

**The label is still not the safety gate, and SURF1B5 does not make it one.** Every meal THA serves
is put to `isMealSafeForHousehold()` on the way out. The labeller is now merely honest, so that a
label THA prints and a meal THA serves cannot disagree about what meat is.

---

## SAFE-SHORTFALL BEHAVIOUR

**When the safe pool is smaller than the slot count, the household receives fewer starter meals.**
It does not receive a prohibited one, and none is invented. An empty category is an honest statement
that THA's cookbook holds nothing safe for that household yet — and that is the cookbook's problem
to fix, not this function's.

On live data the shortfall is small, and it falls on **no vegan or vegetarian household at all**:

| Household | Starter meals offered (of 63) |
|---|---|
| Every Vegan household (3 + 2 lower-cased) | **63** — full |
| Every Vegetarian household (8 + 2 + 1) | **63** — full |
| Every unrestricted household (178) | **63** — full, unchanged |
| Keto ×2, Keto + Gluten-Free ×1 | 59 (17 breakfasts) |
| Flexitarian + Gluten-Free/Dairy-Free/Eggs ×2 | 58 (16 breakfasts) |

Only **5 households of 273** receive fewer than the full 63, and none receives fewer than 58. The
shortfall is entirely in the breakfast slot, where a Keto or egg-free household simply has fewer
options — which is true, and which the household should be told rather than fed around.

`preloadStarterMeals()` copies only what the gate passed, and — new in SURF1B5 — **does not mark a
household as loaded when it copied nothing.** `starter_meals_loaded` is a one-way flag: setting it
after an empty or failed selection would permanently deny that household the starter cookbook they
were entitled to.

---

## LIVE-DATA VERIFICATION

Real households, the real cookbook, the real gate — `getStarterMeals()` itself, not a re-implementation.

```
273 live users × getStarterMeals() = 17,118 starter meals returned

  ✓ NOT ONE prohibited starter meal reaches ANY live household        (986 did at 933dfabe)
  ✓ 17,118 meals still served — the gate did not pass by emptying the cookbook
  ✓ 394 of 685 system starter meals are refused for a live vegan household —
    every one of them was reachable through the old backfill
  ✓ 536 distinct system meals are now refused for at least one of the 16 live
    Vegan/Vegetarian households
  ✓ 0 label contradictions across 884 system meals, before and after re-labelling
```

Refused today, servable yesterday, to a live vegan household: *British Sardine, Onion & Fennel
Frittata*; *French country-Style Cod, Red Pepper & Pumpkin Egg Skillet*; *Malaysian-Style Cottage
Cheese, Asparagus & Spinach Breakfast Hash*; *Salmon, Broccoli & Brown Rice Traybake*; *Gentle Taco
Rice Bowls*; *Basil Tomato Wholewheat Pasta* — and 530 more.

**The vegan breakfast slot SURF1B4 named:**

```
99 breakfasts in the cookbook · 2 LABELLED vegan · 38 actually vegan-SAFE
  → the labelled pool is STILL too small to fill 21 slots — the backfill still fires
  → but it now draws from the 38, and the household receives a full 21 safe breakfasts
```

**A gate that passes by refusing everything is not a gate.** The suite fails if the cookbook empties.

### Tests — **82 new assertions, 0 failed** (`npm run test:surf1b5-starter-meal-safety`)

| § | Section | What it proves |
|---|---|---|
| 1 | **Backfill** | The top-up can only draw from the safe pool. Includes a **negative control**: the same function handed the *old* backfill source does serve prohibited meals |
| 2 | **Fewer, never unsafe** | A 3-meal safe pool yields 3 meals, not 21. Nothing is padded, duplicated or fabricated. A pool with nothing safe returns nothing |
| 3 | **Unrestricted** | No pattern, no restriction → full backfill, bacon included. SURF1B5 costs them nothing. A restriction *alone* now activates the gate — it never did before |
| 4 | **Label is ordering, not admission** | A bacon meal *labelled* vegan is refused; a safe *unlabelled* meal is served; label-matching meals still fill the first slots |
| 5 | **Fail-closed** | An unresolved safety context serves nothing and preloads nothing |
| 6 | **Label path** | prosciutto · pancetta · gammon · mutton · gelatine · bone broth · foie gras · eggs · dairy · honey — none can be labelled against the canonical answer. A source's own claim is vetoed |
| 7 | **Positive controls** | vegan sausages · oat milk · quorn · meat-free mince · peanut butter · butternut squash · vegan cheese · flax egg — all still labelled *and* served |
| 8 | **One owner** | Source scan: the three keyword lists are gone and cannot return; `meal-service.ts` defines no food term of its own |
| 9 | **Patterns stay per member** | A vegan and an omnivore share a kitchen; only restrictions union |
| 10 | **Live data** | Above |

### Regression — **16 suites, 979 assertions, 0 failed**

| Suite | Result | | Suite | Result |
|---|---|---|---|---|
| `surf1b-dietary-restriction-safety-path` | 54 | | `smart-suggest-tailoring` | 14 |
| `surf1b2-dietary-restriction-knowledge` | 173 | | `ingredient-verification` | 22 |
| `surf1b3-onboarding-allergy-routing` | 64 | | `profile-dietary-title-safety` | 39 |
| `surf1b4-canonical-diet-pattern-safety` | 315 | | `cbk1-cookbook-seed` | 37 |
| `keto-low-carb-dictionary` | 82 | | `intelligence-platform` | 33 |
| `plant-milk-vegan` | 27 | | `dietary-trust-fix` | 26 |
| `smart-suggest-diet-pattern` | 26 | | `shell-meal-metadata-write-path` | 11 |
| `planner-compliance-gate` | 25 | | `household-vegan-vegetarian-hard-enforcement` | 31 |

`diet-reconciliation-bridge` also passes. Typecheck: **0 errors in any SURF1B5 file.**

**Other diet patterns are unchanged in their knowledge** — Keto, Low-Carb, Paleo, Carnivore,
Mediterranean, DASH, MIND and Flexitarian keep every rule they had (82 assertions in the Keto/Low-Carb
dictionary alone). What changed for them is only that starter meals now *ask* the gate they were
already subject to everywhere else in THA. A Keto household is no longer handed 55 starter meals
their own declared pattern refuses.

---

## REMAINING LIMITATIONS

Stated plainly, because a safety document that overclaims is worse than one that does not exist.

1. **The starter cookbook is thin for vegans, and SURF1B5 does not fix that — it reveals it.**
   38 vegan-safe breakfasts of 99, and **2** of them labelled. The household now gets 21 safe
   breakfasts, but THA is choosing them from a narrow pool and the *labels* remain nearly useless
   for ordering. The cookbook needs more vegan breakfasts and the existing safe ones need their
   labels. That is a **content** workstream, not a safety one, and inventing meals to fill the gap
   is exactly what this workstream forbids.

2. **The labeller still labels on absence of evidence.** A title-only import with a neutral name
   ("Grandma's Special", no ingredients) passes the canonical gate — nothing in it is meat — and is
   therefore labelled vegan and vegetarian. That is the pre-SURF1B5 behaviour, deliberately preserved:
   changing it would strip the labels from every title-only meal in the cookbook. It is safe *because*
   nothing trusts the label any more — the gate re-reads the food when the meal is served. But the
   label is weak evidence and should not be treated as strong.

3. **A source's claim can still under-claim.** "Meat-free chilli" is labelled `vegetarian` and not
   promoted to `vegan`, because the source said vegetarian and SURF1B5 does not overrule a claim in
   the permissive direction. This costs a vegan household **ordering** — the meal arrives in the safe
   backfill rather than at the head of the list. It cannot cost them the meal.

4. **One live user (601) now receives zero starter meals.** They have **no active household membership**,
   so their safety context is `unavailable` and the gate refuses everything — correctly and by design
   (SURF1B: *"we could not find out" is not "no restrictions"*). They are a `@test.invalid` fixture
   account from the TRUST1-S2 suite, not a household, and the orphan row is itself a pre-existing data
   defect (`getHouseholdForUser` calls it *"should not happen"*). **No real household is affected**, but
   the row should be cleaned up and the invariant enforced. Not in this mandate.

5. **`meal-service.ts` remains an unauthorised writer of `meals`** (`npm run verify:publication`,
   CPI1 S2-1): `preloadStarterMeals` copies cookbook recipes into user rows with no
   `acquisition_source_key`. Pre-existing, declared in the publication register before SURF1B5, and
   **untouched** — this workstream adds no write path (the diff contains no insert, update or delete).
   The publication gate fails identically before and after.

6. **Two meat keyword lists still survive**, in `meal-scoring-service.ts` (a *score*, behind the gate)
   and `PlantDiversityReport.tsx` (a *report*, outside it). SURF1B4's table showed why neither can
   refuse a meal. SURF1B5 retires the third — the labeller — because something began treating its
   output as a gate. The remaining two are duplicate *vocabulary*, not duplicate *authority*.

---

## GOVERNANCE

- **Architecture Bootstrap** — `docs/architecture/README.md` and the governing documents it names were read before implementation, along with the SURF1B–SURF1B4 reports.
- **Principle 2 (one owner per fact)** — starter meals had been consulting a *preference* about a *safety* question. They now ask the owner: the household's restrictions and the requester's pattern, through the one gate. The labeller asks the same owner as the gate, so the two cannot disagree.
- **Principle 8 (retire on introduction)** — `MEAT_KEYWORDS`, `FISH_KEYWORDS` and `DAIRY_KEYWORDS` are **deleted** from the labeller, not deprecated, and a source scan fails if they return.
- **No new restriction knowledge, and no new keyword list.** Not one food term was authored. `meal-service.ts` contains no food vocabulary at all — asserted by source scan. Every question about food is put to the canonical library.
- **No weakening of canonical meal gating.** SURF1B5 only *adds* a gate where there was none. Every change moves in the restrictive direction, except one: safe-but-unlabelled meals are now served to households that previously never saw them — which is a **correction of a false exclusion**, not a relaxation, and it is covered by positive controls.
- **No fabricated starter meals** — a shortfall is returned as a shortfall.
- **Fail-closed preserved** — an `unavailable` context refuses every meal and preloads nothing (§5).
- **Patterns remain per member** — no household-wide union of diet patterns (§9).
- **No onboarding or starter-meal UI change** — `GET /api/starter-meals` and `POST /api/user/complete-onboarding` keep their contracts exactly; the client is untouched. A household with a short safe pool receives a shorter list through the same interface.
- **Product Registry Compliance** — no page, route, journey or capability is created, removed or renamed. `docs/product/` does not exist (`PKR1`/`PKR3` define the registry and deliberately do not populate it), so there is no entry to update.
- **Experience & UI Governance** — no user-facing surface changes. The starter-meal list renders as it always has.

**The working tree was dirty on arrival** with uncommitted work from other sessions
(`plant-classifier.ts`, `publication-register.ts`, `notice-gateway.ts`, `household-nutrition-assembler.ts`,
the HHP3 / PLAN2 / CBK2 / PANTRY1 / SHOP1 / PUB1 / CPV1 / PX1 documents, and others).
**SURF1B5 did not touch, commit or revert any of it.** The milestone commit contains only the files below.

### Files changed

| File | Change |
|---|---|
| `server/lib/meal-service.ts` | Every starter meal — candidate **and** backfill — passes the canonical gate; the label demoted to ordering; shortfall returned honestly; `preloadStarterMeals` no longer marks an empty load as loaded |
| `server/lib/external-meal-service.ts` | `MEAT_KEYWORDS` / `FISH_KEYWORDS` / `DAIRY_KEYWORDS` **deleted**; `detectDietTypes` delegates Vegan/Vegetarian to the canonical library and **vetoes** a source's contradicted claim |
| `server/tests/test-surf1b5-starter-meal-safety.ts` | **New** — 82 assertions across 10 sections, including live data and a negative control |
| `package.json` | `test:surf1b5-starter-meal-safety` registered and wired into `npm test` |

---

## ROLLBACK

```
git reset --hard rollback/SURF1B5-starter-meal-safety-convergence-20260714   # → 933dfabe
```

The tag anchors committed state only. **No seed, no migration, and no database row was written** —
SURF1B5 changes only the code that *chooses* meals, never the meals. Rollback is complete and requires
no data migration.

Rolling back re-opens the fail-open: 36 of 95 constrained households resume being served meals their
own declared diet refuses, a Gluten-Free household resumes receiving 42 gluten-bearing starter meals,
and the 43 households who declared a diet pattern without a label preference resume receiving no
filtering whatsoever.

---

*Implementation. 2026-07-14. Asks the household, not the sticker.*
