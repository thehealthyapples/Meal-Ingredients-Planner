---
entry: cap-planner
name: Planner capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Planner capability

> Apple can read and explain the household's week; it cannot yet change it.

## What it means for the household

Ask Apple what is planned this week and it will tell you — which meals sit on
which days, and why they are there — reading from the household's own planner.
It is a window onto the plan the household already made, put into words.

## What it will never do

It cannot yet change the plan. Adding, moving, swapping or removing a meal is
not something Apple does on the household's behalf today; those edits stay with
the person, made on the planner itself. The capability reads the week, it does
not rewrite it.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`planner`) |
| Capability Card | `docs/architecture/capabilities/templates.md` |

The Capability Card and the registry own the architecture; this entry only says
what the capability means for a household.

## Related

- [[dom-planner]] — the domain this capability serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
