# INT8 — Pantry Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT8

---

## FILL-IN TEMPLATE (completed before code was written)

| Field | Value |
|---|---|
| Capability ID | `pantry` |
| Capability name | Pantry |
| Owner service | `server/storage.ts` — `getPantryItems` + `getPantryIngredientKnowledge` |
| Source of Truth | D8–11 — `userPantryItems` + `pantry_ingredient_knowledge` tables |
| Access scope | Own-data only (household-scoped) — `getPantryItems` resolves the caller's household from `userId` |
| Supported read intents | `read` (pantry items list); `explain` (ingredient knowledge for an item in the caller's pantry) |
| Executable intents | `read`, `explain` |
| Allowed scopes | `read`: `"list"` — the household's non-deleted pantry items |
| Honest gaps | (1) `read` with unknown/absent scope → gap; (2) `explain` with no `ingredientKey` param → gap; (3) `explain` when item not in caller's pantry → `denied` (no existence leak); (4) `explain` when owner returns `null` for `ingredientKey` (no stored knowledge) → gap; (5) `search` / `recommend` / `add` / `delete` → readOnlyVerbGuard gap |
| Permission model | `minimumRole: "user"`, `ownershipScoped: true` — mirrors the owner's household-scoped access |
| Port methods | `getPantryItems(userId)` → `storage.getPantryItems(userId)`; `getPantryIngredientKnowledge(ingredientKey)` → `storage.getPantryIngredientKnowledge(ingredientKey)` |
| Handler responsibilities | `read`: requireUserId → verbGuard → resolvePort → getPantryItems(userId) → project → ok (or scope gap); `explain`: requireUserId → verbGuard → resolvePort → check ingredientKey param → getPantryItems(userId) for ownership → find item or denied → getPantryIngredientKnowledge(ingredientKey) → project or gap |
| Binding registration | `PANTRY_EXECUTABLE_INTENTS = ["read", "explain"]` |
| Tests required | All 9 factory sections |
| Documentation updates | `server/intelligence/README.md` row + state block |
| Data impact | Reads only (`userPantryItems`, `pantry_ingredient_knowledge`) |
| Trust rules | (1) Never fabricate ingredient knowledge — surface only `pantry_ingredient_knowledge` rows stored by the owner; (2) Never cross-household — `getPantryItems` is household-scoped by the owner; (3) No existence leak — a foreign `ingredientKey` returns `denied`, never a knowledge result |

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int8-rollback-pre-pantry-binding` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | `server/intelligence/handlers/pantry-read-port.ts` (new), `server/intelligence/handlers/pantry-read-handler.ts` (new), `server/intelligence/bindings/pantry.ts` (new), `server/tests/test-intelligence-pantry-binding.ts` (new), `server/intelligence/intelligence-platform.ts` (edited), `server/intelligence/index.ts` (edited), `server/intelligence/README.md` (edited), `package.json` (edited), `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (scope-lock updated), `server/tests/test-intelligence-registry-executability.ts` (scope-lock updated), `server/tests/test-intelligence-shopping-binding.ts` (scope-lock updated) |
| Schema modified | None |

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` and all six governing documents.

---

## ARCHITECTURE COMPLIANCE

| Constraint | Status | Evidence |
|---|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS | `bindPantryReadCapability(intelligencePlatform)` appended to the end of `intelligence-platform.ts`; no second platform |
| One Capability Registry — binding to the existing `pantry` capability entry, no new registry | ✅ PASS | `PANTRY_CAPABILITY_ID = "pantry"` matches the existing seed entry; no new registry created |
| One Intent Engine — unchanged routing; no second engine | ✅ PASS | `IntentEngine` unchanged; routing pipeline unmodified |
| Owner remains owner — handler delegates every read; holds no business logic of its own | ✅ PASS | Handler has no pantry business rules; all reads delegate to `PantryReadPort` methods which 1:1 forward to `storage.ts` |
| No duplicate state — no parallel store, no cached copy of owner data | ✅ PASS | No caching, no parallel store; reads pass through the port to the owner on every call |
| Existing architecture extended only — reuses the `registerHandler` seam (INT1 extension point) | ✅ PASS | `platform.registerHandler("pantry", ...)` — the established extension point |

**AI Architecture Compliance:**

| Constraint | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ |
| Uses the AI Capability Registry (binds the existing `pantry` capability) | ✅ |
| Uses the Intent Engine (full pipeline) | ✅ |
| Reuses the existing owner service (via the port → `storage.ts`) | ✅ |
| Does not create another assistant | ✅ |
| Does not duplicate conversation state | ✅ |
| Uses registered capabilities only | ✅ |
| Permission-aware access | ✅ — `requireUserId` at handler entry; ownership gate before knowledge lookup |
| Produces honest gaps rather than fabricated knowledge | ✅ — every absent/null case throws `gap()`; no fallback invented |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/pantry-read-port.ts`)

