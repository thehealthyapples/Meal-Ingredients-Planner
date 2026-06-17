# Weekly Nutrition Report & Caution Foods Model — Investigation

**Investigation Date:** 2026-06-17
**Status:** Investigation only. No code, CSS, schema, API, migration, or data changes made.
**Author role:** Senior nutrition-education product architect + senior React/Node engineer
**Branch:** `main` (HEAD `f384f6a`)

---

## 0. ROLLBACK IDENTIFIER

```
Rollback tag:   rollback/weekly-nutrition-report-investigation-20260617
Tag object SHA: 7a7d6fa9d63e7b38ebcd92da916e489652e2f423
Points to:      f384f6a40c8dffcecc18736fd1393180cc080b7b  (HEAD, main)
Restore:        git reset --hard rollback/weekly-nutrition-report-investigation-20260617
```

**Honesty note on "git status is clean."** The required step 1 says *confirm git status is
clean*. It was **not** clean. The working tree carries the just-shipped connected Health
Benefits experience as uncommitted/untracked changes (`PlantDiversityReport.tsx`,
`PantryExplore.tsx`, `health-benefits-model.ts`, `plant-diversity-page.tsx`,
`use-week-meal-entries.ts`, modifications to `App.tsx`, `pantry-page.tsx`,
`weekly-planner-page.tsx`, `nutrition-benefit-library.ts`, `nutrition-variety.ts`, the
deletion of `PlantDiversityExplorer.tsx`, plus several investigation docs). These predate
this task and are **untouched** by it. The rollback tag captures committed `HEAD`; the
uncommitted work is preserved as-is. The only change this task makes is creating this one
markdown file — to undo it: `rm docs/investigations/WEEKLY_NUTRITION_REPORT_AND_CAUTION_FOODS_MODEL.md`.

---

## FILES REVIEWED

