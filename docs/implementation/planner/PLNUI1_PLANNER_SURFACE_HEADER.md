# Planner Surface Header Integration

**Date:** 2026-10-25  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / HEAD at start:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** 🟢 Green — visual layout and existing controls only  
**Rollback identifier:** `rollback/ux-planner-integrated-header-20261025` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Dirty-file snapshot:** `G:\The Healthy Apples\Incoming\Rollback Evidence\UX-Planner-Header-20261025\weekly-planner-page.tsx.pre-layout-change` (SHA-256 `5AF16D9C456965AD28FEAA7CBCA3FA6374C6D3347D8CD455C1FE577CD13FDB8F`)

## Governance preflight receipt

- **Repository / worktree:** Integrated development repository at the path above.
- **Branch / HEAD:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.
- **Starting status:** pre-existing changes in `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `client/src/pages/weekly-planner-page.tsx`; five untracked governance/investigation files. The Planner page already had a two-part edit: remove context-bar wrapping and the duplicate desktop basket action. That edit was preserved.
- **User request:** place the Planner date and its page information/controls on the Planner surface and remove the separate top page area.
- **Governance actually read:** workspace `G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`, `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `REPOSITORY_CONVENTIONS.md`; `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/ai-operating-model/README.md`, `principles.md`, `risk-and-approval.md`, `evidence-and-architecture.md`, `rollback-and-output.md`; and `docs/implementation/ux/ADOPTION_REGISTER.md`.
- **Implementation authority:** permitted by the standing development-branch authority for `feat/integrated-dev` in `PROJECT_GOVERNANCE.md`.
- **Architecture conflicts:** none found for moving the existing Planner header into its physical surface. The governing Household Time architecture owns calendar semantics; this change only relocates the existing selector and does not change or derive dates.
- **Explicit non-goals:** no Planner business behavior, data, time logic, search behavior, navigation, image asset, API, persistence, database, or release target changes.

## Experience Constitution Check (GEA §18.2)

- **Hospitality:** the kitchen Planner becomes the first visible surface; no separate arrival banner is in the way.
- **Outcome:** less to carry and more confidence about which week is shown because its existing date selector is on the Planner.
- **Weight:** no control or information was added; the same controls now occupy the Planner surface.
- **Voice:** the room reports its title and existing week facts; the Companion remains the advice owner.
- **Ownership / agency:** the existing Planner week data remains authoritative and the household retains its existing week and action controls.
- **Restraint:** no new workflow, state, alert, or engagement mechanism.
- **One Question:** the household sees the same trusted Planner facts with less space spent on the shell threshold.

## Changes made

- `client/src/components/layout/app-shell.tsx`: suppress the shared threshold and fallback header for the immersive Planner route.
- `client/src/components/workspace-header.tsx`: add an inline render mode and optional description while retaining page-header registration, so the shell fallback does not duplicate it.
- `client/src/pages/weekly-planner-page.tsx`: place the existing Planner header inside the photographed Planner surface, show the existing purpose line there, and retain the original uncommitted context-bar and duplicate-action edits.
- `client/src/styles/planner-physical.css`: let the Planner occupy the available room height, reserve a 112px toolbar area within the surface, and size the photo and measured grid beneath it.
- Existing image `client/public/images/planner/PLANNER_TARGET_BLANK_ACCEPTED.png` remains in place and unchanged.

## Architecture compliance

- **Verified:** Planner State remains Domain 14 with the existing owner; Household Time continues to own date/week semantics (`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, Domain 14; `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`).
- **Verified:** `AppShell` remains the shell owner and `WorkspaceHeader` remains the one shared header owner; the page uses its inline mode instead of creating another header (`THA_UI_ARCHITECTURE.md`, §17 Adoption Register).
- **Verified:** existing `activeWeek`, `weekLabel`, handlers, search callback, and action state are reused. No duplicate state, store, workflow, or authorization was added.
- **Verified:** no AI, Intelligence Platform, Capability Registry, Intent Engine, or data-access behavior changed.

## Definition of done and verification

- The title, description, week/date selector, search, Plan action, progress, and overflow menu render within the Planner surface.
- The standard Planner threshold and separate shell header stand down; the room and bottom navigation remain available.
- The physical image and grid remain paired, with the grid positioned relative to the photo area below the inline toolbar.
- `npm run typecheck` ran and failed on repository-wide TypeScript errors in unrelated server scripts/tests. A focused scan of the output found no diagnostics in the three changed TypeScript files.
- `npm run adoption:check` ran: 97 passed, 1 notice, 13 failed. Failures are the repository's wider recorded drift (including unrelated raw-button/mutation counts, owner floors, orphan files, and generated-register drift); no importer count changed in this work. `adoption:record` was not run because it would rewrite unrelated register state.
- No browser session was started, no live service or database was touched, and no runtime screenshot was available for visual acceptance.

## Product Registry and Adoption Register impact

- **Product Registry affected:** NO. The answer to “what is THA?” and the Planner's behavior/capabilities are unchanged.
- **Adoption Register affected:** NO owner or consumer was added, removed, or transferred. The existing Planner continues consuming `WorkspaceHeader`; its presentation mode is extended in place. The independent adoption check reports existing failures listed above.

## Data impact and trust check

- Reads existing data: YES (existing Planner week and meal state).
- Writes new data: NO.
- Changes meaning of existing data: NO.
- Backfill required: NO.
- No user fact or date is fabricated. The visible date continues to come from the existing dated week label; undated legacy weeks keep their existing representation.
- Canonical identity and ownership remain singular; no second source of truth or duplicated workflow was introduced.
- Highest-risk remaining inference: the screenshot's shell area is the primary source of wasted viewport height. This is supported by the existing DOM order and screenshot, but no live browser measurement was available.

## Rollback plan

- The annotated rollback tag anchors committed state only. The exact pre-change dirty Planner source was separately copied to the snapshot path above before editing.
- To restore the file's pre-change bytes, copy the snapshot back to `client/src/pages/weekly-planner-page.tsx`.
- To revert the committed baseline if needed, inspect `rollback/ux-planner-integrated-header-20261025` and restore the repository to its resolved commit only with owner approval; preserve all unrelated dirty files.
- No commit, push, deployment, migration, or promotion was performed.

## Scope lock and completion

- **Implemented:** inline Planner header/date/control placement, suppression of separate Planner threshold, and surface fill sizing.
- **Excluded:** control behavior changes, business logic, persistence, unrelated UI, register-wide cleanup, and promotion.
- **Architecture:** YES for this presentation change, under the cited owners.
- **Engineering:** PARTIAL — typecheck and adoption checks expose unrelated repository-wide failures; no browser visual acceptance was possible.
- **Interaction:** PARTIAL — existing control wiring is preserved in code; runtime interaction across input methods was not exercised.
- **Existing assets reused:** `AppShell`, `WorkspaceHeader`, Planner week/date state, existing Planner photo and measured grid.
- **New assets required:** NONE.
- **Remaining gap:** live browser confirmation of fit at desktop, tablet, and mobile sizes.
- **Stop test:** no remaining source change in the approved scope was left unapplied. Human visual acceptance remains outstanding.
- **SUGGESTIONS:** capture the integrated Planner in the normal dev browser and adjust the toolbar height only if the photographed board/grid alignment shows a mismatch.
