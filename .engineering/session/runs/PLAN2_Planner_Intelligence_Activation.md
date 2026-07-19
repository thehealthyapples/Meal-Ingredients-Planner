# Session: PLAN2_Planner_Intelligence_Activation

| Field | Value |
|---|---|
| **Session ID** | `PLAN2_Planner_Intelligence_Activation` |
| **Rollback ID** | `rollback/PLAN2-planner-intelligence-activation-20260719` → `f7b0fa06` (full tree: tracked + untracked) |
| **Start time** | 2026-07-19 |
| **Current stage** | Complete |

## Objective
Surface the EXISTING Food Intelligence, Household Nutrition and Opportunity Platform
throughout the planner; explain planner decisions; remove duplicate planner intelligence.
No new planner, no new intelligence engine — activation only.

## Files being modified
**Created (2)**
- `server/tests/test-plan2-planner-intelligence-activation.ts` — 22 assertions
- `docs/implementation/planner/PLAN2_PLANNER_INTELLIGENCE_ACTIVATION.md`

**Modified — production (4)**
- `client/src/components/SmartReviewPanelContent.tsx` — renders PLAN1's evidence trail
- `client/src/pages/weekly-planner-page.tsx` — `nutrition` domain on the existing mount;
  4 dead imports removed
- `client/src/hooks/use-smart-suggest.ts` — withheld counted apart from failed
- `server/routes.ts` — smart-apply gate returns a human `withheldNote`

**Modified — config (1)**
- `package.json` — `test:plan2-planner-intelligence-activation` registered

## Checkpoints
- [x] `git status` confirmed — 53 dirty entries (sibling NUTPLAN/KNOW2 work + this
      session's completed HNP2)
- [x] Full working-tree snapshot rollback ref created and resolved
- [x] Snapshot integrity verified — captures HNP2's uncommitted work (a HEAD-only tag
      would protect none of it); HEAD unmoved; tree still dirty
- [x] Investigation complete (two survey agents; every headline verified first-hand)
- [x] Implementation — 4 activations, all reading existing owners
- [x] `npx tsc --noEmit` — 88 before, 88 after. Zero new
- [x] `npm run build` — exit 0 (the gate a server-side suite cannot be for React changes)
- [x] `test:plan2-planner-intelligence-activation` — 22 passed, 0 failed
- [x] `test:prod6-safety-gate-convergence` — 158 passed (a compliance path was touched)
- [x] `test:planner-compliance` 25 · `test:plan1-planner-intelligence` 58 ·
      `test:hnp2-*` 43 · `test:mat1-*` 25 · `test:restriction-safety` 75 — all 0 failed
- [x] Registered in the `npm test` chain
- [x] Implementation report written

**Last checkpoint:** Complete. Implementation, tests, verification and report all done.

## Next action
None — activation is complete. Two items await the owner: the `PLAN2` ID collision (G1)
and whether to restore the reverted PLAN2 implementation behind its own gate (G2).
Report: `docs/implementation/planner/PLAN2_PLANNER_INTELLIGENCE_ACTIVATION.md`.

## Open question for the owner (raised 2026-07-19, not blocking)
**The `PLAN2` ID is already taken.** `docs/implementation/planner/PLAN2_INTELLIGENT_PLANNER_EVOLUTION.md`
(2026-07-12) holds it, and that document itself argues at length that an EWO ID is what
makes a document findable and orderable (`REPOSITORY_CONVENTIONS.md` §3) — it was renamed
PLAN1→PLAN2 for exactly this reason. The mission asks for a second `PLAN2_*` file.

Worse, that workstream looks half-landed: its suite `server/tests/test-plan2-planner-evolution.ts`
fails on `SyntaxError — no export INTELLIGENCE_SHARE` and is **not registered in `npm test`**
(0 hits in `package.json`). It is one of the seven orphaned tests P0 Food Intelligence
Recovery listed as a standing blocker. Verified first-hand, both facts.

Options: file as **PLAN3**, or supersede/correct the existing PLAN2 in place.
Proceeding with investigation meanwhile; the naming does not change the engineering.

## MAJOR FINDING (verified first-hand 2026-07-19) — PLAN2 was implemented, then REVERTED

Not the failure mode P0 recorded. P0 logged PLAN2 as "half-landed... test imports exports
that were never written." **That diagnosis is wrong.** The exports WERE written, verified,
and then silently reverted on 2026-07-13 — 1,579 lines across 7 files.

Proof (run directly, not taken from any document):
- `git show de0062c9:server/lib/meal-scoring-service.ts` → `export const INTELLIGENCE_SHARE = 0.3`
  at :125, `export const SCORE_WEIGHTS` at :101, `export function scoreIntelligence` at :211.
- Today those symbols appear ONLY inside the orphaned test file. The implementation is gone.
- The work is **recoverable**, not lost: `git show de0062c9:<path>` yields all seven files.

**The three defects PLAN2 claims to have fixed are all still live** — verified by reading
the current tree:

| Defect | Status today | Evidence |
|---|---|---|
| Two owners of a candidate's score | **LIVE** | `smart-suggest-service.ts:90` `COMPATIBILITY_RANKING_BONUS = 10`; `:915-918` `adjustedScore = score + compatBonus` on top of `meal-scoring-service`'s score |
| Two disagreeing weight tables | **LIVE** | `SCORE_WEIGHTS` (dietMatch 22, goalAlignment 13, budget 13, upf 13, variety 13, overlap 8, simplicityBonus 13) vs `WEIGHT_MAX` (25/15/15/15/15/10, **no simplicityBonus**) |
| Unreachable explanation branches | **LIVE** | `explainability-service.ts:194` tests `bd.goalAlignment >= WEIGHT_MAX.goalAlignment` — i.e. `13 >= 15`, which can never be true, so that explanation can never fire |

The third is a live user-visible defect: explanation branches that are dead by arithmetic.

## Blockers

**B1 — 🟠 Scope boundary needs the owner's call.**
The weight-table convergence and the two-score-owner fix are squarely Objective 5 ("remove
duplicate planner intelligence where discovered") — they are one fact with two owners. But
fixing them CHANGES WHICH MEAL THE PLANNER CHOOSES (the original PLAN2 rated itself
🔴 RED for exactly this), which reads against the Scope Lock's "only activate existing
intelligence". Activation and meal-selection change are different risks and probably
different workstreams. Escalated, not assumed.
