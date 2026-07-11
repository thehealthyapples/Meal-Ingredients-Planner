# COMP4A — Progressive Knowledge Delivery Activation

**Status:** IMPLEMENTATION PLAN  
**Adopted:** 2026-07-06  
**Classification:** Intelligence Platform Enhancement (Knowledge Plane)  
**Governing principle:** GOV1 — Progressive Knowledge Delivery Principle  
**Related documents:**
- `docs/implementation/governance/GOV1_PROGRESSIVE_KNOWLEDGE_DELIVERY_PRINCIPLE.md` (governance)
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (architecture)
- `server/tests/benchmark/fixtures/companion-benchmark-100.v1.json` (benchmark questions)

---

## EXECUTIVE SUMMARY

COMP4A activates GOV1 (Progressive Knowledge Delivery) for benchmark questions currently failing due to early Honest Gaps. The implementation adds a **knowledge enrichment layer** between intent resolution failure and the final Honest Gap response.

**Key change:** Before returning a "no-knowledge" or "no-route" response, the Conversation Gateway now systematically searches platform knowledge sources (operations docs, FAQ, feature metadata, release notes, architectural principles) and enriches the response with related context.

**Scope:** Five domain categories
- Profile & Household (10 questions)
- Cookbook (12 questions)
- Planner (12 questions)
- Nutrition & Diary (10 questions)
- Pantry (8 questions)

**Implementation approach:**
- No code changes to runtime behavior (only gateway response enrichment)
- Reuse existing platform knowledge only (docs, DB metadata, operations guides)
- Progressive search through knowledge tiers before returning gaps
- Clear context layering in responses (requested / related / general)
- No prompt modifications, no capability changes, no new data sources

---

## 1. CURRENT STATE ANALYSIS

### 1.1 Benchmark failure modes (by question category)

The Companion Benchmark 100 v1 tests 100 questions across 10 domains. Five domains are identified as having questions failing due to early Honest Gaps:

#### Profile & Household (10 questions)
Example failing questions:
- PH-001: "What diet am I following?" → Returns gap if dietPattern not set
- PH-002: "Do I have any dietary restrictions or allergies recorded?" → Returns gap if none recorded
- PH-007: "What are my health goals?" → No goals capability yet (honest gap)

**Root causes:**
- Missing "goals" capability (PH-007, others)
- No enrichment when profile field exists but is empty
- No context about what related household/planner data means

#### Cookbook (12 questions)
Example failing questions:
- CB-001: "What's in my cookbook?" → May return empty if no recipes saved
- CB-004: "How do I know if a recipe is healthy?" → Returns gap; could enrich with nutrition explanation
- CB-008: "Can I adjust a recipe?" → Might not route to recipe modification capability

**Root causes:**
- Recipe modification capability not yet implemented
- No knowledge enrichment about nutrition scoring
- No guidance on adapting recipes

#### Planner (12 questions)
Example failing questions:
- PL-001: "What's on my meal plan this week?" → Might return gap if plan empty
- PL-005: "Why weren't any meals suggested to me?" → Could enrich with planner rules
- PL-010: "How do I plan meals for a mixed-diet household?" → No guidance on component meals

**Root causes:**
- No knowledge layer for "why planner does/doesn't suggest"
- Missing guidance on household compatibility
- No linked recommendations when plan incomplete

#### Nutrition & Diary (10 questions)
Example failing questions:
- NU-001: "What nutrients am I missing?" → Could enrich from food knowledge
- NU-005: "How is my nutrition this week?" → No aggregated weekly context
- NU-008: "Why is [food] good for me?" → Might miss enrichment from benefits registry

**Root causes:**
- Nutrition aggregation not yet live
- Weekly scoring not available
- Benefits knowledge not yet fully integrated with diary

#### Pantry (8 questions)
Example failing questions:
- PA-001: "What's in my pantry?" → Returns empty if pantry empty; could suggest next step
- PA-005: "What can I cook from what I have?" → FI4 opportunity not wired; could suggest general patterns
- PA-007: "How do I add items to my pantry?" → How-to knowledge could enrich gap

**Root causes:**
- Pantry "cook from what you have" (FI4) not wired
- No how-to guidance when pantry empty
- Missing metadata about ingredient categories

