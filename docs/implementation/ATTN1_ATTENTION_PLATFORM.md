# ATTN1 — Canonical Attention Platform — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** One deliberate runtime behaviour change (the `critical` attention level and its three suppression exemptions) plus a pure vocabulary convergence; no schema change, no data migration, single-revert rollback.
**Implements:** `docs/investigations/ATTN1_ATTENTION_PRIORITY_MODEL.md` (§5 Canonical Attention Model, §7 Phases 1–4 + 6), exactly as investigated. No second priority system was created.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-attn1-attention-platform-20260709` → `f0ab371033fbf221830da0dabe348d60211cd47c` |
| Dirty-tree snapshot | branch `snapshot/attn1-pre-implementation-20260709` → `dac9d660cf9dbd72dceea08ffedcb8176485074e` (full pre-ATTN1 working tree, including all prior uncommitted workstreams, captured without touching the working tree) |
| Working tree | Intentionally dirty — carries prior uncommitted workstreams (COACH1, COMP2, KNOW4, KNOW5, LEARN1, PLAN1 implementation files) exactly as found |
| This task's writes | See **Files modified** in the Rollback Plan below |
| Rollback to committed state | `git checkout rollback/before-attn1-attention-platform-20260709` |
| Rollback to exact pre-ATTN1 dirty tree | `git checkout snapshot/attn1-pre-implementation-20260709 -- .` (restores every file, including prior workstreams' uncommitted state) |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (via the investigation's Principle 2/5/6/7/8 compliance table, re-verified against the citations)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (updated — see Domain Impact)
- [x] `docs/investigations/ATTN1_ATTENTION_PRIORITY_MODEL.md` (the approved architecture this implements)

---

## 0. WHAT THE INVESTIGATION FOUND, AND WHAT THIS IMPLEMENTS

ATTN1 found that THA already had an attention model — a three-value `priority`, declared three times (FI4, OD1, Notice Engine), sorted three times, persisted once as a non-owning snapshot — and that it could not express the one level that matters most. Rule T0 (*"Safety is the absolute blocker"*, NK2 §2 P1) existed only **subtractively** (never recommend an unsafe thing); it had no **additive** face (never fail to surface an unsafe thing the household already has). Concretely:

- **F2** — the hard-restriction shopping conflict was an ordinary `high`, indistinguishable from a half-empty planner week.
- **F3** — a household could permanently silence its own allergen warnings via `mutedOpportunityTypes` (no exemption existed).
- **F4** — inside the `high` tier, an *acknowledged* safety conflict sorted below an *unseen* planner nudge.
- **F5** — the stacked caps (delivery limit 10, notice budget 2) could silently drop a safety notice.
- **F1** — one attention concept, three unions, three rank maps.

This implementation closes all five with **one shared vocabulary and one carved level**, per the approved model.

---

## 1. WHAT WAS BUILT

### 1.1 The canonical vocabulary — `shared/attention/index.ts` (NEW)

A **reference vocabulary** (Core Principle 5), not a store, not a service, not a capability. Pure, zero-I/O, importable from server and client:

- `AttentionLevel = "critical" | "high" | "medium" | "low"` — the ONE attention union.
- `ATTENTION_RANK` — the ONE total order (critical 0 → low 3).
- `ATTENTION_LABELS` — the presentation-edge names: Critical / **Important** / **Helpful** / **Informational**.
- `CRITICAL_TYPES` — the CLOSED allowlist of types permitted to be `critical`; initial membership exactly `{ "shopping-restriction-conflict" }`. Membership changes require governance review (invariant A2; the structural defence against attention inflation, risk R1).
- `isAttentionLevel` / `isCritical` / `assertCriticalAllowed` — the boundary guard and the invariant-A2 assertion (throws for `critical` on a non-allowlisted type).

**Phase 5 decision made explicit (ATTN1 §9 Q2):** the value-level rename `high|medium|low` → `important|helpful|informational` is **deferred as recommended** — it is pure cosmetics that would churn every fixture and the persisted snapshot column for no behavioural gain. The four-name vocabulary exists at the presentation edge via `ATTENTION_LABELS`. The wire values stay byte-compatible with every existing fixture and DB row.

### 1.2 The three predecessors retired (Phase 2 + Phase 6, Principle 8)

| Retired declaration | Was at | Now |
|---|---|---|
| `FoodOpportunityPriority` union + `PRIORITY_RANK` | `opportunity-engine.ts` | imports `AttentionLevel` + `ATTENTION_RANK` |
| `OpportunityPriority` union + `PRIORITY_RANK` | `framework.ts` | imports `AttentionLevel` + `ATTENTION_RANK` |
| `NoticePriority` union + `PRIORITY_RANK` | `notice-engine.ts` | imports `AttentionLevel` + `ATTENTION_RANK` |

Net: **−3 unions, −3 rank maps, +1 vocabulary** — the §6 subtraction table realised. The three **sort functions** are untouched (their layer-independence is deliberate per `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:191`). The Notice Engine's zero-dependency rationale is preserved: `shared/attention` is pure and performs no I/O, which is precisely what its `:102-108` rationale permits. The retirement condition was met within this changeset, so the Phase-2 deprecated aliases were never needed — the barrel (`server/intelligence/index.ts`) now re-exports the shared vocabulary instead of the two retired type names (grep-verified: no other importer existed).

### 1.3 `critical` — the first and only behaviour change (Phase 3)

1. **FI4 emits it** — `identifyShoppingRestrictionOpportunities` now emits `priority: "critical"` for `shopping-restriction-conflict` (was `"high"`). This is the platform's sole `critical` emitter, and the sole allowlist member.
2. **A2 enforced structurally** — OD1's producer adapter (`adaptFoodIntelligence`) validates every incoming priority with `isAttentionLevel` and calls `assertCriticalAllowed`. A producer emitting `critical` for a non-allowlisted type throws; the per-producer catch turns that into an honest empty batch — an inflated harm signal never surfaces, not even alongside legitimate opportunities.
3. **A3 exemptions, attached to `critical` alone (A4):**
   - `filterMutedTypes` skips `critical` — a household may not blanket-silence a safety class (closes F3). Muting remains fully in force for every other level.
   - `prioritiseAndGroup` admits every `critical` before applying `limit` to the remainder (closes F5's first half). With no critical present, output is byte-identical to before.
   - FI4's own `prioritizeOpportunities` mirrors the same clamp exemption — it is the same clamp one layer down, and a safety signal must not be droppable there either.
   - `applySilenceRules` fills `critical` first — it is the top rank, so no pair of `high` notices can consume the `MAX_NOTICES_PER_MOMENT = 2` budget ahead of a harm signal (closes F5). The cap itself is unchanged.
   - Because attention is the FIRST sort key, an **acknowledged** `critical` now outranks an **unseen** `high` (closes F4), and a confirmed-negative learning rank cannot sink it (LEARN1's within-tier guarantee now protects safety from its own former tier).
   - **Per-instance `dismiss` is retained** (approved answer to §9 Q1): ids are item-scoped, so dismissing *this* resolved conflict never silences a *future* one.
4. **A7 honoured** — no verb, no capability, no confirmation-tier exception was introduced. A `critical` still resolves through OD1's ordinary registered verbs at their ordinary confirmation tier.

### 1.4 The confidence boundary (Phase 4, invariant A5)

`AttentionLevel` and `EvidenceConfidence` share no values, no rank map and no module. The new test suite enforces this **at compile time** (`Extract<AttentionLevel, EvidenceConfidence> extends never` — the test file stops compiling if the unions ever overlap) **and at run time** (value-set disjointness), and asserts the evidence gate's `under-review ⇒ non-renderable` rule still stands upstream of any attention ordering. Attention orders only what the evidence gate has already permitted; neither axis can launder the other.

### 1.5 Client type widening

The two client hooks that typed `priority` locally (`use-food-opportunities.ts`, `use-companion-observations.ts`) now import `AttentionLevel` from `@shared/attention` — one vocabulary on both sides of the API. No client component branches on priority values (verified by grep), so the new `"critical"` value flows through rendering unchanged.

### 1.6 What was deliberately NOT built (approved §9 answers)

- **No value rename** (Q2 — Phase 5 deferred indefinitely, as recommended).
- **`upfSensitivity` does not modulate attention** (Q3 — caution has no sourced rule yet; wiring it in would infer guidance the platform cannot source, Principle 6).
- **No pantry-expiry / shopping-urgency signal** (Q4 — a product gap, not an architecture gap; if ever built it enters as `high`, never `critical`).
- **No user-facing attention affordance** (Q5 — a presentation change owned by the Companion Card principle, requiring its own review). `ATTENTION_LABELS` exists so that change needs no vocabulary work when approved.
- **Phase 7 surface extensions** (Comparison / Food Report / Planner) — out of ATTN1's implementation scope; see Scope Lock.

---

## 2. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity keys touched. Opportunities keep their existing item-scoped ids
  (`shopping-restriction-conflict:${item.id}`, namespaced by capability in OD1).

☑ One owner per fact
  The attention vocabulary now has exactly ONE owner: shared/attention/index.ts.
  Before ATTN1 it had three (FI4, OD1, Notice Engine — verbatim copies that could
  never legitimately disagree). opportunity_deliveries.priority remains a declared
  non-authoritative snapshot (schema.ts comment unchanged).

☑ No duplicate entities
  No new entity. A reference vocabulary is not an entity; it sits beside the spine
  (Principle 5), exactly as shared/restrictions and the diet enums already do.

☑ No duplicate ownership
  The reverse: three owners collapsed to one. No attribute gained a second owner.

☑ No duplicate state
  No user state touched. mutedOpportunityTypes stays in user_preferences with its
  one existing reader path; delivery lifecycle stays in opportunity_deliveries.

☑ Extends existing architecture
  Extends the Principle-5 reference-vocabulary pattern (restriction library, diet
  enums) and the existing FI4→OD1→Notice pipeline. The three sort functions and
  their deliberate layer-independence are untouched.

☑ Progressive enrichment where appropriate
  Not a knowledge entity — no enrichment pipeline applies. No transactional state
  gained enrichment.

☑ Honest gaps over fabricated information
  A producer that violates the critical allowlist degrades to an honest empty
  batch, never a partially-trusted one. Rule E1 (no citation, no card) is
  unchanged — critical is not a licence to assert uncited (tested).

☑ No permanent synchronisation bridge
  One vocabulary consumed by three layers; no two stores of the same fact are
  kept in sync. Nothing to bridge.

☑ Evolution over replacement
  The three retired unions/rank maps are named above, and were deleted in this
  changeset (retirement condition met: all three modules import the shared
  vocabulary; no module declares a local priority union or rank map — verified
  by grep). SoT Register updated (Rule 7).
```

### AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform  — OD1's producer fetch still goes
  through intelligencePlatform.handle(); no new path.
✓ Uses the Capability Registry              — no capability added, removed or
  modified; capability count unchanged (asserted by existing suites).
✓ Uses the Intent Engine                    — no new verb; report/review/approve/
  delete untouched.
✓ Reuses existing business services         — the critical emitter reuses the
  exact Rule T0 restriction matcher (resolveIngredientRestrictions), as before.
✓ Does not create another assistant         — no.
✓ Does not duplicate conversation state     — no; Notices remain unpersisted.
✓ Uses registered capabilities only         — yes; producer registration
  (OPPORTUNITY_SOURCES) unchanged.
✓ Uses permission-aware access              — unchanged; caller's own userId only.
✓ Produces honest gaps rather than fabricated knowledge — A2 violations and
  producer failures degrade to honest empty bundles (tested).
```

---

## 3. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Attention (cross-cutting Intelligence vocabulary)
Declared SoT: shared/attention/index.ts (NEW — reference vocabulary, no DB table)
New store created? NO
  (A reference vocabulary is not a knowledge store: no table, no rows, no owner
   of user or knowledge data. Governance Rule 8 review therefore not triggered;
   CRITICAL_TYPES membership changes are nonetheless flagged as requiring
   governance review, per invariant A2.)
Existing store extended? NO
  (opportunity_deliveries is untouched: same columns, same writer, same
   snapshot semantics. New rows for restriction conflicts now carry the string
   "critical" in the priority column — see Data Impact.)
Consumer created? YES — FI4, OD1, Notice Engine, and two client hooks now
  consume shared/attention.
  Reads from declared SoT? YES — all five import from shared/attention directly
  (server via the intelligence barrel or module imports, client via @shared).
```

