# BENCHINT2 — Benchmark Runtime Convergence

**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Workstream:** `BENCHINT` (Benchmark ⇄ Platform Integration)
**Input:** [`docs/investigations/benchmarking/BENCHINT1_BENCHMARK_PLATFORM_INTEGRATION_AUDIT.md`](../../investigations/benchmarking/BENCHINT1_BENCHMARK_PLATFORM_INTEGRATION_AUDIT.md) §11
**Risk:** 🟡 AMBER
**Reason:** A route-local function was extracted to a service (behaviour must be byte-identical); a production evidence orchestrator gained one optional parameter; the benchmark's historical baselines are invalidated by design.

**Benchmark ownership rule compliance:** the Companion Benchmark was **not executed**. No scored run, no run artefact, no score is quoted anywhere in this document. `ARCH_BENCHMARK_OWNERSHIP_RULE.md` reserves benchmark execution for the user. Benchmark *world creation* was executed — that is seeding, not measurement — and its evidence is in §5.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-benchint2-runtime-convergence-20260710` → `678b1aee2eeb2df775d1bc7f163c30eda1d39df4` |
| Dirty-tree snapshot | `git stash` entry `BENCHINT2_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-10` → `5377b04875ee379d369c50eb2b23dd0a80b82ec7` |
| Working tree | Intentionally dirty — 312 pre-existing paths from unrelated in-flight work (DEC1, ATTN1, KNOW5, HOUSE2). BENCHINT2 touched 9 of them. |
| This task's writes | See [§4 Files changed](#4-files-changed) |
| Rollback to committed state | `git checkout rollback/before-benchint2-runtime-convergence-20260710` |
| Restore the pre-implementation working tree | `git checkout 5377b04 -- <path>` per file (see §9) |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (Architecture Bootstrap — mandatory entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md`
- [x] `docs/investigations/benchmarking/BENCHINT1_BENCHMARK_PLATFORM_INTEGRATION_AUDIT.md`
- [x] `docs/intelligence/benchmark/BENCHMARK_AUTOMATION.md`
- [x] `docs/implementation/governance/ARCH_BENCHMARK_OWNERSHIP_RULE.md`

---

## 1. Implementation summary

BENCHINT1 found the benchmark's answer-producing path already sound — every scored question already ran through the real `conversationGateway.processUserTurn`. The divergences were not in the Companion's reasoning; they were in **what the benchmark asked questions about**, **how it isolated them**, and **who owned the vocabulary it measured with**. BENCHINT2 closes those.

Nothing in the Companion runtime changed. No engine was modified, no engine was newly integrated, no runtime pathway was created, and no production code learned that it was being benchmarked — the last of which is now asserted by a test rather than trusted.

### Priority 1 — Conversation isolation (closes D1, D8)

Every benchmark question now runs in its own conversation thread.

The mechanism is the production conversation lifecycle, unmodified. `IConversationStore.openThread` has always documented *"Does NOT auto-close the previous thread — call closeThread() explicitly"*, and `processUserTurn` opens a fresh thread whenever none is active (`conversation-gateway.ts:1256-1258`). The benchmark's one-seam adapter now closes the acting user's active thread around each question. The gateway is untouched; there is no flag, no branch, and no second execution path. Closing a thread is what a conversation ending *is*.

The close runs in a `finally`, so a question that throws cannot contaminate the next one, and once more before the first question — which is what closes D8. A `single-world` run acts as a real logged-in operator whose Companion thread may already be open; previously the first benchmark questions were answered with whatever that operator had last said to the Companion still in the prompt window.

An isolation failure **aborts the run**. Swallowing it would leave the thread open and quietly restore cross-question contamination, producing a scored artefact that looks valid and is not.

### Priority 2 — World creation runs production's derivation (closes D2)

`autoAnalyzeMeal` — which derives a meal's `nutrition` row and its `meal_allergens` rows from its ingredients — was a route-local function inside `server/routes.ts`, reachable only by an HTTP request. The Benchmark World seeder wrote meals through `storage.createMeal` and stopped there.

**Every meal in every benchmark household therefore had zero nutrition rows and zero allergen rows** — the exact two tables the Companion's nutrition reasoning, `buildHouseholdNutritionEnrichment`, and Food Intelligence ranking all read. The benchmark was measuring food reasoning against a world with no food data.

The derivation is now `server/services/meal-analysis.ts`, a verbatim extraction with the recipe-page helpers it depends on split into `server/services/recipe-scraping.ts`. The meals route calls it. The seeder calls it. It is the one owner, and it is not benchmark-aware — nothing in it branches on the caller.

### Priority 3 — Duplicated ownership removed (closes D6 statuses, D7)

**Outcome vocabulary.** `scorer.ts` hand-copied the platform's honest-gap statuses into a string `Set`. Adding an eighth `IntentOutcomeStatus` would not have failed a type-check; it would have silently scored as "not an honest gap", and the benchmark would have kept reporting a number that was wrong. The sets are now exhaustive `Record<IntentOutcomeStatus, boolean>` and `Record<UnsuccessfulTurnState, boolean>` over the platform's own unions, imported **as types** (erased at runtime, so the import surface is unchanged). A new union member now fails the build until someone states whether it is an honest gap.

**Evidence orchestration.** The seeder called the low-level `evidenceLearningStore.recordEvent` and then re-implemented detection with `listEvents({...})` carrying **no `EVIDENCE_WINDOW_DAYS` filter**. The arithmetic matched; the emission path and the window did not. It now calls `recordOutcomeAndDetect`, the one path by which production records an outcome.

