# INT18 — Conversation Platform Design

**Status:** INVESTIGATION ONLY — no code, schema, route, UI, or capability changes.
**Classification:** Intelligence design investigation.
**Date:** 2026-06-30
**Branch:** `int1-intelligence-platform`
**HEAD at start:** `a5294f8` — `feat(intelligence): INT1 Intelligence Platform foundation`
**Author:** Architecture investigation (Claude Code)

**Governing documents (mandatory reading before implementation):**
- `docs/architecture/README.md` — architecture bootstrap (read first)
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1) — the platform spine
- `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2) — the registry
- `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3) — the experience
- `docs/architecture/ENGINEERING_WORKFLOW.md` — compliance checklist
- `docs/investigations/intelligence/INT5_INTELLIGENCE_PLATFORM_CONVERGENCE_REVIEW.md` — pattern convergence

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Branch `int1-intelligence-platform`, HEAD `a5294f8` |
| HEAD commit | `a5294f8` — `feat(intelligence): INT1 Intelligence Platform foundation` |
| **Rollback tag** | **`int18-rollback-pre-conversation-design`** *(create before any implementation)* |
| Code modified | None — this document is the only artifact |
| Schema modified | None |
| Routes modified | None |

**This is an investigation only.** No application code, schema, services, routes, prompts, or capability bindings were modified or created. The single output is this document.

---

## ARCHITECTURE COMPLIANCE REVIEW (gate)

Per the standing mandate: *if any proposal conflicts with governing architecture — STOP, explain, do not continue.*

| Principle / check | INT18 compliance | Verdict |
|---|---|---|
| **One canonical assistant** | INT18 proposes a single Conversation Platform serving one assistant ("Apple"). It introduces no second assistant, no feature-specific chatbot. | ✅ Pass |
| **One conversation history** | INT18 designs a single `conversations` store per user. Threading is by context within that one store, not one log per feature. Identical to TIP3 Part 3. | ✅ Pass |
| **One Intelligence Platform** | INT18 adds no second platform. The Conversation Platform is an *adapter and persistence layer* in front of the unchanged `intelligencePlatform` singleton (INT1). | ✅ Pass |
| **One Capability Registry** | Every action described resolves to a TIP2 `(verb × capability)` pair via the existing registry. No surface may execute anything outside the registry. | ✅ Pass |
| **One Intent Engine** | All state changes route through `intelligencePlatform.handle()` (INT1 §Orchestration). The conversation layer calls the engine; it does not duplicate it. | ✅ Pass |
| **No duplicate business logic** | The Conversation Platform owns zero domain logic. Context Frame assembly reads existing owners; the store holds pointers, never copies of business rows. | ✅ Pass |
| **No duplicate state** | The conversation store records `entity_refs` (pointers to meal IDs, list IDs, week IDs) — never the planner rows, shopping items, or household data themselves. Re-rendering re-reads the live entity. | ✅ Pass |
| **Progressive enrichment / no second owner** | Context Frame is derived read state, rebuilt per turn, discarded after. TIP3 Part 4 / Risk R1: if the assistant ever starts *holding* "the selected meal" as its own authoritative state, it has become a second owner. This design explicitly prevents that. | ✅ Pass |
| **Honest gaps over fabrication** | Every capability response routes through the existing `IntentOutcome` vocabulary. Gaps surface honestly. The LLM layer is grounded-only (retrieval from assembled owner data, never model invention). | ✅ Pass |
| **Extend existing architecture** | Reuses `intelligencePlatform`, `access.ts`, existing assemblers, existing capability handlers. Replaces nothing. | ✅ Pass |

**Gate result: PASS.** INT18 is a persistence and interaction design that sits *in front of* the existing TIP1 spine. It introduces no new platform, no second assistant, no second owner of any fact. The investigation continues.

---

## 1. WHAT "CONVERSATION PLATFORM" MEANS — SCOPE

INT18 is the design investigation for the concrete implementation of the TIP3 conversation experience. TIP3 answered *what* the conversation should be and *how* it should feel. INT18 answers *what to build* to make TIP3 real, grounded in the INT1–INT17 implementation state.

