# SMART MEAL PLAN PROFILE COMPLIANCE PATH INVESTIGATION: COMPLETE

_Date: 2026-06-06 · Investigation only · No code changes made._

## Rollback identifier

| Item | Value |
|---|---|
| **Tag** | `rollback/planner-compliance-investigation-2026-06-06` |
| **Annotated tag object** | `74f310582fe78583f23bfaaaa01fb4907ab75d7b` |
| **Points at commit** | `1e67eff` — *feat(smart-planner): enforce Profile dietPattern as hard filter via dietRules* |
| **Branch** | `main` |
| **Tracked working tree at tag time** | clean (only untracked `.md`/test scratch files; no tracked modifications) |

Rollback command: `git reset --hard rollback/planner-compliance-investigation-2026-06-06`

**Code changes made: NONE.**

---

## Architecture in one sentence

All planner writes funnel through **4 meal-bearing storage primitives** in `server/storage.ts` that contain **zero diet logic**. Profile compliance is enforced in **exactly one place** — inside `generateSmartSuggestion()` (`smart-suggest-service.ts`), as a *candidate-pool filter during generation*, **not** at the point of persistence. Every other route that reaches those primitives writes whatever `mealId` it is handed.

### Storage write primitives (`server/storage.ts`) — none check diet

| Fn | Line | Meaning |
|---|---|---|
| `upsertPlannerEntry` | 1122 | set/replace a slot's meal |
| `addPlannerEntry` | 1159 | append a meal to a slot |
| `replacePlannerEntryMeal` | 1197 | swap the meal on an entry |
| `updatePlannerEntryMealId` | (decl 332) | re-point entry to forked copy |
| `updatePlannerEntryPosition` / `…Location` / `reorderPlannerEntries` | 1166/1174/1182 | move only — no meal change (N/A) |

### The single compliance gate that *does* exist

`server/lib/dietRules.ts::shouldExcludeRecipe(text, {dietPattern, dietRestrictions})` — the SSoT keyword engine, wrapped by `smart-suggest-service.ts::candidateDietExcluded()`. It is invoked **only** at `smart-suggest-service.ts:316/370/399`, i.e. while building the recommendation pool. It is **never** invoked on a write.

---

## Complete planner-entry path inventory + compliance status

Legend per requested fields: **SD**=system/user-driven · **W?**=writes planner_entries · **excl?**=uses shouldExcludeRecipe/candidateDietExcluded · **pat/res/hh**=reads dietPattern / dietRestrictions / household hard restrictions · **bad?**=can place non-compliant · **R**=risk

### A. SYSTEM-CONTROLLED (meals chosen by THA — must always enforce)

| # | Route / fn | SD | W? | excl? | pat | res | hh | bad? | R |
|---|---|---|---|---|---|---|---|---|---|
| A1 | Smart Planner generate — `POST /api/meal-plans/smart-suggest` → `generateSmartSuggestion` (routes 4922) | system | no (returns suggestions) | **yes** | **yes** (4825) | **yes** (4826) | **yes** (4870-4911 + `isHardExcluded`) | no | 🟢 |
| A1b | Smart apply persist — `POST /api/smart-suggest/auto-import` then `POST /api/planner/days/:id/items` (`use-smart-suggest.ts:216/223`) | system | **YES** | no | no | no | no | only if pool corrupted | 🟡 (relies on A1 upstream; write itself unguarded) |
| A2 | Apply plan template — `POST /api/plan-templates/:id/apply` (routes 6959) → `upsertPlannerEntry` | system | **YES** | **no** | no | no | no | **YES** | 🔴 |
| A3 | Apply week template — `POST /api/plan-templates/:id/apply-to-week/:weekId` → `storage.applyWeekTemplate` (1718) | system | **YES** | **no** | no | no | no | **YES** | 🔴 |
| A4 | Import template (scoped) — `POST /api/plan-templates/:id/import` → `storage.importTemplateItems` (1774) | system | **YES** | **no** | no | no | no | **YES** | 🔴 |
| A5 | Seed demo data — `storage.seedDemoData` (3140) via `auth.ts:353` on demo-account creation | system | **YES** | **no** | no | no | no | **YES** (hardcoded salmon/chicken) | 🟠 (demo accounts only) |
| — | Scheduled/cron generation | — | — | — | — | — | — | — | **none found** |
| — | Onboarding-generated plans | — | — | — | — | — | — | — | **none found** |

### B. USER-CONTROLLED (intentional user placement — identified separately)

| # | Route / fn | SD | W? | excl? | bad? | R | UI surfaces |
|---|---|---|---|---|---|---|---|
| B1 | Set/replace slot — `PUT /api/planner/days/:dayId/entries` → `upsertPlannerEntry` (5546) | user | **YES** | no | yes | 🟡 | `use-planner-operations.ts:51`, `PlannerBulkAssignPanel.tsx:84` |
| B2 | **Add meal to day** — `POST /api/planner/days/:dayId/items` → `addPlannerEntry` (5619) | user | **YES** | no | yes | 🟡 | **shared endpoint**: AddToWeekModal (cookbook / My Meals), day-view-drawer, meal-completion-dialog, **scan-confirm-dialog (barcode/freezer/packaged)**, meals-page, manual placeholder create, client duplicate-day, **+ Smart apply A1b** |
| B3 | Replace entry meal — `PATCH /api/planner/entries/:entryId/meal` → `replacePlannerEntryMeal` (5679) | user | **YES** | no | yes | 🟡 | swap/refresh meal |
| B4 | Duplicate entry — `POST /api/planner/entries/:entryId/duplicate` → `addPlannerEntry` (5833) | user | **YES** | no | copies existing | 🟢 |  |
| B5 | Copy day — `POST /api/planner/days/:dayId/copy` → `addPlannerEntry` (5882) | user | **YES** | no | copies existing | 🟢 |  |
| B6 | Move/reorder — `PATCH …/reorder`, `PATCH …/:entryId` | user | position only | n/a | no (no meal change) | 🟢 | drag/drop |
| B7 | Uplift fork re-point — `updatePlannerEntryMealId` (routes 9819) | system | **YES** | no | no (same recipe, user-private fork) | 🟢 |  |

