# INT17 — Analyser Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT17
**Produced using:** [INT7A Intelligence Capability Factory](../architecture/INTELLIGENCE_CAPABILITY_FACTORY.md), the [Developer Capability Registry](../architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md), and the canonical [Analyser (Product / UPF) Capability Card](../architecture/capabilities/analyser.md) (INT11, promoted to governing architecture under EPIC 1.5)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int17-rollback-pre-analyser-binding` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | `server/intelligence/handlers/analyser-read-port.ts` (new), `server/intelligence/handlers/analyser-read-handler.ts` (new), `server/intelligence/bindings/analyser.ts` (new), `server/tests/test-intelligence-analyser-binding.ts` (new), `server/intelligence/intelligence-platform.ts` (edited), `server/intelligence/index.ts` (edited), `server/intelligence/README.md` (edited), `package.json` (edited), `server/tests/test-intelligence-diary-binding.ts` (scope-lock updated), `server/tests/test-intelligence-pantry-binding.ts` (scope-lock updated), `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (scope-lock updated), `server/tests/test-intelligence-profile-binding.ts` (scope-lock updated), `server/tests/test-intelligence-household-binding.ts` (scope-lock updated), `server/tests/test-intelligence-partners-binding.ts` (scope-lock updated), `server/tests/test-intelligence-meals-binding.ts` (scope-lock updated), `server/tests/test-intelligence-templates-binding.ts` (scope-lock updated — immediately previous binding), `server/tests/test-intelligence-shopping-binding.ts` (read-only allow-list guard extended), `server/tests/test-intelligence-registry-executability.ts` (added `ANALYSER_CAPABILITY_ID`/`ANALYSER_EXECUTABLE_INTENTS` import + `singletonAnalyser` assertions + removed `analyser` from the unbound-capabilities list (now `["administration"]`) + updated `listExecutableCapabilities()` count 10→11 + `canExecute` assertions flipped from false→true for analyser/read), `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (edited), `docs/architecture/capabilities/analyser.md` (status header updated) |
| Schema modified | None |

To restore: `git checkout int17-rollback-pre-analyser-binding -- .` (note: this restores the repository to the INT1 commit state, discarding all uncommitted INT2–INT17 working-tree work, matching the convention established by prior rollback tags on this branch).

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` and the governing documents it points to.
- [x] Read `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` (INT7A) — fill-in template and factory steps followed exactly.
- [x] Read `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (INT9A) — used as the implementation index; updated with the completed binding.
- [x] Read the canonical Capability Card `docs/architecture/capabilities/analyser.md` (INT11 / EPIC 1.5) — used verbatim as the fill-in template. The Card's owner correction (`server/lib/product-analysis.ts`/`upf-analysis-service.ts` are pure computation, not the owner — the real owner is `server/storage.ts`'s `getAllAdditives()`) and its MAJOR FINDING (barcode/product lookup is not a stored read — it live-fetches OpenFoodFacts and recomputes fresh on every call; no `product_analysis` table exists) are the binding's boundaries: the handler exposes ONLY the additives reference list and gaps everything else.
- [x] Confirmed `analyser` is `registered` (not `never`) in `server/intelligence/capability-registry.ts` (seed entry, `displayName: "Analyser (Product / UPF)"`, `supportedIntents: ["read", "explain", "analyse", "report"]`).
- [x] Confirmed the owner (`server/storage.ts` — `getAllAdditives()`, line 869) is an existing service with an existing read method; no new owner created.
- [x] Additional codebase evidence gathered beyond the Card: `shared/schema.ts:609-617` confirms the `additives` table is the only genuinely stored table in this neighbourhood (no `product_analysis`/`productAnalysis` table exists anywhere in `shared/schema.ts`); `server/storage.ts:869-871` confirms `getAllAdditives()` returns the full unscoped reference table (`db.select().from(additives)`).

---

## FILL-IN TEMPLATE (from the canonical Capability Card, verified against current code)

| Field | Value |
|---|---|
| Capability ID | `analyser` |
| Capability name | Analyser (Product / UPF) |
| Owner service | `server/storage.ts` — `getAllAdditives()` |
| Source of Truth | `additives` table (`shared/schema.ts:609-617`). SoT D19's "product analysis tables" claim is inaccurate — no such table exists |
| Access scope | Public/advisory (`ownershipScoped: false`), but all three live routes named in the registry's `apiSurface` require `req.isAuthenticated()` |
| Supported read intents | `read`, `explain`, `analyse`, `report` (per `capability-registry.ts` seed) |
| Executable intents | `read` — single scope (`additives`); nothing else has a safe, grounded STORED-read owner |
| Allowed scopes | `additives` — `getAllAdditives()`: `id`, `name`, `type`, `riskLevel`, `description`, `isRegulatory`, `aliases` |
| Honest gaps | Missing/unsupported `scope` — gap. `explain` — gap (additive descriptions already covered by `additives`; no other stored rationale). `analyse` — gap (barcode lookup is a live, unstored OpenFoodFacts recompute, not a stored read — binding it would require either a live external network call from inside a read-only binding or a stored result table that does not exist). `report` — gap (user-specific/diary-linked, out of scope). `/api/scan` investigated and found to be unrelated OCR extraction — excluded from scope entirely |
| Permission model | `req.isAuthenticated()` required on all three routes inspected (additives/barcode/scan) — mirrored as a blanket `requireUserId` |
| Port methods | `getAllAdditives()` → `storage.getAllAdditives()` |
| Handler responsibilities | `read` verb returns the additives reference list for `scope: "additives"`, nothing else |
| Binding registration | `ANALYSER_EXECUTABLE_INTENTS = ["read"]` |
| Tests required | Standard set, scoped to the single "additives" read |
| Documentation updates | `server/intelligence/README.md` row + state block + diagram + test entry; `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` Phase 1 entry + Phase 2 index update; canonical Capability Card status header |
| Data impact | Reads only (static reference table) |
| Trust rules | Never fabricate a UPF classification, health score, or NOVA group for a product — there is no stored result; additives surfaced as-is from the reference table |

---

## ARCHITECTURE COMPLIANCE

| Constraint | Status | Evidence |
|---|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS | `bindAnalyserReadCapability(intelligencePlatform)` appended to the end of `intelligence-platform.ts`; no second platform |
| One Capability Registry — binding to the existing `analyser` capability entry, no new registry | ✅ PASS | `ANALYSER_CAPABILITY_ID = "analyser"` matches the existing seed entry; no new registry; the static seed file is left untouched (availability flips at runtime via `registerHandler`, matching every prior binding) |
| One Intent Engine — unchanged routing; no second engine | ✅ PASS | `IntentEngine` unchanged; routing pipeline unmodified |
| Owner remains owner — handler delegates every read; holds no business logic of its own | ✅ PASS | Handler has no additive business rules; every line is "guard, delegate, project, or gap" |
| No duplicate state — no parallel store, no cached copy of owner data | ✅ PASS | No caching, no parallel store; reads pass through the port to the owner on every call |
| Existing architecture extended only — reuses the `registerHandler` seam (INT1 extension point) | ✅ PASS | `platform.registerHandler("analyser", ...)` — the established extension point |

**AI Architecture Compliance:**

| Constraint | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ |
| Uses the AI Capability Registry (binds the existing `analyser` capability) | ✅ |
| Uses the Intent Engine (full pipeline) | ✅ |
| Reuses the existing owner service (via the port → `storage.ts`) | ✅ |
| Does not create another assistant | ✅ |
| Does not duplicate conversation state | ✅ |
| Uses registered capabilities only | ✅ |
| Permission-aware access | ✅ — `requireUserId` mirrors the live routes' `req.isAuthenticated()` gate |
| Produces honest gaps rather than fabricated knowledge | ✅ — `explain`/`analyse`/`report`/missing-or-unsupported-scope all throw `gap()` |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/analyser-read-port.ts`)