That orchestrator gained one optional field, `occurredAt`, because the seeder's fixtures express evidence as day-offsets and backdating was the reason a parallel path existed at all. It is an honest extension, not an accommodation: a backdated event still passes through the same `since` filter, so an event older than the window is recorded and then correctly ignored by detection — exactly as an event that aged out would be. Every live caller omits it and gets `NOW()`.

**Household membership.** The seeder attached the partner adult with a raw `DELETE householdMembers WHERE userId = …` followed by an `INSERT`, leaving the partner's auto-created solo household with zero members — a state no production flow can produce. It now uses `storage.joinHousehold`, the production invite/accept path, which marks the prior membership `left` exactly as a real second adult's join does (verified — §5.3).

### Priority 4 — Remaining approved convergence

- **D10 — the artefact stops lying about its clock.** `BENCHMARK_CLOCK` was a frozen instant stamped into every run's provenance that nothing ever injected. Injecting it would mean threading a benchmark clock through the Context Composition Engine's temporal anchor — a benchmark-specific pathway inside the production runtime, which this workstream forbids. So provenance now records `clock: "wall"`. A run is reproducible in structure; it is not reproducible in temporal grounding, and the artefact now says so.
- **D12 — the benchmark's import surface is now true as written.** `context-composition-verification/` constructed a `ConversationGateway` with an in-memory store and a stub LLM provider inside `server/tests/benchmark/`, flatly contradicting `BENCHMARK_AUTOMATION.md` §2. It is a legitimate out-of-band harness for one engine, so it moved to `server/tests/context-composition/`. **Every** file remaining under `server/tests/benchmark/` now satisfies the constraint.
- **D13 — protected by a test.** `server/tests/test-benchmark-no-production-branch.ts` scans `server/intelligence/**` and `server/services/**` for any executable reference to the benchmark or to impersonation. Comments may discuss the benchmark freely; code may not.
- **`BENCHMARK_AUTOMATION.md` §2 amended** to describe the import surface the harness actually has, rather than one it does not. A document that claims a gate it does not hold is worse than one that claims nothing (BENCHINT1 §9.3).

### Deliberately not done

| BENCHINT1 item | Decision |
|---|---|
| D3 Decision Engine on the turn path | **Not wired.** Forbidden by the brief and by the Decision Engine's own hard boundaries. It is a governance/scoping question (§7). |
| D4 Notice Engine integration | **Not wired.** Same. |
| D5 capability probe monkey-patch | **No change**, exactly as BENCHINT1 recommended. The probe is a pass-through, user-scoped, reference-counted and disposed in a `finally`. |
| D6 `LIMITATION_MARKERS` | **Left alone**, as BENCHINT1 directed: replacing a keyword list with a second keyword list is not convergence. Blocked on the judge decision (D9). |
| D9 the judge | **Governance decision, not code.** Recorded in §7. |
| `logProductEvent(MEAL_SAVED)` in the seeder | **Not added.** `product_events` is not in the seeder's scoped wipe, so emitting it would make the reset non-deterministic and would accumulate rows across reseeds. Telemetry is not derivation. |

---

## 2. ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity                                                    ✅
  Benchmark accounts are ordinary `users` rows keyed by deterministic username;
  benchmark households are ordinary `households` rows. No second key space is
  introduced. Conversation threads keep their existing `conversation_threads.id`.

□ One owner per fact                                                        ✅
  Meal nutrition + allergens: server/services/meal-analysis.ts (was: routes.ts,
  and NOT derived at all for seeded meals).
  Evidence events + learning signals: recordOutcomeAndDetect (was: duplicated in
  world-seeder.ts).
  Household membership: storage.joinHousehold (was: raw db writes in world-seeder.ts).
  Honest-gap vocabulary: IntentOutcomeStatus / UnsuccessfulTurnState (was: copied
  into scorer.ts as string literals).
  Conversation lifecycle: IConversationStore (unchanged owner; the benchmark now
  calls it instead of never calling it).

□ No duplicate entities                                                     ✅
  meal-analysis.ts and recipe-scraping.ts are extractions of existing functions,
  moved verbatim. No new entity, no new table, no new store.

□ No duplicate ownership                                                    ✅
  This workstream REMOVES four duplicate owners and adds none. See Convergence
  Status below for the count.

□ No duplicate state                                                        ✅
  No user state is split. `analyzedMealIds` (a process-lifetime memo) moved with
  its function and remains its single, private owner; `forgetAnalyzedMeal` names
  the invalidation the route previously performed inline.

□ Extends existing architecture                                             ✅
  Conversation isolation extends the documented openThread/closeThread lifecycle.
  Evidence seeding extends recordOutcomeAndDetect with one optional parameter.
  The partner adult extends the invite/accept flow. Nothing is built beside.

□ Progressive enrichment where appropriate                                  ✅
  Meal nutrition is a derived knowledge attribute: identity (createMeal) → core
  (ingredients) → derived (nutrition, allergens). BENCHINT2 restores the derived
  tier for seeded meals. Transactional state gains no enrichment.

□ Honest gaps over fabricated information                                   ✅
  autoAnalyzeMeal writes NO nutrition row when OpenFoodFacts returns nothing —
  it never estimates from zero. Allergens derive offline with no network. An
  offline seed therefore yields correct allergens and an honest nutrition gap.
  The `clock` provenance field stops asserting a frozen instant the run never had.

