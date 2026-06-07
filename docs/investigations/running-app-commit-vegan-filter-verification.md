RUNNING APP COMMIT AND VEGAN FILTER VERIFICATION: COMPLETE

**Date:** 2026-06-06
**Type:** Verification only — 🟢 GREEN
**Subject:** Confirm dev server is running af620b9 (planner compliance gate) and investigate why a Vegan user still sees beef/bacon in their Smart Plan.

---

## Git state

| | |
|---|---|
| **Current branch** | `main` |
| **Local HEAD** | `af620b9` (2026-06-06 22:02:15 UTC) — planner compliance gate |
| **origin/main HEAD** | `c0ea8d5` — local main is 2 commits ahead, not pushed |

---

## Is the app running af620b9?

**YES.**

The server process is `tsx server/index.ts`, started at 22:31 — 29 minutes after the commit at 22:02. `tsx` reads TypeScript files from disk at runtime, so the running server IS serving af620b9 code. No restart was required.

---

## Source of the beef/bacon result

**RESTORED / PERSISTED DATA — not a fresh Smart Suggest result.**

Meal 1478 ("The best spaghetti bolognese recipe", containing beef mince and smoked streaky bacon) is stored in `planner_entries` rows 556 and 686. Those rows were written when the default 6-week template was imported before any diet filter existed.

---

## Runtime dietPattern

**`req.user.dietPattern = "Vegan"` — present and correct.**

`users.diet_pattern = "Vegan"` for user 1. `storage.getUser()` does `db.select().from(users)` (all columns), so passport's `deserializeUser` correctly populates `req.user.dietPattern` on every request. dietPattern is not missing at runtime.

---

## Compliance gate coverage (af620b9)

| Path | Gate present? |
|---|---|
| `POST /api/meal-plans/smart-suggest` (generation) | ✅ commit 1e67eff |
| `POST /api/smart-suggest/auto-import` (smart-apply persist) | ✅ af620b9 — routes.ts:4983 |
| `POST /api/plan-templates/:id/apply` (6-week apply) | ✅ af620b9 — routes.ts:6963 |
| `storage.applyWeekTemplate()` (week-template apply) | ✅ af620b9 — storage.ts:1706 |
| `storage.importTemplateItems()` (full import) | ✅ af620b9 — storage.ts:1737 |

All system-written paths are gated. The compliance gate is live and correct.

---

## Root cause

The bolognese is **already in `planner_entries`** — written during a template import before commit 1e67eff. The compliance gate is **forward-looking only**: it prevents new non-compliant writes but does not retroactively remove or flag existing saved entries. The user's planner still contains the pre-fix row.

`candidateDietExcluded(meal1478, "Vegan", [])` → **true** (beef + bacon in `MEAT_KEYWORDS`, parmesan in `DAIRY_KEYWORDS`). The filter correctly excludes this meal when called — but it is not called for reads of already-persisted entries.

---

## Recommended next action

| Option | Risk | Description |
|---|---|---|
| Manual one-off (🟢) | None | Delete and re-apply the template. The compliance gate will now skip the bolognese during re-import, giving the user a clean vegan plan. |
| Automated cleanup (🟡) | Low–Medium | Server-side pass: find `planner_entries` where the linked meal fails `shouldExcludeRecipe` for the owning user's `dietPattern`, then remove or badge them. Fully automated; wider scope. |

---

## CODE CHANGES MADE: NONE
