# BENCH4 — Food Intelligence Reachability

**Status:** IMPLEMENTATION — Intent Resolver pattern coverage only. **No new capability, no Capability Registry change, no benchmark scoring change, no Food Intelligence business logic change.**
**Classification:** Intelligence Governance → Intent Engine (`server/intelligence/pattern-intent-resolver.ts`)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Subject at implementation:** HEAD `8b01fff`, clean working tree

**Governing documents read before implementation:**
`docs/architecture/README.md` (Architecture Bootstrap, mandatory entry point),
`docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`,
`docs/investigations/INTA1_INTELLIGENCE_PLATFORM_WIRING_AUDIT.md`,
`docs/implementation/BENCH3_INTENT_RESOLVER_R1_COVERAGE.md`,
BENCH3 run report `docs/intelligence/benchmark/history/2026-07-08T12-03-12Z__45443a8.report.md`.

**Discharges:** the single remaining **unreachable capability** BENCH3 left open —
*"`food-intelligence` remains unreachable — intended by ND-059 and CG-087, invoked by nothing"* (BENCH3 §6.2),
and INTA1 §3.12's *"shipped, tested reasoning engines that no user utterance can reach."*

---

## 0. ROLLBACK

Created **before** any file was modified. `git status` was confirmed **clean** at `8b01fff` first, so an
annotated tag on HEAD restores the tree exactly — no stash was needed.

| Identifier | Object | Restores |
|---|---|---|
| **`bench4-rollback-20260708`** | `8b01fff` | The complete pre-BENCH4 tree |

```bash
# Inspect
git show --stat bench4-rollback-20260708

# Restore the one file BENCH4 changed
git checkout bench4-rollback-20260708 -- server/intelligence/pattern-intent-resolver.ts
```

The same tag was used to produce the BEFORE benchmark run in §4, so the before/after comparison below is
**full-vs-full on one subject commit** — not the cross-subject, cross-mode comparison BENCH3 §6.4 had to warn about.

---

## 1. Scope

**In scope.** Extend the existing `PatternIntentResolver` matcher arrays so the two utterances that intend
`food-intelligence` actually resolve to it.

**Explicitly not done.**

- **No new capability.** Every intent emitted targets `food-intelligence`, registered since FI3 and bound/executable
  since FI4. `uplift` — INT42's phantom capability (INTA1 §3.13) — was **not** registered.
- No change to `capability-registry.ts` (`supportedIntents`, `executableIntents`, permissions, gaps).
- No change to any handler, binding, port, engine, or owning service. **Food Intelligence business logic is untouched.**
- No change to benchmark scoring, gates, weights, dimension weights, the alias table, or the question bundle.

**One file changed:** `server/intelligence/pattern-intent-resolver.ts` — **85 insertions, 0 deletions.**

---

## 2. Why `food-intelligence` was unreachable

Not a missing capability. A missing *matcher*.

`food-intelligence` has been registered, bound and executable for three verbs — `recommend`, `explain`, `report`
(`bindings/food-intelligence.ts:43`) — with a real Domain Intelligence engine behind each. But at
`bench4-rollback-20260708` the string `food-intelligence` appeared in `pattern-intent-resolver.ts`
**zero times** (verified: `git show bench4-rollback-20260708:… | grep -c` → `0`). No HTTP route invokes it either
(INTA1 §3.12). The capability was executable and unreachable simultaneously — which is exactly the condition
BENCH2's unreachable-capability metric was built to expose, and the last one it still reported.

INTA1 §5 (M8) proposed reaching it *via* `uplift` composition. That path requires registering a new capability
(`uplift`) and is out of scope here. The direct route is one matcher per question.

---

## 3. What changed

A new `FOOD_INTELLIGENCE_MATCHERS` array, registered in `ALL_SPECIFIC_MATCHERS`.

| Group | Question | Utterance | Capability · verb | Confidence |
|---|---|---|---|---:|
| **Food Intelligence** | ND-059 | *"What simple nutrition boosts can I add this week?"* | `food-intelligence` · `report` | `0.88` |
| **Food Intelligence** | CG-087 | *"Help me make this meal healthier without making it boring."* | `food-intelligence` · `report` | `0.87` |

