# THA Adaptive Density Foundation — Phase 1 Implementation

**Implementation type:** Infrastructure foundation  
**Date:** 2026-06-16  
**Status:** Complete — foundation implemented, no UI migration performed

---

## 1. Rollback Identifier

```
Tag:    rollback/pre-adaptive-density-foundation
Commit: 9fe2c02  (fix(planner): reconcile boost count between planner card and meal modal)
Branch: main
```

To roll back this implementation:
```bash
git checkout rollback/pre-adaptive-density-foundation
# or
git reset --hard 9fe2c02
```

---

## 2. Files Changed

### Created
- `client/src/hooks/use-adaptive-density.tsx` — New adaptive density hook (157 lines)

### Modified
- `client/src/hooks/use-mobile.tsx` — Refactored to use new hook internally (11 lines)

**Total implementation:** ~168 lines of code

---

## 3. Hook API

### `useAdaptiveDensity(): AdaptiveDensityResult`

Complete type definition:

```typescript
export type AdaptiveDensity = "compact" | "comfortable" | "expanded"

export interface AdaptiveDensityResult {
  // Density tier based on viewport width
  density: AdaptiveDensity
  isCompact: boolean        // width < 640
  isComfortable: boolean    // 640 <= width < 1280
  isExpanded: boolean       // width >= 1280

  // Device capability signals
  isTouch: boolean          // pointer: coarse or maxTouchPoints > 0
  isCoarsePointer: boolean  // pointer: coarse media query
  
  // Orientation detection
  orientation: "portrait" | "landscape"
  isPortrait: boolean
  isLandscape: boolean
  
  // Ultrawide detection
  isUltrawide: boolean      // width >= 1536
  
  // Raw dimensions
  width: number
  height: number
}
```

### Usage

```typescript
import { useAdaptiveDensity } from "@/hooks/use-adaptive-density"

export function MyComponent() {
  const { density, isCompact, isTouch, width } = useAdaptiveDensity()
  
  return (
    <div>
      {isCompact && <CompactLayout />}
      {!isCompact && <NormalLayout />}
    </div>
  )
}
```

---

## 4. Density Thresholds

All thresholds are hardcoded and intentional:

| Density | Condition | Typical devices |
|---------|-----------|-----------------|
| **compact** | width < 640px | phones in portrait (375-600px) |
| **comfortable** | 640px ≤ width < 1280px | tablets (768-1024px), small laptops (1024-1280px), landscape phones (640-960px) |
| **expanded** | width ≥ 1280px | desktops (1280-1536px), large screens (1536-2560px+) |
| **ultrawide** | width ≥ 1536px | flag available in any tier; primary use for future EXPANDED expansions |

**Key design decision:** The 640px boundary between compact/comfortable replaces the previous 768px boundary. Legacy code continues using 768px until intentionally migrated (see compatibility section).

---

## 5. Legacy Compatibility Confirmation

### `useIsMobile()` Behavior

The refactored `useIsMobile()` hook maintains full backward compatibility:

```typescript
// Legacy implementation
export function useIsMobile() {
  const density = useAdaptiveDensity()
  return density.width < 768  // Unchanged 768px threshold
}
```

**Verification:**
- ✓ `useIsMobile()` returns `true` when width < 768px (unchanged)
- ✓ `useIsMobile()` returns `false` when width ≥ 768px (unchanged)
- ✓ All existing callsites receive the same result as before
- ✓ No component layout changes introduced yet

**Documentation in hook:** Added comments explaining:
- `useIsMobile` is legacy for backward compatibility
- New code should use `useAdaptiveDensity()`
- Legacy threshold (768px) remains until components are intentionally migrated

---

## 6. Tests Run

### Automated Verification

✓ **Logic tests** (density derivation)
```
✓ Mobile portrait (375px) → compact
✓ Small mobile (600px) → compact
✓ Boundary: compact→comfortable (640px) → comfortable
✓ Tablet (768px) → comfortable
✓ Small laptop (1024px) → comfortable
✓ Boundary: comfortable→expanded (1279px) → comfortable
✓ Expanded (1280px) → expanded
✓ Ultrawide (1536px) → expanded
✓ Large ultrawide (2560px) → expanded
```

✓ **Legacy compatibility tests** (useIsMobile boundary)
```
✓ width=600px → isMobile=true
✓ width=767px → isMobile=true
✓ width=768px → isMobile=false
✓ width=800px → isMobile=false
```

✓ **Build verification**
```
$ npm run build
✓ 3209 modules transformed
✓ No TypeScript errors
✓ No import/export errors
✓ Bundle size: 3.1MB → 829.7KB gzipped
```

### Manual Verification Checklist

- [x] App builds without errors
- [x] useAdaptiveDensity returns correct density tier at test widths
- [x] useAdaptiveDensity detects touch capability
- [x] useAdaptiveDensity detects orientation
- [x] useAdaptiveDensity detects ultrawide flag
- [x] useIsMobile still returns true below 768px
- [x] useIsMobile still returns false at 768px and above
- [x] No visible layout changes on Planner
- [x] No visible layout changes on Cookbook
- [x] No console errors in hook implementation
- [x] Resize listener properly attached and cleaned up
- [x] Orientation listener properly attached and cleaned up
- [x] Media query listeners properly attached and cleaned up
- [x] No hydration mismatches (defaults to safe values)

---

## 7. Build Result

```
✓ Client build: 3209 modules transformed in 14.64s
✓ Server build: no errors
✓ No TypeScript errors
✓ No warnings related to the new code
```

The app compiles and runs successfully. No existing functionality was affected.

---

## 8. Confirmation: No UI Migration Performed

This phase is **infrastructure only**. Zero user-facing changes:

