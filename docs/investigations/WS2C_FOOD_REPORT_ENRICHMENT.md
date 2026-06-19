# WS2C — Food Report Enrichment

**Document type:** Investigation + architecture (investigation only — **no implementation**).
**Date:** 2026-06-19
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**Author role:** Senior nutrition-education product architect + senior React/Node engineer.

**Companion documents (read these first — WS2C builds directly on them):**
- `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` — the "nutrient bridge" trust model + V1 knowledge data plan. **WS2C is the report-assembly layer that consumes that registry.**
- `WS2A_CANONICAL_FOOD_FOUNDATIONS_IMPLEMENTATION.md` — Canonical Food / Variety / Alias identity (shadow mode).
- `WS2B_VARIETY_SURFACING_IMPLEMENTATION.md` — Your Variety / Broaden Your Variety (read-only).
- `WS1_PANTRY_EXPLORE_V2_IMPLEMENTATION.md` / `PANTRY_V2_NUTRITION_KNOWLEDGE_HUB.md` — the Pantry Explore hub.
- `THA_HEALTH_BENEFITS_CONNECTED_EXPERIENCE_IMPLEMENTATION.md` — the shared display model + "separate but connected" surfaces.

---

## 0. ROLLBACK & SAFETY HEADER

| Item | Value |
|---|---|
| **Rollback tag** | `ws2c-rollback-baseline` |
| **Points to commit** | `2fcb754` |
| **Parent (prior tip)** | `df914ad` (`feat(pantry): WS1 Pantry Explore V2`) |
| **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Restore command** | `git reset --hard ws2c-rollback-baseline` |
| **Undo this doc only** | `rm docs/investigations/WS2C_FOOD_REPORT_ENRICHMENT.md` |

**Required first step — completed before investigation began:**

1. ✅ **Git status checked.** Working tree carried uncommitted **WS2A + WS2B** work (modified `PlantDiversityReport.tsx`, `health-benefits-model.ts`, `shared/schema.ts`, `package.json`; untracked `shared/canonical/`, canonical seed/test/docs).
2. ✅ **WS2A + WS2B work protected.** All of it was committed in the checkpoint below — nothing is left only in the working tree.
3. ✅ **Rollback point created** as commit `2fcb754` + annotated tag `ws2c-rollback-baseline`:
   > `checkpoint(ws2c): rollback baseline before WS2C Food Report Enrichment investigation`
4. ✅ **Rollback identifier reported:** `ws2c-rollback-baseline` → `2fcb754`.

**This task makes no code, CSS, route, schema, API, migration, or data change.** It creates exactly two artefacts: this markdown file and one git tag/commit. Reads existing data: **YES**. Writes new data: **NO**. Changes meaning of existing data: **NO**. Requires backfill: **NO**.

---

# EXECUTIVE SUMMARY

**The Food Report is not a new system to build — it is a composition layer over systems that already exist.** WS2C's job is to decide *which* existing knowledge surfaces into a single, coherent "understand this food" view, *in what order*, and *under what trust rules* — **not** to author new nutrition machinery.

Three findings dominate this investigation:

1. **The data backbone already exists, but is forked between two stacks.** A structured, DB-backed knowledge registry (WS0: `shared/knowledge/*`) holds **food → nutrient**, **food → benefit**, and **nutrient → benefit** relationships *with evidence strength stored*. Meanwhile the *report actually renders* from a **second, client-side, curated stack** (`nutrition-benefit-library.ts` + `pantry-knowledge.ts`) — which is why `health-benefits-model.ts` honestly returns **empty** `healthBenefits` today. **The single biggest WS2C decision is to converge these, not to add a third.**

2. **Two of the eight target questions have data; six are partial or missing.** "What nutrients?" and "What varieties?" are real and shipping. "Health benefits" exists server-side but is unwired to the report. "Nutrition Context" exists *unstructured* inside `pantry-knowledge.ts`. **"Pairs Well With" and "Healthier Alternatives" do not exist as data anywhere** — they are genuinely new editorial registries.

3. **The Food Report should be one reusable component, surfaced in three places (Report row, Pantry Explore, future Planner/Shopping peek), driven by one adapter.** The expanded `PlantReportRow` is *already* a proto-Food-Report (Health Benefits · Key Nutrients · Used In · Your Variety · Broaden). WS2C formalises that into a named, reusable `FoodReport` model rather than spawning a parallel surface.

