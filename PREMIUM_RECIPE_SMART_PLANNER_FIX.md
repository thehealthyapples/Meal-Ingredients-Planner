PREMIUM RECIPE SMART PLANNER FIX IMPLEMENTED: YES

Rollback identifier: pre-premium-fix-implementation-2026-06-08 (commit b48ceee)
Implementation commit: 00a8ee1
Full report: docs/investigations/PREMIUM_RECIPE_SMART_PLANNER_FIX.md
Date: 2026-06-08

---

SUMMARY

Three changes implemented (Option B):

1. Smart Planner premium gate
   - candidateIsPremium() added to server/lib/smart-suggest-service.ts
   - Applied as route-level pre-filter on userMeals (routes.ts after line 4866)
   - Applied as defense-in-depth gate inside generateSmartSuggestion()
   - Covers 7 marker variants, case-insensitive, checks name + instructions

2. Import title fix
   - routes.ts JSON-LD path (line 2795): title now included in premium scan
   - routes.ts DOM fallback path (line 2928): title now included in premium scan
   - Re-importing the BBC GoodFood URL now returns HTTP 403

3. Data cleanup
   - Meal ID 1558 deleted (confirmed: name ✓, BBC URL ✓, user_id=1 ✓)
   - Meal ID 1559 deleted (confirmed: name ✓, BBC URL ✓, user_id=1 ✓)
   - Restore SQL: docs/investigations/PREMIUM_RECIPE_RESTORE_1558_1559.sql

BUILD: PASS
TYPESCRIPT: PASS (0 errors)
TESTS: 17/17 premium filter tests passed; full suite clean (no regressions)
