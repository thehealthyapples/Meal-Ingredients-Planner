# Comparison priority row order — implementation report — 19 November 2026

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** `feat/integrated-dev`
- **Base HEAD:** `b45dd061ff71c45a36aece6bd306f6493dcf7770`
- **Git status:** unrelated existing changes present in `client/src/App.tsx`, `client/src/pages/home-page.tsx`, server conversation files and other report/inventory artifacts. The comparison page was clean at base. Preserved all unrelated state.
- **User request:** When a comparison priority is selected, move it to the top of the table.
- **Governing files read:** `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`, and the THA operating-model skill.
- **Inspected:** current comparison page component and its priority controls, current running page, local and served production bundles, dev route and page asset.
- **Authorized scope:** reorder feature rows so selected topics appear before unselected topics; update the explanatory line. No other behavior changes.
- **Non-goals:** no competitor data changes; no new features, storage, API, schema, AI behavior, global component, design token, route, migration, push, deployment, or promotion.
- **Architecture conflicts:** NONE. Page presentation remains at the existing experience/UI layer and does not change canonical data or business workflows.
- **Risk:** AMBER — selected priorities change visible grid ordering.
- **Experience Constitution Check:** hospitality trade-off not needed; outcome is quicker access to household priorities and more confidence in comparison; no added page weight; no coaching language; ownership is static comparison UI; household retains which priorities to select; no overall app winner or added score; presentation changes only, under the Experience/UI owners already governing this page.
- **Architecture compliance:** Verified existing `selectedTopics` state remains the sole owner for selected comparison criteria. The new `visibleTopics` array is a derived presentation projection; it adds no duplicate state or workflow and preserves original relative order within both selected and unselected groups.
- **AI compliance:** not applicable; no AI behavior touched.
- **Implementation permitted:** YES — standing dev-branch authority in `PROJECT_GOVERNANCE.md`; direct user instruction scopes this UI behavior.

## Change and definition of done

In `client/src/pages/features-compare-page.tsx`, selected topic rows now render first. Selected and unselected groups each retain their existing canonical order. The supporting explanation says priorities move to the top and app columns rank by documented support, with unknown cells remaining neutral. Clearing priorities restores the original row and column orders.

Definition of done: selecting a topic visibly moves the row to the table's top, identifies it as Priority, keeps other rows stable, and clearing priorities restores the original ordering.

## Verification and user acceptance

- `npm run build` — passed. Existing caniuse-lite/PostCSS and eight esbuild CJS/import.meta warnings remain non-fatal.
- Browser page: `http://127.0.0.1:5001/features-and-compare`.
- After the initial reload showed a stale built asset, rebuilt the current repository and hard-refreshed the browser. Verified clicking **Weekly intake** moves **Review nutrient intake totals across diary days** above **Coordinate meals for several eaters**, marks it Priority, and shows the revised explanatory note. The browser was served the repository's rebuilt `features-compare-page-FTd2FCtj.js` asset.
- No automated tests were run.

## Data, trust, rollback and release

- **Data impact:** none; selected priorities stay in existing component state only.
- **Trust:** visual behavior and source were verified in the running page. Highest-risk uncertainty: none material; the priority ordering itself is deterministic.
- **Rollback:** annotated pre-edit tag `rollback/ux-features-compare-priority-20261119` points to `b45dd061ff71c45a36aece6bd306f6493dcf7770`. Revert the task-specific commit to restore the prior row order.
- **Commit:** authorized local commit; no push, deployment, or promotion.
- **Acceptance evidence:** on `/features-and-compare`, click any priority chip; it moves above unselected rows and is marked Priority. Click Clear priorities; the original ordering returns.

## SUGGESTIONS

None in this scope.
