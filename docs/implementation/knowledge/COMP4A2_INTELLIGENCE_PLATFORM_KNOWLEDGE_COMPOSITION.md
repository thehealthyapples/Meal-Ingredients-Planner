# COMP4A2 — Intelligence Platform Knowledge Composition

**Status:** IMPLEMENTATION PLAN (REVISED ARCHITECTURE ALIGNMENT)  
**Adopted:** 2026-07-06  
**Classification:** Intelligence Platform Enhancement (Knowledge Plane)  
**Governing principles:**
- `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1) — Phase 1: User Help
- `THA_COMPANION_PLATFORM_ARCHITECTURE.md` — one canonical assistant
- `GOV1_PROGRESSIVE_KNOWLEDGE_DELIVERY_PRINCIPLE.md` — honest gaps with enrichment

---

## EXECUTIVE SUMMARY

COMP4A2 revises the Progressive Knowledge Delivery implementation to align with the Intelligence Platform architecture. The key correction:

**Progressive Knowledge Delivery is NOT a Conversation Gateway fallback mechanism.** It is a **Business Service Composition layer** inside the Intelligence Platform's knowledge plane, where each business service (Planner, Shopping, Meals, Household, etc.) progressively composes knowledge *before concluding an Honest Gap*.

The Conversation Gateway remains responsible only for:
- Identity and permission enforcement
- Routing to the Intelligence Platform
- Formatting and presenting results through the Companion Platform voice
- Classifying honest gaps (no-route / no-knowledge / no-results)

The Intelligence Platform's knowledge composition layer (inside `intelligencePlatform.handle()`) gains:
- **Business Service Composition Registry** — replaces "Registered Platform Capabilities"
- **Progressive Knowledge Search** — each business service can progressively widen context when the initial query returns an honest gap
- **Cross-service context enrichment** — Planner draws from cookbook meals, household context, historical patterns
- **Clear distinction** between requested context and related/enriched context

This document specifies the architecture change, then implements Progressive Knowledge Delivery for **ONE business service: Planner** as the proof-of-concept, following the same pattern for future services.

**Timeline:** 
- Architecture revision: 1–2 days
- Planner implementation: 3–4 days
- Benchmark execution: 1 day
- Report: 1 day

---

## 1. ARCHITECTURE REVISION: INTELLIGENT PLATFORM KNOWLEDGE COMPOSITION LAYER

### 1.1 The corrected layering

```
         ┌──────────────────────────────────────────────┐
         │  CONVERSATION GATEWAY (TIP3)                 │
         │  • Identity + permission check                │
         │  • Intent resolution                          │
         │  • Route to Intelligence Platform             │
         │  • Format response via Companion Platform     │
         │  • Classify unsuccessful turns (INT35)        │
         └──────────────────────────────────┬────────────┘
                                            │
                 ┌──────────────────────────▼──────────────────────────┐
                 │  INTELLIGENCE PLATFORM (TIP1)                        │
                 │                                                      │
                 │  ┌──────────────────────────────────────────────┐   │
                 │  │ Knowledge Plane (read-only)                  │   │
                 │  │                                              │   │
                 │  │ [Registered Capability] → handles request    │   │
                 │  │   (search/read/explain)                     │   │
                 │  │   ↓                                          │   │
                 │  │ If result is honest gap → progressive search │   │
                 │  │   [Business Service Composition]             │   │
                 │  │   • Search requested context                 │   │
                 │  │   • If absent, widen search to related       │   │
                 │  │     context (other weeks, related meals,     │   │
                 │  │     household context, etc.)                 │   │
                 │  │   • Enrich response with discovered context  │   │
                 │  │   ↓                                          │   │
                 │  │ If still no enrichment → return honest gap   │   │
                 │  │                                              │   │
                 │  └──────────────────────────────────────────────┘   │
                 │                                                      │
                 │ ┌──────────────────────────────────────────────┐    │
                 │ │ Action Plane (write + read data for display) │    │
                 │ │ [Intent Engine → invoke existing services]   │    │
                 │ └──────────────────────────────────────────────┘    │
                 └──────────────────────────────┬───────────────────────┘
                                                │
                    ┌────────────────────────────┴─────────────────────────┐
                    │                                                      │
                    ▼                                                      ▼
        ┌──────────────────────┐                          ┌──────────────────────┐
        │  Business Services   │                          │ Knowledge Ownership  │
        │  (Authoritative)     │                          │ (Single Source of    │
        │  • Planner           │                          │  Truth per TIP1)     │
        │  • Shopping          │                          │  • User data stores  │
        │  • Meals             │                          │  • Business metadata │
        │  • Household         │                          │  • Nutrition DB      │
        │  • Diary             │                          │  • Canonical entities│
        │  • Pantry            │                          └──────────────────────┘
        │  • Knowledge / Nutr. │
        └──────────────────────┘
