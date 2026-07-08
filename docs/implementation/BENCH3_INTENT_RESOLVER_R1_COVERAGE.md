# BENCH3 — Intent Resolver R1 Coverage

**Status:** IMPLEMENTATION — Intent Resolver pattern coverage only. **No business logic, no Capability Registry, no benchmark scoring changed.**
**Classification:** Intelligence Governance → Intent Engine (`server/intelligence/pattern-intent-resolver.ts`)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Subject at implementation:** HEAD `45443a8` + uncommitted working tree

**Governing documents read before implementation:**
`docs/architecture/README.md` (Architecture Bootstrap, mandatory entry point),
`docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`,
`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`,
`docs/intelligence/benchmark/BENCHMARK_SCORING_FRAMEWORK.md`,
BENCH2 run report `docs/intelligence/benchmark/history/2026-07-08T10-59-57Z__45443a8.report.md`.

**Discharges:** the 24 **R1 capability misses** BENCH2 recorded as release blockers — *"a registered, executable
capability existed and was never invoked. The platform cannot reach a capability it advertises."*

---

## 0. ROLLBACK

Created **before** any file was modified.

| Identifier | Object | Restores |
|---|---|---|
| `bench3-rollback-20260708` | `efcb4e6` | The uncommitted working tree as it stood before BENCH3 continued |

Made with `git stash create` + annotated tag, so the working tree was **never disturbed** (a plain `git stash` would
have stripped the in-progress BENCH3 matchers off the tree). The snapshot covers tracked and staged files. Untracked
files (`admin-banner.tsx`, `GOV2_*.md`, `ADMIN1D_*.md`, the canonical-food batch drafts) are not in it and were not
touched by BENCH3.

```bash
# Inspect
git show --stat bench3-rollback-20260708

# Restore only the file BENCH3 changed
git checkout bench3-rollback-20260708 -- server/intelligence/pattern-intent-resolver.ts
```

---

## 1. Scope

**In scope.** Extend the existing `PatternIntentResolver` matcher arrays so that every utterance whose intended
capability is registered and executable resolves to a non-baseline intent for that capability.

**Explicitly not done.**

- No new capabilities. Every intent emitted targets a capability already in the Runtime Capability Registry.
- No change to `capability-registry.ts` (`supportedIntents`, `executableIntents`, permissions, gaps).
- No change to any handler, binding, port, or owning service.
- No change to benchmark scoring, gates, weights, or the question bundle.

**One file changed:** `server/intelligence/pattern-intent-resolver.ts`.

---

## 2. Why R1 fired: the two distinct causes

BENCH2's 24 R1 misses were not one bug. They were two.

**Cause A — a capability with no utterance-derived route at all (`profile`).**
`profile` was registered, bound, and executable (`read`), yet the resolver's *only* profile intent was the always-on
personalisation baseline (pipeline step 4). The gateway's `routedQueried` filter strips `baseline: true` intents
before persisting `resolvedIntent` (`conversation-gateway.ts:483`), so profile could never appear in the routed set.
The capability answered questions *about itself* with "I'm not sure I understood that." This is INTA1 §6.2's worked
example, and the R1 gate exists precisely to catch it.

**Cause B — vocabulary and phrasing the matchers did not cover.**
`what am I having for dinner tonight?` (planner), `what should I use up first?` (pantry), `which shopping items are
unresolved?` (shopping), `what are healthy fats?` (nutrition-knowledge), `what is E621?` (analyser). Every matcher
declined; the utterance no-routed.

Both causes are resolver-side. Neither required a new capability.

---

## 3. What changed

All changes are additive matchers or widened guards in `pattern-intent-resolver.ts`.

