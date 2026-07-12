---
entry: page-admin-development-world
name: Admin — Development World
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/development-world
last_verified: 2026-07-11
version: 1
---

# Admin — Development World

> Browse the fifty synthetic development households — a development-environment
> tool that fails when opened in production.

## What it is

The page at `/admin/development-world`. It is a read-only operator view of the
fifty synthetic Development World households: a searchable, sortable, filterable
table showing each household's type, members, subscription tier, Companion
personality, authored statistics, cold-start status and last import/reset, with a
link into each household's detail page. It has no seed, reset, edit or impersonate
control — it only reads. The underlying data is served only in the development
environment; the server refuses to load it in production, so the page fails there
even though its card is shown on the Admin Hub in production too.

## Where it lives

| | |
|---|---|
| Route | `/admin/development-world` |
| Source | `client/src/pages/admin-development-world-page.tsx` |
| Server | `server/development-world/world-reader.ts` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-development-world]] — the Development World Browser capability this surface provides
- [[hid-devworld-prod]] — the production-visibility hazard this page shares
- [[dev-development-world]] — the dataset this page reads

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
