# COMP4A2 Implementation Guide

**Status:** Implementation in Progress  
**Architecture Document:** `docs/implementation/knowledge/COMP4A2_INTELLIGENCE_PLATFORM_KNOWLEDGE_COMPOSITION.md`  
**Created:** 2026-07-06

---

## Quick Start

This guide coordinates the implementation of Progressive Knowledge Delivery into the Intelligence Platform's knowledge composition layer, starting with the Planner service.

### Files Created (Infrastructure)

1. **Business Service Composition Registry**
   - `server/intelligence/conversation/business-service-composition-registry.ts`
   - Defines the contract for progressive search steps
   - Holds the registry mapping capabilities to composition strategies

2. **Service Composition Orchestration**
   - `server/intelligence/conversation/service-composition.ts`
   - Executes progressive searches
   - Formats enriched gap messages for the Behaviour Engine

3. **Planner Composition Strategy**
   - `server/intelligence/capabilities/planner-composition.ts`
   - Implements 4 progressive search steps
   - Ready to be registered with the Intelligence Platform

### Files to Update (Integration)

These files must be updated to wire the composition infrastructure into the existing pipeline:

1. **Planner Capability Handler**
   - File: `server/intelligence/handlers/planner-read-handler.ts`
   - Task: When primary query returns gap, invoke `executeProgressiveComposition()`
   - Integration point: After determining the response is an honest gap

2. **Planner Discovery Handler**
   - File: `server/intelligence/handlers/planner-discovery-handler.ts`
   - Task: Same as read handler — enrich discovery gaps

3. **Capability Execution Result Type**
   - File: `server/intelligence/types.ts`
   - Task: Add optional `enrichments: EnrichedContext[]` field to `CapabilityExecutionResult`

4. **Conversation Gateway**
   - File: `server/intelligence/conversation/conversation-gateway.ts`
   - Task: Pass enrichments to Behaviour Engine when handling gaps

5. **Behaviour Engine**
   - File: `server/intelligence/conversation/behaviour-engine.ts`
   - Task: Add `voiceEnrichedGap()` function to format enriched gaps per personality

6. **Startup / Initialization**
   - File: `server/index.ts` or similar
   - Task: Call `registerBusinessServiceComposition(PLANNER_COMPOSITION_CONFIG)` at startup

---

## Implementation Phases

### Phase 1: Capability Integration (2–3 days)

**Objective:** Wire the Planner capability to use Progressive Knowledge Composition when returning gaps.

#### Step 1a: Update `CapabilityExecutionResult` type

In `server/intelligence/types.ts`, add enrichments support:

```typescript
export interface CapabilityExecutionResult {
  readonly status: "ok" | "gap" | "error" | "not_executable" | ...;
  readonly message?: string;
  readonly data?: unknown;
  
  // NEW: optional enrichments when returning a gap
  readonly enrichments?: EnrichedContext[];
}
```

**Why:** Capabilities need a way to return enrichments alongside the gap message.

#### Step 1b: Update Planner Read Handler

File: `server/intelligence/handlers/planner-read-handler.ts`

At the point where a gap is determined (e.g., empty week), add:

```typescript
import {
  executeProgressiveComposition,
  createStorageScope,
} from "../conversation/service-composition.js";

// ... inside handleRead() or similar

// Determine gap (empty week, etc.)
if (!hasData) {
  // Try to enrich the gap
  const enrichments = await executeProgressiveComposition(
    "planner", // capability name
    intent, // resolved intent
    intelContext, // user context
    gapMessage, // the honest gap message
    createStorageScope(userId, householdId, storage), // scoped storage
    intelligencePlatform, // for cross-service queries
    { maxEnrichments: 1 } // stop at first enrichment
  );

  return {
    status: "gap",
    message: gapMessage,
    enrichments, // NEW: include enrichments
  };
}
```

**Why:** This is where the primary query has determined there's no data — perfect place to invoke composition.

#### Step 1c: Update Planner Discovery Handler

File: `server/intelligence/handlers/planner-discovery-handler.ts`

Same pattern as read handler: when search yields no results, add enrichments:

