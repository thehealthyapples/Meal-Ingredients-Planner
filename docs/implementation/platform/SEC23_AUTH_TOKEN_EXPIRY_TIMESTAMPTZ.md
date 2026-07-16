# SEC2 + SEC3 — The Auth Token Expiry Columns Become TIMESTAMPTZ — Implementation

**Status:** IMPLEMENTED — schema declaration + reviewed migration. CONV1 items `SEC-2` and `SEC-3` only.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `SEC23_Auth_Token_Expiry_Timestamptz`
**Authority:** [`CONV1 — The Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § 3 (`SEC-2`, `SEC-3`), § 5 (rank 3), § 7 (P0). Original finding: [`TIME2`](../../investigations/platform/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md) § 9.4 #11/#12.
**Governing architecture read:** `docs/architecture/README.md` (bootstrap), `ARCHITECTURE_PRINCIPLES.md`, `CANONICAL_PUBLICATION_ARCHITECTURE.md` (§ 4.1, CPuBA7), `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (§ 7 CIVIL/INSTANT, `HT9`, `HT10`), `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (D26), `REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md`.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback ID** | **`rollback/SEC23-auth-token-expiry-timestamptz-20260716` → `7d1dd2ce`** |
| Created | **Before any file was touched** (`ROLLBACK_PROTECTION_PROTOCOL.md` § 1) |
| Annotated? | Yes (`-a`), resolved with `^{commit}` as § 2 requires |
| **What the tag does NOT cover** | The working tree was dirty (62 entries — concurrent sessions plus this conversation's SEC1/SEC4). **A tag protects committed state only** (§ 3). **`shared/schema.ts`, `server/migrations/runner.ts` and `server/auth.ts` were all CLEAN at HEAD**, so the tag is fully sufficient for every file this change edits |
| **No stash taken** | Deliberate — it would have destroyed the concurrent sessions' trees |
| **Extra protection** | All four candidate files snapshotted outside the repo before editing |
| **⚠️ Database rollback** | **This is the first CONV1 item that alters a column type.** Reversal is a one-line `ALTER` per column (§ 12) — but read § 12's warning first |
| Files this workstream touched | **4** (2 modified, 2 created). `server/auth.ts` and `server/storage.ts` **untouched** |

---

## 1. ⚠️ CONV1's PREMISE WAS WRONG, AND THIS REPORT CORRECTS IT

**The mission says: *"Converge the password-reset and email-verification expiry columns so schema declarations and physical database types agree."* Before changing anything, I probed the live database. They already agreed.**

```
   ⚠ NAIVE   email_verification_expires     timestamp without time zone
   ⚠ NAIVE   password_reset_expires         timestamp without time zone
```

**Both columns were naive. `shared/schema.ts` declared both naive. Declaration and database were in perfect agreement — on the wrong type.**

CONV1 § 3 `SEC-2` asserted:

> *"`server/migrations/runner.ts:74` — `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ`. **The declaration and the physical column disagree.**"*

**They did not.** And `SEC-3` asserted that *"two identically-declared sibling columns have physically different types"*. **They did not — both were naive, i.e. the same type.**

### 1.1 Why CONV1 was wrong, and it is a lesson worth recording

**I verified the migration's *text* and never the *column it produced*.** In the SEC1 session a subagent claimed the migration did not exist; it had searched the wrong directory, I corrected it at source, confirmed `server/migrations/runner.ts:74` really does say `TIMESTAMPTZ`, and concluded TIME2's claim survived. **It does say TIMESTAMPTZ. The column is naive anyway.**

> **Reading the migration is not reading the database.** I caught the subagent making exactly this class of error and then made a subtler version of it myself — one file further along the chain.

### 1.2 What actually happened — and it is worse than the claim it replaces

The migration **is recorded as applied**:

```
  2026-02-27_password_reset_tokens   applied_at = 2026-04-16 06:49:24
```

**It ran. It did nothing.** `drizzle-kit push` had already created the column from `shared/schema.ts` as naive, and **`ADD COLUMN IF NOT EXISTS` silently succeeds against an existing column of the wrong type.** It does not correct it. It does not warn.

> **A migration is recorded as applied, in a tracking table built to prove it ran, and its entire intent was silently discarded.**

**So the physical type of a security-token column is decided by a race** — whether `push` or the migration reached a given database first:

| Environment | Order | `password_reset_expires` |
|---|---|---|
| This one (and any push-first DB) | push → migration | **naive** — the ALTER no-oped |
| A fresh DB where migrations ran first | migration → push | **timestamptz** |

**Nothing in the platform detects the difference.** `verify:schema-coverage` is a *table*-level check and says so in its own closing line (*"Columns added declaratively without a migration are NOT detected"*). **This is CPI1 § 4.1's 51%-coverage finding, biting at column granularity, on an auth column.**

**And the runner's own docblock recommends the pattern that caused it:** *"Use safe, idempotent SQL — prefer IF NOT EXISTS / IF EXISTS."* Good advice that, applied to a column that already exists, produces a migration that lies about having run.

### 1.3 The convergence is therefore real, and the direction is the correction

The columns needed converging — **not toward each other (they already matched), but toward `TIMESTAMPTZ`**, because:

- **They are INSTANT values.** `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` § 7's test: *"If this household moved to Tokyo tomorrow, would this value have to change?"* **No.** A token expires at a point on the timeline. **A naive column has no such point** — it holds a wall-clock reading whose meaning is supplied by whoever reads it.
- **`HT9` — a duration is not a date.** TIME2 § 5 records Trial/Auth as **`MUST NOT` consume household time** and *"✅ Correct — but see § 9.4 for two **schema** defects."* This change touches the schema, not the frame: **the columns stay INSTANT, and become properly so.**
- **99 other timestamp columns are already `timestamptz`.** These two were the only naive ones on `users` — now zero (§ 5, Case 2).

---

## 2. THE DEFECT, DEMONSTRATED

**CONV1 graded these 🟡 *latent — masked by UTC containers* (its `CP11`: report the grade the evidence supports). That grade holds. But the mechanism CONV1 described was wrong too, and the test caught it.**

CONV1 said *"drift equals the Node process's UTC offset."* **A JS round-trip through a naive column has no drift at all** — the same process writes and reads it, so its offset cancels. My first version of the test asserted drift and **failed**, under `TZ=America/New_York`, with `naiveDriftMs: 0`.

**The defect needs two frames.** The **writer's** process TZ decides the wall-clock that gets stored; the **reader's** frame decides what it means. Measured:

```
--- under UTC ---
  JS Date (UTC):  2026-07-16T17:27:24.481Z
  stored naive:   2026-07-16 17:27:24.481
  Postgres says naive token still valid? true    ← nothing looks wrong

--- under America/New_York ---
  JS Date (UTC):  2026-07-16T17:27:25.489Z
  stored naive:   2026-07-16 13:27:25.489        ← the offset is gone
  Postgres says naive token still valid? false   ← a token with an HOUR LEFT
  Postgres says aware token still valid? true
```

> **A password-reset token with an hour left is judged already expired, four hours early, because the wall-clock was stored without the offset that gave it meaning. West of UTC that is a lockout. East of UTC the same mechanism runs the window LONG — an extended life on a password-reset token.**

**The honest bound on today's exposure, and it is narrower than TIME2 implied.** `auth.ts:315` and `:413` compare in **JS** (`new Date(user.passwordResetExpires) < new Date()`) — symmetric, and therefore safe even under a naive column. The defect fires on a **SQL-side** comparison or a **cross-process** read. **So it was latent twice over: masked by UTC, and not reached by the code path that actually checks expiry.** It is fixed because the mask is a deployment accident and the JS-only comparison is a coincidence of today's code — neither is a control.

---

## 3. WHAT CHANGED

### 3.1 `shared/schema.ts` — the declaration

```diff
- emailVerificationExpires: timestamp("email_verification_expires"),
+ emailVerificationExpires: timestamp("email_verification_expires", { withTimezone: true }),
- passwordResetExpires: timestamp("password_reset_expires"),
+ passwordResetExpires: timestamp("password_reset_expires", { withTimezone: true }),
```

**Two lines. No other column touched.**

### 3.2 `server/migrations/runner.ts` — the reviewed migration

**Appended to the end of the ordered list, as the runner requires.** Id: **`2026-07-16_sec23_auth_token_expiry_timestamptz`**.

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'password_reset_expires'
      AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE users
      ALTER COLUMN password_reset_expires TYPE TIMESTAMPTZ
      USING password_reset_expires AT TIME ZONE 'UTC';
  END IF;
END $$
```
*(and the same for `email_verification_expires`)*

**Three deliberate choices, each load-bearing:**

| Choice | Why |
|---|---|
| **`ALTER COLUMN … TYPE`, not `ADD COLUMN IF NOT EXISTS`** | **The exact mistake of 2026-02-27.** `ADD COLUMN IF NOT EXISTS` cannot correct an existing column — it succeeds and does nothing |
| **The `IF EXISTS … data_type = 'timestamp without time zone'` guard** | **Not decoration.** In an environment where the old migration won the race, the column is **already** timestamptz — and `x AT TIME ZONE 'UTC'` on a **timestamptz** returns a **naive** timestamp, which would then be re-cast by the session zone and **silently shift every live token**. The guard makes one migration correct in *both* environments: convert only what is still naive. **Proven idempotent** (§ 5.1) |
| **Explicit `AT TIME ZONE 'UTC'`, not a bare cast** | A bare `TYPE TIMESTAMPTZ` interprets the naive value using the **session** `TimeZone` — so the result would depend on who ran the migration. The explicit clause is deterministic. **And 'UTC' is the right reading, verified empirically** (§ 4) |

### 3.3 What was NOT changed

**`server/auth.ts` and `server/storage.ts` are untouched** — verified by `git diff` (`storage.ts` carries only this conversation's SEC1 hunk). The write path (`storage.ts:1529`, `:1537`) still passes a JS `Date`; the read path (`auth.ts:315`, `:413`) still compares `new Date(x) < new Date()`. **Auth behaviour is preserved by not touching it** — and it is now correct for a reason rather than by luck.

---

## 4. DATA IMPACT

```
GOVERNANCE GATE
===============
Domain affected:         26 (Membership / auth columns on `users`) — SCHEMA.
Declared SoT:            shared/schema.ts + server/migrations/ — unchanged.
Ownership changed?       NO.
New store created?       NO.
Existing store extended? NO — no column added. TWO COLUMN TYPES CORRECTED.
Schema modified?         YES — the first CONV1 item to do so. 2 columns, in place.
                         No column added, dropped, or renamed. No table touched.
Migration written?       YES — 2026-07-16_sec23_auth_token_expiry_timestamptz,
                         appended, guarded, idempotent, reviewed.
Data written?            NONE by application code.
Data converted?          The 2 columns' values are REINTERPRETED, not rewritten:
                         the naive wall-clock is read as UTC and gains the marker
                         it always meant. Verified byte-identical (§4.1).
New knowledge store?     NO (Register Rule 8 does not fire).
```

### 4.1 The conversion is provably lossless — and here is the evidence, not the assertion

**The risk of `AT TIME ZONE 'UTC'` is that it is the wrong reading.** It is the right one, established before writing the migration:

```
  JS Date written:      2026-07-16T22:30:00.000Z  (22:30 UTC)
  stored in NAIVE col:  2026-07-16 22:30:00        ← UTC wall-clock
  naive round-trip lossless? true
```

Under a UTC process — **which is every process that has ever written to this platform's databases**, and the very fact that masked the defect — the stored wall-clock **is** UTC. So reading it as UTC is exact.

**Rows the conversion touched, counted before running it:**

| | |
|---|---|
| users | 275 |
| with `password_reset_expires` | **0** |
| with `email_verification_expires` | **1** (already expired) |

**The one row, before → after:**

```
  before:  2026-05-09 19:23:06.89
  after:   2026-05-09 19:23:06.89+00

  driver-read Date:  2026-05-09T19:23:06.890Z
  exact epoch:       1778354586.89
  expected epoch:    1778354586.89   (19:23:06.890 UTC)
  >>> PASS — byte-identical instant.
```

**One honest note on method.** My first check used `EXTRACT(EPOCH …)::bigint`, which **rounded `.89` up** and reported a one-second "shift" — a **FAIL from my own assertion's rounding, not from the data**. Re-checked at full precision it is exact. **Recorded because a verification that quietly re-runs until it goes green is not a verification** — the first result was wrong about my code, not about the database, and the difference matters.

> **The wall-clock did not move. It gained the UTC marker it always meant.**

---

## 5. VERIFICATION — THE TEST SUITE

`server/tests/test-sec23-auth-token-expiry-timestamptz.ts` — **15 assertions.**

```
Case 1 — the physical column type
  ✓ both token columns exist
  ✓ ★ email_verification_expires is TIMESTAMPTZ in the database
  ✓ ★ password_reset_expires is TIMESTAMPTZ in the database

Case 2 — the declaration agrees with the database
  ✓ ★ shared/schema.ts declares password_reset_expires withTimezone
  ✓ ★ shared/schema.ts declares email_verification_expires withTimezone
  ✓ ★ the two sibling columns are the SAME physical type
  ✓ no naive timestamp remains on the users table

Case 3 — the defect the UTC container was hiding
  (this process: TZ=unset, offset 0 min)
  ✓ under UTC, BOTH column types judge the token valid — nothing looks wrong
  (child process: TZ=America/New_York, offset 240 min)
  ✓ ★ the child really did run in a non-UTC zone
    token issued (UTC):  2026-07-16T17:28:15.496Z   — valid for another hour
    stored in NAIVE col: 2026-07-16 13:28:15.496   — the offset is gone
  ✓ ★ a NAIVE column makes Postgres call the live token EXPIRED — the old behaviour
  ✓ ★ a TIMESTAMPTZ column judges the same token correctly — the new behaviour

Case 4 — auth's expiry comparison still behaves
  ✓ an unexpired token reads as NOT expired
  ✓ and round-trips to the same instant
  ✓ an expired token reads as expired

Case 5 — existing values were not shifted by the conversion
  ✓ 1 row(s) carry a value, and each resolves to a real instant

15 passed, 0 failed
```

**Case 3 spawns a child process under `TZ=America/New_York`** and asks *Postgres* — not JS — whether a token with an hour left is still valid. **This is the test that proves the fix was worth making**, and it is the test that **corrected me**: its first version asserted round-trip drift and failed, because there is none (§ 2). The version that ships tests the mechanism that actually fires.

**Case 2's last assertion is a regression guard beyond these two columns:** *no naive timestamp remains on `users`*. A future naive declaration fails it.

Registered as `test:sec23-auth-token-expiry-timestamptz` **and added to the aggregate `test` suite** (CONV1 `CP10` — *a convergence is finished when a gate can fail*).

### 5.1 Idempotence — proven, not assumed

The migration's own statements were re-executed by hand against the **already-converted** columns:

```
   epoch before re-run: 1778354586.89
   epoch after re-run:  1778354586.89
   type still:          timestamp with time zone
   >>> PASS — the guard skipped; re-running is a no-op and shifts nothing
```

**And at boot:** `[Migrations] Up to date — no pending migrations` · `Schema at head: 2026-07-16_sec23_auth_token_expiry_timestamptz`.

---

## 6. MANUAL VERIFICATION — THE REAL AUTH FLOWS

**Port 5096.** The concurrent session's server on 5000 was left untouched and confirmed still up.

Driven through **`storage.setPasswordResetToken` and the live `POST /api/reset-password`** — the actual write and read paths, not a temp table:

```
  ✓ storage round-trips the reset token
  ✓ ★ the expiry is the SAME instant it was written
  ✓ auth's check: an unexpired token is NOT expired
  ✓ ★ Postgres agrees the token is live (the SQL frame now matches the JS frame)
  ✓ an expired token still reads as expired
  ✓ ★ POST /api/reset-password accepts a live token (HTTP 200)
  ✓ ★ and REJECTS an expired token (HTTP 400: "Reset link has expired. Please request a new one.")

  7 passed, 0 failed
```

**`npx drizzle-kit check` → `Everything's fine 🐶🔥`** — the declaration and the database no longer disagree, and drizzle confirms it independently.

**Cleanup:** test server stopped; **0 test users and 0 temp tables left behind**; verified.

---

## 7. WHAT MUST NOT BREAK — AND DID NOT

| Suite | Result |
|---|---|
| **SEC23 (new)** | **15 passed, 0 failed** |
| **SEC23 auth flow E2E** | **7 passed, 0 failed** |
| **TRUST1-O8 production schema protection** | **33 passed, 0 failed** — *the gate that guards `shared/schema.ts`; this change edits it* |
| TRUST1-S5 authentication rate limiting | **68 passed, 0 failed** |
| TRUST1-S1 session secret | **17 passed, 0 failed** |
| SEC1 departed-member exposure | **17 passed, 0 failed** |
| SEC4 uplift rule provenance | **24 passed, 0 failed** |
| INT12 profile read-only binding | **50 passed, 0 failed** |
| **Total** | **231 passed, 0 failed** |

| Gate | Before | After |
|---|---|---|
| `typecheck` | 304 | **304** — identical; zero in touched files |
| `adoption:check` | 64 passed · 2 failed | **unchanged** — same 2 pre-existing |
| `verify:publication` | 26 pass · 23 warn · 11 fail | **unchanged** — correct; not a publication item |
| `verify:schema-coverage` | 91 / 46 / 45 · **51%** | **unchanged** — correct; **§ 9.1** |
| `drizzle-kit check` | — | **Everything's fine** |

---

## 8. ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| **Architecture Bootstrap read (STEP 2)** | ✅ Bootstrap + Principles + Household Time + CPuBA + SoT Register + Repository Conventions |
| **Principle 1 — one canonical identity** | ✅ Untouched |
| **Principle 2 — one owner per fact** | ✅ **No fact moved, no owner created.** The columns keep their owner and their meaning |
| **Principle 6 — honest gaps over invented facts** | ✅ **A naive timestamp is a claim about an instant that the column cannot support.** It now can |
| **Principle 7 — no permanent sync bridge** | ✅ Nothing cached, nothing derived, nothing stored twice |
| **Principle 8 — retire on introduction** | ✅ **Not engaged** — no store superseded. The 2026-02-27 migration is **not** removed (the runner forbids it: *"Never remove or reorder entries"*); its no-op is corrected by a later entry, which is the mechanism working |
| **Household Time § 7 — CIVIL/INSTANT** | ✅ **The test that decides this change.** These are **INSTANT**; a naive column cannot hold one |
| **`HT9` / `HT10` — a duration is not a date; MUST NOT is permanent** | ✅ **Honoured, and this is the load-bearing check.** Trial/Auth remains a **MUST NOT** consumer of household time. **This change gives it no zone, no `today`, no `phase`** — it makes an instant an instant. **TIME2 § 9.4 named these *"INSTANT-domain defects, and the Foundation will never touch them"* — and it doesn't** |
| **`HT3` / `HT5` / `HT16`** | ✅ Not engaged. No clock read, no derivation stored, nothing inferred |
| **CPuBA7 — changes stay within the publication contract** | ✅ The contract is unchanged; the physical column now matches the declaration that always described it |
| **CPuBA § 4.1 — the schema must rebuild itself** | ✅ **Improved at these two columns; unchanged in aggregate** (§ 9.1) |
| **Register Rule 7 / CPuBA6** | ✅ **No update required — no ownership changed.** D26's source of truth is unchanged |
| **Register Rule 8** | ✅ Not triggered — no knowledge store |
| **Observation Engine § 7** | ✅ Nothing recorded, nothing read |
| **Experience & UI Governance** | ✅ **Not engaged** — no user-facing copy, component or surface. No client file touched |
| **Product Registry (KC15)** | ✅ **Assessed: no entry affected.** No registry entry describes token expiry mechanics. **`last_verified` deliberately NOT bumped** (Rule KC14) |
| **AI ARCHITECTURE COMPLIANCE** | ✅ Not engaged |

### 8.1 Architecture Convergence Status (STEP 8)

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:                      26 — Membership / auth token columns on `users`

Current Canonical Owner:     shared/schema.ts (declaration)
                             + server/migrations/ (physical DDL)

Current Runtime Consumer(s): server/auth.ts:315 (email verification expiry)
                             server/auth.ts:413 (password reset expiry)
                             server/storage.ts:1529/1537 (the write path)
                             — all UNCHANGED by this work.

Duplicate Owners Remaining:  NONE for these columns.

Duplicate State Remaining:   NONE.

Duplicate Workflows Remaining:
                             NONE for these columns — but the CLASS remains:
                             `drizzle-kit push` and server/migrations/ are two
                             paths to one physical schema, and ADD COLUMN IF NOT
                             EXISTS lets the loser fail silently. This change
                             fixes two columns; it does not fix the race (§9.1).

Current Convergence (%):     Evidence-based, counted:
                             - naive timestamps on `users`:        2 → 0
                             - declaration ≠ physical type:        0 → 0 (they
                               always agreed — CONV1 was wrong, §1)
                             - columns whose type depends on push/migration
                               order:                              2 → 0
                             100% for these two columns.

Target Convergence (%):      100% — reached.

Next Planned Milestone:      CONV1 SCH-3 (45 of 91 tables have no reviewed
                             migration) — the general form of this defect.

Remaining Architectural Risks:
                             `verify:schema-coverage` is TABLE-level and says so
                             ("Columns added declaratively without a migration are
                             NOT detected"). Nothing would have caught these two
                             columns, and nothing would catch the next one. The
                             gate that found this was a human reading TIME2.
                             Also: schema_migrations.applied_at is itself a naive
                             TIMESTAMP (runner.ts) — reported, not fixed (§9.2).
```

---

## 9. FINDINGS SURFACED — REPORTED, NOT FIXED

### 9.1 `verify:schema-coverage` cannot see this class of defect

**Unchanged at 91 / 46 / 45 · 51% — correctly.** This change adds no table.

But the number is the point: **the gate is table-level, and this defect was column-level.** Its own closing line already admits it — *"Columns added declaratively without a migration are NOT detected, so true coverage is no better than the figure above."* **Two auth columns spent months as the wrong physical type, in a database with a migration recorded as having fixed them, and no gate in the platform could see it.**

**That is CONV1 `SCH-3`, and this workstream is evidence for it rather than progress against it.**

### 9.2 `schema_migrations.applied_at` is itself naive

`runner.ts` creates its own tracking table with `applied_at TIMESTAMP NOT NULL DEFAULT NOW()` — **naive**. The table that records when migrations ran cannot say when, unambiguously.

**Not fixed:** it is not one of the two columns SEC-2/SEC-3 name, it is operator-facing rather than security-relevant, and changing the migration runner's own bookkeeping inside a migration is a knot best untied deliberately. **Recorded.**

### 9.3 The runner's guidance recommends the pattern that caused this

*"Use safe, idempotent SQL — prefer IF NOT EXISTS / IF EXISTS so the migration can be re-run safely."* Correct for adding; **silently wrong for correcting**, because `ADD COLUMN IF NOT EXISTS` against an existing column of the wrong type succeeds and does nothing. **Amending that docblock is a change to engineering guidance, not to these two columns.** Recorded.

---

## 10. SCOPE LOCK

| Not done | Why |
|---|---|
| **`schema_migrations.applied_at`** | § 9.2 — not one of the named columns |
| **The other 45 uncovered tables** | **CONV1 `SCH-3`** — the long game |
| **Amending the runner's docblock** | § 9.3 — engineering guidance, a separate act |
| **Removing the no-op 2026-02-27 migration** | **The runner forbids it**: *"Never remove or reorder entries."* Its no-op is corrected by a later entry |
| **Touching `auth.ts` / `storage.ts`** | **Auth behaviour is preserved by not touching it** (§ 3.3) |
| **`OWN-1` / `DOC-1`** | CONV1 Tier 1–2. **`OWN-1` must not start until `DOC-1` lands** |
| **The 2 pre-existing `adoption:check` failures / 304 typecheck errors** | Not this workstream's |

---

## 11. FILES CHANGED

| File | Change |
|---|---|
| **`shared/schema.ts`** | **+2 / −2** — `{ withTimezone: true }` on the two token columns. No other column touched |
| **`server/migrations/runner.ts`** | **+~60** — one appended migration (`2026-07-16_sec23_auth_token_expiry_timestamptz`), guarded and idempotent, with its reasoning. **No existing entry altered** |
| **`server/tests/test-sec23-auth-token-expiry-timestamptz.ts`** | **NEW** — 15 assertions, incl. a non-UTC child process |
| **`package.json`** | **+2 lines** — the test script and its aggregate-suite entry |
| `docs/implementation/platform/SEC23_AUTH_TOKEN_EXPIRY_TIMESTAMPTZ.md` | This report |

**`server/auth.ts` and `server/storage.ts` untouched. No client file. No architecture document.**

---

## 12. ROLLBACK PLAN

| Scope | Command |
|---|---|
| **The declaration** | `git checkout 7d1dd2ce -- shared/schema.ts` |
| **The migration** | `git checkout 7d1dd2ce -- server/migrations/runner.ts` |
| **The database** | `ALTER TABLE users ALTER COLUMN password_reset_expires TYPE TIMESTAMP USING password_reset_expires AT TIME ZONE 'UTC';` *(and the same for `email_verification_expires`)*, then `DELETE FROM schema_migrations WHERE id = '2026-07-16_sec23_auth_token_expiry_timestamptz';` |
| **Tag** | `rollback/SEC23-auth-token-expiry-timestamptz-20260716` → `7d1dd2ce` |

**Reversibility properties:**

- **The DB reversal is exact under a UTC process** — the same lossless mapping in reverse (§ 4.1). **Under a non-UTC process it is not**, which is the defect itself, arguing against itself.
- **⚠️ Reverting the code alone does NOT revert the database.** `shared/schema.ts` would then declare naive against a `timestamptz` column — **the exact declaration-vs-physical divergence CONV1 wrongly believed already existed** (§ 1). **Revert both, or neither.**
- **⚠️ Reverting restores a column that cannot hold an instant**, and restores the silent dependency on the writer's process TZ.

---

## 13. TIER 0 IS COMPLETE

**CONV1 § 5 named four items to precede all normal convergence. All four are now closed.**

| Rank | Item | Status |
|---|---|---|
| **1** | **`SEC-1`** — a departed member's live account data served to the household they left | ✅ **Closed** — filtered at the owner; 17/0; proved to fail without the fix |
| **2** | **`SEC-4`** — `/api/uplift/accept` accepted any rule id and stamped it reviewed | ✅ **Closed** — resolved against the owner; 24/0; two publication checks turned green |
| **3** | **`SEC-2` + `SEC-3`** — the auth token expiry columns | ✅ **Closed by this workstream** — 15/0 + 7/0 E2E |
| **4** | **`SEC-5`** — minors' personal data has no governing owner | ⏳ **Routed, not closed** — *"not an engineering fix. A routing act."* **It requires legal and product review and blocks nothing else** |

> **The three items engineering could close are closed. The fourth was never engineering's to close, and CONV1 said so when it was written.**

**One correction to the record, and it belongs here rather than buried:** CONV1 ranked `SEC-2`/`SEC-3` third **on a premise that was wrong in both directions** (§ 1). Had the premise been checked against the database rather than the migration file, the item would have read *"both columns are naive; the platform's other 99 timestamps are not; a migration recorded as applied did nothing"* — **a clearer finding, and arguably a more urgent one.** The rank was right. The reasoning was not.

---

## 14. NEXT CONV1 ITEM

> **`DOC-1` — the canon holds four positions on who owns a person's diet, and the Register mis-names the rival.**

CONV1 § 7 puts it in **P1**, and Tier 0's completion makes it next by the programme's own order. It is **free** — documentation only, no code, no schema — and it is **the highest-leverage item in the backlog**, because it is the precondition of `OWN-1`, the platform's largest convergence:

- `ARCHITECTURE_PRINCIPLES.md:38` — the columns are *"a redundant shadow… retire"*.
- Register **Phase 4** (`:569`) — *"**Retain**… mark them as **the SoT**"*.
- Register **Appendix A** (`:857`) — declares them the SoT, unqualified.
- `capabilities/household.md:38-40` — specifies read-time enrichment **from** them.
- **And Domain 7 (`:175`) names the rival as `user_preferences` while Principle 2 names it `household_eaters` — they are not arguing about the same thing.**

> **An engineer told to "resolve Domain 7" today would promote the wrong store, mark it converged, and leave Principle 2's actual violation intact.**

**And `DOC-1`'s scope is wider than CONV1 recorded — SEC-4 found the same disease in a second place.** Register D18 contests *"Nutrition Boost Display"* against `nutrition-benefit-library.ts`, **a file deleted long ago**, while saying nothing about the vocabulary that was actually live. **SEC-2/SEC-3 has now added a third instance: this report itself corrects CONV1's own text** (§ 1). CPI1 § 4.4 listed the rest. **Whoever takes `DOC-1` should treat CPI1 § 4.4 as its work-list, not CONV1 § 3's `DOC-1` row alone.**

**`OWN-1` must not start until `DOC-1` lands.**

---

## 15. THE CHANGE IN ONE PARAGRAPH

The mission was to make the schema declarations and the physical database types agree for the two auth token expiry columns — and the first thing the database said was that they already did: both were `timestamp without time zone`, exactly as `shared/schema.ts` declared them, in perfect agreement on the wrong type. **CONV1 had it backwards, and so had TIME2 before it**, because I had verified that the 2026-02-27 migration *says* `TIMESTAMPTZ` and never checked the column it produced — the same class of error I had caught a subagent making, one file further along the chain. What actually happened is worse than the claim it replaces: that migration is recorded as applied, in a table built to prove migrations ran, **and it did nothing**, because `drizzle-kit push` had already created the column and `ADD COLUMN IF NOT EXISTS` succeeds silently against an existing column of the wrong type — so the physical type of a password-reset expiry is decided by whether push or the migration reached a given database first, it can differ between environments, and no gate in the platform can see it, because `verify:schema-coverage` is table-level and says so in its own closing line. The convergence was therefore real but pointed the other way: not the columns toward each other, but both toward `TIMESTAMPTZ`, because a token expiry is an **instant** — Household Time's own test, *would this change if the household moved to Tokyo?*, answers no — and a naive column has no instant in it, only a wall-clock whose meaning is supplied by whoever reads it. The test proved the defect and then corrected me a second time: my first version asserted that a naive column drifts by the process offset, and it failed, because a JS round-trip is symmetric and cancels — **the defect needs two frames**, the writer's TZ deciding what wall-clock is stored and the reader's deciding what it means, which is exactly what a `> now()` comparison in Postgres is; run under `America/New_York`, a reset token with an hour left is stored as `13:27` and judged **already expired, four hours early** — a lockout west of UTC, and east of it the same mechanism runs the window long. The fix is two declaration flags and one guarded migration, where the guard is the whole engineering: `AT TIME ZONE 'UTC'` on a column that is *already* timestamptz returns a naive value and would shift every live token, so the conversion fires only on what is still naive and is therefore correct in both of the environments the original race created. The one row carrying a value came through byte-identical — and my first check said otherwise, because `::bigint` rounded `.89` up, which is recorded because a verification that quietly re-runs until it goes green is not a verification. Auth is untouched and its behaviour preserved by not touching it. **Tier 0 is complete: the three items engineering could close are closed, and the fourth — minors' data — was never engineering's to close, which CONV1 said on the day it was written.**

---

*Implementation report — CONV1 items `SEC-2` and `SEC-3`. Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: `rollback/SEC23-auth-token-expiry-timestamptz-20260716` → `7d1dd2ce`.*
