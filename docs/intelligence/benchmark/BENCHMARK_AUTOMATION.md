# THA Companion Benchmark — Automation

**Status:** GOVERNING FRAMEWORK — the automated harness, result artefact, CI regression gate, and history model.
**Part of:** [`README.md`](./README.md). **Automates:** [`BENCHMARK_EXECUTION_PROCESS.md`](./BENCHMARK_EXECUTION_PROCESS.md). **Scores via:** [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md). **Emits:** [`BENCHMARK_REPORT_TEMPLATE.md`](./BENCHMARK_REPORT_TEMPLATE.md).

---

## 1. WHY AUTOMATE

A benchmark that only runs when someone remembers is not a regression guard. The value of the framework is realised only
when a run is **cheap, unattended, and comparable** — so that "did this change make the Companion worse?" is answered by
CI, not by hope. This document specifies the harness that turns the seven-step process into one command and one artefact,
and wires it into the same test discipline the rest of the platform already uses (`tsx` scripts under `server/tests/`,
invoked by `package.json` scripts).

## 2. THE RUNNER

The harness is a single deterministic `tsx` entry point, matching the repo's existing test convention (every
`test:intelligence-*` script is a `tsx server/tests/…` file). Proposed layout:

```
server/tests/benchmark/
  run-benchmark.ts            # the runner — implements BENCHMARK_EXECUTION_PROCESS steps 0–6
  seed-households.ts          # idempotent seed of the six fixtures to fixed IDs (BENCHMARK_HOUSEHOLDS §5)
  score.ts                    # two-tier scorer (deterministic assertions + judge call), pure where possible
  judge.ts                    # pinned judge client: fixed model id, temp 0, frozen prompt, strict-JSON contract
  compare.ts                  # baseline diff + significance rules (REPORT_TEMPLATE §6)
  emit.ts                     # writes result.json + report.md
docs/intelligence/benchmark/
  fixtures/households.v1.json # machine-readable seed contract (checksum-locked to BENCHMARK_HOUSEHOLDS)
  questions/                  # the canonical THA Companion Benchmark 100 lands here when delivered (NOT authored by INTQ1)
  history/                    # append-only run artefacts (see §4)
```

Invoked via a `package.json` script alongside the existing suite:

```
"test:companion-benchmark": "tsx server/tests/benchmark/run-benchmark.ts"
```

**Hard constraints on the runner's import surface** (enforcing [`BENCHMARK_EXECUTION_PROCESS.md`](./BENCHMARK_EXECUTION_PROCESS.md) §2.5):

- It imports **exactly one** Companion seam: `conversationGateway` (its `processUserTurn`). It must **not** import a
  capability handler, binding, the intent engine, the permission model, or the behaviour engine directly — the benchmark
  observes the one Companion, it does not reach inside it.
- It imports the platform's **existing** stores only for **seeding fixtures** and for **conversation lifecycle**, never
  for reading answers back (answers come from `TurnResult` alone).
- The judge client is the **only** outbound network dependency.

**Amended under `BENCHINT2` (2026-07-10)**, to describe what the harness does rather than what it was hoped to do. Three
clarifications, each narrower than it looks:

1. **Conversation lifecycle is a permitted store use.** `companion-turn.ts` constructs a `DatabaseConversationStore` to
   close the acting user's active thread around every question, so each question is a fresh conversation session
   (`BENCHMARK_EXECUTION_PROCESS.md` §1 step 3a). It calls only `getOrCreateConversation` / `getActiveThread` /
   `closeThread` — the same lifecycle `IConversationStore.openThread` documents as the caller's responsibility. It reads
   **no** turn content: the answer still comes from `TurnResult` alone. Before this the thread was never closed, and a
   100-question run was one 200-turn conversation in which every question was answered with its predecessors in the
   prompt (`BENCHINT1` D1).
2. **Type-only imports of the platform's vocabulary are permitted, and preferred.** `scorer.ts` imports the
   `IntentOutcomeStatus` and `UnsuccessfulTurnState` unions as *types*, erased at runtime, so that "which outcomes are an
   honest gap" is derived from the platform's own union rather than hand-copied beside it (`BENCHINT1` D6). A hand-copied
   set drifts silently; an exhaustive `Record` over the union fails the build.
