# INT42 — Capability Composition Foundation

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-06
**Branch:** `int1-intelligence-platform`
**Builds on:** [`INT33_INTELLIGENCE_CAPABILITY_ORCHESTRATION_IMPLEMENTATION.md`](./INT33_INTELLIGENCE_CAPABILITY_ORCHESTRATION_IMPLEMENTATION.md) (parallel "Level 1" compound matchers) · [`INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md`](./INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md) / [`INT41_CAPABILITY_ENRICHMENT.md`](./INT41_CAPABILITY_ENRICHMENT.md) (registry-extension pattern) · [`OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md`](./OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md)
**Governing architecture:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1 — Intent Engine holds zero business logic; every intent maps to an existing owner) · [`THA_COMPANION_PLATFORM_ARCHITECTURE.md`](../architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md) · [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) (Domain 17 — Nutrition Boost / Uplift)
**Tests:** `npm run test:intelligence-uplift-binding` (24 assertions, new) · `npm run test:intelligence-capability-composition` (23 assertions, new) — both in the `npm test` chain. Full chain (44 suites) re-run with zero regressions.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| HEAD commit | `d63d7cd1b9c4a917d36880eb4399ae35e03d781c` (branch `int1-intelligence-platform`) |
| Working tree at start | Already dirty — substantial uncommitted work from prior sessions (FI2C, PKC0, EWO1/2 etc.) was present before this workstream began, unrelated except where this workstream extends the same files (`capability-registry.ts`, `intelligence-platform.ts`, `index.ts`, `pattern-intent-resolver.ts`, `conversation-gateway.ts`) |
| This task's writes | See §7 Files changed |
| Rollback the registry extension only | Revert `capability-registry.ts`'s `uplift` entry, `intelligence-platform.ts`'s import/bind lines, `index.ts`'s uplift export block, and delete `bindings/uplift.ts` + `handlers/uplift-read-*.ts` — additive-only, nothing else reads or depends on them |
| Rollback the composition seam only | Revert `pattern-intent-resolver.ts`'s `MEAL_HEALTHIER_COMPOUND`/`NUTRITION_BOOST_WEEK_COMPOUND` + their `ALL_COMPOUND_MATCHERS` entries, and `conversation-gateway.ts`'s INT42 second-wave block + its two new imports; delete `capability-composition.ts` |

---

## 1. Objective

INT33 gave the resolver **parallel** ("Level 1") composition: a compound matcher can fire two or three independent, utterance-parameterised capability queries in the same turn, and the gateway's existing `Promise.all` already executes them and grounds one LLM answer from all of them. INT42 extends this with the piece INT33 explicitly deferred as future work (its own "What Level 2 Would Add" section): **a capability whose parameters depend on another capability's result, known only after the first one has actually run.**

Per EWO's ask, this workstream:
- Lets one user intent invoke multiple existing capabilities where appropriate (parallel, INT33-style, for both demonstration flows).
- Adds the narrow **sequential** seam needed for "Help make this meal healthier" (Meals + Food Intelligence + Uplift) — a genuine three-capability chain, not three independent lookups.
- Reuses existing capabilities only. The one new capability registered (`uplift`) wraps a domain engine (`server/lib/uplift-engine.ts`, SoT Domain 17, "Nutrition Boost") that **already existed** and was already reachable via `/api/uplift/batch` — this workstream makes it *platform-composable*, the same "capability-executable wrapper" pattern every prior binding (FI3, OD1, EL1…) already established. It adds no rule, no scoring, no nutrition tag — only a Port → Handler → Binding around the existing engine.
- Keeps each capability the sole owner of its own knowledge (Meals owns the meal, Uplift owns the boost rule, Food Intelligence owns the citation).
- Leaves Companion assembly and prompts untouched — composition happens entirely in the resolver + a new, isolated gateway seam; the system prompt's hard rules (grounding/firewall) are unchanged, and no personality/voice content was touched.
- Touches no benchmark fixture. The 100-question corpus (`companion-benchmark-100.v1.json`, `frozen=true`) is unmodified; the scorer/expectations code is unmodified.

