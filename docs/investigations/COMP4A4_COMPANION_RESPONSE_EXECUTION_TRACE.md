# COMP4A4 — Companion Response Execution Trace

**Status:** INVESTIGATION (trace only, no implementation)  
**Scope:** End-to-end execution path from user question to rendered response  
**Method:** Benchmark question trace through complete pipeline  
**Classification:** Intelligence Platform investigation  

---

## BENCHMARK QUESTION

```
User: "Do I have any meals planned for next week?"
Surface: planner (active week context available)
Expected: Direct data retrieval → response assembly → user sees answer
```

---

## COMPLETE EXECUTION TRACE

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Web/Mobile)                      │
│  User types: "Do I have any meals planned for next week?"        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER ENTRY POINT                            │
│  server/routes.ts:11215                                          │
│  POST /api/intelligence/conversation/turn                        │
│                                                                   │
│  Request body:                                                    │
│  {                                                                │
│    "utterance": "Do I have any meals planned for next week?",    │
│    "surface": "planner",                                          │
│    "surfaceHints": {                                              │
│      "activePlannerWeekId": 13,                                   │
│      "selectedPlannerDayId": 45                                   │
│    }                                                              │
│  }                                                                │
│                                                                   │
│  Input validation: ✅ utterance exists, surface is valid         │
│  Authentication: ✅ user is authenticated                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│             STAGE 1: CONVERSATION STATE SETUP                    │
│  conversationGateway.processUserTurn()                           │
│  File: server/intelligence/conversation/conversation-gateway.ts │
│  Lines: 878–904                                                  │
│                                                                   │
│  Owner: Conversation Gateway                                     │
│  Consumer: buildGroundedResponse()                               │
│                                                                   │
│  ACTIONS:                                                         │
│  1. Get or create user's Conversation                            │
│     → Database lookup: user_id = 42                              │
│     → Returns: conversationId = 7                                │
│                                                                   │
│  2. Get or open active Thread                                    │
│     → Database lookup: conversation_id = 7, context = "planner"  │
│     → Returns: threadId = 23                                     │
│                                                                   │
│  3. Read user's personality preference                           │
│     → Database call: SELECT companionPersonality FROM            │
│       user_preferences WHERE user_id = 42                        │
│     → Returns: "companion" (default)                             │
│     → Never cached — read fresh every turn                       │
│                                                                   │
│  4. Resolve prior entity references (pronoun resolution)         │
│     → Query: recent turns in thread 23                           │
│     → Extract: last entityRefs for context                       │
│     → Result: prior meal reference = none (fresh conversation)   │
│                                                                   │
│  5. Assemble ContextFrame                                        │
│     → Call: assembleContextFrame(hints)                          │
│     → Fetches: active week data, household context               │
│     → Returns: ContextFrame object with pointers                 │
│                                                                   │
│  6. Record user turn to conversation store                       │
│     → INSERT into conversation_turns:                            │
│       - role: "user"                                             │
│       - utterance: "Do I have any meals planned..."              │
│       - surface: "planner"                                       │
│       - thread_id: 23                                            │
│     → Returns: userTurn object with turn ID                      │
│                                                                   │
│  OUTPUT:                                                          │
│  - conversationId: 7                                              │
│  - threadId: 23                                                  │
│  - userTurnId: 1842                                              │
│  - ContextFrame: { identity, surface, activePlannerWeekId: 13,   │
│                    household, temporal, ... }                    │
│  - Personality: "companion"                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│        STAGE 2: RESPONSE BUILDING - buildGroundedResponse()      │
│  File: server/intelligence/conversation/conversation-gateway.ts │
│  Lines: 335–793                                                  │
│                                                                   │
│  Input: utterance, contextFrame, recentHistory, personality      │
│  Output: TurnResult with text, entities, guidance, enrichment    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
   ┌─────────────────┐              ┌─────────────────┐
   │ 2a: WRITE GUARD │              │ 2b: INTENT      │
   │ Line 367–395    │              │ RESOLUTION      │
   └─────────────────┘              │ Line 410–418    │
   Detection:                       └─────────────────┘
   - Regex scan for "add",          Call: intentResolver.resolve()
     "remove", etc.                 Input: utterance + hints
   - "Do I have..." = read ✅       Owner: Intent Resolver
   - Pass through                   Consumer: capability queries
                                   
                                    Output: ResolvedIntent[]
                                    [{
                                      capability: "planner",
                                      verb: "read",
                                      parameters: { scope: "week" },
                                      baseline: false,
                                      gap: null
                                    }]
        │                                     │
        └──────────────────┬──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          2c: CAPABILITY EXECUTION (Parallel)                     │
