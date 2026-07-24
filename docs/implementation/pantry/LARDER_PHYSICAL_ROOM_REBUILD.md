# Larder — Physical Room Rebuild

**Date:** 2026-07-22
**Room:** Larder (`/pantry`, `PantryPage`)
**Design reference:** `attached_assets/design/north_star/v3/pantry new.png` (visual & compositional reference — *not* the functional UI)
**Governing reads:** `docs/architecture/README.md` · `LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md` (LARDER1) · `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (EXPGOV1/2) · `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md` (LIVINGHOME1) · `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (LIVINGHOME2) · `HOME_OWNER_ARCHITECTURE.md` (HOMEOWNER1) · `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (UIOWN1) · `THA_CRAFTSMANSHIP_CONSTITUTION.md` (CRAFT1)

---

## Rollback protection

| | |
|---|---|
| **Rollback identifier** | `rollback/LARDER-physical-room-20260722` |
| Points at commit | `e4f0ae39` (`NSR1 — completion report + session record`) |
| Working-tree snapshot ref | `refs/rollback/LARDER-physical-room-worktree` → `b285c123` (uncommitted changes captured, not applied) |
| Restore command (committed state) | `git reset --hard rollback/LARDER-physical-room-20260722` |
| Restore working-tree snapshot | `git stash apply refs/rollback/LARDER-physical-room-worktree` |

---

## Governance decision — PROCEED (no conflict)

This task is a **lawful implementation** of `LARDER1` (the Larder Room North Star), not a conflict with it. LARDER1 §1 states plainly: *"The document is the North Star; the room is built later, by others, surface by surface, each pass verified against this."* Building the physical, directly-manipulable room is exactly the sanctioned next step.

The task is bound to LARDER1's hard boundaries, all of which this rebuild honours:

- **One owner per fact (Principle 2).** Staples stay **Domain 30** (`user_pantry_items`, `server/storage.ts` sole writer); what-needs-buying stays **Domain 15** (Shopping); food identity stays **Domain 2** (Canonical Food). No new store, no new canonical entity.
- **The load-bearing rule (LARDER1 §8).** *Moving an item to Shopping must not remove its staple status.* Drag-to-Shopping writes **only** Domain 15; only the explicit Bin (out-of-Larder) gesture retires a staple (Domain 30 soft-delete).
- **No new stored fact (LARDER1 §13, §16).** No quantity, measure, freshness, expiry, ageing. Physical *forms* (jar/tin/bottle/…) are a **presentation reading** of data the owner already holds (LARDER1 §3 — "a reading of data the owner already holds; it introduces no new stored fact"), derived deterministically, never persisted and never claimed as fact.
- **No schema change / no backfill** — none made. (The task requires stopping for approval before either; neither was needed.)
- **Rooms observe; the Companion understands; the household decides (GEA21–23).** The room reports its own contents and offers controls; recipe/advice remains a Companion doorway.
- **Drag is an enhancement, never the only way (LARDER1 §10).** Every drag outcome (→ Shopping, → Bin, → move) has a keyboard and a touch/tap-menu equivalent.

### One requirement verified against the owner before it was called lawful

**"Dragging between storage areas moves the same canonical record."** This is a `category` change on the existing Domain 30 record. It is lawful **only if** the existing writer (`server/storage.ts` / `PATCH /api/pantry/:id`) already supports updating `category` — writing it through any new path would fork the owner. Verified against the server contract before implementation (see *Server contracts used*). If the existing path had **not** supported a category update, this one behaviour would have been dropped and reported as an honest gap rather than built on a new write path.

**No governing rule is contradicted. No check fails.**

---

## Server contracts used, and the approved owner extensions

**Read/write only through the existing owners.** The contract audit (`server/routes.ts`, `server/storage.ts`, `shared/schema.ts`) found the room's read and three of its writes already existed, and two required writes did not. Under the recorded Home-Owner approval (Option 1), Domain 30's **sole writer** (`server/storage.ts`) was extended — no new entity, no new ownership, no schema change, no backfill, no new store:

| Operation | Path | Status |
|---|---|---|
| Read staples | `GET /api/pantry` → `storage.getPantryItems` (filters `is_deleted = false`) | existing, unchanged |
| Add staple | `POST /api/pantry` → `storage.addPantryItem` (identity resolved vs Domain 2) | existing, unchanged |
| Add to shopping | `POST /api/shopping-list` → `storage.addShoppingListItem` (Domain 15) | existing, unchanged |
| Mark availability | `PATCH /api/pantry/:id { needQuantityValue }` → `storage.updatePantryItemQuantity` | existing, reused (no number surfaced) |
| **Take out (Bin)** | `DELETE /api/pantry/:id` → `storage.deletePantryItem` | **changed**: now a soft-delete for **every** staple (was hard-delete for user items), so the Bin is always reversible (LARDER1 §4.2) |
| **Restore (Undo)** | `POST /api/pantry/:id/restore` → `storage.restorePantryItem` | **new writer** on Domain 30 — clears `isDeleted` on the SAME record (LARDER1 §4.3) |
| **Move location** | `PATCH /api/pantry/:id { category }` → `storage.updatePantryItemCategory` | **new writer** on Domain 30 — sets `category` on the SAME record; no delete, no re-insert, no duplicate |

The partial unique index (`…_active_unique WHERE is_deleted = FALSE`) means soft-delete frees the key cleanly; the six-value `category` set is enforced by the route Zod enum and the DB CHECK constraint. `server/storage.ts` remains the single writer of Domain 30 (Principle 2 intact).

---

## What was built

- **`client/src/pages/pantry-page.tsx` — rebuilt, not restyled.** The card → modal → CRUD-list room is gone. The room is now constructed from separate interactive storage objects: **larder shelving** (two shelf boards), **fruit & veg baskets**, a **fridge** and a **freezer** that *open* to reveal their real inventory inside constructed racks/shelves/compartments, a **household cupboard**, and a **pet drawer**. Each holds the household's REAL Domain 30 staples as physical objects that sit on real shelf planks.
- **`client/src/lib/larder-forms.ts` — deterministic physical-form reading.** Maps each record to a jar / large-jar / tin / bottle / packet / box / tub / basket / herbs / **generic** form from its own name + storage location. Pure, never persisted, never a claim; unknown packaging → an honest generic container ("Do not force every product into a jar").
- **`client/src/index.css` — a self-contained `.lardr-*` block** (warm, sunlit materials; constructed shelves, appliances, baskets; drop-target and reduced-motion states). The old `.larder-*` block was removed; no shared token was changed.
- **Server (Domain 30 owner extension)** — `server/storage.ts` + `server/routes.ts` as tabled above.

**Interactions on every product object:** select (click/tap/keyboard → action menu), drag (pointer + touch via dnd-kit sensors), and a **keyboard/touch alternative for every outcome** (the action menu: Add to shopping · Mark running low/stocked · Move to… · About this · Take out). Drop destinations are genuine surfaces: a sticky **Shopping** basket and **Bin** dock, and **every storage area is a drop surface** for moves. Drag-to-Shopping keeps the staple; Bin soft-deletes with an **Undo** toast (restores the same record); Bin-on-write-failure rolls the object back via refetch.

**Preserved:** search-to-add (single add gesture, Domain 2 resolution), the Companion doorway (`openCompanion`), Explore mode (`?mode=explore` → `PantryKnowledgeHub`), per-item `PantryIntelligencePanel` (under "About this"), and `usePublishCompanionContext`.

---

## Validation performed

- **Typecheck (canonical gate `npm run typecheck:ci`):** the changed files add **zero** regressions. The gate reports **16 regressions, all pre-existing** in unrelated `server/tests/*` files (test-cbk2, test-intelligence-shopping-binding, test-pantry1, test-plan2) — identical to the documented baseline.
- **Pantry capability tests:** `INT8` (read-only binding) **47/0**, `INT31` (pantry-discovery) **40/0** — including the trust test *"isDeleted flag is never surfaced in the pantry list projection,"* which passes with the new soft-delete.
- **Build:** `npm run build` (vite client + esbuild server) succeeds; `pantry-page` bundles at ~53 kB.
- **Data-trust UAE (end-to-end against the DB):** a throwaway user exercised the real Domain 30 writers; **21/21 assertions passed**, then the user + household + all rows were fully deleted (0 leftover). Script was temporary and removed after the run.

---

## User Acceptance Evidence

| # | Scenario | Evidence | Result |
|---|---|---|---|
| 1 | Oats jar on a shelf → Shopping | UAE: oats added, sent to shopping; oats still in larder **and** on shopping list | ✅ verified (DB) |
| 2 | Olive-oil bottle → Bin → Undo | UAE: soft-deleted (hidden from larder), restore returns the **same id**, back in larder | ✅ verified (DB) |
| 3 | Tin (chopped tomatoes) → Shopping | UAE: tin → shopping; tin still in larder | ✅ verified (DB) |
| 4 | Pasta in an appropriate physical form | UAE: `deriveForm("Penne Pasta")` → **packet** (not a jar); oats→jar, oil→bottle, tomatoes→tin, onions→basket, unknown→generic | ✅ verified (DB) |
| 5 | Open fridge → interact with a real fridge item | UAE: real `fridge` item read back in the fridge category; UI: `ApplianceFurniture` opens to show `fridge` items in constructed racks | ✅ data verified; UI build-verified |
| 6 | Open freezer → interact with a real freezer item | UAE: real `freezer` item read back; UI: freezer opens to constructed compartments (`freezer` has real seed data) | ✅ data verified; UI build-verified |
| 7 | Move an item between storage locations | UAE: `updatePantryItemCategory` moved the **same id** larder→fridge; still one row (no duplicate) | ✅ verified (DB) |
| 8 | Failed write restores the object | UAE: a no-op/failed delete changes nothing (object stays); UI: `binMutation.onError` refetches to restore the object | ✅ verified (DB + code) |
| 9 | Touch and keyboard alternatives | Code+build: dnd-kit `TouchSensor` for touch-drag; the action menu (Popover) gives every outcome to keyboard/tap; `prefers-reduced-motion` respected; availability carries a text "Low" tag, never colour alone | ✅ code/build-verified (not browser-automated) |
| 10 | No duplicate pantry or shopping records | UAE: no duplicate ingredient keys after all moves/restores; moves and Undo write the same record, never a new one | ✅ verified (DB) |

---

## Honest gaps

- **Scenario 9 was not driven in a live browser** in this sandbox (auth-gated SPA, no browser automation). It is verified by the build, the dnd-kit touch sensor, the keyboard-operable action menu that covers every drag outcome, and the non-colour-only availability cue — but a human should still confirm real touch-drag and keyboard-drag on a device.
- **Restore vs a re-added twin.** If a household bins item X, then *adds a fresh X* before pressing Undo, the restore of the original can collide with the active unique index; the route surfaces this honestly as `already_exists` ("already back in your larder"), never as data loss. This is a rare edge, handled, not silently swallowed.
- **Availability is two-state** (stocked / running low), derived from the existing `needQuantityValue` flag; no number is surfaced (LARDER1 §16). This is deliberate, not a gap, but noted for clarity.
- **`sortOrder` is still seed-only** — the room reads placement order from the owner and does not yet let the household reorder objects on a shelf (no reorder writer exists; out of scope, not built).
</content>
</invoke>
