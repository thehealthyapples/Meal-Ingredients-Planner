# PLNUI3 — Planner mobile image adoption

**Date:** 2026-10-26  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / base:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** 🔴 RED — exact visual exception to the governing Planner direction, explicitly authorized by Colin, Governance Owner (`tha-governance-owner-001`).  
**Rollback:** `rollback/planner-mobile-image-adoption-20261026` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89` (committed baseline only; pre-existing dirty files separately preserved).  
**Pre-existing status:** 22 dirty entries; no unrelated files were reset, stashed, committed, or overwritten.

## Scope and approval

Adopt the user-approved portrait Planner image for mobile widths only. Keep the currently accepted image as the source for wider viewports. Record the approved, exact-byte exception in the governing Blueprint. Colin explicitly approved using this image and recording the exception on 2026-10-26.

Excluded: laptop/desktop image changes, Planner grid or layout changes, interaction/business logic, data, deployment, and promotion.

## Changes made

- Added `client/public/images/planner/PLANNER_MOBILE_PORTRAIT.png` from the user-approved candidate. SHA-256: `7D2C5EE3D7016A291134F3B7DD3CFF7F5FF350CEE882038709BD60DDFEE8FBCD`.
- Updated `client/src/pages/weekly-planner-page.tsx` to use a `<picture>` source at `max-width: 767px`; the existing accepted `PLANNER_TARGET_BLANK_ACCEPTED.png` remains the default for wider screens.
- Added an exact-byte, Planner-mobile-only exception note to `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`. It is limited to this image and surface; the E1 orchard exposure rule remains unchanged.
- Started engineering session `PLNMOB1_Planner_Mobile_Image_20261026` using the rollback tag above. Snapshot copies of the pre-existing Planner source and session dashboard are at `G:\The Healthy Apples\Incoming\Rollback Evidence\planner-mobile-image-adoption-2026-10-26\`.

## Architecture compliance

- **Verified:** Planner state and identity remain owned by Domain 14 (`docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, Domain 14); no planner data, date semantics, or services changed.
- **Verified:** this is a viewport-selected asset for the existing Planner photo element, not a second planner state, workflow, or image-driven fact.
- **Approved exception:** the candidate's kitchen photograph is a scoped exception to `THA_EXPERIENCE_BLUEPRINT.md` §16 for this exact mobile asset. The exception is recorded in that governing file with the asset checksum and approver. Blueprint §6 E1's orchard exposure meaning is unchanged.
- **Experience Constitution Check:** hospitality and welcome are supported by retaining the accepted setting; outcome is a more fitting mobile composition; no controls, voice, household facts, or agency changed; the asset is static and decorative; the exact exception is explicit rather than silent.
- **Product Registry:** NO. The Planner page, purpose, and capabilities are unchanged.
- **Adoption Register:** NO component, hook, token, utility class, or shared pattern was introduced or retired. The existing Planner photo element now has a mobile source.
- **AI compliance:** N/A; no AI, capability, prompt, or conversation behavior changed.

## Definition of done and checks

- At viewport widths up to 767 CSS pixels, the browser selects the approved portrait mobile image.
- At widths above 767 CSS pixels, the current accepted image remains selected.
- The image is decorative (`alt=""`, `aria-hidden="true"`) and adds no textual claim.
- Candidate and production image SHA-256 match; the production build copied the image and the compiled Planner bundle contains one reference to it.
- `npm run build`: **PASS**. Existing warnings reported for stale Browserslist data, PostCSS `from`, large chunks, and `import.meta` in CJS server output.
- `npm run typecheck`: **FAIL**, with diagnostics in pre-existing `server/scripts/*` and `server/tests/*` files (missing schema `categories`, intent/type fixtures, etc.); none point to the Planner page or the changed visual asset. Typecheck was not modified.
- `git diff --check` on the entire tree reports existing trailing whitespace in pre-existing `PROJECT_GOVERNANCE.md` changes. The task's changed source/Blueprint files have no whitespace errors.
- No automated tests or browser viewport exercise were run. Manual acceptance step: open `/planner` at ≤767px and confirm the portrait board fits the paper; open at >767px and confirm the existing landscape composition remains.

## Data impact

- Reads existing data: NO (image selection depends only on viewport width).
- Writes new data: NO.
- Changes meaning of existing data: NO.
- Requires backfill: NO.

## Trust check

The image is decorative and carries no planner or food facts. It cannot change planner contents. Its approved bytes are checksum-recorded. Highest-risk claim: the recorded single-asset exception matches the user's approved image; verified by the exact candidate checksum and matching production copy.

## Rollback plan

- Remove the `<source>` element and `<picture>` wrapper, restoring the original `<img>` block only; do not restore the whole `weekly-planner-page.tsx` from Git because it contains pre-existing work.
- Delete `client/public/images/planner/PLANNER_MOBILE_PORTRAIT.png` and remove the matching exception paragraph from `THA_EXPERIENCE_BLUEPRINT.md`.
- Keep and inspect rollback tag `rollback/planner-mobile-image-adoption-20261026`; it does not restore pre-existing working-tree changes.
- Verify the original default source is the sole Planner photo source and the prior image hashes are unchanged.

