# INT15 — Meals Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT15
**Produced using:** [INT7A Intelligence Capability Factory](../../architecture/INTELLIGENCE_CAPABILITY_FACTORY.md), the [Developer Capability Registry](../../architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md), and the canonical [Meals / Cookbook Capability Card](../../architecture/capabilities/meals.md) (INT11, promoted to governing architecture under EPIC 1.5)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int15-rollback-pre-meals-binding` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | `server/intelligence/handlers/meals-read-port.ts` (new), `server/intelligence/handlers/meals-read-handler.ts` (new), `server/intelligence/bindings/meals.ts` (new), `server/tests/test-intelligence-meals-binding.ts` (new), `server/intelligence/intelligence-platform.ts` (edited), `server/intelligence/index.ts` (edited), `server/intelligence/README.md` (edited), `package.json` (edited), `server/tests/test-intelligence-diary-binding.ts` (scope-lock updated), `server/tests/test-intelligence-pantry-binding.ts` (scope-lock updated), `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (scope-lock updated), `server/tests/test-intelligence-profile-binding.ts` (scope-lock updated), `server/tests/test-intelligence-household-binding.ts` (scope-lock updated), `server/tests/test-intelligence-partners-binding.ts` (scope-lock updated — immediately previous binding), `server/tests/test-intelligence-shopping-binding.ts` (read-only allow-list guard extended), `server/tests/test-intelligence-registry-executability.ts` (scope-lock updated + `singletonMeals` assertions added + `meals` removed from the unbound-capabilities list), `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (edited), `docs/architecture/capabilities/meals.md` (status header updated) |
| Schema modified | None |

To restore: `git checkout int15-rollback-pre-meals-binding -- .` (note: this restores the repository to the INT1 commit state, discarding all uncommitted INT2–INT15 working-tree work, matching the convention established by prior rollback tags on this branch).

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` and the governing documents it points to.
- [x] Read `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` (INT7A) — fill-in template and factory steps followed exactly.
- [x] Read `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (INT9A) — used as the implementation index; updated with the completed binding.
- [x] Read the canonical Capability Card `docs/architecture/capabilities/meals.md` (INT11 / EPIC 1.5) — used verbatim as the fill-in template. The Card's CRITICAL FINDING (`storage.getMeal`/`getMealItems` have no ownership filter at the storage layer; ownership is enforced entirely at the route layer) and its OPEN DECISION on `search` (the owner's `lookupMeals` has zero scoping) are the binding boundaries: the handler replicates the route's ownership check for `detail`, and `search` ships as a gap, unresolved.
- [x] Confirmed `meals` is `registered` (not `never`) in `server/intelligence/capability-registry.ts` (seed entry, `displayName: "Cookbook / Meals"`).
- [x] Confirmed the owner (`server/storage.ts` — `getMeals`, `getMeal`, `getMealsSummary`, `getSystemMeals`, `getSystemMealsSummary`, `getMealItems`) are existing services with existing read methods; no new owner created. Confirmed the registry's `owningService` string (`meal-service.ts, recipe-swap-engine.ts, meal-resolution-service.ts`) is NOT the actual owner, per the Card's correction.

---

## FILL-IN TEMPLATE (from the canonical Capability Card, verified against current code)

| Field | Value |
|---|---|
| Capability ID | `meals` |
| Capability name | Cookbook / Meals |
| Owner service | `server/storage.ts` — `getMeals(userId)`, `getMeal(id)`, `getMealsSummary(userId)`, `getSystemMeals()`/`getSystemMealsSummary()`, `getMealItems(mealId)`, `lookupMeals(query)` (not exposed — see Honest gaps) |
| Source of Truth | SoT D12 — `meals` + `meal_items` tables. Nutrition is a SEPARATE table, joined by `mealId` — never embedded in the meal record and out of this capability's scope |
| Access scope | CORRECTION to prior stub: own-data is USER-scoped (`storage.getMeals` filters by `userId`), not household-scoped, plus system meals (shared across all authenticated users, `isSystemMeal=true`) |
| Supported read intents | `read`, `explain`, `search`, `recommend`, `generate`, `add`, `replace`, `delete`, `import`, `share` (per `capability-registry.ts` seed) |
| Executable intents | `read` — `search` is a documented open decision (unresolved, ships as a gap); `explain`/`recommend` have no safe, grounded owner read |
| Allowed scopes | `list` (`getMeals(userId)` + `getSystemMeals()`, merged, mirrors `server/routes.ts:1160`), `summary` (`getMealsSummary(userId)` + `getSystemMealsSummary()`), `detail` (`getMeal(id)` + `getMealItems(mealId)`, WITH a mandatory ownership check the handler replicates — the owner method itself does not filter) |
| Honest gaps | `recommend` — the existing `/api/meals/recommended` route computes ranking INLINE AT THE ROUTE LAYER, not via a delegate-only owner method; reimplementing that would be business logic in the handler (forbidden by INT7A). `generate`/`add`/`replace`/`delete`/`import`/`share` — write — gap. `explain` — no stored rationale field on meals — gap. Meal id not owned by caller and not a system meal — `denied`. `search` (`lookupMeals`) — OPEN DECISION, ships as a gap |
| Permission model | CRITICAL FINDING: `storage.getMeal(id)` and `storage.getMealItems(mealId)` have NO ownership filter at the storage layer — any id returns its row regardless of caller. Ownership is enforced entirely at the route layer (`meal.userId !== req.user!.id && !meal.isSystemMeal` → 404, `server/routes.ts:1183`). The handler replicates this EXACT check before returning detail/items data — a documented, narrow exception to "owner remains owner" (an ownership/auth gate, not domain business logic), permitted by INT7A's allowed-list |
| Port methods | `getMeals(userId)` → `storage.getMeals(userId)`; `getSystemMeals()` → `storage.getSystemMeals()`; `getMealsSummary(userId)` → `storage.getMealsSummary(userId)`; `getSystemMealsSummary()` → `storage.getSystemMealsSummary()`; `getMeal(id)` → `storage.getMeal(id)`; `getMealItems(mealId)` → `storage.getMealItems(mealId)` |
| Handler responsibilities | Dispatch per scope; for `detail`, replicate the route's ownership check before exposing the meal or its items; project explicit view types (full Meal fields for `list`/`detail`, the owner's own `MealSummary` shape for `summary`) — never nutrition |
| Binding registration | `MEALS_EXECUTABLE_INTENTS = ["read"]` (add `"search"` only after the open decision above is resolved) |
| Tests required | Standard set + explicit ownership-denial test for `detail` (id not owned, not system → denied, identical message to a nonexistent id) |
| Documentation updates | `server/intelligence/README.md` row + state block; `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` Phase 1 entry + Phase 2 index update; canonical Capability Card status header |
| Data impact | Reads only |
| Trust rules | Never fabricate ingredient quantities or nutritional values — nutrition is a separate table, joined by `mealId`; never read, so never has the opportunity to fabricate. Never expose another user's private meal via `detail` (ownership check) or `search` (gapped, not bound) |

---

## ARCHITECTURE COMPLIANCE

| Constraint | Status | Evidence |
|---|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS | `bindMealsReadCapability(intelligencePlatform)` appended to the end of `intelligence-platform.ts`; no second platform |
| One Capability Registry — binding to the existing `meals` capability entry, no new registry | ✅ PASS | `MEALS_CAPABILITY_ID = "meals"` matches the existing seed entry; no new registry; the static seed file is left untouched (availability flips at runtime via `registerHandler`, matching every prior binding) |
| One Intent Engine — unchanged routing; no second engine | ✅ PASS | `IntentEngine` unchanged; routing pipeline unmodified |
| Owner remains owner — handler delegates every read; holds no business logic of its own | ✅ PASS | Handler has no meal business rules. The one exception — the `detail` ownership check — is a direct mirror of `server/routes.ts:1183`, a documented, narrow, INT7A-permitted exception (an auth gate, not domain logic), not invented logic |
| No duplicate state — no parallel store, no cached copy of owner data | ✅ PASS | No caching, no parallel store; reads pass through the port to the owner on every call |
| Existing architecture extended only — reuses the `registerHandler` seam (INT1 extension point) | ✅ PASS | `platform.registerHandler("meals", ...)` — the established extension point |

**AI Architecture Compliance:**

| Constraint | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ |
| Uses the AI Capability Registry (binds the existing `meals` capability) | ✅ |
| Uses the Intent Engine (full pipeline) | ✅ |
| Reuses the existing owner service (via the port → `storage.ts`) | ✅ |
| Does not create another assistant | ✅ |
| Does not duplicate conversation state | ✅ |
| Uses registered capabilities only | ✅ |
| Permission-aware access | ✅ — `requireUserId` at handler entry; `detail` additionally replicates the route's ownership check, since the owner method itself does not filter |
| Produces honest gaps rather than fabricated knowledge | ✅ — `explain`/`search`/`recommend`/missing-or-unsupported-scope/missing-`mealId` all throw `gap()`; a foreign or nonexistent meal id throws `denied()`; nutrition is never read, so it can never be fabricated |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/meals-read-port.ts`)

