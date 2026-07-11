# BENCHINT3 — Intent Routing Attribution

**Status:** INVESTIGATION — attribution only. **No production code changed. No routing pathway created. No fix implemented.**
**Classification:** Intelligence Governance → Intent Engine × Benchmark Platform
**Workstream:** `BENCHINT` (Benchmark ⇄ Platform Integration). Successor to `BENCHINT1` (audit) and `BENCHINT2` (runtime convergence).
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Subject at investigation:** HEAD `8e10ea3`, dirty working tree (319 paths — pre-existing, unrelated)

**Rollback protection:**

| Item | Value |
|---|---|
| HEAD at start | `8e10ea32f41a6275d1fb1bc115be588ff8195a3d` |
| Rollback tag created | `rollback/before-benchint3-intent-routing-attribution-20260710` |
| Dirty-tree snapshot | `git stash` entry `BENCHINT3_ROLLBACK: pre-investigation dirty-tree snapshot 2026-07-10` (`6e405096b8e5a9e10065c357aea13a693e9a92bc`) |
| Tree verified restored | `git diff stash@{0} -- .` → empty; 319 paths, staged renames intact |
| Code modified | None — this document is the only artefact created |
| Schema modified | None |

**Governing documents read before this investigation:**
`docs/architecture/README.md` (Architecture Bootstrap, mandatory entry point),
`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1),
`docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17),
`docs/investigations/benchmarking/BENCHINT1_BENCHMARK_PLATFORM_INTEGRATION_AUDIT.md`.

**Benchmark ownership rule compliance:** the Companion Benchmark was **not executed** during this investigation. Every runtime claim below is derived either from the existing run artefact `docs/intelligence/benchmark/history/2026-07-10T10-48-57Z__8e10ea3.json` or from direct, read-only invocation of the production `patternIntentResolver` — a pure, I/O-free function. No run artefact was produced.

---

## 0. Assumptions and method

- **A1.** The benchmark report under attribution is `2026-07-10T10-48-57Z__8e10ea3` (mode `full`, `worldMode: "single-world"`, `repeats: 1`, headline **76.4**, `routingGatesFired: 12`, all R2). It is the newest artefact in `docs/intelligence/benchmark/history/`.
- **A2.** The 12 R2 failures are **deterministic**. The identical 12 ids fire in six consecutive artefacts spanning three commits (`5ba6ec2`, `f0ab371`, `8e10ea3`). This is expected: the Intent Resolver is a pure pattern matcher and the LLM sits downstream of routing.
- **A3.** Routing claims are not inferred from reading regexes. They were **reproduced** by calling the production `patternIntentResolver.resolve(utterance, { surface: "floating" })` directly, in a read-only harness, and comparing against the artefact. **All 12 reproduced exactly** — same capabilities, same order. Where this document states a confidence value, it is an observed value, not a value read off the source.
- **A4.** `single-world` mode runs against a live account (BENCHINT1 D8), so the *data* behind several answers is not the seeded Benchmark World. This affects answer quality, not routing: routing is decided before any capability is invoked.
- **A5.** One finding (§4.12, anomaly SH-042-A) could **not** be resolved statically and is recorded as an open question, not as a conclusion.

**Reproduction harness (read-only, not committed):** the resolver was invoked directly, and separately with `Array.prototype.slice` intercepted in the harness process to capture the intent pool *before* the `MAX_INTENTS` truncation. No production file was touched.

---

## 1. Verdict

**Not one of the twelve R2 failures is a routing *decision* failure. In every case the intended capability was never proposed by any matcher at all.**

The pre-truncation intent pool was captured for all twelve questions. In all twelve, `truncated = false` — the `MAX_INTENTS = 4` cap (`pattern-intent-resolver.ts:46`) never fired, and no candidate was ever outranked, outbid or displaced. The resolver did not choose the wrong capability from a set that contained the right one. **The right one was never in the set.**

That single fact eliminates four of the ten candidate causes named in the brief outright:

| Candidate cause | Implicated? | Evidence |
|---|---|---|
| Capability priority (ranking) | **Once, and only as a contributing cause** (CG-085) | pre-cap pool: `truncated=false` on 12/12 |
| Context Composition | **No — zero of twelve** | composition runs after `intelligencePlatform.handle`; no R2 turn reached it with a different capability set than the resolver emitted |
| Capability Registry (as a decision-maker) | **No — it makes no routing decision** | the registry carries *no* routing metadata at all (§6.1) — a negative finding, and the architectural root of much else |
| Discovery capability selection | **No — the gateway's owner-preference rule never fired against the intent** | `conversation-gateway.ts:926` selects `primaryOutcome`, not the routed set; it cannot un-route a capability |

What remains, as **primary** cause:

| Primary root cause | Questions | n |
|---|---|---|
| **Intent Resolver** — matcher coverage gap or keyword-fallback defect | CB-016, CB-018, CB-019, CB-021, ND-058, SH-042 | **6** |
| **Benchmark expectation** — the fixture names a capability the platform's own documented ownership contract assigns elsewhere | CB-012, PH-006, PL-030 | **3** |
| **Missing capability** — no registered verb/scope can answer the question | ND-054, PR-070 | **2** |
| **Capability priority** — a coverage-floor keyword fallback won because nothing better was proposed | CG-085 | **1** |

**Two systemic findings dominate, and both are measurement defects rather than platform defects:**

1. **Six of the twelve reached a capability the fixture itself names.** `capabilityFamily()` collapses a compound expectation such as `"shopping-list + analyser"` to its first token (`expectations.ts:212`, `raw.split("+")[0]`). 45 of the 100 fixture questions carry a compound capability. `reached-intended` then requires the *primary* token exactly, so a turn that invoked the fixture's own secondary is scored identically to a turn that invoked nothing relevant. R2 cannot presently distinguish "reached none of what was expected" from "reached the second of two expected".

2. **`routingRequired` is capability-granular; the fixture is verb-granular.** `capabilityFamily()` strips `.verb` before `resolveCapabilityStatus()` runs (`expectations.ts:214`, `:255`). So `planner.suggest` (PL-030) is classified `registered-executable` because `planner` can `read` — even though `suggest` is not in `planner`'s `supportedIntents` at all (`capability-registry.ts:376`). The same defect passes `nutrition-report.report` (ND-054) and `meal-discovery.recommend` (CB-021), both of which are declared honest gaps by their own bindings.

**Cost.** R2 caps 12 questions at 55 (`scorer.ts:85`), against a mean `rawComposite` of 71.5. The cap alone costs **1.99 headline points**; the accompanying D4 band-1 (3 of 12 weight, `scorer.ts`) rather than band-4 costs a further **1.08**. Total R2-attributable ≈ **3.1 of the 23.6 points** between today's 76.4 and 100. This is an **upper bound** on the recoverable amount: four of the twelve (CB-016, CG-085, ND-054, ND-058) would still answer with an honest gap after perfect routing, because the data or the capability scope does not exist.

---

## 2. Production routing path, as executed

The benchmark and production share one seam (BENCHINT1 §2, unchanged by this investigation). The routing decision is made entirely inside step [1] below; everything after it is a consequence.

