---
entry: page-diary
name: My Diary
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /my-diary
aliases:
  - /diary
last_verified: 2026-07-11
version: 1
---

# My Diary

> A simple daily log of what was eaten, which can be copied straight from the planner.

## What it is

A plain daily record of what was eaten. A household moves day by day and adds
entries by hand, logs a saved meal, or copies a day's meals straight across from
the planner rather than retyping them. Alongside the food log, the day can carry
simple signals — weight, mood, energy, sleep and notes. A Progress tab charts how
those metrics move over time.

## Where it lives

| | |
|---|---|
| Route | `/my-diary` |
| Source | `client/src/pages/food-diary-page.tsx` |

## Aliases

- `/diary` — a shorter address for the same page.

## Related

- [[dom-diary]] — the domain this page belongs to
- [[jrn-track-eaten]] — the journey of tracking what was eaten

## Known defects

- `fnd-cooked-never-reaches-diary` — marking a meal as "cooked" in the planner only
  records that state locally in the browser; it never creates a diary entry. The
  only way a planned meal reaches the diary is the diary's own "Copy from Planner"
  or "Log meal", so cooking a meal and logging it stay two separate acts. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
