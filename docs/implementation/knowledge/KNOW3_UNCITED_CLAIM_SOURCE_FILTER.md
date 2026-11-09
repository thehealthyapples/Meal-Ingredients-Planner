# KNOW3 uncited claim source filter — implementation report

**Date:** 2026-11-05  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` (`feat/integrated-dev`, base `3467abad4eca8d82ffc52756fee13874e389597f`)  
**Risk:** Amber — existing review-worklist filtering only.

## Delivered

The Admin Nutrition Claim Review page now has a Source selector: “Has a source” (default), “Awaiting a source”, and “All source states”, plus stable global paging at 50 rows per page with an exact filtered total. The API validates the filters and `limit`/`offset`, and the existing claim-review store filters on canonical `source_refs`. The legacy `citedOnly` option remains compatible for CLI callers. Product capability/page descriptions were updated.

No queue records or decisions were changed. No database, schema, trust allowlist, AI source-discovery, production or config changes were made.

## Architecture, scope and trust

The existing claim row and `source_refs` remain the single source of truth; the current review page, API and store were extended. No parallel state or workflow was created. The scope is locked to filtering only. Rollback tag: `rollback/KNOW3-uncited-claim-filter-20261105` at `3467abad4eca8d82ffc52756fee13874e389597f`; pre-edit snapshots and hashes of the already-dirty overlapping server files are in `G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3_UNCITED_CLAIM_FILTER_20261105\manifest.json`.


The current validator allowlist in `shared/knowledge/evidence.ts` includes NHS, UK Government, EFSA, European Commission/EUR-Lex, NIH ODS and British Nutrition Foundation. USDA FoodData Central and Health Canada's Canadian Nutrient File are not in that list. These authorities have distinct roles: USDA/CNF composition; NHS/NIH nutrient and health information; EU Commission register authorized claim wording and conditions. No broad “official site” trust rule was added. See the investigation report below for current counts and official source references.

## Verification and limitations

- `npm run build`: passed.
- `git diff --check` passed on implementation, Product Knowledge and investigation files. The shared `.engineering/session/CURRENT.md` is already dirty with many unrelated session rows; its existing CRLF/trailing-whitespace diff was preserved rather than normalized.
- Browser showed the three filter options. The signed-in current API ignored `sourceStatus=missing` (returned cited rows too) and omitted the new paging metadata; the local server process predates the server route changes.
- The current server was not restarted. `server/index.ts` runs migrations and synchronizes missing pantry defaults at startup, so a restart could write to the configured development database. Restart authorization and runtime verification remain pending.
- Read-only live summary: 3,315 pending claims, of which 3,299 lack citations: composition 1,902 total (1 cited, 1,901 missing); direct food-benefit 1,366 (all missing); nutrient-benefit 47 (15 cited, 32 missing). These are claim links, not unique foods. 21 nutrient-benefit claims are already approved.
- A read-only query confirms some benefit evidence exists. Semantic fit still needs review; for example the cited authorized statements “normal muscle function” and “maintenance of muscle mass” do not exactly state “muscle recovery”.
- `.engineering/scripts/engineering-verify.sh` could not start because WSL Bash returned Access Denied.
- Investigation and official-source role analysis: `docs/investigations/knowledge/KNOW3_QUEUE_VISIBILITY_AND_EVIDENCE_REVIEW_20261105.md`.
- `.engineering/scripts/engineering-verify.sh` could not start because WSL Bash returned Access Denied.
- The worktree remains uncommitted. Project governance requires explicit owner authorization to commit, while Engineering Workflow Step 9 mandates a local commit; no commit was made pending resolution.
- No DB/live service/config/scheduled task was changed. Only `npm run build` ran; no automated test suite was run.

## Changed paths

`client/src/pages/admin-knowledge-claims-page.tsx`; `server/routes.ts`; `server/lib/knowledge-claim-review-store.ts`; `docs/product/surfaces/admin/adm-knowledge-claims.md`; `docs/product/structure/pages/page-admin-knowledge-claims.md`; `.engineering/session/runs/KNOW3_UNCITED_CLAIM_FILTER_20261105.md`; `.engineering/session/CURRENT.md`; `docs/investigations/knowledge/KNOW3_QUEUE_VISIBILITY_AND_EVIDENCE_REVIEW_20261105.md`.
