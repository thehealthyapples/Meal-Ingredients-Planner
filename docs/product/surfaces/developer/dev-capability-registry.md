---
entry: dev-capability-registry
name: Runtime Capability Registry
section: developer-experiences
status: internal
visibility: developer
owner: Colin Clapson
last_verified: 2026-07-12
version: 2
---

# Runtime Capability Registry

> The single runtime list of what the Intelligence Platform may do, and with
> whose permission.

## What it is

The single canonical allow-list, at runtime, of the capabilities the Intelligence
Platform may touch. Each entry describes an existing owner — its service, its API
surface, its source-of-truth owner, the intents it supports, the minimum role and
knowledge class required, and whether it is merely registered or actually
executable. It reads ownership rather than re-declaring it, and it is a derived
projection rebuildable from the live route table and the Source of Truth Register,
never a second authoritative store. Capabilities can be added here without any
architectural change — this is the extension point the platform was built around.
Honest gaps — desired actions THA does not yet own an endpoint for — are recorded
as gaps rather than given a fabricated owner.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/capability-registry.ts` |

## Related

- [[cap-planner]] — a capability this registry describes
- [[cap-meals]] — a capability this registry describes
- [[cap-analyser]] — a capability this registry describes
- [[cap-product-knowledge]] — the capability by which THA describes itself

## Known defects

None. `fnd-no-product-knowledge-capability` is **closed** — PHASE5A registered
`product-knowledge`, so the runtime registry now declares who owns product
knowledge and what the platform may do with it.

24 capabilities are registered. 22 are bound and executable; `administration` is
registered but unbound, and `developer` is `never` — it must not be reachable from
the user-facing plane at all.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-12._