### 3.1 Why `report`, and not `recommend` / `explain`

The three executable verbs are **not interchangeable**. Each is defined by the parameters it can honestly be given
(`handlers/food-intelligence-read-handler.ts`):

```
recommend {scope, slug}            — needs a canonical benefit/nutrient slug
explain   {scope, slug, foodSlug}  — needs that PLUS a specific food
report    {}                       — needs only the caller's own authenticated user id
```

Neither utterance names a benefit or a nutrient. Emitting `recommend` would require the resolver to **invent a slug** —
precisely the fabrication BENCH3 §3.2 refused for the analyser, and precisely what the handler's honest-gap contract
exists to prevent.

`report` needs no slug. It executes FI4's Food Opportunity Engine, which reads the caller's **own** planner, pantry and
shopping activity and returns cited, prioritised, deterministic Food Opportunities — *"what could you add?"* — which is
the question both utterances ask. The benchmark's own expectation table agrees, and says so in its own words: it aliases
both `uplift-engine` (ND-059) and `meal-uplift` (CG-087) onto `food-intelligence` because *"Food Intelligence owns
opportunity-engine.ts, the uplift/opportunity surfacing engine"* (`expectations.ts:101-103`, unchanged by BENCH4).

### 3.2 The two safety invariants these matchers must not break

1. **Read-only — INTA1 §8.1's standing constraint still holds.** `report` is in `READ_ONLY_VERBS`
   (`permissions.ts:25-27`), so `confirmationFor()` returns `"none"` and no confirmation round-trip is skipped.
   `food-intelligence` is `capabilityClass: "read-only"` with no write path (Rule FI1). INTA1 §8.1 warns that
   `detectWriteIntent`'s advisory-frame escape hatch — which reclassifies ND-059's *"can I **add**…"* as a read —
   is safe **only while no write verb is resolver-reachable**. BENCH4 introduces no write verb. The invariant is
   preserved unchanged, and this is the reason `report` is safe where `add` would not be.

2. **One delivery path.** `opportunity-delivery` (OD1) sits *above* this producer and adds duplicate-delivery
   prevention over the same `food-intelligence · report` output. It has **no resolver matcher**, so exactly one path
   to those opportunities exists today: this one. See §6.

### 3.3 Guards that keep the new matchers from stealing turns

