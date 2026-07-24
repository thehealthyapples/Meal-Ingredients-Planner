# LARDER North Star — Atmosphere Implementation Report

**Session ID:** `LARDER_NS1_Larder_NorthStar_Atmosphere_Implementation`
**Date:** 2026-07-22
**Author of record:** Colin Clapson (owner) · implemented by Claude under the Engineering Workflow
**Rollback identifier:** `rollback/LARDER-northstar-impl-20260722` → `dedb5396` (annotated tag)
**Status:** Complete — committed & pushed; awaiting Home Owner review
**Reference image:** `attached_assets/design/north_star/v3/North star atmosphere pantry.png` (approved atmosphere North Star — reference only)

---

## 1. What was asked, and the one honest constraint

The brief: implement the THA Larder using the approved North Star atmosphere image, **preserving the existing THA architecture** — one bottom navigation, approved THA icons, the embossed single-apple Companion button, the approved top-right actions, the existing information architecture, functionality, business logic, and canonical ownership. *"Do not copy the image literally. Translate its feeling. If architectural constraints require differences from the image, preserve the architecture and capture the atmosphere."*

That last sentence is load-bearing, because the reference image — beautiful as it is — depicts **three things the governing architecture and the brief itself forbid me to build**:

1. **A photoreal, environmentally-dressed room** (warm oak shelving, labelled glass jars, garlic, onions, potted herbs, microgreens on the sill, a bowl of onions on an oak counter).
2. **A left side-navigation** (in addition to a bottom nav) — i.e. duplicate navigation.
3. **A green "Companion" pill** with a sparkle glyph and a top-right search/bell/avatar cluster — not THA's embossed single-apple Companion button and approved top-right actions.

The brief mandates keeping THA's one bottom nav, THA's Companion button, and THA's top-right actions, so (2) and (3) are explicitly out. And (1) — the room's whole photographic atmosphere — is **Environmental Dressing**, which the governing architecture makes **DECLARED, NOT BUILT** (see § 2). So the literal image cannot ship as-is without an owner-level Blueprint amendment.

This report implements the **lawful translation** the brief pre-authorised: the *feeling* of the North Star (a warm, hospitable, orchard-lit Larder the household recognises as their own) carried entirely through **mechanisms THA already owns**, plus the approved **Pantry → Larder** rename — and it names, precisely, what was deliberately **not** built and the governed path by which the fuller image could one day arrive.

---

## 2. The governing constraint (Architecture Bootstrap — read first, per `docs/architecture/README.md`)

Documents read before any change: `docs/architecture/README.md`, `LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`, `LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`, `HOME_OWNER_ARCHITECTURE.md`.

The reference image is a **per-room distinct environment**. The Living Home canon addresses this directly and refuses it without a governed admission:

- **`LIVINGHOME1` § 4** — *"per-room distinct environments (a pantry scene, a greenhouse, a village) were evaluated and refused at North Star implementation, and remain a future governed admission only — new canonical assets plus a Blueprint amendment, never shipped by taste."*
- **`LIVINGHOME1` § 5.2 (rule of thumb)** — *"if a 'seasonal' change would still be visible to a household whose planner, pantry, and diary were empty, it is dressing the house and is refused; if it disappears when the household's data disappears, it is showing the life."* The oak shelving, jars, garlic and onions are visible regardless of the household's data → **dressing the house → refused.**
- **`LIVINGHOME2` (Environmental Dressing)** — DECLARED, NOT BUILT: ships nothing until four named owner amendments + the Dressing Register land, and **specifically bans produce dressing in the Pantry room**.
- **`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md` (LARDER1) § 15/§ 16** — environmental dressing of the Larder is an explicit non-goal; the physical items in the room must be the household's **own data-borne staples**, never decoration; no quantities/measures; Domain 30 owns no time.
- **`HOME_OWNER_ARCHITECTURE.md`** — the Home Owner exercises authority **through** the governing documents, never around them: a decision contradicting a governing rule is an amendment proposal to that rule's owner, never an exception by instruction.

