# INT18 Phase 2 — Floating Assistant + LLM Provider Abstraction
## Implementation Report

**Date:** 2026-07-01  
**Branch:** `int1-intelligence-platform`  
**Scope:** Phase 2 of INT18 CONVERSATION_PLATFORM_DESIGN  
**Status:** ✅ Complete

---

## Summary

Phase 2 delivers the full user-facing Floating Assistant UI and decouples the Conversation Gateway from its direct OpenAI dependency.

Two discrete deliverables:

1. **LLM Provider Abstraction** (server) — `ILlmProvider` interface with `OpenAIProvider` (gpt-4o-mini, default) and `NoOpProvider` (graceful degradation). The gateway now depends on the interface, not on OpenAI directly. Tests inject any provider.

2. **Floating Assistant UI** (client) — 6 tightly-coupled components in `client/src/components/conversation/FloatingAssistant.tsx`, mounted globally in `ProtectedRoute`. Connects to the 3 API routes from Phase 1.

---

## Files Delivered

### New — server

| File | Role |
|---|---|
| `server/intelligence/conversation/llm-provider.ts` | `ILlmProvider` interface, `OpenAIProvider`, `NoOpProvider`, `createDefaultLlmProvider()` |
| `server/tests/test-intelligence-llm-provider.ts` | 41 unit tests |

### Modified — server

| File | Change |
|---|---|
| `server/intelligence/conversation/conversation-gateway.ts` | Added `ILlmProvider` import; `buildGroundedResponse` now receives `llmProvider: ILlmProvider`; `ConversationGateway` constructor accepts optional `ILlmProvider` (defaults to `createDefaultLlmProvider()`); singleton unchanged (still uses `DatabaseConversationStore`); doc-comment updated |

### New — client

| File | Role |
|---|---|
| `client/src/components/conversation/FloatingAssistant.tsx` | All 6 UI components (see below) |

### Modified — client

| File | Change |
|---|---|
| `client/src/App.tsx` | Imports and mounts `<FloatingAssistant />` inside `ProtectedRoute` (after `<MobileNav />`, fixed-positioned so it has no layout impact) |

---

## Component Architecture

```
FloatingAssistant            ← fixed bottom-right trigger + slide-in panel
  ├─ PersonaLabel            ← surface-aware badge ("Planner", "Pantry", …)
  ├─ ConversationThread      ← scrollable turn list with auto-scroll
  │   └─ TurnBubble          ← user (right, bg-primary/10) | assistant (left, bg-muted)
  │       └─ entity pills    ← inline ref chips on assistant turns
  ├─ QuickActions            ← 3 pre-filled chips when thread is empty
  └─ AssistantInput          ← auto-resize textarea + send button
```

All six components are in one file. They share local state via props and have no external state library dependency.

---

## LLM Provider Interface

```typescript
export interface ILlmProvider {
  complete(request: LlmRequest): Promise<LlmResponse>;
  readonly modelName: string;
  readonly isAvailable: boolean;
}
```

**`OpenAIProvider`** — gpt-4o-mini, `isAvailable` reflects `OPENAI_API_KEY` presence.  
**`NoOpProvider`** — returns a canned JSON message (`isAvailable: false`). Used when no key is set.  
**`createDefaultLlmProvider()`** — factory returning `OpenAIProvider` if key present, else `NoOpProvider`.

### Gateway injection pattern

```typescript
// Production (singleton):
export const conversationGateway = new ConversationGateway(
  new DatabaseConversationStore(),
  // llmProvider defaults to createDefaultLlmProvider()
);

// Tests — inject a stub:
const gateway = new ConversationGateway(
  new InMemoryConversationStore(),
  new StubProvider(),
);
```

---

## Surface Detection

`useSurface()` hook maps the current `useLocation()` path to a `ConversationSurface`:

| Path prefix | Surface |
|---|---|
| `/planner`, `/weekly-planner` | `planner` |
| `/basket`, `/analyse-basket`, `/shopping` | `shopping` |
| `/analyser`, `/products` | `analyser` |
| `/pantry` | `pantry` |
| `/diary`, `/food-diary` | `diary` |
| `/meals`, `/cookbook` | `meals` |
| `/foods` | `nutrition` |
| `/partners` | `partners` |
| (all other) | `floating` |

The `PersonaLabel` badge and `QuickActions` chips both react to the surface.

---

## UI Design Decisions

- **Trigger button:** `fixed bottom-6 right-6 z-50`, circular, `bg-primary`, Leaf icon. Always visible, never auto-hides (per INT18 §6.1).
- **Panel:** slides in from right (`framer-motion` spring), `w-full sm:w-[380px]`, `bg-background/97 backdrop-blur-md border-l border-border/30`.
- **TurnBubble:** User turns right-aligned (`bg-primary/10`, `rounded-tr-sm`). Assistant turns left-aligned with Leaf avatar (`bg-muted`, `rounded-tl-sm`).
- **Loading state:** Three bouncing dots in an assistant bubble while `isPending`.
- **Empty state:** Greeting + `QuickActions` chips (disappears when history exists).
- **Keyboard:** Enter submits; Shift+Enter newline; Escape closes panel.
- **Mobile backdrop:** Semi-transparent overlay behind the panel on narrow screens.
- **`data-testid` coverage:** Every interactive element and major display region has a unique test ID.

---

## Optimistic Update Strategy

1. On submit, an optimistic user turn is appended locally (negative ID to avoid collisions).
2. The server mutation fires; `isPending` triggers the loading bubble.
3. On success, the turns query is invalidated; server turns replace the optimistic ones.
4. On error, the optimistic turn is removed.

---

## Boundaries Preserved

| Boundary | Status |
|---|---|
| Read-only conversations only | ✅ Write intents still return honest gap |
| No voice | ✅ No audio/speech code |
| No write intents | ✅ Not wired |
| No capability changes | ✅ Same 11 capabilities from Phase 1 |
| INT18 Risk R4 (write guard before LLM) | ✅ `detectWriteIntent()` runs before provider call |
| Pointer discipline (no PII in turns) | ✅ EntityRefs only; no raw user data stored |

---

## Test Results

| Suite | Pass | Fail |
|---|---|---|
| LLM Provider (`test-intelligence-llm-provider.ts`) | **41** | 0 |
| Gateway Phase 1 (`test-intelligence-conversation-gateway.ts`) | **74** | 0 |
| Gateway Phase 0 (`test-intelligence-conversation-store.ts`) | **55** | 0 |
| **Total** | **170** | **0** |

---

## Known Deferred Items

- `EntityPill` navigation (tapping an entity ref to highlight it in the app) — deferred to Phase 3.
- `ClarificationPrompt` (disambiguation UI when `clarificationNeeded: true`) — deferred to Phase 3.
- Voice trigger on `AssistantInput` — Phase 3 (per INT18 §7).
- Surface hints enrichment (passing `activePlannerWeekId`, `selectedMealId` etc. from page context to the gateway) — pages can opt-in by extending the `surfaceHints` payload.
