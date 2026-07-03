# FI3 — Food Intelligence Engine Foundation — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FI3 (🔴 RED — new Domain Intelligence capability: new module, new capability registration, new capability binding)
**Risk:** 🔴 RED
**Reason:** Introduces the first Food Intelligence Engine — a new deterministic join+rank+explain reasoning process, registered as a new capability (`food-intelligence`) on the Intelligence Platform, consumed today by Companion (via the platform) and named for future Planner/Shopping/Cookbook/Pantry consumption. New code, new capability metadata, new tests — not a documentation-only change.
**Builds on:** [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (EWO-FI1 — the governing architecture this task implements against) · [`FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md`](../investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md) / [`FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md`](./FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md) (the experience vision this engine ultimately serves) · [`NUT1_NUTRITION_CAPABILITY_ENRICHMENT.md`](./NUT1_NUTRITION_CAPABILITY_ENRICHMENT.md) (precedent for composing across existing capability results without a new owner)
**Tests:** `npm run test:intelligence-food-intelligence-binding` (36 assertions, new) — added to the `npm test` chain, run last. Full chain re-run (31 suites) with zero regressions.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Working tree at start | Already dirty with substantial prior uncommitted INT35–NUT1/FS-series/FI1/FI2-series work on this branch (pre-existing, unrelated to this task) |
| HEAD at start | `8ae0f7ef0f137e2f9baf86ef1727e7d17bc99af5` — "Add future-state nutrition vision investigation (EWO-NUT2)" |
| Rollback tag | `rollback/before-fi3-food-intelligence-engine-foundation-20260703` → `8ae0f7e` |
| This task's writes | See §"Files changed" below — 4 new source files + 1 new test file, and ~23 modified files, all additive (5 core wiring/doc files + 18 existing test files with a mechanical capability-count bump) |
| Code modified | Yes — see below (a new capability, not a change to any existing capability's behaviour) |
| Schema modified | None |
| Runtime modified | Additive only — a new, unbound-by-default-until-registered capability; every existing capability's registered behaviour is unchanged (proven by the full `npm test` chain re-run with zero regressions) |

**Rollback commands:** `git checkout rollback/before-fi3-food-intelligence-engine-foundation-20260703 -- <path>` for any file below, or delete the five new files and revert the additive edits (each is independently revertible — nothing else in the codebase reads any of the new exports).

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (workflow steps, RED classification, mandatory template)
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (EWO-FI1 — the governing architecture for this task: three-layer separation §2, Rule FI1 §3, four-plane model §4, trust rules T0–T2/G1/E1–E2/GO1–GO2/LT1–LT3/S1 §5, capability architecture §7, phased roadmap §8)
- [x] `docs/investigations/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` + `docs/implementation/FI2A_FOOD_INTELLIGENCE_VISION_REFINEMENT.md` (the experience vision this engine is the foundation for)
- [x] `docs/implementation/FI1_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE_PROMOTION.md` (precedent for how a Food Intelligence workstream records rollback/compliance)
- [x] `docs/implementation/NUT1_NUTRITION_CAPABILITY_ENRICHMENT.md` (precedent Port→Handler→Binding pattern and cross-capability composition discipline)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (the platform contract every capability binds to)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (confirmed the single owners this engine reads: WS0 Knowledge Registry, Household eaters, Planner history)
- [x] Existing code read in full before writing anything new: `server/lib/food-intelligence-assembler.ts`, `server/services/meal-food-intelligence.ts` (the two existing, surface-specific food-intelligence assemblers this workstream does NOT duplicate), `server/services/nutrition-knowledge-registry.ts`, `shared/restrictions/restriction-resolver.ts` + `restriction-types.ts`, `server/intelligence/handlers/household-read-handler.ts` + `household-read-port.ts`, `server/intelligence/handlers/nutrition-knowledge-read-handler.ts` + `-read-port.ts` (the Port→Handler→Binding template followed exactly), `server/intelligence/capability-registry.ts`, `server/intelligence/intelligence-platform.ts`, `server/intelligence/index.ts`, `server/intelligence/types.ts`

---

## OBJECTIVE

EWO-FI3 asks for the canonical Food Intelligence Engine Foundation: the first Food Intelligence Engine capable of producing reusable, explainable Food Intelligence recommendations, assembling trusted knowledge and existing business-domain information into structured outputs consumable by Planner, Shopping, Cookbook, Pantry and Companion — preserving existing ownership boundaries, deterministic behaviour and honest gaps, and explicitly excluding future signals, external integrations, or predictive capabilities.

This is the first concrete build against `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (FI1) §7.2's "Food Intelligence Engine" component — named there but, until this task, not built (FI1 §13: *"No Food Intelligence Engine ... exists yet"*).

### A named sequencing note (transparency, not a blocker)

FI1 §8 frames the Food Intelligence Engine as **Phase 1** work, gated behind **Phase 0** (100% Business Domain / Plane 1 convergence — completing M1/M2/M4 and FS1 licensing remediations). That gate has not fully closed: `client/src/lib/nutrition-benefit-library.ts`, `pantry-knowledge.ts`, and `nutrition-variety.ts` remain unretired duplicate owners (per FI1 §13, ~60% convergence).

This task proceeds under the direct instruction of EWO-FI3 (Rule LT1's phase gates are EWO-enforced — an EWO can authorise the next phase's first, narrowly-scoped increment). It is safe to proceed **without worsening or depending on** the open Phase 0 gap, because:

- The engine composes **only** over already-converged, single-owner sources: the WS0 Knowledge Registry (`nutrition-knowledge-registry.ts`), the Household capability's own eaters read, and the Planner's own history read. It never touches, reads from, or depends on any of the three contested Plane 1 duplicate stores named above.
- It introduces **no new knowledge store** and **no new duplicate** of anything Phase 0 is retiring — Rule 8 (Evolution over replacement) and the Architecture Compliance Checklist below both hold.
- Phase 0's M1/M2/M4 retirements remain exactly as open (or closed) as they were before this task; this task's convergence table (below) reports them unchanged.

If a future reviewer judges this sequencing note insufficient, the correct response is to pause further Food Intelligence Engine work (e.g. wiring Planner/Shopping/Cookbook/Pantry consumption) until Phase 0 formally closes — this task's own scope (the engine + one capability registration) does not need to wait, for the reasons above.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No new entity is introduced. Every recommendation keys on the existing
  canonical food slug (shared/canonical + WS0 knowledge_foods.slug) and the
  existing benefit/nutrient slug (WS0 knowledge_health_benefits.slug /
  knowledge_nutrients.slug) — the same identities nutrition-knowledge already
  uses. No new id space, no new primary key.

☑ One owner per fact
  Every fact surfaced traces to exactly one existing owner: WS0 Knowledge
  Registry (food/benefit/nutrient links, via getBenefitDetailView /
  getNutrientDetailView), shared/canonical/nutrition-context.ts (curated
  evidence lines), household_eaters + users.dietRestrictions (via the
  Household capability's own port + enrichEater — reused, not re-derived),
  and planner_entries/planner_days/planner_weeks (via
  food-intelligence-assembler.ts's existing fetchHouseholdPlannerFoods). The
  engine itself owns zero business-domain facts (Rule FI1).

☑ No duplicate entities
  No new table, no new schema, no new static content file. The engine reads
  existing entities only.

☑ No duplicate ownership
  Restriction-safety logic is NOT re-implemented: the engine reuses the exact
  household-eaters read + adult-diet-pattern enrichment the Household
  capability's own handler already performs (server/intelligence/handlers/
  household-read-handler.ts's `enrichEater`, now exported for this reuse —
  the only new export on an existing file). Planner familiarity is NOT
  re-derived: it reuses `fetchHouseholdPlannerFoods` from the existing WX4
  food-intelligence-assembler.ts verbatim.

☑ No duplicate state
  No user state is stored anywhere by this engine. Every bundle is computed
  fresh per request from existing owners and discarded — no cache, no
  session, no new column.

☑ Extends existing architecture
  Extends the Intelligence Platform's Port → Handler → Binding pattern
  (proven by 18 prior capabilities) against a new *kind* of owner — a
  reasoning engine that composes over other owners, exactly as FI1 §7.1/§7.2
  named "Food Intelligence Engine" as a future capability on the existing
  platform, requiring no new platform. Also extends (does not replace) the
  two existing surface-specific assemblers (server/lib/food-intelligence-
  assembler.ts, server/services/meal-food-intelligence.ts) — neither is
  touched, renamed, or retired; this engine is a new, reusable, cross-domain
  sibling, not a replacement.

☑ Progressive enrichment where appropriate
  N/A as a knowledge entity (this is a reasoning process, not a knowledge
  entity) — but the same discipline is honoured structurally: every
  recommendation's sections (evidenceContext, household) are independently
  optional; absent data renders as an honest empty/null, never fabricated.

☑ Honest gaps over fabricated information
  An unknown benefit/nutrient slug returns an ungrounded, empty bundle
  (isGrounded: false) — never invented candidates. A caller with no
  resolvable household (anonymous, or no active membership) falls back to
  Stage 1 (static) results — never a fabricated household. A requested
  foodSlug not among the grounded/safety-cleared candidates is an honest gap
  on `explain`, never a guessed explanation. Proven by 12+ of the 36 new test
  assertions.

☑ No permanent synchronisation bridge
  No bridge is created. Every read is live, per-request, direct to the
  existing owner — nothing is copied, cached, or kept in sync a second time.

☑ Evolution over replacement
  Nothing is replaced. The engine is new; every owner it reads from keeps its
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
✓ Uses the Capability Registry — a new descriptor added to the existing
  `SEED_CAPABILITIES_BASE` array, the one canonical allow-list.
✓ Uses the Intent Engine — routed through the existing LOCATE → VALIDATE →
  PERMISSION → CONFIRM → INVOKE → RESPOND pipeline unchanged.
✓ Reuses existing business services — nutrition-knowledge-registry.ts,
  the Household capability's own port + enrichEater, food-intelligence-
  assembler.ts's fetchHouseholdPlannerFoods, shared/restrictions/*,
  shared/canonical/nutrition-context.ts. No new database query is written
  outside those existing modules.
✓ Does not create another assistant — no conversation state, no LLM call
  anywhere in this engine (Rule LT3 — the brain stays deterministic).
✓ Does not duplicate conversation state — none is created or read.
✓ Uses registered capabilities only — the new `food-intelligence` capability
  follows the exact same registration/binding contract every other
  capability uses; no private route, no side-channel access.
✓ Uses permission-aware access — server-resolved context only; a caller's
  own household is resolved from their own userId, never a client-supplied
  household id (mirrors the Household capability's own discipline).
✓ Produces honest gaps rather than fabricated knowledge — see the Honest
  Gaps checklist item above.
```

---

## WHAT THIS TASK DID

### 1. The Food Intelligence Engine (`server/intelligence/food-intelligence/engine.ts`)

A new module implementing the deterministic **join + rank + explain** foundation named in FI1 §7.1/§7.2:

- **JOIN** — given a `{ scope: "benefit" | "nutrient", slug }` request, resolves the Plane 1 candidate set directly from the WS0 Knowledge Registry's own `getBenefitDetailView` / `getNutrientDetailView` (the exact food list the registry already links to that benefit/nutrient — no new join logic, the registry's own SQL join is reused as-is).
- **RANK** — a pure, exported function, `rankAndExplain(candidates, citation, householdSignal, limit)`, with **no I/O**: familiar (Stage 2 — already planned by the caller's household) candidates rank first; otherwise the registry's own editorial order is preserved (a stable sort, never a re-derived score). Being pure and I/O-free, this is the part of the engine most consumers (and this task's own tests) exercise directly, without a database.
- **EXPLAIN** — every recommendation carries a `citation` (the exact benefit/nutrient link that made it a candidate — Rule E1: no citation, no card), an optional curated `evidenceContext` line (reused verbatim from `shared/canonical/nutrition-context.ts`, the same content already shown on the Food Report — never rewritten), and a plain-English `explanation` trail that names only foods, links, and counts (Rule T1: food, not bodies).
- **SAFETY (Rule T0)** — when the caller's own household resolves, any candidate whose name/category conflicts with an active hard restriction (via the existing `shared/restrictions/restriction-resolver.ts`) is **excluded outright**, never merely deprioritised or shown with a caveat.
- **STAGE DISCIPLINE (Rule LT1)** — Stage 1 (static, household-independent) is the floor; Stage 2 (household-aware ranking + safety exclusion) is an honest upgrade that only activates when the caller's own household resolves. There is no learning, no personalisation-event log, no external signal, and no predictive ranking anywhere in this file — those remain named, future-gated FI1 §8 Phase 2+ components, explicitly out of scope per the brief.

The household-context read (`resolveHouseholdSignal`) is a thin, honest-fallback wrapper: it resolves the caller's own household via the Household capability's own port (`createStorageHouseholdReadPort`), reuses that capability's own adult-diet-pattern enrichment (`enrichEater`, now exported — see §2 below) for restriction data, and reuses the existing `fetchHouseholdPlannerFoods` (from `server/lib/food-intelligence-assembler.ts`) for planner familiarity. A caller with no userId, or no active household membership, or any read failure, yields the Stage 1 fallback (`NO_HOUSEHOLD_SIGNAL`) — never a thrown error surfaced to the caller, never a fabricated household.

### 2. One additive export — `enrichEater` (`server/intelligence/handlers/household-read-handler.ts`)

The adult-diet-pattern-to-hard-restriction enrichment the Household capability's `eaters` scope already performs was private to that file. It is now exported (one line: `async function` → `export async function`) so the Food Intelligence Engine reuses the *exact same* enrichment rather than growing a third copy (a second copy already exists at `server/routes.ts:8526–8541`, pre-existing and out of this task's scope to consolidate). No behaviour of the Household capability changes.

### 3. Port → Handler → Binding (the 19th live capability)

Following the identical pattern used by all 18 prior capabilities:

- `server/intelligence/handlers/food-intelligence-read-port.ts` — a one-method port (`assembleFoodIntelligence`) forwarding to the engine via a dynamic import (no database connection opens at module-load time).
- `server/intelligence/handlers/food-intelligence-read-handler.ts` — implements `recommend` (the primary output) and `explain` (a single-candidate drill-down), with honest gaps for missing parameters, an unresolved benefit/nutrient, or an `explain` target not among the grounded/safety-cleared candidates.
- `server/intelligence/bindings/food-intelligence.ts` — `bindFoodIntelligenceReadCapability`, registering `["recommend", "explain"]` as the executable intents (INT6A discipline — no over-advertising).
- Wired into `capability-registry.ts` (`SEED_CAPABILITIES_BASE` + a `GUIDANCE`/`ENRICHMENT` entry, following the same optional, capability-owned pattern every other capability uses), `intelligence-platform.ts` (bound on the canonical singleton, 19th in sequence), and `index.ts` (public exports).

**Public access, like `nutrition-knowledge`:** `food-intelligence` does **not** require authentication for its baseline (Stage 1) answer — `permissions.ownershipScoped: false`, `minimumRole: "user"`. When a caller is authenticated, their own `userId` (never a client-supplied household id) is passed to the engine for an honest Stage 2 upgrade. This mirrors the Household capability's own "never a client-suppliable household id" discipline while keeping general Food Knowledge Registry answers public, exactly as `nutrition-knowledge` already does.

### 4. What was deliberately NOT built (honest exclusions, matching the brief)

- **No Planner/Shopping/Cookbook/Pantry UI wiring.** The capability is registered and consumable by any caller through the standard `intelligencePlatform.handle()` path (which is how Companion already reaches every capability via the Conversation Gateway / Intent Engine) — but no domain page was wired to call it yet. Named as the next milestone below.
- **No natural-language pattern wiring in `pattern-intent-resolver.ts`.** That file is a carefully confidence-ordered regex/keyword matcher across 18 existing capabilities; adding phrase patterns for a 19th risks exactly the kind of unintended cross-capability interference the INT35 investigation ("why some assistant capabilities are not being reached") already documented. Reachability via a direct, typed `{ capabilityId: "food-intelligence", verb: "recommend", parameters }` intent is fully built and tested; free-text discovery of it is named as future work, not built here.
- **No Goals capability, no Personalisation Event Log, no Signals Gateway, no Community capability** — all named, unbuilt FI1 §7.2 components, correctly out of this task's scope. `food-intelligence`'s `scope` parameter accepts only the existing benefit/nutrient vocabulary nutrition-knowledge already exposes (Rule GO1 — goals are aliases, never authorities — is honoured by not inventing a goal-parsing layer here).
- **No learning, no event log, no external signal, no predictive ranking** — per the brief's explicit exclusion and FI1's Phase 1/2 gate (§8).

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Intelligence (new Domain Intelligence layer — reads
  three existing Business Domains, owns none of their data)
Declared SoT (per THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md, unchanged):
  - WS0 Knowledge Registry: shared/knowledge/ -> DB knowledge_* tables, via
    server/services/nutrition-knowledge-registry.ts
  - Household: DB households / household_members / household_eaters
  - Planner: DB planner_weeks / planner_days / planner_entries
New store created? NO
Existing store extended? NO
Consumer created? YES — a new capability (`food-intelligence`), reachable
  today via the Intelligence Platform (and therefore Companion, the same way
  every other capability already is). Reads from the declared SoT above via
  each domain's own existing service/port. YES, reads from declared SoT.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Intelligence (the Domain Intelligence layer named in
  THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §2, §7 — sitting between the
  Intelligence Platform and the Business Domains it reads)

Current Canonical Owner:
  This task's own owner: server/intelligence/food-intelligence/engine.ts (the
  Food Intelligence Engine — a new, single owner of the join+rank+explain
  reasoning process itself, per Rule FI1). It owns zero business-domain facts;
  the facts it composes remain owned by WS0 Knowledge Registry (SoT D1),
  Household eaters (SoT D16), and Planner history (SoT D14), exactly as
  before this task.

