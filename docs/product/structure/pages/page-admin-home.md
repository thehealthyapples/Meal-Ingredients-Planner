---
entry: page-admin-home
name: Admin Hub
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin
last_verified: 2026-07-11
version: 1
---

# Admin Hub

> The card grid from which every admin tool is reached.

## What it is

The page an admin lands on at `/admin`. It is a grid of cards, one per admin
tool, each linking to its own page. A non-admin who reaches this route is shown
the Not Found page instead — the grid itself never renders for them. One card
("Overview") is marked "coming soon" and is not yet a working destination; the
rest link to live admin pages.

## Where it lives

| | |
|---|---|
| Route | `/admin` |
| Source | `client/src/pages/admin-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-home]] — the Admin Hub capability this surface provides

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