---

## 4. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Attention (importance vocabulary across Intelligence surfaces)

Current Canonical Owner:
  shared/attention/index.ts (AttentionLevel, ATTENTION_RANK, ATTENTION_LABELS,
  CRITICAL_TYPES) — registered in the SoT Register Appendix A this workstream.

Current Runtime Consumer(s):
  FI4 opportunity-engine.ts, OD1 framework.ts, Notice Engine notice-engine.ts,
  server/intelligence/index.ts (barrel re-export),
  client use-food-opportunities.ts, client use-companion-observations.ts.

Duplicate Owners Remaining:
  NONE — the three module-local unions and three rank maps were deleted in this
  changeset (grep-verified: no declaration of FoodOpportunityPriority,
  OpportunityPriority, NoticePriority or PRIORITY_RANK remains outside comments).

Duplicate State Remaining:
  NONE — attention was never owned by a store; opportunity_deliveries.priority
  remains a declared non-authoritative snapshot.

Duplicate Workflows Remaining:
  Three sort functions (FI4, OD1, Notice Engine) remain deliberately independent
  — recorded as intentional layer-independence by the Notice Engine architecture
  (:191), NOT duplication of the vocabulary. All three now rank via the one
  ATTENTION_RANK.

Current Convergence (%):
  100% — 3 of 3 unions retired, 3 of 3 rank maps retired, 2 of 2 client-side
  inline unions replaced with the shared type. Evidence: the grep above and the
  §6 subtraction table of the investigation, realised.

