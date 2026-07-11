# BENCHINT4 — Intent Routing Convergence

**Status:** IMPLEMENTATION — complete, with two tasks deliberately deferred (§7).
**Classification:** Intelligence Governance → Intent Engine × Benchmark Platform
**Workstream:** `BENCHINT` (Benchmark ⇄ Platform Integration). Successor to `BENCHINT1` (audit), `BENCHINT2` (runtime convergence), `BENCHINT3` (attribution).
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Input:** `docs/investigations/benchmarking/BENCHINT3_INTENT_ROUTING_ATTRIBUTION.md` §8 — sixteen proposed tasks.

**Rollback protection:**

| Item | Value |
|---|---|
| HEAD at start | `8e10ea32f41a6275d1fb1bc115be588ff8195a3d` (unchanged — nothing was committed) |
| Rollback tag | `rollback/before-benchint4-intent-routing-convergence-20260710` |
| Dirty-tree snapshot | `git stash` entry `BENCHINT4_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-10` (`738be6696f7797041942f08e1ccfaf790657880c`) |
| Schema modified | None |
| Migrations added | None |

**Benchmark ownership rule compliance:** the Companion Benchmark was **not executed** (`ARCH_BENCHMARK_OWNERSHIP_RULE.md`). Every runtime claim below comes from direct, read-only invocation of the production resolver and registry, from the existing artefact `2026-07-10T10-48-57Z__8e10ea3.json`, or — for §4.1 — from a read-only observation harness and a read-only query against the conversation store. No run artefact was produced. **Implementation is verified against unit/integration/regression tests and is ready for acceptance benchmark execution, awaiting explicit instruction.**

---

## 1. Implementation summary

BENCHINT4 converges intent routing onto the platform's existing engines. It adds **no routing pathway, no second resolver, no ranker, no semantic or embedding-based routing, and no benchmark-only behaviour.** Every change extends a matcher array, a registry field, or a benchmark-side expectation record that already existed.

Fourteen of the sixteen BENCHINT3 tasks are complete. Two are deferred by explicit decision (§7).

The work has three parts.

**(a) Measurement honesty (Tier 1 — benchmark-side only).** The benchmark could not distinguish "reached none of what the question expected" from "reached the second of two capabilities the question itself named", and it required a route to operations the platform does not have. Both are now fixed at the expectation record, which reads the live Capability Registry. Neither change moves the headline by itself: `reached-secondary` is a *label* on the same gated failure, and the verb-aware requirement removes gating only from questions whose fixture verb cannot execute.

**(b) Resolver coverage and precision (Tier 2 — one owner file).** Six of the twelve R2 misroutes were the Intent Resolver failing to propose the right capability at all — never a ranking failure. `MAX_INTENTS` truncated nothing on any of the twelve, and nothing was outranked. Seven matcher/pattern changes close them, all inside `pattern-intent-resolver.ts`.

**(c) One owner for the owner ↔ discovery relationship (Tier 3).** The `meals` ↔ `meal-discovery` pairing existed in three uncoordinated places — a stem rule in the Context Composition Engine, an inline `endsWith("-discovery")` in the Conversation Gateway, and a prose comment in the resolver that no code enforced. It is now declared once on the Capability Registry (`Capability.discoveryOf`), validated at construction, and *read* by both consumers. This is a pure consolidation: the declarations match, capability-for-capability, what the old stem rule computed.

**The single most important finding is not a routing finding at all.** Resolving BENCHINT3's open anomaly SH-042-A (§4.1) established that the artefact every BENCHINT3 conclusion rests on was measured with **conversation isolation silently disabled**. That is now detected and aborts the run.

### 1.1 Recovery note — what was already done

This implementation was interrupted and resumed. The state inherited from the interrupted session was determined by diffing the working tree against the pre-BENCHINT3 dirty-tree snapshot (`6e40509`), which isolates BENCHINT4's changes from the ~319 unrelated dirty paths.

**Already complete and left untouched:** tasks 4, 5, 6, 7, 8, 9, 10, 11, 12 (the resolver changes and the registry consolidation).

**Defects found in that inherited work, and fixed here:**

