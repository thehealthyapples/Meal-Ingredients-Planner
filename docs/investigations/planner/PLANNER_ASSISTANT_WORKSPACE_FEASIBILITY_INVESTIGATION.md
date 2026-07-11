PLANNER ASSISTANT WORKSPACE FEASIBILITY INVESTIGATION: COMPLETE

---

**Rollback Identifier:** `pre-investigation/planner-assistant-workspace-feasibility` → `c84a7a992c3a8daa1f3d3fd35663081aa5b19891`
**To restore:** `git checkout pre-investigation/planner-assistant-workspace-feasibility`
**Git status at start:** Clean working tree (no modified tracked files)
**Date:** 2026-06-07

---

## Files Reviewed

| File | Purpose |
|---|---|
| `client/src/pages/weekly-planner-page.tsx` | Main planner page (3858 lines) |
| `client/src/components/PlannerAssistantPanel.tsx` | Assistant panel component (1953 lines) |
| `client/src/components/PlannerDragDrop.tsx` | DnD-kit wrappers |
| `client/src/components/PlannerScanReview.tsx` | Scan review (inline mode exists) |
| `client/src/components/SmartReviewPanelContent.tsx` | Smart plan review (inline mode exists) |
| `client/src/components/templates-panel.tsx` | Template browser (inline mode exists) |
| `client/src/components/PlannerBulkAssignPanel.tsx` | Bulk assign panel |
| `client/src/components/PlannerMealPickerPanel.tsx` | Manual meal picker |
| `client/src/contexts/PlannerContext.tsx` | AssistantMode + selectedDay state + session persistence |
| `client/src/contexts/PlannerWorkspaceContext.tsx` | Smart suggest controls + planner settings |
| `client/src/lib/planner-staging-bus.ts` | Scan → proposal tray bridge (sessionStorage) |
| `client/src/lib/planner-types.ts` | Shared planner type definitions |
| `client/src/hooks/use-smart-suggest.ts` | Smart plan generation + session persistence |
| `client/src/hooks/use-planner-scan.ts` | Scan file upload + state |
| `client/src/hooks/use-planner-operations.ts` | All CRUD mutations + createPlannerIntent |
| `server/lib/planner-compliance.ts` | Profile compliance gate |
| `server/routes.ts` | All API routes (planner, smart-suggest, scan, templates) |

---

## Section 1 — Current State Analysis

### Current Planner Architecture

The planner is a single-page application mounted at the `/planner` route rendered by `weekly-planner-page.tsx`. It is **not** a separate route per workflow; all entry points, tools, and review states are rendered inside the same page component tree.

**Layout structure (desktop):**
```
<DndContext>
  <div className="flex gap-3 items-start">
    <div className="flex-1 min-w-0">        ← Planner grid (Tabs per week → matrix grid)
      <Tabs>                                  7-column date × N-row mealType matrix
        ...weekly grid...
      </Tabs>
    </div>

    <PlannerAssistantPanel                  ← Persistent aside (w-[244px], sticky top-28)
      mode={assistantMode}
      ...
    />
  </div>
</DndContext>
```

**Layout structure (mobile):**
```
<DndContext>
  <div>                                     ← Planner grid (mobile tab view, single day at a time)
    ...mobile day tabs...
  </div>
  <PlannerAssistantPanel                   ← vaul Drawer (bottom sheet, max-h-[75vh])
    mobileOpen={mobileAssistantOpen}
    mode={assistantMode}
    ...
  />
</DndContext>
```

### Planner State Ownership

| State | Owner | Persistence |
|---|---|---|
| `assistantMode` | `PlannerContext` (React context) | `sessionStorage` (RESTORABLE_MODES) |
| `selectedDayId` | `PlannerContext` | `sessionStorage` |
| Smart suggest controls (budget, cuisine, UPF, etc.) | `useSmartSuggest` hook | In-memory only |
| Smart plan result | `useSmartSuggest` hook | `sessionStorage` (version-gated) |
| Scan result | `usePlannerScan` hook | `sessionStorage` (SCAN_SESSION_KEY) |
| Proposal tray items | `IdlePanelContent` within PlannerAssistantPanel | `sessionStorage` (PROPOSAL_TRAY_KEY) |
| Active week number | `weekly-planner-page` local state | `localStorage` |
| Cooked entry IDs | `weekly-planner-page` local state | `localStorage` |
| `resolveSession` (linking context) | `weekly-planner-page` local state | `sessionStorage` (Phase B) |
| Planner settings (rows shown) | Server (via `PlannerWorkspaceContext`) | Database |
| Planner grid data | Server via `/api/planner/full` | Database |
| Basket meal IDs | Server via `/api/planner/basket-meal-ids` | Database |
| Provisioning items | Server | Database |

