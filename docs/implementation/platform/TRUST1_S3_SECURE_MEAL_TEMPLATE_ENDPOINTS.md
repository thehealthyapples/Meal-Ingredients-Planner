# TRUST1-S3 — Secure Meal Template Endpoints — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Milestone:** Phase 0, **M3** — *No write route is reachable unauthenticated*
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md)
**Execution plan:** [`TRUST1_PHASE0_IMPLEMENTATION_PLAN.md`](./TRUST1_PHASE0_IMPLEMENTATION_PLAN.md) § TRUST1-S3
**Risk:** 🟠 AMBER — changes who may call nine live routes. No schema, no data, no dependency.

---

## THE DEFECT

Five write routes on `meal_templates` had **no authorisation check of any kind**. Any anonymous caller on the internet could create, edit, or destroy global platform content. The DELETE handler's entire body was:

```js
await storage.deleteMealTemplate(parseInt(req.params.id));
res.sendStatus(204);
```

This is **R4 (🔴 RED)**. It is remarkable precisely *because* the rest of the codebase is disciplined here — 66 routes use `assertAdmin`, 205 check `req.isAuthenticated()` — which is why it survived: **it is an outlier in a clean pattern, and nothing tested for it.** The guard closes this defect. The audit and its test close the *next* one.

---

## ⚠️ THE TRAP — THE OBVIOUS FIX WOULD HAVE BROKEN A LIVE FEATURE

`meal_templates` is global platform content with **no `userId` column** (`shared/schema.ts:49-80`), and the Phase 0 plan says so. The tidy one-word answer is therefore `assertAdmin` on all five, and the task brief authorised exactly that — *"unless repository evidence proves otherwise."*

**Repository evidence proved otherwise, for two of the five.**

`client/src/pages/products-page.tsx:894,897` — the Analyser's **"Link to template"** button — calls `POST /api/meal-templates` and `POST /api/meal-templates/:id/products` as a **signed-in household**, from `/products` and `/analyser`. Both are registered as `ProtectedRoute` (`client/src/App.tsx:213-214`): **authenticated, not admin.**

`assertAdmin` on those two routes is a `403` and a *"Couldn't create template"* toast for **every non-admin household on the platform**. And there is no compensating admin surface: `client/src/pages/` contains **no meal-template management page at all**. The household surface is the *only* write caller these routes have — which means the Phase 0 plan's own verification step 3 (*"existing admin template management is unbroken"*) refers to a UI that **does not exist**.

The premise of the task was partly wrong, so it was **escalated rather than assumed**, and the approved guard is split:

| Route | Guard | Why |
|---|---|---|
| `POST /api/meal-templates` | **authenticated** | the Analyser creates, as a household |
| `PATCH /api/meal-templates/:id` | **`assertAdmin`** | mutates shared platform content; zero client callers |
| `DELETE /api/meal-templates/:id` | **`assertAdmin`** | destroys shared platform content; zero client callers |
| `POST /api/meal-templates/:id/products` | **authenticated** | the Analyser links, as a household |
| `DELETE /api/meal-template-products/:id` | **`assertAdmin`** | destroys shared platform content; zero client callers |

**All five are closed to anonymous callers, which is the whole of R4.** Over-guarding is the identifiable regression risk named in the plan (§5.2), and it was the one this task came closest to shipping.

> **Open product question, raised and NOT silently decided.** A signed-in household can still create a *global* template that every other household sees via the public `GET /api/meal-templates`. That is pre-existing, live, shipped behaviour that the Analyser depends on. Whether households *should* author global platform content is a **product decision**, not a security one. It is recorded in § Scope Lock as a suggestion requiring approval. S3 closed the anonymous hole; it did not quietly redesign the content model.

---

## RECORDED DECISION — `POST /api/meal-templates/:id/resolve`

The plan required this to be **decided and recorded, never assumed**. It was decided **twice**, because the first justification was disproven by evidence found later in the same task.

**First conclusion (A — keep deliberately public): WITHDRAWN.** It rested on *"returns no user-owned data to an anonymous caller."* **That is false.**

