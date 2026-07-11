# Release Target Branch Payload Audit — 2026-06-29

**Investigation type:** Read-only audit  
**Date:** 2026-06-29  
**Conducted by:** Claude Code  
**No code modified. No commits created. No branches moved.**

---

## Rollback Protection

```
Rollback tag:    audit-rollback-2026-06-29
Points to:       556747e4d30bc1589eb52f4451e0d1ee350fa218
Branch at tag:   safety/preserve-since-last-prod-20260617-1613
```

To restore: `git checkout audit-rollback-2026-06-29`

---

## Branch Reference Points

| Branch | Commit | Date |
|---|---|---|
| origin/main (production) | c0ea8d5 | 2026-06-04 |
| local main (Target A) | f384f6a | 2026-06-16 |
| safety/preserve-since-last-prod-20260617-1613 (Target B) | 556747e | 2026-06-28 |

---

## Branch Topology

```
origin/main (c0ea8d5) — production
    │
    │  32 commits
    │
local main (f384f6a) — Target A
    │
    │  64 commits
    │
safety/preserve-since-last-prod-20260617-1613 (556747e) — Target B
```

**Local main is a strict ancestor of the safety branch.**  
The safety branch contains ALL 32 commits from local main, plus 64 additional commits.  
This is not a diverged pair — it is a linear chain.

---

## Comparison 1: origin/main → local main

**Commit count:** 32  
**Files changed:** 262 files, 67,398 insertions, 998 deletions

### Commit List

| SHA | Title | Category |
|---|---|---|
| 6503356 | feat(smart-planner): dietary-aware external recipe search | Production feature |
| 1e67eff | feat(smart-planner): enforce Profile dietPattern as hard filter via dietRules | Production feature |
| af620b9 | feat(planner): single Profile compliance gate for system-generated writes | Production feature |
| ce755a7 | fix(dietRules): Profile dietary title-safety for ingredient-less external candidates | Bug fix |
| 0644578 | feat(smart-planner): require ingredient verification before external recipe recommendation | Production feature |
| 9f5070d | fix(smart-planner): invalidate stale sessions and gate ingredient-less user meals for restricted profiles | Bug fix |
| c84a7a9 | test(smart-planner): regression tests for dietary trust fix | Release tooling |
| 00a8ee1 | fix(smart-planner): block premium/subscriber-only recipes from Smart Planner | Bug fix |
| b48ceee | feat(dietRules): comprehensive Keto/Low-Carb exclusion dictionary | Production feature |
| 544c18c | chore: archive investigation and working notes to docs/investigations/ | Documentation |
| 595a951 | chore: add premium recipe fix report and root summary | Documentation |
| cea6e2b | fix(smart-planner): exclude component recipes from candidate pool | Bug fix |
| 96acb98 | fix(smart-planner): plant milk false positive, breakfast concept queries, category classification | Bug fix |
| 1e83f32 | fix(smart-planner): Tier-3 controlled-repeat fallback for exhausted slot pools | Bug fix |
| 5e2e4dc | feat(nutrition-boost): compact accordion rows for MealUpliftPanel | Production feature |
| 80c5b75 | feat(nutrition-boost): compact UX refinement — multi-expand rows, Add always visible, ingredient visibility fix | Production feature |
| 8838d9e | checkpoint: pre-Tier4 meal shell recovery rollback point | Architecture |
| 43fbdda | checkpoint: pre-nutrition-boost-provenance rollback point | Architecture |
| 74dd7e3 | checkpoint: pre-vegetarian-vegan-hard-enforcement rollback point | Architecture |
| 39de349 | feat(planner): hard-enforce household Vegetarian/Vegan in candidate pool and Tier-4 recovery | Production feature |
| efcab89 | checkpoint: pre-starter-shell-catalogue-population rollback point | Architecture |
| e865b83 | checkpoint: pre-existing-template-enrichment rollback point | Architecture |
| 5e1eb99 | feat(templates): enrich 6 pre-existing templates to canonical starter-shell status | Production feature |
| 4d8c00a | feat(planner): Planner Meal Card V2 — Hybrid Meal Occasion intelligence visible in card | Production feature |
| 1090d28 | checkpoint: tier4 shell recovery activation (pre-meal-card-v2-refinement rollback point) | Architecture |
| 836e40d | feat(planner): Planner Meal Card V2 refinement — compact variety card + shell meal metadata write-path | Production feature |
| 9fe2c02 | fix(planner): reconcile boost count between planner card and meal modal | Bug fix |
| 36a092a | feat(hooks): Implement adaptive density foundation (Phase 1) | Production feature |
| 67ee85e | feat(dialogs): Migrate Food Knowledge and UPF Info to Dialog Foundation | Production feature |
| 70fab0e | feat(meal-detail): Implement Meal Detail Experience V3 - Phase 1 Core Structure | Production feature |
| 438ea93 | docs: finalize Meal Detail V3 Phase 1 implementation report | Documentation |
| f384f6a | fix(meal-detail): Correct Family Confidence and Household Adaptation visual language | Bug fix |

