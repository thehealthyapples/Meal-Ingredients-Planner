# INT16 — Context Compaction Layer

> ## ✅ CLOSED — 2026-07-08. Proof-of-concept SUCCEEDED; superseded by INT17. The code described below is DELETED.
>
> **INT16 proved the concept.** A capability's grounding context can be selected, projected and declared —
> rather than cut at a byte offset — and the result is *valid JSON, balanced across every evidence category,
> honest about what it withheld, and free of clipped entity ids*. Every one of those properties was measured
> here first, on the real 100-question corpus, and every one of them survives today.
>
> **INT17 supersedes INT16 as the governing architecture.** What INT16 could not do was pay for itself: its
> fixed format note cost more tokens than its compaction returned (**+1,854**, §4). INT17 keeps the proven
> properties, adds intent relevance, cross-capability balance, duplicate removal, provenance preservation and a
> real budget, and reverses the sign — **−25,550 exact prompt tokens (−20.6%), 0 questions costing more**
> (independently re-measured in INT18 §3).
>
> **The implementation has been promoted into the canonical Intelligence Platform.** The single owner of every
> byte the model reads as grounding is now the **Context Composition Engine** (`server/intelligence/context/`),
> governed by `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`, designed in
> `docs/implementation/intelligence/INT17_CONTEXT_COMPOSITION_ENGINE.md`, and verified and promoted in
> `docs/implementation/intelligence/INT18_CONTEXT_COMPOSITION_ENGINE_IMPLEMENTATION.md`.
>
> **INT16 is CLOSED and retained as implementation history.** No further work is planned or authorised against
> it. `server/intelligence/conversation/context-compaction.ts` and
> `server/tests/test-intelligence-context-compaction.ts` no longer exist.
>
> INT16's own "known gap" (§8 — its test suite was never registered in `npm test`) is closed by the successor:
> `test:intelligence-context-composition` runs in `npm test` and asserts 105 properties of the engine.
>
> **This document is retained as history, and it earned its place.** Three of its findings were load-bearing for
> INT17 and are cited by it:
>
> - §4 — the honest, exact measurement that compaction **cost +1,854 prompt tokens** rather than saving any.
>   INT17 exists because INT16 measured its own failure instead of claiming its targets.
> - The JSON-vs-pipe-table experiment (`context-compaction.ts` header): a table was ~20% smaller and cost answer
>   quality, because the model cites `"id":1385` far more reliably than a positional cell. INT17 emits JSON for
>   this reason and does not re-run the experiment.
> - §6.2 — the noise floor. Eleven same-subject repeats spanned **1.2 points**, which is why INT17 refuses to
>   claim its +0.4 composite as a result.
>
> Its round-robin balance guarantee, its `_context` honesty block, and its refusal to clip an id all survive
> inside the engine. Its per-capability scope, its fixed format note, and its `total`/`shown`/`omitted`
> bookkeeping did not — the last of these taught the model to fabricate (INT17 §5.2).

> **Status: CLOSED — 2026-07-08. Outcome: proof-of-concept SUCCEEDED, superseded by INT17, promoted via INT18.**
> Was: implemented, measured, never committed. Three of four deterministic targets are met. **"Token reduction"
> is not met** — INT16 costs ~1,854 prompt tokens per full benchmark run (§4). The benchmark is statistically
> flat (§6). This document records what was measured, not what was hoped for — and that discipline is precisely
> why INT17 exists and why it was able to reverse the token result rather than inherit it.

---

## 1. What INT16 changes

Before INT16 the gateway placed a capability's result into the prompt's `CONTEXT DATA` block as a byte prefix:

```ts
const raw = JSON.stringify(outcome.result);
const data = raw.length > 1800 ? raw.slice(0, 1800) + "… [truncated]" : raw;
```

INT16 replaces that with `compactCapabilityContext()`
(`server/intelligence/conversation/context-compaction.ts`):

**SELECT** round-robin across the payload's natural groups → **PROJECT** away empty and derivable fields →
**DECLARE** the true totals in a `_context` block → **EMIT** valid JSON.

The character budget is unchanged at **1,800**. Payloads that already fit are emitted byte-for-byte unchanged,
so compaction's blast radius is exactly truncation's: a turn that was never broken cannot be regressed.