| Defect | Evidence | Fix |
|---|---|---|
| `validateDiscoveryRelationships()` iterated a `Map` directly, which this `tsconfig` (no `target`) rejects | `tsc`: `capability-registry.ts(891,23) TS2802` | `Array.from(this.capabilities.values())`, matching the file's own convention at `:788`, `:797` |
| The Context Composition Engine's merge guard read a declaration its test fixture never supplied, so owner ↔ discovery merging silently stopped under test | `test-intelligence-context-composition`: 2 failures | Test fixture carries `discoveryOf`, as the gateway does. Two assertions added pinning that an **undeclared** pair must never merge |
| The planner-fallback comment claimed `week` was the only planner route for **both** PL-027 and PL-028, citing this report as evidence | PL-028 routes `planner@0.75` via a `my plan` noun-phrase matcher, with or without `week` | Comment corrected (§4.2); both directions now pinned by test |

Production behaviour was verified unchanged by the merge-guard consolidation: exactly one production caller of `composeContext` exists (`conversation-gateway.ts:950`), and it passes the registry's declaration.

---

## 2. Architectural invariants — verified, not assumed

| Invariant | Verification |
|---|---|
| **One Intent Resolver** | `pattern-intent-resolver.ts` is the sole implementation of `IIntentResolver`. No matcher was added outside its existing arrays; no second resolver, ranker, or scoring pass exists. |
| **One Capability Registry** | `discoveryOf` is declarative metadata on the existing `Capability` interface. The registry gained three pure lookups (`isDiscoveryCapability`, `discoveryOwnerOf`, `sameEntityFamily`) and one constructor-time validator. It **ranks nothing and selects nothing**; no `priority`/`confidence` field was added (BENCHINT3 §6.1 forbids it). |
| **One Context Composition Engine** | The engine's merge policy is unchanged. It now *reads* the pairing from its input instead of re-deriving it from an id string. It still imports nothing, performs no I/O, and holds no reference to the registry (INT17 §6). |
| **One Behaviour Engine** | Untouched. |
| **One Observation Engine** | Untouched. |
| **One production routing pathway** | `resolve → queryable → intelligencePlatform.handle → resolvedIntent → composeContext`. Unchanged. `test-benchmark-no-production-branch` still passes: no executable reference to the benchmark exists in production code. |
| **No duplicate routing logic** | Task 9 *removed* two duplicate statements of the owner/discovery rule. Tasks 5 and 10 *reuse* vocabularies and intents that already existed. |
| **No benchmark-only behaviour** | The one benchmark-side runtime addition (§4.1) is a harness integrity check on a thread id the gateway already returns. It changes no routing, no capability, and no production code. |
| **No semantic / AI / embedding routing** | Every matcher added is a deterministic regular expression over the utterance. No model call, no embedding, no learned ranker. |

---

## 3. Completed BENCHINT3 tasks

| # | Task | Status | Where |
|---|---|---|---|
| 1 | Resolve anomaly SH-042-A by observation | **Done** | §4.1 |
| 2 | `secondaryCapabilityFamilies` + `reached-secondary` | **Done** | §4.3 |
| 3 | Verb-aware `resolveCapabilityStatus` / `routingRequired` | **Done** | §4.4 |
| 4 | `nutrition(?:al(?:ly)?)?` boundary fix | **Done** (inherited) | §4.2 |
| 5 | Nutrition fallback consults `KNOWN_NUTRIENT_TERMS` / `KNOWN_BENEFIT_TERMS` | **Done** (inherited) | §4.2 |
| 6 | Planner fallback requires a planner noun phrase | **Done** (inherited, comment corrected) | §4.2 |
| 7 | Superlative/comparative nutrient matcher | **Done** (inherited) | §4.2 |
| 8 | Interrogative library-filter matchers | **Done** (inherited) | §4.2 |
| 9 | Owner ↔ discovery link as registry metadata | **Done** (inherited, defect fixed) | §4.5 |
| 10 | The compound matcher the resolver documented (CB-021) | **Done** (inherited) | §4.2 |
| 11 | Shopping vocabulary: "items" in a shopping frame | **Done** (inherited) | §4.2 |
| 12 | Guard `household-discovery` against weekday tokens | **Done** (inherited) | §4.2 |
| 13 | **Governance:** settle `meals` ↔ `meal-discovery` ownership | **Done** | §6.1 |
| 14 | **Governance:** decide `analyser`'s per-product read | **Done** | §6.2 |
| 15 | Plant-diversity read scope on `nutrition-knowledge` | **Deferred** | §7 |
| 16 | Routing attribution regression test | **Done** | §5.2 |

