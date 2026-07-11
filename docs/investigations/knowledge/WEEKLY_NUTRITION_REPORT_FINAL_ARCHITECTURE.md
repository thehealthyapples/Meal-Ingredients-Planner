# THA Weekly Nutrition Report — Final Architecture

**Document type:** Architectural decision document (investigation only — no implementation).
**Date:** 2026-06-17
**Author role:** Senior nutrition-education product architect + senior React/Node engineer.
**Supersedes / extends:** `docs/investigations/knowledge/WEEKLY_NUTRITION_REPORT_AND_CAUTION_FOODS_MODEL.md`
(prior investigation; its findings are carried forward and widened here).

---

## 0. ROLLBACK & SAFETY HEADER

| Item | Value |
|---|---|
| **Rollback tag** | `rollback/weekly-nutrition-arch-investigation-20260617` |
| **Tag object SHA** | `c765b8c81fc39a07a827cfd03dcf9e8f744815e7` |
| **Points to commit** | `bae3b99` (`bae3b992e021abe32182dcf13f9aff7f1e708a95`) |
| **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Restore command** | `git reset --hard rollback/weekly-nutrition-arch-investigation-20260617` |
| **Undo this doc only** | `rm docs/investigations/knowledge/WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md` |

**Required rollback steps — completed before investigation began:**

1. ✅ **Git status confirmed clean.** `git status --porcelain` returned no output. Unlike the prior
   investigation (which ran on a dirty `main`), this task started on a fully committed tree — all
   work since the last production deploy is committed and backed up on
   `safety/preserve-since-last-prod-20260617-1613`, with remote backup verified
   (commits `9e06930`, `28eda01`, `2e9b30c`, `bae3b99`).
2. ✅ **Current branch confirmed:** `safety/preserve-since-last-prod-20260617-1613`.
3. ✅ **Rollback tag created:** `rollback/weekly-nutrition-arch-investigation-20260617` (annotated).
4. ✅ **Rollback identifier reported** (above) before any investigation work.

**This task makes no code, CSS, schema, API, migration, or data change. The only artefact it
creates is this single markdown file plus one annotated git tag.** Full confirmation in §14.

---

## SECTION 1 — EXECUTIVE SUMMARY

THA needs a **weekly nutrition story** that is wider than 30 Plants but does not collapse five
already-distinct experiences into one blurred surface. The prior investigation established the
foundational finding and it holds: **THA has already built ~70% of the engines a Weekly Nutrition
Report needs.** They are per-meal or per-product, never aggregated into a week, and the
caution/occasional half is product-scoped (Analyser) with no ingredient-level model.

This document settles the **final architecture**: how the Weekly Nutrition Report, Plant Diversity,
Pantry Explore, Analyser and Simply Better Choices stay **separate but connected**.

**The five experiences each answer one question and must keep answering only that question:**

| Surface | The one question it answers | Scope |
|---|---|---|
| **Plant Diversity** | *How diverse were my plants this week?* | Weekly, plants only, positive |
| **Pantry Explore** | *What can I add?* | Evergreen knowledge, positive only |
| **Analyser** | *Is this product a good choice?* | Single product, authoritative, evidence-backed |
| **Simply Better Choices** | *How can I improve this meal?* | Single meal, additive suggestions |
| **Weekly Nutrition Report** | *How did my whole week look?* | Weekly synthesis + connective tissue |

**Core architectural decision:** the Weekly Nutrition Report is an **aggregation shell**, not a new
engine and not a new data source. It consumes the existing `useWeekMealEntries` seam, **embeds the
existing Plant Diversity Report body as Section 1**, aggregates existing per-meal engines into the
middle sections, and **deep-links out** to the Analyser (for product decisions) and to Simply Better
Choices (for meal improvement). It owns the *narrative*; the specialist surfaces remain authoritative
for their domain.

**The single most important guardrail:** every section that could make a health or risk claim is
**gated on a source-backed, curated registry that does not yet exist.** Until that registry ships,
those sections ship as **honest shells** (the same discipline already shipped in
`health-benefits-model.ts`, where every `healthBenefits` array is `[]`). No AI-generated health
content. No "bad food" framing. No causation language.

**Recommended sequence (unchanged from prior, reaffirmed): A → B → C → D → E.**
Build the **source-backed Health Benefits registry first** (it unblocks two already-shipped empty
surfaces and proves the claim-safety pattern), then the **Caution Foods *model*** (read-only), then
the **Weekly Report shell**, then **Analyser deep-links**, then optional **Pantry Explore expansion**.

---

## SECTION 2 — PRODUCT ARCHITECTURE

### 2.1 The mental model: four nouns, one weekly verb

```
        POSITIVE / ADDITIVE                     DECISION / BALANCE
   ┌──────────────────────────┐          ┌──────────────────────────┐
   │  Pantry Explore           │          │  Analyser                 │
   │  "What can I add?"        │          │  "Is this a good choice?" │
   │  (evergreen, food-led)    │          │  (per product, evidence)  │
   └──────────────────────────┘          └──────────────────────────┘
              ▲                                       ▲
              │ links to add                          │ links to compare
   ┌──────────┴───────────────┐          ┌────────────┴──────────────┐
   │  Simply Better Choices    │          │  (caution / occasional    │
   │  "How can I improve       │          │   framing lives here +    │
   │   THIS meal?" (per meal)  │          │   in the Report only)     │
   └──────────────────────────┘          └───────────────────────────┘
              ▲                                       ▲
              └──────────────┬────────────────────────┘
                             │
              ┌──────────────┴───────────────┐
              │   WEEKLY NUTRITION REPORT     │   ← connective tissue
              │   "How did my whole week      │     (aggregation shell)
              │    look?"                     │
              │   ├─ §1 Plant Diversity ──────┼──► embeds Plant Diversity body
              │   ├─ §2–9 weekly synthesis    │
              │   └─ deep-links out everywhere│
              └──────────────┬────────────────┘
                             ▲
              ┌──────────────┴───────────────┐
              │   PLANNER (the week's data)   │   ← source of truth for "what I ate"
              └───────────────────────────────┘
```

