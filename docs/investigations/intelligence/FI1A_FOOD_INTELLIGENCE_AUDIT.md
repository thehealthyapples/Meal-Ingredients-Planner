# FI1A — Food Intelligence Audit

**Date:** 2026-07-06  
**Author:** Architecture audit (Claude Code)  
**Branch:** `int1-intelligence-platform`  
**Status:** Investigation — READ-ONLY audit, no code changes  
**Scope:** Determine current FI state, ownership, consumers, knowledge available, gaps, and whether benchmark weaknesses are from missing knowledge or missing routing.

---

## EXECUTIVE SUMMARY

Food Intelligence is a **materialised Domain Intelligence layer**, not a vision. **FI3/FI4** (Engine + Opportunity) are **production-live today**, bound as the 19th Intelligence Platform capability with three executable verbs. The Evidence & Learning Platform (EL1) backing Plane 2 personalisation is also live.

**The audit finds:**
- ✅ **Architecture is coherent** — three-layer separation enforced, Rule FI1 (enrich-never-own) respected, Port→Handler→Binding pattern proven
- ✅ **Plane 1 (Canonical Knowledge)** — read-only, single-owner, curated, evidence-gated via existing Food Report infrastructure  
- ✅ **Plane 2 (Personal Intelligence)** — Event Log built (EL1), storage tables exist, deterministic pattern detection works
- ✅ **Plane 3/4 (External Evidence / Generated Reasoning)** — architecture named, integration points clear, not yet exercised in the FI engine  
- 🟠 **Benchmark score 68.3/100 (FI-specific, n=2)** — roots traced to **missing household context resolution and incomplete routing logic**, not missing knowledge
- 🟡 **Routing gaps identified** — Intent Resolver does not yet route all food-intelligence intents to the FI handler; pattern-intent-resolver operates in parallel but incompletely integrated
- 🟡 **Opportunity prioritisation incomplete** — FI4 generators built and tested; prioritisation logic (FI7) not yet live in handler
- 🟡 **UI activation stalled** — Food Intelligence surfaces (Planner/Shopping/Pantry strips, Companion answers) have no visible integration points yet; knowledge exists but is not wired to surfaces

**The benchmark weakness is NOT a knowledge problem.** It is a **routing + context + surface-integration problem**. Plane 1 knowledge is solid; the issue is FI3/FI4 are correctly refusing to answer when household context is missing, and the Companion isn't yet wired to route food-discovery and food-benefit questions to FI.

---

## 1. CURRENT ARCHITECTURE STATE

### 1.1 The three-layer separation (FI1 §2) — ✅ ENFORCED

```
┌─────────────────────────────────────────┐
│ Intelligence Platform (19 capabilities) │ (one Gateway, registry, intent engine)
└──────────┬──────────────────────────────┘
           │ food-intelligence capability
           │ (recommend, explain, report verbs)
┌──────────▼──────────────────────────────┐
│ Food Intelligence (FI3/FI4)             │ (Domain Intelligence Layer)
│ • Engine (Plane 1+2 composition)        │ (this is live)
│ • Opportunity Engine (ambient hints)    │ (this is live, not yet wired)
│ • Evidence & Learning Platform (EL1)    │ (this is live, partial integration)
└──────────┬──────────────────────────────┘
           │ reads via existing Business Domain read ports
           │ writes via registered Business Domain capability intents
┌──────────▼──────────────────────────────┐
│ Business Domains (7 existing owners)    │
│ Planner, Shopping, Pantry, Meals,       │
│ Household, Diary, Kitchen (food KMS)    │
└─────────────────────────────────────────┘
```

**Compliance: PASS.** Every write from FI goes through a Business Domain's own capability intent (Rule FI1). No private write path exists. Every read goes through a Port (protocol pattern). FI3/FI4 own their own reasoning process; zero business-domain data is re-owned.

### 1.2 Plane 1 (Canonical Knowledge) — ✅ BUILT, SINGLE-OWNER

| Component | Owner | Status | Read path |
|---|---|---|---|
| **Food identity & overview** | `CANONICAL_SEED` (WS2A) | ✅ Live | `shared/canonical/foods.ts` → `resolveCanonicalFood()` |
| **Nutrients + composition** | `knowledge_*` tables (WS0) | ✅ Live | `nutrition-knowledge-registry.ts:getNutrientDetailView()` |
| **Health benefits (evidence-gated)** | `knowledge_*` + editorial review gate | ✅ Live | `nutrition-knowledge-registry.ts:getBenefitDetailView()` → `NUTRITION_CONTEXT` (shared/canonical/nutrition-context.ts) |
| **Diversity groups** | `DIVERSITY_GROUP_SEED` (WS2A) | ✅ Live | `shared/canonical/diversity-groups.ts` |
| **Restriction library** | `shared/restrictions/` | ✅ Live | `resolveActiveRestrictions()`, `resolveIngredientRestrictions()` |
| **Uplift rules (Simply Better)** | `server/lib/uplift-rules.ts` | ✅ Live | `matchUpliftRules()` → `UPLIFT_RULES` config |

**Contamination rule (G1) enforced:** Plane 1 is read-only. Household context never writes back into it. FI3 explicitly reads Plane 1 candidates and ranks them over Plane 2 context without modifying the list (see `rankAndExplain()` — pure function).

