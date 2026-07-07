# CP1 — Companion Presence Foundation Implementation

**Status:** Implemented  
**Rollback identifier:** tag `cp1-rollback-1783190596`  
**Date:** 2026-07-04  

---

## Summary

CP1 introduces a **consistent visual Companion presence** across THA's authenticated app without changing any business logic, AI capabilities, schema, or conversation state. The implementation consolidates the Companion's fragmented visual identity (two conflicting designs: an Apple PNG and a Leaf-in-circle icon) into one canonical `CompanionAvatar` component and adds a persistent Companion header badge to every page using `WorkspaceHeader`, enabling users to reach the existing `FloatingAssistant` panel from the shared page chrome.

---

## Changes Made

### New Files

1. **`client/src/components/companion/CompanionAvatar.tsx`**
   - Canonical Companion avatar component, the single source of truth for the Companion's visual identity (Leaf-in-circle icon).
   - Supports three sizes: `"sm"` (w-6 h-6), `"md"` (w-7 h-7, used in panel/turn bubbles), `"lg"` (w-12 h-12, used in empty-state greeting).
   - Reusable across all surfaces the Companion appears on.

2. **`client/src/components/companion/CompanionPresenceBadge.tsx`**
   - Header entry point for the Companion, rendered in `WorkspaceHeader`'s right-cluster action bar.
   - Clicking the badge dispatches a DOM `CustomEvent("companion:open")`, triggering the existing panel open.
   - Follows the existing header icon style (h-9 w-9 rounded button, hover state, tooltip).

3. **`client/src/components/companion/companion-styles.ts`**
   - Shared utility function `companionBubbleClass(isUser: boolean)` — generates the exact Tailwind classes for user/assistant message bubbles.
   - Extracted from duplicated inline ternary strings in `FloatingAssistant.tsx`.
   - Ensures message bubble styling is defined once and reused consistently.

### Modified Files

1. **`client/src/components/conversation/FloatingAssistant.tsx`**
   - Added imports: `CompanionAvatar`, `companionBubbleClass`.
   - Replaced four inline Leaf-in-circle avatar definitions with `<CompanionAvatar size="md" />` (turn bubble, loading bubble, panel header) and `<CompanionAvatar size="lg" />` (empty-state greeting).
   - Replaced duplicate bubble className ternaries with `companionBubbleClass(isUser)`.
   - Added one new `useEffect` listener that opens the panel when `"companion:open"` DOM event fires. This mirrors the existing "Close on Escape" pattern and requires no new state or context.
   - No changes to conversation logic, data fetching, intent resolution, or message handling.

2. **`client/src/components/workspace-header.tsx`**
   - Added import: `CompanionPresenceBadge`.
   - Rendered `<CompanionPresenceBadge />` immediately before the basket icon in three locations:
     - Two-row desktop layout (grid cell row 1, column 4)
     - Single-row desktop layout (grid column 4)
     - Mobile layout (icon cluster in header)
   - No changes to `ProfileMenu`, logo, brand, or any other header behavior.

---

## Architecture Compliance

- **One canonical Companion:** ✓ No second assistant, panel, or identity. `CompanionAvatar`/`CompanionPresenceBadge` render the same `FloatingAssistant` already owns; no duplication.
- **Uses existing Intelligence/Companion Platform:** ✓ No new engine, route, hook, or capability. The badge wires to the existing `isOpen` state via a lightweight DOM event listener (mirroring the "Close on Escape" pattern).
- **No duplicate conversation state:** ✓ `isOpen` remains the single `useState` inside `FloatingAssistant`; the new listener only invokes the existing setter.
- **No new AI services:** ✓ Zero new API calls, zero new LLM/behaviour/observation/personality code paths. All server-side logic unchanged.
- **No schema changes:** ✓ No migration, no new table/column, no new persisted data. Pure client-side, presentational refactor.

**AI Architecture (per `THA_COMPANION_PLATFORM_ARCHITECTURE.md`):**
- `conversation-gateway.ts` (gateway, intent resolution, grounding): untouched.
- `behaviour-engine.ts` (voice/phrasing): untouched.
- `observation-engine.ts` (passive noticing): untouched.
- `personality-registry.ts` (voice profiles): untouched.
- `companion-growth.ts` (trend signals): untouched.

