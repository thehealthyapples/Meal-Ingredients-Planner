---
entry: page-admin-recipe-sources
name: Admin — Recipe Sources
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/recipe-sources
last_verified: 2026-07-11
version: 1
---

# Admin — Recipe Sources

> Configure where recipes may be imported from, and audit blocked imports.

## What it is

The page at `/admin/recipe-sources`. It lists the external recipe sources in two
groups — official / licensed APIs (which need credentials configured) and
scraped sources — each with a toggle that turns fetching from that source on or
off immediately. Below the sources is a Blocked Request Audit Log that records
requests refused because a source was disabled or its credentials were missing.

## Where it lives

| | |
|---|---|
| Route | `/admin/recipe-sources` |
| Source | `client/src/pages/admin-recipe-sources-page.tsx` |
| Architecture | `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-recipe-sources]] — the Recipe Source Governance capability this surface provides

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