**Knowledge quality:** The Food Report (FI3 source of truth for benefits) uses `getEvidenceBackedFoodReport()` (WS0X.6C fix + PKC2 gating). Every benefit card the Food Report displays is the same evidence line FI3 cites. **The knowledge is coherent.**

### 1.3 Plane 2 (Personal Intelligence) — ✅ EVENT LOG BUILT, PATTERN DETECTION LIVE

| Component | Table | Status | Read path |
|---|---|---|---|
| **Personalisation events (append-only)** | `household_evidence_events` | ✅ Live (EL1) | `evidence-learning-store.ts:recordOutcomeAndDetect()` |
| **Derived signals (confirmed patterns)** | `household_learning_signals` | ✅ Live (EL1) | `evidence-learning-framework.ts:detectPatterns()` + store |
| **Household state (restrictions, eaters)** | `household_eaters`, `household_restrictions` | ✅ Live | `household-read-port.ts` → `enrichEater()` |
| **Planner history (familiarity)** | `planner_weeks`, `planner_days`, `planner_entries` | ✅ Live | `food-intelligence-assembler.ts:fetchHouseholdPlannerFoods()` |

**Pattern detection (EL1):** 
- Thresholds: `MIN_EVIDENCE_COUNT = 3`, `MIN_CONSISTENCY = 0.7`
- Confidence buckets: low (3–4 events), medium (5–7), high (8+)
- Rule enforced: no signal from single observation; every pattern requires explicit household confirmation before entering a preference store
- **Status: Deterministic, unit-tested, working as designed**

**Integration gap:** FI4's `identifyOpportunities()` reads confirmed learning signals via the evidence-learning read port, but **prioritisation (FI7) is not yet live** in the handler. The engine produces opportunities; the handler returns them unsorted. Venue for improvement: FI7's magnitude-based tie-breaking within priority tier.

### 1.4 Plane 3 (External Evidence) — ⚠️ ARCHITECTURE NAMED, NOT EXERCISED

| Source | Integration | Status |
|---|---|---|
| **USDA FDC** | Ingested via `food-intelligence-assembler.ts` references | ✅ Available (via existing Food Knowledge) |
| **Open Food Facts** | Referenced in KMS design; OFF API integrations exist elsewhere | 🟡 Not integrated into FI yet |
| **EFSA/NHS/NIH claims** | Hand-curated into `NUTRITION_CONTEXT` | ✅ Available (via Plane 1) |
| **Licensed recipe sources** | Not FI-owned; Cookbook owns | ✅ Available (via Meals capability) |
| **Future partner signals** | Signals Gateway (FI1 §6, Phase 3+) | ❌ Not built |

**Status:** Plane 3 as an *architectural concept* is clear. In practice, external evidence becomes Plane 1 only after editorial review (the KMS graduation gate). FI3 does not directly ingest or display external evidence in raw form — it uses only what the Food Report already shows (Rule FI1, no fabrication). This is **correct by design**, not a gap.

### 1.5 Plane 4 (Generated Reasoning) — ⚠️ ARCHITECTURE NAMED, MINIMAL EXERCISE

| Surface | Phrase generation | Status |
|---|---|---|
| **FI3 recommendation `explanation` field** | Deterministic string builder (no LLM) | ✅ Built |
| **FI4 opportunity `suggestedAction` field** | Deterministic string builder (no LLM) | ✅ Built |
| **Companion Food Intelligence answers** | Conversation Gateway + nutrition-enrichment.ts | 🟡 Partial (see §2.3) |

**Rule LT3 enforced:** Decision logic is never the LLM. Generated text always traces to deterministic output. FI3's `explanation` array is built from `citation` + `household context` + literal counts — no inference.

**Status:** Plane 4 is mostly absent from Food Intelligence today because the decision layer is pure. When the Companion renders an FI recommendation, it uses the cited, already-decided bundle; it never generates the recommendation itself. **This is correct.** The LLM is a *phrasings layer*, not a *decision layer*.

---

## 2. WHAT FOOD INTELLIGENCE OWNS & CONSUMES

### 2.1 Owner — Food Intelligence Engine & Opportunity Engine reasoning processes

| Asset | Owner | Scope |
|---|---|---|
| **Join + rank + explain logic** | FI3 (`server/intelligence/food-intelligence/engine.ts`) | Core reasoning: candidate ranking by citation + household context |
| **Opportunity generators** | FI4 (`opportunity-engine.ts`) | Five generators: planner-gaps, pantry-available, shopping-swaps, new-foods, diversity-groups |
| **Evidence & Learning events** | EL1 (`server/intelligence/evidence-learning/`) | Append-only event log + deterministic pattern detection |
| **FI→Capability intent bindings** | FI read handler (`handlers/food-intelligence-read-handler.ts`) | Route requests to engine/opportunities; return structured results |

FI3/FI4 own **exactly zero** business-domain data. No meals, no planner entries, no shopping lists, no household profiles — FI reads them all read-only.

### 2.2 Who consumes Food Intelligence

