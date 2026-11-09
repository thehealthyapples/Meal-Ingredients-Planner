# Diary savings removal — 2026-11-04

## Task and scope
Owner requested removal of the arbitrary Diary savings figures until solid metrics exist. Removed the Diary savings card and stopped automatic takeaway-avoided savings events in the two Diary logging routes. Historical event rows, the aggregate endpoint, schema, and other savings capabilities were left untouched.

## Preflight and authority
Repository: G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003; branch feat/integrated-dev; base HEAD 3467abad4eca8d82ffc52756fee13874e389597f; 122 pre-existing dirty entries, preserved (122 after implementation).
Risk: Red because new savings-event persistence and the meaning of a household financial claim change. Direct owner instruction authorized this bounded dev-branch change. No production or staging promotion authorized.
Read: root AGENTS.md, PROJECT_GOVERNANCE.md, docs/architecture/README.md, ENGINEERING_WORKFLOW.md, ARCHITECTURE_PRINCIPLES.md, THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md, THA_EXPERIENCE_BLUEPRINT.md, THA_EXPERIENCE_ARCHITECTURE.md, THA_EXPERIENCE_LANGUAGE.md, THA_UI_ARCHITECTURE.md, THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md, GOVERNING_EXPERIENCE_ARCHITECTURE.md, .engineering/OPERATING_MANUAL.md, ROLLBACK_PROTECTION_PROTOCOL.md, docs/change-control.md, docs/ai-operating-model/README.md and task-routed operating-model files, and condensed THA operating-model skill.
Verified: server/routes.ts created £10 takeaway_avoided events for each logged meal or manual entry. server/lib/savings-config.ts owns the flat rate; server/storage.ts aggregates those rows; the Diary page was the only repository client found for the aggregate endpoint. GEA17 and GEA21 require truthful owner-backed reporting and honest absence. No architecture conflict after removing the unsupported Diary claim and automatic writer.

## Decision and trade-offs
Options considered: hide card only (would keep polluting event data); relabel figures (still misleading); hide card and stop auto-events (chosen). This changes no canonical owner and creates no duplicate state or workflow. Diary food logs remain owned by Domain 21 tables. The existing savings_events table and aggregate API remain untouched, including historical rows.
Release timing: development branch only; no deployment. Rollback: existing annotated tag rollback/DIARY-coffee-journal-20261103 resolves to base HEAD; exact pre-edit copies of all three touched files are in G:\The Healthy Apples\artifacts\diary-savings-removal-20261104. The tag protects committed state; copies protect dirty files. No new tag was created because repository instructions prohibit tagging without explicit authorization.
Data impact: future manual entries and meal logs no longer write savings events. Historical savings rows were neither read nor modified. No backfill or migration.
Deployment checklist if later promoted: review diff and historical-data policy, run build and relevant logging checks, secure owner approval for promotion, deploy code, verify logged entries create no automatic savings events, verify Diary shows no savings card.

## Files changed
- client/src/pages/food-diary-page.tsx: removed SavingsCard, aggregate query, invalidations, and rendering.
- client/src/pages/food-diary-page.css: removed card-specific styling.
- server/routes.ts: removed SAVINGS_RATES import and automatic savings-event writes from both Diary entry routes.

## Verification
- `npm run build`: passed (existing PostCSS/import.meta build warnings).
- `git diff --check` for tracked touched files: passed.
- Repository search: no remaining SavingsCard, diary-savings, savingsAggregates, SAVINGS_RATES, or createSavingsEvent references in changed Diary/routes files.
- `git status --short` count: 122 before and after; existing dirty work preserved.
User acceptance: open Diary, see no £/takeaways card; logging a manual item or saved meal still creates the Diary entry but no automatic savings event. Build and source verification complete; live UI and database write verification deferred to owner runtime. Highest-risk inference: external consumers of the aggregate endpoint are unknown; repository search found only the removed Diary client.

## Services and configuration
No live services, database, scheduled tasks, secrets, configuration, push, or deployment touched.
