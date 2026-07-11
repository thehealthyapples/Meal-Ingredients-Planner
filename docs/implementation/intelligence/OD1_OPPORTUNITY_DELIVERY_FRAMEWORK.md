# OD1 — Opportunity Delivery Framework — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-OD1 (🔴 RED — new capability, new schema, new cross-cutting framework governing a mechanism no prior workstream owned)
**Risk:** 🔴 RED
**Reason:** Introduces the canonical, cross-cutting Opportunity Delivery Framework — a NEW platform capability (`opportunity-delivery`, the platform's twentieth), a NEW database table (`opportunity_deliveries`), a NEW user-preference column, and the platform's first turn-independent (ambient) acknowledge/dismiss/accept lifecycle. Not documentation-only, not purely additive metadata — new reasoning module, new persistent state, new tests.
**Builds on:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1/TIP2 — the governing capability/intent/permission model this framework is implemented *as*, not alongside) · [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (FI1 — the Domain Intelligence layer this framework governs the delivery of) · [`FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md`](./FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md) (the one existing opportunity producer this framework fans out to today, extended not replaced) · [`INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md`](./INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md) / [`INT41_CAPABILITY_ENRICHMENT.md`](./INT41_CAPABILITY_ENRICHMENT.md) (the capability-owned declarative-extension pattern this framework's producer registration mirrors) · [`INT40_COMPANION_TASK_DELEGATION_AND_ASSISTED_ACTIONS.md`](./INT40_COMPANION_TASK_DELEGATION_AND_ASSISTED_ACTIONS.md) (the proposed→terminal lifecycle idea this framework's delivery-status lifecycle adapts to a turn-independent shape)
**Tests:** `npm run test:intelligence-opportunity-delivery-binding` (50 assertions, new) — added to the `npm test` chain, run last. Full chain re-run (33 suites) with zero regressions.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Working tree at start | Already dirty with substantial prior uncommitted INT35–NUT1/FS-series/FI1–FI4/GOV-series work on this branch (pre-existing, unrelated to this task — same state FI4's own rollback table documents) |
| HEAD at start | `8ae0f7ef0f137e2f9baf86ef1727e7d17bc99af5` — "Add future-state nutrition vision investigation (EWO-NUT2)" |
| Rollback tag | `rollback/before-od1-opportunity-delivery-framework-20260703` → `8ae0f7e` |
| This task's writes | See "Files Changed" below — 7 new source/test/doc files, and ~19 modified files, all additive |
| Code modified | Yes — a new capability (`opportunity-delivery`) registered and bound; every existing capability's registered behaviour is unchanged (proven by the full `npm test` chain re-run with zero regressions) |
| Schema modified | Yes — one new table (`opportunity_deliveries`) and one new column (`user_preferences.muted_opportunity_types`), both additive, both `IF NOT EXISTS`-guarded in the migration runner |
| Runtime modified | Additive only — a new capability with its own new verbs; every existing capability's registered behaviour, executable verbs, guidance and enrichment are unchanged |

**Rollback commands:** `git checkout rollback/before-od1-opportunity-delivery-framework-20260703 -- <path>` for any file below, or delete the new files and revert the additive edits (each is independently revertible — nothing outside this task's own files reads any of the new exports yet).

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (workflow steps, RED classification, mandatory template)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight governing principles)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (confirmed no existing store owns opportunity-delivery lifecycle state; confirmed INT38/39/40's own new `companion_*` tables were never back-filled into this register either — this task follows that same existing precedent rather than doing unscoped governance cleanup; see "Suggestions for follow-up")
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1/TIP2 — the governing architecture this task implements against: the closed 20-verb intent taxonomy, the Capability Registry/Intent Engine/permission model, the server-side confirmation-tier model)
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (confirmed `report`/`review`/`approve`/`delete` are four of the platform's 20 closed canonical intent verbs; no new verb was invented for `report` [collect/deliver], `review` [acknowledge], `approve` [accept], `delete` [dismiss])
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (EWO-FI1 — the Domain Intelligence layer this framework governs delivery *for*, not a member of; confirmed FI1 never itself named an "Opportunity Delivery Framework" — this is new ground, not a promotion of an already-planned component)
- [x] `docs/implementation/intelligence/FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md` (the exact, single existing opportunity producer this framework fans out to; confirmed its `FoodOpportunity`/`FoodOpportunityBundle` types and `report` verb are reused verbatim, never re-declared)
- [x] `docs/implementation/intelligence/INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md`, `docs/implementation/intelligence/INT41_CAPABILITY_ENRICHMENT.md` (the "capability declares its own metadata, merged into the seed array" pattern this framework's `ENRICHMENT` entry follows; confirmed neither of these is itself an opportunity/delivery mechanism)
- [x] `docs/implementation/intelligence/INT38_COMPANION_GUIDANCE_AND_ACTION_FRAMEWORK.md`, `docs/implementation/intelligence/INT40_COMPANION_TASK_DELEGATION_AND_ASSISTED_ACTIONS.md` (confirmed `companion_response_feedback`/`companion_guidance_events`/`companion_action_proposals` are ALL FK'd to `conversation_turns` — the wrong shape for an ambient, turn-independent opportunity; this task's `opportunity_deliveries` is deliberately scoped to `userId` directly instead, and adapts INT40's proposed→terminal lifecycle idea to that different shape rather than reusing its table)
- [x] Existing code read in full before writing anything new: `server/intelligence/food-intelligence/opportunity-engine.ts` (the `FoodOpportunity`/`FoodOpportunityBundle` shape and `prioritizeOpportunities` tier convention this framework's own `prioritiseAndGroup` extends across producers), `server/intelligence/handlers/food-intelligence-read-{port,handler}.ts` and `server/intelligence/bindings/food-intelligence.ts` (the exact Port → Handler → Binding shape this task's own port/handler/binding trio mirrors), `server/intelligence/conversation/companion-action-store.ts` (the `IStore`/`DatabaseStore`/`InMemoryStore` + terminal-status discipline `delivery-store.ts` mirrors), `server/intelligence/capability-registry.ts` (the `GUIDANCE`/`ENRICHMENT` declarative-extension-merge pattern; the exact seed-array shape a new capability descriptor must match), `server/intelligence/intelligence-platform.ts` (confirmed `handle()` operates on exactly one `(capabilityId, verb)` pair — there was no prior cross-capability fan-out point, which this framework had to build for the first time), `server/intelligence/types.ts` (the closed `IntentVerb` union; `CapabilityPermissions`; `CapabilityExecutionError`), `server/intelligence/permissions.ts` (confirmed `confirmationFor()` maps `review`/`approve`/`delete` to **`strong`** confirmation platform-wide, by verb, regardless of capability — this framework does not special-case that; see Trust Check), `server/intelligence/conversation/conversation-store.ts` (the closed `ConversationSurface` union this framework's `selectSurface()` maps onto — no new surface type was invented), `server/storage.ts` (`getUserPreferences` — the existing, sole reader of `user_preferences`, reused rather than re-queried), `shared/schema.ts` (confirmed no existing table already modelled an opportunity-delivery lifecycle), `server/migrations/runner.ts` (the append-only, `IF NOT EXISTS`-guarded migration convention).

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No opportunity gets a new identity of its own. Every DeliverableOpportunity's id
  is `${producingCapabilityId}:${the producer's own opportunity id}` — a namespaced
  projection of an identity the producer (today: food-intelligence's
  `type:recordId` convention, FI4) already owns. This framework introduces exactly
  ONE new id space: the opportunity_deliveries.id surrogate key for its own
  delivery-record rows — a record ABOUT a delivery, never a second identity FOR
  the opportunity or the business-domain fact behind it.

☑ One owner per fact
  Every opportunity's explanation/evidence/suggestedAction is a verbatim
  projection of what the producing capability already returned via the ordinary
  `intelligencePlatform.handle()` path — this framework re-derives NONE of it.
  The one new fact this framework DOES own — "has user X seen/dismissed/accepted
  opportunity Y" — has exactly one owner: delivery-store.ts, the sole reader/writer
  of `opportunity_deliveries` (mirrors companion-action-store.ts's sole-owner
  discipline for `companion_action_proposals`).

☑ No duplicate entities
  No new opportunity TYPE, PRIORITY or DOMAIN taxonomy is introduced —
  DeliverableOpportunity's `type`/`priority`/`domain` fields are copied verbatim
  from whatever the producer already declared (FoodOpportunityType,
  FoodOpportunityPriority, FoodOpportunityDomain, FI4). No second "opportunity
  catalogue" exists anywhere.

☑ No duplicate ownership
  `mutedOpportunityTypes` is read via the EXISTING `storage.getUserPreferences()`
  (server/storage.ts) — not re-queried directly from `user_preferences` a second
  way. Producer fan-out goes through the EXISTING `intelligencePlatform.handle()`
  path (LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND) — this
  framework does not call `identifyOpportunities()` or any other producer
  internals directly, so a producer's own permission/gap/degrade behaviour is
  never re-implemented, only delegated to.

☑ No duplicate state
  Producer output itself (the opportunity's content) is NEVER persisted or
  cached — it is recomputed fresh from the producer on every `report`, exactly as
  FI4 already does. Only the DELIVERY metadata (which ids this user has seen/
  resolved, and when) is stored — a genuinely new fact with no prior owner, not a
  second copy of an existing one.

☑ Extends existing architecture
  Adds ONE new capability (`opportunity-delivery`, the platform's twentieth) using
  the closed 20-verb taxonomy (`report`/`review`/`approve`/`delete` — no new verb
  invented) and the identical Port → Handler → Binding pattern proven 19 times
  over. Extends (does not replace) FI4's Food Opportunity Engine: `opportunity-
  engine.ts` is untouched; this framework only calls it through the platform's own
  registered `report` verb, exactly as any other consumer would.

☑ Progressive enrichment where appropriate
  Producer fan-out is independently optional per producer (mirrors
  identifyOpportunities()'s own per-domain try/catch discipline): a producer that
  is not registered, not executable, or returns a non-"ok" outcome (including an
  honest gap) simply contributes zero opportunities — it never blocks any other
  registered producer, and never fails the whole `report` call.

☑ Honest gaps over fabricated information
  An anonymous caller (`report`) yields an honest empty bundle (`resolved:
  false`), never a fabricated opportunity. `review`/`approve`/`delete` on an
  opportunityId this user was never delivered returns an honest gap (`null` from
  `resolveOpportunity`, surfaced as a structured `CapabilityExecutionError("gap",
  ...)` by the handler) — you cannot resolve what was never delivered. A
  producer's own gap (e.g. FI4's "no household resolves") degrades to zero
  opportunities from that producer, never an error thrown up to the caller.

☑ No permanent synchronisation bridge
  No opportunity content is synchronised or copied anywhere. The only persisted
  state is the delivery lifecycle itself (delivered/acknowledged/dismissed/
  accepted) — a record OF a delivery event, not a mirror of the producer's data.

☑ Evolution over replacement
  Nothing is replaced. FI4's `opportunity-engine.ts`, its `report` verb, and its
  existing test suite (40 assertions) are provably unchanged (unmodified in
  substance, full chain re-run with zero regressions). This framework's own
  `OPPORTUNITY_SOURCES` producer-registration map is deliberately closed-but-
  extensible — a future Domain Intelligence producer is a one-line addition here,
  never a rewrite of this framework's collection/prioritisation/dedup logic.
```

**AI ARCHITECTURE COMPLIANCE**

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — registered via `intelligencePlatform`
  (the one singleton), not a new platform instance. Producer fan-out calls
  `intelligencePlatform.handle()` (dynamically imported at call time, to avoid a
  circular import with the platform module that binds this framework's OWN
  capability) rather than any producer's internals directly.
✓ Uses the Capability Registry — `opportunity-delivery` is a new entry in the ONE
  canonical `SEED_CAPABILITIES_BASE` array; no second registry, no bypass.
✓ Uses the Intent Engine — routed through the existing LOCATE → VALIDATE →
  PERMISSION → CONFIRM → INVOKE → RESPOND pipeline unchanged. `report`, `review`,
  `approve`, `delete` are four of the platform's 20 closed canonical intent verbs
  (TIP2 §3.1) — no new verb was invented. `review`/`approve`/`delete` are
  platform-wide "strong" confirmation verbs (`permissions.ts::confirmationFor` —
  a verb-driven rule, not something this task added or special-cased) — a caller
  must pass `options.confirmed === true` before the handler is ever reached, the
  same gate every other write verb on this platform already goes through.
✓ Reuses existing business services — `storage.getUserPreferences()` (the
  existing, sole `user_preferences` reader); the existing `food-intelligence`
  capability's own registered `report` verb (never its internal engine module
  imported directly). No new database query bypasses an existing owner.
✓ Does not create another assistant — no conversation state, no LLM call anywhere
  in this framework (mirrors FI4's Rule LT3 — the brain stays deterministic;
  priority is the same fixed, named tier rule FI4 established, never learned).
✓ Does not duplicate conversation state — `opportunity_deliveries` is scoped to
  `userId` directly, deliberately NOT to `conversationTurnId` (unlike INT38/39/40's
  companion tables) because these opportunities are ambient, not conversational.
✓ Uses registered capabilities only — producer fan-out is driven entirely by
  `OPPORTUNITY_SOURCES` (today: `food-intelligence`), each entry calling that
  capability's own already-registered verb; no private route, no side-channel.
✓ Uses permission-aware access — `context.userId` only (never a client-supplied
  id), enforced twice: once by the platform's own permission/confirmation gate for
  `opportunity-delivery` itself, and once implicitly for every producer call
  (each producer's own registered permission rules apply automatically, since
  fan-out goes through `intelligencePlatform.handle()`, not a bypass).
✓ Produces honest gaps rather than fabricated knowledge — see the Honest Gaps
  checklist item above.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Intelligence Governance (a NEW cross-cutting layer, per
  THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md — sitting ABOVE the Domain
  Intelligence layer, governing how any number of opportunity producers there are
  prioritised/grouped/deduplicated/surfaced/resolved, not a member of that layer
  itself). Reads ONE existing Domain Intelligence producer today (food-
  intelligence, FI4's `report` verb); owns NONE of its data.
Declared SoT (per THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md):
  - This task's own NEW store: DB `opportunity_deliveries` — sole owner
    server/intelligence/opportunity-delivery/delivery-store.ts. Not yet
    back-filled into the SoT Register document itself (see "Suggestions for
    follow-up" — the same gap INT38/39/40's own new companion_* tables already
    have; this task does not silently fix a pre-existing, separate gap under an
    unrelated EWO).
  - Reads (never writes): user_preferences.muted_opportunity_types (this task's
    own new column, read via the existing storage.getUserPreferences() owner);
    food-intelligence's own opportunities (SoT: Household/Planner/Pantry/Shopping,
    per FI4 — read only via food-intelligence's own registered `report` verb,
    never a second path into those tables).
New store created? YES — opportunity_deliveries (additive, IF NOT EXISTS-guarded
  migration). One new column: user_preferences.muted_opportunity_types (additive).
Existing store extended? NO existing table is altered in shape or meaning; only
  ONE additive column added to user_preferences.
Consumer created? YES — a new capability (`opportunity-delivery`) with four new
  verbs, reachable today via the Intelligence Platform (and therefore Companion,
  the same way every other capability already is). No domain page or Companion
  natural-language pattern was wired to call it yet (see Scope Lock).
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Intelligence Governance (new — the layer THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md
  names as "how the platform routes to existing owners", now extended with a
  cross-cutting concern for one specific kind of output: opportunities from Domain
  Intelligence producers). This task establishes the layer for the first time; it
  had zero prior instances to converge or diverge from.

Current Canonical Owner:
  This task's own owner: server/intelligence/opportunity-delivery/framework.ts
  (collection, prioritisation, grouping, dedup, surface selection — zero producer
  reasoning, zero business-domain facts) and delivery-store.ts (the sole owner of
  the new opportunity_deliveries table). The facts any opportunity cites remain
  owned exactly where FI4 already declared them (Household SoT D16, Planner SoT
  D14, Pantry SoT D8-11, Shopping SoT D15) — unchanged by this task.

Current Runtime Consumer(s):
  The Intelligence Platform's Conversation Gateway (Companion), via the standard
  registered-capability path — the same way every other capability is already
  reachable. No domain page (Planner/Shopping/Cookbook/Pantry) and no Companion
  natural-language pattern yet calls `opportunity-delivery` directly — that wiring
  is the next milestone, the same honest-exclusion pattern FI3/FI4 already
  recorded for their own verbs.

Duplicate Owners Remaining:
  NONE introduced by this task. This framework reads exactly one producer
  (food-intelligence) through its own already-registered `report` verb; it holds
  no second copy of Planner/Pantry/Shopping/Household data anywhere.

Duplicate State Remaining:
  NONE new. Opportunity CONTENT is never persisted (recomputed fresh every
  `report`, exactly as FI4 already does) — only the new, previously-nonexistent
  delivery-lifecycle fact is stored, in exactly one place.

Duplicate Workflows Remaining:
  NONE. Producer fan-out reuses the platform's own existing `handle()` pipeline
  (no second routing mechanism); preference reads reuse
  storage.getUserPreferences() (no second `user_preferences` reader); the
  terminal-status/idempotent-resolve pattern reuses (adapts, does not
  reimplement independently of) the discipline `companion-action-store.ts`
  already established for a different (turn-scoped) lifecycle.

Current Convergence (%):
  Intelligence Governance layer (this task's own scope): 100% — the Opportunity
  Delivery Framework is now built and is the one canonical owner of
  prioritise/group/dedupe/surface-select/resolve for Domain Intelligence
  opportunities; no second implementation of it exists. Domain Intelligence layer
  (inherited, unchanged by this task): unchanged from FI4's own stated position —
  this task neither touches nor depends on any of FI1 §13's contested files.

Target Convergence (%):
  100% for the Intelligence Governance layer (achieved by this task, for the
  scope it covers — one registered producer, proven extensible). Widening to a
  second real producer, and to a real consuming surface, are both separately
  gated future EWOs (see "Suggestions for follow-up").

Next Planned Milestone:
  Wire one real consumer of `opportunity-delivery`'s `report` verb (a Planner/
  Companion surface actually rendering delivered opportunities and calling
  `review`/`approve`/`delete`), and/or register a second Domain Intelligence
  producer in `OPPORTUNITY_SOURCES` to prove the cross-producer prioritise/group
  logic against more than one real producer — both future, separately scoped and
  approved EWOs, per the "What was deliberately NOT built" section below.

Remaining Architectural Risks:
  This task's `OPPORTUNITY_SOURCES` map has exactly one entry — its cross-producer
  behaviour (prioritise/group across MORE than one producer) is proven only by
  unit tests with synthetic multi-producer fixtures (§1 of the new test suite),
  not yet by a second real producer. A future workstream registering a genuine
  second producer should re-confirm the adapter contract (RawOpportunity shape)
  is expressive enough before assuming this precedent extends indefinitely — the
  same narrowly-scoped-sequencing discipline FI4 already applied to its own
  four-Business-Domain widening.
```

---

## WHAT THIS TASK DID

### 1. A new, turn-independent delivery store (`server/intelligence/opportunity-delivery/delivery-store.ts`)

The sole owner of the new `opportunity_deliveries` table, mirroring `companion-action-store.ts`'s `IStore`/`DatabaseStore`/`InMemoryStore` discipline exactly, but scoped to `userId` directly rather than `conversationTurnId` — because a Domain Intelligence opportunity is ambient (generated from a household's own existing activity), not a conversational artefact. One row per (user, opportunity) pair, `UNIQUE(userId, opportunityId)`-guarded. Status lifecycle: `delivered` (default, on first report) → `acknowledged` (seen, non-terminal — still eligible for future reports) → `dismissed` or `accepted` (terminal — suppressed from all future reports for that user, and never re-transitioned by a later resolve call — the same idempotent-terminal-state discipline `companion-action-store.ts` already established for a different lifecycle). `mutedOpportunityTypes` is read via the EXISTING `storage.getUserPreferences()` — never a second `user_preferences` query path.

### 2. The framework itself (`server/intelligence/opportunity-delivery/framework.ts`)

The pure-core / I/O-orchestration split every Domain Intelligence engine on this platform already follows (mirroring `opportunity-engine.ts`):

- **`OPPORTUNITY_SOURCES`** — the one place a Domain Intelligence capability declares itself an opportunity producer: a capability id, the verb to call (`report`), and an `adapt()` function translating that capability's own result shape into a generic `RawOpportunity` envelope. Seeded today with exactly one entry, `food-intelligence`, adapting FI4's `FoodOpportunityReportResult` shape. Adding a second producer is a one-line addition to this map — no change to any collection, prioritisation, dedup, or surface-selection logic below it.
- **`selectSurface(domain)`** — a fixed, deterministic `domain → ConversationSurface` map (`planner`, `pantry`, `shopping` today; any unmapped domain falls back to the Companion's own `"floating"` surface — an honest gap, never a guess). Reuses the existing `ConversationSurface` union verbatim; no new surface type was invented.
- **`filterMutedTypes(opportunities, mutedTypes)`** — a pure filter removing any opportunity whose `type` the caller has muted in their own preferences.
- **`partitionForDelivery(candidates, existingByOpportunityId)`** — the pure duplicate-delivery-prevention core: an opportunity already `dismissed`/`accepted` is suppressed entirely (never redelivered); an opportunity already `delivered`/`acknowledged` stays visible but is never re-inserted as a second row.
- **`prioritiseAndGroup(opportunities, limit)`** — extends FI4's own fixed high/medium/low stable-sort tier convention across the MERGED, cross-producer list (not just within one producer's own output), clamps to `limit` (1–30, default 10, same convention FI4 established), then partitions the surviving set by owning domain into a `grouped` view alongside the flat, prioritised `opportunities` list — the one genuinely new capability (grouping) neither FI4 nor any prior workstream had.
- **`collectOpportunities(request, deps)`** — the I/O orchestration: fans out to every registered producer via an injectable `ProducerFetch` (default: `intelligencePlatform.handle()`, dynamically imported at call time — a static import would be circular, since the platform binds this framework's own capability), catching each producer's failure independently (mirrors `identifyOpportunities()`'s per-domain degrade-without-blocking discipline), then muted-filters, dedup-partitions, prioritises/groups, and persists only the NEWLY-surfacing, still-open opportunities. Always returns a complete bundle — never throws; an anonymous caller yields an honest empty bundle.
- **`resolveOpportunity(userId, opportunityId, targetStatus, store)`** — acknowledge/dismiss/accept. Returns `null` (an honest gap, for the handler to surface) when this user has no delivery record for the given id. Idempotent: re-resolving an already-terminal record returns its existing, unchanged resolution.

### 3. A new capability — `opportunity-delivery` (the platform's twentieth, not an extension of an existing one)

Following FI4's own reasoning for choosing `report` for "a structured, prioritised list", this framework maps its four operations onto four of the platform's 20 closed canonical verbs — no new verb invented:

- `report`  — collect, dedupe, prioritise, group and deliver.
- `review`  — acknowledge (mark seen; non-terminal).
- `approve` — accept (terminal).
- `delete`  — dismiss (terminal).

`review`/`approve`/`delete` are platform-wide **"strong"** confirmation verbs (`permissions.ts::confirmationFor` — a verb-driven rule this task did not add or special-case); a caller must pass `options.confirmed === true` before the handler is ever reached, exactly the same gate every other write verb already goes through.

- `server/intelligence/handlers/opportunity-delivery-read-port.ts` — the thin delegation seam (mirrors `food-intelligence-read-port.ts`): `collectOpportunities`, `resolveOpportunity`, both forwarding to the framework via dynamic import (no database connection opens at module load).
- `server/intelligence/handlers/opportunity-delivery-handler.ts` — `handleReport`/`handleResolve`; requires `context.userId` (never a client-supplied id) for every verb; a missing or never-delivered `opportunityId` is an honest gap.
- `server/intelligence/bindings/opportunity-delivery.ts` — binds the handler; `OPPORTUNITY_DELIVERY_EXECUTABLE_INTENTS = ["report", "review", "approve", "delete"]`.
- `server/intelligence/capability-registry.ts` — new `opportunity-delivery` descriptor (`capabilityClass: "write"`, `ownershipScoped: true` — correctly modelling per-user ownership at the registry-permission level, unlike food-intelligence's own `ownershipScoped: false` modelling gap noted during this task's research); one new `ENRICHMENT` item explaining that resolving an opportunity never touches the underlying planner/pantry/shopping data.
- `server/intelligence/index.ts` — new export block for the framework's, delivery-store's, port's, handler's and binding's public API.
- `server/intelligence/intelligence-platform.ts` — one new import + one new `bindOpportunityDeliveryCapability(intelligencePlatform)` call, plus a doc-comment entry matching the file's own running history of every capability bound so far.

**Nineteen existing capabilities are unaffected; the platform now has exactly twenty.**

### 4. Two additive schema changes (`shared/schema.ts` + `server/migrations/runner.ts`)

- `opportunity_deliveries` — the new table described in §1 above (migration id `2026-07-03_opportunity_deliveries`).
- `user_preferences.muted_opportunity_types TEXT[] NOT NULL DEFAULT '{}'` — the one new preference this framework respects (migration id `2026-07-03_user_preferences_muted_opportunity_types`). Empty array means no muting — an honest default, never a fabricated preference.

Both migrations are `IF NOT EXISTS`-guarded and appended to the end of the ordered, append-only `MIGRATIONS` array, per that file's own stated convention.

### 5. Sixteen pre-existing capability-count scope-lock assertions updated (mechanical, no logic change)

Every capability-count assertion across the existing binding test suites (`live.length === 19` → `20`, `caps.length === 21` → `22`) was updated to reflect the platform's new total — the same mechanical bump every prior capability addition (INT2 through FI3) already required of every sibling test file. One assertion (`test-intelligence-shopping-binding.ts`'s "every live capability is a read-only binding" scope lock) required a substantive, not just numeric, update: `opportunity-delivery` is the platform's first capability that is genuinely NOT read-only in practice (it writes to its own new table), so it is added to that assertion's explicit id-whitelist alongside planner/shopping/etc. — a deliberate, declared exception, not a silent weakening of the check. `test-intelligence-profile-binding.ts`'s exhaustive `UserPreferences` test fixture gained the one new required field (`mutedOpportunityTypes: []`), the same kind of one-line fixture update FI4's own binding test needed for the FI3 fixture it extended.

### 6. What was deliberately NOT built (honest exclusions, matching the brief)

- **No notifications, no external/push channel of any kind.** `opportunity-delivery` is a platform-internal capability with no dedicated HTTP route, reachable only through the standard `intelligencePlatform.handle()` path — explicitly excluded by the brief.
- **No UI/route wiring.** No Planner/Shopping/Pantry/Companion surface was wired to call `report`/`review`/`approve`/`delete` yet. Named as the next milestone, same honest-exclusion pattern FI3/FI4 already recorded for their own verbs.
- **No natural-language pattern in `pattern-intent-resolver.ts`.** Reachability via a direct, typed `{capabilityId: "opportunity-delivery", verb: ...}` intent is fully built and tested; free-text Companion discovery is future work.
- **No second real opportunity producer.** `OPPORTUNITY_SOURCES` has exactly one entry (`food-intelligence`); the map is proven extensible by unit test with synthetic fixtures, not by a second real producer.
- **No per-surface delivery preferences, no daily/rate caps beyond the existing `limit` parameter.** Only `mutedOpportunityTypes` was added — the one preference hook the brief's "respect user preferences" requirement actually needs; anything richer is a future, separately scoped increment.
- **No back-fill of `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`** for the new `opportunity_deliveries` table. This is a pre-existing, separate gap (INT38/39/40's own new `companion_*` tables were never back-filled into that register either) — this task follows that existing precedent rather than silently fixing an unrelated gap under the OD1 EWO. Named explicitly here, not swept under the rug.
- **No autonomous action.** `review`/`approve`/`delete` only ever transition this framework's OWN delivery-record status; no code path here adds, edits, or removes a planner entry, shopping item, or pantry item — the new `ENRICHMENT` item states this explicitly to the user-facing plane.

---

## DEFINITION OF DONE

**What success looks like:**
- The Opportunity Delivery Framework exists (`server/intelligence/opportunity-delivery/framework.ts` + `delivery-store.ts`) and collects, dedupes, prioritises, groups, surface-selects and persists-if-new the caller's opportunities across every registered producer (today: one) ✅
- `opportunity-delivery` is registered and bound as the platform's twentieth capability, with `report`/`review`/`approve`/`delete` as its four executable verbs — no verb outside the closed 20-verb taxonomy was invented ✅
- Acknowledge (`review`), dismiss (`delete`) and accept (`approve`) are all supported, persisted, and idempotent on a second call ✅
- Duplicate delivery is prevented two ways: terminal (dismissed/accepted) opportunities are suppressed from all future reports; still-open opportunities are never inserted as a second delivery row ✅
- User preferences (`mutedOpportunityTypes`) and permissions (ownership-scoped, platform-enforced strong confirmation on every resolve verb) are both respected using existing platform mechanisms, not reimplemented ones ✅
- Zero new business-domain data ownership; every opportunity's content traces to its producer's own existing owner (Rule FI1) ✅
- 50 new automated assertions pass, covering the pure reasoning core, the full I/O orchestration against a real in-memory store, and the full Port→Handler→Binding contract for all four verbs ✅
- This implementation record exists at `docs/implementation/intelligence/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md` ✅

**What must not break:** every existing capability's registration, binding, guidance, enrichment, and conversation-gateway behaviour — including FI4's own `report` verb on `food-intelligence`. Proven by the full `npm test` chain (33 suites, including the unmodified-in-substance FI4 binding test — 40 assertions) — zero regressions.

**Manual test steps:**
1. `npm run test:intelligence-opportunity-delivery-binding` — 50 passed, 0 failed.
2. `npm run test:intelligence-food-opportunity-binding` — 40 passed, 0 failed (unchanged assertions; only its capability-count scope-lock bumped from 19→20, since it now shares the platform with `opportunity-delivery`).
3. `npm test` — full chain, 33 suites, zero regressions.
4. `npx tsc --noEmit` — no new error on any file this task touched (the pre-existing baseline of unrelated errors elsewhere in the repo — e.g. `household-discovery-handler.ts`, `shopping-discovery-port.ts`, `test-slot-filling-recovery.ts` — is present before and after this task, confirmed by inspecting each flagged file for any reference to this task's own new fields/types; none exists beyond incidental inclusion in a pre-broken fixture's printed type).
5. `intelligencePlatform.getCapability("opportunity-delivery")!.executableIntents` is exactly `["report", "review", "approve", "delete"]`; `intelligencePlatform.listCapabilities().filter(c => c.availability === "available").length === 20`.

---

## DATA IMPACT

- Reads existing data: **YES** — `user_preferences.muted_opportunity_types` (this task's own new column, via the existing `storage.getUserPreferences()` owner); `food-intelligence`'s own opportunities (via its own registered `report` verb — never a second read path into Household/Planner/Pantry/Shopping).
- Writes new data: **YES** — `opportunity_deliveries` (this task's own new table; a delivery-lifecycle record, never a copy of any producer's business data).
- Changes meaning of existing data: **NO** — `user_preferences` gains one new, independently-defaulted column; every other existing column and every other existing table's meaning is unchanged.
- Requires backfill: **NO** — both new schema changes default to an empty/absent state that is correct for every pre-existing row (`muted_opportunity_types` defaults to `'{}'`; `opportunity_deliveries` starts with zero rows for every user until their first `report` call).

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing surface consumes `opportunity-delivery` yet (no UI wiring, no NL pattern — see Scope Lock). Every opportunity that could reach a user carries the exact explanation/evidence/suggestedAction its producer already generated — this framework adds no new claim of its own about *why* something is an opportunity, only *whether/where/when* to deliver it.
- **Could this fabricate certainty?** No. An anonymous caller or a caller whose producer(s) all degrade yields an honest, empty, `resolved: false` bundle — never a fabricated opportunity. A `review`/`approve`/`delete` call against an opportunity id this user was never delivered is an honest gap (`null` → structured `CapabilityExecutionError`), never a fabricated acknowledgement.
- **Is anything guessed but shown as real?** No. Priority is the same fixed, named, deterministic tier rule FI4 already established (never re-derived, never learned) — this framework only extends its scope to a merged, cross-producer list. Surface selection is a fixed, declared lookup table; an unmapped domain honestly falls back to the Companion's own general surface rather than guessing a specific one.
- **What happens if the system is wrong?** Worst case is an honest gap (no delivery, or a resolve call correctly refused) or a shorter-than-real opportunity list where one producer's call failed silently-degraded — never a false-safe suggestion, because every opportunity's content is a direct, unmodified projection of a real producer call, and never an autonomous action, because this framework's only write path is its own delivery-status column — no code path here can add, edit, or remove a planner entry, shopping item, or pantry item.
- No architectural duplication introduced: **YES** confirmed — see Architecture Convergence Status above.
- No new source of truth created for any BUSINESS fact: **YES** confirmed — `opportunity_deliveries` is a new source of truth only for the delivery-lifecycle fact itself (a fact with no prior owner), never a second source of truth for any producer's own business data.
- No runtime behaviour altered for any existing capability: **YES** confirmed — proven by the zero-regression full test-chain re-run, including FI4's own unmodified-in-substance assertions.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-od1-opportunity-delivery-framework-20260703` → `8ae0f7e`
- Files added: `server/intelligence/opportunity-delivery/framework.ts`, `server/intelligence/opportunity-delivery/delivery-store.ts`, `server/intelligence/handlers/opportunity-delivery-read-port.ts`, `server/intelligence/handlers/opportunity-delivery-handler.ts`, `server/intelligence/bindings/opportunity-delivery.ts`, `server/tests/test-intelligence-opportunity-delivery-binding.ts`, this file.
- Files modified (additive only): `shared/schema.ts` (new table + new column + their insert-schema/type exports), `server/migrations/runner.ts` (two new appended migrations), `server/intelligence/capability-registry.ts` (`opportunity-delivery` descriptor + one `ENRICHMENT` item), `server/intelligence/intelligence-platform.ts` (one import + one bind call + one doc-comment entry), `server/intelligence/index.ts` (new export block), `package.json` (one new script + one chain entry), plus sixteen test files whose capability-count scope-lock assertions were bumped (`test-intelligence-analyser-binding.ts`, `test-intelligence-diary-binding.ts`, `test-intelligence-diary-discovery-binding.ts`, `test-intelligence-food-intelligence-binding.ts`, `test-intelligence-food-opportunity-binding.ts`, `test-intelligence-household-binding.ts`, `test-intelligence-household-discovery-binding.ts`, `test-intelligence-meal-discovery-binding.ts`, `test-intelligence-meals-binding.ts`, `test-intelligence-nutrition-discovery-binding.ts`, `test-intelligence-nutrition-knowledge-binding.ts`, `test-intelligence-pantry-binding.ts`, `test-intelligence-pantry-discovery-binding.ts`, `test-intelligence-partners-binding.ts`, `test-intelligence-planner-discovery-binding.ts`, `test-intelligence-platform.ts`, `test-intelligence-profile-binding.ts` [also gained the one new required fixture field], `test-intelligence-registry-executability.ts` [also gained the new id], `test-intelligence-shopping-discovery-binding.ts`, `test-intelligence-shopping-binding.ts` [also gained the one substantive scope-lock whitelist entry], `test-intelligence-templates-binding.ts`).
- Rollback commands: `git checkout rollback/before-od1-opportunity-delivery-framework-20260703 -- <path>` for any file above, or delete the five new source files + one new test file and revert the listed additive edits.
- Verification after rollback: `git status` shows only the pre-OD1 dirty set; `intelligencePlatform.getCapability("opportunity-delivery")` returns `undefined`; `npm test` chain returns to 33 suites.

---

## SCOPE LOCK

**Implemented scope (this task):**
- The Opportunity Delivery Framework (`server/intelligence/opportunity-delivery/framework.ts`) — producer registration/adapter map, pure surface-selection, mute-filtering, duplicate-delivery-prevention partitioning, and cross-producer prioritise+group, plus I/O orchestration fanning out to every registered producer via the platform's own `handle()` path.
- The delivery lifecycle store (`delivery-store.ts`) — the sole owner of the new `opportunity_deliveries` table, with `Database`/`InMemory` implementations mirroring `companion-action-store.ts`'s discipline.
- A new, twentieth capability (`opportunity-delivery`) with four executable verbs (`report`/`review`/`approve`/`delete`), fully registered, bound, permissioned (ownership-scoped, platform-enforced strong confirmation on resolve verbs) and enriched.
- Two additive schema changes: `opportunity_deliveries` (new table) and `user_preferences.muted_opportunity_types` (new column).
- 50 new automated test assertions (pure-core + I/O orchestration against a real in-memory store + full binding contract).
- Sixteen mechanical capability-count scope-lock bumps + one substantive scope-lock whitelist addition + one test-fixture field addition, across pre-existing test files.
- This implementation record.

**Explicitly excluded (out of scope — honest gaps, not oversights):**
- Any UI or route wiring calling `report`/`review`/`approve`/`delete` from a real Planner/Shopping/Pantry/Companion surface — named as the next milestone, not built here.
- Any natural-language pattern in `pattern-intent-resolver.ts` making this capability reachable by free-text Companion conversation.
- Any notification or external/push channel of any kind — explicitly excluded by the brief.
- Any second real opportunity producer — `OPPORTUNITY_SOURCES` has exactly one entry today; extensibility is proven by unit test, not by a second live registration.
- Any per-surface delivery preference or daily/rate cap beyond `mutedOpportunityTypes` and the existing `limit` parameter.
- Any back-fill of `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` for the new table — a pre-existing, separate gap this task does not silently fix (see "What was deliberately NOT built").
- Any change to FI4's `report` verb or its Food Opportunity Engine — both are provably unchanged (unmodified test assertions, only its own capability-count scope-lock bumped).

**Suggestions for follow-up workstreams (not implemented without approval):**
- Wire one real consumer (a Planner/Companion surface actually rendering delivered opportunities and calling `review`/`approve`/`delete`) to prove the framework end-to-end for a real surface, mirroring FI3/FI4's own named next milestone.
- Register a second Domain Intelligence producer in `OPPORTUNITY_SOURCES` once one exists, to prove the cross-producer prioritise/group logic against real (not synthetic) multi-producer data.
- Back-fill `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` with `opportunity_deliveries` (and, ideally in the same pass, the still-missing INT38/39/40 `companion_*` rows) — a governance-hygiene task, not an OD1 blocker.
- A richer opportunity-delivery preference surface (per-surface toggles, daily caps) once a concrete, approved product requirement names one.

---

## FILES CHANGED

| File | Change |
|---|---|
| `server/intelligence/opportunity-delivery/framework.ts` | **New** — the Opportunity Delivery Framework: producer registration/adapter map, pure `selectSurface`/`filterMutedTypes`/`partitionForDelivery`/`prioritiseAndGroup`, and I/O orchestration `collectOpportunities()`/`resolveOpportunity()` |
| `server/intelligence/opportunity-delivery/delivery-store.ts` | **New** — the sole owner of `opportunity_deliveries`: `IOpportunityDeliveryStore`, `DatabaseOpportunityDeliveryStore`, `InMemoryOpportunityDeliveryStore` |
| `server/intelligence/handlers/opportunity-delivery-read-port.ts` | **New** — thin delegation seam (`collectOpportunities`/`resolveOpportunity`) with dynamic-import production factory |
| `server/intelligence/handlers/opportunity-delivery-handler.ts` | **New** — `handleReport`/`handleResolve` + result types + verb switch for `report`/`review`/`approve`/`delete` |
| `server/intelligence/bindings/opportunity-delivery.ts` | **New** — binds the handler; declares `OPPORTUNITY_DELIVERY_EXECUTABLE_INTENTS` |
| `server/tests/test-intelligence-opportunity-delivery-binding.ts` | **New** — 50 assertions across 4 sections (pure core, I/O orchestration against a real in-memory store, full binding contract, canonical-singleton registration) |
| `shared/schema.ts` | New `opportunityDeliveries` table + insert schema/types; `mutedOpportunityTypes` column added to `userPreferences` + its insert-schema pick list |
| `server/migrations/runner.ts` | Two new appended migrations: create `opportunity_deliveries` (+ index), add `muted_opportunity_types` to `user_preferences` |
| `server/intelligence/capability-registry.ts` | New `opportunity-delivery` descriptor in `SEED_CAPABILITIES_BASE`; one new `ENRICHMENT` item |
| `server/intelligence/intelligence-platform.ts` | New import + `bindOpportunityDeliveryCapability(intelligencePlatform)` call + doc-comment entry |
| `server/intelligence/index.ts` | New export block for the framework/store/port/handler/binding's public API |
| `package.json` | + `test:intelligence-opportunity-delivery-binding`, added to the `test` chain |
| `server/tests/test-intelligence-registry-executability.ts` | Capability-count scope-lock `19`→`20`; new `opportunity-delivery` id added to the executable-capability-includes check |
| `server/tests/test-intelligence-platform.ts` | Capability-count scope-lock `21`→`22` |
| `server/tests/test-intelligence-food-opportunity-binding.ts` | Capability-count scope-lock `19`→`20` (FI4's own assertions otherwise unchanged) |
| `server/tests/test-intelligence-shopping-binding.ts` | "Every live capability is read-only" scope lock: `opportunity-delivery` added as a declared, substantive exception (the platform's first genuinely-write capability) |
| `server/tests/test-intelligence-profile-binding.ts` | Exhaustive `UserPreferences` test fixture gained the one new required field (`mutedOpportunityTypes: []`) |
| `server/tests/test-intelligence-{analyser,diary,diary-discovery,household,household-discovery,meal-discovery,meals,nutrition-discovery,nutrition-knowledge,pantry,pantry-discovery,partners,planner-discovery,shopping-discovery,templates}-binding.ts` | Mechanical capability-count scope-lock `19`→`20` (fifteen files, no other change) |

Full chain (`npm test`, 33 suites) passes with zero regressions. `npx tsc --noEmit` introduces no new error on any file this task touched.

---

*Rollback: `rollback/before-od1-opportunity-delivery-framework-20260703` → `8ae0f7e`.*
