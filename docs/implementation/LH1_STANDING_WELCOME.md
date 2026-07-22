# LH1 — Standing Welcome

**Workstream:** LH1 — Standing Welcome · **Stage 1 of the Living Home First Experience programme** (LH1 → LH2 → LH3)
**Date:** 2026-07-22 · **Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Governing parents:** `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (`LIVINGHOME2`, ED1–ED12; Phase 3) · `LIVING_HOME_DESIGN_CONSTITUTION.md` (`LHDC1`) · `HOME_OWNER_ARCHITECTURE.md` (`HOMEOWNER1`) · `EXP3_LIVING_HOME_ASSET_SYSTEM.md`
**Programme rollback identifier:** `rollback/LH-living-home-first-experience-20260722` → `03a51d25` (annotated tag; created **before any work**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat + the new run file, not covered)

---

## 0. What LH1 did, in one paragraph

LH1 admitted the **first visible Environmental Dressing object** — the **Standing Welcome, a bowl of apples**, year-round — and built the DOM mouth that paints it. Through ED1 → ED2 → ED3/LHDC1 the layer had law, an empty runtime, and a visual admission standard, but no admitted object and no mouth. LH1 closes that: it authored one still, matte, hand-drawn asset in the house's palette; registered one item with its checksums recomputed in the same commit; built `dressing-layer.tsx` (the one mouth) and mounted it into the shell's room threshold at E2; recorded the full LHDC1 § 21 admission evidence with the Home Owner's approval; and extended the verifier so the item is a live gate. The home now quietly keeps a bowl of apples on the sill of the browsing rooms — claiming nothing, meaning welcome.

**Files changed:**
- `client/src/assets/living-home/dressing/standing-welcome-bowl-of-apples.svg` (new — the still asset)
- `client/src/lib/living-home/dressing-register.ts` (the one admitted item + recomputed checksums; header updated)
- `client/src/components/layout/dressing-layer.tsx` (new — the DOM mouth)
- `client/src/components/layout/app-shell.tsx` (mounts the mouth in `RoomThreshold`, E2 branch)
- `client/src/index.css` (`--dressing-strength` token, both modes)
- `scripts/ci/verify-living-home-assets.ts` (verifier: dressing subdir scoping, D6 runtime assertion, D7 alias-safe needle, D8 asset byte-lock)
- `docs/implementation/assets/dressing/standing-welcome-bowl-of-apples.admission.md` (new — the admission evidence)
- `docs/implementation/ux/adoption-register.json` + `.md` (remove adopted orphan; add the mouth + token concerns)
- `docs/implementation/LH1_STANDING_WELCOME.md` (this report) + session records

---

## 1. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity
  One home, one orchard, one Companion untouched. One Dressing register (ED2), one
  mouth (dressing-layer.tsx), one admission standard (LHDC1), one Home Owner approval.
☑ One owner per fact
  The item's LAW is LIVINGHOME2's; its LOOK is judged by LHDC1 (values cited, never
  re-owned — colour/token UIA, feeling EXPLANG, materials/light Blueprint/OHDB/
  TRANSLATION1); WHEN it turns is Domain 11's (season consumed, never derived, HT17);
  WHETHER an occasion may dress is the traditions domain's (not used — this is a
  seasonal/standing item, no celebration binding). The mouth owns rendering; the token
  owns the strength ceiling (index.css, UIA §16).
☑ No duplicate entities
  Extends the ED2 runtime; the mouth is the consumer ED2/EXP3 §7.1 declared and
  deferred. No second register, no second orchard, no rival owner.
☑ No duplicate ownership
  The dressing subdir is a third register with its own single-mouth (D7) and byte-lock
  (D8) gates, scoped OUT of the Life orphan/mouth checks so neither register judges the
  other.
☑ No duplicate state
  The resolver is pure and clock-free; nothing derived is stored; the register turns
  only between reviewed, checksummed states (ED6, no scheduler — HT14).
☑ Extends existing architecture
  LIVINGHOME2 Phase 3, exactly as ED2/ED3 recommend; the mouth lands WITH its first
  consumer (EXP3 §7.1 / UIA §17), never before.
☑ Progressive enrichment where appropriate
  Exactly ONE object admitted; the year turns by admitting further items one at a time
  (LH2), never a batch (ED10). Refused in the rooms where it would read as data/advice.
☑ Knowledge domain compliance
  No knowledge domain touched. Product Registry: a visual-appearance-only change to the
  environment band of three rooms; no capability, page, route, or claim added.
☑ Honest gaps over fabricated information
  The object is claim-free (ED3); it never covers honest absence (§6/§13); the empty-
  house test is untouched (it binds the Life register, not this one). Where the mouth
  cannot resolve an asset it paints nothing, never a broken image.
☑ No permanent synchronisation bridge
  None. Season resolves on read; checksums are CI-time verification, not sync.
☑ Evolution over replacement
  Nothing retired. The empty-register checksum is kept in a comment for traceability of
  the byte the register turned from.
```

