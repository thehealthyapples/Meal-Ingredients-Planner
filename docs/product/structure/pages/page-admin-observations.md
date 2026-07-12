---
entry: page-admin-observations
name: Admin — Observation Workbench
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/observations
last_verified: 2026-07-11
version: 1
---

# Admin — Observation Workbench

> Watch the Intelligence Platform's live telemetry — capability health, intent
> quality, outcomes.

## What it is

The page at `/admin/observations`. It reads the Observation Engine's runtime
telemetry and presents it across nine tabs — overview, capabilities, intents,
context, companion, knowledge, planner, benchmarks, and a raw diagnostics feed.
It computes nothing itself beyond display formatting and degrades gracefully when
a window has no data, rendering a missing figure as "—" rather than a fabricated
zero.

## Where it lives

| | |
|---|---|
| Route | `/admin/observations` |
| Source | `client/src/pages/admin-observation-workbench-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-observations]] — the Observation Workbench capability this surface provides

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
