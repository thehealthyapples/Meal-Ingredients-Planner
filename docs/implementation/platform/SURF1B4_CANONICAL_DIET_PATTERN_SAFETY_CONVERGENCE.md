# SURF1B4 — Canonical Diet Pattern Safety Convergence

**Status:** Implementation — complete.
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1B4-canonical-diet-pattern-safety-convergence-20260714` → `eb77aadc`
**Predecessor:** [`SURF1B3_ONBOARDING_ALLERGY_SAFETY_ROUTING.md`](./SURF1B3_ONBOARDING_ALLERGY_SAFETY_ROUTING.md) — *Remaining limitations*, item 1, which named this defect and deferred it: *"A `Vegan` or `Vegetarian` pattern can still be recommended prosciutto … pinned by SURF1B2's superset test. Closing it changes the recommendation behaviour of every vegan and vegetarian household and needs its own regression budget."* That budget is this workstream.
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 8) → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`.

---

## HEADLINE

**THA had two answers to the question "what is meat", and which one a household got
depended on *how they had said they were vegan*.**

A household that declared the **`meat` restriction** was protected by the canonical
restriction library, which knows `prosciutto`, `pancetta`, `gammon`, `mutton`, `gelatine`,
`bone broth` and `foie gras`.

A household whose **diet pattern** was `Vegan` was protected by `dietRules.MEAT_KEYWORDS` —
a private list written before the library existed, which knew none of those seven.

Same food. Same platform. Same person. Two answers.

| | `meat` **restriction** | `Vegan` **pattern** |
|---|---|---|
| Owner of the answer | `shared/restrictions/` (canonical library) | `shared/dietRules.ts` (private list) |
| Prosciutto pizza | **refused** | **served** |
| Bone broth ramen | **refused** | **served** |
| Halloumi salad *(Dairy-Free)* | **served** ← the library had never heard of halloumi | refused |
| Butternut squash soup *(Dairy-Free)* | **refused** ← `butter` is a substring of `butternut` | served |

The two owners had drifted in **both directions**. Neither was a superset of the other.
SURF1B2 found this, could not merge it inside its mandate, and did the honest thing: it
**pinned** the divergence with a test and named the merge as the first thing to do next.

**SURF1B4 does the merge.** The private lists are **deleted**, not deprecated. The Vegan and
Vegetarian patterns now name the canonical restrictions they *mean* — and the library that
owns those restrictions answers.

**Live, on the real cookbook: 13 meals that a vegan household could be served yesterday are
refused today.** Among them *Spaghetti Bolognese*, *Steak Diane*, *Classic lasagne*,
*Slow cooker coq au vin*, and *Taiwanese-style chicken chow mein*.

---

## STATE FOUND ON RECOVERY

Claude disconnected mid-workstream. Recovery found **no run file, no implementation
document, and no dashboard row** — but a rollback tag and a complete, coherent, *passing*
implementation sitting uncommitted in the working tree.

| Artefact | State found |
|---|---|
| `rollback/SURF1B4-…-20260714` → `eb77aadc` | Tag present |
| `shared/dietRules.ts` | Keyword lists deleted; delegates to the canonical library |
| `shared/restrictions/restriction-library.ts` | `5.0.0` — cheeses, dish names, compounds folded in |
| `shared/restrictions/restriction-resolver.ts` | Punctuation word boundary + diacritic folding |
| `household-dietary-safety.ts`, `smart-suggest-service.ts`, `routes.ts`, `meals-page.tsx` | Pass recipe **fields**, not a joined blob |
| `test-surf1b4-canonical-diet-pattern-safety.ts` | New — 315 assertions, **passing** |
| 4 sibling test files + `package.json` | Updated for the merged state |
| **Implementation document** | **Missing** — this file |

**Nothing was restarted and nothing was rewritten.** The work above was verified, not
redone. What recovery added is the verification, the limitations, this document, and the
commit — listed under *Work completed after recovery* below.

---

## THE CANONICAL DELEGATION PATH

The patterns no longer *contain* food knowledge. They **name** the restrictions they mean:

```
Vegetarian  →  meat · fish · shellfish
Vegan       →  meat · fish · shellfish · dairy · eggs · honey
```