| Group | Questions | Change | Capability · verb |
|---|---|---|---|
| **Profile** | PH-001, PH-002, PH-007, PH-008, PH-009 | New `PROFILE_MATCHERS` array — the first utterance-derived route to `profile` | `profile` · `read` |
| **Planner** | PL-024 | Planned-meal read (`what am I having for dinner tonight?`) | `planner` · `read` |
| **Shopping** | SH-036, SH-037 | Route to the handler's own `unresolved` scope | `shopping` · `read` |
| **Shopping** | SH-040 | Item list to classify against | `shopping` · `read {scope:list}` |
| **Shopping** | SH-041 | Price question → `basket` scope | `shopping` · `read {scope:basket}` |
| **Pantry** | PA-049, PA-051 | Use-up / non-food-item reads | `pantry` · `read` |
| **Nutrition Knowledge** | FK-079 | `KNOWN_NUTRIENT_TERMS`: `fat` → `fats?` | — (guard fix) |
| **Nutrition Knowledge** | FK-076, FK-079, FK-081, ND-057 | New `NUTRITION_CONCEPT_MATCHERS` — food *categories* and *concepts* ("healthy fats", "fermented foods") that no slug lookup can resolve | `nutrition-knowledge` · `search` |
| **Nutrition Knowledge** | FK-080 | Nuanced-food-guidance form (`is white bread always bad?`), adverb-gated | `nutrition-knowledge` · `explain` |
| **Nutrition Knowledge** | FK-082 | `which` accepted alongside `what`; nutrient-raising queries | `nutrition-knowledge` · `search` |
| **Nutrition Knowledge** | ND-056 | Nutrient adequacy (`am I getting enough protein?`) | `nutrition-knowledge` · `read` |
| **Analyser** | PR-064 | Bare E-number, matched case-sensitively | `analyser` · `read {scope:additives}` |
| **Analyser** | PR-065, PR-066, PR-067, PR-071 | Product questions the analyser has no code path for | `analyser` · `explain` / `analyse` |

### 3.1 Guards that keep the new matchers from stealing turns

Each addition is deliberately narrowed so it cannot poach another capability's questions:

- **Profile is first-person only.** `do I have any allergies recorded` is a profile read; `does anyone in my household
  have a nut allergy` stays with `household-discovery`. PH-007 is interrogative-anchored so CB-021 (`recommend one meal
  that fits my goals`) does not acquire a profile route.
- **FK-080 is adverb-gated** (`always` / `really` / `actually`). Without the adverb the lazy capture would swallow
  PR-065–071's product questions and route them to food knowledge.
- **PR-066 is demonstrative-anchored** (`this` / `that` / `the`), so `is white bread always bad?` stays with
  nutrition-knowledge.
- **PL-024 requires a meal noun**, so `what should I cook tonight?` stays with `meal-discovery`.
- **`analyserUnexecutable()` declines** whenever the utterance carries additives/UPF/NOVA vocabulary, so a
  non-executable verb can never out-confidence the one analyser read that answers with real data (PR-072 is exactly
  that turn: it names an apple score *and* names NOVA).

### 3.2 The one correctness fix made this session

The in-progress working tree emitted `analyser · compare` (PR-067) and `analyser · recommend` (PR-071). Neither verb is
in the analyser's `supportedIntents` allow-list (`["read","explain","analyse","report"]`), so the engine would have
rejected both at VALIDATE with `unsupported_intent` — *"No freeform execution is permitted"* (`intent-engine.ts:75`) —
without ever reaching the handler.

Both are now `analyse`, which **is** on the allow-list. The intent reaches the handler's `readOnlyVerbGuard`, which
raises a `CapabilityExecutionError` carrying a reason, and the engine surfaces a structured `gap`. Same R1 outcome, but
the user is told *why* rather than being handed a closed-allow-list rejection. Changing `supportedIntents` to admit
`compare` would have been a Capability Registry change and was out of scope.

---

## 4. Result — BENCH2 → BENCH3 (both `full`, 100 questions, subject `45443a8`)

| Metric | BENCH2 `10-59-57Z` | BENCH3 `12-03-12Z` | Δ |
|---|---:|---:|---:|
| **R1 capability misses** | `24` | **`0`** | **−24** |
| **Intent Resolution Accuracy** | `53%` | **`83%`** | **+30pp** |
| **Capability Reach** | `70%` | **`100%`** | **+30pp** |
| **Overall Intelligence Score** | `65.3` | **`75.3`** | **+10.0** |
| R2 misroutes | `14` | `14` | `0` |
| Routing gates fired | `38` | `14` | −24 |
| Unreachable capabilities | `2` (`food-intelligence`, `profile`) | `1` (`food-intelligence`) | −1 |
| Hallucination rate | `0%` | `0%` | `0` |
| Honest-gap rate | `100%` | `100%` | `0` |
| Hard safety gates | `0` | `0` | `0` |
| Capability utilisation | `76%` | `81%` | +5pp |
| Release readiness | **FAIL** | **PARTIAL** | ↑ |

Per-domain, every targeted group went to zero R1 **with no new misroutes**:

