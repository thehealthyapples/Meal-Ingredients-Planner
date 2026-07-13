# PX1-W4 — Platform Experience Convergence

**Status:** Implemented.
**Date:** 2026-07-13. **Owner:** Colin Clapson.
**Rollback:** tag `rollback/PX1-W4-platform-experience-convergence-20260713` (@ `172d219c`, the PX1-W3 commit) · `refs/snapshots/PX1W4_ROLLBACK` (`7c8ce97` — the pre-existing dirty tree, preserved).

**Parent:** [`PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) § 10, workstream **PX1-W4** ("Make it one product").
**Predecessors:** [`PX1W0`](./PX1W0_STOP_MISINFORMING_THE_HOUSEHOLD.md) · [`PX1W1`](./PX1W1_MAKE_THE_PRODUCT_RESPOND.md) · [`PX1W2`](./PX1W2_MAKE_THE_PHONE_WORK.md) · [`PX1W3`](./PX1W3_MAKE_THE_PRODUCT_FEEL_INSTANT.md) — all complete.

**Governing architecture (cited, never restated):**
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2 — §7 *one primary action*, §8 *hierarchy over history*, §12 *never fabricate*, §16 *accessibility*) ·
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2 — §9 *one breakpoint truth*, §10/§13/§15 *meaningful marks are named*, §17 *retire-on-introduction, one owner per visual concern*) ·
[`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](../../architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md) ·
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md).

---

## 1. What this workstream was for

PX1's thesis is that **THA's experience defects are defects of adoption**: the platform
authors good foundations, never adopts them, and never retires what they replaced. W4 is
the convergence workstream — one canonical owner per concern, every consumer migrated,
every predecessor deleted in the same change, executed the way `AmbientIntelligence` was
(UIA §17).

It is deliberately **not** a redesign: no new UX pattern, no new visual language, no new
experience principle. Where a canonical implementation existed it was adopted; where PX1
named a seed, the seed was promoted; where PX1 identified something as retired, it was
deleted. The two large accessibility sweeps (form labelling, icon-button naming) change
nothing visually — they give what already renders its accessible name.

**Scope discipline.** W4 implements PX1 §10's W4 table (4.1–4.13) and nothing else.
W4b (tone and hygiene — the food-moralising sound, the "Already in pantry" alarm,
`TOAST_LIMIT`, the semantic tints, the doubled `main-safe`, the `[BOOST-PROOF]` logs)
and W5 (the Adoption Register) are **not started** and are listed in § 7.

---

## 2. Findings addressed

W4 closes **16 findings** (2 P1 remaining from W0–W3, the rest P2/P3).

