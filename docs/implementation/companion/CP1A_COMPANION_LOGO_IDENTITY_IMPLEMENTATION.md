# CP1A — Companion Logo Identity Implementation

**Status:** Implemented
**Date:** 2026-07-04
**Depends on:** `CP1_COMPANION_PRESENCE_FOUNDATION.md` (introduced the canonical `CompanionAvatar` component)

---

## Summary

CP1A replaces the Companion badge's icon with THA's canonical apple mark, and increases its visible size so it reads naturally inside the badge circle. It changes only the icon asset and its rendered size inside `CompanionAvatar` — no behaviour, ownership, or Companion functionality changed.

---

## Problem

Mid-way through CP1, the Companion's icon had already been swapped from the original "leaf-in-circle" glyph to a hand-drawn apple SVG (`client/src/assets/icons/tha-apple-badge.svg`). That SVG was a bespoke recreation of THA's brand mark — approximating its colours and composition — rather than the actual canonical logo asset used everywhere else in the app. This left the Companion with a second, artist-drifted apple that could visually diverge from the one canonical mark over time.

The real canonical THA apple mark is `client/src/assets/icons/tha-apple.png`, served everywhere else in the app through `client/src/components/icons/ThaAppleIcon.tsx` (`nav-bar.tsx`, `workspace-header.tsx`, `AppleRating.tsx`, `ShoppingListView.tsx`, `upf-info-modal.tsx`, onboarding/products/meals/planner pages, etc.). That PNG is a 1024×1024 canvas with a true alpha channel, but the apple glyph itself only occupies the central ~40% width × ~43% height — the rest is transparent padding. Rendered at badge size (18–36px) without trimming, the apple would look tiny and lost inside the circle.

Two other candidate assets (`client/public/apple-logo.png`, `client/public/favicon.png`) were ruled out: both are fully opaque (baked-in cream background, no real alpha), so they would show a visible square behind the apple inside the round badge.

---

## Changes Made

### New asset

- **`client/src/assets/icons/tha-apple-badge.png`** — a pixel-identical crop of the canonical `tha-apple.png`. No new artwork was created; this is the same glyph with its transparent margin trimmed (crop box computed from the exact non-transparent bounding box + 5% breathing room, 447×486px from the 1024×1024 source). It is a derived export, the same way `favicon.png` is already a derived crop of the master logo elsewhere in this repo — the single canonical artwork remains `tha-apple.png`/`apple-logo.png`; nothing about the site-wide mark changed.

### Removed asset

- **`client/src/assets/icons/tha-apple-badge.svg`** — the bespoke non-canonical placeholder, deleted. Confirmed unreferenced anywhere else before removal.

### Modified

- **`client/src/components/companion/CompanionAvatar.tsx`**
  - Import swapped from the placeholder SVG to `tha-apple-badge.png`.
  - Icon size increased ~1.5× per badge size (padding now trimmed from the source, so this reads as a real size increase rather than scaling empty space):
    - `sm`: `h-4.5 w-4.5` (18px) → `h-[27px] w-[27px]`
    - `md`: `h-5 w-5` (20px) → `h-[30px] w-[30px]`
    - `lg`: `h-9 w-9` (36px) → `h-[54px] w-[54px]`
  - Badge box sizes (`w-6/h-6`, `w-7/h-7`, `w-12/h-12`) are unchanged — the enlarged icon now fills the circle edge-to-edge rather than floating with visible margin.
  - Added `overflow-hidden` to the badge container so the icon is clipped to a clean circle at the new, larger size (previously not needed since the icon sat comfortably inside the box with margin).
  - `object-contain` added to the `<img>` to preserve aspect ratio while filling the box.

No other files changed. `CompanionPresenceBadge.tsx` and every consumer of `CompanionAvatar` (turn bubbles, loading bubble, panel header, empty-state greeting, header presence badge) get the new icon automatically with no call-site changes, since they only ever passed a `size` prop.

---

## Architecture Compliance

- **One canonical Companion identity:** ✓ The Companion now renders the *same* apple artwork as the rest of the app (nav bar, workspace header, onboarding, meals, planner, etc.) instead of a separate hand-drawn approximation.
- **No duplicate source of truth:** ✓ `tha-apple-badge.png` is a crop of `tha-apple.png`, not new artwork — same relationship `favicon.png` already has to the master logo in this repo.
- **No behaviour/ownership change:** ✓ Purely a visual asset swap and CSS sizing change inside one presentational component. No new props, state, events, or API calls.
- **No Companion Platform changes:** ✓ `conversation-gateway.ts`, `behaviour-engine.ts`, `observation-engine.ts`, `personality-registry.ts`, `companion-growth.ts` untouched.

---

## Data Impact

**No database, API, or schema changes.**

---

## Verification

1. **Typecheck:** `npx tsc --noEmit` — no new errors introduced (pre-existing unrelated errors in `server/tests/*` remain, untouched by this change).
2. **Reference check:** confirmed no remaining imports of the deleted `tha-apple-badge.svg` before removal.
3. **Visual:** the badge now shows the canonical apple mark, filling the circle naturally, at all three sizes (`sm`/`md`/`lg`), across every surface `CompanionAvatar` renders on (header presence badge, panel header, turn bubbles, loading bubble, empty-state greeting).

---

## Rollback

```bash
git checkout HEAD -- \
  client/src/components/companion/CompanionAvatar.tsx
git rm client/src/assets/icons/tha-apple-badge.png
git checkout HEAD -- client/src/assets/icons/tha-apple-badge.svg   # if previously committed
```

If this change has not yet been committed, `git restore` the modified file and delete the new PNG to return to the prior (non-canonical placeholder) state.

---

## Definition of Done

- [x] Companion badge renders the canonical THA apple mark (same source pixels as `ThaAppleIcon`/`tha-apple.png`), not a bespoke recreation.
- [x] Visible apple size increased ~1.5× across all three `CompanionAvatar` sizes.
- [x] Transparent padding trimmed so the mark fills the badge naturally.
- [x] No behaviour, ownership, or Companion functionality changed.
- [x] Typecheck passes with no new errors.
- [x] Non-canonical placeholder SVG removed.
