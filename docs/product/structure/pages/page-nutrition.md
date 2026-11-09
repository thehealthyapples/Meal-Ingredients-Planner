---
entry: page-nutrition
name: Food
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /food
last_verified: 2026-10-30
version: 4
---

# Food

> A household view of foods and linked nutrients in a selected Planner week, with food lookup and comparison.

## What it is

The Food screen opens on the current household week when that week can be
resolved; otherwise it uses the Planner's selected week without claiming it is
the present. Any available Planner week can be selected. Its left pane switches
between foods from that week's meals and nutrients linked to those foods. Search
matches names and known attributes in the week, with a Food Knowledge lookup for
foods beyond the meal list. Selecting a meal food shows its details in the right
pane. A food absent from the selected week's meals is labelled accordingly.
Linked nutrients are not amounts consumed. Comparison and Analyser remain
available from this room. The room reports facts; interpretation belongs to the
Companion.

## Where it lives

| | |
|---|---|
| Route | `/food` (`/nutrition` and `/plant-diversity` redirect here) |
| Source | `client/src/pages/plant-diversity-page.tsx`, `client/src/components/WeekFoodExplorer.tsx` |

## Related

- [[dom-nutrition]] — the domain this page belongs to
- [[gls-plant-diversity]] — the plant-diversity idea it centres on
- [[jrn-understand-nutrition]] — the journey of understanding nutrition

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
