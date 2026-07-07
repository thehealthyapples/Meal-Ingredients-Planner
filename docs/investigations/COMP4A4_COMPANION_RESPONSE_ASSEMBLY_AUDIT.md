# COMP4A4 — Companion Response Assembly Audit

**Status:** INVESTIGATION COMPLETE  
**Completed:** 2026-07-06  
**Scope:** Complete execution path from user input to final response  
**Focus:** Identify optimal integration point for Progressive Knowledge Composition  

---

## EXECUTIVE SUMMARY

The Companion response assembly is a **multi-stage pipeline** with **clear separation between capability data retrieval, gap classification, and response formatting**. Progressive Knowledge Composition is already **infrastructure-complete** but **not yet integrated into the response presentation layer**.

**Optimal Integration Point:** The **Behaviour Engine's gap-voicing stage** (after gap classification, before response formatting) is the single best integration point for maximum user impact. This is where Honest Gaps are created and where enriched gap messages should be assembled.

---

## COMPLETE EXECUTION PATH

### Entry Point: HTTP Request
- **File:** `server/routes.ts:11310`
- **Route:** `POST /api/intelligence/conversation/turn`
- **Input:** User utterance + surface context hints
- **Auth:** Requires authenticated user

```
POST /api/intelligence/conversation/turn
  {
    "utterance": "What am I having this week?",
    "surface": "planner",
    "surfaceHints": { "activePlannerWeekId": 13 }
  }
```

### Stage 1: Conversation State Setup
- **File:** `server/intelligence/conversation/conversation-gateway.ts:878–904`
- **Method:** `ConversationGateway.processUserTurn()`
- **Actions:**
  1. Get or create conversation for user
  2. Get or open active thread
  3. Read user's personality preference
  4. Resolve prior entity references (pronoun resolution)
  5. Assemble context frame (pointers to relevant data)
  6. Record user turn to database

**Key Output:** `ContextFrame` containing:
- User identity (userId, householdId)
- Surface (where user is in the app)
- Surface hints (active week, selected meal, etc.)
- Prior entity references

### Stage 2: Response Building
- **File:** `server/intelligence/conversation/conversation-gateway.ts:335–793`
- **Function:** `buildGroundedResponse()`
- **Input:** Utterance, context frame, history
- **Output:** Complete response object with text, entities, outcomes, discoveries, guidance, enrichment

#### Sub-stage 2a: Write Intent Guard
- **Line:** 367–395
- **Action:** Detect and reject write intents early (read-only platform)
- **Gap Type:** `not_executable`
- **Output:** Honest gap message + outcome
- **Enrichments:** None (write intents return empty)

#### Sub-stage 2b: Intent Resolution
- **Line:** 410–418
- **Method:** `intentResolver.resolve(utterance, hints)`
- **Action:** Parse utterance → resolve to typed intents
- **Output:** `ResolvedIntent[]` with (capability, verb, parameters, confidence)
- **Example:** "What am I having this week?" → `planner/read:week`

#### Sub-stage 2c: Capability Execution (Parallel)
- **Line:** 420–432
- **Method:** `queryCapability(intent, context, handleIntent)`
- **Action:** Execute each resolved intent through Intelligence Platform
- **Platform Route:** 
  ```
  Conversation Gateway 
    → intelligencePlatform.handle()
    → Capability Registry
    → Planner Read Handler
    → Storage queries
    → Return: data or gap
  ```
- **Output:** `CapabilityQueryResult` map with:
  - `status`: "ok-data" | "ok-empty" | "no-knowledge" | "error"
  - `outcome`: IntentOutcome with message
  - `data`: Serialized result (for LLM context)

#### Sub-stage 2d: Sequential Composition (INT42)
- **Line:** 434–462
- **Action:** Derived query based on first capability results (e.g., Uplift → Food Intelligence)
- **Implementation:** `capability-composition.ts`
- **Note:** Different from COMP4A2 Progressive Composition (executed AFTER primary query)

#### Sub-stage 2e: Gap Classification
- **Line:** 505–562
- **Method:** `classifyTurn(queried)`
- **Input:** Per-intent outcomes
- **Output:** `fallbackState: "no-route" | "no-knowledge" | "no-results" | "internal-error" | null`
- **Classification Logic:**
  - `no-route`: Resolver didn't understand (no utterance-derived intents)
  - `no-knowledge`: Routed but capability returned gap
  - `no-results`: Routed and searched but found nothing
  - `internal-error`: Capability/LLM exception
  - `null`: At least one capability returned data

