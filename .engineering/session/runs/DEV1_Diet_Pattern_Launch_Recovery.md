# DEV1 — DEV `diet_pattern` Launch Failure Recovery

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/DEV1-diet-pattern-launch-recovery-20260716` → `9900e405`
**Type:** Preservation commit + git tag, created **before any change**. Unlike a bare tag on the
prior HEAD, the commit protects the uncommitted multi-session tree (the qualification the
CONV1 P4 run file records).

## Mission

DEV failed with `column "diet_pattern" does not exist`. Determine the exact root cause before
any change; apply the smallest architecture-compliant recovery; verify.

## Outcome

- **Root cause:** the DEV server process (booted 23:00:40) held the pre-P4 drizzle schema in
  memory while its own migration run applied CONV1 P4 / OWN-1 (23:00:42), dropping
  `users.diet_pattern` / `users.diet_restrictions`; `schema.ts` was edited at 23:00:49 — after
  import. Every user read in that process (and in any pre-P4 build) then 500'd.
- **Recovery:** restarted DEV on the post-P4 working tree. No schema change, no migration, no
  data write, no product source modified.
- **Verified:** launch clean; login/user/profile/household 200; diet write lands on
  `household_eaters` only (single owner, Register Domain 16 / Principle 2); planner dietary
  suites green (SURF1B4 316/316, smart-suggest 26/26, eater 13/13, guest 17/17, household
  binding 50/50); `verify:publication` domain 9 🟢.

## Documents

- Investigation: `docs/investigations/DEV_DIET_PATTERN_LAUNCH_FAILURE.md`
- Implementation report: `docs/implementation/DEV_DIET_PATTERN_LAUNCH_RECOVERY.md`

## Files touched (rollback list)

- `docs/investigations/DEV_DIET_PATTERN_LAUNCH_FAILURE.md` (new)
- `docs/implementation/DEV_DIET_PATTERN_LAUNCH_RECOVERY.md` (new)
- `.engineering/session/CURRENT.md` (dashboard row)
- `.engineering/session/runs/DEV1_Diet_Pattern_Launch_Recovery.md` (this file)
- Operational only: stale DEV process stopped and relaunched; throwaway verification account
  (user 768 / household 441) created and fully deleted.

## Next action

None — complete. Remaining risks handed to their owners: CONV1 P4 (still In Progress,
concurrent) finishes its own phase; next deployment must build from `9900e405` or later; the
recovered DEV process is a background process — use `npm run dev:reset` before a Replit Run.
