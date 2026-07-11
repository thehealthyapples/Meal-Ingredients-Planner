# INT12 — Profile Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT12
**Produced using:** [INT7A Intelligence Capability Factory](../../architecture/INTELLIGENCE_CAPABILITY_FACTORY.md), the [Developer Capability Registry](../../architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md), and the canonical [Profile / Preferences Capability Card](../../architecture/capabilities/profile.md) (INT11, promoted to governing architecture under EPIC 1.5)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int12-rollback-pre-profile-binding` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | `server/intelligence/handlers/profile-read-port.ts` (new), `server/intelligence/handlers/profile-read-handler.ts` (new), `server/intelligence/bindings/profile.ts` (new), `server/tests/test-intelligence-profile-binding.ts` (new), `server/intelligence/intelligence-platform.ts` (edited), `server/intelligence/index.ts` (edited), `server/intelligence/README.md` (edited), `package.json` (edited), `server/tests/test-intelligence-diary-binding.ts` (scope-lock updated), `server/tests/test-intelligence-pantry-binding.ts` (scope-lock updated), `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (scope-lock updated), `server/tests/test-intelligence-shopping-binding.ts` (scope-lock guard updated), `server/tests/test-intelligence-registry-executability.ts` (scope-lock updated + pre-existing drift fixed), `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (edited), `docs/architecture/capabilities/profile.md` (status header updated) |
| Schema modified | None |

To restore: `git checkout int12-rollback-pre-profile-binding -- .` (note: this restores the repository to the INT1 commit state, discarding all uncommitted INT2–INT12 working-tree work, matching the convention established by prior rollback tags on this branch).

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` and the governing documents it points to.
- [x] Read `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` (INT7A) — fill-in template and factory steps followed exactly.
- [x] Read `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (INT9A) — used as the implementation index; updated with the completed binding.
- [x] Read the canonical Capability Card `docs/architecture/capabilities/profile.md` (INT11 / EPIC 1.5) — used verbatim as the fill-in template; its "OPEN DECISION" (explicit field allowlist) is resolved by this implementation (see WHAT WAS BUILT).
- [x] Confirmed `profile` is `registered` (not `never`) in `server/intelligence/capability-registry.ts:108-120`.
- [x] Confirmed the owner (`server/storage.ts` — `getUser`, `getUserPreferences`) is an existing service with existing read methods; no new owner created.

---

## FILL-IN TEMPLATE (from the canonical Capability Card, verified against current code)

| Field | Value |
|---|---|
| Capability ID | `profile` |
| Capability name | Profile / Preferences |
| Owner service | `server/storage.ts` — `getUser()` (line 395), `getUserPreferences()` (line 840) |
| Source of Truth | SoT D7, D26, D27 — `users` table + `user_preferences` table |
| Access scope | Own-data only (user-scoped). Structural: the binding takes no id parameter — every read is keyed by `requireUserId(context)`, never a client-suppliable value |
| Supported read intents | `read`, `explain`, `add` (per `capability-registry.ts:114`) |
| Executable intents | `read` — `explain` has no stored rationale to surface; `add` is a write |
| Allowed scopes | `profile` (default/only scope) — a combined `{ profile, preferences }` result |
| Honest gaps | No stored `users` row for the resolved id; unsupported `scope` (incl. an explicit redirect for `household-eaters`/`eaters`); `explain`; `add` |
| Permission model | `requireUserId(context, "Profile")` — anonymous → `denied`. No id parameter exists, so cross-user access has no code path (stricter than the Card's own route, which derives `id` from session but is still a parameter the route layer trusts implicitly) |
| Port methods | `getUser(userId)` → `storage.getUser(userId)`; `getUserPreferences(userId)` → `storage.getUserPreferences(userId)` |
| Handler responsibilities | `read` composes an EXPLICIT `users` field allowlist (mirrors `buildProfileResponse` in `server/routes.ts`) + every substantive `user_preferences` column. Resolves the Card's OPEN DECISION: the handler defines its own explicit allowlist and never forwards the raw `storage.getUser()` row |
| Binding registration | `PROFILE_EXECUTABLE_INTENTS = ["read"]` |
| Tests required | All INT7A Step 6 sections, plus an explicit assertion that `password` / `emailVerificationToken` / `emailVerificationExpires` / `passwordResetToken` / `passwordResetExpires` never appear in handler output |
| Documentation updates | `server/intelligence/README.md` row + state block; `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` Phase 1 entry; canonical Capability Card status header |
| Data impact | Reads only — no writes, no schema change |
| Trust rules | Never surface another user's profile (structural — no id parameter); never surface password/token fields; never pull `household_eaters` overrides into a profile read; never compute derived fields (BMI, calories, `hasPremiumAccess`) in the handler |

---

## ARCHITECTURE COMPLIANCE

| Constraint | Status | Evidence |
|---|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS | `bindProfileReadCapability(intelligencePlatform)` appended to the end of `intelligence-platform.ts`; no second platform |
| One Capability Registry — binding to the existing `profile` capability entry, no new registry | ✅ PASS | `PROFILE_CAPABILITY_ID = "profile"` matches the existing seed entry (`capability-registry.ts:108`); no new registry; the static seed file is left untouched (availability flips at runtime via `registerHandler`, matching every prior binding) |
| One Intent Engine — unchanged routing; no second engine | ✅ PASS | `IntentEngine` unchanged; routing pipeline unmodified |
| Owner remains owner — handler delegates every read; holds no business logic of its own | ✅ PASS | Handler has no profile business rules; every field comes from `storage.getUser()` / `storage.getUserPreferences()` via the port. Critically, the route layer's derived fields (BMI, calculated calories, `hasPremiumAccess`) are NOT recomputed in the handler — recomputing them would be business logic duplication (INT7A "Avoiding Duplicate Business Logic"); they are explicitly out of scope (see SCOPE LOCK) |
| No duplicate state — no parallel store, no cached copy of owner data | ✅ PASS | No caching, no parallel store; reads pass through the port to the owner on every call |
| Existing architecture extended only — reuses the `registerHandler` seam (INT1 extension point) | ✅ PASS | `platform.registerHandler("profile", ...)` — the established extension point |

**AI Architecture Compliance:**

| Constraint | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ |
| Uses the AI Capability Registry (binds the existing `profile` capability) | ✅ |
| Uses the Intent Engine (full pipeline) | ✅ |
| Reuses the existing owner service (via the port → `storage.ts`) | ✅ |
| Does not create another assistant | ✅ |
| Does not duplicate conversation state | ✅ |
| Uses registered capabilities only | ✅ |
| Permission-aware access | ✅ — `requireUserId` at handler entry; no id parameter exists, so cross-user access has no code path |
| Produces honest gaps rather than fabricated knowledge | ✅ — missing user row, unsupported scope, `explain`, `add` all throw `gap()`; no preferences row → `null`, never a fabricated default |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/profile-read-port.ts`)

