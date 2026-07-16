<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Source of truth: docs/implementation/ux/adoption-register.json
     Regenerate:      npm run adoption:record
     Verified by:     npm run adoption:check (fails if this file drifts from the JSON)
-->

# The Platform Experience Adoption Register

**Version:** 1.0.0 · **Updated:** 2026-07-13 · **Owner:** Colin Clapson

> **UIA § 17:** *"Every canonical building block carries a visible register: what it owns,
> which surfaces have adopted it, which are exempt and why. **Authored-but-unadopted must be
> impossible to hide.** The register lives beside the implementation (it is operational, not
> architectural); its existence is mandated here."*

This is that register. It is **operational, not architectural**: it creates no law, and every
rule it enforces belongs to a document listed below. It is **present tense** — it describes the
codebase as it is now, and it is *corrected*, never superseded. A stale row is a defect.

**It is not a document that can quietly go stale.** It *declares*; the code is *measured* against
it, on every run, by `scripts/ci/adoption-register-gate.ts` — which fails CI when a canonical owner
loses its last consumer, when a rival count rises above a ceiling below, when a retired predecessor
returns, or when a new module appears with no importers. Run `npm run adoption:check` to see where
the codebase actually stands. This file is generated from `adoption-register.json`, its single
source of truth; the gate fails if the two ever disagree, so the prose can never drift from the data.

**Governed by:** [THA_UI_ARCHITECTURE.md §17](../../architecture/THA_UI_ARCHITECTURE.md) (the mandate) · [THA_EXPERIENCE_ARCHITECTURE.md](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2) · [ENGINEERING_WORKFLOW.md](../../architecture/ENGINEERING_WORKFLOW.md) (Adoption Register Compliance) · [PX1](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) §6 (the specification)

---

## 1. Canonical owners

**Enforcement** says whether the row is machine-checked or human-reviewed. It is stated per row
rather than implied, so the gap between what is *declared* and what is *enforced* is visible on
the day the register is created, rather than discovered months after it started costing something
(PKCA Rule KC8).

**There are no adoption counts in this document, deliberately.** A count in prose is a count that
rots: it is correct on the day it is typed and wrong by the next commit, and a register that
carries stale numbers teaches its readers not to trust it. The live counts are measured from the
code on every run — `npm run adoption:check` prints them, and fails the build when one of them
breaks a rule below. **The document declares; the gate measures.**

