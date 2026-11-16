# Planner Meal Card Layout — Session Run — 2026-11-15

## THA Governance Preflight Receipt
- **Owning repository/area:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, Planner desktop grid and shared meal-card presentation.
- **Branch / HEAD:** `feat/integrated-dev` / `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- **Pre-change status:** 76 dirty paths. `client/src/components/PlannerMealCard.tsx` was already modified before this task; unrelated changes will be preserved. Rollback tag protects committed HEAD only.
- **Governing files read:** workspace `G:\The Healthy Apples\AGENTS.md`; repo `AGENTS.md`; `PROJECT_GOVERNANCE.md` current repository/root authorization sections; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/change-control.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` (§18.2); `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` (§18); `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md` (§6); `docs/architecture/THA_UI_ARCHITECTURE.md` (§§3–4, 9, 17–18); `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` (§19).
- **Evidence read:** `G:\The Healthy Apples\Incoming\Issue Screenshots\README.md`; populated and sparse screenshots named by the owner; current `/planner` browser state; `PlannerMealCard.tsx`, both usages in `weekly-planner-page.tsx`, and `planner-physical.css`.
- **Missing/conflicting authority:** NONE identified for this visual-only change. The repo's standing `feat/integrated-dev` dev authority applies; no promotion is authorized.
- **Risk / approval:** GREEN — visual presentation only, explicitly requested by the owner. No business behavior, data, or user workflow is changed.
- **Implementation permitted:** YES, under repo AGENTS.md's standing dev-branch authority.
- **Rollback tag:** `rollback/UX-planner-meal-card-layout-20261115` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20` (annotated; created before edits and reported to owner).
- **Session bootstrap limitation:** `.engineering/scripts/session-new.sh` could not be run because the Windows shell returned `Bash/E_ACCESSDENIED`. This receipt is being maintained directly; shared `CURRENT.md` is not modified by a failed bootstrap attempt.

## Experience Constitution Check — GEA §18.2
- **Hospitality:** all seven days remain visible together when space permits; the surface reads as a planner rather than a clipped board.
- **Outcome:** less cognitive load — the household can see the whole week without hunting for hidden days.
- **Weight:** no panel, control, or message is added; meal content is rearranged within the existing card. Desktop card height will be checked for spill/clipping.
- **Voice:** no copy or Companion voice is changed.
- **Ownership:** meal title/image remain the meal's existing data; no new statement or owner is introduced.
- **Agency:** all existing meal and planner actions remain available and unchanged.
- **Restraint:** use existing card and image treatment; no new decoration or motion.
- **Layer:** existing Planner card presentation implements the Experience Architecture and Calm Orchard UI rules; no architecture or durable product rule is introduced.

## Architecture / scope lock
- **Verified — canonical ownership:** Planner owns the grid; `PlannerMealCardContent` is the shared presentation for the mobile list and desktop grid. It is the only meal image/title presentation component found at the two call sites in `weekly-planner-page.tsx`.
- **Verified — no duplicate owner/state/workflow:** keep the current meal entity/image source, current component, and current interactions. Add no data, route, component, pattern, or state.
- **Product registry impact:** NO — the Planner's purpose or promise does not change.
- **Adoption register impact:** NO — no new building block/pattern is introduced; the existing card is being refined.
- **Scope:** presentation-only changes in `client/src/components/PlannerMealCard.tsx` and the existing desktop cell markup in `client/src/pages/weekly-planner-page.tsx`, plus prestate and required reports. The desktop grid stacks image above title and moves the existing single per-slot Add (+) control before the meal cards. The narrow mobile list keeps its side-by-side meal card and after-card Add control. No server/database/config changes.
- **Definition of done:** actual populated week verified at 1280 and 1440 widths; seven columns visible without truncation or, if width remains constrained, the scroll affordance and clipping are visibly clear; mobile list retains compact horizontal cards; meal detail/modal behavior remains unchanged; typecheck and relevant existing client checks recorded.
- **Data impact:** reads none; writes none; existing meaning unchanged; no migration/backfill.
- **Rollback:** restore only this task's class hunk in `PlannerMealCard.tsx` and Add button class hunk in `weekly-planner-page.tsx` using byte-exact snapshots in `.engineering/session/prestate/PLANNER_MEAL_CARD_LAYOUT_20261115/`; do not reset/revert unrelated dirty work. Tag is the committed-state anchor.
- **Trust check:** exact current branch/HEAD and UI measurements verified. Highest remaining uncertainty is whether reducing card intrinsic width alone is enough for all populated household data; browser checks at two desktop widths will decide.
- **Release/deployment:** dev branch only; no commit, push, or deployment.

## Work log
- Captured live populated week 9–15 November 2026 before change. At 1280 CSS px, the table's track list measured 1342px inside a 954px card viewport; Card has `overflow-hidden`, so the ancestor's `overflow-x-auto` sees no scroll width and cannot reveal the clipped columns. The photo/title row uses a fixed-width image plus title as a horizontal flex row, contributing to grid intrinsic minimum widths. The Planner surface itself also clips overflow.
- At 1440 CSS px, the actual visible page likewise shows only a partial Saturday column; Sunday is outside the visible board.
- A sparse-week reference exists for 16–22 November; compare in browser after safely selecting the adjacent week.
- Owner follow-up: the Add (+) control and meal status icon should precede each meal title. Verified the plus button adds to the cell's meal slot, while the cart icon reports that the meal is in the basket. Keep one Add action per slot; order it before the meal card, and keep each meal image/status icon above its title. Do not duplicate or change either action.

## Superseding refinement — 2026-11-15
The initial stacked desktop card treatment described above was visually wrong: it enlarged/cropped thumbnails and made populated rows spill vertically. It was replaced by the compact horizontal thumbnail/title arrangement and constrained grid tracks in `PLANNER_MEAL_CARD_LAYOUT_REFINEMENT_20261115.md`. That report is the current implementation status. The initial report remains as history of the first attempt.
