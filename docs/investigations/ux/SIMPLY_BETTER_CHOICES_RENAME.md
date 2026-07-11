# Simply Better Choices — Rename

**Date:** 2026-06-15
**Scope:** User-facing copy rename only. No logic, scoring, schema, API, or internal-name changes.

---

## 1. Rollback identifier

**Tag:** `rollback/simply-better-choices-rename` → commit `9fe2c02` (tip of `main`, pre-rename baseline).

The working tree was **not clean** at task start — it held two documented, near-complete
features that overlap the rename's target files. To make the rollback point valid (a
rollback must not destroy that work), they were committed first as two clean commits:

- `836e40d` — feat(planner): Planner Meal Card V2 refinement (compact variety card + shell
  meal metadata write-path). Files: `storage.ts`, `auto-import-service.ts`,
  `PlannerMealCard.tsx`, `test-shell-meal-metadata-write-path.ts`, V2 doc.
- `9fe2c02` — fix(planner): reconcile boost count between planner card and meal modal.
  Files: `MealUpliftPanel.tsx`, `weekly-planner-page.tsx`, boost-count doc.

The rollback tag sits on `9fe2c02`. To undo the rename: `git checkout rollback/simply-better-choices-rename -- client/src/components/MealUpliftPanel.tsx client/src/pages/weekly-planner-page.tsx`
(or `git reset --hard rollback/simply-better-choices-rename` to drop the rename entirely).

---

## 2. Files changed (by the rename itself)

- `client/src/components/MealUpliftPanel.tsx` — 6 user-facing strings
- `client/src/pages/weekly-planner-page.tsx` — 4 user-facing strings (2 of them ×2 sites)

No other files touched. Internal names, API routes, DB tables, mutation names, type/enum
values, `data-testid`s, comments, and console logs were all left unchanged.

---

## 3. Text replacements

| Current text | New text | Location | Surface | Changed? |
|---|---|---|---|---|
| `{n} boost idea{s}` → "5 boost ideas" | `{n} Simply Better Choice{s}` → "5 Simply Better Choices" | `MealUpliftPanel.tsx:556` (`UpliftCardIndicator`) | Planner card count | ✅ |
| `title="Nutrition Boost ideas available"` | `title="Simply Better Choices available"` | `MealUpliftPanel.tsx:551` | Planner card tooltip | ✅ |
| `Nutrition Boost` (heading) | `Simply Better Choices` | `MealUpliftPanel.tsx:348` | Meal-detail modal heading | ✅ |
| `Added via THA Boost` | `Added via Simply Better Choices` | `MealUpliftPanel.tsx:478` | Modal provenance list header | ✅ |
| `· THA Boost` | `· Better Choice` | `MealUpliftPanel.tsx:496` | Modal per-item provenance tag | ✅ |
| `No boost ideas for this meal right now.` | `No suggestions for this meal yet.` | `MealUpliftPanel.tsx:522` | Modal empty state | ✅ |
| `Boosted` (×2: mobile + desktop) | `Improved` | `weekly-planner-page.tsx:2137, 2424` | Planner card applied-state badge | ✅ (judgment call) |
| `title="Nutrition boost applied"` (×2) | `title="Simply Better Choice applied"` | `weekly-planner-page.tsx:2134, 2420` | Planner card applied tooltip | ✅ |
| `Added via Nutrition Boost` | `Added via Simply Better Choices` | `weekly-planner-page.tsx:3741` | Modal ingredient provenance label | ✅ |
| `Failed to remove boost` (toast) | `Failed to remove ingredient` | `weekly-planner-page.tsx:823` | Remove-error toast | ✅ |

### Deliberately NOT changed (with reasons)

