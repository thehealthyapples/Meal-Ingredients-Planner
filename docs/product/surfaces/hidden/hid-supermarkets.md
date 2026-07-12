---
entry: hid-supermarkets
name: Supermarkets (unlinked)
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
route: /supermarkets
last_verified: 2026-07-11
version: 1
---

# Supermarkets (unlinked)

> A finished supermarket directory with country filtering that nothing in the
> product links to.

## What it is

`/supermarkets` is a finished supermarket directory, grouped by country, with a
working country filter (ALL, UK, US, EU). From it the household can open a
store's search URL for a single item, or export the whole basket as a combined
search query. It is a complete page, not a stub, and today it is reachable only
by typing its URL.

## Where it lives

| | |
|---|---|
| Route | `/supermarkets` |
| Source | `client/src/pages/supermarkets-page.tsx` (223 lines) |
| Route registration | `client/src/App.tsx#L217` |

## Why it is unreachable

Nothing in the client navigates to `/supermarkets`. The only references to the
path are its `import` and its `<Route>` definition in `App.tsx`. It is not in
the navigation alias map, and no control anywhere links to it.

## What it would take to reach it

One inbound link. A single `<Link href="/supermarkets">` on a surface a
household visits, or a navigation entry, would surface the whole directory —
country filter and all — which already works.

## Evidence

> Zero inbound links found across the whole client.

Confirmed: the only `/supermarkets` occurrences in the client are the import
(`App.tsx#L25`) and the route definition (`App.tsx#L217`). The country filter is
real (`selectedCountry` state and a `select-country-filter` control in the page
header).

## Related

- [[page-supermarkets]] — the page record for this directory

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
