# Session: COMM2_Orchard_Experience

| Field | Value |
|---|---|
| **Session ID** | `COMM2_Orchard_Experience` |
| **Rollback ID** | `rollback/COMM2-orchard-experience-20260719` → `993e1bc8e61a11c245cd35bcb40b5daae39e113f` |
| **Start time** | 2026-07-19T18:05:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Build the Orchard Experience on the COMM1 Community Foundation: households
experience Community as a *place* rather than a social network. Delivered as
ONE room (owner ruling) — the Orchard overview, Neighbourhoods, the Village
and the High Street are the experience inside it, not separate destinations.

## Rollback coverage caveat
Tag resolves to `993e1bc8`. The working tree was **dirty at tag time** — five
tracked files modified by prior sessions (`.engineering/session/CURRENT.md`,
four `data/ws*-report.json`). The tag covers **none** of them. Snapshotted to
`scratchpad/pre-COMM2-snapshot/uncommitted-tracked.patch` (57 lines). Not
authored, touched or committed by this session.

Unlike COMM1, this tag **separates cleanly** — COMM1 is committed
(`be562c94`), so a rollback discards only COMM2. **No migration was applied**;
`git checkout` fully undoes this workstream.

## Checkpoints
- [x] Git status confirmed; rollback tag created and reported
- [x] COMM1 foundation, client architecture, Companion wiring and governing
      design law investigated before any edit
- [x] **STOPPED before implementation** — the brief collided with four
      governing rules; taken to the owner, who ruled: one canonical room
- [x] Blueprint § 5.1 amended (governed) — the Orchard admitted as ONE room
- [x] Community promoted `platform` → room; the three lists moved together
- [x] The room built — zero new server surface, zero migrations
- [x] COMM1's scope lock updated deliberately and loudly, not deleted
- [x] 69 source assertions + **22 DB-backed two-household** assertions
- [x] **COMM1 § 11.1 closed** — the runtime isolation test now exists
- [x] Manual browser verification, all states, real session
- [x] Regression found by looking at screenshots (nav at 9 items) — mitigated,
      reported, left open for an owner decision
- [x] tsc baseline restored exactly (88); adoption + coherence byte-identical
- [x] Implementation report

**Last checkpoint:** Implementation report written

## Next action
Await owner review of `docs/implementation/community/COMM2_ORCHARD_EXPERIENCE.md`.
Nothing is committed.

**Three things a reviewer must know:**
1. **Nobody can invite anybody.** `inviteHousehold` needs a numeric household
   id no household can discover (COMM1's probe resistance). The Orchard is
   therefore a room almost every household will find empty, and joining is
   reachable only by SQL. This is the blocking follow-on (report § 11.1).
2. **The bottom nav is visibly tighter for every room** (report § 9.4). Nine
   rooms do not fit a 390px viewport at a 44px touch target; the row now
   scrolls rather than clips, but the shell is a shared surface and this is a
   product decision left open, with three options in § 11.4.
3. **LAUNCH1's debt was called here.** COMM1 deferred the unresolved
   recommendation-against to "whoever builds the first capability that crosses
   the boundary"; COMM2 is it. The judgement taken — the risk begins at
   user-generated content, and this room has none — is recorded, not settled.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