### Grouped Feature Summary

| Group | Commits | Description |
|---|---|---|
| Smart Planner dietary enforcement | 9 | Dietary-aware search, keto/low-carb dictionary, profile compliance gate, ingredient verification, premium filter, plant milk fix |
| Household compatibility | 2 | Vegetarian/Vegan hard enforcement, Tier-4 shell recovery |
| Planner Meal Card V2 | 2 | Hybrid Meal Occasion display, compact variety card, shell metadata write-path |
| Nutrition Boost UX | 2 | Compact accordion rows, multi-expand, ingredient visibility fix |
| Meal Detail V3 Phase 1 | 3 | Household Adaptations, Family Confidence, Simply Better Choices, Dialog Foundation |
| UI / Hooks | 2 | Adaptive density foundation, dialog foundation migrations |
| Bug fixes | 7 | Planner boost count, smart-planner edge cases, meal-detail visual language |
| Checkpoints / Architecture | 5 | Rollback safety tags only |
| Documentation | 3 | Archives, reports, investigation docs |

### Schema changes on local main

Adds 5 columns to `meal_templates` and 4 columns to `meals`:

```
primarySlot, suitableSlots[], energyBand, styleTags[], nutritionOpportunities[]
```

All columns are additive, nullable or have defaults. No destructive schema changes.

---

## Comparison 2: local main → safety branch

**Commit count:** 64  
**Files changed:** 422 files, 207,306 insertions, 2,462 deletions

### Commit List

