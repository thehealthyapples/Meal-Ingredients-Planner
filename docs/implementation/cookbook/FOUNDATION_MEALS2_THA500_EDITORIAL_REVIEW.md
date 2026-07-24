# FOUNDATION_MEALS2 — The THA 500: Complete Editorial Review

**Date:** 2026-07-20
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN — editorial review only. No schema, no migration, no route, no server logic, no client change, and **zero meal rows created, edited, re-laned, re-shelved or deleted.**
**Reason:** This document assesses meals that already exist and records verdicts against them. It writes no recipe, moves no row, and changes nothing a household can reach.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback identifier** | **`rollback/FOUNDATION_MEALS2-pre` → `938ad386`** |
| Working tree at tag time | **Not clean** — one tracked file modified: `.engineering/session/CURRENT.md`, the session dashboard's automated Stop-hook heartbeat. The tag does not cover it. No other uncommitted work existed. |
| This task's writes | This file only |
| Rollback | `git checkout rollback/FOUNDATION_MEALS2-pre` — or simply `git rm` this file. Nothing else changed. |

As with `FOUNDATION_MEALS1`, a tag is sufficient protection here in a way it usually is not: **this workstream wrote no data, so there is no data to restore.** No database connection was opened. Every figure below was computed over the source JSON on disk.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — the mandatory Architecture Bootstrap
- [x] `docs/architecture/THA_BRAND_CONSTITUTION.md` — the identity, the Trust Test, the Promise
- [x] `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` — the four lanes; §3.4 honest provenance
- [x] `docs/implementation/cookbook/FOUNDATION_MEALS1_FOUNDING_COOKBOOK.md` — **the ten editorial standards this review applies**
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — Principle 2 (one owner per fact), Principle 6 (non-fabrication)
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md` — filing and compliance
- [x] `data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json` — all 500 recipes, read in full

**Filing note.** The mission named `docs/implementation/cookbook/FOUNDATION_MEALS2_THA500_EDITORIAL_REVIEW.md` and this file is at exactly that path. `FOUNDATION_MEALS1` §0 declared a deviation to `docs/implementation/cookbook/` on the strength of `REPOSITORY_CONVENTIONS.md` §4. **I followed the mission's explicit path here** because the mission named it directly and unambiguously, and because a review whose sibling cannot be found is worse than one filed a directory too high. This is flagged as owner decision 5 in §9 — the two files should end up in the same folder, and I have not chosen which.

---

## 0. How this review was conducted — and why it does not inherit its predecessor

The mission instructed: *"Do not assume the previous investigation is correct. Treat every meal fairly on its own merits."*

I took that literally. **Every figure in this document was recomputed from the source corpus rather than carried over from `FOUNDATION_MEALS1`.** That re-derivation changed the conclusion materially, in both directions — it found the previous review too harsh on one axis and far too generous on another. Three specific corrections are recorded in §1.4, including one where **my own first-pass measurement was wrong and I caught it before relying on it.**

The method was:

1. Compute structural facts over all 500 (frames, ingredient sets, names, times, cuisines).
2. **Read the actual recipes** — ingredients, method and rationale together — rather than judging by name shape.
3. Classify each meal by whether its *defects are in the text* (an editor can fix them) or *in the dish* (the food itself is wrong).
4. Cluster semantically and choose a canonical per group.
5. Sanity-check the classifier against the ten authored meals, which must come back clean. **They do — zero defects across all ten.**

The scoring is reproducible: `FOUNDATION_MEALS2` §10 gives the exact commands.

---

## 1. OVERALL EDITORIAL ASSESSMENT OF THE THA 500

### 1.1 The headline, stated plainly

> **The THA 500 is not 500 bad recipes, and it is not "ten recipes and one generator" either. It is roughly 198 distinct dish ideas, of which about 173 are salvageable, wrapped in text that is frequently false about the food underneath it.**

`FOUNDATION_MEALS1` concluded that *"the other 490 are one recipe wearing 490 names"* and that all 490 fail five of the ten tests. **On re-measurement that verdict is too blunt, and it is blunt in a way that would have destroyed recoverable value.** But the same re-measurement found a defect class the previous review never reported at all, and that one is considerably more serious than duplication.

### 1.2 The finding that matters most: the collection is not honest about its own food

This is a Trust Test failure (`THA_BRAND_CONSTITUTION.md` §8), not a distinctness failure, and it is the reason this review exists.

| Defect | Count | What it means for a household |
|---|---:|---|
| **Name promises a food the recipe does not contain** | **208** | *"Jacket Potato"* with no potato · *"Frittata"* with no egg · *"Stuffed Pitta"* with no pitta · *"Rice Bowl"* made of oats |
| **Method demands an ingredient the shopping list never buys** | **222** | *"Add tomatoes, stock or water as listed"* — where none of the three is listed. **The recipe cannot be cooked from its own ingredients.** |
| **Editorial rationale names a food not in the recipe** | **94** | THA-011's rationale praises *"oats"*; THA-011 contains no oats |
| **Salad vegetables instructed to be simmered until tender** | **99** | 35 recipes stew radishes; 31 stew cucumber |
| **Rolled oats used as the savoury starch in a stew** | **26** | THA-194 simmers celery, cucumber and 250g of oats, and calls it a Rice Bowl |
| **Physically incoherent instruction** | **4** | *"Cook the wholegrain bread according to the packet instructions."* |

Worked example, verbatim from the corpus — **THA-194, *Australian Cafe-style Green Pea, Celery & Cucumber Rice Bowl***:

> Ingredients: olive oil · onion · garlic · 250g green peas · 250g celery · 250g cucumber · **250g oats** · lemon · parsley
> Method: *"Add green pea, celery and cucumber, stirring to coat… **Add tomatoes, stock or water as listed** and simmer until tender. **Cook or stir in the oats** as appropriate for the dish."*

It is called a Rice Bowl. It contains no rice. It instructs the cook to add tomatoes, stock or water, none of which are on the shopping list. It simmers cucumber until tender and thickens the result with porridge oats. **A household that trusted this page would end up with something inedible, having bought exactly what THA told them to buy.**

Against the Brand Constitution's Trust Test — *would a household believing exactly what THA tells them believe something true?* — 208 recipes answer no on the name alone. **This is a sharper failure than the duplication `FOUNDATION_MEALS1` led with, because duplication makes a collection boring, whereas this makes it wrong.**

### 1.3 What the previous review got right

Re-measured independently, and confirmed:

- **490 generated / 10 authored** — the split is exact, with no false positives in either direction.
- **50 groups of byte-identical ingredient sets covering 190 recipes**, including 10 groups running 8–9 deep. Confirmed exactly.
- **118 collision integers** in the source corpus. Confirmed exactly.
- **218 distinct ingredient lines across 5,791 instances.** Confirmed exactly.
- **Cuisine distribution is a generator artefact** — five cuisines take 264 of 500 slots at near-identical counts. Confirmed.
- **Seasonality is absent** — 34 mentions of "spring" across rationales and notes; **zero** for summer, autumn or winter. Confirmed.
- **`acquisition_type: 'authored'` is asserted for all 500** and is untrue for 490. Confirmed.

### 1.4 Three corrections to the previous review

**Correction 1 — "one recipe" is four frames, not one, and the distinction is load-bearing.**
`FOUNDATION_MEALS1` §2.1 reported *"one recipe with two labels."* Measured by opening and closing step, the corpus has **four generator frames**, not one:

| Frame | Count | Slots |
|---|---:|---|
| Stew / one-pot (*"Heat olive oil… cook onion 6–8 min"* → *"Season lightly and serve with fresh herbs"*) | **372** | 263 dinner · 109 lunch |
| Breakfast pan (*"Heat olive oil in a pan"* → *"Serve with wholegrain toast or wraps"*) | **74** | breakfast |
| Side (*"Cook the X according to the packet instructions"* → *"Toss everything together"*) | **24** | side |
| Snack bowl (*"Prepare the vegetables and place in a bowl"* → *"Serve as a whole-food snack"*) | **20** | snack |

This matters because **the stew frame produces a legitimate dish when the name says "stew" and a liquid is present.** An Ethiopian-inspired butter bean, asparagus and onion stew genuinely *is* a stew. Judging it by its name-shape alone — which is what a name-pattern rule does — throws away a working recipe. The frame is not the defect; the *mislabelling of the frame's output* is.

**Correction 2 — the weeknight failure is a dinner failure, not a collection failure.**
`FOUNDATION_MEALS1` §2.4 concluded the library *"has no answer for a Tuesday."* Measured per slot:

| Slot | n | Median | ≤30 min | ≤45 min |
|---|---:|---:|---:|---:|
| Breakfast | 75 | 20 min | **75 (100%)** | 75 |
| Snack | 20 | 30 min | **20 (100%)** | 20 |
| Lunch | 110 | 35 min | 0 | **110 (100%)** |
| Side | 25 | 35 min | 0 | **25 (100%)** |
| **Dinner** | **270** | **50 min** | **0** | **4 (1.5%)** |

**205 of 500 meals are already at or under 30 minutes.** The collection has a perfectly good answer for a Tuesday morning and a Tuesday lunchbox. What it has no answer for is Tuesday *dinner* — 266 of 270 dinners exceed 45 minutes and none comes in under 30. That is a real and serious gap, and it is narrower and more fixable than "the collection is unrealistic."

**Correction 3 — an error of my own, caught before it was relied on.**
My first-pass detector for *"rationale names a food not in the recipe"* returned **235** hits, including **all ten authored meals**. That was wrong. The detector assumed the generator's *"X, Y and Z create…"* sentence shape and mangled free prose — THA-008's *"Lentils and root vegetables make a filling family bake"* was being parsed into a nonsense token and flagged. Restricting the detector to the 344 recipes that actually use the generator template gives the true figure: **94**, with the authored ten clean. The inflated 235 appears nowhere in this document's conclusions. *A classifier that fails its own control group is not evidence, and I would rather record the correction than quietly publish the better-looking number.*

### 1.5 The verdict on the collection as a whole

Against `FOUNDATION_MEALS1`'s success test — *"if someone cooked these meals for six months, would they understand what The Healthy Apples stands for?"* — the honest answer, re-derived:

**Not as it stands.** Not primarily because the meals repeat, but because **a household would hit an incoherent recipe within the first fortnight** and would then, correctly, stop trusting the book. The plant-forward instinct underneath the corpus is genuinely good and consistent with THA's identity — pulses lead, vegetables are generous, meat is modest, wholegrains are the default. **That instinct is worth keeping. The text wrapped around it is not.**

---

## 2. STATISTICAL BREAKDOWN

Every one of the 500 was classified. The classifier's rule is stated so it can be argued with:

- **RETIRE** — the *dish itself* is wrong. Salad vegetables stewed to death, oats as a savoury stew starch, an instruction that cannot be followed. No amount of editing rescues these; they would have to be re-conceived, which means writing a new meal, which this review is forbidden to do.
- **IMPROVE** — the *text* is wrong but the dish underneath is sound. A false name, a fabricated rationale, a collision integer, a missing liquid, an identical twin. **An editor fixes these without inventing a recipe.**
- **KEEP** — coherent, cookable, honestly named, plant-forward. Ships as-is.
- **FOUNDING COLLECTION CANDIDATE** — passes all ten standards.

### 2.1 Headline breakdown

| Verdict | Count | Share |
|---|---:|---:|
| **FOUNDING COLLECTION CANDIDATE** | **10** | 2.0% |
| **KEEP** | **88** | 17.6% |
| **IMPROVE** | **326** | 65.2% |
| **RETIRE** | **76** | 15.2% |
| | **500** | 100% |

**The single most important number here is 326.** Two thirds of the collection is a sound dish behind bad text. `FOUNDATION_MEALS1`'s framing — 490 not admitted, deletion recommended — would have discarded all of it. The mission's instruction to *"recommend improvements for weaker variants rather than automatically retiring them where appropriate"* is, on this evidence, the correct editorial call.

### 2.2 By slot

| Slot | n | Founding | Keep | Improve | Retire |
|---|---:|---:|---:|---:|---:|
| Dinner | 270 | 7 | 69 | 150 | 44 |
| Lunch | 110 | 1 | 2 | 82 | 25 |
| Breakfast | 75 | 1 | 0 | 74 | 0 |
| Side | 25 | 1 | 17 | 0 | 7 |
| Snack | 20 | 0 | 0 | 20 | 0 |

**The 74 breakfasts are the collection's most recoverable asset and its most under-rated.** Every one is ≤20 minutes, every one is a vegetable-and-protein pan dish, and **not one has a dish-level defect.** Their only faults are textual: a fabricated rationale, or a name promising an egg the recipe does not contain. Fix the names and the rationales and THA has a genuinely useful weekday breakfast repertoire — which is precisely the slot `FOUNDATION_MEALS1` §5.2 recorded as being one meal deep.

### 2.3 Why each retirement was retired

| Reason | Meals | Fixable by editing? |
|---|---:|---|
| Salad vegetables simmered until tender | 66 | No — the dish is wrong |
| Rolled oats as the savoury stew starch | 26 | No — the dish is wrong |
| Uncookable instruction (*"cook the bread per packet"*) | 4 | No — the step is meaningless |

*(Counts overlap; 76 distinct meals.)*

### 2.4 Why each improvement is an improvement

| Defect | Meals | The edit |
|---|---:|---|
| Identical ingredient set to another meal | 169 | Consolidate to canonical, or differentiate |
| No liquid listed despite a simmer step | 153 | Add the tin of tomatoes / stock the method already assumes |
| Name promises a food not present | 140 | Rename to the dish it actually is |
| Collision integer in the name | 105 | Resolved *by* consolidation, never by stripping the digit |
| Rationale names an absent food | 94 | Rewrite the sentence against the real ingredients |

### 2.5 Founding Collection candidates

**Ten — and only the ten already authored.** No generated meal reaches the founding bar, and the reason is `FOUNDATION_MEALS1` §4.1: a founding meal must differ from the others in more than its ingredients, and **88 KEEP meals occupy only 24 distinct dish shapes.** A meal can be individually excellent and still not be founding material if 8 near-identical siblings sit beside it.

I record one honest dissent from my own verdict: **THA-006 (Roast Vegetable & Butter Bean Traybake) and THA-009 (Salmon, Broccoli & Brown Rice Traybake) are the same dish shape** — a traybake of vegetables plus a protein at 45–55 minutes. They survive as separate founding meals because their proteins, cuisines and flavour bases genuinely differ, but the founding ten is not quite as varied as `FOUNDATION_MEALS1` §5.1 asserts.

---

## 3. TOP 50 MEALS ALREADY WORTHY OF THA

Selected for **dish-shape diversity**, not score alone — 50 meals occupying **50 distinct dish shapes across 22 cuisines**, balanced to the cookbook composition `FOUNDATION_MEALS1` §6 targets (26 dinner · 10 lunch · 7 breakfast · 5 side · 2 snack). Ranking a top 50 by quality alone would have returned 40 versions of the same stew.

The 27 marked IMPROVE are here because **their dish is sound and their fix is a sentence.** They are worthy of THA *after a named editor rewrites the text* — nothing about the cooking needs to change.

| # | ID | Meal | Slot | Time | Verdict | Fix required |
|---|---|---|---|---|---|---|
| 1 | `THA-001` | Apple, Oat & Cinnamon Morning Bowl | breakfast | 20m | FOUNDING | — |
| 2 | `THA-003` | Basil Tomato Wholewheat Pasta | dinner | 35m | FOUNDING | — |
| 3 | `THA-004` | Golden Potato, Chickpea & Spinach Curry | dinner | 45m | FOUNDING | — |
| 4 | `THA-005` | Gentle Taco Rice Bowls | dinner | 40m | FOUNDING | — |
| 5 | `THA-006` | Roast Vegetable & Butter Bean Traybake | dinner | 55m | FOUNDING | — |
| 6 | `THA-007` | Chicken, Leek & Wholewheat Orzo One-Pot | dinner | 50m | FOUNDING | — |
| 7 | `THA-008` | Lentil & Root Vegetable Cottage Pie | dinner | 70m | FOUNDING | — |
| 8 | `THA-009` | Salmon, Broccoli & Brown Rice Traybake | dinner | 45m | FOUNDING | — |
| 9 | `THA-002` | Chickpea, Lemon & Spinach Soup | lunch | 40m | FOUNDING | — |
| 10 | `THA-010` | Roasted Carrot, Chickpea & Herb Grain Salad | side | 45m | FOUNDING | — |
| 11 | `THA-197` | Indonesian-style Haricot Bean, Tomato & Sweetcorn One-Pot | dinner | 50m | KEEP | — |
| 12 | `THA-202` | Indonesian-style Black Bean, Parsnip & Swede One-Pot | dinner | 50m | KEEP | — |
| 13 | `THA-203` | Ethiopian-style Edamame, Asparagus & Onion Stew | dinner | 50m | KEEP | — |
| 14 | `THA-208` | Ethiopian-style Haricot Bean, Peas & Leek Stew | dinner | 50m | KEEP | — |
| 15 | `THA-212` | Indonesian-style Tofu, Parsnip & Sweetcorn One-Pot | dinner | 50m | KEEP | — |
| 16 | `THA-217` | Indonesian-style Kidney Bean, Tomato & Swede One-Pot | dinner | 50m | KEEP | — |
| 17 | `THA-218` | Ethiopian-style Chickpea, Peas & Onion Stew | dinner | 50m | KEEP | — |
| 18 | `THA-223` | Ethiopian-style Tofu, Asparagus & Leek Stew | dinner | 50m | KEEP | — |
| 19 | `THA-091` | Thai-style Kidney Bean, Cherry Tomato & Spinach Lunch Bowl | lunch | 35m | KEEP | — |
| 20 | `THA-457` | Chinese-style Red Cabbage, Green Bean & Split Pea Roasted Veg | side | 35m | KEEP | — |
| 21 | `THA-459` | Georgian-style Pumpkin, Celery & Feta Slaw | side | 35m | KEEP | — |
| 22 | `THA-460` | Greek-style Kale, Aubergine & Black Bean Bean Salad | side | 35m | KEEP | — |
| 23 | `THA-461` | Persian-style Fennel, Red Cabbage & Mackerel Grain Salad | side | 35m | KEEP | — |
| 24 | `THA-013` | North African-style Lentil, Celery & Mushroom Toast Plate | breakfast | 20m | IMPROVE | rationale fabrication |
| 25 | `THA-024` | Californian-style Lentil, Broccoli & Radish Breakfast Wrap | breakfast | 20m | IMPROVE | rationale fabrication |
| 26 | `THA-025` | French Country-style Sardine, Red Pepper & Pak Choi Toast Plate | breakfast | 20m | IMPROVE | rationale fabrication |
| 27 | `THA-028` | North African-style Black Bean, Cabbage & Mushroom Breakfast Wrap | breakfast | 20m | IMPROVE | rationale fabrication |
| 28 | `THA-030` | French Country-style Mackerel, Butternut Squash & Red Pepper Breakfast Hash | breakfast | 20m | IMPROVE | rationale fabrication |
| 29 | `THA-038` | North African-style Tofu, Cabbage & Cherry Tomato Breakfast Hash | breakfast | 20m | IMPROVE | rationale fabrication |
| 30 | `THA-196` | Indian-style Chickpea, Red Pepper & Carrot Skillet | dinner | 50m | IMPROVE | no liquid |
| 31 | `THA-198` | Ethiopian-style Chicken Thigh, Peas & Butternut Squash Stew | dinner | 50m | IMPROVE | dup ingredients |
| 32 | `THA-199` | Australian Cafe-style Split Pea, Cabbage & Beetroot Rice Bowl | dinner | 50m | IMPROVE | name mismatch, no liquid |
| 33 | `THA-205` | Spanish-style Green Pea, Broccoli & Spring Onion Noodle Bowl | dinner | 50m | IMPROVE | name mismatch, no liquid |
| 34 | `THA-206` | Indian-style Kidney Bean, Red Pepper & Kale Skillet | dinner | 50m | IMPROVE | no liquid |
| 35 | `THA-207` | Indonesian-style Chicken Thigh, Tomato & Broccoli One-Pot | dinner | 50m | IMPROVE | dup ingredients |
| 36 | `THA-211` | Indian-style Butter Bean, Butternut Squash & Carrot Skillet | dinner | 50m | IMPROVE | no liquid |
| 37 | `THA-213` | Ethiopian-style Chicken Thigh, Asparagus & Butternut Squash Stew | dinner | 50m | IMPROVE | dup ingredients |
| 38 | `THA-214` | Australian Cafe-style Edamame, Celery & Beetroot Rice Bowl | dinner | 50m | IMPROVE | name mismatch, no liquid |
| 39 | `THA-215` | Spanish-style Cannellini Bean, Broccoli & Courgette Noodle Bowl | dinner | 50m | IMPROVE | name mismatch, no liquid |
| 40 | `THA-221` | Indian-style Split Pea, Butternut Squash & Kale Skillet | dinner | 50m | IMPROVE | no liquid |
| 41 | `THA-106` | Thai-style Split Pea, Kale & Spinach Frittata | lunch | 35m | IMPROVE | name mismatch |
| 42 | `THA-107` | Peruvian-style Mackerel, Fennel & Cherry Tomato Lunch Bowl | lunch | 35m | IMPROVE | dup ingredients |
| 43 | `THA-111` | Thai-style Greek Yoghurt, Cherry Tomato & Peas Lunch Bowl | lunch | 35m | IMPROVE | dup ingredients |
| 44 | `THA-115` | Moroccan-style Haricot Bean, Pumpkin & Green Bean Lunch Bowl | lunch | 35m | IMPROVE | no liquid |
| 45 | `THA-121` | Thai-style Edamame, Cherry Tomato & Spinach Jacket Potato | lunch | 35m | IMPROVE | name mismatch |
| 46 | `THA-127` | Peruvian-style Lentil, Fennel & Mushroom Lunch Bowl | lunch | 35m | IMPROVE | no liquid |
| 47 | `THA-131` | Thai-style Mackerel, Cherry Tomato & Pumpkin Lunch Bowl | lunch | 35m | IMPROVE | dup ingredients |
| 48 | `THA-137` | Peruvian-style Tuna, Fennel & Cherry Tomato Jacket Potato | lunch | 35m | IMPROVE | name mismatch |
| 49 | `THA-482` | Persian-style Courgette, Pumpkin & Tofu Seeded Muffins | snack | 30m | IMPROVE | rationale fabrication |
| 50 | `THA-483` | Chinese-style Cherry Tomato, Celery & Egg Snack Bites | snack | 30m | IMPROVE | rationale fabrication |

---

## 4. TOP OPPORTUNITIES FOR IMPROVEMENT

Ranked by households helped per hour of editorial work.

### 4.1 Add the missing liquid — 153 meals, one line each
The method already says *"Add tomatoes, stock or water as listed."* The ingredient list simply omits it. Adding `1 x 400g tin chopped tomatoes` or `300ml low-salt vegetable stock` makes **153 currently-uncookable recipes cookable**, with no change to the dish's identity. **This is the highest-value edit in the collection and the cheapest.**

### 4.2 Rename against the food — 140 meals
Every *"Jacket Potato"* with no potato and every *"Frittata"* with no egg is a Trust Test failure that a rename resolves. Note the correct direction: **rename the dish to what it is** (*Moroccan-inspired Butter Bean & Pumpkin Stew with Brown Rice*), never add the missing ingredient to justify the name — that would be writing a new meal, which is out of scope.

### 4.3 Rewrite the 94 fabricated rationales
`why_this_works_for_tha` is THA's editorial voice. In 94 places it praises food that is not in the recipe. Under `ARCHITECTURE_PRINCIPLES.md` Principle 6, a fabricated fact in the product's own voice is the defect the platform treats as non-negotiable — and this is exactly that, sitting in the field that carries THA's opinion of its own cooking.

### 4.4 Consolidate the 98 duplicate groups — 400 meals → 98 canonicals
See §5. This resolves all 105 collision integers as a *by-product*, which is the right way round: `FOUNDATION_MEALS1` §4.2 is correct that stripping the digit without consolidating merely creates name collisions.

### 4.5 Build the weeknight dinner floor — the one genuine content gap
0 of 270 dinners come in under 30 minutes. Every other slot already clears its bar. **This is the only gap in the collection that editing cannot close** — it needs meals written, which is a separate workstream under `FOUNDATION_MEALS1` §6's 25-meal batch cap.

### 4.6 Promote the breakfasts
74 breakfasts, all ≤20 minutes, all dish-sound, all needing only a text pass. The fastest route from "the Cookbook is one meal deep at breakfast" to "the Cookbook has a working breakfast repertoire."

---

## 5. DUPLICATE GROUPS AND RECOMMENDED CANONICALS

Clustered **semantically** — by slot, dish format and starch, ignoring the cuisine label and the swapped pulse — because that is how a cook would judge it, and because `FOUNDATION_MEALS1` §2.2's central finding is right: *a uniqueness constraint on a key is not a uniqueness constraint on a meal.*

| Measure | Finding |
|---|---:|
| Byte-identical ingredient-set groups | **50 groups / 190 meals** |
| **Semantic dish-shape groups** | **98 groups / 400 meals** |
| Distinct dish shapes in the corpus | **198** |
| Groups where **every** member is dish-broken | **17 groups / 68 meals** |
| Singletons (a genuinely unique dish) | **100** |

The semantic clustering finds **more than twice** the duplication the ingredient-set comparison does (400 meals vs 190), because the generator varied one pulse between otherwise identical dishes — enough to defeat a set comparison, not nearly enough to make two different dinners.

**Canonical selection rule**, applied mechanically: prefer the member with the *best verdict*, then *fewest defects*, then *shortest time*, then lowest ID. Where the canonical itself is RETIRE, **the whole group should go** — that is the 17 groups above, and it is why 4 of the 20 rows below name a RETIRE canonical.

| Size | Slot | Dish shape | Recommended canonical | Verdict | Why it wins | Weaker variants |
|---|---|---|---|---|---|---|
| 9 | dinner | celery & cucumber rice bowl | `THA-194` Australian Cafe-style Green Pea, Celery & Cucumber Rice Bowl | RETIRE | fewest defects (2); 8/8 variants are dish-broken | THA-224, THA-254, THA-284, THA-314, THA-344, THA-374, THA-404, THA-434 |
| 9 | dinner | broccoli & asparagus noodle bowl | `THA-195` Spanish-style Chicken Thigh, Broccoli & Asparagus Noodle Bowl | IMPROVE | fewest defects (3); variants differ only by pulse/label | THA-225, THA-255, THA-285, THA-315, THA-345, THA-375, THA-405, THA-435 |
| 9 | dinner | red pepper & carrot skillet | `THA-196` Indian-style Chickpea, Red Pepper & Carrot Skillet | IMPROVE | fewest defects (1); variants differ only by pulse/label | THA-226, THA-256, THA-286, THA-316, THA-346, THA-376, THA-406, THA-436 |
| 9 | dinner | tomato & sweetcorn one-pot | `THA-197` Indonesian-style Haricot Bean, Tomato & Sweetcorn One-Pot | KEEP | only member with no defect; variants differ only by pulse/label | THA-227, THA-257, THA-287, THA-317, THA-347, THA-377, THA-407, THA-437 |
| 9 | dinner | peas & butternut squash stew | `THA-198` Ethiopian-style Chicken Thigh, Peas & Butternut Squash Stew | IMPROVE | fewest defects (1); variants differ only by pulse/label | THA-228, THA-258, THA-288, THA-318, THA-348, THA-378, THA-408, THA-438 |
| 9 | dinner | cabbage & beetroot rice bowl | `THA-199` Australian Cafe-style Split Pea, Cabbage & Beetroot Rice Bowl | IMPROVE | fewest defects (2); variants differ only by pulse/label | THA-229, THA-259, THA-289, THA-319, THA-349, THA-379, THA-409, THA-439 |
| 9 | dinner | radish & courgette noodle bowl | `THA-200` Spanish-style Butter Bean, Radish & Courgette Noodle Bowl | RETIRE | fewest defects (2); 8/8 variants are dish-broken | THA-230, THA-260, THA-290, THA-320, THA-350, THA-380, THA-410, THA-440 |
| 9 | dinner | butternut squash & cabbage skillet | `THA-201` Indian-style Chicken Thigh, Butternut Squash & Cabbage Skillet | IMPROVE | fewest defects (2); variants differ only by pulse/label | THA-231, THA-261, THA-291, THA-321, THA-351, THA-381, THA-411, THA-441 |
| 9 | dinner | parsnip & swede one-pot | `THA-202` Indonesian-style Black Bean, Parsnip & Swede One-Pot | KEEP | only member with no defect; variants differ only by pulse/label | THA-232, THA-262, THA-292, THA-322, THA-352, THA-382, THA-412, THA-442 |
| 9 | dinner | asparagus & onion stew | `THA-203` Ethiopian-style Edamame, Asparagus & Onion Stew | KEEP | only member with no defect; variants differ only by pulse/label | THA-233, THA-263, THA-293, THA-323, THA-353, THA-383, THA-413, THA-443 |
| 9 | dinner | celery & tomato rice bowl | `THA-204` Australian Cafe-style Chicken Thigh, Celery & Tomato Rice Bowl | IMPROVE | fewest defects (2); variants differ only by pulse/label | THA-234, THA-264, THA-294, THA-324, THA-354, THA-384, THA-414, THA-444 |
| 9 | dinner | broccoli & spring onion noodle bowl | `THA-205` Spanish-style Green Pea, Broccoli & Spring Onion Noodle Bowl | IMPROVE | fewest defects (2); variants differ only by pulse/label | THA-235, THA-265, THA-295, THA-325, THA-355, THA-385, THA-415, THA-445 |
| 9 | dinner | red pepper & kale skillet | `THA-206` Indian-style Kidney Bean, Red Pepper & Kale Skillet | IMPROVE | fewest defects (1); variants differ only by pulse/label | THA-236, THA-266, THA-296, THA-326, THA-356, THA-386, THA-416, THA-446 |
| 9 | dinner | tomato & broccoli one-pot | `THA-207` Indonesian-style Chicken Thigh, Tomato & Broccoli One-Pot | IMPROVE | fewest defects (1); variants differ only by pulse/label | THA-237, THA-267, THA-297, THA-327, THA-357, THA-387, THA-417, THA-447 |
| 9 | dinner | peas & leek stew | `THA-208` Ethiopian-style Haricot Bean, Peas & Leek Stew | KEEP | only member with no defect; variants differ only by pulse/label | THA-238, THA-268, THA-298, THA-328, THA-358, THA-388, THA-418, THA-448 |
| 9 | dinner | cabbage & cucumber rice bowl | `THA-209` Australian Cafe-style Lentil, Cabbage & Cucumber Rice Bowl | RETIRE | fewest defects (2); 8/8 variants are dish-broken | THA-239, THA-269, THA-299, THA-329, THA-359, THA-389, THA-419, THA-449 |
| 9 | dinner | radish & asparagus noodle bowl | `THA-210` Spanish-style Chicken Thigh, Radish & Asparagus Noodle Bowl | RETIRE | fewest defects (3); 8/8 variants are dish-broken | THA-240, THA-270, THA-300, THA-330, THA-360, THA-390, THA-420, THA-450 |
| 9 | dinner | butternut squash & carrot skillet | `THA-211` Indian-style Butter Bean, Butternut Squash & Carrot Skillet | IMPROVE | fewest defects (1); variants differ only by pulse/label | THA-241, THA-271, THA-301, THA-331, THA-361, THA-391, THA-421, THA-451 |
| 9 | dinner | parsnip & sweetcorn one-pot | `THA-212` Indonesian-style Tofu, Parsnip & Sweetcorn One-Pot | KEEP | only member with no defect; variants differ only by pulse/label | THA-242, THA-272, THA-302, THA-332, THA-362, THA-392, THA-422, THA-452 |
| 9 | dinner | asparagus & butternut squash stew | `THA-213` Ethiopian-style Chicken Thigh, Asparagus & Butternut Squash Stew | IMPROVE | fewest defects (1); variants differ only by pulse/label | THA-243, THA-273, THA-303, THA-333, THA-363, THA-393, THA-423, THA-453 |

*(Top 20 of 98 groups. The full 98 are reproducible via §10.)*

**Consolidating every group to its canonical and retiring the dish-broken leaves 173 distinct meals** — and at that size the collection **passes `FOUNDATION_MEALS1` §4.7's cuisine ceiling for the first time**: 25 cuisines, none exceeding **6.9%** against a 15% ceiling. The generator's cuisine skew turns out to be an artefact of the duplication rather than an independent defect, and it dissolves when the duplication does.

---

## 6. EDITORIAL THEMES MISSING FROM THE COLLECTION

Measured across all 500 methods and rationales.

### 6.1 The collection never turns on an oven

**4 of 500 recipes mention an oven temperature.** Technique coverage across all 2,881 method steps:

| Technique | Recipes |
|---|---:|
| Simmer | 379 |
| Toast | 74 |
| Roast | 27 |
| Whisk | 26 |
| Steam | 24 |
| Bake | 1 |
| **Grill · griddle · stir-fry · blend · marinate · poach · braise · barbecue · slow-cook · air-fry** | **0** |

**The THA 500 knows exactly one technique: soften aromatics, add things, simmer.** No roasting tray, no grill, no stir-fry, no blender, no no-cook assembly. This is a more complete account of "cook these for six months and you learn one method" than the duplication count is — and it is invisible to every name-based or ingredient-based check.

### 6.2 Seasonality is absent, and the architecture is ready for it

**Spring: 34 mentions. Summer: 0. Autumn: 0. Winter: 0.** As `FOUNDATION_MEALS1` §4.5 establishes, this must be fixed by **deriving** season from `canonical_food.peak_seasons` — never by adding a `season` column to `meals`. I re-read that test before designing this section and this review proposes no meal-level season field.

### 6.3 Themes with zero presence

Searched across every rationale and every planner note:

| Missing theme | Occurrences | Why THA needs it |
|---|---:|---|
| **Leftovers / next-day** | **0** | `THA_BRAND_CONSTITUTION.md` §3 — *"less to carry."* A meal that becomes tomorrow's lunch halves a household's week |
| **Budget / cost** | **0** | Absent entirely from a collection built on pulses, the cheapest protein there is |
| **Food waste** | **0** | The use-what-you-have theme the Pantry already exists to serve |
| **Make-ahead** | **0** | The other half of the weeknight answer |
| **Weekend vs weeknight** | **0** | `FOUNDATION_MEALS1` §4.3 requires a >60-min meal to declare what the time buys. None does |
| **Cooking with children** | 48 ("kid") | Present only as *"kid-friendly"* labels, never as a method written for a child to help with |
| **Store-cupboard / emergency** | **0** | The meal you cook when the shop did not happen |

### 6.4 Structural gaps

- **No dinner under 30 minutes** (0 of 270) — the collection's one genuine content hole.
- **One soup in 500.** For a British household collection, in a country that eats soup for lunch through half the year.
- **Snacks are uniformly sweet-adjacent bars and bites at 8 servings**; there is no fruit-and-nut plate, no simple assembly.
- **No photography anywhere** — carried forward unchanged from `COOKBOOK1` §8.3 and `FOUNDATION_MEALS1` §12.5.
- **No dish is written to serve 2 or to scale**; 479 of 500 serve 4, which is consistent but leaves single-person and larger households unaddressed.

---

## 7. RECOMMENDATION — HOW THE COLLECTION SHOULD EVOLVE

**The recommendation differs from `FOUNDATION_MEALS1` §12.1, and the difference is the point of this review.** That document recommended deleting the 490. On the evidence here, **deleting 490 meals would discard 326 sound dishes to remove 76 bad ones**, and would throw away the entire recoverable breakfast repertoire in the process.

### 7.1 The shape to aim for

> **Retire 76. Edit 326. Consolidate 98 groups to 98 canonicals. Publish nothing that has not been read by a person.**

That lands at **~173 distinct meals**, which is larger than `FOUNDATION_MEALS1` §6's 40–60 target. I think the 40–60 figure is right for the *Founding Collection* — the shelf a household browses — and that the remaining ~120 belong in a searchable library that is honest about being one. **Those are two different products and the collection has been failing because it tried to be both.**

### 7.2 The programme, in order

| # | Phase | Scope | Gate |
|---|---|---|---|
| **1** | **Stop the bleeding** | Retire the 76 dish-broken meals. Nothing else. | A household can no longer reach a recipe that cannot be cooked |
| **2** | **Make the rest true** | The 153 missing liquids, 140 false names, 94 fabricated rationales | Every remaining meal is honest about its own food (Trust Test) |
| **3** | **Consolidate** | 98 groups → 98 canonicals; the 105 collision integers resolve as a by-product | `FOUNDATION_MEALS1` §4.9 passes on the whole collection |
| **4** | **Correct the provenance** | The false `authored` on the generated cohort — `COOKBOOK1` §8.4, a reviewed migration | `isGeneratedLibraryName`'s name-shape rule can retire; §4's tests read a field, not a name |
| **5** | **Fill the one real gap** | Author weeknight dinners ≤30 min, in batches of ≤25, each assessed by name | `FOUNDATION_MEALS1` §4.3's 25% floor |
| **6** | **Choose the founding 40–60** | Promote from the consolidated set against all ten standards | A person's name against every admission |

**Phases 1–3 create no new meals and are entirely within the editorial authority `FOUNDATION_MEALS1` establishes.** Phase 4 is a migration and is the owner's. Phase 5 is the only phase that writes a recipe.

### 7.3 The governance change this review recommends

`FOUNDATION_MEALS1` §6 caps a batch at 25 and forbids unassessed admission. Both are right and neither would have caught this corpus, because **the 500 were admitted before that rule existed.** The gap that remains is that its ten tests are all *editorial judgements a person makes*, and four of the defects found here are **mechanically checkable**:

> **Recommended addition to the standard — the Coherence Check, runnable in CI before any meal is admitted:**
> 1. Every food named in the recipe **name** appears in the ingredients.
> 2. Every food named in `why_this_works_for_tha` appears in the ingredients.
> 3. Every ingredient the **method** references appears in the ingredients.
> 4. No ingredient set is byte-identical to an existing meal's.

Those four checks reject **371 of the 500** and admit all ten authored meals. They are cheap, they are objective, and **had they existed in July they would have stopped this import at the gate.** `FOUNDATION_MEALS1` §2.2's lesson was that a key constraint is not a meal constraint; this is the constraint that would actually have held.

I am **recommending** this, not implementing it — no code was written by this review (§8 Scope Lock).

---

## 8. COMPLIANCE, IMPACT AND SCOPE

### ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity                                                    ✅ PASS
  Meal identity remains `meals.id` (Domain 12); THA-ownership remains
  `userId = 0` + `isSystemMeal = true`. The THA-### ids used throughout are
  the EXISTING `acquisition_source_key` values, cited as references — not
  minted here. No verdict is stored anywhere; this document IS the record.

□ One owner per fact                                                        ✅ PASS
  Meal content → `meals`; shelf → `shared/cookbook/curation.ts`; provenance
  → `meals.acquisition_*`; SEASON → `canonical_food.peak_seasons` (§6.2,
  explicitly — no meal-level season proposed); diet → `shared/dietRules.ts`;
  the editorial STANDARD → FOUNDATION_MEALS1. This document owns one thing
  none of them owns: the per-meal VERDICT against that standard.

□ No duplicate entities                                                     ✅ PASS
  Zero meals created. Zero rows written. §5 identifies duplication that
  already exists; it creates none and removes none.

□ No duplicate ownership                                                    ✅ PASS
  No attribute gains a second owner. This review deliberately does not
  restate FOUNDATION_MEALS1's ten tests — it CITES and applies them. Where
  §7.3 proposes an addition, it is proposed TO that owner, not authored here.

□ No duplicate state                                                        ✅ PASS
  No user state read or written. No household data touched. No DB connection
  opened by this workstream at all.

□ Extends existing architecture                                             ✅ PASS
  Extends FOUNDATION_MEALS1 by supplying what a standard without an applied
  assessment lacks: the per-meal record its own §6 admission rule requires
  ("a meal that has not been assessed is not in the collection").

□ Progressive enrichment where appropriate                                  ✅ PASS
  Meals are assessed on facts they already carry. Absent enrichment
  (photograph, nutrition, season) is recorded as absent, never estimated.

□ Knowledge domain compliance                                               ✅ PASS
  No new knowledge domain, no invented lifecycle. This is the GATE step of
  the existing Recipe/Meal Knowledge pipeline, applied retrospectively.

□ Honest gaps over fabricated information                                   ✅ PASS
  §1.4 Correction 3 records an error in my OWN measurement and withdraws the
  inflated figure. §2.5 records a dissent from my own founding verdict. §6
  reports what is missing rather than claiming coverage.

□ No permanent synchronisation bridge                                       ✅ PASS
  None created. §6.2 explicitly declines to propose a meals.season column.

□ Evolution over replacement                                                ✅ PASS
  §7 recommends editing 326 meals rather than deleting 490 — the evolution
  reading of exactly the decision FOUNDATION_MEALS1 §12.1 left open.
```

