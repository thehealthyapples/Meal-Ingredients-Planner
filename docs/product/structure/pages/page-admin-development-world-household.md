---
entry: page-admin-development-world-household
name: Admin — Development World Household
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/development-world/:id
last_verified: 2026-07-11
version: 1
---

# Admin — Development World Household

> Inspect one synthetic development household in detail.

## What it is

The detail page reached at `/admin/development-world/:id`. For a single
Development World household it shows the summary, members, eaters, planner
overview, pantry summary, cookbook references, diary summary, evidence summary,
and validation status — the canonical authored fixture alongside the live seeded
state. Like its parent listing it is read-only: it has no edit and no impersonate
control, every value is displayed and never mutated, and the data is served in
the development environment only.

## Where it lives

| | |
|---|---|
| Route | `/admin/development-world/:id` |
| Source | `client/src/pages/admin-development-world-household-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[page-admin-development-world]] — the listing this detail page opens from

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