**Three things INT18 designs:**

1. **The Conversation Store** — the schema and server module that records `conversations`, `threads`, and `turns`, storing pointers and outcomes, never business data.

2. **The Context Frame Assembler** — the per-turn server module that derives the Context Frame (who, what page, what week, what meal, what list) from existing owners, so the assistant can resolve "it", "that", "Saturday" without storing a second copy of truth.

3. **The Conversation Gateway** — the server-side conversational interface that wires a user utterance into: Context Frame assembly → LLM grounding call → `intelligencePlatform.handle()` → turn recording → response.

**What INT18 does NOT design (deferred):**

- Voice (TIP3 Part 5) — adapters, STT/TTS. Deferred to a future INT.
- Proactive digests (TIP3 Part 10) — background summarisation. Deferred.
- Delight moments (TIP3 Part 12) — plant diversity celebrations, milestones. Deferred.
- Write capability bindings — INT5 confirmed the `confirm → invoke` path is unproven. Phase 0 is read-only. The first write binding is a separate convergence checkpoint.

---

## 2. GROUNDING — WHAT EXISTS TODAY

### 2.1 Intelligence Platform (INT1–INT17)

Eleven live, read-only capability bindings on the `intelligencePlatform` singleton:

| INT | Capability | Executable verbs |
|-----|-----------|-----------------|
| INT2 | Planner | read, explain |
| INT3 | Shopping | read, explain |
| INT4 | Nutrition / Knowledge | read, explain, search |
| INT8 | Pantry | read, explain |
| INT10 | Diary | read, explain |
| INT12 | Profile | read, explain |
| INT13 | Household | read, explain |
| INT14 | Partners | read, explain |
| INT15 | Meals | read, explain, search |
| INT16 | Templates | read, explain |
| INT17 | Analyser | read, explain |

**Key fact:** all 11 bindings are read-only. The write path (`confirm → invoke`) has no live binding. INT18 Phase 0 is deliberately read-only — it proves the conversation store and grounded Q&A before any write intent is introduced.

### 2.2 What does NOT exist

- No `conversations`, `conversation_threads`, or `conversation_turns` table in `shared/schema.ts`
- No conversation store or context frame assembler in `server/intelligence/`
- No conversational API route (`/api/intelligence/conversation/*`)
- No floating assistant UI component
- The only assistant UI is `PlannerAssistantPanel.tsx` — planner-scoped only
- No LLM call path wired to the Intelligence Platform for user utterances

### 2.3 What TIP3 already specifies (binding constraints for INT18)

| TIP3 specification | Implementation constraint |
|---|---|
| One conversation per user, one store | Single `conversations` table, keyed by `userId` |
| Turns record pointers, never business rows | `entity_refs` is a JSONB array of `{type, id}` — never inline data |
| Context Frame is derived each turn, never stored as truth | Assembler is a pure read function, not a stored table |
| Persona is a presentation 3-tuple — not a separate runtime | No separate store per persona; `surface` column on the turn |
| Follow-up resolution uses prior turn's `entity_refs` | The assembler reads the most recent `entity_refs` from the store |
| Every intent routes through TIP1 `intelligencePlatform.handle()` | The Conversation Gateway is a thin wrapper around the existing engine |
| Honest gaps surface, never fabrication | LLM is grounded by assembled capability data; gaps propagate from `IntentOutcome` |

---

## 3. SCHEMA DESIGN

Three tables. All new additions — no modifications to existing schema.

### 3.1 `conversations`

One row per user. Created lazily on first assistant interaction.

```
conversations
  id            serial PRIMARY KEY
  userId        integer NOT NULL REFERENCES users(id) ON DELETE CASCADE
  createdAt     timestamp NOT NULL DEFAULT now()
  updatedAt     timestamp NOT NULL DEFAULT now()

UNIQUE (userId)
```

**Why one-per-user:** TIP3 Part 3 is unambiguous — one canonical conversation per user, threaded by context. Not one per device, not one per session.

### 3.2 `conversation_threads`

A context-coherent stretch within the one conversation. Created when a meaningful context shift occurs (e.g. user opens the shopping persona mid-planner session and begins a new task). Threads within the same conversation are the continuous history.

