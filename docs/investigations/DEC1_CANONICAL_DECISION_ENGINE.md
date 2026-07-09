# DEC1 — Canonical Decision Engine — Investigation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Type:** 🟢 Investigation only — no code, schema, runtime, or API changes. The single output is this document.
**Mission:** Determine whether THA should introduce a canonical Decision Engine that consistently transforms **Evidence → Attention → Decision → Action** across the Intelligence Platform; review Planner, Companion, Coach, Shopping and Food Comparison for decision logic that can be converged; recommend one canonical Decision Engine without creating a second decision system.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `dec1-pre-investigation-20260709` → `f85121e` (HEAD at start) |
| Dirty-tree snapshot | branch `snapshot/dec1-pre-investigation-20260709` (full pre-DEC1 working tree, including all prior uncommitted workstreams, captured via temp index without touching the working tree) |
| Working tree | Intentionally dirty — carries prior uncommitted workstreams (ATTN1, COACH1, COMP1/2, KNOW4/5, LEARN1, PLAN1) exactly as found |
| This task's writes | This document only |
| Rollback | `git rm docs/investigations/DEC1_CANONICAL_DECISION_ENGINE.md` (no other artifact exists) |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight principles)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (incl. the ATTN1 Attention Vocabulary row, Appendix A)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)
- [x] `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (INT21/BEH1/CP2)
- [x] `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md` (decision principles, prioritisation hierarchy, trade-off principles)
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (graduation pipeline, KC7–KC10)
- [x] `docs/implementation/ATTN1_ATTENTION_PLATFORM.md` + `docs/investigations/ATTN1_ATTENTION_PRIORITY_MODEL.md` (via the implementation record)
- [x] `docs/implementation/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md`
- [x] `docs/implementation/PLAN1_PLANNER_INTELLIGENCE.md`, `COACH1_PROACTIVE_COACHING.md`, `COMP1_FOOD_COMPARISON_INTELLIGENCE.md`, `COMP2_NATURAL_CONVERSATION.md`, `LEARN1_HOUSEHOLD_LEARNING.md`
- [x] Code: `shared/attention/index.ts`, `shared/knowledge/evidence.ts`, `server/intelligence/opportunity-delivery/framework.ts` + `delivery-store.ts`, `server/intelligence/food-intelligence/opportunity-engine.ts` + `comparison-engine.ts` + `engine.ts`, `server/intelligence/conversation/notice-engine.ts` + `behaviour-engine.ts` + `companion-guidance.ts` + `companion-actions.ts` + `companion-growth.ts` + `turn-fallback.ts`, `server/intelligence/permissions.ts`, `server/intelligence/pattern-intent-resolver.ts`, `server/intelligence/evidence-learning/framework.ts`, `server/lib/meal-scoring-service.ts`, `smart-suggest-service.ts`, `household-meal-matcher.ts`, `explainability-service.ts`, `planner-compliance.ts`, `server/routes.ts:11906-12002` (COACH1 route)

---

## 1. SUMMARY

**THA should adopt a canonical Decision Engine — by promotion and convergence, not by construction.** The investigation found that the Evidence → Attention → Decision → Action pipeline already exists in the platform, implicitly and in good health at the *vocabulary* level: Evidence Confidence gates what may render, ATTN1's Attention vocabulary says how much a household should care, domain engines select which candidate wins, and the Confirmation Tier ladder governs acting. What does **not** exist is a named owner of the **Decision stage** — the transform between "these facts are true and prioritised" and "these N items surface now, on this surface, in this order, within this budget, and here is why the others did not."

That transform is real, load-bearing, and currently implemented **three times over** (the attention sort + critical-exempt clamp in FI4, OD1 and the Notice Engine), with its supporting shapes triplicated (evidence citations, domain maps, limit clamps) and its budgets scattered across five modules. The closest existing thing to a Decision Engine is **OD1's Opportunity Delivery Framework** (`server/intelligence/opportunity-delivery/framework.ts`), which already owns eligibility, suppression, dedup, learning re-weight, ranking, budget, surface selection, lifecycle and evidence emission for ambient delivery — but it is named as a delivery framework, is enrolled by exactly one producer, and its decision is not sealed as a first-class auditable record the way BEH1 sealed the voice decision.

**Recommendation (one sentence):** designate the OD1 framework as the platform's canonical Decision Engine, converge the triplicated decision mechanics into one pure shared module beside `shared/attention`, seal the surfacing decision in the BEH1 pattern, and write the governing architecture document that fixes the Evidence → Attention → Decision → Action pipeline and its hard boundaries — while explicitly **refusing** to absorb domain Selection (Planner scoring, COMP1's verdict ladder), Evidence gating, Confirmation tiers, voice, or intent routing, each of which has a named owner that must keep it.

No second decision system is proposed. Every element of the recommendation is an evolution of an existing owner (Principle 8), and the only new artifact is a pure reference module in the exact mold of ATTN1.

---

## 2. FINDINGS

### F1 — There is no single decision system today; decision responsibility is split across seven named components

| Component | Decision it owns | Where |
|---|---|---|
| Evidence gate (PKC Phase 0) | "May this render at all?" — `isRenderableConfidence`, `isEvidenceBackedClaim`, weakest-link chain derivation | `shared/knowledge/evidence.ts:92-222` |
| Attention vocabulary (ATTN1) | "How much should the household care?" — producer-assigned `AttentionLevel`, `critical` allowlist + exemptions | `shared/attention/index.ts` |
| Domain Selection engines | "Which candidate wins?" — Planner `score`/`fitScore` + gates/caps; COMP1 verdict ladder; substitution rules | §F5 below |
| OD1 delivery framework | "What surfaces now, where, in what order, within what budget?" + lifecycle + Evidence emission | `server/intelligence/opportunity-delivery/framework.ts:631-763` |
| Notice Engine Silence Rules | "How many unprompted facts reach the user this moment?" (dedup, rank, cap 2) | `server/intelligence/conversation/notice-engine.ts:342-356` |
| Permission/confirmation gate | "May this actor do this, with what consent?" — `canInvokeCapability`, `confirmationFor` → `ConfirmationTier` | `server/intelligence/permissions.ts:75-142` |
| Behaviour Engine (BEH1) | "In which voice is it said?" — sealed, provenance-recorded, nothing reads it back | `server/intelligence/conversation/behaviour-engine.ts:444-572` |

Adjacent but distinct: the pattern-intent-resolver's routing confidence (`pattern-intent-resolver.ts:2384-2479`) decides which capability handles an utterance — a Selection score over routes, not a surfacing decision — and Evidence Learning's `decideSignal` (`evidence-learning/framework.ts:288-296`) confirms/declines a learned pattern, which is a household consent decision under Rule P1.

### F2 — The four axes are already deliberately disjoint, and that is the platform's strongest existing decision architecture

`shared/attention/index.ts:26-36` (invariant A5) fixes the doctrine: **Confidence** ("is it true?") gates first; **Attention** ("how much to care?") orders only survivors; **Selection** ("which candidate wins?" — Planner score, COMP1 ladder) is a property of a set, never of a fact's importance; and **A7** separates surfacing from acting (`AttentionLevel` governs surfacing; `ConfirmationTier` governs acting). A compile-time + runtime disjointness guard already enforces Attention ⊥ Confidence (`server/tests/test-attn1-attention-platform.ts`). DEC1 does not need to invent axes — it needs to name the owner of the stage that *consumes* them.

### F3 — The Decision stage's *mechanics* are triplicated, with the duplication acknowledged but no retirement path

The same rank-suppress-clamp mechanism exists three times, byte-similar:

| Implementation | File:lines | Sort keys | Clamp |
|---|---|---|---|
| FI4 `prioritizeOpportunities` | `opportunity-engine.ts:290-307` | `ATTENTION_RANK` → arrival | limit 10/30, critical-exempt |
| OD1 `prioritiseAndGroup` | `framework.ts:506-542` | `ATTENTION_RANK` → learning rank → seen → arrival | limit 10/30, critical-exempt |
| Notice `applySilenceRules` | `notice-engine.ts:342-356` | dedup by id → `ATTENTION_RANK` | cap 2 |

Supporting duplication:
- **Limit clamp constants + logic ×2, byte-for-byte:** `DEFAULT_LIMIT=10`/`MAX_LIMIT=30` + `Math.min(Math.max(limit,1),MAX)` in `framework.ts:81-82,512` and `opportunity-engine.ts:71-72,294`.
- **Evidence citation shape ×3, structurally identical `{source, detail}`:** `NoticeEvidence` (`notice-engine.ts:113-116`), `OpportunityEvidence` (`framework.ts:92-95`), `FoodOpportunityEvidence` (`opportunity-engine.ts:111-114`) — re-declared to preserve the Notice Engine's zero-dependency footprint, the exact rationale ATTN1 already dissolved for the priority union by placing the shared type in pure `shared/` code.
- **Domain-mapping tables ×3, overlapping:** `DOMAIN_TO_CATEGORY` (`notice-engine.ts:250-254`), `DOMAIN_SURFACE` (`framework.ts:222-226`), `CAPABILITY_DOMAIN` (`companion-guidance.ts:75-94`).
- **Terminal-status idempotency guards ×2:** `companion-action-store.ts:52-58` and `delivery-store.ts:42-53`, same shape over different enums.
- **Rule E1 ("no citation, no card") enforced per-surface** rather than once (`notice-engine.ts:282-283`; PLAN1 re-implements the same rule for planner explanations).

ATTN1 §6 collapsed the *vocabulary* (three unions, three rank maps → one) and deliberately left the three *sort functions* "layer-independent" (`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:191`, restated at `shared/attention/index.ts` header). That was correct for ATTN1's scope lock. It is exactly the residue a Decision Engine convergence exists to retire — the functions are pure, share one rank map already, and can live beside the vocabulary with zero I/O, satisfying the same zero-dependency argument ATTN1 used.

### F4 — OD1 is the de-facto Decision Engine, and it is one producer away from being only a food feature

`collectOpportunities()` (`framework.ts:631-696`) already runs the full Decision-stage pipeline in a fixed order: **collect** from the closed producer registry via the Intent Engine → **suppress by preference** (`filterMutedTypes`, critical-exempt, `:248-255`) → **suppress by lifecycle** (`partitionForDelivery`, terminal statuses never re-deliver, `:427-440`) → **re-weight by confirmed learning** (`LearningRank -1|0|1`, `:309-340`, LEARN1: re-weights within tier, never generates) → **rank + budget + group** (`prioritiseAndGroup`, `:506-542`) → **persist** new deliveries → **return with trust metadata**. Resolution (`resolveOpportunity`, `:719-763`) closes the loop: terminal transitions emit exactly one Evidence event (accepted→positive, dismissed→negative), making OD1 the platform's first Decision→Evidence feedback edge — the "Action" end of the pipeline feeding the "Evidence" end of the next cycle.

But: the producer registry contains exactly **one** entry (`"food-intelligence"`, `framework.ts:214-216`); the component is named a *delivery framework*, so nothing tells the next workstream that planner-, coach- or comparison-originated surfacing decisions belong here; and while it emits `trust` counts, the decision itself is not sealed as a first-class record (contrast BEH1, F7).

### F5 — Domain Selection is healthy, domain-owned business logic that a canonical Decision Engine must NOT absorb

- **Planner:** `scoreMeal` additive weighted score (`meal-scoring-service.ts:94-245`), household `fitScore` (`household-meal-matcher.ts:334-481`), hard-exclusion gates + 4-tier fallback ladder + week caps + top-3 stochastic pick (`smart-suggest-service.ts:486-1000`), write gate (`planner-compliance.ts:126-156` — pure delegation to the shared restriction/diet SSoT, explicitly "no second engine"), explanation selection/rank/cap (`explainability-service.ts:140-469`).
- **Food Comparison (COMP1):** the deterministic verdict ladder (`comparison-engine.ts:444-547`): Rule T0 safety rung → THA rating rung → processing rung → **honest tie** (no fabricated winner); all-or-nothing comparability per dimension (`:377-404`); identity precedence canonical-over-scan (`:619-653`).
- **Substitution/swap family:** `shared/substitution-rules.ts`, `recipe-swap-engine.ts`, `uplift-engine.ts` — a transformation-selection family, separate again.

These share *doctrine* (T0 as absolute first gate, honest ties/gaps over fabricated edges, explainable basis for every pick) but not *shape*: a meal score, a comparison rung and a substitution rule cannot share an engine without the engine becoming a second owner of planner/food logic — precisely TIP1's named risks R4 ("Intent Engine grows business logic") and R6 ("duplicate planner/shopping logic"), and a violation of NK2 M1/M2. **Convergence for Selection means shared doctrine and shared safety primitives (already true: all four safety call-sites route through `resolveIngredientRestrictions`), not shared code.**

The one genuine cross-boundary crack found: `meal-scoring-service.ts:57-71` carries its own `DIET_EXCLUDED_KEYWORDS` list for *soft scoring*, separate from the shared diet SSoT used for hard gating — a second diet vocabulary in scoring clothing. Flagged for the roadmap (Phase 4), not for the Decision Engine itself.

### F6 — Volume budgets are scattered, and one documented claim about them is no longer accurate

Independent caps: delivery 10/30 (`framework.ts:81-82`), notices 2 (`notice-engine.ts:329`), guidance suggestions 2 (`companion-guidance.ts:60`), action proposals 4 (`companion-actions.ts:69`), resolver intents 4 (`pattern-intent-resolver.ts:46`), FI3 recommendations 20, FI4 opportunities 10/30 (duplicated from OD1). The Silence Rules' claim to be "the ONLY place presentation order/volume is decided" is true for *unprompted notices* but reads as broader than it is — guidance and action proposals enforce their own caps at other seams. These are legitimately different budgets (unprompted attention vs response enrichment vs acting proposals), but no document names them as a family, so each new surface invents its own `MAX_*` constant with an "avoid overwhelming the user" comment (three verbatim instances found).

### F7 — BEH1 already built the template for a first-class, sealed, audit-only decision

`resolveBehaviour` → `sealBehaviourDecision` (`behaviour-engine.ts:444-572`) makes one decision per interaction, seals it with provenance-honest confidence (0|1), outcome, touched surfaces, and a deterministic reasoning trail; callers record it as an observation; **nothing reads it back**. The surfacing decision — *why these two notices and not those eight* — has no equivalent record. OD1's `trust` block and `metadata.learning` are the embryo of one. NK2 H5 ("every guidance decision is explainable, every learning weight visible") and NK2's "learning must never be a hidden decision-maker" (`NK2:581`) make sealing the surfacing decision a doctrine requirement, not a nicety.

### F8 — Known deferred decision features will need a home, and without DEC1 each will be built per-surface

Cross-session cooldown/quiet-period does not exist anywhere (COACH1 doc :132, :305; deferred to NTC-P5) — `deliveredAt` is stamped once and never used for pacing. ATTN1 Phase 7 (Comparison/Food Report surfaces expressing `critical`) is approved-in-principle but unimplemented. Both are Decision-stage features. Built without a named owner, each lands as a fourth and fifth copy of the sort/suppress/cap mechanics.

### F9 — NK2 supplies the normative decision principles, and the runtime already honours them structurally

The prioritisation hierarchy (Safety → household-relevant → pattern awareness → sourced caution → optimisation, `NK2:169-249`), Rule T0's two faces (subtractive in Selection ladders; additive as ATTN1 `critical`), Rule P1 (learning re-weights, never generates — realised as `LearningRank` within-tier), and trade-offs T1–T5 (honesty > completeness, safety > optimisation, agency > optimisation) are all present in code. A Decision Engine governing document mostly has to *state* the mapping so future decision logic inherits it deliberately rather than by imitation.

---

## 3. ARCHITECTURE RECOMMENDATION

### 3.1 The canonical pipeline, named

```
EVIDENCE      "Is it true, and may it render?"
              Owners: knowledge stores + shared/knowledge/evidence.ts gate (runs FIRST);
              producers attach {source, detail} citations (Rule E1: no citation, no card)
   │
   ▼
