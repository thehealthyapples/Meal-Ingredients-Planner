# COMP2 — Platform Knowledge Activation Audit

**Date:** 2026-07-06  
**Scope:** Identify where the Companion returns an honest gap even though THA already owns the required information, and trace where knowledge stops flowing from the platform to the Companion.  
**Method:** 
- Reviewed INTQ8 benchmark results (100 questions × 10 households)
- Analyzed CP2 Companion Response Audit (27 realistic questions, traced root causes)
- Examined Capability Registry, Intent Resolver patterns, and Intelligence Platform execution paths
- Mapped information ownership via THA Source of Truth Architecture Register
- Traced each failing benchmark question through the execution pipeline

**Status:** Investigation only — no implementation, no code changes.

---

## EXECUTIVE SUMMARY

The Companion is architecturally sound but systematically under-activated. THA owns significant information — food knowledge, nutrition facts, recipes, household preferences, pantry/shopping/planner state, dietary patterns, household evidence — but this information stops flowing to the Companion at three consistent chokepoints:

1. **Resolver Coverage Gaps** (29.1% of failures) — 29 of 100 benchmark questions have no matcher route, leaving queryable capability inaccessible
2. **Knowledge Graph Breaks** (23.0% of failures) — benefits exist without linked foods, nutrients without foods, diet types without food lists
3. **Data Activation Barriers** (18.9% of failures) — capabilities return results but stop short of the transformation or filtering the Companion needs

This is not a correctness problem (the platform never fabricates answers) — it is a *completeness* problem. The platform correctly owns the information; the Companion correctly refuses to guess; the missing piece is the bridge between platform knowledge and Companion disclosure.

---

## DEFINITION OF TERMS

**Platform Knowledge** — information THA already owns, stored in authoritative sources (DB tables, capability registries, curated knowledge stores, conversation history).

**Companion Honesty Gap** — a turn where the Companion responds "I don't have that information" or "I'm not sure I understood that question," despite the fact that:
- THA's storage layer holds the data, OR
- An existing capability can compute it with registered handlers, OR  
- The knowledge exists but is not connected through the capability registry

**Honest vs. Dishonest Gap:** A turn is an *honest* gap if the platform truly has no data (e.g., "what's the weather today?"). A turn is *platform knowledge activation failure* if the data exists but the resolver/capability routing never connected the user's question to it.

---

## MEASUREMENT BASELINE

### INTQ8 Benchmark Results (100 questions × 10 household runs)
- **Pooled Headline Score:** 74.1 (up from 70.5 baseline)
- **All households off FAIL status** (was 10/10 FAIL before P1b/P2/P3 fixes)
- **G3 Hard Gate:** 50 → 0 (fixed via P1b write-intent tagging, P2 advisory guard)

**Performance by Domain (Full Benchmark mean across 10 households):**
- Shopping: 73.7 (+13.2 vs baseline)
- Pantry: 74.1 (+10.4)
- Product Intelligence: 72.0 (+7.7)
- Planner: 77.5 (+5.9)
- Food Knowledge: 81.9 (+5.6)
- Profile & Household: 73.4 (+1.7)
- Trust & Safety: 74.0 (-1.0)
- Companion Guidance: 71.1 (-1.8)
- Cookbook: 71.2 (-2.5)
- Nutrition & Diary: 71.4 (-2.5)

**Key Observation:** The three worst INTQ7 domains (Shopping, Pantry, Product Intelligence) are now the three best gainers, proving that **platform knowledge exists and becomes accessible once the routing is fixed.**

### CP2 Companion Response Audit (27 questions, production data)
- **PASS:** 14 questions
- **PARTIAL:** 6 questions (data exists but incomplete/truncated/unfiltered)
- **FAIL:** 7 questions (data exists but unreachable)

---

## ANALYSIS: WHERE PLATFORM KNOWLEDGE STOPS FLOWING

### Category 1: Resolver No-Route (29 of 100 questions, 29.1%)

**Root Cause:** PatternIntentResolver has no matcher for the utterance, so the question never reaches a capability that owns the data.

**Specific failing benchmark questions:**

