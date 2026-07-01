# INT25A — Floating Assistant: "Find me a chicken curry recipe" — Full Trace Investigation

**Date:** 2026-07-01  
**Status:** Investigation complete. No implementation performed.  
**Query tested:** _"Find me a chicken curry recipe"_

---

## Executive Summary

The query never reaches the `search` verb handler. Three independent failure modes
combine to produce a non-answer. The primary failure is in the **intent resolver
(Layer 3)** — a pattern mismatch that silently degrades the intent to a list read
instead of a search. The secondary failure is **data coverage (Layer 4)** — even
if search fired correctly, neither the user's personal meal library nor the system
meal library would contain a chicken curry recipe unless one was imported. The
tertiary failure is **grounding design (Layer 5)** — by constraint the LLM cannot
suggest recipes from its own training data when the context is empty.

---

## Full Trace

```
User input: "Find me a chicken curry recipe"
         ↓
[Layer 1] FloatingAssistant.tsx
  POST /api/intelligence/conversation/turn
  { utterance: "Find me a chicken curry recipe", surface, surfaceHints }
         ↓
[Layer 2] ConversationGateway.processUserTurn
  detectWriteIntent → null  (no write pattern matches — passes through)
  llmProvider.isAvailable → checked (passes if OPENAI_API_KEY present)
         ↓
[Layer 3] PatternIntentResolver.resolve  ← PRIMARY FAILURE
  ↓ iterates ALL_SPECIFIC_MATCHERS
  ↓ hits MEALS_MATCHERS
    Pattern 1: /\bfind\s+(?:me\s+)?(?:a\s+)?recipe(?:\s+for)?\s+(.+?)$/i
      → DOES NOT MATCH (requires "recipe" near the start: "find me a recipe for X")
      → "Find me a chicken curry recipe" has "recipe" at the END
    Pattern 2: /\b(?:search\s+for|look\s+up)\s+(?:a\s+)?(.+?)\s+(?:recipe|dish|meal)\b/i
      → DOES NOT MATCH (requires "search for" or "look up" as the leading verb)
    Falls through MEALS_MATCHERS entirely.
  ↓ hits KEYWORD_FALLBACKS
    Pattern: /\b(?:recipe|cook|dish|ingredient)\b/i
      → MATCHES on "recipe"   (confidence 0.55)
      → resolves: { capability: "meals", verb: "read" }
      → addDefaultParameters → { scope: "list" }
  Result: { capability: "meals", verb: "read", parameters: { scope: "list" }, confidence: 0.55 }
  (verb: "search", parameters: { query: "chicken curry" } is NEVER produced)
         ↓
[Layer 4] MealsReadHandler  ← SECONDARY FAILURE
  intent.verb === "read", scope === "list"
  → calls getMeals(userId)    → returns all of the user's personal meals
  → calls getSystemMeals()    → returns all system meals
  → merges and returns ALL meals with no "chicken curry" filter
  Context produced: full meal list (could be 0 meals for a new user, or many for
  an active user — none guaranteed to be a chicken curry recipe unless previously
  imported)
         ↓
[Layer 5] LLM Grounding  ← TERTIARY FAILURE (by design)
  System prompt HARD RULE 1: "Answer ONLY from the CONTEXT DATA provided below.
  Never invent, hallucinate, or assume facts not present in the context."
  CONTEXT DATA: {"scope":"list","mealCount":N,"meals":[...all user meals...]}
  → If no meal is named "chicken curry": LLM correctly says
    "I don't have that information right now."
  → If user happens to have a chicken curry meal: LLM reports it, but this is
    coincidental — the search intent was never correctly resolved.
         ↓
[Layer 1] FloatingAssistant.tsx
  Displays: "I don't have that information right now."  (or a list of unrelated meals)
```

---

## Failure Analysis

### F1 — Intent Resolution Pattern Gap (PRIMARY — CRITICAL)

**Location:** `server/intelligence/pattern-intent-resolver.ts`, MEALS_MATCHERS  
**Nature:** Pattern mismatch — silent degradation from `search` to `read`

The two specific MEALS_MATCHERS for recipe search are:

```typescript
// Pattern 1 — matches "find me a recipe for X"
/\bfind\s+(?:me\s+)?(?:a\s+)?recipe(?:\s+for)?\s+(.+?)[\?.]?\s*$/i

// Pattern 2 — matches "search for a X recipe" / "look up X dishes"
/\b(?:search\s+for|look\s+up)\s+(?:a\s+)?(.+?)\s+(?:recipe|dish|meal)\b/i
```

The tested phrase `"Find me a chicken curry recipe"` matches **neither**:
- Pattern 1 requires `recipe` to appear BETWEEN `find me a` and the food term.
  The natural English phrasing places the noun first: `"find me a [dish] recipe"`.
- Pattern 2 requires `search for` or `look up` as the initiating verb.

The keyword fallback then fires (confidence 0.55):
```typescript
pattern: /\b(?:recipe|cook|dish|ingredient)\b/i,
capability: "meals",
// → verb: "read", parameters: { scope: "list" }
```

This silently downgrades the intent to a list read. The search verb — and with it
all the work of INT25 — is completely bypassed. No error is raised; the degradation
is invisible to the user and to logs.

**Gap variants not covered by current patterns (all common natural English):**
```
"Find me a chicken curry recipe"          → noun-last phrasing (tested query)
"Show me a pasta recipe"                  → show-verb phrasing
"I want a recipe for fish pie"            → want-verb phrasing
"Give me something with salmon"           → ingredient-first phrasing
"Do I have any vegetarian options?"       → have-verb phrasing
"What can I cook with chickpeas?"         → ingredient phrasing
```

