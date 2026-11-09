# PLNUI4 — Planner paper toolbar alignment

**Date:** 2026-10-26  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / HEAD:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Risk:** 🟢 Green — desktop presentation and accessibility labeling; existing override click behavior retained.  
**Approval:** Colin's direct request in this conversation authorizes this scope.  
**Rollback:** `rollback/planner-mobile-image-adoption-20261026` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`; targeted pre-edit source copies are in `G:\The Healthy Apples\Incoming\Rollback Evidence\planner-mobile-image-adoption-2026-10-26\` with `.before-date-search-toolbar-reflow` suffixes.

## Scope and outcome

The desktop Planner's paper toolbar is arranged as requested: week/date controls are centered in the top paper margin; meal search sits centered beneath them; Plan sits at the right beneath Workspace and the overflow menu. The household override control is reduced to a family icon and, when overrides exist, a small count. Its existing one-click toggle still opens the current override selection panel.

No mobile or tablet layout, planner data, business rules, backend, or image asset was changed in this update.

## Governance preflight

- **Owning repo/area:** Integrated development repository, Planner UI.
- **Governing files read:** root `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/change-control.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/OPERATING_MANUAL.md`; `docs/ai-operating-model/README.md` and its applicable principles, risk/approval, and rollback/output files; THA operating-model skill. The governing entry points route to these files; no unresolved authority conflict was found for this visual follow-up.
- **Pre-change worktree:** 28 existing dirty entries were present; preserved. Current branch and HEAD match the recorded Planner rollback point.
- **Implementation permitted:** YES — direct owner request and the repository's `feat/integrated-dev` development authority. No Gate 9/promotion, commit, push, or deployment requested.
- **Risk and approval:** Green, scoped to desktop toolbar presentation and accessible names. The count reports existing override rows; no state or behavior is introduced.
- **Experience check:** The controls take less visual space and keep the planner week as the focus. The screen keeps the household's existing override choices and agency, with no change to voice, data ownership, or decision authority.
- **Architecture compliance — Verified:** Planner weeks, days, entries, and eater assignments remain owned by Domain 14 in `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; this change uses the existing Planner overlay and `weekOverrides` query. It adds no entity, state store, owner, workflow, or backend write path.

## Files changed

- `client/src/pages/weekly-planner-page.tsx` — desktop toolbar class; family icon/count and accessible button attributes; ID for the existing open override panel.
- `client/src/styles/planner-physical.css` — desktop-only positioning for date, search, actions, and household icon/count.

## Definition of done and verification

- Date selection centered on the paper's upper row; search underneath; Plan below the right-side Workspace/overflow controls.
- Household override shows family icon and optional compact count; one click keeps using `setWeekDietsOpen` to show/hide the existing selection panel.
- **Build:** `npm run build` passed. Existing Browserslist, PostCSS, chunk-size, and CJS `import.meta` warnings remain.
- **Whitespace:** scoped `git diff --check` passed (Git reported existing LF/CRLF normalization warnings).
- **Tests:** none added or run.
- **Starting page / acceptance:** `http://127.0.0.1:5001/planner`; expected arrangement is as above. Automated Edge window capture timed out, so screenshot-based visual acceptance is not confirmed in this run.
- **Data impact:** none; reads the current override count and existing week controls. No persistence semantics changed.
- **Trust check:** architecture ownership claim above is Verified against Domain 14. **Remaining uncertainty:** final pixel fit awaits visual review in the browser; build success alone does not prove overlap-free rendering at every desktop size.
- **Live operations:** no database, service, schedule, configuration, deployment, commit, or push touched.

## Rollback

Restore the two modified source files from their targeted `.before-date-search-toolbar-reflow` copies in the rollback evidence directory, preserving all other dirty files. The rollback tag anchors committed history; it does not replace the targeted dirty-file snapshots.

## SUGGESTIONS

None in scope. The user's next visual review will determine whether pixel offsets need refinement.
