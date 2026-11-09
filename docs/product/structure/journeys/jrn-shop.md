---
entry: jrn-shop
name: Shop the plan
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-05
version: 2
---

# Shop the plan

> A household turns the week's plan into a basket, matches it to real products, and hands it to a supermarket.

## What it is

The journey from a planned week to a real basket: the meals become a shopping
list, each line is matched to an actual product, prices are checked, and the
basket is handed to a supermarket.

## The path

1. **Send the week to the basket.** On the Planner, "Send week to basket"
   (`addAllToBasket`, with per-day and per-slot variants) turns the planned meals
   into shopping-list lines.
2. **Open the Shopping workspace** (`/shopping-workspace`). The list is grouped by
   aisle, with pantry staples deduplicated against what the household already has
   (`have_enough` / `need_to_buy`; see [[jrn-stock-pantry]]).
3. **Match each line to a real product.** Searching a line calls
   `/api/search-products`; selecting a result attaches a real product, its store
   availability, and its THA rating to the line.
4. **Check prices and hand off.** The workspace shows prices and totals and hands
   the basket to a supermarket.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/weekly-planner-page.tsx` |
| Source | `client/src/pages/shopping-workspace-page.tsx` |

## Related

- [[page-planner]] — where the basket is filled from the plan
- [[page-shopping-workspace]] — the working list where products are matched

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
