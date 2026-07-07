# INTQ1 — THA Companion Intelligence Benchmark Framework — Implementation

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Workstream:** INTQ1 (🟢 GREEN — documentation-only; a permanent measurement *framework*, no code, no schema, no runtime, no API)
**Risk:** 🟢 GREEN
**Reason:** Creates the permanent, governing framework for executing the **THA Companion Benchmark** — the fixed instrument THA will use to measure the one Companion, the same way, every time. Six framework documents under `docs/intelligence/benchmark/`. No source, schema, migration, route, or test file is added or changed by this task; the automation harness and household fixtures are **specified** here (as the future workstream's contract), not implemented. The canonical **THA Companion Benchmark 100 questions are explicitly out of scope** and delivered separately.
**Builds on:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1/TIP2 — capability/intent/permission model the benchmark observes) · [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) (TIP3 — one Companion, one conversation seam) · [`THA_COMPANION_PLATFORM_ARCHITECTURE.md`](../architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md) (CPA1 — "one Companion / change how, never what", the invariant the framework inherits) · [`PLATFORM_QUALITY_ARCHITECTURE.md`](../architecture/PLATFORM_QUALITY_ARCHITECTURE.md) (Trust, Safety, Privacy — the qualities the scoring gates enforce)

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Working tree at start | Already dirty with substantial prior uncommitted INT/FI/EL/PKC-series work on this branch (pre-existing, unrelated to this task — the same branch state the recent EL1/PKC reports document) |
| HEAD at start | `ff3b2cfe2f24c5396fed9cd794896ba295fd95a8` — "Enforce evidence-backed rendering for nutrition benefit claims (PKC Phase 0)" |
| This task's writes | 6 new documents in `docs/intelligence/benchmark/` + this 1 implementation report. **Nothing else.** |
| Code modified | **None.** No file under `server/`, `client/`, or `shared/` is added or changed. |
| Schema modified | **None.** |
| Runtime modified | **None.** |

**Rollback command:** `rm -rf docs/intelligence/benchmark/ docs/implementation/INTQ1_COMPANION_BENCHMARK_FRAMEWORK_IMPLEMENTATION.md`. This task is purely additive documentation; deleting the seven files fully reverts it with zero effect on any code path — nothing in the codebase imports or depends on them.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point — mandatory bootstrap; confirmed placement, classification conventions, and the Intelligence Governance section this framework serves)
- [x] `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1 §0/§1/§2 — "there is one Companion"; the two seams — per-turn Behaviour Engine and request-time Observation Engine; the `processUserTurn` pipeline the benchmark drives; the "change how, never what" invariant the scoring rubric encodes as its Tier-A hard-gates)
- [x] `server/intelligence/conversation/conversation-gateway.ts` (the **one** public seam: `conversationGateway.processUserTurn(...)` → `TurnResult`. Read the full `TurnResult` contract — `text`, `outcome`, `discoveries`, `guidance`/`guidanceKind`, `enrichment`, `actions`, `fallbackState`, `entityRefs`, `conversationId`, `threadId` — which is exactly the deterministic-tier scoring surface. Read `detectWriteIntent` (write intents short-circuit to an honest gap BEFORE resolution — the basis for scoring write questions on proposal/refusal, gate G3) and the `UnsuccessfulTurnState` states — `no-route` / `no-knowledge` / `no-results` / `internal-error` — the honest-gap and G5 signals.)
- [x] `server/intelligence/conversation/personality-registry.ts` (the closed six-voice set — `companion`, `friend`, `coach`, `chef`, `teacher`, `sergeant` — the population dimension D6 grades over, and the source of the "voice changes how, never what" hard-invariant D1/D2 protect)
- [x] `shared/schema.ts` (household identity tables — `households`, `household_members`, `household_eaters`, plus `plannerEntryEaters`, `household_evidence_events`, `household_learning_signals` — confirming the deterministic households seed the **existing** identity space, never a new one; and that H5's dense diary can legitimately clear Companion Growth / Evidence & Learning minimum-sample gates)
- [x] `package.json` `test` chain + `server/tests/test-intelligence-evidence-learning-binding.ts` (the repo's `tsx server/tests/…` test convention and `npm run test:*` script shape the automation harness follows verb-for-verb — a single `tsx` runner registered as `test:companion-benchmark`)
- [x] `docs/implementation/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md` (the most recent governing-doc-adjacent implementation-report structure — header block, Rollback Protection, Reference Documents Read, Architecture Compliance Checklist — mirrored here)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  The benchmark introduces NO new identity space. The six deterministic
  households seed the EXISTING households / household_members /
  household_eaters tables to fixed IDs; a benchmark household is an ordinary
  household with frozen contents, resolved through the same paths a real
  onboarding uses. No second key space for any business entity.

☑ One owner per fact
  The framework owns only the measurement artefacts (rubric, households,
  report shape, harness spec, history). It reads Companion facts EXCLUSIVELY
  from the TurnResult the one gateway returns; it never re-derives, caches, or
  second-sources any capability's answer. Answers have exactly one owner — the
  capability that produced them — and the benchmark is a read-only observer.

☑ One Companion, no second assistant
  Every question is executed through the single seam
  conversationGateway.processUserTurn. The framework forbids the runner from
  importing any capability handler, binding, the intent engine, the permission
  model, or the behaviour engine directly (BENCHMARK_AUTOMATION §2). It stands
  up NO parallel assistant, NO second conversation, NO duplicate mechanism.

☑ Permission-aware, honest gaps not fabrication
  The rubric makes honesty a first-class POSITIVE outcome (D2): admitting a
  gap when a gap is correct scores band 4. Fabricating an answer that should
  have been a gap is the single most-penalised failure (gate G1 → 0). Write
  intents are scored on the platform's own confirmation-gated proposal
  (TurnResult.actions) or honest refusal (detectWriteIntent), never on an
  executed mutation (gate G3). Dietary hard-constraints and cross-household
  isolation are safety hard-gates (G2, G4). This is the platform's honest-gap
  and permission doctrine expressed as a score.

☑ Change how, never what (CPA1 invariant)
  D6 grades whether the configured personality voice was applied; D1/D2
  guarantee the voiced answer's FACTS equal the truth. A well-voiced
  fabrication still scores 0. The rubric cannot reward tone over truth — the
  tier ordering (Truth & Safety > Usefulness > Experience) is structural.

☑ No runtime dependence on planning documentation
  This framework is documentation. No code path reads it. The automation
  harness and fixtures it SPECIFIES are a future workstream's contract, not a
  runtime dependency introduced now.

☑ Additive and reversible
  Six new docs + one report. No existing file touched. Fully reverted by
  deleting the new files. No code, schema, migration, route, or test.
```

