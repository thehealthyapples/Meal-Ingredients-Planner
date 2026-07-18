# Run — NORTH4_CONCEPT_B_EVOLUTION

| | |
|---|---|
| **Session** | `NORTH4_CONCEPT_B_EVOLUTION` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `north4-concept-b-evolution-wip-snapshot-7bfad50c` → `7bfad50c` |
| **Status** | **COMPLETE.** Awaiting owner decision. |
| **Product changed** | **None by this session.** Standalone mockup only; `home-experience-page.tsx` / `index.css` not opened here (any tree changes predate this session); `ORCHARD.png` referenced in place, no substitute authored. |

## Mission
Continue refining **NORTH4 Concept B** (*The Panoramic Living Room* — glass wall · oak sill · room below ·
doors) into the definitive Arrival. **No redesign, no new architectural idea** — polish the approved
direction so it is calmer, warmer, more premium and more emotionally memorable. Complete remaining renders,
documentation and recommendation.

## What was done
- Confirmed git status; verified rollback tag `north4-concept-b-evolution-wip-snapshot-7bfad50c` → `7bfad50c`.
- Re-read the Bootstrap (`docs/architecture/README.md`) and `BRAND1`, `HOME_FINAL_CONCEPTS`,
  `HOME_INTERIOR_ARCHITECTURE`, `HOME_ARRIVAL_REIMAGINED`, `NORTH4_HOME_CONCEPT_EXPLORATION`.
- Built `scripts/north4-concepts/concept-b-evolved.html` — the approved bands, polished across five named
  weaknesses (R1 quiet day · R2 window-as-architecture · R3 sun-by-crop · R4 warm wall not a second sun ·
  R5 generous mobile · R6 greeting as the one Living Detail). Two honest days driven by `?day=full|quiet`.
- Built `scripts/north4-concepts/render-b-evolution.ts` — 3 breakpoints × 2 days, `deviceScaleFactor 2`,
  with a programmatic collision check (nothing may cross the sill / overlap doors / fall through the fold).
- Rendered 10 images to `docs/ui-audit/north4-concept-b-evolution/`. Fraunces loaded (real serif).
- Wrote the report: `docs/implementation/NORTH4_CONCEPT_B_EVOLUTION.md`.

## Key findings / decisions
- **The quiet day is the whole game.** 192/195 households arrive unanchored (CONV1 P8). The refinement
  carries NORTH4 §10 literally: on a quiet day the window closes one level toward the room; the console
  says absences with dignity ("A clear morning / List is clear / Blossom this week"), not zeroes. The
  *view* never moves — only how much of it is opened — so "the same familiar view" holds.
- **1 self-defect caught by measuring:** full-desktop console overlapped the doors under the generous
  window (sill-y 452). Eased the full-day window (→398) and tightened console rhythm (48→40) until 6/6 clear.
- **Left open (owner's, not mine):** the §7 sun — mirror asset · amend §7 · keep cropping (NORTH4 D3).
  Kept composing by crop. Also independent & unresolved: D1 the Orchard Palette, D4 the signature.

## Tooling (the next session will hit this)
Chromium won't launch: `libglib-2.0.so.0` missing. Curate a lib dir from
`/nix/store/995nd0yj67pshcgyyi4v3drxvdizxmcp-ytmdesktop-1.13.0-usr-target/lib` by symlinking every `*.so*`
**except** glibc's own (libc/libm/libpthread/libdl/librt/ld-linux/libgcc_s/libstdc++/libresolv/libutil)
**and except** libcrypto/libssl/libz (they shadow node's OpenSSL → `OPENSSL_3.4.0 not found`, segfaults
`node`). Then: `LD_LIBRARY_PATH=<curated-dir> npx tsx scripts/north4-concepts/render-b-evolution.ts`.
Google Fonts is reachable in-sandbox, so Fraunces loads; DejaVu Serif is the honest fallback.

## Artifacts
| Path | What |
|---|---|
| `docs/implementation/NORTH4_CONCEPT_B_EVOLUTION.md` | **The report** |
| `scripts/north4-concepts/concept-b-evolved.html` | The evolved concept — standalone |
| `scripts/north4-concepts/render-b-evolution.ts` | Renderer — 3 breakpoints × 2 days + collision check |
| `docs/ui-audit/north4-concept-b-evolution/` | 10 renders |

## Next action
**Awaiting owner decision.** Composition is ready to adopt; three independent decisions sit above it —
**§7 sun** (D3), **the Orchard Palette** (D1, platform-wide), **the signature** (D4). None blocks the room.
To discard entirely: delete `concept-b-evolved.html`, `render-b-evolution.ts`, the report and
`docs/ui-audit/north4-concept-b-evolution/`. No product code is involved; nothing to revert.
