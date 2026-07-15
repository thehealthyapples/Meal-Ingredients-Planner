# ARRIVAL1 — Arrival Experience Prototype

**Session ID:** `ARRIVAL1_Arrival_Experience_Prototype`
**Rollback identifier:** `rollback/ARRIVAL1-arrival-experience-prototype-20260715` → `3176c62d`
**Stage:** Waiting for User (prototype delivered; awaiting ADOPT / REJECT)
**Started:** 2026-07-15

> **Working tree was dirty at tag time** (server-side work by other sessions, plus
> many untracked files — see the opening `git status`). The tag covers **committed
> state only** and was deliberately NOT accompanied by a stash, so other sessions'
> uncommitted work is undisturbed. This workstream's files are all NEW or narrowly
> scoped, and it touches none of the pre-existing dirty files except the shared
> dev-route/companion/CSS infrastructure it inherits from UXHOME1.

## Mission

Discard the previous Home *signature arrival* prototype (UXHOME1, which animated the
Home page in place) and build a **development-only Arrival Experience** instead: the
user gently arrives — calm cream, a handwritten "Welcome home, <name>", the orchard
emerging, the standard THA header, then a single natural downward glide into a calm,
one-viewport Home workspace. Experience prototype only. The live Home is untouched.

## Plan

1. Rollback + run file. ✅
2. Discard UXHOME1 prototype artefacts: delete `home-arrival-prototype.tsx`, its route,
   its capture script, and its report. KEEP the reusable infrastructure it introduced
   (companion `withheld` channel, `--font-signature` token / `.text-signature` /
   `.signature-ink`, the UIA §8 amendment) — the new Arrival Experience reuses it.
3. Build `client/src/pages/dev/arrival-experience.tsx` + `/dev/arrival` route.
4. Capture script → desktop + mobile screenshots + recording/GIF.
5. Report `docs/implementation/ux/UX_ARRIVAL_EXPERIENCE_PROTOTYPE.md`; adoption register.
6. Verify typecheck + build (prototype absent from prod bundle).

## Progress

- ✅ Rollback tag `rollback/ARRIVAL1-arrival-experience-prototype-20260715` → `3176c62d`.
- ✅ Discarded UXHOME1 artefacts: deleted `home-arrival-prototype.tsx`,
  `capture-home-arrival-prototype.ts`, `UX_HOME_SIGNATURE_ARRIVAL_PROTOTYPE.md`.
- ✅ Kept reusable infra: companion `withheld` channel, `--font-signature` /
  `.text-signature` / `.signature-ink`, UIA §8 amendment.
- ✅ Built `client/src/pages/dev/arrival-experience.tsx`; route renamed to `/dev/arrival`
  in `App.tsx`; fixed the stale `index.css` comment reference.
- ✅ Typecheck: 0 errors in the new file. Adoption: `64 passed · 0 notices · 2 failed`
  — the 2 failures (`HouseholdNutritionPanel.tsx` orphan; 539th raw button) are
  pre-existing, both untracked files from other sessions, unchanged by ARRIVAL1
  (my file adds 0 raw buttons). Adoption register json + generated md updated to
  point at the new prototype.

- ✅ Capture script `scripts/capture-arrival-experience.ts` (zero-write, dev-world
  household, uses `REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE`).
- ✅ Screenshots (desktop 1440×900 + mobile 390×844): welcome / emerging / workspace
  / reduced-motion / live-home-control → `docs/ui-audit/arrival-experience/`.
- ✅ Recording of the full arrival, desktop + mobile → `.../video/*.webm` + `.gif`.
- ✅ Report `docs/implementation/ux/UX_ARRIVAL_EXPERIENCE_PROTOTYPE.md`.
- ✅ Build passes; prototype chunk absent from `dist/` ("Welcome home" not in bundle).
- ✅ Verified by observation: welcome is a pure cream field; orchard + header emerge
  as the cream lifts; the glide lands in a one-viewport workspace; the Companion
  appears once settled; reduced-motion shows the workspace with no arrival.

## Definition of Done

