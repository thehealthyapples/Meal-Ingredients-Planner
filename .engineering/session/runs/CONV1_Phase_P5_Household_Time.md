# CONV1 Phase P5 — Household Time: the module and the zone

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/CONV1-phase-p5-household-time-20260716` → `fed6dcaf`
**Type:** Git tag on a preservation commit, created **before any P5 file was touched**.

> ✅ **The tag is a true restore point** — unlike P1–P4's markers, the preservation commit
> `fed6dcaf` captured every previously-uncommitted change (P4's converted suites + completion
> report, ODL2 run file) first. `git checkout` of the tag loses nothing.

**Scope:** CONV1 Phase **P5** only — `OWN-4` → `OWN-3` → `SCH-1`.
No P6+ work, no unrelated refactoring. Governed by `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`
(HT1–HT18), which is **in force since 2026-07-16** and DECLARED, NOT BUILT (§ 17).

---

## Mission

Implement CONV1 Phase P5: Household Time Phases 1, 1a, 2 — the module
(`shared/time/household-time.ts`), the season convergence (3 → 1), and the zone
(`households.timeZone`). Gate: **HT18 — no second implementation exists** (module scope);
verification entry lands with the module in the same change (TIME3 § 16).

## Pre-work checkpoints

- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1_PHASE_P4_COMPLETION.md` read — P4 complete ⇒ P5 is the programme's own next phase
- [x] `CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md` read — § 3 Tier 3 (OWN-4, OWN-3, SCH-1), § 4, § 7 (P5 row)
- [x] `TIME1` read (design reasoning) · `TIME2` read (consumer evidence, corrections)
- [x] GOVTIME1 **does not exist** (CONV1 § 0.3) — `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` read in full in its place
- [x] `git status` confirmed (branch `int1-intelligence-platform`; dirty tree preserved by `fed6dcaf`)
- [x] Rollback tag created **before any file was touched**
- [x] Baseline measured, not inherited (CP11) — see below
- [x] Rollback tag re-verified this session: annotated tag object `f2896013` → commit `fed6dcaf` = HEAD

## Baseline — measured at `fed6dcaf`, 2026-07-17 (CP11)

| Gate | Baseline |
|---|---|
| `verify:publication` | **FAIL** — 22 domains: 🟢6 · 🟡12 · 🔴4; 60 checks: 34 pass · 20 warn · 6 fail |
| `verify:coherence` | **PASS** — 0 failed, 0 warned |
| `typecheck:ci` | **32 regressions** (pre-existing debt; P4 recorded 33 — one closed by a concurrent session. Measured, not inherited) |
| `adoption:check` | **2 fails** (pre-existing: `button-primitive`, `HouseholdNutritionPanel` orphan) · 1 notice · 65 pass |
| `npm run build` | **passes** |

## Governance decision settled — `OWN-3`'s owner (was open; CONV1 § 9)

CONV1 § 9 explicitly refused this choice: *"Choose the season rule's owner — Domain 11 as
declared, or the Register corrected to name Domain 8's file. **A governance decision, not
CONV1's**."* **Put to the user 2026-07-17; decided: Domain 11, as declared.**

**A load-bearing fact CONV1 did not record:** its Option A is **not implementable as literally
stated**. `shared/seasonal/engine.ts` (the declared owner) **already imports**
`../discovery/engine` (`:32`), which imports `./seasonal-map` (`:23`). Making `seasonal-map.ts`
import the rule back from the declared owner is a **circular import**. Same for
`stories/engine.ts` (imported at `:33`).

**Resolution:** the rule is extracted to a **leaf module inside Domain 11's own folder** —
`shared/seasonal/season-rule.ts`, importing nothing but a type. All three implementations consume
it. **No ownership moves** (Register Rule 7 not triggered; P4's precedent — converge ONTO the
declared owner); the Register's Domain 11 row gains a file-path citation only. This is the class
CONV1 § 10 itself records for `OWN-3`: *"a reference vocabulary beside the spine"*.

## Constraints in force (HT1–HT18; CP5–CP10)

1. **HT5** — `now` is a parameter, never an ambient read. The module reads no clock.
2. **HT6** — totality: `anchored: false` is a first-class answer; never throws.
3. **HT8** — declare, never renumber: `dayOfWeek` stays `0 = Sunday`; week starts Monday.
4. **HT17** — season is NOT Household Time: the season rule stays outside the module;
   the module supplies its input, never its answer.
5. **HT18 / CP10** — verification = no second implementation exists; the gate entry
   lands with the module in the same change.