---

## 2. Composition framework implemented

Two distinct mechanisms, kept deliberately separate because they solve different problems:

### 2.1 Parallel composition (reused from INT33 — no new mechanism)

`CompoundMatcher` (already defined in `pattern-intent-resolver.ts`) returns 2–3 `ResolvedIntent`s from one utterance match; the gateway's existing `Promise.all` over `queryable` executes them all before the LLM call. INT42 adds two new compound matchers to the existing `ALL_COMPOUND_MATCHERS` array — no change to the matcher type, the dedup step, or the gateway's first-wave execution:

- **`MEAL_HEALTHIER_COMPOUND`** — fires "help make this meal healthier" / "how can I make this healthier?" / "any boosts for this meal?" etc. **only when `hints.selectedMealId` is present** (a meal genuinely in focus — from the meal detail page or a prior turn's entity ref, never fabricated). Emits `meals/read {scope:"detail", mealId}` + `uplift/recommend {mealId}` in parallel, both parameterised from the same, already-known id.
- **`NUTRITION_BOOST_WEEK_COMPOUND`** — fires "what nutrition boosts should I add this week?" style utterances. Always emits `opportunity-delivery/report {}` (the caller's own prioritised, deduplicated Food Opportunities). **Deliberately does NOT also call `food-intelligence`'s own `report` verb** — that would reopen the exact double-delivery-path problem the pre-existing `OPPORTUNITY_DELIVERY_MATCHERS` comment documents avoiding (opportunity-delivery already fans out to food-intelligence's `report` internally; calling both directly would be two paths to the same underlying data, with only one having acknowledge/dismiss/accept tracking). When the utterance also names a specific nutrient/benefit (e.g. "what **fibre** boosts…"), it additionally emits `food-intelligence/recommend {scope, slug}` — a genuinely different verb and a genuinely different, non-overlapping answer (cited foods for that nutrient, not ambient opportunities).

### 2.2 Sequential composition (new — the INT42 seam)

**`server/intelligence/conversation/capability-composition.ts`** (new, ~95 lines) — a pure, stateless module structurally identical in spirit to `companion-guidance.ts`/`companion-enrichment.ts`: no I/O of its own, deterministic, honest-gap-on-nothing-groundable. Its one export:

```ts
deriveFoodIntelligenceExplainFromUplift(matches: readonly UpliftMatchResult[]): DerivedQuery | null
```

Given Uplift's own already-computed suggestions for one meal, it scans every matched rule (not just the first) for a `NutritionTag` with a **grounded, evidence-checked** mapping into the Food Knowledge Registry (`shared/knowledge/nutrients.ts` / `health-benefits.ts`):

| Uplift tag | Food Intelligence `{scope, slug}` |
|---|---|
| `fibre` | `nutrient` / `fibre` |
| `healthy-fat` | `nutrient` / `unsaturated-fats` |
| `gut-diversity` | `benefit` / `gut-health` |

Every other tag (`protein` — the registry only has the narrower `plant-protein`; `antioxidant` — only named phytonutrients exist, no generic slug; `micronutrient`, `resistant-starch`, `fermented`, `wholefood-swap`) is **deliberately left unmapped** — an honest gap, never a guessed slug (Principle 6).

**`conversation-gateway.ts`** wires this in as a genuine second wave, inserted between the existing first-wave `Promise.all` and the (unchanged) turn-classification/grounding-assembly code that follows:

```
Wave 1 (parallel, INT33):  meals/read{mealId} ⟶ ok-data
                           uplift/recommend{mealId} ⟶ ok-data { matches: [...] }
                                     │
                    capability-composition.ts derives a query
                    (or null — no groundable tag, no query, no fabrication)
                                     │
Wave 2 (sequential, INT42):  food-intelligence/explain{scope, slug, foodSlug} ⟶ ok-data
                                     │
                    merged into the SAME capData / queryResults / queryable
                    the rest of the (unchanged) pipeline already reads —
                    turn classification, discoveries, guidance, enrichment,
                    the persisted `resolvedIntent`, and the LLM's grounding
                    context all see all three capabilities automatically.
```

Skipped (no second-wave call at all) when: Uplift didn't fire or returned nothing groundable this turn; **or** `food-intelligence` was already resolved independently this turn (never overwrites a genuine, utterance-driven match with a derived one — proven by test §4).

This is intentionally the smallest possible seam — one named chain, not a general "any capability's output may parameterise any other capability's input" planner. See §5 for why that generalisation is named as future work rather than built speculatively here.

---

## 3. Composed capability flows

### Flow 1 — "Help make this meal healthier." → Meals + Food Intelligence + Uplift

Demonstrated live against the real conversation gateway, real database, real OpenAI-backed LLM, user 1, meal id 63 ("Thai green chicken curry", `["Thai green curry paste", "chicken breast", "coconut milk", "green beans", ...]`), surface hint `{ selectedMealId: 63 }`:

```
meals/read      {scope:"detail", mealId:63}         → ok-data  (the meal, owned by Meals)
uplift/recommend {mealId:63}                         → ok-data  (3 matched rules: red lentils/turmeric/
                                                                   natural yoghurt — owned by Uplift, SoT D17)
food-intelligence/explain {scope:"nutrient",
                           slug:"fibre",
                           foodSlug:"red-lentils"}   → ok-data  (derived from Uplift's own top suggestion —
                                                                   cited, owned by Food Intelligence)
```

Companion's actual answer (unedited):

> "To enhance the healthiness of your Thai green chicken curry while keeping it exciting, consider adding 3 tablespoons of red lentils for extra fiber and plant protein, as they blend well into curry sauces. You could also boost the dish with an additional ½ teaspoon of turmeric, which supports anti-inflammatory variety in your diet and pairs naturally with curry spices. Lastly, adding 2 tablespoons of natural yogurt as a side can introduce gut-friendly bacteria, making the meal both nutritious and flavorful."

Every suggested ingredient (red lentils, turmeric, natural yoghurt) traces verbatim to Uplift's own matched rules for this meal — Meals supplied the ingredient list Uplift matched against, and Food Intelligence's cited `explain` for fibre/red-lentils grounded the "extra fiber and plant protein" framing rather than the LLM inventing it. Three capabilities, three owners, one turn.

### Flow 2 — "What nutrition boosts should I add this week?" → Opportunity Delivery + Food Intelligence

Demonstrated live, same conditions, no meal context needed (a household-level question):

```
opportunity-delivery/report {}                        → ok-data  (this household's own prioritised
                                                                     Food Opportunities — 10 items:
                                                                     planner gaps, a shopping-list/
                                                                     restriction conflict, unused pantry items)
```

Companion's actual answer (unedited):

> "You don't have any meals planned yet for this week, so consider incorporating nutrient-dense foods like almonds, avocados, or artichokes into your meals for healthy fats and fiber. You could also explore adding fruits like apples or apricots for natural sweetness and vitamins."

With a **named nutrient** ("What **fibre** boosts should I add this week?"), Food Intelligence joins in as a second, independent capability (not a second delivery path — see §2.1):

```
opportunity-delivery/report {}                                    → ok-data
food-intelligence/recommend {scope:"nutrient", slug:"fibre"}       → ok-data  (cited fibre-rich foods)
```

> "You don't have any meals planned yet for this week, but you might consider adding foods like onions, avocados, or carrots, as they are linked to fiber. Onions retain more flavonoids when peeled thinly, avocados support the absorption of fat-soluble vitamins, and light cooking with a bit of fat can enhance the absorption of beta-carotene from carrots."

---

## 4. Benchmark before/after

Ran the real benchmark harness (`npm run test:companion-benchmark`, `mode=full`, user 1, judge not invoked — deterministic tier only, matching the existing convention), comparing against the most recent pre-INT42 full run already present in `docs/intelligence/benchmark/history/` (`2026-07-06T10-10-11Z__d63d7cd`, same commit, same dirty branch, run before this workstream began).

| | Before | After |
|---|---:|---:|
| Overall Intelligence Score | 76.1/100 (PASS) | 76.1/100 (PASS) |
| Hard gates fired | 0 | 0 |
| Honest-gap rate | 100% | 100% |
| Run duration | 124.8s | 110.6s |
| **ND-059** composite (`"What simple nutrition boosts can I add this week?"`) | 68.3 — `reachedCapability: nutrition-knowledge` | 68.3 — `reachedCapability: opportunity-delivery` |
| **CG-087** composite (`"Help me make this meal healthier without making it boring."`) | 68.3 — `reachedCapability: meals` | 68.3 — `reachedCapability: meals` |

**The routed capability changed for ND-059 (nutrition-knowledge → opportunity-delivery — a real, grounded improvement) but the composite score did not move, for two identifiable, honest reasons — not a flaw in the composition:**

1. **D4 (Capability Routing) is single-capability, not composition-aware.** `expectations.ts` derives each question's expected `capabilityFamily` from the fixture's free-text `capability` tag: ND-059 is tagged `"uplift-engine + nutrition"` and CG-087 `"meal-uplift + companion"`, both of which the pre-existing `CAPABILITY_FAMILY_ALIASES` table resolves to **`food-intelligence`** (authored before INT42, anticipating Uplift-adjacent answers would be reached through the `food-intelligence` capability specifically). The deterministic scorer's `D4` band only checks whether the turn's single `reachedCapability` (`TurnResult.outcome.capabilityId` — necessarily one capability, the "primary" outcome) equals that one expected family. A turn that correctly reaches `opportunity-delivery` + (silently, in grounding only) `food-intelligence`, or `meals` + `uplift` + `food-intelligence`, gets no credit for the composition — the scorer has no vocabulary for "this turn correctly composed N capabilities." This is a scoring-infrastructure gap, not a routing defect (confirmed directly: `reachedCapability` genuinely changed from `nutrition-knowledge` to `opportunity-delivery` for ND-059 — a strictly better single-capability answer that the D4 band still can't see past the family mismatch).
2. **CG-087 cannot be exercised by the benchmark harness at all today.** `server/tests/benchmark/companion-turn.ts` calls `conversationGateway.processUserTurn(user.id, utterance, "floating", {}, ctx)` — **`surfaceHints` is hardcoded to `{}`** for every one of the 100 questions; there is no per-question fixture field for "a meal is currently in view." `MEAL_HEALTHIER_COMPOUND` correctly requires `hints.selectedMealId` (Meals/Uplift cannot be honestly composed for an unnamed meal — Principle 6 forbids guessing which meal "this" refers to), so it correctly does **not** fire under the harness's synthetic, context-free conditions — the identical behaviour before and after is the CORRECT behaviour, not a missed opportunity. §3's Flow 1 demonstration is the direct proof that the composition fires and improves the answer the moment a real `selectedMealId` is supplied (exactly what happens in the live product when this question is asked from a meal detail page) — the benchmark's synthetic harness just doesn't (yet) simulate that page context. Named as a gap in §5, not worked around here.

No regression: 0 hard gates fired in either run, honest-gap rate held at 100%, and the two questions' *scores* are identical (not degraded) before and after — the only observed change is a strictly more-grounded `reachedCapability` for ND-059.

---

## 5. Remaining orchestration gaps

Named honestly, in the same spirit as INT33's own "What Level 2 Would Add (not in scope)" section and INT41's "Explicitly excluded":

1. **No general dependent-query planner.** `capability-composition.ts` hard-codes exactly one chain (Uplift → Food Intelligence). A capability needing a *different* second-wave dependency (e.g. a future "explain this Opportunity's evidence" chain) requires its own named function and its own gateway wiring — there is no `OrchestrationPlan` type, no declarative "step B depends on step A's field X" registry entry. Building that generically now, with only one real consumer, would be speculative machinery ahead of a second proven use — the same discipline INT33 itself named for its own Level 2.
2. **The benchmark harness has no simulated page/entity context.** `companion-turn.ts`'s hardcoded `surfaceHints: {}` means no benchmark question can exercise `selectedMealId`, `activePlannerWeekId`, or any other context-dependent compound match — not just CG-087, but every *existing* context-gated capability (e.g. the pre-INT42 `currentFoodSlug`-aware matchers) is equally invisible to the corpus today. A future workstream could extend the (frozen, `v1.0.0`) fixture format with an optional per-question `surfaceHints` field and thread it through `companion-turn.ts` — out of scope here per the explicit "do not change benchmark fixtures" instruction.
3. **The deterministic scorer's D4 dimension has no multi-capability credit.** As detailed in §4, a correctly-composed turn spanning several capabilities is scored identically to a turn that reached one (wrong) capability, provided neither equals the fixture's single expected family. Fixing this is a `scorer.ts`/`expectations.ts` change (comparing against the FULL set of capabilities a turn queried, not just the primary outcome) — deliberately not made here, both because it is out of this workstream's stated scope and because changing the measurement instrument used to grade your own work in the same workstream is exactly the kind of self-grading this platform's honesty discipline exists to avoid.
4. **`uplift`'s write path stays outside the platform.** Accepting or removing a suggestion (`POST /api/uplift/accept`, `DELETE /api/uplift/applications/:id`) remains exclusively on the existing routes — the new `uplift` capability declares only `recommend`, matching every other read-only binding's discipline of extending, not replacing, existing write surfaces. A future workstream could register `add`/`delete` the same way INT40 did for Planner/Shopping, but that is unauthorised scope creep here.
5. **Only three `NutritionTag`s are grounded for the sequential chain.** Six of Uplift's nine tags have no unambiguous Food Knowledge Registry slug today (§2.2 table) — a meal whose only matched suggestion carries one of those six tags gets Meals + Uplift but no third leg, an honest gap rather than a forced (and possibly wrong) mapping. Widening this requires either new Registry entries for those concepts or a deliberately-reviewed looser mapping — a knowledge-ownership decision for the Food Knowledge Registry's own governance, not this workstream's to make unilaterally.

---

## 6. Governance compliance

- **No new business logic.** `uplift-read-port.ts`/`uplift-read-handler.ts` delegate 100% to the pre-existing `server/lib/uplift-engine.ts` (`matchUpliftRules`, `buildRuleIndex`) and `server/storage.ts` (`getMeal`) — the same Port → Handler → Binding pattern every one of the prior 21 bindings uses, containing no rule authoring, scoring, or nutrition-tag reasoning of its own.
- **Each capability owns its own knowledge.** Meals projects the meal (no nutrition — the handler's existing hard rule, unchanged). Uplift projects its own matched rules verbatim (no re-derivation). Food Intelligence's `explain` verb is called exactly as any other consumer would call it — the sequential seam only supplies its *parameters*, never its answer.
- **Companion assembles, owns no domain knowledge.** `capability-composition.ts` performs zero reasoning about nutrition — it is a parameter-shaping seam over two already-typed result shapes (`UpliftMatchResult` → `{scope, slug, foodSlug}`), gated by a small, evidence-checked, honestly-partial lookup table. No new fact is asserted anywhere in this workstream that wasn't already asserted by an existing, owning capability.
- **No prompts, personality, or benchmark fixtures changed.** `conversation-gateway.ts`'s system prompt (hard rules 1–5 + the personality fragment) is untouched; `personality-registry.ts`/`behaviour-engine.ts` are untouched; `companion-benchmark-100.v1.json` (`frozen=true`) is untouched; `scorer.ts`/`expectations.ts` are untouched (see §5.3 for why).
- **Honest gaps preserved throughout.** `MEAL_HEALTHIER_COMPOUND` requires a real `selectedMealId` (never fabricates which meal). `deriveFoodIntelligenceExplainFromUplift` returns `null` (no second-wave query at all) rather than a guessed slug for six of nine `NutritionTag`s. The uplift handler mirrors Meals' exact ownership-denial message (no existence leak). `NUTRITION_BOOST_WEEK_COMPOUND` never duplicates `opportunity-delivery`'s own delivery path.
- **No architectural duplication.** `uplift` is the 22nd capability, not a second Food Intelligence engine; `capability-composition.ts` is the one new sequential seam, not a second orchestration framework beside INT33's compound matchers.

---

## 7. Files changed

| File | Change |
|---|---|
| `server/intelligence/handlers/uplift-read-port.ts` | **New** — Port wrapping `uplift-engine.ts` + `storage.getMeal` |
| `server/intelligence/handlers/uplift-read-handler.ts` | **New** — read-only `recommend` handler, ownership check mirrors `meals-read-handler.ts` |
| `server/intelligence/bindings/uplift.ts` | **New** — binding, `UPLIFT_EXECUTABLE_INTENTS = ["recommend"]` |
| `server/intelligence/conversation/capability-composition.ts` | **New** — pure `deriveFoodIntelligenceExplainFromUplift()`, the sequential seam |
| `server/intelligence/capability-registry.ts` | + `uplift` capability entry (22nd) |
| `server/intelligence/intelligence-platform.ts` | + import/bind `bindUpliftReadCapability` |
| `server/intelligence/index.ts` | + uplift binding/handler/port exports |
| `server/intelligence/pattern-intent-resolver.ts` | + `MEAL_HEALTHIER_COMPOUND`, `NUTRITION_BOOST_WEEK_COMPOUND`, added to `ALL_COMPOUND_MATCHERS` |
| `server/intelligence/conversation/conversation-gateway.ts` | + INT42 second-wave block between the first `Promise.all` and turn classification; `queryable` changed `const`→`let` to absorb the derived intent |
| `server/tests/test-intelligence-uplift-binding.ts` | **New** — 24 assertions |
| `server/tests/test-intelligence-capability-composition.ts` | **New** — 23 assertions (compound matchers, pure derivation, end-to-end gateway wiring) |
| `server/tests/test-intelligence-platform.ts` | Canonical capability count 23 → 24 |
| 19× `server/tests/test-intelligence-*-binding.ts` | Live capability count 21 → 22 (mechanical — INT42 adds one live binding) |
| `package.json` | + `test:intelligence-uplift-binding`, `test:intelligence-capability-composition`, both added to the `test` chain |

Full chain (`npm test`, 44 suites) passes with zero regressions. `npx tsc --noEmit` clean for every file this workstream touched (two pre-existing, unrelated baseline errors in `household-discovery-handler.ts` and `shopping-discovery-port.ts`, and one in `planner-discovery-engine.ts`, confirmed present and unchanged before/after this workstream — the same baseline INT40/INT41 documented).

---

## 8. Scope Lock

**Implemented:**
- The `uplift` capability (Port → Handler → Binding), read-only, one verb (`recommend`).
- Two parallel compound matchers (`MEAL_HEALTHIER_COMPOUND`, `NUTRITION_BOOST_WEEK_COMPOUND`).
- One sequential composition seam (`capability-composition.ts` + its gateway wiring), demonstrated end-to-end against the real database and LLM.
- 47 new automated assertions across two new test files, both added to the `npm test` chain.
- A full-mode benchmark run before and after, compared against the most recent pre-existing baseline artefact.

**Explicitly excluded (honest gaps, not implemented — see §5 for the full list):**
- No general/declarative dependent-query orchestration planner.
- No benchmark-harness support for simulated page/entity context (`surfaceHints`).
- No change to the deterministic scorer's capability-routing dimension to credit multi-capability composition.
- No write verbs (`add`/`delete`) on the `uplift` capability — accept/remove stays on the existing `/api/uplift/*` routes.
- No widening of the `NutritionTag` → Food Intelligence slug mapping beyond the three already evidence-checked entries.
