# TRUST1-S3A — Meal Ownership & IDOR Protection — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md)
**Origin:** [`TRUST1_S3_SECURE_MEAL_TEMPLATE_ENDPOINTS.md`](./TRUST1_S3_SECURE_MEAL_TEMPLATE_ENDPOINTS.md) § Route Audit Results, deferred defect **#1**
**Risk:** 🟠 AMBER — changes who may call one live route. No schema, no data, no dependency.

---

## THE DEFECT

`POST /api/meals/:id/link-template` took a meal by **sequential integer id**, with **no session** and **no ownership check**, and then mutated it:

```js
const meal = await storage.getMeal(mealId);
if (!meal) return res.status(404).json({ message: "Meal not found" });  // exists? yes. yours? never asked.
…
const updated = await storage.updateMealTemplateId(mealId, templateId);
await storage.updateMealSourceType(mealId, body.sourceType);
```

Both storage calls filter on `meals.id` **alone** (`server/storage.ts:1004`, `:1027`), while `meals.userId` is `NOT NULL` (`shared/schema.ts:98`). The row was owned; the query did not care; the route did not ask.

**Any anonymous caller on the internet could mutate any household's meal by counting upwards from 1.**

### This is worse than the defect S3 was written to close

**R4** — the risk TRUST1 names, and the one `TRUST1-S3` closed — is anonymous writes to **shared platform content** (`meal_templates`). This is anonymous writes to **personal, user-owned rows**.

**And it is not in the TRUST1 programme at all.** `TRUST1.md:661` scopes R4 to `server/routes.ts:5085, 5097, 5115, 5135, 5147` — the meal-template routes only. There is no risk row for cross-household mutation of `meals`, because nobody knew it existed. **S3's 322-route audit found it**, S3's approved scope forbade fixing it, and S3 recorded it on a deferred-defect register that fails the build if the entry is ever silently dropped. **S3A is that debt being paid — which is the only reason the register was worth building.**

---

## WHY THE NON-OWNER GETS `404`, NOT `403`

This is the design decision in this task, and getting it wrong would have left the vulnerability half-closed.

`403 Forbidden` is the intuitive answer. It is also an **existence oracle**: it confirms the row is real. An attacker sweeping ids would still learn exactly which meal ids exist and how many meals the platform holds — purely from the status code. The write would be blocked and the enumeration would survive.

So **"not yours" and "not there" are made indistinguishable from outside.** A non-owner and a non-existent meal both return `404 {"message":"Meal not found"}` — byte-for-byte identical. This is not an invention: it is precisely what the three sibling meal routes already do (`routes.ts:1251`, `:9983`, `:10420`), and S3A copies it rather than improving on it.

The enumeration test asserts this directly — it requires that a hostile household sweeping a range of ids receives **exactly one distinct response** across ids that exist and ids that do not.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback identifier** | `rollback/TRUST1-S3A-meal-ownership-and-idor-protection-20260711` → `18fd2a7fe13d2cef75a57e1c70b42772dc3a54fb` |
| Predecessor | `18fd2a7` — TRUST1-S3 (Secure meal template endpoints, M3) |
| Working tree at tag time | **Intentionally dirty** — the same eleven pre-existing `PDA1`/`PKR` entries present since `TRUST1` was written. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 **the tag protects none of it**, and this task did not touch, stage, or commit one byte of it. |
| Rollback command | `git revert <S3A commit>` |
| Full rollback | `git checkout rollback/TRUST1-S3A-meal-ownership-and-idor-protection-20260711` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — parent programme; **confirmed this risk is absent from it**
- [x] `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` — Phase 0 scope
- [x] `docs/implementation/platform/TRUST1_S3_SECURE_MEAL_TEMPLATE_ENDPOINTS.md` — the origin of this finding

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity created, altered, or keyed. One route registration gains a guard.

☑ One owner per fact
  server/lib/access.ts remains the sole authority on IDENTITY and ROLE (PKR25) and
  was NOT MODIFIED. Ownership is not a role: the codebase's canonical ownership
  mechanism is the route-level `meal.userId !== req.user!.id` check, used verbatim
  at routes.ts:1251, :9983 and :10420. S3A REUSES it. No new helper, no new module,
  no new middleware.

☑ No duplicate entities
  None created.

☑ No duplicate ownership
  NO SECOND AUTHORISATION FRAMEWORK. There were two authorisation idioms in this
  codebase before S3A (assertAdmin middleware; inline isAuthenticated) plus one
  ownership idiom (route-level userId comparison). There are exactly the same three
  after it. A test asserts no bespoke ownership helper was introduced.

