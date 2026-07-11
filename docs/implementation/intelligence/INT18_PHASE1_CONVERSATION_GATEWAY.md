# INT18 Phase 1 — Conversation Gateway
**Status:** Complete  
**Date:** 2026-07-01  
**Branch:** `int1-intelligence-platform`

---

## 1. Problem Statement

INT18 Phase 0 delivered the `conversations / conversation_threads / conversation_turns`
schema and `ConversationStore`. Phase 1 delivers the wiring layer that turns those
tables into a live, grounded AI assistant: a **Context Frame Assembler**, a
**Conversation Gateway**, and three HTTP API routes.

---

## 2. Design Decisions

### Context Frame Assembler
- Pointer-only output (`ContextFrame` holds IDs, never inline business rows — TIP3 Risk R1).
- Resolution priority: `surfaceHint → priorEntityRef → storage fallback`.
- All storage reads are in `try/catch`; a failed owner never aborts a turn.
- Serialised to `contextFrameRef` on every `ConversationTurn` via `serializeFrameRef()`.

### Conversation Gateway — grounding pipeline
1. Get-or-create conversation + thread (one thread per session; no per-navigation
   fragmentation — INT18 Risk R6).
2. Assemble context frame (pointer IDs only).
3. Record user turn.
4. **Write-intent guard**: conservative regex patterns detect mutations before any LLM
   call. Matched utterances return an honest gap immediately (INT18 Risk R4).
5. Capability selection: `profile` always; surface-primary cap; up to 3 more from
   keyword signals; hard cap at 4 capabilities to bound latency.
6. Query each selected capability via `intelligencePlatform.handle({ verb: 'read', … })`
   only — no direct `storage.*` calls in the gateway.
7. Call `gpt-4o-mini` with assembled context (≤1 800 chars per capability),
   last 5 prior turns, and a strict system prompt (no fabrication, no medical
   claims, EFSA firewall).
8. Parse JSON response → `{ text, entityRefs }` with graceful plain-text fallback.
9. Record assistant turn.

### IConversationStore — `listThreads` addition
`listThreads(conversationId, limit)` was added to `IConversationStore` and both
implementations (`DatabaseConversationStore`, `InMemoryConversationStore`).
Required by `GET /api/intelligence/conversation/threads`.

---

## 3. Files Changed

| Path | Change |
|------|--------|
| `server/intelligence/conversation/conversation-store.ts` | Added `listThreads` to interface + both implementations |
| `server/intelligence/conversation/context-frame-assembler.ts` | **New** — pointer-only ContextFrame assembly |
| `server/intelligence/conversation/conversation-gateway.ts` | **New** — full turn pipeline + singleton |
| `server/routes.ts` | 3 new routes appended before `return httpServer` |
| `server/tests/test-intelligence-conversation-gateway.ts` | **New** — 74 tests |
| `docs/implementation/intelligence/INT18_PHASE1_CONVERSATION_GATEWAY.md` | This file |

---

## 4. API Routes

### `POST /api/intelligence/conversation/turn`
Processes one user utterance end-to-end.

**Request body**
```json
{
  "utterance": "What meals do I have this week?",
  "surface": "planner",
  "surfaceHints": {
    "activePlannerWeekId": 7,
    "selectedMealId": null,
    "currentFoodSlug": null
  }
}
```

**Response**
```json
{
  "text": "Your planner for week 1 has…",
  "entityRefs": [{ "type": "planner_week", "id": 7 }],
  "userTurnId": 15,
  "assistantTurnId": 16,
  "conversationId": 3,
  "threadId": 4
}
```

Validation: `utterance` required, max 2 000 chars; `surface` must be a valid
`ConversationSurface` value.

Write-intent utterances ("add salmon to my list") return an honest gap in `text`
without calling the LLM.

### `GET /api/intelligence/conversation/turns?limit=20`
Returns the most recent turns (default 20, max 50) for the active thread.

### `GET /api/intelligence/conversation/threads`
Returns the conversation record and the list of threads, most-recently-opened first.

---

## 5. Test Results

```
── detectWriteIntent                          12/12 ✓
── selectCapabilities                          10/10 ✓
── serializeFrameRef — pointer discipline      12/12 ✓
── assembleContextFrame — surface hint          6/6 ✓
── ConversationGateway — state management      18/18 ✓
── Write intent guard                           4/4 ✓
── contextFrameRef pointer discipline           7/7 ✓
── listThreads                                  5/5 ✓
───────────────────────────────────────────────────
Total: 74/74 passed
```

Run: `npx tsx server/tests/test-intelligence-conversation-gateway.ts`

Phase 0 store tests: 55/55 still passing.

---

## 6. Schema Audit

No new tables or columns introduced in Phase 1. The three tables created in Phase 0
(`conversations`, `conversation_threads`, `conversation_turns`) are unchanged.
Migration `2026-07-01_int18_conversation_store` (Phase 0) already covers all columns.
Phase 1 schema audit: **PASS**.

---

## 7. Risk Review

| Risk | Resolution |
|------|-----------|
| R1 — business data in conversation store | ContextFrame holds IDs only; `serializeFrameRef()` enforces the projection at the serialisation boundary. |
| R3 — gateway calling storage directly | Gateway calls `intelligencePlatform.handle()` only; context frame storage reads are isolated in the assembler. |
| R4 — write intents fabricated | `detectWriteIntent()` fires before any LLM call; returns honest gap with no platform invocation. |
| R6 — per-navigation thread fragmentation | Thread reuse: `getActiveThread()` is checked first; new thread opened only when no active thread exists. |
| R8 — unbounded turn history | `getRecentTurns(threadId, 6)` bounds history passed to the LLM. Capability data is capped at 1 800 chars each. |
| OQ5 — surface hint trust | Trusted for Phase 1 (read-only safe). UserId always comes from the authenticated session. |
