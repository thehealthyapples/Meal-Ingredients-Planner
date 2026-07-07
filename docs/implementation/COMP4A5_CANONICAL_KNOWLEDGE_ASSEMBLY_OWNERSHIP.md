# COMP4A5 — Canonical Knowledge Assembly Ownership

**Status:** ARCHITECTURE (investigation + design, no implementation)  
**Scope:** Reposition Progressive Knowledge Delivery into the canonical Knowledge Assembly pipeline  
**Governing documents:** `GOV1_PROGRESSIVE_KNOWLEDGE_DELIVERY_PRINCIPLE.md`, `COMP4A4_COMPANION_RESPONSE_EXECUTION_TRACE.md`, `THA_COMPANION_PLATFORM_ARCHITECTURE.md`  
**Completed:** 2026-07-06  

---

## MANDATE

Move Progressive Knowledge Delivery from a **disconnected composition layer** into the **canonical Knowledge Assembly stage** so that:

- Knowledge Assembly becomes the single authoritative owner of response content composition
- Business services remain authoritative owners of business data
- The Behaviour Engine receives a complete, enriched Knowledge Package and applies only voice/tone/pacing
- Honest Gaps are invoked only after Knowledge Assembly has exhausted all platform knowledge sources (GOV1)
- Progressive disclosure is applied consistently across all personalities

---

## EXECUTIVE SUMMARY

### Current State (COMP4A4 Finding)
Progressive Knowledge Delivery infrastructure **exists but is unowned**:
- Composition runs in capability handlers (planner-composition.ts)
- Enrichment is built in the gateway (conversation-gateway.ts:602–632)
- But enrichment output is **never integrated into the response narrative**
- LLM gets bare capability data, not enriched context
- Result: Two-part response (text + enrichment card) instead of integrated narrative

### Proposed State (COMP4A5)
Create a single, owned Knowledge Assembly stage:
- **Executes:** After capabilities return data, before Behaviour Engine voicing
- **Owns:** Progressive knowledge search, composition, context enrichment, gap determination
- **Produces:** Knowledge Package with (answer, enrichments, honest_gap_state)
- **Boundary:** No business logic retrieval — only orchestrates existing owners

### Result
- Knowledge Assembly is the single truth about "what content is available"
- Behaviour Engine is the single truth about "how to voice it"
- User sees: Integrated narrative with enriched context, not two-part response
- Architecture: Clean separation of concerns, no duplication

---

## THE PROBLEM STATEMENT

### Three Integration Failures in Current Architecture

**Problem 1: Knowledge Ownership Unclear**
- Capabilities produce data (planner-composition.ts reads other weeks)
- Gateway builds enrichment (conversation-gateway.ts:602–632)
- Behaviour Engine voices responses (behaviour-engine.ts)
- **Question: Who owns the decision of WHAT to include in the response?**
- **Current answer:** No one — enrichment is built but never integrated

**Problem 2: Two-Part Response Architecture**
- User asks: "Do I have meals planned for week 1?"
- System returns:
  ```json
  {
    "text": "You haven't planned meals for week 1 yet.",
    "enrichment": [{ 
      "title": "Week 2 has 5 meals",
      "description": "..."
    }]
  }
  ```
- **Problem:** User sees primary text + separate card, not integrated narrative
- **Why it happens:** LLM is called before enrichment is built
- **Why this violates GOV1:** Knowledge Assembly did not exhaust available knowledge before declaring gap

**Problem 3: LLM Ignorance of Available Knowledge**
- Capability 1: Returns empty result for week 1
- Knowledge Composition: Finds week 2, week 3, cookbook matches
- LLM: Never sees composition results
- LLM Response: "You haven't planned meals for week 1 yet."
- **Missing:** "... but you have 5 meals in week 2, or 12 recipes in your cookbook"

### Root Cause
**No pipeline stage owns "what knowledge is available"** — it's scattered across:
- Capability handlers (composition)
- Gateway (enrichment assembly)
- LLM context (what LLM sees)
- Behaviour Engine (how to voice it)

