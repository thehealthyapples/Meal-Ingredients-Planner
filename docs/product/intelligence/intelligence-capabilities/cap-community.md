---
entry: cap-community
name: Community capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-10
version: 1
---

# Community capability

> Companion can read back what your household already belongs to; it cannot create,
> join, or leave a community on your behalf.

## What it means for the household

Ask Companion about your household's community membership — which one you're in,
what it's called — and it can look this up and tell you, read directly from your
own record.

## What it will never do

It will not create a community, invite another household, accept an invitation, or
leave a community for you. Those are membership-lifecycle actions you take yourself,
not something Companion carries out on your behalf.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`community`) |
| Binding | `server/intelligence/bindings/community.ts` |

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-10._
