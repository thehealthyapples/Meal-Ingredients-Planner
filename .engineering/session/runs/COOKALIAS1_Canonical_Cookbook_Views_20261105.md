# COOKALIAS1 — Canonical Cookbook views

## Preflight receipt

- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch / HEAD: `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- Preflight worktree: 248 dirty entries; 260 after the task (+12). Several target files were already dirty. Pre-edit snapshots: `.engineering/session/rollback-evidence/COOKALIAS1_COOKBOOK_VIEW_CANONICALIZATION_20261105/`.
- User authorized route-pair convergence, preserving `/cookbook` and `/cookbook/grid`, and updating internal links.
- Risk: Amber. Architecture/gov conflict: none. Implementation permitted: YES under dev authority.
- Governing sources read: repo `AGENTS.md`, `PROJECT_GOVERNANCE.md`, architecture README/workflow, Core Principles, Source of Truth Register, GOV2, Meals Capability Card, Experience Architecture and §18.2 Constitution Check, Blueprint, Experience Language, UI Architecture, Product Knowledge Registry architecture, Operating Manual, rollback protocol, repository conventions, and product registry README/schema. Full paths are in the implementation report.

## Rollback

`rollback/COOKALIAS1-cookbook-view-canonicalization-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`.

## Result

`/cookbook` is the real-book view; `/cookbook/grid` is the grid view. `/cookbook/concept-real-book` redirects to `/cookbook`; `/meals` redirects to `/cookbook/grid`, preserving query strings. Internal links now use canonical URLs. Both views retain the shared `useMeals` data owner. Product registry and route docs now describe the two views.

## Verification

- Local browser: both aliases redirected to the intended retained views; `/meals?q=porridge` preserved the query.
- `npm run build`: passed with existing tool/chunk warnings.
- `npm run typecheck`: failed on 14 errors in unrelated server scripts/tests; no changed task file is named.
- Repository structure verifier: failed on existing root/doc filing and architecture-index issues; the new Cookbook implementation report is filed correctly.
- Product inventory verifier: 166 records; six unrelated failures and 193 warnings; no cookbook record failed.
- Tests not run. No user data was changed; browser inspection was read-only. No migration, provider, scheduled task, or config was touched.
- No commit/push/deploy. Commit requires explicit user authorization.

Implementation report: `docs/implementation/cookbook/COOKALIAS1_CANONICAL_COOKBOOK_VIEWS_20261105.md`.