---
entry: adm-knowledge-review
name: Knowledge Review Workbench
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Knowledge Review Workbench

> Approve or reject unresolved food-knowledge terms before a household can be told
> them.

## What it is

The capability, available to admins, to gate food-knowledge before it reaches
households. An admin works the queue of terms the resolver could not answer,
approving or rejecting each one, and can review prior decisions, see a consensus
view, export and import batches, and publish approved terms in a release that can
be rolled back. Nothing enters a household's answers until it has passed through
here.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-knowledge-review-page.tsx` |

## Related

- [[page-admin-knowledge-review]] — the page this capability is reached at

## Known defects

- `fnd-admin-chrome-inconsistency` — the page this capability is reached at is
  registered without the shared Admin banner chrome the other admin surfaces
  carry, so its admin navigation is missing. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
