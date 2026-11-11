# COMPANION_DIET_CONFLICT_NOTICES_20261111 — Implementation

## Objective and Scope

Make repeated shopping restriction notices concise and actionable in the Companion. Group currently selected shopping-conflict notices by the source-owned restriction label; list their shopping item labels; provide Acknowledge and Snooze 24h actions that clear the Companion space without changing the underlying shopping items.

Scope is only `shopping-restriction-conflict` notices. Other notice categories, notice priority, critical classification, underlying shopping/planner/household records, Companion conversation handling, and unrelated ongoing work are unchanged.

## Risk, Approval, and Release Timing

- Risk: AMBER for notice presentation; RED for persisted per-user snooze state and schema migration.
- Owner approval: direct request for grouping and controls; explicit in-chat decision “Approve snooze in Opportunity Delivery” for persistent snooze ownership.
- Release timing: dev branch only (`feat/integrated-dev`). No shared/main, staging, or production release in this task.
- Promotion remains separately gated. No application restart, migration command, or deployment was intentionally triggered. The dev runtime's automatic-restart state was not checked.

## Rollback Information

- Rollback Identifier: `rollback/COMPANION-CONCISE-DIET-CONFLICT-NOTICES-20261111` → `82f23226f43a3a8e8298f8863c483239a3e2a89d`.
- The tag protects committed HEAD only; existing unrelated dirty work is not in the tag and was left untouched.
- Rollback is a code revert. The additive nullable column may remain unused; it needs no data rollback or drop. No direct DB access was performed. A dev server could apply the migration automatically if it restarted; runtime migration state was not inspected.

## Architecture Compliance

- **Verified:** `FoodOpportunity` in `server/intelligence/food-intelligence/opportunity-engine.ts` is the existing owner of item/restriction facts; structured labels are projected through the existing `opportunity-delivery` capability and `Notice Engine`.
- **Verified:** `Opportunity Delivery` (`delivery-store.ts`) is the sole owner of `opportunity_deliveries`. `companion_snoozed_until` extends that existing record; no second table, capability, assistant, conversation, or workflow was added.
- **Verified:** mutations use the authenticated route and existing Intent Engine `opportunity-delivery:review` verb; no new verb or confirmation exception was introduced.
- **Verified:** the Notice Engine applies explicit acknowledgement and expiry before its existing two-notice budget. Snooze is consumed only by the Companion notice projection; domain surfaces still receive the underlying opportunity.
- **Verified:** no planner, shopping, household, or food fact is written or re-owned.
- The owner-approved architecture contract is recorded in `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`.

## AI Architecture Compliance

This is not an AI reasoning change. It reuses the one Intelligence Platform, Capability Registry, Intent Engine, and ownership-scoped service path. No model-generated text is trusted for these labels; they come from structured producer facts. No second assistant or conversation state exists.

## Changes Made

- Group selected Gluten/restriction warnings into a concise line such as `Gluten conflict: semolina flour, all-purpose flour`.
- Carry source-owned restriction labels through the existing delivery and notice projections.
- Add Acknowledge and Snooze 24h actions to grouped shopping conflict rows.
- Acknowledge uses the existing non-terminal review status and the Notice Engine hides acknowledged shopping-conflict notices from its Companion stream.
- Snooze stores a nullable expiry on the existing `opportunity_deliveries` row. It does not change delivery status, emit learning evidence, or hide the opportunity on Planner/Shopping surfaces. The Companion refetches at expiry while open; a later open after expiry also makes the notice eligible.
- Append an idempotent migration adding `companion_snoozed_until`; no backfill or default is required.
- Update the Companion product registry and governing Notice Engine architecture.

## Definition of Done

- Grouped conflict messages are shorter and omit repeated “Review … Why?” text.
- Acknowledge removes the warning from the Companion without dismissing the opportunity or changing the shopping item.
- Snooze removes it from the Companion for 24 hours, then makes it eligible again.
- Other opportunity surfaces and underlying records remain unchanged.
- User-facing text is grounded in exact structured restriction and shopping item labels.

## Product Registry Impact

- Registry affected: YES.
- Entries updated: `cap-companion` version 5; `hid-notice-engine` inventory version 3.
- Entries created/retired: NONE.
- Public/household visibility changes: NONE.

## Data Impact

- Adds nullable `opportunity_deliveries.companion_snoozed_until` via the canonical reviewed migration runner and matching Drizzle schema declaration.
- No backfill, existing-row rewrite, new table, or business data change. The snooze timestamp is the only new persisted value.
- Migration was not manually applied. The server migration runner may apply it automatically if a dev server restarts; runtime migration state was not inspected.

## Trust and Claims

- **Verified:** the producer supplies restriction labels and shopping item label; OD1 supplies delivery status and snooze deadline.
- **Verified:** `applySilenceRules` removes only explicitly acknowledged or currently snoozed shopping-conflict notices; malformed/expired dates do not suppress a notice.
- **Inferred:** grouping these repeated rows will reduce Companion clutter as intended; live visual acceptance remains with the owner.
- Highest remaining risk: a live DB has not applied the migration and the UI has not been retested in the local browser. No schema/runtime claim is made for a running server.

## Verification Performed

- `git diff --check` for modified runtime and governing/product files: PASS.
- Product inventory JSON parse with PowerShell `ConvertFrom-Json`: PASS.
- `npm run typecheck`: FAILS on existing errors in unrelated files (`client/src/pages/admin-knowledge-claims-page.tsx`, several `server/scripts/` and `server/tests/` files). No type errors were reported in files changed for this task. The same repository errors were present in a typecheck before the Red snooze additions.
- Tests: NOT RUN (no explicit test/verification request; per active Codex instruction, do not add/run tests without one).
- Build: NOT RUN because `script/build.ts` recursively deletes and recreates `dist`.
- Live UI, DB migration, app restart, and deployment: NOT performed.

## Manual Acceptance Steps

1. In the dev app, open Companion with two unchecked shopping items matching the same hard restriction.
2. Confirm one concise row lists the restriction and both item labels; other notice rows remain as before.
3. Select **Acknowledge**; confirm the grouped warning disappears from Companion while the Shopping list remains unchanged.
4. With another active restriction conflict, select **Snooze 24h**; confirm it disappears only from Companion, remains available on Shopping, and returns after expiry on refresh/reopen.

## Rollback / Data / Trust / Scope Summary

- Rollback: revert this task's code/docs; leave the nullable column in place if migration has been applied.
- Data: additive nullable field; no backfill or runtime data access.
- Trust: only source-owned labels and explicit user-selected lifecycle state affect the Companion notice.
- Scope lock: unrelated dirty Companion intent and meal-image work untouched.

## User Acceptance Evidence

Starting page: local Planner with Companion open. Expected: restriction conflict summaries are grouped and concise; acknowledgement hides the message; snooze hides it for 24 hours; underlying shopping data remains unchanged. Live acceptance was not performed; owner retest remains.

## SUGGESTIONS

None.



## Commit-all follow-up verification — 2026-11-11

Generic `test-intelligence-notice-engine.ts` passed 75/75, `test-intelligence-opportunity-delivery-binding.ts` exited 0 (60/60), and `test-intelligence-food-opportunity-binding.ts` passed 99/99. None supplies feature-specific regression coverage for this added acknowledge/snooze lifecycle; no claim of complete flow verification is made. The Conversation Gateway integration suite remains blocked by Postgres `EACCES`. Claude's owner-provided runtime report states the startup migration `2026-11-11_opportunity_delivery_companion_snooze` was applied; Codex did not inspect the database.