Current Runtime Consumer(s):
  The Intelligence Platform's Conversation Gateway (Companion), via the
  standard registered-capability path, the same way every other capability
  is reachable. No domain page (Planner/Shopping/Cookbook/Pantry) yet calls
  it directly — that wiring is the next milestone (see below).

Duplicate Owners Remaining:
  NONE introduced by this task. The three pre-existing Business Domain
  duplicates named in FI1 §13 (client/src/lib/nutrition-benefit-library.ts,
  pantry-knowledge.ts, nutrition-variety.ts) are unchanged by this task — this
  engine reads none of them and depends on none of them (see the "named
  sequencing note" in Objective above).

Duplicate State Remaining:
  NONE. No user state is stored by this engine anywhere.

Duplicate Workflows Remaining:
  NONE. The restriction-safety check and the planner-familiarity read each
  reuse an existing owner's own logic (enrichEater, fetchHouseholdPlannerFoods)
  rather than re-implementing either.

Current Convergence (%):
  Domain Intelligence layer (this task's own scope): 100% — the Food
  Intelligence Engine is now built and is the one canonical owner of this
  join+rank+explain reasoning process; no second implementation of it exists.
  Business Domain / Plane 1 layer (inherited, unchanged by this task): ~60%,
  per FI1 §13 — unchanged, since this task neither touches nor depends on the
  three contested files named there.

Target Convergence (%):
  100% for the Domain Intelligence layer (achieved by this task, for the
  scope it covers). The inherited Business Domain convergence target (100%)
  remains owned by the separate M1/M2/M4 workstreams (FI1 §13), unaffected by
  this task.

Next Planned Milestone:
  Wire one real domain consumer of `food-intelligence` (e.g. a Planner or
  Cookbook surface calling `recommend` directly, or a Companion natural-
  language pattern in pattern-intent-resolver.ts) — a future, separately
  gated EWO, per the "What was deliberately NOT built" section above. M1/M2/M4
  (Business Domain convergence) remain the next milestones for that separate,
  unaffected layer.

Remaining Architectural Risks:
  This task starts Phase 1 (FI1 §8) construction before the written Phase 0
  gate has fully closed (~60% Plane 1 convergence, not 100%) — see the "named
  sequencing note" in Objective above for why this specific, narrowly-scoped
  increment is safe despite that. A future workstream that widens this
  engine's scope (new signals, new stores, cross-domain writes) should
  re-confirm the Phase 0 gate at that time, not assume this precedent extends
  indefinitely.
```

---

## DEFINITION OF DONE

**What success looks like:**
- The Food Intelligence Engine exists (`server/intelligence/food-intelligence/engine.ts`) and produces deterministic, cited, explainable, safety-filtered recommendations for a benefit or nutrient ✅
- It is registered and bound as the platform's 19th live capability (`food-intelligence`, verbs `recommend` + `explain`) ✅
- Every recommendation carries a Plane 1 citation (Rule E1) and, when a household resolves, an honest Stage 2 context — never a fabricated one (Rule T0/T1) ✅
- Zero new business-domain data ownership; every fact traces to an existing single owner (Rule FI1) ✅
- 36 new automated assertions pass, covering the pure reasoning core and the full Port→Handler→Binding contract ✅
- This implementation record exists at `docs/implementation/FI3_FOOD_INTELLIGENCE_ENGINE_FOUNDATION.md` ✅

**What must not break:** every existing capability's registration, binding, guidance, enrichment, and conversation-gateway behaviour. Proven by the full `npm test` chain (31 suites, including the 16 existing binding tests whose exact-capability-count assertions were mechanically updated from 18→19 to reflect the new capability, following the same precedent INT26–INT32 established each time a new capability was bound) — zero regressions.

**Manual test steps:**
1. `npm run test:intelligence-food-intelligence-binding` — 36 passed, 0 failed.
2. `npm test` — full chain, 31 suites, zero regressions.
3. `npx tsc --noEmit` — no new error on any file this task touched (the large pre-existing, unrelated baseline of errors elsewhere in the repo, e.g. `household-discovery-handler.ts`, `test-intelligence-compound-resolver.ts`, is present before and after this task, matching the baseline NUT1/INT40/INT41 already documented).
4. `intelligencePlatform.getCapability("food-intelligence")!.availability === "available"` and `.executableIntents` is exactly `["recommend", "explain"]`.

---

## DATA IMPACT

- Reads existing data: **YES** — WS0 `knowledge_*` tables (via the existing registry service), `household_eaters` + `users.dietRestrictions`/`dietPattern` (via the existing Household port + enrichment), `planner_weeks`/`planner_days`/`planner_entries` (via the existing planner-foods read). All reads are through existing, unchanged owner functions.
- Writes new data: **NO** — no new table, no new column, no persistence anywhere in this engine.
- Changes meaning of existing data: **NO** — every source is read exactly as its existing owner already returns it.
- Requires backfill: **NO.**

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing surface consumes this yet (Companion reaches it only if a future turn is explicitly routed to it — no natural-language pattern was added). Every recommendation that could reach a user carries a real citation and, when applicable, a real household fact — never an invented one.
- **Could this fabricate certainty?** No. An unknown benefit/nutrient yields `isGrounded: false` and an empty list. A food not linked by the registry can never appear as a candidate (it is never in the JOIN result to begin with). A caller with no household yields Stage 1 only — `household: null` on every recommendation, never a guessed household.
- **Is anything guessed but shown as real?** No. Evidence-context lines are reused verbatim from already-reviewed content; nothing is generated or paraphrased. Restriction exclusion uses the same canonical resolver already trusted for allergen safety elsewhere in the app.
- **What happens if the system is wrong?** Worst case is an honest gap (no recommendation) or a Stage 1 fallback where Stage 2 was expected — never a false-safe recommendation, because Rule T0 exclusion is unconditional whenever a restriction resolves, and never a false citation, because every recommendation is constructed from the citation that produced it.
- No architectural duplication introduced: **YES** confirmed — see Architecture Convergence Status above.
- No new source of truth created: **YES** confirmed — this engine is a new *owner of a reasoning process*, not a new source of truth for any business-domain fact.
- No runtime behaviour altered for any existing capability: **YES** confirmed — proven by the zero-regression full test-chain re-run.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-fi3-food-intelligence-engine-foundation-20260703` → `8ae0f7e`
- Files added: `server/intelligence/food-intelligence/engine.ts`, `server/intelligence/handlers/food-intelligence-read-port.ts`, `server/intelligence/handlers/food-intelligence-read-handler.ts`, `server/intelligence/bindings/food-intelligence.ts`, `server/tests/test-intelligence-food-intelligence-binding.ts`, this file.
- Files modified (additive only): `server/intelligence/capability-registry.ts` (new capability + GUIDANCE + ENRICHMENT entries), `server/intelligence/intelligence-platform.ts` (import + bind call), `server/intelligence/index.ts` (new export block), `server/intelligence/handlers/household-read-handler.ts` (one function made `export`), `package.json` (one new script + one chain entry), 16 existing test files + `test-intelligence-platform.ts` + `test-intelligence-registry-executability.ts` (exact-capability-count assertions bumped 18→19 / 20→21, mechanical, no logic change).
- Rollback commands: `git checkout rollback/before-fi3-food-intelligence-engine-foundation-20260703 -- <path>` for any file above, or delete the five new files and revert the listed additive edits.
- Verification after rollback: `git status` shows only the pre-FI3 dirty set; `intelligencePlatform.getCapability("food-intelligence")` returns `undefined`; `npm test` chain returns to 30 suites.

---

## SCOPE LOCK

**Implemented scope (this task):**
- The Food Intelligence Engine (`server/intelligence/food-intelligence/engine.ts`) — deterministic join+rank+explain over the WS0 Knowledge Registry, with an honest Stage 2 household-aware upgrade (familiarity ranking + Rule T0 safety exclusion) reusing the Household capability's own port/enrichment and the existing planner-foods read.
- Registration and binding of `food-intelligence` as the platform's 19th live capability (`recommend` + `explain`), following the exact Port→Handler→Binding pattern every prior capability uses.
- One additive export (`enrichEater`) so the engine reuses existing household-restriction-enrichment logic rather than duplicating it.
- 36 new automated test assertions (pure-core + full binding contract).
- Mechanical updates to 18 existing test files' exact-capability-count assertions (18→19 / 20→21), consistent with the precedent every prior capability addition (INT26–INT32) established.
- This implementation record.

**Explicitly excluded (out of scope — honest gaps, not oversights):**
- Any Planner/Shopping/Cookbook/Pantry UI or route wiring to call `food-intelligence` directly — named as the next milestone, not built here.
- Any natural-language pattern in `pattern-intent-resolver.ts` making this capability reachable by free-text Companion conversation — the capability is fully reachable by a direct typed intent today; free-text discovery is separate, future work given the risk of interfering with the existing 18-capability confidence-ordered matcher.
- Any Goals capability, Personalisation Event Log, Signals Gateway, or Community capability (FI1 §7.2, all unbuilt, all future EWOs).
- Any learning, personalisation-event logging, external signal, or predictive ranking (explicitly excluded by the brief and by FI1 §8's Phase 1/2 gate).
- Any change to the two existing surface-specific assemblers (`server/lib/food-intelligence-assembler.ts`, `server/services/meal-food-intelligence.ts`) — both remain exactly as they were; this engine is a new, reusable, cross-domain sibling, not a replacement or a refactor of either.
- Resolution of the Business Domain / Plane 1 convergence gap (M1/M2/M4, ~60%→100%) — tracked separately per FI1 §13, unaffected by this task.

**Suggestions for follow-up workstreams (not implemented without approval):**
- Wire one real domain consumer (a Planner "ambient nutrient gap" strip, a Cookbook "recommended foods" panel, or a Companion natural-language pattern) to prove the capability end-to-end for a real surface, per FI1 §7.1's target capability map.
- Once M1/M2/M4 retire the three contested Plane 1 duplicate files, re-confirm this engine still reads only the converged WS0 Knowledge Registry (it should — it never touched the contested files) and record the Phase 0 gate as formally closed for any subsequent Food Intelligence Engine expansion.

---

## FILES CHANGED

| File | Change |
|---|---|
| `server/intelligence/food-intelligence/engine.ts` | **New** — the Food Intelligence Engine: pure `rankAndExplain()` + I/O orchestration `assembleFoodIntelligence()` |
| `server/intelligence/handlers/food-intelligence-read-port.ts` | **New** — narrow port forwarding to the engine (dynamic import) |
| `server/intelligence/handlers/food-intelligence-read-handler.ts` | **New** — `recommend` + `explain` verb handling, honest gaps |
| `server/intelligence/bindings/food-intelligence.ts` | **New** — `bindFoodIntelligenceReadCapability`, the 19th binding |
| `server/intelligence/handlers/household-read-handler.ts` | `enrichEater` made `export` (one line) — reused by the engine |
| `server/intelligence/capability-registry.ts` | New `food-intelligence` capability descriptor + `GUIDANCE`/`ENRICHMENT` entries |
| `server/intelligence/intelligence-platform.ts` | Import + bind call for the new binding; doc comment updated |
| `server/intelligence/index.ts` | New export block for the binding/handler/port/engine |
| `server/tests/test-intelligence-food-intelligence-binding.ts` | **New** — 36 assertions across 2 sections (pure core + binding contract) |
| `package.json` | + `test:intelligence-food-intelligence-binding`, added to the `test` chain |
| 16 existing `test-intelligence-*-binding.ts` files + `test-intelligence-platform.ts` + `test-intelligence-registry-executability.ts` | Exact-capability-count assertions updated (18→19 live / 20→21 registered), mechanical only — same precedent as INT26–INT32 |

Full chain (`npm test`, 31 suites) passes with zero regressions. `npx tsc --noEmit` introduces no new error on any file this task touched.

---

*Rollback: `rollback/before-fi3-food-intelligence-engine-foundation-20260703` → `8ae0f7e`.*
