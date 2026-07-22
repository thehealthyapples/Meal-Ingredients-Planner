# REBUILD1 — Room 1: Welcome Home

**Programme:** `REBUILD1` — first-principles room rebuild per the Craftsmanship Constitution (`CRAFT1`)
**Room:** Welcome Home — `/home` → `client/src/pages/home-experience-page.tsx`
**Date:** 2026-07-22
**Rollback identifier:** `rollback/REBUILD1-room-rebuild-programme-20260722` (annotated tag `b17819b0` → commit `6799bf84`)
**Governing owners:** `HOME_OWNER_ARCHITECTURE.md` · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (GEA) · `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (Living Home / Home entry) · `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` · `THA_CRAFTSMANSHIP_CONSTITUTION.md`

---

## 0. Method (CRAFT1 §7 — architecture first, existing code last)

The room was designed from the architecture *before* the existing implementation was opened.
The Experience Test's three answers governed the design:

- **Which room is this** — the one canonical Home (GEA5), emotional centre of the house, at
  exposure E3 ("the open view" — the only room that renders the orchard generously as itself).
- **How should someone feel here** — welcomed, calm, and *lighter than they arrived*; greeted by
  name in a room already in order. Never measured, hurried, or sold to (presence over engagement, GEA3).
- **The one thing it helps the household do** — orient to *today* and take *one* obvious next step
  (GEA7; the `resolveHomePrimaryAction` resolver, HOME2). Orientation, then one door.

Only *after* that design was fixed was the existing code judged against it. The honest finding:
**the room is already built substantially to this standard** — it composes entirely from canonical
owners (owns no data), the scoring arc was already retired (GEA13), surplus space was already turned
to air-and-view (GEA11), marketing lines removed, honest waiting/broken/empty states throughout, a
single resolver-driven door, and CSS carrying real material physics under a one-morning light. Per
CRAFT1 §7.3 (*"reuse is expected wherever the existing code genuinely serves the designed room"*),
the rebuild kept what strengthens the room and corrected the genuine remaining gaps below. It did
**not** demolish owner-approved craft to manufacture the appearance of a rewrite.

## 1. What changed (the genuine gaps corrected)

| # | Gap | Rule | Change |
|---|---|---|---|
| 4 | **Decorative plant "ring"** — an `--accent` circle around a leaf, a residue of the retired progress ring, encoding nothing and reading as a dashboard-meter silhouette | CRAFT1 §5 (*never decorative for its own sake*), §6 (*delete before adding*); LHDC1 §18 (with-and-without) | Removed the `PlantRing` component and its use; the plant **count** now stands alone as the quiet mark, the card header's leaf already naming it |
| 5 | **"Today at a glance" heading** — "at a glance" is report/dashboard grammar a home does not use about its own day | EXPLANG §4A-G (*Home is not the dashboard*); CRAFT1 §2 (*a place, not a page*) | Softened to **"Today"**. The grid and its material chips were **deliberately not recomposed** — the fix is the framing, not a rewrite of considered work |
| 6 | **Hairline colour authored twice** — the door-run border (`.home-doors`, `38 22% 80%`) and the inline door dividers (`border-[hsl(38 24% 82%/0.7)]`) were one conceptual line rendered as two raw HSLs, with colour named in JSX against the room's own "name the token, not the number" rule | UIA §4 token law; CRAFT1 §3 (*every value deliberate*) | Introduced one room-scoped token `--home-hairline`, consumed by both the CSS border and the door-divider classes. No raw hairline HSL remains in JSX |

Net effect: **57 deletions / 40 insertions across 2 files** — a simplification, per *delete before adding*.

## 2. What was deliberately NOT changed, and why (honest scope boundaries)

These audit findings are real but are **owner-gated or out of a craft pass's scope**; changing them
here would overreach into another owner's authority or fabricate an integration:

- **Retire the `/dashboard` "rival Home" (audit gap 1, High).** `/dashboard` is *deliberately not in
  the primary nav* (`app-shell.tsx`:210); Home's link is essentially its only reachable entry point.
  Removing the link strands a whole reachable product surface, and retiring an entire surface is a
  **Home Owner decision**, not a unilateral craft edit (and is hard to reverse). **Surfaced as a
  recommended decision — see §8 — not acted on blindly.**
- **Device clock in `todayLabel()` (gap 2).** The civil date is owned by Household Time (HT12/HT13).
  This is *known, owner-tracked convergence debt* the file itself documents (CONV1 P8 left it
  deliberately). A correct fix needs the household's zone + a civil formatter — beyond presentation
  and correctness-sensitive. Left as tracked debt; not introduced by this programme.
- **Page-templated greeting & primary-action labels (gaps 3, 7).** The words are **INT21's** (the
  Behaviour Engine). `client/src/lib/greeting.ts` states plainly it is *not* the owner, that these
  strings are scheduled for retirement by the separately-gated **CP3** workstream, that *"nothing
  below is authorised by this document,"* and *"Do not add a household's name here."* Re-voicing the
  greeting or the action labels in a craft pass would create the exact second, ungoverned voice the
  canon retired. Left to CP3 at its owner.

## 3. Architecture Compliance

- **Experience Constitution Check (GEA §18.2):** *hospitality* — the room greets and orients before
  it asks anything; *outcome* — the household leaves with *less on their mind* (a decorative meter and
  a dashboard cliché removed); *weight* — strictly lighter (net deletion); *voice* — untouched: Home
  gains no voice, the greeting/labels stay with INT21 (GEA8/9); *ownership* — Home still owns no fact,
  renders only published state (GEA17, UIOWN1); *agency* — no score/grade/target (GEA13); *restraint* —
  *delete before adding* applied literally (GEA11/15); *layer* — no implementation-layer law invented (GEA20).
- **UIOWN1:** Home composes from Planner (Domain 14), Cookbook (12), Shopping (15), plant-diversity
  aggregate (1/4/22), Household Time, the HOME2 resolver, and UX1's nav list. It owns none of them.
  Unchanged by this pass.
- **One owner per fact:** the new `--home-hairline` is a room-scoped *material* value (like `--oak-body`),
  not a brand token; it converges two authored copies onto one owner — a reduction in duplication, not an addition.

## 4. Definition of Done

- [x] Room designed from architecture first; existing code judged only afterwards (CRAFT1 §7).
- [x] Every genuine in-scope craft gap corrected; each out-of-scope gap documented with its owner (§2).
- [x] Zero `client/src` type errors introduced (`tsc --noEmit`: 0 client errors; pre-existing
      `server/*` baseline drift is unrelated and untouched).
- [x] Adoption gate: **zero new failures** introduced (verified by stash/compare — the 9 pre-existing
      failures are unrelated authored-but-unadopted modules; `PlantRing` was file-local and
      `--home-hairline` is a room-scoped material value, neither a shared building block).
- [x] No test/e2e asserts the changed strings.
- [ ] **Live visual review** — recommended manual step; see §7 (environment limitation).

## 5. Data Impact

**None.** No schema, migration, API, query, store, permission, or business logic touched. The change
is presentation only: one decorative SVG removed, one heading string softened, one colour value
converged onto a token. Every data path (meals, shopping, plant count, planner week, primary action)
is byte-identical. `server/` untouched.

## 6. Trust Check

No fabricated data introduced or removed; the honest waiting/broken/empty three-state handling and the
data-borne signature are preserved exactly. Removing the empty decorative ring *increases* honesty —
it deletes a shape that carried the silhouette of a meter without a meter's meaning. Core Principle 6
(trust is the product) upheld.

## 7. Manual Verification

- **Static:** `tsc --noEmit` — 0 client-side errors; `npm run adoption:check` — 0 new failures vs a
  stashed clean tree; `git diff --stat` — 2 files, net simplification; grep — no dangling `PlantRing`
  reference, no residual raw hairline HSL in JSX, no external assertion of changed strings.
- **Live visual review — OUTSTANDING (environment limitation).** This codebase repeatedly and
  correctly notes that a whole class of craft defect *"is found only by looking at a picture"*
  (ODL2 §6.3). A running-app screenshot pass across the room's viewports (390 · 520 · 900 · 1100 ·
  1440 · 1920) is the recommended next manual step before this room is signed off by the Home Owner,
  to confirm the count reads well without the ring and the door hairlines are visually identical.

## 8. Recommended Home Owner decision (surfaced, not taken)

**Does the `/dashboard` surface still belong in the house?** Under GEA5 (one Home) the dashboard reads
as a second, rival Home that Welcome Home currently advertises via its only reachable link. The
architecturally-clean options are: (a) **retire `/dashboard`**, folding any still-loved value into
Home or the relevant room; or (b) **keep it** as an explicit, named "full detail" surface with a
deliberate entry point. Either is a product/navigation decision for the Home Owner, not a craft edit —
so the link is left in place pending that decision rather than silently deleted (which would strand the surface).

## 9. Scope Lock

Presentation/craft only. No architecture, route, permission, data-model, API, or AI change. `server/`
byte-untouched. Business logic, canonical ownership, and intelligence preserved. Out-of-scope gaps
routed to their owners (§2) rather than fixed by fabrication.

## 10. Rollback Plan

`git reset --hard rollback/REBUILD1-room-rebuild-programme-20260722` restores the pre-programme state
(commit `6799bf84`). The room's changes are isolated to `client/src/pages/home-experience-page.tsx`
and `client/src/index.css`; reverting either file independently is safe (no cross-file dependency
beyond the shared `--home-hairline` token, which degrades gracefully — an undefined var simply yields
no border colour, not a crash).

## 11. User Acceptance Evidence

The finishing question (CRAFT1 §8): **"Would the Home Owner happily spend time here?"**

The room greets by name in the morning light of its own window, orients to today, and offers one lit
door — with the last decorative meter-shape gone, the dashboard cliché softened to a plain "Today,"
and the hairlines now truly identical. Two honest caveats remain before an unqualified *yes*: the
**live visual review** (§7) and the **`/dashboard` decision** (§8), which is the single most
Home-uncharacteristic element on the page and is the Home Owner's to settle. With those closed, the
answer is a confident yes; today it is *yes, pending those two*.
