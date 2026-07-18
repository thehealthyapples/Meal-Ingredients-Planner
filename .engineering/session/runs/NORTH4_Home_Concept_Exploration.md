# Session: NORTH4_Home_Concept_Exploration

| Field | Value |
|---|---|
| **Session ID** | `NORTH4_Home_Concept_Exploration` |
| **Rollback ID** | `rollback/NORTH4-home-concept-exploration-20260717` → `a9116faa` |
| **WIP snapshot** | tag `north4-wip-snapshot-a9116faa` |
| **Start time** | 2026-07-17 |
| **Current stage** | Waiting for User |

## Objective
**STOP implementing.** Discover the right composition for Home's arrival before another line of CSS.
Three fundamentally different entrance-hall concepts, palette derived directly from the new
`ORCHARD.png` brand asset, all architecture / governance / behaviour / APIs / component contracts
preserved. Everything visual open. Nothing implemented, by instruction.

## Outcome
**Three concepts, one measured finding that outranks all three, and two of the concepts are unlawful
as written.**

### The finding (§ 2 of the report)
Decoded all **1,573,538** pixels of `ORCHARD.png` and built a hue histogram of the 1,544,214 carrying
chroma:

- **94.37%** of the orchard's chroma is hue **30°–80°**.
- **0.01%** is hue **110°–140°** — the band `--primary: 132`, `--foreground: 120`, `--accent: 118`
  occupy.

**Home's three most load-bearing colours are drawn from a hue band that is, to a rounding error,
absent from the orchard.** Not taste — arithmetic. This is true of every room, not only Home, and
fixing it is a token change independent of which composition wins. `--secondary: 42 89% 61%` is the
only token already in the orchard's world.

### Derived, not invented
Palette sampled by k-means over the region each material actually occupies. Headlines:
**THA's white is `#fdf1da`, not `#ffffff`** (brightest honest surface, hue 39). **THA's shadow is
olive** (`#292708`, hue 56), never grey. **THA's green is hue 73** (`#39450d`, leaf-in-shade — the
only foliage not overwhelmed by the golden hour; three independent regions agree), **59° warmer than
the 132 it ships.** Governing rule recorded: *the artwork's hues are law, its saturations are not* —
transcribing `hsl(47 79% 44%)` onto a button yields **mustard**; hue transfers, S/L are re-derived
per surface because the screen supplies its own light.

### The three concepts — the orchard is *light* (A) / *the view* (B) / *a glimpse* (C)
- **A · The Quiet Entrance Hall** — vertical, symmetric; a lit aperture at the end of a hall, wall
  and floor meeting at a line, the lightfall widening toward the viewer. Best on **mobile**.
- **B · The Panoramic Living Room** — horizontal bands; orchard full-bleed at full opacity above an
  oak sill. Mullions + the sill are load-bearing **forever**: remove them and it is a hero banner.
- **C · The Modern Family Kitchen** — depth planes, asymmetric; oak counter at your waist, content as
  *objects* with contact shadows. **A landscape idea that does not survive portrait.**

### 🔴 Findings that are not mine to settle
1. **The Exposure Scale forbids A and C.** Blueprint § 6 fixes Home at **E3 "the open view" — Home
   only**, and E2 reads *"framed by composition, **never by a drawn frame**."* A's arch and C's
   glazing bars are drawn frames at E2 exposure. **Only B is lawful today.** Named tension: the
   mission says *think in architecture*, and architecture frames views with drawn frames — that is
   what a window is.
2. **The new orchard's sun is upper-RIGHT.** Measured luminance by ninth: top-left **91**, top-mid
   **161**, top-right **165**; flare at x≈93%, y≈26%. Blueprint § 7: *"the morning sun sits
   upper-left, **forever**."* NORTH3 found this on the old asset; the new one inherits it. **The crop
   is the compliance mechanism and each concept crops differently** — A puts the sun out of frame
   (§ 7 not engaged), B and C show it (breach). Three ways out, all the owner's: mirror the asset
   (but it is a brand asset with canonical ownership elsewhere — arguably authoring a variant),
   amend § 7, or keep composing by crop.
3. **The North Star's greeting is a serif; Home ships a marker pen** (Caveat). Blueprint § 5.1 names
   Home's Living Detail as *"the greeting in THA's hand"* — the artwork and the Blueprint disagree,
   and have done since NORTH1. All three mockups follow the artwork; a font swap either way, no
   recomposition.
