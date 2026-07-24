# FOUNDATION_MEALS1 — The Founding Cookbook: Editorial Foundation

**Date:** 2026-07-20
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN — editorial governance only. No schema, no migration, no route, no server logic, no client change, and **zero meal rows created, edited, re-laned or deleted.**
**Reason:** This document defines a standard and applies it to meals that already exist. It writes no recipe and moves no row.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/FOUNDATION_MEALS1-founding-cookbook-20260720` → `d1088d46` |
| Working tree at tag time | **Not clean** — one tracked file modified: `.engineering/session/CURRENT.md`, the session dashboard's automated Stop-hook heartbeat. The tag does not cover it. No other uncommitted work existed. |
| This task's writes | This file only |
| Rollback | `git checkout rollback/FOUNDATION_MEALS1-founding-cookbook-20260720` — or simply `git rm` this file. Nothing else changed. |

**A tag is sufficient protection here in a way it usually is not.** The sibling workstreams in this folder had to warn that a code rollback does not restore seeded data. This one has no data to restore: it wrote none.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — the eight principles
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Meal Identity is Domain 12
- [x] `docs/architecture/THA_BRAND_CONSTITUTION.md` — the identity this collection has to be recognisable as
- [x] `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` — the four lanes; §3.4 honest provenance; §8's carried-forward caveat
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`, `REPOSITORY_CONVENTIONS.md` — compliance and filing
- [x] `shared/cookbook/curation.ts` — the current owner of *"what belongs on the shelf"*
- [x] `docs/implementation/cookbook/COOKBOOK1_FAMILY_COOKBOOK_TRANSFORMATION.md` §4, §8 — the shelving change and its six unresolved owner decisions
- [x] `docs/implementation/cookbook/COOKBOOK3_IMPORT_THA_ORIGINAL_FOUNDING_COOKBOOK.md` — the 500-recipe import
- [x] `docs/investigations/experience/EXPREVIEW1_FIRST_TIME_HOUSEHOLD_EXPERIENCE.md` §6, §8 — *"the room that broke the house"*
- [x] `docs/implementation/planner/PLANNER_MEALS1_DEFAULT_MEAL_CURATION.md` — the curated default weeks

---

## 0. Filing deviation, declared

The mission named `docs/implementation/FOUNDATION_MEALS1_FOUNDING_COOKBOOK.md`. This file is at `docs/implementation/**cookbook**/FOUNDATION_MEALS1_FOUNDING_COOKBOOK.md`.

`REPOSITORY_CONVENTIONS.md` §2 lists *"loose files at its root"* under **do not put here** for `docs/implementation/`, and Rule 5 states that a report written to a root *"is a defect, not a filing decision."* §4 names `cookbook/` as the workstream folder for *"recipes and meal content."* The mission also instructed me to read and comply with the governing architecture; where the two instructions met, I followed the architecture and am reporting the deviation rather than making it silently. **Moving it to the named path is a one-line owner decision** (§ 12, decision 6) — but it would put the file in the place the conventions call a defect, and several of its siblings already sit there in exactly that condition.

---

## 1. What this document owns — and what it must never own

It owns exactly one thing that nothing in THA currently owns:

> **The editorial standard a meal must meet to carry The Healthy Apples' name — and the record of which existing meals meet it.**

The survey behind this document searched for a prior owner of that question and found none. THA governs recipe *provenance* thoroughly (`THA_RECIPE_ACQUISITION_ARCHITECTURE.md`), recipe *shelving* (`shared/cookbook/curation.ts`), recipe *safety and diet classification* (`shared/dietRules.ts`), and recipe *idempotency* (`scripts/ci/verify-cookbook-seed.ts`). Nothing anywhere says **what makes a THA recipe good enough to ship.** That absence is the whole reason 490 template rows were able to enter the library carrying THA's name: no gate existed for them to fail.

**It does not own, and does not touch:**

| Concern | Its owner, unchanged by this document |
|---|---|
| The meal itself, and its ownership | DB `meals` — Meal Identity, Domain 12 (`ARCHITECTURE_PRINCIPLES.md`, Domain Ownership table). `userId = 0` + `isSystemMeal = true` is what makes a meal THA's; this document creates no second marker of that and no second key space. |
| Which shelf a meal appears on | `shared/cookbook/curation.ts` (`shelfForMeal`). This document does not re-derive a shelf, duplicate `isGeneratedLibraryName`, or ask a surface to classify a meal itself. |
| Acquisition lane and provenance | `shared/recipe-acquisition.ts` + the `meals.acquisition_*` columns. This document re-lanes nothing. |
| Canonical food identity, and **seasonality** | `shared/canonical/foods.ts` → `canonical_food`, including `peak_seasons` (`shared/schema.ts:2336`). See §4.5 — this is load-bearing. |
| Ingredient → food resolution | `shared/canonical/resolver.ts` — exact-key, one string → at most one food. |
| What a household eats and when | `planner_weeks` / `planner_days` / `planner_entries`. A standard for meals is not a plan, and nothing here reaches the planner. |
| What THA says about a meal | The Intelligence Platform and `buildMealIntelligence`. No capability, prompt, intent or registry entry is created, and no editorial text here is written into a prompt or fallback string (Rule PKR27). |

