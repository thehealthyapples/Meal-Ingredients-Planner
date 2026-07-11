# THA — Current Development Drift Analysis

**Generated:** 2026-06-09
**Rollback Point:** `rollback/project-overview-investigation-20260609-202306` → commit `1e83f32`
**Branch:** main
**Ahead of origin/main:** 14 commits (not yet pushed to production)
**Investigation type:** Read-only diff and workspace analysis
**Risk level:** GREEN — No application code modified

---

## 1. Git Status Summary

```
On branch: main
Ahead of origin/main: 14 commits

Modified (unstaged):
  M  package.json
  M  server/lib/household-meal-matcher.ts

Untracked (not staged, not committed):
  SMART_PLANNER_DIETARY_PATTERN_AUDIT.md          (root — misplaced)
  docs/investigations/cookbook/COMPONENT_MEAL_ADAPTABILITY_RANKING.md
  docs/investigations/cookbook/COMPONENT_MEAL_CATALOGUE_RANKING.md
  docs/investigations/cookbook/COMPONENT_MEAL_RECOVERY_FEASIBILITY.md
  docs/investigations/cookbook/COOKED_BREAKFAST_MEAL_SHELL_SEED.md
  docs/investigations/planner/HOUSEHOLD_EATERS_INTEGRATION_AUDIT.md
  docs/investigations/knowledge/KETO_LOW_CARB_DIETARY_DICTIONARY_IMPLEMENTATION.md
  docs/investigations/cookbook/LIVE_HOUSEHOLD_COMPONENT_MEAL_VALIDATION.md
  docs/investigations/planner/MATCH_MEALS_HOUSEHOLD_EATERS_IMPLEMENTATION.md
  docs/investigations/planner/MATCH_MEALS_HOUSEHOLD_EATERS_MIGRATION_SCOPE.md
  docs/investigations/cookbook/MEAL_TEMPLATE_ARCHITECTURE_AUDIT.md
  docs/investigations/cookbook/MEAL_TEMPLATE_SLOT_WRITE_PATH_INVESTIGATION.md
  docs/investigations/planner/PLANNER_GENERATION_PATH_ROOT_CAUSE.md
  docs/investigations/planner/PLANNER_VISIBLE_WEEK_EXECUTION_TRACE.md
  docs/investigations/planner/SMART_PLANNER_CANDIDATE_POOL_TRACE.md
  docs/investigations/planner/SMART_PLANNER_DISCOVERY_STRATEGY_AUDIT.md
  docs/investigations/planner/SMART_PLANNER_EXTERNAL_BACKFILL_FEASIBILITY.md
  docs/investigations/planner/SMART_PLANNER_POST_RESTART_VALIDATION.md
  server/seeds/seed-meal-shell-templates.ts
  server/tests/diet-audit-matrix.ts
  server/tests/dry-run-planner-compliance-cleanup.ts
  server/tests/test-diet-reconciliation-bridge.ts
  test-db-connect.ts                               (root — temporary diagnostic)
```

---

## 2. Commits Ahead of origin/main (Unpushed)

All 14 commits are on `main` but have not been pushed to `origin/main`. In reverse chronological order:

| # | Commit | Type | Summary |
|---|---|---|---|
| 1 | `1e83f32` | fix | Smart Planner: Tier-3 controlled-repeat fallback for exhausted slot pools |
| 2 | `96acb98` | fix | Smart Planner: plant milk false positive; breakfast concept queries; category classification |
| 3 | `cea6e2b` | fix | Smart Planner: exclude component recipes from candidate pool |
| 4 | `595a951` | chore | Add premium recipe fix report and root summary |
| 5 | `00a8ee1` | fix | Smart Planner: block premium/subscriber-only recipes from Smart Planner |
| 6 | `b48ceee` | feat | dietRules: comprehensive Keto/Low-Carb exclusion dictionary |
| 7 | `544c18c` | chore | Archive investigation and working notes to docs/investigations/ |
| 8 | `c84a7a9` | test | Smart Planner: regression tests for dietary trust fix |
| 9 | `9f5070d` | fix | Smart Planner: invalidate stale sessions; gate ingredient-less user meals for restricted profiles |
| 10 | `0644578` | feat | Smart Planner: require ingredient verification before external recipe recommendation |
| 11 | `ce755a7` | fix | dietRules: Profile dietary title-safety for ingredient-less external candidates |
| 12 | `af620b9` | feat | Planner: single Profile compliance gate for system-generated writes |
| 13 | `1e67eff` | feat | Smart Planner: enforce Profile dietPattern as hard filter via dietRules |
| 14 | `6503356` | feat | Smart Planner: dietary-aware external recipe search |

