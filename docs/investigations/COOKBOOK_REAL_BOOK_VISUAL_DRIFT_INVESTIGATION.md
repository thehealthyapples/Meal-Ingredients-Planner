# Cookbook Real Book visual drift investigation

Status: read-only investigation. No application implementation was changed.

## Repository pre-state

- Branch: `[VERIFIED]` `feat/integrated-dev` (`git status --short --branch`)
- HEAD: `[VERIFIED]` `a007b37f7f62bd9cbb59c20edf8ced2c22144a56` (`git rev-parse HEAD`)
- Rollback identifier: `[VERIFIED]` HEAD `a007b37f7f62bd9cbb59c20edf8ced2c22144a56`
- Worktree: `[VERIFIED]` already substantially dirty before this report; those changes were preserved exactly.

## Findings

### ROOT CAUSE:

`[VERIFIED]` In the current working tree, `/cookbook` is wired to the Real Book page, not `MealsPage` (`client/src/App.tsx:383-386`). The governing route map still records `/cookbook` as an alias of `MealsPage` (`docs/product/structure/routes/routes-map.md:49-53`). This is architecture/documentation drift, not a simple CSS defect. The visible result can therefore differ depending on whether the running application reflects the current dirty checkout or the route-map/committed baseline.

`[INFERRED]` If the deployed/runtime build is based on the older route contract, it renders the generic grid surface and cannot display the physical Real Book experience. If it is running the current dirty `App.tsx`, the Real Book implementation is connected and any remaining visual difference is within the Real Book surface itself, not caused by the route selecting `MealsPage`.

### CURRENT COOKBOOK ROUTE:

`[VERIFIED]` `/cookbook` is registered in `client/src/App.tsx:385`; `/cookbook/grid` is intentionally registered to `MealsPage` at `client/src/App.tsx:386`. `/meals` remains a separate `MealsPage` route at `client/src/App.tsx:383`.

### CURRENT RENDERED COMPONENT:

`[VERIFIED]` `/cookbook` → `ProtectedRoute` → lazy `CookbookRealBookConcept` (`client/src/App.tsx:25,385`) → `<main data-realm="cookbook">` → `RealBookStage` (`client/src/pages/cookbook-real-book-concept.tsx:128-276`). The page also mounts `CreateMealModal` and `AddToPlannerDialog`.

`[VERIFIED]` The legacy/grid hierarchy remains `/cookbook/grid` → `ProtectedRoute` → `MealsPage` (`client/src/App.tsx:386`), whose large implementation includes `CookbookWorkspacePanel` (`client/src/pages/meals-page.tsx:78,5235`).

### CANONICAL COOKBOOK OWNER:

`[VERIFIED]` The governing capability is “Meals / Cookbook” (`docs/architecture/capabilities/meals.md:1-26`), with the route map as the product route record (`docs/product/structure/routes/routes-map.md:12-24`). The current Real Book page is the presentation owner for `/cookbook`; it must remain a consumer rather than a second data owner.

### CANONICAL MEAL/RECIPE OWNER:

`[VERIFIED]` `server/storage.ts` owns cookbook meal reads (`getMeals`, `getMeal`, summaries and items), and `meals` plus `meal_items` are the source-of-truth tables (`docs/architecture/capabilities/meals.md:17-27`). Both `CookbookRealBookConcept` and `MealsPage` consume `useMeals` (`client/src/pages/cookbook-real-book-concept.tsx:11,131`; `client/src/pages/meals-page.tsx:14,2534`).

### REAL COOKBOOK IMPLEMENTATION:

`[VERIFIED]` A functioning implementation exists in code: `client/src/pages/cookbook-real-book-concept.tsx`, `client/src/components/cookbook-real-book/RealBookStage.tsx`, `RealBookPagePlane.tsx`, `index.ts`, `real-book.css`, and `client/src/lib/cookbook-real-book/collection.ts`. It reads the canonical meal library, filters/paginates it, renders collection and recipe pages, and preserves Planner, Shopping, Freezer, Analyser, recipe creation, and web-preview paths in the page component.

### REAL COOKBOOK DESIGN SOURCE:

`[VERIFIED]` The implementation record identifies the physical book plates and the image-first concept route in `docs/implementation/COOKBOOK_REAL_BOOK_CONCEPT_RESPONSIVE_IMPLEMENTATION.md:7-10,16-30`. Candidate visual assets exist under `client/public/images/cookbook/concept/`, including `open-family-cookbook-candidate.png`, `open-family-cookbook-spread-candidate.png`, and mobile/recipe variants. The collaboration contract identifies the Real Book component and CSS files and states that the blank photoreal plate is the live desktop base (`COOKBOOK_COLLABORATION_CONTRACT.md:10-29,63`).

