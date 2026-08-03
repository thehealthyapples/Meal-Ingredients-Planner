# Living Home — Concept-Lock Implementation 01 (Room becomes the page)

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — Living Home runtime implementation.
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-concept-lock-01-base` → `e1b38dc8`.
**Governing (frozen):** Model B, Spatial Blueprint, Working-Position + ownership model. No architecture doc created; no redesign.

## What was implemented

**Priority 1 — remove the application feeling (the room becomes the page).** For the Living Home room (`/pantry`) the shell's application framing now stands down, leaving only essential navigation, the Companion and trust notices:

- **Orchard-banner threshold removed** — `RoomThreshold` returns `null` for Living Home routes (no orchard window, no scrim, no room-identity band).
- **Room header removed** — the shell's default `ShellHeader` ("Larder / See what you keep.") is suppressed for Living Home routes.
- **Page framing/card removed** — the room no longer renders inside `pageContainerClass` (max-width + padding). A full-bleed `.lh-room-page` centres the Environment Plate, which now **fills most of the viewport** (the stage grows into the reclaimed space).
- **Kept (essential only):** the bottom navigation (the household's way around the house — UX1), the Companion (`FloatingAssistant`), and the trial/trust banners (honesty yields nothing).

This is done with a single per-route predicate (`isLivingHomeRoom`) so **every other room is byte-for-byte unchanged** — the conditional only removes chrome on `/pantry`.

**Priorities 2, 3, 5 — already satisfied and preserved** (previous Concept-Lock turn): the Category multi-selection workspace (select one/many, Add-all-to-shopping wired to Domain 15, batch tray), Companion as sole knowledge owner ("Ask Apple", no info pages), and environmental continuity (room present at every level).

**Priority 4 — concept-only polish:** no obvious interaction/placement bugs remained (jars seat on the timber; dressing at shelf ends; no clipping or impossible furniture observed). No craftsmanship begun.

## Files changed

| File | Change |
|---|---|
| `client/src/components/layout/app-shell.tsx` | `isLivingHomeRoom` predicate; `RoomThreshold` and default `ShellHeader` stand down for Living Home routes (other routes unchanged) |
| `client/src/pages/living-home-room.tsx` | room renders full-bleed (`.lh-room-page`, no `pageContainerClass`) |
| `client/src/pages/living-home-room.css` | `.lh-room-page` full-bleed wrapper; stage grows to `min(88dvh, …)` in the reclaimed space |

## Regression checks

- **App compiles; no console errors.** The unauthenticated site (sign-in / create-account) renders normally — the shell change did not break the shared layout.
- **Other rooms unaffected by construction:** the gating is a pure `path === "/pantry"` conditional; for any other route `isLivingHomeRoom` is `false` and `RoomThreshold`/`ShellHeader` render exactly as before.
- **Navigation + Companion retained on `/pantry`:** bottom nav and the floating Companion are outside the removed chrome.
- **No data-model change; no new imagery (£0.00).**

## Screenshots — deferred this session (auth cooldown)

The headless captures authenticate through the **no-password trial** (`POST /api/demo/start`). Repeated capture runs across this and the prior turn tripped that endpoint's rate limiter, which appears to be a **sliding window** — each further attempt (including status checks) resets the cooldown. To let it clear I have **stopped calling it**; fresh desktop/mobile shots of the chrome-free room will be captured on reset.

- The **interaction** evidence (multi-selection workspace, single-object controls + "Ask Apple", batch selection) is current in `docs/implementation/concept-evidence/` from the prior turn and is unchanged by this turn's chrome removal.
- The Priority-1 change is a shell/layout removal (verified compiling and non-breaking) and is directly viewable live at `http://localhost:5000/pantry`.

## Concept validation (per the task's questions)

- ✅ Same room at every position (environmental continuity preserved).
- ✅ The user always knows where they are (Back affordances + captions + one room).
- ✅ Interaction simpler than before (no page chrome competing with the room).
- ✅ Room now more visible than the software (threshold + header removed; plate fills the viewport).

## Remaining concept issues

- **Fresh screenshots** of the chrome-free room (pending the trial rate-limit reset).
- **Replace / Take-out** actions await real Domain-30 pantry-item ids (present as affordances; not faked).
- A later look at whether the **bottom nav** itself should visually quiet on Living Home rooms — left as-is now because it is essential navigation (UX1), not decorative chrome.

## Deferred to the Craftsmanship programme (intentionally untouched)

Glass realism, reflections, material perfection, lighting/animation polish, environmental-dressing polish, typography. None begun.

## Definition of done — status

The room-is-the-page removal is implemented and non-breaking; the interaction model (multi-selection + Companion knowledge + environmental continuity) is in place. **Home-Owner concept approval** (with the fresh chrome-free screenshots) is the remaining gate before the Craftsmanship programme.
