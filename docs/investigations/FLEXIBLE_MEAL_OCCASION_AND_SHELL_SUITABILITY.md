# Flexible Meal Occasion & Shell Suitability — Investigation

**Date:** 2026-06-14
**Branch:** `main` @ `39de349`
**Rollback tag:** `rollback/pre-flexible-meal-investigation-2026-06-14` → `21f32741d645cf29d20ca07b798dc1572323a52e`
**Scope:** Investigation only. **No** schema changes, **no** shell seeding, **no** planner changes, **no** implementation.
**Method:** Read-only schema audit + read-only live DB queries (category distributions) + source trace of the Smart Planner slot pipeline.

---

## TL;DR — Final Verdict: **STATUS D (Hybrid model)**

THA should adopt a **Hybrid** shell model:

> **`primarySlot`** (one slot — drives display, default placement, sort)
> **+ `suitableSlots[]`** (the slots a shell may legitimately fill)
> **+ optional advisory `energyBand`** (derived from calories, *not* a hard gate)
> **+ optional `styleTags[]`** (Brunch, One-Pot, Lunchbox… for discovery, not gating)

Reasoning in §Final Verdict. Three facts drive it:

1. **The codebase already does primitive multi-slot mapping** — just not per-meal. `SLOT_CATEGORY_MAPPING` lets a `snack` fill *lunch + snack*, and a `smoothie` fill *breakfast + snack*. A per-meal `suitableSlots[]` is the natural, low-risk generalisation of code that already exists.
2. **The data model stores exactly one category per item** (`meal_templates.category` text; `meals.category_id` FK). There is **no** `suitableSlots`, `primaryMealSlot`, `energyBand`, `servingOccasion`, or `tags` field anywhere. Flexibility is currently impossible at the data layer.
3. **Rigid B/L/D fails real households** exactly as the brief describes (cooked breakfast for dinner, soup for lunch *or* dinner, leftovers, brunch). A pure Meal-Style model (Status C) throws away the slot signal the planner genuinely needs to fill a 4-slot day.

> ⚠️ **Terminology warning that runs through this whole document:** the existing
> `proteinSlots` / `carbSlots` / `vegSlots` / `toppingSlots` / `sauceSlots` columns are
> **component slots** (the shared-meal "base + swappable parts" architecture). They are
> **NOT meal-occasion slots** (breakfast/lunch/dinner/snack). This investigation is about
> *meal-occasion* suitability. Wherever this doc says "slot" unqualified, it means
> meal-occasion unless it says "component slot".

---

## 1. `meal_templates` Schema Audit

Source: `shared/schema.ts:48-72` (table) and `:805-827` (insert schema).

### Exact fields present today

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | text NOT NULL | |
| **`category`** | text NOT NULL default `"dinner"` | **single value** — the only occasion-ish field |
| `description` | text | |
| `imageUrl` | text | |
| `defaultCalories` | integer (nullable) | the only calorie-ish field; **mostly null in practice** |
| `defaultProtein` / `defaultCarbs` / `defaultFat` | integer (nullable) | |
| `title` | text | shared-meal display |
| `cuisine` | text | |
| `sharedBaseComponents[]` | text[] | **component slot** (not occasion) |
| `proteinSlots[]` | text[] | **component slot** |
| `carbSlots[]` | text[] | **component slot** |
| `vegSlots[]` | text[] | **component slot** |
| `toppingSlots[]` | text[] | **component slot** |
| `sauceSlots[]` | text[] | **component slot** |
| `compatibleDiets[]` | text[] | diet adaptability |
| `estimatedTotalTime` | integer | ≈ prep time |
| `estimatedExtraTimePerVariant` | integer | |
| `costBand` | text | "standard" / etc. |
| `isActive` | boolean default true | |

### Does it support the requested concepts?

| Requested field | Supported? | Closest existing field |
|---|---|---|
| `primaryMealSlot` | ❌ No | `category` (single text) is the de-facto primary, but is not named/typed as a slot |
| `mealCategory` | ⚠️ Partial | `category` (free text, inconsistent casing — see §2) |
| `suitableSlots[]` | ❌ **No** | none — this is the central gap |
| `energyBand` | ❌ No | none (could be *derived* from `defaultCalories`, but that column is largely unpopulated) |
| `calories` | ⚠️ Partial | `defaultCalories` exists but is mostly null on templates |
| `servingOccasion` | ❌ No | none |
| `tags` | ❌ No | `compatibleDiets[]` is the only array tag-like field, and it is diet-only |
| equivalent? | — | `cuisine`, `costBand`, `compatibleDiets[]` exist but none expresses *when* a meal is eaten |