```
conversation_threads
  id               serial PRIMARY KEY
  conversationId   integer NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
  surface          text NOT NULL      -- 'floating' | 'planner' | 'shopping' | 'nutrition' | 'household' | 'voice'
  openedAt         timestamp NOT NULL DEFAULT now()
  closedAt         timestamp          -- null = still active
```

**Why explicit threads:** TIP3 §4.2 distinguishes *thread continuation* (same task, shifted persona) from *thread fork* (genuinely new task). Recording thread boundaries allows replay and reference without breaking the single conversation invariant.

### 3.3 `conversation_turns`

The core record. One row per exchange (user utterance or assistant response).

```
conversation_turns
  id                serial PRIMARY KEY
  threadId          integer NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE
  role              text NOT NULL CHECK (role IN ('user', 'assistant', 'system'))
  surface           text NOT NULL      -- which persona/entry-point produced this turn
  utterance         text NOT NULL      -- the raw text (user: typed/spoken; assistant: response text)
  resolvedIntent    jsonb              -- null for pure Q&A; {verb, capabilityId} for actioned intents
  contextFrameRef   jsonb              -- snapshot of POINTER IDs used this turn (not the data)
  entityRefs        jsonb NOT NULL DEFAULT '[]'  -- [{type, id}] pointers, e.g. [{type:'meal',id:42}]
  outcomeRef        jsonb              -- {status, message} from IntentOutcome; never the mutated row
  createdAt         timestamp NOT NULL DEFAULT now()
```

**`contextFrameRef` — what it stores (pointers only):**
```json
{
  "activePlannerWeekId": 7,
  "householdId": 3,
  "selectedMealId": 104,
  "selectedListId": null,
  "currentFoodSlug": null,
  "temporalAnchor": "2026-07-05"
}
```

This is a snapshot of *IDs* at the time of the turn. Re-rendering reads the live entity by ID. If the meal was deleted since, the UI notes "this meal no longer exists" — it does not show stale cached data.

**`entityRefs` — example:**
```json
[
  { "type": "meal", "id": 104 },
  { "type": "planner_week", "id": 7 }
]
```

These are what power pronoun resolution in follow-up turns ("move it to next week" — "it" is the most recent `entityRefs` entry of type `meal`).

**`outcomeRef` — what it stores:**
```json
{
  "status": "ok",
  "capabilityId": "planner",
  "verb": "read",
  "message": "Your planner for week of 30 Jun has 4 meals planned."
}
```

Never the planner rows themselves. The outcome is a *summary of what happened*, not a copy of the data.

### 3.4 Schema compliance

| Rule | Compliance |
|---|---|
| No `users` data in conversation tables | ✅ Only `userId` foreign key |
| No business rows duplicated | ✅ `entityRefs` / `contextFrameRef` store IDs only |
| `IF NOT EXISTS` in migrations | ✅ Required per RELEASE.md production data rules |
| All columns nullable where appropriate | ✅ `resolvedIntent`, `contextFrameRef`, `outcomeRef` are nullable (Q&A turns have no intent) |
| Idempotent backfill not needed | ✅ New tables start empty; no existing data to reconcile |

---

## 4. SERVER ARCHITECTURE

Three new modules under `server/intelligence/conversation/`:

### 4.1 `conversation-store.ts`

The single owner of the conversation schema. Exposes typed CRUD — no business logic.

```typescript
interface ConversationStore {
  // Get or lazily create the one conversation for a user
  getOrCreateConversation(userId: number): Promise<Conversation>;

  // Thread management
  openThread(conversationId: number, surface: Surface): Promise<ConversationThread>;
  getActiveThread(conversationId: number): Promise<ConversationThread | null>;
  closeThread(threadId: number): Promise<void>;

  // Turn management
  appendTurn(threadId: number, turn: NewConversationTurn): Promise<ConversationTurn>;
  getRecentTurns(threadId: number, limit: number): Promise<ConversationTurn[]>;

  // Follow-up resolution — most recent entity_refs in a thread
  getLastEntityRefs(threadId: number): Promise<EntityRef[]>;
}
```

