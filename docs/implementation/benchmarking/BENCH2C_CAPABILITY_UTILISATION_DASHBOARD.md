# BENCH2C — Capability Utilisation Dashboard

**Status:** IMPLEMENTATION — benchmark observation and reporting only. **No Intelligence Platform behaviour changed.**
**Classification:** Intelligence Governance → Benchmark (the measuring instrument, not the thing measured)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Subject at implementation:** HEAD `45443a8` + uncommitted working tree (see §0 — the distinction is material)

**Governing documents read before implementation:**
`docs/architecture/README.md` (Architecture Bootstrap),
`docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1),
`docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2),
`docs/investigations/intelligence/INTA1_INTELLIGENCE_PLATFORM_WIRING_AUDIT.md`,
`docs/intelligence/benchmark/README.md`, `BENCHMARK_AUTOMATION.md`, `BENCHMARK_SCORING_FRAMEWORK.md`,
`BENCHMARK_REPORT_TEMPLATE.md`,
`docs/implementation/benchmarking/BENCH2_INTELLIGENCE_BENCHMARK_HARDENING.md` (the immediate predecessor).

**Builds on:** `BENCH2`, which made *routing accuracy* measurable. `BENCH2C` makes *capability execution* measurable.

---

## 0. ROLLBACK

Created **before** any file was modified.

| Identifier | Object | Restores |
|---|---|---|
| `rollback/before-bench2c-capability-utilisation-20260708` | `45443a8` | The committed HEAD |
| `rollback/before-bench2c-capability-utilisation-20260708-worktree` | `8bf918a` | The **uncommitted working tree**, including all of `BENCH2` |

**Roll back from the worktree tag, not the HEAD tag.** `INTA1` §1.2 establishes that HEAD is RED: at `45443a8`,
`conversation-gateway.ts` transitively imports `extractFoodRef` from `nutrition-enrichment.ts` where it is declared but
not exported, throwing `SyntaxError` on module load and 500-ing every conversation endpoint. That fix exists only in the
working tree. A rollback to the HEAD tag alone reintroduces a total Companion outage — and would also discard `BENCH2`.

```bash
# What the worktree tag holds
git show --stat rollback/before-bench2c-capability-utilisation-20260708-worktree | head -20

# Restore only the surface BENCH2C touched (recommended — preserves unrelated working-tree work)
git checkout rollback/before-bench2c-capability-utilisation-20260708-worktree -- \
  server/tests/benchmark package.json \
  client/src/pages/admin-intelligence-page.tsx \
  docs/intelligence/benchmark/README.md \
  docs/intelligence/benchmark/BENCHMARK_AUTOMATION.md \
  docs/intelligence/benchmark/BENCHMARK_REPORT_TEMPLATE.md
rm -f server/tests/benchmark/capability-probe.ts \
      server/tests/test-benchmark-capability-utilisation.ts \
      docs/implementation/benchmarking/BENCH2C_CAPABILITY_UTILISATION_DASHBOARD.md
```

> **Caveat, stated because it matters.** `git stash create` snapshots **tracked** files only. `BENCH2`'s new untracked
> files (`server/tests/test-benchmark-routing-integrity.ts`, its implementation doc) are **not** inside the worktree tag;
> they remain on disk and are unaffected by a restore. A file-level copy of every benchmark source touched here also
> exists outside the repo, under the session scratchpad (`.../scratchpad/bench2c-backup/`).

---

## 1. THE PROBLEM

`BENCH2` can now tell whether the platform **reached** the capability a question intended. It cannot tell:

- which capabilities **actually executed** on a turn (only the single primary `TurnResult.outcome`, plus the routed set
  persisted in `conversation_turns.resolved_intent`);
- **how long** any capability took — the platform records no capability timing anywhere;
- whether a capability that ran **contributed anything** to the answer (an `ok` empty search reaches the capability and
  grounds nothing);
- which registered capabilities the run **never touched at all** — including as a baseline context-only read;
- which questions were answered **without invoking any registered capability**.