**Result: PASS.** No check fails. Documentation-only, additive, and structurally faithful to the one-Companion invariant.

---

## WHAT WAS BUILT

The permanent framework for executing the THA Companion Benchmark, as six governing documents under
`docs/intelligence/benchmark/`. Each of the seven required design areas is owned by exactly one document:

| Required design area | Owning document |
|---|---|
| Benchmark execution process | `BENCHMARK_EXECUTION_PROCESS.md` |
| Scoring framework | `BENCHMARK_SCORING_FRAMEWORK.md` |
| Benchmark report | `BENCHMARK_REPORT_TEMPLATE.md` |
| Deterministic benchmark households | `BENCHMARK_HOUSEHOLDS.md` |
| Benchmark versioning | `README.md` §4 (the co-versioned bundle) |
| Automated execution for regression testing | `BENCHMARK_AUTOMATION.md` |
| Benchmark history & comparison reporting | `BENCHMARK_AUTOMATION.md` §4 + `BENCHMARK_REPORT_TEMPLATE.md` §2/§6 |

### Design decisions worth recording

1. **The benchmark is an observer of the one Companion, driven through `processUserTurn` only.** This is the framework's
   spine and the reason it cannot become a second assistant. The `TurnResult` contract *is* the deterministic scoring
   surface — every field maps to a dimension or gate.
2. **Two-tier, deterministic-first scoring.** Machine-checkable assertions own routing (D4) and safety/permission (D3)
   and every hard-gate; a pinned, temperature-0, frozen-prompt judge grades only the qualitative degree of correctness,
   honesty, relevance, and voice. THA is deterministic-first; the rubric is too, and much of a regression is caught with
   no LLM call at all.
3. **Honesty is a scored positive; fabrication is a zeroing gate.** D2 is scored *by intent* against each question's
   `correctAnswerType` — admitting a correct gap is band 4; fabricating over a gap fires G1 → 0. This is the literal
   scoring of the platform's honest-gap doctrine.
