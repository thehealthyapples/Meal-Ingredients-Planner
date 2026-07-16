# DEV1 — DEV `diet_pattern` Launch Recovery — Implementation Report

**Date:** 2026-07-16
**Session:** DEV1
**Investigation:** [`docs/investigations/DEV_DIET_PATTERN_LAUNCH_FAILURE.md`](../investigations/DEV_DIET_PATTERN_LAUNCH_FAILURE.md)
**Rollback identifier:** `rollback/DEV1-diet-pattern-launch-recovery-20260716` → commit `9900e405`

---

ROOT CAUSE: The DEV server process booted at 23:00:40 with the **pre-P4 drizzle schema in
memory**, then its own migration run applied CONV1 P4 / OWN-1 at 23:00:42 and **dropped
`users.diet_pattern` / `users.diet_restrictions`** from the shared DEV database; `shared/schema.ts`
was edited to the post-P4 form at 23:00:49, after the process had imported the old module.
Every user-reading request in that process (and in any process built from pre-P4 code) then
failed with `column "diet_pattern" does not exist`.

CANONICAL OWNER: **`household_eaters`** — `default_diet_types` + `hard_restrictions`
(`ARCHITECTURE_PRINCIPLES.md` Principle 2; Source of Truth Register Domain 16).

RECOVERY REQUIRED: **Restart the DEV server on the post-P4 working tree.** No schema change,
no migration, no column re-add, no data write. Plus rollback protection as a preservation
commit, which also anchors post-P4 code in history so committed-code launches match the
converged database.

---

## What was changed

| Change | Kind |
|---|---|
| Preservation commit `9900e405` + tag `rollback/DEV1-diet-pattern-launch-recovery-20260716` | Rollback protection (snapshot of the mid-CONV1-P4 tree exactly as found; no content authored) |
| Stale pre-P4 DEV server process (port 5000, booted 23:00) stopped; DEV relaunched from the current working tree | Operational recovery — **the** fix |
| `docs/investigations/DEV_DIET_PATTERN_LAUNCH_FAILURE.md` | New investigation document |
| `docs/implementation/DEV_DIET_PATTERN_LAUNCH_RECOVERY.md` | This report |
| `.engineering/session/CURRENT.md` + `runs/DEV1_Diet_Pattern_Launch_Recovery.md` | ESR records |

**No product source file was modified by DEV1.** The code-side convergence (schema retirement,
write door `updatePersonDiet`, READ-1/READ-2 collapse, publication-register domain 9 ratchets)
was authored by the concurrent CONV1 P4 session and found already correct; DEV1 verified it
end-to-end rather than re-implementing any of it.

A throwaway verification account (`dev1_recovery_check`, user 768, auto-created household 441)
was created through the storage door, used for end-to-end HTTP verification, and fully deleted
afterwards in one transaction.

## Architecture compliance

- **One canonical owner** — verified live: the profile write door lands the diet on
  `household_eaters` only; `users` carries no diet columns; publication verification domain 9
  ("Household Dietary Preference") is 🟢 with single-owner ratchets.
- **No duplicate diet fields / no duplicate state** — nothing was added anywhere; the
  retired shadow was not resurrected.
- **Migration system respected** — no SQL was applied outside `server/migrations/runner.ts`;
  the DB was already at head (`2026-07-16_conv1_p4_retire_users_diet_columns`).
- **Extend, not replace** — the recovery is purely operational; the existing P4 convergence
  architecture is untouched.

## Verification results (all on the recovered DEV, port 5000)

| Check | Result |
|---|---|
| DEV launches | ✅ Clean boot; `[Migrations] Up to date`; serving on port 5000 |
| Failing query succeeds | ✅ `POST /api/login`: was 500 `column "diet_pattern" does not exist`, now 401 (bad creds) / 200 (valid creds) — the `users` select executes |
| Profile data loads | ✅ `GET /api/user` 200; `GET /api/profile` 200 with `dietPattern` derived from the owner (API shape preserved per P4 READ contract) |
| Household data loads | ✅ `GET /api/household` 200 (owner, members, eater rows present) |
| Diet write → canonical owner | ✅ `PUT /api/profile {dietPattern:"Vegan", dietRestrictions:["Gluten-Free"]}` → `household_eaters.default_diet_types=['vegan']`, `hard_restrictions=['Gluten-Free']`; read-back derives `"Vegan"` |
| Planner dietary behaviour | ✅ `test:surf1b4-canonical-diet-pattern-safety` 316/316; `test:smart-suggest-diet-pattern` 26/26 |
| Eater model | ✅ `test:household-eater` 13/13; `test:guest-eater` 17/17 |
| Intelligence household reads | ✅ `test:intelligence-household-binding` 50/50 |
| No duplicate diet ownership | ✅ `verify:publication` domain 9 🟢 "DB household_eaters (Register Domain 16)"; `users` shadow columns confirmed absent in `information_schema` |

## Data impact

- **Reads existing data:** yes — the recovery only restarts the reader.
- **Writes new data:** no (the throwaway verification account was created and deleted within
  the verification itself; net zero).
- **Changes meaning of existing data:** no.
- **Requires backfill:** no — the P4 move migration performed the gated zero-loss copy before
  the drop, and its `DO $$` gate refuses the drop if any active member's diet fact is missing
  from their eater row.

## Remaining risks

1. **Pre-P4 builds cannot run against this database.** Any deployment or checkout older than
   `9900e405` will reproduce the failure on first user read. The next deployment must be built
   from `9900e405` or later.
2. **The CONV1 P4 session is still In Progress** (concurrent; it corrected the publication
   register at 23:08:55 and was editing tests during DEV1). Its run file's "Next action" is
   stale. The preservation commit snapshots its in-flight work; it should complete and file its
   own reports. Nothing in DEV1 blocks or alters its remaining steps.
3. **The recovered DEV process runs as a background process, not the Replit workflow.** A
   Replit "Run" press will hit `EADDRINUSE` unless the process is stopped first —
   `npm run dev:reset` exists for exactly this and reaches the same healthy state.
4. Unrelated pre-existing verification findings (e.g. Pantry 🔴 `activity_summary` drift,
   writer-census warns) predate DEV1 and are out of scope; the CONV1 P4 baseline records them.

## Root-cause class (for the protocols)

A destructive migration was applied to the shared DEV database **by a server process whose
in-memory code predated the change it was applying**. The migration itself was correct and
gated; the ordering of *process restart* relative to *schema-module edit* was the defect.
Prevention worth considering (not implemented here — out of scope): the runner could refuse to
apply a migration whose id is not present in the schema the process imported, or the workflow
could mandate a restart immediately after editing `runner.ts` and `schema.ts` together.