`outcome.result` is never mutated. Compaction affects the **prompt string only**; the full payload continues to
flow to `TurnResult`, to `opportunity-delivery`'s adapter, and to every report/UI surface.

---

## 2. Measurement method

All numbers below come from the **real** 100-question benchmark corpus
(`server/tests/benchmark/fixtures/companion-benchmark-100.v1.json`, checksum
`sha256:a6e66c801a324fffb286f495d0231492`), resolving each utterance through `patternIntentResolver` and
executing each resolved intent through `intelligencePlatform` against user 1.

- **Deterministic phase** — no LLM. Exact character counts, exact id sets, exact group counts.
- **Token phase** — exact `prompt_tokens` from **gpt-4o-mini**, the companion's production model
  (`llm-provider.ts:12`), with the fixed chat scaffold subtracted. `COMPACT_FORMAT_NOTE` is extracted from the
  gateway source by regex, so the measurement cannot drift from the string the gateway actually emits.

**Corpus shape:** 180 capability sections across 100 questions.
**123 fit the budget** (emitted verbatim, 0 bytes changed). **57 are over budget** (compaction fires).

Strategies selected: `verbatim` 123, `generic-sampled` 55, `projected-sampled` 2.

---

## 3. Targets that are MET

### 3.1 Well-formedness — the strongest result

| | BEFORE | AFTER |
|---|---:|---:|
| over-budget sections emitting **parseable JSON** | **0 / 57** | **57 / 57** |
| over-budget sections within the 1,800-char budget | 57 / 57 | 57 / 57 |

Legacy truncation produced syntactically **invalid** JSON on *every single over-budget section*. The model was
handed a broken object 57 times per full benchmark run. This is the defect INT16 most clearly removes, and it
is removed deterministically — no sampling, no LLM, no judgement.

### 3.2 Balanced Food Intelligence evidence

`food-intelligence:report` returns 10 opportunities across 3 types, priority-sorted.

| | types reaching the prompt |
|---|---|
| BEFORE (byte prefix) | `planner-empty-day` **only** |
| AFTER (round-robin) | `planner-empty-day`, `shopping-restriction-conflict`, `pantry-item-unused-in-plan` |

For **both** ND-059 and CG-087: **3 / 3 groups shown, 6 / 10 items**, with `_context` stating the true total of
10. The two categories that actually answer the question previously never reached the model at all — seven
near-identical `planner-empty-day` rows consumed the entire 1,800-char budget.

This is a property of the prompt, verified offline. Whether the model *uses* it is a separate question — see §6.3.

### 3.3 Context size

Over-budget sections only (the 123 verbatim sections are byte-identical before and after):

| | chars |
|---|---:|
| raw payloads | 6,146,894 |
| BEFORE — legacy truncation | 103,341 |
| AFTER — compaction | 99,879 |
| **reduction** | **3,462 (3.4%)** |

Verbatim sections with any byte changed: **0** — the no-regression invariant holds empirically.

---

## 4. Target that is NOT met: token reduction

Exact `prompt_tokens`, gpt-4o-mini:

| | tokens |
|---|---:|
| BEFORE — context, 57 over-budget sections | 29,675 |
| AFTER — context, 57 over-budget sections | 28,295 |
| **context delta** | **−1,380 (4.7% reduction)** |
| | |
| `COMPACT_FORMAT_NOTE` cost (exact, 299 chars) | 66 tokens |
| questions paying the note | 49 |
| **note overhead** | **+3,234** |
| | |
| **NET over the corpus** | **+1,854 → NET INCREASE** |
| net per affected question | **+37.8 tokens** |

**INT16 costs prompt tokens; it does not save them.**

The reason is structural, not a tuning mistake. Legacy truncation already emitted exactly
`1800 + len("… [truncated]") = 1,813` chars for every over-budget section. Compaction packs to the same ceiling
and emits ~1,752. There is only ~4.7% of headroom to recover, and the note that makes `_context` legible costs
more than that headroom returns.

The note is not optional decoration: without it the model reports *the number of items it can see* rather than
the `_context.total`, which converts an honest compaction into a false claim. Emitting it only on turns that
actually contain a compacted section (49 of 90) is already the cheap version.

