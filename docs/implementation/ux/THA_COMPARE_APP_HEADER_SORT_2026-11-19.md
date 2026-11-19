# Competitor header sorting — implementation report — 19 November 2026

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** `feat/integrated-dev`
- **Base HEAD:** `66e7054bf7e6217a65a2e7e1730a3c9474d43b7e` (a separate TS-092 revert commit appeared after the prior comparison-page task; this task's rollback tag anchors that exact current HEAD)
- **Git status:** pre-existing unrelated modifications and untracked work remained in the working tree, including `client/src/App.tsx`, `client/src/pages/home-page.tsx`, server conversation-provider files/tests, benchmark history, and associated reports. The comparison page was clean at base. All unrelated state was preserved and excluded from this commit.
- **User request:** allow the user to select a competitor and order the matrix by what it supports; follow-up specifies clicking the competitor name in the table header rather than a dropdown.
- **Governing documents read:** `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`, and the THA operating-model skill.
- **Existing implementation inspected:** `client/src/pages/features-compare-page.tsx`, including selected-priority ordering, matrix header and evidence rows; the feature comparison page registry record; running page on port 5001 and current compiled assets.
- **Authorized scope:** clicking a competitor column heading selects it, groups its criteria by Yes → Some limits → No → Not verified, highlights its column, and clicking it again restores selected-priority order. Update the existing page record.
- **Non-goals:** no competitor feature/evidence changes; no new product capabilities, stored preference, API, schema, business workflow, route, global component/token, AI behavior, production data, deployment, push, or promotion.
- **Architecture conflict:** NONE. The change is presentation and local component state within the existing comparison page.
- **Risk:** AMBER — selection changes the visible matrix ordering.
- **Implementation permitted:** YES — application work is confined to the authorized dev branch under `PROJECT_GOVERNANCE.md`; direct user instructions define this scope.

## Experience and architecture compliance

- **Hospitality / outcome:** no welcome-versus-efficiency tradeoff; app-driven sorting reduces the effort to inspect one competitor and builds confidence in the comparison.
- **Weight / voice:** no extra panel or authored advice; the page reports evidence order and stays silent beyond that.
- **Ownership / agency:** the household chooses an app and retains all priority selections. No winner is declared and no user data is created.
- **Restraint / layer:** missing competitor evidence remains Not verified, not No. This realizes the existing page's evidence presentation under the experience and UI owners; no implementation-level rule or new shared design system is introduced.
- **Canonical identity/ownership:** `selectedComparatorId` and `selectedTopics` are ephemeral, local UI state. Derived rows and columns are projections from the static comparison data. No duplicate business entity, persisted state, service, or workflow is introduced.
- **AI compliance:** not applicable; no AI behavior changed.

## Implementation and definition of done

In `client/src/pages/features-compare-page.tsx`, each competitor name in the angled table header is now an accessible toggle button; the THA header remains a home link. Selecting a competitor orders features by Yes, Some limits, No, Not verified; selected priorities are highlighted within each evidence group. The selected competitor's column moves next to THA and is tinted. Clicking the active competitor again returns to priority-first ordering. The page registry describes the interaction.

Done when a competitor name selects it, the rows group in the stated evidence order, its column is visibly identified, selected priorities remain marked, and clicking the same name restores priority order.

## Verification and user acceptance

- `npm run build` passed. Existing stale caniuse-lite/PostCSS warnings and eight esbuild CJS/import.meta warnings remain non-fatal.
- Browser verification at `http://127.0.0.1:5001/features-and-compare`: selected **Samsung Food** from its table heading, verified all feature states group as Yes, Some limits, Not verified (there were no No entries for that app in the current evidence), and confirmed its Yes features lead the rows. Selected the same heading again with **Weekly intake** marked as a priority and verified “Review nutrient intake totals across diary days” returned to the first row.
- Automated test suite not run.

## Data, trust, rollback, release

- **Data impact:** none; selection is in-memory presentation state only.
- **Trust:** ordering uses the same existing evidence levels and does not alter the evidence. Highest uncertainty is competitor coverage/version freshness already stated on the comparison page.
- **Rollback:** annotated tag `rollback/ux-features-compare-app-sort-20261119` points to pre-edit HEAD `66e7054bf7e6217a65a2e7e1730a3c9474d43b7e`. Revert the scoped commit to restore the prior interface.
- **Scope lock:** only the comparison page and its page record were changed by this task; unrelated worktree state was untouched.
- **Release:** local commit only, authorized; no push or deployment.

## SUGGESTIONS

None in this change.