---

## PROPOSED ARCHITECTURE

### New Pipeline Stage: Knowledge Assembly

```
┌─────────────────────────────────────────────────────────────────┐
│                   CONVERSATION GATEWAY                          │
│               (entry point, state management)                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│          1. INTENT RESOLUTION & CAPABILITY EXECUTION            │
│          (existing, unchanged)                                  │
│          Result: CapabilityQueryResult[]                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                 2. KNOWLEDGE ASSEMBLY ← NEW STAGE               │
│                                                                 │
│  Input: CapabilityQueryResult[], resolved intent, context       │
│                                                                 │
│  Responsibilities:                                              │
│  a) Classify capability outcomes (success vs gap)               │
│  b) Progressively compose knowledge:                            │
│     - Tier 1: Direct answer from capabilities                   │
│     - Tier 2: Related context (planner-composition, etc.)       │
│     - Tier 3: Adjacent enrichments                              │
│  c) Apply Silence Rules (cap, dedupe, prioritize)               │
│  d) Build Knowledge Package                                     │
│                                                                 │
│  Output: KnowledgePackage {                                     │
│    answerData: string,          // serialized capability result │
│    enrichments: Enrichment[],   // related context              │
│    gapState: "no-gap" | "no-knowledge" | ...  // honest state   │
│    gapReason: string            // why there's a gap (if any)   │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────┐           ┌──────────────┐
   │ Success     │           │ Gap          │
   │ (has data)  │           │ (no data)    │
   └─────────────┘           └──────────────┘
        │                         │
        ▼                         ▼
   3a. LLM Path              3b. Gap Voicing Path
   Compose context,         Behaviour Engine
   invoke LLM               applies voicing to gap
        │                   message + enrichments
        │                         │
        └────────────┬────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│           3. BEHAVIOUR ENGINE (voice & pacing layer)            │
│                                                                 │
│  Input: KnowledgePackage + PersonalityId                        │
│                                                                 │
│  Responsibilities:                                              │
│  a) Apply personality tone to LLM response OR gap message       │
│  b) Apply progressive disclosure (detail levels)                │
│  c) Apply pacing (short summary + expandable detail)            │
│  d) Format for response structure (Companion Cards, etc.)       │
│                                                                 │
│  Output: VoicedResponse {                                       │
│    text: string,            // personality-voiced narrative     │
│    disclosureLevel: "summary" | "detailed",                     │
│    expandableDetails: string[]  // for progressive reveal        │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│            4. RESPONSE ASSEMBLY & HTTP RETURN                   │
│            (existing, with updated payloads)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Knowledge Package Contract

The Knowledge Assembly stage produces a `KnowledgePackage` that the Behaviour Engine consumes:

```typescript
interface KnowledgePackage {
  // WHAT DATA IS AVAILABLE
  /** Serialized capability results (Tier 1 direct answer) */
  answerData: string;
  
  /** Related context & enrichments (Tiers 2–3) */
  enrichments: EnrichmentItem[];
  
  // WHAT IS THE STATE
  /** Classification of response state */
  gapState: "no-gap" | "no-knowledge" | "no-results" | "no-route" | "internal-error";
  
  /** Why the gap exists (for voicing) */
  gapReason?: string;
  
  /** Capabilities that were queried (for context) */
  queriedCapabilities: {
    capabilityId: string;
    verb: string;
    status: "ok-data" | "ok-empty" | "error";
  }[];
  
  /** Available guidance suggestions */
  guidance: GuidanceSuggestion[];
  
  /** Discoverable entities (for Companion Cards) */
  discoveries: NativeDiscoveryResponse[];
}

interface EnrichmentItem {
  /** Source capability or composition step */
  source: "composition" | "enrichment" | "guidance";
  
  /** Tier classification (GOV1) */
  tier: "tier1-direct" | "tier2-domain" | "tier3-adjacent" | "tier4-general";
  
