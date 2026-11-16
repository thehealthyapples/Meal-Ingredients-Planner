# FOODIMG2 — Hybrid food imagery for the Food page

- **Date:** 2026-11-13 (Europe/London)
- **Repository / branch / HEAD:** `tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `834c1d46cdf8c9108e05fed4e6044252b03a3a20`
- **Risk:** Amber — selected-food image behavior and provider access.
- **Rollback identifier:** `rollback/food-image-hybrid-20261113` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- **Pre-existing worktree state:** 37 unrelated dirty entries were present before FOODIMG2 work. They remain preserved. `server/routes.ts` had unrelated local edits; its byte-exact pre-change backup is `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-FOODIMG-HYBRID-CODEX-20261113\server-routes.ts` (SHA-256 `778B7D4F69ACBC5AD31B0B0BA8666FEA6B3EE3695CD3F0238AD009DFD083B4B3`).

## Governance preflight receipt

- **User direction:** Use the already discussed hybrid: approved curated images where available and dynamic search for uncovered foods.
- **Implementation permitted:** YES for this dev-branch feature under the standing authority recorded by repository `AGENTS.md` and `PROJECT_GOVERNANCE.md`; no promotion or deployment is authorized.
- **Owning area:** Food page imagery. Domain 2 canonical identity is bridged to the existing Food Knowledge owner for canonical image URLs. Dynamic search is a transient display fallback and writes no image facts.
- **Governing files read:** `G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs\architecture\README.md`; `docs\architecture\ENGINEERING_WORKFLOW.md`; `docs\architecture\ARCHITECTURE_PRINCIPLES.md`; `docs\architecture\THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs\architecture\THA_UI_ARCHITECTURE.md`; `docs\architecture\GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs\architecture\THA_EXPERIENCE_BLUEPRINT.md`; `docs\architecture\THA_EXPERIENCE_ARCHITECTURE.md`; `docs\architecture\THA_EXPERIENCE_LANGUAGE.md`; `docs\architecture\THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs\architecture\PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `.engineering\standards\RISK_AND_SCOPE_STANDARD.md`; `docs\implementation\ux\ADOPTION_REGISTER.md`; `docs\investigations\food\FOOD_SEARCH_IMAGE_GAP_20261113.md`; `docs\investigations\knowledge\FOODIMG1_IMAGE_LOADING_READINESS_20261103.md`; `docs\investigations\cookbook\INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md`; and `docs\investigations\cookbook\INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md`.
- **Missing/conflicting authority:** None identified for transient dynamic fallback after the user's hybrid direction. Existing `.scratch-images` candidates remain excluded because their individual approvals and provenance/licensing are unverified; they were not used.

## Architecture and experience compliance

- **Verified — identity and ownership remain singular:** `shared/canonical/food-report-adapter.ts` maps canonical identity to `knowledgeFoodSlug`; `server/services/nutrition-knowledge-registry.ts` remains the owner of canonical `imageUrl`. `WeekFoodExplorer` only consumes image results.
- **Verified — no duplicate state or workflow:** no database, seed, asset library, or persistent image mapping was added. Dynamic results live in a bounded process cache and React Query cache only. Existing selected-food UI is extended in place.
- **Verified — existing architecture extended:** static approved local images remain available through `getIngredientImage`; the endpoint returns a Food Knowledge image first, then an attributed transient Unsplash result.
- **Verified — permission-aware access:** the new endpoint requires `req.isAuthenticated()`. No credential was inspected, printed, or changed.
- **Experience check:** imagery appears in the existing selected-food answer, reducing effort and adding a small true pleasure. No new panel or action is added. The page reports image attribution as a fact; household selection remains unchanged. This sits in UI implementation under the Food page, governed by the Experience and UI architectures.
- **Product registry:** no new product surface or capability was introduced; the existing Food page entry remains accurate. **Adoption register:** no shared building block was added, adopted, or retired; `FoodImage` remains local to the existing component.
- **Definition of done:** Food Knowledge image preferred; curated local image next; dynamic lookup for foods approaching the visible list and for explicitly opened lookup results; attribution/source and license shown with the selected dynamic image; no persistent writes; icon fallback retained when no sufficiently relevant result is available.
- **Data impact:** read-only existing Food Knowledge lookup; no writes, migration, or backfill.
- **Trust check:** highest-risk unresolved claim is whether the current backend process has loaded the route and whether its existing Pixabay API access is currently usable. No credential values were inspected. The live UI fallback was verified separately through Wikimedia Commons.
- **Rollback:** revert only the FOODIMG2 hunks in `WeekFoodExplorer.tsx`, `server/routes.ts`, `shared/canonical/food-report-adapter.ts`, and remove the new `server/services/food-image-search.ts`; preserve all pre-existing hunks. The rollback tag anchors committed state; the backup protects the already-dirty `server/routes.ts` state.
- **Scope lock:** curated/static imagery plus dynamic lookup only for rows entering the visible viewport or a selected/lookup food; no bulk search of all weekly foods, unverified candidate assets, DB changes, configuration edits, or deployments.

## Changes made

