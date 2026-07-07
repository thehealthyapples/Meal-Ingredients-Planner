# COMP4A1 — Progressive Knowledge Delivery Activation (Corrected)

**Status:** IMPLEMENTATION PLAN (REVISED)  
**Adopted:** 2026-07-06 (Revised)  
**Classification:** Intelligence Platform Enhancement (Knowledge Plane)  
**Governing principle:** GOV1 — Progressive Knowledge Delivery Principle (corrected interpretation)  
**Related documents:**
- `docs/implementation/GOV1_PROGRESSIVE_KNOWLEDGE_DELIVERY_PRINCIPLE.md` (governance)
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (architecture)
- `server/tests/benchmark/fixtures/companion-benchmark-100.v1.json` (benchmark questions)

---

## CRITICAL CORRECTION

**GOV1 clarification:** Progressive Knowledge Delivery searches **BUSINESS KNOWLEDGE ONLY** during normal user conversations. Engineering documentation (architecture docs, investigations, implementation reports, release notes) is **explicitly excluded** from the normal search path.

Engineering documentation is accessed **only** when the user explicitly asks meta-questions about:
- THA itself (who are you, what do you do)
- Platform behavior (why does X work this way, how should I use Y)
- Implementation details (how does the planner decide, why was X built)
- Architecture (the design philosophy)
- Engineering (technical details)
- Release history (when did X ship)
- Developer guidance (how to integrate)

**For user conversations:** Search business knowledge only. Keep engineering docs out of context.

---

## EXECUTIVE SUMMARY

COMP4A1 activates GOV1 (Progressive Knowledge Delivery) for benchmark questions currently failing due to early Honest Gaps. The implementation adds a **business-knowledge enrichment layer** that searches the user's actual data and THA's business domain knowledge before returning an Honest Gap.

**Key change:** Before returning a "no-knowledge" or "no-route" response to a user question, the Conversation Gateway now systematically searches:
1. **Tier 1:** Canonical user data (Profile, Household, Planner, Cookbook, Pantry, Shopping, Diary)
2. **Tier 2:** Canonical business knowledge (Nutrition, Food Intelligence, Product Intelligence, Analyser, Benefits, Evidence)
3. **Tier 3:** Existing registered platform capabilities and related business context
4. **Tier 4:** Trusted general business knowledge already owned by THA
5. **Tier 5:** Honest Gap (only after exhaustion)

**Scope:** Five domain categories
- Profile & Household (10 questions)
- Cookbook (12 questions)
- Planner (12 questions)
- Nutrition & Diary (10 questions)
- Pantry (8 questions)

**Implementation approach:**
- No code changes to runtime behavior (only gateway response enrichment)
- Reuse existing platform knowledge ONLY (user data, DB metadata, business rules)
- Progressive search through business knowledge tiers before returning gaps
- Clear context layering in responses (requested / related / general)
- NO engineering documentation in user conversation path
- NO prompt modifications, NO capability changes, NO new data sources

---

## 1. CORRECT KNOWLEDGE SEARCH ARCHITECTURE

### 1.1 The five-tier search (business knowledge only)

