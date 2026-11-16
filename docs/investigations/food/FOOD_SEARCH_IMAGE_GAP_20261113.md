# Food Search Image Gap Investigation

- **Date:** 2026-11-13
- **Repository / branch:** `tha-integrated-dev-g-native-20261003` / `feat/integrated-dev`
- **Task:** Explain why the Foods page shows generic plant icons instead of photographs for foods in the selected week/search.
- **Risk:** Amber for changing the interactive image sourcing/presentation behavior; this investigation made no app-code changes.
- **Screenshot:** User-provided `codex-clipboard-d0d4f5e2-65a6-46b1-93b5-c8a38f787ee1.png`; treated as evidence of the visible issue, not architecture.

## Governing sources read

- `G:\The Healthy Apples\AGENTS.md`
- `AGENTS.md`
- `PROJECT_GOVERNANCE.md`
- `docs/architecture/README.md`
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain 2)
- `docs/architecture/THA_UI_ARCHITECTURE.md` (§10 imagery)
- `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`
- `docs/product/structure/domains/dom-shopping.md`
- `client/src/components/WeekFoodExplorer.tsx`
- `client/src/lib/ingredient-imagery.ts`
- `G:\The Healthy Apples\Incoming\Issue Screenshots\README.md`

## Findings

- **Verified:** `WeekFoodExplorer.tsx` renders the selected-week ingredient image through `FoodImage`, which calls `getIngredientImage(row.displayName)`.
- **Verified:** `ingredient-imagery.ts` has an empty `IMAGE_MAP` and empty `CATEGORY_IMAGE_MAP`; when no match exists, `FoodImage` displays `getCategoryEmoji(...)`. The screenshot's generic plant/vegetable icon is this fallback. No ingredient photos exist under `client/public/images/ingredients` at this time.
- **Verified:** The same `FoodImage` is used for selected-week foods and selected-food detail. The displayed foods are built from meal ingredients; the current row path does not dynamically look up a photo as the user types a food search.
- **Verified:** `THA_UI_ARCHITECTURE.md` requires natural food photography, canonical entity images to come from their entity owner, and rejects stock-photo tone. The SoT Register assigns canonical identity to Domain 2 (`shared/canonical/foods.ts`).
- **Inferred:** The current screen has a placeholder presentation, not an implemented source-of-food-images feature. The screenshot correctly exposes the gap.
- **Conflict/unknown:** No image-sourcing implementation or approved image set is present. The helper's code comments propose Pexels self-hosted WebP and reject runtime search APIs/hotlinked Open Food Facts imagery, but these are implementation comments, not a separate governing image-source decision. A static per-canonical-food asset set is consistent with the one-image-per-entity architecture; dynamic query-time sourcing would need reconciliation with that architecture.

## Files changed / checks

- No application source files or image assets changed.
- Repository branch/HEAD/status were inspected; the worktree contains substantial pre-existing edits/untracked files, all preserved.
- No typecheck, test, live service, database, scheduled task, or configuration change was run/touched for this investigation.

## Next decision

Choose the intended experience: (A) curated, self-hosted image per canonical food (recommended by current architecture), or (B) images searched dynamically at query time (would require an owner-approved architecture/source decision). Do not silently pick an image source or hotlink unreviewed assets.

## Addendum — existing image-library work (2026-11-13)

- **Verified:** `docs/investigations/cookbook/INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md` records the source review and recommends a curated library; `docs/investigations/cookbook/INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md` confirms that only empty lookup infrastructure was implemented, with no images downloaded or UI changed.
- **Verified:** The ignored `.scratch-images` directory exists locally and contains food candidate files. `docs/investigations/knowledge/FOODIMG1_IMAGE_LOADING_READINESS_20261103.md` reports 1,226 candidate JPGs across 613 slugs and says the manifest lacks a per-food selected image, approval decision, source URL, creator/credit, or licence record. Its report says the previously claimed 323 approved picks could not be re-verified from the local files.
- **Verified:** `shared/schema.ts` has a `knowledge_foods.image_url` field and `server/services/nutrition-knowledge-registry.ts` returns `imageUrl` from food detail, but `WeekFoodExplorer`'s `FoodImage` does not consume that entity image. It calls the separate, empty client `IMAGE_MAP` lookup instead.
- **Verified:** Repository-wide searches found no Pexels/Unsplash runtime image-search integration. Those names occur in comments and historical investigations; the current map expects app-hosted `/images/ingredients/...` assets.
- **Conclusion:** The user remembered correctly: image-library sourcing/review was investigated and candidate assets exist locally. The ingestion, provenance/approval crosswalk, and connection to the Foods surface were not completed. No candidate images were opened or changed in this follow-up.
- No application files or image assets were changed; pre-existing worktree edits remain untouched.

## Addendum — hybrid coverage direction and current provider constraints (2026-11-13)

- **Owner direction:** Curated/local images may be used where coverage exists, with dynamic search likely needed for the long tail.
- **Verified prior recommendation:** `docs/investigations/cookbook/INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md` already proposed a hybrid: curated self-hosted core images plus a dynamic long-tail fallback. That document is historical research, not an implementation or current approval record.
- **Verified current official Unsplash API guidance:** images must use the API-returned hotlinked URLs, display required photographer/Unsplash attribution and links, and keep API credentials confidential (Unsplash API Guidelines and Hotlinking guidance, reviewed 2026-11-13).
- **Verified current Pexels API status:** official Pexels help pages currently state new API key issuance is paused; Pexels API use also requires a prominent Pexels link and recommends photographer credits.
- **Inferred implementation shape:** curated images can cover known/approved foods, with dynamic query results filling the long tail. Avoid auto-assigning an arbitrary result as canonical food imagery until the entity-owned image/provenance workflow is defined; otherwise results should remain clearly attributed search suggestions and fall back honestly when none match.
- **No source code, image assets, API credentials, or provider services were changed or called.**