| Consumer | How | Status |
|---|---|---|
| **Companion (Conversation Gateway)** | Calls `food-intelligence:recommend` for nutrition-related user questions | 🟡 Partially wired (see §2.3 routing gaps) |
| **Intent Resolver (pattern matcher)** | Routes natural-language intents to FI verbs | 🟡 Incomplete (see §2.3) |
| **Opportunity Delivery framework** | Calls `food-intelligence:report` to gather ambient opportunities | ✅ Wired, but not surfaced in UI yet |
| **Benchmark suite** | Tests FI3/FI4 directly | ✅ Working (2 questions in benchmark) |

### 2.3 Routing gaps — why FI benchmark score is low

**The benchmark runs 100 questions. Only 2 route to Food Intelligence.**

**Root causes:**

1. **Intent Resolver incomplete for food discovery.** The Intent Resolver (`intent-resolver.ts`) has hardcoded rules for some nutrients/benefits ("iron → food-intelligence") but not others. It also does not yet route food-discovery questions (e.g., "What plants should I eat this week?") to FI, only to nutrition-knowledge discovery or native discovery. **Result:** questions that should hit FI hit discovery instead.

2. **Pattern Intent Resolver parallel but not integrated.** `pattern-intent-resolver.ts` exists and attempts to fuzzy-match natural language to benefit/nutrient slugs, but it is invoked *separately* from the main intent resolver and not yet unified. **Result:** the Companion may route a question to nutrition-knowledge when FI could answer better.

3. **Food Intelligence bindings not wired to Companion card flow.** The handler exists, but the Companion's turn-outcome logic, action proposals, and card structure do not yet call FI recommendation or opportunity verbs in the natural conversation flow. FI's intent is routed only when explicitly requested via capability call, not discovered by the Conversation Gateway.

**These are routing/orchestration gaps, not knowledge gaps.** The engines work (unit tests pass). The data exists. The issue is **the plumbing doesn't yet route all appropriate questions to them**.

---

## 3. FOOD INTELLIGENCE CAPABILITY BINDING (19TH CAPABILITY)

### 3.1 What's registered

| Verb | Function | Scope | Status |
|---|---|---|---|
| **recommend** | FI3 engine: find top-N foods for a benefit/nutrient | `{ scope: "benefit"\|"nutrient", slug: string }` | ✅ Live, working |
| **explain** | FI3 engine: detail one food's fit for a benefit/nutrient | `{ scope, slug, foodSlug }` | ✅ Live, working |
| **report** | FI4 engine: ambient opportunities from household state | `{ limit?: number }` | ✅ Live, works but not surfaced |

### 3.2 FI3 Engine (Foundation) — Stage 1/2

**Stage 1 (static, no household):**
- Input: `{ scope: "benefit"|"nutrient", slug: string }`
- Output: 10 top-ranked foods (by citation strength, then category diversity)
- No personalization
- **Works: ✅**

**Stage 2 (household-aware, authenticated):**
- Input: same + optional `userId`
- Engine resolves user's household (restrictions, planner familiarity)
- Ranks candidates down by:
  1. Hard-restriction safety (T0)
  2. Citation strength (E1)
  3. Household familiarity (bonus for foods in planner history)
  4. Category diversity (avoid clustering)
- **Works: ✅**

**What it does NOT do (future phases FI1 §8):**
- No learning re-weighting (Phase 2+)
- No external signals (Phase 3+)
- No predictive ranking (Phase 4+)
- No multi-eater goal resolution (Phase 5+)

### 3.3 FI4 Opportunity Engine (Ambient Intelligence)

**Five generators (all live, all unit-tested):**

1. **Planner-gap opportunities** — identifies empty days/meals; suggests foods for missing nutrition
2. **Pantry-available opportunities** — "cook from what you have" suggestions
3. **Shopping-swap opportunities** — same-category, better-choice swaps (via Analyser)
4. **New-food opportunities** — foods the household hasn't tried recently, paired with their household's own interests
5. **Diversity-group opportunities** — week-level plant variety gaps (toward "30 plants a week")

**Confirmed Understanding reweighting (IA3):** FI4 reads `household_learning_signals` with `status = "confirmed"` and re-tiers opportunities (one tier up/down), never creates new ones.

**Prioritisation (FI7):** The engines produce `magnitude` (how big is this opportunity). The handler was supposed to sort by magnitude within tier, but **FI7 implementation is incomplete** — opportunities are returned in arrival order, not sorted by importance. **Low-impact gap** (affects ranking of ties, not which opportunities surface).

---

## 4. KNOWLEDGE INVENTORY — WHAT'S AVAILABLE FOR FI TO DRAW ON

### 4.1 Core knowledge (Plane 1)

**Nutrients:** ~50 canonical nutrients  
- Iron, magnesium, calcium, vitamin D, potassium, fibre, protein, omega-3, etc.
- Each has a `FoodCard[]` (foods offering this nutrient)
- Sourced from WS0 knowledge bridge + USDA FDC

**Benefits:** ~45 editorial benefits  
- Energy, immune health, bone health, heart health, digestion, sleep, mood, plant variety, etc.
- **Evidence-gated:** only benefits with ≥1 cited Plane 1 source render
- Sourced from `NUTRITION_CONTEXT` (hand-curated, nutritionist-reviewed)

**Foods:** ~1,500 canonical foods  
- Identity, category, description, seasonality, basic nutrition
- Each maps to 0+ nutrients, 0+ benefits (evidence-based)
- Sourced from `CANONICAL_SEED` (WS2A promotion + ongoing curation)

