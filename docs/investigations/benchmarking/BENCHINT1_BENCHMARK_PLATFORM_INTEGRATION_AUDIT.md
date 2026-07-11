# BENCHINT1 — Benchmark Platform Integration Audit

**Status:** INVESTIGATION — audit only. **No code changed. No runtime pathway created. No fix implemented.**
**Classification:** Intelligence Governance → Companion Runtime × Benchmark Platform
**Workstream:** `BENCHINT` (new — Benchmark ⇄ Platform Integration). Distinct from the existing `BENCH` workstream, whose `BENCH3`/`BENCH4` identifiers are already spent on Intent Resolver coverage work (2026-07-08) and are **not** reused here.
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Subject at audit:** HEAD `678b1ae`, dirty working tree (312 paths — pre-existing, unrelated to this audit)

**Rollback protection:**
- `git stash` entry `BENCH3_ROLLBACK: pre-audit dirty-tree snapshot 2026-07-10` (`61c9d5c`)
- tag `rollback/before-bench3-platform-integration-audit-20260710`
- tag `pre-BENCH3-rollback`

(The rollback artefacts were created before the workstream was renamed to `BENCHINT1`; their names are left as-is because a tag rename would break the recovery reference recorded in the session log. They are the correct restore points for this work.)

**Governing documents read before this audit:**
`docs/architecture/README.md` (Architecture Bootstrap, mandatory entry point),
`docs/architecture/REPOSITORY_CONVENTIONS.md` (HOUSE2 — filing location for this document),
`docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`,
`docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md`,
`docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`,
`docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md`,
`docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`,
`docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`,
`docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`,
`docs/intelligence/benchmark/BENCHMARK_EXECUTION_PROCESS.md`,
`docs/intelligence/benchmark/BENCHMARK_AUTOMATION.md`,
`docs/implementation/governance/ARCH_BENCHMARK_OWNERSHIP_RULE.md`

**Benchmark ownership rule compliance:** the Companion Benchmark was **not executed** during this audit. This is a static architectural audit. No run artefact was produced, and no score is quoted anywhere in this document.

---

## 0. Assumptions recorded explicitly

Per the constraint "record assumptions explicitly rather than guessing", the following are assumptions, not verified facts:

- **A1.** `BENCHMARK_EXECUTION_PROCESS.md` and `BENCHMARK_AUTOMATION.md` are treated as *governing* for the benchmark platform, on the strength of their own `Status: GOVERNING FRAMEWORK` headers. They are **not** indexed in `docs/architecture/README.md`, so their governing status is self-declared rather than conferred by the architecture bootstrap. If they are in fact aspirational specification rather than governing architecture, then several findings below (D1, D6, D9) are downgraded from "violates a governing precondition" to "diverges from a design intent". **This distinction should be settled before BENCHINT2 begins.**
- **A2.** No benchmark run was executed, so every claim about *runtime* behaviour is derived from reading code, not from observing a run. Claims are cited to `file:line`. Where a claim depends on execution order rather than on the source text, it is flagged.
- **A3.** The `worldMode: "single-world"` run route is assumed to be a live, reachable operator path (it is registered and admin-gated at `server/routes.ts:8954`), not dead code awaiting removal.
- **A4.** `docs/intelligence/benchmark/BENCHMARK_HOUSEHOLDS.md`'s "seed contract checksum" is assumed unimplemented; no checksum assertion was found in `world-seeder.ts`. This was not exhaustively searched.

---

## 1. Verdict

**The benchmark's answer-producing path is architecturally sound and materially better than the brief anticipates.** Every scored question executes through the real `conversationGateway.processUserTurn`, on a real production surface, as a real `User`, with the production LLM provider factory, the production intent resolver, the production Capability Registry, the production Context Composition Engine, and the production knowledge assembly. There is **no mock Companion, no duplicated orchestration, and no simplified execution path** in the scored run. The `companion-turn.ts` "one seam" discipline holds under inspection.

The divergences that exist are real but narrow, and they cluster in three places — none of them the Companion's reasoning core:

1. **State realism.** What the benchmark *asks questions about* is not what production would have built. The world seeder reproduces stored rows but skips the derivations that create them, so every benchmark meal has zero nutrition and zero allergens, and the partner adult leaves behind an orphaned, member-less household.
2. **Turn isolation.** The benchmark never resets the conversation thread between questions. All questions in a run share one thread, so question *N* is answered with questions *N−5…N−1* in its prompt. This directly contradicts `BENCHMARK_EXECUTION_PROCESS.md` §1 step 3a and makes scores order-dependent.
3. **Measurement duplication.** The scorer re-implements the platform's own vocabulary — its honest-gap statuses, its refusal detection — as hand-maintained string and set literals that can drift from the types they shadow.

Additionally, one whole engine named in the brief — the **Decision Engine** — is not reached by a conversational turn *in production either*. That is a scope finding, not a benchmark defect, and it is the single most consequential item in this report.

---

## 2. Production Companion execution architecture

The one answer-producing route is `POST /api/intelligence/conversation/turn` (`server/routes.ts:12009-12082`), called by the one production Companion UI, `FloatingAssistant.tsx` (`client/src/App.tsx:177`). It calls `processUserTurn` (`server/intelligence/conversation/conversation-gateway.ts:1247`) with five arguments: the server-trusted `user.id`, the trimmed utterance, a `surface` from a 12-value allow-list (`routes.ts:12021-12024`), five typed surface hints, and `ctx = intelligencePlatform.contextFor(user)` (`routes.ts:12044`).