| Text / item | Where | Why left unchanged |
|---|---|---|
| `Nutrition Boosts` (heading) | `NutritionBoostPanel.tsx:76` | **Dead code** — component is never rendered (only reference is a comment). Not a live user surface. |
| `Immune Boost` | `category-utils.ts:12,24` | Different feature — a health-benefit category, not the meal-suggestion "Nutrition Boost". |
| `…would boost variety…` | `nutrition-variety-chips.tsx:194-195` | "boost" used as an English verb (increase), not feature branding. |
| `…boost micronutrient variety…` (`why` text) | `server/lib/uplift-rules.ts:358` | Verb usage in a displayed suggestion reason; not feature branding. |
| `· {n} idea{s}` secondary count | `MealUpliftPanel.tsx:352` | Not "boost" wording; "idea(s)" is neutral. Left to keep scope tight (can become "suggestions" if desired). |
| `action: "add" \| "swap" \| "boost"` | `MealUpliftPanel.tsx:27` + server types | Internal type/enum value. |
| `ruleName: "Nutrition Boost"`, `ruleId: "fallback-deterministic-boosts"` | `weekly-planner-page.tsx:334` | Internal data — not rendered (panel heading is hardcoded). |
| `NutritionBoost`, `MealUplift`, `meal_uplift_applications`, `/api/uplift/*`, `nutrition-boosts.ts`, `selectVisibleBoosts`, `boostedMealIds`, `removeBoostFromDialogMutation`, `data-testid="uplift-*"` | various | Internal names / routes / tables / test selectors — explicitly out of scope. |

### Icon decision (sparkle ✨)

Investigated. The nutrition surfaces consistently use the emerald **`Leaf`** icon (modal heading
+ card indicator), matching the planner's plant/variety visual language (variety chips, legend).
A sparkle would introduce an inconsistent, noisier motif, so it was **omitted** — `Leaf` retained.
The applied-state badge keeps its existing `Check` icon.

---

## 4. Screenshots

**Not captured.** A live capture was attempted against the running dev server (which was
confirmed to already serve the new copy) using Playwright, but headless Chromium fails to
launch in this sandbox — missing system library `libglib-2.0.so.0`. This is an environment
limitation, not a problem with the change. Re-run in a browser-capable environment with the
demo flow (`POST /api/demo/start` seeds a week of meals) to capture desktop + mobile.

Note one visual item to eyeball when screenshots are possible: the card-count text grew from
"5 boost ideas" (13 chars) to "5 Simply Better Choices" (23 chars) at `text-[10px]`; confirm
it doesn't wrap awkwardly on the narrowest mobile planner columns.

---

## 5. Tests executed

- **Served-source check** — `curl` of the running Vite dev server's transformed
  `MealUpliftPanel.tsx` returns "Simply Better Choices" / "No suggestions for this meal yet"
  and no trace of the old copy. The live app reflects the change.
- **grep proof** — every rendered string verified changed; every remaining `boost` occurrence
  in both files confirmed internal (names, enums, test-ids, comments, debug logs).
- **`npm run typecheck`** — **zero** errors in the two changed files and **zero** in any
  `client/` file. The 5 files with errors are pre-existing server scripts/test fixtures
  (`categories` property, top-level `await`, mock shapes), unrelated to this change.
- **`npm run build`** — **succeeds** (exit 0); 3209 modules transformed, client + server
  bundled. Only pre-existing chunk-size advisories.
- **Desktop + mobile** — verified by code-path inspection: both the mobile block
  (`weekly-planner-page.tsx:2123-2148`) and desktop block (`2409-2430`) render the renamed
  strings and share the same `UpliftCardIndicator` + `MealUpliftPanel`. Live screenshot
  pending (see §4).

---

## 6. Final outcome

User-facing "Nutrition Boost / boost ideas / THA Boost" wording on the planner card and
meal-detail modal is renamed to **Simply Better Choices** (with "Better Choice" on compact
per-item tags and "Improved" on the applied-state badge). Internal feature naming
(`NutritionBoost`, `MealUplift`, schema, APIs, test-ids) is unchanged — internally it is
still the Nutrition Boost feature; only the surface copy moved. Type-check and build pass;
the running app serves the new copy. Behaviour, scoring, and data are unchanged (reads
existing data; writes none; no schema change).

### Open judgment calls (easy to veto — rollback tag available)

1. **`Boosted` → `Improved`** (applied-state badge). Not named in the brief; renamed for
   consistency. Alternatives: "Updated" (more neutral) / "Added". One-word change.
2. **Empty state → "No suggestions for this meal yet."** Brief offered this or "No Simply
   Better Choices available yet."
3. **`· THA Boost` → `· Better Choice`** and **`Added via … → Added via Simply Better
   Choices`** — chosen for natural reading; "Added as a Better Choice" also works.
