# SURF1C2 — Canonical Restriction Matcher Boundary Safety

**Status:** Implementation — complete.
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1C2-canonical-restriction-matcher-boundary-safety-20260714` → `9e0b831d`
**Predecessor:** [`SURF1C1_STARTER_COOKBOOK_DIET_CLASSIFICATION.md`](./SURF1C1_STARTER_COOKBOOK_DIET_CLASSIFICATION.md) — *Remaining gaps*, item **1** (*"the asparagus/`ragu` collision — the biggest thing here … This should be the next workstream. It needs a safety-gate regression budget"*).
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 8) → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`.

---

## HEADLINE

**`aspARAGUs` contains `ragu`. The canonical library called asparagus meat — and it had been refusing every asparagus meal to every vegetarian, vegan and meat-restricted household.**

SURF1C1 found this and deliberately did not fix it, because the naive fix (word-boundary
matching everywhere) would break `sardines`, `prawns` and `eggs` and open real holes in a
major-allergen path. SURF1C2 is the fix, done with the regression budget SURF1C1 said it needed.

The fix is one general rule in the single canonical matcher — no asparagus exception, no second
matcher, no keyword list, and no edit to the restriction library:

> A derived or hidden ingredient term matches only when it **begins at a word boundary.** What
> follows is unrestricted, so plurals and compounds keep matching exactly as before —
> `sardine`→`sardines`, `cheese`→`cheesecake` — while a term buried inside a word
> (`aspa·ragu·s`) no longer matches.

The result across the **entire** meal corpus — every system and user meal, 3,252 distinct
ingredient lines × 13 restrictions:

```
0 matches ADDED   ·   8 matches REMOVED   ·   every removal a coincidental infix
```

**No unsafe meal became allowed.** The new match set is a strict subset of the old
one, so the change can only stop *false* refusals, never permit a real ingredient — no meal that
was refused becomes allowed. All three
classes of removed match are fail-CLOSED corrections — the library was over-restricting:

| Removed false match | Truth |
|---|---|
| `asparagus` → **meat** (via `ragu`) | Asparagus is a plant |
| `cornflour` → **gluten** (via `flour`) | UK cornflour is cornstarch — gluten-free |
| `peanut butter` → **tree_nut** (via `nut butter`) | Peanut is a legume, not a tree nut |

The two the mission did not name were found by the full-corpus proof, and both are corrections
in the same safe direction. Crucially, protection is **kept** in every case: peanut butter still
matches the `peanut` restriction, and every genuine wheat flour and real tree-nut butter still
matches.

**52 founding recipes were freed.** After republishing, 25 gained a diet label their asparagus
had been denying them (17 vegan, 8 vegetarian-only). The other 27 stay unlabelled — correctly,
because they contain chicken; asparagus is simply no longer the reason.

---

## ROOT CAUSE

The resolver matches a library term against an ingredient string in four ways, and two of them
were unsafe:

```
matchIngredientAgainstDefinition(ingredient, definition):
   0. excludedCompounds  → raw substring, UNCONDITIONAL early exit   (protects "vegan sausage")
   1. definition id      → wordBoundaryIncludes  (whole-word)
   2. aliases            → wordBoundaryIncludes  (whole-word)
   3. derivedIngredients → substringIncludes     (RAW forward substring)   ◀── unsafe
   4. hiddenIngredients  → substringIncludes     (RAW forward substring)   ◀── unsafe
```

Raw forward substring was chosen deliberately, to "handle plurals and compounds for free":
`sausage` catches `sausages`, `cheese` catches `cheesecake`. But a raw substring also matches a
term that merely appears **inside** an unrelated word, and the library carries short terms. The
meat hidden-term `ragu` (an Italian meat sauce, 4 characters) is a substring of `aspa·ragu·s`:

```
resolveIngredientRestrictions("asparagus", [meat]) → [meat]    (sourceType: hidden_ingredient, value: "ragu")
```

