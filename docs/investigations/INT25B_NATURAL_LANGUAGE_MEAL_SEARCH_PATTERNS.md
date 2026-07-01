# INT25B — Natural-Language Meal Search Patterns: Implementation Report

**Date:** 2026-07-01  
**Status:** Complete  
**Scope:** `server/intelligence/pattern-intent-resolver.ts` — three new patterns added to `MEALS_MATCHERS`. No handler, binding, schema, UI, or gateway changes.

---

## 1. Problem (from INT25A F1)

The resolver's two existing MEALS_MATCHERS covered only:
- `"find me a recipe for X"` — recipe-first word order
- `"search for / look up X recipe"` — `search for` / `look up` as leading verb

The most common natural-English phrasing — food noun first, "recipe" at the end —
was not matched. Those queries fell through to the keyword fallback (confidence
0.55) which silently produced `verb: "read", scope: "list"` instead of
`verb: "search", query: "<food>"`, bypassing `handleSearch` entirely.

---

## 2. Patterns Added

Three new matchers appended to `MEALS_MATCHERS` in
`server/intelligence/pattern-intent-resolver.ts`:

### Pattern 3 — Noun-last recipe (confidence 0.83)

```
/\b(?:(?:find|show|give)\s+me\s+(?:a\s+)?|i\s+want\s+(?:a\s+)?)(.+?)\s+recipe\b/i
```

Covers:
| Utterance | Query extracted |
|---|---|
| `"Find me a chicken curry recipe"` | `chicken curry` |
| `"Show me a pasta recipe"` | `pasta` |
| `"Give me a fish pie recipe"` | `fish pie` |
| `"I want a fish pie recipe"` | `fish pie` |

Confidence 0.83 — higher than Pattern 2 (0.82, `search for/look up`) because the
word "recipe" anchors it unambiguously. Lower than Pattern 1 (0.85, `find me a
recipe for X`) which has "recipe" on both sides of the food term.

### Pattern 4 — Cook-with / make-with (confidence 0.82)

```
/\bwhat\s+can\s+i\s+(?:cook|make|do|prepare)\s+with\s+(.+?)[\?.]?\s*$/i
```

Covers:
| Utterance | Query extracted |
|---|---|
| `"What can I cook with chickpeas?"` | `chickpeas` |
| `"What can I make with salmon?"` | `salmon` |
| `"What can I do with leftover lentils?"` | `leftover lentils` |
| `"What can I prepare with sweet potato?"` | `sweet potato` |

### Pattern 5 — Something-with (confidence 0.78)

```
/\b(?:(?:give|show)\s+me\s+)?something\s+(?:made\s+)?with\s+(.+?)[\?.]?\s*$/i
```

Covers:
| Utterance | Query extracted |
|---|---|
| `"Give me something with salmon"` | `salmon` |
| `"Show me something with chickpeas"` | `chickpeas` |
| `"Something with tofu"` | `tofu` |
| `"Something made with lentils"` | `lentils` |

Confidence 0.78 — lowest of the meal matchers, reflecting more ambiguous phrasing
(no "recipe" anchor word). Still well above the keyword fallback (0.55) so it
takes precedence.

---

## 3. Confidence Ordering (MEALS_MATCHERS after INT25B)

| # | Pattern | Example | Confidence |
|---|---|---|---|
| 1 | `find me a recipe for X` | "find me a recipe for chicken curry" | 0.85 |
| 2 | `search for / look up X recipe\|dish\|meal` | "search for a pasta recipe" | 0.82 |
| 3 | `find\|show\|give me a X recipe` / `I want a X recipe` (INT25B) | "find me a chicken curry recipe" | 0.83 |
| 4 | `what can I cook\|make with X` (INT25B) | "what can I cook with chickpeas?" | 0.82 |
| 5 | `something with X` (INT25B) | "give me something with salmon" | 0.78 |
| — | keyword fallback (`recipe\|cook\|dish`) | (anything else with "recipe") | 0.55 |

---

## 4. Files Changed

| File | Change |
|---|---|
| `server/intelligence/pattern-intent-resolver.ts` | 3 new matchers added to `MEALS_MATCHERS` (Patterns 3, 4, 5) |
| `server/tests/test-intent-resolver.ts` | 15 new assertions added — one `hasCapability`, `verb === "search"`, and `query` check per phrase |

---

## 5. Test Results

```
INT24 — Canonical Intent Resolver (PatternIntentResolver) tests
Passed: 125  Failed: 0
All tests passed ✓
```

All 15 new assertions pass. All 109 pre-existing assertions continue to pass.

---

## 6. Remaining Open Items (not in scope for INT25B)

| Ref | Item |
|---|---|
| INT25A F2 | Data coverage: search returns 0 results if user has no matching meal and no system meal matches |
| INT25A F3 | Grounding UX: when `mealCount === 0` the assistant says "I don't have that information" with no guidance |
