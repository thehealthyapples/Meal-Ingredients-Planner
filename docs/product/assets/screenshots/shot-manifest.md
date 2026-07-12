---
entry: shot-manifest
name: Screenshot baseline manifest
section: screenshots
status: hidden
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Screenshot baseline manifest

> The canonical screenshot of every household- and public-facing surface,
> captured against a live demo household, plus the script and manifest that
> reproduce them. Admin and developer surfaces are not yet captured.

## What it is

The Product Knowledge Registry's screenshot library (PKR §24). It holds one
canonical image per household- and public-facing surface — eighteen in all —
each the definitive picture of that surface (Rule PKR10: one owner per
screenshot), captured at a mobile viewport against a live dev server and a real,
seeded demo household. Nothing here is mocked.

Two documents make the baseline reproducible rather than a one-off:
`README.md` (how it was captured and what it covers) and `manifest.json` (the
machine-readable record of each surface, its route, its auth tier, and the HTTP
status it returned when captured).

## Where it lives

| | |
|---|---|
| Images + manifest | `docs/product/assets/screenshots/` |
| Reproducer | `scripts/capture-product-screenshots.ts` |
| Human manifest | `docs/product/assets/screenshots/README.md` |
| Machine manifest | `docs/product/assets/screenshots/manifest.json` |

## Evidence

18 surfaces captured by PDA1 on 2026-07-11 — every public and household route,
including the two hidden-but-URL-reachable surfaces (`/supermarkets`,
`/quick-meal`). The inherited registry claim that no browser could run in this
environment was **false**: chromium runs once the Nix-store shared libraries are
placed on `LD_LIBRARY_PATH` (excluding the glibc core). The capture script is the
standing proof.

## Known defects

- `fnd-no-screenshot-baseline` — the baseline covers the household and public
  tiers, but **admin and developer surfaces are not yet captured** (they require
  an admin session). The finding is retained to track that residual gap, not the
  original "no baseline at all". See PDA1.

## Related

The library is the asset backing every surface entry in the Pages, Domains and
Hidden Experiences sections; each captured surface's entry links to its image.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
