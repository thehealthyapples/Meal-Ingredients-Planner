# DEV1 — DEV `diet_pattern` Launch Failure Investigation

**Date:** 2026-07-16
**Session:** DEV1 (recovery investigation)
**Rollback identifier:** `rollback/DEV1-diet-pattern-launch-recovery-20260716` → commit `9900e405`
(preservation commit of the exact mid-CONV1-P4 working tree as found; a bare tag on the prior
HEAD could not protect the uncommitted multi-session tree — the CONV1 P4 run file records the
same qualification).

---

ROOT CAUSE: The DEV server process (port 5000, booted 23:00:40) loaded the **pre-P4 drizzle
schema** (`shared/schema.ts` still declaring `users.diet_pattern` / `users.diet_restrictions`)
into memory, then **its own migration run applied CONV1 P4 / OWN-1 at 23:00:42 and dropped both
columns** from the shared DEV database. The `schema.ts` retirement edit landed at 23:00:49 —
seven seconds after the drop, and after the running process had already imported the old module.
From that moment every drizzle read of the `users` table in the running process selected a
column that no longer exists, so every user-reading request (login, session deserialize, and
therefore every page of the app) failed 500 with `column "diet_pattern" does not exist`. The
same failure affects **any process built from pre-P4 code** (before the DEV1 preservation
commit, that included committed HEAD `7d1dd2ce`) run against the now-converged database.

CANONICAL OWNER: **`household_eaters`** — `default_diet_types` (pattern, as its canonical diet
type) and `hard_restrictions`. Declared by `ARCHITECTURE_PRINCIPLES.md` Principle 2 (since
2026-06-25) and Source of Truth Register Domain 16 (corrected by DOC-1, 2026-07-16).
`users.diet_pattern` / `users.diet_restrictions` were a redundant shadow, retired by
CONV1 P4 / OWN-1. `user_preferences.diet_types` is not a rival owner (Domain 27 soft-preference
list).

RECOVERY REQUIRED: **Restart the DEV server process so it runs the post-P4 code already in the
working tree.** No schema change, no new migration, no column re-add, no data write. The
database is correct (converged, at migration head); the code in the working tree is correct
(verified to boot and serve user reads); only the stale in-memory process — and anything built
from pre-P4 code — is broken. The preservation commit additionally brings committed code to the
post-P4 side of the boundary, so a launch from committed code no longer splits from the database.

---

## 1. The failure as observed

- `POST /api/login` (and every authenticated request) → HTTP 500
  `{"message":"column \"diet_pattern\" does not exist"}` — reproduced against the live
  port-5000 process at 23:1x, and against a clean checkout of pre-P4 HEAD `7d1dd2ce` on
  port 5097.
- The **boot sequence itself succeeds** (env checks, migrations "up to date", listen, pantry
  sync). The "launch failure" a user experiences is the application being unusable: the client
  loads, but every user read 500s, beginning with session restore/login.

## 2. Endpoint / startup path triggering the query

- First hit in practice: **session deserialize** (`storage.getUser(id)`) on any authenticated
  request, and **`POST /api/login`** → passport LocalStrategy → `storage.getUserByUsername`.
- Boot-time paths (migrations, seeds, pantry sync) do **not** select `users` columns via
  drizzle in the failing way — which is why the process starts and then fails on first use.

## 3. The exact SQL referencing `diet_pattern`

Drizzle generates the full column list from the in-memory schema. In the stale process (and in
pre-P4 code) every `users` select takes the form:

```sql
select "id", "username", "password", ..., "diet_pattern", "diet_restrictions", ...
from "users" where "username" = $1 limit 1
```

Postgres rejects it: `errorMissingColumn` / `column "diet_pattern" does not exist`.

## 4. Table being queried

`users`. The columns were dropped by migration
`2026-07-16_conv1_p4_retire_users_diet_columns` (applied 23:00:42.786Z), immediately after
`2026-07-16_conv1_p4_move_diet_to_household_eaters` (23:00:42.693Z) copied every active
member's diet onto their `household_eaters` row behind a zero-data-loss `DO $$` gate.

## 5. The code change that introduced the reference

