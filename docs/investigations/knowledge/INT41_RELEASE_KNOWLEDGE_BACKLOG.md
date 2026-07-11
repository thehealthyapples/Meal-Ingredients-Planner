# INT41 — Release Knowledge Backlog

**Investigation:** Identify the highest-value business knowledge missing from THA that limits Companion benchmark performance.

**Benchmark Source:** `2026-07-06T22-58-24Z__cb5baa5` (Latest run)  
**Overall Intelligence Score:** 76.7/100 (PASS)  
**Failing/Weak Questions:** 12 of 100  
**Primary Weakness:** Factual Correctness (D1: 66%) and Capability Routing (D4: 74%)

---

## Executive Summary

THA achieved PASS on the latest benchmark run with no hard-gate safety failures. However, **12 questions score below 70/100**, revealing systematic knowledge gaps that block user value. The weakest dimension is **Factual Correctness (D1)**, indicating missing or incomplete data rather than capability architecture issues.

**Top 5 Knowledge Priorities by Expected Impact:**
1. **Meal-level ingredient and nutrition metadata** — blocks multiple cookbook, planner, nutrition, and product intelligence questions
2. **Household-scoped allergen and restriction application** — blocks safety-critical questions
3. **Planner-to-nutrition cross-reference index** — blocks meal quality ranking and optimization
4. **Food-enrichment and uplift patterns** — blocks practical nutrition guidance
5. **Evidence-backed nutrition claims repository** — blocks trust and safety validation

---

## Ranking Methodology

Each failing question evaluated on:
- **Factual Gap:** What specific knowledge/data is missing?
- **Business Owner:** Which domain intelligence service owns this?
- **Domain Classification:** Food / Nutrition / Planner / Shopping / Cookbook / Household / Profile / Product Intelligence
- **Enrichment vs. New:** Can existing knowledge be deepened, or is genuinely new knowledge required?
- **Expected Impact:** How many benchmark questions would improve? Estimated user value?
- **Implementation Complexity:** Relative effort to close the gap

---

## Ranked Release Knowledge Backlog

### **#1: CRITICAL — Meal-Level Ingredient Completeness & Nutrition Metadata**

| Field | Value |
|---|---|
| **Failing Questions** | CB-018, ND-058, CG-087, SH-042 (indirect) |
| **Benchmark Score Impact** | +8–12 points per question fixed |
| **Domain** | Cookbook Intelligence + Nutrition Intelligence |
| **Business Owner** | Cookbook Curator (Meals table) + Nutrition Team |
| **Current State** | Meals have name/category; ingredients/nutrition often incomplete or missing |
| **Knowledge Required** | **ENRICHMENT + NEW** |
| **Specific Gaps** |<br>- Salmon/protein foods not tagged consistently (CB-018: "Which meals include salmon?" returns 0) <br>- Meal nutrition metadata not hydrated (ND-058: Cannot rank meals by nutritional strength) <br>- Ingredient-to-food cross-reference missing (CG-087: Cannot suggest ingredient swaps) <br>- Macro/micronutrient breakdowns absent or low-confidence |
| **Evidence Expected** | Canonical ingredients per meal, nutritional value per serving, source confidence (recipe, label, estimation) |
| **Why This Blocks Users** | Companion cannot answer basic "what do I have that's healthy?" without complete ingredient/nutrition data. Foundation for all meal-level reasoning. |
| **Year 1 Implementation** | Phase 1: Audit meal library for ingredient completeness. Phase 2: Hydrate nutrition from USDA/partner sources. Phase 3: Implement ingredient search index. |

---

### **#2: CRITICAL — Household Allergy & Restriction Application Rules**

| Field | Value |
|---|---|
| **Failing Questions** | TS-092, PR-070, SH-042 |
| **Benchmark Score Impact** | +8–10 points per question fixed |
| **Domain** | Household Intelligence + Safety Boundary |
| **Business Owner** | Household Safety (Profile + Restriction Rules) |
| **Current State** | Restrictions recorded in profile but not dynamically applied to meal/product evaluation |
| **Knowledge Required** | **NEW** |
| **Specific Gaps** |<br>- No rule engine for allergen/restriction application to meals (TS-092: Cannot confidently assess meal safety) <br>- Product allergen matrix not built (PR-070: No systematic product-restriction matching) <br>- Confidence levels for allergen warnings not defined (SH-042: Cannot prioritize which items to check) <br>- Cross-household allergen conflicts not tracked |
| **Evidence Expected** | Allergen rule definitions, product allergen/ingredient source confidence, household member restriction scope |
| **Why This Blocks Users** | Safety is THA's trust foundation. Without grounded allergen application, the Companion must admit uncertainty on every safety question—undermining reliability. |
| **Year 1 Implementation** | Phase 1: Define allergen rule DSL (e.g., "peanut ∈ meal ingredients → warn"). Phase 2: Audit product/meal allergen data quality. Phase 3: Implement rule evaluator in safety-boundary capability. |

