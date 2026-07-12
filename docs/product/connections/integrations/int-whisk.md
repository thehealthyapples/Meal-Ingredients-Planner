---
entry: int-whisk
name: Whisk
section: integrations
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Whisk

> Hands a finished basket to a supermarket for checkout.

## What it is

Whisk is the connection that takes a household's finished shopping basket and
hands it to a supermarket, so the items can be checked out at the retailer
rather than re-typed by hand. It is the bridge between THA's shopping list and a
real online grocery order.

## Where it lives

| | |
|---|---|
| Source | `server/lib/grocery-integration.ts` |

## What breaks without it

When the Whisk API is not available, the basket is not lost: THA deep-links into
each retailer's own search instead. `grocery-integration.ts` holds a table of
per-supermarket search URLs (Tesco, Sainsbury's, Ocado, Asda, Morrisons,
Waitrose, Aldi, Lidl and others) and builds a search link per item, switching
its method from `api` to `search`. The household still reaches the retailer,
just by searching rather than by a handed-over basket.

## Related

- [[jrn-shop]] — the shopping journey this closes
- [[dom-shopping]] — the domain that owns the basket

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