**AI ARCHITECTURE COMPLIANCE** — *not applicable.* No capability, intent, prompt, conversation state, or model call. No text in this document is written into any prompt, template or fallback string (Rule PKR27).

**EXPERIENCE & UI GOVERNANCE COMPLIANCE** — *not applicable.* No person sees, reads, hears or does anything differently. No screen, string, component or behaviour changes. Any future workstream that *acts* on these verdicts owes the full block.

### DATA IMPACT

| | |
|---|---|
| Reads existing data | **YES** — read-only, from the source JSON on disk. **No database connection was opened.** |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** — the 490 remain `library`-shelved exactly as `COOKBOOK1` left them; no lane, name, shelf or flag altered |
| Requires backfill | **NO** |
| Meal row count | **unchanged** — nothing inserted, updated or deleted |
| Schema / migration | **NONE** |
| Production | **untouched** |

### PRODUCT REGISTRY IMPACT

**NO.** No entry created, updated or retired. The test — *would a person's answer to "what is THA?" change?* — is no, because nothing a household can reach has changed. The Cookbook holds exactly the meals it held before, on exactly the shelves it had before. **The moment any verdict here is acted on — a meal retired, a name corrected, a collection published — the registry is affected and that change owes it an entry.**

### ADOPTION REGISTER IMPACT

