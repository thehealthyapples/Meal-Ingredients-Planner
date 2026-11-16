# Companion action cache invalidation — 2026-11-14

## Governance preflight
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`; branch `feat/integrated-dev`; HEAD `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- Read: root `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/ai-operating-model/README.md`; task area: `client/src/components/conversation/FloatingAssistant.tsx` and the query owners listed below.
- Standing dev-branch authority applies. `Implementation permitted: YES` for this bounded client-only change. User specifically authorized the fix. No architecture conflict found.
- Risk: Amber client behavior. Scope locked to successful Companion-action cache invalidation.
- Rollback point: annotated local tag `rollback/COMPANION-CACHE-INVALIDATION-20261114` at `834c1d46cdf8c9108e05fed4e6044252b03a3a20`. Exact pre-edit component snapshot: `.engineering/session/prestate/COMPANION_CACHE_INVALIDATION_20261114/FloatingAssistant.tsx` (SHA256 `09010EE4B671EE7AB9E4C4FEE22557C748E9B14E1E1821FCEEC73F9B0DE72078`).

## Change
In `client/src/components/conversation/FloatingAssistant.tsx`, successful action confirmation now invalidates data according to capability:
- planner: `/api/planner/full` (all Planner weeks; `weekly-planner-page.tsx` reads this single key)
- meals: `/api/meals` (prefix covers list and individual meal queries), `/api/meals/summary`, `/api/planner/ready-meal-library`
- shopping: shopping list, sources, prices, and total cost
- pantry: `/api/pantry`
- diary: diary prefix, trends, recent items, frequent items
- profile and household: the existing keys

An unmapped or future capability invalidates the full query cache, so a newly added write binding cannot silently retain stale data. No server, registry, capability handler, database, or config file changed.

## Architecture, data, trust, rollback
- Canonical data owners remain their existing services and query endpoints; no state or workflow was introduced.
- Confirmation still uses the existing Companion action endpoint. Cache refresh happens only after the response reports `succeeded`.
- No data was written or altered by this implementation. No secrets or live DB were accessed.
- Rollback: revert the narrow `FloatingAssistant.tsx` change using the preserved pre-edit snapshot; tag protects committed HEAD only.
- Definition of done: all current write capability keys mapped; unknown capabilities safely refresh all queries; typecheck produces no new errors for the edited file; live checks reported honestly.

## Verification and limitation
- Verified endpoint/query keys against `weekly-planner-page.tsx`, `meals-page.tsx`, `meal-detail-page.tsx`, `shopping-workspace-page.tsx`, `larder-room.tsx`, `larder-category-view.tsx`, and `food-diary-page.tsx`; write-capability coverage against the registered planner, meals, shopping, pantry, and diary bindings.
- `npm run typecheck -- --pretty false`: fails with 16 TypeScript errors, all in existing server/test files; zero errors mention `FloatingAssistant.tsx`. The count matches the known prior baseline of 16.
- No dev listener was present on ports 5000 or 5173. I did not start the server or create/replace records. Therefore live UI verification of a planner add and meals.replace could not be completed. The code fix is ready for runtime acceptance in the owner's active dev session.
- No tests were added or run. No commit, push, deploy, migration, or service restart.

## Files changed
- `client/src/components/conversation/FloatingAssistant.tsx`
- `.engineering/session/prestate/COMPANION_CACHE_INVALIDATION_20261114/FloatingAssistant.tsx` (preservation snapshot)
- `.engineering/session/runs/COMPANION_CACHE_INVALIDATION_20261114.md`
- `docs/implementation/intelligence/COMPANION_CACHE_INVALIDATION_20261114.md`
- `G:\The Healthy Apples\Incoming\Agent Reports\Codex_2026-11-14_Companion_Cache_Invalidation.md`