| # | Concern | Canonical owner | Owns | Status | Enforcement |
|---|---|---|---|---|---|
| 1 | **Header** | `components/workspace-header.tsx` | Realm typing, the page banner, the slot context, and the bottom nav it mounts internally | ✅ governed | machine |
| 2 | **Navigation** | `components/nav-bar.tsx (NAV_ITEMS)` | The one ordered destination list feeding every navigation surface. The only surface meeting the 44px touch floor by construction. | ✅ governed | machine |
| 3 | **Card** | `components/ui/card.tsx` | The one card surface: radius, border weight, translucency, shadow-none. `CardTitle` is a real heading on the THA type scale. | ✅ governed | machine |
| 4 | **Dialog** | `components/ui/dialog.tsx + ui/dialog-foundation.ts` | The modal container: Radix focus trap, focus return, Escape, `max-h` + `overflow-y-auto`, a 44px close target, and a sheet presentation that is real rather than a no-op. | ✅ governed | machine |
| 5 | **Overlay container** | `components/ui/overlay.tsx` | The overlay *decision*: bottom sheet on a phone, centred dialog on a desktop — by the canonical breakpoint, never by the calling file's taste. | ⚠️ half-adopted | machine |
| 6 | **Form field** | `components/ui/form.tsx` | The wired field: `htmlFor`, `aria-describedby`, `aria-invalid`. | ⚠️ half-adopted | machine |
| 7 | **Accessible name enforcement** | `lib/a11y-dev-warnings.ts (warnIfUnlabelled)` | Making an unlabelled control loud at introduction rather than at audit. Dev-only; stripped in production. | ✅ governed | machine |
| 8 | **Empty state** | `components/ui/empty-state.tsx` | Absence, in its three truths: `empty` | `filtered` | `unavailable`. There is deliberately **no error variant** — that sentence belongs to `LoadError`, which is how it became structurally impossible to say "you have nothing" when the truth is "we could not load this". | ✅ governed | machine |
| 9 | **Loading state** | `components/ui/skeleton.tsx` | **Content arriving.** Waiting, as a content-shaped skeleton rather than a void. This register settles the vocabulary question the finding raised, by naming which mark owns which situation: *`Skeleton` owns content arriving; `Loader2` owns indeterminate work inside a control.* A vocabulary is not "only one mark" — it is one rule for which mark, and this is that rule. | ⚠️ half-adopted | machine |
| 10 | **Error presentation** | `components/ui/load-error.tsx` | What could not be loaded, what it means for their data (*nothing is lost*), and one way forward (*Try again*). It never shows a status code. | ✅ governed | machine |
| 11 | **Error boundary** | `components/error-boundary.tsx` | Render-time failure. Mounted *inside* the shell, so the header and nav survive: a broken surface is never one the household cannot leave. | ✅ governed | machine |
| 12 | **Mutation feedback** | `hooks/use-tracked-mutation.ts` | Feedback belongs to the mutation, never the call site. `failure` copy is **required by the type**, and `err.message` is never forwarded — the owner never receives it. | ⚠️ half-adopted | machine |
| 13 | **Unsaved-work guard** | `hooks/use-unsaved-changes.tsx` | Sections declare dirty state; the page asks before letting the household leave. | ✅ governed | machine |
| 14 | **Status presentation (panel shell)** | `components/intelligence/IntelligenceCard.tsx` | The intelligence panel shell: header, loading, empty, progressive disclosure. It composes `ui/card` rather than rivalling it (PX1-W4.4). | ⚠️ half-adopted | review |
| 15 | **Rating mark (the apple)** | `components/AppleRating.tsx` | One apple, one name, one sentence. `appleScoreLabel()` is the single mouth for the score's accessible name; an unscored item renders nothing rather than announcing a fabricated "1 out of 5". | ✅ governed | machine |
| 16 | **Meal presentation (the core noun)** | `components/MealCard.tsx` | The meal's thumbnail-bearing faces: one radius, one fallback icon, one size scale, lazy loading; `tile` and `row` arrangements. | ⚠️ half-adopted | review |
| 17 | **Food quantity string** | `lib/unit-display.ts (formatQty)` | The one quantity string. Grams-aware and liquid-aware. `formatItemDisplay` delegates to it. | ✅ governed | machine |
| 18 | **Food item row (layout)** | **— none —** | — nothing yet owns the *row* a food item is rendered in. | ❌ no owner | review |
| 19 | **Breakpoint truth** | `hooks/use-adaptive-density.tsx (MOBILE_BREAKPOINT, useIsMobile)` | One number (768), two named faces — JS here, CSS as Tailwind's `md`, paired at both definition sites so they cannot drift. | ✅ governed | machine |
| 20 | **Page shell** | `components/workspace-header.tsx (PageContainer / pageContainerClass)` | The page content column and its rhythm, keyed to the same `wide` flag as the header — so a page's content can no longer disagree with its own banner. | ✅ governed | machine |
| 21 | **Back** | `components/workspace-header.tsx (back slot)` | Back = the **hierarchy parent** (EXP §8), with a `beforeNavigate` interception point so an unsaved-changes guard can still ask first. | ✅ governed | machine |
| 22 | **Density ladder** | `lib/density-tokens.ts (densityClasses)` | The adaptive-density class ladder for meal-detail surfaces. Class strings are complete literals — the file forbids interpolating fragments, which is the exact mechanism that produced `space-y-gap-2` seven times. | ✅ governed | machine |
| 23 | **"The meal library changed"** | `hooks/use-meals.ts (invalidateMealLibrary)` | The ONE way to say the meal library changed. Invalidates the full-rows cache **and** the summary cache together, so a surface reading either can never be told stale meal names. | ✅ governed | machine |
| 24 | **Interaction feedback** | `index.css (.hover-elevate / .active-elevate-2 + the five border tokens)` | Hover and press, for every control wearing the canonical classes. Consumed everywhere since the scaffold; **defined nowhere** until PX1-W1.1. | ✅ governed | machine |
| 25 | **Button / primary action** | `components/ui/button.tsx` | Press feedback, the 44px touch floor, and — since PX1-W4.6 — a **required `variant`**, so a surface must *declare* its one primary action (EXP §7) rather than acquire it by omission. | ⚠️ half-adopted | machine |
| 26 | **Touch floor** | `index.css (.touch-target)` | 44px hit targets on coarse pointers, via a pseudo-element that extends the hit area whatever the visual box — so a downward `className` override can no longer shrink the target. Carried by `ui/button`, `ui/checkbox`, `ui/switch` and the dialog/sheet close buttons. | ✅ governed | machine |
| 27 | **Hover-revealed row controls** | `index.css (.hover-reveal)` | A control hidden **only where a hover exists to reveal it**. On a phone it is simply visible; keyboard focus reveals it anywhere. | ✅ governed | machine |
| 28 | **Bottom-nav clearance** | `index.css (.main-safe)` | One class, one owner, applied once on `<main>` — every routed page gets nav clearance for free. | ✅ governed | machine |
| 29 | **Motion vocabulary** | `index.css keyframes + framer-motion MotionConfig (App.tsx)` | Motion, and the reduced-motion **guarantee** — gated at both layers: one `@media (prefers-reduced-motion: reduce)` block for CSS, one `MotionConfig reducedMotion="user"` for all framer-motion. | ✅ governed | machine |
| 30 | **Semantic surface tint** | `components/intelligence/intelligence-tokens.ts (semanticSurface / semanticText)` | What colour a *meaning* is: `notice` · `info` · `positive` — keyed by meaning, never by hue. **`destructive` is deliberately absent**: alarm is reserved for a safety event, and there is no way to reach for it through this owner. | ✅ governed | machine |
| 31 | **Tone (THA's voice about food)** | `components/UltraProcessedNoticeModal.tsx + use-sound-effects.ts (playScanComplete)` | How THA reports a processing score: the facts, without a verdict. One neutral scan tone that takes no rating parameter — there is nothing left to vary the tone by. | ✅ governed | machine |
| 32 | **Utility class definitions** | `index.css (.scrollbar-hide)` | The scrollbar-hiding utility that was actually defined, while 14 call sites consumed two names that were not. | ✅ governed | machine |
| 33 | **Theme / colour mode** | **— none —** | — nothing. THA ships a complete dark theme that **no household can reach**. | ❌ no owner | review |
| 34 | **Undo** | **— none —** | — nothing. THA has no undo; every destructive action is guarded by a confirmation instead. | ❌ no owner | review |
| 35 | **Brand mark** | `FiveApplesLogo / tha-apple.png` | The THA apple, as brand rather than as rating. Compressed 65× in PX1-W3.4 (1.45 MB → 22 KB for a 48px render). | ✅ governed | review |
| 36 | **Icon set** | `lucide-react` | Every interface icon. No emoji as interface icons; no second icon library. | ✅ governed | review |
| 37 | **Signature typography (the third voice)** | `index.css (.text-signature + --font-signature)` | THA in its own hand. The signature voice admitted by **UIA §8 (amended by UXHOME1)**, which replaced *"two voices only; no third typeface, ever"* with three named families and a hard boundary: the signature is for **emotionally significant branded moments only** and is forbidden in all functional UI — buttons, forms, navigation, tables, cards, modals, planner, shopping. `.text-signature` is the ONE entry point: no `font-signature` Tailwind utility exists, deliberately (tailwind.config.ts carries the comment saying so), because a utility would be a one-token door into the third typeface from any surface in the product. **The webfont is not loaded in production** — the token resolves, but the only surface that fetches Caveat is the dev-only prototype below, so no household downloads a font for a page they cannot reach. **Permitted surfaces — exactly three, and none is a household surface:** `pages/dev/arrival-experience.tsx` (`/dev/arrival`, ARRIVAL1), `pages/dev/arrival-a-welcome.tsx` (`/dev/arrival-a-welcome`, EXP2 exploration Prototype A — admitted by a governed edit, 2026-07-15, for the same emotionally significant moment: the arrival greeting, and nothing else), and `pages/dev/arrival-s1-quiet.tsx` (`/dev/arrival-s1-quiet`, EXP3 synthesis candidate S1 — admitted by this governed edit, 2026-07-15, carrying Prototype A's greeting forward into the synthesis: the same one moment, the arrival greeting, and nothing else). All three are `import.meta.env.DEV` only; the chunks are dropped from the production bundle, verified in the build. This surface replaced UXHOME1's `home-arrival-prototype.tsx`, which was discarded by ARRIVAL1 — the signature voice now says its one word ("Welcome home") inside an *arrival* rather than over an animated Home page. A second surface does not follow from the first: §8 requires a further governed decision, per surface. The failure mode this row exists to catch is not ugliness but **familiarity** — the moment the signature becomes an ordinary UI font, the identity it was admitted to carry is gone and using it more cannot bring it back. | ✅ governed | review |
| 38 | **Orchard exposure** | `components/layout/orchard-backdrop.tsx` | The orchard image itself. It is an ARRIVAL surface and nothing else: /auth and /onboarding (through orchard-shell.tsx) and the unauthenticated marketing landing (home-page.tsx). THA_EXPERIENCE_BLUEPRINT.md § 6.2 rule 3 expressly permits arrival to stand at E3. A ROOM may never mount it: rooms receive the orchard as governed E0–E3 exposure values (§ 6.2), never as this component. | ✅ governed | machine |

## 2. Rivals — the ratchet

Each count is a **ceiling measured from the code**. The gate fails if a count rises: a competing
implementation cannot enter THA without someone raising the ceiling here, by hand, with a reason.
That is the whole mechanism by which *"future work cannot introduce competing implementations
without explicit ownership"* is true rather than hoped for.

| Concern | Rival | Ceiling | Note |
|---|---|---|---|
| Dialog | `<DrawerContent>` — a second overlay container chosen per-file | 12 | Capped. New overlays use `Overlay`, which decides sheet-vs-dialog by viewport. |
| Dialog | `<SheetContent>` — a third | 3 | Capped. `Sheet` is retired as a *choice*; it survives only as Overlay's mobile implementation. |
| Loading state | Hand-rolled `animate-pulse` loading surfaces | 9 | The owner carries the class internally; these are the copies outside it. PX1-W4.8 retired the 12 verbatim Skeleton clones. |
| Loading state | `<Loader2>` usages | 179 | Capped, not banned: 140 are the exempt inline pending mark above. The population may fall, never rise. |
| Mutation feedback | Raw `useMutation` — feedback owned by the call site | 137 | Not all are defects: a mutation with no household-visible outcome owes no toast. Capped so the population cannot grow. |
| Button / primary action | Raw `<button>` elements outside the design system | 538 | Each reinvents press feedback and misses the touch floor. Capped: the population may fall, never rise. |

## 3. Exemptions — explicit, with a reason

*"Any surface exempt from a canonical owner is exempt in the register, with a reason — never
silently."* (UIA § 17)

| Concern | Exempt surface | Why |
|---|---|---|
| Navigation | All pages | No page imports the nav directly — `WorkspaceHeader` mounts it. Two importers is the correct number, not a low one. |
| Form field | ~20 hand-rolled `useState` forms | They now carry real labels and accessible names (PX1-W4.1), so the household-visible defect is closed. `ui/form.tsx`'s RHF context is not worth forcing onto a two-field dialog; what mattered was the accessible name, and `warnIfUnlabelled` now enforces that at the primitive — see `accessible-name`. |
| Accessible name enforcement | `ui/input.tsx`, `ui/textarea.tsx` only | Two importers is the whole design: the warning belongs at the two primitives every field passes through, not at 300 call sites. |
| Loading state | `Loader2` as an **inline pending mark** — the spinner inside a control that is working (140 of its 180 usages), and the route-transition fallback in `App.tsx` | A skeleton answers *"what is about to appear here"*. A button that is saving has nothing to shape a skeleton around, and a route fallback must not paint a skeleton of a page it cannot yet know. For *work inside a control*, Loader2 is the right mark and Skeleton would be the wrong one. |
| Error boundary | Mounted once, in `App.tsx` | One importer is the correct number: a boundary is mounted at the shell, not per page. |
| Unsaved-work guard | Profile only | Profile is the only dirty→Save surface in THA; everywhere else commits on interaction. One consumer is the correct number, not a low one. |
| Meal presentation (the core noun) | `PlannerMealCard.tsx` | It owns the thumbnail-*less* planner-cell face, which is a different object with a different job. It was `MealCard`'s seed, not its rival. |
| Back | Pantry, Diary, Nutrition | They are bottom-nav destinations, not subpages. A back affordance on a root destination is a lie about the hierarchy. |
| "The meal library changed" | Per-meal keys — `['/api/meals', mealId, 'nutrition']` and similar | These address one meal, not the library. They are correct, and the pattern above deliberately does not match them: it anchors on the closing bracket, so only the *bare library keys* are forbidden. PX1-W3's own grep looked for the double-quoted form only, which is how four single-quoted `['/api/meals']` invalidations survived a workstream that reported zero. |
| Bottom-nav clearance | Shop mode's two fullscreen scrollers | `fixed inset-0` genuinely *escapes* `<main>`, so the owner is applied at the point of escape. This is the one legitimate re-application; the six decorative duplicates were removed in PX1-W4b.5. |
| Signature typography (the third voice) | Every household-facing surface, including the live Home (`/home`) | Not an exemption from the owner — an exemption from USING it. No household-facing surface has adopted the signature voice, by design and by governance: UXHOME1 amended the law and built the prototype, and deliberately did NOT adopt it into the live Home in the same change. Adoption is a separate, explicit decision (see the open migration). |

## 4. Retired predecessors — and they stay retired

Retire-on-introduction (UIA § 17) is a promise about the past. This table is the promise being
kept: the gate asserts **zero occurrences in code** for every name below, forever. A predecessor
that comes back fails CI.

Their names survive in *comments* — the retirement record each workstream was required to leave —
and the gate strips comments before matching, so writing that record down can never fail the build.

| Predecessor | Concern | Retired by |
|---|---|---|
| `components/PageHeader.tsx (a full unadopted successor, 0 importers, duplicate PageRealm type)` | Header | PX1-W4.7 |
| `intelligenceSurface (a private card surface rivalling ui/card, inside intelligence-tokens)` | Card | PX1-W4.4 |
| `ui/apple-rating.tsx` | Rating mark (the apple) | PX1-W4.12 |
| `ui/score-badge.tsx (an 11-line pass-through alias — the third entry point that guaranteed the next divergence)` | Rating mark (the apple) | PX1-W4.12 |
| `MiniAppleRating (private, KitchenToBasketVisual)` | Rating mark (the apple) | PX1-W4.12 |
| `hooks/use-mobile.tsx (whose only consumer was the dead ui/sidebar)` | Breakpoint truth | PX1-W2.4 |
| `Five copy-pasted local useIsMobile hooks (incl. the 1024px Cookbook outlier)` | Breakpoint truth | PX1-W2.4 |
| `The 17 copy-pasted `max-w-screen-2xl 3xl:max-w-[1920px]` container strings` | Page shell | PX1-W4.5 |
| `Profile's `window.location.href` Back — a full page reload that discarded the TanStack cache` | Back | PX1-W4.5 |
| `The four copy-pasted density ladders and their seven dead `space-y-${gapClass}` interpolations` | Density ladder | PX1-W1.6 |
| `Direct invalidation of the meal-library keys outside the owner — a call that refreshes the full-rows cache while leaving the summary cache (Home, Dashboard) stale` | "The meal library changed" | PX1-W3.3, completed by PX1-W5 |
| `The `opacity-0 group-hover:opacity-100` idiom — invisible but still hit-testable, so an unconfirmed delete fired on contact` | Hover-revealed row controls | PX1-W2.2 |
| `The Dashboard's hard-coded light-mode-only border literal` | Semantic surface tint | PX1-W4b.4 |
| `BadAppleWarningModal (a frowning apple, a destructive-red warning triangle, and an "Add Anyway" button)` | Tone (THA's voice about food) | PX1-W4b.1 |
| `playSound(rating) — the tone ladder that buzzed at a low-scoring food` | Tone (THA's voice about food) | PX1-W4b.1 |
| `The "clean / cleaner" vocabulary that called a household's basket dirty` | Tone (THA's voice about food) | PX1-W4b.1 |
| `"Add Anyway" — a label that framed the household's own choice as defiance` | Tone (THA's voice about food) | PX1-W4b.1 |
| `The shipped [BOOST-PROOF] console traces` | Tone (THA's voice about food) | PX1-W4b.6 |
| `no-scrollbar (consumed 13×, defined nowhere)` | Utility class definitions | PX1-W1.7 |
| `scrollbar-none (the same defect under a second name)` | Utility class definitions | PX1-W1.7 |
| `the global orchard wallpaper — <OrchardBackdrop> mounted anywhere but the two arrival surfaces (it stood in App.tsx behind every room, fixed inset-0, objectFit cover, opacity 0.90)` | Orchard exposure | CONV1-P3 (BEH-7) |

## 4a. Measured facts — recorded, not enforced

Numbers a ratchet would misrepresent: 842 `dark:` utilities are not a rival to be capped, they
are correct practice with no theme owner to make them reachable. These are the two figures in
this register that *are* frozen — so each is **dated**, and the gate re-measures it on every run
and raises a notice the moment it has moved. It nags; it never fails. (PKCA Rule KC14: for a
self-describing record, currency *is* the evidence standard, and it needs a named owner.)

| Concern | Fact | Count | As at |
|---|---|---|---|
| Theme / colour mode | `dark:` utilities authored across the client | 895 | 2026-07-15 |
| Undo | `<ToastAction>` usages (the mechanism exists) | 1 | 2026-07-13 |

## 5. Outstanding migrations — deferred, owned, not hidden

An owner exists for each concern below and its rivals are capped. What remains is the migration of
existing consumers — recorded here with a **named owner**, because a migration nobody owns is a
migration that does not happen.

| Concern | Finding | What remains | Owner | Why it is deferred |
|---|---|---|---|---|
| Overlay container | `fnd-px-overlay-container-arbitrary` | The existing Dialog / Drawer / Sheet call sites migrate as touched. The ceilings in § 2 stop the population growing meanwhile. | Colin Clapson — as each overlay surface is next touched | Migrating every overlay at once is a behaviour change on 80+ surfaces with no household-visible defect driving it. The ratchet makes deferral safe: the count can only fall. |
| Loading state | `fnd-px-loading-vocabulary` | **~40 standalone `Loader2` usages are *content arriving*, not work-in-a-control** — page and section-level spinners on meal-detail, food-detail, quick-meal, shared-plan, the cookbook's three search panels, and the two scan-review surfaces. By the rule above, each is a `Skeleton`. They migrate as touched. | Colin Clapson — as each surface is next touched | **This row is a correction.** PX1-W4 and W4b both recorded this finding as effectively closed — *"`Loader2` remains legitimate as an inline button-pending mark"* — and the register's first measurement does not support that: 40 of the 180 usages are page- and section-level content placeholders, which the rule above makes drift. The verbatim Skeleton clones and the worst full-page spinner *were* converged (W4.8); the remainder was characterised more generously than the code justified. Recorded as open rather than inherited on trust, which is the whole reason the numbers in this register are measured rather than typed. |
| Status presentation (panel shell) | `fnd-px-panel-shell-half-adopted` | 6 panels still hand-roll a shell: `PlannerAssistantPanel` (1,946 LOC) · `templates-panel` (835) · `MealUpliftPanel` (580) · `SmartReviewPanelContent` (558) · `CookbookMealIntelligenceStrip` (204) · `meal-detail/SimplyBetterChoicesPanel` (125) | Colin Clapson — with the next substantive change to each panel | Since `IntelligenceCard` now composes `Card`, adopting it is strictly a simplification for each — but a 1,946-line panel is not refactored safely as a side-effect of a governance workstream. Enforcement is `review`, not `machine`, because no grep can honestly detect "a hand-rolled shell"; claiming otherwise would be the declared-vs-enforced gap this register exists to close (PKCA Rule KC8). |
| Meal presentation (the core noun) | `fnd-px-no-meal-card-owner` | The cookbook grid and list, the planner picker, preview bubbles and the completion dialog still render a meal their own way (PX1 measured 16 render sites at 7 thumbnail sizes). | Colin Clapson — as each render site is next touched | The owner ships adopted (Dashboard tiles, Home rows) rather than authored-and-empty, which is the failure this register exists to prevent. The remaining sites are a redesign of the cookbook grid if done at once — out of scope for governance, and PX1 forbids redesign. |
| Food item row (layout) | `fnd-px-food-row-no-owner` | A `FoodItemRow` component over the ≥9 row implementations (two of them rivals inside `pantry-page.tsx` alone). | Colin Clapson — deferred, with the next substantive shopping/pantry change | **The household-visible half is closed**: the same basket item used to show a *different quantity string* in the Shopping List and the Shopping Workspace, and `formatQty` (above) ended that. What remains is layout duplication — real, but invisible to a household, and a component that unifies 9 dense row layouts is a redesign. Recorded here rather than claimed as done. |
| Button / primary action | `fnd-px-button-primitive-minority` | The raw `<button>` population migrates to `ui/button` as each surface is touched. | Colin Clapson — as each surface is next touched | The *enforceability* half is done: `variant` is required, so EXP §7 is now reviewable by grep. Converting ~535 raw buttons at once would touch every dense layout in the product — a redesign in all but name. |
| Theme / colour mode | `Carried forward from PX1-W4b §5 — discovered by that workstream, not a PX1 finding` | A theme owner: a provider, a `prefers-color-scheme` read, and a toggle. Nothing anywhere sets the `dark` class — there is no provider, no toggle, no media read — so a full `.dark` token set, `darkMode: ["class"]`, and every `dark:` utility above are authored, paid for in every component, and unreachable. | Colin Clapson — deferred, requires a product decision (does THA offer a theme choice, or follow the OS?) | **This is the register's own thesis, in the one place PX1 never looked**: a foundation authored, paid for, and never adopted. It is recorded here rather than fixed, because shipping a theme toggle is a *product* decision and a new UX surface — which this workstream is explicitly barred from introducing. It is now impossible to hide, which is the register's job; choosing to build it is not. |
| Undo | `Carried forward from PX1-W4b §5` | PX1 §9's rule is that a destructive action requires *a confirm **or** an undo*. THA chose the confirm, at every destructive site (products "Clear All" and the profile guard in W0; pantry and recipe deletes in W2), so **the guarantee holds**. The toast-action mechanism is wired and has exactly one consumer — the planner's "Link to planner" follow-up — which is a next step, not an undo. | Colin Clapson — deferred, and possibly permanently | Stacking an undo toast on top of a confirmation dialog would be a *second* recovery mechanism for the same action, and a new UX pattern. Recorded as a deliberate architectural choice rather than an outstanding defect: THA's answer to "nothing irreversible as a side effect" is the confirm. |
| Signature typography (the third voice) | `ARRIVAL1 — the signature voice is admitted, and adopted by nothing a household can see.` | The decision itself. `/dev/arrival` (ARRIVAL1, which replaced UXHOME1's `/dev/home-arrival`) is a proposal with a binary disposition and no third option: **ADOPT** — fold the Arrival Experience into `home-experience-page.tsx`, move the Caveat `@import` into index.css, and DELETE the prototype; or **REJECT** — DELETE the prototype, and delete `.text-signature`, `.signature-ink` and `--font-signature` with it, reverting §8 to two voices. What may not happen is the third outcome: the prototype surviving its own decision, which is precisely the authored-but-unadopted successor sitting live-looking in the tree that this register exists to make impossible to hide (PX1's `PageHeader.tsx`). **EXP2 (2026-07-15) adds five exploration prototypes** (`/dev/arrival-{a..e}-*`), of which only Prototype A speaks the signature voice; they share the same binary disposition — ideas graduate into the ONE adopted arrival, and every EXP2 prototype file is then DELETED. The exploration widens the evidence for the decision; it does not add a third option. **EXP3 (2026-07-15) adds two synthesis candidates** (`/dev/arrival-s1-quiet`, `/dev/arrival-s2-walking-home`), of which only S1 speaks the signature voice — the strongest EXP2 ideas combined into candidate arrivals, expected to be the FINAL exploration before one canonical arrival is selected. Same binary disposition: the selected ideas graduate; every exploration prototype (ARRIVAL1's successor decision permitting), the EXP3 pair included, is then DELETED. | Colin Clapson — pending review of the prototype | A signature typeface is a brand decision, not an engineering one, and it is the kind of decision that is made by looking rather than by reading. The prototype exists to be looked at. It is recorded here on the day it was built rather than after it is forgotten, because a prototype nobody decided about is how a third typeface enters a product by accident — the exact failure the original §8 rule was written to prevent, and the one the amendment is only safe if this row is honoured. |

## 6. Authored-but-unadopted — the orphan ratchet

A module under these roots with **zero importers** is authored-but-unadopted — the failure state UIA §17 exists to end, and the mechanism behind PX1's `PageHeader.tsx` (a full unadopted successor to `WorkspaceHeader`, sitting live-looking in the tree for a future workstream to adopt *instead of* the real owner). PX1-W4.7 deleted 26 such files. These are what the gate found **after** that sweep — none of them known to any PX1 workstream, all of them found by the register on the day it was built. They are recorded as **defects, not exemptions**: an exemption says "this is fine", and these are not fine. They are simply no longer hidden. The gate fails on a *new* one. This is the same shape as `typecheck:ci`'s recorded baseline of 168 known errors: a number that may fall and may never rise.

The gate fails on a **new** orphan. These are the known ones, each named and owned. They are
recorded as **defects, not exemptions** — an exemption says "this is fine"; these are not fine,
they are simply not hidden.

| Module | LOC | Disposition | Owner |
|---|---|---|---|
| `client/src/pages/list-page.tsx` | 774 | An entire page with no route. `App.tsx` routes `/basket` and `/analyse-basket` to `shopping-list-page`; nothing routes here. 774 LOC of live-looking shopping UI that a future workstream could adopt instead of the real owner — `PageHeader.tsx`'s exact failure mode, still in the tree. | Colin Clapson — confirm unreachable, then delete |
| `client/src/components/illustrations/orchard-hero.tsx` | 62 | Dead illustration component, 0 importers. Survived PX1-W4.7's sweep. | Colin Clapson — delete |
| `client/src/components/ui/toggle.tsx` | 44 | Dead `ui/` primitive, 0 importers. Survived PX1-W4.7's sweep of 20 dead primitives (its `toggle-group` sibling was deleted; this was not). | Colin Clapson — delete |
| `client/src/lib/whole-food-fallback.ts` | 34 | Dead module, 0 importers. | Colin Clapson — delete |

---

## 7. How to change this register

1. **Adopting an owner** — migrate the consumer, then `npm run adoption:record` to tighten the ceiling.
2. **Introducing a new owner** — add a concern row naming what it owns, its predecessor, and its
   first consumers. An owner with no consumers fails the gate, by design: it is not permitted to
   author a foundation and adopt it later.
3. **Retiring a predecessor** — migrate every consumer, delete it, and add it to § 4 in the same
   change. The gate then keeps it dead.
4. **Needing an exception** — raise the ceiling in § 2 or add an exemption in § 3, *with a reason*.
   This is deliberately a visible, reviewable edit rather than a silent one.

_Generated from `adoption-register.json`. The register is operational, not architectural: the law is
the [Experience](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) and
[UI](../../architecture/THA_UI_ARCHITECTURE.md) Architectures'. This file only makes it checkable._
