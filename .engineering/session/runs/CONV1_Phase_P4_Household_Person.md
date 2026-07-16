# CONV1 Phase P4 — The Household Person

**Stage:** Complete
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
- [x] Baseline measured, not inherited (CP11) — see below

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

## Progress

- [x] WRITE-3 — unique index (schema + migration), dedupe-merge migration, eater creation at all
      six membership events, `syncMembersAsEaters` retired, GET is a pure read
- [x] WRITE-2 — `updatePersonDiet` write door (profile PUT + onboarding), 403 lifted, copy
      migration (pattern-head-first union), diets travel on household moves
- [x] OWN-1 — columns dropped behind a `DO $$` zero-data-loss gate; every reader moved
      (resolver, buildProfileResponse, profile-read handler/port, search-recipes, smart-suggest,
      matcher, sanitizeUser, world-seeder, dev scripts)
- [x] READ-1 — all three census enrichments deleted + a 4th uncensused one (smart-suggest eater
      loop, routes.ts); `enrichEater` → `toEaterView`
- [x] READ-2 — one owner in `shared/dietRules.ts` (map + inverse derivation); 5 copies collapsed
- [x] WRITE-1 — the Bridge deleted; publication-register domain 9 corrected to converged contract
- [x] Migrations executed against the live DB: columns gone, index live, 0 active members without
      eater rows, 95 rows carrying migrated diet facts, 0 duplicates
- [x] `verify:publication`: **Household Dietary Preference 🔴 → 🟢** (platform 5 reds → 4)
- [x] `verify:coherence`: PASS · `npm run build`: PASS · P4 production files typecheck clean
- [x] E2E against the running app: demo signup → profile diet write → eater row stores it →
      pattern derives back → eater PATCH (was 403) → profile reflects household's correction
- [x] Governing docs corrected: Register (Domain 7, Phase 3 Dup 4, Phase 4, Phase 5 verdicts,
      Phase 7 list, Appendix A), ARCHITECTURE_PRINCIPLES (§ violations, table, § 4), household card
- [x] Test suites — 26 suites, 0 failures (~1,940 assertions); 10 files converted; per-suite
      table in the completion report § 6
- [x] Completion report `docs/implementation/governance/CONV1_PHASE_P4_COMPLETION.md`

## Next action

None — complete. Recommends **P5 — Household Time: the module and the zone** (`OWN-4` → `OWN-3` → `SCH-1`) next; see the completion report § 9.

## Files touched (rollback list — keep current)

- `.engineering/session/CURRENT.md` (dashboard row)
- `shared/schema.ts` · `shared/dietRules.ts`
- `server/migrations/runner.ts` (3 appended migrations — NOTE: applied to the live DB; rolling
  back code does NOT restore the dropped columns; the data lives on `household_eaters`)
- `server/storage.ts` · `server/routes.ts` · `server/lib/household-dietary-safety.ts` ·
  `server/lib/household-meal-matcher.ts` · `server/lib/sanitizeUser.ts`
- `server/intelligence/handlers/{household-read-handler,household-read-port,profile-read-handler,profile-read-port}.ts`
- `server/intelligence/food-intelligence/engine.ts`
- `server/benchmark/world-seeder.ts` · `server/scripts/{sim-slot-fill,query-investigation}.ts`
- `server/verification/publication-register.ts`
- `client/src/pages/profile-page.tsx`
- `scripts/import-development-world.ts`
- `docs/architecture/{THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER,ARCHITECTURE_PRINCIPLES}.md` ·
  `docs/architecture/capabilities/household.md`
- `docs/implementation/governance/CONV1_PHASE_P4_COMPLETION.md` (new)
- server/tests: `test-sec1-departed-member-eater-exposure` · `test-intelligence-household-binding` ·
  `test-intelligence-profile-binding` · `test-surf1b3-onboarding-allergy-safety-routing` ·
  `test-surf1b4-canonical-diet-pattern-safety` · `test-surf1b5-starter-meal-safety` ·
  `test-diet-reconciliation-bridge` (rewritten as the WRITE-1 ratchet) ·
  `test-surf1b-dietary-restriction-safety-path` · `test-surf1b2-dietary-restriction-knowledge` ·
  `test-intelligence-personality-platform`