### 2.2 Layering rules

1. **Planner is the data spine.** It owns the week's meals. Plant Diversity and the Weekly Report
   both read the same week via `useWeekMealEntries()` / `/api/planner/full`. Neither stores a
   duplicate week.
2. **The Report is a view, not an engine.** It performs *arithmetic and synthesis* over existing
   curated tags and existing engine outputs. It introduces **no new scoring** and **no new health
   claims** of its own — claims live in the registries it reads.
3. **Specialist surfaces stay authoritative.** Analyser = product judgement. Plant Diversity =
   plant count. Simply Better Choices = meal additions. The Report never re-derives these; it
   summarises and links.
4. **Positive vs decision split is preserved.** Pantry Explore + Simply Better Choices live on the
   *positive/additive* side and never carry caution content. Caution/occasional content lives only
   in the Report and the Analyser.

### 2.3 What is genuinely net-new vs reused

| Capability | Status | Where |
|---|---|---|
| Weekly aggregation shell | **net-new** (thin) | new route `/weekly-nutrition` |
| Plant Diversity section | reuse as-is | `PlantDiversityReport.tsx` (container-agnostic) |
| Nutrition Strengths / Gaps | reuse + aggregate | `nutrition-insights.ts`, `nutrition-variety.ts` |
| Better Additions / Simply Better Choices | reuse + aggregate | `nutrition-boosts.ts` |
| Choose Better (products) | reuse via deep-link | `analyser-view-model.ts`, `analyser-choice.ts` |
| Health Benefits registry data | **net-new data** (gated) | future registry behind `health-benefits-model.ts` |
| Protein & Whole Foods data | **net-new data** (gated) | future curated table |
| Caution Foods model | **net-new** (read-only classifier) | future ingredient-tier classifier + alt table |
| `sources` field (claims) | **net-new schema** (gated) | future registry + `additives` table |

---

## SECTION 3 — SURFACE RESPONSIBILITIES

Strict ownership to prevent overlap and duplicate logic.

### 3.1 Weekly Nutrition Report — *"How did my whole week look?"*
- **Owns:** weekly synthesis, the narrative arc across all sections, the connective links.
- **Does NOT own:** product scoring (Analyser), plant counting logic (`nutrition-variety`), meal
  improvement suggestions (Simply Better Choices), any curated health claim (registry).
- **Reads:** the week (`useWeekMealEntries`), plus the outputs of every engine below.
- **Rule:** if a number or claim can be produced by a specialist surface, the Report **links to it**
  rather than recomputing it.

### 3.2 Plant Diversity Page — *"How diverse were my plants this week?"*
- **Owns:** the 30-plant target, category coverage (9 categories incl. Fermented Foods),
  per-category completion suggestions, the Plant × Benefits × Nutrients × Meals report table.
- **Does NOT own:** anything non-plant (protein, dairy, fermented *dairy*, occasional foods).
- **Stays standalone** (`/plant-diversity`) AND is **embedded as Report Section 1** (its body
  component is already container-agnostic). See §5 navigation.

### 3.3 Pantry Explore — *"What can I add?"*
- **Owns:** the evergreen positive knowledge hub — Health Benefits / Key Nutrients / Foods lenses,
  `pantry-knowledge.howToChoose` ("how to choose well"), addition-focused education.
- **Does NOT own:** any caution/occasional content, any weekly aggregation, any product score.
- **Rule:** stays **100% positive** (see §9). Caution never enters Explore in the first build.

### 3.4 Analyser — *"Is this product a good choice?"*
- **Owns:** the single source of truth for product judgement — `upfScore`, THA/Apple rating, NOVA,
  additive risk split, `scoreDrivers`, editorial `thaReview`, `swaps`, `buildWhyBetter`,
  `rankChoices`. Owns the **"occasional" framing for real products with real ingredient lists.**
- **Does NOT own:** weekly narrative, ingredient-level guesses where no scan exists.
- **Rule:** authoritative numbers only for **resolved/scanned products** (the
  `shared/apple-score-trust.ts` gate). Never fabricates a score for an unresolved item.

### 3.5 Simply Better Choices — *"How can I improve this meal?"*
- **Identity confirmed:** "Simply Better Choices" is the **user-facing rename of the meal-level
  Nutrition Boost / "Better Additions" engine** (`nutrition-boosts.ts` → `MealUpliftPanel.tsx`;
  internal names unchanged). It is per-meal, additive, and lives in the meal-detail modal / planner
  card. (See `SIMPLY_BETTER_CHOICES_RENAME.md`.)
- **Owns:** contextual "add this to this meal" suggestions (`getMealBoosts`), meal-type aware,
  filtered for items already present.
- **Does NOT own:** weekly view, product judgement, caution classification.
- **Rule:** stays additive and positive ("add a protective side"), never "remove the bad thing".

### 3.6 Planner — *the week's data + the launch pad*
- **Owns:** the week's meals (the data every weekly surface reads), and the **entry-point links**
  to both Plant Diversity and the Weekly Report.
- **Does NOT own:** any nutrition synthesis itself (it links out).

### 3.7 Anti-overlap matrix