`INTA1` §3.4 records 21 bound-and-available capabilities, three of them (`food-intelligence`, `opportunity-delivery`,
`evidence-learning`) *bound but unroutable*. Nothing in the benchmark could see that as a fact about execution.

## 1.1 The constraint that shaped the design

The workstream requires **execution time per capability**, and forbids **behavioural change outside benchmark reporting**
and **duplicate logging or state**. These pull against each other:

- The gateway runs capabilities in `Promise.all` and records no timing. Turn latency is dominated by the LLM call, so
  attributing turn latency to a capability would be a number that **looks like** execution time and is not one. That is
  the kind of fabrication this benchmark exists to prevent.
- Adding `durationMs` to `QueriedIntentOutcome` would change a **production write path** (`conversation_turns.
  resolved_intent`) for a benchmark's benefit, on every real user turn.
- Building a second capability log would be exactly the duplicate state the brief forbids.

## 2. WHAT WAS BUILT

### 2.1 A pass-through probe over the platform's own seam

`server/tests/benchmark/capability-probe.ts` wraps `intelligencePlatform.handle()` — **the single entry point every
capability invocation already funnels through** (`LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND`). It does
not reimplement, re-route, or short-circuit anything; it times and records what the platform decided.

Five properties make it safe, and each is asserted by a test:

1. **Pure pass-through.** It awaits the original `handle`, returns its `IntentOutcome` **unchanged**, and re-throws any
   error **unchanged**. No routing, permission, confirmation, or result is altered. Observation, never behaviour.
2. **Scoped to one acting user.** A record is taken only when `context.userId` matches the benchmark's acting user. A
   concurrent real user's turn — the admin benchmark route runs in-process — passes straight through, unobserved and
   unaffected. The probe cannot see, delay, or record anyone else.
3. **No persistent state, no duplicate log.** Records live in a run-scoped in-memory buffer the benchmark owns and drains
   after each turn. Nothing is written to any store. There is no platform capability log to duplicate.
4. **Reference-counted install/uninstall.** The wrapper is an own-property shadow over the prototype method; disposing the
   last probe `delete`s it, restoring the singleton **by identity** (`platform.handle === originalHandle`, asserted).
   `runner.ts` disposes in a `finally`, so a thrown question cannot leave the platform wrapped.
5. **Import-surface constraint intact.** It imports no capability handler, no intent engine, no permission model, no
   behaviour engine. It derives `handle`'s signature with `typeof intelligencePlatform.handle` rather than importing
   `RouteOptions` from `intent-engine.ts` — so the wrapper cannot drift from what it wraps, and `AUTOMATION` §2 holds.

Every question still executes through `conversationGateway.processUserTurn` and nothing else (README §1). The probe is an
observer of that path, not a second one.

**What this buys that nothing else could:** true per-capability execution time (`durationMs` around the whole
LOCATE→INVOKE pipeline), the platform's own honest `IntentOutcome.status` per invocation (`ok` / `denied` / `gap` /
`unsupported_intent` / `unknown_capability` / `not_executable`), throws, and — because it sits at `handle()` rather than
at the persisted routed set — **baseline context-only reads and capability-to-capability fan-out**, both of which
`resolved_intent` deliberately omits.

### 2.2 "Contribution to the final answer", defined precisely

The probe alone cannot know whether a capability's `ok` result reached the answer: an empty search result is `ok` and
grounds nothing. `companion-turn.ts` therefore **joins** the probe's observation with the routed set the gateway already
persists, whose `QueriedIntentStatus` says exactly that:

| `QueriedIntentStatus` | `contribution` | Meaning |
|---|---|---|
| `ok-data` | `grounding-data` | Its payload entered the LLM's CONTEXT DATA block. **This is "contributed".** |
| `ok-empty` | `empty-result` | Executed successfully; returned an empty search. Reached, contributed nothing. |
| `no-knowledge` | `no-knowledge` | An honest structured non-ok outcome. |
| `error` | `error` | The handler threw; the gateway contained it. |
| *(absent from the routed set)* | `context-only` | A baseline read the resolver appends on every turn regardless of the utterance. |
| *(routed set unreadable)* | `unknown` | Said honestly rather than guessed. |