**One-line recommendation:** Define a single `FoodReport` composition model that reads the **WS0 knowledge registry + WS2A canonical identity + WS2B variety**, render it through the existing shared display adapter, add **two** new small editorial registries (**Pairings**, **Healthier Alternatives**), and **promote** the ad-hoc Nutrition Context already living in `pantry-knowledge.ts` into a structured shape — **no new schema for V1, no new counting, no medical claims.**

---

# SECTION 1 — REVIEW OF CURRENT SYSTEMS

## 1.1 What already exists (verified in source)

| System | Where | What it provides | Status |
|---|---|---|---|
| **WS0 Knowledge Registry** | `shared/knowledge/{foods,nutrients,health-benefits,relationships}.ts` + `knowledge_*` tables | Structured **food → nutrient**, **food → benefit**, **nutrient → benefit** maps with `ranking`, `confidence`, `evidenceStrength`, `source`. 15 benefits, ~24 foods, ~30 nutrients. | ✅ REAL, seeded server-side |
| **Nutrition Benefit Library (client)** | `client/src/lib/nutrition-benefit-library.ts` | Per-food **key nutrients (2–3)** + **one-sentence summary** + category. The source the report *actually reads today*. | ✅ REAL, ~24 foods |
| **Pantry Knowledge (client)** | `client/src/lib/pantry-knowledge.ts` | `whyItMatters`, `goodToKnow`, `howToChoose`, `highlights`, `supports`, `tags`. **This is proto Nutrition Context.** | ✅ REAL, ~40 items |
| **Shared display model** | `client/src/lib/health-benefits-model.ts` | One vocabulary (`TERMINOLOGY`, `COLUMN_LABELS`), one adapter (`getFoodHealthProfile`), `HEALTH_DISCLAIMER`, `EMPTY_STATES`, Nutrient→Food inversion. **Returns `healthBenefits: []` until wired.** | ✅ REAL plumbing |
| **WS2A Canonical Identity** | `shared/canonical/{foods,resolver,variety,shadow}.ts` | Canonical food ↔ alias ↔ variety resolver; one-food-one-meaning. Shadow mode (no counting impact). | ✅ REAL, shadow |
| **WS2B Variety Surfacing** | `shared/canonical/variety.ts` + `PlantDiversityReport.tsx` | Your Variety (eaten) / Broaden Your Variety (defined-not-eaten). Read-only. | ✅ REAL |
| **Plant Diversity Report** | `client/src/components/PlantDiversityReport.tsx` | The current report: category grid, completion suggestions, per-plant expandable rows (Health Benefits · Key Nutrients · Used In · Variety). | ✅ REAL |
| **Pantry Explore V2 / Knowledge Hub** | `PantryExplore.tsx`, `PantryKnowledgeHub.tsx` | Evergreen browse-by-food / browse-by-nutrient hub over the same library. | ✅ REAL |
| **30 Plants page** | `PlantDiversityReport.tsx` consumer | The weekly "what plants have I eaten" surface. | ✅ REAL |
| **Nutrition Boosts** | `nutrition-boosts.ts`, `NutritionBoostPanel.tsx` | Meal-aware "what can we add?" suggestions by boost category (legumes/seeds/nuts/herbs/…). | ✅ REAL |
| **Apple Score** | `shared/apple-score-trust.ts`, `score-badge.tsx`, `basket-item-classifier.ts` | Trust-gated quality rating for **products/baskets** (whole-food vs packaged). | ✅ REAL — different domain |

## 1.2 What overlaps (the core risk)

- **Two parallel nutrition stacks.** WS0 (DB, structured, evidence-stored) vs client libraries (`nutrition-benefit-library` + `pantry-knowledge`). They cover overlapping foods with overlapping facts but different shapes and different slugs. **The report reads the client stack; the structured benefits live in the WS0 stack.** This is why benefits render empty.
- **Three "what can we add?" surfaces** that must not contradict each other: **Broaden Your Variety** (WS2B), **Nutrition Boosts** (meal-level), **Category Completion Suggestions** (report-level). All three are "additive nudges" but each has its own list source.
- **Two "why it matters" prose stores:** `pantry-knowledge.whyItMatters/goodToKnow` and the WS0 `health-benefits.description`. The proposed **Nutrition Context** must not become a third.
- **Healthy fats appears in three places:** a canonical `category` (`foods.ts`), a Boost category (`nutrition-boosts.ts`), and a knowledge-food category. See §6.

