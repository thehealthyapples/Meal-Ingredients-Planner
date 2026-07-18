# Session: NORTH3_Home_Reimagined

| Field | Value |
|---|---|
| **Session ID** | `NORTH3_Home_Reimagined` |
| **Rollback ID** | `rollback/NORTH3-home-reimagined-20260717` → `f62b5839` |
| **WIP snapshot** | tag `north3-wip-snapshot` (recoverable if a sibling session hard-resets) |
| **Start time** | 2026-07-17 |
| **Current stage** | Waiting for User |

## Objective
Reimagine Home as the emotional entrance hall, preserving all approved behaviour, APIs, component
contracts, architecture and governance. **Owner ruling mid-session: do NOT author the canonical
orchard asset — it is a core THA brand asset with its own canonical ownership, supplied separately
and adopted through the existing owner with no code change. Record it as an external brand
dependency; complete every improvement independent of the orchard image.**

## Outcome
**Three moves, no new law, no value shipped, no behaviour changed.**

1. **The type roles were freed** (`index.css`) — `.title-page/.title-section/.title-card/
   .text-table/.text-numeric/.text-signature` moved `@layer utilities` → `@layer components`.
   They sat *after* `@tailwind utilities`, so the role beat every utility aimed at it, silently.
   **This had already killed two of Home's shipped intentions:** NORTH2's `title-page font-normal`
   salutation rendered at **600**, and NORTH1's `leading-[1.02]` signature rendered at **1.15**.
   Both now live (600→400; 101px→90px), verified in the **compiled production CSS**.
2. **The doors became doors** — a 164px feature-card (icon/title/tagline/CTA disc, ~40% dead space)
   became a 58px name-and-handle. `DOOR_LINES` **retired**: four marketing lines NORTH1 §5.7 had
   already refused once by name ("Nourishing food. Happy home.").
3. **The room fits the house** — at 1440×900 the doors ended at y=936 with the nav at y=839: the
   bottom 60% of every door was behind the toolbar. Now y=787. `lg:pt-8` removed, so the greeting
   and the Companion card share one shelf at y=89 (the name had been 32px *below* a software
   notice). **NORTH2's `lg:mt-16` pause is byte-untouched** — all air reclaimed was dead space
   above the first word, exactly where NORTH2 said it should come from.

## Gates
- `adoption:check` **80·0·2** (was 79·0·2; +1 = the `type-roles` row NORTH3 created). **Same 2
  pre-existing failures, unmasked and proven not mine** (zero raw `<button>` in my files at HEAD
  and now; `HouseholdNutritionPanel` not in my diff). Button ceiling **not** raised.
- `typecheck:ci` **32 — identical set** (P7/P8's number). **All 32 in `server/`; zero in
  `client/src`.** Diff is client-only.
- `npm run build` **clean**. Compiled CSS byte-offsets verified.
- **Platform looked at, not just the room:** planner · cookbook · pantry · shopping **byte-identical**.

## 🔴 Findings
- **The "orchard concepts" are not orchard concepts.** NORTH2 named them by path; NORTH3 opened
  them. `attached_assets/orchard_background_concept_*.png` are **the same watercolour meadow**.
  **Nothing in this repository has ever depicted an apple orchard.**
- **Two further breaches in the shipped asset NORTH2 did not record**, both now in the register and
  neither fixable by a grade: (1) **fog** across the bottom third — Blueprint §16 names fog
  explicitly as *the second sun*; (2) **the sun is on the horizon, not upper-left** (Blueprint §7,
  "forever") — which is *why* `orchard-backdrop.tsx` must crop the sun out of Home's window.
  **The house's one-morning law is currently kept by a crop, not by the picture.**
- **⚠️ A concurrent session's work landed inside NORTH3's evidence.** CONV1 P9 was live throughout;
  P10 started before close. HEAD moved twice (`5c4611e8`→`f62b5839`→`a9116faa`). The dashboard
  capture drifted and looked like NORTH3's CSS. It was not: with the CSS **reverted** it still
  differed from baseline; with the CSS **applied vs reverted** it was **byte-identical**. It was
  P9's Stories-engine edits. *A sibling session's work is indistinguishable from your own in a
  screenshot.*

## Open — reported, NOT fixed
- **Home's header still says "Home"** above "Welcome home, Chloe" (Blueprint §18 item 2, still
  open). Two lawful closures exist; **picking one by taste would be inventing a third treatment**.
  Recommendation: Home passes no `title`, exception recorded. **Owner's call.**
- **The signature is a marker pen** (Caveat). A UIA §8 value, ruled ADOPT by the owner 2026-07-17.
  Recommendation: re-examine against the North Star plate as its own decision.
- **The doors of the house sit 60px above the same four doors in the nav.** Named, not deleted.
- Inherited, unchanged: `orchard-environment.openMigration` (five surfaces bypass the owner;
  `dialog.tsx:48` puts the orchard behind every dialog); `signature-typography.openMigration`.

## Next action
Awaiting review. **The orchard is now an external brand dependency** with a named owner, a full
drop-in spec (NORTH2 §5 + NORTH3's two additions), and a room built to receive it with **no code
change**. Until the picture lands, Home's focal point is a meadow doing an orchard's job — the
ceiling NORTH2 named and NORTH3 was correctly forbidden to raise.

Report: `docs/implementation/NORTH3_HOME_REIMAGINED.md`
Evidence: `docs/ui-audit/north3-home/` · harnesses: `scripts/capture-north3-home.ts`,
`scripts/measure-north3-home.ts`