| Logic | Single owner | Everyone else |
|---|---|---|
| Plant detection / categories | `nutrition-variety.ts` | reads via Plant Diversity body |
| Product UPF / additive / score | Analyser (`upf-analysis-service`, `analyser-view-model`) | deep-link only |
| Meal addition suggestions | `nutrition-boosts.ts` (Simply Better Choices) | Report aggregates top picks, links to the meal |
| Health-benefit claims | future sourced registry behind `health-benefits-model.ts` | every surface reads, none invents |
| Caution / occasional framing | future caution model + Analyser | never in Explore or Simply Better Choices |
| The week's meals | Planner / `useWeekMealEntries` | Plant Diversity + Report read the same seam |

---

## SECTION 4 — WEEKLY NUTRITION REPORT SECTIONS

Nine sections as briefed. For each: **purpose · data source · current availability · claim risk ·
ships as shell only? · needs curated data? · needs schema change? · links to which surface.**

> **Legend** — Availability: ✅ ready / 🟡 partial (engine exists, not aggregated) / 🔴 needs new data.
> Claim risk: Low / Med / High.

### §1 Plant Diversity
- **Purpose:** how diverse were my plants this week (the flagship positive metric).
- **Data source:** `PlantDiversityReport.tsx` + `nutrition-variety.ts` + `useWeekMealEntries`.
- **Availability:** ✅ ready (shipped page, container-agnostic body).
- **Claim risk:** **Low** — it's a count with an explicit "approximation based on ingredient names"
  disclaimer.
- **Shell only?** No — fully functional today; embed as-is.
- **Curated data?** No (uses existing).
- **Schema change?** No.
- **Links to:** Plant Diversity standalone page (deep link) and Pantry Explore ("add more plants").