**Conclusion (Q1):** The template table models **one occasion category per shell** and a rich
**component-slot** structure. It has **no concept of multi-occasion suitability, energy band,
serving occasion, or free tags.** Adding flexibility requires either a new column
(`suitableSlots[]`) or reliance on the planner's category→slot mapping (see §3).

---

## 2. Existing Meal Categorisation Audit

There are **two parallel, non-aligned taxonomies**:

### (a) `meal_templates.category` — free text (650 rows, live counts)

| category | count | populated (component slots) |
|---|---:|---:|
| `dinner` | 297 | 0 |
| `lunch` | 61 | 0 |
| `drink` | 56 | 0 |
| `breakfast` | 46 | **1** ← *only populated shell ("Cooked Breakfast")* |
| `frozen meal` | 46 | 0 |
| `dessert` | 42 | 0 |
| `Dinner` | 26 | 0 |
| `snack` | 24 | 0 |
| `kids meal` | 21 | 0 |
| `baby meal` | 21 | 0 |
| `Lunch` | 5 | 0 |
| `Breakfast` | 3 | 0 |
| `Dessert` | 2 | 0 |

> **Data-quality flags:** casing is inconsistent (`dinner` 297 vs `Dinner` 26; `lunch` 61 vs
> `Lunch` 5; etc.). The planner lower-cases before matching so this does *not* break slot fit,
> but it confirms `category` is uncontrolled free text. **649 of 650 templates have zero
> component-slot data** — Tier-4 shell recovery is effectively a one-shell feature.

### (b) `meals.category_id` → `meal_categories` enum table (2,108 user/system meals)

`meal_categories` is a clean 12-row enum: Breakfast, Lunch, Dinner, Snack, Smoothie, Dessert,
Drink, Immune Boost, Supplement, Baby Meal, Kids Meal, Frozen Meal.

| category | meal count |
|---|---:|
| Dinner | 686 |
| Lunch | 493 |
| Breakfast | 479 |
| **(uncategorised / null)** | **240** |
| Drink | 59 |
| Frozen Meal | 46 |
| Dessert | 40 |
| Snack | 24 |
| Baby Meal | 21 |
| Kids Meal | 20 |

**Each meal and each template carries exactly ONE category.** There is no multi-slot field on
either table today.

### Could the listed examples appear in multiple slots? (current vs desired)

