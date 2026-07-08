# INT17 — The Context Composition Engine

> **Status: implemented, measured, NOT committed.**
> All four measurement targets are met. **Token reduction: −25,576 exact `prompt_tokens` (−19.6%), 0 of 69
> questions costing more.** INT16, the experiment this replaces, cost **+1,854**. Answer quality is equal-or-better
> in aggregate (benchmark median 76.1 vs 75.7; `entityRefs` 121 → 164) but the composite score movement is
> **inside the noise floor** and must not be claimed as a result. **One genuine answer-quality regression
> (CB-022) is recorded in §6.3, not hidden.**

**Classification:** Intelligence Governance → Context Composition (`server/intelligence/context/`)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Subject at implementation:** HEAD `8b01fff` + uncommitted BENCH4 resolver matchers + uncommitted INT16

**Governing documents read before implementation:**
`docs/architecture/README.md` (Architecture Bootstrap, mandatory entry point),
`docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`,
`docs/investigations/INTA1_INTELLIGENCE_PLATFORM_WIRING_AUDIT.md`,
`docs/implementation/BENCH4_FOOD_INTELLIGENCE_REACHABILITY.md`,
`docs/implementation/INT16_CONTEXT_COMPACTION_LAYER.md`.

**Creates:** `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (governing).
**Discharges:** BENCH4 §7 item 4 — *"`CAP_DATA_MAX_CHARS` truncates away the Food Opportunity Engine's uplift
evidence… This defect exists for every capability whose result exceeds 1,800 chars."*
**Supersedes:** INT16. `context-compaction.ts` and its 84-assertion suite are **deleted, not deprecated**.

---

## 0. ROLLBACK

Created **before** any file was modified. `git status` was confirmed **dirty** first — the tree carried BENCH4's
uncommitted resolver matchers, INT16's uncommitted layer, and 29 unindexed benchmark artefacts — so a tag on
`HEAD` alone would **not** have restored it. A tag on a snapshot commit of the complete working tree does.

| Identifier | Object | Restores |
|---|---|---|
| **`int17-rollback-20260708`** | `11196b8` | The complete pre-INT17 working tree, tracked **and untracked** |

```bash
git show --stat int17-rollback-20260708      # inspect
git checkout int17-rollback-20260708 -- .    # restore everything
```

The snapshot was built through a temporary `GIT_INDEX_FILE`, so the real index was never touched — verified by
comparing `git write-tree` before and after (`ca15ff42…` both times).

---

## 1. Scope

**In scope.** One canonical engine that owns every byte of LLM grounding context.

**Explicitly not done.**

- **No capability changed.** Not one line of `opportunity-engine.ts`, any handler, any port, any binding, or any
  owning service. Food Intelligence uses the engine because the engine reads its Full Result — not because Food
  Intelligence was modified.
- **No capability ownership changed.** No registry entry, no `supportedIntents`, no permission, no verb.
- **No business logic duplicated.** The engine does not know what a diet, a nutrient, or an opportunity is.
- **`CAP_DATA_MAX_CHARS` not increased.** It is the same `1_800`, re-homed as
  `CAPABILITY_CONTEXT_BUDGET_CHARS`. A caller asking for a larger ceiling is silently clamped to 1,800 (tested).

**Files added** — `server/intelligence/context/`:

| File | Lines | Role |
|---|---:|---|
| `context-view.ts` | 549 | Full Result → `ContextView`. Specs + generic derivation. Pure. |
| `context-relevance.ts` | 154 | Deterministic lexical intent relevance. Pure. |
| `context-composition-engine.ts` | 1,035 | The engine. Seven phases. Pure. |
| `server/tests/test-intelligence-context-composition.ts` | 621 | **105 assertions, 0 failures.** |

Roughly half of each file is the reasoning behind it. Every non-obvious rule states the payload it was measured
against and what happened when it was absent, because two of them (§5) were wrong the first time.

**Files deleted:** `server/intelligence/conversation/context-compaction.ts`,
`server/tests/test-intelligence-context-compaction.ts`.

**Files changed:** `conversation-gateway.ts` (the seam), `package.json` (registers the test — INT16's own
"known gap"), `docs/architecture/README.md` (indexes the new governing document — the drift `INTA1` §4.1 names).

---

## 2. What the gateway used to do, and what it does now

```diff
- const raw  = JSON.stringify(outcome.result);
- const data = raw.length > 1800 ? raw.slice(0, 1800) + "… [truncated]" : raw;
- ...
- const contextSections = Object.entries(capData).map(([cap, d]) => `### ${cap}\n${d}`).join("\n\n");
+ const composition = composeContext({ utterance, capabilities, enrichment, tokenBudget, perCapabilityCharCeiling });
+ const fullContextSections = composition.text;
```

`capData` is gone. `queryCapability` no longer decides anything about the prompt: it carries `outcome.result`
untouched to the engine, which is the single owner of what the model sees.

Three defects died with it, all pre-existing and all measured on the real 100-question corpus:

1. **Invalid JSON on every over-budget section.** A byte prefix cuts mid-object. **57 / 57** over-budget sections
   handed the model unparseable JSON. Now **0 / 57**.
2. **Category-blind deletion.** `food-intelligence:report` is priority-sorted; seven `planner-empty-day` rows
   consumed the whole 1,800 and both other evidence types were deleted (BENCH4 §5). **1 / 3 groups → 3 / 3.**
3. **Non-deterministic prompts.** Section order came from a `Map` filled inside `Promise.all` — capability
   *completion* order. The same question produced different prompts on different runs. Now byte-identical
   (verified: three compositions of the whole corpus, all identical).

---

## 3. Where the tokens actually were

Before optimising anything, the corpus was measured. **50.4% of every CONTEXT DATA byte the platform emits is
`profile:read`** — injected into 90 of 100 prompts, **85 of them as a surface `baseline` read the user never
asked for**, at 1,484 chars each.

| capability:verb | n | chars | est. tokens |
|---|---:|---:|---:|
| **`profile:read` (baseline)** | **85** | **126,140** | **36,040** |
| `meals:read` | 23 | 41,699 | 11,914 |
| `nutrition-knowledge:read` | 9 | 16,317 | 4,662 |
| everything else | 63 | 68,873 | 19,678 |

Most of that 126,140 characters is plumbing the model can never use: `emailVerified`,
`subscriptionExpiresAt`, `lastLoginAt`, `soundEnabled`, `barcodeScannerEnabled`, `profilePhotoUrl`, `isDemo`.

Two rules reclaim it, and neither is a truncation:

- **A routed capability outranks every baseline read.** The baseline's *share* of the discretionary budget
  collapses; its constraint fields do not.
- **`profile:read` has a registered Context View whose `pinned` set is the user's dietary constraints.** They
  are emitted **always**, at any budget, **even when empty** — because `"dietRestrictions": []` says *"none
  recorded"* while an absent key says nothing, and HARD RULE 3 then forces the model to say it does not know.
  Absence and emptiness are different facts.

`profile:read` now costs ~271 chars on a baseline turn instead of 1,484, and the model sees *more* of what
matters: on *"What are my health goals?"* it retrieves `healthGoals` **and** `goalType`; on *"what is my weight
and height"* it retrieves `weightKg` and `heightCm` and **not** `goalType`. On a shopping question it sees the
dietary constraints and **not** the user's email address.

---

## 4. Results — exact, not estimated

### 4.1 Prompt tokens

Method: the **real gateway** was run over all 100 fixture questions in two trees — a `git worktree` at `HEAD`
(legacy truncation) carrying BENCH4's uncommitted resolver so `food-intelligence` is reachable in both, and the
INT17 tree. The 69 system prompts that actually reach the LLM were captured verbatim from `ILlmProvider`, and
each was submitted to **gpt-4o-mini** (`llm-provider.ts`, the production model) with `max_tokens: 1` to read the
exact `usage.prompt_tokens`. Nothing is reconstructed or estimated.

| | tokens |
|---|---:|
| BEFORE — legacy truncation, HEAD `8b01fff` | **130,714** |
| AFTER — Context Composition Engine | **105,138** |
| **DELTA** | **−25,576 (−19.6%)** |
| mean per question | 1,894 → 1,524 |
| **questions costing MORE tokens** | **0 / 69** |

The CONTEXT DATA block itself falls **43.9%** (253,029 → 122,995 chars, plus 19,021 chars of format note).
Diluted across the fixed prompt scaffold — hard rules, food-conversation block, personality, response format —
that becomes 19.6% of the whole prompt.

**Against INT16, which this replaces:** INT16 cost **+1,854 prompt tokens** across the corpus (its §4, exact
measurement, its own conclusion). The direction is reversed, not merely improved.

### 4.2 Everything else the objective asked to measure

| Measure | Before | After |
|---|---|---|
| Context size (CONTEXT DATA chars, corpus) | 253,029 | **122,995** (−51.4% before the note; −43.9% with it) |
| Token reduction | — | **−25,576 exact (−19.6%)** |
| Entity preservation — **fake or clipped ids emitted** | 0 | **0 / 672** |
| Entity preservation — ids reaching the model | 555 | 462 (see §6) |
| Evidence preservation — capabilities represented | 180/180 | **180/180** |
| Evidence preservation — evidence groups (`food-intelligence`) | 1/3 | **3/3** |
| Evidence preservation — well-formed JSON sections | 123/180 | **180/180** |
| Duplicate evidence removed | — | 65 items merged, 446 field-hoists |
| Benchmark impact | 75.7 (n=1) | **76.1 median** (n=3, spread 0.1) |
| Benchmark `entityRefs` | 121 | **164 median** (163 / 173 / 164) |
| Latency — engine | — | **5.0 ms/turn** mean, 28 ms worst |
| Latency — end-to-end turn | 1,369 ms | 1,301 ms median (noise-dominated) |

### 4.3 Benchmark — n = 3, `--mode=full --user=1`, `worldMode: single-world`

| run | score | IRA | entityRefs | q w/ refs | halluc | hard gates | routing gates | honest-gap | verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| BENCH4 baseline (legacy) | 75.7 | 0.852 | 121 | 23 | 0% | 0 | 12 | 100% | PARTIAL |
| INT16 (median of 3) | 75.8 | 0.852 | 139 | 25 | 0% | 0 | 12 | 100% | PARTIAL |
| `19-29-37Z` | 76.1 | 0.852 | 163 | 31 | 0% | 0 | 12 | 100% | PARTIAL |
| `19-32-11Z` | 76.2 | 0.852 | 173 | 32 | 0% | 0 | 12 | 100% | PARTIAL |
| `19-34-33Z` | 76.1 | 0.852 | 164 | 30 | 0% | 0 | 12 | 100% | PARTIAL |

**Median 76.1 · mean 76.13 · spread 0.1.**

**+0.4 over the baseline is NOT a result.** INT16 §6.2 established the noise floor by running the same code
eleven times: **spread 1.2 points**. A 3-run median cannot resolve ±0.5, and the baseline is n=1. Intent
Resolution Accuracy is identical (0.852) across every run because routing is deterministic and untouched.

What the benchmark *does* establish, with n=3:

- **No regression in any safety or honesty measure.** 0 hallucinations, 0 hard gates, 100% honest-gap rate, the
  same 12 routing gates on the same 12 questions, `PARTIAL` verdict unchanged.
- **`entityRefs` improved, and not marginally.** All three INT17 runs (163 / 173 / 164) exceed both the baseline
  (121) and INT16's maximum (140). Questions carrying any ref: 23 → 31 median.
- **Prompt stability improved.** Only **2 of 100** questions change D1 band across the three runs. Under the
  first (pre-fix) INT17 engine it was 12; the difference is §5.1.

---

## 5. Two defects I introduced, found by measurement, and fixed

Both were invisible to the benchmark score. Both are recorded because the score is not the point.

### 5.1 Lexical relevance showed the model *worse* evidence than the byte prefix

**CB-017 — *"Which meals are the least processed or most whole-food based?"***

Every content token in that question is a food word. Scoring evidence by token overlap promoted **"Whole Milk"**
(matches *whole*) and **"Cow & Gate Baby Food"**, **"Heinz Baby Food"**, **"Hipp Organic Baby Food"** (match
*food*) over the scratch-cooked **porridge** the question is actually about. Shown only ultra-processed products,
the model cited nothing, three runs out of three. Lexical matching has no way to know that "whole-food based" is
a concept and not two words — and the module's own header says it must never pretend otherwise.

**Fix.** The capability's own top item is *always* its group's representative. Relevance orders the *additional*
examples; it never chooses the first one. The engine may **add** evidence and **add** missing groups. **It may
never show a worse first example than the byte prefix it replaced.**

After: `porridge (id 1385)` is first again, the model cites it, and grounds the claim in `mealSourceType:
"scratch"` — a *better* answer than the baseline's, which merely name-dropped meals.

### 5.2 `_context` taught the model to fabricate

**PL-025 — *"What meals are missing from my plan?"***

The honest `_context` block declared `{total: 591, shown: 4, omitted: {…}}` beside the `meals` section. The model
subtracted, and answered:

> *"You have a total of 591 meals available, but only 4 are shown… This means there are **587 meals that are not
> included in your plan**."*

Neither `587` nor *"not in your plan"* came from any capability. **Bookkeeping about my composition had become a
fabricated fact about the user's planner** — committed by the layer whose entire purpose is to prevent exactly
that (CPA1 §0). Strengthening the format note did not fix it; the model kept subtracting, because the operands
were right there.

**Fix.** `_context` states what **exists**, never what this block **withheld**. `total`/`shown`/`omitted` became
`found` plus the capability's own per-group counts. How many rows the engine chose to print is the engine's
business, not the model's — **and a number the model can do arithmetic with is a number it will do arithmetic
with.**

After, all three samples: *"You don't have any specific meals recorded in your plan for this week yet. However,
you have a total of 591 meals available in your collection."* True, grounded, no subtraction.

**The honest reading.** Legacy truncation never produced this fabrication only because its **invalid JSON**
happened to hide the numbers. Making the context well-formed made it *legible*, and legible metadata is metadata
the model will reason over. **Every honesty mechanism in a prompt is also an attack surface on the model's
reasoning, and must be designed as one.** This is the single most important thing INT17 learned.

---

## 6. What INT17 costs

### 6.1 Fewer id *tokens* reach the model — and this is not the regression it looks like

| | ids |
|---|---:|
| BEFORE — surviving truncation | 555 |
| AFTER — surviving composition | 462 |

Every one of the 672 ids INT17 emits across the corpus is **a real id from the raw payload**: 0 clipped, 0
invented (legacy: also 0, because a mid-object cut destroys the `"id":` token rather than corrupting it).

The 93 "lost" ids are almost entirely *more examples of the same kind*: 49 food slugs from the 611-food
`nutrition-knowledge` registry dump, 5 further `planner-empty-day` rows that differ only by weekday, 1
`customMetricDefs` id which is not a citable entity type. The benchmark's own `entityRefs` — what the model
**actually cites** — went **up**, 121 → 164 median. Breadth of examples fell; usable references rose.

`slug` was nearly lost for real. It is a food's canonical entity reference (`{"type":"food","id":"allspice"}`),
and because a slug is usually a normalisation of `name`, the generic redundant-string rule cheerfully deleted it
as "already present in a longer string" — silently removing the only thing that made the food citable. Entity
references are now exempt from every drop, clip, and hoist rule. Caught by measurement, not by review.

### 6.2 The format note

56 of 90 context-bearing turns pay it; 19,021 chars ≈ 5,400 tokens across the corpus. The first clause is long
and every word of its second half is load-bearing (§5.2). A turn that withheld nothing, hoisted nothing and
merged nothing pays **nothing** — INT16 paid its note on every turn that compacted anything.

A withheld **field** buys no note (`"fields":{"omitted":31}` cannot be mis-cited). Only a withheld **item** can.

### 6.3 One genuine answer-quality regression, and one scorer artefact

Median composite over 3 runs, against the BENCH4 baseline: **86 unchanged, 10 improved, 4 regressed.** Every move
is exactly one D1 band (±7.5), which the scorer awards on `entityRefCount > 0`. Two of the four "regressions" are
sampling noise (their band varies run to run, and direct 3× resampling of the *baseline* prompt shows FK-073
citing nothing there either). The other two are real, and different from each other:

- **CB-022 — a genuine regression.** *"Which meals need better ingredient or nutrition data?"* The two meals that
  answer it (`tuna spaghetti` id 2151, `Beef Concarne` id 2139 — both `ingredientCount: 0`) no longer reach the
  model. Cause: the guaranteed core is spent *per group*, and `nutrition-knowledge:read scope=foods` — the whole
  611-food registry, 40 groups — seats eight core items, leaving `meals` two. The engine cannot know that a
  registry dump is *reference* rather than *evidence*. **Fix (not done here): a `ContextViewSpec` for
  `nutrition-knowledge:read scope=foods`, or a resolver that does not route the registry into this question.**
  Recorded in §7.

- **PL-025 — the benchmark penalising a correctness fix.** Its answer is now *right* (§5.2) and cites no meal id,
  so D1 drops a band. The baseline's 2 refs came with the fabricated "587 meals". **A benchmark that rewards
  citing an id over telling the truth is measuring the wrong thing**, and this is the sharpest example of INTA1
  §6.4's warning that the judge tier — 68 of 100 weight points — is hardcoded off.

---

## 7. Remaining work (not INT17)

1. **`nutrition-knowledge:read scope=foods` needs a Context View.** It returns the entire 611-food registry as
   grounding. It is reference data, not evidence about the user, and it crowds the core (§6.3, CB-022).
2. **Migrate capabilities to own their Context View.** The seam exists and the engine is indifferent to which
   side of it a view comes from (architecture §2.1). Twenty-one capabilities still use generic derivation.
3. **`CHARS_PER_TOKEN = 3.5` is an estimator, not a tokenizer.** Measured on the emitted context block:
   **3.578** chars/token, so the constant is ~5% conservative on average — but **6 of 30** measured blocks were
   denser (worst 3.364), so the token budget can overrun by ~4% on a dense block. Bounded and reported.
4. **`analyser:read` has 15 groups; `MAX_GROUPS_SHOWN` seats 8.** The rest are declared by count. Same class of
   issue as (1).
5. **Enrichment is still free text**, not a Context View. It is budgeted and de-duplicated against emitted
   evidence, but preserved as `• title: body` so the prompt's WEAVE ENRICHMENTS rule keeps binding.
6. **The judge tier is still hardcoded off** (INTA1 §6.4). Every answer-quality number here is a lower bound —
   and §6.3 shows the deterministic proxy actively mis-scoring a correctness fix.
7. **The baseline is n=1.** BENCH4's `12-42-07Z` run is a single sample against a ~1.2-point noise floor. A
   proper 3-run legacy baseline would cost 6 minutes and would make every comparison in §4.3 stronger.

---

## 8. Verification

| Check | Result |
|---|---|
| `git status` before any modification | **dirty** — snapshot rollback created, index verified untouched |
| Rollback created before modification | `int17-rollback-20260708` → `11196b8` (tracked + untracked) |
| `npx tsc --noEmit` | **178 errors — identical to the pre-existing count** (INTA1 §1.3). **0 in `server/intelligence/context/`** |
| `test:intelligence-context-composition` (INT17) | **105 passed, 0 failed** — and **registered in `npm test`**, closing INT16's own known gap |
| `test-intelligence-conversation-gateway` (INT18) | all passed |
| `test:intelligence-fallback` (INT35) | 82 passed, 0 failed |
| `test:benchmark-routing` | 101 passed, 0 failed |
| `test:benchmark-utilisation` | 70 passed, 0 failed |
| `test:intelligence-food-opportunity-binding` (FI4) | 40 passed, 0 failed |
| `test:intelligence-opportunity-delivery-binding` (OD1) | 50 passed, 0 failed |
| `test:nutrition-enrichment` (NUT1) | 22 passed, 0 failed |
| `test:intelligence-companion-enrichment` (INT41) | 26 passed, 0 failed |
| Determinism | 3 compositions of the whole corpus, **byte-identical**; no `Date.now`/`Math.random`/`new Date()` in the engine |
| Full Result mutation | **none** — asserted per capability, and by `JSON.stringify` equality before/after |
| Fake or clipped ids | **0 / 672** emitted |
| Per-capability ceiling | ≤ 1,800 chars on every section; a caller requesting 999,999 is clamped (tested) |
| Capability representation | **180 / 180** sections; 0 turns lost a capability |
| Well-formed JSON | **180 / 180** sections (was 123 / 180) |
| `test:companion-benchmark -- --mode=full` × 3 | 100 scored; 0 hard gates; 0 hallucinations; 0 unreachable capabilities; verdict PARTIAL (unchanged) |
| Benchmark history | append-only; no prior artefact mutated or deleted |

**Artefacts**

```
docs/intelligence/benchmark/history/2026-07-08T19-29-37Z__8b01fff.{json,report.md}   # INT17 run 1
docs/intelligence/benchmark/history/2026-07-08T19-32-11Z__8b01fff.{json,report.md}   # INT17 run 2
docs/intelligence/benchmark/history/2026-07-08T19-34-33Z__8b01fff.{json,report.md}   # INT17 run 3
```

Baseline for every comparison: `2026-07-08T12-42-07Z__8b01fff` (BENCH4 AFTER, legacy truncation, same subject
commit, same mode, same world mode, same bundle, same acting user).

---

## 9. Definition of Done

| Requirement | Status | Evidence |
|---|---|---|
| One canonical Context Composition Engine exists | ✅ | `server/intelligence/context/`; INT16's layer **deleted**; `grep` finds no second serialiser of prompt context |
| Food Intelligence uses it | ✅ | registered `ContextViewSpec` for `food-intelligence:report`; **3/3 evidence groups** now reach the model, with `owningDomain` and `evidence[].source` |
| Existing capabilities remain unchanged | ✅ | 0 lines changed in any capability, handler, port, binding, or registry entry |
| LLM receives composed structured context | ✅ | **180/180** sections parse as JSON (was 123/180); no free-text summaries |
| Benchmark demonstrates equal or better answer quality with reduced token usage | ✅ / ⚠️ | **−25,576 exact prompt tokens (−19.6%), 0 questions costing more.** Quality: median 76.1 vs 75.7, `entityRefs` 121 → 164, 0 gates, 0 hallucinations. **⚠ The +0.4 composite is inside the noise floor and is not claimed as a result**; the quality case rests on `entityRefs`, on 3/3 evidence-group coverage, and on ND-059 answering from real Food Opportunity evidence in 3/3 runs (74.3 → 81.8, 0 → 3 refs) where the baseline gave generic advice. One genuine regression (CB-022) is recorded in §6.3. |
