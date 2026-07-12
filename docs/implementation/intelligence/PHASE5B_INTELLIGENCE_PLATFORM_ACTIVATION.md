# PHASE5B — Intelligence Platform Activation

**Status:** Implementation record
**Date:** 2026-07-12
**Workstream:** PHASE5B
**Predecessor:** PHASE5A — Knowledge Platform Activation (`236660e6`)
**Governing architecture:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1), `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1), `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (BEH1), `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17), `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback tag** | **`rollback/pre-PHASE5B`** |
| Tag points to | `236660e6` (PHASE5A — Knowledge Platform Activation) |
| Action on rollback | `git reset --hard rollback/pre-PHASE5B` |
| Schema modified | **None** |
| New engines created | **None** |

---

## 1. THE ARCHITECTURE GATE — A CONFLICT WAS FOUND AND STOPPED ON

The workstream as briefed asked that *every recommendation flow through*:

```
Observation → Behaviour → Decision → Insight → Recommendation
```

This was **halted at the Architecture Bootstrap gate** (`docs/architecture/README.md` STEP 2: *"If a proposed change conflicts with the governing architecture: STOP, explain why, and do not continue until approved"*). Three of the four edges are forbidden by governing documents, and the conflict was escalated and resolved before any code was written.

The canonical pipeline already exists, and it is a different one — DEC1 §2:

```
EVIDENCE → ATTENTION → DECISION → ACTION ──┐
    ▲                                       │
    └───────── (terminal resolution) ───────┘
```

| Briefed edge | Governing rule it breaks | Verdict |
|---|---|---|
| Observation **feeds** Behaviour | OBS1 §7: *"Any behaviour that reads an observation — routing, permissions, confirmation tiers, phrasing, notices, learning — **stop**. Telemetry is operator evidence only; `OBS_DISABLE_CAPTURE=1` must always be a no-op functionally."* | ❌ Forbidden |
| Behaviour **feeds** Decision | BEH1: the Behaviour Engine is the owner of **voice** — *"the last transform before rendering"*, which *"may never change what is true, what is permitted, or what is **selected**"*. It is downstream of Decision, not upstream. | ❌ Inverted |
| Every recommendation **flows through** Decision | DEC1 §8 (*explicitly rejected — do not build*): *"A central `DecisionEngine.decide()` that domain engines call to rank their own candidates — **absorbs Selection**."* DEC1 §2: *"Selection is deliberately not a pipeline stage."* | ❌ Forbidden |
| **Insight Engine** / **Recommendation Engine** as new engines | No such governing document and no such module exists. "Insight" is an `EnrichmentKind` in the Capability Enrichment Registry; "recommendation" is domain-owned Selection. Building them would also violate the brief's own *"do not create new engines"*. | ❌ Would create new engines |

**Resolution (approved):** implement the **canonical loop** instead. PHASE5B therefore activates `Evidence → Attention → Decision → Action → Evidence`, leaves Observation as pure telemetry, and leaves Behaviour as the voice seam. **No new engine was created. No governing document was amended.**

---

## 2. WHAT WAS ACTUALLY BROKEN

An audit of the full Intelligence Platform (22 bound capabilities) found the engines almost entirely present and wired — and **the loop open at exactly one point**.

| Engine | State before PHASE5B |
|---|---|
| Observation Engine (`observation/`) | ✅ Wired — capture + 12 admin read routes |
| Behaviour Engine (`conversation/behaviour-engine.ts`) | ✅ Wired — sealed `BehaviourDecision`, live at the voice seam |
| Decision Engine (`opportunity-delivery/framework.ts`, DEC1) | ⚠️ **`report` reachable; `review`/`approve`/`delete` had NO HTTP route** |
| Context Composition Engine (`context/`, INT17) | ✅ Wired |
| Household Learning (`evidence-learning/`, EL1/LEARN1) | ⚠️ **Read path live; write path unreachable** |
| Benchmark (`server/tests/benchmark/`) | ✅ Wired — 5 admin routes + CLI |

### The open edge

DEC1 §2 defines the loop's closing edge:

> **ACTION** — *"terminal resolution emits Evidence (`resolveOpportunity`) → feeds the next cycle's EVIDENCE. The loop is closed, once, here."*

`resolveOpportunity` was **fully implemented, fully bound, and completely unreachable**. The `opportunity-delivery` capability declares four executable verbs (`report`, `review`, `approve`, `delete`); only `report` had an HTTP route (via `GET /api/intelligence/companion/notices`). The consequence was precise and total:

