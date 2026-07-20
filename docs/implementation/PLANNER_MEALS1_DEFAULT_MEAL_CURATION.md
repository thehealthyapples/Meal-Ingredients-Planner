# PLANNER_MEALS1 — Default Meal Curation — Implementation

**Date:** 2026-07-20
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN
**Reason:** Content curation only — the change re-points an existing template at existing meal rows. No schema change, no new meal rows, no new store, no route or server-logic change.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/PLANNER_MEALS1-default-meal-curation-20260720` → `13fbe61a599abaa218d48fb249e6eec7bcaacc72` |
| Working tree | **Intentionally dirty at tag time** — one tracked file modified: `.engineering/session/CURRENT.md`, the automated Stop-hook heartbeat line. **The tag does not cover it.** No other uncommitted work existed. |
| This task's writes | `seed/family-plan.json` (rewritten), `package.json` (one line added), this document, session run file, `CURRENT.md` |
| Rollback to committed state | `git checkout rollback/PLANNER_MEALS1-default-meal-curation-20260720` |
| Rollback the **data** | `git checkout <tag> -- seed/family-plan.json && npm run seed:family-plan` |

> The tag protects committed state only. The seeded `meal_plan_template_items`
> rows are **database** state and are not restored by `git checkout` — they are
> restored by re-running the seeder against the reverted JSON, as above.

---

## FILING NOTE — a convention this document knowingly does not fix

Filed at the requested path, `docs/implementation/PLANNER_MEALS1_DEFAULT_MEAL_CURATION.md`.

`REPOSITORY_CONVENTIONS.md` (DOCSTRUCT1) says implementation reports are filed by
workstream, and `.engineering/scripts/repo-structure-verify.sh` check 3 asserts
*"docs/implementation/ has no loose files"*. **That check already fails at the
rollback point**: 28 reports sit at this root, including the four most recent
sessions (`COOKBOOK1`, `PRESENCE2`, `EXPGOV2`, `PROD4`). Verified by running the
script against the stashed tree — the same two FAILs appear with and without this
change.

So the choice was between the requested path and `docs/implementation/planner/`,
with **the gate red either way**. The requested path wins: it matches 28 siblings
and the instruction was explicit. Moving this one file would not have turned the
verifier green — it would only have made this report inconsistent with its
neighbours while leaving the actual violation untouched.

**The real fix is a filing sweep of all 28** (plus the investigations root),
which is its own change and is named in *Remaining owner decisions* (8).

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` (Experience Constitution — mandatory first read)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md`
- [x] `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md`
- [x] `docs/architecture/THA_BRAND_CONSTITUTION.md`
- [x] `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md`
- [x] `shared/cookbook/curation.ts` (COOKBOOK1 — the generated/authored boundary)

---

## 1. WHAT WAS ACTUALLY WRONG

The default Planner experience is the template
`The Healthy Apples Family 6 week meal plan` (`is_default = true`, the only such
row), seeded from `seed/family-plan.json` by `script/seed-family-plan.ts`, and
reached by a household at **Profile → "Load The Healthy Apples Family 6-Week Meal
Plan"** (`client/src/pages/profile-page.tsx:403`, `MealPlanSection` at `:1890`).

> **A correction worth recording.** An initial exploration reported this plan as
> dead code, on the grounds that `loadTemplateMutation`
> (`weekly-planner-page.tsx:463`) is defined and never called. That is true of the
> *planner page* and false of the feature: `profile-page.tsx:1897` fetches
> `/api/plan-templates/default` and applies it behind a live button. Had the
> "dead code" claim been accepted, this work would have been abandoned as
> pointless. It was checked before acting.

Measured against the database, the plan was:

| Defect | Evidence (before) |
|---|---|
| **A 6-week plan that is a 3-week plan played twice** | 42 slots, **26 distinct meals**. Weeks 4–6 re-served weeks 1–3. |
| **Dhal monoculture** | **8 distinct lentil/dhal dishes filling 11 of 42 slots.** Weeks 2, 3 and 4 each *opened* on a dhal. |
| **The same dish under two identities** | `Moules marinière` (468) and `Mussels Mariniere` (532) — one dish, two rows, both in the plan. |
| **Near-duplicate dishes** | `Seafood paella` (1568), `Easy paella` (1570), `Seafood rice` (1569) — sequential IDs, three slots each week-block. |
| **A user's edit artefact shipped as a default** | W6D4 resolved to meal **1556, `Lentil & sweet potato curry (Edited)`**. |
| **17 slots not pinned to a meal** | Only 25 of 42 entries carried a `mealId`; the rest resolved by `sourceUrl`/title with `ORDER BY id DESC` — *"newest wins"*. **That fuzzy fallback is what selected the `(Edited)` row.** |
| **Bulk-generated cohort dominant** | The sequential import block **1555–1570** supplied **12 of the 26 distinct meals (46%)**. |

The last two rows are one finding: **the defect was not only the meal choices, it
was that the plan did not state which meals it meant.** A plan that identifies its
dinners by title against a table containing `Lasagne`, `Lasagne (Edited)` and
`Lasagne Verdi al Forno` is not curated content — it is a query whose answer
changes as the meals table changes.

---

## 2. WHAT CHANGED

`seed/family-plan.json` rewritten: **42 slots, 42 distinct meals, every slot
pinned to an explicit `mealId`** (with `sourceUrl` and `title` retained as
provenance, no longer as resolution strategy).

| Measure | Before | After |
|---|---|---|
| Distinct meals across 42 slots | 26 | **42** |
| Repeated slots | 16 | **0** |
| Distinct lentil/dhal dishes (slots) | 8 (11) | **2 (2)** |
| Paella / seafood-rice dishes | 3 | **1** |
| `(Edited)` artefacts | 1 | **0** |
| Slots resolved by fuzzy title/URL match | 17 | **0** |
| Meals from the 1555–1570 generated block | 12 of 26 | **1 of 42** |
| Seeder result | 25/42 pinned | **42/42 resolved, 0 skipped** |

### The curated weeks

```
W1  dhal · teriyaki salmon · Chinese tomato egg · nutty chicken curry
    · pizza margherita · spaghetti bolognese · healthy roast dinner
