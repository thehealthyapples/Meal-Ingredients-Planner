# EXP4 — Materiality & Depth (three material studies)

**Session ID:** `EXP4_Materiality_And_Depth`
**Rollback identifier:** `rollback/EXP4-materiality-and-depth-20260715` → `b3c650cd`
**Stage:** Waiting for User
**Started:** 2026-07-15

> **Working tree was dirty at tag time** (other sessions' work — see the opening
> `git status`). The tag covers **committed state only**, deliberately without a
> stash so other sessions' uncommitted work is undisturbed. This workstream's
> files are all NEW except `client/src/App.tsx` (already dirty from ARRIVAL1 +
> EXP2 + EXP3 dev routes; this session adds three more beside them).

## Mission

**Development-only design prototype.** Discover how THA should occupy visual
space — depth, hierarchy and warmth without visual noise. Do not modify
production, workflows, navigation, or functionality.

Explore: visual layers (environment · shell · workspace · primary cards ·
secondary cards · floating elements · Companion) · materiality (warm, soft,
crafted, tactile, welcoming — no gloss, no artificial glassmorphism) · light as
hierarchy (not decoration) · card hierarchy (primary / supporting / quiet) ·
breathing space · micro-interaction (hover, press, focus, elevation — physical,
not animated) · Home as "a beautifully prepared kitchen", not "a dashboard".

Deliver THREE material studies, each desktop + mobile + screenshots + short
recording + rationale + strengths + weaknesses + recommendation:

- **Study A — Warm layered workspace** (`/dev/material-a-warm-layers`)
- **Study B — Natural depth and atmosphere** (`/dev/material-b-atmosphere`)
- **Study C — Minimal premium restraint** (`/dev/material-c-restraint`)

## Plan

1. Rollback tag + run file. ✅
2. Three study pages reusing `exp2-shared.tsx` data hook (byte-unchanged) +
   three DEV-only routes in `App.tsx` (compile-time ternary).
3. Capture script `scripts/capture-exp4-materiality-depth.ts` → desktop +
   mobile stills, micro-interaction recordings + GIFs →
   `docs/ui-audit/exp4-materiality-depth/`.
4. Report `docs/implementation/ux/EXP4_MATERIALITY_AND_DEPTH.md` — rationale,
   strengths, weaknesses, recommendation per study.
5. Verify: typecheck, build (studies absent from `dist/`), `adoption:check`.

## Progress

- ✅ Rollback tag `rollback/EXP4-materiality-and-depth-20260715` → `b3c650cd`.
- ✅ Governing docs read (README, Experience Architecture, UI Architecture,
  Experience Language incl. § 3A + § 4A, EXP2 + EXP3 reports).
- ✅ **Study A — Warm layered workspace** (`/dev/material-a-warm-layers`):
  seven named layers; the GROUND PLANE (the workspace as a prepared counter)
  as the structural discovery; warm room-hued shadows describing distance;
  rim-of-light on the primary; hover LIFTS / press SETTLES / canonical focus.
- ✅ **Study B — Natural depth and atmosphere** (`/dev/material-b-atmosphere`):
  ONE morning light (upper-left, still, never moving); primary stands in the
  light, supporting surfaces in penumbra, quiet in shade; every shadow one
  direction; hover brings a surface INTO the light, press holds it down.
- ✅ **Study C — Minimal premium restraint** (`/dev/material-c-restraint`):
  one object in a room — the only card on the page; support as ink rows
  (found the material floor: support needs an anchor, naked ink is below it);
  spacing one full step more generous; canonical hover-elevate throughout.
  Doubles as the flat-law CONTROL for A/B.
- ✅ Same room in all three (orientation → state sentence → primary →
  shopping/plants → reminder → way deeper) via exp2-shared's `useHomeData`
  (byte-unchanged, imports only) — the ONLY variable is the material.
- ✅ Routes registered in `App.tsx` (compile-time DEV ternary). Smoke test:
  all three mount, shell + FAB present, zero console errors.
- ✅ Captures `scripts/capture-exp4-materiality-depth.ts` (zero-write,
  dev-world household): desktop 1440×900 + mobile 390×844 — composed stills,
  hover/press/real-Tab-focus stills, close-up element shots of primary +
  support, micro-interaction recordings + GIFs, live-Home controls →
  `docs/ui-audit/exp4-materiality-depth/` (21 MB). Verified by observation
  (A: layers + lift read; B: hovered card at daylight beside penumbral
  neighbour; C: overlay press + the support-tier undershoot finding).
- ✅ Typecheck: 0 errors in EXP4 files. Build passes; `dist/` contains no EXP4
  chunk and none of its strings. `adoption:record` re-dated the moved `dark:`
  count; `adoption:check`: 64 passed · 0 notices · 2 failed — both the
  pre-existing baseline (`HouseholdNutritionPanel.tsx` orphan; 539th raw
  button, other sessions' untracked files); EXP4 adds 0 raw buttons, 0 orphans.
- ✅ Report `docs/implementation/ux/EXP4_MATERIALITY_AND_DEPTH.md` — rationale,
  strengths, weaknesses, recommendation per study; § 5 synthesis (ten
  carry-forward ideas + three structural findings; recommended follow-on shape
  **A's ground + B's light + C's air**); § 6 governance posture (incl. the
  UIA § 4 flat-surface law: knowingly explored dev-only, graduation requires a
  governed amendment); § 7 binary disposition.

## Definition of Done

- Three dev-only study routes (`import.meta.env.DEV` only). ✅
- Desktop + mobile screenshots per study. ✅
- Short recordings (micro-interactions) per study. ✅
- Report with rationale / strengths / weaknesses / recommendation per study. ✅
- Live Home, shell, navigation, Companion, ARRIVAL1, EXP2, EXP3 untouched. ✅

## Next action

None from this session — the three studies are delivered. Review each route
(desktop + mobile), the stills and micro-interaction recordings under
`docs/ui-audit/exp4-materiality-depth/`, and the report's § 5 synthesis. Then
decide: GRADUATE the selected ideas (follow-on workstream folds them into the
canonical visual language — including the governed UIA § 4 amendment any
depth idea requires — and DELETES the three studies + capture script in the
same change) or REJECT (same deletion, no graduation).