**Experience Constitution Check (§18.2, before design):**
- **HOSPITALITY** — the object's sole purpose is the home's quiet welcome, felt not performed (ED8, LHDC1 §3). ✅
- **OUTCOME** — *the household feels at home*: warmth around their true life, claiming nothing. ✅
- **WEIGHT (GEA2)** — no interface weight added: it composes inside an already-committed region, below the emphasis budget, `aria-hidden`, no layout shift; E1/E0 gain nothing. ✅
- **VOICE (GEA8)** — it never speaks; wordless, no status, no coaching (that is why it is refused in Nutrition). ✅
- **OWNERSHIP (GEA21/22)** — it observes like a window: it shows what is there and has no view about it; interpretation stays the Companion's. ✅
- **AGENCY (GEA23)** — nothing decides for the household; the object depends on no household fact. ✅
- **RESTRAINT (GEA11/13/15)** — one object, matte, in the gutter, quiet under repetition. ✅
- **LAYER (GEA20)** — an implementation under LIVINGHOME2/LHDC1; it originates no law. ✅

**Blueprint Checks (§15.2):** one home ✅ · a room not a theme (composes in the committed band, no new architecture) ✅ · the map respected (E2 exposure honoured; renders only where the house commits a view) ✅ · orchard law (the object is on the sill, not on the orchard; the orchard keeps its one season) ✅ · one morning (light upper-left, agreeing shadow) ✅ · material honesty ✅ · the walls untouched (shell byte-identical apart from the one added mount) ✅.

## 2. AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ No AI surface, capability, prompt, Context View, or Companion behaviour created,
  altered, or consumed. Dressing is beneath words (ED12): it never enters a prompt or
  Context View, and the Companion neither knows nor narrates it. INT17's ownership of
  every byte the model reads is untouched.
✓ No capability registered, none consumed. No conversation state. Nothing here
  observes, interprets, decides, or speaks.