3. **`context-composition-verification/` is not a carve-out; it has moved out.** It constructed a `ConversationGateway`
   with an in-memory store and a stub LLM provider — legitimate for verifying one engine out of band, and a flat
   contradiction of the constraint above while it lived under `server/tests/benchmark/`. It is now
   `server/tests/context-composition/` (`BENCHINT1` D12). **Every** file remaining under `server/tests/benchmark/`
   satisfies the constraint as written.

The runner is invoked with the resolved bundle and a benchmark-only database connection; it performs process steps 0–6
and exits non-zero on abort or on a CI-gate failure (§4).

## 3. THE RESULT ARTEFACT (`result.json`)

The machine-readable output — the single source of truth for history, comparison, and the CI gate. Human `report.md`
([`BENCHMARK_REPORT_TEMPLATE.md`](./BENCHMARK_REPORT_TEMPLATE.md)) is a rendering of it. Schema (stable per `framework`
version):

```jsonc
{
  "schemaVersion": "1.0.0",
  "runId": "2026-07-04T09-00Z__a1b2c3d",     // ISO time + subject short-sha, unique
  "status": "scored",                          // "scored" | "aborted"
  "abortReason": null,                          // set only when status="aborted"
  "bundle": {
    "questions": "v1.0.0", "households": "v1.0.0", "rubric": "v1.0.0",
    "judge": "v1.0.0", "framework": "v1.0.0",
    "fixtureChecksum": "sha256:…"
  },
  "subject": { "commit": "a1b2c3d…", "branch": "…", "dirty": false },
  "judge": { "model": "claude-opus-4-8", "temperature": 0, "promptHash": "sha256:…" },
  "clock": "2026-07-04T00:00:00Z",
  "repeats": 1,
  "headline": {
    "score": 86.4, "honestGapRate": 0.96, "gatesFired": 0,
    "questionsScored": 100, "meanLatencyMs": 1900
  },
  "dimensions": { "D1": { "points": 27.6, "bandPct": 0.92 }, "D2": { … }, … },
  "capabilities": [ { "capability": "meals", "n": 12, "mean": 89, "gates": 0 }, … ],
  "households":   [ { "household": "H2", "n": 18, "mean": 87, "gates": 0 }, … ],
  "safety": { "G1": [], "G2": [], "G3": [], "G4": [], "G5": [] },   // arrays of failing question ids
  "questions": [
    {
      "id": "Q001", "household": "H4", "capability": "meals",
      "correctAnswerType": "grounded",                  // "grounded" | "honest-gap"
      "composite": 92, "gate": null,
      "bands": { "D1": 4, "D2": 4, "D3": 4, "D4": 3, "D5": 4, "D6": 4, "D7": 3 },
      "reachedCapability": "meals", "fallbackState": null,
      "latencyMs": 1800,
      "judgeRationales": { "D1": "…cited…", "D5": "…cited…" }
    }
    // …one per question
  ],
  "baselineRunId": "2026-06-27T09-00Z__f9e8d7c"          // null on first run / re-baseline
}
```

Every field a report or a comparison needs is here; nothing in the report is computed from data not in this file, so any
report is auditable from its artefact alone.

### 3.1 `BENCH2` additions (`schemaVersion` `1.1.0`, additive — no field removed or retyped)

