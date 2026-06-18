# The Healthy Apples — Complete Plant Diversity Launch Design

**Document type:** Architecture + UX investigation (investigation only — no implementation).
**Date:** 2026-06-17
**Author role:** Senior nutrition-education product architect + senior React/Node engineer.
**Companion document:** `docs/investigations/WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md`
(establishes the "separate but connected" five-surface model this design slots into).

---

## 0. ROLLBACK & SAFETY HEADER

| Item | Value |
|---|---|
| **Rollback tag** | `rollback/plant-diversity-launch-design-20260617` |
| **Points to commit** | `bae3b99` |
| **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Restore command** | `git reset --hard rollback/plant-diversity-launch-design-20260617` |
| **Undo this doc only** | `rm docs/investigations/COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` |

**Required rollback steps — completed before investigation began:**

1. ✅ **Git status checked.** No tracked files modified or staged. One pre-existing untracked
   artefact present (`docs/investigations/WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md`) from the
   prior investigation; the committed tree is clean.
2. ✅ **Current branch confirmed:** `safety/preserve-since-last-prod-20260617-1613`.
3. ✅ **Rollback tag created:** `rollback/plant-diversity-launch-design-20260617` at `bae3b99`.
4. ✅ **Rollback identifier reported** before any investigation work.

**This task makes no code, CSS, route, schema, API, migration, or data change. The only artefacts
it creates are this single markdown file plus one git tag.** Full confirmation in §14.

---

## SECTION 1 — EXECUTIVE SUMMARY

Plant Diversity is **further along than the brief assumes**, and **blocked on something the brief
does not name**. Both facts shape this design.

**What already exists and is good** (`client/src/components/PlantDiversityReport.tsx`, 728 lines;
`client/src/pages/plant-diversity-page.tsx`; route `/plant-diversity`):

- A deep-linkable page, decoupled from planner state via `useWeekMealEntries`.
- A header score (`73 / 30` style), progress bar with three colour states, and three status
  messages — exactly the header the brief sketches.
- A "Categories Covered" grid with covered/missing affordance.
- A semantic `<table>` report: **Plant | Health Benefits | Key Nutrients | Meals**, with
  expand-to-reveal rows (`More Health Benefits`, `Key Nutrients`, `Used In`, `Broaden Your Variety`).
- A shared, trust-guarded display model (`health-benefits-model.ts`) with a single vocabulary
  (`COLUMN_LABELS`, `TERMINOLOGY`, `EMPTY_STATES`, `HEALTH_DISCLAIMER`) reused by Pantry Explore.
- Bidirectional cross-links between Plant Diversity and Pantry Explore.

**The single blocking truth the brief glosses over:** the **Health Benefit registry does not
exist.** `getFoodHealthProfile()` returns `healthBenefits: []` *by design* and is commented as
such — "No structured benefit registry yet — honest empty until data population." Every example in
the brief (`Pumpkin Seeds → Sleep Quality → Magnesium`, "More Health Benefits: Heart Health,
Muscle Function…") is **aspirational data that nothing in the codebase produces.** Today the Health
Benefits column renders `"Health benefit data coming soon"`.

**Therefore the honest framing of "launch-ready" is two-tier:**

- **Tier A — Launch without fabricated health claims (recommended for launch).** Plant Diversity
  launches as a beautiful, trustworthy *plant-variety + key-nutrient* experience. Health Benefits
  render a confident, intentional "coming soon" state — not an apology. This is shippable now with
  UX/responsive polish only.
- **Tier B — The flagship "Health Benefits" experience the brief describes.** Requires a separately
  approved, **curated** Benefit→Nutrient→Food registry. This is a *data and editorial* project, not
  a UI project. It is explicitly **out of this investigation's scope** (no AI-generated claims, no
  data population) and must not be faked to hit a launch date.

The defining-launch-experience ambition is achievable — but the path runs through **curated data
and responsive craft**, not more UI surface area. The biggest risk to this feature is not missing
UI; it is shipping invented health claims to hit Tier B early.

---

## SECTION 2 — USER JOURNEY

### 2.1 Current journey (verified in code)

```
Planner (/planner)
   └─ WeeklyPlantDiversityCounter  → onExplore() → navigate("/plant-diversity")
        └─ Plant Diversity Report page
             ├─ "Explore in Pantry →"  (per missing category)   → /pantry?mode=explore
             └─ "Explore … in your Pantry" (footer)             → /pantry?mode=explore

Pantry Explore (/pantry?mode=explore)
   └─ "See how your week scores …"  → /plant-diversity
```

