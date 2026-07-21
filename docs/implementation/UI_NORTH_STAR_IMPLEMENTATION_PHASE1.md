# UI North Star Implementation — Phase 1

**Document ID:** `UINORTH1`
**Date:** 2026-07-20
**Status:** Implemented (code) · **Waiting for User** (Home Owner review)
**Rollback identifier:** `rollback/UINORTH1-ui-north-star-phase1-20260720` → `be381a894b99b2e87935f7d3a18c7d3f38617e0f`
**Author of record:** Colin Clapson (owner / Home Owner) · implemented by Claude under the Engineering Workflow
**Session run file:** [`.engineering/session/runs/UINORTH1_UI_North_Star_Implementation_Phase1.md`](../../.engineering/session/runs/UINORTH1_UI_North_Star_Implementation_Phase1.md)

---

## 1. What Phase 1 is

This opens the North Star UI programme. Its governing instruction — and the principle this
phase itself adds to `HOME_OWNER_ARCHITECTURE.md` — is that **completion is a release
milestone; refinement is continuous.** Phase 1 is therefore a *first measured pass*, not a
redesign, and it obeys the one method the whole Experience canon fixes for making *"every room
feel like part of the same house"*: **converge onto the existing canonical owners; never
redesign a room independently, and never add a variant beside an owner** (UIA §17;
`THA_EXPERIENCE_ARCHITECTURE.md` §17.10/PP12).

It delivers three things:

1. **A governance refinement** — Principle 11 of the Home Owner Architecture (continual care).
2. **A shared-layer consistency pass** at two canonical owners — the **loading state**
   (`Skeleton`) and the **empty state** (`EmptyState`) — so improvement propagates to every
   room by construction rather than room by room.
3. **An adoption ratchet** — the loading-state rival ceiling tightened to record the
   improvement permanently.

Because the work lands at shared owners, no room's content, behaviour, data, or ownership was
touched. **Zero business logic, zero schema, zero routes, zero state.**

---

## 2. Experience Constitution Check (§ 18.2 — answered before design)

Run first, because it is the only gate that can fail a change that is correct in every
particular and wrong in conception (`GOVERNING_EXPERIENCE_ARCHITECTURE.md`).

- **Hospitality (§3.1):** Loading now shows the *shape* of what is arriving rather than a
  spinning void; an absence is named in one calm sentence with one next step. Both are acts of
  welcome — the household is told what is coming and what they can do, never made to wait at a
  blank wall. ✅
- **Outcome (§3.5):** *Increases confidence.* A content-shaped skeleton says "your diary is
  arriving, here"; a semantic empty state says truthfully whether a thing is empty, filtered,
  or unavailable. Neither adds a task. ✅
- **Weight (GEA2):** The rooms are **lighter**, not heavier — spinner theatre and a literal
  "Loading…" were removed, not added to. No new capability, no new surface. ✅
