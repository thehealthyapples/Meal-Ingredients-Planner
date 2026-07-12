---
entry: adm-development-world
name: Development World Browser
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Development World Browser

> Read the fifty synthetic development households — available in development
> only, though the card is shown in production too.

## What it is

The capability, available to admins, to read the fifty synthetic Development
World households. It is strictly read-only: it lists and inspects households and
their authored statistics, and owns no seed, reset, edit or impersonate path. The
server guards it to the development environment with no override — every entry
point asserts `NODE_ENV !== "production"` and refuses otherwise — yet the Admin
Hub still shows its card in production, so an admin who clicks it there reaches a
surface that fails to load.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-development-world-page.tsx` |
| Server | `server/development-world/world-reader.ts#L43` |

## Related

- [[page-admin-development-world]] — the page this capability is reached at
- [[hid-devworld-prod]] — the production-visibility hazard

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
