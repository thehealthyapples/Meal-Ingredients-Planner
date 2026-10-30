# NUTUI3 — Over time: All time / This year, with an honest incomplete marker

**Date:** 2026-10-28
**Branch:** `feat/integrated-dev`
**Risk:** 🟡 AMBER — calculation/behaviour change (which planner weeks feed the Nutrients tab's aggregates); no schema or persistence change.
**Objective:** Decision 2. Add an All time / This year choice to the Nutrients tab. Because `planner_weeks.weekStartDate` is never back-filled (HT7) and is `NULL` for most households' pre-2026-07-17 weeks, "This year" cannot be computed exactly for most households today — so every affected figure carries a visible `~` (hover/focus for why) rather than silently acting as if unanchored weeks don't exist.

## Rollback protection

Same tag as `NUTUI2` (reused, same environment constraint — no git committer identity configured): `rollback/nutrition-implementation-plan-20261027` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`. Tracked writes this task: `server/lib/food-intelligence-assembler.ts`, `server/lib/nutrition-centre-assembler.ts`, `server/routes.ts`, `client/src/components/HouseholdNutritionCentre.tsx`. No new files.

## Architecture compliance

- **One owner per fact — PASS.** Year resolution goes through the canonical `shared/time/household-time.ts` (`householdToday`, `parseCivilDate`, `DECLARED_DEFAULT_ZONE`) — the exact pattern already used in `server/lib/household-planner-week.ts` and `server/storage.ts` (`household?.timeZone ?? DECLARED_DEFAULT_ZONE`, then `householdToday(now, zone)`). No second copy of this logic was written.
- **HT7 honoured, not routed around — this is the change's actual point.** `fetchHouseholdPlannerFoods`'s new `yearFilter` option excludes rows with no parsable `weekStartDate` rather than guessing their year; it reports `yearFilterIncomplete` instead of staying silent about the exclusion. A version of this feature that quietly dropped unanchored weeks and showed a clean number would have been the fabricated-by-omission figure the Trust Check exists to catch.
- **No regression to existing callers — verified, not assumed.** `fetchHouseholdPlannerFoods`'s new parameter is optional; the Food Page's own call site (`food-intelligence-assembler.ts` line ~482, household history stats) passes no options and is structurally unaffected — confirmed by typecheck (identical error count/location to the pre-this-task baseline) and by reading that call site directly rather than inferring from the type signature alone.
- **Canonical component / pattern consistency — deliberate choice, stated plainly.** The All-time/This-year control uses two raw `<button role="tab">` elements, matching `plant-diversity-page.tsx`'s existing Foods/Nutrients tab control byte-for-byte in approach (same `role="tablist"`/`aria-selected` shape, same reason: tab semantics don't map onto the generic `Button` component's props). This *does* add 1 to the adoption register's already-failing `button-primitive` rival count (489→490 against a ceiling of 442) — not a new failure, the same pre-existing one, widened by the same margin a same-shaped pre-existing tab control would widen it by. Named here rather than left for the register to surprise someone with later.

## Changes made

- **`server/lib/food-intelligence-assembler.ts`** — `fetchHouseholdPlannerFoods` now selects `weekStartDate` (the join already existed) and accepts an optional `{ yearFilter?: number }`. When given, every figure (`enjoys`, `bySlug`, `mealEntryCount`, `distinctMealIds`) is computed only from rows whose parsed `weekStartDate.year` matches; unparsable/null dates are excluded and set the new `yearFilterIncomplete` flag. Omitting the option reproduces prior behaviour exactly.
- **`server/lib/nutrition-centre-assembler.ts`** — `assembleNutritionCentre` takes a third parameter, `window: "all-time" | "this-year"` (default `"all-time"`, so every existing call site is unaffected). For `"this-year"`, it resolves the household's zone (`households.timeZone ?? DECLARED_DEFAULT_ZONE`) and civil-today's year, passes it as `yearFilter`, and threads `incomplete` (from `yearFilterIncomplete`) onto the returned `NutritionCentre`, including the `EMPTY` early-return path.
- **`server/routes.ts`** — `/api/nutrition-centre` reads `?window=` (anything other than the literal `"this-year"` falls back to `"all-time"` rather than erroring).
- **`client/src/components/HouseholdNutritionCentre.tsx`** — new `period` state drives the query (`["/api/nutrition-centre", period]`) and a visible All time / This year control, rendered above every state (loading/error/empty/populated) so switching never needs existing data first. `Stat` gained an optional `incomplete` prop rendering a focusable/hoverable `~` with a `title` explanation — following `ConnectedFoodPanel.tsx`'s existing precedent of a raw `title` attribute for this kind of small inline explanation, rather than introducing the heavier `components/ui/tooltip.tsx` for a one-character mark. Applied to the "foods in Planner history" headline figure and all seven `Stat` instances (overview ×4, journey ×3). Category/benefit/trend list rows do **not** individually carry a `~` — that scope stops at the aggregate totals a household would actually read as "this year's number," not every row of a list derived from them; named here as a deliberate scoping choice, not an oversight.

## Definition of Done

- **Success:** All time / This year control works; "This year" figures only count anchored, current-year weeks; any figure built from `incomplete: true` shows `~` with an explanation on hover/focus.
- **Must not break:** "All time" (byte-identical to pre-task behaviour); the Food Page's household-history stats (unaffected call site, confirmed by reading it).
- **Manual test steps:** on `/nutrition`, Nutrients tab, toggle This year — confirm numbers change and, for a household with any unanchored weeks (true of nearly every household today per HT7), every overview/journey figure shows `~`; hover and keyboard-focus the `~` and confirm the explanation appears; toggle back to All time and confirm figures match this change's pre-existing numbers exactly; confirm the toggle renders and is operable in the loading/error/empty states too.
- **User-acceptance evidence:** not captured live (same disclosed gap as `NUTRUI1`/`NUTUI2` — no authenticated session in this environment). Typecheck and an isolated client build both passed.

## Validation performed

- `npm run typecheck` — same 14 pre-existing diagnostics (unrelated `server/scripts`/`server/tests`), zero in any of the four touched files. (Two of the 14 lines reordered their printed property list between runs — a `tsc` structural-type-printing artefact unrelated to any file this task touched; same error count and locations.)
- `npm exec vite -- build --outDir <isolated> --emptyOutDir` — passed, ~25s.
- `git -c core.autocrlf=true diff --check` on the four touched files — clean.
- `npm run adoption:check` — `button-primitive` moved from 489→490 against a ceiling already failing at 442 (explained above, not a new failure); `loading-state` unchanged at 167/166. No other category affected.
- No live household session available to exercise `?window=this-year` against real mixed anchored/unanchored data; reasoned from source (confirmed `nutrition-centre-assembler.ts` previously did zero date-aware filtering, confirmed `fetchHouseholdPlannerFoods`'s join already carries `weekStartDate`) rather than observed live.

## Data impact

- Reads existing data: YES — one additional already-joined column (`weekStartDate`) plus one household row lookup (`timeZone`) only when `window=this-year` is requested.
- Writes new data: NO.
- Changes meaning of existing data: NO — "All time" is unchanged; "This year" is new, additive, and self-describes its own incompleteness rather than silently redefining what the existing numbers mean.
- Backfill/migration: NO.

## Trust check

This feature exists specifically to avoid a trust failure: a "This year" total computed by silently dropping every unanchored week would look exactly like a complete number while actually being a lower bound — the household would read "12 foods discovered this year" as a fact when the honest statement is "at least 12, possibly more, because some of your weeks have no known date." The `~` and its explanation are the whole mitigation; removing them (e.g. to make the UI quieter) would reintroduce the fabrication-by-omission this change is built to prevent.

## Rollback plan

Identifier as above. Restore only the four listed files after reviewing each current diff against this report; preserve every other dirty path untouched (unchanged from `NUTUI2`'s rollback plan — nothing new is at risk here).

## Scope lock

- **Implemented:** All time / This year toggle; honest-incomplete `~` marker on the aggregate totals it affects.
- **Excluded for later decisions:** per-nutrient ranking by amount ("Highest" sort, Decision 4 — unaffected by this change, still blocked on the same missing amount data); "pairs well with" content (Decision 5); any change to the Foods tab (a different mechanism, "this Planner week," untouched); extending `~` to category/benefit/trend list rows (named above as a deliberate stop point, not forgotten).

## Capability Boundary Assessment and Implementation Completion Report

**Architecture Complete: YES.** Reuses the canonical Household Time module exactly as its existing callers do; no new entity, store, or rival calculation.

**Engineering Complete: PARTIAL.** Typecheck and focused build passed with no new debt beyond the one already-failing, already-precedented adoption-register line explained above. No automated test exists for this path yet (none existed for this assembler before this task either).

**Interaction Complete: PARTIAL.** Not verified in an authenticated live session against real mixed anchored/unanchored household data — the one meaningful gap in this task, named rather than hidden.

**Existing assets used:** `shared/time/household-time.ts` (`householdToday`, `parseCivilDate`, `DECLARED_DEFAULT_ZONE`, `IANAZone`), the existing `plannerWeeks`↔`plannerEntries` join, `components/ui/skeleton.tsx`, the existing tab-control visual pattern from `plant-diversity-page.tsx`.

**New assets required:** NONE.

### Remaining gaps

1. **Repository Gap — no live-session acceptance against real anchored/unanchored data.** Attribution Test: YES — this environment has no authenticated session to exercise it live. Recommended next action: Colin (or an authenticated session) toggles This year on a real household and confirms the `~` appears exactly where expected. Recommended capability: continue implementation — nothing is blocked, only unverified live.

**Stop Test:** no further in-scope work is blocked by that gap.
