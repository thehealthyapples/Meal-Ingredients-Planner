---
name: INT33 Compound Matchers
description: How cross-domain questions are handled in PatternIntentResolver; pitfalls found during implementation.
---

## The rule
Cross-domain questions ("what high-protein meals do I have planned?") are handled by a `CompoundMatcher` type that runs as **step 0** in `PatternIntentResolver.resolve()`, before single-domain matchers. Each compound matcher returns 2–3 `ResolvedIntent[]` items targeting DISTINCT capabilities, or null. Intents enter the shared deduplication pool — single-domain matchers at higher confidence will override compound intents for the same capability.

**Why:** The gateway already executes all resolved intents in parallel via `Promise.all`. No changes to the gateway, platform, engine, or bindings are needed — compound matching is purely a resolver concern.

**How to apply:** Add new `CompoundMatcher` constants before `ALL_COMPOUND_MATCHERS` in `pattern-intent-resolver.ts`. Confidence range: 0.80–0.88 (below single-domain tops 0.88–0.92). Declare DISTINCT capabilities only.

## Classic pitfalls

1. **Capital `I` in patterns** — compound matchers receive `lower` (lowercased utterance). Any `\bI\b` in a regex pattern will silently never match. Always write `\bi\b` or `\bcan\s+i\s+` etc.

2. **Plural forms** — `\bingredient\b` fails to match "ingredients" because the word boundary after "ingredient" disappears when "s" follows. Always write `ingredients?`.

3. **Proper name detection via regex alternation** — the pattern `([A-Z][a-z]+)\s+(?:can|eat|have)` matches "What have" (capturing "What") before it reaches the intended "can Lilly". Solved by `extractPersonName()`: skips the first word of the sentence, iterates remaining words, returns the first that matches `[A-Z][a-z]{2,}` AND is NOT in `EXCLUDED_CAPITALIZED_WORDS`.

4. **Profile displacement** — `MAX_INTENTS = 4`. Utterances that fire the compound matcher AND 3+ single-domain matchers (e.g. "Do I have the ingredients for this week's meals?") fill all 4 slots before profile (0.50). This is expected. Don't write tests asserting profile is always present for compound utterances with high intent density.

5. **Deduplication overrides compound** — single-domain matchers at 0.88–0.92 beat compound intents at 0.80–0.87 for the SAME capability. Tests should assert BOTH capabilities are present, not assert the compound confidence won.