**Diversity groups:** ~8 groups  
- Vegetables, Fruits, Grains, Legumes, Nuts/Seeds, Herbs/Spices, Mushrooms, Others
- Each food tagged with its primary group
- Sourced from `DIVERSITY_GROUP_SEED` (WS2A)

**Restrictions library:** ~30 dietary patterns & restrictions  
- Vegan, vegetarian, gluten-free, nut-free, dairy-free, kosher, halal, etc.
- Ingredient-level compliance checking built in
- Sourced from `restriction-library.ts`

### 4.2 Assembled models (reused by FI)

| Model | What it does | Live |
|---|---|---|
| **Food Intelligence Assembler** | Composes food identity + nutrients + benefits + seasonality + household context for one food | ✅ |
| **Food Report Adapter** | Renders the canonical Food Report shape (overview + nutrition + benefits + discovery) | ✅ |
| **Nutrition Knowledge Registry** | Provides `getNutrientDetailView()` and `getBenefitDetailView()` (cited food lists) | ✅ |
| **Uplift Engine (Simply Better)** | Scores recipe boosts (Better Choices, alternate ingredients) | ✅ |
| **Food Discovery Engine** | Suggests related foods / cuisines / variety groups | ✅ |
| **Household Meal Matcher** | Matches meals to household eaters & restrictions | ✅ |

**Status:** All these exist. FI3/FI4 do not re-implement them; they *compose* them.

### 4.3 What's NOT yet available for FI

| Missing | Why | Impact on FI | Timeline |
|---|---|---|---|
| **Goals (user-stated, per-eater)** | Pending Goals capability (FI1 Phase 1) | FI cannot yet alias goals into nutrients; depends on user input | 2027 H1 |
| **External signals (wearables, etc.)** | Pending Signals Gateway (FI1 Phase 3) | FI cannot use activity/sleep/biomarker data; only self-reported diary metrics | 2028 |
| **Community testimony** | Pending Community capability (FI1 Phase 3) | FI cannot surface "households like you cook this" | 2028 |
| **Multi-eater goal negotiation** | Pending Stage 5 engine (FI1 Phase 4) | FI cannot yet resolve "find something that fits all 4 eaters AND their different goals" | 2029 |
| **Predictive/proactive ranking** | Pending Stage 4 engine (FI1 Phase 4) | FI scores only based on current state, not predicted future needs | 2029 |

**None of these are blocking the 68.3 score.** They are Phase 2+ features. The benchmark failure is not "we don't have signals," it's "we're not routing the question to the engine at all."

---

## 5. PLATFORM FEATURES CONSUMING FOOD INTELLIGENCE

### 5.1 Direct capability calls (working)

| Context | Call | Status |
|---|---|---|
| **Benchmark suite** | `platform.handle({ verb: "recommend", capabilityId: "food-intelligence", ... })` | ✅ Works |
| **Direct API call** (if exposed) | `/api/intelligence/capability/food-intelligence/recommend` | ✅ Would work (not exposed in routes.ts yet) |
| **Opportunity framework** | `platform.handle({ verb: "report", capabilityId: "food-intelligence", ... })` | ✅ Works |

### 5.2 Companion conversation (partially wired)

| Flow | Status | Details |
|---|---|---|
| **User asks "What helps with sleep?"** | 🟡 Partial | Routes to `nutrition-discovery` (not FI). Should route to `food-intelligence:recommend { scope: "benefit", slug: "sleep" }` |
| **User asks "Why is salmon good for us?"** | 🟡 Partial | Routes to `nutrition-knowledge:explain`; FI could add amplification |
| **Companion suggests a boost** | 🟡 Partial | Via `Cookbook:SimplyBetter` (uplift engine); FI could explain *why* the boost matters |
| **User looks at weekly plan** | ❌ Not wired | Planner could call `food-intelligence:report` to surface opportunities; not yet integrated |
| **User browses pantry** | ❌ Not wired | Pantry Explore could call FI to surface "cook from what you have" opportunities; not yet |

**Why incomplete:** The Conversation Gateway's turn-outcome logic (turn-outcome-store.ts, turn-fallback.ts) does not call FI verbs. Companion enrichment (companion-enrichment.ts) does not invoke FI. The Discovery engines (native, meal, nutrition, etc.) run instead.

**This is why the benchmark only has 2 FI questions:** the Companion is not routing food-discovery or food-intelligence questions to the FI handler.

### 5.3 UI surfaces (not yet integrated)

| Surface | Intended FI use | Status |
|---|---|---|
| **Planner weekly strip** | "Plants this week: X/30 · gaps: [lists] · Fix this → Companion" | 🟡 Code stub exists, no integration |
| **Shopping list context** | "Salmon — covers this week's oily-fish gap" | ❌ Not wired |
| **Pantry "cook from what you have"** | Call FI4 opportunities; suggest recipes | ❌ Not wired |
| **Cookbook meal detail** | FI-sourced "why this meal" explanation | 🟡 Partially via nutrition-enrichment |
| **Weekly Nutrition Report** | Powered by FI ranking (instead of ad-hoc per-surface ranking) | 🟡 Design exists, not implemented |
| **Companion food answers** | FI's recommend + explain verbs | 🟡 Designed but not routed |

