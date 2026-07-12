---
entry: ntf-nutrition-trend
name: Nutrition trend notice
section: notifications
status: hidden
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Nutrition trend notice

> A quiet note when the household's eating has genuinely moved in a direction
> worth mentioning.

## What it is

A quiet notice that appears when the household's eating has genuinely moved in a
direction worth mentioning. It is a `low`-priority notice built on
`computeGrowthSignal`, which reads the household's existing health-trend rows; if
the signal is thin or absent, the notice stays silent rather than guess. It is
fully implemented and, today, cannot reach a household.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/conversation/notice-engine.ts#L176` |

## Why it cannot reach a household

This notice is produced by the Companion Notice Engine, whose output the client
never receives. The client fetches `/api/intelligence/companion/observations`
while the server only serves `/api/intelligence/companion/notices`, so every
fetch 404s and Home's Reminders section renders empty. The notice exists and is
fully implemented, but it cannot currently reach a household. See
[[hid-notice-engine]] for the full endpoint mismatch and the one-line fix.

## Related

- [[hid-notice-engine]] — the unreachable engine that produces this notice
- [[page-home]] — the surface whose Reminders section would show it

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