□ No permanent synchronisation bridge                                       ✅
  None. Each fact has exactly one writer; the benchmark reads, it does not mirror.

□ Evolution over replacement                                                ✅
  Nothing is replaced. routes.ts's derivation is not rewritten — it is moved and
  then imported back. The route's behaviour is byte-identical.
```

---

## 3. AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform      — benchmark turns go through conversationGateway.processUserTurn, unchanged
✓ Uses the Capability Registry                  — unchanged; expectations.ts still reads it live
✓ Uses the Intent Engine                        — unchanged; patternIntentResolver on every turn
✓ Reuses existing business services             — autoAnalyzeMeal, joinHousehold, recordOutcomeAndDetect, closeThread
✓ Does not create another assistant             — no gateway is constructed anywhere in server/tests/benchmark/
✓ Does not duplicate conversation state         — the benchmark closes threads; it never reads or writes turn content
✓ Uses registered capabilities only             — unchanged
✓ Uses permission-aware access                  — unchanged; the benchmark acts as a real User with real ctx
✓ Produces honest gaps rather than fabricated knowledge — see checklist above
```

---

## 4. Files changed

### Production code (behaviour-preserving)

| File | Change |
|---|---|
| `server/services/meal-analysis.ts` | **NEW (383 lines).** Verbatim extraction of `autoAnalyzeMeal`, `scrapeNutritionFromSource`, the ingredient-quantity helpers, and the allergen keyword list from `routes.ts`. Adds `forgetAnalyzedMeal` to name the memo invalidation the route did inline. |
| `server/services/recipe-scraping.ts` | **NEW (112 lines).** Verbatim extraction of the JSON-LD / macro-line recipe-page helpers that `scrapeNutritionFromSource` needs, kept separate because the recipe-import routes use them too. |
| `server/routes.ts` | Removed the 333-line moved block; imports both services; `analyzedMealIds.delete(id)` → `forgetAnalyzedMeal(id)` (2 sites). Net −443. |
| `server/intelligence/evidence-learning/framework.ts` | `RecordOutcomeRequest` gains one optional `occurredAt?: Date`, forwarded to the store (which already accepted it). +15 lines, no logic change. |

### Benchmark platform

| File | Change |
|---|---|
| `server/benchmark/world-seeder.ts` | Calls `autoAnalyzeMeal` after `createMeal`; evidence via `recordOutcomeAndDetect`; partner adult via `storage.joinHousehold`. Header contract updated. |
| `server/tests/benchmark/companion-turn.ts` | Per-question conversation isolation via `closeActiveThread`, in a `finally`, plus one pre-run close. Captures `threadId`. |
| `server/tests/benchmark/scorer.ts` | `HONEST_GAP_OUTCOMES` / `HONEST_GAP_FALLBACKS` → exhaustive `Record`s over the platform's unions. `CapturedTurn.threadId` added (observational). |
| `server/tests/benchmark/bundle.ts` | `BENCHMARK_CLOCK = "wall"` — the artefact reports the clock the run had. |
| `server/tests/benchmark/types.ts` | `BenchmarkProvenance.clock` doc corrected. |
| `server/tests/benchmark/context-composition-verification/` → `server/tests/context-composition/` | Relocated (6 files); import depths and README paths updated. |

### Tests and tooling

| File | Change |
|---|---|
| `server/tests/test-benchmark-conversation-isolation.ts` | **NEW.** 23 assertions. Reproduces the D1 contamination, then proves the close eliminates it. |
| `server/tests/test-benchmark-no-production-branch.ts` | **NEW.** Protects D13 across 138 production files. |
| `scripts/benchint2-verify-world-derivation.ts` | **NEW.** Re-runnable verification of D2/D7/D11 against a live DEV database. Seeds; never scores. |
| `package.json` | Registers the two new tests, and adds them to `npm test`. **Modified in the working tree, deliberately NOT committed with BENCHINT2** — see note below. |
| `docs/intelligence/benchmark/BENCHMARK_AUTOMATION.md` | §2 import-surface constraints amended to describe reality. |

> **`package.json` is intentionally excluded from the BENCHINT2 commit.** The file already carried
> eight script entries from other in-flight workstreams (`test:learn1-*`, `test:coach1-*`,
> `test:attn1-*`, `test:dec1-*`, `test:know4-*`, `test:know5-*`, `test:comp2-*`, `test:plan1-*`)
> whose test files are still untracked. Committing `package.json` inside this commit would have
> produced a commit whose `npm test` references files that commit does not contain, and would have
> silently attributed four other workstreams' surface area to BENCHINT2. The two BENCHINT2 entries
> are present in the working tree and should land with the batch that owns the others. Both tests
> run today by path:
>
> ```bash
> npx tsx server/tests/test-benchmark-conversation-isolation.ts
> npx tsx server/tests/test-benchmark-no-production-branch.ts
> ```

---

## 5. Validation evidence

### 5.1 Type checking — no error introduced, none resolved

The working tree carries 312 pre-existing modified paths, so a bare error count proves nothing. The baseline was measured by reverting *only* BENCHINT2's files in the real tree (which has the untracked modules a `git worktree` of the stash snapshot lacks) and re-running `tsc`:

```
pre-BENCHINT2 (BENCHINT2 files reverted, real tree):   175 errors
post-BENCHINT2:                                        175 errors
errors in files BENCHINT2 touched or created:            0
```

All 175 are pre-existing (`downlevelIteration`, missing untracked modules, top-level `await` in scripts) and sit in files this workstream did not touch. `npm run build` exits 0; `server/routes.ts` loads and exports `registerRoutes`.

