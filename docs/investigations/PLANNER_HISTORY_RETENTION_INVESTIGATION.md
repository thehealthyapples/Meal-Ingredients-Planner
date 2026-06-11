# Planner History Retention Investigation

**Date:** 2026-06-10
**Status:** Complete — investigation only
**Rollback tag:** `rollback/planner-history-retention-investigation-20260610-183716`

---

## Summary

The THA planner uses a **fixed 6-slot rolling canvas**. There is no historical retention.
When a user fills, clears, or replaces a week, the old content is gone. No archive, no
soft-delete, no timestamps on the week records themselves.

The 6-week limit is enforced at three independent layers:
- Database CHECK constraint (template items only)
- Application code (loop: `for w = 1 to 6`)
- UI hardcoding (`[1, 2, 3, 4, 5, 6].map(...)`)

Household Familiarity **cannot** be built from current planner data alone. The required
historical signal does not exist. A future learning path would need a new persistence
layer.

---

## 1. Planner Storage Architecture

### Tables

| Table | Purpose | Key fields |
|-------|---------|-----------|
| `planner_weeks` | 6 named week slots per household | `householdId`, `weekNumber` (1–6), `weekName` |
| `planner_days` | 7 day rows per week | `weekId`, `dayOfWeek` (0–6) |
| `planner_entries` | Meal assignments | `dayId`, `mealType`, `mealId`, `audience` |
| `planner_entry_eaters` | Per-entry household eater assignments | `entryId`, `householdEaterId` |
| `planner_week_eater_overrides` | Per-week diet overrides | `weekId`, `eaterId`, `dietTypes` |
| `week_provisioning_items` | Per-week provisioning notes | `weekId`, `mealId`, `name` |

### What is NOT stored

- No `created_at` or `updated_at` on `planner_weeks`
- No `created_at` on `planner_days` or `planner_entries`
- No soft-delete flag on any planner table
- No `archivedAt`, `replacedAt`, or `previousContent` fields
- No history table, audit log, or event log for planner changes

### Week numbering

`weekNumber` is a positional slot (1–6), not a calendar date. Week 1 this month is
the same database row as Week 1 three months ago — it just has different `plannerEntries`
attached to it (or none, if the user cleared it).

---

## 2. The 6-Week Limit

The limit appears at three independent locations:

**Layer 1 — Database CHECK constraint (template items only)**

```sql
-- server/migrations/runner.ts:93
week_number  INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 6),
```
This constraint is on `meal_plan_template_items`, not `planner_weeks` itself.
The `planner_weeks` table has no numeric CHECK constraint — the limit is application-enforced.

**Layer 2 — Application code**

```typescript
// server/storage.ts:1048
for (let w = 1; w <= 6; w++) {
  const [week] = await tx.insert(plannerWeeks).values({
    userId,
    householdId,
    weekNumber: w,
    weekName: `Week ${w}`,
  }).returning();
  // ...
}
```
`createPlannerWeeks` always creates exactly 6 weeks and never more.

**Layer 3 — API validation**

```typescript
// server/routes.ts:6720
weekNumber: z.number().int().min(1).max(6).optional(),
```
Template import endpoint enforces `weekNumber` between 1 and 6.

**Layer 4 — UI hardcoding**

```tsx
// client/src/components/templates-panel.tsx:144
{[1, 2, 3, 4, 5, 6].map(weekNum => (...))}

// client/src/pages/shared-plan-page.tsx:51
{[1, 2, 3, 4, 5, 6].map(week => (...))}
```

**Verdict:** The 6-week limit is enforced at all layers — UI, API, and storage. It is
NOT presentation-only. However, the constraint on `planner_weeks` itself is only the
unique constraint `(userId, weekNumber)` — no database-level numeric range is enforced
on that table. The limit comes from application logic creating exactly 6 rows.

---

## 3. Retention Behaviour

### What happens when a user clears a week

The `DELETE /api/planner/weeks/:weekId/entries` endpoint deletes all `planner_entries`
for that week. The `planner_weeks` and `planner_days` rows are preserved. The week
slot is now empty but still exists.

