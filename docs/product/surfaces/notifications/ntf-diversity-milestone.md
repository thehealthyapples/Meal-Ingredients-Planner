---
entry: ntf-diversity-milestone
name: Plant diversity milestone notice
section: notifications
status: hidden
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Plant diversity milestone notice

> A quiet acknowledgement each tenth different plant the household has eaten.

## What it is

A quiet acknowledgement that appears each tenth different plant the household has
eaten. It is a `low`-priority notice built on the household's all-time plant
diversity count, surfacing only when that count is a multiple of ten. Because the
count is cumulative, it is phrased as a present-state fact, never as "you just
achieved this." It is fully implemented and, today, cannot reach a household.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/conversation/notice-engine.ts#L219` |

## Why it cannot reach a household

This notice is produced by the Companion Notice Engine, whose output the client
never receives. The client fetches `/api/intelligence/companion/observations`
while the server only serves `/api/intelligence/companion/notices`, so every
fetch 404s and Home's Reminders section renders empty. The notice exists and is
fully implemented, but it cannot currently reach a household. See
[[hid-notice-engine]] for the full endpoint mismatch and the one-line fix.

## Related

- [[hid-notice-engine]] — the unreachable engine that produces this notice
- [[gls-plant-diversity]] — the plant-diversity measure this notice reads

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
