# INT21 — Conversation Gateway Capability Convergence

**Status:** Complete  
**Date:** 2026-07-01  
**Parent investigation:** INT20 (`INT20_GATEWAY_CAPABILITY_COVERAGE_AUDIT.md`)  
**Files changed:** `server/intelligence/conversation/conversation-gateway.ts`, `server/tests/test-intelligence-conversation-gateway.ts`  
**Tests:** 91/91 gateway suite (862/862 across all 17 suites)

---

## What was done

Three targeted fixes to `conversation-gateway.ts` implementing all INT20 findings that
were within scope (no schema, no UI, no voice).

---

## Fix 1 — RC-1: `buildCapabilityParams` missing 5 cases

**Before:** `shopping`, `household`, `partners`, `templates`, and `analyser` all fell
through to `default: return {}`. Every one of their handlers requires an explicit `scope`
parameter and throws a gap on `{}`, so `queryCapability` always returned `null` for all
five — no data was ever assembled for the LLM.

**After:** Five new cases added to the switch:

```ts
case "shopping":  return { scope: "list" };
case "household": return { scope: "household" };
case "partners":  return { scope: "retailers" };
case "templates": return { scope: "plan-templates" };
case "analyser":  return { scope: "additives" };
```

These are the handler-documented default scopes for each capability and match the
single/primary safe stored-read each binding exposes.

---

## Fix 2 — RC-2: `nutrition-knowledge` fallback scope mismatch

**Before:** When `frame.currentFoodSlug` was null (i.e. on any surface other than a
food-detail page), the gateway sent `{ scope: "list-foods" }`. The handler's switch has
`case "foods"` — not `"list-foods"`. The unmatched string hit the default branch and
threw a gap on every non-food-detail context.

**After:** Fallback changed to `{ scope: "foods" }` — matching the handler's enum exactly.

```ts
case "nutrition-knowledge":
  if (frame.currentFoodSlug) return { scope: "food", slug: frame.currentFoodSlug };
  return { scope: "foods" };   // was: "list-foods"
```

---

## Fix 3 — RC-3: Keyword routing for four previously-unroutable capabilities

**Before:** `nutrition-knowledge`, `templates`, `analyser`, and `partners` had no keyword
patterns in `selectCapabilities`. They were unreachable from the `floating` or `voice`
surface regardless of what the user typed — the cap was only selected when the user's
current surface was the exact matching named surface.

**After:** Four keyword patterns added to the routing block:

```ts
if (/\b(nutrients?|vitamins?|minerals?|nutrition|nutritional|benefit)\b/.test(l))
  caps.add("nutrition-knowledge");

if (/\b(template|templates)\b/.test(l))
  caps.add("templates");

if (/\b(additive|additives|e.?number|upf|ultra.processed|nova)\b/.test(l))
  caps.add("analyser");

if (/\b(retailer|retailers|supermarket|supermarkets)\b/.test(l))
  caps.add("partners");
```

Pattern design notes:
- `vitamins?` / `nutrients?` / `minerals?` — `?` makes the `s` optional, matching both
  singular and plural without a word-boundary break (the bug that caused the one test
  failure caught during the run).
- `e.?number` — matches "E number" and "E-number".
- `ultra.processed` — matches "ultra-processed" and "ultra processed".
- `retailer(s)` / `supermarket(s)` — specific enough to avoid colliding with `shop`
  (already routing to `shopping`) or `store` (too generic).
- The existing 4-cap hard limit is preserved; `Array.from(caps).slice(0, 4)` still applies.

---

## Scope not addressed (intentional)

| INT20 finding | Reason not implemented here |
|---|---|
| RC-4: Planner single-week limit / Diary today-only | Intentional Phase 1 limits — need assembler date-NLP and handler range scopes; out of scope for this task |
| RC-5: Meals `scope:"list"` token cost | `scope:"summary"` exists but the gateway has no signal for when to prefer it; optimization for a later task |
| RC-6: `selectedMealId` never forwarded | The meals handler's `detail` scope is available but requires a deliberate routing decision; left for a future task |

---

## Capability status after INT21

| Capability | Status |
|---|---|
| profile | ✅ Works (unchanged) |
| planner | ✅ Works (unchanged) |
| pantry | ✅ Works (unchanged) |
| diary | ✅ Today only (unchanged — intentional Phase 1 limit) |
| meals | ✅ Works (unchanged) |
| nutrition-knowledge | ✅ Works — food-detail context returns food detail; any other context returns foods list; also now keyword-reachable from floating surface |
| shopping | ✅ Works — RC-1 fix |
| household | ✅ Works — RC-1 fix |
| partners | ✅ Works — RC-1 fix + RC-3 keyword |
| templates | ✅ Works — RC-1 fix + RC-3 keyword |
| analyser | ✅ Works — RC-1 fix + RC-3 keyword |
