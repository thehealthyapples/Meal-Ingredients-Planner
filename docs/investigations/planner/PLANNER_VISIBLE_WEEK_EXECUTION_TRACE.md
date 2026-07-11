# PLANNER VISIBLE WEEK EXECUTION TRACE: COMPLETE

**Rollback identifier:** `pre-trace-investigation-20260608-185622` (HEAD: `1e83f32`)
**Branch:** main
**Investigation date:** 2026-06-08
**Method:** Direct database queries + source code trace (read-only)

---

## SECTION 1 — TRACE THE VISIBLE WEEK

### Visible planner schema: `planner_weeks` / `planner_days` / `planner_entries`

The UI-visible planner is stored in a **separate database schema** from the Smart Planner's suggestion pipeline:

| Field | Value |
|---|---|
| Table | `planner_weeks` |
| Week ID | 16 |
| Week Number | 4 |
| Week Name | Week 4 |
| Household ID | 44 |
| User ID | 1 |

### Week 4 entry list (all 14 entries)

| Entry ID | Day | Slot | Meal | kind | Category | Source type |
|---|---|---|---|---|---|---|
| 807 | dow=0 | lunch | Quick pizza dough | meal | null | scratch |
| 808 | dow=0 | dinner | Punjabi cauliflower with potatoes (aloo gobi) | meal | Dinner | scratch |
| 809 | dow=1 | lunch | porridge | meal | Baby Meal | scratch |
| 810 | dow=1 | dinner | Quick pizza dough | meal | null | scratch |
| 811 | dow=2 | lunch | Vegan lemon cake | meal | null | scratch |
| 812 | dow=2 | dinner | Vegan banana muffins | meal | null | scratch |
| 813 | dow=3 | lunch | Vegan lemon cake | meal | null | scratch |
| 814 | dow=3 | dinner | Kidney Bean Curry | meal | null | scratch |
| 815 | dow=4 | lunch | Vegan chickpea curry jacket potatoes | meal | null | scratch |
| 816 | dow=4 | dinner | Vegan banana muffins | meal | null | scratch |
| 817 | dow=5 | lunch | Kidney Bean Curry | meal | null | scratch |
| 818 | dow=5 | dinner | Vegan chilli | meal | null | scratch |
| 819 | dow=6 | lunch | One-pot vegan rice and beans | meal | null | scratch |
| 820 | dow=6 | dinner | Vegan chickpea curry jacket potatoes | meal | null | scratch |

**Observations:**
- 14 entries total (7 days × 2 slots = lunch + dinner only)
- **Zero breakfast entries**
- Quick pizza dough appears twice (lunch on dow=0, dinner on dow=1)
- All 14 entries show `meal_source_type = scratch`
- `planner_entries` has no `created_at` column

---

## SECTION 2 — SOURCE OF EACH MEAL

### Meal creation timestamps

| Meal | meal_id | meal_source_type | created_at |
|---|---|---|---|
| porridge | 1385 | scratch | 2026-02-27T23:20:26Z |
| Punjabi cauliflower with potatoes (aloo gobi) | 1475 | scratch | 2026-02-27T23:20:26Z |
| Kidney Bean Curry | 2165 | scratch | 2026-05-20T21:37:34Z |
| Vegan lemon cake | 2214 | scratch | **2026-06-08T09:55:00Z** |
| Quick pizza dough | 2215 | scratch | **2026-06-08T09:55:02Z** |
| Vegan banana muffins | 2216 | scratch | **2026-06-08T09:55:02Z** |
| Vegan chickpea curry jacket potatoes | 2217 | scratch | **2026-06-08T09:55:03Z** |
| One-pot vegan rice and beans | 2218 | scratch | **2026-06-08T09:55:04Z** |
| Vegan chilli | 2220 | scratch | **2026-06-08T09:55:05Z** |

**Finding:** Six of the nine meals (ids 2214–2220) were created in a **5-second burst at 09:55:00–09:55:05 on 2026-06-08**. This is the signature of `autoImportExternalMeal()` running sequentially during `applySmartSuggestion()`.