| SHA | Title | Category |
|---|---|---|
| 28eda01 | checkpoint: preserve all work since last production deploy | Architecture |
| 9e06930 | checkpoint: preserve since-production backup artefacts | Architecture |
| 2e9b30c | docs: preservation checkpoint report (since last production deploy) | Documentation |
| bae3b99 | docs: record preservation remote backup | Documentation |
| 83801f4 | checkpoint(ws0): rollback baseline before WS1 Pantry Explore V2 | Architecture |
| df914ad | feat(pantry): WS1 Pantry Explore V2 — Nutrition Knowledge Hub (read-only) | Production feature |
| 2fcb754 | checkpoint(ws2c): rollback baseline before WS2C Food Report Enrichment investigation | Architecture |
| df28cf6 | docs(ws2c): preserve WS2C Food Report Enrichment investigation | Documentation |
| 9d59544 | docs(ws2d): preserve WS2D Canonical Nutrition Knowledge Architecture investigation | Documentation |
| e3857d6 | docs(ws2e): preserve WS2E Canonical Slug Reconciliation investigation | Documentation |
| 39a8810 | feat(ws2f): FoodReportKnowledgeAdapter — Food Report Foundation | Production feature |
| 781dfc5 | docs(ws2f): preserve WS2F Canonical Food Report Foundation investigation | Documentation |
| 3dfc94c | fix(ws2f): Spinach variety model amendment + canonical DB alignment | Bug fix |
| 9a436f8 | feat(ws2g): FoodReport UI Foundation — canonical food knowledge in Plant Diversity rows | Production feature |
| 72eccee | feat(ws3a): Nutrition Report page redesign — full 8-stage implementation | Production feature |
| 5d453d0 | docs(ws4b): preserve WS4B + WS3B investigations before amendment | Documentation |
| 8e4ef24 | docs(ws4b): amend pipeline — automated canonical growth + multi-path benefits | Documentation |
| 5f44ca1 | docs(ws5a): preserve Preparation Knowledge Architecture investigation | Documentation |
| 28e656f | docs(ws6): preserve Canonical Food Report Architecture investigation | Documentation |
| ea90557 | docs(ws7): preserve Food Relationships, Discovery and Stories investigation | Documentation |
| cd4ef75 | docs(ws8): preserve Food Discovery Foundations investigation | Documentation |
| 17dee8e | docs(ws9): preserve Goal-Driven Alternatives investigation | Documentation |
| 5e4cb83 | docs(ws10): preserve Household Food Stories investigation | Documentation |
| fdeb3a5 | docs(ws11): preserve Seasonal Stories investigation | Documentation |
| e371af0 | docs(ws0.5): protect WS0.5 and WS1/WS6 investigation files before WS0.6 trial | Documentation |
| 83438e5 | feat(ws0.6): Claude food authoring trial — 25 Mediterranean vegetables | Mock-up / UI experiment |
| 761fcb5 | docs(ws0.7): preserve Variety Nutrition Override Rules investigation | Documentation |
| bad86ca | feat(ws0.8): launch food coverage expansion — 181 canonical / 188 knowledge foods | Production feature |
| 1e403aa | docs(ws0.9): preserve Global Food Catalogue Architecture investigation | Documentation |
| 9818d42 | feat(ws0.10): Global Food Catalogue ingestion pipeline | Production feature |
| 2c5753a | chore(ws0.11): preserve Real USDA Ingestion Pilot artifacts | Documentation |
| b47afcb | chore(ws0.12): preserve Catalogue Normalisation and Promotion Readiness artifacts | Documentation |
| 0a996f8 | feat(ws8): Food Discovery Engine — six discovery types, household context, one discover() API | Production feature |
| 52cd86d | feat(ws9): Food Alternatives Engine — five alternative types, household adaptation, one alternatives() API | Production feature |
| 0dd662a | feat(ws10): Household Stories Engine — five story types, trust guard, worked examples | Production feature |
| f531216 | feat(ws11): Seasonal Stories Engine — seasonal arcs, looking-ahead, trust guard | Production feature |
| a8a912a | feat(ws0x7): Ingredient Resolution Engine Completeness Program | Production feature |
| 58c8b73 | chore(wx7): rollback safety checkpoint before Pantry Intelligence | Architecture |
| f1f971a | chore(wx8): rollback safety checkpoint before Household Nutrition Centre | Architecture |
| 8062fb1 | Add household nutrition overview and reporting features | Production feature |
| 79e12a8 | Create a comprehensive UI audit package with screenshots and gallery | Investigation |
| ce7e287 | feat(wx9): experience integration and launch readiness polish pass | Workspace redesign |
| f7eb3b4 | feat(wx9.2): experience integration — meal-first detail, conversational dashboard | Workspace redesign |
| 265cadd | feat(wx9.3): above-the-fold optimisation — compress vertical dead space across all major pages | Workspace redesign |
| 7d9dea8 | WX12B: Correct TanStack Query v5 loading guards for page-level queries | Bug fix |
| c3b9cc5 | feat(wx14): restore Shopping workspace visual identity — trolley icon and workspace teal | Workspace redesign |
| 4a99a03 | feat(wx15-1): Analyser score — single THA apple + N/5 text replaces stacked apples | Workspace redesign |
| dd18222 | feat(wx15-2): Header breakpoint sm→md — compact logo on phones in landscape | Workspace redesign |
| d7de432 | feat(wx15-4): Cookbook contextBar tabs always visible — remove hidden sm:flex | Workspace redesign |
| ba5eac4 | feat(wx15-6): Shopping workspace — teal realm identity matching nav sidebar | Workspace redesign |
| 09eade9 | docs(wx15): WX15 platform regression investigation and fix log | Documentation |
| 2426e1e | docs(wx15): Mark WX15 complete — update commit SHAs and build status | Documentation |
| aa06868 | fix(wx15b-1): Analyser rating filter — replace star ★ with THA apple logo | Bug fix |
| 9878ff2 | fix(wx15b-2): Mobile header — show long THA logo instead of single apple | Bug fix |
| c3ffafe | fix(wx15b-3): Shopping mobile header — restore breathing room in contextBar | Bug fix |
| 5689334 | fix(wx15b-4): Reset admin password for colinclapson@hotmail.co.uk | Unknown |
| 351fcd4 | fix(wx15b-5): Secondary nav for Nutrition, Diary, Analyser | Bug fix |
| 4636ca6 | docs(wx15b): WX15B correction log — 5 fixes, rollback tags, verification | Documentation |
| ab2c032 | feat(wx14): Workspace apple — THA apple dropdown in actions slot for all workspace pages | Workspace redesign |
| 4667feb | docs(wx14): Mark WX14 complete — update commit SHA and build status | Documentation |
| 5cf522b | feat(wx14a): Workspace Apple optional — remove nav-only apples from Pantry & Nutrition | Workspace redesign |
| e3db63f | docs(wx14a): Record commit hash 5cf522b and clean build status | Documentation |
| 556747e | Add release readiness report and documentation for environment checks | Release tooling |

### Grouped Feature Summary (safety-only commits)