**The non-restatement rule applies (per `THA_BRAND_CONSTITUTION.md` §1).** Where a test below rests on a rule owned elsewhere — non-fabrication, diet classification, provenance — it **cites** that owner and does not restate it. If any line here is found to duplicate a rule owned elsewhere, **the line here is the defect.**

---

## 2. The review: what the existing meal library actually contains

The mission asked me to review the existing library and identify the meals that genuinely represent THA. That review is the foundation everything below rests on, so it is reported as measurement rather than opinion. Every figure was computed directly over `data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json` (500 recipes) and is reproducible.

### 2.1 The corpus is not 500 recipes. It is ten recipes and one generator.

| Measure | Finding |
|---|---|
| Recipes in the founding corpus | 500 |
| **Distinct method steps across all 500** | **407**, across 2,881 step-instances |
| **Distinct ingredient lines across all 500** | **218**, across 5,791 ingredient-instances |
| Recipes whose method **opens and closes on the identical two steps** | **372 (74.4%)** |
| Recipes on the second frame (*"Heat olive oil in a pan / Add the protein / Season lightly / Serve with wholegrain toast"*) | **74** — which is **74 of the 75 breakfasts** |
| Recipes on the snack frame | 20 — which is **all 20 snacks** |
| Recipes whose name matches `<Cuisine>-style <A>, <B> & <C> <Format>` | **468** |
| **Recipes that are neither framed nor cuisine-prefixed** | **10 — exactly THA-001 … THA-010** |

The dominant frame, verbatim, in 372 recipes:

```
Heat olive oil in a large pan and cook onion for 6–8 minutes.
Add garlic and spices and cook for 1 minute.
Add {protein}, {veg} and {veg}, stirring to coat in the flavour base.
Add tomatoes, stock or water as listed and simmer until tender.
Cook or stir in the {starch} as appropriate for the dish.
Season lightly and serve with fresh herbs, with chilli or jalapeños added at the table.
```

An *"Ethiopian-style"* stew and a *"Peruvian-style"* bowl in this library are not two recipes. They are one recipe with two labels and a different vegetable in slot three. `1 tbsp olive oil` appears in 452 of 500; `Optional chilli flakes or sliced jalapeños, added after serving` in 372.

### 2.2 The duplication is semantic, and every key-based check passed it

**190 recipes share a byte-identical ingredient set with at least one other recipe, in 50 groups.** Group depth: 24 pairs, 10 triples, 6 quadruples — and **10 groups running 8 or 9 recipes deep**, which alone account for 88 of the 190. The largest, nine ways identical:

> *Spanish-style Chicken Thigh, Broccoli & Asparagus Noodle Bowl* — and *… Noodle Bowl 2* through *… Noodle Bowl 9*.

And yet: **0 duplicate slugs. 0 duplicate names. 0 duplicate import keys.** The importer was correct, idempotent, and verified — `scripts/ci/verify-cookbook-seed.ts` runs eight checks and all eight pass. They pass because the generator appended a collision integer, which made every key unique while leaving the *recipes* identical.

This is the finding worth carrying out of this document: **a uniqueness constraint on a key is not a uniqueness constraint on a meal.** THA's duplicate-meal defence was entirely key-based, and the duplication walked straight through it. The mission's instruction *"do not introduce duplicate meals"* is therefore not a caution about this document — it is a description of a state the library is already in, and §4.9 is the test that would have caught it.

### 2.3 Cuisine breadth is a generator artefact, not global inspiration

Twenty-five cuisines is a good number for a family cookbook. This distribution is not:

```
Indian 54 · Australian Cafe 53 · Spanish 53 · Indonesian 52 · Ethiopian 52
British family kitchen 24 · Mediterranean 23 · Moroccan 22 · Thai 22 · Peruvian 22
… Italian 1 · Mexican 1 · Middle Eastern 1 · Nordic-Mediterranean 1 · British-Mediterranean 1
```

Five cuisines take 264 of 500 slots at near-identical counts — the signature of a loop, not a decision. And the five singletons at the tail are *the authored ten's* cuisines. A cookbook for British households with **one** Italian recipe and **one** Mexican recipe, but fifty-two Ethiopian-inspired ones, is not globally inspired. It is unweighted.

### 2.4 Preparation time is not realistic for the meal it claims to be

| | |
|---|---|
| Median total time, all 500 | **50 minutes** |
| **Dinners over 45 minutes** | **266 of 270 (98.5%)** |
| Dinners at or under 30 minutes | **0** |

A dinner library in which 98.5% of dinners exceed forty-five minutes and **none** comes in under thirty has no answer for a Tuesday. Against `THA_BRAND_CONSTITUTION.md` §3 — *"less to carry, not more"* — a collection with no weeknight floor adds weight on precisely the evening it was supposed to lift it.

### 2.5 Seasonality is absent

Searching every `why_this_works_for_tha` and every `planner_readability_notes` entry across all 500 recipes: **17 occurrences of "spring". Zero for summer, autumn, or winter.** The mission names seasonal cooking as a founding characteristic. The corpus has none. §4.5 addresses this — and does so *without* adding a season field to `meals`, which matters architecturally.

