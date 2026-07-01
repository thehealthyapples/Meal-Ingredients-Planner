# INT13 — Household Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT13
**Produced using:** [INT7A Intelligence Capability Factory](../architecture/INTELLIGENCE_CAPABILITY_FACTORY.md), the [Developer Capability Registry](../architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md), and the canonical [Household Capability Card](../architecture/capabilities/household.md) (INT11, promoted to governing architecture under EPIC 1.5)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int13-rollback-pre-household-binding` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | `server/intelligence/handlers/household-read-port.ts` (new), `server/intelligence/handlers/household-read-handler.ts` (new), `server/intelligence/bindings/household.ts` (new), `server/tests/test-intelligence-household-binding.ts` (new), `server/intelligence/intelligence-platform.ts` (edited), `server/intelligence/index.ts` (edited), `server/intelligence/README.md` (edited), `package.json` (edited), `server/tests/test-intelligence-diary-binding.ts` (scope-lock updated), `server/tests/test-intelligence-pantry-binding.ts` (scope-lock updated), `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (scope-lock updated), `server/tests/test-intelligence-profile-binding.ts` (scope-lock updated — immediately previous binding), `server/tests/test-intelligence-shopping-binding.ts` (read-only allow-list guard extended), `server/tests/test-intelligence-registry-executability.ts` (scope-lock updated + `singletonHousehold` assertions added + `household` removed from the unbound-capabilities list), `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (edited), `docs/architecture/capabilities/household.md` (status header updated) |
| Schema modified | None |

To restore: `git checkout int13-rollback-pre-household-binding -- .` (note: this restores the repository to the INT1 commit state, discarding all uncommitted INT2–INT13 working-tree work, matching the convention established by prior rollback tags on this branch).

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` and the governing documents it points to.
- [x] Read `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` (INT7A) — fill-in template and factory steps followed exactly.
- [x] Read `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (INT9A) — used as the implementation index; updated with the completed binding.
- [x] Read the canonical Capability Card `docs/architecture/capabilities/household.md` (INT11 / EPIC 1.5) — used verbatim as the fill-in template; its OPEN DECISION (exclude `inviteCode` from the AI-facing projection) is resolved by this implementation (excluded — see WHAT WAS BUILT).
- [x] Confirmed `household` is `registered` (not `never`) in `server/intelligence/capability-registry.ts` (seed entry, `displayName: "Household"`).
- [x] Confirmed the owners (`server/storage.ts` — `getHouseholdWithMembers`, `getHouseholdDietaryContext`, `getHouseholdEaters`, `getUser`; `server/lib/household.ts` — `getHouseholdForUser`) are existing services with existing read methods; no new owner created.

---

## FILL-IN TEMPLATE (from the canonical Capability Card, verified against current code)

| Field | Value |
|---|---|
| Capability ID | `household` |
| Capability name | Household |
| Owner service | `server/storage.ts` (Household System §, Eaters §) + `server/lib/household.ts` (`getHouseholdForUser`, session resolver) |
| Source of Truth | SoT D16 — `households` / `household_members` / `household_eaters` (`shared/schema.ts:1060–1096`) |
| Access scope | Own-data only (household-scoped). Structural: the binding takes no id parameter — household is always resolved from `getHouseholdForUser(requireUserId(context))`, never a client-suppliable value |
| Supported read intents | `read`, `explain`, `add`, `delete` (per `capability-registry.ts` seed) |
| Executable intents | `read` — `explain` has no stored rationale; `add`/`delete` are writes |
| Allowed scopes | `household` (id, name, members via `getHouseholdWithMembers`), `dietary-context` (aggregated diet types/exclusions via `getHouseholdDietaryContext`), `eaters` (`household_eaters` rows, enriched at read time for adult eaters from `users.dietPattern`/`users.dietRestrictions`, mirroring `server/routes.ts:8526–8541`) |
| Honest gaps | Caller belongs to no household (`getHouseholdForUser()` throws) — translated to gap, not a fabricated empty household; missing/unsupported `scope`; `explain`; `add`/`delete` |
| Permission model | `requireUserId(context, "Household")` — anonymous → `denied`. Household id resolved only from `getHouseholdForUser(userId)` (`server/lib/household.ts`) |
| Port methods | `getHouseholdForUser(userId)` → `household.getHouseholdForUser(userId)`; `getHouseholdWithMembers(householdId)` → `storage.getHouseholdWithMembers(id)`; `getHouseholdDietaryContext(userId)` → `storage.getHouseholdDietaryContext(userId)`; `getHouseholdEaters(householdId)` → `storage.getHouseholdEaters(id)`; `getUser(userId)` → `storage.getUser(userId)` (adult-eater enrichment only) |
| Handler responsibilities | Resolve `householdId` from the caller's session once (also doubles as the no-household honest-gap translation point); delegate per scope; project results. **Resolved OPEN DECISION:** `inviteCode` is EXCLUDED from the `household` scope projection — an AI capability is a new, broader-blast-radius consumer of a join secret |
| Binding registration | `HOUSEHOLD_EXECUTABLE_INTENTS = ["read"]` |
| Tests required | Standard INT7A Step 6 set + "caller has no household → gap, not denied" + inviteCode-exclusion trust-rule assertion (both required by the Card) |
| Documentation updates | `server/intelligence/README.md` row + state block; `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` Phase 1 entry + Phase 2 index update; canonical Capability Card status header |
| Data impact | Reads only — no writes, no schema change |
| Trust rules | Never surface another household's membership or eaters; never fabricate dietary restrictions; `inviteCode` never surfaced (resolved open decision) |

---

## ARCHITECTURE COMPLIANCE

| Constraint | Status | Evidence |
|---|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS | `bindHouseholdReadCapability(intelligencePlatform)` appended to the end of `intelligence-platform.ts`; no second platform |
| One Capability Registry — binding to the existing `household` capability entry, no new registry | ✅ PASS | `HOUSEHOLD_CAPABILITY_ID = "household"` matches the existing seed entry; no new registry; the static seed file is left untouched (availability flips at runtime via `registerHandler`, matching every prior binding) |
| One Intent Engine — unchanged routing; no second engine | ✅ PASS | `IntentEngine` unchanged; routing pipeline unmodified |
| Owner remains owner — handler delegates every read; holds no business logic of its own | ✅ PASS | Handler has no household business rules; every field comes from the port. The one exception — adult eater enrichment from `users.dietPattern`/`users.dietRestrictions` — is a direct mirror of the existing route projection at `server/routes.ts:8526–8541` (the canonical Capability Card explicitly requires this for the "eaters" scope), not invented logic |
| No duplicate state — no parallel store, no cached copy of owner data | ✅ PASS | No caching, no parallel store; reads pass through the port to the owner on every call |
| Existing architecture extended only — reuses the `registerHandler` seam (INT1 extension point) | ✅ PASS | `platform.registerHandler("household", ...)` — the established extension point |

**AI Architecture Compliance:**

| Constraint | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ |
| Uses the AI Capability Registry (binds the existing `household` capability) | ✅ |
| Uses the Intent Engine (full pipeline) | ✅ |
| Reuses the existing owner service (via the port → `storage.ts` + `lib/household.ts`) | ✅ |
| Does not create another assistant | ✅ |
| Does not duplicate conversation state | ✅ |
| Uses registered capabilities only | ✅ |
| Permission-aware access | ✅ — `requireUserId` at handler entry; household always resolved server-side, no id parameter exists |
| Produces honest gaps rather than fabricated knowledge | ✅ — no household membership, missing/unsupported scope, `explain`, `add`, `delete` all throw `gap()`; never a fabricated household |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/household-read-port.ts`)