ATTENTION     "How much should this household care, right now?"
              Owner: shared/attention (ATTN1). Producer-assigned, never re-derived (A1);
              critical = Rule T0's additive face, closed allowlist (A2)
   │
   ▼
DECISION      "Which already-true, already-prioritised items surface NOW — where,
              in what order, within what budget — and why did the rest not?"
              Owner (TO BE NAMED by DEC1): the Decision Engine =
              OD1's framework, promoted + one pure shared mechanics module
              (eligibility · muting · lifecycle suppression · learning re-weight ·
               rank · budget · surface routing · sealed decision record)
   │
   ▼
ACTION        "What may be done about it, with what consent?"
              Owners: Capability Registry verbs + permissions.confirmationFor
              (ConfirmationTier — A7: surfacing never changes acting);
              terminal resolution emits Evidence (OD1 resolveOpportunity) → feeds
              the next cycle's EVIDENCE. The loop is closed, once, here.
```

This is the same architectural move the platform has now made three times (INT17 context budget, INT20 attention budget, INT21 voice): one seam, one owner, verbatim facts, a hard invariant that the layer shapes its own concern and never truth. DEC1 names the fourth seam. Selection — "which candidate wins" *within* a domain — is deliberately **not a pipeline stage**: it happens inside producers/domain engines before Evidence→Attention hand-off, and stays there.

### 3.2 The five recommendations

**D1 — Designate, don't build: OD1's framework IS the Decision Engine.**
Promote `server/intelligence/opportunity-delivery/framework.ts` (and its delivery store) to the platform's canonical Decision Engine for ambient surfacing, via a governing architecture document (`THA_DECISION_ENGINE_ARCHITECTURE.md`, promoted from this investigation on approval and indexed in `docs/architecture/README.md` under Intelligence Governance). Its producer registry is the enrolment door: any surface that wants ambient surfacing registers a producer; none builds its own suppress/rank/budget path. No rename of files is required for designation (naming is governance, not churn); whether to relocate `opportunity-delivery/` → `decision/` is an open question (§7 Q1).

**D2 — Converge the decision mechanics into one pure module beside the attention vocabulary.**
Create `shared/attention/decision.ts` (or sibling `shared/decision/` — §7 Q2): pure, zero-I/O exports — `orderByAttention(items, keys)` (the canonical stable multi-key sort), `clampWithCriticalExemption(items, limit, DEFAULT/MAX)`, `dedupeById`, and the one canonical `EvidenceCitation {source, detail}` type. FI4, OD1 and the Notice Engine adopt it; the three local sorts, the two byte-identical clamps and the three evidence types retire in the same changeset (Principle 8 retirement condition: no module declares a local attention sort, clamp constant pair, or `{source, detail}` evidence type — grep-verified). The Notice Engine's zero-dependency rationale is preserved by exactly the argument ATTN1 already banked: `shared/` pure code is not an I/O dependency. Golden-identity tests must prove byte-identical ordering for no-critical inputs, as ATTN1's did.

**D3 — Seal the surfacing decision (BEH1 pattern).**
One `DecisionRecord` sealed per delivery moment by the Decision Engine: counts gathered per producer, items suppressed and by which rule (muted / terminal / budget), learning influence (already computed), budget applied, ordering basis. Callers (the COACH1 route, future surfaces) record it via the Observation Engine; the Workbench projects it; **nothing reads it back** (the BEH1 non-negotiable, verbatim). This satisfies NK2 H5 and makes "why didn't I see X?" answerable by an operator without archaeology.

**D4 — Declare the budget doctrine.**
A short registry (documentation-first; a typed table in the shared module only if Phase 4 justifies it) naming every user-facing volume budget: delivery 10/30, notices 2, guidance 2, proposals 4, resolver 4 — each with owner, seam, and rationale. New budgets require adding a row, not inventing a constant. Changing a budget is a reviewed decision, mirroring `CRITICAL_TYPES` governance (attention-inflation risk R1 has a budget-inflation twin).

**D5 — Fix the hard boundaries (what the Decision Engine must never absorb).**
- **Selection** — Planner scoring/gates/ladders, COMP1's verdict ladder, substitution rules: domain-owned business logic (TIP1 R4/R6). The Decision Engine consumes producer output; it never ranks meals, compares products, or picks swaps.
- **Evidence gating** — `shared/knowledge/evidence.ts` runs upstream; the Decision Engine orders only what the gate admitted, and may never launder confidence into attention (A5).
- **Attention assignment** — producer-owned (A1); the engine sorts by it, never re-derives it.
- **Acting** — `ConfirmationTier` and capability permissions stay in `permissions.ts` (A7); a decision to surface never softens a confirmation.
- **Voice** — the Behaviour Engine's seam, downstream, untouched (INT21 §0).
- **Intent routing** — the pattern-intent-resolver's confidence is a different decision family and stays where it is.
- **Learning** — reads only Confirmed Understanding through EL2's one door; re-weights within tier; never generates, never auto-acts (Rule P1, LEARN1).

### 3.3 Why this is not a second decision system

Every runtime element either already exists (OD1, the sorts, the trust metadata) or is a pure reference module in the exact class ATTN1 established (Principle 5 — beside the spine, no store, no service, no I/O). The three duplicated mechanics retire on introduction (Principle 8). No new store is created; `opportunity_deliveries` remains the only decision-adjacent state, unchanged; the `DecisionRecord` is an observation (existing `platform_observations` pathway), not a table. The Behaviour Engine, Notice Engine Silence Rules, and CCE keep their seams — the Silence Rules become a *consumer* of the shared mechanics, not a subordinate of the Decision Engine, preserving INT20's ownership of the presentation-edge attention budget.

---

## 4. IMPLEMENTATION ROADMAP

Each phase is a separately gated workstream under `ENGINEERING_WORKFLOW.md`; none is authorised by this document. Order chosen so governance lands before mechanics, mechanics before behaviour, and every behavioural step is golden-identity-tested.

**Phase 0 — Governance (🟢 docs only).** Promote this investigation to `docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md`; index in README (Intelligence Governance); add the Decision Engine row to the SoT Register Appendix A; state the pipeline, the five boundaries (D5), and the budget doctrine table (D4, documentation form). *Exit: a workstream adding surfacing logic can be pointed at one governing document.*

**Phase 1 — Shared decision mechanics (🟡 AMBER).** Build `shared/attention/decision.ts` (D2); adopt in FI4 + OD1 + Notice Engine; retire the three local sorts, duplicate clamps, and three evidence types in the same changeset. Golden-identity tests: for any input, ordering and clamping byte-identical to today (including the critical exemptions). *Exit: one implementation of rank/clamp/dedupe/citation; grep-verified zero local copies; all existing suites green.*

**Phase 2 — Sealed DecisionRecord (🟡 AMBER).** Add `sealDeliveryDecision` to the Decision Engine mirroring `sealBehaviourDecision`; capture at the COACH1 route and the opportunities route via the Observation Engine; Workbench projection. Invariant: nothing reads it back — asserted by test, as BEH1's suite does. *Exit: every delivery moment explains itself to an operator; zero behaviour change (record-only).*

**Phase 3 — Producer enrolment (🟡 per producer).** Document the enrolment contract (producer emits evidence-cited, attention-assigned `RawOpportunity`s; A2 assertion at the adapter; per-producer honest degradation) and enrol the next real producer when product need arrives — candidates in observed priority order: planner-native signals beyond FI4's gap detection, comparison follow-ups (ATTN1 Phase 7's `critical` extension), coach growth moments. *Exit per producer: enrolled through the registry with zero new suppress/rank/budget code.*

**Phase 4 — Budget + vocabulary hygiene (🟢/🟡).** Converge the three domain-mapping tables where they genuinely state the same fact (capability→domain→surface); decide the fate of `meal-scoring-service.ts`'s private `DIET_EXCLUDED_KEYWORDS` (fold into the shared diet SSoT as a declared soft-scoring view, or document why scoring legitimately differs — Principle 2 scope test); typed budget table only if Phase 0's doc form proves insufficient. *Exit: no undocumented budget; no second diet vocabulary without a written scope justification.*

**Phase 5 — Deferred decision features, built once (future, product-gated).** Cooldown/quiet-period (NTC-P5) lands as Decision Engine capability (delivery-store gains the pacing read; one implementation serves all producers); ATTN1 Phase 7 surface extensions ride the enrolment contract. *Exit: no per-surface pacing logic anywhere.*

**Explicitly rejected roadmap items:** a central "DecisionEngine.decide()" that domain engines call to rank their own candidates (absorbs Selection — TIP1 R4); moving the Silence Rules into OD1 (collapses two governed seams into one, against INT20); any learned/adaptive threshold inside the engine (Rule P1; BEH1's "nothing reads it back" applies to the DecisionRecord too); a decisions DB table (the Observation pathway suffices; a table would be a second store of a fact the observation already owns).

---

## 5. ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST (for this investigation and its recommendation)
==================================
☑ One canonical identity — no entity keys touched or proposed; opportunities keep
  their item-scoped ids, namespaced by capability in OD1.
☑ One owner per fact — the recommendation CREATES a single owner for a currently
  three-owner mechanism (decision mechanics), and names owners for stages that
  have them already. No fact gains a second owner.
☑ No duplicate entities — no new entity. A pure mechanics module is not an entity
  (same class as shared/attention, Principle 5).
☑ No duplicate ownership — the reverse: 3 sorts → 1, 3 evidence types → 1,
  2 clamps → 1, with retirement conditions named (Phase 1).
☑ No duplicate state — no new state. opportunity_deliveries remains the only
  decision-adjacent store; DecisionRecord is an observation, not a table.
☑ Extends existing architecture — extends ATTN1's reference-vocabulary pattern,
  OD1's pipeline, BEH1's sealed-decision pattern, and the INT17/INT20/INT21
  one-seam-one-owner series. Nothing built beside an existing pattern.
☑ Progressive enrichment where appropriate — not a knowledge entity; N/A.
☑ Honest gaps over fabricated information — unchanged and restated: Rule E1
  centralised, honest ties/gaps doctrine named for all decision logic.
☑ No permanent synchronisation bridge — none proposed; convergence deletes
  copies rather than syncing them.
☑ Evolution over replacement — every replaced artifact is named with its
  retirement condition in the same phase that introduces its successor.
```