**Ownership:** `ConversationStore` is the single owner of the `conversations`, `conversation_threads`, and `conversation_turns` tables. No other module writes to them. This is consistent with the TIP2 "one owner per fact" principle applied to the conversation layer itself.

### 4.2 `context-frame-assembler.ts`

A pure read function. Called at the start of each turn. Assembles the Context Frame from existing owners by reading their existing APIs — it stores nothing.

```typescript
interface ContextFrame {
  identity:             IntelligenceContext;          // from access.ts
  surface:              Surface;                      // from the request
  activePlannerWeekId?: number;                       // POINTER — from planner service
  householdId?:         number;                       // POINTER — from household service
  selectedMealId?:      number;                       // POINTER — from surface state / last entity_ref
  selectedListId?:      number;                       // POINTER — from shopping service
  currentFoodSlug?:     string;                       // POINTER — from food-detail surface / last entity_ref
  temporalAnchor?:      string;                       // resolved date ("Saturday", "next week" → ISO date)
}

async function assembleContextFrame(
  userId: number,
  surface: Surface,
  surfaceHints: SurfaceHints,         // what the client reports: active week id, selected meal id, etc.
  priorEntityRefs: EntityRef[],       // from conversation store — for pronoun resolution
  req: Request                        // for access.ts resolution
): Promise<ContextFrame>
```

**Non-duplication guarantee (TIP3 Part 4 / Risk R1):**
- Every slot in the Context Frame is a *freshly-read pointer* from the owning service.
- The frame is never stored as authoritative state — only a `contextFrameRef` (a snapshot of IDs) is written to the turn.
- On re-render of a past turn, the frame is re-assembled by re-reading live owners. If state changed, the re-assembled frame reflects the current truth, not a stale copy.

**Pronoun resolution chain (TIP3 §5.3):**
1. Surface selection (what the client reports is currently selected/visible)
2. Most recent `entity_refs` from the prior turn in the thread
3. Clarification request — never silent guessing

### 4.3 `conversation-gateway.ts`

The single wiring point. Connects an incoming user utterance to: Context Frame assembly → LLM grounding → `intelligencePlatform.handle()` → turn recording → response.

```typescript
async function processUserTurn(
  userId: number,
  utterance: string,
  surface: Surface,
  surfaceHints: SurfaceHints,
  req: Request
): Promise<AssistantResponse>
```

**Pipeline (read-only Phase 0):**

```
1. getOrCreateConversation(userId)
2. getActiveThread or openThread(conversationId, surface)
3. assembleContextFrame(userId, surface, surfaceHints, priorEntityRefs, req)
4. appendTurn(threadId, { role:'user', utterance, surface, contextFrameRef, entityRefs:[] })
5. groundedCall(utterance, contextFrame, intelligencePlatform)
   → calls intelligencePlatform.handle() for structured intents
   → calls assembled capability data for grounded Q&A
   → never fabricates; honest gap if no owned answer
6. appendTurn(threadId, { role:'assistant', utterance:response, resolvedIntent, entityRefs, outcomeRef })
7. return AssistantResponse { text, entityRefs, outcome }
```

**Grounded call — Phase 0 constraint:**
- The LLM is given the assembled capability data (from the 11 live read-only handlers) as context.
- It is not given the full conversation history in the prompt — only the last N turns (bounded window).
- It must not fabricate health claims, prices, nutrition facts, or planner data.
- The EFSA wording firewall (nutrition-knowledge-registry) applies equally here.

---

## 5. API ROUTES

Three new routes under `/api/intelligence/conversation/`:

| Method | Route | What it does |
|---|---|---|
| `POST` | `/api/intelligence/conversation/turn` | Submit a user utterance; receive assistant response |
| `GET` | `/api/intelligence/conversation/turns` | Fetch recent turns for the active thread |
| `GET` | `/api/intelligence/conversation/threads` | List threads (for history / context switching) |

**Request shape for `POST /api/intelligence/conversation/turn`:**
```typescript
{
  utterance: string;              // the user's text
  surface: Surface;               // which persona/entry-point
  surfaceHints?: {
    activePlannerWeekId?: number;
    selectedMealId?: number;
    currentFoodSlug?: string;
    currentPath?: string;
  }
}
```