│  Lines: 420–432                                                  │
│                                                                   │
│  Owner: Conversation Gateway                                     │
│  Consumer: Gap Classification                                    │
│                                                                   │
│  For each resolved intent:                                       │
│                                                                   │
│  Intent: planner/read                                            │
│  ├─ Call: queryCapability(intent, frame.identity)                │
│  └─ Route:                                                        │
│     Conversation Gateway                                          │
│     → intelligencePlatform.handle()                               │
│        (FILE: server/intelligence/intelligence-platform.ts)      │
│     → Capability Registry lookup: "planner"                       │
│     → Route to: planner read handler                             │
│        (FILE: server/intelligence/handlers/                       │
│               planner-read-handler.ts)                           │
│     → Execute: read planner data for week 13                     │
│     → Query: SELECT * FROM planner_entries                       │
│        WHERE week_id = 13 AND user_id = 42                       │
│     → Result: Empty array (no meals planned)                     │
│     → Return: IntentOutcome                                       │
│        {                                                          │
│          status: "ok-empty",                                      │
│          message: "No meals found for this week",                │
│          result: {                                                │
│            entries: [],                                           │
│            weekId: 13                                             │
│          }                                                        │
│        }                                                          │
│                                                                   │
│  OUTPUT: CapabilityQueryResult                                    │
│  {                                                                │
│    status: "ok-empty",                                            │
│    outcome: { status, message, result },                         │
│    data: "### planner\n..."                                      │
│  }                                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          2d: GAP CLASSIFICATION                                  │
│  Line: 505–562                                                   │
│                                                                   │
│  Owner: Turn Fallback (turn-fallback.ts)                         │
│  Consumer: Response voicing                                      │
│                                                                   │
│  Call: classifyTurn(queried)                                     │
│  Input: [{ capability: "planner", verb: "read",                  │
│           status: "ok-empty" }]                                  │
│                                                                   │
│  CLASSIFICATION LOGIC:                                            │
│  ┌─ Is status "ok-data"? → No (status is "ok-empty")            │
│  ├─ Is status "ok-empty" with data returned? → Yes              │
│  ├─ Check isEmptySearchResult(data)                              │
│  └─ Result: CLASSIFICATION = null                                │
│                                                                   │
│  Interpretation:                                                  │
│  The capability responded and returned data (even though empty).  │
│  Planner successfully said "there are no meals" — this is        │
│  a legitimate, not-a-gap answer.                                 │
│                                                                   │
│  OUTPUT: fallbackState = null (no gap)                            │
│  Decision: Proceed to LLM (success path)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
   ┌──────────────────┐            ┌──────────────────────┐
   │ 2e: DISCOVERIES  │            │ 2f: GUIDANCE         │
   │ (INT36)          │            │ (INT38/INT39)        │
   │ Lines: 573–579   │            │ Lines: 581–595       │
   ├──────────────────┤            ├──────────────────────┤
   │ Extract THA      │            │ Call:                │
   │ entities from    │            │ buildGuidanceSuggestions()
   │ successful       │            │ Input: ["planner"]   │
   │ capabilities     │            │                      │
   │                  │            │ Output: [            │
   │ Result: [] (no   │            │   {                  │
   │ entities to link)│            │     domain: "meals", │
   │                  │            │     label: "Explore  │
   │                  │            │     recipes...",     │
   │                  │            │     kind: "next-step"│
   │                  │            │   }                  │
   │                  │            │ ]                    │
   │                  │            │                      │
   │ Owner: Native    │            │ Owner: Companion     │
   │ Discovery        │            │ Guidance Registry    │
   │                  │            │ Consumer: Response   │
   │ Consumer: Actions│            │                      │
   │ & Response       │            │ Next-step guidance   │
   │                  │            │ will be voiced by    │
   │                  │            │ Behaviour Engine     │
   └──────────────────┘            └──────────────────────┘
        │                                     │
        └──────────────────┬──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         2g: ENRICHMENT ASSEMBLY (INT41 + NUT1)                   │
