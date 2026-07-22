# LH2 — First Seasonal Collection

**Workstream:** LH2 — First Seasonal Collection · **Stage 2 of the Living Home First Experience programme** (LH1 → LH2 → LH3)
**Date:** 2026-07-22 · **Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Governing parents:** `LIVINGHOME2` (ED1–ED12; § 5 the year's turns; § 5.1; § 6; § 7.2) · `LHDC1` · `HOMEOWNER1` · `EXP3`
**Programme rollback identifier:** `rollback/LH-living-home-first-experience-20260722` → `03a51d25`

---

## 0. What LH2 did, in one paragraph

LH2 admitted the **first seasonal collection** — five season-keyed Environmental Dressing objects — so the home now turns quietly with the year on the browsing sills: **spring flowers**, **subtle summer fruit**, **autumn small pumpkins** and a **folded blanket**, and **winter evergreens**. It added a one-object-per-room resolver (`resolveRoomDressing`) and a per-object room allow-list (`onlyRooms`) so each room's sill holds exactly one object — a season-specific item when the season has one, else the year-round bowl of apples (LH1). One morning, one house, zero animation, zero interaction, no household inference: every object is claim-free, still, wordless, and admitted one at a time against LHDC1 with its own admission evidence and recorded Home Owner approval.

**The year on the three browsing sills (Cookbook · Diary · Orchard):**

| Season | Cookbook | Diary | Orchard |
|---|---|---|---|
| **Spring** | flowers | flowers | flowers |
| **Summer** | summer fruit | summer fruit | summer fruit |
| **Autumn** | apples (year-round) | folded blanket | small pumpkins |
| **Winter** | evergreens | evergreens | evergreens |

Pantry/Larder and Nutrition show nothing (§5.1 produce; §17 advice); the working rooms (Planner, Shopping, Analyser, Household) and Admin have no view and gain nothing; Home keeps its greeting.

**Files changed:** 5 new SVG assets under `client/src/assets/living-home/dressing/`; `dressing-register.ts` (5 items + `onlyRooms` on `PlacementSpec` + `resolveRoomDressing` + recomputed register checksum); `dressing-layer.tsx` (5 asset imports + one-per-room render); `verify-living-home-assets.ts` (D6 respects `onlyRooms`, verifies each item wins a sill and no sill holds two season-specific objects); 5 new admission docs; adoption register concern text; this report + session records.

## 1. The wreath conflict (Architecture Bootstrap)

The brief's winter *"evergreen wreath"* collided with the canon: **a wreath is celebration dressing** (LIVINGHOME2 §5/§8/§7.2/ED9 — declared-and-permitted only, Phase 5), and Phase 5's mechanism (the traditions domain + §7.2 dressing permission) **does not exist**; §6 refuses any occasion marker shown without declaration. Admitting a wreath now would breach those rules and be an exception-by-instruction (HOMEOWNER1 forbids). **Resolution:** the winter object is admitted as claim-free **winter evergreen foliage (not a wreath)** — lawful *seasonal* dressing — and the wreath is **deferred to Phase 5**. Recorded in full in `winter-evergreens.admission.md` §0.

## 2. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — one Dressing register, one mouth, one admission standard,
  one Home Owner. Each object one hand with the register's first (the bowl of apples).
☑ One owner per fact — LAW LIVINGHOME2's; LOOK judged by LHDC1 (values cited, never
  re-owned); WHEN Domain 11's (season consumed, never derived, HT17). The strength
  ceiling is the one token (index.css). No occasion binding (winter is seasonal, §1).
☑ No duplicate entities — five items + one resolver + one placement field; no second
  register, orchard, or rival owner. resolveRoomDressing is a selector over the one
  register, not a second source of truth.
☑ No duplicate ownership — the dressing subdir stays scoped out of the Life checks.
☑ No duplicate state — pure, clock-free resolvers; the register turns only between
  checksummed states (ED6, no scheduler — HT14).
☑ Extends existing architecture — LIVINGHOME2's "the year's turns" (§5), admitted one
  at a time exactly as ED10 requires; onlyRooms/resolveRoomDressing extend the runtime.