**Theme of the unpushed commit range:** The entire 14-commit run is a focused quality + safety campaign on the Smart Planner dietary compliance pipeline — from adding dietary-aware external recipe search (commit 14, the oldest) through to exhausted-slot fallback logic (commit 1, HEAD). No schema migrations, no new user-facing pages, and no API route additions are included in this range.

---

## 3. Modified Source Files (Unstaged)

### 3.1 `package.json` — Minor (1 line added)

**Change type:** `npm run` script addition  
**Exact diff:**

```diff
+    "seed:meal-shells": "tsx server/seeds/seed-meal-shell-templates.ts",
```

**What this enables:** Adds `npm run seed:meal-shells` as a first-class npm script, pointing at the untracked `server/seeds/seed-meal-shell-templates.ts`. The script was previously runnable via `npx tsx` directly; this change wires it into the standard project script surface alongside `seed:additives`.

**Risk:** Zero — no application logic changed. The seed script itself is untracked (not yet committed); adding the npm entry before committing the script creates a transient state where the script is registered but not yet in the tree. Harmless until `seed:meal-shells` is run.

**Status:** Ready to commit alongside `server/seeds/seed-meal-shell-templates.ts`.

---

### 3.2 `server/lib/household-meal-matcher.ts` — Significant (migration to `household_eaters`)

**Change type:** Data source migration — replaces `household_members` + `users` JOIN with `household_eaters` table query  
**Lines changed:** ~46 lines replaced  
**Function affected:** `matchMealsForHousehold(userId, weekId?)`

**Before (committed state):**
```typescript
// Queried: household_members JOIN users
// Limitation: only users with accounts were visible
// userId type: number (non-nullable)
// weekId parameter: did not exist
const memberRows = await db
  .select({ member: householdMembers, user: {...} })
  .from(householdMembers)
  .innerJoin(users, eq(householdMembers.userId, users.id))
  .where(and(eq(...), eq(householdMembers.status, "active")));
```

**After (unstaged state):**
```typescript
// Queries: household_eaters (direct)
// Includes: non-account members (children, guests) — previously invisible
// userId type: number | null (nullable — supports non-user eaters)
// weekId parameter: added — enables per-week diet override loading
// Uses: dbEaterToHouseholdEater() + getEffectiveDietProfile() from shared/household-eater.js
const eaterRows = await db
  .select()
  .from(householdEaters)
  .where(eq(householdEaters.householdId, householdId))
  .orderBy(householdEaters.id);

// Weekly override loading (new — no-op when weekId not provided):
let overrideMap = new Map<number, { dietTypes: string[] }>();
if (weekId != null) {
  const overrides = await db
    .select()
    .from(plannerWeekEaterOverrides)
    .where(eq(plannerWeekEaterOverrides.weekId, weekId));
  overrideMap = new Map(overrides.map(o => [o.eaterId, { dietTypes: o.dietTypes }]));
}
```

**Key behavioural differences introduced by this change:**

| Aspect | Before | After |
|---|---|---|
| Non-account members (children) | Invisible — excluded from scoring | Included — read from `household_eaters` |
| Diet profile source | `user_preferences.dietTypes` only | `getEffectiveDietProfile(eater, override)` — union of hard restrictions + diet types |
| Hard restrictions | Not applied | Applied as `excludedIngredients` via `profile.hardRestrictions.map(r => r.toLowerCase())` |
| Weekly overrides | Not supported | Loaded from `planner_week_eater_overrides` when `weekId` is provided |
| userId nullability | `number` (assumed account holder) | `number | null` — explicitly handles non-user eaters |
| Imports removed | `householdMembers`, `users`, `and` | Replaced by `householdEaters`, `plannerWeekEaterOverrides`, `dbEaterToHouseholdEater`, `getEffectiveDietProfile` |

**Status:** Functional and consistent with the investigation documents (`MATCH_MEALS_HOUSEHOLD_EATERS_IMPLEMENTATION.md`). The function remains dead code (not wired to any route) but the migration is correct and ready to commit.

**Risk:** Low — the function is not called from any route handler. The change is isolated to this file and uses only existing schema tables and shared utilities.

---

## 4. Untracked Assets — Detailed Inventory

### 4.1 Application Code (untracked, not committed)

#### `server/seeds/seed-meal-shell-templates.ts` (345 lines)

