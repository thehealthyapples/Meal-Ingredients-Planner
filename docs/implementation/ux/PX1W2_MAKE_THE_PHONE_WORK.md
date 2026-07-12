# PX1-W2 — Make the Phone Work

**Status:** Implemented.
**Date:** 2026-07-12. **Owner:** Colin Clapson.
**Rollback:** tag `rollback/PX1-W2-make-the-phone-work-20260712` (@ `18cef40b`, the PX1-W1 commit) · `refs/snapshots/PX1W2_ROLLBACK` (`acb9e6b` — the pre-existing dirty tree, preserved).

**Parent:** [`PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) § 10, workstream **PX1-W2**.
**Predecessors:** [`PX1W0_STOP_MISINFORMING_THE_HOUSEHOLD.md`](./PX1W0_STOP_MISINFORMING_THE_HOUSEHOLD.md) · [`PX1W1_MAKE_THE_PRODUCT_RESPOND.md`](./PX1W1_MAKE_THE_PRODUCT_RESPOND.md) — both complete.

**Governing architecture (cited, never restated):**
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2 — §12 *nothing irreversible as a side effect*, §16 *accessibility*, §17 Premium lens) ·
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2 — §9 *one breakpoint truth*, §17 *retire-on-introduction, one owner per visual concern*) ·
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md).

---

## 1. What this workstream was for

PX1 found that **THA is used in a kitchen and a supermarket, on a phone, and the
phone was the platform's worst-served device.** Destructive controls were revealed
only on hover — a gesture a phone does not have — while `opacity:0` never removed
hit-testing, so an invisible delete sat at the end of every pantry row and fired on
contact. In Shop mode the last item on the list sat under the bottom nav and could
not be ticked. 238 controls rendered below the 44px touch floor, and the design
system's own `size="icon"` ceiling was 36px. Six competing breakpoint definitions
meant a 900px kitchen tablet was simultaneously mobile (Cookbook) and desktop
(Planner). And the Plant Diversity table hid five of its six columns on a phone
with no scroller to recover them.

W2 is the subset of PX1 that makes the phone work. It is deliberately **not** a
redesign: no surface looks different at rest on a desktop, no new UX pattern was
invented, and the touch floor was delivered by extending *hit targets* rather than
inflating visual sizes — which is the only way to raise 238 controls to 44px
without redrawing every dense layout in the product.

**Scope discipline.** W2 implements PX1 §10's W2 table (2.1–2.5) and nothing else.
Defects on surfaces W2 touched that belong to later workstreams — the 147 unnamed
icon buttons (W4.2), the raw-`<button>` majority outside the design system (W4.6),
the dead `PageHeader.tsx` and its two 1024px reads (W4.7 deletes the file) — were
left alone and are listed in § 6.

**Continuation note.** This workstream was resumed from a prior session which had
created the rollback protection and completed 2.1 and most of 2.2 (uncommitted).
This session verified that work against the pre-work snapshot, completed 2.2's
remainder, and implemented 2.3–2.5. Nothing was restarted.

---

## 2. Findings addressed

All five W2 items, and the five findings they resolve.

| PX1 §10 | Finding | What was broken | What is true now |
|---|---|---|---|
| 2.1 | `fnd-px-shop-mode-row-under-nav` | Shop mode is `fixed inset-0 z-50`, escaping `<main class="main-safe">` — the one owner of bottom-nav clearance — and its scroller gave 16px of bottom padding against an 80px fixed nav. In the supermarket, the last item could not be ticked. | The fullscreen scroller adopts `.main-safe` itself, in both shopping surfaces. The last row clears the nav. The clearance still has exactly one owner — the same class, applied where the escape happens. |
| 2.2 | `fnd-px-invisible-destructive-controls` | Row controls were `opacity-0 group-hover:opacity-100` (7 named controls across 5 files, plus a cookbook row delete and an analyser history delete found on `invisible group-hover:visible`, and the toast close on `opacity-0`). On touch: invisible, and — for the opacity variants — still hit-testable. Pantry's delete fired `deleteMutation.mutate` **immediately, with no confirmation**, and was the only delete path. Every recipe-delete path likewise fired immediately. | One owner: `.hover-reveal` in `index.css` hides a control **only where a hover exists to reveal it** (`@media (hover: hover) and (pointer: fine)`), with keyboard focus revealing on any device. On a phone the controls are simply visible. Pantry deletes and recipe deletes (all three paths) now ask first via the canonical `AlertDialog`. |
| 2.3 | `fnd-px-touch-floor-absent` | 238 buttons below 44px; `size="icon"` itself 36px; twMerge allowed call sites to override size *downward* (16px meal-detail steppers; the 16px X closing all 69 dialogs). | One owner: `.touch-target` in `index.css`. On coarse pointers a centred pseudo-element extends every control's hit area to ≥44×44 **whatever the visual box** — so a downward visual override can no longer shrink the touch target. Carried by `ui/button` (all 532+ consumers at once), `ui/checkbox`, `ui/switch`, and the Dialog/Sheet close buttons. Fine pointers are untouched; nothing changes visually anywhere. |
| 2.4 | `fnd-px-breakpoint-six-truths` | Six breakpoint definitions: five copy-pasted local `useIsMobile` hooks (one at **1024** — the Cookbook — versus 768 everywhere else), the orphaned `use-mobile.tsx` (sole consumer: the dead `ui/sidebar`), and non-reactive `window.innerWidth` reads that never updated on rotation. UIA §9 calls two surfaces disagreeing about the same screen "a governance failure"; there were six. | One owner: `hooks/use-adaptive-density.tsx` now exports `MOBILE_BREAKPOINT` (768 — matching Tailwind's `md`, with the pairing recorded in `tailwind.config.ts`) and the canonical reactive `useIsMobile()`. All five local copies deleted; the 1024 outlier retired — on a 900px tablet the Cookbook and the Planner now agree; `use-mobile.tsx` deleted with its one consumer migrated; the reactive read replaces the one-shot read where the decision is ongoing, and the mount-time read in `PlannerContext` now derives from `MOBILE_BREAKPOINT`. |
| 2.5 | `fnd-px-plant-columns-unreachable` | `PlantDiversityReport`'s raw `<table>` hid five of six columns (`hidden md:table-cell`) inside an `overflow-hidden` card — `display:none` with no scroller to recover them. At 390px, Category, Supports, Key Nutrients, Days and Meals — the "why this plant matters" payload — were invisible. | The six columns always render; the table (min 640px) sits in an `overflow-x-auto` scroller. On a phone the household scrolls sideways to the full payload; on desktop nothing changes. The mobile stacked summary — which duplicated the hidden Category/Meals into the name cell as compensation — is retired. A latent layout defect this exposed is § 5's `min-w-0` note. |

---

## 3. Components adopted

Per PX1's thesis — the defects are defects of adoption — W2 adopted canonical
implementations wherever one existed:

| Adopted | Where it already was | What now uses it |
|---|---|---|
| **`.main-safe`** (`index.css`) | PX1 §8 names it "exactly the convergence the rest of this audit asks for" — one class, one owner, bottom-nav clearance for free. | The Shop-mode fullscreen scrollers in `shopping-workspace-page` and `shopping-list-page`, which had escaped it via `fixed inset-0`. |
| **`ui/alert-dialog.tsx`** | The canonical confirmation (W0 adopted it for "Clear All" and the Profile guard). | The pantry deletes (both sections) and the recipe delete (all three paths through one dialog). No new interruption pattern. |
| **`hooks/use-adaptive-density.tsx`** | The canonical density/viewport owner (PX1 §6 register row 17 names it the seed). | Now also owns `MOBILE_BREAKPOINT` + `useIsMobile()`; consumed by the five migrated components, `PlannerContext`, and `ui/sidebar`. |
| **Tailwind's `md` = 768** | The CSS half of the breakpoint truth, already used by every `md:` class. | `MOBILE_BREAKPOINT` is documented against it on both sides (`use-adaptive-density.tsx`, `tailwind.config.ts`) so JS and CSS cannot drift apart silently. |

**Two new owners were created**, each for a concern with no owner and multiple
rival treatments (UIA §17's admission bar):

| New owner | What it owns | Promoted from (the seed) |
|---|---|---|
| `index.css` — **`.hover-reveal`** *(prior session, this workstream)* | "A row control revealed on hover." Hides only under `@media (hover: hover) and (pointer: fine)` — on a device that cannot hover, the control is visible; keyboard focus reveals anywhere. | The `opacity-0 group-hover:opacity-100` idiom copy-pasted across 9+ call sites — each a correct desktop treatment that was invisible-but-tappable on the phone. |
| `index.css` — **`.touch-target`** | The 44px touch floor. A coarse-pointer-only `::before` extends the hit area to `max(100%, 44px)` each way; visual sizes are untouched. | The pattern PX1 §9 cites (`nav-bar.tsx`'s `min-w-[44px] min-h-[44px]` — the one surface meeting the floor by construction), generalised so it cannot be overridden downward. |

## 4. Components retired

Per UIA §17 (*retire-on-introduction* — name the predecessor, migrate every
consumer, delete it in the same change):

| Retired | Replaced by | Consumers migrated |
|---|---|---|
| **Five local `useIsMobile` copies** — `day-view-drawer`, `CookbookWorkspacePanel` (the 1024px outlier), `SmartReviewPanelContent`, `PlannerMealPickerPanel`, `PlannerAssistantPanel` | `useIsMobile()` from `hooks/use-adaptive-density` | All five components; identical behaviour (768, reactive, correct on first render) except the outlier, whose retirement is the point. |
| **`hooks/use-mobile.tsx`** | `hooks/use-adaptive-density.tsx` | Its one consumer, `ui/sidebar.tsx` (itself dead code — W4.7's deletion, not W2's; W2 does not delete files it was not asked to). |
| **The non-reactive `innerWidth < 768` reads** — `PlannerAssistantPanel` (per-render one-shot), `PlannerContext` (magic number) | `useIsMobile()` / `MOBILE_BREAKPOINT` | Both. `PlannerContext`'s mount-time read stays a one-time read by design (it restores session state once); only the number's ownership moved. |
| **The `opacity-0`/`invisible` hover idioms on row controls** — cookbook row delete, analyser history delete, toast close (this session); pantry ×2, planner ×3, diary ×2, picker ×1, assistant ×1 (prior session) | `.hover-reveal` | All 12 sites. `AdaptationReviewSheet`'s hover pencil was examined and left: it is a decorative hint *inside* an always-visible button — the control itself works on touch. |
| **The unguarded immediate deletes** — pantry item (the only delete path, firing on contact), recipe (all three paths: grid dropdown, list row, mobile action sheet) | The canonical `AlertDialog`, asking first | All five call sites. Lightweight removals (diary countdown, provisioning items, assistant proposals) deliberately stay one-tap: they are now visible, labelled, and trivially recreated — EXP §14 reserves alarm for genuine loss, and a confirm on every small removal would be its own defect. |
| **The Plant Diversity mobile stacked summary** | The real Category and Meals columns, now always rendered | The one render site. It existed to compensate for the hidden columns; keeping it would have shown the same facts twice. |

---

## 5. What changed, by file

**New (1):** this document.
**Deleted (1):** `hooks/use-mobile.tsx`.

**Changed (23):**

| File | Change |
|---|---|
| `client/src/index.css` | The `.hover-reveal` owner (prior session) and the `.touch-target` owner (this session), both in the utilities layer beside the W1 elevation system. |
| `client/src/components/ui/button.tsx` | Base gains `relative touch-target` — every `<Button>` (532+ call sites) gets the 44px floor on coarse pointers at once; an explicit position class from a call site still wins via twMerge. |
| `client/src/components/ui/checkbox.tsx` · `ui/switch.tsx` | Same two classes — the 16px tick and the 24px switch get the floor. |
| `client/src/components/ui/dialog.tsx` · `ui/sheet.tsx` | The 16px close X — every dialog's and sheet's only dismiss control — gains `touch-target`. |
| `client/src/components/ui/toast.tsx` | Close control: `opacity-0` → `hover-reveal` — the failure toast's dismiss was invisible on the very device W0's failure toasts matter most on. |
| `client/src/hooks/use-adaptive-density.tsx` | Exports `MOBILE_BREAKPOINT` and the canonical `useIsMobile()` (`useSyncExternalStore` over `matchMedia` — reactive, correct on first render). |
| `client/src/components/day-view-drawer.tsx` · `CookbookWorkspacePanel.tsx` · `SmartReviewPanelContent.tsx` · `PlannerMealPickerPanel.tsx` · `PlannerAssistantPanel.tsx` | Local hooks deleted → canonical import. `PlannerAssistantPanel` also swaps its one-shot `isMobileResolve` read for the hook. |
| `client/src/contexts/PlannerContext.tsx` | Mount-time viewport decision derives from `MOBILE_BREAKPOINT`. |
| `client/src/components/ui/sidebar.tsx` | Import repointed to the canonical hook (file itself remains W4.7's to delete). |
| `tailwind.config.ts` | Comment pairing `md` (768) with `MOBILE_BREAKPOINT` — the two halves of the one truth, named at both definition sites. |
| `client/src/pages/shopping-workspace-page.tsx` · `shopping-list-page.tsx` | Shop-mode fullscreen scroller adopts `.main-safe` (prior session). |
| `client/src/pages/pantry-page.tsx` | Both delete buttons: `hover-reveal`, `aria-label`, and an `AlertDialog` confirm each (prior session). |
| `client/src/pages/meals-page.tsx` | Row delete `invisible` → `hover-reveal` + `aria-label`; all three recipe-delete paths route through one `AlertDialog`. |
| `client/src/pages/products-page.tsx` | History-row delete `invisible` → `hover-reveal`. |
| `client/src/pages/food-diary-page.tsx` · `weekly-planner-page.tsx` | Row controls → `hover-reveal` (prior session). |
| `client/src/components/PlantDiversityReport.tsx` | Six columns always render; table in an `overflow-x-auto` scroller with `min-w-[640px]`; stacked summary retired. |
| `client/src/pages/plant-diversity-page.tsx` | Container gains `w-full min-w-0`: as a flex item of `<main>`, `min-width:auto` let the table grow the page past the viewport, where `<main>`'s `overflow-x-hidden` **clipped** the columns instead of letting the new scroller scroll. Found by the behavioural harness, § 8 check 7 — the columns rendered and were still unreachable until this line. |

---

## 6. Remaining PX1 findings

**W2 closes 5 findings** (3 P1 · 2 P2). With W0's 10 and W1's 9, **24 of PX1's 60
are closed; 36 remain**, unchanged and unstarted.

**P1 — 10 of 20 remain.** Closed by W2: `fnd-px-invisible-destructive-controls`,
`fnd-px-shop-mode-row-under-nav` (and W2.3/W2.4 close two P2s:
`fnd-px-touch-floor-absent`, `fnd-px-breakpoint-six-truths` — with
`fnd-px-plant-columns-unreachable`). Still open, and these are the ones a
household feels next:

- `fnd-px-no-empty-state-owner` (W4.8) · `fnd-px-forms-unlabelled` (W4.1) ·
  `fnd-px-icon-buttons-unnamed` / `fnd-px-keyboard-unreachable` /
  `fnd-px-companion-not-a-dialog` (W4.2) · `fnd-px-no-route-splitting` (W3.2) ·
  `fnd-px-no-compression` (W3.1) · `fnd-px-home-fetches-whole-cookbook` /
  `fnd-px-meals-invalidation-storm` (W3.3) · `fnd-px-cookbook-search-refetch` /
  `-jank` (W3.5).

**P2 — 18 of 25 remain** (W2 closed 3: touch floor, breakpoints, plant columns —
alongside W1's 4). **P3 — 8 of 10 remain** (unchanged by W2).

**Boundaries W2 touched and deliberately did not cross:**

- The touch floor is delivered by the primitives; the **147 icon-only buttons with
  no accessible name** (W4.2) and the **535 raw `<button>`s** outside `ui/button`
  (W4.6) gain the floor only when they adopt the primitive. W2 added `aria-label`s
  only to the specific controls it made visible.
- `ui/sidebar.tsx` and `PageHeader.tsx` (which carries two more 1024px reads) are
  **dead code** — 0 importers. W2 migrated the former's import so `use-mobile.tsx`
  could be deleted cleanly, and otherwise left both for **W4.7**, whose deletion
  list they are on. Converging a dead file's breakpoint would be motion without
  meaning.
- The cookbook list rows' `hidden group-hover:flex` **badges** strip (nutrition/diet
  badges) was examined and left: it is information, not a control, and its mobile
  treatment belongs to the meal-presentation convergence (W4.3).
- The overlap of extended hit areas on *adjacent* tiny controls (PX1's "16px tick
  8px from a 28px delete") is real: where two extended targets overlap, the
  later-painted control wins the overlap zone. The floor makes both hittable; the
  *spacing* of dense rows is layout work belonging to the row-contract convergence
  (W4.9), not a token.

**The Adoption Register (PX1 §6 / W5.1) is still not built.** W2 changed row 17
(Breakpoint truth: ❌ → one owner, `use-mobile.tsx` and the five copies gone) and
created two owners of its own (`hover-reveal`, `touch-target`) that are themselves
unregistered — precisely the failure mode PX1 §4 describes. W5.1 remains the
workstream that ends it.

---

## 7. Architecture Compliance

- **Canonical ownership maintained.** W2 introduces no second owner: `.hover-reveal`
  and `.touch-target` replace idioms, not owners (there was no owner);
  `MOBILE_BREAKPOINT`/`useIsMobile` consolidate six definitions into the file PX1
  already named canonical; every retirement migrated every consumer in the same
  change.
- **Retire-on-introduction honoured** (UIA §17): § 4's table.
- **No new experience principles, no new UX patterns, no redesign.** Nothing looks
  different at rest on a fine-pointer device. On a phone, controls that existed are
  now visible, reachable, and honestly sized — behaviour the law already required
  (EXP §16, EXP §17 Premium lens, UIA §9).
- **EXP §12** (*nothing irreversible happens as a side effect*) — a pantry item and
  a recipe can no longer be destroyed by a stray touch on an invisible control.
- **UIA §9** (*one breakpoint truth*) — one number, two named faces (JS and CSS),
  zero rivals.
- **Experience prevails over UI where they meet** — the touch floor extends hit
  areas invisibly rather than enforcing a visually uniform 44px control, because
  redrawing every dense layout would trade a touch defect for a calm-density
  regression on every surface at once.
- **Intelligence architecture untouched.** No capability, binding, handler, engine
  or prompt was changed. W2 is client-only: `server/` is not in the diff.

### Definition of Done
- **Success:** in Shop mode the last row clears the nav; every hover-revealed
  control is visible on a touch device and destructive ones ask first; every
  Button/Checkbox/Switch/dialog-close meets a 44px hit target on coarse pointers;
  one breakpoint truth (a 900px tablet is desktop everywhere); the Plant Diversity
  payload is reachable at 390px. **Verified in a real browser — § 8.**
- **Must not break:** desktop hover behaviour of revealed controls (unchanged — § 8
  check 9); visual sizes everywhere (hit extension only); the five migrated
  components' 768px behaviour (identical hook semantics); dialogs' resting
  appearance; the demo household flows W0/W1 verified.
- **Manual test steps:** § 8's assertions are the executable form.

### Product Registry Impact
- **Registry affected: NO.** W2 adds no surface, route, page, capability, setting
  or claim. The same surfaces exist, reachable the same ways — they now work on a
  phone. The two confirmation dialogs W2 adds (pantry delete, recipe delete) are
  confirmations of existing actions, exactly as W0's were ruled: they carry no
  product knowledge.
- Entries created: **NONE** · updated: **NONE** · retired: **NONE**
- Product knowledge written into a prompt, template, or fallback string: **NO**

### Data Impact
- Reads existing data: **NO** · Writes new data: **NO** · Changes meaning of
  existing data: **NO** · Requires backfill: **NO**. W2 is presentation-layer only.

### Trust Check
- **Could this mislead the user?** No. The nearest risk is the confirm dialogs
  making THA feel bureaucratic; they guard only the two genuinely destructive row
  actions (a pantry item's only delete path; a whole recipe), and every lighter
  removal stays one visible tap.

---

## 8. Verification

| Gate | Result |
|---|---|
| `npm run typecheck:ci` | **PASS** — 168 known errors, baseline unchanged. **Zero** in `client/`. |
| `npx vite build` | **PASS** — 3.84 MB / 968 KB gzipped (unchanged; the payload findings are W3's). |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** — repository structure clean. |
| Built-artifact assertions (below) | **PASS — 8 / 8.** |
| Behavioural harness (Playwright, live app, demo household, touch emulation) | **PASS — 9 / 9.** |

Built-artifact assertions against `dist/public` (minified, so patterns are
whitespace-free):

| # | Assertion | |
|---|---|---|
| 1 | `@media(pointer:coarse){.touch-target:before{…width:max(100%,44px);height:max(100%,44px)…}}` in built CSS | PASS |
| 2 | `.hover-reveal{opacity:0}` gated inside `@media(hover:hover)and (pointer:fine)` | PASS |
| 3 | `.hover-reveal:focus-visible,.hover-reveal:focus-within{opacity:1}` present | PASS |
| 4 | `min-w-[640px]` (the table's scroll width) generated by the content scan | PASS |
| 5 | `invisible group-hover:visible` absent from built JS | PASS |
| 6 | `hidden md:table-cell` absent from built JS | PASS |
| 7 | `innerWidth<768` and `max-width: 1023px` absent from built JS (the copies and the outlier are gone, not shadowed) | PASS |
| 8 | The Shop-mode scroller string carries `main-safe` (both surfaces) | PASS |

The behavioural harness (the W0/W1 method — chromium against the live dev server
and a real demo household; this time with **touch emulation**: 390×844, coarse
pointer, no hover) asserted each finding's condition as the browser computes it:

| # | What was asserted against the live app | Observed | |
|---|---|---|---|
| 1 | Demo household session established | `POST /api/demo/start → 201` | PASS |
| 2 | The context really is a phone | `pointer:coarse=true`, `hover:hover=false` | PASS |
| 3 | A `hover-reveal` delete control is visible on touch (pantry) | computed `opacity: 1` | PASS |
| 4 | A sub-44px control's hit target on coarse pointer | 38px visual → `::before` 225×44px | PASS |
| 5 | Recipe delete asks first; no premature request | confirm dialog shown; **zero `DELETE` issued** | PASS |
| 6 | Shop-mode fullscreen scroller reserves nav clearance | computed `padding-bottom: 80px` | PASS |
| 7 | Plant table at 390px: all six columns render and scroll | 6/6 visible, `overflow-x: auto`, scrollable | PASS |
| 8 | 900px tablet: Cookbook renders its **desktop** workspace (outlier retired) | desktop sidebar mounted | PASS |
| 9 | Desktop at rest: `hover-reveal` still hidden (no fine-pointer regression) | computed `opacity: 0` | PASS |

Check 7 initially **failed** — the columns rendered but the wrapper reported
`scrollable=false`: the page container, a flex item, had grown to 815px and
`<main>`'s `overflow-x-hidden` was clipping the table instead of letting it
scroll. That is § 5's `plant-diversity-page` `min-w-0` fix; the harness caught a
defect a CSS-level review would have signed off. Recorded because it is the reason
behavioural verification is the standard here.

Reproduce (the PDA1 chromium method — Nix shared libraries on `LD_LIBRARY_PATH`,
excluding the glibc core, and **64-bit ELF only**: the store also carries i686
builds of the same sonames, and linking one fails with `wrong ELF class`; note
also the demo-start rate limit means the server must run with
`AUTH_RATE_LIMIT_MODE=log_only`, per W0):

```
PORT=<port> AUTH_RATE_LIMIT_MODE=log_only npm run dev &
NODE_PATH=<repo>/node_modules LD_LIBRARY_PATH=<chromium-libs> npx tsx <harness>
```

The harness itself is not committed, for W0's reason: it drives the app, it is not
part of it. Its nine assertions are reproduced above so they can be re-derived.

---

## 9. What was committed

**Only PX1-W2.** The working tree carried, and still carries, ~100 files of other
workstreams' uncommitted work. Twelve of the files W2 had to change also contained
some of it — among them `pantry-page.tsx` (PANTRY1), `meals-page.tsx` (CBK2),
`plant-diversity-page.tsx` and `PlantDiversityReport.tsx` (HHP3),
`PlannerAssistantPanel.tsx` and `SmartReviewPanelContent.tsx` (PLAN2), and the
shopping pages (SHOP1).

Those files were committed with **W2's hunks only** — derived as the diff from the
`PX1W2_ROLLBACK` pre-work snapshot (which preserved the other workstreams' state)
to the finished tree — and the other workstreams' hunks were left uncommitted,
exactly as they were found, exactly as W0 (§ 9) and W1 (§ 9) did.

---

_Implementation PX1-W2. It changes no law and adds no principle: it is the product finally usable on the device it is actually used on, as [EXP §16–17](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) and [UIA §9](../../architecture/THA_UI_ARCHITECTURE.md) always said it must be. The remaining 36 findings are [PX1](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md)'s, and the register that would have prevented all 60 is still W5.1's._
