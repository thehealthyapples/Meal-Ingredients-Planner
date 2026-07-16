# CONV1 Phase P3 — The free renames and off-by-ones

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/CONV1-phase-p3-renames-and-off-by-ones-20260716` → `7d1dd2ce`
**Type:** Git tag, created **before any file was touched**.

> ⚠️ **The tag is a marker, not a restore point.** `7d1dd2ce` predates every uncommitted
> P0/P1/P2 correction in a tree dirty from ~9 concurrent sessions. **A tag checkout would
> destroy them.** To roll back, revert the named files below individually. This is the same
> qualification the P1 milestone and P2 recorded, and it still holds.

**Scope:** CONV1 Phase **P3** only — `BEH-1` · `BEH-4` · `BEH-7`. No unrelated refactoring.

---

## Mission

Implement CONV1 Phase P3: complete `BEH-1`, `BEH-4`, `BEH-7`. Create implementation reports.

## Pre-work checkpoints

- [x] Rollback tag created **before any file was touched**
- [x] `git status` confirmed (branch `int1-intelligence-platform`, HEAD `7d1dd2ce`; dirty tree, ~9 sessions)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md` read — § 3 (`BEH-1`, `BEH-4`, `BEH-7`), § 7 (phases)
- [x] `CONV1_PHASE_P1_COMPLETION.md` / `CONV1_PHASE_P2_COMPLETION.md` read
- [x] `THA_EXPERIENCE_BLUEPRINT.md` § 5.1, § 6.0–6.2 read — **supplies `BEH-7`'s scope boundary**
- [x] `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` `HT8` read — **supplies `BEH-4`'s key space**
- [x] Baseline measured, **not inherited** (`CP11`) — see below

## Baseline — measured for this phase (CP11)

`npm run adoption:check` → **FAIL: 64 passed · 0 notices · 2 failed**
1. `[button-primitive]` raw `<button>` rival count ROSE: **539 in code, ceiling 538**
2. `[orphans]` NEW authored-but-unadopted: `client/src/components/HouseholdNutritionPanel.tsx` (0 importers)

**Neither is P3's** — both pre-existing at HEAD, from concurrent sessions. P2 recorded the same
count (64/2). P3's obligation is to leave this number no worse.

## Corrections to CONV1's inventory (verified at source — lesson `L1`)

1. **Every `file:line` in all three items has rotted.** `BEH-4`'s `storage.ts:3345` is now
   **`:3378`**; `BEH-1`'s `household-eater.ts` is **`shared/household-eater.ts`**. The *facts*
   were all confirmed correct at their new locations — `L2` again: **the count was right and the
   lines had rotted.**
2. **`BEH-7`'s backdrop has no parallax.** CONV1: *"with a parallax"*. The live component is
   `position: fixed; inset: 0; objectFit: cover; opacity: 0.90` and **nothing else** — no
   parallax, no motion. The § 6.1 *"never animates"* limb is **already clean**; only the
   *wallpaper* limb is breached. **One prohibition breached, not three.**
3. **`BEH-7` has THREE mount sites, not one.** CONV1 names only `App.tsx:210`. Also
   `orchard-shell.tsx:6` (→ `/auth`, `/onboarding`) and `home-page.tsx:45` (the unauthenticated
   marketing landing). **The latter two are not rooms** — they are arrival, which Blueprint
   § 6.2 rule 3 *expressly permits* at E3 (*"The arrival may stand at E3 for its beat"*).
   **Scope is `App.tsx:210` alone.**
4. **`BEH-1`'s "no production code branches on `kind`" is TRUE, verified exhaustively.** The only
   `HouseholdEater.kind` reads are the definition (`:66`), the derivation (`:107`), the read-handler
   view type (`household-read-handler.ts:81`), a **comment** at `routes.ts:9084`, and test fixtures.
   Every other `.kind` hit in the tree is an unrelated domain (meals, media, vocabulary,
   recommendations).
5. **`BEH-1`'s `"guest"` rival collides with a LIVE, LEGITIMATE, DIFFERENT `"guest"`.** CONV1 does
   not mention this. `shared/household-eater.ts:8` defines **`GuestEater`** — a real visitor at a
   single planner entry (`plannerEntries.guestEaters`, `storage.setEntryGuests`). So THA uses one
   word for two things: *a visitor who is not in the household*, and *a household's own
   account-less member*. **This strengthens the item: the rename is not cosmetic, it un-collides
   a live domain term.** One test pins it: `test-intelligence-household-discovery-binding.ts:155`.
6. **`BEH-4`'s key space is confirmed by the primary surface, not only by the converters.**
   `weekly-planner-page.tsx:102` — `DAY_NAMES = ["Sunday", …]` indexed by `dayOfWeek` directly,
   with `MONDAY_FIRST_ORDER = [1,2,3,4,5,6,0]` (`:104`) for display order. **`HT8` exactly:
   stored `0 = Sunday`, displayed Monday-first.** The household *sees* `dayOfWeek === 0` as
   **Sunday**, while `storage.ts:3378` calls that variable `monday`.