### 5.2 Conversation isolation — the defect reproduced, then closed

`npm run test:benchmark-conversation-isolation` → **23 passed, 0 failed.**

The test is built against the real `ConversationGateway` over an `InMemoryConversationStore` with a recording LLM stub, so it observes the literal prompt the Companion was given.

```
1. WITHOUT closing the thread — the D1 contamination, reproduced
  ✓ both questions share one conversation thread
  ✓ question 1 was answered with no history (nothing preceded it)
  ✓ question 2 was answered WITH question 1 in its prompt
  ✓ question 2 could resolve pronouns against question 1's entityRefs

2. WITH the production close between questions — full isolation
  ✓ question 2 opened a NEW thread
  ✓ both threads belong to the same conversation (one user, one conversation)
  ✓ question 2 was answered with NO conversation history
  ✓ question 2's thread begins with question 2's own turn — nothing preceded it
  ✓ question 1's entityRefs still exist, but only inside question 1's now-closed thread
  ✓ a freshly opened thread inherits no entityRefs

3. The ONE-seam adapter still isolates every question
  ✓ the close runs in a `finally`, so a thrown question cannot contaminate the next one
  ✓ the pre-run close exists, so question 1 cannot inherit an operator's live conversation (D8)
  ✓ an isolation failure aborts rather than silently scoring contaminated turns
  ✓ processUserTurn is still called with exactly five arguments, on a real surface, with no benchmark flag
```

Section 1 matters as much as section 2: it proves the test can *detect* the defect, so a future regression fails here rather than passing silently.

### 5.3 World creation now runs production derivation

`npx tsx scripts/benchint2-verify-world-derivation.ts BW03` against the live DEV database:

```
D2 — meal derivation (production autoAnalyzeMeal)
  meals seeded ............... 7
  meals with nutrition ....... 7   (source: openfoodfacts_estimated)
  meals with allergens ....... 5   (6 allergen rows; derived offline, no network)
  BEFORE BENCHINT2 both were . 0

D7 — evidence via recordOutcomeAndDetect
  evidence events ............ 6 (fixture declares 6)
  backdated occurredAt ....... 6 of 6 are older than 12h
  learning signals ........... 1 → ingredient:paneer:positive/low

D11 — partner adult via storage.joinHousehold
  member-less orphan households  0  (expected 0)

VERIFIED — production derivation ran during world creation.
```

The single `ingredient:paneer` signal is the correct result: BW03's fixture has exactly three positive events on that dimension, meeting `MIN_EVIDENCE_COUNT = 3` at `low` confidence. No other BW03 dimension qualifies. Detection maths is unchanged — only the emission path and the 90-day window are now production's.

**D11 was verified separately**, because on this database every benchmark partner was already an active member from a previous seed, so `joinHousehold` correctly short-circuited and the new path never executed. A throwaway probe (created, asserted, deleted) exercised it directly:

```
partner auto-created solo household: [ { householdId: 197 } ]
partner memberships after joinHousehold: [ { householdId: 197, status: 'left' },
                                           { householdId: 196, status: 'active' } ]
partner's solo household #197 membership rows: [ { id: 501, status: 'left' } ]
RESULT: solo household retains 1 row (status left) — NOT an orphan ✅
RESULT: partner is active in the target household ✅
```

That is precisely the shape production leaves behind. The old seeder left the row *deleted*, hence the member-less household D11 named.

### 5.4 No benchmark-aware branch in production

`npm run test:benchmark-no-production-branch` → **3 passed, 0 failed**, across 138 files in `server/intelligence/**` and `server/services/**`.

Verified to be capable of failing: injecting `if (process.env.isBenchmark) return;` into `server/services/meal-analysis.ts` produced

```
✗ no executable reference to the benchmark or to impersonation in production code
    server/services/meal-analysis.ts:256  if (process.env.isBenchmark) return;
```

and exit code 1. The injected line was reverted. The test also passes *with* `meal-analysis.ts`'s several prose references to the Benchmark World seeder, confirming it distinguishes comments from code.

### 5.5 Regression suite

| Suite | Result |
|---|---|
| `test:benchmark-no-production-branch` | 3 passed, 0 failed |
| `test:benchmark-conversation-isolation` | 23 passed, 0 failed |
| `test:benchmark-routing` | 101 passed, 0 failed |
| `test:benchmark-utilisation` | 70 passed, 0 failed |
| `test:intelligence-meals-binding` | 72 passed, 0 failed |
| `test:nutrition-enrichment` | 22 passed, 0 failed |
| `test:intelligence-evidence-learning-binding` | 59 passed, 0 failed |
| `test:learn1-household-learning` | 72 passed, 0 failed |
| `test:intelligence-fallback` | 82 passed, 0 failed |
| `test:intelligence-context-composition` | 161 passed, 0 failed |
| `test-intelligence-conversation-store` | 55 passed, 0 failed |
| `.engineering/scripts/repo-structure-verify.sh` | clean, exit 0 |
| `.engineering/scripts/session-verify.sh` | all boundary checks passed, exit 0 |
| `npm run build` | exit 0 |

### 5.6 Mission validation criteria

