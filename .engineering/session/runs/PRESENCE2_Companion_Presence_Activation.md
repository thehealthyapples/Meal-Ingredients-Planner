# PRESENCE2 — Companion Presence Activation

**Session ID:** `PRESENCE2_Companion_Presence_Activation`
**Started:** 2026-07-20
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/presence2-companion-presence-activation` → `5320c2d1dd06a06229b744a99417c1df0d602177`
**Report:** [`docs/implementation/PRESENCE2_COMPANION_PRESENCE_ACTIVATION.md`](../../../docs/implementation/PRESENCE2_COMPANION_PRESENCE_ACTIVATION.md)

---

## Stage

**Complete — committed, pushed; awaiting owner review.**

## Next action

Owner to review the report's § 8 — six decisions, of which decisions 2, 4 and 5
were *created* by this workstream and cannot be answered by it.

## Brief

Activate the Companion as the single presence and voice of The Healthy Apples.
Closes `PRESENCE1` § 8 decisions 2 (where the noticing is spoken) and 5 (the
Companion has never introduced itself).

Constraints observed: no second assistant · no second conversational surface · no
duplicated AI capability · no canonical ownership change · no business logic
change · no persistent notifications · no invented household facts.

## What was done

1. **The Companion stopped scoring the household.** `noticeStreak` and
   `noticeDiversity` retired (GEA13) — the last two scoring surfaces in the
   platform, and both the Companion's own. Voiced through `buildCelebration`, they
   told families *"Target hit — a 7-day elite streak."* Underlying owners
   (`user_streaks`, `plantDiversity`) untouched; only the consumers removed.
2. **Household observations reached a reader.** New `noticeHouseholdStory`
   producer, a pure pass-through over the **existing**
   `deriveHouseholdCompanionFields`. No engine created, no observation logic
   duplicated. Voiced **verbatim** — all six personalities identical.
3. **A third duplicate retired.** The notices route had re-implemented PHASE5B's
   seasonal selection byte-for-byte; it now reads the one owner.
4. **The Companion introduces itself.** `introduction` added to all six voices in
   the Personality Registry. Replaces the *returning* greeting
   (*"Welcome back…"*) that first-time households were being shown.
5. **The `aware` promise made keepable.** Notices rendered only when the household
   had no conversation history, while the emblem lit from notice count in every
   room — so anyone who had ever sent a message saw a light and an old thread.
6. **"Why?" per notice** (GEA16) — an ordinary turn down the one channel; no new
   surface, no new capability.
7. **Product Knowledge Registry:** 8 entries created/retired/corrected, three of
   them pre-existing KC14 staleness found in passing (`hid-notice-engine` claimed
   an unreachability PHASE5E had already fixed).

## Gates

`tsc` 88 = baseline (zero added) · build clean, 3291 modules · `adoption:check`
99 · 1 · 9 = baseline (verified by stash) · `verify:coherence` 2 failed = baseline
(verified by stash) · product inventory 0 failures, bijection TOTAL · 12 test
suites green, ~880 assertions.

**Four assertions were INVERTED, not deleted**, so the retirement cannot be undone
silently — including *"at least two personalities voice the same streak fact
differently"* → *"all six voice an observation IDENTICALLY."*

## Honest limits

- Nothing seen rendered; no screenshots. Mobile and dark mode unverified.
- **For most households this will look like nothing changed.** The observation
  producer is silent without a planner week anchor, and 192 of 195 households have
  none and never will (WS10's date gate). The introduction appears; the noticing
  usually will not.
- The "Why?" answer is model-composed — grounding is guaranteed, the sentence is
  not, and no test asserts its content.
- The introduction repeats on every empty-history open (no persisted flag, which
  would be the schema change the brief excluded). Decision 3.

## Files

`server/intelligence/conversation/{notice-engine,behaviour-engine,personality-registry}.ts` ·
`server/routes.ts` · `shared/companion-interaction.ts` ·
`client/src/components/conversation/FloatingAssistant.tsx` · 4 test files ·
9 product registry entries + inventory.
