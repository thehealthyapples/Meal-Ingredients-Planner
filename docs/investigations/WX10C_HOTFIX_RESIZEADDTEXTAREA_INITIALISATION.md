# WX10C Hotfix — `resizeAddTextarea` Initialisation Error

## Status

**Resolved.** Build passes. Application launches normally.

---

## Root Cause

JavaScript Temporal Dead Zone (TDZ) violation in `shopping-workspace-page.tsx`.

`resizeAddTextarea` was declared with `useCallback` at line 1312, but was referenced in the body and dependency array of `pickUpPendingIngredients` (declared at line 1283 — **before** `resizeAddTextarea`).

Because `const`/`useCallback` declarations are not hoisted, JavaScript raises:

```
Cannot access 'resizeAddTextarea' before initialization
```

at the point `pickUpPendingIngredients` is evaluated, which blocks the entire module from loading.

---

## Files Modified

| File | Change |
|------|--------|
| `client/src/pages/shopping-workspace-page.tsx` | Moved `resizeAddTextarea` declaration above `pickUpPendingIngredients` |

---

## Exact Code Change

**Before (broken order):**

```
line 1283:  const pickUpPendingIngredients = useCallback(() => {
              ...
              setTimeout(resizeAddTextarea, 50);   // ← TDZ reference
              ...
            }, [toast, resizeAddTextarea]);         // ← TDZ reference

line 1312:  const resizeAddTextarea = useCallback(() => { ... }, []);
```

**After (correct order):**

```
line 1282:  const resizeAddTextarea = useCallback(() => { ... }, []);  // declared first

line 1290:  const pickUpPendingIngredients = useCallback(() => {
              ...
              setTimeout(resizeAddTextarea, 50);   // ✓ already in scope
              ...
            }, [toast, resizeAddTextarea]);         // ✓ already in scope
```

No logic was changed. Only the declaration position moved.

---

## Rollback Checkpoint

Git stash object: `1a1024c931a8c8fff603a357313dfe17a7058833`

To rollback: `git stash apply 1a1024c931a8c8fff603a357313dfe17a7058833`

---

## Build Result

```
✓ built in 13.52s
```

No TypeScript errors. No new warnings beyond pre-existing chunk size advisory.

---

## WX10C Architecture Compliance

| Requirement | Status |
|-------------|--------|
| Shopping Workspace remains canonical owner | ✓ Unchanged |
| Quick List removed from navigation | ✓ Unchanged |
| No duplicate workspace ownership | ✓ Unchanged |
| No schema changes | ✓ None |
| No API changes | ✓ None |
| No AI changes | ✓ None |
| No behaviour changes | ✓ Declaration order only |

---

## Remaining Risks

None. The fix is a pure declaration reorder with no semantic change. All three callbacks that reference `resizeAddTextarea` (`pickUpPendingIngredients`, `toggleAddSpeech`, `handleAddImageCapture`) now correctly reference it after its declaration.