**Conclusion:** building the image literally would violate `LIVINGHOME1` § 4/§ 5.2 and `LIVINGHOME2`. Per the Architecture Bootstrap's STOP discipline, the literal build is not performed; the atmosphere is captured through owned mechanisms, and the amendment path for the fuller image is recorded in § 7 as an owner decision.

**The good news, found in the code:** most of the North Star's *lawful* atmosphere is **already built and owned** for this room:

| North Star atmosphere element | Already delivered by (owned) | Status |
|---|---|---|
| Orchard visible through a window | Pantry exposure **E2 — "the window"** (`app-shell.tsx` `ROOM_EXPOSURE.pantry = "e2"`; `orchard-backdrop.tsx`) — the one canonical orchard at the room's governed exposure | Present, unchanged |
| Warm natural materials underfoot | Pantry ground posture **"room"** — the warm plaster/oak-toned ground plane (`ROOM_GROUND.pantry = "room"`, INTARCH1/INTARCH2 `.room-ground`/`.surface-primary`) | Present, unchanged |
| Soft natural daylight, one morning | The one-sun / one-morning light of the shell (Blueprint § 7) | Present, unchanged |
| The room named at its threshold | Shell threshold reads the room name from `NAV_ITEMS` + purpose from `ROOM_PURPOSE` | **Renamed to "Larder" + warmed** |

So the lawful delta is small and precise — the atmosphere the canon permits is already in the walls; what was missing was the room's **name** and **voice**.

---

## 3. What was implemented (the lawful atmosphere translation)

**Nine files, +15/−15 lines — all display strings. No layout, token, component, hook, schema, route, business-logic, or ownership change.**

### 3.1 The room becomes the Larder — at its single owner
- `client/src/components/nav-bar.tsx` — `NAV_ITEMS` label **"Pantry" → "Larder"**. `NAV_ITEMS` is the *single source of truth* for every room name (its own comment: "a second list of room names would be a second owner"), so this one edit renames **both** the shell threshold title **and** the one bottom-nav label together — matching the image, with **no duplicate navigation** and the **same THA box icon** (`PantryIcon`), route (`/pantry`) and realm (`pantry`) untouched. This is exactly the user-facing rename `LARDER1` § 2 approved.

### 3.2 The threshold voice becomes hospitable
- `client/src/components/layout/app-shell.tsx` — `ROOM_PURPOSE["/pantry"]` **"What the house already has." → "See what you keep."** — the North Star image's own subtitle voice: warm, factual, a room reporting (GEA21), not coaching.

### 3.3 The room/tab name collision resolved
Renaming the room to "Larder" would otherwise leave a room called *Larder* containing a sub-tab also called *Larder* (the dry-goods staples category). Resolved with a **display-label change only**, matching the image's own "Store Cupboard" category:
- `client/src/pages/pantry-page.tsx` — `FOOD_CATS` larder **label "Larder" → "Cupboard"**; empty-state title "No larder staples yet" → "No cupboard staples yet". **The canonical category value `"larder"` (the DB default, Domain 30) is untouched** — only its display label changed. Information architecture is unchanged (same four food tabs, same structure).

### 3.4 Household-facing labels made consistent with the rename
So the renamed room does not read as broken beside stale "Pantry" text elsewhere (routes, keys, testids stay `pantry` — the `LARDER1` § 15 internal-id deferral):
- `pantry-page.tsx` — room header `title="My Pantry" → "My Larder"`; search placeholder "Search pantry…" → "Search larder…"; in-body group header **"In Pantry" → "In Larder"** (×2); toast "Already in pantry" → "Already in larder"; failure "Couldn't add that to your pantry" → "…to your larder".
- `client/src/components/conversation/FloatingAssistant.tsx` — Companion surface label `pantry: "Pantry" → "Larder"`.
- `client/src/pages/shopping-workspace-page.tsx` — Shopping group label `"Pantry Staples" → "Larder Staples"`.
- `client/src/components/PlantDiversityReport.tsx` — Nutrition cross-link "…in your Pantry" → "…in your Larder".
- `client/src/pages/onboarding-page.tsx` — start-area card title "Pantry" → "Larder".
- `client/src/pages/profile-page.tsx` — shared-info list item "Pantry" → "Larder".