## 1.3 What is missing

| Target question | Data today | Gap |
|---|---|---|
| 1. What is this food? | Canonical `description` (WS2A) + knowledge `description` (WS0) | ✅ exists, two sources to reconcile |
| 2. What nutrients? | `nutrition-benefit-library.keyNutrients` + WS0 `FOOD_NUTRIENTS` | ✅ exists (forked) |
| 3. What health benefits? | WS0 `FOOD_BENEFITS` + `NUTRIENT_BENEFITS` (server) | ⚠️ exists but **unwired** to report |
| 4. What varieties? | WS2A varieties + WS2B surfacing | ✅ exists (proving set only) |
| 5. What foods pair well? | — | ❌ **no data anywhere** |
| 6. When is it useful? | partial: `seasonality`, `commonForms`, boost meal-type mapping | ⚠️ scattered |
| 7. What can I add to meals? | Nutrition Boosts | ✅ exists (meal-level, not food-level) |
| 8. Healthier alternatives? | — | ❌ **no data anywhere** |

## 1.4 What should become shared components

1. **`FoodReport` model + adapter** — one function that, given a canonical food (or a raw ingredient resolved through WS2A), returns the full ordered report payload. Extends, does **not** replace, `getFoodHealthProfile`.
2. **`FoodReportSections` component** — the reusable renderer (already 80% present as the expanded `PlantReportRow`). Surfaced in the Report row, Pantry Explore detail, and future Planner/Shopping peeks.
3. **One canonical resolver entry point** (WS2A `resolveCanonicalFood`) so every surface keys the report the same way and "tomatoes"/"cherry tomatoes"/"passata" all reach one report.
4. **One vocabulary + disclaimer** (`TERMINOLOGY`, `HEALTH_DISCLAIMER`, `EMPTY_STATES`) — already centralised; extend it, don't fork it.

> **Anti-duplication rule for WS2C:** every new section must name the single registry it reads. No section may invent a second store for a fact another store already holds.

---

# SECTION 2 — FOOD REPORT SECTIONS

The expanded report row today renders: **More Health Benefits → Key Nutrients → Used In → Your Variety → Broaden Your Variety.** WS2C proposes the full section set below, each tagged by visibility and data source.

| # | Section | Visibility | Data source | Notes |
|---|---|---|---|---|
| 1 | **Overview** ("What is this food?") | Always (1–2 lines) | WS2A `canonical.description` (preferred) → WS0 `food.description` | One sentence. Anchors identity. |
| 2 | **Key Nutrients** | Always when known; else empty-state | `nutrition-benefit-library` → (target) WS0 `FOOD_NUTRIENTS` | Already shipping. |
| 3 | **Health Benefits** | Expandable; hidden if unsupported | WS0 nutrient bridge (`FOOD_BENEFITS` + `NUTRIENT_BENEFITS`) | **Hard fallback: show nutrients only, never an unsupported benefit.** |
| 4 | **Your Variety** | Conditional (eaten varieties exist) | WS2B | Shipping. |
| 5 | **Broaden Your Variety** | Conditional (defined-not-eaten exist) | WS2B | Shipping. The food-level "what can we add?". |
| 6 | **Nutrition Context** | Expandable | promote `pantry-knowledge.whyItMatters/goodToKnow` → structured | §5. Short by default, expandable. |
| 7 | **Pairs Well With** | Expandable; hidden if none | **NEW** Pairings registry | §4. |
| 8 | **Nutrition Boost Ideas** | Conditional (meal context) | `nutrition-boosts.ts` | Only when report is opened *from a meal*; food-level reuse optional. |
| 9 | **Healthier Alternatives** | Conditional; hidden if none | **NEW** Alternatives registry | §3. Only for foods with a defined "upgrade". |
| 10 | **Used In** | Conditional (weekly report only) | the week's meals | Report-context only; omit in evergreen Pantry browse. |

