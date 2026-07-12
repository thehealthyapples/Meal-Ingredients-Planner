---
entry: ntf-seasonal-highlight
name: Seasonal highlight notice
section: notifications
status: hidden
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Seasonal highlight notice

> A note about what is in season and worth trying now.

## What it is

A note about what is in season and worth trying now. It wraps a single
already-chosen seasonal headline — the same derivation the Home and Planner
intelligence surfaces already use — into a `low`-priority notice. When the season
has nothing worth mentioning yet, it stays silent rather than guess. It is fully
implemented and, today, cannot reach a household.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/conversation/notice-engine.ts#L317` |

## Why it cannot reach a household

This notice is produced by the Companion Notice Engine, whose output the client
never receives. The client fetches `/api/intelligence/companion/observations`
while the server only serves `/api/intelligence/companion/notices`, so every
fetch 404s and Home's Reminders section renders empty. The notice exists and is
fully implemented, but it cannot currently reach a household. See
[[hid-notice-engine]] for the full endpoint mismatch and the one-line fix.

## Related

- [[hid-notice-engine]] — the unreachable engine that produces this notice

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