### 2.6 The editorial voice exists, and has nowhere to live

Each of the 500 carries `why_this_works_for_tha` — genuine editorial rationale, in THA's voice:

> *"Wholegrain oats, apple, seeds and nuts create a filling whole-food breakfast with sweetness from fruit rather than added sugar."* (THA-001)

**360 of the 500 are distinct**, so even the generator's rationales are 28% duplicated — four separate rationales are each shared by nine recipes. But the deeper problem is structural: `why_this_works_for_tha`, `cuisine_inspiration`, `prep_minutes`, `cook_minutes` and `difficulty` **have no column on `meals`** and were correctly not forced into unrelated ones (`scripts/import-tha-founding-cookbook-500.ts:70-76` — *"honest gaps, never invented columns"*). That was the right call and it remains right. The consequence is that THA's editorial voice about its own recipes currently survives only in a JSON file that no runtime surface reads. §12 decision 3.

### 2.7 The provenance record is false, and something downstream is compensating for it

All 500 rows assert `acquisition_type: 'authored'`. For 490 of them that is untrue, and `THA_RECIPE_ACQUISITION_ARCHITECTURE.md` §3.4 (*honest provenance, no laundering*) is the rule it breaks. `shared/cookbook/curation.ts` consequently separates the cohort with a **regex on the recipe name**, and says so in its own comment:

> *"This is a name-shape rule, and a name-shape rule is a thing to be embarrassed about rather than proud of. It is here because the field that should carry this fact — `meals.acquisitionType` — asserts 'authored' for all 500."*

I confirmed that rule's accuracy independently before relying on it: `GENERATED_NAME` separates the cohort **exactly** — 490 generated, 10 authored, no false positives in either direction. It is correct, and it is compensating for a false fact upstream. This document does not correct that provenance (it is COOKBOOK1 §8 decision 4, an owner decision requiring a reviewed migration) but it records that **§4's tests must eventually read a field, not a name shape**, or they inherit the same embarrassment.

### 2.8 And the machine output reached the shelf marked "Yours"

Per `COOKBOOK1` §4: `server/lib/meal-service.ts` copies starter meals into each household's own cookbook at onboarding, and **43 template-generated recipes now sit in households' own cookbooks**, shelved as *"Your recipes."*

Under `THA_BRAND_CONSTITUTION.md` §8, the Trust Test asks whether a household believing exactly what THA tells them would end up believing something true. A family reading *"Your recipes"* over a combinatorial title they never chose ends up believing something false about their own kitchen. **This is the sharpest reason the standard below needs to exist**, and it is why §4.10 is a test about a claim rather than about cooking.

---

## 3. What this means — stated plainly

The Founding Cookbook was **already attempted**, and the attempt is on disk. This document therefore does not begin a collection. It does something more useful and considerably less comfortable:

> **The Healthy Apples' founding collection is ten recipes, not five hundred. The other 490 are one recipe wearing 490 names.**

That is not a demotion of the previous work. `COOKBOOK2` authored ten genuine recipes and `COOKBOOK3` executed a technically exemplary import — idempotent, provenance-recording, honest about the columns it refused to invent, and reversible. What went wrong sits between them: **the corpus was scaled from 10 to 500 by generation, and no editorial standard existed for that scaling to fail.**

The mission's success test settles it:

> *If someone cooked these meals for six months, they would understand what The Healthy Apples stands for.*

Cook the 490 for six months and you learn one method — soften an onion, add spices, add tomatoes, simmer — and you conclude THA stands for a spreadsheet. Cook the ten and you learn ten genuinely different things. **The collection is the ten.** Everything below exists so the eleventh recipe has to earn its place beside them.

---

## 4. THE THA MEAL STANDARD

Ten tests. **A meal must pass all ten to carry THA's name.** They are ordered so the cheapest disqualifiers come first.

Each test names the mission characteristic it serves, states the bar, and — where a bar can be measured — states the measurement. Where a test rests on a rule owned elsewhere, it cites that owner and restates nothing.

### 4.1 — The Distinctness Test *(memorable family meals)*

> **A meal must differ from every meal already in the collection in more than its ingredients list.**

A new meal fails if its method is the collection's existing method with substitutions. Two meals may share a technique — a traybake and a traybake — but not a *sequence*. The question is: *if I cooked this and the one it resembles in the same week, would the family notice they were different dinners?*

**Measurable floor:** a candidate whose method sequence, with quantities and ingredient nouns removed, matches an existing meal's is **rejected**. On the current corpus this test rejects 490 of 500 and admits all ten.

### 4.2 — The Name Test *(memorable family meals)*

> **A person wrote this name, for this dish, on purpose.**

A THA name describes food someone would say out loud: *Lentil & Root Vegetable Cottage Pie*, *Gentle Taco Rice Bowls*. It is not a slot-filled descriptor and **never** carries a disambiguating integer.

**Hard rejections:** any name matching `<Cuisine>-style <A>, <B> & <C> <Format>`; any name ending in a bare digit; any name whose only difference from an existing name is a substituted vegetable.