### INTENDED:

`[VERIFIED]` A physical, image-first open family cookbook: real book spread/planes, readable responsive collection and recipe pages, with semantic live controls over the visual surface (`docs/implementation/COOKBOOK_REAL_BOOK_CONCEPT_RESPONSIVE_IMPLEMENTATION.md:16-18,29`; `COOKBOOK_COLLABORATION_CONTRACT.md:63`). The governing experience model also requires physical rooms/objects as primary and a readable mobile fallback (`PROJECT_GOVERNANCE.md`, Product North Star and Visual governance sections).

### CURRENT:

`[VERIFIED]` The current working-tree `/cookbook` implementation does render `RealBookStage`, whose CSS defines desktop/mobile stages, plate/plane layout, Georgia/ink typography, recipe grids, recipe panels, and responsive rules (`client/src/components/cookbook-real-book/real-book.css:18-68,73-179,254-349`). Its data and actions are connected to `useMeals` and existing APIs rather than a replacement meal library.

`[VERIFIED]` The documented route map still says the live `/cookbook` surface is `MealsPage` (`docs/product/structure/routes/routes-map.md:51-53`). `MealsPage` is a conventional grid/card surface with `CookbookWorkspacePanel` and extensive button/card UI (`client/src/pages/meals-page.tsx:78,2533,5235`).

### MISSING:

`[VERIFIED]` The missing correction is canonical convergence: the governing route record and the runtime route do not agree about which page owns `/cookbook`.

`[INFERRED]` No missing Real Book component, meal-library connection, or Real Book stylesheet is evidenced by this repository snapshot. The repository does not support claiming that the Real Book is absent or that its CSS/assets are simply unloaded.

### GIT HISTORY:

`[VERIFIED]` Relevant history shows Real Book work was implemented and refined rather than merely documented: commits include `2f8f142e` (preserve working real-book review state), `616e547c` (full-bleed table framing), `e9757de9` (legacy parity before visual integration), `aa001be6` (trusted-preview legibility), `a3e4fdba`/`ef6ca1fc` (recipe search), `a37849fb` (recipe actions), and `343a3ff9` (locally projected cookbook typography).

`[INFERRED]` The strongest evidenced history classification is A/B combined: the Real Book was implemented and the repository retained a legacy Meals route, while the route-map record was not converged with the later `App.tsx` route decision. It is not evidenced as an unimplemented design or a CSS-only failure.

### ARCHITECTURE DRIFT: YES

`[VERIFIED]` `client/src/App.tsx:385` and `docs/product/structure/routes/routes-map.md:52` disagree. Per governing instructions, this investigation does not resolve that conflict.

### LIKELY RISK:

`[INFERRED]` A runtime/deployment built from a different revision can expose the generic Meals grid at `/cookbook`, while local dirty-tree testing exposes the Real Book. Converging the wrong side without an explicit governing decision could either discard the intended Real Book route or make the route map falsely describe the live product. Existing dirty changes also make provenance important.

### MINIMUM CORRECTION:

`[VERIFIED]` First resolve the route ownership drift through the governed product/architecture path. Once `/cookbook` is formally confirmed as the Real Book surface, the smallest implementation correction is to ensure the authoritative runtime uses the existing `CookbookRealBookConcept` route and to update the route record/documentation to match. No new Cookbook implementation is indicated.

### REQUIRED FILES:

`[INFERRED]` Likely bounded follow-up files, subject to governance approval: `client/src/App.tsx` only if runtime route wiring is not already accepted; `docs/product/structure/routes/routes-map.md` for the canonical route record; existing Real Book files only if focused runtime verification finds a concrete defect. No data/schema migration is indicated.

### FILES THAT MUST NOT CHANGE:

`[VERIFIED]` `server/storage.ts`, `shared/schema.ts`, canonical meal/recipe tables and APIs, Planner integration, Shopping integration, existing recipe action paths, Admin files, worker/bridge files, and unrelated dirty worktree files must remain unchanged for this investigation and any narrowly governed route correction unless a later decision explicitly expands scope.

### DATA IMPACT:

`[VERIFIED]` None from this investigation. The report is documentation-only; no database, meal, recipe, Planner, Shopping, or persistence data was changed.

### RECOMMENDED NEXT GOVERNED ACTION:

`[VERIFIED]` Commission a narrow route-ownership reconciliation: verify the authoritative deployed revision and formally reconcile `client/src/App.tsx` with `docs/product/structure/routes/routes-map.md`, then perform focused `/cookbook` visual/runtime verification. Do not implement or redesign until the architecture drift is resolved.

## Final status

`[VERIFIED]` Files modified by this task: this report only.

`[VERIFIED]` No application code, assets, governance state, or pre-existing dirty file was modified.