**Purpose:** Idempotent seed script for component meal shell templates.  
**Status:** Complete and executable. Wired to `npm run seed:meal-shells` via the `package.json` change.  
**What it seeds:** Currently seeds one shell — `Cooked Breakfast` (id=633 in production, verified live).  
**Architecture:**
- Defines a `MealShellDef` interface matching the `mealTemplates` table slot fields
- Uses `DRY_RUN=true` environment flag for preview mode
- Performs case-insensitive name lookup before each insert (idempotent)
- Inserts via `pool.query()` with parameterised arrays (bypasses the PATCH API route limitation confirmed in `MEAL_TEMPLATE_ARCHITECTURE_AUDIT.md`)
- Reports inserted / skipped counts on completion

**Relationship to package.json change:** The `seed:meal-shells` npm script added to `package.json` points directly at this file.

---

#### `server/tests/diet-audit-matrix.ts` (3,462 bytes, created 2026-06-07)

**Purpose:** Manual audit test — generates a dietary exclusion matrix showing which diet patterns exclude which test meals.  
**Status:** Standalone diagnostic script. Not wired to `npm run test`.  
**What it tests:** 18 representative meals × 10 diet patterns (Keto, Low-Carb, Paleo, Carnivore, Mediterranean, DASH, MIND, Flexitarian, Vegetarian, Vegan) using `shouldExcludeRecipe()` from `dietRules.ts`.  
**Output format:** Console matrix (padded columns). No assertions — visual audit only.

---

#### `server/tests/dry-run-planner-compliance-cleanup.ts` (8,338 bytes, created 2026-06-06)

**Purpose:** Dry-run diagnostic that identifies which existing planner entries would fail the compliance gate without modifying any data.  
**Status:** Standalone read-only script. Not wired to `npm run test`.  
**What it does:** Queries `planner_weeks → planner_days → planner_entries`, runs each entry through `resolvePlannerComplianceContext → isComplianceActive → isMealCompliantForUser`, and reports entries that would be removed by a compliance cleanup pass.  
**Risk:** Zero data risk (explicitly read-only by design).

---

#### `server/tests/test-diet-reconciliation-bridge.ts` (9,975 bytes, created 2026-06-06)

**Purpose:** Unit tests for the Profile → Planner diet bridge logic (canonical diet mapping + scoring coverage for newly-added diet types).  
**Status:** Test script with assertions. Not wired to `npm run test`.  
**What it tests:** `scoreMeal()` from `meal-scoring-service.ts` against `UserPreferences` mock objects, verifying that newly-added diet types (from the `b48ceee` Keto/Low-Carb dictionary commit) are correctly handled in the scoring pipeline.

---

#### `test-db-connect.ts` (304 bytes, root directory, created 2026-06-06)

**Purpose:** One-liner database connectivity check.  
**Status:** Temporary diagnostic — should not be committed.  
**What it does:**
```typescript
import { Pool } from "pg";
const p = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, ssl: { rejectUnauthorized: false } });
p.query("SELECT 1").then(() => { console.log("DB connected OK"); p.end(); }).catch(e => { console.error("DB error:", e.message); p.end(); });
```
**Recommendation:** Delete before next commit. Does not belong in the repository.

---

### 4.2 Investigation & Documentation Files (untracked)

All files in `docs/investigations/` that are untracked represent the architectural investigation work product for the Smart Planner dietary compliance campaign and the component meal shell architecture. They were partially archived in commit `544c18c` but additional investigation files have been created since that commit.

#### Files created since the `544c18c` archive commit:

| File | Size | Date | Purpose |
|---|---|---|---|
| `COMPONENT_MEAL_ADAPTABILITY_RANKING.md` | 456 lines | 2026-06-09 | Re-ranking of 25 shells by Adaptability Score (65/35 hybrid model recommendation) |
| `COMPONENT_MEAL_CATALOGUE_RANKING.md` | 708 lines | 2026-06-09 | Original 25-shell ranking by dietary coverage — coverage estimates at 5/10/25 shells |
| `COMPONENT_MEAL_RECOVERY_FEASIBILITY.md` | — | Pre-544c18c | Feasibility analysis for component meal shell recovery |
| `COOKED_BREAKFAST_MEAL_SHELL_SEED.md` | — | Pre-544c18c | Cooked Breakfast shell design and live validation (fitScore 88/100) |
| `HOUSEHOLD_EATERS_INTEGRATION_AUDIT.md` | — | Pre-544c18c | Audit of household_eaters integration points |
| `KETO_LOW_CARB_DIETARY_DICTIONARY_IMPLEMENTATION.md` | — | Pre-544c18c | Implementation spec for the Keto/Low-Carb exclusion dictionary (shipped in commit `b48ceee`) |
| `LIVE_HOUSEHOLD_COMPONENT_MEAL_VALIDATION.md` | — | Pre-544c18c | Live scoreTemplate() validation against household 44 (Lilly/Daisy) |
| `MATCH_MEALS_HOUSEHOLD_EATERS_IMPLEMENTATION.md` | — | Pre-544c18c | Implementation spec for household_eaters migration (shipped in unstaged `household-meal-matcher.ts`) |
| `MATCH_MEALS_HOUSEHOLD_EATERS_MIGRATION_SCOPE.md` | — | Pre-544c18c | Migration scope analysis |
| `MEAL_TEMPLATE_ARCHITECTURE_AUDIT.md` | — | Pre-544c18c | Template table architecture audit; confirmed PATCH route cannot update slot fields |
| `MEAL_TEMPLATE_SLOT_WRITE_PATH_INVESTIGATION.md` | — | Pre-544c18c | Investigation into slot write path; confirmed pool.query() as correct seed path |
| `PLANNER_GENERATION_PATH_ROOT_CAUSE.md` | — | Pre-544c18c | Root cause analysis for zero-candidate planner failures |
| `PLANNER_VISIBLE_WEEK_EXECUTION_TRACE.md` | — | Pre-544c18c | Execution trace of planner week generation |
| `SMART_PLANNER_CANDIDATE_POOL_TRACE.md` | — | Pre-544c18c | Candidate pool trace (0 Vegan breakfast, 2 Keto breakfast from 206-meal library) |
| `SMART_PLANNER_DISCOVERY_STRATEGY_AUDIT.md` | — | Pre-544c18c | Audit of external recipe discovery strategy |
| `SMART_PLANNER_EXTERNAL_BACKFILL_FEASIBILITY.md` | — | Pre-544c18c | Feasibility of external API backfill for restricted households |
| `SMART_PLANNER_POST_RESTART_VALIDATION.md` | — | Pre-544c18c | Post-restart validation of smart planner after compliance fixes |

#### Root-level misplaced file:

| File | Size | Date | Issue |
|---|---|---|---|
| `SMART_PLANNER_DIETARY_PATTERN_AUDIT.md` | 18,387 bytes, 415 lines | 2026-06-07 | Should be in `docs/investigations/` — created at root by mistake |

---

## 5. In-Flight Logic Trees

Based on the commit history, diff analysis, and untracked file inventory, the following engineering work streams are currently in-flight (built but not fully wired or committed):

### Stream A — Component Meal Shell Recovery (Tier-4 Planner)
**Status:** Architecture complete, seed script ready, matcher migrated. **Not yet wired to any route.**

| Component | Location | State |
|---|---|---|
| `mealTemplates` table with slot fields | `shared/schema.ts` | Committed, in production schema |
| `scoreTemplate()` / `matchMealsForHousehold()` | `server/lib/household-meal-matcher.ts` | Unstaged (migrated to `household_eaters`) |
| Cooked Breakfast shell seed | `server/seeds/seed-meal-shell-templates.ts` | Untracked, ready to commit |
| `npm run seed:meal-shells` script | `package.json` | Unstaged |
| Tier-4 planner fallback route call | `server/routes.ts` / `smart-suggest-service.ts` | **Does not exist** — the gap that closes the recovery loop |
| Catalogue ranking documents | `docs/investigations/cookbook/COMPONENT_MEAL_CATALOGUE_RANKING.md` | Untracked investigation output |
| Adaptability ranking documents | `docs/investigations/cookbook/COMPONENT_MEAL_ADAPTABILITY_RANKING.md` | Untracked investigation output |

**Next step to close:** Wire `matchMealsForHousehold()` into the smart suggest pipeline as a Tier-4 fallback when `generateSmartSuggestion()` exhausts Tier-3 for a given slot.

---

### Stream B — Household Eaters Migration
**Status:** Core migration complete in unstaged changes. Tests written but not committed.

| Component | Location | State |
|---|---|---|
| `matchMealsForHousehold()` reads `household_eaters` | `server/lib/household-meal-matcher.ts` | Unstaged |
| `plannerWeekEaterOverrides` support | Same file | Unstaged |
| Non-user member support (userId: null) | Same file | Unstaged |
| `test-household-eater.ts` | `server/tests/test-household-eater.ts` | Committed (in `c84a7a9`) |

**Next step to close:** Commit the unstaged `household-meal-matcher.ts` changes alongside the seed script.

---

### Stream C — Dietary Compliance Audit Tooling
**Status:** Diagnostic scripts complete, not yet integrated into the test suite.

| Component | Location | State |
|---|---|---|
| `diet-audit-matrix.ts` | `server/tests/` | Untracked |
| `dry-run-planner-compliance-cleanup.ts` | `server/tests/` | Untracked |
| `test-diet-reconciliation-bridge.ts` | `server/tests/` | Untracked |

