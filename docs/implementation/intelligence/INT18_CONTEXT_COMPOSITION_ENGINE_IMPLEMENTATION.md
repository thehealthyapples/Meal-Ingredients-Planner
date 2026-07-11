# INT18 — Context Composition Engine: Promotion to Canonical, and Independent Verification

> **Status: COMPLETE.** The Context Composition Engine is the **single owner of every byte of LLM grounding
> context** in THA. INT16 is **CLOSED**. Every measurement target in the objective was **re-measured from
> scratch by this workstream**, not inherited from INT17's report — and the two agree to within 0.1% on the
> headline token figure.
>
> **−25,550 exact `prompt_tokens` (−20.6%), 0 of 69 questions costing more. Benchmark 76.1 vs 75.7 baseline,
> 0 hallucinations, 0 hard gates. 0 fake or clipped ids of 734. 0 provenance values lost of 80.**
>
> **Three properties INT17 did not disclose are recorded here in §6.** The largest — enrichment reaches the model
> on 20 of the 56 turns that previously carried it — is a real cost, is permitted by the governing architecture,
> and is now declared in it.

**Classification:** Intelligence Governance → Context Composition (`server/intelligence/context/`)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Subject:** HEAD `8b01fff` + uncommitted BENCH4 resolver matchers + the INT17 engine
**Governing document:** `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`
**Design record:** `docs/implementation/intelligence/INT17_CONTEXT_COMPOSITION_ENGINE.md`
**Closes:** `docs/implementation/intelligence/INT16_CONTEXT_COMPACTION_LAYER.md`

---

## 0. ROLLBACK — created before any file was modified

`git status` was confirmed **dirty** first. The tree carried BENCH4's uncommitted resolver matchers, the entire
uncommitted INT17 engine (`server/intelligence/context/`, untracked) and its untracked test suite. A tag on
`HEAD` alone would have restored **none** of it.

| Identifier | Object | Restores |
|---|---|---|
| **`int18-rollback-20260708`** | `dcba3d1` | The complete pre-INT18 working tree, tracked **and untracked** (2,711 files) |

```bash
git show --stat int18-rollback-20260708      # inspect
git checkout int18-rollback-20260708 -- .    # restore everything
```

Built through a temporary `GIT_INDEX_FILE`, so the real index was never touched — verified by comparing
`git write-tree` before and after: **`ca15ff42…` both times.** `.gitignore` was honoured (`git add -A`, not
`-f`), so `node_modules` is absent from the snapshot: **0 paths.**

The prior tag `int17-rollback-20260708` → `11196b8` remains valid and restores the tree *before* the engine existed.

---

## 1. What INT18 changed

**No production code was changed.** INT17's engine was already correct, already the only pipeline, and already
wired into the gateway. INT18's job was to *prove* that — independently — and to close the workstream it replaced.

| File | Change |
|---|---|
| `docs/implementation/intelligence/INT16_CONTEXT_COMPACTION_LAYER.md` | **CLOSED.** Records that the proof-of-concept succeeded, that INT17 supersedes it as governing architecture, that the implementation is promoted into the canonical platform, and that the document is retained as history. |
| `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` | §8 gains **open item 8** — the enrichment/budget interaction measured in §6.1, previously undisclosed. Header now points at both implementation records and both rollbacks. |
| `docs/implementation/intelligence/INT18_CONTEXT_COMPOSITION_ENGINE_IMPLEMENTATION.md` | This document. |

Deliberately **not** done, per the objective and per the architecture's §7 non-negotiables:

- `CAP_DATA_MAX_CHARS` **not changed**. `1_800` at HEAD `8b01fff`; `1_800` today, re-homed as
  `CAPABILITY_CONTEXT_BUDGET_CHARS`. Verified by reading both trees.
- **Capability Registry not changed.** `git diff HEAD` touches no registry, capability, handler, port or binding.
- **No second context pipeline introduced.** Verified in §2.
- `CONTEXT_TOKEN_BUDGET` **not raised**, despite §6.1. Raising an allowance as a "fix" is a named hard stop.

---

## 2. The engine is the only LLM context pipeline

