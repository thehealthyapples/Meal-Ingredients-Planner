# THA Decision Engine Architecture (DEC1)

**Status:** Governing architecture — promoted from investigation `docs/investigations/DEC1_CANONICAL_DECISION_ENGINE.md` under DEC1 (2026-07-09). Indexed in `docs/architecture/README.md` under Intelligence Governance.
**Owner of this document's subject:** the Decision stage of the Intelligence Platform.
**Implementation record:** `docs/implementation/DEC1_CANONICAL_DECISION_ENGINE.md`.

---

## 1. What this document governs

THA has one canonical **Decision Engine**. It owns exactly one question — the Decision stage of the platform's pipeline:

> **"Which already-true, already-prioritised items surface NOW — where, in what order, within what budget — and why did the rest not?"**

The Decision Engine was **designated, not built** (Principle 8 — evolution over replacement): it is OD1's Opportunity Delivery Framework, promoted by this document, with its triplicated mechanics converged into one pure shared module and its decision sealed as a first-class record. No second decision system exists, and none may be introduced.

| Element | Canonical owner |
|---|---|
| Runtime Decision Engine | `server/intelligence/opportunity-delivery/framework.ts` (+ `delivery-store.ts`, sole owner of `opportunity_deliveries`) — location unchanged at designation; naming is governance, not churn |
| Pure decision mechanics | `shared/attention/decision.ts` — `orderByAttention`, `clampWithCriticalExemption`, `clampLimit`, `dedupeById`, `EvidenceCitation`, `DELIVERY_DEFAULT_LIMIT`/`DELIVERY_MAX_LIMIT` |
| The sealed decision | `DeliveryDecision`, sealed by `sealDeliveryDecision` (framework), recorded as a `delivery-decision` observation by the opportunity-delivery capability handler |
| Enrolment door | `OPPORTUNITY_SOURCES` (framework) — a producer registers a capability id, a verb, and an `adapt()`; it never builds its own suppress/rank/budget path |

## 2. The canonical pipeline

```
EVIDENCE      "Is it true, and may it render?"
              Owners: knowledge stores + shared/knowledge/evidence.ts gate (runs FIRST);
              producers attach EvidenceCitation {source, detail} (Rule E1: no citation, no card)
   │
   ▼
ATTENTION     "How much should this household care, right now?"
              Owner: shared/attention (ATTN1). Producer-assigned, never re-derived (A1);
              critical = Rule T0's additive face, closed allowlist (A2)
   │
   ▼
DECISION      "Which already-true, already-prioritised items surface NOW — where,
              in what order, within what budget — and why did the rest not?"
              Owner: THE DECISION ENGINE (OD1's framework + shared/attention/decision.ts)
              eligibility · muting · lifecycle suppression · learning re-weight ·
              rank · budget · surface routing · sealed DeliveryDecision
   │
   ▼
ACTION        "What may be done about it, with what consent?"
              Owners: Capability Registry verbs + permissions.confirmationFor
              (ConfirmationTier — A7: surfacing never changes acting);
              terminal resolution emits Evidence (resolveOpportunity) → feeds
              the next cycle's EVIDENCE. The loop is closed, once, here.
```

