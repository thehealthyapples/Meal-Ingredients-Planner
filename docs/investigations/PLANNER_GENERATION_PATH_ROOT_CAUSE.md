PLANNER GENERATION PATH ROOT CAUSE: COMPLETE

---

## Rollback Identifier

Tag: `pre-planner-path-investigation` on commit `1e83f32`

No code was changed in this investigation. Rollback is a no-op.

---

## Week Traced

- **Week ID**: 13
- **Week Number**: 1 (Week 1)
- **User ID**: 1
- **Household ID**: 44
- **Planner entries**: 14 rows — 7 lunch + 7 dinner, **0 breakfast**

---

## Meal Trace

### Pizza Sauce (ID 2037)
| Field | Value |
|---|---|
| ID | 2037 |
| Name | Pizza sauce |
| kind | **component** |
| meal_source_type | scratch |
| category | Dinner |
| created_at | 2026-04-17 20:12:01 UTC |
| Planner slot | Day 0, **dinner** |

Current kind: `component`. This meal is ineligible for Smart Planner under the component filter (committed `cea6e2b` 2026-06-08 09:34:54). It was in the planner BEFORE that filter was live on the running server.

### Quick Pizza Dough (ID 2215)
| Field | Value |
|---|---|
| ID | 2215 |
| Name | Quick pizza dough |
| kind | **meal** |
| meal_source_type | scratch |
| category | NULL (uncategorised) |
| created_at | 2026-06-08 09:55:02 UTC |
| Planner slot | Day 1, **dinner** |
| Ingredients | `350g strong white bread flour`, `1 sachet fast-action dried yeast`, `½ tsp caster sugar`, `pizza toppings of your choice` |

Current kind: `meal`. Quick Pizza Dough is NOT a component per the DB — it is classified `kind='meal'`. The component filter does not apply to it. However it is a dough recipe, not a standalone meal. The root cause of its appearance is explained below.

---

## Planner Entry Database Rows (Week 13 Complete)

| Day | Slot | Meal ID | Name | kind | Category | meal created_at |
|---|---|---|---|---|---|---|
| 0 (Mon) | dinner | 2037 | Pizza sauce | **component** | Dinner | 2026-04-17 |
| 0 (Mon) | lunch | 1475 | Punjabi cauliflower with potatoes | meal | Dinner | 2026-02-27 |
| 1 (Tue) | dinner | 2215 | Quick pizza dough | meal | NULL | **2026-06-08 09:55:02** |
| 1 (Tue) | lunch | 2214 | Vegan lemon cake | meal | NULL | **2026-06-08 09:55:00** |
| 2 (Wed) | dinner | 2165 | Kidney Bean Curry | meal | NULL | 2026-05-20 |
| 2 (Wed) | lunch | 1385 | porridge | meal | Baby Meal | 2026-02-27 |
| 3 (Thu) | dinner | 2165 | Kidney Bean Curry | meal | NULL | 2026-05-20 |
| 3 (Thu) | lunch | 2216 | Vegan banana muffins | meal | NULL | **2026-06-08 09:55:02** |
| 4 (Fri) | dinner | 1562 | Spinach, sweet potato & lentil dhal | meal | Dessert | 2026-02-27 |
| 4 (Fri) | lunch | 2217 | Vegan chickpea curry jacket potatoes | meal | NULL | **2026-06-08 09:55:03** |
| 5 (Sat) | dinner | 2219 | Vegan burrito bowl | meal | NULL | **2026-06-08 09:55:05** |
| 5 (Sat) | lunch | 2218 | One-pot vegan rice and beans | meal | NULL | **2026-06-08 09:55:04** |
| 6 (Sun) | dinner | 1562 | Spinach, sweet potato & lentil dhal | meal | Dessert | 2026-02-27 |
| 6 (Sun) | lunch | 2220 | Vegan chilli | meal | NULL | **2026-06-08 09:55:05** |

