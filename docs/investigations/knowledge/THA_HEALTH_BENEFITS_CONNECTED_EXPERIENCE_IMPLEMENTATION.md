# THA Health Benefits — Connected Experience (Implementation Report)

**Status:** Implemented (Option A — separate but connected)
**Implementation Date:** 2026-06-17
**Scope:** Experience + shared display-model foundation only. **No data population.**

---

## 1. ROLLBACK IDENTIFIER

```
Tag:     rollback/health-benefits-connected-experience-20260617
Commit:  f384f6a40c8dffcecc18736fd1393180cc080b7b  (short f384f6a)
Restore: git reset --hard rollback/health-benefits-connected-experience-20260617
```

Git working tree was clean of tracked changes before implementation (only untracked
investigation docs present). Tag created against `HEAD` (`f384f6a`) before any code
change.

---

## 2. APPROVED SCOPE DELIVERED (Option A)

30 Plants Page and Pantry Explore are kept **separate but connected by one shared
Health Benefits display model**:

1. ✅ 30 Plants is now a dedicated **page** (`/plant-diversity`), no longer a modal.
2. ✅ Pantry gained a second **Explore** mode (Nutrition Knowledge Hub).
3. ✅ Both consume one shared display model (`lib/health-benefits-model.ts`).
4. ✅ The two surfaces cross-link to each other.
5. ✅ **No data populated** — Health Benefits render safe empty states everywhere.

---

## 3. FILES CHANGED

### Added
| File | Purpose |
|------|---------|
| `client/src/lib/health-benefits-model.ts` | **Shared display model/adapter.** Column language, user-facing terminology, empty-state copy, disclaimer, `getFoodHealthProfile`, and Explore browse sources (`listLibraryFoods`, `buildNutrientIndex`, `listHealthBenefitTopics`). |
| `client/src/components/PlantDiversityReport.tsx` | Page-body report (extracted from the retired modal), Health Benefits language, sorting, expandable meals, Broaden Your Variety. |
| `client/src/hooks/use-week-meal-entries.ts` | Decoupled data-access hook — resolves the active week's meals from shared query caches so the page is deep-linkable. |
| `client/src/pages/plant-diversity-page.tsx` | The `/plant-diversity` route target. |
| `client/src/components/PantryExplore.tsx` | Pantry "Nutrition Explore" hub (Health Benefits / Key Nutrients / Foods lenses). |

### Modified
| File | Change |
|------|--------|
| `client/src/App.tsx` | Registered `/plant-diversity` route under `ProtectedRoute`; imported the page. |
| `client/src/pages/weekly-planner-page.tsx` | Counter `onExplore` now `navigate("/plant-diversity")`; removed modal mount, `plantExplorerOpen` state, the unused `weekMealsData` memo, and the old imports. |
| `client/src/pages/pantry-page.tsx` | Added URL-driven Inventory/Explore mode toggle; renders `<PantryExplore />` in Explore mode; inventory untouched. |
| `client/src/lib/nutrition-benefit-library.ts` | Added read-only `getAllNutritionBenefits()` accessor (no data change). |
| `client/src/lib/nutrition-variety.ts` | Comment reference updated (modal → report). |

### Removed
| File | Reason |
|------|--------|
| `client/src/components/PlantDiversityExplorer.tsx` | Retired modal — body extracted to `PlantDiversityReport` (design Option A). |

---

## 4. ROUTE ADDED / CHANGED

- **Added:** `/plant-diversity` → `PlantDiversityPage` (full app chrome via `ProtectedRoute`).
- **Pantry:** `/pantry?mode=explore` opens Explore; `/pantry` (or `?mode=inventory`)
  is the unchanged inventory default. The mode is URL-driven, so it is deep-linkable
  and the browser back button works.
- **Planner entry point unchanged for the user:** the `WeeklyPlantDiversityCounter`
  chip stays in place; only its handler changed (state setter → navigation). The
  counter component itself was not modified.

---

## 5. SHARED MODEL ADDED

`client/src/lib/health-benefits-model.ts` is the single source of truth for the
connected experience:

- **Column language:** `COLUMN_LABELS` = `Plant | Health Benefits | Key Nutrients | Meals`.
- **Terminology:** `TERMINOLOGY` = Health Benefits, More Health Benefits, Key
  Nutrients, Broaden Your Variety. (No "Supports", "Additional Supports",
  "Primary/Secondary", or "Show More" anywhere.)
- **Empty states:** `EMPTY_STATES` — "No health benefits recorded yet" /
  "Health benefit data coming soon" / "Key nutrient data coming soon".