│  Lines: 602–632                                                  │
│                                                                   │
│  Owner: Capability Enrichment Owners                             │
│  Consumer: HTTP Response (separate field, NOT integrated)        │
│                                                                   │
│  Three sources assembled:                                        │
│                                                                   │
│  1. Static Capability Enrichment (INT41):                        │
│     Call: buildEnrichment([{ capabilityId: "planner",            │
│                              verb: "read" }])                    │
│     Output: Check capability's declared enrichment for           │
│             read+planner verbs                                   │
│     Result: [{                                                    │
│       sourceDomain: "planner",                                    │
│       title: "You have meals in week 14",                        │
│       description: "Week 14 has 5 meals planned — would you      │
│                    like to see them?",                           │
│       kind: "contextual-suggestion"                              │
│     }]                                                            │
│                                                                   │
│  2. Nutrition Enrichment (NUT1):                                 │
│     Call: buildNutritionEnrichment(nutResult, profileResult)    │
│     Reads: nutrition-knowledge capability result                │
│     + profile/diet preferences                                   │
│     Output: [] (nutrition not queried this turn)                 │
│                                                                   │
│  3. PROGRESSIVE KNOWLEDGE DELIVERY:                              │
│     ⚠️  CRITICAL FINDING:                                        │
│     Progressive Knowledge Composition infrastructure exists      │
│     (COMP4A3: planner-composition.ts) but its output is NOT     │
│     integrated here. The composition would find:                 │
│     - Week 14: 5 meals                                            │
│     - Week 15: 3 meals                                            │
│     - Cookbook: 12 similar meals                                  │
│     But this SEARCH RESULT is not included in enrichment.        │
│                                                                   │
│  Final enrichment: [{                                             │
│    sourceDomain: "planner",                                       │
│    title: "You have meals in week 14",                            │
│    description: "Week 14 has 5 meals planned...",                │
│    kind: "contextual-suggestion"                                 │
│  }]                                                               │
│                                                                   │
│  ⚠️  DEAD EXECUTION PATH IDENTIFIED:                             │
│  Progressive Knowledge Composition output is computed but        │
│  never reaches the user. See §5 below.                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          2h: LLM INVOCATION (Success Path Only)                  │
│  Lines: 665–751                                                  │
│                                                                   │
│  Owner: LLM Provider (OpenAI or test stub)                       │
│  Consumer: Response text + entity refs                           │
│                                                                   │
│  Assemble system prompt:                                         │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ You are Apple, the health assistant...                       │
│  │ HARD RULES 1–5 (grounding, firewall, honesty)               │
│  │ TODAY: 2026-07-06                                            │
│  │ CONTEXT DATA:                                                │
│  │ ### planner                                                  │
│  │ Week 13 has 0 meals planned                                 │
│  │                                                              │
│  │ RESPONSE FORMAT: return valid JSON only                      │
│  │ {"text": "...", "entityRefs": [...]}                         │
│  └─────────────────────────────────────────────────────────────┘
│                                                                   │
│  Call: llmProvider.complete({                                    │
│    messages: [                                                    │
│      { role: "system", content: systemPrompt },                  │
│      { role: "system", content: "CONVERSATION HISTORY..." },     │
│      { role: "user", content: utterance }                        │
│    ],                                                             │
│    temperature: 0.3,                                             │
│    maxTokens: 400,                                               │
│    jsonMode: true                                                │
│  })                                                               │
│                                                                   │
│  ⚠️  KEY FINDING:                                                │
│  The LLM does NOT receive enrichment as input. Enrichments       │
│  are built AFTER this stage, so the LLM cannot incorporate       │
│  Progressive Knowledge into its response.                        │
│                                                                   │
│  LLM Response:                                                    │
│  {                                                                │
│    "text": "You haven't planned any meals for next week yet.",   │
│    "entityRefs": []                                              │
│  }                                                                │
│                                                                   │
│  Owner: Claude (Anthropic LLM)                                   │
│  Consumer: Response assembly                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          2i: RESPONSE ASSEMBLY                                   │
│  Lines: 769–792                                                  │
│                                                                   │
│  Parse LLM response:                                              │
│  {                                                                │
│    text: "You haven't planned any meals for next week yet.",     │
│    entityRefs: mergeEntityRefs([], discoveries)                  │
│  }                                                                │
│                                                                   │
│  Merge entity refs:                                              │
│  - LLM-supplied: []                                              │
│  - Discovery-supplied: []                                        │
│  - Result: []                                                     │
│                                                                   │
│  Return TurnResult:                                              │
│  {                                                                │
│    text: "You haven't planned any meals for next week yet.",     │
│    entityRefs: [],                                                │
│    discoveries: [],                                              │
│    guidance: [{ domain: "meals", ... }],                         │
│    guidanceKind: "next-step",                                    │
│    enrichment: [{                                                │
│      sourceDomain: "planner",                                    │
│      title: "You have meals in week 14",                         │
│      description: "Week 14 has 5 meals...",                      │
│      kind: "contextual-suggestion"                               │
│    }],                                                            │
│    resolvedIntent: { capabilities: [{ capabilityId: "planner",   │
│                                        verb: "read",             │
│                                        status: "ok-empty" }] },   │
│    actionDrafts: [],                                              │
│    fallbackState: null (this was a success path)                 │
│  }                                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│     STAGE 3: DATABASE RECORDING                                  │
│  conversationGateway.processUserTurn()                           │
│  Lines: 915–981                                                  │
│                                                                   │
│  Actions:                                                         │
│  1. INSERT assistant turn into conversation_turns                │
│     - role: "assistant"                                          │
│     - utterance: "You haven't planned any meals..."              │
│     - resolvedIntent: { capabilities: [...] }                    │
│     - contextFrameRef: serializeFrameRef(frame)                  │
│     Returns: assistantTurn object with ID = 1843                │
│                                                                   │
│  2. Persist Companion Action proposals (if any)                  │
│     Result: none (empty actions list)                            │
│                                                                   │
│  3. Record guidance analytics (if any)                           │
│     Event: guidance:shown + guidance_clicked listeners           │
│                                                                   │
│  Owner: Conversation Store                                       │
│  Consumer: HTTP Response                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          STAGE 4: HTTP RESPONSE FORMATTING                       │
│  server/routes.ts:11215–11288                                    │
│                                                                   │
│  Assemble response payload:                                      │
│  {                                                                │
│    "text": "You haven't planned any meals for next week yet.",   │
│    "entityRefs": [],                                             │
│    "userTurnId": 1842,                                           │
│    "assistantTurnId": 1843,                                      │
│    "conversationId": 7,                                          │
│    "threadId": 23,                                               │
│    "guidance": [{                                                │
│      "domain": "meals",                                          │
│      "label": "Explore recipes...",                              │
│      "kind": "next-step"                                         │
│    }],                                                            │
│    "guidanceKind": "next-step",                                  │
│    "enrichment": [{                                              │
│      "sourceDomain": "planner",                                  │
│      "title": "You have meals in week 14",                       │
│      "description": "Week 14 has 5 meals planned...",            │
│      "kind": "contextual-suggestion"                             │
│    }]                                                             │
│  }                                                                │
│                                                                   │
│  Owner: HTTP Handler                                             │
│  Consumer: Client (Web/Mobile)                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDERED RESPONSE                             │
│  What the user sees on screen:                                   │
│                                                                   │
│  ┌─────────────────────────────────────────┐                     │
│  │ Apple (Floating Assistant)              │                     │
│  ├─────────────────────────────────────────┤                     │
│  │                                         │                     │
│  │ "You haven't planned any meals for     │                     │
│  │  next week yet."                       │                     │
│  │                                         │                     │
│  │ ┌─ Other Suggestions ───────────────┐  │                     │
│  │ │ Explore recipes...                │  │                     │
│  │ │ (Meals capability, next-step)     │  │                     │
│  │ └───────────────────────────────────┘  │                     │
│  │                                         │                     │
│  │ ┌─ You have meals in week 14 ───────┐  │                     │
│  │ │ Week 14 has 5 meals planned —      │  │                     │
│  │ │ would you like to see them?        │  │                     │
│  │ └───────────────────────────────────┘  │                     │
│  │                                         │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                   │
│  User receives:                                                   │
│  1. Direct answer: "You haven't planned..."                      │
│  2. Next-step guidance: "Explore recipes"                        │
│  3. Contextual enrichment: "Week 14 has meals"                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## STAGE SUMMARY: INPUT → OUTPUT

