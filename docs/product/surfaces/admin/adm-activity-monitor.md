---
entry: adm-activity-monitor
name: Activity Monitor
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-09-16
version: 2
---

# Activity Monitor

> The admin-only, read-only view of activity reported by the THA bridge.

## What it is

Activity Monitor is available at `/admin/activity`. It reads the existing
`/api/admin/activity` projection and renders its four bridge record kinds —
request, decision, execution, and result — exactly as reported, alongside
projection metadata and safety state.

Operators can filter the locally loaded records by kind, status, or ID, select
a record to inspect its reported fields, and manually refresh the projection.
Loading, request failure, an empty projection, an empty filter result, and an
unrecognised response shape are presented as distinct states.

The monitor does not poll, stream, mutate, approve, retry, or execute work. It
does not infer a workflow, translate statuses, or become authoritative for any
request, decision, execution, or result fact. The bridge remains the owner of
the projection and every fact shown in it.

## Where it lives

| | |
|---|---|
| Route | `/admin/activity` |
| Source | `client/src/pages/admin-activity-monitor-page.tsx` |
| Data | Existing read-only `GET /api/admin/activity` |
| Navigation | `client/src/components/admin-banner.tsx` and the Admin Support Hub |
| Access | Existing authenticated route wrapper plus the page's existing Admin role pattern |

## Related

- [[adm-home]] — the Admin Support Hub
- [[dom-admin]] — the Admin domain

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-09-16._