#### Sub-stage 2f: Honest Gap Voicing
- **Line:** 507–562
- **Method:** `voiceFallback(fallbackState, personalityId, options)`
- **Action:** Create state-specific gap message with personality voicing
- **File:** `server/intelligence/conversation/behaviour-engine.ts`
- **Message Examples:**
  - "no-route": "I didn't quite understand that..."
  - "no-knowledge": "You haven't planned meals for this week yet..."
  - "no-results": "I couldn't find any..." 
  - "internal-error": "Something went wrong on my end..."

**KEY FINDING:** This is where enrichments should be integrated. Currently enrichments are built (lines 602–632) but NOT merged into the gap message.

#### Sub-stage 2g: Discovery Extraction (INT36)
- **Line:** 573–579
- **Action:** Extract canonical THA entities from successful capabilities
- **Output:** `NativeDiscoveryResponse[]` with structured entities

#### Sub-stage 2h: Guidance Assembly (INT38/INT39)
- **Line:** 581–595
- **Action:** Build "next-step" suggestions from successful capabilities
- **Source:** `companion-guidance.ts` registry
- **Output:** `GuidanceSuggestion[]`

#### Sub-stage 2i: Enrichment Assembly (INT41 + NUT1 + FI5)
- **Line:** 602–632
- **Sources:**
  - **INT41:** Static capability enrichment (insights, explanations, recommendations)
  - **NUT1:** Nutrition-specific enrichment (from nutrition-knowledge + profile)
  - **FI5:** Household-nutrition enrichment (from nutrition-knowledge + household)
- **Output:** `CompanionEnrichmentItem[]` (up to 3 items)

**CRITICAL FINDING:** Enrichments are built here but returned as a SEPARATE field in the response object. They are NOT integrated into the response text.

#### Sub-stage 2j: Action Assembly (INT40)
- **Line:** 639–642
- **Method:** `buildActionProposals(discoveries, slotContext)`
- **Action:** Create executable Companion Actions (add meal, etc.)
- **Output:** `CompanionActionProposalDraft[]`

#### Sub-stage 2k: LLM Invocation (Success Path Only)
- **Line:** 665–751
- **Action:** Invoke LLM only if at least one capability returned data
- **Input to LLM:**
  - System prompt (hard rules + personality voice)
  - Conversation history (last 5 turns)
  - User utterance
  - Context sections (capability data formatted as markdown)
- **Prompt Structure:**
  ```
  System: You are Apple, the health assistant...
           [HARD RULES 1-5]
           [CONTEXT DATA sections from each capability]
  
  History: User: "Previous questions..."
           Apple: "Previous answers..."
  
  User: "What am I having this week?"
  ```
- **LLM Parameters:** temperature=0.3, maxTokens=400, jsonMode=true
- **Output:** JSON with `{"text": "...", "entityRefs": [...]}`

**KEY FINDING:** The LLM receives capability data in the context but NOT the enrichments. The enrichments are built AFTER capability execution but are presented as a separate field to the client, not integrated into the LLM prompt.

#### Sub-stage 2l: Response Assembly
- **Line:** 769–792
- **Action:** Parse LLM JSON response + merge entity references
- **Output:** Final response object:
  ```typescript
  {
    text: "...",                    // LLM-generated
    entityRefs: [...],              // LLM-supplied + discovery-supplied
    outcome: primaryOutcome,        // First successful capability
    discoveries: [...],             // Structured entities (INT36)
    guidance: [...],                // Next-step suggestions (INT38/39)
    enrichment: [...],              // Contextual insights (INT41/NUT1/FI5)
    resolvedIntent: {...},          // Which capabilities were queried
    actionDrafts: [...]            // Executable proposals (INT40)
  }
  ```

### Stage 3: Database Recording
- **File:** `server/intelligence/conversation/conversation-gateway.ts:915–981`
- **Actions:**
  1. Record assistant turn to database
  2. Persist Companion Action proposals (if any)
  3. Record guidance analytics events (if any)

### Stage 4: HTTP Response
- **File:** `server/routes.ts:11325–11356`
- **Output Format:** JSON with all response fields
- **Return to Client:**
  ```json
  {
    "text": "You haven't planned meals for this week yet.",
    "entityRefs": [],
    "discoveries": [...],
    "guidance": [...],
    "enrichment": [
      {
        "sourceDomain": "planner",
        "title": "You have meals in other weeks",
        "description": "Week 1 has 5 meals planned"
      }
    ],
    "fallbackState": "no-knowledge",
    "outcome": {...}
  }
  ```

