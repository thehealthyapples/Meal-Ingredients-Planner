---
entry: adm-home
name: Admin Hub
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Admin Hub

> The entry point to every admin tool, gated client-side on the admin role.

## What it is

The capability that gives an admin a single place from which every admin tool is
reachable. It is gated on the client: the page renders the tool grid only when
the signed-in user's role is `admin`, and shows the Not Found page to anyone else.
A shared Admin banner provides cross-navigation between admin pages once inside.
The gate is client-side, so it governs what is shown, not what the server will
serve — each admin API enforces its own admin check.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-page.tsx` |
| Component | `client/src/components/admin-banner.tsx` |

## Related

- [[page-admin-home]] — the page this capability is reached at
- [[dom-admin]] — the domain this capability belongs to

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
