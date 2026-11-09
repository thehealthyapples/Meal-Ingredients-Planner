---
entry: dom-shopping
name: Shopping
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Shopping

> Turning the week's plan into a shopping trip — one list, real products,
> ready to hand to a supermarket.

## What it is

Shopping takes the ingredients a household's plan implies and turns them into a
working list it can actually shop. The Shopping Workspace walks the household
through the trip in stages — Add items, Review the list before leaving, Prep
against what is already at home, and Shop in-store while tracking what is
found, deferred, or already had. Items carry real quantities and units, and
link out to searches at the major UK supermarkets (Tesco, Sainsbury's, Asda,
Morrisons, Aldi, Lidl, Waitrose, Marks & Spencer, Ocado).

The Basket view offers a related take on the same idea, with its own Review,
Check-cupboards, and Shopping-assistant modes and product ranking. Both
surfaces exist in the domain today.

## Where it lives

| | |
|---|---|
| Route | `/shopping-workspace` (the Shopping Workspace) |
| Route | `/basket` — also `/analyse-basket` (the Basket) |
| Source | `client/src/pages/shopping-workspace-page.tsx` |
| Source | `client/src/pages/shopping-list-page.tsx` |

## Related

- [[page-shopping-workspace]] — the workspace page
- [[page-basket]] — the basket page
- [[jrn-shop]] — shopping the week's plan
- [[cap-shopping]] — the shopping capability

## Known defects

- `fnd-shopping-duplicate` — the Shopping domain is served by two distinct
  pages: the Shopping Workspace (`shopping-workspace-page.tsx`, at
  `/shopping-workspace`) and the Basket (`shopping-list-page.tsx`, at `/basket`
  and `/analyse-basket`), each with its own modes for reviewing and shopping a
  list. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
