# THA Companion Benchmark — Execution Process

**Status:** GOVERNING FRAMEWORK — the authoritative process for how one benchmark run happens.
**Part of:** [`README.md`](./README.md) (framework index, the one invariant, versioning).
**Reads scoring from:** [`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md).
**Reads the world from:** [`BENCHMARK_HOUSEHOLDS.md`](./BENCHMARK_HOUSEHOLDS.md).
**Automated by:** [`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md).

---

## 1. THE RUN, IN ONE PICTURE

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 0. RESOLVE BUNDLE   pin questions@v, households@v, rubric@v, judge@v,    │
  │                     framework@v   +   record subject commit             │
  └───────────────────────────────┬────────────────────────────────────────┘
                                  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. PROVISION        disposable seeded database (never a real store)      │
  └───────────────────────────────┬────────────────────────────────────────┘
                                  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 2. SEED HOUSEHOLDS  seed all six deterministic households to fixed IDs   │
  │                     (BENCHMARK_HOUSEHOLDS.md seed contract)              │
  └───────────────────────────────┬────────────────────────────────────────┘
                                  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 3. FOR EACH QUESTION (deterministic order):                             │
  │      a. reset conversation state for its household (fresh thread)        │
  │      b. call conversationGateway.processUserTurn(user, utterance, …)     │
  │      c. capture the full TurnResult + timing + any thrown error          │
  │      d. run DETERMINISTIC-tier assertions (machine-checkable)            │
  │      e. run JUDGE-tier scoring (fixed prompt, temp 0) where required     │
  │      f. apply HARD-GATES → per-question score                            │
  └───────────────────────────────┬────────────────────────────────────────┘
                                  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 4. AGGREGATE       roll up to dimension / capability / household /       │
  │                     headline scores; compute honest-gap + safety panels  │
  └───────────────────────────────┬────────────────────────────────────────┘
                                  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 5. COMPARE         diff against the compatible baseline run              │
  └───────────────────────────────┬────────────────────────────────────────┘
                                  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 6. EMIT            result.json (machine) + report.md (human)            │
  │    TEARDOWN        drop the disposable database                         │
  └────────────────────────────────────────────────────────────────────────┘
```

Steps 1–6 are identical whether a human runs them by hand or the harness runs them on a schedule. The harness is just an
automation of this exact process — see [`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md).

## 2. PRECONDITIONS

A run must not start unless **all** of the following hold. The harness asserts each and aborts (non-zero exit,
`status: "aborted"` artefact) on the first failure — an aborted run is **never** recorded as a scored result.

1. **Bundle resolves.** Each of `questions`, `households`, `rubric`, `judge`, `framework` pins to an exact version, and
   the five are mutually compatible under the versioning rules ([`README.md`](./README.md) §4). A `pending` questions
   component (the canonical 100 not yet delivered) is a hard abort — there is nothing to score.
2. **Subject is pinned.** The Companion build under test is a clean, identified git commit (no dirty working tree, or the
   dirty state is explicitly recorded in the artefact and flagged `subjectDirty: true` so the result is never treated as
   a release baseline).
3. **Database is disposable.** The target database is confirmed **not** to be a production or shared store (guarded by an
   explicit benchmark-only connection string / env, see §6). The benchmark refuses to run against anything it did not
   provision.
4. **Judge is reachable and pinned.** The judge model id and the frozen judge prompt hash match the bundle's `judge`
   version. A judge mismatch is a hard abort — silently scoring with a different judge would corrupt history.