```
shouldExcludeRecipe(fields, { dietPattern: "Vegan" })
        │
        ├─ VEGAN_RESTRICTION_IDS  ──►  findRestrictionById()   ← canonical library
        │                                    │
        │                              (throws at module load if an id has no
        │                               definition — the platform refuses to boot
        │                               rather than serve beef to a vegan)
        │
        └─ resolveIngredientRestrictions(item, definitions)    ← per ITEM
                    │
                    ├─ excludedCompounds  → "vegan sausage", "oat milk", "quorn"  → ADMIT
                    ├─ aliases            → whole-word          ("beef", "cod", "egg")
                    └─ derived / hidden   → substring           ("prosciutto", "bone broth")
```

`shared/dietRules.ts` contains **no meat term, no fish term, and no dish name.** A test reads
its source, strips the comments, and fails if one ever returns.

**Fish and shellfish stay two restrictions, not one.** They are two separate allergens in law
and in medicine, and keeping them separate is what lets a Pescatarian exist at all. The old
list mixed them into one bucket; the library never did.

### Fields, not a blob — the subtle half of the fix

The old signature took one lowercased string: name + ingredients + description, joined.

That is fatal to the canonical library, because the library's `excludedCompounds` are
**whole-item markers**. `"quorn"` means *this thing is not meat*. Flatten the recipe first and
a jar of quorn in the cupboard **vouches for the beef stock standing beside it.**

So every production caller now passes the recipe's **fields**, and each is evaluated as its own
item. A plain string is still accepted and treated as *one* item — which is exactly right for a
dish name or a single food, and is what the legacy callers pass.

| Caller | Before | After |
|---|---|---|
| `server/routes.ts` (recipe search) | joined blob | fields |
| `server/lib/smart-suggest-service.ts` (planner) | joined blob | fields |
| `server/lib/household-dietary-safety.ts` (the one meal gate) | joined blob | fields |
| `client/src/pages/meals-page.tsx` (cookbook filter) | joined blob | fields |

---

## DUPLICATE LOGIC RETIRED

**Deleted from `shared/dietRules.ts`** (Principle 8 — retire on introduction; not deprecated,
not commented out, *gone*):

| Retired | What it was |
|---|---|
| `MEAT_KEYWORDS` | 30 terms. Missing the seven the library knew. |
| `FISH_SEAFOOD_KEYWORDS` | 33 terms, fish and shellfish mixed into one bucket. |
| `DISH_NAME_MEAT_OR_SEAFOOD` | `carbonara`, `ragu`, `bolognese`, `birria`, `ossobuco` — reachable **only** from the Vegan/Vegetarian patterns, so a household declaring the `meat` *restriction* was offered a carbonara. |
| The Vegan dairy special-case | A hand-kept plant-milk whitelist, now redundant. |

**Everything the retired lists knew and the library did not was folded in** — the named cheeses
(`dairy`), the meat dish names (`meat`) — **and everything they got wrong was left behind.**

The library is now the single owner of *what is meat*, *what is fish*, *what is dairy* for
**every gate in THA**. `RESTRICTION_LIBRARY_VERSION` `4.0.0` → **`5.0.0`**.

### Three keyword lists survive, and they are not safety

Honesty about what was *not* retired, and why each is provably not a gate:

| Survivor | What it does | Why it is not a safety surface |
|---|---|---|
| `meal-scoring-service.ts` `MEAT_KEYWORDS` | `dietMatch = -10` — a **score** | Candidates are hard-gated by `candidateDietExcluded()` / `candidateHardExcluded()` at `smart-suggest-service.ts:661,725` — **before** `scoreMeal()` runs at `:898`. A meal the gate refuses never reaches the scorer. |
| `external-meal-service.ts` `MEAT_KEYWORDS` | **labels** an imported meal `vegan`/`vegetarian` | A label is a claim, not a gate. Verified against live data below. |
| `PlantDiversityReport.tsx` `MEAT_KEYWORDS` | categorises ingredients in a report | Presentation. Refuses nothing. |

This is the same line SURF1B4 draws inside `dietRules` itself, which **keeps** its scoring word
lists: *preference scoring is a ranking signal, not dietary knowledge.* Nothing in
`scoreRecipeForDiet` can refuse a meal, and nothing in `shouldExcludeRecipe` can nudge a rank.
The two never mix.

---

## WHAT CHANGED FOR HOUSEHOLDS

Merging two owners means adopting the canonical answer where they disagreed. Four
user-visible consequences, stated plainly rather than buried:

