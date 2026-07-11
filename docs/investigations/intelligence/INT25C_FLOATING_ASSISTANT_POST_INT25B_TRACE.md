# INT25C — Floating Assistant: Post-INT25B Trace Investigation

**Date:** 2026-07-01  
**Status:** Investigation complete. No implementation performed.  
**Phrases traced:**
1. "Find me a chicken curry recipe"
2. "Show me a pasta recipe"
3. "I want a fish pie recipe"
4. "What can I cook with chickpeas?"
5. "Give me something with salmon"

---

## Executive Summary

After INT25B the intent resolver is **no longer the failing layer** — all five phrases now correctly produce `verb: "search"` with accurate query extraction. The pipeline executes without error through all five layers. The **first failing layer is Layer 4 — Data Coverage**: `handleSearch` returns `{ mealCount: 0, meals: [] }` for every query because the user's personal meal library is empty (or contains no matching meals) and no system meals are seeded with recipe content. The LLM then correctly applies its hard constraint ("answer only from context data") and responds with a non-answer. This is not a code bug — it is a scope mismatch between what the user expects (any recipe from anywhere) and what the search capability provides (meals already saved in the personal library + system meals).

---

## Layer-by-layer trace — all five phrases

### Layer 1 — FloatingAssistant.tsx

**Status: ✅ Passing for all five phrases.**

```
POST /api/intelligence/conversation/turn
{ utterance: "<phrase>", surface: "floating", surfaceHints: {} }
```

No issue. The UI sends the correct payload to the correct endpoint.

---

### Layer 2 — Route + ConversationGateway setup

**Status: ✅ Passing for all five phrases.**

`server/routes.ts:11237` calls `conversationGateway.processUserTurn(user.id, utterance, surface, surfaceHints, intelligencePlatform.contextFor(user))`.

`intelligencePlatform.contextFor(user)` → `resolveContext(user)` (permissions.ts:36):
```typescript
{ role: "user", userId: String(user.id), premium: bool }
```

`detectWriteIntent` (conversation-gateway.ts:110) — regex scan of all five phrases:

| Phrase | Write-intent pattern hit? |
|---|---|
| "Find me a chicken curry recipe" | ✗ None |
| "Show me a pasta recipe" | ✗ None |
| "I want a fish pie recipe" | ✗ None |
| "What can I cook with chickpeas?" | ✗ None (`cook` alone does not match any write guard) |
| "Give me something with salmon" | ✗ None |

All five pass through to the intent resolver. No early exit.

---

### Layer 3 — PatternIntentResolver (INT24 / INT25B)

**Status: ✅ FIXED by INT25B — passing for all five phrases.**

**SURFACE_CAP["floating"]** is `undefined` — "floating" is not a surface key in `SURFACE_CAP` (the map covers planner, shopping, nutrition, pantry, diary, household, meals, templates, partners, analyser). Step 2 (surface-based primary) adds nothing.

**MAX_INTENTS = 4.** Profile is always appended at confidence 0.50.

Resolved intents per phrase (after dedupe by capability, sorted descending):

#### "Find me a chicken curry recipe"
| Step | Source | Capability | Verb | Parameters | Confidence |
|---|---|---|---|---|---|
| 1 | Pattern 3 (MEALS_MATCHERS) | meals | search | `{ query: "chicken curry" }` | 0.83 |
| 3 | Keyword fallback (`/recipe/`) | meals | read | `{ scope: "list" }` | 0.55 |
| 4 | Profile always-include | profile | read | `{}` | 0.50 |

After dedupe (meals: 0.83 beats 0.55): `[meals/search/chicken curry (0.83), profile/read (0.50)]`

**Pattern 3** regex: `/\b(?:(?:find|show|give)\s+me\s+(?:a\s+)?|i\s+want\s+(?:a\s+)?)(.+?)\s+recipe\b/i`
- `"find me a "` → matches `find\s+me\s+(?:a\s+)?`
- `"chicken curry"` → captured group `(.+?)`
- `" recipe"` → matches `\s+recipe\b`
- Query extracted: `"chicken curry"` ✓