---

### **#3: CRITICAL — Planner-to-Nutrition Cross-Reference Index**

| Field | Value |
|---|---|
| **Failing Questions** | ND-058, PL-032, PL-027 (variety detection) |
| **Benchmark Score Impact** | +8–10 points per question fixed |
| **Domain** | Planner Intelligence + Nutrition Intelligence |
| **Business Owner** | Planner Team + Nutrition Report Team |
| **Current State** | Planner stores meals; nutrition report exists separately. No join path meal → nutrition. |
| **Knowledge Required** | **NEW** |
| **Specific Gaps** |<br>- No indexed view of "meals in plan + their nutritional profiles" (ND-058: Cannot rank planned meals by health) <br>- Meal-to-meal variety comparison not computable (PL-027: Cannot reliably detect repeats or suggest swaps) <br>- Weekly nutrition composition not aggregatable (PL-032: Cannot identify week-level nutrient gaps) <br>- Planner change impact on nutrition not traceable |
| **Evidence Expected** | Joined planner/nutrition model with daily/weekly roll-ups, meal contribution to nutrients, variety metrics |
| **Why This Blocks Users** | Planner is a shell without nutrition grounding. Users cannot make evidence-based meal choices or improvements. |
| **Year 1 Implementation** | Phase 1: Build planner→nutrition SQL views or graph index. Phase 2: Implement variety/repeat detection. Phase 3: Implement meal-swap recommendation engine. |

---

### **#4: HIGH — Nutrition Boost & Uplift Pattern Library**

| Field | Value |
|---|---|
| **Failing Questions** | ND-059, CG-087, CG-090 (partially) |
| **Benchmark Score Impact** | +6–8 points per question fixed |
| **Domain** | Nutrition Intelligence + Food Intelligence |
| **Business Owner** | Nutrition Team + Food Knowledge Team |
| **Current State** | General knowledge of "add vegetables" exists; no structured uplift patterns or meal templates |
| **Knowledge Required** | **ENRICHMENT + NEW** |
| **Specific Gaps** |<br>- No canonical "uplift additions" (e.g., "add seeds to yogurt bowl → +protein +fibre") (ND-059: Cannot suggest specific boosts) <br>- Meal-template variants not defined (CG-087: Cannot show ingredient swaps for health) <br>- Before/after nutrition delta not calculated (CG-090: Cannot celebrate specific improvements) <br>- Household preference learning for accepted boosts not implemented |
| **Evidence Expected** | Uplift recipe templates, ingredient substitution rules, meal component library, preference signals |
| **Why This Blocks Users** | Guidance feels generic ("add more vegetables") rather than actionable ("add 20g seeds to your bowl → +2g fibre"). |
| **Year 1 Implementation** | Phase 1: Build uplift recipe library (50–100 patterns). Phase 2: Implement template-matching to meals. Phase 3: Learn household acceptance patterns. |

---

### **#5: HIGH — Evidence-Backed Nutrition Claims & Food Benefit Graph**

| Field | Value |
|---|---|
| **Failing Questions** | TS-097, FK-073, FK-074, FK-075, FK-082 (partially) |
| **Benchmark Score Impact** | +6–8 points per question fixed |
| **Domain** | Product Intelligence + Food Knowledge |
| **Business Owner** | Food Knowledge Team + Evidence Team |
| **Current State** | Some nutrition facts exist; no authoritative claim-to-evidence mapping or source tracking |
| **Knowledge Required** | **ENRICHMENT** |
| **Specific Gaps** |<br>- No evidence ledger for claims ("salmon has omega-3" backed by which source?) (TS-097: Cannot show evidence) <br>- Benefit-to-food graph incomplete (FK-073, FK-074: Gaps on common foods) <br>- Confidence levels not attached to claims (TS-097: Cannot say "supported" vs "speculative") <br>- Claim contradictions not detected or resolved |
| **Evidence Expected** | Food-benefit mappings with source/confidence, evidence records linked to claims, dispute/contradiction notes |
| **Why This Blocks Users** | Without traceability, the Companion either overstates claims or admits unnecessary gaps. Users distrust guidance without grounding. |
| **Year 1 Implementation** | Phase 1: Audit existing food knowledge for claim-evidence linkage. Phase 2: Standardize evidence recording (source, quality, confidence). Phase 3: Surface confidence in responses. |

