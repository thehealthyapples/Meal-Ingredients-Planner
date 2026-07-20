---
entry: ntf-shopping-opportunity
name: Shopping opportunity notice
section: notifications
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-20
version: 2
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

## How it reaches a household

It is gathered by `GET /api/intelligence/companion/notices`, ranked and capped by
the Silence Rules (at most two notices per moment), voiced by the Behaviour
Engine in the household's chosen personality, and rendered in the Companion
panel. The emblem's `aware` state lights when a notice is waiting; opening the
Companion is how the household reads it.

*Corrected 2026-07-20 (PRESENCE2, Rule PKR15).* This section previously read
*"Why it cannot reach a household"* and described a 404 caused by the client
fetching `/observations` while the server served `/notices`. **PHASE5E fixed that
mismatch and this entry was never corrected** — the registry went on telling
readers the notice was unreachable after it had started reaching households,
which is the staleness defect Rule KC14 exists to catch. PRESENCE2 additionally
made the notice reachable in **both** panel states: it had rendered only when the
household had no conversation history, so `aware` lit for anyone who had ever
sent a message and the panel showed them their old thread instead.

## Related

- [[cap-companion]] — the Companion, which speaks it
- [[dom-shopping]] — the shopping domain this notice is about

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-20._