  /** Ordered rank (for Silence Rules) */
  priority: number;
  
  /** Content */
  title: string;
  description: string;
  kind: "contextual-suggestion" | "related-feature" | "next-step" | "caveat";
  
  /** Rendering hint (for client) */
  disclosure?: "summary" | "detailed" | "expandable";
}
```

---

## OWNERSHIP MAP: WHO OWNS WHAT

| Concern | Current Owner | New Owner (COMP4A5) | Boundary |
|---------|---------------|-------------------|----------|
| **Business data retrieval** | Capability handlers | Capability handlers (unchanged) | Capabilities return data; they don't compose |
| **Business data composition** | planner-composition.ts (orphaned) | Knowledge Assembly | Composition orchestrates existing owners |
| **Knowledge exhaustion decision** | (no one — gap happens early) | Knowledge Assembly | "Is all available knowledge exhausted?" |
| **Honest Gap determination** | turn-fallback.ts | Knowledge Assembly (via classifyTurn) | Gap is determined AFTER composition search |
| **Honest Gap voicing** | behaviour-engine.ts | behaviour-engine.ts (unchanged) | How to say the gap, not whether to say it |
| **Response text generation** | LLM | LLM (unchanged) | LLM receives complete Knowledge Package context |
| **Personality application** | behaviour-engine.ts | behaviour-engine.ts (unchanged) | Tone, pacing, disclosure level |
| **Enrichment context** | gateway (scattered) | Knowledge Assembly | Single owner of "what's enriched in this response" |

**Hard boundary the Knowledge Assembly must NOT cross:**
- Knowledge Assembly does NOT retrieve data directly — it orchestrates existing owners
- Knowledge Assembly does NOT make business logic decisions — it sequences existing compositions
- Knowledge Assembly does NOT invoke capabilities — capabilities are invoked before this stage

---

## THE SINGLE IMPLEMENTATION POINT

### Location: Knowledge Assembly Stage (New File)

**File:** `server/intelligence/conversation/knowledge-assembly.ts`

**Entry Point:** Called from `conversation-gateway.ts:buildGroundedResponse()` after capability execution (line 420–432)

**Lifecycle:**

```typescript
// In conversation-gateway.ts:buildGroundedResponse() — AFTER capabilities execute

// BEFORE (current line ~420):
const capData: Record<string, string> = {};
const queryResults = new Map<string, CapabilityQueryResult>();
// ... execute capabilities ...

// AFTER (COMP4A5 addition):
const knowledgePackage = await knowledgeAssembly.assemble({
  queryResults,        // capability outcomes
  resolvedIntents,     // what was asked
  contextFrame,        // user's current context
  personalityId,       // for enrichment priorities
});

// Then either:
if (knowledgePackage.gapState === "no-gap") {
  // Success path: invoke LLM with enriched context
  const llmResponse = await llmProvider.complete({
    messages: buildMessages(knowledgePackage),  // includes enrichments
  });
} else {
  // Gap path: voice the gap with enrichments
  const gapText = voiceFallback(
    knowledgePackage.gapState,
    personalityId,
    { enrichments: knowledgePackage.enrichments }  // enrichments integrated
  );
}
```

### Knowledge Assembly Responsibilities

**1. Orchestrate Progressive Knowledge Search (GOV1)**

```typescript
async function assembleKnowledge(input: AssemblyInput): Promise<KnowledgePackage> {
  // TIER 1: Direct answer — do any capabilities have data?
  const tier1Data = extractDirectAnswers(input.queryResults);
  
  // TIER 2: Domain knowledge — call composition orchestrator
  // (This invokes the existing planner-composition, nutrition-composition, etc.)
  const tier2Enrichments = await compositionOrchestrator.search(
    input.resolvedIntents,
    input.contextFrame
  );
  
  // TIER 3: Adjacent context — gather guidance, discoveries
  const tier3Items = buildAdjacentContext(
    input.queryResults,
    input.resolvedIntents
  );
  
  // MERGE: Combine all tiers with Silence Rules
  const allEnrichments = [...tier1Data, ...tier2Enrichments, ...tier3Items];
  const silencedEnrichments = applySilenceRules(allEnrichments, 3); // cap at 3
  
  // CLASSIFY: Is this an honest gap?
  const gapState = classifyTurn(input.queryResults);
  
  // PACKAGE: Return complete context
  return {
    answerData: serializeCapabilityData(input.queryResults),
    enrichments: silencedEnrichments,
    gapState,
    gapReason: describeGap(gapState, input.queryResults),
    queriedCapabilities: summarizeQueries(input.queryResults),
    guidance: input.guidance,  // pre-built by gateway
    discoveries: input.discoveries,  // pre-built by gateway
  };
}
```

**2. Determine Gap State (After Exhaustion)**

```typescript
// GAP DETERMINATION: Move from line 505 (classifyTurn)
// to knowledge-assembly.ts AFTER all tiers have been searched