1. **Vegetarian now excludes parmesan.** Parmesan is made with animal rennet, and the canonical
   `meat` definition has said so since SURF1B2. The Vegetarian *pattern* used to disagree with
   the `meat` *restriction* about this, because it had its own list. It no longer has one, so it
   no longer disagrees. **`vegetarian parmesan` is admitted** — the escape hatch is on the packet.

2. **"Vegan Bolognese" is now served to vegans.** It used to be *excluded*: the dish-name list
   knew the word `bolognese` and had no way to say *"…unless it says vegan on the tin."* The
   library does. `vegan bolognese`, `lentil bolognese`, `mushroom ragu` and their kin are
   `excludedCompounds`. **Plain "Bolognese" with no qualifier is still refused by title alone** —
   the conservative trade-off is preserved exactly where it is still needed.

3. **Dairy-Free households get their squash soup back.** `butter` is a substring of `butternut`,
   and the canonical `dairy` definition was refusing butternut squash, butter beans, peanut
   butter, cocoa butter and cream of tartar. These were live **false** exclusions. Now admitted.

4. **The resolver is stricter for all thirteen restrictions, not just the two patterns.**
   `wordBoundaryIncludes` counted only a literal space as a word boundary — so the most common
   ingredient string in any recipe on earth was invisible to the alias matcher:

   ```
   "2 eggs, beaten"  → "eggs" is followed by a comma → NOT a match   (fail-OPEN)
   "beef, diced"     → "beef" is followed by a comma → NOT a match   (fail-OPEN)
   ```

   Every alias in the library is short by design (`beef`, `ham`, `cod`, `egg`, `milk`) *precisely
   because* whole-word matching is supposed to make short words safe. Punctuation-blindness had
   quietly taken that guarantee away. The boundary is now any non-alphanumeric character, and
   diacritics and typographic quotes are folded (`pâté` → `pate`, `ragù` → `ragu`,
   `Goat's Cheese` with U+2019 → the `goat's cheese` compound).

   **This moves in the restrictive direction only**, and it is why the pattern path can delegate
   to the library without losing a single match it used to make. `"chamomile tea"` still does not
   match `ham`.

---

## TESTS AND NEGATIVE CONTROLS

### `npm run test:surf1b4-canonical-diet-pattern-safety` — **315 passed, 0 failed**

| § | Section | What it proves |
|---|---|---|
| 1 | **Negative control** — the seven meats the pattern path could not see | `prosciutto`, `pancetta`, `gammon`, `mutton`, `gelatine`, `bone broth`, `foie gras` are refused for Vegan *and* Vegetarian |
| 2 | Ordinary cases | Everything the old list *did* catch is still caught |
| 3 | Pattern coverage matrix | Vegetarian = meat·fish·shellfish; Vegan = + dairy·eggs·honey |
| 4 | **Fish ≠ shellfish** | Two restrictions, kept separate; the Pescatarian survives |
| 5 | **Positive controls** — plant-based compounds are **not** falsely rejected | `vegan sausage`, `quorn`, `meat-free mince`, `oat milk`, `peanut butter`, `butternut squash`, `butter beans`, `vegan cheese`, `flax egg`, `lentil bolognese` |
| 6 | Case | Six live users store the pattern lower-cased; `canonicaliseDietPattern` still catches them |
| 7 | **One owner** | Source scan: the retired lists are gone and **cannot return** |
| 8 | **Item scope** | A plant-based marker vouches for its own item, **never** the whole recipe |
| 9 | Hard ≠ preference | Exclusion and scoring stay separate |
| 10 | **Patterns stay per member** | No household-wide union of diet patterns |
| 11 | **Fail-closed** | SURF1B behaviour preserved |
| 12 | **Live data** | Below |

### Live-data verification — real households, the real cookbook, the real gate

```
16 live Vegan/Vegetarian households × 3,008 cookbook meals = 48,128 gate decisions

  ✓ NOT ONE prohibited meal reaches a live Vegan or Vegetarian household
  ✓ 26,206 meals still served — the gate did not pass by refusing the cookbook
  ✓ 13 live meals contain one of the seven meats the pattern path could not see —
    each is REFUSED today and was SERVABLE at eb77aadc
```

