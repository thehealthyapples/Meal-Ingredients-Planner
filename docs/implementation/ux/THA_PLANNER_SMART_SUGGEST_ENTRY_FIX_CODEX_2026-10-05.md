# THA Planner Smart Suggest Entry Fix

**Reviewer:** Codex  
**Date:** 2026-10-05  
**Classification:** Amber — user-facing layout repair with no application-data writes  
**Status:** Implemented and focused checks passed; normal entry verified live; generation result remains unresolved.

## Summary

The Smart Suggest controls changed Planner assistant state correctly. The visible no-op came from a CSS scope collision: the pre-existing uncommitted physical Planner stylesheet applied its full-viewport minimum height and clipping to every `[data-realm="planner"]` element. That included the Planner `WorkspaceHeader`, so it occupied 544px and pushed the actual Planner content and Smart panel below the 612px viewport. The repair scopes the visual treatment to the actual Planner content surface.

After the fix hot-reloaded in the existing browser, the header measured 94px at 898×612. Clicking **Plan my week** left the URL at `/planner` and opened the Smart preferences panel with its top at y=273. A single bounded **Propose My Plan** action again navigated to `/orchard` without showing a review, result, or visible error. That behavior remains unresolved. No Apply/Add, basket, nutrition analysis, import, planner-save, freezer, seed, reset, or account-switch action was used. The visible **Return to Admin** control restored `/admin/benchmark-households` successfully.

## Evidence and root cause

- **Verified, source:** `client/src/pages/weekly-planner-page.tsx` wires the header Plan action and empty-week **Plan my week** action to `setAssistantMode("smart")`.
- **Verified, source:** `client/src/components/PlannerAssistantPanel.tsx` renders `SmartContent` when mode is `smart`; the relevant Smart component is present in the current assistant panel. Planner context restores the Smart mode from local UI session state.
- **Verified, source:** `client/src/hooks/use-smart-suggest.ts` sends the proposal request to `POST /api/meal-plans/smart-suggest`. It separately uses `/api/smart-suggest/auto-import` and planner write routes for later import/apply actions.
- **Verified, source:** `server/routes.ts` handles `/api/meal-plans/smart-suggest` by reading profile/preferences, meals, eater and safety context, then generating and returning candidates. The handler contains no planner, basket, meal, or household persistence operation. Its service may make source lookups subject to the existing source gate. This was sufficient to classify one normal proposal attempt as the reviewed generation path; it does not establish that the request reached or completed on the server in this live check.
- **Verified, live:** browser tab began at `http://127.0.0.1:5001/planner` in an impersonated benchmark household session with the persistent **Return to Admin** control visible. The page heading was “Planner — The meals that bring our family together, every day.” Viewport was 898×612.
- **Verified, live:** before fix, the reported DOM geometry was WorkspaceHeader y=163, height=544, Planner surface y=708, assistant y=748. After CSS hot reload, WorkspaceHeader height was 94, Planner surface y=274, Smart panel y=360 on the initial page state. Clicking **Plan my week** opened the Smart panel at y=273 without navigation.
- **Verified, live:** after clicking **Propose My Plan** once, the app navigated to `/orchard`, showed “Your orchard is quiet” and no proposal/review or visible error. No further generation attempt was made. Because no network/server trace was captured, request receipt, server response and the cause of the Orchard navigation are **unverified**.
- **Verified, live:** clicking the visible **Return to Admin** control returned the session to `/admin/benchmark-households`.

## Change made

1. `client/src/pages/weekly-planner-page.tsx` — attached `planner-physical-surface` to the actual Planner content root. Existing household controls and proposal logic were not changed.
2. `client/src/styles/planner-physical.css` — narrowed root and descendant visual selectors to `.planner-physical-surface`, preventing full-viewport layout rules from matching the Planner header. The file was already untracked before this task; its pre-existing visual work and content were preserved.
3. `server/tests/test-planner-smart-suggest-entry-layout.ts` — added a focused source contract for the two Smart entry controls, assistant rendering, context mode and stylesheet scope.

No server logic, request wiring, authentication, safety enforcement, configuration, environment file, or application data was changed. Existing unrelated dirty and untracked files were preserved. No service was restarted.

## Verification

- `npx tsx server/tests/test-planner-smart-suggest-entry-layout.ts` — passed.
- `npx tsx server/tests/test-synthetic-review-ui-contract.ts` — passed (4 focused contracts covering the previous Return to Admin and read-only Preview repairs).
- `git diff --check -- client/src/pages/weekly-planner-page.tsx server/tests/test-planner-smart-suggest-entry-layout.ts` — passed. The untracked CSS file is not included by Git diff checks; it was reviewed in its working-tree state.
- Live HMR verification at 898×612 — passed for corrected header geometry and visible **Plan my week** → Smart preferences entry.
- Live Smart Suggest result — **not verified**. One proposal click landed at `/orchard`; no candidate review or explicit error was shown.
- Persistence impact — none observed; no user data changes were made. The proposal route is read-only by source inspection, but live server receipt/completion was not independently confirmed.

## Architecture and experience check

- **Verified principle/source:** `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2 requires hospitality, a named household outcome, no added room weight, household agency and implementation under its architecture owner. `docs/architecture/ENGINEERING_WORKFLOW.md` makes the Experience Constitution and experience/UI checklists mandatory for user-facing implementation.
- **Inferred outcome:** making the existing Smart entry visibly reachable reduces effort and supports confidence in a household planning decision. This patch adds no new panel, action, recommendation or state.
- **Verified principle/source:** the existing Planner controls preserve household agency; proposal and application remain separate actions in the client flow. The fix changes only where the existing physical surface styling applies.
- **Not claimed:** the live generation experience, dietary fulfilment, candidate safety or complete Smart Suggest journey is not certified by this layout check.

## Rollback and repository state

Repository status was inspected before modification. The checkout contained extensive dirty and untracked user work, including the Planner page and untracked physical Planner styles. No stage, commit, stash, reset, clean, branch switch, tag, or push was performed. The recorded HEAD reference is `8ce746c5ab2024b5e03a8129219bd80d98d02192`; it is not a rollback point for the existing working-tree changes. The project rollback-tag step was skipped because a tag cannot capture the dirty state and preserving it without staging/committing took precedence.

## Remaining limits and next safe step

The Smart panel is now reachable in the current session, but a candidate review was not observed. Next, capture a safe request/response trace for one normal **Propose My Plan** click in the approved DEV session, establish why it routes to `/orchard`, and fix only that confirmed cause. Until then, do not claim successful generation or resume synthetic diet-fulfilment testing. The session was returned to Admin. No milestone status, percentage or RAG was changed.