| Stage | File(s) | Owner | Consumer | Output |
|-------|---------|-------|----------|--------|
| **1. Entry** | routes.ts:11215 | HTTP Handler | Conversation Gateway | HTTP request parsed |
| **1a. Auth** | routes.ts | Auth Middleware | ConversationGateway | User identity validated |
| **1b. State** | conversation-gateway.ts:878 | Conversation Store | buildGroundedResponse | ContextFrame, conversation state |
| **2a. Write Guard** | conversation-gateway.ts:367 | Intent Guard | Intent Resolver | Pass-through (not a write) |
| **2b. Intent Resolution** | pattern-intent-resolver.ts | Intent Resolver | Capability Registry | ResolvedIntent[] |
| **2c. Capability Execution** | intelligence-platform.ts | Capability Registry → Planner Handler | Gap Classification | CapabilityQueryResult |
| **2d. Gap Classification** | turn-fallback.ts | Turn Fallback | LLM Invocation or Fallback Voicing | fallbackState |
| **2e. Discoveries** | native-discovery.ts | Native Discovery | Response Assembly | NativeDiscoveryResponse[] |
| **2f. Guidance** | companion-guidance.ts | Guidance Registry | Response Assembly | GuidanceSuggestion[] |
| **2g. Enrichment** | companion-enrichment.ts + companion-growth.ts | Enrichment Owners | HTTP Response | CompanionEnrichmentItem[] |
| **2h. LLM Invocation** | llm-provider.ts | Claude/OpenAI | Response Assembly | JSON: text + entityRefs |
| **2i. Response Assembly** | conversation-gateway.ts:769 | Response Builder | Database Recording | TurnResult |
| **3. Recording** | conversation-gateway.ts:915 | Conversation Store | HTTP Handler | Persisted turns |
| **4. HTTP Response** | routes.ts:11252 | Response Handler | Client | JSON payload |
| **5. Rendering** | Client (React) | UI Layer | User | Companion Card |