Interface `HouseholdReadPort` with five 1:1 delegating methods:

- `getHouseholdForUser(userId)` — forwards to `lib/household.ts`'s `getHouseholdForUser(userId)` (throws if the caller has no active membership).
- `getHouseholdWithMembers(householdId)` — forwards to `storage.getHouseholdWithMembers(householdId)`.
- `getHouseholdDietaryContext(userId)` — forwards to `storage.getHouseholdDietaryContext(userId)`.
- `getHouseholdEaters(householdId)` — forwards to `storage.getHouseholdEaters(householdId)`.
- `getUser(userId)` — forwards to `storage.getUser(userId)`, used only to enrich adult eater rows at read time (the same 1:1 delegation the Profile binding's port already performs).

`syncMembersAsEaters` is deliberately NOT exposed — it is a write (it inserts `household_eaters` rows for newly-synced members) and this binding is read-only by construction; unlike the human `/api/household/eaters` route, this binding never lazily syncs.

Production factory `createStorageHouseholdReadPort()` uses dynamic imports so loading the Intelligence Platform module never opens a database connection at import time.

### Handler (`server/intelligence/handlers/household-read-handler.ts`)

`createHouseholdReadHandler(resolvePort)` returns a `CapabilityHandler` that:

1. Calls `readOnlyVerbGuard(intent, ["read"], "Household")` — `explain`, `add`, `delete` all fall through this guard and return an honest gap.
2. Calls `requireUserId(context, "Household")` — anonymous → `denied`.
3. Resolves the port once.
4. `read`: validates `parameters.scope` is one of `"household"` / `"dietary-context"` / `"eaters"` (gap listing the supported scopes otherwise, including when `scope` is missing). Resolves `householdId` via `port.getHouseholdForUser(userId)`, wrapped in try/catch — a thrown `Error` (no active household membership) is translated into an honest `gap`, never `denied`, never a fabricated empty household. Dispatches per scope:
   - `"household"`: `port.getHouseholdWithMembers(householdId)` → projects `{ id, name, myRole, members }`. `myRole` is found by matching the caller's own `userId` against the returned membership rows (mirrors `server/routes.ts:8383`, defaulting to `"member"` if absent — an ownership-scoped lookup of the caller's own row, not a business judgement). `inviteCode` is never included in the projection.
   - `"dietary-context"`: `port.getHouseholdDietaryContext(userId)` → projected unmodified (`members`, `aggregated`) — the owner already computed this aggregation; the handler does not recompute it.
   - `"eaters"`: `port.getHouseholdEaters(householdId)` → each row converted via the existing shared `dbEaterToHouseholdEater()` helper (`@shared/household-eater.ts`, not reinvented), then adult rows (`userId != null`) enriched from `port.getUser(userId)`'s `dietPattern`/`dietRestrictions` using the same `DIET_PATTERN_TO_DIET_TYPE` mapping table already duplicated in `server/routes.ts`, `server/lib/household-meal-matcher.ts`, and two test/script files — a direct mirror of `server/routes.ts:8526–8541`, not new business logic. Child rows are returned unchanged.