```jsonc
{
  "schemaVersion": "1.1.0",
  "bundle": { "rubric": "v2.0.0", "framework": "v2.0.0", /* questions/households/judge unchanged */ },
  "headline": {
    /* …existing… */
    "routingGatesFired": 49,          // R1 + R2
    "intentResolutionAccuracy": 0.40, // reached the INTENDED capability, of routing-required questions
    "capabilityReach": 0.70,          // reached ANY capability, of routing-required questions
    "hallucinationRate": 0.00         // gate G1 / questionsScored
  },
  "environment": { "llmProviderAvailable": true, "judgeInvoked": false },

  "routing": {                        // ROUTING ACCURACY panel
    "routingRequiredQuestions": 81, "capabilityReachPct": 0.70, "intentResolutionAccuracyPct": 0.40,
    "capabilityMisses": 24, "misroutes": 25,
    "unreachableCapabilities": ["diary", "food-intelligence", "…"], "unreachableCapabilityCount": 5,
    "failureReasons": { "intent-unresolved": 34, "wrong-capability": 32 },
    "validHonestGaps": 12,
    "invokedCapabilitiesSource": "resolved-intent"   // | "outcome-only" | "mixed" | "none"
  },
  "coverage": {                       // CAPABILITY COVERAGE panel
    "intendedCapabilities": [...], "invokedCapabilities": [...], "intendedCoveragePct": 0.7,
    "registryExecutableCapabilities": [...], "registryCoveragePct": 0.5, "untestedCapabilities": [...]
  },
  "coverageByDomain": [ { "domain": "Profile & Household", "questions": 10, "routingRequired": 7,
                          "reachedAny": 2, "reachedIntended": 1, "capabilityReachPct": 0.29,
                          "intentResolutionAccuracyPct": 0.14, "capabilityMisses": 5,
                          "misroutes": 1, "validHonestGaps": 3 } ],
  "routingFailures": [ { "id": "PH-001", "domain": "Profile & Household",
                         "intendedCapability": "profile", "intendedCapabilityStatus": "registered-executable",
                         "invokedCapabilities": [], "outcome": "capability-miss",
                         "failureReason": "intent-unresolved", "routingGate": "R1",
                         "fallbackState": "no-route", "explanation": "…" } ],
  "quality": {                        // ANSWER QUALITY panel — reached-intended questions ONLY
    "questionsScored": 32, "meanComposite": 78.1,
    "meanD1Band": 2.4, "meanD5Band": 2.8, "meanD7Band": 3.0,
    "reachedButEmpty": 6, "judgeInvoked": false
  },
  "hallucination": { "count": 0, "rate": 0, "questionIds": [], "basis": "Deterministic gate G1: …" },

  "questions": [ {
      /* …existing… */
      "routingGate": null,            // "R1" | "R2" | null — independent of the safety `gate`
      "hallucination": false,
      "routing": { "intendedCapability": "profile", "intendedCapabilityStatus": "registered-executable",
                   "routingRequired": true, "invokedCapabilities": ["profile"],
                   "invokedCapabilitiesSource": "resolved-intent",
                   "outcome": "reached-intended", "failureReason": null, "explanation": "…" }
  } ]
}
```

`intendedCapabilityStatus` is resolved live from `intelligencePlatform.registry` — never a copied list, so a capability
bound tomorrow enters the routing-required set with no benchmark change.

`invokedCapabilities` is read from the routed set the gateway **already persists** on the assistant turn
(`conversation_turns.resolved_intent`, INT39). When that is unreadable, the benchmark falls back to the single primary
`TurnResult.outcome.capabilityId`, stamps `invokedCapabilitiesSource: "outcome-only"`, and **says so in the report** —
misroute detection may over-report on multi-capability turns. It never presents a narrower set as if it were complete.

### 3.2 `BENCH2C` additions (`schemaVersion` `1.2.0`, additive — no field removed or retyped)