Naming `context-only` explicitly is what stops the dashboard from either hiding a baseline read or crediting it as an
answer to the question.

### 2.3 Two different notions of "invoked", both correct

| Field | Means | Source |
|---|---|---|
| `routing.invokedCapabilities` (BENCH2) | *What answered the question* — the **routed, non-baseline** set | persisted `resolved_intent` |
| `capabilityUtilisation.exercised` (BENCH2C) | *What the platform ran* — **everything that executed** | the probe at `handle()` |

They are expected to differ, and neither is derived from the other. Each panel states its own definition in the report.
This is deliberately **not** collapsed into one number: doing so would either hide baseline reads or corrupt the routing
metric that `BENCH2` exists to protect.

### 2.4 The dashboard

**Report §8** (`report.md`, the export) and an **admin card** (`admin-intelligence-page.tsx`), both rendered verbatim
from `result.json` — the renderer never reads the Capability Registry (`AUTOMATION` §3's auditability invariant).

- **§8.1 Capabilities Exercised** — per capability: display name (from the registry), invocations, distinct questions,
  succeeded / failed / threw, success %, **contributed to answer** + contribution %, **mean / p95 / max / total execution
  time**, verbs, baseline-read count, and an outcome-status histogram for anything that failed.
- **§8.2 Registered Capabilities Never Exercised** — bound, executable, advertised, and not invoked once. Registered-but-
  **unbound** capabilities (`administration`, `developer`) are listed **separately** and never counted as a defect: they
  cannot run by design.
- **§8.3 Questions Bypassing Registered Capabilities** — split into:
  - **`defect`** — a registered, executable capability existed and nothing ran (reuses `BENCH2`'s `routingRequired`, so
    there is exactly one definition of "should have routed"; these are the `R1` questions);
  - **`structural`** — the platform was correct not to route (a write-intent refusal, a safety boundary, or no executable
    capability exists).

**An unobserved run reports "not measured", never "nothing ran".** When no probe is installed (`probeActive: false`) the
panel returns empty lists and zero counts rather than claiming "21 capabilities never exercised" and "100 questions
bypassed" — which would be a fabrication, not a measurement. The report, the CLI, and the admin card each say so.

---

## 3. WHAT THE DASHBOARD DISPLAYS

Against the requirement, item by item:

| Requirement | Field(s) | Notes |
|---|---|---|
| Reuse the existing Intelligence Platform and Capability Registry | `intelligencePlatform.handle`, `registry.listExecutable()`, `registry.get().displayName` | Nothing re-implemented; the registry is read live, never copied |
| Record every capability invoked for each benchmark question | `questions[].capabilityInvocations[]` | Per invocation, not per capability — a question may invoke one twice |
| Capability name | `capabilityId`, `displayName` | `displayName` from the registry |
| Invocation count | `invocations`, `questions` | Total invocations, and distinct questions that used it |
| Success / failure | `succeeded`, `failed`, `threw`, `successRate`, `statuses{}` | `statuses` is the platform's own `IntentOutcome.status` histogram |
| Execution time | `meanDurationMs`, `p95DurationMs`, `maxDurationMs`, `totalDurationMs` | True `LOCATE → … → INVOKE` duration, per invocation |
| Contribution to the final answer | `contributedToAnswer`, `contributionRate`, per-invocation `contribution` | Only `grounding-data` counts (§2.2) |
| Registered capabilities never exercised | `neverExercised`, `neverExercisedCount` | Plus `registeredUnbound`, listed separately |
| Questions that bypass registered capabilities | `bypassedQuestions[]`, `bypassedDefect`, `bypassedStructural` | `defect` reuses BENCH2's `R1` definition |
| Capability utilisation summary in the export | `capabilityUtilisation` in `result.json`; report §8; headline rows | Also printed by the CLI |

Run totals: `totalInvocations`, `totalCapabilityTimeMs`, `capabilityTimeShareOfRun` (the rest is LLM + gateway),
`utilisationPct` (executable capabilities exercised / executable capabilities registered).

### 3.1 Release-readiness additions

| Condition | Effect |
|---|---|
| ≥ 1 registered, executable capability never executed at all | **WARNING** |
| No probe installed | **NOTE** — "not observed", so the panel is empty because nothing was measured |
| ≥ 1 `defect` bypass | **NOTE** (already a `BENCH2` `R1` **blocker**; recorded here so the panel is self-contained) |
| Always | **NOTE** — invocation count, capability execution time and share of wall-clock, utilisation % |

The warning for `neverExercised` is deliberately worded to distinguish it from `BENCH2`'s `routing.unreachableCapabilities`
warning: the routing one names capabilities a question **intended** and routing never reached; this one names capabilities
that **never executed at all** — not as a route, not as a baseline read, not via fan-out. They overlap but mean different
things, and the report says which is which rather than printing the same sentence twice.

---

## 4. BENCHMARK COMPATIBILITY CHANGES

**MINOR and comparison-safe.** Runs across this boundary are directly comparable; a `v2.0.0` baseline simply carries no
utilisation data.

| Component | Before | After | Why |
|---|---|---|---|
| `framework` | `v2.0.0` | **`v2.1.0`** | Additive observation panel + one report section + an admin card |
| `rubric` | `v2.0.0` | `v2.0.0` | **Unchanged** — no dimension, weight, or gate |
| `questions` / `households` / `judge` | `v1.0.0` | `v1.0.0` | Unchanged |
| `schemaVersion` | `1.1.0` | `1.2.0` | Additive result fields; no field removed or retyped |

**No per-question score changes.** Utilisation is purely descriptive: **no dimension band and no gate reads a capability
invocation record.** `scoreDeterministic` receives the invocations and passes them through to `QuestionResult` untouched.
Baseline selection (which requires a matching **rubric** MAJOR) is unaffected, so `BENCH2` runs remain valid baselines.

### 4.1 Signature and consumer changes

- **`makeCompanionTurnRunner` now returns a `BenchmarkTurnRunner`** — a callable `TurnRunner` with two added properties,
  `dispose()` and `probeActive`. It is still a function, so `server/routes.ts` (`:8704`) and `run-benchmark.ts` needed
  **no change**. `runner.ts` calls `dispose()` optional-chained in a `finally`; a caller-supplied stub `TurnRunner` has
  none and is unaffected.
- **`releaseReadiness()` gained a ninth parameter** (`utilisation`). Its only caller is `runner.ts`.
- **`capabilityUtilisationPanel()` takes `probeActive` explicitly** rather than inferring it from empty invocation lists —
  inference would have made "unobserved" indistinguishable from "nothing ran", the exact error the panel exists to avoid.
- **`admin-intelligence-page.tsx`** declares `capabilityUtilisation?` as **optional**: runs recorded before framework
  `v2.1.0` render unchanged, with an explicit "this run predates capability utilisation tracking" message.
- **Report section numbering shifted again.** Capability Utilisation is §8; Dimension Breakdown §8 → §9; Provenance
  §13 → §14. `BENCHMARK_REPORT_TEMPLATE.md` §0.1 records the canonical order authoritatively.

---

## 5. WHAT WAS NOT CHANGED

- **No Intelligence Platform behaviour.** Verified mechanically (§6, check 8): `git diff` against the pre-change worktree
  snapshot over `server/intelligence/`, `server/routes.ts`, `server/index.ts`, `shared/` is **empty**. The only
  `client/` change is the read-only dashboard card.
- **No duplicate logging or state.** The probe's buffer is in-memory, run-scoped, drained per turn, never persisted. No
  table, no file, no second capability log. The platform has no capability log to duplicate.
- **No question, household, rubric, or judge.** Those four bundle components are byte-identical.
- **No per-question score.** No band, no gate, and no composite reads a capability invocation.
- **The one-seam invariant.** Every question still runs through `conversationGateway.processUserTurn`. `companion-turn.ts`
  remains the only module that drives the Companion; `capability-probe.ts` observes one public method and drives nothing.
- **The 178 pre-existing typecheck errors.** `npx tsc --noEmit` reports **178 before and 178 after**. The 3 in
  `server/tests/benchmark/` are pre-existing (`companionPersonality` TS2339 — `INTA1` M1; two `downlevelIteration` errors
  in `validate-companion-benchmark.ts`). BENCH2C introduces **zero** new type errors, and `client/` stays at **0**.

---

## 6. VERIFICATION PERFORMED

| # | Check | Result |
|---|---|---|
| 1 | `npx tsc --noEmit` before / after | **178 / 178** — no new type errors; `client/` at 0 |
| 2 | `npm run test:benchmark-utilisation` | **70 passed, 0 failed** |
| 3 | `npm run test:benchmark-routing` (BENCH2 regression guard) | **101 passed, 0 failed** |
| 4 | Probe is a pass-through: outcome returned unchanged, `denied` not rewritten to `ok` | pass |
| 5 | Probe records only its own user; a second user's `handle()` call is not recorded | pass |
| 6 | Probe restores `intelligencePlatform.handle` **by identity** on last dispose; dispose is idempotent | pass |
| 7 | Contribution: an `ok` **empty search** counts as succeeded and contributes **0** | pass |
| 8 | Blast-radius diff over `server/intelligence/`, `server/routes.ts`, `server/index.ts`, `shared/` | **empty** |
| 9 | `neverExercised` never contains a registered-but-**unbound** capability | pass |
| 10 | `bypassedQuestions` splits `defect` (R1) from `structural` (write-intent refusal), defects first | pass |
| 11 | `probeActive: false` ⇒ empty lists and zero counts, **not** "21 never exercised / 100 bypassed" | pass |
| 12 | `renderReport()` over a scored run with utilisation | **446 lines, no crash**; §8/§8.1/§8.2/§8.3 render |
| 13 | `renderReport()` over the certification framework-only path | 21 lines, no crash |
| 14 | Registry truth used live: 21 executable, `administration`/`developer` unbound | pass |

Test files: `server/tests/test-benchmark-capability-utilisation.ts` (new), `server/tests/test-benchmark-routing-integrity.ts`
(BENCH2, extended for the new `CapturedTurn` fields). Both are wired into `npm test`, appended last so they cannot mask an
earlier failure in the `&&` chain.

**A note on how check 4 was found.** The first draft of the probe test asserted that invoking the `developer` capability
returns `not_executable`. It returns `denied` — the engine's `PERMISSION` step runs **before** `INVOKE`. The test was
wrong, not the code; the assertion was corrected and strengthened to also assert the wrapper never fabricates an `ok`.

---

## 7. MANUAL VERIFICATION STEPS

Steps 1–4 need no database, no LLM key, and no server.

### 1. Confirm the rollback tags exist before doing anything else

```bash
git tag -l 'rollback/before-bench2c-*'
git show --stat rollback/before-bench2c-capability-utilisation-20260708-worktree | head -20
```

### 2. Typecheck — the count must not have moved

```bash
npx tsc --noEmit 2>&1 | grep -c 'error TS'        # expect 178
npx tsc --noEmit 2>&1 | grep '^client/'           # expect nothing
npx tsc --noEmit 2>&1 | grep 'tests/benchmark'    # expect exactly the 3 pre-existing errors
```

### 3. The utilisation suite, and the BENCH2 regression guard

```bash
npm run test:benchmark-utilisation                 # expect: 70 passed, 0 failed
npm run test:benchmark-routing                     # expect: 101 passed, 0 failed
```

Read section **3** of the utilisation output in particular — it proves the probe restores `intelligencePlatform.handle`
to the identical original function. If that ever fails, **stop**: the benchmark is mutating the platform it measures.

### 4. Confirm the platform was not touched

```bash
git diff --name-only rollback/before-bench2c-capability-utilisation-20260708-worktree -- \
  server/intelligence server/routes.ts server/index.ts shared
```

Must print **nothing**. (`client/src/pages/admin-intelligence-page.tsx` *is* expected to differ — the dashboard card.)

### 5. Execute a real Quick run (needs DB + `OPENAI_API_KEY` + a seeded user)

```bash
BENCHMARK_MODE=quick BENCHMARK_USER_ID=1 npm run test:companion-benchmark
```

Verify the console prints a line of the form:

```
Capabilities: N invocation(s)  ·  X% utilisation  ·  M never exercised  ·  K question(s) bypassed a registered capability
```

If it instead prints `Capabilities: NOT OBSERVED`, the probe did not install — check the acting user resolved a `userId`.
A run that fails to observe must say so; it must never report zero invocations as though nothing ran.

### 6. Read the emitted report

```bash
ls -t docs/intelligence/benchmark/history/*.report.md | head -1 | xargs less
```

Confirm **§8 Capability Utilisation Dashboard**:

- **§8.1** lists each capability with invocation count, success/failure, **mean/p95/max/total ms**, and **contributed %**.
  A capability with `100%` success and `0%` contribution is doing work nobody uses — that is a real finding, not a bug.
- **§8.2** names registered capabilities that never ran, and lists `administration`/`developer` **separately** as
  unbound-by-design.
- **§8.3** splits bypassing questions into `defect` and `structural`. Every `defect` row must also appear as an `R1` row
  in **§12 Routing Failure Report** — the two must never disagree, because both read `BENCH2`'s `routingRequired`.

Cross-check §3 against §8: they will report **different** "invoked" counts. That is correct (§2.3). §3 counts routed
capabilities; §8 counts everything that executed, including baseline reads.

### 7. Read the admin dashboard

Admin → Intelligence → Benchmark, open the latest run. The **Capability Utilisation** card sits directly above the score
breakdowns. Confirm:

- four stat tiles (Invocations, Utilisation, Never exercised, Bypassing questions), with red accents on the bad ones;
- the exercised-capability table, with a `baseline` badge where a capability ran as a context-only read;
- never-exercised capabilities as badges, with the unbound-by-design note beneath;
- the bypassing-questions table, `defect` rows badged destructive;
- opening a **pre-BENCH2C run** shows *"This run predates capability utilisation tracking"* — not an empty table, and not
  a crash.

---

## 8. WHAT THIS DOES NOT FIX

Named so none is mistaken for solved. None is authorised by this document.

1. **The unreachable capabilities themselves.** BENCH2C *names* them. `INTA1` §5 (M8, M9) names the fixes: the `uplift`
   registry entry, and resolver matchers for `recommend` / `report` that would make `food-intelligence`,
   `opportunity-delivery` and `evidence-learning` reachable at all.
2. **Capability execution time is measured at `handle()`, not inside the handler.** It includes `LOCATE`, `VALIDATE`,
   `PERMISSION` and `CONFIRM` — microseconds of map lookups — alongside the handler, port, business service and database.
   That is the right boundary for "how long did this capability take to serve the turn", and it is not a profiler.
3. **`capabilityTimeShareOfRun` is not a latency budget.** Capabilities execute in `Promise.all` inside a turn, so summed
   capability time can exceed a turn's wall-clock. The share is a proportion of total run time, not of the critical path.
4. **The probe is process-local.** A benchmark triggered through the admin route observes only that process. A future
   multi-process runner would need one probe per process.
5. **`administration` and `developer` remain unbound**, and `capabilityClass` / `aiAccess` / `ownershipScoped` remain
   write-only registry decoration (`INTA1` D20). BENCH2C reads none of them.
6. **The judge tier is still hardcoded off** (`judge.ts:48`). Unrelated to utilisation, still true, still a warning.

---

*Implementation only. No Intelligence Platform, schema, runtime, or API change is authorised or performed by this document.*
*Rollback: `rollback/before-bench2c-capability-utilisation-20260708-worktree` (§0) — restore from the **worktree** tag, not the HEAD tag.*
