# Dev Environment Startup Diagnostic — 2026-11-12

## Scope

Owner requested a 10-second npm run dev attempt, configuration and database reachability checks, Bridge status, and diagnosis only. No fixes were attempted.

## Preflight

- Owning repo: G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003
- Branch / HEAD: feat/integrated-dev / 4cf1ea4f2d130171441ef88f06515037c1f947fb
- Initial Git status: one pre-existing untracked investigation report, preserved.
- Risk: RED for unrestricted startup because startup can apply schema migrations and writes default pantry rows. This run was limited to a sandboxed 10-second attempt and read-only database checks.
- Rollback tag: rollback/startup-diagnostic-20261112 -> 4cf1ea4f2d130171441ef88f06515037c1f947fb
- Governance read: workspace AGENTS.md; app AGENTS.md, PROJECT_GOVERNANCE.md, docs/architecture/README.md, docs/architecture/ENGINEERING_WORKFLOW.md, docs/architecture/REPOSITORY_CONVENTIONS.md, docs/change-control.md; docs/ai-operating-model/README.md, principles.md, risk-and-approval.md, evidence-and-architecture.md, rollback-and-output.md.
- Bridge instructions read: Infrastructure/AI Agent Bridge/AGENTS.md and README.md; Infrastructure/tha-chatgpt-bridge/docs/THA-OPERATIONS.md. Read-only status checks only.
- Runtime files inspected: scripts/start-dev.ts, server/index.ts, server/db.ts, server/lib/platform-status.ts, server/migrations/runner.ts, scripts/db/database-target.ts, server/lib/bridge-activity-client.ts.
- Implementation permitted: YES for the requested diagnostic and reports on the authorized dev branch. No code/config implementation was in scope.

## Startup attempt

Ran npm run dev from the app directory and captured stdout and stderr for 10 seconds. The process was still alive after 10 seconds and was then stopped as requested. No app-ready line or startup error appeared before termination. Captured output:

    > rest-express@1.0.0 dev
    > tsx scripts/start-dev.ts

The sanitized capture is at G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003\startup-log.txt.

The launcher imports server/index.ts. That startup path awaits runMigrations() and then starts storage.syncAllPantryDefaults() in the background. The configured database is managed Neon; therefore an unrestricted startup could write schema changes and pantry rows. The bounded attempt produced no migration-complete output. I did not run an unrestricted startup or apply database changes.

## Configuration and database

- .env exists; .env.local does not.
- DATABASE_URL and SESSION_SECRET, the two keys in server/lib/platform-status.ts's required inventory, are present by key name.
- THA_BRIDGE_BASE_URL, THA_BRIDGE_TOKEN, OPENAI_API_KEY, and PIXABAY_API_KEY are present by key name. Values were not printed.
- Safe database identity: host ep-dark-feather-a20l9yyd-pooler.eu-central-1.aws.neon.tech, database neondb; provider classification is managed Neon. No credentials or full connection string are recorded.
- A plain TCP check from the default sandbox returned EACCES (sandbox network restriction).
- An escalated TCP handshake to port 5432 succeeded. An authenticated read-only transaction containing SELECT 1 also succeeded. No database data or schema was changed by these checks.
- The app startup attempt did not reveal a database error within its 10-second window. Its exact startup blocker remains unconfirmed.

## Bridge status

- The app's server/lib/bridge-activity-client.ts requests GET /v1/tha/activity using THA_BRIDGE_BASE_URL and THA_BRIDGE_TOKEN.
- The configured app endpoint is 127.0.0.1:8787. The request failed with ECONNREFUSED. Local probes to ports 8787, 8789, and 8791 all returned ECONNREFUSED; app ports 5000 and 5001 were also closed after the startup process was stopped.
- Gate5 and Gate9 read-only status adapters both returned: “Gate5 read failed; check local service availability and setup” and “Gate9 read failed; check local service availability and setup.”
- Infrastructure/AI Agent Bridge is an MCP stdio server, not the HTTP endpoint the app calls. The Codex local Agent Bridge report tool responded in this session. This does not establish that the THA Bridge API is running.
- The app's Bridge activity endpoint is unavailable at its configured local address. The app startup attempt does not show that this endpoint caused the startup delay.

## Outcome and limits

Verified failures/unavailability: app Bridge activity endpoint at 127.0.0.1:8787 refused the connection; Gate5/Gate9 status adapters were unavailable. Database TCP and authenticated read-only query succeeded. Required startup keys are present.

The app itself did not reach a ready state in the bounded 10-second attempt, but no error was emitted. The remaining startup cause is unknown. An unrestricted retry would invoke migrations and pantry synchronization against the managed database, so it requires a confirmed isolated development database or explicit approval for those automatic writes.

## Files and services

Created startup-log.txt and this investigation report only. No source, configuration, credentials, or environment files were modified. The startup process was terminated; no app or Bridge service was started. Database checks were read-only. No tests were run.


## Follow-up: requested verbose 30-second startup

- The escalated DEBUG=* npm run dev request was rejected by automatic approval review before launch. The stated reason was that startup may apply migrations and synchronize pantry rows across households on an unidentified managed Neon database, and the potentially broad mutation was not narrowly authorized or proven safe. I did not retry through another route.
- full-startup-log.txt was not created because the startup process did not run.
- npm list exited 0. The requested case-sensitive missing|unmet|ERR filter found no matches.
- npm run dev -- --check exited 0 and reported the launcher ready with server start skipped. This checks the launcher only.
- The dev script is tsx scripts/start-dev.ts (runtime TSX transpilation); it has no Next.js dependency. Separate build and typecheck scripts are tsx script/build.ts and tsc --noEmit.
- These safe checks found no dependency/build-system failure. The actual runtime startup failure remains unknown pending an approved safe database target or explicit authorization for startup writes.
- No application process, Bridge service, database transaction, migration, or source/configuration change occurred during this follow-up.


## Owner-authorized full startup — 2026-11-12

The owner explicitly authorized a DEBUG=* startup against neondb, including migrations and pantry sync. The 60-second attempt captured 3,861 lines (232,398 bytes) to full-startup-log.txt. Credential-like values were redacted from the saved log. The run reached HTTP serving; it showed no actual startup exception, missing module, dependency error, or compilation failure.

Startup sequence observed:

- Required environment audit passed.
- Migrations completed successfully: schema_migrations table ready; no pending migrations; schema head 2026-11-11_opportunity_delivery_companion_snooze.
- Local media storage and knowledge overlay initialized.
- Express reported serving on port 5000 at 23:22:45. The Vite middleware stack was mounted into the same Express app. Port 5001 remained closed; this npm run dev path serves the app through port 5000.
- A later HTTP GET to http://127.0.0.1:5000/ returned 200 text/html. The app is currently running.
- The 60-second captured run was terminated at its end; a normal non-debug dev launch was then started and verified on port 5000.

Non-blocking warnings: SMTP_HOST, SMTP_USER, and SMTP_PASS are missing, so email sending is disabled. Optional recipe/price integrations are disabled or rate-limited (Whisk, Edamam, Spoonacular, USDA); TheMealDB reports its shared test key/licensing gap. The uplift engine skipped unreviewed rule draft-omelette-rule. These did not prevent HTTP readiness.

Dependency check: npm list exited 0 with no case-sensitive missing, unmet, or ERR matches. The dev entry uses tsx runtime transpilation; there is no Next.js dependency or separate build step in npm run dev.

No source, config, or environment files were changed. Migrations were already up to date. The authorized pantry sync ran in the background; no pantry-sync error appeared in the captured output. No tests were run.