```jsonc
{
  "schemaVersion": "1.2.0",
  "bundle": { "framework": "v2.1.0", /* rubric/questions/households/judge unchanged */ },

  "capabilityUtilisation": {                   // CAPABILITY UTILISATION DASHBOARD
    "probeActive": true,                       // false ⇒ "not measured", never "nothing ran"
    "exercised": [ {
        "capabilityId": "profile", "displayName": "Profile / Preferences",
        "registered": true, "executable": true,
        "invocations": 6, "questions": 4,
        "succeeded": 6, "failed": 0, "threw": 0, "successRate": 1,
        "contributedToAnswer": 2, "contributionRate": 0.333,   // reached the LLM's CONTEXT DATA
        "baselineInvocations": 4,                              // context-only reads, not routed
        "meanDurationMs": 13, "p95DurationMs": 25, "maxDurationMs": 25, "totalDurationMs": 78,
        "verbs": ["read"], "statuses": { "ok": 6 }
    } ],
    "neverExercised": ["diary", "food-intelligence", "…"],     // registered + executable, never ran
    "neverExercisedCount": 19,
    "registeredUnbound": ["administration", "developer"],      // cannot run by design, not a defect
    "bypassedQuestions": [ {
        "id": "PH-001", "domain": "Profile & Household", "utterance": "…",
        "intendedCapability": "profile", "intendedCapabilityStatus": "registered-executable",
        "kind": "defect",                                      // | "structural"
        "routingGate": "R1", "failureReason": "intent-unresolved", "fallbackState": "no-route"
    } ],
    "bypassedStructural": 12, "bypassedDefect": 24,
    "totalInvocations": 8, "totalCapabilityTimeMs": 124,
    "capabilityTimeShareOfRun": 0.02,                          // rest is LLM + gateway
    "utilisationPct": 0.10                                     // exercised / registry-executable
  },

  "questions": [ {
      /* …existing… */
      "capabilityInvocations": [ {
          "capabilityId": "profile", "verb": "read", "status": "ok", "ok": true,
          "durationMs": 12, "threw": false, "errorMessage": null,
          "contribution": "grounding-data",  // | empty-result | no-knowledge | error | context-only | unknown
          "baseline": false
      } ]
  } ]
}
```

**Where the numbers come from, and why there is no duplicate log.** The platform records no capability timing. Rather
than add one to a production write path, the benchmark installs a **pass-through probe** over
`intelligencePlatform.handle()` — the single entry point every capability invocation already funnels through
(`server/tests/benchmark/capability-probe.ts`). It awaits the original, returns its outcome object **unchanged**,
re-throws errors **unchanged**, records only when `context.userId` matches the benchmark's acting user (a concurrent real
user's turn passes through unobserved), keeps a **run-scoped in-memory buffer** that is drained per turn and never
persisted, and reference-counts install/uninstall so the singleton is restored exactly. `runner.ts` disposes it in a
`finally`, so a thrown question can never leave the platform wrapped.

**This does not weaken the §2 import-surface constraint.** The probe imports no capability handler, no intent engine, no
permission model, no behaviour engine — it observes one public method, and derives that method's type with `typeof`
rather than importing `RouteOptions` from `intent-engine.ts`. Every question still executes through
`conversationGateway.processUserTurn` and nothing else (README §1). The probe is an observer of that path, not a second one.

**Two different notions of "invoked", both correct.** `routing.invokedCapabilities` (BENCH2) is the **routed,
non-baseline** set — *what answered the question*, read from the persisted `resolved_intent`.
`capabilityUtilisation.exercised` (BENCH2C) is **everything that executed** — *what the platform ran*, including baseline
context-only reads and capability-to-capability fan-out that `resolved_intent` deliberately omits. Each panel states its
own definition; neither is derived from the other, and they are expected to differ.

## 4. HISTORY & THE CI REGRESSION GATE

### History

- Scored `result.json` artefacts are **appended, never edited**, under `docs/intelligence/benchmark/history/`
  (`history/<runId>.json`, and the rendered `history/<runId>.report.md`). An immutable, versioned trail is the whole
  point — a run is a permanent record of "the Companion at commit X against bundle Y."
- A lightweight `history/index.json` (or a generated `history/HISTORY.md`) lists every scored run: runId, date, subject
  commit, bundle version, headline, gatesFired — the at-a-glance trend and the input to baseline selection.
- **Baseline selection** for a new run: the most recent scored run in history at a **comparable** bundle version
  ([`BENCHMARK_REPORT_TEMPLATE.md`](./BENCHMARK_REPORT_TEMPLATE.md) §6) on the subject's mainline. A run may override with
  an explicit `--baseline <runId>` for A/B comparisons; the effective baseline is always recorded in the artefact.

### The CI gate

The runner exits **non-zero** — failing the pipeline — when, versus the selected baseline:

1. **Any hard-gate G1–G4 fired.** Non-negotiable. A fabrication, unsafe recommendation, claimed write, or cross-household
   leak blocks the build even if the headline rose. (G5 alone warns rather than blocks, unless it exceeds a small
   configured count.)