**Source:** All six were fetched from an external recipe source (Spoonacular) via `/api/smart-suggest/auto-import`, which assigns `mealSourceType: "scratch"` to every imported meal. They entered the user's cookbook as a side effect of applying a Smart Plan.

**Evidence:** `auto-import-service.ts:60` — `mealSourceType: "scratch"`

The three pre-existing meals (porridge, Punjabi cauliflower, Kidney Bean Curry) had been in the user's cookbook prior to this apply.

**Conclusion:** The visible Week 4 was populated by a Smart Plan apply at approximately **2026-06-08T09:55** via `applySmartSuggestion()`.

---

## SECTION 3 — BREAKFAST ROOT CAUSE

**Answer: E — Week predates recent fixes. Specifically: two fixes committed AFTER the apply.**

### Timeline of commits vs. apply

| Time (UTC) | Event |
|---|---|
| 2026-06-08T07:02 | Commit `00a8ee1` — block premium recipes |
| 2026-06-08T09:34 | Commit `cea6e2b` — **component filter added** |
| **2026-06-08T09:55** | **User applied Smart Plan to Week 4** |
| 2026-06-08T13:26 | Commit `96acb98` — **breakfast concept queries fixed** |
| 2026-06-08T13:56 | Commit `1e83f32` — **Tier-3 repeat fallback added** |

### Why breakfast was empty in the 09:55 apply

**Fix missing #1 — breakfast concept queries (commit `96acb98`, 13:26):**

Before this commit, `external-meal-service.ts` did not include `BREAKFAST_CONCEPT_QUERIES` when performing TheMealDB searches for a vegan profile. TheMealDB has no diet-labelled recipes, so without concept queries (e.g. "vegan porridge", "plant-based smoothie"), the breakfast external search returned **zero vegan breakfast candidates**.

With zero internal vegan breakfast candidates (all user breakfast meals are either `mealSourceType=starter` and pre-filtered, or contain dairy/eggs) and zero external breakfast candidates (broken breakfast query), the Smart Plan had **no breakfast entries to generate or apply**.

**Fix missing #2 — Tier-3 repeat fallback (commit `1e83f32`, 13:56):**

Even if one external breakfast recipe had been returned, without Tier-3 the plan would have placed it on day 1 only. Days 2–7 would have been empty because `usedIds` permanently blocked reuse. Since 0 candidates existed, this is secondary here — but confirms why the repair scenario only worked after both commits landed.

The commit message for `1e83f32` explicitly states: *"Impact: Keto 2/7 → 7/7 breakfast filled; Vegan 0/7 → 7/7 when ≥1 external breakfast candidate passes diet filter."* The "Vegan 0/7" baseline is exactly the state at the 09:55 apply.

---

## SECTION 4 — UI BUTTON TRACE

### Full execution path: Planner → Smart button → visible planner

```
UI: PlannerAssistantPanel "Smart" button
↓  weekly-planner-page.tsx:1533 → onRunSmartSuggest: () => runSmartSuggest()
↓
use-smart-suggest.ts:158 → runSmartSuggest()
↓  line 191
POST /api/meal-plans/smart-suggest
↓
routes.ts:4797 — smart-suggest endpoint
↓  lines 4950–4959
generateSmartSuggestion(userMeals, prefs, settings, mealNutrition, categoryMap)
↓
server/lib/smart-suggest-service.ts → generateSmartSuggestion()
↓
Returns SmartSuggestResult { entries: [], stats: {} }
↓  (NO database write occurs here — result returned to client only)
↓
use-smart-suggest.ts:203 → setSmartResult(data)
     SmartReviewPanelContent rendered for user to review

──── User clicks "Apply" ────

use-smart-suggest.ts:222 → applySmartSuggestion()
↓  for each entry in smartResult.entries:
│  if (entry.candidate.isExternal):
│    POST /api/smart-suggest/auto-import   → routes.ts:4965
│    auto-import-service.ts → autoImportExternalMeal()
│    storage.createMeal() → INSERT INTO meals (mealSourceType='scratch')
│    returns { mealId }
│
↓  line 247
POST /api/planner/days/${day.id}/items
↓
routes.ts:5635 — planner/days/:dayId/items endpoint
↓
storage.addPlannerEntry(dayId, mealSlot, 'adult', mealId, ...)
↓
INSERT INTO planner_entries (day_id, meal_type, meal_id, ...)
↓
qc.invalidateQueries({ queryKey: ['/api/planner/full'] })
↓
UI re-fetches GET /api/planner/full → visible planner updates
```

