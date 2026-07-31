# Living Larder — Hospitality Pass 01

**Date:** 2026-07-31
**Risk:** 🟢 GREEN — Living Home implementation refinement (interior-design pass).
**Authoritative branch:** `feat/living-larder-authoritative`
**Rollback identifier:** `rollback/larder-hospitality-pass-base` → `4affaeb7`
**Scope:** Assemble the most beautiful, calm, hospitable Living Larder from existing **approved** assets only. No generation, no new assets, no placeholders, no invented furniture, no redesign. No push/merge/deploy.

## Architecture compliance

| Claim | Status | Evidence |
|---|---|---|
| One canonical Living Larder | **Verified** | Single branch `feat/living-larder-authoritative`. |
| One canonical asset owner | **Verified** | ASSET1 spec + Life Register § J + House Register; no rival owner. |
| One Life Register | **Verified** | `living-details-manifest.ts` § J — untouched. |
| No duplicated workflows | **Verified** | No pipeline/AI platform added; deterministic PIL composition of existing assets. |
| No duplicated room implementation | **Verified** | `larder-room.tsx` unchanged; this is a presentation artefact under `docs/`, not a second room, not runtime. |
| Existing architecture extended | **Verified** | Composition honours LARDER1 North Star, LHDC1 admission standard, IMGDIR1 (photoreal, no CSS/flat), the D-017/D-018 room-first contract and the Visual Acceptance Gate. |
| No duplicate asset state | **Verified** | No asset bytes/checksums/records changed (git shows docs-only). |

Read and complied with: ASSET1, LARDER1, LHDC1, IMGDIR1, `LIVING_LARDER_VISUAL_ACCEPTANCE_DECISIONS.md`, `NORTH_STAR_VISUAL_ACCEPTANCE_GATE`.

## Design decisions

The room is now the product. It is composed as a real household larder wall, front-on furniture plane, warm morning light from the orchard side:

- **A grounded worktop as the still point** — the oak preparation-table sits on the floor, centre-left, holding provisions in use (the chia jar) beside fresh produce (apple, broccoli). A room you *use*, not a display case.
- **Two floating oak shelves above** carry the dry stores in a legible hierarchy — **grains** grouped on the upper shelf (rolled oats, white rice, brown rice), **baking & pasta** on the lower (plain flour, sugar, white penne).
- **A tall oak cupboard anchors the right** — furniture mass and asymmetric balance, enclosed keeping beside the open provisions. The eye reads left-to-right: displayed stores → worktop → cupboard.
- **Honest empty space** — the shelves breathe (three jars on a wide plank, never crammed); the plaster wall carries calm negative space. Nothing is faked to fill a gap.

## Composition refinements (from the prior asset-validation review)

- **Shelf composition / hierarchy:** grouped by use (grains / baking), not a random row.
- **Spacing / negative space:** generous, even breathing room; no crowding.
- **Scale:** jars, worktop, shelves and cupboard sit at believable relative proportions (North Star sizes); each jar's true base measured from its alpha and **seated on the plank**, never floated.
- **Balance / visual rhythm:** left provisions weighted against the right cupboard; varied jar contents (pale grains, white flour/sugar, golden pasta, dark chia) give gentle rhythm.
- **Lighting / materials:** warm chalky plaster, directional morning light pooled from the right, soft **contact shadows** under each vessel and **floor/wall shadows** under furniture — real oak grain and clear glass read honestly.

## Hospitality refinements

- **Removed everything technical:** no titles, captions, labels, callouts, contact-sheet framing or annotation on the room image — the artefact is a room, not a board.
- **Removed the floating-PNG feel:** every object is grounded with a shadow.
- **Removed sterility:** fresh produce in use on the worktop; warmth and light rather than a neutral catalogue.
- **Added nothing unapproved:** only approved jars, produce and joinery; the six chalk-labelled jars keep their honest blank labels (no invented wording).

Review questions — assessed: peaceful ✓ · enjoyable to spend time in ✓ · recognisable as a beautiful family pantry (oak + glass, deVOL/Neptune sensibility) ✓ · invites interaction (jars to reach, produce to take) ✓ · quietly makes you smile (morning light, fresh apple) ✓.

**Artefacts** (`docs/implementation/assets/larder-room-review/`): `larder-room-experience-desktop.png`, `larder-room-experience-mobile.png` — review compositions of approved assets, not production assets, not registered, never runtime. The prior asset-validation sheets and the stale annotated-gaps image are removed.

## Validation

`npx tsx scripts/ci/verify-living-home-assets.ts` — result identical to before:
- **Every jar/room/produce/joinery check PASSES** (J1–J6, J8–J11; P1–P3; K1–K2; placement exclusions).
- No new generated assets · no changed approved assets · no checksum changes · Life Register unchanged · no duplicate state · no runtime regression (git confirms docs-only).
- The 5 reported failures are unchanged and out of scope: 4 Windows path-separator artifacts (Linux CI passes; local normalization → 30/31) and 1 pre-existing dressing byte-lock gap (D8). A live `/pantry` render was not possible here (no node_modules/DB/auth — CAPBOUND1 environment boundary); no screenshot faked; visual acceptance remains the Home Owner's.

## Gap audit (prioritised — establishes the next production batches; NO generation performed)

### Required for Launch
1. **Approve the 20 candidate staple jars** — the assets already exist (files + checksums recorded); they need a checksum-bound **Home Owner approval, not generation**. This alone fills the shelves with the household's real staples.
2. **Photoreal room shell / backdrop** — the enclosing room (warm plaster walls, the orchard aperture and its light, floor). Today it is a plaster fill; the North Star room itself is the one genuinely missing structural asset. *Generation required (named batch).*

### Strong Improvement
3. **Produce basket** — to hold fruit & veg properly (the "most alive" object); currently produce sits loose on the worktop.
4. **A few more everyday produce items** (orange, carrot, onion, lemon, tomato) — to fill a basket credibly and read as abundance.
5. **A tin / bread bin** — everyday larder staples the jars don't cover.

### Future Hospitality
6. Oil & vinegar bottles; small spice jar (to use the spice rack).
7. Ceramic crocks / a fruit bowl.
8. Herb pot; pendant / under-shelf lighting; wall hooks + linen cloth.

### Optional Seasonal Dressing
9. The six dressing SVGs (spring flowers, summer fruit, autumn pumpkins/blanket, winter evergreens) — present; need checksum byte-lock and season-gating (Dressing register ED2/LH1).
10. Christmas wreath — the one occasion-gated dressing (requires a declared occasion + permission).

## Definition of Done

- [x] The Larder is reviewed as a place someone would enjoy opening every day.
- [x] Existing assets used to their fullest — worktop, two shelves, cupboard, 7 jars, 2 produce, composed as a real room.
- [x] No new imagery generated; no production asset modified.
- [x] The remaining asset list represents genuine gaps only, prioritised into four batches.
- [x] Validation run; no changed assets/checksums, no duplicate state, no regression.
- [x] Committed as one implementation; not pushed/merged/deployed.
- [x] Next OpenAI batch blocked pending Home Owner approval of **both** the room and the prioritised missing-asset list.

## Rollback identifier

`rollback/larder-hospitality-pass-base` → `4affaeb7`. `git reset --hard` there, or delete the review artefacts, fully reverts. Zero production-asset/register/code change means nothing else can regress.
