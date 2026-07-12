---
entry: wiz-meal-completion
name: Meal completion wizard
section: wizards
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Meal completion wizard

> After a recipe is saved, the choice of what to do with it — plan it, shop for it, or nothing.

## What it is

The small two-step dialog that appears the moment a recipe is saved to the
Cookbook. It confirms the save and offers the three things a household usually
wants next: put it in the planner, shop for it, or simply be done.

## The steps

1. **Choice.** "Saved to Cookbook" confirms the meal (with baby / child / drink
   badges where relevant) and offers three buttons:
   - **Add to Planner** — advances to the planner step.
   - **Add to Basket & Shopping List** — generates a shopping list from the meal
     (`generateFromMeals`) and closes.
   - **Done** — closes without doing anything further.
2. **Planner.** If the household chose to plan, it picks weeks, days, and meal
   slots (drinks collapse to a single slot), sees a live summary of how many slots
   will be filled, and confirms — each assignment is posted to
   `/api/planner/days/:dayId/items`.

The dialog resets its internal state each time it closes.

## Where it lives

| | |
|---|---|
| Source | `client/src/components/meal-completion-dialog.tsx` |

## Related

- [[jrn-add-recipe]] — the journey this wizard completes

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