☑ Progressive enrichment — five objects, each its own admission doc and approval; no
  batch (ED10). Each object refused in the rooms where it would read as data/advice.
☑ Knowledge domain compliance — visual-appearance only; no capability/route/claim.
☑ Honest gaps over fabricated information — claim-free (ED3); never covers absence
  (§6/§13); the empty-house test (Life register) untouched.
☑ No permanent synchronisation bridge — season resolves on read; checksums are CI.
☑ Evolution over replacement — nothing retired; the wreath is deferred, not forged
  into a seasonal object (§1; the §9.10 forgery refused).
```

**Experience Constitution Check:** HOSPITALITY (the year's quiet welcome) ✅ · OUTCOME (the household feels at home as the year turns) ✅ · WEIGHT (one object per sill, below the emphasis budget, no layout shift) ✅ · VOICE (wordless; refused in Nutrition so it never advises) ✅ · OWNERSHIP (observes like a window) ✅ · AGENCY (depends on no household fact) ✅ · RESTRAINT (one per room, one morning, still) ✅ · LAYER (originates no law) ✅.

## 3. AI Architecture Compliance

```
No AI surface, capability, prompt, Context View, or Companion behaviour created,
altered, or consumed. Dressing is beneath words (ED12); the Companion neither knows
nor narrates it; season is consumed from Domain 11, never reasoned. No capability
registered, none consumed.
```

## 4. Definition of Done

- **Success:** five season-keyed objects render one-per-sill in the browsing rooms across the four seasons (table §0); each admitted against LHDC1 with its own admission doc and recorded Home Owner approval; the wreath conflict resolved and recorded; checksums recomputed in the same commit; `verify:living-home-assets` green with every item a live gate; committed with the hash reported. **Met.**
- **What must not break:** the House register, the Life register, the one-season/one-morning laws, the shell, and Stage 1's bowl of apples (still renders as the year-round base) — all intact. Confirmed by the diff and the green verifier.
- **Manual test steps:** `verify:living-home-assets` 13/13; `build` exit 0 with all six assets shipping (the bowl as a file, the five smaller SVGs inlined as data URIs — confirmed in the bundle); `typecheck` 88 pre-existing / 0 in touched files; `adoption:check` 103·0·9.
- **Product Registry impact:** a visual-appearance change to the environment band of the three browsing rooms (now seasonal). No new surface, capability, route, or claim.

## 5. Data Impact

- **Reads existing data:** **No household data.** The mouth reads only the pure resolver's output (room + season); season is consumed from Domain 11's owner, never derived, never inferred from the household.
- **Writes new data:** **Environmental Dressing register entries only** (five items in a code/CI artefact). No household data, schema, or migration.
- **Changes meaning of existing data:** **None.**
- **Backfill:** **None** — inference is forbidden by construction (ED2).

## 6. Trust Check

- **Could this mislead the user?** No. Every object carries zero information (ED3/ED4), is `aria-hidden` and wordless, and depends on no household fact. Produce (fruit, pumpkins) is refused in the food-data rooms; nothing could read as *your* stock or as dietary advice. The winter object is seasonal foliage, not an assumed-Christmas wreath (§1).
- **Could this fabricate certainty?** No. Nothing is asserted; the Life register's honesty is untouched and outranks dressing; nothing covers absence.
- **Is anything guessed but shown as real?** No. No household inference; season is the calendar's, consumed from Domain 11.
- **What happens if the system is wrong?** At worst a mistimed object — traceable to one registered item, one admission document, one recorded Home Owner decision; corrected in one place, claiming nothing.
- **No architectural duplication:** YES. **No new source of truth:** YES. **No runtime behaviour altered** beyond one still image per browsing sill, turning with the season: YES.

## 7. Rollback Plan

- **Programme rollback tag:** `03a51d25`. **This stage is independently rollbackable** at the LH2 commit (recorded in the session file/dashboard). Reverting the LH2 commit returns the register to LH1's single item (the bowl of apples), removes the five assets/items and the resolver, and the verifier reads the smaller register and passes. No data to unwind (the register turns only between checksummed states).
- **To revert LH2 only:** `git revert <LH2 commit>` (or checkout the files from `<LH2 commit>^`). LH1 (Stage 1) is untouched and remains live.

## 8. Scope Lock

- **Implemented scope:** exactly the five objects the brief names (spring flowers, summer fruit, autumn pumpkins + folded blanket, winter evergreens — the wreath admitted in its lawful seasonal-evergreen form, §1); the `onlyRooms` field; the `resolveRoomDressing` resolver; five assets; five admission docs; the verifier updates; the register entries; this report and session records.
- **Explicitly excluded:** any celebration/occasion dressing (the wreath deferred to Phase 5); any object beyond the five; any change to the House register, the orchard, the one-season/one-morning laws, the shell's structure, navigation, or any governing rule; any household data, Companion behaviour, capability, route, schema, or business logic; a scheduler (season resolves on read).
- **Decisions recorded, not silently taken:** the wreath refusal + deferral (§1; `winter-evergreens.admission.md` §0); the per-room single-slot rule (restraint, ED7); the produce/advice refusals per object.

## 9. Manual Verification

1. The programme rollback tag (`03a51d25`) was created before Stage 1; no new tag is needed for Stage 2 (the stage is rollbackable at its own commit).
2. Each object was authored against LHDC1 and its admission evidence recorded (§21) before it entered the register; the wreath conflict was surfaced and resolved through the governing documents (§1), not around them.
3. Checksums: each item checksum = sha256 of its asset bytes; the register checksum = sha256 over `canonicalizeItems(items)` for all six items — recomputed in the admitting commit and independently re-hashed by the verifier (D8 per asset, D1 for the register).
4. `npm run verify:living-home-assets` → **13/13 PASS**, including the strengthened D6: every item resolves where it should, is refused where §5.1/`onlyRooms` requires, **wins one sill somewhere** (no item is authored-but-shadowed), and **no sill ever holds two season-specific objects**.
5. `npm run typecheck` → **88** pre-existing server errors; **0** in `dressing-register.ts`, `dressing-layer.tsx`, or `app-shell.tsx`.
6. `npm run build` → **exit 0**; all six assets ship (the bowl emitted as a file, the five smaller SVGs inlined as data URIs — verified present in the client bundle).
7. `npm run adoption:check` → **103 pass · 0 notice · 9 baseline fail** (unchanged baseline; the dressing concern passes).
8. **No live walk-through** (non-interactive). The seasonal geometry, per-room placement, palette, and light are type-, standard-, and checksum-decidable; the visual with-and-without across seasons and rooms is staged for the Home Owner's walk-through (each admission doc §8 is explicit).

## 10. User Acceptance Evidence

- **State: Waiting for User (Home Owner walk-through).** The Home Owner's approval of each object (including the illustrated medium and the wreath resolution) is recorded in the five admission documents. Remaining acceptance is the visual confirmation on the running product across the seasons: on a spring visit, flowers on the browsing sills; in autumn, apples in the Cookbook window, a folded blanket on the Diary's window seat, pumpkins in the Orchard window; and Pantry/Nutrition/working rooms/Home unchanged throughout.
- **Evidence for review:** the five admission documents (LHDC1 §21, with §18 with-and-without and §19 clearance); this report; the green verifier output; the built bundle carrying all six assets.
- **The one thing staged for the eye:** the resting position and scale of each object on its sill, and whether the three browsing rooms should each show the same object in spring/summer/winter or be further distributed (as autumn already is) — the Home Owner's judgement on the running product, recorded here rather than assumed. LH3 (the refinement pass) is where that judgement is applied.

---

*The house holds still; the life moves; and between them the home now turns quietly with the year — flowers in spring, the season's fruit in summer, apples and a blanket and pumpkins in autumn, evergreens through the winter — one object on each sill, one morning in every room, claiming nothing, meaning only: you are welcome here, in every season of the year.*