Refused today, servable yesterday: *Spaghetti Bolognese* ×2, *Steak Diane* ×2, *Classic
lasagne*, *Classic lasagne (Edited)*, *Slow-cooked chunky beef lasagne*, *Molten
cheese-stuffed burgers* ×2, *Slow cooker coq au vin*, *Chow mein*, *Taiwanese-style chicken
chow mein* ×2.

The gate serving 26,206 meals is not decoration. **A safety gate that passes by refusing
everything is not a safety gate**, and this test fails if the cookbook empties.

### Regression — **11 suites, 571 assertions, 0 failed**

| Suite | Result |
|---|---|
| `test:surf1b-dietary-restriction-safety-path` | 54 passed |
| `test:surf1b2-dietary-restriction-knowledge` | 173 passed |
| `test:surf1b3-onboarding-allergy-routing` | 64 passed |
| `test:keto-low-carb-dictionary` | 82 passed |
| `test-ingredient-verification` | 22 passed |
| `test-profile-dietary-title-safety` | 39 passed |
| `test-plant-milk-vegan` | 27 passed |
| `test-smart-suggest-diet-pattern` | 26 passed |
| `test-planner-compliance-gate` | 25 passed |
| `test-smart-suggest-tailoring` | 14 passed |
| `test-diet-reconciliation-bridge` | 45 passed |

**Keto, Low-Carb, Paleo, Carnivore, Flexitarian, Mediterranean, DASH and MIND are untouched** —
82 assertions in the Keto/Low-Carb dictionary alone confirm it. Only Vegan and Vegetarian
changed owner.

Typecheck: **0 errors in any SURF1B4 file.**

### SURF1B2's pin, inverted

SURF1B2's §5 asserted *"the library is a strict superset of `MEAT_KEYWORDS`"*. That assertion
is now **inverted**, and the inversion is the entire point of a pin: the test now asserts the
lists are **gone**, and fails the day a meat keyword reappears in `dietRules`. The comment scan
strips comments first — the retired lists are *named* in that file's own header, and a check
that cannot tell prose from a keyword list is not a check.

---

## REMAINING LIMITATIONS

Stated plainly, because a safety document that overclaims is worse than one that does not exist.

1. **The onboarding starter-meal list can still show a vegan a non-vegan breakfast.** This is a
   **live fail-open**, and it is the first thing to do next. It is in the **label** path, not the
   pattern path, so SURF1B4 does not reach it: `meal-service.getStarterMeals()` filters on the
   `meals.dietTypes` *label* and then calls `pickMealsWithBackfill()`, which **tops up from all
   system meals when too few match**. Measured against the live database:

   ```
   vegan · breakfast:  2 of 99 system meals carry the "vegan" label  (< 6 required)
                       → backfill FIRES
                       → the top-up pool holds 61 meals the canonical gate would REFUSE
   ```

   Lunch, dinner, and both vegetarian slots have enough labelled meals that the backfill does not
   fire today. **Vegan breakfast does.** The fix belongs to the label path and needs its own
   regression budget — the same argument SURF1B2 made for pinning rather than merging, and it
   should be honoured rather than quietly re-litigated here.

2. **The `dietTypes` labels are correct today, but not correct *by construction*.**
   `external-meal-service.detectDietTypes()` assigns `vegan`/`vegetarian` labels from its own
   incomplete keyword list. Probed against live data: of **21** vegan-labelled and **65**
   vegetarian-labelled system meals, the canonical gate refuses **zero**. So there is no false
   label in the cookbook today — but nothing *guarantees* that, and a prosciutto import would be
   labelled vegetarian tomorrow. Delegating the labeller to the library is cheap now that the
   library owns the vocabulary.

3. **Two meat keyword lists survive, in scoring and in a report** (`meal-scoring-service.ts`,
   `PlantDiversityReport.tsx`). Both are provably behind the gate or outside it (table above).
   Neither can refuse a meal. They are duplicate *vocabulary*, not duplicate *authority* — worth
   collapsing, not urgent, and collapsing them changes ranking for every diet pattern.

4. **Title-only candidates remain conservatively refused.** A plain "Bolognese" with no
   ingredient list is refused for a vegan on the strength of its name. That is intentional and
   unchanged. The household can add it via My Meals with full ingredients.