**Assessment:** These are operational audit scripts rather than regression tests. `dry-run-planner-compliance-cleanup.ts` is particularly valuable as a pre-push compliance check. Candidates for `npm run` script registration (not `npm run test`). `test-diet-reconciliation-bridge.ts` has assertions and belongs in the test suite.

---

## 6. Files Recommended for Next Commit

Based on the in-flight analysis, the natural next commit groups are:

### Commit Group 1 — Component Meal Shell Foundation
```
server/seeds/seed-meal-shell-templates.ts   (new — seed script)
package.json                                 (modified — npm script)
server/lib/household-meal-matcher.ts         (modified — household_eaters migration)
```
Rationale: These three changes form a coherent unit — the seed script, its npm entry, and the scoring engine that will consume the seeded templates.

### Commit Group 2 — Dietary Audit Test Suite
```
server/tests/test-diet-reconciliation-bridge.ts   (new — has assertions, belongs in test suite)
server/tests/diet-audit-matrix.ts                  (new — audit tool)
server/tests/dry-run-planner-compliance-cleanup.ts (new — operational audit tool)
```

### Commit Group 3 — Investigation Archive
```
docs/investigations/cookbook/COMPONENT_MEAL_CATALOGUE_RANKING.md
docs/investigations/cookbook/COMPONENT_MEAL_ADAPTABILITY_RANKING.md
docs/investigations/cookbook/COMPONENT_MEAL_RECOVERY_FEASIBILITY.md
docs/investigations/cookbook/COOKED_BREAKFAST_MEAL_SHELL_SEED.md
docs/investigations/planner/HOUSEHOLD_EATERS_INTEGRATION_AUDIT.md
docs/investigations/knowledge/KETO_LOW_CARB_DIETARY_DICTIONARY_IMPLEMENTATION.md
docs/investigations/cookbook/LIVE_HOUSEHOLD_COMPONENT_MEAL_VALIDATION.md
docs/investigations/planner/MATCH_MEALS_HOUSEHOLD_EATERS_IMPLEMENTATION.md
docs/investigations/planner/MATCH_MEALS_HOUSEHOLD_EATERS_MIGRATION_SCOPE.md
docs/investigations/cookbook/MEAL_TEMPLATE_ARCHITECTURE_AUDIT.md
docs/investigations/cookbook/MEAL_TEMPLATE_SLOT_WRITE_PATH_INVESTIGATION.md
docs/investigations/planner/PLANNER_GENERATION_PATH_ROOT_CAUSE.md
docs/investigations/planner/PLANNER_VISIBLE_WEEK_EXECUTION_TRACE.md
docs/investigations/planner/SMART_PLANNER_CANDIDATE_POOL_TRACE.md
docs/investigations/planner/SMART_PLANNER_DISCOVERY_STRATEGY_AUDIT.md
docs/investigations/planner/SMART_PLANNER_EXTERNAL_BACKFILL_FEASIBILITY.md
docs/investigations/planner/SMART_PLANNER_POST_RESTART_VALIDATION.md
SMART_PLANNER_DIETARY_PATTERN_AUDIT.md  → move to docs/investigations/ first
```

### Files to discard (not commit):
```
test-db-connect.ts   (root-level temporary diagnostic — delete before committing)
```

---

## 7. Push Readiness Assessment

| Check | Status | Notes |
|---|---|---|
| 14 committed-but-unpushed commits | Ready to push | All commits are focused dietary compliance fixes and features. No schema migrations. No breaking API changes. |
| `package.json` unstaged | Not ready | Must be committed before pushing |
| `household-meal-matcher.ts` unstaged | Not ready | Must be committed before pushing |
| Untracked test files | Not ready | `test-diet-reconciliation-bridge.ts` should be wired and committed; others should be committed as audit tools |
| `test-db-connect.ts` | Delete | Do not commit — temporary diagnostic |
| `SMART_PLANNER_DIETARY_PATTERN_AUDIT.md` (root) | Move | Should be in `docs/investigations/` before commit |
| Investigation docs in `docs/investigations/` | Commit | Archive together in a chore commit |

**Blocking items before `git push`:**
1. Commit or stash `package.json` and `household-meal-matcher.ts`
2. Delete or exclude `test-db-connect.ts`
3. Move `SMART_PLANNER_DIETARY_PATTERN_AUDIT.md` to `docs/investigations/`
4. Commit the seed script and untracked test files

---

*Investigation complete. No application code modified. No schema changed. No data written.*