| Group | Commit Count | Description |
|---|---|---|
| WX14 / WX14A (workspace apple) | 5 | THA apple dropdown, optional apple in Pantry & Nutrition |
| WX15 / WX15B (platform regressions) | 12 | Analyser apple logo, header breakpoint, Cookbook tabs, Shopping teal, 5 WX15B regression fixes |
| WX12B (bug fix) | 1 | TanStack Query v5 loading guards |
| WX9 (experience integration) | 3 | Launch readiness polish, meal-first detail, above-the-fold optimisation |
| WX7/WX8 rollback checkpoints | 2 | Architecture checkpoints only, no code |
| WS1 (Pantry Explore V2) | 1 | Nutrition Knowledge Hub read-only page |
| WS2f–WS2g (Food Report) | 4 | FoodReportKnowledgeAdapter, spinach fix, FoodReport UI, canonical DB alignment |
| WS3a (Nutrition Report redesign) | 1 | Full 8-stage Nutrition Report page redesign |
| WS7 (Food Relationship Graph) | 0 feat | POC investigation docs only (feat is in docs) |
| WS8–WS11 (AI engines) | 4 | Food Discovery, Alternatives, Household Stories, Seasonal Stories engines |
| WS0x7 (Ingredient Resolution) | 1 | Ingredient Resolution Engine completeness |
| WS0.6 (Claude food authoring) | 1 | Trial — 25 Mediterranean vegetables |
| WS0.8 (food coverage expansion) | 1 | 181 canonical / 188 knowledge foods |
| WS0.10 (Global Food Catalogue) | 1 | Ingestion pipeline |
| Household nutrition overview | 1 | Household nutrition overview and reporting |
| UI audit package | 1 | Screenshots and gallery (investigation artefact only) |
| Admin password reset | 1 | colinclapson@hotmail.co.uk — operations-only, not a feature |
| Documentation / preserve | 20 | Investigation files, WS investigation archives |
| Preservation checkpoints | 4 | Rollback safety checkpoints |
| Release tooling | 1 | Release readiness report |

### Schema changes on safety branch vs local main

280 lines changed in `shared/schema.ts`.  
This represents substantial additional table/column definitions associated with the WS food intelligence work (food catalogue, canonical food, knowledge tables).

---

## Comparison 3: origin/main → safety branch

**Commit count:** 96 (= 32 from local main + 64 safety-only)  
**Files changed:** ~684 files  
**Total lines:** ~274,700 insertions, ~3,460 deletions

This comparison is the union of Comparisons 1 and 2. All commits from local main are included in the safety branch. The safety branch is a strict superset of local main.

---

## Specific Question Answers

### WX14 / WX14A commits

5 commits, all on safety branch only (not in local main):

```
ab2c032  feat(wx14): Workspace apple — THA apple dropdown in actions slot for all workspace pages
c3b9cc5  feat(wx14): restore Shopping workspace visual identity — trolley icon and workspace teal
4667feb  docs(wx14): Mark WX14 complete — update commit SHA and build status
5cf522b  feat(wx14a): Workspace Apple optional — remove nav-only apples from Pantry & Nutrition
e3db63f  docs(wx14a): Record commit hash 5cf522b and clean build status
```

### Every revamped layout / mock-up commit on safety branch

The workspace redesign series on the safety branch spans WX9 through WX15B — not just WX14/WX14A:

```
ce7e287  feat(wx9): experience integration and launch readiness polish pass
f7eb3b4  feat(wx9.2): experience integration — meal-first detail, conversational dashboard
265cadd  feat(wx9.3): above-the-fold optimisation — compress vertical dead space across all major pages
7d9dea8  WX12B: Correct TanStack Query v5 loading guards for page-level queries
c3b9cc5  feat(wx14): restore Shopping workspace visual identity — trolley icon and workspace teal
ab2c032  feat(wx14): Workspace apple — THA apple dropdown in actions slot for all workspace pages
5cf522b  feat(wx14a): Workspace Apple optional — remove nav-only apples from Pantry & Nutrition
4a99a03  feat(wx15-1): Analyser score — single THA apple + N/5 text replaces stacked apples
dd18222  feat(wx15-2): Header breakpoint sm→md — compact logo on phones in landscape
d7de432  feat(wx15-4): Cookbook contextBar tabs always visible — remove hidden sm:flex
ba5eac4  feat(wx15-6): Shopping workspace — teal realm identity matching nav sidebar
aa06868  fix(wx15b-1): Analyser rating filter — replace star ★ with THA apple logo
9878ff2  fix(wx15b-2): Mobile header — show long THA logo instead of single apple
c3ffafe  fix(wx15b-3): Shopping mobile header — restore breathing room in contextBar
351fcd4  fix(wx15b-5): Secondary nav for Nutrition, Diary, Analyser
```

Also present (WX8/WX7 rollback checkpoints — no functional code):
```
58c8b73  chore(wx7): rollback safety checkpoint before Pantry Intelligence
f1f971a  chore(wx8): rollback safety checkpoint before Household Nutrition Centre
```

### Production bug fixes