```typescript
// If search result is empty
if (result.totalCount === 0) {
  const enrichments = await executeProgressiveComposition(
    "planner-discovery",
    intent,
    intelContext,
    gapMessage,
    createStorageScope(userId, householdId, storage),
    intelligencePlatform,
    { maxEnrichments: 1 }
  );

  return {
    status: "gap",
    message: gapMessage,
    enrichments,
  };
}
```

#### Step 1d: Register Planner Composition

File: `server/index.ts` (or startup initialization)

Add at server startup:

```typescript
import { PLANNER_COMPOSITION_CONFIG } from "./intelligence/capabilities/planner-composition.js";
import { registerBusinessServiceComposition } from "./intelligence/conversation/business-service-composition-registry.js";

// After Intelligence Platform initialization
registerBusinessServiceComposition(PLANNER_COMPOSITION_CONFIG);
console.log("[Startup] Registered Planner Progressive Knowledge Composition");
```

**Why:** The registry must be populated before any capability tries to use it.

### Phase 2: Gateway & Behaviour Integration (2 days)

**Objective:** Make the Conversation Gateway aware of enrichments and forward them to the Behaviour Engine.

#### Step 2a: Update Conversation Gateway

File: `server/intelligence/conversation/conversation-gateway.ts`

After `intelligencePlatform.handle()` returns an outcome with enrichments:

```typescript
import {
  formatEnrichedGapMessage,
} from "./service-composition.js";

// ... inside buildGroundedResponse()

const outcome = await intelligencePlatform.handle(
  resolvedIntent,
  intelContext
);

// Check if outcome includes enrichments from Business Service Composition
if (outcome.status === "gap" && outcome.enrichments?.length > 0) {
  // Merge enrichments with the gap message
  const enrichedMessage = formatEnrichedGapMessage(
    outcome.message || "I don't have that information.",
    outcome.enrichments
  );

  // Voice via Behaviour Engine (see Step 2b below)
  const voicedMessage = voiceEnrichedGap(
    enrichedMessage,
    personalityId
  );

  return {
    text: voicedMessage,
    fallbackState: "no-knowledge", // still an honest gap, just enriched
    // ... rest of TurnResult
  };
} else if (outcome.status === "gap") {
  // No enrichments — existing INT35 behavior
  const voicedMessage = voiceFallback(
    outcome.message || "I don't have that information.",
    personalityId
  );
  // ...
}
```

**Why:** Enrichments need to be formatted and voiced before returning to the client.

#### Step 2b: Update Behaviour Engine

File: `server/intelligence/conversation/behaviour-engine.ts`

Add a new export for enriched gaps:

```typescript
/**
 * Voice an honest gap that includes enrichments from Business Service Composition.
 * The gap message (requested context) stays intact; enrichments are voiced in a
 * voice-specific way based on presentation mode.
 */
export function voiceEnrichedGap(
  enrichedMessage: string,
  personalityId: PersonalityId
): string {
  // For now, simply return the message as-is
  // Future: apply personality-specific phrasing to enrichment labels
  // (e.g., "friendly" personality says "Good news!", "coach" says "Here's what I found:")
  
  const personality = normalizePersonality(personalityId);
  
  // Placeholder: In a real implementation, this would rewrite the enrichment
  // prefixes ("Here's related context", "You might also consider", etc.) in
  // the chosen voice, without changing the content itself.
  
  return enrichedMessage; // For now, pass through
}
```

**Why:** The Behaviour Engine should apply personality-specific voicing to enrichment framing (not content — content stays factual and unchanged).

### Phase 3: Testing (2 days)

**Objective:** Verify progressive composition works end-to-end.

#### Step 3a: Unit Tests for Composition Steps

Create: `server/tests/test-planner-composition.ts`

Test each step independently:

```typescript
import {
  plannerCompositionStep1RequestedContext,
  plannerCompositionStep2WidenedContext,
  plannerCompositionStep3CookbookContext,
  plannerCompositionStep4HouseholdContext,
} from "../intelligence/capabilities/planner-composition.js";

describe("Planner Composition Steps", () => {
  describe("Step 1: Requested Context", () => {
    test("enriches when full week has meals but requested day is empty", async () => {
      // Mock storage: week 1 has meals on Mon/Wed/Fri, but user asked about Tuesday
      // Expect: enrichment showing Mon/Wed/Fri

      const mockStorage = {
        getPlannerEntries: async (week?: number) => {
          if (week === 1) {
            return [
              { day: "Monday", meal: "pasta" },
              { day: "Wednesday", meal: "chicken" },
              { day: "Friday", meal: "fish" },
            ];
          }
          return [];
        },
      };

      const context = {
        utterance: "What's on Tuesday?",
        intent: { parameters: { scope: "day", weekNumber: 1, dayOfWeek: 1 } },
        primaryGapMessage: "No meals on Tuesday.",
        userContext: { userId: 1, householdId: 1 },
        storage: mockStorage,
        intelligencePlatform: {},
      };

      const enriched = await plannerCompositionStep1RequestedContext.search(context);

      expect(enriched).toBeDefined();
      expect(enriched?.content).toContain("Monday");
      expect(enriched?.presentationMode).toBe("related");
    });
  });

  // Similar tests for Steps 2, 3, 4...
});
```

#### Step 3b: Integration Tests

Create: `server/tests/test-planner-composition-integration.ts`

Test end-to-end: Query → Gap → Composition → Enriched Response

```typescript
import { executeProgressiveComposition } from "../intelligence/conversation/service-composition.js";
import { PLANNER_COMPOSITION_CONFIG } from "../intelligence/capabilities/planner-composition.js";

describe("Planner Composition Integration", () => {
  test("enriches empty week query with widened context", async () => {
    // Setup: User has weeks 1, 2, 3 planner data
    // Query: "What's on week 1?" (empty)
    // Expected: Enrichment showing weeks 2, 3 have data

    const mockStorage = createMockStorageWithPlannerData({
      week1: [], // empty
      week2: [{ day: "Monday", meal: "pasta" }],
      week3: [{ day: "Tuesday", meal: "chicken" }],
    });

    const enrichments = await executeProgressiveComposition(
      "planner",
      { verb: "search", name: "planner", utterance: "what's on week 1" },
      { userId: 1, householdId: 1, hasPremiumAccess: true },
      "No meals planned for week 1.",
      mockStorage,
      mockIntelligencePlatform(),
      { maxEnrichments: 1 }
    );

    expect(enrichments.length).toBeGreaterThan(0);
    expect(enrichments[0].tier).toBe(2); // Widened context
    expect(enrichments[0].content).toContain("week 2");
  });
});
```

### Phase 4: Benchmark Execution (1 day)

**Objective:** Measure improvement in Planner domain benchmark questions.

#### Step 4a: Baseline (Before COMP4A2)

```bash
# Run benchmark on Planner domain only
npx tsx server/tests/test-companion-benchmark.ts \
  --domain planner \
  --output /tmp/benchmark-before-comp4a2.json
```

Record baseline scores for PL-001 through PL-012.

#### Step 4b: Implement & Deploy

After completing Phases 1–3, deploy the changes to the running system.

#### Step 4c: After-Implementation Benchmark

```bash
# Run same benchmark to measure improvement
npx tsx server/tests/test-companion-benchmark.ts \
  --domain planner \
  --output /tmp/benchmark-after-comp4a2.json
```

#### Step 4d: Compare Results

```bash
# Generate comparison report
npx tsx server/tests/test-companion-benchmark.ts \
  --compare /tmp/benchmark-before-comp4a2.json /tmp/benchmark-after-comp4a2.json \
  --report /tmp/comp4a2-benchmark-report.md
```

Expected output:
- Before: PL-001 through PL-012 scores (likely mix of C–D grades)
- After: Same questions with enriched context (B–A grades expected)
- Score delta: +2–4 points per improved question

### Phase 5: Implementation Report (1 day)

**Objective:** Document findings and lessons learned.

**Report should include:**

1. **Benchmark Results**
   - Before/after scores by question
   - Domain-level improvement (aggregate Planner score change)
   - Any regressions (should be zero)

2. **Composition Effectiveness**
   - Which steps contributed most to improvements
   - Which questions still need work
   - Ideas for next service

3. **Lessons Learned**
   - What worked well
   - Challenges encountered
   - Recommendations for Shopping, Meals, etc.