- Added `server/services/food-image-search.ts`: server-side Pixabay Search API adapter using only `PIXABAY_API_KEY` on the server, bounded 24-hour success/negative cache, request deduplication, timeout, temporarily displayed image URL, and photographer/source credit.
- Added authenticated `GET /api/foods/:canonicalSlug/image`: returns the existing Food Knowledge image first, otherwise a transient Pixabay result for the selected food name.
- Added `knowledgeSlugForCanonicalSlug()` to the existing canonical-to-knowledge adapter as a bridge, with no copied image data.
- Updated `client/src/components/WeekFoodExplorer.tsx` to query visible rows lazily, respect Food Knowledge and curated local images first, handle older servers returning HTML for the new API route, and use a public Wikimedia Commons fallback only when needed. Commons results require image, source, and license metadata and pass an ingredient relevance filter. Selected-image attribution and license links are displayed in the detail pane.

## Definition of Done and verification

- **TypeScript:** `npm run typecheck` completed with 16 errors in existing unrelated files (`plan-to-shopping-review-dialog.tsx`, `admin-knowledge-claims-page.tsx`, server scripts, and tests). No diagnostic named a FOODIMG2-modified file.
- **Diff hygiene:** `git diff --check` passed.
- **Repository structure check:** `.engineering/scripts/repo-structure-verify.sh` could not start because this environment returned `Bash/E_ACCESSDENIED`; the script is read-only and no alternate runtime was available.
- **Live UI:** `/food`, Week 22. Selecting Tomato displayed a real tomato photograph with photographer, CC BY-SA 3.0, and Commons source links. After a fresh page load, visible food rows also populated real images as they approached the viewport. Existing icons remained on entries for which the relevance/licence filter returned no match. No app service was restarted.
- **Database/configuration/provider:** no database or configuration touched; no credential values read. The current server image route remained stale, so the browser requested Commons fallback images for visible rows (non-sensitive ingredient names only).
- **TypeScript:** the final `npm run typecheck` reported 16 diagnostics in unrelated existing files; none name FOODIMG2/FOODIMG3 code files.
- **Build:** `npm run build` passed (client and server bundles). Existing Browserslist/PostCSS/chunk-size and CJS/import.meta warnings remain.
- **User acceptance:** confirmed on `/food` by selecting Tomato and observing the photo and credit links; reloaded and confirmed photos appear in the visible list. Scroll to another row to request that row's image. If no relevant, licensed result exists, the icon remains.
- **Regression checks:** Foods list/search and selection remained functional during browser observation. Shopping, planner, and database flows were not exercised or changed.
- **Services:** existing local development services were observed only; none were started, stopped, or restarted. Database, scheduled tasks, and configuration were untouched.

## Suggestions

- The existing curated image mapping is still empty; owner-reviewed images can be added later through its existing source-of-truth path to reduce dynamic fallbacks.

## Addendum — visible-list image repair (FOODIMG3, 2026-11-13)

- **Cause confirmed:** the Food Knowledge endpoint is live, but its tomato `imageUrl` is empty. The newly added image route is not registered in the running server; the path returns the Vite HTML shell. The client previously expected JSON and therefore left the generic icon in place.
- **Verified fix:** image loading now prefers the existing Food Knowledge image, then the authenticated server image route, then a public Wikimedia Commons search when the server route is missing or has no result. A small server-rendered search now uses the existing `PIXABAY_API_KEY` variable only on the server. Its value was not read or exposed. Wikimedia requests use `origin=*` for anonymous CORS, per the [MediaWiki CORS documentation](https://www.mediawiki.org/wiki/Manual:CORS). Results are accepted only when image, source page, and license metadata are present, and are filtered against the ingredient terms and obvious prepared-dish terms.
- **Coverage behavior:** curated local images stay first after Food Knowledge canonical images. For uncovered foods, list thumbnails are searched lazily as rows approach the visible list; the client does not request all 96 weekly foods on initial load. Search results are held only in the browser query cache and bounded server memory cache; no DB or asset writes occur.
- **Provider requirements:** Pixabay permits temporary result display, says returned web-format URLs are valid for 24 hours, requires API queries to be cached for 24 hours, and asks that the source be shown ([Pixabay API docs](https://pixabay.com/api/docs/)). The server cache is 24 hours. Commons source and license links appear with the selected food image.
- **Browser acceptance:** on `/food` with Week 22, selected Tomato displayed a real tomato photograph with author, CC BY-SA 3.0, and Wikimedia Commons source links. The visible food list also showed actual photos for matching items including Celery, Green Olives, Olives, Onion, Tomatoes, and White Mushrooms after their lazy lookup completed. No server restart was needed. Weaker/unmatched results keep the icon fallback.
- **TypeScript:** rerun after this repair still reports the same 16 pre-existing diagnostics outside the modified files; no FOODIMG3 diagnostic appeared.
- **Services/data:** existing local services were read only. No restarts, database changes, configuration writes, deployments, or credential reads occurred. Ingredient query terms were sent to Wikimedia Commons from the browser for image search, as the user requested dynamic food imagery.

- **Final follow-up check:** the selected image is passed to a weekly row only when its display key matches, preventing a search-selected food image from appearing on another row. After this guard, the production build passed and git diff --check passed. Existing unrelated warnings remain.
