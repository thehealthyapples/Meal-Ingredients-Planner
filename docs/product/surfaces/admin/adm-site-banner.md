---
entry: adm-site-banner
name: Site Banner
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Site Banner

> A site-wide message an admin can switch on for every household at once.

## What it is

The capability, available to admins, to display one message across the whole
site. An admin sets the banner text and an enable toggle; when enabled with
non-empty text, a green banner appears at the top of the app for every household.
The controls live on the User Management page and save to a single site setting;
the banner itself reads that setting and renders nothing when it is disabled or
empty. The read endpoint is public so every session can see the banner, while
only an admin may change it.

## Where it lives

| | |
|---|---|
| Component | `client/src/components/SiteBanner.tsx` |
| Server | `server/routes.ts` |

## Related

- [[ntf-site-banner]] — the notification surface this capability drives

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
