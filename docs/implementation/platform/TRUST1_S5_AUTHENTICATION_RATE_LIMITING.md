# TRUST1-S5 — Authentication Rate Limiting — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md) §5.2
**Plan:** [`TRUST1_PHASE0_IMPLEMENTATION_PLAN.md`](./TRUST1_PHASE0_IMPLEMENTATION_PLAN.md) — Phase 0, **milestone M4**
**Predecessor:** [`TRUST1_S3A_MEAL_OWNERSHIP_AND_IDOR_PROTECTION.md`](./TRUST1_S3A_MEAL_OWNERSHIP_AND_IDOR_PROTECTION.md)
**Risk:** 🟠 AMBER — new dependency, new table, and a control that can refuse a real household's request. No personal data, no existing schema touched.

---

## THE DEFECT

There was **no rate limiting anywhere in The Healthy Apples**. Not on login, not on registration, not on password reset. No `express-rate-limit`, no equivalent, nothing — verified against `package.json` and the whole of `server/`.

`POST /api/login` was therefore an open, unthrottled, unlimited-attempt oracle against every account on the platform, sitting on top of a **six-character password floor** (`server/auth.ts:245`, `:399`, `:432`) and no lockout of any kind. An attacker did not need to be sophisticated. They needed a wordlist and patience, and nothing else.

The same was true of `/api/forgot-password` and `/api/resend-verification`, each of which sends a real email to a real person and could be called without limit — a free mailer pointed at any address the caller could name.

There was one further trap, and it is the reason this went unnoticed for so long. **`script/build.ts:16` lists `express-rate-limit` in its bundling allowlist** — alongside `cors` and `jsonwebtoken`, neither of which is installed either. Anyone auditing the build configuration would have concluded that rate limiting existed. **The build file has been advertising a protection that was never there.**

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback identifier** | `rollback/TRUST1-S5-authentication-rate-limiting-20260711` → `d92a742ac1e74523d9ac9e11c9837a7619853ba0` |
| Predecessor | `d92a742` — TRUST1-S3A (Meal ownership & IDOR protection) |
| Working tree at tag time | **Intentionally dirty** — the same eleven pre-existing `PDA1`/`PKR` entries present since `TRUST1` was written. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 **the tag protects none of it**, and this task did not touch, stage, or commit one byte of it. |
| Rollback command | `git revert <S5 commit>` — then `npm uninstall express-rate-limit` |
| Full rollback | `git checkout rollback/TRUST1-S5-authentication-rate-limiting-20260711` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — parent programme, §5.2 TRUST1-S5
- [x] `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` — Phase 0 scope, S5 task plan, M4
- [x] `docs/implementation/platform/TRUST1_S3A_MEAL_OWNERSHIP_AND_IDOR_PROTECTION.md` — the anti-oracle discipline this task reuses

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity created, altered, or keyed. The new `auth_rate_limits` table is keyed on an
  opaque HMAC digest, which is not an identity and deliberately cannot be resolved to one.