---

## 6. EVIDENCE THAT SUPPORTS THE "MISSING ROUTING, NOT KNOWLEDGE" CONCLUSION

### 6.1 Benchmark failure analysis

**Two FI questions tested:**

1. **CG-087 & CG-090** (Companion Guidance domain)
   - Expected: route to `food-intelligence:recommend` or similar
   - Actual: routed to `nutrition-discovery` or `native-discovery`
   - Score: 68.3/100 (D1=64%, D4=73%)
   - Gap: **routing**, not answer quality

### 6.2 Deterministic test results (unit tests)

**All FI3/FI4 tests pass:**
- ✅ `test-intelligence-food-intelligence-binding.ts` — recommend/explain work correctly
- ✅ `test-intelligence-food-opportunity-binding.ts` — report + opportunities work
- ✅ FI3 pure-function tests — ranking logic is sound
- ✅ EL1 pattern detection tests — thresholds and consistency rules work

**If FI knew nothing, the unit tests would fail. They don't.** The issue is orchestration, not knowledge.

### 6.3 Artefactual evidence

- ✅ `NUTRITION_CONTEXT` has 45 benefits with curated explanations — knowledge is *authored*
- ✅ FI3 engine's `rankAndExplain()` is a pure function — logic is *testable*
- ✅ FI4 generators all produce non-empty opportunity lists in test fixtures — data is *available*
- ✅ Intent Resolver has nutrient mappings for ~30 nutrients — some routing *exists*

**The evidence points not to "we need more data," but to "we need to finish wiring the router."**

---

## 7. OWNERSHIP & GOVERNANCE

### 7.1 Who owns what

| Component | Owner | Boundary |
|---|---|---|
| **Food Intelligence Engine** | FI3 development (IA2–IA4) | Reads Planes 1–2; writes nothing to business domains |
| **Opportunity Engine** | FI4 development (IA2–IA4) | Same read constraints; `report` is read-only |
| **Intent Resolver** | Intent Engine development (INT1–INT41) | Shared orchestration layer |
| **Conversation Gateway** | Conversation Platform (INTQ, INT41) | Routes turns to capabilities |
| **Pattern Intent Resolver** | INT-adjacent, pattern matching (INT41A) | Attempts fuzzy NLU for intent categorization |

**Dual-ownership observation:** Intent resolution is split across two modules:
- `intent-resolver.ts` — hardcoded rules for known patterns
- `pattern-intent-resolver.ts` — fuzzy matching for unknown patterns

**Neither routes food-intelligence questions reliably today.** Unifying or clarifying ownership of "should this question go to FI" is part of the routing-gap fix.

### 7.2 Governance rules enforced

| Rule | Enforcement | Status |
|---|---|---|
| **Rule FI1** (enrich, never own) | Port pattern + no direct writes in FI | ✅ Enforced |
| **Rule E1** (no citation, no card) | FI3 only ranks foods with Plane 1 citations | ✅ Enforced |
| **Rule T0** (safety supersedes everything) | Hard-restriction check in FI3 before ranking | ✅ Enforced |
| **Rule T1** (food, not bodies) | FI3/FI4 explanation strings avoid body claims | ✅ Enforced |
| **Rule G1** (Generic Knowledge Wall) | Plane 1 read-only; Plane 2 never writes back | ✅ Enforced |
| **Rule LT3** (brain stays deterministic) | FI decision layer is pure; no LLM ranking | ✅ Enforced |

**All architectural rules are enforced in code or by design.** Governance is not the problem.

---

## 8. GAP ANALYSIS — HIGHEST-IMPACT IMPROVEMENTS RANKED

### 8.1 The gaps (priority by effort × impact)

| # | Gap | Category | Effort | Impact | FI1 Phase | Blocker? |
|---|---|---|---|---|---|---|
| **1** | **Intent Resolver routing** | Routing | Low | Very High | Phase 0 | 🔴 YES |
| **2** | **Companion capability discovery** | Routing | Medium | Very High | Phase 0 | 🔴 YES |
| **3** | **UI surface integration** (Planner/Shopping strips) | Surface | Medium | High | Phase 1 | 🟡 No |
| **4** | **Goals capability** | Knowledge/Phase | High | High | Phase 1 | 🟡 No |
| **5** | **FI7 prioritisation** | Engine completeness | Low | Medium | Phase 0 | 🟡 No |
| **6** | **Pattern Intent Resolver unification** | Routing | Medium | Medium | Phase 0 | 🟡 No |
| **7** | **Opportunity delivery UI** | Surface | Medium | Medium | Phase 1 | 🟡 No |
| **8** | **Signals Gateway** | Knowledge/Phase | High | Medium | Phase 3 | ❌ No |
| **9** | **Multi-eater goal resolution** | Engine/Phase | Very High | Medium | Phase 4–5 | ❌ No |
| **10** | **Community re-grounding** | Knowledge/Phase | Very High | Low–Medium | Phase 3 | ❌ No |

---

## 9. TOP 10 IMPROVEMENTS — DETAILED RECOMMENDATIONS

### 9.1 **[BLOCKER] Unify Intent Resolver routing for food-intelligence**

