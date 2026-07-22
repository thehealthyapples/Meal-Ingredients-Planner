# Admission — Standing Welcome (a bowl of apples)

**Object id:** `standing-welcome-bowl-of-apples`
**Register:** Environmental Dressing (LIVINGHOME2 § 10.3) · **Workstream:** LH1 — Standing Welcome (LIVINGHOME2 Phase 3)
**Admitted against:** the **Living Home Design Constitution** (`LHDC1`) — the object-level visual/material admission standard — and **LIVINGHOME2** (ED1–ED12, § 4.3, § 5, § 5.1).
**Asset:** `client/src/assets/living-home/dressing/standing-welcome-bowl-of-apples.svg`
**Date:** 2026-07-22 · **Home Owner:** Colin Clapson

> This is the admission evidence LHDC1 § 21 requires for every dressing object. Without it the object is not admitted; `verify:living-home-assets` (`dressingChecks` D5) resolves the item's `admissionDocId` against this file, and D8 byte-locks the asset to the item's recorded checksum.

---

## 1. Identity (LHDC1 § 21.1)

- **Register row:** `STANDING_WELCOME_BOWL_OF_APPLES` in `client/src/lib/living-home/dressing-register.ts`.
- **Season key (Domain 11):** `year-round` — the standing welcome, present in every season (LIVINGHOME2 § 5).
- **Celebration binding:** none. This is not a § 7.2 celebration item; it depends on no household declaration or permission.
- **Item checksum (asset bytes, sha256):** `d3e66b7514971aee71567f3e348ce72c08de73c1aa118975105cf408b4ee4243`.
- **Register checksum (sha256 over the items array):** `75aef6f8d8f9f140747bf2127c51fe0e0a9040d6a5ce102ab2560dc54f17c1fc` — recomputed in the same commit that admits the item (LHDC1 § 21.11).

## 2. Named hospitality purpose (LHDC1 § 21.2 · ED8 · § 3)

**The home's standing welcome.** A bowl of the house's own apples, set out on the windowsill, so a household arriving tired at the end of a day finds the home already warm — the way a real home is warm before its family walks in. It is offered to everyone alike, in every season, and it asks and claims nothing about anyone. *"It looks nice"* is not the purpose; the purpose is **welcome**, the first of ED8's four (welcome / comfort / care / the year's passage). The subtraction test (§ 3): with the bowl gone, the sill is bare architecture and the room is a shade cooler at the threshold; with it present, the household is quietly received.

## 3. Material and craft statement (LHDC1 § 21.3 · § 5 · § 6 · § 7 · § 11)

- **Materials — only the house's own** (§ 5): a **hand-thrown ceramic bowl** (the house's handmade-ceramics material — `TRANSLATION1` § 4) holding **the house's own apples** (LIVINGHOME2 § 5 names the apple *"a material of this house and the canonical reference object"*). No new material vocabulary; no glass, chrome, plastic, or machined form.
- **Texture — matte, never glossy** (§ 6): every surface is low-sheen. Roundness comes from gentle, low-contrast form-shading (light and material), **never** from a specular highlight, wet look, or mirror finish. No decorative pattern applied on top.
- **Craft — hand-made, not manufactured** (§ 7): the bowl reads as thrown (an off-round rim, one quiet throw-mark), the fruit as gathered by hand — evidence of care, never a display of rendering skill or a catalogue product.
- **Patina — lived-with, not new** (§ 11): softened edges and a warm, worn surface — cared-for and used, never showroom-fresh, never distressed or spoiled. Fixed within the registered state (it does not age over time).

## 4. Medium conformance (LHDC1 § 21.4 · § 8 · EXP3 Verdict 3)

- **Medium chosen: the illustrated track** — a single, still SVG illustration, in the house's own hand. LHDC1 § 8 / EXP3 Verdict 3 make the illustrated track lawful **only with the Home Owner's approval recorded at the first admission that uses it**; that approval is recorded in § 10 below. Existing-media (photography/type/tokens) was the default, but the house holds no honest photograph of its own bowl of apples, and a stock photograph is refused by § 8; a drawn object in the house's hand is the truthful medium for a claim-free hospitality object.
- **Quality standard met** (§ 8, binding on either medium): **not stock-photographic** (it is not a photo, and carries no staged/promotional tone); **not cartoon / not gamified** (muted, low-saturation, no flat high-saturation character styling, no outline-sticker look); **never a claim** (it renders at an illustrative, non-specific fidelity a household could not read as *their* particular fruit — ED3); **one coherent hand** — drawn in the same Calm Orchard palette and the same one-morning light as the orchard backdrop and the (future) Living Details, so the register reads as one house.
- **Colour values baked into the asset** in the NORTH2 manner (a byte-locked, checksummed asset — not raw colour in a surface): every tone is drawn from the house's owned palette (§ 5 below), so the asset introduces no new colour vocabulary (LHDC1 § 10; UIA owns the values).