6. **CP6** — the five MUST-NOT-consume domains (Trial/Auth, Learning, Caching,
   Observation, Decision) are untouched, permanently.
7. **SCH-1** is additive and nullable; `Europe/London` is a *declared* default with
   provenance (CP8), never silent fabrication. No consumer converts in P5 (that is P6).
8. No new dependency — `Intl` suffices (TIME3 Phase 1).

## Progress

- [x] Rollback protection (`fed6dcaf` preservation commit + annotated tag)
- [x] Baseline gates measured
- [x] OWN-4 — the module + tests + HT18 verification entry + Register status correction
- [x] OWN-3 — season 3 → 1; owner inversion settled (user decision) and documented
- [x] SCH-1 — `households.timeZone` (schema + migration + signup detection + correction path)
- [x] Gates re-run · affected suites green · completion report filed

## Outcome

**COMPLETE.** All three workstreams closed in the approved sequence. Gate met: **HT18 — no second
implementation exists**; the `household-time` publication domain is 🟢 healthy (7/7), and its
ratchets were **mutation-tested** (each fails when its shape returns). 15 affected suites, 0
failures. `typecheck:ci` 32 = baseline (0 added); `adoption:check` 2 pre-existing fails (0 added);
coherence PASS; build passes. Publication: 22→23 domains, 🟢6→🟢7, reds unchanged at 4.

Report: `docs/implementation/governance/CONV1_PHASE_P5_COMPLETION.md`.

Three defects were found in my own work by the discipline and fixed before landing (report § 5):
an **inverted sort comparator** in `resolvePlannerWeek` (plus the weak test that missed it —
strengthened and mutation-tested), a **false positive in my own HT4 gate** (rewritten to parse each
table's block), and a wrong test assertion about the epoch's week. A **stale-server trap** (the
`DEV1` failure mode — `EADDRINUSE`, old process serving) was caught during live verification; the
original dev server on `:5000` was preserved.

## Next action

None — complete. Recommends **CONV1 P6** (`READ-4` → `BEH-6` → `SCH-4` → the greeting ×4). P5
cleared its runway: module + zone exist, no anchor needed, and `anchored:false` guarantees a floor.
**Name `R3` at P6's start, not `R1`:** P5 built an owner with zero consumers, and an owner nobody
imports is what `OWN-3` just spent a phase fixing.

## Files touched (rollback list — keep current)

**Code (new):**
- `shared/time/household-time.ts` (OWN-4 — the module)
- `shared/seasonal/season-rule.ts` (OWN-3 — the season rule, Domain 11's leaf)
- `server/tests/test-time3-household-time.ts` (73 assertions)

**Code (modified):**
- `shared/discovery/seasonal-map.ts` · `shared/seasonal/engine.ts` · `shared/stories/engine.ts` (OWN-3 — delegate)
- `shared/discovery/types.ts` · `shared/stories/types.ts` (OWN-3 — `UKSeason` re-export, not re-declare)
- `shared/schema.ts` (SCH-1 — `households.timeZone`)
- `server/migrations/runner.ts` (SCH-1 — `2026-07-17_conv1_p5_household_time_zone`, **applied**)
- `server/storage.ts` (SCH-1 — `createUser`/`createDemoUser` detection; `setHouseholdTimeZone`)
- `server/auth.ts` (SCH-1 — register + demo/start accept the detected zone)
- `server/routes.ts` (SCH-1 — POST/GET `/api/household`; `PATCH /api/household/time-zone`)
- `client/src/hooks/use-user.ts` (SCH-1 — `Intl` detection at signup)
- `server/verification/publication-register.ts` (OWN-4 — the HT18 domain, 7 checks)
- `server/tests/test-intelligence-household-binding.ts` (fixture `timeZone: null`)
- `package.json` (suite registered + wired into aggregate `test`)

**Governing documents (status/citation corrections only — no ownership changed, Rule 7 not triggered):**
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Appendix A · Domain 16 · Domain 11 · listing)
- `docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (header + § 17)
- `docs/architecture/README.md` (the Bootstrap's stale "does not exist" claim)

**Report / session:**
- `docs/implementation/governance/CONV1_PHASE_P5_COMPLETION.md` (new)
- `.engineering/session/CURRENT.md` (dashboard row)
- `.engineering/session/runs/CONV1_Phase_P5_Household_Time.md` (this file)

⚠️ **The migration is applied** — reverting P5's code does not drop the column. Safe: additive,
nullable, no row rewritten, no reader outside P5. To roll the data back:
`ALTER TABLE households DROP COLUMN time_zone`.