**Client libraries**
- `client/src/lib/health-benefits-model.ts` — shared display model (the connected experience's spine)
- `client/src/lib/nutrition-benefit-library.ts` — curated food → key nutrients + summary
- `client/src/lib/nutrition-variety.ts` — plant detection, categories, variety scoring
- `client/src/lib/nutrition-boosts.ts` — meal-type-aware boost engine ("Better Additions")
- `client/src/lib/nutrition-insights.ts` — nutrient triggers + "I want to support…" goals
- `client/src/lib/pantry-knowledge.ts` — store-cupboard "why it matters" + "how to choose"
- `client/src/lib/whole-food-alternatives.ts` — pattern → homemade recipe alternatives
- `client/src/lib/analyser-view-model.ts` — product analyser display model (score drivers, verdict, review, swaps)
- `client/src/lib/analyser-choice.ts` — `buildWhyBetter`, `rankChoices`, `rankDisplayMatches`
- `client/src/lib/basket-item-classifier.ts` — whole-food vs packaged classification + Apple Score gate

**Client components / pages**
- `client/src/components/PlantDiversityReport.tsx`, `client/src/components/PantryExplore.tsx`
- `client/src/pages/plant-diversity-page.tsx`, `client/src/pages/pantry-page.tsx`, `client/src/pages/weekly-planner-page.tsx`
- `client/src/hooks/use-week-meal-entries.ts`

**Server / shared**
- `server/lib/upf-analysis-service.ts` — UPF score, additive detection, THA rating, NOVA, regulatory split
- `server/lib/meal-scoring-service.ts` — candidate scoring incl. UPF/variety sub-scores
- `shared/apple-score-trust.ts` — canonical Apple Score trust-state gate
- `shared/schema.ts` — `additives`, `productAdditives`, `nutrition`, `meals` (incl. `upfScore`, `nutritionOpportunities`)

**Prior investigation docs**
- `THA_HEALTH_BENEFITS_CONNECTED_EXPERIENCE_IMPLEMENTATION.md` (Option A — separate but connected; just shipped)
- `THA_30_PLANTS_MODAL_V2_SUPPORT_MODEL_AMENDMENT.md` (many-to-many primary/secondary support model)

---

## SECTION 1 — EXECUTIVE SUMMARY

THA has just shipped a **connected Health Benefits experience** (Option A): 30 Plants is now a
dedicated **Plant Diversity Report** page (`/plant-diversity`), Pantry gained an **Explore**
"Nutrition Knowledge Hub" mode, and both consume one shared display model
(`health-benefits-model.ts`). Crucially, **no health-benefit data is populated** — every
`healthBenefits` array is `[]` and surfaces render honest empty states.

The product insight is correct: **30 Plants is necessary but not sufficient.** It only models
*plant diversity*. Users also eat meat, fish, eggs, dairy, bacon, sausages, ready meals, UPF
products and treats. THA's "what can we add?" philosophy needs a wider home that can also help
users **understand occasional foods** and **choose better** — without shaming, fear, or medical
overreach.

**The most important finding:** THA has already built ~70% of the engines a Weekly Nutrition
Report needs — they are just **not aggregated into a weekly view** and the **caution-food half
is product-scoped, not ingredient/meal-scoped**:

| Concept the brief asks for | Already exists as | Gap |
|---|---|---|
| Plant Diversity section | `PlantDiversityReport` + `nutrition-variety` | None (done) |
| Health Benefits | `health-benefits-model` shape (empty registry) | **Registry data + source backing** |
| Choose Better (products) | `analyser-view-model` + `analyser-choice` (already uses "occasional" wording) | Not surfaced from a weekly view |
| Balance / Better Additions | `nutrition-boosts.getMealBoosts` (meal-type aware) | Not triggerable *by a caution food* |
| Alternatives | `whole-food-alternatives` | No meat/processed-meat entries |
| Nutrition Gaps / Boosts | `nutrition-insights` (nutrient→goal→suggestions) | Not aggregated weekly |
| Caution Foods | **nothing at the ingredient/meal level** | **Net-new (read-only classifier)** |
| Weekly aggregation | **nothing except Plant Diversity** | **Net-new report shell** |

**Recommendation in one line:** Do **not** rebuild — **widen and aggregate**. Build a
**source-backed Health Benefits registry first** (it unblocks two already-shipped empty-state
surfaces and proves the claim-safety pattern), then add a **thin read-only Caution Foods
classifier**, then a **Weekly Nutrition Report shell** in which the existing 30 Plants page
becomes the lead section and the Analyser remains the single source of "Choose Better".

---

## SECTION 2 — CURRENT CAPABILITY AUDIT

### 2.1 Plant Diversity (mature ✅)
- `nutrition-variety.ts`: `isPlantIngredient()`, `getPlantCategory()` over 9 categories
  (Vegetables, Fruits, Whole Grains, Herbs & Spices, Olive Oil, Legumes, Seeds, Nuts, Fermented
  Foods). `computeMealVariety()` produces a 5-field `VarietyScore`. Matching is **keyword/word-list
  based** and explicitly documented as "an approximation based on ingredient names".
- `PlantDiversityReport.tsx`: 30-plant target, progress bar, "Categories Covered" grid, per-missing-
  category completion suggestions (drawn from the benefit library), and a **Plant | Health Benefits |
  Key Nutrients | Meals** report table with expandable rows ("Used In", "Broaden Your Variety").
- `plant-diversity-page.tsx` + `use-week-meal-entries.ts`: deep-linkable `/plant-diversity` route,
  reads `/api/planner/full` + `/api/meals` and the `planner:active-week` localStorage key. Read-only.

### 2.2 Health Benefits display model (shape only, no data ⚠️)
- `health-benefits-model.ts` defines `HealthBenefit` (name/emoji/nutrient) and `FoodHealthProfile`,
  plus `COLUMN_LABELS`, `TERMINOLOGY`, `EMPTY_STATES`, `HEALTH_DISCLAIMER`.
- **Deliberate guardrail:** `getFoodHealthProfile()` always returns `healthBenefits: []` and
  `hasHealthBenefitData: false`; `listHealthBenefitTopics()` returns `[]`. It never derives outcomes
  from free-text and never calls an AI. The registry **does not exist yet**.
- `keyNutrients` and `summary` are **real curated data** sourced from the benefit library + pantry knowledge.

### 2.3 Curated food knowledge (positive only ⚠️)
- `nutrition-benefit-library.ts`: ~30 foods, each with `keyNutrients` (2–3) + one-line `summary` +
  `category`. **Entirely plant/whole-food positives** (seeds, nuts, legumes, herbs, mushrooms,
  fermented, healthy fats, leafy greens, extra veg). **No meat, processed meat, or occasional foods.**
- `pantry-knowledge.ts`: ~40 store-cupboard items with `supports`, `highlights`, `whyItMatters`,
  `goodToKnow`, **`howToChoose`** and `tags`. Notably includes some **animal foods** (salmon,
  sardines, mackerel, eggs, kefir, greek/natural yogurt) and `dark chocolate` — all framed positively.
  **`howToChoose` is a proto "Choose Better" already** (e.g. EVOO: "cold-pressed, dark glass, recent
  harvest"; oats: "rolled/steel-cut over instant"). No caution items.

### 2.4 Better Additions / Balance engine (mature ✅, mis-keyed for caution)
- `nutrition-boosts.ts`: `getMealBoosts(mealName, ingredients)` returns up to 3–5 contextually
  relevant boosts, keyed by **meal-type keyword** (`MEAL_TYPE_BOOSTS`) with a gentle fallback. It
  already filters out items present in the meal. **The "balance the plate" scenario in the brief
  (bacon breakfast → spinach, avocado, tomatoes, mushrooms) is already produced** by the
  `breakfast / cooked breakfast / fry up / full english` mapping.
- Limitation: boosts trigger on **meal type**, not on the **presence of a caution food**. There is no
  "you added bacon → here's what balances it" binding.

### 2.5 Nutrition gaps / "support" goals (mature ✅, not aggregated)
- `nutrition-insights.ts`: `getMealNutrients()` maps ingredients → nutrient tags (Vitamin C, Fibre,
  Healthy fats, Vitamin D, Iron). `NUTRIENT_GOALS` is a **proto health-outcome map** —
  Immunity→Vitamin C, Bone health→Vitamin D, Energy→Iron, Gut health→Fibre — each with food
  suggestions. **This already includes animal foods** as suggestions (lean red meat, salmon, eggs).
  This is the closest existing thing to a Benefit→Nutrient→Food registry, but it is small,
  goal-led (not food-led), and not weekly-aggregated.

### 2.6 Product Analyser / Choose Better (mature ✅ — this IS the caution engine)
- `server/lib/upf-analysis-service.ts`: detects additives (E-number regex + `additives` DB), computes
  `upfScore`, a 1–5 **THA rating (Apple score)**, NOVA group, **regulatory vs discretionary additive
  split**, risk levels (low/moderate/high), processing indicators, and a 3-bucket risk breakdown.
- `analyser-view-model.ts`: turns that into a display model — `score` (label/verdict), **`scoreDrivers`
  (positive/negative)**, an editorial **`thaReview`**, parsed ingredients, additives, nutrition, and
  **`swaps`** (whole-food + better packaged). The review copy **already speaks the brief's language**:
  *"treating it as an occasional rather than regular choice"*, *"worth comparing with simpler
  alternatives"*.
- `analyser-choice.ts`: `buildWhyBetter()` ("Higher THA score", "Fewer additives", "Lower processing
  (NOVA n)") and `rankChoices()` / `rankDisplayMatches()` (quality-first / balanced / lowest-price).
  **This is the Choose Better ranking engine, already shipped.**
- `whole-food-alternatives.ts`: pattern → homemade recipe (mayo, granola, sauces, hummus, bread…).
  Keyed on **UPF/packaged items**; **no bacon/sausage/processed-meat entries**.

### 2.7 Trust / scoring safety (mature ✅)
- `shared/apple-score-trust.ts` + `basket-item-classifier.ts`: an Apple Score is only shown for a
  **trusted whole food** or a **resolved/scanned product**. Unresolved packaged items get
  `ANALYSIS_REQUIRED` and **no authoritative score**. This gate is the backbone of claim safety and
  must govern any caution-food "Choose Better" display.

### 2.8 Schema reality
- `additives` table: `name, type, riskLevel, description, isRegulatory, aliases`. **No source/citation/
  evidence/lastReviewed field** — a claim-safety gap for any risk statement.
- `meals`: `ingredients[]`, `upfScore`, and an editorial `nutritionOpportunities[]` (display only).
- `nutrition` table exists (protein etc.) but is sparse.

---

## SECTION 3 — WHY 30 PLANTS IS NECESSARY BUT NOT SUFFICIENT

**Necessary.** Plant diversity is THA's flagship positive metric, it is well-built, deep-linkable,
and squarely "what can we add?". It should not be touched or diluted.

**Not sufficient — four structural gaps:**

1. **Coverage gap.** It only counts plants. A week of meals also contains protein quality, dairy/
   calcium, fish/omega-3, fermented dairy, *and* occasional foods (processed meat, high-UPF,
   high-salt/sugar). 30 Plants is silent on all of these, so it can look "complete" while the week is
   unbalanced.

2. **Positive-only framing.** The entire curated knowledge base (`nutrition-benefit-library`) is
   positive whole-foods. There is no model for "you ate this — here's how to enjoy it well." Users
   currently get *additions* but no *balancing/decision* support.

3. **No weekly synthesis beyond plants.** `nutrition-boosts`, `nutrition-insights`, and the Analyser
   all operate per-meal or per-product. Nothing rolls a *week* up into strengths/gaps/occasional-
   foods/opportunities. 30 Plants is the only weekly lens that exists.

4. **The Analyser is disconnected from the week.** The richest decision-support engine THA owns
   (UPF/additive/Choose-Better) lives in a separate product flow and never appears in the weekly story.

**Conclusion:** 30 Plants is the *first* section of a wider weekly story, not the whole story.

---

## SECTION 4 — PROPOSED WEEKLY NUTRITION REPORT MODEL

A weekly **aggregation shell** that reuses existing engines. It is a *view*, not a new data source.

```
Weekly Nutrition Report  (route: /weekly-nutrition or /report)
├─ 1. Plant Diversity        → renders existing PlantDiversityReport (unchanged)
├─ 2. Nutrition Strengths    → what the week did well (positive synthesis)
├─ 3. Nutrition Gaps         → what could be added (the "add" story)
├─ 4. Occasional Foods       → foods to enjoy occasionally (caution, non-shaming)
├─ 5. Choose Better Next Time→ product-level opportunities (deep-links to Analyser)
└─ 6. Better Additions       → simple foods to add to existing meals (boosts engine)
```

**Data sourcing per section (all reuse, no new claims):**

| Section | Engine reused | New work |
|---|---|---|
| 1. Plant Diversity | `PlantDiversityReport` + `use-week-meal-entries` | none — embed as-is |
| 2. Nutrition Strengths | `nutrition-insights.getMealNutrients` + plant categories covered + fermented/omega-3 tags | aggregator (count + phrase) |
| 3. Nutrition Gaps | `NUTRIENT_GOALS` + missing categories from `PlantDiversityReport` | "what's absent" diff |
| 4. Occasional Foods | **Caution Foods classifier (new, §5)** | read-only classifier |
| 5. Choose Better | `analyser-view-model` / `analyser-choice` (link out) | deep-link, not re-implement |
| 6. Better Additions | `nutrition-boosts.getMealBoosts` | aggregate top boosts across the week |

The mapped sections (1, 2, 3, 6) can be built with **zero new health claims** — they are arithmetic
over existing curated tags. Sections 4 and 5 are where claim-safety discipline concentrates.

**Aggregation seam already exists:** `useWeekMealEntries()` already returns the week's meals as
`WeekMealEntry[]`. A Weekly Nutrition Report can consume the same hook, so the report is naturally
deep-linkable and decoupled, exactly like the Plant Diversity page.

---

## SECTION 5 — CAUTION FOODS MODEL

**Purpose:** name foods that are *not forbidden but worth understanding*, in THA's voice. The model
must be a **read-only classifier over existing data** — never a stored judgement on a user.

**Proposed shape (future — illustrative, not to be built now):**

```ts
type OccasionalReason =
  | "processed-meat" | "high-upf" | "high-additive"
  | "high-salt" | "high-sugar" | "low-fibre-frequent";

interface CautionSignal {
  ingredientOrProduct: string;
  reason: OccasionalReason;
  framing: "occasional";          // never "bad" / "avoid" / "banned"
  // All downstream copy pulls from balance + alternatives + analyser — never invented here.
}
```

**Two tiers of detection, reusing what exists:**

1. **Product tier (already real).** When an item is a *resolved/scanned product*, the Analyser
   already classifies UPF/additives/NOVA and produces "occasional" wording. Caution status here is
   **evidence-backed** (real ingredient list) and should defer entirely to the Analyser.

2. **Ingredient tier (new, keyword — must be cautious).** A small word-list classifier mirroring
   `nutrition-variety.ts`'s pattern, e.g. processed-meat terms (bacon, sausage, ham, salami, hot dog,
   chorizo). This is **approximate** (same false-positive risk the plant counter documents — e.g.
   "Quorn bacon", "veggie sausage") and must be labelled as an approximation, never as a hard claim.

**Voice rules (enforced in copy, derived from existing Analyser tone):**
- Use: *occasional*, *enjoy occasionally*, *balance the plate*, *choose better when you choose it*,
  *compare options*, *add a protective side*.
- Never: *bad*, *avoid*, *banned*, *unhealthy*, *toxic*, *cancer-causing*, guilt or fear framing.
- Never bind one food to one disease outcome (see §10 and the existing many-to-many support amendment).

**The bacon scenario, decomposed onto existing engines:**
- *"Bacon is best treated as an occasional food"* → ingredient-tier classifier (`processed-meat`).
- *"Choose better when you choose it"* (additives/UPF/salt/meat content) → **Analyser** on a scanned
  bacon product (real data) — not invented at the ingredient level.
- *"Balance the meal"* (beans, eggs, tomatoes, mushrooms, yoghurt) → **`getMealBoosts`** already returns
  these for breakfast meal types.
- *"More regular alternatives"* (eggs, beans, mushrooms, smoked salmon, avocado, tofu scramble) →
  needs a small **caution-food → alternatives** table (a sibling of `whole-food-alternatives`, which
  today only covers UPF items, not meat).

---

## SECTION 6 — CHOOSE BETTER MODEL

**Finding: Choose Better already exists and is mature — it should not be rebuilt.**

`analyser-choice.ts` + `analyser-view-model.ts` already provide every comparison criterion the brief
lists:

| Brief criterion | Where it lives today |
|---|---|
| fewer additives | `buildWhyBetter` ("Fewer additives (n)"), `scoreDrivers` |
| lower UPF score | `upfScore`, NOVA in drivers |
| lower salt / sugar | `nutriments` (salt/sugar) surfaced in view model |
| higher whole-food content / simpler ingredients | "Short, simple ingredient list", processing indicators |
| better Apple score | `thaRating` / "Higher THA score (n/5)" |
| fewer preservatives / high-risk additives | additive `type`/`riskLevel`, "No high-risk additives" |
| protein quality | *not modelled* (gap) |

**Recommendation:** the Weekly Nutrition Report's "Choose Better Next Time" section should be a
**thin index that deep-links into the Analyser** for each flagged product, *not* a re-implementation.
The Analyser is the single source of truth. Two real constraints:
- Choose Better can only show an **authoritative comparison for resolved/scanned products** (the
  `apple-score-trust` gate). For an un-scanned "bacon" the report can suggest *categories* to compare
  but must not fabricate a score.
- "Protein quality" is a genuine gap if a future Protein section needs it — that is new curated data,
  separately approved.

---

## SECTION 7 — ANALYSER RELATIONSHIP

**Question: should the Analyser become the source of "Choose Better" for caution foods? → Yes.**

The Analyser is already THA's UPF/additive/Apple-score authority and already produces "occasional"
framing and ranked better options. Re-implementing any of this inside a report would (a) duplicate
logic, (b) risk drift between two engines, and (c) tempt fabricating scores for unresolved items.

**Recommended relationship:**
- The Weekly Nutrition Report **owns the weekly narrative** and **links into the Analyser** for
  product-level depth.
- The Analyser **owns Choose Better** (scores, drivers, swaps) and only ever shows authoritative
  numbers for resolved/scanned products.
- The planner already deep-links to the Analyser (`navigate('/analyser?q=…')`) — the report should
  reuse the same pattern, so there is a proven seam.

**Do not** push caution scoring down to the ingredient level inside the report; keep authoritative
judgement inside the Analyser where there is a real ingredient list.

---

## SECTION 8 — PANTRY EXPLORE RELATIONSHIP

**Question: should Pantry Explore include caution-food education, or should caution live in the
Report/Analyser only? → Keep caution OUT of Pantry Explore (initially).**

Pantry Explore was deliberately shipped as the evergreen *"what can I add?"* knowledge hub
(Health Benefits / Key Nutrients / Foods lenses, all positive). Injecting caution/occasional content
there would dilute its single, optimistic job and blur the "add vs balance" mental model.

**Recommendation:**
- Pantry Explore **stays positive** — it is the home of additions, benefits, and nutrients.
- **Caution Foods and Choose Better live in the Weekly Nutrition Report + Analyser only.**
- *Optional, much later:* a read-only "Better Choices" lens in Explore that simply surfaces the
  existing `pantry-knowledge.howToChoose` arrays (which are already positive "choose better" guidance,
  not caution) — this is low-risk because it reuses curated, non-judgemental data. An "Occasional
  Foods" lens in Explore is **not** recommended for the first build.

---

## SECTION 9 — 30 PLANTS RELATIONSHIP

Three options were posed. Mapping each against the just-shipped Option A architecture:

- **Option 1** — 30 Plants stays its own page and *links into* the Weekly Nutrition Report.
- **Option 2** — 30 Plants becomes the first tab/section *inside* the Weekly Nutrition Report.
- **Option 3** — Weekly Nutrition Report is a future phase; 30 Plants remains the current page for now.

**Recommendation: Option 3 now → evolving to Option 1/2 hybrid later.**

Rationale:
- The Plant Diversity *page* shipped **today**. Reorganising it immediately would churn brand-new,
  unvalidated work and contradict the deliberate "separate but connected" decision.
- `PlantDiversityReport` is already **container-agnostic** (a page-body component with no Dialog
  shell). That means when the Weekly Nutrition Report shell is built, the *same component* can be
  embedded as **Section 1** with zero rework — this is exactly Option 2's mechanism, available for
  free, without destroying the standalone page.
- So the end-state is a **hybrid**: the standalone `/plant-diversity` page **persists** (deep links,
  the planner counter, muscle memory all keep working — Option 1's "stays its own page"), **and** the
  report embeds the same body as its lead section (Option 2's "first section"). Nothing is destroyed.

**Net: keep 30 Plants exactly as-is now; reuse its body as Section 1 of the report when that phase
lands. The standalone page never goes away.**

---

## SECTION 10 — DATA / CLAIM SAFETY

This is the highest-risk area and the reason the brief pauses data population. Findings and rules:

**10.1 What claims require curated source backing?**
- **Health-outcome claims** (Benefit→Nutrient→Outcome, e.g. "Magnesium → Sleep Quality"): require a
  cited, reputable source (NHS / British Heart Foundation / EFSA / WHO / peer-reviewed review).
- **Caution / risk statements** (e.g. processed meat framing): require source backing *and* must stay
  at "best enjoyed occasionally" level — never "causes X disease".
- **Nutrient *content*** ("rich in magnesium") is lower-risk and already curated, but should still
  carry a provenance note when the registry formalises.
- **Product additive risk levels** already drive scoring but the `additives` table has **no source
  field** — this must be added before any additive risk wording is treated as a claim rather than an
  internal heuristic.

**10.2 What disclaimers are needed?**
- The existing `HEALTH_DISCLAIMER` ("educational summaries, not medical advice") is good and already
  rendered on both surfaces — reuse it everywhere.
- Add, for caution content: an **"associations, not causation"** note and an **"individual needs
  vary — consult a professional"** note.
- Keep the existing **approximation disclaimer** ("based on ingredient names") for any keyword
  classifier, including the new caution classifier.

**10.3 Cautious wording (recommended vocabulary):**
- Use: *supports*, *associated with*, *may help*, *source of*, *best enjoyed occasionally*,
  *choose better when you choose it*.
- Avoid: *cures*, *prevents*, *treats*, *boosts immunity* (as a guarantee), *detox*, *bad*, *toxic*.
- The Analyser's existing review copy already models this tone and can be the style reference.

**10.4 How to avoid implying a single food cures/prevents illness?**
- Never map one food → one disease. Use **many-to-many nutrient relationships** (already designed in
  `THA_30_PLANTS_MODAL_V2_SUPPORT_MODEL_AMENDMENT.md`) and frame at the **nutrient/area** level
  ("contributes to" a broad area like heart health), not the **diagnosis** level.
- Keep `getFoodHealthProfile`'s current discipline: **no outcome is ever derived from free-text**; it
  only appears when a curated, sourced registry entry exists.

**10.5 How should evidence/source notes be stored later? (design only)**
- Extend the future Health Benefit registry entry and the `additives` table with a `sources` array:
  `{ body, title, url, lastReviewed }`. Surface a small "Why we say this" / source affordance.
- Store benefit relationships as **per-food, source-backed records** (not global rules), consistent
  with the many-to-many amendment.
- Treat caution-food framing as **curated editorial + source**, never AI-generated and never inferred
  from tags.

---

## SECTION 11 — RECOMMENDED IMPLEMENTATION SEQUENCE

Ordered for safety (each step is shippable, reversible, and adds no unsourced claims):

**Phase A — Health Benefits registry (source-backed). [Build first]**
- *Why first:* two already-shipped surfaces (Plant Diversity Report, Pantry Explore) render empty
  "coming soon" states **waiting for exactly this**. It is the smallest increment that delivers
  visible value, and it establishes the **source-backing + disclaimer pattern** every later phase
  reuses. Many-to-many, per-food, cited. Populates `healthBenefits` honestly.
- Maps to brief option **A**.

**Phase B — Caution Foods *model* (read-only classifier + types). [Thin]**
- Ingredient-tier keyword classifier (processed meat first), labelled as an approximation; product-tier
  defers to the Analyser. No stored user judgements, no claims beyond "occasional". Add the
  caution-food → alternatives table (sibling of `whole-food-alternatives`, extended to meat).
- Maps to brief option **C**.

**Phase C — Weekly Nutrition Report foundation (aggregation shell). [Reuse]**
- New deep-linkable route consuming `useWeekMealEntries`. Embeds `PlantDiversityReport` as Section 1;
  aggregates `nutrition-insights` (strengths/gaps), `nutrition-boosts` (better additions), and the new
  caution classifier (occasional foods). No new health claims in the mapped sections.
- Maps to brief option **B**.

**Phase D — Analyser integration (deep links, not re-implementation).**
- "Choose Better Next Time" links each flagged product into the Analyser; respects the Apple-score
  trust gate. Optionally add a caution-food → "scan to compare" prompt.
- Maps to brief option **D**.

**Phase E — Pantry Explore expansion (optional, last).**
- Optional read-only "Better Choices" lens surfacing existing `pantry-knowledge.howToChoose`. No
  caution content in Explore. Lowest priority.
- Maps to brief option **E**.

**Prerequisite spanning A & B:** add a `sources` field to the registry (and to `additives`) **before**
any sourced claim or additive-risk wording ships — this is a schema change requiring separate approval.

---

## SECTION 12 — RISKS

1. **Shaming / negative tone drift.** Caution content is the single biggest brand risk. *Mitigation:*
   "occasional"-only vocabulary, additive-framing (not moralising), reuse the Analyser's proven tone,
   copy review gate.
2. **Keyword false positives.** An ingredient-tier caution classifier will mis-flag (e.g. "veggie
   sausage", "Quorn bacon"), exactly as the plant counter can. *Mitigation:* approximation disclaimer;
   prefer product-tier (real ingredient list) wherever a scan exists.
3. **Fabricated certainty / scores.** Showing an Apple score or risk claim for an unresolved item.
   *Mitigation:* the `apple-score-trust` gate already prevents this — any new surface must route
   through it; never invent scores at the ingredient level.
4. **Health-claim overreach.** Implying a food cures/prevents illness. *Mitigation:* §10 rules,
   many-to-many sourced registry, disclaimers, no AI-generated health content.
5. **Missing curated data for new sections.** A Protein Quality / Omega-3 / Dairy section needs foods
   the benefit library does not yet contain (it is plant-only; pantry-knowledge has a few animal
   foods). *Mitigation:* treat each new section's data as a separately-approved population task; the
   report shell can ship with only the sections whose data exists.
6. **Engine drift / duplication.** Re-implementing Choose Better inside the report. *Mitigation:*
   deep-link to the Analyser; one source of truth.
7. **Schema gap on sources.** Additives carry risk levels but no citations. *Mitigation:* add a
   `sources` field before treating any risk wording as a public claim.
8. **Churning brand-new work.** Restructuring the day-old 30 Plants page. *Mitigation:* Option 3-now /
   hybrid-later (§9) — reuse the container-agnostic body, never destroy the page.

---

## SECTION 13 — FINAL RECOMMENDATION

1. **Widen, don't rebuild.** THA already owns the engines (plants, boosts, insights, Analyser/Choose
   Better, alternatives, trust gate). The job is **aggregation + a thin caution model**, not new
   machinery.
2. **Yes, build a Weekly Nutrition Report** — as an aggregation *shell* over existing engines, sourced
   from the same `useWeekMealEntries` seam, with 30 Plants as its lead section.
3. **Represent bacon-type foods via the existing Analyser + boosts**, framed strictly as "occasional"
   and "choose better when you choose it" — never shaming.
4. **Connect the concepts like this:** Plant Diversity (positive, plants) → Health Benefits (sourced
   registry) → Nutrient Gaps/Boosts (additions) → Occasional Foods (caution classifier) → Choose
   Better (Analyser deep-link). The Report is the connective tissue; the Analyser stays authoritative.
5. **Build order:** **A (Health Benefits registry, source-backed) first** — it unblocks two shipped
   surfaces and proves the claim-safety pattern — then **B (Caution model)**, **C (Report shell)**,
   **D (Analyser links)**, **E (Explore, optional)**.
6. **30 Plants:** keep exactly as-is now (Option 3); evolve to the hybrid (standalone page persists +
   embedded as Section 1) when the report lands. Never destroyed.
7. **Caution lives in Report + Analyser, not Pantry Explore.** Explore stays the positive
   "what can I add?" hub.
8. **Claim safety is the gating constraint:** sourced, many-to-many, cautious wording, disclaimers,
   trust-gate-respecting, no AI-generated health content, and a `sources` schema field added before any
   public claim. Data population stays paused pending separate approval.

---

## 14. CONFIRMATION — NO CODE / DATA CHANGES MADE

- ✅ No application code changed.
- ✅ No CSS changed.
- ✅ No schema changed.
- ✅ No API changed.
- ✅ No migrations run.
- ✅ No data populated.
- ✅ No health-benefit backfill.
- ✅ No registry data created.
- ✅ No scoring changed.
- ✅ No AI called for health content.
- ✅ Only artefact created: this investigation file + one annotated rollback git tag.

**Data impact:** reads existing data only (investigation); writes no data; changes meaning of no
existing data; requires no backfill now; future backfill likely but **separately approved**.