- **Disclaimer:** `HEALTH_DISCLAIMER` (educational, not medical advice).
- **Adapter:** `getFoodHealthProfile()` merges existing curated data
  (`nutrition-benefit-library` + `pantry-knowledge`) into a display profile.
  `healthBenefits` is **always `[]`** until a registry exists — it never derives
  outcomes from free-text `supports`/`tags`, and never calls an AI.
- **Explore sources:** `listLibraryFoods()`, `buildNutrientIndex()`,
  `listHealthBenefitTopics()` (the last returns `[]` → empty-state lens).

---

## 6. 30 PLANTS PAGE CHANGES

- Modal → dedicated page; report body is container-agnostic (no `Dialog`).
- Header keeps "30 Plants This Week", current count (`73 / 30`-style), progress bar,
  and status text. Page `<h1>` is "Plant Diversity Report".
- Category summary grid with covered/missing state (existing behaviour preserved).
- Plant report uses the **Plant | Health Benefits | Key Nutrients | Meals** columns.
  - **Health Benefits** column shows a safe empty state (no fabricated outcomes).
  - **Key Nutrients** shows real curated data.
  - **Meals** shows a **count** (e.g. "3 meals ›"), not a long inline list.
- Expanded row shows: **More Health Benefits** (empty state today), **Key Nutrients**,
  **Used In** (meal + day evidence — the meals expansion), and **Broaden Your Variety**
  (real variant forms used this week; no fake suggestions).
- **Sorting:** Plant, Category, Meals (all backed by present data). Health Benefits /
  Key Nutrients sort intentionally deferred — sorting by absent benefit data would be
  fake (documented as next phase).
- Educational disclaimer retained in the footer.
- Data access via `useWeekMealEntries` (reads `/api/planner/full` + `/api/meals` and
  the same `planner:active-week` localStorage key the planner uses), so the page is
  deep-linkable and independent of planner component state.

---

## 7. PANTRY EXPLORE CHANGES

- Inventory remains the **default**; existing two-realm inventory + shopping flow is
  untouched. A header **Inventory / Explore** toggle switches modes.
- Explore = **Nutrition Explore** hub answering "What can I add?" with three lenses:
  - **Health Benefits** → empty state ("Health benefit data coming soon"), because no
    benefit registry exists yet.
  - **Key Nutrients** → real data; each nutrient expands to the foods that contain it,
    with an "✓" when the food is already in your pantry.
  - **Foods** → real data; each food shows an empty Health Benefits line, its key
    nutrients, its curated summary, and an "In your pantry" badge when matched.
- Uses the shared model's terminology and empty-state copy verbatim.
- No pantry inventory rows are read for content beyond a read-only membership check.

---

## 8. CROSS-LINKS ADDED

- **30 Plants Page → Pantry Explore:** footer link "Explore health benefits, nutrients
  and foods in your Pantry" → `/pantry?mode=explore`; plus a per-missing-category
  "Explore in Pantry →" link in the completion suggestions.
- **Pantry Explore → 30 Plants Page:** footer link "See how your week scores in the
  Plant Diversity Report" → `/plant-diversity`.
- All links are plain route navigations and cannot break (no required state hand-off).

---

## 9. DATA SOURCES USED

- `client/src/lib/nutrition-benefit-library.ts` — foods → key nutrients + summary (existing).
- `client/src/lib/pantry-knowledge.ts` — "why it matters" context (existing).
- `client/src/lib/nutrition-variety.ts` — plant detection + category taxonomy (existing).
- `client/src/lib/ingredient-reuse.ts` — normalisation (existing).
- Planner/meals queries (`/api/planner/full`, `/api/meals`) — existing meal data, read-only.
- Pantry query (`/api/pantry`) — read-only membership check for "In your pantry".

---

## 10. EXPLICIT CONFIRMATION — NO DATA POPULATED

- ✅ No new health-benefit data created. `healthBenefits` is structurally `[]`.
- ✅ No ingredient knowledge backfilled.
- ✅ No benefits/nutrients/medical claims invented or AI-generated.
- ✅ No schema change (a schema change was **not** required — STOP condition not hit).
- ✅ No production data written. The only new accessor is a read-only getter over an
  existing in-memory curated array.

---

## 11. MANUAL TESTS RUN

Automated/static verification performed:
- `npx tsc --noEmit` → **0 errors in `client/src`** (pre-existing errors exist only in
  `server/scripts` and `server/tests`, untouched by this task).
- `npx vite build` → **success** (client production build, 3219 modules transformed).

Manual UI walkthrough checklist (to confirm in-app):
- Planner → counter still present → tap → lands on Plant Diversity Report → browser
  back returns to Planner; count matches.
- Report: category summary, plant rows, More Health Benefits empty state only where no
  data, meals expand (names + days), no JSON-like layout, no fabricated benefits.