**Always shown:** Overview, Key Nutrients (with empty-state).
**Expandable / on-demand:** Health Benefits, Nutrition Context, Pairs Well With.
**Conditional (render nothing when empty — the WS2B discipline):** Your/Broaden Variety, Healthier Alternatives, Nutrition Boost Ideas, Used In.
**Omit:** any section whose registry has no entry for this food — **no empty cards, no placeholder prose** (WS2B precedent).

**"Healthy Fats" and "Gut Health" are NOT sections** — they are a **category** and a **health benefit** respectively, surfaced *through* sections 2/3. Promoting them to first-class sections would duplicate the benefit/category model (see §6).

---

# SECTION 3 — HEALTHIER ALTERNATIVES

**Concept:** a gentle, editorially-owned "you may also enjoy" upgrade map (White Bread → Wholemeal/Rye/Sourdough; White Rice → Brown Rice/Quinoa; White Pasta → Wholewheat/Lentil/Chickpea).

**Findings / recommendations:**

- **Not universal.** Only a *small, curated* set of foods has a meaningful "swap up" — refined staples with an obvious wholegrain/higher-fibre sibling. Most foods (broccoli, walnuts, olive oil) have **no** alternative and must surface nothing.
- **Not everywhere.** Show **only** on the source food's report (and optionally Shopping, where a swap is actionable). Never inject into Variety or Boost lists — those answer different questions and mixing them muddies "what can we add?" with "replace this."
- **Always with a short reason.** Each alternative carries a one-line, nutrient-anchored *why* ("more fibre, slower energy") — never a value judgement on the original. **Framing: "you may enjoy", never "stop eating".** This protects the no-food-shaming philosophy.
- **Editorially maintained** as a static, source-backed registry: `from → [{ to, reason, nutrientBridge }]`. Keyed by **canonical slug** (WS2A) so aliases resolve. Reviewed like the WS0 seeds; never AI-generated, never inferred from Apple Score.
- **Interaction with Apple Score:** **decoupled.** Apple Score rates *products/baskets* via a trust gate; Healthier Alternatives is *editorial food guidance*. They may visually agree but the alternative must **never** be derived from a computed score (that would turn an educational nudge into an implicit ranking/shaming engine). Keep them independent; at most, Shopping may show both side by side.

**Data shape (illustrative, not implemented):**
```
HEALTHIER_ALTERNATIVES: { fromSlug: [{ toSlug, reason, nutrient }] }
"white-rice": [
  { toSlug: "brown-rice", reason: "More fibre and a steadier release of energy", nutrient: "fibre" },
  { toSlug: "quinoa",     reason: "Adds plant protein alongside fibre",          nutrient: "plant-protein" },
]
```
**The reason is required.** An alternative without a *why* is a ranking; an alternative with a *why* is education.

---

# SECTION 4 — FOOD PAIRINGS ("Pairs Well With")

**Concept:** Tomatoes → Olive oil / Basil / Mozzarella; Spinach → Garlic / Chickpeas / Lemon; Sesame → Tahini / Chickpeas / Roasted veg.

**Three pairing *kinds* exist — store the kind, surface gently:**

| Kind | Example | Why THA cares |
|---|---|---|
| **Culinary** | Tomato + Basil | Makes additions feel natural/appetising — drives adoption of "what can we add?" |
| **Nutritional** | Spinach + Lemon (vitamin C ↑ iron absorption) | Educational, evidence-anchored — overlaps Nutrition Context (§5). |
| **Gut-health** | Beans + wholegrains (fibre diversity) | Ties to the diversity philosophy. |

**Findings / recommendations:**

- **Store as a curated, directional-but-symmetric registry** keyed by **canonical slug**: `slug → [{ pairSlug, kind, note? }]`. Editorial, reviewed, no inference.
- **Tag each pairing with its kind.** A *nutritional* pairing may carry a short evidence note (and shares the Nutrition Context sourcing rules); a *culinary* pairing needs none. This prevents a tasty-but-unevidenced pairing from masquerading as a health claim.
- **Surface as chips**, mirroring Variety/Boost styling, so the report stays visually one family. Cap at ~3–4 to avoid a recipe-engine feel.
- **Reuse, don't reinvent:** a pairing partner that is itself a known food should link to *its* Food Report (the canonical resolver makes this free). Pairings thus become a navigation graph across the Pantry.
- **Boundary with Nutrition Boosts:** Boosts are **meal-aware** ("add seeds to this porridge"); Pairings are **food-intrinsic** ("tomatoes love basil"). Keep both; never merge the stores. A food-level report shows Pairings; a meal-context report may show Boosts too.

