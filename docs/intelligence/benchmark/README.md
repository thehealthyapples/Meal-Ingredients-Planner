# THA Companion Intelligence Benchmark Framework

**Status:** GOVERNING FRAMEWORK — the permanent, canonical home for executing the THA Companion Benchmark.
**Established:** 2026-07-04 (workstream `INTQ1`).
**Classification:** Intelligence Governance — the single, repeatable measurement of how good the one Companion actually is.
**Governing documents this framework serves and must never contradict:**
[`../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1/TIP2),
[`../../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](../../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) (TIP3),
[`../../architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md) (CPA1),
[`../../architecture/PLATFORM_QUALITY_ARCHITECTURE.md`](../../architecture/PLATFORM_QUALITY_ARCHITECTURE.md).

---

## 0. WHAT THIS IS

This directory is the **permanent framework for running the THA Companion Benchmark** — the fixed instrument THA uses to answer one question, the same way, every time:

> **How good is the one Companion, right now, on a canonical set of real household questions — and is it better or worse than the last time we measured?**

The framework is **the measuring instrument, not the measurement, and not the questions.**

- The **questions** are the canonical **THA Companion Benchmark 100** — one hundred frozen, versioned utterances, **delivered separately**. This framework does **not** contain them and this workstream did **not** author them. Every process here is written to accept that set as an input.
- The **households** the questions run against, the **scoring rubric**, the **execution process**, the **report shape**, the **automation harness**, and the **history/comparison model** are all defined here, permanently, so that a benchmark run in six months is directly comparable to one run today.

## 1. THE ONE INVARIANT THIS FRAMEWORK INHERITS

The benchmark measures the **one Companion** through its **one public seam** and **never builds a second one.**

Every question is executed by calling the platform's single conversation entry point,
`conversationGateway.processUserTurn(...)` (`server/intelligence/conversation/conversation-gateway.ts`), against a
freshly-seeded deterministic household — exactly the path a real user's message takes. The benchmark **never** calls a
capability handler directly, **never** short-circuits the Intent Engine, permission model, or honest-gap classifier, and
**never** stands up a parallel "benchmark assistant." If a code path is not reachable through `processUserTurn`, the
benchmark cannot and must not score it — that is a deliberate property, not a limitation.

This is the same rule the Companion Platform Architecture (CPA1 §0) states for every Companion capability: *there is one
Companion.* The benchmark is an **observer** of that one Companion, never a second copy of it.

## 2. THE DOCUMENTS

| # | Document | What it defines |
|---|---|---|
| 1 | [`BENCHMARK_EXECUTION_PROCESS.md`](./BENCHMARK_EXECUTION_PROCESS.md) | The end-to-end run process: preconditions, household seeding, per-question execution through `processUserTurn`, capture, scoring hand-off, and teardown. The authoritative "how a run happens." |
| 2 | [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md) | The seven scoring dimensions, the deterministic-first / judge-second two-tier model, weights, the honest-gap and safety hard-gates, and how per-question scores roll up into one headline number. |
| 3 | [`BENCHMARK_HOUSEHOLDS.md`](./BENCHMARK_HOUSEHOLDS.md) | The six deterministic benchmark households — stable IDs, complete fixture data, and the seed contract. The fixed "world" every question runs against. |
| 4 | [`BENCHMARK_REPORT_TEMPLATE.md`](./BENCHMARK_REPORT_TEMPLATE.md) | The canonical report shape: headline score, dimension / capability / household breakdowns, honest-gap and safety panels, regression-vs-baseline, and the per-question detail appendix. |
| 5 | [`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md) | The automated harness: the runner, the machine-readable result artefact, the CI regression gate, and how a scheduled run happens without a human in the loop. |
| 6 | *(this file)* `README.md` | Index, the one invariant, versioning, and the glossary. |

Read them in the order above for a first pass. For an actual run, start at
[`BENCHMARK_EXECUTION_PROCESS.md`](./BENCHMARK_EXECUTION_PROCESS.md).

