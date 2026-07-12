---
entry: page-admin-intelligence
name: Admin — Intelligence
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/intelligence
last_verified: 2026-07-11
version: 1
---

# Admin — Intelligence

> Monitor AI capability benchmark results.

## What it is

The page at `/admin/intelligence`, titled "Intelligence Workspace". It runs the
THA Companion Benchmark through the single Companion seam and reads back the
result — the Overall Intelligence Score, breakdowns, safety gates, top
improvements and regressions, failed questions, release readiness, and the
benchmark trend — and lets an admin re-open or download any previous run's
report. It has two tabs, Benchmark and Companion Health. It re-computes nothing:
every number comes verbatim from a run's stored result.

## Where it lives

| | |
|---|---|
| Route | `/admin/intelligence` |
| Source | `client/src/pages/admin-intelligence-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-intelligence]] — the Intelligence Benchmarks capability this surface provides

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
