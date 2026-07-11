# TRUST1 — Phase 0 Implementation Plan

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md) (canonical)
**Risk:** 🟢 GREEN
**Reason:** Documentation only. No application code, schema, migration, dependency, or configuration is changed by this document. Every task it plans is deliberately *not* implemented here.

**Status:** Canonical. This is the single execution plan for TRUST1 Phase 0. It plans nine tasks and no others.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/TRUST1-phase0-implementation-plan-20260711` → `3f3071b7a32e99b87384cb6f6245f54c237f5dd9` |
| Working tree at tag time | **Intentionally dirty** — the same eleven pre-existing, unauthored-by-this-task entries from `PDA1` / `PKR` (`docs/product/`, `docs/investigations/ux/PDA1_*`, `data/cookbook/`, `data/development_world/`, four `scripts/*.ts`, `.engineering/session/*`) that were present when `TRUST1` was written. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3, **the tag does not protect any of it.** It was not touched, staged, or committed by this task. |
| This task's writes | `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` (new file, this document) |
| Rollback of this task alone | `git rm docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` |
| Rollback to committed state | `git checkout rollback/TRUST1-phase0-implementation-plan-20260711` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap, the canonical entry point (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — the parent programme; §5.2, §5.3, §5.4, §6, §9 and §10 govern this plan
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — Architecture Compliance Checklist, mandatory sections, Trust & Claims hard stops
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` — filing by workstream (§1 rule 5, §4)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` — rollback identifier

**Filing note.** Unlike `TRUST1` itself, this document was requested at a path that is already workstream-filed (`docs/implementation/platform/`). There is **no governing-architecture conflict** and none was raised.

---

## EVIDENCE BASE — RE-VERIFIED AT `3f3071b`

Every Phase 0 finding in `TRUST1` was re-verified against the code at this commit before this plan was written. **All nine defects are still present.** Three citations in the parent document have drifted or are imprecise; they are corrected here, and the corrections are the line numbers this plan uses.

| `TRUST1` cites | Verified at `3f3071b` | Status |
|---|---|---|
| `server/auth.ts:41` — hardcoded session-secret fallback (literal `[REDACTED — TRUST1-S1; sha256:73d30df8…6ae140]`) | **Confirmed, `server/auth.ts:41`** | ✅ exact |
| `server/auth.ts:48` — `secure: false` | **Confirmed, `server/auth.ts:48`** | ✅ exact |
| `server/lib/sanitizeUser.ts` — denylist omits `passwordResetToken` / `passwordResetExpires` | **Confirmed, `server/lib/sanitizeUser.ts:3-9`** — the denylist has three entries, and the exported `SafeUser` type omits the same three | ✅ exact |
| `server/index.ts:55-62` — response-body logger | **Present, but at `server/index.ts:43-67`** — `res.json` is monkey-patched at `:48-52`, the body is appended to the log line at `:59` | ⚠️ **line drift — corrected** |
| `server/routes.ts:5085, 5097, 5115, 5135, 5147, 5157, 5175` — unguarded meal-template routes | **Five unguarded `meal_templates` writes confirmed: `:5085` (POST), `:5097` (PATCH), `:5115` (DELETE), `:5135` (POST products), `:5147` (DELETE `meal-template-products`).** `:5157` is `POST /api/meal-templates/:id/resolve` — a POST that *reads* and resolves, and already optionally reads the session. **`:5175` is `POST /api/meals/:id/link-template` — a different resource (`meals`, not `meal_templates`) and outside S3's stated objective.** | ⚠️ **scope over-stated — corrected** |
| No rate limiting; `express-rate-limit` absent from `package.json` but present in `script/build.ts` bundling allowlist | **Confirmed** — no `express-rate-limit`, `helmet`, `cors`, `jsonwebtoken`, `pino` or `winston` in `package.json`; `script/build.ts` allowlists `cors`, `express-rate-limit`, `jsonwebtoken` | ✅ exact |
| No `.github/` directory | **Confirmed** — `ls .github` → *No such file or directory* | ✅ exact |
| `npm run release:check` exists and nothing runs it | **Confirmed, `package.json:58`** — `typecheck && test && build`. `deploy.sh:37` runs `npm run build` only | ✅ exact |
| `deploy.sh` runs `git add -A` and does not test | **Confirmed, `deploy.sh:23`** (`git add -A`), `:32` (commit), `:37` (`npm run build`), `:42` (`git push origin main`). It *does* already refuse to run off `main` (`:12-16`) | ✅ exact |
| 237 `/api` routes; 116 test files; zero authorisation tests | **Confirmed** — 237 route registrations in `server/routes.ts`; 116 files in `server/tests/`; `grep -rlE "assertAdmin\|requirePremium\|lib/access\|sanitizeUser" server/tests/` returns **nothing** | ✅ exact |

**Two further facts, discovered while verifying, that materially change how Phase 0 must be implemented.** Neither appears in `TRUST1`, and both are load-bearing:

1. **`server/auth.ts:35` defines `isProduction` as `NODE_ENV === "production" || ENABLE_REGISTRATION === "true"`.** That constant is overloaded — it gates the private-beta registration flow, not the deployment environment. **`TRUST1-S2` must not reuse it.** A developer running locally with `ENABLE_REGISTRATION=true` would get `secure: true` cookies over plain HTTP and be silently unable to log in. S2 must branch on `NODE_ENV` alone.
2. **`npm test` is 59 sequential scripts (`package.json:12`), and 11 of the 116 test files reference `DATABASE_URL`.** There is no `engines` field and no `.nvmrc`. A CI job that runs `release:check` therefore needs a **Postgres service container and a pinned Node version**, or roughly a tenth of the suite fails on a clean runner. **This is the only Phase 0 task whose scope is genuinely unknown**, and it is planned for accordingly (see `TRUST1-S10`).

---

# 1. Phase 0 Scope

Phase 0 contains **exactly these nine tasks** and no others. It is the "stop the bleeding" phase of `TRUST1` §9: live, evidenced defects, each individually small, each of which either **leaks personal data**, **defeats authentication**, or **lets untested code reach production**.

| Task | Title | Workstream | Priority (per `TRUST1`) | Risk it moves |
|---|---|---|---|---|
| **TRUST1-S1** | Session secret fails closed | Security | Critical | R1 🔴 |
| **TRUST1-S2** | Secure production cookies | Security | Critical | (supports R1) 🔴 |
| **TRUST1-S8** | Remove password reset token exposure | Security | Critical | R8 🔴 |
| **TRUST1-P8** | Remove personal data from application logs | Privacy | Critical | R2 🔴 |
| **TRUST1-S3** | Secure meal template endpoints | Security | Critical | R4 🔴 |
| **TRUST1-S5** | Authentication rate limiting | Security | Critical | R9 🔴 (partial) |
| **TRUST1-S10** | CI pipeline foundation | Security | High | R5 🔴, R14 🟠 |
| **TRUST1-V3** | Pre-deploy verification gate | Verification | Critical | R5 🔴 |
| **TRUST1-O7** | Production deployment pipeline hardening | Operations | Critical | R5 🔴 |

**Everything else in `TRUST1` is out of scope for Phase 0** — including the tasks a reader will most want to pull forward: `O5` (tested restore), `O8` (removing `drizzle-kit push --force`), `O1` (health endpoint), `V1` (declared-vs-actual reconciliation), and the whole of Workstream P beyond `P8`. §6 records what remains exposed as a result, honestly and without softening it.

**S10, V3 and O7 are one piece of work in three tasks:** *nothing reaches production without passing the tests.* They are separable for planning and are not separable for value — none of the three delivers anything on its own.

---

# 2. Task Plans

---

## TRUST1-S1 — Session secret fails closed

### Objective
Remove the hardcoded session-secret fallback so the server **refuses to start** without `SESSION_SECRET`, and treat the committed string as burned.

### Repository components affected
| File | What changes |
|---|---|
| `server/auth.ts:41` | Delete the hardcoded fallback (literal `[REDACTED — TRUST1-S1; sha256:73d30df8…6ae140]`) |
| `server/index.ts:77-80`, `:98-104`, `:122-124` | The boot-time audit currently pushes absent required vars into `missing[]` and **never reads the array**. Make absence fatal: `process.exit(1)` |
| `.env.example` | Add `SESSION_SECRET` (today it holds exactly one key, `THEMEALDB_API_KEY`) |
| `server/tests/` | New test asserting the server refuses to boot without the variable |
| **Production / staging environment** | Rotate `SESSION_SECRET` to a fresh value |

### Dependencies
**None.** This task needs no CI, no ROPA, no legal review, no budget, and no decision from anyone. It is the only Critical task in the programme that is blocked on nothing, which is why it goes first.

### Estimated implementation complexity
**Low.** Delete an operator, act on an array that is already populated, add one test.

### Verification steps
1. `SESSION_SECRET= npm run dev` → process exits non-zero with a named, actionable error. **The current behaviour is that it boots.**
2. `SESSION_SECRET=<value> npm run dev` → boots normally.
3. `grep -rn "r3pl1t_s3cr3t" server/` → no matches.
4. `npm test` → the 59 suites still pass (see §4 for the baseline this is compared against).
5. Rotation confirmed: a session cookie issued before rotation is rejected after it.

### Rollback strategy
`git revert <commit>`, or `git checkout rollback/TRUST1-phase0-implementation-plan-20260711 -- server/auth.ts server/index.ts`. **The environment rotation does not roll back with the code** — and must not. Reverting the code while leaving the secret rotated is safe; reverting the *secret* to the committed string re-opens the bypass and is never correct.

### Definition of Done
- The fallback string does not appear anywhere in the repository.
- The server exits non-zero, with a clear message, when `SESSION_SECRET` is absent — in every environment, including development.
- `SESSION_SECRET` is documented in `.env.example`.
- The production secret has been rotated to a value that has never been committed.
- A test asserts the fail-closed behaviour and runs inside `npm test`.

### Expected production risk reduction
**Closes R1 (🔴 RED) — total authentication bypass.** Today a single unset environment variable silently downgrades THA to a signing key that is published in this repository, permanently, in every clone and fork. After S1, that misconfiguration is a crash instead of a silent, total compromise — which is the correct failure mode, because a crash is noticed.

> **Production impact to state plainly:** rotating the secret **invalidates every existing session**. Every logged-in user is logged out once. That is the cost, it is a one-time cost, and it is trivially smaller than the exposure it closes.

---

## TRUST1-S2 — Secure production cookies

### Objective
Set `cookie.secure: true` in production — environment-conditional, so local HTTP development continues to work.

### Repository components affected
| File | What changes |
|---|---|
| `server/auth.ts:45-50` | `secure: false` → conditional on the deployment environment. `httpOnly: true` and `sameSite: "lax"` are already correct and are not touched |
| `server/tests/` | New assertion on the session-cookie flags |

### Dependencies
None in code. **Sequencing note:** S2 is genuinely complete only once HSTS exists (`TRUST1-S4`, Phase 4) — without it, a first plaintext request can still be stripped before the redirect. S2 is not blocked on S4, and must not wait for it.

### Estimated implementation complexity
**Low** — but with **one trap that will cause a production incident if missed.**

> ⚠️ **`server/auth.ts:35` already defines a constant named `isProduction`, and it is `NODE_ENV === "production" || ENABLE_REGISTRATION === "true"`.** It gates the private-beta registration flow, *not* the environment. Reusing it here would set `secure: true` for any developer running locally with `ENABLE_REGISTRATION=true`, whose browser would then silently discard the session cookie over HTTP, producing a login that appears to succeed and does nothing. **S2 must branch on `NODE_ENV === "production"` alone**, with a distinct name.

`app.set("trust proxy", 1)` is already set (`server/auth.ts:38`), so Express will read `X-Forwarded-Proto` from Render's TLS terminator correctly. No proxy work is required.

### Verification steps
1. Local dev over HTTP: login still works; `Set-Cookie` has **no** `Secure` attribute.
2. Local dev with `ENABLE_REGISTRATION=true`: login **still works** — this is the regression the trap above would introduce, and it must be tested explicitly.
3. Staging/production over HTTPS: `curl -i` on a login response → `Set-Cookie: ...; HttpOnly; Secure; SameSite=Lax`.
4. `npm test` passes.

### Rollback strategy
`git revert <commit>`. Single-file, single-line change; no data, no schema, no dependency. If the flag is wrong in production the symptom is immediate and total (nobody can log in), which makes it loud, quickly diagnosed, and instantly revertible.

### Definition of Done
- `secure` is `true` in production and `false` in development, keyed on `NODE_ENV` only.
- A real HTTPS response from the deployed app carries `Secure`, `HttpOnly` and `SameSite=Lax` — **observed on the wire, not read from source** (this is the distinction Workstream V exists to enforce).
- Local HTTP development still works, including with `ENABLE_REGISTRATION=true`.

### Expected production risk reduction
Completes the three-part protection on the cookie that *is* the user's identity. `httpOnly` and `sameSite` are already correct; `secure` is the missing third. Supports **R1 (🔴)**: it removes the plaintext-transmission path for a session cookie on a proxied deployment, which is precisely the topology where a downgraded or misrouted request is possible.

---

## TRUST1-S8 — Remove password reset token exposure

### Objective
Stop `GET /api/user` returning a live `passwordResetToken`, and convert `sanitizeUser` from a denylist to an **allowlist** so the next column added to `users` cannot leak by default.

### Repository components affected
| File | What changes |
|---|---|
| `server/lib/sanitizeUser.ts:3-9` | `SENSITIVE_FIELDS` (3 entries: `password`, `emailVerificationToken`, `emailVerificationExpires`) does **not** include `passwordResetToken` / `passwordResetExpires` (`shared/schema.ts:27-28`). The exported `SafeUser` type omits the same three and inherits the same hole |
| Consumers of `SafeUser` | The allowlist rewrite **changes the exported type's shape**, so `npm run typecheck` will surface every consumer that reads a field the allowlist does not carry |
| `server/tests/` | New test asserting the sanitised shape is an allowlist |

### Dependencies
None. **But it is compounded by `TRUST1-P8` and the two should land together** — see below.

### Estimated implementation complexity
**Medium.** The minimal fix (add two strings to the denylist) is *Low* and takes a minute. The Definition of Done is the **allowlist**, which changes the exported `SafeUser` type and will ripple through `typecheck` into every consumer. That ripple is the point: it is the mechanism that forces each caller to declare what it actually needs, and it is why this is not a one-minute change.

> **The denylist has now failed twice** — once for `passwordResetToken`, once for `passwordResetExpires`, both columns on the same row it was written to protect. It will fail a third time on the next column added to `users`. Extending it is not a fix; it is a deferral.

### Verification steps
1. `curl` an authenticated `GET /api/user` → the body contains **no** `passwordResetToken`, `passwordResetExpires`, `password`, `emailVerificationToken`, or `emailVerificationExpires`.
2. A test enumerates the *permitted* fields and fails if the response carries any field not on that list — **including fields that do not exist yet.**
3. `npm run typecheck` passes after every consumer is reconciled.
4. `npm test` passes.

### Rollback strategy
`git revert <commit>`. If the allowlist proves too disruptive to complete in one commit, the **safe intermediate** is to ship the two-field denylist extension first (closing the live exposure immediately) and land the allowlist as a follow-up commit **inside Phase 0**. The exposure closes in the first commit either way. What must *not* happen is the allowlist being deferred out of Phase 0 on the grounds that the leak is already closed — that is how the denylist survived two failures.

### Definition of Done
- `GET /api/user` returns no reset token and no reset expiry.
- `sanitizeUser` is an allowlist; `SafeUser` is derived from it.
- A test asserts the allowlist and would fail on a new, unlisted `users` column.
- Every `SafeUser` consumer typechecks.

### Expected production risk reduction
**Closes R8 (🔴 RED) — account takeover for anyone who can read a log.** The severity here is entirely a function of what sits downstream: the token is returned to the client, and that response body is then written verbatim to stdout by the request logger (`P8`). A live password-reset token in a plaintext log is a password reset available to anyone with log access. **S8 and P8 are one defect with two halves** — either fix alone leaves a real exposure, and they should be committed together.

---

## TRUST1-P8 — Remove personal data from application logs

### Objective
Stop the request logger writing full API **response bodies** to stdout.

### Repository components affected
| File | What changes |
|---|---|
| `server/index.ts:43-67` | The middleware monkey-patches `res.json` (`:48-52`) to capture every response body, then appends it verbatim to the log line (`:59`): `` logLine += ` :: ${JSON.stringify(capturedJsonResponse)}` ``. No redaction, no truncation, no allowlist |
| `server/tests/` | New test asserting no personal-data field name appears in emitted log output |

### Dependencies
None. **P8 owns the *requirement*; `TRUST1-O4` (structured logging, Phase 1) owns the *mechanism*.** Phase 0's job is to stop the bleeding — delete the body capture — not to choose a logging library. Building the logger first means building it twice (`TRUST1` §6.1).

**P8 is a hard prerequisite of `TRUST1-O2` (error tracking).** Integrating error tracking before P8 ships personal data to a third-party processor, at volume, inside error payloads. That ordering is a hard stop, not a preference — and it is why P8 must not slip out of Phase 0.

### Estimated implementation complexity
**Low.** Delete the `res.json` monkey-patch and the body-append. The method/path/status/duration line is retained unchanged. Nothing downstream reads the captured body.

### Verification steps
1. `npm run dev`, exercise `/api/user`, `/api/meals`, `/api/food-diary` → the log line reads `GET /api/user 200 in 14ms` and **nothing after it**. Today it carries the entire serialised response.
2. `grep` a captured log sample for `weight`, `bmi`, `allergy`, `displayName`, `username`, `passwordResetToken` → zero matches.
3. A test drives a response containing known personal-data field names and asserts none reach the log sink.
4. `npm test` passes.

### Rollback strategy
`git revert <commit>`. The change **removes** behaviour; it cannot break a consumer, because nothing consumes the captured body. The only cost of reverting is re-opening the exposure — so a revert here is a decision to leak, and should be recorded as one.

### Definition of Done
- No API response body is written to any log, in any environment.
- The existing method/path/status/duration line is preserved.
- A test asserts no known personal-data field name appears in log output, and runs in `npm test`.

### Expected production risk reduction
**Closes R2 (🔴 RED) — the single highest-severity privacy defect in the codebase, and the cheapest to fix.** Today the plaintext process log contains **every weight, BMI, sleep hour, mood score, dietary restriction, child's name, child's allergy, email address, Companion utterance, and password-reset token** the system has ever returned — because every one of those is returned in an API response, and every API response is stringified into the log. Logs are routinely shipped to third-party aggregators, retained far longer than application data, and read by people with no business reading a child's medical information.

---

## TRUST1-S3 — Secure meal template endpoints

### Objective
Add authorisation to the `meal_templates` write routes, and **audit all 237 `/api` routes** to confirm no other write route is unguarded.

### Repository components affected
| File | What changes |
|---|---|
| `server/routes.ts:5085` | `POST /api/meal-templates` — no auth check |
| `server/routes.ts:5097` | `PATCH /api/meal-templates/:id` — no auth check |
| `server/routes.ts:5115` | `DELETE /api/meal-templates/:id` — no auth check. Its entire body is `await storage.deleteMealTemplate(parseInt(req.params.id)); res.sendStatus(204);` |
| `server/routes.ts:5135` | `POST /api/meal-templates/:id/products` — no auth check |
| `server/routes.ts:5147` | `DELETE /api/meal-template-products/:id` — no auth check |
| `server/lib/access.ts` | **Read, not modified.** It remains the sole authority on identity and role (`PKR25`). S3 *applies* the existing guard; it does not write a new one |
| `server/tests/` | Route-guard test (the seed of `TRUST1-S9`'s full suite) |

**Corrected scope.** `TRUST1` §5.2 also cites `:5157` and `:5175`. Verified: **`:5157` is `POST /api/meal-templates/:id/resolve`** — a POST that resolves and returns a template, already optionally reading the session (`req.isAuthenticated() ? req.user!.id : undefined`), and is a *read* in effect; whether it should require a session is a **decision this task must record**, not an assumed defect. **`:5175` is `POST /api/meals/:id/link-template`** — a different resource (`meals`, not `meal_templates`) and outside this task's stated objective. Over-stating the scope of a finding is the same failure as understating it.

### Dependencies
None for the guard itself. **The 237-route audit is the real work**, and it is what makes this task worth doing once rather than repeatedly.

### Estimated implementation complexity
**Medium.** The guard is one line per route. The audit is a route-by-route judgement over 237 registrations, each of which must end as either *guarded* or *on an explicit, justified public allowlist*. The allowlist is the deliverable's actual value: it converts every public route from an oversight into a decision.

`meal_templates` is a **global table with no `userId` column** (`shared/schema.ts:49-80`) — its rows are shared platform content, not user data — so the correct guard is `assertAdmin`, not an ownership check. That must be confirmed against the product intent before it is applied, because it is a change to who may author platform content.

### Verification steps
1. Anonymous `DELETE /api/meal-templates/1` → **401/403**, and the template still exists. Today it returns **204 and the template is gone.**
2. Anonymous `POST` / `PATCH` / product-add / product-delete → all rejected.
3. Authenticated admin → all still succeed. Existing admin template management is unbroken.
4. The route audit is complete: every one of the 237 routes is guarded or allowlisted with a written justification.
5. A test fails if an unguarded write route is added.
6. `npm test` passes.

### Rollback strategy
`git revert <commit>`. **The identifiable regression risk is over-guarding:** if any legitimate non-admin caller (a client surface, a seed script, a test fixture) writes to `meal_templates`, guarding the route breaks it. This is why the audit precedes the guard, and why step 3 above is a required verification and not a courtesy.

### Definition of Done
- All five unguarded `meal_templates` write routes are guarded.
- A recorded decision on `:5157` (`/resolve`) — guarded, or deliberately public with a stated reason.
- All 237 `/api` routes audited; every public route on a justified allowlist.
- A test fails on the introduction of a new unguarded write route.

### Expected production risk reduction
**Closes R4 (🔴 RED) — unauthenticated destruction or poisoning of platform content.** Any anonymous caller on the internet can currently delete any global meal template, or inject content into one. This is remarkable precisely *because* the rest of the codebase is disciplined here — all 51 admin routes are guarded — which is why it went unnoticed: it is an outlier in a clean pattern, and **nothing tests for it.** The audit is what stops the next `S3`; the guard only stops this one.

---

## TRUST1-S5 — Authentication rate limiting

### Objective
Rate-limit `/api/login`, `/api/register`, `/api/forgot-password`, `/api/reset-password` and `/api/change-password`, by IP and by account.

### Repository components affected
| File | What changes |
|---|---|
| `package.json` | Add `express-rate-limit` (or equivalent) — **no rate limiter of any kind is currently a dependency** |
| `script/build.ts` | **No change needed** — the bundling allowlist *already* lists `express-rate-limit` (alongside `cors` and `jsonwebtoken`, neither of which is installed or used). The allowlist has been advertising a protection that does not exist |
| `server/auth.ts:120` (register), `:207` (login), `:254` (forgot-password), `:277` (reset-password), `:307` (change-password) | Apply limiters |
| `server/tests/` | Tests asserting the limits fire |

### Dependencies
None hard. **Two design decisions must be made and recorded before implementation**, and neither is a detail:

1. **Store.** The deployment is Render **`autoscale`** — multi-instance (`.replit:32-34`). An in-memory limiter counts per instance, so *N* instances means *N×* the intended limit. THA already runs `connect-pg-simple` for sessions, so a Postgres-backed or Redis-backed store is reachable. **A per-instance limiter is not worthless, but it is not the limit you think you configured**, and shipping one without recording that is how a control becomes a belief.
2. **Lockout versus backoff.** Account lockout is itself a denial-of-service vector against any known email address. `TRUST1` §5.2 requires this to be a deliberate decision. Backoff is the safer default.

### Estimated implementation complexity
**Medium.** The middleware is straightforward; the multi-instance store decision and the per-account (not merely per-IP) limiting are where the real work is.

### Verification steps
1. 20 rapid failed logins from one IP → HTTP **429** with a `Retry-After`. Today: unlimited attempts, no throttle, forever.
2. Failed logins distributed across IPs against **one account** → limited by account, not only by IP.
3. A legitimate user who mistypes their password twice and then succeeds is **not** locked out.
4. `/api/forgot-password` cannot be used to mail-bomb an address.
5. **Multi-instance:** the limit is verified against the deployed, autoscaled app — not against a single local process, where a per-instance limiter looks correct and is not.
6. `npm test` passes.

### Rollback strategy
`git revert <commit>` plus `npm uninstall`. **The identifiable regression risk is locking out real users** — a limit set too low, or an IP-only limiter behind a corporate NAT or a mobile carrier CGNAT, will throttle legitimate households. Mitigation: deploy the limiter in **log-only mode first**, observe the real distribution of authentication attempts for a short window, then enforce. This is the one Phase 0 task with a plausible false-positive cost to real users, and it should be treated with that respect.

### Definition of Done
- All five authentication routes are rate-limited, per IP **and** per account.
- The store choice is recorded, with its multi-instance behaviour stated explicitly.
- The lockout-versus-backoff decision is recorded.
- Tests assert the limits fire.
- The limit is verified against the **deployed** app, not only locally.

### Expected production risk reduction
**Substantially reduces R9 (🔴 RED)** — but read this next sentence carefully, because it is the most easily misread claim in Phase 0.

> **S5 does not close R9. The six-character password floor survives Phase 0.** `server/auth.ts:129`, `:283` and `:316` each enforce `length < 6`. Rate limiting throttles the *rate* of guessing; it does not make a six-character password guessable-in-fewer-attempts. The floor is `TRUST1-S7` (**Phase 4**), and after Phase 0 it becomes the binding constraint on credential security. §7 recommends pulling it forward.

What S5 *does* close is the open, unthrottled, unlimited-attempt oracle: today an attacker needs a wordlist and patience, and nothing else. After S5 they need considerably more of both.

---

## TRUST1-S10 — CI pipeline foundation

### Objective
Create CI. Run `typecheck`, `test` and `build` on every push and pull request; add dependency scanning with a severity threshold that fails the build.

### Repository components affected
| File | What changes |
|---|---|
| `.github/workflows/` | **Does not exist.** `ls .github` → *No such file or directory*. There is no CI, no Actions, no Dependabot, no scheduled `npm audit` — nothing on any path to production runs any check at all |
| `package.json:58` | `release:check` (`typecheck && test && build`) already exists and is correct. CI **invokes** it; it does not replace it |
| `package.json` | Add `engines` and/or `.nvmrc` — **Node is currently unpinned** |
| `.github/dependabot.yml` (or SCA equivalent) | Dependency scanning |

### Dependencies
None — **and everything depends on it.** `TRUST1` §6.2 names S10 as *"the single most structurally important task in the programme"*, and its subject matter (dependency scanning) is not why. **Until CI exists, no mechanism exists that can enforce anything.** Every test Phase 0 writes — the fail-closed test (S1), the allowlist test (S8), the log-redaction test (P8), the route-guard test (S3), the rate-limit test (S5) — is advisory until something refuses to deploy when it fails.

### Estimated implementation complexity
**High — and it is the only Phase 0 task whose scope is genuinely unknown.**

The workflow file is trivial. Making `npm test` *actually pass on a clean runner* may not be. Verified at `3f3071b`:

- **`npm test` is 59 sequential `npm run` scripts** (`package.json:12`), executed one after another. On CI that is a long, serial job with 59 places to fail.
- **11 of the 116 test files reference `DATABASE_URL`.** Without a Postgres service container they will fail, and the gate will be red from its first run — which is the fastest way to teach a team to ignore a gate.
- **Node is unpinned** — no `engines`, no `.nvmrc`. CI will pick a version that local development has never used.
- **Some tests may reference `OPENAI_API_KEY`** and hit a live provider. Any test that makes a network call to a paid API cannot be a deploy gate.

**Therefore S10 begins with a baseline spike, not with a workflow file:** *does `npm test` pass, from a clean checkout, on a clean machine, today?* That question has no recorded answer, and everything else in S10 is a function of it. **Start the spike on day one, in parallel with the code fixes**, because it is the only Phase 0 task that can surprise the schedule.

### Verification steps
1. **Baseline first:** a clean checkout on a clean runner, `npm ci && npm run release:check` — record exactly what passes, what fails, and why. This is a deliverable, not a preliminary.
2. CI runs on every push and every PR to `main`.
3. A deliberately-broken commit (a type error) **fails** CI.
4. A deliberately-failing test **fails** CI.
5. `npm audit` (or the chosen SCA tool) runs, and a seeded high-severity advisory fails the build.
6. The workflow completes in a time a human will actually wait for. If the 59-script serial suite makes that impossible, **parallelising or sharding it is part of this task**, not a follow-up.

### Rollback strategy
Delete `.github/`. **CI touches no application code, no schema, and no runtime path — the rollback risk is nil.** The *organisational* risk is the opposite of a rollback: a gate that is red for reasons unrelated to the change under review teaches everyone to bypass it, and a bypassed gate is worse than no gate, because it is believed. **If the baseline suite cannot be made green, say so and fix it before turning the gate on** (see V3).

### Definition of Done
- The baseline is recorded: what `release:check` does on a clean runner, and what it took to make it green.
- CI runs `typecheck`, `test` and `build` on every push and PR.
- Node is pinned.
- Any test requiring a database runs against a service container; any test requiring a paid external API is **excluded from the gate** and marked as such.
- Dependency scanning runs with a severity threshold that fails the build, and a patching SLA by severity is written down.
- No test in the gate makes a live call to a paid third-party API.

### Expected production risk reduction
**Closes R14 (🟠) and is one of the three tasks that close R5 (🔴 RED)** — *untested code deploys by default*. This is the machinery every other gate in the programme runs on. Its value is not dependency scanning; it is that **enforcement becomes possible for the first time.**

---

## TRUST1-V3 — Pre-deploy verification gate

### Objective
Make `npm run release:check` a gate on the path to production that **cannot be bypassed**.

### Repository components affected
| File | What changes |
|---|---|
| `.github/workflows/` | `release:check` runs as a **required** status check |
| **GitHub branch protection on `main`** | A repository *setting*, not a file. `main` requires the check to pass before merge |
| `deploy.sh:36-38` | Invokes `release:check`, not `npm run build`, and aborts on failure (coordinated with `O7`) |

### Dependencies
**Hard dependency on `TRUST1-S10`.** V3 is the *enforcement*; S10 is the *machinery*. There is no gate to enforce until CI exists.

### Estimated implementation complexity
**Medium.** The mechanism is small. The judgement is not: **turning on a gate that the current test suite cannot pass makes the gate the problem**, and it will be routed around within a week. V3 is only correct once S10's baseline is green.

### Verification steps
1. A PR with a type error **cannot be merged** to `main`.
2. A PR with a failing test **cannot be merged** to `main`.
3. A direct push to `main` bypassing the check is **rejected** by branch protection.
4. `deploy.sh` on a tree with a failing test **aborts** and does not push. Today it builds and pushes regardless.
5. Branch protection is verified **in the GitHub UI or API** — a setting, not a file, and therefore the one Phase 0 deliverable that `git` cannot prove.

### Rollback strategy
Disable branch protection; revert the workflow and `deploy.sh` change. No application code is touched. **The failure mode to plan for is not a broken deploy — it is an emergency:** a hotfix needed while the gate is red. Decide *now*, and write down, who may bypass branch protection, under what circumstances, and what they must do afterwards. A gate with no documented emergency path gets disabled permanently during the first incident, at 3 a.m., by someone who will not remember to turn it back on.

### Definition of Done
- CI runs `release:check` on every push and PR.
- Branch protection on `main` requires it to pass, and administrators cannot silently bypass it.
- `deploy.sh` invokes the gate and aborts on failure.
- A documented, auditable emergency-bypass procedure exists.
- Verified by an actual attempt to merge a failing change, not by inspecting configuration.

### Expected production risk reduction
**This is the task that converts the rest of the programme from documentation into enforcement** (`TRUST1` §5.4). Every test written in Phase 0 is worthless until something refuses to deploy when it fails. One of the three tasks closing **R5 (🔴 RED)**.

---

## TRUST1-O7 — Production deployment pipeline hardening

### Objective
Stop `deploy.sh` committing the working tree indiscriminately, and make it impossible to deploy code that has not passed the tests.

### Repository components affected
| File | What changes |
|---|---|
| `deploy.sh:18-33` | **`git add -A` (`:23`) stages *everything* in the working tree** and commits it with a default message (`:32`). Replace with a hard refusal to run on a dirty tree |
| `deploy.sh:36-38` | Runs `npm run build` only. Replace with `npm run release:check` (`typecheck && test && build`), aborting on failure |
| `.engineering/checklists/PRODUCTION_RELEASE.md` | **Read and reconciled, not rewritten.** It already requires named human authorisation and pre-release verification. The checklist is right; the script bypasses it |

**Already correct, and must not be lost:** `deploy.sh:12-16` refuses to run off `main`. Keep it.

### Dependencies
**`TRUST1-S10`** (CI must exist) and **`TRUST1-V3`** (the gate must be defined). O7 is the third face of the same work: S10 builds the machinery, V3 defines the gate, O7 closes the path that goes around it.

### Estimated implementation complexity
**Medium.** The script edit is small. The reconciliation with `PRODUCTION_RELEASE.md` — so that the script and the checklist say the same thing, and neither quietly overrides the other — is the real deliverable.

### Verification steps
1. `./deploy.sh` on a **dirty** tree → **refuses**, names the offending files, and stages nothing. Today it commits all of them, silently. *(As this plan was written, the tree held eleven unrelated files from `PDA1`/`PKR`. `deploy.sh` would have shipped every one.)*
2. `./deploy.sh` with a failing test → **aborts before pushing**.
3. `./deploy.sh` with a type error → **aborts before pushing**.
4. `./deploy.sh` on a clean tree, on `main`, with a green `release:check` → deploys normally.
5. `git log` after a deploy attempt on a dirty tree → **no commit was created.**
6. The script and `PRODUCTION_RELEASE.md` are consistent: nothing the script does contradicts the checklist, and nothing the checklist requires is silently skipped by the script.

### Rollback strategy
`git revert <commit>` — `deploy.sh` is a standalone script and touches no application code. **The realistic failure mode is a false refusal**: a legitimate deploy blocked by a stray untracked file. That is the correct bias (refusing to ship an unknown file is right), and the fix is `.gitignore` hygiene, **not** relaxing the check.

### Definition of Done
- `deploy.sh` never runs `git add -A` and never auto-commits.
- `deploy.sh` refuses to run on a dirty tree.
- `deploy.sh` runs `release:check` and aborts on any failure.
- The `main`-branch guard is retained.
- The script and `.engineering/checklists/PRODUCTION_RELEASE.md` are reconciled and consistent.

### Expected production risk reduction
**Closes R5 (🔴 RED) — with S10 and V3.** Two distinct defects die here. First, **untested code reaches production by default**: `release:check` exists and nothing runs it, so the only real gate today is that the bundle compiles. Second, **`git add -A` ships whatever happens to be lying in the working tree** — a scratch script, a database dump, a half-finished change from another workstream, or a file that has nothing to do with the deploy and no author who knows it went out.

> **What O7 does *not* fix, and must not be believed to fix:** `scripts/post-merge.sh` runs `npm run db:push` **automatically after every merge**, wired via `.replit:61-63` `[postMerge]` — and `scripts/migrate-prod.sh` runs `npx drizzle-kit push --force` directly against the production database. **Neither path goes through `deploy.sh`, and hardening `deploy.sh` does not touch either.** That is `TRUST1-O8` (Phase 1), it is `R6` (🔴 RED), and it is arguably the largest single data-loss risk in the platform. §6 and §7 carry it forward. **Do not read a hardened `deploy.sh` as a safe path to production while a git merge can still push a schema.**

---

# 3. Recommended Implementation Order

The ordering follows `TRUST1` §9's three rules — **anything that can leak or forge goes first; enforcement machinery precedes the things it enforces; nothing is verified before it is reconciled** — with two evidence-based adjustments this plan adds.

| # | Task | Complexity | Why here |
|---|---|---|---|
| **0** | **`S10` baseline spike** *(in parallel, from day one)* | — | The only task with unknown scope. Does `npm test` pass on a clean runner today? Nobody knows. Find out while the cheap fixes land, not after |
| **1** | **`S1`** Session secret fails closed | Low | **Do this first.** The only defect that defeats every other control simultaneously. If a session can be forged, no privacy notice, erasure path or retention policy protects anyone. Blocked on nothing. Roughly an hour |
| **2** | **`S8`** Remove reset-token exposure | Medium | Ship with P8 — see below |
| **3** | **`P8`** Remove personal data from logs | Low | **S8 and P8 are one defect with two halves.** The token leaks into the response (S8), and the response is written to the log (P8). Either fix alone leaves a real exposure. Land them together, in one commit if practical, and *before* any log shipping or error tracking is contemplated |
| **4** | **`S2`** Secure production cookies | Low | Completes the session-cookie protection begun by S1. Independent; trivially small |
| **5** | **`S3`** Secure meal template endpoints | Medium | The guard is minutes. The 237-route audit is the work, and it is what stops the *next* S3 |
| **6** | **`S5`** Authentication rate limiting | Medium | Needs a new dependency and two recorded decisions (store, lockout-vs-backoff). Deploy in log-only mode first — it is the one Phase 0 task that can throttle real households |
| **7** | **`S10`** CI pipeline foundation | High | Now the spike's answer is known. **Nothing downstream can be enforced until this exists** |
| **8** | **`V3`** Pre-deploy verification gate | Medium | Turn the gate on **only once the baseline suite is green.** A red gate is routed around, and a routed-around gate is worse than none |
| **9** | **`O7`** Deployment pipeline hardening | Medium | Close the path around the gate. Last, because it enforces a gate that must exist first |

**The two adjustments to `TRUST1` §9's stated order, and why:**

1. **`S8` and `P8` move ahead of `S2`, and ship together.** `TRUST1` lists S1 → S2 → S8 → P8. The evidence says S8 and P8 are a *compound* defect — a live reset token, disclosed in a response, then written to a plaintext log — and splitting them across commits leaves a half-closed hole between them. S2 is independent and equally cheap; it loses nothing by moving one place later.
2. **The `S10` baseline spike starts on day one, in parallel.** `TRUST1` places S10 seventh, which is right for *delivery* and wrong for *discovery*: it is the only Phase 0 task that can surprise the schedule, and the answer to "does the suite pass on a clean runner?" costs an hour to find and could cost a week to fix.

**Wall-clock shape.** Tasks 1–4 are hours, not days: a single engineer can close S1, S8, P8 and S2 — **four of the six red risks Phase 0 moves** — inside a day, with tests. Tasks 5–6 are days. Tasks 7–9 are the phase's real cost, and their duration is set by the spike's answer, not by this plan.

---

# 4. Milestone Commit Points

Six commits. Each is independently revertible, each leaves the platform in a **strictly better** state than the one before, and none depends on a later one to be safe.

| # | Milestone | Contains | Commit gate — do not commit until |
|---|---|---|---|
| **M0** | **Baseline recorded** | No code. The `S10` spike's findings: what `npm run release:check` does on a clean runner, what fails, and why | The baseline is written down. **This is a deliverable.** Without it, every later "the tests pass" claim is unfalsifiable |
| **M1** | **Authentication cannot fail open** | `S1` + `S2` | Server refuses to boot without `SESSION_SECRET`; cookie is `Secure` in production and *not* in local HTTP dev (including with `ENABLE_REGISTRATION=true`); secret rotated; `npm test` green against M0's baseline |
| **M2** | **Personal data stops leaving the boundary** | `S8` + `P8` | `GET /api/user` carries no reset token; no response body reaches any log; the log-redaction test and the allowlist test both pass. **These two land together** |
| **M3** | **No write route is reachable unauthenticated** | `S3` | Five `meal_templates` write routes guarded; `:5157` decided and recorded; all 237 routes audited; every public route on a justified allowlist; admin template management verified unbroken |
| **M4** | **Authentication is throttled** | `S5` | Limits fire per IP **and** per account; store choice and lockout decision recorded; verified against the **deployed, autoscaled** app, not a single local process |
| **M5** | **Enforcement exists** | `S10` + `V3` | CI green on a clean runner; a deliberately-broken commit fails; branch protection on `main` verified by an actual blocked merge; emergency-bypass procedure written |
| **M6** | **The path around the gate is closed** | `O7` | `deploy.sh` refuses a dirty tree, never `git add -A`, runs `release:check`, aborts on failure; reconciled with `PRODUCTION_RELEASE.md` |

**Commit discipline.** Per `ENGINEERING_WORKFLOW.md` STEP 9 and `COMMIT_PUSH_DEPLOY_PROTOCOL.md`: every milestone produces a **local commit** and its own implementation document under `docs/implementation/platform/`, each with its own rollback identifier and its own Architecture Compliance Checklist. **Pushing is not implied. Deployment is never implied and requires separate, explicit approval.**

**Deploy cadence — a decision required before M1.** Phase 0 fixes live defects, so the value of each is realised only on deploy. But **M5 is the milestone that makes deploying safe**, and it is fifth. Someone must therefore decide, deliberately and in writing: *are M1–M4 deployed as they land, through the current unsafe pipeline — or held until M5/M6 make the pipeline safe?* There is a real argument for each. **Holding M1–M4 means leaving a total authentication bypass live for the length of the CI work**, which the recommendation below rejects.

> **Recommended:** deploy **M1 and M2 as they land**, using the existing `PRODUCTION_RELEASE.md` checklist executed *manually and by a named human* — the exposures they close (forgeable sessions, children's medical data in plaintext logs, live reset tokens) are live today and each fix is small, well-tested and independently revertible. Hold M3–M4 for M5's gate if the schedule allows. **Record whichever choice is made.** An undecided deploy cadence is how the safe path and the fast path quietly become the same path.

---

# 5. Regression Testing Plan

### 5.1 The baseline problem — read this first

**THA has 116 test files and 59 `npm test` scripts, and it is not currently known whether they pass on a clean machine.** Nothing runs them on any path to production. Until `M0` establishes the baseline, *"the tests still pass"* is not a verifiable claim — it is a hope, and every regression assertion in Phase 0 rests on it. **`M0` is therefore not optional and not a formality.**

### 5.2 Per-task regression surface

| Task | What could regress | How it is caught |
|---|---|---|
| `S1` | Any environment (dev, test, CI) without `SESSION_SECRET` now **crashes on boot** rather than starting. This will affect a developer, a test runner, or CI on the first run | `.env.example` updated; CI secret configured; documented in M1's implementation report. **The crash is the feature — do not "fix" it by restoring a default** |
| `S1` | Rotating the secret **logs every user out, once** | Expected and accepted. State it in the release note |
| `S2` | ⚠️ **The `isProduction` trap** (`server/auth.ts:35`): reusing the existing constant sets `secure: true` for any developer running with `ENABLE_REGISTRATION=true`, silently breaking local login | **Explicit regression test:** local HTTP login with `ENABLE_REGISTRATION=true` still works |
| `S8` | The **allowlist changes the exported `SafeUser` type.** Every consumer reading a field the allowlist omits fails to compile — and a client surface reading a now-absent field would render an honest blank instead of a value | `npm run typecheck` catches the server side exhaustively. **The client must be checked by hand**: the type change is server-side, so a client reading `user.someField` from the JSON will not fail to compile — it will simply receive `undefined` |
| `P8` | None identifiable. The captured body has no consumer other than the log line | The method/path/status/duration line is asserted intact |
| `S3` | **Over-guarding.** Any legitimate non-admin writer to `meal_templates` — a client surface, a seed script, a test fixture — breaks | Full admin template-management smoke test; `npm test` (`test:intelligence-templates-binding` exercises this capability); the 237-route audit precedes the guard for exactly this reason |
| `S5` | **Locking out real users.** An IP-only limiter behind corporate NAT or mobile CGNAT throttles legitimate households sharing an egress IP | **Deploy in log-only mode first**; observe the real distribution; then enforce. Per-account limiting alongside per-IP |
| `S10` | CI may be red for reasons unrelated to any change under review — a DB-dependent test, an unpinned Node version, a live API call | `M0`'s baseline. **Do not turn the gate on (V3) until the suite is green** |
| `V3` | A legitimate emergency hotfix is blocked by the gate | Documented, auditable emergency-bypass procedure — **written before the gate is turned on, not during the first incident** |
| `O7` | A legitimate deploy is refused because of a stray untracked file | Correct bias. Fix `.gitignore`; **never relax the check** |

### 5.3 Suite-level regression

1. **`M0` baseline:** clean checkout, clean runner, `npm ci && npm run release:check`. Record the exact result.
2. **Every milestone re-runs the full 59-script suite** and compares against the M0 baseline. *"Still passing"* means *"passing exactly what M0 passed"* — a suite that was already red in one place and is now red in two has regressed, and a suite compared only against itself will not show it.
3. **`npm run typecheck` at every milestone** — the primary detector for `S8`'s type ripple.
4. **From M5, the suite runs automatically on every push.** That is the point of the phase.

### 5.4 Manual smoke test — required at M1, M2, M3 and M6

Phase 0 touches authentication, session handling, the user object, and the deploy path. The automated suite covers **none** of the four (there are zero authorisation tests). **A human must therefore walk these, on a deployed staging build, at each of those milestones:**

1. Register a new account (with `ENABLE_REGISTRATION=true`) → verification email received.
2. Log in → session persists across a page reload.
3. Log in over local HTTP in development → **still works** (the S2 trap).
4. Forgot password → reset email received → reset completes → the new password logs in.
5. `GET /api/user` in the browser network tab → **no** `passwordResetToken`, no `password`, no verification token.
6. Server log during all of the above → **no response bodies**, no personal data, no tokens.
7. Anonymous `DELETE /api/meal-templates/:id` → rejected; the template still exists.
8. Admin creates, edits and deletes a meal template → all still work.
9. Rapid failed logins → throttled (from M4).
10. Log out → session invalidated.

**Why manual.** `TRUST1-S9` (the authorisation test suite) is Phase 4. Until it exists, **a human walking the auth path is the only coverage that exists for the code Phase 0 changes most.** That is an uncomfortable sentence and it is an accurate one.

---

# 6. Production Verification Checklist

Run **against the deployed application**, after each deploy of a Phase 0 milestone.

> **The distinction this checklist exists to enforce** (`TRUST1` §5.4): a flag set in `server/auth.ts` is a **claim**. A flag observed on an HTTP response from the deployed app is a **fact**. `EWO-PRO1` declared three controls shipped and none of them are in the code — which is how a claim and a fact diverge without anyone noticing.

| # | Control | How it is verified against production | Task |
|---|---|---|---|
| **1** | Server refuses to boot without `SESSION_SECRET` | Verified in **staging**, never production. Recorded in the milestone report | `S1` |
| **2** | The committed fallback secret is dead | `grep -r "r3pl1t_s3cr3t" .` → no matches; the production secret is confirmed rotated to a never-committed value | `S1` |
| **3** | Session cookie is `Secure`, `HttpOnly`, `SameSite=Lax` | `curl -i https://<prod>/api/login` → read the actual `Set-Cookie` header **on the wire** | `S2` |
| **4** | No reset token in the user response | `curl` an authenticated `GET /api/user` → the body contains no `passwordResetToken` and no `passwordResetExpires` | `S8` |
| **5** | No personal data in logs | Sample the production log; `grep` for `weight`, `bmi`, `allergy`, `displayName`, `username`, `passwordResetToken`, and for the ` :: {` body-append pattern → **zero matches** | `P8` |
| **6** | Anonymous writes are rejected | `curl -X DELETE https://<prod>/api/meal-templates/<id>` with **no session** → 401/403, and the template still exists | `S3` |
| **7** | Authentication is throttled | Repeated failed logins against the deployed app → **429**. Verified against the **autoscaled** deployment, where a per-instance limiter behaves differently than it does locally | `S5` |
| **8** | CI is a required check | GitHub branch-protection settings on `main` — verified by an **actual attempted merge of a failing PR**, not by reading configuration | `S10`, `V3` |
| **9** | The deploy script cannot bypass the gate | `./deploy.sh` on a dirty tree → refuses. With a failing test → aborts. No commit created | `O7` |
| **10** | Schema head unchanged | `DATABASE_URL="<prod>" npx tsx scripts/verify-prod.ts` → **PASS**. This script already exists, already exits non-zero on failure, and Phase 0 changes no schema — so any drift it reports is *someone else's* change reaching production | (guard) |

**Every result is recorded in the milestone's implementation report, dated.** These records are the first entries in `TRUST1-V6`'s evidence pack, and — per Rule KC15 — this is the only moment collecting them is cheap.

> **Phase 0 does not build `TRUST1-V2` (the automated trust-verification suite) or `V4` (post-deploy verification).** Those are Phase 5. **Until they exist, this checklist is run by a human, and a human will eventually forget.** That is a known, accepted, temporary weakness of Phase 0 — recorded here rather than discovered later.

---

# 7. Phase 0 Exit Criteria

Phase 0 is complete when **every one of these is demonstrably true** — *demonstrably* meaning **observed against the deployed system**, not asserted by a document. That standard is the whole reason Workstream V exists.

### Controls
1. ✅ The server **refuses to start** without `SESSION_SECRET`. The committed fallback string exists nowhere in the repository. The production secret has been rotated. *(`S1`)*
2. ✅ The session cookie carries `Secure`, `HttpOnly` and `SameSite=Lax` **on a real production response** — and local HTTP development still works. *(`S2`)*
3. ✅ `GET /api/user` returns **no** `passwordResetToken` and **no** `passwordResetExpires`, and `sanitizeUser` is an **allowlist** that would fail on a new, unlisted `users` column. *(`S8`)*
4. ✅ **No API response body is written to any log**, in any environment, and a test asserts it. *(`P8`)*
5. ✅ Every `meal_templates` write route is guarded; **all 237 `/api` routes are audited**; every public route is on an explicit, justified allowlist. *(`S3`)*
6. ✅ All five authentication routes are rate-limited, **per IP and per account**, verified against the deployed autoscaled app, with the store and lockout decisions recorded. *(`S5`)*
7. ✅ **CI exists**, runs `typecheck`, `test` and `build` on every push and PR, is **green**, and includes dependency scanning with a severity threshold. *(`S10`)*
8. ✅ **Branch protection on `main` requires CI to pass**, verified by an actual blocked merge, with a documented emergency-bypass procedure. *(`V3`)*
9. ✅ `deploy.sh` **refuses a dirty tree**, never runs `git add -A`, runs `release:check`, aborts on failure, and is reconciled with `PRODUCTION_RELEASE.md`. *(`O7`)*

### Evidence
10. ✅ The **M0 baseline is recorded**, and every "the tests pass" claim in Phase 0 is measured against it.
11. ✅ Each of the six milestones has a committed implementation document with its own rollback identifier and its own Architecture Compliance Checklist.
12. ✅ The **production verification checklist (§6) has been executed and its results recorded, dated**, for every deployed milestone.
13. ✅ The **manual auth smoke test (§5.4) has been walked by a human** at M1, M2, M3 and M6.

### Honesty
14. ✅ **Nothing in this phase is claimed as done on the basis of source code alone.** Where a control could not be verified against the deployed system, it is recorded as **unverified** — not as done.

> **Phase 0 moves six of `TRUST1`'s ten RED risks: R1, R2, R4, R5, R8, and (partially) R9.** It is roughly a week of engineering. **It does not make THA launch-ready, and no one should read it as doing so.**

---

# 8. Risks Remaining After Phase 0

**Phase 0 stops the bleeding. It does not make the patient well.** Everything below is still live on the day Phase 0 completes. Stating it plainly is the point — the failure this programme was written to correct is a document that certifies what has not been done.

### 8.1 Still 🔴 RED after Phase 0

| Risk | What remains | Owner | Why it is not in Phase 0 |
|---|---|---|---|
| **R6 — `drizzle-kit push --force` against production, and `db:push` on every merge** | `scripts/migrate-prod.sh` runs an unreviewed, untransacted, unversioned schema diff with `--force` against the production database. `scripts/post-merge.sh` runs `npm run db:push` **automatically after every merge**, wired via `.replit:61-63`. **Neither path goes through `deploy.sh`, so `O7` does not touch either.** A *git merge* can mutate the production schema | `O8` | **Blocked on `O5`.** Removing the mechanism that mutates the production schema, with no proven restore, is changing the parachute mid-jump. This is *correct sequencing*, not a deferral — but it means **the largest single data-loss risk in the platform survives Phase 0 intact** |
| **R7 — no tested database restore** | No backup or restore script exists anywhere. Neon very probably takes automatic backups; **THA has never restored one.** An untested backup is a belief, and the belief is always tested for the first time on the worst day | `O5` | Phase 1. It is the gate `O8` waits behind |
| **R3 — health and children's data processed with no lawful basis, no notice, no consent, no erasure, no export, no retention limit** | **All of it.** No privacy notice, no terms, no consent record, no deletion path, no export path, no retention policy. `P8` removes the data from the *logs*; it does nothing about the lawfulness of holding it at all | `P1`–`P7`, `P10`, `P12` | Phases 2–3. Legal review sits on the critical path and must start now |
| **R10 — governing documents declare controls that do not exist** | `PLATFORM_QUALITY_ARCHITECTURE.md` §2 still rates Security and Privacy **"Mature — declared, enforced, audited."** `EWO-PRO1` still declares three controls that are not in the code. **Both are governing, engineers rely on both, and both are wrong today** | `V1` | Phase 1. **A false assurance is more dangerous than a known gap, because it stops anyone looking** |

### 8.2 Still 🟠 AMBER after Phase 0

- **R9 is only partially closed.** **The six-character password floor survives** (`server/auth.ts:129`, `:283`, `:316`). `S5` throttles the *rate* of guessing; it does not make a six-character password harder to guess. **After Phase 0, the password floor is the binding constraint on credential security** — and its fix, `S7`, is not scheduled until Phase 4. See §9.
- **R11 — no security headers.** No `helmet`, no CSP, no HSTS. Any XSS escape hatch still escalates to session theft, in a product that renders LLM output to users. HSTS's absence also means `S2`'s secure cookie can still be stripped on a first plaintext request. *(`S4`, Phase 4.)*
- **R12 — no alerting.** Nothing pages anyone. Failure is still discovered by a user. And the 72-hour breach clock starts on *awareness*, which means THA has engineered itself to become aware last. *(`O1`, `O2`, `O3`.)*
- **R13 — zero authorisation test coverage.** `S3` adds one route-guard test; **`S9`'s full suite over all 237 routes is Phase 4.** Until it lands, the audit's result is a snapshot, and the next unguarded route arrives undetected — exactly as R4 did.
- **R15 — meal photos on local disk, served unauthenticated, on a multi-instance deployment, and tracked in git.** *(`S12`.)*
- **R16 — personal data to OpenAI with no DPA and no recorded training-data position.** *(`P9`, `P13`.)*
- **R17 — no incident procedure and no runbooks.** *(`O6`, `P14`.)*
- **R18 — `.env.example` still documents one key of many.** `S1` adds `SESSION_SECRET`; the rest remain undocumented, and a correctly-configurable environment is what removes the *temptation* that produced R1. *(`S11`, Phase 1.)*
- **R19 — CSRF posture still undecided and unrecorded.** *(`S6`.)*

### 8.3 Risks Phase 0 introduces

Honesty runs both ways. Phase 0 creates three new failure modes, each acceptable, each needing a decision:

1. **A hard boot failure on a missing `SESSION_SECRET` (`S1`).** Any environment that was silently working on the fallback now **crashes**. That is the intended behaviour and it is the correct one — but it will bite the first developer, CI runner, or new environment that hits it. Mitigation: `.env.example`, the CI secret, and a clear error message.
2. **A rate limiter that can throttle real households (`S5`)** — behind corporate NAT or mobile CGNAT, an IP-only limit hits legitimate users. Mitigation: log-only mode first; per-account limits alongside per-IP.
3. **A gate that can block an emergency (`V3`).** Branch protection with no documented bypass gets disabled permanently during the first 3 a.m. incident, by someone who will not remember to turn it back on. **Mitigation: write the emergency-bypass procedure *before* turning the gate on.**

---

# 9. Recommended Phase 1 Work

`TRUST1` §9 defines Phase 1 as: **`O5` → `O8` *(strictly in this order)* · `O1` + the `EWO-PRO1` reconciliation · `V1` · `S11` · `O4` · `O2` (only after `P8`)**. That ordering is sound and this plan does not contest it.

**Recommended Phase 1 sequence:**

| # | Task | Why it is here |
|---|---|---|
| **1** | **`O5` — database backup and *tested* restore** | The gate everything else waits behind. Not a documented backup **policy** — a restore **performed** into a scratch environment, **timed**, and recorded. Until it is done, THA's position on data loss is a belief |
| **2** | **`O8` — migration convergence** *(strictly after `O5`)* | Removes `drizzle-kit push --force` from every production path **and disables the post-merge `db:push` hook**. Closes R6, the largest data-loss risk on the board. **Cannot precede `O5`** |
| **3** | **`V1` — reconcile declared controls against running code** | Depends on nothing and must go early. Every future TRUST1 task cites `PLATFORM_QUALITY_ARCHITECTURE.md`; while §2 wrongly rates Security and Privacy "Mature", the whole programme inherits the error. Includes the proposed amendment to PQA §2 — **through governance review, never unilaterally** |
| **4** | **`O1` — health endpoints + the `EWO-PRO1` reconciliation** | The endpoint is the small half. **The important half is finding out how three declared controls left the codebase without anyone noticing for over a week. That mechanism is still running** |
| **5** | **`S11` — complete `.env.example`** | Small, and it is the **root cause of R1**: the fallback secret exists precisely so a misconfigured environment can still boot, and an incomplete `.env.example` guarantees the misconfiguration. Fix the documentation and the temptation to fail open disappears with it |
| **6** | **`O4` — structured logging** | Builds the mechanism whose *requirement* `P8` set. A field-level redaction allowlist makes the P8 defect structurally hard to reintroduce |
| **7** | **`O2` — error tracking** *(hard dependency: after `P8`, ideally after `O4`)* | **Must not precede `P8`** — integrating it first ships personal data to a third-party processor, at volume, in error payloads |

### Three recommendations this plan adds, each requiring approval

1. **Pull `TRUST1-S7` (password policy) forward from Phase 4 into Phase 1.** Phase 0's rate limiting makes the **six-character floor the binding constraint on credential security** — excellent scrypt hashing of a guessable secret protects nobody. Raising the minimum length is a small change to three call sites (`server/auth.ts:129`, `:283`, `:316`) and closes the remainder of R9. Leaving it in Phase 4 means shipping a throttled brute-force target rather than an unthrottled one, and calling it done.

2. **Disable the `[postMerge]` `db:push` hook immediately, ahead of `O8`.** `TRUST1` §Scope Lock suggestion 3 already recommends this and it is a **one-line change** to `.replit`. A schema mutation triggered by a git merge is not a thing anyone decided to do; it is the fastest path to R6; and unlike the rest of `O8`, **removing it needs no tested restore** — it only removes a way to mutate the schema. It could safely be done inside Phase 0, and the only reason this plan does not schedule it there is that **Phase 0's task list is fixed at the nine approved tasks**. It is raised here for a decision.

3. **Begin legal review now, in parallel with Phase 0.** `P3` (privacy notice), `P10` (children's data) and `P12` (DPIA) all require legal input, and legal will take longer than the engineering. It sits on the critical path to launch and it does not compete with Phase 0 for engineering time — it competes only with the calendar, which Phase 0 is already spending.

### What Phase 1 must not do

- **Must not integrate error tracking before `P8`.** Hard stop (`TRUST1` §6.1).
- **Must not converge migrations before `O5`.** Hard stop.
- **Must not amend `PLATFORM_QUALITY_ARCHITECTURE.md` §2 unilaterally.** It is governing architecture; `V1`'s correction goes through governance review.
- **Must not create a second launch gate.** `THA_MASTER_EVOLUTION_ROADMAP.md` §9 is the single gate; `V5` folds TRUST1's criteria into it.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity is created, altered, or keyed by this document.
  Explain: Documentation only. TRUST1 task IDs (TRUST1-S1 …) and milestone IDs
  (M0 … M6) are document anchors, not runtime identifiers, and are persisted
  nowhere.

☑ One owner per fact
  No attribute gains a store.
  Explain: No code, no schema, no data. Where the planned tasks touch owned
  facts, the owner is named and preserved: server/lib/access.ts remains the sole
  authority on identity and role (PKR25) — S3 APPLIES its existing guard and
  does not write a second one. S1/S2 change how the session secret and cookie
  are configured; express-session remains the sole owner of session state.

☑ No duplicate entities
  Explain: No entity created.

☑ No duplicate ownership
  Explain: The plan's chief design constraint. release:check (package.json:58)
  remains the ONE gate — S10 INVOKES it, V3 ENFORCES it, O7 stops deploy.sh
  going around it. Three tasks, one gate, not three gates. deploy.sh is
  RECONCILED with .engineering/checklists/PRODUCTION_RELEASE.md rather than
  competing with it. No second launch gate is created (TRUST1-V5 owns that, and
  it is Phase 5).

☑ No duplicate state
  Explain: No state.

☑ Extends existing architecture
  Explain: Subordinate to TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md, which is
  itself subordinate to PLATFORM_QUALITY_ARCHITECTURE.md §11. It plans the nine
  approved Phase 0 tasks and adds none. Every task extends something that
  already exists: release:check (package.json:58), scripts/verify-prod.ts,
  server/lib/access.ts, server/lib/sanitizeUser.ts, deploy.sh's existing
  main-branch guard, and script/build.ts's existing express-rate-limit
  allowlist entry.

☑ Progressive enrichment where appropriate
  Explain: N/A — not a knowledge entity and not transactional state.

☑ Knowledge domain compliance
  Explain: Introduces NO knowledge domain and fills no PKCA §1.1 row. It is an
  execution plan for engineering work, not a body of knowledge THA ships. It
  APPLIES the PKCA's rules: Rule KC8 (declared vs enforced) is why §6 verifies
  against the DEPLOYED system and never against source; KC12 (a declined
  discovery is recorded) is why S3's :5157 decision and S5's store and lockout
  decisions are named deliverables; KC15 (maintenance IS the work) is why §6's
  results are recorded as they land, as the first entries in V6's evidence pack.

☑ Honest gaps over fabricated information
  Explain: Every claim is re-verified at commit 3f3071b with a file:line, and
  THREE citation errors in the parent document are CORRECTED rather than
  repeated (§ Evidence Base): the logger's line range, the over-stated scope of
  S3's route list, and the isProduction trap TRUST1 did not name. No effort
  estimate is given beyond mechanically-bounded ones, and S10 is stated as
  UNKNOWN-SCOPE rather than guessed at. §8 states what Phase 0 does NOT fix,
  including that it leaves R6 — the largest data-loss risk — fully intact, and
  §8.3 states the three risks Phase 0 INTRODUCES.

☑ No permanent synchronisation bridge
  Explain: No bridge created. O8 (which removes one — the dual migration
  mechanism) is Phase 1 and is deliberately NOT pulled into Phase 0, because it
  is hard-blocked on O5's tested restore.

☑ Evolution over replacement
  Explain: Nothing is replaced. deploy.sh is HARDENED, not rewritten
  (its main-branch guard at :12-16 is explicitly retained). verify-prod.ts is
  cited as an existing working control. sanitizeUser.ts's denylist is converted
  to an allowlist — a replacement WITHIN one file, named, with the reason
  (the denylist has already failed twice on the same table).
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:            None. Documentation only.
Declared SoT:               N/A — no data domain is read or written.
New store created?          NO
Existing store extended?    NO
Consumer created?           NO
```

The **implementations** this document plans will touch `users` (via `sanitizeUser`, `S8`) and the session store (`S1`, `S2`). Each must file its own Domain Impact declaration at that time. **This document creates none.**

---

## PRODUCT REGISTRY IMPACT

- **Registry affected:** **NO**
- **Entries created:** NONE
- **Entries updated:** NONE
- **Entries retired:** NONE
- **Any entry set to `public` or `household`:** N/A
- **Product knowledge written into a prompt, template, or fallback string:** **NO**

**Justification.** The test is *"would a person's answer to 'what is THA?' be different after this change?"* It would not: this document alters no page, route, journey, capability, dialog, integration, setting, or claim. Nothing ships.

**Forward notice.** The nine Phase 0 *implementations* are also almost entirely non-user-facing — they change how the server boots, what it logs, who may call five routes, and how it deploys. **Two carry a user-visible edge that must be assessed when they are implemented, not assumed away here:** `S1`'s secret rotation **logs every user out once**, and `S5`'s rate limiting introduces a **new 429 state a household can encounter** — which, per the Experience Architecture, owes an honest, calm, actionable error message rather than a raw status code. Whether either crosses the user-facing threshold is a judgement for the implementing change, which must complete the **Experience & UI Governance Compliance** and **Product Registry Compliance** blocks if it does.

---

## DATA IMPACT

- **Reads existing data:** NO
- **Writes new data:** NO
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO

No database was connected to, queried, or modified in producing this document. All evidence is from source files at commit `3f3071b`.

---

## TRUST CHECK

**Could this mislead the user?**
No user sees it. It could mislead **an engineer** — which is the failure the parent programme was written to correct — so the stricter standard applies. Every factual claim carries a `file:line` verified at `3f3071b`, or an explicit negative search. **Where the parent document's own citations were wrong, they are corrected rather than inherited** (three cases, §Evidence Base). Inheriting a citation because a canonical document made it is exactly how R10 happened.

**Could this fabricate certainty?**
The guard is applied hardest at the phase's weakest point. **`TRUST1-S10`'s scope is genuinely unknown** — nobody knows whether `npm test`'s 59 scripts pass on a clean runner, because nothing has ever run them there. This plan does **not** estimate that work. It rates S10 **High**, names the specific reasons it may be worse than it looks (11 DB-dependent test files, an unpinned Node version, possible live API calls), and makes *finding out* — the M0 baseline spike — a **deliverable in its own right, scheduled first and in parallel.** An estimate here would have been a guess wearing a number.

**Is anything guessed but shown as real?**
No. Four limits are stated rather than smoothed over. **(1)** Complexity ratings are given only where the change is mechanically bounded; S10's is a *risk* rating, not a size. **(2)** No task is given a date, and the phase is given a shape ("tasks 1–4 are hours") rather than a duration. **(3)** `S5` is stated as *partially* closing R9 — **the six-character password floor survives Phase 0**, and that is said in §2, §5, §7 and §8, because it is the claim a reader is most likely to over-read. **(4)** `O7` is stated as **not** closing the `drizzle-kit push` / post-merge-hook paths to production, because they do not go through `deploy.sh` — a hardened deploy script is not a safe path to production while a git merge can still push a schema.

**What happens if the system is wrong?**
If this plan over-scopes a task, work is done that did not need doing — recoverable and cheap. The asymmetric risk runs the other way: **an under-stated Phase 0 ships a platform that is believed to be fixed.** That is why §8 exists in the shape it does, why it names the three risks Phase 0 *introduces* as well as the ones it leaves, and why exit criterion 14 forbids claiming any control done on the basis of source code alone.

- **No architectural duplication introduced:** YES
- **No new source of truth created:** YES
- **No runtime behaviour altered:** YES — zero code, schema, migration, dependency, or configuration files changed

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/TRUST1-phase0-implementation-plan-20260711` → `3f3071b7a32e99b87384cb6f6245f54c237f5dd9` |
| **Files modified** | None |
| **Files created** | `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` |
| **Rollback command** | `git rm docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` |
| **Full rollback** | `git checkout rollback/TRUST1-phase0-implementation-plan-20260711` |
| **Verification after rollback** | `.engineering/scripts/repo-structure-verify.sh` passes; `git status` shows the file gone; no other file affected. |
| **What the tag does NOT protect** | The eleven pre-existing, unauthored-by-this-task working-tree entries from `PDA1`/`PKR`. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 they were **not touched, staged, or committed** by this task, and a rollback to the tag will not restore them. |

**Risk of rollback:** none. Deleting this document removes a plan and breaks no code.

---

## SCOPE LOCK

**Implemented scope**
- One document: the canonical TRUST1 Phase 0 implementation plan.
- The nine approved Phase 0 tasks — each with Objective, Repository components affected, Dependencies, Estimated implementation complexity, Verification steps, Rollback strategy, Definition of Done, and Expected production risk reduction.
- Recommended implementation order; six milestone commit points; regression testing plan; production verification checklist; Phase 0 exit criteria; risks remaining after Phase 0 (including three the phase *introduces*); recommended Phase 1 work.
- Every Phase 0 finding **re-verified against the code at `3f3071b`**, with three of the parent document's citations corrected.

**Explicitly excluded**
- **All implementation.** No code, schema, migration, dependency, or configuration was changed. Not one of the nine tasks was started — **including `S1`, despite it being roughly an hour of work**, because doing it here would violate the decision-gated workflow (`ENGINEERING_WORKFLOW.md` STEP 4) and this document's own 🟢 GREEN risk rating.
- **Any task outside the nine approved.** `O5`, `O8`, `O1`, `V1`, `S4`, `S7`, `S9`, `S11`, `S12`, `O2`, `O3`, `O4`, and all of Workstream P beyond `P8`, are named where they bear on Phase 0 and are **planned nowhere in this document.**
- **All new governing architecture.** No document in `docs/architecture/` was created or amended.
- **Any investigation beyond repository evidence.** No external counsel, no vendor documentation, no penetration testing, no database access, no network calls.

**SUGGESTIONS — observed in scope, not implemented, requiring approval**

1. **The `isProduction` trap at `server/auth.ts:35` is not in `TRUST1` and will cause an incident if `S2` is implemented without it.** The existing constant is `NODE_ENV === "production" || ENABLE_REGISTRATION === "true"` — an overloaded flag that gates the private beta, not the environment. Reusing it for the cookie's `secure` flag silently breaks local HTTP login for any developer running with `ENABLE_REGISTRATION=true`. **Recommend this is read before S2 is picked up by anyone.**
2. **`TRUST1-S3`'s scope is over-stated in the parent document.** `server/routes.ts:5175` is `POST /api/meals/:id/link-template` — a different resource, outside S3's objective — and `:5157` (`/resolve`) is a read that already reads the session optionally. **Recommend the parent's §5.2 citation is corrected**, so that the next reader does not either guard a route that should not be guarded or dismiss the finding on discovering one citation is wrong.
3. **`TRUST1`'s citation of the request logger (`server/index.ts:55-62`) has drifted; it is at `:43-67` at `3f3071b`.** Minor, and worth correcting for the same reason: a canonical document whose line numbers are wrong teaches its readers to stop checking them.
4. **The `[postMerge]` `db:push` hook should be disabled immediately, ahead of `O8`.** A one-line change to `.replit`. Unlike the rest of `O8` it is **not** blocked on `O5` — it only *removes* a way to mutate the production schema. **It is not in Phase 0's approved nine and was therefore not planned here**, and it is raised for a decision.
5. **The deploy cadence for M1–M4 needs deciding before M1 lands** (§4). The milestones that fix the live defects come *before* the milestone that makes deploying safe. Recommend M1 and M2 deploy as they land, under `PRODUCTION_RELEASE.md`'s manual, human-authorised checklist — **and that whichever choice is made is written down.**
6. **Legal review should start now, in parallel with Phase 0**, not when Phase 2 begins. It is on the critical path to launch, it takes longer than the engineering, and it costs Phase 0 nothing.

---

*This is the canonical execution plan for TRUST1 Phase 0. It plans the nine approved tasks, creates no governing architecture, no new source of truth, and no second gate — and it implements nothing.*
