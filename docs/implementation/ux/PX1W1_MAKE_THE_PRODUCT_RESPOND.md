# PX1-W1 — Make the Product Respond

**Status:** Implemented.
**Date:** 2026-07-12. **Owner:** Colin Clapson.
**Rollback:** tag `rollback/PX1-W1-make-the-product-respond-20260712` (@ `8ca472bb`, the PX1-W0 commit) · `refs/snapshots/PX1W1_ROLLBACK` (`f476dc3` — the pre-existing dirty tree, preserved).

**Parent:** [`PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) § 10, workstream **PX1-W1**.
**Predecessor:** [`PX1W0_STOP_MISINFORMING_THE_HOUSEHOLD.md`](./PX1W0_STOP_MISINFORMING_THE_HOUSEHOLD.md) — complete.

**Governing architecture (cited, never restated):**
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2 — §17 Premium Principle 4 *the product responds to touch*) ·
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2 — §11 *reduced motion is a guarantee, not an enhancement*; §12 *interaction feedback*; §17 *retire-on-introduction, one owner per visual concern*) ·
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md).

---

## 1. What this workstream was for

PX1 found that **THA's design system is inert.** Hover, press, dialog sizing,
safe-area clearance and reduced motion were all *specified* — in class names every
control consumes, in CSS call sites already written, in a helper whose own
doc-comment promised it — and **none of them executed.** An un-ported scaffold left
the platform's primary interaction feedback wired to CSS that did not exist.

W1 is the subset of PX1 that makes those specifications real. Its character is the
opposite of a redesign: **every change either defines something that was already
consumed, or activates something that was already written.** No new UX pattern, no
new visual language, no surface looks different at rest. What changed is that the
product now *responds* — to a pointer, to a press, to a phone's notch, to an OS
accessibility preference, and without covering its own navigation while doing so.

**Scope discipline.** W1 implements PX1 §10's W1 table (1.1–1.8) and nothing else.
Defects on surfaces W1 touched that belong to later workstreams — the touch floor
(W2.3), the dialog/drawer/sheet convergence into one `Overlay` (W4.10), the
Companion's hand-rolled panel becoming a real Radix dialog (W4.2) — were left
alone and are listed in § 6.

---

## 2. Findings addressed

All eight W1 items, and the nine findings they resolve.

| PX1 §10 | Finding | What was broken | What is true now |
|---|---|---|---|
| 1.1 | `fnd-px-dead-elevation` | `ui/button.tsx` and `ui/badge.tsx` put `hover-elevate` / `active-elevate-2` in their **base** variants, and their variants consumed `--primary-border`, `--secondary-border`, `--destructive-border`, `--button-outline` — none of which existed anywhere. Every button, badge and clickable card in THA was inert on hover and on press. | `index.css` defines the elevation system (a `::after` tint overlay that composes with any variant background and inherits the control's radius, with the `.no-default-*` opt-outs the 18 existing call sites already used) and all five border tokens, in light and dark mode. Every control lights up on hover and confirms on press — through the classes it was already wearing. |
| 1.2 | `fnd-px-no-viewport-fit` | `client/index.html` lacked `viewport-fit=cover`, so `env(safe-area-inset-*)` returned its 0px fallback on iOS — disabling all 12 already-correct safe-area call sites, including the bottom nav's own. `maximum-scale=1` also blocked pinch-zoom (WCAG 1.4.4). | One attribute activates all twelve call sites. `maximum-scale=1` is dropped; households can zoom. |
| 1.3 | `fnd-px-dialog-no-max-height` | `ui/dialog.tsx`'s centre-translated fixed content had no `max-h` and no overflow, so on a phone with the keyboard open a tall form dialog's submit button was off-screen and **unscrollable-to**. | The base gains `max-h-[calc(100dvh-2rem)] overflow-y-auto` — all 69 dialogs inherit it. |
| 1.3 | `fnd-px-dialog-foundation-is-noop` | `getDialogPresentationClass` returned `""` for all three presentations; the mobile sheet was fully specified in prose and unimplemented. Adopting the foundation changed nothing. | `getDialogPresentationClass("sheet")` returns the full-viewport-on-mobile / centred-modal-on-desktop classes that `camera-modal.tsx` had already proven in production — and `camera-modal` now **consumes** the foundation instead of carrying its own copy. The foundation is no longer a no-op: adopting it does what its prose always said. |
| 1.4 | `fnd-px-no-reduced-motion` | Zero `prefers-reduced-motion` anywhere. `prefersReducedMotion()` existed with 0 consumers, its module's doc-comment claiming a respect it never enforced. 11 files ran ungated `framer-motion`. `BadAppleWarningModal` fired `appleShake` on a **warning** — motion-for-attention, which UIA §11 bans outright. | One `@media (prefers-reduced-motion: reduce)` block in `index.css` gates every CSS animation and transition. `MotionConfig reducedMotion="user"` in `App.tsx` gates all 11 framer-motion files in one place. `companion-delight.ts` finally consumes its own `prefersReducedMotion()`. The warning modal no longer shakes for anyone — the gentle entrance remains, itself gated. |
| 1.5 | `fnd-px-fab-covers-nav` | The Companion FAB sat at `bottom-6 right-6 z-50` — the BottomNav's own z, painted later — covering the last nav item (Analyser). `meal-detail-page`'s floating "Save Changes" sat at the FAB's exact coordinates, occluded while editing. | The FAB clears the nav's reserved zone (`safe-area + 5rem`) and yields z to it (`z-40`). Meal-detail's Save clears the nav zone and sits left of the FAB. Tapping Analyser opens the Analyser; a household editing a recipe can see Save. |
| 1.6 | `fnd-px-meal-detail-dead-spacing` | Four meal-detail components carried verbatim copies of the density ladder, each interpolating `space-y-${gapClass}` where `gapClass` was `"gap-2"` — emitting the non-existent class `space-y-gap-2` at seven sites. The flagship meal surface had zero vertical rhythm. | The ladder has one owner, `lib/density-tokens.ts`, whose class strings are complete and literal (so Tailwind's content scan sees them). The four copies are deleted. Values are unchanged — only the spacing that was always intended now actually renders. |
| 1.7 | `fnd-px-undefined-utilities` | `no-scrollbar` was consumed 13× and defined nowhere — plus one `scrollbar-none` (`product-picker-sheet.tsx`), the same defect under a second name. Scrollbars the designer meant to hide were visible. | All 14 sites now use `.scrollbar-hide` — which `index.css` **already defined**. No definition was added; the defined owner was adopted and the undefined names retired. |
| 1.8 | `fnd-px-toast-over-nav` | The toast viewport rose from `bottom-6 z-[100]` — inside the nav's strip, painting over it while visible. | The viewport clears the nav's reserved zone (`safe-area + 5.5rem`). `z-[100]` is kept deliberately: failure toasts (PX1-W0) fire from inside dialogs whose overlay is `z-50` — dropping below it would hide the failure the toast exists to show. |

---

## 3. Components adopted

Per PX1's own thesis — the defects are defects of **adoption** — W1 created almost
nothing. Where a canonical implementation existed, it was adopted:

| Adopted | Where it already was | What now uses it |
|---|---|---|
| **`.scrollbar-hide`** | Defined in `index.css` all along, while 14 call sites consumed undefined rivals. | All 13 former `no-scrollbar` sites + the one `scrollbar-none` site. |
| **`getDialogPresentationClass("sheet")`** (`ui/dialog-foundation.ts`) | The foundation existed but returned `""`; the classes it should have returned were proven in `camera-modal.tsx`. | The foundation now owns those classes; `camera-modal` consumes it rather than carrying its private copy. |
| **`prefersReducedMotion()`** (`lib/companion-delight.ts:63`) | Existed with **0 consumers**. | `variantForInteraction()` — every companion-delight animation now falls back to the module's calmest variant under reduced motion. |
| **`MotionConfig reducedMotion="user"`** | framer-motion's own first-class support, unused. | Mounted once in `App.tsx`; gates all 11 framer-motion files. No custom gating was invented. |
| **The five `--*-border` tokens' wiring** | `tailwind.config.ts` had mapped `primary.border → var(--primary-border)` (etc.) since the scaffold; the variables were simply never defined. | `index.css` now defines them (light + dark), completing a chain that was three-quarters built. |

**One new owner was created**, for a concern PX1 §5 showed had four rival copies:

| New owner | What it owns | Promoted from (the seed) |
|---|---|---|
| `client/src/lib/density-tokens.ts` — **`densityClasses()`** | The adaptive-density class ladder (padding / vertical rhythm / title / text) for meal-detail surfaces. Class strings are complete literals — the file's header forbids interpolating fragments, which is the exact mechanism that produced the bug. | The ladder copy-pasted verbatim into `MealTrustSummary`, `MealFamilyConfidence`, `HouseholdAdaptationsSummary`, `SimplyBetterChoicesPanel` — PX1 §5 records that the copy-paste is *how* the `space-y-gap-2` bug replicated seven times. |

## 4. Components retired

Per UIA §17 (*retire-on-introduction* — name the predecessor, migrate every
consumer, delete it in the same change):

| Retired | Replaced by | Consumers migrated |
|---|---|---|
| The **four copy-pasted density ladders** in the meal-detail components (with their seven dead `space-y-${gapClass}` interpolations) | `lib/density-tokens.ts` | All four components; each file's grid/label rungs, which are genuinely its own, stay local. |
| `camera-modal.tsx`'s **private full-viewport sheet class string** | `getDialogPresentationClass("sheet")` — the same classes, now owned by the foundation | The one consumer (`camera-modal` itself); `p-0 overflow-hidden` stays local because the camera manages its own edges. |
| The **undefined utilities `no-scrollbar` (13 sites) and `scrollbar-none` (1 site)** | `.scrollbar-hide` (already defined) | All 14 sites. The undefined names now have zero consumers and no definition — they are gone, not deprecated. |
| **`appleShake` on the warning modal** (`BadAppleWarningModal.tsx`) | Nothing — UIA §11 bans motion-for-attention on a warning. The entrance `appleBounce` remains, gated by the reduced-motion block. | The one consumer. The keyframe itself stays in `index.css` (its other class, `.apple-shake`, is dead-CSS cleanup belonging to W4.7's hygiene sweep, not W1). |

**Nothing else was retired, and that is deliberate.** The `hover-elevate` *classes*
stay in `ui/button.tsx`/`ui/badge.tsx` exactly where the scaffold put them — W1's
finding was never that the classes were wrong, only that they were undefined. The
535 raw `<button>`s that bypass them are `fnd-px-button-primitive-minority` (W4.6).

---

## 5. What changed, by file

**New (2):** `lib/density-tokens.ts` · this document.

**Changed (25):**

| File | Change |
|---|---|
| `client/index.html` | `viewport-fit=cover` added; `maximum-scale=1` dropped. |
| `client/src/index.css` | The five `--*-border` tokens + `--elevate-1/-2` (light & dark); the `.hover-elevate`/`.active-elevate-2` system with its `.no-default-*` opt-outs; the `prefers-reduced-motion` media block. |
| `client/src/App.tsx` | `MotionConfig reducedMotion="user"` around the app. |
| `client/src/components/ui/dialog.tsx` | Base gains `max-h-[calc(100dvh-2rem)] overflow-y-auto`. |
| `client/src/components/ui/dialog-foundation.ts` | `getDialogPresentationClass("sheet")` returns the proven sheet classes. |
| `client/src/components/camera-modal.tsx` | Consumes the foundation's sheet presentation. |
| `client/src/components/ui/toast.tsx` | Viewport clears the nav zone; z rationale recorded in place. |
| `client/src/components/conversation/FloatingAssistant.tsx` | FAB → `z-40`, above the nav's reserved zone. |
| `client/src/pages/meal-detail-page.tsx` | Floating Save → `z-40`, nav-clear, left of the FAB. |
| `client/src/components/BadAppleWarningModal.tsx` | `appleShake` removed from the warning. |
| `client/src/lib/companion-delight.ts` | `variantForInteraction` honours `prefersReducedMotion()`. |
| `client/src/components/meal-detail/` ×4 | Density ladders → `densityClasses()`; dead `space-y-gap-*` gone. |
| 12 files (`dashboard`, `food-diary`, `meals`, `pantry`, `partners`, `plant-diversity`, `products`, `profile`, `shopping-list`, `shopping-workspace`, `weekly-planner` pages; `PlannerIntelligenceStrip`) | `no-scrollbar` → `scrollbar-hide` (the 13 sites). |
| `client/src/components/product-picker-sheet.tsx` | `scrollbar-none` → `scrollbar-hide` (the 14th, found during W1). |

---

## 6. Remaining PX1 findings

**W1 closes 9 findings** (3 P1 · 4 P2 · 2 P3). With W0's 10, **19 of PX1's 60 are
closed; 41 remain**, unchanged and unstarted.

**P1 — 12 of 20 remain.** Closed by W1: `fnd-px-dead-elevation`,
`fnd-px-dialog-no-max-height`, `fnd-px-fab-covers-nav`. Still open, and these are
the ones a household feels next:

- `fnd-px-invisible-destructive-controls` (W2.2) — an invisible delete still sits at
  the end of every pantry row and fires on contact.
- `fnd-px-shop-mode-row-under-nav` (W2.1) — in the supermarket, the last item on the
  list is still under the nav. (W1's toast/FAB fixes do **not** fix this: Shop mode
  escapes `.main-safe` via `fixed inset-0`, which is a layout defect, not a z one.)
- `fnd-px-no-empty-state-owner` (W4.8) · `fnd-px-forms-unlabelled` (W4.1) ·
  `fnd-px-icon-buttons-unnamed` / `fnd-px-keyboard-unreachable` /
  `fnd-px-companion-not-a-dialog` (W4.2) · `fnd-px-no-route-splitting` (W3.2) ·
  `fnd-px-no-compression` (W3.1) · `fnd-px-home-fetches-whole-cookbook` /
  `fnd-px-meals-invalidation-storm` (W3.3) · `fnd-px-cookbook-search-refetch` /
  `-jank` (W3.5).

**P2 — 21 of 25 remain** (closed: `fnd-px-dialog-foundation-is-noop`,
`fnd-px-no-reduced-motion`, `fnd-px-no-viewport-fit`,
`fnd-px-meal-detail-dead-spacing`). **P3 — 8 of 10 remain** (closed:
`fnd-px-undefined-utilities`, `fnd-px-toast-over-nav`).

**Three boundaries W1 touched and deliberately did not cross:**

- The dialog foundation is now real, but its **adoption** across the 69 dialogs and
  the Dialog/Drawer/Sheet convergence into one viewport-switching `Overlay` is
  **W4.10**. W1 made adoption *worth doing*; it did not perform it.
- The FAB no longer covers the nav, but the Companion panel is still a hand-rolled
  fixed div with no focus trap — `fnd-px-companion-not-a-dialog` (**W4.2**).
- The elevation system restores hover/press on every control that wears the
  canonical classes; the ~half of THA's controls that are raw `<button>`s
  (`fnd-px-button-primitive-minority`, **W4.6**) remain outside it until they adopt
  the primitive.

**The Adoption Register (PX1 §6 / W5.1) is still not built.** W1 changed three of
its rows — Motion vocabulary and Token definitions (☠️ → the owners now execute),
Dialog (☠️ → the foundation is no longer a no-op, still barely adopted) — and
created one unregistered owner of its own (`density-tokens`), which is precisely
the failure mode PX1 §4 describes. W5.1 remains the workstream that ends it.

---

## 7. Architecture Compliance

- **Canonical ownership maintained.** W1 introduces no second owner of anything:
  `density-tokens` replaces four copies (deleted in the same change); every other
  change defines or activates an owner that already existed.
- **Retire-on-introduction honoured** (UIA §17): §4's table — predecessors named,
  consumers migrated, deletions in the same change.
- **No new experience principles, no new UX patterns, no redesign.** No surface
  looks different at rest; what changed is response — hover, press, scroll, notch,
  reduced motion.
- **EXP §17 Premium Principle 4 / UIA §12** — the product responds to touch, via
  the classes it was already wearing.
- **UIA §11** — reduced motion is now the guarantee the law said it was, at both
  layers (CSS media block; framer-motion `MotionConfig`).
- **Experience prevails over UI where they meet** — the toast keeps `z-[100]`
  because being *heard about a failure* (EXP §14, W0's work) outranks strict layer
  tidiness; the rationale is recorded at the call site.
- **Intelligence architecture untouched.** No capability, binding, handler, engine
  or prompt was changed. W1 is client-only: `server/` is not in the diff.

### Definition of Done
- **Success:** every Button/Badge/clickable Card responds on hover and press; safe
  areas are live on notched phones; every dialog scrolls within the viewport; the
  sheet presentation is real; reduced motion is honoured end-to-end; the FAB, the
  meal-detail Save and toasts no longer contend with the nav. **Verified — § 8.**
- **Must not break:** resting appearance of every surface (tokens only add
  hover/press/border states); the 18 existing `.no-default-*-elevate` opt-outs
  (the CSS honours them); dialogs shorter than the viewport (unchanged); the
  camera modal's full-bleed mobile behaviour (same classes, new owner).
- **Manual test steps:** § 8's assertions are the executable form.

### Product Registry Impact
- **Registry affected: NO.** W1 adds no surface, route, page, dialog, capability,
  setting or claim. The same surfaces exist, reachable the same ways — they now
  respond. (PKR's Dialogs section enumerates dialogs as product surfaces; W1
  changed dialog *presentation mechanics*, not any dialog's existence or content.)
- Entries created: **NONE** · updated: **NONE** · retired: **NONE**
- Product knowledge written into a prompt, template, or fallback string: **NO**

### Data Impact
- Reads existing data: **NO** · Writes new data: **NO** · Changes meaning of
  existing data: **NO** · Requires backfill: **NO**. W1 is presentation-layer only.

### Trust Check
- **Could this mislead the user?** No. The nearest risk is the opposite one W0
  faced: interaction feedback that *over-promises* (a hover tint on something that
  is not clickable). The elevation classes are consumed only by `ui/button`,
  `ui/badge` and explicitly-interactive cards — the same places the scaffold always
  put them — so nothing gained feedback that does not act.

---

## 8. Verification

| Gate | Result |
|---|---|
| `npm run typecheck:ci` | **PASS** — 168 known errors, baseline unchanged. **Zero** in `client/`. |
| `npx vite build` | **PASS** — 3.84 MB / 968 KB gzipped (unchanged; the payload findings are W3's). |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** — repository structure clean. |
| Built-artifact assertions (below) | **PASS — 12 / 12.** |
| Behavioural harness (Playwright, live app, demo household) | **PASS — 11 / 11.** |

Because W1's changes are token/attribute-level, the primary verification is
**against the built artifacts** — asserting that what the browser will actually
receive contains the rules the findings said were missing, and none of the dead
classes:

| # | Assertion on `dist/public` | |
|---|---|---|
| 1 | `.hover-elevate` rules present in built CSS | PASS |
| 2 | `.active-elevate-2` rules present | PASS |
| 3 | `--primary-border` / `--secondary-border` / `--destructive-border` defined | PASS |
| 4 | `--button-outline` / `--badge-outline` defined | PASS |
| 5 | `@media (prefers-reduced-motion: reduce)` present | PASS |
| 6 | `.scrollbar-hide` present | PASS |
| 7 | `viewport-fit=cover` in built `index.html` | PASS |
| 8 | `maximum-scale` absent from built `index.html` | PASS |
| 9 | `no-scrollbar` absent from built CSS **and** JS | PASS |
| 10 | `scrollbar-none` absent from built CSS and JS | PASS |
| 11 | `space-y-gap` absent from built CSS and JS | PASS |
| 12 | `space-y-2` / `space-y-3` (density-tokens' literal classes) generated by the Tailwind content scan | PASS |

Assertions 9–11 are the ones that prove retirement rather than addition: the
undefined utilities and the dead interpolated classes are not merely papered over —
no code ships that asks for them.

The behavioural harness (the W0 method — chromium, live dev server, a real demo
household at a 390×844 mobile viewport) then drove the running app and asserted
each finding's condition as the browser computes it. All eleven passed:

| # | What was asserted against the live app | Observed | |
|---|---|---|---|
| 1 | Demo household session established | `POST /api/demo/start → 201` | PASS |
| 2 | Served HTML carries `viewport-fit=cover` | present | PASS |
| 3 | `maximum-scale` gone from the served viewport meta | absent | PASS |
| 4 | A real control's `::after` paints on hover | `rgba(0,0,0,0)` → `rgba(0,0,0,0.04)` | PASS |
| 5 | FAB sits **above** the nav strip | FAB bottom 764px, nav top 785px | PASS |
| 6 | FAB yields z-order to the nav | computed `z-index: 40` (nav: 50) | PASS |
| 7 | Toast viewport clears the nav's reserved zone | computed `bottom: 88px` | PASS |
| 8 | No `space-y-gap-*` class anywhere in the DOM | 0 elements | PASS |
| 9 | `.scrollbar-hide` resolves | computed `scrollbar-width: none` | PASS |
| 10 | Dialog base clamps to viewport and scrolls | `max-height: 812px`, `overflow-y: auto`, 3000px content scrollable within 844px viewport | PASS |
| 11 | `prefers-reduced-motion: reduce` gates CSS animation | `appleShake` computes to 0.01ms × 1 iteration | PASS |

The harness itself is not committed, for W0's reason: it drives the app, it is not
part of it. Its assertions are reproduced above so they can be re-derived.

---

## 9. What was committed

**Only PX1-W1.** The working tree carried, and still carries, ~100 files of other
workstreams' uncommitted work (HNP1, HHP2/3, CBK2, PANTRY1, PLAN2, SHOP1, NTC-P2
and others). Four of the files W1 had to change also contained some of it:
`meals-page.tsx` (CBK2's cookbook `AmbientIntelligence`), `pantry-page.tsx`
(PANTRY1's `ingredientKey`), `plant-diversity-page.tsx` (HHP3's URL-driven tabs)
and `FloatingAssistant.tsx` (HHP3's nutrition-surface routing).

Those files were committed with **W1's hunks only** — in every case the
`scrollbar-hide` rename or the FAB reposition — and the other workstreams' hunks
were left uncommitted, exactly as they were found, exactly as W0 did (its § 9).

---

_Implementation PX1-W1. It changes no law and adds no principle: it is the design system finally executing what [UIA §11–12](../../architecture/THA_UI_ARCHITECTURE.md) and [EXP §17](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) always said it must. The remaining 41 findings are [PX1](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md)'s, and the register that would have prevented all 60 is still W5.1's._
