PREMIUM RECIPE SMART PLANNER AUDIT: COMPLETE

Rollback identifier: pre-premium-audit-investigation-2026-06-08 (commit b48ceee)
Full report: docs/investigations/PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md
Date: 2026-06-08
Status: Investigation complete — no code or data changes made

---

SUMMARY

A premium-named BBC GoodFood recipe (meal IDs 1558 and 1559) is appearing in Smart
Planner because:

1. The meals were seeded into the database on 2026-02-27 before any premium-detection
   logic existed in the import path.

2. The Smart Planner has no premium-content filter anywhere in its pipeline — not on
   the My Meals candidate pool, not on external candidates, not as a final gate.

3. The import route premium check (routes.ts lines 2795, 2928) only scans ingredients
   and instructions — it does not check the recipe title where BBC GoodFood embeds
   the premium marker.

ROOT CAUSE: Stale data + missing Smart Planner gate + incomplete import check.

AFFECTED RECORDS: 2 confirmed (IDs 1558, 1559).

SMALLEST SAFE FIX (not implemented — decision required):
  A. Add premium-name filter to Smart Planner userMeals pre-filter (routes.ts ~4862)
  B. Add title to import premium check (routes.ts lines 2795, 2928)
  C. Delete or rename meal IDs 1558 and 1559

See full report for matrix, evidence, and recommended decision sequence.
