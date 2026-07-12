---
entry: jrn-plan-week
name: Plan the week
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Plan the week

> A household decides what everyone is eating this week and who is eating each meal.

## What it is

The core planning loop: filling a grid of days and meal slots for the week, and
deciding — per row — who each meal is for. It happens entirely on the Planner
page and feeds directly into shopping.

## The path

1. **Open the Planner.** The page loads the full six-week planner
   (`/api/planner/full`) and shows the active week as a grid of days against meal
   slots (Breakfast, Lunch, Dinner, Snacks).
2. **Turn on the rows you need.** Planner settings add optional rows — Drinks,
   Kids Breakfast/Lunch/Dinner, Baby Breakfast/Lunch/Dinner — so a meal can be
   assigned to a specific audience (adult, child, or baby).
3. **Add meals to slots.** Each empty cell offers an add action that draws from
   the Cookbook, a search, a photo scan, or the "Plan" assistant's suggestions.
4. **Rearrange.** Meals can be moved to another day, duplicated into the same
   day-of-week next week, or reordered within a slot.
5. **Hand off to shopping.** "Send week to basket" (and the per-day / per-slot
   variants) pushes the week's meals into the basket, which begins [[jrn-shop]].

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/weekly-planner-page.tsx` |

## Related

- [[page-planner]] — the surface this journey lives on
- [[dom-planner]] — the domain it belongs to
- [[jrn-shop]] — where a planned week becomes a basket

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
