---
entry: adm-users
name: User Management
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# User Management

> Change a household's subscription tier, reset a password, or re-run their
> onboarding.

## What it is

The capability, available to admins, to act on another household's account. An
admin can search accounts and, for any one, change its subscription tier (free,
premium, or friends & family), reset its password, re-run its onboarding, and
repair a broken account. Each action calls an admin-only server endpoint. This
is the operator lever over accounts THA otherwise never touches directly.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-users-page.tsx` |

## Related

- [[page-admin-users]] — the page this capability is reached at
- [[set-subscription-tier]] — the tier-change action this capability performs

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
