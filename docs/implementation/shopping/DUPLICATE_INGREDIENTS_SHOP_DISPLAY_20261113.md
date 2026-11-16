# Shopping Workspace Duplicate Ingredient Display

- **Date:** 2026-11-13
- **Repository / branch:** `tha-integrated-dev-g-native-20261003` / `feat/integrated-dev`
- **Scope:** Shopping workspace shop-stage display of repeated normalized ingredient identities.
- **Risk:** Amber — shopping workflow presentation and action behavior.
- **Approval:** Direct user instruction; user clarified the behavior should cover any duplicated ingredient, not only green olives, and selected converting/summing amounts.

## Governance and architecture

- **Verified:** Repository `AGENTS.md` and `PROJECT_GOVERNANCE.md` govern this dev branch; standing dev authority and the existing session record authorize implementation. Repository is on `feat/integrated-dev`, HEAD `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- **Verified:** `docs/architecture/README.md` is the architecture entry point. `docs/product/structure/domains/dom-shopping.md` identifies Shopping as owner of the single household shopping list and `client/src/pages/shopping-workspace-page.tsx` as its current workspace interface. `docs/product/structure/pages/page-shopping-workspace.md` describes planned ingredients revealing their meals.
- **Verified:** Existing ingredient normalization and quantity consolidation are upstream of the view; the UI grouping is derived from existing `normalizedName` and shopping item records. No persistence model or database writer was changed.
- **Inferred:** Grouping on the current normalized identity reuses the existing owner and adds no second ingredient identity or list state.
- **Architecture compliance:** One Shopping owner remains; no duplicate stored state, workflow, schema, or API was introduced; the existing Shopping Workspace was extended.
- **Data impact:** Read existing rows only. No persisted values changed; no migration or backfill.
- **Trust check:** The highest-risk claim still inferred is that every item reaching this page has an adequately populated `normalizedName`; fallback grouping uses `productName` when it is absent.

## Changes

- Updated `client/src/pages/shopping-workspace-page.tsx` so Shop mode renders one row per normalized ingredient identity.
- Same-unit quantities are summed. Existing `quantityInGrams` values are summed when all grouped rows have compatible gram/ml measures. Other distinct measures remain visible together in one quantity chip rather than being silently converted with an unsupported density.
- Checking or changing shop status fans the action out to all underlying rows. Recipe context merges meal attribution across those rows. Price display is suppressed for grouped rows because the individual matched price is not a valid group total.
- No schema, API, database, configuration, live service, or production data changes.

## Verification

- **Typecheck:** `npm run typecheck` failed with errors in files outside the changed page; this follow-up did not modify those files. Reported examples include missing `Button` variants in `client/src/components/plan-to-shopping-review-dialog.tsx` and `client/src/pages/admin-knowledge-claims-page.tsx`, plus type errors in existing server scripts/tests. No typecheck diagnostic referenced `client/src/pages/shopping-workspace-page.tsx`.
- **Interaction/runtime verification:** Not run in this follow-up. The UI behavior is supported by the derived grouping and fan-out handlers described above, but browser acceptance remains unverified.
- **Regression check:** No database or server behavior changed. Existing working tree modifications from the prior recipe-context task and other work were preserved.

## Rollback and scope lock

- Rollback tag: `rollback/shopping-duplicate-ingredients-20261113` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- The modified shopping page had pre-existing uncommitted recipe-context work. A byte-exact pre-edit copy was saved to `%TEMP%\tha-shopping-workspace-page-before-duplicate-fix.tsx` with SHA-256 `6E559D385831080D2AC15BF739AFE42E7E1C744C325AF2F5D503D587710C2A39`; the original dirty state remains preserved in the working file.
- Scope is limited to Shop-mode deduped presentation. Incompatible measures are shown together and preserved; no guessed density was added. Runtime/browser verification is the remaining acceptance gap.

## User acceptance evidence

- Starting page: `/shopping-workspace?stage=shop&source=planned` (as shown in the supplied screenshot).
- Expected: repeated normalized ingredients appear once; compatible amounts total in that row; unsupported cross-unit measures remain legible together; changing shop status applies to all source rows.
- Not verified in a live browser during this follow-up.

## SUGGESTIONS

- After repository-wide typecheck blockers are resolved, run browser acceptance against the supplied planned-meals scenario and check mixed shop-status duplicates.