#### "Show me a pasta recipe"
After dedupe: `[meals/search/pasta (0.83), profile/read (0.50)]`

`"show me a "` → matches `show\s+me\s+(?:a\s+)?` → query: `"pasta"` ✓

#### "I want a fish pie recipe"
After dedupe: `[meals/search/fish pie (0.83), profile/read (0.50)]`

`"i want a "` → matches `i\s+want\s+(?:a\s+)?` → query: `"fish pie"` ✓

#### "What can I cook with chickpeas?"
After dedupe: `[meals/search/chickpeas (0.82), profile/read (0.50)]`

**Pattern 4** regex: `/\bwhat\s+can\s+i\s+(?:cook|make|do|prepare)\s+with\s+(.+?)[\?.]?\s*$/i`
Keyword fallback (`/recipe|cook|dish|ingredient/`) also fires on "cook" (0.55) — deduped out.
Query extracted: `"chickpeas"` ✓

#### "Give me something with salmon"
After dedupe: `[meals/search/salmon (0.78), profile/read (0.50)]`

**Pattern 5** regex: `/\b(?:(?:give|show)\s+me\s+)?something\s+(?:made\s+)?with\s+(.+?)[\?.]?\s*$/i`
`"give me "` → optional prefix matches → `"something with salmon"` → query: `"salmon"` ✓

**No gap field** is set on any of these resolved intents. The gateway's `resolvedIntents.filter(ri => !ri.gap)` passes all of them through. Intent resolution is **no longer the failing layer** after INT25B.

---

### Layer 4 — intelligencePlatform.handle → MealsReadHandler.handleSearch

**Status: ❌ FIRST FAILING LAYER — data coverage.**

`queryCapability` (conversation-gateway.ts:146) calls:
```typescript
intelligencePlatform.handle(
  { verb: "search", capabilityId: "meals", parameters: { query: "<food>" } },
  identity,   // { role: "user", userId: "42", premium: false }
)
```

Inside the handler:

**`requireUserId`** (\_read-kit.ts:61):
```typescript
const userId = toInt(context.userId);   // toInt("42") → 42 (number) ✓
```
`userId: string → number` conversion is correct. No issue here.

**`readOnlyVerbGuard`**: verb is "search", executableVerbs is `["read","search"]` → passes ✓

**`handleSearch`** (meals-read-handler.ts:266):
```typescript
const [own, system] = await Promise.all([
  port.getMeals(userId),      // user's personal meal library
  port.getSystemMeals(),      // system meals (isSystemMeal = true)
]);
```

| Source | What it returns |
|---|---|
| `getMeals(userId)` | Meals the user has manually created or imported into their personal library. For a new or typical user who hasn't imported chicken curry / pasta / fish pie / chickpeas-containing / salmon-containing meals: **0 matching rows** or rows that don't match the query term. |
| `getSystemMeals()` | Rows where `isSystemMeal = true` in the DB. These are admin-seeded meals. In the current database there are **no system meals seeded with recipe content** matching these common food queries. The Global Meal Library Import (OpenFoodFacts) imports packaged product data, not recipe content. |

The merged set contains no meals whose `name` or `ingredients[]` contains the query term as a substring (case-insensitive).

`matchesMealQuery` returns `false` for all merged rows. `matches = []`.

**Handler returns for all five phrases:**
```json
{
  "scope": "search",
  "query": "<food>",
  "mealCount": 0,
  "meals": [],
  "source": "meals"
}
```

**`intelligencePlatform.handle` outcome:**
```
{ status: "ok", result: { scope: "search", mealCount: 0, meals: [] ... } }
```

**`queryCapability` return:**
`outcome.status === "ok"` AND `outcome.result != null` → returns the JSON string (not null).
The gateway does NOT treat an empty result as a failure — it passes the JSON into the context.

---

### Layer 5 — LLM grounding

**Status: ✅ Working correctly by design — but produces an unhelpful response.**

The gateway assembles this system prompt context section:

```
CONTEXT DATA:
### meals
{"scope":"search","query":"chicken curry","mealCount":0,"meals":[],"source":"meals"}

### profile
{ ...user profile fields... }
```

