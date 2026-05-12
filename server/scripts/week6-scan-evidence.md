# Week 6 Planner Scan — Runtime Evidence Report

**Date**: 2026-05-12  
**Image**: `server/test-assets/vision-real/week6.jpeg` (276,254 bytes)  
**Mode**: `planner`  
**Script**: `server/scripts/test-scan-live.ts`

---

## Log Coverage — Code Paths

All four `extractDestination` return paths now emit `[planner-scan-debug]` logs
(dev-only) with both count summary and returned object shape:

| Path | Logs emitted |
|---|---|
| vision-SUCCESS | `extractDestination-vision-SUCCESS`, `extractDestination-vision-returned` |
| vision-NULL → OCR | `extractDestination-vision-NULL` |
| ocr-ai-SUCCESS | `extractDestination-ocr-ai-SUCCESS`, `extractDestination-ocr-ai-returned` |
| heuristic-FALLBACK | `extractDestination-heuristic-FALLBACK`, `extractDestination-heuristic-returned` |

The `route-final` log at `/api/scan` before `res.json()` is exercised via the HTTP
endpoint (not the direct `extractDestination` test script). Its log line reads:
```
[planner-scan-debug] route-final scanId=<id> meals=N meal_ideas=N shoppingItems=N parsedBy=vision confidence=high
```
It uses properly narrowed `ScannedMealCandidate[]` — no `any` casts.

---

## Raw Log Output

```
[test] imagePath=server/test-assets/vision-real/week6.jpeg mode=planner imageBytes=276254 OPENAI_API_KEY=true
[scan-timing] vision-attempt mode=planner imageBytes=276254
[scan-timing] vision-planner duration=11380ms promptTokens=26824 completionTokens=647
[planner-scan-debug] vision-api-response mode=planner finish_reason=stop completionTokens=647/2000 hitLimit=false
[planner-scan-debug] vision-raw-response mode=planner rawChars=2434
[planner-scan-debug] vision-pre-validation rawMeals=6 rawMealIdeas=0 rawShoppingItems=0 finish_reason=stop
[planner-scan-debug] vision-post-validation validatedMeals=6 validatedMealIdeas=0 validatedShoppingItems=0
[scan-timing] vision-success mode=planner confidence=high elapsed=11730ms
[planner-scan-debug] extractDestination-vision-SUCCESS meals=6 meal_ideas=0 shoppingItems=0 confidence=high
[test] elapsed=11730ms parsedBy=vision confidence=high
[test] rawTextChars=269
[test] warnings=[]
[test] PLANNER total_meals=6 scheduled=6 meal_ideas=0 shoppingItems=0
[test] --- SCHEDULED MEALS ---
[meal] day=null slot=null type=scheduled conf=high label="Beef casserole"
[meal] day=null slot=null type=scheduled conf=high label="Chicken noodles"
[meal] day=null slot=null type=scheduled conf=high label="Fish cakes"
[meal] day=null slot=null type=scheduled conf=high label="Veg-fried-rice"
[meal] day=null slot=null type=scheduled conf=high label="Pork-mince-bake"
[meal] day=null slot=null type=scheduled conf=high label="Roast chicken"
```

---

## Scenario A–G Verdict

| Scenario | Question | Answer |
|---|---|---|
| A | Did the AI never extract lunch ideas / shopping items? | **YES — confirmed root cause** |
| B | Did the JSON parse fail due to truncation? | NO — parse succeeded |
| C | Did the OCR fallback run? | NO — vision path succeeded (`parsedBy=vision`) |
| D | Did the heuristic run? | NO — only vision path ran |
| E | Did the client mis-render the data? | NO — client was not reached; server returned 0 items |
| F | Did the token limit cause truncation? | **NO — disproved.** `finish_reason=stop`, `completionTokens=647/2000` |
| G | Did validation strip the items post-parse? | NO — pre/post validation counts are identical (6 meals, 0 ideas, 0 shopping) |

---

## Key Measurements

| Metric | Value |
|---|---|
| `finish_reason` | `stop` (not `length`) |
| `completionTokens` | 647 out of 2000 |
| `rawChars` (full response string) | 2,434 |
| `rawTextChars` (transcription field) | 269 — suspiciously short for a dense planner image |
| `parsedBy` | `vision` (not OCR fallback) |
| `confidence` | `high` |
| `rawMeals` (pre-validation) | 6 |
| `rawMealIdeas` (pre-validation) | 0 |
| `rawShoppingItems` (pre-validation) | 0 |
| All 6 meal `day` fields | `null` — Week 6 format uses week-number labels, not weekday names |

---

## Confirmed Failure Point

**Scenario A: The AI (gpt-4o-mini vision) processes the full Week 6 image without
any token truncation but only extracts 6 scheduled meals — zero lunch ideas and
zero shopping items.**

The model completed cleanly (`finish_reason=stop`) using only 647 of 2000 available
tokens. Pre-validation and post-validation counts are identical, ruling out the
validation step. The vision path succeeded, ruling out OCR / heuristic fallback.

The `rawText` transcription field contains only 269 characters despite the image
being a 276 KB densely-written planner. This strongly suggests the model is
under-transcribing the image — it is not faithfully reading all visible sections
(lunch ideas list, shopping section, handwritten context) before producing its
structured output.

---

## Impact on Task #7

Task #7 was planned as a **token-budget / `finish_reason` fix** (raise `max_tokens`
from 2000 → 4096 for planner mode and add `finish_reason` length detection).

The runtime evidence shows this alone will NOT fix the Week 6 failure because:
- The current 2000-token limit is not being hit (`completionTokens=647`)
- The model is choosing not to extract the missing sections, not running out of room

**Task #7's plan needs to be revised** to target prompt quality and AI extraction
depth as the primary fix. Raising the token budget to 4096 remains a reasonable
safety precaution for larger/more complex planner images, but a new or amended
prompt instruction is the essential fix for the scenario-A failure.

---

## Recommended Scoped Next Fix (for Task #7 revision)

1. Strengthen the planner prompt to explicitly enumerate every visual section the
   model must inspect (scheduled meals grid, lunch/ideas lists, shopping/notes areas,
   handwritten annotations) and require an entry for each distinct section found.
2. Add a `finish_reason=length` guard that logs `PLANNER_TRUNCATION_WARNING` and
   optionally retries with a higher token limit — still valuable as a safety net.
3. The token budget raise to 4096 can be kept as a secondary precaution.
