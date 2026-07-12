---
entry: adm-behaviour
name: Behaviour Workbench
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Behaviour Workbench

> Reconstruct one Companion interaction end to end, to see exactly why it answered
> as it did.

## What it is

The capability, available to admins, to reconstruct a single Companion
interaction from Observation Engine telemetry. It has two read-only views:
Behaviour, showing what the Companion's voice decided across a window (behaviour
selected, personality applied, outcome, provenance confidence, effectiveness,
overrides), and Execution Timeline, which lays out the full execution path of one
interaction together with that turn's sealed behaviour decision and the engine's
own reasoning. Nothing writes; where the utterance was not recorded it is shown
honestly as "not recorded", because the Observation Engine keeps shapes and
timings, not content.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-behaviour-workbench-page.tsx` |

## Related

- [[page-admin-behaviour]] — the page this capability is reached at

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
