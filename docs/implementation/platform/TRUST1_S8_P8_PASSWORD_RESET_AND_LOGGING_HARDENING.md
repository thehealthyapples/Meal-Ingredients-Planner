# TRUST1-S8 + TRUST1-P8 — Password Reset Token & Application Logging Hardening — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform` (TRUST1-S — Security; TRUST1-P — Privacy)
**Parent plan:** [`TRUST1_PHASE0_IMPLEMENTATION_PLAN.md`](./TRUST1_PHASE0_IMPLEMENTATION_PLAN.md) §§ "TRUST1-S8", "TRUST1-P8" — **milestone M2**
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md) §§ 5.1 (P8), 5.2 (S8)

**Risk:** 🟡 AMBER
**Reason:** No schema, no migration, no data change. But it alters the shape of `GET /api/user`'s response (two fields removed, and the serialiser inverted from denylist to allowlist) and removes a logging behaviour engineers may have been relying on. Both are deliberate; both are the deliverable.

**Status:** Implemented and verified — automated (39 assertions), full suite green, and manually walked end-to-end against a real server with a real, live reset token. **Not pushed, not deployed.**

---

## WHY THESE TWO ARE ONE IMPLEMENTATION

They are not two defects that happen to be adjacent. They are **one information-disclosure pathway with two halves**, and each half is what makes the other severe:

```
users.passwordResetToken  (a live bearer credential — whoever holds it owns the account)
        │
        ├── S8 ──▶ sanitizeUser()'s DENYLIST omitted it   ──▶ returned in GET /api/user's body
        │                                                         │
        └── P8 ──▶ the request logger stringified every response body into stdout
                                                                  │
                                                                  ▼
                                            a live password reset, in plaintext, in the log
```