W2  Italian vegetable soup · prawn stir-fry · kidney bean curry · salmon fish cakes
    · cheese-stuffed burgers · seafood paella · coq au vin
W3  vegan burrito bowl · Thai curry noodle soup · miso aubergine · beef stroganoff
    · carbonara · squid, chickpea & chorizo salad · easy fish pie
W4  aloo gobi · salmon burgers · tofu, greens & cashew stir-fry · chicken tikka masala
    · tortellini ricotta & spinach · moules marinière · slow-cooked beef lasagne
W5  vegan chilli · smoked mackerel & leek hash · sweet & sour tofu
    · chickpea curry jacket potatoes · Taiwanese chicken chow mein
    · prawn & harissa spaghetti · Thai green chicken curry
W6  one-pot vegan rice & beans · salmon noodle wraps · vegetarian lentil stew
    · Yemeni lahsa · pizza on the grill · quick fish stew · chilli con carne
```

**Rhythm.** Days 1–5 carry the quick, one-pan and store-cupboard dinners; days 6–7
carry the generous ones (paella, coq au vin, fish pie, beef lasagne, roast dinner).
Friday (D5) is deliberately the pleasurable slot — pizza, burgers, carbonara,
tortellini, chow mein — because that is what households actually do, and GEA1 says
hospitality wins over tidiness.

**Ingredient reuse — measured, not asserted.** Counting ingredient tokens
appearing in **3 or more of a week's 7 dinners** (stop-words and quantities
stripped): **W1 12 · W2 13 · W3 7 · W4 6 · W5 14 · W6 12 — average 10.7 anchors per
week.** Recurring anchors are onions, garlic, tomatoes, stock, rice, chilli and
olive oil. *(Measurement caveat: the tokeniser strips trailing unit letters, so
`garlic`/`large` appear in raw output as `arlic`/`arge`. The counts are correct;
the labels are cosmetically mangled.)*

**Diet spread — measured with the platform's own classifier.** Running
`classifyDietLabels()` (`shared/dietRules.ts:598`) over all 42:
**13 vegetarian, of which 11 vegan, and `evidence: "insufficient"` on zero of
them.** Every meal in the plan carries enough ingredient evidence for the
platform to classify it — which is the input household dietary adaptation runs on.

**Retained where already good.** `Spinach, sweet potato & lentil dhal`,
`Teriyaki salmon`, `The best spaghetti bolognese recipe`, `Pizza Margherita`,
`Seafood paella`, `Molten cheese-stuffed burgers`, `Thai curry noodle soup`,
`Moules marinière`, `My Big Fat Greek Salad`'s slot-mates and others were kept.
The brief said retain what meets the standard; 9 of the 26 previous meals do.

### Supporting change

`package.json` — added `"seed:family-plan": "tsx script/seed-family-plan.ts"`.
The seeder's own docstring (lines 13 and 17) instructs the reader to run
`npm run seed:family-plan`, and **that script did not exist**. Without it the
curation is inert: the JSON is the source, the database is what the household
reads. One line, and it makes the documented instruction true.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Entities touched: Meal (meals.id) and Meal Plan Template Item
  (meal_plan_template_items). The change moves the template's FOREIGN KEYS.
  It creates no meal identity and merges none. Principle 1 is strengthened:
  42 slots now name a meal by primary key instead of by fuzzy title match.

☑ One owner per fact
  "Which meal sits in W3D5 of the default plan" has one owner:
  meal_plan_template_items, published from seed/family-plan.json via the
  Variant 1 seed→projection pattern. The JSON is the seed; the table is the
  projection; the seeder is the single publication path.

☑ No duplicate entities
  ZERO meal rows created, edited or deleted. Verified: total meals 3207 before
  and after. The change is entirely in the join table.

☑ No duplicate ownership
  meals.user_id untouched for all 42. Ownership remains distributed across
  users 1, 28, 38, 42, 56, 57, 60, 64 exactly as before. storage.createMeal()
  was not called; no second write funnel introduced (CANONICAL_PUBLICATION
  Variant 3).

☑ No duplicate state
  No household state written. The default template is platform state, not
  household state; a household's planner is only touched when it presses the
  Profile button, unchanged by this work.

☑ Extends existing architecture
  Extends the existing seed→seeder→template pattern. seed-family-plan.ts is
  unmodified; only its input data changed, plus the npm script its own
  docstring already referenced.

☑ Progressive enrichment where appropriate
  Meal is a knowledge entity and was NOT enriched here — no nutrition, claim or
  label was written to any meal row (Principle 6). The Planner is transactional
  state and received no enrichment (Principle 3).
```