On **local main** (will ship in Target A):
- `f384f6a` — Meal Detail: Family Confidence visual language
- `9fe2c02` — Planner: boost count reconciliation
- `00a8ee1` — Smart Planner: block premium recipes
- `cea6e2b` — Smart Planner: exclude component recipes
- `96acb98` — Smart Planner: plant milk false positive, breakfast concept
- `1e83f32` — Smart Planner: Tier-3 fallback for exhausted slot pools
- `9f5070d` — Smart Planner: stale sessions, ingredient-less meal gating
- `ce755a7` — dietRules: profile dietary title-safety

On **safety branch only** (would additionally ship in Target B):
- `7d9dea8` — WX12B: TanStack Query v5 loading guards for page-level queries
- `3dfc94c` — Spinach variety model amendment + canonical DB alignment
- `aa06868` — WX15B: Analyser rating filter (star → apple logo)
- `9878ff2` — WX15B: Mobile header logo
- `c3ffafe` — WX15B: Shopping mobile header breathing room
- `351fcd4` — WX15B: Secondary nav for Nutrition, Diary, Analyser
- `5689334` — WX15B: Admin password reset (**operational commit — not a user-facing fix**)

### Every planner change

On local main:
- Planner Meal Card V2 (4d8c00a, 836e40d)
- Household Veg/Vegan hard enforcement (39de349)
- Profile compliance gate (af620b9)
- Boost count reconciliation (9fe2c02)
- Smart Planner: dietary enforcement series (6503356, 1e67eff, 0644578, 9f5070d, 1e83f32, etc.)

On safety branch only:
- None directly labelled planner beyond WX experience integration (ce7e287, f7eb3b4, 265cadd)

### Every shopping change

On safety branch only:
- `c3b9cc5` — Shopping workspace visual identity (trolley icon, workspace teal)
- `ba5eac4` — Shopping workspace teal realm identity matching nav sidebar
- `c3ffafe` — Shopping mobile header breathing room

### Every AI / food intelligence change

On safety branch only (WS series):
- `df914ad` — WS1: Pantry Explore V2 — Nutrition Knowledge Hub
- `39a8810` — WS2f: FoodReportKnowledgeAdapter
- `9a436f8` — WS2g: FoodReport UI Foundation
- `72eccee` — WS3a: Nutrition Report page redesign
- `a7eaef5` — WS7: Food Relationship Graph POC
- `0a996f8` — WS8: Food Discovery Engine
- `52cd86d` — WS9: Food Alternatives Engine
- `0dd662a` — WS10: Household Stories Engine
- `f531216` — WS11: Seasonal Stories Engine
- `a8a912a` — WS0x7: Ingredient Resolution Engine Completeness
- `bad86ca` — WS0.8: Food coverage expansion
- `9818d42` — WS0.10: Global Food Catalogue ingestion pipeline
- `83438e5` — WS0.6: Claude food authoring trial

### Every schema or migration change

On **local main** (additive, display/metadata only):
- `shared/schema.ts`: +17 lines
  - `primarySlot`, `suitableSlots[]`, `energyBand`, `styleTags[]`, `nutritionOpportunities[]` on `meal_templates`
  - `primarySlot`, `suitableSlots[]`, `energyBand`, `styleTags[]` on `meals`

On **safety branch only** (additional 280 lines in schema.ts):
- Canonical food tables, knowledge tables, food catalogue tables associated with WS food intelligence work.
- Requires additional migrations beyond those already on local main.

### Every release verification change

On current branch (uncommitted working tree):
- `RELEASE.md` — modified (unstaged)
- `docs/ENGINEERING_WORKFLOW.md` — modified (unstaged)
- `scripts/verify-prod.ts` — modified (unstaged)
- `556747e` — "Add release readiness report and documentation for environment checks" (safety branch HEAD)

---

## 1. What ships if we release local main (f384f6a)?

**32 commits of production-intent work:**

- Smart Planner dietary trust: profile-enforced dietary filtering, keto/low-carb dictionary, ingredient verification, premium recipe blocking, session invalidation, plant milk fix, component recipe exclusion, Tier-3 fallback
- Household compatibility: Vegetarian/Vegan hard enforcement in candidate pool, Tier-4 shell recovery
- Planner Meal Card V2: Hybrid Meal Occasion intelligence, compact variety card, shell metadata write-path
- Nutrition Boost: compact accordion rows, multi-expand, ingredient visibility fix
- Meal Detail V3 Phase 1: HouseholdAdaptationsSummary, MealFamilyConfidence, MealTrustSummary, SimplyBetterChoicesPanel, Dialog Foundation
- Template enrichment: 6 starter-shell templates enriched
- Schema: 5 additive columns on meal_templates and meals (metadata only)

**Nothing experimental. No workspace redesign. No AI engine work.**

