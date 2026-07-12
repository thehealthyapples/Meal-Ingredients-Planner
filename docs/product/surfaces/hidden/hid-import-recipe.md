---
entry: hid-import-recipe
name: Import Recipe (bounce stub)
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
route: /import-recipe
last_verified: 2026-07-11
version: 1
---

# Import Recipe (bounce stub)

> An eight-line stub that immediately redirects to the Cookbook — a legacy
> address with no inbound links.

## What it is

`/import-recipe` is an eight-line page. On mount it immediately redirects to
`/cookbook` and renders nothing of its own. It is a legacy address kept alive
only as a bounce; anyone who reaches it lands on the Cookbook.

## Where it lives

| | |
|---|---|
| Route | `/import-recipe` |
| Source | `client/src/pages/import-recipe-page.tsx` (8 lines) |
| Route registration | `client/src/App.tsx#L210` |

## Why it is unreachable

Nothing in the client navigates to `/import-recipe`. Its only references are its
import and route definition in `App.tsx`. The similarly named `/api/import-recipe`
and `/api/import-recipe-from-text` are server endpoints and the `ImportRecipeDialog`
component is unrelated — none navigate to this page route.

## What it would take to reach it

Nothing worth doing. The page only redirects to `/cookbook`, so linking to it
would just add a hop. Its value is as a safety net for the old address, not a
destination.

## Related

- [[page-import-recipe]] — the page record for this stub

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
