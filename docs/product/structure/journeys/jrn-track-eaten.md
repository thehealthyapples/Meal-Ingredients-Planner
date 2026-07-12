---
entry: jrn-track-eaten
name: Track what we ate
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Track what we ate

> A household records the day's food, most easily by copying it straight from the planner.

## What it is

The daily record: what the household actually ate. The Diary lets it type entries,
log a saved meal, or — the easiest route — copy the day's meals straight across
from the Planner.

## The path

1. **Open the Diary** (`/diary`) and pick a date.
2. **Add what was eaten**, by any of three means:
   - **Type an entry** into a slot (`POST /api/food-diary/:date/entries`).
   - **Log a saved meal** from the Cookbook, planner, or ready meals
     (`POST /api/food-diary/:date/log-meal`).
   - **Copy from Planner** — the quickest path — imports the planner's meals for
     that date (`POST /api/food-diary/:date/copy-from-planner`), all slots or one.
3. The day's entries build up the household's record and its variety and nutrient
   summaries.

## Where it breaks

The "easiest" route is a manual pull, not an automatic flow. Marking a meal cooked
on the Planner does **not** populate the Diary — the cooked tick lives only in the
browser's `localStorage` and never reaches a food-diary endpoint (see
[[jrn-cook-from-plan]]). So a household that cooked from its plan must still come to
the Diary and press "Copy from Planner" itself; the two are not connected.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/food-diary-page.tsx` |

## Related

- [[page-diary]] — the surface this journey lives on
- [[dom-diary]] — the domain it belongs to

## Known defects

- `fnd-cooked-never-reaches-diary` — meals marked cooked on the Planner never flow
  into the Diary; the household must re-enter them via "Copy from Planner". See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