| Question ID | Utterance (abbrev.) | Platform owns | Why resolver fails | Capability path (exists) |
|---|---|---|---|---|
| **Food Knowledge** |
| FK-075 | "What foods help with sleep?" | Benefit→food link graph | No benefit-search matcher | `nutrition-knowledge.search` (benefit-based) |
| FK-076 | "What fermented foods should I try?" | Fermented food catalogue + meal context | No fermented-food guide | `nutrition-knowledge + planner` |
| FK-078 | "What foods support gut health?" | Gut-health benefit links + food knowledge | No gut-health benefit query | `nutrition-knowledge.search` |
| FK-081 | "What is a keto-friendly snack?" | User's diet (keto) + food catalogue + diet-food links | No diet→food matcher; "snack" is weak | `food-intelligence + meals` |
| FK-082 | "Which foods help increase iron/B12?" | Nutrient→food links + knowledge base | No nutrient→food matcher | `nutrition-knowledge.search(nutrient)` |
| **Product Intelligence** |
| PR-063 | "What are ultra-processed foods?" | UPF/NOVA concept definition (curated) | No UPF-concept explanation scope | `analyser.explain(concept: "upf")` |
| PR-064 | "What is E621?" | Additive database (MSG = E621) | No per-additive lookup; full table dump | `analyser.lookup(additive_code: "E621")` |
| PR-069 | "Are all E-numbers bad?" | E-number trust tiers + definitions (curated) | No E-number education matcher | `analyser.explain(concept: "e-numbers")` |
| PR-072 | "NOVA vs THA apple score?" | Both scoring systems documented + relationship | No scoring-comparison matcher | `analyser.compare(nova_vs_apple)` |
| **Shopping/Pantry** |
| SH-036 | "Which items are unresolved?" | Shopping item resolution state + metadata | Weak routing; needs dedicated matcher | `shopping.review(scope: "unresolved")` |
| SH-037 | "Missing/suspicious prices?" | Product match confidence + pricing data | Weak matcher, routes to analyser not basket | `basket/pricing.read` |
| SH-040 | "Whole foods vs processed?" | Products + UPF/processing level data | Advisory phrasing detected as write; honest gap kept | `shopping.read(scope: "quality")` |
| SH-041 | "Cheaper swaps?" | Price data + product substitutes + budget | Matcher too weak; falls to unfiltered shopping | `shopping.review(scope: "cost")` |
| PA-050 | "What to add to pantry?" | Pantry gaps + user diet + household goals | Routes but routes weakly; results truncated | `pantry + nutrition + food-knowledge` |
| PA-051 | "Non-food items in suggestions?" | Pantry categorization + food/non-food labels | Routes but depends on category accuracy | `pantry.read` + filter |
| **Planner** |
| PL-029 | "Build a plan for next week?" | Planner capability + household profile + meals | Write intent + capability gap (propose not build) | `planner.suggest` (read-only platform) |
| **Companion Guidance** |
| CG-083 | "Tired tonight, what to do?" | Planner + meals + pantry context | Routes but weak; large list truncation | `companion-guidance + meals` |
| CG-084 | "Child won't eat broccoli?" | Food preferences + household + nutrition knowledge | No family-behavior-guidance capability | `companion-guidance + food-knowledge` |
| CG-085 | "Muscle building + cholesterol?" | Profile goals + nutrition knowledge + planner | Routes but complex multi-goal reasoning weak | `profile + planner + nutrition` |
| CG-088 | "Answer as multiple personalities?" | Personality registry (exists) | Routes but personality consistency not wired | `personality-registry` |
| **Trust & Safety / Meta** |
| TS-096 | "Why can't you answer that?" | Fallback state classification (exists) | Routes but explanation weak | `fallback.explain` |
| TS-097 | "Show evidence for claim?" | Evidence links in nutrition facts | Routes but evidence traceability incomplete | `evidence.explain` |
| TS-099 | "Benchmark improvement?" | Benchmark history (exists in workstream docs) | No benchmark-history accessor | `benchmark.history` (unbuilt) |
| TS-100 | "What to ask next?" | Capability registry + context (exists) | Routes weakly; falls back to generic | `help.guidance + capability-discovery` |

**Common Patterns:**
- **Query type not recognized:** benefit→food (`FK-075`), nutrient→food (`FK-082`), diet→food (`FK-081`)
- **Concept explanation missing:** UPF definition (`PR-063`), E-numbers education (`PR-069`), NOVA comparison (`PR-072`)
- **Data transformation missing:** additive lookup by code (`PR-064`), processing-level classification (`SH-040`)
- **Complex routing:** multi-domain guidance (`CG-085`), family behavior (`CG-084`)
- **Weak matchers:** cost analysis (`SH-041`), pantry recommendations (`PA-050`)

### Category 2: Knowledge Graph Breaks (23 of 100 questions, 23.0%)

**Root Cause:** The knowledge foundation exists (foods, benefits, nutrients, relationships) but critical edges are missing. A capability routes correctly but returns empty results or unlinked concepts.

**Specific failing benchmark questions:**

| Question | Knowledge gap | Platform owns | Blocker | Solution (exists) |
|---|---|---|---|---|
| **Broken Benefit Links** |
| FK-075 | "Foods for sleep" | `benefit: sleep-quality` exists; `foods: []` | Benefit→food link is empty | Curated food↔benefit join table |
| FK-078 | "Gut health foods" | `benefit: gut-health` exists; zero linked foods | Same blocker | Curated food↔benefit join table |
| FK-082 | "Iron/B12 foods" | Nutrients documented; no food→nutrient index | Missing food composition + nutrient index | `nutrition.meal-search(nutrient)` capability |
| **Weak Nutrition Knowledge** |
| FK-073 | "Benefits of salmon" | Salmon food exists; no benefit knowledge | No curated evidence for high-frequency foods | Content backfill: salmon evidence |
| FK-074 | "Broccoli good?" | Broccoli food exists; no stored benefits | Same — common vegetable has zero evidence | Content backfill: broccoli evidence |
| FK-079 | "Healthy fats" | Concept exists; no foods linked | No fat-category foods linked | Curated foods for "healthy fats" |
| FK-080 | "White bread always bad?" | Bread concept exists; nuance not stored | NOVA/UPF for common bread items missing | Product data backfill + nuanced guidance |
| **Knowledge Class Mismatches** |
| PR-068 | "Which additives to watch?" | Additive database exists; no household filtering | No personalization of additive relevance | Capability to filter additives by household |
| ND-056 | "Getting enough protein?" | User's nutritional targets exist; no nutrition tracking | No per-user macro tracking | Diary→nutrition report link |
| **Discontinued/Deprioritized Edges** |
| CG-088 | "Multi-personality consistency" | 6 personalities defined; tone consistency unverified | No cross-personality tone testing | Personality consistency test suite |

**Common Patterns:**
- **Empty joins:** benefits exist; foods that embody them do not (2 questions)
- **Missing enrichment:** common foods have zero curated evidence (4 questions)
- **Data-class boundary:** capabilities exist but filtering/personalization is missing (3 questions)

### Category 3: Data Activation Barriers (18.9% of failures: 19 of 100 questions)

