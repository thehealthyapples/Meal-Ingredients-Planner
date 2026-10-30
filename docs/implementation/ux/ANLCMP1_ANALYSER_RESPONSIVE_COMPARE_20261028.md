# ANLCMP1 — Analyser responsive product comparison

**Date:** 2026-10-28  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / base:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** Amber — modifies the existing comparison workflow.  
**Status:** Implemented in the working tree; not staged, committed, deployed, or promoted.

## Task and scope

Make the existing Analyser comparison easier to use on mobile, laptop, and desktop. Keep the first selected product as the reference; show one alternative at a time on mobile with swipe and previous/next controls; show the reference at the left of aligned comparison columns on larger screens.

The user approved this implementation in the current conversation. The authorized code scope is limited to the existing Analyser UI in `client/src/pages/products-page.tsx`; the implementation record is this report. No scoring behavior, product matching, backend, persistence, routes, pages, or shared UI blocks were added.

## Governance and authority read

Workspace and repository instructions read: `G:\The Healthy Apples\AGENTS.md`, `G:\The Healthy Apples\Infrastructure\AI Agent Bridge\AGENTS.md`, repository `AGENTS.md`, and `PROJECT_GOVERNANCE.md`.

Application governance and architecture read: `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`, `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `capabilities/analyser.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `docs/product/structure/pages/page-analyser.md`, and `docs/change-control.md`.

