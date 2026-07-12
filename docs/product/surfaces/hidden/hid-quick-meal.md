---
entry: hid-quick-meal
name: Build a Meal (unlinked)
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
route: /quick-meal
last_verified: 2026-07-11
version: 1
---

# Build a Meal (unlinked)

> A complete, working quick meal-builder that no button, link or menu in the
> product points at.

## What it is

`/quick-meal` is a fully built, working meal-builder. The household adds named
meal components, and each component can be sourced from a web-recipe search, the
cookbook, fresh or frozen items, or a scanned or picked product. The assembled
meal can then be saved to the cookbook or pushed part-by-part into the shopping
basket. It is not a stub — it carries real queries, mutations and dialogs — and
today it is reachable only by typing its URL.

## Where it lives

| | |
|---|---|
| Route | `/quick-meal` |
| Source | `client/src/pages/quick-meal-page.tsx` (752 lines) |
| Route registration | `client/src/App.tsx#L237` |

## Why it is unreachable

Nothing in the client navigates to `/quick-meal`. The only references to the
path are its `import` and its `<Route>` definition in `App.tsx`, plus the page's
own internal `data-testid` strings. It is absent from the navigation alias map
(`nav-bar.tsx`). There is no `<Link>`, `href`, `setLocation` or `navigate` call
anywhere that targets it.

## What it would take to reach it

One inbound link. Adding a single `<Link href="/quick-meal">` control to a
surface a household actually visits (or an entry in the navigation) would make
the whole builder reachable — the route and the page already work.

## Evidence

> Zero inbound links found across the whole client; reachable only by typing the
> URL.

Confirmed: the only `/quick-meal` occurrences in the client are the import
(`App.tsx#L47`), the route definition (`App.tsx#L237`), and the page's own test
ids. No control navigates to it.

## Related

- [[page-quick-meal]] — the page record for this builder

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
