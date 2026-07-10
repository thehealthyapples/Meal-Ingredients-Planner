# Context Composition Engine — verification harness

The measurement harness behind INT17/INT18's headline numbers (exact prompt-token
delta, entity/provenance preservation, well-formedness, engine latency), preserved
here so those claims are **re-runnable**. INT18 §3 recorded that INT17's harness was
not preserved and had to be rebuilt from scratch; this closes that gap for good.

> **Relocated under BENCHINT2 (2026-07-10)**, from
> `server/tests/benchmark/context-composition-verification/`. It is not part of the
> scored Companion Benchmark run, and it deliberately constructs a `ConversationGateway`
> with an in-memory store and a stub LLM provider — which `BENCHMARK_AUTOMATION.md` §2
> forbids anywhere inside the benchmark's import surface, where the one and only
> Companion seam is `conversationGateway.processUserTurn`. Living inside
> `server/tests/benchmark/` made that invariant read as broken to anyone auditing the
> tree. It is a verification harness for one engine, so it now lives beside the engine
> tests. It still reads the benchmark's question corpus as an input — that is a fixture
> read, not a seam.

All four scripts are run **from the repository root** and write intermediates to
`out/` (git-ignored). They read the real database and the real benchmark corpus
(`server/tests/benchmark/fixtures/companion-benchmark-100.v1.json`); the LLM is stubbed
for prompt capture, so the only difference between the two trees is the CONTEXT DATA
block and its format note.

## Procedure — the two-tree comparison

The comparison needs the **legacy truncation gateway** (BEFORE) and the **Context
Composition Engine** (AFTER). Both must carry BENCH4's resolver so `food-intelligence`
is reachable in each — otherwise the engine is wrongly credited with BENCH4's routing fix.

```bash
# AFTER — the engine, in the working tree (HEAD carries INT17/INT18 + BENCH4)
npx tsx server/tests/context-composition/probe.ts after

# BEFORE — legacy truncation. Check out the pre-engine gateway into a worktree that
# still carries BENCH4's resolver, then run probe.ts there with label "before" and copy
# its out/prompts-before.json back beside prompts-after.json. The pre-INT17 gateway is at
# rollback tag int17-rollback-20260708 (commit 11196b8); BENCH4's resolver is commit cb314cc.

# Deterministic analysis (no network): context reduction, sections, well-formedness, ids
npx tsx server/tests/context-composition/analyse.ts

# Exact prompt tokens (gpt-4o-mini, usage.prompt_tokens, max_tokens:1). Needs OPENAI_API_KEY.
npx tsx server/tests/context-composition/tokens.ts

# Engine ground truth in ONE tree: entity/provenance preservation, Full-Result
# immutability, budgetExceeded, duplicates, latency — checked against the raw Full
# Results the gateway actually passed to composeContext.
npx tsx server/tests/context-composition/engine.ts
```

| Script | Needs | Produces (`out/`) |
|---|---|---|
| `probe.ts <label>` | real DB | `prompts-<label>.json` — captured system prompts |
| `analyse.ts` | both prompt dumps | `analysis.json` — deterministic reduction/well-formedness |
| `tokens.ts` | both prompt dumps, `OPENAI_API_KEY` | `tokens.json` — exact prompt-token delta |
| `engine.ts` | real DB | `engine.json` — entity/provenance/immutability/latency |

Relocated from the untracked `.int18-tmp/` scratch directory under INT19. Only the
import paths (`../server/…` → `../../../…`) and the `out/` location changed; the logic
is INT18's, unchanged.
