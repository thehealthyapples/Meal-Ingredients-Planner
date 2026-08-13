# Codex task — Real Cookbook functional implementation

Work only in the isolated local worktree `C:\Users\Colin\The Healthy Apples\GitHub\tha-cookbook-real-book-functional`.

Read first:
- `COOKBOOK_COLLABORATION_CONTRACT.md`
- `.hermes/plans/2026-08-13_162625-real-working-cookbook.md`
- existing `client/src/pages/cookbook-real-book-concept.tsx`
- canonical Cookbook/Meal/Create/Planner/Companion owners named in the plan

## Objective
Implement a substantial, tested functional vertical slice of `/cookbook/concept-real-book` using real canonical data and existing application actions. This is the functional lane; do not solve Claude's visual stage.

## Required behavior
1. Route works in this clean worktree and shell suppresses the top room threshold/header for this route while preserving the one global Companion and bottom navigation.
2. Real semantic DOM—not canvas hit regions—renders:
   - exact heading `Our Family Favourites`;
   - real search input positioned logically after the Create area in DOM/desktop composition;
   - functional canonical shelf/category filters using `shelfForMeal`, `BROWSABLE_SHELVES`, `SHELF_LABELS` (do not invent Breakfast/Lunch categories if canonical owner does not own them);
   - paginated real meal collection, no permanent six-item truncation;
   - selected real meal content: image/fallback, ingredients, instructions/method, servings and existing metadata only;
   - recipe click updates selected meal and Companion `selectedMealId`;
   - Read full recipe opens `/meals/:id`;
   - Create opens existing `CreateMealModal`;
   - Import opens existing canonical import flow/page;
   - Add to Planner reuses the existing planner dialog/action owner. If required, extract `AddToPlannerDialog` from `meals-page.tsx` into a shared component with no behavior regression—do not duplicate its write logic.
3. Mobile state supports collection → recipe → collection with focus-friendly real controls; visual treatment belongs to Claude.
4. Provide a clearly marked integration seam for Claude's `RealBookStage` API from the collaboration contract.
5. No favourite field/star/badge.
6. Do not implement recipe/ingredient drag-to-Companion in this first slice unless all prior requirements are complete and tested. Publishing selectedMealId remains mandatory.

## TDD
Strictly test first:
- Create a focused repository contract test under `server/tests/`.
- Run it against current code and record expected RED.
- Implement minimal vertical slices and run GREEN.
- Test real source contracts/behavior—not only string presence where a pure function can be extracted and executed.
- Record RED/GREEN commands and actual results in `artifacts/cookbook-real-book-functional/validation-output.txt`.

## Validation
Run at minimum:
- focused new test;
- `npm run typecheck` or focused TypeScript check with honest baseline handling;
- relevant existing Cookbook seed test;
- `npm run build`;
- `git diff --check`.

## Boundaries
- Do not modify source PNGs or approved Revision 01.
- Do not modify Claude-owned `client/src/components/cookbook-real-book/*`.
- No schema/migration/new recipe store/new Companion/new planner implementation.
- No credentials/network/GitHub/staging/production.
- No commit/push/PR/deploy.
- Preserve unrelated baseline behavior.

## Finish
Return changed files, RED and GREEN evidence, build/typecheck results, known gaps, and exact integration seam. Do not claim visual approval.
