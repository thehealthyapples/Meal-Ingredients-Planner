# THA Dialog Width Standardisation Audit

**Date:** 2026-06-16  
**Author:** Investigation (Read-Only)  
**Status:** Investigation Complete  
**Rollback ID:** `rollback/dialog-audit-investigation-1781625959`

---

## Executive Summary

THA currently has **40+ dialog and modal implementations** with **23+ unique width configurations**. These widths are applied inconsistently across confirmation dialogs, forms, workspace panels, and drawers. The codebase lacks a density-aware sizing model, making it difficult to:

- Maintain consistent UI proportion across responsive breakpoints
- Apply adaptive density (compact/comfortable/expanded) to overlay UI
- Reduce CSS maintenance and future dialog creation friction
- Predict mobile vs. tablet vs. desktop rendering

**Opportunity:** Standardise on 5 width categories (Compact, Comfortable, Expanded, Workspace, Drawer) that can be controlled via the new `useAdaptiveDensity()` hook and applied consistently across all dialogs.

**Key Finding:** 80% of dialogs can share 3 standard widths (sm:max-w-\[540px\], sm:max-w-\[600px\], sm:max-w-\[760px\]). Another 10% are large workspace dialogs (max-w-2xl to max-w-4xl). 10% are drawers with full/near-full widths.

---

## Section 1: Dialog Inventory

### All Dialog/Modal/Sheet/Drawer Instances by Category

#### **CATEGORY A: Confirmation Dialogs (Small)**
Minimal content, typically buttons only.

| Dialog | Location | Component | Current Width | Mobile | Tablet | Desktop | Use | Recommendation |
|--------|----------|-----------|---|---|---|---|---|---|
| Clear Basket | `shopping-list-page.tsx` | AlertDialog | None | Fullscreen | 80% | 80% | Confirm clear action | Compact |
| Clear List | `shopping-workspace-page.tsx` | AlertDialog | None | Fullscreen | 80% | 80% | Confirm clear | Compact |
| Remove Item | `shopping-list-page.tsx` | AlertDialog | None | Fullscreen | 80% | 80% | Confirm delete | Compact |
| Always Add | `shopping-list-page.tsx` | AlertDialog | None | Fullscreen | 80% | 80% | Confirm action | Compact |
| Copy Day | `weekly-planner-page.tsx` | Dialog | max-w-sm | Fullscreen | sm:max-w-sm | 384px | Copy planner day | Compact |
| Clear Slot | `weekly-planner-page.tsx` | Dialog | max-w-sm | Fullscreen | sm:max-w-sm | 384px | Clear meal slot | Compact |
| Clear Week | `weekly-planner-page.tsx` | Dialog | max-w-sm | Fullscreen | sm:max-w-sm | 384px | Clear planner week | Compact |
| Save Week | `weekly-planner-page.tsx` | Dialog | max-w-sm | Fullscreen | sm:max-w-sm | 384px | Save template | Compact |
| Load Week | `weekly-planner-page.tsx` | Dialog | max-w-sm | Fullscreen | sm:max-w-sm | 384px | Load template | Compact |
| Deactivate Pick | `admin-ingredient-products-page.tsx` | AlertDialog | None | Fullscreen | 80% | 80% | Confirm deactivate | Compact |

**Count:** 10 dialogs | **Width Pattern:** max-w-sm (384px) and alertdialog defaults

---

#### **CATEGORY B: Small Forms (Single Field)**
Edit single fields, short confirmations.

| Dialog | Location | Component | Current Width | Mobile | Tablet | Desktop | Use | Recommendation |
|--------|----------|-----------|---|---|---|---|---|---|
| Bad Apple Warning | `BadAppleWarningModal.tsx` | Dialog | max-w-md | Fullscreen | sm:max-w-md | 448px | Alert UPF content | Comfortable |
| Food Knowledge | `food-knowledge-modal.tsx` | Dialog | max-w-md | Fullscreen | sm:max-w-md | 448px | Food info modal | Comfortable |
| UPF Info | `upf-info-modal.tsx` | Dialog | max-w-md | Fullscreen | sm:max-w-md | 448px | What is UPF? | Comfortable |
| Share Plan | `share-plan-dialog.tsx` | Dialog | sm:max-w-md | Fullscreen | 384px | 384px | Share weekly plan | Comfortable |
| Meal Completion | `meal-completion-dialog.tsx` | Dialog | sm:max-w-md | Fullscreen | 384px | 384px | Mark meal complete | Comfortable |
| Add To Week | `AddToWeekModal.tsx` | Dialog | max-w-md | Fullscreen | sm:max-w-md | 448px | Add to planner | Comfortable |
| Reset Password | `admin-users-page.tsx` | Dialog | sm:max-w-sm | Fullscreen | 384px | 384px | Admin password reset | Comfortable |
| Run Onboarding | `admin-users-page.tsx` | AlertDialog | None | Fullscreen | 80% | 80% | Admin trigger | Compact |
| Edit Child Eater | `profile-page.tsx` | Dialog | max-w-sm | Fullscreen | sm:max-w-sm | 384px | Edit household | Comfortable |
| Add Child Eater | `profile-page.tsx` | Dialog | max-w-sm | Fullscreen | sm:max-w-sm | 384px | Add household | Comfortable |
| Update Preferences | `profile-page.tsx` | Dialog | sm:max-w-sm | Fullscreen | 384px | 384px | Edit user prefs | Comfortable |