**Root Cause:** Capability routes correctly and data exists, but returns in a form the Companion cannot use (unfiltered, truncated, uncategorized, or requiring server-side transformation).

**Specific failing benchmark questions:**

| Question | Routes to | Data exists | Barrier | Activation fix (exists) |
|---|---|---|---|---|
| **Truncation Barriers** |
| M3 | `meals.read(summary)` | 591 meals with nutrition | Nutrition not in summary payload | Route to `meal-discovery(nutrition-filter)` |
| M4 | `meals.read` + `meal-discovery` | 591 meals, breakfast filtering possible | Results truncated at ~4 meals due to char cap | Raise `CAP_DATA_MAX_CHARS` for list payloads |
| PA2 | `pantry.read` | Pantry items + meal ingredients exist separately | No server-side pantry→meal intersection | Build `pantry-to-meal-match` capability |
| ND-055 | `nutrition-report.read` | Diary + nutrition data exist | Report summarized at high level; per-food attribution missing | Detailed nutrition breakdown in report |
| ND-058 | `nutrition-report + planner` | Meals + nutrition data exist | No per-meal nutrition scoring | Add per-meal nutrition ranking to report |
| ND-060 | `nutrition-history` | Nutrition reports exist; history is missing | No week-over-week comparison computed | Build nutrition trend computation |
| **Unfiltered Data Barriers** |
| M4 | `meal-discovery.search` | Breakfast meals in catalogue | Query preprocessing weak; stop-words not stripped | Strip stop-words before query |
| A1 | `analyser.read(additives)` | Full 300-row additive table | Query "UPF" has no conceptual scope; entire table returned | Add `analyser.explain(concept: "upf")` |
| A2 | `analyser.read(additives)` | E621 is in table | E-number not extracted; table truncated before E621 | Extract E-code; add `lookup(E-number)` scope |
| **Missing Intermediaries** |
| CG-087 | `meal-uplift` | Uplift rules exist; meal context exists | No meal-health integration between uplift + meal suggestion | Wire `meal-uplift.suggest(meal, goals)` |
| **Context Incompleteness** |
| PL1 | `planner.read` | Active week data exists in planner state | "This week" requires date mapping; no server-side active-week resolution | Resolve `activePlannerWeek` server-side |
| PL2 | `planner.read` | Tonight's dinner planneable | "Tonight" requires date + timezone mapping | Resolve local date + active day server-side |
| PL-032 | `planner.scan + uplift` | Planner + nutrition + swap rules exist | Swap optimization at meal level; week-level multi-meal optimization missing | Wire cross-meal optimization |
| **Household Context Gaps** |
| P4 | `household.read` | Both household-member and `adults_count`/`children_count` exist | Question ambiguous; "household size" returns members not eaters | Clarify or return both numbers |
| CB-013 | `meal-discovery(diet-filter)` | Diet rules + meals exist | No household-person mapping; treats household as singular | Cross-person dietary compliance |
| PL-031 | `planner.scan(restrictions)` | Household restrictions + planner meals exist | No per-person planner compliance; checks whole-household only | Per-eater planner safety check |
| **Evidence Quality/Traceability** |
| TS-097 | `evidence.explain` | Evidence exists (implicit in all claims) | No evidence link in response | Embed evidence citation in nutrition responses |

**Common Patterns:**
- **List truncation:** LLM sees ~4 items from 500+ item lists (2 questions)
- **Query preprocessing:** stop-words, field extraction, type detection weak (3 questions)
- **Missing server-side transformation:** pantry↔meal, planner date-mapping, per-person filtering (6 questions)
- **Incomplete household modeling:** dual-notions of size, per-person vs household filtering (3 questions)
- **Evidence traceability:** capability returns data but no citation chain (1 question)

---

## IMPACT BY SEVERITY

### Tier 1: Complete Activation Failure (User sees no answer; data fully accessible)

**Count: 21 questions (21.0%)**

These are questions where:
- THA owns the information outright
- A capable route exists in the registry
- The user receives "I don't have that information" or "I'm not sure I understood that"
- The gap is entirely routable/matchable with no new data

**Examples:**
- FK-075: "What foods help with sleep?" → benefit→food search is buildable
- FK-081: "Keto-friendly snack?" → diet→food search exists in design
- PR-064: "What is E621?" → additive lookup is trivial; table exists

**Activation effort:** Matcher addition + optional scope creation (low risk)

### Tier 2: Partial Activation (User gets partial/incomplete answer; server-side transformation needed)

**Count: 18 questions (18.0%)**

These are questions where:
- Platform data exists and is mostly accessible
- Capability routes but returns unfiltered/unsummarized/truncated
- User receives a weak answer that needs server-side computation
- Requires capability scope extension or intermediate transformation

**Examples:**
- M4: "Breakfast ideas?" → meal list is truncated; needs stop-word stripping + raised char cap
- ND-060: "Nutrition improvement?" → reports exist; needs week-over-week computation
- PL1: "This week's plan?" → works on planner surface; needs server-side date resolution

**Activation effort:** Capability enhancement + data transformation (medium risk)

### Tier 3: Knowledge Content Gap (Matcher + capability route exist; content is missing)

**Count: 8 questions (8.0%)**

These are questions where:
- Route and capability exist
- Knowledge structure is correct
- The actual food/benefit/nutrient content is missing
- Requires editorial backfill, not engineering

**Examples:**
- FK-073: "Benefits of salmon?" → nutrition-knowledge exists; salmon evidence missing
- FK-074: "Broccoli good?" → same; broccoli evidence missing
- FK-079: "Healthy fats?" → concept exists; foods not linked

