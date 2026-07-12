---
entry: adm-benchmark-households
name: Benchmark Households
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Benchmark Households

> Seed, reset and impersonate the synthetic households the Companion is measured
> against.

## What it is

The capability, available to admins, to manage the ten permanent deterministic
"(Auto)" households the Companion Intelligence Benchmark scores against. An admin
can seed or reset one household or the whole world back to its canonical fixture,
inspect a household's fixture against its live seeded state, impersonate a
household, and launch a benchmark run against one, several or all of them. Runs
go through the single Companion seam and land in the shared run history. The
world is a development-environment tool; the server refuses these actions in
production.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-benchmark-households-page.tsx` |

## Related

- [[page-admin-benchmark-households]] — the page this capability is reached at

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
