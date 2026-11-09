---
entry: page-shopping-workspace
name: Shopping
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /shopping-workspace
aliases:
  - /list
  - /shopping-list
last_verified: 2026-07-11
version: 1
---

# Shopping

> The household's working shopping list — add items, match them to real products, check prices, and hand the basket to a supermarket.

## What it is

The household's live shopping list. Items can be typed in, scanned from a photo of
a written list, or arrive from the planner and pantry. With a tap, THA matches the
plain items to real grocery products across supermarkets and brings back prices, so
the list can be sorted by price or by Apple Score. When the household is ready, the
basket can be exported to a chosen supermarket to carry on shopping there. This is
the current, primary shopping surface, reached from the main navigation.

## Where it lives

| | |
|---|---|
| Route | `/shopping-workspace` |
| Source | `client/src/pages/shopping-workspace-page.tsx` |

## Aliases

- `/list` and `/shopping-list` — older addresses; both now redirect here.

## Related

- [[dom-shopping]] — the domain this page belongs to
- [[page-basket]] — the older shopping surface that does the same job
- [[jrn-shop]] — the shopping journey

## Known defects

- `fnd-shopping-duplicate` — two shopping surfaces exist for the same task: this
  Shopping workspace and the older Basket page, each with its own interface over
  the same list. See PDA1.
- `fnd-broken-shopping-link` — the workspace menu's "Basket" item links to
  `/shopping`, which is not a route in the product. Following it lands on the
  404 page instead of the Basket. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