This is the exact class the library's own authoring note warns of — *"`ham` here WOULD match
`chamomile`. Use for distinctive words (≥5–6 chars) and multi-word phrases only."* The short
cheese names `brie`/`edam`/`feta` were already moved to aliases for this reason (`edam` ⊂
`edamame`); `ragu` slipped through. Relocating terms one at a time is not a fix — the defect is
in the **matcher**, so the matcher is where SURF1C2 fixes it.

**Why it hid for so long.** It is a fail-**CLOSED** defect: it *over*-restricts. Four prior
safety workstreams (SURF1B–SURF1C1) were all hunting fail-**opens** — meals wrongly *allowed* —
so a meal wrongly *refused* never tripped an alarm. SURF1C1 found it only because it was
measuring why 52 authored recipes with plainly vegetarian ingredients were being denied labels.

---

## THE MATCHER FIX

One new function replaces `substringIncludes` for derived and hidden terms
(`shared/restrictions/restriction-resolver.ts`):

```ts
function boundaryAwareIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  let from = 0;
  for (;;) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return false;
    // The term must begin at a word boundary — this is what stops "ragu" ⊂ "asparagus".
    // What follows is unconstrained, so "sardine"→"sardines" and "cheese"→"cheesecake"
    // are preserved exactly as raw substring had them.
    if (!isWordChar(haystack[idx - 1])) return true;
    from = idx + 1;
  }
}
```

### Why word-START only, and not also word-END

This is the whole subtlety, and it is why the naive fix SURF1C1 rejected was wrong.

Every false positive shares one shape: the term sits **after a letter** — `aspa·ragu`s,
`c·ham`omile, `honey·dew`, `butter·nut`. So the **left** boundary alone removes all of them.

Constraining the **right** side as well — the naive "whole word or plural" rule — *also* removes
genuine compounds where the allergen **leads** the word. Measured directly during development, a
right-side rule dropped:

- `cheesecake` → dairy (it contains cream cheese — a **real** dairy match)
- `Breaded Plaice` → gluten (breaded means breadcrumbs — a **real** gluten match)

Dropping those is a fail-OPEN. Word-**start**-only keeps them (the allergen is a prefix, still
at a word boundary) and still kills `asparagus` (the term is an infix). It is the rule that fixes
the defect and introduces no fail-open.

### What did NOT change

- **`excludedCompounds`** keeps raw-substring matching. It is the plant-substitute early exit
  (`"vegan sausage roll"` exits the meat definition before any alias is seen), where a **broad**
  match is the safe direction. Tightening it could newly flag a plant substitute as meat — a
  false positive the mission forbids. Left exactly as-is.
- **Aliases** keep `wordBoundaryIncludes` (whole-word, both sides), unchanged since SURF1B4. This
  is why `ham`/`chamomile`, `soy`/`savoy`, `honey`/`honeydew` and `nut`/`butternut` were already
  safe — those terms are aliases, and SURF1C2 does not touch that path.
- **The restriction library** is not edited. `ragu` remains a hidden meat term. The matcher now
  handles it correctly, so no term is moved, added or deleted — one owner, no second copy.

---

## POSITIVE AND NEGATIVE CONTROLS

Every control is asserted in the test suite. Selected:

### Positive — must still match

| Ingredient | Restriction | Why it survives |
|---|---|---|
| `ragu` · `beef ragu` | meat | term at a word boundary |
| `ragù` · `pâté` | meat | diacritics folded to `ragu` / `pate` by `norm` |
| `sardines` · `prawns` · `eggs` | fish / shellfish / eggs | singular term at word start, plural `-s` follows |
| `2 eggs, beaten` · `beef, diced` | eggs / meat | punctuation is a boundary |
| `cheesecake` · `cheeseburger` | dairy | compound — the allergen leads the word |
| `breaded plaice` | gluten | compound — breaded = breadcrumbs |
| `almond`/`cashew`/`walnut`/`hazelnut butter` | tree_nut | real tree-nut butters |
| `plain`/`wheat`/`self-raising flour` | gluten | genuine flours |