`processUserTurn` orchestrates ten steps:

| # | Step | Site |
|---|---|---|
| 1 | Get-or-create conversation; get-or-open thread | `conversation-gateway.ts:1255-1259` |
| 2 | Resolve Companion voice — **Behaviour Engine** | `:1272` (`resolveBehaviour`) |
| 3 | Read prior entity refs for pronoun resolution | `:1275` (`getLastEntityRefs`) |
| 4 | Assemble Context **Frame** (pointer IDs only, never prompt text) | `:1278` (`assembleContextFrame`) |
| 5 | Persist the user turn | `:1294` |
| 6 | `buildGroundedResponse` over the last 7 turns minus the just-appended one | `:1297-1314` |
| 7 | Persist the assistant turn (`entityRefs`, `outcomeRef`, `resolvedIntent`, `fallbackState`) | `:1332` |
| 8 | Persist Companion Action proposals (non-fatal) | `:1342` |
| 9 | Record `shown` guidance events (non-fatal) | `:1353` |
| 10 | Return `TurnResult` | `:1369-1383` |

`buildGroundedResponse` (`:379-1169`) is where the reasoning happens, in order: write-intent guard → provider-availability guard → **intent resolution** (`:551`, `patternIntentResolver`) → **capability routing** (`:579-584`, parallel `intelligencePlatform.handle`) → INT42 sequential composition (`:586-613`) → INT50 **Food Intelligence** context composition (`:629-647`) → guidance and native discoveries (`:707-724`) → **progressive knowledge assembly** (`:730`, GOV1 Tiers 1-3) → fallback branch if a gap state exists → **enrichment** including **household reasoning** (`:889`, `buildHouseholdNutritionEnrichment`) → action drafts (`:903`) → **Context Composition Engine** (`:942`, `composeContext`) → prompt assembly (`:1010-1051`) → **LLM call** (`:1056`, temp 0.3, maxTokens 400, jsonMode) → parse.

Nine **Observation Engine** writes fire inside the turn, all fire-and-forget (`observation-engine.ts:156-163`, never blocks, never fails the turn): `behaviour-decision`, `escalation`, `intent-resolution`, `clarification`, `knowledge-retrieval`, `recovery`, `context-composition`, `response-generation`.

**What is NOT on the turn path in production:** the **Decision Engine** (`opportunity-delivery/framework.ts`) and the **Companion Notice Engine** (`notice-engine.ts`). Both are reached only by `GET /api/intelligence/companion/notices` (`routes.ts:11906-12002`), a separate route the client calls independently. `pattern-intent-resolver.ts:1172-1179` says so in terms: *"It has no resolver matcher… no opportunity-delivery intent is emitted."*

---

## 3. Current benchmark execution architecture

Four executable entry points, all of which build their turn function via `makeCompanionTurnRunner` (`server/tests/benchmark/companion-turn.ts:151`):

| Entry point | World mode | Conversation reset |
|---|---|---|
| `POST /api/admin/benchmark-households/run-benchmark` (`routes.ts:8779`) | `benchmark-world` | Per household (not per question) |
| `POST /api/intelligence/benchmark/run` (`routes.ts:8954`) | `single-world`, `householdLabel: "live"` | **None** |
| `server/tests/benchmark/run-benchmark.ts` (CLI) | `single-world` | **None** |
| `server/scripts/intq7-run-full-benchmark.ts`, `intq8-*.ts` | `benchmark-world` | Per household |

`makeCompanionTurnRunner` calls exactly one Companion function — `conversationGateway.processUserTurn(user.id, utterance, "floating", {}, ctx)` (`companion-turn.ts:164-170`) — with `ctx` built by the production `intelligencePlatform.contextFor(user)` (`:152`) and provider availability read from the production `createDefaultLlmProvider()` (`:155`). `"floating"` is a genuine production surface: it is `useSurface()`'s default for any unmatched route (`FloatingAssistant.tsx:73`).

`runner.ts` runs questions strictly sequentially in canonical fixture order (`runner.ts:148-151`), scores each with `scoreDeterministic`, and disposes the capability probe in a `finally` (`:177-179`). It emits one `benchmark-run` observation into the production Observation Engine (`:221-238`).

---

## 4. Execution flow, as required by the brief

