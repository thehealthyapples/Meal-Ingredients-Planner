---
entry: cap-administration
name: Administration capability
section: intelligence-capabilities
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Administration capability

> The admin-only, audited capability covering user and content management.

## What it means

This capability is not for households; it is for administrators. It covers
managing users and content, and every action taken through it is audited. A
household never sees it and never invokes it.

## What it will never do

It is closed to ordinary households entirely — it requires the admin role, so a
household member cannot reach it. Nothing it does is silent: because it is
audited, admin actions on users and content leave a recorded trail.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`administration`) |

The registry owns the architecture, including its admin role gate and audit
requirement; this entry only says what the capability means and to whom.

## Related

- [[dom-admin]] — the domain this capability serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