5. **One Companion, unmodified.** The subject exposes `conversationGateway.processUserTurn` as its only invoked seam. The
   harness does not import capability handlers, the intent engine, or the permission model directly (enforced by the
   runner's import surface, [`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md) §2).

## 3. STEP 2 — SEEDING THE HOUSEHOLDS

The six deterministic households ([`BENCHMARK_HOUSEHOLDS.md`](./BENCHMARK_HOUSEHOLDS.md)) are seeded to their **fixed
IDs** into the freshly-provisioned database using the platform's **existing** stores and insert paths — the same
`households` / `household_members` / `household_eaters` / profile / pantry / diary / meals / templates / partners writes a
real onboarding would use. The benchmark **does not** invent a parallel schema or a second household identity space; a
benchmark household *is* an ordinary household that happens to have frozen contents.

Seeding is **idempotent and total**: every run starts from the same empty database and produces byte-identical fixture
rows (fixed IDs, fixed timestamps expressed relative to the run's frozen `benchmarkClock` — see §5). If any fixture row
differs from the seed contract's expected checksum, the run aborts: a drifted world would silently invalidate every
score.

## 4. STEP 3 — EXECUTING ONE QUESTION

Each of the 100 questions carries, in the canonical set, at least: an `id`, the `utterance`, the `householdId` it runs
against, and the acting `userId` within that household. For each question, in the canonical deterministic order:

1. **Isolate.** Start a **fresh conversation thread** for the question's user so no prior question's turn leaks into
   context. Multi-turn questions (if the canonical set contains any) declare their turns explicitly and share one thread
   for exactly those turns; every other question is single-turn and independent.
2. **Invoke the one seam.** Call `conversationGateway.processUserTurn(userId, utterance, …)` with the frozen
   `benchmarkClock` as the turn's clock. This is the **only** call the benchmark makes into the Companion.
3. **Capture everything.** Record the complete `TurnResult` — `text`, `outcome`, `discoveries`, `guidance`,
   `guidanceKind`, `enrichment`, `actions`, `fallbackState`, `entityRefs`, `conversationId`, `threadId` — plus wall-clock
   latency and any thrown error (a throw is itself a scored outcome: an internal-error fallback that the platform failed
   to convert into an honest gap).
4. **Score.** Hand the captured turn and the question's expectations to the two-tier scorer
   ([`BENCHMARK_SCORING_FRAMEWORK.md`](./BENCHMARK_SCORING_FRAMEWORK.md)): deterministic assertions first, judge second,
   hard-gates last. The scorer returns a per-dimension vector, the applied gates, and the composite per-question score.

The Companion's own runtime randomness is **not** the benchmark's concern to eliminate at the seam — but the benchmark
**controls every input it can**: fixed clock, fixed household data, fixed thread isolation, temperature-0 judge. Residual
non-determinism in the subject (e.g. an LLM-backed capability) is measured, not hidden — see §5.

## 5. DETERMINISM CONTRACT

Reproducibility is a first-class requirement: two runs of the **same bundle against the same subject** must produce the
**same score**, or the difference must be explainable and bounded.

- **Frozen clock.** The run pins a single `benchmarkClock` timestamp (default: the bundle release date, `2026-07-04T00:00:00Z`
  for `v1.0.0`). Every seeded timestamp and every turn's "now" derives from it, so "what did I eat this week" is a fixed
  question with a fixed answer.
- **Fixed order.** Questions run in canonical id order; households seed in the order declared in
  [`BENCHMARK_HOUSEHOLDS.md`](./BENCHMARK_HOUSEHOLDS.md). Order is part of the frozen process.
- **Temperature-0 judge.** The judge is called at temperature 0 with a frozen prompt; its scores are treated as
  deterministic. The judge model id is pinned in the bundle.
- **Subject non-determinism is surfaced, not suppressed.** If the subject contains a genuinely non-deterministic capability,
  the harness supports an optional `repeats: N` mode ([`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md) §5): each
  question is executed N times, and the report shows both the mean score **and** the score variance per question. A high
  variance is itself a finding (an unstable Companion), never quietly averaged away. Default `repeats: 1`.

## 6. SAFETY, ISOLATION, AND TEARDOWN

- **Disposable database only.** The run provisions its own database (or an isolated schema) from a benchmark-only
  connection string. It asserts the target is not production before seeding (§2.3) and **drops it on teardown**, pass or
  fail. No benchmark run may leave state behind.
- **Writes are proposed, never executed against anything real.** A write-intent question is answered by the platform's
  normal path: `detectWriteIntent` short-circuits to an honest gap, or the turn produces a **Companion Action proposal**
  (`TurnResult.actions`) requiring confirmation. The benchmark scores the **proposal or the honest refusal** and
  **never confirms it** — the confirmation seam is out of scope for scoring. Any state a proposal *would* mutate lives
  only in the disposable database and dies at teardown.
- **No external side effects.** The benchmark performs no outbound calls except the pinned judge; it sends nothing to any
  real user, partner, or third-party service.

## 7. OUTPUTS OF A RUN

A completed run emits exactly two artefacts, both stamped with the full bundle version and subject commit:

| Artefact | Audience | Defined by |
|---|---|---|
| `result.json` | Machines — history, CI gate, comparison | [`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md) §3 (schema) |
| `report.md` | Humans — review, sign-off | [`BENCHMARK_REPORT_TEMPLATE.md`](./BENCHMARK_REPORT_TEMPLATE.md) |

Both are written into the run's history location ([`BENCHMARK_AUTOMATION.md`](./BENCHMARK_AUTOMATION.md) §4). A run that
aborted in preconditions emits only an `aborted` `result.json` with the failing precondition and **no** score — it never
pollutes the history of scored runs.

## 8. RUNNING IT BY HAND (checklist)

For a human executing a run outside the harness — e.g. while debugging a regression — the process is the same seven
steps. The checklist:

```
BENCHMARK RUN CHECKLIST
=======================
☐ Bundle pinned and compatible; questions component is NOT `pending`
☐ Subject commit recorded; working tree clean (or subjectDirty flagged)
☐ Target DB confirmed disposable (benchmark-only connection)
☐ Judge model id + prompt hash match bundle `judge` version
☐ Six households seeded to fixed IDs; fixture checksum matches
☐ Each question run through processUserTurn on a fresh thread, frozen clock
☐ Deterministic assertions + judge + hard-gates applied per question
☐ Aggregated; compared against compatible baseline
☐ result.json + report.md emitted; disposable DB dropped
```
