# NSR1 Phase 2 — Shopping (craft wave)

**Room:** Shopping — `/shopping-workspace` → `client/src/pages/shopping-workspace-page.tsx`
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Owners:** UIOWN1 §7 (Shopping = sole owner of Domain 15; does NOT own partners/price analysis) · CRAFT1 §4–6 · GEA8/13/16/21

## Design (architecture first)
"The list by the door, preparing to leave the house" — a note you pick up, calm and prepared, not a
task board. It reports the list truthfully; it does not grade the basket, congratulate the shop, or
announce its own cleverness. SHOP3/PROD1 already made the data honest (flagged estimates, load-error vs
empty separation); this pass removes the basket-level grade and the room-voice slips.

## Changes (presentation-only)
1. **Removed the basket AVERAGE Apple rating** in the totals footer (and its `avgThaRating`
   computation). A per-item rating is information (GEA13's own "a rating on a jar" allowance); averaged
   into one mark over the whole basket it becomes a **verdict on the household's choices**, which
   **GEA13** forbids. Per-item ratings on the items themselves are untouched.
2. **Removed the congratulatory subline** "Great shop — nothing left to find" — the fact "That's
   everything" stays; a room reports, it does not congratulate the household on their shop (**GEA21**).
3. **Removed the capability boast** "THA will organise and **score** them" → "N items to add" — a room
   does not announce its own mechanism, and intelligence is a better answer, never a visible boast
   (**GEA16**); "score" language dropped (GEA13).
4. **Neutralised the leading question** "Have you run out of this?" → "May already be in your larder" —
   a factual status, not the room interrogating the household (**GEA8/21**).

## Not done — larger recompositions / owner decisions (flagged, not touched)
- **The retailer × tier price-comparison matrix + send-to-basket** — a partners capability Shopping
  "does not own" (UIOWN1 §7); relocating cost out of Shopping is an owner/domain decision.
- **The four-mode pipeline** (Add/Review/Prep/Prep-Shop) with completion fractions and a "Ready to
  shop" gate, and the stacked panels — de-densifying toward "three chosen things" (GEA11/CRAFT1 §6) is
  a genuine recomposition and an owner character call, not a surgical craft fix; deferred with the
  price-matrix decision.
- Whether **any** basket-level aggregate rating may exist, and the "Apple Score" sort — owner (GEA13).

## Verification
`tsc --noEmit`: 0 errors in `shopping-workspace-page.tsx`; `canShowScoreForItem` still used (4×);
`AppleRating` still used (per-item, 3×). No source test/e2e asserts a removed string (the only match
was a stale `dist/` bundle). Live visual review recommended.

## Data / Trust / Scope
No schema/API/storage/business-logic change; `server/` untouched. Removing the basket grade and the
boast *increases* honesty (GEA13/16, Core Principle 6). Rollback: reset to the NSR1 tag.

## Quality Standard
The list reads calmer and stops grading the shopper. The full "would the Home Owner happily spend time
here?" yes waits on the owner decision about cost/price-comparison living here and the four-mode
pipeline's density — the two things that still make it read as a workspace rather than a note by the door.
