# ODL2 — the §4 vocabulary, rendering from tokens

Captured 2026-07-17, live, at 1440×900 and 390×844, via
`scripts/capture-exp4-materiality-depth.ts` against the DEV world household.

These are `pages/dev/material-a-warm-layers.tsx` — EXP4 Study A, the winning
study — **after** its material was migrated off inline arbitrary utilities onto
the semantic tokens UIA §4 admitted. They exist to prove one claim: that the
migration changed where the numbers live and nothing else.

## Why these are here and not in `../exp4-materiality-depth/`

Running the capture overwrote EXP4's own July-15 evidence. That evidence is
EXP4's, not ODL2's — a report's screenshots are the state of the world on the
day it reported, and rewriting them makes the report lie about itself. The
originals were restored (`git checkout`), and ODL2's verification lives here.

## Read them against the July-15 originals with one difference in mind

**The orchard is gone from the composed shots, and that is not a regression.**
CONV1-P3 (BEH-7) retired the global orchard wallpaper from every room *after*
EXP4 captured its evidence. Rooms now stand on the warm canvas — the Blueprint's
own E1 — and Study A is a room. Home's E3 open view is a declared gap, not a
silent one, and it stays declared until the North Star workstream builds it.

So compare the **material**, not the backdrop: the ground plane, the warm
single-directional shadows, the rim of light along each top edge, the primary
standing in the light and the support waiting in the penumbra. Those are
unchanged, which is the whole point.

| File | What it shows |
|---|---|
| `tokenised-desktop-01-composed.png` | The room: one ground, primary card, two support cards |
| `tokenised-05-detail-primary.png` | The primary surface — warm rim, warm shadow, solid white |
| `tokenised-06-detail-support.png` | The support tier — anchored on the ground, never naked ink |
| `tokenised-desktop-0{2,3,4}-*.png` | The hand: hover lifts into the light, press settles, focus rings |
| `tokenised-mobile-*.png` | The same material at 390×844 |

## What this capture caught

Tokenising Study A silently broke every shadow, and only a picture found it.
`shadow-[var(--shadow-primary)]` compiles to `--tw-shadow-color` — Tailwind
cannot tell a colour from a box-shadow inside a `var()`, and guesses colour, so
the surfaces rendered flat. The fix is the explicit type hint,
`shadow-[shadow:var(--shadow-primary)]`. The compiled CSS is the proof
(`--tw-shadow: var(--shadow-primary)` feeding `box-shadow`), but the reason
anyone went looking was that a claim with no picture attached is a claim nobody
checked — EXP4's rule, and it earned its keep here.
