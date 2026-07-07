# INTQ9 — Benchmark Measurement Accuracy Hardening — Implementation Report

**Workstream:** INTQ9
**Date:** 2026-07-05
**Branch:** `int1-intelligence-platform`
**Status:** Delivered — capability-family normalisation hardened, Capability Registry / Resolver / Benchmark ownership aligned, Quick and Full benchmarks re-run and compared.

> **Guardrails honoured.** No benchmark question changed (fixture re-validated verbatim, `npm run test:companion-benchmark:validate` still passes). No scoring rule, dimension, weight, or hard-gate changed (`DIMENSION_WEIGHTS`, `SCORING_FRAMEWORK.md` gates untouched). No Companion behaviour changed — nothing under `server/intelligence/` (other than this benchmark harness's own read of the registry) was modified. No score was inflated by design: the alias table only fires when the *actual* reached capability already matches the *real* registry id a question was authored against; a genuine mismatch still scores as a mismatch (evidenced in §4 below).

## Rollback protection

- **HEAD at start:** `ff3b2cfe2f24c5396fed9cd794896ba295fd95a8` (branch `int1-intelligence-platform`, already dirty with prior INTQ1–INTQ8 WIP).
- **Rollback identifier:** git stash commit **`1584786d49b4ee51a579f5a58844671c2372ccee`**, stored as `stash@{0}` ("INTQ9 pre-implementation checkpoint (rollback protection)"). Restorable with `git stash apply stash@{0}` (or `git stash apply 1584786d49b4ee51a579f5a58844671c2372ccee`) without disturbing any other stash entry.

---

## 1. The problem this workstream measures and fixes

Read `docs/architecture/README.md` (governing bootstrap) and every document in `docs/intelligence/benchmark/` first, per the mission brief. `BENCHMARK_SCORING_FRAMEWORK.md` §6.4 and the Capability Breakdown's own report template (`BENCHMARK_REPORT_TEMPLATE.md` §5) both promise the Capability Score table **"maps directly onto the Capability Registry."** It did not.

The Benchmark 100 fixture's `capability` field is free-form question-authoring shorthand written when the questions were authored (INTQ2/INTQ3) — e.g. `additive.lookup`, `shopping-list.read`, `nutrition-report + uplift`, `companion.guidance + diary` — not the Capability Registry's own id spelling (`server/intelligence/capability-registry.ts`: `planner`, `shopping`, `nutrition-knowledge`, `meals`, `analyser`, …). The original `capabilityFamily()` (`server/tests/benchmark/expectations.ts`, built under INTQ4) only stripped punctuation (`+`, `/`, `.`) from the raw string — it never checked the result against anything. Two consequences, both **measurement bugs**, not Companion bugs:

1. **D4 Capability Routing was silently miscalibrated.** `scorer.ts`'s `familyMatch = reachedFamily === exp.capabilityFamily` compares the *fixture's own guess-token* against the *real* `TurnResult.outcome.capabilityId` (always a genuine registry id, confirmed by grep across the resolver and capability-registry.ts — the full id set is exactly `administration, analyser, developer, diary, diary-discovery, evidence-learning, food-intelligence, household, household-discovery, meal-discovery, meals, nutrition-discovery, nutrition-knowledge, opportunity-delivery, pantry, pantry-discovery, partners, planner, planner-discovery, profile, shopping, shopping-discovery, templates`). Tokens like `shopping-list`, `product-analysis`, `additive`/`additives`, `basket`, `nutrition-report` can **never** equal a real capability id, so every one of those questions was capped at D4 band 2 even when the Companion routed perfectly correctly.
2. **The Capability Score report was fragmented and dishonest.** The last recorded full-100 run (`docs/intelligence/benchmark/history/2026-07-05T08-41-25Z__ff3b2cf.report.md`) shows **31 distinct "capability" rows** for what the registry defines as **23 real capabilities** — including singular/plural duplicates (`additive` vs `additives`), split synonyms (`product-analysis`, `product-swap`, `product-compare` all really `analyser`; `shopping-list`/`basket` really `shopping`), and outright fabricated pseudo-capabilities that do not exist in the registry at all (`companion`, `safety`, `help`, `personality-registry`, `fallback`, `grounded-response`, `benchmark`, `evidence`) — none of which the Capability Registry has ever registered.

Point 2 is architecturally significant beyond cosmetics: `companion.guidance`, `personality-registry`, and `safety.boundary`/`safety.medical` questions test the **Companion Platform** (voice/guidance/personality — CPA1, "changes how, never what") and **Trust & Safety meta-behaviour** (self-explanation, honesty, evidence transparency), which are cross-cutting concerns *by design*, not Capability Registry entries. Forcing them into a fake capability label both invented capabilities that were never registered and diluted the real per-capability signal the Capability Score table exists to give — the exact "Align Capability Registry, Resolver and Benchmark ownership" defect named in the mission brief.

## 2. What changed

All changes are in the benchmark harness (`server/tests/benchmark/`) and its report/dashboard consumers. Nothing in `server/intelligence/` was touched.

| File | Change |
|---|---|
| `server/tests/benchmark/expectations.ts` | `capabilityFamily()` rewritten to normalise against `intelligencePlatform.registry`'s own id set (read once, zero duplicated truth — the same registry the resolver and `TurnResult.outcome.capabilityId` use). Adds: an exact-match fast path (an already-valid registry id always wins, untouched); a registry-grounded `CAPABILITY_FAMILY_ALIASES` table for known fixture shorthand; a `DISCOVERY_RAW_REDIRECTS` exact-string table for the one case where a bare token is genuinely ambiguous without its verb suffix (`nutrition.meal-search` → `nutrition-discovery`); and `NON_CAPABILITY_ALIASES` for the three genuinely cross-cutting families (`companion-platform`, `trust-meta`, `safety-boundary`). A load-time assertion throws if any alias target is not itself a real registry id — a mistyped alias fails loudly instead of silently miscategorising. New export `isRegistryCapability()`. |
| `server/tests/benchmark/aggregate.ts` | `rollupCapabilities()` now filters to `isRegistryCapability(...)` only — the table that promises to map onto the registry now actually only contains registry ids. New `rollupNonCapability()` produces the cross-cutting rollup (`companion-platform` / `trust-meta` / `safety-boundary`). No question is dropped from any total — both rollups partition the same question set the headline already scores. |
| `server/tests/benchmark/types.ts` | `BenchmarkResult` gains `capabilitiesCrossCutting: GroupRollup[]` (additive field). |
| `server/tests/benchmark/runner.ts` | Computes and threads the new field through both the scored-run path and the certification-framework-only stub (`[]`). |
| `server/tests/benchmark/report.ts` | Renders a new **Cross-Cutting Scores** table in §5, only when non-empty. |
| `client/src/pages/admin-intelligence-page.tsx` | New `Cross-Cutting Scores` `ScoreBarCard` beside the existing `Capability Scores` card; `capabilitiesCrossCutting` is optional in the client type and the card defensively defaults to `[]` so an older run artefact on disk (saved before this change) still renders without crashing. |
| `server/tests/benchmark/bundle.ts` | `FRAMEWORK_VERSION` bumped `v1.0.0` → `v1.1.0` — a MINOR, comparison-safe bump per the framework's own versioning rule (README §4: "a new optional report panel" is explicitly MINOR). No `rubric`, `households`, `judge`, or `questions` component changed. |
| `docs/intelligence/benchmark/README.md` | New version-log row documenting the bump and rationale — appended, not edited in place, per the frozen-version discipline the document itself states. |
| `docs/intelligence/benchmark/BENCHMARK_REPORT_TEMPLATE.md` | New optional **§5b Cross-Cutting Breakdown** subsection added after the frozen §5 Capability Breakdown — an addition, not a rewrite of any existing frozen text. |

### Alias table (grounded in the registry's own `owningService`/`apiSurface`, not guesswork)

| Fixture token(s) | → Registry id | Grounding |
|---|---|---|
| `additive`, `additives`, `product-analysis`, `product-swap`, `product-compare` | `analyser` | Registry: Analyser owns `/api/additives`, `/api/scan`, `/api/products/barcode/*`. |
| `shopping-list`, `basket` | `shopping` | Registry: Shopping owns `/api/shopping-list/*`, `/api/shopping/*`, `/api/basket/*`. |
| `nutrition-report`, `nutrition-history`, `diet-foods`, bare `nutrition` | `nutrition-knowledge` | Registry: Nutrition/Knowledge owns `nutrition-centre-assembler.ts` and the `report` intent. |
| `household-meal-matcher` | `household` | Registry: Household's own `owningService` literally lists `household-meal-matcher.ts`. |
| `meal-uplift`, `uplift-engine` | `food-intelligence` | Registry: Food Intelligence owns `opportunity-engine.ts` (the uplift/opportunity surfacing engine). |
| `nutrition.meal-search` (exact string) | `nutrition-discovery` | Registry: "Discover meals matching a nutritional criterion" is `nutrition-discovery`'s literal description; verified against fixture question CB-016 ("Which meals are highest in protein?"). |

### Cross-cutting, deliberately **not** aliased into a capability

| Fixture token(s) | → Bucket | Why not a capability |
|---|---|---|
| `companion.guidance`, `personality-registry` | `companion-platform` | Tests the Companion Platform's voice/guidance layer (CPA1), not a specific capability's routing. |
| `help`, `fallback`, `grounded-response`, `benchmark`, `evidence` | `trust-meta` | Verified per-question against the fixture: TS-096/098/099/100 and PH-010 are self-explanation/meta-honesty questions; TS-097 (`evidence.explain`, "Show me the evidence behind that nutrition claim") is about knowledge-claim citation transparency — **deliberately not** aliased to the registry's `evidence-learning` capability, which is a different concern (household outcome pattern learning, EL1). Aliasing by name-similarity alone would have been a *new* measurement bug of the same kind this workstream fixes. |
| `safety.boundary`, `safety.medical` | `safety-boundary` | Trust & Safety hard-constraint/refusal tests, already scored by D3 and the G2 gate; not a capability-routing question. |

## 3. Why this doesn't change scoring rules, only measurement accuracy

- `DIMENSION_WEIGHTS`, the five hard-gates, and the honest-gap doctrine in `scorer.ts` are byte-for-byte unchanged.
- The *rule* "if the reached capability's family matches the expected family, D4 = 4" is unchanged. Only the accuracy of "expected family" changes — this is a calibration fix to the measuring instrument, the explicit purpose of this workstream.
- Verified empirically (see §4): every question whose composite moved did so because its family now correctly equals a capability the Companion **actually, verifiably reached** (`reachedCapability` in the artefact) — never because of a merge between two genuinely distinct registry ids. Sibling discovery/base pairs (e.g. `diary` vs `diary-discovery`) were deliberately **not** merged — a fixture-authored `diary.read` question that the resolver actually routed to `diary-discovery` still scores as a mismatch after this change, because that is a real routing signal worth keeping, not a normalisation artefact.
- Cross-cutting reclassification (`companion.guidance` → `companion-platform`, etc.) produces **zero** D4/composite change by construction — those tokens never matched a real registry id before or after; only their *reporting bucket* changed.

## 4. Validation — Quick and Full Benchmark, before vs after

Run via the existing INTQ8 comparison harness (`server/scripts/intq8-quick-benchmark.ts` / `intq8-full-benchmark.ts`), against the benchmark-world household `BW10` (matches the world/household the most recent permanent history entries used). These scripts measure only — no history write, no Companion change — so before/after could be captured back-to-back on the same commit's dirty tree.

### Quick Benchmark (10 questions — 1 per domain)

| | Before | After |
|---|---:|---:|
| Headline | 73.2 | 73.2 |
| Gates fired | 0 | 0 |

No change — the Quick Benchmark's 10-question sample happened not to include any of the affected fixture tokens. Expected and correct: Quick Benchmark is a fast smoke sample, not where this fix's evidence lives.

### Full Benchmark (100 questions)

| | Before | After | Δ |
|---|---:|---:|---:|
| Headline | 73.2 | 73.9 | **+0.7** |
| Gates fired | 0 | 0 | 0 |
| Distinct capability-family rows in the breakdown | 31 | **15** (12 real registry capabilities + 3 honest cross-cutting buckets) | −16 |

**50 of 100 questions** show a diff between the before/after artefacts. Of those, **13 questions gained a clean, isolated +6.0-point composite improvement** (exactly `(4−2)/4 × 12 = 6`, the D4 weight arithmetic, with every other dimension band unchanged) because their family now correctly equals the capability the Companion had already, verifiably reached:

| Question | Family before → after | Reached capability | Composite |
|---|---|---|---:|
| PL-033 | `household-meal-matcher` → `household` | `household` | 68.3 → 74.3 |
| SH-035 | `shopping-list` → `shopping` | `shopping` | 65.0 → 71.0 |
| SH-036 | `shopping-list` → `shopping` | `shopping` | 68.3 → 74.3 |
| SH-037 | `basket` → `shopping` | `shopping` | 80.8 → 86.8 |
| SH-039 | `shopping-list` → `shopping` | `shopping` | 68.3 → 74.3 |
| SH-041 | `shopping-list` → `shopping` | `shopping` | 80.8 → 86.8 |
| SH-044 | `basket` → `shopping` | `shopping` | 65.0 → 71.0 |
| ND-055 | `nutrition-report` → `nutrition-knowledge` | `nutrition-knowledge` | 65.0 → 71.0 |
| ND-060 | `nutrition-history` → `nutrition-knowledge` | `nutrition-knowledge` | 65.0 → 71.0 |
| ND-062 | `nutrition-report` → `nutrition-knowledge` | `nutrition-knowledge` | 65.0 → 71.0 |
| FK-081 | `diet-foods` → `nutrition-knowledge` | `nutrition-knowledge` | 80.8 → 86.8 |
| PR-068 | `additives` → `analyser` | `analyser` | 68.3 → 74.3 |
| PR-069 | `additives` → `analyser` | `analyser` | 68.3 → 74.3 |

The remaining ~37 of the 50 changed rows are either (a) pure family relabels with **zero** score change (cross-cutting reclassification, e.g. `CG-084 companion → companion-platform`, composite 73.3 → 73.3 identical), or (b) small, unrelated composite drifts already present before this change (e.g. `CB-011` 74.3 → 71.0, `CG-089` 75.8 → 65.0, family and D4 band both unchanged) — pre-existing run-to-run non-determinism the framework's own `EXECUTION_PROCESS.md` §5 documents ("subject non-determinism is surfaced, not suppressed") and explicitly out of this workstream's scope (fixing Companion determinism would be a Companion-behaviour change, forbidden by the brief).

Net: **31 fragmented capability labels collapsed to 15 honest ones** (12 real Capability Registry ids + 3 clearly-named cross-cutting buckets), and the headline moved a small, fully-explained **+0.7**, consistent with `13 fixed questions × 6.0 pts ÷ 100 = +0.78`, offset by ~0.1 of unrelated noise. No hard gate fired before or after.

## 5. Remaining measurement limitations (not fixed by this workstream, out of scope)

- **Run-to-run non-determinism.** As shown above, a handful of questions' composite drifts a few points between two back-to-back runs on an identical commit with no code change at all, because some capability responses are not perfectly deterministic. The framework already has an answer for this (`repeats: N` mode, `EXECUTION_PROCESS.md` §5) — it is not wired into the INTQ8 comparison scripts used for this validation, and re-enabling it is a separate, scoped piece of work.
- **D4's own scoring ladder is still coarse.** Even after this fix, D4 = 2 is given to *any* non-matching-but-non-null reached capability, whether the mismatch is close (e.g. `diary` vs `diary-discovery`, arguably a near-miss) or completely unrelated (e.g. expected `pantry`, reached `profile`). This workstream deliberately left that ladder untouched — it is a `rubric` (scoring-rule) concern, and the brief is explicit: do not change scoring rules or weights.
- **The judge tier was not invoked in any validation run** (`judge.invoked: false` in every artefact, deterministic-only, matching the last recorded history run). D1/D2/D5/D6 remain conservative deterministic estimates regardless of this fix; this workstream only touches D4's input, not judge availability.
- **A few `reachedCapability: null` rows remain unmapped/unaddressed by design** — questions like `product-swap`, `product-compare`, `additive` (singular) that reached no capability at all in this run reflect the Companion genuinely not routing to `analyser` for those utterances yet. The benchmark now labels them correctly (`analyser`) so this gap is *visible* in the Capability Score breakdown instead of hidden in a fake `product-swap` row — surfacing it is the intended honest-gap behaviour, not something this workstream fixes in the Companion.

## 6. Confidence assessment

**High confidence the benchmark now better reflects actual Companion intelligence**, specifically for D4 Capability Routing and the Capability Score breakdown:

- The fragmentation was independently verifiable from the fixture (73 unique raw `capability` strings, 31 distinct rollup rows before the fix) and from the runtime resolver/registry (a closed, 23-id set) — not a matter of interpretation.
- Every alias is grounded in the registry's own `owningService`/`apiSurface` text, not inferred from naming similarity — and the one place naming similarity would have misled (`evidence.explain` ≠ `evidence-learning`) was checked against the actual fixture question and deliberately excluded.
- The empirical diff (§4) shows the fix behaves exactly as designed: clean, isolated, arithmetically-exact D4 corrections where the Companion was already right, zero effect on cross-cutting questions' scores, and no inflation on genuine mismatches (sibling discovery capabilities were confirmed to still score as mismatches).
- The report and dashboard now honestly present the split the governing docs already promised (`BENCHMARK_REPORT_TEMPLATE.md` §5's own example row `honest-gap (no-capability)` anticipated exactly this need) instead of silently violating it.

**Confidence is bounded, not absolute**: this workstream fixes family normalisation and ownership alignment only. D1/D2/D5/D6 accuracy still depends on the (not-invoked-here) judge tier, and run-to-run non-determinism in a handful of capabilities means any single headline number — before or after this fix — should still be read as "this run," not "the Companion's fixed score," exactly as `BENCHMARK_SCORING_FRAMEWORK.md` §7 already states.
