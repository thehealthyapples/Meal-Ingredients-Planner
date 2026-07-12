---
entry: page-admin-knowledge-review
name: Admin — Knowledge Review
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/knowledge-review
last_verified: 2026-07-11
version: 1
---

# Admin — Knowledge Review

> Review and approve unresolved food-knowledge terms before they reach households.

## What it is

The page at `/admin/knowledge-review`, the Knowledge Review Workbench. It presents
the queue of unresolved food-knowledge terms the resolver could not answer, so an
admin can approve or reject each one before a household is ever told it. Alongside
the queue it carries decision review, a consensus view, batch export and import,
and a release step with rollback that publishes approved terms. It is where
food-knowledge answers are gated for correctness before they go out.

## Where it lives

| | |
|---|---|
| Route | `/admin/knowledge-review` |
| Source | `client/src/pages/admin-knowledge-review-page.tsx` |
| Routing | `client/src/App.tsx#L230` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-knowledge-review]] — the Knowledge Review Workbench capability this surface provides

## Known defects

- `fnd-admin-chrome-inconsistency` — this route is registered without the shared
  Admin banner chrome that every other admin route is wrapped in, so the admin
  navigation bar is missing here. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