## Data-domain convergence

Not applicable to presentation-only asset selection. Planner State remains on its one existing canonical owner. No duplicate state, owner, or workflow was introduced.

## Release and deployment

Dev branch only. No commit, push, promotion, deployment, schema migration, or live-service change. Any promotion requires separate owner approval and a fresh release verification.

## Completion

- Architecture: **YES for the scoped exception**, recorded in the owning Blueprint.
- Engineering: **YES** for source integration and successful build; repository-wide typecheck remains blocked by unrelated existing errors.
- Interaction: **N/A**; no interaction changed.
- Existing assets used: current Planner photo as wider-viewport fallback; approved mobile candidate as the ≤767px variant.
- New asset: the mobile PNG listed above.
- Remaining gap: manual viewport acceptance in the running app has not been observed.
- Stop test: no other mobile-image implementation work remains within the approved scope. Other device variants remain outside this task.
- **SUGGESTIONS:** review the laptop/desktop candidates as separate approved assets before wiring them into additional media ranges.

## Initial desktop image and responsive layout update (2026-10-26)

Colin approved the exact full-frame widescreen desktop image. Added `client/public/images/planner/PLANNER_DESKTOP_WIDE.png` (SHA-256 `E1AA0C45E7E55455590FA719A36131B8272A79A1C1879D8ABCACBA075C22BA11`). The `<picture>` now selects it at ≥1024px, keeps the portrait mobile image at ≤767px, and retains the previously accepted image as the 768–1023px fallback. The desktop stage uses a 16:9 frame and the desktop grid no longer imposes a 900px minimum width, allowing the seven day columns to share the paper area. The documented exact-byte exception now lists both approved assets.

Build: PASS; the compiled `dist/public/images/planner/` contains both variants. `npm run typecheck`: FAIL on existing server/scripts/tests diagnostics; no Planner-file diagnostic was reported. Scoped `git diff --check` found no whitespace issue in the three changed source/governance files (Git emitted only line-ending/config-ignore warnings). Existing 22 dirty entries were preserved; the task also adds its own assets and documentation.

Live visual validation could not be completed: the Edge window capture timed out. The screenshot supplied by Colin remains the before-state; the updated layout still needs visual review at desktop width. No commit, push, deploy, service, database, or configuration change.

## Superseded desktop gutter adjustment (2026-10-26)

Colin's latest screenshot confirmed that the larger board helped but felt too edge-to-edge. Added a desktop-only 94% width/height layout inset, centered within the available Planner surface. This preserves the 16:9 stage and board/grid proportions while leaving a consistent visible frame around the scene. `npm run build`: PASS; pre-existing Browserslist/PostCSS/CJS warnings remain. Scoped `git diff --check`: PASS (line-ending warning only). Live screenshot capture is still unavailable, so please review the new gutter in the browser. No services, data, configuration, deployment, commit, or push were touched.

## Desktop board dominant image adoption (2026-10-26)

### Governance preflight receipt

- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`.
- Worktree/branch: `feat/integrated-dev`.
- Base HEAD: `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.
- Existing Git status: 22 pre-existing dirty entries before this phase; preserved. New candidate and prior Planner edits remain uncommitted.
- User request: use the exact `PLANNER_DESKTOP_WIDE_BOARD_DOMINANT_CANDIDATE_20261026.png` candidate as the desktop Planner image.
- Mandatory/task governance read: root `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/change-control.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/OPERATING_MANUAL.md`; THA operating-model skill.
- Existing implementation inspected: `client/src/pages/weekly-planner-page.tsx`, `client/src/styles/planner-physical.css`, the supplied candidate and prior desktop/mobile assets, session run, repository branch/status, and rollback tag.
- Authorized scope: adopt the approved exact image at ≥1024px, calibrate desktop stage/header/grid overlays, record exact-byte exception, and document evidence.
- Non-goals: mobile/tablet asset behavior, planner business logic or data, services, database, app configuration, deployment, commit, push, or unrelated dirty files.
- Conflict/risk: the candidate added a new exact-byte image exception to Blueprint §16. Colin explicitly approved it. The governing Blueprint now records the exception and desktop-only breakpoint. Risk 🔴 (governance exception).
- Implementation permitted: YES for this scope under the user's direct instruction and dev-branch authority. No Gate 9/promotion requested.

### Changes and evidence