| Required confirmation | Status | Evidence |
|---|---|---|
| Benchmark execution uses the production Companion runtime | ✅ | `processUserTurn` called with the same five arguments as `routes.ts:12031`; asserted by test §3 (5.2). Unchanged by BENCHINT2 — confirmed, not created. |
| Conversation isolation functions correctly | ✅ | §5.2 — 23 assertions, defect reproduced then closed |
| Benchmark world creation follows production derivation paths | ✅ | §5.3 — nutrition 0→7, allergens 0→5, evidence via `recordOutcomeAndDetect`, partner via `joinHousehold` |
| Duplicated ownership removed where appropriate | ✅ | 4 of BENCHINT1 §8's 7 duplicates removed; the 3 remaining are deliberate and named (§6) |
| Benchmark fidelity has improved | ✅ | §6 |
| No benchmark-specific execution paths introduced | ✅ | §5.4, and `server/tests/benchmark/` no longer constructs a gateway anywhere |

---

## 6. Benchmark fidelity assessment

**No benchmark was run**, so this is an assessment of the *instrument*, not of a score. It states what the next run will measure that the last run could not.

| Dimension of fidelity | Before | After |
|---|---|---|
| Question independence | One thread for all 100 questions; question *N* answered with *N−5…N−1* in prompt | One thread per question; empty history, no inherited `entityRefs` |
| Quick vs full comparability | Not comparable — the two modes contaminate differently | Comparable — neither contaminates |
| `single-world` operator safety | 100 utterances appended to the admin's live thread; first questions saw the admin's last real message | Operator's thread closed before question 1; no benchmark thread left open at run end |
| Meal nutrition in the measured world | **Zero rows, always** | Derived by the same function the meals route runs |
| Meal allergens in the measured world | **Zero rows, always** | Derived (offline, deterministic) |
| Evidence emission | Bypassed the orchestrator; detection ran with **no 90-day window** | `recordOutcomeAndDetect`, windowed |
| Partner household shape | Member-less orphan household; a state production cannot produce | `left` membership — exactly what an invite/accept produces |
| Honest-gap vocabulary | Hand-copied `Set`; a new status would silently mis-score | Exhaustive `Record` over the union; a new status fails the build |
| Artefact `clock` | Asserted a frozen instant the run never had | `"wall"` |
| Benchmark awareness in production | Believed absent | Asserted absent, by a test that is proven able to fail |
| Import-surface invariant | Contradicted by a gateway constructed inside the benchmark tree | True as written |

**The most consequential consequence: every historical run artefact in `docs/intelligence/benchmark/history/` is now superseded.** Those runs measured a Companion answering questions about a world with no nutrition and no allergens, while contaminating each question with its predecessors. The first post-BENCHINT2 run is **a new baseline, not a regression** — the score may move in either direction, and neither direction is evidence of a code change in the Companion. `selectBaseline()` will happily compare across this boundary; a reader must not.

**Two honest costs, both new:**

1. **World creation is no longer hermetic.** `autoAnalyzeMeal` calls OpenFoodFacts. Seeding one household went from sub-second to ~11s, and the seeder's stated guarantee — *"DETERMINISTIC RESET: same fixture in, same content out, every time"* — now holds for meals, planner, pantry, shopping, diary, evidence and allergens, but **not** for nutrition values, which depend on a live third-party API. Offline, nutrition is absent (an honest gap, never fabricated) and allergens are still correct. This is the price of measuring the production experience rather than an impoverished one; it is not free, and it is not hidden.
2. **`MAX_CONCURRENT_ANALYSES = 3`** is inherited from the route. `autoAnalyzeMeal` *returns without analysing* when three analyses are already in flight. The seeder awaits sequentially so it can never trip this itself, but a concurrent real user on the same dev process could cause a seeded meal to be silently left without nutrition. Pre-existing behaviour, newly reachable from the seeder.

---

## 7. Remaining BENCHINT actions

### Governance decisions (not code) — these gate the rest

| # | Action | From |
|---|---|---|
| G1 | **Settle BENCHINT1 assumption A1.** Are `BENCHMARK_EXECUTION_PROCESS.md` and `BENCHMARK_AUTOMATION.md` governing architecture, or specification? They self-declare `GOVERNING FRAMEWORK` but are not indexed in `docs/architecture/README.md`. | BENCHINT1 A1 |
| G2 | **Scope the benchmark, in writing, to the conversational surface.** The Decision Engine and the Notice Engine are unreachable from any turn — *in production too*. A 100-question conversational corpus is the wrong instrument for a proactive engine. Amend `BENCHMARK_EXECUTION_PROCESS.md`. **Do not wire either engine into `processUserTurn`.** | D3, D4 |
| G3 | **Resolve the judge.** `resolveJudge()` always returns the disabled judge, yet `BENCHMARK_EXECUTION_PROCESS.md` §2 precondition 4 says *"A judge mismatch is a hard abort"*. Either implement the pinned client, or amend the precondition to state that deterministic-only runs are valid and judge-owned dimensions are reported **unscored** rather than approximated. This gates D6's `LIMITATION_MARKERS`. | D9 |
| G4 | **`single-world` provisions nothing.** Precondition 3 requires *"a disposable seeded database… The benchmark refuses to run against anything it did not provision."* BENCHINT2 gave `single-world` runs thread isolation; it did not give them a disposable database. Either restrict the route to `benchmark-world` owners, or amend the precondition. | D8 (residual) |

### Code, once G1–G4 land