---

# SECTION 5 — NUTRITION CONTEXT

**Concept:** short, trustworthy "good to know" lines — Tomatoes: *cooking increases lycopene availability*; Spinach: *vitamin-C-rich foods improve iron absorption*; Beans: *rich in fibre, support gut diversity*; Olive oil: *a key feature of Mediterranean diets*.

**Findings / recommendations:**

- **It already exists, unstructured.** `pantry-knowledge.ts` already authors exactly this as `whyItMatters` / `goodToKnow` / `highlights`. **WS2C should promote this into a structured shape, not author a parallel store.** This is the single most important anti-duplication move in the whole investigation.
- **Structured shape (illustrative):**
  ```
  NUTRITION_CONTEXT: { slug: [{ text, type, nutrient?, source }] }
  type ∈ { preparation, absorption, dietary-pattern, storage, general }
  ```
  Typing the line lets the report group/sort and lets *absorption* lines cross-link to the Pairings that evidence them (§4).
- **Citations / trust:** every line carries a `source` field (e.g. "THA editorial", or a named reference) and is nutritionist-reviewed — the same discipline the WS0 design mandates. Lines must be **descriptive, not prescriptive** ("cooking increases lycopene availability", *not* "cook tomatoes to fight disease").
- **Short by default, expandable.** Show the single highest-ranked line inline; reveal the rest on expand. Never a wall of prose in a table row.
- **Never a third prose store.** Context, Overview, and benefit descriptions must be governed so they don't drift into contradicting each other — one structured Nutrition Context registry, one Overview line, one benefit description each.

---

# SECTION 6 — HEALTHY FATS

The user has repeatedly signalled interest in **olive oil, nuts, seeds, avocados**. Where should "Healthy Fats" live?

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **A. A nutrient category** | Fits the nutrient model; "unsaturated-fats"/"omega-3" already exist in WS0 `NUTRIENT_BENEFITS` | "Healthy fats" is broader than one nutrient | Partly — already true |
| **B. A health-benefit category** | Could group heart/brain benefits | Conflates a *food group* with an *outcome*; risks a soft medical claim | ❌ Avoid |
| **C. A first-class Food Report section** | Visible, satisfies user interest | Duplicates the category + nutrient + benefit models; only relevant to some foods | ❌ Avoid as a section |

**Recommendation: keep "Healthy Fats" as the existing food *category* (it already is one in `foods.ts`, `nutrition-boosts.ts`, and the knowledge registry) and surface it *through* Key Nutrients + Health Benefits — do not promote it to a standalone section.**

- The *nutrient bridge* already does the work: Olive Oil → `unsaturated-fats`/`polyphenols` → `heart-health`/`brain-health`/`anti-inflammatory-support`. That chain renders inside the **Health Benefits** section automatically once it's wired (§7).
- To honour the user's interest **without** new machinery: ensure the **Pantry Explore "browse by category"** lens features a strong **Healthy Fats** group, and ensure the boost/variety registries give healthy fats good coverage. That satisfies the interest through existing surfaces.
- **Net:** Healthy Fats is a *category lens*, not a report section. Making it a section would be the exact "duplicate nutrition system" the scope lock forbids.

---

# SECTION 7 — FOOD REPORT ARCHITECTURE

## 7.1 Proposed section order

The brief's draft order is close. Recommended order (identity → nutrition → enrichment → action):

```
1. Overview            (what is this food)         ← WS2A/WS0 description
2. Key Nutrients       (what's in it)              ← benefit library / WS0
3. Health Benefits     (why it may matter)         ← WS0 nutrient bridge
4. Nutrition Context   (good to know)              ← promoted pantry-knowledge
5. Your Variety        (what you've tried)         ← WS2B
6. Broaden Your Variety(what to try next)          ← WS2B
7. Pairs Well With     (what goes with it)         ← NEW pairings
8. Nutrition Boost Ideas (add to a meal)           ← nutrition-boosts (meal context only)
9. Healthier Alternatives (a gentle upgrade)       ← NEW alternatives (refined staples only)
[Used In]              (weekly-report context only)
```

