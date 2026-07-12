---
entry: dev-development-world
name: Development World dataset
section: developer-experiences
status: internal
visibility: developer
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Development World dataset

> Fifty synthetic households used to exercise the platform without touching real
> people's data.

## What it is

A fixed dataset of fifty synthetic households — with members, eaters, pantries,
planners, diaries, cookbook references and authored statistics — used to exercise
the platform in development without any real person's data. Its canonical form is
a single versioned file (`development_world_foundation_50.v1.json`) that the
server reads once, caches, and only ever reads: the reader owns no write path and
never seeds, resets or impersonates. It is development-only; every entry point
asserts `NODE_ENV !== "production"` with no override.

## Where it lives

| | |
|---|---|
| Server | `server/development-world/` |
| Data | `data/development_world/` |

## Related

- [[adm-development-world]] — the admin browser that reads this dataset
- [[hid-devworld-prod]] — the production-visibility hazard of its admin surface

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