- **Voice (GEA8/GEA9):** Rooms still only *report*. No copy was authored; the one place with
  existing voice (Diary's Progress empty) had its words **preserved verbatim** — only the
  container was re-homed. ✅
- **Ownership (§7.4/GEA21–22):** Every element rendered is a room's own fact through its own
  owner. No observation or interpretation was added. ✅
- **Agency (GEA23):** Nothing decides on the household's behalf; no default was changed. ✅
- **Restraint (GEA11/13/15):** No colour, motion, score, streak or ornament introduced. The
  skeletons loop no more than the canonical `Skeleton` already does; reduced-motion is
  unaffected (the owner is gated at both layers, register row 31). ✅
- **Layer (GEA20):** This change names the principle above it (PP12 / new Principle 11) and the
  owners beside it (UIA §12 loading, §17 empty-state ownership). Work flowed **downward only**:
  the governance refinement is at the Constitution/Architecture layer; the code change is at the
  Implementation layer and originates no law. ✅

---

## 3. The changes, in detail

### 3.1 Governance — `HOME_OWNER_ARCHITECTURE.md` Principle 11

Added Principle 11: *"Good enough is never a reason to stop improving… Completion is a release
milestone; refinement is continuous,"* establishing THA as a **lived home rather than a finished
product.** Written in the house's voice; it **moves no rule** — it cites the restraint and
consistency laws it lives under (GEA11/13/15, Principle 6, Principle 9) and names the
already-recorded reasoning it makes permanent (`PX1`'s *"defects of adoption, not of
knowledge"*; `LIVINGHOME1`'s *the house holds still, the life moves*; premium as *care taken on
the household's behalf*, EXP §17). Governance only.

### 3.2 Loading state → the canonical `Skeleton` owner (UIA §12 "shape before spin")

Route- and section-level spinner-theatre and the literal word "Loading…" — both **retired** by
UIA §12 — converged onto content-shaped skeletons, matching the house idiom already documented
on `plant-diversity-page` (PROD2) and `contact-page` (`aria-busy` + `aria-label` + `Skeleton`).
**Sanctioned in-control spinners (a `Loader2` inside a working button) were left untouched** —
that is the mark UIA §12 and register row 11 assign to Loader2, not Skeleton.

| File | Was | Now |
|---|---|---|
| `pages/food-comparison-page.tsx:194` | centred `Loader2` (result) | card-shaped `Skeleton` |
| `pages/supermarkets-page.tsx:122` | centred `Loader2` (store list) | header + card-grid `Skeleton` |
| `pages/food-diary-page.tsx:1765` | centred `Loader2` (daily log) | row-shaped `Skeleton` ×4 |
| `pages/quick-meal-page.tsx:390` | centred `Loader2` (meal) | builder/preview column `Skeleton` |
| `components/food-knowledge-modal.tsx:45` | `Loader2` + title `"Loading…"` | section-shaped `Skeleton`; title shows the food name/slug, not the word |
| `components/PantryKnowledgeHub.tsx` (×3) | `DetailShell title="Loading…"` | `title={<Skeleton …/>}` (title widened `string`→`ReactNode`, a safe widening) |

### 3.3 Empty state → the canonical `EmptyState` owner (UIA §17)

Genuine section-level hand-rolled "nothing here" treatments converged onto the owner and its
three-truth vocabulary (`empty` | `filtered` | `unavailable`):

| File | Was | Variant |
|---|---|---|
| `pages/products-page.tsx:1174` (Analyser) | hand-rolled centred block, `Store` icon | `filtered` (products exist; the retailer filter hides them) |
| `pages/products-page.tsx:1883` (Analyser) | hand-rolled centred paragraph | `empty` (nothing chosen to compare yet) |
| `pages/food-diary-page.tsx:1946` (Diary) | hand-rolled centred block, `TrendingUp` | `empty` — **copy preserved verbatim** (PRESENCE1); `data-testid` preserved |

### 3.4 Adoption ratchet

`npm run adoption:record` tightened the loading-state rival ceiling **`Loader2` 175 → 169** to
record the removed spinners permanently (a future re-addition now fails CI at 169). The record
also **incidentally corrected two pre-existing stale ceilings** the gate had been carrying loose
— raw `<button>` **449 → 442** and `dark:` utilities **679 → 677** — which are *not* this
workstream's doing and are named here rather than claimed: the record measures the whole tree,
and both were already below their recorded ceilings before Phase 1. Ratchets only tighten; no
ceiling was raised.

---

## 4. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ No duplicate ownership — every element renders through its existing owner
  (Skeleton, EmptyState, Store/TrendingUp icons via lucide row 38). No new owner created.
☑ No duplicate business logic — none touched; loading/empty are presentation only.
☑ No duplicate state — no store, cache, or record added or moved.
☑ UI consumes published state only — no change to what any room reads; the isLoading/
  isPending flags already owned by each query are rendered differently, not sourced differently.
☑ Extends existing architecture — converges onto canonical owners; adds no pattern, no token,
  no component, no CSS class. (UIA §17 "retire on introduction" is satisfied trivially: nothing
  was introduced.)
☑ Existing experience owners unchanged — no room's content, behaviour, or ownership moved.
☑ Companion untouched — orchestration layer not reached.
```

## 5. Home Owner Compliance

The eight Decision Framework questions (`HOME_OWNER_ARCHITECTURE.md`), and Principle 11:

1. **Does this feel welcoming?** Yes — shape-before-spin and a calm named absence are more
   welcoming than a spinning void or a blank paragraph.
2. **Does this belong in the house?** Yes — it is the house's *own* loading and empty idioms,
   used in more rooms.
3. **Is this beautiful enough?** It removes two of software's tells (the full-page spinner, the
   word "Loading…") and replaces them with the material the house already uses.
4. **Does this create unnecessary noise?** No — it removes noise (motion, a redundant word).
5. **Does this preserve calm?** Yes — fewer spinning elements; loading is now silent.
6. **Does this feel timeless?** Yes — skeletons and named absence are the house's enduring
   language, not a trend.
7. **Would someone enjoy spending time here?** The waiting moments are quieter and more honest.
8. **Does this strengthen hospitality?** Yes — the household is told what is arriving and what
   they can do.

**Principle 11 (continual care)** is the frame: this phase does not claim the rooms are
finished — it claims each touched surface is left *at least as good as it was found*, and names
the rest as measured, staged work (§ 11, Scope Lock). **This report is submitted for Home Owner
approval; an unrecorded approval is not an approval** (Owns table, clause 1). No new aesthetic
*character* was introduced, so no new-character approval is required — only confirmation that
the convergence meets the bar.

## 6. AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ No new AI capability — none defined, registered, or consumed.
✓ Companion unchanged — reasoning, voice, grounding (INT17), selection (INT20), and
  conversation state untouched. The Companion remains the orchestration layer.
✓ Intelligence Platform unchanged — no spine component reached.
✓ Capability Registry / Intent Engine unchanged — no binding, intent, or path added.
✓ No fabrication — loading shows shape (not fake content); empty states state the truth
  (empty vs filtered vs unavailable) and invent nothing.
```

## 7. Experience & UI Governance Compliance (condensed)

- **UX Governance Checklist + Premium Standard (EXP §18/§17):** Home unharmed · one primary
  action per surface unchanged · information hierarchy unchanged · **craft completeness** raised
  (PP1 — loading and empty states now *designed*, via their owners, on the touched surfaces) ·
  **refinement not accretion** (PP12 — converged on the canonical pattern, added no variant) ·
  no dark pattern, no ceremony, no manufactured urgency.
- **UI Governance Checklist (UIA §18):** one visual language · canonical ownership respected ·
  **states designed** (§12 — shape before spin, silent loading, literal "Loading…" retired on
  the touched surfaces) · zero raw values in surfaces (skeleton sizing uses the spacing scale;
  no colour, shadow, or radius literal introduced) · motion vocabulary untouched · visual
  honesty preserved.
- Any conflict resolves upward to the Experience Architecture; none arose.

## 8. Adoption Register Compliance

- `npm run adoption:check` → **100 passed · 0 notices · 9 failed**. The **9 failures are
  pre-existing and identical at the rollback tag** — proven by stashing this workstream and
  re-running the gate at `be381a89` (same 9). They are unrelated orphan/floor conditions in
  modules Phase 1 never touched (`SpellSuggestions`, `UltraProcessedNoticeModal`,
  `whole-food-selector`, `food-confidence`, `json-utils`, `source-helpers`, the `quantity-string`
  and `tone` floors, and `food-knowledge-modal` itself — see below). **Phase 1 adds zero new
  failures and cleared the prior "2 ceilings can be tightened" notice.**
- **Owner adoption rose:** `Empty state` 11 → 12 importers; `Loading state` 35 importers
  (Skeleton gained 5 new consumer files). Both counts are measured live — the register carries
  no adoption numbers in prose by design.
- **`food-knowledge-modal.tsx` is a pre-existing 0-importer orphan** (dead code — it fails the
  orphan gate at the tag too). Its loading conversion is therefore a *latent* improvement: it
  makes the module better if ever adopted, and harms nothing today. This is recorded rather than
  hidden.

## 9. Product Registry Compliance

No Product Knowledge Registry entry changed: no page, route, capability, journey, claim, or
setting was added, removed, or renamed. The set of rooms, what they do, and what they show is
identical — only the loading and empty *presentation* of a few surfaces changed. **No registry
edit is due** (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Rule KC15 — nothing affected).

## 10. Definition of Done (against the brief)

- **Every modified screen complies with governing architecture** — ✅ (§§ 4–9).
- **Every visible element has a canonical owner** — ✅ the converted loading/empty elements now
  render through `Skeleton` / `EmptyState`; in-control spinners keep their sanctioned `Loader2`.
- **Visual consistency measurably improved** — ✅ measured: `Loader2` population ratcheted
  175→169; literal "Loading…" removed from the two live surfaces that carried it; `Skeleton`
  and `EmptyState` adoption up; **rooms now share one loading and one empty idiom on the touched
  surfaces.**
- **Desktop layouts use available space elegantly / mobile consistent** — ⚠️ *unchanged by
  design.* Phase 1 did not touch layout, breakpoints, or the desktop-scaling owners; the shell
  already owns responsive layout (`app-shell`, `pageContainerClass`, `use-adaptive-density`).
  Desktop-scaling refinement is named as staged work (§ 11) — not claimed as done.
- **Animations subtle and purposeful** — ✅ *reduced* motion (fewer spinners); no animation
  added.
- **One coherent home, not a collection of pages** — ✅ advanced (shared owners), not completed
  (continuous — Principle 11).

## 11. Scope Lock

**In scope, done:** Principle 11; loading convergence in 6 files; empty-state convergence in 3
places across 2 rooms; the adoption ratchet.

**Explicitly OUT of scope for Phase 1, and why — the measured, staged backlog (Principle 11):**

- **Inline "no results" micro-empties** (~25 sites across planner/cookbook/shopping panels and
  modals, e.g. `PlannerMealPickerPanel`, `create-meal-modal`, `templates-panel`,
  `meals-page` search blocks). These are lightweight-by-design one-liners inside dropdowns and
  panels; the `EmptyState` owner has a `compact`/`filtered` treatment for them, but converting
  ~25 sites **blind, without visual verification, in a production app** is the exact unmeasured
  sweep the canon forbids. Inventoried, deferred to a subsequent increment.
- **The three `meals-page` "Searching…" blocks** (`:4004/:4849/:5164`) — borderline section
  spinners with text; deferred with the above for the same reason (same file, same visual risk).
- **Spacing / section-header rhythm pass** — measured but **not swept**: a blind spacing restyle
  cannot be verified here and would risk regressions across rooms. The loading/empty skeletons
  added *do* use the house's spacing scale, so rhythm consistency improved incidentally; a
  dedicated pass is staged for owner-directed, visually-verified work.
- **Desktop scaling / empty-Home / transitions / per-room polish** across all 12 rooms — the
  bulk of the brief's dimensions. These are the continuous programme (Phase 2+), not a single
  session's work, and are deliberately not claimed here.

**Not touched at all:** business logic, schema, routes, state, the Companion/Intelligence spine,
any room's content or ownership, any colour/token/motion/CSS.

## 12. Data Impact

**None.** No schema, migration, table, column, seed, or row. No household data is read, written,
derived, or exposed. No API added or changed. The change is presentation-only over query flags
(`isLoading`/`isPending`) each room already owned.

## 13. Trust Check

- **Visual honesty (UIA §14):** improved — a content-shaped skeleton is a more honest promise of
  what is arriving than a spinner; `EmptyState`'s variant discriminator makes it *structurally
  impossible* to say "you have nothing" when the truth is "the filter hides it."
- **No fabrication:** no invented content, no precision theatre, no manufactured urgency.
- **No safety surface touched:** allergen/restriction warnings, the analyser verdict, and every
  safety path are untouched.
- **No copy authored:** the one existing-voice surface (Diary Progress) kept its words verbatim.

## 14. Rollback Plan

- **Tag:** `rollback/UINORTH1-ui-north-star-phase1-20260720` → `be381a894b99b2e87935f7d3a18c7d3f38617e0f`.
- **Undo:** `git checkout rollback/UINORTH1-ui-north-star-phase1-20260720`.
- **Coverage:** the tag covers **committed state only**. At tag time the working tree was clean
  apart from `.engineering/session/CURRENT.md` (the session-tooling heartbeat, not authored
  here); the tag does not cover that one file. All Phase 1 edits are ordinary tracked-file
  modifications with no data component, so the tag fully restores them. No untracked files were
  created except this report and the session run file.
- **Granular undo:** any single conversion can be reverted in isolation — each is a self-contained
  edit marked with a `UINORTH1` comment.

## 15. Manual verification steps

Automated (done): `npx tsc --noEmit` → **no client errors** (pre-existing errors are all in
`server/tests/*`, unchanged); `npm run adoption:check` → **0 new failures**; production build
(see § 16).

To confirm visually (owner / reviewer):

1. **Supermarkets** (`/supermarkets`) — hard-reload: the store list should reveal a header bar
   and a card-grid of skeletons, then the real stores — no centred spinner.
2. **Food comparison** (`/compare`) — run a comparison: a card-shaped skeleton appears while the
   result loads.
3. **Diary** (`/my-diary`) — Daily Log tab on first load shows row skeletons; **Progress** tab
   with fewer than two days of data shows the canonical empty card (the "When things drift…"
   copy, unchanged, in the dashed card).
4. **Quick meal** (`/quick-meal?...`) — loading an existing meal shows a builder/preview skeleton.
5. **Analyser** (`/analyser`) — search, apply a retailer filter that matches nothing: the quiet
   "filtered" empty appears; open Compare with nothing selected: the "empty" card appears.
6. **Pantry Knowledge / Food-knowledge modal** — opening a food detail shows a skeleton title and
   skeleton body rather than the word "Loading…". *(Note: `food-knowledge-modal` is currently a
   0-importer orphan — verify via any surface that still mounts the Pantry hub detail.)*
7. **Reduced motion** — with OS "reduce motion" on, confirm skeletons do not distract (the
   `Skeleton` owner's pulse is the platform's one motion vocabulary; no new motion was added).

## 16. User Acceptance Evidence

- **Typecheck:** client clean; server-test errors pre-existing and unchanged (proven at tag).
- **Adoption gate:** `100 passed · 0 notices · 9 failed`; the 9 proven pre-existing by stash at
  `be381a89`; owner adoption up (Empty 11→12, Loading +5 consumers); Loader2 ceiling ratcheted
  175→169.
- **Production build:** `npm run build` → **exit 0**. `script/build.ts` runs the vite client
  build (fresh `dist/public`) then the server bundle; both succeeded. The 4 warnings are
  pre-existing (`import.meta` in a CI script; server bundle size) and unrelated to Phase 1.
- **Diff:** 7 client files + `HOME_OWNER_ARCHITECTURE.md` + the two generated adoption-register
  files; **+96 / −37**; every code change carries a `UINORTH1` citation comment.
- **Home Owner sign-off:** *pending* — this report is the request for it. Under the Home Owner
  Architecture, approval is recorded here (or in the Adoption Register) when given; until then
  Phase 1 is *implemented and awaiting review*, not *accepted*.

---

*Phase 1 makes the house quieter while it waits and more honest when it is empty, in more of its
rooms, using only the house's own materials. It does not claim the house is finished — Principle
11 is the point: the care continues.*