`resolveTemplate` returns `meal: best.meal` (`server/meal-resolution-service.ts:169`) — a full `Meal` row obtained from `storage.getMealsForTemplate` (`server/storage.ts:1000`):

```js
return db.select().from(meals).where(eq(meals.mealTemplateId, mealTemplateId));
```

**No `userId` filter**, while `meals` *has* a `userId` column. So `/resolve` handed an **anonymous** caller another household's meal — name, ingredients, instructions, `userId`.

**Final conclusion: B — REQUIRE AUTHENTICATION.**

- It is a **pure read** — `resolveTemplate` performs zero writes (only `get*` calls, at `:100`, `:105`, `:109`, `:110`). It is a read wearing a POST; the POST carries a body.
- It is guarded anyway, because the *anonymous* disclosure above is real.
- It had **zero client callers**, so requiring authentication costs nothing today.

> **What this does NOT fix, stated plainly.** Authentication closes the **anonymous** disclosure only. **The cross-household leak survives for any signed-in caller**, because the root cause is the missing `userId` filter in `getMealsForTemplate` — not the route's guard. The same root cause leaks through `GET /api/meal-templates/:id` (§ Route Audit Results, C1). **S3 does not fix it**, it is not in S3's approved scope, and it needs its own task. Calling `/resolve` "secured" would be false.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback identifier** | `rollback/TRUST1-S3-secure-meal-template-endpoints-20260711` → `39bc54bd7b5429a04eb9a39016131f213d039508` |
| Predecessor milestone | `39bc54b` — TRUST1-S2 (Secure production cookies, M1b) |
| Working tree at tag time | **Intentionally dirty** — the same eleven pre-existing `PDA1`/`PKR` entries present since `TRUST1` was written. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 **the tag does not protect any of it**, and this task did not touch, stage, or commit one byte of it. |
| Rollback command | `git revert <S3 commit>` |
| Full rollback | `git checkout rollback/TRUST1-S3-secure-meal-template-endpoints-20260711` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — parent programme
- [x] `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` — § TRUST1-S3, § M3
- [x] `docs/implementation/platform/TRUST1_S2_SECURE_PRODUCTION_COOKIES.md` — predecessor milestone

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity created, altered, or keyed. Nine route registrations gain a guard.

☑ One owner per fact
  server/lib/access.ts REMAINS THE SOLE AUTHORITY on identity and role (PKR25).
  It was READ, NOT MODIFIED — not one byte. S3 APPLIES its existing `assertAdmin`
  and writes no second guard. For "authenticated", the codebase's canonical idiom
  is the inline `if (!req.isAuthenticated()) return res.sendStatus(401);` used at
  205 existing sites; S3 uses that, and introduces NO new helper, per the brief.

☑ No duplicate entities
  None created.

☑ No duplicate ownership
  No new authorisation mechanism exists after this change. There were two idioms
  before it (assertAdmin middleware; inline isAuthenticated) and there are two
  after it. S3 adds no third.

☑ No duplicate state
  No state.

☑ Extends existing architecture
  Every guard applied is one that already existed and is already used dozens of
  times in this exact file.

☑ Progressive enrichment where appropriate
  N/A — not a knowledge entity.

☑ Knowledge domain compliance
  Introduces no knowledge domain. It APPLIES Rule KC8 (declared vs enforced):
  every claim below is verified against a RUNNING server, never against source.
  Rule KC12 (a declined discovery is recorded) is why the /resolve decision, the
  four extra unguarded writes, and the two leaking GETs are written down here
  rather than silently fixed or silently dropped.

☑ Honest gaps over fabricated information
  The /resolve justification was DISPROVEN mid-task and is recorded as withdrawn
  rather than quietly rewritten. The residual authenticated-caller leak is stated.
  Six defects this task FOUND and did NOT fix are named with file:line.

☑ No permanent synchronisation bridge
  None.

☑ Evolution over replacement
  Nothing replaced. Nine handlers gain a guard; no handler body was restructured.
