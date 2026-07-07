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
- It imports the platform's **existing** stores only for **seeding fixtures**, never for reading answers back (answers
  come from `TurnResult` alone).
- The judge client is the **only** outbound network dependency.

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