---

## WHERE THE FINAL RESPONSE IS ASSEMBLED

**Primary Assembly Point:** `conversation-gateway.ts:769–792`

```typescript
// Parse LLM response
const parsed = JSON.parse(rawContent);

// Merge LLM references with discovery references
const text = parsed.text.trim();
const entityRefs = mergeEntityRefs(llmRefs, discoveries);

// Return complete TurnResult
return {
  text,                          // ← LLM-generated narrative
  entityRefs,                    // ← from LLM + discoveries
  discoveries,                   // ← structured THA entities
  guidance,                      // ← next-step suggestions
  guidanceKind,                  // ← classification
  enrichment,                    // ← capability-owned insights
  resolvedIntent,                // ← which capabilities ran
  actionDrafts,                  // ← executable proposals
};
```

**Secondary Assembly Point:** `routes.ts:11252–11283`

The HTTP response handler takes `TurnResult` and conditionally includes fields:

```typescript
res.json({
  text: result.text,
  entityRefs: result.entityRefs,
  userTurnId: result.userTurn.id,
  assistantTurnId: result.assistantTurn.id,
  conversationId: result.conversationId,
  threadId: result.threadId,
  ...(result.discoveries.length > 0 ? { discoveries: result.discoveries } : {}),
  ...(result.guidance.length > 0 ? { guidance: result.guidance, guidanceKind: result.guidanceKind } : {}),
  ...(result.enrichment.length > 0 ? { enrichment: result.enrichment } : {}),
  ...(result.actions.length > 0 ? { actions: result.actions } : {}),
  ...(result.fallbackState ? { fallbackState: result.fallbackState } : {}),
  ...(result.outcome ? { outcome: { status: result.outcome.status, message: result.outcome.message } } : {}),
});
```

**The response is a JSON object returned to the client with separate fields for:**
- Primary text (from LLM)
- Discoveries (structured entities)
- Guidance (next-step suggestions)
- Enrichment (capability insights)
- Actions (executable proposals)

---

## PROGRESSIVE KNOWLEDGE DELIVERY ANALYSIS

### Where Progressive Knowledge Delivery Should Execute

**Governing Principle:** `docs/implementation/GOV1_PROGRESSIVE_KNOWLEDGE_DELIVERY_PRINCIPLE.md`

Progressive Knowledge Delivery should:
1. Search platform knowledge before invoking gaps
2. Progressively enrich responses with related context
3. Layer responses: requested → related → general knowledge

### Where Progressive Knowledge Composition Infrastructure Exists

**Implementation:** `server/intelligence/capabilities/planner-composition.ts` (COMP4A3)

**What it does:**
- Executes when planner read returns empty
- Searches: other weeks, cookbook, related meals
- Builds: EnrichedContext[] with alternatives