4. **Six deterministic households spanning the axes the Benchmark 100 must exercise** — sparse↔rich data, none/allergy/
   vegan/mixed constraints, solo↔family, casual↔goal-driven — including deliberate **matched grounded/gap pairs** (H4
   this-week vs next-week; H1 vs H5 "my goal") that test whether the Companion discriminates knowing from not-knowing.
   Fixed IDs, clock-relative timestamps, checksum-locked seed contract.
5. **Everything is a co-versioned bundle** (questions + households + rubric + judge + framework), semantically versioned,
   frozen per release, never edited in place. The subject (Companion commit) is varied against a held-fixed bundle. This
   is what makes history trustworthy and comparison meaningful.
6. **The harness is a single `tsx` runner** matching the repo's existing test convention, with a hard import-surface
   constraint enforcing the one-seam invariant, an append-only history, and a CI gate that blocks on any safety-gate
   firing, a headline regression, an honesty regression, or a newly-failing watchlist question — independently.

### Deliberately deferred (named, not silently dropped)

- **The 100 questions.** Canonical, delivered separately. The bundle's `questions` component is `pending`; no scored run
  is valid until they land in `docs/intelligence/benchmark/questions/`.
- **The harness code and `fixtures/households.v1.json`.** Specified here as the implementing workstream's exact contract;
  building them is that workstream (they require the questions to be executable end-to-end).

---

## FILES CHANGED

**New (7):**

- `docs/intelligence/benchmark/README.md` — framework index, the one invariant, the co-versioned bundle, versioning rules + version log, glossary.
- `docs/intelligence/benchmark/BENCHMARK_EXECUTION_PROCESS.md` — the seven-step run process, preconditions, seeding, per-question execution, determinism contract, safety/isolation/teardown, by-hand checklist.
- `docs/intelligence/benchmark/BENCHMARK_SCORING_FRAMEWORK.md` — seven dimensions in three tiers, two-tier deterministic/judge model, 0–4 bands, honest-gap scoring by intent, hard-gates G1–G5, the pinned judge, aggregation to one headline.
- `docs/intelligence/benchmark/BENCHMARK_HOUSEHOLDS.md` — the six deterministic households (fixed IDs, complete fixture facts, fabrication traps), the coverage guarantee, and the checksum-locked seed contract.
- `docs/intelligence/benchmark/BENCHMARK_REPORT_TEMPLATE.md` — the canonical report shape (headline → regression → safety → dimension/capability/household breakdowns → failing questions → provenance) and the comparison rules.
- `docs/intelligence/benchmark/BENCHMARK_AUTOMATION.md` — the runner, `result.json` schema, append-only history, CI regression gate, and the on-demand/PR/scheduled trigger modes.
- `docs/implementation/INTQ1_COMPANION_BENCHMARK_FRAMEWORK_IMPLEMENTATION.md` — this report.

**Modified:** none. **Deleted:** none.

---

## VERIFICATION

This is a documentation-only task; there is no runtime to exercise. Verification is structural:

- [x] All six required deliverables exist under `docs/intelligence/benchmark/` with the exact required filenames, plus this report.
- [x] Every one of the seven required design areas is owned by exactly one document (mapping table above), with no overlapping ownership.
- [x] The framework drives the Companion **only** through `conversationGateway.processUserTurn`, and the `TurnResult` fields it scores against were verified to exist in `conversation-gateway.ts`.
- [x] The households seed only the **existing** identity tables verified in `shared/schema.ts`; no new identity space.
- [x] The six voices D6 grades over match `personality-registry.ts` exactly.
- [x] No file under `server/`, `client/`, or `shared/` was added or modified (`git status` shows only the seven new docs from this task). No `npm test` impact — nothing executable changed.
- [x] The questions are **not** authored here — confirmed the `questions/` component is specified as `pending`/delivered-separately in `README.md` §4 and `BENCHMARK_AUTOMATION.md` §2.

---

## SUGGESTED FOLLOW-UP (out of scope for INTQ1)

1. **Index in the architecture README.** When the framework is promoted from implementation to governing status, add a
   row for `docs/intelligence/benchmark/` under Intelligence Governance in `docs/architecture/README.md`. Left out here
   deliberately — INTQ1 is the framework's implementation; promotion is a governance step with its own workstream.
2. **The implementing workstream** builds `server/tests/benchmark/*`, `fixtures/households.v1.json`, and wires
   `test:companion-benchmark` + the scheduled routine — executable only once the canonical Benchmark 100 is delivered.
3. **First baseline run** (`v1.0.0`) is produced by combining this framework with the delivered questions, establishing
   the first entry in `history/` that all future runs regress against.