*A collision integer is never repaired by removing it.* Per `COOKBOOK1` §3: stripping `" 2".." 9"` does not produce well-named recipes, it produces name collisions — because the recipes underneath are near-identical. **The integer is the symptom; §4.1 is the disease.**

*(A figure to reconcile, not a contradiction: this document counts **118** collision integers, `COOKBOOK1` §3 counts **127**. The populations differ — 118 is the source corpus of 500; 127 is the database, which also holds the household copies described in §2.8. Both are correct for what they count.)*

### 4.3 — The Weeknight Test *(realistic preparation)*

> **The collection must answer the evening it is most often opened on.**

Not every meal must be fast. But a collection with no fast meals is not realistic, and the current one has none.

**Collection-level floor, not per-meal:**

| Slot | Requirement |
|---|---|
| Dinner ≤ 30 min, start to table | **at least 25%** of dinners *(currently: 0%)* |
| Dinner ≤ 45 min | at least 70% of dinners *(currently: 1.5%)* |
| Dinner > 60 min | at most 10%, and each must earn it — a weekend or batch-cook meal, declared as such |
| Breakfast | ≤ 20 min on a weekday, without exception |

A meal over 60 minutes is admitted only if the time buys something the family can name: a batch that feeds twice, a roast that becomes tomorrow's lunch. **Time spent that produces only one dinner is time the Promise says THA owes back** (`THA_BRAND_CONSTITUTION.md` §3).

### 4.4 — The Whole-Food Test *(whole-food ingredients, nutritional excellence)*

> **The plate is led by food, not by product.**

- Vegetables, pulses, wholegrains, fruit, nuts and seeds lead; meat and fish support rather than dominate.
- Refined starch is the exception and is named as a choice, never a default.
- No ingredient exists only to make the dish palatable — sweetness comes from fruit and vegetables before it comes from sugar.
- **Nutritional claims are not made here.** Any nutrition statement attached to a meal obeys `ARCHITECTURE_PRINCIPLES.md` Principle 6 and the `SourceRef` requirement, whose owner is the knowledge layer. **This test governs the composition of the plate; it never authors a health claim.**

The authored ten already read this way — THA-008's cottage pie is lentil-led with root vegetables, not mince with a vegetable garnish.

### 4.5 — The Season Test *(seasonal cooking)* — **and how it must be implemented**

> **A meal must be at its best at a nameable time of year, and the collection must cover all four.**

This is the test with an architectural trap in it, so the rule is stated in two halves.

**The editorial half.** A meal is seasonal when its *leading* ingredients are at their peak together. A tomato-and-basil pasta is a summer meal; a root-vegetable cottage pie is a winter one. A meal whose leading ingredients have no season (a store-cupboard dhal) is **not disqualified** — it is *all-season*, declared deliberately, and the collection needs some.

**The architectural half — and this is binding.** THA already owns seasonality, and it owns it **on the food, not on the meal**: `canonical_food.peak_seasons` (`shared/schema.ts:2336`), resolved from an ingredient string by `shared/canonical/resolver.ts` (exact-key, one string → at most one food).

> **A meal's season is therefore *derived* from its canonical ingredients. It is never stored on the meal.**

Adding a `season` column to `meals` would create a second owner of a fact `canonical_food` already owns, and the two would drift the first time a variety was re-graded — **`ARCHITECTURE_PRINCIPLES.md` Principle 2, and Principle 7's prohibition on a synchronisation bridge.** This is the single most likely way a well-meant future implementation of this standard breaks the architecture, which is why it is written down here in advance.

**Collection-level requirement:** each of the four seasons is the peak season of at least 15% of the collection, and no season exceeds 40%.

### 4.6 — The Reuse Test *(ingredient reuse)*

> **A household cooking through the collection must shop a coherent list, not 500 unrelated ones.**

An ingredient bought for one meal should find a second home within the same week's cooking. This is the test whose intent the generator technically satisfied and completely missed: 218 distinct ingredient lines across 500 recipes is not reuse, it is **sameness**. Reuse means a bunch of parsley gets used twice; sameness means every dinner is the same dinner.

**The bar is two-sided, and both sides bind:**

| | Floor | Ceiling |
|---|---|---|
| A staple's reach | Every non-store-cupboard ingredient appears in **≥ 2** meals — nothing is bought for one dish and wasted | **No single non-staple ingredient appears in more than 20%** of the collection |
| Collection variety | — | **Distinct ingredients ÷ meals ≥ 5** *(the ten: 68 ÷ 10 = **6.8** ✅ · the 500: 218 ÷ 500 = **0.44** ❌)* |

That last ratio is the cheapest possible detector of the failure this library already suffered, and it fails the 490 by a factor of fifteen.

### 4.7 — The Global Inspiration Test *(global inspiration)*

> **A cuisine is present because someone cooks it, not because a loop reached it.**

- A meal names its inspiration honestly and **does not claim to be** the dish it is inspired by. *"Indian-inspired"* on a British weeknight lentil curry is honest; labelling it a specific regional dish it is not would fail the Trust Test.
- **No cuisine exceeds 15% of the collection**, and the weighting reflects how British households actually cook — which means Italian and Mexican are not singletons while Ethiopian-inspired holds 52 slots.
- A cuisine entering the collection arrives with **at least three** genuinely different meals, or it does not arrive. One recipe is a token; three is a small repertoire.

