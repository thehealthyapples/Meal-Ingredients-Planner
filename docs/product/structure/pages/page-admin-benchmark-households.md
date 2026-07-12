---
entry: page-admin-benchmark-households
name: Admin — Benchmark Households
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/benchmark-households
last_verified: 2026-07-11
version: 1
---

# Admin — Benchmark Households

> Manage the synthetic households used to evaluate the Companion.

## What it is

The page at `/admin/benchmark-households`. It lists the ten permanent, deterministic
"(Auto)" households the Companion Intelligence Benchmark runs against. An admin can
inspect a household's canonical fixture against its live seeded state, seed or reset
one household or the whole world back to canonical, impersonate a household, and run
the Intelligence Benchmark against one, several or all of them. Runs execute through
the single Companion seam and land in the same run history the Intelligence page
reads. This world is a development-environment tool.

## Where it lives

| | |
|---|---|
| Route | `/admin/benchmark-households` |
| Source | `client/src/pages/admin-benchmark-households-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-benchmark-households]] — the Benchmark Households capability this surface provides

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
