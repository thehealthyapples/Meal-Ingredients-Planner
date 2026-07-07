# FI1C — Runtime Food Intelligence Activation

**Date:** 2026-07-06
**Branch:** `int1-intelligence-platform`
**Status:** Implemented and verified (deterministic test tier). Benchmark-visible gap remains — see §5.
**Governing architecture:** `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (Food Intelligence is the single owner/enricher; Companion is a consumer, never a second owner — §2, §3, §7.1); `docs/investigations/FI1B0_BENCHMARK_ROUTING_VERIFICATION.md` (the routing gap this task closes).

---

## 0. WHAT THIS TASK WAS

FI1B0 found that Food Intelligence (FI3 `food-intelligence:recommend/explain`, FI4 `food-intelligence:report` + `opportunity-delivery:report`) was registered, bound, and read-only-correct, but had **zero real conversational consumer** — every eligible Companion utterance fell through to `nutrition-knowledge` or generic discovery instead. FI1C's mandate: route eligible intents through the *existing* FI capability, wire the Companion to consume it, reuse existing engines only, and change nothing else (no new engines, no fixture edits, no prompt/personality changes, no Planner/Pantry/Shopping behaviour changes).

---

## 1. ROUTING CHANGES MADE

All changes are confined to `server/intelligence/pattern-intent-resolver.ts` (and its test file). No new capability, engine, or route was created — three matcher groups were added to the existing `ALL_MATCHERS` list:

### 1.1 `food-intelligence:recommend` — widened
Previously (IA4) only 3 phrasings resolved to `food-intelligence:recommend` ("recommend/suggest foods for X", "what should I eat for X"). FI1C added the **same benefit/nutrient-food vocabulary that `NUTRITION_BENEFIT_FOODS_MATCHERS` and the FK-082 rule already own** — "foods that help with X", "foods good for X", "what helps with X", "which foods help increase X" — so every phrasing FI1B0 flagged (FK-075, FK-078, FK-082 shapes) now also resolves an FI recommendation.

Each new matcher's confidence is set **below** its `nutrition-knowledge` sibling on the same phrasing (0.66–0.75 vs. nutrition-knowledge's higher confidence), so `nutrition-knowledge` remains the turn's primary/reached capability exactly as today — FI's cited, household-aware recommendation is *added* to the grounding context, never a replacement. This was a deliberate design choice to avoid disturbing any existing benchmark expectation while still surfacing FI data (see §5 for the consequence).

### 1.2 `food-intelligence:explain` — newly wired
IA4 registered this verb but left it unwired ("no real surface would consume it yet"). FI1C added 2 matchers for the natural drill-down shape that names both a food and the benefit/nutrient it's being asked about:
- `"why is salmon good for omega-3?"` / `"...recommended for..."`
- `"why/how does spinach help (with) iron?"`

### 1.3 `opportunity-delivery:report` — newly wired
Routes ambient "what food opportunities do I have?" / "any opportunities for me?" utterances to the platform's **single governance layer** over Domain Intelligence opportunity producers (`opportunity-delivery`, OD1) — not directly to `food-intelligence`'s own report verb. This is deliberate: it is the exact same call the `FoodOpportunitiesPanel` page and the ambient greeting engine already make (see §3), so a Companion answer and a page's panel can never disagree about what has been delivered, acknowledged, or dismissed.

No changes were made to `conversation-gateway.ts`'s dispatch mechanism — it already routes any `ResolvedIntent` generically by `capability`/`verb` through `intelligencePlatform.handle()` (INT24/INT35), so wiring a new capability into the resolver's output was sufficient to make it reachable in conversation; no gateway code changes were required or made.

---

## 2. COMPANION FLOWS NOW USING FOOD INTELLIGENCE

| Utterance shape | Capability now reached | Verified by |
|---|---|---|
| "foods that help with sleep", "foods good for gut health", "which foods help increase iron" | `food-intelligence:recommend` (additive alongside `nutrition-knowledge`) | `test-intent-resolver.ts` §8b |
| "why is salmon good for omega-3?", "how does spinach help iron?" | `food-intelligence:explain` | `test-intent-resolver.ts` §8c |
| "what food opportunities do I have?", "any opportunities for me?" | `opportunity-delivery:report` | `test-intent-resolver.ts` §8d |

All three now resolve through the same generic `queryCapability` → `intelligencePlatform.handle()` seam as every other capability, which delegates to the pre-existing, already-bound handlers:
- `food-intelligence` → `server/intelligence/food-intelligence/engine.ts` + `opportunity-engine.ts` (FI3/FI4)
- `opportunity-delivery` → `server/intelligence/opportunity-delivery/framework.ts` + `delivery-store.ts` (OD1)

No new engine, handler, or capability registry entry was created.

---

## 3. VERIFICATION — SINGLE OWNER, CONSUMER-ONLY, NO DUPLICATE PATHS

- **Food Intelligence remains the single owner.** `capability-registry.ts` still lists a single owner per capability (`food-intelligence` → FI3/FI4 engine files; `opportunity-delivery` → OD1 framework file). FI1C added no new store, no new owning service.
- **Companion is a consumer only.** The new matchers only ever *resolve an intent*; execution is delegated through the existing `intelligencePlatform.handle()` seam — the same seam used by every other capability. The Companion contains no food-intelligence business logic.
- **No duplicate routing paths.** `opportunity-delivery:report` is called identically from three places, confirmed by direct inspection: the Companion conversation gateway (this task), the ambient greeting/observation engine (`server/routes.ts` ~L11495, pre-existing), and the `FoodOpportunitiesPanel`'s direct HTTP route (`server/routes.ts` ~L11757, pre-existing, comment: *"keeps exactly one delivery path"*). All three call `intelligencePlatform.handle({ capabilityId: "opportunity-delivery", verb: "report", ... })` — no second implementation exists.
  - Note: `GET /api/meals/:id/food-intelligence` (`server/routes.ts` ~L5579) is an unrelated, pre-existing WS0X.6 endpoint that assembles per-meal nutrient/benefit display data for the meal-detail UI. It shares the English phrase "food intelligence" but is not the FI3/FI4 domain capability and is not part of the Companion conversational path — flagged here only to record that the naming collision was checked and is benign.

---

## 4. BENCHMARK — BEFORE / AFTER

| Metric | Before (FI1B0, 2026-07-06 investigation) | After (this run, `2026-07-06T10-10-11Z`, full mode, post-FI1C code) |
|---|---:|---:|
| Headline (Overall Intelligence Score) | 76.1/100 | 76.1/100 |
| `food-intelligence` capability score | 68.3/100 (2 questions) | 68.3/100 (2 questions) |
| D4 (Capability Routing) for those 2 questions | Band 2 (73%) | Band 2 (73%) — unchanged |
| Hard gates fired | 0 | 0 |
| Deterministic test suite | — | **2042 passed, 0 failed** (full `npm test`, incl. 172 intent-resolver + 36 FI3 + 87 FI4 + 50 OD1 tests) |

**The headline and the `food-intelligence` capability score did not move.** This is expected, not a regression — see §5. The routing widening is real and independently verified (24 new/changed assertions in `test-intent-resolver.ts` §8b–8d, all passing), but the 100-question fixture's only two `food-intelligence`-tagged questions (ND-059, CG-087) use phrasing that FI1C's mandate does not cover — see below.

---

## 5. REMAINING ROUTING GAPS

1. **ND-059** ("What simple nutrition boosts can I add this week?") and **CG-087** ("Help me make this meal healthier without making it boring.") still do not reach `food-intelligence` as their primary/reached capability. Both need a *composed* answer — ND-059 needs `opportunity-delivery:report` filtered to boost-type opportunities; CG-087 needs `food-intelligence:explain` for the named meal plus the uplift engine's own suggestions — not a single `recommend`/`explain`/`report` call. Building that composition was explicitly out of scope ("reuse existing engines only," "do not create new Food Intelligence"), so these two remain open. Closing them is a distinct follow-on task, not a routing-matcher fix.
2. **Fixture-level attribution is unchanged by design.** FI1C intentionally keeps every new `food-intelligence`/`opportunity-delivery` matcher at *lower confidence* than any overlapping `nutrition-knowledge` sibling, so `nutrition-knowledge` stays the turn's reached capability wherever both match — protecting existing benchmark expectations, but also meaning FI will not show as "reached" for any benchmark question whose phrasing already has a `nutrition-knowledge` match. FI only becomes primary for utterance shapes with **no** nutrition-knowledge sibling (the new `explain` drill-down shape, and pure "food opportunities" phrasing) — none of which the current 100-question fixture happens to contain. No fixture changes were made, per instructions.
3. **`FOOD_INTELLIGENCE_EXPLAIN_MATCHERS` covers only two phrasings** ("why is X good/recommended for Y", "why/how does X help Y"). Natural variants ("what does salmon do for omega-3", "how come spinach is good for iron") are not yet recognized — low-medium priority polish, not attempted here to keep the change additive and minimal.
4. **`FOOD_INTELLIGENCE_RECOMMEND_MATCHERS`'s FK-082-style multi-nutrient rule resolves only the first named term** in a list ("iron, B12, calcium, or omega-3" → `iron` only) — an honest partial match (the resolver carries one `{scope, slug}` pair per capability per turn, per INT33 dedup), not a fabricated multi-nutrient result, but a real ceiling on that phrasing.

---

## 6. TEST EVIDENCE

- `npx tsx server/tests/test-intent-resolver.ts` — **172 passed, 0 failed** (includes FI1C §8b/§8c/§8d, 24 assertions).
- `npx tsx server/tests/test-intelligence-food-intelligence-binding.ts` — **36 passed, 0 failed** (FI3, unchanged by this task, re-run as a regression check).
- `npx tsx server/tests/test-intelligence-food-opportunity-binding.ts` — **87 passed, 0 failed** (FI4, unchanged, regression check).
- `npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts` — **50 passed, 0 failed** (OD1, unchanged, regression check; confirms `opportunity-delivery` is still the sole live capability with exactly `report`/`review`/`approve`/`delete`).
- Full suite `npm test` — **2042 passed, 0 failed**, including `test:companion-benchmark:validate` (fixture untouched: still 100 questions, verbatim fidelity confirmed).
- Full benchmark `npm run test:companion-benchmark -- --mode=full` (deterministic tier) — headline 76.1/100, 0 hard gates, PASS; see §4.

---

## 7. DEFINITION OF DONE

- [x] Eligible Food Intelligence intents route through the existing `food-intelligence` capability (recommend widened, explain wired).
- [x] Companion wired to consume FI3/FI4 for recommendation, explanation, and opportunity requests (via the existing generic dispatch — no new plumbing).
- [x] Reused existing engines only — no new capability, handler, or store.
- [x] No benchmark fixture changes.
- [x] No Companion prompt/personality changes.
- [x] No Planner/Pantry/Shopping behaviour changes.
- [x] Food Intelligence verified as single owner; Companion verified as consumer only; no duplicate routing paths found.
- [x] Existing benchmark run, before/after recorded.
- [ ] ND-059 / CG-087 composed routing — explicitly deferred (§5.1), needs its own task.
