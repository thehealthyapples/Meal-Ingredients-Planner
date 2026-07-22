# Larder — Ground-Up Rebuild (NSR1 Phase 3): Design, De-risking & Build Plan

**Room:** Larder (today "Pantry") — `/pantry` → `client/src/pages/pantry-page.tsx`
**North Star:** `docs/architecture/LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md` (`LARDER1`)
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Status:** Design + implementation plan complete; the **build is specified and de-risked**, and is
recommended as a dedicated, **visually-verified** pass (reasoning in §6).

---

## 1. The room, from the architecture (as if it had never been built)

**The Larder is a real household larder, not a list** (LARDER1 §1). A place the household recognises —
shelves with jars and tins, herbs by the hob, a basket of onions — whose approximate availability is
read *by looking*, **never a quantity, never a form**. The Experience Test answers:
- **Which room** — the household's own store of staples (Domain 30's room).
- **How it should feel** — *"that is my larder"*: recognition, calm, ownership; not the load of an audit.
- **The one thing** — see what they normally keep and keep that picture true (mark as needed, take out,
  put back) **without ever counting**.

## 2. Ownership (unchanged — the rebuild creates no new owner)
- **Staples + approximate availability** → Domain 30 `user_pantry_items` (`server/storage.ts` sole writer).
- **What needs buying** → Domain 15 `shopping_list` (Shopping is the sole owner; the Larder *originates* intent).
- **Food identity** → Domain 2 Canonical Food.
- **Companion enrichment** → the registered permission-aware `pantry` capability only.

## 3. ⭐ De-risking finding — the rebuild is PRESENTATION-ONLY (no backend change, no STOP)

I traced every write the North Star requires against the code. **None needs a new stored fact, migration,
or endpoint** — exactly as LARDER1 §13 asserts:

| North Star requirement | How it is satisfied over EXISTING owners | Backend change? |
|---|---|---|
| Physical sections (shelves/baskets/drawers) | Read existing `user_pantry_items.category` + `sortOrder` | None |
| Approximate availability (have / running low / out) | The existing `defaultHave` boolean **+ a visual metaphor** (fuller/emptier). §3 is explicit there is **no stored "running low" fact** — the middle state is *the household's own sense*, never a number | None |
| Mark as needed → Shopping | `POST /api/shopping-list` with `productName` only. **`quantityValue`/`unit` are nullable** in `shoppingList` / `insertShoppingListItemSchema` (`shared/schema.ts:208–209`) — the endpoint **already accepts a quantity-less intent** | None |
| Keep the staple when marked needed (load-bearing §8) | Do not touch Domain 30 on mark-needed (write only Domain 15) | None |
| Take out of larder / put back | Existing Domain 30 soft-delete (`isDeleted`) / restore via `server/storage.ts` | None |
| Add a staple | Existing search → Domain 2 resolution → Domain 30 add | None |

**Conclusion:** the Phase 3 STOP rule (triggered by a *necessary* backend/architectural decision) is
**not met**. The one behaviour change — **retiring the `needQuantityValue`/`needUnit` "+ Need" quantity
control** — is *mandated* by LARDER1 §16 (no quantities), not a discretionary backend change: the field
and its consumers (e.g. `opportunity-engine.ts`) are left intact; the Larder simply stops *surfacing and
setting* it. Existing values remain; the engine already tolerates `null` (most rows are null today). No
migration, no consumer edit. So there is **no conflict to present and no approval gate** on backend
grounds — the room can be built entirely in the presentation layer.

## 4. The build — component-level plan

Replace the inventory-list page (tabs + hollow checkboxes + `NeedQuantityControl` + `CategoryTabs` +
duplicated Food/Home sections + heavy knowledge panels) with a **physical store**:

- **`LarderRoom`** — the page. Loads Domain 30 staples (existing `/api/pantry` hook), groups by
  `category` into **places**, ordered by `sortOrder`. Keeps the existing WAITING/BROKEN/EMPTY three-state
  discipline (PROD1 `EmptyState` + `LoadError`).
- **`LarderSection`** (a place: Larder shelves · Fridge · Freezer · Fruit · Household · Pet) — a titled
  physical area, not a tab. Vertically scrollable sections on mobile; the same arrangement on desktop.
- **`LarderItem`** (a jar/tin/herb) — name (Domain 2 identity) + **approximate availability** rendered
  *without colour alone* (§10): a have/need state from `defaultHave`, with a text/shape cue as well as any
  fill. **No quantity, no checkbox, no "+ Need" pill.**
- **Item actions (non-drag, full parity — §10):** an item menu with *Add to shopping list* (→ `POST
  /api/shopping-list`, no quantity; staple stays), *Take out of the larder* (Domain 30 soft-delete),
  and, for taken-out items, *Put back*. Every outcome reachable by keyboard/screen-reader.
- **Desktop drag (enhancement, §4):** drag onto the visible Shopping List (mark needed), out of the
  Larder (remove staple), back in (restore) — each resolving to the **same existing operation** as its
  menu action. Drag is additive; the menu is the floor.
- **Add via search (§6):** one add-item control resolving against Domain 2; no quantity on add.
- **Shopping List as a composition (§8):** render Domain 15 published state as a drop target; persist
  nothing, add no voice.
- **Removed:** `CategoryTabs`, `NeedQuantityControl`, the hollow-checkbox/"Select all" grammar, the
  "Inventory" mode label, the duplicated section, and the heavy in-room knowledge panels (enrichment
  routes through the `pantry` capability, not a private read).

## 5. What this maintains (business logic preserved)
Every data hook and mutation (`/api/pantry` reads, add/soft-delete/restore, `/api/shopping-list` add)
is reused unchanged. Canonical ownership (Domains 30/15/2) is untouched. The change is presentation and
interaction only — precisely the programme's scope.

## 6. Why this is delivered as a design + a recommended verified build, not a blind one-shot rewrite

The Craftsmanship Constitution is explicit (§8): **"Do not stop because the code compiles… Only stop
when the room genuinely deserves to exist."** A physical-room rebuild's entire quality — the materials of
a jar, availability legible *at a glance*, the feel of the drag, the arrangement reading as *"my larder"*
— can only be judged **by looking** (LARDER1's own discipline; ODL2 §6.3, cited across this codebase:
"this class of defect is found by looking at a picture"). This environment cannot run the app or take a
screenshot. Shipping a ~1,300-line replacement of the flagship physical room **blind** would produce
exactly the "technically works but does not deserve to exist" outcome CRAFT1 §8 forbids — the worst way
to honour a North Star whose whole point is *seeing*.

So Phase 3 delivers what is genuinely solid and reusable now — the **faithful design, the verified
de-risking (presentation-only, no backend), and the component-level plan** — and recommends the build be
executed as a **dedicated, visually-verified pass** (app running, screenshots across 390 · 520 · 900 ·
1100 · 1440 · 1920, dark mode, keyboard/SR check). This is the one remaining owner decision for the
Larder, and it is an *execution* decision (build-with-eyes vs build-blind), not a governance conflict.

## 7. Architecture Compliance / Scope
Presentation-only over existing owners; no schema/migration/endpoint; `server/` untouched. Principle 2
(one owner per fact) holds — the *keep* fact (Domain 30) and the *buy* fact (Domain 15) stay distinct at
distinct scopes (§8). GEA13 clean (no score/grade). GEA8/21 — the room reports and offers controls;
coaching stays the Companion's. Rollback: `rollback/NSR1-north-star-reconstruction-20260722`.