### 1.2 Knowledge sources available for enrichment

**Tier 1 sources (direct match — operations/feature docs):**
- `docs/roles-and-subscriptions.md` — subscription-gated features
- `docs/change-control.md` — recent changes explanation
- `docs/preferred-products.md` — product selection guidance
- `docs/share-plans.md` — household sharing guidance
- Release notes and feature docs (feature availability by tier, known gaps)
- FAQ/Known Issues (curated problems + solutions)

**Tier 2 sources (domain knowledge — DB metadata, business logic docs):**
- `shared/knowledge/` and `knowledge_*` DB — nutrition facts (for enriching NU questions)
- `shared/restrictions/restriction-library.ts` — dietary patterns (for enriching PH questions)
- `shared/canonical/` — food, meal, household entity definitions (for context)
- `server/lib/uplift-rules.ts` — nutrition boost rules (for enriching CB questions)
- `shared/canonical/diversity-groups.ts` — plant diversity groups (for enriching NU questions)
- Planner compliance rules (stored reasoning for why planner does/doesn't suggest)

**Tier 3 sources (adjacent context — architecture & principles):**
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — design philosophy (explain WHY)
- `docs/investigations/` — archived design decisions relevant to features
- `docs/architecture/ENGINEERING_WORKFLOW.md` — how platform evolves
- Release matrix and roadmap (planned features, current limitations)

**Tier 4 sources (general knowledge — glossary/definitions):**
- Feature terminology definitions (e.g., "what is the Apple Score")
- Subscription tier differences
- Platform limitations and capabilities overview

---

## 2. IMPLEMENTATION PLAN

### 2.1 Architecture: Knowledge Enrichment Layer

```
User Utterance
   ↓
[Intent Resolver] — routes to capabilities
   ↓
[Capability Handler] — executes query
   ↓
┌─────────────────────────────────────────┐
│ NEW: Turn Outcome Classification        │
├─────────────────────────────────────────┤
│ If outcome is "no-knowledge" or         │
│ "no-route":                             │
│   • Progressively search Tiers 1–4      │
│   • Assemble related context            │
│   • Layer response (requested/related)  │
│   • Return enriched gap response        │
│ Else (success / no-results):            │
│   • Return as-is (no change)            │
└─────────────────────────────────────────┘
   ↓
[Conversation Gateway] — formats final response
   ↓
User Response (enriched or unchanged)
```

**Implementation site:** `server/intelligence/conversation/turn-fallback.ts` extends to include a new function `enrichHonestGapWithPlatformKnowledge()` called before returning final gap response.

### 2.2 Enrichment Function Signature

```typescript
/**
 * enrichHonestGapWithPlatformKnowledge(
 *   state: UnsuccessfulTurnState,      // "no-knowledge" | "no-route"
 *   queried: QueriedIntentOutcome[],   // failed intents + capabilities
 *   utterance: string,                 // user's original question
 *   ctx: IntelligenceContext           // user's role/tier/household
 * ): { 
 *   baseMessage: string,               // the original gap message
 *   relatedContext?: string,           // tier 2–4 enrichment
 *   nextSteps?: string[]               // actionable suggestions
 * }
 */
```

### 2.3 Per-domain enrichment logic

#### Profile & Household Domain

**Trigger:** Questions about profile/household data returning gaps

**Tier 1 search:**
- Check `docs/roles-and-subscriptions.md` for feature availability
- Check release notes for recent changes to household features

**Tier 2 search:**
- Household entity metadata: member count, household structure, available eaters
- Dietary restriction library: examples of supported restrictions
- Subscription tier capabilities: what household features are available

**Tier 3 search:**
- Architecture: why household + eater separation exists (explain design)
- Operational principles: account/eater/household ownership model

**Response layering for PH-007 (health goals):**
```
Requested: "I don't have documented health goals yet."
Related: "You can set health goals in your Profile. Common goals include better energy, improved digestion, increased plant variety, and reaching nutrition targets. Once you set goals, I'll use them to personalize meal suggestions."
General: "Goals help tailor the planner's recommendations. Your household members can each have their own goals."
```

#### Cookbook Domain

**Trigger:** Questions about recipes, cooking, recipe modification

**Tier 1 search:**
- Release notes: when recipe features shipped
- Help docs: how to add/modify/save recipes

**Tier 2 search:**
- Nutrition boost rules (`uplift-rules.ts`): explain why a recipe might be "simply better"
- Food knowledge: explain nutrition claims for ingredients
- Recipe metadata: seasonality, cuisine, complexity

**Tier 3 search:**
- Design philosophy: why simply better boosts exist (personalization principle)

**Response layering for CB-004 (is recipe healthy):**
```
Requested: "I don't yet have a comprehensive recipe health-scoring system."
Related: "What I can tell you: recipes show estimated nutrition (calories, protein, fiber, etc.). Look for whole grains, legumes, vegetables, and minimal added sugar. The 'Simply Better' feature suggests ingredient swaps for common nutrition gaps."
General: "Healthiness depends on your goals — more protein, more fiber, lower sodium, etc. Tell me your goals and I can suggest healthier options."
```

#### Planner Domain

**Trigger:** Questions about meal planning, plan gaps, household planning

**Tier 1 search:**
- How-to docs: "how do I use the planner"
- Known limitations: "why doesn't planner suggest meals in X situation"

**Tier 2 search:**
- Planner compliance rules: explain why planner rejects/accepts meals
- Household compatibility engine: explain component meal approach
- Meal metadata: complexity, time, restrictions

**Tier 3 search:**
- Architecture: shared-meal vs component approach (design philosophy)

**Response layering for PL-005 (why no suggestions):**
```
Requested: "Meal suggestions depend on your planner settings and household restrictions."
Related: "Common reasons for fewer suggestions: (1) empty planner (nothing to build on), (2) strict household restrictions (fewer compatible options), (3) repetition avoidance (reducing recent meals). Try adding a few favorite meals to your plan, or adjusting restrictions, to see more suggestions."
General: "The planner learns your household's preferences over time. Meals you plan and cook get higher suggestion weight."
```

#### Nutrition & Diary Domain

**Trigger:** Questions about weekly nutrition, missing nutrients, nutrition scoring

**Tier 1 search:**
- Nutrition/food knowledge docs
- Release notes: when nutrition features shipped

**Tier 2 search:**
- Nutrient database (`knowledge_*`): actual nutrient lists, sources, ranges
- Food intelligence plane 1: benefits, citations, evidence levels
- Diversity group definitions: plant categories toward "30 plants a week"

**Tier 3 search:**
- Nutrition science principles: why certain nutrients matter

**Response layering for NU-001 (missing nutrients):**
```
Requested: "Weekly nutrition analysis isn't yet live; diary logging works."
Related: "You can see nutrition info for each logged meal. Key nutrients THA tracks: protein, fiber, iron, calcium, magnesium, omega-3, vitamins D + B12. Aim for whole grains, legumes, and diverse colors for broad coverage."
General: "A balanced week includes all food groups. Plant variety (30+ different plants) is a strong indicator of nutrient coverage."
```

#### Pantry Domain

**Trigger:** Questions about pantry contents, cooking from what's available, pantry management

**Tier 1 search:**
- How-to: "how to add items to pantry"
- Feature docs: what pantry is for

**Tier 2 search:**
- Ingredient categories: how pantry items are organized
- Meal-ingredient matching: what's possible with certain ingredients
- FI4 opportunity types: "cook from what you have" pattern

**Tier 3 search:**
- Pantry design philosophy: why pantry exists (preparation, self-sufficiency)

**Response layering for PA-005 (cook from what I have):**
```
Requested: "I don't yet have a 'recipe suggestion from pantry' feature."
Related: "Here's how to think about it: legumes (beans, lentils) are versatile bases. Add vegetables for variety, a fat source (oil, nuts), and a grain. Most pantry staples make complete meals. What proteins and vegetables do you have?"
General: "Adding items to your pantry helps the planner and me suggest relevant meals. Pantry items also prevent waste — focus meal planning on what you have."
```

### 2.4 Search implementation details

**Knowledge source registration:**

Create a `knowledge-enrichment-registry.ts` that maps (domain, intent) pairs to knowledge tier configurations:

```typescript
interface KnowledgeEnrichmentConfig {
  domain: string;              // "profile", "cookbook", "planner", etc.
  affectedIntents: string[];   // which intents trigger enrichment
  tier1Sources: DocumentRef[]; // docs/roles-and-subscriptions.md, etc.
  tier2Sources: DataRef[];     // DB tables, code constants
  tier3Sources: DocumentRef[]; // architecture docs, investigations
  layeringTemplate: {
    baseGapMessage: string;
    relatedContextTemplate: string;  // with {placeholders}
    generalKnowledgeTemplate: string;
  };
}
```

**Progressive search algorithm:**

```typescript
function enrichHonestGapWithPlatformKnowledge(
  domain: string,
  intent: ResolvedIntent,
  baseGapMessage: string,
  ctx: IntelligenceContext
): { baseMessage: string; relatedContext?: string; nextSteps?: string[] } {
  const config = ENRICHMENT_REGISTRY[domain];
  if (!config) return { baseMessage: baseGapMessage }; // no enrichment known
  
  // Tier 1: Documentation sources (fast)
  const tier1 = searchDocumentation(config.tier1Sources, intent);
  if (tier1.found) {
    return layerResponse(baseGapMessage, tier1.context, config.layeringTemplate);
  }
  
  // Tier 2: Domain knowledge (metadata)
  const tier2 = resolveDomainMetadata(config.tier2Sources, domain, intent, ctx);
  if (tier2.available) {
    return layerResponse(baseGapMessage, tier2.context, config.layeringTemplate);
  }
  
  // Tier 3: Architecture/principles
  const tier3 = resolvePrincipleContext(config.tier3Sources, domain);
  if (tier3.found) {
    return layerResponse(baseGapMessage, tier3.context, config.layeringTemplate);
  }
  
  // No enrichment found
  return { baseMessage: baseGapMessage };
}
```

---

## 3. IMPLEMENTATION CHECKLIST

### Phase 1: Infrastructure (Week 1)

- [ ] Create `server/intelligence/conversation/knowledge-enrichment-registry.ts`
  - Tier 1 source references (doc URLs)
  - Tier 2 metadata access (DB, code constants)
  - Per-domain enrichment configurations
  
- [ ] Create `server/intelligence/conversation/knowledge-search.ts`
  - `searchDocumentation()` function
  - `resolveDomainMetadata()` function
  - `resolvePrincipleContext()` function
  
- [ ] Extend `turn-fallback.ts`
  - Add `enrichHonestGapWithPlatformKnowledge()` function
  - Integrate into turn classification

### Phase 2: Profile & Household Enrichment (Week 2)

- [ ] Register enrichment configs for PH domain questions
  - Tier 1: roles/subscriptions docs
  - Tier 2: household entity metadata, restriction library
  - Tier 3: architecture docs
  
- [ ] Implement `resolveDomainMetadata()` for household context
  - Fetch household members, eaters, restrictions
  - Build context about account structure
  
- [ ] Test: PH-001 through PH-010 enriched responses

### Phase 3: Cookbook Enrichment (Week 2)

- [ ] Register enrichment configs for CB domain questions
  - Tier 1: recipe help docs, feature status
  - Tier 2: uplift rules, nutrition knowledge, recipe metadata
  - Tier 3: design philosophy (why simply better exists)
  
- [ ] Implement recipe metadata resolution
  - Nutrition scoring explanation
  - Simply better boost rules
  
- [ ] Test: CB-001 through CB-012 enriched responses

### Phase 4: Planner Enrichment (Week 3)

- [ ] Register enrichment configs for PL domain questions
  - Tier 1: how-to docs, known limitations
  - Tier 2: compliance rules, meal metadata
  - Tier 3: architecture (shared vs component)
  
- [ ] Implement planner compliance explanation
  - Why planner rejects/accepts meals
  - Household compatibility context
  
- [ ] Test: PL-001 through PL-012 enriched responses

### Phase 5: Nutrition & Diary Enrichment (Week 3)

- [ ] Register enrichment configs for NU domain questions
  - Tier 1: nutrition docs, diary help
  - Tier 2: nutrient database, food knowledge, diversity groups
  - Tier 3: nutrition science principles
  
- [ ] Implement nutrient database resolution
  - Build context about nutrient coverage
  - Plant diversity explanation
  
- [ ] Test: NU-001 through NU-010 enriched responses

### Phase 6: Pantry Enrichment (Week 4)

- [ ] Register enrichment configs for PA domain questions
  - Tier 1: pantry how-to docs
  - Tier 2: ingredient categories, meal patterns
  - Tier 3: pantry design philosophy
  
- [ ] Test: PA-001 through PA-008 enriched responses

### Phase 7: Integration & Validation (Week 4)

- [ ] Wire enrichment into Conversation Gateway
- [ ] Run benchmark on all 100 questions
- [ ] Verify no regressions in non-enriched domains
- [ ] Verify enrichment follows GOV1 (no fabrication, clear layering, sourced)
- [ ] Update implementation report with final results

---

## 4. CONSTRAINTS & NON-GOALS

### Constraints (hard boundaries)

- ✅ No prompt modifications (system prompt unchanged)
- ✅ No new capabilities added (intents unchanged)
- ✅ No new data sources created (reuse existing docs, DB, constants)
- ✅ No duplicate knowledge (enrich only, don't store copies)
- ✅ No runtime behavior changes (only response enrichment)
- ✅ No fabrication (all enrichment grounded in platform sources)
- ✅ Clear sourcing (related context is always labeled as such)
- ✅ No internal details exposed (no code paths, SQL, file paths, secrets)

### Non-goals (handled in other workstreams)

- ❌ Fixing missing capabilities (goals, recipe modification, pantry-FI integration)
- ❌ Adding new UI surfaces (planner strips, pantry opportunities)
- ❌ Database schema changes
- ❌ New feature implementation
- ❌ Benchmark execution (user-driven, per Principle 9)

---

## 5. RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| **Over-enrichment (bloat)** | Cap related context to 2–3 items; make optional/collapsible in UI |
| **Stale documentation** | Enrichment sources auto-link; docs change → enrichment reflects immediately |
| **Context misclassification** | Explicit source labels prevent confusion between types |
| **Fabrication via enrichment** | All sources are curated platform knowledge; no LLM inference |
| **Slow searches** | Tier 1 (docs) cached; Tier 2 (metadata) in-memory; Tier 3 cached |
| **Regression in existing flows** | Enrichment only triggers on gaps; success paths unchanged |

---

## 6. ACCEPTANCE CRITERIA

- [ ] All benchmark questions in PH, CB, PL, NU, PA domains show enriched responses when appropriate
- [ ] No benchmark questions regress (B grade or better unchanged)
- [ ] Enriched responses follow GOV1 layering (requested / related / general clearly distinguished)
- [ ] No internal implementation details exposed in responses
- [ ] All knowledge claims sourced (no fabrication)
- [ ] Knowledge enrichment registry complete (all 5 domains configured)
- [ ] Progressive search respects tier boundaries (stops early if tier 1 sufficient)
- [ ] No new capabilities or prompt changes required
- [ ] Benchmark suite passes without modification

---

## 7. TIMELINE & EFFORT ESTIMATE

| Phase | Duration | Owner |
|-------|----------|-------|
| Infrastructure setup | 2–3 days | Implementation |
| Profile & Household | 2–3 days | Implementation |
| Cookbook | 2–3 days | Implementation |
| Planner | 2–3 days | Implementation |
| Nutrition & Diary | 2–3 days | Implementation |
| Pantry | 1–2 days | Implementation |
| Integration & testing | 2–3 days | Implementation + QA |
| **Total** | **2–2.5 weeks** | |

---

## 8. KNOWLEDGE SOURCES INVENTORY

### Tier 1: Operations Documentation

| Source | Content | Domains |
|--------|---------|---------|
| `docs/roles-and-subscriptions.md` | Feature gating by role/tier | PH, all |
| `docs/preferred-products.md` | Product selection guidance | PA, SH |
| `docs/share-plans.md` | Household sharing how-to | PL, PH |
| `docs/change-control.md` | Recent changes/deprecations | all |
| Release notes (`docs/release-notes.md`) | Feature status, timeline | all |
| Help articles (to be curated) | How-to for each domain | PH, CB, PL, PA |

### Tier 2: Domain Metadata

| Source | Content | Domains |
|--------|---------|---------|
| `shared/restrictions/restriction-library.ts` | Diet patterns, restrictions | PH |
| `shared/canonical/foods.ts` | Food identity, categories | NU, CB, PA |
| `shared/knowledge/*` | Nutrients, benefits, sources | NU, CB |
| `shared/canonical/diversity-groups.ts` | Plant categories | NU, PA |
| `server/lib/uplift-rules.ts` | Nutrition boosts (Simply Better) | CB |
| Planner compliance rules | Why planner does/doesn't suggest | PL |
| Household entity schema | Member/eater/restriction structure | PH |

### Tier 3: Architecture & Principles

| Source | Content | Domains |
|--------|---------|---------|
| `docs/architecture/ARCHITECTURE_PRINCIPLES.md` | System design philosophy | all |
| `docs/investigations/*` | Archived design decisions | all (topic-specific) |
| `docs/architecture/ENGINEERING_WORKFLOW.md` | How platform evolves | all |

### Tier 4: Glossary (General Knowledge)

| Concept | Definition | Domains |
|---------|-----------|---------|
| "Apple Score" | Household nutritional wellness metric | NU |
| "Simply Better" | Automatic ingredient substitution | CB |
| "30 Plants" | Weekly plant diversity target | NU, PA |
| "Component meal" | Shared base + individual customization | PL, PH |
| "Household eaters" | Planning scope vs membership | PH, PL |

---

## 9. FUTURE ENHANCEMENTS

Post-COMP4A, the following could further improve enrichment:

- **Tier 5 (machine-learned context):** Cluster similar historical questions; suggest related topics user asked before
- **Personalized enrichment:** Adjust enrichment depth by user's experience level (new vs power user)
- **Interactive enrichment:** "Would you like to learn about...?" — optional deep-dives
- **Feedback loop:** Track which enrichments users find helpful; re-weight search priorities
- **Capability roadmap visibility:** "This feature is scheduled for Q3 2026"

---

## 10. ROLLBACK & REVERT

COMP4A is an enhancement layer on top of existing turn-fallback behavior. Reverting is straightforward:

```bash
# Remove enrichment infrastructure
git rm server/intelligence/conversation/knowledge-enrichment-registry.ts
git rm server/intelligence/conversation/knowledge-search.ts

# Revert turn-fallback.ts to previous version
git checkout HEAD server/intelligence/conversation/turn-fallback.ts

# Commit
git commit -m "Revert COMP4A — Progressive Knowledge Delivery Activation"
```

No database changes, no other dependencies.

---

## APPENDIX A — Example Enriched Response Flow

**User asks:** "What are my health goals?"  
**Benchmark question:** PH-007  
**Domain:** Profile & Household

**Current behavior (without COMP4A):**
```
Assistant: "I don't have documented health goals for you yet."
```
**Score:** D (weak) — honest but unhelpful.

**With COMP4A:**
```
Assistant: "You haven't set health goals yet. 

Health goals help personalize meal suggestions. Common goals include:
• Better energy (more balanced meals, steady protein)
• Improved digestion (more fiber, diverse plants)
• Reaching nutrition targets (specific macros/micros)
• Increased plant variety (aiming for 30+ plants/week)

You can set goals in your Profile. Each household member can have their own — great for mixed-diet families. I'll use your goals to suggest meals that fit what matters to you."
```
**Score:** B–A (good/excellent) — honest, informative, actionable.

**GOV1 compliance:**
- ✅ Requested: "health goals not set" (direct answer)
- ✅ Related: Examples of goals, why they matter (enrichment)
- ✅ General: Household + multi-eater context (principle)
- ✅ Sourced: Examples from help content + restriction library
- ✅ No fabrication: All claims grounded in platform knowledge

---

*COMP4A activates GOV1 for 50 benchmark questions across 5 domains.*  
*Target: +15–25 points on benchmark overall, with 80%+ questions in PH/CB/PL/NU/PA at B grade or better.*  
*Completion target: End of Q3 2026.*