```
utterance ──► PatternIntentResolver.resolve(utterance, hints)         pattern-intent-resolver.ts:2380
              │
              │  hints.surface = "floating"   ← companion-turn.ts:211
              │  SURFACE_CAP has NO "floating" key (:69-80)
              │  ⇒ NO surface-primary intent is injected on any benchmark turn
              │
              ├─ 0. ALL_COMPOUND_MATCHERS      (:2398)  2–3 intents each
              ├─ 1. ALL_SPECIFIC_MATCHERS      (:2411)  high confidence
              ├─ 3. KEYWORD_FALLBACKS          (:2423)  0.48 – 0.62, coverage floor
              ├─ 2. surface primary            (:2451)  ← never fires for "floating"
              ├─ 4. profile baseline           (:2456)  confidence 0.50, baseline: true, ALWAYS
              │
              └─ 5. dedupe(max conf per capability) → sort(desc conf) → slice(0, MAX_INTENTS=4)   (:2476)
                                                                                    ▲
                                                            never truncated on any R2 question
              │
              ▼
        queryable = resolvedIntents.filter(ri => !ri.gap)          conversation-gateway.ts:578
              │
              ▼  Promise.all — parallel                            conversation-gateway.ts:579-584
        intelligencePlatform.handle(intent, ctx)                    ← the capability probe observes here
              │
              ▼
        routedQueried = queried.filter(q => !q.baseline)            conversation-gateway.ts:667
        resolvedIntentPayload = { capabilities: routedQueried… }    conversation-gateway.ts:668-671
              │                                   ▲
              │           the `profile` baseline is EXCLUDED here — it ran, but it is not "routed"
              ▼
        persisted on the assistant turn                             conversation-gateway.ts:1329, :1332
              │
              ▼
        readInvokedCapabilities(assistantTurn, …)                   companion-turn.ts:86-101
        ⇒ CapturedTurn.invokedCapabilities, source "resolved-intent"
              │
              ▼
        classifyRouting(exp, turn, c)                               scorer.ts:290-300
        reachedIntended = invoked.includes(exp.capabilityFamily)
        outcome "reached-other" ∧ routingRequired  ⇒  gate R2        scorer.ts:314
```

**Three properties of this path decide every attribution below.**

- **P1 — `invokedCapabilities` is the *routed* set, never the *executed* set.** The `profile` baseline (`pattern-intent-resolver.ts:2456-2473`, confidence 0.50, `baseline: true`) executes on **every** turn and is filtered out at `conversation-gateway.ts:667`. `profile` therefore cannot be `reached-intended` unless one of the six `PROFILE_MATCHERS` (`:1107-1132`) fires a non-baseline profile intent. Two R2 questions (PH-006, CG-085) name `profile` as their intended capability and had `profile:read` execute and contribute to the answer — invisibly to the gate.
- **P2 — no surface primary exists for the benchmark.** `SURFACE_CAP` (`:69-80`) has no `"floating"` key, and `"floating"` is the surface every benchmark turn uses (`companion-turn.ts:211`) *and* production's default (`FloatingAssistant.tsx:73`). So on both paths the routed set is exactly: whatever the matchers produced. There is no page-context rescue.
- **P3 — the guaranteed floor is a keyword fallback.** `KEYWORD_FALLBACKS` (`:2260-2323`) is a flat list of 10 regexes at confidence 0.48–0.62. When no specific or compound matcher fires, these decide the turn. Six of the twelve R2 questions were routed **entirely** by keyword fallbacks.

---

## 3. Evidence: the pre-truncation intent pool

Captured by direct invocation of the production resolver. `*` marks the always-on `profile` baseline.

| Q | Intended | Pre-cap intent pool (capability@confidence) | Truncated? | Intended ever proposed? |
|---|---|---|---|---|
| CB-012 | `meal-discovery` | `meals@0.87  profile@0.50*` | no | **no** |
| CB-016 | `nutrition-discovery` | `profile@0.50*  meals@0.48` | no | **no** |
| CB-018 | `meal-discovery` | `profile@0.50*  meals@0.48` | no | **no** |
| CB-019 | `meal-discovery` | `household@0.60  profile@0.50*  meals@0.48` | no | **no** |
| CB-021 | `meal-discovery` | `profile@0.50*  meals@0.48` | no | **no** |
| CG-085 | `profile` | `planner@0.60  profile@0.50*` | no | baseline only |
| ND-054 | `nutrition-knowledge` | `diary-discovery@0.86  planner@0.60  profile@0.50*` | no | **no** |
| ND-058 | `nutrition-knowledge` | `planner@0.60  profile@0.50*  meals@0.48` | no | **no** |
| PH-006 | `profile` | `partners@0.78  profile@0.50*` | no | baseline only |
| PL-030 | `planner` | `household-discovery@0.86  planner-discovery@0.84  meal-discovery@0.84  profile@0.50*` | no | **no** |
| PR-070 | `analyser` | `household@0.60  profile@0.50*` | no | **no** |
| SH-042 | `shopping` | `analyser@0.78  profile@0.50*` | no | **no** |

**`MAX_INTENTS` truncated nothing. No candidate was outranked. Confidence never decided a single R2.** PL-030 alone reaches the cap of four, and its fourth slot is the 0.50 baseline — so nothing was dropped there either.

---

## 4. Complete R2 attribution report

Each record states: user intent · intended capability · actual capability · resolver responsible · decision path · confidence & evidence · root cause · smallest architectural change. `raw → 55` is `rawComposite` capped by `R2_MISROUTE_CAP` (`scorer.ts:85`).

---

### 4.1 CB-012 — "What chicken meals do I have?" *(72.8 → 55)*

| | |
|---|---|
| **User intent** | Filter the user's own saved cookbook by an ingredient. |
| **Intended (fixture)** | `meal-discovery.search` → family `meal-discovery` |
| **Actual** | `meals:search {query:"chicken"}` @ **0.87** |
| **Resolver responsible** | `MEALS_MATCHERS`, inverted-OVS matcher, `pattern-intent-resolver.ts:1891-1904` |
| **Decision path** | Specific matcher matched `/(what\|which)?\s*(.+?)\s+(meals?\|recipes?\|dishes?)\s+(have\s+i\s+got\|do\s+i\s+have)/i`. No `meal-discovery` matcher was proposed. |
| **Evidence used** | `meals:search` returned `grounding-data`; answer cited five real meals with real ids. `hallucination: false`. |

**Root cause: Benchmark expectation.** The resolver's own header states the ownership contract verbatim (`:1857-1859`):

> *"Meals (personal library queries only — explicit 'my meals' / 'my cookbook'). Discovery queries (no ownership qualifier) go to meal-discovery above."*

"What chicken meals **do I have**?" carries the ownership qualifier. The platform routed exactly as its architecture says it should, invoked the owning capability, and answered correctly. The fixture assigns a personal-library question to the discovery sibling.

**Smallest architectural change:** none in production. Re-target the fixture row to `meals.search`. *If* the product intent is that all ingredient filtering flows through `meal-discovery`, that is a capability-ownership decision for the Meals Capability Card — not a resolver change, and it would then also make CB-012's current behaviour a defect. **The two readings cannot both be right, and nothing in the governing architecture presently settles it.**

