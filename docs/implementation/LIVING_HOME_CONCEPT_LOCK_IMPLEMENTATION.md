# Living Home — Concept-Lock Implementation

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — concept validation & implementation refinement.
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-concept-lock-base` → `e1b38dc8`.
**Governing (frozen):** `LIVING_HOME_SPATIAL_BLUEPRINT.md`, Model B, the Journey. No architecture doc created.

## What was implemented (against the frozen architecture)

- **Category is now a multi-selection workspace.** In a category (e.g. Flours) the household **taps a vessel to select or deselect** it — one item or many. Selected vessels lift and their name-plate shows a brass ring + tick. The shelf and room stay present.
- **Living Objects own the actions.** Selecting **one** item reveals its own controls in a warm in-room note: availability, **Add to shopping**, **Replace**, **Take out**. Selecting **several** reveals a batch tray — **N selected · Add all to shopping · Ask Apple to compare · Take out · Clear**.
  - *Add to shopping is wired to Domain 15* (`POST /api/shopping-list`) — single and batch — so the action genuinely works. Replace / Take-out are present affordances (a real Domain-30 soft-delete needs a real pantry-item id, which these representative items don't have — noted, not faked).
- **The Companion (Apple) owns knowledge.** There is **no separate information page**. Selecting object(s) offers **"Ask Apple about this"** (one) / **"Ask Apple to compare"** (many), which publishes the food hint and asks the Companion via the existing `useAskCompanion` + `openCompanion` channel. Nutrition, health, recipes and comparisons are the Companion's, exactly as Concept Lock requires.
- **The room stays present; only focus changes.** The Phase-4 correction holds — no dimming veil; the dressed pantry (bowl, linen, scoop, rolling pin) is visible at every working level.
- **Toward "the room is the page."** On a roomy screen the stage now **fits the viewport height** so the whole pantry (and the in-room controls) is seen at once, and the selection tray is a pinned in-room action bar above the nav. (See Remaining — full app-chrome removal is a scoped follow-up.)

## Ownership split honoured

| Owner | Owns |
|---|---|
| **Living Object** | selection · availability/storage · Add-to-shopping · Replace · Take-out |
| **Companion (Apple)** | nutrition · health · recipes · comparisons · guidance (via Ask Apple) |

The journey is unchanged: **Arrival → Shelves → Category → Living Object** — the Living Object is reached by *selecting* it within the Category workspace (as Concept Lock directs), not by a separate page.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | Category multi-selection workspace; per-object actions + batch tray; Add-to-shopping wired to Domain 15; knowledge routed to the Companion; object "level" folded into single-selection |
| `client/src/pages/living-home-room.css` | selected-vessel style; in-room selection tray; Ask-Apple entry; viewport-fit stage |
| `scripts/capture-living-home-concept.ts` | new — multi-selection walkthrough capture |

## Evidence (desktop + mobile)

`docs/implementation/concept-evidence/`: `1-arrival`, `2-shelves`, `3-flours-workspace`, `4-one-selected` (Living Object controls + **Ask Apple**), `5-many-selected` (three flours selected). The single- and multi-selection behaviours are both shown.

> **Capture note:** a fresh shot of the *pinned* tray could not be re-captured this session — the headless captures authenticate via the no-password trial (`POST /api/demo/start`), and repeated capture runs tripped that endpoint's rate limit (48-min cooldown). The app renders correctly (server 200, no console errors); only the screenshot refresh is blocked. The tray change is pure CSS positioning.

## Validation against the Concept Approval Test

- ✅ Feels like a real place · ✅ hierarchy natural · ✅ always know where you are · ✅ room present throughout · ✅ working positions feel like moving through a home · ✅ Living Objects believable · ✅ Companion naturally provides knowledge.
- ◻ *"The application disappears behind the experience"* — **partially**: the stage now fits the viewport and the tray is in-room, but the shell's room header/threshold still frames `/pantry`. Full removal is a scoped follow-up (below).

## Remaining refinements

- **Full chrome removal** — dropping the shell `RoomThreshold` / header for `/pantry` so the Environment Plate is literally the page. Deferred deliberately: it is shared-shell surgery and warrants a careful, isolated change rather than being bundled here.
- **Replace / Take-out wiring** — need real Domain-30 pantry-item ids (these representative items have none); wire when the room reads real Domain-30 staples.
- **Re-capture the pinned tray** once the trial rate-limit resets.

## Concept-conflict check (per the STOP rule)

One tension surfaced and was **reconciled without changing the architecture**: Concept Lock lists Living Objects as owning *"quantity"*, but LARDER1 (frozen) forbids a numeric quantity ("approximate availability, not a number"). Implemented as **availability** (have / running-low), consistent with LARDER1 — no numeric quantity introduced, no architecture change. Flagged here rather than silently resolved.

## Definition of done — status

Concept implementation advanced (multi-selection, ownership split, Companion knowledge). Interaction model validated by the evidence. **Home-Owner formal concept approval is the remaining gate** before the Living Home Craftsmanship programme.
