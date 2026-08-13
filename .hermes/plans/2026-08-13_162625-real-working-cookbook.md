# Real Working Cookbook Implementation Plan

> **For Hermes:** Implement this plan in isolated, non-overlapping worktrees. Claude owns bounded visual composition work; ChatGPT/Codex owns integration, contracts, tests and independent verification. No agent may commit, push, open a PR or deploy without separate approval.

**Goal:** Turn the existing `/cookbook/concept-real-book` candidate into a genuine working Cookbook that preserves the current Cookbook’s real search, filtering, creation/import, reading, planner and Companion capabilities inside a premium photoreal physical book.

**Architecture:** Keep `Meal` and the existing meal APIs as the sole recipe truth; keep `AppShell`, `BottomNav`, `CompanionContextProvider` and `FloatingAssistant` as the sole shell/navigation/Companion owners. Use approved photoreal raster plates for the book, paper, shadows, table and environment, while rendering semantic text and controls through page-plane transforms, clipping and print-style blending so content behaves accessibly but looks physically printed. Desktop renders one complete spread; mobile renders one readable physical page at a time.

**Tech Stack:** React, TypeScript, Wouter, TanStack Query, existing Express/Drizzle meal and planner APIs, existing Companion pointer/ask/action framework, `@dnd-kit`, Canvas only where it is genuinely helpful for image compositing—not as the sole interaction/accessibility layer.

---

## 1. Verified starting point

**Local authoritative development environment**

- Worktree: `C:\Users\Colin\The Healthy Apples\GitHub\tha-living-larder-authoritative`
- Branch: `feat/living-larder-authoritative`
- Planning reference HEAD: `53c12f4661f64bd583df58ab05954f7ea6684270`
- The worktree contains unrelated uncommitted Living Larder work. It must not be reset, cleaned, stashed or edited directly during Cookbook implementation.

**Existing real-book implementation**

- Route already exists at `client/src/App.tsx` → `/cookbook/concept-real-book`.
- Current page: `client/src/pages/cookbook-real-book-concept.tsx`.
- It already:
  - reads canonical meals via `useMeals()`;
  - applies `shelfForMeal()`;
  - searches names and ingredients;
  - selects a real meal;
  - publishes `selectedMealId` to the real Companion;
  - links to Planner and import;
  - draws on the photoreal base plate.
- It does **not** yet provide full grid-page parity:
  - category tabs are printed but not functional;
  - only six matches are shown;
  - Create currently redirects to import rather than opening canonical creation/import choices;
  - Planner navigates to Planner rather than adding the selected recipe;
  - recipe detail/method/actions are incomplete;
  - ingredient and recipe drag-to-Companion do not exist;
  - keyboard handling is effectively empty;
  - a single canvas is the only interaction surface;
  - mobile currently shrinks the desktop canvas rather than showing one readable page.

**Verified architecture owners**

- Canonical recipes: `shared/schema.ts` → `meals`, `Meal`, `InsertMeal`.
- Client data/cache: `client/src/hooks/use-meals.ts` → `useMeals()`, `invalidateMealLibrary()`.
- Canonical Cookbook shelving: `shared/cookbook/curation.ts` → `shelfForMeal()`, `BROWSABLE_SHELVES`, `SHELF_LABELS`.
- Existing grid/page capability: `client/src/pages/meals-page.tsx` → `MealsPage`.
- Create: `client/src/components/create-meal-modal.tsx` → `CreateMealModal`, `CreateMealContent`.
- Import: `client/src/pages/import-recipe-page.tsx` and existing import endpoints.
- Detail: `client/src/pages/meal-detail-page.tsx` and `GET /api/meals/:id`.
- Planner write: existing `AddToPlannerDialog` in `meals-page.tsx`, using `/api/planner/days/:dayId/items`.
- Companion channel: `client/src/components/conversation/companion-context.tsx`.
- Companion opening: `client/src/components/conversation/companion-open.ts` → `openCompanion()`.
- Companion action proposals: `client/src/components/conversation/companion-action.ts` plus existing confirm/cancel routes.
- Global Companion mount: `client/src/components/layout/app-shell.tsx` → one `CompanionContextProvider`, one `FloatingAssistant`.
- Global navigation: `client/src/components/nav-bar.tsx` → bottom-only `BottomNav`; no new left rail/sidebar is permitted.
- Founding data: `data/cookbook/tha_original_founding_cookbook_500/`; must remain canonical server-backed meals, not a client catalogue.

