---
entry: adv-honest-gaps
name: THA says "I don't know"
section: competitive-advantages
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# THA says "I don't know"

> Every score and claim traces to a stored, cited fact, and where there is none
> THA is silent rather than plausible.

## What it is

THA's core discipline: every score and every claim it makes traces back to a
stored, cited fact. Where there is no fact, THA does not improvise a plausible
one — it stays silent. The notice engine will not construct a reason it cannot
evidence. This is what separates THA from a food app that always has an answer,
including when it shouldn't.

## Where it lives

| | |
|---|---|
| Source | `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` |
| Source | `server/intelligence/conversation/notice-engine.ts#L290` |

The governing architecture is cited above, not restated here (Rule PKR13).

## Substantiated by

- [[cap-nutrition-knowledge]] — the cited-fact store the claims trace to
- [[dev-capability-registry]] — the registry that binds a claim to its evidence

## Related

- [[dom-companion]]

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