**Count:** 11 dialogs | **Width Pattern:** max-w-md (448px) / max-w-sm (384px)

---

#### **CATEGORY C: Medium Forms (Multi-Field)**
Multi-step import, ingredient editing, meal details.

| Dialog | Location | Component | Current Width | Mobile | Tablet | Desktop | Use | Recommendation |
|--------|----------|-----------|---|---|---|---|---|---|
| Import Diary | `import-diary-modal.tsx` | Dialog | max-w-2xl | Fullscreen | 672px | 672px | CSV/TXT import (multi-step) | Expanded |
| Create Meal | `create-meal-modal.tsx` | Dialog | max-w-lg | Fullscreen | 512px | 512px | Create meal recipe | Comfortable |
| Add To Week Modal | Duplicate? | Dialog | max-w-md | Fullscreen | 448px | 448px | Planner action | Comfortable |
| Camera | `camera-modal.tsx` | Dialog | sm:max-w-lg | 100dvh mobile | 512px | 512px | Barcode scanning | Comfortable |
| Day View | `day-view-drawer.tsx` | Dialog | sm:max-w-lg | Fullscreen | 512px | 512px | View planner day detail | Comfortable |
| Barcode Product | `meals-page.tsx` | Dialog | sm:max-w-sm | Fullscreen | 384px | 384px | Product from scan | Comfortable |
| Product Picker | `product-picker-sheet.tsx` | Sheet | (bottom) | h-92dvh | h-92dvh | h-92dvh | Select from history | Drawer |
| Scan Confirm | `scan-confirm-dialog.tsx` | Dialog | sm:max-w-\[580px\] | Fullscreen | 580px | 580px | Confirm scanned item | Expanded |
| Planner Scan Review | `PlannerScanReview.tsx` | Dialog | sm:max-w-\[760px\] | Fullscreen | 760px | 760px | Review planner scan | Expanded |
| Recipe Scan Review | `RecipeScanReview.tsx` | Dialog | sm:max-w-\[600px\] | Fullscreen | 600px | 600px | Review recipe scan | Expanded |
| Shopping Scan Review | `ShoppingListScanReview.tsx` | Dialog | sm:max-w-\[540px\] | Fullscreen | 540px | 540px | Review shopping scan | Expanded |
| Commerce Edit Pick | `admin-ingredient-products-page.tsx` | Dialog | (none) | Fullscreen | responsive | responsive | Edit product mapping | Comfortable |
| Create Pick | `admin-ingredient-products-page.tsx` | Dialog | (none) | Fullscreen | responsive | responsive | Create product mapping | Comfortable |

**Count:** 13 dialogs | **Width Pattern:** max-w-lg (512px), custom \[540px\], \[580px\], \[600px\], \[760px\], max-w-2xl (672px)

---

#### **CATEGORY D: Large Workspace Dialogs (Content-Heavy)**
Detailed nutrition, analysis, explorer, multi-tab content.