---

## 4. Implementation detail

### 4.1 Task 1 — anomaly SH-042-A, resolved: **reading (b)**

BENCHINT3 §4.12 recorded an answer it could not account for. SH-042 (*"Which items should I check for allergens or additives?"*) routed only to `analyser:read {scope:"additives"}` plus the `profile` baseline, yet answered with the acting user's real shopping items — *beef stock*, *topping parmesan* — scoring `hallucination: false`, `entityRefCount: 8`. BENCHINT3 offered two readings: **(a)** a fabrication that happened to be correct, or **(b)** a grounding path outside the Capability Registry. It declined to choose, and named (b) the more serious.

**It is (b).** Established by observation, in two steps.

**Step 1 — capture the literal CONTEXT DATA block.** A read-only harness ran the real `ConversationGateway` with the real capability handlers (real database reads), an in-memory conversation store, a capturing LLM provider that called no model, and a resolver stub reproducing the artefact's routed set exactly. The prompt it produced contains the additives reference table and the profile row. **It contains no shopping items and no `CONVERSATION HISTORY` block.** (`olive oil` appears — in the system prompt's own worked example about kale, not in any data.) The four static paths BENCHINT3 enumerated are confirmed closed: `analyser`'s port exposes only `getAllAdditives()`; `profile`'s port exposes only `getUser` and `getUserPreferences`; both enrichment builders require `nutrition-knowledge`, absent that turn; the LLM provider is a stateless `chat.completions` call.

**Step 2 — read the run's own persisted turns.** The benchmark persists every turn, so the actual run could be examined rather than reasoned about:

| Fact | Value |
|---|---|
| Acting user | `1` |
| Threads for that user | exactly one — `thread 1` |
| `thread 1` opened | `2026-07-01T09:41:07Z` |
| `thread 1` `closed_at` | **`NULL` — never closed** |
| Turns in `thread 1` | **13,044** |
| SH-042's user turn | id `40348`, in `thread 1` |

`getRecentTurns(thread.id, 7)` therefore returned the seven preceding turns, which `buildGroundedResponse` slices to five and sends as a `CONVERSATION HISTORY` system message. Reconstructing that exact block from the database shows it contains SH-039's and SH-040's **answers**, and every needle: `parmesan`, `beef stock`, `spaghetti`, `oregano`, `onion`, `can tomato`. SH-040's answer, verbatim in SH-042's prompt window:

> *"In your shopping list, the whole foods include onion, olive oil, lean beef, oregano, and can tomato… The more processed items are beef stock and spaghetti… Topping parmesan is also considered processed due to its production methods."*

**The answer was grounded — in the previous questions' answers.** Not a fabrication; a contaminated prompt window.

**Why isolation did not run.** BENCHINT2 (D1/D8) closes the acting user's thread before the first question and in a `finally` after every question. That code **is present** in the subject commit `8e10ea3` (`closeActiveThread`, `openingThreadClosed`). Executed against the live database today, `getOrCreateConversation(1) → getActiveThread(1)` returns `thread 1`, so today's code *would* close it. The process that produced the artefact did not: `thread 1` has been accumulating turns since 2026-07-01 across every run. The close existed; it never ran. Nothing compared one question's thread id with the next, so nothing noticed.

**What this costs.** Every BENCHINT3 answer-quality claim derived from that artefact is contaminated for any question whose prompt window contained an earlier answer. This is precisely the RED risk BENCHINT3 attached to task 1: *"may invalidate the 'answers were fine' reading of six R2s"*. It does. The routing attributions in BENCHINT3 §4 stand — routing is decided before any capability runs, and the intent pools were reproduced independently — but **`hallucination: false` on the late questions of that run means nothing**, and the six R2s whose answers "were correct anyway" cannot be read as evidence that misroutes are harmless.

