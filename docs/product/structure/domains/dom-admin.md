---
entry: dom-admin
name: Admin
section: domains
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Admin

> The operator's view of THA — users, curation, knowledge review, and the
> intelligence workbenches.

## What it is

Admin is the operator's side of THA, open only to users with the admin role;
anyone else is shown the not-found page. It is a hub of cards leading to the
operator tools: managing users, curating ingredient-product picks and recipe
sources, tuning companion intelligence, reviewing unresolved knowledge terms,
and working through the intelligence surfaces — the Intelligence Dashboard,
benchmark and development-world households, and the Observation and Behaviour
workbenches. A shared Admin banner sits above every admin page so an operator
can move between these tools without retyping URLs.

## Where it lives

| | |
|---|---|
| Route | `/admin` |
| Source | `client/src/pages/admin-page.tsx` |
| Banner | `client/src/components/admin-banner.tsx` |

## Related

- [[adm-home]] — the admin hub experience
- [[adm-users]] — the users admin experience
- [[cap-administration]] — the administration capability

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