Only **one** entry point exists today (the planner counter). The two surfaces already cross-link.

### 2.2 Recommended entry points

| Source | Entry? | Rationale |
|---|---|---|
| **Planner counter** | ✅ Keep (primary) | The natural "I just planned my week" moment. |
| **Weekly Nutrition Report** | ✅ Add (when WNR ships) | WNR is the aggregation shell; Plant Diversity is one section with a "View full report →" deep-link. Per the WNR architecture doc, Plant Diversity stays a standalone surface *and* embeds as a WNR section. |
| **Dashboard** | ✅ Add (compact summary card) | A small "Plants this week: 24/30" card with progress bar → deep-links to the page. High-frequency surface; reinforces the habit. |
| **Pantry Explore** | ✅ Keep | Already bidirectional. This is the "what can I add?" → "how did I do?" loop. |
| **Profile / achievements** | ⚠️ Defer | Only meaningful once a streak/achievement model exists. Premature now; revisit post-launch. |
| **Nutrition Strengths** | ⚠️ Defer | Belongs to the WNR synthesis layer; route through WNR, not a direct second path, to avoid two competing "weekly nutrition" entry points. |

**Principle:** *many entrances, one room.* Every surface deep-links to the single
`/plant-diversity` page. Do **not** fork the experience into per-surface variants.

---

## SECTION 3 — PAGE ARCHITECTURE

### 3.1 Confirmed final structure (largely matches today's build)

```
[ Back to your week ]
Plant Diversity Report                         ← page H1

┌─ Header / score ────────────────────────────┐
│ 🌿 30 Plants This Week                       │
│ 24 / 30 plants                               │
│ ▓▓▓▓▓▓▓▓░░░░  (colour: amber/teal/emerald)   │
│ "6 more plants to reach 30 this week."       │
└──────────────────────────────────────────────┘

┌─ Categories Covered ────────────────────────┐
│ ✓ Vegetables   ✓ Fruits    ○ Legumes …       │
└──────────────────────────────────────────────┘

┌─ Easy additions to broaden your week ───────┐  ← only when categories missing
│ Legumes   [Chickpeas · Protein·Fibre] …      │
│           Explore in Pantry →                │
└──────────────────────────────────────────────┘

┌─ Plant Nutrition Report ──────────── Sort ──┐
│ Plant | Health Benefits | Key Nutrients | Meals
│ ▸ 🥬 Spinach   coming soon   Iron·Folate  2 meals
│   └ (expanded) More Health Benefits · Key Nutrients · Used In · Broaden Your Variety
└──────────────────────────────────────────────┘

[ 🧭 Explore … in your Pantry ]               ← cross-link
Footnotes + health disclaimer
```

This is the **correct final structure**. One change and one watch-item:

- **Change — header naming.** The page H1 says "Plant Diversity Report" but the card header inside
  says "30 Plants This Week". Pick one *spoken* name. **Recommendation:** the experience is
  **"Plant Diversity"**; "30 Plants This Week" becomes the *goal label* under it (the brief's own
  hierarchy). Aligns with the WNR doc's surface naming.
- **Watch — two stacked suggestion blocks.** "Easy additions to broaden your week" (category-level,
  top) and per-row "Broaden Your Variety" (bottom of each expanded row) are *two different
  variety mechanics* with overlapping names. See §7 — this needs disambiguation before launch.

### 3.2 Should anything be added/removed?

- **Keep** all current blocks.
- **Add (Tier A, low cost):** a one-line "what counts" affordance is already in the footnote; good.
- **Do not add** per-plant images to the table rows — see §6; it fights the report's scannability.

---

## SECTION 4 — CATEGORY STRUCTURE

### 4.1 The brief's 10 vs. the code's 9 — and a real data fracture

The brief lists **10** categories (Vegetables, Fruits, Legumes, Nuts, Seeds, Herbs & Spices, Whole
Grains, Fermented Foods, Healthy Fats, Other). The code (`PlantCategory` in `nutrition-variety.ts`)
defines **9**:

```
Vegetables · Fruits · Whole Grains · Herbs & Spices · Olive Oil · Legumes · Seeds · Nuts · Fermented Foods
```

**Three concrete inconsistencies found (must be resolved for launch quality):**

1. **"Olive Oil" vs "Healthy Fats".** The code has a single-item category "Olive Oil". The brief
   wants "Healthy Fats". The benefit library (`nutrition-benefit-library.ts`) *already* uses a
   `"Healthy Fats"` category containing **both** Olive Oil and Avocado.
