# Adult nutrient reference review workbench — 2026-11-05

## Governance preflight receipt
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Worktree / branch: `feat/integrated-dev`
- Base HEAD: `3467abad4eca8d82ffc52756fee13874e389597f`
- Git status: 200 pre-existing modified/untracked entries at task start; preserved. Two dirty files that were edited (`client/src/App.tsx`, `server/routes.ts`) were snapshotted byte-exactly before edits.
- Request: break the review/use catch-22 so an owner can inspect and simulate adult nutrient reference methods and record a named review in Admin, without exposing unreviewed methods to Companion.
- Governance actually read: root `AGENTS.md`; `PROJECT_GOVERNANCE.md` mandatory bootstrap and dev-branch authority; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/change-control.md`; `docs/architecture/REPOSITORY_CONVENTIONS.md`.
- Task architecture/evidence read: `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §5.1; `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`; `docs/implementation/intelligence/ADULT_NUTRIENT_REFERENCE_METHODS_20261104.md`; `docs/implementation/intelligence/ADULT_REFERENCE_ENGINE_20261105.md`; `shared/knowledge/evidence.ts`; relevant admin routes and review store.
- Implementation/assets inspected: existing `/admin/knowledge-claims`, admin shell/navigation, assertAdmin API pattern, `knowledge_review_audit`, candidate method definitions and deterministic engine.
- Authorized scope: development-only Admin method review workbench, synthetic preview, named approve/reject append to the existing audit ledger, and reachability in Admin navigation.
- Non-goals: no Companion runtime activation, no profile/diary data read or persistence, no schema/migration, no trusted-domain expansion, no method edits or nutrient tables, no production/staging, no commit/push/deploy.
- Authority conflicts: NONE. Architecture permits method development but keeps runtime exposure behind ANR1 §5.1(7).
- Risk: RED subject area; implementation limited to review tooling and synthetic previews. Standing dev authority applies. Implementation permitted: YES.

## What changed
- Added `/admin/nutrient-reference-review`, reachable from the Admin Knowledge tools and Support Hub navigation.
- The page presents candidate formula, version, proposed age population, assumptions and source links. A reviewer can run a clearly labelled, synthetic example calculation using the same candidate coefficients. Inputs are sent only to an admin-only preview endpoint and are not read from or saved to a profile.
- Approval requires an authenticated, named Admin reviewer and explicit confirmations that they checked source, population, method, assumptions, and understand this does not activate Companion. Rejection requires a reason. Decisions append to the existing `knowledge_review_audit` ledger through the Nutrition Knowledge review store; no new table or second ledger was added. Review history is shown.
- Trusted-source policy is reused unchanged. The UK and EFSA candidates can be reviewed through this screen. The exercise-protein paper remains visibly blocked from approval because `link.springer.com` is not on the existing trusted-source list. No source-domain policy was widened.
- An editorial approval is not publication or runtime activation. The method candidate remains non-live; future runtime work must consume approved evidence through the existing platform and pass ANR1's separate access, independent numerical, Companion-seam, and Product Knowledge gates.

## Files changed
- `client/src/pages/admin-nutrient-reference-review-page.tsx` (new)
- `client/src/App.tsx`
- `client/src/components/admin-banner.tsx`
- `client/src/pages/admin-page.tsx`
- `server/routes.ts`
- `server/lib/knowledge-claim-review-store.ts`
- `server/intelligence/food-intelligence/nutrient-reference-engine.ts`
- `docs/implementation/intelligence/ADULT_REFERENCE_REVIEW_WORKBENCH_20261105.md` (this report)
- `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-05__adult-reference-review-workbench.md`
## Architecture and compliance
- Canonical method definitions remain in Nutrition Knowledge; derived arithmetic stays in the existing Food Intelligence engine; the single Companion, Capability Registry, Intent Engine and Context Composition are not bypassed or duplicated.
- The audit decision is an append-only record in the existing shared knowledge evidence ledger, attributed to the current authenticated user. No second reviewer identity is accepted from the client.
- Definition of done: Admin reviewer can inspect candidate/source context, run a non-personal sample, record a named decision, and see its audit history; the preview cannot satisfy the Companion review gate; untrusted candidate sources cannot be approved. Code was reviewed statically. No test suite or build was run in this task.
- Data impact: reads static candidate definitions and existing review audit rows; writes one audit row only when an Admin records a decision; changes no existing record meaning; no backfill/schema change.
- Trust: simulated values are marked unpublished and are not a personalized recommendation; no missing facts are inferred. Wrong source/method review can still produce an incorrect editorial decision, so the UI requires explicit source/population/formula/assumption confirmation and records reviewer identity. Companion remains blocked until a separately verified release.
- Scope lock honored: no unrelated worktree changes were removed or overwritten.

## Rollback and verification
- Rollback tag: `rollback/adult-reference-review-workbench-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`.
- Pre-existing dirty-file snapshots: `.engineering/session/rollback-evidence/ADULT_REFERENCE_REVIEW_20261105/App.tsx.prechange` SHA-256 `773A1D56E9DC58A89F23F5026E17A624AC76CA3D6EDC587B935AD9FB42544327`; `routes.ts.prechange` SHA-256 `57943643A5540AA5044484B734D470317DF4764E02AC17EBF68CA8FE2402621A`; `nutrient-reference-engine.ts.prechange` SHA-256 `842454274BD5398C04376F34D5EA70A5804F78C0FD34A2DACAC54F77CF193A53`.
- `git diff --check` was run; it reports trailing whitespace in the repository's pre-existing large changes, including `.engineering/session/CURRENT.md` and `PROJECT_GOVERNANCE.md`. No tests, build, live browser, DB mutation, or service restart was run. No approval row was written.
- Roll back only this task's hunks/new page/new route additions and restore the three snapshotted pre-task files as needed; do not reset the tree. The tag protects committed state only.
- No live service, database, scheduled task, or configuration was touched. No commit/push/deployment/promotion.

## Remaining boundary
The Admin review surface is in the development source. This task does not claim it is deployed or hot-reloaded in the running browser. Human review itself has not been performed. The exercise method is not approvable under the current source policy until its source domain is admitted through the governing source process.

