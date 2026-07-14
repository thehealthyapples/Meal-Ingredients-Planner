# SURF1C1 — Canonical Starter Cookbook Diet Classification

**Status:** Implementation — complete.
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1C1-starter-cookbook-diet-classification-20260714` → `e2fa1fbc`
**Predecessor:** [`SURF1B5_STARTER_MEAL_SAFETY_CONVERGENCE.md`](./SURF1B5_STARTER_MEAL_SAFETY_CONVERGENCE.md) — *Remaining limitations*, items **1** (*"the starter cookbook is thin for vegans … the existing safe ones need their labels. That is a content workstream"*) and **2** (*"the labeller still labels on absence of evidence"*).
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 8) → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`.

---

## HEADLINE

**Every diet label THA held was on a meal it could not prove. Every meal it could prove had no label at all.**

SURF1B5 called the vegan cookbook "thin" and deferred it as a *content* problem — THA needed
more vegan food. Measuring it first found the cookbook was never thin. It found an exact
inversion, and it had been live in every household's cookbook since the day the labels existed:

| | Ingredient evidence | Vegan/Vegetarian labels |
|---|---|---|
| **500 Founding Cookbook recipes** — THA's own authored food | **Real.** 7–15 ingredient lines each | **ZERO** |
| **309 ready-meal rows** | **NONE.** `ingredients` is a literal echo of the meal's own name | **All 204 of them** |
| 75 OpenFoodFacts rows | Real (72 of 75) | Zero |

The seed that publishes the Founding Cookbook never wrote `diet_types` at all. So the only
labels in the system sat on rows like this:

```
"Chocolate Mousse"   →  ingredients: ["Chocolate Mousse"]   →  labelled: vegetarian
"Lucozade Original"  →  ingredients: ["Lucozade Original"]  →  labelled: vegan
```

**Today: 545 labels published across the 500 authored recipes. Every one is proven by that
recipe's own ingredients, and re-running the seed reproduces every one of them exactly.**

```
vegan breakfast:      2 labelled → 24        vegetarian breakfast:  18 → 71
vegan lunch:          6 labelled → 44        vegetarian lunch:      18 → 109
vegan dinner:        13 labelled → 173       vegetarian dinner:     29 → 190
```

SURF1B5 recorded that **five of the six starter slots** had too few labelled meals to fill
themselves and topped up from unlabelled food. **All six now fill from label-matched, proven
meals.** A live vegan household (user 183) now receives **63 of 63 starter meals that are
proven vegan**. Before SURF1C1 the number of proven-vegan authored recipes it could be
offered was **zero**, because none existed to offer.

**And the safety gate is untouched — to the meal.** 394 system meals are refused to a live
vegan household in the Breakfast/Lunch/Dinner categories, which is exactly the number SURF1B5
recorded. SURF1C1 changed what THA can honestly *say* about a meal. It changed nothing about
what THA will *serve*.

---

## ROOT CAUSE

**The labeller classified on the absence of evidence.**

It asked the canonical gate *"is anything here meat?"*. A meal with no ingredients answered
*"no"*. And the absence was recorded as a finding of plants.

```
detectDietTypes(name, ingredients)
   └─ shouldExcludeRecipe({ name, ingredients: [] }, { dietPattern: "Vegan" })
                                              ▲
                                              └── nothing to refuse → "clean" → LABELLED VEGAN
```

That is not a finding of plants. It is a finding of nothing, wearing a fact's clothes. Six of
`external-meal-service.ts`'s own call sites pass `detectDietTypes(name, [])`.