**The fix, in the harness.** `makeCompanionTurnRunner` now records every thread id it sees. A question answered in a thread an earlier question already used raises `BenchmarkIsolationError`, which is rethrown past the per-question `catch` (that `catch` converts a thrown question into a scored `internal-error` turn — correct for a platform error, wrong for this) and aborts the run. This is BENCHINT2's own stated standard — *"Aborting rather than scoring contaminated turns"* — finally made enforceable. It observes a thread id the gateway already returns and changes no production behaviour.

### 4.2 Tier 2 — resolver coverage and precision (tasks 4–8, 10–12)

Inherited from the interrupted session; verified here by executing the production resolver against the corpus utterances. Observed routing, `surface: "floating"`:

| Q | Before (BENCHINT3 §3) | After | Task |
|---|---|---|---|
| CB-016 | `meals@0.48` floor | **`nutrition-discovery:search@0.85`** | 7 |
| CB-017 | — | *unchanged* — declines, correctly: no nutrient term | 7 (guard) |
| CB-018 | `meals@0.48` floor | **`meal-discovery:search@0.84`** | 8 |
| CB-019 | two independent floors | **`meal-discovery@0.86` + `household@0.84`** | 8 |
| CB-021 | `meals@0.48` floor | **`meal-discovery:search@0.86` + `profile:read@0.84` (non-baseline)** | 10 |
| CG-085 | `planner@0.60` → *gap* | **planner gone; `nutrition-knowledge@0.49`** | 6, 5 |
| ND-058 | no nutrition route | **`nutrition-knowledge@0.58`** (`nutritionally` now matches) | 4 |
| PL-030 | `household-discovery@0.86` (`{query:"tuesday"}`) | **household-discovery gone; `meal-discovery@0.84` wins** | 12 |
| SH-042 | `analyser@0.78` alone | **`shopping:read@0.80`** + `analyser@0.78` | 11 |
| CB-012 | `meals:search@0.87` | *unchanged* — the ownership contract holds | — |

Two precision facts are load-bearing and are now pinned by test:

- **The 0.49 vocabulary floor never displaces the 0.50 personalisation baseline.** Task 5 gives the nutrition fallback the `KNOWN_NUTRIENT_TERMS` / `KNOWN_BENEFIT_TERMS` vocabularies that already existed, rather than restating them in a third word list. It is a *separate* fallback entry at 0.49 — beneath the always-on `profile` baseline — because a nutrient word is weaker evidence than the word "nutrition" itself. At 0.58 it displaced `profile` from the `MAX_INTENTS = 4` cap on compound turns and handed the Context Composition Engine the entire 611-food registry on turns that never asked for it.
- **`week` / `weekly` is deliberately retained in the planner fallback.** BENCHINT3 T2.3 proposed removing it. Measured: stripping it removes PL-027's *only* planner route (`"Have I repeated too many meals this week?"` → no planner intent at all), demoting it from `reached-intended` to `capability-miss` — gate **R1, cap 40**, strictly worse than the **R2, cap 55** the removal would close. **Correction to the resolver's own comment as first written:** PL-028 does **not** depend on the token. It routes `planner@0.75` via a noun-phrase matcher on *"my plan"*, with or without `week`. Only PL-027 depends on it. Both directions are asserted in `test-intent-resolver-routing-attribution.ts`.

`MAX_INTENTS` was not raised. It never fired (BENCHINT3 §3), and raising it would cost latency on every turn.

### 4.3 Task 2 — `reached-secondary`

45 of the 100 fixture rows carry a compound capability (`"shopping-list + analyser"`); `capabilityFamily()` kept only the primary token, so a turn that invoked the fixture's *own* secondary scored identically to a turn that invoked something unrelated.

`ExpectationRecord` now carries `secondaryCapabilityFamilies`, normalised through the same alias table as the primary, and `RoutingOutcome` gains `reached-secondary`.

**It is a label, not an amnesty.** `reached-secondary` still fires gate R2 and still takes D4 band 1, exactly as `reached-other` does. The question named a primary and the platform did not reach it. Forgiving it would move the headline for a reason unrelated to the platform's behaviour — the interpretability trap BENCHINT3 §7 warns about. The two states are *reported* separately instead: `RoutingPanel.misroutesReachingSecondary` is published alongside `misroutes`, and the R2 warning names the ids, so the trend line stays readable across the change.