**Visual candidates—governed but unapproved**

- `client/public/images/cookbook/concept/open-family-cookbook-candidate.png`
- `client/public/images/cookbook/concept/open-family-cookbook-spread-candidate.png`
- `client/public/images/cookbook/concept/cookbook-collection-mobile-candidate.png`
- `client/public/images/cookbook/concept/cookbook-recipe-mobile-candidate.png`

The blank plate is a strong physical base: real paper grain, page curvature, binding, shadows and warm tabletop. The populated spread is directionally close, but remains an unapproved candidate. The generated food image and exact printed composition must be approved by visual bytes/hash before production admission.

**Documentation drift to correct**

`docs/implementation/COOKBOOK_REAL_BOOK_CONCEPT_RESPONSIVE_IMPLEMENTATION.md` describes native image maps and dedicated mobile plates, but the live route uses one canvas and scales it. The implementation—not the stale report—is authoritative. Correct the report when implementation is complete.

---

## 2. Non-negotiable acceptance contract

### Visual

1. Photoreal raster imagery owns the book, paper, page curvature, binding, shadows, table, food photography and surrounding environment.
2. No CSS-drawn book, SVG book illustration, card grid over a photograph, left rail, header/banner or document-height page.
3. Desktop shows the entire two-page spread, centred and dominant, with only intentional tabletop surround.
4. Arrival uses one slow restrained zoom, respects reduced motion, and ends with more book/less table.
5. Printed content follows page perspective, margins, curvature, texture and light. It must not look like flat browser text floating over a photo.
6. Typography remains small, quiet and editorial; food, collection, ingredients and method dominate—not headings or empty bands.
7. Mobile shows one readable physical page at a time; it does not scale down the desktop spread.
8. Global navigation remains at the bottom on every viewport.

### Functional parity

1. Search filters canonical meals by the same accepted fields as the existing Cookbook.
2. Category/shelf filters work and use the canonical `shelfForMeal()` owner.
3. Recipe selection updates the right page from real `Meal` data.
4. Create opens the existing canonical create/import choices.
5. Read/detail opens the real `/meals/:id` route or presents equivalent canonical detail without duplicating business logic.
6. Planner action opens the existing add-to-planner flow and persists through the existing endpoint.
7. Existing recipe actions remain reachable: detail, edit where authorised, planner, shopping/import-related actions and image handling as applicable.
8. Dragging a recipe or ingredient to the existing Companion grounds one normal Companion turn; no second assistant or copied recipe state.
9. Drag is enhancement only. Every drag action has a keyboard/tap “Ask Companion about…” alternative.
10. Real user/system meal ownership and IDOR protections remain enforced.

---

## 3. Worktree and model collaboration model

### Worktree A — functional integration

Create from the newest validated local baseline after preserving all current uncommitted work:

`C:\Users\Colin\The Healthy Apples\GitHub\tha-cookbook-real-book-functional`

**Owner:** ChatGPT/Codex  
**Write boundary:** route/page logic, extracted shared Cookbook controls/actions, Companion pointer/drop contract, tests and compliance docs.  
**Forbidden:** generating/replacing raster scene assets or granting visual approval.

### Worktree B — visual composition

Create separately:

`C:\Users\Colin\The Healthy Apples\GitHub\tha-cookbook-real-book-visual`

**Owner:** Claude Code, once its provider session allowance is available.  
**Write boundary:** Cookbook raster candidates, page-plane geometry specification, mobile-page visual candidates, visual evidence/contact sheets.  
**Forbidden:** schema, API, route, Companion, planner or canonical Meal changes; no commit/push/deploy; no visual self-approval.

### Collaboration loop

1. ChatGPT/Codex supplies a semantic “print layer” contract with exact page boxes and interaction states.
2. Claude supplies governed visual candidates and page-plane/crop measurements, not application logic.
3. ChatGPT integrates one accepted candidate into Worktree A.
4. Claude performs a read-only visual/diff review of the integrated captures.
5. ChatGPT independently verifies tests, real actions and actual pixels.
6. Colin receives only review-worthy desktop/mobile evidence. Candidate status remains explicit until approval.

Claude’s corrected local inspection was blocked by a provider session limit resetting at 16:40 Europe/London. Do not repeatedly retry before reset. The earlier Claude inspection against old `main` is superseded and must not guide implementation.

---

## 4. Implementation stages

### Stage 0 — preserve and establish the exact baseline

