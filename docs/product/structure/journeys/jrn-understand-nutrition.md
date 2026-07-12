---
entry: jrn-understand-nutrition
name: Understand our nutrition
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Understand our nutrition

> A household sees how varied their eating has been, and follows a food into everything THA knows about it.

## What it is

The reflective loop: look at how varied the week's eating has been, then follow any
single food into a page that gathers everything THA safely knows about it.

## The path

1. **Open the Nutrition page** (`/plant-diversity`). It has four tabs — Foods,
   Nutrients, Benefits, Suggestions.
   - **Foods** shows the household's plant-diversity report for the week.
   - **Nutrients** shows the Household Nutrition Centre — intake over time and
     gaps.
   - **Benefits** and **Suggestions** are present but read "Coming soon"; they
     point back to the Foods and Nutrients tabs instead.
2. **Follow a food.** From the Nutrients tab (the Household Nutrition Centre), a
   food links to `/foods/:slug`.
3. **Read the food's page.** `FoodDetailPage` assembles what is validated —
   why it matters, key nutrients, seasonality, meals that use it, the household's
   own history with it, connected foods, and a "Simply Better" suggestion.
4. **Keep exploring.** Connected and discovery foods link on to further
   `/foods/:slug` pages.

## Where it breaks

The food page's "Back" link is **hardcoded to `/cookbook`**
(`food-detail-page.tsx`, around L103) regardless of where the household arrived
from. A household that followed a food out of the Nutrition page and then presses
"Back" is dropped in the Cookbook, not returned to the Nutrition view it left.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/plant-diversity-page.tsx` |
| Source | `client/src/pages/food-detail-page.tsx` |

## Related

- [[page-nutrition]] — the varied-eating view this journey starts on
- [[page-food-detail]] — the per-food intelligence page it leads to

## Known defects

- `fnd-food-detail-back` — the food page's "Back" link always goes to `/cookbook`,
  not to wherever the household came from. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
