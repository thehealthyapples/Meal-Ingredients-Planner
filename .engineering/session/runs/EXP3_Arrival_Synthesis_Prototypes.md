# EXP3 — Arrival Synthesis Prototypes (two candidates)

**Session ID:** `EXP3_Arrival_Synthesis_Prototypes`
**Rollback identifier:** `rollback/EXP3-arrival-synthesis-prototypes-20260715` → `da368a39`
**Stage:** Waiting for User
**Started:** 2026-07-15

> **Working tree was dirty at tag time** (other sessions' work — see the opening
> `git status`). The tag covers **committed state only**, deliberately without a
> stash so other sessions' uncommitted work is undisturbed. This workstream's
> files are all NEW except `client/src/App.tsx` (already dirty from ARRIVAL1 +
> EXP2 dev routes; this session adds two more beside them) and the adoption
> register (the `signature-typography` row extended once more).

## Mission

**Not more independent experiments.** Create TWO synthesis prototypes that
intentionally combine the strongest EXP2 discoveries into candidate THA Arrival
Experiences — the final exploration before selecting ONE canonical arrival.

- **S1 — Quiet Arrival** (`/dev/arrival-s1-quiet`) — the calmest possible
  premium arrival: A's human greeting · B's shell-visible-from-frame-one ·
  C's reassurance ("Today is planned.") · D's Companion-arrives-after-you ·
  E's restraint. Nothing attracts attention; the user simply feels welcomed.
- **S2 — Walking Home** (`/dev/arrival-s2-walking-home`) — one additional idea:
  gently walking into the orchard before reaching Home. Subtle depth,
  perspective, warm morning light, glimpses between apple trees. The orchard
  never performs: no parallax, no moving trees, no scroll-jacking, no theatre.

Both preserve the canonical shell, header, navigation, Companion, and
architecture ownership. Development-only. Live Home, ARRIVAL1 (`/dev/arrival`)
and the five EXP2 prototypes untouched.

## Plan

1. Rollback tag + run file. ✅
2. Two prototype pages reusing `exp2-shared.tsx` (same data hook, arrival gate,
   parity workspace) + two DEV-only routes in `App.tsx` (compile-time ternary).
3. Adoption register: extend `signature-typography` (S1 speaks the signature
   voice for its greeting; dev-only, same binary disposition).
4. Capture script `scripts/capture-exp3-arrival-synthesis.ts` → desktop +
   mobile stills, recordings + GIFs → `docs/ui-audit/exp3-arrival-synthesis/`.
5. Report `docs/implementation/ux/EXP3_ARRIVAL_SYNTHESIS_PROTOTYPES.md` — design
   decisions per prototype + recommendation on which ideas graduate into the
   final Arrival Experience.
6. Verify: typecheck, build (prototypes absent from `dist/`), `adoption:check`.

## Progress

- ✅ Rollback tag `rollback/EXP3-arrival-synthesis-prototypes-20260715` → `da368a39`.
- ✅ Governing docs read (README, Experience Architecture, UI Architecture,
  Experience Language incl. § 4A, EXP2 report incl. § 7 carry-forward).
- ✅ **S1 — Quiet Arrival** (`/dev/arrival-s1-quiet`): shell visible from frame
  one (B) · time-of-day greeting in the hand, held ~2s — HALF of A's pause, per
  EXP2 § 7 idea 5 — receding by one crossfade (A) · state sentence as the
  room's first line (C) · Companion a beat after the person (D) · nothing else
  (E). Two beats, ~4.6s to rest, then permanent stillness.
- ✅ **S2 — Walking Home** (`/dev/arrival-s2-walking-home`): walking into the
  orchard on STILL planes — near canopy shade + blurred tree glimpses at the
  edges (depth by composition) dissolving exactly once, nearest first (movement
  by passage), B's one morning-light wash, B's one-piece furnish, D's Companion
  manners. No parallax, no moving trees, no scroll-jacking, no theatre — the
  orchard never performs. ~3.7s to rest.
- ✅ Routes registered in `App.tsx` (compile-time DEV ternary). EXP2's
  `exp2-shared.tsx` reused **byte-unchanged**; all five EXP2 prototypes untouched.
- ✅ Smoke test: both mount, arrival=full, zero console errors, FAB present.
- ✅ Captures `scripts/capture-exp3-arrival-synthesis.ts` (zero-write,
  dev-world household): desktop 1440×900 + mobile 390×844 stills per moment,
  reduced-motion stills (finished workspace, NO arrival), full recordings +
  GIFs, live-Home controls → `docs/ui-audit/exp3-arrival-synthesis/` (23 MB).
  Verified by observation, incl. one refinement pass (S2's near planes
  strengthened so the beneath-the-trees beat reads on both viewports).
- ✅ Adoption register: `signature-typography` row extended (permitted surfaces
  now exactly three, all dev-only: ARRIVAL1 + EXP2 A + EXP3 S1; same binary
  disposition). `adoption:record` regenerated md. `adoption:check`: 64 passed ·
  0 notices · 2 failed — both the pre-existing baseline (`HouseholdNutritionPanel.tsx`
  orphan; 539th raw button, other sessions' untracked files); EXP3 adds 0 raw
  buttons, 0 orphans.
- ✅ Typecheck: 0 errors in EXP3 files. Build passes; `dist/` contains no EXP3
  chunk and none of its strings.
- ✅ Report `docs/implementation/ux/EXP3_ARRIVAL_SYNTHESIS_PROTOTYPES.md` —
  design decisions per candidate, governance posture, § 5 recommendation
  (**adopt S1 as the canonical arrival shape; graduate S2's finding, not its
  planes**), § 6 binary disposition.

## Definition of Done

- **Two prototype routes:** `/dev/arrival-s1-quiet`, `/dev/arrival-s2-walking-home`
  (`import.meta.env.DEV` only). ✅
- **Desktop + mobile screenshots:** `docs/ui-audit/exp3-arrival-synthesis/s{1,2}-*-{desktop,mobile}-*.png`. ✅
- **Short recordings:** `.../video/s{1,2}-*-{desktop,mobile}.{webm,gif}`. ✅
- **Explanation of design decisions:** report §§ 2–3. ✅
- **Recommendation on which ideas graduate:** report § 5. ✅

## Next action

None from this session — the synthesis is delivered and this was expected to be
the FINAL exploration. It awaits the selection: review both candidates (each
replayable via `?replay`), the recordings, and the report's § 5 recommendation
(**S1 — Quiet Arrival — as the canonical arrival shape**), then decide. The
follow-on workstream folds the graduated ideas into the ONE adopted arrival and
DELETES every exploration prototype (EXP2's five + `exp2-shared.tsx` + EXP3's
two + both capture scripts) in the same change.
