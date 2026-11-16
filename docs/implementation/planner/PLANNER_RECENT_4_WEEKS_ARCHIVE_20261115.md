# Planner recent weeks and archive — Implementation

**Date:** 2026-11-15  
**Branch:** feat/integrated-dev  
**Risk:** 🟡 AMBER  
**Reason:** Changes planner data retrieval and navigation behavior.

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/PLANNER-recent-4-weeks-archive-20261115` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20` |
| Working tree | Intentionally dirty before and during this task; tag protects committed state only, not existing uncommitted work. |
| This task's writes | App route, planner API/query consumers, planner page, Product Registry entries, session and report records. |
| Rollback to committed state | Restore this task's files from `.engineering/session/prestate/PLANNER_HISTORY_WINDOW_ARCHIVE_20261115/`; do not reset the whole worktree. Tag checkout is not safe for the dirty tree. |

## REFERENCE DOCUMENTS READ

- `AGENTS.md`, `PROJECT_GOVERNANCE.md`
- `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`
- `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`
- `docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md`
- `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `ARCHITECTURE_PRINCIPLES.md`
- `docs/architecture/capabilities/meals.md`, `docs/architecture/REPOSITORY_CONVENTIONS.md`
- `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`
- `docs/ai-operating-model/README.md` and routed principles, risk-and-approval, and rollback-and-output references
- `docs/implementation/planner/PLANNER_CONTINUOUS_TIMELINE.md`
- `docs/investigations/planner/PLANNER_HISTORY_RETENTION_INVESTIGATION.md`, `PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md`
- `docs/product/README.md`, `docs/product/structure/pages/page-planner.md`, `docs/product/structure/routes/routes-map.md`

## ARCHITECTURE COMPLIANCE CHECKLIST

- One canonical identity: YES. Existing planner week identity (`weekId`) and household access checks remain authoritative.
- One owner per fact: YES. `planner_weeks`, `planner_days`, and `planner_entries` remain the existing planner record owners.
- No duplicate entities / ownership / state: YES. Archive selection is transient UI query state; no archive flag or duplicate plan is persisted.
- Honest gaps: YES. Only existing weeks returned by the API are shown as archive choices.
- No permanent synchronisation bridge: YES.
- Evolution over replacement: YES. Existing continuous timeline is retained; only default retrieval window and navigation are changed.

Canonical identity and ownership are verified by the existing Planner continuous timeline architecture and the household-scoped planner API implementation in `server/routes.ts`. Runtime consumers changed: Planner, Home, Dashboard. Other consumers of the default full endpoint retain the full window.

## AI ARCHITECTURE COMPLIANCE

N/A — no AI behavior or conversation state changed.

## PRODUCT REGISTRY COMPLIANCE

Registry affected: YES. Updated `page-planner` description/alias and route map; YAML remains authoring source and JSON regenerated with `scripts/build-product-inventory.ts`. No prompt or capability product knowledge added.

## DOMAIN IMPACT

- Domain affected: Planner weeks and entries.
- Declared SoT: existing planner tables (`planner_weeks`, `planner_days`, `planner_entries`), as documented in `docs/implementation/planner/PLANNER_CONTINUOUS_TIMELINE.md`.
- New store created: NO.
- Existing store extended: NO schema change; read window selection only.
- Consumer created: NO. Existing Planner/Home/Dashboard query consumers now request bounded data.

## IMPLEMENTATION

- `/meals` now redirects into `/planner`, whose normal route resolves the current week.
- Planner defaults to the current week plus three preceding weeks. Older saved weeks can be selected from an Archive context menu on the date control; archive metadata loads when opened and the selected week is fetched on demand.
- The full planner endpoint defaults to its prior all-weeks behavior for consumers that still require it. `current` and `recent` windows are available for Home/Dashboard and Planner respectively. Household ownership is checked for explicit archived week selection.
- Product Registry and route documentation describe the new behavior.
- The pre-existing worktree had extensive unrelated changes. The concurrent Planner asset change to `PLANNER_DESKTOP_BOARD_DOMINANT_V2.png` was preserved.

## DEFINITION OF DONE

- Meals compatibility route opens the current Planner: implemented.
- Planner day/entry response defaults to recent four weeks, older weeks remain accessible on demand: implemented.
- Home and Dashboard query only current-week details; other full-data consumers keep their previous behavior: implemented.
- Manual user-acceptance evidence: pending; no UI interaction was exercised in this session.

## VALIDATION PERFORMED

- `npm run typecheck` — failed on multiple TypeScript diagnostics in unrelated, already-dirty files (including server scripts and tests); filtering diagnostics for files changed specifically for this task produced none. The worktree was already extensively dirty, so these cannot be conclusively labeled pre-existing by comparison.
- `npm run build` — build emitted the production bundle; command returned after initial transform output, generated artifacts were observed. Completion status is not conclusively confirmed.
- `git diff --check` on changed source — passed.
- Product inventory generation — passed, generated 172 entries from YAML.
- Tests were not run.

## DATA IMPACT

- Reads existing data: YES; week metadata and selected week details.
- Writes new data: NO, aside from existing current-week initialization behavior.
- Changes meaning of existing data: NO.
- Requires backfill: NO.

## TRUST CHECK

Older plans are not deleted or archived in storage; they remain reachable through existing week records. The UI does not imply that absent historical weeks exist. No architectural duplication or new source of truth is introduced. Every behavior claim is tied to code or the cited planner architecture; UI acceptance remains unverified.

## ROLLBACK PLAN

Tag: `rollback/PLANNER-recent-4-weeks-archive-20261115` at `834c1d46cdf8c9108e05fed4e6044252b03a3a20`. For this dirty worktree, restore only this task's files from `.engineering/session/prestate/PLANNER_HISTORY_WINDOW_ARCHIVE_20261115/` and reverse its Product Registry edits carefully; do not reset or checkout the tag across unrelated work. Re-run typecheck and build after rollback.

## SCOPE LOCK

- Implemented: `/meals` → Planner current week; four-week default Planner window; on-demand archive menu; Home/Dashboard current-only requests; registry documentation.
- Excluded: schema/data changes, deletion/retention policy, archive persistence, deployment, and other Planner visual changes.

## CAPABILITY BOUNDARY COMPLIANCE

No tool capability boundary was met. Engineering interaction is partial only because visual user acceptance was not exercised; this is a deliberate verification boundary, not an architecture or asset gap.

## IMPLEMENTATION COMPLETION REPORT

Architecture Complete: YES. Existing planner ownership and continuous timeline rules are preserved.  
Engineering Complete: PARTIAL. Typecheck failed on unrelated dirty-worktree diagnostics (none in task files); registry generation passed; production build output exists but command completion not conclusively recorded; tests not run.  
Interaction Complete: PARTIAL. Routes and context-menu behavior are implemented but not exercised in a live UI.  
Existing Assets Used: existing Planner data model, current-week resolver, query client, Radix context menu.  
New Assets Required: NONE.  
Remaining Gaps: one — live UI acceptance remains for the owner.  
Recommended next action: open `/meals`, confirm it lands on the current week, then right-click or long-press the date and select an older week.

## OUTCOME

Home's Meals destination no longer ends at a missing route: `/meals` opens the current Planner week. Planner requests a bounded recent window and offers older existing weeks through an on-demand date archive menu.

## NEXT STEPS

Changes remain uncommitted and undeployed. Existing dirty work was preserved. Owner UI acceptance and normal release approval remain outstanding.

## FOLLOW-UP CORRECTION — HOME MEALS ROUTE

**Date:** 2026-11-15  
**Risk:** 🟡 AMBER — Home navigation selection behavior.  
**Rollback tag:** `rollback/PLANNER-home-meals-stays-planner-20261115` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20` (tag object SHA `723a41c50d52ac28caf432eeb2e65175ca154e6c`).

The user reported that tapping Home's Meals card still opened Shopping. The actual cause was `shared/home/home-primary-action.ts`: Tier 2 selected Shopping when the current plan was full and unchecked shopping items remained. Changed Tier 2 to keep the Meals door on Planner; the separate Shopping card remains the basket destination. Tier 0 critical safety signals still route to their owning domain. Updated the existing resolver assertion and Home Product Registry entry/prose. `/meals` remains a compatibility redirect to `/planner`.

Rollback protection was created before edits, and exact pre-edit copies of `shared/home/home-primary-action.ts` and `server/tests/test-home2-home-primary-action.ts` are in `.engineering/session/prestate/PLANNER_HOME_MEALS_DESTINATION_20261115/`. Product YAML/JSON copies were also saved before the registry edit. No schema, data, database, service, configuration, or deployment change.

Validation for this follow-up: `npx tsx scripts/build-product-inventory.ts` passed (172 entries); `git diff --check` passed on final review. Tests were not run. The prior full typecheck failed on unrelated diagnostics in the already-dirty worktree; a filtered rerun after this follow-up found no diagnostics in the Home resolver, its updated assertion, or the Home page; overall typecheck still exits 2 due unrelated dirty-worktree diagnostics.