---

### 4.2 CB-016 — "Which meals are highest in protein?" *(65.3 → 55)*

| | |
|---|---|
| **User intent** | Rank saved meals by a macronutrient. |
| **Intended** | `nutrition.meal-search` → `nutrition-discovery` (via `DISCOVERY_RAW_REDIRECTS`, `expectations.ts:114-116`) |
| **Actual** | `meals:read {scope:"summary"}` @ **0.48** — the coverage-floor keyword fallback |
| **Resolver responsible** | `KEYWORD_FALLBACKS` meals entry, `pattern-intent-resolver.ts:2316-2322` |
| **Decision path** | Every `NUTRITION_DISCOVERY_MATCHERS` entry requires either a numeric threshold or an adjacency descriptor: `/\bhigh[\s-]protein\b/i` (`:594`). **"highest in protein" matches neither.** The nutrition keyword fallback (`:2290-2294`) does not contain nutrient names: verified `/\b(?:nutrients?\|vitamins?\|minerals?\|nutrition(?:al)?\|(?:health\s+)?benefits?)\b/i.test("protein") === false`. |
| **Evidence used** | `meals:read` returned `grounding-data`. Answer: *"You don't have any specific meals recorded … that indicate their protein content yet."* |

**Root cause: Intent Resolver — missing matcher.** The superlative/comparative nutrient form (*highest in X*, *most X*, *richest in X*) is uncovered, although `protein` is present in `KNOWN_NUTRIENT_TERMS` (`:130`) — the vocabulary exists; no matcher consults it in this shape.

**Contributing: Data availability.** Even a correct route returns nothing. BENCHINT1 D2 established that benchmark meals carry zero nutrition rows; BENCHINT2 P2 fixed the *seeder*, but this run is `single-world` against a live account, and the observed answer is exactly that gap.

**Smallest architectural change:** one `NUTRITION_DISCOVERY_MATCHERS` entry consuming the existing `KNOWN_NUTRIENT_TERMS` regex under a superlative frame. No new capability, no new pathway.

---

### 4.3 CB-018 — "Which meals include salmon?" *(72.8 → 55)*

| | |
|---|---|
| **User intent** | Filter meals by ingredient. |
| **Intended** | `meal-discovery.search` |
| **Actual** | `meals:read {scope:"summary"}` @ **0.48** — keyword fallback |
| **Resolver responsible** | `KEYWORD_FALLBACKS` meals entry, `:2316-2322` |
| **Decision path** | `MEAL_DISCOVERY_MATCHERS` (`:1701-1854`) cover imperative and open forms — *"find me a recipe for X"* (`:1703`), *"what can I cook with X"* (`:1788`), *"meal ideas"* (`:1816`), *"what should I cook tonight"* (`:1845`) — but **no interrogative ingredient-filter form** (*which meals include/contain/have X*). `MEALS_MATCHERS` require an ownership qualifier, which this utterance lacks. Both owner and discovery declined; the 0.48 floor caught it. |
| **Evidence used** | `meals:read` returned `grounding-data`; answer named the two real salmon meals. |

**Root cause: Intent Resolver — missing matcher.** By the resolver's own contract (`:1857-1859`), an unqualified discovery query belongs to `meal-discovery`; the fixture agrees; no matcher implements it.

**Smallest architectural change:** one `MEAL_DISCOVERY_MATCHERS` entry for `/(which|what)\s+meals?\s+(include|contain|have|use)\s+(.+)/i`.

---

### 4.4 CB-019 — "Which meals are suitable for everyone in my household?" *(72.8 → 55)*

| | |
|---|---|
| **User intent** | Filter meals by household-wide dietary compatibility. |
| **Intended** | `meal-discovery.search + household.read` → primary `meal-discovery` |
| **Actual** | `household:read {scope:"household"}` @ **0.60** + `meals:read {scope:"summary"}` @ **0.48** — both keyword fallbacks |
| **Resolver responsible** | `KEYWORD_FALLBACKS` household (`:2285-2289`, matches `everyone\s+in`) and meals (`:2316-2322`) |
| **Decision path** | No compound matcher, no specific matcher. Two independent fallbacks fired and the turn was grounded on both. |
| **Evidence used** | Both returned `grounding-data`; answer named the household-safe meal correctly. |

**Root cause: Intent Resolver — missing matcher.** `household-meal-matcher.ts` is the registry's declared `owningService` for exactly this question (`capability-registry.ts:513`), and no matcher reaches it.

**Contributing: Benchmark expectation.** `household` is the fixture's own secondary and **was invoked**. The R2 gate cannot see that, because `capabilityFamily("meal-discovery.search + household.read")` = `"meal-discovery"` (`expectations.ts:212-215`).

**Smallest architectural change:** one compound matcher emitting `meal-discovery:search` + `household:read` — the existing `ALL_COMPOUND_MATCHERS` shape (`:2398-2409`), which already returns 2–3 intents for cross-domain questions.

---

### 4.5 CB-021 — "Recommend one meal that fits my goals and explain why." *(72.8 → 55)*

| | |
|---|---|
| **User intent** | Recommend a meal against the user's stored goals. |
| **Intended** | `meal-discovery.search + profile.read` → primary `meal-discovery` |
| **Actual** | `meals:read {scope:"summary"}` @ **0.48** — keyword fallback; `profile:read` @ 0.50 baseline |
| **Resolver responsible** | `KEYWORD_FALLBACKS` meals entry, `:2316-2322` |
| **Decision path** | The resolver **explicitly reasons about this exact question** and deliberately withholds a profile route from it (`:1117-1121`): *"A bare 'my goals' is NOT enough: CB-021 ('recommend one meal that fits my goals') is a meal-discovery question that merely mentions goals, and must not acquire a profile route from it."* The intent is documented. **No `meal-discovery` matcher implements it.** |
| **Evidence used** | `meals:read` + `profile:read` (baseline) both returned data; the answer correctly cited the user's keto pattern and a real meal. |

**Root cause: Intent Resolver — a documented routing intent with no implementation.** This is the single clearest defect in the twelve: the resolver's own comment names the destination, and the code never goes there.

**Contributing: Missing capability (verb).** `meal-discovery`'s only executable verb is `search` (`handlers/meal-discovery-handler.ts:92`); `recommend` returns an honest gap (`bindings/meal-discovery.ts:32-34`). A matcher must therefore emit `search`, not the `recommend` the utterance literally asks for.
**Contributing: Benchmark expectation.** `profile` is the fixture's named secondary and executed as the baseline — invisible to the gate (P1).

**Smallest architectural change:** one compound matcher emitting `meal-discovery:search` + a non-baseline `profile:read`, exactly as the comment prescribes.

---

### 4.6 CG-085 — "I want to build muscle but also lower cholesterol. How should I plan?" *(77.8 → 55)*