### 4.8 — The Everyday Test *(everyday practicality)*

> **A normal household can buy this, cook this, and serve this, this week.**

- Ingredients are available in a standard UK supermarket. A specialist item is permitted only where the meal names an ordinary substitute in the same breath.
- No equipment beyond a standard domestic kitchen.
- **The meal serves 4 by default** — the corpus is already consistent here (479 of 500), and consistency is what makes scaling and the shopping list trustworthy.
- The method is written for someone cooking with a child in the room: steps in order, no step doing three things at once.
- **Optionality is honest.** *"Optional chilli flakes, added after serving"* appearing in 372 recipes is not accommodation, it is padding — and it taught the corpus to look adaptable while every dish stayed identical.

### 4.9 — The No-Duplicate Test *(the constraint the library already failed)*

> **A meal is a duplicate when a cook would say it is — not when a database key says it is.**

Every check below must pass **before** admission, and each names a failure the current corpus demonstrates:

| Check | Rejects |
|---|---|
| Ingredient set is not identical to an existing meal's | the 190 recipes in 50 identical-ingredient groups |
| Method sequence is not an existing method with substitutions | the 372 on the dominant frame |
| Name is not an existing name plus a digit or a swapped vegetable | the 118 carrying collision integers |
| Editorial rationale is not copied from an existing meal | the four rationales shared by nine recipes each |

**And the ownership half of the same test.** Admitting a meal must never create a second record of it. A meal is owned once, in `meals`, identified by `id`, marked THA's by `userId = 0` + `isSystemMeal = true`, and laned once in `acquisition_lane`. This standard adds **no** new marker of THA-ness, no parallel list, no editorial table, and no second key space (`ARCHITECTURE_PRINCIPLES.md` Principle 1).

### 4.10 — The Trust Test, applied to a recipe *(the gate above all others)*

> **If a household believed exactly what this meal's presence in THA tells them, would they believe something true?**

This is `THA_BRAND_CONSTITUTION.md` §8, applied at the grain of a single recipe. It is cited, not restated. Concretely, for a meal it asks:

- Does its **provenance** say truthfully how it came to exist? A generated recipe labelled `authored` fails — as 490 currently do (§2.7).
- Does the **shelf it lands on** claim truthfully whose recipe it is? A starter meal a family never chose, sitting under *"Your recipes"*, fails — as 43 currently do (§2.8).
- Does the meal **do what its name says** and taste of what it claims?
- Are its **gaps honest**? A missing photograph renders as absent, never as a stock image of a different dish. A missing nutrition figure renders as absent, never as an estimate (Principle 6).

**A meal that fails this test does not ship, however well it cooks.**

---

## 5. The Founding Collection, as it stands today

Applying §4 to the existing library, with no meal written and none removed:

### 5.1 Admitted — the founding ten

All ten pass all ten tests. This is measured, not asserted: **ten distinct method sequences, ten distinct editorial rationales, ten distinct cuisines, 68 distinct ingredients (6.8 per meal), times spanning 20–70 minutes with a median of 45.**

| # | Meal | Slot | Time | Inspiration |
|---|---|---|---|---|
| THA-001 | Apple, Oat & Cinnamon Morning Bowl | breakfast | 20 min | British family kitchen |
| THA-002 | Chickpea, Lemon & Spinach Soup | lunch | 40 min | Mediterranean |
| THA-003 | Basil Tomato Wholewheat Pasta | dinner | 35 min | Italian |
| THA-004 | Golden Potato, Chickpea & Spinach Curry | dinner | 45 min | Indian |
| THA-005 | Gentle Taco Rice Bowls | dinner | 40 min | Mexican |
| THA-006 | Roast Vegetable & Butter Bean Traybake | dinner | 55 min | Mediterranean |
| THA-007 | Chicken, Leek & Wholewheat Orzo One-Pot | dinner | 50 min | British-Mediterranean |
| THA-008 | Lentil & Root Vegetable Cottage Pie | dinner | 70 min | British family kitchen |
| THA-009 | Salmon, Broccoli & Brown Rice Traybake | dinner | 45 min | Nordic-Mediterranean |
| THA-010 | Roasted Carrot, Chickpea & Herb Grain Salad | side | 45 min | Middle Eastern |

They reuse genuinely — chickpeas across three, spinach across three, tomatoes across three, lemon across three — while no two are the same dish. **That is what §4.6 was written to describe.**

### 5.2 Where the founding ten are honestly short

Applied to itself, the standard does not flatter the collection it admits:

| Gap | Against |
|---|---|
| **No dinner under 30 minutes** — the fastest is 35 | §4.3 — the ten fail the weeknight floor too, less severely than the 490 but they fail it |
| **1 breakfast, 1 lunch, 1 side, 0 snacks** | a collection, not yet a cookbook |
| **No declared seasons** — nothing carries a season, though §4.5 can derive them from canonical ingredients today | §4.5 |
| **THA-008 at 70 minutes does not declare what the time buys** | §4.3 |
| **No photographs** — for any meal, anywhere in the room (`EXPREVIEW1` §6) | §4.10's honest-gaps clause: currently satisfied by rendering nothing, which is honest but not good |