- Added `client/public/images/planner/PLANNER_DESKTOP_BOARD_DOMINANT.png`, copied from the user-approved candidate. SHA-256 `7143F9C957F4F716700AB5989A8985C5EE973A6A3F02E9256E09DC65B7614E0D`.
- `weekly-planner-page.tsx` selects it at ≥1024px. The portrait mobile image remains ≤767px; the existing accepted fallback remains 768–1023px.
- `planner-physical.css` now sizes the desktop stage to 1836:856, fills the available desktop surface edge to edge without stretching, and widens the header, empty guidance, and week-grid overlays to the candidate's larger paper. The existing overlay remains the sole owner of live planner data and controls.
- `THA_EXPERIENCE_BLUEPRINT.md` records Colin's exact-byte desktop approval, superseding the previous desktop composition only. E1 orchard exposure remains unchanged.
- Architecture compliance: **Verified** — Domain 14 in `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` remains the sole Planner state owner; this is presentation-only, adds no state/workflow/entity, and uses the existing Planner overlay. Only one desktop asset source is selected by viewport.
- Rollback: `rollback/planner-mobile-image-adoption-20261026` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89` protects committed baseline. Exact pre-change copies of the dirty TSX, CSS, Blueprint, implementation report, and session run are under `G:\The Healthy Apples\Incoming\Rollback Evidence\planner-mobile-image-adoption-2026-10-26\` with `.before-board-dominant-adoption` suffixes. No pre-existing work was reset, stashed, or overwritten.
- `npm run build`: **PASS**; expected existing Browserslist, PostCSS, chunk-size, and CJS `import.meta` warnings. New runtime asset in `dist/public/images/planner/` has the same SHA-256; compiled Planner bundle references it.
- Scoped `git diff --check`: **PASS** (line-ending warnings only). No tests requested or run.
- Manual browser acceptance: not confirmed; previous Edge screenshot capture timed out. Needs owner visual review of the overlay fit in the running Planner.
- Data impact: none. Trust check: asset is decorative; no text or planner facts in artwork; real planner content continues through existing grid.
- No live services, databases, schedules, or configuration touched. No commit, push, promotion, or deployment.

## Desktop zoom and overlap refinement (2026-10-26)

Colin asked for a slightly closer board view and no remaining overlap. Increased the desktop stage to a 1.06 proportional scale, so the photo and measured overlays zoom together. The workspace-open state disables this zoom so the utility rail keeps its reserved space. Separated the grid from the left-side diet/provision controls. Hid the duplicate floating empty-week card on desktop because the header's existing Plan action and clickable empty grid cells already provide the same path; mobile/tablet guidance remains unchanged. This does not alter planner data or behavior.

`npm run build`: PASS with the repository's existing Browserslist, PostCSS, chunk-size, and CJS `import.meta` warnings. `git diff --check` for the changed CSS: PASS with a line-ending warning. No automated tests run. Edge screenshot capture timed out, so the latest visual result still needs user review. Pre-refinement CSS/report snapshots are in the rollback evidence folder with `.before-zoom-overlap-refinement` suffixes.

## Screenshot-led clearance refinement (2026-10-26)

Colin's latest screenshot showed the household diets and weekly provisions controls extending over the meal-label column. Narrowed and inset those desktop controls into the left kitchen margin (12.5% width, 0.8% inset), leaving clear space before the grid. The desktop scene remains zoomed 6%; the desktop duplicate empty-week card remains hidden to avoid overlapping the header controls. Mobile/tablet behavior is unchanged. `npm run build`: PASS with existing warnings. Scoped diff check: PASS with line-ending warning. The running browser has not been visually recaptured; refresh and review the corrected spacing.

## Additional desktop zoom request (2026-10-26)

Colin requested a closer desktop view. Increased the proportional stage scale from 1.06 to 1.10; the image and every overlay remain attached and scale together, while opening the workspace disables the zoom. Snapshot of the prior CSS is in the rollback evidence folder as `client_src_styles_planner-physical.css.before-desktop-zoom-10pct`. `npm run build`: PASS with existing warnings; scoped diff check: PASS with line-ending warning. Live visual capture remains unavailable.

## Cookbook-style paper button polish (2026-10-26)

Colin requested paper-integrated Planner buttons similar to the Cookbook. Compared `client/src/components/cookbook-real-book/real-book.css` (printed controls use transparent backgrounds, no borders/cards, warm ink, and an inked focus treatment). Applied that language to the desktop Planner's Plan/Workspace/week/menu controls and grid add/copy/meal buttons; removed the Plan action group's pill outline, kept the week selector as a quiet paper rule, and preserved visible keyboard focus. Runtime handlers, targets, data, and mobile/tablet button styles are unchanged. `npm run build`: PASS with existing Browserslist, PostCSS, bundle-size, and CJS warnings. Scoped `git diff --check`: PASS with line-ending warnings. No automated tests run.

## All controls kept on the Planner paper (2026-10-26)

Colin's screenshot showed the header and household controls sitting over the wooden frame/meal labels. Moved the inline toolbar down to the paper's upper edge, hid the redundant visible “Planner” title, positioned household-diet and provisions controls side-by-side in the paper's top margin, and lowered/resized the grid to begin beneath them and finish within the paper. These controls now use the Cookbook-like warm-ink treatment. No planner actions or data changed; tablet/mobile layouts are unchanged. `npm run build`: PASS with existing warnings; scoped diff check: PASS with line-ending warnings. Manual browser capture remains unavailable, so visual acceptance is pending.
