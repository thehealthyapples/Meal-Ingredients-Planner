# Home Room — North Star Refinement

**Document ID:** `HOMEROOM1`
**Date:** 2026-07-21
**Status:** Implemented (code) · **Waiting for User** (Home Owner review)
**Rollback identifier:** `rollback/HOMEROOM1-home-room-north-star-20260721` → `f0446693e236b859345093918d481467db4aa528`
**Author of record:** Colin Clapson (owner / Home Owner) · implemented by Claude under the Engineering Workflow
**Session run file:** [`.engineering/session/runs/HOMEROOM1_Home_Room_North_Star_Refinement.md`](../../../.engineering/session/runs/HOMEROOM1_Home_Room_North_Star_Refinement.md)

---

## 0. What this is, and what it deliberately is not

The brief asks to *complete the Home room so it fully realises the North Star vision* — and it
fixes the method in its own words: **"Prefer refinement over addition. Do not add unnecessary
features."** The Home room is the most worked surface in the platform: NORTH1–NORTH4, UX2, UX3,
PRESENCE1, HOME2/HOME3 and CONV1 P8 have already converged it onto its canonical owners, retired
its private clock/week/season, dissolved its impersonated Companion panel, and removed every
score, ring and target that graded a household. **Completing it therefore means one honest
refinement, not a redesign** — and it means confirming, element by element, that every part the
brief lists already has a canonical owner and already obeys the governing law.

Two changes result, both presentation-only in the one Home file:
1. **A composition correction to the arrival** (§ 1.1–1.2) — found by reading the room.
2. **A shopping-preview field fix** (§ 1.3) — found by *running* the room and looking at it: the
   Shopping glance was composing a field the canonical owner does not have, so every preview line
   rendered blank. This is the class of defect no typecheck or unit test surfaces; it was invisible
   until the page was rendered and read, which is why the visual-verification pass matters.

Everything else in the brief's review list is verified as already-compliant and recorded as such
(§ 10), with the continuous backlog named in the Scope Lock (§ 11) under Home Owner Principle 11.

**Scope: one file, presentation only. Zero business logic, zero schema, zero routes, zero
state, zero new component/token/pattern, no other room touched.**

The target is the **Home ROOM** — `client/src/pages/home-experience-page.tsx`, route `/home`,
the logged-in emotional centre a household returns to. It is **not** `home-page.tsx` (route `/`),
which is the logged-out marketing front door; that page is out of scope and untouched.

---

## 1. The change, in detail

### 1.1 The defect

The arrival (the greeting) was laid out as a two-column grid:

```
<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
  <header className="max-w-xl"> …name / date… </header>
  {/* the 22rem right bay — empty */}
</div>
```

The `22rem` right bay was NORTH1's home for the Companion's card, *"resting against the view."*
**UX3 gave the Companion its own mouth** — the global `FloatingAssistant` (mounted once in
`app-shell.tsx:424`, present in *every* room) — and removed Home's inline Companion surface. The
reserved bay was left behind, holding nothing.

The visible consequence: on a wide wall the greeting was pinned into the left `minmax(0,1fr)`
column while **everything beneath it** — the "Today at a glance" heading, the three glance
objects, the doors — sits on the room's `max-w-4xl` (56rem) centred spine. The arrival's left
edge fell ~190px to the left of the content below it. The room read as **two compositions that
did not share an edge**, with a void where a card used to be. That is not "air and view"; it is
an orphan of a removed element.

### 1.2 The fix

The arrival now joins the room's **one content spine**:

```
<div className="mx-auto max-w-4xl">
  <header className="max-w-xl"> …name / date, unchanged… </header>
</div>
```