---

### **#6: HIGH — Shopping List-to-Meal Requirement Mapping**

| Field | Value |
|---|---|
| **Failing Questions** | SH-042 (partially), PH-006 (indirectly) |
| **Benchmark Score Impact** | +6–8 points per question fixed |
| **Domain** | Shopping Intelligence + Planner Intelligence |
| **Business Owner** | Shopping Team + Planner Team |
| **Current State** | Shopping list and planner exist separately. No join: "which items are needed for this week's plan?" |
| **Knowledge Required** | **NEW** |
| **Specific Gaps** |<br>- No recipe-ingredient expansion (cannot auto-generate shopping from planner) <br>- Shopping item-to-meal traceability missing (SH-042: Cannot flag which items matter for safety) <br>- Pantry deduction logic not implemented <br>- Supermarket/budget preference not applied to item suggestions |
| **Evidence Expected** | Recipe ingredient lists, shopping→planner cross-reference, item categorization by allergen/additive priority |
| **Why This Blocks Users** | Shopping feels disconnected from meal planning. Manual item entry is tedious and error-prone. |
| **Y1 Implementation** | Phase 1: Build recipe→ingredients expansion. Phase 2: Implement planner→shopping proposal generator. Phase 3: Add pantry deduction and budget filtering. |

---

### **#7: MEDIUM — Meal Preparation Time & Household Difficulty Metadata**

| Field | Value |
|---|---|
| **Failing Questions** | CB-020, PL-030, CG-083 (contextual recommendation) |
| **Benchmark Score Impact** | +4–6 points per question fixed |
| **Domain** | Cookbook Intelligence + Planner Intelligence |
| **Business Owner** | Cookbook Team + Household Context |
| **Current State** | Some meals have cook time; no "difficulty for household" or "best night of week" signals |
| **Knowledge Required** | **ENRICHMENT** |
| **Specific Gaps** |<br>- Prep/cook time not reliably populated (CB-015: Filtering for 30-min meals returns sparse results) <br>- No difficulty/skill level per household member <br>- No meal-to-schedule fit (some meals better for busy nights) <br>- Learning curve: which meals become easier with repetition |
| **Evidence Expected** | Meal timing metadata (prep/cook/total), difficulty scale, optimal weekday/context |
| **Why This Blocks Users** | "What can I cook tonight?" without knowing time constraints feels generic. Context makes recommendations trusted. |
| **Y1 Implementation** | Phase 1: Audit/complete meal timing data. Phase 2: Build difficulty model. Phase 3: Integrate into recommendation rank. |

---

### **#8: MEDIUM — Household Member Preference & Participation Model**

| Field | Value |
|---|---|
| **Failing Questions** | PH-004, PH-005, CB-013, PL-033 |
| **Benchmark Score Impact** | +4–6 points per question fixed |
| **Domain** | Household Intelligence + Profile Intelligence |
| **Business Owner** | Household Team + Profile Team |
| **Current State** | Household members listed; individual preferences not scoped or ranked |
| **Knowledge Required** | **ENRICHMENT + NEW** |
| **Specific Gaps** |<br>- No per-member dietary restriction/allergy isolation (PH-004: Cannot identify most-restricted member easily) <br>- No participation prediction for component meals (PL-033: "Which adaptations needed?" unanswered) <br>- Learning from accepted/rejected meals per member not tracked <br>- Shared-meal vs individual-plate strategy not captured |
| **Evidence Expected** | Household member profiles, restriction scope per member, meal preference signals, component-meal templates |
| **Why This Blocks Users** | Mixed-diet households (vegan + meat-eater) feel unsupported. No meaningful household-level guidance. |
| **Y1 Implementation** | Phase 1: Build member profile schema. Phase 2: Implement preference learning. Phase 3: Build shared-meal + component templates. |