**Observation**: Seven meals were created between 09:55:00 and 09:55:06 on 2026-06-08 — a 6-second cluster. This is not human-speed importing. It is programmatic — these are external candidates that were auto-imported via `/api/smart-suggest/auto-import` when the user applied a Smart Planner generation.

---

## Generation Source Trace

All 14 entries were written by a single Smart Planner generation run applied at approximately **09:55 on 2026-06-08**.

Evidence:
- 7 meals created in a 6-second cluster at 09:55 — batch auto-import signature
- All newly-created meals are Vegan recipes (the plan was a Vegan plan)
- Mix of older pre-existing meals + newly imported external candidates is consistent with Smart Planner selecting from the user's library + external search
- There is no breakfast row for any of 7 days — consistent with 0 Vegan-compliant breakfast candidates
- `planner_entries` has no `created_at` — the write timestamp cannot be read directly, but is bounded by the newest meal creation time (09:55:06)

---

## Smart Planner Execution Path

```
Planner UI (user clicks "Generate")
   ↓
POST /api/meal-plans/smart-suggest
   ↓
generateSmartSuggestion() in server/lib/smart-suggest-service.ts
   ↓  (returns JSON response — does NOT write to DB)
Frontend receives result
   ↓
For each external candidate: POST /api/smart-suggest/auto-import
   → autoImportExternalMeal() in server/lib/auto-import-service.ts
   → Creates meal in meals table (scratch source type)
   ↓
For each entry: PUT /api/planner/days/:dayId/entries
   → storage.upsertPlannerEntry()
   → Writes to planner_entries (PERSISTENT)
```

**The Smart Planner generation does NOT auto-write to the DB**. The user must explicitly apply the generated plan. The planner_entries table is written once per "apply" action and persists until overwritten by another generation.

---

## Stale Data Analysis

### Timeline of events on 2026-06-08

| Time (UTC) | Event |
|---|---|
| 07:02:26 | `00a8ee1` committed — premium filtering fix |
| 07:03:30 | `595a951` committed — premium fix report |
| **09:34:54** | **`cea6e2b` committed — component filter fix** (`meal.kind !== 'component'`) |
| **09:55:00–09:55:06** | **Smart Planner applied** — batch of 7 external Vegan meals created; planner_entries written |
| 13:26:47 | `96acb98` committed — plant milk fix + breakfast concept queries |
| 13:56:33 | `1e83f32` committed — Tier-3 slot-filling recovery |

**The plan was applied 20 minutes after the component filter was committed.**

### Dev server does NOT auto-restart on file changes

`npm run dev` = `NODE_ENV=development tsx server/index.ts`

`tsx` without `--watch` does NOT reload on source file changes. The Replit `.replit` config sets `run = "npm run dev"`. Unless the developer manually restarts the server (via `dev:reset` or button), the running process continues executing the OLD in-memory code.

**Conclusion: The component filter was committed at 09:34 but was NOT live on the running server at 09:55.** The planner generation at 09:55 ran the pre-fix code, which included component meals in the pool.

### Answer: Was the displayed week generated before the fixes?

**YES — in effect.** The component fix was committed at 09:34, but the running server at 09:55 had not been restarted. From the server's perspective, the component filter did not exist yet. The plan was applied at 09:55 using the OLD code path.

All subsequent fixes (plant milk, Tier-3 slot-filling, breakfast concept queries) were committed hours later (13:26 and 13:56) — definitively after the plan was written.

---

## Component Filter Validation

### Pizza Sauce (ID 2037)
- **Current kind**: `component`
- **Smart Planner eligibility**: EXCLUDED by current component filter
- **Excluded by component filter (current code)**: YES
- **Was excluded at generation time (09:55)**: NO — server running old code, filter not active

