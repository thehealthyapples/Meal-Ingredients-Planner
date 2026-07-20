# PRESENCE1 — Household Presence

**Session ID:** `PRESENCE1_Household_Presence`
**Opened:** 2026-07-20
**Type:** Presence programme. Presentation layer only.
**Rollback:** `rollback/PRESENCE1-household-presence-20260720` → `3d5500c2`
**Commit:** _(recorded below on commit)_
**Report:** `docs/implementation/PRESENCE1_HOUSEHOLD_PRESENCE.md`
**Source:** `docs/investigations/EXPREVIEW1_FIRST_TIME_HOUSEHOLD_EXPERIENCE.md`

---

## How this session opened

The owner commissioned a Presence Layer against `EXPREVIEW1`'s verdict — *"the
house is built and lit; it is not yet inhabited"* — with the instruction to make
every room answer one question: *what would somebody who genuinely cared about
this family notice?* Prefer observations over scores, memories over metrics,
encouragement over evaluation. Where nothing meaningful has been noticed, say
nothing.

## Boundary held

**No business logic, canonical ownership, permission, schema or AI architecture.**
No server file was modified. No stored value changed meaning. Ten client files
plus the adoption register and its generated prose.

`WEEKLY_PLANT_TARGET` remains the single canonical owner of the weekly target —
this programme removed *consumers* of it, never the fact. The `moodApples` /
`energyApples` fields, their 1–5 range and their write path are untouched.

## The finding

**Nineteen distinct judgement surfaces across eight rooms, not one of them
permitted by the governing architecture on the day it was written.** The space
where noticing belongs was not empty — it was fully occupied by scoring. So the
Presence programme is ~90% subtraction, and for the surfaces involved the
removal *is* the presence, because what sat underneath was always the
household's own life with a verdict laid over it.

Three findings beyond the review's own:

1. `AppleRating`'s accessible name is `"THA Score: N out of 5"` — so a screen
   reader announced a household's **mood** as a THA food-processing score.
2. `"Target aligned"` rendered green whenever a calorie figure existed. A verdict
   with one possible value is reassurance shaped like a finding.
3. `activityLevel` fell through to `"Moderate"` when **unset** — the presentation
   layer stating a fact for households who had never given one (GEA17).

Plus one governance discovery: `UX3` (2026-07-19) ruled that the Companion owns
the coaching and retired the interpretation grid from the Planner strip's
*expanded panel* — but missed the *compact row*, and in doing so made the code
comment justifying that row's truncation false. PRESENCE1 finishes `UX3`.

## What THA already had, and was truncating

`shared/stories/engine.ts` derives true, trust-gated observations from a
household's own history — *"Chickpeas became a household favourite."* The Planner
was cutting them to 36 characters and mixing them with seasonal advice. This
programme cleared the space and **deliberately did not fill it**: where the
noticing should be spoken is owner decision 2.

## Gates

- `tsc --noEmit` — 88 errors, **all pre-existing, all in `server/`**; this change
  is client-only and adds zero.
- `npm run build` — PASS, 3291 modules.
- `npm run adoption:check` — 99 passed · 9 failed, **identical to baseline**
  (verified by stash). One new orphan was created and closed: see below.
- `npm run verify:coherence` — 2 failed, **both pre-existing** (verified by stash).
- `nut-verify1` 55/0 · `stories-engine` PASS · `home2` 47/0 ·
  `household-nutrition` 54/0 · `time3-p8` 60/0.

**The gate this change broke:** removing both five-apple mood pickers orphaned
`client/src/components/icons/ThaAppleIcon.tsx`. Recorded in the adoption register
as a **defect, not an exemption**, with its cause named. Not deleted — retiring a
brand-mark component is an owner's call (owner decision 3).

## Not verified

Nothing was seen rendered. No screenshots. Mobile and dark mode unverified. Four
rooms untouched (Doorstep, Pantry, Orchard, Cookbook). The house has stopped
assessing the household; whether it has begun to *notice* them is decision 2.

## Next action

Owner to review `docs/implementation/PRESENCE1_HOUSEHOLD_PRESENCE.md` § 8 — five
Presence decisions, of which two are load-bearing:

- **Decision 1 — the Cookbook.** 500 generated titles, one ending in `2`, no
  photographs of food. `EXPREVIEW1`'s highest-value finding and this programme's
  natural completion: the rooms are now quieter and emptier, and what should fill
  them is the household's food, not a number.
- **Decision 5 — the Companion has still never introduced itself.** PRESENCE1
  removed four coaching voices on the principle that the Companion owns
  interpretation. That principle is now load-bearing: if the Companion stays
  silent, this programme has removed advice and replaced it with nothing.