Fix only **S8** and the log still carries every weight, BMI, mood score, child's name and child's allergy the API returns. Fix only **P8** and the token is still handed to the browser, the network tab, and every proxy in between. The plan is explicit — *"S8 and P8 are one defect with two halves … either fix alone leaves a real exposure, and they should be committed together"* — and that is why they share one rollback identifier, one test file, and one report.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/TRUST1-S8-P8-reset-token-and-logging-20260711` → `c71918b01fdea3e722bddc2e78d5448c12bcb065` |
| Points at | The **TRUST1-S1 milestone commit** (`c71918b`), created immediately before this work began |
| Working tree at tag time | **Intentionally dirty** — the same eleven pre-existing `PDA1`/`PKR` entries. Per `ROLLBACK_PROTECTION_PROTOCOL.md` § 3 the tag protects **none** of it. It was not touched, staged, or committed |
| Rollback to committed state | `git checkout rollback/TRUST1-S8-P8-reset-token-and-logging-20260711` |
| Rollback of this task alone | `git checkout rollback/TRUST1-S8-P8-reset-token-and-logging-20260711 -- server/lib/sanitizeUser.ts server/index.ts package.json` <br> `rm server/tests/test-trust1-s8-p8-no-secret-disclosure.ts` |

> **A revert here is a decision to re-open the disclosure**, and should be recorded as one. Reverting P8 restores a log that contains children's medical data; reverting S8 restores a live reset token in every profile response. Neither is a neutral act.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap, canonical entry point (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — § 5.1 `P8`, § 5.2 `S8`, § 6.1 (the `O2`/`O4` ordering constraints)
- [x] `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` — the task plans, milestone **M2**, and the regression surface
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — Architecture Compliance Checklist, mandatory sections
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- [x] `server/intelligence/handlers/profile-read-handler.ts` — **the existing allowlist precedent this change converges on** (see Architecture Compliance)

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity                                                  ✓ PASS
  Explain: No entity created or re-keyed. `users.id` remains the sole identity;
  this change alters only which of that row's COLUMNS may be serialised.

□ One owner per fact                                                      ✓ PASS
  Explain: The fact is "which `users` columns may leave the server".
  server/lib/sanitizeUser.ts is and remains its ONE owner. This change makes it
  an owner that can actually be checked: SAFE_USER_FIELDS + SECRET_USER_FIELDS
  are now proven EXHAUSTIVE over the real Drizzle table at runtime, so the fact
  cannot silently drift from the schema it describes. That drift IS the defect:
  two columns were added to `users` and the owner of this fact never heard.

□ No duplicate entities                                                   ✓ PASS
  Explain: None created.

□ No duplicate ownership                                                  ✓ PASS
  Explain: No second serialiser is introduced. Note an EXISTING second
  projection that is NOT a duplicate and was deliberately left alone:
  server/intelligence/handlers/profile-read-handler.ts already projects an
  explicit allowlist for the Companion's profile-read capability. It is a
  DIFFERENT view for a DIFFERENT audience (INT17 context vs. the user's own
  profile) and correctly excludes all five secret fields already. This change
  CONVERGES sanitizeUser onto the discipline that handler already had, rather
  than creating a rival. See SCOPE LOCK for the one naming hazard found nearby.

□ No duplicate state                                                      ✓ PASS
  Explain: No state read, written, or split. sanitizeUser is a pure projection.

□ Extends existing architecture                                           ✓ PASS
  Explain: sanitizeUser.ts is EVOLVED, not replaced (its denylist becomes an
  allowlist, in place, in one file). The request-log middleware is REDUCED, not
  rewritten — the method/path/status/duration line it existed to emit is
  preserved byte-for-byte.

□ Progressive enrichment where appropriate                                ✓ N/A
  Explain: Transactional/identity state, not a knowledge entity.

□ Knowledge domain compliance                                             ✓ N/A
  Explain: Introduces and extends no knowledge domain.

□ Honest gaps over fabricated information                                 ✓ PASS
  Explain: The allowlist FAILS CLOSED. A `users` column nobody has classified is
  withheld rather than guessed at, and `npm test` fails until a human decides.
  Absence is the default; a new column is honestly invisible, not accidentally
  public.

□ No permanent synchronisation bridge                                     ✓ PASS
  Explain: None. The exhaustiveness check is not a bridge — it does not KEEP two
  owners in sync, it FAILS when they disagree. That is the opposite of a bridge:
  it refuses to paper over the divergence.

□ Evolution over replacement                                              ✓ PASS
  Explain: Nothing retired. TRUST1-O4 (structured logging with a field-level
  redaction allowlist) will later replace the mechanism; P8 sets the requirement
  it must satisfy and deliberately does not pre-build it (§ Scope Lock).
```

**No item failed. No Trust & Claims hard stop (STEP 7) was triggered.**

### PRODUCT REGISTRY IMPACT

```
PRODUCT REGISTRY IMPACT
=======================
Registry affected: NO

Entries created:   NONE
Entries updated:   NONE
Entries retired:   NONE
Product knowledge written into a prompt/template/fallback string: NO  (Rule PKR27)
```

**Justification.** *"Would a person's answer to 'what is THA?' be different after this change?"* — **no.** No route, page, journey, capability, dialog, setting, claim or benefit changes. The two fields removed from `GET /api/user` were **never rendered**: the client does not reference `passwordReset*` anywhere (verified by grep across `client/`). Nothing a household can see is different.

### DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:            users (read projection only)
Declared SoT:               `users` table (shared/schema.ts) — unchanged
New store created?          NO
Existing store extended?    NO
Consumer created?           NO
  sanitizeUser is an EXISTING consumer whose projection is narrowed.