```
BENCHMARK          runner.ts — sequential, canonical order, one thread for the whole run
    │              (fixture: companion-benchmark-100.v1.json)
    ▼
RUNTIME            companion-turn.ts:164 → conversationGateway.processUserTurn(user.id, utterance, "floating", {}, ctx)
    │              PRODUCTION. Identical seam to routes.ts:12031. ✅
    ▼
CONTEXT (frame)    assembleContextFrame  (gateway:1278)   PRODUCTION ✅
    │              ⚠ surfaceHints = {} — benchmark passes none; production passes none either (client
    │                sends only currentPath, which the server does not read). Equivalent by accident.
    ▼
DECISION           ✖ NOT REACHED — by the benchmark or by production. Decision Engine lives on
    │              GET /api/intelligence/companion/notices (routes.ts:11920), never on a turn.
    ▼
BEHAVIOUR          resolveBehaviour (gateway:1272) → sealBehaviourDecision (gateway:448)
    │              PRODUCTION ✅ (personality read from the acting user's real preferences)
    ▼
KNOWLEDGE          assembleKnowledge (gateway:730, GOV1 Tiers 1-3)          PRODUCTION ✅
    │              food-intelligence capability via intelligencePlatform.handle  PRODUCTION ✅
    │              buildHouseholdNutritionEnrichment (gateway:889)          PRODUCTION ✅
    │              ⚠ but see D2: the world it retrieves over has no meal nutrition, no allergens.
    ▼
COMPOSITION        composeContext (gateway:942)                             PRODUCTION ✅
    ▼
RESPONSE           llmProvider.complete (gateway:1056) — createDefaultLlmProvider, OpenAI gpt-4o-mini
    │              PRODUCTION ✅  Discoveries / guidance / enrichment / evidence: PRODUCTION ✅
    ▼
OBSERVATION        9 × recordObservation inside the turn                    PRODUCTION ✅
    │              + 1 × benchmark-run observation from runner.ts:221       BENCHMARK-ONLY (sanctioned)
    ▼
METRICS            scorer.ts / aggregate.ts / report.ts                     BENCHMARK-ONLY (correct — this
                   ⚠ but scorer re-implements platform outcome vocabulary    is measurement, not behaviour)
```

**Intercepted at one point:** `capability-probe.ts` installs an own-property shadow over `intelligencePlatform.handle` for the duration of a run (`capability-probe.ts:124-169`). It is a behaviour-preserving pass-through — it awaits the original, returns the outcome object unchanged, and re-throws unchanged — and it records only for the acting user (`:134-135`). It is nevertheless a mutation of a production singleton.

---

## 5. Side-by-side comparison

| Stage | Production | Benchmark | Classification |
|---|---|---|---|
| Entry point | `POST /…/conversation/turn` → `processUserTurn` | `makeCompanionTurnRunner` → `processUserTurn` | **Production implementation** ✅ |
| Acting identity | authenticated `req.user` | real `User` row via `resolveBenchmarkOwner` | **Production implementation** ✅ |
| `ctx` | `intelligencePlatform.contextFor(user)` | `intelligencePlatform.contextFor(user)` | **Production implementation** ✅ |
| Surface | `useSurface()`, defaults `"floating"` | hard-coded `"floating"` | **Simplified path** (minor — see D8) |
| Surface hints | `{}` in effect (client sends unread `currentPath`) | `{}` | **Production implementation** ✅ (by coincidence) |
| Conversation thread | one per user session, reset by user closing | **one per whole 100-question run** | **Missing integration** — D1 |
| Context frame | `assembleContextFrame` | same | **Production implementation** ✅ |
| Intent resolution | `patternIntentResolver.resolve` | same | **Production implementation** ✅ |
| Capability routing | `intelligencePlatform.handle` | same, wrapped by read-only probe | **Production implementation + sanctioned instrumentation** — D5 |
| Decision Engine | not on turn path | not on turn path | **Missing integration (platform-wide)** — D3 |
| Behaviour Engine | `resolveBehaviour` / `sealBehaviourDecision` | same | **Production implementation** ✅ |
| Observation Engine | 9 in-turn writes | same 9, + 1 `benchmark-run` | **Production implementation** ✅ |
| Notice Engine | `/companion/notices` route only | never called | **Missing integration** — D4 |
| Knowledge retrieval | `assembleKnowledge` | same | **Production implementation** ✅ |
| Food Intelligence | via registry capability | same | **Production implementation** ✅ |
| Household reasoning | `buildHouseholdNutritionEnrichment` | same | **Production implementation** ✅ |
| Context composition | `composeContext` | same | **Production implementation** ✅ |
| Response generation | `createDefaultLlmProvider` → OpenAI `gpt-4o-mini` | same factory | **Production implementation** ✅ |
| Insight / evidence generation | discoveries, guidance, enrichment, actions | same | **Production implementation** ✅ |
| World state | onboarding + `POST /api/meals` + `autoAnalyzeMeal` | `storage.*` writes, derivations skipped | **Duplicate implementation** — D2 |
| Evidence seeding | `recordOutcomeAndDetect` (90-day window) | `store.recordEvent` + re-implemented detection | **Duplicate implementation** — D7 |
| Logging | `logUnsuccessfulQuery`, `console.error` | same (transitively) | **Production implementation** ✅ |
| Metrics | Observation Engine | scorer/aggregate over `TurnResult` | **Benchmark-only (correct)** |
| Outcome vocabulary | `IntentOutcomeStatus` (`types.ts:299`) | hand-copied `Set` (`scorer.ts:151`) | **Duplicate implementation** — D6 |
| Refusal detection | Behaviour Engine voicing | 25-string keyword list (`scorer.ts:137`) | **Temporary testing shortcut** — D6 |
| Judge | n/a | pinned Anthropic `claude-opus-4-8`, **disabled** | **Technical debt (latent)** — D9 |

---

## 6. Divergence register

### D1 — The conversation thread is never reset between questions
**Classification: Missing integration.** **Severity: HIGH.**

