# INT16 — Templates Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT16
**Produced using:** [INT7A Intelligence Capability Factory](../architecture/INTELLIGENCE_CAPABILITY_FACTORY.md), the [Developer Capability Registry](../architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md), and the canonical [Plan Templates Capability Card](../architecture/capabilities/templates.md) (INT11, promoted to governing architecture under EPIC 1.5)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int16-rollback-pre-templates-binding` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | `server/intelligence/handlers/templates-read-port.ts` (new), `server/intelligence/handlers/templates-read-handler.ts` (new), `server/intelligence/bindings/templates.ts` (new), `server/tests/test-intelligence-templates-binding.ts` (new), `server/intelligence/intelligence-platform.ts` (edited), `server/intelligence/index.ts` (edited), `server/intelligence/README.md` (edited), `package.json` (edited), `server/tests/test-intelligence-diary-binding.ts` (scope-lock updated), `server/tests/test-intelligence-pantry-binding.ts` (scope-lock updated), `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (scope-lock updated), `server/tests/test-intelligence-profile-binding.ts` (scope-lock updated), `server/tests/test-intelligence-household-binding.ts` (scope-lock updated, plus a pre-existing INT15 label inconsistency corrected), `server/tests/test-intelligence-partners-binding.ts` (scope-lock updated), `server/tests/test-intelligence-meals-binding.ts` (scope-lock updated — immediately previous binding), `server/tests/test-intelligence-shopping-binding.ts` (read-only allow-list guard extended), `server/tests/test-intelligence-registry-executability.ts` (scope-lock updated + `singletonTemplates` assertions added + `templates` removed from the unbound-capabilities list), `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (edited), `docs/architecture/capabilities/templates.md` (status header updated) |
| Schema modified | None |

To restore: `git checkout int16-rollback-pre-templates-binding -- .` (note: this restores the repository to the INT1 commit state, discarding all uncommitted INT2–INT16 working-tree work, matching the convention established by prior rollback tags on this branch).

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` and the governing documents it points to.
- [x] Read `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` (INT7A) — fill-in template and factory steps followed exactly.
- [x] Read `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (INT9A) — used as the implementation index; updated with the completed binding.
- [x] Read the canonical Capability Card `docs/architecture/capabilities/templates.md` (INT11 / EPIC 1.5) — used verbatim as the fill-in template. The Card's owner correction (`server/template-migration.ts` is a one-time backfill script, not a live owner — the real owner is `storage.ts`) and its CRITICAL FINDING (`GET /api/plan-templates/:id` has no owner/published/admin check at all) are the binding's boundaries: the handler corrects the owner and applies a stricter gate than the existing route.
- [x] Confirmed `templates` is `registered` (not `never`) in `server/intelligence/capability-registry.ts` (seed entry, `displayName: "Plan Templates"`).
- [x] Confirmed the owner (`server/storage.ts` — `getMealTemplates`, `getMealTemplate`, `getPublishedGlobalTemplates`, `getUserPrivateTemplates`, `getTemplateWithItems`, `getDefaultTemplate`) are existing services with existing read methods; no new owner created. Confirmed the registry's `owningService` string (`server/template-migration.ts, meal-food-intelligence.ts`) is NOT the actual owner, per the Card's correction.
- [x] Additional codebase evidence gathered beyond the Card (required to safely implement the mixed public/own-data access model): `server/routes.ts:5378-5396` shows `/api/meal-templates` and `/api/meal-templates/:id` have NO auth check at all (the `meal_templates` table has no ownership column); `server/routes.ts:7190-7202` shows `/api/plan-templates/library` derives `tier` from `hasPremiumAccess(user)` SERVER-SIDE, never from a request parameter; `server/routes.ts:7508-7530` shows `/api/plan-templates/default` and `/api/plan-templates/:id` have NO auth check either (only `/apply` and the mutating routes do).

---

## FILL-IN TEMPLATE (from the canonical Capability Card, verified against current code)

| Field | Value |
|---|---|
| Capability ID | `templates` |
| Capability name | Plan Templates |
| Owner service | `server/storage.ts` — `getMealTemplates()`, `getMealTemplate(id)`, `getPublishedGlobalTemplates(tier)`, `getUserPrivateTemplates(userId)`, `getTemplateWithItems(id)`, `getDefaultTemplate()` |
| Source of Truth | SoT D13 — `meal_templates` (`shared/schema.ts:48-79`) + `meal_plan_templates` (865-883) + `meal_plan_template_items` (885-901) |
| Access scope | MIXED, corrected/extended beyond the Card's blanket framing: `meal_templates` is fully PUBLIC (no `userId`/`ownerUserId` column exists on the table — `server/routes.ts:5378-5396` confirms no auth check); `meal_plan_templates` is own-data (`ownerUserId = userId`) plus published-global (`ownerUserId IS NULL AND status = "published"`), and two of its four routes (`/default`, `/:id`) are ALSO unauthenticated |
| Supported read intents | `read`, `explain`, `search`, `recommend`, `generate`, `add`, `import`, `delete`, `share` (per `capability-registry.ts` seed) |
| Executable intents | `read` — six scopes; `search` has no owner method at all (not merely unsafe, per the Card) |
| Allowed scopes | `meal-templates` (list, public), `meal-template` (detail by `mealTemplateId`, public), `plan-templates` (library: published-global tier-filtered + own private, auth required), `plan-templates-mine` (own private, auth required), `plan-templates-default` (the `isDefault` template + items, public), `plan-template` (detail by `planTemplateId` + items, public route, content-gated) |
| Honest gaps | `search` — no search-by-name/tag method exists anywhere in `storage.ts` (confirmed by the Card's grep). `recommend`/`generate`/`add`/`import`/`delete`/`share` — write/generation — gap. `explain` — no stored rationale — gap. Unknown `mealTemplateId`/`planTemplateId` — gap (no existence leak concern: ids are either sequential-but-globally-public, or random UUIDs). No default template set — gap. A draft/private `plan-template` requested by a non-owner, non-admin — `denied` |
| Permission model | `meal_templates` reads mirror the live unauthenticated routes exactly. `meal_plan_templates` library/mine reads mirror the live routes' hard `401`. `plan-template` detail is STRICTER than the live route: CRITICAL FINDING confirmed — `GET /api/plan-templates/:id` (`server/routes.ts:7522`) applies NO owner/published/admin check, returning any template by id regardless of draft/owner status. This binding applies `(ownerUserId === null && status === "published") || ownerUserId === callerId || context.role === "admin"`, closing the gap the Card flagged as a documented, recommended stricter posture |
| Port methods | `getMealTemplates()` → `storage.getMealTemplates()`; `getMealTemplate(id)` → `storage.getMealTemplate(id)`; `getPublishedGlobalTemplates(tier)` → `storage.getPublishedGlobalTemplates(tier)`; `getUserPrivateTemplates(userId)` → `storage.getUserPrivateTemplates(userId)`; `getTemplateWithItems(id)` → `storage.getTemplateWithItems(id)`; `getDefaultTemplate()` → `storage.getDefaultTemplate()` |
| Handler responsibilities | Dispatch per scope; resolve `tier` from `context.premium` SERVER-SIDE for `plan-templates` (never trust a request parameter — closes a privilege-escalation path the live route itself avoids); apply the owner/published/admin gate for `plan-template`; project explicit view types that never include `shareToken` |
| Binding registration | `TEMPLATES_EXECUTABLE_INTENTS = ["read"]` |
| Tests required | Standard set + explicit tier-spoofing-is-ignored test + the plan-template detail gate (published-global / own / foreign / admin / unknown id) |
| Documentation updates | `server/intelligence/README.md` row + state block; `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` Phase 1 entry + Phase 2 index update; canonical Capability Card status header |
| Data impact | Reads only |
| Trust rules | Never fabricate a template field; never surface `shareToken` (a join secret, the INT13 `inviteCode` precedent); never trust a client-supplied tier |

---

## ARCHITECTURE COMPLIANCE

| Constraint | Status | Evidence |
|---|---|---|
| One canonical Intelligence Platform — extending the existing singleton only | ✅ PASS | `bindTemplatesReadCapability(intelligencePlatform)` appended to the end of `intelligence-platform.ts`; no second platform |
| One Capability Registry — binding to the existing `templates` capability entry, no new registry | ✅ PASS | `TEMPLATES_CAPABILITY_ID = "templates"` matches the existing seed entry; no new registry; the static seed file is left untouched (availability flips at runtime via `registerHandler`, matching every prior binding) |
| One Intent Engine — unchanged routing; no second engine | ✅ PASS | `IntentEngine` unchanged; routing pipeline unmodified |
| Owner remains owner — handler delegates every read; holds no business logic of its own | ✅ PASS | Handler has no template business rules. The two exceptions — the tier resolution (`context.premium ? "premium" : "free"`) and the `plan-template` ownership/publish/admin gate — are direct mirrors of `server/routes.ts:7193` and a documented STRICTER-than-route gate respectively, both narrow, INT7A-permitted exceptions (auth/derivation gates, not invented domain logic) |
| No duplicate state — no parallel store, no cached copy of owner data | ✅ PASS | No caching, no parallel store; reads pass through the port to the owner on every call |
| Existing architecture extended only — reuses the `registerHandler` seam (INT1 extension point) | ✅ PASS | `platform.registerHandler("templates", ...)` — the established extension point |

**AI Architecture Compliance:**

| Constraint | Status |
|---|---|
| Uses canonical Intelligence Platform (`intelligencePlatform` singleton) | ✅ |
| Uses the AI Capability Registry (binds the existing `templates` capability) | ✅ |
| Uses the Intent Engine (full pipeline) | ✅ |
| Reuses the existing owner service (via the port → `storage.ts`) | ✅ |
| Does not create another assistant | ✅ |
| Does not duplicate conversation state | ✅ |
| Uses registered capabilities only | ✅ |
| Permission-aware access | ✅ — per-scope: `requireUserId` for `plan-templates`/`plan-templates-mine`; public for `meal-templates`/`meal-template`/`plan-templates-default`; an owner/published/admin gate for `plan-template` |
| Produces honest gaps rather than fabricated knowledge | ✅ — `explain`/`search`/`recommend`/missing-or-unsupported-scope/missing-id-params/unknown-id/no-default-set all throw `gap()`; a draft/private template requested by a non-owner, non-admin throws `denied()` |

**Gate result: PASS**

---

## WHAT WAS BUILT

### Port (`server/intelligence/handlers/templates-read-port.ts`)

Interface `TemplatesReadPort` with six 1:1 delegating methods: `getMealTemplates`, `getMealTemplate`, `getPublishedGlobalTemplates`, `getUserPrivateTemplates`, `getTemplateWithItems`, `getDefaultTemplate` — all direct forwards to `storage.ts`.

`getMealTemplateByName`, `listTemplates`, `getAllGlobalTemplatesAdmin`, and `countUserPrivateTemplates` are deliberately NOT exposed — the Card's "Port methods" field lists exactly six methods; these four are not needed by any of the Card's "Allowed scopes" and adding them would be scope creep beyond what was evidenced as necessary.

Production factory `createStorageTemplatesReadPort()` uses dynamic imports so loading the Intelligence Platform module never opens a database connection at import time.

### Handler (`server/intelligence/handlers/templates-read-handler.ts`)

`createTemplatesReadHandler(resolvePort)` returns a `CapabilityHandler` that:

1. Calls `readOnlyVerbGuard(intent, ["read"], "Templates")` — `explain`, `search`, `recommend`, and every write verb all fall through this guard and return an honest gap.
2. Does **not** call a blanket `requireUserId` at the top (a deliberate, documented deviation from the INT7A factory's default pattern) — Templates blends public reference data with own-data scopes, so each scope resolves its own auth requirement, mirroring the live routes' per-endpoint auth gates exactly.
3. Resolves the port once.
4. `read`: dispatches per scope —
   - `"meal-templates"`: `port.getMealTemplates()`, public, no auth.
   - `"meal-template"`: requires `{ mealTemplateId }` (gap if missing/non-integer). `port.getMealTemplate(id)`; gap if not found. Public, no auth.
   - `"plan-templates"`: `requireUserId` (anonymous → denied, mirrors the live route's hard 401). Tier resolved as `context.premium ? "premium" : "free"` — **never from `intent.parameters`**, mirroring `server/routes.ts:7193` exactly. Merges `port.getPublishedGlobalTemplates(tier)` with `port.getUserPrivateTemplates(userId)`.
   - `"plan-templates-mine"`: `requireUserId`. `port.getUserPrivateTemplates(userId)`.
   - `"plan-templates-default"`: `port.getDefaultTemplate()`; gap if none set. Public, no auth.
   - `"plan-template"`: requires `{ planTemplateId }` (gap if missing/empty). `port.getTemplateWithItems(id)`; gap if not found. Then applies the gate: `(ownerUserId === null && status === "published") || ownerUserId === callerId || context.role === "admin"` → `ok`; otherwise `denied`. `callerId` is resolved via `toInt(context.userId)` (not `requireUserId`) so an anonymous caller can still read a published-global template.
   - Any other (or missing) scope → gap naming all six supported scopes.

**Result shapes:** `TemplatesMealTemplatesReadResult`, `TemplatesMealTemplateReadResult`, `TemplatesPlanLibraryReadResult`, `TemplatesPlanMineReadResult`, `TemplatesPlanDefaultReadResult`, `TemplatesPlanDetailReadResult`, unioned as `TemplatesReadResult`. No plan-template view (`PlanTemplateFields`) ever includes `shareToken` — it is omitted by explicit field projection, never spread from the raw row.

### Binding (`server/intelligence/bindings/templates.ts`)

- `TEMPLATES_CAPABILITY_ID = "templates"` — the existing registry entry.
- `TEMPLATES_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read"]` — truthful; `explain`/`search`/`recommend`/writes are NOT listed.
- `bindTemplatesReadCapability(platform, resolvePort?)` — registers the handler; production default is `createStorageTemplatesReadPort`.