---

## 4. What was deliberately NOT built (and why)

| Image element | Not built — reason |
|---|---|
| Oak shelving, labelled glass jars, ceramic bowls, olive-oil bottles, herbs, chopping board, garlic, onions, linen towel, potted herbs, microgreens on the sill | **Environmental Dressing — `LIVINGHOME2` DECLARED-NOT-BUILT** (ships nothing; bans produce dressing in the Pantry room); **`LIVINGHOME1` § 4** refuses per-room environments without a Blueprint amendment; **`LIVINGHOME1` § 5.2** — visible with empty data = dressing the house. Path = § 7. |
| Left side-navigation | Brief mandates **one bottom navigation, no duplicate navigation**; **GEA19** — no room forks the shell/nav. Kept THA's one bottom nav. |
| Green "Companion" pill + sparkle; top-right search/bell/avatar cluster | Brief mandates the **embossed THA single-apple Companion button** and the **approved top-right actions**. Left exactly as they are. |
| "Well stocked 18 / Running low 6 / Need attention 4" stock strip | New per-item stock state. **Domain 30 owns no time / no quantity** (Register; `LARDER1` § 16 non-goal). Approximate availability already lives in the owned `defaultHave` / need signals; no tri-state gauge introduced. |
| Re-categorised grid (Grains & Flours / Pulses & Beans / Canned Goods …) | Brief mandates **existing information architecture**. Kept the existing Inventory/Explore/Cupboard/Fridge/Freezer/Fruit + Household/Pet structure. |

---

## 5. Verification

- **Client typecheck:** `tsc --noEmit` → **0 errors in `client/src`** (88 total errors are all pre-existing server errors; no server file was touched — verifiable: the diff contains no `server/` path).
- **Production build:** `npm run build` → **exit 0** (4 pre-existing `import.meta` warnings in a build script, unrelated).
- **Adoption Register:** `npm run adoption:check` → **100 passed · 0 notices · 9 failed** — the established baseline; **zero new failures** (this change adds/changes/retires no building block — component, hook, token, or pattern — so no adoption impact).
- **Consistency sweep:** no household-facing "Pantry" string remains (remaining hits are admin surfaces and one code comment, correctly left).
- **Not performed this pass — stated honestly:** no live application screenshot was captured. The change is display-strings only, validated by the type system to render, and the atmosphere-bearing mechanisms (the E2 orchard window and the warm ground plane) are **byte-unchanged owned systems** — so these edits cannot alter the room's visual atmosphere, only its name and words. A live Home Owner walk-through on desktop is the appropriate acceptance step (§ 9).

---

## 6. Compliance

### Experience Constitution Check (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2 — before design)
- **Hospitality:** ✅ the room now greets the household by its warm household name and a hospitable line.
- **Outcome:** ✅ *recognition / less to carry* — "Larder / See what you keep."
- **Weight (GEA2):** ✅ no element added; the room is not heavier.
- **Voice (GEA8/9):** ✅ the room reports ("See what you keep."); no coaching added.
- **Ownership (GEA21/22):** ✅ the room shows facts; interpretation stays the Companion's.
- **Agency (GEA23):** ✅ nothing decides for the household; functionality unchanged.
- **Restraint (GEA11/13/15):** ✅ no score/stock-gauge/dressing added; the refused dressing is recorded, not shipped.
- **Layer (GEA20):** ✅ an Experience-Implementation change that originates no law and cites the owners above.

### Architecture Compliance
- ✅ One owner per fact — room name renamed at its single owner (`NAV_ITEMS`); no second name-owner created.
- ✅ No duplicate entities / ownership / state — no store, schema, or state added; `larder` category value and Domain 30/15/2 owners untouched.
- ✅ Extends existing architecture — captures atmosphere through owned mechanisms (E2 window, `.room-ground`, `ROOM_PURPOSE`); forks nothing (GEA19).
- ✅ Honest gaps over fabrication — the forbidden dressing is named and deferred, not faked.