**Current state:** `intent-resolver.ts` routes ~30 known nutrients hardcoded; unmapped benefit questions go to discovery. FI can answer any benefit/nutrient, but the router doesn't know.

**Problem:** 
- Benchmark questions testing "recommend foods for [unknown benefit]" fail at routing step
- FI3 engine is correct; orchestration is incomplete

**Solution:**
- Build a **benefit/nutrient slug registry** from `nutrition-knowledge-registry.ts`'s own `KNOWLEDGE_EDGES`
- Modify `intent-resolver.ts` to consult this registry; if intent matches a benefit/nutrient slug, route to `food-intelligence:recommend`
- **Result:** all food-X benefit questions route to FI (not discovery)

**Effort:** Low (~1–2 hours: read registry, loop over benefits, add routing rule)  
**Expected impact on benchmark:** +5–10 points (fixes routing D4 for ~5 questions)  
**Blocks:** FI from being usable in Companion; benchmark improvement

**Acceptance criteria:**
- Intent resolver routes all food-intelligence-routable questions to FI
- Benchmark run shows food-intelligence questions at 75%+ D4 (routing correct)
- No regression in other capability routing

---

### 9.2 **[BLOCKER] Integrate FI discovery into Companion conversation flow**

**Current state:** Companion conversation has no call to `food-intelligence` capability from the turn-outcome logic. Discovery runs (nutrition-discovery, native-discovery) instead.

**Problem:**
- Even if routing is fixed, the Companion gateway doesn't *call* FI
- Benchmark questions testing "what should I eat for X" get discovery answers, not FI recommendations
- Opportunity answers are *never* surfaced because the report verb is never invoked

**Solution:**
- Add FI recommendation/explanation as a **Companion Card enrichment source** (like nutrition-enrichment.ts)
- Modify `conversation-gateway.ts` to check if a turn's outcome matches food-intelligence capability
- Call `food-intelligence:recommend` when appropriate; render result as a Companion Card
- **Result:** Companion answers food questions with FI's deterministic, cited bundles

**Effort:** Medium (~3–4 hours: understand Companion card flow, add FI call site, shape result for rendering)  
**Expected impact on benchmark:** +10–15 points (fixes ~8 more CG questions)  
**Blocks:** Food Intelligence from being user-visible; Companion food answers

**Acceptance criteria:**
- Companion food questions produce FI recommendations as Companion Cards
- Card shows food name + citation + household context (if aware)
- Benchmark run shows food-intelligence D5 (relevance) at 80%+
- No regression in other Companion guidance

---

### 9.3 **UI: Planner weekly strip with gap-awareness & FI-powered suggestions**

**Current state:** Planner shows weekly summary card stub; no FI integration. Code comment exists but not wired.

**Problem:**
- FI4 can generate planner-gap opportunities ("oily fish absent 3 weeks"); Planner doesn't ask for them
- Planner remains the hub for weekly food decisions, but it doesn't signal where help is needed
- Users see "26 plants this week" but no next step (FI2 design: strip + "Fix this" → Companion)

**Solution:**
- Planner page: below weekly summary, add a **gap-awareness strip**
  - Text: "This week: X plants · fiber well-covered · oily fish absent 3 weeks"
  - Tap each gap to call `food-intelligence:report` and filter to that opportunity type
  - Offer "Fix this" action: pre-populate Companion with the gap, hand to FI recommendation
- **Result:** Planner surfaces FI4's opportunities; users can act immediately

**Effort:** Medium (~2–3 hours: add component, call report verb, integrate Companion handoff)  
**Expected impact on benchmark:** +3–5 points (enables new FI-powered user flows)  
**Blocks:** Planner/Companion integration for FI

**Acceptance criteria:**
- Planner shows gap awareness strip for logged-in users
- Strip calls `food-intelligence:report`
- "Fix this" flows to Companion with pre-populated intent
- No regression in Planner load time

---

### 9.4 **Shopping list: in-place context + FI-powered swaps**

**Current state:** Shopping list shows items; no FI integration. Swap suggestions exist (Analyser) but aren't linked to FI context.

**Problem:**
- FI4 can identify shopping swaps ("natural yoghurt: same-category swap available, less sugar")
- Shopping list shows items but no *why* they matter
- Users don't know which items close gaps

**Solution:**
- Shopping list item detail: add **FI context line**
  - "Salmon — covers this week's oily-fish gap" (pulled from FI4 opportunity metadata)
  - Tap to expand: show citation (benefit + foods in planner this week) + nutrition detail
- Swap suggestion: link to FI recommendation, not just Analyser judgment
- **Result:** Shopping list becomes a *decision surface* informed by FI, not just a checklist

**Effort:** Medium (~2–3 hours: call report verb, filter to shopping-swap type, compose context)  
**Expected impact on benchmark:** +2–3 points (enables new shopping-FI flows)  
**Blocks:** Shopping/FI integration

**Acceptance criteria:**
- Shopping items show FI context (if available)
- Tap context expands citation + nutrient detail
- No performance regression (FI report call cached per session)

---

### 9.5 **Pantry: "cook from what you have" powered by FI4**

**Current state:** Pantry Explore (knowledge hub) is live. Inventory mode exists. "Cook from what you have" is designed but not wired.