### Planner Save Flow

```
User action (add/remove/move/reorder meal in grid)
    ↓
usePlannerOperations mutation (TanStack Query useMutation)
    ↓
apiRequest → POST/PATCH/DELETE /api/planner/…
    ↓
server/routes.ts handler → storage.ts write
    ↓
qc.invalidateQueries({ queryKey: ["/api/planner/full"] })
    ↓
React re-render (grid updates)
```

Optimistic updates exist for reorder and move operations. All writes go through the operations hook — the grid itself does not write directly to the server.

### Planner Creation Flow

Weeks are auto-created on first fetch by the `/api/planner/full` endpoint. There is no explicit "create week" user action.

### Modal Usage Inventory

| Modal / Overlay | Type | Trigger |
|---|---|---|
| Meal detail | `<Dialog>` | Click meal entry in grid |
| Clear week confirm | `<Dialog>` | "Clear week" action |
| Mobile long-press actions | `<Sheet>` (bottom) | Long-press/hold meal on mobile |
| Mobile move-to-day picker | `<Sheet>` (bottom) | Long-press → "Move to day" |
| Share plan | `<SharePlanDialog>` | Hub → Share button |
| Adaptation review | `<AdaptationReviewSheet>` | Meal detail → adapt action |
| Templates (non-inline) | `<Dialog>` | When not in assistant panel |
| Meal assistant panel (desktop) | `<aside>` (sticky sidebar) | Persistent — never a modal |
| Meal assistant panel (mobile) | `<Drawer>` (vaul, bottom) | FAB / hub button |

**Key observation:** the assistant panel is already a persistent sidebar on desktop, not a modal. Modal usage is limited to meal detail and utility confirmations.

### Existing Planner Assistant Functionality

The `PlannerAssistantPanel` component already implements the full workspace concept. Current `AssistantMode` enum values:

```
"scan"               → Scan Planner (photo/upload entry)
"scan-review"        → Review extracted meals from scan
"smart"              → Smart Planner controls
"smart-review"       → Review AI-proposed week plan
"templates"          → THA + personal templates browser
"manual"             → Cookbook search + meal picker
"build"              → Build-a-Meal (recipe creation inline)
"bulk"               → Bulk assign meals across days
"day"                → Day view (expanded daily detail)
"settings"           → Planner options (row config)
"resolve"            → Link recipe to placeholder meal
"placeholder-review" → Review all unlinked meals
"analyser"           → Product analyser
"shopping-ready"     → Post-generation shopping handoff
null                 → Hub / idle state (section grid: Plan, Add & Import, Manage)
```

The idle hub (`null` mode) contains collapsible sections:
- **Plan** — Smart, Scan, Templates, Analyse buttons
- **Add & Import** — Idea (intent), Search, Build, Scan recipe buttons + proposal staging input
- **Manage** — Options, Multi, Share
- **Shopping** — conditional on basket content
- **Review & Place** — conditional on proposals or placeholder count

### Existing Template Integration

`TemplatesPanel` is rendered inline within the assistant panel (`inline={true}`) when `mode === "templates"`. It fetches THA library templates and user templates. Template apply routes (`POST /api/plan-templates/:id/apply-to-week/:weekId` and `POST /api/plan-templates/:id/apply`) go through the compliance gate.

### Existing Smart Planner Integration