```

**The key difference from COMP4A1:**

- **COMP4A1** added enrichment *after* an honest gap is determined by the Conversation Gateway, at response-formatting time.
- **COMP4A2** adds Progressive Knowledge Composition *inside* the Intelligence Platform's knowledge plane, so each business service can attempt enrichment *before* declaring an honest gap.

This means the business service (e.g., Planner capability) can say: "The user asked for 'meals this week', and week 1 is empty. But I can see week 2 has context, and the cookbook has related meals. Let me enrich the response with that related context before returning."

---

## 2. BUSINESS SERVICE COMPOSITION REGISTRY

The `Capability Registry` (TIP2) remains unchanged as a routing mechanism. **New:** Each capability that can handle user queries now declares:

```typescript
interface BusinessServiceCompositionConfig {
  /**
   * The capability this config applies to (e.g., "planner", "shopping").
   * Must match a registered capability in the Capability Registry.
   */
  readonly capability: string;

  /**
   * What queries this service can handle (verb + optional intent pattern).
   * Examples: "search:meals-by-week", "read:my-plan", "explain:why-meal-excluded"
   */
  readonly handledIntents: readonly string[];

  /**
   * Progressive knowledge search strategy when the primary query returns
   * an honest gap. Each step is tried in order; stops at the first match.
   */
  readonly progressiveSearchSteps: readonly ProgressiveSearchStep[];
}

interface ProgressiveSearchStep {
  /**
   * Human-readable label for what this step searches.
   * Examples: "other planner weeks", "related cookbook meals", "household context"
   */
  readonly label: string;

  /**
   * The search function: given the original intent context, search for
   * related knowledge. Returns enriched context or null.
   */
  readonly search: (context: ServiceCompositionContext) => Promise<EnrichedContext | null>;

  /**
   * How to present the enriched context to the user:
   * - "related": shown as "Here's related context..."
   * - "suggestion": shown as "You might also consider..."
   * - "notice": shown as a passive observation
   */
  readonly presentationMode: "related" | "suggestion" | "notice";
}

interface ServiceCompositionContext {
  /** The original utterance the user asked. */
  readonly utterance: string;
  /** The resolved intent the capability tried to fulfill. */
  readonly intent: ResolvedIntent;
  /** The honest gap message the primary query returned. */
  readonly primaryGapMessage: string;
  /** User context (household id, role, tier, preferences). */
  readonly userContext: IntelligenceContext;
  /** Storage accessor (scoped to user's permissions). */
  readonly storage: IStorage;
  /** The Intelligence Platform (for cross-service queries). */
  readonly intelligencePlatform: IIntelligencePlatform;
}