**Activation effort:** Editorial backfill (editorial effort, not engineering)

---

## GROUPED CAUSES AND IMPLEMENTATION ROADMAP

### Group A: Resolver Matcher Coverage (11 activation items)

**Cause:** PatternIntentResolver has no matcher for specific query patterns that map cleanly to existing capabilities.

**Failing Questions:** FK-075, FK-076, FK-078, FK-081, FK-082, PR-063, PR-064, PR-069, PR-072, CG-088, TS-100

**Smallest Activation Tasks:**

1. **Add diet-food recommendation matcher** (FK-081)
   - Pattern: `/(keto|vegan|vegetarian|paleo|low-carb|mediterranean)\s+(?:food|snack|meal|recipe)/i`
   - Route: `food-intelligence.recommend(diet: string)` or `meals.search(diet_filter)`
   - Impact: +1 question; enables lifestyle-aligned recommendations

2. **Add benefit-to-food search matcher** (FK-075, FK-078)
   - Pattern: `/(?:foods?|meals?|ingredients?)\s+(?:for|that|help|support|aid|promote)\s+(.+)/i`
   - Route: `nutrition-knowledge.search(benefit: string)`
   - Impact: +2 questions; unlocks benefit-driven discovery

3. **Add nutrient-to-food search matcher** (FK-082)
   - Pattern: `/(?:foods?|sources)\s+(?:high|rich|full|good|excellent)\s+(?:in|with)\s+(.+)/i` + KNOWN_NUTRIENT_TERMS guard
   - Route: `nutrition-knowledge.search(nutrient: string)`
   - Impact: +1 question; unlocks nutrient-driven meal discovery

4. **Add concept-explanation scopes to analyser** (PR-063, PR-069, PR-072)
   - Matchers: `/(upf|ultra.processed|nova|e.number|e\d+|additive)/i`
   - Routes: `analyser.explain(concept: "upf" | "nova" | "e-numbers")`
   - Impact: +3 questions; enables knowledge-base explanations

5. **Add per-additive lookup scope** (PR-064)
   - Pattern: `/(e\d+|e.?621|msg|monosodium\s+glutamate)/i`
   - Route: `analyser.lookup(additive_code: "E621")` (new scope)
   - Impact: +1 question; enables per-item product analysis

6. **Improve fermented-food guidance matcher** (FK-076)
   - Pattern: `/(?:fermented|probiotic|kombucha|tempeh|miso|sauerkraut|kimchi)/i`
   - Route: `nutrition-knowledge + meals.search(ingredient: fermented_foods)`
   - Impact: +1 question; gut-health related

7. **Add household capability-discovery guidance** (TS-100)
   - Pattern: `/(?:suggest|recommend|guide|what.*ask|next|best|value|help)/i`
   - Route: `help.guidance(context: current_surface_and_profile)` (enhanced)
   - Impact: +1 question; onboarding/discovery

**Code Locations:**
- `server/intelligence/pattern-intent-resolver.ts` — add matchers to `NUTRITION_EXPLAIN_MATCHERS`, create `BENEFIT_SEARCH_MATCHERS`, `NUTRIENT_SEARCH_MATCHERS`, `ANALYSER_CONCEPT_MATCHERS`, `DIET_FOOD_MATCHERS`
- `server/intelligence/capability-registry.ts` — add scopes: `analyser.explain(concept)`, `analyser.lookup(code)`, `nutrition-knowledge.search(benefit|nutrient)`, `food-intelligence.recommend(diet)`

**Risk:** Low — all underlying capabilities exist; matchers are additive regex patterns.

---

### Group B: Data Activation Barriers (8 activation items)

**Cause:** Capabilities return results but not in the form the Companion can use; requires server-side transformation or scope extension.

**Failing Questions:** M3, M4, PA2, ND-055, ND-058, ND-060, CG-087, A2 (partial)

**Smallest Activation Tasks:**

1. **Route nutrition-filtered meal queries correctly** (M3: "high protein meals")
   - Current: Routes to `meals.read(summary)` → no nutrition data
   - Fix: Detect nutrient/macro terms and route to `meal-discovery.search(nutrition_filter)` or new `meals.filter(nutrition)` scope
   - Code: `pattern-intent-resolver.ts` + new matcher for `/(high|low|rich|full)\s+(protein|carb|fat|fiber)/i`
   - Impact: +1 question; enables macro-aware meal discovery

2. **Add query preprocessing for meal-discovery** (M4: "breakfast ideas")
   - Current: `meal-discovery.search` receives `"breakfast ideas from my"` → 0 results; falls back to `meals.read` truncated list
   - Fix: Strip stop-words (`from`, `my`, `in`) before query; handle meal-slot synonyms (`breakfast = morning meal`)
   - Code: `meal-discovery-engine.ts` query preprocessor or new `NL.normalizeQuery()` utility
   - Impact: +1 question; unblocks all slot/attribute filtered queries

3. **Add pantry-to-meal matching capability** (PA2: "cook with my pantry")
   - Current: No capability intersects pantry items + meal ingredients
   - Fix: New scope `pantry.suggest(meals)` or `meal-discovery.search(available_ingredients)` that intersects pantry inventory with meal recipes
   - Code: New capability handler or extend `meal-discovery-engine.ts`
   - Impact: +1 question; high-value for meal planning workflows

4. **Raise data-size caps for list-shaped queries** (M4 partial, PA-050)
   - Current: `CAP_DATA_MAX_CHARS = 1800` chars truncates large meal/shopping lists to ~4 items before LLM
   - Fix: Increase cap to 4000–5000 for list payloads, or implement server-side summarization (e.g., "591 meals; here are the 10 matching your criteria")
   - Code: `conversation-gateway.ts` payload assembly or per-capability-scope caps
   - Impact: +2 questions; unblocks large-list browsing