```

---

## IMPLEMENTATION

### Files changed — 4

| File | Change |
|---|---|
| `server/lib/sanitizeUser.ts` | **Rewritten** — denylist → allowlist. `SAFE_USER_FIELDS` (27), `SECRET_USER_FIELDS` (5), a compile-time exhaustiveness guard, and `SafeUser` now *derived* from the allowlist rather than hand-written |
| `server/index.ts` | **The `res.json` monkey-patch and the response-body append are deleted.** The operational log line is preserved unchanged |
| `server/tests/test-trust1-s8-p8-no-secret-disclosure.ts` | **NEW** — 39 assertions across 3 levels |
| `package.json` | Test script registered and wired into `npm test`, second (immediately after S1) |

### S8 — the serialiser fails closed

The denylist spread the whole row and `delete`d three known-bad fields. That is safe only while somebody remembers to extend it on every new column — and nobody did. `passwordResetToken` and `passwordResetExpires` were added to the very table the denylist existed to protect, were never added to it, and were therefore returned to any client holding a session.

**The denylist had already failed twice, on the same table, for the same reason.** Extending it to five entries would not have been a fix; it would have been a deferral until the next column. So the default is inverted:

| | Denylist (before) | Allowlist (after) |
|---|---|---|
| A **new** `users` column | **Returned.** Visible by default | **Withheld.** Invisible by default |
| Getting it wrong requires | Remembering, forever, every time | Nothing — the failure is safe |
| A column nobody classified | Ships silently | **Fails `npm test`** until a human decides |

`SAFE_USER_FIELDS` (27 entries) and `SECRET_USER_FIELDS` (5) are **exhaustive over `users`**, and that exhaustiveness is *proven at runtime* against the real Drizzle table via `getTableColumns(users)` — not asserted in a comment. Add a 33rd column, classify it in neither list, and the suite fails naming it. This is the assertion that stops the *next* leak; the field removal only stops this one.

A compile-time guard sits alongside it, naming an unclassified column at the point of the omission. It is deliberately **not** the enforcing gate: `typecheck` is red at baseline (175 pre-existing errors — `TRUST1-S10`'s M0 problem), so a new error there could be lost in the noise, whereas `npm test` is green and stays green.

**The blast radius was kept to exactly the defect.** Every non-secret column keeps its existing visibility — the allowlist reproduces the old output *precisely*, minus the two fields that were never meant to be in it. This is not the moment to re-litigate whether, say, `demoClaimedEmail` should be in a profile response.

### P8 — the log stops carrying the payload

The middleware monkey-patched `res.json`, captured every response body, and appended it — serialised and entire — to the request's log line. No redaction, no truncation, no allowlist. So the plaintext process log contained **every weight, BMI, sleep hour, mood score, dietary restriction, child's name, child's allergy, email address, Companion utterance and live reset token the system had ever returned** — because every one of those is returned in an API response, and every API response was stringified into the log.

The body capture is deleted. What remains is what the log was actually *for*:

```
12:45:29 PM [express] POST /api/forgot-password 200 in 15ms
12:45:31 PM [express] POST /api/login 200 in 77ms
12:45:31 PM [express] GET /api/user 200 in 14ms
```

Method, path, status, duration — enough to see traffic, latency, and failures, and carrying no personal data. `req.path` is the pathname only and never includes a query string, so a token passed as `?token=` cannot reach the log through it either.

**Nothing more is built here, deliberately.** A structured logger with a field-level redaction allowlist is the right end state and it is **`TRUST1-O4`'s**. P8 owns the *requirement* that personal data never reaches a log; O4 owns the *mechanism* that makes reintroducing it structurally hard. Building the mechanism now means building it twice (`TRUST1` § 6.1).

---

## TESTS ADDED

**`server/tests/test-trust1-s8-p8-no-secret-disclosure.ts`** — **39 assertions**, wired into `npm test` second (right after S1).

| Level | Assertions | What it proves |
|---|---|---|
| **1. Unit — the allowlist** | 13 | Every one of the 32 real `users` columns is classified; the lists are disjoint and contain no phantoms; all 5 secret fields are stripped; the output is **exactly** the allowlist; a field the serialiser has never heard of is **dropped, not passed through** (the behavioural difference between the two designs); safe fields survive, so the product still works |
| **2. Source — regression protection** | 2 | Across **377 files** under `server/`: no `res.json` reassignment, no captured-body variable, no log-line append. This is the pattern check that stops the *next* reintroduction — a developer who "helpfully" restores response logging to debug something trips it immediately |
| **3. End-to-end — the real thing** | 24 | **A real password reset, against a real server, with the real token.** |

### The end-to-end test is the one that matters

A unit test proves the serialiser is *correct*. Only driving the actual flow proves the token that actually gets minted never actually escapes. So the test:

1. creates a throwaway user in the real database;
2. spawns the **real server** on an ephemeral port;
3. `POST /api/forgot-password` — a **genuine reset**, minting a genuine 64-character bearer token;
4. reads that token **back out of the database** — this is the real credential, not a fixture;
5. proves that exact string appears in **no** API response (`forgot-password`, `login`, and `GET /api/user` — the route that used to hand it out);
6. proves it appears in **no log line**, and that **no response body** was appended to any log line;
7. proves the log is **still operational** — a silent log is not a fixed log;
8. deletes the user, whatever happened.

It has a **guard on the guard**: if no token was minted, every assertion below it would be vacuously true, so the test asserts the token is ≥32 chars *before* searching for it. That guard earned its place — the first manual run of this verification silently created no user, produced an empty token, and `grep -F ""` matched every line, reporting three cheerful "leaks" that did not exist. A test that greps for an empty string proves nothing and says it proved everything.

**No outward-facing side effects.** `SMTP_USER`/`SMTP_PASS` are unset for the spawned child, so no real email is sent. `setPasswordResetToken` runs *before* `sendPasswordResetEmail`, so the token is still genuinely minted and stored.

**The test binds an ephemeral port, and that is load-bearing.** An earlier draft used a fixed port (5177). Replit detected the new listening port and **rewrote `.replit`**, a tracked deployment-config file, to add a mapping for it. Since `deploy.sh` runs `git add -A` (`TRUST1-O7`), that config change would eventually have been committed by nobody, on purpose, at no point. The test now asks the OS for a free ephemeral port, which the platform does not map. The `.replit` change was reverted and is verified clean.

---

## VALIDATION PERFORMED

Every row is a command that actually ran.

| Command | Result |
|---|---|
| `npm run test:trust1-s8-p8-no-secret-disclosure` | ✅ **39 passed, 0 failed** — including all 24 end-to-end assertions (`DATABASE_URL` present, nothing skipped) |
| `npm run test:trust1-s1-session-secret` | ✅ **17 passed, 0 failed** — S1 not regressed |
| `npm test` (full suite) | ✅ **See § Full Suite Result** |
| `npx tsc --noEmit` — working tree | **175 errors** |
| `npx tsc --noEmit` — at rollback tag `c71918b` | **175 errors** |
| `npx tsc --noEmit \| grep -E "sanitizeUser\|trust1-s8-p8\|server/index"` | **none — all changed files are typecheck-clean** |
| `git diff --quiet .replit` | ✅ **clean** — the test no longer mutates deployment config |

**Typecheck parity: 175 → 175.** Zero new errors.

**The `SafeUser` type ripple the plan predicted did not materialise, and that is a finding, not luck.** The plan warned that inverting the type *"changes the exported `SafeUser` type's shape, so `npm run typecheck` will surface every consumer that reads a field the allowlist does not carry."* It surfaced none — because **no consumer ever read the reset fields.** All four `sanitizeUser` call sites (`server/auth.ts:273`, `:399`, `:410`; `server/routes.ts:5040`) simply pass the result to `res.json`, and `client/` never references `passwordReset*` at all (verified by grep). The fields were leaked to *everyone* and read by *nobody* — which is precisely the profile of a defect that survives for years.

An intermediate version of the new test *did* break parity (175 → 178, via a `never` spread and an over-narrowed `ProcessEnv`). It was fixed rather than tolerated: the plan's standard is that *"a suite that was already red in one place and is now red in two has regressed."*

---

## FULL SUITE RESULT

`npm test`, run in full against this working tree:

```
FULL SUITE EXIT: 0
61 suites executed
Zero failed assertions across the entire run
  TRUST1-S1:     17 passed, 0 failed
  TRUST1-S8+P8:  39 passed, 0 failed
