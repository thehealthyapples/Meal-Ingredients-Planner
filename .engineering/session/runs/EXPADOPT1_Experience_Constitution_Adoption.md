# Session: EXPADOPT1_Experience_Constitution_Adoption

| Field | Value |
|---|---|
| **Session ID** | `EXPADOPT1_Experience_Constitution_Adoption` |
| **Rollback ID** | `rollback/expadopt1-experience-constitution-adoption-20260720` → `b0cfffc8` |
| **Start time** | 2026-07-20T07:10:00Z UTC |
| **Current stage** | Complete — committed (`ea9b5e2f`), pushed; awaiting owner review |

## Objective
Adopt the Experience Constitution (`GOVERNING_EXPERIENCE_ARCHITECTURE.md`) into the live
product. Visible architectural adoption only — no new functionality, no business logic,
no permissions, no routes, no canonical ownership, no AI architecture.

## Scope (owner's seven priorities → EXPGOV1 findings)
1. The House — shell composition, thresholds, orchard as the visual beginning → I1, I4(partial)
2. The Orchard — adopt E0–E3, exposure/depth token VALUES (Blueprint § 18 open item 5) → I2
3. Room identity — ground plane per room, existing language only → I1
4. Identity — logo as architecture (embossed/stencil/carved); retain canonical mark → C5
5. Colour — adopt orchard palette, retire legacy platform colour authorities → C2
6. Space — GEA11 on large displays → C3
7. Atmosphere — light, material, warmth, shadow, silence, craft → I1/I3 (visual only)

## Explicitly OUT of scope (owner instruction)
- Companion convergence (C1) — unless required for constitutional compliance
- Business logic, permissions, routes, canonical ownership, AI architecture
- C4 streak retirement (touches API call sites) — report as remaining gap
- I4 `/dashboard` ruling (route decision) — report as remaining gap

## Files being modified
- `client/src/components/layout/orchard-backdrop.tsx` — retired dead `OrchardOpenView`
  (+3 masks, 176 lines, 0 consumers); added `OrchardRoomWindow` (the first consumer of
  `--orchard-exposure-e2`)
- `client/src/components/layout/app-shell.tsx` — `ROOM_EXPOSURE` map (projection of
  Blueprint § 5.1); mounts the E2 window once, in flow, inside `main`
- `client/src/index.css` — added `[data-realm="orchard"]` light + dark; named this file
  the canonical owner of a realm's hue
- `client/src/components/nav-bar.tsx` — Pantry hue 115 → 118, corrected to the token
- `client/src/pages/meals-page.tsx` (7 sites), `meal-detail-page.tsx` (1) — GEA11 caps
- `client/src/assets/icons/` — deleted 2 orphaned assets (2.68 MB)
- `scripts/capture-expadopt1-adoption.ts`, `docs/ui-audit/expadopt1-adoption/` — evidence

## Checkpoints
- [x] Rollback tag created; tree clean at tag time (`b0cfffc8`)
- [x] Required reading complete — README, Constitution, all 7 Experience Architecture owners
- [x] EXPGOV1 gap analysis read (5 Critical / 6 Important / 5 Enhancement)
- [x] Codebase visible-layer audit complete
- [x] Implementation — P2, P5, P6 substantially; P1/P3/P4/P7 partially
- [x] Before/after screenshots — 32 captures, 8 rooms × 2 widths × 2 states
- [x] Gates: adoption 99·0·9 = byte-identical baseline; client typecheck clean; build clean
- [x] Report written — `docs/implementation/EXPADOPT1_EXPERIENCE_CONSTITUTION_ADOPTION.md`
- [x] Committed (`ea9b5e2f`) and pushed to `origin/int1-intelligence-platform`

**Last checkpoint:** after-capture verified by eye; the `absolute` → in-flow correction
(type was sitting on the orchard, Blueprint § 6.1) was caught by the screenshot, not by
the probe, and is recorded in `orchard-backdrop.tsx`'s header.

## Next action
Owner to review `docs/implementation/EXPADOPT1_EXPERIENCE_CONSTITUTION_ADOPTION.md` § 5
(remaining gaps) and § 3 Priority 6 (the grid cap is a recorded JUDGEMENT — capped at
xl:grid-cols-4 rather than frozen at lg:grid-cols-3; overrule with eyes open if wanted).
Two rulings are wanted and were deliberately not taken here: which of the two orchard
assets is the one orchard (§ 6.1), and the `docs/implementation/` filing precedent
(EXPGOV1 § E5). Cheapest next workstream is C4's streak retirement — unrendered, so
removal is user-invisible.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