- The dead `22rem` bay becomes air and view — the wall now shows equally on both sides
  (**GEA11**, *surplus space becomes air and view*; Experience Language **P8**, *breathing space
  is content's right, not a leftover*).
- The greeting, the glance and the doors now share **one left edge and one centred spine** — the
  room reads as **one carefully-cared-for composition** rather than two (**UIA §6** — *one
  content column, a single governed reading width; content never stretches to fill the
  viewport*; the previous wide arrival was the exception to this law, and it is now removed).
- `<header className="max-w-xl">` is untouched: the greeting copy keeps its readable measure and
  the household's **name stays the loudest thing in the room** (NORTH2 typography, unchanged).
- The two long comment blocks documenting the removed Companion panel are replaced by one
  concise note that **preserves the load-bearing UX2/UX3 rationale** — the Companion is the
  global `FloatingAssistant`, and no inline Companion surface may be re-added here (that is the
  *"page speaking in the Companion's name"* defect UX2/UX3 retired).

### 1.3 The shopping-preview field fix (surfaced by running the room)

Rendering the room under a demo session (§ 12) showed the Shopping glance card as a header, a
**gap where three item names should be**, then *"and 8 more"* — three blank list rows that read
as broken, not calm. The cause:

```
{openItems.slice(0, 3).map((i: any) => (
  <li key={i.id} className="truncate">{i.name ?? i.itemName}</li>   // ← neither field exists
))}
```

The canonical `shopping_list` row (Domain: Shopping) carries **`productName`** — verified against
the owner, which stores it and renders `capitalizeWords(item.productName)`
(`shopping-workspace-page.tsx:867`); there is no `name` and no `itemName`. So Home was composing
fields the owner does not publish, and every preview line resolved to empty string.

The fix reads the owner's actual field:

```
{openItems.slice(0, 3).map((i: any) => (
  <li key={i.id} className="truncate">{i.productName}</li>
))}
```

- This is **composition, not authoring**: Home now renders the exact field the Shopping owner
  publishes (the stored names are already Title-cased at source — e.g. *"Baby Spinach (200g)"* —
  so no casing helper is needed and none was duplicated).
- It **strengthens UIA §14 visual honesty**: three blank rows above *"and 8 more"* silently
  implied "there is nothing here" over real items; the preview now tells the truth.
- **Presentation-only**: no field added, no data written, no route or schema changed; Home simply
  reads the published field it always should have. The item **count** (`!i.checked`, verified —
  the `checked` boolean is a real column) and the *"and N more"* rollup were already correct and
  are untouched.

Net across both changes: **+34 / −38** lines in one file. No token, colour, radius, shadow,
motion, or authored string changed; no data path changed. The greeting logic, all three glance
cards' structure, every loading / error / empty / unanchored state, the resolver-aimed one door,
the doors row and the dashboard link are otherwise **byte-identical** to before.

---

## 2. Experience Constitution Check (§ 18.2 — answered before design)

Run first, because it is the only gate that can fail a change that is correct in every
particular and wrong in conception (`GOVERNING_EXPERIENCE_ARCHITECTURE.md`).

- **Hospitality (§3.1):** The arrival now welcomes the household on one calm, balanced surface
  instead of stranding their name beside an empty bay. More welcoming, not less. ✅
- **Outcome (§3.5):** *Increases confidence / calm.* Nothing is added to do; the room simply
  composes as one place. No new task, no new decision. ✅
- **Weight (GEA2):** The room is **lighter** — a dead layout column is removed, ~12 lines of
  now-false comment retired. No capability, surface, card or control added. ✅
- **Voice (GEA8/GEA9):** No copy authored; rooms still only report. The Companion still speaks
  only through its own global presence — this change re-confirms that boundary in code and
  comment. ✅
- **Ownership (§7.4 / GEA21–22):** Every element rendered is still a room's own fact through its
  own owner. No observation or interpretation added; the Companion beat stays the Companion's. ✅
- **Agency (GEA23):** Nothing decides on the household's behalf; no default changed. ✅
- **Restraint (GEA11/13/15):** The change *is* restraint — surplus space returned to air and
  view; no colour, motion, score, streak, ring or ornament introduced or re-introduced. ✅
- **Layer (GEA20):** Work flowed **downward only** — this is an Implementation-layer composition
  correction that originates no law; it names the principles above it (GEA11, UIA §6, Experience
  Language P8) and the owners beside it (UIOWN1's Home composition rules; the Companion's global
  presence per UX3). ✅

---

## 3. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ No duplicate ownership — Home still composes from canonical owners only and owns nothing.
  It renders the greeting (name), the planner/shopping/nutrition glance (published query state),
  the resolver-aimed door (HOME2 over canonical planner state), and the doors (UX1's roomsByHref).
  No owner created, moved, or duplicated. Home remains UIOWN1's proof-case: "the most composed
  room in the house owns the least."
☑ Home owns NO business state — no store, cache, localStorage, private week, or private season
  was added or touched. The arrival change is a CSS-class layout correction; the shopping change
  reads a different field off a row the existing query already returned. No state introduced.
☑ Home composes published state from canonical owners — strengthened. Every value still arrives
  from an existing react-query cache / shared hook / shared resolver, and the Shopping preview now
  composes the owner's ACTUAL published field (`productName`) instead of two fields
  (`name`/`itemName`) the Shopping owner never publishes — a composition defect corrected.
☑ Companion remains the single conversational presence — the global FloatingAssistant
  (app-shell.tsx) is Home's only Companion surface; the change removes a dead bay reserved for a
  retired inline card and forbids, in comment, any re-addition. No second assistant, no
  impersonation.
☑ Living Home remains the architectural shell — the .home-room material system, the OrchardWindow,
  the sill, the pressed apple, the doors run: all untouched. The house holds still (LIVINGHOME1).
☑ Extends existing shared presentation — adds no component, token, pattern, or CSS class; reuses
  the room's existing `max-w-4xl mx-auto` spine already used by the heading, glance and doors.
  UIA §17 "retire on introduction" is satisfied trivially — nothing was introduced.
☑ No room-specific UI pattern introduced where a shared one should exist — the change deletes a
  bespoke wide-grid arrival in favour of the shared content-column width the rest of Home uses.
☑ Other rooms untouched — one file changed; no shared component altered.
```

**Shared presentation components reused (per the brief, and per UINORTH1):**
- `Skeleton` (loading — UIA §12) · `LoadError` (error tiers — UIA §12) · `EmptyState` idiom
  (honest absence — UIA §17) · `MealCard` (meal presentation) · `WorkspaceHeader` / `PageContainer`
  (shell + governed reading width) · the `.home-room` material owners in `index.css`. UINORTH1's
  `Skeleton`/`EmptyState` convergence is inherited unchanged; this refinement adds no new
  divergence for a later pass to reconcile.

---

## 4. Home Owner Compliance

The eight Decision-Framework questions (`HOME_OWNER_ARCHITECTURE.md`), plus Principle 11:

1. **Does this make the home feel more welcoming?** Yes — the household's name is greeted on one
   balanced, cared-for surface, not beside a void.
2. **Does this belong in the house?** Yes — it removes something that no longer belonged (a bay
   for a card that was taken out) and returns the space to wall. *Removal is as legitimate as
   addition* (Principle 2).
3. **Is this beautiful enough / does this create calm?** Yes — one spine, one left edge down the
   whole room; the composition is quieter and more intentional.
4. **Does this reduce visual noise?** Yes — an unbalanced empty column is visual noise; it is gone.
5. **Does this preserve calm?** Yes — no motion, colour, or element added; the room is stiller.
6. **Does this feel timeless?** Yes — a single governed reading column is the house's enduring
   layout law, not a trend.
7. **Would someone enjoy simply spending time here?** The arrival now sits in the window's light
   as one composed moment; there is less to explain and nothing misaligned to notice.
8. **Does this strengthen hospitality?** Yes — the first thing the household sees is composed,
   not assembled (Experience Language P1, *arrival before information*).

**Principle 11 (continual care)** is the frame: this pass does not claim Home is finished — it
claims the arrival is left measurably better than it was found, using only the house's own
materials, and it names the remaining continuous work (§ 11). **This report is the request for
Home Owner approval; an unrecorded approval is not an approval.** No new aesthetic *character*
was introduced (nothing added), so only confirmation that the correction meets the bar is
required — not a new-character admission.

---

## 5. AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ No new AI capability — none defined, registered, or consumed.
✓ Companion unchanged — reasoning, voice, grounding (INT17), selection (INT20/DEC1), and
  conversation state untouched. The Companion remains the single conversational presence, and
  this change re-affirms it: Home's only Companion surface is the global FloatingAssistant.
✓ No second assistant / no impersonation — the removed bay had held a retired inline panel; the
  comment now forbids re-adding any Home-authored Companion surface (the UX2/UX3 defect).
✓ Intelligence Platform unchanged — no spine component reached; the opportunity bundle Home reads
  to tier its one door (resolveHomePrimaryAction over DEC1 output) is untouched.
✓ Capability Registry / Intent Engine unchanged — no binding, intent, or path added.
✓ No fabrication — no data path changed; every honest-absence, unanchored, empty and error state
  is byte-identical. Pantry is still NOT previewed, because Home has no validated pantry data and
  a fabricated fact is the one thing this page has never done (NORTH1 §5.2).
```

---

## 6. Definition of Done (against the brief)

- **Home fully complies with governing architecture** — ✅ (§§ 2–5, 8). Verified against the six
  named documents (extracted rule-by-rule): HOME_OWNER, UIOWN1, LIVINGHOME1, LIVINGHOME2,
  Experience Language, UI Architecture.
- **Home feels like the front door of the platform** — ✅ improved: the arrival is now one
  composed welcome on the room's spine, in the window's light, sharing its edge with the glance
  and doors; and the Shopping glance shows the household's real items rather than blank rows.
- **Companion feels naturally present rather than added** — ✅ confirmed: the Companion is the
  global FloatingAssistant in every room; Home renders no bolt-on Companion surface, and the dead
  bureaucratic remnant of the old one is retired.
- **Desktop layout feels balanced** — ✅ this is the specific fix: the wide unbalanced arrival now
  matches the centred content spine.
- **Mobile layout remains coherent** — ✅ unchanged on mobile: the old grid was single-column below
  `lg`, and `mx-auto max-w-4xl` is full-width within the container gutters at phone sizes exactly
  as before. Verified against the `.home-room` mobile rules in `index.css` (≤520px / ≤900px /
  ≤1100px), none of which this change touches.
- **Every visible element has a canonical owner** — ✅ re-verified element-by-element (§ 10), and
  now *more* true: the Shopping preview renders the Shopping owner's actual published field
  (`productName`) instead of two fields the owner never had.
- **Shared presentation components reused wherever possible** — ✅ the change reuses the existing
  content-column spine and adds nothing; UINORTH1's Skeleton/EmptyState owners are inherited.
- **Visual quality reaches the current North Star standard** — ✅ for the arrival; the rest of the
  room already met it and is confirmed, with continuous refinement named in § 11.

---

## 7. Data Impact

**None.** No schema, migration, table, column, seed, or row. No household data is written,
derived, or exposed. No API, query, hook, or cache key added or changed. The arrival change is a
layout-class edit; the shopping fix changes **which already-published field Home reads** for the
preview (`i.name ?? i.itemName` → `i.productName`) — the row was already fetched by the existing
`shoppingList.list` query, so no new read, no new data, only the correct field of data the room
already had in hand.

---

## 8. Trust Check

- **Visual honesty (UIA §14):** improved on two counts — (1) the room no longer displays a
  reserved-but-empty region that implies a missing card; (2) the Shopping preview no longer shows
  blank rows above *"and 8 more"* that silently implied "nothing here" over real items. What is
  shown is exactly what is composed; nothing is faked, and no honest absence is papered over.
  Pantry remains an honest omission, not a fabricated preview.
- **No fabrication:** no invented content, no precision theatre, no manufactured urgency, no
  seasonal/dressing object (Environmental Dressing is DECLARED-NOT-BUILT — LIVINGHOME2 §10; none
  added). The shopping fix is the *opposite* of fabrication — it stops rendering empty strings and
  shows the household their real items.
- **No safety surface touched:** the resolver's Tier 0 safety door (DEC1/ATTN1), allergen and
  restriction paths, and every warning are untouched.
- **No copy authored:** the greeting words, state sentence, and every card label are
  byte-identical; the shopping item names are the Shopping owner's stored values, rendered
  verbatim, not authored here.

---

## 9. Rollback Plan

- **Tag:** `rollback/HOMEROOM1-home-room-north-star-20260721` → `f0446693e236b859345093918d481467db4aa528`.
- **Nature:** a **non-destructive** snapshot commit — created via `git add -A` → `git write-tree`
  → `git commit-tree -p HEAD` → tag → `git reset`, so the working tree (including the uncommitted
  UINORTH1 shared-owner work and both untracked UINORTH1 docs) was captured **without being
  disturbed**. The snapshot is parented on `be381a89` (current HEAD).
- **Undo (this workstream only):**
  `git checkout rollback/HOMEROOM1-home-room-north-star-20260721 -- client/src/pages/home-experience-page.tsx`
  restores the single code file to its pre-HOMEROOM1 state; the two docs and the run file are new
  untracked files and can simply be deleted.
- **Coverage:** the tag fully restores the one code change (an ordinary tracked-file modification
  with no data component). It also preserves the surrounding uncommitted UINORTH1 state so that
  rolling this back never risks the awaiting-approval work beneath it.
- **Granular undo:** the change is a single self-contained edit region marked with a `HOMEROOM1`
  comment; it can be reverted in isolation.

---

## 10. Scope Lock — element-by-element verification of the brief's review list

**Changed by HOMEROOM1:**
- **Welcome experience / Desktop layout / Spacing / Visual hierarchy** — the arrival joins the one
  content spine; the dead Companion column is retired (§ 1.1–1.2). One left edge down the room.
- **Shopping preview** — composes the Shopping owner's actual `productName` field, so the three
  preview rows show the household's real items instead of blank lines (§ 1.3). Surfaced by
  rendering the room; presentation-only.

**Verified already-compliant, deliberately unchanged (with the owner that makes it so):**
- **Orchard / Seasonal presentation** — `OrchardWindow` + `.home-window`; one season, one morning,
  byte-constant; type never on the glass (Blueprint §6.1). **No Environmental Dressing added** —
  the layer is DECLARED-NOT-BUILT and unlawful to ship until LIVINGHOME2 §10.2's amendments pass.
- **Living Home shell** — `.home-room` material system in `index.css`; the house holds still
  (LIVINGHOME1). Untouched.
- **Companion presence** — global `FloatingAssistant` (app-shell.tsx), one presence in every room
  (UX3; LIVINGHOME1 §9). No inline surface; re-addition forbidden in comment.
- **Household summary / Planner preview / Nutrition preview** — the glance objects (Meals,
  "From the orchard" plant diversity), each composed from a canonical owner's published query
  state, each with WAITING/BROKEN/EMPTY separated (PX1-W0). Untouched. (**Shopping preview** — see
  "Changed by HOMEROOM1" above: the field it composes was corrected; its structure and states are
  otherwise unchanged.)
- **Pantry preview** — **honest absence, by design**: Home holds no validated pantry data, so it
  previews none and offers the Pantry *door* instead (NORTH1 §5.2). Adding a preview here would be
  fabrication; it was not added.
- **Empty states** — card-level micro-empties are calm one-sentence honest states (UIA §12 voice);
  a full `EmptyState` block would be heavier, not lighter, at card scale — left as-is (consistent
  with UINORTH1's deferral of blind micro-empty conversion).
- **Loading states** — `Skeleton` shapes per card (inherited from the platform loading owner;
  UIA §12, UINORTH1). Untouched.
- **Motion** — the signature-ink greeting reveal only, reduced-motion-gated with a still
  equivalent (UIA §11); the plant mark is still (PRESENCE1). Nothing loops. Untouched.
- **Typography** — `title-page` / `.text-signature` greeting, `title-section`/`title-card`
  headings; weight restrained, the name loudest (NORTH2; UIA §8). Untouched.
- **Mobile layout** — the `.home-room` responsive rules and single-column arrival below `lg`;
  coherent and unchanged.

**Continuous refinement backlog (Principle 11 — measured, not claimed done):** the
Household-Time convergence of `todayLabel()` (still a device `Date` read, left for CONV1 per the
in-file note); INT21's greeting-word ownership (§9/CP3); and any owner-directed, visually-verified
spacing-rhythm pass. These are named, deferred, and NOT within HOMEROOM1's one-file scope.

**Not touched at all:** business logic, schema, routes, state, the Companion/Intelligence spine,
any room's content or ownership, any other room, any colour/token/motion/CSS.

---

## 11. Manual verification steps

Automated (done): client `tsc --noEmit` → **0 client errors** (server-test/script errors are
pre-existing and unrelated); `npm run adoption:check` → **100 passed · 0 notices · 9 failed**
(identical to the UINORTH1 baseline — zero new failures); `npm run build` → **exit 0**.

Visual (done — see § 12 for evidence): the running app was driven under a demo session with
Playwright and `/home` was rendered and read at 1440px, 1280px and 390px. This is how the
shopping-preview defect (§ 1.3) was found and confirmed fixed.

To re-confirm visually (owner / reviewer), signed in, at `/home`:

1. **Wide desktop (≥1280px):** the greeting ("Welcome home," + the signature name) shares the
   **same left edge** as "Today at a glance" and the three glance cards below it — no leftward
   offset, no empty column to the right of the name. The plaster wall shows equally on both sides.
   *(Verified: greeting/heading/glance/doors left edges measured at 272px @1440, 192px @1280,
   16px @390 — all equal.)*
2. **Shopping card:** its preview shows up to three **named** items (e.g. "Free Range Eggs (12)",
   "Oat Milk (1L)", "Rolled Oats (1kg)") then "and N more" — **no blank rows**.
3. **The name stands in the window's light** on the plaster, in the signature hand, as the loudest
   thing in the room (unchanged).
4. **Companion:** the global Companion (FloatingAssistant) is present as before; there is **no**
   inline Companion card or panel on Home.
5. **Mobile (≤520px):** the arrival stacks full-width within the gutters; the orchard window (two
   bays, portrait) stays the hero; the sill is the boundary; content reads in one column. *(Verified
   in the 390px capture.)*
6. **The rest of the room is unchanged:** glance loading skeletons, the unanchored-planner state,
   honest empties, the one lit primary action, the doors run, and "See your full dashboard".
7. **Reduced motion:** with OS "reduce motion" on, the greeting is simply present (the signature
   reveal is not applied) — unchanged by this pass.

---

## 12. User Acceptance Evidence

- **Typecheck:** `npx tsc --noEmit` → **0 client errors**. The remaining errors are all
  pre-existing `server/tests/*`, `server/scripts/*` and `server/intelligence/handlers/*` failures,
  unrelated to this change and present at the rollback snapshot.
- **Adoption gate:** `npm run adoption:check` → **100 passed · 0 notices · 9 failed** — the 9
  failures are the pre-existing set carried at the UINORTH1 baseline; this change touches no
  client-side building block, so it adds zero new failures and the owner-adoption counts are
  unchanged.
- **Production build:** `npm run build` → **exit 0**. The 4 warnings are pre-existing
  (`import.meta` in a CI/benchmark script; server bundle size) and unrelated.
- **Visual verification (live app):** the dev server (already running on `:5000`, real Postgres)
  was driven with Playwright under a demo session (`POST /api/demo/start`) and `/home` was rendered
  and read at **1440px, 1280px and 390px**. Evidence captured to the session scratchpad
  (`home-desktop-1440.png`, `home-mobile-390.png`, `room-desktop.png`, `verify-desktop.png`).
  Findings: (a) the arrival's left edge now equals the glance/doors edge at all three widths
  (measured 272 / 192 / 16 px) — the balance fix confirmed; (b) the Shopping preview rendered
  **blank rows** before the § 1.3 fix and renders the real item names after it — the DOM read back
  `["Free Range Eggs (12)", "Oat Milk (1L)", "Rolled Oats (1kg)", "and 8 more"]`; (c) mobile stacks
  coherently with the portrait orchard window as hero. **This defect was invisible to typecheck and
  the test suite; only running the room surfaced it.**
- **Diff:** 1 client file; **+34 / −38**; both code changes carry `HOMEROOM1` citation comments.
- **Home Owner sign-off:** *pending* — this report is the request for it. Under the Home Owner
  Architecture, approval is recorded here (or in the Adoption Register) when given; until then
  HOMEROOM1 is *implemented and awaiting review*, not *accepted*.

---

*HOMEROOM1 completes the Home room by refining, not adding: it returns a bay reserved for a
retired card to air and view, joins the household's welcome to the one spine the rest of the room
already stands on, and — found only by walking into the room and looking — gives the household back
the real names of the things on their shopping list where three blank lines used to sit. So the
front door of the platform reads as one calm, cared-for home. The
care continues (Principle 11).*