**Levers, if token reduction is a hard requirement:**

1. Shorten the note (66 tokens → ~30 would roughly halve the overhead, still net-positive cost).
2. Drop the note and accept that the model may quote visible counts instead of true totals.
3. Lower `CAPABILITY_CONTEXT_BUDGET_CHARS` below 1,800 — this is the only lever that actually reduces tokens,
   and it trades directly against evidence breadth.

None of these are free. The honest framing is that INT16 buys **validity and balance**, and **pays for them in
tokens**.

---

## 5. Entity references — aggregate up, one capability down

Ids exposed to the model across the 57 over-budget sections:

| | ids |
|---|---:|
| distinct ids present in the raw payloads | 17,722 |
| BEFORE — surviving truncation | 423 |
| AFTER — surviving compaction | 451 |

Every id emitted by compaction is a **real id from the raw payload** — no clipped id, no invented id. The
invariant holds (a truncated id is a plausible id for a different entity, which is why `clipDeep` and
`clipScalars` refuse to touch `id` / `*Id` fields).

The aggregate hides a per-capability regression:

| capability:verb | n | BEFORE | AFTER | Δ | groups shown/total |
|---|---:|---:|---:|---:|---|
| `analyser:read` | 6 | 72 | 54 | **−18** | 8 / 15 |
| `meal-discovery:search` | 1 | 9 | 8 | −1 | 1 / 1 |
| `meals:search` | 1 | 6 | 5 | −1 | 1 / 1 |
| `pantry:read` | 8 | 80 | 96 | +16 | 5 / 5 |
| `pantry-discovery:search` | 1 | 10 | 24 | +14 | 1 / 1 |
| `shopping:read` | 5 | 40 | 50 | +10 | 10 / 12 |
| `shopping-discovery:search` | 1 | 10 | 18 | +8 | 8 / 8 |
| `food-intelligence:report` | 2 | 12 | 12 | 0 | 3 / 3 |
| `meals:read` | 23 | 184 | 184 | 0 | 2 / 2 |
| `nutrition-knowledge:read` | 9 | 0 | 0 | 0 | 1 / 1 |

**Mechanism.** `analyser:read` groups into **15** groups. `MAX_GROUPS_SHOWN = 8` seats only eight of them, and
`GROUP_ITEM_CAP = 4` then bounds each. Legacy's byte prefix happened to carry 12 ids; compaction carries 9.
Affected questions: SH-042, PR-063, PR-064, PR-068, PR-069, PR-072.

**Materiality.** In the benchmark, PR-063…PR-072 cited **zero** entities both before and after, so their id loss
is inert. Only SH-042 moved (3 → 0 refs in run 1), and its composite was unchanged at 55.0.

This is a tunable, not a design flaw: raising `MAX_GROUPS_SHOWN` for `analyser:read`, or registering an explicit
projection for it, would recover the ids at some token cost.

---

## 6. Benchmark — n = 3

`npm run test:companion-benchmark -- --mode=full --user=1`
(`worldMode: single-world`, hardcoded in `run-benchmark.ts:64` — mode-matched to the 75.7 baseline.)

| run | score | IRA | entityRefs | q w/ refs | halluc | safety gates | routing gates | honest-gap | verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `18-07-10Z` | 75.8 | 0.852 | 140 | 25 | 0% | 0 | 12 | 100% | PARTIAL |
| `18-09-37Z` | 75.6 | 0.852 | 139 | 22 | 0% | 0 | 12 | 100% | PARTIAL |
| `18-12-02Z` | 75.8 | 0.852 | 126 | 25 | 0% | 0 | 12 | 100% | PARTIAL |

**Median 75.8 · mean 75.73 · range 75.6 – 75.8 (spread 0.2)**

### 6.1 Against the baseline

| | score | n |
|---|---:|---:|
| BENCH4 baseline (`12-42-07Z__8b01fff`) | 75.7 | **1** |
| Paired pre-INT16 control (`14-50-26Z__4033a44`) | 75.7 | **1** |
| **INT16 (this work)** | **75.8** (median of 3) | 3 |
| **Δ** | **+0.1** | |

**+0.1 is not a result.** See §6.2.