---

## CURRENT STATE: Where Enrichments Exist

### Enrichments Are Currently Built
- **Location:** `buildGroundedResponse()` line 602–632
- **Sources:**
  - `buildEnrichment()` — static capability enrichment
  - `buildNutritionEnrichment()` — nutrition-knowledge + profile
  - `buildHouseholdNutritionEnrichment()` — nutrition-knowledge + household
- **Count:** Up to 3 enrichment items per turn
- **Status:** ✅ Operational

### Enrichments Are Returned to Client
- **Location:** Response object + HTTP JSON (line 1345 in routes.ts)
- **Field:** `result.enrichment`
- **Status:** ✅ Included in response payload
- **Client Handling:** Client receives enrichment field but must decide how to render

### Enrichments Are NOT Integrated into Response Text
- **Problem:** The LLM response text (field `text`) does NOT include enrichment content
- **Why:** Enrichments are built AFTER LLM invocation, so LLM never sees them
- **Result:** User gets:
  - Primary response text (from LLM)
  - Enrichment items (separate UI field)
  - But enrichment is not woven into the narrative

### Progressive Knowledge Composition Output Is Discarded
- **Location:** `planner-composition.ts` executes correctly
- **Composition Stages:** 4 steps execute and find enrichment context
- **Problem:** Composition output (EnrichedContext[]) is never integrated
- **Current Integration Status:** ❌ Infrastructure complete, but output unused

**Example:**
```
User: "What meals do I have planned for week 1?"
Platform: "Week 1 is empty"
Composition: Finds week 2 has 5 meals, cookbook has 10 similar meals
LLM Response: "You haven't planned meals for week 1 yet."
Client Receives:
  - text: "You haven't planned meals for week 1 yet."
  - enrichment: [{ title: "Other weeks", ... }]
User Sees: Two separate things (text + enrichment card)
Missing: Enrichment woven into the response narrative
```

---

## WHERE HONEST GAPS ARE CREATED

### Gap Creation Point 1: Early Guard (Write Intents)
- **Location:** `buildGroundedResponse()` line 367–395
- **Gap Type:** `not_executable`
- **Message:** Hardcoded refusal for writes
- **Enrichment Opportunity:** ❌ Not applicable (early guard)

