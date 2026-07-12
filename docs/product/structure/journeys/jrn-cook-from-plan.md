---
entry: jrn-cook-from-plan
name: Cook from the plan
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Cook from the plan

> A household cooks a planned meal and marks it done — a journey that currently stops at a tick and never reaches the Diary.

## What it is

The moment a planned meal becomes a cooked meal. The household opens the Planner,
finds the meal it just made, and marks it cooked. The intent is that "cooked"
would carry through to what the household actually ate — but today it does not.

## The path

1. **Open the Planner** and find the meal in its day-and-slot cell.
2. **Mark as cooked.** The cell's menu (and the context menu) offer "Mark as
   cooked" / "Unmark cooked", which call `toggleCooked` (`weekly-planner-page.tsx`,
   around L1573).
3. **The tick is recorded — locally.** `toggleCooked` adds the entry id to a set
   and writes it to `localStorage` under `planner:cooked-entries`. The cell shows a
   cooked state; the shopping-cart hint on that meal disappears.

## Where it breaks

The journey ends at that tick. `weekly-planner-page.tsx` contains **no reference to
the diary at all** — marking a meal cooked never posts to any food-diary endpoint.
The cooked state lives only in the browser's `localStorage`, so:

- it does not reach the Diary ([[page-diary]]), and
- it does not survive to another device or a cleared browser.

The household is left holding a cooked tick that goes nowhere. To get the meal
into their record they must separately open the Diary and use "Copy from Planner"
(see [[jrn-track-eaten]]).

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/weekly-planner-page.tsx#L1573` |

## Related

- [[page-planner]] — where the meal is marked cooked
- [[page-diary]] — where "cooked" is supposed to land, and does not

## Known defects

- `fnd-cooked-never-reaches-diary` — "Mark as cooked" writes only to
  `localStorage` (`planner:cooked-entries`) and never reaches the Diary. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