Interface `MealsReadPort` with six 1:1 delegating methods: `getMeals`, `getSystemMeals`, `getMealsSummary`, `getSystemMealsSummary`, `getMeal`, `getMealItems` — all direct forwards to `storage.ts`.

`lookupMeals` is deliberately NOT exposed — the Card's OPEN DECISION on `search` (zero ownership scoping at the storage layer; the live route only checks `isAuthenticated()`, not ownership) is left unresolved by this workstream, so the port has no method that could leak another user's private meal names.

Production factory `createStorageMealsReadPort()` uses dynamic imports so loading the Intelligence Platform module never opens a database connection at import time.

### Handler (`server/intelligence/handlers/meals-read-handler.ts`)

`createMealsReadHandler(resolvePort)` returns a `CapabilityHandler` that:

1. Calls `readOnlyVerbGuard(intent, ["read"], "Meals")` — `explain`, `search`, `recommend`, and every write verb all fall through this guard and return an honest gap.
2. Calls `requireUserId(context, "Meals")` — anonymous → `denied`.
3. Resolves the port once.
4. `read`: dispatches per scope —
   - `"list"`: merges `port.getMeals(userId)` with `port.getSystemMeals()`, projecting each row through `toMealView()` (every stored `meals` column except nutrition — there is no nutrition column on the table; nutrition lives in a separate table this binding never reads).
   - `"summary"`: merges `port.getMealsSummary(userId)` with `port.getSystemMealsSummary()`, projecting through `toMealSummaryView()` — the owner's own lighter shape (`ingredientCount` instead of raw `ingredients`/`instructions`).
   - `"detail"`: requires a `{ mealId }` parameter (gap if missing). Calls `port.getMeal(mealId)`. **Replicates `server/routes.ts:1183` exactly**: `if (!meal || (meal.userId !== userId && !meal.isSystemMeal)) throw denied(...)` — a single check producing the SAME message whether the id does not exist or belongs to someone else, so no existence leak is possible. On success, calls `port.getMealItems(mealId)` and returns the meal plus its items.
   - Any other (or missing) scope → gap naming the three supported scopes.