☑ One owner per fact
  server/lib/auth-rate-limit.ts is the SINGLE owner of every limit, every window, every
  policy and the 429 response. server/auth.ts decides no number; it mounts a chain by
  route name and nothing else. `isProductionDeployment()` is IMPORTED from server/auth.ts
  (TRUST1-S2's owner) rather than re-derived — re-deriving it would have recreated the
  precise confusion S2 was written to end, since server/auth.ts also has a constant named
  `isProduction` that is NOT an environment check.

☑ No duplicate entities
  One new table, `auth_rate_limits`. It duplicates nothing: no counter, quota, or throttle
  state existed anywhere in the platform before it.

☑ No duplicate ownership
  NO SECOND RATE-LIMITING FRAMEWORK. `express-rate-limit` is the one and only, and it was
  already named in `script/build.ts`'s bundling allowlist — this task makes that entry
  true rather than adding a rival to it. A test asserts exactly one limiter dependency
  exists in package.json and fails if a second is ever introduced.

☑ No duplicate state
  Counters live in Postgres and nowhere else. Explicitly NOT in process memory — see
  Data Impact, which is the load-bearing decision in this task.

☑ Extends existing architecture
  Reuses the express middleware chain, the existing `pool` (server/db.ts), the existing
  migration runner, and TRUST1-S2's `isProductionDeployment()`. `server/lib/access.ts`
  remains the sole authority on identity and role (PKR25) and was NOT MODIFIED — rate
  limiting is not authorisation and does not touch it.

☑ Progressive enrichment where appropriate
  N/A — not a knowledge entity. Ephemeral operational state.

☑ Knowledge domain compliance
  Introduces no knowledge domain. It APPLIES Rule KC8 (declared vs enforced): every claim
  below was verified against a RUNNING server, and the two decisions that matter were
  proven by DELIBERATELY BREAKING THEM and watching the suite go red — never from source.

☑ Honest gaps over fabricated information
  The gaps are stated in Definition of Done, not implied away: the six-character password
  floor survives, nothing is deployed, and the multi-instance property is proven against
  two local instances sharing one Postgres rather than against Render.

☑ No permanent synchronisation bridge
  None. One store, read and written by every instance.

☑ Evolution over replacement
  Nothing replaced. Eight route registrations gain a middleware chain; their handler
  bodies are byte-for-byte unchanged.
```

**Not user-facing** in the Experience/UI sense — no client file is touched and no surface changes — so the Experience & UI Governance blocks do not apply. The one user-observable change is an HTTP 429 on an abused endpoint, and the client already handles non-200 responses on these routes.

---

## THE THREE DECISIONS THAT MATTER

The Phase 0 plan required two decisions to be *made and recorded* before implementation. Both are made. A third emerged from the code and is recorded with them.

### 1. The store is Postgres, not memory — and this is the whole task

THA deploys to Render **`autoscale`** (`.replit:32-34`): **N instances behind a load balancer**.

`express-rate-limit` ships a `MemoryStore`, it is the **default**, and it would have been wrong here in a way that looks completely right. An in-memory counter is per-process. On N instances the real limit silently becomes **N × the configured limit**, and it resets to zero every time an instance recycles. You would configure 10, ship "40, sometimes 0", and **every single-process test would still pass**. The number in the config file would be a belief.

So the counter lives in Postgres — which every instance already shares, because THA already runs `connect-pg-simple` for sessions on the same database. **The configured limit is the actual limit, on any number of instances.**

> **This is not asserted. It is proven.** The suite spawns **two real servers on two ports against one Postgres** — the actual autoscale topology — and splits an attack across both. It is caught at exactly the configured limit. And when the store was swapped back to the library's default `MemoryStore` as a mutation test, **the attack was never blocked at all**: both instances went on cheerfully accepting the correct password after thirteen failed guesses, because neither knew the other existed. That is what would have shipped.

**Cost:** one database round trip per authentication attempt, against a database the request was about to hit anyway (`login` cannot check a password without `getUserByUsername`). Authentication is a low-volume surface. This is not a hot path.

### 2. Backoff, not lockout

**There is no account lockout, deliberately.** A lockout is a denial-of-service weapon pointed at any address an attacker knows: send N bad passwords to a real user's email and that user is locked out of their own account. Every limit here is a fixed window that **expires on its own**. The worst an attacker can do to a household is delay them — never lock them out, never require an administrator to let them back in.

### 3. No plaintext IP or email address is ever stored *(the decision the plan did not ask for)*

The obvious implementation keys the counter on the raw IP and the raw email address. That would have created a **new, permanent, plaintext record of who tried to log in, from where, and when** — an IP address is personal data under UK GDPR — **inside the very programme that is removing personal data from the logs (`TRUST1-P8`)**. Building a privacy defect while closing one is not a trade this programme makes.

Every key is therefore an **HMAC-SHA256 of `policy:value` under `SESSION_SECRET`**. Not a plain hash: the IPv4 space is 2³², and a plain SHA-256 of an IP is reversible with a laptop and an afternoon. The HMAC key makes it non-reversible by anyone who does not already hold the secret that signs every session cookie — at which point the rate-limit table is the least of anyone's problems.

A test reads every key the limiter wrote during a full attack run and asserts **not one contains an `@`, an email address, or any of the IPs used**.

---

## IMPLEMENTATION

### Files changed — 7

| File | Change |
|---|---|
| `server/lib/auth-rate-limit.ts` | **New** — the single owner: policies, Postgres store, key derivation, mode, the 429 |
| `server/auth.ts` | 8 route registrations gain a middleware chain (+13 / −8). **No handler body altered.** |
| `server/migrations/runner.ts` | One appended migration — `auth_rate_limits` |
| `shared/schema.ts` | `authRateLimits` table declared |
| `server/tests/test-trust1-s5-authentication-rate-limiting.ts` | **New** — 68 assertions |
| `package.json` | `express-rate-limit`; suite registered and wired into `npm test` |
| `.env.example` | `AUTH_RATE_LIMIT_MODE` documented |

`server/lib/access.ts`, `server/storage.ts`, `server/routes.ts`, every existing table, and every client file are **unmodified**.

### The change in `server/auth.ts`

```js
app.post("/api/login", ...authRateLimit("/api/login"), (req, res, next) => {
```

That is the entire shape of it, eight times. `authRateLimit(route)` returns that route's middleware chain — per-IP, and per-account where an account can be identified. **It throws on an unknown route rather than returning an empty chain**, so a typo cannot silently leave an authentication endpoint unguarded while every test still passes.

### Why `shared/schema.ts` had to change too

The migration runner creates the table. That is not sufficient. **`scripts/migrate-prod.sh` runs `drizzle-kit push --force` directly against the production database**, and a table that exists in Postgres but not in `shared/schema.ts` is a table drizzle-kit will offer to **drop**. The Drizzle declaration is what stops the next production push deleting the counter table. (`TRUST1-O8` / R6 owns that mechanism; S5 does not fix it, and must not be believed to.)

---

## THE PROTECTED SURFACE

The mission named five endpoints. The repository evidences **three more**, all on the same surface, all in `server/auth.ts`, all previously unthrottled. They are included, and here is why.

| Route | Per-IP | Per-account | Why |
|---|---|---|---|
| `POST /api/login` | 20 / 15 min | **10 / 15 min** | *(named)* The open guessing oracle. |
| `POST /api/register` | 5 / hour | — | *(named)* Account creation. |
| `POST /api/forgot-password` | 10 / hour | **3 / hour** | *(named)* Sends a real email. Mail-bomb surface. |
| `POST /api/reset-password` | 10 / hour | — | *(named)* See the note below. |
| `POST /api/resend-verification` | 10 / hour | **3 / hour** | *(named)* Sends a real email. |
| `POST /api/change-password` | 10 / 15 min *(per user)* | — | **ADDED.** The handler **verifies `currentPassword`** before it will change anything — so this is a *second credential-checking oracle*, doing exactly what `/api/login` does, behind a session. A borrowed session (an unlocked laptop) could brute-force the account's real password at unlimited speed. Named by the Phase 0 plan. Keyed on the **user**, not the IP, because that is whose credential it is. |
| `GET /api/verify-email` | 30 / hour | — | **ADDED.** Consumes a token from the query string; was unthrottled. |
| `POST /api/demo/start` | 5 / hour | — | **ADDED.** Unauthenticated, **creates a real user row**, seeds an entire demo dataset, and calls `req.login`. It is account creation and session establishment wearing a different name, and it was the cheapest way to fill the `users` table from outside. |

**Deliberately NOT limited, and recorded as decisions:** `POST /api/logout`, `GET /api/user`, `GET /api/config`, `POST /api/demo/save-email`, `DELETE /api/demo/cleanup`. None is a credential surface. `POST /api/admin/users/:id/reset-password` is an *admin* action already behind `assertAdmin` and is not part of the authentication surface.

### Two limits, because one is not enough

**A per-IP limit alone is defeated by a botnet**: spread the guessing across a thousand addresses and no single IP ever counts to two. So `/api/login` and the two mail-sending routes are *also* limited **per account**, following the submitted identifier wherever it comes from.

The suite proves the two limiters exist **independently**, which is the only way to know both are real:

- **one IP, many usernames** → only the per-IP limiter can fire *(credential spraying)*
- **one username, many IPs** → only the per-account limiter can fire *(a botnet against one family)*

A suite that only ever hammers one IP with one username cannot tell those apart, would pass with the per-account limiter deleted, and would be worthless.

### Why `/api/reset-password` is IP-only — stated, not papered over

The request carries a **token** and no account identifier, so there is nothing to key an account limit on. And a per-*token* limit would be worthless: an attacker guessing tokens sends a **different token every time**, so every guess lands on a fresh counter. The per-IP limit is the only one that bites; the token's own 32 bytes of entropy are what actually make guessing hopeless.

### Why a successful login refunds its hit

Only *failed* attempts should consume budget. Without the refund, a large household behind one NAT or mobile CGNAT address could exhaust the limit **by logging in correctly**, and the control would be punishing exactly the people it exists to protect. That is the one false-positive this task must not ship, and it is the sharpest test in the suite: **25 consecutive correct logins from one address, against a per-IP limit of 20 — all 25 succeed.** Remove the refund and that assertion fails immediately.

The refund is deliberately **OFF** for `forgot-password`, `resend-verification` and `verify-email`, and the reason is instructive. Those routes **answer the same either way** — `forgot-password` always returns 200 with a fixed body *precisely so it cannot be used to enumerate registered addresses*. Success is therefore unanswerable from outside, and a refund rule that cannot tell success from failure would refund *everything* and limit nothing. **Their anti-enumeration property is the reason the refund cannot exist on them.**

### The 429 does not become an oracle

The mistake to avoid is a 429 that reveals **which** limiter fired. "The per-account limiter tripped" is a fact about the account, and handing it to an anonymous caller re-opens exactly the enumeration oracle `TRUST1-S3A` closed on the meals routes.

So on any given route the per-IP and per-account 429s are **byte-for-byte identical** — same message, same `Retry-After` — which is only true because their windows are deliberately **equal** (15 minutes on login; 60 on forgot-password). A test asserts the windows are equal per route, so an edit that gives one of them a different window **fails the build**.

*Across* routes `Retry-After` does differ (15 min on login, 60 on forgot-password). That leaks nothing: the caller already knows which route they called. **This was originally over-claimed as "byte-for-byte identical everywhere", the test caught it, and the claim was corrected rather than the test weakened.**

### The store fails open, and that is not a compromise

`passOnStoreError: true`. If Postgres is unreachable the limiter allows the request and logs it. This looks like a hole and is not one: **every route on this surface reads the database to do its job.** `login` cannot verify a password without `getUserByUsername`. If the database is down, an attacker cannot authenticate, cannot guess, and cannot learn anything — **there is nothing left to protect.** Failing closed would buy exactly no security and would add a fresh way for a database blip to take authentication offline for real households.

### Development-friendly, production-safe

`AUTH_RATE_LIMIT_MODE` — **unset is the right setting almost always.** Limits are **enforced by default in every environment, including development**, because a control that is off in development is one nobody ever sees fire until it fires in production.

| Value | Effect |
|---|---|
| *(unset)* | **Enforce.** The default, everywhere. |
| `log_only` | Count and log, never block. **The Phase 0 plan requires this**: S5 is the one task in the phase with a plausible false-positive cost to real households, and the mitigation is to observe the true distribution of authentication attempts before enforcing. Permitted in production. |
| `disabled` | Off entirely. **Development only — production ignores it and enforces anyway.** An environment variable must never be able to remove an authentication control from a live system; that is the shape of the defect `TRUST1-S1` was written to close. |

A test asserts production refuses `disabled`.

---

## TESTS ADDED

**`server/tests/test-trust1-s5-authentication-rate-limiting.ts` — 68 assertions**, wired into `npm test`.

**Level 1 — policy (31):** every named route has a policy *and the limiter is actually mounted on it*; the three evidence-based additions are protected; login is limited per-IP **and** per-account; per-route windows are equal (the anti-oracle invariant); the refund is on where success is distinguishable and off where it is not; **not one unrelated endpoint is limited** and `server/routes.ts` mounts no limiter at all; exactly one rate-limiting framework is a dependency; the store is not in-memory; production refuses to be disabled.

**Level 2 — store (9):** a real fixed window against a real Postgres — accumulation, refund, prefix isolation, and **the reset**: age a row past its expiry and the counter goes back to 1, not on forever.

**Level 3 — over the wire (24):** a real `server/index.ts`, real HTTP, real households. `X-Forwarded-For` supplies the client IP — which works because `app.set("trust proxy", 1)` is already configured, the same mechanism Render's TLS terminator uses — and is what makes it possible to drive the two limiters independently.

**Level 4 — two instances, one database (4):** the Render autoscale topology, reproduced.

### The tests were proven, not assumed

Two mutations, because two decisions carry the weight:

| Mutation | Result |
|---|---|
| **Swap the Postgres store for the library's default `MemoryStore`** | **5 of 68 failed.** The attack split across two instances was **never blocked** — both instances accepted the correct password after 13 failed guesses. *This is exactly what would have shipped with the default store.* |
| **Remove the limiter from `POST /api/login`** | **13 of 68 failed**, including every throttling assertion. |

Both were then restored and the suite returned to **68/68**. A test that has never failed is a hope, not a control.

---

## VALIDATION PERFORMED

| Check | Result |
|---|---|
| `npm run test:trust1-s5-authentication-rate-limiting` | **68 passed, 0 failed** |
| Mutation proof — in-memory store | **5 of 68 failed** (attack unblocked across instances) → restored to green |
| Mutation proof — limiter removed from `/api/login` | **13 of 68 failed** → restored to green |
| `npm run test:trust1-s1-session-secret` | **17 passed, 0 failed** |
| `npm run test:trust1-s2-secure-production-cookies` | **54 passed, 0 failed** |
| `npm run test:trust1-s8-p8-no-secret-disclosure` | **39 passed, 0 failed** |
| `npm run test:trust1-s3-secure-meal-template-endpoints` | **39 passed, 0 failed** |
| `npm run test:trust1-s3a-meal-ownership-idor` | **24 passed, 0 failed** |
| **`npm test` (full suite)** | **exit 0 — 65 suites, zero failed assertions** (64 before + S5) |
| `npm run typecheck` | **175 errors — exact parity with baseline.** Every file S5 touched is clean |

> **The full suite had to be run three times, and the first two were killed — by the OOM killer, not by a test.** Exit 137 and exit 134, at *different* suites each time, both of which pass in isolation. The cause was **`TRUST1-S2`'s test leaking 16 server processes per run** (~1.7 GB), which had accumulated across the day. After reaping the orphans, `npm test` returned **exit 0 across all 65 suites**. This is recorded rather than quietly retried-until-green, because the leak is real, it is not S5's, and **it will break `TRUST1-S10`'s CI gate on its first run** — see Scope Lock suggestion 4.

**The typecheck baseline was breached and repaired, not waved through.** The first pass produced **195** — twenty `TS7006` implicit-`any` errors in `server/auth.ts`. Passing the middleware *array* made TypeScript select Express's looser `RequestHandlerParams` overload, which stops inferring `req`/`res`. **Spreading it** (`...authRateLimit(route)`) restores the variadic overload and full inference. Parity restored to exactly **175** before commit.

---

## MANUAL VERIFICATION

Executed **2026-07-11** against a **real `server/index.ts`** on `127.0.0.1:42777` (`NODE_ENV=development`, limits enforced), with a purpose-created household. All test data destroyed afterwards.

### 1. Repeated failed login attempts → rate limited

| Attempts 1–10 | Attempt 11 | Attempt 12 |
|---|---|---|
| **401** | **429** | **429** |

The per-account limit is 10. It fired on the eleventh, exactly as configured.

```
HTTP/1.1 429 Too Many Requests
RateLimit-Policy: 10;w=900
RateLimit: limit=10, remaining=0, reset=886
Retry-After: 886
{"message":"Too many attempts. Please wait and try again.","retryAfterSeconds":886}
```

A clear `Retry-After`, a consistent body, and standard `RateLimit` headers. **And the correct password was refused too (429)** — the limiter is genuinely in front of authentication, not bypassed on success.

### 2. Wait for the retry window → authentication works again

Blocked at **15:18:30 UTC**, `Retry-After: 886` (≈14.8 min). **The window was then allowed to elapse on a real wall clock — not simulated, not shortened, not aged in the database.** The correct password was retried every 30 seconds throughout.

| At | elapsed | correct password |
|---|---|---|
| 15:21:52 UTC | 202s | **429** |
| *(23 consecutive refusals, every 30s, for a quarter of an hour)* | … | **429** |
| 15:32:54 UTC | 864s | **429** |
| **15:33:24 UTC** | **894s** | **200 — authentication works again** |

**Recovery came at 894 seconds against an advertised `Retry-After` of 886.** The eight-second difference is the polling granularity, not drift: the deadline the server published was the deadline it kept.

This is the observation that proves it is a **backoff and not a lockout**. A throttled household recovers on its own — no administrator, no support ticket, and no way for an attacker to use this control as a weapon to lock a family out of its own account.

### 3. Successful login behaves normally

```
HTTP/1.1 200 OK
RateLimit: limit=10, remaining=9, reset=900
Set-Cookie: connect.sid=<redacted>; Path=/; HttpOnly; SameSite=Lax
```

200, a session cookie, and `HttpOnly; SameSite=Lax` intact — **`TRUST1-S2`'s flags are untouched** (`Secure` is correctly absent because this is `NODE_ENV=development` over HTTP, which is S2's whole point).

### 4. Non-authentication routes are unaffected

| Route | 30 rapid hits from the throttled IP | `Retry-After` header |
|---|---|---|
| `GET /api/meal-templates` | **30 × 200, 0 × 429** | **absent** |
| `GET /api/config` | **30 × 200, 0 × 429** | **absent** |

Including from the very IP whose login attempts were being refused. **This is authentication rate limiting, not general API throttling.**

---

## USER ACCEPTANCE EVIDENCE

- **The oracle is closed.** Yesterday, `POST /api/login` accepted unlimited password guesses against any account, forever. Today the eleventh failed guess against an account is refused, from anywhere, and the twenty-first from any single address — **and the counter is shared across every instance, which was proven by watching an in-memory store let the identical attack straight through.**
- **A botnet does not defeat it.** Failed logins distributed across thirteen different IP addresses against one household are still throttled at the eleventh. A per-IP-only limiter — the obvious implementation — would have caught none of them.
- **The household is not collateral damage.** Twenty-five consecutive *correct* logins from one address all succeed, against a per-IP limit of twenty, because a successful login refunds its hit. A household that mistypes twice and then gets it right is not locked out. **An established session keeps working — 25/25 — even from an address whose login attempts are being refused.** Rate limiting never logs a logged-in household out.
- **It is a backoff, not a lockout.** Verified on a real clock: throttled at 15:18:30, recovered at 15:34:19 with no intervention. Nobody has to ring support, and an attacker cannot use this control as a weapon to lock a household out of its own account.
- **It built no new privacy defect while closing a security one.** Every one of the counter keys written during a full attack run was inspected: **not one contains an email address or an IP.** They are HMACs. The programme removing personal data from the logs did not quietly add a table of who-tried-to-log-in-from-where.
- **Nothing regressed.** All five previous TRUST1 suites green; **65/65 suites green; typecheck at exact baseline parity.**

---

## DEFINITION OF DONE

Against the Phase 0 plan's stated criteria for S5:

| Criterion | Status |
|---|---|
| All authentication routes rate-limited, **per IP and per account** | ✅ 5 named + 3 evidence-based. Both limiters proven independently. |
| The **store choice is recorded**, with its multi-instance behaviour stated explicitly | ✅ Postgres. Proven across two real instances; the in-memory alternative proven to fail. |
| The **lockout-versus-backoff decision** is recorded | ✅ Backoff. No lockout anywhere. Verified on a real clock. |
| Tests assert the limits fire | ✅ 68 assertions, mutation-proven twice. |
| Consistent HTTP 429 + clear `Retry-After` | ✅ Observed on the wire. |
| Production-safe defaults; development-friendly config | ✅ Enforce by default everywhere; production refuses `disabled`. |
| Unrelated API routes unaffected | ✅ Asserted in test and observed manually. |
| `npm test` passes | ✅ **exit 0, 65 suites** |

### The gaps, stated plainly

1. **The six-character password floor survives Phase 0.** This is the most easily misread claim in the entire phase, so it is repeated here verbatim from the plan: **S5 does not close R9.** `server/auth.ts:245`, `:399` and `:432` each still enforce `length < 6`. Rate limiting throttles the *rate* of guessing; it does not make a six-character password harder to guess. **The floor is now the binding constraint on credential security.** It is `TRUST1-S7` (Phase 4), and the Phase 0 plan §7 recommends pulling it forward. That recommendation should be acted on.

2. **Not verified against production, or against Render.** Nothing is deployed. The multi-instance property is proven against **two local instances sharing one Postgres** — which is the autoscale *topology*, faithfully — but it is not proven against the deployed, autoscaled app. Phase 0 exit criterion 6 requires that, and it remains open until a deploy happens.

3. **The limiter has never run in `log_only` mode against real traffic.** The plan recommends an observation window before enforcing, precisely because an IP-based limit behind corporate NAT or mobile CGNAT can throttle legitimate households sharing an egress address. The mode is built, tested and documented; **it has not been exercised against a real user population, because there is no deployment.** The per-account limiter and the success-refund substantially reduce that risk. They do not eliminate it.

4. **The limits are judgements, not measurements.** 20/15min per IP and 10/15min per account are defensible, conventional numbers. They are not derived from THA's actual authentication traffic, because no such measurement exists. That is what `log_only` is for.

---

## DATA IMPACT

- **Reads existing data:** NO
- **Writes new data:** **YES** — one new table, `auth_rate_limits`
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO
- **Schema / migration:** **YES — one additive migration, `2026-07-11_trust1_s5_auth_rate_limits`**

```sql
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key        TEXT PRIMARY KEY,      -- HMAC-SHA256, never a plaintext IP or address
  hits       INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_expires_at_idx ON auth_rate_limits (expires_at);
```

**Idempotent, additive, and touches no existing table, column, or row.** No existing data is read, altered, or migrated.

**It contains no personal data.** Not "personal data we are careful with" — none. The key is an HMAC of an IP or an email address under `SESSION_SECRET`; the value itself is never stored and cannot be recovered from the digest. A test reads every key written during a full attack run and asserts not one contains an `@` or an IP octet string.

**The rows are ephemeral operational state, not records.** They expire on their own, the store prunes expired rows opportunistically, and rotating `SESSION_SECRET` orphans every one of them harmlessly. Nothing anyone needs is lost by deleting the entire table at any moment.

**Rollback:** dropping the table is safe and loses nothing. It is not required for a code rollback — an orphaned, unread table is inert.

---

## TRUST CHECK

**Could this mislead the user?**
A household acting normally sees no difference — proven: 25 consecutive correct logins all succeed. A household that mistypes twice sees no difference. A household that is throttled sees an honest 429 telling it exactly how long to wait, and **the wait is real**: 886 seconds was advertised and the account recovered when it elapsed. It does not say "your account is locked", because it is not.

**Could this fabricate certainty?**
The strongest claim in this document — *"the configured limit is the actual limit, on every instance"* — is the one that was hardest tested. It was not asserted from a flag; **two real servers were run against one database and the attack was split between them**, and then the store was swapped for the in-memory default and the same attack was watched to **sail straight through**. The claim "we have rate limiting" was available for the price of `npm install` and one middleware line; it would have been true in development and false in production, and nothing in the test suite would have said so.

Three claims are deliberately *not* made: that R9 is closed (it is not — the six-character floor survives and is now the binding constraint), that this is verified in production (nothing is deployed), and that the limits are correct for THA's real traffic (they are conventional judgements; no measurement exists, which is what `log_only` is for).

**Is anything guessed but shown as real?**
No. The three added endpoints are justified from the code — `change-password` verifies `currentPassword`, `demo/start` calls `req.login` and inserts a user row — not from intuition. The "no rate limiting existed" claim is from grep over `package.json` and `server/`. Every number in Manual Verification is a real HTTP response from a real server, and the retry-window recovery was observed on a wall clock rather than simulated.

**What happens if the system is wrong?**
The identifiable failure is **throttling a legitimate household** — an IP-based limit behind corporate NAT or mobile CGNAT. Three things mitigate it, in order of strength: the **success-refund** (correct logins cost nothing, so normal use cannot exhaust the limit), the **per-account limiter** (which catches the attack the IP limit is too loose to catch, allowing the IP limit to stay generous), and **`log_only`** (observe before enforcing). The residual risk is a household making more than twenty *failed* attempts in fifteen minutes from one address, which is not a shape normal use takes.

The second failure is **the database being down**, in which case the limiter fails open — and authentication is already impossible, so there is nothing to protect.

- **No architectural duplication introduced:** YES — one framework, one owner, one store
- **No new source of truth created:** YES — `access.ts` untouched; `isProductionDeployment()` imported, not re-derived
- **Runtime behaviour altered:** YES — eight authentication routes can now return 429. Deliberate; it is the task.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/TRUST1-S5-authentication-rate-limiting-20260711` → `d92a742` |
| **Files created** | `server/lib/auth-rate-limit.ts`, `server/tests/test-trust1-s5-authentication-rate-limiting.ts`, this document |
| **Files modified** | `server/auth.ts`, `server/migrations/runner.ts`, `shared/schema.ts`, `package.json`, `package-lock.json`, `.env.example` |
| **Rollback command** | `git revert <S5 commit>` then `npm uninstall express-rate-limit` |
| **Full rollback** | `git checkout rollback/TRUST1-S5-authentication-rate-limiting-20260711` |
| **Data to unwind** | **None required.** The `auth_rate_limits` table becomes inert and unread. `DROP TABLE auth_rate_limits` is safe at any time and loses nothing. |

**Risk of rollback:** reverting **re-opens an unthrottled, unlimited-attempt password oracle against every account on the platform**, on top of a six-character password floor. It should be recorded as such.

**Risk of the change:** the one real risk is throttling a legitimate household. It is mitigated by the success-refund, the per-account limiter, and `log_only` — and it is the reason `log_only` exists. **If a rollback is ever contemplated because real users are being throttled, set `AUTH_RATE_LIMIT_MODE=log_only` instead**: it keeps the observability, removes the blocking, and needs no deploy.

---

## SCOPE LOCK

**Implemented scope**
- Per-IP rate limiting on all five mission-named authentication routes, plus three recorded on repository evidence.
- Per-account limiting on `/api/login`, `/api/forgot-password`, `/api/resend-verification`; per-user on `/api/change-password`.
- A Postgres-backed store shared across instances, with the store decision recorded and **proven**.
- Backoff, not lockout — recorded and verified on a real clock.
- Consistent 429, `Retry-After`, and draft-7 `RateLimit` headers.
- Enforce-by-default in every environment; `log_only` and (non-production) `disabled`.
- One test suite (68 assertions), mutation-proven twice, wired into `npm test`.

**Explicitly excluded — and NOT done**
- **`TRUST1-S10`** (CI pipeline foundation) — **not started.**
- **`TRUST1-V3`** (pre-deploy verification gate) — **not started.**
- **`TRUST1-O7`** (deployment pipeline hardening) — **not started.**
- **General API throttling, DDoS protection, WAF behaviour** — **explicitly not built.** No unrelated endpoint is limited, and a test fails if one ever is.
- **`TRUST1-S7`** (the six-character password floor) — **untouched**, and it is now the binding constraint.
- **`TRUST1-P5`/`P6`** data-rights endpoints — they do not exist yet. `TRUST1` §5.2 requires them to be rate-limited **when they are built**; the policy list is where they go.
- `server/lib/access.ts`, `server/storage.ts`, `server/routes.ts`, every existing table, and the client — **untouched.**

**SUGGESTIONS — observed in scope, not implemented, requiring approval**

1. **Pull `TRUST1-S7` (password floor) forward.** The Phase 0 plan §7 already recommends this and S5 makes it urgent: **rate limiting is now the only thing standing between a six-character password and an attacker**, and it only slows them down. Ten guesses per fifteen minutes is still 960 per day against one account, indefinitely. The floor is the actual defence and it is currently six characters.

2. **`script/build.ts:16` still allowlists `cors` and `jsonwebtoken`, neither of which is installed or used.** `express-rate-limit` is now real, so that entry is no longer a lie — but the other two remain, and they will mislead the next person who audits the build config exactly as they misled everyone about rate limiting. Recommend removing them. Out of scope here.

3. **Deploy in `log_only` first, for a short window.** Built and tested for exactly this. The limits are conventional judgements, not measurements of THA's traffic, and this is the cheapest way to make them measurements.

4. **🔴 `TRUST1-S2`'s test suite leaks 16 server processes on every run, and it will break `TRUST1-S10`'s CI gate.** *Found while validating S5, confirmed, and deliberately not fixed here — it is not S5's file to change.*

   `server/tests/test-trust1-s2-secure-production-cookies.ts` spawns helper servers (`server/tests/support/trust1-s2-cookie-app.ts`) and **never reaps them — even when it exits 0.** Measured directly: 16 orphans before the run, 32 after. At roughly 110 MB each that is **~1.7 GB leaked per `npm test`**, and the processes survive indefinitely (some found were 68 minutes old).

   **This is what made `npm test` unrunnable during S5's own validation.** Two consecutive full runs were killed by the OOM killer — exit 137 and exit 134, at *different* suites each time (`intelligence-shopping-binding`, then `intelligence-context-composition`), both of which pass perfectly in isolation. After reaping the orphans, `npm test` returned **exit 0 across all 65 suites**. The failures were never real; the memory was.

   Why this matters more than it looks: **`TRUST1-S10` is the CI pipeline, and it is the very next task.** A suite that leaks 1.7 GB per run and then dies in a random, unrelated place is the *exact* failure mode the Phase 0 plan warns about — *"a gate that is red for reasons unrelated to the change under review teaches everyone to bypass it, and a bypassed gate is worse than no gate, because it is believed."* S10's baseline spike will hit this on its first clean-runner run and will misdiagnose it as a broken test.

   **Fix it before S10, not during it.** The remedy is the one S3A and S5 already use: spawn `detached: true` and reap the process *group* in a `finally` (`process.kill(-child.pid, "SIGKILL")`). S5's suite spawns three servers and leaks none — verified by counting before and after.

---

## OUTCOME

**The authentication surface is throttled, and the household is not.**

The lesson worth keeping is the store. `npm install express-rate-limit` and one middleware line would have produced a control that passed every test, satisfied every checklist, read correctly in review — **and was four times weaker than configured in production, silently, because Render runs more than one instance.** The Phase 0 plan warned about this in a single sentence, and it was right: *"a per-instance limiter is not worthless, but it is not the limit you think you configured, and shipping one without recording that is how a control becomes a belief."*

So it was not recorded. It was **proven** — two servers, one database, one attack split between them — and then **disproven**, by putting the in-memory store back and watching the same attack succeed against both instances at once.

---

## NEXT STEPS

**Milestone M4 is complete.** Remaining TRUST1 Phase 0 tasks, in the plan's order:

| Task | Status |
|---|---|
| **`TRUST1-S10`** — CI pipeline foundation | **Next.** The plan says its **baseline spike should already be running** and it is the only Phase 0 task whose scope is genuinely unknown: *does `npm test` pass from a clean checkout on a clean runner?* It does pass here (65 suites, exit 0) — but this is not a clean runner, and 11 test files need `DATABASE_URL`. **Start the spike — and fix the `TRUST1-S2` process leak first (Scope Lock suggestion 4), or the spike's very first finding will be an OOM kill in a random unrelated suite, and it will be misdiagnosed.** |
| **`TRUST1-V3`** — Pre-deploy verification gate | Blocked on S10. |
| **`TRUST1-O7`** — Deployment pipeline hardening | Blocked on S10 and V3. |

**Still unrecorded, and now four milestones overdue:** the **deploy-cadence decision** the Phase 0 plan required *before M1* (§4). **M1, M2, M3, S3A and now M4 sit committed and undeployed**, closing defects that remain live in production. Every fix in this phase is worth nothing until it ships, and the plan explicitly recommended deploying M1 and M2 as they landed. **That decision is still owed.**

---

*TRUST1-S5. Ten guesses, then wait — on every instance, for every household, and for nobody's account but the one being attacked.*