## 5. Scale, colour and lighting conformance (LHDC1 § 21.5 · § 9 · § 10 · § 12)

- **Scale (§ 9):** domestic and believable — a bowl on a sill, in the right-hand gutter of the window band, sized `clamp(84px, 11vw, 128px)`. It occupies a margin, never a centre; it never dominates the region, and its scale is fixed within the registered state (never responsive to engagement).
- **Colour (§ 10):** only tones already in the house — warm oatmeal ceramic (the oak/linen family), the orchard's living red-green on the fruit (bright but never garish), the muted greens of the leaf. Warm, natural, low-saturation. Colour encodes nothing — no status, no season signal.
- **Lighting (§ 12):** lit by the **one morning, upper-left** (Blueprint § 7). Every highlight sits upper-left; the one soft contact shadow is short and falls to the lower-right, agreeing with every other shadow in the house. No light of its own, no studio key, no glow, bloom, or dramatic shadow.

## 6. Composition conformance (LHDC1 § 21.6 · § 13 · § 16)

- **Still, `aria-hidden`, empty `alt`, `pointer-events-none`, transparent, region-fitting** — the `orchard-backdrop.tsx` manner, applied at the mouth (`dressing-layer.tsx`). No `<title>`/`<desc>` on the SVG; nothing is announced to assistive technology.
- **Adds no region and no layout** — it composes inside the committed E2 window band the shell already owns (EXP3 § 5); the region exists whether or not the object renders, so admitting or retiring it causes **no layout shift** (§ 13, EXP3 § 9).
- **Never a framed card, panel, or tile** — a clean-edged transparent asset sitting on the sill, not a dashboard decoration.
- **Never covers absence** — it is the home's warmth *around* the household's honest state, never positioned to fill an empty-data surface (§ 13, LIVINGHOME2 § 6).

## 7. Placement statement (LHDC1 § 21.7 · § 17 · LIVINGHOME2 § 5.1)