Recording these is the point. A standard whose first act is to declare its own collection perfect is not a standard.

### 5.3 Not admitted — the 490

They remain exactly where `COOKBOOK1` put them: on the non-browsable `library` shelf, reachable only by explicit search. **This document does not delete them, re-lane them, or move them.** Deletion is `COOKBOOK1` §8 decision 1 and is the owner's; it is irreversible and the planner may hold references. What this document adds is the *criterion* that decision was missing — and the criterion is unambiguous: **they fail §4.1, §4.2, §4.6, §4.7 and §4.9, and 490 of them fail §4.10 on provenance.**

---

## 6. How the collection grows

**The target is a cookbook, not a catalogue.** A realistic founding collection is **40–60 meals**: enough that six months of cooking teaches you what THA stands for, small enough that every one of them was chosen. `EXPREVIEW1` §8 proposed *"twenty recipes a person actually chose"* — that is the right shape; this puts a number on the growth beyond it.

**Composition target for a complete founding collection:**

| Slot | Target | Today |
|---|---|---|
| Dinner | 24–30 | 6 |
| Lunch | 8–12 | 1 |
| Breakfast | 6–8 | 1 |
| Side | 4–6 | 1 |
| Snack | 2–4 | 0 |

**The admission rule — one line, and it is the whole governance of this document:**

> **A meal enters the Founding Cookbook by passing all ten tests in §4, recorded against it by name, by a person. A meal that has not been assessed is not in the collection — it is merely in the library.**

Three consequences follow, and each closes a door that was open when the 490 walked in:

1. **Generation is not prohibited — unassessed admission is.** A drafting tool may propose a meal. It may never admit one. The 490 entered because proposal and admission were the same act.
2. **Batch size is capped at what a person can actually assess.** The gap between `COOKBOOK2` (10, assessed) and `COOKBOOK3` (500, not assessable) is the whole defect. **No batch exceeds 25 meals.**
3. **§4.9 runs against the whole collection, before admission, every time** — not against a key, and not after the fact.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity                                                    ✅ PASS
  Meal identity remains `meals.id` (Domain 12), THA-ownership remains
  `userId = 0` + `isSystemMeal = true`. This document introduces no
  identifier, no slug space, no editorial key. The THA-### ids used
  throughout are the EXISTING `acquisition_source_key` values
  (`tha_original:THA-###`), cited as references — not minted here.

□ One owner per fact                                                        ✅ PASS
  Every fact cited has exactly one owner and this document is not it:
  meal content → `meals`; shelf → `shared/cookbook/curation.ts`;
  provenance → `meals.acquisition_*`; SEASON → `canonical_food.peak_seasons`
  (§4.5, explicitly, with the drift it prevents named); diet labels →
  `shared/dietRules.ts`. This document owns one fact nothing else owns:
  the editorial standard itself.

□ No duplicate entities                                                     ✅ PASS
  Zero meals created. Zero rows written. The founding collection is a
  STATEMENT ABOUT existing rows, not a second collection of them.

□ No duplicate ownership                                                    ✅ PASS
  No attribute gains a second owner. §4.5 exists specifically to prevent
  the most likely future violation (a `meals.season` column shadowing
  `canonical_food.peak_seasons`).

□ No duplicate state                                                        ✅ PASS
  No user state read, written, or split. No household data touched.

□ Extends existing architecture                                             ✅ PASS
  Extends the `COOKBOOK1` curation model (which separated authored from
  generated but could not say WHY one was better) by supplying the missing
  criterion. Extends the Recipe Acquisition Architecture's provenance
  question — "under what right?" — with the editorial question it never
  asked: "to what standard?"

□ Progressive enrichment where appropriate                                  ✅ PASS
  Meal is a knowledge entity. The standard follows identity → core facts →
  optional enrichment: a meal is admitted on facts it already carries, and
  absent enrichment (photograph, nutrition, season) renders as absent.
  No enrichment pipeline is bolted on; none is built at all.

□ Knowledge domain compliance                                               ✅ PASS
  Introduces no new knowledge domain and invents no lifecycle. Closest
  §1.1 analogue: Recipe/Meal Knowledge, whose Candidate source is the
  acquisition lanes and whose Published form is a `meals` row. This adds
  a GATE to that existing row — the one it did not have — and nothing else.

□ Honest gaps over fabricated information                                   ✅ PASS
  §4.10 makes honest gaps an admission criterion. §5.2 applies it to the
  admitted collection and records five gaps rather than claiming none.
  Every figure in §2 is measured and reproducible; no percentage estimated.

□ No permanent synchronisation bridge                                       ✅ PASS
  None created. §4.5 exists to prevent one.

□ Evolution over replacement                                                ✅ PASS
  Replaces no store. Retires nothing. NAMES the retirement it enables:
  when the owner corrects the 490's provenance (COOKBOOK1 §8.4),
  `isGeneratedLibraryName`'s name-shape rule can be retired and §4's
  tests read a field instead (§2.7).
