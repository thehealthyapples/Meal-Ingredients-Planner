# INTQ4 — Intelligence Benchmark Execution Platform — Implementation Report

**Workstream:** INTQ4
**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Status:** Delivered — executable Quick & Full benchmarks (deterministic tier), Certification framework, Admin Intelligence workspace, benchmark history, markdown reports, and the Intelligence dashboard.

---

## 1. Mission & scope delivered

Build the Intelligence Benchmark Execution Platform on top of the existing benchmark
framework (`docs/intelligence/benchmark/`), the canonical Benchmark 100 questions, and
the imported fixture (`server/tests/benchmark/fixtures/companion-benchmark-100.v1.json`).

Every scope item is implemented:

| Scope item | Status | Where |
|---|---|---|
| Admin → Intelligence workspace | ✅ | `client/src/pages/admin-intelligence-page.tsx` (`/admin/intelligence`) |
| Benchmark page | ✅ | Benchmark tab of the workspace |
| Benchmark execution | ✅ | `server/tests/benchmark/runner.ts` + `companion-turn.ts` |
| Quick Benchmark | ✅ | 10 questions — one per canonical domain (`select.ts`) |
| Full Benchmark | ✅ | all 100 questions |
| Certification Benchmark (framework only) | ✅ | `runner.ts` → `certificationFrameworkOnly` (returns a non-scored artefact describing the strict preconditions) |
| Execute through the ONE Companion only | ✅ | `companion-turn.ts` wraps `conversationGateway.processUserTurn` and nothing else |
| Markdown report after every run | ✅ | `report.ts` (`renderReport`) → `history/<runId>.report.md` |
| Store benchmark history | ✅ | `history.ts` — append-only `history/<runId>.json` + `index.json` |
| Display benchmark trends | ✅ | Trend line chart of Overall Intelligence Score across scored runs |
| Overall Intelligence Score | ✅ | headline stat tile |
| Domain / Personality / Household scores | ✅ | four grouped rollup tables |
| PASS / PARTIAL / FAIL | ✅ | `releaseReadiness.verdict` + verdict badge |
| Top Improvements / Regressions | ✅ | `aggregate.compare` vs baseline |
| Failed Questions | ✅ | worst-first failing/watchlist table |
| Release Readiness | ✅ | blockers / warnings / notes panel |
| Download reports | ✅ | `GET …/runs/:runId/report` (attachment) |
| View previous runs | ✅ | Run History table → View / Download |
| Link every run to bundle version, git commit, capability registry version, knowledge version, execution date | ✅ | `bundle.ts` `resolveBundle` + `resolveProvenance`, stamped on every artefact |

---

## 2. Architecture & the one invariant

The framework's core invariant (README §1, AUTOMATION §2) is honoured structurally, not
just by intent:

> The benchmark is an **observer** of the one Companion, executed exclusively through its
> single public seam `conversationGateway.processUserTurn`.

- **`companion-turn.ts` is the only module in the platform that imports the Companion.**
  It wraps `processUserTurn` into a `TurnRunner` and maps the full `TurnResult` down to the
  `CapturedTurn` the scorer reads. No module reaches past it into a capability handler, the
  intent engine, the permission model, or the behaviour engine.
- **The runner (`runner.ts`) is pure orchestration** — it receives a `TurnRunner` and never
  touches the gateway itself, so the one-seam boundary is enforced by the module graph.
- **No conversation logic is duplicated and no second Companion is created.** Scoring reads
  only the captured turn; it never re-implements routing, grounding, or fallback.

### Module layout (`server/tests/benchmark/`, matching AUTOMATION §2)

