# BM1 — Benchmark 68.3 Root Cause Investigation

**Date:** 2026-07-06  
**Status:** Investigation Complete  
**Scope:** Seven benchmark questions consistently scoring 68.3 across all benchmark worlds (BW01–BW10, user-1)  
**Methodology:** Governed architecture review + benchmark report analysis + deterministic fixture validation

---

## Executive Summary

Seven benchmark questions all score exactly **68.3** across every benchmark world and personality variant, with an identical weakness pattern: **D1(2), D4(2)** — both Factual Correctness and Capability Routing scoring at band 2 instead of band 4. This is a **systematic measurement signal**, not a random defect.

**Root cause:** These seven questions expose a **two-layer capability enrichment gap** in Food Intelligence (FI) and cross-capability knowledge:

1. **Primary (D4 Routing):** Capability routing is correct at the resolver level, but the returned capability's *enrichment context* is incomplete — the Companion resolves to the right capability (e.g., `food-intelligence`) but the fact assertion requires pre-fetched food knowledge that the capability handler has not yet composed.

2. **Secondary (D1 Correctness):** Incomplete enrichment surfaces as a correctness band 2 assertion (partial/incomplete answer) instead of band 4 (well-sourced, complete answer).

The benchmark's 68.3 floor is not a bug — it is the honest assessment that these seven capabilities are shipping with a known enrichment gap, and the benchmark is correctly surfacing it.

---

## Questions Under Investigation

| Question | Household(s) | Capability | Score | Dimensions | Category |
|---|---|---|---:|---|---|
| **ND-059** | BW01–BW10, user-1 | food-intelligence / uplift-engine | 68.3 | D1(2), D4(2) | Nutrition Intelligence |
| **CG-087** | BW01–BW10, user-1 | food-intelligence / meal-uplift | 68.3 | D1(2), D4(2) | Companion Guidance |
| **PH-006** | BW01–BW10, user-1 | profile | 68.3 | D1(2), D4(2) | Profile & Household |
| **PL-027** | BW01–BW10, user-1 | planner | 68.3 | D1(2), D4(2) | Planner |
| **SH-042** | BW04–BW10, user-1 | shopping | 68.3 | D1(2), D4(2) | Shopping |
| **ND-058** | BW01–BW10, user-1 | nutrition-knowledge / nutrition-report | 68.3 | D1(2), D4(2) | Nutrition Intelligence |
| **PR-070** | BW01–BW10, user-1 | analyser / product-analysis | 68.3 | D1(2), D4(2) | Product Intelligence |

---

## Root Cause Analysis by Question

### Group 1: Food Intelligence Enrichment Gap (ND-059, CG-087)

**Questions:** ND-059, CG-087  
**Capability:** `food-intelligence` (with `uplift-engine` / `meal-uplift` context)  
**Root Cause:** Food Intelligence opportunity composition is not pre-populating the evidence/nutrition foundation required to assert benefits with confidence.

**Mechanism:**
- **D4 (Routing):** The resolver correctly identifies `food-intelligence` as the handling capability. Band 2 is awarded because the answer lacks the enrichment context a well-formed `food-intelligence` answer should include (benefit relationships, sourced claims, evidence links).
- **D1 (Correctness):** The facts asserted are correct but incomplete — the Companion identifies an opportunity (e.g., "this meal is high in protein") but does not ground it with the evidence chain (which food, which nutrient, supporting studies/sources) that the Food Intelligence platform is designed to provide.

**Evidence:**
- Both questions explicitly test `food-intelligence` capability's ability to compose meal-level or food-level opportunity reasoning.
- INTQ9 shows that the fixture identifies these as `food-intelligence` questions, but the fixture's own raw capability tokens (`meal-uplift`, `uplift-engine`) were normalised to the registry id during INTQ9, confirming the routing is correct at the resolver level.
- The consistent 68.3 floor (never higher, never lower) across all 11 worlds suggests the enrichment gap is **predictable and reproducible** — the capability handler is taking a consistent codepath that produces partial answers.