```

**AI ARCHITECTURE COMPLIANCE** — *not applicable.* No capability, intent, prompt, conversation state, or model call. No editorial text here is written into any prompt, template or fallback string (Rule PKR27).

**EXPERIENCE & UI GOVERNANCE COMPLIANCE** — *not applicable.* No person sees, reads, hears or does anything differently as a result of this document. It changes no screen, string, component or behaviour. Should a future workstream *implement* this standard in a way a household can see, that workstream owes the full block.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:            Meal Identity / Cookbook content (Domain 12)
Declared SoT:               DB `meals` table
New store created?          NO
Existing store extended?    NO — not read for writing, not altered.
                            Editorial assessment of existing rows only.
Consumer created?           NO — this document is read by people, not code.
                            No runtime dependency is created on it.
```

No duplication is created, so no retirement plan is owed.

---

## PRODUCT REGISTRY IMPACT

- **Registry affected:** **NO.**
- **Entries created / updated / retired:** NONE.
- **Justification:** the test is *"would a person's answer to 'what is THA?' be different after this change?"* No — because nothing a person can reach has changed. The Cookbook contains exactly the meals it contained before, on exactly the shelves it had before. **This document changes what THA's builders must do next; it does not change what THA is.** The moment any part of §4 is enforced in a way a household can perceive — a meal admitted, the 490 deleted, a collection published — the registry is affected and that change owes it an entry.

---

## ADOPTION REGISTER IMPACT

- **Register affected:** **NO.** No component, hook, token, utility class or shared pattern is created, adopted or retired. `npm run adoption:check` is unaffected — no client file is touched.

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** — read-only, and **from the source JSON on disk, not from any database.** No DB connection was opened by this workstream. |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** — the 490 remain `library`-shelved exactly as `COOKBOOK1` left them; no lane, name, or flag altered |
| Requires backfill | **NO** |
| Meal row count | **unchanged** — nothing inserted, updated, or deleted |
| Schema / migration | **NONE** |
| Production | **untouched** |

---

## TRUST CHECK

- **Could this mislead the user?** No user can reach it. Its risk is to *builders* — and the largest one is that a reader implements §4.5 by adding a season column to `meals`. That is why §4.5 forbids it in the text of the test rather than in a footnote.
- **Could this fabricate certainty?** The §2 findings are the load-bearing claims, so every one is a count over a file that can be re-run. Where I relied on someone else's claim — `curation.ts`'s assertion that its regex separates the cohort exactly — **I verified it independently before depending on it** (490/10, no false positives either way) rather than inheriting it.
- **Is anything guessed but shown as real?** No. The thresholds in §4.3, §4.5, §4.6 and §4.7 are **editorial judgements, and are labelled as such** — they are proposals for the owner to set (§12 decision 2), not measurements dressed as findings. The distinction is deliberate: §2 is what *is*; §4's numbers are what someone must *decide*.
- **What happens if this is wrong?** If the standard is too strict, good meals are excluded and the owner loosens a threshold. If too loose, the 490 problem recurs — which is why §4.1 and §4.6's ratio are the two tests that alone reject the entire generated cohort.
- **No architectural duplication introduced:** YES *(none)*
- **No new source of truth created:** YES *(none — one editorial standard, which nothing else owns)*
- **No runtime behaviour altered:** YES *(none whatsoever)*

---

## ROLLBACK PLAN

| | |
|---|---|
| Rollback identifier | `rollback/FOUNDATION_MEALS1-founding-cookbook-20260720` → `d1088d46` |
| Files modified | **One** — this file, newly created. Nothing else in the repository is touched. |
| Rollback command | `git rm docs/implementation/cookbook/FOUNDATION_MEALS1_FOUNDING_COOKBOOK.md` — or `git checkout rollback/FOUNDATION_MEALS1-founding-cookbook-20260720` |
| Verification after rollback | None required. No data, schema, route, or runtime behaviour to verify — the repository returns to a state that differs only by the absence of this document. |

---

## DEFINITION OF DONE

**What success looks like:**

| The mission required | Where this document meets it |
|---|---|
| Confirm git status | Clean but for the session dashboard's Stop-hook heartbeat; recorded above |
| Create rollback protection, report the identifier | `rollback/FOUNDATION_MEALS1-founding-cookbook-20260720` → `d1088d46` |
| Read the governing architecture | Reference Documents Read |
| Review the existing meal library | § 2 — measured, reproducible, over all 500 recipes |
| Identify meals that genuinely represent THA | § 5.1 — the ten, with the evidence that separates them, **and** § 5.2, where they fall short |
| Define the standards every future THA meal must meet | § 4 — ten tests |
| Preserve meal ownership | § 1 table; Compliance — `meals` untouched, no second marker of THA-ness |
| Preserve canonical food ownership | § 4.5 — season derives from `canonical_food.peak_seasons`; a `meals.season` column is forbidden by name |
| Preserve planner architecture | Nothing here reaches `planner_*`. No plan, week, or entry is read or written |
| Preserve intelligence platform | No capability, intent, prompt or conversation state |
| No duplicate meals or ownership | Zero rows written; § 4.9 is the test the library needed and § 2.2 is the proof it lacked one |
| Memorable family meals | § 4.1, § 4.2 |
| Seasonal cooking | § 4.5 (with the architecture it must not break) |
| Whole-food ingredients | § 4.4 |
| Realistic preparation | § 4.3 |
| Ingredient reuse | § 4.6 |
| Nutritional excellence | § 4.4, bounded by Principle 6 — composition, never an authored health claim |
| Global inspiration | § 4.7 |
| Everyday practicality | § 4.8 |
| A foundation a permanent collection can grow from | § 6 |
| Architecture Compliance | Completed above, in full |
| Definition of Done | This section |
| Commit, push, report | Reported in the session summary |