| Domain | R1 | R2 | Intent accuracy |
|---|---|---|---|
| Profile & Household | 5 → **0** | 1 → 1 | 33% → 89% |
| Planner | 1 → **0** | 1 → 1 | 82% → 91% |
| Shopping | 4 → **0** | 1 → 1 | 44% → 89% |
| Pantry | 2 → **0** | 0 → 0 | 75% → **100%** |
| Nutrition & Diary | 2 → **0** | 3 → 3 | 50% → 70% |
| Food Knowledge | 5 → **0** | 0 → 0 | 50% → **100%** |
| Product Intelligence | 5 → **0** | 1 → 1 | 40% → 90% |

The R2 set is **byte-identical** to BENCH2's: `PH-006, CB-012, CB-016, CB-018, CB-019, CB-021, PL-030, SH-042, ND-054,
ND-058, ND-059, PR-070, CG-085, CG-087`. No question regressed.

---

## 5. Read this before celebrating: reach is not the same as answered

R1 measures whether the platform **invoked** the capability it advertises. It does not measure whether the capability
had anything to say. Of the 24 questions that now clear R1:

- **14 return real grounded data** (`grounding-data`).
- **10 reach the capability and honestly return nothing:**
  - `no-knowledge` — SH-041, FK-080, and the four analyser questions PR-065/066/067/071.
  - `empty-result` — ND-057, FK-081, FK-082 (`nutrition-knowledge · search` found no entry).

This is the designed behaviour, not a defect: hallucination rate stayed `0%` and honest-gap rate stayed `100%`. The
user is told the platform cannot answer yet, instead of the strictly less true *"I did not understand the question."*
Naming the gap is the fix INTA1 §5 (M8/M9) asks for.

**The four analyser questions are the clearest case.** The analyser's only executable operation is
`read {scope:"additives"}`. Forcing PR-065–071 onto that scope would have cleared the same R1 gate while handing the
answer generator an additives table for a question about apple scores — a fabrication risk and a false claim that the
capability answered. Closing those gaps is **analyser work, not resolver work**, and is explicitly not done here.

A scoring artefact worth knowing: those honest-gap turns score *higher* composites (82–87) than the grounded ones
(≈74), because D4 rewards reach plus an honest gap. That is the scoring framework's call, and BENCH3 did not touch it.

---

## 6. Remaining work (not BENCH3)

1. **Intent accuracy 83% is still below the 90% floor.** The residual 14 R2 misroutes are the whole gap. They are a
   *disambiguation* problem (`meals` vs `meal-discovery`, `planner` vs `nutrition-knowledge`), not a coverage problem,
   and were out of scope here.
2. **`food-intelligence` remains unreachable** — intended by ND-059 and CG-087, invoked by nothing.
3. **Analyser verb gaps** (`explain`, `analyse`, `report`) have no code path. Analyser workstream.
4. **Benchmark harness finding — baseline selection ignores `mode`.** `selectBaseline()` (`history.ts`) matches on
   bundle MAJOR + rubric MAJOR only. A 10-question `quick` run therefore becomes the baseline for a subsequent
   100-question `full` run. The `12-03-12Z` report's §2 "Regression vs Baseline" compares 100 questions against a
   10-question quick run and its listed "regressions" (Nutrition & Diary −10, Pantry −6.6 …) are an artefact of that
   mismatch, **not real**. The BENCH2→BENCH3 deltas in §4 above are the true comparison, computed full-vs-full.
   Fixing `selectBaseline` would be a benchmark-harness change and was out of scope.

---

## 7. Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | No new errors; `pattern-intent-resolver.ts` clean (pre-existing errors in 12 unrelated files) |
| `test:intent-resolver` (INT24) | 124 passed, 0 failed |
| `test:intelligence-compound-resolver` (INT33) | 109 passed, 0 failed |
| `test:intelligence-fallback` (INT35) | 82 passed, 0 failed |
| `test:intelligence-conversation-gateway` (INT18) | 64 passed, 0 failed |
| `test:intelligence-observability` (INT35B) | 60 passed, 0 failed |
| `test:intelligence-companion-learning` | 55 passed, 0 failed |
| `test:intelligence-profile-binding` (INT12) | 50 passed, 0 failed |
| `test:intelligence-analyser-binding` (INT17) | 30 passed, 0 failed |
| `test:benchmark-routing` | 101 passed, 0 failed |
| `test:companion-benchmark -- --mode=full` | 100 questions scored; 0 R1; 0 hard gates |
| `test:intelligence-capability-composition` (INT42) | **16 passed, 7 failed — pre-existing.** Verified identical on `bench3-rollback-20260708`; failures are INT42 uplift / opportunity-delivery composition, untouched by BENCH3 |
