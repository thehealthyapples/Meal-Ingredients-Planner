# EXP2 — Arrival Experience Exploration (five prototypes)

**Session ID:** `EXP2_Arrival_Experience_Exploration`
**Rollback identifier:** `rollback/EXP2-arrival-exploration-20260715` → `74aaa8da`
**Stage:** In Progress
**Started:** 2026-07-15

> **Working tree was dirty at tag time** (other sessions' work — see the opening
> `git status`). The tag covers **committed state only**, deliberately without a
> stash so other sessions' uncommitted work is undisturbed. This workstream's files
> are all NEW except `client/src/App.tsx` (already dirty from ARRIVAL1's dev route;
> this session only adds five more dev-only routes beside it) and the adoption
> register (one row extended).

## Mission

Create **five distinct development-only Arrival Experience prototypes**, each a
genuinely different interpretation of the THA Experience Language — not five
cosmetic variations. All five preserve the canonical shell, header, navigation and
Companion; only the emotional experience of arriving changes. The live Home
(`/home`) and the existing ARRIVAL1 prototype (`/dev/arrival`) are untouched.

- **A — The Welcome** (`/dev/arrival-a-welcome`) — the emotional greeting: handwriting, timing, breathing space, the pause.
- **B — The Orchard** (`/dev/arrival-b-orchard`) — entering a place: environment, light, atmosphere, settling into the room.
- **C — The Workspace** (`/dev/arrival-c-workspace`) — the prepared kitchen: hierarchy, composed reveal, information ordering, breathing.
- **D — Quiet Intelligence** (`/dev/arrival-d-quiet`) — intelligence as preparation: no theatre, one quiet observation, the Companion settling in late.
- **E — Premium Restraint** (`/dev/arrival-e-restraint`) — how little: whitespace, typography, one fade, radical subtraction.

## Plan

1. Rollback tag + run file. ✅
2. Shared dev-only helpers `client/src/pages/dev/exp2-shared.tsx` (same query keys
   as live Home; arrival gate; scene sizing; parity workspace).
3. Five prototype pages + five DEV-only routes in `App.tsx` (ARRIVAL1's
   compile-time ternary pattern, so nothing ships in the production bundle).
4. Adoption register: extend the `signature-typography` row (prototype A speaks the
   signature voice; dev-only, same binary disposition as ARRIVAL1).
5. Capture script `scripts/capture-exp2-arrival-explorations.ts` → desktop + mobile
   screenshots, recordings + GIFs per prototype → `docs/ui-audit/exp2-arrival-explorations/`.
6. Report `docs/implementation/ux/EXP2_ARRIVAL_EXPERIENCE_EXPLORATION.md` — per
   prototype: route, captures, emotional objective, strengths, weaknesses, what to
   carry forward.
7. Verify: typecheck, build (prototypes absent from `dist/`), `adoption:check`.

## Progress

- ✅ Rollback tag `rollback/EXP2-arrival-exploration-20260715` → `74aaa8da`.
- ✅ Governing docs read (README, Experience Architecture, UI Architecture,
  Experience Language incl. § 4A Place Principles).
- ✅ Shared dev-only infrastructure `client/src/pages/dev/exp2-shared.tsx`
  (same query keys as live Home; per-prototype arrival gate with reduced-motion
  guarantee + `?replay`; ARRIVAL1-parity workspace from canonical owners only).
- ✅ Five prototypes built + routed (DEV-only compile-time ternary in `App.tsx`):
  - **A** `/dev/arrival-a-welcome` — time-of-day greeting in the signature hand,
    long held pause, slow crossfade give-way. Settled ~7.6s.
  - **B** `/dev/arrival-b-orchard` — shell visible from frame one, one warm
    morning-light wash settling to daylight, workspace furnishes as ONE piece. ~3.4s.
  - **C** `/dev/arrival-c-workspace` — strict hierarchy: honest state sentence
    ("Today is planned."), one primary card, support DEMOTED to quiet rows,
    two-beat composed reveal. ~2.2s.
  - **D** `/dev/arrival-d-quiet` — no choreography; Notice Engine sentence as a
    "note on the counter"; Companion arrives a beat AFTER the person (~1.5s).
  - **E** `/dev/arrival-e-restraint` — one 0.9s fade, one card, typography as
    the welcome, deliberate overshoot of the subtraction floor.
- ✅ Smoke test: all five mount, arrival=full, zero console errors.
- ✅ Captures `scripts/capture-exp2-arrival-explorations.ts` (zero-write,
  dev-world household): desktop 1440×900 + mobile 390×844 stills per moment,
  reduced-motion stills, full recordings + GIFs (ffmpeg two-pass palette),
  live-Home controls → `docs/ui-audit/exp2-arrival-explorations/` (33 MB).
  Verified by observation: A greeting held on pure cream; B orchard + shell from
  frame one under warm wash; C state sentence + demoted rows; D note + FAB
  arrived; E one-card composition; reduced-motion = finished workspace, no arrival.
- ✅ Adoption register: `signature-typography` row extended (permitted surfaces
  now exactly two, both dev-only: ARRIVAL1 + EXP2 Prototype A; shared binary
  disposition). `adoption:record` regenerated md. `adoption:check`:
  64 passed · 0 notices · 2 failed — both the pre-existing baseline
  (`HouseholdNutritionPanel.tsx` orphan; 539th raw button, other sessions'
  untracked files); EXP2 adds 0 raw buttons, 0 orphans.
- ✅ Typecheck: 0 errors in EXP2 files. Build passes; `dist/` contains no EXP2
  chunk and none of the prototypes' strings ("Good morning/afternoon" hits in
  dist belong to the live Dashboard's own pre-existing greeting).
- ✅ Report `docs/implementation/ux/EXP2_ARRIVAL_EXPERIENCE_EXPLORATION.md` —
  per prototype: route, evidence, emotional objective, strengths, weaknesses,
  carry-forward; § 7 synthesis (10 carry-forward ideas + 2 structural findings);
  § 9 binary disposition (GRADUATE ideas + delete all prototypes, or REJECT + delete).

## Definition of Done

- **Routes:** `/dev/arrival-{a-welcome,b-orchard,c-workspace,d-quiet,e-restraint}`
  (`import.meta.env.DEV` only). ✅
- **Desktop + mobile screenshots per prototype:**
  `docs/ui-audit/exp2-arrival-explorations/{a..e}-*-{desktop,mobile}-*.png`. ✅
- **Recording/GIF per prototype:** `.../video/{a..e}-*-{desktop,mobile}.{webm,gif}`. ✅
- **Report with objective/strengths/weaknesses/recommendation per prototype.** ✅

## Next action

None from this session — the exploration is delivered. It awaits a **look**:
review the five prototypes (each replayable via `?replay`), the recordings, and
the report's § 7 synthesis, then choose which ideas GRADUATE into the one
adopted arrival (follow-on workstream folds them in and DELETES all five
prototypes + `exp2-shared.tsx` + the capture script in the same change).