interface EnrichedContext {
  /** The enriched context to present (text or structured). */
  readonly content: string;
  /** Optional: structured data (meals, items, etc.) if available. */
  readonly data?: unknown;
  /** Which tier of the search found this (1–4, for logging). */
  readonly tier: 1 | 2 | 3 | 4;
}
```

---

## 3. PLANNER SERVICE: PROGRESSIVE KNOWLEDGE COMPOSITION

As the proof-of-concept implementation, the Planner service demonstrates how Progressive Knowledge Composition works.

### 3.1 Planner's composition strategy

**Primary query:** "What meals do I have for [day]?" → searches planner entries for that day.

**If result is empty → progressive search:**

1. **Step 1: Requested context** — check the requested day for any data
2. **Step 2: Widened planner context** — search other weeks for meal patterns
3. **Step 3: Cookbook context** — find related meals in user's cookbook
4. **Step 4: Household context** — explain household composition and planning constraints
5. **Step 5: Honest Gap** — no enrichment found; return "You haven't planned meals for that day yet"

### 3.2 Implementation: Planner Progressive Search Steps

#### Step 1: Requested Planner Context (Tier 1)

```typescript
export const plannerSearchStep1RequestedContext: ProgressiveSearchStep = {
  label: "Requested planner context",
  search: async (ctx: ServiceCompositionContext) => {
    const intent = ctx.intent as PlannerIntent; // parsed { week?: number, day?: string }
    const { week, day } = intent.parameters;
    
    if (!week && !day) return null; // No specific request; skip
    
    // Query the requested week/day
    const targetWeek = week || getCurrentWeek();
    const entries = await ctx.storage.getPlannerEntries(targetWeek, day);
    
    // If entries exist, we already returned data (not a gap) — skip composition
    if (entries.length > 0) return null;
    
    // Entries exist for this week, but not this day → user has planning data
    const weekEntries = await ctx.storage.getPlannerEntries(targetWeek);
    if (weekEntries.length > 0) {
      return {
        tier: 1,
        content: `You have ${weekEntries.length} meals planned for week ${targetWeek}, but none for ${day}. Here's what's planned:`,
        data: weekEntries,
      };
    }
    
    return null; // No planning data at all for this week
  },
  presentationMode: "related",
};
```

#### Step 2: Widened Planner Context (Tier 2)

Search other planner weeks to show meal patterns:

```typescript
export const plannerSearchStep2WidenedContext: ProgressiveSearchStep = {
  label: "Other planner weeks",
  search: async (ctx: ServiceCompositionContext) => {
    const intent = ctx.intent as PlannerIntent;
    const { week, day } = intent.parameters;
    const targetWeek = week || getCurrentWeek();
    
    // Find weeks with meal data
    const allWeeks = await ctx.storage.getPlannerWeeks(); // [1, 2, 3, ...]
    const withMeals = (await Promise.all(
      allWeeks.map(async (w) => ({
        week: w,
        count: (await ctx.storage.getPlannerEntries(w)).length,
      }))
    )).filter((w) => w.count > 0 && w.week !== targetWeek)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2); // Show top 2 weeks with meals
    
    if (withMeals.length === 0) return null;
    
    const details = await Promise.all(
      withMeals.map(async (w) => ({
        week: w.week,
        dayWithMeals: Array.from(new Set(
          (await ctx.storage.getPlannerEntries(w.week))
            .map((e) => e.day)
        )),
      }))
    );
    
    return {
      tier: 2,
      content: `You have meals planned in other weeks. For example: ${details.map((d) => `Week ${d.week} has meals on ${d.dayWithMeals.join(", ")}`).join("; ")}. Would you like to see any of these weeks?`,
      data: details,
    };
  },
  presentationMode: "related",
};
```

#### Step 3: Cookbook Context (Tier 2)

Find related meals the user has saved:

```typescript
export const plannerSearchStep3CookbookContext: ProgressiveSearchStep = {
  label: "Related cookbook meals",
  search: async (ctx: ServiceCompositionContext) => {
    // Extract key patterns from the utterance (cuisine, ingredient, meal type)
    const patterns = extractPlannerPatterns(ctx.utterance);
    if (patterns.length === 0) return null;
    
    // Search cookbook for related meals
    const cookbookMeals = await ctx.intelligencePlatform.handle({
      action: "meals.search",
      query: patterns.join(" OR "),
      limit: 3,
    }, ctx.userContext);
    
    if (cookbookMeals.status !== "ok" || !cookbookMeals.data?.meals?.length) {
      return null;
    }
    
    return {
      tier: 2,
      content: `You have similar meals in your cookbook that could work: ${cookbookMeals.data.meals.map((m) => m.name).join(", ")}. Would you like to add any of these to your plan?`,
      data: cookbookMeals.data.meals,
    };
  },
  presentationMode: "suggestion",
};
```

#### Step 4: Household Context (Tier 3)

Explain household composition and planning constraints:

```typescript
export const plannerSearchStep4HouseholdContext: ProgressiveSearchStep = {
  label: "Household planning context",
  search: async (ctx: ServiceCompositionContext) => {
    const household = await ctx.storage.getHousehold(ctx.userContext.householdId);
    if (!household) return null;
    
    const eaters = household.eaters || [];
    const restrictions = eaters.flatMap((e) => e.dietaryRestrictions || []);
    
    let contextMsg = `You're planning for a household of ${eaters.length} eater${eaters.length === 1 ? "" : "s"}`;
    if (restrictions.length > 0) {
      const uniqueRestrictions = Array.from(new Set(restrictions));
      contextMsg += ` with ${uniqueRestrictions.join(", ")} restrictions`;
    }
    contextMsg += ". This affects meal compatibility and suggestions.";
    
    return {
      tier: 3,
      content: contextMsg,
      data: { household, eaters, restrictions },
    };
  },
  presentationMode: "notice",
};
```

### 3.3 Integration point in the Planner capability

The Planner capability handler is modified to invoke Progressive Knowledge Composition when returning an honest gap:

```typescript
// Inside server/intelligence/capabilities/planner.ts (or similar)