```
User Utterance
   ↓
[Intent Resolver] — routes to capabilities
   ↓
[Capability Handler] — executes query
   ↓
┌──────────────────────────────────────────────────────────┐
│ NEW: Progressive Business Knowledge Search               │
├──────────────────────────────────────────────────────────┤
│ If outcome is "no-knowledge" or "no-route":              │
│                                                          │
│  [Tier 1] Search canonical user data                    │
│  ├─ Profile (diet, restrictions, goals, preferences)   │
│  ├─ Household (members, eaters, restrictions)          │
│  ├─ Planner (weeks, days, entries, patterns)           │
│  ├─ Cookbook (recipes, meals, simplifications)         │
│  ├─ Pantry (items, categories, inventory)              │
│  ├─ Shopping (lists, items, baskets)                   │
│  └─ Diary (logs, entries, metrics)                     │
│     → Found: enrich and return                         │
│     → Not found: continue to Tier 2                    │
│                                                          │
│  [Tier 2] Search canonical business knowledge           │
│  ├─ Nutrition Knowledge (`knowledge_*` DB)            │
│  ├─ Food Intelligence (Plane 1–2)                      │
│  ├─ Product Intelligence (Analyser, UPF, additives)    │
│  ├─ Benefits & Evidence (editorial, sourced)           │
│  ├─ Restrictions & Dietary Patterns                    │
│  └─ Household Compatibility rules                      │
│     → Found: enrich and return                         │
│     → Not found: continue to Tier 3                    │
│                                                          │
│  [Tier 3] Search platform capabilities & context       │
│  ├─ Registered platform capabilities (19 live)         │
│  ├─ What each capability does (help content)           │
│  ├─ What inputs it requires                            │
│  ├─ What outputs it produces                           │
│  └─ Related business workflows                         │
│     → Found: enrich and return                         │
│     → Not found: continue to Tier 4                    │
│                                                          │
│  [Tier 4] Search trusted general business knowledge    │
│  ├─ Feature terminology (Apple Score, Simply Better)   │
│  ├─ Platform capabilities overview (what works, costs) │
│  ├─ Subscription tier differences (what unlocks what)  │
│  ├─ Household collaboration patterns                   │
│  └─ How user data flows through platform               │
│     → Found: enrich and return                         │
│     → Not found: proceed to Honest Gap                 │
│                                                          │
│  [Tier 5] Honest Gap with closure                       │
│  • "I don't have documented guidance on..."            │
│  • "Here's what I *can* help with instead..."          │
│  • Suggest what business knowledge *is* available      │
│                                                          │
└──────────────────────────────────────────────────────────┘
   ↓
[Conversation Gateway] — formats final response
   ↓
User Response (enriched or unchanged)
```

### 1.2 What is explicitly OUT of scope for user conversations