| Check | Method | Result |
|---|---|---|
| Exactly one composer exists | `grep -rn "composeContext" server/ --include=*.ts` | 1 definition, **1 caller** (`conversation-gateway.ts:705`) |
| Legacy truncation is gone | `grep -rn "slice(0, *1800)\|\[truncated\]" server/` outside tests | 0 live call sites; the only matches are the engine's own comparison metric and a comment naming the defect |
| `capData` is gone | `git diff HEAD -- conversation-gateway.ts` | the `Record<string,string>` prompt buffer and its `.map(...).join()` are deleted |
| INT16's layer is gone | filesystem | `context-compaction.ts` and `test-intelligence-context-compaction.ts` do not exist |
| No other module writes grounding | `grep -rn "CONTEXT DATA" server/ --include=*.ts` | only the gateway's own prompt header; the block itself comes from `composition.text` |
| Context Views are declarative | `CONTEXT_VIEW_SPECS` | exactly **2** (`profile:read`, `food-intelligence:report`); 21 capabilities use generic derivation |

**The gateway hands over Full Results and receives a string.** `queryCapability` no longer decides anything about
the prompt.

---

## 3. Method — how these numbers were produced

INT17's measurement harness was not preserved, so **every number below was re-measured by a harness built for
this workstream**. Nothing in this section is copied from INT17.

Two trees, one probe:

- **BEFORE** — a `git worktree` at HEAD `8b01fff` (genuine legacy truncation: `raw.slice(0, CAP_DATA_MAX_CHARS)
  + "… [truncated]"`, sections joined from a `Map`), with the *working tree's* `pattern-intent-resolver.ts`
  copied in so `food-intelligence` is reachable in **both** trees. Without this the comparison would credit the
  engine with BENCH4's routing fix.
- **AFTER** — the main tree, Context Composition Engine.

The probe drives the **real `ConversationGateway`** over all 100 corpus questions
(`companion-benchmark-100.v1.json`) as user 1, against the **real database**, and captures the system prompt
verbatim from an injected `ILlmProvider`. Controls, so the *only* difference between the two prompt sets is the
CONTEXT DATA block and the format note:

- a fresh `InMemoryConversationStore` per question → conversation history is always empty, identically in both trees;
- a stub provider returning a **fixed** canned response → assistant turns can never diverge;
- no writes to conversation tables.

**69 of 100 questions reach the LLM — the same 69 in both trees.** The other 31 are gated, fall back, or return no data.

Exact token counts come from **gpt-4o-mini** (`llm-provider.ts`, the production model): each captured
`(system, user)` pair submitted with `max_tokens: 1`, reading `usage.prompt_tokens`. 138 calls. Nothing estimated.

A second harness injects a recording `handleIntent` into the real gateway, capturing **the exact Full Results the
gateway passed to `composeContext`**, and checks the emitted text against them. That is the ground truth for
entity and provenance preservation — not the engine's own self-report.

> **Scope note, stated because it changes the denominators.** Because the probe suppresses conversation history,
> the absolute prompt totals here are smaller than INT17's (124,170 vs 130,714 BEFORE). The *delta* is the
> measurement that matters and it is essentially identical: **−25,550** here, **−25,576** in INT17 — 0.1% apart,
> two independent harnesses. Section counts likewise differ from INT17's (149 capability sections across the 69
> LLM-reaching turns, vs INT17's 180 across all 100 questions).

---

## 4. Results — every measure the objective named

### 4.1 Context reduction

| | BEFORE | AFTER | Δ |
|---|---:|---:|---:|
| CONTEXT DATA block, all 69 LLM-reaching turns | 232,523 | 120,463 | **−48.2%** |
| capability sections only (enrichment excluded) | 216,488 | 112,417 | **−48.1%** |
| format note added | 0 | +18,666 chars on 54 turns | — |
| **net, context + note** | 232,523 | 139,129 | **−40.2%** |
| questions whose context **grew** | — | **0** | |

Independently, the engine's own `metrics` over all **88 data-bearing turns** (including the 19 that never reach
the LLM): legacy **249,141** → composed **120,101** chars, **−51.8%**. 65 duplicate evidence items merged,
440 group-constant field hoists.