Target Convergence (%):
  100%

Next Planned Milestone:
  ATTN1 §7 Phase 7 (optional, separate approval): express COMP1's T0 rung-1 as
  critical in the shared vocabulary; attach critical to allergen facts in Food
  Report. Not started — see Scope Lock.

Remaining Architectural Risks:
  R1 attention inflation — mitigated structurally (closed allowlist + runtime
  assertion + governance-review requirement documented in the module header).
  R5 attention/confidence conflation — mitigated by the compile-time + runtime
  disjointness guard in test-attn1-attention-platform.ts.
```

---

## 5. DEFINITION OF DONE

**Success looks like (all verified — see Manual Verification):**
- One `AttentionLevel` vocabulary, one rank map, zero module-local copies.
- A hard-restriction shopping conflict is `critical`, survives type muting, survives the delivery clamp, fills the notice budget first, and outranks unseen trivia even after acknowledgement.
- A non-allowlisted `critical` can never surface.
- Per-instance dismissal still works, and a new conflicting item re-surfaces.
- With no `critical` in play, every ordering is byte-identical to before ATTN1.

**What must not break (all green):**
- The full FI4 / OD1 / Notice Engine / COACH1 / LEARN1 / context-composition / behaviour-decision suites.
- The pre-existing `npx tsc --noEmit` error baseline (192 pre-existing errors in untouched files; zero errors in any ATTN1-touched file — verified identical against the pre-implementation snapshot).

**Manual test steps:** §7 below.

---

## 6. DATA IMPACT

- Reads existing data: **YES** (unchanged reads: shopping list, restrictions, preferences, delivery records).
- Writes new data: **YES** — new `opportunity_deliveries` rows for restriction conflicts now snapshot `priority = "critical"` instead of `"high"`. Same column, same writer, same semantics.
- Changes meaning of existing data: **NO** — rows written before ATTN1 hold `"high"` for restriction conflicts; the column is a declared dedupe/resolve snapshot and **no code branches on its value** (re-verified this session: its only reads are the dedupe map and the Evidence context copy).
- Requires backfill: **NO** — per the investigation's Phase 3 data-impact note, a backfill would be optional cosmetic hygiene, not correctness. None was performed.

---

## 7. MANUAL VERIFICATION

### Automated (database-free), all green

```
npx tsx server/tests/test-attn1-attention-platform.ts          → 29 passed, 0 failed  (NEW suite)
npx tsx server/tests/test-intelligence-food-opportunity-binding.ts → 40 passed, 0 failed
npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts → 50 passed, 0 failed
npx tsx server/tests/test-intelligence-notice-engine.ts        → 46 passed, 0 failed
npx tsx server/tests/test-coach1-proactive-coaching.ts         → 71 passed, 0 failed
npx tsx server/tests/test-learn1-household-learning.ts         → 72 passed, 0 failed
npx tsx server/tests/test-intelligence-context-composition.ts  → 161 passed, 0 failed
npx tsx server/tests/test-intelligence-behaviour-decision.ts   → 115 passed, 0 failed
npx tsx server/tests/test-intelligence-food-intelligence-binding.ts → 36 passed, 0 failed
```

The new suite covers the investigation's mandatory Phase-3 verification list one-for-one:
1. a muted `shopping-restriction-conflict` still surfaces ✓ (pure + end-to-end through `collectOpportunities` with the real in-memory store)
2. a `critical` surfaces when 10+ `high` items are eligible (clamp exemption) ✓
3. a `critical` surfaces when 2 `high` notices precede it (budget reservation) ✓
4. an acknowledged `critical` outranks an unseen `high` (F4) ✓
5. a non-allowlisted type emitting `critical` throws ✓ (direct) and its batch degrades honestly ✓ (end-to-end)
6. per-instance dismiss suppresses that instance; a new item id re-surfaces ✓

Plus the Phase-2 golden-identity gate (no-critical inputs order exactly as before, in both OD1 and the Silence Rules) and the Phase-4 confidence boundary (compile-time + runtime disjointness).

### Hand verification of the live emitter

`identifyShoppingRestrictionOpportunities` invoked with a real `RestrictionDefinition` (tree nut) against an unchecked "Walnuts" shopping item returns `priority: "critical"` with both evidence entries intact — asserted in §3 of the new suite using the same fixture shape as the FI4 binding suite.

### Typecheck

`npx tsc --noEmit`: 192 errors, **all pre-existing** in files ATTN1 never touched (benchmark scripts, discovery ports, uplift test — verified present in the pre-ATTN1 snapshot). Zero errors reference `shared/attention`, the three engines, the barrel, or the client hooks.

---

## 8. TRUST CHECK

- **Could this mislead the user?** No. `critical` attaches only to a fact the platform already stores and already surfaced (an active hard restriction conflicting with the household's own shopping list). Content, explanation and evidence strings are unchanged.
- **Could this fabricate certainty?** No. Attention is orthogonal to Evidence Confidence by construction (A5, enforced by a compile-time guard), and the evidence gate still runs first. Rule E1 is untouched — an uncited opportunity is still dropped, even at `critical`.
- **Is anything guessed but shown as real?** No. The one `critical` emitter requires an active, stored household restriction and a real shopping-list row; there is no inferred or predictive path to `critical` (and the closed allowlist prevents one being added quietly).
- **What happens if the system is wrong?** A false-positive conflict was already possible pre-ATTN1 (same matcher, same data); ATTN1 changes only its prominence. The household retains per-instance dismissal — the informed act — while losing only blind whole-class muting of the safety type.
- No architectural duplication introduced: **YES** (three duplications removed).
- No new source of truth created: **YES** — a reference vocabulary, registered, with no data ownership.
- No runtime behaviour altered *(governance-only work)*: **N/A** — this is a behavioural workstream; the one intended change is documented above and everything else is verified byte-identical by the golden-identity tests.

---

## 9. ROLLBACK PLAN

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-attn1-attention-platform-20260709` → `f0ab371033fbf221830da0dabe348d60211cd47c` |
| Dirty-tree snapshot branch | `snapshot/attn1-pre-implementation-20260709` → `dac9d660cf9dbd72dceea08ffedcb8176485074e` |

