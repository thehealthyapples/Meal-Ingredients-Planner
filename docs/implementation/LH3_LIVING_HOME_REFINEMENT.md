# LH3 — Living Home Review & Refinement

**Workstream:** LH3 — Living Home Review & Refinement · **Stage 3 (final) of the Living Home First Experience programme** (LH1 → LH2 → LH3)
**Date:** 2026-07-22 · **Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Verified against:** the **Living Home Design Constitution** (`LHDC1`) · the **Experience Constitution** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md`, GEA1–GEA23) · the **Home Owner Architecture** (`HOMEOWNER1`) · **`LIVINGHOME2`** (ED1–ED12)
**Programme rollback identifier:** `rollback/LH-living-home-first-experience-20260722` → `03a51d25`

---

## 0. What LH3 did, in one paragraph

LH3 reviewed the complete Living Home dressing layer that LH1 and LH2 built — every object, in every room, across the year — and refined it under one governing preference: **subtraction over addition** (mission; HOMEOWNER1 P2/P11). The one shipped change is a **restraint refinement**: the seasonal objects that had appeared on all three browsing sills at once (flowers, summer fruit, evergreens) are curated to **one signature room each**, so each room now has its own quiet seasonal character over the year and no object blankets every sill. The bowl of apples remains the ever-present base. Nothing was added; the layer's compliance with the four constitutions was audited room by room and confirmed; the genuinely eye-dependent calls (exact resting position, strength, and whether to widen a season back to more rooms) are recorded and staged for the Home Owner's walk-through rather than blind-tuned.

## 1. The audit — every room

The Living Home shell has no per-room files; rooms are the shell's realms, dressed by the one mouth (`dressing-layer.tsx`) into the committed E2 window band. The audit walks every realm.

| Room | Exposure | Dressing (after LH3) | Verdict |
|---|---|---|---|
| **Home** | E3 (own window) | **None** — deliberately | ✅ Correct. Home's ornament is its greeting (*"the greeting in THA's hand"*); its sill stays architecture (EXP3 §5.2). The standing welcome lives in the browsing rooms, not over the greeting. |
| **Cookbook** | E2 | apples (year-round); **summer fruit** in summer | ✅ The kitchen's fruit bowl, turning to the season's fruit in high summer. Reads as home warmth, never recipe data. |
| **Diary** | E2 | apples; **flowers** in spring; **folded blanket** in autumn | ✅ The window seat gains a gentle, personal seasonal touch — spring's flowers, autumn's comfort. |
| **Orchard/Community** | E2 | apples; **pumpkins** in autumn; **evergreens** in winter | ✅ The outward window follows the land — the harvest, then the enduring winter green. Coherent per-room story. |
| **Pantry / Larder** | E2 | **None** — refused | ✅ §5.1 produce law: a bowl of apples/fruit/pumpkins there would read as *your* stock. Enforced by `refusedRooms` + verifier D4/D6. |
| **Nutrition** | E2 | **None** — refused | ✅ §17 legibility: fruit in the diet room could read as dietary advice (GEA8, *rooms report, they do not counsel*). Refused. |
| **Planner** | E1 | **None** — no view | ✅ Zero-byte: the mouth renders only at E2; the working table gains nothing. |
| **Shopping** | E1 | **None** — no view | ✅ Zero-byte. |
| **Analyser** | E1 | **None** — no view | ✅ Zero-byte. |
| **Household/Profile** | E1 | **None** — no view | ✅ Zero-byte. |
| **Admin** | E0 | **None** — shuttered | ✅ Nothing, ever (GEA6). |
| **Companion** | presence | **None** | ✅ Not a room; the Companion never knows or narrates dressing (ED12). |

**The year, room by room (after LH3):** Cookbook — apples, summer fruit in summer. Diary — apples, flowers in spring, a blanket in autumn. Orchard — apples, pumpkins in autumn, evergreens in winter. The apples are the still point; each season adds one quiet touch to the room it belongs in.

## 2. The refinement (the one shipped change) — and the subtraction it makes

**Before (LH2):** in spring/summer/winter, the season's single object appeared on all three browsing sills at once (the same jug of flowers in Cookbook *and* Diary *and* Orchard). Autumn was already distributed (apples/blanket/pumpkins).

**After (LH3):** each seasonal object is placed in **one signature room** — flowers → Diary, summer fruit → Cookbook, evergreens → Orchard (pumpkins → Orchard and the blanket → Diary were already single-room). This is a **placement-only change** (`onlyRooms` narrowed on three items; the register checksum recomputed in the same commit); no object, asset, or line of render logic was added.

**Why it is an improvement, against the review dimensions:**
- **Restraint / subtraction (mission; ED7; LHDC1 §4):** fewer objects render per season (from up to three identical to one) — *"three well-chosen touches, not thirty"*, applied so that a single considered touch replaces a repeated motif.
- **Consistency / craftsmanship (LHDC1 §7, §14):** each room now reads as one home furnished over years, each with its own seasonal life, rather than every window wearing the same seasonal costume at once (which edged toward the *wallpaper* anti-pattern — *"everywhere at once is nowhere in particular"*, Blueprint §16).
- **Object hierarchy (mission):** the year-round bowl of apples is unambiguously the base / still point; the seasonal objects are clearly the accents, one per room.
- **Seasonal transitions (LHDC1 §15):** unchanged and correct — still discrete registered states, no animation; the change a household perceives is simply that, on a later visit, a different object is quietly set out in a room.

**Reversibility (why this is the safe direction):** subtraction is reversible — the Home Owner can widen any season back to more rooms on the running product with a one-line `onlyRooms` edit. Over-presence is harder to walk back once a household has seen it. Shipping the more restrained default honours *prefer subtraction* while leaving the balance open to the eye (§4).

## 3. Verification against the four constitutions

- **Living Home Design Constitution (LHDC1):** every object still satisfies §2's two lists (warm · calm · natural · crafted · lived-with · restrained · consistent; never glossy · synthetic · generic · promotional · themed · gamified · ornamental · stock · dashboard · fabricated). §4 restraint is *strengthened* by the refinement. §18 with-and-without and §19 rejection criteria hold for every object (recorded in each admission doc). §21 admission evidence complete for all six. ✅
- **Experience Constitution (GEA1–GEA23):** hospitality before productivity (GEA1) ✅; a quieter home, not a heavier one (GEA2 — the refinement removes renders) ✅; nothing designed to increase return (GEA3) ✅; rooms report, the Companion counsels (GEA8 — dressing does neither, and is refused in Nutrition so it never advises) ✅; no scoring/ranking/streak (GEA13) ✅; silence the default (GEA15 — the layer is beneath words) ✅; the rooms observe, the Companion understands, the household decides (GEA21–23 — dressing does none of the three) ✅. The Experience Constitution Check (§18.2) passes on every axis (see LH2 §2). ✅
- **Home Owner Architecture (HOMEOWNER1):** beauty is intentional and nothing unmeant ships (P2) ✅; hospitality before decoration (P3) ✅; calm never lifeless — the apples keep the home warm year-round while the seasons turn quietly (P4) ✅; consistency over novelty (P9) ✅; refinement is continuous and subtraction is as legitimate as addition (P11, the principle this stage embodies) ✅; the wreath was refused through the governing documents, never around them (LH2 §1) ✅. Approval is recorded in each admission doc; refusal needs no rule. ✅
- **LIVINGHOME2 (ED1–ED12):** belongs to the home not the household (ED1) ✅; never personalised/data-driven (ED2) ✅; never a claim (ED3 — refused where context could make it one) ✅; never competes with the data surfaces (ED4) ✅; the house's identity untouched (ED5 — the year enters as objects, never as weather) ✅; the year turns slowly, never the hour (ED6) ✅; quiet by construction — still, wordless, decorative-declared, below the budget, removable with a slight cooling (ED7) ✅; hospitality named for every object (ED8) ✅; celebration dressing only by the household's leave (ED9 — the wreath deferred to Phase 5) ✅; admitted one at a time, registered, never a batch (ED10) ✅; never a channel (ED11) ✅; beneath words (ED12) ✅. ✅

## 4. Audited, recorded, and staged for the Home Owner's eye (not blind-tuned)

Per HOMEOWNER1 P11 (*a change that does not strengthen the feeling of home is noise*) and the discipline of the prior Living Home passes, the following were reviewed and **deliberately not changed blind** — each is a genuine feel/visual-judgement call that needs the running product:

1. **Strength ceiling (`--dressing-strength` 0.92 light / 0.78 dark).** Reviewed against LHDC1 §4 (*never the loudest thing*). A dressing object is a real object on the sill, so it reads solid; 0.92 is present-but-settled. Softening it blind risks a ghostly object. **Staged** for the walk-through.
2. **Resting position and scale** (bottom-right gutter, `clamp(84px,11vw,128px)`). Chosen to sit opposite the left-aligned room title (EXP3 §5.3) so type and warmth never contest space. The exact pixel resting point on each sill is an eye call. **Staged.**
3. **Whether to widen a season back to two rooms** (e.g., flowers in Diary *and* Orchard). The refinement chose one-signature-per-room as the restrained default; the Home Owner may prefer a little more spring. A one-line `onlyRooms` edit, recorded as the Home Owner's to make on the running product. **Staged, with the recommendation to keep the restrained default unless a season feels absent.**
4. **Shading-technique consistency** — the bowl of apples uses soft radial form-shading; the later objects use flat fills with soft highlight ellipses. Both are matte and in one palette (one hand at the level LHDC1 §8 requires); harmonising the *technique* is a craft refinement best judged by eye against the running set. **Staged**, within one-hand tolerance for now.

Nothing was **removed** beyond the render-reduction the refinement achieves, because nothing in the layer is unnecessary: each of the six objects is now a single considered signature, and the runtime, token, mouth, and verifier are each the one owner of their concern.

## 5. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — one register, one mouth, one token, one standard, one owner.
☑ One owner per fact — LAW LIVINGHOME2's; LOOK LHDC1's (values cited); WHEN Domain 11's.
  The refinement moves no ownership — it edits placement data on three items.
☑ No duplicate entities — nothing created; the change is subtractive (fewer renders).
☑ No duplicate ownership — the dressing subdir stays scoped out of the Life checks.
☑ No duplicate state — pure resolvers; the register turns only between checksummed states.
☑ Extends existing architecture — a curation of LH2's placements; adds no rule.
☑ Progressive enrichment — nothing added; each object remains a separately-approved act.
☑ Knowledge domain compliance — visual-appearance only; no capability/route/claim.
☑ Honest gaps over fabricated information — claim-free; never covers absence.
☑ No permanent synchronisation bridge — season resolves on read; checksums are CI.
☑ Evolution over replacement — nothing retired; the refinement is reversible by data.
```