2. **Avocado is double-classified.** `nutrition-variety.ts` lists `avocado` under **FRUITS** (so the
   counter calls it a Fruit), but `nutrition-benefit-library.ts` files Avocado under **Healthy
   Fats**. The same food lands in two categories depending on which module asks.
3. **The benefit library uses category strings that are not `PlantCategory` values at all:**
   `Herbs`, `Mushrooms`, `Fermented`, `Leafy Greens`, `Extra Veg`. These never reconcile with the
   9-value enum. In Pantry Explore the category drives only an emoji, so it degrades silently — but
   it is a latent correctness bug the moment categories are used for grouping or filtering.

### 4.2 Recommended final category structure

Adopt a **single canonical category enum** shared by *both* the counter and the benefit library:

| # | Category | Resolves |
|---|---|---|
| 1 | Vegetables | (absorbs "Leafy Greens", "Extra Veg", "Mushrooms"*) |
| 2 | Fruits | |
| 3 | Legumes | |
| 4 | Whole Grains | |
| 5 | Nuts | |
| 6 | Seeds | |
| 7 | Herbs & Spices | (absorbs "Herbs") |
| 8 | Fermented Foods | (absorbs "Fermented") |
| 9 | **Healthy Fats** | **rename "Olive Oil" → "Healthy Fats"**; holds olive oil **and** avocado |

- **Move avocado** from FRUITS → Healthy Fats so the counter and library agree. (Botanically a
  fruit, but THA's nutrition framing treats it as a healthy fat — match the library's existing
  intent.)
- **Mushrooms\*:** keep counting as Vegetables for the plant counter (they already match the
  VEGETABLES word list), but accept they are fungi, not plants — a footnote already hedges plant
  counting as "an approximation". No user-facing change needed.
- **Do NOT add "Other".** A visible "Other" bucket signals the taxonomy failed. Anything that does
  not match a category simply does not count toward the 30 — which is the current, defensible
  behaviour. Keeping the grid to 9 *named, positive* categories is cleaner than 10-with-a-junk-drawer.

**Verdict:** 9 canonical categories, "Olive Oil"→"Healthy Fats", avocado reclassified, library
category strings reconciled to the enum. No "Other".

---

## SECTION 5 — HEALTH BENEFITS DESIGN

### 5.1 The honest state

`health-benefits-model.ts` is explicit and disciplined:

- `HealthBenefit { name; emoji?; nutrient? }` — the shape exists.
- `getFoodHealthProfile()` **always** returns `healthBenefits: []` and `hasHealthBenefitData: false`.
- `listHealthBenefitTopics()` **always** returns `[]`.
- Comment: *"We never derive outcome claims from free-text supports/tags, and we never call an AI to
  invent them."*

So the brief's questions — *"How many Health Benefits should display by default? Should they be
ranked? Should ranking be data-driven?"* — **cannot be answered with data today, because there is no
data.** Answering them with invented examples would violate the THA trust philosophy and the
explicit scope of this task (no health-claim generation).

### 5.2 Terminology — confirmed

The code already uses exactly the brief's preferred vocabulary, and **avoids** the banned terms:

| Use (in code ✅) | Avoid (absent ✅) |
|---|---|
| Health Benefits | Supports |
| More Health Benefits | Additional Supports |
| Key Nutrients | Primary / Secondary |
| Broaden Your Variety | Show More |

No terminology change needed. This is a strength — lock it via the `TERMINOLOGY` constant (already
the single source of truth; both surfaces import it).

### 5.3 Recommended Health Benefits model (for when Tier B data exists)

When (and only when) a curated registry is approved and populated:

- **Default display: exactly ONE highlighted Health Benefit per plant**, in the collapsed row's
  "Health Benefits" column. One is enough to be informative and keeps the table scannable. The
  table column is already built for a single value (`healthBenefits[0]`).
- **Expanded: "More Health Benefits"** as chips, each as `Benefit · Nutrient` (e.g.
  `Heart Health · Magnesium`). The expanded renderer for this already exists and is correct.
- **Ranking: data-driven, but curated — not computed.** The "highlighted" benefit should be a
  **curated `primaryBenefit` flag** in the registry, not an algorithm over nutrient counts.
  Algorithmic ranking of *health outcomes* is exactly the kind of derived claim the trust philosophy
  forbids. A nutritionist picks the headline; code renders it.