The paired control deserves emphasis: `4033a44` is the commit the rollback tag `int16-rollback-20260708`
points at — i.e. the pre-INT16 tree *including* BENCH4's resolver matchers. It is therefore a true paired
control for INT16 in isolation, not a proxy. It also scored 75.7.

### 6.2 Variance — why n=3 cannot settle this

The companion runs at **`temperature: 0.3` with no seed** (`conversation-gateway.ts:795`). The judge is
deterministic (`temperature: 0`, and `judgeInvoked: false` — the rubric scorer ran, not an LLM judge). So
**all** run-to-run variance originates in the companion's sampling.

Eleven same-subject repeats on `8b01fff` (15:27–15:47, `worldMode: benchmark-world`) scored:

```
75.7  75.7  75.5  74.6  75.6  75.5  75.7  75.8  75.6  75.5  75.0
```

→ **range 74.6 – 75.8, spread 1.2 points.**

Those eleven runs are *not* a baseline for 75.7 (different world mode, and `actionCount` 1 vs 6 tracks the
difference exactly). They are, however, a legitimate estimate of the **noise floor**, and it is ~1 point.

**Therefore: a 3-run median cannot resolve a ±0.5 difference, and the observed +0.1 is indistinguishable from
zero.** Intent Resolution Accuracy is identical (0.852) across every run because routing is deterministic —
only answer quality moves. Any claim that INT16 "improved the score" would be unsupported by this data.

What the benchmark *does* establish, with n=3:

- **No regression.** 0 hallucinations, 0 safety gates, 100% honest-gap rate, 12 routing gates — all unchanged.
- **No entityRefs regression.** Median 139 refs across 25 questions vs the control's 123 / 22. The earlier
  table-format revision (which scored 120 refs / 18 questions) is not reproduced by the JSON revision.

### 6.3 The Food Intelligence answer did not reliably improve

| run | ND-059 composite / refs | CG-087 composite / refs |
|---|---|---|
| control `14-50-26Z__4033a44` | 74.3 / 0 | 74.3 / 0 |
| INT16 `18-07-10Z` | **81.8 / 5** | 74.3 / 0 |
| INT16 `18-09-37Z` | 74.3 / 0 | 74.3 / 0 |

ND-059 improved in exactly **one of two** runs and was otherwise byte-identical to the control. At
`temperature: 0.3` that is sampling noise, not an effect.

So: the balanced evidence **is deterministically in the prompt** (§3.2, verified offline, 3/3 groups). The model
**does not reliably use it**. Both statements are true and neither should be dropped when summarising INT16.

---

## 7. What INT16 is worth

**Buy:**
- Valid JSON where there was invalid JSON, on 57/57 over-budget sections. Deterministic.
- Every evidence category represented, where a priority prefix silently deleted all but the first. Deterministic.
- `_context` declares what was withheld, so nothing is silently absent. Deterministic.
- No id ever clipped or invented. Deterministic.

**Pay:**
- **+1,854 prompt tokens per full run** (+37.8 per affected question).
- `analyser:read` exposes 9 ids where truncation exposed 12.
- No measurable benchmark score improvement (+0.1, noise floor ~1.0).

The case for INT16 rests on **correctness of the context**, not on the benchmark score and not on token savings.
If it is adopted, it should be adopted on that basis, and the token cost should be accepted explicitly.

---

## 8. Verification

| check | result |
|---|---|
| `tsx server/tests/test-intelligence-context-compaction.ts` | **84 passed, 0 failed** |
| source tree hash, pre- and post-benchmark | `bc4c2c4b…` unchanged |
| INT16 source hashes, 4 rounds | unchanged |
| benchmark history | append-only; 82 committed index entries preserved verbatim, 0 mutated, 0 deleted |
| rollback tag `int16-rollback-20260708` | → `4033a44` "INT16 pre-implementation snapshot" (no `context-compaction.ts`) |

**Known gap:** `test-intelligence-context-compaction.ts` is **not registered in `package.json`**, so `npm test`
never runs its 84 assertions. Registering `test:intelligence-context-compaction` belongs in the INT16 commit.

**Pre-existing inconsistency (not caused by INT16):** `2026-07-08T14-19-37Z__8b01fff.json` exists on disk but has
no `index.json` entry (29 artifacts on disk, 28 indexed for that day).
