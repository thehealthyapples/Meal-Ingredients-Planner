---
entry: adm-recipe-sources
name: Recipe Source Governance
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Recipe Source Governance

> Decide which recipe sources THA may import from, and see what was blocked.

## What it is

The capability, available to admins, to govern recipe acquisition. An admin
toggles each external recipe source — official / licensed APIs and scraped sites
— on or off, and a source toggled off stops being fetched from immediately. The
Blocked Request Audit Log lets the admin see which requests were refused because
a source was disabled or its credentials were missing. This is the control that
decides where THA's recipes are allowed to come from.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-recipe-sources-page.tsx` |

## Related

- [[page-admin-recipe-sources]] — the page this capability is reached at

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
