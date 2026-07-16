# SEC2 + SEC3 — Auth Token Expiry → TIMESTAMPTZ

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/SEC23-auth-token-expiry-timestamptz-20260716` → `7d1dd2ce`
**Authority:** CONV1 § 3 (`SEC-2`, `SEC-3`), § 5 rank 3, § 7 (P0). Origin: TIME2 § 9.4 #11/#12.
**Scope:** SEC-2 + SEC-3 only. **`auth.ts` and `storage.ts` untouched.**

---

## Rollback protection

- Annotated tag **before any file was touched**; resolved with `^{commit}`.
- Tree was dirty (62 entries). **A tag covers committed state only** — but `shared/schema.ts`,
  `server/migrations/runner.ts` and `server/auth.ts` were all **clean at HEAD**, so the tag is
  fully sufficient for every file edited. Snapshotted outside the repo anyway.
- **No stash** — would have destroyed concurrent sessions' trees.
- **First CONV1 item to alter a column type.** DB rollback is one guarded `ALTER` per column.

## ⚠️ CONV1's premise was WRONG — corrected in the report § 1

**Probed the database before changing anything: BOTH columns were already naive, and schema.ts
declared both naive. They AGREED.** CONV1 claimed declaration ≠ physical (SEC-2) and that the two
siblings had *different* physical types (SEC-3). **Both false.**

**Why:** I had verified the 2026-02-27 migration *says* `TIMESTAMPTZ` and never checked the column
it produced — the same class of error I caught a subagent making, one file further along.

**What actually happened is worse:** that migration **is recorded as applied and did nothing** —
`drizzle-kit push` created the column first, and `ADD COLUMN IF NOT EXISTS` silently succeeds against
an existing column of the wrong type. **So the physical type is decided by a push-vs-migration race
and can differ per environment**, and `verify:schema-coverage` is table-level and cannot see it.

## What changed

1. **`shared/schema.ts`** — `{ withTimezone: true }` on both token columns (+2/−2).
2. **`server/migrations/runner.ts`** — appended reviewed migration
   `2026-07-16_sec23_auth_token_expiry_timestamptz`: `ALTER COLUMN … TYPE TIMESTAMPTZ USING …
   AT TIME ZONE 'UTC'`, **guarded by a data_type check**. The guard is load-bearing — in an
   environment where the migration won the race the column is already timestamptz, and
   `AT TIME ZONE 'UTC'` on a timestamptz returns a **naive** value that would shift every live token.

## Verification

- **New suite 15/0.** **Case 3 spawns a child under `TZ=America/New_York` and asks POSTGRES** whether
  a token with an hour left is valid: **naive → `false` (expired 4h early); timestamptz → `true`.**
- **★ The test corrected me twice.** v1 asserted round-trip drift → **failed**: a JS round-trip is
  symmetric and cancels. **The defect needs two frames** (writer's TZ vs reader's), which is what a
  SQL `> now()` comparison is. v1 of the value check reported a 1s shift — **my `::bigint` rounding
  of `.89`**, not the data. Both recorded, not quietly re-run.
- **Conversion lossless:** the 1 row went `2026-05-09 19:23:06.89` → `…+00`, epoch `1778354586.89`
  both sides. 0 reset tokens existed.
- **Idempotent:** re-running shifts nothing; boot says *"Up to date"*, *"Schema at head"*.
- **E2E on 5096** (concurrent 5000 untouched): real `storage.setPasswordResetToken` +
  `POST /api/reset-password` — **live token 200, expired token 400** ("Reset link has expired"). 7/0.
- **Regressions 231/0**, incl. **TRUST1-O8 schema protection 33/0** (the gate guarding schema.ts).
- typecheck **304→304**; adoption **64/2**; publication **unchanged**; `drizzle-kit check` →
  **"Everything's fine"**.
- DB clean: 0 test users, 0 temp tables.

## Reported, not fixed

- **`verify:schema-coverage` cannot see this class** — table-level, and says so itself. Two auth
  columns were the wrong type for months with a migration recorded as fixing them. **CONV1 `SCH-3`.**
- **`schema_migrations.applied_at` is itself a naive TIMESTAMP** — the table recording when
  migrations ran cannot say when, unambiguously.
- **The runner's docblock recommends the pattern that caused this** (*"prefer IF NOT EXISTS"*) —
  correct for adding, silently wrong for correcting.

## Files changed

1. `shared/schema.ts` (+2/−2)
2. `server/migrations/runner.ts` (+~60, one appended migration; no existing entry altered)
3. `server/tests/test-sec23-auth-token-expiry-timestamptz.ts` (new)
4. `package.json` (+2 lines)
5. `docs/implementation/platform/SEC23_AUTH_TOKEN_EXPIRY_TIMESTAMPTZ.md` (report)

## ★ TIER 0 IS COMPLETE

`SEC-1` ✅ · `SEC-4` ✅ · `SEC-2`+`SEC-3` ✅ · `SEC-5` ⏳ **routed, not closed — legal/product, and it
blocks nothing else.** The three items engineering could close are closed.

## Next action

None — complete. **Next CONV1 item: `DOC-1`** (P1, free, documentation only) — the four-way governing
conflict on `users.dietPattern`, where **Principles names the rival `household_eaters` and the
Register names it `user_preferences`; they are not arguing about the same thing.** **`OWN-1` must not
start until it lands.** **`DOC-1`'s work-list is CPI1 § 4.4, not CONV1 § 3's row alone** — SEC-4 found
a second instance (Register D18 contests an already-deleted file) and SEC-2/SEC-3 a third (CONV1's
own text). 