Interface `PantryReadPort` with two 1:1 delegating methods:

- `getPantryItems(userId: number): Promise<UserPantryItem[]>` — forwards to `storage.getPantryItems(userId)`. Household-scoped by the owner: returns only the caller's non-deleted, sorted pantry items.
- `getPantryIngredientKnowledge(ingredientKey: string): Promise<PantryIngredientKnowledge | null>` — forwards to `storage.getPantryIngredientKnowledge(ingredientKey)`. Returns the admin-enriched static knowledge row or `null`.

Production factory `createStoragePantryReadPort()` uses dynamic imports so loading the Intelligence Platform module never opens a database connection at import time.

### Handler (`server/intelligence/handlers/pantry-read-handler.ts`)

`createPantryReadHandler(resolvePort)` returns a `CapabilityHandler` that:

1. Calls `readOnlyVerbGuard(intent, ["read", "explain"], "Pantry")` — any other verb (add, delete, search, recommend) returns an honest gap.
2. Calls `requireUserId(context, "Pantry")` — anonymous → `denied`.
3. Resolves the port once.
4. Routes by `intent.verb`:
   - `"read"`: validates `parameters.scope === "list"` (gap for any other scope), delegates to `port.getPantryItems(userId)`, projects to `PantryItemView[]` (internal fields `householdId`, `userId`, `isDeleted`, `sortOrder` are NOT surfaced).
   - `"explain"`: validates `parameters.ingredientKey` (gap if absent/blank), calls `port.getPantryItems(userId)` to confirm ownership (denied if not found — no existence leak), calls `port.getPantryIngredientKnowledge(ingredientKey)` (gap if null — never a fabricated description), projects to `PantryIngredientKnowledgeView` (internal management fields `isLocked`, `enrichmentVersion`, `lastEnrichedAt`, `id` are NOT surfaced).

Result shapes exported: `PantryItemView`, `PantryListReadResult`, `PantryIngredientKnowledgeView`, `PantryExplainResult`.

### Binding (`server/intelligence/bindings/pantry.ts`)

- `PANTRY_CAPABILITY_ID = "pantry"` — the existing registry entry.
- `PANTRY_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain"]` — truthful; add/delete/search/recommend are NOT listed.
- `bindPantryReadCapability(platform, resolvePort?)` — registers the handler; production default is `createStoragePantryReadPort`.

---

## FILES CREATED / MODIFIED

### New files (4)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/pantry-read-port.ts` | Delegation surface — PantryReadPort interface + production factory |
| `server/intelligence/handlers/pantry-read-handler.ts` | Execution handler — verb switch, ownership gate, honest gaps, read projections |
| `server/intelligence/bindings/pantry.ts` | Activation — registers handler + executableIntents on the singleton |
| `server/tests/test-intelligence-pantry-binding.ts` | Test suite — 47 assertions across 9 sections |
| `docs/implementation/intelligence/INT8_PANTRY_READ_ONLY_CAPABILITY_IMPLEMENTATION.md` | This report |

### Edited files (6)

| File | Change |
|---|---|
| `server/intelligence/intelligence-platform.ts` | Added `bindPantryReadCapability(intelligencePlatform)` call and updated module comments |
| `server/intelligence/index.ts` | Added exports for port, handler, binding, and executable-intents constant |
| `server/intelligence/README.md` | Added module table rows, state block (INT8), architecture diagram entry, test entry |
| `package.json` | Added `test:intelligence-pantry-binding` script; appended to `"test"` script |
| `server/tests/test-intelligence-nutrition-knowledge-binding.ts` | Scope-lock updated from 3 → 4 live capabilities |
| `server/tests/test-intelligence-registry-executability.ts` | Scope-lock updated (3 → 4); added pantry singleton assertions; removed pantry from unbound list |
| `server/tests/test-intelligence-shopping-binding.ts` | Scope-lock guard updated to include `pantry` (write-class but read-only bound) |

---

## DATA IMPACT

