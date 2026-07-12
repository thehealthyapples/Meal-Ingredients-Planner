---
entry: page-admin-ingredient-products
name: Admin — THA Picks
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/ingredient-products
last_verified: 2026-07-11
version: 1
---

# Admin — THA Picks

> Curate the preferred real products THA recommends to households.

## What it is

The page at `/admin/ingredient-products`. It lists the curated real-world
products THA puts in front of households, with search. An admin can add a new
pick, edit an existing one, deactivate it, and reactivate it. A lookup against
Open Food Facts by barcode helps fill in a product's name, brand, quantity and
stores when adding.

## Where it lives

| | |
|---|---|
| Route | `/admin/ingredient-products` |
| Source | `client/src/pages/admin-ingredient-products-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-ingredient-products]] — the THA Picks curation capability this surface provides
- [[gls-tha-picks]] — the term for these curated products

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
