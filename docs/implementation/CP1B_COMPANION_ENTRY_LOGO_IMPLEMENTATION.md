# CP1B — Companion Entry Logo Implementation

**Status:** Implemented
**Date:** 2026-07-04
**Depends on:** `CP1A_COMPANION_LOGO_IDENTITY_IMPLEMENTATION.md` (introduced the trimmed canonical badge asset)

---

## Summary

CP1B replaces the icon on the Companion's floating entry button (the round bottom-right button present on every domain page — Cookbook, Planner, Pantry, Diary, etc.) with the same canonical THA apple mark used in `CompanionAvatar` (CP1A), sized to match. Click behaviour and every other Companion surface are unchanged.

---

## Locating the entry button

The Companion is mounted once, globally (`FloatingAssistant`, referenced from `App.tsx`), so it renders identically on every domain page rather than having a separate instance per page. Its entry point is the fixed round button at `client/src/components/conversation/FloatingAssistant.tsx:1372-1421` (`data-testid="button-open-assistant"`):

- **Closed state** ("entry" — invites the user to open the Companion): previously rendered a generic `lucide-react` `MessageSquare` chat-bubble icon.
- **Open state** (button now means "close"): renders an `X` icon — unchanged, since a close affordance is conventionally an X, not a re-use of the entry glyph.

This is distinct from:
- `CompanionPresenceBadge` (CP1) — the header entry point, already using `CompanionAvatar`/the canonical mark.
- `ThaAppleIcon` (`nav-bar.tsx`, `workspace-header.tsx`) — the workspace/domain navigation logo, explicitly out of scope and untouched.

---

## Changes Made

**`client/src/components/conversation/FloatingAssistant.tsx`**

- Added import of the same trimmed canonical asset CP1A introduced: `tha-apple-badge.png` (`@/assets/icons/tha-apple-badge.png`) — no new asset created, reusing CP1A's crop of the canonical `tha-apple.png`.
- Replaced the closed-state `<MessageSquare className="h-5 w-5" />` (20px) with `<img src={thaAppleBadge} alt="" className="h-[30px] w-[30px] object-contain" />` (30px) — a 1.5× increase, matching the multiplier CP1A applied to `CompanionAvatar`'s icon sizes.
  - `alt=""`: the image is decorative inside a button that already carries `aria-label={isOpen ? "Close Apple assistant" : "Open Apple assistant"}`, avoiding duplicate screen-reader announcement.
- Removed the now-unused `MessageSquare` import from the `lucide-react` import list.
- Open-state `X` icon, the button's `onClick` handler, `aria-label`, size (`w-12 h-12`), position (`fixed bottom-6 right-6`), and all animation/transition classes: **unchanged**.

No other files touched. `CompanionPresenceBadge`, `ThaAppleIcon`, `nav-bar.tsx`, `workspace-header.tsx` are untouched.

---

## Architecture Compliance

- **One canonical Companion identity:** ✓ The floating entry button now shows the same apple mark as `CompanionAvatar` (turn bubbles, panel header, header presence badge) and the rest of the app (`ThaAppleIcon`) — one visual identity, three entry points, zero divergent artwork.
- **Workspace/domain navigation logo untouched:** ✓ `ThaAppleIcon`/`tha-apple.png` usage in `nav-bar.tsx` and `workspace-header.tsx` was not read, imported, or modified by this change.
- **No behaviour change:** ✓ `onClick={() => setIsOpen((v) => !v)}` is byte-for-byte unchanged; the button still toggles the same `isOpen` state that drives the panel, Escape-to-close, and the `"companion:open"` DOM event listener.
- **No Companion Platform changes:** ✓ `conversation-gateway.ts`, `behaviour-engine.ts`, `observation-engine.ts`, `personality-registry.ts`, `companion-growth.ts` untouched — this is a single-file, presentational icon swap.

---

## Data Impact

**No database, API, or schema changes.**

---

## Verification

1. **Typecheck:** `npx tsc --noEmit` — no new errors (confirmed no `FloatingAssistant`/`MessageSquare`/`tha-apple` related errors; pre-existing unrelated `server/tests/*` errors remain untouched).
2. **Reference check:** confirmed `MessageSquare` has no other usage in the file before removing the import.
3. **Visual:** entry button on Cookbook, Planner, Pantry, Diary, and every other domain page (all share the one global `FloatingAssistant` mount) now shows the canonical apple mark at 30px, sized consistently with CP1A's `CompanionAvatar`. Open state still shows the `X` close icon.
4. **Behaviour:** clicking the button still opens/closes the same panel; Escape still closes it; the header `CompanionPresenceBadge`'s `"companion:open"` event still opens the same panel.

---

## Rollback

```bash
git checkout HEAD -- client/src/components/conversation/FloatingAssistant.tsx
```

If not yet committed, `git restore client/src/components/conversation/FloatingAssistant.tsx` returns the entry button to the `MessageSquare` icon.

---

## Definition of Done

- [x] Companion floating entry button (all domain pages) renders the canonical THA apple mark, not a generic chat icon.
- [x] Visual size matches CP1A's ~1.5× increase (20px → 30px).
- [x] Click behaviour (open/close, Escape, header badge event) unchanged.
- [x] Workspace/domain navigation logo (`ThaAppleIcon`) untouched.
- [x] No Companion behaviour or functionality changed.
- [x] Typecheck passes with no new errors.