**Count reconciliation.** 45 fixture rows contain `+`; **44** yield a *distinct* secondary. `FK-081` (`"diet-foods + nutrition"`) has both tokens alias to `nutrition-knowledge`, so it collapses to none. BENCHINT3's "45" counted raw strings. Both numbers are right; they count different things.

### 4.4 Task 3 — verb-aware `routingRequired`

`resolveCapabilityStatus(family)` asked only *"can this capability run anything?"*. It now accepts an optional verb and, when the fixture names one, answers at `(capability, verb)` granularity: a verb absent from `supportedIntents`, or present but absent from `executableIntents`, is `registered-unbound` and requires no route. Omitting the verb preserves the previous answer exactly, so every existing caller is unchanged.

The verb is read only when the primary token's dot-suffix is a member of the closed `IntentVerb` set. A suffix that is a *scope* rather than a verb (`"nutrition.meal-search"`, redirected to `nutrition-discovery`) yields `null` and falls back to capability granularity — the safe direction, because it keeps the route required.

**Measured effect: six questions lose their routing requirement, not the three BENCHINT3 predicted.**

| Question | Fixture | Why it cannot run |
|---|---|---|
| PL-029, PL-030 | `planner.suggest` | `suggest` is not in `planner.supportedIntents` at all |
| PR-063, PR-072 | `analyser.explain` | supported, **not** executable — a declared honest gap |
| PR-065 | `product-analysis.explain` | same, via alias |
| PR-069 | `additives.explain` | same, via alias |

**Correction to BENCHINT3 §6.3.** It named `nutrition-report.report` (ND-054) and `meal-discovery.recommend` (CB-021) as the other two verb-blind passes. The fixture rows actually read `nutrition-report.read` and `meal-discovery.search + profile.read`. Both verbs execute; both questions correctly remain route-required. The defect BENCHINT3 identified is real, and it lands on the analyser family instead.

### 4.5 Task 9 — one owner for the owner ↔ discovery relationship

`Capability.discoveryOf` declares the pairing on the registry — the allow-list TIP1 §5.2 already designates. Seven discovery capabilities declare an owner (`meal-discovery → meals`, `nutrition-discovery → nutrition-knowledge`, `planner-discovery → planner`, `pantry-discovery → pantry`, `diary-discovery → diary`, `shopping-discovery → shopping`, `household-discovery → household`), and `validateDiscoveryRelationships()` throws at construction on a self-reference, a dangling owner, a sibling naming another sibling, or two siblings claiming one owner.

Both former consumers now read it: the Conversation Gateway asks the registry `isDiscoveryCapability`, and the Context Composition Engine receives `discoveryOf` on its input and consumes the declaration. The engine still holds no registry reference (INT17 §6).

**Behaviour is unchanged, and this was checked rather than asserted.** The seven declarations agree, capability for capability, with what the old `domainStem()` rule computed. The old rule's semantics — two owners never merge; two discovery capabilities never merge; only an owner and *its own* sibling merge — are preserved by `a.discoveryOf === b.capabilityId || b.discoveryOf === a.capabilityId`. All 164 context-composition assertions pass, including two new ones proving an **undeclared** pair is never merged on the strength of its id.

This closes INT17 §8 open item 5: a registry pair the stem rule could not see used to stop merging *silently*. An undeclared pair is now a construction-time throw.

---

## 5. Validation results

**The Companion Benchmark was NOT executed.** Per `ARCH_BENCHMARK_OWNERSHIP_RULE.md`, verification is by unit / integration / regression test.

### 5.1 Test suite

```
npm test   →   exit 0
55 suite summaries, every one reporting 0 failed
3,553 assertions passed, 0 failed
```

Suites most directly exercising this change:

| Suite | Result |
|---|---|
| `test-intent-resolver-routing-attribution` (**new**) | 79 passed, 0 failed |
| `test-intelligence-platform` | 33 passed, 0 failed |
| `test-intent-resolver` | 124 passed, 0 failed |
| `test-benchmark-routing-integrity` | 117 passed, 0 failed (was 101; +16 for `reached-secondary` and verb-awareness) |
| `test-intelligence-context-composition` | 164 passed, 0 failed (was 159 + **2 failing**; +5 new, 2 repaired) |
| `test-benchmark-conversation-isolation` | 26 passed, 0 failed (+3 for the isolation guard) |
| `test-benchmark-capability-utilisation` | 70 passed, 0 failed |
| `test-intelligence-conversation-gateway` | 64 passed, 0 failed |
| `test-intelligence-registry-executability` | 124 passed, 0 failed |
| `test-benchmark-no-production-branch` | 3 passed, 0 failed |

