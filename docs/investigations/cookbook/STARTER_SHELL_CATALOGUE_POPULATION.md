# Starter Shell Catalogue Population

**Date:** 2026-06-14
**Scope:** Populate the THA starter meal-shell catalogue using the Hybrid Meal Occasion
model. Catalogue/metadata only — **no** planner ranking, scoring, filtering, restriction
or Tier-4 changes.

---

## 1. Rollback Protection

The working tree was **not clean** at start — it carried the uncommitted Hybrid Meal
Occasion foundation. A tag at `HEAD` alone would not have protected that work, so
(matching the repo's existing `checkpoint:` convention) the foundation was committed as a
clean rollback point and tagged.

| Item | Value |
|------|-------|
| Rollback commit | `efcab8957e6287c970df83132720cfdd44c98fdd` |
| Rollback tag | `pre-starter-shell-catalogue` |
| Rollback command | `git reset --hard pre-starter-shell-catalogue` |
| Prior HEAD | `39de349` (feat(planner): hard-enforce household Vegetarian/Vegan …) |

> Note: a pre-existing stash (`stash@{0}: pre-nutrition-boost-fork-cache-fix working state`)
> was left untouched throughout.

---

## 2. Shells Created

**49 new shells inserted** (idempotent, case-insensitive name guard). Requested
catalogue was 55 names; **6 names already existed** as pre-existing auto-created
templates and were **skipped, never modified** (see §8).

| Category | Requested | Newly inserted | Pre-existing (skipped) |
|----------|----------:|---------------:|-----------------------:|
| Breakfast | 15 | 12 | 3 |
| Lunch | 15 | 14 | 1 |
| Dinner | 25 | 23 | 2 |
| **Total** | **55** | **49** | **6** |

New shells occupy `meal_templates` ids **651–699**. Total `meal_templates` rows:
650 → **699** (+49).

### Newly inserted

- **Breakfast (12):** Continental Breakfast, Smoothie Bowl, Yogurt Bowl, Porridge Bar,
  Breakfast Bowl, Toast Bar, Fruit & Nut Plate, Protein Pancakes, Chia Pot, Breakfast
  Bake, Bagel Bar, Egg Muffins
- **Lunch (14):** Soup & Side, Grain Bowl, Buddha Bowl, Loaded Salad, Wrap Bar, Sandwich
  Bar, Jacket Potato Bar, Mezze Plate, Leftovers Plate, Noodle Bowl, Quesadilla, Toastie,
  Bento Box, Picnic Plate
- **Dinner (23):** Curry Night, Taco Night, Pasta Night, Pizza Night, Stir Fry, Burger
  Night, Roast Dinner, Sheet Pan Dinner, Rice Bowl, Risotto, Chilli Night, Casserole,
  Noodle Night, Fajita Night, BBQ Night, Lasagne Night, Fish & Sides, Tray Bake, Stew,
  Paella, Kebab Night, Dumpling Night, Mediterranean Platter

---

## 3. Slots, Style Tags, Diet Compatibility, Nutrition Opportunities

Every newly inserted shell defines all required fields:

- `primarySlot` (canonical meal slot)
- `suitableSlots[]` (canonical meal slots; always includes `primarySlot`)
- `energyBand` (`light` / `medium` / `hearty`)
- `styleTags[]` (canonical slugs only — validated against `@shared/style-tags`)
- Shared component slots: `sharedBaseComponents`, `proteinSlots`, `carbSlots`,
  `vegSlots`, `toppingSlots`, `sauceSlots` — **framework-level roles/options, not fixed
  recipes**
- `compatibleDiets[]` (the diets the shell can be **adapted** to)
- `nutritionOpportunities[]` (editorial enhancement metadata)

**Style tag slugs used** (display labels already exist in `STYLE_TAG_DISPLAY_MAP`):
`shared-meal` → Family Table · `adaptable` → Adaptable · `family-pleaser` → Family
Pleaser · `comfort` → Comfort · `quick` → Quick & Easy · `fresh` → Fresh · `indulgent`
→ Indulgent · `buffet` → Buffet · `bar` → Bar · `one-pot` → One Pot.

A pre-write vocabulary guard rejects any non-canonical slug / slot / band, any shell
whose `primarySlot` is absent from `suitableSlots`, and any empty `styleTags` /
`compatibleDiets` / `nutritionOpportunities`.

---

## 4. Design Decisions

1. **`nutrition_opportunities` had no column.** Added an **additive** `text[]` column
   (`NOT NULL DEFAULT '{}'`) to `meal_templates` only, mirroring the existing Hybrid Meal
   Occasion additive pattern. Display/metadata only — never read by planner scoring,
   filtering or slot eligibility. No backfill; existing rows keep the empty default, so
   the meaning of existing data is unchanged. This is the in-scope "nutrition opportunity
   metadata" deliverable.
2. **Components are frameworks, not recipes.** Following the task's Curry Night example
   and the "frameworks not recipes" principle, component slots hold generic roles /
   options (e.g. `protein`, `rice or flatbread`, `vegetables`, `curry sauce`, `garnish`)
   rather than fixed ingredients, fixed calories, fixed cuisines or fixed restrictions.
   The `cuisine` column was intentionally left null on all shells.
3. **Existing templates are never touched.** The seed remains idempotent — name
   collisions are skipped, not overwritten (see §8).

---

## 5. Example Shell Records

**Curry Night** (matches the task's design example exactly):

```json
{
  "name": "Curry Night", "category": "dinner",
  "primary_slot": "dinner", "suitable_slots": ["lunch", "dinner"],
  "energy_band": "hearty",
  "style_tags": ["shared-meal", "adaptable", "comfort", "one-pot"],
  "shared_base_components": ["aromatics", "spice base", "sauce"],
  "protein_slots": ["protein"], "carb_slots": ["rice or flatbread"],
  "veg_slots": ["vegetables"], "topping_slots": ["garnish"],
  "sauce_slots": ["curry sauce"],
  "compatible_diets": ["Vegetarian", "Vegan", "Keto", "Gluten-Free", "Dairy-Free"],
  "nutrition_opportunities": ["extra greens", "lentils", "beans", "fresh herbs", "mixed seeds"]
}
```

**Smoothie Bowl** (light breakfast, also suitable as a snack):

```json
{
  "name": "Smoothie Bowl", "category": "breakfast",
  "primary_slot": "breakfast", "suitable_slots": ["breakfast", "snack"],
  "energy_band": "light", "style_tags": ["fresh", "quick"],
  "shared_base_components": ["blended fruit base"],
  "protein_slots": ["yogurt", "protein powder", "silken tofu"],
  "carb_slots": ["oats or granola"], "veg_slots": ["leafy greens"],
  "topping_slots": ["berries", "seeds", "nut butter"], "sauce_slots": [],
  "compatible_diets": ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
  "nutrition_opportunities": ["berries", "seeds", "nut butter", "greens", "granola"]
}
```

---

## 6. Files Changed

| File | Change |
|------|--------|
| `shared/schema.ts` | Additive `nutritionOpportunities text[]` on `mealTemplates` + included in `insertMealTemplateSchema`. |
| `server/migrations/runner.ts` | New migration `2026-06-14_add_shell_nutrition_opportunities` — `ADD COLUMN IF NOT EXISTS nutrition_opportunities TEXT[] NOT NULL DEFAULT '{}'`. |
| `server/seeds/seed-meal-shell-templates.ts` | Extended from 1 shell to the full 55-entry catalogue; added Hybrid fields + nutrition opportunities to the insert; added pre-write vocabulary guard and full post-insert validation. |

No planner, scoring, filtering, restriction or Tier-4 files were modified.

---

## 7. Tests Executed

| Test | Result |
|------|--------|
| Migration apply (`2026-06-14_add_shell_nutrition_opportunities`) | ✅ 1 applied, schema at head |
| Seed dry run (`DRY_RUN=true`) | ✅ vocab OK, 55 shells, 49 would insert / 6 skip |
| Seed live run | ✅ 49 inserted, 6 skipped |
| Seed post-insert validation | ✅ **57 pass / 0 fail** (Hybrid fields present on all 49; 6 collisions confirmed untouched; Cooked Breakfast unchanged; no duplicate catalogue names) |
| Seed idempotent re-run | ✅ 0 inserted, 55 skipped, 0 fail |
| `npm run test:hybrid-meal-occasion` | ✅ **159 pass / 0 fail** |
| `npm run test:planner-compliance` | ✅ **25 pass / 0 fail** (planner behaviour unchanged) |
| `npm run typecheck` | ✅ no errors in changed files (23 pre-existing errors in unrelated test files exist identically at the rollback point) |

---

## 8. Name Collisions — Follow-up Decision Needed (out of scope)

Six requested catalogue names already existed as **pre-existing auto-created templates**
(low ids — part of the original 632) and were left **unchanged**, because overwriting
them would (a) breach this task's `Changes meaning of existing data: NO` declaration and
(b) degrade real recipe-derived data into generic frameworks.

| Name | Existing id | Category |
|------|------------:|----------|
| Cooked Breakfast | 633 | breakfast (the previously seeded shell) |
| Overnight Oats | 287 | breakfast |
| Breakfast Wrap | 291 | breakfast |
| Pasta Salad | 166 | lunch |
| Sausage & Mash | 109 | dinner |
| Shepherd's Pie | 78 | dinner |

These rows expose `primarySlot` / `suitableSlots` (from the earlier Hybrid backfill) but
**not** the curated `energyBand` / `styleTags` / `nutritionOpportunities` / framework
component slots. **Recommendation:** decide in a separate, explicitly-scoped task whether
to (a) leave them as-is, (b) author distinctly-named shells, or (c) approve curated
metadata enrichment of these specific rows. No action taken here.

---

## 9. Data Impact & Trust

- **Reads existing data:** yes. **Writes new data:** yes (49 new rows + 1 additive
  column). **Changes meaning of existing data:** no. **Requires backfill:** no.
- Shells are intentionally flexible meal frameworks — no fixed recipes, calories or
  cuisines are implied, so they cannot mislead users or fabricate certainty.

---

## 10. Scope Confirmation

Only approved scope was implemented: starter shell catalogue, shell metadata, occasion
fields, style tags, shared component definitions, diet-adaptation capability, and
nutrition-opportunity metadata. **Not** done: no recipes seeded, Tier-4 recovery not
activated, and no change to planner logic / ranking / scoring / filtering / restrictions.