HARD RULES in the system prompt:
> 1. Answer ONLY from the CONTEXT DATA provided below. Never invent, hallucinate, or assume facts not present in the context.  
> 3. If the context does not contain the answer, say "I don't have that information right now" — never guess.

The LLM sees `mealCount: 0` and `meals: []`. It cannot suggest a chicken curry recipe because none exists in context. It cannot fabricate one per Rule 1. It correctly applies Rule 3.

**Typical LLM response:** _"I searched your meal library for 'chicken curry' but didn't find any matching recipes. You don't currently have a chicken curry saved in your meal library."_

This response is **technically correct** but fails the user's expectation. The user asked for a recipe; the assistant correctly reports it cannot provide one from the available data.

---

### Layer 1 (API response) — Final

**Status: ✅ Passing.**

`result.text` from the gateway is returned as `{ text: "...", entityRefs: [] }`. The Floating Assistant renders it. No UI error, no 500, no blank response — just an unhelpful but structurally correct answer.

---

## Failure summary

| Layer | Component | Status | Detail |
|---|---|---|---|
| 1 — UI | `FloatingAssistant.tsx` | ✅ | Correct payload to correct endpoint |
| 2 — Gateway setup | `ConversationGateway` | ✅ | Write-guard passes; context assembled |
| 3 — Intent resolver | `PatternIntentResolver` | ✅ **FIXED by INT25B** | All five → `meals/search/<query>` |
| **4 — Handler** | **`handleSearch`** | **❌ F2 — FIRST FAILING LAYER** | `getMeals` + `getSystemMeals` return no matches; `mealCount: 0` |
| 5 — LLM | `buildGroundedResponse` | ✅ by design | Hard rules prevent fabrication; empty context → non-answer |

---

## Root cause

The search capability is **bounded to two data sources**:
1. `getMeals(userId)` — the user's personal saved/imported meals.
2. `getSystemMeals()` — admin-seeded system meals (currently empty for recipe content).

Neither source contains the queried recipes for a typical user. This is not a code defect — the code executes correctly end-to-end. It is a **scope mismatch**: the user expects the assistant to act as an external recipe search engine; the platform's search capability is a library index of already-saved meals.

---

## What would fix it (not in scope here)

| # | Fix | Layer | Description |
|---|---|---|---|
| F2a | Seed system meals | Data / ops | Import common recipes (chicken curry, pasta, fish pie, etc.) as `isSystemMeal = true` rows so `getSystemMeals()` returns content for common queries. |
| F2b | External recipe search | New capability | Add a new `recipe-search` capability that queries TheMealDB / BBC Good Food APIs at query time — separate from the personal meal library search. |
| F3 | Informative gap message | LLM prompt / gateway | When `mealCount === 0`, prompt the LLM to direct the user to the recipe search import page rather than giving a bare "I don't have that information." |

---

## Files referenced

| File | Role |
|---|---|
| `client/src/components/conversation/FloatingAssistant.tsx` | Layer 1 — UI |
| `server/routes.ts:11215` | Layer 2 — POST /api/intelligence/conversation/turn |
| `server/intelligence/conversation/conversation-gateway.ts` | Layer 2/5 — gateway + LLM grounding |
| `server/intelligence/pattern-intent-resolver.ts` | Layer 3 — MEALS_MATCHERS, SURFACE_CAP, KEYWORD_FALLBACKS |
| `server/intelligence/intent-resolver.ts` | Layer 3 — ResolvedIntent interface (gap field) |
| `server/intelligence/intelligence-platform.ts` | Layer 4 — contextFor, handle |
| `server/intelligence/permissions.ts` | Layer 2 — resolveContext (userId: String) |
| `server/intelligence/handlers/_read-kit.ts` | Layer 4 — requireUserId (String→number via toInt) |
| `server/intelligence/handlers/meals-read-handler.ts` | Layer 4 — handleSearch |
| `server/intelligence/handlers/meals-read-port.ts` | Layer 4 — getMeals / getSystemMeals |