```

## 3. Definition of Done

- **Success looks like:** one admitted Environmental Dressing object (the Standing Welcome bowl of apples) renders on the sill of the E2 window band in Cookbook, Diary and the Orchard room; refused (never rendered) in Pantry/Larder and Nutrition, and everywhere with no view; the mouth is built and mounted; the admission evidence (LHDC1 §21) is recorded with Home Owner approval; checksums recomputed in the same commit; `verify:living-home-assets` green with the item as a live gate; committed with the hash reported. **Met.**
- **What must not break:** the House register (byte-locked, unchanged), the Life register (empty, unchanged), the one-season/one-morning laws, the shell, and every cited owner — all byte-untouched apart from the single `DressingLayer` mount in `RoomThreshold` and the additive token. Confirmed by the diff and the green verifier.
- **Manual test steps:** `npm run verify:living-home-assets` → 13/13 PASS; `npm run build` → exit 0 with the SVG emitted to `dist/public/assets/`; `npm run typecheck` → 88 pre-existing server errors, 0 in any touched file; `npm run adoption:check` → 103 pass / 0 notice / 9 baseline fail (no new fail).
- **Product Registry impact:** a visual-appearance change to the environment band of three rooms (Cookbook, Diary, Orchard). No new surface, capability, route, or claim; the environment band's product-knowledge entry (if any) gains the note that a claim-free standing-welcome object may render on its sill.

## 4. Data Impact

- **Reads existing data:** **No household data.** The mouth reads only the pure resolver's output (room id + season). Season is consumed from Domain 11's owner (`seasonOfLocalDate`, the transitional client adapter), never derived.
- **Writes new data:** **Environmental Dressing register entry only** — one item in a code/CI artefact (`dressing-register.ts`). No household data, no schema, no migration, no store.
- **Changes meaning of existing data:** **None.**
- **Backfill:** **None** — and the layer forbids inference by construction (ED2), so there is nothing a backfill could compute.

## 5. Trust Check

- **Could this mislead the user?** No. The object carries zero information (ED3/ED4), so it has nothing to be wrong about; it is `aria-hidden`, wordless, and removing it loses no capability or state. The one genuine mislead-risk — a dressing object read as household data or advice — is closed structurally: it is refused in Pantry/Larder (§5.1 produce) and Nutrition (§17, could read as dietary advice), and it renders at an illustrative, non-specific fidelity no household could read as *their* particular fruit.
- **Could this fabricate certainty?** No. It asserts nothing; Household Life's honesty laws are untouched and outrank it; it never covers honest absence (§6/§13).
- **Is anything guessed but shown as real?** No. Nothing is inferred; the object depends on no household fact and no occasion.
- **What happens if the system is wrong?** At worst a mistimed or mis-judged object — traceable to one registered item, one admission document, and one recorded Home Owner decision, corrected in one place, having claimed nothing about anyone.
- **No architectural duplication introduced:** YES. **No new source of truth created:** YES (the register classifies; owners own). **No runtime behaviour altered** beyond adding one still, decorative image to the E2 threshold band: YES.

## 6. Rollback Plan

- **Programme rollback identifier:** `rollback/LH-living-home-first-experience-20260722` → `03a51d25` (annotated tag, created before any work).
- **This stage is independently rollbackable** at its own commit (the LH1 commit hash, recorded in the session file and dashboard). Because the register turns only between checksummed states, reverting the LH1 commit returns the register to empty and the mouth to unmounted, with no data to unwind.
- **To revert LH1 only:** `git revert <LH1 commit>` (or `git checkout <LH1 commit>^ -- <the files above>`). The verifier will then read an empty register and pass with the empty-register wording; the mouth and asset are removed from the bundle; the token and adoption entries are reverted with the same commit.
- **Verification after rollback:** `npm run verify:living-home-assets` green (empty register); `git diff` empty against the pre-LH1 state; no runtime surface renders any dressing.

## 7. Scope Lock

- **Implemented scope:** exactly one admitted object (the Standing Welcome bowl of apples); the mouth; its mount; one strength token; the admission document; the verifier updates; the register entries; this report and the session records.
- **Explicitly excluded (byte-absent from the diff except where named):** every OTHER object (flowers, blankets, mugs, pumpkins, books, wreaths, candles — none created or registered); every seasonal state beyond `year-round`; any celebration/occasion dressing; any change to the House register, the orchard asset, the one-season/one-morning laws, the shell's structure, navigation, or any governing document's rules; any household data, Companion behaviour, capability, route, schema, or business logic. **No other object may be implemented** (mission Scope Lock) — and none was.
- **Decisions recorded, not silently taken:** Home (E3) left undressed (its greeting is its ornament, EXP3 §5.2); Nutrition refused on legibility; the illustrated medium approved and recorded at first admission (EXP3 Verdict 3 / LHDC1 §8, §20).

## 8. Manual Verification

1. `git status` confirmed before work (clean apart from the session heartbeat); the annotated **programme** rollback tag was created and verified to resolve to `03a51d25` **before any file was written**.
2. All seven mandated inputs were read in full (README; LIVINGHOME2; LHDC1; EXP3 asset system; HOMEOWNER1; Blueprint; UI Architecture), plus the ED1/ED2/EXP3-Phase-2 run files to confirm the lineage and the four §10.2 owner amendments had already landed (ED1 `a9440761`).
3. Checksums were computed from the real bytes and recomputed after the item was written: item checksum = sha256 of the SVG (`d3e66b75…`); register checksum = sha256 over `canonicalizeItems(items)` (`75aef6f8…`), both set in the same commit. The verifier's D8 independently re-hashes the asset and D1 re-hashes the register.
4. `npm run verify:living-home-assets` → **13/13 PASS** (drift-tested implicitly: D8/D1 fail loudly if either checksum is stale).
5. `npm run typecheck` → **88** errors, all pre-existing server-side; **0** in `dressing-layer.tsx`, `dressing-register.ts`, or `app-shell.tsx`.
6. `npm run build` → **exit 0**; the client (Vite) build ran and emitted the asset to `dist/public/assets/standing-welcome-bowl-of-apples-<hash>.svg` — the `?url` import resolves and the asset ships.
7. `npm run adoption:check` → **103 pass · 0 notice · 9 fail** — the 9 fails are the pre-existing baseline (quantity-string, tone, and 7 unrelated orphans); the two new concerns (`environmental-dressing`, `dressing-strength`) pass; the `dressing-register.ts` orphan was retired cleanly (0 notices).
8. **No live walk-through** was performed (non-interactive session). The changes shipped are type-, standard-, and checksum-decidable; the visual with-and-without side-by-side in the three rooms is staged for the Home Owner's walk-through, in the manner of the prior Living Home passes (§9 of the admission document is explicit about this).

## 9. User Acceptance Evidence

- **State: Waiting for User (Home Owner walk-through).** The Home Owner's approval of the admission (including the illustrated medium, EXP3 Verdict 3) is recorded in the admission document (`docs/implementation/assets/dressing/standing-welcome-bowl-of-apples.admission.md` §10), granted through the LH1 directive. The remaining acceptance is the visual confirmation on the running product: walk `/cookbook`, `/my-diary`, and `/orchard` and confirm a quiet bowl of apples sits on the sill of the window band, reading as the home's warmth; confirm `/pantry` and `/nutrition` show none; confirm the working rooms (Planner, Shopping, etc.) and Home are unchanged.
- **Evidence for review:** the admission document (LHDC1 §21, with the with-and-without review §8 and rejection-criteria clearance §9); this report; the green verifier output; the built asset in `dist/public/assets/`.
- **The one thing staged for the eye:** the exact resting position and scale of the bowl on the sill, and whether it should also (later, as a separate admission) appear at Home — both are the Home Owner's judgement on the running product, recorded here rather than assumed.

---

*The house holds still; the life moves; and between them the home now keeps a bowl of apples on the sill — the first object admitted to the Living Home, warm and matte and claiming nothing, meaning only: you are welcome here.*