- **ND-059 requires an uplift *noun*** (`boost`/`uplift`/`upgrade`/`improvement`/`win`) qualified by nutrition, or the
  verb form *"boost my nutrition"*. **PL-028** (*"Where can I add more vegetables, legumes, or fermented foods this
  week?"*) names no uplift noun and keeps its planner route untouched — verified below.
- **CG-087 is demonstrative/possessive-anchored** (`make this|that|the|my|our|it … healthier`), so a general
  food-knowledge question that merely contains "healthier" cannot acquire an uplift route.

**Verified by exhaustive probe** over all 100 fixture utterances: `food-intelligence` is now emitted for **exactly
ND-059 and CG-087**, and **no question lost a capability it previously routed to** (0 anomalies).

---

## 4. Result — BEFORE → AFTER (both `full`, 100 questions, subject `8b01fff`)

| | Run |
|---|---|
| **BEFORE** | `2026-07-08T12-39-28Z__8b01fff` — resolver restored from `bench4-rollback-20260708` |
| **AFTER** | `2026-07-08T12-42-07Z__8b01fff` — resolver with `FOOD_INTELLIGENCE_MATCHERS` |

Same subject commit, same mode, same bundle, same acting user, same deterministic judge tier. The AFTER run selected
the BEFORE run as its own baseline, so the report's §2 comparison is valid this time.

| Metric | BEFORE | AFTER | Δ |
|---|---:|---:|---:|
| **Unreachable capabilities** | `1` (`food-intelligence`) | **`0`** | **−1** |
| **R2 misroutes** | `14` | **`12`** | **−2** |
| **Intent Resolution Accuracy** | `82.7%` | **`85.2%`** | **+2.5pp** |
| **Overall Intelligence Score** | `75.3` | **`75.7`** | **+0.4** |
| **Capability utilisation** | `81.0%` | **`85.7%`** | **+4.7pp** |
| Capabilities never executed at all | `4` | `3` | −1 |
| Capability invocations | `204` | `206` | +2 |
| Routing failure reason `wrong-capability` | `21` | `19` | −2 |
| R1 capability misses | `0` | `0` | `0` |
| Capability reach | `100%` | `100%` | `0` |
| Hallucination rate | `0%` | `0%` | `0` |
| Honest-gap rate | `100%` | `100%` | `0` |
| Hard safety gates | `0` | `0` | `0` |
| Mean latency / turn | `1.38s` | `1.37s` | −0.01s |
| Release readiness | **PARTIAL** | **PARTIAL** | — |

**Capability utilisation — `food-intelligence` executed** (AFTER run, `capabilityUtilisation.exercised`):

```json
{ "capabilityId": "food-intelligence", "registered": true, "executable": true,
  "invocations": 2, "questions": 2, "succeeded": 2, "failed": 0, "threw": 0,
  "successRate": 1, "contributedToAnswer": 2, "contributionRate": 1,
  "verbs": ["report"], "statuses": { "ok": 2 }, "meanDurationMs": 60 }
```

Both invocations returned `ok` and **contributed grounding data to the answer** (`contribution: "grounding-data"`),
not an honest gap. `trust.householdAware = true` for the acting user.

**Per-question, and nothing else moved:**

| Question | Composite | Routing gate | Outcome |
|---|---|---|---|
| ND-059 | `55` → **`74.3`** | `R2` → **none** | `reached-other` → **`reached-intended`** (D4 band 1 → 4) |
| CG-087 | `55` → **`74.3`** | `R2` → **none** | `reached-other` → **`reached-intended`** (D4 band 1 → 4) |

**2 of 100** questions changed composite. The remaining 98 are byte-identical. Eight of ten domains moved `±0.0`;
only **Nutrition & Diary** (`71.8` → `73.7`) and **Companion Guidance** (`71.3` → `73.7`) changed. The AFTER report
records **Top regressions: None · Newly failing: None · Newly passing: CG-087, ND-059.**

The residual R2 set is the BENCH3 set minus the two: `PH-006, CB-012, CB-016, CB-018, CB-019, CB-021, PL-030, SH-042,
ND-054, ND-058, PR-070, CG-085`. No question regressed.

The verdict line no longer contains an unreachable-capability clause:

> *before:* `1 registered, executable capability/capabilities were never invoked by any question: food-intelligence.`
> *after:* *(clause absent)*

---

## 5. Read this before celebrating: reached, grounded — and half the evidence never reached the LLM

`food-intelligence` is now invoked, executes, and returns real cited data. That is what R2 measures, and it is now
satisfied. It is **not** the same as saying the answer is good.

For the acting user, `report` produces **10 opportunities** across all three of the Opportunity Engine's generators:

| Priority | Type | n | Example |
|---|---|---:|---|
| `high` | `planner-empty-day` | 7 | *"Monday in Week 6 has no meals planned yet."* |
| `high` | `shopping-restriction-conflict` | 1 | *"'worcestershire sauce' on your shopping list conflicts with a stored household restriction (Gluten)."* |
| `low` | `pantry-item-unused-in-plan` | 2 | *"Frozen peas is in your pantry but hasn't appeared in any of your planned meals yet."* |

**Only the first group reached the language model.** The gateway serialises each capability's result into the prompt's
`CONTEXT DATA` block and truncates it at `CAP_DATA_MAX_CHARS = 1_800` (`conversation-gateway.ts:252, 306-307`). The
serialised `report` payload is **3,918 characters**. Because the engine sorts by priority, the seven `high`
planner-empty-day entries consume the entire budget, and **zero** `shopping-restriction-conflict` and **zero**
`pantry-item-unused-in-plan` opportunities survive the cut (verified by reconstructing the exact truncated payload).

That single fact explains both answers:

- **ND-059 is genuinely answered from the opportunity report.** The truncated payload is *precisely* the planner-gap
  evidence, and the Companion says so: *"You don't have any meals planned for this week, so I can't suggest specific
  nutrition boosts to add."* Honest, grounded, cited, correct.

- **CG-087 reached the capability, and the one generator that would have answered it was truncated away.**
  `pantry-item-unused-in-plan` — *"Frozen peas is in your pantry but hasn't appeared in any of your planned meals yet
  → Plan a meal that uses Frozen peas"* — **is** meal-ingredient uplift, it **did** fire, and the LLM never saw it. It
  is `low` priority, so it sorts last, so it falls off the end of an 1,800-character window filled by seven high-priority
  planner gaps. The Companion fell back to general strategies. No fabrication, but no uplift either.

This is a **pre-existing gateway property, unchanged by BENCH4** — `CAP_DATA_MAX_CHARS` has always been 1,800, and the
Opportunity Engine has always sorted by priority. It was simply unobservable while `food-intelligence` was unreachable.
BENCH4 did not fix it because the fix is not resolver work: it is either a gateway change (raise or paginate the cap),
an engine change (return a priority-balanced slice rather than a priority-sorted prefix), or a handler change (the
`report` verb already accepts a `limit` the resolver could pass). All three are Food Intelligence / gateway workstreams,
and the scope of this change forbids touching that business logic. It is recorded as §7 item 4.

A scoring artefact worth restating from BENCH3 §5: both questions land at `74.3`, the band grounded turns generally
occupy. The `+19.3` each is the R2 composite cap (`≤ 55`) being lifted — **not** a judgement that the answers became
good. **The judge tier remains off**: 68 of 100 weight points are deterministic proxies. Answer quality here is a lower
bound, as every run report says. The benchmark cannot see the truncation, and would not have caught it. This section is
how it got caught.

---

## 6. One newly-failing assertion, reported rather than silenced

`server/tests/test-intelligence-capability-composition.ts` (INT42) goes **16 passed / 7 failed → 15 passed / 8 failed.**
BENCH4 flipped exactly one assertion, at `:99`:

```
✗ FAIL: no nutrient named → food-intelligence is NOT added (nothing to recommend for)
```

for the utterance *"what nutrition boosts should I add this week?"*.

**The test was not edited.** Here is what it means.

That assertion belongs to INT42's §2, which specifies an unbuilt design: a `NUTRITION_BOOST_WEEK_COMPOUND` matcher
routing weekly-boost questions to `opportunity-delivery · report`, adding `food-intelligence · recommend` only when a
nutrient is named — *"never `report` — that would reopen the double-delivery-path problem"*.

Three facts about that design, all verified:

1. **Its prerequisites do not exist.** `pattern-intent-resolver.ts` contains no `OPPORTUNITY_DELIVERY_MATCHERS` and no
   `uplift` matcher; `capability-registry.ts` has no `uplift` entry (`grep -c 'id: "uplift"'` → `0`). Seven of the
   section's assertions already failed before BENCH4 for exactly this reason.
2. **The flipped assertion was passing vacuously.** It asserts that food-intelligence is *absent*. Before BENCH4 the
   resolver could emit `food-intelligence` for **no utterance whatsoever** (`grep -c` → `0`). It passed because the
   capability was unreachable — the very defect BENCH4 exists to close.
3. **The double-delivery-path hazard is not reopened.** That hazard is `opportunity-delivery · report` and
   `food-intelligence · report` co-firing on one turn. BENCH4 emits **no** `opportunity-delivery` intent, so exactly
   one path to those opportunities exists. OD1's own module header confirms `food-intelligence`'s `report` is the
   *producer* verb, *"recomputed fresh from the producer on every `report`"*, with OD adding only the delivery
   lifecycle above it.

Routing to `opportunity-delivery` instead would not satisfy this workstream in any case: the benchmark's alias table
names `food-intelligence` as the intended capability for both questions, `opportunity-delivery` is
`capabilityClass: "write"` and persists `opportunity_deliveries` rows, and its fan-out to `food-intelligence` would not
appear in the turn's `resolved_intent` — so R2 would remain. That is a larger, governed change.

**This conflict is surfaced, not resolved.** It belongs to INT42/OD1, and there are only two honest endings: register
`uplift` + `OPPORTUNITY_DELIVERY_MATCHERS` (in which case BENCH4's matchers must yield, and the standing comment in
`FOOD_INTELLIGENCE_MATCHERS` says so explicitly), or delete the section that specifies a system nobody built. INT42's
suite is not in `npm test` and was already RED at `bench4-rollback-20260708` and at `bench3-rollback-20260708`.

---

## 7. Remaining work (not BENCH4)

1. **Intent accuracy 85% is still below the 90% floor.** The residual 12 R2 misroutes are the whole gap. They are a
   *disambiguation* problem (`meals` vs `meal-discovery`, `meals` vs `nutrition-discovery`), not a coverage problem.
2. **`opportunity-delivery` and `evidence-learning` remain unreachable** — registered, executable, no resolver matcher
   and no HTTP route. INTA1 §5 (M9). Neither is intended by any fixture question, so neither trips the unreachable
   gate; both still appear in "never executed at all".
3. **`templates` is never executed** — reachable, but no fixture question exercises it. A benchmark-coverage gap, not
   a platform gap.
4. **`CAP_DATA_MAX_CHARS` truncates away the Food Opportunity Engine's uplift evidence** (§5). The `report` payload is
   3,918 chars against an 1,800-char cap, and because opportunities are priority-sorted, **every**
   `pantry-item-unused-in-plan` and `shopping-restriction-conflict` opportunity is dropped before the LLM sees it.
   This is the direct cause of CG-087's generic answer. Three candidate fixes, none of them resolver work: raise or
   paginate the gateway cap; return a priority-*balanced* slice from the engine; or pass the `limit` parameter the
   `report` handler already accepts. Gateway / Food Intelligence workstream. **This defect exists for every capability
   whose result exceeds 1,800 chars — `food-intelligence` is simply the first one reachable enough to expose it.**
5. **INT42 must be resolved, not left RED** (§6).
6. **The judge tier is still hardcoded off** (`judge.ts`), so 68 of 100 weight points remain deterministic proxies.
   Every score in §4 — before and after — is a lower bound. INTA1 §6.4.

---

## 8. Verification

| Check | Result |
|---|---|
| `git status` before any modification | **clean** at `8b01fff` |
| Rollback created before modification | `bench4-rollback-20260708` → `8b01fff` |
| `npx tsc --noEmit` | **178 errors — identical to the pre-existing count** (INTA1 §1.3). **0 in `pattern-intent-resolver.ts`** |
| Resolver probe, all 100 fixture utterances | `food-intelligence` emitted for **exactly** ND-059 + CG-087; **0** previously-routed capabilities lost |
| `test-intent-resolver` (INT24) | 124 passed, 0 failed |
| `test-intelligence-compound-resolver` (INT33) | 109 passed, 0 failed |
| `test-intelligence-conversation-gateway` (INT18) | 64 passed, 0 failed |
| `test:intelligence-fallback` (INT35) | 82 passed, 0 failed |
| `test:benchmark-routing` | 101 passed, 0 failed |
| `test:benchmark-utilisation` | 70 passed, 0 failed |
| `test:intelligence-food-intelligence-binding` (FI3) | 36 passed, 0 failed |
| `test:intelligence-food-opportunity-binding` (FI4) | 40 passed, 0 failed |
| `test:intelligence-opportunity-delivery-binding` (OD1) | 50 passed, 0 failed |
| `test:companion-benchmark -- --mode=full` | 100 scored; 0 R1; 0 hard gates; 0 unreachable capabilities |
| `test-intelligence-capability-composition` (INT42) | **15 passed, 8 failed — was 16/7.** One assertion flipped by BENCH4; see §6. Was already RED at both rollback tags |

**Artefacts**

```
docs/intelligence/benchmark/history/2026-07-08T12-39-28Z__8b01fff.{json,report.md}   # BEFORE
docs/intelligence/benchmark/history/2026-07-08T12-42-07Z__8b01fff.{json,report.md}   # AFTER
```
