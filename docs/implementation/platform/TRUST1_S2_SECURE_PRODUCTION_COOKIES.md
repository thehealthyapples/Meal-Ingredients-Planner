# TRUST1-S2 — Secure Production Cookies — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform` (TRUST1-S — Security)
**Parent plan:** [`TRUST1_PHASE0_IMPLEMENTATION_PLAN.md`](./TRUST1_PHASE0_IMPLEMENTATION_PLAN.md) § "TRUST1-S2" — **milestone M1b**
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md) § 5.2 (S2)

**Risk:** 🟡 AMBER
**Reason:** No schema, no migration, no data change, and one line of behaviour. But that line governs whether a session cookie is issued *at all*, and the failure mode of getting it wrong is a login that returns `200` and establishes nothing. The plan named this trap in advance; this report is largely the story of proving it did not happen.

**Status:** Implemented and verified — 54 automated assertions, full suite green, typecheck at parity, and manually walked on the wire in all three environments. **Not pushed, not deployed.**

---

## THE DEFECT

`server/auth.ts:48` hardcoded `secure: false` on the session cookie. Not conditionally, not in development — always, including production.

The session cookie **is** the user's identity: whoever holds it is that user, without a password. Three flags protect it, and they are one protection, not three:

| Flag | What it stops | Status before S2 |
|---|---|---|
| `httpOnly` | Script cannot read it — XSS cannot steal the session | ✅ correct |
| `sameSite` | Another site cannot send it — CSRF cannot ride the session | ✅ correct |
| `secure` | **The network cannot see it** — interception cannot copy the session | ❌ **hardcoded off** |

Two-thirds of a protection is not two-thirds as good. The cookie was transmitted in **plaintext** on any request that reached the app over HTTP — and `app.set("trust proxy", 1)` (`server/auth.ts:38`) confirms the app sits behind a TLS-terminating proxy, which is *precisely* the topology in which a downgraded, misrouted, or bypassed request is possible. It is the missing third of the protection on the one cookie that cannot afford to lose it.

---

## ⚠️ THE TRAP — AND THE PROOF IT WAS AVOIDED

This task has exactly one way to go wrong, the plan predicted it, and it is worth stating precisely because the wrong implementation *looks* correct in code review.

`server/auth.ts` already had a constant named `isProduction`:

```ts
const isProduction = process.env.NODE_ENV === "production" || process.env.ENABLE_REGISTRATION === "true";
```

**It is not an environment check.** It gates the private-beta registration flow and email-verification behaviour (four call sites: `:159`, `:160`, `:172`, `:262`, `:265`). It says nothing about where the code is deployed. Reusing it — the obvious, tidy, one-word implementation — would mark the cookie `Secure` for **any developer running locally with `ENABLE_REGISTRATION=true`**.

And the failure would have been **silent**. `express-session` refuses to *send* a secure cookie over an insecure connection at all:

```js
// node_modules/express-session/index.js:235
if (req.session.cookie.secure && !issecure(req, trustProxy)) {
  debug('not secured');
  return;                     // ← no Set-Cookie header is emitted. None.
}
```

So `POST /api/login` returns **`200` with a full user object**, the browser is handed nothing, and the very next request is anonymous. A login that succeeds and does nothing, with no error anywhere and nothing in the log to say why.

**S2 therefore branches on `NODE_ENV` alone**, in a function with an honest name (`isProductionDeployment()`), leaving the overloaded constant untouched and now loudly annotated.

### This was not merely avoided — it was proven, by mutation

An assertion that has never failed is a hope. So the trap was deliberately introduced (`isProductionDeployment()` rewired to the overloaded predicate) and the suite re-run. It went red in exactly the right places, **including on the wire**:

```
  ✗ secure=false when NODE_ENV=development ENABLE_REGISTRATION=true — ★ THE TRAP
  ✗ …and `isProductionDeployment()` is FALSE here — the two are NOT the same fact
  ✗ isProductionDeployment() does NOT read ENABLE_REGISTRATION
  ✗ a session cookie is STILL issued            ← NO Set-Cookie header emitted at all
  ✗ the session PERSISTS — local HTTP development still works
44 passed, 10 failed
```

