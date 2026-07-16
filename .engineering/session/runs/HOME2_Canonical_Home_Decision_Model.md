
# Session: HOME2_Canonical_Home_Decision_Model

| Field | Value |
|---|---|
| **Session ID** | `HOME2_Canonical_Home_Decision_Model` |
| **Rollback ID** | `rollback/HOME2-canonical-home-decision-model-20260716` |
| **Start time** | 2026-07-16T11:06:15Z UTC |
| **Current stage** | Waiting for User |

## Objective
Design the canonical decision model determining Home's single primary action (the one door). Investigation only — no implementation, no redesign, no new principles, no duplicate decision engines.

## Files being modified
- `docs/investigations/ux/HOME2_CANONICAL_HOME_DECISION_MODEL.md` — the deliverable (new, uncommitted)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

No other file touched. All governing Experience + Intelligence documents byte-untouched. No code modified.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`, STEP 2)
- [x] Governing Experience docs + HOME1 + EXPCOMP1 read
- [x] Intelligence Governance read: DEC1 (Decision Engine), INT20 (Notice), INT21 (Behaviour), OBS1 (Observation), TIP1 (Platform), SoT Register, Architecture Principles, CPuBA1
- [x] Git status confirmed; rollback tag created → `7d1dd2ce`; session registered
- [x] Duplicate-engine hazard settled FIRST against DEC1's own text (§ 2) — the door is a total *resolver*, not a Decision or a Selection; peer on the Silence Rules' precedent (DEC1 § 6)
- [x] Input audit against code + SoT Register — **6 of the mission's 10 named inputs do not exist**
- [x] Model designed against facts THA actually owns; 4-tier ladder + unconditional floor
- [x] Investigation delivered

**Last checkpoint:** Investigation delivered — `docs/investigations/ux/HOME2_CANONICAL_HOME_DECISION_MODEL.md`

## Next action
Await direction. Open items, none blocking, all the user's:
1. **Build the resolver** (HOME2 § 9) — closes NORTH1 § 8.3 (Home has no primary action), a conformance defect against Experience Principle 4. Needs no amendment, no new fact, no schema change, no new service. Buildable today.
2. **The NTC-P2 decision** (§ 8.2) — where the resolver is called from must be decided *with* the `/api/home/intelligence` convergence debt in view, not around it.
3. **The time gap** (§ 8.1) — `TRANSLATION1` *Morning Rhythm* § 8 is law and is currently unimplementable. Needs a household clock **and** a planner→calendar anchor; the latter is the real blocker. Schema change under Register Rule 8. Model is total without it.
4. **Reported, not fixed:** `buildHouseholdHistory` fabricates dates (`routes.ts:11370`) — a live Core Principle 6 defect that exists only because of gap 3. Pantry has no SoT domain, and two docs mis-cite D8–D11 for it (§ 8.3).

## Blockers
None. No amendment proposed; nothing gated on governance.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