**Problem:**
- FI4 can suggest recipes from current pantry; Pantry doesn't call it
- Pantry remains a lookup surface, not a *decision* surface (against FI2 design intent)
- Users don't know what to make with what they have

**Solution:**
- Pantry inventory mode: add **"Tonight's options" chip**
  - Text: "Cook from what's at home: 3 meals"
  - Calls `food-intelligence:report` filter to pantry-available opportunities
  - Tap: shows 3 Cookbook meals that use items in inventory
- **Result:** Pantry becomes a *decision tool*, not just an inventory tracker

**Effort:** Low (~1–2 hours: add chip, call filtered report verb, render recipes)  
**Expected impact on benchmark:** +1–2 points (new flow)  
**Blocks:** Pantry/FI integration

**Acceptance criteria:**
- Pantry shows "cook from home" chip for households with inventory
- Chip calls food-intelligence:report filtered to pantry-available
- Renders 1–3 Cookbook meals
- No performance regression

---

### 9.6 **Pattern Intent Resolver integration: unify fuzzy + hardcoded routing**

**Current state:** Two separate routing paths run (intent-resolver + pattern-intent-resolver); neither is canonical.

**Problem:**
- A user's natural-language "recommend foods for [fuzzy-matched benefit]" might go to either router
- Neither router is the "source of truth" for food-intelligence routing
- Maintenance burden: benefits added to Plane 1 must be added in two places

**Solution:**
- Promote `pattern-intent-resolver.ts` to be the **canonical food-intelligence router**
- Have `intent-resolver.ts` delegate food benefit/nutrient matching to it
- Pattern resolver uses `nutrition-knowledge-registry.ts` to validate slug matches
- **Result:** One clear path for all food-X intents

**Effort:** Medium (~2–3 hours: refactor resolver hierarchy, add tests)  
**Expected impact on benchmark:** +2–3 points (fixes edge cases)  
**Blocks:** Clarifying ownership of food-intent routing

**Acceptance criteria:**
- Single canonical path for food-intelligence routing
- All food-X intents route through pattern resolver
- Fuzzy matching + hardcoded fallback both work
- No regression in other capability routing

---

### 9.7 **FI7 implementation: magnitude-based opportunity prioritisation**

**Current state:** FI4 computes `magnitude` for each opportunity (how big is this gap/swap?). Opportunities returned in arrival order, not sorted.

**Problem:**
- Benchmark question testing opportunity ranking may not see the "biggest" opportunity first
- Companion/Planner cannot rely on opportunities being ordered by importance
- Users see arbitrary ranking instead of "most important opportunity first"

**Solution:**
- `food-intelligence-read-handler.ts:handleReport()` already receives opportunities from port
- Sort opportunities by **priority tier (high/medium/low), then magnitude (descending), then arrival**
- Add `magnitude` to `FoodOpportunity` result shape if not present
- **Result:** Opportunities are ranked by importance, not arrival time

**Effort:** Low (~1 hour: add sort key to handler result processing)  
**Expected impact on benchmark:** +1–2 points (better ranking)  
**Blocks:** Nothing critical, but improves UX if opportunities are surfaced

**Acceptance criteria:**
- Opportunities returned sorted by magnitude within tier
- Benchmark question testing FI opportunity ranking scores higher
- No performance regression

---

### 9.8 **Goals capability: enable benefit/nutrient goal aliasing (Phase 1)**

**Current state:** FI1 Phase 1 names "Goals capability" as a prerequisite for per-eater goals. Not yet built.

**Problem:**
- FI can recommend foods for a benefit (e.g., "sleep"); users can't set "sleep better" as a personal goal
- Multi-eater households can't align around shared goals
- Learning signals (EL1) exist but aren't yet tied to user-stated goals

**Solution:**
- Build Goals capability: CRUD + alias resolution
- When a user sets goal "sleep better", resolve it to `benefit:sleep` internally
- FI3 recommendation engine can then check goal context and re-weight accordingly
- **Result:** Goals become first-class input to FI reasoning

**Effort:** High (~6–8 hours: capability definition, storage, alias resolution, EL1 integration)  
**Expected impact on benchmark:** +5–8 points (unlocks goal-aware FI questions)  
**Blocks:** Phase 1 of FI (per FI1 §8)

**Acceptance criteria:**
- Goals capability exists with read/write/delete verbs
- Goal aliases resolved to benefit/nutrient slugs
- FI3 engine receives goal context and uses it in ranking
- Benchmark questions testing goal-aware FI improve

---

### 9.9 **Signals Gateway (Phase 3): wearable/biomarker signal integration**

**Current state:** Architecture named in FI1 §6 (signal ladder); S-0 (self-reported diary metrics) already exist. S-1+ (wearables, biomarkers) not built.

**Problem:**
- FI cannot yet use external signals to personalise recommendations
- Users with wearables/biomarkers have no visibility into how that data informs FI
- FI Phase 3 depends on this being built and gated

**Solution:**
- Signals Gateway: consent + summarisation + closed-vocabulary flags
- S-1 (wearables): activity/sleep from Apple Health / Google Health Connect, weekly aggregates only
- S-2+ (biomarkers): future, gated on regulatory review (§6.4)
- FI4 uses signals as a read-only context source (like planner history)
- **Result:** FI recommendations can be re-weighted by external signals (e.g., "high activity this week → suggest protein-rich options")