**Objective:** Avoid losing uncommitted Living Larder/Cookbook work or building from old `main`.

**Steps**

1. Record `git status --short`, branch and HEAD in the authoritative worktree.
2. Create a rollback reference according to `docs/ai-operating-model/rollback-and-output.md` without modifying or stashing existing work.
3. Create the two isolated Cookbook worktrees from the newest validated technical baseline that includes:
   - Companion platform/context;
   - bottom-only navigation;
   - real-book route/candidates;
   - Cookbook curation and founding data.
4. Mirror only the uncommitted Cookbook-specific files into the new worktrees; do not copy unrelated fridge/pantry work.
5. Run `git diff --check` and inventory copied files/hashes.

**Gate:** Both worktrees start from the same known baseline; no current local work is lost; no GitHub fetch/pull is used unless separately authorised.

### Stage 1 — write RED structural and parity contracts

**Objective:** Make the current concept fail for the right reasons before changing production code.

**Likely files**

- Create: `server/tests/test-cookbook-real-book-contract.ts`
- Create: `server/tests/test-cookbook-real-book-companion-contract.ts`
- Create: `scripts/capture-cookbook-real-book.mjs`
- Modify: `package.json` to expose targeted commands only after tests exist.

**RED assertions**

- route exists before generic `/cookbook`;
- no left-nav/sidebar/header component in the concept route;
- page owns no duplicate recipe data/model;
- `Meal`, `useMeals`, `shelfForMeal` and existing Companion hooks are used;
- desktop spread fits one `dvh` content viewport with bottom-nav reservation;
- mobile has collection-page and recipe-page states rather than one shrunken spread;
- semantic search/filter/recipe/create/planner/Companion controls exist;
- category filters alter the visible canonical meal set;
- planner action calls existing flow, not `navigate('/planner')` alone;
- recipe/ingredient Companion payload carries pointers, not copied business objects;
- all drag actions have keyboard/tap alternatives;
- candidate asset paths remain visibly classified as candidate.

**Gate:** Tests fail against the current canvas-only implementation for the expected missing capabilities.

### Stage 2 — extract reusable Cookbook behavior without changing `/cookbook`

**Objective:** Avoid copying local state and thousands of lines from `MealsPage`.

**Likely files**

- Create: `client/src/hooks/use-cookbook-collection.ts`
- Create: `client/src/components/cookbook/CookbookCreateImportActions.tsx`
- Create: `client/src/components/cookbook/CookbookPlannerAction.tsx`
- Modify minimally: `client/src/pages/meals-page.tsx`
- Modify minimally: `client/src/components/CookbookWorkspacePanel.tsx`

**Contract**

`useCookbookCollection()` should own only reusable presentation state:

- canonical meals from `useMeals()`;
- exclusion/retirement rules;
- canonical shelf assignment via `shelfForMeal()`;
- search query;
- selected shelf/category;
- selected meal ID;
- URL query compatibility where existing `/cookbook` relies on it.

Do not move Meal ownership, mutation logic, planner truth or Companion truth into this hook.

Extract canonical action launchers/components from `MealsPage` rather than duplicating `AddToPlannerDialog`, creation or import behavior.

**Gate:** Existing `/cookbook` behavior is unchanged and targeted parity tests pass before the real-book route consumes the extraction.

### Stage 3 — replace canvas-only interaction with a semantic physical print layer

**Objective:** Preserve the raster physical book while making the experience real, accessible and testable.

**Likely files**

- Replace/refactor: `client/src/pages/cookbook-real-book-concept.tsx`
- Create: `client/src/components/cookbook-real-book/RealBookStage.tsx`
- Create: `client/src/components/cookbook-real-book/RealBookPagePlane.tsx`
- Create: `client/src/components/cookbook-real-book/RealBookCollectionPage.tsx`
- Create: `client/src/components/cookbook-real-book/RealBookRecipePage.tsx`
- Create: `client/src/components/cookbook-real-book/real-book.css`

**Rendering rule**

- The raster plate is the visible physical object.
- Semantic DOM content sits inside calibrated left/right page planes.
- Use CSS transforms only to project content into photographed page geometry—not to draw the book.
- Clip to paper boundaries.
- Use multiply/darken blending, restrained opacity, tiny type, paper-aware colour and inherited light falloff so ink feels printed.
- Do not use card borders, drop-shadow panels, rounded UI containers or oversized web headings.
- Images must inherit the physical page crop and colour treatment.
- Keep real off-screen/accessibility labels only where required; do not create two visible UI systems.