```
AI ARCHITECTURE COMPLIANCE
✓ Uses the canonical Intelligence Platform — OD1's producer fetch stays on
  intelligencePlatform.handle(); no new path proposed.
✓ Uses the Capability Registry — producer enrolment rides registered
  capabilities/verbs; no unregistered execution.
✓ Uses the Intent Engine — unchanged; routing decisions stay in the resolver.
✓ Reuses existing business services — the engine consumes producer output and
  never re-implements domain logic (D5).
✓ Does not create another assistant — no.
✓ Does not duplicate conversation state — no; notices stay unpersisted, the
  DecisionRecord is telemetry.
✓ Uses registered capabilities only / permission-aware access — unchanged;
  caller-scoped reads, A7 confirmation ladder untouched.
✓ Produces honest gaps rather than fabricated knowledge — doctrine restated as
  a Decision-stage invariant (honest suppression accounting, honest ties).
```

**Domain impact:**

```
DOMAIN IMPACT
=============
Domain affected: Decision (cross-cutting Intelligence stage — vocabulary/governance)
Declared SoT: none today (the gap this investigation names); proposed —
  THA_DECISION_ENGINE_ARCHITECTURE.md (governance) +
  server/intelligence/opportunity-delivery/framework.ts (runtime) +
  shared/attention/decision.ts (pure mechanics, Phase 1)
New store created? NO (investigation); Phase 1 creates a reference module, not a store
Existing store extended? NO
Consumer created? NO (investigation only)
```