## The two design decisions — put to the user, not decided

Both are user-visible presentation, which the Experience canon owns (the P2 precedent).

1. **`BEH-7`'s residue.** Retiring the wallpaper is unambiguous; what Home is left standing in is
   not. **User's direction: retire the wallpaper only** — rooms fall to the warm canvas (the
   Blueprint's own E1); Home's E3 and the E2 window are left as a **declared, reported gap**,
   because they ship only through § 2.4's path (UIA § 4 amendment, tokens by admission).
2. **`BEH-1`'s client labels** (forced by correction #7 below — CONV1 believed there were none).
   **User's direction: say what's known, drop where irrelevant** — Profile states "No account"
   (it explains the edit affordance); the Planner's two chips are **deleted**, because account
   backing has no bearing on whether a meal suits someone.

## Late correction (found only by an exhaustive re-grep — my first sweep was truncated)

7. **`BEH-1`'s "no production code branches on `kind`" is FALSE — the item's GRADE was wrong.**
   Four live client sites branch on it: `profile-page.tsx` draws a **`<Baby />` icon** for anyone
   without an account and prints the **raw `{eater.kind}`** in a badge; `weekly-planner-page.tsx`
   tags them `(child)` twice. **The gun was not waiting to be picked up — it had been fired, into
   the UI.** My first grep was `head -30`-truncated and would have shipped on CONV1's word;
   the exhaustive sweep caught it. **`L1` applies to this session's own greps, not just to CONV1.**

## Outcome

**Report:** `docs/implementation/governance/CONV1_PHASE_P3_COMPLETION.md`. **All three CLOSED.**

- **`BEH-4` — executed, not reasoned.** Drove the real `seedDemoData` path against the real DB:
  **pre-fix `Sunday, Monday, Tuesday, Wednesday` → post-fix `Monday, Tuesday, Wednesday, Thursday`.**
  Key space **not** renumbered (`HT8`). **Corrected CONV1: it is every *demo/trial* household, not
  "every new THA household"** — `seedDemoData` is reached only from `POST /api/demo/start`.
- **`BEH-1` — the vocabulary is one word again.** `"user"|"child"` → `"account"|"no-account"`;
  the fabricated `role: "guest"` retired. **Found two things CONV1 missed:** `"guest"` collided
  with the live, opposite `GuestEater` (a visitor at a planner entry), and `role: "guest"` breached
  the engine's **own written hard boundary** (*"No fabrication: every field comes from a stored
  row"*) three lines under the boundary. The retired word is now **asserted absent** in tests.
- **`BEH-7` — one deletion, and a gate proven to fire.** `<OrchardBackdrop />` gone from `App.tsx`
  (+ its import + the now-pointless `bg-background/25` scrim). **No new principle written**
  (NORTH2's refusal / `R8`). **Corrected CONV1 twice: there is no parallax** (one prohibition
  breached, not three) **and there are three mount sites, not one** — the other two are arrival,
  which § 6.2 rule 3 expressly permits, and were left alone. Recorded in the Adoption Register as
  concern `orchard-exposure`, using `retired` + `excludePaths` so the Blueprint's rule is
  **machine-enforced**: re-introducing the mount **fails and names the file**
  (`client/src/App.tsx:1`). **This is § 9's lesson answered** — *"a checklist cannot catch a
  component nobody re-read."*
- **Verification:** **629 assertions / 11 suites, 0 failed.** `adoption:check` **64 → 66 pass**,
  same 2 pre-existing fails. **Typecheck 32 regressions / 11 files — not one is P3's** (proved:
  P3 touched none of those files). Build passes.
- **NOT verified, and said so:** `BEH-7` is visual and **was never looked at** — headless Chromium
  cannot launch here (`libglib-2.0.so.0` absent; the tree's `.glibcheck.txt` stray is a concurrent
  session hitting the same wall). **A reviewer should look at a room before this ships.**
- **Refused:** renumbering the key space (`HT8`); fixing `roleMap.get(uid) ?? "member"` (same
  fabrication, one expression away — **outside `BEH-1`**, recorded as backlog); building Home's E3
  inside P3 (jumps § 2.4's path in the item whose lesson is *obey what is written*); retiring
  arrival's orchard; rewording the Planner chips rather than deleting them; adopting the 2
  pre-existing `adoption:check` fails or the 32 typecheck regressions.

## Next action

Complete. **Recommended next: correct Domain 6 + Domain 18 — now urgent, ahead of P4.** P2
recommended it and it did not happen; since then **`verify:coherence` was wired into
`release:check`** (`package.json:83`) by a concurrent session. Two one-line factual corrections
(zero rule change, zero ownership change) now stand between THA and a **release gate that is red
for reasons unrelated to whatever is being released** — `R2` graduated from a risk into the release
path. Then **P4 — The Household Person**, which `BEH-1` has just strengthened the case for.