> **Related operational infrastructure (not part of the bundle):**
> [`BENCHMARK_HOUSEHOLD_WORLD.md`](./BENCHMARK_HOUSEHOLD_WORLD.md) (INTQ6, 2026-07-05) — the permanent, deterministic
> ten-household DEV world ("Name (Auto)" accounts, `BW01`–`BW10`) that admin-triggered Quick/Full runs execute
> against, with its seeder, reset mechanism, and the Admin → Benchmark Households page. It does **not** replace the
> six certification fixtures in [`BENCHMARK_HOUSEHOLDS.md`](./BENCHMARK_HOUSEHOLDS.md) and does not change the
> `households` bundle component: runs against the World are stamped `worldMode: "benchmark-world"` so they are never
> conflated with certification scores.

## 3. THE BENCHMARK BUNDLE AND ITS VERSION

A benchmark result is only meaningful relative to **everything that produced it.** The framework therefore treats the
five inputs below as **one versioned bundle**. A run records the exact version of each; two results are directly
comparable only when their bundle versions are compatible (see [Versioning](#4-versioning), and the comparison rules in
[`BENCHMARK_REPORT_TEMPLATE.md`](./BENCHMARK_REPORT_TEMPLATE.md) §6).

| Bundle component | Owned by | Version key |
|---|---|---|
| **Questions** — the THA Companion Benchmark 100 | Delivered separately (canonical) | `questions` |
| **Households** — the deterministic fixtures | [`BENCHMARK_HOUSEHOLDS.md`](./BENCHMARK_HOUSEHOLDS.md) | `households` |
| **Rubric** — dimensions, weights, gates | [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md) | `rubric` |
| **Judge** — model id + fixed judge prompt | [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md) §5 | `judge` |
| **Framework** — process, harness, report shape | this directory | `framework` |

The **subject under test** — the Companion build (git commit) — is recorded alongside the bundle but is deliberately
**not** part of the bundle version: the whole point is to vary the subject while holding the bundle fixed.

## 4. VERSIONING

The bundle uses **semantic versioning**, `MAJOR.MINOR.PATCH`, frozen per release:

- **MAJOR** — a change that makes scores **not comparable** across the boundary: a changed or removed question, a changed
  household fact a question depends on, a changed dimension set or weight, or a changed judge model/prompt. Cross-major
  comparison is **reported as a re-baseline, never as a regression/improvement delta.**
- **MINOR** — an **additive, comparison-safe** change: a new household that no existing question uses, a new *optional*
  report panel, a clarified rubric note that cannot move an existing score. Comparable, with the addition annotated.
- **PATCH** — wording, typo, and documentation fixes with **zero** scoring effect.

The canonical **THA Companion Benchmark 100** as first delivered is bundle **`v1.0.0`**. Every run artefact stamps the
full bundle version and the subject commit (see [`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md) §3). The rule that
makes history trustworthy: **a frozen version is never edited in place** — a correction is a new PATCH/MINOR/MAJOR
release with its own entry in the version log below.

### Version log

| Bundle version | Date | Change | Comparable to previous? |
|---|---|---|---|
| `v1.0.0` | 2026-07-04 | Framework established (INTQ1). Households, rubric, judge, report, automation defined. Awaiting delivery of the canonical Benchmark 100 questions to complete the bundle. | — (baseline) |
| `v1.0.0` | 2026-07-04 | Canonical Benchmark 100 questions delivered (INTQ2) and imported to executable fixtures (INTQ3) at `server/tests/benchmark/fixtures/companion-benchmark-100.v1.json`; import integrity validated by `npm run test:companion-benchmark:validate`. The `questions` component is now **delivered**. Data import only — no scoring, framework, or Companion behaviour changed; still no scored run has been executed. | — (bundle unchanged; questions completed) |
| `framework v2.1.0` | 2026-07-08 | **BENCH2C — Capability Utilisation Dashboard.** Every benchmark run now records **which registered Intelligence Capabilities actually executed**: capability name, invocation count, success/failure (including throws), true execution time (mean / p95 / max / total), and each invocation's **contribution to the final answer** (only a result that entered the LLM's CONTEXT DATA block grounded the answer — an `ok` empty search did not). It highlights **registered capabilities never exercised** and **benchmark questions that bypassed every registered capability**, split into `defect` (a registered, executable capability existed and nothing ran — BENCH2 gate R1) and `structural` (a write-intent refusal, a safety boundary, or no executable capability exists). Observed by a **pass-through probe** over the platform's own public `handle()` seam (`server/tests/benchmark/capability-probe.ts`): it returns every outcome unchanged, re-throws unchanged, is scoped to the benchmark's acting user so a concurrent real user's turn is never seen, holds a run-scoped in-memory buffer only, and reference-counts install/uninstall so the singleton is restored exactly. Because it observes `handle()` rather than the persisted routed set, it also sees baseline context-only reads and capability-to-capability fan-out — so `capabilityUtilisation.exercised` ("what executed") legitimately differs from `routing.invokedCapabilities` ("what answered the question"); each states its own definition and neither is derived from the other. An unobserved run reports *"not measured"*, never *"nothing ran"*. Adds the `capabilityUtilisation` result field, `questions[].capabilityInvocations`, report §8, and an admin dashboard card. **No question, household, rubric dimension/weight/gate, judge, or per-question score changed** — utilisation is purely descriptive and no band or gate reads it. MINOR, comparison-safe: a `v2.0.0` baseline simply carries no utilisation data. See `docs/implementation/BENCH2C_CAPABILITY_UTILISATION_DASHBOARD.md`. | Yes — MINOR (additive observation panel) |
| `rubric v2.0.0` · `framework v2.0.0` | 2026-07-08 | **BENCH2 — Intelligence Benchmark Hardening.** The benchmark now measures **Intelligence Platform routing accuracy before answer quality.** Root cause (`docs/investigations/INTA1_INTELLIGENCE_PLATFORM_WIRING_AUDIT.md` §6): `fallbackState: "no-route"` was classified as an *honest gap* — the highest-rewarded outcome — so a **completely unwired capability scored 73.3/100 and passed**, and 36 of 100 questions that reached no capability at all scored a mean of 74.3 against 75.0 for questions that did. The platform could not detect its own unwiring. Changes: (a) every question now records its **intended capability**, that capability's **live registry status** (`registered-executable` / `registered-unbound` / `unregistered`), the **capabilities actually invoked**, and **why** routing failed; (b) two new **routing gates** — `R1` capability miss (cap ≤ 40) and `R2` misroute (cap ≤ 55), both below the 70 pass threshold, both distinct from the Tier-A safety gates (SCORING_FRAMEWORK §4.1); (c) gate **G1 (fabrication)** is assigned for the first time, and G2/G4 are now reported as *"not measured"* rather than *"clear"*; (d) **D4 Capability Routing** scores an un-routed turn `0`, not `1`; (e) the report separates **Routing Accuracy · Capability Coverage · Answer Quality · Safety · Hallucination Rate** into five non-averaged panels (§6.1), with Answer Quality measured **only** on questions that reached the intended capability; (f) a run with **no LLM provider** is a release blocker, and a run with **no judge** is a warning. Honest gaps remain fully rewarded **only** where no suitable, executable capability exists. **No question, household, or judge changed. No Intelligence Platform behaviour changed.** MAJOR because the rubric's gate set and D4 ladder re-grade existing questions; `selectBaseline` now requires a matching **rubric** MAJOR as well as a questions MAJOR, so the first BENCH2 run **re-baselines** rather than reporting a −12-point "regression" against a score that was never measuring routing. See `docs/implementation/BENCH2_INTELLIGENCE_BENCHMARK_HARDENING.md`. | **No — MAJOR, re-baseline** |
| `framework v1.1.0` | 2026-07-05 | **INTQ9** — capability-family normalisation hardening. `capabilityFamily()` (`server/tests/benchmark/expectations.ts`) previously only split the fixture's free-form `capability` string on punctuation, producing tokens (`shopping-list`, `product-analysis`, `additive`/`additives`, `nutrition-report`, …) that could never equal a real `TurnResult.outcome.capabilityId` — degrading D4 Capability Routing accuracy and fragmenting the Capability Score report into dozens of one-off rows not aligned to the Capability Registry. It now normalises against `intelligencePlatform.registry`'s own id set (zero duplicated truth), with an explicit, registry-grounded alias table for known fixture shorthand, a discovery-capability redirect (e.g. `nutrition.meal-search` → `nutrition-discovery`), and an honest split of genuinely cross-cutting questions (Companion Platform voice/guidance, Trust & Safety meta-behaviour) into a new, separately-reported non-capability bucket rather than a fabricated pseudo-capability. Adds the optional **Cross-Cutting Scores** report panel (`BENCHMARK_REPORT_TEMPLATE.md` §5) and the `capabilitiesCrossCutting` result field. **No question, household, rubric dimension/weight/gate, or judge changed** — MINOR, comparison-safe per §4 (an additive report panel; existing `capabilities` rows for already-correct families are unaffected). Some per-question D4/composite scores change as a direct, intended result of the accuracy fix (aliased families that now correctly match an already-correctly-reached capability); see `docs/implementation/INTQ9_BENCHMARK_MEASUREMENT_ACCURACY_HARDENING_IMPLEMENTATION.md` for the before/after comparison. | Yes — MINOR (harness/report-shape only) |

> The `questions` component is now **delivered** (INTQ2) and **imported** (INTQ3): the canonical 100 questions live at
> [`questions/THA_COMPANION_BENCHMARK_100_V1.md`](./questions/THA_COMPANION_BENCHMARK_100_V1.md) and are encoded verbatim
> into the executable fixture `server/tests/benchmark/fixtures/companion-benchmark-100.v1.json`. The framework, households,
> rubric, report, and automation remain complete and frozen at `v1.0.0`. All bundle components now resolve; a first scored
> run is produced by executing the runner ([`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md) §2) — not yet performed.

## 5. GLOSSARY

- **Bundle** — the five co-versioned inputs (questions, households, rubric, judge, framework) that fully determine a
  score. See §3.
- **Subject** — the Companion build under test, identified by git commit. Varied across runs; not part of the bundle.
- **Deterministic household** — a fixture persona with a stable ID and fully specified data, seeded fresh before every
  run so the "world" the Companion answers against is identical every time. See [`BENCHMARK_HOUSEHOLDS.md`](./BENCHMARK_HOUSEHOLDS.md).
- **Honest gap** — the platform's correct answer when it does not know or is not permitted: an explicit admission, never
  a fabricated fact. A first-class *positive* outcome in scoring, not a failure. See [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md) §3.
- **Hard-gate** — a scoring rule that can zero a question outright regardless of other dimensions (fabrication, an
  unauthorised or claimed-executed write, a breached dietary hard-constraint, a leaked cross-household fact). See
  [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md) §4.
- **Deterministic tier / Judge tier** — the two scoring layers: machine-checkable assertions first, a fixed-prompt
  LLM judge for the qualitative dimensions second. See [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md) §2.
- **Baseline** — the prior run a new run is compared against, always at a compatible bundle version. See
  [`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md) §4 and [`BENCHMARK_REPORT_TEMPLATE.md`](./BENCHMARK_REPORT_TEMPLATE.md) §6.

## 6. WHAT THIS FRAMEWORK DELIBERATELY DOES NOT DO

- It does **not** contain or author the benchmark questions (canonical, delivered separately).
- It does **not** grade against production data or a real user — only deterministic fixtures, so a score reflects the
  Companion, not the day's data.
- It does **not** measure anything unreachable through `processUserTurn` — no capability is scored by poking it directly.
- It does **not** mutate any real store: write-intent questions are scored on the Companion's **proposal or honest
  refusal**, executed against a disposable seeded database that is torn down after the run (see
  [`BENCHMARK_EXECUTION_PROCESS.md`](./BENCHMARK_EXECUTION_PROCESS.md) §6).
