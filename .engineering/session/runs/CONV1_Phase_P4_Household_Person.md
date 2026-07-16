# CONV1 Phase P4 — The Household Person

**Stage:** In Progress
**Date:** 2026-07-16
**Rollback ID:** `rollback/CONV1-phase-p4-household-person-20260716` → `7d1dce8` (HEAD)
**Type:** Git tag, created **before any file was touched**.

> ⚠️ **The tag is a marker, not a restore point.** HEAD predates every uncommitted
> P0/P1/P2/P3 correction in a tree dirty from many concurrent sessions. **A tag checkout
> would destroy them.** To roll back, revert the P4-named files individually (kept current
> in this file). Same qualification P1–P3 recorded.

**Scope:** CONV1 Phase **P4** only — `WRITE-3` → `WRITE-2` → `OWN-1` → `READ-1` + `READ-2` + `WRITE-1`.
No unrelated refactoring. Preserve canonical ownership (`household_eaters`, Register Domain 16).

---

## Mission

Implement CONV1 Phase P4: the Household Person convergence. Approved sequence
WRITE-3 → WRITE-2 → OWN-1 → READ-1 → READ-2 → WRITE-1. Create implementation reports.

## Pre-work checkpoints

- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md` read — § 3 Tier 2, § 4, § 7 (P4 row)
- [x] `CONV1_PHASE_P3_COMPLETION.md` read — P1 complete ⇒ `DOC-1` precondition (CP4) satisfied
- [x] `PEOPLE1_HOUSEHOLD_PERSON_MODEL_INVESTIGATION.md` read — § 4, § 7, § 9.2 constraints, § 10 roadmap
- [x] `git status` confirmed (branch `int1-intelligence-platform`, HEAD `7d1dce8`; dirty tree, concurrent sessions)
- [x] Rollback tag created **before any file was touched**
- [ ] Baseline measured, not inherited (CP11)

## Constraints in force (PEOPLE1 § 9.2, CONV1 CP2/CP3)

1. The migration moves **live allergens** — not one may be lost (21 households carry a live restriction).
2. The write door moves **before** the read door; columns retire **after** the write moves.
3. The scaffolding (READ-1/READ-2/WRITE-1) comes down **last**.
4. SURF1B's fail-closed contract survives intact.
5. `getHouseholdForUser` throws — nothing may make "a person always has a household" false.

## Baseline (measured, CP11)

- `verify:publication`: 22 domains — 🟢5 · 🟡12 · **🔴5** (Meals, Meal Templates, **Household Dietary Preference**, Pantry, Nutrition Boost/Uplift); 60 checks — 31 pass · 21 warn · 8 fail. Saved: scratchpad/baseline-publication.txt

## Design decisions (verified at source)

1. `DIET_PATTERN_TO_DIET_TYPE` is bijective — `type = pattern.toLowerCase()` for all 10 patterns —
   so the eater row's `defaultDietTypes` owns the pattern losslessly; derivation back is the strict
   inverse map (first canonical match). One shared owner lands in `shared/dietRules.ts`, which
   already owns the pattern vocabulary (READ-2).
2. Migration copies for every ACTIVE membership: `defaultDietTypes := ordered-dedupe(pattern-head ∥
   existing ∥ prefs.dietTypes)`, `hardRestrictions := ordered-dedupe(users.dietRestrictions ∥
   existing)`. Pattern head goes FIRST so the derived requester pattern is unchanged (safety gate
   must not weaken).
3. OWN-1's DROP is gated by a `DO $$` assert: zero active members whose diet facts are not present
   on their eater row — "not one may be lost" as a migration-refusing check, not a hope.
4. `user_preferences.dietTypes` is NOT retired — Register Domain 27 (DOC-1-corrected): not a rival
   owner; its diet-mirror WRITER (the Bridge) dies (WRITE-1). Publication-register domain 9 entry is
   corrected to the converged contract in the same change.
5. SEC-1's fix already made `getHouseholdEaters` membership-filtered and `syncMembersAsEaters`
   active-only — WRITE-3 retires the write-inside-GET entirely (creation moves to createUser /
   joinHousehold / leaveHousehold / removeHouseholdMember; backfill migration covers existing rows).
6. A 4th uncensused enrichment exists at routes.ts:4759-4784 (smart-suggest eater loop) — same
   class as READ-1's three; dies with them (it reads the retired columns).

## Next action

Implement WRITE-3 (schema unique index, migration 1, lifecycle-event creation, retire the GET sync).

## Files touched (rollback list — keep current)

- `.engineering/session/CURRENT.md` (dashboard row)