---

## 6. TRUST CHECK

- **Could this mislead the user?** No — investigation only; no user-facing output. The recommendation's direction *increases* honesty: suppression becomes accountable (DecisionRecord) instead of silent.
- **Could this fabricate certainty?** No. The axes stay disjoint; confidence cannot be laundered into attention or into surfacing; the engine orders only evidence-gated items.
- **Is anything guessed but shown as real?** No. Every finding cites file:line in the current tree; convergence percentages below count named duplicates.
- **What happens if the system is wrong?** If the recommendation is wrong (e.g. the sorts genuinely need to diverge later), Phase 1's shared functions can be parameterised or a layer can re-localise its sort — the golden-identity suite makes divergence a deliberate, tested act instead of drift.
- No architectural duplication introduced: **YES** (none; three duplications named for removal).
- No new source of truth created: **YES** (this document proposes owners for an ownerless mechanism; it owns nothing itself).
- No runtime behaviour altered: **YES** — investigation only; zero code touched.

**Architecture Convergence Status (Decision domain, evidence-based):**
Current canonical owner: **NONE** (the finding). Duplicate workflows: 3 attention sorts, 2 clamp implementations, 3 evidence types, 3 domain maps, ≥2 Rule E1 enforcements — 13 counted duplicates across 5 modules. Current convergence: vocabulary 100% (ATTN1), mechanics **0 of 13** duplicates converged (0%). Target after Phases 1–4: 13 of 13 (100%). Next milestone: Phase 0 (governance promotion). Remaining risk: every new ambient surface built before Phase 1 adds a fourth sort — the cost of waiting is linear in workstreams.

