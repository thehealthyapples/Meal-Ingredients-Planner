# Living Larder jar masters — Home Owner review materials

**Produced by:** `LARDER_PRODUCTION_ASSET_GENERATION` (2026-07-23)
**Status of everything here: CANDIDATE. Nothing is approved.**

- `larder-jar-candidate-contact-sheet-20260723.png` — all 27 candidate jar
  masters together at equal scale (50%), for Home Owner visual review.
- `checksums-20260723.json` — sha256 of each candidate master at generation
  time (matches the candidate checksums recorded in the Life Register).

Approval is a separate, recorded act: a candidate becomes `approved` only when
a Home Owner visual approval **bound to its exact checksum** is recorded in the
Life Register (`living-details-manifest.ts` § J) — enforced by
`npm run verify:living-home-assets` (J-checks). Until then every asset stays
unavailable, out of runtime and out of exports. Rejection is equally first-class:
a refused candidate is recorded in the register's rejection history and its
replacement generated afresh.

The masters were generated deterministically by
`scripts/generate-larder-jar-masters.ts` — one parametric jar (the governed
shared spec) plus seeded per-family procedural contents, rasterised by Chromium
to 512×768 RGBA with genuine transparency. The medium is **procedural
illustration approaching realism**, not photography; whether it meets the
photorealistic production bar is exactly the judgement this review sheet exists
to put before the Home Owner.