The Companion **says nothing new, does nothing new** — it is only reachable from one more visually consistent, discoverable place.

---

## Data Impact

**No database changes. No API changes. No schema evolution.**

---

## Trust & Safety

- **No business logic change:** The Companion's outputs (gaps, guidance, observations) are entirely unchanged.
- **No permission/confirmation-tier change:** Honest-gap classification (`turn-fallback.ts`) and Behaviour Engine non-fabrication rules are untouched.
- **No new claim or assertion:** `CompanionAvatar` is a visual component; it makes no statement about the platform's capabilities.
- **Observability unchanged:** `turn-fallback.ts`'s four-state taxonomy applies identically; the badge's open-signal is not observable in that log (it is a UI event, not a resolved turn).

---

## Rollback

**Identifier:** git tag `cp1-rollback-1783190596` marks the pre-CP1 state.

**To revert:**
```bash
git checkout cp1-rollback-1783190596 -- \
  client/src/components/companion \
  client/src/components/conversation/FloatingAssistant.tsx \
  client/src/components/workspace-header.tsx \
  docs/implementation/CP1_COMPANION_PRESENCE_FOUNDATION.md
```

Or use `git revert` on the commit(s) that introduced CP1.

**No server-side rollback needed** — no database or API changes were made.

---

## Definition of Done

- [x] `CompanionAvatar` component exists and is the single source of truth for the Companion's visual identity.
- [x] All four prior inline avatar instances in `FloatingAssistant.tsx` render through `CompanionAvatar`.
- [x] `CompanionPresenceBadge` renders in `WorkspaceHeader`'s right cluster on all three layout variants (desktop two-row, desktop single-row, mobile).
- [x] Clicking the presence badge opens the existing `FloatingAssistant` panel.
- [x] Message bubble styling extracted to `companionBubbleClass` and used in turn bubble + loading bubble.
- [x] Typecheck passes with no new errors.
- [x] App boots without regression.
- [x] Existing FAB, panel, conversation behavior unchanged.
- [x] Implementation documentation complete.

---

## Pages Affected

The presence badge now appears on all pages using `WorkspaceHeader`:
- Dashboard
- Weekly Planner
- Pantry
- Food Diary
- Meals / Cookbook
- Shopping Workspace
- Shopping List
- Profile
- List
- Partners
- Products
- Supermarkets
- Meal Detail
- Quick Meal

Pages **not affected** (custom/no headers):
- Auth, onboarding, home, food-detail, import-recipe, admin pages, not-found — these remain out of scope for CP1.

---

## Verification

1. **Typecheck:** `npm run check` — must pass.
2. **Visual consistency:** Presence badge appears on Dashboard, Planner, Pantry headers at the same position and size.
3. **Entry point:** Clicking the badge opens the existing Companion panel; clicking the FAB still works; Escape-to-close still works.
4. **Avatar refactor:** Turn bubbles, loading bubble, panel header, empty-state greeting all render the same visual avatar as before the refactor (pixel-identical, no regression).
5. **Bubble styling:** Message bubbles render identically to pre-refactor (same colors, radii, borders).

---

## Next Steps

This implements the "Companion Presence Foundation" tier of the rollout sequence (`COMPANION_ROLLOUT_SEQUENCE.md`). Future workstreams may:
- **P5 (deferred):** Render `ExperienceProfile`'s `avatarId`, `colorTheme`, `voiceProfileId` per personality (currently scaffold, not shipped).
- **Future entry points:** Dashboard cards, floating notifications, or other surfaces that dispatch `"companion:open"` event to reach the panel.

No further changes are planned as part of CP1 scope.

---

**Required reading before subsequent Companion work:**
- `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (governing blueprint for one Companion, all voice/phrasing/observation concerns)
- `docs/investigations/COMPANION_ROLLOUT_SEQUENCE.md` (phased activation of Companion capabilities across the platform)