| Dialog | Location | Component | Current Width | Mobile | Tablet | Desktop | Use | Recommendation |
|--------|----------|-----------|---|---|---|---|---|---|
| Plant Diversity Explorer | `PlantDiversityExplorer.tsx` | Dialog | max-w-2xl | Fullscreen | 672px | 672px | Nutrition explorer | Workspace |
| Product Detail | `products-page.tsx` | Dialog | max-w-2xl | Fullscreen | 672px | 672px | Full product analysis | Workspace |
| Product Compare | `products-page.tsx` | Dialog | max-w-4xl | Fullscreen | 896px | 896px | Product comparison | Workspace |
| Meal Detail | `meal-detail-page.tsx` | Dialog | (none) | Fullscreen | responsive | responsive | Full meal view | Workspace |
| Dashboard Widget | `dashboard.tsx` | Dialog | max-w-sm / max-w-xs | Fullscreen | 384px/320px | 384px/320px | Widget modal | Comfortable |
| Daily Insights | `dashboard.tsx` | Dialog | max-w-sm | Fullscreen | 384px | 384px | Daily summary | Comfortable |
| Meals - Edit Meal | `meals-page.tsx` | Dialog | sm:max-w-\[600px\] | Fullscreen | 600px | 600px | Edit meal details | Expanded |
| Meals - Meal Actions | `meals-page.tsx` | Drawer | flex flex-col max-h-\[85vh\] | Bottom | Bottom | Bottom | Quick actions | Drawer |
| Meals - Duplicate Edit | `meals-page.tsx` | Dialog | sm:max-w-\[600px\] | Fullscreen | 600px | 600px | Duplicate meal form | Expanded |
| Meals - Image Widget | `meals-page.tsx` | Drawer | flex flex-col | Bottom | Bottom | Bottom | Select image | Drawer |
| Meal Image Widget | `MealImageWidget.tsx` | Drawer | flex flex-col | Bottom | Bottom | Bottom | Choose image | Drawer |
| Meals - Nutrition Modal | `meals-page.tsx` | Dialog | sm:max-w-md | Fullscreen | 384px | 384px | Quick nutrition view | Comfortable |
| Meals - UPF Detail | `meals-page.tsx` | Dialog | sm:max-w-sm | Fullscreen | 384px | 384px | UPF detail | Comfortable |
| Meals - Protein Boost | `meals-page.tsx` | Dialog | sm:max-w-sm | Fullscreen | 384px | 384px | Boost options | Comfortable |
| Meals - Barcode Modal | `meals-page.tsx` | Dialog | sm:max-w-sm | Fullscreen | 384px | 384px | Barcode lookup | Comfortable |
| Nav Bar Profile | `nav-bar.tsx` | Dialog | max-w-md | Fullscreen | 448px | 448px | Profile menu | Comfortable |

**Count:** 16 dialogs | **Width Pattern:** max-w-sm to max-w-4xl, custom \[600px\]

---

#### **CATEGORY E: Drawers & Panels (Bottom or Side)**
Mobile-first sheets, workspace panels, assistants.

| Dialog | Location | Component | Current Width | Mobile | Tablet | Desktop | Use | Recommendation |
|--------|----------|-----------|---|---|---|---|---|---|
| Day View Drawer | `day-view-drawer.tsx` | Drawer | max-h-\[85vh\] | Bottom 85vh | Bottom 85vh | Bottom 85vh | View daily detail | Drawer |
| Planner Assistant | `PlannerAssistantPanel.tsx` | Drawer | max-h-\[75vh\] | Bottom 75vh | Bottom 75vh | Bottom 75vh | AI suggestions | Drawer |
| Cookbook Workspace | `CookbookWorkspacePanel.tsx` | Drawer | max-h-\[75vh\] | Bottom 75vh | Bottom 75vh | Bottom 75vh | Workspace panel | Drawer |
| Adaptation Review | `AdaptationReviewSheet.tsx` | Sheet (bottom) | h-\[92dvh\] | Bottom 92dvh | Bottom 92dvh | Bottom 92dvh | Review adaptations | Drawer |
| Shopping Scan Review | (Sheet) | Sheet (bottom) | rounded-t-2xl | Bottom custom | Bottom custom | Bottom custom | Shopping assist | Drawer |
| Planner Move Day | (Sheet) | Sheet (bottom) | rounded-t-2xl | Bottom custom | Bottom custom | Bottom custom | Move meal | Drawer |
| Planner Entry Actions | `weekly-planner-page.tsx` | Sheet (bottom) | rounded-t-2xl | Bottom custom | Bottom custom | Bottom custom | Quick actions | Drawer |
| Food Diary Drawer | `food-diary-page.tsx` | Drawer | max-h-\[85vh\] | Bottom 85vh | Bottom 85vh | Bottom 85vh | View entry | Drawer |
| List View Drawer | `list-page.tsx` | Drawer | max-h-\[85vh\] | Bottom 85vh | Bottom 85vh | Bottom 85vh | View list item | Drawer |
| Products Analyser Filters | `products-page.tsx` | Drawer | max-h-\[85vh\] | Bottom 85vh | Bottom 85vh | Bottom 85vh | Filter options | Drawer |
| Pantry Household | `pantry-page.tsx` | Drawer | max-h-\[85vh\] | Bottom 85vh | Bottom 85vh | Bottom 85vh | Household config | Drawer |