### Experience Constitution Check (GEA § 18.2)

- **WEIGHT (GEA2)** — The Planner is not heavier. Same button, same 42 slots, same interaction. Only the dinners differ.
- **VOICE (GEA8/9/21)** — Nothing added coaches, interprets or encourages. The rooms still only observe.
- **OWNERSHIP (GEA21/22)** — No room gained a fact. The Companion's authority is untouched.
- **AGENCY (GEA23)** — **This is the load-bearing one.** A default plan is an offer, not a decision. It remains opt-in behind an explicit button, it is replaceable meal by meal, and it is not applied at signup. THA proposes 42 dinners; the household disposes.
- **RESTRAINT (GEA13/15)** — Nothing scores, ranks or streaks. No new surface.
- **LAYER (GEA20)** — This change sits at the implementation layer. Two durable findings it discovered are named in § "Remaining owner decisions" for the layer above, not buried here.

### GEA4 — which of the four household outcomes does this produce?

**Less on their mind**, and **a small, true, unearned pleasure**. A household that
loads the plan gets six weeks of dinners it does not have to think about, and
opens the week on something it is glad to cook. It does not produce "more
confidence" or "less guilt" — claiming otherwise would be inventing an outcome.

---

## PRODUCT REGISTRY IMPACT

```
PRODUCT REGISTRY IMPACT
=======================
Registry affected: NO

Entries created:   NONE
Entries updated:   NONE
Entries retired:   NONE

Any entry set to `public` or `household`: N/A

Product knowledge written into a prompt, template, fallback
string, fine-tune, or capability code: NO   (Rule PKR27)
```