```

✅ **No regression.** The suite grew from 59 (pre-TRUST1) to 61: S1 runs first, S8+P8 second, so both gate the other 59.

> **This is not the `M0` baseline.** It shows the suite passes *on this machine*, where `DATABASE_URL` is set. Whether it passes **from a clean checkout on a clean runner** remains unanswered — and this task's new suite is now a further test that requires a database for its end-to-end assertions. That question is `TRUST1-S10`'s, and this result must not be mistaken for having answered it.

---

## MANUAL VERIFICATION STEPS & RESULTS

Walked by hand against a **real running server** with a **real live reset token** — not a fixture, not a mock. Raw evidence below.

### Step 1 — Trigger a password reset

```
$ curl -X POST http://127.0.0.1:5199/api/forgot-password \
       -H 'Content-Type: application/json' \
       -d '{"username":"manual-verify-s8p8@test.invalid"}'

{"message":"If that email is registered, a reset link has been sent."}
```

The token actually minted and stored in the database by that call:

```
users.passwordResetToken = 3fbd6e3fe179d76d8d26d40be7bbadd6a09028ff2576a4cb4dc7059706cbedca
```

✅ **A real, live, 64-character bearer credential exists.** Everything below searches for *that exact string*, so none of it is vacuous.

### Step 2 — Verify no reset token appears in any API response

`GET /api/user` — **the route that used to hand the token out** — returns, in full:

```json
{"id":304,"username":"manual-verify-s8p8@test.invalid","displayName":null,"firstName":null,
 "profilePhotoUrl":null,"measurementPreference":"metric","preferredPriceTier":"standard",
 "onboardingCompleted":false,"starterMealsLoaded":false,"isBetaUser":true,"emailVerified":true,
 "dietPattern":null,"dietRestrictions":null,"eatingSchedule":null,"role":"user",
 "subscriptionTier":"free","subscriptionStatus":null,"subscriptionExpiresAt":null,
 "updatedAt":"2026-07-11T12:45:29.446Z","isDemo":false,"demoExpiresAt":null,
 "demoClaimedEmail":null,"createdAt":"2026-07-11T12:45:29.446Z",
 "lastLoginAt":"2026-07-11T12:45:31.215Z","lastSeenAt":null,
 "customMetricDefs":null,"diaryExtraMetrics":null}
