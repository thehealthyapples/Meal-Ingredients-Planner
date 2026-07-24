# NUT_VERIFY2 — Canonical Resolution Completion

**Session ID:** `NUT_VERIFY2_Canonical_Resolution_Completion`
**Objective:** Extend canonical ingredient parsing so descriptor-rich lines resolve, preserving exact-key canonical ownership.
**Rollback ID:** `rollback/NUT_VERIFY2-canonical-resolution-completion-20260718` → `fc9423ff`
**Stage:** Complete — awaiting owner review
**Started:** 2026-07-18

---

## Rollback

Tag on `fc9423ff` (BUS1, following NUT_VERIFY1). Concurrent sessions' work **not** captured; all five target files were clean at tagging. Baseline: build 🟢, NUT_VERIFY1 43/0.

## Checkpoints

- [x] Architecture Bootstrap · NUT_VERIFY1 · Canonical Publication Architecture · SoT Register read
- [x] Rollback created and reported
- [x] Pipeline traced; three distinct gaps identified (prep vocabulary, multiplier form, no leading-descriptor handling)
- [x] **Measured the seed first** — colours are IDENTITY, not descriptors
- [x] One descriptor vocabulary created; parser and resolver extended
- [x] **Caused three suite regressions, proved they were mine, fixed the boundary**
- [x] 81 new assertions + 12 promoted; registered into `npm test`
- [x] **Browser-verified 32/30 → 39/30**
- [x] Report filed

## Root cause

`parseIngredient` removed quantity and unit but **never descriptors**, so `"400g tin chickpeas, drained"` → `"tin chickpeas drained"`, which the exact-key index correctly does not hold. Three gaps: incomplete trailing-prep vocabulary, the unparsed `1 x 400g` multiplier form, and no leading-descriptor candidates anywhere.

**The resolver was not at fault** — exact-key matching is deliberate and is preserved untouched.

## The safety finding

Measured against the live seed **before** designing: `red cabbage` → group `red-cabbage`; `cabbage` → group `cabbage`; `black pepper` → `black-pepper`; `pepper` → `pepper`. Four foods, two pairs. **Colours are identity and are never peeled** — by list, and structurally by faithful-key-first ordering.

## The boundary I crossed and fixed

Folding peeling into `ingredientKeyVariants` broke `canonical-food`, `NK6R` and `NK6S`: `smoked-cheese` reduced to `cheese`, `ground-coffee` to `coffee`, `baby-spinach` to `spinach`, so `validateCanonicalSeed()` reported six real seed entries as ambiguous. **Proved mine by stash-comparison against the tag** (46/0, 161/0, 97/0 there).

`ingredientKeyVariants` restored byte-for-byte; peeling moved to `freeTextIngredientKeyVariants`, used only by `resolveCanonicalFood`. **Free text may peel. Identity may not.** Pinned by §6b.

## Results

**On screen: 1 → 32 → 39 plants** (43 plant ingredients). Cookbook: 1 → 31 → **38**. New suite **81/0**; NUT_VERIFY1 **55/0**; all 12 related suites match their tag baselines; build 🟢; tsc 94 unchanged. **No client file, no seed row, no scoring change.**

## Next action

**Owner to review** `docs/implementation/nutrition/NUT_VERIFY2_CANONICAL_RESOLUTION_COMPLETION.md`.

Manual steps 2 (red cabbage vs cabbage) and 3 (unknown ingredient) **not executed through the UI** — proven by unit test only. Nutrients tab not re-verified.

Recommended next: **`NUT_VERIFY3 — Compound Ingredient Resolution`** — R1 "A or B" lines (`600ml semi-skimmed milk or unsweetened oat milk`), where the remaining unresolved lines actually live, and **R2: `getPlantCategory` is still fed the display key, which is why Legumes stays unticked though chickpeas and lentils now resolve.** Also still open: **R3** the two server counters SoT Domain 22 names as deduping on the slug, and **R4** the architecture docs contradicting themselves on M4 / publication status.