**Where the bytes were.** `profile` was **44.8% of every BEFORE context byte** — injected as a surface baseline
read on turn after turn at a mean of **1,484 chars**. It now costs **289**.

| capability | n | BEFORE chars | AFTER chars | Δ |
|---|---:|---:|---:|---:|
| `profile` | 69 | 102,396 | 19,934 | **−81%** |
| `meals` | 24 | 43,512 | 32,511 | −25% |
| `nutrition-knowledge` | 15 | 19,365 | 17,017 | −12% |
| `pantry` | 8 | 14,504 | 12,707 | −12% |
| `analyser` | 6 | 10,878 | 10,650 | −2% |
| `shopping` | 6 | 7,954 | 6,459 | −19% |
| `food-intelligence` | 2 | 3,626 | 3,138 | −13% |
| `meal-discovery` | 2 | 3,453 | 1,239 | −64% |
| `household` | 8 | 2,272 | 2,752 | **+21%** |
| *(9 further capabilities)* | | | | |

`household` **grows**. It is not a defect — see §6.3.

### 4.2 Token reduction and prompt token usage

Exact `prompt_tokens`, gpt-4o-mini, 69 LLM-reaching questions:

| | tokens |
|---|---:|
| BEFORE — legacy truncation | **124,170** |
| AFTER — Context Composition Engine | **98,620** |
| **DELTA** | **−25,550 (−20.6%)** |
| mean per question | 1,800 → **1,429** |
| **questions costing MORE tokens** | **0 / 69** |
| questions costing the same | 0 / 69 |

Every single question got cheaper. INT16, the experiment this replaces, cost **+1,854** tokens over the corpus by
its own honest measurement. **The direction is reversed, not merely improved.**

### 4.3 Entity preservation

Ground truth: every id emitted in the composed text, checked against the ids present in the raw Full Result the
gateway actually passed in.

| | result |
|---|---|
| entity ids emitted across the corpus | **734** |
| **fake or clipped ids** | **0** |
| distinct entity refs visible in the prompt | 204 → **224** |
| Full Results mutated by composition | **0** |

`clipDeep` never touches `id`, `*Id` or `slug`; the emptiness rule never drops them; the hoisting rule never
lifts them off a row. Verified, not assumed.

### 4.4 Provenance preservation

| | result |
|---|---|
| provenance values (`owningDomain`, `source`, `sources[]`) in the raw payloads | 80 |
| **lost in emission** | **0** |
| provenance keys visible in the prompt | 62 → **79** |

Provenance is relocated for economy — section-level into `_context.sources`, group-constant into
`_context.<collection>.shared` — and **never discarded**.

### 4.5 Evidence preservation, well-formedness, balance, determinism

| | BEFORE | AFTER |
|---|---:|---:|
| capability sections emitted | 149 | **149** |
| capability sections **lost** | — | **0** |
| sections that **parse as JSON** | **93 / 149** | **149 / 149** |
| turns where `capabilitiesRepresented ≠ capabilitiesContributing` | — | **0 / 88** |
| `food-intelligence` evidence groups reaching the model | 1 / 3 | **3 / 3** |

**Legacy handed the model syntactically invalid JSON on 56 of 149 sections.** Every one of those is now well-formed.

**Determinism.** The full corpus was composed twice, end-to-end through the real gateway, and the 69 prompts
byte-compared: **0 differences.** No `Date.now`, no `Math.random`, no unordered iteration in the engine. The
pre-INT17 prompt varied run-to-run because section order came from a `Map` filled inside `Promise.all` — meaning
every prompt-content claim made before INT17, *including INT16's*, was measured against a moving target.

### 4.6 Latency

| | value |
|---|---|
| `composeContext` alone — mean | **7.7 ms** |
| `composeContext` alone — median | **5.5 ms** |
| `composeContext` alone — worst turn | **37.6 ms** |
| benchmark mean end-to-end turn | ~1,300–1,900 ms (LLM-dominated, network noise) |