Operating model and implementation guidance read: `docs/ai-operating-model/README.md`, `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `.engineering/standards/RISK_AND_SCOPE_STANDARD.md`, `docs/architecture/REPOSITORY_CONVENTIONS.md`, and `docs/implementation/ux/ADOPTION_REGISTER.md`.

`CLAUDE.md` was checked and is absent. No unresolved authority conflict was identified for this scoped UI change. Standing development-branch authority in `PROJECT_GOVERNANCE.md` permits implementation on `feat/integrated-dev`; no Gate 9 execution authority was used.

## Experience Constitution Check

- **Hospitality:** Put the selected reference beside its alternatives and avoid forcing users to remember values across screens.
- **Outcome:** Help the household compare known product details with more confidence.
- **Weight:** Reuse the existing dialog, selected products, fields, and removal actions.
- **Voice:** Keep current factual labels and unknown states.
- **Ownership:** The Analyser page remains owner of transient comparison state and reads existing product data.
- **Agency:** The user selects and removes products; no product is automatically selected or called healthiest.
- **Restraint:** No new scoring, matching, storage, or workflow outside this comparison.
- **Layer:** Responsive presentation only, within the existing Experience/UI architecture.

The runtime remains E1. Orchard reflections and the “− Focus / + Room” controls remain concept-only and are not included.

## Changes

- Retained the existing 12 comparison fields and their current renderers: THA score, UPF score, NOVA group, additives, ultra-processed status, calories, protein, sugar, fat, salt, retailer, and ingredients.
- Desktop and laptop use an aligned comparison table. The first selected product is the reference column on the left; its product heading is compact. Other selected products appear in adjacent metric columns.
- Mobile shows the reference summary and one alternative at a time, with a position indicator, swipe navigation, and explicit Previous/Next buttons. It retains the same metrics in a compact paired layout.
- Kept the existing four-product selection cap and removal behavior. Removing the reference makes the next selected product the reference, consistent with first-selected ownership.
- Kept existing missing/unknown copy and the existing score/field calculations. No data is persisted by the mobile index; it is transient UI state.

## Architecture, registry, and adoption impact

- **Verified:** `docs/product/structure/pages/page-analyser.md` already states that Analyser results can be compared; this change refines that existing capability.
- **Verified:** No registry or adoption-register update was made. No new shared block or capability was introduced.
- **Verified:** Product identity and product analysis ownership remain with the existing product/Analyser data; the comparison dialog consumes those values and does not duplicate them.
- **Inferred:** A transient index for the currently visible mobile alternative does not create persistent or duplicated product state.

## Data, trust, and scope

- No schema, database, API, persistence, configuration, or live service was changed.
- No new health or “healthiest” conclusion was added. Existing comparison highlights and metric behavior are retained.
- No unrelated workspace files were intentionally edited. The pre-existing dirty work was preserved; the baseline contained 74 entries. This task adds the Analyser source change, this implementation report, and the session run record to the working tree.

## Definition of done and checks

- [x] Mobile reference/alternative comparison, swipe gesture, explicit controls, and position indicator are present.
- [x] Larger-screen aligned reference and alternative metric columns are present.
- [x] Existing selected-product limit, removal actions, fields, and unknown values are retained.
- [x] Runtime orchard watermark and focus/room toggle are absent.
- [x] `git diff --check -- client/src/pages/products-page.tsx` completed without whitespace errors.
- [ ] Manual acceptance remains for the owner: compare two to four products at mobile, laptop, and desktop widths; swipe and use both controls; remove the current alternative and the reference; verify unknown metric values remain explicit.

Automated tests and builds were not run, per task instruction. No user-acceptance evidence is claimed.

## Claude Bridge attempts

The user asked for Claude to build the change. The first Claude task, `aab-20261028090845-74416492`, failed with Bridge reason `scope_allowlist_exceeded`; it left the metric definitions and mobile state scaffold in the source. The Bridge report is `G:\The Healthy Apples\Incoming\Agent Reports\THA-AI-Agent-Bridge-aab-20261028090845-74416492-CLAUDE-2026-10-28.md`.

A second task, `aab-20261028091400-967f8b52`, used a two-file write scope and separate read-only context, then exited with `agent_failed` before editing. Its Bridge report is `G:\The Healthy Apples\Incoming\Agent Reports\THA-AI-Agent-Bridge-aab-20261028091400-967f8b52-CLAUDE-2026-10-28.md`.

To complete the user-approved scope, Codex finished the UI in the same Analyser page after reviewing both failed task reports and the working diff. No claim is made that Claude completed the implementation.

## Rollback, acceptance, and release

Rollback anchor: `rollback/ux-analyser-responsive-compare-20261028` points to base commit `bffc533d65f58ae30c1faf7d3026b50dcc17be89`. It anchors committed state only; it does not include the pre-existing dirty files. Preserve the current unrelated dirty work. To undo only this task, restore the Analyser page and remove this implementation report and its session record after confirming each exact path with the owner. Nothing was staged or committed, and no promotion or deployment occurred.

**Scope lock:** Existing Analyser comparison only.  
**User acceptance:** Pending manual review of the comparison layouts.  
**Assumptions:** Tailwind `md` is the project’s existing breakpoint for the wider aligned table; the same product data fields apply at each viewport.

## SUGGESTIONS

- Capture owner acceptance after the manual viewport and removal checks.
- Consider future auto-surfacing of healthier options only as a separate Amber decision with an explicit ranking/selection definition.

## Addendum — full-page scope clarification (2026-10-28)

After the comparison-only delivery, Colin clarified that the expected change covered the whole Analyser page. Scope was expanded to the existing `/analyser` route while preserving its workflows.

- Added a restrained Analyser realm-border around the route content using the existing `--realm-border` token; this provides the requested page frame without drawing the orchard.
- Changed recent-history and product results to a single responsive reading column so desktop, laptop, and mobile retain the same product hierarchy.
- Reduced result imagery from 80px to 64px and the THA rating mark from 34px to 30px; tightened the search controls to a 36px working height.
- Widened the product-detail dialog for desktop while keeping it viewport-bounded on mobile; the existing Analyser detail component still owns the data presentation.
- The earlier comparison behavior remains: first-selected reference, mobile alternative navigation, and aligned wider-screen metric columns.

The live page remains E1: there is no orchard image/reflection and no Focus/Room background toggle. Automatic healthiest-product ranking, scoring changes, and data/workflow changes remain outside scope. The full-page source was snapshotted before this expansion at `G:\The Healthy Apples\Incoming\Rollback Evidence\ANLCMP2-ANALYSER-FULL-PAGE-20261028\products-page.tsx.pre-full-page-refresh` (SHA-256 `2CCEBA0A5B6B563E0A92B69E76FC03ED1D754E7B3B567FDE58F6B6A65B4BE59C`). Existing rollback tag remains unchanged.

This expanded implementation is still in the development working tree only. It was not run in a local browser, committed, promoted, or deployed. Automated tests/build were not run. Owner visual acceptance across mobile, laptop, and desktop remains pending.
