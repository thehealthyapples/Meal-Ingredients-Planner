---
entry: jrn-stock-pantry
name: Stock the pantry
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Stock the pantry

> A household records what it already has, so the planner and the shopping list stop buying it again.

## What it is

The household tells THA what it already keeps at home. That record then quietly
feeds planning and shopping, so staples the household already owns are not bought
a second time.

## The path

1. **Open the Pantry** (`/pantry`) and add an ingredient
   (`POST /api/pantry`, with display name and category). Duplicates are refused
   ("Already in pantry").
2. **Say how much you need.** An item with no "need" quantity
   (`needQuantityValue === null`) counts as "have enough" and sits in the
   in-pantry group; setting a need quantity (`PATCH /api/pantry/:id`) marks it as
   something to buy.
3. **The planner reads it.** The Planner loads `/api/pantry` (`weekly-planner-page.tsx`,
   around L664) and knows the household's pantry names.
4. **The shopping list dedupes against it.** The Shopping workspace holds a set of
   pantry keys and a per-line pantry decision (`have_enough` / `need_to_buy`), so
   staples already at home are set aside rather than re-bought (see [[jrn-shop]]).

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/pantry-page.tsx` |
| Source | `client/src/pages/weekly-planner-page.tsx#L664` |

## Related

- [[page-pantry]] — the surface this journey lives on
- [[dom-pantry]] — the domain it belongs to
- [[jrn-shop]] — the shopping journey that dedupes against the pantry

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
