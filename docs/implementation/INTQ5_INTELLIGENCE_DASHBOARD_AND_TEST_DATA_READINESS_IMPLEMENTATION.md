# INTQ5 — Intelligence Dashboard Clarity & Benchmark Test-Data Readiness — Implementation Report

**Workstream:** INTQ5
**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Status:** Delivered — (1) the Admin → Intelligence dashboard is reworked for a non-specialist admin with chart-based summaries and a plain-English explanation beside every chart; (2) a full dev benchmark test-data readiness audit with recommended minimum fixtures.

> **Guardrails honoured.** No Companion behaviour changed. No benchmark scoring meaning changed — the dashboard renders `result.json` verbatim and never re-scores; display bucketing reuses the framework's own constants (`PASS_THRESHOLD = 70`, `HEADLINE_PASS = 75`, `HEADLINE_PARTIAL = 60`). No production data was created — the audit is read-only and the fixture proposal is a recommendation, not seeded rows.

---

## Part A — Dashboard clarity

### A.1 The problem

The INTQ4 dashboard (`client/src/pages/admin-intelligence-page.tsx`) was correct but **specialist-only**: it assumed the reader already knew the scoring framework. Scores, domains, personalities, households, and dimensions were all rendered as dense tables of means; the only chart was the trend line. A human admin could not tell, at a glance, *is this safe*, *is this good enough*, or *what do I do next*.

### A.2 What changed

Every scope item is delivered. The page still renders one run's artefact verbatim — the change is entirely presentational.

| Scope item | Delivered | Where |
|---|---|---|
| Improve dashboard layout | ✅ | Re-ordered to a safety-first → quality → where-to-improve → history flow |
| Replace text-heavy sections with explanation cards | ✅ | `DashboardGuide` (3-step "how to read this"), per-chart `InsightNote`, dimension "what it asks" column |
| Chart: PASS / PARTIAL / FAIL split | ✅ | `OutcomeSplitCard` — donut of per-question outcomes (pass ≥70 no gate · watchlist <70 · safety fail = gated) |
| Chart: domain scores | ✅ | `ScoreBarCard` — horizontal bars, colored by band, 70 pass line |
| Chart: personality scores | ✅ | `ScoreBarCard` |
| Chart: household scores | ✅ | `ScoreBarCard` (+ capability scores, same component) |
| Chart: benchmark trend over time | ✅ | Trend `LineChart` retained, now with a clean-pass reference line + delta-vs-first note |
| Chart: release readiness blockers | ✅ | `Release Readiness` card — plain verdict sentence + blockers/warnings as callout rows |
| Plain-English explanation beside each chart | ✅ | `InsightNote` ("What this shows" + "Do next") on every chart |
| Show what the score means & the next action | ✅ | Headline tiles carry band hints; every `InsightNote` computes a concrete next action from the run |

### A.3 Design decisions

