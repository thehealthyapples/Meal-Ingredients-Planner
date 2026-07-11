# THA Dialog Foundation Implementation Report

**Date:** 2026-06-16  
**Status:** ✅ Complete  
**Rollback Point:** `tha-dialog-foundation-rollback-1781626623`

---

## Executive Summary

The THA Dialog Foundation establishes a shared semantic language for dialog sizing and presentation. Following the pattern of `useAdaptiveDensity()` (which introduced `compact`, `comfortable`, `expanded` for layout density), the foundation introduces:

- **DialogSize**: Four semantic size categories for dialog widths
- **DialogPresentation**: Three presentation styles (modal, drawer, sheet)
- **Helper utilities**: Functions to map sizes to Tailwind classes and pixel values
- **Presets (optional)**: Common dialog configurations for future migrations

**Key Design Decision:** Drawer is a *presentation style*, not a size. This distinction is intentional and clearly documented.

**Scope:** Infrastructure only. No dialogs migrated. No CSS changed. No behavior changes.

---

## Files Created

### Primary Implementation

**File:** `client/src/components/ui/dialog-foundation.ts`

**Exports:**
- `DialogSize` (type): "compact" | "comfortable" | "expanded" | "workspace"
- `DialogPresentation` (type): "modal" | "drawer" | "sheet"
- `DialogDefinition` (interface): Pairs a size with a presentation
- `DialogPreset` (type): Type-safe preset values
- `DIALOG_PRESETS` (const): 6 predefined configurations

**Helper Functions:**
- `getDialogWidthClass(size)` → Tailwind width class
- `getDialogWidthPixels(size)` → Numeric width in pixels
- `getDialogPresentationClass(presentation)` → Presentation CSS class (extensible)
- `getDialogSizeLabel(size)` → Human-readable size label
- `getDialogPresentationLabel(presentation)` → Human-readable presentation label

---

## DialogSize Definition

Maps semantic names to actual Tailwind classes:

| Size | Width | Use Cases |
|------|-------|-----------|
| **compact** | `sm:max-w-[420px]` (420px) | Delete confirmations, remove boost, clear basket |
| **comfortable** | `sm:max-w-[540px]` (540px) | Forms, food knowledge, profile editing |
| **expanded** | `sm:max-w-[760px]` (760px) | Scan review, imports, larger forms |
| **workspace** | `max-w-2xl` (768px) | Meal detail, planner assistant, comparison |

---

## DialogPresentation Definition

Three independent presentation styles:

| Presentation | Behavior | Use Cases |
|--------------|----------|-----------|
| **modal** | Centered dialog with overlay. Blocks outside interaction. | Standard confirmations, forms, settings |
| **drawer** | Slides in from edge (right on desktop, bottom on mobile). | Navigation, filters, side panels, inspection |
| **sheet** | Bottom sheet or slide-up panel. Mobile-first interaction. | Forms, contextual menus, mobile workflows |

**Critical:** Presentation is decoupled from size. A workspace-sized dialog can appear as a modal, drawer, or sheet.

---

## Helper Functions

### getDialogWidthClass(size: DialogSize): string

Maps size to Tailwind max-width class.

```typescript
getDialogWidthClass("compact")     // "sm:max-w-[420px]"
getDialogWidthClass("comfortable") // "sm:max-w-[540px]"
getDialogWidthClass("expanded")    // "sm:max-w-[760px]"
getDialogWidthClass("workspace")   // "max-w-2xl"
```

### getDialogWidthPixels(size: DialogSize): number

Returns numeric width for layout calculations.

```typescript
getDialogWidthPixels("compact")     // 420
getDialogWidthPixels("comfortable") // 540
getDialogWidthPixels("expanded")    // 760
getDialogWidthPixels("workspace")   // 768
```

### getDialogPresentationClass(presentation: DialogPresentation): string

Returns presentation-specific classes. Currently a placeholder for future extensibility. When presentation-specific styling is needed (transitions, z-index, animations), it will be added here.

```typescript
getDialogPresentationClass("modal")  // ""
getDialogPresentationClass("drawer") // ""
getDialogPresentationClass("sheet")  // ""
```

### getDialogSizeLabel & getDialogPresentationLabel

Human-readable labels for debugging and logging.

```typescript
getDialogSizeLabel("compact")         // "Compact (420px)"
getDialogPresentationLabel("drawer")  // "Drawer"
```

---

## Optional: DIALOG_PRESETS

Six predefined combinations for semantic clarity in future migrations:

```typescript
DIALOG_PRESETS.confirmCompact   // { size: "compact", presentation: "modal" }
DIALOG_PRESETS.formComfortable  // { size: "comfortable", presentation: "modal" }
DIALOG_PRESETS.formExpanded     // { size: "expanded", presentation: "modal" }
DIALOG_PRESETS.workspaceModal   // { size: "workspace", presentation: "modal" }
DIALOG_PRESETS.workspaceDrawer  // { size: "workspace", presentation: "drawer" }
DIALOG_PRESETS.formSheet        // { size: "comfortable", presentation: "sheet" }
```

These are **NOT** used by any existing dialogs. They are provided as semantic documentation and for future migration guidance.

---

## Type Safety & Documentation

The foundation file includes comprehensive inline documentation:

1. **File header:** Explains the foundation concept and drawer/size distinction
2. **Type comments:** Each type includes use-case examples
3. **Function comments:** Document return values, Tailwind mappings, and extensibility
4. **Inline warnings:** Clarify correct vs. incorrect usage patterns

---

## What Was NOT Changed

✅ **Explicitly untouched:**
- No dialogs migrated
- No `DialogContent` changes
- No `AlertDialogContent` changes
- No `Sheet` component changes
- No `Drawer` component changes
- No Tailwind configuration changes
- No CSS changes
- No planner assistant changes
- No meal detail dialog changes
- No existing dialog widths changed
- No providers created

This is **infrastructure only**.

---

## Build Verification

✅ **Build Status: PASS**

```
✓ 3209 modules transformed.
✓ built in 17.45s

../dist/public/assets/index-DgJpJ68q.css  161.40 kB │ gzip:  25.71 kB
../dist/public/assets/index-DQJf5VIb.js   3,098.31 kB │ gzip: 829.72 kB
```

No CSS bundle size changes. The foundation is purely type/utility infrastructure.

---

## Manual Test Results

### Test 1: App Builds ✅
```bash
npm run build
→ ✓ built in 17.45s
```

### Test 2: No Dialog Appearance Changes ✅
- Verified no CSS modifications
- Verified no component changes
- Verified no imports in dialog-related files

### Test 3: No Width Changes ✅
- No Tailwind configuration modified
- No existing dialog width classes touched
- Foundation only *documents* existing widths, does not change them

### Test 4: CSS Bundle Unchanged ✅
```
Before: 161.40 kB │ gzip: 25.71 kB
After:  161.40 kB │ gzip: 25.71 kB
```

CSS bundle size unchanged. Foundation adds zero CSS.

### Test 5: Foundation Exports Usable ✅
- `DialogSize` type is exported and usable
- `DialogPresentation` type is exported and usable
- `DialogDefinition` interface is exported and usable
- All helper functions are exported
- `DIALOG_PRESETS` and `DialogPreset` type are exported
- TypeScript compilation succeeds with no errors

---

## Scope Lock Verification

| Item | Status |
|------|--------|
| DialogSize exported | ✅ Yes |
| DialogPresentation exported | ✅ Yes |
| DialogDefinition exported | ✅ Yes |
| Helper functions created | ✅ Yes |
| Comprehensive documentation | ✅ Yes |
| Drawer separated from size | ✅ Yes |
| DIALOG_PRESETS (optional) | ✅ Yes |
| No dialogs migrated | ✅ Verified |
| No CSS changed | ✅ Verified |
| Build passes | ✅ Yes |
| No unrelated changes | ✅ Verified |

---

## Rollback Instructions

If needed, rollback using:

```bash
git reset --hard tha-dialog-foundation-rollback-1781626623
```

This will:
- Remove `client/src/components/ui/dialog-foundation.ts`
- Remove this investigation report
- Return to the state before Dialog Foundation implementation

---

## Next Phase (Future)

The Dialog Foundation is now ready for migration work. When migrating existing dialogs, future phases could:

1. **Audit Phase:** Document each dialog's current size and presentation
2. **Migration Phase:** Update dialogs to use `DialogDefinition` and helper functions
3. **Verification Phase:** Ensure each dialog's semantic classification is correct
4. **Consistency Phase:** Apply consistent styling via `getDialogPresentationClass()`

Example migration (not yet implemented):
```typescript
// Before
<DialogContent className="sm:max-w-[540px]">
  {/* form content */}
</DialogContent>

// After
<DialogContent className={getDialogWidthClass("comfortable")}>
  {/* form content */}
</DialogContent>
```

This foundation ensures that when migrations occur, they will be guided by semantic intent rather than arbitrary pixel values.

---

## Conclusion

The THA Dialog Foundation establishes infrastructure for a shared semantic language in dialogs, following the proven pattern of adaptive density. It provides:

- ✅ Type-safe size and presentation definitions
- ✅ Helper utilities for consistent mapping
- ✅ Comprehensive documentation
- ✅ Zero behavior changes
- ✅ Zero CSS changes
- ✅ Ready for future migrations

**Status: Ready for integration. No dialogs impacted.**