```

### AI Architecture Compliance

**Not applicable, and confirmed rather than assumed.** S3 touches no Intelligence code path. The Templates capability binding (`server/intelligence/handlers/templates-read-handler.ts`) is **read-only** — it exposes scopes `meal-templates` / `meal-template` and performs no write — so no capability, intent, or binding is affected by guarding a *write* route. `test:intelligence-templates-binding` passes unchanged, and `server/intelligence/README.md:187` continues to describe `meal_templates` reads as public, which they remain.

---

## IMPLEMENTATION

### Files changed — 3

| File | Change |
|---|---|
| `server/routes.ts` | Nine route registrations guarded (+35 / −11) |
| `server/tests/test-trust1-s3-secure-meal-template-endpoints.ts` | **New** — 39 assertions |
| `package.json` | Registered the suite; wired into `npm test` |

**`server/lib/access.ts` was NOT modified.** Neither was any client file, any schema, or any migration.

### The change — the five in scope

```js
app.post("/api/meal-templates", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);          // the Analyser creates
app.patch("/api/meal-templates/:id", assertAdmin, async (req, res) => {
app.delete("/api/meal-templates/:id", assertAdmin, async (req, res) => {
app.post("/api/meal-templates/:id/products", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);          // the Analyser links
app.delete("/api/meal-template-products/:id", assertAdmin, async (req, res) => {
```

### The recorded decision

```js
app.post("/api/meal-templates/:id/resolve", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);          // decision B
  …
  const userId = req.user!.id;   // was: req.isAuthenticated() ? req.user!.id : undefined
```

### The three no-op middlewares — the audit's most alarming find

The route audit found three `/api/admin/*` jobs whose **middleware slot held a no-op pass-through where a guard belongs**:

```js
app.post('/api/admin/backfill-classifications',      (req, res, next) => next(), async (req, res) => {
app.post('/api/admin/normalise-categories',          (req, res, next) => next(), async (req, res) => {
app.post('/api/admin/backfill-ambiguous-categories', (req, res, next) => next(), async (req, res) => {
```

All three are anonymous, all three `db.update(shoppingList)` across **every user's rows**, and `dryRun` defaults to **`false`**. `req.user?.id ?? 0` in each body proves no authentication was ever assumed. This reads like a guard was removed and never restored. **Guarding these was explicitly approved as a widening of S3's scope** and is the only work in this commit outside the original five.

Each is now `assertAdmin`, and a test asserts no no-op pass-through survives anywhere in `server/`.

### A typing consequence, handled with the existing idiom

Adding a middleware argument changes Express's overload resolution, widening `req.params` to `ParamsDictionary | ParamsArray` — so `parseInt(req.params.id)` stopped typechecking at the three newly-`assertAdmin`-guarded routes. This is a **known quirk the codebase already handles** at every other `assertAdmin` route with an `:id` (`routes.ts:7150`, `:7172`, `:7430`). S3 follows that existing idiom — `parseInt(String(req.params.id), 10)` — rather than modify `access.ts`'s signature, which would have altered the single canonical authority to satisfy a call site.

---

## TESTS ADDED

**`server/tests/test-trust1-s3-secure-meal-template-endpoints.ts` — 39 assertions, two levels.**

### Level 1 — Static guard audit (the structural control)

Parses **all 322 route registrations** across `routes.ts` and `auth.ts` and classifies each as ADMIN / AUTHENTICATED / UNGUARDED. Every **write** route must be guarded, on an **explicit justified public allowlist**, or on a **recorded deferred-defect register**. Anything else fails the build.

The allowlist is the deliverable's real value: **it converts every public write from an oversight into a decision.**

**Proven by mutation, not claimed.** A test that has never failed is a hope, not a control. Four canaries are injected and the audit is required to catch each:

1. a **new unguarded write route** → detected UNGUARDED, on no allowlist → **fails the audit** *(this is the control the plan required)*
2. an **optional session read** (`req.isAuthenticated() ? … : undefined`) → **not** mistaken for a guard — *this is exactly what `/resolve` did*
3. a **short unguarded handler followed by a guarded one** → does not inherit its neighbour's guard
4. …while the genuinely-guarded neighbour is still read correctly

> **Canary 3 exists because this audit shipped that exact bug for one run.** A fixed-size body window ran off the end of `POST /api/logout` (a four-line handler) into `GET /api/user`'s `if (!req.isAuthenticated())`, and **classified logout as guarded on the strength of a guard belonging to a different route.** A false *"guarded"* is the one error class that is worse than no audit at all, because a route reported as protected is a route nobody looks at again. The body is now bounded by the handler's own closing brace. The bug was found by reconciling the arithmetic — 10 allowlist entries against 10 unguarded writes left one entry unaccounted for — not by the test going red.

A further assertion forbids **dead allowlist entries**: every entry must name a route that is genuinely unguarded *today*, so the list can never pre-authorise a route that later loses its guard.

### Level 2 — Over the wire, against the real production server

Spawns **`server/index.ts`** — the actual entry point Render runs, exactly as TRUST1-S1's test does — and drives real HTTP against it: anonymous, non-admin household, and admin. A guard observed as a 403 on the wire is a fact; a middleware name read from source is a claim.

---

## VALIDATION PERFORMED

| Check | Result |
|---|---|
| `npm run test:trust1-s3-secure-meal-template-endpoints` | **39 passed, 0 failed** |
| `npm run test:trust1-s1-session-secret` | **17 passed, 0 failed** |
| `npm run test:trust1-s8-p8-no-secret-disclosure` | **39 passed, 0 failed** |
| `npm run test:trust1-s2-secure-production-cookies` | **54 passed, 0 failed** |
| **`npm test` (full suite)** | **exit 0 — 63 suites, zero failures** (62 before + S3) |
| `npm run typecheck` | **175 errors — exact parity with the S2 baseline.** Every file S3 touched is clean |

**The typecheck baseline was breached and repaired, not waved through.** The first implementation produced **178** errors — three new ones, all from the Express overload widening described above. Parity was restored to exactly 175 before commit. A "baseline comparison" that tolerates drift is not a comparison.

### Three failures were hit during validation. None was ignored.

1. **TRUST1-S1's test went red — and it was right.** Its scanner forbids *any* `SESSION_SECRET` fallback anywhere in the executable tree, **exempting nothing, not even prose**. The new test had `process.env.SESSION_SECRET || randomBytes(…)` for its child server. That is precisely the fail-closed defect S1 abolished. **The control was not weakened and the file was not exempted** — the secret is now generated unconditionally. S1 then caught the *comment* that quoted the pattern, and was right a second time.

2. **TRUST1-S2's test crashed — and it was not S3's fault, and it was not a flake either.** `server/auth.ts` (all S2 tests) was never touched by S3. The cause was **102 orphaned processes consuming 5.7 GB**: S2's test spawns `npx tsx …` and `SIGKILL`s only the **`npx` wrapper**, orphaning the real `node` grandchild (`npx → sh -c → node → node`). Fresh spawns then died of OOM with a bare `Aborted` that reads exactly like a code regression. S2 passes 54/54 on a clean machine. **S2's leak is a pre-existing defect and is recorded below, not fixed here.** S3's own test kills the whole **process group** and leaks nothing — verified at zero.

3. **The full suite failed on a socket error that turned out to be a real architectural defect.** See below. It would have been trivial to retry past it.

---

## ROUTE AUDIT RESULTS

**All 322 route registrations audited** across `server/routes.ts` (308) and `server/auth.ts` (14). *(The plan cites 237; the true figure, by paren-matched extraction rather than `grep`, is 322. No other file registers routes — there are no `express.Router()` instances in `server/`.)*

| Class | Count |
|---|---|
| Total registrations | **322** (GET 142 · POST 115 · PATCH 26 · DELETE 27 · PUT 12) |
| Write routes | **180** |
| → guarded ADMIN | **43** |
| → guarded AUTHENTICATED | **126** |
| → deliberately public, justified | **10** |
| → **known unguarded, deferred** | **1** |

A **fourth guard idiom** exists that a naive audit would have reported as a vulnerability: `if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);` (7 routes). They are correctly guarded. Also confirmed: **`app.use("/api", …)` at `auth.ts:173` is NOT a global auth guard** — it calls `next()` when unauthenticated. **Nothing is protected by default.**

### The justified public-write allowlist (10)

| Route | Justification |
|---|---|
| `POST /api/knowledge/ingredient-lookup` | Pure compute over **global** reference knowledge. **No DB write.** POST carries a batch body (capped 200) that will not fit in a query string. Its GET siblings are public. |
| `POST /api/uplift/batch` | Deterministic nutrition compute. **No DB write.** Capped at 200. Reads the session only to filter by household restrictions; returns generic output without one. |
| `POST /api/benchmark-impersonation/stop` | Mutates **only the caller's own session**. Self-limiting: no-ops unless the session already carries impersonation state, which only an admin-guarded route can set. |
| `POST /api/register`, `/api/login`, `/api/logout`, `/api/resend-verification`, `/api/forgot-password`, `/api/reset-password`, `/api/demo/start` | **The authentication surface itself.** A caller with no session is exactly who these exist to serve. Their protection is **rate limiting (`TRUST1-S5`)**, not authorisation — and S5 is a separate Phase 0 task, still open. |

### 🔴 Additional defects FOUND — and, per instruction, NOT FIXED

Four extra unguarded writes and two leaking reads were found. **Three were approved for fixing in this commit** (the `/api/admin/*` no-ops). **The rest are recorded and deliberately untouched.**

| # | Defect | Severity | Status |
|---|---|---|---|
| **1** | `POST /api/meals/:id/link-template` (`routes.ts:5192`) — **anonymous cross-user IDOR.** Fetches a meal by integer id with **no ownership check**, then `storage.updateMealTemplateId` / `updateMealSourceType`, both filtering on `meals.id` alone (`storage.ts:1004`) while `meals` **has** a `userId`. **Any anonymous caller can mutate any household's meal by guessing a sequential id.** Also calls `createMealTemplate` when `templateId` is omitted, letting an anonymous caller write global content. | 🔴 **RED** | **NOT FIXED.** Needs an *ownership check*, not a guard — a change to who may mutate a meal. Outside S3's scope. On the test's deferred register, so the audit stays honest and still fails on anything new. |
| **2** | `GET /api/meal-templates/:id` (`routes.ts:5072`) — returns `implementations: getMealsForTemplate(id)` with **no `userId` filter**. An unauthenticated caller enumerating template ids receives **every household's meals** linked to that template: `userId`, name, ingredients, instructions. | 🔴 **RED** | **NOT FIXED.** Same root cause as the `/resolve` residual. A *read* — S3's approved scope is unauthenticated *writes*. Needs its own task. |
| **3** | `GET /api/plan-templates/:id` (`routes.ts:7224`) — `getTemplateWithItems` selects **by id alone**, ignoring `ownerUserId` **and** `visibility` (which defaults to `"private"`). Private household meal plans are readable unauthenticated. Severity moderated by `gen_random_uuid()` ids (unguessable). | 🟠 AMBER | **NOT FIXED.** Access-control field bypassed entirely. Needs its own task. |
| **4** | **Importing `server/routes.ts` boots the entire web server.** `server/lib/seed-ready-meals.ts:5`, `seed-food-knowledge.ts:3` and `openfoodfacts-importer.ts:4` each `import { log } from "../index"`, and `server/index.ts` ends in a top-level IIFE calling `httpServer.listen()`. **Importing any of those three modules — for a logging helper — starts a server, runs migrations, and seeds the database.** | 🟠 AMBER | **NOT FIXED.** Production refactoring, explicitly out of scope. **Found the hard way:** a test fixture that imported `registerRoutes` transitively booted a *second* server which fought it for the port and died of `EADDRINUSE` mid-suite. The fixture was deleted; S3's test now drives the real `server/index.ts`, as S1's does. |
| **5** | **TRUST1-S2's test leaks processes.** It spawns `npx tsx …` and `SIGKILL`s only the wrapper, orphaning the real server (`npx → sh -c → node → node`). Stranded **102 processes / 5.7 GB** during this task, until fresh spawns began dying of OOM. | 🟡 LOW | **NOT FIXED** (test-only, another milestone's file). One-line fix: `detached: true` + `process.kill(-pid)`. S3's own test already does this. |

> **Defects 1–3 are live today.** Fixing them was declined **by instruction**, not by judgement, and they are named here with `file:line` so the next person does not have to rediscover them (Rule KC12). **Defect 1 is arguably more severe than the one S3 was written to fix**, because it mutates *user-owned* rows rather than shared content.

---

## MANUAL VERIFICATION STEPS

Executed **2026-07-11** against a **real `server/index.ts`** on `127.0.0.1:41777` (`NODE_ENV=development`), with a purpose-created disposable template (id `1293`) and two purpose-created users. All test data was destroyed afterwards; a `git status` check confirms nothing was left behind.

### Step 1 & 2 — Anonymous writes (expected: rejected)

| Request | Result |
|---|---|
| `POST /api/meal-templates` | **401** |
| `PATCH /api/meal-templates/1293` | **403** |
| `DELETE /api/meal-templates/1293` | **403** |
| `POST /api/meal-templates/1293/products` | **401** |
| `DELETE /api/meal-template-products/1` | **403** |
| `POST /api/meal-templates/1293/resolve` | **401** |

**And the template survived:** direct database read → `SURVIVED — name="TRUST1-S3 MANUAL VERIFICATION TARGET"`. Unchanged, undeleted. **Before S3, the DELETE returned 204 and the row was gone.**

### Step 3 — Admin (expected: succeed)

| Request | Result |
|---|---|
| `PATCH /api/meal-templates/1293` | **200** |
| `POST /api/meal-templates` | **201** |
| `POST /api/meal-templates/1293/resolve` | **200** |
| `DELETE /api/meal-templates/1293` | **204** |

### Step 3b — Signed-in household, non-admin (the Analyser path that `assertAdmin` would have broken)

| Request | Result |
|---|---|
| `POST /api/meal-templates` *(Analyser create)* | **201** ✅ still works |
| `POST /api/meal-templates/1295/products` *(Analyser link)* | **201** ✅ still works |
| `DELETE /api/meal-templates/1293` | **403** ✅ correctly refused |

### Step 4 — Public reads (expected: unchanged)

`GET /api/meal-templates` → **200** · `GET /api/meal-templates/1293` → **200** · `GET /api/meal-templates/1293/products` → **200**

### Step 5 — The `/resolve` decision matches the recorded intent

Recorded decision is **B (require authentication)**. Observed: anonymous → **401**; admin → **200**. Matches. The residual authenticated-caller leak is stated above and is **not** claimed as fixed.

---

## USER ACCEPTANCE EVIDENCE

- **The exploit is closed, observed on the wire.** An anonymous `DELETE` against a real template returned **403** and **the template still exists**. That is the R4 exploit, attempted and refused against a running server — not a flag read out of source.
- **The live feature the obvious fix would have broken still works.** A signed-in non-admin household created a template (**201**) and linked a product (**201**) — the Analyser's "Link to template" path, end to end.
- **Admin management is unbroken**: create, update, resolve, delete all succeed.
- **Public reads are unchanged**: three `200`s. Over-guarding was the named regression risk; it did not happen.
- **63/63 suites green, typecheck at exact baseline parity.**
- **A new unguarded write route now fails the build** — proven by injecting one, not asserted.

---

## DEFINITION OF DONE

| Criterion (from the Phase 0 plan, § TRUST1-S3) | Status |
|---|---|
| All five unguarded `meal_templates` write routes are guarded | ✅ Verified anonymously against a running server |
| A recorded decision on `:5157` (`/resolve`) | ✅ **Decision B — require authentication.** First justification withdrawn as disproven; the residual leak is stated, not hidden |
| All `/api` routes audited; every public route on a justified allowlist | ✅ **322** routes (not 237); 10 justified-public writes; 1 deferred defect |
| A test fails on the introduction of a new unguarded write route | ✅ **Proven by mutation**, plus three further canaries |
| `npm test` passes | ✅ **exit 0, 63 suites** |
| Admin template management unbroken | ✅ Verified — *and the non-admin household path too, which the plan did not anticipate* |

### The gaps, stated plainly

1. **Not verified against production.** Nothing is deployed. Every result above is from a real server on `127.0.0.1`. **A control is not "done" until it is observed on the deployed system** (Phase 0 exit criterion 14). Item 6 of the § 6 production checklist remains **outstanding by design**.
2. **The cross-household meal leak is live** — via `/resolve` for authenticated callers, and via `GET /api/meal-templates/:id` for **anonymous** ones. S3 was not permitted to fix either.
3. **`POST /api/meals/:id/link-template` remains an anonymous cross-user IDOR** (🔴).
4. **R13 stands.** This is one route-guard suite. `TRUST1-S9`'s full authorisation suite over all 322 routes is **Phase 4**. The audit is a snapshot; the *test* is what makes it durable.

---

## DATA IMPACT

- **Reads existing data:** NO *(no new read path)*
- **Writes new data:** NO
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO
- **Schema / migration:** **NONE**

No schema, column, table, or row was altered. Test data created during verification (3 templates, 2 users) was **deleted**; the working tree and database are clean.

**Behavioural change to `meal_templates` writes:** anonymous callers can no longer create, edit, or destroy them. **This is the point.** Any external integration relying on anonymous writes would break — none exists; the audit found the Analyser to be the only write caller.

---

## TRUST CHECK

**Could this mislead the user?**
A household hitting a newly-guarded route sees a `401`/`403` rather than a silent success. The only household-reachable routes (the two Analyser POSTs) are **deliberately left working** for exactly that reason. No user-facing copy changed, so the Experience/UI checklists are not triggered.

**Could this fabricate certainty?**
The strongest guard is applied at the task's weakest point. The `/resolve` decision was **reversed mid-task** when its justification was disproven — and the withdrawal is recorded rather than the record being quietly rewritten. Authentication on `/resolve` is stated as closing the *anonymous* disclosure **only**; the authenticated-caller leak is named, its root cause is named, and it is **not** claimed as fixed. The audit's own false-"guarded" bug is disclosed rather than buried.

**Is anything guessed but shown as real?**
No. The route count is **322**, corrected from the plan's 237, by extraction rather than `grep`. Six additional defects are recorded with `file:line`; three were fixed **only because fixing them was explicitly approved**. Nothing is claimed verified against production, because nothing is deployed.

**What happens if the system is wrong?**
The identifiable regression is **over-guarding** — and it was live: `assertAdmin` on all five would have 403'd the Analyser for every non-admin household. It was caught by reading the client, escalated, and avoided; a test now pins the *guard type*, not merely its presence, so a future "tidy-up" to `assertAdmin` on all five **fails the build**.

- **No architectural duplication introduced:** YES
- **No new source of truth created:** YES — `server/lib/access.ts` untouched
- **Runtime behaviour altered:** YES — nine routes now refuse anonymous callers. Deliberate; it is the task.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/TRUST1-S3-secure-meal-template-endpoints-20260711` → `39bc54b` |
| **Files modified** | `server/routes.ts`, `package.json` |
| **Files created** | `server/tests/test-trust1-s3-secure-meal-template-endpoints.ts`, this document |
| **Rollback command** | `git revert <S3 commit>` |
| **Full rollback** | `git checkout rollback/TRUST1-S3-secure-meal-template-endpoints-20260711` |
| **Data to unwind** | **None.** No schema, no migration, no data. |

**Risk of rollback: reverting is a decision to re-open R4** — to make global platform content anonymously destroyable again, and to re-open three `/api/admin/*` jobs that rewrite every user's shopping list. It should be recorded as such.

**Risk of the change:** over-guarding. Mitigated by the audit preceding the guard, by guard-*type* assertions, and by end-to-end verification of the admin **and** household paths.

---

## SCOPE LOCK

**Implemented scope**
- The five `meal_templates` write routes guarded (three `assertAdmin`, two authenticated).
- `POST /api/meal-templates/:id/resolve` — **decision B**, authentication required.
- **Approved widening:** the three `/api/admin/*` backfill jobs whose middleware slot held a no-op pass-through, now `assertAdmin`.
- The full **322-route audit**, with a justified public-write allowlist and a recorded deferred-defect register.
- One test suite (39 assertions), wired into `npm test`.

**Explicitly excluded — and NOT done**
- `TRUST1-S5`, `S10`, `V3`, `O7` — untouched.
- **`POST /api/meals/:id/link-template` (anonymous cross-user IDOR, 🔴)** — found, recorded, **not fixed**.
- **`GET /api/meal-templates/:id` and `GET /api/plan-templates/:id`** (unguarded reads leaking user data) — found, recorded, **not fixed**.
- **The missing `userId` filter in `getMealsForTemplate`** — the root cause of the `/resolve` residual — **not fixed**.
- Route refactoring, admin UI changes, schema or data changes, client changes — **none**.
- `server/lib/access.ts` — **read, not modified**.

**SUGGESTIONS — observed in scope, not implemented, requiring approval**

1. **`POST /api/meals/:id/link-template` needs an ownership check — 🔴 and arguably more severe than R4**, because it mutates *user-owned* rows, not shared content. Recommend its own task, urgently.
2. **`getMealsForTemplate` needs a `userId` filter.** One missing `where` clause leaks household meals through **two** routes. Fixing it closes the `/resolve` residual **and** the `GET /api/meal-templates/:id` leak at once.
3. **`GET /api/plan-templates/:id` must honour `visibility`.** The column exists, defaults to `private`, and is ignored.
4. **Decide whether households may author global platform content.** They can today, via the Analyser, and S3 deliberately preserved it. If the answer is no, the *client* needs changing too — not just the route.
5. **`server/index.ts` should not boot on import.** Extract `log` out of the entry point so importing a seed helper does not start a web server, run migrations, and seed a database.
6. **Fix TRUST1-S2's test process leak** (`detached: true` + process-group kill). It is one line and it currently makes the suite fragile for any test that spawns a server after it.

---

## OUTCOME

**R4 (🔴 RED) is closed in code**, and the audit that stops the *next* R4 is now a build gate rather than a document. Nine routes that any anonymous caller on the internet could reach are shut — five that could destroy or poison global platform content, three that could rewrite **every user's shopping list**, and one that handed strangers another household's dinner.

The task's real content was not the guard. It was discovering that **the obvious fix was wrong** — that the "global platform content, therefore admin" reasoning, which the parent plan and the brief both endorsed, would have 403'd a live household feature that no admin UI exists to replace. That was caught by reading the client rather than the schema.

**Six further defects were found and, by instruction, left standing.** Three are RED or AMBER and live today. They are written down here, with `file:line`, so the next person does not have to find them again.

---

## NEXT STEPS

**Remaining Phase 0 tasks:** `TRUST1-S5` (authentication rate limiting) → `TRUST1-S10` (CI pipeline foundation, **whose baseline spike should already be running**) → `TRUST1-V3` (pre-deploy gate) → `TRUST1-O7` (deployment hardening).

**Before any of them:** the deploy-cadence decision the plan required *before M1* (§4) is **still unrecorded**. M1, M2 and M3 now sit committed and undeployed, fixing live defects that remain live in production.

---

*TRUST1-S3. Milestone M3. No `meal_templates` write route is reachable by an anonymous caller — verified against a running server, not asserted from source.*