| | |
|---|---|
| **User intent** | Nutrition guidance reconciling two health goals. |
| **Intended** | `profile + planner + nutrition` → primary `profile` |
| **Actual** | `planner:read {}` @ **0.60** — keyword fallback; `profile:read` @ 0.50 baseline |
| **Resolver responsible** | `KEYWORD_FALLBACKS` planner entry, `:2261-2266` |
| **Decision path** | The planner fallback pattern is `/\b(?:planner\|week(?:ly)?\|(?:meal\s+)?plan\|schedule)\b/i`. It matches the **verb** *"plan"* in *"How should I plan?"* — not a planner noun. Both `muscle` (as `muscle\s+(?:health\|recovery\|growth)`) and `cholesterol` are in `KNOWN_BENEFIT_TERMS` (`:132`), but every benefit matcher requires an explanatory frame (*"tell me about X"*, *"what is good for X"*); a first-person goal statement matches none. The nutrition keyword fallback contains no benefit words. |
| **Evidence used** | `planner:read` returned **`status: gap`, `contribution: no-knowledge`**. `fallbackState: "no-knowledge"`. Answer: *"I don't have trusted information stored about your meal plan yet — I'd rather say so than guess."* |

**Root cause: Capability priority — but only because nothing better was proposed.** A 0.60 coverage-floor fallback, firing on a verb, became the sole routed capability and produced an honest gap. The two capabilities that could have grounded the turn (`nutrition-knowledge` benefit explain; a non-baseline `profile:read`) were never candidates. This is the one question where the *ranking* mattered — and it mattered only because the pool contained a single non-baseline entry.

**This is the most harmful of the twelve.** The user asked a nutrition question and received a planner gap.

**Contributing: Benchmark expectation.** `planner` is the fixture's own secondary and was invoked; `profile` (the primary) executed as baseline.

**Smallest architectural change (two, independent):**
1. Constrain the planner fallback to a planner **noun phrase**, so the bare verb *"plan"* cannot claim a turn. This is a precision fix to an existing regex, not a new rule.
2. Add a benefit-goal matcher (*"I want to <benefit>"*) emitting `nutrition-knowledge:explain {benefitSlug}` — the verb is already executable (`bindings/nutrition-knowledge.ts:35`).

---

### 4.7 ND-054 — "How many plants have I eaten this week?" *(77.8 → 55)*

| | |
|---|---|
| **User intent** | Count distinct plant foods eaten over a time window (the "30 plants a week" concept). |
| **Intended** | `nutrition-report.read` → `nutrition-knowledge` (alias, `expectations.ts:96`) |
| **Actual** | `diary-discovery:search` @ **0.86**; `planner:read` @ **0.60** |
| **Resolver responsible** | `DIARY_DISCOVERY` matcher (`:735-765`); `KEYWORD_FALLBACKS` planner entry matching `week` (`:2261-2266`) |
| **Evidence used** | `diary-discovery:search` → `empty-result`; `planner:read` → `gap / no-knowledge`. `fallbackState: "no-results"`. |

**Root cause: Missing capability.** `nutrition-knowledge:read` supports exactly five scopes — `food \| nutrient \| benefit \| categories \| foods` (`handlers/nutrition-knowledge-read-handler.ts:137`). **None counts plants over a time window.** The `report` verb, which the fixture's alias implies, is an explicit honest gap (`bindings/nutrition-knowledge.ts:28-34`, handler `:414`). Plant-diversity logic lives in `nutrition-centre-assembler.ts` — which the registry already names as `nutrition-knowledge`'s `owningService` (`capability-registry.ts:402`) — but it is exposed through **no registered verb or scope**.

**Routing to the intended capability would have produced an honest gap.** The resolver's diary route is a defensible second-best, and it, too, gapped.

**Contributing: Capability priority.** The planner fallback fired on the word *"week"*, adding a second gapping capability that contributed nothing.

**Smallest architectural change:** a `scope` on `nutrition-knowledge:read` for plant diversity, delegating to the assembler the registry already declares as its owner. This is an extension of an existing capability by its existing owner — no new capability, no new pathway. Then one matcher.

---

### 4.8 ND-058 — "Which meals were strongest nutritionally this week?" *(65.3 → 55)*

| | |
|---|---|
| **User intent** | Rank the week's meals by nutritional quality. |
| **Intended** | `nutrition-report + planner/diary` → primary `nutrition-knowledge` |
| **Actual** | `planner:read` @ **0.60**; `meals:read` @ **0.48** — both keyword fallbacks |
| **Resolver responsible** | `KEYWORD_FALLBACKS` planner (`:2261`, on `week`) and meals (`:2316`) |

**Decision path — a verified regex-boundary defect.** The nutrition keyword fallback is `/\b(?:nutrients?|vitamins?|minerals?|nutrition(?:al)?|(?:health\s+)?benefits?)\b/i` (`:2290-2294`). Executed against the literal words:

```
"nutritionally"  → false      ← the utterance's word
"nutritional"    → true
"nutrition"      → true
```

The optional group ends at `nutritional`; the trailing `ly` defeats the `\b`. **The one adverbial form a user is most likely to say is the one form the fallback cannot see.** `nutrition-knowledge` was therefore never proposed.

**Evidence used:** `planner:read` → `gap / no-knowledge`; `meals:read` → `grounding-data`. Answer: *"I couldn't find any logged meals in your food diary for this week."*

