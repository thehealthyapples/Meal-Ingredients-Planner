---
entry: cap-developer
name: Developer / Platform capability
section: intelligence-capabilities
status: live
visibility: developer
owner: Colin Clapson
last_verified: 2026-11-10
version: 1
---

# Developer / Platform capability

> Read-only Engineering Intelligence over this repository's own architecture,
> investigations, implementation reports, and git history — physically
> isolated from the household/Companion plane.

## What it means for engineering

A developer-plane query (never reachable from the Companion or any household
surface) can read this repository's architecture documents, investigations,
implementation reports, the roadmap, release documentation, and git history,
and answer with `path:line` citations.

## What it will never do

It never creates, edits, or retires a governing document, and derives no
completion status the repository has not itself recorded. `aiAccess: never` —
no model prompt may read it, and no household-facing surface may reach it;
this is a physically isolated developer plane, not a user-facing capability
with restricted visibility.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`developer`) |
| Owning service | `server/services/engineering-knowledge-registry.ts` |
| Developer plane | `server/intelligence/developer-plane.ts` |

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-10._
