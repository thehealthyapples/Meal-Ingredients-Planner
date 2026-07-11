# INT22 — Nutrition Conversation Grounding Investigation

**Date:** 2026-07-01  
**Status:** Complete — root cause identified, no implementation made  
**Scope:** Why conversational nutrition questions return honest gaps instead of grounded answers

---

## Questions Under Investigation

| Question | Expected | Actual |
|---|---|---|
| *"What is broccoli good for?"* | Broccoli's linked health benefits from the knowledge registry | "I don't have that information right now" |
| *"Tell me 5 foods that help with sleep"* | Foods linked to a sleep/rest benefit from the registry | "I don't have that information right now" |

---

## Trace Architecture

```
User utterance
      ↓
Conversation Gateway — selectCapabilities()     ← Layer 1
      ↓
Conversation Gateway — buildCapabilityParams()  ← Layer 2  ★ PRIMARY GAP
      ↓
Conversation Gateway — queryCapability()        ← Layer 3  (structural gap)
      ↓
Nutrition-Knowledge Handler                     ← Layer 4  (correct)
      ↓
Nutrition Knowledge Registry                    ← Layer 5  (correct)
      ↓
LLM (gpt-4o-mini, grounded system prompt)       ← Layer 6  (correct)
```

---

## Layer-by-Layer Findings

### Layer 1 — `selectCapabilities()` (conversation-gateway.ts ~line 160)

The keyword pattern that adds `nutrition-knowledge` to the selected capability set is:

```ts
if (/\b(nutrients?|vitamins?|minerals?|nutrition|nutritional|benefit)\b/.test(l))
    caps.add("nutrition-knowledge");
```

Neither test question contains any of those words.

- *"What is broccoli good for?"* — no match → `nutrition-knowledge` not selected
- *"Tell me 5 foods that help with sleep"* — "sleep" matches the **diary** keyword instead, adding `diary` (irrelevant to the question)

**If the user is on any surface other than `nutrition`** (e.g. floating, planner, diary), the capability is not selected and no nutrition data reaches the prompt at all.

**If the surface IS `nutrition`**, it is auto-included via the `SURFACE_CAP` map. Execution continues to Layer 2.

---

### Layer 2 — `buildCapabilityParams()` ← PRIMARY GAP (conversation-gateway.ts ~line 194)

Even when `nutrition-knowledge` is selected, the gateway builds its parameters with a single fixed code path:

```ts
case "nutrition-knowledge":
  if (frame.currentFoodSlug) return { scope: "food", slug: frame.currentFoodSlug };
  return { scope: "foods" };
```

`currentFoodSlug` is populated only when the user has navigated to a specific food detail page in the Pantry Explore UI (a `SurfaceHint` the UI must explicitly pass in). In a free-text conversation it is always `null`.

**Result:** the gateway always sends `{ verb: "read", scope: "foods" }`, which retrieves a flat list of every food's name and category — no benefit descriptions, no nutrient links, no reverse lookups. Example payload:

```json
{
  "scope": "foods",
  "category": null,
  "foodCount": 47,
  "foods": [
    { "slug": "broccoli", "name": "Broccoli", "category": "Vegetables" },
    ...
  ]
}
```

There is no broccoli benefit data. There is no sleep-linked food list. The handler returns valid data — just not the data that answers the question.

---

### Layer 3 — `queryCapability()` — structural gap (conversation-gateway.ts ~line 231)

The gateway hardcodes `verb: "read"` for every capability call:

```ts
const outcome = await intelligencePlatform.handle(
  { verb: "read", capabilityId: capId, parameters: params },
  frame.identity,
);
```

The `nutrition-knowledge` handler registers **three** executable verbs: `read`, `search`, and `explain`. The verbs designed for conversational nutrition questions are never reached:

| Verb | What it does | Called by gateway? |
|---|---|---|
| `read` (scope: `foods`) | Returns flat food name list | ✅ Always |
| `search` `{ query: "broccoli" }` | Finds broccoli by name, returns its slug | ❌ Never |
| `explain` `{ foodSlug: "broccoli" }` | Returns all source-gated benefits for broccoli | ❌ Never |
| `read` (scope: `benefit`, slug: `sleep`) | Returns all foods linked to a sleep benefit | ❌ Never |

The `search` and `explain` verbs are wired, executable, and tested — the gateway simply has no code path that selects them.

---

### Layer 4 — Nutrition-Knowledge Handler (nutrition-knowledge-read-handler.ts)

**No gap here.** The handler is correct. Given `{ verb: "read", scope: "foods" }` it legitimately returns a food-name list. Given `{ verb: "explain", foodSlug: "broccoli" }` it would correctly return all of broccoli's source-gated benefits. Given `{ verb: "read", scope: "benefit", slug: "sleep" }` it would correctly return all foods linked to that benefit. The handler has all the right machinery — it is never called with the right arguments.

---

### Layer 5 — Nutrition Knowledge Registry (nutrition-knowledge-registry.ts)

**No gap here.** `getFoodDetailView("broccoli")`, `getFoodBenefitsForDisplay("broccoli")`, and `getFoodsForBenefit("sleep")` exist, are read-only, and would return correct data if called. The registry is the correct source of truth.

---

### Layer 6 — LLM / System Prompt

**No gap here.** The system prompt enforces:

> *"Answer ONLY from the CONTEXT DATA provided below. If the context does not contain the answer, say 'I don't have that information right now'."*

The LLM receives a flat food-name list, finds no benefit or sleep data in it, and honestly says it cannot answer. The LLM is behaving correctly — it is faithfully honouring the grounding constraint and not hallucinating.

---

## Root Cause

Information is lost at **Layer 2 — `buildCapabilityParams()`**, compounded by **Layer 3 — the hardcoded `verb: "read"`**.

### Gap A — No utterance-driven parameter resolution

`buildCapabilityParams()` has only one code path for `nutrition-knowledge`: return either a specific food slug (only when `currentFoodSlug` is set from the UI surface) or a generic food list. It has no mechanism to:

- Extract a food name from the utterance ("broccoli") and translate it to a slug via `search`
- Extract a benefit concept from the utterance ("sleep", "energy", "immunity") and query foods by benefit
- Route to the `explain` verb for benefit-level explanations

### Gap B — `search` and `explain` verbs are never invoked by the gateway

The gateway always uses `verb: "read"`. `search` and `explain` — the verbs designed for conversational queries — are unreachable from any gateway code path regardless of what the user asks.

### Gap C — Keyword selection misses common food/benefit vocabulary (secondary)

The keyword pattern for selecting `nutrition-knowledge` does not cover food names, benefit concepts ("sleep", "energy", "immunity", "digestion"), or natural language phrasings like "good for", "help with", "foods that". This causes the capability to be skipped entirely on non-nutrition surfaces.

---

## What Is Working Correctly

- The handler's `search`, `explain`, and `read` (by slug) verbs are fully implemented and source-gated
- The registry's reverse lookups (`getFoodsForBenefit`, `getFoodBenefitsForDisplay`) exist and are correct
- The LLM's honest-gap behaviour is correct and should be preserved
- The `currentFoodSlug` path works correctly when navigating the Pantry Explore food detail pages

---

## Files Involved

| File | Role | Gap? |
|---|---|---|
| `server/intelligence/conversation/conversation-gateway.ts` | Capability selection, parameter building, verb selection | ✅ Primary gap location |
| `server/intelligence/conversation/context-frame-assembler.ts` | Populates `currentFoodSlug` from surface hints | Indirect — slug only set by UI navigation |
| `server/intelligence/handlers/nutrition-knowledge-read-handler.ts` | Executes read / search / explain | No gap |
| `server/intelligence/handlers/nutrition-knowledge-read-port.ts` | Port to registry | No gap |
| `server/services/nutrition-knowledge-registry.ts` | Knowledge data layer | No gap |