**Arrival**

- one 500–900ms restrained scale/translate settle;
- no bounce/parallax/continuous animation;
- disabled under `prefers-reduced-motion`.

**Gate:** Desktop 1536×1024, 1440×900 and 1280×800 show the complete spread with no document scrolling and bottom navigation visible.

### Stage 4 — full left-page collection parity

**Objective:** Make the printed collection controls genuinely work.

**Required behavior**

- real semantic search input integrated into the page;
- functional canonical shelf/category filters;
- recipe list/page navigation sufficient for real household scale—not a permanent six-item cap;
- selected recipe clearly but quietly indicated;
- Create opens existing `CreateMealModal` plus import options;
- loading, empty, no-result and error states belong to the paper composition.

**Density approach**

- show a compact six-to-nine recipe page at once, depending on viewport;
- add restrained previous/next page-edge controls or page tabs physically attached to the paper;
- retain query/filter state while turning pages;
- do not convert pagination into web pagination chrome.

**Gate:** Search, every canonical browsable shelf, page navigation, recipe selection and create/import work against real data, including the founding Cookbook and household recipes.

### Stage 5 — complete right-page recipe and real actions

**Objective:** Provide a practical recipe page without leaving key information hidden.

**Required content priority**

1. category/shelf and quiet title;
2. real recipe image/fallback;
3. servings and practical metadata;
4. ingredients;
5. method;
6. notes/intelligence affordance;
7. actions.

For long recipes, use a physical sub-page/leaf turn between Ingredients and Method rather than an internally scrolling web panel.

**Actions**

- “Read full recipe” → `/meals/:id`.
- “Add to Planner” → existing `AddToPlannerDialog`/write path.
- Existing shopping action where available → existing parser/workspace path.
- Edit/delete/image actions only where already authorised and appropriate; delegate to existing owners.
- No direct duplicate API calls in the visual page when an existing action component/hook owns the behavior.

**Gate:** Create/import/update cache invalidation is correct; a selected recipe can be read and added to a real planner slot; `/cookbook` and `/meals/:id` remain unchanged.

### Stage 6 — genuine mobile single-page book

**Objective:** Do not shrink the desktop spread.

**Likely files**

- Reuse the same semantic collection and recipe page components.
- Use the dedicated governed mobile raster plates only after their exact bytes are accepted.

**Interaction**

- initial page: Collection;
- tap recipe: restrained physical page transition to Recipe;
- swipe left/right and page-edge buttons supported;
- Back returns to Collection with previous query/filter/scroll selection preserved;
- focus moves to the new page heading and returns to the originating recipe when going back;
- bottom nav remains visible and safe-area aware;
- no document scroll to find primary controls; internal page progression is explicit.

**Gate:** 390×844, 412×915 and tablet portrait are readable at normal zoom, with no two-page miniaturisation and no collision with BottomNav or Companion.

### Stage 7 — recipe and ingredient drag-to-existing-Companion

**Objective:** Ground the existing global Companion without creating a second assistant or transferring copied recipe state.

**Architecture decision required before code**

The current `CompanionSurfaceHints` contract accepts pointer IDs/slugs only and must mirror the server Context Frame exactly. A new pointer cannot be invented client-only.

Preferred design:

- recipe drag payload: canonical `mealId` only;
- ingredient drag payload: canonical `mealId` plus a stable ingredient index/reference, not a copied “ingredient object”;
- server re-reads the meal and ingredient from the owning service and verifies ownership;
- drop target belongs to the existing `FloatingAssistant`/Companion control;
- on drop:
  1. publish/attach the valid transient pointer;
  2. call `openCompanion()`;
  3. enqueue a normal explicit `useAskCompanion()` turn such as “Tell me about this recipe” or “How can I use this ingredient?”;
  4. clear transient drag state after consumption.

If the architecture owner rejects a persistent ingredient pointer, use a one-turn `CompanionAsk` extension whose server-side subject contains an ownership-verified meal ID and ingredient index. Do not put arbitrary ingredient prose into ambient surface hints.

**Likely files**

- Modify: `client/src/components/conversation/companion-context.tsx`
- Modify: server Context Frame assembler and matching accepted-hints schema
- Modify: `client/src/components/conversation/FloatingAssistant.tsx` only for a drop affordance on the existing Companion
- Create: `client/src/components/cookbook-real-book/CompanionDraggableRecipe.tsx`
- Create: `client/src/components/cookbook-real-book/CompanionDraggableIngredient.tsx`
- Add ownership/context tests.