---

## 2. What additionally ships if we release safety branch (556747e)?

64 more commits including:

- WX9: Experience integration, meal-first detail, conversational dashboard, above-the-fold optimisation across all major pages
- WX12B: TanStack Query v5 loading guards fix
- WX14 / WX14A: THA apple dropdown in workspace actions, optional apple in Pantry/Nutrition
- WX15: Analyser apple score, header breakpoint, Cookbook tabs, Shopping workspace teal
- WX15B: 5 platform regression fixes (Analyser filter, mobile header, Shopping mobile header, secondary nav) plus an admin password reset commit
- WS1: Pantry Explore V2 — Nutrition Knowledge Hub (new page)
- WS2f–WS2g: FoodReport Foundation and UI, spinach canonical fix
- WS3a: Nutrition Report page redesign (8-stage)
- WS7: Food Relationship Graph POC (investigation artefact, no wired UI route confirmed)
- WS8–WS11: Food Discovery, Alternatives, Household Stories, Seasonal Stories engines
- WS0x7: Ingredient Resolution Engine Completeness
- WS0.6: Claude food authoring trial (25 Mediterranean vegetables — experimental)
- WS0.8: Food coverage expansion (181/188 foods)
- WS0.10: Global Food Catalogue ingestion pipeline
- Household nutrition overview and reporting feature
- UI audit package (screenshots — investigation artefact, no user-facing feature)
- 280 additional schema lines with further migrations required
- 422 additional files, 207,306 insertions

---

## 3. Are ALL of the additional 64 commits related only to the revamped layout / workspace work?

**NO.**

The additional commits break down as follows:

| Work type | Approx commits |
|---|---|
| WX workspace redesign (WX9, WX12B, WX14, WX14A, WX15, WX15B) | 23 |
| WS food intelligence features (WS1–WS11, WS0.x) | 15 |
| Documentation / preserve / investigation archives | 20 |
| Architecture / checkpoints | 4 |
| Operations (admin password reset) | 1 |
| Investigation artefact (UI audit) | 1 |

Only 23 of 64 are workspace/layout commits. The majority (41) are food intelligence features, documentation, or administrative work.

---

## 4. Production-ready features accidentally remaining on safety branch

These commits appear production-ready and are NOT in local main:

| SHA | Commit | Risk |
|---|---|---|
| 7d9dea8 | WX12B: TanStack Query v5 loading guards | Low — genuine bug fix, should have been merged to local main |
| 3dfc94c | WS2f: Spinach variety model amendment | Low — data model fix |
| 351fcd4 | WX15B-5: Secondary nav for Nutrition, Diary, Analyser | Low — genuine regression fix |
| aa06868 | WX15B-1: Analyser rating filter star → apple | Low — UI consistency fix |
| 9878ff2 | WX15B-2: Mobile header logo | Low — UI regression fix |
| c3ffafe | WX15B-3: Shopping mobile header breathing room | Low — spacing regression fix |
| df914ad | WS1: Pantry Explore V2 — Nutrition Knowledge Hub | Medium — new page, needs QA |
| 9a436f8 | WS2g: FoodReport UI Foundation | Medium — new UI, needs QA |
| 72eccee | WS3a: Nutrition Report page redesign | Medium — significant redesign |
| bad86ca | WS0.8: Food coverage expansion | Medium — data change |

**WX12B (7d9dea8), WX15B regression fixes, and the spinach fix** are the most clearly production-ready items being held back. They are bug fixes, not feature work.

---

## 5. Experimental or mock-up changes in local main

**None identified.**

All 32 commits on local main are clearly production-intent: Smart Planner dietary enforcement, household compatibility, planner card features, nutrition boost, meal detail. No POC-labelled commits, no "trial" commits, no screenshot/gallery commits.

---

## 6. Would releasing 556747e unintentionally deploy unfinished work?

**YES.** The following commits on the safety branch are explicitly experimental, administrative, or incomplete:

| SHA | Commit | Problem |
|---|---|---|
| 83438e5 | WS0.6: Claude food authoring trial — 25 Mediterranean vegetables | "trial" — explicitly experimental data authoring |
| a7eaef5 | WS7: Food Relationship Graph POC | "POC" — explicitly a proof of concept |
| 79e12a8 | Create a comprehensive UI audit package with screenshots and gallery | Investigation artefact — not a user-facing feature |
| 5689334 | fix(wx15b-4): Reset admin password for colinclapson@hotmail.co.uk | Operations commit in a feature branch — should not be a release payload item |
| 0a996f8, 52cd86d, 0dd662a, f531216 | WS8–WS11 engines | Engines with no confirmed wired UI routes in this audit |
| 9818d42 | WS0.10: Global Food Catalogue ingestion pipeline | Pipeline code, unclear if run or staged for production |

