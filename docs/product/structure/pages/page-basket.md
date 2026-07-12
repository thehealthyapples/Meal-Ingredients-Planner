---
entry: page-basket
name: Basket
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /basket
aliases:
  - /analyse-basket
last_verified: 2026-07-11
version: 1
---

# Basket

> A second, older shopping surface reached from the Dashboard, doing the same job as Shopping in a different interface.

## What it is

An earlier take on the shopping list, still reachable from the Dashboard. It works
over the same shopping items as the Shopping workspace — adding ingredients,
matching them to real products with prices and Apple Scores, and sorting the
list — but presents them through its own, table-led interface. It has not been
retired, so a household can end up in either this Basket or the newer Shopping
screen depending on where they tapped.

## Where it lives

| | |
|---|---|
| Route | `/basket` |
| Source | `client/src/pages/shopping-list-page.tsx` |

## Aliases

- `/analyse-basket` — a second address for this same page.

## Related

- [[dom-shopping]] — the domain this page belongs to
- [[page-shopping-workspace]] — the newer, primary shopping surface

## Known defects

- `fnd-shopping-duplicate` — this Basket and the newer Shopping workspace are two
  surfaces over the same shopping list, each with its own interface, with no single
  owner of the task. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