---

### **#9: MEDIUM — Ingredient Substitute & Dietary Adaptation Rules**

| Field | Value |
|---|---|
| **Failing Questions** | CB-013, PL-031, CG-084 |
| **Benchmark Score Impact** | +4–6 points per question fixed |
| **Domain** | Food Intelligence + Planner Intelligence |
| **Business Owner** | Food Knowledge Team + Planner Team |
| **Current State** | No systematic rules for swapping ingredients (e.g., "vegan → replace butter with coconut oil") |
| **Knowledge Required** | **NEW** |
| **Specific Gaps** |<br>- No ingredient-swap DSL or library <br>- No diet-to-ingredient-set mapping (vegetarian → exclude meat, not just list vegetables) <br>- Picky-eater handling not structured (CG-084: No alternative suggestions) <br>- Adaptation safety rules not defined |
| **Evidence Expected** | Substitute mappings, diet rule definitions, adaptation success signals, family behavior patterns |
| **Why This Blocks Users** | "How can I adapt this meal for my daughter?" feels unanswerable. Guidance lacks permission-aware transformations. |
| **Y1 Implementation** | Phase 1: Build ingredient-substitute library. Phase 2: Implement diet-to-rule engine. Phase 3: Learn acceptance patterns. |

---

### **#10: MEDIUM — Planner Active-Week Resolution & Date Mapping**

| Field | Value |
|---|---|
| **Failing Questions** | PL-024, PL-023 |
| **Benchmark Score Impact** | +4–6 points per question fixed |
| **Domain** | Planner Intelligence |
| **Business Owner** | Planner Team |
| **Current State** | Planner retrieves data; date-to-week mapping fails (user timezone, "this week" ambiguity) |
| **Knowledge Required** | **ENRICHMENT** |
| **Specific Gaps** |<br>- No user timezone default or context propagation (PL-024: "tonight" date unresolved) <br>- Active-week heuristic weak (if multiple week plans, which is current?) <br>- Empty-slot fallback suggestions not stored <br>- Week boundary logic not deterministic across households |
| **Evidence Expected** | Household timezone, plan activity state (archived/draft/active), week boundary rules |
| **Why This Blocks Users** | "What am I having for dinner tonight?" fails silently or returns wrong date. Foundational usability issue. |
| **Y1 Implementation** | Phase 1: Add timezone to household config. Phase 2: Fix week-resolution logic. Phase 3: Implement active-plan heuristic. |

---

### **#11: MEDIUM — Product-to-Supermarket Availability & Pricing**

| Field | Value |
|---|---|
| **Failing Questions** | PH-006, SH-037, SH-041 |
| **Benchmark Score Impact** | +4–6 points per question fixed |
| **Domain** | Product Intelligence + Shopping Intelligence |
| **Business Owner** | Product Team + Shopping Team |
| **Current State** | Products and prices exist; no store-specific availability or price confidence |
| **Knowledge Required** | **ENRICHMENT + NEW** |
| **Specific Gaps** |<br>- No product-store availability matrix (SH-037: Fake products matched to stores) <br>- Pricing confidence not tracked (SH-041: Cannot safely suggest cheaper swaps) <br>- Supermarket selection not linked to product recommendations (PH-006: Cannot explain budget choice) <br>- Price freshness/staleness not flagged |
| **Evidence Expected** | Product-store mappings with confidence, price history, store coverage by household preference |
| **Why This Blocks Users** | Shopping list suggestions feel unreliable. Cheap swaps may not exist at user's store. Trust erodes. |
| **Y1 Implementation** | Phase 1: Build product-store availability index. Phase 2: Implement pricing confidence. Phase 3: Integrate into shopping recommendations. |

---

### **#12: MEDIUM — Nutrition Report & Meal Quality Scoring**