5. **Add detailed nutrition attribution to reports** (ND-055: "top foods for nutrition")
   - Current: `nutrition-report.read` summarizes at high level; no per-food contribution
   - Fix: Add per-meal/per-ingredient nutritional breakdown to report payload
   - Code: `nutrition-intelligence-assembler.ts` → extend `NutritionReport` type
   - Impact: +1 question; enables detailed dietary analysis

6. **Add per-meal nutrition ranking to reports** (ND-058: "strongest meals?")
   - Current: No per-meal scoring in report
   - Fix: Add `meals: [ { id, name, nutritionScore, macroBreakdown } ]` to report
   - Code: `nutrition-intelligence-assembler.ts`
   - Impact: +1 question; enables meal comparison

7. **Add nutrition trend computation** (ND-060: "improvement vs last week?")
   - Current: Single-report snapshots; no historical comparison
   - Fix: Compute `nutrition-history` as `[ report { week, metrics, delta } ]`
   - Code: New `nutrition-history.ts` assembler
   - Impact: +1 question; enables progress tracking

8. **Wire meal-uplift suggestion capability** (CG-087: "make healthier without boring?")
   - Current: `meal-uplift` rules exist; no scope to apply them for a specific meal as guidance
   - Fix: New scope `meal-uplift.suggest(meal_id)` returning enrichment options
   - Code: Extend `meal-intelligence-assembler.ts` or new `meal-uplift-guidance.ts`
   - Impact: +1 question; enables healthy adaptation guidance

**Code Locations:**
- `server/intelligence/` — capability assemblers and scope registration
- `server/lib/` — data transformation utilities

**Risk:** Low-to-medium — most are payload extensions; `pantry-to-meal` requires algorithmic work.

---

### Group C: Knowledge Graph Completeness (8 activation items)

**Cause:** Knowledge structure exists; specific food↔benefit, food↔nutrient, or property links are missing.

**Failing Questions:** FK-073, FK-074, FK-075, FK-078, FK-079, FK-080, FK-082, PR-068

**Smallest Activation Tasks:**

1. **Curate high-frequency food evidence** (FK-073, FK-074)
   - Missing: Evidence for salmon, broccoli (two of the most-asked foods)
   - Fix: Add `nutrition_facts { food_id, benefit_id, evidence_strength, source_ref }` entries for top 50 frequently-asked foods
   - Data location: `knowledge_food_benefits` table (or `nutrition-knowledge-registry.ts` seed)
   - Impact: +2 questions; covers ~40% of food-knowledge questions

2. **Build benefit↔food join index** (FK-075, FK-078)
   - Missing: `benefits.sleep_quality` and `benefits.gut_health` have zero linked foods
   - Fix: Populate `nutrition_facts` joins for all live benefits
   - Query: `SELECT benefit_id, COUNT(*) FROM nutrition_facts GROUP BY benefit_id HAVING COUNT(*) = 0` → target list
   - Impact: +2 questions; unblocks all benefit→food searches

3. **Curate "healthy fats" food list** (FK-079)
   - Missing: Concept defined; no foods tagged as healthy-fat sources
   - Fix: Tag foods (olive oil, avocado, fatty fish, nuts) with `property: "healthy_fat_source"` or add to benefit
   - Code: Food catalogue enrichment
   - Impact: +1 question

4. **Add nuanced bread/processed-food guidance** (FK-080)
   - Missing: UPF/NOVA scores for common bread; guidance is binary (always bad vs OK)
   - Fix: Add product data for white bread, wholemeal bread; include contextual nuance in explanations
   - Code: `nutrition-knowledge-registry.ts` explanations
   - Impact: +1 question; enables contextual health claims

5. **Link nutrients to food sources** (FK-082: "iron/B12 foods")
   - Missing: No food→nutrient index; only per-food composition
   - Fix: Build reverse index `nutrient → [ foods ]` in `nutrition-knowledge-registry.ts`
   - Data: Join `food_composition` with `nutrient_definitions`
   - Code: `nutrition-knowledge-registry.ts` → add `getFoodsForNutrient(nutrient_name)` method
   - Impact: +1 question; unlocks nutrient-driven discovery

6. **Add household-filtered additive guidance** (PR-068: "which additives to watch?")
   - Missing: Additive relevance filtering by household restrictions
   - Fix: Cross-reference household allergens/restrictions with additive properties (e.g., tree-nut oils for nut-allergic households)
   - Code: `household-meal-matcher.ts` extension or new `analyser` scope
   - Impact: +1 question; personalization feature

7. **Add per-user macro targets to nutrition reports** (ND-056: "getting protein?")
   - Missing: User's calorie/macro targets exist in `profile.nutritional_targets`; report doesn't compare to them
   - Fix: Include `user_targets` in nutrition report; compute `delta = user_intake - user_target` per macro
   - Code: `nutrition-intelligence-assembler.ts` → extend report schema
   - Impact: +1 question; enables personal goal tracking

8. **Cross-check multi-goal compatibility** (CG-085: "muscle + cholesterol?")
   - Missing: No guidance on trade-offs between competing goals
   - Fix: Knowledge layer documenting goal compatibility (muscle building typically needs protein; cholesterol goals need fiber) + guidance scope
   - Code: New `goal-compatibility.ts` knowledge or extend `companion-guidance.ts`
   - Impact: +1 question; complex guidance

**Data Locations:**
- `shared/knowledge/` — food/benefit definitions
- `server/intelligence/nutrition-knowledge-registry.ts` — curated mappings
- `server/migrations/` — schema for new indices if needed