---

## 7. OPEN QUESTIONS (for approval alongside this investigation)

1. **Naming/location of the runtime engine:** keep `server/intelligence/opportunity-delivery/` and designate by documentation (recommended — zero churn, Principle 8), or relocate to `server/intelligence/decision/` at Phase 1 (clearer signpost, mechanical rename cost)?
2. **Module placement for the pure mechanics:** `shared/attention/decision.ts` (recommended — the mechanics are attention-ordering mechanics, one import for consumers) or a sibling `shared/decision/` (cleaner if the budget table lands there later)?
3. **DecisionRecord capture scope:** delivery moments only (recommended for Phase 2), or also the Notice Engine's silence application (richer, but adds a capture point inside the conversation flow)?
4. **Does the guidance/proposal family (caps 2/4) formally join the budget doctrine table** even though their seams stay where they are? (Recommended: yes — documentation only.)

---

## 8. OUTCOME & NEXT STEPS

**Outcome:** THA should introduce a canonical Decision Engine — realised as governance over, and convergence into, what already exists: OD1's framework as the runtime owner, ATTN1-style pure shared mechanics, a BEH1-style sealed decision record, and a governing document fixing Evidence → Attention → Decision → Action with hard boundaries around Selection, Confidence, Confirmation, Voice and Routing. No second decision system; three existing duplications retired.

**Next steps:** (1) approval of this investigation and its open questions; (2) Phase 0 governance promotion; (3) Phase 1 as the first code workstream, gated by its own rollback + golden-identity suite.

**Scope lock honoured:** investigation only. No code, schema, config, or runtime change was made. The only writes are this document, the rollback tag, and the snapshot branch.

---

*Investigation only. Rollback: tag `dec1-pre-investigation-20260709` → `f85121e`; snapshot branch `snapshot/dec1-pre-investigation-20260709`.*