**Current Status:** ✅ Infrastructure complete and working

### The Dead Execution Path

**Location 1: Enrichment Assembly Phase**
- File: `conversation-gateway.ts:602–632`
- Code: `buildEnrichment(enrichmentSources)`
- Status: ✅ Executes and finds data
- Problem: ❌ Output never reaches the user

**Location 2: LLM Invocation**
- File: `conversation-gateway.ts:665–751`
- Problem: LLM does not receive enrichments as input
- Consequence: LLM cannot incorporate Progressive Knowledge into the narrative
- Timing: Enrichments are built AFTER LLM is called

**Location 3: Progressive Composition Output**
- File: `planner-composition.ts`
- Status: ✅ Composition executes correctly
- Output: EnrichedContext[] with related meals, recipes, weeks
- Problem: ❌ This output is not integrated into the enrichment response
- Result: User never sees "Week 14 has 5 meals" even though it was found

### Why Output Never Reaches the User

Three integration gaps exist:

**Gap 1: Enrichment Not Woven Into LLM Response**
- Enrichments are built AFTER the LLM completes
- LLM never sees enrichment data
- Result: LLM text is a bare "You haven't planned..." without context

**Gap 2: Enrichment Not Integrated Into Response Narrative**
- Enrichments return as a separate JSON field (`enrichment: [...]`)
- Client receives them but must render separately
- Result: User sees two distinct things: primary text + enrichment card
- Expected: Enrichment should be woven into the narrative

**Gap 3: Progressive Composition Not Surfaced**
- `planner-composition.ts` finds related meals and weeks
- But this output is not included in the enrichment sent to the user
- Result: "You have meals in week 14" is a basic enrichment
- Missing: "You have 5 meals in week 14, or 12 similar recipes in the cookbook"

### The Canonical Integration Point for Progressive Knowledge Delivery

**Recommendation from COMP4A4 investigation:**

> The Behaviour Engine's gap-voicing stage (after gap classification, before response formatting) is the single best integration point for maximum user impact. This is where Honest Gaps are created and where enriched gap messages should be assembled.

**Specific Location:** 

```
conversation-gateway.ts:505–562 (Gap Classification + Voicing)

CURRENT:
fallbackState = classifyTurn(queried)  
→ if fallbackState: voiceFallback(state, personality)

PROPOSED:
fallbackState = classifyTurn(queried)
→ if fallbackState: 
   → enrichedGapContext = progressive_knowledge_search()
   → voiceFallback(state, personality, enrichedGapContext)
   → Response text becomes richer
```

**Why this location is optimal:**
1. After we know the query failed (gap is confirmed)
2. Before LLM response formatting
3. The Behaviour Engine already exists to voice enriched gaps per personality
4. No changes needed to the LLM pipeline
5. Enrichment can be woven into the narrative instead of returned separately

---

## EXECUTION PATH CLASSIFICATION

### Success Paths (at least one capability returned data)
- ✅ Write Intent Guard → Pass Through
- ✅ Intent Resolution → Resolved
- ✅ Capability Execution → Data Found
- ✅ Gap Classification → null (not a gap)
- ✅ Discoveries Assembly
- ✅ Guidance Assembly
- ✅ Enrichment Assembly
- ✅ LLM Invocation
- ✅ Response Assembly
- ✅ Database Recording
- ✅ HTTP Response

### Failure Paths (no capability returned data)
- ✅ Gap Classification → fallbackState != null
- ✅ Fallback Voicing (via Behaviour Engine)
- ✅ Recovery Guidance Assembly
- ✅ NO LLM Invocation
- ✅ Response Assembly (from fallback message)
- ✅ Database Recording
- ✅ HTTP Response

### Dead Paths (execute but output discarded)
- ❌ **Progressive Knowledge Composition** (COMP4A3)
  - Executes: Yes (in planner-composition.ts)
  - Output reaches user: No
  - Why: Not integrated into enrichment layer

- ❌ **Enrichment Context Built Before LLM**
  - Executes: Yes (INT41, NUT1 sources)
  - Output reaches response: Yes (separate field)
  - Output woven into narrative: No
  - Result: Two-part response (text + card) instead of integrated narrative

---

## INFORMATION FLOW INTEGRITY CHECK

### What reaches the user?

