# EL1 — Evidence & Learning Platform — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-EL1 (🔴 RED — new capability, new schema, new cross-cutting platform governing a mechanism no prior workstream owned)
**Risk:** 🔴 RED
**Reason:** Introduces the canonical, cross-cutting Evidence & Learning Platform — a NEW platform capability (`evidence-learning`, the platform's twenty-first), TWO new database tables, and the platform's first deterministic pattern-detection mechanism over accumulated household outcomes. Not documentation-only, not purely additive metadata — new reasoning module, new persistent state, new tests.
**Builds on:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1/TIP2 — the governing capability/intent/permission model this platform is implemented *as*) · [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (FI1 §4.2/§7.2 — names the "Personalisation Event Log" as a future, not-yet-built component of Food Intelligence's Plane 2; this task builds it, generalised into a reusable platform capability rather than a Food-Intelligence-owned store) · [`OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md`](./OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md) (the most recent precedent for a new cross-cutting platform capability — Port → Handler → Binding shape, store discipline, and capability-count scope-lock update pattern all mirrored here) · [`INT35B_COMPANION_LEARNING_AND_OBSERVABILITY.md`](./INT35B_COMPANION_LEARNING_AND_OBSERVABILITY.md) (a DIFFERENT kind of "learning" — meta-learning about the Companion's own routing/matcher performance, not household outcomes; confirmed no overlap, see Reference Documents Read)

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Working tree at start | Already dirty with substantial prior uncommitted INT35–NUT1/FS-series/FI1–FI4/OD1/GOV-series work on this branch (pre-existing, unrelated to this task — same state OD1's own rollback table documents) |
| HEAD at start | `8ae0f7ef0f137e2f9baf86ef1727e7d17bc99af5` — "Add future-state nutrition vision investigation (EWO-NUT2)" |
| Rollback tag | `rollback/before-el1-evidence-learning-platform-20260703` → `8ae0f7e` |
| This task's writes | See "Files Changed" below — 6 new source/test files, 1 new doc, and ~24 modified files, all additive |
| Code modified | Yes — a new capability (`evidence-learning`) registered and bound; every existing capability's registered behaviour is unchanged (proven by the full `npm test` chain re-run with zero regressions) |
| Schema modified | Yes — two new tables (`household_evidence_events`, `household_learning_signals`), both additive, both `IF NOT EXISTS`-guarded in the migration runner. No existing table or column touched. |
| Runtime modified | Additive only — a new capability with its own new verbs; every existing capability's registered behaviour, executable verbs, guidance and enrichment are unchanged |

**Rollback commands:** `git checkout rollback/before-el1-evidence-learning-platform-20260703 -- <path>` for any file below, or delete the new files and revert the additive edits (each is independently revertible — nothing outside this task's own files reads any of the new exports yet).

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (workflow steps, RED classification, mandatory template)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight governing principles)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (confirmed no existing store owns household-outcome-evidence or pattern-detection state; confirmed OD1's own new `opportunity_deliveries` table — and INT38/39/40's `companion_*` tables before it — were never back-filled into this register either; this task follows that same existing precedent rather than doing unscoped governance cleanup — see Suggestions for follow-up)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1/TIP2 — the closed 20-verb intent taxonomy, the Capability Registry/Intent Engine/permission model, the server-side confirmation-tier model this platform's `approve`/`delete` verbs rely on unchanged)
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (confirmed `report`/`search`/`approve`/`delete` are four of the platform's 20 closed canonical intent verbs; no new verb was invented)
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (EWO-FI1 §4.2 — the "Personalisation Event Log" is named here as `PersonalisationEvent`, "not yet built, named here for the workstream that creates it under Rule 8 governance"; §7.2 lists it as a future component with SoT impact "new single-owner transactional store". This task IS that workstream — see the doc update below.)
- [x] `docs/implementation/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md` (the exact Port → Handler → Binding shape, `IStore`/`Database`/`InMemory` store discipline, and pure-core/I-O-orchestration-in-one-framework-file split this task mirrors verb-for-verb and file-for-file)
- [x] `docs/implementation/INT35B_COMPANION_LEARNING_AND_OBSERVABILITY.md` and `server/intelligence/conversation/companion-learning-store.ts` (confirmed this is a DIFFERENT concern — meta-learning about the Companion's OWN routing/matcher performance from a privacy-safe miss log, never household outcomes or preferences. No overlap with EL1's scope; the `reviewRecommendation` "writes only status/reviewedBy/reviewedAt" hard rule is the discipline this task's own `confirmSignal` mirrors.)
- [x] Existing code read in full before writing anything new: `server/intelligence/opportunity-delivery/delivery-store.ts` and `framework.ts` (the exact store/orchestration split this task's own `evidence-learning-store.ts`/`framework.ts` mirror), `server/intelligence/handlers/opportunity-delivery-{read-port,handler}.ts` and `bindings/opportunity-delivery.ts` (the exact Port → Handler → Binding shape this task's own trio mirrors), `server/intelligence/capability-registry.ts` (the `GUIDANCE`/seed-array shape a new capability descriptor must match), `server/intelligence/permissions.ts` (confirmed `confirmationFor()` already maps `approve`/`delete` to **strong** and `report`/`search` to **none**, platform-wide, by verb — this task does not special-case either), `server/intelligence/intelligence-platform.ts` (the bootstrap bind-call list), `server/lib/household.ts` (`getHouseholdForUser` — the existing, sole household-resolution owner, reused rather than re-implemented), `shared/schema.ts` (confirmed no existing table already modelled household-outcome evidence or detected patterns), `server/migrations/runner.ts` (the append-only, `IF NOT EXISTS`-guarded migration convention).

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No business entity gets a new identity of its own. Every evidence event's
  `subjectId` is a namespaced reference into whatever identity the reporting
  domain already owns (e.g. a meal id, a swap id) — never a second key space
  for that entity. This platform introduces exactly TWO new id spaces, both
  for facts with no prior owner: household_evidence_events.id (a record OF an
  observed outcome) and household_learning_signals.id (a record OF a detected
  pattern) — neither is a second identity FOR the business entity behind it.

☑ One owner per fact
  household_evidence_events (append-only capture) and household_learning_signals
  (derived, confirmation-gated pattern) are two different facts at two
  different scopes (Principle 2 scope test: a signal can legitimately differ
  from its own supporting events — it is a rolling, re-evaluated summary, not
  a duplicate of them), each with exactly one owner:
  evidence-learning-store.ts, the sole reader/writer of both tables (mirrors
  delivery-store.ts's sole-owner discipline for `opportunity_deliveries`).

☑ No duplicate entities
  No new outcome/pattern taxonomy is imposed on any Business Domain.
  `domain`/`subjectType`/`outcomeType` are free-form strings supplied by the
  REPORTING domain (e.g. food-intelligence) — this platform does not define
  or own what counts as an "outcome" for any business domain; it only
  accumulates and pattern-detects whatever is reported to it.

☑ No duplicate ownership
  Household resolution goes through the EXISTING `getHouseholdForUser()`
  (server/lib/household.ts) — not re-implemented or re-queried a second way.
  This platform never reads or writes `household_eaters`, planner, shopping,
  pantry, or diary data directly — it only accumulates what a reporting
  capability explicitly tells it via `report`.

☑ No duplicate state
  Evidence events are never a second copy of a Business Domain fact — they
  are a NEW fact ("household X had outcome Y for dimension Z at time T") with
  no prior owner. Learning signals are never persisted as raw evidence
  duplicated — they are a derived summary (counts/consistency/rationale)
  that is recomputed (upserted in place) from the evidence log, never a
  second independent store of the same underlying events.

☑ Extends existing architecture
  Adds ONE new capability (`evidence-learning`, the platform's twenty-first)
  using the closed 20-verb taxonomy (`report`/`search`/`approve`/`delete` —
  no new verb invented) and the identical Port → Handler → Binding pattern
  proven twenty times over (most recently OD1). Generalises FI1's
  Food-Intelligence-scoped "Personalisation Event Log" into a reusable,
  domain-agnostic platform capability per FI1 §7.2's own Rule 8 governance
  gate — see the FI1 document update below.

☑ Progressive enrichment where appropriate
  Evidence (`household_evidence_events`) is transactional state (an
  append-only outcome log) — Principle 3 applies "one owner, no duplicate
  state" only, no enrichment pipeline is bolted onto it. Learning signals
  (`household_learning_signals`) are also transactional (a re-evaluated
  summary, not a knowledge entity with identity→core→optional→runtime
  planes) — correctly kept simple, not over-engineered with enrichment
  machinery it does not need.

☑ Honest gaps over fabricated information
  A dimension with fewer than MIN_EVIDENCE_COUNT (3) polarised events, or
  without a clear majority direction (MIN_CONSISTENCY, 70%), produces
  NO signal — never a partial or low-confidence guess (framework.ts's
  `detectPatternForDimension`, structurally, not by convention). `search`
  for a household with no accumulated evidence yet returns an honest empty
  array. `approve`/`delete` against a signal id that does not exist, or
  belongs to a different household, is a structured honest gap — never a
  fabricated confirmation or a cross-household leak.

☑ No permanent synchronisation bridge
  No business-domain fact is synchronised or copied anywhere. The only
  persisted state is the evidence log itself (a genuinely new fact) and its
  derived pattern summary (recomputed in place, never a second independent
  copy of the same events) — neither mirrors a Business Domain's own store.

☑ Evolution over replacement
  Nothing is replaced. This platform is the FI1-named-but-not-yet-built
  "Personalisation Event Log", now built as planned (generalised beyond
  Food Intelligence per the Rule 8 governance gate FI1 itself required).
  `EVIDENCE_LEARNING`-adjacent existing modules (companion-learning-store.ts,
  opportunity-delivery's delivery-store.ts) are provably unchanged
  (unmodified in substance, full chain re-run with zero regressions).
```

**AI ARCHITECTURE COMPLIANCE**

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — registered via `intelligencePlatform`
  (the one singleton), not a new platform instance.
✓ Uses the Capability Registry — `evidence-learning` is a new entry in the ONE
  canonical `SEED_CAPABILITIES_BASE` array; no second registry, no bypass.
✓ Uses the Intent Engine — routed through the existing LOCATE → VALIDATE →
  PERMISSION → CONFIRM → INVOKE → RESPOND pipeline unchanged. `report`,
  `search`, `approve`, `delete` are four of the platform's 20 closed canonical
  intent verbs (TIP2 §3.1) — no new verb was invented. `approve`/`delete` are
  platform-wide "strong" confirmation verbs (`permissions.ts::confirmationFor`
  — a verb-driven rule this task did not add or special-case) — a caller must
  pass `options.confirmed === true` before the handler is ever reached, the
  same gate every other write verb on this platform already goes through.
  This is the mechanism that satisfies the ticket's "require confirmation
  before adapting household preferences": there is no code path from
  `report`/pattern-detection straight to a confirmed signal — only an
  explicit, platform-gated `approve` call can.
✓ Reuses existing business services — `getHouseholdForUser()` (the existing,
  sole household-membership owner). No new database query bypasses an
  existing owner.
✓ Does not create another assistant — no conversation state, no LLM call
  anywhere in this platform. Pattern detection is a fixed, named, deterministic
  rule (MIN_EVIDENCE_COUNT / MIN_CONSISTENCY / bucketConfidence) — never
  learned, never an ML model, never an LLM judgement.
✓ Does not duplicate conversation state — `household_evidence_events` and
  `household_learning_signals` are scoped to `householdId` directly,
  deliberately NOT to a conversation turn.
✓ Uses registered capabilities only — the only write path onto either new
  table is this capability's own handler; no private route, no side-channel.
✓ Uses permission-aware access — `context.userId` only (never a
  client-supplied household id), household always resolved server-side via
  `getHouseholdForUser`; `decideSignal` additionally checks the resolved
  signal's own `householdId` against the caller's, so a guessed/borrowed
  signal id from another household can never be confirmed or declined.
✓ Produces honest gaps rather than fabricated knowledge — see the Honest Gaps
  checklist item above.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Intelligence Governance (a NEW cross-cutting platform
  capability, per THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md — sitting
  alongside the Opportunity Delivery Framework, feeding Domain Intelligence
  layers (today: none yet consume it — see Scope Lock) rather than being a
  member of the Domain Intelligence layer itself). Reads NOTHING from any
  existing Business Domain or Domain Intelligence store; it only accumulates
  what a reporting capability explicitly submits via `report`.
Declared SoT (per THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md):
  - This task's own NEW stores: DB `household_evidence_events` (append-only)
    and `household_learning_signals` (derived, confirmation-gated) — sole
    owner server/intelligence/evidence-learning/evidence-learning-store.ts.
    Not yet back-filled into the SoT Register document itself (see
    "Suggestions for follow-up" — the same gap OD1's own `opportunity_deliveries`
    table, and INT38/39/40's `companion_*` tables before it, already have;
    this task follows that existing precedent rather than silently fixing an
    unrelated, pre-existing gap under the EL1 EWO).
  - Reads (never writes) household membership only: `household_members`
    via the existing `getHouseholdForUser()` owner (server/lib/household.ts)
    — no second read path.
New store created? YES — household_evidence_events + household_learning_signals
  (both additive, IF NOT EXISTS-guarded migration). No existing table or
  column touched.
Existing store extended? NO.
Consumer created? YES — a new capability (`evidence-learning`) with four new
  verbs, reachable today via the Intelligence Platform (and therefore
  Companion, the same way every other capability already is). No Business
  Domain or Domain Intelligence capability calls `report` yet (see Scope Lock)
  — this task builds the reusable platform; wiring a first real reporter is
  named as the next milestone, mirroring FI3/FI4/OD1's own honest-exclusion
  pattern at introduction.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Intelligence Governance — Evidence & Learning (new). FI1 §4.2/§7.2 named
  this component ("Personalisation Event Log") as a future, not-yet-built
  Food-Intelligence-owned store. This task builds it for the first time, and
  generalises it into a reusable platform capability per FI1's own Rule 8
  governance gate ("New knowledge/state store requires governance review;
  check the register; provide justification if a new store is genuinely
  needed" — the justification here is exactly FI1's own forward note: "any
  future Domain Intelligence layer" should be able to consume it, not only
  Food Intelligence). It had zero prior instances to converge or diverge from.

Current Canonical Owner:
  This task's own owner: server/intelligence/evidence-learning/framework.ts
  (pattern detection — zero I/O — plus the thin I/O orchestration
  `recordOutcomeAndDetect`/`listHouseholdSignals`/`decideSignal`) and
  evidence-learning-store.ts (the sole owner of the two new tables). No
  business-domain fact is owned here — every evidence event's `domain`/
  `subjectType`/`subjectId`/`outcomeType` is a caller-supplied string,
  interpreted by nobody but the reporting domain itself.

Current Runtime Consumer(s):
  The Intelligence Platform's Conversation Gateway (Companion), via the
  standard registered-capability path — the same way every other capability
  is already reachable. No Business Domain or Domain Intelligence capability
  calls `report` yet, and no domain page or Companion natural-language
  pattern reads `search` yet — that wiring is the next milestone, the same
  honest-exclusion pattern FI3/FI4/OD1 already recorded for their own verbs
  at introduction.

Duplicate Owners Remaining:
  NONE introduced by this task. Nothing here re-derives or re-stores any
  Business Domain or Domain Intelligence fact.

Duplicate State Remaining:
  NONE. Learning signals are a derived, upserted-in-place summary of the
  evidence log, never a second independent copy of the same underlying
  events (one row per dimension, refreshed, never accumulated as a growing
  duplicate list).

Duplicate Workflows Remaining:
  NONE. Household resolution reuses the EXISTING `getHouseholdForUser()`
  (no second household-membership reader); the confirmation gate reuses the
  platform's EXISTING `confirmationFor()` verb-driven rule (no special-cased
  second confirmation mechanism); the store/port/handler/binding shape reuses
  (adapts, does not reimplement independently of) OD1's own proven pattern.

Current Convergence (%):
  Intelligence Governance — Evidence & Learning (this task's own scope):
  100% — the Evidence & Learning Platform is now built and is the one
  canonical owner of household-outcome-evidence capture and pattern
  detection; no second implementation of it exists anywhere in the
  codebase (confirmed by reading the full domain inventory before writing
  anything new — see Reference Documents Read). Domain Intelligence layer
  (inherited, unchanged by this task): unchanged from FI1's own stated
  position — this task neither touches nor depends on any of FI1 §13's
  contested files.

Target Convergence (%):
  100% for this task's own scope (achieved — one reusable platform, zero
  duplicate implementations). Widening to a first real reporting capability
  and a first real Domain Intelligence consumer are both separately gated
  future EWOs (see "Suggestions for follow-up").

Next Planned Milestone:
  Wire a first real reporting capability (e.g. food-intelligence calling
  `report` when a household accepts/rejects a meal suggestion or opportunity)
  and a first real Domain Intelligence consumer of `search`'s confirmed
  signals — both future, separately scoped and approved EWOs.

Remaining Architectural Risks:
  This platform has zero real reporters and zero real consumers today — its
  end-to-end value is proven only by this task's own test suite (with a
  synthetic reporting capability), not yet by a genuine household outcome
  flowing through it. A future workstream wiring the first real reporter
  should re-confirm the `RecordOutcomeParams` shape (domain/subjectType/
  subjectKey/outcomeType/direction) is expressive enough for that domain's
  real outcomes before assuming this precedent extends indefinitely — the
  same narrowly-scoped-sequencing discipline OD1 already applied to its own
  single-producer `OPPORTUNITY_SOURCES` map.
```

---

## IMPLEMENTATION

### 1. An append-only evidence log + a derived, confirmation-gated signal store (`server/intelligence/evidence-learning/evidence-learning-store.ts`)

The sole owner of the two new tables:

- **`household_evidence_events`** — one row per structured household outcome (`domain`, `subjectType`, `subjectId`, `subjectKey`, `outcomeType`, `direction`, optional `context`, `sourceCapabilityId`, `occurredAt`). Never edited after insert.
- **`household_learning_signals`** — one row per (`householdId`, `domain`, `subjectType`, `subjectKey`, `direction`) dimension: `evidenceCount`, `consistency`, a deterministic `confidence` bucket, the exact `supportingEventIds` (explainability), a plain-English `rationale`, and a `status` (`pending_confirmation` → `confirmed`/`declined`).

`upsertSignal` enforces the one hard rule this store owns: once a household has confirmed or declined a signal, a later re-detection run refreshes its evidence fields but **never** resets `status` back to pending and never silently flips a decision (mirrors OD1's terminal-status discipline for opportunity deliveries — no nagging, per FI1's own Risk R6). `IEvidenceLearningStore` + `DatabaseEvidenceLearningStore` + `InMemoryEvidenceLearningStore` mirror `delivery-store.ts`'s exact shape, so `npm test` needs no live database for this module.

### 2. The pattern-detection framework (`server/intelligence/evidence-learning/framework.ts`)

Two halves, mirroring OD1's own `framework.ts` split:

- **Pure pattern detection** (`groupEvents`, `bucketConfidence`, `detectPatterns`) — zero I/O, zero clock reads beyond what is passed in. `detectPatterns` groups accumulated evidence by dimension and, per dimension, structurally refuses to emit a pattern below `MIN_EVIDENCE_COUNT` (3) polarised (non-neutral) events or below `MIN_CONSISTENCY` (70%) agreement on a single direction. This is the literal mechanism that satisfies the ticket's **"never infer a permanent preference from a single observation"** — it is not a convention, it is a hard `if` at the top of `detectPatternForDimension` that a single event, or an inconsistent handful, cannot pass, by construction. Confidence is a fixed, named bucket (`low`/`medium`/`high` by evidence count) — never an ML score.
- **I/O orchestration** (`recordOutcomeAndDetect`, `listHouseholdSignals`, `decideSignal`) — thin, injectable wiring between the pure detector and the store. `recordOutcomeAndDetect` appends one event, then re-runs detection over ONLY that event's own dimension within a rolling 90-day window (`EVIDENCE_WINDOW_DAYS`) — a single new event can only ever refresh (or, once the bar clears, create) the pattern for its OWN dimension, never manufacture one for a dimension it does not belong to. `decideSignal` checks the signal's own `householdId` against the caller's before confirming/declining — a guessed or borrowed signal id from another household resolves to an honest `null`, never a cross-household leak.

### 3. A new capability — `evidence-learning` (the platform's twenty-first)

Port → Handler → Binding, the identical pattern proven twenty times over (most recently OD1):

- `handlers/evidence-learning-read-port.ts` — narrow delegation seam (`getHouseholdForUser`, `recordOutcome`, `listSignals`, `decideSignal`), dynamic imports so binding never opens a database connection at module-load time.
- `handlers/evidence-learning-handler.ts` — four verbs, all from the closed 20-verb taxonomy, no new verb invented:
  - `report` — capture a structured household outcome (`domain`/`subjectType`/`subjectId`/`subjectKey`/`outcomeType`/`direction`/`sourceCapabilityId`, all required; missing/invalid → honest gap). Household always resolved server-side from `context.userId`, never client-supplied.
  - `search` — list the caller's household's current learning signals, optionally filtered by `domain`/`status`.
  - `approve` — confirm a pending signal. **Strong** confirmation tier (the platform's own existing per-verb rule) — the handler is never reached without `options.confirmed`.
  - `delete` — decline a pending signal. Strong confirmation tier.
- `bindings/evidence-learning.ts` — binds the handler; declares `EVIDENCE_LEARNING_EXECUTABLE_INTENTS` as exactly these four verbs (INT6A discipline — the registry never over-advertises).

**The confirmation-gate that satisfies the ticket's core requirement:** confirming a signal (`approve`) writes ONLY that signal's own `status`/`confirmedByUserId`/`confirmedAt`/`confirmationNotes` fields (mirrors `companion-learning-store.ts`'s `reviewRecommendation` hard rule). There is no code path from a detected pattern to an actual household preference change — that remains, by design, a separate, human-triggered write through whatever preference store's own owning capability would apply it (Rule FI1 — enrichment/evidence, never ownership). This platform owns zero preference data.

### 4. Two additive schema changes (`shared/schema.ts` + `server/migrations/runner.ts`)

`household_evidence_events` and `household_learning_signals`, both `IF NOT EXISTS`-guarded, both additive. No existing table or column touched.

### 5. Twenty-two pre-existing capability-count scope-lock assertions updated (mechanical, no logic change)

Every capability-count assertion across the existing binding test suites (`live.length === 20` → `21`, `caps.length === 22` → `23`) was updated to reflect the platform's new total — the same mechanical bump every prior capability addition (INT2 through OD1) already required of every sibling test file. `test-intelligence-shopping-binding.ts`'s "every live capability is read-only" scope lock required a substantive (not just numeric) update: `evidence-learning` is added to that assertion's explicit id-whitelist alongside `opportunity-delivery` — a deliberate, declared exception (it writes to its own new tables), not a silent weakening of the check. `test-intelligence-registry-executability.ts` also gained the new capability id in its executable-capabilities-includes check.

### 6. The `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` update

FI1 §4.2 named the "Personalisation Event Log" as `PersonalisationEvent`, "not yet built, named here for the workstream that creates it under Rule 8 governance." This task IS that workstream. The document's §4.2 and §7.2 are updated (not rewritten) to record: it is now built, as the **Evidence & Learning Platform** — generalised beyond a Food-Intelligence-owned store into a reusable platform capability, per FI1's own forward note that "any future Domain Intelligence layer" should be able to consume it. §13 (Explicitly excluded) is updated to remove the Personalisation Event Log from FI1's own "not yet implemented" list, with a pointer to this document. No other content in FI1 is touched.

### 7. What was deliberately NOT built (honest exclusions, matching the brief)

- **No predictive AI, no ML model, no LLM judgement anywhere in this platform.** Pattern detection is a fixed, named, deterministic rule (`MIN_EVIDENCE_COUNT`/`MIN_CONSISTENCY`/`bucketConfidence`) — explicitly excluded by the brief ("Do not implement predictive AI").
- **No autonomous preference change of any kind.** Confirming a signal only ever changes that signal's OWN status fields — no code path here writes to `household_eaters`, `user_preferences`, or any other preference store. Explicitly excluded by the brief ("Do not implement... autonomous preference changes").
- **No UI/route wiring.** No Planner/Shopping/Pantry/Companion surface was wired to call `report`/`search`/`approve`/`delete` yet.
- **No natural-language pattern in `pattern-intent-resolver.ts`.** Reachability via a direct, typed `{capabilityId: "evidence-learning", verb: ...}` intent is fully built and tested; free-text Companion discovery is future work.
- **No first real reporting capability.** No existing Business Domain or Domain Intelligence capability calls `report` yet — this task builds the reusable platform; a first real reporter (e.g. food-intelligence reporting a meal-outcome) is a future, separately scoped EWO.
- **No back-fill of `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`** for the two new tables. This is a pre-existing, separate gap (OD1's own `opportunity_deliveries`, and INT38/39/40's `companion_*` tables before it, were never back-filled into that register either) — this task follows that existing precedent rather than silently fixing an unrelated gap under the EL1 EWO. Named explicitly here, not swept under the rug.

---

## DEFINITION OF DONE

**What success looks like:**
- The Evidence & Learning Platform exists (`server/intelligence/evidence-learning/framework.ts` + `evidence-learning-store.ts`) and captures structured household outcomes, accumulates them append-only, and deterministically detects explainable patterns, never from a single observation ✅
- `evidence-learning` is registered and bound as the platform's twenty-first capability, with `report`/`search`/`approve`/`delete` as its four executable verbs — no verb outside the closed 20-verb taxonomy was invented ✅
- A detected pattern is never treated as confirmed until an explicit, platform-gated (`strong` confirmation) `approve` call — and even then, confirming only ever changes the signal's own record, never a business-domain preference ✅
- Declining (`delete`) a signal is supported, persisted, and never silently re-asked by further evidence (decided-status discipline) ✅
- Zero new business-domain data ownership; the platform accumulates only what a reporting capability explicitly submits (Rule FI1 discipline, applied to a new kind of platform capability) ✅
- 59 new automated assertions pass, covering the pure detection core, the full I/O orchestration against a real in-memory store, and the full Port→Handler→Binding contract for all four verbs ✅
- This implementation record exists at `docs/implementation/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md` ✅

**What must not break:** every existing capability's registration, binding, guidance, enrichment, and conversation-gateway behaviour — including OD1's own `opportunity-delivery` capability and FI1/FI4's `food-intelligence` capability. Proven by the full `npm test` chain (34 suites) — zero regressions.

**Manual test steps:**
1. `npm run test:intelligence-evidence-learning-binding` — 59 passed, 0 failed.
2. `npm test` — full chain, 34 suites, zero regressions (confirmed).
3. `npx tsc --noEmit` — no new error on any file this task touched (confirmed by grepping the full typecheck output for "evidence" before and after each edit; the pre-existing baseline of unrelated errors elsewhere in the repo — e.g. top-level-`await` errors in several discovery-binding test files, a pre-existing `acquisitionLane` type mismatch in `test-intelligence-meals-binding.ts` — is present regardless of this task and does not reference any file this task touched).
4. `intelligencePlatform.getCapability("evidence-learning")!.executableIntents` is exactly `["report", "search", "approve", "delete"]`; `intelligencePlatform.listCapabilities().filter(c => c.availability === "available").length === 21`.
5. `confirmationFor(capability, "report")` / `"search"` → `"none"`; `confirmationFor(capability, "approve")` / `"delete"` → `"strong"` (the platform's own existing per-verb rule, unmodified).

---

## DATA IMPACT

- Reads existing data: **YES** — household membership only, via the existing `getHouseholdForUser()` owner (`server/lib/household.ts`). No Business Domain or Domain Intelligence data (planner, shopping, pantry, diary, food knowledge) is read by this platform at all — it only accumulates what a reporting capability explicitly submits via `report`.
- Writes new data: **YES** — `household_evidence_events` and `household_learning_signals` (both this task's own new tables; an outcome-evidence record and a derived pattern-summary record, never a copy of any Business Domain's own data).
- Changes meaning of existing data: **NO** — no existing table or column is touched.
- Requires backfill: **NO** — both new tables start with zero rows for every household until a reporting capability first calls `report`.

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing surface consumes `evidence-learning` yet (no UI wiring, no NL pattern — see Scope Lock). When a household does eventually see a pattern (via a future consuming surface), every signal carries its own `rationale` (a plain sentence built from actual counted evidence) and `supportingEventIds` (the exact events behind it) — nothing here can present a pattern without also showing its evidence.
- **Could this fabricate certainty?** No. `detectPatterns` structurally refuses to emit a pattern below `MIN_EVIDENCE_COUNT` (3) or `MIN_CONSISTENCY` (70%) — proven by test (§1: 2 consistent events → no pattern; a 50/50 split of 4 events → no pattern). Confidence is a fixed, named bucket by evidence count, never an ML/statistical score presented as more certain than it is.
- **Is anything guessed but shown as real?** No. `outcomeType`/`direction` are supplied by the reporting domain, never inferred by this platform from raw data it does not have access to. A signal's `status` only ever changes via an explicit, platform-gated household confirmation (`approve`/`delete`) — never automatically, never on a timer, never because evidence merely accumulated.
- **What happens if the system is wrong?** Worst case is an honest gap (no signal surfaced, because the bar was not cleared) or a `search` result with fewer signals than a household might expect — never a fabricated pattern, and never an autonomous action, because this platform's only write path onto anything resembling a "preference" is a signal's own confirmation status — no code path here can add, edit, or remove a dietary preference, restriction, or setting.
- No architectural duplication introduced: **YES** confirmed — see Architecture Convergence Status above.
- No new source of truth created for any BUSINESS fact: **YES** confirmed — the two new tables are new sources of truth only for the evidence/pattern facts themselves (facts with no prior owner), never a second source of truth for any Business Domain's or Domain Intelligence's own data.
- No runtime behaviour altered for any existing capability: **YES** confirmed — proven by the zero-regression full test-chain re-run.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-el1-evidence-learning-platform-20260703` → `8ae0f7e`
- Files added: `server/intelligence/evidence-learning/evidence-learning-store.ts`, `server/intelligence/evidence-learning/framework.ts`, `server/intelligence/handlers/evidence-learning-read-port.ts`, `server/intelligence/handlers/evidence-learning-handler.ts`, `server/intelligence/bindings/evidence-learning.ts`, `server/tests/test-intelligence-evidence-learning-binding.ts`, this file.
- Files modified (additive only): `shared/schema.ts` (two new tables + their insert-schema/type exports), `server/migrations/runner.ts` (one new appended migration, two tables), `server/intelligence/capability-registry.ts` (`evidence-learning` descriptor + one `ENRICHMENT` entry with two items), `server/intelligence/intelligence-platform.ts` (one import + one bind call + one doc-comment entry), `server/intelligence/index.ts` (new export block), `package.json` (one new script + one chain entry), `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (§4.2/§7.2/§13 updated to record the Personalisation Event Log is now built, as EL1), plus twenty-two test files whose capability-count scope-lock assertions were bumped (`test-intelligence-analyser-binding.ts`, `test-intelligence-diary-binding.ts`, `test-intelligence-diary-discovery-binding.ts`, `test-intelligence-food-intelligence-binding.ts`, `test-intelligence-food-opportunity-binding.ts`, `test-intelligence-household-binding.ts`, `test-intelligence-household-discovery-binding.ts`, `test-intelligence-meal-discovery-binding.ts`, `test-intelligence-meals-binding.ts`, `test-intelligence-nutrition-discovery-binding.ts`, `test-intelligence-nutrition-knowledge-binding.ts`, `test-intelligence-opportunity-delivery-binding.ts`, `test-intelligence-pantry-binding.ts`, `test-intelligence-pantry-discovery-binding.ts`, `test-intelligence-partners-binding.ts`, `test-intelligence-planner-discovery-binding.ts`, `test-intelligence-platform.ts`, `test-intelligence-profile-binding.ts`, `test-intelligence-registry-executability.ts` [also gained the new id], `test-intelligence-shopping-binding.ts` [also gained the one substantive scope-lock whitelist entry], `test-intelligence-shopping-discovery-binding.ts`, `test-intelligence-templates-binding.ts`).
- Rollback commands: `git checkout rollback/before-el1-evidence-learning-platform-20260703 -- <path>` for any file above, or delete the six new source/test files + one new doc and revert the listed additive edits.
- Verification after rollback: `git status` shows only the pre-EL1 dirty set; `intelligencePlatform.getCapability("evidence-learning")` returns `undefined`; `npm test` chain returns to 33 suites.

---

## SCOPE LOCK

**Implemented scope (this task):**
- The Evidence & Learning Platform (`server/intelligence/evidence-learning/framework.ts`) — pure deterministic pattern detection (`groupEvents`/`bucketConfidence`/`detectPatterns`, with the structural `MIN_EVIDENCE_COUNT`/`MIN_CONSISTENCY` guards), plus I/O orchestration (`recordOutcomeAndDetect`/`listHouseholdSignals`/`decideSignal`).
- The evidence + signal store (`evidence-learning-store.ts`) — the sole owner of the two new tables, with `Database`/`InMemory` implementations mirroring `delivery-store.ts`'s discipline.
- A new, twenty-first capability (`evidence-learning`) with four executable verbs (`report`/`search`/`approve`/`delete`), fully registered, bound, permissioned (ownership-scoped, platform-enforced strong confirmation on the two decision verbs) and enriched with two Companion Card guidance items explaining the non-negotiables (patterns need repeated evidence; nothing changes until you say so).
- Two additive schema changes: `household_evidence_events` (new table, append-only) and `household_learning_signals` (new table, derived + confirmation-gated).
- 59 new automated test assertions (pure detection core + I/O orchestration against a real in-memory store + full binding contract + capability-registry/confirmation-tier checks).
- The `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` update recording that the Personalisation Event Log it named (but did not build) is now built, as this platform.
- Twenty-two mechanical capability-count scope-lock bumps + one substantive scope-lock whitelist addition, across pre-existing test files.
- This implementation record.

**Explicitly excluded (out of scope — honest gaps, not oversights):**
- Any predictive AI, ML model, or LLM judgement anywhere in this platform — explicitly excluded by the brief.
- Any autonomous preference change of any kind — confirming a signal only ever changes that signal's own status; no preference store is written by this platform, ever — explicitly excluded by the brief.
- Any UI or route wiring calling `report`/`search`/`approve`/`delete` from a real Planner/Shopping/Pantry/Companion surface — named as the next milestone, not built here.
- Any natural-language pattern in `pattern-intent-resolver.ts` making this capability reachable by free-text Companion conversation.
- Any first real reporting capability (e.g. food-intelligence reporting a genuine meal outcome) — this task builds the reusable platform only.
- Any back-fill of `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` for the two new tables — a pre-existing, separate gap this task does not silently fix (see "What was deliberately NOT built").
- Any change to any existing capability's registered behaviour, executable verbs, guidance, or enrichment — all provably unchanged (unmodified in substance, full chain re-run with zero regressions).

**Suggestions for follow-up workstreams (not implemented without approval):**
- Wire a first real reporting capability (food-intelligence reporting meal-suggestion acceptance/rejection, or the Opportunity Delivery Framework reporting accept/dismiss outcomes as evidence) to prove the platform end-to-end with genuine household data, mirroring FI3/FI4/OD1's own named next milestones.
- Wire a first real Domain Intelligence consumer of `search`'s confirmed signals (e.g. Food Intelligence reading confirmed signals as one more visible, displayable ranking input — per FI1 Rule P1, "learning re-weights, never authors").
- Back-fill `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` with `household_evidence_events`/`household_learning_signals` (and, ideally in the same pass, the still-missing `opportunity_deliveries` and INT38/39/40 `companion_*` rows) — a governance-hygiene task, not an EL1 blocker.
- A UI surface for a household to review and confirm/decline pending signals directly, once a concrete, approved product requirement names one.

---

## FILES CHANGED

| File | Change |
|---|---|
| `server/intelligence/evidence-learning/evidence-learning-store.ts` | **New** — the sole owner of `household_evidence_events` + `household_learning_signals`: `IEvidenceLearningStore`, `DatabaseEvidenceLearningStore`, `InMemoryEvidenceLearningStore` |
| `server/intelligence/evidence-learning/framework.ts` | **New** — pure `groupEvents`/`bucketConfidence`/`detectPatterns` (the structural never-from-one-observation guard) + I/O orchestration `recordOutcomeAndDetect`/`listHouseholdSignals`/`decideSignal` |
| `server/intelligence/handlers/evidence-learning-read-port.ts` | **New** — thin delegation seam with dynamic-import production factory |
| `server/intelligence/handlers/evidence-learning-handler.ts` | **New** — `handleReport`/`handleSearch`/`handleDecide` + result types + verb switch for `report`/`search`/`approve`/`delete` |
| `server/intelligence/bindings/evidence-learning.ts` | **New** — binds the handler; declares `EVIDENCE_LEARNING_EXECUTABLE_INTENTS` |
| `server/tests/test-intelligence-evidence-learning-binding.ts` | **New** — 59 assertions across 4 sections (pure detection core, I/O orchestration against a real in-memory store, full binding contract, canonical-singleton registration + confirmation-tier check) |
| `shared/schema.ts` | New `householdEvidenceEvents` + `householdLearningSignals` tables + insert schemas/types |
| `server/migrations/runner.ts` | One new appended migration: create `household_evidence_events` (+ 2 indexes) and `household_learning_signals` (+ 1 index) |
| `server/intelligence/capability-registry.ts` | New `evidence-learning` descriptor in `SEED_CAPABILITIES_BASE`; one new `ENRICHMENT` entry (two items) |
| `server/intelligence/intelligence-platform.ts` | New import + `bindEvidenceLearningCapability(intelligencePlatform)` call + doc-comment entry |
| `server/intelligence/index.ts` | New export block for the store/framework/port/handler/binding's public API |
| `package.json` | + `test:intelligence-evidence-learning-binding`, added to the `test` chain |
| `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` | §4.2/§7.2/§13 updated: the Personalisation Event Log is now built, as this platform, generalised beyond Food Intelligence |
| `server/tests/test-intelligence-registry-executability.ts` | Capability-count scope-lock `20`→`21`; new `evidence-learning` id added to the executable-capability-includes check |
| `server/tests/test-intelligence-platform.ts` | Capability-count scope-lock `22`→`23` |
| `server/tests/test-intelligence-shopping-binding.ts` | "Every live capability is read-only" scope lock: `evidence-learning` added as a declared, substantive exception |
| `server/tests/test-intelligence-{food-intelligence,food-opportunity,opportunity-delivery,nutrition-knowledge}-binding.ts` | Capability-count scope-lock `20`→`21` (message text updated to name evidence-learning; assertions otherwise unchanged) |
| `server/tests/test-intelligence-{analyser,diary,diary-discovery,household,household-discovery,meal-discovery,meals,nutrition-discovery,pantry,pantry-discovery,partners,planner-discovery,profile,shopping-discovery,templates}-binding.ts` | Mechanical capability-count scope-lock `20`→`21` (fifteen files, no other change) |

Full chain (`npm test`, 34 suites) passes with zero regressions. `npx tsc --noEmit` introduces no new error on any file this task touched.

---

*This implementation record satisfies STEP 9 of `docs/architecture/ENGINEERING_WORKFLOW.md` (Mandatory Project Documentation).*