SURF1B5 named this itself (limitation #2) and judged it safe, on the correct reasoning that
*nothing trusts the label any more* — the gate re-reads the food when the meal is served. That
reasoning still holds, and it is why this was never a safety defect. But it had a second
consequence SURF1B5 did not see:

**It made SURF1B5's own clean audit vacuous.** SURF1B5 reported *"zero label contradictions
across 884 system meals"* and was right — but only because **no meal with ingredient evidence
carried a label at all**. There was nothing a contradiction could be found *in*. The audit
passed because the cookbook was empty of the thing it was auditing.

Meanwhile the 500 recipes THA authored itself — the only food in the platform whose contents
are actually known — went unlabelled, so a vegan household's starter list was topped up from
meals whose ingredient list is their own name.

---

## OWNERSHIP — CONFIRMED BEFORE ANY WRITE

`meals.dietTypes` has one owner per publication domain, and the starter cookbook's is **not the
database**:

| | |
|---|---|
| **Canonical owner** | `data/cookbook/tha_original_founding_cookbook_500/` — committed JSON. Publication register domain `cookbook-500`, *knowledge* variant. |
| **Authorised writer** | `scripts/import-tha-founding-cookbook-500.ts` — **only**. |
| **Publication path** | `npm run seed:cookbook` → `meals` (`is_system_meal`, `tha_library` provenance) |
| **Runtime read path** | `server/storage.ts` |

So a direct `UPDATE meals SET diet_types = …` backfill — the obvious way to do this job — would
have been **two** violations at once: an unauthorised writer (failing `ml-writer-census`), and a
fact published into the projection that its owner cannot reproduce (publication drift). The
labels would have been correct on the day they were written and orphaned forever after.

**The label is therefore DERIVED at the publication path, from the owner's own ingredients.**

```
data/cookbook/…/*.json        ← OWNER. The ingredients.
   │
   │  npm run seed:cookbook   ← the authorised writer, and the ONLY one
   │     └─ classifyDietLabels({ name, ingredients })   ← the one canonical classifier
   ▼
meals.diet_types              ← PROJECTION. Reproducible by re-seed, forever.
```

**`diet_types` is deliberately NOT a field in the source JSON, and must never become one.**
A stored label would be a second copy of a derived fact, free to contradict the ingredient list
sitting beside it in the same file — which is precisely the class of defect (Principle 2, one
owner per fact) that this workstream exists to remove. A test asserts the JSON contains no such
field.

### No duplicate classifier

`dietRules.classifyDietLabels()` is the single owner of *"which labels does this meal's own
evidence support?"*. It lives in `shared/dietRules.ts` as the **immediate neighbour** of
`shouldExcludeRecipe`, because it is that function's derived view and the two must not be able
to drift apart. It owns **no food vocabulary** — asserted by source scan — and puts every
question about what meat, dairy, eggs and honey *are* to the canonical restriction library,
through the same door the meal safety gate uses.

The seed authors no label. The import labeller decides no label. Both ask the one classifier.

---

## THE EVIDENCE GATE

Classification now **requires evidence and declines without it**.

| Rule | Why |
|---|---|
| **Title-echo** — an ingredient line that restates the meal's own name is not evidence | It is the title, a second time. This is the exact shape of all 309 ready-meal rows, and reading it as an ingredient list is what let a product's *name* vouch for its *contents*. |
| **Floor of 2 lines** (`MIN_INGREDIENT_EVIDENCE`) | Defence in depth against the *near*-echo the exact rule misses (`"Chocolate Mousse"` → `["Chocolate mousse dessert"]`). One line, whatever it says, cannot be told apart from a restated title. |

**The floor is deliberately not set higher.** A genuine recipe may be simple — porridge is oats
and oat milk — and refusing to classify it would be the same error in the other direction:
discarding evidence THA actually has. It binds on no real recipe in the cookbook (the thinnest
carries 7 lines).

**A meal that cannot be characterised is left unclassified.** That is not a failure. It is THA
declining to assert what it cannot show, and it is the whole correction:

| | Before | After |
|---|---|---|
| Title-only import (`detectDietTypes(name, [])`) | `vegan` + `vegetarian` | **unclassified** |
| Import *calling itself* "Vegan Buddha Bowl", no ingredients | `vegan` + `vegetarian` | **unclassified** — no evidence, no label, however loud the claim |
| `"Chocolate Mousse"` → `["Chocolate Mousse"]` | `vegetarian` | **unclassifiable** — and its existing label is retained, not stripped (see below) |
| A recipe with real ingredients and no claim | unlabelled | **labelled with what its food proves** |

**A source's claim can now only ever remove a label, never add one.** It is *vetoed* by
contradicting evidence (SURF1B5 — "vegan carbonara" listing pancetta is labelled neither),
*honoured* when it under-claims (SURF1B5 §7 — a source that says "vegetarian" and not "vegan"
may know something its ingredient list does not show, and SURF1C1 does not overrule a claim in
the permissive direction), and **never trusted on its own**.

---

## WHAT WAS ADDED, RETAINED, REMOVED

Measured by the seed itself, in dry run, before it wrote anything:

```
Vegan          : 220        Labels ADDED    : 545
Vegetarian     : 325        Labels RETAINED : 0
Unclassified   : 0          Labels REMOVED  : 0
```

| | Count | |
|---|---|---|
| **Meals audited** | **884** system meals | every system meal in the platform |
| **Labels added** | **545** | 220 vegan + 325 vegetarian, across the 500 authored recipes |
| **Labels retained** | **204** | the ready-meal labels — see below |
| **Labels removed** | **0** | nothing in the cookbook was wrong; it was *absent* |
| **Meals left unclassified** | **311** | 309 ready-meal rows + 2 evidence-thin OpenFoodFacts rows |
| **User-owned meals written** | **0** | 2,124 user meals, 1,106 of them labelled — **untouched, and never in scope** |

### Pre/post contradiction counts

| | Labels checked | Contradicting the canonical gate |
|---|---|---|
| **Before** | 204 | **0** — but *vacuously*: not one sat on a meal with ingredient evidence |
| **After** | **749** | **0** — and now the check means something |

Every vegan label passes the Vegan gate. Every vegetarian label passes the Vegetarian gate.
Dairy, eggs and honey block vegan; meat, fish and shellfish block both; the plant substitutes
(vegan sausages, oat milk, quorn, meat-free mince, flax egg, vegan cheese) all survive.

### Category pool counts — the point of the workstream

`MEALS_PER_CATEGORY = 21`. SURF1B5 recorded five of six slots short of labelled meals, topping
up from unlabelled food.

| Slot | Labelled before | Labelled now | Pool | Short of 21? |
|---|---|---|---|---|
| Vegan · breakfast | 2 | **24** | 99 | **No** (was 19 short) |
| Vegan · lunch | 6 | **44** | 171 | **No** (was 15 short) |
| Vegan · dinner | 13 | **173** | 415 | **No** (was 8 short) |
| Vegetarian · breakfast | 18 | **71** | 99 | **No** (was 3 short) |
| Vegetarian · lunch | 18 | **109** | 171 | **No** (was 3 short) |
| Vegetarian · dinner | 29 | **190** | 415 | No |

**Ordering improved; safety behaviour did not change.** Both are verified, and the second is the
one that matters:

```
live vegan household 183 : 63 of 63 starter meals now PROVEN vegan   (0 prohibited)
live vegan household 184 : 51 of 63 starter meals now PROVEN vegan   (0 prohibited)
live vegetarian    182   : 58 of 63 starter meals now PROVEN vegetarian (0 prohibited)

system meals REFUSED to vegan household 184, Breakfast/Lunch/Dinner : 394
                                        ← exactly the 394 SURF1B5 recorded. Unchanged.
```

The head of a vegan household's breakfast list is now *Californian-Style Edamame, Radish &
Fennel Toast Plate* `[vegetarian/vegan]` — an authored recipe whose label its own ingredients
prove — where before it was topped up from meals whose ingredient list is their own name.

### The ready-meal labels are RETAINED, not stripped

All 204 pre-existing labels sit on title-only rows, and the mandate says never to label a
title-only meal. They are nonetheless **kept**, and the distinction is load-bearing:

**They were not inferred. They were authored.** `server/lib/ready-meals-seed.ts` is a declared
owner and a human wrote them, with real knowledge and real care — `Chocolate Mousse` is
`vegetarian` and **not** vegan; `Egg Fried Rice` is vegetarian; `Steak & Kidney Pie` is neither;
`Almond Milk` is vegan and `Semi-Skimmed Milk` is not. A classifier reading `["Chocolate Mousse"]`
would have called it vegan. The human did not.

The evidence gate governs **inference**: THA may not *derive* a label from evidence it does not
have. An authored claim from a declared knowledge owner is not a derivation, and deleting 204
accurate facts belonging to another domain's owner is not "correcting labels through the
canonical path" — it is destroying knowledge this mandate has no authority over. **Zero of them
contradict the canonical gate.** They are retained, and the gap that they cannot be *verified*
is reported below rather than papered over.

---

## A LIVE GATE DEFECT THIS WORKSTREAM FOUND AND DID NOT FIX

**`aspARAGUs` contains `ragu`. The canonical library calls asparagus meat.**

`ragu` is a hidden meat ingredient. The canonical resolver matches hidden and derived terms by
**forward substring** — deliberately, because that is what makes `sardine` match `sardines` and
`yoghurt` match `natural yoghurt`. So `ragu` matches inside `asparagus`, and the library answers:
*this is meat*.

**Consequences, both live and both pre-existing:**

- **The gate refuses every asparagus meal to every vegetarian, vegan and meat-restricted
  household.** A fail-**closed** defect — which is exactly why four prior safety workstreams,
  every one of them hunting fail-**opens**, walked past it. It costs households food; it does
  not endanger them.
- **52 of the 500 founding recipes** are therefore classified as not-vegetarian and remain
  **unlabelled** — under-labelled, never mislabelled.

**SURF1C1 does not fix it, and the reason is not timidity.** The obvious fix — word-boundary
matching for derived and hidden terms — would break `sardines`, `prawns`, `eggs` and every other
plural, **opening real fail-opens in a major-allergen path**. It is a safety-gate change with its
own regression budget, and this mandate explicitly excludes changing the gate.

What SURF1C1 does instead is **defer to the canonical owner even where it suspects the owner is
wrong** — because a classifier that second-guesses the library becomes a second owner of the
fact, and that is the defect this entire SURF1 line exists to remove. The resulting error runs
toward silence, never toward a false claim.

**It is pinned by a test** (§5b) that *fails the day someone fixes it* — telling whoever does
that 52 founding recipes are now eligible for labels they never had, and that
`npm run seed:cookbook` must be re-run to publish them.

---

## VERIFICATION

### Tests — **81 new assertions, 0 failed** (`npm run test:surf1c1-starter-cookbook-diet-classification`)

| § | Section | What it proves |
|---|---|---|
| 1 | **Evidence** | A title-echo, an empty list and a lone line are all **unclassifiable**. A genuine 2-line recipe still is classified — the floor discards no evidence THA has |
| 2 | **The canonical answer** | Meat/fish/shellfish block both labels (14 foods); dairy/eggs/honey block vegan only; **vegan ⊆ vegetarian** is never violated |
| 3 | **Plant substitutes** | vegan sausages · oat milk · quorn · meat-free mince · flax egg · vegan cheese · tofu · peanut butter — all still labelled both |
| 4 | **One owner** | Source scan: the classifier defines **no food term**; the seed authors **no label**; the source JSON stores **no `diet_types`**; the retired keyword lists have not returned. A jar of quorn cannot vouch for the beef beside it (fields, never a blob) |
| 5 | **Label path & the gate** | A claim is vetoed by evidence and by the *absence* of evidence; an under-claim is honoured; gluten-free/keto/paleo pass through untouched. **The gate's verdict is identical whatever the label says** |
| 5b | **Known gate defect** | The asparagus/`ragu` collision, pinned — fails the day it is fixed |
| 6 | **Live data** | 884 system meals: every one of **749 labels passes its own gate**; all 500 founding labels equal what the classifier derives; **311 evidence-less meals left unclassified**; every starter slot fills with ≥21 label-matched meals; 2,124 user meals unwritten |

### Regression — **8 suites, 0 failed**

| Suite | Result | | Suite | Result |
|---|---|---|---|---|
| `surf1b-dietary-restriction-safety-path` | 54 | | `planner-compliance` | 25 |
| `surf1b2-dietary-restriction-knowledge` | 173 | | `intelligence-platform` | 33 |
| `surf1b3-onboarding-allergy-routing` | 64 | | `intelligence-meals-binding` | 72 |
| `surf1b4-canonical-diet-pattern-safety` | 315 | | `hybrid-meal-occasion` | 159 |
| `surf1b5-starter-meal-safety` | **84** | | `smart-suggest-diet-pattern` | 26 |
| `cbk1-cookbook-seed` | 37 | | `smart-suggest-tailoring` | 14 |
| `scoring` | 12 | | `ingredient-verification` | 22 |

**Typecheck: 0 errors in any SURF1C1 file.** (`publication-register.ts` carries 6 pre-existing
`downlevelIteration` errors at `HEAD`, from another session's uncommitted work; SURF1C1 adds none.)

### Two SURF1B5 assertions were knowingly changed

Both because SURF1C1 made them false, and both **inverted rather than deleted** — the numbers they
guard are the point of both workstreams:

1. *"the labeller delegates to the canonical library through the same door the meal gate uses"* —
   the labeller now reaches the library one door further in, through `classifyDietLabels`. The
   chain is now asserted **link by link** (labeller → classifier → `shouldExcludeRecipe`) rather
   than at one end, which is strictly stronger.
2. *"the vegan-labelled breakfast pool is still too small to fill 21 slots — the backfill still
   fires today"* — **this was SURF1B5's own limitation #1, written down as a passing test because
   it was true.** It is now `labelled.length >= WANTED`: if the labelled pool ever falls back
   below 21, the label has stopped doing the one job it is allowed to do.

### Publication gate (`npm run verify:publication`)

| | Before | After |
|---|---|---|
| Checks run | 59 | **60** |
| Passed | 23 | **24** |
| Warned | 24 | 24 |
| **Failed** | **12** | **12** |
| Domains in failure | 6 | 6 |

**The new check passes and no existing check regressed.** `cb-diet-labels-derived` (severity
`fail`, law `no-publication-drift`) re-derives every founding recipe's labels from its ingredients
and fails if any published label disagrees — so the classification is now a **permanently verified
contract**, not a one-time backfill. The `cookbook-500` domain's only remaining finding is the
pre-existing `preloadStarterMeals` warning that SURF1B5 declared and did not touch.

### Data impact

| | |
|---|---|
| **Rows written** | **500** — the founding cookbook rows, by their own authorised writer |
| **Rows read but not written** | 384 (309 ready-meal + 75 OpenFoodFacts) |
| **User-owned rows touched** | **0** — the seed's `UPDATE` is scoped `is_system_meal = true` |
| **Schema change** | **None.** `meals.diet_types` already existed |
| **Migration** | **None** |
| **Dry run** | `npm run seed:cookbook:dry-run` — run first, reported all 545 labels, wrote nothing (verified: 0 labelled rows after) |
| **Idempotent** | Re-running the seed reports `ADDED 0 · RETAINED 545 · REMOVED 0` |
| **Reversible** | See below |

---

## REMAINING GAPS

Stated plainly, because a report that overclaims is worse than one that does not exist.

1. **The asparagus/`ragu` collision — the biggest thing here, and it is not a label defect.**
   The canonical library refuses asparagus to every vegetarian, vegan and meat-restricted
   household, and costs 52 founding recipes the labels they deserve. Found here, pinned by a
   test, **deliberately not fixed** (§ *A live gate defect* above). **This should be the next
   workstream.** It needs a safety-gate regression budget, because the naive fix opens
   major-allergen holes.

2. **The 309 ready-meal rows have no ingredients, so nothing about them can be verified — by the
   labeller or by the gate.** Their labels are retained on the authority of the human who wrote
   them, and that is the *only* authority behind them. Worse than the label question: **the safety
   gate cannot protect against them either.** `"Chocolate Mousse"` has no dairy in its ingredient
   list because it has no ingredient list, so the Vegan gate has nothing to refuse. A vegan
   household can be served it. That is a **pre-existing fail-open in the ready-meal data**, not in
   any gate, and the fix is to give those 309 rows real ingredients — a data workstream, not a
   safety one. SURF1C1 does not touch it, and would have papered over it by stripping the labels.

3. **The 72 evidence-bearing OpenFoodFacts rows remain unlabelled.** They are products, owned by
   `openfoodfacts-importer.ts`, not by the starter cookbook, and classifying them means changing
   *their* publication path. In scope for a follow-up; out of scope for a mandate about the
   starter cookbook.

4. **A label still cannot see the method.** A recipe that lists no butter but fries in butter in
   step 3 will be labelled vegan. Ingredient lists are the evidence THA has, and this is their
   ceiling. It costs ordering, never safety — the gate re-reads the same ingredients when the meal
   is served, so a label and a serving decision can never disagree.

5. **Two meat keyword lists still survive**, in `meal-scoring-service.ts` (a *score*, behind the
   gate) and `PlantDiversityReport.tsx` (a *report*, outside it). Unchanged from SURF1B5's
   limitation #6: duplicate *vocabulary*, not duplicate *authority*. Neither can refuse a meal or
   write a label.

6. **`meal-service.ts` remains an unauthorised writer of `meals`** (CPI1 S2-1). Pre-existing,
   declared before SURF1B5, and **untouched** — SURF1C1 adds no write path to it.

---

## GOVERNANCE

- **Architecture Bootstrap** — `docs/architecture/README.md` and the governing documents it names were read before implementation, along with SURF1B5.
- **Principle 2 (one owner per fact)** — the *ingredients* own the answer; the label is their projection, derived at the publication path and reproducible from the owner forever. `classifyDietLabels()` is the single owner of the derivation, and lives beside the gate it derives from so the two cannot drift. **No `diet_types` field was added to the source JSON**, which would have created exactly the second owner this workstream removes.
- **Principle 8 (retire on introduction)** — no rival classifier was created; the labeller's private decision logic is **gone**, replaced by a call to the one classifier. The three keyword lists SURF1B5 deleted have not returned (asserted by scan).
- **No new food knowledge and no keyword list.** Not one food term was authored. `classifyDietLabels` contains no food vocabulary — asserted by source scan. Every question about food is put to the canonical restriction library.
- **The safety gate is unchanged.** SURF1C1 adds no gate, removes no gate, and modifies no gate. Verified empirically: 394 system meals refused to a live vegan household in the starter categories, before and after — the identical number SURF1B5 recorded. The gate reads *ingredients*, which this workstream did not touch.
- **Labels remain discovery and ordering signals, never safety gates.** Pinned by a test that hands the gate the same meal with opposite labels and asserts its verdict is identical.
- **No meals created, no food knowledge created.** The 500 recipes and their ingredients are exactly as they were; only their labels are new.
- **No user-owned meal modified.** The seed's write is scoped `is_system_meal = true`; 2,124 user meals and their 1,106 labels are untouched (asserted live).
- **No UI change, no Pantry, preparation-knowledge or image change.** `meals.diet_types` renders as it always has.
- **Product Registry Compliance** — no page, route, journey or capability created, removed or renamed. `docs/product/` does not exist (`PKR1`/`PKR3` define the registry and deliberately do not populate it), so there is no entry to update.
- **Experience & UI Governance** — no user-facing surface changes. A household sees the same starter-meal list, better ordered.

**The working tree was dirty on arrival** with uncommitted work from other sessions
(`plant-classifier.ts`, `publication-register.ts`, `seed-canonical-food.ts`, `client/src/index.css`,
`tailwind.config.ts`, `THA_UI_ARCHITECTURE.md` and others). **SURF1C1 did not touch, commit or
revert any of it.** `publication-register.ts` was modified by both — only SURF1C1's own 41-line hunk
was staged; the other session's 61 lines remain uncommitted in the working tree, exactly as found.

### Files changed

| File | Change |
|---|---|
| `shared/dietRules.ts` | **New** `classifyDietLabels()`, `dietEvidenceLines()`, `MIN_INGREDIENT_EVIDENCE` — the single owner of the label derivation, holding no food vocabulary, declining to answer without evidence |
| `scripts/import-tha-founding-cookbook-500.ts` | The authorised writer now **derives** each recipe's `diet_types` from its own ingredients at publication; dry run reports added/retained/removed and writes nothing |
| `server/lib/external-meal-service.ts` | `detectDietTypes` delegates Vegan/Vegetarian to the one classifier; a title-only import is no longer labelled from nothing |
| `server/verification/publication-register.ts` | **New check** `cb-diet-labels-derived` — every published label must equal what the classifier derives from the owner, or the gate fails |
| `server/tests/test-surf1c1-starter-cookbook-diet-classification.ts` | **New** — 81 assertions across 7 sections, including live data and a pinned known defect |
| `server/tests/test-surf1b5-starter-meal-safety.ts` | Two assertions knowingly inverted (above); 84 passed, 0 failed |
| `package.json` | `test:surf1c1-starter-cookbook-diet-classification` registered and wired into `npm test` |

---

## ROLLBACK

```
git reset --hard rollback/SURF1C1-starter-cookbook-diet-classification-20260714   # → e2fa1fbc
```

**Unlike SURF1B5, this workstream did write data** — 500 rows. The tag anchors code only, so the
reverse of the data change is stated explicitly:

```sql
-- Restores the pre-SURF1C1 state exactly: the 500 founding recipes carried NO labels.
UPDATE meals SET diet_types = '{}'
 WHERE is_system_meal = true AND acquisition_source_key LIKE 'tha_original:%';
```

No migration is required, and no other row is affected — the ready-meal and user-owned labels were
never written by SURF1C1 and are unchanged by its reversal.

The labels are **always reproducible from the owner**: `npm run seed:cookbook` recomputes all 545
from the committed JSON's ingredients and republishes them. That is the real safety property here —
there is no state to lose, only a derivation to re-run.

Rolling back returns the cookbook to the inversion: THA's 500 authored recipes go back to carrying
no diet label at all, every label in the system returns to sitting on a meal whose ingredient list
is its own name, and five of the six starter slots resume filling themselves from food no household
ever asked for.

---

*Implementation. 2026-07-14. Labels what it can prove, and says nothing about what it cannot.*