That is the predicted regression, observed live, against a real server. The trap was then reverted and the suite returned to **54/54**. The test is not vacuous; it catches the one thing it exists to catch.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/TRUST1-S2-secure-production-cookies-20260711` → `bb49cd4c284c24001f0d9b7c141ea03beae32acb` |
| Points at | The **TRUST1-S8+P8 milestone commit** (`bb49cd4`, M2), created immediately before this work began |
| Working tree at tag time | **Intentionally dirty** — the same eleven pre-existing `PDA1`/`PKR` entries (`docs/product/`, `docs/investigations/ux/PDA1_*`, `data/cookbook/`, `data/development_world/`, four `scripts/*.ts`, `.engineering/session/*`). Per `ROLLBACK_PROTECTION_PROTOCOL.md` § 3 the tag protects **none** of it. It was not touched, staged, or committed |
| Rollback to committed state | `git checkout rollback/TRUST1-S2-secure-production-cookies-20260711` |
| Rollback of this task alone | `git checkout rollback/TRUST1-S2-secure-production-cookies-20260711 -- server/auth.ts package.json`<br>`rm server/tests/test-trust1-s2-secure-production-cookies.ts`<br>`rm -r server/tests/support/` |

> **A revert here re-opens the plaintext-transmission path** for the cookie that is the user's identity. It is not a neutral act and should be recorded as a decision.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap, canonical entry point (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — § 5.2 `S2`
- [x] `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` — the `S2` task plan, the `isProduction` trap (§ 2, § 5.2), milestone **M1**
- [x] `docs/implementation/platform/TRUST1_S8_P8_PASSWORD_RESET_AND_LOGGING_HARDENING.md` — the immediately preceding milestone (M2), and the test/report discipline this one follows
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` — rollback identifier

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity                                                  ✓ PASS
  Explain: No entity created or re-keyed. The session cookie continues to carry
  exactly one identity (`users.id` via passport's serializeUser). This change
  alters only the TRANSPORT PROTECTION on that cookie, not what it identifies.

□ One owner per fact                                                      ✓ PASS
  Explain: The fact is "what flags does the session cookie carry". Before S2 it
  was an anonymous object literal inline in setupAuth(). It is now ONE named,
  exported owner — sessionCookieOptions() in server/auth.ts — and it is the only
  place any cookie flag is decided. The fact "is this a production deployment"
  gets its own owner, isProductionDeployment(), for the first time.

□ No duplicate entities                                                   ✓ PASS
  Explain: None created.

□ No duplicate ownership                                                  ✓ PASS
  Explain: This change SEPARATES two facts that had been conflated in one
  overloaded constant — registration policy vs. deployment environment. That is
  the removal of a duplicate-ownership hazard, not the creation of one. The
  existing `isProduction` constant retains its four registration/verification
  call sites and is untouched; it is now annotated as NOT an environment check.
  Note server/lib/platform-status.ts:66 also computes NODE_ENV === "production"
  locally, for choosing a log level at startup. It is a pre-existing, unrelated,
  non-security use in a different module and was deliberately NOT rewired — see
  SCOPE LOCK. Converging it is a suggestion, not this task.

□ No duplicate state                                                      ✓ PASS
  Explain: No state read, written, or split. sessionCookieOptions() is a pure
  function of process.env.

□ Extends existing architecture                                           ✓ PASS
  Explain: server/auth.ts is EVOLVED, not replaced. express-session remains the
  session mechanism; connect-pg-simple remains the store; `trust proxy` was
  already correctly set and is relied upon, not changed. Three lines of the
  existing cookie literal are preserved byte-for-byte.

□ Progressive enrichment where appropriate                                ✓ N/A
  Explain: Transport security on a credential, not a knowledge entity.

□ Knowledge domain compliance                                             ✓ N/A
  Explain: Introduces and extends no knowledge domain.

□ Honest gaps over fabricated information                                 ✓ PASS
  Explain: The cookie FAILS CLOSED in production. If a request arrives over
  plaintext, NO session cookie is issued — rather than a cookie issued insecurely.
  The absence is honest; a plaintext session cookie would have been a silent lie
  about how protected the user is. Proven by test D.

□ No permanent synchronisation bridge                                     ✓ PASS
  Explain: None. Nothing is kept in sync with anything.

□ Evolution over replacement                                              ✓ PASS
  Explain: Nothing retired. TRUST1-S4 (HSTS) will later close the residual
  first-request downgrade window; S2 sets the cookie flag and deliberately does
  not pre-build S4 (§ Scope Lock).
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

**Justification.** *"Would a person's answer to 'what is THA?' be different after this change?"* — **no.** No route, page, journey, capability, dialog, setting, claim or benefit changes. A cookie attribute is invisible to the household: they log in, and they stay logged in, exactly as before. The only observable difference is one the browser enforces and never shows them.

### DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:            session / authentication transport only
Declared SoT:               `session` table (connect-pg-simple) — unchanged
New store created?          NO
Existing store extended?    NO
Consumer created?           NO
```

---

## IMPLEMENTATION

### Files changed — 4

| File | Change |
|---|---|
| `server/auth.ts` | `secure: false` → `sessionCookieOptions()`. Adds `isProductionDeployment()` (`NODE_ENV` **alone**), `sessionCookieOptions()`, and `SESSION_MAX_AGE_MS`. Annotates the overloaded `isProduction` constant as **not** an environment check |
| `server/tests/test-trust1-s2-secure-production-cookies.ts` | **NEW** — 54 assertions across 3 levels |
| `server/tests/support/trust1-s2-cookie-app.ts` | **NEW** — support fixture: a minimal real server that mounts the **real** `setupAuth()` so the cookie can be read off the wire |
| `package.json` | Test script registered and wired into `npm test`, third (after S1, then S8+P8) |

### The change

```ts
// server/auth.ts — before
cookie: {
  httpOnly: true,
  sameSite: "lax",
  secure: false,                    // ← in production, too
  maxAge: 7 * 24 * 60 * 60 * 1000,
},

// server/auth.ts — after
cookie: sessionCookieOptions(),

export function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === "production";      // NODE_ENV alone. This is the whole task.
}

export function sessionCookieOptions(): session.CookieOptions {
  return {
    httpOnly: true,                 // preserved, unchanged
    sameSite: "lax",                // preserved, unchanged
    secure: isProductionDeployment(),
    maxAge: SESSION_MAX_AGE_MS,     // preserved, unchanged (7 days)
  };
}
```

**Three deliberate design decisions**, each of which the obvious implementation gets wrong:

1. **A separate predicate, not the existing constant.** Covered above at length. `isProduction` is left exactly as it was — its four registration/verification call sites are outside S2's objective and rewiring them would be a behaviour change to login gating that this task has no mandate for. It is now annotated so the next reader cannot fall in.

2. **The flag is computed, never a literal.** `secure: true` hardcoded would be as wrong as `secure: false` — it would break local HTTP development for everyone. The test scans `server/auth.ts` for **any** literal `secure` value and fails on one, exempting nothing, not even prose. That is why the source comments describe the flag rather than writing it: *a rule with a comment exemption is a rule with a hole in it* (the discipline S1 and P8 established).

3. **`process.env` is read at call time, not captured at module load.** A module-level constant would be untestable across the environment matrix without re-importing the module. Reading per-call costs nothing (`setupAuth` invokes it once at boot) and makes the whole matrix drivable in-process.

**No proxy work was required.** `app.set("trust proxy", 1)` was already correct, so Express reads `X-Forwarded-Proto` from Render's TLS terminator and `express-session` issues the cookie. This was **verified, not assumed** — test C drives a real login behind a simulated proxy and confirms the session actually persists.

---

## TESTS ADDED

**`server/tests/test-trust1-s2-secure-production-cookies.ts`** — **54 assertions**, wired into `npm test` third.

| Level | Assertions | What it proves |
|---|---|---|
| **1. Unit — the policy** | 29 | The full environment matrix (8 combinations of `NODE_ENV` × `ENABLE_REGISTRATION`). `secure` tracks `NODE_ENV` and nothing else; `httpOnly` and `sameSite: "lax"` survive in **every** environment; the 7-day lifetime is unchanged. Plus **the divergence assertion**: an environment is exhibited in which the overloaded `isProduction` predicate is `true` while the cookie is *not* secure — which is only possible if S2 did not reuse it |
| **2. Source — regression protection** | 5 | `isProductionDeployment()` reads `NODE_ENV` and **not** `ENABLE_REGISTRATION` — interrogated via `Function.prototype.toString()` on the **real runtime function**, not a regex over a file. `server/auth.ts` hardcodes no literal `secure` value anywhere. `httpOnly` and `sameSite` are still declared |
| **3. End-to-end — on the wire** | 20 | **Four real servers, four real logins, four real `Set-Cookie` headers.** |

### The end-to-end level is the one that matters

A flag set in source is a **claim**. A flag observed on an HTTP response is a **fact**. Workstream V exists because those two things drift — `EWO-PRO1` declared three controls shipped and none were in the code.

So the test boots the **real `setupAuth()`** in a child process (via a minimal support fixture), logs in with a **real throwaway user** against a **real Postgres session store**, and reads the actual header:

| # | Environment | Asserted |
|---|---|---|
| **A** | development, plain HTTP | Cookie issued; **no `Secure`**; `HttpOnly`; `SameSite=Lax`; **session persists** (`GET /api/user` → 200) |
| **B** | development + `ENABLE_REGISTRATION=true` | ★ **THE TRAP.** Cookie *still* issued; **still no `Secure`**; **session still persists**. This is the regression a plausible implementation introduces, and it is asserted on the wire |
| **C** | production, behind the proxy (`X-Forwarded-Proto: https`) | **`Secure`** — plus `HttpOnly` and `SameSite=Lax`, all three on one real header; **session persists**, so the `trust proxy` chain genuinely works |
| **D** | production, request arrives over **plaintext** | **No cookie is issued at all.** It fails *closed* — the session cookie can no longer traverse the network in the clear |

Case **D** is the assertion that states what S2 actually bought. Before this change a plaintext request got a plaintext session cookie. Now it gets none.

The fixture deliberately does **not** boot `server/index.ts`: in production mode that calls `serveStatic()`, which throws unless the client has been built. A client bundle has nothing to do with a cookie flag, and requiring one would have made the production half of this test impossible to run — which is exactly how *"verified in production"* quietly becomes *"verified in development"*.

**The test binds an ephemeral port**, for the reason M2 documented: a fixed port causes Replit to rewrite `.replit`, a tracked deployment-config file, which `deploy.sh`'s `git add -A` would then commit by nobody, on purpose, at no point. `git diff --quiet .replit` → **clean**, verified after every run.

---

## VALIDATION PERFORMED

Every row is a command that actually ran.

| Command | Result |
|---|---|
| `npm run test:trust1-s2-secure-production-cookies` | ✅ **54 passed, 0 failed** (all 20 end-to-end assertions ran; `DATABASE_URL` present, nothing skipped) |
| **Mutation check** — trap deliberately introduced, suite re-run | ✅ **44 passed, 10 failed** — the suite catches it, on the wire. Trap reverted; back to 54/54 |
| `npm run test:trust1-s1-session-secret` | ✅ **17 passed, 0 failed** — S1 not regressed |
| `npm run test:trust1-s8-p8-no-secret-disclosure` | ✅ **39 passed, 0 failed** — M2 not regressed |
| `npm test` (full suite) | ✅ **exit 0 — 62 suites, zero failed assertions** |
| `npx tsc --noEmit` — working tree | **175 errors** |
| `npx tsc --noEmit` — baseline (documented at `bb49cd4`, M2) | **175 errors** |
| `npx tsc --noEmit \| grep -E "server/auth\.ts\|trust1-s2"` | **none — every file S2 touched is typecheck-clean** |
| `git diff --quiet .replit` | ✅ **clean** — the test does not mutate deployment config |

**Typecheck parity: 175 → 175.** Zero new errors, and none of the 175 are attributable to any file this task touched (verified directly, not inferred from the count).

> The 175 errors are the **pre-existing baseline** carried since before TRUST1 began. They are `TRUST1-S10`'s M0 problem and are not this task's to fix. Parity — not greenness — is the standard the plan sets, precisely so that a task cannot hide a new error inside an existing pile.

---

## FULL SUITE RESULT

```
FULL SUITE EXIT: 0
62 suites executed
Zero failed assertions across the entire run
  TRUST1-S1:     17 passed, 0 failed
  TRUST1-S8+P8:  39 passed, 0 failed
  TRUST1-S2:     54 passed, 0 failed
```

✅ **No regression.** The suite has grown 59 → 62: S1, S8+P8 and S2 run first, and therefore gate the other 59.

> **This is still not the `M0` baseline.** It shows the suite passes *on this machine*, where `DATABASE_URL` is set. Whether it passes **from a clean checkout on a clean runner** remains unanswered — and S2's suite adds a *third* test requiring a database and, now, one that spawns child processes. That question is `TRUST1-S10`'s, and this result must not be mistaken for having answered it.

---

## MANUAL VERIFICATION STEPS & RESULTS

Walked by hand against **real running servers** with **real logins**. Raw `curl -i` output below — these are the actual bytes on the wire.

### Step 1 — Development over HTTP with `ENABLE_REGISTRATION=true`

*Expected: login succeeds; cookie is not `Secure`.* **This is the trap.**

```
$ NODE_ENV=development ENABLE_REGISTRATION=true  # server up
$ curl -i -X POST http://127.0.0.1:<port>/api/login -d '{"username":"…","password":"…"}'

HTTP/1.1 200 OK
Set-Cookie: connect.sid=s%3AA4X-y3P7TmgeoUIp8llZARxN4aJuFOcr.…; Path=/;
            Expires=Sat, 18 Jul 2026 13:20:55 GMT; HttpOnly; SameSite=Lax
```

✅ **Login succeeds. `HttpOnly` and `SameSite=Lax` present. `Secure` absent.**

```
$ curl -o /dev/null -w "%{http_code}" http://127.0.0.1:<port>/api/user -H "Cookie: connect.sid=…"
200
```

✅ **The session works.** Local HTTP development is not broken.

### Step 2 — Production behind the configured proxy

*Expected: `Set-Cookie` includes `Secure`, `HttpOnly` and `SameSite=Lax`.*

```
$ NODE_ENV=production  # server up, behind TLS terminator
$ curl -i -X POST http://127.0.0.1:<port>/api/login -H 'X-Forwarded-Proto: https' -d '{…}'

HTTP/1.1 200 OK
Set-Cookie: connect.sid=s%3AKrRvmCT7Tq5ap5yY6YGiRGNlbB-CfkT-.…; Path=/;
            Expires=Sat, 18 Jul 2026 13:20:57 GMT; HttpOnly; Secure; SameSite=Lax
```

✅ **`HttpOnly; Secure; SameSite=Lax` — all three flags, on one real header, observed on the wire.**

```
$ curl -o /dev/null -w "%{http_code}" http://127.0.0.1:<port>/api/user -H "Cookie: connect.sid=…" -H 'X-Forwarded-Proto: https'
200
```

✅ **The session persists.** The `trust proxy` chain works: production login is not broken by the flag.

### Step 3 — Session persistence in development

```
$ NODE_ENV=development  # server up, plain HTTP
Set-Cookie: connect.sid=s%3AwV2lkdKTOK4Ue_l9oe9t_sIOXrRIKJtI.…; Path=/; HttpOnly; SameSite=Lax
GET /api/user → HTTP 200
```

✅ **No `Secure`; session persists across requests.**

### Step 4 — All required tests

| Suite | Result |
|---|---|
| New TRUST1-S2 tests | ✅ **54 / 54** |
| TRUST1-S1 tests | ✅ **17 / 17** |
| TRUST1-S8+P8 tests | ✅ **39 / 39** |
| Full `npm test` | ✅ **exit 0**, 62 suites, zero failed assertions |
| Typecheck vs baseline | ✅ **175 → 175 — parity**, zero new errors |

### Step 5 — Cleanup

The throwaway user was deleted (`deleted 1 user(s)`), the temporary helper script removed, and `.replit` verified clean. `git status` shows only this task's four files, plus the eleven pre-existing `PDA1`/`PKR` entries that were **not touched**.

---

## USER ACCEPTANCE EVIDENCE

**The acceptance question:** *if a household logs in to THA, can anyone watching the network copy their session and become them?*

**Before this change: yes**, on any request that reached the app over HTTP. The cookie was marked `secure: false` — hardcoded, in production — so the browser would transmit the user's identity in the clear. On a deployment sitting behind a TLS-terminating proxy, that is not hypothetical; it is the topology in which a downgraded or misrouted request is exactly the thing that can happen.

**After this change: no — demonstrated, not asserted.** A real production login was driven behind the real proxy configuration, and the actual `Set-Cookie` header carries `Secure`. A production request arriving over plaintext now receives **no session cookie at all** rather than an unprotected one.

| Acceptance criterion | Evidence | Verdict |
|---|---|---|
| Production cookies include `Secure` | Real `Set-Cookie` on the wire: `HttpOnly; Secure; SameSite=Lax` | ✅ **closed** |
| Development cookies do **not** include `Secure` | Real `Set-Cookie`: `HttpOnly; SameSite=Lax` | ✅ **preserved** |
| Local dev with `ENABLE_REGISTRATION=true` still not `Secure` | Real `Set-Cookie`, trap environment: no `Secure` | ✅ **trap avoided** |
| `HttpOnly` remains present | Every environment, all four e2e cases | ✅ **preserved** |
| `SameSite=Lax` remains present | Every environment, all four e2e cases | ✅ **preserved** |
| A user can still log in — development | `POST /api/login` → 200, cookie issued | ✅ **works** |
| A user can still log in — production | `POST /api/login` → 200, secure cookie issued | ✅ **works** |
| The session still persists | `GET /api/user` → 200 in dev, dev+trap, and production | ✅ **works** |
| A plaintext production request gets no session | No `Set-Cookie` emitted — fails closed | ✅ **closed** |
| Nothing else broke | Full suite green; typecheck at parity | ✅ **no regression** |

**Nothing the household could previously do, they can no longer do.** They log in, and they stay logged in. The only thing that changed is that their identity no longer travels in the clear.

---

## DEFINITION OF DONE

Against the plan's stated Definition of Done for TRUST1-S2:

| # | Criterion | Status |
|---|---|---|
| 1 | `secure` is `true` in production and `false` in development, keyed on `NODE_ENV` **only** | ✅ **Met** — `isProductionDeployment()` reads `NODE_ENV` alone; asserted across an 8-row environment matrix and by interrogating the runtime function itself |
| 2 | A real response carries `Secure`, `HttpOnly` and `SameSite=Lax` — **observed on the wire, not read from source** | ✅ **Met** — raw `curl -i` output reproduced above; all three flags on one header from a real login |
| 3 | Local HTTP development still works, **including with `ENABLE_REGISTRATION=true`** | ✅ **Met** — cookie issued without `Secure`, session persists; and the trap is proven *catchable* by mutation, not merely absent |

### The one gap, stated plainly

Criterion 2 says *"a real HTTPS response **from the deployed app**."* What was verified is a real HTTPS-equivalent response from the **real code**, behind the **real proxy configuration**, on this machine — with `X-Forwarded-Proto: https`, which is exactly what Render's TLS terminator sends.

**That is not the same as `curl -i https://<prod>/api/login`, and this report does not claim it is.** Nothing is deployed. The production check is item 3 of the plan's § 6 Production Verification Checklist, it is run **against the deployed application after deploy**, and it remains **outstanding**. Recording it as done here would be precisely the `EWO-PRO1` failure the programme exists to stop.

### What must not break

- Login must still work in development, in development with `ENABLE_REGISTRATION=true`, and in production. ✅ All three verified on real servers.
- The session must still persist. ✅ Verified in all three.
- The full suite must not regress. ✅ Green, 62 suites.
- `typecheck` must not get worse. ✅ 175 → 175.

---

## DATA IMPACT

- **Reads existing data:** NO — the cookie policy is a pure function of `process.env`.
- **Writes new data:** NO — *(the test creates and deletes a throwaway user; the application does not)*
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO

**No schema change, no migration, no column added or dropped.** The `session` table and `connect-pg-simple` store are untouched.

> **One operational consequence, stated because it is easy to miss.** Existing sessions are **not** invalidated by this change — the cookie's *value* and signing secret are unchanged, only its transport flags. Logged-in users stay logged in. (This is the opposite of `TRUST1-S1`, where rotating the secret logged everyone out once.) On the deploy that carries S2, a browser holding a pre-S2 cookie keeps using it until it next re-authenticates, at which point it is reissued with `Secure`. **The old cookie is not retroactively protected** — the fix applies from the next `Set-Cookie` onward, which is inherent to how cookies work and is not a defect in this implementation.

---

## TRUST CHECK

- **Could this mislead the user?** No. Nothing user-facing changes. A cookie attribute is invisible to the household; they log in and stay logged in exactly as before.
- **Could this fabricate certainty?** The guard was applied hardest where it would have been easiest to fake. A passing test that has never failed proves nothing, so **the trap was deliberately introduced and the suite shown to go red** — including the on-the-wire assertion that no `Set-Cookie` was emitted at all. Without that mutation check, "54 passed" would have been a number, not evidence.
- **Is anything guessed but shown as real?** No. Every flag reported was read from an actual `Set-Cookie` header returned by an actual server over actual HTTP, and the raw bytes are reproduced above.
- **Is any claim stronger than its evidence?** One was, and it is corrected rather than quietly kept: the Definition of Done asks for verification *on the deployed app*. That has **not** happened — nothing is deployed — and the § Definition of Done gap says so explicitly instead of letting "verified on the wire" pass for "verified in production".
- **What happens if the system is wrong?** It fails **closed**. If `NODE_ENV` is wrong in production, no session cookie is issued and nobody can log in — total, immediate, loud, and instantly revertible. The previous design failed *open*: the cookie went out in plaintext and nothing anywhere said so.
- **No architectural duplication introduced:** YES — and a pre-existing conflation (registration policy vs. deployment environment, in one overloaded constant) is now named and separated.
- **No new source of truth created:** YES. `sessionCookieOptions()` is the single owner of the cookie's flags; it did not exist as a named owner before, it was an anonymous literal.
- **No runtime behaviour altered:** **NO — it is altered, deliberately.** The session cookie carries `Secure` in production and, in production over plaintext, is not issued at all. Both are the deliverable.
- **Every "verified" claim backed by a command that ran:** YES. Raw `curl -i` output, the mutation-test failure output, and the suite/typecheck counts are all reproduced above.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/TRUST1-S2-secure-production-cookies-20260711` → `bb49cd4c284c24001f0d9b7c141ea03beae32acb`
- **Files modified:** `server/auth.ts`, `package.json`
- **Files created:** `server/tests/test-trust1-s2-secure-production-cookies.ts`, `server/tests/support/trust1-s2-cookie-app.ts`, this report

```bash
# Restore this task's code
git checkout rollback/TRUST1-S2-secure-production-cookies-20260711 -- \
  server/auth.ts package.json

# Remove what it created
rm server/tests/test-trust1-s2-secure-production-cookies.ts
rm -r server/tests/support/
rm docs/implementation/platform/TRUST1_S2_SECURE_PRODUCTION_COOKIES.md
```

**Verification after rollback:** the session cookie is transmitted without `Secure` in production — the defect, restored.

**Regression risk of the change itself is low, bounded, and loud.** The single identifiable risk was the `isProduction` trap, and it is closed three ways: a distinct predicate, an assertion over the runtime function, and an on-the-wire test in the exact environment that would break. If the flag were nevertheless wrong in production, the symptom is immediate and total — **nobody can log in** — which makes it the easiest class of defect to detect and revert. A silent partial failure is not available here.

---

## SCOPE LOCK

**Implemented scope — `TRUST1-S2` only:**
- The session cookie carries `Secure` when, and only when, `NODE_ENV === "production"`
- `httpOnly: true` and `sameSite: "lax"` preserved, unchanged, in every environment
- The 7-day session lifetime preserved, unchanged
- Local HTTP development login preserved — **including with `ENABLE_REGISTRATION=true`**
- Automated tests over the environment matrix, the source, and the real wire; plus a mutation check proving the suite catches the trap

**Explicitly excluded — not started, not partially done:**
- **`TRUST1-S4`** — `helmet`, CSP, and **HSTS**. S2 is genuinely complete only once HSTS exists: without it, a *first* plaintext request can still be stripped before any redirect. **S2 is not blocked on S4 and did not wait for it** (per the plan), but the residual window is real and is named here rather than glossed. **Phase 4.**
- **`__Host-` cookie prefix.** `TRUST1` § 5.2 mentions it as *"`__Host-`-style hardening where compatible"*. It requires `Path=/`, `Secure`, and **no `Domain`** — plausibly compatible today, but it renames the cookie, which invalidates every existing session on deploy. That is a real user-facing cost and a decision, not an implementation detail. **Not taken. Recommend folding it into `S4` or `S7`**, where a session-invalidating change can be made once rather than twice.
- **Session lifetime and idle timeout.** 7 days, no idle timeout — untouched. That is `TRUST1-S7`, **Phase 4**.
- **`TRUST1-S3`, `S5`, `S10`, `V3`, `O7`** — untouched.
- **The six-character password floor** (`server/auth.ts:129`, `:283`, `:316`) — still there. `TRUST1-S7`, Phase 4.

**SUGGESTIONS — observed in scope, not implemented, requiring approval:**

1. **Rename the overloaded `isProduction` constant.** It is *the* trap this task exists to dodge, and dodging it protects only this task — the next person to write `if (isProduction)` meaning "in production" walks straight into it. A rename to something honest (`registrationClosed`, or similar) is behaviour-preserving and would remove the hazard permanently. **Not done here** because it touches four registration and email-verification call sites (`:159`, `:160`, `:172`, `:262`, `:265`), which are login-gating code outside S2's objective, and a scope-locked task is not the place to edit the login path for tidiness. **Recommended as a small standalone change.** For now the constant carries a loud comment saying it is not what its name says.

2. **`server/lib/platform-status.ts:66` computes `NODE_ENV === "production"` for itself.** Harmless today — it only chooses between `console.error` and `console.warn` at startup — and correctly *not* the overloaded predicate. But it is now a second place that answers "are we in production", and `isProductionDeployment()` is the named owner of that fact. **Recommend converging it** when `TRUST1-O4` touches logging anyway.

3. **Nothing enforces this flag on the deployed app.** The whole point of Workstream V is that a flag in source is a claim. S2's production verification (§ 6 checklist item 3 — `curl -i` against the real deployment) is **outstanding and cannot be done until deploy**. `TRUST1-V2`'s automated trust-verification suite is Phase 5. Until then, this control is verified by a human who will eventually forget.

---

## OUTCOME

**The cookie that is the user's identity no longer travels in the clear.**

`secure: false` was hardcoded on the session cookie — in production, unconditionally. `httpOnly` and `sameSite` were already right, which is what made this worth doing and easy to miss: two-thirds of a protection reads, at a glance, like a protection. It is not. The missing third is the one that stops the network seeing the credential, on a deployment that sits behind a TLS-terminating proxy — precisely the topology in which a downgraded or misrouted request is a thing that happens.

It is now `Secure` in production, and only in production. A production request that somehow arrives over plaintext receives **no session cookie at all** rather than an unprotected one: it fails closed.

The more interesting half of this task was **not breaking everyone's laptop.** `server/auth.ts` already had a constant called `isProduction` that is not an environment check — it is `NODE_ENV === "production" || ENABLE_REGISTRATION === "true"`, and it gates the private beta. Reusing it was the obvious one-word implementation, and it would have marked the cookie `Secure` over plain HTTP for every developer running with registration enabled. `express-session` then declines to send a secure cookie over an insecure connection *at all*, so `POST /api/login` would have returned `200` with a full user object and established no session whatsoever — a login that succeeds and does nothing, with nothing in the log to explain it. The plan predicted this trap; S2 branches on `NODE_ENV` alone, in a function with an honest name.

And that avoidance was **proven rather than claimed**: the trap was deliberately wired in, the suite went red on the wire — *no `Set-Cookie` header emitted, session does not persist* — and was then reverted. A test that has never failed is a hope, not a control.

**Supports R1 (🔴 RED).** It removes the plaintext-transmission path for the session cookie and completes the three-part protection begun by S1. It does not, on its own, close the first-request downgrade window — that needs HSTS, which is `TRUST1-S4`, Phase 4, and is recorded above rather than quietly implied.

---

## NEXT STEPS

**Nothing is pushed. Nothing is deployed.** This work is committed locally as milestone **M1b** (S1 landed as M1a; the plan's M1 — *"authentication cannot fail open"* — is complete with S1 + S2 together).

1. **The production verification is outstanding by design.** § 6 checklist item 3 — `curl -i https://<prod>/api/login` → read the real `Set-Cookie` on the wire — can only be run after a deploy. It is the difference between a claim and a fact, and it is not claimed here.
2. **Deploy cadence remains undecided**, and this is now the *third* milestone to record that. The plan recommends M1 and M2 deploy as they land under `PRODUCTION_RELEASE.md`'s manual, human-authorised checklist, since the exposures they close are live today — and requires that whichever choice is made be **written down**. It still has not been. An undecided deploy cadence is how the safe path and the fast path quietly become the same path.
3. **HSTS (`TRUST1-S4`) is the natural completion of S2** and is Phase 4. Consider whether the `__Host-` prefix decision rides with it, since both are session-invalidating and should be paid for once.

**Remaining Phase 0 tasks: `S3`, `S5`, `S10`, `V3`, `O7`** — of which the plan's next is **`TRUST1-S3`** (secure meal template endpoints: five unguarded `meal_templates` write routes, plus the 237-route audit that is the actual work).