| Meal | Current single category (how it's classified) | *Should* be suitable in |
|---|---|---|
| Cooked Breakfast | `breakfast` | Breakfast, **Lunch, Dinner** (brunch / brinner) |
| Soup | inferred `lunch` (name keyword "soup") | **Lunch, Dinner** |
| Grain Bowl | no keyword → defaults `dinner` | Lunch, Dinner |
| Salad | inferred `lunch` | Lunch, Dinner (side) |
| Omelette | inferred `breakfast` | Breakfast, **Lunch, Dinner** |
| Smoothie | `smoothie` / inferred `breakfast` | Breakfast, **Snack** |
| Curry | no keyword → `dinner` | Lunch (leftovers), Dinner |
| Leftovers | **no concept exists** | any slot |
| Sandwich | inferred `lunch` | Lunch, Snack |
| Pizza | no keyword → `dinner` | Lunch, Dinner |

**Conclusion (Q2):** Today the answer is **no — every item is locked to one category.**
*However*, the planner's consumer layer (§3) already grants limited cross-slot reuse for a few
categories (`snack`→lunch, `smoothie`→breakfast). Real multi-occasion suitability per meal is
not represented.

---

## 3. Current Planner Mutual-Exclusivity Assumptions

The Smart Planner does **not** have a file literally called "smart-planner". The pipeline lives in:

- **`server/lib/smart-suggest-service.ts`** — `generateSmartSuggestion()` and the slot-fill tier engine
- **`server/lib/household-meal-matcher.ts`** — `matchMealsForHousehold()` / `scoreTemplate()` (Tier-4 source)
- **`server/lib/external-meal-service.ts`** — `inferCategoryFromCuisineAndName()` (assigns categories to scraped meals)
- **`shared/schema.ts`** — `upsertPlannerEntrySchema.mealType` enum

### The single source of slot exclusivity

`server/lib/smart-suggest-service.ts:250-255`

```ts
const SLOT_CATEGORY_MAPPING: Record<string, string[]> = {
  breakfast: ["breakfast", "smoothie"],
  lunch:     ["lunch", "snack", "salad"],
  dinner:    ["dinner", "main"],
  snack:     ["snack", "dessert", "smoothie", "drink"],
};
```

This is the **entire** occasion model. **Key insight:** it is *already a many-to-many reverse
map*, not strict exclusivity. A meal whose single category is `snack` is eligible in **both**
`lunch` and `snack`. A `smoothie` is eligible in **both** `breakfast` and `snack`. So the system
already supports a crude "one category → multiple suitable slots" — driven by the *category
value*, not by the *meal*.

### Functions / assumptions

| File · function (line) | Assumption |
|---|---|
| `smart-suggest-service.ts` · `SLOT_CATEGORY_MAPPING` (250) | Each slot has a fixed allow-list of category strings. The only place the occasion taxonomy is defined. |
| `smart-suggest-service.ts` · `getCandidateSlotFit()` (325) | A candidate has exactly **one** `category`; fit = `allowed.includes(category)`. **Null category → eligible for `dinner` only.** |
| `smart-suggest-service.ts` · `getSafeFallbackCandidates()` (288) | **Breakfast is strict** — only `breakfast`/`smoothie` may ever fall back into breakfast; no cross-slot promotion into breakfast. |
| `smart-suggest-service.ts` · `getRepeatCandidates()` (317) | Tier-3 reuse still gated by `getCandidateSlotFit` (same boundary). |
| `smart-suggest-service.ts` · `selectShellRecoveryCandidate()` (345) | Tier-4 shells gated by the **same** `SLOT_CATEGORY_MAPPING` on `template.category`. A shell can only rescue the slot(s) its single category maps to. |
| `smart-suggest-service.ts` · slot loop (422-428, 680) | The day is built as a fixed ordered list `["breakfast","lunch","dinner","snack"]` (subset by `mealsPerDay`); each slot is filled **independently** and an item used in one slot is marked used. |
| `external-meal-service.ts` · `inferCategoryFromCuisineAndName()` (146) | Assigns **one** category from name keywords; **defaults to `dinner`**; **never emits `snack`**. |
| `shared/schema.ts` · `upsertPlannerEntrySchema` (502) | Planner entries are persisted under a mutually-exclusive `mealType ∈ {breakfast,lunch,dinner,snacks}`. |

**Conclusion (Q3):** Mutual exclusivity is *softer than expected*. It is enforced at exactly one
place (`SLOT_CATEGORY_MAPPING`) and is already a many-to-many at the **category** level. What is
genuinely rigid:
- **One category per item** (data layer) — the real ceiling on flexibility.
- **Breakfast is hard-walled** (no promotion in).
- **Null-category items collapse to dinner** — this is why dinner is over-supplied and breakfast/snack starve (240 null meals + 297 dinner templates).
- **Inference never produces `snack`**, so the snack slot has almost no native supply.

---

## 4. Flexible Suitability Model (`primarySlot` + `suitableSlots[]`)

**Yes — this is feasible and is the smallest possible change to the existing design.**

The planner already asks "does this item's category belong to this slot's allow-list?" The
flexible model inverts ownership: instead of the *slot* listing acceptable categories, each
*meal/shell* lists the slots it suits.

Worked examples from the brief:

| Shell | `primarySlot` | `suitableSlots[]` |
|---|---|---|
| Cooked Breakfast | Breakfast | Breakfast, Lunch, Dinner |
| Soup | Lunch | Lunch, Dinner |
| Smoothie | Breakfast | Breakfast, Snack |

Two implementation routes (described, **not** implemented):

- **Route A — per-meal column (recommended target):** add `suitableSlots text[]` (+ keep/rename
  `category` as `primarySlot`). `getCandidateSlotFit()` becomes `candidate.suitableSlots.includes(slot)`,
  falling back to the `SLOT_CATEGORY_MAPPING` derivation when `suitableSlots` is null (so legacy
  rows keep working). This is a ~3-line planner change behind a populated column.
- **Route B — no schema change, richer reverse map:** expand `SLOT_CATEGORY_MAPPING` so more
  categories map to more slots. Cheap, but it can only express suitability at the *category*
  granularity (every "soup-categorised" item behaves identically); it cannot say "*this* cooked
  breakfast also works at dinner but *that* one doesn't."

Route A is the correct long-term model; Route B is a viable interim. The **primarySlot** value
preserves a sensible default for display, sorting, and the "where does this normally go" UX, while
**suitableSlots[]** governs planner eligibility — matching the THA philosophy of *shared meal +
adaptation*.

**Conclusion (Q4):** A `primarySlot` + `suitableSlots[]` model maps cleanly onto the existing
single-enforcement-point planner and is the natural generalisation of code already shipping.

---

## 5. Energy Bands

**Current state:** no energy band field. `meal_templates.defaultCalories` exists but is largely
unpopulated; `meals` calories live in the `nutrition` table as **text** strings.

Three options:

| Option | Pros | Cons |
|---|---|---|
| **Light / Medium / Hearty** (qualitative band) | Human-meaningful; directly enables "light dinner / large lunch"; robust to missing exact calorie data; great UX label | Subjective thresholds; needs per-shell curation or a derivation rule; band ≠ portion (a hearty shell can be served light) |
| **Low / Moderate / High calories** (quantitative band) | Objective, derivable from `defaultCalories`/`nutrition`; testable | Calorie data is sparse/`text`-typed today; calories alone misrepresent satiety (a 600-cal salad vs 600-cal pasta); per-person target varies |
| **No energy bands** | Zero new surface; simplest | Loses the exact lever the brief calls for ("light dinners", "large lunches", "grazing"); planner can't balance a day's energy shape |

**Recommendation:** Adopt a **qualitative `energyBand` (Light/Medium/Hearty)** but treat it as
**advisory metadata, not a hard gate** — i.e. it influences ranking and day-shape balancing, never
eligibility. Derive an initial value from `defaultCalories` where present, otherwise curate per
shell. Keeping it advisory avoids the trap of calorie-data sparsity blocking the planner. This is
high-value-for-THA because "hearty breakfast → light dinner" is precisely the household rhythm the
brief describes.

**Conclusion (Q5):** Yes, THA benefits — but as a **soft, derived signal layered on top of slots**,
not a fourth hard dimension.

---

## 6. Can Suitability Be Inferred?

The codebase **already infers** a single category via
`external-meal-service.ts:inferCategoryFromCuisineAndName()` (name keywords → category, default
`dinner`, never `snack`). So inference is real, live, and *demonstrably partial*.

Reliability of candidate signals for inferring `suitableSlots[]`:

| Signal | Reliability | Notes |
|---|---|---|
| **Explicit existing category** | **High** | Best anchor for `primarySlot`; but it's one value and casing is dirty (§2) |
| **Meal name keywords** | **Medium** | Strong for breakfast (`omelette`, `porridge`, `shakshuka`…) and lunch (`soup`, `salad`, `sandwich`, `wrap`); weak elsewhere; "grain bowl", "curry", "pizza", "leftovers" produce **no signal** and fall to `dinner` |
| **Ingredients** | **Medium** | Informative (eggs+bacon → breakfast-capable) but expensive and noisy; many dishes share ingredients across occasions |
| **Calories / serving size** | **Low–Medium** | Useful for **energyBand**, weak for *slot* (a 500-cal dish fits any slot) |
| **Prep time** (`estimatedTotalTime`) | **Low** | Quick ≈ breakfast/snack-leaning, slow ≈ dinner-leaning — weak heuristic only |
| **Cuisine** | **Low** | Mostly orthogonal to occasion |
| **Tags** | n/a | No tag field exists yet |

**Failure modes proven in current data:** 240 null-category meals + every keyword-less template
collapse to `dinner`; the `snack` slot is never inferred and so is structurally starved.

**Conclusion (Q6):** Inference is good enough to **bootstrap defaults** (especially `primarySlot`
and a first guess at `suitableSlots[]`), but it is **not reliable enough to be the sole authority.**
It should seed values that a curator/seed-catalogue can override — never a silent hard gate.
Reuse the existing `inferCategoryFromCuisineAndName` logic, extend it to emit `snack`, and have it
return a *set* of suitable slots rather than one category.

---

## 7. Proposed Shell Philosophy

| Option | Verdict | Why |
|---|---|---|
| **A. Rigid Breakfast/Lunch/Dinner/Snack** | ❌ Reject | Matches today's broken reality; cannot express brunch/brinner/leftovers/soup-either-way; over-supplies dinner, starves snack. |
| **B. Primary Slot + Suitable Slots** | ✅ Core | Directly fixes the data-layer ceiling; minimal planner change (one enforcement point); preserves a default occasion. |
| **C. Meal Style (Quick/Comfort/Lunchbox/Brunch/One-Pot/Bowl…)** | ⚠️ Partial | Excellent for discovery & UX framing and very on-brand, but **styles don't tell the planner which of a 4-slot day to fill.** Standalone, it breaks slot-filling. |
| **D. Hybrid** | ✅ **Recommended** | B for the planner's eligibility logic + C as non-gating `styleTags[]` for discovery + advisory `energyBand` (§5). Best of all three with the planner risk contained to the B part. |

**Hybrid, concretely:**
- `primarySlot` (one of Breakfast/Lunch/Dinner/Snack) — default placement, display, sort.
- `suitableSlots[]` — planner eligibility (supersedes `SLOT_CATEGORY_MAPPING` when present).
- `energyBand` (Light/Medium/Hearty) — advisory ranking / day-shape balancing only.
- `styleTags[]` (Brunch, One-Pot, Lunchbox, Comfort, Bowl, Wrap Bar, …) — discovery & UX, never gating.
- Keep `category` for back-compat and as the fallback when `suitableSlots` is unpopulated.

---

## 8. Starter Shell Catalogue (DESIGN ONLY — do not implement)

Notes:
- Shells are **occasion-capable**, so many appear in more than one list below (that *is* the
  flexibility). The four lists are "capable of filling this slot", not four disjoint sets.
- "Adaptable diets" = which household diets the shell can be adapted to via component swaps.
- "Enhancement" = nutritional-enhancement opportunity (the THA "+ Nutritional Enhancement" layer).

### 8a. Top 25 Breakfast-capable shells

| # | Shell | Primary | Suitable | Adaptable diets | Enhancement opportunity |
|---|---|---|---|---|---|
| 1 | Cooked Breakfast | Breakfast | B, L, D | Veg, GF, DF, Med, Low-Carb, Keto | Add greens/mushrooms; swap to lean/plant protein |
| 2 | Omelette / Frittata | Breakfast | B, L, D | Veg, GF, DF, Keto, Med | Veg-load the egg base; seed/herb topping |
| 3 | Shakshuka | Breakfast | B, L, D | Veg, GF, DF, Med | Extra peppers/spinach; chickpeas for fibre |
| 4 | Overnight Oats | Breakfast | B, Snack | Veg, Vegan, DF, GF(oats) | Chia/flax; berries; nut/seed butter |
| 5 | Porridge / Oatmeal | Breakfast | B, Snack | Veg, Vegan, DF, GF(oats) | Fruit, seeds, protein scoop |
| 6 | Greek Yoghurt Bowl | Breakfast | B, Snack | Veg, GF, (DF via coconut yog) | Berries, nuts, seeds for fibre/omega |
| 7 | Smoothie | Breakfast | B, Snack | Veg, Vegan, DF, GF | Greens, protein, seeds |
| 8 | Smoothie Bowl / Açaí | Breakfast | B, Snack | Veg, Vegan, DF | Granola, nuts, fruit toppings |
| 9 | Granola & Milk/Yoghurt | Breakfast | B, Snack | Veg, Vegan(plant milk), DF | Low-sugar granola; add seeds |
| 10 | Pancakes / Protein Pancakes | Breakfast | B, Snack | Veg, GF, DF | Oat/banana base; fruit instead of syrup |
| 11 | Avocado Toast | Breakfast | B, L | Veg, Vegan, DF, GF(bread) | Egg/seeds on top; wholegrain base |
| 12 | Breakfast Burrito / Wrap | Breakfast | B, L | Veg, DF, GF(wrap) | Beans for fibre; veg fill |
| 13 | Egg Muffins / Baked Eggs | Breakfast | B, L, Snack | Veg, GF, DF, Keto | Veg-packed; portable protein |
| 14 | Chia Pudding | Breakfast | B, Snack | Veg, Vegan, DF, GF | Omega-3 base; fruit/nut topping |
| 15 | Breakfast Hash (sweet potato) | Breakfast | B, L, D | Veg, Vegan, DF, GF | Add greens; plant/lean protein |
| 16 | Bagel / Toast & Toppings | Breakfast | B, L | Veg, DF, GF(bread) | Wholegrain; nut butter/egg/smoked fish |
| 17 | Breakfast Quesadilla | Breakfast | B, L | Veg, GF(tortilla) | Beans + veg; lower-fat cheese |
| 18 | Waffles | Breakfast | B, Snack | Veg, GF | Oat base; fruit topping |
| 19 | English Muffin Sandwich | Breakfast | B, L | Veg, DF, GF(muffin) | Egg + greens; wholegrain |
| 20 | Fruit & Nut Plate | Breakfast | B, Snack | Veg, Vegan, DF, GF | Naturally whole-food; add yoghurt |
| 21 | Congee / Savoury Porridge | Breakfast | B, L, D | Veg, Vegan, DF, GF | Egg/greens topping; bone broth base |
| 22 | Breakfast Bowl (grain+egg) | Breakfast | B, L, D | Veg, DF, GF | Whole grains + veg + protein |
| 23 | Kedgeree | Breakfast | B, L, D | DF, GF | Brown rice; extra veg; omega-3 fish |
| 24 | Cottage Cheese Bowl | Breakfast | B, Snack | Veg, GF | Fruit/seed topping; high protein |
| 25 | Toast & Beans | Breakfast | B, L | Veg, Vegan, DF, GF(bread) | Wholegrain; reduced-sugar beans |

### 8b. Top 25 Lunch-capable shells

| # | Shell | Primary | Suitable | Adaptable diets | Enhancement opportunity |
|---|---|---|---|---|---|
| 1 | Soup & Side | Lunch | L, D | Veg, Vegan, DF, GF | Pulses for protein/fibre; veg-load |
| 2 | Grain Bowl | Lunch | L, D | Veg, Vegan, DF, GF | Whole grains, beans, seeds |
| 3 | Salad Bowl | Lunch | L, D | Veg, Vegan, DF, GF, Keto | Protein + nuts/seeds; varied veg |
| 4 | Sandwich / Sub | Lunch | L, Snack | Veg, Vegan, DF, GF(bread) | Wholegrain; salad fill; lean protein |
| 5 | Wrap / Burrito | Lunch | L, D | Veg, Vegan, DF, GF(wrap) | Beans + veg; wholegrain wrap |
| 6 | Jacket / Loaded Potato Bar | Lunch | L, D | Veg, Vegan, DF, GF | Beans/tuna; skin-on; veg toppings |
| 7 | Buddha Bowl | Lunch | L, D | Veg, Vegan, DF, GF | Rainbow veg; tahini; seeds |
| 8 | Pasta Salad | Lunch | L, D | Veg, Vegan, DF, GF(pasta) | Wholegrain pasta; veg + beans |
| 9 | Poke Bowl | Lunch | L, D | DF, GF, Pescatarian | Omega-3 fish; edamame; brown rice |
| 10 | Quesadilla | Lunch | L, D | Veg, GF(tortilla) | Beans + veg; lower-fat cheese |
| 11 | Frittata (slice) | Lunch | B, L, D | Veg, GF, DF, Keto | Veg-loaded eggs |
| 12 | Rice Bowl (leftovers base) | Lunch | L, D | Veg, Vegan, DF, GF | Repurpose leftovers; add fresh veg |
| 13 | Mezze / Snack Plate | Lunch | L, Snack | Veg, Vegan, DF, GF | Hummus, olives, veg sticks, seeds |
| 14 | Sushi / Onigiri | Lunch | L, Snack | Veg, DF, GF, Pescatarian | Brown rice; veg/fish fill |
| 15 | Noodle Bowl | Lunch | L, D | Veg, Vegan, DF, GF(noodle) | Veg-heavy; lean/plant protein |
| 16 | Falafel Bowl/Wrap | Lunch | L, D | Veg, Vegan, DF, GF(wrap) | Chickpea protein; salad + tahini |
| 17 | Flatbread / Pita Pizza | Lunch | L, D, Snack | Veg, Vegan, DF, GF(base) | Veg topping; wholegrain base |
| 18 | Stuffed Pepper / Veg | Lunch | L, D | Veg, Vegan, DF, GF | Grain + bean stuffing; veg |
| 19 | Bento Box / Lunchbox | Lunch | L, Snack | Veg, DF, GF | Balanced compartments; fruit + protein |
| 20 | Toastie / Panini | Lunch | L, Snack | Veg, DF, GF(bread) | Wholegrain; veg + lean filling |
| 21 | Couscous / Tabbouleh | Lunch | L, D | Veg, Vegan, DF, GF(grain) | Herbs, veg, pulses |
| 22 | Ramen / Pho | Lunch | L, D | DF, GF(noodle), Pescatarian | Bone/veg broth; greens; egg |
| 23 | Antipasto / Ploughman's | Lunch | L, Snack | Veg, DF, GF | Add veg/fruit; portion cheese |
| 24 | Leftovers Plate | Lunch | L, D | inherits source | Add fresh side salad/veg |
| 25 | Soba / Cold Noodle Salad | Lunch | L, D | Veg, Vegan, DF | Edamame; sesame; veg |

### 8c. Top 25 Dinner-capable shells

| # | Shell | Primary | Suitable | Adaptable diets | Enhancement opportunity |
|---|---|---|---|---|---|
| 1 | Curry Night | Dinner | L, D | Veg, Vegan, DF, GF | Lentils/chickpeas; veg-load; brown rice |
| 2 | Stir-Fry | Dinner | L, D | Veg, Vegan, DF, GF | Max veg; lean/plant protein; brown rice |
| 3 | Roast Dinner | Dinner | D | Veg, DF, GF | Extra veg; lean protein; less fat in roasties |
| 4 | Pasta Bake | Dinner | L, D | Veg, DF, GF(pasta) | Hidden veg sauce; wholegrain pasta |
| 5 | Tacos / Fajitas | Dinner | L, D | Veg, Vegan, DF, GF(shell) | Beans; veg; lean/plant protein |
| 6 | Stew / Casserole | Dinner | L, D | Veg, Vegan, DF, GF | Pulses; root veg; lean cuts |
| 7 | Chilli | Dinner | L, D | Veg, Vegan, DF, GF | Beans for fibre; veg-load |
| 8 | Sheet-Pan Traybake | Dinner | L, D | Veg, Vegan, DF, GF | Veg-forward; lean protein; minimal oil |
| 9 | Risotto | Dinner | L, D | Veg, GF, DF(no cheese) | Veg/mushroom; stock not cream |
| 10 | Pizza Night | Dinner | L, D | Veg, Vegan, DF, GF(base) | Veg topping; wholegrain/cauli base |
| 11 | Burger & Sides | Dinner | L, D | Veg, Vegan, DF, GF(bun) | Bean/lean patty; salad side; wholegrain bun |
| 12 | Fish & Veg | Dinner | L, D | DF, GF, Pescatarian, Med | Omega-3 fish; steamed veg |
| 13 | One-Pot Rice (paella/biryani) | Dinner | L, D | Veg, Vegan, DF, GF | Veg + pulses; brown rice |
| 14 | Lasagne / Bake | Dinner | D | Veg, DF, GF | Veg layers; lean/plant ragu |
| 15 | Noodle Stir-Fry (chow mein) | Dinner | L, D | Veg, Vegan, DF, GF(noodle) | Veg-heavy; lean protein |
| 16 | Shepherd's / Cottage Pie | Dinner | D | Veg, Vegan, DF, GF | Lentil base; veg-mash topping |
| 17 | Fajita / Burrito Bowl | Dinner | L, D | Veg, Vegan, DF, GF | Beans; brown rice; veg |
| 18 | Kebabs / Skewers & Salad | Dinner | L, D | Veg, Vegan, DF, GF | Lean/plant protein; veg + salad |
| 19 | Dhal & Rice | Dinner | L, D | Veg, Vegan, DF, GF | High pulse protein/fibre; greens |
| 20 | Gnocchi / Bake | Dinner | L, D | Veg, DF, GF | Veg sauce; portion control |
| 21 | Schnitzel / Cutlet & Sides | Dinner | L, D | Veg(plant cutlet), DF, GF(crumb) | Bake not fry; salad side |
| 22 | Meatballs & Sauce | Dinner | L, D | Veg, DF, GF | Lean/plant balls; veg-rich sauce; wholegrain |
| 23 | Hot Pot / Soup-Meal | Dinner | L, D | Veg, Vegan, DF, GF | Broth base; veg + protein + noodles |
| 24 | Enchiladas | Dinner | D | Veg, DF, GF(tortilla) | Beans; veg; lower-fat cheese |
| 25 | Grain & Roast Veg Tray | Dinner | L, D | Veg, Vegan, DF, GF | Whole grains; mixed roast veg; seeds |

### 8d. Top 15 Snack-capable shells

| # | Shell | Primary | Suitable | Adaptable diets | Enhancement opportunity |
|---|---|---|---|---|---|
| 1 | Fruit & Nut Plate | Snack | Snack, B | Veg, Vegan, DF, GF | Whole-food; add yoghurt for protein |
| 2 | Veg Sticks & Dip (hummus) | Snack | Snack, L | Veg, Vegan, DF, GF | Pulse dip; rainbow veg |
| 3 | Yoghurt & Berries | Snack | Snack, B | Veg, GF, DF(plant) | High protein; seeds/nuts |
| 4 | Smoothie | Snack | Snack, B | Veg, Vegan, DF, GF | Greens + protein + seeds |
| 5 | Energy Balls / Flapjack | Snack | Snack | Veg, Vegan, DF, GF(oats) | Oats, seeds, dates; low added sugar |
| 6 | Rice Cakes / Crackers & Topping | Snack | Snack, L | Veg, Vegan, DF, GF | Nut butter/avocado/cheese; wholegrain |
| 7 | Trail Mix | Snack | Snack | Veg, Vegan, DF, GF | Nuts, seeds, dried fruit; unsalted |
| 8 | Cheese & Crackers | Snack | Snack, L | Veg, GF(crackers) | Add fruit/veg; portion cheese |
| 9 | Boiled Eggs / Egg Snack | Snack | Snack, B | Veg, GF, DF, Keto | High protein; pair with veg |
| 10 | Popcorn | Snack | Snack | Veg, Vegan, DF, GF | Air-popped; light seasoning |
| 11 | Toast & Nut Butter | Snack | Snack, B | Veg, Vegan, DF, GF(bread) | Wholegrain; banana/seeds |
| 12 | Protein Bar / Bite | Snack | Snack | Veg, Vegan(varies), GF | Whole-food base; low sugar |
| 13 | Mini Mezze (olives/hummus) | Snack | Snack, L | Veg, Vegan, DF, GF | Veg + pulses; healthy fats |
| 14 | Fruit Smoothie Pops | Snack | Snack | Veg, Vegan, DF, GF | Whole fruit; yoghurt for protein |
| 15 | Cottage Cheese & Fruit | Snack | Snack, B | Veg, GF | High protein; seeds |

> Overlap is intentional and is the whole point: Smoothie, Fruit & Nut, Yoghurt Bowl, Frittata,
> Soup, Grain Bowl, Salad, Wrap, etc. legitimately span 2–3 slots. A rigid model cannot express
> any of these rows' Suitable column.

---

## Final Verdict

### **STATUS D — Hybrid model.**

**Recommendation:** Adopt **`primarySlot` + `suitableSlots[]`** as the planner-eligibility core
(the Status B mechanism), layered with an **advisory `energyBand`** (Light/Medium/Hearty, derived
from calories, non-gating) and **non-gating `styleTags[]`** for discovery (the Status C ideas).
Retain `category` as the back-compat default and the fallback when `suitableSlots` is unpopulated.

**Reasoning:**

1. **It fits the engine that already exists.** Slot exclusivity lives in exactly one place
   (`SLOT_CATEGORY_MAPPING` + `getCandidateSlotFit`) and is *already a many-to-many map*. Moving
   suitability onto the meal (`suitableSlots[]`) generalises shipping behaviour rather than
   replacing it — low risk, one well-understood enforcement point, with a clean fallback for the
   ~650 legacy rows.

2. **It is the only model that fixes the observed failures.** Today's data over-supplies dinner
   (297 templates / 686 meals / 240 null-default-to-dinner) and starves snack (inference never
   emits `snack`; 24 snack items). Per-meal suitability lets cooked-breakfast/soup/frittata/grain-
   bowl shells legitimately backfill multiple slots, directly relieving the empty-slot symptom the
   prior investigation traced to thin, dinner-skewed supply + a dead Tier-4.

3. **It honours the THA philosophy.** *Shared Meal + Personal Adaptation + Nutritional
   Enhancement* is fundamentally about one base flexing across people **and occasions**.
   `suitableSlots[]` encodes occasion-flex; `compatibleDiets[]` + component slots already encode
   person-flex; `energyBand`/`styleTags` encode the "light dinner / brunch / grazing" rhythm.

4. **Why not the alternatives:**
   - **A (rigid)** is the current broken state — rejected.
   - **B alone** is correct but under-sells the brand: no day-shape balancing, no discovery surface.
   - **C alone** breaks the planner — styles don't tell a 4-slot day which slot to fill.
   - **D** keeps C's strengths as *non-gating* metadata so they can never break slot-filling, while B carries the load.

**Sequencing note (for a future, separately-approved implementation):** the schema gap
(`suitableSlots[]`, advisory `energyBand`, `styleTags[]`) is the prerequisite; the planner change
is a small edit to `getCandidateSlotFit()`/`selectShellRecoveryCandidate()` with a
`SLOT_CATEGORY_MAPPING` fallback; the §8 catalogue is the seed payload. None of that is done here.

---

## Scope Lock — confirmed

- ❌ No implementation
- ❌ No schema changes
- ❌ No shell seeding
- ❌ No planner changes
- ✅ Investigation only
- ✅ Rollback tag created: `rollback/pre-flexible-meal-investigation-2026-06-14` → `21f3274`

> The temporary read-only query scripts used for the live category counts in §2 were created in
> `/tmp` (or copied transiently into `server/scripts/` and deleted) and **left no committed
> artifacts**. Working tree is unchanged except for this document.