### What happens when a user fills a week with new meals

Existing entries are overwritten (upsert) or added alongside. No version history is kept.

### What happens at planner reset

`storage.deletePlannerWeeks(userId)` deletes all `planner_days` rows for each week,
then deletes all `planner_weeks` rows. This cascade-deletes all `planner_entries` via
the `ON DELETE CASCADE` relationship on `planner_days`.

After a reset, `createPlannerWeeks` recreates 6 fresh empty slots.

### Summary

| Event | planner_weeks | planner_entries | History preserved? |
|-------|--------------|----------------|--------------------|
| Clear a week | Kept | Deleted | No |
| Replace meals | Kept | Overwritten | No |
| Full reset | Deleted + recreated | Deleted | No |
| User account delete | Cascade deleted | Cascade deleted | No |

---

## 4. Historical Data Availability

**Is older planner data retained?** No.

The planner is a fixed 6-slot canvas. There is no past-week retention, no archival
table, and no query path to see what was in Week 3 six months ago.

**Ingredient history available?** Only what is currently in the 6 active weeks.

**Meal name history available?** Only what is currently in the 6 active weeks.

**Shopping list?** The `shopping_list` table has no `createdAt` column. Items are
cleared by the user, not by date. It reflects the current active list, not history.
`ingredient_sources` links shopping items back to meals and week numbers but shares
the same transient lifecycle.

**Food Diary?** `food_diary_entries` records meal names and has a `createdAt`
timestamp. However:
- It is manually populated (or populated from the planner on user action)
- It records `name` as a text field, not a structured `mealId` or ingredient list
- No direct ingredient data is stored — only meal names
- Diary entries are sparse — not all households use the diary feature

**Meals table?** The `meals` table has `createdAt` and retains all meals ever created
by the user (including forks, variants, and imported meals). However, this tells you
what meals exist in the cookbook, not which meals have been eaten or planned.

---

## 5. Household Familiarity Feasibility

**Can THA determine most frequently used ingredients from existing data?**

| Question | Feasible? | Source | Confidence |
|----------|-----------|--------|------------|
| Most used ingredients across current 6 weeks | Yes | `planner_entries` → `meals.ingredients` | Medium |
| Most used ingredients historically | No | No historical data | — |
| Most used herbs historically | No | No historical data | — |
| Most used seeds historically | No | No historical data | — |
| Most used legumes historically | No | No historical data | — |

**Across the current 6 weeks:** Yes, this is feasible today without schema changes,
using the same pipeline as the existing `weekIngredients` useMemo. The
`buildWeeklyReuseMap` pattern from the weekly reuse implementation can be extended
across all 6 weeks rather than just the `activeWeek`. This gives a 6-week ingredient
frequency snapshot, not a long-term signal.

**Beyond 6 weeks:** Not feasible. The data does not exist.

---

## 6. Data Quality Assessment

### Ingredient data quality (existing planner)

**Reliable signals:**
- Meal-level ingredient lists are `text[]` on the `meals` table — consistent structure
- The `normaliseForReuse` + `resolveIngredientAlias` pipeline already handles prep-word
  and alias noise effectively (built in the weekly reuse implementation)
- System meals have curated ingredient lists — high quality

**Noise sources:**
- User-created meals may have inconsistent ingredient descriptions
- Recipe edits (forked meals) change `meals.ingredients` in place — the original
  ingredient list is not preserved anywhere
- Imported meals (vision parse) can have erratic ingredient phrasing
- When a user edits their version of "Spaghetti Bolognese", the frequency counter
  changes for the fork, but the system meal's count is unaffected

**Distortion risks:**
- **Planner resets:** A full reset deletes all 6 weeks — a freshly reset planner would
  show zero history, even for a user who has been cooking the same meals for months
- **Bulk template loads:** Loading a 6-week template overwrites current content and
  may not reflect actual household cooking behaviour
- **Repeated system meals:** A meal appearing 4 times across 6 weeks may reflect
  deliberate repetition or just a template that was loaded twice

### Food Diary quality (alternative signal)