```

That is **exactly the 27 allowlisted fields, and nothing else.**

| Check | Result |
|---|---|
| Token in `POST /api/forgot-password` response | ✅ absent |
| Token in `POST /api/login` response | ✅ absent |
| Token in `GET /api/user` response | ✅ **absent** |
| Any `passwordReset*` field in `GET /api/user` | ✅ **none** |
| Any `password` field in `GET /api/user` | ✅ **none** |

### Step 3 — Verify no reset token appears in application logs

| Check | Result |
|---|---|
| The live token `3fbd6e3f…cbedca` anywhere in the server log | ✅ **appears nowhere** |
| Any response body appended to any log line (` :: {`) | ✅ **none** |
| `"passwordResetToken"` / `"passwordResetExpires"` in the log | ✅ none |
| `"password"` / `"emailVerificationToken"` in the log | ✅ none |
| `"weight"` / `"bmi"` / `"allergy"` in the log | ✅ none |
| `"displayName"` / `"username"` in the log | ✅ none |

### Step 4 — Verify logging remains operational

The actual `/api` lines emitted during the run above:

```
12:45:29 PM [express] POST /api/forgot-password 200 in 15ms
12:45:31 PM [express] POST /api/login 200 in 77ms
12:45:31 PM [express] GET /api/user 200 in 14ms
```

✅ **Method, path, status and duration all intact.** Traffic, latency and failures remain diagnosable. **A silent log would not have been a fixed log** — this is the check that distinguishes redaction from deletion.

### Step 5 — Run all required tests

✅ S8+P8 suite: **39/39**. S1 suite: **17/17**. Full `npm test`: see below. Typecheck: **parity**.

### Step 6 — Cleanup

The throwaway user was deleted (`rows remaining = 0`). It was **holding a live reset token at the time**, which is precisely why it was not left lying in the database. The temporary helper script was removed and `.replit` restored.

---

## USER ACCEPTANCE EVIDENCE

**The acceptance question:** *if a household resets their password today, can anyone who reads a log — or a browser network tab — take their account?*

**Before this change: yes.** The reset token was returned in the body of `GET /api/user` to any client holding a session, and that body was written verbatim to stdout. A password reset was available to anyone with log access.

**After this change: no — demonstrated, not asserted.** A real reset was triggered; the real token was read out of the database; and that exact 64-character string was then shown to be absent from every API response and every log line, on a live server, above.

| Acceptance criterion | Evidence | Verdict |
|---|---|---|
| A user can still request a password reset | `POST /api/forgot-password` → `200`, token minted and stored | ✅ **works** |
| A user can still log in | `POST /api/login` → `200`, session issued | ✅ **works** |
| A user can still read their profile | `GET /api/user` → `200`, all 27 profile fields present | ✅ **works** |
| The reset token is never disclosed to the client | Absent from all three response bodies | ✅ **closed** |
| The reset token is never written to a log | Absent from the full server log | ✅ **closed** |
| Personal data is never written to a log | No response body in any log line | ✅ **closed** |
| Operators can still debug | Method/path/status/duration lines intact | ✅ **preserved** |
| Nothing else broke | Full suite green; typecheck at parity | ✅ **no regression** |

**Nothing the household could previously do, they can no longer do.** The only behaviour removed is behaviour no client ever consumed and no user ever saw.

---

## DEFINITION OF DONE

Against the plan's stated Definition of Done for each task:

### TRUST1-S8

| # | Criterion | Status |
|---|---|---|
| 1 | `GET /api/user` returns no reset token and no reset expiry | ✅ **Met** — verified on the wire against a live token |
| 2 | `sanitizeUser` is an allowlist; `SafeUser` is derived from it | ✅ **Met** — `SafeUser = Pick<User, typeof SAFE_USER_FIELDS[number]>` |
| 3 | A test asserts the allowlist and would fail on a new, unlisted `users` column | ✅ **Met** — proven exhaustive at runtime against the real Drizzle table |
| 4 | Every `SafeUser` consumer typechecks | ✅ **Met** — typecheck at parity; no consumer read the removed fields |

### TRUST1-P8

| # | Criterion | Status |
|---|---|---|
| 1 | No API response body is written to any log, in any environment | ✅ **Met** — capture deleted; source scan over 377 files confirms none remains |
| 2 | The existing method/path/status/duration line is preserved | ✅ **Met** — observed intact on a live server |
| 3 | A test asserts no known personal-data field name appears in log output, and runs in `npm test` | ✅ **Met** — 9 field names asserted against a real captured log |

### What must not break

- Password reset, login, and profile read must still work. ✅ All three verified working on a live server.
- The full suite must not regress. ✅ Green.
- `typecheck` must not get worse. ✅ 175 → 175.

---

## DATA IMPACT

- **Reads existing data:** YES — `sanitizeUser` projects an already-fetched `users` row. No new query.
- **Writes new data:** NO — *(the test writes and then deletes a throwaway user; the application does not)*
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO

**No schema change, no migration, no column added or dropped.** `passwordResetToken` and `passwordResetExpires` remain on the `users` table and remain fully functional — they are still written by `/api/forgot-password` and still read by `/api/reset-password`. What changed is that they no longer *leave the server*.

> **A note on data already spilled.** This change stops the leak; it does not un-leak. Any log already shipped to an aggregator still contains whatever it contained. Assessing and purging historical logs is not in P8's scope and is not claimed here — it belongs with `TRUST1-O4` (durable log destination) and `TRUST1-P7` (retention). **It should not be forgotten because this report is green.**

---

## TRUST CHECK

- **Could this mislead the user?** No. Nothing user-facing changes; the removed fields were never rendered.
- **Could this fabricate certainty?** The guard was applied hardest where it nearly failed. The first manual verification run produced three "TOKEN LEAKED" results that were **artefacts of grepping for an empty string** after user creation silently failed. Reporting those as findings would have been alarming and wrong; reporting the run as a pass after fixing the harness *without* the vacuity guard would have been worse. The test now refuses to assert anything until it has confirmed a real ≥32-char token exists.
- **Is anything guessed but shown as real?** No. Every check searches for the *actual* token minted by the *actual* reset, read back from the *actual* database.
- **What happens if the system is wrong?** The allowlist fails **closed**: an unclassified column is withheld, not disclosed. The worst outcome of a mistake here is a missing field in a profile response — visible, harmless, and instantly diagnosable. The worst outcome of the *previous* design was an account takeover.
- **No architectural duplication introduced:** YES — and `sanitizeUser` is converged onto the allowlist discipline `profile-read-handler.ts` already had.
- **No new source of truth created:** YES. `sanitizeUser.ts` remains the one owner of "what may leave the server", now provably in step with the schema.
- **No runtime behaviour altered:** **NO — it is altered, deliberately.** Two fields leave `GET /api/user`'s response and all response bodies leave the log. Both are the deliverable.
- **Every "verified" claim backed by a command that ran:** YES. Raw output is reproduced above, including the actual token and the actual response body.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/TRUST1-S8-P8-reset-token-and-logging-20260711` → `c71918b01fdea3e722bddc2e78d5448c12bcb065`
- **Files modified:** `server/lib/sanitizeUser.ts`, `server/index.ts`, `package.json`
- **Files created:** `server/tests/test-trust1-s8-p8-no-secret-disclosure.ts`, this report

```bash
# Restore this task's code
git checkout rollback/TRUST1-S8-P8-reset-token-and-logging-20260711 -- \
  server/lib/sanitizeUser.ts server/index.ts package.json

# Remove what it created
rm server/tests/test-trust1-s8-p8-no-secret-disclosure.ts
rm docs/implementation/platform/TRUST1_S8_P8_PASSWORD_RESET_AND_LOGGING_HARDENING.md
```

**Verification after rollback:** `GET /api/user` again returns `passwordResetToken`; the log again carries response bodies. **Both are the defect, restored.**

**Regression risk of the change itself is low and bounded.** The identifiable risk was the `SafeUser` type ripple, and it did not occur (no consumer read the removed fields). The second identifiable risk — an operator relying on response-body logs to debug — is real, and the mitigation is that the operational line is preserved and `TRUST1-O4` will provide structured, redacted logging properly.

---

## SCOPE LOCK

**Implemented scope — `TRUST1-S8` and `TRUST1-P8` only:**
- Password reset tokens are never returned in an API response *(S8)*
- Password reset tokens are never written to a log *(S8 + P8)*
- No API response body is written to any log *(P8)*
- Operational logging preserved — method, path, status, duration *(P8)*
- Automated tests over reset responses, logging behaviour, and regression protection
- Existing functionality verified working end-to-end

**Explicitly excluded — not started, not partially done:**
- **`TRUST1-O4`** — structured logging (`pino`/`winston`) with a field-level redaction allowlist. **P8 owns the requirement; O4 owns the mechanism.** Building it here means building it twice.
- **`TRUST1-O2`** — error tracking. It is **hard-blocked on P8** (`TRUST1` § 6.1) and is now *unblocked* by this change — but it is not started.
- **`TRUST1-S2`** — `cookie.secure` is still hardcoded `false`. **Untouched.**
- **`TRUST1-S3`, `S5`, `S10`, `V3`, `O7`** — untouched.
- **Historical log purging** — see Data Impact. Not in scope, not claimed, not forgotten.
- **The six-character password floor** (`server/auth.ts:129`, `:283`, `:316`) — still there. That is `TRUST1-S7`, Phase 4.

**SUGGESTIONS — observed in scope, not implemented, requiring approval:**

1. **There are two exported types named `SafeUser`, and they are not the same thing.** `server/lib/sanitizeUser.ts` exports the user's own full profile (27 fields); `server/storage.ts:22` exports an unrelated **8-field admin list-row** projection used by `searchUsers` / `setUserSubscriptionTier`. Both are correct and neither is a duplicate owner — they are different views for different audiences — but sharing a name across two modules that both concern "a safe user" is a trap primed for the next person who imports the wrong one. **Recommend renaming storage's to `AdminUserListRow`.** Not done here: it touches admin routes and is outside S8's objective.

2. **The global error handler returns `err.message` straight to the client** (`server/index.ts`) and logs the full error object. An unexpected error's message can carry internal detail and, in principle, personal data. This is named in `TRUST1-O2`'s deliverable (*"the global handler returning a generic message for unexpected errors while logging the detail"*) and is **deliberately left to O2** — but it is the nearest remaining disclosure surface to the one just closed, and it is worth knowing that P8 did not close it.

3. **`console.*` remains the logging mechanism, and there are 410 calls in `server/routes.ts` alone.** P8 removed the *systemic* leak (every response body, automatically). It cannot prevent an individual `console.log(user)` written by hand tomorrow. **Only `TRUST1-O4`'s redacting logger makes that structurally hard**, and until it lands, the discipline is manual. The regression test catches the *pattern* that caused this defect, not every possible future one.

---

## OUTCOME

**A password reset can no longer be stolen from a log file.**

Before this change, `users.passwordResetToken` — a live, single-use bearer credential that hands over an account to whoever holds it — was returned in the body of `GET /api/user` to any client with a session, because `sanitizeUser`'s denylist had never been told about it. And every API response body was then stringified verbatim into stdout by the request logger. So the plaintext process log contained live password-reset tokens, alongside every weight, BMI, mood score, dietary restriction, child's name and child's allergy the platform had ever returned. Logs are shipped to third-party aggregators, retained far longer than application data, and read by people with no business reading a child's medical information.

Both halves are closed, and the closure is demonstrated rather than asserted: a real reset was driven against a real server, the real token was read back out of the database, and that exact string was shown to be absent from every response and every log line — while password reset, login and profile read all still work, and the log still tells an operator what happened and how long it took.

The more durable change is the *shape* of the fix. The serialiser now **fails closed**: a new column on `users` is withheld by default and fails the test suite until a human classifies it. The denylist failed twice because a new column defaulted to *visible*, and a rule that depends on everyone remembering it forever is not a rule. **Closes R8 (🔴 RED) and R2 (🔴 RED) — the latter being, in the parent programme's words, the single highest-severity privacy defect in the codebase and the cheapest to fix.**

---

## NEXT STEPS

**Nothing is pushed. Nothing is deployed.** This work is committed locally as milestone **M2**.

1. **`TRUST1-O2` (error tracking) is now unblocked.** Its hard dependency was P8 — integrating it beforehand would have shipped personal data to a third-party processor, at volume, inside error payloads. That hazard is gone.
2. **Historical logs still contain what they contained.** This change stops the flow; it does not purge the reservoir. Whether any log has already been shipped to a third party, and what to do about it, is a live question this report does not answer.
3. **Deploy cadence remains undecided.** The plan recommends M1 and M2 deploy as they land under `PRODUCTION_RELEASE.md`'s manual, human-authorised checklist, since the exposures they close are live today — and requires that whichever choice is made be **recorded**. It has not been recorded yet.

**Remaining Phase 0 tasks: `S2`, `S3`, `S5`, `S10`, `V3`, `O7`** — of which the plan's next is **`TRUST1-S2`** (secure production cookies), carrying the documented `isProduction` trap at `server/auth.ts:35`.
