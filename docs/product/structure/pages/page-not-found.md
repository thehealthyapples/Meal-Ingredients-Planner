---
entry: page-not-found
name: Not Found
section: pages
status: live
visibility: public
owner: Colin Clapson
route: "*"
last_verified: 2026-07-11
version: 1
---

# Not Found

> The page a person reaches when an address does not exist — currently without navigation or a way back into the product.

## What it is

The catch-all shown when an address matches no screen. It is a single small card
reading "404 Page Not Found" with the developer-facing note "Did you forget to add
the page to the router?". There is no navigation, no link home, and nothing to
carry a person back into the product — whoever lands here has to change the address
themselves.

## Where it lives

| | |
|---|---|
| Route | `*` |
| Source | `client/src/pages/not-found.tsx` |

## Known defects

- `fnd-broken-shopping-link` — this page is where the Shopping workspace's "Basket"
  menu item lands, because that item points at `/shopping`, which is not a route.
  A working control in the product leads here. See PDA1.
- `fnd-notfound-dead-end` — the page offers no navigation and no way back into the
  product, and its message is written for a developer rather than a household, so
  anyone who reaches it is stranded. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