### 5.2 Task 16 — the regression test

`server/tests/test-intent-resolver-routing-attribution.ts` (wired into `npm test` as `test:intent-routing-attribution`) pins, as executable assertions:

- the routing of every corpus utterance BENCHINT4 changed, **and the guards** — CB-017 must *not* acquire a nutrition-discovery route; CB-012 must stay with `meals` while CB-018 reaches `meal-discovery`;
- that the 0.49 coverage floor never outranks the 0.50 personalisation baseline, and the pool never exceeds `MAX_INTENTS`;
- that `Tuesday` is excluded from person-name extraction while the *same sentence* with `Sarah` or `June` still reaches `household-discovery` — the boundary of the guard, not an accident of it;
- that PL-027 depends on `week` and PL-028 does not;
- the registry's owner ↔ discovery graph: complete, 1:1, every owner registered and itself an owner; `sameEntityFamily` correct in all six directions; and four malformed graphs each throwing at construction;
- the expectation record's verb extraction and secondary-family normalisation, including the `nutrition.meal-search` scope-not-verb case.

### 5.3 Type checking

Every file BENCHINT4 touched typechecks clean.

177 pre-existing `tsc` errors remain elsewhere in this dirty working tree, in files this workstream did not modify (`server/tests/context-composition/*`, `handlers/household-discovery-handler.ts`, `test-slot-filling-recovery.ts`, and others). They predate BENCHINT3 — verified against the `6e40509` snapshot — and are out of scope. **BENCHINT4 introduced one typecheck error and fixed it** (§1.1).

### 5.4 What was not verified

- **No benchmark run.** The score movement of this change is therefore *unmeasured*. It is expected to be small and to come from two independent causes — §4.3 moves none, §4.4 removes gating from six questions, §4.2 should convert several R2s to `reached-intended`.
- **The next run establishes a new baseline.** The fixture checksum changes (one row, §6.2), and `routingRequired` changes for six questions. Comparison against `2026-07-10T10-48-57Z__8e10ea3` is not meaningful — and that artefact is contaminated in any case (§4.1).
- **BENCHINT3's ordering constraint was violated by the interrupted session**, which landed Tier 2 before Tier 1. Because no benchmark run happened in between, no uninterpretable measurement was produced; the first post-BENCHINT4 run is a clean single transition.
- **The 19 non-gated routing failures** remain unattributed (BENCHINT3 §10).

---

## 6. Governance decisions

### 6.1 Task 13 — the `meals` ↔ `meal-discovery` boundary

**An ownership-qualified meal query belongs to `meals`. An unqualified one belongs to `meal-discovery`.**

Recorded in `docs/architecture/capabilities/meals.md` § *Governance decision*, with the sibling card `docs/architecture/capabilities/meal-discovery.md` created (task 13 called for it; none existed). This changes no behaviour — it writes down, as governing architecture, the rule the resolver already follows and that BENCHINT4 now enforces by test. The prose comment at `pattern-intent-resolver.ts:1857-1859` is retired into code and card.

The meals card is also corrected: `search` is now executable (`executableIntents: ["read", "search"]`), superseding its "pending open decision" language.

### 6.2 Task 14 — `analyser`'s per-product read

**Decision: `analyser` does not gain a product-scoped read. A question about a specific product is an honest gap, and that is the correct answer.**

Recorded in `docs/architecture/capabilities/analyser.md` § *Governance decision*. Three grounds: there is no stored per-product analysis to read (analysis is pure computation over caller-supplied text, or a live OpenFoodFacts fetch, never persisted); *"this product"* has no referent because the turn carries `surfaceHints: {}`; and forcing the one executable scope (`read {scope:"additives"}`) onto such a question invites the answer generator to present a generic additive table as a finding about a specific product — the fabrication `analyserUnexecutable()` exists to prevent.