- **Route:** `/dev/arrival` (`import.meta.env.DEV` only).
- **Desktop screenshots:** `docs/ui-audit/arrival-experience/desktop-0[1-5]-*.png`.
- **Mobile screenshots:** `docs/ui-audit/arrival-experience/mobile-0[1-5]-*.png`.
- **Recording:** `docs/ui-audit/arrival-experience/video/{desktop,mobile}-arrival.{webm,gif}`.

## Refinement — 2026-07-15 (welcome linger · deep-green greeting · header parity · sunrise sheen)

**Refinement rollback:** `rollback/ARRIVAL1-refine-welcome-header-sheen-20260715` → `3176c62d`
(committed state is identical to the original tag; the prototype files are untracked.)

Refined the existing `/dev/arrival` only — no new components, no header/logo fork,
live Home still untouched.

- ✅ **Welcome lingers.** Greeting held fully readable ~3s after the name settles
  (`name` 1.5s → fade begins 4.5s), then a **slow** opacity fade (`greetingFadeDur`
  1.7s) as the orchard becomes dominant — it recedes, never blinks out.
- ✅ **Greeting colour.** "Welcome home" → `var(--primary-border)` (deep THA green,
  `hsl(132 14% 37/44%)`); name → `text-primary`. Both clear WCAG AA large-text on
  cream (≈5.8:1) and dark (≈3.8:1). No new palette value.
- ✅ **Header parity.** Confirmed the prototype's header line is byte-identical to the
  live Home's (`WorkspaceHeader realm="home" title="Home" wide`); verified visually
  against the live page, desktop + mobile. No bespoke Arrival header.
- ✅ **Sunrise sheen.** One masked left-to-right light across the long logo, fired
  once at 6.0s (`sheenDur` 1.15s), `screen`-blend warm near-white, ~12° tilt. Masked
  to `/logo-long.png`, pinned to the visible logo's box (asserted aligned to the
  pixel: desktop 67×24, mobile 79×28). Does **not** edit/fork `WorkspaceHeader`.
  Never mounted for reduced-motion or a returning visitor.
- ✅ **Sequence** now: cream → "Welcome home" (0.6s) → name (1.5s) → hold → orchard
  (3.9s) → greeting recedes (4.5s) → header+logo settled → sheen (6.0s) → glide
  (6.8s) → workspace. Interactive throughout.

**Timing values used** (`T`, seconds): `signature 0.6 · name 1.5 · orchard 3.9
(orchardDur 1.8) · greetingFade 4.5 (greetingFadeDur 1.7) · sheen 6.0 (sheenDur
1.15) · drift 6.8 (driftDur 1.7s)`.

**Files changed:** `client/src/pages/dev/arrival-experience.tsx` (timing table, deep-
green greeting + slow fade, sheen state/effect/overlay + logo-measure helper);
`scripts/capture-arrival-experience.ts` (re-timed frames, added sheen frame,
renumbered 01–06, deterministic video save); **new**
`scripts/capture-arrival-sheen-closeup.ts` (verifies + photographs the sheen);
`docs/implementation/ux/UX_ARRIVAL_EXPERIENCE_PROTOTYPE.md` (report).

**Checks run:** `tsc --noEmit` — 0 errors in the file. `npm run build` — passes;
prototype absent from prod bundle (no "Welcome home", no `arrival-logo-sheen`, no
arrival chunk in `dist/`). `npm run adoption:check` — `64 passed · 0 notices · 2
failed`; the 2 failures are the pre-existing baseline (`HouseholdNutritionPanel.tsx`
orphan + 539th raw button, both other sessions' untracked files); this file adds 0
raw buttons and no owners. Screenshots + close-ups + recordings refreshed under
`docs/ui-audit/arrival-experience/` (01 welcome · 02 emerging · 03 sheen · 03b
sheen close-up · 04 workspace · 05 reduced-motion · 06 live-home control; video
`{desktop,mobile}-arrival.{webm,gif}`).

## Next action

None from this session — the refined prototype is delivered. It awaits a **look and a
decision**: ADOPT (fold the arrival into `home-experience-page.tsx`, move the Caveat
`@import` into index.css, delete the prototype) or REJECT (delete the prototype).
The disposition is recorded in the adoption register (`signature-typography` owner).
