---
entry: page-nutrition
name: Nutrition
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /plant-diversity
last_verified: 2026-07-11
version: 1
---

# Nutrition

> How many different plants the household has eaten, what that means, and which foods to try next.

## What it is

The household's nutrition screen, headed "Nutrition". Its Foods tab shows plant
diversity — how many different plants have been eaten and which plant families
they fall into — so a household can spot gaps and find ingredients to try next. A
Nutrients tab tracks the household's macro and micronutrient intake over time.
Two further tabs, Benefits and Suggestions, describe what is coming and, for now,
point back to the Foods tab and the cookbook.

## Where it lives

| | |
|---|---|
| Route | `/plant-diversity` |
| Source | `client/src/pages/plant-diversity-page.tsx` |

## Related

- [[dom-nutrition]] — the domain this page belongs to
- [[gls-plant-diversity]] — the plant-diversity idea it centres on
- [[jrn-understand-nutrition]] — the journey of understanding nutrition

## Known defects

- `fnd-route-name-drift` — the page is titled "Nutrition" and the navigation calls
  it Nutrition, but its address is still `/plant-diversity` from when the screen was
  narrower. The route name has drifted from what the page now is. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