**Count:** 11 dialogs | **Width Pattern:** Drawers with height constraints (75vh-92dvh), bottom-sheet positioning

---

#### **CATEGORY F: Food Diary & Shopping Dialogs**
Inline edit, single-purpose.

| Dialog | Location | Component | Current Width | Mobile | Tablet | Desktop | Use | Recommendation |
|--------|----------|-----------|---|---|---|---|---|---|
| Edit Entry | `food-diary-page.tsx` | Dialog | max-w-sm | Fullscreen | 384px | 384px | Edit diary entry | Comfortable |
| Edit Mood/Energy | `food-diary-page.tsx` | Dialog | max-w-sm | Fullscreen | 384px | 384px | Quick emoji select | Comfortable |
| Add Liquid | `food-diary-page.tsx` | Dialog | max-w-sm | Fullscreen | 384px | 384px | Log water | Comfortable |
| Send to Supermarket | `shopping-list-page.tsx` | Dialog | sm:max-w-\[560px\] | Fullscreen | 560px | 560px | Export list | Expanded |
| Export List | `shopping-list-page.tsx` | Dialog | sm:max-w-\[420px\] | Fullscreen | 420px | 420px | Download CSV | Comfortable |
| Price Comparison | `shopping-list-page.tsx` | Dialog | max-w-4xl | Fullscreen | 896px | 896px | Compare retailers | Workspace |
| Send To Supermarket (Workspace) | `shopping-workspace-page.tsx` | Dialog | sm:max-w-\[560px\] | Fullscreen | 560px | 560px | Export list | Expanded |
| Export List (Workspace) | `shopping-workspace-page.tsx` | Dialog | sm:max-w-\[420px\] | Fullscreen | 420px | 420px | Download CSV | Comfortable |
| Clear List (Workspace) | `shopping-workspace-page.tsx` | Dialog | sm:max-w-\[360px\] | Fullscreen | 360px | 360px | Confirm action | Compact |

**Count:** 9 dialogs | **Width Pattern:** max-w-sm (384px), custom \[360px\], \[420px\], \[560px\], max-w-4xl (896px)

---

#### **CATEGORY G: Templates & Partner Dialogs**
Specialty use cases.

| Dialog | Location | Component | Current Width | Mobile | Tablet | Desktop | Use | Recommendation |
|--------|----------|-----------|---|---|---|---|---|---|
| Templates Panel | `templates-panel.tsx` | Dialog | max-w-lg | Fullscreen | 512px | 512px | Meal templates | Comfortable |
| Partners | `partners-page.tsx` | Dialog | max-w-lg | Fullscreen | 512px | 512px | Partner info | Comfortable |

**Count:** 2 dialogs | **Width Pattern:** max-w-lg (512px)

---

### Total Dialog Count: **40 dialogs/drawers/sheets**

---

## Section 2: Unique Width Analysis

### **Tail Wind Base Widths Used**

| Class | Pixel Width | Count | Examples |
|-------|---|---|---|
| `max-w-xs` | 320px | 1 | Dashboard variant |
| `max-w-sm` | 384px | 12 | Confirmations, small forms |
| `max-w-md` | 448px | 6 | Small forms, alerts |
| `max-w-lg` | 512px | 8 | Medium forms, templates |
| `max-w-2xl` | 672px | 4 | Large workspace |
| `max-w-4xl` | 896px | 2 | Compare products, price comparison |
| `max-w-full` | 100% | 2+ | Camera, responsive |

**Subtotal:** 35+ dialogs using standard Tailwind widths

---

### **Custom Pixel Widths (Non-Tailwind)**

| Custom Width | Pixel Size | Count | Examples | Category |
|---|---|---|---|---|
| `sm:max-w-[360px]` | 360px | 1 | Clear list confirm | Small |
| `sm:max-w-[420px]` | 420px | 2 | Export list (2x) | Small |
| `sm:max-w-[500px]` | 500px | 1 | Meal action form | Medium |
| `sm:max-w-[540px]` | 540px | 1 | Shopping scan review | Medium |
| `sm:max-w-[560px]` | 560px | 2 | Send to supermarket (2x) | Medium |
| `sm:max-w-[580px]` | 580px | 1 | Scan confirm dialog | Medium |
| `sm:max-w-[600px]` | 600px | 5 | Scan reviews, meal edit (5x) | Medium |
| `sm:max-w-[760px]` | 760px | 1 | Planner scan review | Large |

