# Session: REBUILD1_Room_Rebuild_Programme

| Field | Value |
|---|---|
| **Session ID** | `REBUILD1_Room_Rebuild_Programme` |
| **Rollback ID** | `rollback/REBUILD1-room-rebuild-programme-20260722` → annotated tag `b17819b0`, target commit `6799bf84` |
| **Start time** | 2026-07-22T18:24:10Z UTC |
| **Current stage** | Rollback Complete → Implementation |

## Objective
Rebuild every core THA room from first principles per the Craftsmanship Constitution (`CRAFT1`):
architecture-first design, existing code judged only *afterwards* (kept only where it strengthens
the designed room), each room held to the Quality Standard — *"Would the Home Owner happily spend
time here?"*. Presentation/interaction/layout/flow/craft only; business logic, permissions, APIs,
intelligence and canonical ownership are preserved unless the governing architecture requires a change.

## Method (CRAFT1 §7, mandatory order, per room)
1. Read governing architecture + the room's North Star (as if the room had never been built).
2. Design the room from that architecture (answer the Experience Test's three questions).
3. Only afterwards judge existing code — keep what strengthens the designed room, remove/rebuild the rest.
4. Verify (typecheck/build + manual review) and hold to the Quality Standard before moving on.
5. One implementation report per room under `docs/implementation/rebuild/`.

## Room map (route → page → North Star owner)
- Welcome Home — `/home` → `home-experience-page.tsx` — HOMEOWNER1 · HOMEROOM1 · LH1–3 · Living Home
- Kitchen / Cookbook — `/cookbook`,`/meals` → `meals-page.tsx` — COOKBOOK1 · meals capability
- Larder — `/pantry` → `pantry-page.tsx` — LARDER1 North Star
- Planner — `/planner` → `weekly-planner-page.tsx` — PLANNER1 continuous timeline
- Shopping — `/shopping-workspace` → `shopping-workspace-page.tsx` — SHOP2/3
- Nutrition — `/nutrition` → `plant-diversity-page.tsx` — UIOWN1 (owns nothing as a room)
- Diary — `/diary` → `food-diary-page.tsx`
- Companion — integrated (conversation / intelligence components)
- Profile — `/profile` → `profile-page.tsx`
- Community — `/orchard` → `orchard-page.tsx` — COMM1/2
- Partners — `/supermarkets` → `supermarkets-page.tsx`
- Support — `/help-centre`,`/contact` → `help-centre-page.tsx`,`contact-page.tsx`
- Administration — `/admin/*`

## Checkpoints
- [x] Rollback protection verified (annotated tag → 6799bf84)
- [x] Session registered; mandatory anchor docs read (README canon, CRAFT1)
- [x] Room 1 — Welcome Home: design brief + gap audit → refined → verified → reported → committed
      - Removed decorative PlantRing (GEA13 residue / CRAFT1 §5–6); softened "Today at a glance"→"Today"
        (EXPLANG §4A-G); converged 2 raw hairline HSLs onto one room-scoped token `--home-hairline`.
      - Verified: 0 client TS errors; 0 new adoption failures (stash/compare); net -17 lines.
      - Owner-gated gaps left to their owners with reasons: `/dashboard` retirement (Home Owner decision),
        device clock (Household Time / CONV1 debt), greeting + action labels (INT21 / CP3).
      - Report: docs/implementation/rebuild/REBUILD1_ROOM01_WELCOME_HOME.md
- [ ] Room 2 — Larder (`/pantry` → pantry-page.tsx) against LARDER1 North Star

**Last checkpoint:** Room 1 (Welcome Home) refined, verified, reported. Outstanding for Room 1:
live visual review (env limitation) + `/dashboard` Home-Owner decision (both documented in report §7/§8).

## Next action
Room 2 (Larder): architecture-first design brief + gap audit of `pantry-page.tsx` against the
LARDER1 North Star, then refine what falls short; verify; report; commit.

## Blockers
none — scope is large (13 rooms); programme is paced room-by-room and kept resumable via this file.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
