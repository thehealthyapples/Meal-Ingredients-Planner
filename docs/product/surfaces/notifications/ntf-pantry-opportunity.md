---
entry: ntf-pantry-opportunity
name: Pantry opportunity notice
section: notifications
status: hidden
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Pantry opportunity notice

> A note that something in the pantry could be used, raised only with cited
> evidence.

## What it is

A note that something in the pantry could be used. It is produced from the
`opportunity-delivery` capability through the platform's existing intelligence
path, and its content is a verbatim projection of what that capability produced.
It is raised only with cited evidence: an opportunity that cites nothing is
dropped rather than surfaced. It is fully implemented and, today, cannot reach a
household.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/conversation/notice-engine.ts#L283` |

## Why it cannot reach a household

This notice is produced by the Companion Notice Engine, whose output the client
never receives. The client fetches `/api/intelligence/companion/observations`
while the server only serves `/api/intelligence/companion/notices`, so every
fetch 404s and Home's Reminders section renders empty. The notice exists and is
fully implemented, but it cannot currently reach a household. See
[[hid-notice-engine]] for the full endpoint mismatch and the one-line fix.

## Related

- [[hid-notice-engine]] — the unreachable engine that produces this notice
- [[dom-pantry]] — the pantry domain this notice is about

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