5. **The `dietTypes` three-owner preference contest survives.** CPV1 still reports
   `hh-sync-bridge` and `hh-contested-owner`. Both concern `diet_types` (preferences), not
   restrictions and not patterns. Untouched, as every SURF1B workstream has left it.

---

## GOVERNANCE

- **Architecture Bootstrap** — `docs/architecture/README.md` and the documents above were read
  before continuing the implementation.
- **Principle 2 (one owner per fact)** — the defect *was* a second owner. There is now one owner
  of *what is meat*, and both the restriction path and the pattern path read it.
- **Principle 8 (retire on introduction)** — the rival lists are **deleted**, not deprecated, and
  a source scan fails the build if they return.
- **No new food knowledge invented** — every term added to the library was *already known to the
  retired lists*. The merge moved knowledge; it did not author it.
- **Fail-closed preserved** — `definitionsFor()` **throws at module load** if a restriction id has
  no definition. A Vegan gate that silently dropped `meat` because someone renamed a definition
  would serve beef and report success. The platform refuses to start instead. Asserted in §11.
- **Patterns remain per member** — no household-wide union of diet patterns. Asserted in §10.
- **Other diet patterns unchanged** — Keto, Low-Carb, Paleo, Carnivore, Flexitarian,
  Mediterranean, DASH, MIND. Only Vegan and Vegetarian changed owner.
- **No permissive change to any allergen path** — the resolver's word-boundary fix moves in the
  **restrictive** direction for all thirteen restrictions. The three permissive changes are all
  **corrections of false exclusions** (butternut squash, peanut butter, vegan bolognese), each
  covered by a positive control.
- **Product Registry Compliance** — no page, route, journey or capability is created, removed or
  renamed. `docs/product/` does not exist (`PKR1`/`PKR3` define the registry and deliberately do
  not populate it), so there is no entry to update.

**The working tree was already dirty on arrival** (uncommitted work by other sessions:
`plant-classifier.ts`, `publication-register.ts`, `notice-gateway.ts`, `HouseholdNutritionPanel.tsx`,
`household-nutrition-assembler.ts`, the HHP3 / PLAN2 / CBK2 / PANTRY1 / SHOP1 / PUB1 / CPV1 / PX1
documents, and others). **SURF1B4 did not touch, commit, or revert any of it.** The milestone commit
contains only the files listed below.

### Files changed

| File | Change |
|---|---|
| `shared/dietRules.ts` | Keyword lists **deleted**; Vegan/Vegetarian delegate to the library; fields-or-string input |
| `shared/restrictions/restriction-library.ts` | `4.0.0` → `5.0.0`; cheeses, dish names, plant-based compounds, false-exclusion escapes |
| `shared/restrictions/restriction-resolver.ts` | Punctuation word boundaries; diacritic + typographic-quote folding |
| `server/lib/household-dietary-safety.ts` | Passes fields to the gate |
| `server/lib/smart-suggest-service.ts` | Passes fields to the gate |
| `server/routes.ts` | Passes fields to the gate |
| `client/src/pages/meals-page.tsx` | Passes fields to the gate |
| `server/tests/test-surf1b4-canonical-diet-pattern-safety.ts` | **New** — 315 assertions |
| `server/tests/test-surf1b2-dietary-restriction-knowledge.ts` | §5 inverted: the pin becomes a retirement gate |
| `server/tests/test-keto-low-carb-dictionary.ts` | Vegan/Vegetarian assertions moved to fields; parmesan |
| `server/tests/test-ingredient-verification.ts` | Parmesan (animal rennet) now excluded for Vegetarian |
| `server/tests/test-profile-dietary-title-safety.ts` | "Vegan Bolognese" assertion inverted |
| `package.json` | `test:surf1b4-canonical-diet-pattern-safety` registered and wired into `npm test` |

---

## ROLLBACK

```
git reset --hard rollback/SURF1B4-canonical-diet-pattern-safety-convergence-20260714   # → eb77aadc
```

The tag anchors committed state only. **No seed, no migration, and no database row was written** —
SURF1B4 changes only the code that *reads* food, never the food. Rollback is complete and requires
no data migration.

Rolling back re-opens the divergence: a vegan household becomes servable *Spaghetti Bolognese*,
*Steak Diane* and *Classic lasagne* again, and Dairy-Free households resume being refused butternut
squash soup.

---

*Implementation. 2026-07-14. Gives "what is meat" one owner, and asks it every time.*