async function handlePlannerQuery(
  intent: ResolvedIntent,
  context: IntelligenceContext,
  platform: IIntelligencePlatform,
): Promise<CapabilityExecutionResult> {
  const primaryResult = await queryPlannerData(intent);
  
  // If we have data, return success immediately
  if (primaryResult.status === "ok" && primaryResult.data?.count > 0) {
    return primaryResult;
  }
  
  // Honest gap: try progressive knowledge composition
  const compositionConfig = BUSINESS_SERVICE_COMPOSITION_REGISTRY["planner"];
  if (!compositionConfig) {
    // No composition configured; return the gap as-is
    return primaryResult;
  }
  
  const enrichments: EnrichedContext[] = [];
  for (const step of compositionConfig.progressiveSearchSteps) {
    const enriched = await step.search({
      utterance: intent.utterance,
      intent,
      primaryGapMessage: primaryResult.message || "No results found.",
      userContext: context,
      storage: createStorageScope(context.userId, context.householdId),
      intelligencePlatform: platform,
    });
    
    if (enriched) {
      enrichments.push(enriched);
      break; // Stop at first enrichment (can be configured per-step)
    }
  }
  
  // Return: gap + enrichments (clearly labeled)
  return {
    status: "gap",
    message: primaryResult.message,
    enrichments, // New field: [{ tier, content, data, presentationMode }]
  };
}
```

---

## 4. CONVERSATION GATEWAY: COMPANION PLATFORM INTEGRATION

The Conversation Gateway's role remains unchanged in responsibility, but gains awareness of enrichments from the Business Service Composition layer:

```typescript
// In conversation-gateway.ts buildGroundedResponse()

// After querying via intelligencePlatform.handle()
const outcome = await intelligencePlatform.handle(
  resolvedIntent,
  intelContext
);

// If the outcome includes enrichments (from Business Service Composition)
if (outcome.enrichments?.length > 0) {
  // The Companion Platform's Behaviour Engine now has access to enrichments
  // and can voice them alongside the gap message
  const enhancedMessage = voiceEnrichedGap(
    outcome.message,
    outcome.enrichments,
    personalityId
  );
  // ...return enhanced message to client
} else {
  // No enrichments: return gap as-is (existing INT35 behavior)
  const gapMessage = voiceFallback(outcome.message, personalityId);
  // ...
}
```

The Behaviour Engine (`behaviour-engine.ts`) gains a new function:

```typescript
/**
 * Voice an honest gap that includes enrichments from Business Service Composition.
 * Never modifies the gap itself; only changes how enrichments are framed.
 */