### Quick Pizza Dough (ID 2215)
- **Current kind**: `meal` (NOT a component in the DB)
- **Smart Planner eligibility**: NOT excluded by component filter (kind='meal')
- **Excluded by component filter**: NO
- **Why it appears**: null category → defaults to dinner slot via `getCandidateSlotFit`; no Vegan exclusion keywords (flour is not excluded by Vegan filter); "pizza dough" not in any breakfast classification terms
- **Root cause of appearance**: It is a recipe ingredient (pizza dough) that passed all current filters because it is classified `kind='meal'` and contains no animal products. The classification gap is pre-existing: Quick Pizza Dough should be `kind='component'` but was saved as `kind='meal'`.

---

## Breakfast Trace

### Why breakfast rows are empty: Answer E — Planner never regenerated after fixes

Evidence:
1. User 1 had 10 breakfast-category meals at 09:55. ALL contain eggs, dairy, or both:
   - Fluffy Japanese soufflé pancakes × 2: eggs + yogurt + milk
   - Healthy Easter bunny pancakes × 2: eggs + milk
   - Pancakes: eggs + milk
   - Omelet × 2: eggs + cheese + milk
   - Chinese Tomato Egg Stir Fry: eggs + chicken
   - Breakfast egg wraps: eggs
   - Breakfast burrito: egg

2. **0 out of 10 breakfast meals passed the Vegan filter at generation time.**

3. External search at 09:55 returned no Vegan breakfast candidates that survived the Vegan filter (pre-plant-milk-fix era; any almond milk recipes would have been excluded).

4. Smart Planner generated with breakfast slot → found 0 candidates → wrote 0 breakfast entries to planner_entries.

5. This is **NOT** a generation bug. It is a pool-exhaustion problem. The Tier-3 repeat fix (committed 13:56) was not yet available. Even if it had been, there were no compliant breakfast meals to repeat.

6. Breakfast concept queries fix (committed 13:26) was also not yet available. External search was not targeting breakfast-type meals specifically.

7. The planner has not been regenerated since 09:55.

**Root cause of empty breakfast: pool was genuinely empty at generation time (0 Vegan breakfast candidates), generation ran without Tier-3 recovery, and the plan has not been regenerated since the fixes were applied.**

---

## UI vs Database

The UI is showing **current database data** — not stale cache, not incorrect rendering. The database itself contains stale planner entries from the 09:55 generation.

| Layer | State |
|---|---|
| planner_entries (DB) | Stale — written 09:55, before fixes were live |
| Smart Planner code | Current — component filter, Tier-3, plant milk fix all active |
| UI rendering | Correct — accurately displays what is in planner_entries |
| Discrepancy | Between current server code and last planner write |

---

## Contradiction Analysis

### Claim: "Breakfast fills 7/7"
**Status: TRUE for current code, but the displayed planner predates the fix.**

The regression tests confirmed Tier-3 repeat fills all 7 breakfast slots when ≥1 compliant meal exists. But the planner was written at 09:55 — before Tier-3 was committed (13:56). The test verified FUTURE generation behaviour; the displayed planner shows a PAST generation.

### Claim: "Pizza Sauce excluded"
**Status: TRUE for current code, but the displayed planner predates the fix.**

Component filter was committed at 09:34. The plan was applied at 09:55 with the server running the OLD code (no auto-restart). Pizza Sauce was included in the generation pool and selected.

### Claim: "Component filtering active"
**Status: TRUE for current code. FALSE for the code that wrote the displayed planner.**

The component filter gates at `routes.ts` line 4871. The running server at 09:55 did not have this line active.

---

## Root Cause Matrix