**The success test, answered honestly.** *Would six months of cooking these teach someone what THA stands for?*

**Of the founding ten: yes** — ten techniques, ten cuisines, vegetables and pulses leading, a shopping list that coheres, and every one a dish a family would ask for again. **Of the 490: no** — six months would teach one method and one conclusion, that THA is a machine. That asymmetry is what § 4 exists to make permanent.

**What must not break:**
- The 490 stay exactly where `COOKBOOK1` put them. This document is not authority to delete them.
- No meal row changes. No provenance is corrected here — that is a reviewed migration and an owner decision.
- `npm run verify:cookbook-seed` continues to pass, untouched: nothing this document did can affect it.

**Manual test steps:**
1. `git status` — exactly one new file.
2. `npm run verify:cookbook-seed` — passes as before (evidence nothing was touched).
3. Re-run any figure in § 2 against `tha_original_founding_cookbook_500.json` and confirm it reproduces.
4. Open the Cookbook room — identical to its pre-change state.

---

## SCOPE LOCK

**Implemented scope:** one document. An editorial standard (§4), an evidenced review of the existing library (§2), the founding collection identified within it (§5), and a growth path (§6).

**Explicitly excluded — none of this was done, and none of it may be inferred as approved:**
- ❌ No meal written, edited, admitted to, or removed from the database
- ❌ The 490 **not** deleted, **not** re-laned, **not** re-shelved
- ❌ The false `authored` provenance **not** corrected (COOKBOOK1 §8.4 — needs a reviewed migration)
- ❌ The 43 household-copied generated recipes **not** re-shelved (COOKBOOK1 §8.2 — an ownership question)
- ❌ No schema change, no migration, no column added — **explicitly including any `season` column** (§4.5)
- ❌ No route, server logic, client code, component, or token
- ❌ `shared/cookbook/curation.ts` **not** modified; `isGeneratedLibraryName` **not** retired
- ❌ No photography commissioned or sourced
- ❌ No standard enforced in code — §4 is currently governance a person applies, not a gate a machine runs

---

## 12. REMAINING OWNER DECISIONS

Six. Each is the owner's, and this change deliberately took none of them.

**1. Is the founding collection the ten — or are the 490 deleted?**
This document establishes the *criterion* that `COOKBOOK1` §8.1 was missing, and the criterion is unambiguous: the 490 fail five of the ten tests. It stops short of the act. Deletion is irreversible and the planner may hold references. *Recommended:* delete them, and retire the `library` shelf and `isGeneratedLibraryName` in the same change. Keeping 490 rows THA would never admit today, purely because deleting is frightening, is how the next generated batch justifies itself.

**2. Are §4's numeric thresholds right?**
The 25%-under-30-minutes floor, the 15% seasonal floor, the 20% ingredient ceiling, the 15% cuisine ceiling, and the 5.0 distinct-ingredients-per-meal ratio are **editorial judgements, not measurements.** They are calibrated so the ten pass and the 490 fail, which is the correct direction but a sample of one collection. The owner sets them.

**3. Where does the editorial layer live?**
`why_this_works_for_tha`, `cuisine_inspiration`, `prep_minutes`, `cook_minutes` and `difficulty` have no column on `meals` (§2.6), so THA's editorial voice about its own recipes is currently unreadable by any surface. `meal_templates` already carries `cuisine` and `estimated_total_time` — **which means the answer may be that this belongs to an existing store, not a new one.** That question deserves the governance review Rule 8 requires *before* columns are proposed.

**4. Who authors the next 30–50 meals, and to what batch size?**
§6 caps a batch at 25 and forbids unassessed admission. It does not say who assesses. A named human editor is the difference between this standard and the last one.

**5. Photography.**
Unchanged from `COOKBOOK1` §8.3 and still the largest gap: zero images anywhere in the room. §4.10 currently accepts their absence as an honest gap, which is true and not good enough for a founding cookbook.

**6. This file's location.**
Filed at `docs/implementation/cookbook/` per `REPOSITORY_CONVENTIONS.md` §4 rather than the `docs/implementation/` root the mission named (§0). One `git mv` if the owner prefers the named path — noting that the conventions call that location a defect.

---

*The Founding Cookbook was not missing. It was written, and then it was scaled by a machine until it stopped meaning anything. This document does not add a recipe. It adds the gate that scaling walked through — and records that, measured against it, The Healthy Apples currently stands for ten meals rather than five hundred, which is both a smaller number and a far better answer.*

*Rollback: `rollback/FOUNDATION_MEALS1-founding-cookbook-20260720` → `d1088d46`.*