| Reads existing data | ✅ Yes — `userPantryItems` (household-scoped) + `pantry_ingredient_knowledge` (static) |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| No fabricated ingredient knowledge | Handler throws `gap()` when `getPantryIngredientKnowledge` returns `null`; never invents `whyItMatters`, `highlights`, or dietary `supports` |
| No cross-household reads | `getPantryItems(userId)` is household-scoped by the owner; `explain` gates on the result — foreign `ingredientKey` → `denied` with no existence leak |
| No internal field leakage | `PantryItemView` omits `householdId`, `userId`, `isDeleted`, `sortOrder`; `PantryIngredientKnowledgeView` omits `isLocked`, `enrichmentVersion`, `lastEnrichedAt`, `id` |
| No write code path | Port has no write methods; handler has no mutation; write verbs gap before the handler via `readOnlyVerbGuard` (or confirmation gate for allow-listed write verbs) |
| Attribution | `enrichmentSource` is surfaced on explain results; `source: "pantry-ingredient-knowledge"` is a constant on every knowledge view |

---

## TESTING

Test file: `server/tests/test-intelligence-pantry-binding.ts`
Run: `npm run test:intelligence-pantry-binding`
Result: **47 passed, 0 failed**

| Section | Assertions |
|---|---|
| Capability lookup | pantry is `available`; exactly 4 live capabilities (scope lock); executableIntents declares read + explain; add/delete/search/recommend NOT in executableIntents |
| Permission validation | anonymous read → `denied`; anonymous explain → `denied` |
| Handler invocation + delegation — read list | ok; scope/itemCount/items correct; internal fields not surfaced; delegation observed |
| Read — honest gaps for unknown scope | unknown scope → gap; absent scope → gap |
| Handler invocation + delegation — explain | ok; ingredientKey echoed; source attributed; knowledge fields correct; internal management fields not surfaced; getPantryItems called first (ownership); getPantryIngredientKnowledge called second |
| Explain — own-data only | other user → `denied`; denial cites no cross-household access |
| Honest gaps | sea-salt (no stored knowledge) → gap + fabrication refusal message; no ingredientKey param → gap mentioning the parameter |
| Unsupported intent | `import` → `unsupported_intent`; `share` → `unsupported_intent` |
| Read-only enforcement | `add` (unconfirmed) → `confirmation_required`; `add` (confirmed) → gap (read-only message); `delete` (confirmed) → gap; `search` → gap; `recommend` → gap; read-only verbs never require confirmation |
| Trust rules | null knowledge → gap (no invention); `isDeleted` never surfaced |

Also updated scope-lock assertions in:
- `test-intelligence-nutrition-knowledge-binding.ts`: 3 → 4
- `test-intelligence-registry-executability.ts`: 3 → 4 + pantry singleton assertions + pantry removed from unbound list
- `test-intelligence-shopping-binding.ts`: scope-lock guard updated to include pantry

---

## SCOPE LOCK

**What was NOT built (and must not be built here):**

- No `search` handler — the owner exposes no grounded search endpoint that can be safely delegated to a read-only binding. A future workstream could add it when a safe, user-scoped pantry search method exists.
- No `recommend` handler — recommendations are advisory/generative and out of scope for a read-only delegation binding.
- No `add` or `delete` handlers — write operations are owned by the Pantry service; this binding is read-only by construction.
- No changes to the Pantry owner's business logic, data model, or routes.
- No HTTP routes, no UI, no schema changes.
- No new capability registered — the existing `pantry` registry entry was used as-is.
- No changes to any other capability binding.

---

## DEFINITION OF DONE

- [x] Rollback tag `int8-rollback-pre-pantry-binding` created before any code was written
- [x] Architecture Compliance gate: PASS (all 9 AI checks + 6 architecture checks)
- [x] Port file created (`pantry-read-port.ts`) — 2 methods, no business logic, dynamic import, injectable
- [x] Handler file created (`pantry-read-handler.ts`) — verb guard first, userId required, port resolved once, honest gaps throughout
- [x] Binding file created (`pantry.ts`) — `PANTRY_EXECUTABLE_INTENTS` declared, `bindPantryReadCapability` exported
- [x] `intelligence-platform.ts` updated — `bindPantryReadCapability(intelligencePlatform)` added
- [x] `index.ts` updated — all 3 port/handler/binding exports added
- [x] `README.md` updated — module table + state block + diagram + test entry
- [x] `package.json` updated — `test:intelligence-pantry-binding` added to both `"test"` and as standalone script
- [x] Previous binding scope-lock assertions updated (nutrition-knowledge: 3→4; registry-executability: 3→4 + pantry assertions; shopping: guard updated)
- [x] Test suite passes: **47/47** (pantry binding test)
- [x] Full test suite passes: **0 failures across all intelligence + non-intelligence tests**
- [x] Data impact: reads only, no schema changes, no backfill
- [x] Trust rules verified by test assertions
- [x] Implementation report saved at `docs/implementation/intelligence/INT8_PANTRY_READ_ONLY_CAPABILITY_IMPLEMENTATION.md`
