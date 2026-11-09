# PANTRY-FILL 2026-10-26 — responsive room sizing

## Task and authority

Owner request: ask Claude to make the Pantry room fill the available page more fully and accommodate screen sizes. Owning repository: `tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, base `bffc533d65f58ae30c1faf7d3026b50dcc17be89`. Risk: Green visual CSS. Implementation permitted: YES for this bounded developer-branch change under `PROJECT_GOVERNANCE.md` 2026-10-24 owner amendment. No missing or conflicting authority was found for this narrow change.

Read: workspace `G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`, `docs/architecture/LIVING_HOME_SPATIAL_BLUEPRINT.md`, and `docs/architecture/THA_UI_ARCHITECTURE.md`. The room plate must remain whole and proportional. A single 3:2 image cannot cover every viewport ratio edge to edge without cropping or distortion.

## Architecture Compliance

Verified: the existing room plate and its `.lh-stage` remain the only visual owner. The change adjusts one existing CSS sizing rule. No new state, workflow, service, owner, asset, route, or component was introduced. Existing percentage-positioned room objects and the bottom navigation remain consumers of the same stage and shell. The approved plate is not cropped or stretched. Exact all-screen edge coverage remains outside this change because it would require owner-approved alternative compositions or a change to the plate constraint.

## Definition of Done

The room should render at narrow widths and use available height on taller desktop viewports without the old 1120px ceiling. The room image must keep its 3:2 ratio, with no overlap with the bottom navigation. Manual check: open `/pantry` at narrow and wide viewport sizes and inspect the entire room, in-room controls, and nav. Narrow-view rendering was visually confirmed in the live in-app browser at approximately 433×612 after the correction. That view also exposed a pre-existing interaction gap: the tall "Around the pantry" control panel is clipped by the short room stage. Wide-view rendering has not been visually confirmed in the owner's browser; acceptance of that viewport remains open.

## Product Registry Impact

Registry affected: NO. Entries created, updated, retired: NONE. Visibility changes: N/A. Product knowledge in prompt/template/fallback: NO. The change does not alter what THA offers.

## Adoption Register Impact

Register affected: NO. Owners created or adopted, predecessors retired, rival ceilings raised, exemptions added: NONE. The existing `.lh-stage` rule was edited; no building block was added or retired. `npm run adoption:check` was not run because no register change was made and no test run was requested.

## Data Impact

Reads existing data: NO. Writes new data: NO. Changes meaning of data: NO. Backfill: NO.

## Trust Check

The same room photograph remains visible and proportional. No guessed data is presented. A layout regression would be visible and reversible; no canonical state or source of truth is affected. No architectural duplication introduced: YES. No new source of truth created: YES. Runtime presentation changes; application behavior and data do not.

## Rollback Plan

Rollback identifier: `rollback/pantry-room-responsive-fill-20261026` at `bffc533d65f58ae30c1faf7d3026b50dcc17be89`. The target CSS file was clean before work; unrelated pre-existing changes were left untouched. Restore only `client/src/pages/living-home-room.css` from the tag if the layout is rejected, then re-open `/pantry` at narrow and wide sizes. Remove this implementation report only as part of a separately approved rollback of this work.

## Scope Lock and changes made

Implemented: `client/src/pages/living-home-room.css` desktop `.lh-stage` height changed from `min(100%, 1120px)` to the smaller of available height and two thirds of the room container width; the room container now exposes its inline size to that calculation. Excluded: photograph replacement, crop, zoom, stretch, markup, routes, shell, navigation, application logic, and deployment. Suggestions: give the "Around the pantry" controls a separately approved small-screen layout; if the owner wants literal edge-to-edge coverage on portrait and ultrawide screens, commission approved aspect-specific room compositions and revisit the spatial blueprint deliberately.

## Checks and agent involvement

Claude Bridge task `aab-20261026071355-275159f5` timed out after writing a broader CSS proposal. Live narrow-view inspection showed the room collapsed; that proposal was rejected. A second, read-only direct Claude CLI pass proposed the bounded 1120px-cap removal used here. A browser CSS layout probe then showed that its unchanged `max-width` rule distorted the 3:2 stage in a narrow, tall desktop window; Codex added the container-width constraint. The probe gave a 1.5 width/height ratio at parent sizes 433×532, 1280×640, 900×1000, and 1920×1200. `git diff --check -- client/src/pages/living-home-room.css` found no whitespace errors. Live `/pantry` narrow-view screenshot showed the room again after correction. No automated test suite was run. The required repository-structure script was attempted with Git Bash; it reported existing root and loose-document layout failures unrelated to this new workstream-filed report. The script was stopped after its relevant checks. Global `git diff --check` reports trailing whitespace only in pre-existing `PROJECT_GOVERNANCE.md` changes, outside this task. No other existing tracked or untracked work was changed by this task.

## Architecture Convergence Status

N/A — Green visual adjustment, no architectural implementation.

## Implementation Completion Report

Architecture Complete: YES for the bounded CSS change. Engineering Complete: YES for the bounded CSS change. Interaction Complete: NO for the broader all-screen request; the small-screen area panel is clipped and needs separate responsive interaction design. Existing Assets Used: accepted 1536×1024 room plate. New Assets Required: NONE for this bounded change. Remaining Gaps: wide-view visual acceptance is unverified (verification gap; open the owner's target desktop viewport and inspect); small-screen panel accessibility needs approved layout work (UI gap). Literal full-bleed coverage of every aspect ratio is constrained by the one approved 3:2 composition (design/asset decision, not a model capability claim). Claude Bridge timeout was a tool execution failure; the failed draft was repaired and not treated as an architecture limitation.

Live services, databases, scheduled tasks, configuration, commits, pushes, and deployments touched: NONE. Local dev page was read for visual inspection only.
