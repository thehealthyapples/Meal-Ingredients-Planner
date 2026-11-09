# KNOW3 source attachment — implementation record — 2026-11-05

## Scope and authority
Implemented per-claim source attachment and audited removal for active pending food-knowledge claims in Integrated Dev. Authorized by the owner’s “just fix it” instruction after describing this capability as the missing work needed to move the queue forward. No claim approvals, source backfill, or deployment were authorized or performed.

## Repository and rollback
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch/base: `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- Required rollback tag: `rollback/KNOW3-uncited-claim-filter-20261105` at base HEAD.
- Dirty worktree was already extensive. Relevant pre-edit files and agent report were snapshotted at `G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3_SOURCE_ATTACHMENT_20261105\manifest.json`; unrelated edits were preserved.

## Changes
- `shared/knowledge/evidence.ts`: recognized USDA and Health Canada official domains; added role-aware rule so those composition datasets cannot satisfy benefit-edge claims; added optional exact evidence excerpt metadata.
- `server/lib/knowledge-claim-review-store.ts`: added transactionally locked source attach/remove operation, pending-active guard, URL trust validation, duplicate URL protection, and before/after snapshots in the existing audit ledger. Does not write review or rejection fields.
- `server/routes.ts`: added authenticated per-claim source-change endpoint, deriving actor identity from the session.
- `client/src/pages/admin-knowledge-claims-page.tsx`: added source form, exact-passage capture and confirmation, pending-only removal, and clear separation from approval.

## Architecture and trust
**Verified:** canonical claim rows continue to own `source_refs`; existing audit rows are the only audit owner; claim decisions remain through the existing separate decision operation. No duplicate evidence store or workflow was introduced. USDA/CNF-like official composition sources are restricted to composition claims. Attaching sources does not render claims because the independent named-reviewer approval gate remains unchanged.

## Data and runtime impact
No database migration or claim-row writes were performed by this code change. A later operator action appends/removes one citation and creates one audit event in one transaction. No database, live service, runtime process, configuration, deployment, push, or commit was touched. The backend must be restarted by the owner for the new API route to load; the previously identified Integrated Dev backend process is `node.exe` PID 15256 on port 5000. The frontend PID 30560 on port 5001 should remain running. Startup may run migrations/default synchronization as already disclosed in the task.

## Verification
- `npm run build` — passed. Existing warnings: stale Browserslist data, PostCSS `from` option, oversized client chunks, and CJS `import.meta` warnings.
- `git diff --check` scoped to the four implementation files — passed.
- Test suite and browser flow were not run. The protected backend restart remains user-session dependent; OS denied termination from this agent environment.

## Rollback and definition of done
Code rollback: restore the four task-scoped source files from the preserved pre-edit snapshots; do not revert unrelated dirty work. Any human-attached citation can be removed using the audited pending-claim action. Done for this implementation means Admin can attach/remove citations on pending claims without approval, source role limits are enforced, audit records are atomic, build succeeds, and user can restart backend to use it. The separately requested comprehensive 3,299-claim source review/mapping is not yet complete; the new capability enables individual citation entry but does not automatically research or attach thousands of sources.

## Suggestions
After backend restart, verify one source attach and removal in Admin and inspect its history row. Then work through the queue in bounded reviewed batches; do not bulk-attach or auto-approve.