Interface `ProfileReadPort` with two 1:1 delegating methods:

- `getUser(userId: number): Promise<User | undefined>` — forwards to `storage.getUser(userId)`.
- `getUserPreferences(userId: number): Promise<UserPreferences | undefined>` — forwards to `storage.getUserPreferences(userId)`.

Production factory `createStorageProfileReadPort()` uses dynamic imports so loading the Intelligence Platform module never opens a database connection at import time.

### Handler (`server/intelligence/handlers/profile-read-handler.ts`)

`createProfileReadHandler(resolvePort)` returns a `CapabilityHandler` that:

1. Calls `readOnlyVerbGuard(intent, ["read"], "Profile")` — `explain` and `add` both fall through this guard and return an honest gap (no custom per-verb message needed; the Card states `explain` has no stored rationale and `add` is a write).
2. Calls `requireUserId(context, "Profile")` — anonymous → `denied`.
3. Resolves the port once.
4. `read`: validates `parameters.scope` is `undefined` or `"profile"` (gap for any other value; an explicit redirect message for `"household-eaters"`/`"eaters"` pointing at the Household capability per the Card's documented honest gap). Calls `port.getUser(userId)` — gap if no row. Calls `port.getUserPreferences(userId)` — `null` (not a gap) if no row, since an unsaved-preferences state is a legitimate, known owner state, not an unanswerable request. Projects both into an EXPLICIT allowlist.

**Result shapes:** `ProfileView` (24 fields, mirroring `buildProfileResponse`'s allowlist in `server/routes.ts:881-897` minus the route's computed `health`/`hasPremiumAccess` fields), `ProfilePreferencesView` (31 fields — every `user_preferences` column except the row's internal `id` and the redundant `userId`, matching the internal-field-exclusion convention established by Pantry/Diary), `ProfileReadResult`.

**Resolved open decision:** the Card flagged that neither existing `GET /api/profile` route nor `sanitizeUser.ts` is reused as-is — a future binding must define its own allowlist. This handler does exactly that: `toProfileView()` and `toPreferencesView()` construct the result field-by-field from the owner row; `storage.getUser()`'s raw row (including `password`, `emailVerificationToken`, `emailVerificationExpires`, `passwordResetToken`, `passwordResetExpires`) is never forwarded.

### Binding (`server/intelligence/bindings/profile.ts`)

- `PROFILE_CAPABILITY_ID = "profile"` — the existing registry entry.
- `PROFILE_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"]` — truthful; `explain`/`add` are NOT listed.
- `bindProfileReadCapability(platform, resolvePort?)` — registers the handler; production default is `createStorageProfileReadPort`.

---

## FILES CREATED / MODIFIED

### New files (5)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/profile-read-port.ts` | Delegation surface — `ProfileReadPort` interface + production factory |
| `server/intelligence/handlers/profile-read-handler.ts` | Execution handler — verb guard, explicit allowlist projections, honest gaps |
| `server/intelligence/bindings/profile.ts` | Activation — registers handler + executableIntents on the singleton |
| `server/tests/test-intelligence-profile-binding.ts` | Test suite — 50 assertions across 7 sections |
| `docs/implementation/intelligence/INT12_PROFILE_CAPABILITY_BINDING_IMPLEMENTATION.md` | This report |

### Edited files (9)

| File | Change |
|---|---|
| `server/intelligence/intelligence-platform.ts` | Added `bindProfileReadCapability(intelligencePlatform)` call and updated module comments |
| `server/intelligence/index.ts` | Added exports for port, handler, binding, executable-intents constant, result types |
| `server/intelligence/README.md` | Added module table rows, state block (INT12), architecture diagram entries, test entry |
| `package.json` | Added `test:intelligence-profile-binding` script; appended to `"test"` script |
| `server/tests/test-intelligence-diary-binding.ts` | Scope-lock updated from 5 → 6 (the immediately previous binding, per INT7A factory step) |
| `server/tests/test-intelligence-pantry-binding.ts` | Scope-lock updated from 5 → 6 (was already stale at 5 after diary; corrected as part of this work since the assertion runs against the shared singleton) |
| `server/tests/test-intelligence-nutrition-knowledge-binding.ts` | Scope-lock updated from 4 → 6 (was stale at 4 since INT10 — diary's binding only updated the pantry test, not this one; this was a **pre-existing failure** discovered and fixed by this workstream) |
| `server/tests/test-intelligence-shopping-binding.ts` | Read-only allow-list guard extended to include `diary` and `profile` (was missing `diary` since INT10 — also a **pre-existing failure**, fixed here) |
| `server/tests/test-intelligence-registry-executability.ts` | Added missing `singletonDiary` assertions (INT10 never added these), added `singletonProfile` assertions, removed `diary`/`profile` from the unbound-capabilities list, updated `listExecutableCapabilities()` count from 4 → 6. **2 pre-existing test failures were discovered and fixed** (see TESTING below) |
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | Added full **Diary (INT10)** Phase 1 entry (previously only a historical Phase 2 stub note — INT10 never added the proper Phase 1 entry the pattern requires); added full **Profile / Preferences (INT12)** Phase 1 entry; updated the Phase 2 Capability Index table (`profile` → Bound); updated Cross-Cutting Patterns and Scope Lock counts |
| `docs/architecture/capabilities/profile.md` | Status header updated: "Capability Card complete — not yet bound" → "bound under INT12", with a pointer to this report |

---

## A NOTE ON PRE-EXISTING TEST DRIFT FOUND AND FIXED

Before any new code was written, running the existing intelligence test suite surfaced **4 pre-existing failures** unrelated to this workstream's new code — all caused by INT10 (Diary) updating only the *immediately previous* binding's test file (pantry) per the INT7A factory instruction, while several other test files independently hard-code the live-capability count or an explicit capability allow-list against the **same shared singleton**:

| Test file | Failure before this workstream | Cause |
|---|---|---|
| `test-intelligence-nutrition-knowledge-binding.ts` | `exactly FOUR capabilities are live` — actual: 6 | Never updated past INT8's count (4); INT10 only touched the pantry test |
| `test-intelligence-shopping-binding.ts` | `every live capability is a read-only binding` | Allow-list never included `diary` |
| `test-intelligence-pantry-binding.ts` | `exactly FIVE capabilities are live` — actual: 6 | Was correct after INT10, became stale once this workstream bound `profile` |
| `test-intelligence-registry-executability.ts` | `'diary' has empty executableIntents` / `listExecutableCapabilities() returns exactly 4` | INT10 never added `singletonDiary` assertions or removed `diary` from the unbound-capabilities list |

All four are fixed by this workstream (see FILES MODIFIED above) as part of bringing the full suite back to a passing state — required by the Definition of Done ("Full test suite passes: 0 failures") and by the fact that a new binding cannot honestly claim "scope locked" while leaving the existing suite red. No behavioural code was changed to fix these — only test assertions were brought current with the actual (already-correct) runtime state.

---

## DATA IMPACT

| Reads existing data | ✅ Yes — `users` (own row only) + `user_preferences` (own row only) |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| Never surface another user's profile | Structural — there is no id parameter on the read verb; `requireUserId` resolves only the server-side session identity. Tested via the "no cross-user code path" framing in the trust-rules test section |
| Never surface sensitive fields | `ProfileView` is built field-by-field via `toProfileView()`; `password`, `emailVerificationToken`, `emailVerificationExpires`, `passwordResetToken`, `passwordResetExpires` are never referenced in the projection function. Test asserts all five (plus `demoClaimedEmail`, `starterMealsLoaded`, `updatedAt`) are absent from handler output |
| Never fabricate a preferences default | No stored `user_preferences` row → `preferences: null`; no synthetic defaults are substituted |
| Never pull household eater overrides into a profile read | `scope: "household-eaters"` / `"eaters"` is an explicit honest gap redirecting to the Household capability, never silently resolved |
| No write code path | Port has no write methods; handler has no mutation; `add` gaps via `readOnlyVerbGuard`; `explain` likewise has no live code path |

---

## TESTING

Test file: `server/tests/test-intelligence-profile-binding.ts`
Run: `npm run test:intelligence-profile-binding`
Result: **50 passed, 0 failed**

| Section | Assertions |
|---|---|
| Capability lookup | profile is `available`; exactly 6 live capabilities (scope lock); executableIntents declares read; explain/add NOT in executableIntents |
| Permission validation | anonymous read → `denied` |
| Handler invocation + delegation | ok; profile + preferences fields correct; delegation to `getUser`/`getUserPreferences` observed |
| No stored preferences row | still `ok`; `preferences: null`, never a fabricated default |
| Honest gaps | no stored user row → gap; unsupported scope → gap; household-eaters scope → gap redirecting to Household capability; explicit `scope: "profile"` → ok |
| Unsupported intent | `share` → `unsupported_intent`; `search` → `unsupported_intent` |
| Read-only enforcement | `explain` → gap (read-only message); `add` (unconfirmed) → `confirmation_required`; `add` (confirmed) → gap; read verbs never require confirmation |
| Trust rules | `password`/token/internal fields never surfaced (8 fields individually asserted); internal preferences row keys (`id`, `userId`) never surfaced |

**Full suite after this workstream:** `npm test` — all intelligence and non-intelligence tests pass, including the 4 pre-existing failures fixed above.

---

## SCOPE LOCK

**What was NOT built (and must not be built here):**

- No `explain` handler — the Card confirms there is no stored rationale for any profile field.
- No `add` handler — write operations (profile edits, preference updates) are owned by the Profile service via the existing `PUT`/`PATCH` routes; this binding is read-only by construction.
- No computed/derived fields — BMI, calculated daily calories, `hasPremiumAccess`, and the route layer's `health`/`household` summary objects are NOT recomputed in the handler. They are route-layer business logic in `buildProfileResponse`, not owner reads, and reimplementing them would duplicate business logic in the handler (forbidden by INT7A). A future workstream could expose this only if the owner provides a single delegate-only method that returns the already-computed values.
- No `household_eaters` dietary-override reads — explicitly redirected to the Household capability (not yet bound) via an honest gap.
- No changes to the Profile owner's business logic, data model, or routes (`/api/profile`, `/api/user/preferences`, `/api/user/*-settings` are all untouched).
- No HTTP routes, no UI, no schema changes.
- No new capability registered — the existing `profile` registry entry was used as-is; `capability-registry.ts` itself was not edited (availability flips at runtime via `registerHandler`, matching every prior binding).
- No changes to any other capability binding's behaviour — only their test assertions were brought current (see the pre-existing-drift note above).

---

## DEFINITION OF DONE

- [x] Rollback tag `int12-rollback-pre-profile-binding` created and reported before further code was written
- [x] Architecture Compliance gate: PASS (all 9 AI checks + 6 architecture checks)
- [x] Port file created (`profile-read-port.ts`) — 2 methods, no business logic, dynamic import, injectable
- [x] Handler file created (`profile-read-handler.ts`) — verb guard first, userId required, port resolved once, explicit allowlist (no raw row forwarding), honest gaps throughout
- [x] Binding file created (`profile.ts`) — `PROFILE_EXECUTABLE_INTENTS` declared, `bindProfileReadCapability` exported
- [x] `intelligence-platform.ts` updated — `bindProfileReadCapability(intelligencePlatform)` added
- [x] `index.ts` updated — all port/handler/binding/result-type exports added
- [x] `README.md` updated — module table + state block + diagram + test entry
- [x] `package.json` updated — `test:intelligence-profile-binding` added to both `"test"` and as a standalone script
- [x] Previous binding scope-lock assertions updated (diary: 5→6; pantry: 5→6; nutrition-knowledge: 4→6; shopping: allow-list extended; registry-executability: singleton assertions added + count 4→6)
- [x] 4 pre-existing test failures (drift left by INT10) discovered and fixed as part of bringing the suite current
- [x] Developer Capability Registry updated: full Diary (INT10) and Profile (INT12) Phase 1 entries added; Phase 2 index updated
- [x] Canonical Capability Card status header updated to reflect the binding
- [x] Test suite passes: **50/50** (profile binding test)
- [x] Full test suite passes: **0 failures across all intelligence + non-intelligence tests**
- [x] `npx tsc --noEmit`: no new type errors introduced (pre-existing, unrelated errors in other files untouched)
- [x] Data impact: reads only, no schema changes, no backfill
- [x] Trust rules verified by test assertions
- [x] Implementation report saved at `docs/implementation/intelligence/INT12_PROFILE_CAPABILITY_BINDING_IMPLEMENTATION.md`