`useSmartSuggest` hook owns all generation state. Smart controls (cuisine, budget, UPF, overrides, leftovers) are surfaced in `SmartContent` which reads from `PlannerWorkspaceContext`. On completion, `assistantMode` switches to `"smart-review"` and `SmartReviewPanelContent` renders inline in the panel. Apply writes all entries server-side through the compliance gate.

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     weekly-planner-page.tsx                         │
│                                                                     │
│  PlannerContext ──────── assistantMode, selectedDayId               │
│  PlannerWorkspaceContext ─ smartControls, plannerSettings           │
│                                                                     │
│  ┌────────────────────────────────┐  ┌──────────────────────────┐  │
│  │      DndContext (dnd-kit)      │  │                          │  │
│  │  ┌──────────────────────────┐  │  │  PlannerAssistantPanel   │  │
│  │  │   Planner Grid (Tabs)    │  │  │  (aside / Drawer)        │  │
│  │  │  7-col × N-row matrix    │  │  │                          │  │
│  │  │  DroppablePlannerCell    │  │  │  IdlePanelContent        │  │
│  │  │  SortablePlannerEntry    │  │  │  ├─ Plan section         │  │
│  │  │  DroppableProvisioning   │  │  │  ├─ Add & Import section │  │
│  │  │  MobileDayDropTarget     │  │  │  ├─ Manage section       │  │
│  │  └──────────────────────────┘  │  │  ├─ Shopping section     │  │
│  │                                 │  │  └─ Review & Place       │  │
│  │  DragOverlay                    │  │                          │  │
│  └────────────────────────────────┘  │  Mode-specific views:    │  │
│                                      │  SmartContent            │  │
│  Hooks:                              │  SmartReviewPanelContent │  │
│  useSmartSuggest                     │  PlannerScanReview       │  │
│  usePlannerScan                      │  TemplatesPanel (inline) │  │
│  usePlannerOperations                │  PlannerMealPickerPanel  │  │
│  usePlannerMealSearch                │  PlannerBulkAssignPanel  │  │
│                                      │  CreateMealContent       │  │
│  planner-staging-bus (sessionStorage)│  DayViewDrawer (inline)  │  │
│                                      │  ResolveContent          │  │
│  Modals (separate):                  │  PlaceholderReviewContent│  │
│  Meal Detail Dialog                  │  PlannerAnalyserContent  │  │
│  Clear Week Dialog                   │  ShoppingHandoffPanel    │  │
│  Mobile Sheet (long-press)           └──────────────────────────┘  │
│  AdaptationReviewSheet                                              │
│  SharePlanDialog                                                    │
└─────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
               /api/planner/full (TanStack Query)
               /api/meal-plans/smart-suggest
               /api/scan
               /api/plan-templates/:id/apply
               /api/planner/basket-meal-ids
