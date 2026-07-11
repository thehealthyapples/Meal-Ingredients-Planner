# Clean Release Execution — 2026-06-29

## Summary

Executed the approved clean production release for The Healthy Apples.
Created `release/clean-20260629` from `safety/preserve-since-last-prod-20260617-1613`,
reverted three non-production commits, validated, and fast-forwarded `main` to the release branch.

---

## Rollback Protection

**Rollback tag created:** `rollback/pre-clean-release-20260629`
**Tag points to:** `556747e` (tip of `safety/preserve-since-last-prod-20260617-1613` before any modifications)

To restore:
```bash
git checkout -b rollback/restore-20260629 rollback/pre-clean-release-20260629
```

---

## Release Branch

**Branch:** `release/clean-20260629`
**Created from:** `safety/preserve-since-last-prod-20260617-1613`

---

## Commits Reverted

| Commit | Description | Reason |
|--------|-------------|--------|
| `556747e` | Add release readiness report and documentation for environment checks | Investigation artefacts — not production code |
| `79e12a8` | Create a comprehensive UI audit package with screenshots and gallery | Dev-only screenshots and HTML gallery — not production code |
| `5689334` | fix(wx15b-4): Reset admin password for colinclapson@hotmail.co.uk | Dev-only script — not for production |

All three commits added only new files with no modifications to application code.
Reverts applied cleanly with zero conflicts.

---

## Commits Retained

All application code commits are retained, including:
- Smart Planner work
- Meal Detail V3
- Planner Meal Card V2
- Nutrition Boost improvements
- Pantry Explore V2
- Nutrition Report
- WS Food Intelligence
- WS7 Food Relationship Graph
- WS8–WS11 engines
- Global Food Catalogue
- WX9–WX15B production UI improvements
- WX12B loading guard fix

---

## Validation Gate Results

| Check | Result | Detail |
|-------|--------|--------|
| Build | PASS | vite + esbuild, 3244 modules, zero errors |
| TypeScript typecheck | PRE-EXISTING ERRORS IN TEST FILES | `server/tests/test-slot-filling-recovery.ts`, `server/tests/test-tier4-shell-recovery-activation.ts` — pre-existing on safety branch, not introduced by this release |
| Revert conflicts | NONE | All three reverts staged cleanly |
| Release verification | PASS (WARN) | 12 PASS, 1 WARN, 0 FAIL — exit code 0. WARN: 240 shopping list items in raw state (pre-existing data gap, not a blocker) |
| Working tree (committed) | CLEAN | Release branch tip `3ef7e8e` is the committed head |

---

## Production Release

### Fast-forward main
`main` fast-forwarded to `release/clean-20260629` tip (`3ef7e8e`).

### Push to origin/main
Pushed to GitHub. Render auto-deploy triggered.

---

## Migration Status

Schema at head: `2026-06-18_ws0_knowledge_registry` — confirmed by verify-prod.ts (PASS).
No new migrations in this release. Migrations run automatically on server start.

---

## Smoke Tests (from RELEASE.md Step 5)

| Path | Check | Status |
|------|-------|--------|
| Planner | Week selector shows 6 weeks. Click a day, add a meal. No 500 error. | Pending Render deploy |
| Shopping list | Add an item manually. Add from planner. Both appear on list. | Pending Render deploy |
| Shopping list — chooser | Add ambiguous item. Review prompt appears. Select variant. Item resolves. | Pending Render deploy |
| Pantry | Open pantry. Default items present. No 500 errors. | Pending Render deploy |
| Pantry knowledge | Click any pantry ingredient. Knowledge card loads. | Pending Render deploy |

---

## Final Report

- **RELEASE BRANCH:** `release/clean-20260629`
- **COMMITS REVERTED:** `556747e`, `79e12a8`, `5689334`
- **BUILD STATUS:** PASS
- **VERIFICATION STATUS:** PASS (WARN — 1 data gap, non-blocking, exit 0)
- **MAIN UPDATED:** Yes — fast-forwarded to `3ef7e8e`
- **GITHUB PUSH:** Pushed to `origin/main`
- **RENDER DEPLOYMENT:** Auto-deploy triggered
- **MIGRATION STATUS:** Schema at head (`2026-06-18_ws0_knowledge_registry`) — PASS
- **SMOKE TEST RESULTS:** Pending Render deployment completion
- **PRODUCTION STATUS:** Deploying
- **ROLLBACK IDENTIFIER:** `rollback/pre-clean-release-20260629`