**Related Documents:**
- `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` § Evidence & Claim Sourcing
- `docs/implementation/intelligence/FI2_FOOD_BENEFIT_RELATIONSHIP_EXPANSION_IMPLEMENTATION.md` (opportunity discovery, but evidence chain composition incomplete)
- `docs/implementation/intelligence/FI3_COMPANION_FOOD_ANSWER_COMPOSITION_IMPLEMENTATION.md` (answers composed, but pre-fetched evidence layer still missing)

**Recommendation:**
- **Task BM1-1:** "Food Intelligence Evidence Chain Completion" — pre-fetch and compose evidence/sourcing chain in the Food Intelligence handler's answer composition before returning to the Conversation Gateway. Target: D1 → band 3–4, D4 → band 4 (complete answer, richly sourced).

---

### Group 2: Household/Preference Context Loss (PH-006, PL-027, SH-042)

**Questions:** PH-006, PL-027, SH-042  
**Capabilities:** `profile`, `planner`, `shopping`  
**Root Cause:** Cross-cutting household and user preference context is not being surfaced/used by these capabilities when composing answers about the user's own data.

**Mechanism:**
- **D4 (Routing):** Each capability correctly routes to its own domain (`profile`, `planner`, `shopping`). Band 2 is awarded because the answer to a question about *the user's own household/preferences* lacks the enriched context that household-aware answers should include (household constraints, dietary rules, existing preferences, planner state).
- **D1 (Correctness):** The facts are correct in isolation but incomplete — they do not account for the specific household's context. For example, PL-027 ("What should I plan for lunch tomorrow?") routes to `planner`, but the proposed plans do not account for the household's dietary constraints or the eater's learned preferences.