4. **Future Work**
   - Apply pattern to Shopping service
   - Apply pattern to Meals/Cookbook service
   - Expand composition steps as new platform features ship

---

## Architecture Alignment Checklist

- [ ] Progressive Knowledge Composition lives in Intelligence Platform knowledge plane (not Gateway)
- [ ] Business Service Composition Registry is the registry (replacing "Registered Platform Capabilities" terminology)
- [ ] Each service defines its own composition strategy
- [ ] Enrichments are clearly labeled (related / suggestion / notice)
- [ ] No new data sources created (all from existing storage/services)
- [ ] No fabrication (all enrichments sourced to platform data)
- [ ] Gaps are preserved (enrichments supplement, never replace gaps)
- [ ] Planner service fully implements the pattern
- [ ] Benchmark unchanged and results measured
- [ ] Implementation report completed

---

## Quick Integration Checklist

For each capability that will support composition:

- [ ] Define progressive search steps (e.g., planner-composition.ts)
- [ ] Create `BusinessServiceCompositionConfig`
- [ ] Call `registerBusinessServiceComposition()` at startup
- [ ] Update capability handler to invoke `executeProgressiveComposition()` on gaps
- [ ] Update `CapabilityExecutionResult` type (if not already done)
- [ ] Wire enrichments through Gateway to Behaviour Engine
- [ ] Write unit tests for each step
- [ ] Write integration test end-to-end
- [ ] Benchmark before/after
- [ ] Document in implementation report

---

## Common Pitfalls & Solutions

### Pitfall 1: Enrichments as Fabrication

**Problem:** Adding information that isn't sourced from storage/services.

**Solution:** Every enrichment step must return data from `storage` or `intelligencePlatform.handle()`. No AI-generated enrichments; only composition of existing facts.

### Pitfall 2: Composition as Capability Invocation

**Problem:** A step calls `intelligencePlatform.handle()` on a capability directly.

**Solution:** Composition never invokes capabilities. It queries storage directly (scoped) or uses helper functions. If cross-service data is needed, define a helper function in the service's library, don't call the capability.

### Pitfall 3: Enrichments Hiding Gaps

**Problem:** Enrichments make the gap seem smaller/less important than it is.

**Solution:** Keep gaps and enrichments clearly separated. Gap: "You haven't planned meals for Monday." Enrichment: "Here's related context: You have meals planned for other days." Never merge them.

### Pitfall 4: Over-Enrichment (Bloat)

**Problem:** Returning too much context, overwhelming the user.

**Solution:** Stop at the first enrichment (default behavior). Future: let UX decide if/when to show additional enrichments. Cap at 1–2 enrichments per gap.

### Pitfall 5: Permissions Bypass

**Problem:** Composition reveals data the user shouldn't see (other household, premium-only, etc.).

**Solution:** Use `createStorageScope()` to enforce scoping. Respect `userContext.hasPremiumAccess` checks in `step.premiumOnly`.

---

## Debugging Tips

### Enable Composition Logging

Add to `service-composition.ts`:

```typescript
if (process.env.DEBUG_COMPOSITION) {
  console.log(
    `[Composition] Executing for capability: ${capability}`,
    `intents: ${config.triggeredByIntents}`
  );
}
```

Run with:

```bash
DEBUG_COMPOSITION=1 npx tsx ...
```

### Inspect Enrichments

In the Conversation Gateway, log enrichments:

```typescript
if (outcome.enrichments?.length > 0) {
  console.log(`[Gateway] Enrichments:`, {
    capability: outcome.capability,
    tiers: outcome.enrichments.map((e) => e.tier),
    presentations: outcome.enrichments.map((e) => e.presentationMode),
  });
}
```

### Unit Test a Single Step

```bash
npx tsx server/tests/test-planner-composition.ts \
  --grep "Step 2: Widened Context"
```

---

## Questions?

Refer back to the architecture document: `docs/implementation/knowledge/COMP4A2_INTELLIGENCE_PLATFORM_KNOWLEDGE_COMPOSITION.md`

Key sections:
- §1: Architecture revision and layering
- §2: Business Service Composition Registry
- §3: Planner's composition strategy
- §4: Gateway integration
- §5: Testing & validation