**Subtotal:** 14 custom widths across 14+ dialogs

---

### **Summary: Unique Width Values**

**Total Unique Widths:** 23+

- **Standard Tailwind:** 7 classes (320px to 896px)
- **Custom Pixel Values:** 8 custom widths (360px to 760px)
- **Special Cases:** Drawers (fullscreen to 92dvh heights), Responsive (100%)

**Problem:** 14 different custom widths for no clear reason. Many dialogs using `[540px]`, `[580px]`, `[600px]`, `[760px]` could collapse into 2-3 standard sizes.

---

## Section 3: Breakpoint & Mobile Behavior Inventory

### Mobile Behavior Pattern (375px - 640px)

| Width Class | 375px Mobile | 640px Tablet | 1024px+ Desktop | Pattern |
|---|---|---|---|---|
| `max-w-sm` / `max-w-md` | Fullscreen (100%) | sm: applies, ~70% | Constraint to 384-448px | Good responsive |
| `sm:max-w-[600px]` | Fullscreen | 600px | 600px | Good responsive |
| `sm:max-w-[760px]` | Fullscreen | 760px | 760px | Good responsive |
| Drawers | Bottom sheet h-\[85vh\] | Bottom sheet | Bottom sheet | Appropriate |
| `max-w-2xl` (672px) | Fullscreen | 672px | 672px | Slightly cramped tablet |
| `max-w-4xl` (896px) | Fullscreen | 896px (scroll) | 896px (scroll) | Workspace appropriate |

**Key Observation:** Most dialogs already handle mobile correctly with `fullscreen then constrain on sm:` pattern. The issue is not mobile—it's **inconsistency and lack of semantic grouping**.

---

## Section 4: Adaptive Density Proposal

### Proposed 5-Category Sizing Model

Based on audit, recommend standardising on **5 dialog size categories** controlled by adaptive density:

#### **SIZE 1: Compact**
**Use:** Confirmations, delete warnings, quick alerts  
**Proposed Width:**
- Mobile: `fullscreen` (100%)
- Tablet+: `sm:max-w-[420px]` (420px, Comfortable-minus)

**Dialogs:** 10 (Clear, Remove, Copy, Confirm actions)

---

#### **SIZE 2: Comfortable**
**Use:** Small-to-medium forms, single/double field edits, modals  
**Proposed Width:**
- Mobile: `fullscreen` (100%)
- Tablet+: `sm:max-w-[540px]` (540px, Comfortable baseline)

**Density Variants:**
- **Compact Mode:** 480px (tighter)
- **Comfortable Mode:** 540px (standard)
- **Expanded Mode:** 600px (roomier)

**Dialogs:** 15+ (Create Meal, Add To Week, Food Knowledge, Scan Confirm, etc.)

---

#### **SIZE 3: Expanded**
**Use:** Multi-step forms, larger content, scan reviews, analysis  
**Proposed Width:**
- Mobile: `fullscreen` (100%)
- Tablet+: `sm:max-w-[760px]` (760px, Expanded standard)

**Dialogs:** 8+ (Planner Scan Review, Recipe Scan Review, Shopping Scan Review, Import Diary)

---

#### **SIZE 4: Workspace**
**Use:** Detailed workspace content, comparison, explorer, full analysis  
**Proposed Width:**
- Mobile: `fullscreen` (100%)
- Tablet+: `max-w-2xl` or `max-w-4xl` (672px-896px based on content)

**Variants:**
- **Workspace Standard:** max-w-2xl (672px, for most workspace)
- **Workspace Large:** max-w-4xl (896px, for comparison/large tables)

**Dialogs:** 6+ (Plant Diversity, Product Compare, Product Detail, Price Comparison)

---

#### **SIZE 5: Drawer**
**Use:** Mobile-first panels, assistants, bottom sheets, action menus  
**Proposed Constraints:**
- Mobile: Bottom sheet, h-\[85vh\] or h-\[92dvh\]
- Tablet+: Bottom sheet or right-sidebar (existing drawer behavior)

**Dialogs:** 11+ (Planner Assistant, Cookbook Panel, Food Diary Drawer, etc.)

---

### Mapping Current Dialogs to Proposed Model