4. **🟢 The quiet day is the DEFAULT day, and it is the strongest argument for the room.** CONV1 P8:
   **192/195 households are `anchored: false` forever.** A dashboard of zeroes reads *broken*; a hall
   with nothing on the table reads *a quiet morning*. Evidence-based, not aesthetic. It lands hardest
   on B (Blueprint § 6: *"a full-strength landscape behind an empty room reads as nobody home"*).
   Every mockup renders the **empty** state, not a showreel state.

### Recommendation
**B**, for non-aesthetic reasons (only lawful concept; the only one doing what the mission asked;
nearest the North Star) — carrying **A's answer to the empty room**: on a genuinely quiet day, close
one level toward the room rather than show a full-strength landscape behind it (§ 6's *"open one
level"* rule, run in reverse). **Do not discard C** — warmest of the three, wrong aspect ratio for a
phone. **But the strongest move in the document is none of the three: it is the palette (D1).**

## Verification
- **Product source byte-untouched.** `git status` modified-list **identical to session start**
  (8 entries, all pre-existing from sibling sessions). No product code, no token, no document amended.
- **Canonical orchard asset byte-untouched** (`md5 c6d2def391243d587327391c7973cc30`), read in place;
  **no substitute authored** — NORTH3's owner ruling honoured.
- **PNG decoder proven, not trusted** — re-encoded the decode and looked at it; it is the orchard.
  (First-pass region *means* were discarded as mud: averaging sunlit grass with its own shadow
  stripes yields a colour present nowhere in the picture. Replaced with k-means + percentile triads.)
- **9/9 collision-clear** — programmatic check of greeting / action / Companion / facts 1 & 3 against
  the doors and the fold at every breakpoint.
- **4 of my own defects caught by measuring**: three vertical-rhythm collisions hidden behind
  absolutely-positioned layouts that cheerfully reported `page=844px (fits)`, and C's primary action
  rendered **invisible behind the doors** on mobile. `fits` is meaningless when nothing is in flow.
- Fraunces resolved and loaded — the serif in the renders is real, not a fallback.
- No migration. No gates run (no product code changed).

## Tooling note (the next session will hit this)
Chromium would not launch: `libglib-2.0.so.0` missing, and the nix `glib` derivations do not expose
it. Revived by curating a 64-bit library set:

```bash
SRC=/nix/store/995nd0yj67pshcgyyi4v3drxvdizxmcp-ytmdesktop-1.13.0-usr-target/lib
# symlink every *.so* EXCEPT glibc's own (libc/libm/libpthread/libdl/librt/ld-linux/
# libgcc_s/libstdc++/…) — including them segfaults every other binary on PATH.
LD_LIBRARY_PATH=<curated-dir> npx tsx scripts/north4-concepts/render.ts
```

The palette script needs no browser at all — it decodes the PNG with Node's `zlib` (IHDR → IDAT →
inflate → per-scanline unfilter), so it is dependency-free and reproducible anywhere.

## Artifacts
| Path | What |
|---|---|
| `docs/implementation/NORTH4_HOME_CONCEPT_EXPLORATION.md` | **The report** |
| `scripts/extract-orchard-palette.ts` | The measurement — pure Node, no image library, no browser |
| `scripts/north4-concepts/_palette.css` | The derived palette; every value beside its sampled source |
| `scripts/north4-concepts/concept-{a,b,c}.html` | The three mockups — standalone, nothing imports them |
| `scripts/north4-concepts/render.ts` | Renders 3 concepts × 3 breakpoints |
| `docs/ui-audit/north4-concepts/` | 15 renders |

## Next action
**Awaiting owner decision.** Five decisions block any build — **D1 the palette** (platform-wide;
`--primary` is every button in every room), **D2 the Exposure Scale** (amend Blueprint § 6 to admit a
drawn frame and a sub-E3 Home, or proceed with B alone), **D3 the sun**, **D4 the signature**,
**D5 which concept, if any**. See report § 11.

Nothing is implemented. Nothing needs reverting. To discard this session entirely: delete
`scripts/north4-concepts/`, `scripts/extract-orchard-palette.ts`,
`docs/ui-audit/north4-concepts/` and the report. No product code is involved.