| File | Responsibility |
|---|---|
| `types.ts` | The `result.json` artefact schema + run-mode contracts (single source of truth) |
| `bundle.ts` | Resolves the five bundle components + provenance (commit, capability-registry & knowledge fingerprints, fixture checksum, frozen clock) |
| `expectations.ts` | Derives per-question expectation records from the fixture (SCORING_FRAMEWORK §2.1 — INTQ3 left these to the execution workstream) |
| `scorer.ts` | Deterministic-tier two-tier scorer: 7 dimensions → bands → hard-gates → composite |
| `judge.ts` | Pinned judge interface + disabled default (deterministic-only, honestly stamped) |
| `select.ts` | Quick / Full / Certification question selection in canonical id order |
| `aggregate.ts` | Rollups, honest-gap rate, safety panel, baseline comparison, release readiness |
| `runner.ts` | Execution engine — EXECUTION_PROCESS steps 0–5 |
| `report.ts` | Markdown report renderer (REPORT_TEMPLATE section order) |
| `history.ts` | Append-only history store + baseline selection |
| `companion-turn.ts` | **The one-seam adapter** (the only Companion import) |
| `run-benchmark.ts` | CLI entry point (`npm run test:companion-benchmark`) |
| `index.ts` | Public API surface (admin routes + CLI consume this) |

---

## 3. Scoring model

Implements the two-tier model of `BENCHMARK_SCORING_FRAMEWORK.md`:

- **Seven dimensions with the canonical weights** (D1 30, D2 20, D3 15, D4 12, D5 13, D6 5,
  D7 5). `dimensionPoints = band/4 × weight`; per-question composite = Σ points, then the
  hard-gate cap.
- **Deterministic tier (implemented, LLM-free):** D3 Safety/Permission and D4 Capability
  Routing are scored entirely from the `TurnResult` (outcome status, reached capability,
  actions, fallback state). D1/D2/D5/D6 receive conservative deterministic estimates capped
  short of "exemplary", so a deterministic-only run never awards a band it cannot prove.
  Honest-gap detection (D2 = band 4 when a gap was correctly admitted) is fully deterministic.
- **Hard-gates:** **G3** (claimed/unauthorised write) and **G5** (unhandled internal error)
  fire deterministically from the captured turn. **G1/G2/G4** require ground-truth household
  facts; they are wired into the panel but, in single-world mode (§4), are honestly reported
  as un-fired rather than guessed — the platform never claims a detection it did not make.
- **Judge tier (interface shipped, disabled by default):** `judge.ts` defines the pinned,
  temperature-0 `claude-opus-4-8` grader seam for the *degree* of D1/D2/D5/D6. Until a pinned
  Anthropic client is wired, runs execute deterministic-only and are stamped
  `judge.invoked = false` — the framework's own "never silently default a judge score"
  discipline (SCORING_FRAMEWORK §2.2).

---

## 4. World mode — an honest boundary

The framework's ideal is six **deterministic households** seeded to fixed IDs in a disposable
database (`households.v1.json` seed contract, BENCHMARK_HOUSEHOLDS §5). **That seed contract
fixture does not yet exist** (only the questions fixture was delivered by INTQ3). Building it —
full write-path seeding of six checksummed households plus a disposable-DB provisioner — is a
distinct, large workstream.

INTQ4 therefore executes in **`single-world` mode**: every question runs through the real seam
against the acting admin's own live household context — exactly the path a real message takes,
fully honouring the one-seam invariant. The artefact records `worldMode: "single-world"` and
every breakdown is labelled accordingly, so a reader is never misled about what world produced
the score. The engine already carries a `worldMode: "deterministic-households"` path and a
`householdLabel` per question, so wiring the seed contract later is additive — no re-architecture.

**Certification** is the mode that *requires* deterministic households + a reachable pinned
judge; it is delivered **framework-only**: it resolves and validates the bundle and returns a
`framework-only` artefact naming the outstanding preconditions, never a partial or misleading
score.

---

## 5. Provenance — every run is fully attributable

`resolveBundle()` + `resolveProvenance()` stamp each artefact (INTQ4 link requirement):

- **benchmark / bundle version** — questions `v1.0.0` (from the fixture) + households / rubric /
  judge / framework `v1.0.0`, with a `fixtureChecksum`.
- **git commit** — `git rev-parse HEAD` (+ branch, + dirty flag).
- **capability registry version** — a content fingerprint (`sha256`) of the runtime registry's
  capability IDs, supported/executable intents, and availability.
