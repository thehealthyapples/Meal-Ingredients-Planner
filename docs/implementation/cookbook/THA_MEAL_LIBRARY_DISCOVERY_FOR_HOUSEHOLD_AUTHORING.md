# THA Meal Library — Discovery for Development World Household Authoring

**Purpose:** A point-in-time snapshot of the canonical THA meal library in the Development World, for use when authoring realistic development households — plus guidance on referencing existing meals without duplicating recipes.
**Captured:** 2026-07-10 (read-only discovery; no data modified).
**Scope of "library":** the global/system meal corpus (`is_system_meal = true`, `user_id = 0`). Personal user meals are excluded.

---

## Headline

- **Total meals in dev DB:** 2,737
  - **Canonical global/system library: 884** ← what households draw from
  - Personal user meals (not shared): 1,853

Everything below describes the **884-meal system library**.

## Categories (system library)

| Category | Count | | Category | Count |
|---|---|---|---|---|
| Dinner | 415 | | Snack | 44 |
| Lunch | 171 | | Baby Meal | 20 |
| Breakfast | 99 | | Kids Meal | 20 |
| Drink | 49 | | Dessert | 20 |
| Frozen Meal | 46 | | | |

## Meal types (`meal_format`)

- **recipe** (from-scratch, cookable): 500
- **ready-meal** (product identities): 335
- **drink**: 49
- `kind` is uniformly `meal` (no separate side/component kinds).

## Ready vs scratch

- **Scratch / cookable** (`is_ready_meal = false`): 549
- **Ready meals** (`is_ready_meal = true`): 335

## Imported vs THA-authored

| Provenance | Count | Notes |
|---|---|---|
| `tha_library / authored` (`meal_source_type='starter'`) | **500** | THA Original Founding Cookbook, recipe_ids THA-001…THA-500 |
| `tha_library / product` — `ready_meal` | 309 | UK ready-meal identities (e.g. Beef Lasagne, Chicken Tikka Masala) |
| `tha_library / product` — `openfoodfacts` | 75 | Barcode product records |

No `personal_cookbook`, `licensed_discovery`, or scraped content exists in the system library.

## Diet coverage ⚠️

Sparse and important:

- Tagged via `diet_types`: **vegetarian 129**, **vegan 75**. **713 have no diet tag.**
- **All 500 authored recipes have empty `diet_types`, `style_tags`, `suitable_slots`, `primary_slot`, `energy_band`** — deliberately left blank for the Planner/Decision Engine to infer.
- **Consequence:** diet/allergen/plant suitability must be derived from the **`ingredients` array**, not read from a tag.

## Audience

adult 844 · child 20 · baby 20 (dedicated Kids/Baby lines).

## Cuisines

25 distinct — **stored only in the source JSON** (`cuisine_inspiration`), not in any DB column.

| Cuisine | # | Cuisine | # | Cuisine | # |
|---|---|---|---|---|---|
| Indian | 54 | Moroccan | 22 | Californian | 15 |
| Australian-cafe | 53 | Thai | 22 | French country | 14 |
| Spanish | 53 | Peruvian | 22 | Chinese | 9 |
| Indonesian | 52 | Pakistani | 15 | West African | 9 |
| Ethiopian | 52 | Malaysian | 15 | Georgian | 9 |
| British family kitchen | 24 | North African | 15 | Greek | 9 |
| Mediterranean | 23 | | | Persian | 8 |

Plus a small tail: Italian, Mexican, British-Mediterranean, Nordic-Mediterranean, Middle Eastern (1 each).

## Common family meals already available

- **Authored whole-food staples:** Basil Tomato Wholewheat Pasta · Golden Potato, Chickpea & Spinach Curry · Gentle Taco Rice Bowls · Roast Vegetable & Butter Bean Traybake · Chicken, Leek & Wholewheat Orzo One-Pot · Lentil & Root Vegetable Cottage Pie · Salmon, Broccoli & Brown Rice Traybake · Apple, Oat & Cinnamon Morning Bowl — plus 490 globally-inspired bowls / skillets / stews / traybakes.
- **Recognisable ready-meals:** Beef Lasagne · Chicken Tikka Masala · Chicken Korma · Spaghetti Bolognese · Shepherd's Pie · Cottage Pie · Fish Pie · Macaroni Cheese · Sweet & Sour Chicken · Chow Mein · Fried Rice.
- **Baby/kids:** Ella's Kitchen pouches · Cow & Gate · Heinz · Baby Porridge / Purees · Baby Pasta Stars.

## Metadata useful when assigning meals to households

| Field | Use |
|---|---|
| `recipe_id` / `import_key` (`tha_original:THA-###`, in `acquisition_source_key`) | Stable identity for the 500 authored recipes |
| `id` + exact `name` | Stable identity for the 384 product meals |
| `category` / `meal_format` | Cooking effort & slot (recipe vs ready-meal vs drink) |
| `audience` (adult/child/baby) | Match household composition |
| `ingredients[]` | Primary driver for diet, allergen, plant-diversity and preference matching |
| `servings` | Scale to household size |
| `acquisition_lane` / `acquisition_type` | Authored vs product realism (households mix both) |
| `cuisine_inspiration` (JSON only) | Variety / preference realism |

---

## Recommendation — referencing existing meals without duplicating recipes

**Treat the library as a fixed catalogue and reference it by stable ID — never re-author recipe bodies into households.**

1. **Give ChatGPT the canonical index, not free rein.** Provide `data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json` (500 authored, each with `recipe_id`, `import_key`, name, category, cuisine, ingredients) plus an export of the 384 product meals (`id`, `name`, `category`, `meal_format`). That is the entire assignable universe.

2. **Households reference, they don't contain.** Record meal assignments as **`import_key` / `recipe_id`** (authored) or **meal `id` + exact `name`** (products) — e.g. a "recent meals" / "favourites" list of IDs — and leave name/ingredients/method owned solely by the Cookbook. This mirrors the platform's own boundary: the Cookbook owns content; the Planner/Household layer only points at it.

3. **De-dup by identity before writing any new recipe.** Names and `import_key`s are already unique. ChatGPT should (a) search the catalogue by name and by key ingredients first, and (b) only propose a *new* recipe when nothing in the 884 covers the need — and even then emit it as a new Cookbook record (fresh `recipe_id`), not inline household data. With 884 meals across 25 cuisines and every category, new recipes should almost never be needed.

4. **Match on ingredients + category + audience, not diet tags.** Because `diet_types` are mostly empty, infer vegetarian/vegan/allergen fit from the `ingredients` array (using explicit vegetarian/vegan tags where present), so a "vegetarian household" gets plausible existing meals rather than an invented one.

5. **Use cuisine + category spread for realistic variety.** Give each household a believable mix (weeknight scratch dinners + a few ready-meals + breakfasts + kids/baby items where composition calls for it), drawn across cuisines so no two households look identical — all by ID reference.

**In short:** assign existing meals by `recipe_id` / `import_key` (or product `id` + name), infer suitability from ingredients, and only ever add a recipe as a new catalogue entry after confirming no existing meal fits — keeping household authoring to references + household context, never copied recipe content.
