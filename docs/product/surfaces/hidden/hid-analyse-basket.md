---
entry: hid-analyse-basket
name: /analyse-basket (unclickable alias)
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
route: /analyse-basket
last_verified: 2026-07-11
version: 1
---

# /analyse-basket (unclickable alias)

> A second address for the Basket page that no control in the product ever
> navigates to.

## What it is

`/analyse-basket` is a second route that renders the same Basket page component
as `/basket`. It is an alias — a working address that shows the household their
basket — but no control anywhere navigates to it. Reaching it means typing the
URL.

## Where it lives

| | |
|---|---|
| Route | `/analyse-basket` |
| Source | `client/src/App.tsx#L211` |

The primary basket address is `/basket` (`App.tsx#L212`); both render
`ShoppingListPage`.

## Why it is unreachable

No control navigates to `/analyse-basket`. Every reference to it is either the
route definition, a `location === "/analyse-basket"` active-state comparison
(`workspace-header.tsx`, `nav-bar.tsx`), the active-pill alias map
(`NAV_ACTIVE_ALIASES` in `nav-bar.tsx`), or a regex on the current location
(`FloatingAssistant.tsx`). The dashboard card literally labelled "Analyse
Basket" (and carrying `data-testid="action-analyse-basket"`) navigates to
`/basket`, not here.

## What it would take to reach it

One navigation target. Any `<Link href="/analyse-basket">` — for instance
repointing that misleadingly named dashboard card at its own name — would make
the alias reachable. Since it shows the same page as `/basket`, the more useful
fix is usually to retire the duplicate address rather than link it.

## Related

- [[page-basket]] — the Basket page this alias renders
- [[routes-map]] — the full route table

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
