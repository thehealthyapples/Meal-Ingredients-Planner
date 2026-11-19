# CMP evidence distinction — implementation report — 19 November 2026

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** `feat/integrated-dev`
- **Base HEAD:** `047fc302991bf42d8b327064ecf0770bc8ebdb84`
- **Pre-change status:** 53 pre-existing modified/untracked entries at preflight. Two additional unrelated benchmark artifacts appeared during the task and were preserved; 55 unrelated entries remain. The comparison page component, route shell, Home page and page record were clean at preflight.
- **User request:** continue the first unfinished comparison enhancement—distinguish missing competitor data from features not reported by reviewed sources.
- **Governing sources read:** workspace `G:\The Healthy Apples\AGENTS.md` supplied in this conversation; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`.
- **Task sources inspected:** `client/src/pages/features-compare-page.tsx`; `client/src/App.tsx`; `client/src/pages/home-page.tsx`; `docs/product/structure/pages/page-features-compare.md`; `docs/investigations/ux/THA_COMPARISON_ENHANCEMENT_PRIORITIES_2026-11-19.md`.
- **Authorised scope:** distinguish explicit unknown evidence from missing cells; keep traffic-light meanings; restore the documented public routes and Home link because the component was unrouted and absent from the build; update page documentation and reports.
- **Non-goals:** re-rate competitors, assert new No findings, re-review all sources, create persistence/schema/API, alter aggregate scoring, push or deploy.
- **Architecture:** no governing conflict. A verified implementation/census drift existed: the product page record documented a public route and Home link, but `App.tsx` did not import/register the page and Home had no link. The build excluded the page. The change restores the registered public page and its existing canonical owner.
- **Risk:** 🟡 AMBER — public route/discoverability and evidence-detail behavior.
- **Implementation permitted:** YES under standing development-branch authority on `feat/integrated-dev`.

## Rollback Information

- Annotated tag: `rollback/CMP-evidence-verification-distinction-20261119` → `047fc302991bf42d8b327064ecf0770bc8ebdb84`.
- The tag protects committed state only. The 53 pre-existing worktree entries were not captured or altered.
- Revert the task commit to restore the previous source and page documentation; do not reset over unrelated work.

## Changes and Definition of Done

- Explicit unknown records mean **Not reported in reviewed sources**. Missing app/task entries mean **Not assessed yet**. Both remain grey **Not verified** and their detail explicitly says neither proves absence.
- Existing Yes, Some limits and No states, colors, sorting, and overall comparison remain unchanged.
- The existing page component is lazy-loaded at `/features-and-compare` and alias `/features&compare`; the page remains public and outside `ProtectedRoute`.
- Added **Compare apps** to the existing Home header, pointing to the canonical route.
- Updated `docs/product/structure/pages/page-features-compare.md` to version 5 and updated internal priority/investigation notes.

## Architecture Compliance

- **Verified:** one comparison page/data owner remains `client/src/pages/features-compare-page.tsx`; both routes reference that component. Home provides navigation only; it owns no comparison facts.
- **Verified:** no duplicate store, runtime persistence, new service, schema, data writer or score was introduced.
- **Verified:** Product page census aligns with route and Home navigation after this change.
- **Data impact:** reads existing static evidence; no runtime writes, backfill or changed competitor ratings.
- **AI compliance:** not applicable.

## Trust and User Acceptance

- **Verified baseline:** 21 competitors × 30 tasks = 630 cells: 102 Yes, 14 Some limits, 21 explicit unknown entries, zero competitor No entries, and 493 omitted entries. Missing entries formerly inherited the same note as reviewed unknowns.
- **Trust rule:** no source mention does not become No. Red remains reserved for evidence confirming absence.
- Start at Home and select **Compare apps**, or directly visit either route. Expected: public comparison renders. Select a grey dot for an explicit unknown and one for a missing app/task record; both stay grey while details distinguish “Not reported in reviewed sources” from “Not assessed yet.”
- **Experience check:** resolves the documented public page and improves comparison clarity. It adds one top-level link using existing Button styling; it adds no score or competing visual system.

## Verification and Scope

- `npm run build` — pending after final route/source edits.
- Verify the built page chunk exists and contains both unknown reasons; confirm old unknown fallback text is absent.
- `git diff --check` — pending.
- Automated tests not run (not requested). Browser verification not performed; local runtime is not identified as this repository and was not restarted.
- Included: evidence reason distinction, route/alias, Home link, page record, internal audit and required reports.
- Excluded: per-cell source re-review, new competitor ratings, deployment/promotion.
- Rollback/session record: `.engineering/session/runs/CMP_EVIDENCE_STATUS_DISTINCTION_20261119.md`.