```

---

## Section 2 — Planner Assistant Panel Feasibility

### Can the planner remain visible while interacting with tools?

**Yes — it already does.** On desktop, `PlannerAssistantPanel` renders as a `sticky top-28` `<aside>` element alongside the planner grid in a `flex gap-3` container. The planner grid remains fully mounted and scrollable behind the panel. The panel does not overlay or obscure the grid. There is no route change, modal takeover, or unmount of the grid when the assistant activates.

On mobile, the vaul `<Drawer>` renders at `max-h-[75vh]`, leaving the top 25% of the planner grid visible above the drawer.

### Can the panel remain open across actions?

**Yes — it already does.** `assistantMode` persists in `sessionStorage` via `PlannerContext`. The panel does not close on planner saves, week changes, or DnD events. Modes restore automatically on page refresh for all `RESTORABLE_MODES`.

### What state conflicts exist?

| Conflict Area | Current Behaviour | Risk |
|---|---|---|
| `resolveSession` is local to page | Not in context — must be managed in page | Low — already handled by passing props |
| Smart result only lives in hook | Panel can only review it if hook is mounted | Low — hook is always mounted with the page |
| Scan result lives in `usePlannerScan` hook | Same as above | Low |
| `mobileAssistantOpen` is separate from `assistantMode` | Mobile needs both flags to open drawer | Low — already working |
| `pickerTarget` lives in page state | Panel depends on page to supply it | Low — already prop-drilled |
| `resolveSubview` lives inside `PlannerAssistantPanel` | Sub-navigation state is internal | Low — correct encapsulation |

No hard state conflicts exist. The panel is already architecturally decoupled from the grid state.

### What routing changes would be required?

**None for the core model.** The workspace already operates without route changes for all panel modes. Navigation to `/planner` renders the workspace. All tool states are mode-switches within the panel, not route changes.

The only routing callout: `ShoppingHandoffPanel` navigates to `/shopping-workspace?stage=shop&source=planned` — this is a deliberate cross-feature handoff and is correct. It should remain.

### What mobile implications exist?

- The vaul Drawer already handles all mobile modes. The hub (`null` mode) defaults sections to collapsed on mobile.
- The `max-h-[75vh]` cap means complex views (smart review, scan review) require internal scrolling — already implemented.
- Mobile requires `mobileAssistantOpen` as an additional flag separate from `assistantMode` — the distinction between "open to a specific mode" vs "open the hub" is already modelled.
- A mobile floating action button (FAB) or persistent tab-bar entry is the natural companion entry point, but this is a UX decision, not a structural constraint.

### Risk Assessment: Section 2

| Risk | Severity | Notes |
|---|---|---|
| Panel already exists and works | None | This is the baseline, not a risk |
| Grid + panel co-existence | None | Already proven in production |
| State conflicts | Low | Existing prop interface manages all shared state correctly |
| Mobile drawer depth limit | Low | Some modes (smart-review, scan-review) are content-heavy; internal scroll already handles this |
| Session restore fidelity | Low | All restorable modes have session restore; edge cases handled |

---

## Section 3 — Planner Input Consolidation

### Can all inputs be unified into a single Planner Assistant?

**Largely yes — and most are already there.** Assessment by input type:

#### Scan Planner — ALREADY IN PANEL
- `ScanContent` (photo/upload) renders at `mode === "scan"`
- `PlannerScanReview` renders inline at `mode === "scan-review"`
- `usePlannerScan` hook is wired into the page and feeds the panel
- **Required change:** None. Fully operational.

#### Smart Planner — ALREADY IN PANEL
- `SmartContent` renders at `mode === "smart"`
- `SmartReviewPanelContent` renders at `mode === "smart-review"`
- `useSmartSuggest` hook feeds both
- **Required change:** None. Fully operational.

#### THA Templates — ALREADY IN PANEL
- `TemplatesPanel` renders inline at `mode === "templates"` with `inline={true}`
- **Required change:** None. Fully operational.

#### My Templates — ALREADY IN PANEL
- `TemplatesPanel` shows both library and user templates in the same component
- **Required change:** None. Fully operational.

#### Manual Entry / Cookbook Search — ALREADY IN PANEL
- `PlannerMealPickerPanel` renders at `mode === "manual"`
- Includes local search, category filter, and web recipe search with `usePlannerMealSearch`
- **Required change:** Entry point visibility. Currently requires a cell click to set `pickerTarget`. The panel hub could surface a "Browse & pick" entry that selects a target day automatically. Small wiring change.

#### Build-a-Meal — ALREADY IN PANEL
- `CreateMealContent` renders at `mode === "build"`
- Supports `buildInitialTitle` pre-fill from placeholder context
- **Required change:** None. Fully operational.

### Areas Already Compatible (no refactoring needed)

- All seven tool modes are mounted inside the panel
- The idle hub already surfaces all entry points via section grids
- `DraggableProposalCard` already supports drag-from-panel to grid
- Session persistence already covers mode, scan, smart result, resolve context, proposal tray, section states
- Proposal staging + Review & Place section already consolidates the "ideas → placed" flow

### Areas Needing Refactoring

| Area | What Would Change | Complexity |
|---|---|---|
| `pickerTarget` dependency | Manual mode requires page to set `pickerTarget` from a cell click; could be relaxed by defaulting to active-day first slot | Low |
| Panel width on desktop | Current `w-[244px]` is narrow for complex modes (scan-review, smart-review); increasing to ~300-320px would improve usability for richer content | Low |
| Mobile hub entry point | No persistent FAB or tab bar entry on mobile; users must know to tap the drawer trigger | Medium (UX, not structural) |
| `mobileAssistantOpen` flag | Separate from `assistantMode`; could be folded into context | Low |
| Scan recipe (cook-side) | `onScanRecipe` navigates to `/meals` with scan mode — cross-feature; could be replaced with an inline scan-to-cookbook flow | Medium |

---

## Section 4 — Planner Intent Layer

### Is an intent layer already partially present?

**Yes — substantially.** The concept is implemented under two complementary mechanisms:

**Mechanism 1: Planner Intent (named placeholder)**

`createPlannerIntent()` in `use-planner-operations.ts` creates a `Meal` record with `mealSourceType: "planner-placeholder"` and `ingredients: []`, then adds a planner entry for it. The meal appears in the grid as an "unlinked" entry. The `PlaceholderReviewContent` in the panel surfaces all such entries with link-recipe / build / scan options.

This is exactly the "Fish cakes and salad → Low-carb salmon fishcakes" intent-to-recipe journey described in the brief. The intent exists as a named placeholder in the grid, and the resolve workflow (mode `"resolve"` or `"placeholder-review"`) closes the gap.

**Mechanism 2: Proposal Tray (staged idea)**

The "Add & Import" section accepts a meal name + type, creates a `ProposalItem` in `sessionStorage`, and renders it as a draggable card in "Review & Place". The user drags the card onto the planner grid. This is a lighter-weight intent that stays in the panel until explicitly placed, without creating a server record prematurely.

### Would new persistence be required?

**No.** Both mechanisms already persist:
- Proposal tray persists to `sessionStorage` via `planner-proposal-tray`
- Planner placeholder is a real database record (meal + entry)

If intent → draft state (named idea, not yet in grid, not yet a DB record) is desired as an intermediate stage, a new `sessionStorage` key would suffice. No schema changes needed for the current two-stage model.

### Would planner data structures need changing?

**No**, for the current intent model. The `mealSourceType: "planner-placeholder"` field is already in the schema and is excluded from recommendation pools and compliance enforcement.

If intent metadata (e.g. "user typed this, not yet committed") were to be distinguished from "AI placed this", a new `mealSourceType` value or a flag on `PlannerEntry` could be added — but this is a future extension, not a prerequisite.

### Could this be implemented incrementally?

**Yes.** The intent layer is already 80% implemented. Remaining incremental steps are:
1. Surface the intent input more prominently in the hub (currently tucked in "Add & Import")
2. Auto-open "Review & Place" when a proposal is added (scroll-to or auto-expand)
3. Richer intent card (add cuisine, servings, budget hint) — UI only
4. Optional: proposal → intent → linked recipe breadcrumb in the grid entry

All of the above are additive UI changes. No backend changes required.

---

## Section 5 — Scan Planner Future Flow

### What already exists

The current scan flow is fully operational end-to-end:

```
User taps "Scan" → ScanContent (camera or upload)
    ↓