- **Committed region:** `room-threshold-sill` — the sill at the foot of the E2 orchard-window band, in the right-hand gutter, **opposite the room's left-aligned title** so identity type and the home's warmth never contest space (EXP3 § 5.3).
- **Rendered in** (E2 rooms with a view, where a bowl on the windowsill reads unmistakably as the home's warmth): **Cookbook, Diary, Orchard/Community**.
- **Refused in:**
  - **Pantry / Larder** — LIVINGHOME2 § 5.1 produce law: a bowl of apples in the room whose subject is the household's stock would read as *your* pantry (ED3). Declared in `placement.refusedRooms` and enforced by `dressingChecks` D4/D6.
  - **Nutrition** — LHDC1 § 17 per-placement legibility: in the diet room a bowl of fruit could be read as dietary advice — a claim/coaching the layer must never make (ED3; GEA8, *rooms report, they do not counsel*).
- **No view, so never rendered** (an exposure fact the mouth owns, kept separate from the legibility refusals above): Planner, Shopping, Analyser, Household (E1) and Admin (E0) commit no E2 region, so the mouth renders nothing there — the E1/E0 zero-byte invariant holds.
- **Home (E3):** deliberately **not** dressed in this admission. Home's threshold is its signature greeting (*"the greeting in THA's hand"*), and EXP3 § 5.2 keeps Home's sill as architecture; the standing welcome is expressed in the rooms the household browses, leaving Home's arrival to its greeting. Recorded as a Home Owner restraint decision (§ 10).

## 8. With-and-without review (LHDC1 § 21.8 · § 18)

The review is reasoned against the six § 18 criteria from the composition and the governing standard. **A live Home Owner walk-through of the three rooms (Cookbook, Diary, Orchard) is the final visual confirmation** — this admission does not claim a rendered side-by-side was performed (the pass was authored non-interactively; the geometry, scale, palette, and light are type- and standard-decidable, and are staged for the walk-through in the manner of the prior Living Home passes).

1. **Warmth on subtraction** — *without*, the E2 sill is bare architecture; *with*, the household is quietly received at the threshold. The object adds felt hospitality (§ 3). ✅
2. **No loss of information or clarity** — the object carries zero information; it is `aria-hidden`, sits in the top window band above the content, and touches no text, control, or datum. *Without* loses nothing; *with* loses no legibility or calm. ✅
3. **Still one house** — same materials (ceramic, the house's apple), same hand, same one-morning light, same restraint and palette. *With* does not read as busier, richer, themed, or promotional. ✅
4. **Never a claim** — it could not be read as *THA knows this about us*: it is the home's bowl, refused in exactly the rooms (Pantry/Larder/Nutrition) where context could make it read as the household's data or advice. ✅
5. **Coherent with the register** — it is the register's first object and sets the one hand every later object (LH2) is judged against; it is drawn in the same medium and palette as the orchard and the future Living Details. ✅
6. **Quiet under repetition** — matte, small, in the gutter, below the emphasis budget; nothing about it demands attention, tires, or reads as a gimmick on the hundredth viewing. ✅

## 9. Rejection-criteria clearance (LHDC1 § 21.9 · § 19)

The object trips **none** of § 19: not glossy/wet/lacquered (§ 6 matte); not synthetic/plastic/machined (§ 5 natural); not stock-photographic (§ 8); not cartoon/flat-app-illustration/gamified (§ 8 — muted, low-saturation, hand-drawn); no un-owned or high-saturation/brand-pop colour (§ 10); no light of its own / studio / glow / dramatic shadow (§ 12); not showroom-new nor damaged/performed-shabby (§ 11); not out of scale and never contests a room's centre (§ 9/§ 17); not a framed card/tile/dashboard decoration (§ 13); does not animate/transition/perform a seasonal change (§ 13/§ 15 — it is still and `year-round`); not themed / not a seasonal pack / not a channel (§ 14, ED11); not a claim about the household (ED3); adds felt warmth on subtraction (§ 18.1); coherent with the register (§ 8/§ 18.5); not fabricated household activity (§ 19 last — it is the home's bowl, not a half-used plate implying the household did something).

## 10. Home Owner approval, recorded (LHDC1 § 21.10 · § 20 · HOMEOWNER1)

- **Approved by:** Colin Clapson, the Home Owner (`HOMEOWNER1`), on **2026-07-22**, through the LH1 — Standing Welcome implementation directive (the mission brief authorising the first admitted Living Home object). The Home Owner is the single approval authority the canon already names for every dressing object (LHDC1 § 20; HOMEOWNER1 § "Seasonal dressing approval · environmental dressing approval").
- **Medium approval (EXP3 Verdict 3 · LHDC1 § 8):** the Home Owner approves the **illustrated track** for this admission and it is recorded here, at the first admission that uses it — a single, named, still illustration in Calm Orchard's palette, warm, simple, unhurried, held to § 8's quality standard. This approval is scoped to this object; the illustrated track's admission does not, of itself, admit the next object (each object is admitted on its own evidence).
- **Restraint decisions recorded:** (a) Home (E3) is left undressed, its greeting kept as its ornament (§ 7); (b) the object is refused in Nutrition on legibility grounds (§ 7); (c) exactly one object is admitted — the year turns by admitting further items one at a time (LH2), never as a batch (ED10).
- **Authority exercised through the standard, never around it** (HOMEOWNER1): this admission meets every LHDC1 gate; approval passes nothing a gate fails.

## 11. Checksum and register discipline (LHDC1 § 21.11 · EXP3 § 4.4)

- The **item checksum** (`d3e66b75…`) is the sha256 of the still asset's bytes; the **register checksum** (`75aef6f8…`) is the sha256 over `canonicalizeItems(items)`. Both were recomputed in the same commit that admits the item.
- `verify:living-home-assets` enforces this: **D1** (register checksum), **D8** (the asset's bytes hash to the item checksum). The rendered object cannot drift without both checksums changing in the same commit — the deliberate, reviewable act EXP3 § 4.4 requires.

---

*The house never changes: that is its gift. Between it and the household's true life, the home now keeps one bowl of apples on the sill — warm, matte, hand-thrown, lit by the one morning, claiming nothing — meaning only: you are welcome here, in every season of the year.*