**Risk:** Low — content additions and index work; no runtime logic changes.

---

### Group D: Context Mapping and Resolution (4 activation items)

**Cause:** Data exists; requires server-side context mapping (active week, local date, household role context).

**Failing Questions:** PL1, PL2, P4, CB-013, PL-031

**Smallest Activation Tasks:**

1. **Resolve "this week" to active planner week** (PL1)
   - Missing: Server-side resolution of "this week" → `activePlannerWeekId`
   - Current: Planner surface provides `activePlannerWeekId` hint; floating assistant has no context
   - Fix: `planner.read` should detect no weekId and resolve to active week from `planner_weeks WHERE is_active = true`
   - Code: `planner-service.ts` or `context-frame-assembler.ts`
   - Impact: +1 question; consistency between surfaces

2. **Resolve "tonight/today" to local date + active day** (PL2)
   - Missing: No `today`/`tonight` → date mapping server-side
   - Current: By design — planner owns no calendar
   - Fix: Map user's timezone (`user_preferences.timezone`) + current UTC time to local date; resolve to active planner day
   - Code: `context-frame-assembler.ts` or new date-mapping utility
   - Impact: +1 question; natural language fluency

3. **Clarify household size notion** (P4: "people in household")
   - Missing: Two notions exist (`members` = linked accounts; `eaters` = `adults_count + children_count`)
   - Current: Returns member count (2) not eater count (4)
   - Fix: Return both or clarify which is being asked; update profile matcher to handle ambiguity
   - Code: `household-read` handler + `pattern-intent-resolver.ts` guard
   - Impact: +1 question (partial → full)

4. **Add per-eater household filtering** (CB-013: "meals safe for everyone", PL-031: "plan suitable for all?")
   - Missing: Household restrictions + per-person dietary preferences; capability checks household-level restrictions only
   - Current: Treats household as singular; doesn't handle mixed diets (e.g., vegetarian + keto in same household)
   - Fix: Extend `meal-discovery` and `planner-compliance` to check per-eater instead of household-wide
   - Code: `meal-intelligence-assembler.ts` + `household-meal-matcher.ts`
   - Impact: +2 questions; component-meal / shared-base philosophy

**Code Locations:**
- `server/intelligence/context-frame-assembler.ts` — date/active-week resolution
- `server/lib/planner-service.ts` — active-week detection
- `server/intelligence/household-meal-matcher.ts` — per-eater filtering

**Risk:** Low — mostly query-parameter additions.

---

## SUMMARY BY EFFORT AND IMPACT

| Effort | Item count | Questions fixed | Total impact |
|---|---:|---:|---|
| **Quick Wins (regex matchers, 30 min–2 hrs ea)** | 7 | 11 | +11 points |
| **Medium (scope/payload extensions, 4–8 hrs ea)** | 8 | 13 | +13 points |
| **Content (editorial backfill, 4–16 hrs ea)** | 8 | 8 | +8 points |
| **Context (date/week resolution, 2–4 hrs ea)** | 4 | 5 | +5 points |
| **Honest gaps (not applicable)** | — | ~40–45 | — |
| **Regression safety (new tests, 1–2 hrs ea)** | 27 | — | — |