**Key files:**
- `client/src/hooks/use-smart-suggest.ts` — orchestration
- `server/routes.ts:4797` — smart-suggest API endpoint
- `server/lib/smart-suggest-service.ts` — `generateSmartSuggestion()`
- `server/routes.ts:5635` — planner entry write endpoint
- `server/lib/auto-import-service.ts` — external meal persistence

---

## SECTION 5 — MULTIPLE PLANNER CHECK

### System A: Smart Planner suggestion pipeline (generates, does NOT write to visible planner)

| Component | Location |
|---|---|
| Core function | `server/lib/smart-suggest-service.ts` → `generateSmartSuggestion()` |
| API endpoint | `POST /api/meal-plans/smart-suggest` (routes.ts:4797) |
| Database write | **NONE** — returns `SmartSuggestResult` JSON to client only |
| External import | `POST /api/smart-suggest/auto-import` (routes.ts:4965) |
| External import fn | `server/lib/auto-import-service.ts` → `autoImportExternalMeal()` |

### System B: Visible planner (stores what is shown in the UI)

| Component | Location |
|---|---|
| Database tables | `planner_weeks`, `planner_days`, `planner_entries` |
| Fetch all | `GET /api/planner/full` (routes.ts:5984) |
| Fetch weeks | `GET /api/planner/weeks` (routes.ts:5522) |
| Add entry | `POST /api/planner/days/:dayId/items` (routes.ts:5635) |
| Delete entries | `DELETE /api/planner/weeks/:weekId/entries` (routes.ts:5767) |
| Apply template | `POST /api/plan-templates/:id/apply-to-week/:weekId` |

### System C: Legacy meal plans (SEPARATE, unused by current UI)

| Component | Location |
|---|---|
| Database tables | `meal_plans`, `meal_plan_entries` |
| Storage functions | `storage.createMealPlan()`, `storage.getMealPlans()` |
| Current status | 122 rows in `meal_plan_entries` from old template testing — NOT displayed by current UI |
| Note | `/api/meal-plans/smart-suggest` is named after this schema but does NOT write to it |

### Template system (read/write to visible planner)

| Component | Location |
|---|---|
| Save week as template | `POST /api/planner/weeks/:weekId/save-week-template` (routes.ts:5482) |
| Apply template to week | `POST /api/plan-templates/:id/apply-to-week/:weekId` |
| Storage | `meal_plan_templates`, `meal_plan_template_items` |

### The bridge between System A and System B

The ONLY connection is `applySmartSuggestion()` in `use-smart-suggest.ts:222`. Smart Planner results exist purely in client memory (and sessionStorage) until the user explicitly clicks **Apply**. They are never automatically written.

---

## SECTION 6 — SINGLE SOURCE OF TRUTH

**The authoritative generation function is:**

| Item | Value |
|---|---|
| File | `server/lib/smart-suggest-service.ts` |
| Function | `generateSmartSuggestion()` |
| Endpoint | `POST /api/meal-plans/smart-suggest` |

**Every planner generation workflow that uses Smart Planner eventually routes through this path:**

- UI "Smart" button → `runSmartSuggest()` → `POST /api/meal-plans/smart-suggest` → `generateSmartSuggestion()`
- UI "Regenerate single entry" → `regenerateSingleEntry()` → `POST /api/meal-plans/smart-suggest` → `generateSmartSuggestion()`

**Generation paths that bypass Smart Planner entirely:**
- Manual drag/drop or "Add meal" → `POST /api/planner/days/:dayId/items` directly
- Apply template → `POST /api/plan-templates/:id/apply-to-week/:weekId`
- Copy day → `POST /api/planner/days/:dayId/copy`

None of these alternative paths call `generateSmartSuggestion`.

---

