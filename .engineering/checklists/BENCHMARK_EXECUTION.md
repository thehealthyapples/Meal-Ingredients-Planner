# Checklist — Benchmark Execution

The **mechanics** of a benchmark run are owned by
[`docs/intelligence/benchmark/BENCHMARK_EXECUTION_PROCESS.md`](../../docs/intelligence/benchmark/BENCHMARK_EXECUTION_PROCESS.md)
(preconditions, seeding, determinism contract, teardown, outputs). This checklist
does not restate it. It covers the **engineering discipline** around a run: not
how to execute one, but how not to lie about the result.

Ownership of benchmark artefacts is governed by
[`../../docs/implementation/governance/ARCH_BENCHMARK_OWNERSHIP_RULE.md`](../../docs/implementation/governance/ARCH_BENCHMARK_OWNERSHIP_RULE.md).

## Before the run

- [ ] Read the execution process document. Preconditions met.
- [ ] `git status` reported. Note the commit — a benchmark result is meaningless
      without the SHA it ran against.
- [ ] Rollback tag created if the run will write artefacts or seed data.
- [ ] Confirmed the run targets **benchmark households**, never production data.
- [ ] Determinism contract understood: same inputs, same commit, same result.

## Running

- [ ] Run recorded against a **named commit SHA**, not "latest".
- [ ] Executed via a sanctioned entry point:
      - `npm run test:companion-benchmark` — the benchmark run
      - `npm run test:companion-benchmark:validate` — validates the bundle
      - `npm run test:benchmark-routing` / `test:benchmark-utilisation` — integrity
- [ ] Long run? The session run file records `Current activity` and a `Next action`
      that assumes interruption mid-run.
- [ ] Teardown performed per the execution process. No seeded state left behind.

## Interpreting the result

- [ ] **A score is an observation, not an achievement.** Report what was measured.
- [ ] Compared against the previous run in `docs/intelligence/benchmark/history/`
      — and the comparison names both commits.
- [ ] A regression is reported as a regression. Do not re-run until it passes and
      report only the passing run.
- [ ] Variance from non-determinism separated from genuine movement. If the run is
      not deterministic, say so — that is itself the finding.
- [ ] No score is quoted without the household set and question set it came from.

## Trust check — the ones that matter here

- [ ] Did I change anything to make the number better, other than the capability
      being measured?
- [ ] Is the benchmark measuring what I claim it measures, or what is easy to measure?
- [ ] Is any figure in the report estimated rather than read from the run output?
- [ ] Are failed or excluded questions disclosed, with counts?

## Close

- [ ] Artefacts written to `docs/intelligence/benchmark/history/` per the
      ownership rule. Never to the repository root.
- [ ] Report cites the run artefact by filename.
- [ ] Local commit made; SHA, branch, and rollback ID reported.
- [ ] Session closed.