`processUserTurn` calls `getActiveThread` and only opens a new thread when none exists (`conversation-gateway.ts:1256-1258`). Nothing in `runner.ts` or `companion-turn.ts` closes the thread between questions. `resetBenchmarkHousehold` deletes the owner's conversations (`world-seeder.ts:228`) exactly once, *before* the run.

Consequently every question after the first is answered with the previous five turns injected into the system prompt as `CONVERSATION HISTORY` (`conversation-gateway.ts:999-1003`), and with the previous question's `entityRefs` available for pronoun resolution (`:1275`).

This contradicts `BENCHMARK_EXECUTION_PROCESS.md` §1 step 3a — *"reset conversation state for its household (fresh thread)"* — verbatim.

**Impact:** question scores are order-dependent and mutually contaminating. A question that would produce an honest gap in isolation may be answered from a neighbouring question's context, inflating D-dimension scores; conversely, a stale entity ref can misroute a question that would otherwise route cleanly. Because `select.ts` quick mode picks one question per category, quick and full runs contaminate *differently*, so the two modes are not comparable. Every historical run artefact in `docs/intelligence/benchmark/history/` carries this effect.

**Smallest convergent change:** have the runner close the active thread after each question through the existing store seam — `conversationStore.closeThread(threadId)` already exists (`conversation-store.ts:125`) and `openThread` already documents *"Does NOT auto-close the previous thread — call closeThread() explicitly."* No new runtime pathway; the seam is already public and already used. This requires `TurnResult` to surface `threadId` (it surfaces `conversationId` and `threadId` already per `routes.ts:12046-12077`), so the change is confined to `companion-turn.ts` + `runner.ts`.

---

### D2 — The benchmark world skips production's derivation side-effects
**Classification: Duplicate implementation.** **Severity: HIGH.**

`world-seeder.ts` is a hybrid: content is written through production `storage.*` calls (`createUser` `:116`, `createHouseholdForUser` `:145`, `upsertUserPreferences` `:284`, `addPantryItem` `:331`, `createMeal` `:338`, `addPlannerEntry` `:365`, `createFoodDiaryEntry` `:389`), but identity flags, partner membership and all teardown are raw `db.*` writes (`:125-136`, `:161-169`, `:179-251`).

The seeder calls `storage.createMeal` directly. Production's `POST /api/meals` calls `storage.createMeal` **and then** `storage.createNutrition`, `logProductEvent(MEAL_SAVED)`, and `autoAnalyzeMeal(meal.id)` (`routes.ts:1279-1309`). `autoAnalyzeMeal` is what writes the `nutrition` row (`routes.ts:751-824`) and the `meal_allergens` rows (`routes.ts:827-849`).

**Therefore every meal in every benchmark household has zero nutrition rows and zero allergen rows.** The seeder's teardown even deletes `meal_allergens` (`world-seeder.ts:206`) and never rebuilds them.

This is the most consequential finding for score validity, because the Companion's nutrition reasoning, household nutrition enrichment (`gateway:889`) and Food Intelligence ranking all read exactly the tables the seeder leaves empty. The benchmark is measuring the Companion's ability to reason about food *against a world with no nutrition data*. Whatever the platform scores on nutrition questions today, that score was earned against an impoverished world — it is not necessarily *wrong*, but it is not a measurement of the production experience.

Related: `starterMealsLoaded: true` is set by raw update (`:134`) without ever preloading starter meals; onboarding's `goalType` derivation and `updateUserPriceTier` (`routes.ts:5405-5422`) are skipped; shopping items carry `matchedStore`/`matchedPrice`/`thaRating` with no backing `productMatches`/`ingredientSources` rows (wiped at `:184-185`, never rebuilt).

**Smallest convergent change:** the seeder should call the same post-create derivations production calls, not re-derive them. `autoAnalyzeMeal` is currently a route-local function in `routes.ts`; extracting it (unchanged) to a service the route and the seeder both call is the minimal convergence. That is an *extraction*, not a new pathway.

---

### D3 — The Decision Engine is unreachable from any conversational turn
**Classification: Missing integration (platform-wide, not benchmark-specific).** **Severity: HIGH — but the finding is about the platform, not the benchmark.**

The brief asks whether the benchmark exercises the Decision Engine. It does not. **Neither does production.**

