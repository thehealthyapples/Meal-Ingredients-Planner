# Healthy Apples Agent Instructions

Read `PROJECT_GOVERNANCE.md` before taking any action in this repository. It is the authoritative project brief and governance entry point for ChatGPT, Claude Code, Codex, Hermes, and any delegated agent.

Before any significant investigation, recommendation, concept, implementation, file modification, or delegation:

1. Follow the Mandatory Governance Bootstrap in `PROJECT_GOVERNANCE.md`.
2. Produce the THA Governance Preflight Receipt required there.
3. Do not modify files or delegate implementation unless that receipt states `Implementation permitted: YES`.
4. Name the exact governance and task-specific architecture documents actually read.
5. If governance is missing, contradictory, or does not authorise the requested work, STOP and report the conflict.

Do not rely on conversation memory as a substitute for repository governance.

Verify exact project assets, routes, services, current worktree state, branch, HEAD, and git status before acting.

Preserve unrelated dirty changes.

Do not commit, push, deploy, migrate, access secrets, alter credentials, or modify production/staging without explicit user authorization.

Delegated agents must independently read the governing repository files specified in their task. A summary from the parent agent is not sufficient.

Agent completion is not acceptance. The parent agent must inspect the actual diff, tests, artifacts, and relevant runtime behaviour against the same governance used during preflight.

## Application dev-branch authority and promotion

The standing dev authority in `PROJECT_GOVERNANCE.md` applies to tasks confined to the verified `feat/integrated-dev` branch. The preflight receipt remains required to record repository identity and scope; it may mark `Implementation permitted: YES` under that standing authority, without separate per-task owner approval or a Gate 9 decision for application dev tasks. This does not authorize promotion.

Before every configuration-file write, create a timestamped sibling backup containing the exact prior bytes. If backup creation fails, do not write the configuration file. Record the backup path in the task audit trail.

The owner must explicitly approve each promotion into shared/main state and onward to staging or production. A completed dev task is never promotion approval. This application dev-branch exception does not change Bridge-root governance or Gate 9's role there.

## Authorized Data Writers

### Meals Table Writers (FS3 — Recipe Acquisition Architecture)

All meal writes must set `acquisitionLane` and `acquisitionType` per `shared/recipe-acquisition.ts`.

**Authorized writers:**

1. **server/storage.ts :: createMeal()** — User recipe creation
   - Canonical writer for user-authored and imported meals
   - Derives acquisition via `deriveAcquisitionFromLegacy()`
   - Used by: meal creation form, product-based meal resolution (RM2A)

2. **server/storage.ts :: resolveOrCreateProductMeal()** — Product deduplication
   - Meal identity consolidation for product barcode scans
   - Calls `createMeal()` internally → derives acquisition
   - Used by: Analyser → Planner journey, ready-meal scanning

3. **server/lib/meal-service.ts :: preloadStarterMeals()** — Starter meal provisioning
   - Copies safe starter meals into user cookbook at onboarding (SURF1B5)
   - Sets `acquisitionLane: 'tha_library'` and `acquisitionType: 'authored'` (derived)
   - Used by: onboarding flow (routes.ts)
   - Fixed: 2026-11-08 to properly derive acquisition fields (Priority 2 repair)

4. **server/lib/seed-ready-meals.ts :: seedReadyMeals()** — System meal seed
   - ~312 THA-owned ready meal fixtures
   - Sets `mealSourceType: 'ready_meal'` and `isSystemMeal: true`
   - Runs: `npm run seed:ready-meals` (startup-only seed)

**Write path architecture:** All writers either call `createMeal()` or explicitly derive acquisition. Direct inserts are forbidden.