export function voiceEnrichedGap(
  gapMessage: string,
  enrichments: EnrichedContext[],
  personalityId: PersonalityId
): string {
  const personality = getPersonality(personalityId);
  const enrichedText = enrichments
    .map((e) => {
      // Presentation mode determines framing
      const prefix = {
        related: `Here's related context: `,
        suggestion: `You might also consider: `,
        notice: `By the way: `,
      }[e.presentationMode];
      
      return prefix + voiceEnrichment(e.content, personality);
    })
    .join("\n\n");
  
  return `${gapMessage}\n\n${enrichedText}`;
}
```

---

## 5. TESTING & VALIDATION: COMPANION BENCHMARK

### 5.1 Benchmark scope

Run the Companion Benchmark 100 v1 (`server/tests/benchmark/fixtures/companion-benchmark-100.v1.json`) before and after Planner Progressive Knowledge Composition is implemented.

Focus on Planner domain questions (PL-001 through PL-012):

| Question | Current behavior | Expected with COMP4A2 | Expected score |
|---|---|---|---|
| **PL-001** "What's on my meal plan this week?" | Empty week → gap | Empty week, but show other weeks with meals | B–A |
| **PL-002** "Do I have chicken planned?" | Not found → gap | If not in target week, show weeks that do | B–A |
| **PL-005** "Why weren't any meals suggested?" | Gap (no capability) | Enrich with household context + restrictions | B–A |
| **PL-010** "How do I plan for a mixed-diet household?" | Gap | Enrich with household member count + restrictions | A |
| Other PL questions | Current score | Aim for same or better | B or better |

### 5.2 Benchmark execution

**Before:**
```bash
npx tsx server/tests/test-companion-benchmark.ts --domain planner --report before-comp4a2.json
```

**After:**
```bash
npx tsx server/tests/test-companion-benchmark.ts --domain planner --report after-comp4a2.json
```

**Comparison:**
```bash
npx tsx server/tests/test-companion-benchmark.ts --compare before-comp4a2.json after-comp4a2.json
```

### 5.3 Scoring criteria

- **A grade** — Honest gap with relevant enrichment that advances understanding
- **B grade** — Honest gap with partial enrichment or general guidance
- **C grade** — Honest gap with no enrichment
- **D grade** — Unclear or misleading gap
- **F grade** — Incorrect, fabricated, or violates principles

---

## 6. IMPLEMENTATION PHASES

### Phase 1: Architecture Setup (1–2 days)

- [ ] Create `server/intelligence/conversation/business-service-composition-registry.ts`
  - Define `BusinessServiceCompositionConfig`, `ProgressiveSearchStep`, `ServiceCompositionContext` types
  - Create an empty registry (will be populated per service)

- [ ] Create `server/intelligence/conversation/service-composition.ts`
  - `executeProgressiveSearch(config, context): Promise<EnrichedContext[]>`
  - Orchestration logic for stepping through search layers

- [ ] Update `intelligencePlatform.handle()` to support enrichments in `CapabilityExecutionResult`
  - Add optional `enrichments: EnrichedContext[]` field
  - Document contract for capabilities returning enrichments

- [ ] Update Conversation Gateway to accept enrichments
  - Pass enrichments to Behaviour Engine
  - Update `TurnResult` type to surface enrichments

- [ ] Update Behaviour Engine
  - Add `voiceEnrichedGap()` function
  - Integrate enrichment presentation per personality

### Phase 2: Planner Service Implementation (3–4 days)

- [ ] Create `server/intelligence/capabilities/planner-composition.ts`
  - Implement 4 progressive search steps (requested, widened, cookbook, household)
  - Each step is a pure async function with error handling

- [ ] Update `server/intelligence/capabilities/planner.ts`
  - Integrate `BusinessServiceCompositionRegistry["planner"]` lookup
  - Invoke progressive search when primary query returns gap
  - Merge enrichments into capability result

- [ ] Write tests for each progressive search step
  - Test data: planner data with gaps, cookbook data, household context
  - Verify each step correctly returns enriched context or null
  - Verify search stops at first match (configurable)

- [ ] Integration test: end-to-end Planner query → enriched response
  - Trace through Conversation Gateway to Behaviour Engine

### Phase 3: Benchmark Execution (1 day)

- [ ] Run baseline benchmark on Planner domain (before COMP4A2)
  - Record baseline scores for PL-001 through PL-012
  - Verify no regressions in other domains

- [ ] Run benchmark after Planner implementation
  - Compare scores question-by-question
  - Aggregate domain-level improvements

- [ ] Generate benchmark report
  - Score improvement by question
  - Enrichment effectiveness by step (which steps contributed to score gains)
  - Any regressions (should be zero)

### Phase 4: Implementation Report (1 day)

- [ ] Document findings in `docs/implementation/knowledge/COMP4A2_INTELLIGENCE_PLATFORM_KNOWLEDGE_COMPOSITION.md`
  - Benchmark results (before/after scores)
  - Planner-specific improvements
  - Any regressions
  - Lessons learned
  - Recommendations for next services

---

## 7. FUTURE SERVICES: APPLYING THE PATTERN

Once Planner is complete and validated, the same Progressive Knowledge Composition pattern can be applied to:

- **Shopping:** Widen search to recent shopping baskets, suggest items from pantry
- **Meals:** Search related meals by nutrition, cuisine, ingredients when exact match not found
- **Household:** Search household member compatibility when explaining restrictions
- **Diary:** Widen search to week/month when day is empty
- **Pantry:** Search meal patterns when pantry is empty

Each service declares its own composition strategy in the registry; no changes to the Intelligence Platform or Conversation Gateway are needed.

---

## 8. CONSTRAINTS & BOUNDARIES

### Hard constraints

- ✅ Progressive Knowledge Composition happens **inside** the Intelligence Platform, not in the Gateway
- ✅ Each business service defines its own composition strategy (registered, not hardcoded)
- ✅ Enrichments are **clearly labeled** as "related", "suggestion", or "notice" — never ambiguous with primary data
- ✅ No enrichment contradicts or overrides the honest gap (gap + enrichment, never gap elimination)
- ✅ All enrichments sourced from existing platform data (storage, other services, metadata)
- ✅ No new data sources created (reuse user data, cookbook, household, etc.)
- ✅ No new capabilities registered (composition uses existing capabilities)
- ✅ Enrichment search respects user permissions (only data the user can see)
- ✅ Benchmark unchanged; scores computed identically before/after

### Non-goals

- ❌ Implementing composition for all services at once (Planner proof-of-concept only)
- ❌ Creating a general-purpose enrichment engine (each service's strategy is specific)
- ❌ Changing capability invocation logic (Intent Engine unchanged)
- ❌ Modifying the Capability Registry (Business Service Composition is separate)
- ❌ Fabricating data or making claims beyond what's in storage

---

## 9. SUCCESS CRITERIA

- [ ] Progressive Knowledge Composition architecture documented and reviewed
- [ ] Planner service gains 2–4 points on Planner benchmark questions (absolute)
- [ ] Zero regressions in Planner benchmark questions
- [ ] Zero regressions in other benchmark domains
- [ ] All enriched responses follow "gap + enrichment" pattern (no contradiction)
- [ ] All enrichments sourced to existing platform data (no fabrication)
- [ ] Implementation report completed with clear findings and next steps

---

## 10. ROLLBACK

COMP4A2 is a composable extension on top of existing Intelligence Platform behavior. Reverting is straightforward:

```bash
# Remove composition infrastructure
git rm server/intelligence/conversation/business-service-composition-registry.ts
git rm server/intelligence/conversation/service-composition.ts
git rm server/intelligence/capabilities/planner-composition.ts