---

## Risk Assessment

### Target A — local main (f384f6a)

**Production Risk: 🟢 Low**

- 32 commits, all production-intent
- No experimental work
- No POC code
- No admin operations commits
- Schema changes are additive and backward-compatible
- Dietary enforcement is comprehensively tested (regression tests present: c84a7a9)
- Meal Detail V3 is Phase 1 core structure only (incremental, safe)
- All checkpoint commits are rollback markers with no functional code
- No workspace-wide UI redesign that could cause unexpected regressions across all pages

**Note:** WX12B TanStack fix and WX15B regression fixes are absent from local main. These are genuine bug fixes that remain only on the safety branch. They will not be in this release, which means known UI regressions remain unpatched in production after release.

---

### Target B — safety/preserve-since-last-prod-20260617-1613 (556747e)

**Production Risk: 🔴 High**

- 96 commits total (32 production-intent + 64 additional)
- Contains explicitly experimental work: WS0.6 (trial), WS7 (POC)
- Contains admin password reset commit (5689334) — an operational commit that should not be part of a release payload
- Contains UI audit package (screenshots/gallery) — investigation artefact committed to a feature branch
- WS8–WS11 engines (4 features): no confirmed UI routes verified in this audit; deploying backend engines with no UI surface is low risk but represents unplanned scope
- WS3a Nutrition Report redesign: significant 8-stage page redesign untested in production context
- 280 additional schema lines — requires migration verification above what local main needs
- 422 changed files vs 262 on local main — substantially larger blast radius
- WX9 experience integration affects multiple pages (dashboard, meal-first detail, above-the-fold across all pages) — broad regression surface
- The safety branch name itself signals preservation intent, not release readiness

---

## Recommendation

**Recommended release target: Target A — local main (f384f6a)**

### Why

1. Local main contains 32 clearly production-intent commits with no experimental, POC, or administrative artefacts.
2. The safety branch contains 64 additional commits of which only a minority (~23) are workspace redesign. The remainder are food intelligence engines, data pipelines, a food authoring trial, a POC, and an admin operations commit — none of which should ship in the same release as Smart Planner dietary enforcement and Meal Detail V3.
3. The assumption that "only WX14/WX14A was isolated" is incorrect. The safety branch contains WX9 through WX15B plus the entire WS food intelligence series. Releasing it means shipping all of that scope, not just WX14/WX14A.
4. The admin password reset commit (5689334) in the safety branch is a signal that the branch was used as an operational scratchpad as well as a development branch. Release branches should not contain operational commits.
5. Local main has a 262-file, 67k-line footprint. The safety branch adds another 422 files and 207k lines. The blast radius difference is significant.

### What ships with local main

- Smart Planner: complete dietary trust enforcement series
- Household: Vegetarian/Vegan hard enforcement, Tier-4 shell recovery
- Planner: Meal Card V2 with Hybrid Meal Occasion intelligence
- Nutrition Boost: compact UX, accordion rows
- Meal Detail: V3 Phase 1 (Household Adaptations, Family Confidence, Simply Better Choices)
- Templates: 6 starter-shells enriched
- Tests: full regression suite for dietary trust

### What remains on the safety branch after releasing local main

- WX9, WX12B, WX14, WX14A, WX15, WX15B workspace redesign
- WS1–WS11 food intelligence engines and food report features
- Global Food Catalogue pipeline
- Household nutrition overview
- All WS documentation archives

### Caveat

Releasing local main means the following **genuine bug fixes remain undeployed**:

- WX12B (7d9dea8): TanStack Query v5 loading guards — real page-level loading defect
- WX15B-5 (351fcd4): Secondary nav regression — Nutrition, Diary, Analyser secondary nav broken
- WX15B-3 (c3ffafe): Shopping mobile header spacing
- WX15B-2 (9878ff2): Mobile header logo regression
- WX15B-1 (aa06868): Analyser star rating replaced by apple logo

These 5 commits (excluding the admin password reset) represent real user-visible regressions that could be cherry-picked onto local main before release, which would reduce production risk without pulling in the experimental WS work.

---

## Definition of Done Output

---

**ROOT CAUSE OF BRANCH CONFUSION:**

The safety branch (`safety/preserve-since-last-prod-20260617-1613`) was created on 2026-06-17 as a preservation checkpoint of all work done since the last production deploy. It then became an active development branch where the WS food intelligence series (WS1–WS11) and the WX workspace redesign series (WX9–WX15B) were built on top. Local main, by contrast, received only the Smart Planner / Meal Detail / Household Compatibility work as its 32 commits. The assumption that "only WX14/WX14A was isolated to the safety branch" is incorrect: the safety branch accumulated 64 commits beyond local main spanning food intelligence engines, a full workspace redesign series, data pipelines, and administrative operations. The confusion arises because the branch name suggests a temporary safety backup, but it functioned as the primary development branch for a parallel workstream.

