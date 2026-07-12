---
entry: page-food-detail
name: Food
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /foods/:slug
last_verified: 2026-07-11
version: 1
---

# Food

> Everything THA can honestly say about one food — its benefits, its nutrients, its season, and where the household has met it before.

## What it is

A calm page about a single food. It gathers what The Healthy Apples can safely say:
why it matters and its health benefits, its key nutrients, whether it is in season,
the meals in the household's cookbook that use it, how often it has featured in the
household's plans, related foods to explore next, and a gentle "simply better
choice" suggestion. Every section is optional — anything THA cannot confidently
say simply does not appear, and an unknown food shows a plain "we don't know this
food yet" message rather than guessing.

## Where it lives

| | |
|---|---|
| Route | `/foods/:slug` |
| Source | `client/src/pages/food-detail-page.tsx` |

## Related

- [[dom-nutrition]] — the domain this page belongs to

## Known defects

- `fnd-food-detail-back` — the "Back" link is hardcoded to go to the Cookbook,
  whatever screen the household actually arrived from (a meal, the nutrition
  screen, another food). It does not return them where they were. See PDA1.
- `fnd-food-detail-chrome` — unlike the other household screens, this page renders
  no workspace header or realm chrome. It is a bare page with a lone back link, so
  it sits outside the shared navigation the rest of the product carries. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