# Revert capability files to previous version (remove enrichment handling)
git checkout HEAD server/intelligence/capabilities/planner.ts

# Revert gateway and behaviour-engine files (remove enrichment forwarding)
git checkout HEAD server/intelligence/conversation/conversation-gateway.ts
git checkout HEAD server/intelligence/conversation/behaviour-engine.ts

# Commit
git commit -m "Revert COMP4A2 — Business Service Composition"
```

No database changes, no breaking API changes.

---

## APPENDIX A: EXAMPLE PLANNER COMPOSITION FLOW

**User asks:** "What's on my meal plan this week?"  
**Benchmark question:** PL-001  
**Current week:** 1 (empty)

**Query flow:**

1. **Primary query** → `planner.search(week=1)` → no entries found
2. **Classification** → no-route? No. no-knowledge? Yes, but we can try enrichment.
3. **Progressive composition:**
   - Step 1 (requested context) → week 1 is empty, skip
   - Step 2 (widened context) → weeks 2, 3, 4 have meals; return context
   - (Stop — we found enrichment)
4. **Result:**
   ```
   You haven't planned meals for week 1 yet.

   Here's related context: You have meals planned in week 2 (Monday, Wednesday, Friday) and week 3 (Tuesday, Thursday). Would you like to see one of these weeks?
   ```

**Scoring before COMP4A2:**
- Response: "You haven't planned meals for week 1 yet."
- Grade: C (honest, but unhelpful)

**Scoring after COMP4A2:**
- Response: Honest gap + related context + actionable suggestion
- Grade: B–A (helpful enrichment)

---

## APPENDIX B: DISTINGUISHING REQUESTED VS RELATED CONTEXT

In all Planner responses, requested context and related/enriched context are explicitly separated:

```
[Requested:] "You haven't planned meals for Monday of week 1."

[Related:] "You have meals planned for Friday–Sunday of week 1. Would you like to see those?"

[Suggestion:] "You have similar meals in your cookbook that could work."

[Notice:] "You're planning for a mixed-diet household (2 eaters with fish allergies)."
```

This layering ensures the user never confuses related information with primary data, preserving transparency and trust (Companion Platform principle: *"The Companion Platform may never change what is claimed"*).

---

*COMP4A2 aligns Progressive Knowledge Delivery with the Intelligence Platform knowledge composition layer.*  
*Target completion: Q3 2026.*  
*Proof-of-concept: Planner service.*  
*Benchmark focus: Planner domain (12 questions).*
