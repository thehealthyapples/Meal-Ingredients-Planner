---
entry: ntf-shopping-opportunity
name: Shopping opportunity notice
section: notifications
status: hidden
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Shopping opportunity notice

> A note about the shopping list — including the one critical case, an item that
> conflicts with a household member's hard restriction.

## What it is

A note about the shopping list. Most of the time it is a low-key suggestion, but
it also carries the one critical case: an item on the list that conflicts with a
household member's hard restriction. That safety-relevant conflict is the
platform's single `critical`-priority emitter — the sole member of the closed
critical allowlist — and it only surfaces the conflict for a human to review; it
never edits the list itself. It is fully implemented and, today, cannot reach a
household.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/conversation/notice-engine.ts#L283` |
| Restriction-conflict producer | `server/intelligence/food-intelligence/opportunity-engine.ts#L256` |

## Why it cannot reach a household

This notice is produced by the Companion Notice Engine, whose output the client
never receives. The client fetches `/api/intelligence/companion/observations`
while the server only serves `/api/intelligence/companion/notices`, so every
fetch 404s and Home's Reminders section renders empty. The notice exists and is
fully implemented — including the critical hard-restriction conflict case — but
it cannot currently reach a household. See [[hid-notice-engine]] for the full
endpoint mismatch and the one-line fix.

## Related

- [[hid-notice-engine]] — the unreachable engine that produces this notice
- [[dom-shopping]] — the shopping domain this notice is about

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