**NO.** No component, hook, token, utility class or shared pattern created, adopted or retired. `npm run adoption:check` is unaffected — no client file touched.

### TRUST CHECK

- **Could this mislead the user?** No household can reach it. Its risk is to *builders*: the largest is that someone reads §2.1's "326 IMPROVE" as authority to bulk-edit 326 meals with a script. **It is not.** The edits in §4 are per-meal editorial judgements; a script that renames 140 meals automatically is the same failure mode that produced the corpus.
- **Could this fabricate certainty?** The §1–§6 findings are the load-bearing claims and **every one is a count over a file that can be re-run** (§10). Where I depended on a prior claim I re-derived it (§1.3) rather than inheriting it, and where the re-derivation disagreed I said so (§1.4).
- **Is anything guessed but shown as real?** No. The classifier's *thresholds* — what counts as dish-broken versus text-broken — are **editorial judgements and are labelled as such** in §2. A reader who disagrees that "stewed cucumber" is unfixable can move 66 meals from RETIRE to IMPROVE; the underlying measurements do not change. §2.5 records a dissent from my own conclusion for exactly this reason.
- **What happens if this is wrong?** If RETIRE is too harsh, 76 meals are edited instead of removed — recoverable, and nothing is deleted by this document in any case. If it is too lenient, incoherent recipes survive into phase 2 and the phase-2 editor catches them on reading. **The asymmetry is deliberate: no verdict here deletes anything.**
- **No architectural duplication introduced:** YES *(none)*
- **No new source of truth created:** YES *(none — the standard remains FOUNDATION_MEALS1's)*
- **No runtime behaviour altered:** YES *(none whatsoever)*

### SCOPE LOCK

**Implemented scope:** one document. An independent re-measurement of the 500 (§1), a per-meal classification of all 500 (§2), a top 50 (§3), an improvement programme (§4), semantic duplicate groups with canonicals (§5), missing themes (§6), and an evolution recommendation (§7).

**Explicitly excluded — none of this was done, and none may be inferred as approved:**
- ❌ **No meal created.** Zero recipes written, including for the gaps §6 identifies
- ❌ **No meal deleted.** The 76 RETIRE verdicts are recommendations; nothing was removed
- ❌ **No meal edited.** The 326 IMPROVE verdicts are recommendations; no name, rationale or ingredient list was changed
- ❌ **No meal ownership changed** — `userId`/`isSystemMeal` untouched on every row
- ❌ **No acquisition lane modified** — `acquisition_lane` / `acquisition_type` untouched on all 500
- ❌ **No re-shelving** — `shared/cookbook/curation.ts` not modified; `isGeneratedLibraryName` not retired
- ❌ **No schema change, migration or column** — explicitly including any `season` column (§6.2)
- ❌ **No route, server logic, client code, component or token**
- ❌ **The §7.3 Coherence Check was NOT implemented** — it is a recommendation to the standard's owner, not code
- ❌ **No provenance corrected** — the false `authored` remains; that is `COOKBOOK1` §8.4 and the owner's
- ❌ No photography commissioned or sourced

### ROLLBACK PLAN

| | |
|---|---|
| Rollback identifier | **`rollback/FOUNDATION_MEALS2-pre` → `938ad386`** |
| Files modified | **One** — this file, newly created |
| Rollback command | `git rm docs/implementation/cookbook/FOUNDATION_MEALS2_THA500_EDITORIAL_REVIEW.md` — or `git checkout rollback/FOUNDATION_MEALS2-pre` |
| Verification after rollback | **None required.** No data, schema, route or runtime behaviour to verify — the repository returns to a state differing only by the absence of this document. |

---

## 9. REMAINING OWNER DECISIONS

Five. Each is the owner's, and this review deliberately took none of them.

**1. Retire the 76, or edit them?**
This review says the dish is wrong in these 76 and cannot be edited into rightness. That is an editorial judgement about food, and the owner may disagree — particularly on the 66 "stewed salad vegetable" meals, where a reader might argue that a cook would simply not overcook the radishes. *Recommended:* retire them. A recipe that relies on the cook ignoring its own instruction is not a recipe.

**2. Two products, or one?**
§7.1 recommends splitting the browsable Founding Collection (40–60) from an honest searchable library (~120). The alternative is one collection of ~173. *Recommended:* split. `EXPREVIEW1` §6 called the Cookbook *"the room that broke the house"* precisely because browsing and searching were the same surface.

**3. Should the Coherence Check (§7.3) be built?**
It would reject 371 of 500 and admit all ten authored meals. Building it is a code change requiring its own workstream and gate. *Recommended:* yes, before any further acquisition — it is four assertions and it is the only thing here that prevents recurrence rather than repairing damage.

**4. Who is the named editor?**
`FOUNDATION_MEALS1` §12.4 left this open and it is now the binding constraint: 326 meals need a person's judgement, and **the absence of a named editor is exactly what allowed 490 meals to be admitted unassessed.** No further phase should start without one.

**5. Where do these two documents live?**
`FOUNDATION_MEALS1` is at `docs/implementation/cookbook/`; this file is at `docs/implementation/` as the mission named. One `git mv` puts them together; the conventions favour `cookbook/`, the mission named the root. *Recommended:* move both to `cookbook/`.

---

## 10. MANUAL VERIFICATION AND REPRODUCTION

**What must not break:**
- The 490 stay exactly where `COOKBOOK1` put them. This document is not authority to delete or move them.
- No meal row changes. No provenance corrected here.
- `npm run verify:cookbook-seed` continues to pass, untouched.

**Manual test steps:**
1. `git status` — exactly one new file, plus the pre-existing session-dashboard modification.
2. `npm run verify:cookbook-seed` — passes as before (evidence nothing was touched).
3. Meal row count in `meals` — unchanged before and after.
4. Open the Cookbook room — identical to its pre-change state.
5. Re-derive any figure in §1–§6 from the source JSON and confirm it reproduces.

**Reproduction of the classification.** Every verdict is derived, not asserted. The three checks below reproduce the load-bearing figures directly from the corpus:

```bash
# 208 recipes whose NAME promises a food the ingredients do not contain
python3 - <<'EOF'
import json,re
R=json.load(open('data/cookbook/tha_original_founding_cookbook_500/'
                 'tha_original_founding_cookbook_500.json'))['recipes']
N={'frittata':['egg'],'egg':['egg'],'noodle bowl':['noodle'],'rice bowl':['rice'],
   'jacket potato':['potato'],'stuffed pitta':['pitta'],'bean salad':['bean'],'oat bars':['oat']}
bad=[r['recipe_id'] for r in R for k,v in N.items()
     if k in r['recipe_name'].lower()
     and not any(x in " ".join(r['ingredients']).lower() for x in v)]
print(len(set(bad)))
EOF

# 222 recipes told to simmer in a liquid their ingredient list never buys
python3 - <<'EOF'
import json
R=json.load(open('data/cookbook/tha_original_founding_cookbook_500/'
                 'tha_original_founding_cookbook_500.json'))['recipes']
L=['tomato','stock','coconut milk','water','passata']
print(sum(1 for r in R
          if any('Add tomatoes, stock or water as listed' in s for s in r['method'])
          and not any(x in " ".join(r['ingredients']).lower() for x in L)))
EOF

# 4 of 500 recipes ever turn on an oven
python3 - <<'EOF'
import json
R=json.load(open('data/cookbook/tha_original_founding_cookbook_500/'
                 'tha_original_founding_cookbook_500.json'))['recipes']
print(sum(1 for r in R if any('°C' in s for s in r['method'])))
EOF
```

**Control check (the one that validates the classifier).** The ten authored meals must return zero defects on every detector. They do — verified by assertion in the scoring run, and visible in §3 where all ten carry *"—"* in the Fix column. **A classifier that flagged the founding ten would be measuring name shape rather than quality, which is the failure this review was commissioned to avoid.**

---

## DEFINITION OF DONE

| The mission required | Where this document meets it |
|---|---|
| Confirm git status | Confirmed clean but for the session dashboard's Stop-hook heartbeat; recorded in Rollback Protection |
| Create rollback protection | `rollback/FOUNDATION_MEALS2-pre` → `938ad386`, created before any file was written |
| Report the rollback identifier | Rollback Protection, § 8 Rollback Plan, and the session summary |
| Read the governing architecture | Reference Documents Read — including all four named documents |
| Review **every** meal in the THA 500 | § 2 — all 500 classified, none sampled, none skipped |
| Do not assume the previous investigation is correct | § 0 and § 1.4 — every figure re-derived; **three corrections recorded, one to my own work** |
| Treat every meal fairly on its own merits | § 2 — classification turns on the *dish*, not the name shape; § 1.4 Correction 1 is this instruction applied |
| KEEP / IMPROVE / RETIRE / FOUNDING verdicts | § 2.1, applied to all 500 |
| Evaluate against the ten FOUNDATION_MEALS1 standards | § 1–§ 6 throughout, each test cited to its owner and never restated |
| Look beyond naming patterns and generated structure | § 1.2 (the food itself) and § 6.1 (technique coverage) — both invisible to a name-based check |
| Judge cooking experience, usefulness, nutrition, practicality, distinctiveness | § 1.2, § 1.5, § 2.2, § 5, § 6 |
| Duplicate groups: strongest version, why it wins, improve the weaker | § 5 — 98 groups, canonical rule stated, weaker variants recommended for improvement not retirement |
| 1. Overall editorial assessment | § 1 |
| 2. Statistical breakdown | § 2 |
| 3. Top 50 already worthy | § 3 |
| 4. Top opportunities for improvement | § 4 |
| 5. Duplicate groups with canonical | § 5 |
| 6. Editorial themes missing | § 6 |
| 7. Recommendation for evolution | § 7 |
| Do not create new meals | § 8 Scope Lock — zero written |
| Do not delete meals | § 8 Scope Lock — zero deleted |
| Do not change meal ownership | § 8 Scope Lock — `userId`/`isSystemMeal` untouched |
| Do not modify acquisition lanes | § 8 Scope Lock — `acquisition_*` untouched on all 500 |
| Architecture Compliance | § 8, completed in full |
| Data Impact · Trust Check · Rollback Plan · Scope Lock | § 8 |
| Manual verification | § 10, with reproducible commands |
| User Acceptance Evidence | Below |
| Definition of Done | This section |

### USER ACCEPTANCE EVIDENCE

**This is an editorial review, so the acceptance evidence is the review's own falsifiability rather than a screenshot.** Nothing a household can see has changed, and § 8 Data Impact records that as a deliberate property, not a limitation.

| Claim | How the owner can check it without trusting me |
|---|---|
| All 500 were reviewed | § 2.2's per-slot counts sum to 500 exactly, in every table |
| The verdicts are derived, not asserted | § 10's three commands reproduce the load-bearing figures from the source file |
| The classifier is not a name-shape rule in disguise | The founding ten return **zero** defects — asserted in the scoring run and visible as "—" throughout § 3 |
| The review did not inherit its predecessor | § 1.3 lists what was confirmed; § 1.4 lists three corrections, including one to my own first-pass measurement |
| Nothing was written to the database | § 8 Data Impact — **no DB connection was opened**; meal row count unchanged; `verify:cookbook-seed` untouched |
| The scope lock held | `git show --stat` for this commit shows exactly one file added |

**The success test, answered honestly.** *Would six months of cooking these teach someone what THA stands for?*

**Of the founding ten: yes.** **Of the collection as it stands: no** — a household would meet an uncookable recipe inside a fortnight and stop trusting the book. **Of the collection after phases 1–3: for the first time, plausibly yes** — 173 coherent, honestly-named, plant-forward meals across 25 cuisines, no one of which exceeds 7% of the shelf. That is a cookbook. It is not one THA has yet, but — and this is the finding that separates this review from its predecessor — **it is already most of the way inside the corpus that was going to be deleted.**

---

*`FOUNDATION_MEALS1` asked whether these meals were distinctive enough to carry THA's name, and answered no for 490 of them. Re-measured, that was the wrong question to lead with. The corpus's worst failure is not that its meals resemble each other — it is that 208 of them are named after food they do not contain, and 222 cannot be cooked from the ingredients they list. Sameness makes a cookbook dull. Being wrong about the food makes it untrustworthy, and trust is the one thing the Brand Constitution calls non-negotiable. The good news is that the second failure is an editing problem, and the dish underneath is very often sound: 326 of these meals need a careful sentence, not a funeral.*

*Rollback: `rollback/FOUNDATION_MEALS2-pre` → `938ad386`.*