Consequently PR-070's fixture row is re-targeted from `"product-analysis + household"` to `"household.read + product-analysis"`. `household` genuinely owns the household's restrictions and **was reached** by the run; `product-analysis` is retained as the named secondary precisely to record that the analyser half is a gap. Verified: PR-070 now derives `primary=household, verb=read, secondaries=["analyser"], routingRequired=true`, and the run's invoked set (`["household"]`) scores `reached-intended`.

The docs mirror `THA_COMPANION_BENCHMARK_100_V1.md` is updated to match. Reversal requires *both* a stored product-scoped analysis owned by a real owning service *and* a product referent reaching the turn — neither alone suffices.

---

## 7. Remaining tasks

| # | Task | Status | Reason |
|---|---|---|---|
| 15 | Plant-diversity read scope on `nutrition-knowledge` | **Deferred, by decision** | Tier 4. BENCHINT3 §7 places it "outside the BENCHINT workstream's ownership". ND-054's primary root cause is **RC4 — a missing capability surface**, not routing: it would answer with an honest gap even after perfect routing. Adding a capability surface inside a routing-convergence change would mix two causes in one measurement. **This is the top remaining item.** The shape is settled: a `scope` on `nutrition-knowledge:read` delegating to `nutrition-centre-assembler.ts`, already that capability's declared `owningService` — then one matcher. It must not re-own the assembler's logic. |
| — | CB-012's fixture row | **Outstanding** | BENCHINT3 T1.3. The fixture assigns CB-012 to `meal-discovery.search`, contradicting the ownership boundary settled in §6.1. The platform routes it to `meals`, answers correctly, and is scored a misroute. Re-targeting to `meals.search` (executable) would score it `reached-intended`. Not applied here: §6.1 is a Capability Card decision, and a card does not own the benchmark corpus. Recommended as the first act of the next benchmark-corpus change. |
| — | PR-066's fixture row | **Identified, not applied** | `"Is this cereal a good choice for my family?"` carries the identical `"product-analysis + household"` expectation and the identical defect PR-070 had. The §6.2 decision applies to it unchanged. It was **not** edited, because only PR-070's re-target was approved — a corpus decision should not be silently extended past its authorisation. |
| — | Re-run the benchmark and re-baseline | **Blocked on instruction** | Per `ARCH_BENCHMARK_OWNERSHIP_RULE.md`. The prior artefact is contaminated (§4.1); the first clean run establishes the new baseline. |
| — | Attribute the 19 non-gated routing failures | **Out of scope** | BENCHINT3 §10. Eight are ungated `wrong-capability`, so R2's population is a scoping choice, not a fact. |

---

## 8. Files changed

No schema change. No migration. Nothing committed — the working tree carries the change.

**Production (`server/intelligence/`)**

| File | Change |
|---|---|
| `pattern-intent-resolver.ts` | +235 — seven matcher/pattern changes (tasks 4–8, 10–12); planner-fallback comment corrected |
| `capability-registry.ts` | +72 — seven `discoveryOf` declarations; three lookups; constructor-time graph validation; `Array.from` iteration fix |
| `types.ts` | +21 — `Capability.discoveryOf` |
| `context/context-composition-engine.ts` | ±70 — merge guard reads the declaration; `domainStem`/`DISCOVERY_SUFFIX` removed |
| `conversation/conversation-gateway.ts` | +25 — `primaryOutcome` asks the registry; passes `discoveryOf` to the engine |

**Benchmark harness (`server/tests/benchmark/`)**

| File | Change |
|---|---|
| `expectations.ts` | +93 — `secondaryCapabilityFamilies()`, `capabilityVerb()`, verb-aware `resolveCapabilityStatus()` |
| `types.ts` | +29 — `reached-secondary`, `secondary-capability`, `RoutingRecord.secondaryCapabilities`, `RoutingPanel.misroutesReachingSecondary` |
| `scorer.ts` | +20 — classify, gate, reason, D4 band |
| `aggregate.ts` | +16 — `misroutesReachingSecondary`; R2 warning reports both numbers |
| `report.ts` | +4 — D4 band-1 label distinguishes the two misroute kinds |
| `runner.ts` | +3 — empty routing panel |
| `companion-turn.ts` | +49 — `BenchmarkIsolationError`; per-run thread-id guard; rethrow past the per-question catch |
| `fixtures/companion-benchmark-100.v1.json` | 1 row — PR-070 re-target (§6.2) |