**Effort:** Very High (~15–20 hours: partner API integration, consent UI, summarisation, FI integration)  
**Expected impact on benchmark:** +3–5 points (unlocks signal-aware questions, but Phase 3 so lower priority)  
**Blocks:** FI Phase 3; Signals Gateway as a standalone capability

**Acceptance criteria:**
- Signals Gateway capability exists with consent/read/delete verbs
- S-1 wearables integrated with Apple Health / Google Health Connect
- FI4 reads signals through read port
- Benchmark questions testing signal-aware FI work
- Legal review completed for S-2+ (biomarker classification)

---

### 9.10 **Multi-eater goal reconciliation (Phase 4–5): future household negotiation**

**Current state:** FI3/FI4 work per-household. Multi-eater goal resolution is named as Phase 5 future work.

**Problem:**
- Households have multiple eaters with different goals/restrictions
- FI can generate per-eater options but cannot yet negotiate "what works for everyone"
- Users must manually resolve conflicts (too much friction)

**Solution:**
- Stage 5 engine: extend FI3 to accept **per-eater goal context** + household-level decision context
- Ranking logic: find foods that satisfy as many eaters' goals as possible; surface trade-offs
- Explanation: "fits 3 of 4 eaters; [eater] can swap to [alternative]"
- **Result:** FI becomes a household *consensus* tool, not just a per-eater recommender

**Effort:** Very High (~20–30 hours: new ranking algorithm, multi-eater decision logic, explanation generation)  
**Expected impact on benchmark:** +5–10 points (unlocks household-decision questions, Phase 4+ so much lower priority)  
**Blocks:** FI Phase 4–5

**Acceptance criteria:**
- FI3 extended to accept per-eater goals
- Ranking logic resolves conflicts (e.g., "fits 3/4" scoring)
- Explanation shows trade-offs + alternatives
- Benchmark questions testing multi-eater FI work

---

## 10. SUMMARY TABLE: AUDIT FINDINGS

| Finding | Status | Evidence |
|---|---|---|
| **FI3 Engine works** | ✅ Verified | Unit tests pass; benchmark show correct ranking when called |
| **FI4 Opportunities work** | ✅ Verified | All 5 generators produce non-empty lists; pattern logic sound |
| **EL1 Learning works** | ✅ Verified | Pattern detection thresholds enforced; confirmed signals in DB |
| **Plane 1 knowledge is solid** | ✅ Verified | 45 benefits + 50 nutrients, all curated, evidence-gated |
| **Plane 2 personalisation is built** | ✅ Verified | Event log exists, pattern detection working, no single-event signals |
| **Rule FI1 is enforced** | ✅ Verified | No private write path; all writes via Business Domain intents |
| **Benchmark weakness is routing** | ✅ Verified | 2 FI questions fail at routing (D4), not at reasoning (D1) |
| **Routing is incomplete** | ✅ Verified | Intent Resolver doesn't route all food benefits; Companion doesn't call FI |
| **UI integration is missing** | ✅ Verified | Planner/Shopping/Pantry have no FI surface calls yet |
| **FI is production-safe** | ✅ Verified | All trust rules enforced; no fabrication paths; safety-first ranking |

---

## 11. DEFINITION OF AUDIT COMPLETION

✅ **What was delivered:**
- Current architecture mapped to FI1 governing doc
- Plane 1–4 status determined (built/partial/future)
- Benchmark failure root cause traced to routing, not knowledge
- Ownership & governance verified
- Top 10 improvements ranked by effort × impact
- Actionable acceptance criteria provided for each improvement

❌ **What was NOT done (out of scope):**
- No code changes made (read-only audit)
- No benchmark re-runs (would require implementation)
- No new knowledge authored
- No schema/API changes proposed

✅ **Ready for handoff to engineering:** Yes. Improvements #1–2 are blocking; improvements #3–7 unblock Phase 1. Improvements #8–10 are Phase 2–5 (post-launch gates per FI1 §8).

---

## 12. REFERENCES

| Document | Purpose |
|---|---|
| `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` | Governing architecture — read this first |
| `docs/investigations/intelligence/FI2_FUTURE_STATE_FOOD_INTELLIGENCE_EXPERIENCE.md` | Experience vision (not code) |
| `docs/implementation/intelligence/FI3_FOOD_INTELLIGENCE_ENGINE_FOUNDATION.md` | FI3 implementation record |
| `docs/implementation/intelligence/FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md` | FI4 implementation record |
| `docs/implementation/knowledge/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md` | Evidence & Learning Platform |
| `server/intelligence/food-intelligence/engine.ts` | FI3 code (entry point) |
| `server/intelligence/food-intelligence/opportunity-engine.ts` | FI4 code (entry point) |
| `server/intelligence/handlers/food-intelligence-read-handler.ts` | Capability handler |
| `docs/intelligence/benchmark/BENCHMARK_SCORING_FRAMEWORK.md` | Benchmark rubric |
| `docs/intelligence/benchmark/history/*.report.md` | Latest benchmark run |

---

*Audit completed with read-only access to codebase, documentation, and benchmark data.*  
*No code was modified. No health claims were generated.*