☑ No duplicate state
  No state.

☑ Extends existing architecture
  The guard applied is one that already exists and is already used by three sibling
  routes on the same table.

☑ Progressive enrichment where appropriate
  N/A — not a knowledge entity.

☑ Knowledge domain compliance
  Introduces no knowledge domain. It APPLIES Rule KC8 (declared vs enforced): the
  fix is verified against a RUNNING server and by re-introducing the vulnerability
  and watching the test go red — never from source alone.

☑ Honest gaps over fabricated information
  The storage layer remains ownership-agnostic (§ Scope Lock, suggestion 1) and
  this is stated rather than implied away. One further authenticated-caller IDOR
  found in passing is recorded, not silently fixed.

☑ No permanent synchronisation bridge
  None.

☑ Evolution over replacement
  Nothing replaced. One handler gains four lines; its body is otherwise byte-for-byte
  unchanged, including the auto-create-by-name branch.
```

**Meal template ownership semantics are UNTOUCHED**, as instructed. The three `assertAdmin` guards and two authenticated guards that `TRUST1-S3` placed on `meal_templates` are unchanged, and a test asserts it.

---

## IMPLEMENTATION

### Files changed — 4

| File | Change |
|---|---|
| `server/routes.ts` | One route guarded (+14 / −2) |
| `server/tests/test-trust1-s3a-meal-ownership-idor.ts` | **New** — 24 assertions |
| `server/tests/test-trust1-s3-secure-meal-template-endpoints.ts` | Deferred-defect register **retired to empty** (see below) |
| `package.json` | Registered the suite; wired into `npm test` |

`server/lib/access.ts`, `server/storage.ts`, the schema, and every client file are **unmodified**.

### The change

```js
app.post("/api/meals/:id/link-template", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  try {
    …
    const mealId = Number(req.params.id);
    if (!Number.isInteger(mealId)) return res.status(400).json({ message: "Invalid meal ID" });
    const meal = await storage.getMeal(mealId);
    if (!meal || meal.userId !== req.user!.id) return res.status(404).json({ message: "Meal not found" });
```

Four lines. The rest of the handler — including the branch that creates a template by name when `templateId` is omitted — is unchanged.

### S3's deferred-defect register is now empty

`TRUST1-S3` recorded this defect on a `KNOWN_UNGUARDED_DEFERRED` register inside its own test, with a "no dead entries" assertion that **fails the build the moment an entry stops being true**. Fixing the route therefore broke S3's test — **by design**. The entry was **retired, not rewritten**, and the register is now empty.

That is the mechanism working exactly as intended. The register was never an allowlist; it was **a debt with a name on it**, and the assertion is what forced this file to be edited the moment the debt was paid. A register that can only shrink, and that goes red when an entry becomes stale, cannot quietly decay into a list of things everyone has agreed to ignore.

S3's audit summary moves accordingly: **127 authenticated (was 126) · 0 recorded defects (was 1).**

---

## EVERY MUTATION PATH USED BY `link-template` — VERIFIED

The task required verifying that *every* mutation path this route uses respects ownership. All four were traced:

| Path | Ownership status |
|---|---|
| `storage.getMeal(mealId)` | Read. Not ownership-aware — **so the route enforces ownership on its result**, which is the canonical pattern. |
| `storage.updateMealTemplateId(mealId, templateId)` | `where(eq(meals.id, mealId))` — **id-only**. Reachable only *after* the ownership check. ✅ |
| `storage.updateMealSourceType(mealId, sourceType)` | `where(eq(meals.id, mealId))` — **id-only**. Reachable only *after* the ownership check. ✅ |
| `storage.createMealTemplate(...)` / `getMealTemplateByName(...)` | Writes **global** `meal_templates`, which is ownerless by design. Now reachable only by an **authenticated** caller — consistent with `TRUST1-S3`'s recorded decision that authenticated households may create templates. **Template ownership semantics unchanged**, as instructed. ✅ |

**The other caller of the same storage mutations was audited too.** `server/lib/auto-import-service.ts:47,111` calls `updateMealTemplateId` directly, outside this route. It is **clean**: it resolves its target through `storage.getMeals(userId)` (ownership-scoped, `storage.ts:436`), takes `userId` as a parameter, and its only route (`POST /api/smart-suggest/auto-import`, `routes.ts:4742`) is authenticated and passes `req.user!.id`. It can only touch the caller's own meals.

**Conclusion: `POST /api/meals/:id/link-template` was the only unowned path into these mutations, and it is now closed.**

---

## TESTS ADDED

**`server/tests/test-trust1-s3a-meal-ownership-idor.ts` — 24 assertions.**

**Level 1 — source:** the guard is the *canonical* one (not a bespoke helper); it authenticates first; it enforces `meal.userId !== req.user!.id`; the non-owner branch returns **404, never 403**; and S3's `meal_templates` guards are unchanged.

**Level 2 — over the wire, against the real `server/index.ts`:** two real households (Alice the owner, Mallory the attacker), each with real meals, driven over real HTTP.

| Required proof | Assertion |
|---|---|
| **owner succeeds** | Alice links her own meal → **200**, and `mealTemplateId` actually persisted. Plus `sourceType`, plus the auto-create-by-name branch. |
| **anonymous caller fails** | Anonymous → **401**, on both the template link and the `sourceType` mutation. |
| **authenticated non-owner fails** | Mallory → **404** on Alice's meal — *and she is proven to be a working household, because her own meal links successfully at **200***. The guard blocks the attack, not the user. |
| **sequential ID enumeration cannot mutate another household's meal** | Mallory sweeps ids `N−6 … N+2`. Every response is **404**; **exactly one distinct response body** across real and non-existent ids (no oracle); and a before/after database snapshot proves **not one of Alice's meal rows was mutated**. |

### The test was proven, not assumed

The vulnerability was **deliberately re-introduced** (auth line and ownership check removed) and the suite went red — **10 of 24 assertions failed**, including:

```
✗ …and NOT ONE of Alice's meal rows was mutated by the sweep
```

**On the unguarded code, Mallory's enumeration sweep actually mutated Alice's meals.** The exploit is not theoretical; it was executed against a real server and observed to work. The guard was then restored and the suite returned to 24/24. A test that has never failed is a hope, not a control.

---

## VALIDATION PERFORMED

| Check | Result |
|---|---|
| `npm run test:trust1-s3a-meal-ownership-idor` | **24 passed, 0 failed** |
| Mutation proof (vulnerability re-introduced) | **10 of 24 failed**, including the row-mutation assertion — then restored to green |
| `npm run test:trust1-s3-secure-meal-template-endpoints` | **39 passed, 0 failed** — register now empty, 0 recorded defects |
| **`npm test` (full suite)** | **exit 0 — 64 suites, zero failures** (63 before + S3A) |
| `npm run typecheck` | **175 errors — exact parity with baseline.** Every file S3A touched is clean |

**The typecheck baseline was breached and repaired, not waved through.** The first pass produced **178** — three `TS2802` iterator-spread errors in the new test file. Fixed with `Array.from`; parity restored to exactly **175** before commit.

---

## MANUAL VERIFICATION

Executed **2026-07-11** against a **real `server/index.ts`** on `127.0.0.1:42555` (`NODE_ENV=development`), with two purpose-created households, one meal (id `4170`) and one template (id `1319`). All test data destroyed afterwards.

### 3. Anonymous callers cannot

| Request | Result |
|---|---|
| `POST /api/meals/4170/link-template` *(no session)* | **401** |

### 2. Another authenticated household cannot

| Request | Result |
|---|---|
| `POST /api/meals/4170/link-template` *(attacker's session)* | **404** |
| Same call on a **non-existent** meal (`id 1999999999`) | **404** — *identical. Not an oracle.* |

**And the owner's meal was untouched by both attacks:** direct database read → `mealTemplateId=null  mealSourceType=scratch`. Unchanged.

### 1. Owner can link a template

| Request | Result |
|---|---|
| `POST /api/meals/4170/link-template` `{templateId:1319}` | **200** |
| Database after | `mealTemplateId=1319` — **persisted** |

### 4. Existing functionality remains intact

| Request | Result |
|---|---|
| Owner sets `sourceType: "ready_meal"` | **200** → `mealSourceType=ready_meal` persisted |
| Owner links with **no** `templateId` (auto-create-by-name branch) | **200** |
| Anonymous `DELETE /api/meal-templates/1319` | **403** — S3's `assertAdmin`, unchanged |
| Anonymous `GET /api/meal-templates` | **200** — public read, unchanged |

---

## USER ACCEPTANCE EVIDENCE

- **The exploit is closed, and it was real.** Re-introducing the vulnerability and running the suite showed a hostile household's id sweep **actually mutating another household's meal rows**. With the guard, the same sweep returns 404 across the board and changes nothing.
- **The enumeration oracle is closed too, not just the write.** A non-owner and a non-existent meal are byte-for-byte indistinguishable — verified on the wire and asserted in the suite.
- **The household is not collateral damage.** The attacker account links **her own** meal successfully (200). The guard blocks the attack, not the user.
- **Nothing regressed.** Owner link, `sourceType`, and the auto-create branch all still work; S3's template guards are untouched; **64/64 suites green; typecheck at exact baseline parity.**

---

## DEFINITION OF DONE

| Criterion | Status |
|---|---|
| `POST /api/meals/:id/link-template` protected against cross-household IDOR | ✅ Verified on the wire; exploit reproduced and killed |
| A household may only mutate meals it owns | ✅ 401 anonymous · 404 non-owner · 200 owner |
| Existing canonical ownership + authentication mechanisms reused | ✅ Verbatim from `routes.ts:1251`, `:9983`, `:10420` |
| No second authorisation framework | ✅ Asserted by test — no bespoke ownership helper exists |
| Every mutation path used by link-template respects ownership | ✅ All four traced; the one external caller (`auto-import-service`) audited and clean |
| Regression tests: owner / anonymous / non-owner / enumeration | ✅ All four, plus a before/after row-mutation snapshot |
| Meal template ownership semantics unmodified | ✅ Asserted by test |
| `npm test` passes | ✅ **exit 0, 64 suites** |

### The gaps, stated plainly

1. **Not verified against production.** Nothing is deployed. Every result above is from a real server on `127.0.0.1`. **A control is not "done" until it is observed on the deployed system** (Phase 0 exit criterion 14).
2. **The storage layer remains ownership-agnostic.** `updateMealTemplateId` and `updateMealSourceType` still filter on `meals.id` alone. They are safe *because the route checks first* — which is the codebase's canonical pattern, and is what "reuse existing mechanisms; do not create a second framework" required. It is **not** defence in depth, and it is recorded as a suggestion rather than claimed as a property.
3. **`PATCH /api/meals/:id/freezer-eligible` (`routes.ts:6872`) has the same class of defect** — see below. **Found, recorded, not fixed.**

---

## DATA IMPACT

- **Reads existing data:** NO *(no new read path)*
- **Writes new data:** NO
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO
- **Schema / migration:** **NONE**

No schema, column, table, or row was altered. Test data created during verification (2 users, 1 meal, 2 templates) was **deleted**; the tree and database are clean.

**Behavioural change:** anonymous and non-owning callers can no longer mutate a meal via this route. **This is the point.** Regression risk is essentially nil: **the route has zero callers** — no client, server, or script code invokes it. (The Analyser's "Link to template" button calls `POST /api/meal-templates`, the route `TRUST1-S3` guarded — a different endpoint.) So the guard removes an exploit and takes no working feature with it.

---

## TRUST CHECK

**Could this mislead the user?**
No user-facing copy changed. A household acting on its own meals sees no difference. A household acting on someone else's meal now sees `404` — which is the correct answer to a question it had no right to ask.

**Could this fabricate certainty?**
The strongest claim here — *"a hostile household cannot mutate another household's meal"* — is the one that was hardest tested: the vulnerability was **re-introduced deliberately** and the assertion was watched to fail before being trusted to pass. The **404-not-403** decision is stated as a deliberate anti-enumeration choice with its reasoning, not smuggled in as a detail. The storage layer's continued ownership-agnosticism is disclosed rather than implied away.

**Is anything guessed but shown as real?**
No. The "zero callers" claim is from an exhaustive grep of `client/`, `server/`, `scripts/` and `shared/`. The `auto-import-service` audit is from reading the code, not assuming it. Nothing is claimed verified against production, because nothing is deployed.

**What happens if the system is wrong?**
The identifiable regression is **over-guarding a legitimate caller** — and there is no legitimate caller to over-guard, which is why the risk here is unusually low. The auto-create-by-name branch (the subtlest path) is explicitly tested end-to-end.

- **No architectural duplication introduced:** YES
- **No new source of truth created:** YES — `access.ts` and `storage.ts` untouched
- **Runtime behaviour altered:** YES — one route now requires authentication and ownership. Deliberate; it is the task.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/TRUST1-S3A-meal-ownership-and-idor-protection-20260711` → `18fd2a7` |
| **Files modified** | `server/routes.ts`, `server/tests/test-trust1-s3-secure-meal-template-endpoints.ts`, `package.json` |
| **Files created** | `server/tests/test-trust1-s3a-meal-ownership-idor.ts`, this document |
| **Rollback command** | `git revert <S3A commit>` |
| **Full rollback** | `git checkout rollback/TRUST1-S3A-meal-ownership-and-idor-protection-20260711` |
| **Data to unwind** | **None.** No schema, no migration, no data. |

**Risk of rollback: reverting is a decision to re-open an anonymous cross-household IDOR on personal data** — to make every household's meals mutable by anyone who can count. It should be recorded as such. Note that a revert also restores S3's deferred-defect register entry, or S3's test will fail — which is the register doing its job in the other direction.

**Risk of the change:** negligible. Zero callers; four added lines; the canonical idiom; the auto-create branch tested end-to-end.

---

## SCOPE LOCK

**Implemented scope**
- `POST /api/meals/:id/link-template` — authentication **and** ownership, via the canonical route-level idiom.
- Non-owner returns **404, not 403** — closing the enumeration oracle as well as the write.
- Verification that every mutation path used by the route respects ownership, including the one external caller of the same storage functions.
- One test suite (24 assertions), mutation-proven, wired into `npm test`.
- `TRUST1-S3`'s deferred-defect register **retired to empty** — the direct and required consequence of fixing its only entry.

**Explicitly excluded — and NOT done**
- **`GET /api/meal-templates/:id`** and **`GET /api/plan-templates/:id`** (unguarded reads leaking user data, from S3's audit) — **not fixed**.
- **The missing `userId` filter in `getMealsForTemplate`** — **not fixed**.
- **`TRUST1-S5`, `S10`, `V3`, `O7`** — untouched.
- **Meal template ownership semantics** — **unmodified**, as instructed, and asserted by test.
- `server/lib/access.ts`, `server/storage.ts`, schema, migrations, client — **untouched**.

**SUGGESTIONS — observed in scope, not implemented, requiring approval**

1. **`PATCH /api/meals/:id/freezer-eligible` (`routes.ts:6872`) has the same defect, one class down.** It checks `isAuthenticated()` but **not ownership**, then calls `storage.updateMealFreezerEligible(parseInt(req.params.id), eligible)` — which filters on `meals.id` alone (`storage.ts:1405`). **Any authenticated household can toggle freezer-eligibility on any other household's meal by id.** Not anonymous, so strictly less severe than S3A's defect — but it is the *same bug*, on the *same table*, and S3A's fix is the template for it. **Recommend its own task.**
2. **Consider scoping the meal mutations at the storage layer** — `updateMealTemplateId(mealId, userId, …)` — so the whole class becomes structurally impossible rather than route-by-route correct. This is defence in depth, it would have prevented both S3A's defect and suggestion 1, and it is **deliberately not done here** because it changes a shared signature used by `auto-import-service` and would exceed "reuse the existing canonical mechanism."
3. **The remaining S3 findings still stand** — the two unguarded reads and the `getMealsForTemplate` leak. One missing `where` clause closes two of them at once.

---

## OUTCOME

**A live, anonymous, cross-household IDOR on personal data is closed** — and it is a risk the TRUST1 programme never knew it had. R4 covers shared content; this was *personal* content, mutable by anyone on the internet who could count to a meal's id.

The route had **zero callers**, which is the quiet lesson: it was pure attack surface. An endpoint nobody uses is still an endpoint everybody can reach.

**The deferred-defect register worked.** S3 could not fix this, so it wrote the debt down in a form that fails the build if it is ever quietly forgotten — and that register is what made this task exist, and what forced it to be closed rather than rewritten. It is now empty.

---

## NEXT STEPS

**Remaining TRUST1 Phase 0 tasks:** `TRUST1-S5` (authentication rate limiting) → `TRUST1-S10` (CI pipeline foundation — **its baseline spike should already be running**) → `TRUST1-V3` (pre-deploy verification gate) → `TRUST1-O7` (production deployment pipeline hardening).

**Still unrecorded, and overdue:** the **deploy-cadence decision** the Phase 0 plan required *before M1* (§4). **M1, M2, M3 and now S3A sit committed and undeployed**, fixing live defects that remain live in production.

---

*TRUST1-S3A. A household may mutate only the meals it owns — verified against a running server, and proven by watching the exploit succeed without the guard.*