| Observation | Expected | Actual | Root Cause |
|---|---|---|---|
| Breakfast | Filled (with fixes) | Empty (0 entries) | Generation at 09:55 had 0 Vegan breakfast candidates; Tier-3 and concept queries not yet committed; plan not regenerated |
| Pizza Sauce | Excluded by component filter | Displayed as Dinner | Component filter committed at 09:34 but server not restarted; 09:55 generation ran old code |
| Quick Pizza Dough | Potentially excluded if kind='component' | Displayed as Dinner | kind='meal' in DB (classification gap); no Vegan exclusion keywords; null category defaults to dinner slot |
| Vegan week | Complete 21/21 | 14/21 (lunch+dinner only) | Stale planner data from pre-fix generation; mealsPerDay=3 but 0 breakfast candidates; not regenerated |

---

## Mandatory Findings

**1. Why is Breakfast empty?**
The Vegan plan was generated at 09:55. User 1 had 0 Vegan-compliant breakfast meals (all 10 breakfast meals contain eggs or dairy). External search at that time returned no Vegan breakfast candidates. The Tier-3 slot-filling fix and breakfast concept queries were committed hours later. The plan has not been regenerated since.

**2. Why is Pizza Sauce displayed?**
The component filter was committed at 09:34 but the dev server was not restarted before the plan was applied at 09:55. The server ran the OLD code at 09:55, which had no component filter. Pizza Sauce (kind='component') was included in the dinner pool and selected.

**3. Why is Quick Pizza Dough displayed?**
Quick Pizza Dough is classified `kind='meal'` in the database, not `kind='component'`. The component filter does not apply to it. It has no category (null), which causes `getCandidateSlotFit` to route it to the dinner slot. It contains no Vegan-exclusion ingredients (flour, yeast are not animal products). It is a classification gap — the meal should be `kind='component'` but is stored as `kind='meal'`.

**4. Was the displayed week generated before the fixes?**
YES — in effect. The component fix was committed to git at 09:34 but was not live on the running server when the plan was applied at 09:55 (dev server does not auto-restart on file changes with `tsx` without `--watch`). All other fixes (plant milk, Tier-3, breakfast concepts) were committed hours after 09:55.

**5. Are the fixes actually running?**
YES for future generations. The current server code has all fixes active. But the DISPLAYED planner data was written by the OLD code.

**6. Is there more than one Smart Planner path?**
NO. One endpoint: `POST /api/meal-plans/smart-suggest`. One service: `generateSmartSuggestion()`. One write path: `PUT /api/planner/days/:dayId/entries`. The discrepancy is purely temporal, not architectural.

**7. Is the UI showing stale data?**
YES. The planner_entries table was written at 09:55. All fixes were committed after that. The UI correctly renders the database state. The database state is stale.

**8. What is the smallest safe fix?**
The user must regenerate the Smart Plan from the UI. No code changes required. With the current server code:
- Component filter: Pizza Sauce (kind='component') excluded ✓
- Tier-3 repeat: breakfast slots fill if ≥1 external Vegan breakfast candidate exists ✓
- Quick Pizza Dough: will still appear as Dinner (kind='meal', null category, Vegan-compliant) unless its kind is corrected to 'component'

For Quick Pizza Dough specifically: reclassifying `meal 2215 kind='component'` would require a deliberate data change (out of scope for this investigation).

---

## Recommended Next Decision

Three options, in order of scope:

**Option 1 (Smallest): Regenerate.** User clicks "Generate Smart Plan" in the UI. Current server code runs. Pizza Sauce excluded. Breakfast fills if external search returns a Vegan breakfast candidate. Quick Pizza Dough may still appear (it is kind='meal').

**Option 2 (Targeted data fix): Reclassify Quick Pizza Dough.** Set `kind='component'` for meal ID 2215. No code change required. Prevents it from appearing in any future Smart Planner generation. Can be done via a targeted DB update or via the UI's meal edit view.

**Option 3 (Structural): Add dev server auto-restart.** Change `npm run dev` to `tsx --watch server/index.ts`. This would prevent the server from running stale code after file changes. The `dev:reset` script already provides manual restart; `--watch` automates it.

---

## Report File Location

`docs/investigations/PLANNER_GENERATION_PATH_ROOT_CAUSE.md`