**Result shapes:** `MealsListReadResult`, `MealsSummaryReadResult`, `MealsDetailReadResult`, unioned as `MealsReadResult`. None carries a nutrition field — nutrition was never read.

### Binding (`server/intelligence/bindings/meals.ts`)

- `MEALS_CAPABILITY_ID = "meals"` — the existing registry entry.
- `MEALS_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"]` — truthful; `explain`/`search`/`recommend`/writes are NOT listed.
- `bindMealsReadCapability(platform, resolvePort?)` — registers the handler; production default is `createStorageMealsReadPort`.

---

## FILES CREATED / MODIFIED

### New files (5)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/meals-read-port.ts` | Delegation surface — `MealsReadPort` interface + production factory |
| `server/intelligence/handlers/meals-read-handler.ts` | Execution handler — verb guard, scope dispatch, replicated ownership check, honest gaps |
| `server/intelligence/bindings/meals.ts` | Activation — registers handler + executableIntents on the singleton |
| `server/tests/test-intelligence-meals-binding.ts` | Test suite — 45 assertions across 8 sections |
| `docs/implementation/intelligence/INT15_MEALS_CAPABILITY_BINDING_IMPLEMENTATION.md` | This report |

### Edited files (11)

| File | Change |
|---|---|
| `server/intelligence/intelligence-platform.ts` | Added `bindMealsReadCapability(intelligencePlatform)` call and updated module comments |
| `server/intelligence/index.ts` | Added exports for port, handler, binding, executable-intents constant, result types |
| `server/intelligence/README.md` | Added module table rows, state block (INT15), architecture diagram entries, test entry |
| `package.json` | Added `test:intelligence-meals-binding` script; appended to `"test"` script |
| `server/tests/test-intelligence-diary-binding.ts` | Scope-lock updated from 8 → 9 |
| `server/tests/test-intelligence-pantry-binding.ts` | Scope-lock updated from 8 → 9 |
| `server/tests/test-intelligence-nutrition-knowledge-binding.ts` | Scope-lock updated from 8 → 9 |
| `server/tests/test-intelligence-profile-binding.ts` | Scope-lock updated from 8 → 9 |
| `server/tests/test-intelligence-household-binding.ts` | Scope-lock updated from 8 → 9 |
| `server/tests/test-intelligence-partners-binding.ts` | Scope-lock updated from 8 → 9 (the immediately previous binding, per INT7A factory step) |
| `server/tests/test-intelligence-shopping-binding.ts` | Read-only allow-list guard extended to include `meals` (capabilityClass `"destructive"`, aiAccess `"W!"` — neither matches the guard's `"read-only"`/`"R"` defaults, so it needed an explicit id exception like `household`) |
| `server/tests/test-intelligence-registry-executability.ts` | Added `singletonMeals` assertions; removed `meals` from the unbound-capabilities list (now `["analyser", "templates", "administration"]`); updated `listExecutableCapabilities()` count from 8 → 9 and its "does NOT include" assertion target (`meals` → `analyser`); added `canExecute(meals, ...)` assertions; updated header comment counts |
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | Added full **Meals (INT15)** Phase 1 entry; updated the Phase 2 Capability Index table (`meals` → Bound); updated Cross-Cutting Patterns and Scope Lock counts |
| `docs/architecture/capabilities/meals.md` | Status header updated: "Capability Card complete — not yet bound" → "Bound under INT15" |

---

## DATA IMPACT

| Reads existing data | ✅ Yes — `meals` (own rows + system meals) + `meal_items` (own/system meal's items only, via the replicated ownership check) |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| Never fabricate ingredient quantities | Only stored `ingredients`/`instructions`/`meal_items.quantity` fields are surfaced, never estimated or computed |
| Never fabricate or surface a nutritional value | Nutrition is a separate table; no port method reads it; no result shape has a nutrition field. Tested via an explicit `hasOwnProperty` assertion |
| Never expose another user's private meal via `detail` | Structural — the handler replicates `server/routes.ts:1183` exactly; a foreign meal id and a nonexistent meal id return the IDENTICAL `denied` message. Tested via both cases plus a message-equality assertion |
| Never expose another user's private meal via `search` | `lookupMeals` is not exposed by the port at all; `search` is an unconditional gap |
| No write code path | Port has no write methods; `explain`/`search`/`recommend`/writes all gap via `readOnlyVerbGuard`; no mutation anywhere in the handler |

---

## TESTING

Test file: `server/tests/test-intelligence-meals-binding.ts`
Run: `npm run test:intelligence-meals-binding`
Result: **45 passed, 0 failed**

| Section | Assertions |
|---|---|
| Capability lookup | meals is `available`; exactly 9 live capabilities (scope lock); executableIntents declares read; explain/search/recommend NOT in executableIntents |
| Permission validation | anonymous read → `denied` |
| Read scope: list | own meal + system meal merged, full Meal projection; delegation to `getMeals`/`getSystemMeals` observed |
| Read scope: summary | lighter projection (`ingredientCount`, no raw ingredients/instructions); delegation observed |
| Read scope: detail | own meal + items surfaced; system meal readable by any caller; another user's private meal → denied; nonexistent meal id → denied with the IDENTICAL message (no existence leak); ownership is per-caller, not a blanket block (user 2 reads their own meal 200 fine) |
| Honest gaps | missing scope → gap; unsupported scope → gap; detail with no mealId → gap |
| Unsupported intent | `import` (confirmed) → gap; `review` → `unsupported_intent` |
| Read-only enforcement | explain/search/recommend → gap (read-only message); `generate` (unconfirmed) → confirmation_required, (confirmed) → gap; read never requires confirmation |
| Trust rule | no result shape carries a nutrition field |

**Full suite after this workstream:** `npm test` — **0 failures** across all intelligence and non-intelligence test files, including all updated scope-lock assertions.

---

## SCOPE LOCK

**What was NOT built (and must not be built here):**

- No `explain` handler — the Card confirms there is no stored rationale field on meals.
- No `search` handler — `storage.lookupMeals` has zero ownership scoping; binding it as-is would let any caller search other users' private meal names. This is an explicit OPEN DECISION the Card raises and this workstream deliberately leaves unresolved, shipping `search` as a gap rather than guessing at a governance call.
- No `recommend` handler — the live route's ranking (`rankMealsByPreferences`) runs inline at the route layer, not via a delegate-only owner method; reimplementing it here would be business logic in the handler, forbidden by INT7A.
- No nutrition exposure of any kind — nutrition is a separate table, joined by `mealId`, and is not in the Card's allowed scopes or port methods. No method on the port reads it.
- No `generate`/`add`/`replace`/`delete`/`import`/`share` handler — these remain owned by the Meals service via the existing `/api/meals/*` routes; this binding is read-only by construction.
- No changes to the Meals owner's business logic, data model, or routes (`/api/meals/*`, `/api/meal-items/*` are all untouched).
- No HTTP routes, no UI, no schema changes.
- No new capability registered — the existing `meals` registry entry was used as-is; `capability-registry.ts` itself was not edited (availability flips at runtime via `registerHandler`, matching every prior binding). The registry's `owningService` string remains uncorrected in the runtime registry (the correction is recorded in this report and the Developer Capability Registry only, per the "do not modify runtime" convention established by INT13/INT14).
- No changes to any other capability binding's behaviour — only their test assertions were brought current (scope-lock counts; shopping's read-only allow-list guard).

---

## DEFINITION OF DONE

- [x] Rollback tag `int15-rollback-pre-meals-binding` created and reported before further code was written
- [x] Architecture Compliance gate: PASS (all 9 AI checks + 6 architecture checks)
- [x] Port file created (`meals-read-port.ts`) — 6 methods, no business logic, dynamic import, injectable
- [x] Handler file created (`meals-read-handler.ts`) — verb guard first, userId required, port resolved once, replicated ownership check for detail, explicit projections (no nutrition, no raw row forwarding beyond the owner's own field set), honest gaps throughout
- [x] Binding file created (`meals.ts`) — `MEALS_EXECUTABLE_INTENTS` declared, `bindMealsReadCapability` exported
- [x] `intelligence-platform.ts` updated — `bindMealsReadCapability(intelligencePlatform)` added
- [x] `index.ts` updated — all port/handler/binding/result-type exports added
- [x] `README.md` updated — module table + state block + diagram + test entry
- [x] `package.json` updated — `test:intelligence-meals-binding` added to both `"test"` and as a standalone script
- [x] Previous binding scope-lock assertions updated (diary, pantry, nutrition-knowledge, profile, household, partners: 8→9; shopping: allow-list extended; registry-executability: singleton assertions added + count 8→9)
- [x] Developer Capability Registry updated: full Meals (INT15) Phase 1 entry added; Phase 2 index updated
- [x] Canonical Capability Card status header updated to reflect the binding and the unresolved `search` open decision
- [x] Test suite passes: **45/45** (meals binding test)
- [x] Full test suite passes: **0 failures** across all intelligence + non-intelligence tests
- [x] `npx tsc --noEmit`: no new type errors introduced (pre-existing, unrelated errors in other files untouched)
- [x] Data impact: reads only, no schema changes, no backfill
- [x] Trust rules verified by test assertions
- [x] Implementation report saved at `docs/implementation/intelligence/INT15_MEALS_CAPABILITY_BINDING_IMPLEMENTATION.md`