- **knowledge version** — a content fingerprint of `KNOWLEDGE_SEED_COUNTS`.
- **execution date** — ISO timestamp, plus the frozen `benchmarkClock` (`2026-07-04T00:00:00Z`).

---

## 6. API & UI

**Admin-only routes** (`server/routes.ts`, guarded by `assertAdmin`, audit-logged):

- `POST /api/intelligence/benchmark/run` — execute (`{ mode: quick|full|certification }`)
- `GET  /api/intelligence/benchmark/runs` — history index
- `GET  /api/intelligence/benchmark/runs/:runId` — one full artefact
- `GET  /api/intelligence/benchmark/runs/:runId/report` — downloadable markdown
- `GET  /api/intelligence/benchmark/bundle` — resolved bundle + provenance ("ready to run" panel)

**Admin → Intelligence workspace** (`/admin/intelligence`, linked from the admin apple-menu as
"Intelligence Benchmark"): a two-tab shell (Benchmark · Companion Health). The Benchmark page
provides run controls with the live provenance panel, the full Intelligence dashboard for the
latest or a selected run (Overall Intelligence Score, honest-gap rate, hard gates, release
readiness, safety panel, dimension breakdown, domain/capability/household/personality scores,
top improvements/regressions, failed questions), the benchmark trend chart, and the run-history
table with per-run View + Download.

---

## 7. Verification performed

- **Type-check:** `tsc --noEmit` — **0 errors** across all twelve new engine modules,
  `server/routes.ts`, and the new React page/route/nav. (Pre-existing type errors elsewhere in
  the WIP branch's `server/tests/*` and `server/scripts/*` are unrelated and untouched.)
- **Engine end-to-end (stub Companion):** a Quick run scored 10 questions, produced the full
  headline / dimension / domain (10) / capability (9) rollups, honest-gap rate, PASS verdict,
  and a template-shaped markdown report; the Certification path returned a `framework-only`
  artefact.
- **History round-trip:** `saveRun` → `history/<runId>.json` + `.report.md` + `index.json`;
  `loadRun` / `loadReport` / `listRuns` all read back correctly; baseline selection filters by
  comparable bundle MAJOR.
- **CLI:** `tsx server/tests/benchmark/run-benchmark.ts --mode=certification` emitted the
  framework-only artefact and report.
- **No regression:** `npm run test:companion-benchmark:validate` still **PASSES** (import
  integrity of the 100 questions unchanged).
- All temporary run artefacts created during verification were removed; the canonical
  `history/` location is seeded with a `.gitkeep` only.

---

## 8. Compliance with the governing architecture

- **One Companion, one seam** — enforced by the module import graph (`companion-turn.ts` is the
  sole Companion importer). ✅
- **Does not bypass the Intelligence Platform** — every turn goes through `processUserTurn`. ✅
- **Does not duplicate conversation logic** — the scorer reads the captured `TurnResult` only. ✅
- **Does not create a second Companion** — no parallel gateway, resolver, or assistant. ✅
- **Honest gaps over fabrication** — deterministic scoring treats an admitted gap as the best
  outcome (D2 band 4), and the platform declines to claim G1/G2/G4 detections it cannot make in
  single-world mode rather than inventing them. ✅
- **Immutable, versioned history** — append-only artefacts, frozen bundle versions. ✅

---

## 9. Follow-on work (clearly bounded, additive)

1. **Deterministic households** — author `docs/intelligence/benchmark/fixtures/households.v1.json`
   and a disposable-DB seeder to unlock `deterministic-households` world mode and Certification
   execution (enables G1/G2/G4 to fire against known ground truth).
2. **Wire the pinned judge** — supply a temperature-0 `claude-opus-4-8` client to `resolveJudge()`
   to activate the D1/D2/D5/D6 degree grading (the seam already exists).
3. **PR / scheduled triggers** — the CLI already exits non-zero on any hard safety gate; add the
   thin CI/cron wrapper (AUTOMATION §5) once households + judge are in place.