function classifyGapAfterSearch(
  queryResults: Map<string, CapabilityQueryResult>,
  foundEnrichments: number
): UnsuccessfulTurnState | null {
  // BEFORE: "no capability has data" → gap
  // AFTER: "no capability has data AND no enrichments found" → gap
  
  const hasDirectData = Array.from(queryResults.values())
    .some(r => r.status === "ok-data");
  
  const hasEnrichedContext = foundEnrichments > 0;
  
  if (hasDirectData) return null;  // Not a gap (have data)
  if (hasEnrichedContext) return null;  // Not a gap (have enrichment)
  
  // Now classify the gap type (no-knowledge, no-results, etc.)
  return classifyTurnState(queryResults);
}
```

**3. Apply GOV1 Tiering & Silence Rules**

```typescript
// Knowledge Assembly applies GOV1 classification to all items

function applyGOV1Tiering(enrichments: RawEnrichment[]): EnrichmentItem[] {
  return enrichments.map(e => ({
    ...e,
    tier: classifyTier(e.source, e.type),  // → tier1, tier2, tier3, tier4
    priority: calculatePriority(e.tier, e.recency, e.relevance),
  }));
}

function applySilenceRules(items: EnrichmentItem[], maxCount: number): EnrichmentItem[] {
  // Sort by priority, cap at maxCount
  return items
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxCount);
}
```

### Integration with Existing Owners

**Knowledge Assembly never duplicates retrieval:**

```typescript
// ✅ Correct: Knowledge Assembly orchestrates existing owners
const compositionResults = await compositionOrchestrator.search(
  intents,        // what was asked
  contextFrame    // by whom
  // (Orchestrator invokes actual planner-composition, etc.)
);

// ❌ Wrong: Knowledge Assembly retrieving data directly
const weeks = await db.query("SELECT * FROM planner_entries");  // NO
```

**Knowledge Assembly respects capability boundaries:**

```typescript
// ✅ Each capability still owns its data
const result = await intelligencePlatform.handle(intent);
// Capability returns: data, or gap, or error
// Knowledge Assembly receives that result
// Knowledge Assembly does NOT query the DB directly

// ✅ Composition modules are called, not replaced
const enrichment = await compositionOrchestrator.orchestrate(result);
// Planner composition runs planner-composition.ts logic
// Knowledge Assembly receives structured results
// Knowledge Assembly does NOT implement composition logic
```

---

## BEHAVIOUR ENGINE RESPONSIBILITIES (Clarified)

### What Behaviour Engine OWNS (unchanged from COMP1/EWO1)
- ✅ Personality application (tone, warmth, voice)
- ✅ Progressive disclosure (summary → detailed)
- ✅ Response pacing (short answer + expandable)
- ✅ Fallback message variants per personality
- ✅ Guidance suggestion voicing & reordering

### What Behaviour Engine DOES NOT OWN (new constraint)
- ❌ Knowledge retrieval (that's capabilities + composition)
- ❌ Enrichment discovery (that's Knowledge Assembly)
- ❌ Gap determination (that's Knowledge Assembly after search)
- ❌ Content selection (that's Knowledge Assembly + Silence Rules)
- ❌ Progressive knowledge search (that's Knowledge Assembly)

### Behaviour Engine's Single Responsibility

> Apply the chosen personality's voice, pacing, and progressive disclosure to the complete Knowledge Package, without changing WHAT is said, only HOW it is said.

```typescript
// Behaviour Engine operates ONLY on voicing