| Field | Value |
|---|---|
| **Failing Questions** | CB-016, CB-017, FK-078, FK-080, FK-082 |
| **Benchmark Score Impact** | +3–5 points per question fixed |
| **Domain** | Nutrition Intelligence + Food Knowledge |
| **Business Owner** | Nutrition Team + Food Knowledge Team |
| **Current State** | Nutrition data available; scoring/ranking by UPF/diversity/macro not reliable |
| **Knowledge Required** | **ENRICHMENT** |
| **Specific Gaps** |<br>- UPF/NOVA scoring not systematically applied (CB-016: Protein ranking by name only) <br>- Whole-food indicators incomplete (CB-017: Cannot rank by processing level) <br>- Diversity scoring algorithm not defined (FK-078: No "gut health" food basket) <br>- Macro recommendation not personalized to household goals (FK-082: Iron/B12 suggestions generic) |
| **Evidence Expected** | Meal UPF/apple scores, ingredient processing levels, nutrient contribution by food category, goal-aligned recommendation algorithms |
| **Why This Blocks Users** | Nutrition guidance feels disconnected from data. Users doubt whether improvements are real. |
| **Y1 Implementation** | Phase 1: Implement UPF/NOVA scoring at scale. Phase 2: Build whole-food taxonomy. Phase 3: Integrate goal-aware ranking. |

---

### **#13: LOW — Companion Guidance & Personality Consistency Signals**

| Field | Value |
|---|---|
| **Failing Questions** | CG-090, CG-088 |
| **Benchmark Score Impact** | +3–4 points per question fixed |
| **Domain** | Companion Platform + Personality Registry |
| **Business Owner** | Companion Team |
| **Current State** | Generic celebratory language; no specific meal/food call-outs. Personality registry incomplete. |
| **Knowledge Required** | **ENRICHMENT** |
| **Specific Gaps** |<br>- No celebration pattern library (CG-090: Generic "well done" instead of specific praise) <br>- Personality trait mapping incomplete (CG-088: Consistency across Chef/Coach/Friend not enforced) <br>- Evidence selection for reinforcement not systematic |
| **Evidence Expected** | Celebration templates, personality voice profiles, evidence-linkage rules |
| **Why This Blocks Users** | Companion feels like a generic bot, not a trusted household advisor. Personal connection erodes. |
| **Y1 Implementation** | Phase 1: Build celebration pattern library. Phase 2: Strengthen personality registry. Phase 3: Test consistency at scale. |

---

### **#14: LOW — Profile Data Completeness & Self-Assessment**

| Field | Value |
|---|---|
| **Failing Questions** | PH-009, TS-091 |
| **Benchmark Score Impact** | +2–3 points per question fixed |
| **Domain** | Profile Intelligence |
| **Business Owner** | Profile Team |
| **Current State** | Profile exists; no systematic gap enumeration or priority ranking of missing data |
| **Knowledge Required** | **ENRICHMENT** |
| **Specific Gaps** |<br>- No "profile completeness score" or guidance (PH-009: Listing gaps is manual, not prioritized) <br>- Gap impact not ranked (which missing field blocks most benefit?) <br>- Onboarding flow not optimized for high-value data collection |
| **Evidence Expected** | Completeness scoring algorithm, gap-priority definitions, usage telemetry on which fields matter most |
| **Why This Blocks Users** | Profile setup feels tedious and open-ended. Users don't know what's valuable. |
| **Y1 Implementation** | Phase 1: Implement completeness scoring. Phase 2: Rank gaps by impact. Phase 3: A/B test guided onboarding. |

---

## Cross-Cutting Knowledge Themes

### Theme 1: **Data Completeness & Metadata Hydration**
**Questions Affected:** CB-018, ND-058, CG-087, CB-016, FK-073

The Companion's largest factual correctness gap is **incomplete meal and food metadata**. Ingredients, nutritional values, and category tags are missing or low-confidence. This is not an architecture problem—it's a **data curation problem**.

**Action:** Audit meal library and food knowledge for missing fields. Establish SLOs for metadata completeness (e.g., 95% of meals have ingredients, 85% have nutrition).

---

### Theme 2: **Cross-Domain Index Gaps**
**Questions Affected:** ND-058, PL-032, SH-042, PL-031

Planner, nutrition, shopping, and household are stored in silos. No efficient way to ask "what's in my plan + how healthy is it?" without expensive joins.

**Action:** Build cross-domain views or graph indexes for planner↔nutrition, shopping↔planner, household↔restrictions. Prioritize planner-to-nutrition.

---

### Theme 3: **Safety & Permission Scope**
**Questions Affected:** TS-092, PR-070, SH-042, TS-097

Allergen and restriction handling is treated as fallback logic ("I don't know your allergies"). Without a deterministic rule engine, the Companion must emit uncertainty on every safety question.

**Action:** Define allergen/restriction rule DSL. Build rule evaluator in safety boundary. Audit product/meal allergen data.

