# SURF1B4 — Canonical Diet Pattern Safety Convergence

**Session ID:** `SURF1B4_Canonical_Diet_Pattern_Safety_Convergence`
**Stage:** Complete
**Rollback ID:** `rollback/SURF1B4-canonical-diet-pattern-safety-convergence-20260714` → `eb77aadc`
**Started:** 2026-07-14
**Recovered:** 2026-07-14 (Claude disconnected mid-workstream; this run file did not exist and was written at recovery)
**Report:** [`docs/implementation/platform/SURF1B4_CANONICAL_DIET_PATTERN_SAFETY_CONVERGENCE.md`](../../../docs/implementation/platform/SURF1B4_CANONICAL_DIET_PATTERN_SAFETY_CONVERGENCE.md)

---

## Mission

Converge the Vegan and Vegetarian **diet patterns** onto the canonical restriction
library, retiring `dietRules`' private meat/fish keyword lists — the second owner of
"what is meat" that SURF1B2 pinned rather than merged, and named as the first thing to
do next.

---

## State found on recovery

No run file, no implementation document, no dashboard row. The rollback tag existed and
the working tree held a **complete, coherent, passing** implementation:

- `shared/dietRules.ts` — keyword lists deleted, delegates to the canonical library
- `shared/restrictions/restriction-library.ts` — v5.0.0 (cheeses, dish names, compounds)
- `shared/restrictions/restriction-resolver.ts` — punctuation boundaries + diacritic folding
- `household-dietary-safety.ts` · `smart-suggest-service.ts` · `routes.ts` · `meals-page.tsx` — pass fields, not a blob
- `test-surf1b4-…` — new, 315 assertions, passing
- 4 sibling tests + `package.json` — updated
- **Implementation document — missing**

## Work completed after recovery

1. This run file (recovery-protocol artefact — did not exist).
2. Verification, none of which had been recorded:
   - Typecheck — **0 errors in any SURF1B4 file**.
   - Focused suite — **315 passed, 0 failed** (incl. 48,128 live gate decisions).
   - Regression — **11 suites, 571 assertions, 0 failed**.
   - Live probe of the **label** path (starter meals / `dietTypes`), which the pattern
     convergence does not reach — see limitations 1 and 2 in the report.
3. Assessment of the three surviving meat-keyword lists — each proved to be scoring,
   labelling or presentation, never a gate.
4. The implementation report.
5. Clean milestone commit — SURF1B4 files only.

## Unrelated dirty work — PRESERVED, NOT TOUCHED

`plant-classifier.ts`, `publication-register.ts`, `notice-gateway.ts`,
`seed-canonical-food.ts`, `migrations/runner.ts`, `setup-test-database.ts`,
`seed-know1-residue.ts` (deleted), `test-know5-*`, `test-knowledge-food-ownership`,
`.replit`, `docs/architecture/*`, `CURRENT.md` (hook heartbeat only), and every untracked
file (HHP3, PLAN2, CBK2, PANTRY1, SHOP1, NTC_P2, PUB1, CPV1, PX1, DCA1, PDA1…).
**Not absorbed, not committed, not reverted, not modified.**

---

## Next action

None — complete.

**Recommends next:** report limitation 1 — the onboarding starter-meal backfill
(`meal-service.pickMealsWithBackfill`) tops a vegan's breakfast list up from all system
meals when too few carry the label. Live: only 2 of 99 breakfast meals are labelled
`vegan` (6 required), so the backfill fires into a pool holding 61 meals the canonical
gate would refuse. It is in the **label** path, not the pattern path, and needs its own
regression budget.