- Opportunities were **delivered** to Home, and a household could **never resolve one**.
- Because only a terminal resolution emits Evidence, **zero Evidence events could ever be recorded**.
- Because Patterns require `MIN_EVIDENCE_COUNT` accumulated events, **no Pattern could ever be detected**.
- Because Confirmed Understanding requires a confirmed Pattern, **`readConfirmedUnderstanding` always returned empty**.
- Therefore LEARN1's re-weighting in `prioritiseAndGroup` was **structurally inert**, and COACH1's `withLearningEvidence` could never attach an evidence entry.

**The platform's entire household-learning capability was dead code behind a missing route.** Everything downstream of it was correct and waiting.

### Two dead client islands

Both were complete — panel → hook → *a route that had never been written*:

| Surface | Hook | Called route | Existed? |
|---|---|---|---|
| `FoodOpportunitiesPanel.tsx` | `use-food-opportunities.ts` | `GET /api/intelligence/food-opportunities`, `POST .../:id/:action` | ❌ No |
| `LearningSignalsPanel.tsx` | `use-learning-signals.ts` | `GET /api/intelligence/learning-signals`, `POST .../:id/:decision` | ❌ No |

---

## 3. WHAT PHASE5B CHANGED

**Four HTTP routes. Zero new engines, zero new reasoning, zero schema change.**

Every route is a thin, ownership-scoped projection over `intelligencePlatform.handle()` — the ordinary registered Intent Engine path. No route imports the Decision Engine's framework or its store directly, so the delivery lifecycle, `mutedOpportunityTypes`, LEARN1's re-weighting and COACH1's ordering all continue to apply exactly once, where they live.

| Route | Capability × verb | Closes |
|---|---|---|
| `GET /api/intelligence/food-opportunities` | `opportunity-delivery` × `report` | DECISION (read) |
| `POST /api/intelligence/food-opportunities/:opportunityId/:action` | `opportunity-delivery` × `review` \| `approve` \| `delete` | **ACTION → EVIDENCE (the closing edge)** |
| `GET /api/intelligence/learning-signals` | `evidence-learning` × `search` | Pattern read |
| `POST /api/intelligence/learning-signals/:signalId/:decision` | `evidence-learning` × `approve` \| `delete` | Pattern → **Confirmed Understanding** |

### Confirmation (DEC1 A7)

`review`, `approve` and `delete` all carry the `strong` ConfirmationTier (`permissions.ts:127-134`). The routes pass `{ confirmed: true }` to `handle()` — which is exactly the documented contract of `RouteOptions.confirmed`: *"the caller asserts confirmation, the engine decides whether confirmation was required."* An explicit, per-item `POST` from a deliberate household action **is** that assent. Surfacing never softened acting: the tier is unchanged, and the engine still decides.

### Permission-aware projection

The learning-signals route projects the raw `HouseholdLearningSignal` row down to the nine fields the client contract declares. `householdId`, `supportingEventIds`, `confirmedByUserId` and `confirmationNotes` are **never** sent to the client — the internal explainability trail stays server-side.

### Honest gaps preserved

Every non-`ok` outcome is surfaced as the platform's own honest message with `resolved: false`. No route fabricates a success, and none invents an acknowledgement, dismissal or acceptance (TIP1 Principle 6 / Risk R2).

---

## 4. ARCHITECTURE COMPLIANCE

| Principle | Compliance |
|---|---|
| 1 — One canonical identity per entity | No new entity. Routes are a transport over existing capabilities. |
| 2 — One owner per fact | No fact re-owned. `opportunity_deliveries` stays sole-owned by `delivery-store.ts`; `household_learning_signals` by the EL1 store. |
| 3 — Progressive enrichment | Each producer/read degrades independently; an honest empty bundle is a correct answer. |
| 4 — Runtime consumes one assembled model | Every route calls `intelligencePlatform.handle()`. None re-resolves identity or reads a store directly. |
| 5 — Reference vocabularies beside the spine | Unchanged. |
| 6 — No fabricated knowledge | Every non-`ok` outcome surfaces the platform's honest message. No fabricated success. |
| 7 — No permanent synchronisation bridge | No new store, no projection, no cache. |
| 8 — Evolution over replacement | **Four routes over code that already existed.** No engine created, none replaced. |