2. **The headline regressed beyond the significance threshold** (`> 0.5` points, or beyond measured variance when
   `repeats > 1`).
3. **The honest-gap rate regressed** beyond its threshold (default `> 2` points) — honesty is guarded independently of
   the headline, so a Companion can't "trade" honesty for fluency and still pass.
4. **A previously-passing question newly failed** (the watchlist) — a targeted regression blocks even amid a net
   improvement, and names the question so it's actionable.

A run at a **cross-MAJOR** bundle version establishes a **new baseline** and does not gate on deltas (there is nothing
comparable to regress against); it still gates on absolute safety (rule 1 always applies).

### `BENCH2` additions to the CI gate (2026-07-08)

Two absolute conditions, evaluated **without** reference to a baseline (rules 1–4 above are relative; these are not):

5. **`R1` (capability miss) fired on any question.** A registered, executable capability existed and was never invoked —
   the platform cannot reach a capability it advertises. This is a **release blocker**, exactly as a hard safety gate is.
   `R2` (misroute) is a warning. See [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md) §4.1.
6. **No LLM provider was configured.** The gateway short-circuits before intent resolution, so the run measures nothing.
   Before `BENCH2` this scored **71.25/100 — above the pass threshold — with the LLM entirely absent.**

Additionally, `index.json` rows now carry `rubricVersion`, `routingGatesFired` and `intentResolutionAccuracy`, and
**baseline selection requires a matching rubric MAJOR** as well as a questions MAJOR (`selectBaseline`,
`server/tests/benchmark/history.ts`). Pre-`BENCH2` rows carry no `rubricVersion` and are therefore never selected against
a `v2` rubric — the intended re-baseline.

## 5. SCHEDULED & ON-DEMAND EXECUTION

The same runner serves three trigger modes; all produce identical artefacts:

| Mode | Trigger | Typical baseline | Purpose |
|---|---|---|---|
| **On-demand** | a developer runs `npm run test:companion-benchmark` locally | latest mainline scored run | pre-merge sanity on a risky Companion change |
| **PR gate** | CI on a PR that touches the Companion/Intelligence surface | the PR's merge-base scored run | block regressions before merge (§4) |
| **Scheduled** | a routine on a fixed cadence (e.g. nightly / weekly) against mainline HEAD | previous scheduled run | catch drift from dependency/model/data changes no PR touched |

- **Optional `repeats: N`** ([`BENCHMARK_EXECUTION_PROCESS.md`](./BENCHMARK_EXECUTION_PROCESS.md) §5) runs each question N
  times and records mean + variance; used on the scheduled run to characterise any subject non-determinism. Default `1`.
- **Cost control:** the judge is only called for the dimensions that need it (§2 of the scoring framework), at temp 0; a
  full 100-question run's judge cost is bounded and recorded. The deterministic tier needs no LLM at all, so a
  routing/safety regression is often caught before a single judge call.
- The scheduled trigger is a thin wrapper (a cron routine or CI schedule) that resolves the bundle, pins mainline HEAD as
  the subject, runs, appends to history, and surfaces the report; it adds **no** scoring logic of its own — all logic
  lives in the one runner so every mode scores identically.

## 6. GUARANTEES THE AUTOMATION MUST PRESERVE

- **One Companion, one seam.** The runner's import surface is the enforcement point for the framework's core invariant
  (§2). A change that reaches past `processUserTurn` is a framework violation, not a feature.
- **Immutable history.** Artefacts are append-only; a frozen bundle version is never re-scored in place. Corrections are
  new runs / new bundle versions ([`README.md`](./README.md) §4).
- **Disposable state.** The runner provisions and drops its own database every run
  ([`BENCHMARK_EXECUTION_PROCESS.md`](./BENCHMARK_EXECUTION_PROCESS.md) §6); it never touches a real store and confirms so
  before seeding.
- **Reproducibility.** Same bundle + same subject ⇒ same artefact (within recorded variance). Everything needed to
  reproduce a run is inside its `result.json` (§3).