## 6. AI Architecture Compliance

```
No AI surface, capability, prompt, Context View, or Companion behaviour created,
altered, or consumed. Dressing remains beneath words (ED12). No capability registered,
none consumed.
```

## 7. Definition of Done · Data Impact · Trust Check

- **Definition of Done:** the complete Living Home reviewed room by room; the one restraint refinement shipped; the four constitutions verified; nothing unnecessary retained; verifier/build/typecheck green; committed with the hash reported. **Met.**
- **Data Impact:** reads **no household data**; writes **Environmental Dressing register entries only** (three items' placement data changed); changes the meaning of **no** existing data; requires **no** backfill.
- **Trust Check:** no runtime claim; the refinement *reduces* on-screen dressing; every object remains claim-free (ED3), refused where it could read as data/advice; the Life register's honesty is untouched and outranks dressing. No architectural duplication; no new source of truth; no runtime behaviour altered beyond fewer still images rendering per season.

## 8. Rollback Plan · Scope Lock

- **Rollback:** programme tag `03a51d25`; this stage is rollbackable at the LH3 commit. `git revert <LH3 commit>` returns the placements to LH2's distribution (all three sills per season); LH1 and LH2 remain live. No data to unwind.
- **Scope Lock — implemented:** the one placement refinement (three `onlyRooms` narrowed) + the register checksum recompute + this review report + session records. **Excluded:** any new object, asset, token, or render logic; any change to the House register, the orchard, the one-season/one-morning laws, the shell, navigation, or any governing rule; any household data, Companion behaviour, capability, schema, or business logic; and every eye-dependent tuning of §4 (staged, not taken).

## 9. Manual Verification · User Acceptance Evidence

- **Manual Verification:** `npm run verify:living-home-assets` → **13/13 PASS** (the strengthened D6 confirms each object resolves where it should, is refused where §5.1/`onlyRooms` requires, wins one sill somewhere, and no sill holds two season-specific objects); `npm run typecheck` → **88** pre-existing / **0** in touched files; `npm run build` → **exit 0** (all six assets ship); `npm run adoption:check` → **103·0·9** (baseline). No live walk-through (non-interactive); the shipped change is placement data, type- and checksum-decidable; the feel calls are staged (§4).
- **User Acceptance Evidence — Waiting for User (Home Owner walk-through).** The Home Owner's approval of each object is recorded in its admission document; the LH3 refinement is a curation the Home Owner confirms on the running product across the seasons. **Recommended walk-through:** spring → flowers on the Diary window seat; summer → the season's fruit in the Cookbook window; autumn → a folded blanket (Diary) and small pumpkins (Orchard); winter → evergreens in the Orchard window; the bowl of apples everywhere else in the browsing rooms; Pantry/Nutrition/working rooms/Home unchanged. If a season feels too quiet, widening it back to a second room is a one-line, recorded Home Owner edit (§4.3).

---

*The house holds still; the life moves; and between them the home is quietly alive — a bowl of apples always on the sill, and, room by room, the year set out one gentle touch at a time: flowers on the window seat in spring, the season's fruit by the recipe book in summer, a blanket and the harvest in autumn, the enduring green through the winter. Warm, calm, natural, crafted, lived-with, restrained — asking nothing, claiming nothing, meaning only: you are welcome here, in every season of the year.*