export function voiceGappedResponse(
  pkg: KnowledgePackage,
  personalityId: PersonalityId
): VoicedResponse {
  // Input: Complete Knowledge Package (what data exists + enrichments)
  // Output: Voiced narrative (how to say it)
  
  // Behaviour Engine does NOT search for knowledge
  // Behaviour Engine does NOT decide what to include
  // Behaviour Engine does NOT determine if gap exists
  
  // Behaviour Engine DOES:
  // 1. Take the gap message
  // 2. Weave in enrichments per personality
  // 3. Apply progressive disclosure levels
  // 4. Return voiced narrative
  
  const personality = getPersonality(personalityId);
  const baseGapMessage = buildGapMessage(pkg.gapState, pkg.gapReason);
  const enrichedMessage = weaveEnrichments(
    baseGapMessage,
    pkg.enrichments,
    personality.priorities
  );
  const voicedMessage = applyPersonalityTone(
    enrichedMessage,
    personality.behaviour
  );
  
  return {
    text: voicedMessage,
    disclosureLevel: personality.disclosureLevel || "summary",
    expandableDetails: buildExpandableDetails(
      pkg.enrichments,
      personality.detailLevel
    ),
  };
}
```

---

## RELATIONSHIP TO EXISTING ARCHITECTURE

### THA Companion Platform (COMP1)
- Knowledge Assembly is a **governance detail** under the Conversation Gateway
- Behaviour Engine responsibilities **clarified but unchanged**
- All five Companion Platform responsibilities remain (Personality, Behaviour, Observation, Growth, Guidance)

### THA Intelligence Platform (TIP1, TIP2, TIP3)
- Knowledge Assembly sits **within the Gateway** (TIP3 Part 3)
- Capabilities are unchanged — still the authoritative owners
- Conversation store is unchanged — still records turns + references
- Intent Engine is unchanged — still resolves utterances

### GOV1 — Progressive Knowledge Delivery
- Knowledge Assembly is the **implementation mechanism** for GOV1
- GOV1 defines the principle (search Tiers 1–4 before gaps)
- Knowledge Assembly orchestrates that search order

### COMP4A3 — Planner Composition
- **Not changed** — still runs inside planner handlers
- **Newly called** — by Knowledge Assembly's composition orchestrator
- **Newly prioritized** — composition output is integrated, not orphaned

---

## IMPLEMENTATION SEQUENCE

### Phase 1: Knowledge Assembly Creation (This document)
- ✅ Design Knowledge Assembly contract (KnowledgePackage)
- ✅ Identify single implementation point
- ✅ Clarify Behaviour Engine boundaries
- ✅ Map to existing architecture

### Phase 2: Stub Implementation (COMP4A6)
- Implement `knowledge-assembly.ts` as a stub
- Takes queryResults → returns KnowledgePackage
- Currently: Direct mapping (no composition search yet)
- Tests pass with current behavior

### Phase 3: Tier 1 Integration (COMP4A7)
- Call Knowledge Assembly from conversation-gateway.ts
- Pass LLM the complete KnowledgePackage context
- LLM can now see enrichments → richer responses
- No composition search yet (still tier 1 only)

### Phase 4: Progressive Composition Integration (COMP4A8)
- Composition Orchestrator calls existing planner-composition
- Knowledge Assembly tier 2 search
- Enrichments found → integrated into LLM context
- Honest gaps now truly AFTER exhaustion

### Phase 5: Gap Voicing Integration (COMP4A9)
- Behaviour Engine receives enrichments for gap messages
- `voiceFallback()` weaves enrichments into gap
- User sees: integrated narrative, not two-part response

---

## VERIFICATION CHECKLIST

Before any implementation passes review, verify:

### Knowledge Assembly Ownership
- [ ] Knowledge Assembly owns the decision "what content is available"
- [ ] Knowledge Assembly does NOT retrieve data directly
- [ ] Knowledge Assembly does NOT implement business logic
- [ ] Knowledge Assembly orchestrates existing composition owners

### Behaviour Engine Clarity
- [ ] Behaviour Engine has NO knowledge retrieval responsibility
- [ ] Behaviour Engine receives complete KnowledgePackage
- [ ] Behaviour Engine applies only voice/tone/pacing
- [ ] Behaviour Engine cannot add/remove/reorder content

### GOV1 Compliance
- [ ] Tier 1 (direct answer) is attempted first
- [ ] Tier 2 (domain knowledge) is searched before gap
- [ ] Tier 3 (adjacent context) is searched before gap
- [ ] Honest Gap is final fallback, not first resort

### Response Quality
- [ ] User sees integrated narrative (not two-part response)
- [ ] Enrichments are in primary text (not separate card)
- [ ] Enrichment pacing matches personality
- [ ] Progressive disclosure works (summary → detail)

---

## NON-NEGOTIABLES

Hard stops that must be maintained:

- **Knowledge Assembly will not cross capability boundaries.** If a retrieval is needed, it goes through intelligencePlatform.handle() or an existing service — never direct DB queries.
- **Behaviour Engine will not retrieve knowledge.** Enrichment content is provided by Knowledge Assembly; Behaviour Engine applies only voice.
- **Honest gaps will only be invoked after Knowledge Assembly searches Tiers 1–3.** Moving "no data found" to earlier in the pipeline is a regression.
- **Business services remain authoritative.** Knowledge Assembly is an orchestrator, not a new owner of business truth.
- **No duplication of existing retrieval logic.** If composition is already in planner-composition.ts, Knowledge Assembly calls it; doesn't reimplement it.

---

## OPEN QUESTIONS FOR IMPLEMENTATION

1. **Composition Orchestrator Interface:** What's the standard interface for invoking composition?
   - Should all compositions (planner, nutrition, household) be discoverable via a registry?
   - Or should Knowledge Assembly have a hardcoded list?

2. **Enrichment Prioritization:** How should Silence Rules rank enrichments?
   - By recency? Relevance? Tier? User preference?
   - Should there be a user setting for detail level?

3. **Progressive Disclosure:** Should disclosure levels be per-personality?
   - E.g., "coach" personality always verbose, "sergeant" always terse?
   - Or per-situation (gap vs success) and per-user preference?

4. **LLM Context Formatting:** How should enrichments be formatted for LLM?
   - Current: markdown sections
   - Proposed: structured with tier/priority markers?
   - Should LLM see the GoV1 tier? Or just prioritized content?

5. **Client Rendering:** How should client differentiate summary vs expandable?
   - Current: enrichment is separate card
   - Proposed: enrichment is in text, with expandable sections
   - Should Companion Cards change to support inline expansion?

---

## ROLLBACK & REVERT

This document is architecture only. To revert:

```bash
git rm docs/implementation/COMP4A5_CANONICAL_KNOWLEDGE_ASSEMBLY_OWNERSHIP.md
git commit -m "Revert COMP4A5 — Canonical Knowledge Assembly Ownership (not implemented)"
```

No code is modified by this document.

---

*Architecture design document. Governs implementation phases COMP4A6–COMP4A9.*  
*The single implementation point is: `server/intelligence/conversation/knowledge-assembly.ts` called from `conversation-gateway.ts:buildGroundedResponse()` after capability execution.*  
*Completes requirement: Reposition Progressive Knowledge Delivery into canonical pipeline.*
