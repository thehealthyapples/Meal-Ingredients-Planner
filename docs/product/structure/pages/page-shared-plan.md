---
entry: page-shared-plan
name: Shared Plan
section: pages
status: live
visibility: public
owner: Colin Clapson
route: /shared/:token
last_verified: 2026-07-11
version: 1
---

# Shared Plan

> A read-only view of a week another household shared, with the option to copy it into your own planner.

## What it is

The page anyone reaches through a plan's share link. It shows the shared plan
read-only — its name, season and a six-week grid marking which breakfast, lunch and
dinner slots are filled — under The Healthy Apples' name. A signed-in visitor can
import the plan into their own planner with one tap; a signed-out visitor is invited
to create a free account to import it. If the link has expired or been made private,
a calm "this plan is no longer shared" message stands in its place.

## Where it lives

| | |
|---|---|
| Route | `/shared/:token` |
| Source | `client/src/pages/shared-plan-page.tsx` |

## Related

- [[jrn-share-plan]] — the journey of sharing a plan

## Known defects

- `fnd-shared-plan-intent-lost` — the import offers only a single "Import into My
  Planner" button that always imports the whole plan into empty slots. The
  underlying import supports choosing a single week, day or meal and whether to
  keep or replace, but none of that choice is offered here, so the recipient's
  intent about what to bring in is lost. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