- **Until then:** the current confident empty state stays. Recommend softening copy from
  "coming soon" (sounds unfinished) to something intentional, e.g. *"Key nutrients shown below"* —
  i.e. lead with the *real* data (Key Nutrients) and treat Health Benefits as an additive future
  layer, not a hole.

### 5.4 The Benefit → Nutrient → Food registry (the missing data layer)

This is the keystone. Proposed curated shape (data task, not this task):

```
HealthBenefit topic:  { id, name, emoji, description (curated), citations[] }
BenefitNutrientLink:  { benefitId, nutrient, strength: "established" | "emerging" }
                       (nutrient already exists in NutritionBenefit.keyNutrients)
```

Foods already carry `keyNutrients`. The registry bridges **Benefit → Nutrient**; the existing
library bridges **Nutrient → Food**. Compose them and every food inherits benefits *through its
nutrients* — no per-food claim authoring, fewer review surfaces, and the chain is auditable
(`Sleep Quality → Magnesium → Pumpkin Seeds`). This is the cleanest, most trustworthy construction
and it reuses 100% of the existing food/nutrient data.

---

## SECTION 6 — MEALS DESIGN

### 6.1 Current behaviour (verified)

- Collapsed row shows a **count** only: `3 meals ▸` (right-aligned, `tabular-nums`). On mobile the
  count moves into the stacked summary line under the plant name.
- Expanded row shows **"Used In"**: meal name + day (`Thai Feast · Thursday`), wrap-flow chips.
- No recipe link, no image, no SBC count today.

This already matches the brief's "do not list meals inline; show `3 Meals ▼`" instinct. Good.

### 6.2 Recommendations for the four brief questions