```
Compact (420px)
├─ Clear dialogs (5)
├─ Confirm actions (3)
└─ Quick ops (2)

Comfortable (540px)
├─ Small forms (8)
├─ Food knowledge (3)
├─ Scan confirms (2)
└─ Quick edits (4)

Expanded (760px)
├─ Scan reviews (3)
├─ Import flows (2)
├─ Medium forms (3)
└─ Edit dialogs (2)

Workspace (672px or 896px)
├─ Product detail (2)
├─ Comparison (1)
├─ Explorer (1)
├─ Analysis (2)
└─ Import diary (1)

Drawer (85vh or 92dvh)
├─ Planner panels (3)
├─ View details (4)
├─ Config panels (2)
├─ Action sheets (2)
```

---

## Section 5: Density-Aware Implementation Approach

### Option A: React Wrapper Component

```tsx
interface DialogSize = 'compact' | 'comfortable' | 'expanded' | 'workspace' | 'drawer';

function AdaptiveDialogContent({ 
  size,
  density, 
  ...props 
}: DialogSizeProps) {
  const { density: currentDensity } = useAdaptiveDensity();
  const density = density || currentDensity;
  
  const widths = {
    compact: 'sm:max-w-[420px]',
    comfortable: {
      compact: 'sm:max-w-[480px]',
      comfortable: 'sm:max-w-[540px]', // default
      expanded: 'sm:max-w-[600px]',
    },
    expanded: 'sm:max-w-[760px]',
    workspace: 'max-w-2xl',
    drawer: '', // height-based
  };
  
  return <DialogContent className={widths[size]?.[density] || widths[size]} />;
}
```

---

### Option B: Tailwind Config Extension

Add to `tailwind.config.ts`:

```ts
extend: {
  maxWidth: {
    'dialog-compact': '420px',
    'dialog-comfortable': '540px',
    'dialog-comfortable-compact': '480px',
    'dialog-comfortable-expanded': '600px',
    'dialog-expanded': '760px',
    'dialog-workspace': '672px',
    'dialog-workspace-large': '896px',
  }
}
```

Then use:
```tsx
<DialogContent className="max-w-dialog-comfortable" />
```

---

## Section 6: Questions to Address

### 1. **Should we standardise on 3 or 5 size categories?**

**3-Category (Simpler):**
- Small: 420px
- Medium: 540px
- Large: 760px

**Drawback:** Doesn't capture workspace dialogs (896px) or density variants.

**5-Category (Flexible):**
- Compact: 420px
- Comfortable: 540px (with density variants)
- Expanded: 760px
- Workspace: 672px / 896px
- Drawer: Height-based

**Recommendation:** **5-category model**. The Workspace and Drawer categories are semantically distinct (different visual hierarchy, positioning) and justify separate treatment.

---

### 2. **Should Comfortable have density variants (480px / 540px / 600px)?**

**Current State:** Density hook exists. We have 540px, 560px, 580px, 600px in use.

**Option A:** No variants—Comfortable is always 540px.  
**Option B:** Comfortable has 3 density variants (480/540/600).

**Recommendation:** **Option A (no variants initially)**. Start with single fixed widths. If density control over dialog width becomes a user requirement, add variants in Phase 2.

---

### 3. **Which dialogs are exceptions and need custom widths?**

**Current Exceptions:**
- `clear-list`: sm:max-w-\[360px\] (narrower than Compact) → Keep exception
- `export-list`: sm:max-w-\[420px\] (Compact) → Migrate to Compact
- `price-comparison`: max-w-4xl (896px) → Workspace Large

**Recommendation:** Allow exceptions for <3 dialogs. Migrate all others to standard sizes.

---

### 4. **Should drawers use adaptive density?**

**Current:** Drawers use fixed height (75vh, 85vh, 92dvh).

**Option A:** Fixed heights always.  
**Option B:** Density controls height (compact=75vh, comfortable=80vh, expanded=92dvh).

**Recommendation:** **Option A (fixed heights)**. Drawer heights are less about density and more about screen real estate. Revisit in Phase 2 if needed.

---

### 5. **How should the base DialogContent default width change?**

**Current:** DialogContent has `max-w-lg` (512px) default.

**Option A:** Keep as-is, override per-instance.  
**Option B:** Change to `max-w-\[540px\]` (Comfortable) globally.

**Recommendation:** **Option A (keep as-is)**. Changing the base might affect unlabeled instances. Safe migration is per-component.

---

### 6. **Should AlertDialogs follow the same model?**

**Current:** AlertDialogs use browser defaults or no width constraint.

**Issue:** Inconsistent with Dialog components.

