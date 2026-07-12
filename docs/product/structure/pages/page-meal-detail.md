---
entry: page-meal-detail
name: Meal
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /meals/:id
last_verified: 2026-07-11
version: 1
---

# Meal

> The one canonical place a saved recipe lives — its ingredients, method, nutrition, and what to do with it.

## What it is

The full page for a single saved recipe. It shows the ingredients (with servings
that can be scaled up or down to preview quantities), the method, and the meal's
nutrition. From here a household can edit the recipe, add its ingredients to the
basket, and adapt it toward a goal — make it vegetarian or keto, lower the cost,
make it less processed, keep it under thirty minutes, or fit it to the household —
with THA proposing the ingredient swaps. For recipes built from several
components it can lay out a cooking timeline back from a chosen serve time. It also
surfaces trust, household-history and "simply better choice" context about the
food itself.

## Where it lives

| | |
|---|---|
| Route | `/meals/:id` |
| Source | `client/src/pages/meal-detail-page.tsx` |

## Related

- [[dom-cookbook]] — the domain this page belongs to
- [[page-cookbook]] — the shelf this recipe sits on
- [[jrn-cook-from-plan]] — cooking a recipe from the plan

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
