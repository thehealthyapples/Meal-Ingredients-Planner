# PLNUI9 — Planner top line, grid and meal images

**Date:** 2026-10-26  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / base:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** 🟢 Green — presentation only; no data or workflow changes.  
**Rollback:** `rollback/planner-mobile-image-adoption-20261026` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.

## Scope and preflight

Respond to the 2026-10-26 Planner screenshot and request: move the weekly provisions control into the toolbar row by search; expand the table across more of the planner paper; render meal-row labels on the paper without a contrasting cell fill; ensure the family override control is not blurred; and show meal photos when the existing meal record has an image.

**Governing documents read for this workstream:** repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` including §18.2; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/standards/RISK_AND_SCOPE_STANDARD.md`; and `docs/change-control.md`.

**Verified pre-edit state:** branch `feat/integrated-dev`, HEAD `bffc533d65f58ae30c1faf7d3026b50dcc17be89`, 38 existing dirty status entries. Existing rollback tag resolves to that HEAD. Pre-edit snapshots for the four inspected files are under `.engineering/session/rollback-evidence/planner-followup-20261026/` with timestamp `20261026T213735`; source work already present before this change remains preserved.

Implementation permitted: **YES**, under the standing dev-branch authority. The governing Blueprint's exact approved desktop/mobile images and desktop breakpoint remain unchanged.

## Changes made

- `client/src/pages/weekly-planner-page.tsx`: moved the provisions affordance visually to the top toolbar by making it a compact labeled control beside the family icon and search; added explicit accessible expanded-state/name attributes; removed the solid fill from meal-row label cells. Existing drag/drop target and add/remove operations remain unchanged.
- `client/src/styles/planner-physical.css`: aligned provisions and search on the desktop top row; moved and enlarged the desktop meal grid; removed filters/opacity that could soften the family override button. Existing narrow/mobile behavior and desktop image breakpoint remain.
- `client/src/components/PlannerMealCard.tsx`: render an existing meal `imageUrl` as a small cropped thumbnail, with meal name retained as text. Failed image loads hide the thumbnail; meals with no image URL remain text-only. No generated or inferred photo is used.

## Architecture and experience compliance

- **Verified:** `imageUrl` is an existing Meal field in `shared/schema.ts`; the Planner consumes it and owns no copy of the image fact. `PlannerMealCardContent` is consumed only by the Planner page in its desktop and mobile renderings.
- **Verified:** Planner transactional state remains owned by the existing Planner State tables. No schema, persistence, duplicate data source, or add workflow was added.
- **Verified:** the exact-byte image approval and source breakpoint in `THA_EXPERIENCE_BLUEPRINT.md` were not changed.
- **Experience Constitution Check:** the top row makes planning controls easier to find and lowers confusion; the larger unshaded paper grid restores room to read and write; real existing meal photos make planned items easier to recognize; the change adds no separate panel or generated content and leaves household decisions with the household.

## Definition of done and verification

- **Build:** `npm run build` succeeded after these source changes. Existing warnings included stale Browserslist data, a PostCSS `from` notice, and four esbuild CJS/import.meta warnings.
- **Diff hygiene:** `git diff --check` for the three changed UI files passed (Git reported LF-to-CRLF conversion warnings).
- No tests added or run.
- Attempted live screenshot inspection through the Windows computer-use tool; window capture timed out twice. Accessibility inspection confirmed `/planner`, the seven weekdays, the two existing planned meals, and the existing household override control, but could not verify pixel positions. Colin must visually confirm the toolbar alignment and crop after the page refreshes.
- Manual acceptance: refresh `/planner` at desktop width; confirm Provisions is on the same row as search, all seven weekdays and meal rows occupy more of the paper, meal labels have no shaded background, family override icon is crisp and still opens on click, and meals with saved images show a thumbnail. Confirm meals without `imageUrl` still display their name and existing controls work.

## Data, trust, scope, rollback

- Data impact: reads the existing `Meal.imageUrl`; writes no data; changes no meaning; no backfill.
- Trust: renders only the image URL belonging to the existing meal record. Missing or broken images do not cause a substitute to be fabricated.
- Rollback exact pre-edit source bytes from the timestamped copies for `weekly-planner-page.tsx`, `planner-physical.css`, `PlannerMealCard.tsx`, and `workspace-header.tsx`. The rollback tag covers committed HEAD only and does not restore pre-existing dirty work.
- No live service, database, scheduled task, configuration, staging, or production state touched. No commit, push, deployment, migration, or promotion.
- Scope lock: three UI source files modified; the existing `workspace-header.tsx` was snapshotted but not changed. All pre-existing dirty work remains untouched.

## Product Knowledge and UI adoption

- Product Knowledge Registry impact: NO; this changes no product capability or data facts.
- UI adoption register impact: NO; no new shared building block or pattern introduced or retired.

## SUGGESTIONS

- Once the layout is visually accepted, review meal-card thumbnail size at the actual browser zoom level, especially for compact laptops and the mobile list.
