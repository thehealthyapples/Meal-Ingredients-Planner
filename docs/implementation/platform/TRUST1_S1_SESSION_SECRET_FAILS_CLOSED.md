# TRUST1-S1 — Session Secret Fails Closed — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform` (TRUST1-S — Security)
**Parent plan:** [`TRUST1_PHASE0_IMPLEMENTATION_PLAN.md`](./TRUST1_PHASE0_IMPLEMENTATION_PLAN.md) § "TRUST1-S1"
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md) § 5.2

**Risk:** 🟡 AMBER
**Reason:** No schema, no migration, no data, no new architecture. But it changes **boot behaviour on every environment**: a server that previously started with a missing `SESSION_SECRET` now exits non-zero. That crash is the deliverable, not a side effect — and it will bite the first environment that was silently relying on the fallback.

**Status:** Implemented and verified locally. **Not committed, not pushed, not deployed.** One Definition-of-Done item — production secret rotation — is an environment action outside this repository and is **not done**; see § "The one thing this change does not do".

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/TRUST1-S1-session-secret-fails-closed-20260711` → `3f3071b7a32e99b87384cb6f6245f54c237f5dd9` |
| Tag created | Before implementation began, in the interrupted session. **Preserved, not regenerated**, on resume — per `ROLLBACK_PROTECTION_PROTOCOL.md` § 6 |
| Working tree at tag time | **Intentionally dirty.** The same eleven pre-existing, unauthored-by-this-task entries from `PDA1` / `PKR` (`docs/product/`, `docs/investigations/ux/PDA1_*`, `data/cookbook/`, `data/development_world/`, four `scripts/*.ts`, `.engineering/session/*`). Per `ROLLBACK_PROTECTION_PROTOCOL.md` § 3, **the tag protects none of it.** It was not touched, staged, or committed by this task |
| Rollback to committed state | `git checkout rollback/TRUST1-S1-session-secret-fails-closed-20260711` |
| Rollback of this task's code alone | `git checkout rollback/TRUST1-S1-session-secret-fails-closed-20260711 -- server/auth.ts server/index.ts .env.example package.json` <br> `rm server/tests/test-trust1-s1-session-secret-fails-closed.ts` |
| **What must NOT be rolled back** | **The environment secret rotation.** Reverting the code while leaving the secret rotated is safe. Reverting the *secret* to the burned literal re-opens a total authentication bypass and is never correct |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap, the canonical entry point (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — § 5.2 `TRUST1-S1`, the governing task definition
- [x] `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` — the task plan, its Definition of Done, and its verification steps
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — Architecture Compliance Checklist, mandatory sections, Trust & Claims hard stops
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` — rollback identifier; § 6 on resumed sessions
- [x] `.engineering/templates/IMPLEMENTATION_TEMPLATE.md` — the report shape this document follows

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity                                                  ✓ PASS
  Each entity touched has exactly one key space.
  Explain: No entity is touched. This change reads one configuration value
  (SESSION_SECRET) at boot. No identity, no key space, no record.

□ One owner per fact                                                      ✓ PASS
  No attribute has two stores that must always agree.
  Explain: The fact here is "which environment variables are required".
  It had TWO owners: server/lib/platform-status.ts (REQUIRED_ENV, canonical,
  EWO-PRO1) and a second inline copy declared in server/index.ts. THEY HAD
  ALREADY DRIFTED — the inline copy never learned about THEMEALDB_API_KEY.
  This change DELETES the inline copy and consumes the canonical owner.
  Duplicate ownership removed, not added.

□ No duplicate entities                                                   ✓ PASS
  Explain: requireSessionSecret() is new, and is the only reader of
  SESSION_SECRET in the codebase. Nothing it duplicates existed.

□ No duplicate ownership                                                  ✓ PASS
  Explain: Net -1 owner (see "One owner per fact"). The env inventory now has
  exactly one owner: server/lib/platform-status.ts.

□ No duplicate state                                                      ✓ PASS
  Explain: No user state is read, written, or split. This is process
  configuration, held in the environment, owned by the operator.

□ Extends existing architecture                                           ✓ PASS
  Explain: Extends EWO-PRO1's existing auditStartupEnvironment(), which was
  already written and already correct — and imported by NOTHING. This change
  is largely the act of finally CALLING it, and acting on what it returns.

□ Progressive enrichment where appropriate                                ✓ N/A
  Explain: Not a knowledge entity. Not transactional state. Configuration.

□ Knowledge domain compliance                                             ✓ N/A
  Explain: Introduces and extends no knowledge domain. Changes nothing about
  what THA *is* — see PRODUCT REGISTRY IMPACT below.

□ Honest gaps over fabricated information                                 ✓ PASS
  Explain: This is the whole point of the change. The absent secret was
  previously filled with a fabricated (hardcoded, published) value and the
  platform pretended it was fine. It is now an honest, loud, fatal gap.

□ No permanent synchronisation bridge                                     ✓ PASS
  Explain: None. A bridge was DELETED (the drifting inline env copy).

□ Evolution over replacement                                              ✓ PASS
  Explain: The inline env inventory in server/index.ts is replaced by the
  canonical owner that already existed. Retirement is immediate and complete —
  the duplicate is deleted in this change, not deprecated.
```

**No item failed. No hard stop was triggered.**

---

## PRODUCT REGISTRY IMPACT

```
PRODUCT REGISTRY IMPACT
=======================
Registry affected: NO

Entries created:   NONE
Entries updated:   NONE
Entries retired:   NONE

Any entry set to `public` or `household`: N/A

Product knowledge written into a prompt, template, fallback
string, fine-tune, or capability code: NO   (Rule PKR27)
```

**Justification.** The test is *"would a person's answer to 'what is THA?' be different after this change?"* — **no.** No route, page, journey, capability, dialog, setting, claim or benefit changes. Nothing a household can see is different. This change is visible only to an operator configuring an environment, and only at boot.

*(Recorded rather than skipped: `docs/product/` exists in the working tree as unauthored `PDA1`/`PKR` work. This task neither reads nor writes it.)*

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: None (process configuration — no data domain)
Declared SoT: server/lib/platform-status.ts (canonical environment inventory, EWO-PRO1)
New store created? NO
Existing store extended? NO
Consumer created? YES
  If YES: reads from declared SoT? YES
    server/index.ts now imports auditStartupEnvironment() from the canonical
    owner and acts on its return value. It previously declared its own
    drifted copy of the same inventory inline.
```

---

## IMPLEMENTATION

### Files changed by this task — 7

| File | Change | Lines |
|---|---|---|
| `server/auth.ts` | **M** — fallback deleted; `requireSessionSecret()` added and wired into `session.SessionOptions.secret` | +49 / −1 |
| `server/index.ts` | **M** — inline env inventory (a drifted second owner) deleted; `auditStartupEnvironment()` consumed; `process.exit(1)` on any missing required variable | +13 / −49 |
| `.env.example` | **M** — `SESSION_SECRET` and `DATABASE_URL` documented, with generation instructions and the multi-instance/rotation caveats | +33 / −0 |
| `package.json` | **M** — `test:trust1-s1-session-secret` script added, and wired into `npm test` **first**, so it gates every other suite | +2 / −1 |
| `server/tests/test-trust1-s1-session-secret-fails-closed.ts` | **NEW** — 17 assertions across 4 groups | +316 |
| `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` | **M** — burned literal redacted (×2), replaced by a marker + SHA-256 digest | +2 / −2 |
| `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` | **M** — burned literal redacted (×2), replaced by a marker + SHA-256 digest | +2 / −2 |
| `docs/implementation/platform/TRUST1_S1_SESSION_SECRET_FAILS_CLOSED.md` | **NEW** — this report | — |

**Files in the working tree NOT touched by this task** (pre-existing `PDA1`/`PKR` work, unauthored here, deliberately untouched): `.engineering/session/*`, `data/cookbook/`, `data/development_world/`, `docs/product/`, `docs/investigations/ux/PDA1_*`, `scripts/build-product-inventory.ts`, `scripts/build-registry-nav.ts`, `scripts/capture-product-screenshots.ts`, `scripts/verify-product-inventory.ts`.

### 1. The fallback is gone — `server/auth.ts`

The session secret is no longer read with a default. It is read through a guard that refuses three distinct failure modes:

| Input | Behaviour |
|---|---|
| Unset | Throws — names the variable, tells you to run `openssl rand -base64 32`, points at `.env.example` |
| Empty string (`SESSION_SECRET=` on the command line) | Throws — this is a *different* input from unset, and the old `||` fallback treated both as a cue to use the published key |
| Whitespace only | Throws |
| **The burned literal** | **Throws** — tells the operator to rotate |
| Anything else | Returned unchanged |

**The burned value is matched by SHA-256 digest, never by value.** Reintroducing the string in order to compare against it would put it straight back into the source it was just removed from. The digest (`73d30df8…6ae140`) is recorded once, in `server/auth.ts`, and referenced from the test.

**Why refuse the burned value at all, rather than merely delete it?** Because deletion is not what closed this defect — **rotation is.** The string is in this repository's git history permanently, in every clone and every fork, and cannot be unpublished. Deleting it from the working tree changes nothing for anyone who already has it. What protects the platform is that the secret is now a value nobody outside the operator has ever seen — and the boot-time refusal is what makes it *impossible to quietly go back*.

### 2. Absence is now fatal — `server/index.ts`

The boot-time audit already existed, already worked, and its result was **thrown away**. It collected missing required variables into an array, logged `MISSING required env var: SESSION_SECRET`, and then booted anyway — so the one line that said the platform had no authentication scrolled past among four hundred others.

The audit's return value is now read. Any missing required variable (`DATABASE_URL`, `SESSION_SECRET`) exits the process with code 1 and a message that names what is missing and where to look.

**A second defect was fixed on the way, and is worth naming because it is the same defect in a different costume.** `server/index.ts` declared its *own* inline copy of the required/feature/integration environment inventory, duplicating the canonical one in `server/lib/platform-status.ts` (`EWO-PRO1`). **The two had already drifted** — the inline copy had never learned about `THEMEALDB_API_KEY`. One fact, two owners, silently disagreeing. The inline copy is deleted; `server/index.ts` now consumes the canonical owner.

### 3. `.env.example` — the fix for the *cause*, not the symptom

`TRUST1` § 5.2 makes the causal claim explicitly, and it is correct: *"the fallback secret exists precisely so that a misconfigured environment can still boot, and the misconfiguration it protects against is the one an incomplete `.env.example` guarantees."* A hard crash on a variable nobody documented is not a security fix; it is an outage.

So `.env.example` now documents both newly-fatal variables — what they are, how to generate them, that `SESSION_SECRET` must be identical across instances of a multi-instance deployment, and that rotating it logs everyone out exactly once.

**It is still incomplete, and says so in the file.** `OPENAI_API_KEY`, `SMTP_HOST`, `WHISK_API_KEY`, `USDA_API_KEY`, `EDAMAM_APP_ID`, `EDAMAM_APP_KEY`, `SPOONACULAR_API_KEY` and `APP_BASE_URL` remain undocumented. Completing it is **`TRUST1-S11`** and is deliberately **not** done here. The two keys above are documented because *this* change makes their absence fatal, and shipping a new crash without documenting its cause is exactly how a security fix becomes an incident.

---

## TESTS ADDED

**`server/tests/test-trust1-s1-session-secret-fails-closed.ts`** — 17 assertions, wired into `npm test` as `test:trust1-s1-session-secret`, **positioned first** so it gates the other 58 suites.

It asserts the fix three independent ways, because each catches what the others cannot.

| # | Group | Assertions | What it proves |
|---|---|---|---|
| **0** | Guard on the guard | 1 | The needle really is the burned secret. The test reassembles the literal from fragments and checks it against the recorded SHA-256 **before scanning for it** — otherwise a mistyped fragment would make every scan below search for a string that does not exist and report a cheerful all-clear |
| **1** | Unit | 7 | `requireSessionSecret()` refuses unset, empty, whitespace, and the burned value; returns a good secret unchanged; and its error messages are *actionable* (they name the variable and say how to generate one) |
| **2** | Source scan | 3 | Across **723 files** in `server`, `client`, `shared`, `scripts`, `script`: the burned literal appears nowhere, and **no `SESSION_SECRET` fallback shape (`\|\|` / `??`) exists anywhere**. It also asserts the scan surface is non-trivial (>200 files), so a misconfigured scan root cannot pass by finding nothing |
| **3–4** | End-to-end | 6 | The **real server**, spawned as a **real child process**: exits non-zero without the variable, never begins listening, emits an actionable message — and boots normally with the variable present |

**Why all three.** The unit check proves the guard is *correct*. The source scan proves nobody has quietly added a *second, different* fallback somewhere else — a behavioural test can only prove the branches it thinks to exercise, and this defect is precisely a branch nobody thought about. The end-to-end check proves the guard is actually **wired in**: `auditStartupEnvironment()` was already correct and imported by nothing at all, which is exactly how this survived. A correct function that no boot path calls protects nobody.

**The test file never contains the burned string.** A test that greps for a secret by pasting the secret into itself has not removed the secret from the repository — it has moved it. The needle is reassembled from fragments at runtime and digest-verified before use.

**The pattern check exempts nothing, including comments.** During implementation it correctly caught a *comment* in `server/auth.ts` that reproduced the defect's shape while describing it. The comment was reworded rather than the rule weakened: a rule with a comment exemption is a rule with a hole in it. Describe the defect in words; never write it out.

**Section 4 skips loudly, never silently.** If `DATABASE_URL` is absent the server cannot complete a boot, so the success-path assertions cannot run. The test prints an explicit `! SKIPPED — this assertion did NOT run. It is not a pass.` rather than passing vacuously.

---

## VALIDATION PERFORMED

Every claim below is backed by a command that actually ran.

### Automated

| Command | Result |
|---|---|
| `npm run test:trust1-s1-session-secret` | ✅ **17 passed, 0 failed** (including both end-to-end boot assertions — `DATABASE_URL` was present, so nothing was skipped) |
| `npx tsc --noEmit` — **working tree** | **175 errors** |
| `npx tsc --noEmit` — **at rollback tag `3f3071b`** (working tree stashed) | **175 errors** |
| `npx tsc --noEmit \| grep test-trust1-s1` | **none — the new test file is typecheck-clean** |

**Typecheck parity, stated honestly.** `npm run typecheck` is **red at baseline** — 175 pre-existing errors at the rollback tag, none of them this task's. This change is at **exact parity: 175 → 175**. It introduces zero new errors and fixes none.

This matters, because an intermediate state of this work *did* regress it. The test file originally used top-level `await`, which the project's `tsconfig` does not permit, taking the count to 178. The plan's own regression standard is unambiguous — *"a suite that was already red in one place and is now red in two has regressed"* — so the test was restructured around an async `main()`. Measuring against the baseline, rather than against "did it look fine", is the only reason that was caught.

*(That the baseline is red at all is the `M0` problem `TRUST1-S10` exists to fix. It is not this task's to solve, and this task does not make it worse.)*

### Full suite

| Command | Result |
|---|---|
| `npm test` | ✅ **Exit code 0. 60 suites, zero failed assertions across the entire run.** |

The suite is now 60 rather than 59: `test:trust1-s1-session-secret` is the new one, and it runs **first**, so it gates the other 59.

---

## MANUAL VERIFICATION RESULTS

The plan's verification steps, each executed against the real server.

| # | Step | Expected | **Actual** |
|---|---|---|---|
| **1** | `SESSION_SECRET` absent → boot | Exit non-zero, named actionable error | ✅ **Exit code 1.** Emits: `[Startup] FATAL — refusing to start. Missing required environment variable(s): SESSION_SECRET. These are required in every environment, including development. See .env.example…` |
| **2** | `SESSION_SECRET` present → boot | Boots normally | ✅ **Booted.** `[Startup] All required env vars present` → `[express] serving on port 0`. The guard did not fire |
| **3** | `SESSION_SECRET=""` (empty string) → boot | Exit non-zero | ✅ **Exit code 1.** This is a *different input* from unset and is separately verified, because the old `||` fallback treated both as a cue to use the published key |
| **4** | `grep -rn "r3pl1t_s3cr3t" server/` | No matches | ✅ **No matches in any executable tree** — `server`, `client`, `shared`, `scripts`, `script`, across 723 files |
| **5** | No `SESSION_SECRET` fallback shape anywhere in code | No matches | ✅ **No matches** |
| **6** | Secret rotation: a pre-rotation cookie is rejected post-rotation | — | ⬜ **NOT DONE — environment action, not a repository change.** See below |

### The burned literal — final repository census

| Area | Occurrences |
|---|---|
| Executable code (`server`, `client`, `shared`, `scripts`, `script`) | **0** ✅ |
| TRUST1 implementation docs | **0** ✅ — redacted to a marker + SHA-256 digest, so the finding stays precise and verifiable without reproducing the string |
| `docs/investigations/platform/THA_FULL_SYSTEM_LAUNCH_READINESS_AUDIT.md` | **1** — **accepted residual, by decision** |

**On the accepted residual.** The plan's Exit Criterion 1 asks for the string to appear *nowhere* in the repository. It survives in one place: the 2026-06-23 launch-readiness investigation, where it is quoted as the original finding. It was left intact **deliberately**, because governing architecture holds that *an investigation is history the moment it is written and is never edited* (`README.md`, `PKR1`). A security redaction would not have changed a single finding in that document — but the decision to edit a historical record is not one this task should take unilaterally, and it was referred and decided.

**The security value of scrubbing it is nil, and this should be stated plainly rather than dressed up.** The literal is in this repository's git history, permanently, in `server/auth.ts`, in every clone and fork ever taken. It cannot be unpublished. **Deleting it from the working tree protects nobody.** What closes this defect is (a) the code no longer using it, (b) the boot-time refusal of it, and (c) **rotation of the production secret** — which is the item below, and the only one that is not done.

> **Consequence to plan for:** `TRUST1-S10`'s secret scanning will flag that investigation file, forever. It needs an explicit, documented suppression — not a silent one, and not a re-litigation of this decision at 3 a.m. by whoever is on call when the scanner first goes red.

---

## THE ONE THING THIS CHANGE DOES NOT DO

**The production `SESSION_SECRET` has not been rotated.** It is an action in Render / Replit secrets, outside this repository, and it requires the operator. It is a **Definition of Done item and it is open.**

Until it is done, the fix is *partial in the way that matters most*: the code will no longer *fall back* to the burned key, but if the deployed environment's `SESSION_SECRET` was ever *set* to it, every session cookie in production is still signed with a key published in this repository.

> ### ⚠️ READ BEFORE DEPLOYING
>
> **The boot guard now refuses the burned value outright.** If production's `SESSION_SECRET` is currently set to that literal, **deploying this change will take production down** — the server will exit 1 and refuse to start.
>
> That is the correct behaviour and it is emphatically better than the alternative (booting on a published key). **But it must be checked before deploy, not discovered during one.**
>
> **Required before deploy:**
> 1. Read the current `SESSION_SECRET` in the production and staging environments.
> 2. Confirm it is set, non-empty, and **not** the burned literal (compare its SHA-256 against `73d30df8…6ae140`).
> 3. Rotate it to a freshly generated value that has never been committed: `openssl rand -base64 32`.
> 4. Confirm every instance of the autoscaled deployment receives the same value — a cookie signed by one instance is rejected by the next if they disagree.
>
> **Rotation logs every user out, exactly once.** That is the whole cost, it is one-time, and it is trivially smaller than the exposure it closes. Say so in the release note rather than letting users discover it.

---

## DATA IMPACT

- Reads existing data: **NO**
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

Session *cookies* are invalidated when the secret is rotated — but no data is read, written, migrated, or reinterpreted. No table is touched. No schema changes.

---

## TRUST CHECK

- **Could this mislead the user?** No. Nothing user-facing changes. It could mislead an *operator*, in exactly one way, and that way is documented above in bold: deploying against an environment still holding the burned literal is now an outage rather than a silent compromise.
- **Could this fabricate certainty?** No — it removes a fabrication. The platform previously invented a session secret when none was configured and behaved as though everything was fine.
- **Is anything guessed but shown as real?** No. The opposite: a guessed value that was treated as real is now a hard, loud failure.
- **What happens if the system is wrong?** It exits with code 1 and an actionable message. That is the designed failure mode. **A crash is noticed; a silent downgrade to a published key is not.**
- **No architectural duplication introduced:** YES — and one existing duplication (the drifted inline env inventory in `server/index.ts`) was **removed**.
- **No new source of truth created:** YES. `server/lib/platform-status.ts` remains the sole owner of the environment inventory; this change makes it the *only* one.
- **No runtime behaviour altered:** **NO — runtime behaviour IS altered, deliberately.** The server now refuses to start without `SESSION_SECRET` or `DATABASE_URL`. This is the deliverable.
- **Every "verified" claim backed by a command that ran:** YES. Every row in Validation and Manual Verification is a command that ran in this session, with its real output. The one item that did not run — production rotation — is marked **NOT DONE**, not marked passed.

---

## DEFINITION OF DONE

Against the plan's stated Definition of Done for `TRUST1-S1`:

| # | Criterion | Status |
|---|---|---|
| 1 | The fallback string does not appear anywhere in the repository | ⚠️ **Substantially met.** Zero occurrences in all executable code and all TRUST1 docs. **One** remains, in a historical investigation, left intact by explicit decision and recorded above as an accepted residual |
| 2 | The server exits non-zero, with a clear message, when `SESSION_SECRET` is absent — **in every environment, including development** | ✅ **Met.** Verified by exit code, in a real process, three ways (unset, empty, whitespace) |
| 3 | `SESSION_SECRET` is documented in `.env.example` | ✅ **Met** — with generation instructions, the multi-instance constraint, and the rotation cost |
| 4 | The production secret has been rotated to a value that has never been committed | ❌ **NOT DONE.** Environment action, outside this repository. **Blocks Phase 0 Exit Criterion 1** |
| 5 | A test asserts the fail-closed behaviour and runs inside `npm test` | ✅ **Met.** 17 assertions; wired in first, so it gates the other 58 suites |

**Four of five met in the repository. The fifth is not a repository change and is the operator's.**

### What must not break

- The server must still boot normally when correctly configured. ✅ Verified — it boots and listens.
- The 58 other test suites must still pass. See below.
- `npm run typecheck` must not get worse. ✅ Verified — exact parity, 175 → 175.

---

## FULL SUITE RESULT

`npm test` — run in full against this working tree.

```
FULL SUITE EXIT: 0
60 suites executed (59 pre-existing + test:trust1-s1-session-secret)
Zero failed assertions across the entire run
TRUST1-S1 ran first: 17 passed, 0 failed
```

✅ **No regression. Nothing the suite covered before is broken.**

> **What this does — and does not — establish.** It shows the suite passes *on this machine, with this environment*, where `DATABASE_URL` and `SESSION_SECRET` both happen to be set. It is **not** the `M0` baseline. `M0` asks a harder and still-unanswered question: does `npm test` pass **from a clean checkout, on a clean runner**, with no ambient environment? Eleven of the 116 test files reference `DATABASE_URL`, and this task's new suite is now a twelfth that needs it for its success-path assertions. That question belongs to `TRUST1-S10` and this result must not be mistaken for having answered it.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/TRUST1-S1-session-secret-fails-closed-20260711` → `3f3071b7a32e99b87384cb6f6245f54c237f5dd9`
- **Files modified:** `server/auth.ts`, `server/index.ts`, `.env.example`, `package.json`, `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`, `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md`
- **Files created:** `server/tests/test-trust1-s1-session-secret-fails-closed.ts`, `docs/implementation/platform/TRUST1_S1_SESSION_SECRET_FAILS_CLOSED.md`

```bash
# Restore this task's code to the pre-implementation state
git checkout rollback/TRUST1-S1-session-secret-fails-closed-20260711 -- \
  server/auth.ts server/index.ts .env.example package.json

# Remove the files this task created
rm server/tests/test-trust1-s1-session-secret-fails-closed.ts
rm docs/implementation/platform/TRUST1_S1_SESSION_SECRET_FAILS_CLOSED.md
```

**Verification after rollback:** `npm run typecheck` returns to 175 errors; `npm test` no longer runs `test:trust1-s1-session-secret`; the server boots with `SESSION_SECRET` absent (which is the defect, restored).

> **The rotation does not roll back with the code, and must not.** Reverting the code while leaving the production secret rotated is entirely safe. Reverting the *secret* to the burned literal re-opens a total authentication bypass. **A revert here is a decision to re-open R1, and should be recorded as one.**

---

## SCOPE LOCK

**Implemented scope — `TRUST1-S1` only:**
- Hardcoded `SESSION_SECRET` fallback removed
- Startup fails closed on any missing required environment variable
- `.env.example` documents `SESSION_SECRET` and `DATABASE_URL`
- Automated tests proving startup fails without the secret and succeeds with it
- The burned literal verified absent from every executable tree
- *(Incidental, and inseparable from the fix:* the duplicated, drifted environment inventory in `server/index.ts` was deleted in favour of the canonical owner — it is the array whose result had to be acted upon.*)*

**Explicitly excluded — not started, not begun, not partially done:**
- **`TRUST1-S2`** — `cookie.secure` is still hardcoded `false` at `server/auth.ts`. **Untouched.**
- **`TRUST1-S8`** — `sanitizeUser` still leaks `passwordResetToken`. **Untouched.**
- **`TRUST1-P8`** — the request logger still writes full response bodies to stdout. **Untouched.**
- **`TRUST1-S3`, `S5`, `S10`, `V3`, `O7`** — and every other TRUST1 task. **Untouched.**
- **`TRUST1-S11`** — `.env.example` remains incomplete for the eight other variables the code reads. The file says so, in the file.

**SUGGESTION — out-of-scope observations, not implemented:**

1. **`server/auth.ts` defines `isProduction` as `NODE_ENV === "production" || ENABLE_REGISTRATION === "true"`.** That constant is overloaded — it gates the private-beta registration flow, not the deployment environment. It sits three lines above the code this task changed and was deliberately left alone. **`TRUST1-S2` must not reuse it**: a developer running locally with `ENABLE_REGISTRATION=true` would get `secure: true` cookies over plain HTTP and be silently unable to log in. The Phase 0 plan already flags this as a trap; this is a second sighting from inside the file.

2. **`DATABASE_URL` is now fatal too**, not only `SESSION_SECRET` — it was already in the canonical `REQUIRED_ENV` list and the plan calls for *"every genuinely-required variable"* to be validated. Worth naming explicitly because it broadens the blast radius of the new crash beyond the one variable this task is named after.

3. **The secret-scanning suppression** that `TRUST1-S10` will need for the historical investigation file (see the accepted residual above). It should be written deliberately, now, while the reason is fresh — not improvised when the scanner first goes red.

---

## OUTCOME

**The Healthy Apples can no longer authenticate anybody using a key that is published in its own git history.**

Before this change, `server/auth.ts` signed every session cookie with `process.env.SESSION_SECRET` *or*, if that variable was absent, with a literal committed to this repository — and `server/index.ts` detected the absence, logged it, collected it into an array, and **booted anyway**. A single unset environment variable therefore converted the platform into one with no meaningful authentication at all: anyone who had ever read this repo, in any clone or fork, could forge a signed session cookie for any account, including an admin's. The log line saying so scrolled past among four hundred others.

That is now impossible. There is no fallback; absence is fatal in every environment including development; the empty string is refused as well as the unset variable; the burned value is refused by digest so the platform cannot quietly go back; and the boot path finally *acts* on an audit it had been performing and discarding all along. Seventeen assertions hold it there — including a source scan across 723 files that will catch the *next* fallback, and an end-to-end boot of the real server that proves the guard is wired in rather than merely correct.

**One thing is not true yet, and it is the one that matters most: the production secret has not been rotated.** Until it is, the code will not fall back to the burned key — but if production was ever *set* to it, it is still signing real cookies with it. **R1 (🔴 RED) is closed in the repository and open in the environment.**

---

## NEXT STEPS

**Nothing is committed. Nothing is pushed. Nothing is deployed.** All work is in the working tree.

**Requires a decision or an action from a named human:**

1. **Rotate `SESSION_SECRET` in production and staging** — `openssl rand -base64 32`, applied to every instance. **This is the open Definition-of-Done item and it blocks Phase 0 Exit Criterion 1.**
2. **Before any deploy: confirm production's current `SESSION_SECRET` is not the burned literal** (digest `73d30df8…6ae140`). If it is, **deploying this change is an outage** — the server will refuse to start. Check first.
3. **Approve the commit.** The plan's `M1` milestone pairs `S1` with `S2` ("Authentication cannot fail open"). `S2` is **not** implemented, so this is either committed alone or held for `S2`. That is the user's call, and the plan requires the deploy cadence decision to be *recorded* either way — *"an undecided deploy cadence is how the safe path and the fast path quietly become the same path."*
4. **Note the release cost when it ships:** rotation logs every user out, exactly once.

**Per `TRUST1` Phase 0's recommended order, the next task is `TRUST1-S8` + `TRUST1-P8`** — the reset token that leaks into the user response, and the response body that is written verbatim to the plaintext log. They are one defect with two halves and the plan requires them to land together. **This task did not begin them.**