**Root cause: Intent Resolver — keyword-fallback regex boundary defect.**
**Contributing: Data availability** (no meal nutrition rows to rank); **Benchmark expectation** (`planner` is the fixture's named secondary and was invoked).

**Smallest architectural change:** `nutrition(?:al(?:ly)?)?` — one token. The general lesson is larger and is taken up in §5 RC2.

---

### 4.9 PH-006 — "What supermarkets and budget preferences have I selected?" *(65.3 → 55)*

| | |
|---|---|
| **User intent** | Read back two stored preferences: retailers, and budget tier. |
| **Intended** | `profile.read` |
| **Actual** | `partners:read {scope:"retailers"}` @ **0.78**; `profile:read` @ 0.50 **baseline** |
| **Resolver responsible** | `ANALYSER/PARTNERS` specific matcher on `supermarkets`; `KEYWORD_FALLBACKS` partners entry (`:2305-2310`) |
| **Evidence used** | `partners:read` → `grounding-data` (nine retailers, all named correctly). `profile:read` (baseline) → `context-only`. The answer **correctly states both halves**: *"You have selected a standard budget level … The supermarkets available to you include Tesco, Sainsbury's, …"* |

**Root cause: Benchmark expectation, compounded by baseline exclusion (P1).**

This is a two-owner question. `partners` genuinely owns retailers — `apiSurface: "/api/basket/supermarkets-enhanced, /api/routing, /api/savings/*"` (`capability-registry.ts:473`). `profile` genuinely owns budget — `apiSurface: "/api/profile, /api/user/preferences, …"` (`:459`). **Both capabilities executed. Both facts reached the model. The answer is right.** The gate fired because the fixture names one primary, and because the capability that answered the *other* half did so as a baseline read, which `conversation-gateway.ts:667` strips from `resolvedIntent` by design.

The structural consequence is worth naming precisely: **`profile` is `reached-intended` only when one of the six `PROFILE_MATCHERS` (`:1107-1132`) fires.** Whenever `profile` answers as the always-on baseline — which is every other turn in the corpus — it is unmeasurable. That is correct for `resolvedIntent`'s purpose (a baseline is not understanding) and wrong for a routing gate that treats "intended capability" as "capability that should have supplied the answer".

**Smallest architectural change:** benchmark-side. Either add a `PROFILE_MATCHERS` entry for `/\bwhat\s+.*\bpreferences?\s+have\s+i\b/i`, or — better — let the expectation record carry both named owners and score `reached-secondary` distinctly. Do **not** start counting baseline reads as routed: that would make `profile` trivially reached on 90 % of turns and destroy the gate's meaning.

---

### 4.10 PL-030 — "What would be a good quick dinner for Tuesday?" *(77.8 → 55)*

| | |
|---|---|
| **User intent** | Suggest a quick meal for a specific planner day. |
| **Intended** | `planner.suggest + meals` → primary `planner` |
| **Actual** | `household-discovery:search {query:"tuesday"}` @ **0.86**; `planner-discovery:search` @ **0.84**; `meal-discovery:search {query:"quick"}` @ **0.84** |
| **Evidence used** | `meal-discovery:search` → `grounding-data`; `planner-discovery` and `household-discovery` → `empty-result`. Answer recommended two real quick meals. **`reachedCapability: meal-discovery`.** |

**Root cause: Benchmark expectation.** `suggest` **is** a member of `IntentVerb` (`types.ts:51`), but it is **not** in `planner`'s `supportedIntents` (`capability-registry.ts:376`), and `planner`'s executable verbs are `read \| explain \| add` (`bindings/planner.ts:40`). The fixture names an operation the planner capability does not have. `capabilityFamily()` strips `.suggest` (`expectations.ts:214`) and `resolveCapabilityStatus("planner")` then returns `registered-executable` on the strength of `read` — so `routingRequired` is set true for an operation that cannot run. The capability that actually owns "suggest a quick dinner" is `meal-discovery`, and **the platform reached it and answered correctly**.

**Contributing: Capability priority (a real, if harmless, defect).** `household-discovery:search {query:"tuesday"}` won the turn at 0.86, having extracted a **weekday** as a household search term. It returned `empty-result`. Nothing broke, because the gateway's `primaryOutcome` rule takes the first `ok-data` outcome and there was only one — but a matcher that treats "Tuesday" as a household query is mis-scoped, and at a higher confidence than the capability that answered.

**Smallest architectural change:** benchmark-side, verb-aware `resolveCapabilityStatus` (§7 T1.2) — which reclassifies `planner.suggest` as unbound and removes the routing requirement. Separately, and independently, the `household-discovery` weekday match deserves a guard.

---

### 4.11 PR-070 — "Does this product fit my household restrictions?" *(65.3 → 55)*

| | |
|---|---|
| **User intent** | Assess a specific product against household dietary rules. |
| **Intended** | `product-analysis + household` → primary `analyser` (alias, `expectations.ts:88`) |
| **Actual** | `household:read {scope:"household"}` @ **0.60** — keyword fallback |
| **Evidence used** | `household:read` → `grounding-data`. Answer: *"You don't have any diet restrictions recorded in your profile … your diet pattern is Keto."* |

**Root cause: Missing capability, compounded by absent deictic context.**

`analyser`'s **only** executable operation is `read { scope: "additives" }`, which returns `storage.getAllAdditives()` — the static additives reference table (`handlers/analyser-read-port.ts:6`, `:57`). There is **no per-product read**; `explain`, `analyse` and `report` are declared honest gaps (`bindings/analyser.ts:27-34`). Further, *"this product"* has no referent: the benchmark passes `surfaceHints: {}` (`companion-turn.ts:211`), and BENCHINT1 §4 established production passes none either.

The resolver's behaviour here is **deliberately correct**. `analyserUnexecutable()` (`:1985-1991`) exists precisely to refuse emitting an analyser intent for a verb with no live code path, and `ANALYSER_MATCHERS` decline utterances lacking additives/UPF/NOVA vocabulary. The comment at `:1948-1957` names the trade explicitly: *"Forcing these onto `read { scope: 'additives' }` would … hand the answer generator an additives table for a question about apple scores — a fabrication risk."* **Routing to the intended capability would have been the fabrication the architecture forbids.**

**Contributing: Benchmark expectation** — `household` is the fixture's own secondary, and was invoked.

**Smallest architectural change:** none in the resolver. Either the `analyser` Capability Card gains a per-product read with a product in scope, or the fixture accepts `household` and this question is scored as an honest gap. **This is a capability decision, not a routing one.**

---

### 4.12 SH-042 — "Which items should I check for allergens or additives?" *(72.8 → 55)*

| | |
|---|---|
| **User intent** | Flag shopping-list items warranting an allergen/additive check. |
| **Intended** | `shopping-list + analyser` → primary `shopping` (alias, `expectations.ts:92`) |
| **Actual** | `analyser:read {scope:"additives"}` @ **0.78** |
| **Resolver responsible** | `ANALYSER_MATCHERS` first entry, `:1994-2002` (fires on `additives`) |
| **Decision path** | The shopping keyword fallback requires `/\b(?:shopping\s+list\|basket\|grocery\|groceries)\b/i` (`:2267-2272`). The utterance's subject noun is **"items"**, which matches nothing. `shopping` was never proposed. |

**Root cause: Intent Resolver — missing matcher.** "Items" is not shopping vocabulary anywhere in the resolver.
**Contributing: Benchmark expectation** — `analyser` is the fixture's own secondary and was invoked.

---

#### ⚠ Anomaly SH-042-A — an answer whose grounding this investigation cannot account for

**This is recorded as an open question, not a conclusion.**

The answer reads: *"In your shopping list, you should check the **beef stock** and **topping parmesan** … Whole foods like onion, olive oil, lean beef, oregano, and can tomato …"* — a correct, specific enumeration of the acting user's shopping list. `entityRefCount: 8`, `hallucination: false`, `fallbackState: null`.

The turn's grounding, so far as static reading can establish it, contained no shopping list:

| Path | Finding | Citation |
|---|---|---|
| Routed capability | `analyser:read {scope:"additives"}` → `storage.getAllAdditives()`, the **static additives reference table** | `handlers/analyser-read-port.ts:6`, `:57` |
| Baseline capability | `profile:read` → `context-only` | artefact `capabilityInvocations` |
| Any other capability | none — the probe observes every `intelligencePlatform.handle` call | `capability-probe.ts:124-169` |
| Conversation history | **empty** — BENCHINT2 closes the thread after every question (`companion-turn.ts:276`), and the prompt window is thread-scoped (`getRecentTurns(thread.id, 7)`, `conversation-gateway.ts:1297`) | |
| Enrichment | both builders take `queryResults.get("nutrition-knowledge")`, which was absent this turn | `conversation-gateway.ts:879-892` |

The two named items appear **verbatim** in the answers to SH-039 and SH-040, three and two questions earlier in the same run — turns on which `shopping:read` *did* execute.

Two readings, and this investigation cannot choose between them without a runtime observation:

- **(a)** The response is a fabrication that happens to be correct — which two exact, unusual item names ("topping parmesan") makes improbable, and which `hallucination: false` failed to catch because the judge is disabled and D1/D2 are deterministic proxies (BENCHINT1 D9; the report's own verdict line says so).
- **(b)** A grounding path exists that neither the capability probe nor this static reading sees.

**Either reading is significant, and (b) more so:** a byte of CONTEXT DATA reaching the model outside the Capability Registry would contradict the Context Composition Engine's §0 mandate (*"Every byte of grounding context the language model reads is composed by it, from Context Views"*). **Until this is resolved by observation, SH-042's plausible answer must not be read as evidence that misroutes are harmless.**

---

## 5. Grouped root causes

| ID | Root cause | Questions (primary) | n | Class |
|---|---|---|---|---|
| **RC1** | **Resolver matcher coverage** — interrogative / superlative / goal-statement forms fall through to the 0.48–0.62 keyword floor | CB-016, CB-018, CB-019, CB-021, SH-042 | 5 | Intent Resolver |
| **RC2** | **Keyword-fallback precision** — fallbacks match verbs and morphology accidents, not domains | ND-058 (`nutritionally` false negative) | 1 primary, 3 contributing (CG-085 `plan`, ND-054 `week`) | Intent Resolver |
| **RC3** | **Expectation encoding** — compound collapse + verb-blind `routingRequired` | CB-012, PH-006, PL-030 | 3 primary, 6 contributing | Benchmark expectation |
| **RC4** | **Missing capability surface** — no registered verb/scope can answer | ND-054 (plant diversity), PR-070 (per-product read) | 2 | Missing capability |
| **RC5** | **Missing routing metadata** — the Capability Registry carries none | — (architectural; underlies RC1–RC3) | 0 direct | Capability Registry |
| **RC6** | **Baseline exclusion** — `profile` unmeasurable when it answers as the always-on read | PH-006, CG-085, CB-021 (contributing) | 0 primary | Other (measurement) |

**Explicitly not implicated:** Context Composition (0/12 — it is downstream of the routed set and received exactly what the resolver emitted), Discovery capability selection (0/12 — the gateway's owner-preference rule at `conversation-gateway.ts:926` selects `primaryOutcome` from outcomes, and cannot add or remove a route), Capability Registry as a decision-maker (it makes none).

### RC2 in detail — the keyword floor is doing work it was not designed for

Six of twelve R2 turns were routed **entirely** by `KEYWORD_FALLBACKS`. The list's own comment concedes its status (`:2313-2316`): the meals entry is *"a coverage floor for otherwise-unmatched meal queries"* whose confidence *"must never displace the personalisation baseline"*. It is behaving as designed. The defect is that half the misroutes never reach a designed matcher at all, so a coverage floor becomes the routing decision — and a coverage floor is tuned for *recall*, not for *correctness*.

Three distinct sub-defects, all verified by execution:

| Sub-defect | Instance | Verified |
|---|---|---|
| False negative — morphology | `nutrition(?:al)?\b` cannot match `nutritionally` | `regex.test("nutritionally") === false` |
| False negative — vocabulary | the nutrition fallback contains **no nutrient names** and **no benefit names**, though both vocabularies exist as `KNOWN_NUTRIENT_TERMS` (`:130`) and `KNOWN_BENEFIT_TERMS` (`:132`) | `regex.test("protein") === false`; `regex.test("cholesterol") === false` |
| False positive — part of speech | the planner fallback matches the **verb** *plan* (CG-085) and the bare noun *week* (ND-054) | observed routes |

---

## 6. Architectural impact assessment

### 6.1 The Capability Registry owns no routing metadata — a verified negative finding

The `Capability` interface (`types.ts:223-262`) carries `id, displayName, description, owner, owningService, apiSurface, supportedIntents, executableIntents, permissions, capabilityClass, aiAccess, availability, guidance?, enrichment?`.

**There is no `priority`, `rank`, `weight`, `confidence`, `surface`, or `discovery` field on any of the 23 registered capabilities.**

TIP1 §5.2 states that *"the registry is the capability allow-list"* and that *"routing is a pure lookup: `intent.action → capability → existing service call`. No branching business logic lives in the router."* The platform honours the second half. But the *selection* of `intent.action` — the only genuinely hard decision in the pipeline — is expressed as roughly two hundred hand-assigned float literals scattered across a 2,483-line file, with no owner, no calibration record, and no test that any pair of them is correctly ordered. Confidence 0.86 for `household-discovery:search {query:"tuesday"}` (PL-030) sits above 0.84 for the `meal-discovery` search that actually answered the question, and nothing anywhere would notice.

**This is the architectural root of RC1 and RC2.** It is not, however, a licence to build a ranker: Context Composition §7 forbids *"any relevance mechanism that is non-deterministic, network-bound, or semantic (an embedding, a model call, a learned ranker)"*, and TIP1 R4 forbids the Intent Engine growing business logic. The correct move is narrower and is given in §7 T3.1.

### 6.2 The owner ↔ discovery relationship is real architecture with three uncoordinated expressions

The relationship (`meals` ↔ `meal-discovery`, `nutrition-knowledge` ↔ `nutrition-discovery`, `planner` ↔ `planner-discovery`, …) is load-bearing: Context Composition §4.5 depends on it to decide when two capabilities may be merged without asserting a false provenance. It exists in three places, none of which is the registry:

| Site | Form | Consumer |
|---|---|---|
| `context/context-composition-engine.ts:306-330` | `DISCOVERY_SUFFIX`, `domainStem()`, `sameEntityFamily()` | cross-capability merge guard (`:467`) |
| `conversation/conversation-gateway.ts:926` | inline `!o.capabilityId.endsWith("-discovery")` | `primaryOutcome` selection |
| `pattern-intent-resolver.ts:1857-1859` | **a prose comment** | nothing — it is not enforced by any code |

Context Composition §7 already names the hazard: *"Any second list of native Context Views, anywhere — stop."* The same reasoning applies to a second (and third) statement of the owner/discovery pairing. Open item 5 of that document warns that if the registry ever adds a pair the stem rule cannot see, *"merging silently stops for it — safely (it emits twice), but silently."*

The third expression is the worst: the resolver's ownership contract — *personal-library queries to `meals`, discovery queries to `meal-discovery`* — is the rule that decides CB-012 and CB-018 in opposite directions, and it exists **only as a comment**. Nothing tests it. Nothing prevents the next matcher from contradicting it. It contradicted itself already: `:1119-1121` declares CB-021 a `meal-discovery` question, and no `meal-discovery` matcher can route it.

### 6.3 The benchmark's expectation record is less expressive than its own fixture

`capabilityFamily()` reduces `"A + B"` to `A` (`expectations.ts:212-215`), and `resolveCapabilityStatus()` runs on the verb-stripped family (`:214`, `:255`). Two consequences:

- **45 of 100** fixture questions carry a compound capability, of which **7** are R2 and **6** invoked a capability the fixture itself names. `RoutingOutcome` has no value for this state: it is scored `reached-other`, identically to a turn that reached something unrelated.
- Three R2 questions name a verb that cannot run — `planner.suggest` (not in `supportedIntents`), `nutrition-report.report` (an honest gap), `meal-discovery.recommend` (an honest gap) — yet `routingRequired` is true for all three, because the *capability* has some other executable verb.

`expectations.ts` is otherwise the model to follow, exactly as BENCHINT1 D6 said: it reads capability truth live from `intelligencePlatform.registry.list()` (`:72-74`) and fails loudly at load if an alias names a non-existent capability (`:146-155`). The gap is that it validates the capability and discards the verb.

### 6.4 What none of this touches

The Context Composition Engine is not implicated in any of the twelve. It received exactly the capability set the resolver emitted, composed it under budget, and preserved every id (`0 of 636 emitted ids are fake`, INT17 §4.4). **No change to it is proposed, and none is warranted by this evidence.** The Behaviour Engine, the Observation Engine and the Decision Engine are likewise untouched by R2.

---

## 7. Prioritised implementation plan

Ordered by *value per unit of change*. Constrained to convergence: **no new routing pathway, no second resolver, no ranker, no duplicated ownership.**

> **Ordering constraint.** Tier 1 must land **before** Tier 2. Changing matcher coverage while the expectation record is still verb-blind and collapses compounds would move the score for two reasons at once, and the movement would be uninterpretable. This is the same argument BENCHINT1 §11 made for its tasks 1 and 2.

### Tier 1 — Measurement honesty. Benchmark-side only; **no production code**. Nothing else should ship first.

- **T1.1 — Carry every capability the fixture names.** Extend `ExpectationRecord` with `secondaryCapabilityFamilies: string[]`, and add a `reached-secondary` member to `RoutingOutcome`. Score it as its own state; **do not silently widen R2**. Six of twelve R2s are presently mislabelled. Report both numbers so the trend line stays readable across the change.
- **T1.2 — Make `routingRequired` verb-aware.** `resolveCapabilityStatus` must consider `(capability, verb)`, not `capability`. A fixture verb absent from `supportedIntents`, or present but absent from `executableIntents`, is `registered-unbound` at verb granularity and must not require a route. Closes the `planner.suggest` / `nutrition-report.report` / `meal-discovery.recommend` class. `expectations.ts` already reads the live registry — this is an extension of its existing lookup, not a new source of truth.
- **T1.3 — Reconcile the three fixture rows that contradict the platform's documented ownership.** CB-012 (`meal-discovery` → `meals`, per `:1857-1859`), PL-030 (`planner.suggest` → `meal-discovery`), PR-070 (decide: accept `household`, or commit to an analyser per-product read). **This requires a governance decision, not an edit** — see T4.2.

### Tier 2 — Resolver coverage and precision. Production; one owner (`pattern-intent-resolver.ts`); no new pathway.

- **T2.1 — Fix `nutritionally`.** `nutrition(?:al(?:ly)?)?`. One token. Closes ND-058's proximate cause.
- **T2.2 — Give the nutrition fallback the vocabularies that already exist.** Consult `KNOWN_NUTRIENT_TERMS` (`:130`) and `KNOWN_BENEFIT_TERMS` (`:132`) rather than a third, shorter word list. This is de-duplication, not addition.
- **T2.3 — Constrain the planner fallback to a planner noun phrase**, so the verb *"plan"* (CG-085) and the bare noun *"week"* (ND-054) cannot claim a turn. Precision fix to an existing regex.
- **T2.4 — Superlative / comparative nutrient forms** → `nutrition-discovery:search` (*highest in X*, *most X*, *richest in X*, *strongest nutritionally*). Closes CB-016.
- **T2.5 — Interrogative library filters** → the owner the registry link (T3.1) names (*which meals include / contain / are suitable for …*). Closes CB-018, CB-019.
- **T2.6 — Implement the routing the resolver already documents at `:1119-1121`**: a compound matcher emitting `meal-discovery:search` + non-baseline `profile:read` for CB-021. Verb must be `search`; `recommend` is a gap.
- **T2.7 — Shopping vocabulary: "items" in a shopping frame.** Closes SH-042's routing cause.
- **T2.8 — Guard `household-discovery` against weekday tokens** (PL-030's `{query:"tuesday"}` at 0.86). Harmless today; mis-scoped, and out-ranking the capability that answered.

### Tier 3 — Consolidate the owner/discovery relationship onto its existing owner. Extension, not a new system.

- **T3.1** — Add the owner ↔ discovery link to the **Capability Registry entry** (the single allow-list TIP1 §5.2 already designates), and have `context-composition-engine.ts:306-330` and `conversation-gateway.ts:926` **read it** instead of each computing its own stem rule. One owner, two consumers, one prose comment retired into code.
  **This is a pure consolidation. It must change no behaviour**, and the acceptance test is that the composed CONTEXT DATA block is byte-identical over the 100-question corpus (INT17 §4.7 guarantees determinism, so this is checkable).
  It also closes Context Composition open item 5 (*"if the registry ever adds a pair the stem rule cannot see, merging silently stops for it — safely, but silently"*).
  **Explicitly not proposed: a `priority` or `confidence` field on the registry.** Confidence is a resolver concern; moving it to the registry would make the registry a ranker, which §6.1's citations forbid.

### Tier 4 — Capability surface. Real product work; **outside the BENCHINT workstream's ownership.**

- **T4.1** — A plant-diversity read scope on `nutrition-knowledge`, delegating to `nutrition-centre-assembler.ts` — already that capability's declared `owningService` (`capability-registry.ts:402`). Extension of an existing capability by its existing owner. Then one matcher. Closes ND-054.
- **T4.2** — Decide `analyser`'s per-product read (PR-070). Either the Analyser Capability Card gains a product-scoped read *and* the turn gains a product referent, or the question is accepted as an honest gap and the fixture re-targeted. **Do not force `analyser:read {scope:"additives"}` onto it** — `:1948-1957` names that as a fabrication risk, and `analyserUnexecutable()` (`:1985-1991`) exists to prevent it.

### Tier 5 — The anomaly. Blocks any conclusion about misroute harmfulness.

- **T5.1** — Resolve **SH-042-A** (§4.12) by runtime observation: capture the literal CONTEXT DATA block for that one turn and establish which bytes carried the shopping items. If the answer is ungrounded, it is a Principle 6 breach that the deterministic hallucination proxy did not catch, and it is more important than every routing item above. If a grounding path exists outside the Capability Registry, it contradicts Context Composition §0 and is more important still.

---

## 8. Proposed BENCHINT4 implementation tasks

Each names its single smallest change, its owner file, the root cause it closes, and its risk. **None was implemented during this investigation.**

| # | Task | Files | Closes | Risk |
|---|---|---|---|---|
| 1 | Resolve anomaly SH-042-A by observing one turn's CONTEXT DATA | (observation only) | §4.12 | **RED** — may invalidate the "answers were fine" reading of six R2s; blocks task 10 |
| 2 | `ExpectationRecord.secondaryCapabilityFamilies` + `reached-secondary` outcome; report separately from R2 | `server/tests/benchmark/expectations.ts`, `scorer.ts`, `types.ts`, `aggregate.ts`, `report.ts` | RC3 | AMBER — changes what R2 counts; first post-change run is a new baseline |
| 3 | Verb-aware `resolveCapabilityStatus` / `routingRequired` | `server/tests/benchmark/expectations.ts` | RC3 | AMBER — removes the routing requirement from 3 questions; same baseline caveat |
| 4 | `nutrition(?:al(?:ly)?)?` boundary fix | `server/intelligence/pattern-intent-resolver.ts` | RC2 | GREEN |
| 5 | Nutrition fallback consults `KNOWN_NUTRIENT_TERMS` / `KNOWN_BENEFIT_TERMS` instead of a third word list | `pattern-intent-resolver.ts` | RC2 | AMBER — widens the nutrition route; verify no regression on FK-*/ND-* |
| 6 | Planner fallback requires a planner noun phrase, not the verb "plan" or bare "week" | `pattern-intent-resolver.ts` | RC2 | AMBER — planner is the highest-traffic fallback; regression-test PL-* |
| 7 | Superlative/comparative nutrient matcher → `nutrition-discovery:search` | `pattern-intent-resolver.ts` | RC1 (CB-016) | GREEN |
| 8 | Interrogative library-filter matchers (`which meals include/contain/are suitable for …`) | `pattern-intent-resolver.ts` | RC1 (CB-018, CB-019) | AMBER — depends on task 9 settling the owner |
| 9 | Owner ↔ discovery link as registry metadata; `context-composition-engine.ts` and `conversation-gateway.ts:926` read it | `server/intelligence/capability-registry.ts`, `types.ts`, `context/context-composition-engine.ts`, `conversation/conversation-gateway.ts` | RC5, §6.2 | AMBER — touches the Context Composition Engine; acceptance is **byte-identical** composed context over the corpus |
| 10 | Implement the compound matcher the resolver documents at `:1119-1121` (CB-021) | `pattern-intent-resolver.ts` | RC1 | GREEN |
| 11 | Shopping vocabulary: "items" in a shopping frame | `pattern-intent-resolver.ts` | RC1 (SH-042) | GREEN |
| 12 | Guard `household-discovery` against weekday tokens | `pattern-intent-resolver.ts` | §4.10 | GREEN |
| 13 | **Governance, not code:** settle the `meals` ↔ `meal-discovery` ownership boundary and record it in the Meals / Meal Discovery Capability Cards, replacing the prose comment at `:1857-1859` | `docs/architecture/capabilities/meals.md` (+ a Meal Discovery card) | CB-012, §6.2 | GREEN |
| 14 | **Governance, not code:** decide `analyser`'s per-product read (PR-070) | `docs/architecture/capabilities/analyser.md` | RC4 | GREEN |
| 15 | Plant-diversity read scope on `nutrition-knowledge` via `nutrition-centre-assembler.ts` | `server/intelligence/handlers/nutrition-knowledge-read-handler.ts`, `-read-port.ts`, `capability-registry.ts` | RC4 (ND-054) | AMBER — new scope on a bound capability; must not re-own assembler logic |
| 16 | Regression test: every `RoutingOutcome` value is produced by at least one corpus question, and the pre-cap intent pool is asserted for a pinned set of utterances | new `server/tests/test-intent-resolver-routing-attribution.ts` | protects §3 | GREEN |

**Sequencing.** Task 1 first — it may change what "harmless misroute" means. Tasks 2 and 3 must land together and before tasks 4–12, or the score movement is uninterpretable. Task 9 must precede task 8, because task 8 needs the owner/discovery boundary settled in code. Task 13 must precede task 8 as governance input.

**Deliberately absent:** no task raises `MAX_INTENTS`. It never fired (§3). Raising it would be a fix for a problem the platform does not have, and would cost latency on every turn (`:45`).

---

## 9. Constraint compliance

| Constraint | Status |
|---|---|
| Do not implement fixes | **Held** — no source file was modified. This document is the only artefact created |
| Do not modify production code | **Held** — verified: `git status` shows no change under `server/` attributable to this work; the reproduction harness lives in the session scratchpad and imports the production resolver read-only |
| Do not create new routing pathways | **Held** — every task extends an existing matcher array, an existing registry entry, or a benchmark-side expectation record |
| Do not duplicate routing logic | **Held** — task 9 *removes* two duplicate stem rules; tasks 5 and 10 *reuse* vocabularies and intents that already exist. No task adds a second resolver, ranker, or embedding (Context Composition §7) |
| Do not recommend new routing systems | **Held** — no ranker, no learned selection, no second Intent Engine. §6.1 explicitly declines to add a `priority` field to the registry |
| Respect existing architectural ownership | **Held** — `pattern-intent-resolver.ts` owns confidence; `capability-registry.ts` owns capability metadata; `nutrition-centre-assembler.ts` keeps plant diversity; the Context Composition Engine's §0 mandate is neither extended nor contradicted |
| Extend the existing architecture only | **Held** — task 9 populates the registry TIP1 §5.2 already designates as the allow-list; task 15 adds a scope to a bound capability's existing handler |
| Record evidence for every conclusion | **Held** — every routing claim is reproduced by executing the production resolver (§3); every code claim carries `file:line`; the one claim that could not be established is recorded as an open anomaly (§4.12), not as a finding |
| Use the complete production routing path | **Held** — §2 traces resolver → gateway → `intelligencePlatform.handle` → `resolvedIntent` → scorer, and identifies the three properties (P1–P3) that decide the outcome |

---

## 10. What this investigation did not verify

- **No benchmark run was executed** (per `ARCH_BENCHMARK_OWNERSHIP_RULE.md`). All runtime claims derive from the existing `2026-07-10T10-48-57Z__8e10ea3` artefact, or from direct read-only invocation of the pure resolver.
- **Anomaly SH-042-A is unresolved** (§4.12). Static reading found no grounding path for the shopping items in that answer. This is the single most important open item, and it is deliberately not concluded.
- **The 19 non-gated routing failures were not attributed.** The artefact records 31 `routingFailures`, of which 12 are R2. The remaining 19 (9 `intent-unresolved`, 2 `write-intent-declined`, 8 ungated `wrong-capability` — including the whole `companion-platform` and `trust-meta` families) fall outside this brief's R2 scope. **Eight of them are ungated `wrong-capability` failures**, which means R2's true population is a scoping choice, not a fact.
- **`intentResolutionAccuracyPct` = 85.2 %** is below the report's own 90 % floor. Its relationship to the 12 R2s was not computed.
- **Answer-quality claims are lower bounds.** The judge is disabled (BENCHINT1 D9); 68 of 100 weight points are deterministic proxies. Where this document says an answer was "correct", it means the deterministic scorer found no fault and the cited entities exist — not that a judge confirmed it.
- **Downstream engines were not re-audited.** Behaviour, Observation, Decision and Notice Engines were out of scope; BENCHINT1 §6 stands unamended.

---

*BENCHINT3 is an investigation. It changes nothing. Its output is the attribution in §4, the root-cause grouping in §5, and the ordered task list in §8, which is the input to BENCHINT4.*
*Rollback: `git checkout rollback/before-benchint3-intent-routing-attribution-20260710`; dirty-tree snapshot `git stash apply 6e40509`.*