### Negative — must not match

| Ingredient | Restriction | Why it is not a match |
|---|---|---|
| `asparagus` | meat | `ragu` is an infix (letter to its left) |
| `chamomile tea` | meat | `ham` is an infix |
| `honeydew melon` | honey | `honey` leads a single word; the alias path already rejects it |
| `butternut squash` | tree_nut | `nut` is an infix |
| `vegan sausage` · `mushroom ragu` · `quorn mince` | meat | plant substitutes — excludedCompounds early exit, intact |
| `oat milk` · `almond milk` | dairy | plant substitutes, intact |
| `peanut butter` | tree_nut | peanut is a legume, not a tree nut |
| `cornflour` | gluten | UK cornflour is cornstarch — gluten-free |

### Allergen protection preserved — the safety-critical controls

| Ingredient | Kept | Dropped |
|---|---|---|
| `peanut butter` | **peanut** (protection intact) | tree_nut (false positive) |
| `cornflour` | — | gluten (false positive) |
| `corn flour` / `wheat flour` / `flour` | **gluten** (all intact) | — |

No household loses a real protection. The two removed allergen matches were never correct: a
tree-nut-allergic household is not endangered by peanut butter (a legume), and a peanut-allergic
household is still protected by the `peanut` restriction, which matches `peanut butter` at a
word boundary exactly as before.

---

## LABELS REPUBLISHED