### AI Architecture Compliance

| Check | Result |
|---|---|
| Uses the canonical Intelligence Platform | ✅ `intelligencePlatform.handle()` only |
| Uses the Capability Registry | ✅ Both capabilities already registered and bound |
| Uses the Intent Engine | ✅ Full LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND |
| Reuses existing business services | ✅ Decision Engine framework + EL1 framework, unchanged |
| Creates no second assistant | ✅ No conversational surface added |
| Duplicates no conversation state | ✅ No conversation state touched |
| Registered capabilities only, permission-aware | ✅ Ownership-scoped; `context.userId` only, never client-supplied |
| Honest gaps, not fabricated knowledge | ✅ |

### DEC1 hard-boundary check (§3 D5)

| Boundary | Respected? |
|---|---|
| Never absorbs **Selection** | ✅ No route ranks a meal, compares a product or picks a swap. Domain scorers untouched. |
| Never gates or launders **Evidence** | ✅ |
| Never re-derives **Attention** | ✅ Producer-assigned priority passes through verbatim. |
| Never changes what may be **Acted** on | ✅ ConfirmationTier unchanged; the engine still decides. |
| Never **voices** | ✅ Behaviour Engine untouched. |
| Never routes **intent** | ✅ |

### OBS1 §7 check

Observation remains **write-only telemetry**. No route added by PHASE5B reads an observation. `OBS_DISABLE_CAPTURE=1` remains a functional no-op.

---

## 5. ENGINE INTEGRATION SUMMARY

The canonical loop, now closed end to end:

```
EVIDENCE      household_evidence_events (EL1)
              ▲                                    │
              │                                    ▼
              │                              ATTENTION
              │                   producer-assigned, never re-derived (A1)
              │                                    │
              │                                    ▼
              │                              DECISION  ← THE DECISION ENGINE (OD1/DEC1)
              │                   eligibility · muting · lifecycle suppression ·
              │                   learning re-weight · rank · budget · surface ·
              │                   sealed DeliveryDecision
              │                                    │
              │                                    ▼
              │                               ACTION
              └──── resolveOpportunity ◄──── review / approve / delete
                    (terminal → Evidence)    ** PHASE5B closed this edge **

  side-channel ─► OBSERVATION (telemetry — written, read back by NOTHING)
  render seam  ─► BEHAVIOUR   (voice — the last transform before the user reads)
```

- **Observation Engine** — unchanged. Telemetry only. Each `report` still seals and records one `delivery-decision` observation at the capability handler choke point.
- **Decision Engine** — `report` was already live; **`review`/`approve`/`delete` are now reachable**, so the Decision→Evidence feedback edge exists in production for the first time.
- **Household Learning** — the write path (`resolveOpportunity` → `recordHouseholdObservation`) and the confirmation path (Pattern → Confirmed Understanding) are both now reachable. LEARN1's re-weighting can, for the first time, receive an input.
- **Behaviour Engine** — unchanged, still the voice seam.
- **Context Composition Engine** — unchanged.
- **Benchmark** — unchanged.

---

## 6. FILES CHANGED

| File | Change |
|---|---|
| `server/routes.ts` | **+4 routes** — the Decision Engine's ACTION stage and the Household Learning confirmation door |
| `docs/implementation/intelligence/PHASE5B_INTELLIGENCE_PLATFORM_ACTIVATION.md` | This record (new) |

No schema change. No engine created. No file deleted.

---

## 7. REMAINING GAPS BEFORE PHASE 5C

Ordered by consequence. Items 1 and 2 are the ones that keep PHASE5B from being *observable* to a household.

### 1. No client affordance can resolve an opportunity (deliberate — scope lock)

The loop is closed **at the platform layer**: the routes exist, execute, and emit Evidence. But no mounted client surface calls them. `FoodOpportunitiesPanel` and `LearningSignalsPanel` are complete and now functional, and **neither is mounted on any page**.

They were left unmounted deliberately. Mounting them is a **user-facing Experience change** that would require the UX Governance Checklist (`THA_EXPERIENCE_ARCHITECTURE.md` §18), the UI Governance Checklist (`THA_UI_ARCHITECTURE.md` §18) and a Product Registry update — and an ambient opportunity panel brushes PHASE5B's scope lock (*no proactive guidance*). **This is the first thing Phase 5C should do**; the panels' own headers already name their intended homes (`LearningSignalsPanel` → the Household section of Profile).