---

## FILES CREATED / MODIFIED

### New files (5)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/templates-read-port.ts` | Delegation surface — `TemplatesReadPort` interface + production factory |
| `server/intelligence/handlers/templates-read-handler.ts` | Execution handler — verb guard, per-scope auth, scope dispatch, server-resolved tier, owner/published/admin gate, honest gaps |
| `server/intelligence/bindings/templates.ts` | Activation — registers handler + executableIntents on the singleton |
| `server/tests/test-intelligence-templates-binding.ts` | Test suite — 56 assertions |
| `docs/implementation/INT16_TEMPLATES_CAPABILITY_BINDING_IMPLEMENTATION.md` | This report |

### Edited files (12)

| File | Change |
|---|---|
| `server/intelligence/intelligence-platform.ts` | Added `bindTemplatesReadCapability(intelligencePlatform)` call and updated module comments |
| `server/intelligence/index.ts` | Added exports for port, handler, binding, executable-intents constant, result types |
| `server/intelligence/README.md` | Added module table rows, state block (INT16), architecture diagram entries, test entry |
| `package.json` | Added `test:intelligence-templates-binding` script; appended to `"test"` script |
| `server/tests/test-intelligence-diary-binding.ts` | Scope-lock updated from 9 → 10 |
| `server/tests/test-intelligence-pantry-binding.ts` | Scope-lock updated from 9 → 10 |
| `server/tests/test-intelligence-nutrition-knowledge-binding.ts` | Scope-lock updated from 9 → 10 |
| `server/tests/test-intelligence-profile-binding.ts` | Scope-lock updated from 9 → 10 |
| `server/tests/test-intelligence-household-binding.ts` | Scope-lock updated from 9 → 10 (also corrected a pre-existing INT15 label inconsistency: the assertion message said "the eight live capabilities" and omitted "meals" from its text while the code already checked for it — corrected to "the ten live capabilities ... meals and templates", matching the code) |
| `server/tests/test-intelligence-partners-binding.ts` | Scope-lock updated from 9 → 10 |
| `server/tests/test-intelligence-meals-binding.ts` | Scope-lock updated from 9 → 10 (the immediately previous binding, per INT7A factory step) |
| `server/tests/test-intelligence-shopping-binding.ts` | Read-only allow-list guard extended to include `templates` (capabilityClass `"write"`, aiAccess `"W"` — neither matches the guard's `"read-only"`/`"R"` defaults, so it needed an explicit id exception like `household`/`meals`) |
| `server/tests/test-intelligence-registry-executability.ts` | Added `singletonTemplates` assertions; removed `templates` from the unbound-capabilities list (now `["analyser", "administration"]`); updated `listExecutableCapabilities()` count from 9 → 10 and its "includes" assertion; added `canExecute(templates, ...)` assertions; updated header comment counts |
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | Added full **Templates (INT16)** Phase 1 entry; updated the Phase 2 Capability Index table (`templates` → Bound); updated Cross-Cutting Patterns and Scope Lock counts |
| `docs/architecture/capabilities/templates.md` | Status header updated: "Capability Card complete — not yet bound" → "Bound under INT16" |

---

## DATA IMPACT

| Reads existing data | ✅ Yes — `meal_templates` (all rows, public) + `meal_plan_templates` (own rows + published-global rows, via the replicated gate for single-template reads) + `meal_plan_template_items` (items of an already-gated template) |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

---

## TRUST CHECK

| Rule | Enforcement |
|---|---|
| Never fabricate a template field | Only stored fields are surfaced via explicit projection functions (`toMealTemplateView`, `toPlanTemplateFields`, `toPlanTemplateItemView`); never a raw spread of the owner's row |
| Never surface `shareToken` | Structural — `PlanTemplateFields` (the base of every plan-template view) has no `shareToken` field; the projection function never reads it from the source row. Tested via an explicit `hasOwnProperty` assertion across all four plan-template result shapes (library, mine, default, detail) |
| Never trust a client-supplied tier | Structural — `tier` is computed as `context.premium ? "premium" : "free"`; `intent.parameters.tier` is never read anywhere in the handler. Tested by supplying `{ scope: "plan-templates", tier: "premium" }` from a non-premium context and asserting the result is unchanged from the un-spoofed call |
| Never apply a weaker gate than the existing route | The `plan-template` gate is STRICTER than `server/routes.ts:7522` (which has none) — published-global, own, or admin only. Tested via four cases: published-global (any caller, incl. anonymous) → ok; own draft → ok; foreign draft → denied; admin reading a foreign draft → ok |
| No write code path | Port has no write methods; `explain`/`search`/`recommend`/writes all gap via `readOnlyVerbGuard`; no mutation anywhere in the handler |

---

## TESTING

Test file: `server/tests/test-intelligence-templates-binding.ts`
Run: `npm run test:intelligence-templates-binding`
Result: **56 passed, 0 failed**

| Section | Assertions |
|---|---|
| Capability lookup | templates is `available`; exactly 10 live capabilities (scope lock); executableIntents declares read; explain/search/recommend NOT in executableIntents |
| Permission validation | public scopes (meal-templates, plan-templates-default, a published-global plan-template) allow anonymous reads; own-data scopes (plan-templates, plan-templates-mine) deny anonymous reads |
| Read scope: meal-templates | public shell-template list; delegation to `getMealTemplates` observed |
| Read scope: meal-template | detail by id; unknown id → gap; missing id param → gap |
| Read scope: plan-templates | tier resolved from `context.premium`, NOT from a request parameter (a spoofed `{ tier: "premium" }` from a non-premium caller is proven to be ignored); free vs. premium caller see different global catalogues; own private templates included |
| Read scope: plan-templates-mine | own private templates only; per-caller scoping (user 2 never sees user 1's template) |
| Read scope: plan-templates-default | public default template + items |
| Read scope: plan-template | the detail gate — published-global (any caller, incl. anonymous) → ok; own draft → ok; foreign draft → denied; anonymous reading a foreign draft → denied; admin reading a foreign draft → ok; unknown id → gap (not denied); missing id param → gap |
| Honest gaps | missing scope → gap; unsupported scope → gap |
| Unsupported intent | `import` (confirmed) → gap; `review` → `unsupported_intent` |
| Read-only enforcement | explain/search/recommend → gap (read-only message); `generate` (unconfirmed) → confirmation_required, (confirmed) → gap; read never requires confirmation |
| Trust rule | no result shape (library / mine / default / detail) carries `shareToken` |

**Full suite after this workstream:** `npm test` — **0 failures** across all intelligence and non-intelligence test files, including all updated scope-lock assertions. `npx tsc --noEmit`: no new type errors introduced (pre-existing, unrelated errors in other files untouched).

---

## SCOPE LOCK

**What was NOT built (and must not be built here):**

- No `explain` handler — the Card confirms there is no stored rationale field on any template.
- No `search` handler — no search-by-name/tag method exists anywhere in `storage.ts` (the Card's grep found zero matches); this is not a scoping-safety gap like Meals' `search`, it is a flat absence of an owner method.
- No `recommend` handler — no delegate-only owner ranking method exists for templates.
- No `generate`/`add`/`import`/`delete`/`share` handler — these remain owned by the Templates service via the existing `/api/meal-templates/*` and `/api/plan-templates/*` routes; this binding is read-only by construction.
- No `getMealTemplateByName`, `listTemplates`, `getAllGlobalTemplatesAdmin`, or `countUserPrivateTemplates` exposed on the port — not needed by any of the Card's allowed scopes; adding them would be unevidenced scope creep.
- No changes to the Templates owner's business logic, data model, or routes (`/api/meal-templates/*`, `/api/plan-templates/*`, `/api/admin/plan-templates/*` are all untouched).
- No HTTP routes, no UI, no schema changes.
- No new capability registered — the existing `templates` registry entry was used as-is; `capability-registry.ts` itself was not edited (availability flips at runtime via `registerHandler`, matching every prior binding). The registry's `owningService` string remains uncorrected in the runtime registry (the correction is recorded in this report and the Developer Capability Registry only, per the "do not modify runtime" convention established by INT13/INT14/INT15).
- No changes to any other capability binding's behaviour — only their test assertions were brought current (scope-lock counts; shopping's read-only allow-list guard; one pre-existing INT15 label-only inconsistency in the household test corrected).

---

## DEFINITION OF DONE

- [x] Rollback tag `int16-rollback-pre-templates-binding` created and reported before further code was written
- [x] Architecture Compliance gate: PASS (all 9 AI checks + 6 architecture checks)
- [x] Port file created (`templates-read-port.ts`) — 6 methods, no business logic, dynamic import, injectable
- [x] Handler file created (`templates-read-handler.ts`) — verb guard first, per-scope auth (documented deviation from the blanket-`requireUserId` default, justified by the mixed public/own-data access model), port resolved once, server-resolved tier, replicated owner/published/admin gate for plan-template detail, explicit projections (no `shareToken`), honest gaps throughout
- [x] Binding file created (`templates.ts`) — `TEMPLATES_EXECUTABLE_INTENTS` declared, `bindTemplatesReadCapability` exported
- [x] `intelligence-platform.ts` updated — `bindTemplatesReadCapability(intelligencePlatform)` added
- [x] `index.ts` updated — all port/handler/binding/result-type exports added
- [x] `README.md` updated — module table + state block + diagram + test entry
- [x] `package.json` updated — `test:intelligence-templates-binding` added to both `"test"` and as a standalone script
- [x] Previous binding scope-lock assertions updated (diary, pantry, nutrition-knowledge, profile, household, partners, meals: 9→10; shopping: allow-list extended; registry-executability: singleton assertions added + count 9→10)
- [x] Developer Capability Registry updated: full Templates (INT16) Phase 1 entry added; Phase 2 index updated
- [x] Canonical Capability Card status header updated to reflect the binding
- [x] Test suite passes: **56/56** (templates binding test)
- [x] Full test suite passes: **0 failures** across all intelligence + non-intelligence tests
- [x] `npx tsc --noEmit`: no new type errors introduced (pre-existing, unrelated errors in other files untouched)
- [x] Data impact: reads only, no schema changes, no backfill
- [x] Trust rules verified by test assertions
- [x] Implementation report saved at `docs/implementation/INT16_TEMPLATES_CAPABILITY_BINDING_IMPLEMENTATION.md`