---

### Theme 4: **Personalization & Learning**
**Questions Affected:** CG-087, CG-090, PL-027, CB-013

The Companion offers generic guidance ("add vegetables") without learning from household preferences or constraints.

**Action:** Implement preference signal capture (accepted/rejected recommendations). Build household learning loops. Personalize by family, not generic rules.

---

## Summary: Knowledge Backlog by Domain

| Domain | Failing Questions | Top 3 Priorities | Year 1 Effort |
|---|---|---|---|
| **Cookbook** | CB-018, CB-013, CB-015, CB-020 | Ingredient completeness, meal-to-meal filtering, difficulty/time metadata | Medium |
| **Nutrition** | ND-058, ND-059, FK-* | Meal nutrition hydration, uplift patterns, evidence ledger | High |
| **Planner** | PL-024, PL-027, PL-032, PL-031 | Date resolution, variety/repeat detection, nutrition cross-ref | Medium |
| **Shopping** | SH-042, SH-037, SH-041 | Item-to-allergen mapping, store availability, price confidence | Medium |
| **Household** | PH-004, PH-005, PH-006 | Member profiles, participation model, zone setup | Low-Medium |
| **Food Knowledge** | FK-073, FK-074, FK-075, FK-082 | Evidence ledger, benefit-to-food mapping, claim traceability | High |
| **Product Intelligence** | PR-070, SH-037 | Product-store availability, allergen scoring | Medium |
| **Companion Guidance** | CG-087, CG-090, CG-088 | Uplift library, celebration patterns, personality consistency | Low |

---

## Recommended Year 1 Implementation Roadmap

### **Phase 1 (Weeks 1–4): Foundation — Data Audits & Enablement**
- [ ] Audit meal library: ingredient % complete, nutrition % complete, salmon tagging
- [ ] Audit product catalog: allergen % known, store availability % mapped
- [ ] Audit food knowledge: claim-to-evidence % linked
- [ ] Output: Completeness reports and prioritized enrichment tasks

### **Phase 2 (Weeks 5–12): Critical Knowledge — Safety & Planner**
- [ ] Implement allergen/restriction rule engine (safety-boundary capability)
- [ ] Fix planner date resolution (active week, timezone)
- [ ] Build planner→nutrition index (enable meal ranking & variety detection)
- [ ] Output: TS-092, PL-024, PL-027, PL-032 improve to B/C grades

### **Phase 3 (Weeks 13–20): Nutrition & Guidance — Evidence & Uplift**
- [ ] Build evidence ledger for food benefits (source, confidence, claim trace)
- [ ] Implement uplift pattern library (50–100 additions/swaps)
- [ ] Hydrate meal nutrition from USDA/partners where incomplete
- [ ] Output: ND-058, ND-059, FK-*, CG-087 improve to B/C grades

### **Phase 4 (Weeks 21–26): Household Personalization — Member & Preference Model**
- [ ] Build household member preference profiles
- [ ] Implement ingredient-substitute DSL
- [ ] Optimize product-store availability index
- [ ] Output: Remaining failing questions improve to C or honest-gap boundary

---

## Knowledge Backlog Success Criteria

- [ ] **D1 (Factual Correctness)** improves from 66% to 75%+ (estimated +9 points)
- [ ] **D4 (Capability Routing)** improves from 74% to 82%+ (estimated +8 points)
- [ ] **Overall Intelligence Score** improves from 76.7 to 85+
- [ ] **Failing questions:** None below 70/100; most move to B (80–89) or strong C (75–79)
- [ ] **No regression:** Benchmark questions currently passing remain ≥ 70/100

---

## Next Steps (Outside INT41 Scope)

1. **INTQ12:** Plan Phase 1 data audits (ownership, schedule, tooling)
2. **INTQ13:** Design allergen/restriction rule DSL and safety evaluator
3. **INTQ14:** Implement planner-to-nutrition cross-reference index
4. **INTQ15:** Source & curate evidence ledger for top 50 foods
5. **INTQ16:** Build uplift pattern library and household learning loops

---

**Investigation Completion Date:** 2026-07-07  
**Prepared by:** Claude Code  
**Related:** [[INTQ3_COMPANION_BENCHMARK_100_EXECUTION]] · [[BENCHMARK_FRAMEWORK_v1.1]] · [[KNOWLEDGE_ARCHITECTURE_REGISTER]]