| # | Action | From |
|---|---|---|
| C1 | Replace `LIMITATION_MARKERS` / `statesALimitation` and `expectations.ts`'s `HONEST_GAP_MARKERS` / `GUARANTEE_MARKERS` with something the Behaviour Engine owns. Blocked on G3. | D6 |
| C2 | Rebuild `productMatches` / `ingredientSources` rows in the seeder. Shopping items still carry `matchedStore` / `matchedPrice` / `thaRating` with no backing join rows (wiped, never rebuilt). | D2 (residual) |
| C3 | Seed `starterMealsLoaded` honestly, or stop setting it. The flag is set by raw update without ever preloading starter meals. | D2 (residual) |
| C4 | Promote capability-invocation observability into the Observation Engine, retiring the probe's monkey-patch of `intelligencePlatform.handle`. Observation Engine work, not benchmark work. Not urgent. | D5 |
| C5 | Make the frozen clock real by turning the Context Composition Engine's temporal anchor into an injectable input — a platform change with production value of its own, not a benchmark accommodation. Only then restore a non-`"wall"` clock. | D10 |

### New findings (documented only, per this workstream's constraint — none implemented)

| # | Finding |
|---|---|
| **N1** | **`routes.ts` still contains a second, inline copy of the nutrition-derivation loop**, at `POST api.analyze.meal.path` (`routes.ts:3340`, using `scrapeNutritionFromSource`, `cleanIngredientForLookup`, `parseIngredientGrams`, `fallbackIngredientGrams` directly). BENCHINT2 extracted the copy `autoAnalyzeMeal` owned; this one remains a genuine production-internal duplication of the same derivation. BENCHINT1 did not name it. It should converge onto `meal-analysis.ts`. |
| **N2** | **6 of the 10 benchmark households can never produce a learning signal.** Only BW03, BW05, BW06 and BW07 have any dimension with ≥ `MIN_EVIDENCE_COUNT` (3) polarised events. BW01, BW02, BW04, BW08, BW09 have one event per dimension; BW10 has none. The Evidence → Signal → Companion path is therefore exercised by 4 households, and the other 5 seeded households contribute evidence events that provably cannot become signals. This may be intentional (cold/sparse archetypes) but it is nowhere stated. |
| **N3** | **7 member-less benchmark households persist in the DEV database** (`#178, #180, #182, #184, #186, #190, #192` — the partner adults' auto-created solo households), residue of the old seeder's raw `DELETE householdMembers`. BENCHINT2 stops *creating* them; it does not delete the existing ones, because deleting households is destructive and outside the approved minimum. A `benchmark-world` teardown could reclaim them. |
| **N4** | **The world seeder now performs outbound network I/O during world creation.** See §6, cost 1. If hermetic seeding is required, the honest options are a recorded OpenFoodFacts fixture or an injected nutrition source — both of which are new architecture and neither of which was in scope. |
| **N5** | **`selectBaseline()` will compare across the BENCHINT2 boundary.** Nothing in the bundle version encodes "the world gained nutrition and questions stopped contaminating each other". `FRAMEWORK_VERSION` remained `v2.1.0` because no result-schema field changed shape — but comparability did change. Consider a bundle/world version bump so `compare()` declines to diff across it. |

---

## 8. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Meal Knowledge (derived nutrition + allergens)
Declared SoT: `nutrition` and `meal_allergens` tables; derivation owned by
              server/services/meal-analysis.ts (extracted from server/routes.ts)
New store created? NO
Existing store extended? NO
Consumer created? YES — server/benchmark/world-seeder.ts
  If YES: reads from declared SoT? YES — it invokes the SoT's own derivation, and
          reads nothing back.

Domain affected: Household Evidence & Learning (EL1)
Declared SoT: `household_evidence_events`, `household_learning_signals`;
              orchestration owned by recordOutcomeAndDetect
New store created? NO
Existing store extended? YES — RecordOutcomeRequest gains optional `occurredAt`.
  No new store; the underlying NewEvidenceEvent already carried the field.
Consumer created? NO — world-seeder.ts is an existing consumer, now using the
  canonical orchestrator instead of a duplicate of it.

Domain affected: Household Membership
Declared SoT: `household_members`; writes owned by storage.joinHousehold / leaveHousehold
New store created? NO
Existing store extended? NO
Consumer created? NO — world-seeder.ts stops writing the table directly.

Domain affected: Conversation (threads)
Declared SoT: `conversation_threads`; owned by IConversationStore
New store created? NO
Existing store extended? NO
Consumer created? YES — server/tests/benchmark/companion-turn.ts calls
  getOrCreateConversation / getActiveThread / closeThread only. It reads no turn
  content; answers still come from TurnResult alone.

No duplication is introduced anywhere. Four are retired.
```

---

## 9. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Companion Benchmark ⇄ Production Runtime (benchmark world creation, turn
  execution, and outcome vocabulary)

Current Canonical Owner:
  Turn execution ........ server/intelligence/conversation/conversation-gateway.ts (processUserTurn)
  Conversation lifecycle  server/intelligence/conversation/conversation-store.ts (IConversationStore)
  Meal derivation ....... server/services/meal-analysis.ts (NEW — extracted from routes.ts)
  Evidence orchestration  server/intelligence/evidence-learning/framework.ts (recordOutcomeAndDetect)
  Household membership .. server/storage.ts (joinHousehold)
  Outcome vocabulary .... server/intelligence/types.ts (IntentOutcomeStatus),
                          server/intelligence/conversation/turn-fallback.ts (UnsuccessfulTurnState)

Current Runtime Consumer(s):
  POST /api/intelligence/conversation/turn (FloatingAssistant) — production
  POST /api/meals, PATCH /api/meals/:id, GET /api/nutrition/:id, POST /api/nutrition/bulk
  POST /api/admin/benchmark-households/run-benchmark
  POST /api/intelligence/benchmark/run
  server/tests/benchmark/run-benchmark.ts (CLI)
  server/scripts/intq7-run-full-benchmark.ts, intq8-*.ts
  server/benchmark/world-seeder.ts

Duplicate Owners Remaining:
  - scorer.ts LIMITATION_MARKERS / statesALimitation  → shadows Behaviour Engine voicing.
    Deliberate; blocked on the judge decision (G3). BENCHINT1 directed it be left.
  - expectations.ts HONEST_GAP_MARKERS / GUARANTEE_MARKERS → same owner, same block.
  - world-seeder.ts account-flag writes (isBetaUser, emailVerified, onboardingCompleted,
    starterMealsLoaded) → no production setter exists; registration is closed in dev.
    Mirrors storage.createDemoUser's own raw writes.
  - routes.ts:3340 inline nutrition-derivation loop → NEW FINDING N1, production-internal,
    not benchmark-related, documented only.

Duplicate State Remaining:
  NONE

Duplicate Workflows Remaining:
  NONE among the four BENCHINT2 addressed. The four listed above are duplicate
  OWNERS of a fact, not duplicate workflows over shared state.

Current Convergence (%):
  57% — 4 of the 7 duplicate components BENCHINT1 §8 enumerated are removed:
    ✅ scorer.ts HONEST_GAP_OUTCOMES         → IntentOutcomeStatus / UnsuccessfulTurnState
    ✅ world-seeder.ts evidence detection     → recordOutcomeAndDetect
    ✅ world-seeder.ts partner membership     → storage.joinHousehold
    ✅ world-seeder.ts meal creation          → storage.createMeal + autoAnalyzeMeal
    ❌ scorer.ts LIMITATION_MARKERS           → blocked on G3 (judge)
    ❌ expectations.ts HONEST_GAP_MARKERS     → blocked on G3 (judge)
    ❌ world-seeder.ts account-flag writes    → no canonical owner exists to converge onto

  Separately, 3 of BENCHINT1 §7's 8 integration gaps are closed (per-question turn
  isolation; meal nutrition/allergen derivation; the frozen-clock artefact dishonesty).
  Two more (Decision Engine, Notice Engine) are NOT gaps to close — they are out of the
  benchmark's scope by construction, pending G2.

Target Convergence (%):
  86% (6 of 7) once G3 resolves the judge and C1 lands. The seventh —
  account-flag writes — cannot converge until a production owner for those flags
  exists; it is not benchmark debt.

Next Planned Milestone:
  BENCHINT3 — governance: settle A1, scope the benchmark to the conversational
  surface, and resolve the judge (G1–G4). No code should land before it.

Remaining Architectural Risks:
  1. Every historical benchmark artefact is superseded (§6). `selectBaseline()` does not
     know this (N5). A cross-boundary comparison will read as a regression or an
     improvement, and will be neither.
  2. World creation now depends on a third-party API for nutrition values (§6, N4).
  3. The proactive surface — Decision Engine, Notice Engine, ambient surfacing — remains
     unmeasured by any benchmark. This is the platform's largest unacknowledged gap in its
     acceptance measure, and BENCHINT2 does not close it. Nor should it have.
```

---

## 10. DEFINITION OF DONE

**What success looks like**
- Each benchmark question executes in its own conversation thread, through the unchanged production seam.
- Benchmark meals carry the nutrition and allergen rows production would have derived.
- The scorer's honest-gap vocabulary is the platform's, enforced by the compiler.
- Evidence is emitted through the canonical orchestrator, within its window.
- No production code can ask whether it is being benchmarked, and a test says so.

**What must not break**
- `POST /api/meals` behaviour — the extraction must be byte-identical. *(Verified: `test:intelligence-meals-binding` 72/72, `test:nutrition-enrichment` 22/22, build green, routes load.)*
- Evidence detection maths for live callers. *(Verified: `test:intelligence-evidence-learning-binding` 59/59, `test:learn1-household-learning` 72/72. `occurredAt` is optional; every live caller omits it.)*
- The one-seam invariant. *(Verified: nothing under `server/tests/benchmark/` constructs a gateway.)*

**Manual test steps**
1. `npm run test:benchmark-conversation-isolation` → 23 passed
2. `npm run test:benchmark-no-production-branch` → 3 passed
3. `npx tsx scripts/benchint2-verify-world-derivation.ts BW03` → `VERIFIED`
4. `npm run build` → exit 0
5. Reset a benchmark household from the admin UI; confirm its meals now show nutrition and allergens.

---

## 11. DATA IMPACT

- **Reads existing data:** YES — meals, ingredients, evidence events, household memberships, conversation threads.
- **Writes new data:** YES — `nutrition` and `meal_allergens` rows for benchmark-seeded meals (previously absent); `conversation_threads.closed_at` for benchmark runs; `household_members` rows now written by `joinHousehold` rather than raw SQL.
- **Changes meaning of existing data:** YES, in one place — `BenchmarkProvenance.clock` changes from a frozen ISO instant to `"wall"`. Historical artefacts retain the old value and remain readable; the field's *meaning* was always "wall", and only the *claim* changes.
- **Requires backfill:** NO. Benchmark households are reseeded from fixtures on demand; `resetBenchmarkHousehold` is idempotent and account-scoped. Production meals are unaffected — the route already ran the derivation.

---

## 12. TRUST CHECK

- **Could this mislead the user?** The one real risk is a reader comparing a post-BENCHINT2 score against a pre-BENCHINT2 baseline and reading the difference as a code change in the Companion. §6 states this plainly and N5 records that `selectBaseline()` cannot yet refuse the comparison.
- **Could this fabricate certainty?** No. `autoAnalyzeMeal` writes no nutrition row when OpenFoodFacts returns nothing; it never estimates from zero. Allergens are keyword-derived offline and deterministic. The `clock` field stopped fabricating certainty about temporal grounding — that was the point of D10.
- **Is anything guessed but shown as real?** Nutrition values carry `source: 'openfoodfacts_estimated'` when fallback gram weights were used — the existing, unchanged honesty marker. Nothing new is guessed.
- **What happens if the system is wrong?** If thread closure fails, the run **aborts** with a named error rather than scoring contaminated turns. If OpenFoodFacts is unreachable, nutrition is absent (an honest gap) and allergens are still correct. If a future `IntentOutcomeStatus` is added, the build fails rather than the score silently drifting.
- **No architectural duplication introduced:** YES (four removed, none added).
- **No new source of truth created:** YES — `meal-analysis.ts` is the *relocated* owner of a derivation that already existed; no fact gained a second owner.
- **No runtime behaviour altered:** Production runtime behaviour is unaltered. The meals route calls the same function with the same arguments; the evidence orchestrator's live callers omit the new optional parameter and behave identically.

---

## 13. ROLLBACK PLAN

**Rollback identifier:** `rollback/before-benchint2-runtime-convergence-20260710` → `678b1aee2eeb2df775d1bc7f163c30eda1d39df4`
**Dirty-tree snapshot:** `git stash` entry `BENCHINT2_ROLLBACK` → `5377b04875ee379d369c50eb2b23dd0a80b82ec7`

**Files to restore** (the working tree carries unrelated in-flight work — do **not** hard-reset it):

```bash
# 1. Revert BENCHINT2's edits to existing files, from the pre-implementation snapshot.
git checkout 5377b04 -- \
  server/routes.ts \
  server/benchmark/world-seeder.ts \
  server/intelligence/evidence-learning/framework.ts \
  server/tests/benchmark/companion-turn.ts \
  server/tests/benchmark/scorer.ts \
  server/tests/benchmark/bundle.ts \
  server/tests/benchmark/types.ts \
  docs/intelligence/benchmark/BENCHMARK_AUTOMATION.md

# package.json was NOT committed with BENCHINT2 (see §4). To undo its two BENCHINT2 entries by
# hand, remove `test:benchmark-no-production-branch` and `test:benchmark-conversation-isolation`
# from "scripts" and from the "test" chain. Do not `git checkout` the file — it carries other
# workstreams' uncommitted entries.

# 2. Remove the files BENCHINT2 created.
rm -f server/services/meal-analysis.ts \
      server/services/recipe-scraping.ts \
      server/tests/test-benchmark-conversation-isolation.ts \
      server/tests/test-benchmark-no-production-branch.ts \
      scripts/benchint2-verify-world-derivation.ts \
      docs/implementation/benchmarking/BENCHINT2_BENCHMARK_RUNTIME_CONVERGENCE.md

# 3. Undo the relocation.
git mv server/tests/context-composition server/tests/benchmark/context-composition-verification
git checkout 5377b04 -- server/tests/benchmark/context-composition-verification
```

**Verification after rollback**

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"   # expect 175
npm run build                                 # expect exit 0
npm run test:benchmark-routing                # expect 101 passed
npm run test:intelligence-meals-binding       # expect 72 passed
```

**Data rollback.** None required. The DB changes are additive rows inside benchmark-scoped accounts (`nutrition`, `meal_allergens`) plus `closed_at` timestamps on benchmark conversation threads. Re-running `resetBenchmarkHousehold` with the reverted seeder restores the previous (nutrition-free) world exactly. No production user's data was touched. The 7 member-less households noted in N3 predate BENCHINT2.

---

## 14. SCOPE LOCK

**Implemented scope**
- BENCHINT1 §11 tasks 1, 2, 3, 4, 5, 6, 7, 8, 9 (all code tasks).
- `BENCHMARK_AUTOMATION.md` §2 amended to match the harness.

**Explicitly excluded scope (not done, by instruction)**
- The Decision Engine was not modified and was not integrated into the conversation runtime (BENCHINT1 task 10 — governance).
- The Behaviour Engine architecture was not modified.
- The Observation Engine architecture was not modified.
- The Notice Engine was not integrated into the conversation runtime.
- The Benchmark Judge was not implemented (BENCHINT1 task 11 — governance).
- No benchmark-only production code was created; no new runtime pathway was introduced; no existing production logic was duplicated.
- `LIMITATION_MARKERS` was not touched (blocked on the judge decision, per BENCHINT1).
- The capability probe was not changed (BENCHINT1 explicitly recommended no change).
- The Companion Benchmark was **not executed**.

**Suggestions — observed, not implemented, require approval**

See §7 "New findings" (N1–N5) in full. The two most worth acting on:

- **N1** — `routes.ts:3340` (`POST api.analyze.meal.path`) contains a second inline copy of the nutrition-derivation loop that `autoAnalyzeMeal` owns. Converging it onto `meal-analysis.ts` is a small, contained follow-up, and it is production hygiene rather than benchmark work.
- **N5** — bump the bundle/world version so `compare()` declines to diff a post-BENCHINT2 run against a pre-BENCHINT2 baseline. Without it, the first post-fix run will be read as a regression or an improvement, and it is neither.
