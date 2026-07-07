# INTQ3 — Companion Benchmark 100 Import (Implementation)

**Workstream:** INTQ3
**Date:** 2026-07-04
**Depends on:** INTQ1 (benchmark framework) · INTQ2 (canonical Benchmark 100 questions)
**Status:** Complete — questions imported to executable fixtures and validated. No scored run performed.

---

## 1. Mission

Convert the supplied **THA Companion Benchmark 100 v1.0** document into the repo's executable benchmark
format, **without rewriting the questions or changing benchmark meaning**, and validate the import.

This workstream is a **data import and integrity gate only**. It authors no scoring logic, seeds no household,
calls no Companion, and changes no Companion behaviour. It prepares the questions component of the benchmark
bundle so that a future run (INTQ1's runner) can execute them through the **one** Companion seam,
`conversationGateway.processUserTurn`.

## 2. What governs this work

| Document | Why it applies |
|---|---|
| [`../intelligence/benchmark/README.md`](../intelligence/benchmark/README.md) | The benchmark framework, the bundle model, and the one invariant (observe the one Companion; never build a second). |
| [`../intelligence/benchmark/BENCHMARK_AUTOMATION.md`](../intelligence/benchmark/BENCHMARK_AUTOMATION.md) | The runner's layout and import-surface constraints; the questions land under `server/tests/benchmark/`. |
| [`../intelligence/benchmark/BENCHMARK_SCORING_FRAMEWORK.md`](../intelligence/benchmark/BENCHMARK_SCORING_FRAMEWORK.md) | The scoring model. INTQ3 implements **none** of it — scoring is out of scope. |
| [`../intelligence/benchmark/questions/THA_COMPANION_BENCHMARK_100_V1.md`](../intelligence/benchmark/questions/THA_COMPANION_BENCHMARK_100_V1.md) | The canonical, human-readable source of truth for the 100 questions (INTQ2). |

## 3. Deliverables

| Deliverable | Purpose |
|---|---|
| `docs/intelligence/benchmark/questions/THA_COMPANION_BENCHMARK_100_V1.md` | Canonical source, annotated with a non-destructive INTQ3 import note (no question wording changed). |
| `server/tests/benchmark/fixtures/companion-benchmark-100.v1.json` | Executable fixture — the 100 questions encoded verbatim, one object per question. |
| `server/tests/benchmark/validate-companion-benchmark.ts` | Import-integrity validator (no DB, no Companion). |
| `package.json` → `test:companion-benchmark:validate` | One-command validation; also chained into the aggregate `npm test`. |
| `docs/implementation/INTQ3_COMPANION_BENCHMARK_100_IMPORT_IMPLEMENTATION.md` | This document. |

## 4. The fixture shape

`companion-benchmark-100.v1.json` is a frozen bundle-`questions@v1.0.0` artefact. Top level records provenance
(`bundleComponent`, `version`, `frozen`, `source`, `importedBy`, `importedOn`), the grade scale and maturity-horizon
definitions from the source doc, the canonical `categoryOrder` and `categoryCounts`, `totalQuestions`, and the
`questions` array. Each question preserves **every column** of the source table:

```jsonc
{
  "id": "PH-001",
  "category": "Profile & Household",
  "utterance": "What diet am I following?",        // verbatim from source
  "rationale": "Tests direct profile retrieval and self-understanding.",
  "capability": "profile.read",                     // from the source "Capability:" field
  "maturityHorizons": {                             // Launch → Y10, verbatim
    "launch": "…", "y1": "…", "y2": "…", "y3": "…", "y5": "…", "y10": "…"
  },
  "evidenceExpected": "User profile dietPattern.",
  "trustConcern": "Do not infer or invent a diet.",
  "grades": {
    "chatgptPredicted": "A",                        // preserved from source
    "claudePredicted": "TBC",                       // filled during INTQ3 execution, not here
    "actual": "TBC"                                 // filled by the real Companion run, not here
  }
}
```

### What is deliberately NOT in the fixture

Per scope ("do not change benchmark meaning", "do not implement scoring changes unless already defined by INTQ1"),
the following are **intentionally absent** because the source document does not define them per-question and authoring
them would add benchmark meaning:

- **Per-question `householdId` assignment.** The source specifies a default execution strategy (§5) and INTQ1 owns the
  six deterministic households, but it assigns no household to individual questions. That mapping is an execution-time
  concern, owned by the runner/execution workstream.
- **`correctAnswerType` (grounded vs honest-gap), must-appear / must-not-appear fact sets.** These are the scoring
  **expectation records** described in `BENCHMARK_SCORING_FRAMEWORK.md` §2. They depend on the chosen household's fixture
  facts and are authored when scoring is wired up — not by this import.
- **`claudePredicted` / `actual` grades.** Left `TBC`; produced during an actual run (INTQ2 §13 steps 3–8).

Keeping these out is the honest choice: the fixture is a faithful import, not a re-authoring.

## 5. The validator

`validate-companion-benchmark.ts` is an **import-integrity gate**, not a benchmark run. It has no database, no Companion,
and no network dependency. It loads the fixture and independently re-parses the canonical markdown, then asserts:

1. Fixture loads with the expected top-level shape (`bundleComponent: "questions"`, `version: "v1.0.0"`).
2. **Exactly 100 questions** (and `totalQuestions === 100`).
3. **No duplicate IDs.**
4. **No missing IDs** — every category's canonical ID range is fully present and global numbering `001–100` is complete.
5. Category IDs use the **correct prefix** and **category counts match** the canonical table.
6. **Required fields exist and are non-empty** on every question (id, category, utterance, rationale, capability, six
   maturity horizons, evidenceExpected, trustConcern, and the three grade fields; ChatGPT grade must be `A–F` or `TBC`).
7. **Verbatim fidelity vs source** — IDs, utterances, capabilities, and ChatGPT grades must match the source document
   character-for-character. This is the guard that **no question wording was changed on import**.

The validator exits non-zero on the first class of failure found and prints every problem. It was negatively tested
(tampered utterance, dropped question, emptied field, duplicate) and correctly fails each; on the committed fixture it
passes with exit 0.

### Canonical category map (enforced by the validator)

| Category | Prefix | IDs | Count |
|---|---|---|---|
| Profile & Household | PH | 001–010 | 10 |
| Cookbook | CB | 011–022 | 12 |
| Planner | PL | 023–034 | 12 |
| Shopping | SH | 035–044 | 10 |
| Pantry | PA | 045–052 | 8 |
| Nutrition & Diary | ND | 053–062 | 10 |
| Product Intelligence | PR | 063–072 | 10 |
| Food Knowledge | FK | 073–082 | 10 |
| Companion Guidance | CG | 083–090 | 8 |
| Trust & Safety | TS | 091–100 | 10 |
| **Total** | | | **100** |

## 6. How the fixture was produced

The JSON was generated by mechanically parsing the source markdown table (not hand-typed), so utterances and every
other column are byte-for-byte from the source. The validator then re-parses the same source and cross-checks the
committed JSON, so any future edit to either the document or the fixture that introduces drift fails CI. The generation
step is a one-off; the committed fixture plus the validator are the durable artefacts.

## 7. Definition of Done — evidence

| DoD item | Status | Evidence |
|---|---|---|
| All 100 benchmark questions imported | ✅ | `totalQuestions: 100`; validator §2 |
| Validation confirms no missing IDs | ✅ | validator §4 (canonical range completeness) |
| Validation confirms no duplicate IDs | ✅ | validator §3 |
| Validation confirms required fields exist | ✅ | validator §6 |
| No question wording changed | ✅ | validator §7 (verbatim fidelity vs source); source annotated non-destructively |
| No Companion behaviour changed | ✅ | no runtime/server code touched; validator imports no Companion module |
| No runtime benchmark execution yet | ✅ | validator is a static import gate; no `processUserTurn`, no DB, no judge call |

Run: `npm run test:companion-benchmark:validate` → PASS.

## 8. Scope boundaries honoured

- **One Companion, one seam.** Nothing here reaches into the Companion; the fixture is inert data. A future run executes
  it only through `conversationGateway.processUserTurn` (BENCHMARK_AUTOMATION §2).
- **No second assistant, no scoring.** No scorer, judge, household seed, or capability handler was written or modified.
- **Frozen source respected.** Questions are unchanged; the source doc gained only a provenance note. Future questions
  append as Q101+ (source §14), never edited into the frozen 100.