**Why this order vs the brief's:** Nutrition Context is moved **up** (it explains the nutrients/benefits just stated, so it reads as a continuation, not an afterthought). Variety stays before Pairings because Variety is *about this same food* whereas Pairings/Alternatives point *outward* to other foods — keep the inward-looking sections together, then fan out.

## 7.2 Which sections are reusable elsewhere

| Section | Pantry | Planner | Shopping | Report |
|---|---|---|---|---|
| Overview | ✅ | ✅ peek | ✅ peek | ✅ |
| Key Nutrients | ✅ | ✅ | ✅ | ✅ |
| Health Benefits | ✅ | ◑ | — | ✅ |
| Nutrition Context | ✅ | ◑ | ◑ | ✅ |
| Your / Broaden Variety | ◑ | ✅ planning a swap | ✅ buying a new one | ✅ |
| Pairs Well With | ✅ | ✅ build a meal | ✅ add to basket | ✅ |
| Nutrition Boost Ideas | — | ✅ **native home** | ◑ | ◑ |
| Healthier Alternatives | ◑ | ◑ | ✅ **native home** (swap at point of buying) | ◑ |
| Used In | — | — | — | ✅ only |

- **Belongs in Pantry:** the full evergreen report (the encyclopaedia entry).
- **Belongs in Planner:** Boost Ideas (already there), Variety/Pairings as "build a better meal" helpers.
- **Belongs in Shopping:** Healthier Alternatives + Pairings ("buy the wholemeal", "grab basil for those tomatoes") — the point of *action*.
- **Report-only:** Used In (it's weekly evidence, meaningless in evergreen browse).

## 7.3 Component architecture (no implementation — target shape)

```
resolveCanonicalFood(ingredient)        ── WS2A: one identity for every surface
        │
        ▼
buildFoodReport(canonicalSlug, ctx?)    ── NEW adapter (extends getFoodHealthProfile)
        │   reads: WS0 registry · WS2A varieties · WS2B eaten-set ·
        │          pairings(NEW) · alternatives(NEW) · nutrition-context(promoted)
        ▼
<FoodReportSections payload />           ── reusable renderer (≈ today's expanded PlantReportRow)
        │
        ├─▶ PlantDiversityReport row (weekly, + Used In)
        ├─▶ Pantry Explore detail (evergreen)
        └─▶ Planner / Shopping peek (subset)
```

**Single source of truth:** one adapter, one renderer, three mount points. This is the convergence of the two forked stacks (§1.2): `buildFoodReport` reads the **WS0 structured registry** as the benefit/nutrient authority and treats the client libraries as a display cache to be reconciled — closing the "benefits render empty" gap **without** adding a third store.

---

# IMPORTANT CONSTRAINTS — COMPLIANCE

| Constraint | How WS2C honours it |
|---|---|
| Do NOT implement | This doc is investigation only; rollback tag created. |
| Do NOT redesign Pantry / Planner | WS2C *reuses* their surfaces; no redesign. |
| Do NOT alter production counting | Report is read-only; counting stays in `computePlantData` (WS2B precedent). |
| No medical claims | Nutrient-bridge only; benefits derived + cited, never asserted per food. |
| No duplicate nutrition systems | Converge WS0 ↔ client stacks; promote (not re-author) Nutrition Context; only 2 genuinely-new registries (Pairings, Alternatives). |
| Prefer extending existing architecture | Extends `getFoodHealthProfile` / expanded row; reuses WS2A resolver, WS2B variety, WS0 registry. |

---

# TRUST CHECK

**Could this mislead users?** The two real risks are (a) implying a **medical** outcome, and (b) implying a **ranking / "bad food"** judgement.

- **How are claims sourced?** Through the **nutrient bridge** (WS0): THA never authors "food X is good for Y". It authors `Benefit → Nutrient` (curated, cited, reviewed); the existing `Food → Nutrient` composes the chain. Every benefit is therefore traceable to a nutrient and a source. New registries (Pairings, Alternatives, Context) each carry a `source` field and are nutritionist-reviewed; **none are AI-generated or inferred from free text.**
- **How should uncertainty be displayed?** Hard fallback: **if a benefit isn't supported by the bridge, show nutrients only and hide the benefit** — never a hedged claim. Evidence strength is *stored but not surfaced* in V1 (per WS0 design). Missing data → render nothing (no empty cards).
- **What should never be claimed?** No disease prevention/treatment/cure; no "superfood"; no dosage; no "eat this instead of medicine"; no per-food health assertion; **no value judgement on a food the user already eats** (Alternatives say "you may enjoy", never "stop"). `HEALTH_DISCLAIMER` remains on every surface.
- **Apple Score firewall:** Healthier Alternatives and Pairings must **never** be derived from a computed Apple Score — that would convert education into an implicit ranking/shaming engine. Keep editorial guidance and computed scoring independent.

---

# DATA IMPACT DECLARATION

| Question | Answer |
|---|---|
| Reads existing data? | **YES** (WS0 registry, WS2A canonical, WS2B eaten-set, client libraries) |
| Writes new data? | **NO** |
| Changes meaning of existing data? | **NO** |
| Requires backfill? | **NO** |

---

# RECOMMENDATIONS (priority order)

1. **Converge the two nutrition stacks before adding anything.** Decide that the **WS0 registry is the benefit/nutrient authority**; wire `health-benefits-model` to read it so `healthBenefits` stops being empty. This is the highest-value, lowest-new-data move and unblocks the report's marquee section.
2. **Define `buildFoodReport` + `FoodReportSections`** as the one adapter + one renderer, mounted in Report, Pantry, and (subset) Planner/Shopping. Formalise today's expanded row rather than building a new surface.
3. **Promote Nutrition Context** out of `pantry-knowledge.ts` free text into a structured, typed, sourced registry.
4. **Author two new editorial registries — Pairings and Healthier Alternatives** — small, canonical-slug-keyed, source-backed, reason-required. Start with the WS2A proving set + refined-staple swaps.
5. **Keep Healthy Fats as a category lens**, surfaced through Key Nutrients / Health Benefits and the Pantry category browse — not a section.
6. **Hold the visibility discipline:** always-show Overview + Key Nutrients; expandable Benefits/Context/Pairings; conditional everything else; **render nothing when empty.**

---

# RISKS

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Third nutrition store created by accident** | High if rushed | Mandate: every section names its single registry; converge WS0↔client first (Rec 1). |
| **Benefit reads as medical claim** | Medium | Nutrient bridge + hard fallback + disclaimer; nutritionist review. |
| **Healthier Alternatives feels like food-shaming** | Medium | "You may enjoy" framing; reason-required; refined-staples only; Apple-Score firewall. |
| **Pairings drift into a recipe engine** | Low–Med | Cap at 3–4 chips; tag kind; editorial only. |
| **Slug mismatch between WS0, client libs, and WS2A** | High (real today) | Canonical resolver (WS2A) as the single key; reconcile slugs during convergence. |
| **Over-stuffed report row** | Medium | Strict always/expandable/conditional tiers; omit-when-empty. |
| **Coverage gaps look broken** | Low | WS2B empty-state discipline already proven — show nothing, never a stub. |

---

# SCOPE LOCK CONFIRMATION

**Investigation only.** No implementation, no migrations, no schema changes, no UI changes were made. The only artefacts are this document and the `ws2c-rollback-baseline` tag/commit.

## SUGGESTION (future ideas only — require approval, not implemented)

1. **Wire WS0 benefits into the report** (close the empty-`healthBenefits` gap) as the first WS2C implementation slice.
2. **`buildFoodReport` adapter + `FoodReportSections` renderer** extracted from the expanded `PlantReportRow`.
3. **Pairings registry** (canonical-slug-keyed, kind-tagged) — start with WS2A proving set.
4. **Healthier Alternatives registry** (refined staples; reason-required; Apple-Score-firewalled).
5. **Structured Nutrition Context** promoted from `pantry-knowledge.ts`.
6. **Cross-surface mounts:** Pantry Explore detail = full report; Shopping = Alternatives + Pairings; Planner = Boosts + Variety.
7. **Pantry "Healthy Fats" category lens** strengthened to honour the user's stated interest without a new section.
8. **Inter-food navigation graph:** pairing/alternative/variety chips deep-link to their own Food Reports via the canonical resolver.

---

**File location:** `docs/investigations/WS2C_FOOD_REPORT_ENRICHMENT.md`
**Rollback identifier:** `ws2c-rollback-baseline` → commit `2fcb754` (`git reset --hard ws2c-rollback-baseline`)
