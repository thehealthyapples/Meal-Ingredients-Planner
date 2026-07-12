---
entry: set-subscription-tier
name: Subscription tier
section: settings
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Subscription tier

> Whether a household is free, premium or friends-and-family — changeable
> today only by an admin, with no path from inside the product.

## What it is

The subscription tier records whether a household is free, premium or
friends-and-family. It governs what a household is entitled to, but today it can
only be changed by an admin: there is no way for a household to change its own
tier from inside the product. The tier itself is defined and read on the server;
an admin adjusts it from the admin users page.

## Where it lives

| | |
|---|---|
| Source | `server/lib/access.ts` |
| Source | `client/src/pages/admin-users-page.tsx` |

## Default

`free` — every household starts on the free tier.

## Related

- [[adm-users]] — the admin surface where the tier is changed

## Known defects

- `fnd-no-upgrade-path` — a defect exists here; see PDA1.
- `fnd-premium-unenforced` — a defect exists here; see PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
