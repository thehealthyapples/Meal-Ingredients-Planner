---
entry: page-import-recipe
name: Import Recipe
section: pages
status: deprecated
visibility: household
owner: Colin Clapson
route: /import-recipe
last_verified: 2026-07-11
version: 1
---

# Import Recipe

> A legacy address that now does nothing but redirect to the Cookbook; nothing in the product links to it.

## What it is

An old address that no longer holds a screen of its own. Anyone who reaches
`/import-recipe` is immediately sent on to the Cookbook, where recipe importing now
lives. It is an eight-line redirect stub kept only so the old address does not
break; nothing in the product points a household at it.

## Where it lives

| | |
|---|---|
| Route | `/import-recipe` |
| Source | `client/src/pages/import-recipe-page.tsx` |

## Related

- [[hid-import-recipe]] — the hidden-experience record for this bounce stub
- [[page-cookbook]] — where it redirects, and where importing now lives

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