## SECTION 7 — CONTRADICTION ANALYSIS

### Why the visible planner shows different results from the validation report

| Factor | Validation report (17:45 run) | Visible planner (Week 4) |
|---|---|---|
| Code state | All 5 fixes committed (HEAD 1e83f32) | BEFORE commits 96acb98 and 1e83f32 |
| Breakfast concept queries | Fixed | Not yet applied |
| Tier-3 repeat fallback | Active | Not yet applied |
| Component filter | Active | Active (committed at 09:34) |
| Breakfast candidates | 1 external (Vegan banana pancakes) | 0 external (query broken) |
| Breakfast slots filled | 7/7 (Tier-3 repeat) | 0/7 (no candidates + no fallback) |
| Total slots filled | 21/21 | 14/21 |
| Quick pizza dough | In dinner slots (null-cat → dinner) | In BOTH lunch and dinner |

**Root cause of contradiction:** The visible Week 4 was written at **09:55 on June 8th** — **21 minutes before** commit `96acb98` (breakfast concept queries) and **4 hours before** commit `1e83f32` (Tier-3 fallback). The validation report ran against the final committed state (17:45).

The fixes ARE correct. The validation DID reflect what the current code produces. The visible planner simply reflects the **stale pre-fix apply** from 09:55.

**Why Quick Pizza Dough appears in a lunch slot in Week 4:** At 09:55, the `getCandidateSlotFit` function's null-category routing behaviour was different from the current code (where `null category → dinner only`). The 09:55 code allowed null-category meals in non-breakfast slots, so QPD was assigned to a lunch slot on one day.

---

## SECTION 8 — FINAL ANSWERS

| Question | Answer | Evidence |
|---|---|---|
| Where did visible meals come from? | Smart Plan applied at 09:55 on 2026-06-08, before fixes 96acb98 and 1e83f32 | Meal created_at timestamps for ids 2214–2220 all 09:55:00–09:55:05 |
| Why is breakfast empty? | Two fixes not yet committed at 09:55: breakfast concept queries (13:26) and Tier-3 fallback (13:56). 0 external breakfast candidates returned; 0 entries written | Commit timestamps vs apply timestamp; Tier-3 commit message: "Vegan 0/7 → 7/7" |
| Second planner exists? | YES — two separate DB schemas. `planner_weeks/days/entries` (visible UI) vs `meal_plans/meal_plan_entries` (legacy, unused by visible UI). BUT Smart Planner service is ONE and the same. | Schema query; routes.ts endpoint audit |
| Is the UI using the same code Claude tested? | YES — UI "Smart" button calls `POST /api/meal-plans/smart-suggest` → `generateSmartSuggestion()`. Claude ran the same function directly. | use-smart-suggest.ts:191; routes.ts:4797 |
| Has Claude been fixing the wrong planner? | NO — the right service was fixed. The visible planner shows a stale apply from before the fixes landed. | Timeline: fixes at 13:26 and 13:56; apply at 09:55 |
| Smallest safe next step | Clear Week 4, run Smart Plan, apply it. The visible planner will then reflect the current fixed code. | No code change needed |

---

## DECISION MATRIX

| Question | Answer | Evidence |
|---|---|---|
| Meal source | Smart Plan apply at 2026-06-08T09:55 — external meals auto-imported via Spoonacular | meal.created_at burst 09:55:00–09:55:05 |
| Empty breakfast | Breakfast concept query fix and Tier-3 fallback committed AFTER the 09:55 apply | Commit timestamps: 13:26 and 13:56 vs 09:55 apply |
| Second planner exists? | YES (two DB schemas) but ONE generation service | planner_weeks vs meal_plans tables; single generateSmartSuggestion() |
| Same code path? | YES — UI uses same endpoint and service Claude tested | use-smart-suggest.ts:191 → routes.ts:4797 → smart-suggest-service.ts |
| Wrong planner fixed? | NO — correct service fixed, visible planner just shows stale data | Timeline analysis |

---

## DATA IMPACT DECLARATION

- Reads existing data: Yes
- Writes new data: No
- Changes meaning of existing data: No
- Requires backfill: No