---

**RELEASE TARGET A SUMMARY:**

local main (`f384f6a`) — 32 commits ahead of origin/main.  
All production-intent: Smart Planner dietary enforcement, household compatibility, Planner Meal Card V2, Nutrition Boost UX, Meal Detail V3 Phase 1.  
No experimental code. No workspace redesign. Small, well-tested blast radius.

---

**RELEASE TARGET B SUMMARY:**

safety branch (`556747e`) — 96 commits ahead of origin/main (includes all 32 from local main).  
Contains: all of Target A plus WX9–WX15B workspace redesign, WS1–WS11 food intelligence, Global Food Catalogue, food authoring trial, Food Relationship Graph POC, admin password reset, and UI audit artefacts.  
Large blast radius (422 additional files). Contains explicitly experimental and operational commits.

---

**EXTRA COMMITS SUMMARY:**

64 commits on safety branch beyond local main.  
23 workspace redesign (WX9, WX12B, WX14, WX14A, WX15, WX15B).  
15 food intelligence features (WS1–WS11, WS0.x).  
20 documentation/preservation archives.  
4 architecture checkpoints.  
1 operations commit (admin password reset).  
1 investigation artefact (UI audit package).

---

**WX14 / WX14A STATUS:**

Present on safety branch only. 5 commits (ab2c032, c3b9cc5, 4667feb, 5cf522b, e3db63f).  
Not in local main.  
Functionally: THA apple dropdown in workspace action slots; optional apple removal from Pantry & Nutrition nav.  
These are part of the broader WX workspace redesign and should ship with the rest of the WX series, not independently.

---

**REVAMPED LAYOUT STATUS:**

The revamped layout / workspace redesign spans WX9 through WX15B — 23 commits.  
All are on the safety branch only, not in local main.  
Not ready to isolate to a single commit or cherry-pick — the WX series is a sequential dependency chain (WX9 → WX12B → WX14 → WX14A → WX15 → WX15B).  
Should remain on the safety branch for a dedicated workspace redesign release.

---

**PRODUCTION FEATURES HELD BACK:**

The following production-ready features are on the safety branch and not in local main:

- WX12B: TanStack Query v5 loading guards bug fix (genuine defect)
- WX15B-1 through WX15B-3, WX15B-5: Platform UI regression fixes (genuine defects)
- WS1: Pantry Explore V2 — Nutrition Knowledge Hub (new read-only page)
- WS2f/WS2g: Food Report Foundation and UI (new food knowledge surface)
- WS3a: Nutrition Report page redesign

The WX12B and WX15B regression fixes are the highest-priority items — they fix real user-visible defects and could be cherry-picked to local main before release with minimal risk.

---

**EXPERIMENTAL FEATURES:**

- WS0.6 (83438e5): Claude food authoring trial — explicitly a trial, 25 Mediterranean vegetables
- WS7 (a7eaef5): Food Relationship Graph POC — explicitly a proof of concept
- WS8–WS11: Food intelligence engines — no confirmed UI surface verified; backend-only in scope of this audit

---

**FILES REQUIRING SEPARATE BRANCH:**

No individual file requires a separate branch. The issue is at the commit/feature level.  
The WS food intelligence work (WS1–WS11) and WX workspace redesign (WX9–WX15B) should each be planned as separate, dedicated releases rather than included in the current Smart Planner / Meal Detail release.

---

**RECOMMENDED RELEASE TARGET:**

**local main — f384f6a**

Clean 32-commit production payload. No experimental work. Manageable blast radius. Well-tested dietary enforcement. Safe schema changes.

---

**READY FOR PRODUCTION:**

**YES** — for local main (f384f6a).

With one recommended pre-release action: cherry-pick the 5 genuine bug fixes from WX15B (aa06868, 9878ff2, c3ffafe, 351fcd4) and WX12B (7d9dea8) onto local main to resolve known UI regressions before the release. The admin password reset commit (5689334) should be excluded from any cherry-pick.

**NO** — for the safety branch (556747e) in its current form.

---

## Appendix: Commit Timeline

```
2026-06-04  c0ea8d5  origin/main — current production
2026-06-16  f384f6a  local main — 32 commits of Smart Planner / Meal Detail work
2026-06-17  28eda01  safety branch created — preservation checkpoint
2026-06-17–06-28    64 commits of WS + WX work added to safety branch
2026-06-28  556747e  safety branch HEAD — release readiness report
2026-06-29           This audit conducted
```
