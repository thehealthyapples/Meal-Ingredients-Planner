# PX1 — Platform Experience Discovery & Architecture

**Status:** Discovery & Architecture complete. **No implementation performed.**
**Date:** 2026-07-12. **Owner:** Colin Clapson.
**Rollback:** `rollback/PX1-platform-experience-discovery-architecture-20260712` (tag @ `b4a63af8`) · stash `PX1_ROLLBACK` · `refs/snapshots/PX1_ROLLBACK` (`6ecfdb5`).

**Governing architecture (cited, never restated):**
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2) ·
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2) ·
[`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](../../architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md) ·
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md) ·
Product Knowledge Registry ([`docs/product/`](../../product/)).

**Predecessor:** [`PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md`](../../investigations/ux/PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md) — complete.

---

## 1. Mandate, and a correction to the premise

PX1 was opened as a *resume*. It could not be: **PX1 had never been started.** No document,
no rollback, no session file, no commit, no reference anywhere in the repository. This
document is its first artefact. Recorded here rather than quietly papered over, because an
audit that misreports its own starting state has no standing to report on anything else.

Its predecessor, **PDA1, is complete** — 31 findings, a 154-entry Product Knowledge Registry,
an 18-surface screenshot baseline, and a 6-phase UX transformation roadmap. **PX1 does not
restart it, re-derive it, or overrule it.** PDA1 audited *reachability, naming, claims and
safety*: what THA has, what a household can get to, and what it is told. It did not audit
**craft** — whether the things a household can reach behave consistently, say what is
happening, and work on a phone.

That is PX1's mandate, and its boundary:

| PX1 audits (PDA1 did not) | PX1 does not touch (owned elsewhere) |
|---|---|
| Card systems · layout consistency · interaction consistency | Canonical experience principles → **EXP §3** |
| Empty states · loading states · error states · feedback | Visual law, tokens, motion → **UIA §4–16** |
| Mobile behaviour · accessibility · performance | Domain & surface ownership → **`docs/product/OWNERS.md`** |
| Component ownership · duplication · well-governed areas | Reachability, naming, claims → **PDA1** |

## 2. What PX1 deliberately does not do

**It creates no new experience principles.** The eight Experience Principles (EXP §3), the
Premium lens (EXP §17), and the UI Principles (UIA §3) already exist, are already correct,
and already say everything PX1 would have said. Authoring a rival set would create precisely
the second owner that **Experience Principle 6** ("one canonical place for everything") and
**UIA §17** forbid — in a document whose whole thesis is that THA does not enforce its own
ownership rules. PX1 therefore **cites** the law and **measures compliance against it**.

**It implements nothing.** Every finding below is a recommendation. No product code, no UI,
no new features. The working tree was left as found (105 pre-existing modified files,
untouched).

## 3. Method

Ten dimensions, audited in parallel against source — never from memory, never from a
filename. Every claim carries a `file:line`. Findings were then **independently re-verified**
against the code before being admitted here; three inherited claims were corrected or
downgraded in the process (§11), and the two claims that most flattered the audit's own
narrative were the ones checked hardest.

Severity is graded by **household impact** — what it costs the person using THA — not by
engineering effort.

---

## 4. The discovery in one page

**THA's experience defects are not defects of knowledge. They are defects of adoption.**

Nearly every canonical owner PX1 looked for already exists, is well designed, and is
partially adopted. `WorkspaceHeader` (18 importers) is excellent. `IntelligenceCard` (16) is
the best-designed card contract in the repository. `AmbientIntelligence` (8) is a textbook
retire-on-introduction. `.main-safe` correctly owns bottom-nav clearance for every routed
page. `ui/form.tsx` wires `htmlFor`, `aria-describedby` and `aria-invalid` exactly right. The
bottom nav is the one surface in the product that meets the 44px touch floor by construction.
The text equivalent of the apple score is *already written*.

And then: `ui/form.tsx` is imported by **2 files**. The apple score's text equivalent is
unreachable. `prefersReducedMotion()` has **0 consumers**. `PageHeader.tsx` has **0
importers**. `hover-elevate` — the *only* hover mechanism on every Button, Badge and clickable
Card — is **defined nowhere**.

This is not a team that does not know how. It is a platform that **authors foundations and
never adopts them, and never retires what they were meant to replace.** UIA §17 names that
exact failure state and mandates the countermeasure — an **adoption register**, so that
"authored-but-unadopted must be impossible to hide."

**That register has never been built.** It is the one thing in the user-facing layer with no
owner, and its absence is the mechanism by which every finding below survived. Building it is
PX1's canonical deliverable (§6). PX1 adds no law; it makes the existing law *checkable*.

Five through-lines carry the 60 findings:

1. **The design system is inert.** Hover, press, dialog sizing, and reduced motion are all
   specified and none of them execute. An un-ported scaffold left THA's primary interaction
   feedback wired to CSS that does not exist.
2. **THA cannot say what is happening.** No `EmptyState`, no `ErrorBoundary`, no error branch
   on 14 of 16 household pages, and 35 mutations that fail in silence. A failed request and an
   empty household are rendered identically.
3. **The core object has no owner.** A meal renders 16 ways at 7 thumbnail sizes; a food-item
   quantity formats two ways in two shopping surfaces; a panel shell is re-implemented 9 times.
4. **The household half of the product is the less accessible half.** The score THA exists to
   deliver is silent to a screen reader. Admin pages have proper headings and error components;
   household pages do not.
5. **Mobile is well thought out and one attribute away from working.** Twelve correct
   safe-area calls, disabled by a missing `viewport-fit=cover`.

---

## 5. Findings

**60 findings** — 5 P0 · 20 P1 · 25 P2 · 10 P3 — each with a stable `fnd-px-*` id. **None
duplicates PDA1's 31.** Where PX1 touches the same surface, it records the *distinct* defect and
cites PDA1's id. Id parity is checked both ways: every id cited in a workstream (§10) is defined
in a table below, and every id defined below is resolved by a workstream.

### P0 — The household is misinformed about its own data

| id | Surface | Evidence | Household impact |
|---|---|---|---|
| `fnd-px-false-empty-home` | Home | `home-experience-page.tsx:98–122` — five `useQuery` calls, **zero** `isLoading`/`isPending`/`isError` in the entire file. Every one destructures `= []`. First paint therefore hits `todaysMeals.length === 0` (`:223`) → *"Nothing planned for today yet"*, and `openShoppingCount === 0` (`:274`) → *"Your list is clear."* | On the emotional centre of the product (EXP §4), a household with a full week planned and a full basket is told they have neither. The file's own header comment promises "never fabricated"; the loading path defeats it. Violates EXP §12 *Never fabricate*. |
| `fnd-px-false-empty-dashboard` | Dashboard | `dashboard.tsx:77–90` — destructures only `{ meals }` from `useMealsSummary()` (which exposes `isLoading`); two `useQuery` with `= []`. No page-level loading branch. Renders "No meals yet / **Add Your First Meal**" (`:306`), "No meals planned yet" (`:481`), "No meals in your collection yet" (`:541`) while data is in flight. | Every visit begins by telling the household their cookbook is empty. The best-designed empty states in the codebase are the ones firing falsely. |
| `fnd-px-error-renders-as-empty` | All 14 household pages | `queryClient.ts:53–66` sets `retry: false` with **no** `QueryCache` error handler; **no `ErrorBoundary` exists anywhere in `client/src`** (0 files). Combined with the universal `= []` default, a thrown query leaves `data` undefined → the empty state renders. `isError` is read on exactly **2 of 16** household pages. | A household cannot distinguish *"the server is down"* from *"you have nothing."* No retry, no explanation, no way forward. Violates EXP §14 in full. |
| `fnd-px-basket-confirms-wrong-call` | Basket (all surfaces) | `use-basket.ts:15,23,31,38` — all four mutations have **only** `onSuccess: invalidate`; no `onError`, no toast. Call sites fire `addToBasket(...)` **unawaited** and then `await` a *separate* shopping-list POST inside the `try`, toasting **that** call's success: `meals-page.tsx:2268–2283`, `meal-completion-dialog.tsx:200–211`, `meals-page.tsx:929,1322,661`. | A failed basket write is **actively confirmed as a success**. THA tells the household "Added to basket" when the basket is unchanged. The most-used action in the product is 100% unobserved. |
| `fnd-px-apple-score-inaudible` | Every score surface | `ui/apple-rating.tsx:11–38` — the score is encoded as **the number of apple `<img>`s**, every one `alt=""`. Zero `aria-label`, zero `role`, zero `sr-only` in the file. 15+ call sites (shopping list, workspace, products, analyser, dashboard, product picker). The text equivalent **already exists** at `AppleRating.tsx:85` (`` `THA Score: ${n}/5 - ${label}` ``) but is delivered only via a tooltip on a **non-focusable `<div>`** (`:59–63`) — unreachable by keyboard. | A blind or low-vision household member **cannot learn whether any food is good.** THA's entire value proposition is unanswerable by ear. Violates UIA §10 ("meaningful marks are named"), §15 ("imagery never carries unnamed meaning"), EXP §16 ("whatever is shown is available to a screen reader"). |

### P1 — Broken interaction, unreachable controls, silent failure

| id | Surface | Evidence | Household impact |
|---|---|---|---|
| `fnd-px-dead-elevation` | Every Button, Badge, clickable Card | `ui/button.tsx:9` puts `" hover-elevate active-elevate-2"` in the **base** of `buttonVariants`; `ui/badge.tsx:9` likewise; 12 files use it. **`index.css` — the only stylesheet (`main.tsx:3`) — contains zero occurrences of `elevate`.** No variant declares any `hover:` class: `grep -c "hover:"` → **button.tsx 0, card.tsx 0, badge.tsx 0**. The tokens the variants consume (`--primary-border`, `--secondary-border`, `--destructive-border`, `--button-outline`) are **never defined** (0 in `index.css`). Un-ported Replit scaffold. | **Every button, badge and clickable card in THA is inert on hover and on press.** Nothing lights up when the household points at or presses anything. The app feels dead, and nothing confirms "I hit it." Violates EXP §17 Premium Principle 4 and UIA §12. |
| `fnd-px-invisible-destructive-controls` | Pantry, Planner, Diary | Delete/remove rendered `opacity-0 group-hover:opacity-100` — **7 controls across 5 files**: `pantry-page.tsx:568`, `:937`, `weekly-planner-page.tsx:2472`, `:2708`, `food-diary-page.tsx:958`, `:1709`, `PlannerMealPickerPanel.tsx:690`. Touch devices have no hover; `opacity:0` does **not** remove hit-testing. `pantry-page.tsx:569` fires `deleteMutation.mutate(item.id)` **immediately, with no confirmation**. | On the phone THA is actually used on, an **invisible delete sits at the end of every pantry row and fires on contact.** It is also the *only* delete path — a household cannot remove a pantry item deliberately, only accidentally. |
| `fnd-px-shop-mode-row-under-nav` | Shopping (Shop mode) | `shopping-workspace-page.tsx:2267` is `fixed inset-0 z-50`, escaping `<main class="main-safe">` (`App.tsx:149`) which reserves the 80px nav clearance. Its scroller (`:2290`) gives only 16px bottom padding. Nav is `fixed bottom-0 z-50` (`nav-bar.tsx:727`). Same at `shopping-list-page.tsx:3028`. | **In the supermarket, the last item on the list is under the nav and cannot be ticked.** The single most mobile-critical surface in the product. |
| `fnd-px-dialog-no-max-height` | All 69 dialogs | `ui/dialog.tsx:41` base is `fixed left-[50%] top-[50%] translate-y-[-50%] w-full max-w-lg p-6` with **no `max-h` and no `overflow-y-auto`**. A centre-translated fixed element sits outside every scroll container. 44 of 69 `<DialogContent>` add no `max-h` of their own. | On a 375×667 phone with the keyboard open (~330px usable), a form dialog's submit button is **off-screen and cannot be scrolled to**. |
| `fnd-px-fab-covers-nav` | Every page | `FloatingAssistant.tsx:1443` FAB is `fixed bottom-6 right-6 z-50`, rendered at `App.tsx:162` — **after** `BottomNav` (`:159`) at the same `z-50`, so it paints on top. | An opaque FAB covers the last bottom-nav destination. Tapping **Analyser** opens the assistant instead. `meal-detail-page.tsx:1214` puts "Save Changes" at the *same coordinates* — occluded by the FAB while editing a recipe. |
| `fnd-px-no-empty-state-owner` | Whole client | **No `EmptyState` component exists** (`ui/` has no `empty-state.tsx`). The only one is a **private, unexported** helper at `PantryKnowledgeHub.tsx:958` — which doubles as a *loading* state (`:347` "Searching…", `:473` "Loading foods…") and once renders `message=""` (`:643`) — a bare icon that says nothing. **≥20 distinct hand-rolled empty treatments**, vertical padding spanning `py-0.5`→`py-20`, five different icon treatments. | Every absence is a fresh invention. Empty and loading are rendered identically in places, so the household cannot tell them apart. UIA §17 names empty state and loading state as concerns **requiring an owner**; neither has one. |
| `fnd-px-silent-mutations` | Basket, pantry, diary, products, prefs | **35 of 175 mutations have no `onError`** — all household-facing. Worst: `use-basket.ts` (4/4), `pantry-page.tsx:273,290,299` (+ duplicate block `:693–724`), `food-diary-page.tsx:1391`, `products-page.tsx:497,579,588`, `shopping-list-page.tsx:1961,1978,1995,2079`, `MealUpliftPanel.tsx:192,331`, `use-learning-signals.ts:77`, `use-food-opportunities.ts:109`. | The household acts and is told nothing — or is left looking at a state that silently failed to save. Violates EXP §14 ("If something could not be saved, saying so immediately and visibly is mandatory"). |
| `fnd-px-clear-history-unguarded` | Products | `products-page.tsx:1208` — "Clear All" calls `clearHistoryMutation.mutate()` **directly from `onClick`**. The mutation (`:588`) has **no `onError`**, no toast, and there is **no `AlertDialog`**. Single-item delete (`:579`/`:1275`) likewise. | One tap irreversibly wipes all product-analysis history: no confirmation, no undo, no confirmation it happened, no notice if it failed. Violates EXP §12 ("nothing irreversible happens as a side effect"). |
| `fnd-px-silent-optimistic-rollback` | Shopping extras, intelligence settings | `shopping-list-page.tsx:1671–1692` and `products-page.tsx:497–522` — optimistic `onMutate` write + `onError` rollback **with no toast in the `onError`**. | The household flips a switch, it moves, then silently snaps back. Reads as a broken control rather than a failure. |
| `fnd-px-forms-unlabelled` | Onboarding, meal create, profile, diary, pantry, planner, shopping | **276 of 326 form controls have neither an `id` nor an `aria-label`.** Only 40 `htmlFor` in all non-`ui` code. **Zero** `aria-invalid`/`aria-describedby` on any hand-rolled field. `ui/form.tsx` — which wires all three correctly (`:99`, `:116`, `:121`) — is imported by **2 files**. Hand-rolled forms use a `<p>` styled as a label (`create-meal-modal.tsx:213–221`). | A screen-reader user cannot reliably complete onboarding, create a meal, or edit their profile. Errors are never announced. Violates UIA §13 ("announced identically to assistive technology"). |
| `fnd-px-icon-buttons-unnamed` | All household surfaces | **147 icon-only buttons with no accessible name** (136 with not even a tooltip), of 1,065 scanned. `shopping-list-page.tsx` ×21, `meals-page.tsx` ×17, `profile-page.tsx` ×11, `food-diary-page.tsx` ×10, `meal-detail-page.tsx` ×9. Each carries a `data-testid` — a name for the test runner, none for the person. | Every destructive and primary row action — delete, edit, analyse, add-to-list — announces as "button". UIA §15 promises this "**without exception**"; there are 147 exceptions. |
| `fnd-px-keyboard-unreachable` | Shopping, meal create, templates, products | **10 real actions invocable only by mouse/touch** — `<div>`/`<span>` with `onClick`, no `role`, no `tabIndex`, no key handler: `shopping-list-page.tsx:3223,3303,3322,3324`, `create-meal-modal.tsx:350,378`, `templates-panel.tsx:413,521`, `products-page.tsx:1222`, `upf-info-modal.tsx:17` (*"What is UPF?"* — the product's own explanation of its core concept). `SmartReviewPanelContent.tsx:184` has `role="button"` + `tabIndex` but **no `onKeyDown`**: it announces as a button, takes focus, does nothing. | Renaming a list item, comparing prices, and picking a recipe are mouse-only. Violates EXP §16 ("whatever can be tapped can be reached by keyboard"). |
| `fnd-px-companion-not-a-dialog` | Companion (Apple) | `FloatingAssistant.tsx:1496–1511` is a hand-rolled `fixed` panel + backdrop, **not Radix**. No `role="dialog"`, no `aria-modal`, **no focus trap, no focus return**, no `aria-live` on streamed replies. Textarea (`:1160`) has a placeholder only. No scroll-lock anywhere in the repo (0 hits for `RemoveScroll`/`preventScroll`). | The flagship conversational surface is **silent and inescapable by keyboard**: focus falls through to the page behind, and Apple's answers are never announced. |
| `fnd-px-no-route-splitting` | Whole app | `App.tsx:19–53` — **34 eager page imports, zero `React.lazy`, zero dynamic `import()`**. 12 are admin pages. Result (measured): a **single 3,829,460-byte JS chunk**. | Every household downloads the entire admin world — Observation Workbench, Behaviour Workbench, Development World — to see tonight's dinner. |
| `fnd-px-no-compression` | Whole app | `server/static.ts:14` is a bare `express.static`; the `compression` package is **not installed** (verified absent from `node_modules`). Measured: the JS ships **3.83 MB uncompressed**, vs **965,407 bytes** gzipped. | Multiplies every payload finding by 3–10× on the wire. One line of middleware. |
| `fnd-px-home-fetches-whole-cookbook` | Home | `home-experience-page.tsx:102` fetches `/api/meals`, which returns full rows **including `ingredients` and `instructions`** (`routes.ts:845`, `storage.ts:436`). Home uses it only to read `name` + `imageUrl` for ≤3 planner entries (`:133`). Measured: **1,068,609 bytes** for 884 meals; id/name/imageUrl alone would be 68,527. **A slim contract already exists** — `/api/meals/summary` (`routes.ts:855`), measured at 217 KB, used by exactly one surface. | **1.02 MB downloaded to render three meal names** — a 15.6× waste, on the first screen after login. |
| `fnd-px-meals-invalidation-storm` | Cookbook, Planner | **31 call sites** invalidate/refetch `["/api/meals"]` (`use-meals.ts:27`, `weekly-planner-page.tsx:801,1529,2822,3689,4153`, …). | Adding a recipe or dropping a meal into the week **re-downloads the full 1.02 MB library, uncompressed.** The household watches a spinner after every mutation. |
| `fnd-px-cookbook-search-refetch` | Cookbook | `meals-page.tsx:3297–3307` — `useQuery({ queryKey: ["/api/nutrition/bulk", allMealIds] })` where `allMealIds` derives from `searchTerm`. **The key changes on every keystroke → new cache entry → new POST.** No debounce (though the *web* search path at `:2963` is correctly debounced). | Typing "chicken" fires a network POST per keystroke. |
| `fnd-px-cookbook-search-jank` | Cookbook | `meals-page.tsx:3235` — per keystroke, for **884+ meals**, `[meal.name, ...meal.ingredients].join(' ').toLowerCase()` allocates a multi-hundred-char string **per meal**, then fuzzy-scores it. `searchTerm` is state on the **6,884-line page component** (`:2473`), so the whole tree re-renders. | The cookbook search box janks on the household's own library. |
| `fnd-px-persistence-model-split` | Profile vs everywhere | Profile is the **only** surface with a dirty→Save model, and it carries **four independent dirty flags with four separate "Save" buttons** (`profile-page.tsx:579/636`, `1209/1237`, `1330/1385`, `1505/1537`). There is **no `beforeunload` and no route guard** (0 hits). Everywhere else commits on interaction. | Having learned everywhere else that THA saves as you go, the household edits two Profile sections, presses one Save, navigates away — and **silently loses the other**. |

### P2 — Drift a household can feel

| id | Surface | Evidence | Household impact |
|---|---|---|---|
| `fnd-px-no-meal-card-owner` | Cookbook, Home, Planner, Dashboard, Companion | **16 render sites** for "a meal"; only one is a real component (`PlannerMealCard.tsx:112`, 1 importer). Thumbnails at **7 distinct sizes** (`h-4`→`h-44`), 3 corner radii, 3 fallback icons. | The same lasagne is a different object on every screen. The household cannot form a stable mental image of the product's core noun. |
| `fnd-px-panel-shell-half-adopted` | Intelligence surfaces | `IntelligenceCard` (16 importers) is adopted by 5 panels; **9 panels (5,712 LOC) hand-roll their own** header/loading/empty/expand — `PlannerAssistantPanel.tsx` (1,952 LOC, 13 expand refs, 7 `Loader2`), `SmartReviewPanelContent.tsx`, `MealUpliftPanel.tsx`, `templates-panel.tsx`, … | Intelligence in the Pantry looks calm and governed; the same intelligence in the Planner looks like a different app. |
| `fnd-px-food-row-no-owner` | Pantry, Basket, Shopping | ≥9 implementations of "a food item with a quantity"; `pantry-page.tsx` has **two rivals in one file** (`:542`, `:921`). `formatQty` is **private** to `shopping-list-page.tsx:113` while `shopping-workspace-page.tsx:433` does its own unit logic. | **The same basket item shows a different quantity string in the Shopping List than in the Shopping Workspace.** Correctness-adjacent, not merely cosmetic. |
| `fnd-px-nine-card-surfaces` | App-wide | Nine independently-authored card surfaces with different radius/border-alpha/blur: `ui/card.tsx:12`, `intelligence-tokens.ts:16`, `HomeIntelligenceCompanion.tsx:108`, `PlantDiversityReport.tsx:484…`, `plant-diversity-page.tsx:136`, `FloatingAssistant.tsx:314`, `ShoppingListView.tsx:2127` (a **verbatim copy of Card's own class string** on a bare div), `shopping-workspace-page.tsx:2496`, `MealPreviewBubble.tsx:191`. Only **8 of 88** non-`ui` components import `ui/card`. | Card corners, border weight and translucency change as the household moves between — and *within* — pages. THA looks like several apps stitched together. |
| `fnd-px-loading-vocabulary` | App-wide | Four incompatible loading vocabularies: `Skeleton` (**2** household pages), hand-rolled `bg-muted animate-pulse` that **re-implements Skeleton verbatim** (4 files), full-page `Loader2` spinners (8 pages), and **nothing at all** (3 pages). `Loader2` appears in **52 files**. | Waiting feels broken rather than calm. `weekly-planner-page.tsx:1725` replaces the *entire page* — header and week tabs included — with a spinner in a `h-[60vh]` void: maximal layout shift on the heaviest surface. |
| `fnd-px-row-tap-means-four-things` | Cookbook, Pantry, Planner, Basket | Tapping a list row does four different things. Cookbook (`meals-page.tsx:3612`): *expands an inline preview* — navigating to the meal's canonical page is buried in a dropdown. Pantry (`:545`): *selects for bulk action*. Planner mobile (`weekly-planner-page.tsx:2119`): *opens a detail sheet*. Basket (`ShoppingListView.tsx:1620`): **nothing** — the row root has no `onClick`. | The household cannot predict what tapping an item will do. Four lists, four contracts, no cue distinguishing them. Violates Experience Principle 6 (the canonical page is not where the row leads). |
| `fnd-px-button-primitive-minority` | Whole product | **535 raw `<button>` vs 532 `<Button>`** — roughly half of all controls bypass the design system, each reinventing press feedback (`hover:bg-muted/40`, `active:opacity-75`, `hover:bg-primary/10`, …). Worst: `ShoppingListView.tsx` (46), `shopping-workspace-page.tsx` (44), `PlannerAssistantPanel.tsx` (43), `weekly-planner-page.tsx` (40). | A control does not feel the same when pressed from one realm to the next. (Moot today — see `fnd-px-dead-elevation` — but it is why that finding is unfixable at a single point.) |
| `fnd-px-primary-action-unenforceable` | Whole product | Variant census: `outline` 314, `ghost` 181, `secondary` 60, `destructive` 16, **explicit `default` 4, implicit default 124.** "Primary" is almost never *declared* — it is primary because someone omitted the prop. Co-visible primaries: **profile 8** (four buttons identically labelled "Save"), diary 4, basket 3, dashboard 3, pantry 2, products 2. | EXP §7 ("exactly one obvious next thing to do") **cannot be enforced because the code never states the answer.** Profile is one scrolling surface with eleven cards and four "Save"s. |
| `fnd-px-breakpoint-six-truths` | Cookbook vs Planner vs everything | UIA §9: *"One breakpoint truth… two surfaces disagreeing about whether the same screen is small is a **governance failure**."* There are **six**: `use-adaptive-density.tsx:36` (640) · `use-mobile.tsx:12` (768) · **five copy-pasted local `useIsMobile`** (`PlannerMealPickerPanel:16`, `day-view-drawer:16`, `PlannerAssistantPanel:116`, `SmartReviewPanelContent:55` at 768; **`CookbookWorkspacePanel:40` at 1024**) · plus non-reactive raw `window.innerWidth` reads (`PlannerAssistantPanel:442`, `PlannerContext:91`). **`use-mobile.tsx` — the canonical hook — has exactly one consumer: `ui/sidebar.tsx`, which is dead.** | On a 900px kitchen tablet, the **Cookbook thinks it is mobile while the Planner thinks it is desktop** — same device, same session. Rotation does not update two of them. |
| `fnd-px-overlay-container-arbitrary` | Whole product | Four overlay containers chosen per-*file*, not per-*interaction*: `Dialog` (30 files), `Drawer` (11), `Sheet` (3), plus a **hand-rolled fifth** (`FloatingAssistant.tsx:1490`). The same interaction — "review a change before committing" — is a Dialog in `PlannerScanReview`, a **Sheet** in `AdaptationReviewSheet.tsx:260`, and a **Drawer** in `WorkspaceAnalyserSheet.tsx:527`. Names lie: `WorkspaceAnalyserSheet` is a Drawer; `day-view-drawer` is a Dialog half the time. | The same decision arrives from the bottom, the side, or the middle depending on which realm asked — and the dismissal gesture changes with it. |
| `fnd-px-dialog-foundation-is-noop` | All dialogs | Distinct from PDA1's `fnd-dialog-foundation-unadopted` (which found it *unadopted*): `getDialogPresentationClass` (`ui/dialog-foundation.ts:122–133`) returns **`""` for all three presentations** — modal, drawer **and sheet**. The file's own comment concedes `DIALOG_PRESETS` are "NOT used by any existing dialogs". The mobile sheet presentation is **fully specified in prose and entirely unimplemented in code.** | The canonical dialog foundation is not merely ignored — adopting it today would change nothing. |
| `fnd-px-touch-floor-absent` | Design system | **238 buttons below a 44px target**: 61×`h-6` (24px), 96×`h-7` (28px), 46×`h-8` (32px), 10×`h-5`, 8×`h-4`. `ui/button.tsx:32` `size="icon"` is itself **36px** — the system's *ceiling* is below the platform minimum — and `twMerge` lets callers override it *downward* (`meal-detail-page.tsx:709` servings steppers are **16px**). `ui/dialog.tsx:53` — the close button on all 69 dialogs — has no size class at all: the target is the **16×16px** X. | In the supermarket, one-handed: a **16px tick sits 8px from a 28px delete** (`shopping-list-page.tsx:3331`/`:3341`). Mis-taps destroy list items. |
| `fnd-px-no-reduced-motion` | Global | **Zero `prefers-reduced-motion` in `index.css` and `tailwind.config.ts`.** `index.css:390–423` defines `appleBounce`, `glowPulse` and `appleShake` and applies them unconditionally; `BadAppleWarningModal.tsx:30` fires shake + bounce on a **warning modal**. A helper exists — `lib/companion-delight.ts:63` `prefersReducedMotion()`, whose own doc-comment claims the module "respects prefers-reduced-motion" — with **0 consumers**. 11 files run ungated `framer-motion`. | UIA §11 calls reduced motion "**a guarantee, not an enhancement**" and bans pulsing-for-attention outright. The design system's own stylesheet breaks both. |
| `fnd-px-no-viewport-fit` | Whole app | `client/index.html:5` — `content="width=device-width, initial-scale=1.0, maximum-scale=1"`. **No `viewport-fit=cover`**, so `env(safe-area-inset-*)` returns its 0px fallback on iOS, making **all 12 safe-area call sites inert** — including the bottom nav's own (`nav-bar.tsx:728`) and `.main-safe` (`index.css:386`). `maximum-scale=1` additionally blocks pinch-zoom (WCAG 1.4.4). | Nav labels sit in the home-indicator strip on notched iPhones. **The safe-area code is all written correctly and one missing attribute disables every bit of it.** |
| `fnd-px-plant-columns-unreachable` | Nutrition | `PlantDiversityReport.tsx:788` is a raw `<table>` (not the scroll-wrapped `ui/Table`), rendered inside `overflow-hidden` (`:846`). Five of six columns are `hidden md:table-cell`. | At 375px only the ingredient *name* survives. Category, Supports, Key Nutrients, Days and Meals are `display:none` **with no scroller to recover them** — the entire "why this plant matters" payload is invisible on a phone. |
| `fnd-px-cardtitle-not-heading` | All surfaces | `ui/card.tsx:36` renders `CardTitle` as a **`<div>`**; 86 usages. Household pages get one `<h1>` from `WorkspaceHeader` and then almost nothing: `food-diary-page.tsx` has **zero** headings of any level in its body; `shopping-list-page.tsx` zero `h2`; `profile-page.tsx` jumps `h2`→`h3`×11. Admin pages, by contrast, have proper `<h1>`s. | Screen-reader heading navigation — the primary way blind users skim — yields **one entry** on the densest household surfaces. The people THA exists to serve are on the less accessible half of the product. |
| `fnd-px-cardtitle-default-dead` | App-wide | `CardTitle` defaults to `text-2xl font-semibold` (`ui/card.tsx:39`); **85 of 86 usages override it**, unsystematically. Meanwhile `index.css:339–355` defines a real THA type scale (`.title-page`/`.title-section`/`.title-card`) used in **exactly one file** (`dashboard.tsx`). Section headings elsewhere are **20+ distinct hand-rolled `<h2 className>` strings**. | Card and section titles are a different size and weight on nearly every surface. There is no hierarchy the household can learn. |
| `fnd-px-page-shell-hand-rolled` | All 14 household pages | **No page-container component exists.** The string `max-w-screen-2xl 3xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8` is **copy-pasted 17 times**; top padding then diverges seven ways (`py-8 sm:py-12` on Home → **none at all** on Cookbook). Every page passes `wide` to `WorkspaceHeader` **except** `weekly-planner-page.tsx:1736` and `home-experience-page.tsx:178` — so Home's content column **is not aligned with its own banner**. | The gap between banner and first card changes on every page (0→48px); the whole page snaps ~256px narrower going Cookbook → Planner. Page-to-page navigation visibly jolts. |
| `fnd-px-back-three-mechanisms` | Profile, Meal detail, Admin, Pantry hub | "Back" has three incompatible implementations. **`profile-page.tsx:240–248` does `window.location.href = prev` — a full page reload**, discarding the TanStack cache and all in-flight state — falling back to `window.history.back()`. Others: `navigate("/cookbook")` (`meal-detail-page.tsx:494`), `<Link href>` (admin), local-state setters (`PantryKnowledgeHub.tsx:432`, `CookbookWorkspacePanel.tsx:377`). **Pantry, Diary, Nutrition and Quick-meal have no back affordance at all.** (PDA1's `fnd-food-detail-back` is the food page's instance; this is the pattern.) | Back sometimes returns you, sometimes teleports you to a fixed page, sometimes **reloads the whole app**, and sometimes isn't there. EXP §8 mandates "hierarchy over history"; the one history-based back is also the one that reloads. |
| `fnd-px-technical-errors-to-household` | Profile, planner, templates | `queryClient.ts:15` throws `` new Error(`${res.status}: ${text}`) `` with the **raw response body**, and that string is piped verbatim into household toasts. `profile-page.tsx:213–224` explicitly constructs and toasts it. Also `use-planner-operations.ts:239,346`, `templates-panel.tsx:276,308`, `weekly-planner-page.tsx:531,911,985`. | A household saving a profile sees **"Couldn't save changes / 500: Internal Server Error."** EXP §14 asks for plain words, what it means for their data, and one way forward — none of the three. |
| `fnd-px-success-silent-error-loud` | Pantry, Diary | Systematic asymmetry: success is silent, failure is a red toast (`pantry-page.tsx:273–304`, `:693–724`; `food-diary-page.tsx:1391`). Worse, `pantry-page.tsx:283`/`:703` raise **"Already in pantry"** with `variant: "destructive"` — a **satisfied state presented as an error**. | The household only ever hears from THA when something breaks. Adding to the pantry — a core action — is never acknowledged. EXP §14: "Alarm is reserved for genuine data loss or safety." |
| `fnd-px-sound-moralises-food` | Analyser | `use-sound-effects.ts:53–69` — a THA rating of 5 plays a rising major third; **a rating ≤2 plays a 300 ms 220 Hz buzz.** Fired on scan at `products-page.tsx:711,737`. | **THA audibly judges the household's food.** EXP §13: "Encouraging, never judgmental — no 'good/bad food'." |
| `fnd-px-companion-card-drift` | Companion | `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` mandates "**one card system across every domain**". The *firewall* rules are honoured exactly in code (`companion-card.ts:186–263` — in-app paths only, markdown/URL sanitised, no fabricated facts). But the **render** re-implements the card: `FloatingAssistant.tsx:309–394` declares a private `CompanionCard` with its own surface, composing neither `ui/card` nor `IntelligenceCard`, and re-introducing the `shadow-sm` that `ui/card.tsx:12` deliberately sets to `shadow-none`. | A meal in the assistant looks like a **different kind of thing** from the same meal in the Cookbook — undermining the card's whole job of being a companion to the canonical page. |
| `fnd-px-meal-detail-dead-spacing` | Meal detail | `` className={`space-y-${gapClass}`} `` where `gapClass` is `"gap-2"` → emits the **non-existent class `space-y-gap-2`**. Seven sites across four files: `MealTrustSummary.tsx:82,83`, `MealFamilyConfidence.tsx:129,134`, `HouseholdAdaptationsSummary.tsx:59`, `SimplyBetterChoicesPanel.tsx:71,77`. The density→class ladder is copy-pasted verbatim into all four — which is *how* the bug replicated. | On the flagship meal surface, trust reasons and family-confidence rows butt together with **zero** vertical rhythm. Reads as cramped and unfinished. |
| `fnd-px-toast-limit-one` | Toast infra | `use-toast.ts:8` `TOAST_LIMIT = 1`; `:79` `[action.toast, ...state.toasts].slice(0, 1)` — a new toast **destroys** the previous. `ToastActionElement` is typed (`:4,15`) and **never used**: there is no undo anywhere in THA. Success toasts also have **no close button** (`toaster.tsx:37` gates `ToastClose` on `isError`). | In batched actions a failure can be **overwritten by a subsequent success**. The last toast wins, not the most important one. No destructive action in THA is recoverable. |

### P3 — Hygiene and retirement debt

| id | Concern | Evidence | Impact |
|---|---|---|---|
| `fnd-px-dead-components` | Retirement | **6 components, 1,116 LOC, 0 importers** (verified by grep across `client/`, `server/`, `shared/`): `PageHeader.tsx` (323 — a full successor to `WorkspaceHeader`, declaring a **duplicate `export type PageRealm`**), `scan-confirm-dialog.tsx` (416), `HealthTrendChart.tsx` (156), `NutritionBoostPanel.tsx` (106 — referenced only in a *comment*), `benchmark-impersonation-banner.tsx` (59), `RankModeSelector.tsx` (56). | UIA §17: *"an unadopted foundation plus an unretired predecessor is the exact failure state this document exists to end."* `PageHeader.tsx` is that, verbatim. Each is a live-looking option a future workstream will adopt **instead of** the real owner. |
| `fnd-px-dead-ui-primitives` | Retirement | **20 `ui/` primitives, 2,823 LOC, 0 importers** — `sidebar` (727, the largest dead file in the client), `chart` (365), `carousel` (260), `menubar` (256), `context-menu` (198), `command` (151), `navigation-menu`, `pagination`, `breadcrumb`, `input-otp`, `calendar`, `toggle-group`, `alert`, `accordion`, `scroll-area`, `resizable`, `radio-group`, `hover-card`, `slider`, `aspect-ratio`. Note `ui/chart` **and** `HealthTrendChart` are both dead — there is no charting owner when one is next needed. | **3,939 LOC of dead code across 26 files.** |
| `fnd-px-score-badge-alias` | Rating mark | `ui/score-badge.tsx` is an **11-line pass-through** that renders `<AppleRating rating={score}/>` and nothing else — renaming `score`→`rating`. 7 importers, 22 call sites. With PDA1's `fnd-two-apples`, the mark is reachable under **three** names. | Invisible today (it delegates faithfully) — but it is the third entry point that guarantees the next divergence, and it is *where the accessibility gap hides*. |
| `fnd-px-double-bottom-padding` | 6 pages | `.main-safe` is already on `<main>` (`App.tsx:149`); six pages apply it **again** on their own root (`profile-page.tsx:334`, `meal-detail-page.tsx:620`, `quick-meal-page.tsx:384`, `supermarkets-page.tsx:97`, `partners-page.tsx:478`), and `shopping-workspace-page.tsx:2269` adds `pb-20` on top. | 160px of dead space at the bottom of some scrolls and none on others. |
| `fnd-px-undefined-utilities` | 13 surfaces | `no-scrollbar` is used 13× and **defined nowhere** (not in `index.css`, not in `tailwind.config.ts`, whose only plugins are `tailwindcss-animate` and `@tailwindcss/typography`). | Dead class. The scrollbars the designer meant to hide are visible. Same root cause as `fnd-px-dead-elevation`. |
| `fnd-px-ad-hoc-semantic-tints` | Shopping, Pantry, Dashboard | Semantic states use raw palette colours instead of tokens: `shopping-list-page.tsx:1058` (`border-blue-200 … bg-blue-50/40`), `PantryKnowledgeHub.tsx:268,305,578`. **`dashboard.tsx:478,538` hard-codes `style={{ borderColor: "hsl(132,14%,87%)" }}`** — a light-mode-only literal. Meanwhile `intelligence-tokens.ts:75–94` already defines a governed, dark-mode-verified semantic palette. | "Good"/"warning" tints mean different things on different pages; the dashboard's inline border **does not invert in dark mode**. |
| `fnd-px-images-not-lazy` | Cookbook | `MealImageWidget.tsx:332` `<img>` has **no `loading="lazy"`, no `width`/`height`, no `srcset`** — while the *web-results* grid in the same file (`meals-page.tsx:3653`) correctly has all three. 48 cards render at once (`:2508`). No server-side resizing exists (`sharp` not installed); upload limit is **15 MB** (`routes.ts:1181`). | 48 full-resolution photos load eagerly into small tiles, with layout shift. A household's 8 MB phone photo is downloaded at 8 MB into a thumbnail. |
| `fnd-px-oversized-assets` | Whole app | Measured: `orchard-bg.png` **2,023,987 B** (`App.tsx:140`, every protected page), `tha-apple.png` **1,449,727 B** (rendered at **38×38 px** in `workspace-header.tsx:81`), `favicon.png` **295,207 B**. Plus a render-blocking Google Fonts request for **~25 families**. | **3.77 MB of the ~8.8 MB first-load budget is pure decoration**, and none of it compresses. |
| `fnd-px-toast-over-nav` | All pages | `ui/toast.tsx:17` — `fixed bottom-6 … z-[100]`, above the nav's `z-50`. | Toasts obscure navigation while visible. |
| `fnd-px-debug-logs-shipped` | Meal Boost | `MealUpliftPanel.tsx:195,227` — `console.log("[BOOST-PROOF] STEP1 request:", …)` ships to production. | Hygiene — and it is the *only* observability this flow has, standing in for the user-facing error surface it lacks. |

---

## 6. The Adoption Register — *the deliverable UIA §17 mandates and nobody built*

> **UIA §17:** *"**The adoption register.** Every canonical building block carries a visible register: what it owns, which surfaces have adopted it, which are exempt and why. **Authored-but-unadopted must be impossible to hide.** The register lives beside the implementation (it is operational, not architectural); its **existence** is mandated here."*

It does not exist. This is the register, for the fourteen concerns UIA §17 names by name. **Every finding in §5 is a row in this table** — which is the point: the register is not a summary of the audit, it is the instrument that would have made the audit unnecessary.

Legend — **Adopted:** importer/usage count. **Verdict:** ✅ governed · ⚠️ half-adopted · ❌ no owner · ☠️ owner exists but is **inert**.

| # | Concern (UIA §17) | Canonical owner | Adopted | Rivals / predecessors still live | Verdict |
|---|---|---|---|---|---|
| 1 | **Header** | `components/workspace-header.tsx` | **18** | `PageHeader.tsx` (**0 importers**, duplicate `PageRealm` type); hand-rolled `<h1>` in `food-detail-page`, `import-recipe-page` | ⚠️ |
| 2 | **Navigation** | `components/nav-bar.tsx` (`NAV_ITEMS`) | all pages | none — *and it is the only surface meeting the 44px floor by construction* | ✅ |
| 3 | **Card** | `components/ui/card.tsx` | **8 of 88** non-`ui` components | **9 rival surfaces** (`fnd-px-nine-card-surfaces`), incl. a verbatim copy of Card's own class string on a bare div | ⚠️ |
| 4 | **Dialog** | `ui/dialog.tsx` + `ui/dialog-foundation.ts` | 2 of 89 modal surfaces (PDA1) | `Drawer` (11), `Sheet` (3), 2 hand-rolled fixed panels. **The foundation is a no-op** — `getDialogPresentationClass` returns `""` for all three presentations | ☠️ |
| 5 | **Form field** | `components/ui/form.tsx` *(correct: `htmlFor`, `aria-describedby`, `aria-invalid`)* | **2 files** | ~20 hand-rolled `useState` forms; **276 of 326 controls unlabelled** | ⚠️ |
| 6 | **Empty state** | — | — | ≥20 hand-rolled treatments; sole `EmptyState` is **private** to `PantryKnowledgeHub.tsx:958` *and doubles as a loading state* | ❌ |
| 7 | **Loading state** | `components/ui/skeleton.tsx` | **7** | `Loader2` in **52 files**; `animate-pulse` in 12 (4 re-implement Skeleton verbatim); 3 pages have no loading branch at all | ⚠️ |
| 8 | **Error boundary** | — | — | **None exists anywhere in `client/src`** (0 files). `retry: false`, no `QueryCache` handler. 14 of 16 household pages have no error branch | ❌ |
| 9 | **Status presentation** (panel shell) | `intelligence/IntelligenceCard.tsx` | **16** | **9 rival panels, 5,712 LOC**, each hand-rolling header/loading/empty/expand | ⚠️ |
| 10 | **Rating mark** | `components/ui/apple-rating.tsx` | via `ScoreBadge` (7 files, 22 sites) | `components/AppleRating.tsx` (PDA1 `fnd-two-apples`) + `ui/score-badge.tsx` (11-line alias) + `MiniAppleRating` (`KitchenToBasketVisual.tsx:5`) = **three names, one mark**. **The canonical one is the inaccessible one.** | ⚠️ |
| 11 | **Brand mark** | `FiveApplesLogo` / `tha-apple.png` | consistent | none — *but the asset is 1.45 MB for a 38px render* | ✅ |
| 12 | **Icon set** | `lucide-react` | consistent | none | ✅ |
| 13 | **Motion vocabulary** | `index.css` keyframes + `framer-motion` | 11 files, ungated | **`prefersReducedMotion()` has 0 consumers**; no `prefers-reduced-motion` media query exists. UIA §11's "guarantee" is unimplemented | ☠️ |
| 14 | **Token definitions** | `index.css` + `tailwind.config.ts` | partial | **`hover-elevate` / `active-elevate-2` / `--primary-border` / `--button-outline` / `no-scrollbar` are consumed but never defined.** The THA type scale (`.title-*`) exists and is used in 1 file | ☠️ |

**Three concerns are inert (☠️): the interaction feedback of every control, the mobile
presentation of every dialog, and the reduced-motion guarantee.** Two have no owner at all
(❌): the two states a household spends the most time looking at — *empty* and *broken*. Only
four of fourteen are genuinely governed.

**Two further concerns are not in UIA §17's list and should be added**, because PX1 found them
to be rival-ridden and household-visible:

| # | Concern | Canonical owner | Adopted | Rivals | Verdict |
|---|---|---|---|---|---|
| 15 | **Meal presentation** (the product's core noun) | — *(seed: `PlannerMealCard.tsx:112`)* | 1 | **16 render sites, 7 thumbnail sizes** | ❌ |
| 16 | **Food item + quantity row** | — *(seed: `formatQty`, private to `shopping-list-page.tsx:113`)* | — | **≥9 implementations**; two rivals *inside* `pantry-page.tsx`; **the same item shows a different quantity in two shopping surfaces** | ❌ |
| 17 | **Breakpoint truth** (UIA §9 names it; §17 omits it) | `hooks/use-adaptive-density.tsx` | 1 | **6 competing definitions**; canonical `use-mobile.tsx`'s only consumer is the **dead** `ui/sidebar` | ❌ |

---

## 7. The ownership model

PX1 asserts no new ownership. It **maps** what the governing documents already own, and names
the one layer that had no owner.

| Layer | Owner (existing) | PX1's role |
|---|---|---|
| **Experience law** — what the experience must *do* | `THA_EXPERIENCE_ARCHITECTURE.md` §3 (EXP1), §17 Premium lens (EXP2) | Cites. Adds nothing. Measures compliance. |
| **Visual law** — how it must *look* | `THA_UI_ARCHITECTURE.md` (UIA2) | Cites. Adds nothing. Measures compliance. |
| **Companion surface law** | `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` | Cites. Records that the *firewall* is honoured and only the *render* drifts (`fnd-px-companion-card-drift`). |
| **Domain & surface ownership** — what THA *is* | Product Knowledge Registry, [`OWNERS.md`](../../product/OWNERS.md) (154 entries) | Cites. Does not duplicate. Findings are `fnd-px-*` ids the registry may reference. |
| **Reachability, naming, claims, safety** | PDA1 (complete) | Extends. Does not re-derive. |
| **Component adoption & retirement** | **— none —** | **PX1 creates it: the Adoption Register (§6).** |

**Navigation ownership** is settled and healthy: `nav-bar.tsx`'s `NAV_ITEMS` is the single
ordered list feeding every nav surface, and no page grows a competing navigation (EXP §8
honoured). The two navigation defects PX1 found are not ownership failures — they are a
z-index collision (`fnd-px-fab-covers-nav`) and an absent back-slot on the header
(`fnd-px-back-three-mechanisms`), which is *why* five back mechanisms grew.

**Experience ownership** is settled: one Home, one Companion, one nav, one realm system. The
failures are all at the **component** layer, which is exactly the layer with no register.

---

## 8. Well-governed — what must be preserved

An audit that reports only faults will be used to justify a rewrite. The opposite is
warranted: **THA's foundations are good and should be extended, not replaced.**

- **`AmbientIntelligence`** — the **one correctly executed retire-on-introduction in the
  codebase**. `intelligence/index.ts:41–44` names its predecessor, states that it was *deleted
  in the same change*, and cites UI Principle 5. Adopted by 6 pages. **This is the worked
  example UIA §17 asks for; every convergence below should be executed exactly this way.**
- **`WorkspaceHeader`** (18 importers) — the most successfully governed visual concern. Owns
  realm typing, the slot context, and mounts the nav internally so no page reaches for
  navigation directly.
- **`IntelligenceCard`** (16) + `intelligence-tokens.ts` — the best card contract in the
  repository, with a real token module and progressive disclosure. Its header comment
  ("Presentation only. It owns no intelligence and fetches nothing") is exemplary. **Zero drift
  inside `components/intelligence/`.** Do not redesign it — extend it to the 9 rivals.
- **The bottom nav** — `min-w-[44px] min-h-[44px]` per item: the only surface meeting the touch
  floor by construction. One ordered `NAV_ITEMS` list. Correct `aria-label`, `aria-current`,
  and a real `<nav>` landmark. **Navigation proves the team knows exactly how to do this** —
  the standard simply was never carried beyond it.
- **`.main-safe`** — one class, one owner, applied once on `<main>`, giving every routed page
  bottom-nav clearance for free. Exactly the convergence the rest of this audit asks for.
- **The weekly planner's mobile split** (`weekly-planner-page.tsx:2276`) — the 900px matrix is
  `hidden sm:block`; a dedicated single-day card renders below it. The hardest layout in the
  product is the best-handled.
- **Home's Notice and Household-Score sections** (`home-experience-page.tsx:171,344`) — render
  **nothing** rather than a placeholder, with code comments explaining why ("Silence is a
  first-class outcome, never padded"; "a null score is SILENCE"). EXP §12 honoured precisely.
  The same file's planner and shopping sections violate it — Home contains both the best and
  the worst instincts in the codebase.
- **Shopping Workspace mutations** (`shopping-workspace-page.tsx:1488–1710`) and
  **`use-planner-operations.ts:80–300`** — snapshot → optimistic write → `onError` rollback →
  toast that *tells the household the rollback happened* → `onSettled` invalidate. **This is
  the canonical feedback pattern; it exists, it works, and it is copy-pasted rather than
  owned.**
- **Radix** — Dialog/Sheet/AlertDialog/Drawer in 41 files bring focus trap, focus return,
  `aria-modal` and Escape **for free**; Radix Toast genuinely announces via `role="status"`.
  Every hand-rolled modal is a defect *precisely because* it bypasses what is already there.
- **The Companion's firewall** (`conversation/companion-card.ts:186–263`) — in-app paths only,
  markdown and URLs sanitised, no fabricated facts. The governing principle is enforced *in
  code*, not merely asserted.
- **`ui/form.tsx`, `ui/skeleton.tsx`, `/api/meals/summary`, `prefersReducedMotion()`,
  `loading="lazy"`, the `h-11` aisle buttons, `camera-modal`'s mobile sheet, the THA type
  scale** — every one of these is **correct, already written, and barely adopted.** The
  repository is not short of good answers; it is short of a mechanism that notices when a good
  answer is not being used.
- **`data-testid` discipline** — 102 of 123 non-primitive files, conventionally named. It is
  what made this audit possible at all.

---

## 9. Convergence opportunities

One canonical owner per concern. **Every owner below already exists** except where marked
*(new)* — and each *(new)* has a named seed to be promoted, not designed from scratch.

| Cluster | The ONE owner | Converges | Retires |
|---|---|---|---|
| **Interaction feedback** | `index.css` — define `hover-elevate`/`active-elevate-2` + the four missing `--*-border` tokens, **or** express hover in `ui/button.tsx` with real tokens | Every Button, Badge and clickable Card in THA | The un-ported scaffold dependency |
| **Empty / loading / error** | *(new)* `ui/empty-state.tsx` with a **`variant: "empty" \| "filtered" \| "unavailable"`** discriminator — seeded from `dashboard.tsx:307` (shape) and `pantry-page.tsx:486–501` (semantics, the only surface that already separates the three) + `ui/skeleton.tsx` (exists) + *(new)* `ui/load-error.tsx` seeded from the **admin** `LoadError` (`admin-behaviour-workbench-page.tsx:597`) | ≥20 hand-rolled empties, 52 `Loader2` files, 14 pages with no error branch | The `= []`-swallows-the-error idiom. **The `variant` discriminator makes it structurally impossible to render "you have nothing" when the truth is "we could not load this."** |
| **Feedback / mutation** | *(new)* `useTrackedMutation` — literal spec already exists at `shopping-workspace-page.tsx:1488–1505`; required `success`/`failure` copy; `err.message` **never** forwarded; destructive variants require a confirm **or** an undo | 35 mutations with no `onError`; 5 call sites that toast the wrong HTTP call | Feedback owned by the call site (which is *how* the basket lies) |
| **Meal presentation** | *(new)* `MealCard` with `variant` — promote `PlannerMealCard.tsx:112` | 16 render sites, 7 thumbnail sizes | — |
| **Food item + quantity** | *(new)* `FoodItemRow` + promote `formatQty` to `lib/` | ≥9 implementations | The two-rivals-in-one-file in `pantry-page.tsx` |
| **Panel shell** | `intelligence/IntelligenceCard.tsx` — should **compose** `ui/card`, not rival it | 9 panels, 5,712 LOC | `intelligenceSurface` as a separate surface |
| **Page shell** | `workspace-header.tsx` — export a `PageContainer` sibling reading the same `wide` flag | 17 copy-pasted container strings, 7 padding rules, the double `main-safe` | The `wide` mismatch on Planner and Home |
| **Back** | A `back` slot on `workspace-header.tsx` resolving the **hierarchy parent** (EXP §8) | 5 back mechanisms, incl. the full-page-reload | `PageHeader.tsx` entirely |
| **Overlay** | One `Overlay` that switches by viewport exactly as **`day-view-drawer.tsx:421/433/468` already does** — sheet on mobile, dialog on desktop; give `ui/dialog.tsx:41` a `max-h` + `overflow-y-auto`; make `getDialogPresentationClass("sheet")` return the **`camera-modal.tsx:149`** classes that already work | 69 dialogs, 11 drawers, 3 sheets, 2 hand-rolled panels | `Sheet` as a separate choice; the no-op foundation |
| **Breakpoint truth** | `use-adaptive-density.tsx`, with `tailwind.config.ts` `screens` naming the *same* numbers so JS and CSS cannot drift | 6 definitions, 5 copy-pasted hooks, 3 non-reactive `innerWidth` reads | `use-mobile.tsx` (dead) and the 1024px outlier |
| **Touch floor** | `ui/button.tsx` + `ui/checkbox.tsx` size variants at 44px; the pattern **already exists** at `nav-bar.tsx:705` and `ShoppingListView.tsx:752` | 238 sub-44px controls | Downward `className` overrides via `twMerge` |
| **The apple** | **`components/AppleRating.tsx`** — it is the one that already has `RATING_LABELS` and the text string. Add `role="img"` + `aria-label` on the container | `ui/apple-rating.tsx`, `ui/score-badge.tsx`, `MiniAppleRating` | **The accessibility fix and the UIA §10 "exactly one apple" brand fix are the same fix.** |
| **Payload** | `/api/meals/summary` (**exists**, `routes.ts:855`) as the default list contract | Home + `use-meals.ts` | Full-row `/api/meals` for list surfaces — defusing all 31 invalidation triggers at once |

---

## 10. Prioritised workstreams

Ordered by **household impact per unit of work**. Effort is a hint to be checked against the
code each finding cites, not an estimate. **Nothing here is scheduled** — that belongs to the
[Master Evolution Roadmap](../../architecture/THA_MASTER_EVOLUTION_ROADMAP.md), which this
feeds.

### PX1-W0 — Stop misinforming the household *(do first)*
The product currently tells households things that are not true. Three of these are one-file fixes.

| # | Do this | Resolves | Effort |
|---|---|---|---|
| 0.1 | Gate `home-experience-page` and `dashboard` on `isLoading`. | `fnd-px-false-empty-home`, `fnd-px-false-empty-dashboard` | **S** |
| 0.2 | Make `use-basket.ts`'s four mutations own their own feedback; stop call sites toasting a different HTTP call. | `fnd-px-basket-confirms-wrong-call` | **S** |
| 0.3 | Add `role="img"` + `aria-label` to the surviving apple. The string already exists at `AppleRating.tsx:85`. | `fnd-px-apple-score-inaudible` | **S** |
| 0.4 | Add an `ErrorBoundary` + an error branch that is **not** the empty state. | `fnd-px-error-renders-as-empty` | **M** |
| 0.5 | Confirm (or undo) `products-page` "Clear All". | `fnd-px-clear-history-unguarded` | **S** |
| 0.6 | Give the 35 `onError`-less mutations a failure path, via the `useTrackedMutation` owner (§9). Stop forwarding `${status}: ${rawBody}` into household toasts. Make an optimistic rollback *say* it rolled back. | `fnd-px-silent-mutations`, `fnd-px-silent-optimistic-rollback`, `fnd-px-technical-errors-to-household` | **M** |
| 0.7 | Guard Profile against silent loss — one save model, or a route/`beforeunload` guard for its four independent dirty flags. | `fnd-px-persistence-model-split` | **M** |

> **0.3 is the highest-leverage line in this document.** One `aria-label`, across 15+ call
> sites, makes THA's core question answerable by a blind household member for the first time —
> and it simultaneously satisfies UIA §10's "exactly one apple".

### PX1-W1 — Make the product respond
The design system is inert. These are token and attribute fixes, not redesigns.

| # | Do this | Resolves | Effort |
|---|---|---|---|
| 1.1 | Define `hover-elevate` / `active-elevate-2` and the four `--*-border` tokens in `index.css`. | `fnd-px-dead-elevation` | **S** |
| 1.2 | Add `viewport-fit=cover` to `client/index.html:5` — **one attribute activates twelve already-correct safe-area call sites.** Drop `maximum-scale=1`. | `fnd-px-no-viewport-fit` | **S** |
| 1.3 | Give `ui/dialog.tsx:41` a `max-h` + `overflow-y-auto`; make `getDialogPresentationClass("sheet")` return the classes `camera-modal.tsx:149` already proves. | `fnd-px-dialog-no-max-height`, `fnd-px-dialog-foundation-is-noop` | **S** |
| 1.4 | Add the `@media (prefers-reduced-motion: reduce)` block; wire the existing `prefersReducedMotion()`. Stop `appleShake`/`glowPulse` on a warning modal. | `fnd-px-no-reduced-motion` | **S** |
| 1.5 | Fix the `z-50` collision: FAB must not paint over the nav or the meal-detail Save. | `fnd-px-fab-covers-nav` | **S** |
| 1.6 | Fix `space-y-${gapClass}` (7 sites) and extract the density ladder to a token module. | `fnd-px-meal-detail-dead-spacing` | **S** |
| 1.7 | Define `no-scrollbar` (or delete its 13 uses) — same root cause as 1.1: a utility consumed and never defined. | `fnd-px-undefined-utilities` | **S** |
| 1.8 | Drop the toast viewport below the nav's `z-50`. | `fnd-px-toast-over-nav` | **S** |

### PX1-W2 — Make the phone work
THA is used in a kitchen and a supermarket.

| # | Do this | Resolves | Effort |
|---|---|---|---|
| 2.1 | Give Shop mode bottom-nav clearance — it escapes `.main-safe` via `fixed inset-0`. | `fnd-px-shop-mode-row-under-nav` | **S** |
| 2.2 | Make destructive row controls always visible on coarse pointers, and confirm them. | `fnd-px-invisible-destructive-controls` | **M** |
| 2.3 | Raise the touch floor to 44px in `ui/button.tsx`/`ui/checkbox.tsx` and stop downward overrides. | `fnd-px-touch-floor-absent` | **M** |
| 2.4 | Collapse the six breakpoint definitions to one. | `fnd-px-breakpoint-six-truths` | **M** |
| 2.5 | Give the plant-diversity table a scroller. | `fnd-px-plant-columns-unreachable` | **S** |

### PX1-W3 — Make it fast
Four structural changes, no per-component work.

| # | Do this | Resolves | Effort |
|---|---|---|---|
| 3.1 | `npm i compression` + `app.use(compression())`. **Measured: 3.83 MB → 965 KB.** | `fnd-px-no-compression` | **S** |
| 3.2 | One `React.lazy` boundary in `App.tsx`. Also removes `recharts` and `@zxing` from the household's first load, free. | `fnd-px-no-route-splitting` | **S** |
| 3.3 | Point Home and `use-meals.ts` at the **existing** `/api/meals/summary`. **Measured: 1,044 KB → 217 KB**, and it defuses all 31 invalidation triggers. | `fnd-px-home-fetches-whole-cookbook`, `fnd-px-meals-invalidation-storm` | **S** |
| 3.4 | Compress `orchard-bg.png` (2.02 MB), `tha-apple.png` (1.45 MB), `favicon.png`. Add `loading="lazy"` + dimensions to `MealImageWidget.tsx:332`. | `fnd-px-oversized-assets`, `fnd-px-images-not-lazy` | **S** |
| 3.5 | `useDeferredValue` on the cookbook `searchTerm`; precompute the lowercased meal text once (the `scoreCache` at `meals-page.tsx:3244` is the pattern to copy). | `fnd-px-cookbook-search-jank`, `fnd-px-cookbook-search-refetch` | **M** |

### PX1-W4 — Make it one product
The convergences of §9. Each must be executed as `AmbientIntelligence` was: **name the
predecessor, migrate every consumer, delete it in the same change** (UIA §17).

| # | Do this | Resolves | Effort |
|---|---|---|---|
| 4.1 | Adopt `ui/form.tsx`, or make `Input`/`Textarea` warn in dev when given neither `id` nor `aria-label`. **One primitive, 276 defects.** | `fnd-px-forms-unlabelled` | **L** |
| 4.2 | Name the 147 icon-only buttons; retire the hand-rolled modals into Radix (focus trap and `aria-live` arrive free). | `fnd-px-icon-buttons-unnamed`, `fnd-px-companion-not-a-dialog`, `fnd-px-keyboard-unreachable` | **L** |
| 4.3 | Promote `MealCard` and `FoodItemRow`. | `fnd-px-no-meal-card-owner`, `fnd-px-food-row-no-owner` | **L** |
| 4.4 | Migrate the 9 rival panels onto `IntelligenceCard`; make it compose `ui/card`. | `fnd-px-panel-shell-half-adopted`, `fnd-px-nine-card-surfaces` | **L** |
| 4.5 | Export a `PageContainer`; add a `back` slot to `WorkspaceHeader`. | `fnd-px-page-shell-hand-rolled`, `fnd-px-back-three-mechanisms` | **M** |
| 4.6 | Make `variant` **required** on `<Button>`, so a surface must *declare* its one primary action (EXP §7). | `fnd-px-primary-action-unenforceable`, `fnd-px-button-primitive-minority` | **M** |
| 4.7 | Delete the **3,939 LOC** of dead code (26 files). | `fnd-px-dead-components`, `fnd-px-dead-ui-primitives` | **S** |
| 4.8 | **Create the empty / loading / error owners** (§9) — the `variant`-discriminated `EmptyState`, `ui/skeleton` enforced over the 52 `Loader2` files, and `LoadError` lifted from the admin precedent. **UIA §17 names all three as concerns requiring an owner; none has one.** | `fnd-px-no-empty-state-owner`, `fnd-px-loading-vocabulary` | **L** |
| 4.9 | One row contract: whole-row tap goes to the entity's canonical page (Experience Principle 6); everything else is a visible, labelled secondary control. | `fnd-px-row-tap-means-four-things` | **M** |
| 4.10 | One `Overlay` switching by viewport, as `day-view-drawer.tsx` already does. Retire `Sheet` as a separate choice and the hand-rolled panels. | `fnd-px-overlay-container-arbitrary` | **M** |
| 4.11 | Wire the existing THA type scale (`.title-*`) into `CardTitle`; render it as a real heading, not a `<div>`. Collapses the 85 ad-hoc overrides and restores heading navigation. | `fnd-px-cardtitle-default-dead`, `fnd-px-cardtitle-not-heading` | **M** |
| 4.12 | Collapse the apple to one component (it is the same edit as 0.3) and delete the `ScoreBadge` alias. | `fnd-px-score-badge-alias` | **S** |
| 4.13 | Make the Companion's card compose `IntelligenceCard`, satisfying the Companion Card Principle's "one card system across every domain". Its *firewall* already complies — only the render drifts. | `fnd-px-companion-card-drift` | **M** |

### PX1-W4b — Tone and hygiene *(continuous, not a milestone)*

| # | Do this | Resolves | Effort |
|---|---|---|---|
| 4b.1 | **Stop the product moralising about food.** A THA rating ≤2 currently plays a low buzz on scan. EXP §13: "Encouraging, never judgmental — no 'good/bad food'." | `fnd-px-sound-moralises-food` | **S** |
| 4b.2 | Stop raising satisfied states ("Already in pantry") as red destructive alarms; acknowledge success on the pantry and diary rather than only ever speaking on failure. | `fnd-px-success-silent-error-loud` | **S** |
| 4b.3 | Raise `TOAST_LIMIT` above 1 (a failure can currently be destroyed by a following success) and use the already-typed `ToastActionElement` to give destructive actions an undo. | `fnd-px-toast-limit-one` | **M** |
| 4b.4 | Move the ad-hoc semantic tints onto the governed, dark-mode-verified `intelligence-tokens` palette; remove the hard-coded light-only `hsl()` border on the dashboard. | `fnd-px-ad-hoc-semantic-tints` | **S** |
| 4b.5 | Remove the doubled `main-safe` on six pages. | `fnd-px-double-bottom-padding` | **S** |
| 4b.6 | Remove the shipped `[BOOST-PROOF]` console logs — and give that flow the user-facing error surface they are standing in for. | `fnd-px-debug-logs-shipped` | **S** |

### PX1-W5 — Make this audit unrepeatable
> Without this, everything above regrows. It is the only workstream that changes the *system*
> rather than the code.

| # | Do this | Resolves | Effort |
|---|---|---|---|
| 5.1 | **Stand up the Adoption Register (§6)** beside the implementation, as UIA §17 mandates. | The mechanism behind every finding in this document | **M** |
| 5.2 | Add an **Adoption Register Impact** line to the Definition of Done, so a new building block cannot ship without a register entry and a named predecessor. | UIA §17 "Admission of the new" | **S** |
| 5.3 | Enforce the register mechanically — a check that fails when a component has 0 importers or a canonical owner's rival count rises. | UIA §17 "authored-but-unadopted must be impossible to hide" | **M** |

---

## 11. Carried forward from PDA1 — re-verified, not inherited on trust

PX1 re-read the code behind PDA1's open P0s rather than repeating them. **Both are closed.**

- **`fnd-unprotected-admin-endpoints` — CLOSED.** All three maintenance routes now carry the
  canonical `assertAdmin` guard (`routes.ts:10839`, `:10857`, `:10870`). The no-op
  `(req,res,next)=>next()` slot is gone; `routes.ts:10836` carries the TRUST1-S3 note recording
  the fix.
- **`fnd-public-template-writes` — CLOSED.** `POST /api/meal-templates` (`:5102`) and
  `POST /api/meal-templates/:id/products` (`:5159`) now check `req.isAuthenticated()`; `PATCH`
  (`:5117`), `DELETE` (`:5138`) and `DELETE /api/meal-template-products/:id` (`:5171`) carry
  `assertAdmin`.

The alarm PDA1 raised was real and has been answered by `TRUST1-S3`. **Recorded here so no
future audit re-raises it** (PKCA Rule KC12 — a resolved finding, recorded, is not rediscovered
forever).

**One Phase-0 item remains open, at its true severity:** `fnd-premium-unenforced` — the three
free-tier caps are still stubbed (`routes.ts:847` meals >3, `:3230` analyses, `:5889` planner
>2 days/week), while `hasPremiumAccess()` is real and enforced elsewhere (`:6956`, `:7047`).
This is a **commercial-promise** gap, not a household-safety gap, and PX1 declines to inflate
it into one.

---

## 12. What PX1 deliberately did not do

- **It changed no code.** No product source, no UI, no features. The working tree was left as
  found.
- **It authored no principles.** EXP §3 and UIA §3 already say everything a new principle would
  have said. PX1 measures compliance; it does not legislate.
- **It did not restart PDA1**, re-derive its 31 findings, or overrule the registry.
- **It did not build the Adoption Register** — §6 specifies it and PX1-W5.1 schedules it.
  Specifying and building are different acts, and conflating them is how the platform acquired
  the dormant foundations this document is about.
- **It invented nothing.** Where a claim could not be grounded in a `file:line`, it was dropped.
  Where the code contradicted an inherited assumption — PDA1's two P0s — the **code won**, and
  the correction is recorded above rather than quietly omitted.

---

_Implementation PX1. Discovery and architecture only. The law is the [Experience](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) and [UI](../../architecture/THA_UI_ARCHITECTURE.md) Architectures'; the surfaces are the [registry](../../product/)'s; the schedule is the [Master Evolution Roadmap](../../architecture/THA_MASTER_EVOLUTION_ROADMAP.md)'s. What PX1 adds is the register that makes all three checkable._