**Tests**

| File | Change |
|---|---|
| `server/tests/test-intent-resolver-routing-attribution.ts` | **new** — 79 assertions (task 16) |
| `server/tests/test-benchmark-routing-integrity.ts` | +72 — `reached-secondary` and verb-aware coverage |
| `server/tests/test-benchmark-conversation-isolation.ts` | +17 — the isolation guard |
| `server/tests/test-intelligence-context-composition.ts` | +31 — fixture carries `discoveryOf`; undeclared-pair and wrong-owner assertions |
| `server/tests/test-benchmark-capability-utilisation.ts` | +2 — expectation fixture fields |
| `package.json` | +1 script, wired into `npm test` |

**Documentation**

| File | Change |
|---|---|
| `docs/architecture/capabilities/meals.md` | Governance decision (§6.1); `search` executability corrected |
| `docs/architecture/capabilities/meal-discovery.md` | **new** — the sibling card task 13 called for |
| `docs/architecture/capabilities/analyser.md` | Governance decision (§6.2) |
| `docs/intelligence/benchmark/questions/THA_COMPANION_BENCHMARK_100_V1.md` | PR-070 row, mirroring the fixture |
| `docs/implementation/benchmarking/BENCHINT4_INTENT_ROUTING_CONVERGENCE.md` | **new** — this document |

---

## 9. Rollback instructions

Nothing was committed; `HEAD` is still `8e10ea3`. Rollback is therefore a working-tree operation.

**Full rollback — discard all BENCHINT4 work, restore the pre-implementation dirty tree:**

```bash
git stash apply 738be6696f7797041942f08e1ccfaf790657880c   # BENCHINT4_ROLLBACK snapshot
git checkout rollback/before-benchint4-intent-routing-convergence-20260710 -- .
rm -f server/tests/test-intent-resolver-routing-attribution.ts \
      docs/architecture/capabilities/meal-discovery.md \
      docs/implementation/benchmarking/BENCHINT4_INTENT_ROUTING_CONVERGENCE.md
```

The two new files and this report are untracked, so neither the tag nor the stash removes them — delete them explicitly, as above.

**Partial rollback.** The three parts are independent and can be reverted separately:

| Revert | Files | Consequence |
|---|---|---|
| Measurement honesty only (tasks 2, 3) | `benchmark/{expectations,scorer,types,aggregate,report,runner}.ts`, `test-benchmark-routing-integrity.ts`, `test-benchmark-capability-utilisation.ts` | R2 again cannot distinguish a secondary from an unrelated capability, and again requires routes to unrunnable verbs |
| Registry consolidation only (task 9) | `capability-registry.ts`, `intelligence/types.ts`, `context/context-composition-engine.ts`, `conversation/conversation-gateway.ts`, `test-intelligence-context-composition.ts` | The stem rule and the inline `endsWith` must be restored **together** — reverting one without the other leaves the engine reading a field nobody passes, and owner/discovery merging stops silently |
| Isolation guard only (task 1) | `benchmark/companion-turn.ts`, `test-benchmark-conversation-isolation.ts` | Contaminated runs score silently again. **Do not revert this without also re-opening SH-042-A** |

**Do not partially revert the registry consolidation.** `context-composition-engine.ts` and `conversation-gateway.ts` must move together with `capability-registry.ts`; the engine's merge guard now reads a declaration the gateway supplies.

**Verification after any rollback:**

```bash
npx tsc --noEmit -p tsconfig.json
npm test
```

---

*BENCHINT4 implements BENCHINT3 §8. It adds no routing pathway, no second resolver, no ranker, and no semantic, AI, or embedding-based routing. Its most consequential finding — that the artefact BENCHINT3 attributed was measured with conversation isolation silently disabled — is a measurement defect, now detected and fatal to the run rather than invisible in it.*

*Rollback: `git checkout rollback/before-benchint4-intent-routing-convergence-20260710 -- .`; dirty-tree snapshot `git stash apply 738be66`.*