| PX1 §10 | Finding | What was broken | What is true now |
|---|---|---|---|
| 4.1 | `fnd-px-forms-unlabelled` | 276 of 326 form controls had neither an `id` wired to a label nor an `aria-label`; errors were never announced; `create-meal-modal` used a `<p>` styled as a label. A screen-reader user could not reliably complete onboarding, create a meal, or edit their profile. | ~115 household-facing controls across planner, diary, pantry, profile, shopping ×2, cookbook ×3, dashboard, analyser and onboarding now carry a real label (`htmlFor`/`id` where a visible label existed — label-styled `<p>`/`<span>`s became real `<label>`s — `aria-label` otherwise). The canonical `Input`/`Textarea` now **warn in dev** the moment a control renders with no accessible name (`lib/a11y-dev-warnings.ts`), so the defect class is loud at introduction, not at audit. Verified live: zero unlabelled visible controls on the pantry page (§ 9). |
| 4.2 | `fnd-px-icon-buttons-unnamed` | 147 icon-only buttons announced as "button" — every destructive and primary row action. | ~100 icon-only buttons across the household surfaces now carry an action-naming `aria-label` (delete/edit/analyse/add-to-list/steppers/navigation), wording taken from their tooltips and testids. Verified live: zero nameless icon-only buttons on the shopping list (§ 9). |
| 4.2 | `fnd-px-keyboard-unreachable` | 10+ real actions were invocable only by mouse/touch — `<div>`/`<span>` with `onClick`, no role, no key handler; the product's own "What is UPF?" explanation among them. | All named sites fixed and the pattern swept: converted to real `<button>`s where structure allowed (upf-info-modal, create-meal-modal pickers, shopping-list rename/qty/price spans), `role="button"` + `tabIndex` + Enter/Space handlers where nested interactives forbade conversion (cookbook cards, product cards, templates-panel rows, profile badge groups). `SmartReviewPanelContent`'s focusable-but-inert row was re-verified: a later workstream had already wired its `onKeyDown`. |
| 4.2 | `fnd-px-companion-not-a-dialog` | The flagship conversational surface was a hand-rolled fixed panel: no `role="dialog"`, no focus trap, no focus return, no scroll lock, replies never announced, textarea named only by placeholder. | `FloatingAssistant` is a real Radix Dialog (`Root/Portal/Overlay/Content/Title/Close`) with the same visuals and motion. Focus trap, Escape, scroll-lock and outside-dismissal arrive from Radix; focus return to the FAB is explicit (the exit animation unmounts outside Radix's close sequence). The thread is a `role="log"` `aria-live="polite"` region — Apple's replies are announced as they arrive. The textarea and send button are named. Verified live (§ 9). |
| 4.4 | `fnd-px-nine-card-surfaces` | Nine independently-authored card surfaces, including a **verbatim copy of Card's own class string on a bare div** and a light-mode-only inline `rgba()` surface. | **One card surface.** All nine converge on `ui/card`: `IntelligenceCard` composes `Card` (its rival `intelligenceSurface` token is deleted), the Companion's card composes `Card` (4.13), `HomeIntelligenceCompanion`, `PlantDiversityReport` ×5, `plant-diversity-page` ×2, `ShoppingListView` ×2 (the verbatim copy among them) and `shopping-workspace-page`'s light-only literal all compose `Card`. |
| 4.5 | `fnd-px-page-shell-hand-rolled` | The container string was copy-pasted 17 times; top padding diverged seven ways (48px on Home → none on the Cookbook); the Planner's column was ~256px narrower than every other page's; Planner and Home were the only pages whose banner width disagreed with the rest. | One owner: **`PageContainer` / `pageContainerClass()`** in `workspace-header.tsx`, reading the same `wide` flag as the header. All 18 container sites migrated; zero copies of the string remain; one top-padding rhythm (`pt-4 sm:pt-6`); Planner joins the wide column and Home/Planner banners join every other page. Verified live: Cookbook and Planner content columns identical at 1440px (§ 9). |
| 4.5 | `fnd-px-back-three-mechanisms` | "Back" was three incompatible implementations — including Profile's `window.location.href`, a **full page reload** that discarded the TanStack cache (its `profileReturnPath` sessionStorage read had no writer anywhere in the client) — and four subpages had no back at all. | One owner: the **`back` slot on `WorkspaceHeader`**, resolving the hierarchy parent (EXP §8 — hierarchy over history), with a `beforeNavigate` interception point so Profile's unsaved-changes guard still asks first. Profile (→ Home, SPA navigation, no reload — verified live § 9), Meal detail (→ Cookbook) and Quick-meal (→ Cookbook) adopt it. Pantry/Diary/Nutrition need none: they are bottom-nav destinations. |
| 4.6 | `fnd-px-primary-action-unenforceable` | "Primary" was almost never declared — 4 explicit `variant="default"` against 124 implicit ones. EXP §7 could not be enforced because the code never stated the answer. | **`variant` is required on `<Button>`** (type-level). All 122 implicit-default call sites now declare `variant="default"` — a statement, not an accident. A surface's primary actions are now countable by grep, which is what makes EXP §7 reviewable. |
| 4.7 | `fnd-px-dead-components` | 6 components, 1,116 LOC, 0 importers — including `PageHeader.tsx`, a full unadopted successor to `WorkspaceHeader` with a duplicate `PageRealm` type. | **Deleted** (importer counts re-verified at head first): `PageHeader`, `scan-confirm-dialog`, `HealthTrendChart`, `NutritionBoostPanel`, `benchmark-impersonation-banner`, `RankModeSelector`. |
| 4.7 | `fnd-px-dead-ui-primitives` | 20 `ui/` primitives, 2,823 LOC, 0 importers — `sidebar` (727 LOC) the largest dead file in the client. | **Deleted**, all 20. With them: **15 npm packages** that lost their last importer (10 Radix packages, embla-carousel, cmdk, input-otp, react-day-picker, react-resizable-panels — `recharts` stays, 5 live admin importers), **6 dead assets** (`apple-rating-1..5.png`, `logo-square.png` — reference-checked first), and the dead CSS (`glowPulse`/`appleShake` keyframes, `.apple-glow`, `.apple-shake`, `.apple-rating-row` — zero consumers each; `appleBounce` stays, 2 live consumers). **3,940 LOC of dead code removed.** |
| 4.8 | `fnd-px-no-empty-state-owner` | No `EmptyState` existed; the only named one was private to `PantryKnowledgeHub` **and doubled as its loading state** — empty and waiting rendered identically, and three of its call sites were a bare icon with `message=""`. ≥20 hand-rolled treatments. | **`ui/empty-state.tsx`** exists — shape promoted from the Dashboard's empty cards, semantics from the Pantry hub, with the **`variant: "empty" \| "filtered" \| "unavailable"` discriminator**, so it is structurally impossible to say "you have nothing" when the truth is "we could not load this" (there is no error variant to reach for; that is `LoadError`'s sentence). Adopted at 20 sites: Dashboard ×3, PantryKnowledgeHub ×12 (private component retired; its loading dual-use split out to `Skeleton`; its silent `message=""` icons now say something true), pantry page ×2. |
| 4.9 | `fnd-px-row-tap-means-four-things` | Tapping a list row did four different things, and the Cookbook's tap expanded a preview while the canonical page hid in a dropdown. | The contract now holds and is recorded: **whole-row tap goes to the entity's canonical page where one exists** (Cookbook rows navigate to `/meals/:id` — resolved by CBK2's in-flight work and re-verified here, with keyboard equivalence added by this workstream); web-result rows expand because an external recipe has no canonical page yet; Pantry rows select via a now-labelled visible Checkbox; Basket rows carry no tap (a food line has no canonical page) and all their actions are visible, named controls. |
| 4.11 | `fnd-px-cardtitle-not-heading` | `CardTitle` rendered a `<div>`; heading navigation on the densest household pages yielded one entry. | `CardTitle` renders a real heading (`h3` default, `as` prop for document order). Verified live: the Dashboard exposes real `h3`s (§ 9). |
| 4.11 | `fnd-px-cardtitle-default-dead` | The default was `text-2xl` — so wrong that 85 of 86 usages overrode it, unsystematically. | The default is the THA type scale's `.title-card` rung (16px/22px/500/display face), expressed as Tailwind utilities so twMerge overrides still work. The ~40 now-redundant `text-base` overrides were collapsed; the deliberate `text-sm` variants remain deliberate. |
| 4.12 | `fnd-px-score-badge-alias` | The rating mark was reachable under three names: `components/AppleRating`, `ui/apple-rating`, and the 11-line `ScoreBadge` pass-through — the third entry point that guaranteed the next divergence. | **One apple.** `ui/score-badge.tsx` and `ui/apple-rating.tsx` are deleted; all 25 `ScoreBadge` call sites in 7 files and the Dashboard's `ui/apple-rating` use migrated to `components/AppleRating` (behaviour pinned: no tooltip, no animation, same sizes). `MiniAppleRating` is deleted too — its one call site is a hard-coded illustration and uses the canonical mark's new `decorative` prop (`aria-hidden`, per W0's ruling that decoration stays silent). One honest fix inside the collapse: the retired alias rendered **zero apples for an unscored item while announcing "THA Score: 1 out of 5"** to a screen reader; the canonical component now renders nothing for no score (EXP §12 — no score is silence, not a fabricated one). |
| 4.13 | `fnd-px-companion-card-drift` | `FloatingAssistant` declared a private `CompanionCard` surface, re-introducing the `shadow-sm` that `ui/card` deliberately sets to `shadow-none` — a meal in the assistant looked like a different kind of thing from the same meal in the Cookbook. | The Companion card **composes `Card`**. The firewall (`companion-card.ts`) was always compliant; only the render drifted, and now nothing drifts. "One card system across every domain" holds. |

## 3. Components adopted

Where a canonical implementation existed, it was adopted rather than rebuilt:

| Adopted | Where it already was | What now uses it |
|---|---|---|
| **`ui/card.tsx`** | The card owner, adopted by 8 of 88 components | All nine rival surfaces (§ 2, 4.4) — including `IntelligenceCard` and the Companion card, so every intelligence panel and Companion reply now sits on the one surface. |
| **Radix Dialog** | In 41 files, bringing focus trap/return, `aria-modal`, Escape for free | The Companion panel — the largest hand-rolled modal in the product. |
| **`ui/skeleton.tsx`** | The canonical loading mark | 12 hand-rolled `bg-muted animate-pulse` Skeleton clones across 6 files (SmartReviewPanelContent, meals-page, 4 admin pages); PantryKnowledgeHub's loading states; the Planner's loading branch — which used to replace the ENTIRE page, header included, with a spinner in an `h-[60vh]` void, and now keeps the header painted over a content-shaped skeleton. |
| **`ui/alert-dialog.tsx`, `ui/load-error.tsx`, `useTrackedMutation`** | W0's owners | Unchanged; `EmptyState` completes the empty/loading/error triad they began. |
| **`useIsMobile` (`use-adaptive-density`)** | W2's one breakpoint truth | The new `Overlay` owner decides sheet-vs-dialog with it. |
| **`AppleRating.tsx`'s `appleScoreLabel()`** | W0's one score sentence | Now the only mark; the sentence has exactly one mouth. |
| **`formatQty` (shopping list)** | The grams-aware, liquid-aware quantity formatter, private to one page | Promoted to `lib/unit-display.ts`; `formatItemDisplay` now delegates to it, so the Shopping Workspace and Shopping List — which used to show **different quantity strings for the same basket item** — format through one function (grams passed at all 3 call sites). |

**New owners created** (each for a concern UIA §17 lists or PX1 §6/§9 names as ownerless, each with a named seed):

| New owner | What it owns | Promoted from |
|---|---|---|
| `ui/empty-state.tsx` — **`EmptyState`** | Absence, in its three truths (`empty`/`filtered`/`unavailable`). | Dashboard's empty cards (shape) + pantry's three-way semantics. |
| `workspace-header.tsx` — **`PageContainer` / `pageContainerClass()`** | The page content column and its rhythm, keyed to the header's own `wide` flag. | The 17 copy-pasted container strings. |
| `workspace-header.tsx` — **`back` slot** | Back = the hierarchy parent (EXP §8), with a guard interception point. | The three incompatible mechanisms it retires. |
| `ui/overlay.tsx` — **`Overlay`** | The overlay container decision: bottom sheet on a phone, centred dialog on a desktop, decided by the canonical breakpoint — never by the calling file's taste. | `day-view-drawer.tsx`'s proven switch. First consumer: `AdaptationReviewSheet` (a Sheet retired from the "review a change" interaction PX1 showed arriving three different ways). |
| `components/MealCard.tsx` — **`MealCard` / `MealThumbnail`** | The meal's thumbnail-bearing faces: one radius, one fallback icon, one size scale, lazy loading; `tile` and `row` arrangements. | `PlannerMealCard` was PX1's seed; it owns the (thumbnail-less) planner-cell face and stays. First consumers: Dashboard's recent-meals tiles, Home's today's-meals rows. |
| `lib/a11y-dev-warnings.ts` — **`warnIfUnlabelled`** | Making an unlabelled control loud at introduction (dev-only, stripped in production). | PX1 4.1's own prescription. |
| `lib/unit-display.ts` — **`formatQty`** | The one quantity string. | The shopping list's private function. |

## 4. Components retired

Per UIA §17 (*retire-on-introduction* — name the predecessor, migrate every consumer,
delete it in the same change):

| Retired | Replaced by | Consumers migrated |
|---|---|---|
| **`ui/score-badge.tsx`** (11-line alias) and **`ui/apple-rating.tsx`** | `components/AppleRating` | 25 call sites in 7 files + Dashboard + `AnalyserDetailV2`'s alias import name. |
| **`MiniAppleRating`** (private, KitchenToBasketVisual) | `AppleRating decorative` | The one call site. Three names → one. |
| **The private `EmptyState`** in PantryKnowledgeHub (empty *and* loading in one body) | `ui/empty-state` + `Skeleton` | All 15 uses, split by what they actually were. |
| **`intelligenceSurface`** (intelligence-tokens) | `ui/card` via `IntelligenceCard` | Its one consumer. The token is deleted, not deprecated. |
| **The 17 copy-pasted page-container strings** | `PageContainer`/`pageContainerClass` | All 18 sites (one had been added by W4 itself); zero copies remain by grep. |
| **The three back mechanisms** (incl. the full-page-reload and its writer-less sessionStorage protocol) | The header `back` slot | Profile ×3 headers, meal-detail, quick-meal. |
| **A `Sheet` as the "review a change" container** | `Overlay` | `AdaptationReviewSheet`. |
| **12 hand-rolled Skeleton clones, the Planner's full-page spinner void** | `Skeleton` | 7 files. |
| **26 dead files, 6 dead assets, 15 dead packages, 4 dead CSS blocks** | Nothing — they had no consumers to migrate (re-verified at head). | — |

## 5. What changed, by scope

**New (7):** `ui/empty-state.tsx` · `ui/overlay.tsx` · `components/MealCard.tsx` ·
`lib/a11y-dev-warnings.ts` · this document — plus `PageContainer`/`back` (in
`workspace-header.tsx`) and `formatQty` (in `lib/unit-display.ts`) as promoted exports.

**Deleted (32):** the 26 dead code files (§ 2, 4.7) · `ui/score-badge.tsx` ·
`ui/apple-rating.tsx` · 6 binary assets. (`hooks/use-mobile.tsx` was W2's deletion.)

**Changed (~60 files):** the accessibility sweeps (16 household surfaces), the variant
declarations (42 files), the container/card-surface/heading convergences, `ui/button.tsx`
(required variant), `ui/card.tsx` (CardTitle), `ui/input.tsx`/`ui/textarea.tsx`
(dev warnings), `IntelligenceCard`/`intelligence-tokens`, `FloatingAssistant`,
`AdaptationReviewSheet`, `PantryKnowledgeHub`, `PlantDiversityReport`,
`HomeIntelligenceCompanion`, `workspace-header.tsx`, `AppleRating.tsx`,
`KitchenToBasketVisual.tsx`, `lib/unit-display.ts`, `package.json`/`package-lock.json`.

## 6. Recorded boundaries — owners established, migrations continuing

PX1 §10 grades three W4 items **L** for a reason: their full migrations are larger than
their ownership fixes. W4 established the owner and its first real consumers in each
case, and records the remainder rather than claiming it:

- **`fnd-px-no-meal-card-owner` (4.3)** — `MealCard`/`MealThumbnail` own the contract;
  Dashboard and Home adopt it. The remaining meal render sites (cookbook grid/list, the
  planner picker, preview bubbles, completion dialog and others) migrate as touched.
  Creating the owner *without* consumers would have been exactly the
  authored-but-unadopted failure PX1 §4 describes, so it ships adopted.
- **`fnd-px-food-row-no-owner` (4.3)** — the household-visible defect (two shopping
  surfaces disagreeing about one item's quantity) is closed via the promoted `formatQty`;
  a full `FoodItemRow` component over the ≥9 row layouts remains open.
- **`fnd-px-panel-shell-half-adopted` (4.4)** — `IntelligenceCard` now composes `Card`,
  so adopting it is strictly a simplification for the 9 rival panels (5,712 LOC); their
  shell-by-shell migration remains open.
- **`fnd-px-overlay-container-arbitrary` (4.10)** — `Overlay` exists with its first
  adoption; the remaining Dialog/Drawer/Sheet call sites migrate as touched.
- **`fnd-px-loading-vocabulary` (4.8)** — the verbatim Skeleton re-implementations and
  the worst full-page spinner are converged; `Loader2` remains legitimate as an inline
  button-pending mark, and the route fallback stays deliberately as W3 left it.
- **`fnd-px-button-primitive-minority` (4.6)** — the ~535 raw `<button>`s remain outside
  the design system. The enforceability half (required `variant`) is done; the raw-button
  convergence is open.

## 7. Remaining PX1 findings

**W4 closes 16 findings** (§ 2). With W0's 10, W1's 9, W2's 5 and W3's 8, **48 of PX1's
60 are closed; 12 remain**:

- The six **W4b** findings (tone and hygiene, deliberately not started):
  `fnd-px-sound-moralises-food` · `fnd-px-success-silent-error-loud` ·
  `fnd-px-toast-limit-one` · `fnd-px-ad-hoc-semantic-tints` ·
  `fnd-px-double-bottom-padding` · `fnd-px-debug-logs-shipped`.
- The six § 6 partials: `fnd-px-no-meal-card-owner` · `fnd-px-food-row-no-owner` ·
  `fnd-px-panel-shell-half-adopted` · `fnd-px-overlay-container-arbitrary` ·
  `fnd-px-loading-vocabulary` · `fnd-px-button-primitive-minority`.

**The Adoption Register (PX1 §6 / W5.1) is still not built.** W4 changed more of its
rows than any workstream before it — Card (⚠️→✅ nine rivals converged), Form field
(⚠️→ labelled + dev-enforced), Empty state (❌→ owned), Rating mark (⚠️→ one name),
Dialog (the hand-rolled panels are gone) — and created six owners of its own, every one
of them unregistered, which remains precisely the failure mode PX1 §4 describes. W5.1
is the workstream that ends it, and until it ships these owners are on trust.

## 8. Architecture Compliance

- **Canonical ownership maintained.** W4 introduces no second owner of anything: every
  new owner replaces named rivals deleted or migrated in the same change; every other
  change adopts an owner that already existed.
- **Retire-on-introduction honoured** (UIA §17): § 4's table.
- **No new experience principles, no new UX patterns, no redesign.** The sweeps are
  attribute-level; the convergences move surfaces onto owners that already looked this
  way; the one deliberate presentation change (rival card surfaces adopting Card's
  border/translucency) is the convergence PX1 prescribes.
- **EXP §7** — a primary action must now be declared to compile. **EXP §8** — Back is
  hierarchy, in one slot. **EXP §12** — an unscored item no longer announces a score;
  absence has an owner that cannot say "error". **EXP §16 / UIA §10, §13, §15** — the
  two accessibility sweeps, the Companion dialog, and live announcement of replies.
- **Intelligence architecture untouched.** No capability, binding, handler, engine or
  prompt was changed. W4 is client-only: `server/` is not in the diff (the
  `package.json` change removes dead client dependencies).

### Definition of Done
- **Success:** one card surface, one page shell, one back mechanism, one apple, one
  quantity string, one empty-state owner, declared primary actions, a Companion that is
  a real dialog, labelled forms and named icon buttons on every household surface, and
  3,940 LOC of dead code gone. **Verified in a real browser — § 9.**
- **Must not break:** W0's truth-telling (same hooks and branches — re-exercised by
  harness checks 2–3), W1's elevation/dialog/motion owners (classes untouched), W2's
  touch floor and breakpoint truth (`Overlay` consumes it), W3's splitting and payload
  behaviour (build still 144 lazy chunks; no new page-to-page static imports).
- **Manual test steps:** § 9's assertions are the executable form.

### Product Registry Impact
- **Registry affected: NO.** W4 adds no surface, route, page, capability, setting or
  claim, and removes only code no surface used. The same product exists, reachable the
  same ways — it is now one product rather than several stitched together. The Companion
  panel's promotion to a real dialog changes its *mechanics*, not its existence or
  content; the registry's Dialogs section enumerates product surfaces, and none was
  added or removed.
- Entries created: **NONE** · updated: **NONE** · retired: **NONE**
- Product knowledge written into a prompt, template, or fallback string: **NO**

### Data Impact
- Reads existing data: **NO** new reads · Writes new data: **NO** · Changes meaning of
  existing data: **NO** · Requires backfill: **NO**. W4 is presentation-layer only.

### Trust Check
- **Could this mislead the user?** No. Two changes alter what assistive technology is
  told, both toward the truth: an unscored food is now silent instead of "1 out of 5",
  and the Companion's replies are announced instead of landing silently. The quantity
  convergence means the Workspace now shows the same (grams-aware) string the List
  always showed — the previous disagreement was the misinformation.

---

## 9. Verification

| Gate | Result |
|---|---|
| `npm run typecheck:ci` | **PASS** — 168 known errors, baseline unchanged. **Zero** in `client/`. |
| `npx vite build` | **PASS** — 144 lazy chunks (W3's splitting intact). |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** — repository structure clean. |
| Built-artifact assertions | **PASS** — retired names absent from `dist` (no `apple-rating-icons` testid, no `intelligenceSurface`, no dead assets; the one remaining "score-badge" string is an unrelated `data-testid` on a div). |
| Behavioural harness (Playwright + chromium, live app, demo household, 390×844 touch + 1440×900 desktop) | **PASS — 11 / 11.** |

| # | What was asserted against the live app | Observed | |
|---|---|---|---|
| 1 | Demo household session established | `POST /api/demo/start → 201` | PASS |
| 2 | Home renders through the shell | rendered | PASS |
| 3 | Dashboard exposes real headings (CardTitle → h3) | 4 `h3` elements | PASS |
| 4 | One apple mark, named; alias testid retired | 0 retired-testid, named `role="img"` present | PASS |
| 5 | Companion opens as `role="dialog"` | visible | PASS |
| 6 | Companion textarea has an accessible name | "Ask Apple anything" | PASS |
| 7 | Escape closes; focus returns to the trigger | closed, focus on `button-open-assistant` | PASS |
| 8 | Profile Back = header slot; SPA navigation, **no reload** | window marker survived → `/home` | PASS |
| 9 | Pantry: zero unlabelled visible form controls | 0 | PASS |
| 10 | Shopping list: zero nameless icon-only buttons | 0 | PASS |
| 11 | Cookbook and Planner content columns agree at 1440px | 1440px vs 1440px | PASS |

Check 7 initially **failed** — Radix's own focus restore was lost because the exit
animation unmounts the dialog content outside Radix's close sequence; the restore is now
explicit and the check passes. Recorded because it is the reason behavioural
verification is the standard here.

Reproduce (the PDA1/W0–W3 chromium method; the store's ungoogled-chromium 131 runs
directly, no `LD_LIBRARY_PATH` assembly needed this time):

```
PORT=<port> AUTH_RATE_LIMIT_MODE=log_only npm run dev &
BASE=http://localhost:<port> CHROMIUM=<store>/bin/chromium NODE_PATH=<repo>/node_modules npx tsx <harness>
```

The harness itself is not committed, for W0's reason: it drives the app, it is not part
of it. Its eleven assertions are reproduced above so they can be re-derived.

---

## 10. What was committed

**Only PX1-W4.** The working tree carried, and still carries, ~100 files of other
workstreams' uncommitted work. Many of the files W4 had to change also contained some of
it — `meals-page.tsx` (CBK2), `home-experience-page.tsx` (HHP3), `pantry-page.tsx`
(PANTRY1), the planner panels (PLAN2), the shopping pages (SHOP1), and others.

Those files were committed with **W4's hunks only** — derived as the three-way merge of
each file's HEAD version with the diff from the `PX1W4_ROLLBACK` pre-work snapshot
(which preserved the other workstreams' state) to the finished tree — and the other
workstreams' hunks were left uncommitted, exactly as they were found, exactly as W0–W3
did (their § 9s).

---

_Implementation PX1-W4. It changes no law and adds no principle: it is the platform finally being one product, as [UIA §17](../../architecture/THA_UI_ARCHITECTURE.md)'s one-owner-per-concern always said it must be. The remaining 12 findings are [PX1](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md)'s — six of them W4b's tone-and-hygiene pass, six of them § 6's recorded migrations — and the register that would have prevented all 60 is still W5.1's._