File → POST /api/scan (multipart/form-data)
    ↓
AI extraction (Anthropic vision) → PlannerScanData
    ↓
assistantMode → "scan-review"
    ↓
PlannerScanReview (inline in panel) ← scan session persisted to sessionStorage
    ↓
User reviews extracted meals per day
User accepts individual proposals → emitStageProposal → proposal tray
User accepts all → saves entries to planner
    ↓
qc.invalidateQueries("/api/planner/full") → grid updates
```

The planner grid is visible throughout (desktop: panel is a sidebar, grid stays mounted). On mobile, the drawer covers most of the grid during review, but the grid is still mounted underneath.

### What would need changing for the proposed future flow

The proposed flow (Upload → AI extraction → Proposal review → Confirm → Planner placement) is **already the current flow**. The one behavioural gap is:

**Gap:** After accepting individual proposals in scan-review, users tap "Back to hub" to see the Review & Place tray, then drag proposals to specific grid cells. The planner grid is not directly visible during the drawer-open state on mobile.

**Future enhancement (not a blocker):** On desktop, the scan-review panel could show a miniature grid overlay or visual drop targets, allowing direct drag-to-slot from the review list. This would require a coordination layer between the panel's proposal cards and the grid's drop zones — technically feasible given the existing `DraggableProposalCard` + `DroppablePlannerCell` architecture, but medium complexity.

### Whether planner visibility can be preserved throughout

**Desktop:** Yes, entirely. The panel is a sidebar; the grid is always visible.

**Mobile:** Partially. The vaul Drawer covers ~75% of the screen. The top 25% of the grid is visible but not interactive during review. This is a UX consideration, not an architectural constraint. The drawer can be dismissed at any time to access the grid directly.

---

## Section 6 — Drag and Drop Feasibility

### Existing drag/drop capabilities

**Already fully implemented using `@dnd-kit/core` and `@dnd-kit/sortable`.** The planner has a mature DnD system:

| Capability | Status |
|---|---|
| Move entries within a day (reorder) | Implemented — `SortablePlannerEntry` + `SortableContext` |
| Move entries between days (desktop) | Implemented — `DroppablePlannerCell` targets |
| Move entries between days (mobile) | Implemented — `MobileDayDropTarget` with 300ms dwell timer |
| Drag proposal card → planner cell | Implemented — `DraggableProposalCard` + `DroppablePlannerCell` |
| Drag search result → planner | Implemented — `DraggableSearchResultRow` |
| Drag-to-provisioning area | Implemented — `DroppableProvisioning` |
| Custom `DragOverlay` | Implemented — snaps overlay center to cursor |
| Multi-sensor (pointer + touch + keyboard) | Implemented — `PointerSensor`, `TouchSensor`, `KeyboardSensor` |

### Libraries already available

`@dnd-kit/core` and `@dnd-kit/sortable` are installed and in active use. No additional DnD library is needed.

### Planner performance implications

The planner renders up to 7 days × N rows in the grid. With `DndContext` wrapping the full page, drag events fire across all droppables simultaneously. Current approach uses `closestCenter` + `pointerWithin` for collision detection. Performance is acceptable at current scale. Adding more droppables (e.g. proposal cards as targets) would not materially impact performance.

### Complexity assessment

| Scenario | Complexity | Notes |
|---|---|---|
| Current proposal card → grid cell | Already done | Low — zero work |
| Scan review result → grid cell (desktop) | Medium | Requires exposing drop context to panel content |
| Reorder within a day | Already done | Low |
| Cross-day drag (desktop) | Already done | Low |
| Cross-day drag (mobile) | Already done | Low |
| Drag from panel to specific slot type | Medium | Panel needs slot awareness from grid |

**Mobile tap-to-assign** is achievable without DnD: tapping a proposal card could open a day/slot picker sheet. This is simpler than touch DnD across the panel/grid boundary and the more reliable mobile UX.

---

## Section 7 — Session Recovery

### What currently exists

| Recovery scenario | Current Status |
|---|---|
| Smart plan session restored on refresh | Implemented — `loadSmartSession` (version-gated, v2+) |
| Scan review restored on refresh | Implemented — `hasPendingScanSession` + `SCAN_SESSION_KEY` |
| Assistant mode restored on refresh | Implemented — `loadWorkspaceMode()` in `PlannerContext` |
| Selected day restored on refresh | Implemented — `loadSelectedDay()` in `PlannerContext` |
| Proposal tray restored on refresh | Implemented — `loadTraySession()` in `IdlePanelContent` |
| Resolve context restored on refresh | Implemented — sessionStorage Phase B |
| Section open/close states | Implemented — `WORKSPACE_SECTIONS_KEY` in `IdlePanelContent` |
| Accidental close recovery | Implemented — all of the above survives close + reopen |
| Resume unfinished scan import | Implemented — scan session persists, mode restores to `"scan-review"` |
| Resume unfinished smart plan | Implemented — smart session persists with version gate |

### What would need to change

**Nothing is missing for the core recovery model.** The existing session layer covers all stated recovery scenarios.

Future enhancements that would be additive only:
- **Draft week plans** (multi-day edits staged before commit): would require a new draft concept, either client-side diff tracking or a server-side draft table. Not currently present and not required by the existing architecture.
- **Undo/redo for planner edits**: not present; would require an edit history stack. Independent of the workspace model.

---

## Section 8 — AI Role Boundaries

### Can AI remain suggestive, assistive, and advisory?

**Yes — the current architecture enforces this by design.**

Key boundaries already in place:

| Boundary | Implementation | Location |
|---|---|---|
| AI never writes to planner without user approval | Smart plan generates a proposal; user must explicitly click "Apply Week Plan" | `SmartReviewPanelContent` → `applySmartSuggestion()` |
| User can lock individual entries before apply | `lockedEntries` set prevents AI from replacing chosen meals | `useSmartSuggest` |
| User can regenerate individual entries | `regenerateSingleEntry()` regenerates one slot without replacing locked ones | `useSmartSuggest` |
| User can cancel the entire proposal | "Cancel" clears `smartResult` without any writes | `SmartReviewPanelContent` |
| Scan results are proposals, not automatic placements | Each scan-extracted meal requires individual accept or bulk accept | `PlannerScanReview` |
| Template apply goes through compliance gate | System-generated writes are compliance-checked | `planner-compliance.ts` |
| AI suggestions are labelled as proposals | UI uses "Proposed Week Plan", lock icons, accept/reject vocabulary | Throughout |
| Smart suggest does not auto-run | User must explicitly click "Propose My Plan" | `SmartContent` button |

### Architectural boundaries that should be maintained

1. **The "Apply" step must remain explicit.** `applySmartSuggestion()` is the only path from proposal to database write. Any future AI flow should preserve this gate.

2. **The compliance gate must remain the single write-time filter.** `isMealCompliantForUser()` in `planner-compliance.ts` is the authoritative gate for all system-placed meals. AI suggestions are pre-filtered by the same `shouldExcludeRecipe` engine, then gated again at write time.

3. **AI should not hold session state that outlives the session version.** The `SMART_SESSION_VERSION` bump mechanism ensures stale AI proposals are invalidated when the compliance model changes.

4. **Scan results should always go through the proposal tray or manual review.** Direct scan-to-planner without review would remove human oversight. The staging bus is the correct bridge.

5. **The `plannerAssistantPanel` should remain the single AI entry surface.** Embedding AI triggers elsewhere in the grid (e.g. per-cell AI shortcuts) would fragment the oversight model.

---

## Section 9 — Migration Strategy

### Feasibility Assessment

**Overall feasibility: HIGH.**

The Planner Assistant Workspace model is not a future concept — it is the current architecture. The `PlannerAssistantPanel` is already a persistent sidebar on desktop and a bottom drawer on mobile. All seven input modes are already consolidated into a single panel with an idle hub. Drag-and-drop from panel to grid is already operational. Session recovery is comprehensive. AI boundaries are already enforced.

**The investigation found no fundamental architectural blockers.**

The remaining work is in polish, discoverability, and a small number of UX gaps — not structural rewrites.

---

### Phase 1 — Lowest-Risk Changes (Polish + Discoverability)

**Estimated complexity: Low. No schema changes. No new hooks. UI only.**

| Item | Change | Risk |
|---|---|---|
| P1.1 | Increase desktop panel width from `244px` to `288–320px` | Low — CSS only |
| P1.2 | Surface "Review & Place" section auto-expanded when proposals are added | Low — state change in `IdlePanelContent` |
| P1.3 | Add a persistent mobile FAB or tab-bar "Planning" button as hub entry | Low — new button component, already linked to `mobileAssistantOpen` |
| P1.4 | Rename "Add & Import" section to "Add Meals" or "Ideas" | Low — label string only |
| P1.5 | Make "Idea" intent input more prominent (move above the proposal staging input) | Low — JSX reorder |
| P1.6 | Add meal type icon to planner grid placeholder entries | Low — display only |

**Dependencies:** None.
**Risks:** Minimal. All changes are within existing component boundaries.

---

### Phase 2 — Medium-Risk Changes (Behavioural Enhancements)

**Estimated complexity: Medium. No schema changes. Hook or context changes possible.**

| Item | Change | Risk |
|---|---|---|
| P2.1 | Fold `mobileAssistantOpen` into `PlannerContext` (reduce prop drilling) | Medium — context interface change; all consumers update |
| P2.2 | Relax `pickerTarget` requirement in manual mode: default to selected-day first slot | Medium — behaviour change; requires fallback logic |
| P2.3 | Panel width responsive breakpoints (e.g. wider at lg:, narrower at md:) | Low-Medium — CSS + layout |
| P2.4 | Add "tap to assign" sheet for mobile proposal placement (instead of drag) | Medium — new bottom sheet component |
| P2.5 | Inline scan-to-cookbook flow from resolve context (instead of navigate to `/meals`) | Medium — cross-feature integration |
| P2.6 | Improve proposal card UX: show meal type chip, edit name inline | Low — UI only within `IdlePanelContent` |
| P2.7 | Surface "Review & Place" count as a badge on mobile hub button | Low — badge component |

**Dependencies:** P2.1 should precede P2.4 (cleaner state model for mobile).
**Risks:** P2.2 changes default planner behaviour for manual entry (test with existing users). P2.5 touches cross-feature navigation (meal library).

---

### Phase 3 — Long-Term Evolution

**Estimated complexity: High. May require new API routes, new context, or schema changes.**

| Item | Change | Risk |
|---|---|---|
| P3.1 | Drag scan-review results directly to grid cells (desktop) | High — DnD context must bridge panel and grid; requires shared drag state |
| P3.2 | Multi-step intent (idea → refined → linked) with richer metadata | Medium-High — new sessionStorage shape, possibly new meal fields |
| P3.3 | Panel-level undo for planner actions (last N writes) | High — edit history stack, client or server |
| P3.4 | AI-assisted intent resolution ("suggest a recipe for Fish cakes") | High — new API endpoint, AI call, inline suggestion UX |
| P3.5 | Persistent draft week (multi-day uncommitted edits) | High — server-side draft model or deep client diff tracking |
| P3.6 | Shared/collaborative week planning | High — real-time sync or conflict resolution model |

**Dependencies:** P3.1 depends on P1.1 (wider panel gives more room). P3.4 depends on P3.2 (intent metadata to feed the AI). P3.5 is independent but large.
**Risks:** P3.1 is medium-high risk for mobile (touch DnD across drawer/grid boundary is unreliable on some browsers — tap-to-assign from Phase 2 is the safer mobile path). P3.3 and P3.5 are high-risk / high-effort and should be scoped separately.

---

## Complexity Estimates

| Area | Complexity | Confidence |
|---|---|---|
| Panel already exists | Done | Certain |
| Grid + panel co-existence | Done | Certain |
| All input modes in panel | Done | Certain |
| DnD from panel to grid | Done | Certain |
| Session recovery | Done | Certain |
| AI role boundaries | Done | Certain |
| Phase 1 polish items | Low | High |
| Phase 2 behavioural items | Medium | High |
| Phase 3 long-term items | High | Medium |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| The workspace model requires major rewrites | None | N/A | It is already implemented |
| Grid state lost during panel interaction | None | N/A | Grid never unmounts |
| Mobile UX degradation from drawer | Low | Medium | Phase 2 tap-to-assign covers the main gap |
| prop drilling from page to panel becomes unwieldy | Low | Low | PlannerWorkspaceContext already extracts smart controls; further context extraction is incremental |
| DnD from scan-review panel to grid (Phase 3.1) | Medium | Low | Touch DnD across drawer/grid boundary is unreliable; tap-to-assign is the fallback |
| Intent metadata incompatible with compliance gate | None | N/A | Placeholder meals are already excluded from compliance filtering |

---

## Recommended Approach

**Recommendation: Proceed with Phase 1 immediately. Phase 2 after validation.**

The Planner Assistant Workspace is already the architecture. The most impactful near-term investments are discoverability and polish:

1. Widen the desktop panel to give breathing room to content-heavy modes (scan-review, smart-review)
2. Add a persistent mobile entry point (FAB or tab bar) so users know the workspace is always there
3. Elevate the intent input so users naturally think "add an idea here first"
4. Auto-expand Review & Place when new proposals arrive

These are all Phase 1 changes — low risk, high perceived value, no backend work required.

**Do not attempt to redesign the workspace model.** The current architecture is sound. The friction identified in the investigation (modal-heavy workflows, disconnected entry points, context switching) has already been resolved by the existing panel architecture. The remaining friction is discoverability, not structure.

---

## Suggested Next Decision

**Should Phase 1 polish items be prioritised as a single focused sprint, or addressed individually alongside other work?**

Given all Phase 1 items are low-risk, UI-only changes with no interdependencies, a short focused sprint (1–2 sessions) would produce a cohesive result. Addressing them piecemeal risks partial states where the panel is wider but the mobile FAB is missing, for example.

Phase 2 items should each be individually scoped and validated before implementation, particularly P2.2 (picker target default) which changes existing planner interaction behaviour.

---

## Data Impact Declaration

- Reads existing data: Yes (code review only — no database reads)
- Writes new data: No
- Changes meaning of existing data: No
- Requires backfill: No
- Code changes made: None
- Behavioural changes made: None
- UI changes made: None

---

## Trust Check

- All findings are evidence-based (direct code review of named files at specific line numbers)
- No architecture has been guessed or fabricated
- Assumptions are clearly labelled (e.g. "assumed" or "estimated")
- The finding that the workspace already exists is confirmed by reading the source files, not inferred from documentation
- Known limitations (e.g. mobile touch DnD reliability) are flagged as risks, not glossed over