Interface `AnalyserReadPort` with one 1:1 delegating method: `getAllAdditives` — a direct forward to `storage.ts`.

`getAdditiveByName`, `getProductAdditives`, `addProductAdditive`, and `clearProductAdditives` are deliberately NOT exposed — the Card's "Port methods" field lists exactly one method (`getAllAdditives`); the others are either unnecessary for the single allowed scope or write methods (out of scope for a read-only binding by construction).

Production factory `createStorageAnalyserReadPort()` uses a dynamic import so loading the Intelligence Platform module never opens a database connection at import time.

### Handler (`server/intelligence/handlers/analyser-read-handler.ts`)

`createAnalyserReadHandler(resolvePort)` returns a `CapabilityHandler` that:

1. Calls `readOnlyVerbGuard(intent, ["read"], "Analyser")` — `explain`, `analyse`, `report`, and every write verb all fall through this guard and return an honest gap.
2. Calls `requireUserId(context, "Analyser")` — the additives table is not user-owned, but all three live routes in the registry's `apiSurface` require `req.isAuthenticated()`, so this binding mirrors that gate rather than relaxing it (the same pattern as INT14 Partners).
3. Resolves the port once.
4. `read`: requires `{ scope: "additives" }` (gap naming the one supported scope for anything else, including a missing scope). Delegates to `port.getAllAdditives()`, projects each row through an explicit field allowlist (`toAdditiveView`), and returns `{ scope, additiveCount, additives, source: "additives-reference" }`.

