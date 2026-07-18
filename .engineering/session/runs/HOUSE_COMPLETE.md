# Run — HOUSE_COMPLETE

**Mission.** Complete the remaining rooms of The Healthy Apples House and produce the definitive House
Blueprint: the Complete House Blueprint, the Walking Journey, the House Constitution, and production
recommendations.

| | |
|---|---|
| **Session** | `HOUSE_COMPLETE` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOUSE-COMPLETE-20260718` → `7bfad50c` (tag `house-complete-wip-snapshot-7bfad50c`; working-tree snapshot `0a6f2fe1`) |
| **Status** | **Complete.** Five rooms designed; the house stated whole; four instruments delivered. Design blueprint only — no product file opened. |
| **Deliverable** | `docs/implementation/house/HOUSE_COMPLETE.md` |

---

## Scope

**Do not redesign or modify** (permanent architectural foundation):
- Entrance Hall (Home) — `HOME_ARRIVAL_PRODUCTION_LOCK.md`
- Kitchen (Cookbook) — `HOUSE5_KITCHEN_EXPERIENCE.md`
- Pantry — `HOUSE6_PANTRY_EXPERIENCE.md`

**Design (five rooms):** Family Table (Planner) · Garden Room (Nutrition) · Tasting Bench (Analyser) ·
Family Journal (Diary) · Mirror (Profile).

**The Companion is not a room** — a quiet presence throughout the house (Experience Blueprint § 13).

**Out of scope — The Orchard World programme:** Community, Partners, Admin, Support Hub.

Each room defined across: emotional purpose · architectural identity · interior language · relationship to
neighbouring rooms · desktop · tablet · mobile · permanent design rules.

---

## Required reading — completed before any change

- ✅ `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
- ✅ `docs/implementation/house/HOME_ARRIVAL_PRODUCTION_LOCK.md`
- ✅ `docs/implementation/house/HOUSE5_KITCHEN_EXPERIENCE.md`
- ✅ `docs/implementation/house/HOUSE6_PANTRY_EXPERIENCE.md`
- ✅ Experience Blueprint § 5.1 (the map of the house — **all five rooms already have canonical rows**),
  § 6.2 (Orchard Exposure Scale), § 12 (Living Details), § 13 (Companion Presence), § 14 (the shell)
- ✅ Orchard House Design Blueprint § 13.2 / § 13.6 / § 13.7 (Planner · Diary · Profile design readings)
- ✅ Experience Language § 5 (the six-beat rhythm, per realm)

**Governing finding carried into the design:** the five rooms are **not undesigned**. Every one already has
a canonical row in Experience Blueprint § 5.1 fixing its place identity, exposure, light, ground posture,
and Living Detail. This session's job is to make those rows **one legible room each**, not to invent them.

## Git status confirmed

Branch `int1-intelligence-platform`, HEAD `7bfad50c`. Pre-existing working-tree modifications recorded in
the snapshot above; none of them are opened by this session.

## What was delivered

`docs/implementation/house/HOUSE_COMPLETE.md`:

- **Five rooms**, each across the seven required faces (emotional purpose · architectural identity · interior
  language · neighbours · desktop · tablet · mobile · permanent rules): the Family Table (§ 3), the Garden
  Room (§ 4), the Tasting Bench (§ 5), the Family Journal (§ 6), the Mirror (§ 7).
- **60 permanent design rules** (T1–T12 · G1–G12 · B1–B12 · J1–J12 · M1–M12) — **none new**; each the
  room-specific face of an owned rule, cited so it never becomes a second owner.
- **The Companion as a presence, not a room** (§ 8), including why there is no Support Hub in this house:
  *help never relocates the household.*
- **1. The Complete House Blueprint** (§ 9) — eight rooms stated once, the exposure gradient E3→E0 read as
  the house's whole argument, what keeps it one house, and the one deliberate move per room.
- **2. The Walking Journey** (§ 10) — arrival to reflection, walked as one continuous building.
- **3. The House Constitution** (§ 11) — seventeen articles, including **Article XVI, the Admission Test**:
  the nine questions a new room must answer in writing before it is built.
- **4. Production recommendations** (§ 12) — sequencing, the live-product distance, four named dependencies,
  what to build first in each room, the regressions to refuse, the governance gates.

## Findings worth carrying forward

1. **`dialog.tsx:48` hardcodes `url('/orchard-bg.webp')`**, bypassing the canonical owner — so every dialog
   in all five rooms puts the orchard behind dense working text. **One line, five rooms, Article III.** The
   cheapest correctness win in the programme. (Four sibling bypasses remain, self-reported unfixed in
   `orchard-backdrop.tsx`'s own header. The global mount `PLAN1` § 11.2 found is already gone.)
2. **Two signature Living Details have no data source today** — *the sun on today* (`PLAN1` § 11.4: no date
   column on `planner_weeks`/`planner_days`) and *freshness, honestly told* (HOUSE6). Both are recorded as
   **absent, never faked**, per Article VII (*data-borne or dead*).
3. **The Diary is `userId notNull` with no household column** (`schema.ts:1314-1337`) — so the mission's
   *"Family Journal"* names a room the platform does not have. **This design takes the platform's side:** the
   window seat *should* be personal. The real defect is the one-way seam — a household-scoped plan
   (`planner_weeks.householdId`) flowing into a user-private diary via `sourcePlannerEntryId`.
4. **The Family Journal is today a three-column dashboard** of metric tiles and charts, where the Blueprint
   asks for *the most air in the house* — the largest distance in the house between what exists and what is
   designed. It also renders Profile's own components, so two rooms own one fact.
5. **`profile-page.tsx:316,330` renders `realm="diary"`** on its error and loading paths — the Mirror changes
   identity when it fails to load.
6. **The Tasting Bench and the Family Journal have never been designed** — no blueprint of any kind existed
   for either before this document.

## Honest limitation

The three locked rooms each shipped with **rendered concepts** (headless captures at three breakpoints with
programmatic collision checks) — design judged rather than asserted. **This document has none.** The five
rooms' responsive designs are specified but not rendered or verified, and § 12.3.4's checks are prescribed
rather than run. Recorded in § 14 of the deliverable rather than hidden.

## Next action

**Render the five rooms** at desktop 1440 · tablet 834 · mobile 390, on the Chromium recipe the three prior
sessions recorded (curated nix library set excluding glibc's own libraries and libcrypto/libssl/libz; apple
mask inlined as a data-URI), with per-room mechanical checks per § 12.3.4. Until then these five rooms are
held to a lower standard of proof than the three they join.