**Selection is deliberately not a pipeline stage.** "Which candidate wins" *within* a domain (Planner scoring, COMP1's verdict ladder, substitution rules) happens inside producers/domain engines before the Evidence → Attention hand-off, and stays there.

## 3. The hard boundaries (D5) — what the Decision Engine must never absorb

1. **Selection** — Planner `score`/`fitScore`/gates/ladders, COMP1's verdict ladder, substitution rules: domain-owned business logic (TIP1 R4/R6). The engine consumes producer output; it never ranks meals, compares products, or picks swaps.
2. **Evidence gating** — `shared/knowledge/evidence.ts` runs upstream; the engine orders only what the gate admitted, and may never launder confidence into attention (A5).
3. **Attention assignment** — producer-owned (A1); the engine sorts by it, never re-derives it. `critical` remains the closed A2 allowlist, asserted at the producer adapter.
4. **Acting** — `ConfirmationTier` and capability permissions stay in `permissions.ts` (A7); a decision to surface never softens a confirmation.
5. **Voice** — the Behaviour Engine's seam (INT21), downstream, untouched. **Intent routing** — the pattern-intent-resolver's confidence is a different decision family and stays where it is. **Learning** — reads only Confirmed Understanding through EL2's one door; re-weights within tier; never generates, never auto-acts (Rule P1).

These boundaries are enforced by source-scan assertions in `server/tests/test-dec1-decision-engine.ts` §4.

## 4. The pure mechanics (`shared/attention/decision.ts`)

A reference mechanics module in the exact class ATTN1 established (Principle 5): pure, zero-I/O, beside the entity spine — not a store, not a service, not a capability. Its exports are the ONLY implementation of the Decision-stage mechanics; a module-local attention sort, limit-clamp pair, id-dedupe, or `{source, detail}` evidence type is an architecture violation (Principle 8 retirement condition, grep-asserted in the DEC1 test §3).

- `orderByAttention(items, tieBreakers?)` — the canonical stable multi-key sort: `ATTENTION_RANK` first, caller-supplied tie-breakers next (OD1 passes LEARN1's learning rank and COACH1's seen flag), arrival order last. No tie-breaker can move an item across an attention tier.
- `clampWithCriticalExemption(ordered, limit, maxLimit?)` — ATTN1 invariant A3: every `critical` admitted before the limit applies to the remainder.
- `clampLimit(limit, maxLimit?)` — the one limit-normalisation rule, `[1, maxLimit]`.
- `dedupeById(items)` — first occurrence wins.
- `EvidenceCitation` — the one `{source, detail}` citation shape. `FoodOpportunityEvidence`, `OpportunityEvidence` and `NoticeEvidence` are aliases of it at their original export sites.

Consumers: FI4's `prioritizeOpportunities`, OD1's `prioritiseAndGroup`, the Notice Engine's `applySilenceRules`. Convergence was proven behaviour-identical by golden-identity tests against the frozen pre-DEC1 implementations (byte-identical output across a seeded sweep). If a layer's sort ever genuinely needs to diverge, that divergence is a deliberate, tested act — parameterise or re-localise with a written scope justification, never by drift.

## 5. The sealed DeliveryDecision (the BEH1 pattern)

Every delivery moment seals **one** `DeliveryDecision`: producers reached and what each offered, suppression accounting by rule (**muted / lifecycle / budget** — arithmetic complete, every non-delivered item accounted to exactly one rule), learning influence (verbatim from LEARN1's already-computed influence), requested vs applied budget, criticals admitted outside the budget, persistence counts, the fixed ordering basis (`attention → learning → seen → arrival`), and a deterministic operator-facing `reasoning` trail (same inputs, same sentences, every time).

Capture discipline (BEH1's, verbatim): **the engine seals (pure), the capability handler records** — one `delivery-decision` observation per `report`, through the Observation Engine's ordinary fire-and-forget seam, at the one choke point every consuming surface passes through. The record is operator telemetry: it is never serialised onto the wire result, never shown to a user, and **nothing reads it back** (Observation Engine §7 — telemetry is never an input to behaviour). This satisfies NK2 H5 ("every guidance decision is explainable, every learning weight visible") and makes "why didn't I see X?" answerable without archaeology. Rows are visible in the Observation Workbench's generic views (by-kind, recent, export); a bespoke summariser is deferred until operator need arrives.

## 6. The budget doctrine (D4)

Every user-facing volume budget, named. New budgets add a row here; changing one is a reviewed decision (budget inflation is attention inflation's twin — ATTN1 R1).

| Budget | Value | Owner / seam | Rationale |
|---|---|---|---|
| Ambient delivery limit | default 10, max 30 | Decision Engine — `DELIVERY_DEFAULT_LIMIT`/`DELIVERY_MAX_LIMIT`, `shared/attention/decision.ts` (the one constant pair; critical exempt) | What one `report` may deliver across all producers |
| Unprompted notices per moment | 2 | Notice Engine Silence Rules — `MAX_NOTICES_PER_MOMENT` (INT20; **no** critical exemption — critical fills it first) | The Companion never reads as a notification feed |
| Guidance suggestions | 2 | `companion-guidance.ts` `MAX_SUGGESTIONS` | Response enrichment, not a feed |
| Action proposals | 4 | `companion-actions.ts` `MAX_PROPOSALS` | Acting proposals stay reviewable |
| Resolver intents per turn | 4 | `pattern-intent-resolver.ts` `MAX_INTENTS` | Routing breadth, not user volume |
| FI3 recommendations | 20 | `food-intelligence/engine.ts` | Domain report size |

The Silence Rules, guidance and proposal caps keep their seams: they are **consumers or peers** of the Decision Engine's mechanics, never subordinates — collapsing them into OD1 was explicitly rejected (it would merge two governed seams, against INT20).

## 7. Producer enrolment (the door for every future ambient surface)

A producer enrols by adding one entry to `OPPORTUNITY_SOURCES`: a capability id, the verb to call, and an `adapt()` translating its result into `RawOpportunity` (evidence-cited — Rule E1; attention-assigned — A1; A2 asserted at the adapter so an inflated `critical` honestly degrades the whole batch). It inherits eligibility, muting, lifecycle suppression, learning re-weight, rank, budget, surface routing, the sealed decision, and the Decision→Evidence feedback edge — with **zero** new suppress/rank/budget code. A workstream adding surfacing logic anywhere else must STOP and be pointed at this document.

## 8. Explicitly rejected (do not build)

- A central `DecisionEngine.decide()` that domain engines call to rank their own candidates — absorbs Selection (TIP1 R4).
- Moving the Silence Rules into OD1 — collapses two governed seams (INT20).
- Any learned/adaptive threshold inside the engine — Rule P1; the DeliveryDecision is read back by nothing.
- A decisions DB table — the observation pathway owns the record; a table would be a second store of the same fact.

## 9. Open questions from the investigation — resolved at implementation

| Q | Resolution |
|---|---|
| Q1 — rename/relocate `opportunity-delivery/`? | **No.** Designated by documentation (this file + the framework header); zero churn (Principle 8). |
| Q2 — mechanics module placement | `shared/attention/decision.ts` — the mechanics are attention-ordering mechanics; one import for consumers. |
| Q3 — DecisionRecord capture scope | Delivery moments only (the `report` choke point). The Silence Rules' application is not captured — a capture point inside the conversation flow is not justified by operator need today. |
| Q4 — guidance/proposal caps in the budget table | Yes — documentation only (§6); their seams unchanged. |