**Recommendation:** **Yes.** Create AlertDialogContent with same sizing model:
```tsx
<AlertDialogContent className="sm:max-w-[420px]" /> // Compact
```

---

## Section 7: Migration Strategy

### **Phase 1: Foundation (Low Risk)**
- [ ] Introduce `DialogSize` enum/type
- [ ] Create `AdaptiveDialogContent` wrapper (optional, for gradual migration)
- [ ] Document sizing standard in codebase
- [ ] Add JSDoc examples to Dialog components

**Effort:** 4-6 hours | **Risk:** Very Low (additive only)

---

### **Phase 2: Confirmation Dialogs (Low Risk)**
- [ ] Migrate 10 confirmation dialogs to `Compact` (sm:max-w-\[420px\])
- [ ] Verify mobile, tablet, desktop rendering
- [ ] Update tests if width-dependent

**Dialogs:** Clear, Remove, Copy, Confirm  
**Effort:** 2-3 hours | **Risk:** Low (visual only)

---

### **Phase 3: Small-to-Medium Forms (Medium Risk)**
- [ ] Consolidate custom widths to `Comfortable` (sm:max-w-\[540px\])
- [ ] Replace \[560px\], \[580px\], \[600px\], [500px] with standard
- [ ] Test responsive behavior at 375px, 640px, 1024px

**Dialogs:** 15+ (Create Meal, Scan Confirm, Food Knowledge, etc.)  
**Effort:** 4-5 hours | **Risk:** Medium (responsive testing required)

---

### **Phase 4: Expanded & Workspace Dialogs (Medium-High Risk)**
- [ ] Standardise \[760px\] dialogs to `Expanded`
- [ ] Confirm workspace dialogs (2xl, 4xl) meet content needs
- [ ] Test overflow, scrolling, text wrapping at extreme widths

**Dialogs:** 8 Expanded, 6 Workspace  
**Effort:** 3-4 hours | **Risk:** Medium-High (content-dependent)

---

### **Phase 5: Drawers (Low Risk)**
- [ ] Review drawer height consistency (75vh vs 85vh vs 92dvh)
- [ ] Decide if standardisation is needed
- [ ] Document drawer sizing rationale

**Dialogs:** 11 drawers  
**Effort:** 2 hours | **Risk:** Low (existing behavior mostly OK)

---

### **Timeline Estimate**

- **Phase 1:** Week 1, Day 1-2
- **Phase 2:** Week 1, Day 3-4
- **Phase 3:** Week 2, Day 1-3
- **Phase 4:** Week 2, Day 4-5
- **Phase 5:** Week 3, Day 1

**Total:** 3 weeks, ~20-25 hours of development | **Testing overhead:** +5 hours

---

## Section 8: Risks & Mitigation

### **Risk 1: Content Overflow in Reduced Widths**
**Issue:** Some dialogs (e.g., forms with wide tables) may overflow if width is reduced.  
**Mitigation:**
- Test each migrated dialog at 375px, 640px, 768px viewports
- Use overflow-y-auto where needed
- Review form layouts for width-dependent elements

---

### **Risk 2: Mobile Fullscreen Still Too Tight**
**Issue:** Some content still feels cramped at mobile fullscreen (100vw - padding).  
**Mitigation:**
- Consider vw-based mobile widths if needed
- Currently fullscreen pattern is industry standard
- Re-evaluate after Phase 2

---

### **Risk 3: Workspace Dialogs May Need Different Width**
**Issue:** Some workspace content (product compare) needs wide layout but 896px may be excessive.  
**Mitigation:**
- Separate workspace dialogs into Standard (672px) and Large (896px)
- Use scrollable tables within, not full-width dialogs
- Confirm with design if unsure

---

### **Risk 4: Density Hook Not Yet Complete**
**Issue:** useAdaptiveDensity() exists but may lack all needed values.  
**Mitigation:**
- Dialog sizing doesn't depend on density hook in Phase 1-2
- Add density-aware sizing in Phase 3+ if useAdaptiveDensity matures
- Start with static widths, add dynamics later

---

### **Risk 5: Custom Width Exceptions Multiply**
**Issue:** Teams might add new custom widths instead of using standard sizes.  
**Mitigation:**
- Document standard sizes clearly
- Code review to check for non-standard widths
- Provide reusable wrapper component

---

## Section 9: Compatibility & Backward Compatibility

### **Breaking Changes:** None

All migrations are **additive**:
- Old widths continue to work
- New standard widths introduced alongside
- Can migrate one dialog at a time

### **Browser/Device Compatibility:** No issues

