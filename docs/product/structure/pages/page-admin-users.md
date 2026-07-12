---
entry: page-admin-users
name: Admin — Users
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/users
last_verified: 2026-07-11
version: 1
---

# Admin — Users

> Manage households, subscription tiers and password resets.

## What it is

The page at `/admin/users`. It shows a searchable, paginated table of every
account with its display name, role, subscription tier, and last login. From
here an admin can change an account's subscription tier, reset its password,
re-run its onboarding, and repair a broken account. The same page also carries
the site-banner controls (an enable toggle and a text field) that switch on the
site-wide message. A non-admin who reaches this route is redirected home.

## Where it lives

| | |
|---|---|
| Route | `/admin/users` |
| Source | `client/src/pages/admin-users-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-users]] — the User Management capability this surface provides

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
