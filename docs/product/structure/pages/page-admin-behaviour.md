---
entry: page-admin-behaviour
name: Admin — Behaviour Workbench
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/behaviour
last_verified: 2026-07-11
version: 1
---

# Admin — Behaviour Workbench

> Replay the full step-by-step execution of a single Companion conversation.

## What it is

The page at `/admin/behaviour`. It offers two read-only views over the
Observation Engine store: Behaviour, which shows what the Companion's voice
decided across a window — the behaviour selected, the personality applied,
outcome, provenance confidence, effectiveness and overrides — and Execution
Timeline, which reconstructs the complete execution path of one interaction,
including that turn's sealed behaviour decision and the engine's own reasoning.
Nothing here writes. The user's request text is honestly shown as "not recorded"
where the Observation Engine keeps only shapes and timings, never utterance
content.

## Where it lives

| | |
|---|---|
| Route | `/admin/behaviour` |
| Source | `client/src/pages/admin-behaviour-workbench-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-behaviour]] — the Behaviour Workbench capability this surface provides

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