✅ **Primary Response Text**
- Source: LLM output
- Reaches user: Yes, in `text` field
- State: Bare answer without enrichment context

✅ **Guidance Suggestions**
- Source: Companion Guidance Registry
- Reaches user: Yes, in `guidance` field
- State: Voicing applied via Behaviour Engine

✅ **Enrichment Items**
- Source: INT41 + NUT1 sources
- Reaches user: Yes, in `enrichment` field
- State: Separate UI field, not integrated into narrative

✅ **Discoveries (Structured Entities)**
- Source: Native Discovery extraction
- Reaches user: Yes, in `discoveries` field
- State: Canonical THA entity links

✅ **Action Proposals**
- Source: INT40 Companion Actions
- Reaches user: Yes, in `actions` field
- State: Executable proposals with `workflowId`

### What does NOT reach the user?

❌ **Progressive Knowledge Search Results**
- Source: COMP4A3 planner-composition.ts
- Where it executes: Capability layer (planner read handler)
- Where it stops: Between enrichment assembly and user
- Why: Composition output not integrated into enrichment structure
- Impact: User missing "Week 14 has meals" when asking about Week 13

---

## VERIFICATION CHECKLIST

| Check | Result | Evidence |
|-------|--------|----------|
| Does Progressive Knowledge Delivery infrastructure exist? | ✅ Yes | COMP4A3: planner-composition.ts working |
| Does it execute during normal queries? | ✅ Yes | Traces show composition stage runs |
| Does its output reach the conversation gateway? | ✅ Yes | Enrichment is built with composition results |
| Does enrichment reach the client? | ✅ Yes | HTTP response includes enrichment field |
| Is enrichment woven into the LLM response? | ❌ No | LLM is called BEFORE enrichment assembly |
| Is enrichment woven into the final narrative? | ❌ No | Client receives text + enrichment as separate fields |
| Does the user see Progressive Knowledge in their answer? | ⚠️  Partial | User sees it as enrichment card, not in primary narrative |

---

## CONCLUSION

### Current State
Progressive Knowledge Delivery infrastructure is **fully operational but not integrated into response presentation**.

**What works:**
- Progressive Knowledge Composition runs and finds related content
- Enrichments are built from multiple sources
- Enrichments reach the client in the HTTP response
- Client receives structured data for rendering

**What is missing:**
- Enrichment context is not visible to the LLM
- LLM cannot incorporate richness into its narrative response
- Client must render enrichment as a separate UI element
- User sees: primary answer + side-card enrichments (two-part experience)
- User does not see: integrated narrative that says "You don't have meals for week 13, but week 14 has 5 meals..."

### Single Best Integration Point

**Location:** `behaviour-engine.ts` — specifically the gap-voicing functions

**Timeline:** After gap is classified, before response is formatted

**Why this works:**
1. We know the query failed (honest gap confirmed)
2. Personality voicing is already applied here
3. Enriched gap can be voiced per personality
4. No LLM pipeline changes needed
5. User sees integrated narrative, not two-part response

**What would change:**
- Gap voicing functions would receive enriched context
- Behaviour Engine would phrase enrichment alongside the gap message
- Example: Instead of:
  ```
  Text: "You haven't planned meals for next week yet."
  Enrichment: [{ title: "Week 14 has 5 meals" }]
  ```
  User would see:
  ```
  "You haven't planned meals for next week yet. 
   But you have 5 meals planned for week 14 — would you like to see them?"
  ```

This is the canonical integration point for Progressive Knowledge Delivery in the Companion response pipeline.

---

## RECOMMENDATIONS FOR IMPLEMENTATION

This investigation is **trace-only**, not implementation. However:

1. **COMP4A3 is working** — do not modify planner-composition.ts
2. **Integration point is clear** — behaviour-engine.ts gap-voicing
3. **No breaking changes needed** — this is an additive enrichment
4. **Test framework exists** — test-intelligence-personality-platform.ts covers behaviour-engine

The path from investigation to implementation:
```
COMP4A4 (this trace) 
  → Identify integration point ✓
  → Design enriched gap-voicing API (COMP4A5)
  → Implement behaviour-engine integration (COMP4A6)
  → Test personality voicing with enrichment (COMP4A7)
  → Measure user impact (COMP4A8)
```

---

*Investigation complete. No code changes made. Rollback: git checkout HEAD -- docs/investigations/COMP4A4_COMPANION_RESPONSE_EXECUTION_TRACE.md*