**Response shape:**
```typescript
{
  turn: ConversationTurn;         // the recorded assistant turn
  text: string;                   // the assistant response text
  entityRefs: EntityRef[];        // entities referenced in the response
  outcome?: IntentOutcome;        // present if an intent was routed
  clarificationNeeded?: boolean;  // true if the assistant is asking for disambiguation
}
```

**Auth:** All routes require an authenticated session. `access.ts` provides the user. No anonymous conversation access.

---

## 6. UI ARCHITECTURE

### 6.1 Floating Assistant

The primary entry point (TIP3 Part 2 — Primary entry points). Present on every page.

```
FloatingAssistant.tsx
  ├─ Trigger button — fixed position, bottom-right, every page
  ├─ AssistantDrawer — slides up/in when open
  │   ├─ ConversationThread — renders recent turns
  │   │   └─ TurnBubble (user | assistant | system)
  │   │       └─ EntityPill — tappable reference to a pointed entity
  │   ├─ QuickActions — pre-filled intent chips for the current surface
  │   └─ AssistantInput — text field + submit
  └─ PersonaLabel — shows the current contextual framing ("Planner", "Shopping", etc.)
```

**Design rules:**
- The trigger button is always visible. Never auto-hides, never auto-pops.
- The drawer is not full-screen on desktop — it is a side panel or bottom sheet, so the user can see their planner/basket while talking.
- The persona label changes with the page but the conversation history is continuous (TIP3 §2.4).
- `QuickActions` are pre-filled `(verb × capability)` intent chips — "What's in my pantry?", "Summarise this week's plan", "What's high in protein?". They seed the Intent Engine, not a second logic path.

### 6.2 Component inventory

| Component | Description | Phase |
|---|---|---|
| `FloatingAssistant.tsx` | Trigger + drawer shell | Phase 1 |
| `ConversationThread.tsx` | Renders an array of turns in a scrollable thread | Phase 1 |
| `TurnBubble.tsx` | Single turn: role icon, text, entity pills | Phase 1 |
| `EntityPill.tsx` | Tappable chip that navigates to/highlights an entity | Phase 1 |
| `AssistantInput.tsx` | Text input, submit, voice trigger (Phase 3) | Phase 1 |
| `QuickActions.tsx` | Surface-aware pre-filled intent chips | Phase 1 |
| `PersonaLabel.tsx` | Current contextual framing badge | Phase 1 |
| `ClarificationPrompt.tsx` | Disambiguation UI when `clarificationNeeded: true` | Phase 1 |

### 6.3 Surface hints — how the client tells the server what's on screen

On each page that has a contextual persona, the client must pass `surfaceHints` with the currently-visible entities. This is how the assistant knows "it" without the server storing a second copy.

```typescript
// On the planner page:
surfaceHints = {
  activePlannerWeekId: currentWeek.id,
  selectedMealId: clickedMeal?.id,
  currentPath: "/planner"
}

// On the food detail page:
surfaceHints = {
  currentFoodSlug: food.slug,
  currentPath: `/foods/${food.slug}`
}
```

The client never resolves pronouns itself — it sends hints, and the Context Frame Assembler resolves them server-side.

---

## 7. PHASING

INT18 designs the full platform but does not implement it in one step. The recommended phases align with the TIP3 five-year arc and the INT5 "read-only first" finding.

### Phase 0 — Conversation Store only (no UI, no LLM)

**Scope:**
- Schema: `conversations`, `conversation_threads`, `conversation_turns` tables + migration
- `server/intelligence/conversation/conversation-store.ts`
- Unit tests for the store (in-memory or test DB)
- No API routes. No UI. No LLM.

**Why:** proves the schema, the pointer discipline, and the owner model before any user-facing surface. Cheapest failure point. If the schema design is wrong, the cost is one migration and one module, not a full UI + LLM integration.

**Definition of done:**
- Tables created via idempotent migration
- `ConversationStore` passes unit tests for: get-or-create, open thread, append turn, get recent turns, get last entity refs
- No business data in any test turn — only IDs and pointers
- Zero routes added, zero UI added