**Result shapes:** `HouseholdView` (`scope`, `id`, `name`, `myRole`, `members: HouseholdMemberView[]` — no `inviteCode`), `HouseholdDietaryContextView` (passthrough of the owner's `HouseholdDietaryContext`), `HouseholdEatersView` (`eaters: HouseholdEaterView[]`), unioned as `HouseholdReadResult`.

**Resolved open decision:** the Card flagged that the live human route returns `households.inviteCode` to members and recommended excluding it from the AI-facing projection without making the call itself. This handler makes that call: `HouseholdView` has no `inviteCode` field, and `toMemberView()`/the household-scope branch never reference `household.inviteCode`.

### Binding (`server/intelligence/bindings/household.ts`)

- `HOUSEHOLD_CAPABILITY_ID = "household"` — the existing registry entry.
- `HOUSEHOLD_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"]` — truthful; `explain`/`add`/`delete` are NOT listed.
- `bindHouseholdReadCapability(platform, resolvePort?)` — registers the handler; production default is `createStorageHouseholdReadPort`.

---

## FILES CREATED / MODIFIED

### New files (5)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/household-read-port.ts` | Delegation surface — `HouseholdReadPort` interface + production factory |
| `server/intelligence/handlers/household-read-handler.ts` | Execution handler — verb guard, scope dispatch, adult-eater enrichment mirror, honest gaps |
| `server/intelligence/bindings/household.ts` | Activation — registers handler + executableIntents on the singleton |
| `server/tests/test-intelligence-household-binding.ts` | Test suite — 51 assertions across 9 sections |
| `docs/implementation/INT13_HOUSEHOLD_CAPABILITY_BINDING_IMPLEMENTATION.md` | This report |

### Edited files (9)

| File | Change |
|---|---|
| `server/intelligence/intelligence-platform.ts` | Added `bindHouseholdReadCapability(intelligencePlatform)` call and updated module comments (also added the previously-missing INT12 module comment paragraph — pre-existing drift, same pattern INT12 fixed for INT10) |
| `server/intelligence/index.ts` | Added exports for port, handler, binding, executable-intents constant, result types |
| `server/intelligence/README.md` | Added module table rows, state block (INT13), architecture diagram entries, test entry |
| `package.json` | Added `test:intelligence-household-binding` script; appended to `"test"` script |
| `server/tests/test-intelligence-diary-binding.ts` | Scope-lock updated from 6 → 7 |
| `server/tests/test-intelligence-pantry-binding.ts` | Scope-lock updated from 6 → 7 |
| `server/tests/test-intelligence-nutrition-knowledge-binding.ts` | Scope-lock updated from 6 → 7 |
| `server/tests/test-intelligence-profile-binding.ts` | Scope-lock updated from 6 → 7 (the immediately previous binding, per INT7A factory step) |
| `server/tests/test-intelligence-shopping-binding.ts` | Read-only allow-list guard extended to include `household` (capabilityClass `"destructive"`, not `"read-only"`/`aiAccess "R"`, so it needed an explicit id exception like `pantry`/`diary`/`profile`) |
| `server/tests/test-intelligence-registry-executability.ts` | Added `singletonHousehold` assertions; removed `household` from the unbound-capabilities list; updated `listExecutableCapabilities()` count from 6 → 7; updated header comment counts |
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | Added full **Household (INT13)** Phase 1 entry; updated the Phase 2 Capability Index table (`household` → Bound); updated Cross-Cutting Patterns and Scope Lock counts |
| `docs/architecture/capabilities/household.md` | Status header updated: "Capability Card complete — not yet bound" → "Bound under INT13", noting the resolved OPEN DECISION |

---

## DATA IMPACT

| Reads existing data | ✅ Yes — `households` / `household_members` / `household_eaters` (own household only) + `users` (adult-eater enrichment, own household's members only) |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| Never surface another household's membership or eaters | Structural — there is no id parameter on the read verb; `householdId` is resolved exclusively from `getHouseholdForUser(requireUserId(context))`. Tested via the "no household → gap" + delegation-call assertions |
| Never fabricate dietary restrictions or diet types | An adult eater with no stored `dietPattern` projects `defaultDietTypes: []`, never invented; child eaters are surfaced with their stored values unchanged; `dietary-context` is projected unmodified from the owner, never recomputed |
| `inviteCode` (join secret) never surfaced | `HouseholdView` has no `inviteCode` field — resolves the Capability Card's OPEN DECISION (excluded). Tested via `Object.prototype.hasOwnProperty` assertion |
| No write code path | Port has no write methods (and deliberately omits `syncMembersAsEaters`); handler has no mutation; `add`/`delete` gap via `readOnlyVerbGuard`; `explain` likewise has no live code path |
| Caller with no household → honest gap, never denied, never fabricated | `getHouseholdForUser()`'s thrown `Error` is caught and translated to `gap()`, distinct from the `denied()` path used for anonymous callers |

---

## TESTING

Test file: `server/tests/test-intelligence-household-binding.ts`
Run: `npm run test:intelligence-household-binding`
Result: **51 passed, 0 failed**

| Section | Assertions |
|---|---|
| Capability lookup | household is `available`; exactly 7 live capabilities (scope lock); executableIntents declares read; explain/add/delete NOT in executableIntents |
| Permission validation | anonymous read → `denied` |
| Honest gap — no household | caller with no active household membership → `gap`, never `denied`, never a fabricated household |
| Read scope: household | id/name/myRole/members surfaced from the owner; `myRole` resolves per-caller; `inviteCode` never surfaced; delegation to `getHouseholdForUser`/`getHouseholdWithMembers` observed |
| Read scope: dietary-context | result is the owner's value unmodified (members + aggregated); delegation to `getHouseholdDietaryContext` observed |
| Read scope: eaters | adult eaters enriched from `users.dietPattern`/`dietRestrictions` (incl. the no-dietPattern → empty-array case); child eater left unchanged; no `getUser` call attempted for the child eater; delegation to `getHouseholdEaters` + `getUser` observed |
| Honest gaps | missing scope → gap; unsupported scope → gap |
| Unsupported intent | `search` → `unsupported_intent`; `share` → `unsupported_intent` |
| Read-only enforcement | `explain` → gap (read-only message); `add`/`delete` (unconfirmed) → `confirmation_required`; `add`/`delete` (confirmed) → gap; read verbs never require confirmation |

**Full suite after this workstream:** `npm test` — **0 failures** across all intelligence and non-intelligence test files, including all updated scope-lock assertions.

---

## SCOPE LOCK

**What was NOT built (and must not be built here):**

- No `explain` handler — the Card confirms there is no stored rationale on membership or eater records.
- No `add`/`delete` handler — write operations (household creation, member invite/removal, eater create/update) remain owned by the Household service via the existing `/api/household/*` routes; this binding is read-only by construction.
- No `syncMembersAsEaters` call — the human `/api/household/eaters` route lazily syncs missing eater rows on every read; this binding does not, because that sync is a write and the port has no write methods by construction.
- No computed/derived fields beyond the one the Card explicitly requires (adult-eater diet enrichment, a direct mirror of `server/routes.ts:8526–8541`) — `dietary-context` aggregation is surfaced exactly as the owner computed it, never recomputed in the handler.
- No `inviteCode` exposure — resolves the Card's OPEN DECISION by exclusion.
- No changes to the Household owner's business logic, data model, or routes (`/api/household`, `/api/household/eaters`, `/api/household/dietary-context`, member invite/remove are all untouched).
- No HTTP routes, no UI, no schema changes.
- No new capability registered — the existing `household` registry entry was used as-is; `capability-registry.ts` itself was not edited (availability flips at runtime via `registerHandler`, matching every prior binding).
- No changes to any other capability binding's behaviour — only their test assertions were brought current (scope-lock counts; shopping's read-only allow-list guard).

---

## DEFINITION OF DONE

- [x] Rollback tag `int13-rollback-pre-household-binding` created and reported before further code was written
- [x] Architecture Compliance gate: PASS (all 9 AI checks + 6 architecture checks)
- [x] Port file created (`household-read-port.ts`) — 5 methods, no business logic, dynamic import, injectable
- [x] Handler file created (`household-read-handler.ts`) — verb guard first, userId required, port resolved once, no-household honest gap, explicit projections (no `inviteCode`, no raw row forwarding), honest gaps throughout
- [x] Binding file created (`household.ts`) — `HOUSEHOLD_EXECUTABLE_INTENTS` declared, `bindHouseholdReadCapability` exported
- [x] `intelligence-platform.ts` updated — `bindHouseholdReadCapability(intelligencePlatform)` added
- [x] `index.ts` updated — all port/handler/binding/result-type exports added
- [x] `README.md` updated — module table + state block + diagram + test entry
- [x] `package.json` updated — `test:intelligence-household-binding` added to both `"test"` and as a standalone script
- [x] Previous binding scope-lock assertions updated (diary, pantry, nutrition-knowledge, profile: 6→7; shopping: allow-list extended; registry-executability: singleton assertions added + count 6→7)
- [x] Developer Capability Registry updated: full Household (INT13) Phase 1 entry added; Phase 2 index updated
- [x] Canonical Capability Card status header updated to reflect the binding and the resolved open decision
- [x] Test suite passes: **51/51** (household binding test)
- [x] Full test suite passes: **0 failures** across all intelligence + non-intelligence tests
- [x] `npx tsc --noEmit`: no new type errors introduced (pre-existing, unrelated errors in other files untouched)
- [x] Data impact: reads only, no schema changes, no backfill
- [x] Trust rules verified by test assertions
- [x] Implementation report saved at `docs/implementation/INT13_HOUSEHOLD_CAPABILITY_BINDING_IMPLEMENTATION.md`
