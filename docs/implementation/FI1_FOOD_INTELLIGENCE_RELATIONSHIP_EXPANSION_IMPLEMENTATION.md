# FI1 — Food Intelligence Relationship Expansion (Implementation)

**Date:** 2026-07-05
**Branch:** `int1-intelligence-platform`
**Governing architecture:** `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`,
`docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (PKC Phase 0 evidence gate),
`docs/architecture/README.md` (Architecture Bootstrap).

## Mission

Expand the existing Food Intelligence by **enriching** canonical foods with higher-value
relationships and evidence — **not** by adding duplicate data or new food rows.

## Guiding constraints (from the mission + governing architecture)

- **Extend existing foods** — enrich foods already in the registry.
- **Improve evidence** — add sourced, authorised citations to existing claims.
- **Improve relationships** — strengthen the food↔nutrient↔benefit graph.
- **Improve practical guidance** — add curated "why" context that surfaces to the user.
- **Preserve one canonical food** (WS2F invariant) — one plant = one canonical food.
  No new `CANONICAL_SEED` rows, no new `FOOD_SEED` rows, no aliases-as-foods.
- **Citations only** (Rule KC7/KC8) — a new source may only cite a nutrient↔benefit link
  that *already* exists; it may never introduce a new claim.
- **Candidate, not published** (Rule KC9) — seeds author candidates; the human sign-off
  gate (`npm run knowledge:signoff`) alone sets `reviewed_at`. This work does not publish.

## Rollback protection (created before implementation)

- **Git tag:** `pre-FI1-relationship-expansion` at `ff3b2cf` (HEAD before any edit).
- **File backups** (scratchpad `FI1_rollback/`): `nutrition-context.ts.bak`,
  `claim-sources.ts.bak`, `relationships.ts.bak`.
- **Restore:** `git checkout pre-FI1-relationship-expansion -- <file>` or copy the `.bak`
  files back. All three edited files are pure editorial seed data — restoring them fully
  reverts this work with no schema or code change.

## What changed (three editorial seed files only — no code, no schema)

### 1. Practical guidance — `shared/canonical/nutrition-context.ts` (+22 foods)

Added short, evidence-based, educational context lines for 22 signature canonical foods
that previously had none: broccoli, kale, cauliflower, red-cabbage, brussels-sprouts,
carrots, sweet-potato, beetroot, garlic, onion, potato, kidney-beans, black-beans,
butter-beans, almonds, pumpkin-seeds, apple, orange, basil, turmeric, ginger, olives.
Coverage: **10 → 32 canonical foods**.

Each line explains the *why* behind a nutrient or relationship already present in the
registry (e.g. beta-carotene absorption in carrots; allicin formation in garlic; kidney-bean
cooking safety). It follows the existing WS2F rules: short, evidence-based, educational,
non-medical, keyed by a real canonical slug.

**Why this is high value:** `NUTRITION_CONTEXT` is read by three live surfaces — the
Companion conversation (`server/intelligence/conversation/nutrition-enrichment.ts` →
"Worth knowing about X"), the FI3 recommendation engine
(`server/intelligence/food-intelligence/engine.ts` explanation lines), and the Food Report
(`buildFoodReport`). It renders **immediately** — no sign-off gate — so every one of these
22 foods now produces a richer Companion answer.

### 2. Evidence — `shared/knowledge/claim-sources.ts` (+8 sourced claims)

Added authorised **EFSA (Reg (EU) No 432/2012)** / NHS sources to eight existing
nutrient↔benefit links across four benefit families that previously carried no citation:

| Nutrient | Benefit | Authorised claim (EFSA, unless noted) |
|---|---|---|
| Vitamin C | Skin health | "…contributes to normal collagen formation for the normal function of the skin" (+ NHS) |
| Zinc | Skin health | "…contributes to the maintenance of normal skin" |
| Vitamin A | Skin health | "…contributes to the maintenance of normal skin" |
| Vitamin A | Eye health | "…contributes to the maintenance of normal vision" |
| Potassium | Muscle recovery | "…contributes to normal muscle function" |
| Magnesium | Muscle recovery | "…contributes to normal muscle function" |
| Magnesium | Mood support | "…contributes to normal psychological function" |
| Vitamin B6 | Mood support | "…contributes to normal psychological function" |

These are **citations only** — every pair already existed in `NUTRIENT_BENEFITS`. They are
**candidate-stage**: seeding does not render them; a human must run `npm run knowledge:signoff`
to publish (Rule KC9). This strengthens the relationship graph from *plain editorial link* →
*evidence-backed candidate* for four more benefit families (Skin / Eye / Muscle / Mood),
extending the launch set (Heart / Gut / Bone / Immune / Energy).

### 3. Relationships — `shared/knowledge/relationships.ts` (garlic)

`garlic` was under-linked (`allicin`, `manganese` only). Added two well-established,
textbook nutrient links: **vitamin B6** and **vitamin C**. `allicin` remains rank 0 (the
signature compound). Garlic's Food Report key nutrients go from 2 → 4.

## Validation

All run from repo root.

### Seed integrity (the registry can never seed inconsistently)

```
validateKnowledgeSeed()  → 0 problems
validateCanonicalSeed()  → 0 problems
```

### Automated tests

- `npm run test:food-report` — **124 passed, 1 failed** (up from 102 passed). The 22 new
  context keys all pass the referential-integrity check. The single failure
  (`lentils: Green has no additionalNutrients`) is **pre-existing** in the working tree
  (green-lentils was wired to WS0 by earlier uncommitted work) and unrelated to this change.
- `npm run test:knowledge-evidence-gate` — **104 passed, 0 failed** (up from 100). The 8 new
  sourced claims register correctly as candidate-stage.
- `npm run test:nutrition-enrichment` — **22 passed, 0 failed**; `npm run
  test:intelligence-food-intelligence-binding` — **36 passed, 0 failed**;
  `npm run test:food-report-evidence` — **31 passed, 0 failed**;
  `npm run test:intelligence-nutrition-knowledge-binding` — **37 passed, 0 failed**.

  Two of these suites used `broccoli` as their *"food with no curated context line"*
  honest-gap fixture — a food FI1 legitimately enriched. Each was repointed to `celery`
  (a canonical food FI1 deliberately left without a context line), preserving the test's
  original intent. No production assertion was weakened.

### Richer Companion responses (proven end-to-end through production code)

Driving the real Companion path (`buildNutritionEnrichment`) with the nutrition-knowledge
result shape the gateway passes in:

| Food | Before | After |
|---|---|---|
| Garlic | *(enrichment empty)* | ▸ "Worth knowing about Garlic — Allicin forms when garlic is crushed or chopped — letting it stand for about ten minutes before cooking lets more of it develop." · keyNutrients **Allicin, Manganese → + Vitamin B6, Vitamin C** |
| Broccoli | *(enrichment empty)* | ▸ "…Chopping broccoli and letting it stand for a few minutes before light cooking helps preserve sulforaphane; steaming keeps more of it than boiling." |
| Turmeric | *(enrichment empty)* | ▸ "…The colour compounds in turmeric are better absorbed alongside a little black pepper and some fat." |
| Kidney Beans | *(enrichment empty)* | ▸ "…Dried kidney beans must be boiled hard for at least ten minutes before simmering to be safe to eat; tinned kidney beans are already cooked." |
| Apple | *(enrichment empty)* | ▸ "…Much of an apple's fibre and flavonoids are in the skin, so eating it unpeeled keeps more of them." |

Before this change all five produced no Companion enrichment (verified against the backup
`nutrition-context.ts.bak`). Every "After" line is the same content the Food Report displays —
one mouth, no fabrication.

## Architecture compliance

- ✅ Uses the canonical owners only; no new data store, no duplicate data, no new food.
- ✅ One canonical food preserved (WS2F) — zero `CANONICAL_SEED` / `FOOD_SEED` additions.
- ✅ Evidence is citations-only over existing links; candidate-stage; sign-off untouched (KC7/KC9).
- ✅ Honest gaps preserved — foods without a curated line still surface nothing.
- ✅ No second assistant, no conversation-state duplication, no schema change.