`shared/attention/decision.ts` and `server/intelligence/opportunity-delivery/framework.ts` are designated the canonical Decision Engine by `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Appendix A (line 813, DEC1, 2026-07-09). The engine is bound as capability `"opportunity-delivery"` (`bindings/opportunity-delivery.ts:57`). But `pattern-intent-resolver.ts:1172-1179` states plainly that no matcher emits that capability id. Its only production caller is `routes.ts:11920`, inside `GET /api/intelligence/companion/notices`.

So the benchmark faithfully reproduces production here: a conversational turn touches no Decision Engine because a conversational turn *cannot*. The benchmark is not diverging; it is accurately reflecting an architecture in which the Decision Engine sits on the proactive-notices surface only.

**This means the benchmark, as constituted, structurally cannot measure the Decision Engine, the Notice Engine, or the ambient-surfacing experience — no matter how faithful its Companion integration becomes.** A 100-question conversational corpus is the wrong instrument for a proactive engine.

**Smallest convergent change:** do **not** wire the Decision Engine into `processUserTurn` — that would be inventing a runtime pathway and would violate both the Decision Engine architecture's hard boundaries and this audit's constraints. Instead, recognise that "benchmark the Companion" currently means "benchmark the conversational surface", and either (a) explicitly scope the benchmark to the conversational surface in `BENCHMARK_EXECUTION_PROCESS.md`, or (b) commission a *second*, notices-surface benchmark that drives `GET /api/intelligence/companion/notices` as its one seam. Option (a) is the smaller change and should precede (b).

---

### D4 — The Companion Notice Engine is never exercised
**Classification: Missing integration.** **Severity: MEDIUM.** Same root cause and same remedy as D3: the Notice Engine (`notice-engine.ts`, `applySilenceRules` at `:357`) is reached only from `routes.ts:11993`.

---

### D5 — The capability probe monkey-patches a production singleton
**Classification: Technical debt (sanctioned, well-mitigated).** **Severity: LOW.**

`capability-probe.ts:124-169` assigns an own property over `intelligencePlatform.handle`, shadowing the prototype method (`intelligence-platform.ts:233`). It works because `defaultHandleIntent` resolves `intelligencePlatform.handle` at call time.

Three mitigations, all verified: it is a pure pass-through (awaits original, returns the outcome unchanged, re-throws unchanged); it records only when `context.userId` matches the acting user, otherwise `return original(...)` untouched (`:134-135`); install/uninstall is reference-counted and `runner.ts` disposes in a `finally` (`:177-179`). `test-benchmark-capability-utilisation.ts:238-271` asserts the singleton is restored.

The residual risk is honest and small: during a run, *every* caller of `intelligencePlatform.handle` — including a concurrent real user on the same process — passes through the wrapper. Behaviour is unchanged; a `Map` lookup and a closure are added. This also sits in tension with `BENCHMARK_EXECUTION_PROCESS.md` §2 precondition 5, *"One Companion, unmodified"*.

**Smallest convergent change:** none required in BENCHINT2. If the tension with precondition 5 is to be resolved, the right move is to promote capability-invocation observability into the platform itself — the Observation Engine already records `intent-resolution` — rather than to keep instrumenting from outside. That is an Observation Engine change, not a benchmark change, and it is not urgent.

---

### D6 — The scorer re-implements the platform's outcome vocabulary and refusal detection
**Classification: Duplicate implementation (statuses) + Temporary testing shortcut (refusal markers).** **Severity: MEDIUM.**

`scorer.ts:151-154` hand-copies platform statuses:
```ts
const HONEST_GAP_OUTCOMES = new Set(["gap","not_executable","unsupported_intent","unknown_capability","denied"]);
const HONEST_GAP_FALLBACKS = new Set(["no-route","no-knowledge","no-results"]);
```
The canonical union is `IntentOutcomeStatus` (`server/intelligence/types.ts:299-312`). Today the set is *correct* — it is exactly the five non-`ok`, non-`confirmation_required` members. But it is a literal, not a type. Adding an eighth status to `types.ts` will not fail a type-check here; it will silently score as "not an honest gap".

`scorer.ts:137-149` defines `LIMITATION_MARKERS`, a 25-string keyword list (`"can't"`, `"your gp"`, `"not medical advice"`, …) used by `statesALimitation()` to decide whether the Companion refused. This is a benchmark-side re-implementation of a notion the Behaviour Engine owns. The file's own comment concedes it is an approximation deferring subtlety to the judge — a judge which is disabled (D9). So the approximation is currently load-bearing with nothing behind it.

`expectations.ts` is the counter-example and the model to follow: it imports and calls the production `detectWriteIntent` (`:29`, used `:252`), and reads capability truth live from the real registry (`intelligencePlatform.registry.list()` at `:72-74`), failing loudly at load if a fixture alias names a non-existent capability (`:146-155`).

**Smallest convergent change:** derive `HONEST_GAP_OUTCOMES` from an exhaustive `Record<IntentOutcomeStatus, boolean>` so the compiler forces an update when the union changes. Leave `LIMITATION_MARKERS` alone until the judge question (D9) is settled — replacing a keyword list with a second keyword list is not convergence.

---

### D7 — Evidence seeding bypasses the evidence framework orchestrator
**Classification: Duplicate implementation.** **Severity: MEDIUM.**

Production records evidence only through `recordOutcomeAndDetect` (`evidence-learning/framework.ts:228`), which re-detects over a 90-day window (`since = now − EVIDENCE_WINDOW_DAYS`, `:234-241`). The seeder calls the low-level `evidenceLearningStore.recordEvent` and then re-implements detection with `listEvents({...})` **without the window filter** (`world-seeder.ts:431-433`), and backdates `occurredAt` (`:424`), which `recordOutcome` never does.

The detection *maths* is the same function (`detectPatterns` / `upsertSignal`), so for the fixture's short day-offsets the resulting signals are equivalent. The divergence is the emission path and the missing window, not the arithmetic.

**Smallest convergent change:** call `recordOutcomeAndDetect` per event. If backdating is genuinely required for fixture realism, that argues for an explicit `occurredAt` parameter on the production orchestrator — a small, honest extension of existing architecture — rather than a parallel path.

---

### D8 — `single-world` runs execute against a real user's live conversation
**Classification: Technical debt.** **Severity: MEDIUM.**

`POST /api/intelligence/benchmark/run` (`routes.ts:8954-8978`) builds a turn runner over `req.user` — the logged-in admin — with `worldMode: "single-world"`, and performs **no reset**. Combined with D1, this means 100 benchmark utterances are appended to that admin's real conversation thread, and the first questions are answered with whatever the admin last said to the Companion still in the prompt window.

`BENCHMARK_EXECUTION_PROCESS.md` §2 precondition 3 requires a *"disposable seeded database… The benchmark refuses to run against anything it did not provision."* This route provisions nothing.

**Smallest convergent change:** in `single-world` mode, open a dedicated thread for the run and close it at the end (the same `closeThread` seam as D1), so the operator's real conversation is untouched. Alternatively, restrict the route to `benchmark-world` owners. Do not add an `isBenchmark` flag to the gateway.

---

### D9 — The judge is pinned to a different provider than production, and is disabled
**Classification: Technical debt (latent).** **Severity: MEDIUM.**

`resolveJudge()` "always returns the disabled judge" (`judge.ts:48-50`); `disabledJudge.score()` returns `null` (`:36-41`). Every run today is deterministic-only and honestly stamps `judge.invoked = false`.

The bundle nevertheless pins `JUDGE_MODEL = "claude-opus-4-8"` at temperature 0 with a frozen prompt hash (`bundle.ts:56, 108-117`). Production conversation uses `createDefaultLlmProvider()` → OpenAI `gpt-4o-mini` (`llm-provider.ts:53-63`); there is no Anthropic client in that file.

Using a different model to *grade* than to *answer* is deliberate and correct — a grader should not be a participant. The debt is that `BENCHMARK_EXECUTION_PROCESS.md` §2 precondition 4 says *"Judge is reachable and pinned… A judge mismatch is a hard abort"*, and the harness instead proceeds happily with no judge at all. The precondition is not enforced. Meanwhile the deterministic scorer's acknowledged approximations (D6) are supposed to defer to that judge.

**Smallest convergent change:** decide, and record the decision. Either implement the pinned judge client, or amend the governing precondition to state that deterministic-only runs are valid and that judge-owned dimensions are reported as unscored rather than approximated. Do not leave the harness claiming a precondition it does not assert.

---

### D10 — `BENCHMARK_CLOCK` is stamped but never injected
**Classification: Technical debt.** **Severity: LOW.**

`bundle.ts:59` defines `BENCHMARK_CLOCK = "2026-07-04T00:00:00Z"` and `resolveProvenance` (`:160`) stamps it into the artefact as `clock`. Nothing injects it into the Companion or the seeder — both call real `new Date()` (e.g. `world-seeder.ts:257-267` dates diary and evidence relative to the reset instant, and `conversation-gateway.ts` builds its temporal anchor from the wall clock).

The artefact therefore asserts a frozen clock the run did not have. Runs are reproducible in structure, not in temporal grounding: a question about "this week" resolves differently in July than in December.

**Smallest convergent change:** either inject a clock through the existing context-frame temporal anchor, or stop stamping `clock` in provenance and record `clock: "wall"`. The dishonest artefact field is the defect; the wall clock itself may be acceptable.

---

### D11 — The seeder leaves an orphaned, member-less household
**Classification: Technical debt.** **Severity: LOW (data hygiene).**

`storage.createUser` auto-creates a solo household for every new user (`storage.ts:408-429`). For the partner adult, `ensureHousehold` then deletes *all* of the partner's memberships (`world-seeder.ts:161`) and inserts one into the owner's household. The partner's original household row survives with zero members — a state no production flow produces. Production adds a second adult by invite (`findHouseholdByInviteCode` + accept), which the seeder never exercises.

**Smallest convergent change:** seed the partner through the production invite/accept path, or delete the orphan row in teardown.

---

### D12 — `context-composition-verification/` bypasses the one seam
**Classification: Benchmark-only code (acceptable, but mislabelled by location).** **Severity: LOW.**

`context-composition-verification/engine.ts:84` constructs `new ConversationGateway(new InMemoryConversationStore(), new Stub(), undefined, recording as any)` — an in-memory store, a stub `ILlmProvider` returning a canned response, and a recording `handleIntent`. `probe.ts:57` does likewise.

It **does** call the real `composeContext` (`engine.ts:19`, used `:106`), so it does not re-implement the Context Composition Engine. It is a legitimate out-of-band verification harness for one engine, and it is not part of the scored run.

The only issue is that it lives inside `server/tests/benchmark/`, where `BENCHMARK_AUTOMATION.md` §2 imposes a hard import-surface constraint that this sub-tree openly violates. A reader auditing the import surface will find a `ConversationGateway` constructor call and a stub LLM provider inside the benchmark tree and reasonably conclude the invariant is broken.

**Smallest convergent change:** move it to `server/tests/context-composition/`, or state the carve-out explicitly in `BENCHMARK_AUTOMATION.md` §2. This is a filing fix, not a code fix.

---

### D13 — No benchmark-only branch exists inside production code ✅
**Classification: none. This is a clean finding, recorded because the brief asked.**

Grepping `server/intelligence` and `server/services` for `benchmark`, `isBenchmark`, `impersonat`: every hit is either an observation-kind constant (`observation-engine.ts:61`, `"benchmark-run"`), a data-routing branch on that kind (`execution-timeline.ts:202,446,470,479`), or a *comment* citing benchmark measurement as the motivation for an unconditional production behaviour (`pattern-intent-resolver.ts:1081,1141,1158,1161,1960`; `context-composition-engine.ts:117`; `context-relevance.ts:97`; `context-view.ts:102,190,274,343`; `conversation-gateway.ts:235`).

Impersonation (`routes.ts:8836-8890`) is an ordinary `req.login` swap, DEV-only and admin-gated; `session.benchmarkImpersonation` is read only by its own status and stop routes. No handler branches on it.

**The platform contains no benchmark-aware behaviour. This is the single most important thing this audit confirms, and it should be protected by a test.**

---

## 7. Integration gaps

| Gap | Stage | Reachable today? |
|---|---|---|
| Decision Engine | Decision | No — not from any turn, in production or benchmark (D3) |
| Companion Notice Engine | Decision/Insight | No — notices route only (D4) |
| Per-question turn isolation | Runtime | No (D1) |
| Meal nutrition / allergen derivation | Knowledge | No — never seeded (D2) |
| Product-match join rows | Knowledge | No — wiped, never rebuilt (D2) |
| Judge tier | Metrics | No — disabled (D9) |
| Frozen clock | Runtime | No — stamped but not injected (D10) |
| Disposable database precondition | Runtime | No — `single-world` runs on the live store (D8) |

## 8. Duplicate components

| Benchmark component | Production owner it shadows | Divergence |
|---|---|---|
| `scorer.ts` `HONEST_GAP_OUTCOMES` | `IntentOutcomeStatus`, `types.ts:299` | D6 |
| `scorer.ts` `LIMITATION_MARKERS` / `statesALimitation` | Behaviour Engine voicing | D6 |
| `expectations.ts` `HONEST_GAP_MARKERS` / `GUARANTEE_MARKERS` | Behaviour Engine voicing | D6 |
| `world-seeder.ts` evidence detection loop | `recordOutcomeAndDetect`, `framework.ts:228` | D7 |
| `world-seeder.ts` account-flag writes | onboarding + verification flows | D2 |
| `world-seeder.ts` partner membership | invite/accept flow | D11 |
| `world-seeder.ts` meal creation | `POST /api/meals` + `autoAnalyzeMeal` | D2 |

`scorer.ts`'s dimension rubric, gates and bands are **not** duplication — they are measurement, which is the benchmark's own concern and correctly owned here.

## 9. Architectural risks

1. **Score validity (D2 + D1).** Every historical benchmark artefact was produced against a nutrition-free, allergen-free world, with cross-question conversational contamination. Trend comparisons across runs remain internally consistent, but absolute scores do not represent the production experience, and quick-vs-full modes are not comparable to each other.
2. **Silent vocabulary drift (D6).** Adding an `IntentOutcomeStatus` member will silently mis-score rather than fail to compile.
3. **Unenforced governing preconditions (D8, D9, A1).** `BENCHMARK_EXECUTION_PROCESS.md` §2 asserts four preconditions the harness does not check. A document that claims a gate it does not hold is worse than one that claims nothing.
4. **Instrument-in-the-experiment (D5).** Low residual risk, well mitigated, but it is a production singleton mutation and it contradicts a stated precondition.
5. **Scope illusion (D3, D4).** "The Companion Benchmark" is understood platform-wide as measuring the Companion. It measures the *conversational surface* of the Companion. The proactive surface — where the Decision Engine, the Notice Engine and all ambient surfacing live — is unmeasured by any benchmark. This is the largest unacknowledged gap in the platform's acceptance measure.

---

## 10. Recommended remediation plan

Ordered by *value per unit of change*, and constrained to convergence — no new runtime pathway, no duplicated Companion logic, no benchmark-aware production branch.

**Tier 1 — restores score validity. Nothing else should ship first.**
- Reset the conversation thread per question via the existing `closeThread` seam (D1).
- Extract `autoAnalyzeMeal` from `routes.ts` to a service; have both the route and the seeder call it (D2).

**Tier 2 — closes honesty gaps in the artefact and the harness.**
- Type-derive the scorer's honest-gap status set from `IntentOutcomeStatus` (D6).
- Decide the judge question and make the artefact and the governing doc agree (D9).
- Make `clock` provenance honest, or inject the frozen clock (D10).
- Give `single-world` runs their own thread, or restrict the route (D8).

**Tier 3 — hygiene and protection.**
- Seed evidence through `recordOutcomeAndDetect` (D7).
- Seed the partner through the invite path, or delete the orphan household (D11).
- Add a regression test asserting no `isBenchmark`-style branch exists in `server/intelligence` and `server/services` — protect D13.
- Relocate `context-composition-verification/`, or carve it out explicitly in `BENCHMARK_AUTOMATION.md` §2 (D12).

**Tier 4 — scope, and it is a governance decision, not an implementation.**
- Settle assumption A1: are the benchmark framework docs governing, or specification?
- Amend `BENCHMARK_EXECUTION_PROCESS.md` to state that the benchmark measures the **conversational surface**, and that the Decision and Notice Engines are out of its scope by construction (D3, D4).
- Only then consider whether a second, notices-surface benchmark is warranted. **Do not wire the Decision Engine into `processUserTurn`.**

---

## 11. Ordered BENCHINT2 implementation tasks

Each task names its single smallest change, its owner file, and the divergence it closes. **None of these were implemented during this audit.**

| # | Task | Files | Closes | Risk |
|---|---|---|---|---|
| 1 | Close the active thread after each benchmark question via the existing `closeThread` store seam | `server/tests/benchmark/companion-turn.ts`, `runner.ts` | D1 | AMBER — resets every historical baseline; the first post-fix run is a new baseline, not a regression |
| 2 | Extract `autoAnalyzeMeal` (unchanged) from `server/routes.ts` into a service; call it from the meals route **and** the seeder | `server/routes.ts`, new `server/services/meal-analysis.ts`, `server/benchmark/world-seeder.ts` | D2 | AMBER — pure extraction; the route's behaviour must be byte-identical |
| 3 | Give `single-world` runs a dedicated thread, closed at run end | `server/routes.ts:8954`, `run-benchmark.ts` | D8 | GREEN |
| 4 | Derive `HONEST_GAP_OUTCOMES` from an exhaustive `Record<IntentOutcomeStatus, …>` so the union change fails the build | `server/tests/benchmark/scorer.ts` | D6 | GREEN |
| 5 | Make the `clock` provenance field honest (`"wall"`), or inject `BENCHMARK_CLOCK` through the context frame's temporal anchor | `server/tests/benchmark/bundle.ts` | D10 | GREEN |
| 6 | Seed evidence through `recordOutcomeAndDetect`; add an explicit `occurredAt` to that orchestrator if backdating is required | `server/benchmark/world-seeder.ts`, `server/intelligence/evidence-learning/framework.ts` | D7 | AMBER — touches a production orchestrator signature |
| 7 | Seed the partner adult through the production invite/accept path; delete the orphan household in teardown | `server/benchmark/world-seeder.ts` | D11 | GREEN |
| 8 | Add a regression test asserting `server/intelligence/**` and `server/services/**` contain no benchmark-conditional branch | new `server/tests/test-benchmark-no-production-branch.ts` | protects D13 | GREEN |
| 9 | Relocate `context-composition-verification/` out of the benchmark import surface, or document the carve-out | `server/tests/benchmark/context-composition-verification/*`, `BENCHMARK_AUTOMATION.md` §2 | D12 | GREEN |
| 10 | **Governance, not code:** settle A1; scope `BENCHMARK_EXECUTION_PROCESS.md` to the conversational surface; record that the Decision and Notice Engines are out of scope by construction | `docs/intelligence/benchmark/BENCHMARK_EXECUTION_PROCESS.md` | D3, D4 | GREEN |
| 11 | **Governance, not code:** resolve the judge — implement the pinned client, or amend precondition 4 and report judge-owned dimensions as unscored | `judge.ts` or `BENCHMARK_EXECUTION_PROCESS.md` §2 | D9 | AMBER — changes what a score means |

Tasks 1 and 2 must land together and in that order; running task 2 without task 1 would improve the world while leaving the contamination in place, and the resulting score movement would be uninterpretable.

Task 5 in the capability probe (D5) is deliberately **absent**: no change is recommended. The probe is well-built, correctly scoped, and disposed. Promoting capability observability into the Observation Engine is the right long-term move, but it is Observation Engine work, not benchmark work, and it is not urgent.

---

## 12. Constraint compliance

| Constraint | Status |
|---|---|
| Do not create new runtime pathways | Held — no recommendation adds one; D3's remedy explicitly forbids wiring the Decision Engine into the turn |
| Do not duplicate Companion logic | Held — every remedy removes duplication or converges onto an existing seam |
| Follow existing architectural ownership | Held — `closeThread`, `recordOutcomeAndDetect`, `autoAnalyzeMeal`, `IntentOutcomeStatus` are all existing owners |
| Respect the Source of Truth Register | Held — the register's one relevant entry (Decision Engine, Appendix A line 813) is cited and honoured |
| Extend existing architecture where appropriate | Held — task 6 proposes an `occurredAt` parameter on an existing orchestrator rather than a parallel path |
| Favour convergence over replacement | Held — nothing is replaced; task 2 is an extraction, not a rewrite |
| Record assumptions explicitly | Held — §0, four assumptions, one of which (A1) gates Tier 4 |
| Do not implement fixes | Held — no source file was modified. Only this document was created |

---

## 13. What this audit did not verify

- No benchmark run was executed (per `ARCH_BENCHMARK_OWNERSHIP_RULE.md`), so all runtime claims are static (A2).
- The `docs/intelligence/benchmark/history/` artefacts were not opened; the claim that historical scores are affected by D1 and D2 is inferred from the code, not from the artefacts.
- `BENCHMARK_HOUSEHOLDS.md`'s seed-contract checksum was not exhaustively searched for (A4).
- `aggregate.ts` and `report.ts` (683 + 662 lines) were reviewed for duplicated *Companion* logic and found to contain none. Their rollup and rendering correctness was not audited — out of scope.
- The 100-question fixture was not read. Whether the corpus itself exercises the capabilities it claims to is a separate question, addressed by the existing `BENCH3_INTENT_RESOLVER_R1_COVERAGE.md` and `BENCH4_FOOD_INTELLIGENCE_REACHABILITY.md`.

---

*BENCHINT1 is an audit. It changes nothing. Its output is the ordered task list in §11, which is the input to BENCHINT2.*