- Pantry: inventory works; Explore toggle switches lens; missing data shows empty
  states; no inventory item changed; cross-links navigate without breaking.
- Responsive at 375/640/768/1024/1280/1536 (table collapses to stacked plant cell
  below `md`; Explore lists reflow; full page removes modal viewport clipping).

---

## 12. BUILD RESULT

**PASS.** `npx vite build` completed in ~13s. `tsc --noEmit` reports zero errors in
changed/client code.

---

## 13. KNOWN LIMITATIONS

1. **Health Benefits are empty everywhere** — by design. The structured Benefit→Nutrient
   registry does not exist yet; both surfaces show honest empty states until the
   separately-approved population task.
2. **Sorting** is limited to Plant / Category / Meals. Health Benefits / Key Nutrients
   sort is deferred (sorting on absent data would be misleading).
3. **Health-first lens** for the report (Phase 2 in the design) is not built — the page
   ships food-first with sorting, as recommended.
4. **Deep-link cold load** of `/plant-diversity` resolves the active week from
   localStorage; if no week context exists it renders the empty report ("…once meals
   are added"). No redirect was added (kept minimal).
5. **Explore "Already in this week" / shopping actions** were intentionally omitted to
   avoid broken/half-wired buttons; only the safe cross-link and pantry-membership flag
   are shown.

---

## 14. NEXT PHASE — PANTRY HEALTH BENEFITS DATA POPULATION

> This section is a **plan only**. No population was executed.

### 14.1 Current coverage (curated client libraries)
1. **Pantry knowledge entries:** ~46 keyed entries in `pantry-knowledge.ts`
   (includes aliases such as "tinned chickpeas"; ≈30 distinct ingredients).
2. **Nutrition Benefit Library foods:** **24** foods, each with key nutrients + a
   one-line summary; **23** distinct key nutrients across them.
3. **Entries with structured Health Benefit (outcome) data:** **0** — no
   Benefit→Nutrient registry exists in any client library.
4. **Entries missing structured Health Benefit data:** **all of them** (100%).
   (Per-user `user_pantry_items` rows are DB-resident and carry no nutrition data by
   design — knowledge is looked up by key, so the count above is the relevant gap.)

### 14.2 Recommended population route
- Author a small **curated Health Benefit registry** (6–8 outcomes, e.g. Sleep Quality,
  Heart Health, Gut Health, Energy, Immunity, Brain Health, Bone Health) as a static
  client library `health-benefits-registry.ts`, shaped as `Benefit → Nutrient[]`.
- Wire it into the existing `health-benefits-model.ts` adapter so `healthBenefits`
  populates automatically — **no UI changes needed**; the empty states disappear as data
  appears.
- Map foods to benefits **through the existing key nutrients** (nutrient bridge), so
  every benefit is evidenced, never asserted.

### 14.3 Schema changes needed?
- **No.** A static curated registry (same shape as `nutrition-boosts.ts`) needs no DB
  table or migration for v1. A `pantry_ingredient_knowledge`-backed path already exists
  if server-side/AI content is wanted later.

### 14.4 Backfill needed?
- **No backfill of user data.** Population is library-level curation, not per-user rows.

### 14.5 Rollback plan for the population task
- Tag before the task; the registry is a single additive file plus a one-line wiring
  change in the adapter — revert by deleting the file and the import, or
  `git reset --hard <tag>`.

### 14.6 Risks
- **Medical/regulatory overreach** → enforce "supports / associated with" language +
  nutrient bridge + disclaimer (already in the model).
- **Scope creep into encyclopedia** → cap at 6–8 benefits; every leaf ends in an action.
- **Free-text `supports`/`tags` mismatch** → treat as hints only, never source of truth.
- **Curation burden / accuracy** → nutritionist review of the registry before ship.

---

## 15. SUGGESTION ONLY — OUT-OF-SCOPE IMPROVEMENTS

- **Code-splitting:** the client bundle is large (~3.1 MB pre-gzip). `/plant-diversity`
  and Pantry Explore are good candidates for `React.lazy` route-level splitting.
- **Health-first lens (report Phase 2):** an explicit "By plant / By health benefit"
  toggle once the registry exists.
- **Explore → Shopping action:** wire "Add to basket" reusing the existing
  `POST /api/shopping-list` (`source: "pantry"`) once approved.
- **"Already in this week" in Explore:** reuse `useWeekMealEntries` to flag foods that
  already appear in the planned week.
- **Sidebar entry decision:** intentionally left out of primary nav; revisit if the page
  warrants top-level discovery.

---

**Implementation completed:** 2026-06-17
**Rollback available:** `git reset --hard rollback/health-benefits-connected-experience-20260617`