- The columns were **introduced** by migration `2026-02-27_add_user_diet_fields` and declared
  in `shared/schema.ts` (`dietPattern: text("diet_pattern")`, line 24 at HEAD `7d1dd2ce`).
- The **breaking event** is not a new reference but a **retirement applied out of step with the
  running process**: the CONV1 P4 session (in progress, uncommitted) appended the move/retire
  migrations to `server/migrations/runner.ts` at 22:54:54; the 23:00:40 server boot ran them
  against the shared database while still holding the pre-P4 schema module in memory
  (schema.ts was edited at 23:00:49, after import).

## 6. Canonical owner of diet pattern data

`household_eaters.default_diet_types` / `household_eaters.hard_restrictions`
(Principle 2; Register Domain 16; Register Domain 7 convergence note, all verified in the
working tree). Pattern derivation back from diet types is owned by
`dietPatternFromDietTypes` in `shared/dietRules.ts` (CONV1 P4 READ-2).

## 7. Does `diet_pattern` exist in the current schema definition?

**No — deliberately retired.** `shared/schema.ts` carries the retirement comment (CONV1 P4 /
OWN-1) and no `diet_pattern` / `diet_restrictions` columns. The publication register's
Household Dietary Preference domain (domain 9) now ratchets against the columns *returning*.

## 8. Does a migration exist for it?

Yes — full lifecycle, all in `server/migrations/runner.ts` and all **applied** to DEV:
- add: `2026-02-27_add_user_diet_fields`
- backfill: `2026-02-27_backfill_user_diet_fields`
- move to owner: `2026-07-16_conv1_p4_move_diet_to_household_eaters`
- retire (gated drop): `2026-07-16_conv1_p4_retire_users_diet_columns`

## 9. Is the DEV database missing migrations?

**No.** `schema_migrations` is at the expected head
(`2026-07-16_conv1_p4_retire_users_diet_columns`); the runner logs
"Up to date — no pending migrations". The database is *ahead of the stale process's code*, not
behind.

## 10. Renamed, projected, or retired?

**Retired, with its fact moved to the canonical owner.** Not a rename. The value was projected
onto `household_eaters.default_diet_types` (pattern head first, so the derived requester
pattern is unchanged — the SURF1B fail-closed safety gate does not weaken) and
`hard_restrictions` before the drop; the drop refuses (RAISE EXCEPTION) if any active member's
diet fact is absent from their eater row ("not one allergen may be lost", PEOPLE1 § 9.2).

## 11. Timeline (all 2026-07-16, UTC)

| Time | Event |
|---|---|
| 16:25:13 | Previous migration head (`sec23`) applied; DEV healthy |
| 22:54:54 | CONV1 P4 session appends P4 migrations to `runner.ts` (uncommitted) |
| ≈23:00:40 | DEV workflow server boots — imports **pre-P4** `schema.ts` |
| 23:00:41–42 | Same boot applies P4 migrations; `users.diet_pattern`/`diet_restrictions` **dropped** |
| 23:00:49–23:08+ | CONV1 P4 session continues editing (`schema.ts` 23:00:49, `storage.ts` 23:00:52, `routes.ts` 23:05:21, publication register 23:08:55) |
| 23:0x–23:1x | Every user read on the running server 500s with `column "diet_pattern" does not exist` |
| 23:1x | DEV1: root cause proven (HEAD-worktree repro on :5097; current-tree healthy boot on :5098 — login → 401, correct) |

## 12. Why this is a process-lifecycle defect, not an architecture defect

The P4 convergence itself is architecture-compliant (one owner, gated zero-loss move, ordered
write-door-before-read-door). The defect is operational: a **destructive migration was applied
to the shared DEV database by a server process whose in-memory code predated the change**, and
the code that matches the migration was not yet committed, so every other launch path
(committed HEAD, deployments) was left on the wrong side of the boundary. The recovery is to
put the running process on the post-P4 side — a restart — and to anchor the post-P4 code in
history (the DEV1 preservation commit).

## 13. Data impact

- **Reads existing data:** yes (restart only; the app reads converged data).
- **Writes new data:** no.
- **Changes meaning of existing data:** no.
- **Requires backfill:** no — the P4 move migration already performed the gated copy before
  the drop, and the gate proves zero loss.
