# Session: LHC1_Living_Home_Completion_Programme

| Field | Value |
|---|---|
| **Session ID** | `LHC1_Living_Home_Completion_Programme` |
| **Rollback ID** | `rollback/LIVING-HOME-COMPLETION-20260722` → `56628c7a` (annotated tag) |
| **Start time** | 2026-07-22T00:00:00Z UTC |
| **Current stage** | Complete — programme authored + one lawful fix shipped; committing/pushing; awaiting Home Owner walk-through |

## Objective
Complete the Living Home: govern and (lawfully) implement the remaining room identity,
atmosphere and hospitality across every THA room — Home, Cookbook, Larder, Planner, Shopping,
Nutrition, Diary, Household, Community/Orchard, Companion, Profile, Admin, Support Hub.

Motivated by `HOMEOWNER2_LIVING_HOME_REVIEW.md` (Apple-Design-Award-bar critique, 2026-07-22).
Objective is to **complete the house**, not redesign THA. Evolve the Environmental Dressing
architecture (`LIVINGHOME2`) into governing Living Home architecture where appropriate.

## Governing constraints (Architecture Bootstrap)
- One owner per fact (ARCH Principle 2); render owners' published state, never re-own (UIOWN1).
- The Home Owner exercises authority through governing documents, never around them (HOMEOWNER1):
  a change that contradicts a governing rule is an amendment proposal to that rule's owner.
- Environmental Dressing is DECLARED-NOT-BUILT (`LIVINGHOME2`); its § 10.2 owner amendments are
  named-and-not-made. No dressing ships until those amendments pass their own review.
- GEA3 (nothing designed to increase return frequency/urgency); GEA13 (no scoring/streaks);
  GEA11 (surplus space becomes air and view); GEA15 (silence default).

## Deliverables
- `docs/implementation/house/LIVING_HOME_COMPLETION_PROGRAMME.md` — governing completion programme +
  room-by-room completion report + roadmap + mandatory report sections.
- Lawful, owned implementation of approved changes only; larger moves recorded as owner decisions.

## Checkpoints
- [x] Read README; confirm git status; create rollback tag `rollback/LIVING-HOME-COMPLETION-20260722` → `56628c7a`.
- [x] Read `HOMEOWNER2_LIVING_HOME_REVIEW.md` (the motivating critique).
- [x] Gather: LIVINGHOME1/2 rules, current room-identity code map, prior room-programme reports.
- [x] Author `docs/implementation/house/LIVING_HOME_COMPLETION_PROGRAMME.md` (13 rooms × 11 dimensions;
      Environmental Dressing seated as the governing third layer; roadmap + 4 recorded owner decisions;
      8 mandatory report sections).
- [x] Implement lawful/owned change: `TrialBanner.tsx` — remove the ticking countdown from the calm
      arrival state (GEA3; HOMEOWNER2 #1), keep honest line + <2min warning + expiry redirect.
- [x] Verify: typecheck 88 pre-existing (0 client / 0 TrialBanner); build exit 0; adoption 100·0·9 (baseline).
- [x] Commit (`84892ecc`) + push to `origin/int1-intelligence-platform`; hash recorded here + dashboard.

**Last checkpoint:** Committed `84892ecc` and pushed to `origin/int1-intelligence-platform`.

## Next action
Home Owner to walk `/home`
on desktop (demo session) and confirm the arrival no longer opens with a ticking clock; review the
§3 room definitions and §7 owner decisions (A–D) — the four open owner decisions are the acceptance gate.

## Blockers
none — literal-image/dressing conflict handled via governance (declared-not-built, §10.2 amendments
named-not-made); all visual room-body increments staged for owner walk-through per standing discipline.