**Files modified by ATTN1 (the complete set, verified via `git diff snapshot/attn1-pre-implementation-20260709 --stat`):**

- `shared/attention/index.ts` — NEW (the vocabulary)
- `server/intelligence/food-intelligence/opportunity-engine.ts`
- `server/intelligence/opportunity-delivery/framework.ts`
- `server/intelligence/conversation/notice-engine.ts`
- `server/intelligence/index.ts` (barrel re-exports)
- `client/src/hooks/use-food-opportunities.ts`
- `client/src/hooks/use-companion-observations.ts`
- `server/tests/test-attn1-attention-platform.ts` — NEW (29-assertion suite)
- `server/tests/test-intelligence-food-opportunity-binding.ts` (one assertion: high → critical)
- `package.json` (test script registration)
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (one Appendix-A row)
- `docs/implementation/ATTN1_ATTENTION_PLATFORM.md` — NEW (this document)

**Rollback commands (working tree is shared with prior uncommitted workstreams — use the file-scoped restore, not a branch checkout):**

```bash
# Restore every ATTN1-touched pre-existing file to its exact pre-ATTN1 state:
git checkout snapshot/attn1-pre-implementation-20260709 -- \
  server/intelligence/food-intelligence/opportunity-engine.ts \
  server/intelligence/opportunity-delivery/framework.ts \
  server/intelligence/conversation/notice-engine.ts \
  server/intelligence/index.ts \
  client/src/hooks/use-food-opportunities.ts \
  client/src/hooks/use-companion-observations.ts \
  server/tests/test-intelligence-food-opportunity-binding.ts \
  package.json \
  docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md

# Remove the files ATTN1 created:
rm -rf shared/attention
rm server/tests/test-attn1-attention-platform.ts
rm docs/implementation/ATTN1_ATTENTION_PLATFORM.md
```