Until then, Household Learning remains inert **in practice**, though no longer **by construction**.

### 2. The Decision Engine has exactly one producer

`OPPORTUNITY_SOURCES` (`framework.ts:246-248`) contains only `food-intelligence`. DEC1 §7 names this map as *"the door for every future ambient surface"* — and nothing else has walked through it. Planner, Pantry and Shopping all have `DOMAIN_SURFACE` entries mapped and waiting, with no producer behind them.

Enrolment is a one-line addition per producer, but each needs a `report` verb returning **attention-assigned, evidence-cited** opportunities (Rule E1 + A1). No candidate was enrolled in PHASE5B because inventing attention levels or evidence citations for a producer that does not yet compute them would be fabrication.

### 3. `uplift` — a capability binding that never landed (surfaced, not deleted)

`server/intelligence/bindings/uplift.ts`, `handlers/uplift-read-handler.ts` and `handlers/uplift-read-port.ts` are complete, and **`bindUpliftReadCapability` is never called**. `"uplift"` is not in the Capability Registry seed at all.

Its own test, `server/tests/test-intelligence-uplift-binding.ts:145`, asserts `intelligencePlatform.getCapability("uplift")!.availability === "available"` — which **cannot currently pass**, because `getCapability("uplift")` returns `undefined`. This test is broken today and PHASE5B did not touch it.

Meanwhile `server/lib/uplift-engine.ts` is reached three other ways: statically by `routes.ts:131`, by four `lib/*-assembler.ts` files, and by this dormant port. **Decision required in 5C: bind it (add the registry seed entry and make it the canonical path) or retire it (Principle 8).** It was not deleted here because it is intentional, unfinished work that PHASE5B did not author.

### 4. A zero-importer composition island (surfaced, not deleted)

Three modules with **zero importers anywhere**, including tests:
- `server/intelligence/conversation/service-composition.ts`
- `server/intelligence/capabilities/planner-composition.ts`
- `server/intelligence/conversation/business-service-composition-registry.ts` (imported only by the two above)

The whole "Business Service Composition" subsystem is dead. Retire or revive in 5C — not deleted here for the same reason as item 3.

### 5. Duplicate reasoning — mapped, and mostly *protected* by DEC1

The audit found eight independent scorers. **This is not automatically a defect.** DEC1 §3 D5 boundary 1 explicitly *protects* domain Selection: *"the engine consumes producer output; it never ranks meals, compares products, or picks swaps."* Consolidating them into the Decision Engine is exactly what DEC1 §8 forbids.

What *is* genuinely duplicated, and legitimately convergeable within the domain layer:

| Duplication | Evidence |
|---|---|
| **Three independent meal scorers** | `recommendation-service.ts:32` (`evaluateMeal`), `meal-scoring-service.ts:94` (`scoreMeal`), `household-meal-matcher.ts:423` (`scoreMealCompatibility`) — three different answers to "how good is this meal for this household". `smart-suggest-service.ts` stacks all three into a private pipeline that never touches the platform. |
| **A route-local selection path** | `routes.ts:11495-11545` independently picks a celebration, a seasonal highlight, an opportunity and a household insight — a fifth prioritisation path duplicating what the Decision Engine and the Notice Engine already do 40 lines later at `routes.ts:11587`. |
| **Four assemblers bypassing the platform** | `food-intelligence-assembler.ts`, `meal-intelligence-assembler.ts`, `connected-food-intelligence-assembler.ts`, `nutrition-centre-assembler.ts` each import `uplift-engine` directly and do their own sorting. |

These are **domain Selection convergence**, not Decision Engine work, and each is a reviewed change with its own regression surface. None was attempted in PHASE5B: collapsing three live meal scorers is not an activation, and doing it under an activation banner would have risked planner behaviour with no benchmark to catch it.

### 6. Benchmark does not yet cover the closed loop

The benchmark harness (`server/tests/benchmark/`) is live, but no case exercises resolve → Evidence → Pattern → Confirmed Understanding → re-weight. **Until one does, the loop PHASE5B closed has no regression guard.** This is the highest-value benchmark addition available.

---

## 8. SCOPE LOCK — HONOURED

| Forbidden by the brief | Status |
|---|---|
| Companion coaching | ❌ Not implemented |
| Proactive guidance | ❌ Not implemented — and the reason the two panels were left unmounted (gap 1) |
| Conversational experiences | ❌ Not implemented |
