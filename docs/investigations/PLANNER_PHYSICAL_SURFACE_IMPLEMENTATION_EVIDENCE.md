# Planner Physical-Surface Implementation Evidence

**Status:** READ-ONLY INVESTIGATION — no implementation performed
**Repository:** `tha-integrated-dev`, branch `feat/integrated-dev`, HEAD `8ce746c5` (2026-09-05 22:56:37 +0100)
**Purpose:** Exact implementation evidence for Luna's Planner physical-surface redesign plan. Not a design decision, not an implementation.

---

## 1. Approved direction (as stated to this investigation)

- Accepted physical composition: `PLANNER_TARGET_BLANK_ACCEPTED.png`.
- Wooden-framed Planner hung by cord on cupboard/end panel beside the window.
- Desktop = 7 day columns × 3 meal rows.
- Mobile = day-focused, same underlying week/capabilities.
- Live semantic UI/content overlays the physical Planner; meal text is never baked into imagery.
- Existing THA branding/typography/design system is authoritative. Generated concept logos/fonts/slogans are not.
- Every existing Planner capability must be retained or improved.

**APPROVED DIRECTION UNDERSTOOD: YES** (as stated above; this document does not independently verify the direction was actually approved anywhere outside `PROJECT_GOVERNANCE.md`'s own text — see §5).

---

## 2. Accepted asset

- **Found at:** `client/public/images/planner/PLANNER_TARGET_BLANK_ACCEPTED.png`
- **Tracked:** NO — untracked (`git status`: `?? client/public/images/planner/`)
- **Format:** PNG, 8-bit, colour type 2 (RGB, no alpha)
- **Dimensions:** 1280 × 960 px
- **File size:** 1,054,586 bytes (~1030 KB)
- **Derivatives:** none — this is the only file in `client/public/images/planner/`.
- **Provenance/acceptance metadata:** none found alongside the file (no sidecar `.json`/`.md`, no EXIF/text chunk inspected beyond the PNG header).

**Discrepancy found:** `PROJECT_GOVERNANCE.md:501` names the canonical accepted-asset path as `artifacts/planner-target-blank/PLANNER_TARGET_BLANK_ACCEPTED.png`. That path **does not exist** anywhere in the repository (not on disk, not git-tracked — confirmed directly). Only the `client/public/images/planner/` copy exists, and it too is untracked. The governance document's own reference path is currently broken; the only real evidence of "acceptance" is the governance prose itself, not a located artifact record.

**Already wired into the current page:** `client/src/pages/weekly-planner-page.tsx:2053-2059` already renders this exact asset:
```tsx
<div className={pageContainerClass(true)} data-realm="planner">
  <img
    className="planner-physical-photo"
    src="/images/planner/PLANNER_TARGET_BLANK_ACCEPTED.png"
    alt=""
    aria-hidden="true"
  />
```
This `<img>` block is part of the file's current uncommitted diff (see §6) — pre-existing user work already begun in this direction, not yet committed.

---

## 3. `client/src/pages/weekly-planner-page.tsx` — render tree map (4,439 lines total)

| Section | Lines | Notes |
|---|---|---|
| Imports / row & row-type constants | 1–160 | `Skeleton`, `EmptyState` (canonical loading/empty), `PlannerIntelligenceStrip`, diet/household types, `BASE_MATRIX_ROWS` (breakfast/lunch/dinner) at ~113–122 |
| `mobileFriendlyCollision` (dnd-kit custom collision detection, prioritises `mobile-day-nav-*` targets) | 160–203 | |
| Session/date helper functions | 204–355 | week-range formatting, resolve-session persistence |
| `export default function WeeklyPlannerPage()` | 356–4439 | single top-level component |
| State: rename, mobile assistant, mobile day index/quick-add, long-press refs | 360–470 | `renameWeekId`/`renameValue` (360–361), `mobileDayIndex` (375), `mobileQuickAdd` (376–377) |
| Data queries: full planner, basket meal ids | 528–556 | `isLoading`/`plannerError` destructured 532; `basketMealIdSet` 555 |
| Domain hooks: Smart Suggest, planner scan, nutrition uplift, household eaters, provisioning, meal adaptation, guests | 661–990 | |
| `renameMutation` | 1062–1073 | |
| Basket mutations (`addToBasketMutation`, `addDayToBasket`, `addSlotToBasket`, `addAllToBasket`) | 1092–1098 (declaration site) | consumed at 1964–1967, 2019–2024, 2541 |
| **`dndSensors`** (`useSensors`: Touch/Pointer/Keyboard) | 456–460 | |
| **`handleDragStart`** | 1140–1149 | |
| **`handleDragOver`** | 1150–1178 | mobile cross-day drag-over handling (1152–1184) |
| **`handleDragEnd`** | 1179–1376 | handles `planner-entry`, `proposal-card`, `search-result` (1230) drag-data types; mobile-day-nav drop (1355) |
| **`handleDragCancel`** | 1377–1394 | |
| `activeWeekIsEmpty` | 1609–1610 | |
| `visibleRows` (adds drinks/child/baby rows conditionally) | 1676–1692 | |
| `placeholderItems` | 1759–1807 | |
| **Loading state** | 1808–1827 | `Skeleton` grid, header stays painted (`data-testid="loading-planner"`) |
| **Error state** | 1829–1848 | `LoadError` component, retry via `refetchPlanner()` (`data-testid="error-planner"`) |
| **Header / week navigation / search / rename / basket / overflow** (`WorkspaceHeader`) | 1850–2059 | see breakdown below |
| **DndContext** open | 2060–2065 | `sensors={dndSensors}`, `collisionDetection={mobileFriendlyCollision}`, `onDragEnd={handleDragEnd}` |
| **Empty state** | 2080–2101 | `EmptyState` component, `data-testid="empty-planner-week"` |
| Household diet toggle | 2107–2186 | `weekDietsOpen` expand/collapse |
| **Intelligence** (`PlannerIntelligenceStrip`) | 2190–2202 | |
| **Mobile day-focused rendering** | 2203–2472 | see breakdown below |
| **Desktop weekly grid** | 2473–2881 | see breakdown below |
| Weekly Provisioning panel | 2882–2962 | moved here "from below DndContext for better visibility" per inline comment |
| **DragOverlay** | 3063–3076 | `dropAnimation={null}`, `modifiers={[snapOverlayToCursor]}` (snap logic defined line 171) |
| **DndContext** close | 3077 | |
| Mobile long-press action sheet | 3079–3169 | |
| Mobile move-to-day picker sheet | 3170–3201 | |
| Recipe-link confirmation dialog | 3202–3243 | |
| Meal Detail Modal (incl. guest eaters 3382, household-safe unified preview 3638) | 3244–4199 | largest single dialog block |
| Save Week Dialog | 4200–4229 | |
| Load Saved Week Dialog | 4230–4256 | |
| Copy Day Dialog | 4257–4305 | |
| Clear Slot Confirmation Dialog | 4306–4410 | |
| Adaptation Review Sheet | 4411–4439 | |

### 3a. Header / week navigation / search / rename / basket / overflow (1850–2059)

- `search`: `WorkspaceHeader`'s `search` prop (1858–1863) — `placeholder: "Search meals..."`, `value: ""`, `onChange: () => {}` (no-op), `onSubmit: () => navigate("/cookbook")`. **This search box does not search the Planner in place — submitting it navigates away to `/cookbook`.** It is not the same UI as the drag-sourced `search-result` rows referenced in `PlannerDragDrop.tsx` (those originate from the separate Planner Assistant panel, not this header field).
- Week navigation: prev/next buttons at 1892–1905 / 1922–1935 (`button-prev-week`/`button-next-week`, `ChevronLeft`/`ChevronRight`), week `<Select>` 1906–1920.
- Rename: inline input 1866–1888 (`input-rename-week`), trigger button 1938–1947 (pencil icon).
- Plan My Week: button 1952–1962, `data-testid="button-plan-my-week"`, `hidden md:inline-flex` — **desktop-only**; mobile reaches the same handler (`setAssistantMode("smart")`) via the empty-state CTA (2088–2097, `button-plan-empty-week`) or the workspace drawer per inline comment (2076–2077).
- Basket (header): `button-add-all-basket` (1964–1967, desktop-only) and `button-add-all-basket-overflow` (2019–2024, inside the `DropdownMenu` overflow at 1996–2059) both call `addAllToBasket(sortedDays)`. Per-slot basket button also exists in the desktop grid row label (2539–2547, `button-add-slot-{mealType}-basket`).
- Placeholder review entry point: 1969–1980, `button-placeholder-review`, only rendered when `placeholderItems.length > 0`.
- Overflow menu (`DropdownMenu`, 1996–2059+): contains "Send week to basket", "Save This Week" (2027–2030), "Load Saved Week" (2031–2034), continuing past the read range captured here.

### 3b. Mobile day-focused rendering (2203–2472)

- Day-nav row: `MobileDayDropTarget` components (from `PlannerDragDrop.tsx`) rendered ~2205–2217, `isSelected={idx === mobileDayIndex}`.
- Day actions button (copy day) 2222–2229.
- Meal rows for the current mobile day: 2242–2472, iterates `visibleRows` (same row model as desktop), each cell uses `DroppablePlannerCell` with `idPrefix="mobile-slot"` (2253–2265) and `SortableContext`/`MobileSortableMealEntry` for reorder.
- Placeholder vs. real-meal branching at 2271 (`isPlaceholder`), basket indicator icon 2339, cooked-state styling threaded via `isCooked`.
- Mobile add-meal button: `button-mobile-add-{row.id}` at 2383.

### 3c. Desktop weekly grid (2473–2881)

- Outer grid: CSS grid `gridTemplateColumns: "var(--ws-col-label) repeat(7, 1fr)"` (2477–2481) — one label column + 7 day columns.
- **Header row** (day names): 2483–2514. Each day header is a `<button data-testid="button-day-header-{dayOfWeek}">` (2494–2502) plus a per-day copy button (2503–2511, `button-copy-day-{dayOfWeek}`).
- **Meal rows**: 2516–2821, `visibleRows.map` (2517). Row label column (sticky-left) 2527–2552, including the per-slot basket button (2539–2547).
- **Meal cells**: 2554–2821 inner map over `sortedDays`, each cell is a `DroppablePlannerCell` (2561–2569, `data-testid="cell-{row.id}-{dayOfWeek}"`) wrapping a `SortableContext` (2571+) of up to 2 pill entries per slot (`cellEntries.slice(0, 2)`).
- **Summary row**: comment at 2822 ("Summary row - same grid, aligned under day columns"); content not re-read in full for this pass — flagged for Luna to re-open if the summary row's exact content matters to the redesign.

---

## 4. `PlannerMealCard.tsx` and `PlannerDragDrop.tsx` — complete files read

### 4a. `PlannerMealCard.tsx` (210 lines, complete)

Exports one component: `PlannerMealCardContent({ meal, entryId, isPlaceholder, isCooked })`. **Pure presentational — no drag logic, no outer button/menu** (explicitly documented in the file's own header comment as intentionally excluded, owned by the parent page instead). Renders:
- Line 1: meal title (134–136), strikethrough when cooked.
- Line 2: up to 2 style-tag "chips" (142–162), from a fixed `CHIP_PRIORITY_ORDER`/`CHIP_COLOR` map (33–67).
- Line 3: up to 3 variety dots + up to 2 short labels (166–190), computed via `computeMealVariety` from `@shared/canonical/plant-classifier`, using the same 5-category model as the planner's top legend (documented intent, source of the legend itself not re-verified here).
- Placeholder state: "Needs recipe" italic label (195–202).
- Cooked state: "Cooked" label (205–207).
Responsive behavior is comment-documented (17–20: mobile = title+1 chip+dots only; tablet = +1 label; desktop = +2 labels) and implemented via `hidden sm:inline-flex` / `hidden lg:inline` utility classes (151, 157, 180, 185).

### 4b. `PlannerDragDrop.tsx` (359 lines, complete) — component/ownership inventory

| Component | Lines | dnd-kit hook | Drag handle | Notes |
|---|---|---|---|---|
| `DraggablePlannerEntry` | 55–74 | `useDraggable` | whole wrapper div (`{...listeners}` on outer div) | Marked "kept for reference" — superseded by `SortablePlannerEntry` per inline comment (54) |
| `SortablePlannerEntry` | 77–106 | `useSortable` | whole wrapper div | Desktop grid's within-slot reorder + drag source |
| `DroppablePlannerCell` | 120–146 | `useDroppable` | n/a (drop target) | Desktop + mobile grid cell; `idPrefix` param distinguishes `slot-*` (desktop) vs `mobile-slot-*` |
| `DraggableProposalCard` | 156–181 | `useDraggable` | whole wrapper div | Assistant-panel proposal cards |
| `MobileSortableMealEntry` | 193–245 | `useSortable` | **dedicated handle** via `setActivatorNodeRef` (236–242, `GripVertical` icon, `aria-label="Drag to move meal"`) | Row content (234) is NOT draggable itself — only the grip icon is; tap/click on the row stays intact |
| `DraggableSearchResultRow` | 256–294 | `useDraggable` | **dedicated handle** via `setActivatorNodeRef` (285–291, `GripVertical`, `aria-label="Drag to add to planner"`) | Same handle-only pattern as mobile entries, explicitly to preserve row click/tap (247–248 comment) |
| `DroppableProvisioning` | 304–319 | `useDroppable` | n/a | Weekly Provisioning drop target, accepts `search-result` drags |
| `MobileDayDropTarget` | 330–359 | `useDroppable` | n/a (whole button is the target) | Cross-day drag target in the mobile day-nav row; visual `isOver` ring state (350–351) |

**Drag data types** (`DragItemData`, 9–38): `planner-entry` (existing entry being moved/reordered), `proposal-card` (assistant-panel suggestion), `search-result` (Planner Assistant discovery row, `sourceOrigin: "cookbook"|"freezer"|"packaged"`).
**Drop zone types** (`DropZoneData`, 40–43): `planner-slot`, `mobile-day-nav`, `provisioning`.

**Accessibility semantics found:** only two explicit `aria-label`s exist in this file, both on the dedicated grip handles (239, 288). `useDraggable`/`useSortable`'s spread `{...attributes}` supplies dnd-kit's own default ARIA (role, `aria-roledescription`, `aria-describedby`, `tabIndex`) — not independently re-verified here (dnd-kit library internals, out of this file). No custom `aria-label` exists on `DroppablePlannerCell`, `MobileDayDropTarget`'s underlying div, or the desktop `SortablePlannerEntry`/`DraggablePlannerEntry` wrappers themselves.

---

## 5. Meal-discovery / search contract (`INT26_MEAL_DISCOVERY_CAPABILITY_IMPLEMENTATION.md`)

**Important distinction — this is a server-side Intelligence Platform capability, not necessarily the same thing as the client-side drag-and-drop `search-result` UI.** Summary of the documented contract:
- Capability id `meal-discovery`, one method `discover(query, userId)`, fans out across three sources via `Promise.allSettled`: **personal** (`getMeals`, `sourceLabel: "Your Cookbook"`), **system** (`getSystemMeals`, `sourceLabel: "THA Library"`, deduplicated by normalised name against personal), **template** (`getMealTemplates`, `isActive` only, never deduplicated against meals).
- Result shape `DiscoveryItem`: composite `id` (`"sourceType:internalId"`), `name`, `sourceType`, `sourceLabel`, `isAlreadySaved`, `importable` (always `false` in Phase 1), `internalId`, `dietTypes`. Capped at 15 results.
- Read-only, `search` is the only executable intent (`recommend` is declared but gaps honestly — no ranking method exists yet). No HTTP route — platform-internal, reached only via the Intent Engine's natural-language pattern matching.
- No nutrition fields, no fabricated results, no cross-user data (verified by the doc's own test assertions, not re-run here).

**Gap to flag for Luna:** `PlannerDragDrop.tsx`'s `SearchResultDragData.sourceOrigin` is a closed union of `"cookbook" | "freezer" | "packaged"` — this does **not** textually match `meal-discovery`'s three `sourceType` values (`"personal" | "system" | "template"`). Whether the Planner Assistant panel that produces these draggable rows calls the `meal-discovery` intelligence capability directly, calls a different/older endpoint, or maps between the two vocabularies was **not traced in this pass** (the Planner Assistant panel component itself was out of the requested scope). This must be resolved before assuming `meal-discovery`'s contract is *the* search contract the redesign needs to preserve — it may only be one of several.

---

## 6. Dirty-state evidence (pre-existing user work vs. future changes)

```
 M client/src/pages/weekly-planner-page.tsx
?? client/public/images/planner/
```
- `PlannerMealCard.tsx` and `PlannerDragDrop.tsx`: **clean** — no diff against HEAD, no untracked changes.
- `weekly-planner-page.tsx`: **modified**, uncommitted. The physical-photo `<img>` block (§2, lines 2053–2059) is part of this diff — i.e., **someone has already started wiring the accepted physical asset into this page** before this investigation. The full extent of the diff beyond that one block was not itemised in this pass; Luna's plan should account for unknown additional pre-existing changes in this file rather than assuming a clean starting point.
- `client/public/images/planner/`: **entirely untracked** — the accepted asset has never been committed.

**EXISTING PLANNER DIRTY WORK IDENTIFIED: YES**

---

## 7. THA typography/brand source

Canonical, already-in-production tokens (not proposed, not generated): `client/src/index.css`
```css
--font-sans:      'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;   /* line 107 */
--font-display:   'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; /* line 108 */
--font-signature: 'Caveat', 'Segoe Script', 'Bradley Hand', cursive;                    /* line 124 */
```
plus a `--font-serif` token (referenced line 1195, exact value not re-quoted here). Applied throughout via `font-family: var(--font-sans|--font-display|--font-signature|--font-serif)` at lines 475, 480, 1195, 1302, 1309, 1315, 1325, 1337. `tailwind.config.ts` exists at repo root and was not independently re-opened in this pass (flagged, not asserted empty). No generated/concept font names appear in this file.

---

## 8. Existing Planner tests

No dedicated **frontend** test file was found for `weekly-planner-page.tsx`, `PlannerMealCard.tsx`, or `PlannerDragDrop.tsx` specifically (no client-side test matching any planner-related pattern). Existing coverage is **backend/server-side only**, in `server/tests/`:
```
dry-run-planner-compliance-cleanup.ts
test-comp4-planner-conversation-activation.ts
test-intelligence-planner-binding.ts
test-intelligence-planner-discovery-binding.ts
test-plan1-planner-intelligence.ts
test-plan2-planner-evolution.ts
test-plan2-planner-intelligence-activation.ts
test-planner-compliance-gate.ts
test-planner-continuous-timeline.ts
test-rm2a-analyser-to-planner.ts
test-rm4-planner-ready-meal-library.ts
test-time3-p7-planner-week-anchor.ts
```
None of these were opened in this pass to confirm exactly what they assert; their names suggest intelligence-binding, continuous-timeline, and compliance-gate coverage rather than desktop-grid/mobile-layout/drag-drop/accessibility UI behavior. **No existing automated coverage protects the desktop 7×3 grid, mobile day-focused view, or drag/drop interaction described in this evidence file** — a redesign risk worth Luna naming explicitly in the implementation plan (new frontend tests, not just preserving backend contracts, may be needed to satisfy "every existing capability must be retained or improved").

---

## 9. Markdown handoff mechanism status

**This file was NOT successfully projected through the bridge's Markdown handoff mechanism.** `.engineering/scripts/project-markdown-handoff.mjs` (the script this task named as "the project's existing safe Markdown handoff mechanism") is currently a tracked **governance stub**:
```
project-markdown-handoff.mjs — STUB, pending governed implementation.
...
throw new Error('project-markdown-handoff.mjs is an unimplemented governance stub. Implementation is pending a governed THA decision scoped to this file.');
```
Running it throws immediately, by design — it has no implementation yet; that implementation is itself pending a separate governed Gate 9 decision scoped exactly to this file and its test (`test-project-markdown-handoff.mjs`). Its own header comment documents the intended contract once implemented: copy (never move) an `.md` file from `docs/investigations/` or `docs/implementation/` into the fixed external root `C:\Users\Colin\The Healthy Apples\Markdown files`, which is what the bridge's `readMarkdownHandoffFile`/`listMarkdownHandoffFiles` operations (`server.gate5.mjs`, `THA_MARKDOWN_HANDOFF_ROOT`) actually read from.

I did not manually copy this file into that external root myself — doing so would bypass the governed projection mechanism this repository has deliberately built (path/extension/traversal/symlink validation, atomic collision-safe write) rather than use it. This file exists only at its source location, `docs/investigations/PLANNER_PHYSICAL_SURFACE_IMPLEMENTATION_EVIDENCE.md`, inside the tracked-but-uncommitted `tha-integrated-dev` working tree — **Luna cannot read it through the bridge's Markdown handoff endpoints yet.** It is reachable today only through the bridge's existing tracked-file investigation/read-range capabilities (which read tracked files — note this new file is itself untracked until added), or by a human/ChatGPT relaying its contents directly.

---

## Summary

```
APPROVED DIRECTION UNDERSTOOD: YES
ACCEPTED ASSET FOUND: YES
ACCEPTED ASSET PATH: client/public/images/planner/PLANNER_TARGET_BLANK_ACCEPTED.png (untracked; governance doc's own named path, artifacts/planner-target-blank/..., does not exist anywhere in the repo)
ACCEPTED ASSET DIMENSIONS: 1280 x 960 px, PNG, 8-bit RGB, ~1030 KB

DESKTOP 7x3 CURRENT SEAM FOUND: YES (weekly-planner-page.tsx:2473-2881, gridTemplateColumns "var(--ws-col-label) repeat(7, 1fr)" x visibleRows)
MOBILE DAY-FOCUSED SEAM FOUND: YES (weekly-planner-page.tsx:2203-2472, mobileDayIndex-driven single-day render)
SEARCH CONTRACT FOUND: PARTIAL — meal-discovery capability documented and read (INT26 doc), but its relationship to PlannerDragDrop.tsx's search-result sourceOrigin vocabulary ("cookbook"/"freezer"/"packaged" vs. "personal"/"system"/"template") was not traced and must not be assumed identical
DND CONTRACT FOUND: YES (PlannerDragDrop.tsx, all 8 exported components read in full; DndContext/sensors/onDragEnd/DragOverlay line ranges in weekly-planner-page.tsx mapped)
THA TYPOGRAPHY SOURCE FOUND: YES (client/src/index.css, --font-sans/--font-display/--font-signature/--font-serif tokens)

EXISTING PLANNER DIRTY WORK IDENTIFIED: YES (weekly-planner-page.tsx modified — includes the PLANNER_TARGET_BLANK_ACCEPTED.png <img> wiring already in progress; client/public/images/planner/ entirely untracked)

IMPLEMENTATION PERFORMED: NO
FILES MODIFIED: NONE (this evidence file is a new file, not a modification to any Planner implementation file)
GIT CHANGES: NONE

READY FOR LUNA FINAL IMPLEMENTATION PLAN: PARTIAL — see open gaps: (1) canonical accepted-asset path in PROJECT_GOVERNANCE.md does not resolve to any real file; (2) search-contract vocabulary mismatch between the drag/drop layer and the documented meal-discovery capability is unresolved; (3) no frontend test coverage exists for any of the UI this redesign will touch; (4) this file has not been projected through the (currently unimplemented) Markdown handoff mechanism, so Luna cannot read it via the bridge yet.
```

Do not start development. Luna plans first; Claude develops only after THA Executor has reviewed the plan and created the governed implementation decision.
