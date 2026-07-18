# Session: ARRIVAL1_Definitive_Home

| Field | Value |
|---|---|
| **Session ID** | `ARRIVAL1_Definitive_Home` |
| **Rollback ID** | `rollback/ARRIVAL1-definitive-home-20260717` → `10573dd2` |
| **WIP snapshot** | tag `arrival1-wip-snapshot-10573dd2` |
| **Start time** | 2026-07-17 |
| **Current stage** | Awaiting review — implemented & verified |

## Objective
Implement the **definitive** THA Home from NORTH5's chosen direction: the **archway**, the
**orchard material palette**, and the **wall → furniture → floor** composition (V2's orchard
connection · V1's calm restraint · V3's oak materiality). Keep the archway, one continuous plaster
wall, a bounded oak console/sideboard, a visible stone floor, the orchard beyond the arch, and every
existing Home data source / hook / route / API / behaviour and state. No orchard banner over a
dashboard, no horizontal colour bands, no full-width oak, no duplicate state, no fabricated content.

## Scope decisions (recorded before building)
1. **Governance FIRST.** The arch is a drawn frame; Blueprint § 6.2 fixes Home at E3 and puts
   *"framed by composition, never by a drawn frame"* on E2. Smallest explicit amendment: a new
   § 6.2 rule admitting a **plaster architectural aperture (the arch)** for Home's E3, distinguishing
   an *opening in the wall* from the *decorative picture-frame* the clause forbids. Done before code.
2. **Asset.** Use the real `ORCHARD.png` (apple orchard, blossom, oak gate — what the blossom
   threshold needs) converted to a served `orchard.webp` via ImageMagick (`sharp`/`cwebp` absent;
   `convert`/`ffmpeg` present). The old meadow `orchard-bg.webp` is left byte-untouched for arrival +
   the 5 dialog surfaces (out of Home's scope). Two-orchards tension logged as an honest gap.
3. **Palette scope.** Use the orchard **material** palette for Home's wall (plaster) / floor (stone) /
   furniture (oak) / info surfaces (ivory) — the bulk of what "orchard palette" means visually. The
   global `--primary` hue-132 → orchard-green swap (NORTH4 D1) is platform-wide and stays the owner's
   decision — deliberately NOT taken here, to honour "no unrelated refactoring / changes meaning: no".
   New Home-scoped tokens; shared tokens other rooms depend on left alone.

## Next action
None — complete; awaiting review. Report: `docs/implementation/ARRIVAL1_DEFINITIVE_HOME.md`.

## Outcome
`/home` re-composed as a room: **archway · continuous plaster wall · bounded oak console · stone
floor**, wall → furniture → floor. Governance amendment made FIRST (Blueprint § 6.2 rule 4 — the arch
is an architectural aperture, not the decorative drawn frame E2 forbids; Home only). The real orchard
(`ORCHARD.png` → served `/orchard.webp`, 3.1MB → 393KB) is seen through the arch with blossom crossing
the reveal; the day's three facts rest as ivory objects on lit oak; the doors sit on the stone floor.
All data/hooks/routes/APIs/behaviour and every state (populated · unanchored · loading · error)
preserved. Orchard materials Home-scoped — no other room changes; global `--primary` untouched.
Verified across desktop/tablet/mobile in every state (renders in `docs/ui-audit/arrival1-home/`).
HOME2 resolver test 47/47; build clean; adoption 80·2 (both failures pre-existing/sibling, provably
not mine — 0 raw `<button>` added, orphan is a sibling file).

## Product changed
`client/src/pages/home-experience-page.tsx`, `client/src/index.css`,
`client/src/components/layout/orchard-backdrop.tsx`; new asset `client/public/orchard.webp`; Blueprint
§ 6.2 amendment; `adoption-register.json` orchard-environment entry; verification harness +
screenshots. **No** server/`shared`/API/schema/migration change. Rollback branch + tag at HEAD.