**No schema change to unwind. No backfill to reverse.** Any `opportunity_deliveries` rows written with `priority = "critical"` between deploy and rollback are harmless post-rollback: the column is a non-authoritative snapshot and no code branches on its value.

**Verification after rollback:** `npx tsx server/tests/test-intelligence-food-opportunity-binding.ts && npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts && npx tsx server/tests/test-intelligence-notice-engine.ts` — all green; `grep -r "shared/attention" server client/src` returns nothing.

---

## 10. SCOPE LOCK

**Implemented scope (ATTN1 only):**
- Phases 1–4 and 6 of the approved roadmap: the vocabulary, adoption by all three modules, `critical` + its A2 assertion + its A3 exemptions, the A5 confidence boundary guard, and retirement of the three predecessors (with SoT Register update).
- The §9 open questions resolved exactly as the investigation recommended: dismiss retained (Q1), no value rename (Q2), `upfSensitivity` out (Q3), expiry out (Q4), no UI affordance (Q5).

**Explicitly excluded scope (NOT done):**
- Phase 5 (value rename) — deferred indefinitely, per recommendation; the decision is now explicit, not accidental.
- Phase 7 (Comparison / Food Report / Planner / Shopping surface extensions) — each needs its own approval; none was touched.
- Any backfill of pre-ATTN1 `opportunity_deliveries.priority` snapshots — declared optional cosmetics by the investigation; not performed.
- Any user-facing copy explaining why a critical cannot be muted (risk R2) — presentation work owned by the Companion Card principle.

**One deliberate interpretation, recorded:** the investigation's Phase-3 exemption list named OD1's `prioritiseAndGroup`, `filterMutedTypes` and `applySilenceRules`. FI4's own `prioritizeOpportunities` contains the *same* clamp one layer earlier; leaving it clampable would have left one path where a cap could still drop a critical, contradicting invariant A3's stated intent ("exempt from the delivery clamp"). The identical three-line exemption was therefore mirrored there, and is covered by the new suite (§3).

SUGGESTION (out of scope, do not implement without approval): the notice `id` for opportunities (`opportunity:${id}`) and the delivery id are the natural place a future surface could badge `ATTENTION_LABELS[priority]`; when Q5 is ever approved, no vocabulary work will be needed.

---

*Implementation of ATTN1 only. Scope lock honoured. No second priority system exists: one vocabulary, one owner, Evidence → Attention → Selection → Presentation, `critical` non-overridable, Attention ⊥ Evidence Confidence.*