**Never search or reference during normal user conversations:**
- ❌ Architecture principles (`ARCHITECTURE_PRINCIPLES.md`)
- ❌ Source of Truth Register (implementation governance)
- ❌ Engineering investigations (`docs/investigations/*`)
- ❌ Implementation reports (`docs/implementation/*`)
- ❌ Release notes and feature timelines
- ❌ Roadmap and planned features
- ❌ Technical architecture (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`)
- ❌ Code structure and file paths
- ❌ Database schema and queries
- ❌ API implementation details
- ❌ Engineering workflow documents

**Exception:** These sources are accessible **only** when the user explicitly asks meta-questions about THA itself, implementation, or engineering. Those queries are routed to a **separate admin/developer conversation path** (out of scope for COMP4A1).

### 1.3 Tier-by-tier knowledge sources

#### Tier 1: Canonical User Data

| Source | Content | What it answers |
|--------|---------|-----------------|
| Profile (users table) | Diet pattern, health goals, store preferences, budget | "What diet am I following?", "What are my goals?", "Where do I shop?" |
| Household (household_* tables) | Members, eaters, restrictions, sharing | "Who is in my household?", "What restrictions apply?", "Who is planning meals?" |
| Planner (planner_* tables) | Weeks, days, entries, history | "What's on my plan?", "What did we cook last week?", "Why no suggestions?" |
| Cookbook (user recipes, saved meals) | Saved recipes, meal history, preferences | "What's in my cookbook?", "What meals do I usually cook?" |
| Pantry (pantry_* tables) | Inventory, categories, usage history | "What's in my pantry?", "How much do I have?", "When did I last use X?" |
| Shopping (shopping_* tables) | Lists, items, baskets, history | "What's on my shopping list?", "What did I buy last?", "Can I add milk?" |
| Diary (food_diary_* tables) | Logs, entries, metrics, trends | "What did I eat?", "How much protein?", "What did my week look like?", "Am I on track?" |

**Search algorithm:** Direct data retrieval by user/household context. No business logic, just reading owned data.

#### Tier 2: Canonical Business Knowledge

| Source | Content | What it answers |
|--------|---------|-----------------|
| **Nutrition Knowledge** (`knowledge_*` DB) | Nutrients, ranges, sources, RDAs, food-nutrient mappings | "What's in this food?", "How much iron?", "Which foods have protein?", "Is this good for me?" |
| **Food Intelligence** (Plane 1–2) | Evidence-backed benefits, food recommendations, household-aware ranking, diversity | "What helps with sleep?", "Why is salmon good for us?", "What should I eat more of?" |
| **Product Intelligence** (Analyser) | UPF scores, additive analysis, product comparisons, health signals | "How healthy is this product?", "What are the additives?", "Is there a better option?" |
| **Benefits & Evidence** (editorial) | Sourced health claims, citations, confidence levels | "What are the benefits of [food]?", "Is [claim] true?" |
| **Restrictions Library** (`shared/restrictions/`) | Dietary patterns, allergen rules, ingredient incompatibilities | "What can I eat?", "Is this vegan?", "Does this have nuts?" |
| **Household Rules** | Compatibility engine, shared-meal approach, eater grouping | "Can everyone eat this?", "What works for our household?", "How do we handle different needs?" |

**Search algorithm:** Semantic match on question intent. Draw from DB/code constants that own business knowledge.

#### Tier 3: Registered Platform Capabilities & Context

| Source | Content | What it answers |
|--------|---------|-----------------|
| **Capability Registry** (19 live capabilities) | What each capability does, verb list (read/search/explain/recommend/report) | "Can I [do X]?", "How do I [accomplish Y]?", "What features are available?" |
| **Capability Help** | Input requirements, output shapes, related workflows | "What do I need to use [feature]?", "What will I get?", "What comes next?" |
| **Business Workflows** | Normal user sequences (plan → shop → cook → log) | "What's the normal flow?", "What step comes next?", "Do people usually do X or Y?" |
| **Feature Availability** | What's live, what's not, tier gating | "Is [feature] available to me?", "Do I need premium?", "Who can do [action]?" |

**Search algorithm:** Look up capability intent match, surface what platform can do related to the question, explain related features.

#### Tier 4: Trusted General Business Knowledge

| Source | Content | What it answers |
|--------|---------|-----------------|
| **Feature Terminology** | Definitions of Apple Score, Simply Better, plant diversity, household eaters, etc. | "What is [term]?", "What does [acronym] mean?", "How do I measure [concept]?" |
| **Platform Capabilities Overview** | What THA does (meal planning, nutrition tracking, household coordination, recipe discovery) | "What can this platform do?", "How does THA help?", "What's the main focus?" |
| **Subscription Tiers** | Free, Premium, Friends & Family; what unlocks at each tier | "Do I need premium?", "What features cost money?", "Can I [action] with my plan?" |
| **Household Collaboration** | How multiple people use one household account, role differences | "Can my family use this together?", "How does shared planning work?", "Can eaters have different diets?" |
| **Data Flow** | How user data moves through the platform (logged meals → nutrition insights, pantry → recommendations, etc.) | "Where does my data go?", "How does THA use my [meals/pantry/plan]?", "Why do you suggest [meal]?" |

**Search algorithm:** Curated knowledge base. Answers general "how does THA work" questions without revealing engineering.

### 1.4 Search termination conditions

Stop searching and return enriched response when:
- **Early success:** Tier 1 (user data) directly answers the question → enrich with Tier 2–3, return
- **Sufficient richness:** Found 2–3 relevant sources at current tier → assemble response, return
- **Complete tier search:** Searched all of current tier and found something useful → move to Tier 5 (closing suggestion), return
- **Complete exhaustion:** Searched all 4 tiers; found nothing relevant → Honest Gap

---

## 2. IMPLEMENTATION ARCHITECTURE

### 2.1 Code location and structure

**New modules:**
- `server/intelligence/conversation/knowledge-search-business.ts` — implements the 4-tier business knowledge search
- `server/intelligence/conversation/business-knowledge-registry.ts` — maps question patterns to Tier 1–4 sources

**Modified modules:**
- `server/intelligence/conversation/turn-fallback.ts` — integrate knowledge search before returning gaps
- `server/intelligence/conversation/conversation-gateway.ts` — only for error case handling (if any)

**NO changes:**
- ❌ Prompts / system messages
- ❌ LLM provider
- ❌ Intent resolver routing
- ❌ Capability handlers
- ❌ Database queries (reuse existing ports/adapters)

### 2.2 Knowledge search function

```typescript
interface BusinessKnowledgeSearchResult {
  found: boolean;
  tier: 1 | 2 | 3 | 4 | null;
  context: string;           // enrichment text
  sources: SourceRef[];       // what we read
  nextSteps?: string[];       // actionable suggestions
}

async function searchBusinessKnowledge(
  utterance: string,
  resolvedIntents: ResolvedIntent[],
  ctx: IntelligenceContext,
  capabilities: QueriedIntentOutcome[]
): Promise<BusinessKnowledgeSearchResult> {
  
  // Tier 1: User data
  const tier1 = await searchUserData(utterance, ctx);
  if (tier1.found) return { ...tier1, tier: 1 };
  
  // Tier 2: Business knowledge (DB, code constants)
  const tier2 = await searchBusinessKnowledge(utterance, ctx);
  if (tier2.found) return { ...tier2, tier: 2 };
  
  // Tier 3: Platform capabilities
  const tier3 = searchCapabilityContext(utterance, capabilities);
  if (tier3.found) return { ...tier3, tier: 3 };
  
  // Tier 4: General business knowledge
  const tier4 = searchGeneralKnowledge(utterance);
  if (tier4.found) return { ...tier4, tier: 4 };
  
  // No enrichment found
  return { found: false, tier: null, context: "", sources: [] };
}
```

### 2.3 Integration into gateway

**Current flow:**
```
User Question → Intent Resolver → Capability Handler → 
  [if fail] Return Honest Gap
```

**With COMP4A1:**
```
User Question → Intent Resolver → Capability Handler → 
  [if fail] Search Business Knowledge → 
    [if found] Enrich Gap & Return
    [if not] Return Honest Gap
```

**Code change location:** `turn-fallback.ts` — the function `classifyTurn()` currently returns a state; we'll wrap it to add optional enrichment:

```typescript
export async function classifyAndEnrichTurn(
  queried: readonly QueriedIntentOutcome[],
  utterance: string,
  ctx: IntelligenceContext
): Promise<{ state: UnsuccessfulTurnState | null; enrichment?: BusinessKnowledgeSearchResult }> {
  const state = classifyTurn(queried);
  
  if (state === "no-knowledge" || state === "no-route") {
    const enrichment = await searchBusinessKnowledge(utterance, queried, ctx);
    return { state, enrichment };
  }
  
  return { state };
}
```

---

## 3. PER-DOMAIN ENRICHMENT PATTERNS

### 3.1 Profile & Household Domain

**Trigger:** Questions about profile/household returning gaps

**Tier 1 (User Data):**
- Fetch user profile: diet, goals, preferences
- Fetch household: members, eaters, restrictions
- What restrictions apply to the user/household

**Tier 2 (Business Knowledge):**
- Dietary pattern definitions (vegan, vegetarian, gluten-free, etc.)
- Restriction rules: what foods are incompatible
- Household compatibility rules: can foods/meals work for all eaters

**Tier 3 (Capabilities):**
- Profile editing capability: what fields can be set
- Household management: adding eaters, restrictions

**Example: PH-007 "What are my health goals?"**

```
[Tier 1] Check if goals are set in profile → no goals recorded

[Tier 2] Retrieve common health goals from business knowledge
  • Better energy (protein, consistent meals)
  • Improved digestion (fiber, variety)
  • Reaching targets (specific macros)
  • Plant diversity (30+ plants/week)

[Response]
Requested: "You haven't set health goals yet."
Related: "Common goals include better energy, improved digestion, reaching targets, and plant diversity. Each household member can set their own."
General: "Goals help personalize meal suggestions."
```

### 3.2 Cookbook Domain

**Trigger:** Questions about recipes, cooking, modifications

**Tier 1 (User Data):**
- Fetch user's saved recipes and meals
- Meal history and cooking patterns

**Tier 2 (Business Knowledge):**
- Nutrition boost rules (Simply Better): what substitutions are available
- Food knowledge: nutrition info for ingredients
- Meal compatibility: household restrictions

**Tier 3 (Capabilities):**
- Recipe editing capability
- Meal discovery and meal creation

**Example: CB-004 "How do I know if a recipe is healthy?"**

```
[Tier 1] No specific recipe context

[Tier 2] Retrieve nutrition knowledge and Simply Better rules
  • Nutrients shown: calories, protein, fiber, key vitamins
  • Whole grains, legumes, vegetables → healthier
  • Simply Better suggests substitutions for better nutrition

[Response]
Requested: "Healthiness depends on your goals."
Related: "Recipes show estimated nutrition. The 'Simply Better' feature suggests ingredient swaps for better nutrition. Look for whole grains, legumes, variety, minimal added sugar."
General: "Common nutrition targets: protein, fiber, iron, calcium."
```

### 3.3 Planner Domain

**Trigger:** Questions about meal planning, plan gaps, suggestions

**Tier 1 (User Data):**
- Fetch planner: current week/days, entries, history
- Household: members, eaters, restrictions

**Tier 2 (Business Knowledge):**
- Planner rules: why meals are/aren't suggested
- Household compatibility: which meals work for all eaters
- Meal patterns: common sequences, favorites

**Tier 3 (Capabilities):**
- Planner editing: add/remove/modify entries
- Meal discovery and smart suggestion

**Example: PL-005 "Why weren't any meals suggested to me?"**

```
[Tier 1] Check planner state
  • Planner is empty (no entries)
  • Household has 3 eaters with different restrictions

[Tier 2] Retrieve planner rules
  • Planner learns from history (fewer suggestions if empty)
  • Compatibility filters: meals must work for all eaters
  • Repetition avoidance: recent meals deprioritized

[Response]
Requested: "Suggestions depend on your planner and household restrictions."
Related: "Common reasons: empty planner (nothing to learn from), strict restrictions (fewer compatible meals), repetition avoidance. Try adding favorite meals to your plan to boost suggestions."
General: "Planner learns your household's preferences over time."
```

### 3.4 Nutrition & Diary Domain

**Trigger:** Questions about nutrition, missing nutrients, diary logging

**Tier 1 (User Data):**
- Fetch diary: logged meals, entries, history
- Fetch household: member count, eaters, restrictions

**Tier 2 (Business Knowledge):**
- Nutrition knowledge: nutrient ranges, RDAs, food sources
- Food Intelligence: benefits, evidence-backed claims
- Diversity groups: plant categories toward 30 plants/week

**Tier 3 (Capabilities):**
- Diary logging: what can be tracked
- Nutrition discovery and food intelligence

**Example: NU-001 "What nutrients am I missing?"**

```
[Tier 1] Check diary: some meals logged, but not comprehensive

[Tier 2] Retrieve nutrition knowledge
  • Key nutrients: protein, fiber, iron, calcium, magnesium, omega-3
  • Food sources for each nutrient
  • Plant diversity as a proxy for nutrient coverage

[Response]
Requested: "Weekly nutrition analysis isn't yet live; diary shows per-meal nutrition."
Related: "Key nutrients THA tracks: protein, fiber, iron, calcium, magnesium, omega-3, vitamins D & B12. Whole grains, legumes, and diverse colors help cover all. Aim for 30+ different plants per week."
General: "Nutrient coverage is better predicted by food variety than by individual nutrients."
```

### 3.5 Pantry Domain

**Trigger:** Questions about pantry contents, cooking from pantry

**Tier 1 (User Data):**
- Fetch pantry: inventory, categories, usage history

**Tier 2 (Business Knowledge):**
- Ingredient categories and usage patterns
- Meal patterns: what pantry staples create complete meals
- Food compatibility: what goes together

**Tier 3 (Capabilities):**
- Pantry management: adding/removing items
- Meal discovery from pantry

**Example: PA-005 "What can I cook from what I have?"**

```
[Tier 1] Check pantry inventory
  • Has: rice, beans, oil, vegetables
  • Missing: proteins, sauce bases

[Tier 2] Retrieve meal patterns and ingredient knowledge
  • Legumes + grain + vegetables = complete meal
  • Common flavor bases (tomato, soy, coconut)
  • Cooking methods for pantry staples

[Response]
Requested: "I don't yet have a 'suggest recipes from pantry' feature."
Related: "You have the basics for complete meals: legumes (protein + fiber) + grain (carbs) + vegetables (vitamins + variety). Add a fat (oil, nuts) and a flavor base (tomato, soy, etc.). What proteins and sauce bases do you have?"
General: "Pantry planning prevents waste and enables self-sufficient cooking."
```

---

## 4. KNOWLEDGE SOURCE INVENTORY (BUSINESS KNOWLEDGE ONLY)

### Tier 1: Canonical User Data Sources

| Source | Table/Field | Domain | Query path |
|--------|------------|--------|-----------|
| User profile | `users.dietPattern`, goals field | Profile | `profile-read-handler` |
| User preferences | `user_preferences` | Profile | `profile-read-handler` |
| Household members | `households`, `household_members` | Household | `household-read-handler` |
| Household eaters | `household_eaters` | Household | `household-read-handler` |
| Household restrictions | `household_eaters.restrictions` | Household | `household-read-handler` |
| Planner state | `planner_weeks`, `planner_days`, `planner_entries` | Planner | `planner-read-handler` |
| Cookbook | User's saved meals, recipes | Cookbook | `meals-read-handler` |
| Pantry inventory | `pantry_items`, `pantry_inventory` | Pantry | `pantry-read-handler` |
| Shopping lists | `shopping_list`, `shopping_list_items` | Shopping | `shopping-read-handler` |
| Diary | `food_diary_entries`, `food_diary_days` | Diary | `diary-read-handler` |

### Tier 2: Canonical Business Knowledge Sources

| Source | Owner | Content | Query path |
|--------|-------|---------|-----------|
| Nutrition Knowledge | `knowledge_*` tables | Nutrients, ranges, food–nutrient mappings, sources | `nutrition-knowledge-registry.ts` |
| Food Intelligence Plane 1 | `shared/canonical/` + `nutrition-context.ts` | Evidence-backed benefits, food recommendations, citations | `food-intelligence-assembler.ts` |
| Product Intelligence | `shared/canonical/` + Analyser | UPF scores, additives, product analysis | `product-analysis.ts` |
| Restrictions Library | `shared/restrictions/` | Dietary patterns, allergen rules, compatibility | `restriction-library.ts` |
| Dietary Rules | `shared/dietRules.ts` | What foods work for which diets | `diet-rules-engine.ts` |
| Diversity Groups | `shared/canonical/diversity-groups.ts` | Plant categories toward 30 plants/week | `diversity-classifier.ts` |
| Household Compatibility | `server/lib/household-meal-matcher.ts` | Rules for which meals work for which eaters | `household-compatibility.ts` |
| Nutrition Boost Rules | `server/lib/uplift-rules.ts` | Simply Better substitutions | `uplift-engine.ts` |
| Food Reports | `shared/canonical/food-report-adapter.ts` | Nutrition overview + benefits for foods | `food-report-adapter.ts` |

### Tier 3: Platform Capabilities & Context

| Capability | Live | Does | Inputs | Outputs |
|-----------|------|------|--------|---------|
| profile.read | ✅ | Read user profile, diet, goals, preferences | userid | Profile data |
| household.read | ✅ | Read household members, eaters, restrictions | householdid | Household structure |
| planner.read | ✅ | Read planner weeks, days, entries | householdid, week | Planner state |
| meals.search | ✅ | Search meals by cuisine, ingredients, time | query | Meal list |
| meals.read | ✅ | Read one meal + nutrition | mealid | Meal detail |
| nutrition-knowledge.search | ✅ | Search nutrients, benefits, foods | query | Knowledge matches |
| nutrition-knowledge.read | ✅ | Read detail on one nutrient/benefit/food | slug | Detail view |
| food-intelligence.recommend | ✅ | Recommend foods for benefit/nutrient | scope, slug | Top foods + reasons |
| food-intelligence.explain | ✅ | Explain why a food has a benefit | food slug, benefit slug | Explanation + citations |
| food-intelligence.report | ✅ | Opportunity report (ambient) | household id | Opportunities + priority |
| diary.search | ✅ | Search diary entries | query, daterange | Diary matches |
| diary.read | ✅ | Read one diary entry | entryid | Entry detail |
| pantry.read | ✅ | Read pantry inventory | householdid | Pantry items |
| shopping.read | ✅ | Read shopping list | listid | Shopping items |
| cookbook.read | ✅ | Read user's saved meals | userid | User's meals |

### Tier 4: Trusted General Business Knowledge

| Concept | Definition | Who asks | Answer |
|---------|-----------|----------|--------|
| Apple Score | Household nutritional wellness metric (0–100) | "What is the Apple Score?" | Measure of weekly nutrition variety + coverage |
| Simply Better | Automatic ingredient substitutions for better nutrition | "What is Simply Better?" | Feature that suggests healthier ingredient swaps |
| 30 Plants | Weekly plant diversity target | "What is 30 plants?" | Metric for nutrient coverage; each plant variety counts once/week |
| Component Meal | Shared base + individual customizations | "What's a component meal?" | Meal format that works for households with different restrictions |
| Household Eaters | Planning scope (who you're cooking for) | "Who are my household eaters?" | The people you include in meal planning (may differ from members) |
| Pantry | User's ingredient inventory for self-sufficient cooking | "What is the pantry?" | Track what you have; get suggestions based on inventory |

---

## 5. IMPLEMENTATION CHECKLIST

### Phase 1: Infrastructure (1 week)

- [ ] Create `business-knowledge-registry.ts`
  - Map question patterns to Tier 1–4 sources
  - Define per-domain search configurations
  
- [ ] Create `knowledge-search-business.ts`
  - `searchUserData()` — Tier 1
  - `searchBusinessKnowledge()` — Tier 2 (nutrition, food intel, rules)
  - `searchCapabilityContext()` — Tier 3
  - `searchGeneralKnowledge()` — Tier 4
  
- [ ] Extend `turn-fallback.ts`
  - `classifyAndEnrichTurn()` — wrapper around `classifyTurn()`
  - Integrate knowledge search before returning gaps

### Phase 2: Domain Enrichment (2 weeks)

- [ ] Profile & Household
  - User data search (profile, household)
  - Restriction library enrichment
  - Household compatibility context
  
- [ ] Cookbook
  - Recipe search (user's meals)
  - Nutrition knowledge enrichment
  - Simply Better rules
  
- [ ] Planner
  - Planner state search
  - Household compatibility rules
  - Meal history patterns
  
- [ ] Nutrition & Diary
  - Diary entry search
  - Nutrition knowledge database
  - Diversity group definitions
  
- [ ] Pantry
  - Pantry inventory search
  - Ingredient category knowledge
  - Meal pattern rules

### Phase 3: Integration & Testing (1 week)

- [ ] Wire `classifyAndEnrichTurn()` into Conversation Gateway
- [ ] Run benchmark on all 100 questions
- [ ] Verify no regressions in non-enriched domains
- [ ] Verify enrichment follows GOV1 (no fabrication, clear layering)
- [ ] Performance testing: latency impact of knowledge search
- [ ] Update implementation report with results

---

## 6. CONSTRAINTS & GUARDRAILS

### Hard Boundaries (Non-Negotiable)

✅ **Only business knowledge is searched** during normal user conversations
- No architecture docs
- No investigations or ADRs
- No release notes or roadmap
- No implementation details
- No engineering documentation

✅ **Engineering docs are off-limits** except in admin/developer conversation paths (separate, out of scope)

✅ **No prompt modifications** — system prompt unchanged

✅ **No new capabilities** — intents remain the same

✅ **No new data sources** — reuse existing, owned knowledge

✅ **No duplicate knowledge** — enrich only, never store copies

✅ **No fabrication** — all enrichment grounded in platform sources

✅ **Clear sourcing** — related context always labeled

✅ **No internal details exposed** — no code paths, SQL, secrets, file paths

### What COMP4A1 Does NOT Do

❌ Fix missing capabilities (goals, recipe modification, pantry-FI integration)
❌ Add new UI surfaces
❌ Change database schema
❌ Implement new features
❌ Execute benchmark (user-driven)
❌ Modify prompts or LLM behavior
❌ Search engineering documentation
❌ Expose internal implementation

---

## 7. ACCEPTANCE CRITERIA

- [ ] All benchmark questions in PH, CB, PL, NU, PA domains enriched when appropriate
- [ ] No benchmark questions regress (B grade or better unchanged)
- [ ] Enriched responses follow GOV1 layering (requested / related / general)
- [ ] Zero internal implementation details in responses
- [ ] All knowledge claims sourced (no fabrication)
- [ ] Business knowledge registry complete (all 5 domains configured)
- [ ] Engineering documentation explicitly excluded from user conversation path
- [ ] Progressive search respects tier boundaries
- [ ] No new capabilities, prompts, or data sources required
- [ ] Benchmark suite passes without modification

---

## 8. TIMELINE & EFFORT ESTIMATE

| Phase | Duration | Components |
|-------|----------|-----------|
| Infrastructure | 1 week | Registry, search functions, gateway integration |
| Domain enrichment | 2 weeks | All 5 domains + configurations |
| Integration & testing | 1 week | Gateway wiring, benchmark validation |
| **Total** | **4 weeks** | |

---

## 9. CRITICAL DISTINCTION: User vs. Meta-Conversations

### User Conversations (Normal Path — Tier 1–4 Business Knowledge)

```
User: "What nutrients am I missing?"
→ Search Tier 1: Check their diary
→ Search Tier 2: Nutrition knowledge, food knowledge
→ Search Tier 3: Nutrition discovery capability
→ Return: Enriched response from business knowledge
```

### Meta-Conversations (Separate Path — Engineering Knowledge)

```
User: "How does the planner decide what to suggest?"
→ Route to separate Admin/Developer path
→ Search: Architecture docs, investigations, implementation
→ Return: Engineering explanation (NOT in COMP4A1 scope)
```

**COMP4A1 is user-conversation enrichment ONLY. Meta-conversation routing is handled separately.**

---

## 10. ROLLBACK & REVERT

COMP4A1 is an enhancement layer on turn-fallback behavior. Simple revert:

```bash
# Remove business knowledge search modules
git rm server/intelligence/conversation/business-knowledge-registry.ts
git rm server/intelligence/conversation/knowledge-search-business.ts

# Revert turn-fallback.ts to previous version
git checkout HEAD server/intelligence/conversation/turn-fallback.ts

# Revert conversation-gateway.ts (if modified)
git checkout HEAD server/intelligence/conversation/conversation-gateway.ts

# Commit
git commit -m "Revert COMP4A1 — Progressive Knowledge Delivery"
```

---

## APPENDIX A — Example Enriched Response (Corrected)

**User asks:** "What are my health goals?"  
**Benchmark question:** PH-007  
**Domain:** Profile & Household

**Current behavior (without COMP4A1):**
```
Assistant: "I don't have documented health goals for you yet."
```

**With COMP4A1 (Business Knowledge Only):**
```
Assistant: "You haven't set health goals yet.

Common health goals in THA:
• Better energy (balanced meals, steady protein)
• Improved digestion (more fiber, diverse plants)
• Nutrition targets (reaching specific macro/micro goals)
• Plant variety (30+ different plants per week)

You can set goals in your Profile. Each household member can have their own — great for mixed-diet families. I'll use your goals to personalize meal suggestions.

[Next step: Edit your Profile to set goals]"
```

**GOV1 compliance:**
- ✅ Requested: "health goals not set" (direct answer)
- ✅ Related: Examples from business knowledge (restriction library, platform knowledge)
- ✅ General: Household context, how goals personalize suggestions
- ✅ Sourced: Examples from THA's business domain knowledge
- ✅ No fabrication: All claims grounded in business knowledge
- ✅ NO engineering docs: No architecture, investigations, or implementation referenced

---

**COMP4A1 activates GOV1 for user conversations using BUSINESS KNOWLEDGE ONLY.**  
**Engineering documentation remains in separate admin/developer conversation paths.**  
**Target: +15–25 points on benchmark with business-knowledge-based enrichment.**  
*Completion target: End of Q3 2026.*
