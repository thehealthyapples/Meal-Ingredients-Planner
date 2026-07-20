---
entry: ntf-planner-gap
name: Planner gap notice
section: notifications
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-20
version: 2
---

# Planner gap notice

> A note that part of the week has nothing planned, raised only when there is
> evidence to cite.

## What it is

A note that part of the week has nothing planned. It is produced from the
`opportunity-delivery` capability through the same intelligence path the platform
already uses, and its content is a verbatim projection of what that capability
produced. It is raised only when there is evidence to cite: an opportunity that
carries no evidence is dropped rather than surfaced uncited.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/conversation/notice-engine.ts#L283` |

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
- [[dom-planner]] — the planner domain this notice is about

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-20._