### §2 Nutrition Strengths
- **Purpose:** what the week did well — a positive synthesis ("7 plant categories, fermented foods 3×,
  omega-3 twice").
- **Data source:** aggregate of `nutrition-insights.getMealNutrients` tags + plant categories covered
  + fermented/omega-3 tags across the week. **Arithmetic over existing curated tags.**
- **Availability:** 🟡 partial (tags exist per-meal; no weekly aggregator).
- **Claim risk:** **Low–Med** — safe at "source of / includes" level; **becomes Med** if it phrases a
  benefit ("supports immunity"), which requires the registry.
- **Shell only?** Can ship as a **counts-only** shell first (no benefit phrasing), upgrade once
  registry exists.
- **Curated data?** Counts: no. Benefit phrasing: **yes** (registry).
- **Schema change?** No (counts) / via registry (phrasing).
- **Links to:** Pantry Explore (deepen a strength), Plant Diversity.

### §3 Nutrition Gaps
- **Purpose:** what could be **added** (never "what you did wrong") — the "add" story.
- **Data source:** `NUTRIENT_GOALS` (nutrition-insights) + missing plant categories from the Plant
  Diversity body → "what's absent" diff.
- **Availability:** 🟡 partial (goal map + missing categories exist; not diffed weekly).
- **Claim risk:** **Med** — must stay "you could add X for more Y" not "you are deficient in Y".
- **Shell only?** Yes initially (show missing plant categories only — zero claim risk), expand with
  registry.
- **Curated data?** Plant categories: no. Nutrient→food framing: light, exists; richer needs registry.
- **Schema change?** No.
- **Links to:** Pantry Explore (the add hub), Simply Better Choices (add to a specific meal).

### §4 Protein & Whole Foods
- **Purpose:** is the week getting quality protein and whole foods (not just plants).
- **Data source:** **partly net-new.** Plant protein exists in `nutrition-benefit-library`
  (tofu, beans, lentils, seeds = "Plant Protein"). **Animal protein quality, dairy/calcium,
  fish/omega-3 are NOT modelled.** Whole-food vs packaged exists at the product level
  (`basket-item-classifier`) but not at the meal-ingredient level for a weekly roll-up.
- **Availability:** 🔴 needs new curated data (animal protein, dairy, fish) + a meal-level whole-food tag.
- **Claim risk:** **Med** — "good source of protein" is low; "complete protein / protein quality"
  needs care and sourcing.
- **Shell only?** Yes — ship a "coming soon" shell; do not fabricate protein quality.
- **Curated data?** **Yes** (new protein/dairy/fish table, separately approved).
- **Schema change?** Possibly (if storing per-food protein quality with sources).
- **Links to:** Pantry Explore (protein-rich additions), Analyser (protein content on a scanned product).

### §5 Fermented Foods
- **Purpose:** is the week including fermented foods (gut-health-adjacent, framed safely).
- **Data source:** **split.** Fermented *plant* foods are **already a Plant Diversity category**
  (`FERMENTED_FOODS` in `nutrition-variety`). Fermented *dairy* (kefir, yogurt) lives in
  `pantry-knowledge` (positive) but is **not a plant** and is not counted by the plant counter.
- **Availability:** 🟡 partial — plant-fermented ✅; dairy-fermented exists as knowledge but not
  aggregated; no unified "fermented this week" count.
- **Claim risk:** **Med** — must avoid gut-health overreach ("improves your microbiome / cures IBS").
  Safe: "fermented foods like X were on your plates this week".
- **Shell only?** Can ship as a **count of fermented items** (low risk); benefit phrasing waits on
  registry.
- **Curated data?** Count: no. Gut-health phrasing: **yes** (registry, carefully sourced).
- **Schema change?** No.
- **Links to:** Plant Diversity (the fermented category), Pantry Explore.
- **⚠️ Boundary note:** to avoid double-counting, fermented *plants* belong to Plant Diversity's
  category total; the Fermented section presents a **cross-cut view** (plant + dairy ferments) and
  must label it as a different lens, not a competing count.

### §6 UPF / Additives
- **Purpose:** how processed was the week's packaged content (awareness, not alarm).
- **Data source:** **Analyser is the only authority.** `upf-analysis-service` (UPF score, NOVA,
  additive risk split) + `additives` DB. Per-week roll-up = count of flagged scanned products only.
- **Availability:** 🟡 partial — full per-product engine ✅; no weekly roll-up; **only valid for
  scanned/resolved products** (trust gate).
- **Claim risk:** **High** — additive risk wording is the highest-risk text in the product. The
  `additives` table **has no `source` field today** — risk levels are internal heuristics, not
  citable claims.
- **Shell only?** Yes — summarise *counts* and link to the Analyser; do **not** restate risk claims
  in the Report until `additives` has sources.
- **Curated data?** Uses existing additive data; **needs `sources` before public risk wording.**
- **Schema change?** **Yes** — `sources` on `additives` (gated, separately approved).
- **Links to:** **Analyser** (deep-link per flagged product) — authoritative source of truth.

### §7 Occasional Foods
- **Purpose:** name foods *worth understanding* (processed meats, high-UPF, packaged) **without
  shaming** — "best enjoyed occasionally".
- **Data source:** **net-new read-only caution classifier** (see §8). Product-tier defers to the
  Analyser (real ingredient list); ingredient-tier is a cautious keyword classifier (bacon, sausage,
  ham, salami…), labelled as an approximation.
- **Availability:** 🔴 net-new (the only genuinely new classifier).
- **Claim risk:** **High** — the single biggest brand/safety risk in the whole report.
- **Shell only?** Yes — can ship the *section frame* with copy guidance before the classifier exists.
- **Curated data?** **Yes** — caution editorial + a caution-food → alternatives table; sourced.
- **Schema change?** No for the classifier (read-only); sources live with curated editorial.
- **Links to:** **Analyser** (scan to compare), Simply Better Choices (balance the plate).

### §8 Choose Better Next Time
- **Purpose:** product-level improvement opportunities surfaced from the week.
- **Data source:** **Analyser** — `analyser-view-model` + `analyser-choice` (`buildWhyBetter`,
  `rankChoices`). **Already mature; do not re-implement.**
- **Availability:** ✅ engine ready; 🟡 not surfaced from a weekly view.
- **Claim risk:** **Med** — comparative claims ("fewer additives") are factual/derived, lower risk
  than absolute health claims, but still gated on the trust state.
- **Shell only?** It is a **thin index that deep-links** — not a shell, not a re-build.
- **Curated data?** No (reuses Analyser).
- **Schema change?** No.
- **Links to:** **Analyser** (one flagged product → one deep link; respects `apple-score-trust`).

### §9 Better Additions / Simply Better Choices
- **Purpose:** simple foods to add to the week's meals — the closing positive note.
- **Data source:** `nutrition-boosts.getMealBoosts` aggregated to the week's top suggestions.
- **Availability:** ✅ engine ready; 🟡 not aggregated weekly.
- **Claim risk:** **Low** — additive, positive, already shipped tone.
- **Shell only?** No — functional via existing engine.
- **Curated data?** No.
- **Schema change?** No.
- **Links to:** **Simply Better Choices** (the specific meal's modal), Pantry Explore.

### 4.1 Section summary table

| # | Section | Avail. | Claim risk | Shell-only first? | Needs curated data | Needs schema | Links to |
|---|---|---|---|---|---|---|---|
| 1 | Plant Diversity | ✅ | Low | No | No | No | Plant Diversity, Explore |
| 2 | Nutrition Strengths | 🟡 | Low–Med | Yes (counts) | Phrasing only | No | Explore |
| 3 | Nutrition Gaps | 🟡 | Med | Yes | Light | No | Explore, Simply Better Choices |
| 4 | Protein & Whole Foods | 🔴 | Med | Yes | **Yes** | Maybe | Explore, Analyser |
| 5 | Fermented Foods | 🟡 | Med | Yes (counts) | Phrasing only | No | Plant Diversity, Explore |
| 6 | UPF / Additives | 🟡 | **High** | Yes | Existing + sources | **Yes (sources)** | Analyser |
| 7 | Occasional Foods | 🔴 | **High** | Yes | **Yes** | No (read-only) | Analyser, Simply Better Choices |
| 8 | Choose Better Next Time | ✅/🟡 | Med | Index, not shell | No | No | Analyser |
| 9 | Better Additions / SBC | ✅/🟡 | Low | No | No | No | Simply Better Choices, Explore |

**Three sections (4, 6, 7) are the gating ones.** Six can ship safely as counts/shells/indexes with
no new claims.

---

## SECTION 5 — NAVIGATION MODEL

### 5.1 The flow

```
        PLANNER  (the week's meals — data spine + launch pad)
           │  two distinct links (kept separate):
           ├──────────────► PLANT DIVERSITY  (/plant-diversity)  — standalone, deep-linkable
           └──────────────► WEEKLY NUTRITION REPORT  (/weekly-nutrition)  — new route
                                   │
                                   │  §1 embeds the Plant Diversity body
                                   ├──► PLANT DIVERSITY page (full view / deep link)
                                   ├──► PANTRY EXPLORE   "What can I add?"
                                   ├──► ANALYSER         "Is this product a good choice?"  (§6, §7, §8)
                                   └──► SIMPLY BETTER CHOICES  "Improve this meal"  (§9, opens the meal)
                                   
   PANTRY EXPLORE ──(optional, low-priority)──► back to WEEKLY REPORT  ("see your week")
   ANALYSER / SIMPLY BETTER CHOICES ──► SHOPPING  (act on a better choice)
```

### 5.2 The four navigation questions — answered

1. **Does Plant Diversity remain standalone?** **Yes.** `/plant-diversity` persists unchanged
   (deep links, the planner counter, muscle memory all keep working). It is never destroyed.
2. **Is Plant Diversity embedded as Section 1 of the Weekly Report?** **Yes** — the
   `PlantDiversityReport` body is already container-agnostic (no Dialog shell), so the *same
   component* renders as Report §1 with zero rework. This is the "hybrid" end-state: standalone page
   **and** embedded section share one component.
3. **Does the Planner keep separate links to both?** **Yes.** The Planner links to Plant Diversity
   *and* to the Weekly Report as **two distinct entry points** — Plant Diversity is the fast,
   single-purpose view; the Report is the full story. Do not collapse them into one link.
4. **Does Pantry Explore link back to the Weekly Report?** **Optional and low-priority.** A single
   "see how your week looked" affordance is acceptable later, but Explore's primary job is
   evergreen "what can I add?" and must not be turned into a report launcher. Defer to last.

### 5.3 Routing facts (verified)
- Existing routes: `/plant-diversity` ✅, `/pantry` ✅, `/analyser` (= ProductsPage) ✅,
  `/planner` & `/weekly-planner` ✅, shopping routes ✅.
- **No `/weekly-nutrition` route exists** — confirms the Report is net-new.
- Analyser deep-link pattern is proven: `/analyser?q=<query>&shop=<retailer>`
  (`weekly-planner-page.tsx:3858`, `PlannerMealPickerPanel.tsx:658`). The Report reuses this exact
  seam for §6/§7/§8 — no new integration mechanism needed.

---

## SECTION 6 — DATA SOURCE MAP

| Data need | Lives in | Type | Status |
|---|---|---|---|
| The week's meals | `useWeekMealEntries` / `/api/planner/full`, `/api/meals` | live | ✅ |
| Plant detection + 9 categories | `client/src/lib/nutrition-variety.ts` | curated keyword | ✅ |
| Plant × benefits × nutrients table | `PlantDiversityReport.tsx` + benefit library | curated | ✅ |
| Per-meal nutrient tags | `nutrition-insights.getMealNutrients` | curated keyword | ✅ |
| Nutrient → goal → food map | `nutrition-insights.NUTRIENT_GOALS` | curated (small, goal-led) | ✅ |
| Food → key nutrients + summary | `nutrition-benefit-library.ts` (~30, **plant-only**) | curated | ✅ (plant-only) |
| Store-cupboard "why / how to choose" | `pantry-knowledge.ts` (~40, some animal foods) | curated | ✅ |
| Meal addition suggestions | `nutrition-boosts.getMealBoosts` | curated, meal-type keyed | ✅ |
| Product UPF / NOVA / additive risk | `server/lib/upf-analysis-service.ts` + `additives` DB | computed + DB | ✅ |
| Product display model + swaps | `analyser-view-model.ts` | computed | ✅ |
| Choose-better ranking | `analyser-choice.ts` | computed | ✅ |
| Apple-score trust gate | `shared/apple-score-trust.ts` + `basket-item-classifier.ts` | rule | ✅ |
| **Health-benefit outcomes (sourced)** | future registry behind `health-benefits-model.ts` | curated + **sources** | 🔴 empty by design |
| **Animal protein / dairy / fish quality** | — | curated | 🔴 does not exist |
| **Caution / occasional classifier** | — | read-only keyword + Analyser | 🔴 does not exist |
| **Caution-food → alternatives** | sibling of `whole-food-alternatives` (UPF-only today) | curated | 🔴 no meat entries |
| **`sources` / citations** | future field on registry + `additives` table | schema | 🔴 missing |

**Reading of the map:** the Report's *positive/arithmetic* sections (1, 2, 3, 5-count, 9) draw
entirely from green rows. Every red row is a **gated, separately-approved** data or schema task —
and each one maps onto a section that ships as a shell until it lands.

---

## SECTION 7 — CLAIM SAFETY & TRUST RULES

### 7.1 Banned vocabulary (never render)
`bad food` · `dangerous` · `carcinogenic` · `causes cancer` · `toxic` · `poison` ·
`cure` / `prevent` / `treat` · `detox` · `unhealthy` · `avoid` · `banned` · `guilt` framing ·
any "this food causes / cures disease X" · any AI-generated health claim.

### 7.2 Approved vocabulary
`source of` · `rich in` · `includes` · `supports` / `associated with` / `may help` (only with a
source) · `best enjoyed occasionally` · `choose better when you choose it` · `balance the plate` ·
`add a protective side` · `compare options`.

### 7.3 The three-tier claim ladder (when sources are required)

| Tier | Example | Source backing required? | Until then |
|---|---|---|---|
| **Content** | "rich in magnesium", "source of fibre" | Lower-risk; provenance note when registry formalises | Can ship (already curated) |
| **Benefit / outcome** | "magnesium supports normal muscle function" | **Yes** — NHS / BHF / EFSA / WHO / peer-reviewed review | **Shell only** (no phrasing) |
| **Caution / risk** | processed-meat / additive framing | **Yes** — and capped at "occasional"; never causation | **Shell only** |

### 7.4 Hard rules
1. **No outcome is ever derived from free-text or AI.** Keep `getFoodHealthProfile`'s shipped
   discipline: an outcome appears **only** when a curated, sourced registry entry exists; otherwise
   the honest empty state renders.
2. **Many-to-many, never one-food-one-disease.** Use the support model from
   `THA_30_PLANTS_MODAL_V2_SUPPORT_MODEL_AMENDMENT.md`. Frame at the nutrient/area level
   ("contributes to heart health"), never the diagnosis level.
3. **Trust gate governs every number.** Authoritative Apple/THA scores show **only** for
   resolved/scanned products. Unresolved items get "scan to compare", never a fabricated score.
4. **Disclaimers everywhere.** Reuse the shipped `HEALTH_DISCLAIMER` ("educational, not medical
   advice"). Add for caution content: an **"associations, not causation"** note and an
   **"individual needs vary — consult a professional"** note. Keep the **approximation disclaimer**
   ("based on ingredient names") on every keyword classifier, including the new caution one.
5. **Counts are always safe.** "7 plant categories", "fermented foods 3×" carry no claim. When in
   doubt, ship the count and defer the phrasing.

### 7.5 Is a `sources` field needed before public claims? — **Yes.**
A `sources` array — `{ body, title, url, lastReviewed }` — must exist on the future Health Benefit
registry entry **and** on the `additives` table **before** any benefit phrasing or additive-risk
wording is shown as a public claim (rather than an internal heuristic). This is a schema change
requiring separate approval and is the prerequisite for Phases A and the §6 risk wording.

---

## SECTION 8 — CAUTION FOODS DESIGN (DESIGN ONLY — DO NOT IMPLEMENT)

### 8.1 Principle
Caution foods are **not forbidden** — they are *worth understanding*. The model must be a
**read-only classifier over existing data**, never a stored judgement on a user, never a moral label.

### 8.2 Two tiers of detection

1. **Product tier (already real — use it).** When an item is a **resolved/scanned product**, the
   Analyser already classifies UPF/additives/NOVA and produces "occasional" wording from a **real
   ingredient list**. Caution status here is **evidence-backed** and must **defer entirely to the
   Analyser**. This is the source of truth for product-level caution.
2. **Ingredient tier (net-new, keyword — must be cautious).** A small word-list classifier mirroring
   `nutrition-variety.ts`'s pattern: processed-meat terms (bacon, sausage, ham, salami, hot dog,
   chorizo), high-UPF/packaged signals. **Approximate** — same false-positive risk the plant counter
   documents (e.g. "Quorn bacon", "veggie sausage") — and must be **labelled an approximation,
   never a hard claim.**

### 8.3 Illustrative shape (future — not to be built now)
```ts
type OccasionalReason =
  | "processed-meat" | "high-upf" | "high-additive"
  | "high-salt" | "high-sugar" | "low-fibre-frequent";

interface CautionSignal {
  ingredientOrProduct: string;
  reason: OccasionalReason;
  framing: "occasional";          // never "bad" / "avoid" / "banned"
  // downstream copy pulls from balance + alternatives + Analyser — never invented here.
}
```

### 8.4 How specific foods are represented
- **Bacon, sausages, ham, salami (processed meats):** ingredient-tier `processed-meat`, framed
  "best enjoyed occasionally". *Choose better when you choose it* (salt/additives/meat content) →
  **Analyser** on a scanned product. *Balance the plate* → Simply Better Choices boosts. *More
  regular alternatives* (eggs, beans, mushrooms, smoked salmon, tofu) → new caution-food →
  alternatives table (sibling of `whole-food-alternatives`, which today has no meat entries).
- **High-UPF / high-additive packaged items:** **product tier** → defer to Analyser (real data),
  never a keyword guess where a scan exists.
- **Packaged foods generally:** the `apple-score-trust` gate decides — scanned ⇒ Analyser authority;
  unscanned ⇒ "scan to compare", no score.

### 8.5 When the Analyser must be the source of truth
Whenever a **real ingredient list exists** (resolved/scanned). The ingredient-tier classifier is a
fallback for un-scanned meal ingredients only, and only ever produces "occasional" framing —
**never a score, never a risk percentage, never a disease claim.**

### 8.6 How to avoid shaming / how to say "occasional" safely
- Frame at the **food-as-part-of-a-week** level, not the person. "Bacon is great occasionally" not
  "you ate too much bacon".
- Always pair caution with a **positive action** (balance / better choice / alternative) — never a
  bare warning.
- Use additive framing (what to add to balance), not subtractive moralising (what to cut).
- Cap all language at "occasional / choose better"; never causation, never fear.

---

## SECTION 9 — HEALTH BENEFITS / POSITIVE NUTRITION DESIGN

### 9.1 How Health Benefits, Nutrients, Foods and Meals connect
```
   HEALTH BENEFIT (sourced, many-to-many)
        │  e.g. "supports heart health" — area-level, cited
        ▼
   NUTRIENT  (e.g. Omega-3, Fibre, Magnesium)
        │  many-to-many: a food has several; a nutrient is in several foods
        ▼
   FOOD  (nutrition-benefit-library / pantry-knowledge entry)
        │  detected by keyword in the week's meals
        ▼
   MEAL  (the week's planner entries — "Used In")
```
This is the spine already defined by `health-benefits-model.ts` — the registry is the missing data,
not the missing shape. Plant Diversity already renders this exact chain
(Plant × Benefits × Nutrients × Meals); the wider report reuses the **same terminology**.

### 9.2 The four confirmations
1. **Does Pantry Explore stay positive and addition-focused?** **Yes** — it is the home of additions,
   benefits and nutrients. It never carries caution content.
2. **Does caution content stay out of Pantry Explore initially?** **Yes** — caution lives only in the
   Report and the Analyser for the first build. (An optional, much-later read-only "Better Choices"
   lens in Explore could surface existing positive `pantry-knowledge.howToChoose` guidance — that is
   *choose-well*, not *caution* — but it is the lowest priority and not recommended for v1.)
3. **Should the Health Benefits registry come before caution foods?** **Yes** — it unblocks two
   already-shipped empty surfaces (Plant Diversity Report, Pantry Explore), proves the
   source-backing + disclaimer pattern that caution content must reuse, and is lower-risk to get
   right first.
4. **Does Plant Diversity use the same Health Benefits terminology?** **Yes — and this must be
   enforced.** Plant Diversity already consumes `health-benefits-model.ts`. The wider report,
   Explore, and the registry must share one vocabulary (`COLUMN_LABELS`, `TERMINOLOGY`,
   `EMPTY_STATES`, `HEALTH_DISCLAIMER`) so the connected experience reads as one product.

### 9.3 Positive-nutrition data gaps to fill (registry phase)
- `nutrition-benefit-library` is **plant-only**; animal protein, dairy/calcium, fish/omega-3 need
  curated, sourced entries before §4 (Protein & Whole Foods) can phrase anything.
- Fermented *dairy* knowledge exists in `pantry-knowledge` but is not connected to a benefit area —
  the registry should connect it (carefully, no gut-health overreach).

---

## SECTION 10 — RELATIONSHIP TO EXISTING WORK

| Existing work | Relationship to this architecture |
|---|---|
| Connected Health Benefits experience (just shipped: Plant Diversity Report page + Pantry Explore + `health-benefits-model.ts`) | **Foundation.** The Report embeds the Plant Diversity body as §1 and reuses the shared model. The empty states are the shells the registry fills. |
| `WEEKLY_NUTRITION_REPORT_AND_CAUTION_FOODS_MODEL.md` (prior investigation) | **Superseded/extended.** Its 6-section model is widened here to 9 sections (adds Protein & Whole Foods, Fermented Foods, splits UPF/Additives from Occasional Foods). Sequence A→E reaffirmed. |
| `THA_30_PLANTS_MODAL_V2_SUPPORT_MODEL_AMENDMENT.md` | **Governs claim safety** — the many-to-many primary/secondary support model is the rule for §2/§4/§5/§9 phrasing. |
| Simply Better Choices rename (`SIMPLY_BETTER_CHOICES_RENAME.md`) | **Identity confirmed** — SBC = the meal-level boost engine; it is the §9 surface and the "improve this meal" deep-link target. Internal names unchanged. |
| Analyser (`analyser-view-model`, `analyser-choice`, `upf-analysis-service`, `apple-score-trust`) | **Authoritative for §6/§7/§8.** The Report links in; never re-implements. |
| `nutrition-boosts`, `nutrition-insights`, `nutrition-variety`, `whole-food-alternatives` | **Reused engines** for §1/§2/§3/§5/§9. The only extension needed is a meat entry set in the alternatives table (caution phase). |
| `useWeekMealEntries` hook | **The aggregation seam** — the Report consumes the same hook as Plant Diversity, making it naturally deep-linkable and decoupled. |

**Net:** nothing here rebuilds shipped work. The Report is connective tissue layered on top of an
already-built, deliberately "separate but connected" foundation.

---

## SECTION 11 — RECOMMENDED IMPLEMENTATION SEQUENCE

Five options were posed; the recommended ordering is **A → B → C → D → E** (each step shippable,
reversible, and adding no unsourced claim).

| Phase | Option | What | Why this order | Risk |
|---|---|---|---|---|
| **A** | Health Benefits registry (source-backed) | Populate `healthBenefits` honestly; many-to-many, per-food, cited. Add `sources` field. | **Build first** — unblocks two shipped empty surfaces; establishes the source+disclaimer pattern every later phase reuses. | **Med** (claim discipline) — but highest value-per-risk |
| **B** | Caution Foods *model* (read-only) | Ingredient-tier keyword classifier (processed meat first) + caution-food→alternatives table; product-tier defers to Analyser. No stored judgements, no claim beyond "occasional". | After A so it inherits the proven claim-safety + sourcing pattern. Thin and read-only. | **High** (tone/shaming) — mitigated by A's pattern + copy gate |
| **C** | Weekly Report shell (aggregation) | New `/weekly-nutrition` route on `useWeekMealEntries`; embed Plant Diversity §1; aggregate strengths/gaps/better-additions; render gated sections as shells. | After A+B so the high-risk sections have real, safe data to show; the low-risk sections can ship immediately. | **Low–Med** (it's a view) |
| **D** | Analyser integration (deep links) | §6/§7/§8 link each flagged product into the Analyser via the proven `/analyser?q=…` seam; respect the trust gate. | After C so there's a report to link from. No re-implementation. | **Low** |
| **E** | Pantry Explore expansion (optional) | Optional read-only "Better Choices" lens surfacing existing positive `howToChoose`. No caution content. | Last, optional, lowest value. | **Low** |

**Prerequisite spanning A & the §6 risk wording:** the `sources` schema field on the registry **and**
`additives` must land before any benefit phrasing or additive-risk claim ships publicly.

**Why not the alternatives:**
- *Caution first (B before A)* — would build the highest-risk surface before the claim-safety pattern
  is proven. Rejected.
- *Report shell first (C before A)* — possible (the low-risk sections work without A), but it would
  ship a report full of empty shells with no payoff; A delivers visible value to surfaces that are
  *already live and empty*. A first is strictly better.
- *Analyser integration first (D)* — nothing to link from yet. Rejected as a starting point.
- *Explore expansion first (E)* — lowest value, optional. Rejected as a starting point.

---

## SECTION 12 — RISKS (with per-phase rating)

| # | Risk | Phase(s) | Rating | Mitigation |
|---|---|---|---|---|
| 1 | Shaming / negative tone drift | B, C(§7) | **High** | "occasional"-only vocabulary; additive (not moralising) framing; reuse Analyser tone; copy-review gate |
| 2 | Keyword false positives (e.g. "veggie sausage") | B | **Med** | approximation disclaimer; prefer product-tier where a scan exists |
| 3 | Fabricated certainty / scores for unresolved items | B, D | **High** | `apple-score-trust` gate; never invent ingredient-level scores; "scan to compare" |
| 4 | Health-claim overreach (cure/prevent) | A, C(§2/§4/§5) | **High** | §7 rules; many-to-many sourced registry; disclaimers; **no AI health content** |
| 5 | Missing curated data for new sections (protein/dairy/fish) | C(§4) | **Med** | each section's data is a separately-approved task; ship only sections whose data exists; shells otherwise |
| 6 | Engine drift / duplication (re-building Choose Better) | C, D | **Med** | deep-link to Analyser; one source of truth |
| 7 | Schema gap on sources (additives have risk, no citation) | A, C(§6) | **High** | add `sources` field **before** treating any risk wording as a public claim |
| 8 | Double-counting fermented foods (plant vs cross-cut) | C(§5) | **Low** | Fermented section is a labelled cross-cut lens, not a competing count |
| 9 | Churning brand-new work (restructuring day-old Plant Diversity) | C | **Low** | reuse the container-agnostic body; standalone page persists; never destroyed |
| 10 | Navigation overload (Planner → too many links) | C | **Low** | two clear entry points (Plant Diversity + Report); Explore→Report deferred |

**Per-phase aggregate rating:** A = **Med-High** (claim discipline), B = **High** (tone + fabrication),
C = **Low-Med** (view, but inherits §6/§7 risk), D = **Low**, E = **Low**.

---

## SECTION 13 — FINAL RECOMMENDATION

1. **Build the Weekly Nutrition Report as an aggregation shell, not an engine.** It consumes
   `useWeekMealEntries`, embeds the existing Plant Diversity body as §1, aggregates existing engines
   for the middle sections, and deep-links out for everything authoritative.
2. **Keep the five experiences separate but connected.** Each answers exactly one question; the
   Report is the connective tissue. No surface re-implements another's logic (§3 matrix).
3. **Nine sections, three of them gated.** Sections 1, 2(counts), 3, 5(counts), 8(index), 9 can ship
   now with no new claims. Sections 4 (Protein & Whole Foods), 6 (UPF/Additives risk wording) and
   7 (Occasional Foods) ship as **honest shells** until their gated data/schema lands.
4. **Navigation:** Plant Diversity stays standalone **and** is embedded as §1; the Planner keeps two
   distinct links (Plant Diversity + Report); Pantry Explore→Report is optional and last.
5. **Data direction:** widen, don't rebuild. The only net-new data/schema are the **source-backed
   Health Benefits registry**, the **animal protein/dairy/fish entries**, the **caution
   classifier + meat alternatives table**, and a **`sources` field** on the registry and `additives`.
6. **Claim safety is the gating constraint:** banned-vocabulary list enforced; sourced, many-to-many,
   "occasional"-capped; trust-gate-respecting; disclaimers everywhere; **no AI-generated health
   content**; counts are always the safe fallback.
7. **Sequence: A (registry) → B (caution model) → C (report shell) → D (Analyser links) →
   E (Explore, optional).**
8. **Caution lives in Report + Analyser only.** Pantry Explore and Simply Better Choices stay
   positive and additive.

### Stop conditions before any implementation
Implementation must **not** begin until **all** of these are explicitly approved as separate work:

- [ ] **Phase A data-population approval** — building/populating the Health Benefits registry is a
      separate, approved task (this document does not authorise it).
- [ ] **`sources` schema change approval** — adding the citations field to the registry and
      `additives` is a schema change requiring sign-off before any claim ships.
- [ ] **Copy-safety sign-off** — the banned/approved vocabulary and disclaimer set (§7) reviewed and
      owned by a named reviewer, especially for §7 Occasional Foods and §6 additive wording.
- [ ] **Caution model design approval** — the read-only classifier scope (ingredient-tier keyword +
      product-tier defer-to-Analyser) approved, including the false-positive disclaimer.
- [ ] **Per-section data confirmation** — for each gated section, confirm the curated data exists and
      is sourced *before* that section moves from shell to live.
- [ ] **No public health claim** ships ahead of its source backing — content-tier (counts/"source of")
      only until benefit/caution tiers are sourced.

**After this report, STOP. This is the architectural decision document only.**

---

## SECTION 14 — CONFIRMATION: NO CHANGES MADE

- ✅ No application code changed.
- ✅ No UI / CSS changed.
- ✅ No schema changed.
- ✅ No API changed.
- ✅ No migrations run.
- ✅ No data populated / no health-benefit backfill / no registry data created.
- ✅ No caution-food classifier implemented.
- ✅ No Weekly Nutrition Report implemented.
- ✅ No health claims made.
- ✅ No AI called for health content.
- ✅ Only artefacts created: **this investigation file** + **one annotated rollback git tag**
  (`rollback/weekly-nutrition-arch-investigation-20260617`).

**Data impact:** reads existing code/data only; writes no data; changes the meaning of no existing
data; requires no backfill now. All future data/schema work is **separately approved** per §13.

---

## FINAL REPORT CHECKLIST (brief requirement)

1. **Rollback identifier:** `rollback/weekly-nutrition-arch-investigation-20260617`
   (tag SHA `c765b8c…`, points to `bae3b99`). ✅ §0
2. **Current branch:** `safety/preserve-since-last-prod-20260617-1613`. ✅ §0
3. **Confirmation no code changes made:** ✅ §14
4. **Recommended Weekly Nutrition Report architecture:** aggregation shell, 9 sections, 3 gated. ✅ §2,§4
5. **Recommended surface boundaries:** §3 ownership matrix (five surfaces, one question each). ✅ §3
6. **Recommended navigation model:** Planner → Report (Plant Diversity embedded §1 + standalone),
   deep-links to Explore/Analyser/SBC/Shopping. ✅ §5
7. **Recommended data model direction:** widen-don't-rebuild; net-new = sourced registry + protein/
   dairy/fish entries + caution classifier/alt table + `sources` field. ✅ §6
8. **Recommended claim-safety rules:** banned/approved vocabulary, 3-tier claim ladder, trust gate,
   disclaimers, sources-before-claims, no AI health content. ✅ §7
9. **Recommended implementation sequence:** A → B → C → D → E. ✅ §11
10. **Risk rating per phase:** A Med-High, B High, C Low-Med, D Low, E Low. ✅ §12
11. **Stop conditions before implementation:** six explicit gates. ✅ §13
