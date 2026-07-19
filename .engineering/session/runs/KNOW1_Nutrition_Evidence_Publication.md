# Session: KNOW1_Nutrition_Evidence_Publication

| Field | Value |
|---|---|
| **Session ID** | `KNOW1_Nutrition_Evidence_Publication` |
| **Rollback ID** | `rollback/KNOW1-nutrition-evidence-publication-20260718` |
| **Start time** | 2026-07-18T22:00Z UTC |
| **Current stage** | Complete — awaiting owner review |

## Objective
Activate Food Intelligence by verifying the nutrition evidence publication
pipeline and implementing the smallest architectural change that safely publishes
reviewed evidence — **without weakening the Trust Gate**.

## Rollback protection
- Tag **and** branch `rollback/KNOW1-nutrition-evidence-publication-20260718` → `8e25c195` (HOUSE_ACT3)
- **Coverage:** committed state only. The working tree carried 22 modified tracked
  files and ~40 untracked paths from concurrent sessions at start; those were **not**
  snapshotted and **not** disturbed. This session touched only the 3 files below.

## The finding
The mission offered five candidate blockers. **Four already exist and work** —
review workflow, `reviewed_at`/`reviewed_by` lifecycle, evidence ownership, and a
governed publication process (`npm run knowledge:signoff`, the sole writer of
`reviewed_at`). The blocker is **missing publication**, literally: the step exists,
is correct, and **has never been run**.

    64 claims carry valid NHS citations and are publishable now
    → 89 benefit chips across 29 foods, through the existing gate

It stayed invisible because `CANONICAL_PUBLICATION_ARCHITECTURE.md` defines the
**knowledge** variant by one property — *"Published rows are reviewed"* — and
**that verification was declared and never built**. The `food-knowledge` contract's
six checks never read `reviewed_at` or `source_refs`. Rule KC8 holding inside the
document that names Rule KC8.

**Correction to HOUSE_ACT3:** it counted `0 of 3,354 reviewed` and called the whole
thing curation. A row count cannot separate *no citation* (3,299 — curation) from
*citation, no signature* (64 — publication, one command). The publishable backlog
was filed behind the unresearched one.

## What was done
1. `server/verification/publication-register.ts` — domain 23 `nutrition-evidence`,
   five live checks. Backlog and curation gap reported **separately** by design;
   `ne-gate-intact` makes gate-weakening a detected failure; `ne-review-identity`
   grandfathers pre-KNOW5 anonymous sign-offs at the `2026-07-09` boundary (zero
   false alarms today, `fail` severity).
2. `server/intelligence/food-intelligence/engine.ts` — Rule E1 docstring claimed
   *"no code path can produce an uncited recommendation"*. **False** for the
   nutrient scope (`getFoodsForNutrient` is ungated; `getFoodsForBenefit` is not).
   Scope limit stated.
3. `docs/implementation/knowledge/KNOW1_NUTRITION_EVIDENCE_PUBLICATION.md` — report.

**Not done, deliberately:** the 64 sign-offs. A sign-off is a named human taking
responsibility for a health claim (Rule KC9); doing it under an assistant's name is
the rubber stamp the gate exists to forbid. Put to the user, who chose verification
without sign-off.

## Verification
- `verify:publication` — domain `needs-attention`; both `fail` checks **pass**;
  platform failures unchanged at 4.
- `test:knowledge-evidence-gate` 116/0 · `test:know5-evidence-contract` 111/0 ·
  `tsc --noEmit` clean on touched files.
- No row written, no gate altered, no household-facing behaviour changed.

## Next action
**F1 — the owner runs the sign-off.** Dry-run `npm run knowledge:signoff`, review the
49 NHS composition citations and 15 nutrient→benefit claims, then
`-- --confirm REVIEWED --reviewer "Name"`. `ne-published-chain` then moves off zero.

Then **F2** (gate `getFoodsForNutrient` — *after* F1, never before: gating it while
0 composition rows are signed off empties every nutrient page). Full gap list F1–F6
in the report.