**Justification.** The test is *"would a person's answer to 'what is THA?' be
different after this change?"* No. THA still offers a ready-made 6-week family
dinner plan; the capability, its name, its description and its entry point are
unchanged. Only which dinners it contains changed. No product knowledge was
written into any prompt or string.

---

## ADOPTION REGISTER IMPACT

```
Owners created:      NONE
Owners adopted:      NONE
Predecessors retired: NONE
Rival ceilings raised: NONE
Exemptions:          NONE
```

No client-side building block was added, changed or retired — no `.tsx` file was
touched. `npm run adoption:check` was **not run** for that reason; stated rather
than claimed.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Planner — default plan template content
Declared SoT: seed/family-plan.json (seed) → meal_plan_templates /
              meal_plan_template_items (projection)
New store created? NO
Existing store extended? NO — existing rows re-pointed, same shape, same count (42)
Consumer created? NO
  Existing consumer (profile-page.tsx MealPlanSection → /api/plan-templates/default
  → /api/plan-templates/:id/apply) unchanged and reads from the declared SoT.
```

No duplication created; therefore no retirement plan is owed.

---

## DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | **YES** — 42 existing `meals` rows |
| Writes new data | **YES** — 42 `meal_plan_template_items` rows, upserted for the one default template |
| Changes meaning of existing data | **NO** — no meal row's content, ownership, provenance or diet labels altered |
| Requires backfill | **NO** |

**Households already holding a loaded plan are unaffected.** Applying the template
copies rows into `planner_entries`; those copies are household state and are not
retroactively rewritten. Only a household that loads the plan *after* this seeding
sees the curated weeks. This is correct (GEA23 — the change does not reach into a
household's planner and rearrange it), and it is also a limitation worth naming.

---

## TRUST CHECK

| Question | Answer |
|---|---|
| Could this mislead the user? | **No.** The plan's name, description and promise are unchanged and remain accurate — it is a 6-week family dinner plan. It is now *more* accurate: it was described as six weeks and delivered three. |
| Could this fabricate certainty? | **No.** No claim, benefit or nutrition statement was authored. No meal was labelled. |
| Is anything guessed but shown as real? | **No** — and one instance of exactly this was *removed*: the fuzzy title resolution that silently substituted a user's `(Edited)` row for the intended recipe. |
| What happens if the system is wrong? | If a pinned `mealId` is later deleted, the seeder logs a warning and falls back to `sourceUrl`, then title, then skips the slot — pre-existing, unchanged behaviour. The household sees an empty day, not a wrong meal. |
| No architectural duplication introduced | Confirmed — meal count 3207 unchanged; zero rows created. |
| No new source of truth created | Confirmed — `seed/family-plan.json` was already the seed for this template. |
| Every "verified" claim backed by a command that ran | Yes — see VALIDATION PERFORMED. |

---

## VALIDATION PERFORMED

Commands that actually ran, with their results:

| Command | Result |
|---|---|
| `npm run seed:family-plan` | **42/42 dinner slots resolved, 0 skipped** (was 25 pinned + 17 fuzzy) |
| DB verification query | **42 items, 42 distinct meals, 0 `(Edited)` artefacts** |
| `classifyDietLabels()` over all 42 | **13 vegetarian, 11 vegan, 0 insufficient evidence** |
| Ingredient-reuse measurement | **avg 10.7 shared anchors per week** (3+ meals) |
| `npm run test:planner-compliance` | 🟢 PASS |
| `npm run test:rm4-planner-ready-meal-library` | 🟢 PASS |
| `npm run test:surf1b5-starter-meal-safety` | 🟢 PASS |
| `npm run test:household-vegan-vegetarian-hard-enforcement` | 🟢 PASS |
| `npm run test:restriction-safety` | 🟢 PASS |
| `npm run test:cbk1-cookbook-seed` | 🟢 PASS |
| `npm run test:plan1-planner-intelligence` | 🟢 PASS |
| `npm run test:intelligence-planner-binding` | 🟢 PASS |
| `npm run test:intelligence-meals-binding` | 🟢 PASS |
| `npm run test:intelligence-templates-binding` | 🟢 PASS |
| `npm run test:surf1c1-starter-cookbook-diet-classification` | 🟢 PASS |
| `npm run test:plan2-planner-intelligence-activation` | 🔴 **20 passed, 3 failed — PRE-EXISTING** |
| `npm run typecheck:ci` | 🔴 **16 regressions — PRE-EXISTING** |

**Both failures were verified against the rollback point**, by `git stash` and
re-run: baseline produces *the identical* `20 passed, 3 failed` and *the identical*
16 typecheck regressions (all in `server/tests/test-plan2-planner-evolution.ts`,
a file this change does not touch). **Not introduced here, and not fixed here** —
they are inherited debt, reported rather than absorbed.

**Not done:** the full `npm test` suite (~160 targets) was not run — the twelve
relevant planner, meal, template and dietary-safety targets were selected instead.
The application was not launched and the curated plan was not loaded through the
UI; verification is at the database and seeder level. Stated rather than implied.

---

## DEFINITION OF DONE

**What success looks like**
- [x] 42 slots, 42 distinct meals, no dish repeated and no near-duplicate dish
- [x] Every slot pinned to an explicit `mealId`; nothing resolves by fuzzy match
- [x] No `(Edited)` artefact, no zero-ingredient meal, no cake/cocktail in a dinner slot
- [x] Weekday dinners achievable; weekend dinners generous; Friday deliberately pleasurable
- [x] Ingredient reuse present within each week — measured, avg 10.7 anchors
- [x] Vegetarian and vegan dinners present throughout — 13 and 11, classifier-verified
- [x] Meals retained where they already met the standard — 9 of 26 kept

**What must not break**
- [x] Planner architecture — no route, service or component changed
- [x] Meal ownership — `meals.user_id` untouched; zero rows created or edited
- [x] Canonical food ownership — no canonical food minted; ingredients unchanged
- [x] Intelligence Platform — binding tests pass; TIP reads, does not copy
- [x] Household dietary adaptation — safety reads ingredients, not `diet_types`; all 42 classifiable

**Manual test steps (not executed — for the owner)**
1. Sign in, go to **Profile → Meal Plan**.
2. Press **Load The Healthy Apples Family 6-Week Meal Plan**; expect a toast reporting 42 meals.
3. Open the Planner and page through all six weeks; expect 42 different dinners.
4. With a vegetarian eater on the household, open W1D6 (bolognese) and confirm the adaptation summary offers a swap rather than silence.

---

## SCOPE LOCK

**Implemented**
- `seed/family-plan.json` rewritten — 42 curated, pinned, distinct dinners
- `package.json` — the missing `seed:family-plan` script its own docstring referenced
- Seeder run against the local `helium/heliumdb` development database
- This document

**Explicitly excluded**
- **No meal rows created, edited or deleted.** The brief forbade duplicate meals and duplicate ownership; the safest reading is that curation selects from what exists rather than authoring alongside it.
- **No schema change, no migration, no route change, no server-logic change.**
- **No production database write.** The seeder ran against the dev database only. Production requires the owner to run `npm run seed:family-plan` there deliberately.
- **No change to the starter-meal path** (`getStarterMeals()`, 63 random meals into a new household's cookbook) — a different mechanism from the default plan, and out of scope.
- **No correction of the `acquisition_type` provenance defect** that COOKBOOK1 named — an owner decision, unchanged here.
- **No breakfast or lunch slots.** The template has always been dinner-only.

**Suggestions — do not implement without approval:** see below.

---

## REMAINING OWNER DECISIONS

**1. The default plan is built from privately-owned meals.** All 42 dinners belong
to individual accounts (users 1, 28, 38, 42, 56, 57, 60, 64) — not to the platform
user 0. **If user 57 deletes `Steak Diane`, the default plan loses a dinner.** A
platform-owned pool exists (`user_id = 0`, `is_system_meal = true`, 884 rows), but
it cannot currently supply this plan — see (2). This predates the change and was
preserved deliberately, because moving ownership was the one thing the brief
forbade. **It is the most serious structural risk in the default experience and it
needs an owner decision.**

**2. The platform-owned library cannot yet furnish a curated week.** Of its 500
authored recipes, **10 are genuinely authored and 490 are template output** —
`{Cuisine}-style {Protein}, {Veg} & {Veg} {Format}`, e.g. *"Malaysian-style Cottage
Cheese, Asparagus & Peas Breakfast Wrap"*. This is COOKBOOK1's finding, unresolved.
Until the founding cookbook contains ~42 dinners of the standard of
`Lentil & Root Vegetable Cottage Pie`, a system-owned default plan is not
available. **(1) is blocked on this.**

**3. No `user_import` meal carries diet labels — 0 of 186.** By contrast, 1642 of
2545 `authored` meals do. **This is not a safety hole:** `shouldExcludeRecipe()`
reads ingredients and name, not `diet_types`, so hard-restriction enforcement is
intact and all 42 classify with sufficient evidence. But any *surface* that filters
or badges by `diet_types` will show the default plan as having no vegetarian
dinners when 13 of 42 are. `classifyDietLabels()` already exists and could
backfill the lane. **Recommended as the next piece of work.**

**4. `meals.servings` is unreliable on this lane.** 71 of 186 imports claim 1
serving and **two claim 250**. Curation was deliberately *not* optimised around
this field, because fitting a family plan to broken metadata would encode the bug.
Worth a repair pass; the Planner currently only renders a `{n} servings` badge when
`n > 1`, so the damage is cosmetic.

**5. Seasonality was interpreted narrowly, and this may not be what was wanted.**
The template has **no anchor date** — it is "six weeks from whenever you press the
button" — so a genuinely seasonal plan is not expressible in the current model.
The curation therefore favours year-round UK produce and a light heavy/light
rhythm, rather than pretending week 3 is autumn. **Making the default plan truly
seasonal requires the template to know when it starts**, which is a model change
and an owner decision.

**6. The Planner can still reach the 490 generated meals.** COOKBOOK1 deliberately
left them searchable and planner-reachable. This change curates the *default plan*
only; it does not establish a rule about what the Planner may draw from generally.
Per GEA20, if such a rule is wanted it belongs written up to
`THA_RECIPE_ACQUISITION_ARCHITECTURE.md`, not decided in a curation task.

**7. Production is not seeded.** The curated plan is live in development only.

**8. `docs/implementation/` and `docs/investigations/` both fail their structure
gate**, and have for some time — 28 loose reports at the implementation root
against a convention that says file by workstream. This change added a 29th rather
than orphan itself from its siblings (see *Filing note*). The gate is currently a
check nobody can pass, which makes it a check nobody reads. **Either sweep the 28
into workstream folders, or amend `REPOSITORY_CONVENTIONS.md` to match what the
repository actually does** — but the present state teaches the wrong lesson.

---

## OUTCOME

The default Planner experience was a six-week plan that was three weeks played
twice: 26 distinct meals across 42 slots, eight of them lentil dhals, mussels
appearing under two identities, paella under three, and one slot serving a
household a recipe literally named `Lentil & sweet potato curry (Edited)` because
seventeen of the forty-two slots did not say which meal they meant and let
`ORDER BY id DESC` decide.

It is now forty-two distinct dinners, each pinned to a specific meal by primary
key, with a weekday/weekend rhythm, measured ingredient reuse averaging 10.7
shared anchors per week, and thirteen vegetarian dinners of which eleven are
vegan — verified with the platform's own classifier rather than asserted. Not one
meal row was created, edited or deleted, so meal ownership, canonical food
ownership and the acquisition lanes are exactly as they were.

What the change could not fix, it wrote down: the default plan still rests on
recipes owned by eight private accounts, because the platform-owned library that
should hold them is still 490 parts template output to 10 parts cookbook.

---

## NEXT STEPS

1. **Owner reviews the 42 dinners** against the success test — *"I'd happily cook every one of those."*
2. **Owner runs `npm run seed:family-plan` in production** when satisfied.
3. **Backfill `diet_types` on the `user_import` lane** with the existing `classifyDietLabels()` — decision (3), the cheapest real improvement available.
4. **Resolve decisions (1) and (2) together** — a system-owned default plan needs a system-owned cookbook worth planning from.
