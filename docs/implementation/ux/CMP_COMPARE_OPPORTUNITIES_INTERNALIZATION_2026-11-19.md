# Competitor opportunity cards — implementation report — 19 November 2026

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** integrated development worktree, `feat/integrated-dev`
- **Base HEAD:** `4224d8bb50bbcd71f996f424c085e55dcf772aa7`
- **Pre-change status:** 54 pre-existing modified/untracked entries. They were left untouched and excluded. A rollback tag protects committed state only.
- **Request:** prioritize comparison enhancements and start the highest priority; keep development ideas off the public website.
- **Governing files read:** workspace `G:\The Healthy Apples\AGENTS.md` supplied in the task; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/REPOSITORY_CONVENTIONS.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`.
- **Task sources inspected:** `client/src/pages/features-compare-page.tsx`; `docs/product/structure/pages/page-features-compare.md`; `docs/investigations/ux/THA_FOOD_APP_COMPARISON_CAPABILITY_AUDIT_2026-11-19.md`.
- **Scope:** remove development-only opportunity cards from the public comparison page; retain the ideas and prioritized next steps in internal investigation documentation; update the page census copy/version.
- **Non-goals:** alter the public evidence matrix or ratings, verify current competitor capabilities/popularity, change app behavior/data, introduce a score or roadmap commitment, push or deploy.
- **Risk:** 🟢 GREEN — presentation/content removal and internal documentation only.
- **Governance conflicts:** none identified. The internal note is a point-in-time investigation, not an amendment to the owner roadmap.
- **Implementation permitted:** YES under the repository's standing `feat/integrated-dev` development authority.

## Rollback Information

- **Annotated tag:** `rollback/CMP-internal-opportunities-20261119` → `4224d8bb50bbcd71f996f424c085e55dcf772aa7`.
- The tag protects committed history; the 54 pre-existing uncommitted entries remain outside that rollback point and were preserved.
- Revert the task's local commit to restore the public cards and prior documentation. Do not reset over unrelated work.

## Changes Made

- Removed the “Signals from the competitor review” section and its six exploratory opportunity cards from `client/src/pages/features-compare-page.tsx`.
- Updated `docs/product/structure/pages/page-features-compare.md` to version 4. It now says competitor development suggestions stay in internal planning notes.
- Added `docs/investigations/ux/THA_COMPARISON_ENHANCEMENT_PRIORITIES_2026-11-19.md` with a ranked internal agenda and current evidence baseline.
- The public table, colored evidence dots, evidence detail/source links, THA intro, and existing call to action remain.

## Architecture and Experience Compliance

- **Verified:** the comparison remains owned by its existing page source; the inventory/census documentation describes that page. No second capability or data owner was introduced.
- **Verified:** no runtime evidence data, persistence, API, database, AI reasoning, score, or duplicated workflow changed.
- **Verified:** the internal priorities note is under `docs/investigations/ux/` and is not imported or copied into the client bundle.
- **Experience check:** removing internal suggestions reduces public-page distraction and protects trust in the comparison. No new voice, action, score, or visual pattern was added. The family's decision agency and the evidence matrix remain intact.
- **Data impact:** no runtime reads/writes, no meaning change to competitor evidence, no backfill.
- **AI compliance:** not applicable.

## Definition of Done and Verification

- The six internal-only opportunity cards no longer appear in the public page source.
- The internal note records priority order, the evidence-data gap, and future benchmark/feature-review work.
- The production build succeeds.
- Built public assets were searched for the removed section title and card wording; no internal brainstorm wording was found. The repository structure checker could not run because `bash .engineering/scripts/repo-structure-verify.sh` returned Windows Bash `E_ACCESSDENIED`.
- `git diff --check` passes for task changes.
- Automated tests were not run (not requested).
- Live browser verification was not performed; the prior local page server was known to serve stale build output, and no server was restarted.

## Evidence baseline and trust

**Verified from the comparison component:** 21 competitors × 30 tasks = 630 cells; 137 explicit competitor-topic records (102 Yes, 14 Some limits, 21 explicitly unknown); 493 missing fields use a generic unknown fallback; no competitor record is marked confirmed No. The current data shape holds level, note, and optional URL, and can fall back to a general competitor URL.

**Inferred:** an internal per-claim evidence ledger is the best next investigation because current generic unknowns do not show whether a claim was never reviewed, omitted by official sources, ambiguous, or conflicting. Validate that design before any runtime change.

## Scope Lock and User Acceptance

- Included: remove public brainstorm cards, retain internal development priorities, update page census text/version.
- Excluded: competitor evidence changes, market ranking research, new capabilities, scoring, app behavior, schema, deployment or promotion.
- Acceptance path: open `/features-and-compare`; confirm the matrix/evidence key and THA call to action remain, with no “A few ideas THA could explore next” section. Select cells and confirm evidence details still operate as before.
- **Session record:** `.engineering/session/runs/CMP_COMPARE_INTERNALISATION_20261119.md`. The active dashboard was already modified by pre-existing work and is preserved without edits.