### Gap Creation Point 2: Resolution Failure
- **Location:** `intentResolver.resolve()` (line 418)
- **Gap Type:** `no-route`
- **Classification:** Resolver didn't understand utterance
- **Enrichment Opportunity:** ❌ Low (user's question was unclear)

### Gap Creation Point 3: Capability Execution Failure
- **Location:** `classifyTurn()` after capability queries (line 505)
- **Gap Types:** `no-knowledge` or `no-results`
- **Cause:** Capability returned gap or empty search
- **Enrichment Opportunity:** ✅ **PRIMARY INTEGRATION POINT**

### Gap Creation Point 4: LLM Failure
- **Location:** `buildGroundedResponse()` line 725–751
- **Gap Type:** `internal-error`
- **Cause:** LLM threw exception
- **Enrichment Opportunity:** ❌ Not applicable (exception path)

---

## PROGRESSIVE KNOWLEDGE COMPOSITION IN THE FLOW

### Where COMP4A3 Currently Executes
- **Location:** Planner capability binding + planner read handler
- **Trigger:** Planner read handler detects empty result
- **Action:** Registration of composition config at platform startup
- **Status:** ✅ Working correctly

### Where COMP4A3 Should Execute (Integration Point)
- **Location:** Behaviour Engine's gap-voicing stage
- **Timing:** After gap classification (know it's a gap), before message voicing
- **Input:** Capability results, gap type, original intent
- **Action:** Call composition orchestrator → receive enrichments
- **Output:** Enrichments merged into final gap message

### Current Problem
The composition infrastructure works, but its output is never requested or used. The planner handler doesn't invoke the composition. The Behaviour Engine doesn't know about composition.

---

## SINGLE BEST INTEGRATION POINT: Behaviour Engine Gap Voicing

### Location
**File:** `server/intelligence/conversation/behaviour-engine.ts`  
**Function:** `voiceFallback()`  
**When:** Called from `buildGroundedResponse()` line 523 after gap classification

### Current Signature
```typescript
export function voiceFallback(
  fallbackState: UnsuccessfulTurnState,
  personalityId: PersonalityId,
  options: {
    suggestionExamples?: string;
    searchedAreas?: string;
    searchedQuery?: string;
    clarificationPrompt?: string;
  }
): string
```

### Why This is the Optimal Point

**1. Honest Gaps Are Already Known**
- At this point, `fallbackState` is determined
- Capability results are in scope
- No guess work needed

**2. Clear Separation of Concerns**
- Behaviour Engine owns gap voicing (all personality variants)
- Composition results can be formatted per personality
- Enrichment framing matches the gap type

**3. User Impact is Maximum**
- Gap message is the PRIMARY response text user reads
- Enrichments integrated here appear in the main narrative
- Not relegated to a side panel or secondary field

**4. Architecture Alignment**
- Follows Behaviour Engine's existing role (COMP1 — Graceful Honest Gaps)
- Composition remains in Intelligence Platform, formatting in Gateway
- Respects all existing hard boundaries

**5. Easy to Implement**
- Add optional `enrichments?: EnrichedContext[]` parameter to `voiceFallback()`
- Merge enrichment content into gap message
- Apply personality voice to enriched text
- Backward compatible (enrichments optional)

### Recommended Signature for Phase 2
```typescript
export function voiceFallback(
  fallbackState: UnsuccessfulTurnState,
  personalityId: PersonalityId,
  options: {
    suggestionExamples?: string;
    searchedAreas?: string;
    searchedQuery?: string;
    clarificationPrompt?: string;
    enrichments?: EnrichedContext[];  // NEW: from composition
  }
): string
```

### Example Enhancement
```
Before (Current):
Gap: "You haven't planned meals for week 1 yet."

After (Phase 2 Integration):
Gap: "You haven't planned meals for week 1 yet. You have meals 
     planned in weeks 2 and 3, and your cookbook has 12 similar 
     recipes you've saved. Would you like to see one of those weeks 
     or pick a meal from your cookbook?"
```

---

## EXECUTION PATH DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│ HTTP Request: POST /api/intelligence/conversation/turn              │
│ Input: { utterance, surface, surfaceHints, userId }                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
         ┌────────────────────────────────────────┐
         │ Stage 1: Setup                         │
         │ • Create/get conversation & thread     │
         │ • Read user personality                │
         │ • Assemble context frame               │
         │ • Record user turn                     │
         └────────────────────┬───────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │ Stage 2: buildGroundedResponse()       │
         │                                        │
         │ ┌──────────────────────────────────┐   │
         │ │ 2a: Write Intent Guard           │   │
         │ │ [No write operations allowed]     │   │
         │ └──────────────────────────────────┘   │
         │              │                          │
         │              ▼ (if read-only)           │
         │ ┌──────────────────────────────────┐   │
         │ │ 2b: Intent Resolution            │   │
         │ │ resolve(utterance) →             │   │
         │ │   ResolvedIntent[]               │   │
         │ └──────────────────────────────────┘   │
         │              │                          │
         │              ▼                          │
         │ ┌──────────────────────────────────┐   │
         │ │ 2c: Parallel Capability Exec     │   │
         │ │ for each intent:                 │   │
         │ │  intelligencePlatform.handle()   │   │
         │ │    → Capability Registry         │   │
         │ │    → Handler (e.g., Planner)     │   │
         │ │    → Storage queries             │   │
         │ │ Returns: CapabilityQueryResult   │   │
         │ └──────────────────────────────────┘   │
         │              │                          │
         │              ▼                          │
         │ ┌──────────────────────────────────┐   │
         │ │ 2d: Sequential Composition       │   │
         │ │ (Uplift → Food Intelligence)     │   │
         │ └──────────────────────────────────┘   │
         │              │                          │
         │              ▼                          │
         │ ┌──────────────────────────────────┐   │
         │ │ 2e: Gap Classification           │   │
         │ │ classifyTurn(queried) →          │   │
         │ │   fallbackState | null           │   │
         │ └──────────────────────────────────┘   │
         │              │                          │
         │              ├─ YES (fallbackState)     │
         │              │                          │
         │              ▼                    YES   │
         │ ┌──────────────────────────────────┐   │
         │ │ 2f: HONEST GAP VOICING           │   │
         │ │ voiceFallback(state, personality)│   │ ◄─── INTEGRATION POINT
         │ │ Returns: gap message text        │   │      (Phase 2)
         │ ├──────────────────────────────────┤   │
         │ │ >>> COMP4A2 COMPOSITION          │   │
         │ │ >>> Should integrate here:       │   │
         │ │     • Invoke executeComposition()│   │
         │ │     • Receive enrichments        │   │
         │ │     • Merge into gap message     │   │
         │ │     • Voice per personality      │   │
         │ └──────────────────────────────────┘   │
         │         │              │                │
         │         │ NO           │ Return        │
         │         │           (gap path)         │
         │         ▼                               │
         │ ┌──────────────────────────────────┐   │
         │ │ 2g: Discovery Extraction         │   │
         │ │ (INT36) buildNativeDiscovery()   │   │
         │ │ Returns: NativeDiscoveryResponse │   │
         │ └──────────────────────────────────┘   │
         │         │                               │
         │         ▼                               │
         │ ┌──────────────────────────────────┐   │
         │ │ 2h: Guidance Assembly            │   │
         │ │ (INT38/39) buildGuidance()       │   │
         │ │ Returns: GuidanceSuggestion[]    │   │
         │ └──────────────────────────────────┘   │
         │         │                               │
         │         ▼                               │
         │ ┌──────────────────────────────────┐   │
         │ │ 2i: Enrichment Assembly          │   │
         │ │ (INT41/NUT1/FI5)                 │   │
         │ │ • buildEnrichment()              │   │
         │ │ • buildNutritionEnrichment()     │   │
         │ │ • buildHouseholdEnrichment()     │   │
         │ │ Returns: EnrichmentItem[]        │   │
         │ │ [CURRENTLY UNUSED BY LLM]        │   │
         │ └──────────────────────────────────┘   │
         │         │                               │
         │         ▼                               │
         │ ┌──────────────────────────────────┐   │
         │ │ 2j: Action Assembly              │   │
         │ │ (INT40) buildActionProposals()   │   │
         │ │ Returns: ActionProposalDraft[]   │   │
         │ └──────────────────────────────────┘   │
         │         │                               │
         │         ▼                               │
         │ ┌──────────────────────────────────┐   │
         │ │ 2k: LLM INVOCATION               │   │
         │ │ llmProvider.complete() with:     │   │
         │ │  • System prompt (rules+voice)   │   │
         │ │  • Context (capability data)     │   │
         │ │  • History                       │   │
         │ │  • Utterance                     │   │
         │ │ [ENRICHMENTS NOT VISIBLE HERE]   │   │
         │ │ Returns: JSON with text + refs   │   │
         │ └──────────────────────────────────┘   │
         │         │                               │
         │         ▼                               │
         │ ┌──────────────────────────────────┐   │
         │ │ 2l: Response Assembly            │   │
         │ │ Parse JSON, merge entity refs    │   │
         │ │ Returns: Complete response       │   │
         │ │  {text, entityRefs, outcome,     │   │
         │ │   discoveries, guidance,         │   │
         │ │   enrichment, actionDrafts}      │   │
         │ └──────────────────────────────────┘   │
         └────────────────────┬───────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │ Stage 3: Database Recording            │
         │ • Record assistant turn                │
         │ • Persist actions & guidance           │
         └────────────────────┬───────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │ Stage 4: HTTP Response (routes.ts)     │
         │ Return JSON with all fields            │
         │  {text, enrichment, discoveries,       │
         │   guidance, outcome, fallbackState}    │
         └────────────────────┬───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Client Response                                                      │
│ {                                                                    │
│   "text": "...",                    [LLM response]                   │
│   "enrichment": [...],              [SEPARATE FIELD]                │
│   "discoveries": [...],             [Structured entities]            │
│   "guidance": [...],                [Next-step suggestions]          │
│   "outcome": {...},                 [First successful capability]    │
│   "fallbackState": "...",           [Gap type if applicable]         │
│   "entityRefs": [...]               [Entity references]              │
│ }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## KEY FINDINGS SUMMARY

| Aspect | Status | Location | Note |
|--------|--------|----------|------|
| **Intent Resolution** | ✅ Working | `buildGroundedResponse():418` | Converts utterance to typed intents |
| **Capability Execution** | ✅ Working | `buildGroundedResponse():420-432` | Queries platform handlers in parallel |
| **Gap Classification** | ✅ Working | `buildGroundedResponse():505` | Determines if no data returned |
| **Honest Gap Creation** | ✅ Working | `voiceFallback()` | Creates gap message with personality voice |
| **COMP4A3 Composition** | ✅ Infrastructure | Planner binding registration | Registered but not invoked |
| **Composition Execution** | ✅ Works | Planner handler (COMP4A3) | Progressive steps execute when triggered |
| **Composition Output** | ❌ Discarded | Never retrieved | Composition finds enrichment but it's never used |
| **Enrichment Assembly** | ✅ Working | `buildGroundedResponse():602-632` | INT41/NUT1/FI5 build enrichments |
| **Enrichment Integration** | ❌ Separate Field | Response JSON line 1345 | Returned as `enrichment` field, not in text |
| **LLM Context** | ⚠️ Incomplete | System prompt line 708-709 | LLM never sees enrichments |
| **User Impact** | ❌ Limited | Client side | Enrichment in separate UI field, not narrative |

---

## RECOMMENDATIONS

### Phase 2: Integration Implementation

**Primary Recommendation:** Integrate at Behaviour Engine gap voicing stage

1. **Modify `voiceFallback()` signature** (behaviour-engine.ts)
   - Add optional `enrichments?: EnrichedContext[]` parameter
   - Merge enrichment content into gap message
   - Apply personality voice to enrichments

2. **Invoke composition in buildGroundedResponse()**
   - After gap classification (line 505), if `fallbackState` is not null
   - Call `executeProgressiveComposition()` for routed capabilities
   - Pass enrichments to `voiceFallback()`

3. **Example Phase 2 Flow**
   ```
   Gap Classification: fallbackState = "no-knowledge" (week is empty)
     ↓
   Invoke Composition: executeProgressiveComposition("planner", ...)
     ↓
   Receive Enrichments: "You have meals in week 2" + "Your cookbook has similar recipes"
     ↓
   Voice Gap + Enrichments: voiceFallback(fallbackState, personality, { enrichments })
     ↓
   Final Message: "You haven't planned meals for week 1 yet. You have meals 
                  in week 2, and your cookbook has similar recipes. Would you 
                  like to check out week 2 or pick from your saved meals?"
   ```

### Alternative Points (Not Recommended)

**Option A: LLM Context (❌ Not Ideal)**
- Add enrichments to system prompt
- Problem: Doubles context size, reduces narrative control
- Benefit: LLM can generate more coherent text

**Option B: Client-Side Integration (❌ Not Ideal)**
- Keep enrichment as separate field
- Client decides how to present
- Problem: Loss of platform control, inconsistent user experience

**Option C: Post-LLM Assembly (❌ Not Ideal)**
- Append enrichments to LLM response after generation
- Problem: Creates two-part responses, unclear boundaries

---

## MISSING INTEGRATION POINTS

### Currently Discarded Outputs

1. **Progressive Knowledge Composition Results**
   - Location: Planner capability binding (registered)
   - Current State: Registered but never invoked
   - Potential Output: EnrichedContext[] (other weeks, cookbook, household context)
   - Issue: No code path calls `executeProgressiveComposition()`

2. **Enrichments Built but Not Used in Gap Messages**
   - Location: `buildGroundedResponse():629`
   - Current State: Built and returned as separate field
   - Issue: Not merged into primary response text
   - Impact: User sees enrichment in separate UI area, not as narrative

3. **LLM Doesn't See Enrichments**
   - Location: System prompt assembly (line 681-713)
   - Current State: LLM only gets capability data, not composition results
   - Issue: LLM can't provide integrated narrative
   - Workaround: Client must combine text + enrichment fields

---

## CONCLUSION

The Companion response assembly has a **clear, well-designed architecture** with multiple success paths:
- **Success path:** Capabilities return data → LLM generates response
- **Fallback path:** No data → Honest gap with personality voice

Progressive Knowledge Composition infrastructure exists but is **not yet wired into the response pipeline**. The **single best integration point** is the **Behaviour Engine's gap-voicing stage**, where Honest Gaps are created and personalized.

This integration point:
- ✅ Maximizes user impact (enrichments in main narrative)
- ✅ Maintains architecture alignment (Composition in Platform, formatting in Gateway)
- ✅ Enables personality-aware enrichment voicing
- ✅ Is straightforward to implement (modify one function signature)
- ✅ Is backward compatible (enrichments optional)

**Estimated Phase 2 Effort:** 2–3 days for implementation + testing + benchmark validation.

---

**Prepared By:** Claude Code  
**Investigation Scope:** Complete execution path audit  
**Status:** Ready for Phase 2 implementation planning
