# Admission — Spring flowers

**Object id:** `spring-flowers` · **Register:** Environmental Dressing (LIVINGHOME2 § 10.3) · **Workstream:** LH2 — First Seasonal Collection (Spring)
**Admitted against:** `LHDC1` (object-level visual/material admission standard) and `LIVINGHOME2` (ED1–ED12, § 5, § 5.1).
**Asset:** `client/src/assets/living-home/dressing/spring-flowers.svg` · **Date:** 2026-07-22 · **Home Owner:** Colin Clapson

> Companion to `standing-welcome-bowl-of-apples.admission.md` (the register's first admission, which sets the one hand every object here is judged against). Shared conventions are cited, not repeated.

## 1. Identity
Register row `SPRING_FLOWERS` in `dressing-register.ts`. **Season key:** `spring` (Domain 11). **Celebration binding:** none. **Item checksum (asset bytes):** `d85f00fba9254ac682e4dfc02176d0868f6092b5cb1fbabe4a919826468ac405`. Register checksum recomputed in the same commit (§11).

## 2. Named hospitality purpose (ED8 · LHDC1 §3)
**Spring's welcome.** A jug of the season's first flowers set out on the sill, so the home feels the year turning green before the household says a word. The hospitality is *welcome* + *the year's passage*. Subtraction test: without it the spring sill is bare; with it the home has quietly noticed the season. *"It looks nice"* is refused; the purpose is the home marking the turn of the year for a household that carries it.

## 3. Material and craft (LHDC1 §5–§7, §11)
Only the house's materials: a **hand-thrown ceramic jug** (handmade-ceramics, `TRANSLATION1` §4) of simple flowers. Matte, low-sheen (§6); hand-drawn, not manufactured (§7); softened, lived-with, never showroom-new (§11). No new material vocabulary.

## 4. Medium conformance (LHDC1 §8 · EXP3 Verdict 3)
Illustrated track (Home Owner approval recorded, §10) — one still SVG in Calm Orchard's hand. Not stock-photographic, not cartoon/gamified, never a claim (the blooms are illustrative, not a household's real bouquet). Coherent with the register's one hand (same jug, palette, and light as the bowl of apples). Colour baked into the asset in the NORTH2 manner.

## 5. Scale, colour, lighting (LHDC1 §9, §10, §12)
Domestic scale (a jug on a sill), in the right gutter, `clamp(84px,11vw,128px)`. Colour: warm oatmeal ceramic, the orchard's living greens on the stems, soft muted blooms — bright but never garish, low-saturation (§10). Lit by the one morning, upper-left; soft short contact shadow to the lower-right; no light of its own (§12).

## 6. Composition (LHDC1 §13, §16)
Still, `aria-hidden`, empty `alt`, `pointer-events-none`, transparent, region-fitting; no `<title>`/`<desc>`; adds no region and no layout (composes in the committed E2 band, no layout shift); never covers absence.

## 7. Placement (LHDC1 §17 · LIVINGHOME2 §5.1)
Region `room-threshold-sill`. **Rendered in** Cookbook, Diary, Orchard (`onlyRooms`) — the browsing sills, the home in bloom, where flowers read as home warmth. **Refused** in the no-view rooms (no E2 region) and, being confined by `onlyRooms`, in Pantry/Larder/Nutrition. Flowers carry no §5.1 "kind" (not produce/book/meal), but the allow-list keeps them to the browsing rooms so a sill holds one object. In spring these three sills show flowers instead of the year-round apples (the season takes the sill — `resolveRoomDressing`).

## 8. With-and-without review (LHDC1 §18)
Reasoned against the six criteria; the live side-by-side is staged for the Home Owner walk-through (as LH1 §8). (1) Warmth on subtraction ✅ — the spring sill is cooler without it. (2) No loss of clarity ✅ — `aria-hidden`, in the top band, touches no content. (3) Still one house ✅ — same jug, hand, light, palette. (4) Never a claim ✅ — not the household's bouquet. (5) Coherent with the register ✅ — one hand with the bowl. (6) Quiet under repetition ✅ — muted, small, in the gutter.

## 9. Rejection-criteria clearance (LHDC1 §19)
Trips none: matte (§6); natural materials (§5); not stock/cartoon/gamified (§8); muted owned palette (§10); one-morning light, no glow (§12); lived-with not new/damaged (§11); domestic scale, never contests the centre (§9/§17); not a card/tile (§13); still, no transition (§13/§15); not themed/a pack/a channel (§14); not a claim (ED3); adds warmth on subtraction (§18.1); coherent (§18.5); not fabricated household activity (§19).

## 10. Home Owner approval, recorded (LHDC1 §20 · HOMEOWNER1)
Approved by **Colin Clapson (Home Owner), 2026-07-22**, through the LH2 — First Seasonal Collection directive. **Medium:** illustrated track, under the approval recorded at the first admission (LH1 §10) and reaffirmed here for this object. Authority exercised through the standard, never around it; approval passes nothing a gate fails.

## 11. Checksum & register discipline (LHDC1 §21.11 · EXP3 §4.4)
Item checksum `d85f00fb…` = sha256 of the asset bytes; register checksum `359ea780…` = sha256 over `canonicalizeItems(items)`; both recomputed in the admitting commit. Enforced by `verify:living-home-assets` D1 (register) and D8 (asset byte-lock).
