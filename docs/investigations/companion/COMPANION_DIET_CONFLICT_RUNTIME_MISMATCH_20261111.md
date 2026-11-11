# Companion Diet Conflict Runtime Mismatch — 2026-11-11

## Scope
Investigate why the owner still sees the old shopping restriction notices in Companion after implementation of concise grouped notices with acknowledgement and snooze.

## Repository and branch
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch: `feat/integrated-dev`
- Risk: Amber implementation already exists; runtime activation would be Red because application startup runs pending database migrations.

## Evidence and actions
- **Verified:** `client/src/components/conversation/FloatingAssistant.tsx` in the repository contains grouped restriction display and Acknowledge/Snooze 24h controls.
- **Verified:** the Vite source endpoint on `127.0.0.1:5000` serves that updated component.
- **Verified:** after reloading the existing Edge planner page, its accessibility tree still shows the old two “Review … may conflict … Why?” notices.
- **Verified:** the component currently serves its source in development, but `server/index.ts` calls `runMigrations()` during startup (`server/index.ts`, `server/migrations/runner.ts`).
- **Inferred:** the currently running backend process predates the server-side notice metadata changes; Vite source serving alone does not prove backend modules were reloaded. The unchanged notices after page reload support this.
- Restart was not attempted. It could run pending schema migrations against the configured database. Database target and pending migration state were not established in this investigation.

## Files changed
- Added this investigation report.
- No application source, database, environment configuration, or running server was changed. The planner page was refreshed for verification.

## Checks
- Source inspection confirms the updated client controls are present.
- Vite endpoint check confirms the updated component source is served.
- Browser reload verification confirms the page still renders the old notices.
- No tests were run.

## Unknowns / next step
Confirm the local server's database target and pending migration state, then restart the development server so its backend loads the updated notice code. Verify the notice payload and UI afterwards. Do not claim the UI fix is live until the grouped label and Acknowledge/Snooze controls appear.

## Live systems and configuration
- Live service: local planner page at `127.0.0.1:5000` was refreshed only.
- Database: not queried or modified.
- Scheduled tasks: not touched.
- Configuration/secrets: not read or changed for this investigation.


## Follow-up — 2026-11-11

The owner later reported that dev startup applied migration 2026-11-11_opportunity_delivery_companion_snooze. Codex has not independently queried the DB, so applied state remains owner-reported. The migration source adds nullable opportunity_deliveries.companion_snoozed_until; no rollback/drop is implied by this record.