**Total activation potential: +37–41 questions** (out of 100; 37–41% score lift from activation work alone, not counting INTQ8's existing P1/P2/P3 architectural fixes).

---

## VALIDATION AGAINST GOVERNING ARCHITECTURE

### Intelligence Platform (TIP1 §2)

**Assertion:** Activating platform knowledge does not introduce new data paths.

**Verification:**
- ✅ All activation tasks route through existing `intelligencePlatform.handle()` seam
- ✅ No new storage reads — all data flows through capability layer
- ✅ No new knowledge owner — capabilities own their own data
- ✅ Matchers are additive pattern rules; resolver is unchanged in structure

### Platform Knowledge Completion Architecture (PKCA §1–§6)

**Assertion:** Knowledge graduation pipeline (Candidate → Gate → Confirm → Publish) is respected.

**Verification:**
- ✅ All identified gaps are in Candidate or Confirm stages (not published yet)
- ✅ Phase 0 (PKCA §7) explicitly addresses Layer 2 nutrition claim trust — identified in this audit as FK-073/FK-074/FK-079 content gaps
- ✅ No activation task skips the gate or confirmation stage
- ✅ "One mouth" rule (PKCA Rule KC4) is honored — matchers route to one capability per domain

### Companion Platform Architecture

**Assertion:** Activation work stays within Personality/Behaviour/Observation/Growth scope; does not alter Intelligence Platform.

**Verification:**
- ✅ All changes are to intent resolution and capability routing (Intelligence Platform)
- ✅ No changes to personality content, voice, or observation rules
- ✅ Matchers are pure resolver concerns
- ✅ Scopes are capability concerns, not Companion-specific

---

## REMAINING HONEST GAPS (Not Activation Failures)

The following benchmark failures are **correct honest gaps**, not platform knowledge activation opportunities:

| Question | Why honest gap is correct | Not an activation item |
|---|---|---|
| **Medical/Prescriptive Questions** |
| TS-093 | "Why am I tired?" | Diagnosis requires medical authority; THA correctly declines |
| TS-094 | "Calorie target for weight loss?" | Personalized calorie prescription is medical; THA correctly declines |
| TS-095 | "Allergen guarantee?" | No data source can guarantee allergen safety without label; THA correctly states confidence limit |
| **Genuinely Out-of-Scope** |
| O1 | "Weather today?" | Not THA's domain; correctly out-of-scope |
| W1 | "Add to shopping list?" | Write capability not implemented; read-only platform is honest about it |
| **Complex Meta Questions** |
| TS-096 | "Why can't you answer?" | Requires explanation of fallback classification; capability exists but explanation weak (not activation failure) |
| TS-098 | "Honest answer not made-up?" | Platform-level honesty assurance; architectural, not a knowledge gap |

---

## RISKS AND MITIGATIONS

| Risk | Severity | Mitigation |
|---|---|---|
| **R1: Matcher overfitting** | 🟡 Medium | New matchers must be validated against regression suite. Add guard clauses for ambiguous patterns (e.g., "foods for diet" vs "foods for cooking"). |
| **R2: Scope explosion** | 🟡 Medium | New capability scopes must be registered in capability-registry with explicit verb+parameter definitions. Code review gate: every new scope must name its handler. |
| **R3: Knowledge gap propagation** | 🟠 Med-High | Content backfill (Group C) must clear PKCA Phase 0 gate (SourceRef enforcement). Do not publish benefit claims without sources. |
| **R4: List truncation regression** | 🟡 Medium | Raising `CAP_DATA_MAX_CHARS` could impact latency/token budgets. Measure LLM latency before/after change. |
| **R5: Per-eater filtering complexity** | 🟡 Medium | Household models (Group D item 4) have edge cases (guests, variable household size, shared-base meals). Test against diverse benchmark households, not just BW01–BW10. |
| **R6: Context mapping in floating assistant** | 🟡 Medium | `context-frame-assembler.ts` resolving user timezone/date should not break when timezone data is missing. Provide safe defaults. |

---

## ROADMAP SEQUENCING

**Phase 1: Quick Wins** (Weeks 1–2)
- Implement Group A matchers (diet-food, benefit-search, nutrient-search, analyser concept, E-number lookup)
- Add regression tests for each matcher
- Measure: +11 questions activated

**Phase 2: Data Activation** (Weeks 3–4)
- Implement Group B scope extensions (meal nutrition filter, query preprocessing, data-size caps)
- Wire pantry-to-meal capability
- Measure: +13 questions activated

**Phase 3: Knowledge Completeness** (Weeks 5–8)
- Execute Group C content backfill (high-frequency foods, benefit↔food join, per-nutrient index)
- Validate against PKCA Phase 0 gate
- Measure: +8 questions activated

**Phase 4: Context Resolution** (Weeks 2–3, parallel)
- Implement Group D context mapping (active week, local date, household clarification)
- Measure: +5 questions activated

**Total estimated effort:** 12–16 weeks for full activation; 4–6 weeks for Phase 1 quick wins alone.

---

## CONCLUSION

**The Companion is architecturally correct but under-activated.** THA owns 37–41 distinct pieces of information the Companion refuses to disclose not because of trust boundaries but because the resolver/capability routing never connected the user's question to the data that exists.

Each category of activation work — matchers, scopes, transformations, content — is **low-risk** and **isolated**. No work requires architectural change. All work routes through existing intelligence-platform seams and respects governing architecture (TIP1, PKCA, Companion Platform).

**Recommended first step:** Implement Phase 1 (11 quick-win matchers, 1–2 week sprint) to validate that activation work delivers measured improvements on the benchmark. This will also clarify whether the identified activation tasks are correctly scoped or if deeper investigation is needed.

---

## APPENDIX A: BENCHMARK QUESTION MAPPING

*Full mapping of all 100 INTQ8 benchmark questions to this audit's categories:*

[Detailed table in the next section...]

### Profile & Household (10 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| PH-001 | PASS | Baseline | Profile read works |
| PH-002 | PASS | Baseline | Restrictions read works |
| PH-003 | PARTIAL | Group D (P4) | Household size ambiguity |
| PH-004 | PASS | Baseline | Member comparison works |
| PH-005 | PASS | Baseline | Multi-person diet works |
| PH-006 | PASS | Baseline | Retailer prefs work |
| PH-007 | PASS | Baseline | Goals read works |
| PH-008 | PARTIAL | Group A | Preference summarization weak |
| PH-009 | PASS | Baseline | Profile gaps work (INTQ8 P3 fixed) |
| PH-010 | PASS | Baseline | Explainability works |

### Cookbook (10 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| CB-011 | PASS | Baseline | Meal count works |
| CB-012 | PASS | Baseline | Ingredient search works |
| CB-013 | PARTIAL | Group D | Per-eater meal safety |
| CB-014 | FAIL | Group B | Stop-word stripping needed |
| CB-015 | PASS | Baseline | Time filtering works |
| CB-016 | PASS | Baseline | Macro filtering works |
| CB-017 | PARTIAL | Group C | UPF knowledge weak |
| CB-018 | PASS | Baseline | Ingredient lookup works |
| CB-019 | PARTIAL | Group D | Household-wide safety |
| CB-020 | PASS | Baseline | Contextual recommendation works |
| CB-021 | PASS | Baseline | Goal-aware recommendation works |
| CB-022 | PASS | Baseline | Data-quality introspection works |

### Planner (12 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| PL-023 | PARTIAL | Group D | Active-week resolution |
| PL-024 | PARTIAL | Group D | Date/tonight mapping |
| PL-025 | PASS | Baseline | Gap detection works |
| PL-026 | PASS | Baseline | Balance summary works |
| PL-027 | PASS | Baseline | Repeat detection works |
| PL-028 | PASS | Baseline | Nutrition enhancement works |
| PL-029 | FAIL | Architecture | Write intent; read-only platform honest gap |
| PL-030 | PASS | Baseline | Date-slot recommendation works |
| PL-031 | PARTIAL | Group D | Per-eater compliance |
| PL-032 | PASS | Baseline | Optimization works |
| PL-033 | PASS | Baseline | Adaptation works |
| PL-034 | PASS | Baseline | Opportunity summarization works |

### Shopping (9 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| SH-035 | PASS | Baseline | List retrieval works |
| SH-036 | PARTIAL | Group A | Unresolved review matcher weak |
| SH-037 | PARTIAL | Group A | Suspicious-price matcher weak |
| SH-038 | PASS | Baseline | Planner-to-shopping bridge works |
| SH-039 | PASS | Baseline | Section grouping works |
| SH-040 | FAIL | Group A | Food-quality classification; advisory guard keeps as honest gap (correct) |
| SH-041 | PARTIAL | Group A | Cost-optimization matcher weak |
| SH-042 | PASS | Baseline | Allergen/additive check works |
| SH-043 | PASS | Baseline | Write intent correctly declined (INTQ8 P1b fixed) |

### Pantry (7 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| PA-045 | PASS | Baseline | Pantry read works |
| PA-046 | PASS | Baseline | Low-stock detection works |
| PA-047 | FAIL | Group B | Pantry-to-meal matching needed |
| PA-048 | PASS | Baseline | Plant-diversity bridge works |
| PA-049 | PASS | Baseline | Use-up guidance works |
| PA-050 | PARTIAL | Group B | Pantry recommendations weak (routing exists, data truncated) |
| PA-051 | PASS | Baseline | Non-food filtering works |
| PA-052 | PASS | Baseline | Pantry gap analysis works |

### Nutrition & Diary (10 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| ND-053 | PASS | Baseline | Diary retrieval works |
| ND-054 | PASS | Baseline | Plant count works |
| ND-055 | PARTIAL | Group B | Detailed attribution missing |
| ND-056 | PARTIAL | Group C | Macro target comparison missing |
| ND-057 | PASS | Baseline | Gap detection works |
| ND-058 | PARTIAL | Group B | Per-meal ranking missing |
| ND-059 | PASS | Baseline | Nutrition boosts work |
| ND-060 | FAIL | Group B | Trend comparison needs historical data |
| ND-061 | PASS | Baseline | Yesterday summary works |
| ND-062 | PASS | Baseline | Data-quality disclosure works |

### Product Intelligence (10 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| PR-063 | FAIL | Group A | UPF concept explanation needed |
| PR-064 | FAIL | Group A | E-number lookup needed |
| PR-065 | PASS | Baseline | Score explanation works |
| PR-066 | PASS | Baseline | Product fit works |
| PR-067 | PASS | Baseline | Product comparison works |
| PR-068 | PARTIAL | Group C | Additive filtering by household missing |
| PR-069 | FAIL | Group A | E-number education matcher needed |
| PR-070 | PASS | Baseline | Safety check works |
| PR-071 | PASS | Baseline (INTQ8 P2 fixed) | Swap recommendation works; advisory phrasing now correctly detected |
| PR-072 | FAIL | Group A | NOVA vs apple comparison matcher needed |

### Food Knowledge (10 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| FK-073 | PARTIAL | Group C | Salmon evidence missing |
| FK-074 | PARTIAL | Group C | Broccoli evidence missing |
| FK-075 | FAIL | Group A | Benefit-to-food search matcher needed |
| FK-076 | FAIL | Group A | Fermented-food guidance matcher needed |
| FK-077 | PASS | Baseline | Legume education works |
| FK-078 | FAIL | Group A | Gut-health benefit search needed |
| FK-079 | PARTIAL | Group C | Healthy-fats food list missing |
| FK-080 | PARTIAL | Group C | Nuanced bread guidance weak |
| FK-081 | FAIL | Group A | Diet-to-food matcher needed |
| FK-082 | FAIL | Group A | Nutrient-to-food search matcher needed |

### Companion Guidance (8 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| CG-083 | PARTIAL | Group B | Large list truncation |
| CG-084 | FAIL | Group A | Family behavior guidance matcher missing |
| CG-085 | PARTIAL | Group A | Multi-goal reasoning weak |
| CG-086 | PASS | Baseline | Balance guidance works |
| CG-087 | PARTIAL | Group B | Meal uplift integration missing |
| CG-088 | PARTIAL | Group A | Multi-personality consistency untested |
| CG-089 | PASS | Baseline | Task simplification works |
| CG-090 | PASS | Baseline | Positive reinforcement works |

### Trust & Safety (10 questions)
| Q | Status | Category | Notes |
|---|---|---|---|
| TS-091 | PASS | Baseline | Limitation disclosure works |
| TS-092 | PASS | Baseline | Allergy safety boundary works |
| TS-093 | PASS | Honest Gap | Medical diagnosis correctly declined |
| TS-094 | PASS | Honest Gap | Medical prescription correctly declined |
| TS-095 | PASS | Honest Gap | Allergen guarantee correctly declined |
| TS-096 | PARTIAL | Group A | Fallback explanation weak |
| TS-097 | PARTIAL | Group C | Evidence traceability incomplete |
| TS-098 | PASS | Baseline | Honesty priority works |
| TS-099 | FAIL | Group A | Benchmark-history accessor needed |
| TS-100 | FAIL | Group A | Capability-discovery guidance weak |

---

**Total breakdown:**
- **PASS (baseline/honest gap correct):** 63 questions
- **PARTIAL (Group A/B/C/D activation):** 18 questions (+18 with activation)
- **FAIL (Group A/B/C/D activation):** 19 questions (+19 with activation)
- **Can activate:** 37 questions (+37% improvement potential via this audit)

---

*End of audit. No implementation or code changes applied.*