### F2 — Data Coverage Gap (SECONDARY — MODERATE)

**Location:** `server/intelligence/handlers/meals-read-handler.ts`, `handleSearch()`  
**Nature:** Search scope is bounded to personal library + system meals only

Even if F1 were fixed and `search` correctly fired with `query: "chicken curry"`:

- `getMeals(userId)` returns only meals the user has previously imported or created.
- `getSystemMeals()` returns only meals marked `isSystemMeal = true` in the DB.
- Neither source contains "chicken curry" unless an admin seeded it as a system meal
  or the user previously imported a chicken curry recipe.

For any new or typical user who has not explicitly imported a chicken curry,
`handleSearch` correctly returns `{ mealCount: 0, meals: [] }`.

The LLM then receives empty context. Per HARD RULE 1 it responds: _"I don't have
that information right now."_ This is correct behaviour — it is not a bug — but
it is uninformative to the user, who reasonably expects the assistant to either
suggest a recipe or explain that they need to import one first.

**This is a scope limitation, not a bug.** The `search` verb was designed to
search the user's own meal library, not external recipe databases (TheMealDB,
BBC Good Food etc.). The user's mental model is likely "find me any chicken curry
recipe"; the platform's capability is "find chicken curry in your saved meals".

### F3 — LLM Grounding Constraint (TERTIARY — BY DESIGN)

**Location:** `server/intelligence/conversation/conversation-gateway.ts`, `buildGroundedResponse()`  
**Nature:** Hallucination firewall prevents recipe suggestions from LLM training data

```
HARD RULE 1: "Answer ONLY from the CONTEXT DATA provided below.
Never invent, hallucinate, or assume facts not present in the context."
```

This is correct and intentional. When context is empty, the LLM correctly reports
it cannot help. It is not a bug. However, combined with F1 and F2, it produces a
dead end: the user gets no recipe and no explanation of what they need to do (e.g.
"I don't have a chicken curry in your meal library — try importing one from the
recipe search page").

---

## Layer-by-Layer Verdict

| Layer | Component | Status | Verdict |
|---|---|---|---|
| 1 — UI | `FloatingAssistant.tsx` | ✅ Working | POST to correct endpoint; renders response correctly |
| 2 — Gateway | `ConversationGateway.processUserTurn` | ✅ Working | Write-guard passes; routes to resolver correctly; calls platform with resolver's verb |
| 3 — Intent Engine | `PatternIntentResolver` MEALS_MATCHERS | ❌ **F1 — BROKEN** | "find me a chicken curry recipe" matches keyword fallback → `read/list`, not `search` |
| 4 — Handler | `MealsReadHandler.handleSearch` | ⚠️ F2 — LIMITED | Code correct; scope bounded to personal + system meals; no cross-user data |
| 5 — LLM Grounding | `buildGroundedResponse` / OpenAI | ✅ Working by design | HARD RULE 1 prevents hallucination; empty context → honest "I don't have that" |
| 4b — Handler (actual path) | `MealsReadHandler.handleRead(scope=list)` | ✅ Working | Returns all meals correctly; but returns the wrong thing for a search intent |

---

## Root Cause

**The search intent is never resolved.** `"Find me a chicken curry recipe"` is the
most natural English form of a recipe search request, but neither specific MEALS_MATCHERS
pattern covers the `find me a [food] recipe` word order (noun-last). The keyword
fallback activates instead, producing a list read. INT25's `handleSearch` work is
unreachable from this utterance.

---

## What is Needed to Fix (not implemented here)

1. **F1 — Add a noun-last pattern to MEALS_MATCHERS** (pattern-intent-resolver.ts):
   ```
   "find me a [food] recipe" / "show me a [food] recipe" / "I want a [food] recipe"
   /\b(?:find|show|give)\s+(?:me\s+)?(?:a\s+)?(.+?)\s+recipe\b/i
   → verb: "search", parameters: { query: captured-group }
   ```
   Also consider: "I want to cook X", "something with X", "what can I make with X".

2. **F2 — System meal coverage** (data / ops concern, not a code bug):
   Chicken curry (and other common meal types) should be seeded as system meals so
   that search returns at least one result for common queries, even before a user
   imports anything.

3. **F3 — Informative fallback when search returns 0 results** (LLM prompt or
   gateway logic): When `mealCount === 0` the assistant could say _"I don't have a
   chicken curry in your meal library yet — try importing one from the recipe search
   page."_ rather than the generic "I don't have that information."

---

## Files Referenced

| File | Role |
|---|---|
| `client/src/components/conversation/FloatingAssistant.tsx` | UI — POST /api/intelligence/conversation/turn |
| `server/routes.ts` | API endpoint registration |
| `server/intelligence/conversation/conversation-gateway.ts` | Orchestration: write-guard → resolver → platform → LLM |
| `server/intelligence/pattern-intent-resolver.ts` | **F1 root cause**: MEALS_MATCHERS + keyword fallback |
| `server/intelligence/handlers/meals-read-handler.ts` | Handler: handleSearch + handleRead |
| `server/intelligence/bindings/meals.ts` | Binding: MEALS_EXECUTABLE_INTENTS = ["read","search"] |
| `server/intelligence/handlers/meals-read-port.ts` | Port: getMeals(userId) + getSystemMeals() |