The engine costs well under 1% of a turn. In-process turn latency with the LLM stubbed rose from a 22 ms to a
39 ms median; that 17 ms envelope contains the engine's 7.7 ms mean and process-level variance, and is invisible
against a real turn.

### 4.7 Benchmark — no regression, at materially lower prompt cost

`npm run test:companion-benchmark -- --mode=full --user=1`, `worldMode: single-world`, judge tier off.

| run | score | IRA | entityRefs | q w/ refs | halluc | hard gates | routing gates | honest-gap | verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| BENCH4 baseline (legacy, n=1) | 75.7 | 0.852 | 121 | 23 | 0% | 0 | 12 | 100% | PARTIAL |
| INT16 (compaction) | 75.8 | 0.852 | 140 | 25 | 0% | 0 | 12 | 100% | PARTIAL |
| INT17 run 1 | 76.1 | 0.852 | 163 | 31 | 0% | 0 | 12 | 100% | PARTIAL |
| INT17 run 2 | 76.2 | 0.852 | 173 | 32 | 0% | 0 | 12 | 100% | PARTIAL |
| INT17 run 3 | 76.1 | 0.852 | 164 | 30 | 0% | 0 | 12 | 100% | PARTIAL |
| **INT18 confirmation** | **76.1** | **0.852** | **153** | **31** | **0%** | **0** | **12** | **100%** | **PARTIAL** |

Artefact: `docs/intelligence/benchmark/history/2026-07-08T20-25-00Z__8b01fff.{json,report.md}`

**The +0.4 over baseline is NOT claimed as a result.** INT16 §6.2 established the noise floor by running identical
code eleven times: **spread 1.2 points**. A single run cannot resolve ±0.5, and the baseline is n=1. Intent
Resolution Accuracy is identical (0.852) in every run because routing is deterministic and untouched.

What the benchmark **does** establish: **no regression in any safety or honesty measure** — 0 hallucinations,
0 hard safety gates, 100% honest-gap rate, the same 12 routing gates on the same 12 questions, verdict unchanged
— while the prompt that produced it costs **20.6% fewer tokens**. And `entityRefs`, what the model actually
cites, is **121 → 153**, with 23 → 31 questions carrying any reference at all.

---

## 5. INT16 is closed

`docs/implementation/intelligence/INT16_CONTEXT_COMPACTION_LAYER.md` now records, at the top of the document:

1. **INT16 successfully proved the concept.** Valid JSON, round-robin balance across evidence categories, an
   honest `_context` declaration, and no clipped ids — all measured first in INT16, all alive in the engine today.
2. **INT17 supersedes INT16 as the governing architecture.**
3. **The implementation has been promoted into the canonical Intelligence Platform** — `server/intelligence/context/`.
4. **INT16 is CLOSED**, retained as implementation history. No further work is authorised against it.

INT16's own "known gap" — that its 84-assertion suite was never registered in `npm test` — is closed by its
successor: `test:intelligence-context-composition` is registered in `package.json`'s `test` script and asserts
**105** properties of the engine.

INT16 earned its closure by measuring its own failure (`+1,854` tokens) instead of claiming its target. Three of
its findings are load-bearing for INT17 and are cited by it: that exact token measurement; the JSON-vs-pipe-table
experiment; and the ~1.2-point benchmark noise floor that this document also refuses to spend.

---

## 6. Three properties INT17 did not disclose

All three were found by measurement, not review. None violates a §7 non-negotiable. All three are now in the
governing document or here.

### 6.1 The global token budget binds almost nothing — except enrichment, which it starves

`CONTEXT_TOKEN_BUDGET = 600` tokens ≈ **2,100 chars**, which is *smaller than two per-capability ceilings*
(2 × 1,800). So on any turn with two substantial sections, the **guaranteed core alone exhausts the global budget**:

> the guaranteed core exceeded the token budget on **47 of 88** data-bearing turns.

That is `metrics.budgetExceeded` doing exactly what §4.6 promises — the balance guarantee outranks the budget, and
the engine says so rather than silently dropping a category of evidence. But the consequence is that the only
discretionary content the budget can actually bind is **enrichment**, which is spent last:

| | BEFORE (legacy, unbudgeted) | AFTER |
|---|---:|---:|
| turns carrying enrichment | 56 | **20** |
| enrichment bullets | 85 | **35** |
| enrichment chars | 11,899 | 5,170 |

This is **budget starvation, not de-duplication**: on **33 of the 36** turns that lose enrichment entirely, the
capability evidence already occupies within 120 chars of the whole 2,100-char budget (median 2,032). The legacy
gateway emitted every enrichment item with no budget at all.

The prompt's **WEAVE ENRICHMENTS** rule therefore has nothing to weave on roughly two-thirds of the turns that
previously carried enrichment. It costs no benchmark score and it reduces bytes crossing the grounding boundary
(INTA1 §8.3), so it is defensible — but it was undeclared, and a silent reduction in what the model is shown is
exactly the class of thing this engine exists to make explicit. **Raising the budget is a named hard stop**, so
INT18 declares the trade rather than "fixing" it: architecture §8, new open item 8.

### 6.2 The engine's own honesty flag fires on the majority of turns

`budgetExceeded` on 47/88 turns is not a bug — but a flag that fires more often than not is a flag no reader will
credit. Either the budget should be a number the core can usually live within, or `budgetExceeded` should be
renamed to say what it means: *"the guarantee outranked the budget, as designed."* Recorded, not changed.

### 6.3 INT16's verbatim-passthrough invariant is gone

INT16 guaranteed that a payload already under 1,800 chars was emitted **byte-for-byte unchanged** — "a turn that
was never broken cannot be regressed." The Context Composition Engine does not preserve this, and cannot: §4.8
requires `_context` on every section so the model can never mistake examples for totals.

Of the **93** sections that already fit the budget under legacy truncation:

| | count |
|---|---:|
| emitted byte-identical | **0** |
| reshaped smaller | 78 |
| reshaped larger | **15** (+880 chars total) |

`household` is the visible case (+21%, §4.1): a 284-char payload becomes 344 because `_context` declares
`{"members":{"found":2,"shared":{"all":{"status":"active"}}}}`. No section carries a `_context` containing only
`{from}` — the metadata always states something true and non-derivable. And the trade is settled by §4.2: across
the corpus, **0 of 69 questions cost more tokens**. The invariant changed; the outcome did not.

---

## 7. Remaining work (not INT18)

Carried forward from INT17 §7 and architecture §8, unchanged, plus one new:

1. **`nutrition-knowledge:read scope=foods` needs a Context View.** It returns the entire 611-food registry as
   grounding. It is reference data, not evidence about the user, and it crowds the guaranteed core — the CB-022
   regression INT17 recorded in its §6.3.
2. **Migrate capabilities to own their Context View.** Twenty-one still use generic derivation. The seam exists
   and the engine cannot tell the difference, so each migration is a pure move.
3. **`CHARS_PER_TOKEN = 3.5` is an estimator, not a tokenizer** — ~5% conservative on average, but up to ~4% of
   overrun on a dense block.
4. **`analyser:read` has 15 groups; `MAX_GROUPS_SHOWN` seats 8.**
5. **Enrichment is free text, budgeted last, and starved (§6.1).** Give it a reserved floor, make it a Context
   View so it can be ranked rather than truncated by arrival order, or accept the trade. Currently: accept-and-declare.
6. **The judge tier is hardcoded off** (INTA1 §6.4). 68 of 100 weight points are deterministic proxies, so every
   answer-quality number here is a **lower bound** — and INT17 §6.3 showed the proxy actively penalising a
   correctness fix (PL-025, whose answer became true and lost a D1 band for citing no id).
7. **The legacy baseline is n=1.** A 3-run legacy baseline would cost ~6 minutes and would strengthen every
   comparison in §4.7.

---

## 8. Verification