The Food Diary is more temporally durable (keyed to a calendar date, not a planner
slot) but:
- Not used by all households
- Records meal names only (no ingredient breakdown)
- Manual population is sporadic

---

## 7. Existing Signals Available

| Signal | Location | Ingredient data? | History? | Quality |
|--------|----------|-----------------|---------|---------|
| Active planner (6 weeks) | `planner_entries` → `meals.ingredients` | Yes (full lists) | 6 weeks only | Good |
| Shopping fulfilment memory | `shopping_fulfilment_memory` | Yes (normalised item names) | Unlimited | Good — but reflects what was bought, not what was cooked |
| Food diary entries | `food_diary_entries` | Meal names only | Unlimited (by date) | Sparse — not all users |
| Uplift applications | `meal_uplift_applications` | Single ingredient per row | Unlimited | High quality — reflects user acceptance of boosts |
| Pantry items | `user_pantry_items` | Yes (ingredient keys) | No (current state only) | Reflects "usually have", not "recently used" |
| Meals table | `meals` | Yes (ingredient arrays) | Created date only | Full cookbook, not usage frequency |

---

## 8. Gaps Identified

1. **No planner history table.** The planner has no timestamp, no version, no archive.
   Past plan content is irrecoverably gone after modification.

2. **No ingredient usage event log.** There is no record of "this ingredient was added
   to the planner on this date". The only signal is what is currently in the 6 slots.

3. **No diary ingredient breakdown.** `food_diary_entries` records meal names but not
   ingredient lists. Cross-referencing diary entries back to `mealId` is only possible
   if `sourcePlannerEntryId` was populated — which depends on user workflow.

4. **Shopping list is transient.** The shopping list is cleared by users and carries no
   retention signal for familiarity purposes.

5. **6-week window is too narrow.** Even if all 6 weeks are populated, families with
   rotating meal plans would not have sufficient frequency signal from 6 weeks alone.
   "Often used" requires at minimum 3–6 months of data to distinguish a genuinely
   frequent ingredient from one that happened to appear this cycle.

---

## 9. Implementation Options

### Option A — Use existing retained planner history only

**What:** Scan all 6 current planner weeks and build ingredient frequency from
`planner_entries` → `meals.ingredients`. Weight by occurrence count.

**Complexity:** Very low. The `buildWeeklyReuseMap` pattern already exists; extending
to all 6 weeks requires changing one line.

**Data required:** No new data. Uses `activeWeekData` → expand to all weeks from
`fullPlanner`.

**Risk:** Low. No schema changes. No new queries. Purely client-side computation.

**Expected value:** Low. 6 weeks is too narrow for a reliable "often used" signal.
An ingredient appearing in 2 of 6 weeks may just reflect the current template load,
not genuine household preference.

**Verdict:** Suitable only as a short-term proxy signal. Useful to build the ranking
infrastructure now while awaiting a deeper data source. Label copy should be calibrated
to the window: "In your current plan" rather than "Often used by your household".

---

### Option B — Add lightweight historical aggregation

**What:** When a planner entry is deleted (or a week is cleared), emit an
ingredient-frequency increment to a new lightweight table:
`household_ingredient_history(householdId, ingredientKey, seenCount, lastSeenAt)`.

**Complexity:** Medium. Requires:
- One new table (schema change, migration)
- Hook into `deletePlannerEntry` and `deletePlannerWeeks` server methods
- Client-side display of the aggregated signal

**Data required:** New table. Backfill is impossible (historical data does not exist).
Signal accumulates going forward from migration date only.

**Risk:** Low-medium. The write path is the deletion path — any bug would only affect
the counter, not the planner data itself. Deletion hooks are simple.

**Expected value:** High — over time. After 3–6 months of use the signal becomes
genuinely predictive of household preference. The label "Often used by your household"
becomes accurate after sufficient history accumulates.

**Verdict:** The recommended future path. Low blast radius, no schema changes to
existing tables, signal builds naturally over time. Can coexist with Option A
(use A until B accumulates enough data).

---

### Option C — Dedicated Household Familiarity layer

