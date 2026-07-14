# SURF1C1 — Canonical Starter Cookbook Diet Classification

**Session ID:** `SURF1C1_Starter_Cookbook_Diet_Classification`
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `rollback/SURF1C1-starter-cookbook-diet-classification-20260714` → `e2fa1fbc`
**Stage:** Complete
**Report:** [`docs/implementation/platform/SURF1C1_STARTER_COOKBOOK_DIET_CLASSIFICATION.md`](../../../docs/implementation/platform/SURF1C1_STARTER_COOKBOOK_DIET_CLASSIFICATION.md)

## Outcome

**Every diet label THA held was on a meal it could not prove; every meal it could prove had
no label at all.** The 500 authored Founding Cookbook recipes — the only system meals with real
ingredient lists — carried **zero** labels. All 204 existing labels sat on the 309 ready-meal
rows, whose `ingredients` is a literal echo of the meal's own name.

- **545 labels published** across the 500 recipes (220 vegan, 325 vegetarian), each derived from
  that recipe's own ingredients by the one canonical classifier.
- **0 removed, 0 contradictions** (749 labels now checked against the gate, was 204 checked vacuously).
- **All six starter slots** now fill from label-matched proven meals; SURF1B5 had five of six
  backfilling from unlabelled food.
- **Safety behaviour unchanged to the meal** — 394 refused to a live vegan household, exactly
  SURF1B5's number.

## Ownership

`meals.dietTypes` for the starter cookbook is owned by the committed JSON
(`data/cookbook/tha_original_founding_cookbook_500/`), publication domain `cookbook-500`
(knowledge variant), authorised writer `scripts/import-tha-founding-cookbook-500.ts` only.
The label is **derived at the publication path**, never stored in the owner and never
backfilled directly into the DB. New gate `cb-diet-labels-derived` makes it a permanent contract.

## Next action

None — complete. **Recommends the asparagus/`ragu` defect next**: the canonical library matches
hidden meat terms by forward substring, so `ragu` matches inside `aspARAGUs` and asparagus is
classified as meat. It refuses every asparagus meal to every vegetarian, vegan and
meat-restricted household (a fail-**closed** defect, which is why four fail-open workstreams
missed it) and costs 52 founding recipes their labels. Pinned by a test; **needs a safety-gate
regression budget** — the naive word-boundary fix would break `sardines`/`prawns`/`eggs` and
open major-allergen holes.