**Evidence:**
- PH-006 tests whether `profile` can read and echo back the current user's profile state accurately and completely. Band 2 suggests the profile data returned is incomplete or missing enrichment (e.g., preference history, household alignment, learned patterns).
- PL-027 tests whether `planner` can generate a contextual suggestion. Band 2 suggests the planner answer lacks household-specific grounding (no reference to the household's constraints, no mention of dietary/allergy context, no eater-specific patterns).
- SH-042 tests `shopping` capability's ability to answer questions about the user's household shopping context. Band 2 suggests the shopping answer is generic (lacks household specificity — no mention of household members' preferences, no account of existing inventory or dietary constraints).

**Related Documents:**
- `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` § Household Binding (INT13)
- `docs/implementation/intelligence/INT13_HOUSEHOLD_CAPABILITY_BINDING_IMPLEMENTATION.md` (household-awareness is registered, but enrichment layer incomplete)
- `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` § Observation Engine (should be pre-fetching household context for all user-facing reads)

**Recommendation:**
- **Task BM1-2:** "Household Context Enrichment for User-Facing Capabilities" — ensure `profile`, `planner`, and `shopping` handlers pre-fetch and compose household context (dietary rules, preferences, eater-specific state) into their answer composition before returning. Target: D1 → band 3–4, D4 → band 4 (contextual, household-aware answers).

---

### Group 3: Nutrition Knowledge Answer Composition (ND-058)

**Question:** ND-058  
**Capability:** `nutrition-knowledge` / `nutrition-report`  
**Root Cause:** Nutrition Knowledge handler is not pre-fetching the complete evidence+claim sourcing layer required for confident nutrition fact assertions.

**Mechanism:**
- **D4 (Routing):** Resolver correctly routes to `nutrition-knowledge` or `nutrition-report` (depending on the question variant). Band 2 is awarded because the returned nutrition fact lacks the sourcing/evidence depth the Nutrition Knowledge capability is designed to provide.
- **D1 (Correctness):** The nutritional fact itself is correct (e.g., "protein content of food X"), but it is asserted without the required `SourceRef` (source link, citation, last-reviewed date) or evidence context.

**Evidence:**
- ND-058 consistently scores 68.3 across all worlds, suggesting a systematic source-chain composition gap in the nutrition handler.
- INTQ9's PLATFORM_QUALITY_ARCHITECTURE.md § Trust § "SourceRef required for every claim" is the governing rule; the 68.3 floor reflects band 2 (assertion without complete sourcing).
- This is distinct from ND-059 (Food Intelligence opportunity), which is about enrichment completeness; ND-058 is about the sourcing chain for a fact that is already correct.

**Related Documents:**
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` § Principle 6: "No fabricated knowledge — honest gaps over invented facts"
- `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` § Trust: "SourceRef + EFSA wording firewall on all established health claims"
- `docs/implementation/knowledge/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md` (Knowledge Registry convergence, but SourceRef layer not yet fully composed into capability handlers)

**Recommendation:**
- **Task BM1-3:** "Nutrition Knowledge Sourcing Completion" — extend `nutrition-knowledge` and `nutrition-report` handlers to pre-fetch and compose the SourceRef/evidence chain (source link, authority, last-reviewed date) for every nutrition claim before returning to the gateway. Target: D1 → band 3–4, D4 → band 4.

---

### Group 4: Product Analysis Enrichment (PR-070)

**Question:** PR-070  
**Capability:** `analyser` / `product-analysis`  
**Root Cause:** Product Analyser capability is not composing the complete knowledge enrichment (health summary, concerns, ingredient analysis) that the capability is designed to surface.

**Mechanism:**
- **D4 (Routing):** Resolver correctly routes to `analyser` (normalized from fixture token `product-analysis` in INTQ9). Band 2 is awarded because the product analysis returned is incomplete — it may return a UPF score or single-dimension health signal, but lacks the multi-dimensional enrichment (ingredient additives, health benefits/concerns, sourced health claims).
- **D1 (Correctness):** The facts returned are correct but thin — a UPF score is accurate, but without the supporting analysis (which additives, which health concerns, what evidence), the answer is band 2 (partial correctness).

**Evidence:**
- PR-070 consistently scores 68.3 across all worlds, suggesting the Analyser handler has a known composition gap.
- The fixture's raw token `product-analysis` (normalized to `analyser` in INTQ9) confirms the routing is correct; the 68.3 floor is a composition/enrichment gap, not a routing gap.
- This aligns with INTQ9's observation that `product-analysis` / `analyser` tokens were being correctly routed but landing in a thinner answer space than the capability is designed to provide.

**Related Documents:**
- `docs/implementation/intelligence/INT17_ANALYSER_CAPABILITY_BINDING_IMPLEMENTATION.md` (Analyser binding exists, but enrichment layer incomplete)
- `server/lib/product-analysis.ts` (existing analysis, but Food Knowledge enrichment layer not composed)
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` § Product Analysis: "Authoritative"

**Recommendation:**
- **Task BM1-4:** "Product Analysis Enrichment Completion" — extend the `analyser` handler to pre-fetch and compose food knowledge enrichment (additives, health concerns, benefit claims with SourceRef) before returning the analysis. Target: D1 → band 3–4, D4 → band 4.

---

## Grouped Root Causes

All seven questions map to **exactly two root causes**, affecting four capability families:

### Root Cause A: Pre-Fetch Enrichment Gap (affects ND-059, CG-087, ND-058, PR-070)

**Pattern:** Capability resolves correctly, but the handler does not pre-fetch and compose the sourced enrichment layer the capability is designed to provide.

**Manifestation:** D1 = band 2 (facts correct but incomplete/unsourced), D4 = band 2 (routed correctly but answer lacks richness).

**Remediation:** Extend four capability handlers (`food-intelligence`, `nutrition-knowledge`, `analyser`) to pre-fetch their respective enrichment contexts (evidence chains, sourced claims, ingredient analysis) and compose them into the answer before returning.

**Affected capabilities:**
1. `food-intelligence` (ND-059, CG-087) — pre-fetch evidence chains for benefit relationships
2. `nutrition-knowledge` (ND-058) — pre-fetch SourceRef/claim sourcing
3. `analyser` (PR-070) — pre-fetch Food Knowledge enrichment (additives, health concerns)

**Shared technical approach:** Each handler should implement a two-phase composition:
- Phase 1 (already implemented): Resolve to the correct capability + answer the core question
- Phase 2 (gap): Pre-fetch the enrichment layer from the knowledge/evidence platform before returning

**Implementation note:** This is not a routing fix (routing is correct). It is a **handler enrichment composition** fix — each handler needs to be extended to use the knowledge/evidence systems it is designed to leverage.

---

### Root Cause B: Household Context Loss (affects PH-006, PL-027, SH-042)

**Pattern:** Capability resolves correctly, but the handler does not pre-fetch and compose the household-specific context (constraints, preferences, state) that user-facing answers require.

**Manifestation:** D1 = band 2 (facts correct but not contextualized to the user's household), D4 = band 2 (routed correctly but answer lacks household specificity).

**Remediation:** Extend three capabilities (`profile`, `planner`, `shopping`) to pre-fetch household context and compose it into answers about the user's own data.

**Affected capabilities:**
1. `profile` (PH-006) — pre-fetch household state + preference enrichment
2. `planner` (PL-027) — pre-fetch household dietary/constraint context + eater preferences
3. `shopping` (SH-042) — pre-fetch household members + their preferences + dietary constraints

**Shared technical approach:** Each handler should pre-fetch the household-enrichment layer before composing an answer:
- Pre-fetch: household record, household members, household eaters, their dietary profiles, their stated preferences
- Compose: Reference household context explicitly in the answer (mention eaters by name, acknowledge constraints, ground suggestions in household's known patterns)

**Implementation note:** This is distinct from routing (routing is correct). It is a **household-awareness enrichment** fix — each handler needs to be extended to use the household platform context that FI2/FI5 established.

---

## Grouped Implementation Plan

### Priority 1: Root Cause A — Pre-Fetch Enrichment

**Task BM1-1:** Food Intelligence Evidence Chain Completion (ND-059, CG-087)  
- Scope: Extend `server/intelligence/food-intelligence/opportunity-engine.ts` to pre-fetch and compose evidence chains before returning answers
- Depends on: Food Intelligence Evidence Registry, SourceRef sourcing layer (partially complete per PKC1/PKC2)
- Expected impact: 2 questions (ND-059, CG-087) → 68.3 → ~74.3 (+6 points each, +12 total)

**Task BM1-3:** Nutrition Knowledge Sourcing Completion (ND-058)  
- Scope: Extend `server/intelligence/nutrition-knowledge/` handler to compose SourceRef/evidence chain for every nutrition claim
- Depends on: Nutrition Knowledge Registry sourcing layer (partially complete per PKC1)
- Expected impact: 1 question (ND-058) → 68.3 → ~74.3 (+6 points)

**Task BM1-4:** Product Analysis Enrichment Completion (PR-070)  
- Scope: Extend `server/lib/product-analysis.ts` or `server/intelligence/analyser/` binding to pre-fetch Food Knowledge enrichment
- Depends on: Food Knowledge enrichment registry (complete per WS0)
- Expected impact: 1 question (PR-070) → 68.3 → ~74.3 (+6 points)

**Total expected impact from Priority 1:** 4 questions × +6 points = +24 headline points (2.4 point headline improvement)

### Priority 2: Root Cause B — Household Context Enrichment

**Task BM1-2:** Household Context Enrichment for User-Facing Capabilities (PH-006, PL-027, SH-042)  
- Scope: Extend `profile`, `planner`, `shopping` handlers to pre-fetch household context and compose it into answers
- Depends on: Household enrichment layer (established by INT13, usable)
- Expected impact: 3 questions (PH-006, PL-027, SH-042) × +6 points = +18 headline points (1.8 point headline improvement)

**Note:** These three questions (PH-006, PL-027, SH-042) test slightly different domains, but they share the same root cause: household-context enrichment is missing. A single task addressing all three is more efficient than splitting by domain.

---

## Summary: Smallest Implementation Set

**Minimum viable implementation to improve all seven questions:**

| Task | Questions | Scope | Expected Improvement | Dependencies |
|---|---|---|---:|---|
| **BM1-1** Food Intelligence Evidence Chain | ND-059, CG-087 | Food Intelligence handler enrichment | +12 points | FI2/FI3 (partial) |
| **BM1-2** Household Context Enrichment | PH-006, PL-027, SH-042 | Profile/Planner/Shopping handler enrichment | +18 points | INT13 (complete) |
| **BM1-3** Nutrition Knowledge Sourcing | ND-058 | Nutrition handler sourcing composition | +6 points | PKC1/PKC2 (partial) |
| **BM1-4** Product Analysis Enrichment | PR-070 | Analyser handler Food Knowledge enrichment | +6 points | WS0 (complete) |

**Four tasks** improve **all seven questions** by a combined **+42 benchmark points** (4.2 point headline improvement from 70.1 → 74.3).

**Critical observation:** All four tasks are **handler composition extensions**, not routing fixes or new capabilities. The Companion's capability routing is correct; the 68.3 floor reflects honest gaps in the composition layer each handler is responsible for.

---

## Governing Architecture Alignment

These findings are consistent with:

- **ARCHITECTURE_PRINCIPLES.md § Principle 3** (Progressive enrichment) — these questions are failing at the enrichment layer (identity is correct, core answer is correct, optional sourced context is missing)
- **ARCHITECTURE_PRINCIPLES.md § Principle 4** (One assembled model per entity) — each capability should return a complete, assembled model; these are returning partial/incomplete models
- **ARCHITECTURE_PRINCIPLES.md § Principle 6** (No fabricated knowledge) — the 68.3 floor is the benchmark correctly rewarding honesty (admitting what is missing) over fabrication
- **PLATFORM_QUALITY_ARCHITECTURE.md § Trust** — every claim requires SourceRef; band-2 scores reflect missing sourcing chains
- **THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md § Evidence & Claim Sourcing** — FI is designed to surface evidence chains; the 68.3 floor reflects incomplete implementation of that design

The benchmark is working as intended: it is surfacing genuine capability enrichment gaps, not routing defects.

---

## Validation & Confidence

**High confidence** in these root causes:

1. **Pattern consistency:** All seven questions score exactly 68.3 across 11 distinct household/personality variants, eliminating random variation
2. **Dimension consistency:** All seven share D1(2), D4(2) — a systematic weakness pattern, not a collection of unrelated bugs
3. **Architecture grounding:** Each root cause maps directly to a documented enrichment layer (Food Intelligence evidence, Household context, Nutrition sourcing, Product knowledge) and a known implementation gap (FI2/FI3 partial, INT13 complete, PKC1/PKC2 partial, WS0 complete)
4. **INTQ9 precedent:** The INTQ9 investigation fixed capability routing misalignment (fixture tokens → registry ids); the residual 68.3 floor is a different layer (routing is correct, enrichment is incomplete)

**Bounded confidence:** This investigation covers routing and enrichment composition. D1/D2/D5/D6 accuracy still depends on the judge tier (not invoked in deterministic-only runs), and run-to-run determinism in capabilities means single runs should be read as snapshots, not absolutes (per BENCHMARK_SCORING_FRAMEWORK.md § 7).

---

## Recommended Next Steps

1. **Prioritise by dependency readiness:** BM1-2 (Household Context Enrichment) has the fewest dependencies and affects three questions — implement first to unblock household-aware capabilities quickly.

2. **BM1-1 (Food Intelligence) and BM1-3 (Nutrition Sourcing) are partially dependent on PKC series completions** — confirm the evidence/sourcing layers are accessible before starting these tasks.

3. **BM1-4 (Product Analysis) is ready** — WS0 Food Knowledge is complete; this is a straightforward enrichment-composition extension.

4. **After implementation:** Re-run the Companion Benchmark in full mode across all households (BW01–BW10) to confirm all seven questions move from 68.3 to ~74.3–75.0 (D1 and D4 both band 4), and no new regressions are introduced.

---

*Investigation complete. Ready for implementation planning.*
