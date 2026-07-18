# Run — HOME_EMOTIONAL_INTERIOR_DESIGN

| | |
|---|---|
| **Session** | `HOME_EMOTIONAL_INTERIOR_DESIGN` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `home-emotional-interior-design-rollback-20260717` → `7bfad50c` |
| **Status** | **COMPLETE.** Awaiting owner decision. |
| **Product changed** | **None by this session.** Standalone mockup only; `home-experience-page.tsx` / `index.css` not opened; `ORCHARD.png` referenced in place, no substitute authored. |

## Mission
Evolve the **interior feeling** of NORTH4 Concept B **without changing its architecture**. Not an
architect — an interior designer. Make the house feel *loved* through tiny details that read as accumulated
over years, never staged, never "interior design." Reduce interface density; let the interface disappear
into the home. Produce 6 emotional interior studies (desktop + mobile each) + a recommendation. Definition
of Done: the owner stops thinking about software and simply feels *"I'm home."*

## What was done
- Confirmed git status; created rollback tag `home-emotional-interior-design-rollback-20260717` → `7bfad50c`.
- Re-read `docs/architecture/README.md`, `BRAND1_ARCHITECTURAL_BRANDING`, `NORTH4_HOME_CONCEPT_EXPLORATION`,
  `NORTH4_CONCEPT_B_EVOLUTION`.
- Built `scripts/north4-concepts/concept-b-interior.html` — one file, `?study=1..6`, the **identical**
  Concept B architecture with only the interior language changing (verified glass geometry invariant).
- Built `scripts/north4-concepts/render-interior.ts` — 6 studies × desktop+mobile, with an
  architecture-invariance + collision check.
- Rendered 18 images to `docs/ui-audit/home-emotional-interior/`. Fraunces loaded (real serif). 12/12 clear.
- Wrote report `docs/implementation/HOME_EMOTIONAL_INTERIOR_DESIGN.md`.

## The six studies (a deliberate spectrum: restrained → furnished)
1. **The Kept House** — patina, aged oak, grained plaster, worn sill, Companion dissolved into wall. No object.
2. **The Warm Hour** — the room's received light warmed a half-step; soft mullion shadows. No object.
3. **The Linen Calm** — matte chalky plaster + one folded linen runner.
4. **The Morning Table** — a bowl of orchard apples on the sill. *(reads as clip-art / staged)*
5. **The Gardener's Sill** — a blossom stem in a jug. *(reads as a smudge; blossom pokes onto the glass — breaks "nothing on the orchard")*
6. **The Family Record** — a child's drawing + a photo. *(fabricates a family the platform doesn't know — Core Principle 6)*

## Key finding & recommendation
**Feeling rises as objects fall.** The studies that add nothing (1,2,3) feel lived-in; the studies that
furnish the thin sill (4,5,6) read as *staged* — the brief's named enemy — and one breaks *nothing on the
glass*. **Recommend The Kept House (1)**, warmed by The Warm Hour (2) + one grain of The Linen Calm's matte
plaster (3). Objects of 4–6 rejected **as drawn**; their instincts held: the orchard's season carried by the
Companion's word (not a vase), and *memory* carried by the household's own real data over time (not invented
props). The finest interior move here was to take things *out* until only the home was left.

## Tooling (next session will hit this)
Chromium won't launch: `libglib-2.0.so.0` missing. Curate a lib dir from
`/nix/store/995nd0yj67pshcgyyi4v3drxvdizxmcp-ytmdesktop-1.13.0-usr-target/lib` — symlink every `*.so*`
**except** glibc's own (libc/libm/libpthread/libdl/librt/ld-linux/libgcc_s/libstdc++/libresolv/libutil)
**and except** libcrypto/libssl/libz (shadow node's OpenSSL → `OPENSSL_3.4.0 not found`). Then
`LD_LIBRARY_PATH=<dir> npx tsx scripts/north4-concepts/render-interior.ts`. Google Fonts reachable → Fraunces loads.

## Artifacts
| Path | What |
|---|---|
| `docs/implementation/HOME_EMOTIONAL_INTERIOR_DESIGN.md` | **The report** |
| `scripts/north4-concepts/concept-b-interior.html` | 6 interior languages, one unchanged room |
| `scripts/north4-concepts/render-interior.ts` | Renderer + architecture-invariance/collision check |
| `docs/ui-audit/home-emotional-interior/` | 18 renders |

## Next action
**Awaiting owner decision.** The Kept House (+ Warm Hour, matte plaster) is ready to become Home's permanent
emotional identity. No product code involved; nothing to revert. To discard: delete `concept-b-interior.html`,
`render-interior.ts`, the report and `docs/ui-audit/home-emotional-interior/`.
