# WX14 — Shopping Workspace Visual Polish

**Rollback identifier:** `wx14-shopping-visual-before` (git tag)

---

## Summary

Restored the Shopping workspace visual identity by standardising the trolley (`ShoppingCart`) icon across all Shopping navigation touchpoints and applying the Shopping workspace teal colour palette to the quick-action button inactive/hover state.

---

## Files Changed

| File | Change |
|---|---|
| `client/src/components/nav-bar.tsx` | Removed `ShoppingBasket` import. Desktop and mobile TopBar shopping buttons: icon `ShoppingBasket` → `ShoppingCart`, inactive/hover style → Shopping teal |
| `client/src/components/workspace-header.tsx` | Replaced `ShoppingBasket` import with `ShoppingCart`. Desktop `basketIcon` and mobile shopping link: icon changed, desktop inactive style → Shopping teal |
| `client/src/pages/shopping-workspace-page.tsx` | Fullscreen header "Shopping" label and empty-state illustration: `ShoppingBasket` → `ShoppingCart` |
| `client/src/pages/shopping-list-page.tsx` | "Shopping Assistant" mode dropdown label and "Shopping" workspace link: `ShoppingBasket` → `ShoppingCart` |

---

## Implementation

### Icon standard

The left navigation already used `ShoppingCart` (trolley) for the Shopping workspace entry (`/shopping-workspace`). All other navigation touchpoints — TopBar (desktop + mobile), WorkspaceHeader (desktop + mobile), fullscreen Shopping header, empty-state — were regressed to `ShoppingBasket`. These are now all `ShoppingCart`.

Semantic basket usages were **retained**:
- Dashboard "Basket" card and "Analyse Basket" CTA (links to `/basket` product-price analysis, label says "Basket")
- Shopping workspace "Basket" dropdown link to `/shopping` sub-page
- Shopping list "Add to basket" action button
- SmartReviewPanelContent "Add to shopping list" action

### Colour standard

The quick-action shopping button inactive/hover state was generic (`text-muted-foreground hover:bg-black/5`). Updated to Shopping teal palette in both nav-bar TopBar and workspace-header desktop view:

```
inactive/hover: text-[hsl(190,38%,44%)] hover:bg-[hsl(190,22%,92%)] hover:text-[hsl(190,42%,28%)]
dark:           dark:text-[hsl(190,28%,58%)] dark:hover:bg-[hsl(190,12%,18%)] dark:hover:text-[hsl(190,28%,68%)]
```

The mobile workspace-header basket icon already used Shopping teal for inactive — icon changed only.

Active/selected state was already Shopping teal (`hsl(190,30%,86%)`) on all surfaces — retained unchanged.

---

## Verification Steps

1. Left navigation "Shopping" item shows trolley icon ✓
2. TopBar top-right shopping button shows trolley (desktop and mobile) ✓
3. WorkspaceHeader shopping button shows trolley (desktop and mobile) ✓
4. Shopping workspace fullscreen mode header shows trolley ✓
5. Empty shopping list shows trolley icon ✓
6. Shopping list "Shopping" workspace link shows trolley ✓
7. Shopping list "Shopping Assistant" mode label shows trolley ✓
8. Badge count still displays on all shopping buttons ✓
9. Click routes to `/shopping-workspace` unchanged ✓
10. Dashboard "Basket" / "Analyse Basket" still use basket icon (semantic) ✓
11. "Add to basket" action buttons still use basket icon (semantic) ✓
12. Shopping workspace teal colour on inactive button hover ✓

---

## Rollback

```bash
git checkout wx14-shopping-visual-before -- \
  client/src/components/nav-bar.tsx \
  client/src/components/workspace-header.tsx \
  client/src/pages/shopping-workspace-page.tsx \
  client/src/pages/shopping-list-page.tsx
```

Or reset the branch entirely:

```bash
git reset --hard wx14-shopping-visual-before
```
