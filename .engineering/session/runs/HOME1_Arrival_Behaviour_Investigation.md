
# Session: HOME1_Arrival_Behaviour_Investigation

| Field | Value |
|---|---|
| **Session ID** | `HOME1_Arrival_Behaviour_Investigation` |
| **Rollback ID** | `rollback/HOME1-arrival-behaviour-investigation-20260716` |
| **Start time** | 2026-07-16T10:40:07Z UTC |
| **Current stage** | Waiting for User |

## Objective
Investigate whether the THA Home room is an Arrival room containing an ambient Household Display rather than a dashboard. Investigation only — no implementation, no redesign, no new principles.

## Files being modified
- `docs/investigations/ux/HOME1_ARRIVAL_BEHAVIOUR_INVESTIGATION.md` — the deliverable (new, uncommitted)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

No other file touched. All seven governing Experience documents byte-untouched. No code modified.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`, STEP 2)
- [x] Governing Experience documents read (EXP ARCH, Blueprint, OHDB, EXPLANG, TRANSLATION1, OLB, UIA)
- [x] NORTH1, NORTH2, EXPCOMP1 read in full
- [x] Git status confirmed; rollback tag created → `7d1dd2ce`; session registered
- [x] Live Home + `/dashboard` mapped from code; "dashboard"/"arrival" naming audited product-wide
- [x] Hypothesis split into Arrival half (owned) / Display half (conflicts); 7 behavioural characteristics put through the NORTH2 ownership gate — 7/7 owned
- [x] Investigation delivered

**Last checkpoint:** Investigation delivered — `docs/investigations/ux/HOME1_ARRIVAL_BEHAVIOUR_INVESTIGATION.md`

## Next action
Await direction. Two decisions are open and both are the user's, not this session's:
1. **Home's missing door** (NORTH1 § 8.3, EXP ARCH Principle 4) — the fix HOME1 § 7.1 warns must be a *departure*, not a fourth card. Conformance work; needs no amendment.
2. **What `/dashboard` is** (HOME1 § 8.2) — a live household-reachable page with no row in the Blueprint § 5.1 map, whose only door is Home's footer link. Product + governance decision.

## Blockers
None. No amendment proposed, so nothing is gated on governance.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