- **Safety-first reading order.** The new `DashboardGuide` teaches the exact triage order the framework demands: (1) *Is it safe?* — gates and the safety panel are a release blocker regardless of score; (2) *Is it good enough?* — the 0–100 headline with its ≥75 / 60–74 / <60 bands; (3) *Where to improve?* — the score-bar charts. The dashboard body then follows that order.
- **Charts over tables where a glance beats a scan.** Domain / capability / household / personality rollups are now horizontal bar charts sorted worst-first, each bar colored by band (green ≥75, amber 60–74, red <60, and red on any gate) with a dashed 70 pass line. The dimension breakdown stays a table (it is genuinely tabular — weight × points × band %) but gains a plain-English "what it asks" column and a band-colored band %.
- **A computed next action, not generic advice.** Each `InsightNote.action` is derived from the run: it names the weakest group, the number of watchlist questions, or the specific gate that fired. E.g. the household chart tells the admin *"A safety gate fired in Allergy Family — fix those first"* when it did.
- **World Mode banner — the load-bearing caveat.** A new `WorldModeBanner` states, in plain English, that a `single-world` run is **indicative, not reproducible** (it ran against the admin's own live household, not the six fixed benchmark households, because those fixtures do not exist yet — see Part B). This is the honest bridge between the dashboard and the readiness audit: it stops an admin from trusting a single-world number as a certified score.
- **Colour discipline (dataviz skill).** Status colours (green/amber/red) are reused from the app's existing verdict palette and are always paired with a label, icon, or value — identity never rests on colour alone. Score magnitude uses one sequential green hue. Charts disable animation for a calm, print-stable render and theme against `var(--background)` for dark mode.

### A.4 Verification

- **Type-check:** `tsc --noEmit` — **0 errors** attributable to `admin-intelligence-page.tsx`. (Pre-existing unrelated errors elsewhere in the WIP branch are untouched.)
- **Consumers unaffected:** the only external references are the route in `client/src/App.tsx` and the apple-menu link in `nav-bar.tsx`; both are unchanged. All prior `data-testid`s are preserved and new ones added (`card-guide`, `card-world-mode`, `card-outcome-split`, `card-domains`, …).
- **No re-scoring:** the page imports no scorer/aggregate code; it reads `/api/intelligence/benchmark/*` only.

---

## Part B — Dev benchmark test-data readiness audit

**Question asked:** does dev have enough test data to make benchmark results meaningful?

**Headline answer: No — not for a *certified/reproducible* score.** The deterministic-households world the framework is built around **does not exist**, so every benchmark today runs in `single-world` mode against organic, drifting user data. Domain *knowledge* (foods, nutrients, additives) is rich and ready; **household-scoped world data — especially diary/trend/evidence and any deterministic fixture — is the gap.**

### B.1 Method

Read the governing framework (`docs/intelligence/benchmark/BENCHMARK_HOUSEHOLDS.md`, `…_SCORING_FRAMEWORK.md`, `…_EXECUTION_PROCESS.md`) and the INTQ4 report, then took a read-only census of the dev database (`server/db.ts`, `pg`) and the design-time knowledge seeds (`shared/knowledge/*`, `shared/canonical/*`, `server/seeds/*`). No rows were written.

### B.2 Findings by category

| Coverage area | Required (per framework) | Present in dev | Verdict |
|---|---|---|---|
| **Benchmark households** | 6 fixed households `9001–9006`, checksummed (`households.v1.json`) | **0** — IDs `9001–9006` absent; `households.v1.json` seed contract does not exist | 🔴 **Missing** |
| **Meals / cookbook** | ~35 across the 6 households, allergen-/diet-correct | 2 176 organic meals (not deterministic, not diet-verified per benchmark household) | 🟠 Volume yes, benchmark-fit no |
| **Pantry items** | ~94 across the 6 (from 6 staples to a 35-item rich pantry) | 13 919 organic items | 🟠 Volume yes, benchmark-fit no |
| **Planner weeks** | H4 "this week" present, "next week" absent (grounded/gap discrimination pair) | 402 planner weeks / 502 entries, organic | 🟠 No deterministic this-vs-next pair |
| **Shopping list data** | present for rich households (H4/H5) | 651 lists / 132 extras, organic | 🟠 Volume yes, benchmark-fit no |
| **Diary entries** | H5 needs **28 entries / 14 days**; H3 needs **14 entries / 28 plants per week**; ~73 diary entries total across the 6 | **10 entries total, 7 diary days** (user 1: 9, user 58: 1) | 🔴 **Critically thin** — trend/growth minimum-sample gates cannot clear |
| **Product / additive knowledge** | broad UK additive coverage for Product Intelligence questions | **~300 additives** (`server/seeds/additives-seed.ts`) | 🟢 **Ready** |
| **Nutrition knowledge** | food/nutrient/benefit graph for Food Knowledge + Nutrition questions | **264** knowledge foods, **30** nutrients, **15** health benefits; **313** canonical foods | 🟢 **Ready** |
| **Failed / edge-case examples** | fabrication traps + honest-gap generators (H1 thin, H6 empty, must-not-exist facts) | **None instantiated** — traps are specified in the doc but no household exists to run them against | 🔴 **Missing** |
| **Evidence & Learning signals** | H5 dense diary → detected patterns/growth signals | `household_evidence_events` = 0, `household_learning_signals` = 0 | 🔴 **Missing** |

*Census figures are the dev DB at audit time (2026-07-04) and the design-time seed array lengths; organic counts are shared/mutable and are the reason single-world is not reproducible.*

### B.3 Interpretation

1. **The score is real but not certifiable.** Every question genuinely runs through the one Companion seam, so a single-world run is a valid smoke test. But because the world drifts, the number is **not reproducible and not comparable run-over-run** — exactly the property the framework says a score must have to mean anything (`SCORING_FRAMEWORK §7`). The dashboard now says this in the World Mode banner.
2. **Knowledge is not the bottleneck; world data is.** Product/additive and nutrition knowledge are well-seeded, so Product Intelligence and Food Knowledge questions can be answered on real data today. The gap is entirely in **household-scoped world state** — and most acutely in **diary/trend/evidence**, where 10 total entries cannot clear the minimum-sample gates that H3/H5's trend, plant-diversity, Companion Growth, and Evidence & Learning questions depend on.
3. **Whole categories cannot be scored honestly yet.** With no deterministic households: household-ground-truth hard gates **G1 (fabrication), G2 (unsafe recommendation), G4 (cross-household leak)** cannot fire against known truth (INTQ4 already reports these as honestly un-fired); the grounded/gap **discrimination pairs** (H4 this-week vs next-week; H1 vs H5 "my goal") don't exist; and the **honest-gap doctrine** (H1 thin, H6 empty) has nothing to be tested against.

### B.4 Recommended minimum deterministic dev fixtures (the gap)

The single highest-leverage fix is to **author `docs/intelligence/benchmark/fixtures/households.v1.json` and its idempotent seeder** — already named as follow-on work #1 in the INTQ4 report and specified in `BENCHMARK_HOUSEHOLDS.md §2–3`. That one artefact closes four of the five red rows above. Minimum deterministic contents (fixed IDs, clock-relative timestamps, checksum-locked):

| Household | Members / eaters | Pantry | Diary | Meals | Templates | Partners | The edge it unlocks |
|---|---|---|---|---|---|---|---|
| **H1** Solo Simplifier (`9001`) | 1 / 1 | 6 staples | 3 / 7d | 2 | 0 | 1 | Honest gaps on thin data (no goal, no next-week plan) |
| **H2** Allergy Family (`9002`) | 4 / 4 | ~20 (nut/sesame-free) | 10 / 7d | 6 | 1 | 2 | Safety gate **G2**, per-eater constraints, peanut-vs-tree-nut honesty |
| **H3** Plant-Forward Couple (`9003`) | 2 / 2 | ~18 vegan | **14 / 7d, 28 plants/wk** | 7 | 1 | 2 | Vegan exclusion enforcement, plant-diversity signal |
| **H4** Busy Mixed Family (`9004`) | 3 / 3 | ~35 | 18 / 7d | 12 | 2 | 3 | Full surface; **this-week plan present, next-week absent** pair |
| **H5** Health-Goal Tracker (`9005`) | 1 / 1 | ~15 | **28 / 14d** | 8 | 1 | 1 | Trends, Companion Growth, Evidence & Learning signals |
| **H6** New Onboard (`9006`) | 1 / 1 | empty | empty | 0 | 0 | 0 | Cold-start honest gaps + onboarding guidance |
| **Totals** | ~11 / ~17 | ~94 | **~73 entries** | ~35 | 5 | ~9 | — |

Notes for whoever authors the fixture:
- **Diary density is the make-or-break line.** H5's 28-entry/14-day and H3's 28-plants/week counts are the specified thresholds that let trend/growth/evidence intelligence produce a *real, non-empty, correct* answer. Under-seeding these silently reduces those questions to honest-gaps and hides regressions. Today's DB has 10 entries total — the fixture must add ~73 deterministic ones.
- **"Must-not-exist" facts are fixtures too.** The fabrication traps (H1 has no health goal; H2 has no peanut record; H4 has no next-week plan; H6 has nothing) are what make G1/D1/D2 testable. They cost no rows but must be asserted by the seeder as *absent*.
- **Evidence/learning signals** should be a *derived* seed step: seed H5's dense diary, then run the existing Observation/Evidence pipeline so `household_evidence_events` / `household_learning_signals` populate through the real path (not hand-written rows) — keeping the benchmark honest to the one-seam invariant.
- Scope is bounded and additive: this unlocks `deterministic-households` world mode and Certification with **no re-architecture** (INTQ4 already carries the `worldMode` / `householdLabel` paths). A pinned judge (follow-on #2) is a separate, parallel unblock for D1/D2/D5/D6 *degree* grading.

### B.5 What is NOT needed

Product/additive and nutrition knowledge are sufficient — **do not** expand them for benchmark readiness. Organic dev volume (meals, pantry, planner, shopping) is ample and should be left alone; the fix is deterministic fixtures, not more organic data.

---

## Part C — Files touched

| File | Change |
|---|---|
| `client/src/pages/admin-intelligence-page.tsx` | Reworked for clarity: `DashboardGuide`, `WorldModeBanner`, `OutcomeSplitCard` (PASS/PARTIAL/FAIL donut), `ScoreBarCard` (domain/capability/household/personality bar charts), `InsightNote` on every chart, plain-English release-readiness + dimension explanations. No re-scoring; renders `result.json` only. |
| `docs/implementation/INTQ5_INTELLIGENCE_DASHBOARD_AND_TEST_DATA_READINESS_IMPLEMENTATION.md` | This report. |

## Part D — Deliverables checklist

- ✅ Clearer Admin Intelligence dashboard (safety-first flow, guide card, explanation beside every chart)
- ✅ Chart-based benchmark summary (outcome donut, score bars, trend, readiness callouts)
- ✅ Dev test-data readiness audit (Part B.2, by category, with a verdict each)
- ✅ Recommended fixture gaps (Part B.4 — the `households.v1.json` seed contract + per-household minimums)
- ✅ Guardrails: no Companion behaviour change · no scoring-meaning change · no production data created
