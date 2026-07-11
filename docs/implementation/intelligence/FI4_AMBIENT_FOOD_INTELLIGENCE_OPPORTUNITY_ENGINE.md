# FI4 — Ambient Food Intelligence & Opportunity Engine — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FI4 (🔴 RED — evolves the Food Intelligence Engine with a new ambient reasoning mode: new module, new capability verb, new tests, non-trivial new business-domain reads)
**Risk:** 🔴 RED
**Reason:** Extends the Food Intelligence Engine (FI3) from request-driven recommendation into an ambient Opportunity Engine that reads across three Business Domains (Planner, Pantry, Shopping) to continuously identify and prioritise Food Opportunities. New reasoning module, new capability verb (`report`), new cross-domain reads, new tests — not a documentation-only or purely additive-metadata change.
**Builds on:** [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (EWO-FI1 — the governing architecture this task implements against; §3 enrichment map, §5 trust rules, §7 capability architecture) · [`FI3_FOOD_INTELLIGENCE_ENGINE_FOUNDATION.md`](./FI3_FOOD_INTELLIGENCE_ENGINE_FOUNDATION.md) (the Food Intelligence Engine and Port→Handler→Binding this task extends, not replaces)
**Tests:** `npm run test:intelligence-food-opportunity-binding` (40 assertions, new) — added to the `npm test` chain, run last. Full chain re-run (32 suites) with zero regressions.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Working tree at start | Already dirty with substantial prior uncommitted INT35–NUT1/FS-series/FI1/FI2/FI3-series work on this branch (pre-existing, unrelated to this task — same state FI3's own rollback table documents) |
| HEAD at start | `8ae0f7ef0f137e2f9baf86ef1727e7d17bc99af5` — "Add future-state nutrition vision investigation (EWO-NUT2)" |
| Rollback tag | `rollback/before-fi4-ambient-food-intelligence-opportunity-engine-20260703` → `8ae0f7e` |
| This task's writes | See §"Files changed" below — 2 new source/test files + 1 new implementation record, and 6 modified files, all additive |
| Code modified | Yes — see below (a new capability *verb* on an existing capability; every existing verb's behaviour is unchanged) |
| Schema modified | None |
| Runtime modified | Additive only — a new verb (`report`) on the already-registered `food-intelligence` capability; every existing capability's registered behaviour is unchanged (proven by the full `npm test` chain re-run with zero regressions) |

**Rollback commands:** `git checkout rollback/before-fi4-ambient-food-intelligence-opportunity-engine-20260703 -- <path>` for any file below, or delete the two new files and revert the additive edits (each is independently revertible — nothing outside this task's own files reads any of the new exports yet).

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (workflow steps, RED classification, mandatory template)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight governing principles)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (confirmed the single owners this task reads: Planner `planner_*`, Pantry `user_pantry_items`, Shopping `shopping_list`, Household `household_eaters`)
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (EWO-FI1 — the governing architecture for this task: §3 enrichment map — Planner/Shopping/Pantry rows; §5 trust rules E1/T0/T1/LT3; §7 capability architecture — "no new platform")
- [x] `docs/implementation/intelligence/FI3_FOOD_INTELLIGENCE_ENGINE_FOUNDATION.md` (the exact Port→Handler→Binding this task extends; the precedent for exporting a previously-private function — `enrichEater` — for cross-module reuse, mirrored here for `resolveHouseholdSignal`)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (confirmed `report` — "Produce a structured report" — is one of the 20 closed canonical intent verbs; no new verb was invented)
- [x] Existing code read in full before writing anything new: `server/intelligence/food-intelligence/engine.ts` (FI3's engine — the exact `resolveHouseholdSignal`/`enrichEater`/`fetchHouseholdPlannerFoods` reuse this task builds on), `server/intelligence/handlers/food-intelligence-read-{port,handler}.ts`, `server/intelligence/bindings/food-intelligence.ts`, `server/intelligence/handlers/{planner,pantry,shopping}-read-port.ts` (the three existing read ports this task's generators delegate to — no new database query is written outside them), `server/lib/food-intelligence-assembler.ts` (`fetchHouseholdPlannerFoods`, reused not re-derived), `shared/restrictions/restriction-resolver.ts` (`resolveIngredientRestrictions`, reused not re-derived), `shared/canonical/resolver.ts` (`resolveCanonicalFood`, the one canonical identity resolver, reused not re-derived), `shared/schema.ts` (confirmed `PlannerWeek`/`PlannerDay` have no calendar-date field — only `weekNumber`/`dayOfWeek` — so "current week" reuses the one existing codebase convention, highest `weekNumber`, per `server/routes.ts:10972-10977`), `server/intelligence/capability-registry.ts`, `server/intelligence/intelligence-platform.ts`, `server/intelligence/index.ts`, `server/intelligence/types.ts` (confirmed the closed `IntentVerb` union and that no capability-count assertion needed updating, since this task adds a verb to an existing capability, not a new capability)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No new entity is introduced. Every opportunity keys on existing identities:
  the canonical food slug (shared/canonical/resolver.ts — the same resolver
  food-intelligence-assembler.ts already uses), the existing planner day/week
  id (DB planner_days/planner_weeks), the existing pantry item id (DB
  user_pantry_items), and the existing shopping list item id (DB
  shopping_list). No new id space, no new primary key.

☑ One owner per fact
  Every fact an Opportunity cites traces to exactly one existing owner: Planner
  (via planner-read-port.ts, SoT D14), Pantry (via pantry-read-port.ts, SoT
  D8-11), Shopping (via shopping-read-port.ts, SoT D15), and Household
  restrictions/planner-familiarity (via the FI3 engine's own
  resolveHouseholdSignal, SoT D16 + D14 — reused, not re-derived). The
  Opportunity Engine itself owns zero business-domain facts (Rule FI1).

☑ No duplicate entities
  No new table, no new schema, no new static content file. The engine reads
  existing entities only, through their existing Intelligence Platform read
  ports.

☑ No duplicate ownership
  Household resolution (restrictions + planner familiarity) is NOT
  re-implemented: `resolveHouseholdSignal` — FI3's own private household
  resolver — is now exported (one-line change, the exact same reuse pattern
  FI3 established for `enrichEater`) and called verbatim, so household
  context is resolved exactly once per report, by exactly one function.
  Restriction matching reuses `resolveIngredientRestrictions` (the same Rule
  T0 matcher engine.ts already uses for safety exclusion) rather than a
  second implementation. Food identity resolution reuses
  `resolveCanonicalFood` (the same resolver food-intelligence-assembler.ts
  already uses) rather than a second identity mapping. "Current week"
  determination reuses the one existing codebase convention (highest
  weekNumber, server/routes.ts:10972-10977) rather than inventing a second one.

☑ No duplicate state
  No user state is stored anywhere by this engine. Every opportunity is
  computed fresh per request from existing owners and discarded — no cache,
  no session, no new column, no background job.

☑ Extends existing architecture
  Extends the Intelligence Platform's Port → Handler → Binding pattern by
  adding ONE new verb (`report`) to the ALREADY-REGISTERED `food-intelligence`
  capability — this is not a new capability (the platform's live-capability
  count is unchanged at nineteen). Extends (does not replace) the FI3 engine:
  `engine.ts` is untouched in its reasoning logic (only one function gained an
  `export` keyword and one interface gained one optional field, exactly
  mirroring FI3's own precedent for `enrichEater`). The new
  `opportunity-engine.ts` is a sibling module in the same directory, following
  the identical pure-core / I/O-orchestration split `engine.ts` established.

☑ Progressive enrichment where appropriate
  N/A as a knowledge entity (this is a reasoning process, not a knowledge
  entity) — but the same discipline is honoured structurally: each of the
  three domain generators (Planner/Pantry/Shopping) is independently optional
  — a household that has never used one of those three surfaces simply
  contributes zero opportunities from that domain, and a read failure in one
  domain (caught, not propagated) never blocks the other two domains'
  honest opportunities.

☑ Honest gaps over fabricated information
  An unauthenticated caller, or a caller with no resolvable household,
  produces an honest gap (`report` throws; the engine returns
  `householdAware: false`) — never a fabricated household or fabricated
  activity. A household with genuinely no open opportunities (e.g. a fully
  planned week, an empty pantry, no restriction conflicts) returns an honest,
  valid EMPTY list — a real, correct "nothing to report" state, not a gap.
  Proven by 16 of the 40 new test assertions (§1 "no X → no opportunities"
  and §2 gap-path cases).

☑ No permanent synchronisation bridge
  No bridge is created. Every read is live, per-request, direct to the
  existing owner via its existing read port — nothing is copied, cached, or
  kept in sync a second time.

☑ Evolution over replacement
  Nothing is replaced. `engine.ts`'s existing `recommend`/`explain` behaviour
  is provably unchanged (the FI3 test suite, 36 assertions, still passes
  unmodified in substance — only a required interface stub was added to keep
  its in-memory test port complete). `opportunity-engine.ts` is new; every
  owner it reads from (Planner, Pantry, Shopping, Household) keeps its
  existing name, table, and single-owner status exactly as declared in the
  SoT Register.
```

**AI ARCHITECTURE COMPLIANCE**

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — registered via
  `intelligencePlatform` (the one singleton), not a new platform instance.
✓ Uses the Capability Registry — `report` added to the EXISTING
  `food-intelligence` descriptor's `supportedIntents` in the one canonical
  `SEED_CAPABILITIES_BASE` array; no new descriptor.
✓ Uses the Intent Engine — routed through the existing LOCATE → VALIDATE →
  PERMISSION → CONFIRM → INVOKE → RESPOND pipeline unchanged. `report` is one
  of the platform's 20 closed canonical intent verbs (TIP2 §3.1 — "Produce a
  structured report") — no new verb was invented.
✓ Reuses existing business services — planner-read-port.ts, pantry-read-
  port.ts, shopping-read-port.ts (all pre-existing, FI4 adds zero new methods
  to any of them), engine.ts's resolveHouseholdSignal,
  shared/restrictions/restriction-resolver.ts, shared/canonical/resolver.ts.
  No new database query is written outside those existing modules.
✓ Does not create another assistant — no conversation state, no LLM call
  anywhere in this engine (Rule LT3 — the brain stays deterministic).
✓ Does not duplicate conversation state — none is created or read.
✓ Uses registered capabilities only — `report` follows the exact same
  registration/binding contract `recommend`/`explain` already use; no private
  route, no side-channel access.
✓ Uses permission-aware access — server-resolved `context.userId` only; a
  caller's own household is resolved from their own userId, never a
  client-supplied household id (mirrors every other household-aware verb on
  this platform, including FI3's own `recommend`/`explain`).
✓ Produces honest gaps rather than fabricated knowledge — see the Honest
  Gaps checklist item above.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Intelligence (Domain Intelligence layer — reads FOUR
  existing Business Domains this time: Household, Planner, Pantry, Shopping;
  owns none of their data)
Declared SoT (per THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md, unchanged):
  - Household: DB households / household_members / household_eaters (SoT D16)
  - Planner: DB planner_weeks / planner_days / planner_entries (SoT D14)
  - Pantry: DB user_pantry_items (SoT D8-11)
  - Shopping: DB shopping_list (SoT D15)
New store created? NO
Existing store extended? NO
Consumer created? YES — one new verb (`report`) on the already-registered
  `food-intelligence` capability, reachable today via the Intelligence
  Platform (and therefore Companion, the same way `recommend`/`explain`
  already are). Reads from the declared SoT above via each domain's own
  existing Intelligence Platform read port. YES, reads from declared SoT.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Intelligence (the Domain Intelligence layer named in
  THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §2, §7 — sitting between the
  Intelligence Platform and the Business Domains it reads). This task widens
  the layer's own reach from one Business Domain read-cluster (Food Knowledge
  + Household + Planner, FI3) to four (+ Pantry, + Shopping).

Current Canonical Owner:
  This task's own owner: server/intelligence/food-intelligence/
  opportunity-engine.ts (the Food Opportunity Engine — a new, single owner of
  the identify+prioritise+explain ambient reasoning process, per Rule FI1). It
  owns zero business-domain facts; the facts it composes remain owned by
  Household eaters (SoT D16), Planner (SoT D14), Pantry (SoT D8-11) and
  Shopping (SoT D15), exactly as before this task.

Current Runtime Consumer(s):
  The Intelligence Platform's Conversation Gateway (Companion), via the
  standard registered-capability path — the same way FI3's `recommend`/
  `explain` are already reachable. No domain page (Planner/Shopping/Cookbook/
  Pantry) yet calls `report` directly — that wiring is the next milestone,
  same honest-exclusion pattern FI3 named for its own verbs.

Duplicate Owners Remaining:
  NONE introduced by this task. The three pre-existing Business Domain
  duplicates named in FI1 §13 (client/src/lib/nutrition-benefit-library.ts,
  pantry-knowledge.ts, nutrition-variety.ts) are unchanged by this task — this
  engine reads none of them and depends on none of them.

Duplicate State Remaining:
  NONE. No user state is stored by this engine anywhere.

Duplicate Workflows Remaining:
  NONE. Household resolution, restriction matching, canonical food
  resolution, and "current week" determination each reuse an existing
  owner's own logic (resolveHouseholdSignal, resolveIngredientRestrictions,
  resolveCanonicalFood, the highest-weekNumber convention) rather than
  re-implementing any of them a second time.

Current Convergence (%):
  Domain Intelligence layer (this task's own scope): 100% — the Food
  Opportunity Engine is now built and is the one canonical owner of this
  identify+prioritise+explain reasoning process; no second implementation of
  it exists. Business Domain / Plane 1 layer (inherited, unchanged by this
  task): ~60%, per FI1 §13 — unchanged, since this task neither touches nor
  depends on the three contested files named there.

Target Convergence (%):
  100% for the Domain Intelligence layer (achieved by this task, for the
  scope it covers). The inherited Business Domain convergence target (100%)
  remains owned by the separate M1/M2/M4 workstreams (FI1 §13), unaffected by
  this task.

Next Planned Milestone:
  Wire one real domain consumer of `report` (e.g. a Planner "opportunities"
  strip, a Companion natural-language pattern surfacing the household's top
  opportunity) — a future, separately gated EWO, per the "What was
  deliberately NOT built" section below. M1/M2/M4 (Business Domain
  convergence) remain the next milestones for that separate, unaffected layer.

Remaining Architectural Risks:
  This task widens the Food Intelligence Engine's read surface to four
  Business Domains while Phase 0 (FI1 §8, 100% Plane 1 convergence) remains
  open at ~60% — the same accepted, narrowly-scoped sequencing FI3 already
  established (this task depends on none of the three open Phase 0 gaps). A
  future workstream that widens this engine's scope further (new opportunity
  types, new domains, cross-domain writes) should re-confirm the Phase 0 gate
  at that time, not assume this precedent extends indefinitely.
```

---

## WHAT THIS TASK DID

### 1. The Food Opportunity Engine (`server/intelligence/food-intelligence/opportunity-engine.ts`)

A new sibling module to FI3's `engine.ts`, following the identical pure-core / I/O-orchestration split, implementing three deterministic opportunity generators — one per Business Domain read:

- **`identifyPlannerGapOpportunities`** (owning domain: Planner) — a day in the household's own most-recent planner week (highest `weekNumber` — the one existing "current week" convention in this codebase; planner has no calendar-date field to compute it any other way, confirmed against `shared/schema.ts`) with zero entries is an actionable gap. Priority is `high` when half or more of the week is unplanned, `medium` otherwise — a simple, evidence-based, deterministic rule, never a re-derived score.
- **`identifyPantryUnusedOpportunities`** (owning domain: Pantry) — a pantry item whose canonical slug (via `resolveCanonicalFood`, the one canonical resolver) has never appeared in the household's planner history (via the familiar-slug set FI3's own `resolveHouseholdSignal` already computes) is a "cook from what you have" opportunity. Priority `low` (informational, not urgent).
- **`identifyShoppingRestrictionOpportunities`** (owning domain: Shopping) — an unchecked shopping list item whose name matches an active household hard restriction (via `resolveIngredientRestrictions` — the exact Rule T0 matcher `engine.ts` already uses for safety exclusion) is a safety-relevant opportunity to review before buying it. Priority `high`. Unlike Rule T0's outright exclusion of a *recommendation*, this NEVER removes or modifies the caller's own shopping list — it only surfaces the conflict as a suggestion (no autonomous action, per FI4 scope).
- **`prioritizeOpportunities`** — a pure, exported function: stable-sorts the merged opportunity list by priority (high → medium → low), preserving each generator's own internal order within a tier, then clamps to the requested limit (never fewer than 1, never more than 30). No I/O, no re-derived scoring model.

Every `FoodOpportunity` carries: `type` (a closed, extensible union), `priority`, `owningDomain`, a plain-language `explanation` (Rule T1 — food, not bodies), an `evidence` array naming the exact read that produced it (Rule E1 — no citation, no card), and a `suggestedAction` — a suggestion for the human, never an action taken automatically.

**Orchestration (`identifyOpportunities`):** requires an authenticated caller with a resolvable household by construction — Food Opportunities are generated FROM existing household activity, so there is no anonymous "general" answer to give (unlike `recommend`/`explain`'s Stage 1 fallback). Household resolution reuses `engine.ts`'s own `resolveHouseholdSignal` verbatim (now exported — the same reuse discipline FI3 established for `enrichEater`). Each of the three domain reads is wrapped independently: a household that has never used the Planner, Pantry, or Shopping surface simply contributes no opportunities from that domain, and a single domain's read failure never blocks the other two domains' honest opportunities (progressive-enrichment discipline, Architecture Principle 3, applied to a reasoning process rather than a knowledge entity).

### 2. One additive export + one additive field — `resolveHouseholdSignal` / `HouseholdSignal.householdId` (`server/intelligence/food-intelligence/engine.ts`)

FI3's private household-resolution function is now exported (one line: `async function` → `export async function`) so the Opportunity Engine reuses the *exact same* resolution rather than growing a second copy — identical reuse pattern to FI3's own `enrichEater` export. `HouseholdSignal` gained one optional field (`householdId?: number`), populated only when resolution succeeds; this is additive and does not change `rankAndExplain`'s behaviour (it never reads the new field) — the FI3 test suite's 36 assertions still pass unmodified in substance.

### 3. A third verb on the SAME capability — `report` (not a new capability)

Following FI4's brief to *evolve* the Food Intelligence Engine, `report` is added as a third executable verb on the already-registered `food-intelligence` capability — not a new capability descriptor. `report` is one of the Intelligence Platform's 20 closed canonical intent verbs (TIP2 §3.1, "Produce a structured report") — chosen because it is the closest semantic fit for "a structured, prioritised list" and because inventing a new verb would violate the closed-taxonomy discipline.

- `server/intelligence/handlers/food-intelligence-read-port.ts` — gained one method, `identifyOpportunities`, forwarding to the Opportunity Engine via the same dynamic-import discipline `assembleFoodIntelligence` already uses (no database connection opens at module-load time).
- `server/intelligence/handlers/food-intelligence-read-handler.ts` — gained `handleReport`: requires `context.userId` (never a client-supplied household id); an anonymous caller or a caller whose household does not resolve is an honest gap; a resolved household with zero current opportunities is a valid, honest, empty `ok` result (not a gap — a fully-planned week with no restriction conflicts and no unused pantry items is a genuinely good state).
- `server/intelligence/bindings/food-intelligence.ts` — `FOOD_INTELLIGENCE_EXECUTABLE_INTENTS` extended from `["recommend", "explain"]` to `["recommend", "explain", "report"]` (INT6A discipline — no over-advertising).
- `server/intelligence/capability-registry.ts` — the existing `food-intelligence` descriptor's `supportedIntents` gained `"report"`; its `description`/`owner`/`owningService` fields were updated to name the Opportunity Engine; one new `ENRICHMENT` item (`appliesToVerbs: ["report"]`) explains that opportunities are suggestions, never autonomous actions.
- `server/intelligence/index.ts` — new export block for the Opportunity Engine's public types/functions, plus the newly-exported `resolveHouseholdSignal`/`HouseholdSignal`/`NO_HOUSEHOLD_SIGNAL` from `engine.ts`.

**No new capability, no new capability count.** The platform remains at exactly nineteen live capabilities — confirmed by both the FI3 test suite (unmodified assertion) and the new FI4 test suite's own count assertion.

### 4. What was deliberately NOT built (honest exclusions, matching the brief)

- **No Planner/Shopping/Cookbook/Pantry UI wiring.** `report` is registered and consumable by any caller through the standard `intelligencePlatform.handle()` path — but no domain page was wired to call it yet. Named as the next milestone.
- **No natural-language pattern wiring in `pattern-intent-resolver.ts`.** Same reasoning FI3 already recorded for `recommend`/`explain`: reachability via a direct, typed `{ capabilityId: "food-intelligence", verb: "report" }` intent is fully built and tested; free-text discovery is future work.
- **No external signals** (wearables, biomarkers, activity — FI1 §6) — explicitly out of FI4 scope.
- **No predictive AI, no ML ranking, no LLM call anywhere in this engine** — priority is a fixed, deterministic, evidence-based rule (fraction of week unplanned; restriction match; planner-familiarity absence), never a learned or generated score. Rule LT3 (the brain stays deterministic) holds exactly as it does in FI3's engine.
- **No autonomous actions.** Every `suggestedAction` is a plain-language suggestion for a human; no code path in this engine adds a planner entry, removes a shopping item, or modifies a pantry item. There is no write path anywhere in this task (the port, handler, and binding are read-only by construction, identical to FI3's own discipline).
- **No new opportunity types beyond the three built here** (e.g. seasonal gaps, benefit/nutrient coverage gaps, Cookbook-specific opportunities) — `FoodOpportunityType` is a closed-but-extensible union; adding a fourth type is a future, separately scoped increment (Rule 8 — evolution over replacement — applies to this union exactly as it does to any other store).
- **No Cookbook-domain generator.** "Cookbook" is named in the brief as a *consuming surface* (like Planner/Shopping/Pantry/Companion), not a Business Domain with its own transactional store to read opportunities from (per the SoT Register, Cookbook/Meals is a knowledge-and-composition domain, not an activity log) — the generic `FoodOpportunity` shape is already directly consumable by a future Cookbook surface without a dedicated Cookbook generator.

---

## DEFINITION OF DONE

**What success looks like:**
- The Food Opportunity Engine exists (`server/intelligence/food-intelligence/opportunity-engine.ts`) and produces deterministic, cited, prioritised Food Opportunities from a household's own existing Planner, Pantry and Shopping activity ✅
- Each opportunity carries opportunity type, priority, plain-language explanation, supporting evidence, suggested action, and owning business domain — the six fields the brief requires ✅
- `report` is registered and bound as the platform's `food-intelligence` capability's third executable verb — no new capability, still nineteen live capabilities ✅
- Every opportunity carries evidence naming the exact existing owner it was read from (Rule E1) and never fabricates a household, activity, or conflict (Rule T1/honest gaps) ✅
- Zero new business-domain data ownership; every fact traces to an existing single owner (Rule FI1) ✅
- 40 new automated assertions pass, covering the pure reasoning core (all three generators + prioritisation) and the full Port→Handler→Binding contract for `report` ✅
- This implementation record exists at `docs/implementation/intelligence/FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md` ✅

**What must not break:** every existing capability's registration, binding, guidance, enrichment, and conversation-gateway behaviour — including FI3's own `recommend`/`explain` verbs. Proven by the full `npm test` chain (32 suites, including the unmodified-in-substance FI3 binding test — 36 assertions, only a required interface stub added to its in-memory test port) — zero regressions.

**Manual test steps:**
1. `npm run test:intelligence-food-opportunity-binding` — 40 passed, 0 failed.
2. `npm run test:intelligence-food-intelligence-binding` — 36 passed, 0 failed (unchanged assertions; the in-memory port gained one required stub method to satisfy the extended `FoodIntelligenceReadPort` interface).
3. `npm test` — full chain, 32 suites, zero regressions.
4. `npx tsc --noEmit` — no new error on any file this task touched (the pre-existing baseline of unrelated errors elsewhere in the repo — e.g. `household-discovery-handler.ts`, `test-intelligence-compound-resolver.ts` — is present before and after this task, matching the baseline FI3/NUT1/INT40/INT41 already documented; confirmed by a before/after diff of the affected-file list, which shows only `test-intelligence-food-intelligence-binding.ts` dropping out after the stub fix, and nothing new appearing).
5. `intelligencePlatform.getCapability("food-intelligence")!.executableIntents` is exactly `["recommend", "explain", "report"]`; `intelligencePlatform.listCapabilities().filter(c => c.availability === "available").length === 19`.

---

## DATA IMPACT

- Reads existing data: **YES** — `household_eaters` + planner familiarity (via `resolveHouseholdSignal`, unchanged read path from FI3), `planner_weeks`/`planner_days`/`planner_entries` (via `planner-read-port.ts`), `user_pantry_items` (via `pantry-read-port.ts`), `shopping_list` (via `shopping-read-port.ts`). All reads are through existing, unchanged owner functions/ports.
- Writes new data: **NO** — no new table, no new column (the one new field on `HouseholdSignal` is an in-memory TypeScript interface, not a schema change), no persistence anywhere in this engine.
- Changes meaning of existing data: **NO** — every source is read exactly as its existing owner already returns it.
- Requires backfill: **NO.**

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing surface consumes `report` yet (Companion reaches it only if a future turn is explicitly routed to it — no natural-language pattern was added, matching FI3's own precedent). Every opportunity that could reach a user carries real evidence from a real, named existing owner — never an invented one.
- **Could this fabricate certainty?** No. A caller with no resolvable household yields `householdAware: false` and an honest gap — never a fabricated household or activity. A household with genuinely no open opportunities yields a real, correct empty list, not a suppressed or padded one. A single domain's read failure (e.g. a household that has never opened the Pantry) degrades only that domain's contribution — it is never masked as "zero opportunities found" phrased as if the pantry were checked and empty; the `sources` array in the response metadata only names domains that were actually, successfully read.
- **Is anything guessed but shown as real?** No. Priority is a fixed, named, deterministic rule (fraction-of-week-unplanned; restriction match; planner-familiarity absence) — never a learned, inferred, or AI-generated score. Restriction-conflict evidence uses the same canonical resolver already trusted for allergen safety elsewhere in the app.
- **What happens if the system is wrong?** Worst case is an honest gap (no report) or a shorter-than-real opportunity list where one domain's read failed silently-degraded — never a false-safe suggestion, because every opportunity's evidence is a direct, unmodified projection of a real read, and never an autonomous action, because this engine has no write path anywhere (structurally, by construction — the port, handler and binding are read-only, exactly as FI3's own).
- No architectural duplication introduced: **YES** confirmed — see Architecture Convergence Status above.
- No new source of truth created: **YES** confirmed — this engine is a new *owner of an ambient reasoning process*, not a new source of truth for any business-domain fact.
- No runtime behaviour altered for any existing capability: **YES** confirmed — proven by the zero-regression full test-chain re-run, including FI3's own unmodified-in-substance assertions.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-fi4-ambient-food-intelligence-opportunity-engine-20260703` → `8ae0f7e`
- Files added: `server/intelligence/food-intelligence/opportunity-engine.ts`, `server/tests/test-intelligence-food-opportunity-binding.ts`, this file.
- Files modified (additive only): `server/intelligence/food-intelligence/engine.ts` (one function made `export`; one optional field added to `HouseholdSignal`), `server/intelligence/handlers/food-intelligence-read-port.ts` (one new method + type imports), `server/intelligence/handlers/food-intelligence-read-handler.ts` (one new verb handler + result type + switch case), `server/intelligence/bindings/food-intelligence.ts` (one verb added to the executable-intents array + doc comments), `server/intelligence/capability-registry.ts` (`supportedIntents` + description/owner text + one `ENRICHMENT` item on the existing `food-intelligence` entry — no new descriptor), `server/intelligence/index.ts` (new export block), `server/tests/test-intelligence-food-intelligence-binding.ts` (one required interface stub added to its in-memory port — no assertion changed), `package.json` (one new script + one chain entry).
- Rollback commands: `git checkout rollback/before-fi4-ambient-food-intelligence-opportunity-engine-20260703 -- <path>` for any file above, or delete the two new files and revert the listed additive edits.
- Verification after rollback: `git status` shows only the pre-FI4 dirty set; `intelligencePlatform.getCapability("food-intelligence")!.executableIntents` returns to `["recommend", "explain"]`; `npm test` chain returns to 31 suites.

---

## SCOPE LOCK

**Implemented scope (this task):**
- The Food Opportunity Engine (`server/intelligence/food-intelligence/opportunity-engine.ts`) — three deterministic opportunity generators (Planner empty-day gaps, Pantry unused-item suggestions, Shopping restriction conflicts) plus pure prioritisation, reusing FI3's engine, the three existing domain read ports, and the existing canonical/restriction resolvers throughout.
- A third executable verb (`report`) on the ALREADY-REGISTERED `food-intelligence` capability — no new capability, no new capability count.
- One additive export (`resolveHouseholdSignal`) and one additive interface field (`HouseholdSignal.householdId`) so the Opportunity Engine reuses existing household-resolution logic rather than duplicating it.
- 40 new automated test assertions (pure-core generators + prioritisation + full binding contract for `report`).
- One required interface-stub addition to the pre-existing FI3 test's in-memory port (no assertion changed — proves `recommend`/`explain` are unaffected).
- This implementation record.

**Explicitly excluded (out of scope — honest gaps, not oversights):**
- Any Planner/Shopping/Cookbook/Pantry UI or route wiring to call `report` directly — named as the next milestone, not built here (same exclusion FI3 recorded for `recommend`/`explain`).
- Any natural-language pattern in `pattern-intent-resolver.ts` making `report` reachable by free-text Companion conversation.
- Any external signal (wearables, biomarkers, activity — FI1 §6), any predictive/ML ranking, any LLM call anywhere in this engine — explicitly excluded by the brief and by Rule LT3.
- Any autonomous action — no code path here adds, edits, or removes a planner entry, shopping item, or pantry item; every `suggestedAction` is a suggestion for a human, never an executed action.
- Any opportunity type beyond the three built here (seasonal gaps, benefit/nutrient coverage gaps, etc.) — `FoodOpportunityType` is closed-but-extensible; adding a fourth type is future, separately scoped work.
- Any change to FI3's `recommend`/`explain` reasoning behaviour — both are provably unchanged (unmodified test assertions).
- Resolution of the Business Domain / Plane 1 convergence gap (M1/M2/M4, ~60%→100%) — tracked separately per FI1 §13, unaffected by this task.

**Suggestions for follow-up workstreams (not implemented without approval):**
- Wire one real domain consumer of `report` (a Planner "opportunities this week" strip, a Companion natural-language pattern surfacing the household's single top-priority opportunity) to prove the capability end-to-end for a real surface, per FI1 §7.1's target capability map — mirroring FI3's own named next milestone.
- A fourth opportunity type once a concrete, evidence-based, deterministic rule is specified and approved (e.g. a benefit/nutrient the household's planner has weak coverage for this week, composed from FI3's own `recommend` output plus the Planner read this task already performs).
- Once M1/M2/M4 retire the three contested Plane 1 duplicate files, re-confirm this engine still reads only converged owners (it should — it never touched the contested files).

---

## FILES CHANGED

| File | Change |
|---|---|
| `server/intelligence/food-intelligence/opportunity-engine.ts` | **New** — the Food Opportunity Engine: three pure generators + `prioritizeOpportunities()` + I/O orchestration `identifyOpportunities()` |
| `server/tests/test-intelligence-food-opportunity-binding.ts` | **New** — 40 assertions across 2 sections (pure generators + prioritisation, then binding contract for `report`) |
| `server/intelligence/food-intelligence/engine.ts` | `resolveHouseholdSignal` made `export`; `HouseholdSignal` gained one optional `householdId` field — reused by the Opportunity Engine, not re-derived |
| `server/intelligence/handlers/food-intelligence-read-port.ts` | New `identifyOpportunities` method on `FoodIntelligenceReadPort`, forwarding to the Opportunity Engine via dynamic import |
| `server/intelligence/handlers/food-intelligence-read-handler.ts` | New `handleReport` + `FoodOpportunityReportResult` type + `"report"` switch case |
| `server/intelligence/bindings/food-intelligence.ts` | `FOOD_INTELLIGENCE_EXECUTABLE_INTENTS` extended to include `"report"`; doc comments updated |
| `server/intelligence/capability-registry.ts` | `food-intelligence` descriptor's `supportedIntents` gained `"report"`; description/owner text updated; one new `ENRICHMENT` item added |
| `server/intelligence/index.ts` | New export block for the Opportunity Engine's public API; newly-exported `resolveHouseholdSignal`/`HouseholdSignal`/`NO_HOUSEHOLD_SIGNAL` from `engine.ts` |
| `server/tests/test-intelligence-food-intelligence-binding.ts` | One required interface-stub method added to its in-memory port (`identifyOpportunities`) — no assertion changed |
| `package.json` | + `test:intelligence-food-opportunity-binding`, added to the `test` chain |

Full chain (`npm test`, 32 suites) passes with zero regressions. `npx tsc --noEmit` introduces no new error on any file this task touched.

---

*Rollback: `rollback/before-fi4-ambient-food-intelligence-opportunity-engine-20260703` → `8ae0f7e`.*
