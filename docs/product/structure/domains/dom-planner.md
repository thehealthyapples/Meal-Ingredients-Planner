---
entry: dom-planner
name: Planner
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Planner

> Where a household decides what they are eating this week, day by day
> and meal by meal.

## What it is

The Planner is a week grid where a household lays out its meals across the
days, organised into breakfast, lunch, dinner and snacks. Meals can be dragged
between slots and days, copied, and reviewed against the household's eaters for
dietary safety. From here a plan flows onward into shopping. The planner works
in week numbers rather than fixed dates, so a household can build and reuse
weeks without them being pinned to a calendar.

Plan Templates are governing architecture for this domain — a household can
draw on published global templates or its own private ones as a starting point
for a week. The canonical definition of that capability, including its access
scope and honest gaps, lives in its own card.

## Where it lives

| | |
|---|---|
| Route | `/planner` (also `/weekly-planner`) |
| Source | `client/src/pages/weekly-planner-page.tsx` |
| Capability | [Plan Templates](../../../architecture/capabilities/templates.md) |

## Related

- [[page-planner]] — the page that renders this domain
- [[jrn-plan-week]] — planning a week of meals
- [[jrn-shop]] — turning the plan into shopping
- [[cap-planner]] — the planner capability

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