### Phase 1 — Floating Assistant + grounded read-only Q&A

**Scope:**
- `server/intelligence/conversation/context-frame-assembler.ts`
- `server/intelligence/conversation/conversation-gateway.ts` (read-only, no intent routing)
- API routes: `POST /turn`, `GET /turns`, `GET /threads`
- UI: `FloatingAssistant`, `ConversationThread`, `TurnBubble`, `AssistantInput`, `QuickActions`, `PersonaLabel`
- LLM call: grounded by assembled capability data from the 11 live read-only handlers; no write intents

**Capability at the end of Phase 1:**
> The user can open the floating assistant on any page, type a question ("What's in my pantry?", "Which meals this week are high in protein?", "What are the benefits of spinach?"), and receive a grounded, honest answer assembled from the 11 live capability bindings. The conversation is recorded, with pointers. Follow-up questions resolve against the prior entity refs.

**Write intents are not available.** If the user types "Add tacos to Friday", the response is an honest gap: "I can tell you about your planner, but I can't make changes to it yet."

**Definition of done:**
- Floating assistant renders on all pages
- Grounded Q&A works for all 11 read-only capabilities
- Turns are recorded in the store with correct pointers
- Follow-up pronoun resolution works for at least: selected meal, active planner week, current food
- Non-fabrication: LLM cannot produce a response not grounded in assembled owner data
- Honest gap for all write intents

### Phase 2 — Intent routing (write capabilities)

**Scope:**
- `confirm → invoke` path wired through `intelligencePlatform.handle()` for at least one write capability
- Confirmation UI (TIP2 §5 tiers: light, required, strong)
- The first write binding (recommended: Diary `add` — lowest risk, lowest stakes)

**Gate:** INT5 §12 is explicit — *"The first write binding must be treated as a new convergence checkpoint."* Phase 2 requires its own convergence review before scaling writes.

### Phase 3 — Voice

**Scope:**
- STT/TTS adapters (TIP3 Part 5)
- Hands-free cooking mode
- Same Gateway, same store, same handlers — voice is two adapters, not a new platform (TIP1 §11)

### Phase 4 — Proactive digests

**Scope:**
- Background summarisation (TIP3 Part 10)
- Daily/weekly digest — summarised, never a stream
- Safety-class signals only for immediate delivery

---

## 8. WHAT PHASE 0 REQUIRES FROM THE CODEBASE

**Schema additions (migration):**