| Check | Result |
|---|---|
| `git status` before any modification | **dirty** — snapshot rollback created first; real index verified untouched (`ca15ff42…` before and after) |
| Rollback identifier | **`int18-rollback-20260708` → `dcba3d1`** (tracked + untracked, 2,711 files, 0 `node_modules` paths) |
| `npx tsc --noEmit` | **178 errors — identical to the pre-existing count** (INTA1 §1.3). **0 in `server/intelligence/context/`** |
| `test:intelligence-context-composition` | **105 passed, 0 failed** — and registered in `npm test` |
| Determinism | full corpus composed twice through the real gateway; **69 prompts, 0 byte-differences** |
| Full Result mutation | **0** — `JSON.stringify` equality before/after composition, per capability, per turn |
| Fake or clipped ids | **0 / 734**, checked against the raw Full Results the gateway passed in |
| Provenance lost | **0 / 80** |
| Capability sections lost | **0** (149 → 149) |
| Well-formed JSON | **149 / 149** (was 93 / 149) |
| Per-capability ceiling | `CAPABILITY_CONTEXT_BUDGET_CHARS` = `1_800` = HEAD's `CAP_DATA_MAX_CHARS` |
| Capability Registry | **unchanged** — `git diff HEAD` touches no registry, capability, handler, port or binding |
| Second context pipeline | **none** — 1 definition, 1 caller; legacy truncation deleted |
| Exact prompt tokens | **124,170 → 98,620 (−25,550, −20.6%)**, 0 of 69 questions costing more |
| Benchmark | **76.1**, 0 hard gates, 0 hallucinations, 100% honest-gap, 12 routing gates, PARTIAL (all unchanged vs baseline) |
| Benchmark history | append-only (newest-first): all **82** previously committed index entries present, **0 mutated, 0 deleted** |

---

## 9. Definition of Done

| Requirement | Status | Evidence |
|---|---|---|
| INT17 fully implemented | ✅ | `server/intelligence/context/` — 3 modules, 105 assertions, 0 tsc errors; engine wired at `conversation-gateway.ts:705` |
| Context Composition Engine is the only LLM context pipeline | ✅ | §2 — 1 definition, 1 caller, legacy truncation and `capData` deleted, INT16's layer deleted, no other module writes grounding |
| Existing capability business logic unchanged | ✅ | `git diff HEAD` touches no capability, handler, port or binding |
| Capability Registry unchanged | ✅ | no registry file in the diff |
| `CAP_DATA_MAX_CHARS` unchanged | ✅ | `1_800` at HEAD, `1_800` today, re-homed |
| No second context pipeline | ✅ | §2 |
| INT16 formally closed | ✅ | §5 — proof-of-concept succeeded, superseded, promoted, CLOSED, retained as history |
| Context reduction | ✅ | **−48.2%** CONTEXT DATA chars; **−40.2%** net of the format note; **−51.8%** on the engine's own metrics |
| Token reduction | ✅ | **−25,550 exact `prompt_tokens` (−20.6%)** |
| Entity preservation | ✅ | **0 fake or clipped ids of 734**; prompt-visible refs 204 → 224 |
| Provenance preservation | ✅ | **0 of 80 provenance values lost**; keys visible 62 → 79 |
| Benchmark score | ✅ | **76.1** vs 75.7 baseline; 0 hallucinations, 0 hard gates, verdict unchanged. **+0.4 is inside the ~1.2-point noise floor and is not claimed** |
| Prompt token usage | ✅ | mean **1,800 → 1,429** per question; **0 of 69** cost more |
| Latency | ✅ | engine **7.7 ms** mean / **5.5 ms** median / 37.6 ms worst — under 1% of a turn |
| Benchmark confirms no regression with reduced prompt cost | ✅ | §4.7 — every safety and honesty measure unchanged, at 20.6% fewer prompt tokens |
| Implementation report completed | ✅ | this document |

**The quality case rests on `entityRefs` (121 → 153), on 3/3 evidence groups reaching the model where legacy
delivered 1/3, and on 149/149 sections being parseable where legacy handed the model broken JSON 56 times — not
on the composite score.** The token case rests on 138 exact measurements from the production model.

*Working tree is uncommitted, exactly as INT17 left it. The engine, its tests, this report, the closed INT16
record and the amended architecture are all present and verified; committing them is a separate, deliberate act.*