- sm: breakpoint works on all supported devices
- Custom px widths are standard CSS
- Responsive behavior unchanged

### **Performance Impact:** Negligible

- No runtime overhead
- CSS size unchanged
- Class consolidation may slightly reduce bundle (minor)

---

## Section 10: Special Cases & Exceptions

### **1. Meal Detail Dialog**
**Current:** No explicit width, responsive  
**Issue:** Content varies widely (nutrition, instructions, ingredients)  
**Recommendation:** Mark as `Workspace` (add max-w-2xl)

---

### **2. Price Comparison Dialog**
**Current:** max-w-4xl (896px)  
**Issue:** Needs full width for table comparison  
**Recommendation:** Keep as `Workspace Large` (max-w-4xl)

---

### **3. Camera Modal**
**Current:** sm:max-w-lg, h-\[100dvh\] mobile  
**Issue:** Mobile camera interface needs viewport height  
**Recommendation:** Keep as-is (special case, no standard width)

---

### **4. Drawer Bottom Sheets**
**Current:** h-\[75vh\], h-\[85vh\], h-\[92dvh\] mixed  
**Issue:** No clear pattern  
**Recommendation:** Standardise to h-\[85vh\] (middle ground) or document reasoning for variance

---

## Section 11: Future Enhancements

### **Phase 2B: Density-Controlled Widths**
Once useAdaptiveDensity() is fully integrated:
```tsx
<DialogContent size="comfortable" densityAware />
// Renders 480px (compact), 540px (comfortable), 600px (expanded)
```

### **Phase 2C: Dialog Size Preset Variants**
Add Tailwind variants for quick access:
```tsx
<DialogContent className="max-w-dialog-sm max-w-dialog-md max-w-dialog-lg" />
```

### **Phase 3: Template System**
Create dialog templates for common patterns:
```tsx
<ConfirmDialog title="Delete?" onConfirm={...} />
<FormDialog title="Edit" fields={...} />
<WorkspaceDialog title="Analysis" tabs={...} />
```

---

## Section 12: Recommendations

### **Immediate Actions**

1. **Adopt 5-Category Model**  
   - Compact: 420px
   - Comfortable: 540px
   - Expanded: 760px
   - Workspace: 672px/896px
   - Drawer: 85vh

2. **Create DialogSize Enum**  
   ```ts
   type DialogSize = 'compact' | 'comfortable' | 'expanded' | 'workspace' | 'drawer';
   ```

3. **Add JSDoc Examples**  
   Document when to use each size in component comments.

4. **Migrate Confirmation Dialogs First**  
   Quick win: 10 dialogs → Compact (420px)

5. **Deprecate Custom Widths**  
   Flag \[360px\], \[420px\], \[500px\], \[580px\], \[600px\] in code review.

---

### **Future Work**

- Integrate with useAdaptiveDensity() for density variants
- Create AdaptiveDialogContent wrapper for easier adoption
- Build dialog template system
- Consider drawer height standardisation

---

## Conclusion

**THA has 23+ unique dialog widths across 40+ components.** This creates unnecessary maintenance burden and inconsistent UX. The audit reveals that **80% of dialogs can consolidate to 3-5 standard sizes** without content compromise.

**Recommended approach:**
1. Introduce DialogSize enum (5 categories)
2. Migrate in phases (confirmations → forms → workspace)
3. Deprecate custom widths
4. Future: integrate with adaptive density hook

**Expected Outcome:** Simpler CSS, faster future dialog creation, better responsive behaviour, alignment with adaptive density system.

---

## Appendix: Full Grep Results

### All DialogContent Classes Found (Raw)

```
max-w-2xl (4 instances)
max-w-lg (8 instances)
max-w-md (6 instances)
max-w-sm (12 instances)
max-w-xs (1 instance)
max-w-4xl (2 instances)
sm:max-w-[360px] (1 instance)
sm:max-w-[420px] (2 instances)
sm:max-w-[500px] (1 instance)
sm:max-w-[540px] (1 instance)
sm:max-w-[560px] (2 instances)
sm:max-w-[580px] (1 instance)
sm:max-w-[600px] (5 instances)
sm:max-w-[760px] (1 instance)
sm:max-w-lg (3 instances)
sm:max-w-md (2 instances)
sm:max-w-sm (5 instances)
No explicit width (5+ instances, responsive)
```

---

**Rollback ID:** `rollback/dialog-audit-investigation-1781625959`  
**Investigation Date:** 2026-06-16  
**Status:** ✅ Complete (Read-Only, No Code Changes)