```sql
-- conversation_conversations
CREATE TABLE IF NOT EXISTS conversations (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- conversation_threads
CREATE TABLE IF NOT EXISTS conversation_threads (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  surface         TEXT NOT NULL,
  opened_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMP
);

-- conversation_turns
CREATE TABLE IF NOT EXISTS conversation_turns (
  id               SERIAL PRIMARY KEY,
  thread_id        INTEGER NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  surface          TEXT NOT NULL,
  utterance        TEXT NOT NULL,
  resolved_intent  JSONB,
  context_frame_ref JSONB,
  entity_refs      JSONB NOT NULL DEFAULT '[]',
  outcome_ref      JSONB,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**`shared/schema.ts` additions:** three Drizzle table definitions using `serial`, `integer`, `text`, `jsonb`, `timestamp`, `.references()`. No changes to existing tables.

**`server/storage.ts` additions:** `IStorage` interface extended with `ConversationStore` methods (or a separate injectable store — see §9, Risk R5).

---

## 9. RISKS

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Context Frame becomes a second owner (TIP3 Risk R1 restated).** If the conversation layer begins *persisting* the active week/meal/list as its own truth rather than just pointers, it becomes a second owner and will diverge from the real owners. | 🔴 Critical | `contextFrameRef` stores ONLY IDs, never data rows. Code review must verify no business data in any turn column. The assembler is a pure read function, discards its output after recording the ID snapshot. |
| R2 | **LLM fabricates outside grounded data.** The model invents a nutrition fact, a price, or a planner entry not in the assembled capability response. | 🔴 Critical | Prompt engineering: the LLM is given only the assembled handler output as context. System prompt explicitly prohibits health claims not from the registry. The EFSA wording firewall applies. Any claim not grounded in a `handler.read()` result is a fabrication. |
| R3 | **Conversation grows as a silent second assembler.** The Conversation Gateway begins calling business services directly (not through the capability handlers), re-implementing planner or nutrition logic. | 🟠 High | The Gateway may only call `intelligencePlatform.handle()` and `contextFrameAssembler.assemble()`. No direct `storage.*` calls inside the Gateway except through the ConversationStore. |
| R4 | **Write intents introduced before `confirm → invoke` is proven.** Phase 1's honest-gap response for write intents is replaced with a live write before the confirmation path has a convergence checkpoint. | 🟠 High | Phase 2 gate: no write intent is wired until its own convergence review passes (INT5 §12 requirement). Phase 1 must return honest gaps for all write verbs. |
| R5 | **Storage coupling.** If ConversationStore methods are added to the main `IStorage` interface, they inherit all of storage's test overhead and couple conversation logic to the main storage layer. | 🟡 Medium | Consider a separate `IConversationStorage` interface with its own implementation, injected into the Conversation Gateway independently of the main `storage`. This keeps conversation testing isolated. Decision to make at Phase 0. |
| R6 | **Thread proliferation.** The system creates a new thread on every page navigation, fragmenting the conversation into hundreds of single-turn threads rather than coherent stretches. | 🟡 Medium | Thread creation policy: a new thread is opened only when the surface changes AND the prior thread has been idle for > N minutes, OR when the user explicitly starts a new conversation. Page navigation within the same surface continues the active thread. |
| R7 | **Entity ref chain breaks on entity deletion.** A prior turn references `mealId: 42`; that meal is deleted. A follow-up says "what was in it?" The assembler tries to resolve the meal and gets nothing. | 🟡 Medium | The assembler must handle null-resolution gracefully: "That meal no longer exists. Here's what I can tell you from your current planner..." — honest gap, not a crash. |
| R8 | **Conversation history grows unboundedly.** A user with months of daily assistant use accumulates tens of thousands of turns, slowing `getRecentTurns` and inflating the LLM context window. | 🟡 Medium | `getRecentTurns` is bounded (last 20 turns). LLM context window uses only the last N turns + the current context frame. Archival of old threads is a future workstream. |

---

## 10. OPEN QUESTIONS FOR PHASE 0

These questions must be answered before Phase 1 begins. They do not block Phase 0 (schema + store only).

| # | Question | Options |
|---|---|---|
| OQ1 | **Separate `IConversationStorage` vs. extension of `IStorage`?** | (a) Separate interface + implementation — cleanest isolation; (b) Extend `IStorage` — simpler, more coupled |
| OQ2 | **LLM model for Phase 1 grounding?** | GPT-4o-mini (already in stack for scan/enrichment) is the lowest-cost option and already proven for food/recipe classification. Anthropic Claude is also in the stack. Decision before Phase 1. |
| OQ3 | **Bounded context window size?** | Last 10 turns? Last 20? Last 5 + current context frame? This affects response quality vs. cost. |
| OQ4 | **Thread idle timeout for auto-close?** | 30 min? 2 hours? Never auto-close (user must explicitly start new)? |
| OQ5 | **Surface hint trust model?** | The client sends `surfaceHints` in the request body. Should the server trust these (simplest) or re-derive them independently from the authenticated session (more secure but requires more server queries)? For read-only Phase 1, client trust is acceptable. For write Phase 2, server re-derivation is safer. |
| OQ6 | **Conversation visibility to admin?** | Should admins be able to read user conversation turns for support/debugging? This is a privacy and audit question to be decided before Phase 1 ships. |

---

## 11. RELATIONSHIP TO INT SERIES

| Investigation | Relationship to INT18 |
|---|---|
| INT1 (foundation) | INT18 builds on the `intelligencePlatform` singleton and `types.ts` |
| INT2–INT17 (bindings) | Phase 1 grounds the LLM on the assembled output of all 11 read-only handlers |
| INT5 (convergence review) | INT18 respects the INT5 verdict: read-only first; write path is a new checkpoint |
| TIP1 (platform) | INT18's Conversation Gateway is an adapter in front of the unchanged TIP1 Gateway |
| TIP2 (registry) | INT18's intent routing calls `intelligencePlatform.handle()` — the TIP2 registry enforces allowed verbs |
| TIP3 (experience) | INT18 is the concrete design implementation of TIP3's conversation and context models |

---

## 12. SAFE TO SHIP — PHASED VERDICT

| Phase | Safe to ship? | Condition |
|---|---|---|
| Phase 0 (schema + store) | **YES** | Schema additions are additive (no existing table modified). Store is new, isolated, unused until Phase 1. Migration is idempotent. No runtime impact until a route or handler references the tables. |
| Phase 1 (floating assistant + read-only Q&A) | **YES, conditionally** | LLM must be grounded-only (no fabrication). Write intents must return honest gaps. Context Frame assembler must store pointers only. Non-fabrication must be verified before merge. |
| Phase 2 (write intents) | **CONDITIONAL HOLD** | Requires its own convergence review (INT5 §12). Not part of INT18 scope. |
| Phase 3 (voice) | **FUTURE** | TIP3 Part 5 is fully designed; implementation is straightforward once Phase 1 is proven. |

---

## 13. RECOMMENDATION

**Proceed with Phase 0 (schema + conversation store) as the next implementation step.**

**Rationale:**

1. **The architecture is settled.** TIP3 is governing architecture. TIP1's `intelligencePlatform` is the correct spine. The Port → Handler → Binding pattern (INT5) is converged. INT18 introduces no new architectural question — it implements what TIP3 already specifies.

2. **Phase 0 is the lowest-risk entry point.** Schema additions, one new module, no routes, no LLM, no UI. The failure surface is a single migration and a set of unit tests. If anything is wrong with the schema design, it is cheapest to find here.

3. **All 11 read-only bindings are live.** When Phase 1 grounds the assistant on the assembled output of those 11 handlers, it immediately has full read coverage: planner, shopping, pantry, diary, profile, household, nutrition, meals, templates, partners, analyser. The assistant is genuinely useful on day one of Phase 1 without any new capability work.

4. **Phase 0 → Phase 1 is a natural, safe progression.** Nothing in Phase 0 enables a write action. Nothing in Phase 1 enables a write action. The `confirm → invoke` path remains unexercised until Phase 2 deliberately proves it. This preserves the INT5 §12 "write path is a new checkpoint" guarantee.

5. **The schema is designed for the long arc.** The `contextFrameRef` / `entityRefs` / `outcomeRef` pointer model is built for TIP3's five-year vision — voice, proactive, delight — without needing a schema migration at each phase. The tables expand naturally as new surfaces and intents are added.

---

## DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| Architecture compliance gate reviewed and passed | ✅ §"Architecture Compliance Review" — PASS |
| What "Conversation Platform" means scoped precisely | ✅ §1 |
| Grounding in existing implementation (INT1–INT17) | ✅ §2 |
| Schema design (three tables, pointer discipline, compliance) | ✅ §3 |
| Server architecture (store, assembler, gateway) | ✅ §4 |
| API routes designed | ✅ §5 |
| UI architecture designed | ✅ §6 |
| Phasing with clear gates (esp. write path gated) | ✅ §7 |
| Phase 0 schema SQL provided | ✅ §8 |
| Risks identified (R1–R8) | ✅ §9 |
| Open questions for Phase 0→1 transition | ✅ §10 |
| Relationship to INT series documented | ✅ §11 |
| Safe-to-ship verdict per phase | ✅ §12 |
| Recommendation with rationale | ✅ §13 |
| Report saved to `docs/investigations/INT18_…` | ✅ this file |
| No code, schema, route, or UI created | ✅ investigation only |

---

## APPENDIX — CONSTRAINTS COMPLIANCE

✅ No code changes · ✅ No schema changes · ✅ No route changes · ✅ No new capability bindings · ✅ No refactoring · ✅ No UI created · ✅ No LLM calls · ✅ Investigation only.

*Investigation only. No implementation performed. Rollback tag to be created before Phase 0 implementation begins.*