**Result shape:** `AnalyserAdditivesReadResult` — the only live result shape, never carrying a `upfClassification`/`healthScore`/`novaGroup` field (those have no stored owner).

### Binding (`server/intelligence/bindings/analyser.ts`)

- `ANALYSER_CAPABILITY_ID = "analyser"` — the existing registry entry.
- `ANALYSER_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"]` — truthful; `explain`/`analyse`/`report` are NOT listed.
- `bindAnalyserReadCapability(platform, resolvePort?)` — registers the handler; production default is `createStorageAnalyserReadPort`.

---

## FILES CREATED / MODIFIED

### New files (5)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/analyser-read-port.ts` | Delegation surface — `AnalyserReadPort` interface + production factory |
| `server/intelligence/handlers/analyser-read-handler.ts` | Execution handler — verb guard, auth guard, single-scope dispatch, honest gaps |
| `server/intelligence/bindings/analyser.ts` | Activation — registers handler + executableIntents on the singleton |
| `server/tests/test-intelligence-analyser-binding.ts` | Test suite — 30 assertions |
| `docs/implementation/INT17_ANALYSER_CAPABILITY_BINDING_IMPLEMENTATION.md` | This report |

### Edited files (12)

| File | Change |
|---|---|
| `server/intelligence/intelligence-platform.ts` | Added `bindAnalyserReadCapability(intelligencePlatform)` call and updated module comments |
| `server/intelligence/index.ts` | Added exports for port, handler, binding, executable-intents constant, result types |
| `server/intelligence/README.md` | Added module table rows, state block (INT17), architecture diagram entries, test entry |
| `package.json` | Added `test:intelligence-analyser-binding` script; appended to `"test"` script |
| `server/tests/test-intelligence-diary-binding.ts` | Scope-lock updated from 10 → 11 |
| `server/tests/test-intelligence-pantry-binding.ts` | Scope-lock updated from 10 → 11 |
| `server/tests/test-intelligence-nutrition-knowledge-binding.ts` | Scope-lock updated from 10 → 11 |
| `server/tests/test-intelligence-profile-binding.ts` | Scope-lock updated from 10 → 11 |
| `server/tests/test-intelligence-household-binding.ts` | Scope-lock updated from 10 → 11 |
| `server/tests/test-intelligence-partners-binding.ts` | Scope-lock updated from 10 → 11 |
| `server/tests/test-intelligence-meals-binding.ts` | Scope-lock updated from 10 → 11 |
| `server/tests/test-intelligence-templates-binding.ts` | Scope-lock updated from 10 → 11 (the immediately previous binding, per INT7A factory step) |
| `server/tests/test-intelligence-shopping-binding.ts` | Read-only allow-list guard extended to include `analyser` (capabilityClass `"ai-assisted"`, aiAccess `"R+A"` — neither matches the guard's `"read-only"`/`"R"` defaults, so it needed an explicit id exception like `partners`) |
| `server/tests/test-intelligence-registry-executability.ts` | Added `singletonAnalyser` assertions; removed `analyser` from the unbound-capabilities list (now `["administration"]`); updated `listExecutableCapabilities()` count from 10 → 11 and its "includes" assertion; flipped `canExecute(analyser, read)` from false→true and added `canExecute(analyser, analyse)` → false; updated header comment counts |
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | Added full **Analyser (INT17)** Phase 1 entry; updated the Phase 2 Capability Index table (`analyser` → Bound); updated Cross-Cutting Patterns and Scope Lock counts |
| `docs/architecture/capabilities/analyser.md` | Status header updated: "Capability Card complete — not yet bound" → "Bound under INT17" |

---

## DATA IMPACT

| Reads existing data | ✅ Yes — `additives` (all rows, public reference table) |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| Never fabricate a UPF classification, health score, or NOVA group | Structural — the only live result shape (`AnalyserAdditivesReadResult`) has no such field; no code path computes or surfaces one. Tested via an explicit `hasOwnProperty` assertion |
| Additives surfaced as-is | Only stored fields are surfaced via an explicit projection function (`toAdditiveView`); never a raw spread of the owner's row |
| No live external network call from inside the binding | Structural — the port's only method is `getAllAdditives()`, a database read; barcode lookup (OpenFoodFacts fetch) is never called |
| No write code path | Port has no write methods; `explain`/`analyse`/`report`/writes all gap via `readOnlyVerbGuard`; no mutation anywhere in the handler |

---

## TESTING

Test file: `server/tests/test-intelligence-analyser-binding.ts`
Run: `npm run test:intelligence-analyser-binding`
Result: **30 passed, 0 failed**

| Section | Assertions |
|---|---|
| Capability lookup | analyser is `available`; exactly 11 live capabilities (scope lock); executableIntents declares read; explain/analyse/report NOT in executableIntents |
| Permission validation | anonymous read → denied (mirrors the live routes' `req.isAuthenticated()` gate) |
| Read scope: additives | full reference-table list surfaced unmodified; delegation to `getAllAdditives` observed |
| Honest gaps | missing scope → gap; unsupported scope → gap |
| Unsupported intent | `search`/`generate` (not in allow-list) → `unsupported_intent` |
| Read-only enforcement | explain/analyse/report → gap (read-only message); none ever require confirmation; read never requires confirmation |
| Trust rule | result carries no `upfClassification`/`healthScore`/`novaGroup` field |

**Full suite after this workstream:** `npm test` — **0 failures** across all intelligence and non-intelligence test files, including all updated scope-lock assertions. `npx tsc --noEmit`: no new type errors introduced (pre-existing, unrelated errors in other files untouched).

---

## SCOPE LOCK

**What was NOT built (and must not be built here):**

- No `explain` handler — additive descriptions are already covered by the `additives` read scope; no other stored rationale exists.
- No `analyse` handler — barcode/product lookup is not a stored read; it live-fetches OpenFoodFacts and recomputes analysis fresh on every call via `analyzeProduct`/`analyzeProductUPF`. Binding it would require either a live third-party network call from inside a read-only capability binding, or a stored result table that does not currently exist — left as a gap pending a governance decision, per the Card.
- No `report` handler — user-specific/diary-linked, out of scope.
- No `/api/scan` surface — investigated and found to be recipe/shopping-list/planner OCR extraction with no call to `analyzeProduct`/`analyzeProductUPF`; the registry's `apiSurface` listing of `/api/scan` under "analyser" is incorrect and is excluded entirely from this capability's scope (recorded as a recommendation, not applied to `capability-registry.ts`).
- No `getAdditiveByName`, `getProductAdditives`, `addProductAdditive`, or `clearProductAdditives` exposed on the port — not needed by the Card's single allowed scope; the latter two are writes and out of scope by construction.
- No changes to the Analyser owner's business logic, data model, or routes (`/api/additives`, `/api/products/barcode/:barcode`, `/api/scan` are all untouched).
- No HTTP routes, no UI, no schema changes.
- No new capability registered — the existing `analyser` registry entry was used as-is; `capability-registry.ts` itself was not edited (availability flips at runtime via `registerHandler`, matching every prior binding).
- No changes to any other capability binding's behaviour — only their test assertions were brought current (scope-lock counts; shopping's read-only allow-list guard).

---

## DEFINITION OF DONE

- [x] Rollback tag `int17-rollback-pre-analyser-binding` created and reported before further code was written
- [x] Architecture Compliance gate: PASS (all 9 AI checks + 6 architecture checks)
- [x] Port file created (`analyser-read-port.ts`) — 1 method, no business logic, dynamic import, injectable
- [x] Handler file created (`analyser-read-handler.ts`) — verb guard first, blanket auth guard (mirrors the live routes' `req.isAuthenticated()`), port resolved once, single-scope dispatch, explicit projection (no fabricated fields), honest gaps throughout
- [x] Binding file created (`analyser.ts`) — `ANALYSER_EXECUTABLE_INTENTS` declared, `bindAnalyserReadCapability` exported
- [x] `intelligence-platform.ts` updated — `bindAnalyserReadCapability(intelligencePlatform)` added
- [x] `index.ts` updated — all port/handler/binding/result-type exports added
- [x] `README.md` updated — module table + state block + diagram + test entry
- [x] `package.json` updated — `test:intelligence-analyser-binding` added to both `"test"` and as a standalone script
- [x] Previous binding scope-lock assertions updated (diary, pantry, nutrition-knowledge, profile, household, partners, meals, templates: 10→11; shopping: allow-list extended; registry-executability: singleton assertions added + count 10→11)
- [x] Developer Capability Registry updated: full Analyser (INT17) Phase 1 entry added; Phase 2 index updated; all six promoted Capability Cards now show as bound
- [x] Canonical Capability Card status header updated to reflect the binding
- [x] Test suite passes: **30/30** (analyser binding test)
- [x] Full test suite passes: **0 failures** across all intelligence + non-intelligence tests
- [x] `npx tsc --noEmit`: no new type errors introduced (pre-existing, unrelated errors in other files untouched)
- [x] Data impact: reads only, no schema changes, no backfill
- [x] Trust rules verified by test assertions
- [x] Implementation report saved at `docs/implementation/INT17_ANALYSER_CAPABILITY_BINDING_IMPLEMENTATION.md`
