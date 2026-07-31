# Living Larder — Review Experience Refinement

**Date:** 2026-07-31
**Risk:** 🟢 GREEN — review & validation refinement only.
**Authoritative branch:** `feat/living-larder-authoritative`
**Rollback identifier:** `rollback/larder-review-experience-base` → `689a8c23`
**Scope:** Evolve the Home Owner review from *asset validation* to *experience validation*. No asset generation. No redesign. No production-asset change. No push/merge/deploy.

## Architecture compliance (claim status)

| Claim | Status | Evidence |
|---|---|---|
| One canonical Living Larder | **Verified** | Single branch `feat/living-larder-authoritative`; reconciliation `LIVING_LARDER_RECONCILIATION.md`. |
| One canonical asset owner | **Verified** | ASSET1 (spec custody / Home Owner aesthetic) + Life Register § J + House Register; no rival owner introduced. |
| One Life Register | **Verified** | `client/src/components/layout/living-details-manifest.ts` § J — untouched this task. |
| No duplicate imagery workflow | **Verified** | No pipeline added; flat imagery already deprecated (IMGDIR1); only existing approved PNGs composed. |
| No duplicate room implementation | **Verified** | The existing `larder-room.tsx` (the one mouth) is unchanged; the review render is a **presentation artefact under `docs/`**, not a second room and not runtime. |
| Existing architecture extended | **Verified** | Review artefacts honour LARDER1 North Star, LHDC1 admission standard, the D-017/D-018 room-first contract and the Visual Acceptance Gate. |
| No additional AI platform | **Verified** | Zero OpenAI/API calls; the compositions are deterministic PIL layouts of existing assets. |
| No duplicate asset state | **Verified** | No asset bytes, checksums, register records or verifier changed (git shows docs-only). |

Governing sources read and complied with: ASSET1, LARDER1, LHDC1, IMGDIR1, D-017, D-018, `LIVING_LARDER_VISUAL_ACCEPTANCE_DECISIONS.md`, `NORTH_STAR_VISUAL_ACCEPTANCE_GATE`.

## Review methodology — the change

**Before:** review artefacts were asset-validation sheets — isolated shelves, floating jars, a jar contact sheet. Technically useful, but they asked the Home Owner to approve *individual PNGs*, not the product.

**Now:** the review artefact represents the **Living Larder as a room**. Method:
- The oak floating-shelf master's plank top-surface line was measured from its own alpha (y ≈ 0.41 of the canvas) so jars are **seated on the shelf**, not floated.
- Each jar's true opaque base is measured and aligned to the shelf surface; a soft **contact shadow** grounds it.
- A **warm chalky-plaster backdrop** with **directional morning light from the right** (the orchard aperture) and shelves casting soft **wall shadows** — realistic environmental lighting.
- **Front-on furniture-plane camera**, realistic scale (North Star jar/shelf proportions), calm natural spacing, honest empty space.
- No labels on the provisions, no sprite-sheet framing. The room reads calm, crafted, lived-in, welcoming.

The old asset-validation sheets are **removed** (`larder-room-desktop-review.png`, `larder-room-mobile-review.png`, `approved-jars-contact.png`) so they cannot be mistaken for the Home Owner review.

**Artefacts produced** (`docs/implementation/assets/larder-room-review/`):
- `larder-room-experience-desktop.png` — the room, clean.
- `larder-room-experience-desktop-gaps.png` — the same room with subtle, category-coded gap callouts placed in the empty space.
- `larder-room-experience-mobile.png` — the same room, narrower view.

These are **review compositions** of existing approved assets — not production assets, not registered, never referenced at runtime.

## Existing assets used (approved only)

- **Joinery:** floating-shelf oak wide (×3 placements).
- **Approved jars (7):** rolled-oats, white-rice, brown-rice, white-penne, plain-flour, sugar, chia-seeds.
- **Produce (2):** apple-red, broccoli.

No candidate/planned jar was shown (they remain honest gaps); no asset was faked, substituted, CSS-approximated, or regenerated.

## Honest gaps (shown as the room would actually appear)

Empty places are left empty — calm, not broken — and identified by category (also on the annotated artefact):

- **Required for Launch:** the 20 unapproved staple jars (assets **exist as candidates — need Home Owner approval, not generation**); a photoreal room shell/backdrop (genuinely missing).
- **Optional:** small spice jar, oil/vinegar bottles, produce basket, ceramic crocks.
- **Seasonal:** the six dressing SVGs (spring flowers, summer fruit, autumn pumpkins/blanket, winter evergreens) — present but not yet byte-locked.
- **Future Hospitality:** herb pot, pendant/under-shelf lighting, wall hooks, linen, wider produce range.

Full breakdown: `LIVING_LARDER_EXISTING_ASSET_ASSEMBLY_AND_GAP_AUDIT.md`.

## Validation

`npx tsx scripts/ci/verify-living-home-assets.ts` — identical result to before this task:
- **Every jar/room/produce/joinery check PASSES:** J1–J6, J8–J11; P1–P3; K1–K2; placement exclusions.
- Existing assets unchanged; existing checksums unchanged (J6 pass); Life Register unchanged; no duplicate state; **no new production/generated assets**.
- The 5 reported failures are unchanged and unrelated to this task: 4 are Windows path-separator artifacts (the verifier compares `/` constants to `\` paths — flags the declared mouth itself; a reverted local normalization yields 30/31; the Linux CI passes), and 1 is the pre-existing dressing byte-lock gap (D8). No regression introduced (git confirms docs-only changes).

## Trust check

**Highest-risk remaining claim — Inferred:** that this composition faithfully represents the *running* room. It uses the real approved assets, the measured shelf surface, real contact shadows and North Star lighting, but it is **not** the app's live cm-metrics render (a live `/pantry` needs `node_modules` + DB + auth absent here — a CAPBOUND1 environment boundary, honestly disclosed, no screenshot faked). The definitive spatial composition and **all visual acceptance** remain the Home Owner's, on the running room. This artefact asks only: *does this feel like a Living Larder someone would enjoy spending time in?*

## Definition of Done

- [x] Review evolved from asset validation to experience validation.
- [x] The Larder is reviewed as a room, not a collection of assets.
- [x] Future reviews represent the room as users will experience it (old validation sheets removed).
- [x] No new imagery generated; no production asset modified.
- [x] Validation run; existing assets/checksums/Life Register unchanged; no regression.
- [x] Committed as one implementation; not pushed/merged/deployed.
- [x] Next OpenAI batch remains blocked pending Home Owner review of the *experience* and explicit approval of a **named** batch of genuinely missing assets.

## Rollback identifier

`rollback/larder-review-experience-base` → `689a8c23`. `git reset --hard` there, or delete the review artefacts, fully reverts. Zero production-asset/register/code change means nothing else can regress.