**What:** A full familiarity scoring system: ingests planner, diary, shopping, and
uplift acceptance signals; weights by recency and frequency; maintains per-household
ingredient profiles; exposes a ranked familiarity API.

**Complexity:** High. Requires:
- Multiple new tables
- Multiple write-path hooks
- A scoring/decay algorithm
- A new API endpoint
- Client integration in uplift, boosts, and meal suggestions

**Data required:** Multiple new tables. All signals need to be ingested consistently.
Partial ingestion (diary alone, or shopping alone) would produce skewed scores.

**Risk:** Medium. More moving parts, more integration points, more places for
consistency bugs. Score quality depends heavily on all sources being populated.

**Expected value:** Highest — but only at scale and after significant time has elapsed.
For most households with 2–4 months of data, scores would be sparse and unreliable.

**Verdict:** Not appropriate yet. Build Option B first. Consider Option C when multiple
signal sources are consistently populated and the familiarity concept has been validated
with users.

---

## 10. Trust Check

### Could historical data create misleading familiarity scores?

Yes, in two scenarios:

1. **Planner resets.** A user who resets their planner to try a new template loses all
   prior frequency signal. If Option A (current weeks only) is used, a single template
   load can make 42 meals look "frequent" overnight — even though the household has
   never cooked them.

2. **Imported meals.** A vision-imported meal plan may contain 30+ meals in a single
   import. Without a recency weighting, these imported meals would immediately dominate
   the frequency signal.

### Distinguishing recently used / frequently used / historically used

| Term | What it means | Data requirement |
|------|---------------|-----------------|
| Recently used | Appeared in this cycle (current 6 weeks) | Option A — available now |
| Frequently used | Appeared in ≥3 of the last 12 weeks | Option B — requires ~3 months of accumulation |
| Historically used | Appeared at any point in the user's planner history | Option C — requires full event log |

**Recommended label for Option A:** "In your current plan" — accurate and not misleading.
**Recommended label for Option B after 8+ weeks:** "Your household often uses this" — justified.

---

## 11. Smallest Future Path

1. **Today (no schema change):**
   Extend `weeklyReuseMap` to span all 6 active weeks. Use as a weak "currently
   present in your plan" signal in the uplift panel. Accurate label: "In your
   current plan" or "Used across your plan". Do not claim frequency or history.

2. **Next sprint (Option B — one new table):**
   Add `household_ingredient_history` table. Hook into `deletePlannerEntry` to
   increment `seenCount` and update `lastSeenAt`. Signal accumulates going forward.
   After 8+ weeks, unlock "Often used by your household" copy.

3. **Future (Option C — full familiarity layer):**
   Once Option B has accumulated 3+ months of data per household, evaluate whether
   additional signals (diary, uplift acceptances) are consistently populated enough
   to warrant a full scoring model.

---

## Appendix: Key File Locations

| File | Relevant section |
|------|-----------------|
| `shared/schema.ts:399–433` | `plannerWeeks`, `plannerDays`, `plannerEntries` table definitions |
| `server/storage.ts:1040–1089` | `createPlannerWeeks` — always creates exactly 6, never more |
| `server/storage.ts:1096–1103` | `deletePlannerWeeks` — hard delete, no archive |
| `server/routes.ts:5767–5787` | `DELETE /api/planner/weeks/:weekId/entries` — clear a week |
| `server/routes.ts:5984–6007` | `GET /api/planner/full` — returns all 6 active weeks |
| `server/migrations/runner.ts:93` | `CHECK (week_number BETWEEN 1 AND 6)` — template items only |
| `client/src/pages/weekly-planner-page.tsx:469–477` | `weekIngredients` useMemo — current approach (active week only) |
| `client/src/lib/ingredient-reuse.ts` | `buildWeeklyReuseMap` — reusable for multi-week extension |
| `shared/schema.ts:1166–1214` | `foodDiaryDays`, `foodDiaryEntries` — temporal signal, meal names only |
| `shared/schema.ts:1129–1146` | `shoppingFulfilmentMemory` — what was bought, not what was cooked |