The classification was republished through its authorised writer (`npm run seed:cookbook`,
SURF1C1's derive-at-publication path) — no direct database write, and reproducible from the
committed cookbook JSON.

```
Vegan       220 → 237   (+17)
Vegetarian  325 → 350   (+25)
Unlabelled  175 → 150   (−25)
Labels ADDED: 42 · RETAINED: 545 · REMOVED: 0
```

Every one of the 42 added labels is attributable to the asparagus fix (the cornflour and
peanut-butter corrections touch the gluten and tree_nut restrictions, which do not enter the
Vegan/Vegetarian classification). Re-running the seed is idempotent: `ADDED 0 · RETAINED 587 ·
REMOVED 0`.

### The 52 asparagus recipes

| | Count | |
|---|---|---|
| Asparagus founding recipes | **52** | |
| Now labelled **vegan** | **17** | all-plant asparagus dishes |
| Now labelled **vegetarian** (17 of which also vegan) | **25** | includes the cottage-cheese-and-asparagus dishes (vegetarian, not vegan) |
| Still unlabelled | **27** | each contains **chicken** — correctly not vegetarian; asparagus is no longer the reason |

---

## DATA IMPACT

| | |
|---|---|
| **Code changed** | `shared/restrictions/restriction-resolver.ts` — one matcher function; two call sites |
| **Restriction library** | **Unchanged** — no term added, moved or deleted |
| **Rows written** | **500** founding cookbook rows, by their authorised writer, republishing derived labels |
| **Net label change** | +42 labels (17 vegan, 25 vegetarian); 0 removed |
| **User-owned rows** | **0 touched** — the seed's write is scoped `is_system_meal = true` |
| **Runtime safety behaviour** | Every meal is still gated on the way out; the change only stops *false refusals*. Across 3,252 ingredient lines × 13 restrictions: 0 matches added, 8 false matches removed |
| **Schema / migration** | **None** |
| **Dry run** | `npm run seed:cookbook:dry-run` — reported +42 / 0 removed, wrote nothing |

---

## TESTS

### New suite — **65 assertions, 0 failed** (`npm run test:surf1c2-canonical-restriction-matcher-boundary-safety`)

| § | Section | What it proves |
|---|---|---|
| 1 | **The defect** | `asparagus` matches no animal restriction by any path; an asparagus dish now passes the Vegan gate and is labelled vegan |
| 2 | **Positive controls** | 17 real terms, plurals, diacritics, punctuation and compounds still match |
| 3 | **Negative controls** | the four named infixes, plus 7 plant substitutes, do not match |
| 4 | **Allergen correctness** | peanut kept / tree_nut dropped for peanut butter; real tree-nut butters kept; cornflour dropped / genuine flours kept |
| 5 | **One owner** | source scan: a single boundary-aware matcher, naming no food; `ragu` still in the library, not relocated |
| 6 | **No fail-open** | across the WHOLE corpus, **0 matches added**; every removed match is a coincidental infix (none a word-start term); library self-test — every derived/hidden term still matches itself and its plural |
| 7 | **Live data** | the 52 asparagus recipes are eligible; no vegan/vegetarian-labelled system meal contradicts the gate |

### Regression — all green

| Suite | Result | | Suite | Result |
|---|---|---|---|---|
| `restriction-resolver` | 335 (fully green¹) | | `surf1b4-canonical-diet-pattern-safety` | 315 |
| `restriction-safety` | 75 | | `surf1b5-starter-meal-safety` | 84 |
| `ingredient-verification` | 22 | | `surf1c1-starter-cookbook-diet-classification` | **81** |
| `smart-suggest-restrictions` | 30 | | `cbk1-cookbook-seed` | 37 |
| `surf1b-dietary-restriction-safety-path` | 54 | | `planner-compliance` | 25 |
| `surf1b2-dietary-restriction-knowledge` | 173 | | `scoring` | 12 |
| `surf1b3-onboarding-allergy-routing` | 64 | | `intelligence-meals-binding` | 72 |

¹ The 3 `restriction-resolver` failures that pre-dated SURF1C2 (stale Phase-3 assertions in a
Phase-5 library) were retired in the SURF1C2 verification closeout — see
[`SURF1C2_VERIFICATION_CLOSEOUT.md`](./SURF1C2_VERIFICATION_CLOSEOUT.md). All three were
confirmed as obsolete assertions, not runtime defects: the library version pin (`3.` → `5.0.0`),
`findRestrictionById('fish')` (fish is now a real Phase-5 restriction), and an "unknown
restriction" test that used `fish` as its unknown placeholder. The suite is now 335 passed,
0 failed.

**SURF1C1 §5b was updated, not broken.** SURF1C1 pinned this defect with two assertions
*designed to fail the day it was fixed* (the comment reads *"If this now FAILS, the gate has been
fixed — re-run `npm run seed:cookbook`"*). SURF1C2 flips them into a permanent guard that the fix
**stays**: asparagus is now allowed for a vegetarian, and an all-plant asparagus recipe is now
labelled. **Typecheck: 0 errors in any SURF1C2 file.**

### Publication gate (`npm run verify:publication`)

Unchanged from SURF1C1's post-state: **60 checks, 24 passed, 24 warned, 12 failed** (6 domains,
all pre-existing and unrelated). `cb-diet-labels-derived` — SURF1C1's contract that every
published label equals what the classifier derives — still passes against the republished data.

---

## REMAINING GAPS

1. **The library still admits short derived/hidden terms.** SURF1C2 makes a short term *safe from
   infix false-positives*, but the authoring rule (≥5–6 chars for derived/hidden) still exists for
   a reason SURF1C2 does not fully remove: a short term that is a legitimate word **prefix** of an
   unrelated food would still match (e.g. a hypothetical 3-letter term leading a longer unrelated
   word). None exists in the library today — the self-test confirms every current term is safe —
   but the guard against future ones remains the authoring discipline, not the matcher. A linter
   that flags short derived/hidden entries would make it mechanical. Out of scope here.

2. **`corn flour` (two words) still matches gluten**, though corn is gluten-free. This is
   unchanged pre-existing behaviour — `flour` is a separate word, matched at a boundary — and it
   is the *safe* direction (over-restriction). SURF1C2 fixed only the one-word `cornflour`
   false-closed; the two-word case is a gluten-modelling question, not a matcher-boundary one.

3. **The 27 chicken-and-asparagus recipes remain unlabelled** — correctly. That is a content
   observation, not a defect: they are not vegetarian.

4. **`meal-service.ts` remains an unauthorised writer of `meals`** (CPI1 S2-1). Pre-existing,
   declared before SURF1B5, untouched — SURF1C2 adds no write path.

---

## GOVERNANCE

- **Architecture Bootstrap** — `docs/architecture/README.md` and the governing documents it names were read before implementation, along with `SURF1C1`.
- **No asparagus-specific exception.** The fix is a general boundary rule; the resolver names no food (asserted by source scan). It fixes the entire class, not one term.
- **No second matcher, no keyword list.** One function changed in the one canonical resolver. No new file, no new vocabulary.
- **Principle 2 (one owner per fact).** The restriction library remains the single owner of what meat, fish, dairy, eggs and honey ARE. SURF1C2 changes how a term is *matched*, never *what the terms are* — the library is not edited, and `ragu` is not relocated.
- **No weakened enforcement.** The new match set is a strict subset of the old: 0 matches added across the whole corpus, so no meal that was refused becomes allowed. Every removed match is a proven false positive, and every real protection (peanut, gluten flours, tree-nut butters, plant-substitute early exit) is preserved — asserted directly.
- **No UI change, no ready-meal enrichment.** The 309 title-only ready-meal rows are untouched; the resolver change and the cookbook republish are the only effects.
- **Product Registry Compliance** — no page, route, journey or capability created, removed or renamed. `docs/product/` does not exist, so there is no entry to update.
- **Experience & UI Governance** — no user-facing surface changes. A household simply sees asparagus meals correctly offered where its diet allows.

**The working tree was dirty on arrival** with uncommitted work from other sessions
(`publication-register.ts`, `seed-canonical-food.ts`, `client/src/index.css`, `tailwind.config.ts`,
`THA_UI_ARCHITECTURE.md`, `plant-classifier.ts` and others). **SURF1C2 did not touch, commit or
revert any of it.** The milestone commit contains only the files below.

### Files changed

| File | Change |
|---|---|
| `shared/restrictions/restriction-resolver.ts` | New `boundaryAwareIncludes`; derived and hidden ingredients matched boundary-aware instead of raw substring; header and matcher docs updated |
| `server/tests/test-surf1c2-canonical-restriction-matcher-boundary-safety.ts` | **New** — 65 assertions across 7 sections, including a whole-corpus fail-open proof and a library self-test |
| `server/tests/test-surf1c1-starter-cookbook-diet-classification.ts` | §5b flipped from *pinned defect* to *fix-holds guard* |
| `package.json` | `test:surf1c2-…` registered and wired into `npm test` |

**Data:** the founding cookbook classification was republished (`npm run seed:cookbook`), a
reproducible derivation from the committed JSON — not a hand-written database edit.

---

## ROLLBACK

```
git reset --hard rollback/SURF1C2-canonical-restriction-matcher-boundary-safety-20260714   # → 9e0b831d
```

The tag anchors code. The data change (42 added labels) is reproducible and reversible through
the authorised writer — reverting the matcher and re-running `npm run seed:cookbook` recomputes
the pre-SURF1C2 labels (the resolver would once again call asparagus meat, and the 52 recipes
would lose their labels). To restore only the pre-SURF1C2 labels without reverting code:

```sql
-- Not normally needed — the seed is the reproducible source of truth. Provided for completeness.
-- Re-running `npm run seed:cookbook` after any resolver state always republishes the correct labels.
```

Rolling back re-opens the fail-closed defect: asparagus is once again refused to every
vegetarian, vegan and meat-restricted household, and 52 founding recipes lose the labels their
ingredients earn.

---

*Implementation. 2026-07-14. A term is a word, not a run of letters.*