- [x] Planner page layout unchanged
- [x] Cookbook layout unchanged
- [x] Shopping list layout unchanged
- [x] Pantry layout unchanged
- [x] Diary layout unchanged
- [x] Profile layout unchanged
- [x] Card spacing unchanged
- [x] Chip sizing unchanged
- [x] Dialog widths unchanged
- [x] Drawer heights unchanged
- [x] Navigation layout unchanged
- [x] Table layouts unchanged
- [x] Tailwind config unchanged
- [x] CSS custom properties unchanged
- [x] Component styles unchanged

The hook exists and works correctly. Components have not been modified to use it (except the internal refactor of `useIsMobile`).

---

## 9. Implementation Notes

### Design Decisions

**1. No provider required**
The hook works as a simple `useEffect`-based listener without a provider. This avoids forcing component tree restructuring or adding wrapper complexity. Each component using the hook reads the current density independently.

**2. Safe SSR/hydration defaults**
The hook initializes with `comfortable` density (middle tier). This prevents hydration mismatches by never diffing between server (unknown) and client (known) in ways that would break React.

**3. Debouncing via event batching**
No artificial debounce is added. The resize listener fires on every resize but React batches state updates efficiently. `requestAnimationFrame` is not needed for this use case since density changes are discrete (640px, 1280px boundaries are meaningful gaps, not micro-adjustments).

**4. Fallback chains for touch/orientation detection**
- **Touch:** Tries `pointer: coarse` first, falls back to `maxTouchPoints`
- **Orientation:** Tries `orientation: portrait` media query, falls back to width/height comparison
- **Touch coarse:** Same pattern with try-catch for browser compatibility

This ensures the hook works on all browsers even if media queries fail.

**5. Listener cleanup**
All event listeners and media query listeners are removed in the cleanup function. No leaks.

### Why No Provider?

Investigated whether a context provider was needed. Decision: No, for these reasons:

- ✓ Hook-based listeners are simpler and require no tree restructuring
- ✓ Safe re-renders due to React's batching
- ✓ Avoids provider-wrapper blast radius if the provider later needs changes
- ✓ Existing `useIsMobile()` pattern already works without a provider
- ✓ Future phases can add a provider if needed (e.g., for theming) without breaking this hook

---

## 10. What This Enables

This foundation enables:

1. **Unified density language** — Components can now refer to one concept ("comfortable") instead of three different thresholds
2. **Future tablet support** — Phase 2+ can use `isComfortable` tier for dedicated tablet layouts
3. **Touch-aware UI** — Components can now detect `isTouch` separately from width to adjust interaction targets
4. **Orientation-aware UI** — Components can respond to portrait/landscape changes
5. **Ultrawide support** — Future code can opt into ultrawide-optimized layouts via the `isUltrawide` flag

---

## 11. What This Does NOT Change

- No components have been migrated to use the new hook yet
- `useIsMobile()` still returns `true` at width < 768px (backward compatible)
- Planner layout unchanged
- Cookbook layout unchanged
- All other screens unchanged
- Tailwind classes unchanged
- CSS variables unchanged
- No schema changes
- No data migration

Phase 1 creates the tool; Phase 2+ apply it to specific components.

---

## 12. Suggested Next Phase (Phase 2)

### Timeline

Recommended for a future sprint after Phase 1 validation (this week's build passes, no regressions reported).

### Scope

Apply density to atomic units and page headers:

**2.1 Standard dialog widths**
- Define three canonical sizes: `compact=full-screen`, `comfortable=600px`, `expanded=760px`
- Audit all 23+ dialog widths and consolidate to these three
- Update `sm:max-w-[600px]` patterns to use density-aware sizes

**2.2 Cookbook grid**
- Change `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- To `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- This adds a 3-column intermediate at 768px (comfortable tier)

**2.3 Dashboard grid**
- Same as cookbook: add intermediate 3-column at comfortable tier

**2.4 PageHeader**
- Consolidate the three mobile checks (768, 1024, class) into one `useAdaptiveDensity` call
- Adjust padding/spacing by density tier

**2.5 PlannerMealCard**
- Already responsive; verify it maps well to new density tiers

### Effort: ~2 days  
### Risk: Low — visual refinements, no structural changes  

---

## 13. Known Limitations & Future Work

### Current Scope (Phase 1)
- Hook is read-only (detects, does not configure)
- No CSS custom properties driven by density (Phase 2+)
- No theme switching based on density (future)
- No per-component density overrides (future)

### Future Phases
- Phase 2: Atomic unit styling (cards, chips, dialogs)
- Phase 3: Page-level layout (planner, cookbook, shopping)
- Phase 4: Advanced features (theme switching, density overrides, CSS token system)

---

## 14. References

**Audit document:**
- `docs/investigations/THA_ADAPTIVE_LAYOUT_ENGINE_AUDIT.md` — Complete audit of existing responsive system, identifying the three-tier model

**Implementation files:**
- `client/src/hooks/use-adaptive-density.tsx` — New hook (157 lines)
- `client/src/hooks/use-mobile.tsx` — Refactored compatibility shim (11 lines)

---

## 15. Sign-Off

**Phase 1 complete:**
- ✓ New adaptive density hook implemented
- ✓ Hook correctly derives density from viewport width
- ✓ Hook detects touch capability
- ✓ Hook detects orientation
- ✓ Hook provides ultrawide flag
- ✓ Legacy `useIsMobile()` maintains full backward compatibility
- ✓ Build passes
- ✓ No visible UI changes
- ✓ No schema changes
- ✓ All listeners properly managed and cleaned up
- ✓ Hydration-safe defaults
- ✓ Comprehensive testing
- ✓ This report created

**Ready for Phase 2 when scheduled.**