### AI Architecture Compliance
- ✅ No assistant/capability/conversation-state change. The only Companion-adjacent edit is a **display label** (`FloatingAssistant` surface label "Pantry"→"Larder"); the surface key, routing, capability (`pantry`), and permission model are untouched. The embossed single-apple Companion button is unchanged.

### Data Impact
- **Reads existing data:** no new reads introduced (display strings only).
- **Writes new data:** **NO** — no schema, column, row, or migration.
- **Changes meaning of existing data:** **NO** — the `larder` category value keeps its meaning; only its display label changed.
- **Requires backfill:** **NO.**

### Trust Check
- Could this mislead? No — every changed string is a truthful room/label rename; no claim, count, freshness, or stock state was invented (the image's stock strip was deliberately not built).
- Fabricated certainty? No.
- If wrong? A display-string defect, correctable by edit; no runtime/business behaviour depends on these labels.

### Scope Lock
- **Implemented:** the Pantry→Larder user-facing rename (nav + threshold), the warmed threshold voice, the room/tab collision fix (Cupboard, display-only), and household-facing label consistency. Nine files, display strings only.
- **Explicitly excluded / deferred:** all environmental dressing; any side nav; any Companion-button or top-right change; any stock/quantity/freshness state; any IA, layout, token, component, schema, route, business-logic, or canonical-ownership change; and the internal-identifier rename (route `/pantry`, realm, `user_pantry_items` table, `pantry` capability id, testids) — the `LARDER1` § 15 separate decision, plus admin-surface "Pantry" strings.

### Rollback
- **Identifier:** `rollback/LARDER-northstar-impl-20260722` → `dedb5396`.
- **Revert:** `git checkout rollback/LARDER-northstar-impl-20260722 -- client/` then commit; or `git revert <this commit>`.

---

## 7. The path to the fuller North Star (owner decision, not taken here)

The photographic, environmentally-dressed Larder in the reference image is a genuinely desirable direction — but it is a **per-room environment / Environmental Dressing**, which the canon reserves for a **governed admission**, not a taste decision. Shipping it lawfully requires, in order:

1. A **Blueprint amendment** admitting per-room environments (`LIVINGHOME1` § 4; Blueprint § 6.2/§ 8.1) — ideally proposed once for all rooms, not nine taste decisions (`LIVINGHOME1` § 12.2).
2. The **`LIVINGHOME2` Environmental Dressing** roadmap executed: its four named owner amendments + the Dressing Register (§ 10.2), which today forbid produce dressing in the Pantry room.
3. **Canonical assets** admitted through the fixed path (named concern → conflict check → tokens by admission → predecessor retired → Adoption Register entry), respecting the two-orchard convergence still open (`LIVINGHOME1` § 10.2).

Until those pass their own reviews, the lawful Larder is the one delivered here: **the same room as the North Star in name, voice, orchard-light and warm material — unmistakably The Healthy Apples — with the dressing deferred, not faked.** This is the Home Owner's amendment to initiate (`HOMEOWNER1`), never an exception granted by instruction.

---

## 8. Files changed

```
client/src/components/nav-bar.tsx                        (room label: Pantry → Larder)
client/src/components/layout/app-shell.tsx               (threshold purpose voice)
client/src/pages/pantry-page.tsx                         (header/placeholder/tab/labels/toasts)
client/src/components/conversation/FloatingAssistant.tsx (Companion surface label)
client/src/pages/shopping-workspace-page.tsx             (Shopping group label)
client/src/components/PlantDiversityReport.tsx           (Nutrition cross-link)
client/src/pages/onboarding-page.tsx                     (onboarding card title)
client/src/pages/profile-page.tsx                        (shared-info list item)
docs/implementation/pantry/LARDER_NORTHSTAR_IMPLEMENTATION.md    (this report)
```

## 9. State: Waiting for User

Acceptance is a Home Owner walk-through of `/pantry` on desktop, confirming the room reads as *Larder* with its hospitable line, warm ground and orchard window, and that navigation, the Companion button, and top-right actions are unchanged. The owner decision that remains open is § 7 — whether to open the Blueprint/`LIVINGHOME2` amendment path toward the fully dressed room the reference image depicts.
