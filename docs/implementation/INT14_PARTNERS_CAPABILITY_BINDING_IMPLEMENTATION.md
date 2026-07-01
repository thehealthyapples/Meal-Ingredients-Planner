# INT14 — Partners Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT14
**Produced using:** [INT7A Intelligence Capability Factory](../architecture/INTELLIGENCE_CAPABILITY_FACTORY.md), the [Developer Capability Registry](../architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md), and the canonical [Partners / Supermarkets Capability Card](../architecture/capabilities/partners.md) (INT11, promoted to governing architecture under EPIC 1.5)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int14-rollback-pre-partners-binding` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | `server/intelligence/handlers/partners-read-port.ts` (new), `server/intelligence/handlers/partners-read-handler.ts` (new), `server/intelligence/bindings/partners.ts` (new), `server/tests/test-intelligence-partners-binding.ts` (new), `server/intelligence/intelligence-platform.ts` (edited), `server/intelligence/index.ts` (edited), `server/intelligence/README.md` (edited), `package.json` (edited), `server/tests/test-intelligence-diary-binding.ts` (scope-lock updated), `server/tests/test-intelligence-pantry-binding.ts` (scope-lock updated), `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (scope-lock updated), `server/tests/test-intelligence-profile-binding.ts` (scope-lock updated), `server/tests/test-intelligence-household-binding.ts` (scope-lock updated — immediately previous binding), `server/tests/test-intelligence-shopping-binding.ts` (read-only allow-list guard extended), `server/tests/test-intelligence-registry-executability.ts` (scope-lock updated + `singletonPartners` assertions added + `partners` removed from the unbound-capabilities list), `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (edited), `docs/architecture/capabilities/partners.md` (status header updated) |
| Schema modified | None |

To restore: `git checkout int14-rollback-pre-partners-binding -- .` (note: this restores the repository to the INT1 commit state, discarding all uncommitted INT2–INT14 working-tree work, matching the convention established by prior rollback tags on this branch).

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` and the governing documents it points to.
- [x] Read `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` (INT7A) — fill-in template and factory steps followed exactly.
- [x] Read `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (INT9A) — used as the implementation index; updated with the completed binding.
- [x] Read the canonical Capability Card `docs/architecture/capabilities/partners.md` (INT11 / EPIC 1.5) — used verbatim as the fill-in template. The Card's MAJOR FINDING (none of the registry's `apiSurface` routes other than the static retailer list are safe to bind — `/api/routing` and `/api/savings/*` are unrelated concerns, and price comparison has no stored owner) is the binding boundary: only `read` on the `"retailers"` scope is implemented.
- [x] Confirmed `partners` is `registered` (not `never`) in `server/intelligence/capability-registry.ts` (seed entry, `displayName: "Partners / Supermarkets"`).
- [x] Confirmed the owner (`server/lib/supermarket-basket-service.ts`'s `getBasketSupermarkets()`) is an existing, static, synchronous function — no new owner created.

---

## FILL-IN TEMPLATE (from the canonical Capability Card, verified against current code)

| Field | Value |
|---|---|
| Capability ID | `partners` |
| Capability name | Partners / Supermarkets |
| Owner service | `server/lib/supermarket-basket-service.ts` (`getBasketSupermarkets()`, the static retailer list) |
| Source of Truth | None — a hardcoded static array of 9 UK retailers (name/key/color/hasDirectBasket); no DB table |
| Access scope | Not user-owned (public/advisory data) — but the live human route (`/api/basket/supermarkets-enhanced`) requires `req.isAuthenticated()`, mirrored here |
| Supported read intents | `read`, `explain`, `recommend`, `compare` (per `capability-registry.ts` seed) |
| Executable intents | `read` — narrowly, to the static retailer list only. `explain`/`recommend`/`compare` have no safe, grounded owner read in scope |
| Allowed scopes | `retailers` — the static 9-retailer list from `getBasketSupermarkets()` (name, key, color, hasDirectBasket). Nothing else in this capability's named `apiSurface` is a stored, fabrication-safe read |
| Honest gaps | Missing/unsupported `scope`; `explain` (no stored rationale); `recommend`/`compare` (the only code path that could serve per-store price comparison makes a live external fetch through `price-lookup.ts` and synthesizes per-store prices with hardcoded variance/tier multipliers — presenting that as fact would be a fabrication) |
| Permission model | `requireUserId(context, "Partners")` — anonymous → `denied`, mirroring the live route's `req.isAuthenticated()` gate even though the data itself is not user-owned |
| Port methods | `getBasketSupermarkets()` → `supermarket-basket-service.getBasketSupermarkets()` (synchronous; wrapped in a Promise to match the shared port contract) |
| Handler responsibilities | Validate `scope === "retailers"` (gap otherwise, naming the one supported scope); delegate to the port; project the static fields unmodified — no ranking, no synthesis |
| Binding registration | `PARTNERS_EXECUTABLE_INTENTS = ["read"]` |
| Tests required | Standard INT7A Step 6 set, scoped to the single "retailers" read. No price/comparison tests possible — that path is structurally absent |
| Documentation updates | `server/intelligence/README.md` row + state block; `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` Phase 1 entry + Phase 2 index update; canonical Capability Card status header |
| Data impact | Reads only (static data) — no writes, no schema change |
| Trust rules | Never fabricate a live price or a per-store price derived from a single live source plus a hardcoded multiplier; never assert a store recommendation that was not actually computed and stored by an owner; never claim store-stock verification (`verifyStoreAvailability` is a stub and is never called) |

---

## ARCHITECTURE COMPLIANCE

| Constraint | Status | Evidence |
|---|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS | `bindPartnersReadCapability(intelligencePlatform)` appended to the end of `intelligence-platform.ts`; no second platform |
| One Capability Registry — binding to the existing `partners` capability entry, no new registry | ✅ PASS | `PARTNERS_CAPABILITY_ID = "partners"` matches the existing seed entry; no new registry; the static seed file is left untouched (availability flips at runtime via `registerHandler`, matching every prior binding) |
| One Intent Engine — unchanged routing; no second engine | ✅ PASS | `IntentEngine` unchanged; routing pipeline unmodified |
| Owner remains owner — handler delegates every read; holds no business logic of its own | ✅ PASS | Handler has zero retailer business rules; every field comes from the port, projected 1:1 |
| No duplicate state — no parallel store, no cached copy of owner data | ✅ PASS | No caching, no parallel store; the port calls `getBasketSupermarkets()` fresh on every invocation |
| Existing architecture extended only — reuses the `registerHandler` seam (INT1 extension point) | ✅ PASS | `platform.registerHandler("partners", ...)` — the established extension point |

**AI Architecture Compliance:**

| Constraint | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ |
| Uses the AI Capability Registry (binds the existing `partners` capability) | ✅ |
| Uses the Intent Engine (full pipeline) | ✅ |
| Reuses the existing owner service (via the port → `supermarket-basket-service.ts`) | ✅ |
| Does not create another assistant | ✅ |
| Does not duplicate conversation state | ✅ |
| Uses registered capabilities only | ✅ |
| Permission-aware access | ✅ — `requireUserId` at handler entry, mirroring the live route's auth gate even on non-owned data |
| Produces honest gaps rather than fabricated knowledge | ✅ — unsupported scope, `explain`, `recommend`, `compare` all throw `gap()`; never a fabricated price, comparison, or recommendation |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/partners-read-port.ts`)

Interface `PartnersReadPort` with a single 1:1 delegating method:

- `getBasketSupermarkets()` — forwards to `lib/supermarket-basket-service.ts`'s `getBasketSupermarkets()`, a synchronous function returning the static 9-retailer array. The port wraps it in a Promise only to match the async contract shared by every other capability's port — no actual asynchronous work happens.

Production factory `createStoragePartnersReadPort()` uses a dynamic import so loading the Intelligence Platform module never touches the owning module at import time.

No write method exists on the port by construction — `compare`/`recommend` price synthesis (`product-matching-service.ts` → `price-lookup.ts`, which makes a live external fetch to Spoonacular and applies hardcoded multipliers) is deliberately NOT exposed here; presenting that output as a grounded "store price" would be a fabrication per the Capability Card.

### Handler (`server/intelligence/handlers/partners-read-handler.ts`)

`createPartnersReadHandler(resolvePort)` returns a `CapabilityHandler` that:

1. Calls `readOnlyVerbGuard(intent, ["read"], "Partners")` — `explain`, `recommend`, `compare` all fall through this guard and return an honest gap.
2. Calls `requireUserId(context, "Partners")` — anonymous → `denied`. The retailer list itself is not user-owned, but the live human route (`/api/basket/supermarkets-enhanced`) still requires `req.isAuthenticated()`; this mirrors that gate rather than relaxing it.
3. Resolves the port once.
4. `read`: validates `parameters.scope === "retailers"` (gap naming the one supported scope otherwise, including when `scope` is missing). Calls `port.getBasketSupermarkets()` and projects each row's `name`/`key`/`color`/`hasDirectBasket` unmodified into `{ scope: "retailers", retailerCount, retailers, source: "retail-intelligence" }`.

**Result shape:** `PartnersRetailersReadResult` (`scope`, `retailerCount`, `retailers: RetailerView[]`, `source`) — the only live result shape this binding produces; it carries no price, comparison, or recommendation field by construction.

### Binding (`server/intelligence/bindings/partners.ts`)

- `PARTNERS_CAPABILITY_ID = "partners"` — the existing registry entry.
- `PARTNERS_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"]` — truthful; `explain`/`recommend`/`compare` are NOT listed.
- `bindPartnersReadCapability(platform, resolvePort?)` — registers the handler; production default is `createStoragePartnersReadPort`.

---

## FILES CREATED / MODIFIED

### New files (5)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/partners-read-port.ts` | Delegation surface — `PartnersReadPort` interface + production factory |
| `server/intelligence/handlers/partners-read-handler.ts` | Execution handler — verb guard, single-scope dispatch, honest gaps |
| `server/intelligence/bindings/partners.ts` | Activation — registers handler + executableIntents on the singleton |
| `server/tests/test-intelligence-partners-binding.ts` | Test suite — 30 assertions across 6 sections |
| `docs/implementation/INT14_PARTNERS_CAPABILITY_BINDING_IMPLEMENTATION.md` | This report |

### Edited files (10)

| File | Change |
|---|---|
| `server/intelligence/intelligence-platform.ts` | Added `bindPartnersReadCapability(intelligencePlatform)` call and updated module comments |
| `server/intelligence/index.ts` | Added exports for port, handler, binding, executable-intents constant, result types |
| `server/intelligence/README.md` | Added module table rows, state block (INT14), architecture diagram entries, test entry |
| `package.json` | Added `test:intelligence-partners-binding` script; appended to `"test"` script |
| `server/tests/test-intelligence-diary-binding.ts` | Scope-lock updated from 7 → 8 (also fixed a stale "six live capabilities" label left over from an earlier workstream) |
| `server/tests/test-intelligence-pantry-binding.ts` | Scope-lock updated from 7 → 8 |
| `server/tests/test-intelligence-nutrition-knowledge-binding.ts` | Scope-lock updated from 7 → 8 |
| `server/tests/test-intelligence-profile-binding.ts` | Scope-lock updated from 7 → 8 |
| `server/tests/test-intelligence-household-binding.ts` | Scope-lock updated from 7 → 8 (the immediately previous binding, per INT7A factory step) |
| `server/tests/test-intelligence-shopping-binding.ts` | Read-only allow-list guard extended to include `partners` (capabilityClass `"ai-assisted"`, aiAccess `"R+A"` — neither matches the guard's `"read-only"`/`"R"` defaults, so it needed an explicit id exception like `household`/`pantry`/`diary`/`profile`) |
| `server/tests/test-intelligence-registry-executability.ts` | Added `singletonPartners` assertions; removed `partners` from the unbound-capabilities list; added `canExecute(partners, ...)` assertions; updated `listExecutableCapabilities()` count from 7 → 8; updated header comment counts |
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | Added full **Partners (INT14)** Phase 1 entry; updated the Phase 2 Capability Index table (`partners` → Bound); updated Cross-Cutting Patterns and Scope Lock counts |
| `docs/architecture/capabilities/partners.md` | Status header updated: "Capability Card complete — not yet bound" → "Bound under INT14" |

---

## DATA IMPACT

| Reads existing data | ✅ Yes — the static retailer list in `supermarket-basket-service.ts` (not user-owned, no per-caller filtering) |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| Never fabricate a live price or a per-store price derived from a single live source plus a hardcoded multiplier | Structural — the port has no method that reaches `product-matching-service.ts`/`price-lookup.ts`; `recommend`/`compare` are gaps with no live code path |
| Never assert a store recommendation that was not actually computed and stored by an owner | The only live result shape (`retailers`) carries no recommendation field; tested via an explicit `hasOwnProperty` assertion |
| Never claim store-stock verification | `verifyStoreAvailability()` is never imported or called by this binding |
| No write code path | Port has no write methods; `explain`/`recommend`/`compare` gap via `readOnlyVerbGuard`; no mutation anywhere in the handler |
| Anonymous access denied, mirroring the live route | `requireUserId` enforced even though the underlying data is not user-owned, matching `req.isAuthenticated()` on `/api/basket/supermarkets-enhanced` |

---

## TESTING

Test file: `server/tests/test-intelligence-partners-binding.ts`
Run: `npm run test:intelligence-partners-binding`
Result: **30 passed, 0 failed**

| Section | Assertions |
|---|---|
| Capability lookup | partners is `available`; exactly 8 live capabilities (scope lock); executableIntents declares read; explain/recommend/compare NOT in executableIntents |
| Permission validation | anonymous read → `denied`, citing the authentication requirement |
| Read scope: retailers | retailerCount, retailer rows (name/key/color/hasDirectBasket) and source surfaced from the owner unmodified; delegation to `getBasketSupermarkets` observed |
| Honest gaps | missing scope → gap; unsupported scope → gap |
| Unsupported intent | `search` → `unsupported_intent`; `generate` → `unsupported_intent` |
| Read-only + single-scope enforcement | explain/recommend/compare → gap (read-only message), none require confirmation (all are read-only verbs per the permission model); read never requires confirmation |
| Trust rule | the retailers result carries no price/comparison/recommendation field |

**Full suite after this workstream:** `npm test` — **0 failures** across all intelligence and non-intelligence test files, including all updated scope-lock assertions.

---

## SCOPE LOCK

**What was NOT built (and must not be built here):**

- No `explain` handler — the Card confirms there is no stored rationale for the retailer list.
- No `recommend`/`compare` handler — per-store price comparison has no safe, grounded owner; the only code path that could serve it makes a live external fetch and synthesizes prices with hardcoded multipliers, which the Card identifies as a fabrication risk.
- No exposure of `/api/routing` or `/api/savings/*` — the Card's MAJOR FINDING is that both are unrelated concerns (UI navigation hints and behavioural savings totals, respectively), not retailer data, and are excluded from this capability entirely.
- No `verifyStoreAvailability()` call — it is an unimplemented stub; binding it would imply real verification that does not exist.
- No changes to the Partners owner's business logic, data model, or routes (`/api/basket/supermarkets-enhanced`, `/api/routing`, `/api/savings/*` are all untouched).
- No HTTP routes, no UI, no schema changes.
- No new capability registered — the existing `partners` registry entry was used as-is; `capability-registry.ts` itself was not edited (availability flips at runtime via `registerHandler`, matching every prior binding).
- No changes to any other capability binding's behaviour — only their test assertions were brought current (scope-lock counts; shopping's read-only allow-list guard).

---

## DEFINITION OF DONE

- [x] Rollback tag `int14-rollback-pre-partners-binding` created and reported before further code was written
- [x] Architecture Compliance gate: PASS (all 9 AI checks + 6 architecture checks)
- [x] Port file created (`partners-read-port.ts`) — 1 method, no business logic, dynamic import, injectable
- [x] Handler file created (`partners-read-handler.ts`) — verb guard first, userId required, port resolved once, explicit single-scope projection, honest gaps throughout
- [x] Binding file created (`partners.ts`) — `PARTNERS_EXECUTABLE_INTENTS` declared, `bindPartnersReadCapability` exported
- [x] `intelligence-platform.ts` updated — `bindPartnersReadCapability(intelligencePlatform)` added
- [x] `index.ts` updated — all port/handler/binding/result-type exports added
- [x] `README.md` updated — module table + state block + diagram + test entry
- [x] `package.json` updated — `test:intelligence-partners-binding` added to both `"test"` and as a standalone script
- [x] Previous binding scope-lock assertions updated (diary, pantry, nutrition-knowledge, profile, household: 7→8; shopping: allow-list extended; registry-executability: singleton assertions added + count 7→8)
- [x] Developer Capability Registry updated: full Partners (INT14) Phase 1 entry added; Phase 2 index updated
- [x] Canonical Capability Card status header updated to reflect the binding
- [x] Test suite passes: **30/30** (partners binding test)
- [x] Full test suite passes: **0 failures** across all intelligence + non-intelligence tests
- [x] `npx tsc --noEmit`: no new type errors introduced (pre-existing, unrelated errors in other files untouched)
- [x] Data impact: reads only, no schema changes, no backfill
- [x] Trust rules verified by test assertions
- [x] Implementation report saved at `docs/implementation/INT14_PARTNERS_CAPABILITY_BINDING_IMPLEMENTATION.md`