| Question | Recommendation | Why |
|---|---|---|
| **Link to recipe?** | ✅ **Yes** — make each "Used In" meal name a link to `/meals/:id`. | Closes the loop from "this plant appeared in X" back to the meal. High value, low risk. *Requires* the entry to carry a meal id (see §11 — `WeekMealEntry` currently has only `mealName`/`dayName`, no id). |
| **Show image?** | ❌ **No** in the table; ✅ optional small thumbnail only in the expanded "Used In" list. | Images in collapsed rows destroy the report's scannability and break column alignment. Keep the table textual. |
| **Show day?** | ✅ **Yes** — already implemented (`· Thursday`). | Lightweight temporal context; keep. |
| **Show Simply Better Choices count?** | ⚠️ **No, not here.** | SBC is a *per-meal* improvement surface. A plant→meal→SBC count is two hops of indirection and conflates "diversity" with "improvement". Surface SBC on the meal page where it lives. (See §9 — link out, don't embed counts.) |

**Cleanest UX:** collapsed = count + chevron; expanded = `MealName (link) · Day` chips. No images in
the row, optional thumbnail only on expand if desired post-launch. This is essentially the current
design plus recipe links plus a meal id on the data seam.

---

## SECTION 7 — BROADEN YOUR VARIETY

### 7.1 Critical finding — the current "Broaden Your Variety" is not what the brief imagines

Today there are **two distinct mechanics**, and one is **mislabelled**:

1. **Category-level "Easy additions to broaden your week"** (top block,
   `CategoryCompletionSuggestions`): for each *missing category*, shows 1–2 curated suggestions from
   `CATEGORY_SUGGESTIONS` (e.g. Legumes → Chickpeas, Lentils). This is genuine, useful, curated
   suggestion. ✅
2. **Per-row "Broaden Your Variety"** (inside each expanded plant row): despite the name, this shows
   **only the variant forms the user actually already used** (`row.variants` — e.g. if they typed
   "cherry tomatoes" under Tomatoes). It does **not** suggest *new* plants. The brief's example
   (`Pumpkin Seeds → Chia Seeds, Flax Seeds, Sesame Seeds`) is **not produced anywhere.**

So the brief's PART 5 vision is **partially unbuilt and partially mislabelled.** This is the second
biggest gap after Health Benefits.

### 7.2 Recommended model

Answer to "same family / similar nutrient / same category / all of the above": **a curated,
same-category-with-nutrient-overlap list — not algorithmic "all of the above".**

- **Primary signal: same category.** "Broaden Your Variety" under a Seed should suggest other Seeds.
  This is intuitive and matches the 30-plants mental model (more *kinds* within a group).
- **Secondary signal: nutrient overlap** to order suggestions (suggest the same-category foods that
  share or complement key nutrients first). Data already exists (`keyNutrients` + `buildNutrientIndex`).
- **Source: curated.** Reuse `CATEGORY_SUGGESTIONS` / the benefit library as the candidate pool, and
  **exclude plants already used this week** so suggestions are always actionable.
- **Do NOT** do free "similar nutrient profile across all categories" — it produces surprising,
  hard-to-trust pairings (e.g. suggesting a fortified grain next to a seed for "omega-3").

**Naming fix (required):** rename the per-row variant display from "Broaden Your Variety" to
**"Forms you used"** (or fold it into "Used In"), and reserve **"Broaden Your Variety"** for the
*actual suggestion* mechanic. One name, one meaning.

---

## SECTION 8 — SORTING STRATEGY

### 8.1 Current (verified)

Three sorts via `SortControl`: **Plant**, **Category** (default), **Meals**. Implemented in
`sortPlantRows`. Clean pill UI with `aria-pressed`.

### 8.2 The brief wants five (adds Health Benefits, Key Nutrients)

| Sort | Recommendation |
|---|---|
| Category | ✅ Keep — default; supports "did I cover the food groups?" |
| Plant | ✅ Keep — A→Z lookup. |
| Meals | ✅ Keep — "what did I lean on most?" |
| **Key Nutrients** | ⚠️ **Defer.** Sorting by a *list* of nutrients has no obvious order (alphabetical by first nutrient? by count?). Low value, high confusion. If added, define it as "by nutrient count, desc". |
| **Health Benefits** | ❌ **Cannot exist** — no benefit data (§5). Adding a sort that orders by empty values is a broken control. Add only in Tier B. |

### 8.3 Food-first vs health-first without confusion

Yes — but **not via a 5th sort.** The clean answer is the existing **two-surface split** (confirmed
by the WNR architecture doc):

- **Plant Diversity = food-first** ("which plants/meals this week").
- **Pantry Explore = health-first** (browse by Health Benefit / Key Nutrient / Food via its `lens`
  tabs).

Keep Plant Diversity's sorting to the 3 food-first sorts. Push "health-first exploration" to Pantry
Explore (already built with `benefits | nutrients | foods` lenses). Trying to make one table do both
*is* the confusion the brief worries about. **Recommendation: 3 sorts, not 5.**

---

## SECTION 9 — CROSS-LINK ARCHITECTURE

### 9.1 Current (verified)

| From | To | Status |
|---|---|---|
| Plant Diversity (per missing category) | `/pantry?mode=explore` | ✅ exists |
| Plant Diversity (footer) | `/pantry?mode=explore` | ✅ exists |
| Pantry Explore (footer) | `/plant-diversity` | ✅ exists |

### 9.2 Recommended cross-links

| Link | Verdict | Notes |
|---|---|---|
| Plant Diversity ↔ Pantry Explore | ✅ Keep both directions | The "how did I do?" ↔ "what can I add?" loop. Core. |
| **Per-plant "View in Pantry Explore →"** (brief PART 7) | ✅ **Add** | In each expanded row, deep-link the plant into Pantry Explore's Foods lens. Pantry Explore would need to accept a focus param (out of scope here; note for implementation). |
| Plant Diversity → Weekly Nutrition Report | ✅ Add when WNR ships | "Plant Diversity is one section of your Weekly Nutrition Report →". |
| **Plant Diversity → Simply Better Choices** | ⚠️ **Limited.** Link plant→**meal** (`/meals/:id`), and let SBC live on the meal page. | Do **not** surface "Add to: Thai Feast" *from* Plant Diversity. That is an editing action on a meal; performing it from a diversity *report* conflates read and write surfaces and duplicates SBC logic. Diversity reports; the meal page improves. |
| Dashboard → Plant Diversity | ✅ Add | Summary card (see §2). |

**Links that should NOT exist:** any write/edit action initiated from the diversity report (adding
ingredients to meals); a second independent "weekly nutrition" entry that bypasses WNR; SBC
suggestion *counts* inline in the plant table (§6).

**Principle:** Plant Diversity is **read-only and reflective.** It links *out* to where actions
happen; it does not perform actions.

---

## SECTION 10 — RESPONSIVE LAYOUTS

### 10.1 Current behaviour and the breakpoint mismatch (key finding)

`PlantDiversityReport` uses a semantic `<table>`. Secondary columns are `hidden md:table-cell`
(Tailwind `md` = **768px**). Below 768px, only the **Plant** column shows, with nutrients + meal
count folded into a stacked sub-line. Above 768px, all four columns show.

**But** the Adaptive Density Foundation (`use-adaptive-density.tsx`) switches at **640px**
(`compact`) and **1280px** (`expanded`), with `isUltrawide` at 1536px. So today the *table layout*
breakpoint (768) and the *density system* breakpoints (640/1280/1536) **disagree**, and
`PlantDiversityReport` does not consume `useAdaptiveDensity` at all (unlike SBC, which takes a
`density` prop and scales padding/text). This is the main launch-quality gap for responsiveness.

### 10.2 Recommended breakpoint behaviour

| Width | Density | Plant Diversity layout |
|---|---|---|
| **375px** | compact | **Card list** (no table). Each plant = a card: name + emoji, nutrient chips, `N meals` row, tap to expand. No horizontal scroll. |
| **640px** | compact→comfortable boundary | **Switch point: table appears here.** At ≥640 the 4-column table is viable in portrait. |
| **768px** | comfortable | Full 4-column table (current `md` behaviour). |
| **1024px** | comfortable | Table with comfortable padding/text. |
| **1280px** | expanded | Table with expanded padding; max-width container (`max-w-4xl` today — consider `max-w-5xl` at expanded). |
| **1536px** | expanded / ultrawide | Cap content width; do not let rows stretch to unreadable line lengths. |

**Recommendation:** switch **Table ↓ Card** at **640px**, aligning the layout breakpoint to the
density system's `compact` boundary (not the current 768 `md`). Adopt `useAdaptiveDensity` in the
report so padding/text scale across compact/comfortable/expanded the way SBC already does — this is
what "use the existing Adaptive Density Foundation" means in practice.

### 10.3 Requirements checklist

- **No horizontal scroll:** card layout below 640 guarantees this (the current sub-640 table with
  one visible column is *okay* but a card layout is more deliberate and avoids any wide-content
  edge case).
- **No clipped tables:** secondary columns already collapse gracefully.
- **No JSON-like layouts / overcrowding:** expanded-row chips wrap; keep chip counts capped
  (nutrients already `slice(0,2)` in collapsed view).
- **Compact / Comfortable / Expanded:** wire `density` through; today only SBC honours it.

---

## SECTION 11 — SHARED DATA MODEL

### 11.1 What exists (verified)

```
nutrition-benefit-library.ts
  NutritionBenefit { name, category, keyNutrients[], summary }      ← curated, REAL
  getNutritionBenefit(ingredient) · getAllNutritionBenefits()

health-benefits-model.ts   (the shared display adapter)
  FoodHealthProfile { canonicalKey, displayName, category, keyNutrients[],
                      summary, healthBenefits[], hasHealthBenefitData }
  HealthBenefit { name, emoji?, nutrient? }                         ← shape only, always []
  getFoodHealthProfile() · listLibraryFoods() · buildNutrientIndex() · listHealthBenefitTopics()

nutrition-variety.ts
  PlantCategory (9 values) · isPlantIngredient() · getPlantCategory()

PlantDiversityReport.tsx
  WeekMealEntry { mealName, dayName, ingredients[] }                ← note: NO meal id
```

The WNR architecture doc confirms `useWeekMealEntries` is the shared weekly data seam. The display
model already deliberately separates **real curated data** (keyNutrients, summary) from the
**reserved, empty** Health Benefits shape.

### 11.2 Recommended final shared model

```
HealthBenefit (topic)         → Nutrient(s)          → Food/Plant             → Meals          → Actions
  curated registry (NEW data)   keyNutrients (EXISTS)  NutritionBenefit (EXISTS) WeekMealEntry    cross-links
```

| Field | Required? | Source | Notes |
|---|---|---|---|
| `canonicalKey` | required | derived (`normaliseForReuse`) | join key across all surfaces |
| `displayName` | required | curated / derived | |
| `category` | required | `getPlantCategory` (canonical enum) | reconcile library strings → enum (§4) |
| `keyNutrients[]` | required | curated library | REAL today |
| `summary` | optional | curated library / pantry knowledge | REAL today |
| `healthBenefits[]` | optional | **curated registry (does not exist)** | empty until Tier B |
| `primaryBenefit` | optional | **curated registry** | the single highlighted benefit (§5.3) |
| `mealName` | required | `WeekMealEntry` | EXISTS |
| `mealId` | **required (ADD)** | `WeekMealEntry` | **missing today** — needed for recipe links (§6) |
| `dayName` | optional | `WeekMealEntry` | EXISTS |
| `varietySuggestions[]` | optional | **curated** | same-category pool minus used (§7) |

**What requires curated sources (and must NOT be AI-generated):** `healthBenefits`, `primaryBenefit`,
benefit descriptions/citations, and the variety suggestion pool. Everything else already exists or
is derivable.

**Reuse confirmation:** this single model already feeds **Plant Diversity** and **Pantry Explore**;
the WNR doc designs WNR to consume the same seam; **Simply Better Choices** and **Choose Better**
share the `keyNutrients`/benefit-library layer via `uplift-rules`. The one additive field needed for
cross-surface coherence is **`mealId` on `WeekMealEntry`**.

---

## SECTION 12 — LAUNCH DEFINITION OF DONE

Plant Diversity is **Launch Ready (Tier A)** when:

**UX**
- [ ] Single spoken name resolved ("Plant Diversity"; "30 plants" is the goal label).
- [ ] Two variety mechanics disambiguated (§7): "Easy additions" (category) vs per-row variants renamed.

**Responsiveness**
- [ ] Card layout < 640px; table ≥ 640px; no horizontal scroll at 375/640/768/1024/1280/1536.
- [ ] `useAdaptiveDensity` wired for compact/comfortable/expanded padding & text.

**Trust**
- [ ] Health Benefits render an *intentional* empty state (not "coming soon" apology); lead with real Key Nutrients.
- [ ] `HEALTH_DISCLAIMER` present on both surfaces.
- [ ] Zero fabricated/AI-generated health claims anywhere.

**Health Benefits**
- [ ] (Tier A) Confident empty state. **(Tier B, separate task)** curated registry populated; one primary benefit + "More Health Benefits".

**Cross-links**
- [ ] Plant Diversity ↔ Pantry Explore both directions (exists).
- [ ] Per-plant "View in Pantry Explore →" (needs Pantry focus param).
- [ ] Meal names link to `/meals/:id` (needs `mealId` on seam).
- [ ] WNR section link (when WNR ships).

**Educational value**
- [ ] Every plant shows ≥1 real fact (key nutrients) or honest empty state.
- [ ] Category coverage grid communicates the "spread your week" lesson.

**Data completeness**
- [ ] Canonical 9-category enum reconciled across counter + library; avocado reclassified.
- [ ] Benefit library coverage audited against the plants users most commonly enter.

**Empty states (§8 of brief / all verified copy exists in `EMPTY_STATES`)**
- [ ] No plants yet · No Health Benefits · No meals · No variety suggestions — all safe, no fabrication.

**Performance**
- [ ] `computePlantData` / sorting memoised (already are).
- [ ] No layout thrash on resize from density listeners.

**Future extensibility**
- [ ] `healthBenefits[]` renders the moment the registry lands, with no further UI change (already true).

---

## SECTION 13 — RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Pressure to populate Health Benefits with AI/uncurated claims to hit a "flagship" launch.** | 🔴 High | Ship Tier A. Treat Tier B as a curated data project with editorial review + citations. This is the defining risk. |
| R2 | **Category fracture** (Olive Oil vs Healthy Fats, avocado double-classified, library strings off-enum). | 🟠 Medium | §4 reconciliation before launch. |
| R3 | **"Broaden Your Variety" mislabelled** — users expect suggestions, get their own variant spellings. | 🟠 Medium | §7 rename + build curated suggestions. |
| R4 | **Breakpoint mismatch** (table 768 vs density 640/1280); report ignores Adaptive Density. | 🟠 Medium | §10 — switch at 640, adopt `useAdaptiveDensity`. |
| R5 | **No `mealId` on `WeekMealEntry`** blocks recipe cross-links. | 🟡 Low | Additive field on the shared seam. |
| R6 | **Plant counting is approximate** (word-list matching; mushrooms-as-veg; misses unlisted foods). | 🟡 Low | Footnote already hedges; expand word lists over time. Do not over-promise precision. |
| R7 | **Surface sprawl** — adding health-first sorting/edit actions blurs Plant Diversity into Pantry Explore / SBC. | 🟠 Medium | Hold the one-surface-one-question line (§8, §9). |
| R8 | **Empty Health Benefits column reads as "broken"** to first users. | 🟡 Low | §5.3 copy: lead with Key Nutrients, frame benefits as additive. |

---

## SECTION 14 — FINAL RECOMMENDATION

**Launch Plant Diversity as Tier A now** — a beautiful, trustworthy *plant-variety + key-nutrient*
experience whose only honest gap (Health Benefits) is presented as an intentional, additive future
layer rather than a hole. The component is ~80% there; the remaining 20% is **craft and data
reconciliation, not new features:** responsive card/table behaviour wired to Adaptive Density, the
category enum reconciled, the two variety mechanics disambiguated, and meal/Pantry cross-links
completed.

**Do not** chase the brief's "Pumpkin Seeds → Sleep Quality" flagship vision by generating health
claims. That vision is real and worth building — as a **separately approved, curated
Benefit→Nutrient→Food registry** (Tier B). The UI is already built to render it the day the data
lands. Forcing it early is the one move that would make Plant Diversity *less* trustworthy, not more.

The defining-launch-experience ambition is achievable. The path is curated data + responsive polish,
held inside the "separate but connected" five-surface architecture — Plant Diversity answers *"how
diverse was my week?"* and links out to the surfaces that answer the other questions.

---

## FINAL REPORT (brief's required 14 answers)

1. **Rollback identifier:** `rollback/plant-diversity-launch-design-20260617` → commit `bae3b99`.
2. **Current branch:** `safety/preserve-since-last-prod-20260617-1613`.
3. **Recommended final UX:** Keep the current page structure (header score + progress + status,
   Categories Covered grid, missing-category suggestions, expandable Plant report, cross-links).
   Resolve to one spoken name ("Plant Diversity"). Read-only/reflective surface that links out to
   actions; food-first.
4. **Recommended category structure:** 9 canonical categories — Vegetables, Fruits, Legumes, Whole
   Grains, Nuts, Seeds, Herbs & Spices, Fermented Foods, **Healthy Fats** (rename from "Olive Oil",
   holds olive oil + avocado). Reconcile benefit-library strings to this enum; reclassify avocado;
   **no "Other".**
5. **Recommended Health Benefits model:** One curated **primary** benefit shown by default;
   "More Health Benefits" on expand as `Benefit · Nutrient` chips. Ranking **curated, not
   algorithmic.** Built on a **Benefit→Nutrient→Food** registry (does not exist yet). Until then,
   intentional empty state that leads with real Key Nutrients.
6. **Recommended Meals UX:** Collapsed = `N meals ▸`; expanded = `MealName · Day` chips with meal
   names **linking to `/meals/:id`** (requires adding `mealId` to the seam). No images in the table;
   no SBC counts inline.
7. **Recommended Broaden Variety model:** Curated, **same-category** suggestions ordered by nutrient
   overlap, **excluding plants already used.** Not "all of the above." **Rename** today's per-row
   variant display (it is not a suggestion) and reserve "Broaden Your Variety" for real suggestions.
8. **Recommended sorting:** Keep **3** sorts (Category default, Plant, Meals). Defer Key Nutrients;
   Health Benefits sort cannot exist without data. Health-first exploration belongs to Pantry
   Explore, not a 4th/5th sort.
9. **Recommended cross-links:** Keep Plant Diversity ↔ Pantry Explore (both ways). Add per-plant
   "View in Pantry Explore →", meal→recipe links, and a WNR-section link when WNR ships. **Exclude**
   edit/write actions and inline SBC counts; link plant→meal and let SBC live on the meal page.
10. **Recommended shared data model:** Reuse `FoodHealthProfile` / `NutritionBenefit` across all five
    surfaces. Required: canonicalKey, displayName, category, keyNutrients, mealName, **mealId (add)**.
    Optional/curated: summary, healthBenefits, primaryBenefit, varietySuggestions, dayName.
    Curated-only (never AI): all health benefits + suggestion pools.
11. **Launch Definition of Done:** §12 — Tier A (responsive + density + trust + cross-links +
    category reconciliation + honest empty states) is shippable now; Tier B (curated benefit
    registry) is a separate approved data task.
12. **Risks:** §13 — top risk is pressure to fabricate health claims for a "flagship" launch (R1);
    then category fracture (R2), mislabelled variety (R3), breakpoint/density mismatch (R4).
13. **Confidence level:** **High** on the code-grounded findings (current build, empty Health
    Benefits, category fracture, breakpoint mismatch, mislabelled variety — all verified in source).
    **Medium** on Tier B specifics (registry shape, exact curated content) since that data does not
    yet exist and depends on editorial/nutrition input.
14. **Confirmation — no code changes made:** ✅ Confirmed. No code, CSS, route, schema, API,
    migration, or data changes. Only artefacts created: this markdown file and the git tag
    `rollback/plant-diversity-launch-design-20260617`.