### Out of scope / not a planner-write path

- **DELETE** routes (entry / week entries / slot): removal only.
- `POST /api/food-diary/:date/copy-from-planner`: writes the **food diary**, not `planner_entries`.
- `save-week-template` / `snapshotPlannerToTemplate` / `snapshotWeekToTemplate`: read planner → write **template** rows.
- **Legacy table `meal_plan_entries`** (`mealPlanEntries`): `addMealPlanEntry` exists in storage but has **no active route caller**; only deletes + `template-migration.ts` touch it. Not an active planner-entry path. (Active planner = `planner_entries`.)

---

## Known bypasses (can silently add non-compliant meals)

1. **🔴 Template apply / apply-to-week / import (A2, A3, A4)** — system-chosen meals written with no diet filter. *This is the documented "beef-and-bacon recipe in a Vegan plan" route.*
2. **🟠 Seed demo data (A5)** — hardcoded animal-protein meals seeded regardless of (future) profile; demo accounts only.
3. **🟡 All manual placement (B1, B2, B3)** — `PUT entries`, `POST items`, `PATCH …/meal` validate **only meal ownership** (`isSystemMeal || userId===me`), never diet. B2 is the highest-traffic surface (8+ UI callers, incl. barcode scan and the Smart-apply persist step A1b).
4. **🟡 Smart apply persist (A1b)** — correct today only because A1 pre-filtered the pool; the persistence endpoint has no independent guard, so any client-supplied `mealId` is accepted.

---

## Single-source-of-truth review

- **Is there one compliance gate?** Conceptually yes (`shouldExcludeRecipe` is the SSoT *engine*); architecturally **no** — it is only wired into generation pool-building, not into persistence.
- **Where should it live?** At the **write layer** — a single guard between routes and the storage primitives, so no route can persist a meal it hasn't checked.
- **Which paths bypass it?** Every path except A1 (see table) — all writes (A2–A5, B1–B3, A1b).
- **Which paths duplicate logic?** None duplicate the *diet* engine (good — single engine). The **household hard-restriction** check, however, is reimplemented inline in the smart-suggest route (4870-4911) and not reused by any write path.
- **Safest architecture:** one server-side function `assertMealCompliantForPlanner(meal, userId, mode)` that resolves meal text + `users.dietPattern` + `users.dietRestrictions` + household hard restrictions and delegates to `shouldExcludeRecipe`. Invoke it inside the storage primitives (or a thin wrapper service) so it cannot be bypassed; `mode: "system"` blocks, `mode: "manual"` warns-or-blocks per policy.

---

## Key questions — answers

1. **How many planner-entry paths?** ~**11** distinct meal-placing entry points (A1/A1b–A5, B1–B5, B7) collapsing onto **4** storage primitives; B2 alone fronts 8+ UI surfaces.
2. **Which already enforce compliance?** **Only A1** (Smart Planner generation) — and it enforces all three: dietPattern, dietRestrictions, household hard restrictions.
3. **Which do not?** Everything else — A1b, A2, A3, A4, A5, B1, B2, B3.
4. **Which can *silently* add non-compliant meals?** A2/A3/A4 (templates — highest), A5 (demo seed), B1/B2/B3 (manual). A1b if the pool is ever compromised.
5. **System-generated:** A1, A1b, A2, A3, A4, A5, B7.
6. **User-driven:** B1, B2, B3, B4, B5, B6.
7. **Smallest architecture guaranteeing "system-recommended meals always respect Profile":** a single write-layer `assertMealCompliantForPlanner()` reusing the existing `shouldExcludeRecipe` SSoT, applied to the system paths (A2, A3, A4, A5, A1b) first.

---

## Smallest safe implementation sequence (recommendation only — NOT implemented)

1. **Extract** `isMealCompliantForUser(meal, userId)` — resolves meal name+ingredients+category text, loads `users.dietPattern`/`dietRestrictions` + household hard restrictions, delegates to `shouldExcludeRecipe`. (Reuses SSoT; adds no new keyword logic.)
2. **Gate the system paths** (must always comply): `applyWeekTemplate`, `importTemplateItems`, `POST /plan-templates/:id/apply`, `seedDemoData`, and the Smart-apply persist (A1b). Skip/relabel non-compliant items.
3. **Decide manual policy** for B1/B2/B3 (warn-and-allow vs block) and apply the same guard with `mode:"manual"`.
4. **Reconcile pre-existing persisted entries** (already flagged as pre-dating enforcement) — separate effort; needs backfill, explicitly out of this investigation's scope.

---

## Risk assessment

🟢 **GREEN — investigation only. No code, schema, filter, template, or planner-entry changes were made.** Rollback point captured above. The substantive product risk surfaced: **system-controlled template-apply paths (A2–A4) write THA-chosen meals with no Profile compliance gate**, which is the most likely source of non-compliant meals (e.g. meat/fish in a Vegan plan) entering a Smart Meal Plan.

---

## Data impact declaration

- Reads existing data: **Yes**
- Writes new data: **No**
- Changes meaning of existing data: **No**
- Requires backfill: **No**
