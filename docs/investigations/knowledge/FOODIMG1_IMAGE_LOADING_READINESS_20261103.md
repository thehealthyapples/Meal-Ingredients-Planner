# FOODIMG1 — Food image loading readiness

**Date:** 2026-11-03 (Europe/London)  
**Owner repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Worktree / branch / HEAD:** `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`  
**Initial status:** 112 pre-existing modified/untracked status entries; preserved.  
**Risk:** This readiness review was read-only. Proposed image integration changes visible UI/data references and is treated as Amber.  
**Rollback marker:** `rollback/FOODIMG1-image-loading-readiness-20261103` points to the committed HEAD above; it does not capture the pre-existing uncommitted files.

## Governance preflight receipt

- **User request:** Find whether the previously reviewed food photos can now be loaded for all foods.
- **Governing files read:** `G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md` mandatory bootstrap; `docs\architecture\README.md`; `docs\architecture\ENGINEERING_WORKFLOW.md`; `docs\architecture\ARCHITECTURE_PRINCIPLES.md`; `docs\architecture\THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Domain 1; `docs\architecture\THA_UI_ARCHITECTURE.md` §§10, 17–18; `docs\architecture\GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs\architecture\THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` §§1–3; `.engineering\standards\RISK_AND_SCOPE_STANDARD.md` §§1–4; `docs\investigations\knowledge\FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md` §1.
- **Task sources inspected:** `shared\schema.ts`; `shared\knowledge\foods.ts`; `shared\knowledge\graduated-foods.ts`; `server\services\nutrition-knowledge-registry.ts`; `client\src\lib\ingredient-imagery.ts`; new dirty worktree file `client\src\components\WeekFoodExplorer.tsx`; `.scratch-images\manifest-batch.json`; `.scratch-images\` inventory; `package.json`/`package-lock.json` for the pending resize dependency.
- **Authorized scope:** Readiness investigation for dev-branch food imagery; no promotion or deployment.
- **Non-goals:** No app, seed, DB, asset, or configuration changes; no provider calls; no tests/builds; no candidate image quality re-review.
- **Implementation permitted:** YES for the stated dev-branch scope under standing dev-branch authority. Integration is presently blocked by missing per-food approved-image mapping and source provenance.
- **Architecture/governance conflict:** No ownership change is needed. The architecture points to the existing entity owner and warns against duplicate image ownership.

## Findings

1. **The current local seed contains 610 distinct food slugs.** This is a source-code count, not a live database count. The requested `SELECT COUNT(*) FROM knowledge_foods` was not run because `DATABASE_URL` is unavailable in this process.
2. **The scratch folder contains 1,226 JPG candidates across 613 distinct filename slugs** plus `manifest-batch.json` (38 records). The manifest records `slug`, `name`, `query`, and candidates with `i`, `tags`, and `path`; it has no `good`/`bad`/`warn` decision, selected image, author, source URL, or licence field. A literal comparison finds 17 candidate slugs not in the 610 seed slugs and 14 seed slugs without exact filename matches; these may include synonym/plural mappings and require an explicit crosswalk.
3. **The intended entity-owned path already exists.** `knowledge_foods.image_url` is an existing nullable field (`shared/schema.ts`); `getFoodDetailView()` returns it as `imageUrl` (`server/services/nutrition-knowledge-registry.ts`). The `IMAGE_MAP` in `client/src/lib/ingredient-imagery.ts` remains empty. UI Architecture §10 says canonical entity images belong to their entities and their owners. Do not make a second client-side canonical image map for these 610 registry foods.
4. **The local workspace cannot establish the reported 323 approved picks.** The prior review's 323/610 count and visual verdicts are user-provided context, not independently re-verified here. The provided Claude Artifact pages could not be fetched in the preceding verification turn. The local manifest does not contain their per-food verdicts or acquisition/credit metadata.
5. **Image-use rights remain unverified from local evidence.** The candidate manifest has no Pixabay image page URLs, authorship, acquisition record, or licence data. The existing source/licensing audit does not clear these particular files. UI Architecture requires honest, natural food imagery and no stock-photo tone.

## Result and blocker

I did not load images. Using all 1,226 files would risk assigning a rejected or mismatched image, and the available files do not establish the licensing/provenance record. The prior reported review had 323 good images for 610 foods, so full coverage also requires approved replacements for the other foods unless the owner chooses a different honest fallback.

**Needed to continue:** export the six review pages or provide a CSV/JSON mapping each canonical food slug to its approved candidate path/index and include the Pixabay source page URL, creator/credit, licence basis, and approval status. For foods with no approved candidate, include a replacement selection or authorize a new sourcing-and-review pass. Once supplied, the implementation can use the existing `knowledge_foods.image_url` owner and image-serving path without introducing duplicate state.

## Actions and checks

- **Database/live services:** not accessed; `DATABASE_URL` unavailable. No database writes.
- **Source/app/assets:** unchanged by this task. Only this investigation report was added to the repository.
- **Configuration/scheduled tasks:** not accessed or changed.
- **Tests/builds:** not run.
- **User acceptance:** pending; no image was wired or displayed.
- **Current status delta:** 112 initial dirty entries; one new report file added; all pre-existing entries preserved.
