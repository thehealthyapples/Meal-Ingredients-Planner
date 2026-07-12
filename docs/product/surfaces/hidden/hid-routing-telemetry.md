---
entry: hid-routing-telemetry
name: Dormant intent-routing engine
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Dormant intent-routing engine

> A landing-router that once chose where to send a household after login;
> superseded by Home. Its correction-tracking hook still ships but is inert — the signal it keys on is never set, so it records nothing.

## What it is

There was once an intent-based landing router: after login it chose where to send
a household — planner, cookbook, analyser or shopping — and a telemetry hook
watched for the household quickly navigating away, posting a `routing_correction`
event so future routing could learn. Home now supersedes that: after login every
household is redirected to `/home` (`App.tsx#L103-L106`). The correction-tracking
hook is still wired into the router, but the landing-router that fed it is gone.

## Where it lives

| | |
|---|---|
| Correction tracker | `client/src/App.tsx#L56-L88` |
| Home-as-default redirect | `client/src/App.tsx#L103-L106` |

The tracker is invoked at `App.tsx#L196` (`useRoutingCorrectionTracker()` inside
`Router`).

## Why it is unreachable

The intent router that once chose a landing has been removed; only its telemetry
remains, and that telemetry can no longer fire. The tracker only posts a
`routing_correction` event when the household leaves a recorded *landing* within
15 seconds — but the module-local `_routingLanding` is only ever declared,
read, and reset to `null` (`App.tsx#L58, L70-L75`). Nothing sets it to a landing:
the `routeToPath` that used to populate it no longer exists in the codebase and
survives only in a comment (`App.tsx#L105`). So the guard
`if (!_routingLanding || prev === null) return;` returns early on every
navigation, and no event is ever sent.

## What it would take to reach it

Restore a landing assignment. For the telemetry to record anything again,
`_routingLanding` would have to be set when the router lands a household on a
page — i.e. the intent-routing decision (the retired `routeToPath`) would have to
be re-introduced ahead of Home's unconditional redirect. Absent that, the hook is
inert code and the deliberate action is removal.

## Substantiation gap

The record's `purpose` says the engine is "still silently recording correction
events." As implemented today it is **not** recording anything: the tracking hook
runs on every navigation, but its trigger — a populated `_routingLanding` — is
never set (`routeToPath` exists only in a comment), so the early-return fires
every time and no `routing_correction` is ever posted. The hook is present and
dormant, not active. This is a PKR17 disagreement between the record and the code
and is reported as a PDA1 finding.

## Related

- [[page-home]] — the default landing that superseded intent routing

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