Use the existing `@dnd-kit` dependency rather than adding another drag library. Touch/mobile must use activation thresholds so page turning and scrolling do not accidentally start a drag.

**Alternative access**

Every draggable item also exposes a semantic “Ask Companion” button/menu action using the same pointer/ask path.

**Gate:** One Companion remains mounted; drop opens the existing panel; conversation/history/action confirmation remain canonical; cross-user meal IDs are denied; stale pointers clear on unmount/turn completion.

### Stage 8 — visual evidence and human acceptance

**Objective:** Separate technical completion from visual approval.

**Evidence**

- Full-resolution masters for desktop, laptop, tablet, mobile Collection and mobile Recipe.
- Labelled contact sheet.
- Short capture of arrival zoom and mobile page turn.
- State captures:
  - default collection;
  - active search;
  - filtered category;
  - selected recipe;
  - long ingredients/method;
  - Create/import open;
  - Planner dialog open;
  - Companion drag hover/drop;
  - loading/empty/error/missing image.
- Asset manifest with file hashes and explicit `candidate`/`approved` status.

**Visual gate**

Colin approves or rejects the exact pixels. Build/test success cannot approve the visual candidate. No candidate raster moves into the production asset library before that decision.

### Stage 9 — integration and regression gate

**Commands**

```bash
npm run typecheck
npm run typecheck:ci
npm run adoption:check
npm run test:cbk1-cookbook-seed
npm run verify:cookbook-seed
npm run test:intelligence-meals-binding
npm run test:intelligence-companion-actions
npm run test:comp-act1-companion-actions
npm run test:trust1-s3a-meal-ownership-idor
npm run build
git diff --check
```

Add focused commands for the new real-book contracts and capture suite.

**Manual regression routes**

- `/cookbook/concept-real-book`
- `/cookbook`
- `/meals/:id`
- `/import-recipe`
- `/planner`
- `/shopping-workspace`

**Gate:** Functional parity passes, bottom navigation is unchanged, one Companion remains, no duplicate recipe store/API/model exists, visual approval is recorded separately, and no PR/deployment occurs without explicit authorisation.

---

## 5. Principal risks and decisions

1. **Dirty authoritative worktree:** implementation must use isolated worktrees and copy only Cookbook-specific uncommitted files.
2. **Canvas-only accessibility:** current coordinate regions cannot provide robust semantics, focus, drag or mobile parity. Replace the interaction layer, not the raster physical object.
3. **Printed-vs-web look:** semantic DOM is necessary but must be page-plane projected and visually blended. Ordinary cards/panels are a hard rejection.
4. **Ingredient identity:** ingredients are primarily strings, not canonical ingredient-row IDs. Use meal ID plus verified index/reference; do not invent a second ingredient model.
5. **Companion contract:** client hints mirror server hints exactly. Any drag pointer must be accepted and re-read server-side before use.
6. **Meal ownership:** user recipes are user-scoped plus system meals. Detail/search/Companion grounding must never reveal another user’s private meal.
7. **Founding 500 quality:** browse defaults must respect `BROWSABLE_SHELVES`; the generated wider library remains searchable but does not overwhelm the opening page.
8. **Recipe image quality:** broken or unsuitable external URLs must fall back honestly; photoreal completion cannot depend on unreliable hotlinks.
9. **Mobile gesture conflict:** drag, page turn, Companion and bottom navigation need explicit pointer/keyboard contracts and touch thresholds.
10. **Claude provider limits:** visual work can begin when Claude’s session allowance resets; Codex and ChatGPT can meanwhile complete contracts/extraction in a separate worktree without crossing visual ownership.

---

## 6. Definition of “real”

The Cookbook is real only when all of the following are simultaneously true:

- it is recognisably a premium photographed physical family cookbook;
- the full book fits the viewport and global navigation remains at the bottom;
- desktop and mobile use appropriate physical page arrangements;
- real meals populate it from canonical APIs;
- search, filters, selection, create/import, reading and planner actions genuinely work;
- method and practical information are usable, not decorative text;
- recipes and ingredients can invoke the one existing Companion by drag or accessible alternative;
- no duplicate recipe, planner, navigation or Companion system exists;
- structural tests pass;
- actual desktop/mobile pixels have been independently inspected;
- Colin has approved the exact visual candidate bytes;
- no unapproved candidate is represented as production-ready.
