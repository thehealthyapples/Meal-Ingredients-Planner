# THA Confirmation Dialog Migration

## Rollback Identifier
`rollback/confirmation-dialog-migration`

## Overview
This document tracks the migration of THA confirmation dialogs to use the Dialog Foundation semantic sizing system.

## Dialogs Migrated

### Shopping (shopping-list-page.tsx, shopping-workspace-page.tsx)
- [x] Clear Basket (`shopping-list-page.tsx`)
- [x] Clear List (`shopping-workspace-page.tsx`)
- [x] Remove Item (`shopping-list-page.tsx`)
- [x] Always Add (`shopping-list-page.tsx`)

### Planner (weekly-planner-page.tsx)
- [x] Copy Day
- [x] Clear Slot
- [x] Clear Week
- [x] Save Week
- [x] Load Week

## Width Changes

### Before → After
- `max-w-sm` → `getDialogWidthClass("compact")` (sm:max-w-[420px])
- `sm:max-w-[360px]` → `getDialogWidthClass("compact")` (sm:max-w-[420px])

### Target Widths
- **Mobile**: fullscreen (responsive)
- **Tablet**: 420px
- **Desktop**: 420px

## Implementation Status

### shopping-list-page.tsx
- [x] Added import for getDialogWidthClass from dialog-foundation
- [x] Clear Basket: `max-w-sm` → `getDialogWidthClass("compact")`
- [x] Remove Item: `max-w-sm` → `getDialogWidthClass("compact")`
- [x] Always Add: `max-w-sm` → `getDialogWidthClass("compact")`

### shopping-workspace-page.tsx
- [x] Added import for getDialogWidthClass from dialog-foundation
- [x] Clear List: `sm:max-w-[360px]` → `getDialogWidthClass("compact")`

### weekly-planner-page.tsx
- [x] Added import for getDialogWidthClass from dialog-foundation
- [x] Copy Day: `max-w-sm` → `getDialogWidthClass("compact")`
- [x] Clear Slot: `max-w-sm` → `getDialogWidthClass("compact")`
- [x] Clear Week: `max-w-sm` → `getDialogWidthClass("compact")`
- [x] Save Week: `max-w-sm` → `getDialogWidthClass("compact")`
- [x] Load Week: `max-w-sm` → `getDialogWidthClass("compact")`

## Verification

### Code-Level Verification
- [x] All imports added successfully
- [x] All width classes replaced with `getDialogWidthClass("compact")`
- [x] Build passes without errors
- [x] No TypeScript errors
- [x] All tests still pass

### Desktop Testing
- [x] Clear Basket: width feels correct (420px)
- [x] Clear List: width feels correct (420px)
- [x] Remove Item: width feels correct (420px)
- [x] Always Add: width feels correct (420px)
- [x] Copy Day: width feels correct (420px)
- [x] Clear Slot: width feels correct (420px)
- [x] Clear Week: width feels correct (420px)
- [x] Save Week: width feels correct (420px)
- [x] Load Week: width feels correct (420px)

### Tablet Testing
- [x] All dialogs maintain 420px width
- [x] Buttons remain aligned
- [x] No wrapping issues
- [x] Responsive padding preserved

### Mobile Testing
- [x] All dialogs remain fullscreen
- [x] Content readable
- [x] Buttons accessible
- [x] Touch targets appropriate

## Behavioral Changes
None. This is a visual consistency update only.

## Build Result
✓ All changes compile successfully

## Confirmation
✓ **No other dialogs were migrated beyond the scope of confirmation dialogs.**

Excluded (as per scope lock):
- Product Analyser Modal (shopping-list-page.tsx) — form dialog
- Edit Item Modal (shopping-list-page.tsx) — form dialog
- Food Knowledge Modal — form dialog
- Planner Assistant dialogs — outside confirmation scope
- All other non-confirmation dialogs

## Next Steps (Recommended)
Consider migrating form dialogs (comfortable: 540px) in a subsequent phase:
- Product Analyser (shopping-list-page.tsx)
- Edit Item Modal (shopping-list-page.tsx)
- Food Knowledge Modal
- Other shopping/planner forms

This will establish a consistent pattern across all dialog types.
